const fs = require('fs');

const jsAddition = `
    // -------------------------------------------------------------------------
    // BROWSE & MATCH PAGE LOGIC
    // -------------------------------------------------------------------------
    const browseSearchInput = document.getElementById('browseSearchInput');
    const browseClearSearch = document.getElementById('browseClearSearch');
    const filterCatBtns = document.querySelectorAll('#filter-category .b-filter-pill');
    const filterRoleBtns = document.querySelectorAll('#filter-role .b-filter-pill');
    const filterYearBtns = document.querySelectorAll('#filter-year .b-filter-pill');
    const clearAllFiltersBtn = document.getElementById('clearAllFiltersBtn');
    const browseSortSelect = document.getElementById('browseSortSelect');
    const matchCards = document.querySelectorAll('.b-match-card');
    const resultsCount = document.getElementById('browseResultsCount');

    // Modals
    const requestModalOverlay = document.getElementById('requestModalOverlay');
    const closeRequestModal = document.getElementById('closeRequestModal');
    const btnSendRequest = document.getElementById('btnSendRequest');
    const btnCancelRequest = document.getElementById('btnCancelRequest');
    const rmSkillsContainer = document.getElementById('rm-skills');
    const rmDurationBtns = document.querySelectorAll('#rm-duration .rm-pill');
    const rmNote = document.getElementById('rm-note');
    const rmCharcount = document.getElementById('rm-charcount');
    const browseToast = document.getElementById('browseToast');

    if (browseSearchInput) {
        let currentSearch = '';
        let currentCat = 'all';
        let currentRole = 'anyone';
        let currentYear = 'any';

        function showToast(msg) {
            if(!browseToast) return;
            browseToast.querySelector('.ct-content').innerText = msg;
            browseToast.classList.add('show');
            setTimeout(() => {
                browseToast.classList.remove('show');
            }, 4000);
        }

        function filterCards() {
            let visibleCount = 0;
            const searchTerm = currentSearch.toLowerCase();
            
            // Collect active cards for sorting later
            const activeCards = [];

            matchCards.forEach(card => {
                const name = card.getAttribute('data-name');
                const dept = card.getAttribute('data-dept');
                const teachPills = Array.from(card.querySelectorAll('.pill-teach')).map(p => p.innerText.toLowerCase());
                const learnPills = Array.from(card.querySelectorAll('.pill-learn')).map(p => p.innerText.toLowerCase());
                
                // 1. Search term
                const combinedText = [name, dept, ...teachPills, ...learnPills].join(' ');
                let matchSearch = combinedText.includes(searchTerm);

                // 2. Category logic (simplified: if cat='tech', require 'python', 'react', etc or let's use data tags)
                // Actually the prompt says: "Filter by: Category... match against name, skills, department".
                // We'll map categories to keywords roughly for the mock.
                // Tech: python, javascript, react, arduino, c++, linux, git, cybersecurity, sql, flutter, dart
                // Design: ui/ux, figma, canva, photoshop, video editing, branding, motion graphics, illustrator
                // Languages: french, spanish, japanese, german, hindi, mandarin, korean
                // Music: guitar, music theory, music production, singing, drums, piano
                // Academic: calculus, organic chemistry, economics, statistics, physics, essay writing, research methods
                // Business: public speaking, digital marketing, resume writing, entrepreneurship, financial planning, leadership
                let matchCat = false;
                if (currentCat === 'all') matchCat = true;
                else {
                    const techMap = ['python', 'javascript', 'react', 'arduino', 'c++', 'linux', 'git', 'cybersecurity', 'sql', 'flutter', 'dart', 'machine learning', 'data analysis'];
                    const designMap = ['ui/ux', 'ui/ux design', 'figma', 'canva', 'photoshop', 'video editing', 'branding', 'motion graphics', 'illustrator', 'photography', '3d modelling'];
                    const langMap = ['french', 'spanish', 'japanese', 'german', 'hindi', 'mandarin', 'korean'];
                    const musicMap = ['guitar', 'music theory', 'music production', 'singing', 'drums', 'piano'];
                    const acadMap = ['calculus', 'organic chemistry', 'economics', 'statistics', 'physics', 'essay writing', 'research methods'];
                    const busMap = ['public speaking', 'digital marketing', 'resume writing', 'entrepreneurship', 'financial planning', 'leadership'];

                    let targetMap = [];
                    if(currentCat === 'tech') targetMap = techMap;
                    else if(currentCat === 'design') targetMap = designMap;
                    else if(currentCat === 'languages') targetMap = langMap;
                    else if(currentCat === 'music') targetMap = musicMap;
                    else if(currentCat === 'academic') targetMap = acadMap;
                    else if(currentCat === 'business') targetMap = busMap;

                    const allCardSkills = [...teachPills, ...learnPills];
                    matchCat = allCardSkills.some(skill => targetMap.includes(skill));
                }

                // 3. Role
                let matchRole = true; // In our mock, everyone teaches and learns this is simple
                if (currentRole === 'teachers' && teachPills.length === 0) matchRole = false;
                if (currentRole === 'learners' && learnPills.length === 0) matchRole = false;

                // 4. Year
                let matchYear = true;
                if (currentYear !== 'any' && !dept.includes(currentYear)) matchYear = false;

                if (matchSearch && matchCat && matchRole && matchYear) {
                    card.classList.remove('hide');
                    visibleCount++;
                    activeCards.push(card);
                } else {
                    card.classList.add('hide');
                }
            });

            // Handle Sorting
            const sortVal = browseSortSelect.value;
            activeCards.sort((a,b) => {
                if (sortVal === 'best') return parseInt(b.getAttribute('data-match')) - parseInt(a.getAttribute('data-match'));
                if (sortVal === 'credits') return parseInt(b.getAttribute('data-credits')) - parseInt(a.getAttribute('data-credits'));
                if (sortVal === 'rating') return parseFloat(b.getAttribute('data-rating')) - parseFloat(a.getAttribute('data-rating'));
                return 0; // newest defaults to DOM order
            });

            const grid = document.getElementById('browseMatchGrid');
            if(grid) {
                activeCards.forEach(card => grid.appendChild(card));
            }

            resultsCount.innerText = "Showing " + visibleCount + " matches for you";
            
            // Toggle Clear Button
            if (currentSearch || currentCat !== 'all' || currentRole !== 'anyone' || currentYear !== 'any') {
                clearAllFiltersBtn.style.display = 'block';
            } else {
                clearAllFiltersBtn.style.display = 'none';
            }
        }

        // Event Listeners
        browseSearchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            browseClearSearch.style.display = currentSearch ? 'block' : 'none';
            filterCards();
        });

        browseClearSearch.addEventListener('click', () => {
            browseSearchInput.value = '';
            currentSearch = '';
            browseClearSearch.style.display = 'none';
            filterCards();
        });

        function handlePillGroup(btns, callback) {
            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    btns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    callback(btn.getAttribute('data-val'));
                });
            });
        }

        handlePillGroup(filterCatBtns, val => { currentCat = val; filterCards(); });
        handlePillGroup(filterRoleBtns, val => { currentRole = val; filterCards(); });
        handlePillGroup(filterYearBtns, val => { currentYear = val; filterCards(); });

        browseSortSelect.addEventListener('change', filterCards);

        clearAllFiltersBtn.addEventListener('click', () => {
            browseSearchInput.value = ''; currentSearch = '';
            browseClearSearch.style.display = 'none';
            
            filterCatBtns.forEach(b => b.classList.remove('active')); filterCatBtns[0].classList.add('active'); currentCat = 'all';
            filterRoleBtns.forEach(b => b.classList.remove('active')); filterRoleBtns[0].classList.add('active'); currentRole = 'anyone';
            filterYearBtns.forEach(b => b.classList.remove('active')); filterYearBtns[0].classList.add('active'); currentYear = 'any';
            
            browseSortSelect.value = 'best';
            filterCards();
        });

        // Request Session Logic
        const reqBtns = document.querySelectorAll('.btn-request-session');
        reqBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const skills = btn.getAttribute('data-skills').split(',');
                rmSkillsContainer.innerHTML = '';
                skills.forEach((s, idx) => {
                    const p = document.createElement('button');
                    p.className = 'rm-pill' + (idx === 0 ? ' active' : '');
                    p.innerText = s;
                    p.addEventListener('click', () => {
                        rmSkillsContainer.querySelectorAll('.rm-pill').forEach(b=>b.classList.remove('active'));
                        p.classList.add('active');
                    });
                    rmSkillsContainer.appendChild(p);
                });

                rmNote.value = '';
                rmCharcount.innerText = '0/200';
                
                requestModalOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        function closeModal() {
            requestModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        closeRequestModal?.addEventListener('click', closeModal);
        btnCancelRequest?.addEventListener('click', closeModal);
        requestModalOverlay?.addEventListener('click', (e) => {
            if(e.target === requestModalOverlay) closeModal();
        });

        rmDurationBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                rmDurationBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        rmNote?.addEventListener('input', (e) => {
            rmCharcount.innerText = e.target.value.length + '/200';
        });

        btnSendRequest?.addEventListener('click', () => {
            closeModal();
            showToast('✓ Session request sent! 5 credits held in escrow.');
        });

        // Pagination Dummy UX
        const pageBtns = document.querySelectorAll('.b-page-btn');
        pageBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                pageBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Could call filterCards() here but data is static
                window.scrollTo({top: 0, behavior: 'smooth'});
            });
        });
        
        // Initial setup
        filterCards();
    }
`;

// Insert before the last });
const jsPath = 'js/main.js';
let js = fs.readFileSync(jsPath, 'utf8');

const insertPos = js.lastIndexOf('});');
if (insertPos !== -1) {
    js = js.substring(0, insertPos) + jsAddition + '\n' + js.substring(insertPos);
    fs.writeFileSync(jsPath, js, 'utf8');
    console.log('JS fully appended.');
} else {
    // If not wrapped, just append 
    fs.appendFileSync(jsPath, jsAddition, 'utf8');
    console.log('JS fully appended safely.');
}
