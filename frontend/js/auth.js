/**
 * Smart Internship Portal — Shared Auth Utilities
 * Used by index.html and all role dashboard pages.
 */

const SUPABASE_URL = "https://jbjfbczsxezptvhswfmm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_QhEWhEnwiVutvWyR983O0w_itQJZaWQ";

// Role → dashboard path map
const ROLE_DASHBOARD = {
  student:  'student.html',
  employer: 'employer.html',
  faculty:  'faculty.html',
  admin:    'admin.html'
};

function getSupabaseClient() {
  if (window._sbClient) return window._sbClient;
  if (!window.supabase) return null;
  window._sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return window._sbClient;
}

/** Fetch the role string ('student'|'employer'|'faculty'|'admin') for a user. */
async function getUserRole(client, userId) {
  const { data, error } = await client
    .from('user_profiles')
    .select('role, status')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/** Sign the user out and go to the welcome page. */
async function signOutAndRedirect() {
  const client = getSupabaseClient();
  if (client) await client.auth.signOut().catch(() => {});
  window.location.href = 'index.html';
}

/** Guard — call at the top of each dashboard page.
 *  requiredRole: 'student'|'employer'|'faculty'|'admin'
 *  Returns the full user record if authorized, otherwise redirects. */
async function requireRole(requiredRole) {
  const client = getSupabaseClient();
  if (!client) { window.location.href = 'index.html'; return null; }

  const { data: { session } } = await client.auth.getSession();
  if (!session?.user) { window.location.href = 'index.html'; return null; }

  const profile = await getUserRole(client, session.user.id);
  if (!profile) {
    alert('Your account profile was not found. Please contact the administrator.');
    await client.auth.signOut();
    window.location.href = 'index.html';
    return null;
  }

  if (profile.status === 'disabled') {
    alert('Your account has been disabled. Contact the administrator.');
    await client.auth.signOut();
    window.location.href = 'index.html';
    return null;
  }

  if (profile.status === 'pending') {
    alert('Your account is pending administrator approval. Please wait for activation.');
    await client.auth.signOut();
    window.location.href = 'index.html';
    return null;
  }

  if (profile.role !== requiredRole) {
    alert(`Access denied: Your account is not authorized for the ${requiredRole} portal.`);
    await client.auth.signOut();
    window.location.href = 'index.html';
    return null;
  }

  return { user: session.user, profile };
}

window.SIP = { getSupabaseClient, getUserRole, signOutAndRedirect, requireRole, ROLE_DASHBOARD };
