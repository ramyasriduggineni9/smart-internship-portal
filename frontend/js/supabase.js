/**
 * Supabase Authentication & Profile Integration
 * Smart Internship Portal
 */

// Supabase Configuration
const SUPABASE_URL = "https://jbjfbczsxezptvhswfmm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_QhEWhEnwiVutvWyR983O0w_itQJZaWQ";

(() => {
  // Primary page containers
  const welcomePage = document.getElementById('welcomePage');
  const dashboardApp = document.getElementById('dashboardApp');

  // Modals
  const signupModal = document.getElementById('signupModal');
  const forgotModal = document.getElementById('forgotModal');
  const profilePanel = document.getElementById('profilePanel');

  // Forms
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const forgotForm = document.getElementById('forgotForm');
  const profileForm = document.getElementById('profileForm');

  // Messages
  const loginMsg = document.getElementById('loginMsg');
  const signupMsg = document.getElementById('signupMsg');
  const forgotMsg = document.getElementById('forgotMsg');
  const profileMessage = document.getElementById('profileMessage');

  // Buttons & Controls
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const signupSubmitBtn = document.getElementById('signupSubmitBtn');
  const forgotSubmitBtn = document.getElementById('forgotSubmitBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  const profileOpenBtn = document.getElementById('profileOpen');
  const profileCloseBtn = document.getElementById('profileClose');

  let client = null;
  let currentUser = null;

  const say = (el, msg, isError = true) => {
    if (!el) return;
    el.textContent = msg || '';
    el.className = isError ? 'modal-msg auth-error' : 'modal-msg auth-success';
  };

  const isConfigured = () => {
    return SUPABASE_URL.startsWith('https://') &&
           SUPABASE_PUBLISHABLE_KEY.length > 20 &&
           !SUPABASE_URL.includes('PASTE_') &&
           !SUPABASE_PUBLISHABLE_KEY.includes('PASTE_');
  };

  /* ---------- Modal Controls ---------- */
  function openModal(modal) {
    closeAllModals();
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    const firstInput = modal.querySelector('input');
    if (firstInput) setTimeout(() => firstInput.focus(), 80);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    // Clear status messages
    if (loginMsg) say(loginMsg, '');
    if (signupMsg) say(signupMsg, '');
    if (forgotMsg) say(forgotMsg, '');
  }

  function closeAllModals() {
    [signupModal, forgotModal, profilePanel].forEach(m => {
      if (m) m.hidden = true;
    });
    document.body.style.overflow = '';
  }

  function focusLogin(email) {
    closeAllModals();
    const loginEmailInput = document.getElementById('loginEmail');
    const stage = document.getElementById('studentLogin');
    if (email && loginEmailInput) loginEmailInput.value = email;
    if (stage) stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (loginEmailInput) setTimeout(() => loginEmailInput.focus(), 280);
  }

  /* ---------- Page View Transitions ---------- */
  function showDashboard() {
    closeAllModals();
    if (welcomePage) welcomePage.hidden = true;
    if (dashboardApp) dashboardApp.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window.renderDashboard === 'function') {
      window.renderDashboard();
    }
  }

  function showWelcome() {
    closeAllModals();
    if (dashboardApp) dashboardApp.hidden = true;
    if (welcomePage) welcomePage.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Profile Loading & Sync ---------- */
  async function loadProfile() {
    if (!client || !currentUser) return;
    try {
      const { data, error } = await client
        .from('students')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.warn('Could not query students table:', error.message);
      }

      const fullName = data?.full_name || currentUser.user_metadata?.full_name || '';
      const email = currentUser.email || '';
      const college = data?.college || currentUser.user_metadata?.college || '';
      const department = data?.department || currentUser.user_metadata?.department || '';
      const gradYear = data?.graduation_year || currentUser.user_metadata?.graduation_year || '';

      // Populate profile dialog inputs
      const pfName = document.getElementById('pfName');
      const pfEmail = document.getElementById('pfEmail');
      const pfCollege = document.getElementById('pfCollege');
      const pfDepartment = document.getElementById('pfDepartment');
      const pfYear = document.getElementById('pfYear');

      if (pfName) pfName.value = fullName;
      if (pfEmail) pfEmail.value = email;
      if (pfCollege) pfCollege.value = college;
      if (pfDepartment) pfDepartment.value = department;
      if (pfYear) pfYear.value = gradYear;

      // Sync with global application state S if present
      if (window.S && window.S.student) {
        window.S.student.name = fullName;
        if (window.S.resume) {
          window.S.resume = window.S.resume.replace(/^.*$/m, fullName.toUpperCase());
        }
      }

      if (typeof window.renderDashboard === 'function') {
        window.renderDashboard();
      }
    } catch (err) {
      console.error('loadProfile error:', err);
    }
  }

  /* ---------- Session Handler ---------- */
  async function handleSession(session) {
    if (!session?.user) {
      currentUser = null;
      showWelcome();
      return;
    }
    currentUser = session.user;
    showDashboard();
    await loadProfile();
  }

  /* ---------- Authentication Action Handlers ---------- */

  // 1. Log In Form Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      say(loginMsg, '');

      if (!client) {
        say(loginMsg, 'Supabase client is not initialized. Please check network connectivity.');
        return;
      }

      const email = document.getElementById('loginEmail')?.value.trim();
      const password = document.getElementById('loginPassword')?.value;

      if (!email || !password) {
        say(loginMsg, 'Please enter both email and password.');
        return;
      }

      loginSubmitBtn.disabled = true;
      loginSubmitBtn.textContent = 'Logging in...';

      try {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please verify your credentials or create a new account.');
          } else if (error.message.includes('Email not confirmed')) {
            throw new Error('Your email is not confirmed yet. Please check your inbox for the verification link.');
          }
          throw error;
        }

        if (data.session) {
          await handleSession(data.session);
          if (typeof window.showToast === 'function') {
            window.showToast('Logged in successfully. Welcome to Smart Internship Portal!');
          }
        }
      } catch (err) {
        say(loginMsg, err.message || 'Login failed. Please try again.');
      } finally {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = 'Log In';
      }
    });
  }

  // 2. Create Account Form Submit
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      say(signupMsg, '');

      if (!client) {
        say(signupMsg, 'Supabase client is not initialized.');
        return;
      }

      const fullName = document.getElementById('signupFullName')?.value.trim();
      const email = document.getElementById('signupEmail')?.value.trim();
      const password = document.getElementById('signupPassword')?.value;
      const confirmPassword = document.getElementById('signupConfirmPassword')?.value;
      const college = document.getElementById('signupCollege')?.value.trim();
      const department = document.getElementById('signupDepartment')?.value;
      const graduationYear = document.getElementById('signupGradYear')?.value;

      if (!fullName || !email || !password || !college || !department || !graduationYear) {
        say(signupMsg, 'Please fill in all required fields.');
        return;
      }

      if (password.length < 6) {
        say(signupMsg, 'Password must be at least 6 characters long.');
        return;
      }

      if (password !== confirmPassword) {
        say(signupMsg, 'Passwords do not match. Please verify and re-type.');
        return;
      }

      signupSubmitBtn.disabled = true;
      signupSubmitBtn.textContent = 'Creating account...';

      try {
        const metadata = {
          full_name: fullName,
          college: college,
          department: department,
          graduation_year: Number(graduationYear)
        };

        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { data: metadata }
        });

        if (error) throw error;

        // Attempt to upsert student record in the students table
        if (data.user) {
          try {
            await client.from('students').upsert({
              user_id: data.user.id,
              full_name: fullName,
              email: email,
              college: college,
              department: department,
              graduation_year: Number(graduationYear),
              cgpa: 8.20,
              skills: ['Python', 'SQL', 'HTML/CSS', 'Git', 'Flask'],
              completed_courses: ['DBMS', 'Operating Systems', 'Data Structures', 'Web Technologies', 'Python Programming']
            }, { onConflict: 'user_id' });
          } catch (upsertErr) {
            console.warn('Initial student profile upsert deferred:', upsertErr);
          }
        }

        if (data.session) {
          await handleSession(data.session);
          if (typeof window.showToast === 'function') {
            window.showToast('Account created successfully! Welcome aboard.');
          }
        } else {
          say(signupMsg, 'Account created! Please check your email inbox to verify your address, then log in.', false);
          setTimeout(() => {
            focusLogin(email);
            say(loginMsg, 'Account created. Check your email, then log in.', false);
          }, 2400);
        }
      } catch (err) {
        say(signupMsg, err.message || 'Account registration failed.');
      } finally {
        signupSubmitBtn.disabled = false;
        signupSubmitBtn.textContent = 'Create Account';
      }
    });
  }

  // 3. Forgot Password Form Submit
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      say(forgotMsg, '');

      const email = document.getElementById('forgotEmail')?.value.trim();
      if (!email) {
        say(forgotMsg, 'Please enter your registered email address.');
        return;
      }

      forgotSubmitBtn.disabled = true;
      forgotSubmitBtn.textContent = 'Sending...';

      try {
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });
        if (error) throw error;
        say(forgotMsg, 'Password reset link sent! Check your inbox.', false);
      } catch (err) {
        say(forgotMsg, err.message || 'Unable to send reset email.');
      } finally {
        forgotSubmitBtn.disabled = false;
        forgotSubmitBtn.textContent = 'Send Reset Link';
      }
    });
  }

  // 4. Student Profile Modal Form Submit
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      say(profileMessage, '');
      if (!currentUser || !client) return;

      const fullName = document.getElementById('pfName')?.value.trim();
      const college = document.getElementById('pfCollege')?.value.trim();
      const department = document.getElementById('pfDepartment')?.value.trim();
      const graduationYear = Number(document.getElementById('pfYear')?.value);

      const row = {
        user_id: currentUser.id,
        full_name: fullName,
        email: currentUser.email,
        college,
        department,
        graduation_year: graduationYear
      };

      try {
        const { error } = await client.from('students').upsert(row, { onConflict: 'user_id' });
        if (error) throw error;

        if (window.S && window.S.student) {
          window.S.student.name = fullName;
          if (window.S.resume) {
            window.S.resume = window.S.resume.replace(/^.*$/m, fullName.toUpperCase());
          }
        }

        if (typeof window.showToast === 'function') {
          window.showToast('Student profile saved successfully.');
        }

        closeModal(profilePanel);

        if (typeof window.renderDashboard === 'function') {
          window.renderDashboard();
        }
      } catch (err) {
        say(profileMessage, err.message || 'Error saving profile.');
      }
    });
  }

  // 5. Sign Out
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      try {
        if (client) {
          await client.auth.signOut();
        }
      } catch (err) {
        console.warn('SignOut warning:', err);
      } finally {
        currentUser = null;
        showWelcome();
        if (typeof window.showToast === 'function') {
          window.showToast('Signed out successfully.');
        }
      }
    });
  }

  // 6. Profile Open & Close buttons
  if (profileOpenBtn) {
    profileOpenBtn.addEventListener('click', () => {
      openModal(profilePanel);
    });
  }

  if (profileCloseBtn) {
    profileCloseBtn.addEventListener('click', () => {
      closeModal(profilePanel);
    });
  }

  /* ---------- Modal Triggers on Welcome Page ---------- */
  document.addEventListener('click', (e) => {
    // Open Login Modal
    if (e.target.closest('#navLoginBtn, #ctaLoginBtn, #switchToLogin, #forgotBackToLogin')) {
      e.preventDefault();
      focusLogin();
      return;
    }

    // Open Sign Up Modal
    if (e.target.closest('#navSignupBtn, #heroGetStartedBtn, #ctaGetStartedBtn, #switchToSignup')) {
      e.preventDefault();
      openModal(signupModal);
      return;
    }

    // Open Forgot Password Modal
    if (e.target.closest('#openForgotBtn')) {
      e.preventDefault();
      openModal(forgotModal);
      return;
    }

    // Close Modals when clicking close button [data-close-modal]
    if (e.target.closest('[data-close-modal]')) {
      closeAllModals();
      return;
    }

    // Close Modals when clicking outside dialog on backdrop
    if (e.target.classList.contains('modal-backdrop')) {
      closeAllModals();
      return;
    }
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  /* ---------- Global Exports & Initialization ---------- */
  window.openLoginModal = () => focusLogin();
  window.openSignupModal = () => openModal(signupModal);
  window.showDashboard = showDashboard;
  window.showWelcome = showWelcome;

  async function init() {
    if (!isConfigured() || !window.supabase) {
      console.warn('Supabase not configured or library missing. Running in demo mode.');
      showWelcome();
      return;
    }

    try {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
      const { data: { session } } = await client.auth.getSession();
      await handleSession(session);

      client.auth.onAuthStateChange((_event, session) => {
        handleSession(session);
      });
    } catch (err) {
      console.error('Initialization error:', err);
      showWelcome();
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
