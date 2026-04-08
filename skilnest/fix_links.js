const fs = require('fs');
const glob = require('fs').readdirSync;
const path = require('path');

const basePath = `c:\\Users\\mithu\\Desktop\\SkillNest\\skilnest`;
const htmlFiles = glob(basePath).filter(f => f.endsWith('.html')).map(f => path.join(basePath, f));

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Sidebar specifically
    content = content.replace(/<a href="#" class="sidebar-link">([^<]*<svg.*?<\/svg>)?\s*My Sessions<\/a>/gi, '<a href="sessions.html" class="sidebar-link">$1 My Sessions</a>');
    content = content.replace(/<a href="#" class="sidebar-link">([^<]*<svg.*?<\/svg>)?\s*Chat<\/a>/gi, '<a href="chat.html" class="sidebar-link">$1 Chat</a>');
    content = content.replace(/<a href="#" class="sidebar-link">([^<]*<span.*?<\/span>)?\s*Credits<\/a>/gi, '<a href="credits.html" class="sidebar-link">$1 Credits</a>');
    content = content.replace(/<a href="#" class="sidebar-link">([^<]*<svg.*?<\/svg>)?\s*Settings<\/a>/gi, '<a href="profile.html#settings" class="sidebar-link">$1 Settings</a>');
    content = content.replace(/<a href="#" class="sidebar-link">([^<]*<svg.*?<\/svg>)?\s*Dashboard<\/a>/gi, '<a href="dashboard.html" class="sidebar-link">$1 Dashboard</a>');
    content = content.replace(/<a href="#" class="sidebar-link">([^<]*<svg.*?<\/svg>)?\s*Browse Skills<\/a>/gi, '<a href="browse.html" class="sidebar-link">$1 Browse Skills</a>');
    content = content.replace(/<a href="#" class="sidebar-link">([^<]*<svg.*?<\/svg>)?\s*My Profile<\/a>/gi, '<a href="profile.html" class="sidebar-link">$1 My Profile</a>');
    content = content.replace(/<a href="#" class="sidebar-link">([^<]*<svg.*?<\/svg>)?\s*Log Out<\/a>/gi, '<a href="login.html" class="sidebar-link">$1 Log Out</a>');

    // Also match the ones in dashboard/browse that just have <svg> without text on the same line if any
    content = content.replace(/<a href="#" class="sidebar-link">\s*<svg[\s\S]*?<\/svg>\s*Dashboard\s*<\/a>/gi, '<a href="dashboard.html" class="sidebar-link">$&</a>'.replace('$&', ''));

    // Actually, let's just do a blanket regex based on what's inside
    content = content.replace(/<a href="#" class="sidebar-link">([\s\S]*?)<\/a>/g, (match, inner) => {
        if (inner.includes('Dashboard')) return `<a href="dashboard.html" class="sidebar-link">${inner}</a>`;
        if (inner.includes('Browse Skills')) return `<a href="browse.html" class="sidebar-link">${inner}</a>`;
        if (inner.includes('My Sessions')) return `<a href="sessions.html" class="sidebar-link">${inner}</a>`;
        if (inner.includes('Chat')) return `<a href="chat.html" class="sidebar-link">${inner}</a>`;
        if (inner.includes('Credits')) return `<a href="credits.html" class="sidebar-link">${inner}</a>`;
        if (inner.includes('Settings')) return `<a href="profile.html#settings" class="sidebar-link">${inner}</a>`;
        if (inner.includes('My Profile')) return `<a href="profile.html" class="sidebar-link">${inner}</a>`;
        if (inner.includes('Log Out')) return `<a href="login.html" class="sidebar-link">${inner}</a>`;
        return match;
    });

    // View All links that failed
    content = content.replace(/<a href="#">\s*View All[ \n]*&rarr;\s*<\/a>/gi, '<a href="browse.html">View All &rarr;</a>');
    
    // Topbar avatars
    content = content.replace(/<a href="#" class="topbar-avatar">/g, '<a href="profile.html" class="topbar-avatar">');

    // Specific Profile view links
    content = content.replace(/<a href="#"([^>]*>View All Reviews.*)<\/a>/gi, '<a href="profile-view.html#reviews"$1</a>');
    content = content.replace(/<a href="#"([^>]*>View Full History.*)<\/a>/gi, '<a href="profile.html#history"$1</a>');

    // Login/Register
    content = content.replace(/<a href="#">Forgot password\?<\/a>/gi, '<a href="login.html#forgot">Forgot password?</a>');
    content = content.replace(/<a href="#">Terms of Service<\/a>/gi, '<a href="index.html#terms">Terms of Service</a>');
    content = content.replace(/<a href="#">Privacy Policy<\/a>/gi, '<a href="index.html#privacy">Privacy Policy</a>');
    content = content.replace(/<a href="#"([^>]*>Terms of Service<\/a>)/gi, '<a href="index.html#terms"$1');
    content = content.replace(/<a href="#"([^>]*>Privacy Policy<\/a>)/gi, '<a href="index.html#privacy"$1');

    // Register Back & Resend
    content = content.replace(/href="#"([^>]*id="btnBack1")/g, 'href="login.html"$1');
    // For Resend Code, leave as is because it's a JS trigger (maybe href="javascript:void(0)")
    content = content.replace(/<a href="#" id="resendCodeBtn"/g, '<a href="javascript:void(0)" id="resendCodeBtn"');

    // Social Links & Footer
    content = content.replace(/<a href="#" class="social-icon"/g, '<a href="javascript:void(0)" class="social-icon"');
    content = content.replace(/<a href="#">About<\/a>/gi, '<a href="index.html#about">About</a>');
    content = content.replace(/<a href="#">How It Works<\/a>/gi, '<a href="index.html#how-it-works">How It Works</a>');
    content = content.replace(/<a href="#">Blog<\/a>/gi, '<a href="javascript:void(0)">Blog</a>');
    content = content.replace(/<a href="#">Careers<\/a>/gi, '<a href="javascript:void(0)">Careers</a>');
    content = content.replace(/<a href="#">Contact<\/a>/gi, '<a href="javascript:void(0)">Contact</a>');
    content = content.replace(/<a href="#">Cookie Policy<\/a>/gi, '<a href="index.html#cookie">Cookie Policy</a>');
    
    // Browse page filters clear btn
    content = content.replace(/<a href="#" id="clearFiltersBtn"/g, '<a href="javascript:void(0)" id="clearFiltersBtn"');

    // Dashboard "Mark all as read"
    content = content.replace(/<a href="#"([^>]*>Mark all as read<\/a>)/g, '<a href="javascript:void(0)"$1');
    
    // Profile Edit Skills
    content = content.replace(/<a href="#"([^>]*>Edit Skills.*<\/a>)/gi, '<a href="profile.html#skills"$1');
    
    // Profile Add Mobile/Availability
    content = content.replace(/<a href="#"([^>]*>Add mobile number.*<\/a>)/gi, '<a href="profile.html#settings"$1');
    content = content.replace(/<a href="#"([^>]*>Add availability.*<\/a>)/gi, '<a href="profile.html#availability"$1');
    content = content.replace(/<a href="#"([^>]*>Add certifications.*<\/a>)/gi, '<a href="profile.html#certifications"$1');

    fs.writeFileSync(file, content, 'utf8');
});

console.log("Secondary link replacements complete");
