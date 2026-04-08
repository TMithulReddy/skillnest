const fs = require('fs');

const baseHtml = fs.readFileSync('dashboard.html', 'utf8');
const dStart = baseHtml.indexOf('<div class="dashboard-container');
const dEnd = baseHtml.indexOf('</main>');

function generatePageSafe(title, activeLinkHref, headerTitle, headerSub, innerContent, fileName) {
    let html = baseHtml.replace('<title>Dashboard - SkillNest</title>', \`<title>\${title} - SkillNest</title>\`);
    
    // Clear old active nav
    html = html.replace(/class="sidebar-link active"/g, 'class="sidebar-link"');
    
    // Set new active nav 
    html = html.replace(\`href="\${activeLinkHref}" class="sidebar-link"\`, \`href="\${activeLinkHref}" class="sidebar-link active"\`);

    html = html.replace('Good morning 👋', headerTitle);
    html = html.replace('<div style="font-size: 13px; color: var(--text-secondary);" id="currentDate">Date Placeholder</div>', \`<div style="font-size: 13px; color: var(--text-secondary);">\${headerSub}</div>\`);
    
    html = html.substring(0, dStart) + 
           '<div class="dashboard-container">\\n' + innerContent + '\\n</div>\\n' + 
           html.substring(dEnd);
           
    fs.writeFileSync(fileName, html, 'utf8');
}

const oldScript = fs.readFileSync('build_final_pages.js', 'utf8');
const sessionsHtml = oldScript.split('const sessionsHtml = \`')[1].split('\`;')[0];
const chatHtml = oldScript.split('const chatHtml = \`')[1].split('\`;')[0];
const creditsHtml = oldScript.split('const creditsHtml = \`')[1].split('\`;')[0];

generatePageSafe('My Sessions', 'sessions.html', 'My Sessions', 'Organize your upcoming and completed meetings', sessionsHtml, 'sessions.html');
generatePageSafe('Chat', 'chat.html', 'Messages', 'Real-time peer communication', chatHtml, 'chat.html');
generatePageSafe('Credits', 'credits.html', 'Credit Balance', 'Track your ecosystem economy', creditsHtml, 'credits.html');

console.log('Fixed generation completed securely');
