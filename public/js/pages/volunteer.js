// ============================================
// PROFESSIONAL DISASTER REPORTING SYSTEM
// ============================================

document.addEventListener('DOMContentLoaded', function () {
  initializeMap();
  initializeForm();
  initializeUpload();
  initializeProgress();
  feather.replace();
});

// ============================================
// MAP & GEOLOCATION
// ============================================

let map;
let marker;
let userLocation = null;

function initializeMap() {
  const mapElement = document.getElementById('map');
  const mapScanning = document.getElementById('mapScanning');
  const gpsStatus = document.getElementById('gpsStatus');
  const locateBtn = document.getElementById('locateBtn');
  const latDisplay = document.getElementById('latDisplay');
  const lngDisplay = document.getElementById('lngDisplay');

  // Initialize Leaflet map with dark theme
  map = L.map('map', {
    zoomControl: true,
    attributionControl: false
  }).setView([26.9124, 75.7873], 12); // Jaipur center

  // Add dark tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);

  // Create custom marker icon
  const customIcon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #00D9A3, #00A8E8);
        border: 4px solid #0A0E27;
        border-radius: 50%;
        box-shadow: 0 4px 16px rgba(0, 217, 163, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background: #0A0E27;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  // Create draggable marker
  marker = L.marker([26.9124, 75.7873], {
    draggable: true,
    icon: customIcon,
    opacity: 0
  }).addTo(map);

  // Update coordinates when marker is dragged
  marker.on('dragend', function (e) {
    const position = marker.getLatLng();
    updateCoordinates(position.lat, position.lng);
    updateProgressStep(2, true);
  });

  // Auto-locate on load
  setTimeout(() => {
    getUserLocation();
  }, 1000);

  // Locate button handler
  locateBtn.addEventListener('click', function (e) {
    e.preventDefault();
    getUserLocation();
  });
}

function getUserLocation() {
  const mapScanning = document.getElementById('mapScanning');
  const gpsStatus = document.getElementById('gpsStatus');

  if (!navigator.geolocation) {
    gpsStatus.textContent = 'Not Supported';
    hideMapScanning();
    return;
  }

  gpsStatus.textContent = 'Acquiring Signal...';
  mapScanning.style.display = 'flex';

  navigator.geolocation.getCurrentPosition(
    // Success
    function (position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      userLocation = { lat, lng };
      gpsStatus.textContent = 'Signal Locked';

      // Smooth transition
      setTimeout(() => {
        hideMapScanning();
      }, 800);

      // Fly to location with smooth animation
      map.flyTo([lat, lng], 15, {
        duration: 2,
        easeLinearity: 0.5
      });

      // Show marker with fade-in
      setTimeout(() => {
        marker.setLatLng([lat, lng]);
        marker.setOpacity(1);
      }, 500);

      updateCoordinates(lat, lng);
      updateProgressStep(2, true);

      console.log('✓ Location acquired:', lat.toFixed(6), lng.toFixed(6));
    },
    // Error
    function (error) {
      console.error('Geolocation error:', error);
      gpsStatus.textContent = 'Signal Failed';
      hideMapScanning();

      // Still show marker at default location
      marker.setOpacity(1);
      const defaultLat = 26.9124;
      const defaultLng = 75.7873;
      updateCoordinates(defaultLat, defaultLng);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function hideMapScanning() {
  const mapScanning = document.getElementById('mapScanning');
  mapScanning.style.opacity = '0';
  mapScanning.style.transition = 'opacity 0.5s ease';
  setTimeout(() => {
    mapScanning.style.display = 'none';
  }, 500);
}

function updateCoordinates(lat, lng) {
  document.getElementById('latitude').value = lat.toFixed(6);
  document.getElementById('longitude').value = lng.toFixed(6);
  document.getElementById('latDisplay').textContent = lat.toFixed(6);
  document.getElementById('lngDisplay').textContent = lng.toFixed(6);
}

// ============================================
// FORM HANDLING
// ============================================

function initializeForm() {
  const typeButtons = document.querySelectorAll('.type-card');
  const disasterTypeInput = document.getElementById('disasterType');
  const severitySlider = document.getElementById('severity');
  const severityDisplay = document.getElementById('severityDisplay');
  const severityFill = document.getElementById('severityFill');
  const reportForm = document.getElementById('reportForm');

  // Type selection
  typeButtons.forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();

      // Remove active from all
      typeButtons.forEach(b => b.classList.remove('active'));

      // Add active to clicked
      this.classList.add('active');

      const type = this.getAttribute('data-type');
      disasterTypeInput.value = type;

      updateProgressStep(1, true);

      console.log('✓ Disaster type selected:', type);

      // Reinitialize icons after DOM update
      setTimeout(() => feather.replace(), 100);
    });
  });

  // Severity slider
  const severityLabels = ['Low', 'Moderate', 'High', 'Severe', 'Critical'];
  const severityColors = [
    '#00D9A3',
    '#FFB800',
    '#FF9800',
    '#FF5722',
    '#FF3366'
  ];

  severitySlider.addEventListener('input', function () {
    const value = parseInt(this.value);
    const index = value - 1;

    // Update number and text
    const numberSpan = severityDisplay.querySelector('.severity-number');
    const textSpan = severityDisplay.querySelector('.severity-text');

    numberSpan.textContent = value;
    textSpan.textContent = severityLabels[index];

    // Update colors
    const color = severityColors[index];
    numberSpan.style.color = color;
    textSpan.style.color = color;

    // Update fill bar
    const percentage = ((value - 1) / 4) * 100;
    severityFill.style.width = percentage + '%';
    severityFill.style.background = `linear-gradient(90deg, ${color}, ${severityColors[Math.min(index + 1, 4)]})`;

    // Update level dots
    const dots = document.querySelectorAll('.level-dot');
    dots.forEach((dot, i) => {
      if (i < value) {
        dot.style.background = color;
        dot.style.boxShadow = `0 0 10px ${color}`;
      } else {
        dot.style.background = 'var(--border-color)';
        dot.style.boxShadow = 'none';
      }
    });

    updateProgressStep(3, true);
  });

  // Initialize severity display
  severitySlider.dispatchEvent(new Event('input'));

  // Form submission
  reportForm.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    submitReport();
  });
}

function validateForm() {
  const disasterType = document.getElementById('disasterType').value;
  const latitude = document.getElementById('latitude').value;
  const longitude = document.getElementById('longitude').value;

  if (!disasterType) {
    showNotification('Please select a disaster type', 'warning');
    return false;
  }

  if (!latitude || !longitude) {
    showNotification('Please set a location on the map', 'warning');
    return false;
  }

  return true;
}

function submitReport() {
  const submitBtn = document.getElementById('submitBtn');

  // Disable button
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.6';
  submitBtn.style.cursor = 'not-allowed';

  // Collect data
  const reportData = {
    id: 'RPT-' + Date.now(),
    userId: 'citizen-' + Math.random().toString(36).substr(2, 9),
    type: document.getElementById('disasterType').value,
    latitude: parseFloat(document.getElementById('latitude').value),
    longitude: parseFloat(document.getElementById('longitude').value),
    severity: parseInt(document.getElementById('severity').value),
    photoName: document.getElementById('photoInput').files[0]?.name || null,
    timestamp: new Date().toISOString(),
    status: 'pending'
  };

  console.log('✓ Submitting report:', reportData);

  // Simulate submission delay
  setTimeout(() => {
    // Save to storage (commented out localStorage usage)
    // let pendingReports = JSON.parse(localStorage.getItem('pendingReports')) || [];
    // pendingReports.push(reportData);
    // localStorage.setItem('pendingReports', JSON.stringify(pendingReports));

    showSuccessModal();

    // Reset after delay
    setTimeout(() => {
      resetForm();
      // window.location.href = 'index.html';
    }, 3000);
  }, 1500);
}

function showSuccessModal() {
  const overlay = document.getElementById('successOverlay');
  overlay.classList.add('show');

  // Reinitialize icons in modal
  setTimeout(() => feather.replace(), 100);
}

function resetForm() {
  const reportForm = document.getElementById('reportForm');
  const submitBtn = document.getElementById('submitBtn');

  reportForm.reset();

  // Reset type buttons
  document.querySelectorAll('.type-card').forEach(btn => {
    btn.classList.remove('active');
  });

  // Reset severity
  const severitySlider = document.getElementById('severity');
  severitySlider.value = 3;
  severitySlider.dispatchEvent(new Event('input'));

  // Reset photo
  document.getElementById('uploadPreview').classList.remove('active');
  document.getElementById('uploadPlaceholder').style.display = 'flex';

  // Reset progress
  resetProgress();

  // Re-enable submit
  submitBtn.disabled = false;
  submitBtn.style.opacity = '1';
  submitBtn.style.cursor = 'pointer';

  feather.replace();
}

// ==== PROGRESS TRACKER ====

function initializeProgress() {
  // Initially set step 1 as active
  updateProgressStep(1, false);
}

function updateProgressStep(stepNumber, completed) {
  const steps = document.querySelectorAll('.progress-step');
  const targetStep = steps[stepNumber - 1];

  if (!targetStep) return;

  if (completed) {
    targetStep.classList.add('completed');
    targetStep.classList.add('active');

    // Activate next step
    if (stepNumber < 4) {
      const nextStep = steps[stepNumber];
      nextStep.classList.add('active');
    }
  } else {
    targetStep.classList.add('active');
  }

  // Reinitialize icons
  setTimeout(() => feather.replace(), 50);
}

function resetProgress() {
  const steps = document.querySelectorAll('.progress-step');
  steps.forEach(step => {
    step.classList.remove('active', 'completed');
  });
  updateProgressStep(1, false);
}

// ==== FILE UPLOAD ====

function initializeUpload() {
  const uploadZone = document.getElementById('uploadZone');
  const photoInput = document.getElementById('photoInput');
  const uploadPreview = document.getElementById('uploadPreview');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  const previewImage = document.getElementById('previewImage');
  const removePhoto = document.getElementById('removePhoto');

  // Click to upload
  uploadZone.addEventListener('click', function (e) {
    if (!e.target.closest('.preview-remove')) {
      photoInput.click();
    }
  });

  // File input change
  photoInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      displayImagePreview(file);
      updateProgressStep(4, true);
    }
  });

  // Drag and drop
  uploadZone.addEventListener('dragover', function (e) {
    e.preventDefault();
    this.style.borderColor = 'var(--primary-color)';
    this.style.background = 'rgba(0, 217, 163, 0.05)';
  });

  uploadZone.addEventListener('dragleave', function () {
    this.style.borderColor = 'var(--border-color)';
    this.style.background = 'var(--input-bg)';
  });

  uploadZone.addEventListener('drop', function (e) {
    e.preventDefault();
    this.style.borderColor = 'var(--border-color)';
    this.style.background = 'var(--input-bg)';

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      photoInput.files = e.dataTransfer.files;
      displayImagePreview(file);
      updateProgressStep(4, true);
    }
  });

  // Remove photo
  removePhoto.addEventListener('click', function (e) {
    e.stopPropagation();
    photoInput.value = '';
    uploadPreview.classList.remove('active');
    uploadPlaceholder.style.display = 'flex';

    console.log('✗ Photo removed');
  });
}

function displayImagePreview(file) {
  const uploadPreview = document.getElementById('uploadPreview');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  const previewImage = document.getElementById('previewImage');

  const reader = new FileReader();

  reader.onload = function (e) {
    previewImage.src = e.target.result;
    uploadPlaceholder.style.display = 'none';
    uploadPreview.classList.add('active');

    // Reinitialize icons
    setTimeout(() => feather.replace(), 100);
  };

  reader.readAsDataURL(file);

  console.log('✓ Photo selected:', file.name, '-', (file.size / 1024).toFixed(2), 'KB');
}

// ==== UTILITY FUNCTIONS ====

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${type === 'warning' ? '#FFB800' : '#00D9A3'};
    color: #0A0E27;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: slideInRight 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ==== SYSTEM READY ====

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  DISASTER REPORTING SYSTEM INITIALIZED  ');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✓ Map initialized');
console.log('✓ Form handlers ready');
console.log('✓ Upload system active');
console.log('✓ Progress tracking enabled');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');