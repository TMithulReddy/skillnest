const fs = require('fs');

// 1. Rename closeModal duplicate in main.js
let js = fs.readFileSync('js/main.js', 'utf8');
js = js.replace(/function closeModal\(\) \{\s*requestModalOverlay/g, 'function closeReqModal() {\n            requestModalOverlay');
js = js.replace(/closeModal\(\);/g, 'closeReqModal();');
fs.writeFileSync('js/main.js', js, 'utf8');

// 2. Append CSS for Profile & Profile-View
const cssAppend = `
/* ========================================================= */
/* PROFILE & PUBLIC PROFILE PAGE STYLES */
/* ========================================================= */

.profile-header-card {
    background: var(--bg-white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 28px;
    box-shadow: var(--shadow-sm);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 40px;
}

.ph-left {
    display: flex;
    gap: 24px;
    align-items: center;
    flex-grow: 1;
}

.ph-photo-wrapper {
    position: relative;
    width: 96px;
    height: 96px;
    flex-shrink: 0;
    cursor: pointer;
}

.ph-photo {
    width: 100%;
    height: 100%;
    background: #dbeafe;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
    font-size: 32px;
    font-weight: 700;
    overflow: hidden;
}

.ph-photo-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.2s;
}

.ph-photo-wrapper:hover .ph-photo-overlay {
    opacity: 1;
}

.ph-info h3 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    font-size: 24px;
    margin: 0 0 4px;
}

.ph-info-dept {
    font-size: 15px;
    color: var(--text-secondary);
    margin-bottom: 2px;
}

.ph-info-college {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 12px;
}

.ph-info-bio {
    font-size: 15px;
    line-height: 1.5;
    color: var(--text-primary);
    max-width: 500px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    position: relative;
}

.ph-info-bio.expanded {
    -webkit-line-clamp: unset;
}

.read-more-link {
    font-size: 13px;
    color: var(--primary);
    cursor: pointer;
    display: inline-block;
    margin-top: 4px;
    font-weight: 500;
}

.ph-stats-row {
    display: flex;
    gap: 12px;
    margin-top: 16px;
    font-size: 14px;
    color: var(--text-secondary);
    align-items: center;
}

.ph-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
}

.ph-ring-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 16px;
}

.pr-text {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 8px;
}

.ph-todo-list {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    margin-bottom: 24px;
}

.ph-todo-link {
    font-size: 13px;
    color: var(--primary);
    font-weight: 500;
}

.ph-todo-link:hover { text-decoration: underline; }

.ph-actions {
    display: flex;
    gap: 12px;
}

/* Tab Navigation */
.profile-tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
    margin: 24px 0;
    gap: 32px;
}

.p-tab {
    padding: 12px 0;
    font-size: 15px;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
}

.p-tab:hover {
    color: var(--text-primary);
}

.p-tab.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
}

.p-tab-content {
    display: none;
    animation: fadeIn 0.3s ease;
}

.p-tab-content.active {
    display: block;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Two Column standard grid */
.tab-grid-60-40 {
    display: grid;
    grid-template-columns: 6fr 4fr;
    gap: 24px;
}
.tab-grid-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
}

/* Cards */
.p-card {
    background: var(--bg-white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 24px;
    box-shadow: var(--shadow-sm);
    margin-bottom: 24px;
}

.p-card-danger {
    background: #fee2e2;
    border: 1px solid #fca5a5;
}

.pc-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.pc-title-row h4 {
    margin: 0;
    font-size: 16px;
}

.edit-icon-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
}
.edit-icon-btn:hover { color: var(--primary); }

.detail-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    align-items: center;
}
.detail-label {
    font-size: 14px;
    color: var(--text-secondary);
    width: 30%;
}
.detail-val {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
    flex-grow: 1;
}

/* Availability Grid */
.avail-grid {
    display: grid;
    grid-template-columns: auto repeat(7, 1fr);
    gap: 8px;
    align-items: center;
    margin-top: 16px;
}

.avail-label-top {
    font-size: 12px;
    text-align: center;
    color: var(--text-secondary);
    font-weight: 500;
}

.avail-label-side {
    font-size: 13px;
    color: var(--text-secondary);
    padding-right: 12px;
    text-align: right;
}

.avail-cell {
    height: 32px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0; /* text invisible visually if needed, or keep small */
}

.avail-cell.active {
    background: #dcfce7;
    border-color: #86efac;
}

.avail-cell.readonly {
    cursor: default;
}

/* Custom CSS Toggle */
.custom-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
}

.ct-info {
    max-width: 80%;
}

.ct-info h5 {
    margin: 0 0 4px;
    font-size: 15px;
}

.ct-info p {
    margin: 0;
    font-size: 13px;
    color: var(--text-secondary);
}

.ct-switch {
    position: relative;
    width: 44px;
    height: 24px;
    background: #cbd5e1;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.2s;
}

.ct-switch.on { background: #2563eb; }

.ct-knob {
    position: absolute;
    top: 2px; left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
}

.ct-switch.on .ct-knob { transform: translateX(20px); }

/* Settings Inputs */
.settings-input-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
}

.s-in {
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: #f8fafc;
    flex-grow: 1;
    font-size: 14px;
}

.s-in:not([readonly]) { background: white; }
.s-in:not([readonly]):focus { outline: none; border-color: var(--primary); }

.pass-accordion {
    display: none;
    background: #f8fafc;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 20px;
    margin-bottom: 24px;
}

.pass-accordion.open { display: block; }

/* Profile View Banner Overide */
.pv-header-card {
    background: var(--bg-white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    margin-bottom: 24px;
}

.pv-banner {
    height: 120px;
    background: linear-gradient(135deg, #1d4ed8, #2563eb, #0ea5e9);
    position: relative;
}

.pv-body {
    padding: 24px;
    position: relative;
}

.pv-avatar {
    position: absolute;
    top: -56px; 
    left: 24px;
    width: 112px;
    height: 112px;
    background: #dbeafe;
    color: var(--primary);
    border: 4px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    font-weight: 700;
}

.pv-top-row {
    display: flex;
    justify-content: space-between;
    margin-left: 140px; /* offset for avatar */
}

.pv-name {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    font-size: 26px;
    margin: 0 0 4px;
}

.pv-meta {
    font-size: 15px;
    color: var(--text-secondary);
}

.pv-actions {
    display: flex;
    gap: 8px;
    align-items: flex-start;
}

.pv-bio-box {
    margin-top: 24px;
}

.pv-bio-text {
    font-size: 15px;
    line-height: 1.5;
    color: var(--text-primary);
}

.pv-stats-row {
    display: flex;
    gap: 16px;
    margin-top: 16px;
    font-size: 14px;
    color: var(--text-muted);
}

/* Rating Distributions */
.r-summary {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 32px;
}

.rs-big {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 48px;
    font-weight: 700;
    color: var(--primary);
}

.rs-stars {
    color: #f59e0b;
    font-size: 24px;
    letter-spacing: 2px;
    margin-bottom: 4px;
}

.rating-bars {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.rb-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.rb-label {
    width: 20px;
    font-size: 14px;
    color: var(--text-secondary);
}

.rb-bg {
    flex-grow: 1;
    height: 8px;
    background: #f1f5f9;
    border-radius: 4px;
    overflow: hidden;
}

.rb-fill {
    height: 100%;
    background: #f59e0b;
    border-radius: 4px;
}

.rb-count {
    width: 80px;
    font-size: 14px;
    color: var(--text-muted);
}
`;
fs.appendFileSync('css/style.css', cssAppend, 'utf8');

// 3. Build profile.html 
const dashboardHtml = fs.readFileSync('dashboard.html', 'utf8');
const dStart = dashboardHtml.indexOf('<div class="dashboard-container');
const dEnd = dashboardHtml.indexOf('</main>');

// Create profile container
const prContainer = `
<div class="dashboard-container">
    
    <div class="profile-header-card animate-on-scroll">
        <div class="ph-left">
            <div class="ph-photo-wrapper">
                <input type="file" id="fileAvatarInput" style="display:none;" accept="image/*">
                <div class="ph-photo">SN</div>
                <div class="ph-photo-overlay" onclick="document.getElementById('fileAvatarInput').click()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                    <span style="font-size: 12px; margin-top: 4px;">Change</span>
                </div>
            </div>
            <div class="ph-info">
                <h3>Student Name</h3>
                <div class="ph-info-dept">B.Tech Information Technology &middot; 2nd Year</div>
                <div class="ph-info-college">JNTU College of Engineering, Hyderabad</div>
                <div class="ph-info-bio" id="bioTextContainer">
                    Passionate about technology and peer learning. I teach Python and want to learn UI/UX design. I've been participating in online bootcamps to hone my skills and love helping others structure their thought processes logically.
                </div>
                <span class="read-more-link" id="bioReadMore">Read more</span>
                
                <div class="ph-stats-row">
                    <span>💎 42 credits</span> &middot; 
                    <span>⭐ 4.8 rating</span> &middot; 
                    <span>📅 12 sessions</span> &middot; 
                    <span>🎓 3 skills teaching</span>
                </div>
            </div>
        </div>
        
        <div class="ph-right">
            <div class="ph-ring-wrapper">
                <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="36" fill="none" stroke="#e2e8f0" stroke-width="6"></circle>
                    <circle cx="40" cy="40" r="36" fill="none" stroke="#2563eb" stroke-width="6" stroke-dasharray="226" stroke-dashoffset="63" stroke-linecap="round" style="transform-origin: center; transform: rotate(-90deg);"></circle>
                    <text x="40" y="46" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="18" fill="var(--text-primary)" text-anchor="middle">72%</text>
                </svg>
                <div class="pr-text">Profile Complete</div>
            </div>
            <div class="ph-todo-list">
                <a href="#settings" class="ph-todo-link" onclick="triggerSettings()">Add mobile number &rarr;</a>
                <a href="#overview" class="ph-todo-link">Add availability schedule &rarr;</a>
            </div>
            <div class="ph-actions">
                <button class="btn btn-primary btn-sm">Edit Profile</button>
                <button class="btn btn-ghost btn-sm" onclick="window.location.href='profile-view.html'">View Public Profile &rarr;</button>
            </div>
        </div>
    </div>

    <!-- TABS -->
    <div class="profile-tabs">
        <div class="p-tab active" data-target="tab-overview">Overview</div>
        <div class="p-tab" data-target="tab-skills">Skills</div>
        <div class="p-tab" data-target="tab-sessions">Sessions</div>
        <div class="p-tab" data-target="tab-credits">Credits</div>
        <div class="p-tab" data-target="tab-settings">Settings</div>
    </div>

    <!-- TAB 1: OVERVIEW -->
    <div class="p-tab-content active" id="tab-overview">
        <div class="tab-grid-60-40">
            <div class="col-left">
                
                <div class="p-card">
                    <div class="pc-title-row">
                        <h4>About Me</h4>
                        <button class="edit-icon-btn" id="editBioBtn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                    </div>
                    <div id="bioDisplay">
                        <p style="font-size: 14px; line-height: 1.6; color: var(--text-primary); margin: 0;">Passionate about technology and peer learning. I teach Python and want to learn UI/UX design. I've been participating in online bootcamps to hone my skills and love helping others structure their thought processes logically.</p>
                    </div>
                    <div id="bioEditForm" style="display:none;">
                        <textarea class="cm-input" rows="4" style="width: 100%; margin-bottom: 12px;"></textarea>
                        <div style="display:flex; gap:8px;">
                            <button class="btn btn-primary btn-sm">Save</button>
                            <button class="btn btn-ghost btn-sm" id="cancelBioEdit">Cancel</button>
                        </div>
                    </div>
                </div>

                <div class="p-card">
                    <div class="pc-title-row">
                        <h4>Personal Details</h4>
                        <button class="edit-icon-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                    </div>
                    <div class="detail-row"><div class="detail-label">Department</div><div class="detail-val">B.Tech Information Technology</div></div>
                    <div class="detail-row"><div class="detail-label">Year</div><div class="detail-val">2nd Year</div></div>
                    <div class="detail-row"><div class="detail-label">College</div><div class="detail-val">JNTU College of Engineering</div></div>
                    <div class="detail-row">
                        <div class="detail-label">Mobile</div>
                        <div class="detail-val" style="color: var(--text-muted); font-weight:400;">Not added <a href="#settings" class="ph-todo-link" onclick="triggerSettings()">Add &rarr;</a></div>
                    </div>
                </div>

                <div class="p-card">
                    <div class="pc-title-row">
                        <h4>When are you available for sessions?</h4>
                    </div>
                    
                    <div class="avail-grid" id="profileAvailGrid">
                        <div></div> <!-- empty corner -->
                        <div class="avail-label-top">Mon</div>
                        <div class="avail-label-top">Tue</div>
                        <div class="avail-label-top">Wed</div>
                        <div class="avail-label-top">Thu</div>
                        <div class="avail-label-top">Fri</div>
                        <div class="avail-label-top">Sat</div>
                        <div class="avail-label-top">Sun</div>
                        
                        <div class="avail-label-side">Morning</div>
                        <div class="avail-cell"></div><div class="avail-cell"></div><div class="avail-cell"></div><div class="avail-cell"></div><div class="avail-cell"></div><div class="avail-cell"></div><div class="avail-cell"></div>
                        
                        <div class="avail-label-side">Afternoon</div>
                        <div class="avail-cell active"></div><div class="avail-cell active"></div><div class="avail-cell active"></div><div class="avail-cell active"></div><div class="avail-cell active"></div><div class="avail-cell"></div><div class="avail-cell"></div>
                        
                        <div class="avail-label-side">Evening</div>
                        <div class="avail-cell active"></div><div class="avail-cell active"></div><div class="avail-cell active"></div><div class="avail-cell active"></div><div class="avail-cell active"></div><div class="avail-cell"></div><div class="avail-cell"></div>
                    </div>
                    <button class="btn btn-primary btn-sm" id="saveSchedBtn" style="margin-top: 20px; display:none;">Save Schedule</button>
                    <p style="font-size: 13px; color:var(--text-muted); margin: 12px 0 0;">Green indicates you are available to teach or learn.</p>
                </div>

            </div>

            <div class="col-right">
                <div class="p-card">
                    <div class="pc-title-row">
                        <h4>Recent Reviews</h4>
                    </div>
                    <div class="review-mini-card">
                        <div class="rm-top"><div class="rm-av">AM</div><b>Arjun Mehta</b> &middot; <span class="rm-star">★★★★★</span> &middot; <span class="rm-date">2 days ago</span></div>
                        <div class="rm-comment">"Excellent Python teacher, very patient and clear with explanations. Would definitely book again."</div>
                    </div>
                    <div class="review-mini-card">
                        <div class="rm-top"><div class="rm-av" style="background:#fce7f3;color:#be185d;">PS</div><b>Priya Sharma</b> &middot; <span class="rm-star">★★★★★</span> &middot; <span class="rm-date">1 week ago</span></div>
                        <div class="rm-comment">"Helped me understand UI/UX basics in just one session. Very structured teaching approach."</div>
                    </div>
                    <div class="review-mini-card" style="border:none;">
                        <div class="rm-top"><div class="rm-av" style="background:#dcfce7;color:#15803d;">RV</div><b>Rohit Verma</b> &middot; <span class="rm-star" style="color:#d1d5db;"><span style="color:#f59e0b">★★★★</span>★</span> &middot; <span class="rm-date">2 weeks ago</span></div>
                        <div class="rm-comment">"Good session overall, clear communication and good knowledge of the subject."</div>
                    </div>
                    <a href="javascript:void(0)" class="ph-todo-link" style="display:block; text-align:center; margin-top:8px;">View All Reviews &rarr;</a>
                </div>

                <div class="p-card">
                    <div class="pc-title-row">
                        <h4>Endorsements received</h4>
                    </div>
                    <div class="endorsement-row">
                        <div style="font-weight:500; font-size:14px; width:80px;">Python</div>
                        <div style="font-size:14px;">🔵 <span style="color:var(--text-secondary);">8 endorsements</span></div>
                        <button class="btn btn-ghost btn-sm" disabled title="This is your own skill">Endorse</button>
                    </div>
                    <div class="endorsement-row">
                        <div style="font-weight:500; font-size:14px; width:80px;">Guitar</div>
                        <div style="font-size:14px;">🟢 <span style="color:var(--text-secondary);">3 endorsements</span></div>
                        <button class="btn btn-ghost btn-sm" disabled title="This is your own skill">Endorse</button>
                    </div>
                    <div class="endorsement-row">
                        <div style="font-weight:500; font-size:14px; width:80px;">Excel</div>
                        <div style="font-size:14px;">🔵 <span style="color:var(--text-secondary);">5 endorsements</span></div>
                        <button class="btn btn-ghost btn-sm" disabled title="This is your own skill">Endorse</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- TAB 2: SKILLS -->
    <div class="p-tab-content" id="tab-skills">
        <div class="tab-grid-split">
            
            <div class="p-card" style="border-top: 3px solid #10b981;">
                <h4 style="margin: 0 0 20px;">Skills I Teach</h4>
                
                <div class="sk-column">
                    <div class="sk-large-card">
                        <div class="sk-lc-top">
                            <h4>Python</h4>
                            <div class="sk-actions">
                                <button class="btn btn-ghost btn-sm">Edit</button>
                                <button class="btn btn-ghost btn-sm" style="color:#ef4444;">Remove</button>
                            </div>
                        </div>
                        <div class="b-skill-pill pill-teach" style="display:inline-block; margin-bottom:12px;">Advanced</div>
                        <div class="sk-lc-stats" style="color:var(--text-muted);">
                            6 sessions taught &middot; 4.9 ★ average rating &middot; 8 endorsements
                        </div>
                    </div>
                    
                    <div class="sk-large-card">
                        <div class="sk-lc-top">
                            <h4>Guitar</h4>
                            <div class="sk-actions">
                                <button class="btn btn-ghost btn-sm">Edit</button>
                                <button class="btn btn-ghost btn-sm" style="color:#ef4444;">Remove</button>
                            </div>
                        </div>
                        <div class="b-skill-pill pill-teach" style="display:inline-block; margin-bottom:12px; background:#f1f5f9; color:var(--text-primary);">Intermediate</div>
                        <div class="sk-lc-stats" style="color:var(--text-muted);">
                            3 sessions taught &middot; 4.7 ★ average rating &middot; 3 endorsements
                        </div>
                    </div>
                    
                    <div class="sk-large-card">
                        <div class="sk-lc-top">
                            <h4>Excel</h4>
                            <div class="sk-actions">
                                <button class="btn btn-ghost btn-sm">Edit</button>
                                <button class="btn btn-ghost btn-sm" style="color:#ef4444;">Remove</button>
                            </div>
                        </div>
                        <div class="b-skill-pill pill-teach" style="display:inline-block; margin-bottom:12px; background:#f1f5f9; color:var(--text-primary);">Intermediate</div>
                        <div class="sk-lc-stats" style="color:var(--text-muted);">
                            3 sessions taught &middot; 4.8 ★ average rating &middot; 5 endorsements
                        </div>
                    </div>
                </div>

                <div class="p-card" style="border: 2px dashed var(--border); background: #fafafa; text-align: center; cursor: pointer; margin-top: 16px;" id="addTeachSkillBtn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-muted); margin-bottom:8px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    <div style="font-weight: 500; font-size: 15px;">+ Add New Skill to Teach</div>
                </div>
            </div>
            
            <div class="p-card" style="border-top: 3px solid #3b82f6;">
                <h4 style="margin: 0 0 20px;">Skills I Want to Learn</h4>
                
                <div class="sk-column">
                    <div class="sk-large-card" style="padding: 16px;">
                        <div class="sk-lc-top" style="margin:0; align-items:center;">
                            <div style="display:flex; align-items:center; gap: 12px;">
                                <h4 style="font-size: 16px;">UI/UX Design</h4>
                                <div class="b-skill-pill pill-teach" style="background:#dcfce7; color:#15803d; font-size:11px;">Actively looking</div>
                            </div>
                            <button class="edit-icon-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                        </div>
                    </div>
                    
                    <div class="sk-large-card" style="padding: 16px;">
                        <div class="sk-lc-top" style="margin:0; align-items:center;">
                            <div style="display:flex; align-items:center; gap: 12px;">
                                <h4 style="font-size: 16px;">French</h4>
                                <div class="b-skill-pill pill-teach" style="background:#dcfce7; color:#15803d; font-size:11px;">Actively looking</div>
                            </div>
                            <button class="edit-icon-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                        </div>
                    </div>

                    <div class="sk-large-card" style="padding: 16px;">
                        <div class="sk-lc-top" style="margin:0; align-items:center;">
                            <div style="display:flex; align-items:center; gap: 12px;">
                                <h4 style="font-size: 16px;">React</h4>
                                <div class="b-skill-pill pill-teach" style="background:#f1f5f9; color:var(--text-muted); font-size:11px;">Not searching currently</div>
                            </div>
                            <button class="edit-icon-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                        </div>
                    </div>
                </div>

                <div class="p-card" style="border: 2px dashed var(--border); background: #fafafa; text-align: center; cursor: pointer; margin-top: 16px;" id="addLearnSkillBtn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-muted); margin-bottom:8px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    <div style="font-weight: 500; font-size: 15px;">+ Add New Skill to Learn</div>
                </div>
            </div>

        </div>
    </div>

    <!-- TAB 3: SESSIONS -->
    <div class="p-tab-content" id="tab-sessions">
        <div class="p-card">
            <div class="cm-pill-select" style="margin-bottom: 24px;">
                <button class="rm-pill active">All</button>
                <button class="rm-pill">Upcoming</button>
                <button class="rm-pill">Completed</button>
                <button class="rm-pill">Cancelled</button>
            </div>
            
            <div class="sessions-list" style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                <div class="session-card s-learning">
                    <div class="s-role">You're learning</div>
                    <h4 class="s-title">Python</h4>
                    <div class="s-detail">with Arjun Mehta</div>
                    <div class="s-meta"><span>📅 Tomorrow &middot; 3:00 PM</span></div>
                    <div class="s-status st-confirmed">Confirmed</div>
                </div>
                <div class="session-card s-teaching">
                    <div class="s-role">You're teaching</div>
                    <h4 class="s-title">Guitar</h4>
                    <div class="s-detail">to Rohit Verma</div>
                    <div class="s-meta"><span>📅 Friday &middot; 5:30 PM</span></div>
                    <div class="s-status st-pending">Pending</div>
                </div>
                <div class="session-card s-learning" style="opacity: 0.8;">
                    <div class="s-role">You're learning</div>
                    <h4 class="s-title">Figma</h4>
                    <div class="s-detail">with Priya Sharma</div>
                    <div class="s-meta"><span>📅 Last Monday</span></div>
                    <div class="s-status" style="background:#e2e8f0; color:#475569;">Completed ✓</div>
                </div>
                <div class="session-card s-teaching" style="opacity: 0.8;">
                    <div class="s-role">You're teaching</div>
                    <h4 class="s-title">Excel</h4>
                    <div class="s-detail">to Dev Nair</div>
                    <div class="s-meta"><span>📅 Last Wednesday</span></div>
                    <div class="s-status" style="background:#e2e8f0; color:#475569;">Completed ✓</div>
                </div>
                <div class="session-card s-learning" style="opacity: 0.6;">
                    <div class="s-role">You're learning</div>
                    <h4 class="s-title">Spanish</h4>
                    <div class="s-detail">with Unknown</div>
                    <div class="s-meta"><span>📅 Unknown Status</span></div>
                    <div class="s-status" style="background:#fee2e2; color:#ef4444;">Cancelled</div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top:24px;">
                <button class="btn btn-ghost" onclick="window.location.href='sessions.html'">View All Sessions &rarr;</button>
            </div>
        </div>
    </div>

    <!-- TAB 4: CREDITS -->
    <div class="p-tab-content" id="tab-credits">
         <!-- Use same layout from index for credit simplicity -->
         <div class="tab-grid-split">
            <div class="p-card" style="background:var(--primary-dark); color:white; border:none; text-align:center; display:flex; flex-direction:column; justify-content:center;">
                <h4 style="color:var(--primary-light); font-weight:500; font-size:16px;">Current Balance</h4>
                <div class="display-font" style="font-size:64px; margin: 16px 0;">42</div>
                <button class="btn btn-primary" style="background:white; color:var(--primary-dark);" onclick="window.location.href='credits.html'">View Full History &rarr;</button>
            </div>
            
            <div class="p-card">
                <h4 style="margin-bottom: 20px;">Recent Transactions</h4>
                <div style="display:flex; justify-content:space-between; margin-bottom:16px; border-bottom:1px solid var(--border); padding-bottom:8px;">
                    <div>Taught Python Basics <div style="font-size:12px; color:var(--text-muted);">2h ago</div></div>
                    <div style="color:var(--success); font-weight:600;">+8 credits</div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:16px; border-bottom:1px solid var(--border); padding-bottom:8px;">
                    <div>5-star rating received <div style="font-size:12px; color:var(--text-muted);">2h ago</div></div>
                    <div style="color:var(--success); font-weight:600;">+2 credits</div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:16px; border-bottom:1px solid var(--border); padding-bottom:8px;">
                    <div>Requested Figma session <div style="font-size:12px; color:var(--text-muted);">1d ago</div></div>
                    <div style="color:#ef4444; font-weight:600;">−5 credits</div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:16px; border-bottom:1px solid var(--border); padding-bottom:8px;">
                    <div>Taught Guitar session <div style="font-size:12px; color:var(--text-muted);">3d ago</div></div>
                    <div style="color:var(--success); font-weight:600;">+8 credits</div>
                </div>
                <div style="display:flex; justify-content:space-between; padding-bottom:8px;">
                    <div>Profile completed <div style="font-size:12px; color:var(--text-muted);">4d ago</div></div>
                    <div style="color:var(--success); font-weight:600;">+5 credits</div>
                </div>
            </div>
         </div>
    </div>

    <!-- TAB 5: SETTINGS -->
    <div class="p-tab-content" id="tab-settings">
        <div class="p-card" style="max-width: 800px;">
            
            <h4 style="margin-bottom: 24px; font-size:18px;">Account</h4>
            <div class="settings-input-row">
                <div style="width:120px; font-weight:500;">Email</div>
                <input type="email" class="s-in" value="student@jntu.ac.in" readonly>
                <button class="btn btn-ghost btn-sm" style="flex-shrink:0;">Change Email</button>
            </div>
            
            <div class="settings-input-row">
                <div style="width:120px; font-weight:500;">Password</div>
                <input type="password" class="s-in" value="••••••••" readonly>
                <button class="btn btn-ghost btn-sm" id="btnChangePass" style="flex-shrink:0;">Change Password</button>
            </div>
            
            <div class="pass-accordion" id="passForm">
                <input type="password" class="cm-input" placeholder="Current Password" style="margin-bottom:12px;">
                <input type="password" class="cm-input" placeholder="New Password" style="margin-bottom:12px;">
                <div style="height: 4px; border-radius: 2px; width: 30%; background: var(--success); margin-bottom:12px;"></div>
                <input type="password" class="cm-input" placeholder="Confirm New Password" style="margin-bottom:16px;">
                <button class="btn btn-primary btn-sm">Save Password</button>
                <button class="btn btn-ghost btn-sm" id="btnCancelPass">Cancel</button>
            </div>

            <div class="settings-input-row">
                <div style="width:120px; font-weight:500;">Mobile</div>
                <input type="text" class="s-in" placeholder="+91">
                <button class="btn btn-primary btn-sm" style="flex-shrink:0;">Save</button>
            </div>

            <hr style="border:none; border-top:1px solid var(--border); margin: 32px 0;">

            <h4 style="margin-bottom: 8px; font-size:18px;">Email Notifications</h4>
            
            <div class="custom-toggle">
                <div class="ct-info">
                    <h5>Session request received</h5>
                    <p>Get an email when someone wants to book you.</p>
                </div>
                <div class="ct-switch on" data-setting="notif_req">
                    <div class="ct-knob"></div>
                </div>
            </div>
            
            <div class="custom-toggle">
                <div class="ct-info">
                    <h5>Session confirmed or cancelled</h5>
                    <p>Updates about your upcoming schedule.</p>
                </div>
                <div class="ct-switch on" data-setting="notif_conf">
                    <div class="ct-knob"></div>
                </div>
            </div>

            <div class="custom-toggle">
                <div class="ct-info">
                    <h5>New message received</h5>
                    <p>Direct chat notifications.</p>
                </div>
                <div class="ct-switch on" data-setting="notif_chat">
                    <div class="ct-knob"></div>
                </div>
            </div>
            
            <div class="custom-toggle">
                <div class="ct-info">
                    <h5>Credit activity</h5>
                    <p>Summary of credits earned and spent.</p>
                </div>
                <div class="ct-switch on" data-setting="notif_cred">
                    <div class="ct-knob"></div>
                </div>
            </div>

            <hr style="border:none; border-top:1px solid var(--border); margin: 32px 0;">

            <h4 style="margin-bottom: 8px; font-size:18px;">Privacy</h4>
            
            <div class="custom-toggle">
                <div class="ct-info">
                    <h5>Show profile in browse results</h5>
                    <p>Turn off to hide from peer searches.</p>
                </div>
                <div class="ct-switch on" data-setting="priv_browse">
                    <div class="ct-knob"></div>
                </div>
            </div>

            <div class="custom-toggle">
                <div class="ct-info">
                    <h5>Show credit balance publicly</h5>
                    <p>Allows others to see your exact balance.</p>
                </div>
                <div class="ct-switch" data-setting="priv_cred">
                    <div class="ct-knob"></div>
                </div>
            </div>

            <div class="custom-toggle">
                <div class="ct-info">
                    <h5>Allow session requests from anyone</h5>
                    <p>Toggle off to only accept requests from existing contacts.</p>
                </div>
                <div class="ct-switch on" data-setting="priv_req">
                    <div class="ct-knob"></div>
                </div>
            </div>

            <hr style="border:none; border-top:1px solid var(--border); margin: 32px 0;">

            <div class="p-card-danger">
                <h4 style="color:#dc2626; margin:0 0 8px; font-size:18px;">Delete Account</h4>
                <p style="margin:0 0 16px; font-size:14px; color:var(--text-secondary);">This permanently deletes your account, all sessions, credits, and messages. Cannot be undone.</p>
                <button class="btn btn-ghost" style="color:#dc2626; border-color:#fca5a5; background:white;" id="btnPreDelete">Delete My Account</button>
            </div>

        </div>
    </div>

</div>

<!-- Delete Modal -->
<div class="custom-modal-overlay" id="deleteModalOverlay">
    <div class="custom-modal">
        <div class="cm-header">
            <h3>Delete Account</h3>
            <button class="cm-close" id="closeDelModal">&times;</button>
        </div>
        <div class="cm-body">
            <p style="font-size:14px; margin-bottom:16px;">Type <strong>DELETE</strong> to confirm. This cannot be undone.</p>
            <input type="text" class="cm-input" placeholder="Type DELETE here" id="deleteInput" style="margin-bottom:24px;">
            <button class="btn btn-primary" id="btnConfirmDelete" style="width:100%; margin-bottom:8px; background:#cbd5e1; border-color:#cbd5e1;" disabled>Confirm Delete</button>
            <button class="btn btn-ghost" id="btnCancelDelete" style="width:100%;">Cancel</button>
        </div>
    </div>
</div>
`;

let prHtml = dashboardHtml
    .replace('<title>Dashboard - SkillNest</title>', '<title>My Profile - SkillNest</title>')
    .replace('class="sidebar-link active"', 'class="sidebar-link"')
    .replace(/>\s*<svg[^>]*>\s*<path[^>]*><\/path>\s*<circle[^>]*><\/circle>\s*<\/svg>\s*My Profile\s*<\/a>/i, 'class="sidebar-link active">$&'.replace('class="sidebar-link active">class="sidebar-link"', 'class="sidebar-link active"'))
    .replace('Good morning 👋', 'My Profile')
    .replace('<div style="font-size: 13px; color: var(--text-secondary);" id="currentDate">Date Placeholder</div>', '<div style="font-size: 13px; color: var(--text-secondary);">Manage your platform settings</div>');

prHtml = prHtml.substring(0, dStart) + prContainer + "\n    " + prHtml.substring(dEnd);
fs.writeFileSync('profile.html', prHtml, 'utf8');

// 4. Build profile-view.html
// Very similar frame
const pvContainer = `
<div class="dashboard-container">

    <div class="pv-header-card">
        <div class="pv-banner"></div>
        <div class="pv-body">
            <div class="pv-avatar">AM</div>
            
            <div class="pv-top-row">
                <div>
                    <h3 class="pv-name">Arjun Mehta</h3>
                    <div class="pv-meta">B.Tech CSE &middot; 3rd Year &middot; JNTU College</div>
                </div>
                <div class="pv-actions">
                    <button class="btn btn-primary">Request Session</button>
                    <button class="btn btn-ghost" onclick="window.location.href='chat-conversation.html'">Send Message</button>
                    <button class="btn btn-ghost btn-icon" id="shareProfileBtn" style="padding: 10px;" title="Share Profile">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    </button>
                </div>
            </div>

            <div class="pv-bio-box">
                <div class="pv-bio-text">Passionate programmer who loves teaching Python and Machine Learning. 14 sessions completed on SkillNest.</div>
                <div class="pv-stats-row">
                    <span>14 sessions</span> &middot; 
                    <span>4.9 ★ rating</span> &middot; 
                    <span>2 skills teaching</span> &middot; 
                    <span>Member since Jan 2025</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Skills Columns -->
    <div class="tab-grid-split" style="margin-bottom: 24px;">
        <div class="p-card" style="border-top: 3px solid #10b981; margin:0;">
            <h4 style="margin: 0 0 20px;">Arjun Teaches</h4>
            <div class="sk-column">
                <div class="sk-large-card">
                    <div class="sk-lc-top">
                        <h4>Python</h4>
                        <button class="btn btn-ghost btn-sm" style="color:var(--primary);">Endorse</button>
                    </div>
                    <div class="b-skill-pill pill-teach" style="display:inline-block; margin-bottom:12px;">Advanced</div>
                    <div class="sk-lc-stats" style="color:var(--text-muted);">
                        10 sessions &middot; 4.9 ★ &middot; 8 endorsements
                    </div>
                </div>
                <div class="sk-large-card">
                    <div class="sk-lc-top">
                        <h4>Machine Learning</h4>
                        <button class="btn btn-ghost btn-sm" style="color:var(--primary);">Endorse</button>
                    </div>
                    <div class="b-skill-pill pill-teach" style="display:inline-block; margin-bottom:12px; background:#f1f5f9; color:var(--text-primary);">Intermediate</div>
                    <div class="sk-lc-stats" style="color:var(--text-muted);">
                        4 sessions &middot; 4.8 ★ &middot; 3 endorsements
                    </div>
                </div>
            </div>
        </div>

        <div class="p-card" style="border-top: 3px solid #3b82f6; margin:0;">
            <h4 style="margin: 0 0 20px;">Arjun Wants to Learn</h4>
            <div class="b-pill-container">
                <div class="b-skill-pill pill-learn" style="font-size:14px; padding: 8px 16px;">Guitar</div>
                <div class="b-skill-pill pill-learn" style="font-size:14px; padding: 8px 16px;">Music Theory</div>
            </div>
        </div>
    </div>

    <!-- Reviews -->
    <div class="p-card">
        <h4 style="margin-bottom: 24px;">Reviews</h4>
        
        <div class="r-summary">
            <div class="rs-big">4.9</div>
            <div>
                <div class="rs-stars">★★★★★</div>
                <div style="font-size:14px; color:var(--text-secondary);">Based on 14 reviews</div>
            </div>
            
            <div class="rating-bars" style="flex-grow:1; max-width:300px; margin-left:auto;">
                <div class="rb-row"><div class="rb-label">5★</div><div class="rb-bg"><div class="rb-fill" style="width: 71%;"></div></div><div class="rb-count">10 reviews</div></div>
                <div class="rb-row"><div class="rb-label">4★</div><div class="rb-bg"><div class="rb-fill" style="width: 21%;"></div></div><div class="rb-count">3 reviews</div></div>
                <div class="rb-row"><div class="rb-label">3★</div><div class="rb-bg"><div class="rb-fill" style="width: 8%;"></div></div><div class="rb-count">1 review</div></div>
                <div class="rb-row"><div class="rb-label">2★</div><div class="rb-bg"><div class="rb-fill" style="width: 0%;"></div></div><div class="rb-count">0 reviews</div></div>
                <div class="rb-row"><div class="rb-label">1★</div><div class="rb-bg"><div class="rb-fill" style="width: 0%;"></div></div><div class="rb-count">0 reviews</div></div>
            </div>
        </div>

        <hr style="border:none; border-top:1px solid var(--border); margin: 24px 0;">

        <div class="review-mini-card">
            <div class="rm-top"><div class="rm-av" style="background:#fce7f3;color:#be185d;">PS</div><b>Priya Sharma</b> &middot; <span class="rm-star">★★★★★</span> &middot; <span class="rm-date">1 week ago</span></div>
            <div class="rm-comment">"Arjun explained Python concepts in a way that finally made sense. Highly recommend."</div>
        </div>
        <div class="review-mini-card">
            <div class="rm-top"><div class="rm-av" style="background:#dcfce7;color:#15803d;">RV</div><b>Rohit Verma</b> &middot; <span class="rm-star">★★★★★</span> &middot; <span class="rm-date">2 weeks ago</span></div>
            <div class="rm-comment">"Great teacher, very knowledgeable and patient."</div>
        </div>
        <div class="review-mini-card" style="border:none;">
            <div class="rm-top"><div class="rm-av" style="background:#dbeafe;color:#1d4ed8;">DN</div><b>Dev Nair</b> &middot; <span class="rm-star" style="color:#d1d5db;"><span style="color:#f59e0b">★★★★</span>★</span> &middot; <span class="rm-date">3 weeks ago</span></div>
            <div class="rm-comment">"Solid session, covered all the topics I needed."</div>
        </div>
    </div>

    <!-- Availability -->
    <div class="p-card" style="margin-bottom: 40px;">
        <div class="pc-title-row">
            <h4>Available for Sessions</h4>
        </div>
        <div class="avail-grid">
            <div></div> <!-- empty corner -->
            <div class="avail-label-top">Mon</div>
            <div class="avail-label-top">Tue</div>
            <div class="avail-label-top">Wed</div>
            <div class="avail-label-top">Thu</div>
            <div class="avail-label-top">Fri</div>
            <div class="avail-label-top">Sat</div>
            <div class="avail-label-top">Sun</div>
            
            <div class="avail-label-side">Morning</div>
            <div class="avail-cell readonly"></div><div class="avail-cell readonly"></div><div class="avail-cell readonly"></div><div class="avail-cell readonly"></div><div class="avail-cell readonly"></div><div class="avail-cell readonly"></div><div class="avail-cell readonly"></div>
            
            <div class="avail-label-side">Afternoon</div>
            <div class="avail-cell readonly active"></div><div class="avail-cell readonly active"></div><div class="avail-cell readonly active"></div><div class="avail-cell readonly active"></div><div class="avail-cell readonly active"></div><div class="avail-cell readonly"></div><div class="avail-cell readonly"></div>
            
            <div class="avail-label-side">Evening</div>
            <div class="avail-cell readonly active"></div><div class="avail-cell readonly active"></div><div class="avail-cell readonly active"></div><div class="avail-cell readonly active"></div><div class="avail-cell readonly active"></div><div class="avail-cell readonly"></div><div class="avail-cell readonly"></div>
        </div>
        <div style="margin-top: 24px;">
            <p style="font-size:14px; color:var(--text-secondary); margin-bottom:12px;">Request a session during available times</p>
            <button class="btn btn-primary" style="width: auto; padding: 10px 24px;">Request Session</button>
        </div>
    </div>

</div>

<!-- TOAST -->
<div class="custom-toast" id="pvToast">
    <div class="ct-content">✓ Profile link copied to clipboard!</div>
</div>
`;

let pvHtml = dashboardHtml
    .replace('<title>Dashboard - SkillNest</title>', '<title>Student Profile - SkillNest</title>')
    .replace('Good morning 👋', 'Student Profile')
    .replace('<div style="font-size: 13px; color: var(--text-secondary);" id="currentDate">Date Placeholder</div>', '<div style="font-size: 13px; color: var(--text-secondary);">Public read-only view</div>');

pvHtml = pvHtml.substring(0, dStart) + pvContainer + "\n    " + pvHtml.substring(dEnd);
// Active state removal for sidebar in profile-view
pvHtml = pvHtml.replace(/<a href="dashboard\.html" class="sidebar-link active">([\s\S]*?Dashboard\s*)<\/a>/g, '<a href="dashboard.html" class="sidebar-link">$1</a>');

fs.writeFileSync('profile-view.html', pvHtml, 'utf8');
console.log('Created profile.html and profile-view.html and appended CSS safely.');
