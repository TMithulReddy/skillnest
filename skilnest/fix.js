const fs = require('fs');
const glob = require('fs').readdirSync;
const path = require('path');

const basePath = `c:\\Users\\mithu\\Desktop\\SkillNest\\skilnest`;

// 1. Provide Google Fonts Tag
const fontTags = `<link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet">`;

// 2. Modify style.css
const cssPath = path.join(basePath, 'css', 'style.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Remove @import
css = css.replace(/@import url\([^\)]+\);?/g, '');

// Check and fix brace balance (the @media at end is open)
const opening = (css.match(/\{/g) || []).length;
const closing = (css.match(/\}/g) || []).length;
if (opening > closing) {
    css += '\n}' + '\n}'.repeat(opening - closing - 1) + '\n';
}

fs.writeFileSync(cssPath, css, 'utf8');

// 3. Modify main.js
const jsPath = path.join(basePath, 'js', 'main.js');
let js = fs.readFileSync(jsPath, 'utf8');

// Wrap if not globally wrapped
if (!js.slice(0, 100).includes("document.addEventListener('DOMContentLoaded', function() {")) {
    js = "document.addEventListener('DOMContentLoaded', function() {\n" + js + "\n});\n";
    fs.writeFileSync(jsPath, js, 'utf8');
}

// 4. Modify HTML files
const files = fs.readdirSync(basePath);
const htmlFiles = files.filter(f => f.endsWith('.html')).map(f => path.join(basePath, f));

for (const htmlFile of htmlFiles) {
    let html = fs.readFileSync(htmlFile, 'utf8');

    // Exact paths
    html = html.replace(/<link[^>]*href=["'][^"']*css\/style\.css["'][^>]*>/g, '<link rel="stylesheet" href="css/style.css">');
    html = html.replace(/<script[^>]*src=["'][^"']*js\/main\.js["'][^>]*>[\s\S]*?<\/script>/g, '<script src="js/main.js"></script>');
    
    // Remove any existing Google Font tags to avoid duplicates
    html = html.replace(/<link[^>]*fonts\.googleapis[^>]*>/g, '');
    html = html.replace(/<link[^>]*fonts\.gstatic[^>]*>/g, '');
    
    // Insert Google Fonts exactly after <head>
    html = html.replace(/<head>/i, `<head>\n    ${fontTags}`);

    fs.writeFileSync(htmlFile, html, 'utf8');
}

console.log("Fixes applied successfully!");
