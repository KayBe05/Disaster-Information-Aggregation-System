document.addEventListener('DOMContentLoaded', function () {
  // Global map variable
  let mapInstance = null;
  let userMarker = null;
  let currentMarkers = [];
  let baseLayers = {};
  let overlayLayers = {};

  // Header scroll effect
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Initialize map with error handling
  function initializeMap() {
    try {
      if (mapInstance) {
        mapInstance.remove();
      }

      // Initialize map
      mapInstance = L.map('map', {
        zoomControl: false,
        attributionControl: true,
        preferCanvas: true,
        maxZoom: 18,
        minZoom: 2
      }).setView([20, 0], 2);

      // Create base layers
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        name: 'OpenStreetMap'
      });

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
        maxZoom: 17,
        name: 'Satellite'
      });

      const terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>',
        maxZoom: 17,
        name: 'Terrain'
      });

      // Add default layer
      osmLayer.addTo(mapInstance);

      // Store base layers
      baseLayers = {
        'Street Map': osmLayer,
        'Satellite': satelliteLayer,
        'Terrain': terrainLayer
      };

      // Create overlay layers
      const earthquakeLayer = L.layerGroup();
      const disasterLayer = L.layerGroup();
      const floodRiskLayer = L.layerGroup();

      overlayLayers = {
        'Recent Earthquakes': earthquakeLayer,
        'Disaster Alerts': disasterLayer,
        'Flood Risk Zones': floodRiskLayer
      };

      // Add scale control
      L.control.scale({
        position: 'bottomleft',
        imperial: true,
        metric: true
      }).addTo(mapInstance);

      return true;
    } catch (error) {
      console.error('Failed to initialize map:', error);
      showNotification('Failed to initialize map. Please refresh the page.', 'error');
      return false;
    }
  }

  // Initialize the map
  if (!initializeMap()) {
    return;
  }

  // After map initialization, ensure it resizes properly
  if (mapInstance) {
    setTimeout(() => {
      mapInstance.invalidateSize();
    }, 100);

    window.addEventListener('resize', () => {
      mapInstance.invalidateSize();
    });
  }

  // Create custom marker icon for user location
  const userIcon = L.divIcon({
    className: 'user-location-marker',
    html: `<div class="marker-pulse"></div><div class="marker-dot"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  // Enhanced user location popup
  function showUserLocationPopup(lat, lng, accuracy) {
    // Remove existing user marker popup
    if (userMarker && userMarker.getPopup()) {
      userMarker.closePopup();
    }

    const popupContent = `
        <div class="user-location-popup">
            <div class="popup-header">
                <h3>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    Your Location
                </h3>
            </div>
            <div class="popup-content">
                <div class="location-detail">
                    <div class="detail-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 22l10-8 10 8-10-20z"></path>
                        </svg>
                    </div>
                    <div class="detail-content">
                        <div class="detail-label">Coordinates</div>
                        <div class="detail-value">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
                    </div>
                </div>
                
                <div class="location-detail">
                    <div class="detail-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path>
                        </svg>
                    </div>
                    <div class="detail-content">
                        <div class="detail-label">Accuracy</div>
                        <div class="detail-value">±${Math.round(accuracy)}m</div>
                    </div>
                </div>
                
                <button class="check-risks-btn" onclick="checkLocationRisks(${lat}, ${lng})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    Check Risk Levels
                </button>
            </div>
        </div>
    `;

    // Create and show popup
    const popup = L.popup({
      maxWidth: 320,
      className: 'modern-popup',
      closeButton: true,
      autoClose: false,
      keepInView: true,
      autoPan: true,
      zIndexOffset: 3000
    })
      .setLatLng([lat, lng])
      .setContent(popupContent)
      .openOn(mapInstance);

    return popup;
  }

  // Enhanced control panel creation
  function createModernControlPanel() {
    const controlPanel = L.control({ position: 'topright' });

    controlPanel.onAdd = function (map) {
      const div = L.DomUtil.create('div', 'map-control-panel');

      // Main controls group
      const mainGroup = L.DomUtil.create('div', 'control-group', div);

      // Location button
      const locationBtn = L.DomUtil.create('button', 'map-control-btn', mainGroup);
      locationBtn.title = 'My Location';
      locationBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
        `;

      // Layers button
      const layersBtn = L.DomUtil.create('button', 'map-control-btn', mainGroup);
      layersBtn.title = 'Map Layers & Features';
      layersBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12,2 22,8.5 12,15 2,8.5"></polygon>
                <polyline points="2,17.5 12,24 22,17.5"></polyline>
                <polyline points="2,12.5 12,19 22,12.5"></polyline>
            </svg>
        `;

      // Fullscreen button
      const fullscreenBtn = L.DomUtil.create('button', 'map-control-btn', mainGroup);
      fullscreenBtn.title = 'Toggle Fullscreen';
      fullscreenBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
        `;

      // Zoom controls group
      const zoomGroup = L.DomUtil.create('div', 'control-group', div);

      // Zoom in button
      const zoomInBtn = L.DomUtil.create('button', 'map-control-btn', zoomGroup);
      zoomInBtn.title = 'Zoom In';
      zoomInBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        `;

      // Zoom out button
      const zoomOutBtn = L.DomUtil.create('button', 'map-control-btn', zoomGroup);
      zoomOutBtn.title = 'Zoom Out';
      zoomOutBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        `;

      // Create layer panel
      const layerPanel = L.DomUtil.create('div', 'layer-panel', div);
      layerPanel.innerHTML = `
            <div class="layer-panel-header">
                <h4>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12,2 22,8.5 12,15 2,8.5"></polygon>
                        <polyline points="2,17.5 12,24 22,17.5"></polyline>
                        <polyline points="2,12.5 12,19 22,12.5"></polyline>
                    </svg>
                    Map Layers & Features
                </h4>
            </div>
            <div class="layer-panel-content">
                <div class="layer-section">
                    <div class="layer-section-title">Base Maps</div>
                    <div class="layer-option" data-layer="street">
                        <input type="radio" name="baseLayer" value="street" checked>
                        <div class="layer-option-content">
                            <div class="layer-option-title">Street Map</div>
                            <div class="layer-option-desc">Standard street and road view</div>
                        </div>
                    </div>
                    <div class="layer-option" data-layer="satellite">
                        <input type="radio" name="baseLayer" value="satellite">
                        <div class="layer-option-content">
                            <div class="layer-option-title">Satellite</div>
                            <div class="layer-option-desc">High-resolution satellite imagery</div>
                        </div>
                    </div>
                    <div class="layer-option" data-layer="terrain">
                        <input type="radio" name="baseLayer" value="terrain">
                        <div class="layer-option-content">
                            <div class="layer-option-title">Terrain</div>
                            <div class="layer-option-desc">Topographic map with elevation</div>
                        </div>
                    </div>
                </div>
                
                <div class="layer-section">
                    <div class="layer-section-title">Risk Overlays</div>
                    <div class="layer-option">
                        <input type="checkbox" id="earthquakeLayer">
                        <div class="layer-option-content">
                            <div class="layer-option-title">Recent Earthquakes</div>
                            <div class="layer-option-desc">Show earthquake activity (last 30 days)</div>
                        </div>
                    </div>
                    <div class="layer-option">
                        <input type="checkbox" id="floodRiskLayer">
                        <div class="layer-option-content">
                            <div class="layer-option-title">Flood Risk Zones</div>
                            <div class="layer-option-desc">Areas with high flood probability</div>
                        </div>
                    </div>
                    <div class="layer-option">
                        <input type="checkbox" id="disasterAlertsLayer">
                        <div class="layer-option-content">
                            <div class="layer-option-title">Active Disaster Alerts</div>
                            <div class="layer-option-desc">Current emergency notifications</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

      // Event handlers
      locationBtn.onclick = () => getUserLocation();
      zoomInBtn.onclick = () => mapInstance.zoomIn();
      zoomOutBtn.onclick = () => mapInstance.zoomOut();
      fullscreenBtn.onclick = () => toggleFullscreen();

      // Layer panel toggle
      layersBtn.onclick = (e) => {
        e.stopPropagation();
        layerPanel.classList.toggle('active');
        layersBtn.classList.toggle('active');
      };

      // Close layer panel when clicking outside
      document.addEventListener('click', () => {
        layerPanel.classList.remove('active');
        layersBtn.classList.remove('active');
      });

      // Prevent layer panel clicks from closing it
      layerPanel.onclick = (e) => e.stopPropagation();

      // Layer switching functionality
      const radioInputs = layerPanel.querySelectorAll('input[name="baseLayer"]');
      radioInputs.forEach(input => {
        input.addEventListener('change', (e) => {
          switchMapLayer(e.target.value);
        });
      });

      // Overlay layer toggles
      const checkboxInputs = layerPanel.querySelectorAll('input[type="checkbox"]');
      checkboxInputs.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          toggleOverlayLayer(e.target.id, e.target.checked);
        });
      });

      return div;
    };

    return controlPanel;
  }

  // Initialize the modern control panel
  createModernControlPanel().addTo(mapInstance);

  // Search functionality
  const searchInput = document.querySelector('.map-search input');
  const searchButton = document.querySelector('.map-search button') || document.querySelector('.map-search .search-btn');

  if (searchInput) {
    searchInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchLocation(this.value.trim());
      }
    });
  }

  if (searchButton) {
    searchButton.addEventListener('click', function () {
      const query = searchInput ? searchInput.value.trim() : '';
      if (query) {
        searchLocation(query);
      }
    });
  }

  // Map click event
  mapInstance.on('click', function (e) {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);

    // Clear previous click markers
    clearMarkers('click-marker');

    // Add click marker
    const clickMarker = L.circleMarker(e.latlng, {
      color: '#1a73e8',
      fillColor: '#1a73e8',
      fillOpacity: 0.6,
      radius: 8,
      weight: 2,
      className: 'click-marker'
    }).addTo(mapInstance);

    currentMarkers.push(clickMarker);

    // Show location info
    showLocationDetails(e.latlng, clickMarker);
  });

  // Initialize with user location if available
  if (navigator.geolocation) {
    getUserLocation();
  } else {
    showNotification('Geolocation is not supported by your browser.', 'warning');
  }

  // Load initial data
  loadInitialData();

  // Enhanced getUserLocation function
  function getUserLocation() {
    if (!navigator.geolocation) {
      showNotification('Geolocation is not supported by your browser.', 'error');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      function (position) {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        // Remove existing user marker
        if (userMarker) {
          mapInstance.removeLayer(userMarker);
        }

        // Fly to user location
        mapInstance.flyTo([userLat, userLng], 12, {
          duration: 1.5,
          easeLinearity: 0.25
        });

        // Add user marker with enhanced icon
        userMarker = L.marker([userLat, userLng], {
          icon: userIcon
        }).addTo(mapInstance);

        // Show modern popup
        setTimeout(() => {
          showUserLocationPopup(userLat, userLng, accuracy);
        }, 1600);

        // Add accuracy circle if reasonable
        if (accuracy < 1000) {
          const accuracyCircle = L.circle([userLat, userLng], {
            radius: accuracy,
            color: '#1a73e8',
            fillColor: '#1a73e8',
            fillOpacity: 0.1,
            weight: 2
          }).addTo(mapInstance);
          userMarker.accuracyCircle = accuracyCircle;
        }

        showNotification('Location found! Click anywhere on the map to get disaster risk information.', 'success');

        // Fetch nearby disasters
        fetchNearbyDisasters(userLat, userLng);
      },
      function (error) {
        console.error('Geolocation error:', error);
        showNotification('Unable to retrieve your location. Please check your browser settings.', 'error');
      },
      options
    );
  }

  // Enhanced search functionality
  async function searchLocation(query) {
    if (!query) {
      showNotification('Please enter a location to search.', 'warning');
      return;
    }

    // Show loading state
    if (searchInput) {
      searchInput.disabled = true;
      searchInput.style.opacity = '0.7';
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error('Search service unavailable');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        // Clear previous search results
        clearMarkers('search-result');

        // Fly to location
        mapInstance.flyTo([lat, lon], 12, {
          duration: 1.5,
          easeLinearity: 0.25
        });

        // Create search result marker
        const searchIcon = L.divIcon({
          className: 'search-result-marker',
          html: `<div class="search-marker-pin"></div>`,
          iconSize: [30, 40],
          iconAnchor: [15, 40]
        });

        const marker = L.marker([lat, lon], {
          icon: searchIcon,
          className: 'search-result'
        }).addTo(mapInstance);

        currentMarkers.push(marker);

        // Create popup with location details
        const popupContent = `
          <div class="search-popup">
            <h3>${result.display_name.split(',')[0]}</h3>
            <p class="location-details">${result.display_name}</p>
            <div class="popup-actions">
              <button onclick="showLocationDetails({lat: ${lat}, lng: ${lon}})" class="btn-primary">
                Get Risk Information
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent).openPopup();

        showNotification(`Found: ${result.display_name.split(',')[0]}`, 'success');

        // Clear search input
        if (searchInput) {
          searchInput.value = '';
        }
      } else {
        showNotification('Location not found. Please try a different search term.', 'error');
      }
    } catch (error) {
      console.error('Search error:', error);
      showNotification('Search service is currently unavailable. Please try again later.', 'error');
    } finally {
      // Reset search input
      if (searchInput) {
        searchInput.disabled = false;
        searchInput.style.opacity = '1';
      }
    }
  }

  function showLocationDetails(latlng, marker) {
    // Create popup content
    const popupContent = `
      <div class="risk-level-popup">
        <div class="popup-content">
          <h4>Location Risk Assessment</h4>
          <p><strong>Coordinates:</strong> ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}</p>
          <div class="risk-levels">
            <div class="risk-item">
              <span>Earthquake Risk:</span>
              <span class="risk-badge moderate">Moderate</span>
            </div>
            <div class="risk-item">
              <span>Flood Risk:</span>
              <span class="risk-badge low">Low</span>
            </div>
            <div class="risk-item">
              <span>Fire Risk:</span>
              <span class="risk-badge high">High</span>
            </div>
          </div>
          <button class="details-btn" onclick="getDetailedRiskInfo('${latlng.lat}', '${latlng.lng}')">
            Get Detailed Info
          </button>
        </div>
      </div>
    `;

    // Create popup
    const popup = L.popup({
      maxWidth: 320,
      minWidth: 280,
      className: 'custom-popup',
      closeButton: true,
      autoClose: false,
      keepInView: true,
      autoPan: true,
      zIndexOffset: 1000
    })
      .setLatLng(latlng)
      .setContent(popupContent)
      .openOn(mapInstance);

    // Store popup reference with marker
    if (marker) {
      marker.popup = popup;
    }
  }

  // Layer switching function
  function switchMapLayer(layerType) {
    // Remove current base layer
    mapInstance.eachLayer(function (layer) {
      if (baseLayers['Street Map'] === layer || baseLayers['Satellite'] === layer || baseLayers['Terrain'] === layer) {
        mapInstance.removeLayer(layer);
      }
    });

    // Add new base layer
    switch (layerType) {
      case 'satellite':
        baseLayers['Satellite'].addTo(mapInstance);
        break;
      case 'terrain':
        baseLayers['Terrain'].addTo(mapInstance);
        break;
      default:
        baseLayers['Street Map'].addTo(mapInstance);
        break;
    }
  }

  // Toggle overlay layers
  function toggleOverlayLayer(layerId, enabled) {
    const layerMap = {
      'earthquakeLayer': 'Recent Earthquakes',
      'floodRiskLayer': 'Flood Risk Zones',
      'disasterAlertsLayer': 'Disaster Alerts'
    };

    const layerName = layerMap[layerId];
    if (layerName && overlayLayers[layerName]) {
      if (enabled) {
        if (!mapInstance.hasLayer(overlayLayers[layerName])) {
          overlayLayers[layerName].addTo(mapInstance);
        }
      } else {
        if (mapInstance.hasLayer(overlayLayers[layerName])) {
          mapInstance.removeLayer(overlayLayers[layerName]);
        }
      }
    }
  }

  // Risk checking function
  function checkLocationRisks(lat, lng) {
    // Navigate to details page
    window.location.href = `details.html?lat=${lat}&lng=${lng}`;
  }

  // Fetch nearby disasters from USGS and other sources
  async function fetchNearbyDisasters(lat, lng) {
    try {
      // Fetch recent earthquakes
      await fetchRecentEarthquakes(lat, lng, 500);
    } catch (error) {
      console.error('Error fetching disaster data:', error);
    }
  }

  // Fetch recent earthquakes from USGS
  async function fetchRecentEarthquakes(lat, lng, radiusKm) {
    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime}&endtime=${endTime}&latitude=${lat}&longitude=${lng}&maxradiuskm=${radiusKm}&minmagnitude=3.0`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('USGS API unavailable');
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        displayEarthquakes(data.features);
        showNotification(`Found ${data.features.length} earthquakes in the last 30 days nearby.`, 'info');
      }
    } catch (error) {
      console.error('Error fetching earthquake data:', error);
      // Fallback to sample data
      displaySampleEarthquakes();
    }
  }

  // Display earthquakes on map
  function displayEarthquakes(earthquakes) {
    const earthquakeLayer = overlayLayers['Recent Earthquakes'];
    earthquakeLayer.clearLayers();

    earthquakes.forEach(quake => {
      const magnitude = quake.properties.mag;
      const location = quake.properties.place;
      const time = new Date(quake.properties.time);
      const [lng, lat, depth] = quake.geometry.coordinates;

      // Create earthquake marker
      const size = Math.max(magnitude * 4, 8);
      const color = getEarthquakeColor(magnitude);

      const earthquakeMarker = L.circleMarker([lat, lng], {
        radius: size,
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.6,
        className: 'earthquake-marker'
      });

      earthquakeMarker.bindPopup(`
        <div class="earthquake-popup">
          <h3 class="magnitude-${getMagnitudeClass(magnitude)}">M ${magnitude}</h3>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Time:</strong> ${time.toLocaleString()}</p>
          <p><strong>Depth:</strong> ${depth} km</p>
          <div class="popup-actions">
            <a href="details.html?lat=${lat}&lng=${lng}" class="btn-primary">View Details</a>
          </div>
        </div>
      `);

      earthquakeLayer.addLayer(earthquakeMarker);
    });

    // Add layer to map if not already added
    if (!mapInstance.hasLayer(earthquakeLayer)) {
      earthquakeLayer.addTo(mapInstance);
    }
  }

  // Get earthquake color based on magnitude
  function getEarthquakeColor(magnitude) {
    if (magnitude >= 7) return '#ff0000';
    if (magnitude >= 6) return '#ff6600';
    if (magnitude >= 5) return '#ff9900';
    if (magnitude >= 4) return '#ffcc00';
    if (magnitude >= 3) return '#ffff00';
    return '#99ff00';
  }

  // Get magnitude CSS class
  function getMagnitudeClass(magnitude) {
    if (magnitude >= 7) return 'major';
    if (magnitude >= 5) return 'strong';
    if (magnitude >= 3) return 'moderate';
    return 'minor';
  }

  // Display sample earthquakes when API is unavailable
  function displaySampleEarthquakes() {
    const sampleEarthquakes = [
      { lat: 37.7749, lng: -122.4194, magnitude: 4.2, location: "San Francisco Bay Area, CA", time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { lat: 34.0522, lng: -118.2437, magnitude: 3.8, location: "Los Angeles, CA", time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { lat: 61.2181, lng: -149.9003, magnitude: 5.1, location: "Anchorage, Alaska", time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    ];

    const earthquakeLayer = overlayLayers['Recent Earthquakes'];
    earthquakeLayer.clearLayers();

    sampleEarthquakes.forEach(quake => {
      const size = Math.max(quake.magnitude * 4, 8);
      const color = getEarthquakeColor(quake.magnitude);

      const marker = L.circleMarker([quake.lat, quake.lng], {
        radius: size,
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.6
      });

      marker.bindPopup(`
        <div class="earthquake-popup">
          <h3>M ${quake.magnitude}</h3>
          <p><strong>Location:</strong> ${quake.location}</p>
          <p><strong>Time:</strong> ${quake.time.toLocaleString()}</p>
          <p class="sample-note">Sample Data</p>
        </div>
      `);

      earthquakeLayer.addLayer(marker);
    });

    earthquakeLayer.addTo(mapInstance);
  }

  // Global function to handle redirection
  window.getDetailedRiskInfo = function (lat, lng) {
    const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
    const detailsUrl = `${baseUrl}details.html?lat=${lat}&lng=${lng}`;

    try {
      window.location.href = detailsUrl;
    } catch (error) {
      console.error('Redirection failed:', error);
      window.open(detailsUrl, '_blank');
    }
  };

  // Load initial data
  function loadInitialData() {
    displaySampleEarthquakes();
    loadDisasterAlerts();
  }

  // Load disaster alerts
  function loadDisasterAlerts() {
    const disasterLayer = overlayLayers['Disaster Alerts'];

    // Sample disaster data
    const disasters = [
      { lat: 25.7617, lng: -80.1918, type: 'hurricane', name: 'Hurricane Watch - Miami', severity: 'high' },
      { lat: 34.0522, lng: -118.2437, type: 'wildfire', name: 'Wildfire Risk - Los Angeles', severity: 'moderate' },
      { lat: 40.7128, lng: -74.0060, type: 'flood', name: 'Flood Warning - New York', severity: 'low' }
    ];

    disasters.forEach(disaster => {
      const icon = getDisasterIcon(disaster.type, disaster.severity);
      const marker = L.marker([disaster.lat, disaster.lng], { icon }).bindPopup(`
        <div class="disaster-popup ${disaster.type}">
          <h3>${disaster.name}</h3>
          <p><strong>Type:</strong> ${disaster.type.toUpperCase()}</p>
          <p><strong>Severity:</strong> <span class="severity-${disaster.severity}">${disaster.severity.toUpperCase()}</span></p>
          <button onclick="window.location.href='details.html?lat=${disaster.lat}&lng=${disaster.lng}'" class="btn-primary">
            View Details
          </button>
        </div>
      `);

      disasterLayer.addLayer(marker);
    });
  }

  // Get disaster icon
  function getDisasterIcon(type, severity) {
    const colors = {
      high: '#ff0000',
      moderate: '#ff9900',
      low: '#ffcc00'
    };

    const icons = {
      hurricane: '🌀',
      wildfire: '🔥',
      flood: '🌊',
      earthquake: '⚡'
    };

    return L.divIcon({
      className: `disaster-icon ${type} ${severity}`,
      html: `<div style="background-color: ${colors[severity]}; border-radius: 50%; padding: 5px; font-size: 16px;">${icons[type]}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  }

  // Unified marker clearing function
  function clearMarkers(markerClass) {
    currentMarkers.forEach(marker => {
      if (marker.options && marker.options.className === markerClass) {
        mapInstance.removeLayer(marker);
      }
    });
    currentMarkers = currentMarkers.filter(marker =>
      !marker.options || marker.options.className !== markerClass
    );
  }

  // Enhanced notification system
  function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `map-notification ${type}`;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${icons[type] || icons.info}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Position notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 300px;
      padding: 12px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      background-color: ${type === 'error' ? '#fee' : type === 'success' ? '#efe' : type === 'warning' ? '#fff3cd' : '#e7f3ff'};
      border: 1px solid ${type === 'error' ? '#f5c6cb' : type === 'success' ? '#c3e6cb' : type === 'warning' ? '#ffeaa7' : '#b3d4fc'};
    `;

    document.body.appendChild(notification);

    // Auto remove
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, duration);
  }

  // Fullscreen toggle
  function toggleFullscreen() {
    const mapContainer = document.getElementById('map');
    if (!document.fullscreenElement) {
      mapContainer.requestFullscreen().then(() => {
        mapContainer.classList.add('fullscreen');
        setTimeout(() => mapInstance.invalidateSize(), 100);
      });
    } else {
      document.exitFullscreen().then(() => {
        mapContainer.classList.remove('fullscreen');
        setTimeout(() => mapInstance.invalidateSize(), 100);
      });
    }
  }

  // Handle URL parameters for direct location access
  function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const lat = urlParams.get('lat');
    const lng = urlParams.get('lng');

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        // Fly to the specified location
        mapInstance.flyTo([latitude, longitude], 12, {
          duration: 1.5,
          easeLinearity: 0.25
        });

        // Add marker for the specified location
        const urlMarker = L.circleMarker([latitude, longitude], {
          color: '#1a73e8',
          fillColor: '#1a73e8',
          fillOpacity: 0.6,
          radius: 8,
          weight: 2,
          className: 'url-marker'
        }).addTo(mapInstance);

        currentMarkers.push(urlMarker);

        // Show location details
        setTimeout(() => {
          showLocationDetails({ lat: latitude, lng: longitude }, urlMarker);
        }, 1000);
      }
    }
  }

  // Initialize URL parameter handling
  handleURLParameters();

  // Global functions for external access
  window.fetchNearbyDisasters = fetchNearbyDisasters;
  window.showLocationDetails = showLocationDetails;
  window.checkLocationRisks = checkLocationRisks;

  // Cleanup function for page unload
  window.addEventListener('beforeunload', function () {
    if (mapInstance) {
      mapInstance.remove();
    }
  });

  console.log('Enhanced Disaster Risk Map initialized successfully');
});