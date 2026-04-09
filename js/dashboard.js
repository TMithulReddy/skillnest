import {
  supabaseClient,
  requireAuth,
  getCurrentProfile,
  signOut,
  initOnlineTracking,
  getTotalUnreadCount,
} from "./supabase.js";

// ─────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(fullName) {
  if (!fullName) return "?";
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDateTime(dateStr) {
  if (!dateStr) return "TBD";
  return new Date(dateStr).toLocaleString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const EVENT_LABELS = {
  signup_bonus: "Welcome Bonus",
  session_teach: "Session Taught",
  session_learn: "Session Learned",
  rating_bonus: "5-Star Bonus",
  streak_bonus: "Streak Reward",
  endorsement_bonus: "Peer Endorsement",
  endorsement_given: "Endorsed a Peer",
  referral_bonus: "Referral Bonus",
  refund: "Credit Refund",
};

function eventLabel(type) {
  return EVENT_LABELS[type] || type?.replace(/_/g, " ") || "Credit Event";
}

const CATEGORY_BADGE_MAP = {
  tech: "badge-tech",
  design: "badge-design",
  music: "badge-music",
  languages: "badge-languages",
  academic: "badge-academic",
  business: "badge-business",
};

function categoryBadgeClass(category) {
  const key = (category || "").toLowerCase();
  return CATEGORY_BADGE_MAP[key] || "badge-other";
}

// ─────────────────────────────────────────────────────────
// DOM Helpers
// ─────────────────────────────────────────────────────────

function $id(id) {
  return document.getElementById(id);
}

function showSkeleton(id) {
  const el = $id(id);
  if (el) el.style.display = "";
}

function hideSkeleton(id) {
  const el = $id(id);
  if (el) el.style.display = "none";
}

function setHTML(id, html) {
  const el = $id(id);
  if (el) el.innerHTML = html;
}

function setText(id, text) {
  const el = $id(id);
  if (el) el.textContent = text;
}

function renderAvatar(fullName, avatarUrl, sizeClass = "avatar-md") {
  if (avatarUrl) {
    return `<span class="avatar ${sizeClass}"><img src="${avatarUrl}" alt="${fullName}" loading="lazy"></span>`;
  }
  return `<span class="avatar ${sizeClass}">${getInitials(fullName)}</span>`;
}

// ─────────────────────────────────────────────────────────
// Credit balance display (also used by realtime)
// ─────────────────────────────────────────────────────────

export function updateCreditDisplay(balance) {
  const formatted = Number(balance).toLocaleString();
  const elements = document.querySelectorAll(".js-credit-balance");
  elements.forEach((el) => (el.textContent = formatted));
}

// ─────────────────────────────────────────────────────────
// Section renderers
// ─────────────────────────────────────────────────────────

function renderWelcomeBanner(profile) {
  const firstName = (profile.full_name || "there").split(" ")[0];
  const greeting = `${getGreeting()}, ${firstName} 👋`;
  const college = [profile.college, profile.department, profile.year_of_study ? `Year ${profile.year_of_study}` : ""]
    .filter(Boolean)
    .join(" · ");
  const completion = profile.profile_completion ?? 0;

  setText("welcome-greeting", greeting);
  setText("welcome-college", college || "Complete your profile");
  $id("progress-bar-fill").style.width = `${completion}%`;
  setText("progress-percent", `${completion}% complete`);

  if (completion < 100) {
    $id("profile-complete-hint").style.display = "block";
  }

  const streak = profile.login_streak ?? 0;
  if (streak > 0) {
    setHTML("streak-display", `<div class="streak-value">🔥 ${streak}</div><div class="streak-label">day streak</div>`);
  } else {
    setHTML("streak-display", `<div class="streak-value">🔥</div><div class="streak-label">Start your streak today!</div>`);
  }
}

function renderStats(profile) {
  updateCreditDisplay(profile.credit_balance ?? 0);

  setText("stat-sessions-taught", profile.sessions_taught ?? 0);
  setText("stat-sessions-learned", profile.sessions_learned ?? 0);

  const rating = Number(profile.avg_rating ?? 0).toFixed(1);
  const stars = Math.round(profile.avg_rating ?? 0);
  const starHTML = Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < stars ? "var(--color-warning)" : "var(--color-border)"}">${i < stars ? "★" : "☆"}</span>`
  ).join("");
  setHTML("stat-rating", `${rating} <span style="font-size:1.1rem;">${starHTML}</span>`);
}

function renderSessions(sessions, userId) {
  hideSkeleton("sessions-skeleton");
  const container = $id("sessions-container");

  if (!sessions || sessions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <div class="empty-state-title">No upcoming sessions</div>
        <div class="empty-state-text">Browse peers to book your first session!</div>
        <a href="browse.html" class="btn btn-primary" style="display:inline-flex;">Browse Skills</a>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="sessions-grid">${sessions.map((s) => renderSessionCard(s, userId)).join("")}</div>`;
}

function renderSessionCard(s, userId) {
  const isTeaching = s.teacher_id === userId;
  const other = isTeaching ? s.learner : s.teacher;
  const otherName = other?.full_name || "Unknown";
  const roleLabel = isTeaching ? "Teaching" : "Learning";
  const roleClass = isTeaching ? "teaching" : "learning";
  const creditLabel = isTeaching
    ? `<span class="session-credit earn">+${s.credits_earned ?? s.credits_cost ?? 0} ✦</span>`
    : `<span class="session-credit spend">-${s.credits_cost ?? 0} ✦</span>`;

  const joinBtn = s.status === "confirmed" && s.meet_link
    ? `<a href="${s.meet_link}" target="_blank" rel="noopener" class="btn btn-primary" style="padding:8px 16px;font-size:13px;width:100%;">Join Session</a>`
    : "";

  return `
    <div class="session-card">
      <div class="session-card-header">
        <span class="badge ${categoryBadgeClass(s.skill?.category)}">${s.skill?.name || "Session"}</span>
        <span class="status-badge ${s.status}">${s.status.charAt(0).toUpperCase() + s.status.slice(1)}</span>
      </div>
      <div class="session-person">
        ${renderAvatar(otherName, other?.avatar_url, "avatar-sm")}
        <div class="session-meta">
          <span class="fw-600" style="font-size:14px;">${otherName}</span>
          <span class="role-badge ${roleClass}">${roleLabel}</span>
        </div>
        <div style="margin-left:auto;">${creditLabel}</div>
      </div>
      <div class="session-date">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${formatDateTime(s.scheduled_at)}
      </div>
      ${joinBtn}
    </div>`;
}

function renderMyTeachSkills(skills) {
  hideSkeleton("matches-skeleton");
  const container = $id("matches-container");

  if (!skills || skills.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎯</div>
        <div class="empty-state-title">No skills added</div>
        <div class="empty-state-text">You haven't added any skills yet. Add skills so others can find and book you!</div>
        <button class="btn btn-primary" style="display:inline-flex;" onclick="document.getElementById('open-add-skill-modal').click()">Add Your First Skill</button>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="matches-grid">${skills.map(renderTeachSkillCard).join("")}</div>`;

  // Attach delete listeners
  container.querySelectorAll(".btn-remove-skill").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      if (confirm("Are you sure you want to remove this skill?")) {
        await removeTeachSkill(id);
      }
    };
  });
}

function renderTeachSkillCard(s) {
  return `
    <div class="match-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <span class="badge ${categoryBadgeClass(s.skill?.category)}">${s.skill?.name || "Skill"}</span>
        <button class="btn-remove-skill" data-id="${s.id}" style="background:none;border:none;color:var(--color-danger);cursor:pointer;padding:4px;" title="Remove Skill">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
      <div style="margin-top:auto; font-size: 13px; color: var(--color-text-secondary);">
        This skill is visible on your profile for others to book.
      </div>
    </div>`;
}

function renderLedger(ledger) {
  hideSkeleton("ledger-skeleton");
  const container = $id("ledger-container");

  if (!ledger || ledger.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💳</div>
        <div class="empty-state-title">No credit activity yet</div>
        <div class="empty-state-text">Start teaching or learning to see your credit history here.</div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="ledger-list">
      ${ledger.map((row) => {
        const positive = row.amount > 0;
        return `
          <div class="ledger-row">
            <div class="ledger-info">
              <div class="ledger-label">${eventLabel(row.event_type)}</div>
              <div class="ledger-desc">${row.description || ""}</div>
            </div>
            <div>
              <div class="ledger-amount ${positive ? "positive" : "negative"}">
                ${positive ? "+" : ""}${row.amount.toLocaleString()} ✦
              </div>
              <div class="ledger-balance">${Number(row.balance_after ?? 0).toLocaleString()} ✦ bal.</div>
            </div>
            <div class="ledger-time">${timeAgo(row.created_at)}</div>
          </div>`;
      }).join("")}
    </div>`;
}

// ─────────────────────────────────────────────────────────
// Navbar: avatar dropdown + notification bell
// ─────────────────────────────────────────────────────────

function initNavbar(profile) {
  // Initials avatar
  const initials = getInitials(profile.full_name);
  const navAvatarEl = $id("nav-avatar");
  if (navAvatarEl) {
    if (profile.avatar_url) {
      navAvatarEl.innerHTML = `<img src="${profile.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="Avatar">`;
    } else {
      navAvatarEl.textContent = initials;
    }
  }

  // Credit balance
  updateCreditDisplay(profile.credit_balance ?? 0);

  // Avatar dropdown toggle
  const avatarBtn = $id("nav-avatar-btn");
  const dropdown = $id("nav-dropdown");
  if (avatarBtn && dropdown) {
    avatarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("open");
    });
    document.addEventListener("click", () => dropdown.classList.remove("open"));
  }

  // Sign out
  const signOutBtn = $id("nav-signout-btn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      await signOut();
    });
  }

  // Active nav link
  const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";
  document.querySelectorAll(".navbar-app-links a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
}

async function fetchUnreadCount(userId) {
  const total = await getTotalUnreadCount(userId);
  const badge = $id("nav-bell-badge");
  if (badge) {
    if (total > 0) {
      badge.textContent = total > 99 ? '99+' : total;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

// ─────────────────────────────────────────────────────────
// Realtime subscription
// ─────────────────────────────────────────────────────────

function subscribeToProfileChanges(userId) {
  const channel = supabaseClient
    .channel(`profile-changes-dashboard-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        updateCreditDisplay(payload.new.credit_balance);
      }
    )
    .subscribe();

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    supabaseClient.removeChannel(channel);
  });
}

// ─────────────────────────────────────────────────────────
// Main init — auth gate is FIRST
// ─────────────────────────────────────────────────────────

async function init() {
  // 1. Auth gate — redirects to login.html if not logged in
  const user = await requireAuth();
  if (!user) return; // requireAuth already redirected
  initOnlineTracking();

  // 2. Fetch profile
  const profile = await getCurrentProfile();
  if (!profile) {
    // Profile missing — redirect to login
    window.location.href = "login.html";
    return;
  }

  // 3. Populate navbar
  initNavbar(profile);

  // 4. Show page content (was hidden until auth confirmed)
  const pageContent = $id("page-content");
  if (pageContent) pageContent.style.visibility = "visible";
  document.getElementById('page-loader')?.classList.add('hidden');

  // 5. Render welcome banner (no extra fetch needed)
  renderWelcomeBanner(profile);

  // 6. Render stats row
  renderStats(profile);

  // 7. Realtime credit updates
  subscribeToProfileChanges(user.id);

  // 8. Async parallel fetches
  Promise.all([
    fetchSessions(user.id),
    fetchMyTeachSkills(user.id),
    fetchLedger(user.id),
    fetchUnreadCount(user.id),
  ]);
  initAddSkillModal(user.id);
}

async function fetchSessions(userId) {
  const { data: sessions, error } = await supabaseClient
    .from("sessions")
    .select(`
      *,
      teacher:profiles!sessions_teacher_id_fkey(id, full_name, avatar_url),
      learner:profiles!sessions_learner_id_fkey(id, full_name, avatar_url),
      skill:skills(name, category)
    `)
    .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`)
    .in("status", ["pending", "confirmed"])
    .order("scheduled_at", { ascending: true })
    .limit(3);

  if (error) {
    console.error("Sessions fetch error:", error.message);
  }
  renderSessions(sessions, userId);
}

async function fetchMyTeachSkills(userId) {
  showSkeleton("matches-skeleton");
  const { data: skills, error } = await supabaseClient
    .from("user_skills_teach")
    .select(`
      *,
      skill:skills(name, category)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Teach skills fetch error:", error.message);
  }
  renderMyTeachSkills(skills || []);
}

// ─────────────────────────────────────────────────────────
// Add Skill Modal Logic
// ─────────────────────────────────────────────────────────

let ALL_SKILLS = [];
let SELECTED_SKILL_ID = null;

async function initAddSkillModal(userId) {
  const backdrop = $id("add-skill-modal-backdrop");
  const openBtn = $id("open-add-skill-modal");
  const closeBtn = $id("close-add-skill-modal");
  const cancelBtn = $id("cancel-add-skill");
  const confirmBtn = $id("confirm-add-skill");
  const searchInput = $id("skill-search-input");

  const openModal = async () => {
    backdrop.classList.add("open");
    if (ALL_SKILLS.length === 0) {
      await fetchAvailableSkills();
    }
    renderAvailableSkillsList("");
  };

  const closeModal = () => {
    backdrop.classList.remove("open");
    SELECTED_SKILL_ID = null;
    confirmBtn.disabled = true;
    searchInput.value = "";
  };

  openBtn.onclick = openModal;
  closeBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;
  backdrop.onclick = (e) => { if (e.target === backdrop) closeModal(); };

  searchInput.oninput = (e) => {
    renderAvailableSkillsList(e.target.value);
  };

  confirmBtn.onclick = async () => {
    if (!SELECTED_SKILL_ID) return;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<div class="spinner"></div>`;
    
    const success = await addTeachSkill(userId, SELECTED_SKILL_ID);
    if (success) {
      closeModal();
      fetchMyTeachSkills(userId);
    }
    
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Add Skill";
  };
}

async function fetchAvailableSkills() {
  const { data, error } = await supabaseClient
    .from("skills")
    .select("*")
    .order("name", { ascending: true });

  if (!error) {
    ALL_SKILLS = data;
  }
}

function renderAvailableSkillsList(query) {
  const container = $id("skills-list-container");
  const q = query.toLowerCase().trim();
  
  const filtered = ALL_SKILLS.filter(s => 
    s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    container.innerHTML = `<div class="text-hint flex-center" style="padding:20px;">No skills found Matching "${query}"</div>`;
    return;
  }

  container.innerHTML = filtered.map(s => `
    <div class="skill-option ${SELECTED_SKILL_ID === s.id ? 'selected' : ''}" 
         data-id="${s.id}" 
         style="padding: 10px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: var(--transition);">
      <div>
        <div class="fw-600" style="font-size: 14px;">${s.name}</div>
        <div class="text-hint" style="font-size: 12px;">${s.category}</div>
      </div>
      ${SELECTED_SKILL_ID === s.id ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
    </div>
  `).join("");

  // Style selected option
  const style = document.createElement('style');
  style.id = 'modal-skill-styles';
  style.innerHTML = `
    .skill-option:hover { border-color: var(--color-primary) !important; background-color: var(--color-primary-light); }
    .skill-option.selected { border-color: var(--color-success) !important; background-color: #f0fdf4; }
  `;
  if (!$id('modal-skill-styles')) document.head.appendChild(style);

  // Click listeners
  container.querySelectorAll(".skill-option").forEach(el => {
    el.onclick = () => {
      SELECTED_SKILL_ID = el.dataset.id;
      renderAvailableSkillsList(query);
      $id("confirm-add-skill").disabled = false;
    };
  });
}

async function addTeachSkill(userId, skillId) {
  const { error } = await supabaseClient
    .from("user_skills_teach")
    .insert({
      user_id: userId,
      skill_id: skillId,
      is_active: true
    });

  if (error) {
    if (error.code === "23505") {
      alert("You already have this skill added!");
    } else {
      console.error("Add skill error:", error.message);
      alert("Error adding skill. Please try again.");
    }
    return false;
  }
  return true;
}

async function removeTeachSkill(recordId) {
  const { error } = await supabaseClient
    .from("user_skills_teach")
    .delete()
    .eq("id", recordId);

  if (error) {
    console.error("Remove skill error:", error.message);
    alert("Error removing skill.");
  } else {
    // Refresh list - we need userId
    const user = await getCurrentUser();
    if (user) fetchMyTeachSkills(user.id);
  }
}

async function fetchLedger(userId) {
  const { data: ledger, error } = await supabaseClient
    .from("credit_ledger")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Ledger fetch error:", error.message);
  }
  renderLedger(ledger);
}

// ─────────────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────────────

init();
