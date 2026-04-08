const fs = require('fs');

const missingCss = `
/* ========================================================= */
/* DASHBOARD LAYOUT STYLES (RESTORED) */
/* ========================================================= */

.dashboard-body {
    background-color: var(--bg-light);
    display: flex;
    min-height: 100vh;
}

.sidebar {
    width: 260px;
    background: var(--bg-white);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 100;
}

.sidebar-header {
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.sidebar-user {
    padding: 0 24px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
}

.user-avatar {
    width: 40px;
    height: 40px;
    background: var(--primary);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
}

.user-name {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 2px;
}

.user-college {
    font-size: 12px;
    color: var(--text-secondary);
}

.user-pill-credits {
    margin-left: auto;
    font-size: 12px;
    font-weight: 600;
    color: var(--primary);
    background: #dbeafe;
    padding: 4px 8px;
    border-radius: 12px;
}

.sidebar-nav {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    justify-content: space-between;
    padding: 0 16px 24px;
}

.nav-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.sidebar-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    color: var(--text-secondary);
    border-radius: var(--radius-md);
    font-size: 15px;
    font-weight: 500;
    transition: all 0.2s;
}

.sidebar-link:hover {
    background: var(--bg-light);
    color: var(--primary);
}

.sidebar-link.active {
    background: #eff6ff;
    color: var(--primary);
    font-weight: 600;
}

.sidebar-link.text-danger:hover {
    background: #fee2e2;
    color: #ef4444;
}

.main-content {
    flex-grow: 1;
    margin-left: 260px;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.topbar {
    height: 72px;
    background: var(--bg-white);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 40px;
    position: sticky;
    top: 0;
    z-index: 90;
}

.topbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.topbar-right {
    display: flex;
    align-items: center;
    gap: 24px;
}

.mobile-menu-btn {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-primary);
}

.mobile-close {
    display: none;
    background: none;
    border: none;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    color: var(--text-secondary);
}

.notification-container {
    position: relative;
}

.notification-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    position: relative;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
}

.notification-btn:hover {
    color: var(--primary);
}

.notification-dot {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
    border: 2px solid white;
}

.notification-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    width: 320px;
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    margin-top: 8px;
    display: none;
    flex-direction: column;
    z-index: 100;
}

.notification-dropdown.active {
    display: flex;
}

.notif-item {
    display: flex;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: background 0.2s;
}

.notif-item:hover {
    background: #f8fafc;
}

.notif-item.unread {
    background: #eff6ff;
}

.n-icon {
    font-size: 16px;
}

.n-text {
    font-size: 13px;
    line-height: 1.4;
    color: var(--text-secondary);
}

.n-text strong {
    color: var(--text-primary);
}

.topbar-avatar {
    width: 36px;
    height: 36px;
    background: var(--primary);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    text-decoration: none;
}

.dashboard-container {
    padding: 40px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
}

.sidebar-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 95;
}

@media (max-width: 1024px) {
    .main-content { margin-left: 0; }
    .sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s ease;
    }
    .sidebar.active { transform: translateX(0); }
    .mobile-menu-btn { display: block; }
    .mobile-close { display: block; }
    .sidebar-overlay.active { display: block; }
}

@media (max-width: 768px) {
    .dashboard-container { padding: 20px; }
    .topbar { padding: 0 20px; }
    .tab-grid-60-40, .tab-grid-split { grid-template-columns: 1fr; }
    .ph-left { flex-direction: column; text-align: center; }
    .profile-header-card { flex-direction: column; }
    .ph-right { align-items: center; }
    .ph-actions { justify-content: center; }
}
`;

fs.appendFileSync('css/style.css', missingCss, 'utf8');
console.log('Restored missing dashboard CSS layout rules successfully.');
