import "../main";
import { fetchWeather, getCity, weatherText, windDirectionText } from "../lib/weather-api";
import type { WeatherBundle } from "../data/weather";

const switchElement = document.getElementById("city-switch");
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".city-button"));
const locationEl = document.getElementById("current-location");
const tempEl = document.getElementById("current-temp");
const titleEl = document.getElementById("current-title");
const metaEl = document.getElementById("current-meta");
const sourceEl = document.getElementById("forecast-source");
const listEl = document.getElementById("forecast-list");
const statFeels = document.getElementById("stat-feels");
const statHumidity = document.getElementById("stat-humidity");
const statWind = document.getElementById("stat-wind");
const statDirection = document.getElementById("stat-direction");

let currentCityId = "shanghai";
let activeRequest = 0;

function renderForecastRow(day: WeatherBundle["forecast"][number]): string {
  return `
    <li class="forecast-row">
      <span class="forecast-row__date">${day.date}</span>
      <span class="forecast-row__desc">${weatherText(day.weatherCode)}</span>
      <span class="forecast-row__temps">${Math.round(day.tempMin)}° / ${Math.round(day.tempMax)}°</span>
      <span class="precip-cell">降水 ${day.precipProb}%</span>
    </li>
  `;
}

function render(bundle: WeatherBundle): void {
  const { current, city } = bundle;
  if (locationEl) locationEl.textContent = `${city.nameEn} / ${city.name}`;
  if (tempEl) tempEl.textContent = `${Math.round(current.temperature)}°`;
  if (titleEl) titleEl.textContent = weatherText(current.weatherCode);
  if (metaEl) {
    metaEl.textContent = `体感 ${Math.round(current.apparentTemperature)}° · 湿度 ${Math.round(current.humidity)}% · 风速 ${Math.round(current.windSpeedKmh)} km/h`;
  }
  if (sourceEl) {
    sourceEl.textContent = current.source === "live" ? "SOURCE: OPEN-METEO / LIVE" : "SOURCE: FALLBACK / DEMO";
  }
  if (statFeels) statFeels.textContent = `${Math.round(current.apparentTemperature)}°`;
  if (statHumidity) statHumidity.textContent = `${Math.round(current.humidity)}%`;
  if (statWind) statWind.textContent = `${Math.round(current.windSpeedKmh)} km/h`;
  if (statDirection) statDirection.textContent = windDirectionText(current.windDirection);
  if (listEl) {
    listEl.innerHTML = bundle.forecast.map(renderForecastRow).join("");
  }
}

async function loadCity(cityId: string): Promise<void> {
  const requestId = ++activeRequest;
  const city = getCity(cityId);
  if (tempEl) tempEl.textContent = "--°";
  if (titleEl) titleEl.textContent = "加载中...";
  if (sourceEl) sourceEl.textContent = "SOURCE: CONNECTING…";
  buttons.forEach((button) => {
    const active = button.dataset.city === cityId;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  try {
    const bundle = await fetchWeather(city, AbortSignal.timeout(9000));
    if (requestId !== activeRequest) return;
    render(bundle);
  } catch {
    if (requestId !== activeRequest) return;
    const { fallbackWeather } = await import("../data/weather");
    render(fallbackWeather(city));
    if (sourceEl) sourceEl.textContent = "SOURCE: FALLBACK / DEMO";
  }
}

switchElement?.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-city]");
  if (!button || button.dataset.city === currentCityId) return;
  currentCityId = button.dataset.city ?? "shanghai";
  void loadCity(currentCityId);
});

void loadCity(currentCityId);