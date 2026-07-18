 # ☁️ Atmosphere — Interactive Weather & Packing Planner

> An advanced, feature-rich web application built with Vanilla HTML5, CSS3, and JavaScript featuring dynamic weather-based CSS theming, a rule-based smart packing engine, voice alerts, ambient rain sound synthesis, search history, and extended forecasts.

---

## 🚀 Live Demo & Quick Start
  **  [Live Demo]  (https://vivek1175.github.io/-Weather-Packing-Planner/) 

- **Local Preview:** `http://localhost:8080/index.html`
- **Tech Stack:** HTML5, Vanilla CSS3 (Custom Variables & Glassmorphism), Modern JavaScript (ES6+), Open-Meteo API, Web Speech API, Web Audio API.

---

## ✨ Features

### 1. 🎨 Dynamic Weather-Based CSS-in-JS Theming
- The app automatically changes background gradients, accent colors, card glassmorphism, and atmospheric particles based on current weather conditions:
  - ☀️ **Sunny / Clear:** Warm golden amber gradients (`.theme-sunny`)
  - 🌧️ **Rain / Drizzle:** Slate blue oceanic gradient with animated falling rain drops (`.theme-rainy`)
  - ❄️ **Snow / Ice:** Frosty cyan & dark ice theme (`.theme-snowy`)
  - ☁️ **Cloudy / Fog:** Neutral slate gray & silver gradient (`.theme-cloudy`)
  - ⚡ **Thunderstorm:** Deep purple & electric violet accents (`.theme-thunder`)

### 2. ☔ Smart Rule-Based Packing Engine
- Built with a data-driven rules engine evaluating weather conditions against structured criteria:
  - **Precipitation (Rain / Showers / Thunderstorm):** Umbrella ☔, Waterproof Rain Shell 🧥, Waterproof Boots 🥾.
  - **Cold Weather (< 5°C):** Insulated Winter Coat, Thermal Layers, Gloves 🧤, Wool Scarf & Beanie 🧣.
  - **Hot Weather (> 28°C):** Shorts/Tees 🩳, SPF 50+ Sunscreen 🧴, UV Sunglasses 🕶️, Water Bottle 💧.
  - **High Humidity (> 70%):** Quick-dry breathable fabrics, deodorant/anti-frizz care.
  - **High Wind (> 20 km/h):** Windbreaker jacket.
- Interactive checklist with progress bar (`2 / 5 items (40%)`), custom item addition form, and state reset capability.

### 3. 🔊 Voice Briefing & Ambient Rain Sound FX
- **Voice Assistant (Web Speech API):** Provides natural spoken weather briefings and rain warning alerts aloud via `window.speechSynthesis`.
- **Procedural Rain Sound Synthesizer (Web Audio API):** Generates relaxing ambient rain sound effects directly in the browser via AudioContext white-noise filters.

### 4. 🌐 Resilient Weather API Integration
- Uses **Open-Meteo Geocoding & Forecast APIs** (100% free, **no API key required**, worldwide accuracy).
- Handles edge cases gracefully (inline non-blocking error notifications for invalid city searches, disabled submit buttons, and shimmer loading overlays).
- **Geolocation:** One-click "My Location" button using `navigator.geolocation`.
- **Search History:** Persists top 5 recently searched cities in `localStorage` with clickable tags.

### 5. 🌡️ Client-Side Unit Switcher (°C / °F)
- Instant unit toggle (°C / °F, km/h / mph) recalculates all current, hourly, and 5-day forecasts **without extra network requests**.

---

## 🛠️ Project Architecture
