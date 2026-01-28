// ====================================
// ADMIN DASHBOARD - JAVASCRIPT
// Modern, Professional Implementation
// ====================================

// ====== APPLICATION STATE ======
const AdminState = {
  reports: [],
  filteredReports: [],
  currentFilter: 'all',
  currentSort: 'time-desc',
  maps: new Map(),
  sidebarOpen: true,
  stats: {
    pending: 0,
    verified: 47,
    hazards: 8,
    responseTime: '4.2m'
  }
};

// ====== SIDEBAR TOGGLE ======
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  const overlay = document.getElementById('sidebar-overlay');

  if (!sidebar || !mainContent) return;

  const isMobile = window.innerWidth <= 1024;

  if (isMobile) {
    // Mobile: toggle with overlay
    sidebar.classList.toggle('active');
    if (overlay) {
      overlay.classList.toggle('active');
    }
    AdminState.sidebarOpen = sidebar.classList.contains('active');
  } else {
    // Desktop: hide/show sidebar
    sidebar.classList.toggle('hidden');
    mainContent.classList.toggle('expanded');
    AdminState.sidebarOpen = !sidebar.classList.contains('hidden');
  }

  // Refresh maps after transition
  setTimeout(() => {
    AdminState.maps.forEach((map) => {
      try {
        map.invalidateSize();
      } catch (error) {
        console.error('Map invalidation error:', error);
      }
    });
  }, 300);

  console.log(`Sidebar ${AdminState.sidebarOpen ? 'opened' : 'closed'}`);
}

// Handle responsive behavior
function handleResize() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  const overlay = document.getElementById('sidebar-overlay');

  if (!sidebar || !mainContent) return;

  const isMobile = window.innerWidth <= 1024;

  if (isMobile) {
    sidebar.classList.remove('hidden', 'active');
    mainContent.classList.remove('expanded');
    if (overlay) overlay.classList.remove('active');
  } else {
    sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');

    if (!AdminState.sidebarOpen) {
      sidebar.classList.add('hidden');
      mainContent.classList.add('expanded');
    }
  }
}

// Debounced resize handler
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(handleResize, 250);
});

// ====== MOCK DATA ======
const MOCK_REPORTS = [
  {
    id: 'CR_001',
    type: 'flood',
    severity: 'critical',
    location: 'Jakarta, Indonesia',
    lat: -6.2088,
    lng: 106.8456,
    description: 'Severe flooding in residential area. Water level approximately 2 meters. Multiple families stranded on rooftops.',
    evidence: 'Photo evidence available',
    evidenceType: 'image',
    reporter: 'Citizen #4829',
    timeAgo: '8 mins ago',
    timestamp: Date.now() - 8 * 60 * 1000
  },
  {
    id: 'CR_002',
    type: 'fire',
    severity: 'high',
    location: 'Los Angeles, California',
    lat: 34.0522,
    lng: -118.2437,
    description: 'Wildfire spreading rapidly in hillside area. Strong winds making containment difficult. Evacuation recommended.',
    evidence: 'Smoke visible from Highway 101',
    evidenceType: 'text',
    reporter: 'Citizen #7651',
    timeAgo: '15 mins ago',
    timestamp: Date.now() - 15 * 60 * 1000
  },
  {
    id: 'CR_003',
    type: 'other',
    severity: 'medium',
    location: 'New Delhi, India',
    lat: 28.6139,
    lng: 77.2090,
    description: 'Major road blockage on NH-44 due to overturned truck. Traffic backed up for several kilometers. Emergency vehicles unable to pass.',
    evidence: 'Photo shows truck blocking 3 lanes',
    evidenceType: 'image',
    reporter: 'Citizen #3214',
    timeAgo: '22 mins ago',
    timestamp: Date.now() - 22 * 60 * 1000
  },
  {
    id: 'CR_004',
    type: 'earthquake',
    severity: 'high',
    location: 'Tokyo, Japan',
    lat: 35.6762,
    lng: 139.6503,
    description: 'Strong tremors felt in downtown area. Several buildings showing structural damage. Aftershocks continuing.',
    evidence: 'Building damage photos available',
    evidenceType: 'image',
    reporter: 'Citizen #9182',
    timeAgo: '35 mins ago',
    timestamp: Date.now() - 35 * 60 * 1000
  },
  {
    id: 'CR_005',
    type: 'flood',
    severity: 'medium',
    location: 'Houston, Texas',
    lat: 29.7604,
    lng: -95.3698,
    description: 'Flash flooding on Interstate 45. Multiple vehicles stranded. Water rising rapidly due to storm system.',
    evidence: 'Video of flooded highway',
    evidenceType: 'video',
    reporter: 'Citizen #5537',
    timeAgo: '42 mins ago',
    timestamp: Date.now() - 42 * 60 * 1000
  },
  {
    id: 'CR_006',
    type: 'fire',
    severity: 'low',
    location: 'Sydney, Australia',
    lat: -33.8688,
    lng: 151.2093,
    description: 'Small bushfire detected near residential area. Fire crews responding. No immediate threat to structures.',
    evidence: 'Smoke plume visible',
    evidenceType: 'text',
    reporter: 'Citizen #2891',
    timeAgo: '1 hour ago',
    timestamp: Date.now() - 60 * 60 * 1000
  }
];

// ====== UTILITY FUNCTIONS ======
const Utils = {
  getTypeIcon(type) {
    const icons = {
      earthquake: 'fa-house-damage',
      flood: 'fa-water',
      fire: 'fa-fire',
      other: 'fa-exclamation-circle'
    };
    return icons[type] || 'fa-exclamation-circle';
  },

  formatType(type) {
    return type.charAt(0).toUpperCase() + type.slice(1);
  },

  formatCoordinates(lat, lng) {
    return `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;
  },

  showNotification(message, type = 'info') {
    const colors = {
      success: '#21A179',
      error: '#FF6B6B',
      warning: '#FF8C42',
      info: '#00458E'
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: rgba(0, 3, 40, 0.98);
      backdrop-filter: blur(20px);
      color: ${colors[type] || colors.info};
      padding: 18px 24px;
      border: 2px solid ${colors[type] || colors.info};
      border-radius: 12px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
      animation: slideInRight 0.3s ease;
      cursor: pointer;
      max-width: 400px;
      letter-spacing: 0.3px;
    `;
    notification.textContent = message;

    notification.addEventListener('click', () => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    });

    document.body.appendChild(notification);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }
    }, 4000);
  },

  updateLastUpdateTime() {
    const element = document.getElementById('last-update-time');
    if (element) {
      element.textContent = 'Just now';
    }
  }
};

// ====== REPORT RENDERING ======
const ReportRenderer = {
  renderReports(reports) {
    const grid = document.getElementById('reports-grid');
    const emptyState = document.getElementById('empty-state');

    if (!grid) return;

    if (reports.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    grid.innerHTML = '';

    reports.forEach((report, index) => {
      setTimeout(() => {
        const card = this.createReportCard(report);
        grid.appendChild(card);

        // Initialize map
        setTimeout(() => this.initializeMap(report), 100);
      }, index * 50);
    });
  },

  createReportCard(report) {
    const card = document.createElement('div');
    card.className = 'report-card';
    card.setAttribute('data-report-id', report.id);

    card.innerHTML = `
      <div class="report-card-header">
        <div class="report-type-info">
          <div class="report-type-icon ${report.type}">
            <i class="fas ${Utils.getTypeIcon(report.type)}"></i>
          </div>
          <div class="report-type-details">
            <h3 class="report-type-name">${Utils.formatType(report.type)}</h3>
            <span class="report-severity ${report.severity}">${report.severity}</span>
          </div>
        </div>
      </div>

      <div class="report-meta">
        <div class="meta-item">
          <i class="fas fa-user"></i>
          <span>${report.reporter}</span>
        </div>
        <div class="meta-item">
          <i class="fas fa-clock"></i>
          <span>${report.timeAgo}</span>
        </div>
      </div>

      <div class="report-card-body">
        <div class="report-location">
          <i class="fas fa-map-marker-alt"></i>
          <span>${report.location}</span>
        </div>

        <p class="report-description">${report.description}</p>

        <div class="report-evidence">
          <div class="evidence-label">Evidence</div>
          ${report.evidenceType === 'image'
        ? `<div class="evidence-content">
                <i class="fas fa-image"></i>
              </div>`
        : ''}
          <p class="evidence-text">${report.evidence}</p>
        </div>

        <div class="map-container">
          <div class="map-preview" id="map-${report.id}"></div>
        </div>

        <div class="report-actions">
          <button class="action-button verify-button" onclick="verifyReport('${report.id}')">
            <i class="fas fa-check"></i>
            <span>Verify</span>
          </button>
          <button class="action-button reject-button" onclick="rejectReport('${report.id}')">
            <i class="fas fa-times"></i>
            <span>Reject</span>
          </button>
        </div>
      </div>
    `;

    return card;
  },

  initializeMap(report) {
    const mapContainer = document.getElementById(`map-${report.id}`);
    if (!mapContainer || AdminState.maps.has(report.id)) return;

    try {
      const map = L.map(`map-${report.id}`, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false
      }).setView([report.lat, report.lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      const markerIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #21A179 0%, #1a8060 100%);
          border: 3px solid #FFEAD0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(33, 161, 121, 0.4);
        ">
          <i class="fas ${Utils.getTypeIcon(report.type)}"></i>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker([report.lat, report.lng], { icon: markerIcon }).addTo(map);

      AdminState.maps.set(report.id, map);
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  }
};

// ====== REPORT ACTIONS ======
function verifyReport(reportId) {
  console.log(`✓ Verifying report: ${reportId}`);

  const card = document.querySelector(`[data-report-id="${reportId}"]`);
  if (!card) return;

  card.classList.add('verified');

  // Update stats
  AdminState.stats.pending = Math.max(0, AdminState.stats.pending - 1);
  AdminState.stats.verified++;
  updateStatsDisplay();

  Utils.showNotification(`✓ Report ${reportId} verified successfully`, 'success');

  // Clean up after animation
  setTimeout(() => {
    const map = AdminState.maps.get(reportId);
    if (map) {
      map.remove();
      AdminState.maps.delete(reportId);
    }

    AdminState.reports = AdminState.reports.filter(r => r.id !== reportId);
    AdminState.filteredReports = AdminState.filteredReports.filter(r => r.id !== reportId);

    card.remove();
    updatePendingBadge();

    if (AdminState.filteredReports.length === 0) {
      const emptyState = document.getElementById('empty-state');
      if (emptyState) emptyState.style.display = 'block';
    }
  }, 500);
}

function rejectReport(reportId) {
  console.log(`✗ Rejecting report: ${reportId}`);

  const card = document.querySelector(`[data-report-id="${reportId}"]`);
  if (!card) return;

  card.classList.add('rejected');

  // Update stats
  AdminState.stats.pending = Math.max(0, AdminState.stats.pending - 1);
  updateStatsDisplay();

  Utils.showNotification(`✗ Report ${reportId} rejected`, 'warning');

  // Clean up after animation
  setTimeout(() => {
    const map = AdminState.maps.get(reportId);
    if (map) {
      map.remove();
      AdminState.maps.delete(reportId);
    }

    AdminState.reports = AdminState.reports.filter(r => r.id !== reportId);
    AdminState.filteredReports = AdminState.filteredReports.filter(r => r.id !== reportId);

    card.remove();
    updatePendingBadge();

    if (AdminState.filteredReports.length === 0) {
      const emptyState = document.getElementById('empty-state');
      if (emptyState) emptyState.style.display = 'block';
    }
  }, 500);
}

// ====== FILTERING & SORTING ======
const FilterModule = {
  applyFilter(filterType) {
    AdminState.currentFilter = filterType;

    if (filterType === 'all') {
      AdminState.filteredReports = [...AdminState.reports];
    } else {
      AdminState.filteredReports = AdminState.reports.filter(r => r.type === filterType);
    }

    this.applySorting();
    ReportRenderer.renderReports(AdminState.filteredReports);

    // Update filter UI
    document.querySelectorAll('.filter-chip').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filterType}"]`)?.classList.add('active');

    Utils.showNotification(
      `Filter: ${filterType === 'all' ? 'All Reports' : Utils.formatType(filterType)}`,
      'info'
    );
  },

  applySorting() {
    const sortType = AdminState.currentSort;

    switch (sortType) {
      case 'time-desc':
        AdminState.filteredReports.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'time-asc':
        AdminState.filteredReports.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case 'severity':
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        AdminState.filteredReports.sort((a, b) =>
          severityOrder[a.severity] - severityOrder[b.severity]
        );
        break;
    }
  },

  changeSorting(sortType) {
    AdminState.currentSort = sortType;
    this.applySorting();
    ReportRenderer.renderReports(AdminState.filteredReports);
    Utils.showNotification(`Sorted: ${sortType.replace('-', ' ')}`, 'info');
  }
};

// ====== STATS MANAGEMENT ======
function updateStatsDisplay() {
  const pendingEl = document.getElementById('stat-pending');
  const verifiedEl = document.getElementById('stat-verified');

  if (pendingEl) pendingEl.textContent = AdminState.stats.pending;
  if (verifiedEl) verifiedEl.textContent = AdminState.stats.verified;
}

function updatePendingBadge() {
  const badge = document.getElementById('pending-count');
  if (badge) {
    badge.textContent = AdminState.stats.pending;
  }
}

// ====== GLOBAL ACTIONS ======
function refreshReports() {
  console.log('🔄 Refreshing reports...');

  const btn = document.querySelector('.refresh-btn i');
  if (btn) {
    btn.style.animation = 'spin 1s linear';
    setTimeout(() => {
      btn.style.animation = '';
    }, 1000);
  }

  Utils.updateLastUpdateTime();
  Utils.showNotification('📡 Reports refreshed successfully', 'info');
}

function logout() {
  console.log('👋 Logging out...');
  Utils.showNotification('Logged out successfully', 'success');

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// ====== NAVIGATION ======
function initializeNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      navLinks.forEach(nav => nav.classList.remove('active'));
      link.classList.add('active');

      const view = link.dataset.view;
      console.log(`Navigating to: ${view}`);

      if (view !== 'inbox') {
        Utils.showNotification(
          `${view.charAt(0).toUpperCase() + view.slice(1)} - Coming Soon`,
          'info'
        );
      }
    });
  });
}

// ====== MODAL MANAGEMENT ======
function closeModal() {
  const modal = document.getElementById('report-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c🛡️ DIAS COMMAND CENTER', 'font-size: 18px; font-weight: bold; color: #21A179;');
  console.log('%cInitializing dashboard...', 'font-size: 12px; color: #00458E;');

  try {
    // Load data
    AdminState.reports = [...MOCK_REPORTS];
    AdminState.filteredReports = [...MOCK_REPORTS];
    AdminState.stats.pending = MOCK_REPORTS.length;

    // Update UI
    updateStatsDisplay();
    updatePendingBadge();
    ReportRenderer.renderReports(AdminState.filteredReports);

    // Initialize filters
    document.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        FilterModule.applyFilter(btn.dataset.filter);
      });
    });

    // Initialize sorting
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        FilterModule.changeSorting(e.target.value);
      });
    }

    // Initialize navigation
    initializeNavigation();

    // Initialize responsive behavior
    handleResize();

    console.log('%c✓ Dashboard initialized', 'font-size: 11px; color: #21A179;');
    console.log(`%cPending Reports: ${AdminState.stats.pending}`, 'font-size: 11px; color: #21A179;');

    // Welcome notification
    setTimeout(() => {
      Utils.showNotification('🛡️ DIAS Command Center Active', 'success');
    }, 500);

  } catch (error) {
    console.error('Initialization error:', error);
    Utils.showNotification('System initialization failed', 'error');
  }
});

// ====== ADD ANIMATIONS ======
const animationStyles = document.createElement('style');
animationStyles.textContent = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(50px);
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
document.head.appendChild(animationStyles);

// ====== API FOR DEBUGGING ======
window.ADMIN_API = {
  state: AdminState,
  verify: verifyReport,
  reject: rejectReport,
  filter: FilterModule,
  utils: Utils,
  toggleSidebar: toggleSidebar
};