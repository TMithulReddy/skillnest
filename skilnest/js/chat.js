/* ========================================================= */
/* js/chat.js - Real-time Chat System (Backend Ready)        */
/* ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // ---------------------------------------------------------
    // 1. MOCK BACKEND SETUP (localStorage fallback for Demo)
    // ---------------------------------------------------------
    
    // In production, this would be: const socket = io("http://localhost:5000");
    // For this demo, we create a mock Socket class that triggers local callbacks.
    class MockSocket {
        constructor() {
            this.callbacks = {};
            this.id = 'current_user_1';
            
            // Simulate connection delay
            setTimeout(() => this.trigger('connect'), 200);
        }
        
        on(event, callback) {
            this.callbacks[event] = callback;
        }
        
        emit(event, data) {
            console.log(`[Socket Emit] ${event}:`, data);
            
            // Mock backend responses
            if (event === 'join_room') {
                // Done
            } else if (event === 'send_message') {
                // Echo back for demo, or simulate other user replying (optional)
                // We let local storage handle the immediate append, but real backend would broadcast.
            } else if (event === 'typing') {
                // If we emit typing, we could simulate the other user typing back randomly
            }
        }
        
        trigger(event, data) {
            if (this.callbacks[event]) {
                this.callbacks[event](data);
            }
        }
    }
    
    // Initialize "socket"
    const socket = new MockSocket();
    
    // ---------------------------------------------------------
    // 2. STATE & DATA MANAGEMENT
    // ---------------------------------------------------------
    let currentUser = { id: "u1", name: "Student Name", avatar: "SN" };
    let activeChatUserId = null;
    let onlineUsers = ["u2", "u4"]; // IDs of online users
    let isTypingTimeout = null;

    // Contact Database (Mocked for Demo)
    const contacts = [
        { id: "u2", name: "Arjun Mehta", avatar: "AM", color: "#1d4ed8", bg: "#dbeafe" },
        { id: "u3", name: "Priya Sharma", avatar: "PS", color: "#be185d", bg: "#fce7f3" },
        { id: "u4", name: "Rohit Verma", avatar: "RV", color: "#15803d", bg: "#dcfce7" },
        { id: "u5", name: "Kiran Rao", avatar: "KR", color: "#b45309", bg: "#fef3c7" }
    ];

    // Load messages from localStorage wrapper
    const storageManager = {
        getKey: (userId) => `chat_user_${userId}`,
        getMessages: (userId) => {
            const data = localStorage.getItem(storageManager.getKey(userId));
            return data ? JSON.parse(data) : [];
        },
        saveMessage: (userId, msgObj) => {
            const msgs = storageManager.getMessages(userId);
            msgs.push(msgObj);
            localStorage.setItem(storageManager.getKey(userId), JSON.stringify(msgs));
        }
    };

    // Pre-populate some fake history if empty
    if (storageManager.getMessages("u2").length === 0) {
        storageManager.saveMessage("u2", { sender: "u2", text: "Hey! When do we start the Python session?", timestamp: new Date(Date.now() - 3600000).toISOString() });
    }

    // ---------------------------------------------------------
    // 3. UI ELEMENTS
    // ---------------------------------------------------------
    const convListEl = document.getElementById('convList');
    const chatSearchInput = document.getElementById('chatSearchInput');
    
    const activeChatView = document.getElementById('activeChatView');
    const noChatSelected = document.getElementById('noChatSelected');
    const activeChatName = document.getElementById('activeChatName');
    const activeChatAvatar = document.getElementById('activeChatAvatar');
    const activeChatStatus = document.getElementById('activeChatStatus');
    const chatMessagesArea = document.getElementById('chatMessagesArea');
    const chatTypingIndicator = document.getElementById('chatTypingIndicator');
    
    const chatInputForm = document.getElementById('chatInputForm');
    const chatTextInput = document.getElementById('chatTextInput');
    const btnSendMsg = document.getElementById('btnSendMsg');
    const chatInputError = document.getElementById('chatInputError');
    
    const btnBackToConvList = document.getElementById('btnBackToConvList');
    const chatMainPanel = document.getElementById('chatMainPanel');
    const btnRequestMeet = document.getElementById('btnRequestMeet');

    // ---------------------------------------------------------
    // 4. RENDERING LOGIC
    // ---------------------------------------------------------
    
    function renderConversations(filterText = '') {
        convListEl.innerHTML = '';
        
        contacts.forEach(contact => {
            // Filter
            if (filterText && !contact.name.toLowerCase().includes(filterText.toLowerCase())) return;
            
            // Only show if online OR have existing conversation history
            const isOnline = onlineUsers.includes(contact.id);
            const msgs = storageManager.getMessages(contact.id);
            const hasHistory = msgs.length > 0;
            
            if (!isOnline && !hasHistory) return;
            
            const lastMsg = hasHistory ? msgs[msgs.length - 1] : { text: "No messages yet", timestamp: "" };
            let previewText = lastMsg.text;
            if (lastMsg.type === 'meet_link') previewText = "📞 Meet Link";
            if (lastMsg.type === 'session') previewText = "📅 Session Request";

            const timeStr = lastMsg.timestamp ? extractTime(lastMsg.timestamp) : "";
            const isOnlineClass = isOnline ? "online" : "offline";
            const statusText = isOnline ? "Online" : "Offline";
            const activeClass = (activeChatUserId === contact.id) ? "active" : "";

            const html = `
                <div class="cs-item ${activeClass}" data-userid="${contact.id}">
                    <div class="cs-avatar-wrap">
                        <div class="cs-avatar" style="background:${contact.bg}; color:${contact.color}">${contact.avatar}</div>
                        <div class="status-dot-avatar ${isOnlineClass}"></div>
                    </div>
                    <div class="cs-info">
                        <div class="cs-name-row">
                            <div class="cs-name">${contact.name}</div>
                            <div class="cs-time">${timeStr}</div>
                        </div>
                        <div class="cs-preview-row">
                            <div class="cs-preview">${previewText}</div>
                            <div class="cs-status-text ${isOnlineClass}">${statusText}</div>
                        </div>
                    </div>
                </div>
            `;
            convListEl.insertAdjacentHTML('beforeend', html);
        });

        // Add Listeners
        convListEl.querySelectorAll('.cs-item').forEach(item => {
            item.addEventListener('click', () => {
                const uid = item.getAttribute('data-userid');
                openChat(uid);
            });
        });
    }

    function openChat(userId) {
        activeChatUserId = userId;
        const contact = contacts.find(c => c.id === userId);
        if (!contact) return;

        // UI Update
        noChatSelected.style.display = 'none';
        activeChatView.style.display = 'flex';
        
        if (window.innerWidth <= 768) {
            chatMainPanel.classList.add('mobile-active');
        }

        activeChatName.textContent = contact.name;
        activeChatAvatar.textContent = contact.avatar;
        activeChatAvatar.style.background = contact.bg;
        activeChatAvatar.style.color = contact.color;

        const isOnline = onlineUsers.includes(userId);
        activeChatStatus.className = `ch-status ${isOnline ? 'online' : ''}`;
        activeChatStatus.innerHTML = `<span class="status-dot"></span> <span class="status-text">${isOnline ? 'Online' : 'Last seen recently'}</span>`;

        // Render messages
        renderMessages();
        renderConversations(); // active state refresh

        // Focus input
        setTimeout(() => chatTextInput.focus(), 100);
    }

    function renderMessages() {
        if (!activeChatUserId) return;
        chatMessagesArea.innerHTML = '';
        
        const msgs = storageManager.getMessages(activeChatUserId);
        
        msgs.forEach(msg => {
            const isSent = msg.sender === currentUser.id;
            const timeStr = extractTime(msg.timestamp);
            
            let bubbleContent = '';
            
            if (msg.type === 'meet_link') {
                bubbleContent = `
                    <div class="msg-struct-card">
                        <div style="font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:6px;">
                            <span style="color:#10b981;">📞</span> Video Call
                        </div>
                        <a href="${msg.link}" target="_blank" style="color:var(--primary);text-decoration:none;word-break:break-all;">${msg.link}</a>
                    </div>
                `;
            } else if (msg.type === 'session') {
                bubbleContent = `
                    <div class="msg-struct-card" style="border-left:4px solid #10b981;">
                        <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;font-weight:600;">Session Invitation</div>
                        <div style="font-weight:600;margin:4px 0;">Python Fundamentals</div>
                        <div style="display:flex;gap:8px;margin-top:8px;">
                            <button class="btn btn-primary btn-sm" style="flex:1;">Accept</button>
                        </div>
                    </div>
                `;
            } else {
                bubbleContent = `<div class="msg-bubble">${escapeHTML(msg.text)}</div>`;
            }

            const html = `
                <div class="chat-msg ${isSent ? 'sent' : 'received'}">
                    ${bubbleContent}
                    <div class="msg-time">${timeStr}</div>
                </div>
            `;
            chatMessagesArea.insertAdjacentHTML('beforeend', html);
        });

        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
    }

    // ---------------------------------------------------------
    // 5. INPUT & SELECTION LOGIC
    // ---------------------------------------------------------
    
    // Auto-grow textarea & validation
    chatTextInput.addEventListener('input', () => {
        chatTextInput.style.height = 'auto';
        chatTextInput.style.height = (chatTextInput.scrollHeight) + 'px';
        
        chatInputError.style.display = 'none';
        
        const text = chatTextInput.value.trim();
        btnSendMsg.disabled = text.length === 0;
        
        if (text.length > 500) {
            chatInputError.textContent = "Message exceeds 500 characters limit.";
            chatInputError.style.display = 'block';
            btnSendMsg.disabled = true;
        }

        // Emit typing
        if (activeChatUserId) {
            socket.emit("typing", { to_user_id: activeChatUserId });
        }
    });

    chatTextInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatInputForm.dispatchEvent(new Event('submit'));
        }
    });

    chatInputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatTextInput.value.trim();
        if (text.length === 0 || text.length > 500 || !activeChatUserId) return;

        const msgObj = {
            sender: currentUser.id,
            text: text,
            timestamp: new Date().toISOString()
        };

        // 1. Emit to backend
        socket.emit("send_message", {
            to_user_id: activeChatUserId,
            message: msgObj.text,
            timestamp: msgObj.timestamp
        });

        // 2. Save locally (localStorage fallback)
        storageManager.saveMessage(activeChatUserId, msgObj);
        
        // 3. Reset UI
        chatTextInput.value = '';
        chatTextInput.style.height = 'auto';
        btnSendMsg.disabled = true;
        
        renderMessages();
        renderConversations(); // to update preview
    });

    chatSearchInput.addEventListener('input', (e) => {
        renderConversations(e.target.value);
    });

    // Mobile back button
    btnBackToConvList.addEventListener('click', () => {
        chatMainPanel.classList.remove('mobile-active');
    });

    // Special Action: Request Meet
    if (btnRequestMeet) {
        btnRequestMeet.addEventListener('click', () => {
            if (!activeChatUserId) return;
            const msgObj = {
                type: 'meet_link',
                sender: currentUser.id,
                link: 'https://meet.google.com/xyz-abcd-123',
                timestamp: new Date().toISOString()
            };
            socket.emit("send_message", msgObj);
            storageManager.saveMessage(activeChatUserId, msgObj);
            renderMessages();
            renderConversations();
        });
    }


    // ---------------------------------------------------------
    // 6. SOCKET EVENT LISTENERS
    // ---------------------------------------------------------

    socket.on('connect', () => {
        console.log("Connected to Chat Node.");
        socket.emit('join_room', currentUser.id);
        
        // Fetch online users (Mock API Call)
        // GET /api/users/online
        fetchOnlineUsersMock();
    });

    socket.on('user_online', (data) => {
        if (!onlineUsers.includes(data.userId)) {
            onlineUsers.push(data.userId);
            renderConversations(chatSearchInput.value);
            if (activeChatUserId === data.userId) openChat(data.userId);
        }
    });

    socket.on('user_offline', (data) => {
        onlineUsers = onlineUsers.filter(id => id !== data.userId);
        renderConversations(chatSearchInput.value);
        if (activeChatUserId === data.userId) openChat(data.userId);
    });

    socket.on('receive_message', (data) => {
        const { from_user_id, message, timestamp, type, link } = data;
        const msgObj = {
            sender: from_user_id,
            text: message,
            type: type,
            link: link,
            timestamp: timestamp || new Date().toISOString()
        };
        
        storageManager.saveMessage(from_user_id, msgObj);
        
        if (activeChatUserId === from_user_id) {
            renderMessages();
        }
        renderConversations(chatSearchInput.value);
    });

    socket.on('typing', (data) => {
        if (data.from_user_id === activeChatUserId) {
            const contact = contacts.find(c => c.id === data.from_user_id);
            chatTypingIndicator.querySelector('span').textContent = `${contact.name} is typing`;
            chatTypingIndicator.style.display = 'flex';
            scrollToBottom();
            
            clearTimeout(isTypingTimeout);
            isTypingTimeout = setTimeout(() => {
                chatTypingIndicator.style.display = 'none';
            }, 2000);
        }
    });

    // Helper: Mock fetching initial online users
    function fetchOnlineUsersMock() {
        // Normally: fetch('/api/users/online').then(res => res.json()).then(...)
        // We simulate it returns [u2, u4]
        onlineUsers = ["u2", "u4"];
        renderConversations();
        
        // Let's pretend someone comes online after 10 seconds
        setTimeout(() => {
            socket.trigger('user_online', { userId: "u3" });
        }, 10000);
        
        // Let's pretend u2 sends a typing event & message
        setTimeout(() => {
            socket.trigger('typing', { from_user_id: "u2" });
            
            setTimeout(() => {
                socket.trigger('receive_message', { 
                    from_user_id: "u2", 
                    message: "Yes, I'm ready!", 
                    timestamp: new Date().toISOString() 
                });
            }, 2000);
        }, 12000);
    }

    // ---------------------------------------------------------
    // 7. UTILS
    // ---------------------------------------------------------
    function extractTime(isoString) {
        if (!isoString) return '';
        const dt = new Date(isoString);
        return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // Init
    renderConversations();

});
