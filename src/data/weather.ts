export interface CityWeather {
  id: string;
  name: string;
  nameEn: string;
  lat: number;
  lon: number;
  timezone: string;
}

export interface WeatherObservation {
  cityId: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeedKmh: number;
  windDirection: number;
  weatherCode: number;
  time: string;
  source: "live" | "fallback";
}

export interface ForecastDay {
  date: string;
  weatherCode: number;
  tempMin: number;
  tempMax: number;
  precipProb: number;
}

export interface WeatherBundle {
  city: CityWeather;
  current: WeatherObservation;
  forecast: ForecastDay[];
  fetchedAt: string;
}

export const cities: CityWeather[] = [
  { id: "shanghai", name: "上海", nameEn: "SHANGHAI", lat: 31.23, lon: 121.47, timezone: "Asia/Shanghai" },
  { id: "beijing", name: "北京", nameEn: "BEIJING", lat: 39.9, lon: 116.4, timezone: "Asia/Shanghai" },
  { id: "guangzhou", name: "广州", nameEn: "GUANGZHOU", lat: 23.13, lon: 113.26, timezone: "Asia/Shanghai" },
];

export const wmoWeatherText: Record<number, string> = {
  0: "晴",
  1: "大致晴朗",
  2: "多云",
  3: "阴",
  45: "雾",
  48: "冻雾",
  51: "小毛毛雨",
  53: "中毛毛雨",
  55: "大毛毛雨",
  56: "小冻雨",
  57: "大冻雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  66: "小冻雨",
  67: "大冻雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  77: "雪粒",
  80: "小阵雨",
  81: "中阵雨",
  82: "强阵雨",
  85: "小阵雪",
  86: "大阵雪",
  95: "雷暴",
  96: "雷暴伴小冰雹",
  99: "雷暴伴大冰雹",
};

export const fallbackForecast: ForecastDay[] = [
  { date: "07-31", weatherCode: 2, tempMin: 27, tempMax: 34, precipProb: 18 },
  { date: "08-01", weatherCode: 61, tempMin: 26, tempMax: 32, precipProb: 62 },
  { date: "08-02", weatherCode: 80, tempMin: 26, tempMax: 31, precipProb: 70 },
  { date: "08-03", weatherCode: 3, tempMin: 27, tempMax: 33, precipProb: 32 },
  { date: "08-04", weatherCode: 0, tempMin: 27, tempMax: 35, precipProb: 12 },
  { date: "08-05", weatherCode: 1, tempMin: 28, tempMax: 35, precipProb: 15 },
  { date: "08-06", weatherCode: 61, tempMin: 27, tempMax: 33, precipProb: 48 },
];

export function fallbackWeather(city: CityWeather): WeatherBundle {
  return {
    city,
    current: {
      cityId: city.id,
      temperature: 31,
      apparentTemperature: 34,
      humidity: 68,
      windSpeedKmh: 14,
      windDirection: 135,
      weatherCode: 2,
      time: new Date().toISOString(),
      source: "fallback",
    },
    forecast: fallbackForecast,
    fetchedAt: new Date().toISOString(),
  };
}