// js/auth.js
document.addEventListener('DOMContentLoaded', function () {
  checkUserState();
});

function checkUserState() {
  const userStr = localStorage.getItem('diapsUser');

  if (userStr) {
    const user = JSON.parse(userStr);
    updateUIForLoggedUser(user);
  }
}

function updateUIForLoggedUser(user) {
  // Find the "Create Account" button in the navigation
  const navLinks = document.querySelector('.home-cta a');
  const navContainer = document.querySelector('.main-nav ul');

  // Update Home CTA if it exists
  if (navLinks && navLinks.textContent.includes('Create Account')) {
    navLinks.textContent = `Welcome back, ${user.name.split(' ')[0]}`;
    navLinks.href = '#dashboard'; // Redirect to a dashboard view
  }

  // Add Logout button to nav
  if (navContainer) {
    // Check if logout already exists to avoid duplicates
    if (!document.getElementById('logoutBtn')) {
      const logoutLi = document.createElement('li');
      logoutLi.innerHTML = `<a href="#" id="logoutBtn" style="color: var(--danger);">Logout</a>`;
      navContainer.appendChild(logoutLi);

      document.getElementById('logoutBtn').addEventListener('click', function (e) {
        e.preventDefault();
        logout();
      });
    }
  }
}

function logout() {
  localStorage.removeItem('diapsUser');
  window.location.reload();
}