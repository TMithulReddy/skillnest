import { supabaseClient, requireAuth, getCurrentProfile, signOut, initOnlineTracking, getTotalUnreadCount } from './supabase.js';
import { showToast } from './utils.js';

let currentUser = null;
let currentProfile = null;
let ledgerData = [];
let filteredData = [];

const eventLabels = {
  signup_bonus: 'Welcome Bonus',
  profile_completion: 'Profile Completed',
  session_teach: 'Session Taught',
  escrow_hold: 'Credits Reserved',
  escrow_release: 'Credits Released',
  escrow_refund: 'Refund Received',
  five_star_rating: '5-Star Bonus',
  login_streak: 'Login Streak',
  endorsement_given: 'Endorsed a Peer',
  referral_bonus: 'Referral Bonus',
  milestone_bonus: 'Milestone Bonus',
  admin_adjustment: 'Admin Adjustment'
};

async function init() {
  currentUser = await requireAuth();
  if (!currentUser) return;
  initOnlineTracking();

  currentProfile = await getCurrentProfile();
  if (!currentProfile) { window.location.href = 'login.html'; return; }

  initNavbar();
  
  document.getElementById('page-wrapper').style.visibility = 'visible';
  document.getElementById('page-loader')?.classList.add('hidden');

  await loadData();

  // Filters
  document.getElementById('filter-type').addEventListener('change', applyFilters);
  document.getElementById('filter-date').addEventListener('change', applyFilters);

  // Realtime balance
  supabaseClient
    .channel(`credits-balance-${currentUser.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${currentUser.id}`
    }, (payload) => {
      updateBalanceDisplay(payload.new.credit_balance);
      currentProfile.credit_balance = payload.new.credit_balance;
    })
    .subscribe();
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

  updateBalanceDisplay(currentProfile.credit_balance || 0);
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

function updateBalanceDisplay(balance) {
  const navBalance = document.getElementById('nav-credit-link')?.querySelector('.js-credit-balance');
  if (navBalance) navBalance.textContent = Number(balance).toLocaleString();
  
  const statBalance = document.getElementById('stat-balance');
  if (statBalance) statBalance.textContent = Number(balance).toLocaleString();
}

async function loadData() {
  const { data, error } = await supabaseClient
    .from('credit_ledger')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Ledger fetch error:', error);
    showToast('Failed to load transaction history', 'error');
    return;
  }
  
  ledgerData = data || [];
  
  // Calculate summary stat cards
  const totalEarned = ledgerData.filter(r => r.amount > 0).reduce((sum, r) => sum + r.amount, 0);
  const totalSpent = ledgerData.filter(r => r.amount < 0).reduce((sum, r) => sum + Math.abs(r.amount), 0);
  const teachingEarned = ledgerData.filter(r => r.event_type === 'session_teach').reduce((sum, r) => sum + r.amount, 0);
  
  document.getElementById('stat-earned').textContent = '+ ' + Number(totalEarned).toLocaleString() + ' ✦';
  document.getElementById('stat-spent').textContent = '− ' + Number(totalSpent).toLocaleString() + ' ✦';
  document.getElementById('stat-teaching').textContent = Number(teachingEarned).toLocaleString() + ' ✦';
  
  applyFilters();
}

function applyFilters() {
  const fType = document.getElementById('filter-type').value;
  const fDate = document.getElementById('filter-date').value;
  
  let res = [...ledgerData];
  
  // Type filter
  if (fType === 'earned') res = res.filter(r => r.amount > 0);
  else if (fType === 'spent') res = res.filter(r => r.amount < 0);
  else if (fType === 'teaching') res = res.filter(r => r.event_type === 'session_teach');
  else if (fType === 'learning') res = res.filter(r => r.event_type === 'escrow_hold' || r.event_type === 'escrow_release');
  else if (fType === 'bonuses') res = res.filter(r => r.event_type.includes('bonus') || r.event_type === 'login_streak' || r.event_type === 'profile_completion');
  
  // Date filter
  const now = new Date();
  if (fDate === 'week') {
    const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    res = res.filter(r => new Date(r.created_at) >= oneWeekAgo);
  } else if (fDate === 'month') {
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    res = res.filter(r => new Date(r.created_at) >= oneMonthAgo);
  }
  
  filteredData = res;
  renderTable();
}

function renderTable() {
  const table = document.getElementById('ledger-table');
  const tbody = document.getElementById('ledger-body');
  const empty = document.getElementById('empty-state');
  
  if (filteredData.length === 0) {
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  
  table.style.display = 'table';
  empty.style.display = 'none';
  
  tbody.innerHTML = filteredData.map(r => {
    const isPos = r.amount > 0;
    const isNeg = r.amount < 0;
    const amountStr = isPos ? `+${r.amount} ✦` : (isNeg ? `−${Math.abs(r.amount)} ✦` : `0 ✦`);
    const amountClass = isPos ? 'amount-positive' : (isNeg ? 'amount-negative' : '');
    
    // Nice date format: "Oct 24, 2026, 2:30 PM"
    const dateOpts = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' };
    const dateStr = new Date(r.created_at).toLocaleDateString('en-US', dateOpts);
    
    const label = eventLabels[r.event_type] || r.event_type;
    const rowClick = r.session_id ? `onclick="window.location.href='sessions.html'"` : '';
    
    return `
      <tr ${rowClick}>
        <td style="color:var(--color-text-secondary); white-space:nowrap;">${dateStr}</td>
        <td style="font-weight:500;">${escapeHtml(label)}</td>
        <td style="color:var(--color-text-secondary); max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(r.description || '')}">${escapeHtml(r.description || '')}</td>
        <td class="${amountClass}" style="text-align:right;">${amountStr}</td>
        <td style="text-align:right; color:var(--color-text-secondary);">${Number(r.balance_after).toLocaleString()} ✦</td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

init();
