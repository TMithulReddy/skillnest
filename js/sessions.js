import { supabaseClient, requireAuth, getCurrentProfile, signOut, initOnlineTracking, getTotalUnreadCount } from './supabase.js';
import { showToast } from './utils.js';

// ─────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────

let currentUser = null;
let currentProfile = null;
let sessions = [];          // currently displayed sessions
let activeTab = 'upcoming';
let detailSessionId = null;  // session currently shown in detail modal

// Modal state
let meetLinkSessionId = null;
let ratingSessionId = null;
let selectedStars = 0;

// ─────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(n => n[0].toUpperCase()).join('');
}

function renderAvatar(fullName, avatarUrl, sizeClass = 'avatar-sm') {
  if (avatarUrl) {
    return `<span class="avatar ${sizeClass}"><img src="${avatarUrl}" alt="${fullName}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></span>`;
  }
  return `<span class="avatar ${sizeClass}">${getInitials(fullName)}</span>`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'TBD';
  return new Date(dateStr).toLocaleString('en-IN', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function hasSessionPassed(scheduledAt) {
  return scheduledAt ? new Date(scheduledAt) < new Date() : false;
}

const CATEGORY_BADGE_MAP = {
  tech: 'badge-tech',
  design: 'badge-design',
  music: 'badge-music',
  languages: 'badge-languages',
  academic: 'badge-academic',
  business: 'badge-business',
};
function categoryBadgeClass(cat) {
  return CATEGORY_BADGE_MAP[(cat || '').toLowerCase()] || 'badge-other';
}

const STATUS_LABELS = {
  pending:   'Awaiting Confirmation',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show:   'No Show',
};

// ─────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────

async function init() {
  // 1. Auth gate — MUST be first
  currentUser = await requireAuth();
  if (!currentUser) return;
  initOnlineTracking();

  currentProfile = await getCurrentProfile();
  if (!currentProfile) { window.location.href = 'login.html'; return; }

  initNavbar();
  initTabs();
  initModals();
  initDetailModal();

  document.getElementById('page-content').style.visibility = 'visible';
  document.getElementById('page-loader')?.classList.add('hidden');

  // Load everything in parallel
  await Promise.all([
    loadSessions('upcoming'),
    loadPendingRequests(),
    loadSessionStats(),
  ]);
}

// ─────────────────────────────────────────────────
// Navbar
// ─────────────────────────────────────────────────

function initNavbar() {
  const navAvatarEl = document.getElementById('nav-avatar');
  if (navAvatarEl) {
    if (currentProfile.avatar_url) {
      navAvatarEl.innerHTML = `<img src="${currentProfile.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="Avatar">`;
    } else {
      navAvatarEl.textContent = getInitials(currentProfile.full_name);
    }
  }

  updateNavCredit(currentProfile.credit_balance ?? 0);

  const avatarBtn = document.getElementById('nav-avatar-btn');
  const dropdown  = document.getElementById('nav-dropdown');
  if (avatarBtn && dropdown) {
    avatarBtn.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.toggle('open'); });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }

  document.getElementById('nav-signout-btn')?.addEventListener('click', () => signOut());

  // Realtime credit sync
  supabaseClient.channel(`profile-changes-sessions-${currentUser.id}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${currentUser.id}` },
      payload => {
        currentProfile.credit_balance = payload.new.credit_balance;
        updateNavCredit(payload.new.credit_balance);
      })
    .subscribe();

  // Realtime session updates — as teacher
  supabaseClient.channel(`session-updates-teacher-${currentUser.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'sessions',
      filter: `teacher_id=eq.${currentUser.id}`
    }, payload => {
      const idx = sessions.findIndex(s => s.id === payload.new.id);
      if (idx !== -1) {
        sessions[idx] = { ...sessions[idx], ...payload.new };
        renderSessions();
      }
      // Also refresh action-required panel
      loadPendingRequests();
    })
    .subscribe();

  // Realtime session updates — as learner
  supabaseClient.channel(`session-updates-learner-${currentUser.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'sessions',
      filter: `learner_id=eq.${currentUser.id}`
    }, payload => {
      const idx = sessions.findIndex(s => s.id === payload.new.id);
      if (idx !== -1) {
        sessions[idx] = { ...sessions[idx], ...payload.new };
        renderSessions();
      }
    })
    .subscribe();
}

function updateNavCredit(balance) {
  const el = document.getElementById('nav-credit-link')?.querySelector('.js-credit-balance');
  if (el) el.textContent = Number(balance).toLocaleString();
}

// ─────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────

function initTabs() {
  document.querySelectorAll('.sessions-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab === activeTab) return;
      activeTab = tab;
      document.querySelectorAll('.sessions-tab').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
        b.setAttribute('aria-selected', b.dataset.tab === tab);
      });
      loadSessions(tab);
    });
  });
}

// ─────────────────────────────────────────────────
// Fetch
// ─────────────────────────────────────────────────

async function fetchSessions(filter = 'upcoming') {
  let statusFilter;
  if (filter === 'upcoming') statusFilter = ['pending', 'confirmed'];
  if (filter === 'past')     statusFilter = ['completed', 'cancelled', 'no_show'];
  if (filter === 'all')      statusFilter = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

  const { data, error } = await supabaseClient
    .from('sessions')
    .select(`
      *,
      teacher:profiles!sessions_teacher_id_fkey(id, full_name, avatar_url, college),
      learner:profiles!sessions_learner_id_fkey(id, full_name, avatar_url, college),
      skill:skills(id, name, category),
      escrow:session_escrow(status, amount)
    `)
    .or(`teacher_id.eq.${currentUser.id},learner_id.eq.${currentUser.id}`)
    .in('status', statusFilter)
    .order('scheduled_at', { ascending: filter === 'upcoming' });

  if (error) throw error;
  return data || [];
}

async function loadSessions(tab) {
  showSkeleton(true);
  document.getElementById('sessions-container').innerHTML = '';

  try {
    sessions = await fetchSessions(tab);
  } catch (err) {
    console.error('Sessions fetch error:', err.message);
    showToast('Error loading sessions', 'error');
    sessions = [];
  }

  showSkeleton(false);

  // Update tab counts asynchronously without blocking render
  updateTabCounts();

  renderSessions();
}

async function updateTabCounts() {
  // Fetch counts for all tabs in parallel (lightweight head-only)
  const filters = {
    upcoming: ['pending', 'confirmed'],
    past:     ['completed', 'cancelled', 'no_show'],
    all:      ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
  };

  await Promise.all(Object.entries(filters).map(async ([tab, statuses]) => {
    const { count } = await supabaseClient
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .or(`teacher_id.eq.${currentUser.id},learner_id.eq.${currentUser.id}`)
      .in('status', statuses);
    const el = document.getElementById(`count-${tab}`);
    if (el) el.textContent = count ?? 0;
  }));
}

function showSkeleton(visible) {
  document.getElementById('sessions-skeleton').style.display = visible ? 'block' : 'none';
}

// ─────────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────────

function renderSessions() {
  const container = document.getElementById('sessions-container');

  if (!sessions || sessions.length === 0) {
    container.innerHTML = renderEmptyState(activeTab);
    return;
  }

  container.innerHTML = sessions.map(s => renderSessionCard(s)).join('');

  // Wire card-click → detail modal (ignore clicks on buttons/links inside footer)
  container.querySelectorAll('.session-card-full').forEach(card => {
    card.addEventListener('click', e => {
      // Don't open if user clicked a button, anchor, or anything inside the footer
      if (e.target.closest('.session-card-footer') || e.target.closest('a') || e.target.closest('button')) return;
      const sid = card.id.replace('session-', '');
      window.openDetailModal(sid);
    });
  });
}

function renderEmptyState(tab) {
  if (tab === 'upcoming') {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <div class="empty-state-title">No upcoming sessions</div>
        <div class="empty-state-text">Find someone to learn from and book your first session!</div>
        <a href="browse.html" class="btn btn-primary" style="display:inline-flex;">Browse Peers</a>
      </div>`;
  }
  return `
    <div class="empty-state">
      <div class="empty-state-icon">🕰️</div>
      <div class="empty-state-title">No past sessions yet</div>
      <div class="empty-state-text">Your completed and cancelled sessions will appear here.</div>
    </div>`;
}

function renderSessionCard(s) {
  const isTeaching = s.teacher_id === currentUser.id;
  const other = isTeaching ? s.learner : s.teacher;
  const otherName = other?.full_name || 'Unknown';
  const roleLabel = isTeaching ? 'You are Teaching' : 'You are Learning';
  const roleClass = isTeaching ? 'teaching' : 'learning';

  const creditAmt   = isTeaching ? (s.credits_earned ?? 0) : (s.credits_cost ?? 0);
  const creditClass = isTeaching ? 'earn' : 'spend';
  const creditSign  = isTeaching ? '+' : '-';

  const statusLabel = STATUS_LABELS[s.status] || s.status;
  const passed      = hasSessionPassed(s.scheduled_at);

  // Escrow row — only for in-progress sessions
  const escrowAmt  = Array.isArray(s.escrow) ? s.escrow[0]?.amount : s.escrow?.amount;
  const escrowStatus = Array.isArray(s.escrow) ? s.escrow[0]?.status : s.escrow?.status;
  const showEscrow = ['pending', 'confirmed'].includes(s.status) && escrowAmt && escrowStatus === 'held';

  // Action buttons
  const actions = buildActionButtons(s, isTeaching, passed);

  return `
    <article class="session-card-full" id="session-${s.id}">

      <!-- Header -->
      <div class="session-card-header">
        <span class="badge ${categoryBadgeClass(s.skill?.category)}">${s.skill?.name || 'Session'}</span>
        <span class="session-role-badge ${roleClass}">
          ${isTeaching
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`
          }
          ${roleLabel}
        </span>
        <span class="session-status-badge ${s.status}">${statusLabel}</span>
      </div>

      <!-- Body -->
      <div class="session-card-body">

        <!-- Other person -->
        <div class="session-person">
          ${renderAvatar(otherName, other?.avatar_url, 'avatar-md')}
          <div>
            <a href="profile.html?id=${other?.id}" class="fw-600" style="font-size:1rem;">${otherName}</a>
            <div class="text-secondary" style="font-size:0.85rem;">${other?.college || ''}</div>
          </div>
        </div>

        <!-- Meta info -->
        <div class="session-meta-col">
          <div class="session-meta-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span class="meta-value">${formatDateTime(s.scheduled_at)}</span>
          </div>
          <div class="session-meta-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span class="meta-value">${s.duration_mins ?? 60} minutes</span>
          </div>
          ${s.notes ? `
          <div class="session-meta-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <span style="font-size:0.85rem; color:var(--color-text-secondary);">${s.notes.length > 80 ? s.notes.slice(0, 80) + '…' : s.notes}</span>
          </div>` : ''}
        </div>

        <!-- Credits -->
        <div style="text-align:right;">
          <div class="session-credit-display ${creditClass}">${creditSign}${Number(creditAmt).toLocaleString()} ✦</div>
          <div style="font-size:0.8rem; color:var(--color-text-hint); margin-top:4px;">${isTeaching ? 'to earn' : 'cost'}</div>
        </div>

      </div>

      <!-- Escrow note -->
      ${showEscrow ? `<div class="session-escrow-note">✦ ${Number(escrowAmt).toLocaleString()} credits held in escrow</div>` : ''}

      <!-- Footer actions -->
      ${actions.length > 0 ? `<div class="session-card-footer">${actions.join('')}</div>` : ''}

    </article>`;
}

function buildActionButtons(s, isTeaching, passed) {
  const buttons = [];
  const sid = s.id;

  if (s.status === 'pending') {
    if (isTeaching) {
      buttons.push(`<button class="btn btn-primary" onclick="window.confirmSession('${sid}')">Confirm Session</button>`);
      buttons.push(`<button class="btn btn-ghost" style="color:var(--color-danger);border-color:var(--color-danger);" onclick="window.cancelSession('${sid}', 'teacher')">Decline</button>`);
    } else {
      buttons.push(`<button class="btn btn-ghost" style="color:var(--color-danger);border-color:var(--color-danger);" onclick="window.cancelSession('${sid}', 'learner')">Cancel Request</button>`);
    }
  }

  if (s.status === 'confirmed') {
    if (s.meet_link) {
      buttons.push(`<a href="${s.meet_link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Join Session</a>`);
    } else {
      buttons.push(`<button class="btn btn-secondary" style="opacity:0.5;" disabled>No Meet Link Yet</button>`);
    }

    if (isTeaching) {
      buttons.push(`<button class="btn btn-secondary" onclick="window.openMeetLinkModal('${sid}')">
        ${s.meet_link ? 'Update Meet Link' : 'Add Meet Link'}
      </button>`);
      if (passed) {
        buttons.push(`<button class="btn btn-ghost" onclick="window.markNoShow('${sid}')">Mark No Show</button>`);
      }
    } else {
      if (passed) {
        buttons.push(`<button class="btn btn-secondary" onclick="window.markComplete('${sid}')">Mark Complete</button>`);
      }
      buttons.push(`<button class="btn btn-ghost" style="color:var(--color-danger);border-color:var(--color-danger);" onclick="window.cancelSession('${sid}', 'learner')">Cancel</button>`);
    }
  }

  if (s.status === 'completed') {
    // Check if rating already given — we store this in a local flag on the session object
    if (!s._rated) {
      buttons.push(`<button class="btn btn-primary" onclick="window.openRatingModal('${sid}')">Leave Review</button>`);
    } else {
      buttons.push(`<span style="font-size:0.9rem; color:var(--color-success); font-weight:600;">✓ Review submitted</span>`);
    }
  }

  return buttons;
}

// ─────────────────────────────────────────────────
// Action Handlers (exposed on window for inline onclick)
// ─────────────────────────────────────────────────

window.confirmSession = async function(sessionId) {
  const s = sessions.find(x => x.id === sessionId);
  if (!s) return;

  const btn = document.querySelector(`#session-${sessionId} .btn-primary`);
  if (btn) { btn.disabled = true; btn.textContent = 'Confirming…'; }

  const { error } = await supabaseClient.from('sessions')
    .update({ status: 'confirmed' })
    .eq('id', sessionId)
    .eq('teacher_id', currentUser.id);

  if (error) { showToast('Error confirming session', 'error'); if (btn) { btn.disabled = false; btn.textContent = 'Confirm Session'; } return; }

  // Notify learner
  await supabaseClient.from('notifications').insert({
    user_id: s.learner_id,
    type: 'session_confirmed',
    title: 'Session Confirmed!',
    body: `Your session for ${s.skill?.name} has been confirmed`,
    link_url: 'sessions.html',
    actor_id: currentUser.id,
    session_id: sessionId
  });

  showToast('Session confirmed!', 'success');
  await refreshSessions();
};

window.cancelSession = async function(sessionId, role) {
  const s = sessions.find(x => x.id === sessionId);
  if (!s) return;

  const updateData = {
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancelled_by: currentUser.id
  };

  const { error } = await supabaseClient.from('sessions').update(updateData).eq('id', sessionId);
  if (error) { showToast('Error cancelling session', 'error'); return; }

  // Refund escrow → always goes to learner
  const learnerId = s.learner_id;
  const { data: escrowData } = await supabaseClient
    .from('session_escrow').select('amount').eq('session_id', sessionId).single();

  if (escrowData) {
    await supabaseClient.from('session_escrow')
      .update({ status: 'refunded', resolved_at: new Date().toISOString() })
      .eq('session_id', sessionId);

    // Fetch learner's current balance (may differ from currentProfile if teacher is cancelling)
    let learnerBalance = currentProfile.credit_balance;
    if (learnerId !== currentUser.id) {
      const { data: lp } = await supabaseClient.from('profiles').select('credit_balance').eq('id', learnerId).single();
      learnerBalance = lp?.credit_balance ?? 0;
    }

    await supabaseClient.from('profiles')
      .update({ credit_balance: learnerBalance + escrowData.amount })
      .eq('id', learnerId);

    await supabaseClient.from('credit_ledger').insert({
      user_id: learnerId,
      event_type: 'escrow_refund',
      amount: escrowData.amount,
      balance_after: learnerBalance + escrowData.amount,
      session_id: sessionId,
      description: 'Session cancelled — credits refunded'
    });

    // Update local balance if learner is current user
    if (learnerId === currentUser.id) {
      currentProfile.credit_balance += escrowData.amount;
      updateNavCredit(currentProfile.credit_balance);
    }
  }

  showToast('Session cancelled. Credits refunded.', 'success');
  await refreshSessions();
};

window.markNoShow = async function(sessionId) {
  const sess = sessions.find(s => s.id === sessionId);
  if (!sess) return;

  // Guard: only allow after session time has passed
  const sessionTime = new Date(sess.scheduled_at);
  const now = new Date();
  if (now < sessionTime) {
    showToast('Cannot mark no-show before session time', 'error');
    return;
  }

  const { error } = await supabaseClient.from('sessions')
    .update({ status: 'no_show' })
    .eq('id', sessionId)
    .eq('teacher_id', currentUser.id);
  if (error) { showToast('Error updating session', 'error'); return; }

  // Fetch escrow record
  const { data: escrow } = await supabaseClient
    .from('session_escrow').select('amount').eq('session_id', sessionId).single();

  if (escrow) {
    // Release escrow TO TEACHER (learner forfeits credits as no-show penalty)
    await supabaseClient.from('session_escrow')
      .update({ status: 'released', resolved_at: new Date().toISOString() })
      .eq('session_id', sessionId);

    // Fetch teacher's current balance
    const { data: teacherData } = await supabaseClient
      .from('profiles').select('credit_balance').eq('id', currentUser.id).single();

    const newBalance = (teacherData?.credit_balance ?? 0) + escrow.amount;

    await supabaseClient.from('profiles')
      .update({ credit_balance: newBalance })
      .eq('id', currentUser.id);

    // Update local state
    currentProfile.credit_balance = newBalance;
    updateNavCredit(newBalance);

    await supabaseClient.from('credit_ledger').insert({
      user_id: currentUser.id,
      event_type: 'escrow_release',
      amount: escrow.amount,
      balance_after: newBalance,
      session_id: sessionId,
      description: 'Learner no-show — escrow released to teacher'
    });

    // Notify learner
    await supabaseClient.from('notifications').insert({
      user_id: sess.learner_id,
      type: 'session_cancelled',
      title: 'Marked as No-Show',
      body: `Your session for ${sess.skill?.name} was marked as no-show. Credits were not refunded.`,
      link_url: 'sessions.html',
      actor_id: currentUser.id,
      session_id: sessionId
    });
  }

  showToast('Session marked as no-show.', 'info');
  await refreshSessions();
  await loadSessionStats(); // credits might have changed
};

window.markComplete = async function(sessionId) {
  const s = sessions.find(x => x.id === sessionId);
  if (!s) return;

  const btn = document.querySelector(`#session-${sessionId} .btn-secondary`);
  if (btn) { btn.disabled = true; btn.textContent = 'Completing…'; }

  try {
    // Update session status
    await supabaseClient.from('sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', sessionId);

    // Release escrow
    await supabaseClient.from('session_escrow')
      .update({ status: 'released', resolved_at: new Date().toISOString() })
      .eq('session_id', sessionId);

    // Fetch teacher's current balance
    const { data: teacherData } = await supabaseClient.from('profiles')
      .select('credit_balance, sessions_taught, total_sessions').eq('id', s.teacher_id).single();

    if (teacherData) {
      const newTeacherBal = teacherData.credit_balance + (s.credits_earned ?? 0);

      // Credit teacher
      await supabaseClient.from('profiles').update({
        credit_balance: newTeacherBal,
        sessions_taught: (teacherData.sessions_taught ?? 0) + 1,
        total_sessions: (teacherData.total_sessions ?? 0) + 1
      }).eq('id', s.teacher_id);

      // Update learner (currentProfile)
      await supabaseClient.from('profiles').update({
        sessions_learned: (currentProfile.sessions_learned ?? 0) + 1,
        total_sessions: (currentProfile.total_sessions ?? 0) + 1
      }).eq('id', s.learner_id);

      // Dual ledger entries
      await supabaseClient.from('credit_ledger').insert([
        {
          user_id: s.teacher_id,
          event_type: 'session_teach',
          amount: s.credits_earned,
          balance_after: newTeacherBal,
          session_id: sessionId,
          description: `Session completed — credits earned for teaching ${s.skill?.name}`
        },
        {
          user_id: s.learner_id,
          event_type: 'session_learn',
          amount: -(s.credits_cost ?? 0),
          balance_after: currentProfile.credit_balance, // already deducted at escrow time
          session_id: sessionId,
          description: `Session completed — credits released from escrow`
        }
      ]);
    }

    // Notify teacher
    await supabaseClient.from('notifications').insert({
      user_id: s.teacher_id,
      type: 'session_completed',
      title: 'Session Completed!',
      body: `Your session for ${s.skill?.name} is complete. Credits have been released.`,
      link_url: 'sessions.html',
      actor_id: currentUser.id,
      session_id: sessionId
    });

    showToast('Session marked complete! Credits released to teacher.', 'success');

    // Reload first then open rating modal
    await refreshSessions();
    window.openRatingModal(sessionId);

  } catch (err) {
    console.error('Mark complete error:', err);
    showToast('Error completing session', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Mark Complete'; }
  }
};

// ─────────────────────────────────────────────────
// Meet Link Modal
// ─────────────────────────────────────────────────

function initModals() {
  // Meet Link Modal
  const meetModal = document.getElementById('meet-link-modal');
  document.getElementById('meet-modal-close').addEventListener('click', closeMeetModal);
  document.getElementById('meet-modal-cancel').addEventListener('click', closeMeetModal);
  meetModal.addEventListener('click', e => { if (e.target === meetModal) closeMeetModal(); });

  document.getElementById('meet-modal-save').addEventListener('click', async () => {
    const url = document.getElementById('meet-link-input').value.trim();
    const errorEl = document.getElementById('meet-modal-error');

    if (!url) { errorEl.textContent = 'Please enter a meeting URL'; errorEl.style.display = 'flex'; return; }

    const btn = document.getElementById('meet-modal-save');
    btn.disabled = true; btn.textContent = 'Saving…';

    const s = sessions.find(x => x.id === meetLinkSessionId);

    const { error } = await supabaseClient.from('sessions')
      .update({ meet_link: url })
      .eq('id', meetLinkSessionId)
      .eq('teacher_id', currentUser.id);

    btn.disabled = false; btn.textContent = 'Save Link';

    if (error) { errorEl.textContent = 'Error saving link'; errorEl.style.display = 'flex'; return; }

    if (s) {
      await supabaseClient.from('notifications').insert({
        user_id: s.learner_id,
        type: 'session_confirmed',
        title: 'Meet Link Added',
        body: `Your teacher added a Google Meet link for your ${s.skill?.name} session`,
        link_url: 'sessions.html',
        actor_id: currentUser.id,
        session_id: meetLinkSessionId
      });
    }

    showToast('Meet link saved!', 'success');
    closeMeetModal();
    await refreshSessions();
  });

  // Rating Modal
  const ratingModal = document.getElementById('rating-modal');
  document.getElementById('rating-modal-close').addEventListener('click', closeRatingModal);
  document.getElementById('rating-modal-skip').addEventListener('click', closeRatingModal);
  ratingModal.addEventListener('click', e => { if (e.target === ratingModal) closeRatingModal(); });

  // Star picker
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedStars = parseInt(btn.dataset.val, 10);
      document.querySelectorAll('.star-btn').forEach((b, i) => {
        b.classList.toggle('active', i < selectedStars);
      });
      document.getElementById('rating-modal-submit').disabled = selectedStars === 0;
    });
  });

  // Review char counter
  document.getElementById('review-text').addEventListener('input', e => {
    document.getElementById('review-char-counter').textContent = `${e.target.value.length} / 300`;
  });

  // Submit review
  document.getElementById('rating-modal-submit').addEventListener('click', submitRating);
}

window.openMeetLinkModal = function(sessionId) {
  meetLinkSessionId = sessionId;
  const s = sessions.find(x => x.id === sessionId);
  document.getElementById('meet-link-input').value = s?.meet_link || '';
  document.getElementById('meet-modal-error').style.display = 'none';
  document.getElementById('meet-link-modal').classList.add('open');
};

function closeMeetModal() {
  document.getElementById('meet-link-modal').classList.remove('open');
  meetLinkSessionId = null;
}

// ─────────────────────────────────────────────────
// Rating Modal
// ─────────────────────────────────────────────────

window.openRatingModal = function(sessionId) {
  ratingSessionId = sessionId;
  selectedStars = 0;

  const s = sessions.find(x => x.id === sessionId);
  const teacherName = s?.teacher?.full_name || 'your teacher';

  document.getElementById('rating-teacher-name').textContent = teacherName;
  document.getElementById('review-text').value = '';
  document.getElementById('review-char-counter').textContent = '0 / 300';
  document.getElementById('rating-modal-error').style.display = 'none';
  document.getElementById('rating-modal-submit').disabled = true;

  // Reset stars
  document.querySelectorAll('.star-btn').forEach(b => b.classList.remove('active'));

  document.getElementById('rating-modal').classList.add('open');
};

function closeRatingModal() {
  document.getElementById('rating-modal').classList.remove('open');
  ratingSessionId = null;
  selectedStars = 0;
}

async function submitRating() {
  if (!ratingSessionId || selectedStars === 0) return;

  const s = sessions.find(x => x.id === ratingSessionId);
  const reviewText = document.getElementById('review-text').value.trim();
  const errorEl = document.getElementById('rating-modal-error');

  const btn = document.getElementById('rating-modal-submit');
  btn.disabled = true; btn.textContent = 'Submitting…';

  const { error } = await supabaseClient.from('ratings').insert({
    session_id: ratingSessionId,
    rater_id: currentUser.id,
    ratee_id: s.teacher_id,
    stars: selectedStars,
    review_text: reviewText || null
  });

  if (error) {
    errorEl.textContent = error.message;
    errorEl.style.display = 'flex';
    btn.disabled = false; btn.textContent = 'Submit Review';
    return;
  }

  await supabaseClient.from('notifications').insert({
    user_id: s.teacher_id,
    type: 'rating_received',
    title: 'New Review!',
    body: `You received a ${selectedStars}-star review for ${s.skill?.name}`,
    link_url: `profile.html?id=${s.teacher_id}`,
    actor_id: currentUser.id,
    session_id: ratingSessionId
  });

  showToast('Review submitted! Thank you.', 'success');

  // Mark locally so button changes to "Review submitted"
  const idx = sessions.findIndex(x => x.id === ratingSessionId);
  if (idx > -1) sessions[idx]._rated = true;

  closeRatingModal();
  renderSessions(); // re-render to update button state
}

// ─────────────────────────────────────────────────
// Pending Requests Panel (Action Required)
// ─────────────────────────────────────────────────

async function loadPendingRequests() {
  const { data: pendingRequests, error } = await supabaseClient
    .from('sessions')
    .select(`
      *,
      learner:profiles!sessions_learner_id_fkey(id, full_name, avatar_url, college),
      skill:skills(name, category)
    `)
    .eq('teacher_id', currentUser.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) { console.error('Pending requests error:', error.message); return; }

  const panel = document.getElementById('action-required-panel');
  const cardsEl = document.getElementById('action-request-cards');
  const countEl = document.getElementById('action-required-count');

  if (!pendingRequests || pendingRequests.length === 0) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  countEl.textContent = pendingRequests.length;

  cardsEl.innerHTML = pendingRequests.map(req => {
    const learner = req.learner || {};
    const timeAgo = getTimeAgo(req.created_at);
    return `
      <div class="action-request-card">
        <div class="action-request-person">
          ${renderAvatar(learner.full_name, learner.avatar_url, 'avatar-sm')}
          <div>
            <div class="fw-600" style="font-size:0.95rem;">${learner.full_name || 'Unknown'}</div>
            <div class="text-secondary" style="font-size:0.8rem;">${learner.college || ''}</div>
          </div>
        </div>
        <div class="action-request-meta">
          <div>
            <span class="badge ${categoryBadgeClass(req.skill?.category)}">${req.skill?.name || 'Session'}</span>
          </div>
          <div>${formatDateTime(req.scheduled_at)} · ${req.duration_mins ?? 60} min</div>
          <div class="action-request-time">Requested ${timeAgo}</div>
        </div>
        <div class="action-request-credits">
          <div style="text-align:center;">
            <div style="font-size:0.75rem;color:var(--color-text-hint);text-transform:uppercase;">They Pay</div>
            <div style="font-weight:700;color:var(--color-credit);">${Number(req.credits_cost ?? 0).toLocaleString()} ✦</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:0.75rem;color:var(--color-text-hint);text-transform:uppercase;">You Earn</div>
            <div style="font-weight:700;color:var(--color-success);">+${Number(req.credits_earned ?? 0).toLocaleString()} ✦</div>
          </div>
        </div>
        <div class="action-request-actions">
          <button class="btn btn-primary" style="padding:8px 16px;font-size:13px;" onclick="window.confirmSession('${req.id}');">Confirm</button>
          <button class="btn btn-ghost" style="padding:8px 16px;font-size:13px;color:var(--color-danger);border-color:var(--color-danger);" onclick="window.cancelSession('${req.id}', 'teacher');">Decline</button>
        </div>
      </div>`;
  }).join('');
}

function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─────────────────────────────────────────────────
// Stats Bar
// ─────────────────────────────────────────────────

async function loadSessionStats() {
  // Fetch credits earned from ledger
  const { data: earnedData } = await supabaseClient
    .from('credit_ledger')
    .select('amount')
    .eq('user_id', currentUser.id)
    .eq('event_type', 'session_teach');

  const totalEarned = earnedData?.reduce((sum, row) => sum + row.amount, 0) || 0;

  const el = id => document.getElementById(id);
  if (el('stat-total'))  el('stat-total').textContent  = currentProfile.total_sessions ?? 0;
  if (el('stat-taught')) el('stat-taught').textContent = currentProfile.sessions_taught ?? 0;
  if (el('stat-learned'))el('stat-learned').textContent= currentProfile.sessions_learned ?? 0;
  if (el('stat-earned')) el('stat-earned').textContent = `${Number(totalEarned).toLocaleString()} ✦`;
}

// ─────────────────────────────────────────────────
// Session Detail Modal
// ─────────────────────────────────────────────────

function initDetailModal() {
  const modal = document.getElementById('session-detail-modal');
  document.getElementById('detail-modal-close').addEventListener('click', closeDetailModal);
  document.getElementById('detail-modal-close-btn').addEventListener('click', closeDetailModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeDetailModal(); });
}

window.openDetailModal = function(sessionId) {
  const s = sessions.find(x => x.id === sessionId);
  if (!s) return;
  detailSessionId = sessionId;

  const isTeaching = s.teacher_id === currentUser.id;
  const teacher = s.teacher || {};
  const learner = s.learner || {};

  // Skill badge
  document.getElementById('detail-skill-badge').innerHTML =
    `<span class="badge ${categoryBadgeClass(s.skill?.category)}">${s.skill?.name || 'Session'}</span>`;

  // Participants
  document.getElementById('detail-participants').innerHTML = `
    <div class="detail-participant-card">
      ${renderAvatar(teacher.full_name, teacher.avatar_url, 'avatar-md')}
      <div>
        <div class="detail-participant-role teacher">Teacher</div>
        <a href="profile.html?id=${teacher.id}" class="fw-600" style="font-size:0.95rem;color:var(--color-text-primary);text-decoration:none;">${teacher.full_name || '—'}</a>
        <div class="text-secondary" style="font-size:0.8rem;">${teacher.college || ''}</div>
      </div>
    </div>
    <div class="detail-participant-card">
      ${renderAvatar(learner.full_name, learner.avatar_url, 'avatar-md')}
      <div>
        <div class="detail-participant-role learner">Learner</div>
        <a href="profile.html?id=${learner.id}" class="fw-600" style="font-size:0.95rem;color:var(--color-text-primary);text-decoration:none;">${learner.full_name || '—'}</a>
        <div class="text-secondary" style="font-size:0.8rem;">${learner.college || ''}</div>
      </div>
    </div>`;

  // Info grid
  const escrowAmt = Array.isArray(s.escrow) ? s.escrow[0]?.amount : s.escrow?.amount;
  const escrowStatus = Array.isArray(s.escrow) ? s.escrow[0]?.status : s.escrow?.status;
  const meetLinkHtml = s.meet_link
    ? `<a href="${s.meet_link}" target="_blank" rel="noopener noreferrer" style="color:var(--color-primary);">${s.meet_link.replace(/^https?:\/\//, '')}</a>`
    : '<span style="color:var(--color-text-hint);">Not added yet</span>';

  document.getElementById('detail-info-grid').innerHTML = `
    <div class="detail-info-item">
      <div class="detail-info-label">Scheduled</div>
      <div class="detail-info-value">${formatDateTime(s.scheduled_at)}</div>
    </div>
    <div class="detail-info-item">
      <div class="detail-info-label">Duration</div>
      <div class="detail-info-value">${s.duration_mins ?? 60} minutes</div>
    </div>
    <div class="detail-info-item">
      <div class="detail-info-label">Status</div>
      <div class="detail-info-value"><span class="session-status-badge ${s.status}">${STATUS_LABELS[s.status] || s.status}</span></div>
    </div>
    <div class="detail-info-item">
      <div class="detail-info-label">Meet Link</div>
      <div class="detail-info-value" style="font-size:0.85rem;word-break:break-all;">${meetLinkHtml}</div>
    </div>
    <div class="detail-info-item">
      <div class="detail-info-label">Created</div>
      <div class="detail-info-value">${s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—'}</div>
    </div>`;

  // Notes
  const notesWrap = document.getElementById('detail-notes-wrap');
  if (s.notes) {
    notesWrap.style.display = 'block';
    document.getElementById('detail-notes').textContent = s.notes;
  } else {
    notesWrap.style.display = 'none';
  }

  // Credits breakdown
  document.getElementById('detail-credits').innerHTML = `
    <div class="detail-credit-item">
      <div class="detail-credit-label">Learner Pays</div>
      <div class="detail-credit-amount spend">${Number(s.credits_cost ?? 0).toLocaleString()} ✦</div>
    </div>
    <div class="detail-credit-item">
      <div class="detail-credit-label">Teacher Earns</div>
      <div class="detail-credit-amount earn">+${Number(s.credits_earned ?? 0).toLocaleString()} ✦</div>
    </div>
    <div class="detail-credit-item">
      <div class="detail-credit-label">Escrow Status</div>
      <div class="detail-credit-amount held" style="font-size:0.95rem;text-transform:capitalize;">${escrowStatus || '—'} ${escrowAmt ? `(${Number(escrowAmt).toLocaleString()} ✦)` : ''}</div>
    </div>`;

  document.getElementById('session-detail-modal').classList.add('open');
};

function closeDetailModal() {
  document.getElementById('session-detail-modal').classList.remove('open');
  detailSessionId = null;
}

// ─────────────────────────────────────────────────
// Refresh helper
// ─────────────────────────────────────────────────

async function refreshSessions() {
  showSkeleton(true);
  document.getElementById('sessions-container').innerHTML = '';
  try {
    sessions = await fetchSessions(activeTab);
  } catch (err) {
    console.error(err);
  }
  showSkeleton(false);
  updateTabCounts();
  renderSessions();
  await loadPendingRequests();
}

// ─────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────
init();
