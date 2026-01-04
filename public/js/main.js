// ====== APPLICATION STATE ======
const DIAPS = {
  map: null,
  markers: new Map(),
  filters: {
    earthquake: true,
    wildfire: true,
    flood: true,
    storm: true,
    citizen: true
  },
  config: {
    updateInterval: 15000,
    notificationDuration: 4000,
    mapCenter: [20, 0],
    mapZoom: 2,
    animationDuration: 300
  }
};

// ====== DISASTER DATA ======
const DISASTER_DATA = [
  {
    id: 'eq_001',
    lat: 37.7749,
    lng: -122.4194,
    type: 'earthquake',
    magnitude: 'M6.2',
    source: 'USGS',
    verified: true,
    location: 'San Francisco Bay Area',
    time: '08:45 UTC',
    description: 'Moderate earthquake detected in Bay Area'
  },
  {
    id: 'fire_001',
    lat: 34.0522,
    lng: -118.2437,
    type: 'wildfire',
    source: 'NASA FIRMS',
    verified: true,
    location: 'Los Angeles County',
    detail: 'High thermal detection',
    time: '09:12 UTC',
    description: 'Active wildfire with high thermal signature'
  },
  {
    id: 'flood_001',
    lat: 29.7604,
    lng: -95.3698,
    type: 'flood',
    source: 'GDACS',
    verified: true,
    location: 'Houston Metro',
    detail: 'Level 3 Alert',
    time: '07:30 UTC',
    description: 'Severe flooding in metropolitan area'
  },
  {
    id: 'citizen_001',
    lat: 40.7128,
    lng: -74.0060,
    type: 'citizen',
    detail: 'Road Block - Major Highway',
    verified: false,
    location: 'New York City',
    source: 'Citizen Report',
    time: '10:05 UTC',
    description: 'Citizen reported major highway obstruction'
  },
  {
    id: 'eq_002',
    lat: 35.6762,
    lng: 139.6503,
    type: 'earthquake',
    magnitude: 'M5.8',
    source: 'USGS',
    verified: true,
    location: 'Tokyo Region',
    time: '11:22 UTC',
    description: 'Earthquake activity in Tokyo metropolitan area'
  },
  {
    id: 'storm_001',
    lat: 51.5074,
    lng: -0.1278,
    type: 'storm',
    source: 'NOAA',
    verified: true,
    location: 'London Area',
    detail: 'Severe Weather Warning',
    time: '06:15 UTC',
    description: 'Severe weather system approaching region'
  },
  {
    id: 'fire_002',
    lat: -33.8688,
    lng: 151.2093,
    type: 'wildfire',
    source: 'NASA FIRMS',
    verified: true,
    location: 'Sydney Region',
    detail: 'Active fire front',
    time: '12:45 UTC',
    description: 'Bushfire with active fire front'
  },
  {
    id: 'flood_002',
    lat: 22.3193,
    lng: 114.1694,
    type: 'flood',
    source: 'GDACS',
    verified: true,
    location: 'Hong Kong',
    detail: 'Level 2 Alert',
    time: '05:30 UTC',
    description: 'Flash flood warning in urban area'
  }
];

// ====== UTILITY FUNCTIONS ======
const Utils = {
  getMarkerColor(type, verified) {
    if (!verified) return '#9ca3af';

    const colors = {
      earthquake: '#FF6B6B',
      wildfire: '#FF8C42',
      flood: '#4A9EFF',
      storm: '#A78BFA',
      citizen: '#00D9A3'
    };

    return colors[type] || '#9ca3af';
  },

  formatDisasterType(type) {
    return type.charAt(0).toUpperCase() + type.slice(1);
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  smoothScrollTo(element, offset = 0) {
    if (!element) return;

    const headerHeight = document.querySelector('.main-header')?.offsetHeight || 0;
    const targetPosition = element.offsetTop - headerHeight - offset;

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }
};

// ====== HEADER MODULE ======
const HeaderModule = {
  header: null,
  lastScroll: 0,

  init() {
    this.header = document.querySelector('.main-header');
    if (!this.header) return;

    this.bindScrollEvents();
    this.bindNavigationEvents();
  },

  bindScrollEvents() {
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
  },

  handleScroll() {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      this.header.classList.add('scrolled');
    } else {
      this.header.classList.remove('scrolled');
    }

    if (currentScroll > this.lastScroll && currentScroll > 500) {
      this.header.style.transform = 'translateY(-100%)';
    } else {
      this.header.style.transform = 'translateY(0)';
    }

    this.lastScroll = currentScroll;
  },

  bindNavigationEvents() {
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');

        if (href && href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            Utils.smoothScrollTo(target, 20);
          }
        }
      });
    });
  }
};

// ====== MAP MODULE ======
const MapModule = {
  init() {
    const mapElement = document.getElementById('map');
    if (!mapElement || typeof L === 'undefined') {
      console.warn('Map element or Leaflet library not found');
      return;
    }

    this.createMap();
    this.addMarkers();
    this.bindMapEvents();
  },

  createMap() {
    try {
      DIAPS.map = L.map('map', {
        center: DIAPS.config.mapCenter,
        zoom: DIAPS.config.mapZoom,
        zoomControl: true,
        minZoom: 2,
        maxZoom: 12,
        maxBounds: [[-90, -180], [90, 180]],
        maxBoundsViscosity: 0.5,
        preferCanvas: true
      });

      DIAPS.map.zoomControl.setPosition('bottomright');

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '©OpenStreetMap, ©CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(DIAPS.map);

    } catch (error) {
      console.error('Error initializing map:', error);
      NotificationModule.show('Failed to initialize map', 'error');
    }
  },

  addMarkers() {
    DISASTER_DATA.forEach(disaster => {
      try {
        const marker = this.createMarker(disaster);
        DIAPS.markers.set(disaster.id, { marker, data: disaster });
      } catch (error) {
        console.error(`Error creating marker for ${disaster.id}:`, error);
      }
    });
  },

  createMarker(disaster) {
    const color = Utils.getMarkerColor(disaster.type, disaster.verified);
    const radius = disaster.verified ? 10 : 7;

    const marker = L.circleMarker([disaster.lat, disaster.lng], {
      radius: radius,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85,
      className: disaster.verified ? 'verified-marker' : 'unverified-marker'
    }).addTo(DIAPS.map);

    const popupContent = this.createPopupContent(disaster);
    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'custom-popup'
    });

    this.addMarkerInteractions(marker, radius);

    return marker;
  },

  createPopupContent(disaster) {
    return `
      <div style="font-family: 'Inter', sans-serif; color: #1a1f35; min-width: 200px;">
        <div style="font-size: 11px; color: #6b7280; margin-bottom: 6px; font-family: 'Courier New', monospace;">
          ${disaster.time}
        </div>
        <div style="font-weight: 700; font-size: 15px; margin-bottom: 8px; color: #111827;">
          ${Utils.formatDisasterType(disaster.type)}
          ${disaster.magnitude ? ' - ' + disaster.magnitude : ''}
        </div>
        ${disaster.location ? `<div style="font-size: 13px; color: #4b5563; margin-bottom: 6px;">📍 ${disaster.location}</div>` : ''}
        ${disaster.detail ? `<div style="font-size: 13px; color: #4b5563; margin-bottom: 8px;">${disaster.detail}</div>` : ''}
        ${disaster.description ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 8px; font-style: italic;">${disaster.description}</div>` : ''}
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">
          Source: <span style="color: #4A9EFF; font-weight: 600;">${disaster.source}</span>
        </div>
        ${disaster.verified ?
        `<div style="color: #00D9A3; font-weight: 700; font-size: 12px; letter-spacing: 1px;">✓ VERIFIED</div>` :
        `<div style="color: #f59e0b; font-weight: 600; font-size: 12px;">⏳ PENDING VERIFICATION</div>`
      }
      </div>
    `;
  },

  addMarkerInteractions(marker, baseRadius) {
    marker.on('mouseover', function () {
      this.setStyle({
        radius: baseRadius + 3,
        fillOpacity: 1
      });
    });

    marker.on('mouseout', function () {
      this.setStyle({
        radius: baseRadius,
        fillOpacity: 0.85
      });
    });

    marker.on('click', function () {
      console.log('Marker clicked:', this.getLatLng());
    });
  },

  bindMapEvents() {
    if (!DIAPS.map) return;

    DIAPS.map.on('zoomend', () => {
      const zoom = DIAPS.map.getZoom();
      console.log('Map zoom level:', zoom);
    });

    DIAPS.map.on('moveend', () => {
      const center = DIAPS.map.getCenter();
      console.log('Map center:', center);
    });
  },

  fitBoundsToMarkers(markerIds) {
    if (!DIAPS.map || markerIds.length === 0) return;

    const markers = markerIds
      .map(id => DIAPS.markers.get(id)?.marker)
      .filter(Boolean);

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      DIAPS.map.fitBounds(group.getBounds().pad(0.1));
    }
  },

  focusOnMarker(markerId) {
    const entry = DIAPS.markers.get(markerId);
    if (!entry || !DIAPS.map) return;

    DIAPS.map.setView([entry.data.lat, entry.data.lng], 8, {
      animate: true,
      duration: 1
    });

    setTimeout(() => {
      entry.marker.openPopup();
    }, 500);
  }
};

// ====== SEARCH MODULE ======
const SearchModule = {
  searchInput: null,

  init() {
    this.searchInput = document.querySelector('.search-input');
    if (!this.searchInput) return;

    this.bindSearchEvents();
    this.bindExampleTags();
  },

  bindSearchEvents() {
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = this.searchInput.value.trim();
        if (query) {
          this.performSearch(query);
        }
      }
    });

    const debouncedSearch = Utils.debounce((query) => {
      if (query.length > 2) {
        this.showSearchSuggestions(query);
      }
    }, 300);

    this.searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });
  },

  bindExampleTags() {
    const exampleTags = document.querySelectorAll('.example-tag');

    exampleTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const searchText = tag.textContent.trim();
        if (this.searchInput) {
          this.searchInput.value = searchText;
          this.searchInput.focus();
          this.performSearch(searchText);
        }
      });
    });
  },

  performSearch(query) {
    console.log('Searching for:', query);
    NotificationModule.show(`🔍 Searching for: ${query}`, 'info');

    const results = this.searchDisasters(query);

    if (results.length > 0) {
      const firstResult = results[0];
      MapModule.focusOnMarker(firstResult.id);

      NotificationModule.show(
        `✓ Found ${results.length} incident${results.length > 1 ? 's' : ''}`,
        'success'
      );

      this.highlightFeedResults(results);
    } else {
      NotificationModule.show('⚠ No incidents found matching your search', 'warning');
    }
  },

  searchDisasters(query) {
    const searchTerm = query.toLowerCase();
    const results = [];

    DIAPS.markers.forEach((entry, id) => {
      const data = entry.data;
      const searchableText = [
        data.location,
        data.type,
        data.source,
        data.detail,
        data.description,
        data.magnitude
      ].join(' ').toLowerCase();

      if (searchableText.includes(searchTerm)) {
        results.push({ id, ...data });
      }
    });

    return results;
  },

  showSearchSuggestions(query) {
    const results = this.searchDisasters(query);
    console.log(`Found ${results.length} suggestions for "${query}"`);
  },

  highlightFeedResults(results) {
    const feedItems = document.querySelectorAll('.feed-item');

    feedItems.forEach(item => {
      item.style.background = '';
    });

    results.slice(0, 5).forEach((result, index) => {
      if (feedItems[index]) {
        feedItems[index].style.background = 'linear-gradient(90deg, rgba(0, 217, 163, 0.05) 0%, transparent 100%)';
      }
    });
  }
};

// ====== FILTER MODULE ======
const FilterModule = {
  init() {
    this.bindFilterCheckboxes();
  },

  bindFilterCheckboxes() {
    const filterCheckboxes = document.querySelectorAll('.filter-option input[type="checkbox"]');
    const filterTypes = ['earthquake', 'wildfire', 'flood', 'citizen'];

    filterCheckboxes.forEach((checkbox, index) => {
      const type = filterTypes[index] || 'citizen';

      checkbox.addEventListener('change', () => {
        DIAPS.filters[type] = checkbox.checked;
        this.updateMapFilters();
      });
    });
  },

  updateMapFilters() {
    let visibleCount = 0;

    DIAPS.markers.forEach((entry) => {
      const { marker, data } = entry;
      const shouldShow = DIAPS.filters[data.type];

      if (shouldShow) {
        if (!DIAPS.map.hasLayer(marker)) {
          marker.addTo(DIAPS.map);
        }
        visibleCount++;
      } else {
        if (DIAPS.map.hasLayer(marker)) {
          DIAPS.map.removeLayer(marker);
        }
      }
    });

    const activeFilterCount = Object.values(DIAPS.filters).filter(Boolean).length;
    NotificationModule.show(
      `Filters updated - ${activeFilterCount} type${activeFilterCount !== 1 ? 's' : ''} active (${visibleCount} incidents visible)`,
      'info'
    );
  },

  resetFilters() {
    Object.keys(DIAPS.filters).forEach(key => {
      DIAPS.filters[key] = true;
    });

    const checkboxes = document.querySelectorAll('.filter-option input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);

    this.updateMapFilters();
  }
};

// ====== FEED MODULE ======
const FeedModule = {
  init() {
    this.bindFeedActions();
    this.startLiveUpdates();
  },

  bindFeedActions() {
    document.querySelectorAll('.feed-action').forEach(action => {
      action.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleFeedAction(action);
      });
    });
  },

  handleFeedAction(actionElement) {
    const feedItem = actionElement.closest('.feed-item');
    if (!feedItem) return;

    const type = feedItem.querySelector('.feed-type')?.textContent || 'Unknown';
    const time = feedItem.querySelector('.feed-time')?.textContent || '';
    const source = feedItem.querySelector('.feed-source')?.textContent || '';

    NotificationModule.show(`📊 Loading details: ${type} (${time})`, 'info');

    feedItem.style.transform = 'scale(0.98)';
    setTimeout(() => {
      feedItem.style.transform = 'scale(1)';
    }, 200);

    console.log('Feed action clicked:', { type, time, source });
  },

  startLiveUpdates() {
    let updateCount = 0;

    setInterval(() => {
      updateCount++;
      this.performLiveUpdate(updateCount);
    }, DIAPS.config.updateInterval);
  },

  performLiveUpdate(count) {
    const feedContainer = document.querySelector('.feed-container');
    if (!feedContainer) return;

    feedContainer.style.opacity = '0.9';
    setTimeout(() => {
      feedContainer.style.opacity = '1';
    }, DIAPS.config.animationDuration);

    console.log(`Live feed update #${count} at ${new Date().toLocaleTimeString()}`);

    if (count % 10 === 0) {
      NotificationModule.show('📡 Live feed refreshed', 'info');
    }
  },

  addFeedItem(disaster) {
    console.log('Adding new feed item:', disaster);
  }
};

// ====== SOURCE BADGES MODULE ======
const SourceBadgesModule = {
  init() {
    this.bindBadgeClicks();
  },

  bindBadgeClicks() {
    document.querySelectorAll('.source-badge').forEach(badge => {
      badge.addEventListener('click', () => {
        const sourceName = badge.querySelector('.source-name')?.textContent || '';
        this.filterBySource(sourceName);
      });
    });
  },

  filterBySource(sourceName) {
    const matchingIds = [];

    DIAPS.markers.forEach((entry, id) => {
      if (entry.data.source.toLowerCase().includes(sourceName.toLowerCase())) {
        matchingIds.push(id);
      }
    });

    if (matchingIds.length > 0) {
      MapModule.fitBoundsToMarkers(matchingIds);
      NotificationModule.show(
        `📡 Showing ${matchingIds.length} incident${matchingIds.length !== 1 ? 's' : ''} from ${sourceName}`,
        'success'
      );
    } else {
      NotificationModule.show(`No active incidents from ${sourceName}`, 'warning');
    }
  }
};

// ====== NOTIFICATION MODULE ======
const NotificationModule = {
  notifications: [],

  show(message, type = 'info') {
    const colors = {
      success: { bg: '#00D9A3', border: '#00D9A3' },
      error: { bg: '#FF6B6B', border: '#FF6B6B' },
      warning: { bg: '#FF8C42', border: '#FF8C42' },
      info: { bg: '#4A9EFF', border: '#4A9EFF' }
    };

    const color = colors[type] || colors.info;

    const notification = document.createElement('div');
    notification.className = 'diaps-notification';
    notification.style.cssText = `
      position: fixed;
      top: ${100 + (this.notifications.length * 80)}px;
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
      animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      max-width: 320px;
      letter-spacing: 0.3px;
      cursor: pointer;
    `;
    notification.textContent = message;

    notification.addEventListener('click', () => {
      this.dismiss(notification);
    });

    document.body.appendChild(notification);
    this.notifications.push(notification);

    setTimeout(() => {
      this.dismiss(notification);
    }, DIAPS.config.notificationDuration);
  },

  dismiss(notification) {
    if (!notification || !document.body.contains(notification)) return;

    notification.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

    setTimeout(() => {
      notification.remove();
      this.notifications = this.notifications.filter(n => n !== notification);
      this.repositionNotifications();
    }, 300);
  },

  repositionNotifications() {
    this.notifications.forEach((notif, index) => {
      notif.style.top = `${100 + (index * 80)}px`;
    });
  },

  clear() {
    this.notifications.forEach(notif => this.dismiss(notif));
  }
};

// ====== ANIMATION MODULE ======
const AnimationModule = {
  init() {
    this.setupScrollAnimations();
    this.setupViewMapButton();
  },

  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll(
      '.inputs-section, .situation-map-section, .feed-section, .why-section'
    );

    sections.forEach(section => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(30px)';
      section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(section);
    });
  },

  setupViewMapButton() {
    const viewMapBtn = document.querySelector('.view-map-btn');
    if (!viewMapBtn) return;

    viewMapBtn.addEventListener('click', () => {
      const mapSection = document.querySelector('.situation-map-section');
      if (mapSection) {
        Utils.smoothScrollTo(mapSection, 20);
      }
    });
  }
};

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c🌍 DIAPS - Disaster Intelligence Platform', 'font-size: 16px; font-weight: bold; color: #FFEAD0;');
  console.log('%cReal-time disaster monitoring system initializing...', 'font-size: 12px; color: #4A9EFF;');

  try {
    // Initialize all modules
    HeaderModule.init();
    MapModule.init();
    SearchModule.init();
    FilterModule.init();
    FeedModule.init();
    SourceBadgesModule.init();
    AnimationModule.init();

    console.log('%c✓ System initialized successfully', 'font-size: 11px; color: #00D9A3;');
    console.log('%cVersion: 2.0.0 | Status: Live | Markers:', DIAPS.markers.size, 'font-size: 11px; color: #00D9A3;');

    setTimeout(() => {
      NotificationModule.show('🌍 DIAPS System Online', 'success');
    }, 500);

  } catch (error) {
    console.error('Initialization error:', error);
    NotificationModule.show('System initialization failed', 'error');
  }
});

// ====== GLOBAL ERROR HANDLING ======
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

// ====== EXPOSE API FOR DEBUGGING ======
if (typeof window !== 'undefined') {
  window.DIAPS_API = {
    state: DIAPS,
    modules: {
      map: MapModule,
      search: SearchModule,
      filter: FilterModule,
      feed: FeedModule,
      notification: NotificationModule
    },
    utils: Utils
  };
}