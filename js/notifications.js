import { supabaseClient, requireAuth, getCurrentProfile, signOut, initOnlineTracking, getTotalUnreadCount } from './supabase.js';
import { showToast } from './utils.js';

let currentUser = null;
let currentProfile = null;
let notifications = [];
let filteredNotifications = [];
let currentFilter = 'all';

async function init() {
  currentUser = await requireAuth();
  if (!currentUser) return;
  initOnlineTracking();

  currentProfile = await getCurrentProfile();
  if (!currentProfile) { window.location.href = 'login.html'; return; }

  initNavbar();
  initTabs();
  
  document.getElementById('page-wrapper').style.visibility = 'visible';
  document.getElementById('page-loader')?.classList.add('hidden');

  await loadAndRender();

  // Realtime
  supabaseClient
    .channel(`notifications-${currentUser.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${currentUser.id}`
    }, () => {
      loadAndRender();
    })
    .subscribe();

  document.getElementById('btn-mark-all-read').addEventListener('click', markAllAsRead);
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

function initTabs() {
  const tabs = document.querySelectorAll('.tab-item');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      applyFilterAndRender();
    });
  });
}

async function loadNotifications() {
  const { data, error } = await supabaseClient
    .from('notifications')
    .select(`
      *,
      actor:profiles!notifications_actor_id_fkey(id, full_name, avatar_url)
    `)
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

async function loadAndRender() {
  try {
    notifications = await loadNotifications();
    applyFilterAndRender();
    updateBellBadge();
  } catch (err) {
    console.error('Error loading notifications', err);
    showToast('Failed to load notifications', 'error');
  }
}

function applyFilterAndRender() {
  if (currentFilter === 'all') {
    filteredNotifications = notifications;
  } else if (currentFilter === 'unread') {
    filteredNotifications = notifications.filter(n => !n.is_read);
  } else if (currentFilter === 'sessions') {
    filteredNotifications = notifications.filter(n => n.type && n.type.startsWith('session_'));
  }

  const listEl = document.getElementById('notifications-list');
  const emptyEl = document.getElementById('empty-state');
  const markAllBtn = document.getElementById('btn-mark-all-read');

  const hasUnread = notifications.some(n => !n.is_read);
  markAllBtn.style.display = hasUnread ? 'block' : 'none';

  if (filteredNotifications.length === 0) {
    listEl.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }

  listEl.style.display = 'block';
  emptyEl.style.display = 'none';

  listEl.innerHTML = filteredNotifications.map(n => renderNotificationRow(n)).join('');

  listEl.querySelectorAll('.notification-item').forEach(el => {
    el.addEventListener('click', () => handleNotifClick(el.dataset.id, el.dataset.link));
  });
}

function renderNotificationRow(n) {
  const isRead = n.is_read;
  const timeStr = formatTimeAgo(n.created_at);

  let iconHtml = '';
  let iconBgColor = 'var(--color-secondary)';
  
  if (n.actor && n.actor.avatar_url) {
    iconHtml = `<img src="${n.actor.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  } else if (n.actor && n.actor.full_name) {
    const initStr = n.actor.full_name.trim().split(/\s+/).slice(0, 2).map(x => x[0].toUpperCase()).join('');
    iconHtml = initStr;
    iconBgColor = 'var(--color-primary-light)';
  } else {
    // Generate system icon based on type
    let sysIcon = '🔔', sysColor = 'var(--color-primary-light)';
    switch (n.type) {
      case 'session_request': sysIcon = '📅'; sysColor = '#E0F2FE'; break; // blue
      case 'session_confirmed': sysIcon = '✅'; sysColor = '#DCFCE7'; break; // green
      case 'session_cancelled': sysIcon = '❌'; sysColor = '#FEE2E2'; break; // red
      case 'session_completed': sysIcon = '🎓'; sysColor = '#E0E7FF'; break; // navy/indigo
      case 'message_received': sysIcon = '💬'; sysColor = '#E0F2FE'; break;
      case 'rating_received': sysIcon = '⭐'; sysColor = '#FEF3C7'; break; // amber
      case 'credit_earned': sysIcon = '✦'; sysColor = '#F3E8FF'; break; // purple
      case 'credit_spent': sysIcon = '✦'; sysColor = '#FEE2E2'; break; // red
      case 'endorsement_received': sysIcon = '👍'; sysColor = '#CCFBF1'; break; // teal
      case 'new_match': sysIcon = '🎯'; sysColor = '#DCFCE7'; break;
      case 'streak_milestone': sysIcon = '🔥'; sysColor = '#FFEDD5'; break; // orange
      default: sysIcon = '🔔'; sysColor = '#F3F4F6';
    }
    iconHtml = sysIcon;
    iconBgColor = sysColor;
  }

  return `
    <div class="notification-item ${isRead ? 'read' : 'unread'}" data-id="${n.id}" data-link="${n.link_url || ''}">
      <div class="notification-icon" style="background-color: ${iconBgColor}; color: var(--color-text-primary);">
        ${iconHtml}
      </div>
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 4px; color: var(--color-text-primary);">${escapeHtml(n.title)}</div>
        <div style="font-size: 0.85rem; color: var(--color-text-secondary); line-height: 1.4; margin-bottom: 6px;">${escapeHtml(n.body)}</div>
        <div style="font-size: 0.75rem; color: var(--color-text-hint);">${timeStr}</div>
      </div>
    </div>
  `;
}

async function handleNotifClick(notifId, linkUrl) {
  try {
    await markAsRead(notifId);
    if (linkUrl) {
      window.location.href = linkUrl;
    } else {
      loadAndRender(); // Just refresh visually
    }
  } catch (err) {
    console.error('Click handle error', err);
  }
}

async function markAsRead(notificationId) {
  // Opt UI update
  const n = notifications.find(x => x.id === notificationId);
  if (n && !n.is_read) {
    n.is_read = true;
    updateBellBadge();
  }

  await supabaseClient
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', currentUser.id);
}

async function markAllAsRead() {
  const unsetIds = notifications.filter(n => !n.is_read).map(n => n.id);
  if (unsetIds.length === 0) return;

  // Opt UI
  notifications.forEach(n => { n.is_read = true; });
  applyFilterAndRender();
  updateBellBadge();

  await supabaseClient
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', currentUser.id)
    .eq('is_read', false);
    
  showToast('All notifications marked as read', 'success');
  loadAndRender();
}

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

init();
