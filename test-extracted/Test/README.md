# ☁️ Weather & Packing Planner

A beautiful, interactive weather forecasting and travel packing assistant dashboard built using **only HTML, CSS, and vanilla JavaScript**.

---

## 🌟 Key Features

1. **Card-Based Dashboard Interface**
   - **Search Bar**: Query any city worldwide, check your last 5 searched cities (saved in `localStorage`), or use browser Geolocation.
   - **Current Weather Hero**: Displays city name, condition description, temp, weather icon, humidity level, and wind speed.
   - **Smart Packing Checklist**: Renders recommended packing items based on target city weather, allowing you to check/uncheck them as you prepare.
   - **Hourly Forecast Strip**: Horizontally scrollable strip displaying the forecast for the next 24 hours.
   - **3-Day Forecast Grid**: Displays min/max temps and condition icons for the upcoming 3 days.

2. **Dynamic CSS custom properties Theming**
   - Backgrounds, cards, text color, and accents transition smoothly based on the active city's weather condition:
     - **Sunny/Hot**: Warm sunset orange/red.
     - **Rain/Storm**: Cool dark slate gray/blue.
     - **Snow**: Crisp high-contrast light blue/white.
     - **Clouds/Default**: Neutral gray.

3. **Data-Driven Rules Engine**
   - Automatically recommends packing items (e.g. umbrellas for rain, heavy winter coats for cold, breathable cotton fabrics for high humidity) by evaluating weather conditions through a structured javascript rules engine.

4. **API Resilience & Mock Mode Fallback**
   - Shows user-friendly inline error alerts for spelling mistakes or connection issues.
   - Includes an **out-of-the-box Mock Mode** to test the app without an API key by searching for **London** (Rain), **Miami** (Hot), **Oslo** (Cold), or **Zermatt** (Snow).

5. **Client-side Unit Conversions**
   - Toggles instantly between Celsius (°C) and Fahrenheit (°F) on the fly without making new API calls.

---

## 🚀 How to Run

1. Open `index.html` directly in any web browser (Chrome, Safari, Edge, Firefox, etc.) or open the project folder in VS Code and run it with the **Live Server** extension.
2. Click the **🧪 Mock Mode** badge in the header, input your **OpenWeatherMap API Key**, and click **Save Key** to switch to live weather reports!
