import os
import glob
import re

base_path = r'c:\Users\mithu\Desktop\SkillNest\skilnest'

# 1. Provide Google Fonts Tag
font_tags = """<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet">"""

# 2. Modify style.css
css_path = os.path.join(base_path, 'css', 'style.css')
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Remove @import
css = re.sub(r'@import url\([^\)]+\);?', '', css)

# Check and fix brace balance (the @media at end is open)
opening = css.count('{')
closing = css.count('}')
if opening > closing:
    css += '\n}' * (opening - closing) + '\n'

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

# 3. Modify main.js
js_path = os.path.join(base_path, 'js', 'main.js')
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Wrap if not globally wrapped
if "document.addEventListener('DOMContentLoaded', function()" not in js[:100]:
    js = "document.addEventListener('DOMContentLoaded', function() {\n" + js + "\n});\n"
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js)

# 4. Modify HTML files
html_files = glob.glob(os.path.join(base_path, '*.html'))

for html_file in html_files:
    with open(html_file, 'r', encoding='utf-8') as f:
        html = f.read()

    # Exact paths
    html = re.sub(r'<link[^>]*href=["\'][^"\']*css/style\.css["\'][^>]*>', '<link rel="stylesheet" href="css/style.css">', html)
    html = re.sub(r'<script[^>]*src=["\'][^"\']*js/main\.js["\'][^>]*>[\s\S]*?</script>', '<script src="js/main.js"></script>', html)
    
    # Remove any existing Google Font tags to avoid duplicates
    html = re.sub(r'<link[^>]*fonts\.googleapis[^>]*>', '', html)
    html = re.sub(r'<link[^>]*fonts\.gstatic[^>]*>', '', html)
    
    # Insert Google Fonts exactly after <head>
    html = re.sub(r'<head>', f'<head>\n    {font_tags}', html)

    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html)

print("Fixes applied successfully!")
