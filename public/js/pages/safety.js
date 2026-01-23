// ====== SAFETY PAGE JAVASCRIPT ======

const SafetyPage = {
  currentTab: 'emergency-kit',
  checklistState: {},

  init() {
    console.log('🛡️ Safety Page Initializing...');

    this.initTabNavigation();
    this.initChecklistPersistence();
    this.initHeaderScroll();
    this.initAccordions();
    this.initEmergencyNumbers();

    console.log('✓ Safety Page Ready');
  },

  // Tab Navigation System
  initTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        this.switchTab(targetTab, tabButtons, tabContents);
      });
    });
  },

  switchTab(targetTab, tabButtons, tabContents) {
    // Remove active class from all tabs
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Add active class to selected tab
    const activeButton = document.querySelector(`[data-tab="${targetTab}"]`);
    const activeContent = document.getElementById(targetTab);

    if (activeButton && activeContent) {
      activeButton.classList.add('active');
      activeContent.classList.add('active');
      this.currentTab = targetTab;

      // Smooth scroll to content (optional)
      activeContent.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });

      console.log(`📑 Switched to tab: ${targetTab}`);
    }
  },

  // Checklist Persistence with localStorage
  initChecklistPersistence() {
    // Load saved state from localStorage
    this.loadChecklistState();

    // Bind checkbox change events
    const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        this.handleCheckboxChange(e.target);
      });
    });

    console.log('✓ Checklist persistence initialized');
  },

  loadChecklistState() {
    try {
      const savedState = localStorage.getItem('diaps_checklist_state');

      if (savedState) {
        this.checklistState = JSON.parse(savedState);

        // Apply saved state to checkboxes
        Object.keys(this.checklistState).forEach(itemKey => {
          const checkbox = document.querySelector(`input[data-item="${itemKey}"]`);
          if (checkbox) {
            checkbox.checked = this.checklistState[itemKey];
          }
        });

        console.log('✓ Loaded checklist state:', Object.keys(this.checklistState).length, 'items');
      }
    } catch (error) {
      console.error('Error loading checklist state:', error);
    }
  },

  handleCheckboxChange(checkbox) {
    const itemKey = checkbox.getAttribute('data-item');
    const isChecked = checkbox.checked;

    // Update state
    this.checklistState[itemKey] = isChecked;

    // Save to localStorage
    this.saveChecklistState();

    // Visual feedback
    const checklistItem = checkbox.closest('.checklist-item');
    if (checklistItem) {
      if (isChecked) {
        checklistItem.style.transform = 'scale(0.98)';
        setTimeout(() => {
          checklistItem.style.transform = 'scale(1)';
        }, 150);
      }
    }

    console.log(`${isChecked ? '✓' : '○'} ${itemKey}`);
    this.updateProgress();
  },

  saveChecklistState() {
    try {
      localStorage.setItem('diaps_checklist_state', JSON.stringify(this.checklistState));
    } catch (error) {
      console.error('Error saving checklist state:', error);
    }
  },

  updateProgress() {
    const totalItems = document.querySelectorAll('.checklist-item input[type="checkbox"]').length;
    const checkedItems = Object.values(this.checklistState).filter(Boolean).length;
    const percentage = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    console.log(`📊 Progress: ${checkedItems}/${totalItems} items (${percentage}%)`);

    // You can display this progress in the UI if needed
    if (percentage === 100) {
      this.showNotification('🎉 Emergency kit complete! You\'re prepared.', 'success');
    }
  },

  // Header Scroll Effect
  initHeaderScroll() {
    const header = document.querySelector('.main-header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      // Auto-hide on scroll down
      if (currentScroll > lastScroll && currentScroll > 500) {
        header.style.transform = 'translateY(-100%)';
      } else {
        header.style.transform = 'translateY(0)';
      }

      lastScroll = currentScroll;
    });
  },

  // Accordion Auto-behavior
  initAccordions() {
    const accordions = document.querySelectorAll('.phase-accordion');

    accordions.forEach(accordion => {
      accordion.addEventListener('toggle', (e) => {
        if (e.target.open) {
          console.log('📂 Opened:', accordion.querySelector('.phase-title').textContent);
        }
      });
    });
  },

  // Emergency Numbers Click Tracking
  initEmergencyNumbers() {
    const emergencyNumbers = document.querySelectorAll('.emergency-number');

    emergencyNumbers.forEach(number => {
      number.addEventListener('click', (e) => {
        const phoneNumber = e.target.textContent;
        console.log(`📞 Emergency call initiated: ${phoneNumber}`);

        // Optional: Show confirmation
        this.showNotification(`Calling ${phoneNumber}...`, 'info');
      });
    });
  },

  // Notification System
  showNotification(message, type = 'info') {
    const colors = {
      success: { bg: '#00D9A3', border: '#00D9A3' },
      error: { bg: '#FF6B6B', border: '#FF6B6B' },
      warning: { bg: '#FF8C42', border: '#FF8C42' },
      info: { bg: '#4A9EFF', border: '#4A9EFF' }
    };

    const color = colors[type] || colors.info;

    const notification = document.createElement('div');
    notification.className = 'safety-notification';
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 24px;
      background: rgba(0, 3, 40, 0.95);
      backdrop-filter: blur(20px);
      color: ${color.bg};
      padding: 16px 24px;
      border: 2px solid ${color.border};
      border-radius: 12px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      animation: slideInRight 0.3s ease;
      max-width: 320px;
      cursor: pointer;
    `;
    notification.textContent = message;

    notification.addEventListener('click', () => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    });

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  },

  // Reset Checklist (Utility Function)
  resetChecklist() {
    if (confirm('⚠️ Are you sure you want to reset your emergency kit checklist?')) {
      this.checklistState = {};
      localStorage.removeItem('diaps_checklist_state');

      // Uncheck all boxes
      const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
      checkboxes.forEach(cb => cb.checked = false);

      this.showNotification('🔄 Checklist reset successfully', 'info');
      console.log('🔄 Checklist reset');
    }
  },

  // Export Checklist as Text (Utility Function)
  exportChecklist() {
    const checkedItems = [];
    const uncheckedItems = [];

    document.querySelectorAll('.checklist-item').forEach(item => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      const text = item.querySelector('.item-text').textContent;

      if (checkbox.checked) {
        checkedItems.push(`✓ ${text}`);
      } else {
        uncheckedItems.push(`○ ${text}`);
      }
    });

    const exportText = `
DIAPS Emergency Kit Checklist
Generated: ${new Date().toLocaleDateString()}

COMPLETED (${checkedItems.length}):
${checkedItems.join('\n')}

REMAINING (${uncheckedItems.length}):
${uncheckedItems.join('\n')}
    `.trim();

    // Copy to clipboard
    navigator.clipboard.writeText(exportText).then(() => {
      this.showNotification('📋 Checklist copied to clipboard', 'success');
      console.log('📋 Checklist exported');
    }).catch(err => {
      console.error('Failed to copy:', err);
      this.showNotification('❌ Failed to copy checklist', 'error');
    });
  }
};

// Animation Styles for Notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  SafetyPage.init();

  // Show welcome notification
  setTimeout(() => {
    SafetyPage.showNotification('📖 Welcome to the Safety Guide', 'info');
  }, 500);
});

// Expose API for debugging and external access
if (typeof window !== 'undefined') {
  window.SafetyPage = SafetyPage;

  console.log('%c🛡️ DIAPS Safety Module Loaded', 'font-size: 14px; font-weight: bold; color: #00D9A3;');
  console.log('%cAvailable commands:', 'font-size: 11px; color: #4A9EFF;');
  console.log('  SafetyPage.resetChecklist() - Reset all checkboxes');
  console.log('  SafetyPage.exportChecklist() - Export checklist to clipboard');
  console.log('  SafetyPage.currentTab - View current active tab');
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  // Alt + R = Reset checklist
  if (e.altKey && e.key === 'r') {
    e.preventDefault();
    SafetyPage.resetChecklist();
  }

  // Alt + E = Export checklist
  if (e.altKey && e.key === 'e') {
    e.preventDefault();
    SafetyPage.exportChecklist();
  }

  // Alt + P = Print/Download
  if (e.altKey && e.key === 'p') {
    e.preventDefault();
    window.print();
  }

  // Arrow keys to navigate tabs
  if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();

    const tabs = ['emergency-kit', 'earthquake', 'flood', 'wildfire', 'hurricane'];
    const currentIndex = tabs.indexOf(SafetyPage.currentTab);

    let newIndex;
    if (e.key === 'ArrowRight') {
      newIndex = (currentIndex + 1) % tabs.length;
    } else {
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }

    const newTab = tabs[newIndex];
    const tabButton = document.querySelector(`[data-tab="${newTab}"]`);
    if (tabButton) {
      tabButton.click();
    }
  }
});

// Prevent data loss warning when leaving with unsaved progress
window.addEventListener('beforeunload', (e) => {
  const hasProgress = Object.keys(SafetyPage.checklistState).length > 0;

  if (hasProgress) {
    // Data is automatically saved, but we show a courtesy message
    const message = 'Your checklist progress is saved automatically.';
    console.log(message);
    // Modern browsers ignore custom messages, but we set it anyway
    e.returnValue = message;
    return message;
  }
});

// Service Worker for Offline Support (Optional Enhancement)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Uncomment to enable offline caching
    // navigator.serviceWorker.register('/sw.js')
    //   .then(reg => console.log('✓ Service Worker registered for offline support'))
    //   .catch(err => console.log('Service Worker registration failed:', err));
  });
}