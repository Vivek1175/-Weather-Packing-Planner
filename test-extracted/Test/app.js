// ----------------------------------------------------
// PACKING RULES ENGINE (Data-driven approach)
// ----------------------------------------------------
const PACKING_RULES = [
  {
    condition: (weather, temp, humidity) => 
      weather === 'Rain' || weather === 'Drizzle' || weather === 'Thunderstorm',
    items: ['☔ Waterproof Umbrella', '🧥 Waterproof Rain Jacket']
  },
  {
    condition: (weather, temp, humidity) => temp < 10,
    items: ['🧥 Heavy winter coat', '🧤 Warm gloves', '🧣 Cozy wool scarf']
  },
  {
    condition: (weather, temp, humidity) => temp > 30,
    items: ['🩳 Light, loose clothing', '🧴 Sunscreen lotion', '🕶️ Sunglasses']
  },
  {
    condition: (weather, temp, humidity) => humidity > 70,
    items: ['💨 Breathable cotton fabrics']
  },
  {
    condition: (weather, temp, humidity) => weather === 'Snow',
    items: ['🥾 Waterproof boots', '🧦 Thick thermal socks']
  },
  {
    condition: (weather, temp, humidity) => weather === 'Clear' && temp >= 10 && temp <= 30,
    items: ['🕶️ Sunglasses', '🧢 Cool sun cap']
  }
];

// Default items that every traveler should pack
const DEFAULT_PACKING_ITEMS = [
  '👟 Comfortable walking shoes',
  '🔋 Portable phone charger',
  '🪪 ID / Passport & Wallet',
  '🪥 Toothbrush & Toiletries'
];

// --- App State ---
let weatherData = null;
let currentUnit = 'C'; // 'C' or 'F'
let apiKey = '';
let searchHistory = [];
let packingList = [];

// --- DOM Selectors ---
const appContainer = document.getElementById('app-container');
const unitToggleInput = document.getElementById('unit-toggle-input');
const apiModeBadge = document.getElementById('api-mode-badge');

const settingsPanel = document.getElementById('settings-panel');
const settingsForm = document.getElementById('settings-form');
const apiKeyInput = document.getElementById('api-key-input');
const closeSettingsBtn = document.getElementById('close-settings-btn');

const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const geolocationBtn = document.getElementById('geolocation-btn');

const historyContainer = document.getElementById('history-container');
const historyTagsList = document.getElementById('history-tags-list');

const mockNotice = document.getElementById('mock-notice');
const errorBanner = document.getElementById('error-banner');
const errorText = document.getElementById('error-text');
const loadingContainer = document.getElementById('loading-container');
const dashboardContent = document.getElementById('dashboard-content');

// Weather card selectors
const weatherCityName = document.getElementById('weather-city-name');
const weatherConditionDesc = document.getElementById('weather-condition-desc');
const weatherTempValue = document.getElementById('weather-temp-value');
const weatherConditionIcon = document.getElementById('weather-condition-icon');
const weatherHumidityValue = document.getElementById('weather-humidity-value');
const weatherWindValue = document.getElementById('weather-wind-value');

// Lists selectors
const packingChecklistItems = document.getElementById('packing-checklist-items');
const hourlyForecastList = document.getElementById('hourly-forecast-list');
const dailyForecastList = document.getElementById('daily-forecast-list');

// --- Component Mount initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // Load API Key from localStorage
  apiKey = localStorage.getItem('weather_planner_api_key') || '';
  apiKeyInput.value = apiKey;
  updateApiBadge();

  // Load Search History
  const savedHistory = localStorage.getItem('weather_planner_history');
  if (savedHistory) {
    try {
      searchHistory = JSON.parse(savedHistory);
      renderHistory();
    } catch (e) {
      console.error(e);
    }
  }

  // Bind Events
  searchForm.addEventListener('submit', handleSearchSubmit);
  geolocationBtn.addEventListener('click', handleGeolocation);
  
  apiModeBadge.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });
  
  closeSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.add('hidden');
  });

  settingsForm.addEventListener('submit', handleSaveApiKey);
  
  unitToggleInput.addEventListener('change', () => {
    currentUnit = unitToggleInput.checked ? 'F' : 'C';
    reRenderTemps();
  });

  // Load default weather
  fetchWeather('London');
});

// --- Update API Badge UI ---
function updateApiBadge() {
  if (apiKey) {
    apiModeBadge.textContent = '🔑 API Mode';
    apiModeBadge.classList.add('configured');
  } else {
    apiModeBadge.textContent = '🧪 Mock Mode';
    apiModeBadge.classList.remove('configured');
  }
}

// --- Save API Key handler ---
function handleSaveApiKey(e) {
  e.preventDefault();
  apiKey = apiKeyInput.value.trim();
  localStorage.setItem('weather_planner_api_key', apiKey);
  updateApiBadge();
  settingsPanel.classList.add('hidden');
  alert('API Key saved successfully!');
  
  // Refresh weather
  const currentCity = weatherData ? weatherData.name : 'London';
  fetchWeather(currentCity);
}

// --- Search Form Submit handler ---
function handleSearchSubmit(e) {
  e.preventDefault();
  const query = cityInput.value.trim();
  if (query) {
    fetchWeather(query);
  }
}

// --- Search History Manager ---
function addToHistory(city) {
  if (!city) return;
  const formattedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  
  searchHistory = [
    formattedCity,
    ...searchHistory.filter(c => c.toLowerCase() !== formattedCity.toLowerCase())
  ].slice(0, 5);

  localStorage.setItem('weather_planner_history', JSON.stringify(searchHistory));
  renderHistory();
}

function renderHistory() {
  if (searchHistory.length === 0) {
    historyContainer.classList.add('hidden');
    return;
  }
  
  historyContainer.classList.remove('hidden');
  historyTagsList.innerHTML = '';
  
  searchHistory.forEach(city => {
    const tag = document.createElement('span');
    tag.className = 'history-tag';
    tag.textContent = city;
    tag.addEventListener('click', () => {
      cityInput.value = city;
      fetchWeather(city);
    });
    historyTagsList.appendChild(tag);
  });
}

// --- Temperature Converter helper ---
function formatTemp(tempC) {
  if (currentUnit === 'F') {
    const tempF = (tempC * 9/5) + 32;
    return `${Math.round(tempF)}°F`;
  }
  return `${Math.round(tempC)}°C`;
}

// --- Update UI Temperatures Client-Side ---
function reRenderTemps() {
  if (!weatherData) return;
  
  // Current Temp
  weatherTempValue.textContent = formatTemp(weatherData.temp);
  
  // Hourly Forecast
  const hourlyTempDivs = hourlyForecastList.querySelectorAll('.hourly-temp');
  weatherData.hourlyList.forEach((hour, idx) => {
    if (hourlyTempDivs[idx]) {
      hourlyTempDivs[idx].textContent = formatTemp(hour.temp);
    }
  });

  // Daily Forecast
  const dailyTempsDivs = dailyForecastList.querySelectorAll('.forecast-temps');
  weatherData.dailyForecasts.forEach((day, idx) => {
    if (dailyTempsDivs[idx]) {
      const maxSpan = dailyTempsDivs[idx].querySelector('.temp-max');
      const minSpan = dailyTempsDivs[idx].querySelector('.temp-min');
      if (maxSpan) maxSpan.textContent = formatTemp(day.tempMax);
      if (minSpan) minSpan.textContent = formatTemp(day.tempMin);
    }
  });
}

// --- Packing suggestions generation ---
function generatePackingList(weatherMain, tempC, humidity) {
  const items = [...DEFAULT_PACKING_ITEMS];
  
  // Evaluate rule conditions
  PACKING_RULES.forEach(rule => {
    if (rule.condition(weatherMain, tempC, humidity)) {
      items.push(...rule.items);
    }
  });

  // Convert list to checklist objects
  return items.map((item, index) => ({
    id: index,
    text: item,
    checked: false
  }));
}

// --- Render Packing Checklist UI ---
function renderPackingChecklist() {
  packingChecklistItems.innerHTML = '';
  
  packingList.forEach(item => {
    const label = document.createElement('label');
    label.className = `packing-item ${item.checked ? 'completed' : ''}`;
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'packing-checkbox';
    checkbox.checked = item.checked;
    
    // Toggle on change
    label.addEventListener('click', (e) => {
      // Prevent double trigger if clicking checkbox itself
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
      }
      item.checked = checkbox.checked;
      label.classList.toggle('completed', item.checked);
    });

    const textSpan = document.createElement('span');
    textSpan.className = 'packing-text';
    textSpan.textContent = item.text;

    label.appendChild(checkbox);
    label.appendChild(textSpan);
    packingChecklistItems.appendChild(label);
  });
}

// --- Dynamic Dynamic Theming Helper ---
function applyTheme(condition, temp) {
  const cond = condition.toLowerCase();
  let theme = {
    bg: 'linear-gradient(135deg, #0f172a, #1e293b)',
    accent: '#7c3aed',
    textColor: '#f3f4f6',
    cardBg: 'rgba(13, 16, 24, 0.7)'
  };

  if (cond.includes('clear') || cond.includes('sunny')) {
    if (temp > 22) {
      theme = {
        bg: 'linear-gradient(135deg, #f59e0b, #ef4444)', // warm sunset
        accent: '#eab308',
        textColor: '#ffffff',
        cardBg: 'rgba(0, 0, 0, 0.25)'
      };
    } else {
      theme = {
        bg: 'linear-gradient(135deg, #fbbf24, #f97316)', // mild sun
        accent: '#f97316',
        textColor: '#ffffff',
        cardBg: 'rgba(0, 0, 0, 0.25)'
      };
    }
  } else if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('thunderstorm')) {
    theme = {
      bg: 'linear-gradient(135deg, #374151, #1e293b, #0f172a)',
      accent: '#3b82f6',
      textColor: '#f3f4f6',
      cardBg: 'rgba(15, 23, 42, 0.6)'
    };
  } else if (cond.includes('snow')) {
    theme = {
      bg: 'linear-gradient(135deg, #e0f2fe, #bae6fd, #7dd3fc)',
      accent: '#0ea5e9',
      textColor: '#0f172a',
      cardBg: 'rgba(255, 255, 255, 0.65)'
    };
  } else if (cond.includes('cloud') || cond.includes('mist') || cond.includes('haze') || cond.includes('fog')) {
    theme = {
      bg: 'linear-gradient(135deg, #6b7280, #374151)',
      accent: '#9ca3af',
      textColor: '#f3f4f6',
      cardBg: 'rgba(31, 41, 55, 0.7)'
    };
  }

  // Set CSS Variables on document element
  appContainer.style.background = theme.bg;
  appContainer.style.color = theme.textColor;
  appContainer.style.setProperty('--accent-color', theme.accent);
  appContainer.style.setProperty('--card-bg', theme.cardBg);
}

// --- Main Weather Fetch logic ---
async function fetchWeather(city) {
  if (!city || city.trim() === '') return;

  setLoadingState(true);
  setErrorState(null);

  // MOCK DATA FALLBACK
  if (!apiKey || apiKey.trim() === '') {
    setTimeout(() => {
      try {
        const formattedCity = city.trim();
        const mockCurrent = getMockCurrentWeather(formattedCity);
        const mockForecast = getMockForecast(formattedCity);

        weatherData = {
          name: mockCurrent.name,
          temp: mockCurrent.main.temp,
          humidity: mockCurrent.main.humidity,
          windSpeed: mockCurrent.wind.speed,
          condition: mockCurrent.weather[0].main,
          description: mockCurrent.weather[0].description,
          icon: mockCurrent.weather[0].icon,
          dailyForecasts: mockForecast.dailyForecasts,
          hourlyList: mockForecast.hourlyList,
          isMock: true
        };

        renderWeatherData();
      } catch (err) {
        setErrorState('Failed to generate mock weather data.');
      } finally {
        setLoadingState(false);
      }
    }, 500);
    return;
  }

  // LIVE API QUERIES
  try {
    // 1. Fetch current weather
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city.trim())}&appid=${apiKey}&units=metric`
    );

    if (!currentRes.ok) {
      if (currentRes.status === 404) {
        throw new Error(`City "${city}" not found. Please check spelling.`);
      }
      throw new Error('Failed to fetch weather data. Check your network or API Key.');
    }

    const currentData = await currentRes.json();

    // 2. Fetch forecast details
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city.trim())}&appid=${apiKey}&units=metric`
    );

    if (!forecastRes.ok) {
      throw new Error('Failed to fetch forecast details.');
    }

    const forecastData = await forecastRes.json();

    // 3. Process 3-Day Forecast
    const dailyForecasts = [];
    const seenDates = new Set();
    const todayString = new Date().toISOString().split('T')[0];

    for (const item of forecastData.list) {
      const dateStr = item.dt_txt.split(' ')[0];
      if (dateStr === todayString) continue;

      if (!seenDates.has(dateStr)) {
        if (dailyForecasts.length >= 3) break;

        const noonItem = forecastData.list.find(
          f => f.dt_txt.startsWith(dateStr) && f.dt_txt.includes('12:00:00')
        ) || item;

        // Daily min/max
        let tempMin = noonItem.main.temp_min;
        let tempMax = noonItem.main.temp_max;
        for (const f of forecastData.list) {
          if (f.dt_txt.startsWith(dateStr)) {
            if (f.main.temp_min < tempMin) tempMin = f.main.temp_min;
            if (f.main.temp_max > tempMax) tempMax = f.main.temp_max;
          }
        }

        dailyForecasts.push({
          date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          tempMin: tempMin,
          tempMax: tempMax,
          condition: noonItem.weather[0].main,
          icon: noonItem.weather[0].icon
        });

        seenDates.add(dateStr);
      }
    }

    // 4. Process Hourly Strip (next 24 hours)
    const hourlyList = forecastData.list.slice(0, 8).map(item => {
      const time = new Date(item.dt * 1000).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return {
        time,
        temp: item.main.temp,
        condition: item.weather[0].main,
        icon: item.weather[0].icon
      };
    });

    weatherData = {
      name: currentData.name,
      temp: currentData.main.temp,
      humidity: currentData.main.humidity,
      windSpeed: currentData.wind.speed,
      condition: currentData.weather[0].main,
      description: currentData.weather[0].description,
      icon: currentData.weather[0].icon,
      dailyForecasts,
      hourlyList,
      isMock: false
    };

    renderWeatherData();

  } catch (err) {
    setErrorState(err.message || 'An unexpected error occurred.');
  } finally {
    setLoadingState(false);
  }
}

// --- Geolocation Support ---
function handleGeolocation() {
  if (!navigator.geolocation) {
    setErrorState('Geolocation is not supported by your browser.');
    return;
  }

  setLoadingState(true);
  setErrorState(null);

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      if (!apiKey || apiKey.trim() === '') {
        // Mock geolocation search
        setTimeout(() => {
          weatherData = {
            name: 'Current Location (Mocked)',
            temp: 22.1,
            humidity: 61,
            windSpeed: 3.5,
            condition: 'Clear',
            description: 'clear sky',
            icon: '01d',
            dailyForecasts: getMockForecast('Your Location').dailyForecasts,
            hourlyList: getMockForecast('Your Location').hourlyList,
            isMock: true
          };
          renderWeatherData();
          setLoadingState(false);
        }, 500);
        return;
      }

      try {
        const currentRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );
        if (!currentRes.ok) throw new Error('Failed to fetch weather at location.');
        const currentData = await currentRes.json();

        const forecastRes = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );
        if (!forecastRes.ok) throw new Error('Failed to fetch forecast details.');
        const forecastData = await forecastRes.json();

        // Process forecast (same logic as search)
        const dailyForecasts = [];
        const seenDates = new Set();
        const todayString = new Date().toISOString().split('T')[0];

        for (const item of forecastData.list) {
          const dateStr = item.dt_txt.split(' ')[0];
          if (dateStr === todayString) continue;

          if (!seenDates.has(dateStr)) {
            if (dailyForecasts.length >= 3) break;
            const noonItem = forecastData.list.find(
              f => f.dt_txt.startsWith(dateStr) && f.dt_txt.includes('12:00:00')
            ) || item;

            let tempMin = noonItem.main.temp_min;
            let tempMax = noonItem.main.temp_max;
            for (const f of forecastData.list) {
              if (f.dt_txt.startsWith(dateStr)) {
                if (f.main.temp_min < tempMin) tempMin = f.main.temp_min;
                if (f.main.temp_max > tempMax) tempMax = f.main.temp_max;
              }
            }

            dailyForecasts.push({
              date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
              tempMin: tempMin,
              tempMax: tempMax,
              condition: noonItem.weather[0].main,
              icon: noonItem.weather[0].icon
            });
            seenDates.add(dateStr);
          }
        }

        const hourlyList = forecastData.list.slice(0, 8).map(item => {
          const time = new Date(item.dt * 1000).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          return {
            time,
            temp: item.main.temp,
            condition: item.weather[0].main,
            icon: item.weather[0].icon
          };
        });

        weatherData = {
          name: currentData.name,
          temp: currentData.main.temp,
          humidity: currentData.main.humidity,
          windSpeed: currentData.wind.speed,
          condition: currentData.weather[0].main,
          description: currentData.weather[0].description,
          icon: currentData.weather[0].icon,
          dailyForecasts,
          hourlyList,
          isMock: false
        };

        renderWeatherData();

      } catch (err) {
        setErrorState(err.message || 'Error occurred fetching geolocation details.');
      } finally {
        setLoadingState(false);
      }
    },
    (err) => {
      setLoadingState(false);
      setErrorState('Location permission denied or timed out.');
    }
  );
}

// --- Render Loaded Weather Data ---
function renderWeatherData() {
  if (!weatherData) return;

  // 1. Theme and Mock Notice
  applyTheme(weatherData.condition, weatherData.temp);
  mockNotice.classList.toggle('hidden', !weatherData.isMock);

  // 2. Weather Details
  weatherCityName.textContent = weatherData.name;
  weatherConditionDesc.textContent = weatherData.description;
  weatherTempValue.textContent = formatTemp(weatherData.temp);
  weatherHumidityValue.textContent = `${weatherData.humidity}%`;
  weatherWindValue.textContent = `${weatherData.windSpeed} m/s`;
  
  weatherConditionIcon.src = `https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`;
  weatherConditionIcon.style.display = 'block';

  // 3. Packing Suggestions
  packingList = generatePackingList(weatherData.condition, weatherData.temp, weatherData.humidity);
  renderPackingChecklist();

  // 4. Hourly strip
  hourlyForecastList.innerHTML = '';
  weatherData.hourlyList.forEach(hour => {
    const card = document.createElement('div');
    card.className = 'hourly-card';
    
    card.innerHTML = `
      <div class="hourly-time">${hour.time}</div>
      <img class="hourly-icon" src="https://openweathermap.org/img/wn/${hour.icon}.png" alt="${hour.condition}">
      <div class="hourly-temp">${formatTemp(hour.temp)}</div>
    `;
    hourlyForecastList.appendChild(card);
  });

  // 5. Forecast grid
  dailyForecastList.innerHTML = '';
  weatherData.dailyForecasts.forEach(day => {
    const card = document.createElement('div');
    card.className = 'glass-panel forecast-card';
    
    card.innerHTML = `
      <div class="forecast-date">${day.date}</div>
      <img class="forecast-icon" src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.condition}">
      <div class="forecast-temps">
        <span class="temp-max">${formatTemp(day.tempMax)}</span>
        <span class="temp-min">${formatTemp(day.tempMin)}</span>
      </div>
    `;
    dailyForecastList.appendChild(card);
  });

  // 6. History update
  addToHistory(weatherData.name);

  // Display Content
  dashboardContent.classList.remove('hidden');
}

// --- UI Loading and Error states helper ---
function setLoadingState(isLoading) {
  if (isLoading) {
    loadingContainer.classList.remove('hidden');
    dashboardContent.classList.add('hidden');
    searchBtn.disabled = true;
    geolocationBtn.disabled = true;
  } else {
    loadingContainer.classList.add('hidden');
    searchBtn.disabled = false;
    geolocationBtn.disabled = false;
  }
}

function setErrorState(msg) {
  if (msg) {
    errorText.textContent = msg;
    errorBanner.classList.remove('hidden');
  } else {
    errorBanner.classList.add('hidden');
  }
}

// ----------------------------------------------------
// LOCAL MOCK DATA HELPERS FOR TESTING OUT-OF-THE-BOX
// ----------------------------------------------------
function getMockCurrentWeather(cityName) {
  const name = cityName.trim().toLowerCase();
  let temp = 18.2;
  let condition = 'Clouds';
  let description = 'scattered clouds';
  let humidity = 60;
  let windSpeed = 4.2;
  let icon = '03d';

  if (name.includes('london')) {
    temp = 8.5;
    condition = 'Rain';
    description = 'light rain';
    humidity = 85;
    windSpeed = 5.6;
    icon = '09d';
  } else if (name.includes('miami') || name.includes('cairo')) {
    temp = 32.5;
    condition = 'Clear';
    description = 'clear sky';
    humidity = 48;
    windSpeed = 3.0;
    icon = '01d';
  } else if (name.includes('oslo')) {
    temp = 4.2;
    condition = 'Clouds';
    description = 'overcast clouds';
    humidity = 72;
    windSpeed = 2.8;
    icon = '04d';
  } else if (name.includes('zermatt') || name.includes('snow')) {
    temp = -3.0;
    condition = 'Snow';
    description = 'heavy snow';
    humidity = 94;
    windSpeed = 6.2;
    icon = '13d';
  }

  const capitalizedName = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();

  return {
    name: capitalizedName,
    main: { temp, humidity },
    wind: { speed: windSpeed },
    weather: [{ main: condition, description, icon }]
  };
}

function getMockForecast(cityName) {
  const name = cityName.trim().toLowerCase();
  let days = [
    { offset: 1, tempMin: 14, tempMax: 20, condition: 'Clouds', icon: '03d' },
    { offset: 2, tempMin: 15, tempMax: 22, condition: 'Clear', icon: '01d' },
    { offset: 3, tempMin: 12, tempMax: 18, condition: 'Rain', icon: '10d' },
  ];
  
  let hours = [
    { time: '3:00 PM', temp: 18, condition: 'Clouds', icon: '03d' },
    { time: '6:00 PM', temp: 17, condition: 'Clouds', icon: '03d' },
    { time: '9:00 PM', temp: 15, condition: 'Clear', icon: '01d' },
    { time: '12:00 AM', temp: 14, condition: 'Clear', icon: '01n' },
    { time: '3:00 AM', temp: 13, condition: 'Clear', icon: '01n' },
    { time: '6:00 AM', temp: 12, condition: 'Clear', icon: '01n' },
    { time: '9:00 AM', temp: 15, condition: 'Clouds', icon: '02d' },
    { time: '12:00 PM', temp: 19, condition: 'Clouds', icon: '02d' },
  ];

  if (name.includes('london')) {
    days = [
      { offset: 1, tempMin: 7, tempMax: 11, condition: 'Rain', icon: '09d' },
      { offset: 2, tempMin: 8, tempMax: 12, condition: 'Clouds', icon: '04d' },
      { offset: 3, tempMin: 6, tempMax: 10, condition: 'Rain', icon: '10d' },
    ];
    hours = hours.map(h => ({ ...h, temp: Math.round(h.temp - 8), condition: 'Rain', icon: '09d' }));
  } else if (name.includes('miami') || name.includes('cairo')) {
    days = [
      { offset: 1, tempMin: 28, tempMax: 33, condition: 'Clear', icon: '01d' },
      { offset: 2, tempMin: 29, tempMax: 34, condition: 'Clear', icon: '01d' },
      { offset: 3, tempMin: 27, tempMax: 32, condition: 'Clouds', icon: '03d' },
    ];
    hours = hours.map(h => ({ ...h, temp: Math.round(h.temp + 14), condition: 'Clear', icon: '01d' }));
  } else if (name.includes('oslo')) {
    days = [
      { offset: 1, tempMin: 2, tempMax: 6, condition: 'Clouds', icon: '04d' },
      { offset: 2, tempMin: 1, tempMax: 5, condition: 'Rain', icon: '10d' },
      { offset: 3, tempMin: -1, tempMax: 3, condition: 'Snow', icon: '13d' },
    ];
    hours = hours.map(h => ({ ...h, temp: Math.round(h.temp - 13), condition: 'Clouds', icon: '04d' }));
  } else if (name.includes('zermatt') || name.includes('snow')) {
    days = [
      { offset: 1, tempMin: -5, tempMax: -2, condition: 'Snow', icon: '13d' },
      { offset: 2, tempMin: -6, tempMax: -3, condition: 'Snow', icon: '13d' },
      { offset: 3, tempMin: -4, tempMax: -1, condition: 'Clouds', icon: '04d' },
    ];
    hours = hours.map(h => ({ ...h, temp: Math.round(h.temp - 20), condition: 'Snow', icon: '13d' }));
  }

  // Format dates
  const dailyForecasts = days.map(d => {
    const date = new Date();
    date.setDate(date.getDate() + d.offset);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      tempMin: d.tempMin,
      tempMax: d.tempMax,
      condition: d.condition,
      icon: d.icon,
    };
  });

  return { dailyForecasts, hourlyList: hours };
}
