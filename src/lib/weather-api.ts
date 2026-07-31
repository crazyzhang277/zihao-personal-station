import { cities, fallbackWeather, type CityWeather, type ForecastDay, type WeatherBundle } from "../data/weather";
import { wmoWeatherText } from "../data/weather";

export interface OpenMeteoResponse {
  current_weather?: {
    temperature?: number;
    windspeed?: number;
    winddirection?: number;
    weathercode?: number;
    time?: string;
  };
  hourly?: {
    time?: string[];
    apparent_temperature?: number[];
    relativehumidity_2m?: number[];
  };
  daily?: {
    time?: string[];
    weathercode?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
}

export function getCity(id: string): CityWeather {
  return cities.find((city) => city.id === id) ?? cities[0];
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function fetchWeather(city: CityWeather, signal?: AbortSignal): Promise<WeatherBundle> {
  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    current_weather: "true",
    hourly: "apparent_temperature,relativehumidity_2m",
    daily: "weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: city.timezone,
    forecast_days: "7",
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!response.ok) throw new Error(`Open-Meteo responded ${response.status}`);
  const data = (await response.json()) as OpenMeteoResponse;

  const current = data.current_weather ?? {};
  const hourly = data.hourly ?? {};
  const daily = data.daily ?? {};
  const nowIndex = findHourIndex(hourly.time, current.time);

  const temperature = readNumber(current.temperature) ?? fallbackWeather(city).current.temperature;
  const apparentTemperature =
    readNumber(hourly.apparent_temperature?.[nowIndex]) ?? fallbackWeather(city).current.apparentTemperature;
  const humidity =
    readNumber(hourly.relativehumidity_2m?.[nowIndex]) ?? fallbackWeather(city).current.humidity;
  const windSpeedKmh = readNumber(current.windspeed) ?? fallbackWeather(city).current.windSpeedKmh;
  const windDirection = readNumber(current.winddirection) ?? fallbackWeather(city).current.windDirection;
  const weatherCode = readNumber(current.weathercode) ?? fallbackWeather(city).current.weatherCode;

  const forecast: ForecastDay[] = (daily.time ?? []).map((date, index) => ({
    date: formatDate(date),
    weatherCode: readNumber(daily.weathercode?.[index]) ?? 0,
    tempMin: readNumber(daily.temperature_2m_min?.[index]) ?? 0,
    tempMax: readNumber(daily.temperature_2m_max?.[index]) ?? 0,
    precipProb: readNumber(daily.precipitation_probability_max?.[index]) ?? 0,
  }));

  return {
    city,
    current: {
      cityId: city.id,
      temperature,
      apparentTemperature,
      humidity,
      windSpeedKmh,
      windDirection,
      weatherCode,
      time: current.time ?? new Date().toISOString(),
      source: "live",
    },
    forecast: forecast.length >= 7 ? forecast : fallbackWeather(city).forecast,
    fetchedAt: new Date().toISOString(),
  };
}

function findHourIndex(times: string[] | undefined, currentTime: string | undefined): number {
  if (!times || times.length === 0) return 0;
  if (!currentTime) return 0;
  const target = currentTime.slice(0, 13);
  const index = times.findIndex((time) => time.slice(0, 13) === target);
  return index >= 0 ? index : 0;
}

export function formatDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date.slice(5);
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

export function weatherText(code: number): string {
  return wmoWeatherText[code] ?? "未知天气";
}

export function windDirectionText(degrees: number): string {
  const directions = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  return directions[Math.round(degrees / 45) % 8] ?? "未知";
}