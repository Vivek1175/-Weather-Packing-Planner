/**
 * Atmosphere — Interactive Weather & Packing Planner
 * Advanced Vanilla JS Architecture
 */

(function () {
  'use strict';

  // =========================================================================
  // State Management
  // =========================================================================
  const state = {
    unit: 'metric', // 'metric' (°C, km/h) or 'imperial' (°F, mph)
    currentCity: '',
    weatherData: null, // Full raw data from API
    checklistItems: [], // Data-driven packing items
    history: [], // Search history array
    isAudioPlaying: false, // Ambient rain sound state
    audioCtx: null,
    audioNoiseNode: null,
    audioGainNode: null
  };

  // =========================================================================
  // WMO Weather Code Mappings (Open-Meteo Standard)
  // =========================================================================
  const WMO_CODES = {
    0: { label: 'Clear Sky', icon: 'fa-sun', theme: 'theme-sunny' },
    1: { label: 'Mainly Clear', icon: 'fa-sun', theme: 'theme-sunny' },
    2: { label: 'Partly Cloudy', icon: 'fa-cloud-sun', theme: 'theme-cloudy' },
    3: { label: 'Overcast', icon: 'fa-cloud', theme: 'theme-cloudy' },
    45: { label: 'Foggy', icon: 'fa-smog', theme: 'theme-cloudy' },
    48: { label: 'Depositing Rime Fog', icon: 'fa-smog', theme: 'theme-cloudy' },
    51: { label: 'Light Drizzle', icon: 'fa-cloud-rain', theme: 'theme-rainy' },
    53: { label: 'Moderate Drizzle', icon: 'fa-cloud-rain', theme: 'theme-rainy' },
    55: { label: 'Dense Drizzle', icon: 'fa-cloud-showers-heavy', theme: 'theme-rainy' },
    61: { label: 'Slight Rain', icon: 'fa-cloud-rain', theme: 'theme-rainy' },
    63: { label: 'Moderate Rain', icon: 'fa-cloud-showers-heavy', theme: 'theme-rainy' },
    65: { label: 'Heavy Rain', icon: 'fa-cloud-showers-water', theme: 'theme-rainy' },
    71: { label: 'Slight Snow', icon: 'fa-snowflake', theme: 'theme-snowy' },
    73: { label: 'Moderate Snow', icon: 'fa-snowflake', theme: 'theme-snowy' },
    75: { label: 'Heavy Snow', icon: 'fa-snowflake', theme: 'theme-snowy' },
    80: { label: 'Slight Rain Showers', icon: 'fa-cloud-sun-rain', theme: 'theme-rainy' },
    81: { label: 'Moderate Rain Showers', icon: 'fa-cloud-showers-heavy', theme: 'theme-rainy' },
    82: { label: 'Violent Rain Showers', icon: 'fa-cloud-showers-water', theme: 'theme-rainy' },
    85: { label: 'Slight Snow Showers', icon: 'fa-snowflake', theme: 'theme-snowy' },
    86: { label: 'Heavy Snow Showers', icon: 'fa-snowflake', theme: 'theme-snowy' },
    95: { label: 'Thunderstorm', icon: 'fa-bolt-lightning', theme: 'theme-thunder' },
    96: { label: 'Thunderstorm with Hail', icon: 'fa-bolt', theme: 'theme-thunder' },
    99: { label: 'Heavy Thunderstorm', icon: 'fa-bolt-lightning', theme: 'theme-thunder' }
  };

  // =========================================================================
  // Packing Rules Engine (Data-Driven Declarative Rules)
  // =========================================================================
  const PACKING_RULES = [
    {
      id: 'rain_gear',
      condition: (data) => [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(data.current.weather_code) || (data.current.rain > 0),
      items: [
        { label: 'Compact Umbrella', icon: '☔', category: 'Essential Rain' },
        { label: 'Waterproof Rain Coat / Shell', icon: '🧥', category: 'Clothing' },
        { label: 'Waterproof Boots / Shoes', icon: '🥾', category: 'Footwear' }
      ]
    },
    {
      id: 'freezing_cold',
      condition: (data) => data.current.temperature_2m < 5,
      items: [
        { label: 'Heavy Insulated Winter Coat', icon: '🧥', category: 'Cold Wear' },
        { label: 'Thermal Base Layers', icon: '👕', category: 'Cold Wear' },
        { label: 'Insulated Winter Gloves', icon: '🧤', category: 'Accessories' },
        { label: 'Warm Wool Scarf & Beanie', icon: '🧣', category: 'Accessories' }
      ]
    },
    {
      id: 'chilly',
      condition: (data) => data.current.temperature_2m >= 5 && data.current.temperature_2m < 15,
      items: [
        { label: 'Fleece / Mid-layer Sweater', icon: '👔', category: 'Clothing' },
        { label: 'Light Jacket or Cardigan', icon: '🧥', category: 'Clothing' }
      ]
    },
    {
      id: 'hot_weather',
      condition: (data) => data.current.temperature_2m >= 28,
      items: [
        { label: 'Breathable Shorts & Tees', icon: '🩳', category: 'Summer Wear' },
        { label: 'High SPF Sunscreen (50+)', icon: '🧴', category: 'Sun Protection' },
        { label: 'UV Protection Sunglasses', icon: '🕶️', category: 'Accessories' },
        { label: 'Reusable Water Bottle', icon: '💧', category: 'Hydration' }
      ]
    },
    {
      id: 'high_humidity',
      condition: (data) => data.current.relative_humidity_2m > 70,
      items: [
        { label: 'Quick-Dry Breathable Fabrics', icon: '👕', category: 'Comfort' },
        { label: 'Anti-Frizz Spray / Deodorant', icon: '✨', category: 'Toiletries' }
      ]
    },
    {
      id: 'snow_gear',
      condition: (data) => [71, 73, 75, 85, 86].includes(data.current.weather_code) || (data.current.snowfall > 0),
      items: [
        { label: 'Waterproof Snow Boots', icon: '🥾', category: 'Footwear' },
        { label: 'Hand & Foot Warmers', icon: '🔥', category: 'Cold Wear' }
      ]
    },
    {
      id: 'windy',
      condition: (data) => data.current.wind_speed_10m > 20,
      items: [
        { label: 'Windbreaker Jacket', icon: '🧥', category: 'Outerwear' },
        { label: 'Hair ties / Strap for Glasses', icon: '🎀', category: 'Accessories' }
      ]
    },
    {
      id: 'high_uv',
      condition: (data) => (data.daily && data.daily.uv_index_max && data.daily.uv_index_max[0] >= 6),
      items: [
        { label: 'Wide-Brim Sun Hat / Cap', icon: '🧢', category: 'Sun Protection' },
        { label: 'Lip Balm with SPF', icon: '💄', category: 'Toiletries' }
      ]
    },
    {
      id: 'always_pack',
      condition: () => true,
      items: [
        { label: 'Travel Documents & ID', icon: '📄', category: 'Essentials' },
        { label: 'Phone & Power Bank Charger', icon: '🔌', category: 'Electronics' },
        { label: 'Personal Toiletries Kit', icon: '🪥', category: 'Toiletries' }
      ]
    }
  ];

  // =========================================================================
  // DOM Element Cache
  // =========================================================================
  const DOM = {
    searchForm: document.getElementById('searchForm'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    searchSubmitBtn: document.getElementById('searchSubmitBtn'),
    geoBtn: document.getElementById('geoBtn'),
    historyChips: document.getElementById('historyChips'),
    errorToast: document.getElementById('errorToast'),
    errorMessage: document.getElementById('errorMessage'),
    closeErrorBtn: document.getElementById('closeErrorBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    
    // Header Actions
    voiceBriefBtn: document.getElementById('voiceBriefBtn'),
    rainAudioBtn: document.getElementById('rainAudioBtn'),
    unitToggle: document.getElementById('unitToggle'),
    
    // Hero Weather
    cityName: document.getElementById('cityName'),
    currentDate: document.getElementById('currentDate'),
    conditionBadge: document.getElementById('conditionBadge'),
    weatherMainIcon: document.getElementById('weatherMainIcon'),
    mainTemp: document.getElementById('mainTemp'),
    mainTempUnit: document.getElementById('mainTempUnit'),
    conditionDesc: document.getElementById('conditionDesc'),
    feelsLikeTemp: document.getElementById('feelsLikeTemp'),
    
    // Stats
    humidityVal: document.getElementById('humidityVal'),
    windVal: document.getElementById('windVal'),
    pressureVal: document.getElementById('pressureVal'),
    uvVal: document.getElementById('uvVal'),
    
    // Packing
    packingSummaryText: document.getElementById('packingSummaryText'),
    packingProgressCount: document.getElementById('packingProgressCount'),
    progressFill: document.getElementById('progressFill'),
    checklistContainer: document.getElementById('checklistContainer'),
    resetPackingBtn: document.getElementById('resetPackingBtn'),
    customItemForm: document.getElementById('customItemForm'),
    customItemInput: document.getElementById('customItemInput'),
    rainAlertBanner: document.getElementById('rainAlertBanner'),
    speakRainAlertBtn: document.getElementById('speakRainAlertBtn'),
    
    // Forecasts
    hourlyStrip: document.getElementById('hourlyStrip'),
    dailyGrid: document.getElementById('dailyGrid')
  };

  // =========================================================================
  // Helper Math & Unit Converters
  // =========================================================================
  function cToF(celsius) {
    return Math.round((celsius * 9) / 5 + 32);
  }

  function kmhToMph(kmh) {
    return Math.round(kmh * 0.621371);
  }

  function formatDate(dateString) {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  }

  function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  // =========================================================================
  // Weather API Service (Open-Meteo Geocoding + Forecast)
  // =========================================================================
  async function fetchWeatherData(cityName) {
    showLoading(true);
    hideError();

    try {
      // Step 1: Geocoding Lookup
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      
      if (!geoRes.ok) throw new Error('Network error during location lookup.');
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`City "${cityName}" not found. Please check spelling.`);
      }

      const location = geoData.results[0];
      const { latitude, longitude, name, country } = location;
      const formattedCityName = country ? `${name}, ${country}` : name;

      // Step 2: Weather Forecast Query
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto`;
      
      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) throw new Error('Failed to retrieve forecast data.');
      
      const weatherData = await weatherRes.json();

      // Update State
      state.currentCity = formattedCityName;
      state.weatherData = weatherData;

      // Save to History
      saveToHistory(formattedCityName);

      // Render UI
      renderAll();

    } catch (err) {
      showError(err.message || 'Unable to fetch weather data.');
    } finally {
      showLoading(false);
    }
  }

  // Fetch Weather by Latitude & Longitude (Geolocation)
  async function fetchWeatherByCoords(lat, lon) {
    showLoading(true);
    hideError();

    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto`;
      
      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) throw new Error('Failed to retrieve location forecast.');
      
      const weatherData = await weatherRes.json();

      state.currentCity = 'Current Location';
      state.weatherData = weatherData;

      renderAll();
    } catch (err) {
      showError(err.message || 'Unable to fetch weather for current location.');
    } finally {
      showLoading(false);
    }
  }

  // =========================================================================
  // Rendering Engine
  // =========================================================================
  function renderAll() {
    if (!state.weatherData) return;

    renderHeroCard();
    renderTheme();
    generatePackingList();
    renderHourlyForecast();
    renderDailyForecast();
  }

  // Render Theme CSS custom variables
  function renderTheme() {
    const code = state.weatherData.current.weather_code;
    const info = WMO_CODES[code] || WMO_CODES[0];

    // Remove old theme classes
    document.body.className = '';
    document.body.classList.add(info.theme);
  }

  // Render Hero Weather Card
  function renderHeroCard() {
    const current = state.weatherData.current;
    const daily = state.weatherData.daily;
    const code = current.weather_code;
    const info = WMO_CODES[code] || WMO_CODES[0];

    DOM.cityName.textContent = state.currentCity;
    DOM.currentDate.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });

    DOM.conditionBadge.textContent = info.label;
    DOM.conditionDesc.textContent = `${info.label} & Conditions`;
    DOM.weatherMainIcon.innerHTML = `<i class="fa-solid ${info.icon}"></i>`;

    // Temperature & Units
    if (state.unit === 'imperial') {
      DOM.mainTemp.textContent = cToF(current.temperature_2m);
      DOM.mainTempUnit.textContent = '°F';
      DOM.feelsLikeTemp.textContent = cToF(current.apparent_temperature);
      DOM.windVal.textContent = `${kmhToMph(current.wind_speed_10m)} mph`;
    } else {
      DOM.mainTemp.textContent = Math.round(current.temperature_2m);
      DOM.mainTempUnit.textContent = '°C';
      DOM.feelsLikeTemp.textContent = Math.round(current.apparent_temperature);
      DOM.windVal.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    }

    DOM.humidityVal.textContent = `${current.relative_humidity_2m}%`;
    DOM.pressureVal.textContent = `${Math.round(current.surface_pressure)} hPa`;

    const uvMax = (daily && daily.uv_index_max) ? Math.round(daily.uv_index_max[0]) : 3;
    DOM.uvVal.textContent = `${uvMax} (${getUvDesc(uvMax)})`;
  }

  function getUvDesc(uv) {
    if (uv <= 2) return 'Low';
    if (uv <= 5) return 'Moderate';
    if (uv <= 7) return 'High';
    if (uv <= 10) return 'Very High';
    return 'Extreme';
  }

  // =========================================================================
  // Packing Rules Evaluator & Render
  // =========================================================================
  function generatePackingList() {
    if (!state.weatherData) return;

    // Evaluate rules
    let items = [];
    PACKING_RULES.forEach((rule) => {
      if (rule.condition(state.weatherData)) {
        rule.items.forEach((item) => {
          items.push({
            id: rule.id + '_' + item.label.toLowerCase().replace(/[^a-z0-9]/g, ''),
            label: item.label,
            icon: item.icon,
            category: item.category,
            checked: false
          });
        });
      }
    });

    // Deduplicate items by label
    const uniqueMap = new Map();
    items.forEach((it) => uniqueMap.set(it.label, it));
    state.checklistItems = Array.from(uniqueMap.values());

    // Show/Hide Rain Banner
    const isRaining = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(state.weatherData.current.weather_code) || state.weatherData.current.rain > 0;
    
    if (isRaining) {
      DOM.rainAlertBanner.style.display = 'flex';
    } else {
      DOM.rainAlertBanner.style.display = 'none';
    }

    renderChecklist();
  }

  function renderChecklist() {
    DOM.checklistContainer.innerHTML = '';

    if (state.checklistItems.length === 0) {
      DOM.checklistContainer.innerHTML = '<p class="text-muted">No specific packing suggestions for this weather.</p>';
      return;
    }

    let checkedCount = 0;

    state.checklistItems.forEach((item, index) => {
      if (item.checked) checkedCount++;

      const div = document.createElement('div');
      div.className = `checklist-item ${item.checked ? 'checked' : ''}`;
      div.dataset.index = index;

      div.innerHTML = `
        <div class="item-left">
          <div class="custom-checkbox">
            ${item.checked ? '<i class="fa-solid fa-check"></i>' : ''}
          </div>
          <span class="item-icon">${item.icon}</span>
          <span class="item-text">${item.label}</span>
        </div>
        <span class="item-badge">${item.category}</span>
      `;

      div.addEventListener('click', () => {
        state.checklistItems[index].checked = !state.checklistItems[index].checked;
        renderChecklist();
      });

      DOM.checklistContainer.appendChild(div);
    });

    // Update Progress Bar
    const total = state.checklistItems.length;
    const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
    DOM.packingProgressCount.textContent = `${checkedCount} / ${total} items (${percent}%)`;
    DOM.progressFill.style.width = `${percent}%`;
  }

  // =========================================================================
  // Forecast Renderers
  // =========================================================================
  function renderHourlyForecast() {
    DOM.hourlyStrip.innerHTML = '';
    const hourly = state.weatherData.hourly;

    if (!hourly || !hourly.time) return;

    // Display next 24 hours
    const currentHourIndex = new Date().getHours();
    const hoursToDisplay = 24;

    for (let i = currentHourIndex; i < currentHourIndex + hoursToDisplay && i < hourly.time.length; i++) {
      const timeStr = hourly.time[i];
      const tempC = hourly.temperature_2m[i];
      const code = hourly.weather_code[i];
      const info = WMO_CODES[code] || WMO_CODES[0];

      const tempDisplay = state.unit === 'imperial' ? `${cToF(tempC)}°` : `${Math.round(tempC)}°`;

      const card = document.createElement('div');
      card.className = 'hourly-card';
      card.innerHTML = `
        <div class="hourly-time">${formatTime(timeStr)}</div>
        <div class="hourly-icon"><i class="fa-solid ${info.icon}"></i></div>
        <div class="hourly-temp">${tempDisplay}</div>
      `;
      DOM.hourlyStrip.appendChild(card);
    }
  }

  function renderDailyForecast() {
    DOM.dailyGrid.innerHTML = '';
    const daily = state.weatherData.daily;

    if (!daily || !daily.time) return;

    // Display next 3 to 5 days
    for (let i = 0; i < Math.min(5, daily.time.length); i++) {
      const dateStr = daily.time[i];
      const maxC = daily.temperature_2m_max[i];
      const minC = daily.temperature_2m_min[i];
      const code = daily.weather_code[i];
      const info = WMO_CODES[code] || WMO_CODES[0];

      const maxDisplay = state.unit === 'imperial' ? `${cToF(maxC)}°` : `${Math.round(maxC)}°`;
      const minDisplay = state.unit === 'imperial' ? `${cToF(minC)}°` : `${Math.round(minC)}°`;

      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });

      const card = document.createElement('div');
      card.className = 'daily-card';
      card.innerHTML = `
        <div class="daily-name">${dayName}</div>
        <div class="daily-date">${new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        <div class="daily-icon"><i class="fa-solid ${info.icon}"></i></div>
        <div class="daily-status">${info.label}</div>
        <div class="daily-temps">
          <span class="max-temp">${maxDisplay}</span>
          <span class="min-temp">${minDisplay}</span>
        </div>
      `;
      DOM.dailyGrid.appendChild(card);
    }
  }

  // =========================================================================
  // Voice Assistant & Web Audio FX Engine
  // =========================================================================
  function speakWeatherBriefing() {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    window.speechSynthesis.cancel(); // Stop active speech

    if (!state.weatherData) {
      const msg = new SpeechSynthesisUtterance("Please search for a city first to hear the weather briefing.");
      window.speechSynthesis.speak(msg);
      return;
    }

    const current = state.weatherData.current;
    const code = current.weather_code;
    const info = WMO_CODES[code] || WMO_CODES[0];
    const temp = state.unit === 'imperial' ? `${cToF(current.temperature_2m)} degrees Fahrenheit` : `${Math.round(current.temperature_2m)} degrees Celsius`;

    let speechText = `Weather forecast for ${state.currentCity}. Currently it is ${temp} with ${info.label}. Humidity is ${current.relative_humidity_2m} percent. `;

    const isRaining = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code) || current.rain > 0;
    
    if (isRaining) {
      speechText += "Rain warning in effect! Please remember to carry an umbrella and wear a waterproof jacket. ";
    }

    // Mention top 3 packing items
    const topItems = state.checklistItems.slice(0, 3).map(i => i.label).join(', ');
    if (topItems) {
      speechText += `Recommended items for your packing list include: ${topItems}. Have a wonderful day!`;
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    DOM.voiceBriefBtn.classList.add('active');
    utterance.onend = () => DOM.voiceBriefBtn.classList.remove('active');

    window.speechSynthesis.speak(utterance);
  }

  // Procedural Web Audio Ambient Rain Sound Synthesizer
  function toggleRainAudio() {
    if (state.isAudioPlaying) {
      stopRainAudio();
    } else {
      startRainAudio();
    }
  }

  function startRainAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      state.audioCtx = new AudioCtx();

      // Create White Noise Buffer (Rain Sound Generator)
      const bufferSize = state.audioCtx.sampleRate * 2;
      const buffer = state.audioCtx.createBuffer(1, bufferSize, state.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      state.audioNoiseNode = state.audioCtx.createBufferSource();
      state.audioNoiseNode.buffer = buffer;
      state.audioNoiseNode.loop = true;

      // Filter to shape into gentle rain noise
      const filter = state.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, state.audioCtx.currentTime);

      state.audioGainNode = state.audioCtx.createGain();
      state.audioGainNode.gain.setValueAtTime(0.15, state.audioCtx.currentTime);

      state.audioNoiseNode.connect(filter);
      filter.connect(state.audioGainNode);
      state.audioGainNode.connect(state.audioCtx.destination);

      state.audioNoiseNode.start();
      state.isAudioPlaying = true;

      DOM.rainAudioBtn.classList.add('active');
      DOM.rainAudioBtn.querySelector('.btn-text').textContent = 'Stop Rain';
    } catch (e) {
      console.warn('AudioContext failed:', e);
    }
  }

  function stopRainAudio() {
    if (state.audioNoiseNode) {
      try { state.audioNoiseNode.stop(); } catch (e) {}
    }
    if (state.audioCtx) {
      try { state.audioCtx.close(); } catch (e) {}
    }
    state.isAudioPlaying = false;
    DOM.rainAudioBtn.classList.remove('active');
    DOM.rainAudioBtn.querySelector('.btn-text').textContent = 'Rain Audio';
  }

  // =========================================================================
  // Search History & LocalStorage
  // =========================================================================
  function loadHistory() {
    const saved = localStorage.getItem('atmosphere_history');
    if (saved) {
      try {
        state.history = JSON.parse(saved);
      } catch (e) {
        state.history = [];
      }
    } else {
      state.history = ['London', 'New York', 'Tokyo', 'Paris', 'Sydney'];
    }
    renderHistoryChips();
  }

  function saveToHistory(cityName) {
    // Keep top 5 unique entries
    state.history = [cityName, ...state.history.filter((c) => c.toLowerCase() !== cityName.toLowerCase())].slice(0, 5);
    localStorage.setItem('atmosphere_history', JSON.stringify(state.history));
    renderHistoryChips();
  }

  function renderHistoryChips() {
    DOM.historyChips.innerHTML = '';
    state.history.forEach((city) => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.textContent = city;
      chip.addEventListener('click', () => {
        DOM.searchInput.value = city;
        fetchWeatherData(city);
      });
      DOM.historyChips.appendChild(chip);
    });
  }

  // =========================================================================
  // UI Helpers & Event Listeners
  // =========================================================================
  function showLoading(show) {
    DOM.loadingOverlay.style.display = show ? 'flex' : 'none';
  }

  function showError(message) {
    DOM.errorMessage.textContent = message;
    DOM.errorToast.style.display = 'flex';
  }

  function hideError() {
    DOM.errorToast.style.display = 'none';
  }

  function initEventListeners() {
    // Search Form Submission
    DOM.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = DOM.searchInput.value.trim();
      if (query) {
        fetchWeatherData(query);
      }
    });

    // Clear search button input logic
    DOM.searchInput.addEventListener('input', () => {
      DOM.clearSearchBtn.style.display = DOM.searchInput.value.length > 0 ? 'block' : 'none';
    });

    DOM.clearSearchBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      DOM.clearSearchBtn.style.display = 'none';
      DOM.searchInput.focus();
    });

    // Geolocation button
    DOM.geoBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser.');
        return;
      }
      showLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          showLoading(false);
          showError('Unable to retrieve your location.');
        }
      );
    });

    // Error Toast Close
    DOM.closeErrorBtn.addEventListener('click', hideError);

    // Unit Toggle buttons
    DOM.unitToggle.querySelectorAll('.unit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        DOM.unitToggle.querySelectorAll('.unit-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.unit = btn.dataset.unit;
        renderAll();
      });
    });

    // Voice & Rain Audio Buttons
    DOM.voiceBriefBtn.addEventListener('click', speakWeatherBriefing);
    DOM.speakRainAlertBtn.addEventListener('click', speakWeatherBriefing);
    DOM.rainAudioBtn.addEventListener('click', toggleRainAudio);

    // Reset Packing List
    DOM.resetPackingBtn.addEventListener('click', () => {
      generatePackingList();
    });

    // Add Custom Item
    DOM.customItemForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = DOM.customItemInput.value.trim();
      if (val) {
        state.checklistItems.push({
          id: 'custom_' + Date.now(),
          label: val,
          icon: '📦',
          category: 'Personal',
          checked: false
        });
        DOM.customItemInput.value = '';
        renderChecklist();
      }
    });
  }

  // Initialize App
  function init() {
    loadHistory();
    initEventListeners();
    
    // Default initial search
    fetchWeatherData('London');
  }

  // Run on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
