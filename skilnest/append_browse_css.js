const fs = require('fs');

const cssContent = `
/* ========================================================= */
/* BROWSE SKILLS PAGE STYLES */
/* ========================================================= */

.browse-page-container {
    max-width: 1200px;
}

/* SECTION 1 - Search & Filter Card */
.b-search-filter-card {
    background: var(--bg-white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    box-shadow: var(--shadow-sm);
    margin-bottom: 24px;
}

.b-search-row {
    margin-bottom: 16px;
}

.search-input-wrapper {
    position: relative;
    width: 100%;
}

.search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
}

.search-input-wrapper input {
    width: 100%;
    padding: 12px 40px 12px 44px; /* Space for icon and clear btn */
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 15px;
    font-family: inherit;
    transition: all 0.2s ease;
}

.search-input-wrapper input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.clear-search-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 20px;
    color: var(--text-muted);
    cursor: pointer;
}

.clear-search-btn:hover {
    color: var(--text-primary);
}

.b-filter-row {
    display: flex;
    align-items: center;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 8px; /* For scrollbar */
    margin-bottom: 16px;
}

.b-filter-row::-webkit-scrollbar {
    height: 4px;
}
.b-filter-row::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 4px;
}

.filter-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    white-space: nowrap;
}

.filter-group {
    display: flex;
    gap: 8px;
}

.filter-divider {
    width: 1px;
    height: 24px;
    background: var(--border);
}

.b-filter-pill {
    padding: 6px 14px;
    border: 1px solid var(--primary);
    background: var(--bg-white);
    color: var(--primary);
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
}

.b-filter-pill:hover {
    background: var(--primary-light);
}

.b-filter-pill.active {
    background: var(--primary);
    color: white;
}

.clear-all-text-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    margin-left: auto;
}
.clear-all-text-btn:hover {
    color: #ef4444; /* red on hover just for visual clear cue */
    text-decoration: underline;
}

.b-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--border);
    padding-top: 16px;
}

.b-results-text {
    font-size: 14px;
    color: var(--text-secondary);
}

.b-sort-dropdown select {
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg-white);
    font-size: 13px;
    font-family: inherit;
    color: var(--text-primary);
    cursor: pointer;
}

/* SECTION 2 - 2 Column Layout */
.b-two-col-layout {
    display: grid;
    grid-template-columns: 7fr 3fr;
    gap: 24px;
    align-items: start;
}

/* LEFT - Match Grid */
.b-match-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}

.b-match-card {
    background: var(--bg-white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    box-shadow: var(--shadow-sm);
    position: relative;
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.b-match-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
}

.b-match-card.hide {
    display: none !important;
}

.b-match-badge {
    position: absolute;
    top: -10px;
    right: 20px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: var(--shadow-sm);
}
.badge-high { background: #dcfce7; color: #15803d; }
.badge-med { background: #dbeafe; color: #1d4ed8; }
.badge-low { background: #f1f5f9; color: #64748b; }

.b-card-top {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    align-items: center;
}

.b-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
    flex-shrink: 0;
}

.b-user-info {
    flex-grow: 1;
}

.b-name {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 600;
    font-size: 16px;
    margin-bottom: 2px;
    color: var(--text-primary);
}

.b-dept {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 4px;
}

.b-rating {
    font-size: 13px;
    color: var(--text-muted);
}
.b-sessions {
    font-size: 12px;
}

.b-card-mid {
    flex-grow: 1;
    margin-bottom: 20px;
}

.b-label-teach, .b-label-learn {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 8px;
}
.b-label-teach { color: #15803d; }
.b-label-learn { color: #1d4ed8; margin-top: 14px; }

.b-pill-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.b-skill-pill {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}
.pill-teach { background: #dcfce7; color: #15803d; }
.pill-learn { background: #dbeafe; color: #1d4ed8; }

.b-indicators {
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.overlap-text {
    font-size: 13px;
    font-weight: 500;
}
.overlap-green { color: #15803d; }
.overlap-blue { color: #1d4ed8; }

.b-card-bottom {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-top: 1px dashed var(--border);
    padding-top: 16px;
}

.b-cost {
    font-size: 13px;
    color: var(--text-muted);
    font-weight: 500;
    text-align: center;
}

.b-card-actions {
    display: flex;
    gap: 8px;
    justify-content: space-between;
}
.b-card-actions button {
    flex: 1;
}

/* RIGHT - Insights Panel */
.sticky-panel {
    position: sticky;
    top: 90px;
    background: var(--bg-white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    box-shadow: var(--shadow-sm);
}

.b-match-algo {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.algo-row {
    font-size: 13px;
    color: var(--text-secondary);
    display: flex;
    align-items: flex-start;
    gap: 8px;
    line-height: 1.4;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 5px;
}
.d-green { background: #10b981; }
.d-blue { background: #3b82f6; }
.d-purple { background: #8b5cf6; }

.b-chart-rows {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.b-chart-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
}

.c-label {
    width: 70px;
    color: var(--text-secondary);
}

.c-bar-bg {
    flex-grow: 1;
    height: 6px;
    background: #f1f5f9;
    border-radius: 3px;
    overflow: hidden;
}

.c-bar-fill {
    height: 100%;
    border-radius: 3px;
}

.c-val {
    width: 30px;
    text-align: right;
    color: var(--text-muted);
    font-weight: 500;
}

/* Pagination */
.b-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 40px;
    margin-bottom: 40px;
}

.b-page-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border);
    background: white;
    color: var(--primary);
    border-radius: var(--radius-sm);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.b-page-btn:hover {
    border-color: var(--primary);
}

.b-page-btn.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
}

/* MEDIA QUERIES */

@media (max-width: 1200px) {
    .b-two-col-layout {
        grid-template-columns: 1fr;
    }
    .b-insights-column {
        display: none; /* Hide insights on mobile/tablet to give cards room */
    }
}

@media (max-width: 900px) {
    .b-match-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 600px) {
    .b-match-grid {
        grid-template-columns: 1fr;
    }
}

/* MODAL & TOAST */
.custom-modal-overlay {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
}

.custom-modal-overlay.active {
    opacity: 1;
    pointer-events: auto;
}

.custom-modal {
    background: var(--bg-white);
    border-radius: var(--radius-xl);
    width: 100%;
    max-width: 480px;
    box-shadow: var(--shadow-lg);
    transform: scale(0.95);
    transition: transform 0.2s ease;
    max-height: 90vh;
    overflow-y: auto;
}

.custom-modal-overlay.active .custom-modal {
    transform: scale(1);
}

.cm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
}

.cm-header h3 {
    margin: 0;
    font-size: 18px;
}

.cm-close {
    background: none;
    border: none;
    font-size: 24px;
    color: var(--text-muted);
    cursor: pointer;
}
.cm-close:hover { color: var(--text-primary); }

.cm-body {
    padding: 24px;
}

.cm-group {
    margin-bottom: 20px;
}

.cm-group label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 8px;
}

.cm-pill-select {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.rm-pill {
    padding: 6px 14px;
    background: var(--bg-white);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    border-radius: 20px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
}

.rm-pill.active {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
}

.cm-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font-family: inherit;
    font-size: 14px;
    resize: none;
}

.cm-input:focus {
    outline: none;
    border-color: var(--primary);
}

.char-counter {
    text-align: right;
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 4px;
}

.cm-credit-box {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: var(--radius-md);
    padding: 16px;
    margin-top: 8px;
}

.cb-primary {
    color: var(--primary-dark);
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 6px;
}

.cb-sec {
    color: var(--primary);
    font-size: 13px;
    opacity: 0.9;
    margin-bottom: 2px;
    line-height: 1.4;
}

.cm-footer {
    padding: 20px 24px;
    border-top: 1px solid var(--border);
    background: #fafafa;
    border-bottom-left-radius: var(--radius-xl);
    border-bottom-right-radius: var(--radius-xl);
}

.custom-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: white;
    border-left: 4px solid var(--success);
    box-shadow: var(--shadow-md);
    padding: 16px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 2000;
    transform: translateX(120%);
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.custom-toast.show {
    transform: translateX(0);
}

.ct-content {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
}
`;

fs.appendFileSync('css/style.css', cssContent);
console.log('CSS appended.');
