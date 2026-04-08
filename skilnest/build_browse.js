const fs = require('fs');

const cardsData = [
  {name: 'Arjun Mehta', dept: 'CSE 3rd Year', rating: '4.9', sessions: 14, teach: ['Python', 'Machine Learning', 'Data Analysis'], learn: ['Guitar', 'Music Theory'], credits: 54, match: 87, bg: '#dbeafe', color: '#1d4ed8', initials: 'AM'},
  {name: 'Priya Sharma', dept: 'IT 2nd Year', rating: '4.7', sessions: 9, teach: ['UI/UX Design', 'Figma', 'Canva'], learn: ['Python', 'Data Analysis'], credits: 38, match: 76, bg: '#fce7f3', color: '#be185d', initials: 'PS'},
  {name: 'Rohit Verma', dept: 'CSE 4th Year', rating: '4.8', sessions: 21, teach: ['React', 'JavaScript', 'Git'], learn: ['Spanish', 'Communication'], credits: 86, match: 91, bg: '#dcfce7', color: '#15803d', initials: 'RV'},
  {name: 'Ananya Iyer', dept: 'MBA 1st Year', rating: '4.6', sessions: 7, teach: ['Public Speaking', 'Digital Marketing'], learn: ['Excel', 'Financial Planning'], credits: 22, match: 82, bg: '#fef3c7', color: '#d97706', initials: 'AI'},
  {name: 'Karan Singh', dept: 'ECE 3rd Year', rating: '4.5', sessions: 11, teach: ['Arduino', 'C++', 'Linux'], learn: ['Photoshop', 'Video Editing'], credits: 41, match: 67, bg: '#ede9fe', color: '#6d28d9', initials: 'KS'},
  {name: 'Sneha Patel', dept: 'IT 3rd Year', rating: '4.8', sessions: 16, teach: ['Video Editing', 'Motion Graphics', 'Canva'], learn: ['Python', 'Machine Learning'], credits: 63, match: 73, bg: '#fce7f3', color: '#be185d', initials: 'SP'},
  {name: 'Dev Nair', dept: 'CSE 2nd Year', rating: '4.3', sessions: 6, teach: ['Git', 'Linux', 'Cybersecurity'], learn: ['Music Production', 'Guitar'], credits: 18, match: 58, bg: '#dbeafe', color: '#1d4ed8', initials: 'DN'},
  {name: 'Meera Joshi', dept: 'Arts 2nd Year', rating: '4.7', sessions: 8, teach: ['French', 'Photography', 'Essay Writing'], learn: ['Figma', 'UI/UX Design'], credits: 29, match: 69, bg: '#fef3c7', color: '#d97706', initials: 'MJ'},
  {name: 'Aditya Rao', dept: 'CSE 4th Year', rating: '5.0', sessions: 28, teach: ['Data Analysis', 'SQL', 'Statistics'], learn: ['Guitar', 'Piano'], credits: 92, match: 88, bg: '#dcfce7', color: '#15803d', initials: 'AR'},
  {name: 'Kavya Reddy', dept: 'IT 1st Year', rating: '4.4', sessions: 5, teach: ['Canva', 'Illustrator', 'Branding'], learn: ['React', 'JavaScript'], credits: 12, match: 54, bg: '#ede9fe', color: '#6d28d9', initials: 'KR'},
  {name: 'Siddharth Kumar', dept: 'MBA 2nd Year', rating: '4.6', sessions: 13, teach: ['Financial Planning', 'Leadership', 'Economics'], learn: ['Video Editing', 'Photoshop'], credits: 47, match: 71, bg: '#fef3c7', color: '#d97706', initials: 'SK'},
  {name: 'Riya Desai', dept: 'CSE 3rd Year', rating: '4.8', sessions: 17, teach: ['Flutter', 'Dart', 'React'], learn: ['Spanish', 'French'], credits: 71, match: 79, bg: '#dcfce7', color: '#15803d', initials: 'RD'}
];

function getMatchBadge(match) {
    if (match >= 80) return `<div class="b-match-badge badge-high">${match}% match</div>`;
    if (match >= 60) return `<div class="b-match-badge badge-med">${match}% match</div>`;
    return `<div class="b-match-badge badge-low">${match}% match</div>`;
}

function getIndicator(learnArray, teachArray) {
    let indicators = '';
    // Let's just hardcode some overlaps for visuals
    if(learnArray.length > 0) indicators += `<div class="overlap-text overlap-green">✓ Matches your learning goals</div>`;
    if(teachArray.length > 0) indicators += `<div class="overlap-text overlap-blue">✓ Needs what you can teach</div>`;
    return indicators;
}

let cardsHTML = '';
cardsData.forEach(c => {
    
    let teachPills = c.teach.map(t => `<div class="b-skill-pill pill-teach">${t}</div>`).join('');
    let learnPills = c.learn.map(t => `<div class="b-skill-pill pill-learn">${t}</div>`).join('');

    cardsHTML += `
<div class="b-match-card" data-name="${c.name.toLowerCase()}" data-dept="${c.dept.toLowerCase()}" data-rating="${c.rating}" data-credits="${c.credits}" data-match="${c.match}">
    ${getMatchBadge(c.match)}
    <div class="b-card-top">
        <div class="b-avatar" style="background:${c.bg}; color:${c.color};">${c.initials}</div>
        <div class="b-user-info">
            <h4 class="b-name">${c.name}</h4>
            <div class="b-dept">${c.dept}</div>
            <div class="b-rating">${c.rating} ★ <span class="b-sessions">(${c.sessions} sessions)</span></div>
        </div>
    </div>
    <div class="b-card-mid">
        <div class="b-label-teach">Can Teach You:</div>
        <div class="b-pill-container">${teachPills}</div>
        <div class="b-label-learn">Wants to Learn:</div>
        <div class="b-pill-container">${learnPills}</div>
        <div class="b-indicators">
            ${getIndicator(c.learn, c.teach)}
        </div>
    </div>
    <div class="b-card-bottom">
        <div class="b-cost">💎 ${c.credits} credits</div>
        <div class="b-card-actions">
            <button class="btn btn-ghost btn-sm" onclick="window.location.href='profile-view.html'">View Profile</button>
            <button class="btn btn-primary btn-sm btn-request-session" data-name="${c.name}" data-skills="${c.teach.join(',')}">Request Session</button>
        </div>
    </div>
</div>
`;
});

const dashboardHtml = fs.readFileSync('dashboard.html', 'utf8');

// Replace standard stuff
let browseHtml = dashboardHtml
    .replace('<title>Dashboard - SkillNest</title>', '<title>Browse & Match - SkillNest</title>')
    .replace('class="sidebar-link active"', 'class="sidebar-link"')
    .replace(/>\s*<svg[^>]*>[\s\S]*?<\/svg>\s*Browse Skills\s*<\/a>/i, 'class="sidebar-link active">$&'.replace('class="sidebar-link active">class="sidebar-link"', 'class="sidebar-link active"'))
    .replace('Good morning 👋', 'Browse & Match')
    .replace('<div style="font-size: 13px; color: var(--text-secondary);" id="currentDate">Date Placeholder</div>', '<div style="font-size: 13px; color: var(--text-secondary);">Find the perfect peer mentor</div>');

// The main container replacement
const containerStart = browseHtml.indexOf('<div class="dashboard-container">');
const containerEnd = browseHtml.indexOf('</main>');

const newContainer = `
<div class="dashboard-container browse-page-container">
    
    <!-- SECTION 1 - Search & Filter Bar -->
    <div class="b-search-filter-card">
        <div class="b-search-row">
            <div class="search-input-wrapper">
                <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" id="browseSearchInput" placeholder="Search by skill, name, or department...">
                <button id="browseClearSearch" class="clear-search-btn" style="display:none;">&times;</button>
            </div>
        </div>
        <div class="b-filter-row">
            <span class="filter-label">Filter by:</span>
            
            <div class="filter-group" id="filter-category">
                <button class="b-filter-pill active" data-val="all">All</button>
                <button class="b-filter-pill" data-val="tech">Tech</button>
                <button class="b-filter-pill" data-val="design">Design</button>
                <button class="b-filter-pill" data-val="languages">Languages</button>
                <button class="b-filter-pill" data-val="music">Music</button>
                <button class="b-filter-pill" data-val="academic">Academic</button>
                <button class="b-filter-pill" data-val="business">Business</button>
            </div>

            <div class="filter-divider"></div>

            <div class="filter-group" id="filter-role">
                <button class="b-filter-pill active" data-val="anyone">Anyone</button>
                <button class="b-filter-pill" data-val="teachers">Only Teachers</button>
                <button class="b-filter-pill" data-val="learners">Only Learners</button>
            </div>

            <div class="filter-divider"></div>

            <div class="filter-group" id="filter-year">
                <button class="b-filter-pill active" data-val="any">Any Year</button>
                <button class="b-filter-pill" data-val="1st">1st</button>
                <button class="b-filter-pill" data-val="2nd">2nd</button>
                <button class="b-filter-pill" data-val="3rd">3rd</button>
                <button class="b-filter-pill" data-val="4th">4th</button>
            </div>
            
            <button id="clearAllFiltersBtn" class="clear-all-text-btn" style="display:none;">Clear All Filters</button>
        </div>
        
        <div class="b-meta-row">
            <div id="browseResultsCount" class="b-results-text">Showing 12 matches for you</div>
            <div class="b-sort-dropdown">
                <select id="browseSortSelect">
                    <option value="best">Sort by: Best Match</option>
                    <option value="credits">Sort by: Most Credits</option>
                    <option value="rating">Sort by: Highest Rated</option>
                    <option value="newest">Sort by: Newest</option>
                </select>
            </div>
        </div>
    </div>

    <!-- SECTION 2 - Two Column Layout -->
    <div class="b-two-col-layout">
        
        <!-- LEFT: Grid -->
        <div class="b-grid-column">
            <div class="b-match-grid" id="browseMatchGrid">
                ${cardsHTML}
            </div>
            
            <!-- SECTION 3 - Pagination -->
            <div class="b-pagination">
                <button class="btn btn-ghost btn-sm">&larr; Previous</button>
                <button class="b-page-btn active">1</button>
                <button class="b-page-btn">2</button>
                <button class="b-page-btn">3</button>
                <span style="color: var(--text-muted);">...</span>
                <button class="b-page-btn">8</button>
                <button class="btn btn-ghost btn-sm">Next &rarr;</button>
            </div>
        </div>

        <!-- RIGHT: Insights Panel -->
        <div class="b-insights-column">
            <div class="b-insights-panel sticky-panel">
                <h4 style="margin-bottom: 16px;">Your Match Profile</h4>
                
                <div style="margin-bottom: 8px; font-size: 13px; color: var(--text-secondary);">You teach:</div>
                <div class="b-pill-container" style="margin-bottom: 16px;">
                    <div class="b-skill-pill pill-teach">Python</div>
                    <div class="b-skill-pill pill-teach">Guitar</div>
                    <div class="b-skill-pill pill-teach">Excel</div>
                </div>

                <div style="margin-bottom: 8px; font-size: 13px; color: var(--text-secondary);">You want to learn:</div>
                <div class="b-pill-container" style="margin-bottom: 16px;">
                    <div class="b-skill-pill pill-learn">UI/UX Design</div>
                    <div class="b-skill-pill pill-learn">French</div>
                    <div class="b-skill-pill pill-learn">React</div>
                </div>
                
                <a href="profile.html#skills" style="font-size: 13px; color: var(--primary); font-weight: 500;">Edit Skills &rarr;</a>

                <hr style="border:none; border-top: 1px solid var(--border); margin: 24px 0;">

                <h4 style="margin-bottom: 16px;">How Matching Works</h4>
                <div class="b-match-algo">
                    <div class="algo-row"><span class="dot d-green"></span> We find students who teach what you want to learn</div>
                    <div class="algo-row"><span class="dot d-blue"></span> We prioritize students who need what you teach</div>
                    <div class="algo-row"><span class="dot d-purple"></span> Match % uses skill overlap, ratings and activity</div>
                </div>

                <hr style="border:none; border-top: 1px solid var(--border); margin: 24px 0;">

                <h4 style="margin-bottom: 16px;">Top Skills Today</h4>
                <div class="b-chart-rows">
                    <div class="b-chart-row">
                        <div class="c-label">Tech</div>
                        <div class="c-bar-bg"><div class="c-bar-fill" style="width: 34%; background: #3b82f6;"></div></div>
                        <div class="c-val">34%</div>
                    </div>
                    <div class="b-chart-row">
                        <div class="c-label">Design</div>
                        <div class="c-bar-bg"><div class="c-bar-fill" style="width: 21%; background: #8b5cf6;"></div></div>
                        <div class="c-val">21%</div>
                    </div>
                    <div class="b-chart-row">
                        <div class="c-label">Languages</div>
                        <div class="c-bar-bg"><div class="c-bar-fill" style="width: 18%; background: #10b981;"></div></div>
                        <div class="c-val">18%</div>
                    </div>
                    <div class="b-chart-row">
                        <div class="c-label">Music</div>
                        <div class="c-bar-bg"><div class="c-bar-fill" style="width: 15%; background: #f59e0b;"></div></div>
                        <div class="c-val">15%</div>
                    </div>
                    <div class="b-chart-row">
                        <div class="c-label">Academic</div>
                        <div class="c-bar-bg"><div class="c-bar-fill" style="width: 12%; background: #ef4444;"></div></div>
                        <div class="c-val">12%</div>
                    </div>
                </div>

            </div>
        </div>
        
    </div>
</div>
`;

browseHtml = browseHtml.substring(0, containerStart) + newContainer + "\n    " + browseHtml.substring(containerEnd);

// Add the modal at the end 
const modalHtml = `
    <!-- REQUEST SESSION MODAL -->
    <div class="custom-modal-overlay" id="requestModalOverlay">
        <div class="custom-modal" id="requestModal">
            <div class="cm-header">
                <h3>Request a Session</h3>
                <button class="cm-close" id="closeRequestModal">&times;</button>
            </div>
            <div class="cm-body">
                <div class="cm-group">
                    <label>What do you want to learn?</label>
                    <div class="cm-pill-select" id="rm-skills">
                        <!-- injected by js -->
                    </div>
                </div>
                <div class="cm-group">
                    <label>Session Duration</label>
                    <div class="cm-pill-select" id="rm-duration">
                        <button class="rm-pill">30 min</button>
                        <button class="rm-pill active">1 hour</button>
                        <button class="rm-pill">1.5 hours</button>
                        <button class="rm-pill">2 hours</button>
                    </div>
                </div>
                <div class="cm-group">
                    <label>Preferred Date & Time</label>
                    <input type="datetime-local" class="cm-input" style="width: 100%;">
                </div>
                <div class="cm-group">
                    <label>Add a note (optional)</label>
                    <textarea class="cm-input" id="rm-note" placeholder="Introduce yourself and mention what specifically you want to learn..." rows="3" maxlength="200"></textarea>
                    <div class="char-counter" id="rm-charcount">0/200</div>
                </div>
                
                <div class="cm-credit-box">
                    <p class="cb-primary">💎 This will deduct 5 credits from your balance</p>
                    <p class="cb-sec">Your balance after request: 37 credits</p>
                    <p class="cb-sec">Credits are held in escrow until session completes.</p>
                </div>
            </div>
            
            <div class="cm-footer">
                <button class="btn btn-primary" id="btnSendRequest" style="width: 100%; margin-bottom: 8px;">Send Request (−5 credits)</button>
                <button class="btn btn-ghost" id="btnCancelRequest" style="width: 100%;">Cancel</button>
            </div>
        </div>
    </div>
    
    <!-- TOAST INJECTED VIA JS (we can just put template here) -->
    <div class="custom-toast" id="browseToast">
        <div class="ct-content">✓ Session request sent! 5 credits held in escrow.</div>
    </div>
`;

if(browseHtml.indexOf('<script src="js/main.js"></script>') !== -1) {
    browseHtml = browseHtml.replace('<script src="js/main.js"></script>', modalHtml + '\n    <script src="js/main.js"></script>');
}

fs.writeFileSync('browse.html', browseHtml, 'utf8');

// Also fix sidebar active state
let browseFixed = fs.readFileSync('browse.html', 'utf8');
browseFixed = browseFixed.replace(/<a href="dashboard\.html" class="sidebar-link active">([\s\S]*?Dashboard\s*)<\/a>/g, '<a href="dashboard.html" class="sidebar-link">$1</a>');
browseFixed = browseFixed.replace(/<a href="browse\.html" class="sidebar-link">([\s\S]*?Browse Skills\s*)<\/a>/g, '<a href="browse.html" class="sidebar-link active">$1</a>');
fs.writeFileSync('browse.html', browseFixed, 'utf8');

console.log('browse.html generated successfully.');
