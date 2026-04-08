import { supabaseClient, getCurrentUser } from "./supabase.js";

export async function loginUser(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signupUser(email, password, profileData) {
  // Step 1: Create auth user
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
  });
  if (error) throw error;

  // Step 2: Update profile with college details
  // handle_new_user trigger creates the profile row automatically
  // We just update the extra fields
  if (data.user) {
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .update({
        full_name: profileData.fullName,
        college: profileData.college,
        department: profileData.department,
        year_of_study: profileData.yearOfStudy,
        mobile: profileData.mobile || null,
      })
      .eq("id", data.user.id);
    if (profileError) throw profileError;
  }
  return data;
}

export async function logoutUser() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
  window.location.href = "index.html";
}
