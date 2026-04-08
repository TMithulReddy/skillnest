import { supabaseClient, requireAuth, getCurrentProfile, signOut, initOnlineTracking, getTotalUnreadCount } from './supabase.js';
import { showToast } from './utils.js';

let currentUser = null;
let currentProfile = null;
let profileId = null;
const isMyProfile = window.location.pathname.includes('my-profile.html');

// State for search dropdowns
let selectedTeachSkill = null;
let selectedLearnSkill = null;
let searchTimeout;

const CATEGORY_BADGE_MAP = {
  tech: "badge-tech",
  design: "badge-design",
  music: "badge-music",
  languages: "badge-languages",
  academic: "badge-academic",
  business: "badge-business",
};

function categoryBadgeClass(category) {
  const key = (category || "").toLowerCase();
  return CATEGORY_BADGE_MAP[key] || "badge-other";
}

function getInitials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((n) => n[0].toUpperCase()).join("");
}

function renderAvatar(fullName, avatarUrl, sizeClass = "avatar-md") {
  if (avatarUrl) {
    return `<img src="${avatarUrl}" alt="${fullName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" loading="lazy">`;
  }
  return getInitials(fullName);
}

// ────────────────────────────────────────────
// Init
// ────────────────────────────────────────────

async function init() {
  currentUser = await requireAuth();
  if (!currentUser) return;
  initOnlineTracking();

  if (isMyProfile) {
    profileId = currentUser.id;
    currentProfile = await getCurrentProfile();
    initNavbar(currentProfile);
    await loadMyProfile();
    bindMyProfileEvents();
  } else {
    // Public profile
    const params = new URLSearchParams(window.location.search);
    profileId = params.get('id');
    
    if (!profileId) {
      window.location.href = 'browse.html';
      return;
    }
    
    if (profileId === currentUser.id) {
      window.location.href = 'my-profile.html';
      return;
    }

    currentProfile = await getCurrentProfile(); // Needed for navbar
    initNavbar(currentProfile);
    await loadPublicProfile();
  }

  document.getElementById('page-content').style.visibility = 'visible';
  document.getElementById('page-loader')?.classList.add('hidden');
}

function initNavbar(profile) {
  const navAvatarEl = document.getElementById("nav-avatar");
  if (navAvatarEl) {
    navAvatarEl.innerHTML = renderAvatar(profile.full_name, profile.avatar_url, "avatar-sm");
  }

  updateNavCreditDisplay(profile.credit_balance ?? 0);

  const avatarBtn = document.getElementById("nav-avatar-btn");
  const dropdown = document.getElementById("nav-dropdown");
  if (avatarBtn && dropdown) {
    // Basic dropdown link setup
    dropdown.innerHTML = `
      <a href="my-profile.html">My Profile</a>
      <a href="settings.html">Settings</a>
      <div class="nav-dropdown-divider"></div>
      <button class="danger" id="nav-signout-btn">Sign Out</button>
    `;
    dropdown.style.display = '';

    avatarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("open");
    });
    document.addEventListener("click", () => dropdown.classList.remove("open"));

    document.getElementById("nav-signout-btn").addEventListener("click", async () => {
      await signOut();
    });
  }
}

function updateNavCreditDisplay(balance) {
  const navBalance = document.getElementById('nav-credit-link')?.querySelector('.js-credit-balance');
  if (navBalance) navBalance.textContent = Number(balance).toLocaleString();
}

// ────────────────────────────────────────────
// Public Profile Layout
// ────────────────────────────────────────────

async function loadPublicProfile() {
  // 1. Fetch Profile
  const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', profileId).single();
  if (!profile) {
    showToast('Profile not found', 'error');
    setTimeout(() => window.location.href = 'browse.html', 1500);
    return;
  }

  // Header info
  document.getElementById('profile-avatar').innerHTML = renderAvatar(profile.full_name, profile.avatar_url, "avatar-lg");
  document.getElementById('profile-name-text').textContent = profile.full_name;
  if (profile.is_verified) document.getElementById('profile-verified').style.display = 'inline-flex';
  if (profile.is_online) document.getElementById('profile-online-dot').style.display = 'block';

  let collegeStr = profile.college || 'College not specified';
  if (profile.department) collegeStr += ` • ${profile.department}`;
  if (profile.year_of_study) collegeStr += ` • Year ${profile.year_of_study}`;
  document.getElementById('profile-college').textContent = collegeStr;

  document.getElementById('profile-bio').textContent = profile.bio || 'No bio provided.';
  
  const ratingText = Number(profile.avg_rating ?? 0).toFixed(1);
  const ratingCount = profile.total_ratings || 0;
  document.getElementById('profile-rating-display').textContent = `★ ${ratingText} (${ratingCount} rating${ratingCount !== 1 ? 's' : ''})`;
  document.getElementById('profile-sessions-display').textContent = `${profile.total_sessions || 0} sessions`;

  document.getElementById('btn-send-message').href = `messages.html?user=${profileId}`;

  // Fetch teaching skills
  const { data: teachSkills } = await supabaseClient.from('user_skills_teach').select('*, skill:skills(name, category)').eq('user_id', profileId);
  // Fetch endorsements
  const { data: endorsements } = await supabaseClient.from('endorsements').select('skill_id').eq('endorsee_id', profileId);
  const { data: myEndorsements } = await supabaseClient.from('endorsements').select('skill_id').eq('endorser_id', currentUser.id).eq('endorsee_id', profileId);
  
  // Render teaching skills
  document.getElementById('teach-skeleton').style.display = 'none';
  if (teachSkills && teachSkills.length > 0) {
    const list = document.getElementById('teach-skills-container');
    list.style.display = 'grid';
    
    // Set up request modal select if needed
    const modalSelect = document.getElementById('modal-skill-select');
    if (modalSelect) modalSelect.innerHTML = '';
    
    teachSkills.forEach(ts => {
      const eCount = endorsements?.filter(e => e.skill_id === ts.skill_id).length || 0;
      const iEndorsed = myEndorsements?.some(e => e.skill_id === ts.skill_id);
      
      const endorseBtnHTML = iEndorsed ? 
        `<button class="btn btn-secondary btn-sm endorse-btn" disabled>✓ Endorsed</button>` :
        `<button class="btn btn-secondary btn-sm endorse-btn" onclick="window.endorseSkill('${profileId}', '${ts.skill_id}')">Endorse Skill</button>`;

      list.innerHTML += `
        <div class="skill-item">
          <div class="skill-item-header">
            <div>
              <div class="skill-item-title">${ts.skill?.name}</div>
              <span class="badge ${categoryBadgeClass(ts.skill?.category)}">${ts.skill?.category}</span>
              ${ts.proficiency ? `<span class="badge badge-other">${ts.proficiency}</span>` : ''}
            </div>
            <div style="text-align:right;">
              <div style="font-weight:600;font-size:0.9rem;">★ ${Number(ts.avg_rating || 0).toFixed(1)}</div>
              <div style="font-size:0.8rem;color:var(--color-text-hint);">${ts.sessions_count || 0} taught</div>
            </div>
          </div>
          <div style="color:var(--color-warning);font-size:0.85rem;font-weight:600;margin-top:4px;">✦ ${eCount} endorsements</div>
          ${endorseBtnHTML}
        </div>
      `;
      
      if (modalSelect) {
        modalSelect.innerHTML += `<option value="${ts.skill_id}">${ts.skill?.name}</option>`;
      }
    });

    if (document.getElementById('btn-request-session')) {
      document.getElementById('btn-request-session').addEventListener('click', () => {
        window.openRequestModal(profile);
      });
    }

  } else {
    document.getElementById('teach-empty').style.display = 'block';
    if (document.getElementById('btn-request-session')) {
      document.getElementById('btn-request-session').disabled = true;
    }
  }

  // Fetch learning skills
  const { data: learnSkills } = await supabaseClient.from('user_skills_learn').select('*, skill:skills(name, category)').eq('user_id', profileId);
  document.getElementById('learn-skeleton').style.display = 'none';
  if (learnSkills && learnSkills.length > 0) {
    const list = document.getElementById('learn-skills-container');
    list.style.display = 'flex';
    learnSkills.forEach(ls => {
      let activeBadge = ls.is_active ? `<span class="badge" style="background:var(--color-success);color:white;margin-left:4px;">Looking</span>` : '';
      list.innerHTML += `<div style="padding:6px 12px; border:1px solid var(--color-border); border-radius:30px; font-size:0.9rem;">
        <span class="color-dot" style="background-color:var(--color-text-primary);margin-right:6px;"></span>
        ${ls.skill?.name} ${activeBadge}
      </div>`;
    });
  } else {
    document.getElementById('learn-empty').style.display = 'block';
  }

  // Availability
  const { data: avail } = await supabaseClient.from('availability').select('*').eq('user_id', profileId);
  renderAvailabilityGrid(avail || [], false);

  // Reviews
  const { data: ratings } = await supabaseClient
    .from('ratings')
    .select('*, rater:profiles!ratings_rater_id_fkey(full_name, avatar_url)')
    .eq('ratee_id', profileId)
    .order('created_at', { ascending: false })
    .limit(5);
    
  document.getElementById('reviews-skeleton').style.display = 'none';
  if (ratings && ratings.length > 0) {
    const list = document.getElementById('reviews-container');
    list.style.display = 'flex';
    ratings.forEach(r => {
      const stars = Math.round(r.rating || 0);
      const starHTML = Array.from({ length: 5 }, (_, i) => `<span style="color:${i < stars ? "var(--color-warning)" : "var(--color-border)"}">★</span>`).join("");
      
      list.innerHTML += `
        <div class="review-item">
          <div class="review-header">
            <div style="width:32px;height:32px;" class="avatar avatar-sm">${renderAvatar(r.rater?.full_name, r.rater?.avatar_url)}</div>
            <div class="review-meta">
              <span class="review-name">${r.rater?.full_name || 'Anonymous'}</span>
              <span class="review-time">${new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            <div style="margin-left:auto;font-size:0.9rem;">${starHTML}</div>
          </div>
          <div class="review-text">${r.review_text || ''}</div>
        </div>
      `;
    });
  } else {
    document.getElementById('reviews-empty').style.display = 'block';
  }

  // Setup Modal bindings
  if (document.getElementById('modal-close')) {
    document.getElementById('modal-close').addEventListener('click', closeRequestModal);
  }
  if (document.getElementById('modal-duration')) {
    document.getElementById('modal-duration').addEventListener('change', updateModalCost);
  }
  if (document.getElementById('session-request-form')) {
    document.getElementById('session-request-form').addEventListener('submit', (e) => handleSessionRequest(e, profileId));
  }
}

// Global action for Endorse
window.endorseSkill = async function(endorseeId, skillId) {
  const { error } = await supabaseClient.from('endorsements').insert({
    endorser_id: currentUser.id,
    endorsee_id: endorseeId,
    skill_id: skillId
  });
  
  if (error) {
    showToast('Already endorsed or error occurred', 'error');
    console.error(error);
    return;
  }
  
  showToast('Endorsed! You earned 250 ✦ credits', 'success');
  // Simple reload for now
  setTimeout(() => window.location.reload(), 1000);
}


// ────────────────────────────────────────────
// My Profile Editor Logic
// ────────────────────────────────────────────

async function loadMyProfile() {
  // Populate form
  document.getElementById('profile-avatar').innerHTML = renderAvatar(currentProfile.full_name, currentProfile.avatar_url, "avatar-lg");
  document.getElementById('profile-name-text').textContent = currentProfile.full_name;
  
  document.getElementById('edit-fullname').value = currentProfile.full_name || '';
  document.getElementById('edit-mobile').value = currentProfile.mobile || '';
  document.getElementById('edit-bio').value = currentProfile.bio || '';
  document.getElementById('edit-college').value = currentProfile.college || '';
  document.getElementById('edit-department').value = currentProfile.department || '';
  document.getElementById('edit-year').value = currentProfile.year_of_study || '';
  
  updateBioCounter();

  // Load Teach Skills
  await refreshTeachSkills();
  // Load Learn Skills
  await refreshLearnSkills();
  
  // Availability
  const { data: avail } = await supabaseClient.from('availability').select('*').eq('user_id', profileId);
  renderAvailabilityGrid(avail || [], true);

  updateCompletionWidget();
}

function bindMyProfileEvents() {
  document.getElementById('edit-bio').addEventListener('input', updateBioCounter);
  
  document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-profile');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    
    const updates = {
      full_name: document.getElementById('edit-fullname').value.trim(),
      mobile: document.getElementById('edit-mobile').value.trim(),
      bio: document.getElementById('edit-bio').value.trim(),
      college: document.getElementById('edit-college').value.trim(),
      department: document.getElementById('edit-department').value.trim(),
      year_of_study: document.getElementById('edit-year').value.trim(),
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabaseClient.from('profiles').update(updates).eq('id', profileId);
    
    btn.disabled = false;
    btn.textContent = 'Save Changes';
    
    if (error) {
      showToast('Error saving profile', 'error');
    } else {
      showToast('Profile updated!', 'success');
      currentProfile = { ...currentProfile, ...updates };
      document.getElementById('profile-name-text').textContent = currentProfile.full_name;
      updateCompletionWidget();
    }
  });

  // Avatar Upload
  const avatarInput = document.getElementById('avatar-upload');
  avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      showToast('Uploading avatar...', 'info');
      const ext = file.name.split('.').pop();
      const fileName = `${currentUser.id}.${ext}`;
      
      const { error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
        
      if (uploadError) throw uploadError;
      
      const { data } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
      
      await supabaseClient.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', currentUser.id);
      
      currentProfile.avatar_url = data.publicUrl;
      document.getElementById('profile-avatar').innerHTML = renderAvatar(currentProfile.full_name, data.publicUrl, "avatar-lg");
      initNavbar(currentProfile); // update top nav
      showToast('Avatar updated!', 'success');
      updateCompletionWidget();
    } catch (err) {
      showToast('Failed to upload', 'error');
      console.error(err);
    }
  });

  // Teach Skill Search
  const tsSearch = document.getElementById('search-teach-skill');
  tsSearch.addEventListener('input', (e) => handleSkillSearch(e.target.value.trim(), 'teach'));
  document.getElementById('btn-add-teach').addEventListener('click', addTeachSkill);

  // Learn Skill Search
  const lsSearch = document.getElementById('search-learn-skill');
  lsSearch.addEventListener('input', (e) => handleSkillSearch(e.target.value.trim(), 'learn'));
  document.getElementById('btn-add-learn').addEventListener('click', addLearnSkill);
  
  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if(!e.target.closest('.search-dropdown-wrap')) {
      document.getElementById('teach-search-results').classList.remove('open');
      document.getElementById('learn-search-results').classList.remove('open');
    }
  });

  // Claim Bonus
  document.getElementById('btn-claim-bonus').addEventListener('click', async () => {
    const { error } = await supabaseClient.from('profiles')
      .update({ profile_completion: 100, credit_balance: currentProfile.credit_balance + 1250 })
      .eq('id', currentUser.id)
      .eq('profile_completion', 99); // Safe guard

    if(error) {
      showToast('Already claimed or error occurred', 'error');
      return;
    }

    await supabaseClient.from('credit_ledger').insert({
      user_id: currentUser.id,
      event_type: 'signup_bonus',
      amount: 1250,
      balance_after: currentProfile.credit_balance + 1250,
      description: 'Profile fully completed bonus'
    });

    currentProfile.credit_balance += 1250;
    currentProfile.profile_completion = 100;
    updateNavCreditDisplay(currentProfile.credit_balance);
    showToast('🎉 1250 credits earned!', 'success');
    updateCompletionWidget();
  });
}

function updateBioCounter() {
  const len = document.getElementById('edit-bio').value.length;
  document.getElementById('bio-counter').textContent = `${len} / 300`;
}

async function handleSkillSearch(term, type) {
  clearTimeout(searchTimeout);
  const resEl = document.getElementById(`${type}-search-results`);
  const btn = document.getElementById(`btn-add-${type}`);
  
  if (!term) {
    resEl.classList.remove('open');
    btn.disabled = true;
    if(type === 'teach') selectedTeachSkill = null;
    else selectedLearnSkill = null;
    return;
  }
  
  searchTimeout = setTimeout(async () => {
    const { data } = await supabaseClient.from('skills')
      .select('id, name, category')
      .ilike('name', `%${term}%`)
      .limit(10);
      
    resEl.innerHTML = '';
    
    if (data && data.length > 0) {
      data.forEach(skill => {
        const div = document.createElement('div');
        div.className = 'skill-search-item';
        div.textContent = `${skill.name} (${skill.category})`;
        div.onclick = () => {
          document.getElementById(`search-${type}-skill`).value = skill.name;
          resEl.classList.remove('open');
          btn.disabled = false;
          if (type === 'teach') selectedTeachSkill = skill;
          else selectedLearnSkill = skill;
        };
        resEl.appendChild(div);
      });
      resEl.classList.add('open');
    } else {
      resEl.classList.remove('open');
    }
  }, 300);
}

async function addTeachSkill() {
  if (!selectedTeachSkill) return;
  const prof = document.getElementById('teach-skill-prof').value;
  
  // Check duplicate
  const { data: exist } = await supabaseClient.from('user_skills_teach')
    .select('id').eq('user_id', currentUser.id).eq('skill_id', selectedTeachSkill.id);
    
  if (exist && exist.length > 0) {
    showToast('You already added this teaching skill', 'error');
    return;
  }
  
  const { error } = await supabaseClient.from('user_skills_teach').insert({
    user_id: currentUser.id,
    skill_id: selectedTeachSkill.id,
    proficiency: prof
  });
  
  if (error) {
    showToast('Error adding skill', 'error');
  } else {
    showToast('Teaching skill added', 'success');
    document.getElementById('search-teach-skill').value = '';
    document.getElementById('btn-add-teach').disabled = true;
    selectedTeachSkill = null;
    await refreshTeachSkills();
    updateCompletionWidget();
  }
}

async function addLearnSkill() {
  if (!selectedLearnSkill) return;
  
  const { data: exist } = await supabaseClient.from('user_skills_learn')
    .select('id').eq('user_id', currentUser.id).eq('skill_id', selectedLearnSkill.id);
    
  if (exist && exist.length > 0) {
    showToast('You already added this learning skill', 'error');
    return;
  }
  
  const { error } = await supabaseClient.from('user_skills_learn').insert({
    user_id: currentUser.id,
    skill_id: selectedLearnSkill.id,
    is_active: true
  });
  
  if (error) {
    showToast('Error adding skill', 'error');
  } else {
    showToast('Learning skill added', 'success');
    document.getElementById('search-learn-skill').value = '';
    document.getElementById('btn-add-learn').disabled = true;
    selectedLearnSkill = null;
    await refreshLearnSkills();
    updateCompletionWidget();
  }
}

// Global hook for delete
window.deleteTeachSkill = async function(id) {
  await supabaseClient.from('user_skills_teach').delete().eq('id', id).eq('user_id', currentUser.id);
  refreshTeachSkills();
}
window.deleteLearnSkill = async function(id) {
  await supabaseClient.from('user_skills_learn').delete().eq('id', id).eq('user_id', currentUser.id);
  refreshLearnSkills();
}
window.toggleLearnActive = async function(id, currentActive) {
  await supabaseClient.from('user_skills_learn').update({ is_active: !currentActive }).eq('id', id).eq('user_id', currentUser.id);
  refreshLearnSkills(); // Just to re-render properly
}

async function refreshTeachSkills() {
  const list = document.getElementById('teach-manager-list');
  const { data } = await supabaseClient.from('user_skills_teach').select('*, skill:skills(name, category)').eq('user_id', currentUser.id);
  
  list.innerHTML = '';
  if(!data || data.length === 0) {
    list.innerHTML = `<div class="text-hint">No teaching skills added.</div>`;
    return;
  }
  
  data.forEach(item => {
    list.innerHTML += `
      <div class="manager-item">
        <div>
          <div class="fw-600">${item.skill?.name}</div>
          <div style="font-size:0.85rem;color:var(--color-text-secondary);">${item.proficiency}</div>
        </div>
        <button class="btn btn-ghost danger" style="padding:6px 12px;" onclick="window.deleteTeachSkill('${item.id}')">Remove</button>
      </div>`;
  });
}

async function refreshLearnSkills() {
  const list = document.getElementById('learn-manager-list');
  const { data } = await supabaseClient.from('user_skills_learn').select('*, skill:skills(name)').eq('user_id', currentUser.id);
  
  list.innerHTML = '';
  if(!data || data.length === 0) {
    list.innerHTML = `<div class="text-hint">No learning skills added.</div>`;
    return;
  }
  
  data.forEach(item => {
    list.innerHTML += `
      <div class="manager-item">
        <div class="fw-600">${item.skill?.name}</div>
        <div style="display:flex;align-items:center;gap:16px;">
          <label class="toggle-switch" title="Actively Looking">
            <input type="checkbox" ${item.is_active ? 'checked' : ''} onchange="window.toggleLearnActive('${item.id}', ${item.is_active})">
            <span class="toggle-slider"></span>
          </label>
          <button class="btn btn-ghost danger" style="padding:6px 12px;" onclick="window.deleteLearnSkill('${item.id}')">Remove</button>
        </div>
      </div>`;
  });
}

// ────────────────────────────────────────────
// Availability Grid Render
// ────────────────────────────────────────────

function renderAvailabilityGrid(availabilityData, isEditor) {
  const grid = document.getElementById('availability-grid');
  if(!grid) return;
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const slots = ['morning', 'afternoon', 'evening', 'night'];
  const slotLabels = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night' };
  
  let html = `<div class="avail-header"></div>`;
  days.forEach(day => html += `<div class="avail-header">${day}</div>`);
  
  slots.forEach(slot => {
    html += `<div class="avail-row-label">${slotLabels[slot]}</div>`;
    days.forEach(dayStr => {
      // Find matcher in data
      let dayInt = days.indexOf(dayStr); // our numeric mapping
      // In DB we probably use strings for day_of_week based on instructions ("dayOfWeek") - let's assume we use string "Mon"
      const cellData = availabilityData.find(a => a.day_of_week === dayStr && a.slot === slot);
      const isAvailable = cellData ? cellData.is_available : false;
      
      const availClass = isAvailable ? 'available' : '';
      const interactClass = isEditor ? 'interactive' : '';
      const onClick = isEditor ? `onclick="window.toggleAvailability('${dayStr}', '${slot}', ${isAvailable})"` : '';
      
      html += `<div class="avail-cell ${availClass} ${interactClass}" ${onClick}></div>`;
    });
  });
  
  grid.innerHTML = html;
}

window.toggleAvailability = async function(day, slot, currentVal) {
  await supabaseClient.from('availability').upsert({
    user_id: currentUser.id,
    day_of_week: day,
    slot: slot,
    is_available: !currentVal
  }, { onConflict: 'user_id,day_of_week,slot' });
  
  // Refresh visually instantly rather than full refetch
  const { data: avail } = await supabaseClient.from('availability').select('*').eq('user_id', currentUser.id);
  renderAvailabilityGrid(avail || [], true);
  updateCompletionWidget();
}

// ────────────────────────────────────────────
// Profile Completion
// ────────────────────────────────────────────

async function checkCompletionData() {
  const { data: teach } = await supabaseClient.from('user_skills_teach').select('id').eq('user_id', profileId).limit(1);
  const { data: learn } = await supabaseClient.from('user_skills_learn').select('id').eq('user_id', profileId).limit(1);
  const { data: avail } = await supabaseClient.from('availability').select('id').eq('user_id', profileId).eq('is_available', true).limit(1);
  
  return {
    hasAvatar: !!currentProfile.avatar_url,
    hasBio: !!currentProfile.bio,
    hasCollege: !!currentProfile.college,
    hasTeach: teach?.length > 0,
    hasLearn: learn?.length > 0,
    hasAvail: avail?.length > 0
  };
}

const checkSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
const uncheckSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;

async function updateCompletionWidget() {
  if (!isMyProfile) return;
  if (currentProfile.profile_completion === 100) {
    document.getElementById('completion-widget').style.display = 'none';
    return;
  }
  
  document.getElementById('completion-widget').style.display = 'block';
  
  const status = await checkCompletionData();
  
  let score = 15; // base for account created
  if (status.hasAvatar) score += 15;
  if (status.hasBio) score += 10;
  if (status.hasCollege) score += 20;
  if (status.hasTeach) score += 15;
  if (status.hasLearn) score += 10;
  if (status.hasAvail) score += 15;
  
  if (score > 99) score = 99; // Cap at 99 until claimed
  
  document.getElementById('completion-progress').style.width = `${score}%`;
  
  function setEl(id, isDone) {
    const el = document.getElementById(id);
    if(isDone) {
      el.classList.add('done');
      el.innerHTML = `${checkSvg} ${el.textContent.trim()}`;
    } else {
      el.classList.remove('done');
      // replace icon leaving text
      el.innerHTML = `${uncheckSvg} ${el.textContent.trim()}`;
    }
  }

  setEl('req-avatar', status.hasAvatar);
  setEl('req-bio', status.hasBio);
  setEl('req-college', status.hasCollege);
  setEl('req-teach', status.hasTeach);
  setEl('req-learn', status.hasLearn);
  setEl('req-avail', status.hasAvail);
  
  const btn = document.getElementById('btn-claim-bonus');
  if (score === 99) {
    btn.disabled = false;
  } else {
    btn.disabled = true;
  }
  
  // Background DB update for partial score
  if(currentProfile.profile_completion !== score) {
    await supabaseClient.from('profiles').update({ profile_completion: score }).eq('id', currentUser.id);
    currentProfile.profile_completion = score;
  }
}

// ────────────────────────────────────────────
// Public Modal Actions (Same as Browse)
// ────────────────────────────────────────────

window.openRequestModal = function(profile) {
  // We assume the modal HTML exists in profile.html
  document.getElementById('modal-peer-avatar').innerHTML = renderAvatar(profile.full_name, profile.avatar_url, "avatar-md");
  document.getElementById('modal-peer-name').textContent = `Request session with ${profile.full_name}`;
  
  document.getElementById('modal-your-balance').textContent = `Your balance: ${Number(currentProfile.credit_balance).toLocaleString()} ✦`;
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);
  const tzOffset = (new Date()).getTimezoneOffset() * 60000;
  const localISOTime = (new Date(tomorrow - tzOffset)).toISOString().slice(0, 16);
  document.getElementById('modal-datetime').value = localISOTime;

  document.getElementById('request-modal').classList.add('open');
};

function closeRequestModal() {
  document.getElementById('request-modal').classList.remove('open');
}

function updateModalCost() {
  const mins = parseInt(document.getElementById('modal-duration').value, 10);
  const cost = (mins / 60) * 1250;
  document.getElementById('modal-cost-preview').textContent = `Cost: ${cost} ✦`;
  
  const btn = document.getElementById('confirm-request-btn');
  const errorAlert = document.getElementById('modal-error');
  if (cost > (currentProfile.credit_balance || 0)) {
    btn.disabled = true;
    errorAlert.textContent = "Insufficient credits for this duration.";
    errorAlert.style.display = 'flex';
  } else {
    btn.disabled = false;
    errorAlert.style.display = 'none';
  }
}

async function handleSessionRequest(e, targetProfileId) {
  e.preventDefault();
  const duration = parseInt(document.getElementById('modal-duration').value, 10);
  const cost = (duration / 60) * 1250;
  const dateTimeStr = document.getElementById('modal-datetime').value;
  const notes = document.getElementById('modal-notes').value.trim();
  const selectEl = document.getElementById('modal-skill-select');
  const skillId = selectEl.value; // Must exist from populated teach skills
  
  const btn = document.getElementById('confirm-request-btn');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Requesting...`;

  try {
    const { data: sessionData, error: sessionErr } = await supabaseClient
      .from('sessions')
      .insert({
        teacher_id: targetProfileId,
        learner_id: currentUser.id,
        skill_id: skillId,
        duration_mins: duration,
        scheduled_at: new Date(dateTimeStr).toISOString(),
        notes: notes,
        credits_cost: cost,
        credits_earned: cost,
        status: 'pending'
      }).select('id').single();

    if (sessionErr) throw sessionErr;
    
    // Escrow etc... same logic as browse.js
    await supabaseClient.from('session_escrow').insert({
      session_id: sessionData.id,
      learner_id: currentUser.id,
      teacher_id: targetProfileId,
      amount: cost,
      status: 'held'
    });
    
    const newBal = currentProfile.credit_balance - cost;
    await supabaseClient.from('profiles').update({ credit_balance: newBal }).eq('id', currentUser.id);
    await supabaseClient.from('credit_ledger').insert({
      user_id: currentUser.id, event_type: 'escrow_hold', amount: -cost, balance_after: newBal, session_id: sessionData.id, description: `Session request sent`
    });

    closeRequestModal();
    showToast(`Session requested!`, "success");
  } catch (err) {
    document.getElementById('modal-error').textContent = err.message;
    document.getElementById('modal-error').style.display = 'flex';
  } finally {
    btn.disabled = false;
    btn.innerHTML = `Confirm Request`;
  }
}

// Start
init();
