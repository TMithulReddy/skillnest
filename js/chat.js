import { supabaseClient, requireAuth, getCurrentProfile, signOut, initOnlineTracking, getTotalUnreadCount } from './supabase.js';
import { showToast } from './utils.js';

// ─────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────

let currentUser       = null;
let currentProfile    = null;
let conversations     = [];
let filteredConvs     = [];
let activeConversationId = null;
let activeConversation   = null;
let messages          = [];
let messageChannel    = null; // Supabase realtime channel for current conversation
let typingChannel     = null;
let typingTimeout     = null;
let isShowingTyping   = false;
let newConvSearchTimeout = null;
let msgSearchTimeout  = null;

const EMOJIS = ['😊','😂','❤️','👍','👏','🙌','🔥','✨','🎉','💡','🤝','📚','🎓','💪','😎','🙏','💬','✅','⭐','🚀'];

// ─────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────

function chatGetInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(n => n[0].toUpperCase()).join('');
}

function chatRenderAvatar(fullName, avatarUrl, sizeClass = 'avatar-sm') {
  if (avatarUrl) {
    return `<span class="avatar ${sizeClass}"><img src="${avatarUrl}" alt="${fullName}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></span>`;
  }
  return `<span class="avatar ${sizeClass}">${chatGetInitials(fullName)}</span>`;
}

function chatFormatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60)     return 'now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function chatFormatMsgTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function chatFormatDateDivider(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today - 86400000);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (+msgDate === +today)     return 'Today';
  if (+msgDate === +yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getOtherPerson(conversation) {
  return conversation.user_a === currentUser.id
    ? conversation.user_b_profile
    : conversation.user_a_profile;
}

function getUnreadCount(conversation) {
  return conversation.user_a === currentUser.id
    ? (conversation.unread_a ?? 0)
    : (conversation.unread_b ?? 0);
}

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
  initInput();
  initEmojiPicker();
  initNewConvModal();
  initMobileNav();
  initMessageSearch();

  document.getElementById('page-wrapper').style.visibility = 'visible';
  document.getElementById('page-loader')?.classList.add('hidden');

  // Start realtime conversation list subscription
  subscribeToConversations();

  // Load conversations
  await loadAndRenderConversations();

  // Handle ?user= URL param — open or create conversation
  const params = new URLSearchParams(window.location.search);
  const targetUserId = params.get('user');
  if (targetUserId && targetUserId !== currentUser.id) {
    await openOrCreateConversation(targetUserId);
  }

  // Page-unload cleanup
  window.addEventListener('beforeunload', () => {
    if (messageChannel) supabaseClient.removeChannel(messageChannel);
    if (typingChannel)  supabaseClient.removeChannel(typingChannel);
  });
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
      navAvatarEl.textContent = chatGetInitials(currentProfile.full_name);
    }
  }

  updateNavCredit(currentProfile.credit_balance ?? 0);
  updateBellBadge();

  const avatarBtn = document.getElementById('nav-avatar-btn');
  const dropdown  = document.getElementById('nav-dropdown');
  if (avatarBtn && dropdown) {
    avatarBtn.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.toggle('open'); });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }

  document.getElementById('nav-signout-btn')?.addEventListener('click', () => signOut());
}

function updateNavCredit(balance) {
  const el = document.getElementById('nav-credit-link')?.querySelector('.js-credit-balance');
  if (el) el.textContent = Number(balance).toLocaleString();
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
// Conversations
// ─────────────────────────────────────────────────

async function loadConversations() {
  const { data, error } = await supabaseClient
    .from('conversations')
    .select(`
      *,
      user_a_profile:profiles!conversations_user_a_fkey(id, full_name, avatar_url, is_online, college, department),
      user_b_profile:profiles!conversations_user_b_fkey(id, full_name, avatar_url, is_online, college, department)
    `)
    .or(`user_a.eq.${currentUser.id},user_b.eq.${currentUser.id}`)
    .order('last_msg_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data || [];
}

async function loadAndRenderConversations() {
  try {
    conversations = await loadConversations();
    filteredConvs = conversations;
  } catch (err) {
    console.error('Load conversations error:', err.message);
    conversations = [];
    filteredConvs = [];
  }
  renderConversationsList(filteredConvs);
}

function renderConversationsList(list) {
  const container = document.getElementById('conversations-list');
  document.getElementById('conv-skeleton').style.display = 'none';

  // When globally empty (not just filtered), also update the main panel empty state
  if (conversations.length === 0) {
    showGlobalEmptyState();
  }

  if (!list || list.length === 0) {
    container.innerHTML = `<div class="conv-empty-state">
      <div style="font-size:2rem;margin-bottom:8px;">💬</div>
      <div>${conversations.length === 0 ? 'No conversations yet.' : 'No results found.'}</div>
      <div style="margin-top:8px;">${conversations.length === 0 ? 'Browse peers and click Send Message to start chatting!' : 'Try a different name.'}</div>
      ${conversations.length === 0 ? '<div style="margin-top:12px;"><a href="browse.html" class="btn btn-primary" style="font-size:13px;padding:8px 16px;">Browse Peers</a></div>' : ''}
    </div>`;
    return;
  }

  container.innerHTML = list.map(conv => renderConversationItem(conv)).join('');

  // Wire click handlers
  container.querySelectorAll('.conversation-item').forEach(el => {
    el.addEventListener('click', () => {
      const cid = el.dataset.convId;
      openConversation(cid);
    });
  });
}

function renderConversationItem(conv) {
  const other   = getOtherPerson(conv);
  const unread  = getUnreadCount(conv);
  const isActive = conv.id === activeConversationId;

  const preview = conv.last_message
    ? (conv.last_message.length > 40 ? conv.last_message.slice(0, 40) + '…' : conv.last_message)
    : 'Start a conversation';

  return `
    <div class="conversation-item${isActive ? ' active' : ''}" data-conv-id="${conv.id}" role="button" tabindex="0">
      <div class="conv-avatar-wrap">
        ${chatRenderAvatar(other?.full_name, other?.avatar_url, 'avatar-md')}
        ${other?.is_online ? '<span class="online-dot" style="position:absolute;bottom:0;right:0;width:10px;height:10px;"></span>' : ''}
      </div>
      <div class="conv-info">
        <div class="conv-name${unread > 0 ? ' unread' : ''}">${other?.full_name || 'Unknown'}</div>
        <div class="conv-preview${unread > 0 ? ' unread' : ''}">${preview}</div>
      </div>
      <div class="conv-meta">
        <span class="conv-time">${chatFormatTime(conv.last_msg_at)}</span>
        ${unread > 0 ? `<span class="unread-badge">${unread > 99 ? '99+' : unread}</span>` : ''}
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────
// Open / Create Conversation
// ─────────────────────────────────────────────────

async function openOrCreateConversation(otherUserId) {
  // Check if conversation already exists
  const { data: existing } = await supabaseClient
    .from('conversations')
    .select('*')
    .or(
      `and(user_a.eq.${currentUser.id},user_b.eq.${otherUserId}),` +
      `and(user_a.eq.${otherUserId},user_b.eq.${currentUser.id})`
    )
    .single();

  if (existing) {
    openConversation(existing.id);
    return;
  }

  // Create new conversation
  const { data: newConv, error } = await supabaseClient
    .from('conversations')
    .insert({ user_a: currentUser.id, user_b: otherUserId })
    .select()
    .single();

  if (error) { showToast('Could not start conversation', 'error'); return; }

  await loadAndRenderConversations();
  openConversation(newConv.id);
}

async function openConversation(conversationId) {
  activeConversationId = conversationId;

  // Find conversation in local state; re-fetch if not found (e.g. newly created)
  activeConversation = conversations.find(c => c.id === conversationId);
  if (!activeConversation) {
    await loadAndRenderConversations();
    activeConversation = conversations.find(c => c.id === conversationId);
  }
  if (!activeConversation) return;

  const other = getOtherPerson(activeConversation);

  // Update sidebar highlight
  document.querySelectorAll('.conversation-item').forEach(el => {
    el.classList.toggle('active', el.dataset.convId === conversationId);
  });

  // Show chat panel
  document.getElementById('chat-no-selection').style.display = 'none';
  const area = document.getElementById('active-chat-area');
  area.style.display = 'flex';

  // Populate header
  document.getElementById('header-avatar-wrap').innerHTML =
    `${chatRenderAvatar(other?.full_name, other?.avatar_url, 'avatar-md')}
     <span class="online-dot" style="position:absolute;bottom:0;right:0;${other?.is_online ? '' : 'display:none;'}"></span>`;

  const headerName = document.getElementById('header-name');
  headerName.textContent = other?.full_name || '—';
  headerName.href = `profile.html?id=${other?.id}`;

  const subText = [other?.college, other?.department].filter(Boolean).join(' · ');
  const headerStatus = document.getElementById('header-status');
  headerStatus.textContent = other?.is_online ? '● Online now' : subText || 'Last seen recently';
  headerStatus.className = `chat-header-status ${other?.is_online ? 'online' : 'offline'}`;

  document.getElementById('header-view-profile').href = `profile.html?id=${other?.id}`;
  document.getElementById('header-request-session').onclick = () => {
    window.location.href = `browse.html?user=${other?.id}`;
  };

  // Load messages
  showMessagesLoading(true);
  messages = await loadMessages(conversationId);
  showMessagesLoading(false);
  renderMessages();
  scrollToBottom();

  // Update conversation list (clears unread badge)
  await loadAndRenderConversations();
  updateBellBadge();

  // Subscribe to new messages in this conversation
  subscribeToMessages(conversationId);

  // Start typing indicator for this conversation
  initTypingIndicator(conversationId, other?.full_name || 'them');

  // Mobile: slide chat panel in
  document.getElementById('chat-sidebar').classList.add('hidden-mobile');
  document.getElementById('chat-main').classList.add('visible-mobile');

  // Focus input
  document.getElementById('message-input').focus();
}

// ─────────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────────

async function loadMessages(conversationId) {
  const { data, error } = await supabaseClient
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Mark read
  await markMessagesRead(conversationId);
  return data || [];
}

async function markMessagesRead(conversationId) {
  // Guard: need activeConversation set
  const conv = activeConversation || conversations.find(c => c.id === conversationId);
  if (!conv) return;

  await supabaseClient
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', currentUser.id)
    .eq('is_read', false);

  const unreadField = conv.user_a === currentUser.id ? 'unread_a' : 'unread_b';
  await supabaseClient
    .from('conversations')
    .update({ [unreadField]: 0 })
    .eq('id', conversationId);
}

function renderMessages() {
  const area = document.getElementById('messages-area');
  if (!messages || messages.length === 0) {
    const other = activeConversation ? getOtherPerson(activeConversation) : null;
    const name = other?.full_name || 'them';
    area.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:40px;">
        ${chatRenderAvatar(other?.full_name, other?.avatar_url, 'avatar-lg')}
        <div style="font-weight:700;font-size:1rem;color:var(--color-text-primary);">Say hello to ${name}! 👋</div>
        <div style="color:var(--color-text-secondary);font-size:0.9rem;">This is the beginning of your conversation.</div>
      </div>`;
    return;
  }

  // Group messages by date, then by sender (for sequential bubble grouping)
  const html = [];
  let lastDate = null;
  let groupSenderId = null;
  let groupBubbles = [];
  let groupIsOwn = false;

  function flushGroup() {
    if (groupBubbles.length === 0) return;
    const isOwn = groupIsOwn;
    const firstMsg = groupBubbles[0];
    const sender = firstMsg.sender;

    const bubblesHtml = groupBubbles.map((msg, idx) => {
      const isFirst = idx === 0;
      const isLast  = idx === groupBubbles.length - 1;
      return renderBubble(msg, isOwn, isFirst, isLast);
    }).join('');

    const avatarHtml = !isOwn
      ? `<div style="flex-shrink:0;align-self:flex-end;">${chatRenderAvatar(sender?.full_name, sender?.avatar_url, 'avatar-sm')}</div>`
      : '';

    html.push(`
      <div class="message-group ${isOwn ? 'own' : 'other'}">
        ${!isOwn && groupBubbles.length > 0 ? `<div class="message-sender-name">${sender?.full_name || ''}</div>` : ''}
        <div class="message-group-inner">
          ${!isOwn ? avatarHtml : ''}
          <div style="display:flex;flex-direction:column;gap:2px;">${bubblesHtml}</div>
        </div>
      </div>`);

    groupBubbles = [];
    groupSenderId = null;
  }

  messages.forEach(msg => {
    // Date divider
    const msgDate = chatFormatDateDivider(msg.created_at);
    if (msgDate !== lastDate) {
      flushGroup();
      html.push(`<div class="date-divider"><span class="date-divider-text">${msgDate}</span></div>`);
      lastDate = msgDate;
    }

    const isOwn = msg.sender_id === currentUser.id;

    // New group if sender changes
    if (msg.sender_id !== groupSenderId) {
      flushGroup();
      groupSenderId = msg.sender_id;
      groupIsOwn = isOwn;
    }

    groupBubbles.push(msg);
  });
  flushGroup();

  area.innerHTML = html.join('');
}

function renderBubble(msg, isOwn, isFirst, isLast) {
  const timeHtml = isLast
    ? `<div class="message-meta">
        <span>${chatFormatMsgTime(msg.created_at)}</span>
        ${isOwn ? '<span class="message-tick">✓</span>' : ''}
       </div>`
    : '';

  if (msg.type === 'session_invite') {
    return renderSessionInviteCard(msg, isOwn, timeHtml);
  }
  if (msg.type === 'meet_link') {
    return renderMeetLinkCard(msg, isOwn, timeHtml);
  }

  // Standard text bubble
  const contentHtml = escapeHtml(msg.content).replace(/\n/g, '<br>');
  return `
    <div class="message-bubble ${isOwn ? 'own' : 'other'}">
      ${contentHtml}
      ${timeHtml}
    </div>`;
}

function renderSessionInviteCard(msg, isOwn, timeHtml) {
  let parsed = {};
  try { parsed = JSON.parse(msg.content); } catch {}

  const statusColors = { pending: 'var(--color-warning)', confirmed: 'var(--color-success)', completed: 'var(--color-primary)', cancelled: 'var(--color-danger)' };
  const statusColor = statusColors[parsed.status] || 'var(--color-text-hint)';

  return `
    <div style="align-self:${isOwn ? 'flex-end' : 'flex-start'}">
      <div class="session-invite-card">
        <div class="session-invite-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Session Invitation
          <span style="margin-left:auto;color:${statusColor};font-size:0.7rem;">${parsed.status || ''}</span>
        </div>
        <div class="session-invite-body">
          <div class="session-invite-skill">${parsed.skill_name || 'Session'}</div>
          ${parsed.scheduled_at ? `<div class="session-invite-detail">📅 ${new Date(parsed.scheduled_at).toLocaleString('en-IN', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</div>` : ''}
          ${parsed.duration_mins ? `<div class="session-invite-detail">⏱ ${parsed.duration_mins} minutes</div>` : ''}
          ${parsed.credits_cost ? `<div class="session-invite-detail">✦ ${Number(parsed.credits_cost).toLocaleString()} credits</div>` : ''}
        </div>
        <a href="sessions.html" class="btn btn-primary" style="font-size:12px;padding:6px 12px;">View Session</a>
      </div>
      ${timeHtml}
    </div>`;
}

function renderMeetLinkCard(msg, isOwn, timeHtml) {
  const url = msg.content;
  const displayUrl = url.replace(/^https?:\/\//, '');

  return `
    <div style="align-self:${isOwn ? 'flex-end' : 'flex-start'}">
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="meet-link-card">
        <div class="meet-link-icon">📹</div>
        <div class="meet-link-info">
          <div class="meet-link-label">Google Meet Link</div>
          <div class="meet-link-url">${displayUrl}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-text-hint);flex-shrink:0;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
      ${timeHtml}
    </div>`;
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

function showMessagesLoading(visible) {
  const area = document.getElementById('messages-area');
  if (visible) {
    area.innerHTML = `
      <div class="messages-skeleton">
        <div style="display:flex;gap:10px;"><div class="skeleton skeleton-avatar" style="width:36px;height:36px;"></div><div class="skeleton skeleton-text" style="width:40%;height:36px;border-radius:18px;"></div></div>
        <div style="display:flex;gap:10px;flex-direction:row-reverse;"><div class="skeleton skeleton-text" style="width:55%;height:36px;border-radius:18px;"></div></div>
        <div style="display:flex;gap:10px;"><div class="skeleton skeleton-avatar" style="width:36px;height:36px;"></div><div class="skeleton skeleton-text" style="width:30%;height:36px;border-radius:18px;"></div></div>
        <div style="display:flex;gap:10px;flex-direction:row-reverse;"><div class="skeleton skeleton-text" style="width:45%;height:36px;border-radius:18px;"></div></div>
      </div>`;
  }
}

// ─────────────────────────────────────────────────
// Append / Replace helpers (Optimistic UI)
// ─────────────────────────────────────────────────

function appendMessage(msg) {
  messages.push(msg);
  renderMessages();
}

function removeTempMessage(tempId) {
  messages = messages.filter(m => m.id !== tempId);
  renderMessages();
}

function replaceTempMessage(tempId, realMsg) {
  const idx = messages.findIndex(m => m.id === tempId);
  if (idx > -1) {
    messages[idx] = { ...realMsg, sender: currentProfile };
    renderMessages();
  }
}

function scrollToBottom() {
  const area = document.getElementById('messages-area');
  if (area) area.scrollTop = area.scrollHeight;
}

// ─────────────────────────────────────────────────
// Send Message
// ─────────────────────────────────────────────────

async function sendMessage(content, type = 'text') {
  if (!activeConversationId) return;
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 500) return;

  // Optimistic UI — add immediately before server confirms
  const tempMsg = {
    id: `temp-${Date.now()}`,
    conversation_id: activeConversationId,
    sender_id: currentUser.id,
    type,
    content: trimmed,
    is_read: false,
    created_at: new Date().toISOString(),
    sender: currentProfile
  };

  appendMessage(tempMsg);
  scrollToBottom();
  clearChatInput();

  // Server insert
  const { data, error } = await supabaseClient
    .from('messages')
    .insert({
      conversation_id: activeConversationId,
      sender_id: currentUser.id,
      type,
      content: trimmed
    })
    .select()
    .single();

  if (error) {
    removeTempMessage(tempMsg.id);
    showToast('Failed to send message', 'error');
    return;
  }

  // Replace temp with confirmed message
  replaceTempMessage(tempMsg.id, data);

  // Determine unread increment field (the OTHER person's unread counter)
  const isUserA = activeConversation.user_a === currentUser.id;
  const otherUnreadField = isUserA ? 'unread_b' : 'unread_a';
  const otherCurrentUnread = isUserA
    ? (activeConversation.unread_b ?? 0)
    : (activeConversation.unread_a ?? 0);

  // Update conversation metadata
  await supabaseClient
    .from('conversations')
    .update({
      last_message: trimmed.substring(0, 100),
      last_msg_at: new Date().toISOString(),
      [otherUnreadField]: otherCurrentUnread + 1
    })
    .eq('id', activeConversationId);

  // Notify the recipient
  const otherId = getOtherPerson(activeConversation)?.id;
  if (otherId) {
    await supabaseClient.from('notifications').insert({
      user_id: otherId,
      type: 'message_received',
      title: `New message from ${currentProfile.full_name}`,
      body: trimmed.substring(0, 100),
      link_url: `chat.html?user=${currentUser.id}`,
      actor_id: currentUser.id
    });
  }
}

async function fetchAndAppendMessage(messageId) {
  const { data } = await supabaseClient
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)')
    .eq('id', messageId)
    .single();

  if (data) {
    appendMessage(data);
    scrollToBottom();
  }
}

// ─────────────────────────────────────────────────
// Input handling
// ─────────────────────────────────────────────────

function initInput() {
  const textarea  = document.getElementById('message-input');
  const sendBtn   = document.getElementById('send-btn');
  const counter   = document.getElementById('char-counter');

  textarea.addEventListener('input', () => {
    // Auto-resize (up to 3 lines / max-height via CSS)
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 96) + 'px';

    const len = textarea.value.length;
    counter.textContent = `${len} / 500`;
    counter.classList.toggle('over', len > 500);
    sendBtn.disabled = len === 0 || len > 500;

    // Typing indicator broadcast
    handleTyping();
  });

  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) {
        sendMessage(textarea.value);
      }
    }
  });

  sendBtn.addEventListener('click', () => {
    if (!sendBtn.disabled) sendMessage(textarea.value);
  });

  // Empty state compose button
  document.getElementById('start-conv-btn-empty')?.addEventListener('click', openNewConvModal);
  document.getElementById('compose-btn').addEventListener('click', openNewConvModal);
}

function clearChatInput() {
  const textarea = document.getElementById('message-input');
  textarea.value = '';
  textarea.style.height = 'auto';
  document.getElementById('char-counter').textContent = '0 / 500';
  document.getElementById('send-btn').disabled = true;
}

// ─────────────────────────────────────────────────
// Emoji Picker
// ─────────────────────────────────────────────────

function initEmojiPicker() {
  const picker  = document.getElementById('emoji-picker');
  const emojiBtn = document.getElementById('emoji-btn');
  const textarea = document.getElementById('message-input');

  // Populate
  picker.innerHTML = EMOJIS.map(e =>
    `<button type="button" aria-label="${e}">${e}</button>`
  ).join('');

  emojiBtn.addEventListener('click', e => {
    e.stopPropagation();
    picker.classList.toggle('open');
  });

  picker.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const pos = textarea.selectionStart;
      const val = textarea.value;
      textarea.value = val.slice(0, pos) + btn.textContent + val.slice(pos);
      textarea.selectionStart = textarea.selectionEnd = pos + btn.textContent.length;
      textarea.dispatchEvent(new Event('input'));
      picker.classList.remove('open');
      textarea.focus();
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.message-textarea-wrap') && !e.target.closest('.emoji-btn')) {
      picker.classList.remove('open');
    }
  });
}

// ─────────────────────────────────────────────────
// New Conversation Modal
// ─────────────────────────────────────────────────

function initNewConvModal() {
  const modal    = document.getElementById('new-conv-modal');
  const closeBtn = document.getElementById('new-conv-close');
  const searchEl = document.getElementById('new-conv-search');

  closeBtn.addEventListener('click', closeNewConvModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeNewConvModal(); });

  searchEl.addEventListener('input', () => {
    clearTimeout(newConvSearchTimeout);
    const q = searchEl.value.trim();
    if (!q) {
      document.getElementById('new-conv-results').innerHTML =
        '<div id="new-conv-hint" style="padding:20px;text-align:center;color:var(--color-text-secondary);font-size:0.9rem;">Start typing to search peers…</div>';
      return;
    }
    newConvSearchTimeout = setTimeout(() => searchPeers(q), 280);
  });
}

function openNewConvModal() {
  document.getElementById('new-conv-search').value = '';
  document.getElementById('new-conv-results').innerHTML =
    '<div id="new-conv-hint" style="padding:20px;text-align:center;color:var(--color-text-secondary);font-size:0.9rem;">Start typing to search peers…</div>';
  document.getElementById('new-conv-modal').classList.add('open');
  setTimeout(() => document.getElementById('new-conv-search').focus(), 100);
}

function closeNewConvModal() {
  document.getElementById('new-conv-modal').classList.remove('open');
}

async function searchPeers(query) {
  const resultsEl = document.getElementById('new-conv-results');
  resultsEl.innerHTML = '<div style="padding:16px;text-align:center;"><div class="skeleton skeleton-text" style="width:70%;margin:0 auto;"></div></div>';

  const { data } = await supabaseClient
    .from('profiles')
    .select('id, full_name, avatar_url, college, department')
    .neq('id', currentUser.id)
    .or(`full_name.ilike.%${query}%,college.ilike.%${query}%`)
    .limit(8);

  if (!data || data.length === 0) {
    resultsEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--color-text-secondary);">No peers found.</div>';
    return;
  }

  resultsEl.innerHTML = data.map(p => `
    <div class="conversation-item" data-user-id="${p.id}" style="border-left:none;" role="button" tabindex="0">
      ${chatRenderAvatar(p.full_name, p.avatar_url, 'avatar-md')}
      <div class="conv-info">
        <div class="conv-name">${p.full_name}</div>
        <div class="conv-preview">${[p.college, p.department].filter(Boolean).join(' · ')}</div>
      </div>
    </div>`).join('');

  resultsEl.querySelectorAll('[data-user-id]').forEach(el => {
    el.addEventListener('click', async () => {
      closeNewConvModal();
      await openOrCreateConversation(el.dataset.userId);
    });
  });
}

// ─────────────────────────────────────────────────
// Realtime Subscriptions
// ─────────────────────────────────────────────────

function subscribeToMessages(conversationId) {
  // Unsubscribe from previous conversation first
  if (messageChannel) {
    supabaseClient.removeChannel(messageChannel);
    messageChannel = null;
  }

  messageChannel = supabaseClient
    .channel(`chat-messages-${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    }, payload => {
      // Only append other person's messages (own already shown optimistically)
      if (payload.new.sender_id !== currentUser.id) {
        fetchAndAppendMessage(payload.new.id);
        markMessagesRead(conversationId);
      }
    })
    .subscribe();
}

function subscribeToConversations() {
  // Subscribe to conversation list changes for both user_a and user_b scenarios
  // Using a single channel that handles both via OR filter not supported directly,
  // so we use two subscriptions with unique channel names.
  supabaseClient
    .channel(`chat-convs-a-${currentUser.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'conversations',
      filter: `user_a=eq.${currentUser.id}`
    }, () => { loadAndRenderConversations(); })
    .subscribe();

  supabaseClient
    .channel(`chat-convs-b-${currentUser.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'conversations',
      filter: `user_b=eq.${currentUser.id}`
    }, () => { loadAndRenderConversations(); })
    .subscribe();
}

// ─────────────────────────────────────────────────
// Conversation Search (sidebar filter)
// ─────────────────────────────────────────────────

function initConvSearch() {
  document.getElementById('conv-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      filteredConvs = conversations;
    } else {
      filteredConvs = conversations.filter(conv => {
        const other = getOtherPerson(conv);
        return other?.full_name?.toLowerCase().includes(q);
      });
    }
    renderConversationsList(filteredConvs);
  });
}

// ─────────────────────────────────────────────────
// Mobile Navigation
// ─────────────────────────────────────────────────

function initMobileNav() {
  document.getElementById('chat-back-btn').addEventListener('click', () => {
    document.getElementById('chat-sidebar').classList.remove('hidden-mobile');
    document.getElementById('chat-main').classList.remove('visible-mobile');
    activeConversationId = null;
    activeConversation   = null;
    document.getElementById('active-chat-area').style.display = 'none';
    document.getElementById('chat-no-selection').style.display = 'flex';
  });

  initConvSearch();
}

// ─────────────────────────────────────────────────
// Typing Indicator (Supabase Broadcast — zero DB writes)
// ─────────────────────────────────────────────────

function initTypingIndicator(conversationId, otherPersonName) {
  // Clean up previous typing channel
  if (typingChannel) {
    supabaseClient.removeChannel(typingChannel);
    typingChannel = null;
  }
  hideTypingIndicator();

  typingChannel = supabaseClient
    .channel(`typing-${conversationId}`)
    .on('broadcast', { event: 'typing' }, payload => {
      if (payload.payload?.userId !== currentUser.id) {
        showTypingIndicator(otherPersonName);
      }
    })
    .on('broadcast', { event: 'stop_typing' }, payload => {
      if (payload.payload?.userId !== currentUser.id) {
        hideTypingIndicator();
      }
    })
    .subscribe();
}

function handleTyping() {
  if (!typingChannel || !activeConversationId) return;

  typingChannel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { userId: currentUser.id }
  });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    typingChannel?.send({
      type: 'broadcast',
      event: 'stop_typing',
      payload: { userId: currentUser.id }
    });
  }, 2000);
}

function showTypingIndicator(name) {
  if (isShowingTyping) return;
  isShowingTyping = true;
  const area = document.querySelector('.messages-area');
  if (!area) return;
  const indicator = document.createElement('div');
  indicator.id = 'typing-indicator';
  indicator.className = 'typing-indicator';
  indicator.innerHTML = `
    <span class="typing-dots">
      <span></span><span></span><span></span>
    </span>
    <span class="typing-text">${name} is typing…</span>
  `;
  area.appendChild(indicator);
  area.scrollTop = area.scrollHeight;
}

function hideTypingIndicator() {
  isShowingTyping = false;
  document.getElementById('typing-indicator')?.remove();
}

// ─────────────────────────────────────────────────
// Message Search
// ─────────────────────────────────────────────────

function initMessageSearch() {
  // Inject search bar into HTML above messages-area
  const chatMain = document.getElementById('chat-main');
  const searchBarHtml = `
    <div class="message-search-bar" id="message-search-bar">
      <input type="search" id="msg-search-input" class="chat-search-input" placeholder="Search messages…" autocomplete="off" aria-label="Search messages" style="flex:1;">
      <button id="msg-search-close" class="chat-compose-btn" aria-label="Close search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="search-results-overlay" id="search-results-overlay" style="display:none;"></div>`;

  // Insert before messages-area inside active-chat-area
  const activeArea = document.getElementById('active-chat-area');
  const messagesArea = document.getElementById('messages-area');
  activeArea.insertBefore(
    Object.assign(document.createElement('div'), { innerHTML: searchBarHtml }).firstElementChild,
    messagesArea
  );
  const overlayEl = document.createElement('div');
  overlayEl.innerHTML = searchBarHtml;
  // Actually inject both
  const frag = document.createRange().createContextualFragment(searchBarHtml);
  messagesArea.parentNode.insertBefore(frag, messagesArea);

  // Search icon button in chat header (inject it)
  const headerActions = document.getElementById('chat-header')?.querySelector('.chat-header-actions');
  if (headerActions) {
    const searchBtn = document.createElement('button');
    searchBtn.id = 'msg-search-toggle';
    searchBtn.className = 'chat-compose-btn';
    searchBtn.title = 'Search messages';
    searchBtn.setAttribute('aria-label', 'Search messages');
    searchBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    headerActions.prepend(searchBtn);
    searchBtn.addEventListener('click', openMessageSearch);
  }

  document.addEventListener('click', e => {
    if (document.getElementById('search-results-overlay')?.style.display !== 'none') {
      if (!e.target.closest('#message-search-bar') && !e.target.closest('#search-results-overlay')) {
        closeMessageSearch();
      }
    }
  });
}

function openMessageSearch() {
  const bar = document.getElementById('message-search-bar');
  if (!bar) return;
  bar.classList.add('open');
  document.getElementById('msg-search-input')?.focus();

  const closeBtn = document.getElementById('msg-search-close');
  if (closeBtn && !closeBtn._bound) {
    closeBtn._bound = true;
    closeBtn.addEventListener('click', closeMessageSearch);
  }

  const input = document.getElementById('msg-search-input');
  if (input && !input._bound) {
    input._bound = true;
    input.addEventListener('input', () => {
      clearTimeout(msgSearchTimeout);
      const q = input.value.trim();
      if (!q) { closeMessageSearchResults(); return; }
      msgSearchTimeout = setTimeout(() => chatSearchMessages(activeConversationId, q), 300);
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMessageSearch();
    });
  }
}

function closeMessageSearch() {
  document.getElementById('message-search-bar')?.classList.remove('open');
  closeMessageSearchResults();
  const input = document.getElementById('msg-search-input');
  if (input) input.value = '';
}

function closeMessageSearchResults() {
  const overlay = document.getElementById('search-results-overlay');
  if (overlay) overlay.style.display = 'none';
}

async function chatSearchMessages(conversationId, query) {
  if (!conversationId || !query.trim()) return;

  const { data } = await supabaseClient
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(full_name)')
    .eq('conversation_id', conversationId)
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20);

  renderChatSearchResults(data || [], query);
}

function renderChatSearchResults(results, query) {
  const overlay = document.getElementById('search-results-overlay');
  if (!overlay) return;

  if (results.length === 0) {
    overlay.innerHTML = `<div style="padding:24px;text-align:center;color:var(--color-text-secondary);">No messages found for "${escapeHtml(query)}"</div>`;
    overlay.style.display = 'block';
    return;
  }

  const escapedQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${escapedQ})`, 'gi');

  overlay.innerHTML = results.map(msg => {
    const highlighted = escapeHtml(msg.content).replace(re, '<mark class="search-highlight">$1</mark>');
    const preview = msg.content.length > 100 ? msg.content.slice(0, 100) + '…' : msg.content;
    const time = chatFormatMsgTime(msg.created_at);
    return `
      <div class="search-result-item" data-msg-id="${msg.id}" role="button" tabindex="0">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="font-weight:600;font-size:0.85rem;">${escapeHtml(msg.sender?.full_name || 'Unknown')}</span>
          <span style="font-size:0.75rem;color:var(--color-text-hint);">${time}</span>
        </div>
        <div style="font-size:0.88rem;color:var(--color-text-secondary);">${highlighted}</div>
      </div>`;
  }).join('');

  overlay.style.display = 'block';

  overlay.querySelectorAll('.search-result-item').forEach(el => {
    el.addEventListener('click', () => {
      scrollToMessage(el.dataset.msgId);
      closeMessageSearch();
    });
  });
}

function scrollToMessage(messageId) {
  closeMessageSearch();
  // Re-render if needed, then find element by data-msg-id
  // We store id on bubble wrapper via data-msg-id attribute set in renderMessages
  // Since we don't currently, we do a full render and highlight by index
  const msgIdx = messages.findIndex(m => m.id === messageId);
  if (msgIdx === -1) return;

  // Re-render messages with highlight flag
  const area = document.getElementById('messages-area');
  renderMessages();

  // After render, find the n-th .message-bubble (approximate since groups merge bubbles)
  const allBubbles = area.querySelectorAll('.message-bubble, .session-invite-card, .meet-link-card');
  const target = allBubbles[msgIdx];
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('message-highlighted');
    setTimeout(() => target.classList.remove('message-highlighted'), 2500);
  }
}

function showGlobalEmptyState() {
  // Only show if no conversation is currently open
  if (activeConversationId) return;
  const noSel = document.getElementById('chat-no-selection');
  if (!noSel) return;
  noSel.innerHTML = `
    <div class="chat-no-selection-icon">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </div>
    <h2 style="font-size:1.1rem;font-weight:700;color:var(--color-text-primary);">No conversations yet</h2>
    <p style="max-width:280px;line-height:1.6;color:var(--color-text-secondary);">Browse peers and click Send Message to start chatting.</p>
    <a href="browse.html" class="btn btn-primary">Browse Peers</a>`;
}

// ─────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────
init();
