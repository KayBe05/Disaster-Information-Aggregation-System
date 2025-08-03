document.addEventListener('DOMContentLoaded', function () {
    const header = document.querySelector('header');
    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Initialize Feather icons
    feather.replace();

    // Initialize tab navigation
    initializeTabs();

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const lat = urlParams.get('lat');
    const lng = urlParams.get('lng');

    // Update location info
    document.getElementById('location-title').textContent = 'Location Details';
    document.getElementById('coordinates').textContent = `Coordinates: ${lat}, ${lng}`;

    // Fetch all data
    fetchAllLocationData(lat, lng);

    // Initialize additional features
    initializeLocationSearch();
    initializeExportFunctionality();
});

// Tab navigation functionality
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // Remove active class from all tabs and buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            btn.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
}

// Enhanced data fetching orchestrator
async function fetchAllLocationData(lat, lng) {
    const promises = [
        fetchLocationName(lat, lng),
        fetchWeatherData(lat, lng),
        fetchElevationData(lat, lng),
        fetchEarthquakeData(lat, lng),
        fetchAirQualityData(lat, lng),
        fetchLocalTimeData(lat, lng)
    ];

    // Execute all API calls concurrently for better performance
    await Promise.allSettled(promises);

    // Calculate disaster risks after other data loads
    setTimeout(() => calculateDisasterRisks(lat, lng), 1000);
}

// Generic fetch function for better error handling and consistency
async function fetchData(url, options = {}, loadingElementId = null, errorMessage = 'Failed to fetch data') {
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`${errorMessage}:`, error);

        if (loadingElementId) {
            showError(loadingElementId, errorMessage, error.message);
        }

        throw error;
    }
}

// Generic loading state management
function showLoading(elementId, message = 'Loading...') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }
}

// Reverse geocoding to get location name
async function fetchLocationName(lat, lng) {
    try {
        showLoading('location-name', 'Getting location name...');

        const url = `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lng}&count=1&format=json`;
        const data = await fetchData(url);

        if (data.results && data.results.length > 0) {
            const location = data.results[0];
            const locationName = `${location.name}${location.admin1 ? ', ' + location.admin1 : ''}${location.country ? ', ' + location.country : ''}`;

            document.getElementById('location-title').textContent = locationName;
            document.getElementById('location-name').innerHTML = `
                <div class="location-info">
                    <i data-feather="map-pin"></i>
                    <span>${locationName}</span>
                </div>
            `;
        } else {
            document.getElementById('location-name').innerHTML = `
                <div class="location-info">
                    <i data-feather="map-pin"></i>
                    <span>Location: ${lat}, ${lng}</span>
                </div>
            `;
        }

        feather.replace();
    } catch (error) {
        document.getElementById('location-name').innerHTML = `
            <div class="location-info error">
                <i data-feather="alert-circle"></i>
                <span>Location: ${lat}, ${lng}</span>
            </div>
        `;
        feather.replace();
    }
}

// Air quality data
async function fetchAirQualityData(lat, lng) {
    const containerId = 'air-quality-loading';
    const dataId = 'air-quality-data';

    try {
        showLoading(containerId, 'Loading air quality data...');

        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi`;
        const data = await fetchData(url);

        displayAirQualityData(data);
        showDataSection(containerId, dataId);
    } catch (error) {
        showError(containerId, 'Failed to load air quality data', error.message);
    }
}

function displayAirQualityData(data) {
    if (!data || !data.current) {
        showError('air-quality-loading', 'Air quality data not available');
        return;
    }

    const current = data.current;
    const aqi = current.us_aqi || 0;
    const aqiLevel = getAQILevel(aqi);

    const container = document.getElementById('air-quality-content') || document.getElementById('air-quality-data');

    container.innerHTML = `
        <div class="aqi-overview">
            <div class="aqi-badge ${aqiLevel.class}">
                <i data-feather="${aqiLevel.icon}"></i>
                <div class="aqi-info">
                    <span class="aqi-value">${aqi}</span>
                    <span class="aqi-label">${aqiLevel.label}</span>
                </div>
            </div>
        </div>
        
        <div class="pollutant-grid">
            <div class="pollutant-item">
                <i data-feather="wind"></i>
                <span class="pollutant-name">PM2.5</span>
                <span class="pollutant-value">${(current.pm2_5 || 0).toFixed(1)} μg/m³</span>
            </div>
            <div class="pollutant-item">
                <i data-feather="wind"></i>
                <span class="pollutant-name">PM10</span>
                <span class="pollutant-value">${(current.pm10 || 0).toFixed(1)} μg/m³</span>
            </div>
            <div class="pollutant-item">
                <i data-feather="cloud"></i>
                <span class="pollutant-name">CO</span>
                <span class="pollutant-value">${(current.carbon_monoxide || 0).toFixed(0)} μg/m³</span>
            </div>
            <div class="pollutant-item">
                <i data-feather="zap"></i>
                <span class="pollutant-name">NO₂</span>
                <span class="pollutant-value">${(current.nitrogen_dioxide || 0).toFixed(1)} μg/m³</span>
            </div>
            <div class="pollutant-item">
                <i data-feather="cloud-drizzle"></i>
                <span class="pollutant-name">SO₂</span>
                <span class="pollutant-value">${(current.sulphur_dioxide || 0).toFixed(1)} μg/m³</span>
            </div>
            <div class="pollutant-item">
                <i data-feather="sun"></i>
                <span class="pollutant-name">O₃</span>
                <span class="pollutant-value">${(current.ozone || 0).toFixed(1)} μg/m³</span>
            </div>
        </div>
        
        ${aqi > 100 ? `
            <div class="air-quality-alert">
                <i data-feather="alert-triangle"></i>
                <p><strong>Health Advisory:</strong> ${aqiLevel.advice}</p>
            </div>
        ` : ''}
    `;

    feather.replace();
}

function getAQILevel(aqi) {
    if (aqi <= 50) return {
        label: 'Good',
        class: 'good',
        icon: 'check-circle',
        advice: 'Air quality is satisfactory for most people.',
        level: 'Good',
        description: 'Air quality is considered satisfactory, and air pollution poses little or no risk.'
    };
    if (aqi <= 100) return {
        label: 'Moderate',
        class: 'moderate',
        icon: 'info',
        advice: 'Air quality is acceptable for most people.',
        level: 'Moderate',
        description: 'Air quality is acceptable; however, sensitive people may experience minor issues.'
    };
    if (aqi <= 150) return {
        label: 'Unhealthy for Sensitive Groups',
        class: 'unhealthy-sensitive',
        icon: 'alert-circle',
        advice: 'Sensitive individuals should limit outdoor activities.',
        level: 'Unhealthy for Sensitive Groups',
        description: 'Members of sensitive groups may experience health effects.'
    };
    if (aqi <= 200) return {
        label: 'Unhealthy',
        class: 'unhealthy',
        icon: 'alert-triangle',
        advice: 'Everyone should limit outdoor activities.',
        level: 'Unhealthy',
        description: 'Everyone may begin to experience health effects.'
    };
    if (aqi <= 300) return {
        label: 'Very Unhealthy',
        class: 'very-unhealthy',
        icon: 'x-circle',
        advice: 'Everyone should avoid outdoor activities.',
        level: 'Very Unhealthy',
        description: 'Health warnings of emergency conditions.'
    };
    return {
        label: 'Hazardous',
        class: 'hazardous',
        icon: 'alert-octagon',
        advice: 'Emergency conditions. Everyone should stay indoors.',
        level: 'Hazardous',
        description: 'Health alert: everyone may experience serious health effects.'
    };
}

// Local time data
async function fetchLocalTimeData(lat, lng) {
    try {
        showLoading('local-time', 'Getting local time...');

        // Using WorldTimeAPI which is free and doesn't require API key
        const url = `http://worldtimeapi.org/api/timezone/Etc/GMT`;

        // Fallback to using the timezone from weather API
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m&timezone=auto`);
        const data = await response.json();

        if (data.timezone) {
            const timeUrl = `http://worldtimeapi.org/api/timezone/${encodeURIComponent(data.timezone)}`;
            try {
                const timeResponse = await fetch(timeUrl);
                const timeData = await timeResponse.json();

                const localTime = new Date(timeData.datetime);
                document.getElementById('local-time').innerHTML = `
                    <div class="time-info">
                        <i data-feather="clock"></i>
                        <div class="time-details">
                            <span class="local-time">${localTime.toLocaleTimeString()}</span>
                            <span class="local-date">${localTime.toLocaleDateString()}</span>
                            <span class="timezone">${data.timezone}</span>
                        </div>
                    </div>
                `;
            } catch (timeError) {
                // Fallback to browser time
                document.getElementById('local-time').innerHTML = `
                    <div class="time-info">
                        <i data-feather="clock"></i>
                        <span>Local time unavailable</span>
                    </div>
                `;
            }
        }

        feather.replace();
    } catch (error) {
        document.getElementById('local-time').innerHTML = `
            <div class="time-info error">
                <i data-feather="alert-circle"></i>
                <span>Time data unavailable</span>
            </div>
        `;
        feather.replace();
    }
}

// Weather icon mapping for Open-Meteo weather codes
const WEATHER_ICONS = {
    0: 'sun',      // Clear sky
    1: 'sun',      // Mainly clear
    2: 'cloud',    // Partly cloudy
    3: 'cloud',    // Overcast
    45: 'cloud-drizzle', // Fog
    48: 'cloud-drizzle', // Depositing rime fog
    51: 'cloud-drizzle', // Light drizzle
    53: 'cloud-drizzle', // Moderate drizzle
    55: 'cloud-drizzle', // Dense drizzle
    61: 'cloud-rain',    // Slight rain
    63: 'cloud-rain',    // Moderate rain
    65: 'cloud-rain',    // Heavy rain
    71: 'cloud-snow',    // Slight snow
    73: 'cloud-snow',    // Moderate snow
    75: 'cloud-snow',    // Heavy snow
    95: 'cloud-lightning', // Thunderstorm
    96: 'cloud-lightning', // Thunderstorm with hail
    99: 'cloud-lightning', // Thunderstorm with heavy hail
    default: 'cloud'
};

// Weather condition text mapping
const WEATHER_CONDITIONS = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
};

function getWeatherIcon(weatherCode) {
    return WEATHER_ICONS[weatherCode] || WEATHER_ICONS.default;
}

function getWeatherCondition(weatherCode) {
    return WEATHER_CONDITIONS[weatherCode] || 'Unknown condition';
}

function getWeatherDescription(weatherCode) {
    return WEATHER_CONDITIONS[weatherCode] || 'Unknown condition';
}

// Enhanced weather data fetching with better error handling
async function fetchWeatherData(lat, lng) {
    const loadingId = 'weather-loading';

    try {
        showLoading(loadingId, 'Loading weather forecast...');

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&current=temperature_2m,relative_humidity_2m,wind_speed_10m,apparent_temperature,surface_pressure,visibility,weather_code&forecast_days=5&timezone=auto`;
        const data = await fetchData(url);

        displayWeatherData(data);
        showDataSection(loadingId, 'weather-data');
    } catch (error) {
        showError(loadingId, 'Failed to load weather data', error.message);
    }
}

// Updated weather data display function
function displayWeatherData(data) {
    if (!data || !data.current) {
        showError('weather-loading', 'Weather data not available');
        return;
    }

    const current = data.current;

    // Update current weather
    const currentTempEl = document.getElementById('current-temp');
    const weatherDescEl = document.getElementById('weather-description');
    const feelsLikeEl = document.getElementById('feels-like');
    const humidityEl = document.getElementById('humidity');
    const windSpeedEl = document.getElementById('wind-speed');
    const visibilityEl = document.getElementById('visibility');
    const pressureEl = document.getElementById('pressure');

    if (currentTempEl) currentTempEl.textContent = `${Math.round(current.temperature_2m)}°C`;
    if (weatherDescEl) weatherDescEl.textContent = getWeatherDescription(current.weather_code);
    if (feelsLikeEl) feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
    if (humidityEl) humidityEl.textContent = `${current.relative_humidity_2m}%`;
    if (windSpeedEl) windSpeedEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    if (visibilityEl) visibilityEl.textContent = current.visibility ? `${(current.visibility / 1000).toFixed(1)} km` : 'N/A';
    if (pressureEl) pressureEl.textContent = `${Math.round(current.surface_pressure)} hPa`;

    // Update 5-day forecast
    if (data.daily) {
        displayForecast(data.daily);
    }

    // Enhanced weather display with current conditions
    const weatherContainer = document.getElementById('weather-days');
    if (weatherContainer) {
        weatherContainer.innerHTML = '';

        // Display current conditions if available
        if (data.current) {
            const currentDiv = document.createElement('div');
            currentDiv.className = 'current-weather';
            currentDiv.innerHTML = `
                <div class="current-header">
                    <h4>Current Conditions</h4>
                </div>
                <div class="current-details">
                    <div class="current-temp">
                        <i data-feather="thermometer"></i>
                        <span>${data.current.temperature_2m}°C</span>
                    </div>
                    <div class="current-detail">
                        <i data-feather="droplet"></i>
                        <span>Humidity: ${data.current.relative_humidity_2m}%</span>
                    </div>
                    <div class="current-detail">
                        <i data-feather="wind"></i>
                        <span>Wind: ${data.current.wind_speed_10m} km/h</span>
                    </div>
                </div>
            `;
            weatherContainer.appendChild(currentDiv);
        }

        // Display forecast (increased to 5 days)
        if (data.daily && data.daily.time) {
            data.daily.time.forEach((dateStr, index) => {
                const date = new Date(dateStr);
                const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
                const weatherCode = data.daily.weathercode[index];
                const iconName = getWeatherIcon(weatherCode);
                const condition = getWeatherCondition(weatherCode);

                const maxTemp = data.daily.temperature_2m_max[index];
                const minTemp = data.daily.temperature_2m_min[index];
                const avgTemp = ((maxTemp + minTemp) / 2).toFixed(1);
                const precipitation = data.daily.precipitation_sum[index] || 0;
                const windSpeed = data.daily.windspeed_10m_max[index] || 0;

                const dayElement = document.createElement('div');
                dayElement.className = 'weather-day';

                dayElement.innerHTML = `
                    <div class="weather-day-header">
                        <h4>${dayName}, ${date.toLocaleDateString()}</h4>
                    </div>
                    <div class="weather-icon">
                        <i data-feather="${iconName}"></i>
                    </div>
                    <p class="weather-condition">${condition}</p>
                    <div class="weather-details">
                        <div class="weather-detail">
                            <i data-feather="thermometer"></i>
                            <span>${avgTemp}°C</span>
                        </div>
                        <div class="weather-detail">
                            <i data-feather="trending-up"></i>
                            <span>Max: ${maxTemp}°C</span>
                        </div>
                        <div class="weather-detail">
                            <i data-feather="trending-down"></i>
                            <span>Min: ${minTemp}°C</span>
                        </div>
                        <div class="weather-detail">
                            <i data-feather="wind"></i>
                            <span>Wind: ${windSpeed} km/h</span>
                        </div>
                        <div class="weather-detail">
                            <i data-feather="cloud-rain"></i>
                            <span>Rain: ${precipitation} mm</span>
                        </div>
                    </div>
                `;
                weatherContainer.appendChild(dayElement);
            });
        }
    }
}

function displayForecast(dailyData) {
    const forecastGrid = document.getElementById('forecast-grid');
    if (!forecastGrid) return;

    forecastGrid.innerHTML = '';

    for (let i = 0; i < Math.min(5, dailyData.time.length); i++) {
        const date = new Date(dailyData.time[i]);
        const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });

        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-icon">
                <i data-feather="${getWeatherIcon(dailyData.weathercode[i])}"></i>
            </div>
            <div class="forecast-temp">
                <span class="temp-high">${Math.round(dailyData.temperature_2m_max[i])}°</span>
                <span class="temp-low">${Math.round(dailyData.temperature_2m_min[i])}°</span>
            </div>
        `;

        forecastGrid.appendChild(forecastItem);
    }

    feather.replace();
}

// Enhanced elevation data with better error handling
async function fetchElevationData(lat, lng) {
    try {
        showLoading('elevation-info', 'Getting elevation...');

        const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`;
        const data = await fetchData(url);

        if (data.results && data.results.length > 0) {
            const elevation = data.results[0].elevation;
            const elevationFt = Math.round(elevation * 3.28084); // Convert to feet

            document.getElementById('elevation').innerHTML = `
                <div class="elevation-info">
                    <i data-feather="mountain"></i>
                    <div class="elevation-details">
                        <span class="elevation-meters">${elevation} m</span>
                        <span class="elevation-feet">(${elevationFt} ft)</span>
                    </div>
                </div>
            `;
        } else {
            throw new Error('No elevation data available');
        }
    } catch (error) {
        document.getElementById('elevation').innerHTML = `
            <div class="elevation-info error">
                <i data-feather="alert-circle"></i>
                <span>Elevation: Data unavailable</span>
            </div>
        `;
    }

    feather.replace();
}

function displayElevationData(data) {
    const loadingElement = document.getElementById('elevation-loading');
    const dataElement = document.getElementById('elevation-data');

    if (!data || typeof data.elevation === 'undefined') {
        if (loadingElement) loadingElement.textContent = 'Elevation data not available';
        return;
    }

    const elevation = Array.isArray(data.elevation) ? data.elevation[0] : data.elevation;

    if (dataElement) {
        dataElement.innerHTML = `
            <div class="elevation-value">${elevation.toFixed(1)} m</div>
            <div class="elevation-desc">${elevation > 1000 ? 'High altitude' : elevation > 500 ? 'Moderate altitude' : 'Low altitude'}</div>
        `;
    }

    if (loadingElement) loadingElement.classList.add('hidden');
    if (dataElement) dataElement.classList.remove('hidden');
}

// Enhanced earthquake data fetching
async function fetchEarthquakeData(lat, lng) {
    const loadingId = 'earthquake-loading';

    try {
        showLoading(loadingId, 'Loading earthquake data...');

        const endTime = new Date().toISOString();
        const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime}&endtime=${endTime}&latitude=${lat}&longitude=${lng}&maxradiuskm=100&orderby=time&limit=20`;
        const data = await fetchData(url);

        displayEarthquakeData(data);
    } catch (error) {
        showError(loadingId, 'Failed to load earthquake data', error.message);
    }
}

// Enhanced earthquake display with better formatting
function displayEarthquakeData(data) {
    const earthquakeList = document.getElementById('earthquake-list');
    earthquakeList.innerHTML = '';

    if (data.features && data.features.length > 0) {
        // Sort earthquakes by time (most recent first)
        data.features.sort((a, b) => b.properties.time - a.properties.time);

        // Add summary stats
        const maxMag = Math.max(...data.features.map(q => q.properties.mag));
        const totalQuakes = data.features.length;

        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'earthquake-summary';
        summaryDiv.innerHTML = `
            <div class="eq-stats">
                <div class="eq-stat">
                    <i data-feather="activity"></i>
                    <span>${totalQuakes} earthquakes in 30 days</span>
                </div>
                <div class="eq-stat">
                    <i data-feather="zap"></i>
                    <span>Largest: M${maxMag.toFixed(1)}</span>
                </div>
            </div>
        `;
        earthquakeList.appendChild(summaryDiv);

        // Show only the most significant earthquakes (limit display)
        const displayQuakes = data.features.slice(0, 10);

        displayQuakes.forEach((quake) => {
            const magnitude = quake.properties.mag;
            const location = quake.properties.place;
            const time = new Date(quake.properties.time).toLocaleString();
            const depth = quake.geometry.coordinates[2];
            const distance = calculateDistance(
                parseFloat(new URLSearchParams(window.location.search).get('lat')),
                parseFloat(new URLSearchParams(window.location.search).get('lng')),
                quake.geometry.coordinates[1],
                quake.geometry.coordinates[0]
            );

            const { severityClass, severityIcon } = getEarthquakeSeverity(magnitude);

            const quakeElement = document.createElement('div');
            quakeElement.className = 'earthquake-item';

            quakeElement.innerHTML = `
                <div class="earthquake-header ${severityClass}">
                    <i data-feather="${severityIcon}"></i>
                    <h4>Magnitude ${magnitude.toFixed(1)}</h4>
                </div>
                <div class="earthquake-details">
                    <div class="eq-detail">
                        <i data-feather="map-pin"></i>
                        <span>${location}</span>
                    </div>
                    <div class="eq-detail">
                        <i data-feather="clock"></i>
                        <span>${time}</span>
                    </div>
                    <div class="eq-detail">
                        <i data-feather="arrow-down"></i>
                        <span>Depth: ${depth.toFixed(1)} km</span>
                    </div>
                    <div class="eq-detail">
                        <i data-feather="navigation"></i>
                        <span>Distance: ${distance.toFixed(0)} km</span>
                    </div>
                </div>
            `;
            earthquakeList.appendChild(quakeElement);
        });

        if (data.features.length > 10) {
            const moreDiv = document.createElement('div');
            moreDiv.className = 'earthquake-more';
            moreDiv.innerHTML = `<p><em>Showing 10 of ${data.features.length} earthquakes</em></p>`;
            earthquakeList.appendChild(moreDiv);
        }
    } else {
        earthquakeList.innerHTML = `
            <div class="no-data-message">
                <i data-feather="check-circle"></i>
                <p>No recent earthquakes found within <strong>100 km</strong>.</p>
                <p>This is good news! 🎉</p>
            </div>
        `;
    }

    showDataSection('earthquake-loading', 'earthquake-data');
}

// Utility function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Get earthquake severity info
function getEarthquakeSeverity(magnitude) {
    if (magnitude >= 6) {
        return { severityClass: 'severe', severityIcon: 'alert-octagon' };
    } else if (magnitude >= 4.5) {
        return { severityClass: 'moderate', severityIcon: 'alert-triangle' };
    } else {
        return { severityClass: 'minor', severityIcon: 'alert-circle' };
    }
}

// Enhanced disaster risk calculation using actual data
function calculateDisasterRisks(lat, lng) {
    const elevation = getElevationValue();
    const rainAmount = getRainAmount();
    const airQuality = getAirQualityIndex();

    // Enhanced risk calculations using real data
    const floodRisk = calculateFloodRisk(elevation, rainAmount, lat, lng);
    const rainRisk = calculateRainRisk(rainAmount);
    const landslideRisk = calculateLandslideRisk(elevation, rainAmount);
    const tsunamiRisk = calculateTsunamiRisk(lat, lng, elevation);
    const healthRisk = calculateHealthRisk(airQuality, rainAmount);

    // Update risk elements
    updateRiskElement('flood-risk', floodRisk, 'droplet');
    updateRiskElement('rain-risk', rainRisk, 'cloud-rain');
    updateRiskElement('landslide-risk', landslideRisk, 'layers');
    updateRiskElement('tsunami-risk', tsunamiRisk, 'wind');
    updateRiskElement('health-risk', healthRisk, 'heart');

    // Create enhanced risk chart
    createRiskChart([floodRisk, rainRisk, landslideRisk, tsunamiRisk, healthRisk]);

    showDataSection('disaster-loading', 'disaster-data');
}

// Health risk calculation based on air quality
function calculateHealthRisk(aqi, rainAmount) {
    let risk = 1;

    // Air quality impact
    if (aqi > 200) risk += 3;
    else if (aqi > 150) risk += 2;
    else if (aqi > 100) risk += 1;

    // Weather impact on health
    if (rainAmount > 20) risk += 1; // High humidity can worsen air quality effects

    return Math.min(5, Math.max(1, risk));
}

// Enhanced risk calculation functions
function calculateFloodRisk(elevation, rainAmount, lat, lng) {
    let risk = 1;

    // Low elevation increases flood risk
    if (elevation < 10) risk += 2;
    else if (elevation < 50) risk += 1;

    // High precipitation increases flood risk
    if (rainAmount > 20) risk += 2;
    else if (rainAmount > 10) risk += 1;

    // Coastal areas have higher flood risk
    if (isNearCoast(lat, lng)) risk += 1;

    return Math.min(5, Math.max(1, risk));
}

function calculateRainRisk(rainAmount) {
    if (rainAmount > 30) return 5;
    if (rainAmount > 20) return 4;
    if (rainAmount > 10) return 3;
    if (rainAmount > 5) return 2;
    return 1;
}

function calculateLandslideRisk(elevation, rainAmount) {
    if (elevation < 100) return 1; // Flat areas have minimal landslide risk

    let risk = 1;

    // Higher elevation increases risk
    if (elevation > 1000) risk += 2;
    else if (elevation > 500) risk += 1;

    // High precipitation increases landslide risk
    if (rainAmount > 15) risk += 2;
    else if (rainAmount > 8) risk += 1;

    return Math.min(5, Math.max(1, risk));
}

function calculateTsunamiRisk(lat, lng, elevation) {
    if (!isNearCoast(lat, lng)) return 1; // Inland areas have no tsunami risk

    let risk = 2; // Base risk for coastal areas

    // Very low elevation increases tsunami risk
    if (elevation < 5) risk += 2;
    else if (elevation < 20) risk += 1;

    // Certain regions have higher tsunami risk (Pacific Ring of Fire)
    if (isPacificRingOfFire(lat, lng)) risk += 1;

    return Math.min(5, Math.max(1, risk));
}

// Helper functions
function getElevationValue() {
    const elevationElement = document.querySelector('.elevation-details .elevation-meters');
    if (elevationElement) {
        const match = elevationElement.textContent.match(/(-?\d+(?:\.\d+)?)/);
        return match ? parseFloat(match[1]) : 0;
    }
    return 0;
}

function getRainAmount() {
    const weatherData = document.getElementById('weather-data');
    if (weatherData && weatherData.classList.contains('hidden')) return 0;

    const firstWeatherDay = document.querySelector('.weather-day');
    if (!firstWeatherDay) return 0;

    const rainElements = firstWeatherDay.querySelectorAll('.weather-detail');
    for (let element of rainElements) {
        const text = element.textContent;
        if (text.includes('Rain:')) {
            const match = text.match(/(\d+(?:\.\d+)?)/);
            return match ? parseFloat(match[1]) : 0;
        }
    }
    return 0;
}

function getAirQualityIndex() {
    const aqiElement = document.querySelector('.aqi-value');
    if (aqiElement) {
        return parseFloat(aqiElement.textContent) || 0;
    }
    return 0;
}

function isNearCoast(lat, lng) {
    // Enhanced coastal detection
    const absLat = Math.abs(lat);
    const absLng = Math.abs(lng);

    // Major coastal regions
    return (
        // Pacific coasts
        (lng > 120 && lng < 180 && absLat < 60) ||
        (lng > -180 && lng < -120 && absLat < 60) ||
        // Atlantic coasts
        (lng > -80 && lng < 0 && absLat < 60) ||
        // Indian Ocean coasts
        (lng > 40 && lng < 120 && absLat < 60) ||
        // Mediterranean and other seas
        (absLat < 50 && ((lng > -10 && lng < 40) || (lng > 100 && lng < 140)))
    );
}

function isPacificRingOfFire(lat, lng) {
    // Simplified check for Pacific Ring of Fire regions
    return (
        // Pacific coast of Americas
        ((lng < -110 || lng > 140) && Math.abs(lat) < 60) ||
        // Japan, Philippines, Indonesia region
        (lng > 120 && lng < 150 && lat > 0 && lat < 50) ||
        // Chile, Peru region
        (lng > -80 && lng < -70 && lat < 0)
    );
}

function updateRiskElement(elementId, riskLevel, iconName) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const riskText = getRiskText(riskLevel);
    const riskClass = getRiskClass(riskLevel);

    // Update the risk level span
    const riskLevelSpan = element.querySelector('.risk-level');
    if (riskLevelSpan) {
        riskLevelSpan.textContent = riskText;
        riskLevelSpan.className = `risk-level ${riskClass}`;
    }

    // Update the icon
    const icon = element.querySelector('i');
    if (icon) {
        icon.setAttribute('data-feather', iconName);
    }

    // Alternative approach if different HTML structure
    element.className = `risk-item tooltip risk-${riskClass}`;

    const badge = element.querySelector('.risk-badge');
    if (badge) {
        badge.textContent = riskText;
        badge.className = `risk-badge ${riskClass}`;
    }

    const iconEl = element.querySelector('.risk-info i');
    if (iconEl) {
        iconEl.setAttribute('data-feather', iconName);
    }

    feather.replace();
}

function getRiskText(riskLevel) {
    const riskTexts = ['Unknown', 'Very Low', 'Low', 'Moderate', 'High', 'Very High'];
    return riskTexts[riskLevel] || 'Unknown';
}

function getRiskClass(riskLevel) {
    const riskClasses = ['', 'very-low', 'low', 'moderate', 'high', 'very-high'];
    return riskClasses[riskLevel] || '';
}

// Enhanced chart creation with more data points
function createRiskChart(riskLevels) {
    const canvas = document.getElementById('risk-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const colors = [
        'rgba(54, 162, 235, 0.7)',   // Flood - Blue
        'rgba(75, 192, 192, 0.7)',   // Rain - Teal
        'rgba(153, 102, 255, 0.7)',  // Landslide - Purple
        'rgba(255, 99, 132, 0.7)',   // Tsunami - Red
        'rgba(255, 159, 64, 0.7)'    // Health - Orange
    ];

    const labels = ['Flood', 'Heavy Rain', 'Landslide', 'Tsunami', 'Health'];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Risk Level',
                data: riskLevels,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.7', '1')),
                borderWidth: 2,
                borderRadius: 4,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const riskText = getRiskText(context.parsed.y);
                            return `${context.label}: ${riskText} (${context.parsed.y}/5)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        callback: function (value) {
                            return getRiskText(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Enhanced error handling with retry functionality
function showError(loadingId, message, details = '') {
    const element = document.getElementById(loadingId);
    if (!element) return;

    element.innerHTML = `
        <div class="error-message">
            <div class="error-icon">
                <i data-feather="alert-circle"></i>
            </div>
            <div class="error-content">
                <h4>Oops! Something went wrong</h4>
                <p>${message}</p>
                ${details ? `<small class="error-details">${details}</small>` : ''}
                <button class="retry-btn" onclick="location.reload()">
                    <i data-feather="refresh-cw"></i>
                    Try Again
                </button>
            </div>
        </div>
    `;
    feather.replace();
}

function showDataSection(loadingId, dataId) {
    const loadingElement = document.getElementById(loadingId);
    const dataElement = document.getElementById(dataId);

    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }

    if (dataElement) {
        dataElement.classList.remove('hidden');
    }

    enhanceAccessibility();
    feather.replace();
}

// Search functionality for location lookup
function initializeLocationSearch() {
    const searchInput = document.getElementById('location-search');
    const searchBtn = document.getElementById('search-btn');

    if (!searchInput || !searchBtn) return;

    searchBtn.addEventListener('click', performLocationSearch);
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            performLocationSearch();
        }
    });
}

async function performLocationSearch() {
    const searchInput = document.getElementById('location-search');
    const query = searchInput.value.trim();

    if (!query) return;

    try {
        showLoading('search-results', 'Searching for location...');

        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
        const data = await fetchData(url);

        if (data.results && data.results.length > 0) {
            displaySearchResults(data.results);
        } else {
            document.getElementById('search-results').innerHTML = `
                <div class="no-results">
                    <i data-feather="search"></i>
                    <p>No locations found for "${query}"</p>
                    <p>Try searching for a city, country, or landmark.</p>
                </div>
            `;
        }

        feather.replace();
    } catch (error) {
        showError('search-results', 'Search failed', error.message);
    }
}

function displaySearchResults(results) {
    const container = document.getElementById('search-results');

    container.innerHTML = `
        <div class="search-results-header">
            <h4>Search Results</h4>
        </div>
        <div class="results-list">
            ${results.map(result => `
                <div class="result-item" onclick="selectLocation(${result.latitude}, ${result.longitude})">
                    <div class="result-info">
                        <h5>${result.name}</h5>
                        <p>${result.admin1 ? result.admin1 + ', ' : ''}${result.country}</p>
                        <small>${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}</small>
                    </div>
                    <i data-feather="arrow-right"></i>
                </div>
            `).join('')}
        </div>
    `;

    feather.replace();
}

function selectLocation(lat, lng) {
    // Update URL and reload page with new coordinates
    const url = new URL(window.location);
    url.searchParams.set('lat', lat);
    url.searchParams.set('lng', lng);
    window.location.href = url.toString();
}

// Export functionality for data
function initializeExportFunctionality() {
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportLocationData);
    }
}

function exportLocationData() {
    const urlParams = new URLSearchParams(window.location.search);
    const lat = urlParams.get('lat');
    const lng = urlParams.get('lng');

    const locationName = document.getElementById('location-title').textContent;
    const exportData = {
        location: {
            name: locationName,
            coordinates: { latitude: lat, longitude: lng }
        },
        timestamp: new Date().toISOString(),
        weather: extractWeatherData(),
        elevation: extractElevationData(),
        airQuality: extractAirQualityData(),
        earthquakes: extractEarthquakeData(),
        risks: extractRiskData()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `location-data-${lat}-${lng}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Helper functions for data extraction
function extractWeatherData() {
    const weatherDays = document.querySelectorAll('.weather-day');
    return Array.from(weatherDays).map(day => {
        const header = day.querySelector('.weather-day-header h4')?.textContent;
        const condition = day.querySelector('.weather-condition')?.textContent;
        const details = Array.from(day.querySelectorAll('.weather-detail')).map(detail => detail.textContent);
        return { header, condition, details };
    });
}

function extractElevationData() {
    const elevationText = document.querySelector('.elevation-details')?.textContent;
    return elevationText || 'Not available';
}

function extractAirQualityData() {
    const aqi = document.querySelector('.aqi-value')?.textContent;
    const level = document.querySelector('.aqi-label')?.textContent;
    const pollutants = Array.from(document.querySelectorAll('.pollutant-item')).map(item => ({
        name: item.querySelector('.pollutant-name')?.textContent,
        value: item.querySelector('.pollutant-value')?.textContent
    }));
    return { aqi, level, pollutants };
}

function extractEarthquakeData() {
    const earthquakes = Array.from(document.querySelectorAll('.earthquake-item')).map(item => {
        const magnitude = item.querySelector('.earthquake-header h4')?.textContent;
        const details = Array.from(item.querySelectorAll('.eq-detail')).map(detail => detail.textContent);
        return { magnitude, details };
    });
    return earthquakes;
}

function extractRiskData() {
    const risks = {};
    document.querySelectorAll('.risk-item').forEach(item => {
        const id = item.id;
        const level = item.querySelector('.risk-badge')?.textContent;
        if (id && level) {
            risks[id] = level;
        }
    });
    return risks;
}

// Accessibility improvements
function enhanceAccessibility() {
    // Add ARIA labels to dynamic content
    const weatherSection = document.getElementById('weather-data');
    if (weatherSection) {
        weatherSection.setAttribute('aria-label', 'Weather forecast information');
    }

    const earthquakeSection = document.getElementById('earthquake-data');
    if (earthquakeSection) {
        earthquakeSection.setAttribute('aria-label', 'Recent earthquake activity');
    }

    const riskSection = document.getElementById('disaster-data');
    if (riskSection) {
        riskSection.setAttribute('aria-label', 'Disaster risk assessment');
    }

    // Add keyboard navigation for interactive elements
    document.querySelectorAll('.result-item').forEach(item => {
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            }
        });
    });
}