import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://xjoxvoiuzegtsjdpggui.supabase.co";
// SUPABASE_ANON_KEY is safe to expose in frontend code.
// It is a public key that only allows operations permitted by RLS policies.
// Never expose your SERVICE_ROLE key in frontend code.
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqb3h2b2l1emVndHNqZHBnZ3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDkzMzQsImV4cCI6MjA5MTIyNTMzNH0.Y-s5sAikkLCpaJA0diEdJGaaiLRHs4hWI_jEVvBOuHs";

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Auth ---

export async function getCurrentUser() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) return null;
  cacheUserId(user.id);
  return data;
}

export async function signOut() {
  await setOnlineStatus(false);
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

// --- Online Status ---

let _cachedUserId = null;

export function cacheUserId(id) {
  _cachedUserId = id;
}

export function getCurrentUserSync() {
  return _cachedUserId;
}

export async function setOnlineStatus(isOnline) {
  const user = await getCurrentUser();
  if (!user) return;
  await supabaseClient
    .from("profiles")
    .update({
      is_online: isOnline,
      last_seen_at: new Date().toISOString()
    })
    .eq("id", user.id);
}

export function initOnlineTracking() {
  setOnlineStatus(true);

  window.addEventListener("beforeunload", () => {
    setOnlineStatus(false);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      setOnlineStatus(false);
    } else {
      setOnlineStatus(true);
    }
  });

  // Heartbeat every 60 seconds
  setInterval(() => {
    if (document.visibilityState === "visible") {
      setOnlineStatus(true);
    }
  }, 60000);
}

// --- Unread Count ---

export async function getTotalUnreadCount(userId) {
  const [notifResult, convResult] = await Promise.all([
    supabaseClient
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false),
    supabaseClient
      .from("conversations")
      .select("unread_a, unread_b, user_a")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
  ]);

  const notifCount = notifResult.count || 0;
  const msgCount = (convResult.data || []).reduce((sum, conv) => {
    return sum + (conv.user_a === userId ? conv.unread_a : conv.unread_b);
  }, 0);

  return notifCount + msgCount;
}