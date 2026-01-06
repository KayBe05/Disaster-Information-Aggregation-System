// ====== AUTHENTICATION CHECK ======
/*
(function checkAuth() {
  if (!localStorage.getItem('isAdmin')) {
    console.warn('Unauthorized access attempt - redirecting to home');
    window.location.href = 'index.html';
    return;
  }
  console.log('%c🛡️ COMMAND ACCESS GRANTED', 'font-size: 14px; font-weight: bold; color: #00D9A3;');
})();
*/

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
  const sidebar = document.getElementById('admin-sidebar');
  const mainContent = document.getElementById('admin-main');
  const overlay = document.getElementById('sidebar-overlay');

  if (!sidebar || !mainContent) return;

  const isMobile = window.innerWidth <= 1024;

  if (isMobile) {
    // Mobile behavior: toggle sidebar visibility with overlay
    sidebar.classList.toggle('active');
    if (overlay) {
      overlay.classList.toggle('active');
    }
    AdminState.sidebarOpen = sidebar.classList.contains('active');
  } else {
    // Desktop behavior: hide/show sidebar and expand main content
    sidebar.classList.toggle('hidden');
    mainContent.classList.toggle('expanded');
    AdminState.sidebarOpen = !sidebar.classList.contains('hidden');
  }

  // Invalidate all maps after transition completes
  setTimeout(() => {
    AdminState.maps.forEach((map) => {
      try {
        map.invalidateSize();
      } catch (error) {
        console.error('Error invalidating map size:', error);
      }
    });
  }, 300);

  console.log(`Sidebar ${AdminState.sidebarOpen ? 'opened' : 'closed'}`);
}

// Handle window resize to adjust sidebar behavior
function handleResize() {
  const sidebar = document.getElementById('admin-sidebar');
  const mainContent = document.getElementById('admin-main');
  const overlay = document.getElementById('sidebar-overlay');

  if (!sidebar || !mainContent) return;

  const isMobile = window.innerWidth <= 1024;

  if (isMobile) {
    // On mobile, reset to closed state
    sidebar.classList.remove('hidden', 'active');
    mainContent.classList.remove('expanded');
    if (overlay) {
      overlay.classList.remove('active');
    }
  } else {
    // On desktop, remove mobile-specific classes
    sidebar.classList.remove('active');
    if (overlay) {
      overlay.classList.remove('active');
    }

    // Restore sidebar state
    if (!AdminState.sidebarOpen) {
      sidebar.classList.add('hidden');
      mainContent.classList.add('expanded');
    }
  }
}

// Debounce resize handler
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
      success: '#00D9A3',
      error: '#FF6B6B',
      warning: '#FF8C42',
      info: '#4A9EFF'
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            background: rgba(0, 3, 40, 0.98);
            backdrop-filter: blur(20px);
            color: ${colors[type] || colors.info};
            padding: 16px 24px;
            border: 2px solid ${colors[type] || colors.info};
            border-radius: 12px;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            animation: slideInRight 0.3s ease;
            cursor: pointer;
            max-width: 400px;
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

    grid.innerHTML = '';

    if (reports.length === 0) {
      grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    reports.forEach(report => {
      const card = this.createReportCard(report);
      grid.appendChild(card);

      // Initialize map after card is in DOM
      setTimeout(() => {
        this.initializeReportMap(report.id, report.lat, report.lng);
      }, 100);
    });
  },

  createReportCard(report) {
    const card = document.createElement('div');
    card.className = 'report-card';
    card.dataset.reportId = report.id;
    card.dataset.type = report.type;

    card.innerHTML = `
            <div class="report-header">
                <div class="report-type">
                    <div class="type-icon ${report.type}">
                        <i class="fas ${Utils.getTypeIcon(report.type)}"></i>
                    </div>
                    <div class="type-info">
                        <div class="type-name">${Utils.formatType(report.type)}</div>
                        <span class="type-severity severity-${report.severity}">${report.severity}</span>
                    </div>
                </div>
            </div>

            <div class="report-meta">
                <div class="meta-item">
                    <i class="fas fa-clock"></i>
                    <span>${report.timeAgo}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-user"></i>
                    <span>${report.reporter}</span>
                </div>
            </div>

            <div class="report-body">
                <div class="report-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${report.location}</span>
                </div>
                <div class="report-location" style="font-size: 12px; color: var(--text-tertiary); margin-top: -8px;">
                    <i class="fas fa-crosshairs"></i>
                    <span>${Utils.formatCoordinates(report.lat, report.lng)}</span>
                </div>

                <div class="report-description">${report.description}</div>

                <div class="report-evidence">
                    <div class="evidence-label">Evidence Submitted</div>
                    ${report.evidenceType === 'image' ? `
                        <div class="evidence-image">
                            <i class="fas fa-image"></i>
                        </div>
                    ` : `
                        <div class="evidence-text">"${report.evidence}"</div>
                    `}
                </div>

                <div class="map-preview-container">
                    <div class="evidence-label">Location</div>
                    <div class="map-preview" id="map-${report.id}"></div>
                </div>

                <div class="report-actions">
                    <button class="action-btn verify-btn" onclick="verifyReport('${report.id}')">
                        <i class="fas fa-check"></i>
                        <span>Verify</span>
                    </button>
                    <button class="action-btn reject-btn" onclick="rejectReport('${report.id}')">
                        <i class="fas fa-times"></i>
                        <span>Reject</span>
                    </button>
                </div>
            </div>
        `;

    return card;
  },

  initializeReportMap(reportId, lat, lng) {
    const mapElement = document.getElementById(`map-${reportId}`);
    if (!mapElement || typeof L === 'undefined') return;

    try {
      const map = L.map(`map-${reportId}`, {
        center: [lat, lng],
        zoom: 12,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '©OpenStreetMap, ©CartoDB',
        subdomains: 'abcd'
      }).addTo(map);

      // Add marker
      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: '#FF6B6B',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85
      }).addTo(map);

      AdminState.maps.set(reportId, map);

      // Invalidate size after a short delay to ensure proper rendering
      setTimeout(() => {
        map.invalidateSize();
      }, 200);

    } catch (error) {
      console.error(`Error initializing map for ${reportId}:`, error);
    }
  }
};

// ====== REPORT ACTIONS ======
function verifyReport(reportId) {
  console.log(`✓ Verifying report: ${reportId}`);

  const card = document.querySelector(`[data-report-id="${reportId}"]`);
  if (!card) return;

  // Add verification animation
  card.classList.add('verified');

  // Update stats
  AdminState.stats.pending = Math.max(0, AdminState.stats.pending - 1);
  AdminState.stats.verified++;
  updateStatsDisplay();

  // Show notification
  Utils.showNotification(`✓ Report ${reportId} verified and published to map`, 'success');

  // Remove from DOM after animation
  setTimeout(() => {
    // Clean up map
    const map = AdminState.maps.get(reportId);
    if (map) {
      map.remove();
      AdminState.maps.delete(reportId);
    }

    // Remove from state
    AdminState.reports = AdminState.reports.filter(r => r.id !== reportId);
    AdminState.filteredReports = AdminState.filteredReports.filter(r => r.id !== reportId);

    // Remove card
    card.remove();

    // Update badge
    updatePendingBadge();

    // Check if empty
    if (AdminState.filteredReports.length === 0) {
      const emptyState = document.getElementById('empty-state');
      if (emptyState) emptyState.style.display = 'block';
    }
  }, 400);
}

function rejectReport(reportId) {
  console.log(`✗ Rejecting report: ${reportId}`);

  const card = document.querySelector(`[data-report-id="${reportId}"]`);
  if (!card) return;

  // Add rejection animation
  card.classList.add('rejected');

  // Update stats
  AdminState.stats.pending = Math.max(0, AdminState.stats.pending - 1);
  updateStatsDisplay();

  // Show notification
  Utils.showNotification(`✗ Report ${reportId} rejected`, 'warning');

  // Remove from DOM after animation
  setTimeout(() => {
    // Clean up map
    const map = AdminState.maps.get(reportId);
    if (map) {
      map.remove();
      AdminState.maps.delete(reportId);
    }

    // Remove from state
    AdminState.reports = AdminState.reports.filter(r => r.id !== reportId);
    AdminState.filteredReports = AdminState.filteredReports.filter(r => r.id !== reportId);

    // Remove card
    card.remove();

    // Update badge
    updatePendingBadge();

    // Check if empty
    if (AdminState.filteredReports.length === 0) {
      const emptyState = document.getElementById('empty-state');
      if (emptyState) emptyState.style.display = 'block';
    }
  }, 400);
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

    // Update filter button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filterType}"]`)?.classList.add('active');

    Utils.showNotification(`Filter applied: ${filterType === 'all' ? 'All Reports' : Utils.formatType(filterType)}`, 'info');
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
        AdminState.filteredReports.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
        break;
    }
  },

  changeSorting(sortType) {
    AdminState.currentSort = sortType;
    this.applySorting();
    ReportRenderer.renderReports(AdminState.filteredReports);
    Utils.showNotification(`Sorted by: ${sortType.replace('-', ' ')}`, 'info');
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
  Utils.showNotification('📡 Reports refreshed', 'info');
}

function logout() {
  console.log('👋 Logging out...');
  // localStorage.removeItem('isAdmin');
  Utils.showNotification('Logged out successfully', 'success');

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// ====== NAVIGATION ======
function initializeNavigation() {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();

      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      const view = item.dataset.view;
      console.log(`Switching to view: ${view}`);

      // In a real app, this would load different content
      // For now, we'll just show a notification
      if (view !== 'inbox') {
        Utils.showNotification(`${view.charAt(0).toUpperCase() + view.slice(1)} view - Coming soon`, 'info');
      }
    });
  });
}

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c🛡️ COMMAND ACCESS DASHBOARD', 'font-size: 16px; font-weight: bold; color: #00D9A3;');
  console.log('%cInitializing admin panel...', 'font-size: 12px; color: #4A9EFF;');

  try {
    // Load mock data
    AdminState.reports = [...MOCK_REPORTS];
    AdminState.filteredReports = [...MOCK_REPORTS];
    AdminState.stats.pending = MOCK_REPORTS.length;

    // Update initial stats
    updateStatsDisplay();
    updatePendingBadge();

    // Render reports
    ReportRenderer.renderReports(AdminState.filteredReports);

    // Initialize filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        FilterModule.applyFilter(filter);
      });
    });

    // Initialize sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        FilterModule.changeSorting(e.target.value);
      });
    }

    // Initialize navigation
    initializeNavigation();

    // Initialize sidebar state
    handleResize();

    console.log('%c✓ Admin dashboard initialized successfully', 'font-size: 11px; color: #00D9A3;');
    console.log('%cPending Reports:', AdminState.stats.pending, 'font-size: 11px; color: #00D9A3;');

    // Show welcome notification
    setTimeout(() => {
      Utils.showNotification('🛡️ Command Access Active', 'success');
    }, 500);

  } catch (error) {
    console.error('Initialization error:', error);
    Utils.showNotification('System initialization failed', 'error');
  }
});

// ====== ADD ANIMATIONS TO STYLE ======
const style = document.createElement('style');
style.textContent = `
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
document.head.appendChild(style);

// ====== EXPOSE API FOR DEBUGGING ======
window.ADMIN_API = {
  state: AdminState,
  verify: verifyReport,
  reject: rejectReport,
  filter: FilterModule,
  utils: Utils,
  toggleSidebar: toggleSidebar
};