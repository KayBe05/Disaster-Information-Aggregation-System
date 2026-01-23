// ============================================
// AUTH.JS - COMMAND ACCESS PORTAL LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', function () {
  // Initialize Feather Icons
  feather.replace();

  // State Management
  const state = {
    currentMode: 'login',
    isProcessing: false
  };

  // DOM Elements
  const elements = {
    toggleBtns: document.querySelectorAll('.toggle-btn'),
    toggleIndicator: document.querySelector('.toggle-indicator'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    serviceKeyGroup: document.getElementById('serviceKeyGroup'),
    roleSelect: document.getElementById('registerRole'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    accessOverlay: document.getElementById('accessOverlay'),
    systemTime: document.getElementById('systemTime'),
    passwordToggles: document.querySelectorAll('.toggle-password')
  };

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    updateSystemTime();
    setInterval(updateSystemTime, 1000);
    setupEventListeners();
    checkExistingSession();
  }

  // ============================================
  // SYSTEM TIME UPDATE
  // ============================================

  function updateSystemTime() {
    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    elements.systemTime.textContent = timeString.replace(',', ' |');
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  function setupEventListeners() {
    // Toggle between Login and Register
    elements.toggleBtns.forEach(btn => {
      btn.addEventListener('click', handleToggle);
    });

    // Form Submissions
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);

    // Role Selection (show/hide service key)
    elements.roleSelect.addEventListener('change', handleRoleChange);

    // Password Toggle
    elements.passwordToggles.forEach(toggle => {
      toggle.addEventListener('click', handlePasswordToggle);
    });
  }

  // ============================================
  // TOGGLE FORMS
  // ============================================

  function handleToggle(e) {
    const mode = e.currentTarget.dataset.mode;

    if (mode === state.currentMode || state.isProcessing) return;

    state.currentMode = mode;

    // Update toggle buttons
    elements.toggleBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Move indicator
    if (mode === 'register') {
      elements.toggleIndicator.classList.add('register');
    } else {
      elements.toggleIndicator.classList.remove('register');
    }

    // Switch forms
    elements.loginForm.classList.toggle('active', mode === 'login');
    elements.registerForm.classList.toggle('active', mode === 'register');

    // Clear messages
    clearMessages();

    // Re-initialize Feather icons for new form
    feather.replace();
  }

  // ============================================
  // ROLE SELECTION
  // ============================================

  function handleRoleChange(e) {
    const role = e.target.value;

    if (role === 'agency') {
      elements.serviceKeyGroup.style.display = 'block';
      document.getElementById('serviceKey').required = true;
    } else {
      elements.serviceKeyGroup.style.display = 'none';
      document.getElementById('serviceKey').required = false;
      document.getElementById('serviceKey').value = '';
    }
  }

  // ============================================
  // PASSWORD TOGGLE
  // ============================================

  function handlePasswordToggle(e) {
    const targetId = e.currentTarget.dataset.target;
    const input = document.getElementById(targetId);
    const icon = e.currentTarget.querySelector('i');

    if (input.type === 'password') {
      input.type = 'text';
      icon.setAttribute('data-feather', 'eye-off');
    } else {
      input.type = 'password';
      icon.setAttribute('data-feather', 'eye');
    }

    feather.replace();
  }

  // ============================================
  // LOGIN HANDLER
  // ============================================

  async function handleLogin(e) {
    e.preventDefault();

    if (state.isProcessing) return;

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Clear previous messages
    clearMessages();

    // Show loading
    showLoading();
    state.isProcessing = true;

    // Simulate authentication delay
    await delay(2000);

    // Get stored users
    const users = getStoredUsers();

    // Check credentials (including default admin account)
    const user = users.find(u => u.email === email && u.password === password);
    const isAdmin = email === 'admin@diaps.com' && password === 'admin123';

    if (user || isAdmin) {
      // Success
      hideLoading();

      const userData = user || {
        name: 'System Administrator',
        email: 'admin@diaps.com',
        role: 'agency'
      };

      // Store current user session
      sessionStorage.setItem('diapsCurrentUser', JSON.stringify(userData));

      // Show success overlay
      showAccessGranted();

      // Redirect after delay
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    } else {
      // Failure
      hideLoading();
      state.isProcessing = false;
      showError('loginMessage', 'ACCESS DENIED - Invalid credentials');
      shakeForm(elements.loginForm);
    }
  }

  // ============================================
  // REGISTER HANDLER
  // ============================================

  async function handleRegister(e) {
    e.preventDefault();

    if (state.isProcessing) return;

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    // Clear previous messages
    clearMessages();

    // Validation
    if (!agreeTerms) {
      showError('registerMessage', 'You must agree to the terms and security protocols');
      return;
    }

    // Check for agency role service key
    if (role === 'agency') {
      const serviceKey = document.getElementById('serviceKey').value.trim();
      if (serviceKey !== 'DIAPS-ADMIN') {
        showError('registerMessage', 'Invalid service key for agency access');
        shakeForm(elements.registerForm);
        return;
      }
    }

    // Check if user already exists
    const users = getStoredUsers();
    if (users.some(u => u.email === email)) {
      showError('registerMessage', 'An account with this email already exists');
      return;
    }

    // Show loading
    showLoading();
    state.isProcessing = true;

    // Simulate registration delay
    await delay(2500);

    // Create user object
    const newUser = {
      name,
      email,
      password,
      role,
      createdAt: new Date().toISOString()
    };

    // Save to localStorage
    users.push(newUser);
    localStorage.setItem('diapsUsers', JSON.stringify(users));

    // Store current user session
    sessionStorage.setItem('diapsCurrentUser', JSON.stringify(newUser));

    // Hide loading
    hideLoading();

    // Show success overlay
    showAccessGranted();

    // Redirect after delay
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  }

  // ==== UTILITY FUNCTIONS ====
  function getStoredUsers() {
    const stored = localStorage.getItem('diapsUsers');
    return stored ? JSON.parse(stored) : [];
  }

  function showLoading() {
    elements.loadingSpinner.classList.add('active');
  }

  function hideLoading() {
    elements.loadingSpinner.classList.remove('active');
  }

  function showAccessGranted() {
    elements.accessOverlay.classList.add('active');
    feather.replace();
  }

  function showError(elementId, message) {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.classList.remove('success');
    messageEl.classList.add('error');
  }

  function showSuccess(elementId, message) {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.classList.remove('error');
    messageEl.classList.add('success');
  }

  function clearMessages() {
    const messages = document.querySelectorAll('.form-message');
    messages.forEach(msg => {
      msg.textContent = '';
      msg.classList.remove('error', 'success');
    });
  }

  function shakeForm(form) {
    form.classList.add('shake');
    setTimeout(() => {
      form.classList.remove('shake');
    }, 500);
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==== SESSION CHECK ====

  function checkExistingSession() {
    const currentUser = sessionStorage.getItem('diapsCurrentUser');

    // If user is already logged in, redirect to dashboard
    if (currentUser) {
      // Optional: Uncomment to auto-redirect logged-in users
      // window.location.href = 'index.html';
    }
  }

  // ============================================
  // INITIALIZE APP
  // ============================================

  init();
});

// ============================================
// CSS ANIMATION HELPER
// ============================================

const style = document.createElement('style');
style.textContent = `
    .shake {
        animation: shake 0.5s ease !important;
    }
`;
document.head.appendChild(style);