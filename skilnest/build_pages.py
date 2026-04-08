import os

SESSIONS_HTML = """
    <div class="sessions-top-bar">
        <div class="cm-pill-select" id="sessionsFilter">
            <button class="rm-pill active" data-filter="all">All</button>
            <button class="rm-pill" data-filter="upcoming">Upcoming</button>
            <button class="rm-pill" data-filter="completed">Completed</button>
            <button class="rm-pill" data-filter="cancelled">Cancelled</button>
        </div>
        <button class="btn btn-primary" id="btnCreateSessionModal">Create Session</button>
    </div>

    <div id="sessionsFeed">
        <!-- Card 1 -->
        <div class="sc-card" data-status="upcoming">
            <div class="sc-info">
                <div style="display:flex; gap:12px; align-items:center;">
                    <div class="sc-role">You are learning</div>
                    <div class="sc-badge upcoming">Upcoming</div>
                </div>
                <div class="sc-title">Learning Python with Arjun Mehta</div>
                <div class="sc-meta">📅 April 12, 3:00 PM &middot; ⏱️ 1 Hour</div>
            </div>
            <div class="sc-actions">
                <button class="btn btn-ghost btn-sm">Reschedule</button>
                <button class="btn btn-primary btn-sm">Join Session</button>
            </div>
        </div>

        <!-- Card 2 -->
        <div class="sc-card" data-status="pending">
            <div class="sc-info">
                <div style="display:flex; gap:12px; align-items:center;">
                    <div class="sc-role">You are teaching</div>
                    <div class="sc-badge pending">Pending</div>
                </div>
                <div class="sc-title">Teaching Guitar to Rohit Verma</div>
                <div class="sc-meta">📅 April 15, 5:30 PM &middot; ⏱️ 1 Hour</div>
            </div>
            <div class="sc-actions">
                <button class="btn btn-ghost btn-sm" style="color:#ef4444;">Cancel</button>
                <button class="btn btn-primary btn-sm" style="background:#10b981; border-color:#10b981;">Approve</button>
            </div>
        </div>

        <!-- Card 3 -->
        <div class="sc-card" data-status="completed">
            <div class="sc-info">
                <div style="display:flex; gap:12px; align-items:center;">
                    <div class="sc-role">You are learning</div>
                    <div class="sc-badge completed">Completed</div>
                </div>
                <div class="sc-title">Learning Figma with Priya Sharma</div>
                <div class="sc-meta">📅 March 28, 4:00 PM &middot; ⏱️ 1.5 Hours</div>
            </div>
            <div class="sc-actions">
                <button class="btn btn-primary btn-sm btnRateSession">Rate Session</button>
            </div>
        </div>

        <!-- Card 4 -->
        <div class="sc-card" data-status="cancelled">
            <div class="sc-info">
                <div style="display:flex; gap:12px; align-items:center;">
                    <div class="sc-role">You are learning</div>
                    <div class="sc-badge cancelled">Cancelled</div>
                </div>
                <div class="sc-title">Learning Spanish with Unknown</div>
                <div class="sc-meta">📅 March 15</div>
            </div>
            <div class="sc-actions">
                <button class="btn btn-ghost btn-sm" disabled>Rate Session</button>
            </div>
        </div>
    </div>

    <!-- Create Session Modal -->
    <div class="custom-modal-overlay" id="createSessionModal">
        <div class="custom-modal">
            <div class="cm-header">
                <h3>Create Session</h3>
                <button class="cm-close" id="closeCreateModal">&times;</button>
            </div>
            <div class="cm-body">
                <div>
                    <label style="font-size:13px;font-weight:600;margin-bottom:6px;display:block;">Select Student/Match</label>
                    <select class="cm-input" style="margin-bottom:16px;">
                        <option>Arjun Mehta</option>
                        <option>Priya Sharma</option>
                        <option>Rohit Verma</option>
                    </select>
                </div>
                <div>
                    <label style="font-size:13px;font-weight:600;margin-bottom:6px;display:block;">Select Skill</label>
                    <select class="cm-input" id="csSkill" style="margin-bottom:16px;">
                        <option>Python</option>
                        <option>Guitar</option>
                        <option>Figma</option>
                    </select>
                </div>
                <div style="display:flex; gap:16px; margin-bottom:16px;">
                    <div style="flex-grow:1;">
                        <label style="font-size:13px;font-weight:600;margin-bottom:6px;display:block;">Date & Time</label>
                        <input type="datetime-local" class="cm-input" value="2026-04-10T14:30">
                    </div>
                    <div style="width:120px;">
                        <label style="font-size:13px;font-weight:600;margin-bottom:6px;display:block;">Duration</label>
                        <select class="cm-input">
                            <option>1 Hour</option>
                            <option>1.5 Hours</option>
                            <option>2 Hours</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label style="font-size:13px;font-weight:600;margin-bottom:6px;display:block;">Session Notes</label>
                    <textarea class="cm-input" rows="3" placeholder="What do you want to cover?"></textarea>
                </div>
                <button class="btn btn-primary" id="btnSubmitCreateSession" style="width:100%; margin-top:16px;">Create & Invite</button>
            </div>
        </div>
    </div>

    <!-- Rating Modal -->
    <div class="custom-modal-overlay" id="ratingModal">
        <div class="custom-modal">
            <div class="cm-header">
                <h3>How was your session?</h3>
                <button class="cm-close" id="closeRatingModal">&times;</button>
            </div>
            <div class="cm-body" style="text-align:center;">
                <p style="font-size:14px; color:var(--text-secondary);">Your feedback helps maintain community quality.</p>
                <div class="star-rating" id="starRatingSystem">
                    <span class="star" data-val="1">★</span>
                    <span class="star" data-val="2">★</span>
                    <span class="star" data-val="3">★</span>
                    <span class="star" data-val="4">★</span>
                    <span class="star" data-val="5">★</span>
                </div>
                <textarea class="cm-input" rows="3" placeholder="Leave a review..." style="text-align:left; margin-bottom: 16px;"></textarea>
                <button class="btn btn-primary" id="btnSubmitRating" style="width:100%;">Submit Rating</button>
            </div>
        </div>
    </div>
"""

CHAT_HTML = """
    <div class="chat-container-split">
        <!-- Sidebar array -->
        <div class="chat-sidebar">
            <div style="padding:16px; font-weight:600; font-size:16px; border-bottom:1px solid var(--border); background:white;">Messages</div>
            <div class="chat-list">
                <div class="cl-item active">
                    <div class="cl-av">AM</div>
                    <div class="cl-meta">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h5>Arjun Mehta</h5>
                            <span style="font-size:11px; color:var(--text-muted);">2m ago</span>
                        </div>
                        <div class="cl-preview" style="color:var(--text-primary); font-weight:500;">Yes that sounds perfect. Let's do 3 PM.</div>
                    </div>
                </div>
                <div class="cl-item">
                    <div class="cl-av" style="background:#fce7f3;color:#be185d;">PS</div>
                    <div class="cl-meta">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h5>Priya Sharma</h5>
                            <span style="font-size:11px; color:var(--text-muted);">Yesterday</span>
                        </div>
                        <div class="cl-preview">Thanks for the Figma tips!</div>
                    </div>
                </div>
                <div class="cl-item">
                    <div class="cl-av" style="background:#dcfce7;color:#15803d;">RV</div>
                    <div class="cl-meta">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h5>Rohit Verma</h5>
                            <span style="font-size:11px; color:var(--text-muted);">Mon</span>
                        </div>
                        <div class="cl-preview">Okay, will let you know later.</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Active View -->
        <div class="chat-window">
            <div class="chat-header">
                <div class="cl-av">AM</div>
                <div>
                    <div style="font-weight:600; font-size:16px;">Arjun Mehta</div>
                    <div style="font-size:12px; color:var(--text-secondary);">Online now</div>
                </div>
                <button class="btn btn-ghost btn-sm btn-icon" style="margin-left:auto; padding:10px;" onclick="window.location.href='profile-view.html'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></button>
            </div>
            
            <div class="chat-history" id="chatHistoryBox">
                <!-- Message Set -->
                <div class="c-bubble-row left">
                    <div class="chat-bubble left">Hey! Did you get a chance to look at the Python exercise I sent?</div>
                    <div class="c-time">2:14 PM</div>
                </div>
                <div class="c-bubble-row right">
                    <div class="chat-bubble right">Taking a look at it now. The recursion part is tricky.</div>
                    <div class="c-time">2:30 PM &middot; Seen ✓✓</div>
                </div>
                <div class="c-bubble-row left">
                    <div class="chat-bubble left">No rush. We can go over it step by step in our session tomorrow. Are we still good for 3 PM?</div>
                    <div class="c-time">2:31 PM</div>
                </div>
                <div class="c-bubble-row right">
                    <div class="chat-bubble right">Yes that sounds perfect. Let's do 3 PM.</div>
                    <div class="c-time">2:35 PM &middot; Seen ✓✓</div>
                </div>
                <!-- Dynamic injected here -->
            </div>
            
            <div class="chat-input-area">
                <input type="text" class="cm-input chat-input" placeholder="Type a message..." id="chatInputStr">
                <button class="btn btn-primary btn-icon" style="padding:12px; border-radius:50%;" id="btnSendChat">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>
        </div>
    </div>
"""

CREDITS_HTML = """
    <div class="credits-hero-card">
        <div>
            <div class="ch-balance">42</div>
            <div class="ch-label">Credits Available</div>
        </div>
        <div style="text-align:right;">
            <button class="btn btn-ghost" style="background:rgba(255,255,255,0.2); color:white; border:none; margin-bottom:8px;" onclick="window.location.href='browse.html'">Spend Credits &rarr;</button><br>
            <span style="font-size:13px; opacity:0.8;">Teach sessions to earn more.</span>
        </div>
    </div>

    <div class="credits-grid">
        <div class="p-card">
            <div class="sessions-top-bar">
                <h3 style="margin:0;">Transaction History</h3>
                <div class="cm-pill-select" id="creditFilterSelector">
                    <button class="rm-pill active">All</button>
                    <button class="rm-pill">Earned</button>
                    <button class="rm-pill">Spent</button>
                </div>
            </div>
            
            <div id="transactionsList">
                <div class="transaction-row type-earn">
                    <div class="tr-left">
                        <div class="tr-icon earn">📉</div>
                        <div>
                            <div class="tr-desc">Taught Python Basics</div>
                            <div class="tr-date">April 08, 2026</div>
                        </div>
                    </div>
                    <div class="tr-amount earn">+8 credits</div>
                </div>
                <div class="transaction-row type-earn">
                    <div class="tr-left">
                        <div class="tr-icon earn">⭐</div>
                        <div>
                            <div class="tr-desc">5-star rating bonus (Arjun)</div>
                            <div class="tr-date">April 08, 2026</div>
                        </div>
                    </div>
                    <div class="tr-amount earn">+2 credits</div>
                </div>
                <div class="transaction-row type-spend">
                    <div class="tr-left">
                        <div class="tr-icon spend">💸</div>
                        <div>
                            <div class="tr-desc">Requested Figma Session</div>
                            <div class="tr-date">April 06, 2026</div>
                        </div>
                    </div>
                    <div class="tr-amount spend">−5 credits</div>
                </div>
                <div class="transaction-row type-earn">
                    <div class="tr-left">
                        <div class="tr-icon earn">📉</div>
                        <div>
                            <div class="tr-desc">Taught Guitar Session</div>
                            <div class="tr-date">April 05, 2026</div>
                        </div>
                    </div>
                    <div class="tr-amount earn">+8 credits</div>
                </div>
                <div class="transaction-row type-spend">
                    <div class="tr-left">
                        <div class="tr-icon spend">💸</div>
                        <div>
                            <div class="tr-desc">Requested React Help</div>
                            <div class="tr-date">March 30, 2026</div>
                        </div>
                    </div>
                    <div class="tr-amount spend">−6 credits</div>
                </div>
                <div class="transaction-row type-earn">
                    <div class="tr-left">
                        <div class="tr-icon earn">💎</div>
                        <div>
                            <div class="tr-desc">Profile Completion Bonus</div>
                            <div class="tr-date">March 25, 2026</div>
                        </div>
                    </div>
                    <div class="tr-amount earn">+5 credits</div>
                </div>
                <div class="transaction-row type-earn">
                    <div class="tr-left">
                        <div class="tr-icon earn">🎁</div>
                        <div>
                            <div class="tr-desc">Signup Bonus</div>
                            <div class="tr-date">March 25, 2026</div>
                        </div>
                    </div>
                    <div class="tr-amount earn">+15 credits</div>
                </div>
            </div>
        </div>
        
        <div class="p-card">
            <h3 style="margin:0 0 24px;">Lifetime Insights</h3>
            
            <div class="insight-stat">
                <div style="font-size:14px; color:var(--text-secondary);">Total Earned</div>
                <div class="insight-stat-val" style="color:var(--success);">38</div>
            </div>
            
            <div class="insight-stat">
                <div style="font-size:14px; color:var(--text-secondary);">Total Spent</div>
                <div class="insight-stat-val" style="color:#ef4444;">11</div>
            </div>
            
            <div class="insight-stat">
                <div style="font-size:14px; color:var(--text-secondary);">Sessions Completed</div>
                <div class="insight-stat-val">12</div>
            </div>
            
            <div class="insight-stat">
                <div style="font-size:14px; color:var(--text-secondary);">Rating Impact</div>
                <div class="insight-stat-val" style="display:flex; align-items:center; gap:8px;">4.8 <span style="font-size:16px; color:#f59e0b;">★</span></div>
                <p style="font-size:12px; color:var(--text-muted); margin-top:4px;">Top 10% of users in your college community.</p>
            </div>
        </div>
    </div>
"""

with open('dashboard.html', 'r', encoding='utf-8') as f:
    base_html = f.read()

start_idx = base_html.find('<div class="dashboard-container">') + len('<div class="dashboard-container">')
# Look for closing main
end_idx = base_html.find('</main>')
# Step backwards to find the closing div of dashboard-container
closing_div_idx = base_html.rfind('</div>', start_idx, end_idx)

def generate_page(title, active_link, header_title, header_sub, inner_content, out_name):
    html = base_html
    # Replace title
    html = html.replace('<title>Dashboard - SkillNest</title>', f'<title>{title} - SkillNest</title>')
    
    # Reset active link
    html = html.replace('class="sidebar-link active"', 'class="sidebar-link"')
    
    # Set new active link (simple string replace for the href match)
    html = html.replace(f'href="{active_link}" class="sidebar-link"', f'href="{active_link}" class="sidebar-link active"')
    
    # Replace header greetings
    html = html.replace('Good morning 👋', header_title)
    html = html.replace('<div style="font-size: 13px; color: var(--text-secondary);" id="currentDate">Date Placeholder</div>', f'<div style="font-size: 13px; color: var(--text-secondary);">{header_sub}</div>')
    
    # Replace content
    html = html[:start_idx] + "\n" + inner_content + "\n" + html[closing_div_idx:]
    
    with open(out_name, 'w', encoding='utf-8') as f:
        f.write(html)

generate_page('My Sessions', 'sessions.html', 'My Sessions', 'Organize your upcoming and completed meetings', SESSIONS_HTML, 'sessions.html')
generate_page('Chat', 'chat.html', 'Messages', 'Real-time peer communication', CHAT_HTML, 'chat.html')
generate_page('Credits', 'credits.html', 'Credit Balance', 'Track your ecosystem economy', CREDITS_HTML, 'credits.html')

print("Safely generated HTML files.")
