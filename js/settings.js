import {
  supabaseClient,
  requireAuth,
  getCurrentProfile,
  signOut,
  initOnlineTracking,
  getTotalUnreadCount
} from './supabase.js';
import { showToast } from './utils.js';

let currentUser = null;
let currentProfile = null;

// ─────────────────────────────────────────────────
// Skill search state (reused from profile.js logic)
// ─────────────────────────────────────────────────
let selectedTeachSkill = null;
let selectedLearnSkill = null;
let searchTimeout;

const notifKeys = [
  { id: 'session_request', label: 'Session requests' },
  { id: 'session_confirmed', label: 'Session confirmations' },
  { id: 'session_completed', label: 'Session completions' },
  { id: 'message_received', label: 'New messages' },
  { id: 'rating_received', label: 'Rating received' },
  { id: 'credit_earned', label: 'Credit earned' },
  { id: 'endorsement_received', label: 'Endorsements received' },
  { id: 'new_match', label: 'New matches' },
  { id: 'streak_milestone', label: 'Login streak milestones' }
];

// ─────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────

async function init() {
  currentUser = await requireAuth();
  if (!currentUser) return;
  initOnlineTracking();

  currentProfile = await getCurrentProfile();
  if (!currentProfile) { window.location.href = 'login.html'; return; }

  initNavbar();
  initTabSwitching();
  initAccountSection();
  initSecuritySection();
  initNotificationsSection();
  initDangerZone();

  // Profile section (new)
  await initProfileSection();

  document.getElementById('page-wrapper').style.visibility = 'visible';
  document.getElementById('page-loader')?.classList.add('hidden');
}

// ─────────────────────────────────────────────────
// Navbar — matches dashboard.js pattern exactly
// ─────────────────────────────────────────────────

function initNavbar() {
  const navAvatarEl = document.getElementById('nav-avatar');
  if (navAvatarEl) {
    if (currentProfile.avatar_url) {
      navAvatarEl.innerHTML = `<img src="${currentProfile.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="Avatar">`;
    } else {
      const initStr = (currentProfile.full_name || '?').trim().split(/\s+/).slice(0, 2).map(n => n[0].toUpperCase()).join('');
      navAvatarEl.textContent = initStr;
    }
  }

  const navBalance = document.getElementById('nav-credit-link')?.querySelector('.js-credit-balance');
  if (navBalance) navBalance.textContent = Number(currentProfile.credit_balance || 0).toLocaleString();

  updateBellBadge();

  const avatarBtn = document.getElementById('nav-avatar-btn');
  const dropdown  = document.getElementById('nav-dropdown');
  if (avatarBtn && dropdown) {
    avatarBtn.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.toggle('open'); });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }

  document.getElementById('nav-signout-btn')?.addEventListener('click', () => signOut());

  // Active nav link detection — same as dashboard.js
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.navbar-app-links a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}

async function updateBellBadge() {
  const total = await getTotalUnreadCount(currentUser.id);
  const badge = document.getElementById('nav-bell-badge');
  if (!badge) return;
  if (total > 0) {
    badge.textContent = total > 99 ? '99+' : total;
    badge.style.display = 'flex';
  } else {
    badge.textContent = '';
    badge.style.display = 'none';
  }
}

// ─────────────────────────────────────────────────
// Tab Switching
// ─────────────────────────────────────────────────

function initTabSwitching() {
  const navItems = document.querySelectorAll('.settings-nav-item');
  const sections = document.querySelectorAll('.settings-section');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      item.classList.add('active');
      document.getElementById(item.dataset.target).classList.add('active');
    });
  });
}

// ─────────────────────────────────────────────────
// PROFILE SECTION
// ─────────────────────────────────────────────────

async function initProfileSection() {
  // Populate header display
  renderProfileHeader();

  // Bio counter
  const bioInput = document.getElementById('edit-bio');
  const bioCounter = document.getElementById('profile-bio-counter');
  bioInput.addEventListener('input', () => {
    bioCounter.textContent = `${bioInput.value.length} / 300`;
  });

  // Pre-fill form
  document.getElementById('edit-fullname').value = currentProfile.full_name || '';
  document.getElementById('edit-mobile').value = currentProfile.mobile || '';
  document.getElementById('edit-bio').value = currentProfile.bio || '';
  document.getElementById('edit-college').value = currentProfile.college || '';
  document.getElementById('edit-department').value = currentProfile.department || '';
  document.getElementById('edit-year').value = currentProfile.year_of_study || '';
  bioCounter.textContent = `${(currentProfile.bio || '').length} / 300`;

  // Profile form submit
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-profile');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const updates = {
      full_name:    document.getElementById('edit-fullname').value.trim(),
      mobile:       document.getElementById('edit-mobile').value.trim(),
      bio:          document.getElementById('edit-bio').value.trim(),
      college:      document.getElementById('edit-college').value.trim(),
      department:   document.getElementById('edit-department').value.trim(),
      year_of_study: document.getElementById('edit-year').value,
      updated_at:   new Date().toISOString()
    };

    const { error } = await supabaseClient.from('profiles').update(updates).eq('id', currentUser.id);

    btn.disabled = false;
    btn.textContent = 'Save Profile';

    if (error) {
      showToast('Error saving profile', 'error');
    } else {
      showToast('Profile updated!', 'success');
      Object.assign(currentProfile, updates);
      renderProfileHeader();
      initNavbar();
    }
  });

  // Avatar upload
  const avatarInput = document.getElementById('avatar-upload');
  avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      showToast('Uploading avatar...', 'info');
      const ext = file.name.split('.').pop();
      const fileName = `${currentUser.id}.${ext}`;

      const { error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
      await supabaseClient.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', currentUser.id);

      currentProfile.avatar_url = data.publicUrl;
      renderProfileHeader();
      initNavbar();
      showToast('Avatar updated!', 'success');
    } catch (err) {
      showToast('Failed to upload avatar', 'error');
      console.error(err);
    }
  });

  // Teaching skill search
  document.getElementById('search-teach-skill').addEventListener('input', (e) => {
    handleSkillSearch(e.target.value.trim(), 'teach');
  });
  document.getElementById('btn-add-teach').addEventListener('click', addTeachSkill);

  // Learning skill search
  document.getElementById('search-learn-skill').addEventListener('input', (e) => {
    handleSkillSearch(e.target.value.trim(), 'learn');
  });
  document.getElementById('btn-add-learn').addEventListener('click', addLearnSkill);

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-dropdown-wrap')) {
      document.getElementById('teach-search-results').classList.remove('open');
      document.getElementById('learn-search-results').classList.remove('open');
    }
  });

  // Load skills and availability
  await refreshTeachSkills();
  await refreshLearnSkills();

  const { data: avail } = await supabaseClient.from('availability').select('*').eq('user_id', currentUser.id);
  renderAvailabilityGrid(avail || []);
}

function renderProfileHeader() {
  const avatarEl = document.getElementById('profile-avatar');
  if (avatarEl) {
    if (currentProfile.avatar_url) {
      avatarEl.innerHTML = `<img src="${currentProfile.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="Avatar">`;
    } else {
      const initials = (currentProfile.full_name || '?').trim().split(/\s+/).slice(0, 2).map(n => n[0].toUpperCase()).join('');
      avatarEl.textContent = initials;
    }
  }
  const nameEl = document.getElementById('profile-name-display');
  if (nameEl) nameEl.textContent = currentProfile.full_name || '';

  const collegeEl = document.getElementById('profile-college-display');
  if (collegeEl) {
    const parts = [currentProfile.college, currentProfile.department, currentProfile.year_of_study ? `Year ${currentProfile.year_of_study}` : ''].filter(Boolean);
    collegeEl.textContent = parts.join(' · ');
  }
}

// ─────────────────────────────────────────────────
// Skill Search + Add (ported from profile.js)
// ─────────────────────────────────────────────────

async function handleSkillSearch(term, type) {
  clearTimeout(searchTimeout);
  const resEl = document.getElementById(`${type}-search-results`);
  const btn = document.getElementById(`btn-add-${type}`);

  if (!term) {
    resEl.classList.remove('open');
    btn.disabled = true;
    if (type === 'teach') selectedTeachSkill = null;
    else selectedLearnSkill = null;
    return;
  }

  searchTimeout = setTimeout(async () => {
    const { data } = await supabaseClient.from('skills')
      .select('id, name, category')
      .ilike('name', `%${term}%`)
      .limit(10);

    resEl.innerHTML = '';

    if (data && data.length > 0) {
      data.forEach(skill => {
        const div = document.createElement('div');
        div.className = 'skill-search-item';
        div.textContent = `${skill.name} (${skill.category})`;
        div.onclick = () => {
          document.getElementById(`search-${type}-skill`).value = skill.name;
          resEl.classList.remove('open');
          btn.disabled = false;
          if (type === 'teach') selectedTeachSkill = skill;
          else selectedLearnSkill = skill;
        };
        resEl.appendChild(div);
      });
      resEl.classList.add('open');
    } else {
      resEl.classList.remove('open');
    }
  }, 300);
}

async function addTeachSkill() {
  if (!selectedTeachSkill) return;
  const prof = document.getElementById('teach-skill-prof').value;

  const { data: exist } = await supabaseClient.from('user_skills_teach')
    .select('id').eq('user_id', currentUser.id).eq('skill_id', selectedTeachSkill.id);

  if (exist && exist.length > 0) {
    showToast('You already added this teaching skill', 'error');
    return;
  }

  const { error } = await supabaseClient.from('user_skills_teach').insert({
    user_id: currentUser.id,
    skill_id: selectedTeachSkill.id,
    proficiency: prof
  });

  if (error) {
    showToast('Error adding skill', 'error');
  } else {
    showToast('Teaching skill added', 'success');
    document.getElementById('search-teach-skill').value = '';
    document.getElementById('btn-add-teach').disabled = true;
    selectedTeachSkill = null;
    await refreshTeachSkills();
  }
}

async function addLearnSkill() {
  if (!selectedLearnSkill) return;

  const { data: exist } = await supabaseClient.from('user_skills_learn')
    .select('id').eq('user_id', currentUser.id).eq('skill_id', selectedLearnSkill.id);

  if (exist && exist.length > 0) {
    showToast('You already added this learning skill', 'error');
    return;
  }

  const { error } = await supabaseClient.from('user_skills_learn').insert({
    user_id: currentUser.id,
    skill_id: selectedLearnSkill.id,
    is_active: true
  });

  if (error) {
    showToast('Error adding skill', 'error');
  } else {
    showToast('Learning skill added', 'success');
    document.getElementById('search-learn-skill').value = '';
    document.getElementById('btn-add-learn').disabled = true;
    selectedLearnSkill = null;
    await refreshLearnSkills();
  }
}

// Global hooks for inline remove/toggle buttons
window.deleteTeachSkill = async function(id) {
  await supabaseClient.from('user_skills_teach').delete().eq('id', id).eq('user_id', currentUser.id);
  refreshTeachSkills();
};

window.deleteLearnSkill = async function(id) {
  await supabaseClient.from('user_skills_learn').delete().eq('id', id).eq('user_id', currentUser.id);
  refreshLearnSkills();
};

window.toggleLearnActive = async function(id, currentActive) {
  await supabaseClient.from('user_skills_learn').update({ is_active: !currentActive }).eq('id', id).eq('user_id', currentUser.id);
  refreshLearnSkills();
};

async function refreshTeachSkills() {
  const list = document.getElementById('teach-manager-list');
  if (!list) return;
  const { data } = await supabaseClient.from('user_skills_teach')
    .select('*, skill:skills(name, category)').eq('user_id', currentUser.id);

  list.innerHTML = '';
  if (!data || data.length === 0) {
    list.innerHTML = `<div class="text-hint">No teaching skills added yet.</div>`;
    return;
  }

  data.forEach(item => {
    list.innerHTML += `
      <div class="manager-item">
        <div>
          <div class="fw-600">${item.skill?.name}</div>
          <div style="font-size:0.85rem;color:var(--color-text-secondary);">${item.proficiency}</div>
        </div>
        <button class="btn btn-ghost danger" style="padding:6px 12px;" onclick="window.deleteTeachSkill('${item.id}')">Remove</button>
      </div>`;
  });
}

async function refreshLearnSkills() {
  const list = document.getElementById('learn-manager-list');
  if (!list) return;
  const { data } = await supabaseClient.from('user_skills_learn')
    .select('*, skill:skills(name)').eq('user_id', currentUser.id);

  list.innerHTML = '';
  if (!data || data.length === 0) {
    list.innerHTML = `<div class="text-hint">No learning skills added yet.</div>`;
    return;
  }

  data.forEach(item => {
    list.innerHTML += `
      <div class="manager-item">
        <div class="fw-600">${item.skill?.name}</div>
        <div style="display:flex;align-items:center;gap:16px;">
          <label class="toggle-switch" title="Actively Looking">
            <input type="checkbox" ${item.is_active ? 'checked' : ''} onchange="window.toggleLearnActive('${item.id}', ${item.is_active})">
            <span class="toggle-slider"></span>
          </label>
          <button class="btn btn-ghost danger" style="padding:6px 12px;" onclick="window.deleteLearnSkill('${item.id}')">Remove</button>
        </div>
      </div>`;
  });
}

// ─────────────────────────────────────────────────
// Availability Grid (ported from profile.js)
// ─────────────────────────────────────────────────

function renderAvailabilityGrid(availabilityData) {
  const grid = document.getElementById('availability-grid');
  if (!grid) return;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const slots = ['morning', 'afternoon', 'evening', 'night'];
  const slotLabels = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night' };

  let html = `<div class="avail-header"></div>`;
  days.forEach(day => html += `<div class="avail-header">${day}</div>`);

  slots.forEach(slot => {
    html += `<div class="avail-row-label">${slotLabels[slot]}</div>`;
    days.forEach(dayStr => {
      const cellData = availabilityData.find(a => a.day_of_week === dayStr && a.slot === slot);
      const isAvailable = cellData ? cellData.is_available : false;
      const availClass = isAvailable ? 'available' : '';
      html += `<div class="avail-cell ${availClass} interactive" onclick="window.toggleAvailability('${dayStr}', '${slot}', ${isAvailable})"></div>`;
    });
  });

  grid.innerHTML = html;
}

window.toggleAvailability = async function(day, slot, currentVal) {
  await supabaseClient.from('availability').upsert({
    user_id: currentUser.id,
    day_of_week: day,
    slot: slot,
    is_available: !currentVal
  }, { onConflict: 'user_id,day_of_week,slot' });

  const { data: avail } = await supabaseClient.from('availability').select('*').eq('user_id', currentUser.id);
  renderAvailabilityGrid(avail || []);
};

// ─────────────────────────────────────────────────
// Account Section
// ─────────────────────────────────────────────────

function initAccountSection() {
  document.getElementById('settings-email').value = currentUser.email || '';
  document.getElementById('settings-name').value = currentProfile.full_name || '';
  document.getElementById('settings-college').value = currentProfile.college || '';
  document.getElementById('settings-department').value = currentProfile.department || '';
  document.getElementById('settings-year').value = currentProfile.year_of_study || '';
  document.getElementById('settings-mobile').value = currentProfile.mobile || '';
  document.getElementById('settings-bio').value = currentProfile.bio || '';

  const bioInput = document.getElementById('settings-bio');
  const bioCounter = document.getElementById('bio-counter');
  bioInput.addEventListener('input', () => {
    bioCounter.textContent = `${bioInput.value.length} / 300`;
  });
  bioCounter.textContent = `${bioInput.value.length} / 300`;

  document.getElementById('account-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-account');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const updates = {
      full_name:    document.getElementById('settings-name').value.trim(),
      college:      document.getElementById('settings-college').value.trim(),
      department:   document.getElementById('settings-department').value.trim(),
      year_of_study: document.getElementById('settings-year').value.trim(),
      mobile:       document.getElementById('settings-mobile').value.trim(),
      bio:          document.getElementById('settings-bio').value.trim(),
      updated_at:   new Date().toISOString()
    };

    const { error } = await supabaseClient.from('profiles').update(updates).eq('id', currentUser.id);

    btn.disabled = false;
    btn.textContent = 'Save Changes';

    if (error) {
      showToast('Error saving account', 'error');
    } else {
      showToast('Settings saved!', 'success');
      Object.assign(currentProfile, updates);
      initNavbar();
    }
  });
}

// ─────────────────────────────────────────────────
// Security Section
// ─────────────────────────────────────────────────

function initSecuritySection() {
  document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPw = document.getElementById('pw-new').value;
    const confPw = document.getElementById('pw-confirm').value;

    if (newPw !== confPw) {
      showToast('Passwords do not match', 'error');
      return;
    }

    const btn = document.getElementById('btn-update-password');
    btn.disabled = true;
    btn.textContent = 'Updating...';

    const { error } = await supabaseClient.auth.updateUser({ password: newPw });

    btn.disabled = false;
    btn.textContent = 'Update Password';

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Password updated successfully!', 'success');
      document.getElementById('password-form').reset();
    }
  });

  document.getElementById('settings-signout-btn').addEventListener('click', () => signOut());
}

// ─────────────────────────────────────────────────
// Notifications Section
// ─────────────────────────────────────────────────

function initNotificationsSection() {
  const prefsStr = localStorage.getItem('skillnest_notif_prefs');
  let prefs = {};
  if (prefsStr) {
    try { prefs = JSON.parse(prefsStr); } catch (e) {}
  } else {
    notifKeys.forEach(k => prefs[k.id] = true);
  }

  const notifContainer = document.getElementById('notif-toggles');
  notifKeys.forEach(k => {
    const isChecked = prefs[k.id] !== false;
    notifContainer.innerHTML += `
      <div style="display:flex; justify-content:space-between; align-items:center; padding: 16px 0; border-bottom: 1px solid var(--color-border);">
        <div>
          <div style="font-weight: 500; color: var(--color-text-primary);">${k.label}</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="pref-${k.id}" ${isChecked ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    `;
  });

  document.getElementById('btn-save-notifs').addEventListener('click', () => {
    const newPrefs = {};
    notifKeys.forEach(k => {
      newPrefs[k.id] = document.getElementById(`pref-${k.id}`).checked;
    });
    localStorage.setItem('skillnest_notif_prefs', JSON.stringify(newPrefs));
    showToast('Preferences saved', 'success');
  });
}

// ─────────────────────────────────────────────────
// Danger Zone
// ─────────────────────────────────────────────────

function initDangerZone() {
  const modal = document.getElementById('delete-modal');
  const deleteBtn = document.getElementById('btn-delete-account');
  const cancelBtn = document.getElementById('btn-cancel-delete');
  const confirmBtn = document.getElementById('btn-confirm-delete');
  const confirmInput = document.getElementById('delete-confirm-input');

  deleteBtn.addEventListener('click', () => {
    modal.classList.add('open');
    confirmInput.value = '';
    confirmBtn.disabled = true;
    confirmInput.focus();
  });

  cancelBtn.addEventListener('click', () => {
    modal.classList.remove('open');
  });

  confirmInput.addEventListener('input', () => {
    confirmBtn.disabled = confirmInput.value !== 'DELETE';
  });

  confirmBtn.addEventListener('click', async () => {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';
    try {
      await supabaseClient.from('profiles').delete().eq('id', currentUser.id);
      await supabaseClient.auth.signOut();
      window.location.href = 'index.html';
    } catch (err) {
      showToast('Error deleting account', 'error');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Delete Account';
      modal.classList.remove('open');
    }
  });
}

// ─────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────
init();
