import {
  supabaseClient,
  requireAuth,
  getCurrentProfile,
  signOut,
  initOnlineTracking,
  getTotalUnreadCount,
} from "./supabase.js";

// ─────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(fullName) {
  if (!fullName) return "?";
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDateTime(dateStr) {
  if (!dateStr) return "TBD";
  return new Date(dateStr).toLocaleString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const EVENT_LABELS = {
  signup_bonus: "Welcome Bonus",
  session_teach: "Session Taught",
  session_learn: "Session Learned",
  rating_bonus: "5-Star Bonus",
  streak_bonus: "Streak Reward",
  endorsement_bonus: "Peer Endorsement",
  endorsement_given: "Endorsed a Peer",
  referral_bonus: "Referral Bonus",
  refund: "Credit Refund",
};

function eventLabel(type) {
  return EVENT_LABELS[type] || type?.replace(/_/g, " ") || "Credit Event";
}

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

// ─────────────────────────────────────────────────────────
// DOM Helpers
// ─────────────────────────────────────────────────────────

function $id(id) {
  return document.getElementById(id);
}

function showSkeleton(id) {
  const el = $id(id);
  if (el) el.style.display = "";
}

function hideSkeleton(id) {
  const el = $id(id);
  if (el) el.style.display = "none";
}

function setHTML(id, html) {
  const el = $id(id);
  if (el) el.innerHTML = html;
}

function setText(id, text) {
  const el = $id(id);
  if (el) el.textContent = text;
}

function renderAvatar(fullName, avatarUrl, sizeClass = "avatar-md") {
  if (avatarUrl) {
    return `<span class="avatar ${sizeClass}"><img src="${avatarUrl}" alt="${fullName}" loading="lazy"></span>`;
  }
  return `<span class="avatar ${sizeClass}">${getInitials(fullName)}</span>`;
}

// ─────────────────────────────────────────────────────────
// Credit balance display (also used by realtime)
// ─────────────────────────────────────────────────────────

export function updateCreditDisplay(balance) {
  const formatted = Number(balance).toLocaleString();
  const elements = document.querySelectorAll(".js-credit-balance");
  elements.forEach((el) => (el.textContent = formatted));
}

// ─────────────────────────────────────────────────────────
// Section renderers
// ─────────────────────────────────────────────────────────

function renderWelcomeBanner(profile) {
  const firstName = (profile.full_name || "there").split(" ")[0];
  const greeting = `${getGreeting()}, ${firstName} 👋`;
  const college = [profile.college, profile.department, profile.year_of_study ? `Year ${profile.year_of_study}` : ""]
    .filter(Boolean)
    .join(" · ");
  const completion = profile.profile_completion ?? 0;

  setText("welcome-greeting", greeting);
  setText("welcome-college", college || "Complete your profile");
  $id("progress-bar-fill").style.width = `${completion}%`;
  setText("progress-percent", `${completion}% complete`);

  if (completion < 100) {
    $id("profile-complete-hint").style.display = "block";
  }

  const streak = profile.login_streak ?? 0;
  if (streak > 0) {
    setHTML("streak-display", `<div class="streak-value">🔥 ${streak}</div><div class="streak-label">day streak</div>`);
  } else {
    setHTML("streak-display", `<div class="streak-value">🔥</div><div class="streak-label">Start your streak today!</div>`);
  }
}

function renderStats(profile) {
  updateCreditDisplay(profile.credit_balance ?? 0);

  setText("stat-sessions-taught", profile.sessions_taught ?? 0);
  setText("stat-sessions-learned", profile.sessions_learned ?? 0);

  const rating = Number(profile.avg_rating ?? 0).toFixed(1);
  const stars = Math.round(profile.avg_rating ?? 0);
  const starHTML = Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < stars ? "var(--color-warning)" : "var(--color-border)"}">${i < stars ? "★" : "☆"}</span>`
  ).join("");
  setHTML("stat-rating", `${rating} <span style="font-size:1.1rem;">${starHTML}</span>`);
}

function renderSessions(sessions, userId) {
  hideSkeleton("sessions-skeleton");
  const container = $id("sessions-container");

  if (!sessions || sessions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <div class="empty-state-title">No upcoming sessions</div>
        <div class="empty-state-text">Browse peers to book your first session!</div>
        <a href="browse.html" class="btn btn-primary" style="display:inline-flex;">Browse Skills</a>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="sessions-grid">${sessions.map((s) => renderSessionCard(s, userId)).join("")}</div>`;
}

function renderSessionCard(s, userId) {
  const isTeaching = s.teacher_id === userId;
  const other = isTeaching ? s.learner : s.teacher;
  const otherName = other?.full_name || "Unknown";
  const roleLabel = isTeaching ? "Teaching" : "Learning";
  const roleClass = isTeaching ? "teaching" : "learning";
  const creditLabel = isTeaching
    ? `<span class="session-credit earn">+${s.credits_earned ?? s.credits_cost ?? 0} ✦</span>`
    : `<span class="session-credit spend">-${s.credits_cost ?? 0} ✦</span>`;

  const joinBtn = s.status === "confirmed" && s.meet_link
    ? `<a href="${s.meet_link}" target="_blank" rel="noopener" class="btn btn-primary" style="padding:8px 16px;font-size:13px;width:100%;">Join Session</a>`
    : "";

  return `
    <div class="session-card">
      <div class="session-card-header">
        <span class="badge ${categoryBadgeClass(s.skill?.category)}">${s.skill?.name || "Session"}</span>
        <span class="status-badge ${s.status}">${s.status.charAt(0).toUpperCase() + s.status.slice(1)}</span>
      </div>
      <div class="session-person">
        ${renderAvatar(otherName, other?.avatar_url, "avatar-sm")}
        <div class="session-meta">
          <span class="fw-600" style="font-size:14px;">${otherName}</span>
          <span class="role-badge ${roleClass}">${roleLabel}</span>
        </div>
        <div style="margin-left:auto;">${creditLabel}</div>
      </div>
      <div class="session-date">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${formatDateTime(s.scheduled_at)}
      </div>
      ${joinBtn}
    </div>`;
}

function renderMatches(matches) {
  hideSkeleton("matches-skeleton");
  const container = $id("matches-container");

  if (!matches || matches.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎯</div>
        <div class="empty-state-title">No matches yet</div>
        <div class="empty-state-text">Add skills you want to learn to get matched with teachers!</div>
        <a href="my-profile.html" class="btn btn-primary" style="display:inline-flex;">Add Learning Skills</a>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="matches-grid">${matches.map(renderMatchCard).join("")}</div>`;
}

function renderMatchCard(m) {
  const p = m.profile || {};
  const name = p.full_name || "Unknown";
  const rating = Number(p.avg_rating ?? 0).toFixed(1);
  const stars = Math.round(p.avg_rating ?? 0);
  const starHTML = Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < stars ? "var(--color-warning)" : "var(--color-border)"};font-size:12px;">${i < stars ? "★" : "☆"}</span>`
  ).join("");
  const onlineDot = p.is_online ? `<span class="online-dot match-online-dot"></span>` : "";
  const proficiency = m.proficiency_level
    ? `<span class="badge badge-other" style="font-size:11px;">${m.proficiency_level}</span>`
    : "";

  return `
    <div class="match-card">
      <div style="display:flex;align-items:center;gap:12px;">
        <div class="match-avatar-wrap">
          ${renderAvatar(name, p.avatar_url, "avatar-md")}
          ${onlineDot}
        </div>
        <div>
          <div class="fw-600" style="font-size:14px;">${name}</div>
          <div class="text-hint" style="font-size:12px;">${p.college || ""}</div>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <span class="badge ${categoryBadgeClass(m.skill?.category)}">${m.skill?.name || "Skill"}</span>
        ${proficiency}
      </div>
      <div style="display:flex;align-items:center;gap:4px;">
        ${starHTML}
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:4px;">${rating}</span>
      </div>
      <a href="profile.html?id=${p.id}" class="btn btn-secondary" style="padding:8px 16px;font-size:13px;width:100%;">View Profile</a>
    </div>`;
}

function renderLedger(ledger) {
  hideSkeleton("ledger-skeleton");
  const container = $id("ledger-container");

  if (!ledger || ledger.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💳</div>
        <div class="empty-state-title">No credit activity yet</div>
        <div class="empty-state-text">Start teaching or learning to see your credit history here.</div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="ledger-list">
      ${ledger.map((row) => {
        const positive = row.amount > 0;
        return `
          <div class="ledger-row">
            <div class="ledger-info">
              <div class="ledger-label">${eventLabel(row.event_type)}</div>
              <div class="ledger-desc">${row.description || ""}</div>
            </div>
            <div>
              <div class="ledger-amount ${positive ? "positive" : "negative"}">
                ${positive ? "+" : ""}${row.amount.toLocaleString()} ✦
              </div>
              <div class="ledger-balance">${Number(row.balance_after ?? 0).toLocaleString()} ✦ bal.</div>
            </div>
            <div class="ledger-time">${timeAgo(row.created_at)}</div>
          </div>`;
      }).join("")}
    </div>`;
}

// ─────────────────────────────────────────────────────────
// Navbar: avatar dropdown + notification bell
// ─────────────────────────────────────────────────────────

function initNavbar(profile) {
  // Initials avatar
  const initials = getInitials(profile.full_name);
  const navAvatarEl = $id("nav-avatar");
  if (navAvatarEl) {
    if (profile.avatar_url) {
      navAvatarEl.innerHTML = `<img src="${profile.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="Avatar">`;
    } else {
      navAvatarEl.textContent = initials;
    }
  }

  // Credit balance
  updateCreditDisplay(profile.credit_balance ?? 0);

  // Avatar dropdown toggle
  const avatarBtn = $id("nav-avatar-btn");
  const dropdown = $id("nav-dropdown");
  if (avatarBtn && dropdown) {
    avatarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("open");
    });
    document.addEventListener("click", () => dropdown.classList.remove("open"));
  }

  // Sign out
  const signOutBtn = $id("nav-signout-btn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      await signOut();
    });
  }

  // Active nav link
  const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";
  document.querySelectorAll(".navbar-app-links a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
}

async function fetchUnreadCount(userId) {
  const total = await getTotalUnreadCount(userId);
  const badge = $id("nav-bell-badge");
  if (badge) {
    if (total > 0) {
      badge.textContent = total > 99 ? '99+' : total;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

// ─────────────────────────────────────────────────────────
// Realtime subscription
// ─────────────────────────────────────────────────────────

function subscribeToProfileChanges(userId) {
  const channel = supabaseClient
    .channel(`profile-changes-dashboard-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        updateCreditDisplay(payload.new.credit_balance);
      }
    )
    .subscribe();

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    supabaseClient.removeChannel(channel);
  });
}

// ─────────────────────────────────────────────────────────
// Main init — auth gate is FIRST
// ─────────────────────────────────────────────────────────

async function init() {
  // 1. Auth gate — redirects to login.html if not logged in
  const user = await requireAuth();
  if (!user) return; // requireAuth already redirected
  initOnlineTracking();

  // 2. Fetch profile
  const profile = await getCurrentProfile();
  if (!profile) {
    // Profile missing — redirect to login
    window.location.href = "login.html";
    return;
  }

  // 3. Populate navbar
  initNavbar(profile);

  // 4. Show page content (was hidden until auth confirmed)
  const pageContent = $id("page-content");
  if (pageContent) pageContent.style.visibility = "visible";
  document.getElementById('page-loader')?.classList.add('hidden');

  // 5. Render welcome banner (no extra fetch needed)
  renderWelcomeBanner(profile);

  // 6. Render stats row
  renderStats(profile);

  // 7. Realtime credit updates
  subscribeToProfileChanges(user.id);

  // 8. Async parallel fetches
  Promise.all([
    fetchSessions(user.id),
    fetchMatches(user.id),
    fetchLedger(user.id),
    fetchUnreadCount(user.id),
  ]);
}

async function fetchSessions(userId) {
  const { data: sessions, error } = await supabaseClient
    .from("sessions")
    .select(`
      *,
      teacher:profiles!sessions_teacher_id_fkey(id, full_name, avatar_url),
      learner:profiles!sessions_learner_id_fkey(id, full_name, avatar_url),
      skill:skills(name, category)
    `)
    .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`)
    .in("status", ["pending", "confirmed"])
    .order("scheduled_at", { ascending: true })
    .limit(3);

  if (error) {
    console.error("Sessions fetch error:", error.message);
  }
  renderSessions(sessions, userId);
}

async function fetchMatches(userId) {
  // Step A: get the skill IDs the user wants to learn
  const { data: learnSkills, error: learnErr } = await supabaseClient
    .from("user_skills_learn")
    .select("skill_id")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (learnErr) {
    console.error("Learn skills fetch error:", learnErr.message);
    renderMatches([]);
    return;
  }

  const skillIds = (learnSkills || []).map((s) => s.skill_id);

  if (skillIds.length === 0) {
    renderMatches([]);
    return;
  }

  // Step B: find teachers of those skills
  const { data: matches, error: matchErr } = await supabaseClient
    .from("user_skills_teach")
    .select(`
      *,
      profile:profiles(id, full_name, avatar_url, college, avg_rating, is_online),
      skill:skills(name, category)
    `)
    .in("skill_id", skillIds)
    .neq("user_id", userId)
    .order("avg_rating", { ascending: false })
    .limit(4);

  if (matchErr) {
    console.error("Matches fetch error:", matchErr.message);
  }
  renderMatches(matches);
}

async function fetchLedger(userId) {
  const { data: ledger, error } = await supabaseClient
    .from("credit_ledger")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Ledger fetch error:", error.message);
  }
  renderLedger(ledger);
}

// ─────────────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────────────

init();
