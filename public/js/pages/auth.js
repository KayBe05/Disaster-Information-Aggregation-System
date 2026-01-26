document.addEventListener('DOMContentLoaded', () => {
  feather.replace();

  // State
  const state = {
    currentTab: 'login',
    isProcessing: false
  };

  // DOM Elements
  const DOM = {
    tabButtons: document.querySelectorAll('.tab-button'),
    tabIndicator: document.querySelector('.tab-indicator'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    serviceKeyGroup: document.getElementById('serviceKeyGroup'),
    roleSelect: document.getElementById('registerRole'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    accessOverlay: document.getElementById('accessOverlay'),
    passwordToggles: document.querySelectorAll('.password-toggle'),
    switchLinks: document.querySelectorAll('[data-switch]')
  };

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    setupEventListeners();
    checkSession();
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  function setupEventListeners() {
    // Tab switching
    DOM.tabButtons.forEach(btn => {
      btn.addEventListener('click', handleTabClick);
    });

    // Form submissions
    DOM.loginForm.addEventListener('submit', handleLogin);
    DOM.registerForm.addEventListener('submit', handleRegister);

    // Role change
    DOM.roleSelect.addEventListener('change', handleRoleChange);

    // Password toggles
    DOM.passwordToggles.forEach(toggle => {
      toggle.addEventListener('click', handlePasswordToggle);
    });

    // Switch links
    DOM.switchLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = e.currentTarget.dataset.switch;
        switchTab(targetTab);
      });
    });
  }

  // ============================================
  // TAB MANAGEMENT
  // ============================================

  function handleTabClick(e) {
    const tab = e.currentTarget.dataset.tab;
    switchTab(tab);
  }

  function switchTab(tab) {
    if (tab === state.currentTab || state.isProcessing) return;

    state.currentTab = tab;

    // Update buttons
    DOM.tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Switch forms
    DOM.loginForm.classList.toggle('active', tab === 'login');
    DOM.registerForm.classList.toggle('active', tab === 'register');

    clearMessages();
    feather.replace();
  }

  // ============================================
  // ROLE MANAGEMENT
  // ============================================

  function handleRoleChange(e) {
    const role = e.target.value;
    const isAgency = role === 'agency';

    DOM.serviceKeyGroup.style.display = isAgency ? 'block' : 'none';
    document.getElementById('serviceKey').required = isAgency;

    if (!isAgency) {
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

    if (!input || !icon) return;

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    icon.setAttribute('data-feather', isPassword ? 'eye-off' : 'eye');

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

    if (!validateLoginForm(email, password)) return;

    clearMessages();
    showLoading();
    state.isProcessing = true;

    await delay(1500);

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    const isAdmin = email === 'admin@diaps.com' && password === 'admin123';

    if (user || isAdmin) {
      const userData = user || {
        name: 'System Administrator',
        email: 'admin@diaps.com',
        role: 'agency'
      };

      sessionStorage.setItem('diapsCurrentUser', JSON.stringify(userData));
      hideLoading();
      showSuccess();

      setTimeout(() => {
        window.location.href = 'admin.html';
      }, 2000);
    } else {
      hideLoading();
      state.isProcessing = false;
      showError('loginMessage', 'Invalid email or password. Please try again.');
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

    if (!validateRegisterForm(name, email, password, role, agreeTerms)) return;

    clearMessages();
    showLoading();
    state.isProcessing = true;

    await delay(2000);

    const users = getUsers();

    if (users.some(u => u.email === email)) {
      hideLoading();
      state.isProcessing = false;
      showError('registerMessage', 'An account with this email already exists.');
      return;
    }

    const newUser = {
      name,
      email,
      password,
      role,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('diapsUsers', JSON.stringify(users));
    sessionStorage.setItem('diapsCurrentUser', JSON.stringify(newUser));

    hideLoading();
    showSuccess();

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  }

  // ============================================
  // VALIDATION
  // ============================================

  function validateLoginForm(email, password) {
    if (!email || !password) {
      showError('loginMessage', 'Please fill in all fields.');
      return false;
    }

    if (!isValidEmail(email)) {
      showError('loginMessage', 'Please enter a valid email address.');
      return false;
    }

    return true;
  }

  function validateRegisterForm(name, email, password, role, agreeTerms) {
    if (!name || !email || !password || !role) {
      showError('registerMessage', 'Please fill in all fields.');
      return false;
    }

    if (!isValidEmail(email)) {
      showError('registerMessage', 'Please enter a valid email address.');
      return false;
    }

    if (password.length < 8) {
      showError('registerMessage', 'Password must be at least 8 characters long.');
      return false;
    }

    if (!agreeTerms) {
      showError('registerMessage', 'You must agree to the terms and privacy policy.');
      return false;
    }

    if (role === 'agency') {
      const serviceKey = document.getElementById('serviceKey').value.trim();
      if (serviceKey !== 'DIAPS-ADMIN') {
        showError('registerMessage', 'Invalid agency verification key.');
        return false;
      }
    }

    return true;
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ============================================
  // UI MANAGEMENT
  // ============================================

  function showLoading() {
    DOM.loadingSpinner.classList.add('active');
  }

  function hideLoading() {
    DOM.loadingSpinner.classList.remove('active');
  }

  function showSuccess() {
    DOM.accessOverlay.classList.add('active');
    feather.replace();
  }

  function showError(elementId, message) {
    const messageEl = document.getElementById(elementId);
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.classList.remove('success');
      messageEl.classList.add('error');
    }
  }

  function clearMessages() {
    const messages = document.querySelectorAll('.form-message');
    messages.forEach(msg => {
      msg.textContent = '';
      msg.classList.remove('error', 'success');
    });
  }

  // ============================================
  // UTILITIES
  // ============================================

  function getUsers() {
    const stored = localStorage.getItem('diapsUsers');
    return stored ? JSON.parse(stored) : [];
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function checkSession() {
    const currentUser = sessionStorage.getItem('diapsCurrentUser');
    // Optional: Auto-redirect if already logged in
    // if (currentUser) {
    //   window.location.href = 'index.html';
    // }
  }

  init();
});