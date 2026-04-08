const fs = require('fs');

const jsAddition = `
    // -------------------------------------------------------------------------
    // PROFILE PAGE & PROFILE-VIEW PAGE LOGIC
    // -------------------------------------------------------------------------
    
    // 1. Tab Switching
    const profileTabs = document.querySelectorAll('.p-tab');
    const profileTabContents = document.querySelectorAll('.p-tab-content');

    if (profileTabs.length > 0) {
        // Init from localStorage if exists
        const savedTab = localStorage.getItem('skillnest_active_tab') || 'tab-overview';
        
        function activateTab(tabId) {
            profileTabs.forEach(t => t.classList.remove('active'));
            profileTabContents.forEach(c => c.classList.remove('active'));
            
            const targetTab = document.querySelector(\`.p-tab[data-target="\${tabId}"]\`);
            const targetContent = document.getElementById(tabId);
            
            if (targetTab) targetTab.classList.add('active');
            if (targetContent) targetContent.classList.add('active');
            
            localStorage.setItem('skillnest_active_tab', tabId);
        }

        profileTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                activateTab(tab.getAttribute('data-target'));
            });
        });
        
        // Initial Activation
        activateTab(savedTab);
    }

    // Give an exposure function roughly for clicking links like "Add Mobile"
    window.triggerSettings = function() {
        const tab = document.querySelector('.p-tab[data-target="tab-settings"]');
        if(tab) tab.click();
    };

    // 2. Settings Toggles
    const customToggles = document.querySelectorAll('.ct-switch');
    if (customToggles.length > 0) {
        customToggles.forEach(toggle => {
            const settingKey = 'skillnest_setting_' + toggle.getAttribute('data-setting');
            const savedState = localStorage.getItem(settingKey);
            
            // Init state
            if (savedState === 'off') {
                toggle.classList.remove('on');
            } else if (savedState === 'on') {
                toggle.classList.add('on');
            } // else fallback to its hardcoded HTML default

            toggle.addEventListener('click', () => {
                const isOn = toggle.classList.toggle('on');
                localStorage.setItem(settingKey, isOn ? 'on' : 'off');
            });
        });
    }

    // 3. Availability Grid (Edit Mode)
    const profileAvailGrid = document.getElementById('profileAvailGrid');
    const saveSchedBtn = document.getElementById('saveSchedBtn');
    
    if (profileAvailGrid) {
        const cells = profileAvailGrid.querySelectorAll('.avail-cell:not(.readonly)');
        
        // Load state from LS
        const savedGrid = localStorage.getItem('skillnest_avail_grid');
        let stateArray = [];
        if (savedGrid) {
            stateArray = JSON.parse(savedGrid);
            cells.forEach((cell, idx) => {
                if(stateArray[idx]) cell.classList.add('active');
                else cell.classList.remove('active');
            });
        }

        cells.forEach((cell, idx) => {
            cell.addEventListener('click', () => {
                cell.classList.toggle('active');
                if (saveSchedBtn) saveSchedBtn.style.display = 'block';
            });
        });

        if (saveSchedBtn) {
            saveSchedBtn.addEventListener('click', () => {
                const newState = Array.from(cells).map(c => c.classList.contains('active'));
                localStorage.setItem('skillnest_avail_grid', JSON.stringify(newState));
                saveSchedBtn.style.display = 'none';
                
                // Show generic toast for success
                if(window.browseToast || document.getElementById('toastContainer')) {
                    const toast = window.browseToast || document.getElementById('toastContainer');
                    const txt = toast.querySelector('.ct-content') || toast.querySelector('.t-content div');
                    if(txt) txt.innerText = '✓ Schedule saved successfully!';
                    if(toast.classList.contains('custom-toast')) toast.classList.add('show');
                    else toast.style.transform = 'translateY(0)';
                    
                    setTimeout(() => {
                        if(toast.classList.contains('custom-toast')) toast.classList.remove('show');
                        else toast.style.transform = 'translateY(150%)';
                    }, 3000);
                }
            });
        }
    }

    // 4. Inline Edit Bio
    const editBioBtn = document.getElementById('editBioBtn');
    const bioDisplay = document.getElementById('bioDisplay');
    const bioEditForm = document.getElementById('bioEditForm');
    const cancelBioEdit = document.getElementById('cancelBioEdit');
    const bioReadMore = document.getElementById('bioReadMore');
    const bioTextContainer = document.getElementById('bioTextContainer');
    
    if (editBioBtn && bioDisplay && bioEditForm) {
        const textarea = bioEditForm.querySelector('textarea');
        const saveBtn = bioEditForm.querySelector('.btn-primary');

        editBioBtn.addEventListener('click', () => {
            bioDisplay.style.display = 'none';
            bioEditForm.style.display = 'block';
            const currentP = bioDisplay.querySelector('p');
            if (currentP) textarea.value = currentP.innerText;
        });

        cancelBioEdit.addEventListener('click', () => {
            bioDisplay.style.display = 'block';
            bioEditForm.style.display = 'none';
        });

        saveBtn.addEventListener('click', () => {
            const currentP = bioDisplay.querySelector('p');
            if (currentP) currentP.innerText = textarea.value;
            if (bioTextContainer) bioTextContainer.innerText = textarea.value; // sync header
            bioDisplay.style.display = 'block';
            bioEditForm.style.display = 'none';
        });
    }

    if (bioReadMore && bioTextContainer) {
        bioReadMore.addEventListener('click', () => {
            bioTextContainer.classList.toggle('expanded');
            bioReadMore.innerText = bioTextContainer.classList.contains('expanded') ? 'Read less' : 'Read more';
        });
    }

    // 5. Password Accordion
    const btnChangePass = document.getElementById('btnChangePass');
    const passForm = document.getElementById('passForm');
    const btnCancelPass = document.getElementById('btnCancelPass');

    if (btnChangePass && passForm) {
        btnChangePass.addEventListener('click', () => {
            passForm.classList.add('open');
            btnChangePass.style.display = 'none';
        });
        btnCancelPass?.addEventListener('click', () => {
            passForm.classList.remove('open');
            btnChangePass.style.display = 'block';
        });
    }

    // 6. Delete Account Validation
    const btnPreDelete = document.getElementById('btnPreDelete');
    const deleteModalOverlay = document.getElementById('deleteModalOverlay');
    const closeDelModal = document.getElementById('closeDelModal');
    const btnCancelDelete = document.getElementById('btnCancelDelete');
    const deleteInput = document.getElementById('deleteInput');
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');

    function closeDelete() {
        if(deleteModalOverlay) {
            deleteModalOverlay.classList.remove('active');
            deleteInput.value = '';
            btnConfirmDelete.disabled = true;
            btnConfirmDelete.style.background = '#cbd5e1';
            btnConfirmDelete.style.borderColor = '#cbd5e1';
        }
    }

    if (btnPreDelete && deleteModalOverlay) {
        btnPreDelete.addEventListener('click', () => {
            deleteModalOverlay.classList.add('active');
        });
        closeDelModal?.addEventListener('click', closeDelete);
        btnCancelDelete?.addEventListener('click', closeDelete);
        
        deleteInput?.addEventListener('input', (e) => {
            if (e.target.value === 'DELETE') {
                btnConfirmDelete.disabled = false;
                btnConfirmDelete.style.background = '#dc2626';
                btnConfirmDelete.style.borderColor = '#dc2626';
                btnConfirmDelete.style.color = 'white';
            } else {
                btnConfirmDelete.disabled = true;
                btnConfirmDelete.style.background = '#cbd5e1';
                btnConfirmDelete.style.borderColor = '#cbd5e1';
            }
        });

        btnConfirmDelete?.addEventListener('click', () => {
            // Mock delete routing
            window.location.href = 'login.html';
        });
    }

    // 7. Profile View Specific - Share Button
    const shareProfileBtn = document.getElementById('shareProfileBtn');
    const pvToast = document.getElementById('pvToast');

    if (shareProfileBtn && pvToast) {
        shareProfileBtn.addEventListener('click', function() {
            navigator.clipboard.writeText(window.location.href).then(() => {
                pvToast.classList.add('show');
                setTimeout(() => { pvToast.classList.remove('show'); }, 3000);
            }).catch(e => {
                console.error("Clipboard API failed: ", e);
            });
        });
    }
`;

const jsPath = 'js/main.js';
let js = fs.readFileSync(jsPath, 'utf8');

const insertPos = js.lastIndexOf('});');
if (insertPos !== -1) {
    js = js.substring(0, insertPos) + jsAddition + '\n' + js.substring(insertPos);
    fs.writeFileSync(jsPath, js, 'utf8');
} else {
    fs.appendFileSync(jsPath, jsAddition, 'utf8');
}

console.log('JS fully deployed locally.');
