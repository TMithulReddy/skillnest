/**
 * SkillNest Utilities
 * Shared functions used across all page scripts.
 */

// ─────────────────────────────────────────────────
// Toast Notifications
// ─────────────────────────────────────────────────

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', or 'info'
 */
export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  } else {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }

  const title = type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice';

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" aria-label="Close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  const hideToast = () => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  };

  toast.querySelector('.toast-close').addEventListener('click', hideToast);
  setTimeout(hideToast, 5000);
}

// ─────────────────────────────────────────────────
// Date / Time Formatting
// ─────────────────────────────────────────────────

export function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric',
    month: 'long', day: 'numeric'
  });
}

export function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ─────────────────────────────────────────────────
// Credit Utilities
// ─────────────────────────────────────────────────

export function formatCredits(amount) {
  const sign = amount >= 0 ? '+' : '';
  return `${sign}${Number(amount).toLocaleString()} ✦`;
}

/** Credit economy constants */
export const CREDITS_PER_HOUR_COST = 1250;   // learner pays per hour
export const CREDITS_PER_HOUR_EARN = 2000;   // teacher earns per hour

/**
 * Calculate credits for a session of given duration.
 * @param {number} durationMins
 * @returns {{ cost: number, earned: number }}
 */
export function calculateCredits(durationMins) {
  const hours = durationMins / 60;
  return {
    cost:   Math.round(CREDITS_PER_HOUR_COST * hours),
    earned: Math.round(CREDITS_PER_HOUR_EARN * hours)
  };
}

// ─────────────────────────────────────────────────
// Shared Navbar Initialiser
// ─────────────────────────────────────────────────

/**
 * Populates navbar avatar, credit balance, and bell badge.
 * Call once per page after profile is loaded.
 *
 * @param {object} supabaseClient
 * @param {object} currentProfile  — profile row from Supabase
 * @param {Function} getTotalUnreadCount  — imported from supabase.js
 */
export async function initNavbar(supabaseClient, currentProfile, getTotalUnreadCount) {
  // Avatar
  const avatarEl = document.getElementById('nav-avatar');
  if (avatarEl) {
    if (currentProfile.avatar_url) {
      avatarEl.innerHTML = `<img src="${currentProfile.avatar_url}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      const initials = (currentProfile.full_name || '?')
        .trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase();
      avatarEl.textContent = initials;
    }
  }

  // Credit balance
  const balanceEl = document.querySelector('#nav-credit-link .js-credit-balance');
  if (balanceEl) {
    balanceEl.textContent = Number(currentProfile.credit_balance ?? 0).toLocaleString();
  }

  // Bell badge
  const badgeEl = document.getElementById('nav-bell-badge');
  if (badgeEl && getTotalUnreadCount) {
    try {
      const count = await getTotalUnreadCount(currentProfile.id);
      if (count > 0) {
        badgeEl.textContent = count > 99 ? '99+' : count;
        badgeEl.style.display = 'flex';
      } else {
        badgeEl.textContent = '';
        badgeEl.style.display = 'none';
      }
    } catch (e) {
      console.warn('Bell badge update failed:', e);
    }
  }

  // Dropdown toggle
  const avatarBtn = document.getElementById('nav-avatar-btn');
  const dropdown  = document.getElementById('nav-dropdown');
  if (avatarBtn && dropdown && !avatarBtn._navInit) {
    avatarBtn._navInit = true;
    avatarBtn.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.toggle('open'); });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }
}
