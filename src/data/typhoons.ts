export type TyphoonIntensity = "TD" | "TS" | "STS" | "TY" | "STY" | "SuperTY";

export interface TyphoonPoint {
  time: string;
  lat: number;
  lng: number;
  windKmh: number;
  pressureHpa: number;
  intensity: TyphoonIntensity;
  isForecast?: boolean;
}

export interface TyphoonTrack {
  id: string;
  name: string;
  nameEn: string;
  startTime: string;
  points: TyphoonPoint[];
}

export interface TyphoonStatus {
  name: string;
  nameEn: string;
  intensityLabel: string;
  positionLabel: string;
  speedLabel: string;
  pressureHpa: number;
  windKmh: number;
  timeLabel: string;
  isForecast: boolean;
}

const intensityLabelMap: Record<TyphoonIntensity, string> = {
  TD: "热带低压",
  TS: "热带风暴",
  STS: "强热带风暴",
  TY: "台风",
  STY: "强台风",
  SuperTY: "超强台风",
};

export function intensityLabel(intensity: TyphoonIntensity): string {
  return intensityLabelMap[intensity];
}

export function pointToStatus(point: TyphoonPoint, name: string, nameEn: string, speedKmh: number): TyphoonStatus {
  return {
    name,
    nameEn,
    intensityLabel: intensityLabel(point.intensity),
    positionLabel: `${point.lat.toFixed(2)}°N / ${point.lng.toFixed(2)}°E`,
    speedLabel: `${speedKmh.toFixed(1)} km/h`,
    pressureHpa: point.pressureHpa,
    windKmh: point.windKmh,
    timeLabel: point.time,
    isForecast: Boolean(point.isForecast),
  };
}

/** Swap this client for a live API later; the demo track keeps the page usable offline. */
export async function fetchTyphoonTracks(): Promise<TyphoonTrack[]> {
  return structuredClone(typhoonTracks);
}

export const typhoonTracks: TyphoonTrack[] = [
  {
    id: "mangkhut-2026",
    name: "山竹",
    nameEn: "MANGKHUT",
    startTime: "2026-07-25T00:00:00+08:00",
    points: [
      { time: "07-25 00:00", lat: 13.2, lng: 143.6, windKmh: 75, pressureHpa: 992, intensity: "TS" },
      { time: "07-25 12:00", lat: 13.6, lng: 141.5, windKmh: 85, pressureHpa: 988, intensity: "TS" },
      { time: "07-26 00:00", lat: 14.1, lng: 139.1, windKmh: 100, pressureHpa: 980, intensity: "STS" },
      { time: "07-26 12:00", lat: 14.7, lng: 136.6, windKmh: 115, pressureHpa: 970, intensity: "STS" },
      { time: "07-27 00:00", lat: 15.3, lng: 133.8, windKmh: 135, pressureHpa: 955, intensity: "TY" },
      { time: "07-27 12:00", lat: 16.1, lng: 130.7, windKmh: 155, pressureHpa: 938, intensity: "STY" },
      { time: "07-28 00:00", lat: 17.2, lng: 127.4, windKmh: 185, pressureHpa: 915, intensity: "SuperTY" },
      { time: "07-28 12:00", lat: 18.6, lng: 123.8, windKmh: 195, pressureHpa: 908, intensity: "SuperTY" },
      { time: "07-29 00:00", lat: 20.1, lng: 120.3, windKmh: 175, pressureHpa: 925, intensity: "STY" },
      { time: "07-29 12:00", lat: 22.2, lng: 116.9, windKmh: 150, pressureHpa: 940, intensity: "TY" },
      { time: "07-30 00:00", lat: 24.7, lng: 113.8, windKmh: 120, pressureHpa: 965, intensity: "TY", isForecast: true },
      { time: "07-30 12:00", lat: 27.4, lng: 111.2, windKmh: 100, pressureHpa: 978, intensity: "STS", isForecast: true },
      { time: "07-31 00:00", lat: 30.1, lng: 109.4, windKmh: 82, pressureHpa: 986, intensity: "TS", isForecast: true },
    ],
  },
  {
    id: "trami-2026",
    name: "潭美",
    nameEn: "TRAMI",
    startTime: "2026-07-26T00:00:00+08:00",
    points: [
      { time: "07-26 00:00", lat: 16.8, lng: 131.9, windKmh: 65, pressureHpa: 996, intensity: "TD" },
      { time: "07-26 12:00", lat: 17.3, lng: 129.4, windKmh: 80, pressureHpa: 990, intensity: "TS" },
      { time: "07-27 00:00", lat: 18.0, lng: 126.8, windKmh: 95, pressureHpa: 984, intensity: "STS" },
      { time: "07-27 12:00", lat: 19.1, lng: 124.2, windKmh: 110, pressureHpa: 975, intensity: "STS" },
      { time: "07-28 00:00", lat: 20.6, lng: 121.5, windKmh: 125, pressureHpa: 960, intensity: "TY" },
      { time: "07-28 12:00", lat: 22.7, lng: 118.8, windKmh: 115, pressureHpa: 968, intensity: "TY" },
      { time: "07-29 00:00", lat: 24.9, lng: 116.1, windKmh: 100, pressureHpa: 980, intensity: "STS", isForecast: true },
    ],
  },
];