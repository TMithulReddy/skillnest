const fs = require('fs');

const jsAppend = `
    // -------------------------------------------------------------------------
    // SESSIONS, CHAT, CREDITS - CORE LOGIC
    // -------------------------------------------------------------------------

    // 1. Sessions - Toggle Modals
    const btnCreateSessionModal = document.getElementById('btnCreateSessionModal');
    const createSessionModal = document.getElementById('createSessionModal');
    const closeCreateModal = document.getElementById('closeCreateModal');
    
    if (btnCreateSessionModal && createSessionModal) {
        btnCreateSessionModal.addEventListener('click', () => {
            createSessionModal.classList.add('active');
        });
        closeCreateModal?.addEventListener('click', () => {
            createSessionModal.classList.remove('active');
        });
    }

    const btnRateSessions = document.querySelectorAll('.btnRateSession');
    const ratingModal = document.getElementById('ratingModal');
    const closeRatingModal = document.getElementById('closeRatingModal');
    
    if (btnRateSessions.length > 0 && ratingModal) {
        btnRateSessions.forEach(btn => {
            btn.addEventListener('click', () => {
                ratingModal.classList.add('active');
            });
        });
        closeRatingModal?.addEventListener('click', () => {
            ratingModal.classList.remove('active');
        });
    }

    // 2. Sessions - Filter Logic
    const sessionsFilterPills = document.querySelectorAll('#sessionsFilter .rm-pill');
    const sessionsFeed = document.getElementById('sessionsFeed');
    
    if (sessionsFilterPills.length > 0 && sessionsFeed) {
        sessionsFilterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                sessionsFilterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                
                const filter = pill.getAttribute('data-filter');
                const cards = sessionsFeed.querySelectorAll('.sc-card');
                
                cards.forEach(card => {
                    if (filter === 'all' || card.getAttribute('data-status') === filter) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // 3. Sessions - Create Dynamic card submission
    const btnSubmitCreateSession = document.getElementById('btnSubmitCreateSession');
    const csSkill = document.getElementById('csSkill');
    if (btnSubmitCreateSession && sessionsFeed && createSessionModal) {
        btnSubmitCreateSession.addEventListener('click', () => {
            const skillName = csSkill ? csSkill.value : 'A New Skill';
            
            const newCard = document.createElement('div');
            newCard.className = 'sc-card';
            newCard.setAttribute('data-status', 'pending');
            newCard.style.animation = 'fadeIn 0.3s ease';
            
            newCard.innerHTML = \`
                <div class="sc-info">
                    <div style="display:flex; gap:12px; align-items:center;">
                        <div class="sc-role">You are learning</div>
                        <div class="sc-badge pending">Pending</div>
                    </div>
                    <div class="sc-title">Learning \${skillName} with Student</div>
                    <div class="sc-meta">📅 Just Added &middot; ⏱️ 1 Hour</div>
                </div>
                <div class="sc-actions">
                    <button class="btn btn-ghost btn-sm" style="color:#ef4444;">Cancel</button>
                    <button class="btn btn-primary btn-sm" disabled style="opacity:0.5;">Awaiting Approval</button>
                </div>
            \`;
            
            sessionsFeed.insertBefore(newCard, sessionsFeed.firstChild);
            createSessionModal.classList.remove('active');
            
            // Show generic toast
            if(document.getElementById('toastContainer')) {
                const toast = document.getElementById('toastContainer');
                const txt = toast.querySelector('.ct-content') || toast.querySelector('.t-content div');
                if(txt) txt.innerText = '✓ Session created successfully!';
                toast.style.transform = 'translateY(0)';
                setTimeout(() => { toast.style.transform = 'translateY(150%)'; }, 3000);
            }
        });
    }

    // 4. Rating - Star Selection & Submission
    const starRatingSystem = document.getElementById('starRatingSystem');
    const btnSubmitRating = document.getElementById('btnSubmitRating');
    
    if (starRatingSystem) {
        const stars = starRatingSystem.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const val = parseInt(star.getAttribute('data-val'));
                stars.forEach(s => {
                    if (parseInt(s.getAttribute('data-val')) <= val) s.classList.add('active');
                    else s.classList.remove('active');
                });
            });
        });
    }
    
    if (btnSubmitRating && ratingModal) {
        btnSubmitRating.addEventListener('click', () => {
            ratingModal.classList.remove('active');
            if(document.getElementById('toastContainer')) {
                const toast = document.getElementById('toastContainer');
                const txt = toast.querySelector('.ct-content') || toast.querySelector('.t-content div');
                if(txt) txt.innerText = '✓ Feedback submitted!';
                toast.style.transform = 'translateY(0)';
                setTimeout(() => { toast.style.transform = 'translateY(150%)'; }, 3000);
            }
        });
    }

    // 5. Chat Engine
    const chatInputStr = document.getElementById('chatInputStr');
    const btnSendChat = document.getElementById('btnSendChat');
    const chatHistoryBox = document.getElementById('chatHistoryBox');
    
    function sendChatMessage() {
        if (!chatInputStr || !chatHistoryBox) return;
        const msg = chatInputStr.value.trim();
        if (!msg) return;
        
        // Append outgoing Right bubble
        const now = new Date();
        const timeStr = now.getHours() + ':' + (now.getMinutes()<10?'0':'') + now.getMinutes() + (now.getHours()>=12?' PM':' AM');
        
        const row = document.createElement('div');
        row.className = 'c-bubble-row right';
        row.style.animation = 'fadeIn 0.2s ease';
        row.innerHTML = \`
            <div class="chat-bubble right">\${msg}</div>
            <div class="c-time">\${timeStr} &middot; Sent ✓</div>
        \`;
        chatHistoryBox.appendChild(row);
        
        chatInputStr.value = '';
        chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
        
        // Simulate auto-reply after 1.5s
        setTimeout(() => {
            const replyRow = document.createElement('div');
            replyRow.className = 'c-bubble-row left';
            replyRow.style.animation = 'fadeIn 0.2s ease';
            replyRow.innerHTML = \`
                <div class="chat-bubble left">Haha got it! That makes sense. See you in the session.</div>
                <div class="c-time">Just now</div>
            \`;
            chatHistoryBox.appendChild(replyRow);
            chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
        }, 1500);
    }
    
    if (btnSendChat) btnSendChat.addEventListener('click', sendChatMessage);
    if (chatInputStr) {
        chatInputStr.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }

    // 6. Credits Filters
    const creditFilterSelector = document.querySelectorAll('#creditFilterSelector .rm-pill');
    const transactionsList = document.getElementById('transactionsList');
    
    if (creditFilterSelector.length > 0 && transactionsList) {
        creditFilterSelector.forEach(pill => {
            pill.addEventListener('click', () => {
                creditFilterSelector.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                
                const txt = pill.innerText.toLowerCase();
                const rows = transactionsList.querySelectorAll('.transaction-row');
                
                rows.forEach(row => {
                    if (txt === 'all') {
                        row.style.display = 'flex';
                    } else if (txt === 'earned' && row.classList.contains('type-earn')) {
                        row.style.display = 'flex';
                    } else if (txt === 'spent' && row.classList.contains('type-spend')) {
                        row.style.display = 'flex';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        });
    }

`;

const jsPath = 'js/main.js';
let js = fs.readFileSync(jsPath, 'utf8');

const insertPos = js.lastIndexOf('});');
if (insertPos !== -1) {
    js = js.substring(0, insertPos) + jsAppend + '\n' + js.substring(insertPos);
    fs.writeFileSync(jsPath, js, 'utf8');
} else {
    fs.appendFileSync(jsPath, jsAppend, 'utf8');
}

console.log('Appended Final JS Logic Hook.');
