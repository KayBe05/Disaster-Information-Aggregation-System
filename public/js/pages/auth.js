class AuthSystem {
  constructor() {
    this.state = {
      currentTab: 'login',
      isProcessing: false
    };

    this.DOM = {
      tabButtons: document.querySelectorAll('.tab-btn'),
      tabIndicator: document.querySelector('.tab-indicator'),
      loginForm: document.getElementById('loginForm'),
      registerForm: document.getElementById('registerForm'),
      serviceKeyGroup: document.getElementById('serviceKeyGroup'),
      roleSelect: document.getElementById('registerRole'),
      loadingSpinner: document.getElementById('loadingSpinner'),
      accessOverlay: document.getElementById('accessOverlay'),
      passwordToggles: document.querySelectorAll('.toggle-password'),
      switchLinks: document.querySelectorAll('[data-switch]')
    };

    this.init();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  init() {
    this.setupEventListeners();
    this.initializeFeatherIcons();
    this.checkExistingSession();
  }

  initializeFeatherIcons() {
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  setupEventListeners() {
    // Tab switching
    this.DOM.tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleTabSwitch(e));
    });

    // Form submissions
    this.DOM.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    this.DOM.registerForm.addEventListener('submit', (e) => this.handleRegister(e));

    // Role change for agency verification
    this.DOM.roleSelect.addEventListener('change', (e) => this.handleRoleChange(e));

    // Password visibility toggles
    this.DOM.passwordToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => this.togglePasswordVisibility(e));
    });

    // Switch between forms via links
    this.DOM.switchLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = e.currentTarget.dataset.switch;
        this.switchToTab(targetTab);
      });
    });
  }

  // ============================================
  // TAB MANAGEMENT
  // ============================================

  handleTabSwitch(e) {
    const tab = e.currentTarget.dataset.tab;
    this.switchToTab(tab);
  }

  switchToTab(tab) {
    if (tab === this.state.currentTab || this.state.isProcessing) return;

    this.state.currentTab = tab;

    // Update button states
    this.DOM.tabButtons.forEach(btn => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive);
    });

    // Switch form visibility
    this.DOM.loginForm.classList.toggle('active', tab === 'login');
    this.DOM.registerForm.classList.toggle('active', tab === 'register');

    // Clear any messages
    this.clearMessages();
    this.initializeFeatherIcons();
  }

  // ============================================
  // ROLE MANAGEMENT
  // ============================================

  handleRoleChange(e) {
    const role = e.target.value;
    const isAgency = role === 'agency';

    // Show/hide service key field based on role
    this.DOM.serviceKeyGroup.style.display = isAgency ? 'block' : 'none';

    const serviceKeyInput = document.getElementById('serviceKey');
    serviceKeyInput.required = isAgency;

    if (!isAgency) {
      serviceKeyInput.value = '';
    }
  }

  // ============================================
  // PASSWORD VISIBILITY
  // ============================================

  togglePasswordVisibility(e) {
    const targetId = e.currentTarget.dataset.target;
    const input = document.getElementById(targetId);
    const icon = e.currentTarget.querySelector('i');

    if (!input || !icon) return;

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    icon.setAttribute('data-feather', isPassword ? 'eye-off' : 'eye');

    this.initializeFeatherIcons();
  }

  // ============================================
  // LOGIN HANDLER
  // ============================================

  async handleLogin(e) {
    e.preventDefault();

    if (this.state.isProcessing) return;

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Validate form
    if (!this.validateLoginForm(email, password)) return;

    // Start processing
    this.clearMessages();
    this.showLoading();
    this.state.isProcessing = true;

    // Simulate API delay
    await this.delay(1500);

    // Check credentials
    const users = this.getStoredUsers();
    const user = users.find(u => u.email === email && u.password === password);
    const isAdmin = email === 'admin@diaps.com' && password === 'admin123';

    if (user || isAdmin) {
      const userData = user || {
        name: 'System Administrator',
        email: 'admin@diaps.com',
        role: 'agency'
      };

      // Store session
      this.storeSession(userData);

      // Show success
      this.hideLoading();
      this.showSuccess();

      // Redirect
      setTimeout(() => {
        window.location.href = 'admin.html';
      }, 2000);
    } else {
      // Authentication failed
      this.hideLoading();
      this.state.isProcessing = false;
      this.showError('loginMessage', 'Invalid email or password. Please try again.');
    }
  }

  // ============================================
  // REGISTER HANDLER
  // ============================================

  async handleRegister(e) {
    e.preventDefault();

    if (this.state.isProcessing) return;

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    // Validate form
    if (!this.validateRegisterForm(name, email, password, role, agreeTerms)) return;

    // Start processing
    this.clearMessages();
    this.showLoading();
    this.state.isProcessing = true;

    // Simulate API delay
    await this.delay(2000);

    // Check if user exists
    const users = this.getStoredUsers();

    if (users.some(u => u.email === email)) {
      this.hideLoading();
      this.state.isProcessing = false;
      this.showError('registerMessage', 'An account with this email already exists.');
      return;
    }

    // Create new user
    const newUser = {
      name,
      email,
      password,
      role,
      createdAt: new Date().toISOString()
    };

    // Store user
    users.push(newUser);
    this.storeUsers(users);
    this.storeSession(newUser);

    // Show success
    this.hideLoading();
    this.showSuccess();

    // Redirect
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  }

  // ============================================
  // VALIDATION
  // ============================================

  validateLoginForm(email, password) {
    if (!email || !password) {
      this.showError('loginMessage', 'Please fill in all fields.');
      return false;
    }

    if (!this.isValidEmail(email)) {
      this.showError('loginMessage', 'Please enter a valid email address.');
      return false;
    }

    return true;
  }

  validateRegisterForm(name, email, password, role, agreeTerms) {
    if (!name || !email || !password || !role) {
      this.showError('registerMessage', 'Please fill in all fields.');
      return false;
    }

    if (!this.isValidEmail(email)) {
      this.showError('registerMessage', 'Please enter a valid email address.');
      return false;
    }

    if (password.length < 8) {
      this.showError('registerMessage', 'Password must be at least 8 characters long.');
      return false;
    }

    if (!agreeTerms) {
      this.showError('registerMessage', 'You must agree to the terms and privacy policy.');
      return false;
    }

    // Validate agency key if agency role
    if (role === 'agency') {
      const serviceKey = document.getElementById('serviceKey').value.trim();
      if (serviceKey !== 'DIAPS-ADMIN') {
        this.showError('registerMessage', 'Invalid agency verification key.');
        return false;
      }
    }

    return true;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ============================================
  // UI MANAGEMENT
  // ============================================

  showLoading() {
    this.DOM.loadingSpinner.classList.add('active');
  }

  hideLoading() {
    this.DOM.loadingSpinner.classList.remove('active');
  }

  showSuccess() {
    this.DOM.accessOverlay.classList.add('active');
    this.initializeFeatherIcons();
  }

  showError(elementId, message) {
    const messageEl = document.getElementById(elementId);
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.classList.remove('success');
      messageEl.classList.add('error');
    }
  }

  clearMessages() {
    const messages = document.querySelectorAll('.form-message');
    messages.forEach(msg => {
      msg.textContent = '';
      msg.classList.remove('error', 'success');
    });
  }

  // ============================================
  // STORAGE UTILITIES
  // ============================================

  getStoredUsers() {
    try {
      const stored = localStorage.getItem('diapsUsers');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading users from storage:', error);
      return [];
    }
  }

  storeUsers(users) {
    try {
      localStorage.setItem('diapsUsers', JSON.stringify(users));
    } catch (error) {
      console.error('Error storing users:', error);
    }
  }

  storeSession(userData) {
    try {
      sessionStorage.setItem('diapsCurrentUser', JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  checkExistingSession() {
    try {
      const currentUser = sessionStorage.getItem('diapsCurrentUser');
      // Optional: Auto-redirect if already logged in
      // if (currentUser) {
      //   window.location.href = 'index.html';
      // }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  }

  // HELPER UTILITIES

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// INITIALIZE ON DOM READY

document.addEventListener('DOMContentLoaded', () => {
  new AuthSystem();
});