const fs = require('fs');

const htmlFiles = [
    'index.html', 'login.html', 'register.html', 'onboarding.html', 
    'dashboard.html', 'browse.html'
];

let report = "HEALTH CHECK REPORT:\n====================\n";

// 1. Missing Sidebars
htmlFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf8');
    const hasSidebar = content.includes('class="sidebar"');
    report += `${file} - Has Sidebar: ${hasSidebar}\n`;
    
    // Quick broken link check (e.g. href="missing.html")
    const links = [...content.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
    const broken = links.filter(l => l.endsWith('.html') && !fs.existsSync(l) && !['profile.html', 'profile-view.html', 'sessions.html', 'chat.html', 'credits.html', 'chat-conversation.html'].includes(l));
    if (broken.length > 0) report += `  -> Broken links: ${broken.join(', ')}\n`;
});

// 2. Duplicate JS
if (fs.existsSync('js/main.js')) {
    const js = fs.readFileSync('js/main.js', 'utf8');
    const funcRegex = /function\s+([a-zA-Z0-9_]+)\s*\(/g;
    const funcs = new Set();
    const dupes = new Set();
    let match;
    while ((match = funcRegex.exec(js)) !== null) {
        if (funcs.has(match[1])) dupes.add(match[1]);
        funcs.add(match[1]);
    }
    report += `\nJS Duplicate Functions: ${Array.from(dupes).join(', ')}\n`;
}

// 3. Duplicate/Empty CSS
if (fs.existsSync('css/style.css')) {
    const css = fs.readFileSync('css/style.css', 'utf8');
    const classRegex = /\.([a-zA-Z0-9_-]+)\s*\{/g;
    const classes = new Set();
    const dupesCss = new Set();
    let matchCss;
    while ((matchCss = classRegex.exec(css)) !== null) {
        if (classes.has(matchCss[1])) dupesCss.add(matchCss[1]);
        classes.add(matchCss[1]);
    }
    report += `\nCSS Duplicate Classes: ${Array.from(dupesCss).length}\n`;
}

fs.writeFileSync('hc_report.txt', report);
console.log('Health check report written to hc_report.txt');
