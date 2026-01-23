// ====== SETTINGS PAGE LOGIC ======

// ====== STATE MANAGEMENT ======
const SettingsState = {
  map: null,
  homeMarker: null,
  currentUser: null,
  settings: null,
  isDirty: false
};

// ====== DEFAULT SETTINGS ======
const DEFAULT_SETTINGS = {
  alerts: {
    earthquake: true,
    flood: true,
    wildfire: true,
    radius: 50,
    severityThreshold: 'all'
  },
  location: {
    latitude: 20.0,
    longitude: 0.0,
    isSet: false
  },
  app: {
    dataSaver: false,
    darkTheme: true,
    pushNotifications: true
  }
};

// ====== AUTHENTICATION CHECK ======
/*
function checkAuthentication() {
  const userData = localStorage.getItem('diapsUser');

  if (!userData) {
    console.warn('No user found, redirecting to signup...');
    showToast('Please sign in to access settings', 'error');
    setTimeout(() => {
      window.location.href = 'signup.html';
    }, 1500);
    return null;
  }

  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}
*/
// ====== SETTINGS INITIALIZATION ======
function initializeSettings() {
  const savedSettings = localStorage.getItem('diapsSettings');

  if (savedSettings) {
    try {
      return JSON.parse(savedSettings);
    } catch (error) {
      console.error('Error parsing settings:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  return { ...DEFAULT_SETTINGS };
}

// ====== LOAD USER PROFILE ======
function loadUserProfile() {
  if (!SettingsState.currentUser) return;

  const nameField = document.getElementById('profileName');
  const emailField = document.getElementById('profileEmail');

  if (nameField) {
    nameField.value = SettingsState.currentUser.name || 'User';
  }

  if (emailField) {
    emailField.value = SettingsState.currentUser.email || 'user@example.com';
  }
}

// ====== LOAD SETTINGS INTO UI ======
function loadSettingsUI() {
  if (!SettingsState.settings) return;

  // Alert Preferences
  const earthquakeToggle = document.getElementById('alertEarthquake');
  const floodToggle = document.getElementById('alertFlood');
  const wildfireToggle = document.getElementById('alertWildfire');
  const radiusSlider = document.getElementById('alertRadius');
  const severitySelect = document.getElementById('severityThreshold');

  if (earthquakeToggle) earthquakeToggle.checked = SettingsState.settings.alerts.earthquake;
  if (floodToggle) floodToggle.checked = SettingsState.settings.alerts.flood;
  if (wildfireToggle) wildfireToggle.checked = SettingsState.settings.alerts.wildfire;
  if (radiusSlider) {
    radiusSlider.value = SettingsState.settings.alerts.radius;
    updateRadiusDisplay(SettingsState.settings.alerts.radius);
  }
  if (severitySelect) severitySelect.value = SettingsState.settings.alerts.severityThreshold;

  // Home Location
  const latField = document.getElementById('homeLat');
  const lngField = document.getElementById('homeLng');

  if (latField) latField.value = SettingsState.settings.location.latitude.toFixed(4);
  if (lngField) lngField.value = SettingsState.settings.location.longitude.toFixed(4);

  // App System
  const dataSaverToggle = document.getElementById('dataSaver');
  const darkThemeToggle = document.getElementById('darkTheme');
  const notificationsToggle = document.getElementById('pushNotifications');

  if (dataSaverToggle) dataSaverToggle.checked = SettingsState.settings.app.dataSaver;
  if (darkThemeToggle) darkThemeToggle.checked = SettingsState.settings.app.darkTheme;
  if (notificationsToggle) notificationsToggle.checked = SettingsState.settings.app.pushNotifications;

  // Update map marker if location is set
  if (SettingsState.settings.location.isSet && SettingsState.map) {
    updateHomeMarker(
      SettingsState.settings.location.latitude,
      SettingsState.settings.location.longitude
    );
  }
}

// ====== MAP INITIALIZATION ======
function initializeMap() {
  const mapElement = document.getElementById('settingsMap');

  if (!mapElement || typeof L === 'undefined') {
    console.warn('Map element or Leaflet library not found');
    return;
  }

  try {
    SettingsState.map = L.map('settingsMap', {
      center: [
        SettingsState.settings.location.latitude,
        SettingsState.settings.location.longitude
      ],
      zoom: 4,
      zoomControl: true,
      minZoom: 2,
      maxZoom: 15
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '©OpenStreetMap, ©CartoDB',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(SettingsState.map);

    // Add click event to set home location
    SettingsState.map.on('click', function (e) {
      updateHomeMarker(e.latlng.lat, e.latlng.lng);
      updateLocationFields(e.latlng.lat, e.latlng.lng);
      markAsDirty();
    });

    // Add initial marker if location is set
    if (SettingsState.settings.location.isSet) {
      updateHomeMarker(
        SettingsState.settings.location.latitude,
        SettingsState.settings.location.longitude
      );
    }

  } catch (error) {
    console.error('Error initializing map:', error);
    showToast('Failed to load map', 'error');
  }
}

// ====== UPDATE HOME MARKER ======
function updateHomeMarker(lat, lng) {
  if (!SettingsState.map) return;

  // Remove existing marker
  if (SettingsState.homeMarker) {
    SettingsState.map.removeLayer(SettingsState.homeMarker);
  }

  // Create custom home icon
  const homeIcon = L.divIcon({
    className: 'custom-home-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: #00D9A3;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 217, 163, 0.5);
      ">
        <i class="fas fa-home" style="
          color: white;
          font-size: 14px;
          transform: rotate(45deg);
        "></i>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  // Add new marker
  SettingsState.homeMarker = L.marker([lat, lng], {
    icon: homeIcon,
    draggable: true
  }).addTo(SettingsState.map);

  // Update on drag
  SettingsState.homeMarker.on('dragend', function (e) {
    const position = e.target.getLatLng();
    updateLocationFields(position.lat, position.lng);
    markAsDirty();
  });

  // Center map on marker
  SettingsState.map.setView([lat, lng], SettingsState.map.getZoom());

  // Update settings
  SettingsState.settings.location.latitude = lat;
  SettingsState.settings.location.longitude = lng;
  SettingsState.settings.location.isSet = true;
}

// ====== UPDATE LOCATION FIELDS ======
function updateLocationFields(lat, lng) {
  const latField = document.getElementById('homeLat');
  const lngField = document.getElementById('homeLng');

  if (latField) latField.value = lat.toFixed(4);
  if (lngField) lngField.value = lng.toFixed(4);
}

// ====== RADIUS SLIDER UPDATE ======
function updateRadiusDisplay(value) {
  const radiusValue = document.getElementById('radiusValue');
  if (radiusValue) {
    radiusValue.textContent = `${value} km`;
  }
}

// ====== MARK AS DIRTY ======
function markAsDirty() {
  SettingsState.isDirty = true;
  const saveBtn = document.getElementById('saveSettingsBtn');
  if (saveBtn && !saveBtn.classList.contains('pulse')) {
    saveBtn.classList.add('pulse');
  }
}

// ====== COLLECT SETTINGS FROM UI ======
function collectSettings() {
  const settings = {
    alerts: {
      earthquake: document.getElementById('alertEarthquake')?.checked ?? true,
      flood: document.getElementById('alertFlood')?.checked ?? true,
      wildfire: document.getElementById('alertWildfire')?.checked ?? true,
      radius: parseInt(document.getElementById('alertRadius')?.value ?? 50),
      severityThreshold: document.getElementById('severityThreshold')?.value ?? 'all'
    },
    location: {
      latitude: parseFloat(document.getElementById('homeLat')?.value ?? 20.0),
      longitude: parseFloat(document.getElementById('homeLng')?.value ?? 0.0),
      isSet: SettingsState.settings.location.isSet
    },
    app: {
      dataSaver: document.getElementById('dataSaver')?.checked ?? false,
      darkTheme: document.getElementById('darkTheme')?.checked ?? true,
      pushNotifications: document.getElementById('pushNotifications')?.checked ?? true
    }
  };

  return settings;
}

// ====== SAVE SETTINGS ======
function saveSettings() {
  try {
    const settings = collectSettings();

    localStorage.setItem('diapsSettings', JSON.stringify(settings));

    SettingsState.settings = settings;
    SettingsState.isDirty = false;

    const saveBtn = document.getElementById('saveSettingsBtn');
    if (saveBtn) {
      saveBtn.classList.remove('pulse');
    }

    showToast('✓ Settings saved successfully', 'success');

    console.log('Settings saved:', settings);

    // Apply theme immediately
    applyTheme(settings.app.darkTheme);

  } catch (error) {
    console.error('Error saving settings:', error);
    showToast('Failed to save settings', 'error');
  }
}

// ====== APPLY THEME ======
function applyTheme(isDark) {
  if (isDark) {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
  }
}

// ====== GEOLOCATION ======
function useCurrentLocation() {
  if (!navigator.geolocation) {
    showToast('Geolocation not supported', 'error');
    return;
  }

  showToast('Getting your location...', 'info');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      updateHomeMarker(lat, lng);
      updateLocationFields(lat, lng);
      markAsDirty();

      showToast('✓ Location updated', 'success');
    },
    (error) => {
      console.error('Geolocation error:', error);
      showToast('Unable to get location', 'error');
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// ====== SIGN OUT ======
function signOut() {
  if (!confirm('Are you sure you want to sign out?')) {
    return;
  }

  try {
    localStorage.removeItem('diapsUser');
    localStorage.removeItem('diapsSettings');

    showToast('Signing out...', 'info');

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);

  } catch (error) {
    console.error('Error signing out:', error);
    showToast('Sign out failed', 'error');
  }
}

// ====== TOAST NOTIFICATIONS ======
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle'
  };

  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.info}"></i>
    <span>${message}</span>
  `;

  // Add click to dismiss
  toast.addEventListener('click', () => {
    dismissToast(toast);
  });

  container.appendChild(toast);

  // Auto dismiss after 4 seconds
  setTimeout(() => {
    dismissToast(toast);
  }, 4000);
}

function dismissToast(toast) {
  if (!toast || !document.body.contains(toast)) return;

  toast.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

  setTimeout(() => {
    toast.remove();
  }, 300);
}

// ====== EVENT LISTENERS ======
function bindEventListeners() {
  // Alert radius slider
  const radiusSlider = document.getElementById('alertRadius');
  if (radiusSlider) {
    radiusSlider.addEventListener('input', (e) => {
      updateRadiusDisplay(e.target.value);
      markAsDirty();
    });
  }

  // All checkboxes and select fields
  const inputs = document.querySelectorAll(
    'input[type="checkbox"], select, input[type="text"]'
  );
  inputs.forEach(input => {
    if (!input.readOnly) {
      input.addEventListener('change', markAsDirty);
    }
  });

  // Latitude/Longitude inputs
  const latField = document.getElementById('homeLat');
  const lngField = document.getElementById('homeLng');

  if (latField) {
    latField.addEventListener('blur', (e) => {
      const lat = parseFloat(e.target.value);
      if (!isNaN(lat) && lat >= -90 && lat <= 90) {
        const lng = parseFloat(lngField?.value ?? 0);
        updateHomeMarker(lat, lng);
        markAsDirty();
      }
    });
  }

  if (lngField) {
    lngField.addEventListener('blur', (e) => {
      const lng = parseFloat(e.target.value);
      if (!isNaN(lng) && lng >= -180 && lng <= 180) {
        const lat = parseFloat(latField?.value ?? 0);
        updateHomeMarker(lat, lng);
        markAsDirty();
      }
    });
  }

  // Geolocate button
  const geolocateBtn = document.getElementById('geolocateBtn');
  if (geolocateBtn) {
    geolocateBtn.addEventListener('click', useCurrentLocation);
  }

  // Save button
  const saveBtn = document.getElementById('saveSettingsBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveSettings);
  }

  // Sign out button
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', signOut);
  }

  // Warn before leaving if unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (SettingsState.isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c⚙️ DIAS Settings', 'font-size: 16px; font-weight: bold; color: #FFEAD0;');
  console.log('%cInitializing settings page...', 'font-size: 12px; color: #4A9EFF;');

  try {
    // Check authentication
    SettingsState.currentUser = checkAuthentication();

    if (!SettingsState.currentUser) {
      return; // Will redirect to signup
    }

    // Initialize settings
    SettingsState.settings = initializeSettings();

    // Load UI
    loadUserProfile();
    loadSettingsUI();

    // Initialize map
    initializeMap();

    // Bind event listeners
    bindEventListeners();

    // Apply current theme
    applyTheme(SettingsState.settings.app.darkTheme);

    console.log('%c✓ Settings page initialized', 'font-size: 11px; color: #00D9A3;');

    // Welcome toast
    setTimeout(() => {
      showToast(`Welcome back, ${SettingsState.currentUser.name || 'User'}!`, 'success');
    }, 500);

  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Failed to load settings', 'error');
  }
});

// ====== EXPOSE API FOR DEBUGGING ======
if (typeof window !== 'undefined') {
  window.DIAS_SETTINGS_API = {
    state: SettingsState,
    save: saveSettings,
    reset: () => {
      SettingsState.settings = { ...DEFAULT_SETTINGS };
      loadSettingsUI();
      showToast('Settings reset to defaults', 'info');
    },
    export: () => {
      console.log('Current Settings:', SettingsState.settings);
      return SettingsState.settings;
    }
  };
}