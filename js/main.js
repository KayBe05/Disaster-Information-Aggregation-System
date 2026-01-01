// Global state
let diapsMap = null;
let markers = [];
let activeFilters = {
  earthquake: true,
  wildfire: true,
  flood: true,
  storm: true,
  citizen: true
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  initializeHeader();
  initializeMap();
  initializeSearch();
  initializeFilters();
  initializeFeedActions();
  initializeSourceBadges();
  startLiveFeed();
  addScrollAnimations();
});

// Header scroll effect
function initializeHeader() {
  const header = document.querySelector('.main-header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Hide header on scroll down, show on scroll up
    if (currentScroll > lastScroll && currentScroll > 500) {
      header.style.transform = 'translateY(-100%)';
    } else {
      header.style.transform = 'translateY(0)';
    }

    lastScroll = currentScroll;
  });

  // Smooth scroll for nav links
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const headerHeight = header.offsetHeight;
          const targetPosition = target.offsetTop - headerHeight - 20;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });
}

// Initialize Leaflet map with enhanced styling
function initializeMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  // Initialize map centered on world view
  diapsMap = L.map('map', {
    center: [20, 0],
    zoom: 2,
    zoomControl: true,
    minZoom: 2,
    maxZoom: 12,
    maxBounds: [[-90, -180], [90, 180]],
    maxBoundsViscosity: 0.5
  });

  // Custom zoom control position
  diapsMap.zoomControl.setPosition('bottomright');

  // Dark tile layer for intelligence aesthetic
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '©OpenStreetMap, ©CartoDB',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(diapsMap);

  // Add sample disaster markers
  addDisasterMarkers();

  // Add map interaction feedback
  diapsMap.on('zoomend', function () {
    const zoom = diapsMap.getZoom();
    console.log('Current zoom level:', zoom);
  });
}

// Add disaster markers to map with enhanced styling
function addDisasterMarkers() {
  const disasters = [
    {
      lat: 37.7749,
      lng: -122.4194,
      type: 'earthquake',
      magnitude: 'M6.2',
      source: 'USGS',
      verified: true,
      location: 'San Francisco Bay Area',
      time: '08:45 UTC'
    },
    {
      lat: 34.0522,
      lng: -118.2437,
      type: 'wildfire',
      source: 'NASA FIRMS',
      verified: true,
      location: 'Los Angeles County',
      detail: 'High thermal detection',
      time: '09:12 UTC'
    },
    {
      lat: 29.7604,
      lng: -95.3698,
      type: 'flood',
      source: 'GDACS',
      verified: true,
      location: 'Houston Metro',
      detail: 'Level 3 Alert',
      time: '07:30 UTC'
    },
    {
      lat: 40.7128,
      lng: -74.0060,
      type: 'citizen',
      detail: 'Road Block - Major Highway',
      verified: false,
      location: 'New York City',
      source: 'Citizen Report',
      time: '10:05 UTC'
    },
    {
      lat: 35.6762,
      lng: 139.6503,
      type: 'earthquake',
      magnitude: 'M5.8',
      source: 'USGS',
      verified: true,
      location: 'Tokyo Region',
      time: '11:22 UTC'
    },
    {
      lat: 51.5074,
      lng: -0.1278,
      type: 'storm',
      source: 'NOAA',
      verified: true,
      location: 'London Area',
      detail: 'Severe Weather Warning',
      time: '06:15 UTC'
    }
  ];

  disasters.forEach((disaster, index) => {
    const marker = createMarker(disaster);
    markers.push({ marker, data: disaster });
  });
}

// Create individual marker with enhanced popup
function createMarker(disaster) {
  const color = getMarkerColor(disaster.type, disaster.verified);
  const radius = disaster.verified ? 10 : 7;

  const marker = L.circleMarker([disaster.lat, disaster.lng], {
    radius: radius,
    fillColor: color,
    color: '#fff',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.85,
    className: disaster.verified ? 'verified-marker' : 'unverified-marker'
  }).addTo(diapsMap);

  // Create enhanced popup content
  const popupContent = `
    <div style="font-family: 'Inter', sans-serif; color: #1a1f35; min-width: 200px;">
      <div style="font-size: 11px; color: #6b7280; margin-bottom: 6px; font-family: 'Courier New', monospace;">
        ${disaster.time}
      </div>
      <div style="font-weight: 700; font-size: 15px; margin-bottom: 8px; color: #111827;">
        ${disaster.type.charAt(0).toUpperCase() + disaster.type.slice(1)}
        ${disaster.magnitude ? ' - ' + disaster.magnitude : ''}
      </div>
      ${disaster.location ? `<div style="font-size: 13px; color: #4b5563; margin-bottom: 6px;">📍 ${disaster.location}</div>` : ''}
      ${disaster.detail ? `<div style="font-size: 13px; color: #4b5563; margin-bottom: 8px;">${disaster.detail}</div>` : ''}
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">
        Source: <span style="color: #4A9EFF; font-weight: 600;">${disaster.source}</span>
      </div>
      ${disaster.verified ?
      `<div style="color: #00D9A3; font-weight: 700; font-size: 12px; letter-spacing: 1px;">✓ VERIFIED</div>` :
      `<div style="color: #f59e0b; font-weight: 600; font-size: 12px;">⏳ PENDING VERIFICATION</div>`
    }
    </div>
  `;

  marker.bindPopup(popupContent, {
    maxWidth: 300,
    className: 'custom-popup'
  });

  // Add hover effect
  marker.on('mouseover', function () {
    this.setStyle({
      radius: radius + 3,
      fillOpacity: 1
    });
  });

  marker.on('mouseout', function () {
    this.setStyle({
      radius: radius,
      fillOpacity: 0.85
    });
  });

  return marker;
}

// Get marker color based on type and verification
function getMarkerColor(type, verified) {
  if (!verified) return '#9ca3af';

  const colors = {
    'earthquake': '#FF6B6B',
    'wildfire': '#FF8C42',
    'flood': '#4A9EFF',
    'storm': '#A78BFA',
    'citizen': '#00D9A3'
  };

  return colors[type] || '#9ca3af';
}

// Initialize search functionality
function initializeSearch() {
  const searchInput = document.querySelector('.search-input');
  const exampleTags = document.querySelectorAll('.example-tag');

  if (searchInput) {
    // Search on Enter key
    searchInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter' && this.value.trim()) {
        performSearch(this.value.trim());
      }
    });

    // Live search suggestions (placeholder)
    searchInput.addEventListener('input', function () {
      if (this.value.length > 2) {
        // In production, this would show autocomplete suggestions
        console.log('Searching for:', this.value);
      }
    });
  }

  // Click on example tags to populate search
  exampleTags.forEach(tag => {
    tag.addEventListener('click', function () {
      const searchText = this.textContent.replace(/[\[\]]/g, '').trim();
      if (searchInput) {
        searchInput.value = searchText;
        searchInput.focus();
        performSearch(searchText);
      }
    });
  });
}

// Perform search with visual feedback
function performSearch(query) {
  console.log('Searching for:', query);

  // Show loading state
  showNotification(`🔍 Searching for: ${query}`, 'info');

  // Simulate API call
  setTimeout(() => {
    const results = markers.filter(m =>
      m.data.location?.toLowerCase().includes(query.toLowerCase()) ||
      m.data.type.toLowerCase().includes(query.toLowerCase()) ||
      m.data.source.toLowerCase().includes(query.toLowerCase())
    );

    if (results.length > 0) {
      // Zoom to first result
      const firstResult = results[0];
      diapsMap.setView([firstResult.data.lat, firstResult.data.lng], 6);
      firstResult.marker.openPopup();
      showNotification(`✓ Found ${results.length} result(s)`, 'success');
    } else {
      showNotification('⚠ No incidents found matching your search', 'warning');
    }
  }, 500);
}

// Initialize filter functionality
function initializeFilters() {
  const filterCheckboxes = document.querySelectorAll('.filter-option input[type="checkbox"]');

  filterCheckboxes.forEach((checkbox, index) => {
    const types = ['earthquake', 'wildfire', 'flood', 'citizen'];
    const type = types[index] || 'citizen';

    checkbox.addEventListener('change', function () {
      activeFilters[type] = this.checked;
      updateMapFilters();
    });
  });
}

// Update map based on filter selections
function updateMapFilters() {
  markers.forEach(({ marker, data }) => {
    if (activeFilters[data.type]) {
      if (!diapsMap.hasLayer(marker)) {
        marker.addTo(diapsMap);
      }
    } else {
      if (diapsMap.hasLayer(marker)) {
        diapsMap.removeLayer(marker);
      }
    }
  });

  const activeCount = Object.values(activeFilters).filter(Boolean).length;
  showNotification(`Filters updated - ${activeCount} type(s) visible`, 'info');
}

// Initialize feed action buttons
function initializeFeedActions() {
  document.querySelectorAll('.feed-action').forEach(action => {
    action.addEventListener('click', function (e) {
      e.preventDefault();
      const feedItem = this.closest('.feed-item');
      const type = feedItem.querySelector('.feed-type')?.textContent || 'Unknown';
      const time = feedItem.querySelector('.feed-time')?.textContent || '';

      showNotification(`📊 Loading details: ${type} (${time})`, 'info');

      // Animate the feed item
      feedItem.style.transform = 'scale(0.98)';
      setTimeout(() => {
        feedItem.style.transform = 'scale(1)';
      }, 200);
    });
  });
}

// Initialize source badge interactions
function initializeSourceBadges() {
  document.querySelectorAll('.source-badge').forEach(badge => {
    badge.addEventListener('click', function () {
      const source = this.textContent.trim().replace(/[\[\]]/g, '');

      // Filter markers by source
      const matchingMarkers = markers.filter(m =>
        m.data.source.toLowerCase().includes(source.toLowerCase())
      );

      if (matchingMarkers.length > 0) {
        // Fit map to show all matching markers
        const group = L.featureGroup(matchingMarkers.map(m => m.marker));
        diapsMap.fitBounds(group.getBounds().pad(0.1));
        showNotification(`📡 Showing ${matchingMarkers.length} incident(s) from ${source}`, 'success');
      } else {
        showNotification(`No active incidents from ${source}`, 'warning');
      }
    });
  });
}

// Start live feed updates
function startLiveFeed() {
  let updateCount = 0;

  // Simulate live feed updates every 15 seconds
  setInterval(() => {
    updateCount++;
    updateLiveFeed(updateCount);
  }, 15000);
}

// Update live feed with new incidents
function updateLiveFeed(count) {
  const feedContainer = document.querySelector('.feed-container');
  if (!feedContainer) return;

  // Add a subtle pulse effect to indicate update
  feedContainer.style.opacity = '0.7';
  setTimeout(() => {
    feedContainer.style.opacity = '1';
  }, 300);

  console.log(`Live feed update #${count}`);

  // Show notification every 5 updates
  if (count % 5 === 0) {
    showNotification('📡 Live feed updated', 'info');
  }
}

// Enhanced notification system
function showNotification(message, type = 'info') {
  const colors = {
    success: { bg: '#00D9A3', border: '#00D9A3' },
    error: { bg: '#FF6B6B', border: '#FF6B6B' },
    warning: { bg: '#FF8C42', border: '#FF8C42' },
    info: { bg: '#4A9EFF', border: '#4A9EFF' }
  };

  const color = colors[type] || colors.info;

  const notification = document.createElement('div');
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
    animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 320px;
    letter-spacing: 0.3px;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// View map button functionality
const viewMapBtn = document.querySelector('.view-map-btn');
if (viewMapBtn) {
  viewMapBtn.addEventListener('click', function () {
    const mapSection = document.querySelector('.situation-map-section');
    if (mapSection) {
      const headerHeight = document.querySelector('.main-header').offsetHeight;
      const targetPosition = mapSection.offsetTop - headerHeight - 20;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
}

// Add scroll animations for sections
function addScrollAnimations() {
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

  // Observe sections
  document.querySelectorAll('.inputs-section, .situation-map-section, .feed-section, .why-section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
  });
}

// Add enhanced CSS animations
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
  
  .verified-marker {
    animation: pulse-ring 3s ease-out infinite;
  }
  
  @keyframes pulse-ring {
    0% {
      box-shadow: 0 0 0 0 rgba(0, 217, 163, 0.7);
    }
    50% {
      box-shadow: 0 0 0 15px rgba(0, 217, 163, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(0, 217, 163, 0);
    }
  }
  
  .custom-popup .leaflet-popup-content-wrapper {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    padding: 12px;
  }
  
  .custom-popup .leaflet-popup-tip {
    background: #ffffff;
  }
  
  .main-header {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .feed-item {
    transition: all 0.2s ease;
  }
  
  .leaflet-container {
    font-family: 'Inter', sans-serif;
  }
  
  /* Enhanced marker styles */
  .leaflet-marker-icon {
    transition: all 0.3s ease;
  }
  
  /* Zoom control styling */
  .leaflet-control-zoom {
    border: 1px solid rgba(255, 234, 208, 0.15) !important;
    border-radius: 8px !important;
    overflow: hidden;
  }
  
  .leaflet-control-zoom a {
    background: rgba(255, 255, 255, 0.08) !important;
    backdrop-filter: blur(10px);
    color: #ffffff !important;
    border: none !important;
    transition: all 0.2s ease !important;
  }
  
  .leaflet-control-zoom a:hover {
    background: rgba(255, 255, 255, 0.15) !important;
    color: #FFEAD0 !important;
  }
`;
document.head.appendChild(style);

// Console welcome message
console.log('%c🌍 DIAPS - Disaster Intelligence Platform', 'font-size: 16px; font-weight: bold; color: #FFEAD0;');
console.log('%cReal-time disaster monitoring system initialized', 'font-size: 12px; color: #4A9EFF;');
console.log('%cVersion: 1.0.0 | Status: Live', 'font-size: 11px; color: #00D9A3;');