import os
import re

directory = r'c:\Users\mithu\Desktop\SkillNest\skilnest'

replacements = [
    # Balances
    (r'💎\s*\b(42|50|72|120|1500)\b', r'💎 10500'),
    
    # Specific sentences/phrases
    (r'\b1500\s+signup\s+credits\b', '4000 signup credits'),
    (r'Earned\s+1500\s+credits', 'Earned 4000 credits'),
    (r'\+1500\s+earned', '+4000 earned'),
    (r'\b500\s+credits\s+held\s+in\s+escrow', '1250 credits held in escrow'),
    (r'earn\s+500\s+credits', 'earn 1250 credits'),
    
    # Spending text
    (r'−5\s+credits\s+spent', '−1250 credits spent'),
    (r'−5\s+credits<', '−1250 credits<'),
    (r'-\s*5\s+credits', '-1250 credits'),
    
    # Earning text
    (r'\+8\s+credits\s+earned', '+2000 credits earned'),
    (r'\+8\s+credits<', '+2000 credits<'),
    
    # Tooltips / Descriptions
    (r'\(5\s+credits/hr\s+as\s+Learner\)', '(1250 credits/hr as Learner)'),
    (r'\(8\s+credits/hr\s+as\s+Teacher\)', '(2000 credits/hr as Teacher)'),
    
    # JS Logic
    (r'Math\.round\(5\s*\*\s*durHours\)', 'Math.round(1250 * durHours)'),
    (r'Math\.round\(8\s*\*\s*durHours\)', 'Math.round(2000 * durHours)')
]

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.html') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            new_content = content
            for pat, rep in replacements:
                new_content = re.sub(pat, rep, new_content)
                
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {file}")

print("Done updating credits.")
