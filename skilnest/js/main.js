
document.addEventListener('DOMContentLoaded', () => {
    
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.nav-mobile-menu');
    
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });
    }

    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
                
                if (mobileMenu && mobileMenu.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                }
            }
        });
    });

    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    
    const statsSection = document.querySelector('.stats-bar');
    let hasCounted = false;

    const countUp = (element, target) => {
        let current = 0;
        const duration = 2000; 
        const step = target / (duration / 16); 

        const updateCount = () => {
            current += step;
            if (current < target) {
                element.innerText = Math.ceil(current).toLocaleString();
                requestAnimationFrame(updateCount);
            } else {
                element.innerText = target.toLocaleString();
            }
        };
        updateCount();
    };

    if (statsSection) {
        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !hasCounted) {
                hasCounted = true;
                const statElements = document.querySelectorAll('.stat-number');
                statElements.forEach(el => {
                    const target = parseInt(el.getAttribute('data-target').replace(/,/g, ''));
                    const isFloat = el.getAttribute('data-target').includes('.');
                    if (isFloat) {
                        el.innerText = el.getAttribute('data-target'); 
                    } else {
                        countUp(el, target);
                    }
                });
            }
        }, { threshold: 0.5 });
        statsObserver.observe(statsSection);
    }

    
    const filterBtns = document.querySelectorAll('.filter-btn');
    const skillPills = document.querySelectorAll('.skill-pill');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            
            filterBtns.forEach(b => b.classList.remove('active'));
            
            btn.classList.add('active');

            const category = btn.getAttribute('data-category');

            skillPills.forEach(pill => {
                pill.style.transition = 'all 0.3s ease';
                if (category === 'all' || pill.getAttribute('data-category') === category) {
                    pill.style.display = 'inline-block';
                    setTimeout(() => pill.style.opacity = '1', 10);
                } else {
                    pill.style.opacity = '0';
                    setTimeout(() => pill.style.display = 'none', 300);
                }
            });
        });
    });
});



document.addEventListener('DOMContentLoaded', () => {
    
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const emailInput = document.getElementById('email');
        const pwdInput = document.getElementById('password');
        const loginBtn = document.getElementById('loginBtn');
        const togglePwd = document.getElementById('togglePassword');

        
        if (togglePwd) {
            togglePwd.addEventListener('click', () => {
                const type = pwdInput.getAttribute('type') === 'password' ? 'text' : 'password';
                pwdInput.setAttribute('type', type);
            });
        }

        
        emailInput.addEventListener('blur', () => {
            if (emailInput.value.includes('@') && emailInput.value.includes('.')) {
                emailInput.classList.remove('input-error');
                emailInput.classList.add('input-success');
            } else if (emailInput.value.length > 0) {
                emailInput.classList.add('input-error');
                emailInput.classList.remove('input-success');
            }
        });

        pwdInput.addEventListener('blur', () => {
            if (pwdInput.value.length >= 8) {
                pwdInput.classList.remove('input-error');
                pwdInput.classList.add('input-success');
            } else if (pwdInput.value.length > 0) {
                pwdInput.classList.add('input-error');
                pwdInput.classList.remove('input-success');
            }
        });

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let isValid = true;

            if (!emailInput.value.includes('@') || !emailInput.value.includes('.')) {
                emailInput.classList.add('input-error');
                isValid = false;
            }
            if (pwdInput.value.length < 8) {
                pwdInput.classList.add('input-error');
                isValid = false;
            }

            if (isValid) {
                loginBtn.innerHTML = 'Logging in... <span style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-radius:50%; border-top-color:transparent; animation: spin 1s linear infinite; vertical-align:middle; margin-left: 8px;"></span>';
                
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            }
        });
    }

    
    const regForm = document.getElementById('step1');
    if (regForm) {
        
        let currentStep = 1;
        const totalSteps = 3;
        
        const progressFill = document.getElementById('progressFill');
        const btnNext1 = document.getElementById('btnNext1');
        const btnNext2 = document.getElementById('btnNext2');
        const btnSkip2 = document.getElementById('btnSkip2');
        const btnComplete = document.getElementById('btnComplete');

        function showStep(step) {
            for (let i = 1; i <= totalSteps; i++) {
                const el = document.getElementById(`step${i}`);
                if (el) {
                    el.classList.remove('active');
                    setTimeout(() => el.style.display = 'none', 300);
                }
            }

            progressFill.style.width = ((step - 1) / (totalSteps - 1)) * 100 + '%';

            for (let i = 1; i <= totalSteps; i++) {
                const indicator = document.getElementById(`stepIndicator${i}`);
                if (indicator) {
                    indicator.classList.remove('active', 'completed');
                    if (i < step) indicator.classList.add('completed');
                    if (i === step) indicator.classList.add('active');
                }
            }

            setTimeout(() => {
                const currentEl = document.getElementById(`step${step}`);
                if (currentEl) {
                    currentEl.style.display = 'block';
                    setTimeout(() => currentEl.classList.add('active'), 50);
                }
                currentStep = step;
            }, 300);
        }

        // Step 1 validation
        const regName = document.getElementById('regName');
        const regCollege = document.getElementById('regCollege');
        const regEmail = document.getElementById('regEmail');
        const regPwd = document.getElementById('regPassword');
        const regConfirm = document.getElementById('regConfirmPwd');
        const regTerms = document.getElementById('regTerms');
        const strengthFill = document.getElementById('strengthFill');
        const strengthLabel = document.getElementById('strengthLabel');

        const validateStep1 = () => {
            let isValid = true;
            [regName, regCollege, regEmail, regPwd, regConfirm].forEach(el => el.classList.remove('input-error'));
            if (regName.value.trim() === '') { regName.classList.add('input-error'); isValid = false; }
            if (regCollege.value.trim() === '') { regCollege.classList.add('input-error'); isValid = false; }
            if (!regEmail.value.includes('@') || !regEmail.value.includes('.')) { regEmail.classList.add('input-error'); isValid = false; }
            if (regPwd.value.length < 8) { regPwd.classList.add('input-error'); isValid = false; }
            if (regConfirm.value !== regPwd.value || regConfirm.value === '') { regConfirm.classList.add('input-error'); isValid = false; }
            if (!regTerms.checked) { isValid = false; alert('Please agree to the terms.'); }
            return isValid;
        };

        if (btnNext1) {
            btnNext1.addEventListener('click', (e) => {
                e.preventDefault();
                if (validateStep1()) showStep(2);
            });
        }

        // Password toggles
        ['regTogglePwd1', 'regTogglePwd2'].forEach(id => {
            const toggle = document.getElementById(id);
            if (toggle) {
                toggle.addEventListener('click', () => {
                    const input = toggle.previousElementSibling;
                    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                    input.setAttribute('type', type);
                });
            }
        });

        // Password strength
        if (regPwd) {
            regPwd.addEventListener('input', () => {
                const val = regPwd.value;
                let strength = 0;
                if (val.length >= 8) strength++;
                if (/[0-9]/.test(val) || /[^A-Za-z0-9]/.test(val)) strength++;
                if (val.length === 0) {
                    strengthFill.style.width = '0%';
                    strengthLabel.innerText = '';
                } else if (strength === 0) {
                    strengthFill.style.width = '33%'; strengthFill.style.background = '#ef4444';
                    strengthLabel.innerText = 'Weak'; strengthLabel.style.color = '#ef4444';
                } else if (strength === 1) {
                    strengthFill.style.width = '66%'; strengthFill.style.background = '#f59e0b';
                    strengthLabel.innerText = 'Fair'; strengthLabel.style.color = '#f59e0b';
                } else {
                    strengthFill.style.width = '100%'; strengthFill.style.background = '#10B981';
                    strengthLabel.innerText = 'Strong'; strengthLabel.style.color = '#10B981';
                }
            });
        }

        // Step 2: Profile setup nav
        if (btnNext2) btnNext2.addEventListener('click', (e) => { e.preventDefault(); showStep(3); });
        if (btnSkip2) btnSkip2.addEventListener('click', (e) => { e.preventDefault(); showStep(3); });

        // Photo upload
        const photoUploadZone = document.getElementById('photoUploadZone');
        const photoInput = document.getElementById('photoInput');
        const photoPreview = document.getElementById('photoPreview');
        const photoRemoveBtn = document.getElementById('photoRemoveBtn');
        const regBio = document.getElementById('regBio');
        const bioCounter = document.getElementById('bioCounter');

        if (photoUploadZone) {
            photoUploadZone.addEventListener('click', (e) => {
                if (e.target !== photoRemoveBtn) photoInput.click();
            });
            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        photoPreview.src = e.target.result;
                        photoPreview.style.display = 'block';
                        photoRemoveBtn.style.display = 'flex';
                    };
                    reader.readAsDataURL(file);
                }
            });
            photoRemoveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                photoInput.value = '';
                photoPreview.src = '';
                photoPreview.style.display = 'none';
                photoRemoveBtn.style.display = 'none';
            });
        }

        if (regBio) {
            regBio.addEventListener('input', () => {
                if (regBio.value.length > 160) regBio.value = regBio.value.slice(0, 160);
                bioCounter.innerText = `${regBio.value.length}/160`;
            });
        }

        // ---- Skills Logic (Step 3) ----
        const allSkillsList = ["Python", "JavaScript", "React", "UI/UX Design", "French", "Calculus", "Public Speaking", "SQL", "Machine Learning", "Photoshop", "Guitar", "Spanish", "Arduino", "Video Editing", "Git", "Digital Marketing", "Photography", "C++", "Leadership", "Data Analysis", "Figma", "Cybersecurity"];

        let teachSkills = [];
        let learnSkills = [];
        let pendingTeachSkill = null;

        const setupSkillsInput = (inputId, suggestionsId, containerId, type) => {
            const input = document.getElementById(inputId);
            const suggestions = document.getElementById(suggestionsId);
            const container = document.getElementById(containerId);
            if (!input || !suggestions || !container) return;
            const isTeach = type === 'teach';

            function renderPills() {
                container.innerHTML = '';
                const arr = isTeach ? teachSkills : learnSkills;
                arr.forEach(skill => {
                    const el = document.createElement('div');
                    el.className = `skill-tag ${isTeach ? 'teach-tag' : 'learn-tag'}`;
                    el.innerHTML = `${skill} <span class="skill-tag-remove">&times;</span>`;
                    el.querySelector('span').addEventListener('click', () => {
                        if (isTeach) teachSkills = teachSkills.filter(s => s !== skill);
                        else learnSkills = learnSkills.filter(s => s !== skill);
                        renderPills();
                    });
                    container.appendChild(el);
                });
            }

            function addSkill(skillName) {
                const trimmed = skillName.trim();
                if (!trimmed) return;
                if (isTeach) {
                    pendingTeachSkill = trimmed;
                    const profSkillName = document.getElementById('profSkillName');
                    const teachProficiencyPanel = document.getElementById('teachProficiency');
                    if (profSkillName) profSkillName.innerText = trimmed;
                    if (teachProficiencyPanel) teachProficiencyPanel.style.display = 'block';
                } else {
                    if (!learnSkills.includes(trimmed)) learnSkills.push(trimmed);
                    renderPills();
                }
                input.value = '';
                suggestions.style.display = 'none';
                suggestions.innerHTML = '';
            }

            input.addEventListener('input', () => {
                const val = input.value.trim().toLowerCase();
                suggestions.innerHTML = '';
                if (val.length > 0) {
                    const currentArr = isTeach ? teachSkills : learnSkills;
                    const matches = allSkillsList.filter(s => s.toLowerCase().includes(val) && !currentArr.includes(s));
                    if (matches.length > 0) {
                        matches.forEach(m => {
                            const div = document.createElement('div');
                            div.className = 'skill-suggestion-item';
                            div.innerText = m;
                            div.addEventListener('mousedown', (e) => {
                                e.preventDefault();
                                addSkill(m);
                            });
                            suggestions.appendChild(div);
                        });
                    } else {
                        const div = document.createElement('div');
                        div.className = 'skill-suggestion-item';
                        div.innerText = `+ Add "${input.value}"`;
                        div.addEventListener('mousedown', (e) => {
                            e.preventDefault();
                            addSkill(input.value);
                        });
                        suggestions.appendChild(div);
                    }
                    suggestions.style.display = 'block';
                } else {
                    suggestions.style.display = 'none';
                }
            });

            // Enter key support
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (input.value.trim()) addSkill(input.value);
                }
            });

            input.addEventListener('blur', () => {
                setTimeout(() => { suggestions.style.display = 'none'; }, 150);
            });

            renderPills();
        };

        const teachProficiencyPanel = document.getElementById('teachProficiency');
        const profSkillName = document.getElementById('profSkillName');
        const confirmTeachBtn = document.getElementById('confirmTeachBtn');

        if (confirmTeachBtn) {
            confirmTeachBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (pendingTeachSkill) {
                    const profInput = document.querySelector('input[name="proficiency"]:checked');
                    const prof = profInput ? profInput.value : 'Intermediate';
                    const skillWithProf = `${pendingTeachSkill} (${prof})`;
                    if (!teachSkills.includes(skillWithProf)) teachSkills.push(skillWithProf);
                    pendingTeachSkill = null;
                    if (teachProficiencyPanel) teachProficiencyPanel.style.display = 'none';
                    const tc = document.getElementById('teachContainer');
                    if (tc) {
                        // Re-render teach pills by calling setupSkillsInput's internal renderPills
                        tc.innerHTML = '';
                        teachSkills.forEach(skill => {
                            const el = document.createElement('div');
                            el.className = 'skill-tag teach-tag';
                            el.innerHTML = `${skill} <span class="skill-tag-remove">&times;</span>`;
                            el.querySelector('span').addEventListener('click', () => {
                                teachSkills = teachSkills.filter(s => s !== skill);
                                el.remove();
                            });
                            tc.appendChild(el);
                        });
                    }
                }
            });
        }

        setupSkillsInput('teachSearch', 'teachSuggestions', 'teachContainer', 'teach');
        setupSkillsInput('learnSearch', 'learnSuggestions', 'learnContainer', 'learn');

        if (btnComplete) {
            btnComplete.addEventListener('click', (e) => {
                e.preventDefault();
                const errorText = document.getElementById('skillsError');
                if (teachSkills.length > 0 && learnSkills.length > 0) {
                    if (errorText) errorText.style.display = 'none';
                    btnComplete.innerHTML = 'Completing Setup... <span style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-radius:50%; border-top-color:transparent; animation: spin 1s linear infinite; vertical-align:middle; margin-left: 8px;"></span>';
                    setTimeout(() => { window.location.href = 'onboarding.html'; }, 1500);
                } else {
                    if (errorText) errorText.style.display = 'block';
                }
            });
        }
    }
});

const style = document.createElement('style');
style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(style);



document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.browse-page')) {
        
        
        const modalOverlay = document.getElementById('requestModalOverlay');
        const closeBtn = document.getElementById('closeRequestModal');
        const cancelBtn = document.getElementById('cancelRequestModal');
        const confirmBtn = document.getElementById('confirmRequestBtn');
        const toast = document.getElementById('toastContainer');
        const toastTitle = document.getElementById('toastTitle');

        let activeTeacherName = "";

        const mockUsers = [
            { id: 1, name: "Arjun Mehta", initials: "AM", color: "#fee2e2", textCol: "#dc2626", dept: "CSE 3rd Year", match: 87, rating: 4.8, sessions: 12, credits: 38, teaches: ["Python", "Machine Learning"], learns: ["Guitar"] },
            { id: 2, name: "Priya Sharma", initials: "PS", color: "#e0e7ff", textCol: "#4f46e5", dept: "IT 2nd Year", match: 76, rating: 4.9, sessions: 8, credits: 45, teaches: ["Figma", "UI/UX Design"], learns: ["Python"] },
            { id: 3, name: "Rohit Verma", initials: "RV", color: "#fef3c7", textCol: "#d97706", dept: "CSE 4th Year", match: 91, rating: 4.7, sessions: 22, credits: 12, teaches: ["React", "JavaScript"], learns: ["Spanish"] },
            { id: 4, name: "Ananya Iyer", initials: "AI", color: "#dcfce7", textCol: "#16a34a", dept: "MBA 1st Year", match: 82, rating: 5.0, sessions: 5, credits: 86, teaches: ["Public Speaking", "Marketing"], learns: ["Excel"] },
            { id: 5, name: "Karan Singh", initials: "KS", color: "#f3e8ff", textCol: "#9333ea", dept: "ECE 3rd Year", match: 67, rating: 4.5, sessions: 15, credits: 24, teaches: ["Arduino", "C++"], learns: ["Photoshop"] },
            { id: 6, name: "Sneha Patel", initials: "SP", color: "#e0f2fe", textCol: "#0284c7", dept: "IT 3rd Year", match: 73, rating: 4.6, sessions: 11, credits: 50, teaches: ["Video Editing", "Canva"], learns: ["Python"] },
            { id: 7, name: "Dev Nair", initials: "DN", color: "#ffedd5", textCol: "#ea580c", dept: "CSE 2nd Year", match: 58, rating: 4.2, sessions: 4, credits: 18, teaches: ["Git", "Linux"], learns: ["Music Production"] },
            { id: 8, name: "Meera Joshi", initials: "MJ", color: "#fce7f3", textCol: "#db2777", dept: "Arts 2nd Year", match: 69, rating: 4.9, sessions: 9, credits: 62, teaches: ["French", "Photography"], learns: ["Figma"] },
            { id: 9, name: "Aditya Rao", initials: "AR", color: "#e0e7ff", textCol: "#4f46e5", dept: "CSE 4th Year", match: 88, rating: 4.7, sessions: 19, credits: 40, teaches: ["Data Analysis", "SQL"], learns: ["Guitar"] },
            { id: 10, name: "Kavya Reddy", initials: "KR", color: "#fef3c7", textCol: "#d97706", dept: "IT 1st Year", match: 54, rating: 4.4, sessions: 2, credits: 20, teaches: ["Canva", "Illustrator"], learns: ["React"] },
            { id: 11, name: "Siddharth Kumar", initials: "SK", color: "#fee2e2", textCol: "#dc2626", dept: "MBA 2nd Year", match: 71, rating: 4.8, sessions: 14, credits: 33, teaches: ["Finance", "Leadership"], learns: ["Video Editing"] },
            { id: 12, name: "Riya Desai", initials: "RD", color: "#dcfce7", textCol: "#16a34a", dept: "CSE 3rd Year", match: 79, rating: 4.6, sessions: 7, credits: 55, teaches: ["Flutter", "Dart"], learns: ["Spanish"] }
        ];

        
        const myTeaches = ["Python", "UI/UX Design"];
        const myLearns = ["Guitar", "Spanish"];

        const container = document.getElementById('matchesContainer');
        const matchCountText = document.getElementById('matchCountText');
        const searchInput = document.getElementById('browseSearch');
        const clearSearchBtn = document.getElementById('searchClearBtn');

        function renderCards(data) {
            container.innerHTML = "";
            matchCountText.innerText = `Showing ${data.length} matches for you`;

            data.forEach(user => {
                let badgeClass = user.match >= 80 ? 'bg-high' : (user.match >= 60 ? 'bg-med' : 'bg-low');

                // Determine indicators
                let theyTeachWhatIWant = user.teaches.some(t => myLearns.includes(t));
                let theyWantWhatITeach = user.learns.some(l => myTeaches.includes(l));

                let cardHTML = `
                <div class="b-card">
                    <div class="b-card-score ${badgeClass}">${user.match}% Match</div>
                    <div class="b-card-top">
                        <div class="m-avatar" style="background: ${user.color}; color: ${user.textCol};">${user.initials}</div>
                        <div class="m-info">
                            <h4 style="font-size: 16px; margin-bottom: 2px;">${user.name}</h4>
                            <p style="font-size: 13px; color: var(--text-secondary);">${user.dept} &middot; ${user.rating} ★ <span style="font-size: 11px;">(${user.sessions})</span></p>
                        </div>
                    </div>

                    <div class="b-card-middle">
                        <div class="b-skill-row">
                            <div class="b-skill-label teach">Can Teach You:</div>
                            <div class="b-skills-container">
                                ${user.teaches.map(t => `<div class="skill-tag teach-tag">${t}</div>`).join('')}
                            </div>
                            ${theyTeachWhatIWant ? `<div class="b-match-indicator ind-green">✓ Matches your learning goals</div>` : ''}
                        </div>
                        <div class="b-skill-row">
                            <div class="b-skill-label learn">Wants to Learn:</div>
                            <div class="b-skills-container">
                                ${user.learns.map(l => `<div class="skill-tag learn-tag">${l}</div>`).join('')}
                            </div>
                            ${theyWantWhatITeach ? `<div class="b-match-indicator ind-blue">✓ Needs what you can teach</div>` : ''}
                        </div>
                    </div>

                    <div class="b-card-bottom">
                        <div class="b-credits-val">💎 ${user.credits} credits <span style="font-weight: 400; color: var(--text-secondary); font-size: 12px; margin-left: 4px;">balance</span></div>
                        <div class="b-card-actions">
                            <button class="btn btn-ghost btn-sm" onclick="window.location.href='profile-view.html'">View Profile</button>
                            <button class="btn btn-primary btn-sm open-modal-btn" data-name="${user.name}" data-skills="${user.teaches.join(',')}">Request Session</button>
                        </div>
                    </div>
                </div>`;
                
                container.insertAdjacentHTML('beforeend', cardHTML);
            });

            // Re-bind modal triggers to newly rendered buttons
            document.querySelectorAll('.open-modal-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const name = e.target.getAttribute('data-name');
                    const skills = e.target.getAttribute('data-skills').split(',');
                    
                    activeTeacherName = name;
                    document.getElementById('modalTeacherName').innerText = name;
                    
                    const skillsContainer = document.getElementById('modalTeachSkills');
                    skillsContainer.innerHTML = '';
                    skills.forEach((s, idx) => {
                        skillsContainer.innerHTML += `
                        <label class="radio-pill-label" style="display:inline-block; margin-right: 8px;">
                            <input type="radio" name="reqSkill" value="${s}" ${idx === 0 ? 'checked' : ''}>
                            <span class="radio-pill-text teach-tag" style="padding: 6px 12px; font-weight: 500;">${s}</span>
                        </label>`;
                    });

                    modalOverlay.classList.add('show');
                });
            });
        }

        
        renderCards(mockUsers);

        
        function filterResults() {
            const query = searchInput.value.toLowerCase();
            const activeRole = document.querySelector('.fpill-role.active').getAttribute('data-value');
            
            
            
            
            let filtered = mockUsers.filter(u => {
                const textMatch = u.name.toLowerCase().includes(query) || 
                                  u.dept.toLowerCase().includes(query) || 
                                  u.teaches.some(t => t.toLowerCase().includes(query)) ||
                                  u.learns.some(l => l.toLowerCase().includes(query));
                
                let roleMatch = true;
                if(activeRole === 'teachers' && u.teaches.length === 0) roleMatch = false;
                if(activeRole === 'learners' && u.learns.length === 0) roleMatch = false;

                return textMatch && roleMatch;
            });

            const sortVal = document.getElementById('sortSelect').value;
            if(sortVal === 'best') filtered.sort((a,b) => b.match - a.match);
            if(sortVal === 'credits') filtered.sort((a,b) => b.credits - a.credits);
            if(sortVal === 'rating') filtered.sort((a,b) => b.rating - a.rating);

            renderCards(filtered);
            
            if(query.length > 0) clearSearchBtn.style.display = 'flex';
            else clearSearchBtn.style.display = 'none';

            checkClearFiltersLink();
        }

        searchInput.addEventListener('input', filterResults);
        document.getElementById('sortSelect').addEventListener('change', filterResults);

        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            filterResults();
        });

        // Pill Toggles
        document.querySelectorAll('.fpill-cat').forEach(p => {
            p.addEventListener('click', (e) => {
                document.querySelectorAll('.fpill-cat').forEach(x => x.classList.remove('active'));
                e.target.classList.add('active');
                checkClearFiltersLink();
            });
        });

        document.querySelectorAll('.fpill-role').forEach(p => {
            p.addEventListener('click', (e) => {
                document.querySelectorAll('.fpill-role').forEach(x => x.classList.remove('active'));
                e.target.classList.add('active');
                filterResults();
            });
        });

        const clearLink = document.getElementById('clearFiltersBtn');
        function checkClearFiltersLink() {
            const hasCat = !document.querySelector('.fpill-cat[data-value="all"]').classList.contains('active');
            const hasRole = !document.querySelector('.fpill-role[data-value="all"]').classList.contains('active');
            
            if(hasCat || hasRole) clearLink.style.display = 'inline-block';
            else clearLink.style.display = 'none';
        }

        clearLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.fpill-cat').forEach(x => x.classList.remove('active'));
            document.querySelector('.fpill-cat[data-value="all"]').classList.add('active');
            document.querySelectorAll('.fpill-role').forEach(x => x.classList.remove('active'));
            document.querySelector('.fpill-role[data-value="all"]').classList.add('active');
            searchInput.value= '';
            filterResults();
        });


        // Modal Escrow Calculation (Simulation based on duration)
        const durRadios = document.querySelectorAll('input[name="modalDuration"]');
        durRadios.forEach(r => {
            r.addEventListener('change', (e) => {
                const val = parseInt(e.target.value);
                
                const deduction = (val / 60) * 500;
                document.getElementById('modalDeduction').innerText = `-${deduction} credits`;
                
                const balanceBtn = confirmBtn;
                balanceBtn.innerText = `Send Request (-${deduction} credits)`;
                document.getElementById('modalBalanceAfter').innerText = `${1500 - deduction} credits`;
            });
        });

        
        function closeModal() { modalOverlay.classList.remove('show'); }
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => { if(e.target === modalOverlay) closeReqModal(); });

        confirmBtn.addEventListener('click', () => {
            const val = document.querySelector('input[name="modalDuration"]:checked').value;
            const deduction = (parseInt(val) / 60) * 500;
            
            closeReqModal();
            
            toastTitle.innerText = `Session request sent to ${activeTeacherName}!`;
            document.getElementById('toastDesc').innerText = `${deduction} credits held in escrow.`;
            toast.classList.add('show');
            
            setTimeout(() => { toast.classList.remove('show'); }, 4000);
        });

        const closeToast = toast.querySelector('.t-close');
        if (closeToast) {
            closeToast.addEventListener('click', () => toast.classList.remove('show'));
        }
    }
});



document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.profile-active-page')) {
        
        
        const tabs = document.querySelectorAll('.p-tab');
        const contents = document.querySelectorAll('.p-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-tab');
                
                
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => {
                    c.style.opacity = '0';
                    setTimeout(() => c.classList.remove('active'), 300);
                });

                
                tab.classList.add('active');
                setTimeout(() => {
                    const tarContent = document.getElementById(`tab-${target}`);
                    if (tarContent) {
                        tarContent.classList.add('active');
                        setTimeout(() => tarContent.style.opacity = '1', 50);
                    }
                }, 300);
            });
        });

        
        const photoTrigger = document.getElementById('uploadTrigger');
        const hiddenInput = document.getElementById('hiddenPhotoInput');
        if (photoTrigger && hiddenInput) {
            photoTrigger.addEventListener('click', () => hiddenInput.click());
        }

        
        const editBioBtn = document.getElementById('editBioBtn');
        const saveBioBtn = document.getElementById('saveBioBtn');
        const bioDisplay = document.getElementById('bioDisplay');
        const bioInput = document.getElementById('bioEditInput');

        if (editBioBtn) {
            editBioBtn.addEventListener('click', () => {
                bioDisplay.style.display = 'none';
                bioInput.style.display = 'block';
                saveBioBtn.style.display = 'inline-block';
                bioInput.focus();
            });

            saveBioBtn.addEventListener('click', () => {
                const val = bioInput.value;
                bioDisplay.innerText = val;
                bioInput.style.display = 'none';
                saveBioBtn.style.display = 'none';
                bioDisplay.style.display = '-webkit-box'; 
            });
        }

        
        const gridCells = document.querySelectorAll('.ag-cell:not(.ag-header)'); 
        gridCells.forEach(cell => {
            cell.addEventListener('click', () => {
                cell.classList.toggle('available');
            });
        });

        
        const addCertTrigger = document.getElementById('addCertTrigger');
        const certInlineForm = document.getElementById('certInlineForm');
        const cancelCertBtn = document.getElementById('cancelCertBtn');
        const saveCertBtn = document.getElementById('saveCertBtn');

        if (addCertTrigger) {
            addCertTrigger.addEventListener('click', () => {
                addCertTrigger.style.display = 'none';
                certInlineForm.style.display = 'block';
            });
            cancelCertBtn.addEventListener('click', () => {
                certInlineForm.style.display = 'none';
                addCertTrigger.style.display = 'inline-block';
            });
            saveCertBtn.addEventListener('click', () => {
                
                certInlineForm.style.display = 'none';
                document.getElementById('certEmptyState').innerText = "1 Certification Added (Mock)";
                addCertTrigger.style.display = 'inline-block';
            });
        }

        
        const changePwdBtn = document.getElementById('changePwdBtn');
        const pwdForm = document.getElementById('inlinePwdForm');
        const cancelPwdBtn = document.getElementById('cancelPwdBtn');
        if (changePwdBtn) {
            changePwdBtn.addEventListener('click', () => {
                changePwdBtn.style.display = 'none';
                pwdForm.style.display = 'block';
            });
            cancelPwdBtn.addEventListener('click', () => {
                pwdForm.style.display = 'none';
                changePwdBtn.style.display = 'inline-block';
            });
        }

        
        const toggleIds = ['notifReq', 'notifConf', 'notifMsg', 'notifCred', 'privBrowse', 'privCred', 'privReq'];
        toggleIds.forEach(id => {
            const t = document.getElementById(id);
            if (t) {
                
                const stored = localStorage.getItem(`sn_setting_${id}`);
                if (stored !== null) {
                    t.checked = stored === 'true';
                }
                
                t.addEventListener('change', () => {
                    localStorage.setItem(`sn_setting_${id}`, t.checked);
                });
            }
        });

        
        const initDelBtn = document.getElementById('initialDeleteBtn');
        const delModal = document.getElementById('deleteModalOverlay');
        const closeDel = document.getElementById('closeDelModal');
        const cancelDel = document.getElementById('cancelDelBtn');
        const delConfirmInput = document.getElementById('delConfirmInput');
        const finalDelBtn = document.getElementById('finalDeleteBtn');

        if (initDelBtn) {
            function closeDeleteModal() {
                delModal.classList.remove('show');
                delConfirmInput.value = '';
                finalDelBtn.disabled = true;
            }

            initDelBtn.addEventListener('click', () => delModal.classList.add('show'));
            closeDel.addEventListener('click', closeDeleteModal);
            cancelDel.addEventListener('click', closeDeleteModal);
            
            delConfirmInput.addEventListener('keyup', (e) => {
                if (e.target.value === 'DELETE') {
                    finalDelBtn.disabled = false;
                } else {
                    finalDelBtn.disabled = true;
                }
            });

            finalDelBtn.addEventListener('click', () => {
                alert("Account deleted simulation. Redirecting...");
                window.location.href = 'index.html';
            });
        }
    }
});



document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.profile-view-page')) {
        const shareBtn = document.getElementById('shareProfileBtn');
        const toast = document.getElementById('toastContainer');
        const tClose = toast?.querySelector('.t-close');

        if (shareBtn && toast) {
            shareBtn.addEventListener('click', () => {
                
                navigator.clipboard.writeText(window.location.href).then(() => {
                    toast.classList.add('show');
                    setTimeout(() => toast.classList.remove('show'), 3000);
                });
            });

            if (tClose) {
                tClose.addEventListener('click', () => toast.classList.remove('show'));
            }
        }
    }

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

        function closeReqModal() {
            requestModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        closeRequestModal?.addEventListener('click', closeModal);
        btnCancelRequest?.addEventListener('click', closeModal);
        requestModalOverlay?.addEventListener('click', (e) => {
            if(e.target === requestModalOverlay) closeReqModal();
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
            closeReqModal();
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
            
            const targetTab = document.querySelector(`.p-tab[data-target="${tabId}"]`);
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


    // -------------------------------------------------------------------------
    // SESSIONS, CHAT, CREDITS - CORE LOGIC
    // -------------------------------------------------------------------------

    // 1. Sessions - Toggle Modals
    const btnCreateSessionModal = document.getElementById('btnCreateSessionModal');
    const createSessionModal = document.getElementById('createSessionModal');
    const closeCreateModal = document.getElementById('closeCreateModal');
    
    if (btnCreateSessionModal && createSessionModal) {
        btnCreateSessionModal.addEventListener('click', () => {
            createSessionModal.classList.add('active');
        });
        closeCreateModal?.addEventListener('click', () => {
            createSessionModal.classList.remove('active');
        });
    }

    const btnRateSessions = document.querySelectorAll('.btnRateSession');
    const ratingModal = document.getElementById('ratingModal');
    const closeRatingModal = document.getElementById('closeRatingModal');
    
    if (btnRateSessions.length > 0 && ratingModal) {
        btnRateSessions.forEach(btn => {
            btn.addEventListener('click', () => {
                ratingModal.classList.add('active');
            });
        });
        closeRatingModal?.addEventListener('click', () => {
            ratingModal.classList.remove('active');
        });
    }

    // 2. Sessions - Filter Logic
    const sessionsFilterPills = document.querySelectorAll('#sessionsFilter .rm-pill');
    const sessionsFeed = document.getElementById('sessionsFeed');
    
    if (sessionsFilterPills.length > 0 && sessionsFeed) {
        sessionsFilterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                sessionsFilterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                
                const filter = pill.getAttribute('data-filter');
                const cards = sessionsFeed.querySelectorAll('.sc-card');
                
                cards.forEach(card => {
                    if (filter === 'all' || card.getAttribute('data-status') === filter) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // 3. Sessions - Create Dynamic card submission
    const btnSubmitCreateSession = document.getElementById('btnSubmitCreateSession');
    const csSkill = document.getElementById('csSkill');
    if (btnSubmitCreateSession && sessionsFeed && createSessionModal) {
        btnSubmitCreateSession.addEventListener('click', () => {
            const skillName = csSkill ? csSkill.value : 'A New Skill';
            
            const newCard = document.createElement('div');
            newCard.className = 'sc-card';
            newCard.setAttribute('data-status', 'pending');
            newCard.style.animation = 'fadeIn 0.3s ease';
            
            newCard.innerHTML = `
                <div class="sc-info">
                    <div style="display:flex; gap:12px; align-items:center;">
                        <div class="sc-role">You are learning</div>
                        <div class="sc-badge pending">Pending</div>
                    </div>
                    <div class="sc-title">Learning ${skillName} with Student</div>
                    <div class="sc-meta">📅 Just Added &middot; ⏱️ 1 Hour</div>
                </div>
                <div class="sc-actions">
                    <button class="btn btn-ghost btn-sm" style="color:#ef4444;">Cancel</button>
                    <button class="btn btn-primary btn-sm" disabled style="opacity:0.5;">Awaiting Approval</button>
                </div>
            `;
            
            sessionsFeed.insertBefore(newCard, sessionsFeed.firstChild);
            createSessionModal.classList.remove('active');
            
            // Show generic toast
            if(document.getElementById('toastContainer')) {
                const toast = document.getElementById('toastContainer');
                const txt = toast.querySelector('.ct-content') || toast.querySelector('.t-content div');
                if(txt) txt.innerText = '✓ Session created successfully!';
                toast.style.transform = 'translateY(0)';
                setTimeout(() => { toast.style.transform = 'translateY(150%)'; }, 3000);
            }
        });
    }

    // 4. Rating - Star Selection & Submission
    const starRatingSystem = document.getElementById('starRatingSystem');
    const btnSubmitRating = document.getElementById('btnSubmitRating');
    
    if (starRatingSystem) {
        const stars = starRatingSystem.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const val = parseInt(star.getAttribute('data-val'));
                stars.forEach(s => {
                    if (parseInt(s.getAttribute('data-val')) <= val) s.classList.add('active');
                    else s.classList.remove('active');
                });
            });
        });
    }
    
    if (btnSubmitRating && ratingModal) {
        btnSubmitRating.addEventListener('click', () => {
            ratingModal.classList.remove('active');
            if(document.getElementById('toastContainer')) {
                const toast = document.getElementById('toastContainer');
                const txt = toast.querySelector('.ct-content') || toast.querySelector('.t-content div');
                if(txt) txt.innerText = '✓ Feedback submitted!';
                toast.style.transform = 'translateY(0)';
                setTimeout(() => { toast.style.transform = 'translateY(150%)'; }, 3000);
            }
        });
    }

    // 5. Chat Engine
    const chatInputStr = document.getElementById('chatInputStr');
    const btnSendChat = document.getElementById('btnSendChat');
    const chatHistoryBox = document.getElementById('chatHistoryBox');
    
    function sendChatMessage() {
        if (!chatInputStr || !chatHistoryBox) return;
        const msg = chatInputStr.value.trim();
        if (!msg) return;
        
        // Append outgoing Right bubble
        const now = new Date();
        const timeStr = now.getHours() + ':' + (now.getMinutes()<10?'0':'') + now.getMinutes() + (now.getHours()>=12?' PM':' AM');
        
        const row = document.createElement('div');
        row.className = 'c-bubble-row right';
        row.style.animation = 'fadeIn 0.2s ease';
        row.innerHTML = `
            <div class="chat-bubble right">${msg}</div>
            <div class="c-time">${timeStr} &middot; Sent ✓</div>
        `;
        chatHistoryBox.appendChild(row);
        
        chatInputStr.value = '';
        chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
        
        // Simulate auto-reply after 1.5s
        setTimeout(() => {
            const replyRow = document.createElement('div');
            replyRow.className = 'c-bubble-row left';
            replyRow.style.animation = 'fadeIn 0.2s ease';
            replyRow.innerHTML = `
                <div class="chat-bubble left">Haha got it! That makes sense. See you in the session.</div>
                <div class="c-time">Just now</div>
            `;
            chatHistoryBox.appendChild(replyRow);
            chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
        }, 1500);
    }
    
    if (btnSendChat) btnSendChat.addEventListener('click', sendChatMessage);
    if (chatInputStr) {
        chatInputStr.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }

    // 6. Credits Filters
    const creditFilterSelector = document.querySelectorAll('#creditFilterSelector .rm-pill');
    const transactionsList = document.getElementById('transactionsList');
    
    if (creditFilterSelector.length > 0 && transactionsList) {
        creditFilterSelector.forEach(pill => {
            pill.addEventListener('click', () => {
                creditFilterSelector.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                
                const txt = pill.innerText.toLowerCase();
                const rows = transactionsList.querySelectorAll('.transaction-row');
                
                rows.forEach(row => {
                    if (txt === 'all') {
                        row.style.display = 'flex';
                    } else if (txt === 'earned' && row.classList.contains('type-earn')) {
                        row.style.display = 'flex';
                    } else if (txt === 'spent' && row.classList.contains('type-spend')) {
                        row.style.display = 'flex';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        });
    }


    /* ========================================================= */
    /* SESSIONS PAGE: FILTERING */
    /* ========================================================= */
    const sessionsFilterNav = document.getElementById('sessionsFilterNav');
    const allSessionsList = document.getElementById('allSessionsList');
    if (sessionsFilterNav && allSessionsList) {
        const filterBtns = sessionsFilterNav.querySelectorAll('.rm-pill');
        const cards = allSessionsList.querySelectorAll('.session-list-card');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filterValue = btn.getAttribute('data-filter');
                
                cards.forEach(card => {
                    const type = card.getAttribute('data-type');
                    if (filterValue === 'all' || type === filterValue) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    /* ========================================================= */
    /* SCHEDULE SESSION MODAL LOGIC */
    /* ========================================================= */
    const btnScheduleSession = document.getElementById('btnScheduleSession');
    const scheduleModalOverlay = document.getElementById('scheduleModalOverlay');
    const closeScheduleModal = document.getElementById('closeScheduleModal');
    
    if (btnScheduleSession && scheduleModalOverlay) {
        btnScheduleSession.addEventListener('click', () => {
            scheduleModalOverlay.classList.add('active');
        });
        
        if (closeScheduleModal) {
            closeScheduleModal.addEventListener('click', () => {
                scheduleModalOverlay.classList.remove('active');
            });
        }
    }

    // Step 1 Logic
    const partnerSearchInput = document.getElementById('partnerSearchInput');
    const partnerDropdown = document.getElementById('partnerDropdown');
    const selectedPartnerCard = document.getElementById('selectedPartnerCard');
    const schRoleGroup = document.getElementById('schRoleGroup');
    const schSkillGroup = document.getElementById('schSkillGroup');
    const schRoleSelect = document.getElementById('schRoleSelect');
    const schSkillSelect = document.getElementById('schSkillSelect');
    const schDurationSelect = document.getElementById('schDurationSelect');
    const schDatetimeInput = document.getElementById('schDatetimeInput');
    const btnContinueSchedule = document.getElementById('btnContinueSchedule');
    
    let currentPartner = null;

    if (partnerSearchInput && partnerDropdown) {
        partnerSearchInput.addEventListener('input', (e) => {
            if(e.target.value.length > 0) {
                partnerDropdown.style.display = 'block';
            } else {
                partnerDropdown.style.display = 'none';
            }
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if(!partnerSearchInput.contains(e.target) && !partnerDropdown.contains(e.target)) {
                partnerDropdown.style.display = 'none';
            }
        });

        partnerDropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.partner-dropdown-item');
            if(item) {
                const partnerName = item.getAttribute('data-partner');
                const tSkills = item.getAttribute('data-t');
                const wSkills = item.getAttribute('data-w');
                const av = item.getAttribute('data-av');
                const bg = item.getAttribute('data-bg');
                const col = item.getAttribute('data-col');

                currentPartner = { name: partnerName, teaches: tSkills, wants: wSkills };

                partnerDropdown.style.display = 'none';
                partnerSearchInput.style.display = 'none';
                
                selectedPartnerCard.innerHTML = `
                    <div class="pd-av" style="background:${bg};color:${col};">${av}</div>
                    <div class="pd-info">
                        <div class="pd-name">${partnerName}</div>
                        <div class="pd-skills" style="color:var(--text-secondary);font-size:12px;">Selected Partner</div>
                    </div>
                    <button class="btn-remove-partner" id="btnRemovePartner" title="Remove">&times;</button>
                `;
                selectedPartnerCard.style.display = 'flex';

                // Re-attach listener
                document.getElementById('btnRemovePartner').addEventListener('click', () => {
                    currentPartner = null;
                    selectedPartnerCard.style.display = 'none';
                    partnerSearchInput.value = '';
                    partnerSearchInput.style.display = 'block';
                    partnerSearchInput.focus();
                    
                    // disable lower sections
                    schRoleGroup.style.opacity = '0.5';
                    schRoleGroup.style.pointerEvents = 'none';
                    schSkillGroup.style.opacity = '0.5';
                    schSkillGroup.style.pointerEvents = 'none';
                    checkScheduleValidity();
                });

                // Enable lower sections
                schRoleGroup.style.opacity = '1';
                schRoleGroup.style.pointerEvents = 'auto';
                schSkillGroup.style.opacity = '1';
                schSkillGroup.style.pointerEvents = 'auto';

                updateSkillSelects();
                checkScheduleValidity();
            }
        });
    }

    if(schRoleSelect) {
        schRoleSelect.addEventListener('click', (e) => {
            if(e.target.classList.contains('rm-pill')) {
                schRoleSelect.querySelectorAll('.rm-pill').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                updateSkillSelects();
                checkScheduleValidity();
            }
        });
    }
    if(schSkillSelect) {
        schSkillSelect.addEventListener('click', (e) => {
            if(e.target.classList.contains('rm-pill')) {
                schSkillSelect.querySelectorAll('.rm-pill').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                checkScheduleValidity();
            }
        });
    }
    if(schDurationSelect) {
        schDurationSelect.addEventListener('click', (e) => {
            if(e.target.classList.contains('rm-pill')) {
                schDurationSelect.querySelectorAll('.rm-pill').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                checkScheduleValidity();
            }
        });
    }
    if(schDatetimeInput) {
        schDatetimeInput.addEventListener('change', checkScheduleValidity);
    }
    
    // Character counter for Session Notes
    const schNotesInput = document.getElementById('schNotesInput');
    const schNotesCounter = document.getElementById('schNotesCounter');
    if(schNotesInput && schNotesCounter) {
        schNotesInput.addEventListener('input', () => {
            schNotesCounter.textContent = `${schNotesInput.value.length}/200`;
        });
    }

    function updateSkillSelects() {
        if(!currentPartner) return;
        const activeRoleBtn = schRoleSelect.querySelector('.active');
        if(!activeRoleBtn) return;
        const role = activeRoleBtn.getAttribute('data-val'); // 'learn' or 'teach'
        
        let skillsArray = [];
        if(role === 'learn') {
            // we want to learn what partner teaches
            skillsArray = currentPartner.teaches.split(',').map(s => s.trim());
        } else {
            // we want to teach what partner wants
            skillsArray = currentPartner.wants.split(',').map(s => s.trim());
        }

        schSkillSelect.innerHTML = skillsArray.map((s, i) => 
            `<button class="rm-pill ${i===0?'active':''}">${s}</button>`
        ).join('');
    }

    function checkScheduleValidity() {
        if(!btnContinueSchedule) return;
        let isValid = true;
        if(!currentPartner) isValid = false;
        if(!schRoleSelect.querySelector('.active')) isValid = false;
        if(!schSkillSelect.querySelector('.active')) isValid = false;
        if(!schDurationSelect.querySelector('.active')) isValid = false;
        if(!schDatetimeInput.value) isValid = false;

        btnContinueSchedule.disabled = !isValid;
    }

    // Step 2 Transition
    const schStep1 = document.getElementById('schStep1');
    const schStep2 = document.getElementById('schStep2');
    const btnBackSchEdit = document.getElementById('btnBackSchEdit');
    const btnConfirmSession = document.getElementById('btnConfirmSession');
    
    if(btnContinueSchedule && schStep1 && schStep2) {
        btnContinueSchedule.addEventListener('click', () => {
            schStep1.style.display = 'none';
            schStep2.style.display = 'block';

            // Populate summary
            const activeRole = schRoleSelect.querySelector('.active').getAttribute('data-val');
            const activeSkill = schSkillSelect.querySelector('.active').textContent;
            const activeDur = schDurationSelect.querySelector('.active').textContent;
            let durHours = 1;
            if(activeDur === '30 min') durHours = 0.5;
            if(activeDur === '1.5 hours') durHours = 1.5;
            if(activeDur === '2 hours') durHours = 2;

            document.getElementById('sumSkill').textContent = activeSkill;
            document.getElementById('sumPartner').textContent = currentPartner.name;
            const dt = new Date(schDatetimeInput.value);
            document.getElementById('sumTime').textContent = dt.toLocaleString([], {weekday:'short', month:'short', day:'numeric', hour: '2-digit', minute:'2-digit'});
            document.getElementById('sumDur').textContent = activeDur;

            // Calculate credits
            const schCreditBox = document.getElementById('schCreditBox');
            if(activeRole === 'learn') {
                const cost = Math.round(1250 * durHours);
                schCreditBox.innerHTML = `
                    <div style="font-size:14px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;">Estimated Cost</div>
                    <div class="cs-val cs-spend" style="background:none;border:none;">-${cost} credits</div>
                    <div style="font-size:13px;color:var(--text-muted);">(1250 credits/hr as Learner)</div>
                `;
                schCreditBox.className = "sch-credit-summary cs-spend";
            } else {
                const earn = Math.round(2000 * durHours);
                schCreditBox.innerHTML = `
                    <div style="font-size:14px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;">Estimated Earnings</div>
                    <div class="cs-val cs-earn" style="background:none;border:none;">+${earn} credits</div>
                    <div style="font-size:13px;color:var(--text-muted);">(2000 credits/hr as Teacher)</div>
                `;
                schCreditBox.className = "sch-credit-summary cs-earn";
            }
        });
    }

    if(btnBackSchEdit) {
        btnBackSchEdit.addEventListener('click', () => {
            schStep2.style.display = 'none';
            schStep1.style.display = 'block';
        });
    }

    if(btnConfirmSession && scheduleModalOverlay) {
        btnConfirmSession.addEventListener('click', () => {
            scheduleModalOverlay.classList.remove('active');
            showToast('Session Scheduled Successfully!');
            setTimeout(() => {
                window.location.href = 'session-detail.html';
            }, 1000);
        });
    }


    /* ========================================================= */
    /* RATE SESSION MODAL */
    /* ========================================================= */
    const rateModalOverlay = document.getElementById('rateModalOverlay');
    const closeRateModal = document.getElementById('closeRateModal');
    const sessionBtnSubmitRating = document.getElementById('btnSubmitRating');
    const rateTriggers = document.querySelectorAll('.btnRateTrigger');

    if (rateModalOverlay) {
        rateTriggers.forEach(btn => {
            btn.addEventListener('click', () => {
                rateModalOverlay.classList.add('active');
            });
        });
        
        if (closeRateModal) {
            closeRateModal.addEventListener('click', () => {
                rateModalOverlay.classList.remove('active');
            });
        }

        const stars = rateModalOverlay.querySelectorAll('.r-star');
        stars.forEach(star => {
            star.addEventListener('mouseover', function() {
                const val = this.getAttribute('data-val');
                stars.forEach(s => {
                    if(s.getAttribute('data-val') <= val) s.classList.add('hover');
                    else s.classList.remove('hover');
                });
            });
            star.addEventListener('mouseout', function() {
                stars.forEach(s => s.classList.remove('hover'));
            });
            star.addEventListener('click', function() {
                const val = this.getAttribute('data-val');
                stars.forEach(s => {
                    if(s.getAttribute('data-val') <= val) s.classList.add('active');
                    else s.classList.remove('active');
                });
            });
        });

        // Review counter
        const rateReviewInput = document.getElementById('rateReviewInput');
        const rateCounter = document.getElementById('rateCounter');
        if(rateReviewInput && rateCounter) {
            rateReviewInput.addEventListener('input', () => {
                rateCounter.textContent = `${rateReviewInput.value.length}/300`;
            });
        }

        if(sessionBtnSubmitRating) {
            sessionBtnSubmitRating.addEventListener('click', () => {
                rateModalOverlay.classList.remove('active');
                showToast('Review submitted!');
            });
        }
    }


    /* ========================================================= */
    /* SESSION DETAIL PAGE INTERACTIONS */
    /* ========================================================= */
    
    // Notes Edit
    const btnEditNotes = document.getElementById('btnEditNotes');
    const notesDisplay = document.getElementById('notesDisplay');
    const notesEditArea = document.getElementById('notesEditArea');
    const notesEditInput = document.getElementById('notesEditInput');
    const btnCancelEditNotes = document.getElementById('btnCancelEditNotes');
    const btnSaveNotes = document.getElementById('btnSaveNotes');

    if (btnEditNotes && notesDisplay && notesEditArea && notesEditInput) {
        btnEditNotes.addEventListener('click', () => {
            notesDisplay.style.display = 'none';
            notesEditInput.value = notesDisplay.textContent;
            notesEditArea.style.display = 'block';
            notesEditInput.focus();
        });

        if(btnCancelEditNotes) {
            btnCancelEditNotes.addEventListener('click', () => {
                notesEditArea.style.display = 'none';
                notesDisplay.style.display = 'block';
            });
        }

        if(btnSaveNotes) {
            btnSaveNotes.addEventListener('click', () => {
                const newText = notesEditInput.value.trim();
                notesDisplay.textContent = newText;
                notesEditArea.style.display = 'none';
                notesDisplay.style.display = 'block';
                showToast('Notes saved successfully');
            });
        }
    }

    // Copy Meet Link
    const btnCopyMeetLink = document.getElementById('btnCopyMeetLink');
    if (btnCopyMeetLink) {
        btnCopyMeetLink.addEventListener('click', () => {
            navigator.clipboard.writeText('https://meet.google.com/abc-defg-hij').then(() => {
                showToast('Meet link copied to clipboard');
            }).catch(() => {
                showToast('Failed to copy link');
            });
        });
    }

});
