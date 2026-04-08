import { supabaseClient, requireAuth, getCurrentProfile, signOut, initOnlineTracking, getTotalUnreadCount } from './supabase.js';
import { showToast } from './utils.js';

let currentUser = null;
let currentProfile = null;

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

async function init() {
  currentUser = await requireAuth();
  if (!currentUser) return;
  initOnlineTracking();

  currentProfile = await getCurrentProfile();
  if (!currentProfile) { window.location.href = 'login.html'; return; }

  initNavbar();
  
  // Section Navigation
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

  // Account Form
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
      full_name: document.getElementById('settings-name').value.trim(),
      college: document.getElementById('settings-college').value.trim(),
      department: document.getElementById('settings-department').value.trim(),
      year_of_study: document.getElementById('settings-year').value.trim(),
      mobile: document.getElementById('settings-mobile').value.trim(),
      bio: document.getElementById('settings-bio').value.trim(),
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabaseClient.from('profiles').update(updates).eq('id', currentUser.id);
    
    btn.disabled = false;
    btn.textContent = 'Save Changes';
    
    if (error) {
      showToast('Error saving account', 'error');
    } else {
      showToast('Settings saved!', 'success');
      // Update local profile copy and navbar avatar initials if changed
      Object.assign(currentProfile, updates);
      initNavbar();
    }
  });

  // Security Form
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

  // Notifications
  const prefsStr = localStorage.getItem('skillnest_notif_prefs');
  let prefs = {};
  if (prefsStr) {
    try { prefs = JSON.parse(prefsStr); } catch (e) {}
  } else {
    notifKeys.forEach(k => prefs[k.id] = true);
  }

  const notifContainer = document.getElementById('notif-toggles');
  notifKeys.forEach(k => {
    const isChecked = prefs[k.id] !== false; // Default to true if missing
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

  // Danger Zone
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

  document.getElementById('page-wrapper').style.visibility = 'visible';
  document.getElementById('page-loader')?.classList.add('hidden');
}

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
    // Basic dropdown link setup (refreshing it to be safe)
    avatarBtn.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.toggle('open'); });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }

  document.getElementById('nav-signout-btn')?.addEventListener('click', () => signOut());
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

init();
