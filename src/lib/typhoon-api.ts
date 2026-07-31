import { typhoonTracks as demoTracks } from "../data/typhoons";

export type TyphoonSourceId = "jma" | "cma" | "cwa" | "jtwc" | "demo";

export interface WindRadius {
  label: string;
  thresholdMps: number;
  radiusKm: number;
}

export interface TyphoonPoint {
  time: string;
  lat: number;
  lng: number;
  windMps: number;
  pressureHpa: number;
  intensity: string;
  isForecast?: boolean;
  hours?: number;
  windRadii?: WindRadius[];
  windPolygon?: Array<[number, number]>;
}

export interface TyphoonTrack {
  id: string;
  sourceId: TyphoonSourceId;
  sourceName: string;
  sourceShort: string;
  name: string;
  nameEn: string;
  number: string;
  issueTime: string;
  speedKmh: number;
  course: string;
  points: TyphoonPoint[];
}

export interface TyphoonStatus {
  trackId: string;
  sourceId: TyphoonSourceId;
  sourceName: string;
  sourceShort: string;
  name: string;
  nameEn: string;
  number: string;
  intensity: string;
  positionLabel: string;
  lat: number;
  lng: number;
  pressureHpa: number;
  windMps: number;
  speedKmh: number;
  course: string;
  issueTime: string;
  isForecast: boolean;
}

export interface TyphoonSnapshot {
  track: TyphoonTrack;
  status: TyphoonStatus;
}

interface JmaTarget {
  tropicalCyclone?: string;
  typhoonNumber?: string;
  category?: string;
  issue?: string;
}

interface JmaForecastEntry {
  part?: string | { en?: string };
  advancedHours?: number;
  validtime?: { UTC?: string };
  issue?: string;
  name?: { en?: string };
  track?: {
    preTyphoon?: Array<[number, number]>;
    typhoon?: Array<[number, number]>;
  };
  center?: [number, number];
  galeWarningArea?: { radius?: number };
  stormWarningArea?: { arc?: Array<[Array<[number, number]>, number, Array<number>]> };
}

interface JmaSpecEntry {
  part?: string | { en?: string };
  advancedHours?: number;
  maximumWind?: { sustained?: { "m/s"?: string | number } };
  position?: { deg?: [number, number] };
  course?: string;
  speed?: { "km/h"?: string | number };
  pressure?: string | number;
  category?: { en?: string };
  validtime?: { UTC?: string };
}

interface CmaListPayload {
  typhoonList?: unknown[][];
}

interface CmaViewPayload {
  typhoon?: unknown[];
}

interface CwaConfig {
  typhoon?: {
    list?: {
      url?: string;
    };
  };
}

const JMA_LIST_URL = "https://www.jma.go.jp/bosai/typhoon/data/targetTc.json";
const JTWC_BULLETIN_URL = "/noaa-proxy/data/raw/wt/wtpn31.pgtw..txt";
const JTWC_DIRECT_URL = "https://tgftp.nws.noaa.gov/data/raw/wt/wtpn31.pgtw..txt";
const JTWC_KM_PER_NM = 1.852;
const JTWC_MPS_PER_KT = 0.514444;

const jtwcIntensityLabels: Record<string, string> = {
  "TD": "热带低压",
  TS: "热带风暴",
  STS: "强热带风暴",
  TY: "台风",
  STY: "强台风",
  SuperTY: "超强台风",
  "SUPER TYPHOON": "超强台风",
  "TYPHOON": "台风",
  "SEVERE TROPICAL STORM": "强热带风暴",
  "TROPICAL STORM": "热带风暴",
  "TROPICAL DEPRESSION": "热带低压",
};

const jtwcWindRadiusLabels: Array<{ kts: number; label: string }> = [
  { kts: 64, label: "64KT 台风风圈" },
  { kts: 50, label: "50KT 暴风圈" },
  { kts: 34, label: "34KT 强风圈" },
];

const CMA_LIST_URL = "https://typhoon.nmc.cn/weatherservice/typhoon/jsons/list_default";

export const intensityLabels: Record<string, string> = {
  TD: "热带低压",
  TS: "热带风暴",
  STS: "强热带风暴",
  TY: "台风",
  STY: "强台风",
  SuperTY: "超强台风",
};

function numberValue(value: unknown): number {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : 0;
}

function unwrapJsonp(text: string): unknown {
  const start = text.indexOf("(");
  const end = text.lastIndexOf(")");
  if (start < 0 || end <= start) throw new Error("Invalid JSONP payload");
  let body = text.slice(start + 1, end).trim();
  while (body.startsWith("(") && body.endsWith(")")) {
    body = body.slice(1, -1).trim();
  }
  return JSON.parse(body);
}

function cmaTimeToIso(raw: unknown): string {
  const value = String(raw ?? "");
  const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(value);
  if (!match) return new Date().toISOString();
  const [, year, month, day, hour, minute] = match;
  return new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) - 8, Number(minute)),
  ).toISOString();
}

function intensityLabel(intensity: string): string {
  return (intensityLabels[intensity] ?? intensity) || "未知";
}

function positionLabel(lat: number, lng: number): string {
  return `${lat.toFixed(2)}°N / ${lng.toFixed(2)}°E`;
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

async function fetchJson(url: string, timeoutMs = 12000): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`${url} responded ${response.status}`);
  return response.json();
}

async function fetchText(url: string, headers?: Record<string, string>, timeoutMs = 10000): Promise<string> {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers });
  if (!response.ok) throw new Error(`${url} responded ${response.status}`);
  return response.text();
}

async function fetchJmaTrack(target: JmaTarget): Promise<TyphoonTrack | null> {
  const id = target.tropicalCyclone;
  if (!id) return null;
  const [forecast, specifications] = await Promise.all([
    fetchJson(`https://www.jma.go.jp/bosai/typhoon/data/${id}/forecast.json`) as Promise<JmaForecastEntry[]>,
    fetchJson(`https://www.jma.go.jp/bosai/typhoon/data/${id}/specifications.json`) as Promise<JmaSpecEntry[]>,
  ]);

  const title = forecast[0];
  const analysis = forecast.find((entry) => entry.advancedHours === 0);
  const specAnalysis = specifications.find((entry) => entry.advancedHours === 0);
  const rawIssue = title?.issue;
  const issueTime = typeof rawIssue === "string" ? rawIssue : analysis?.validtime?.UTC ?? new Date().toISOString();
  const observedCoords = analysis?.track?.typhoon?.length
    ? analysis.track.typhoon
    : (analysis?.track?.preTyphoon ?? []);

  const analysisTime = analysis?.validtime?.UTC ?? issueTime;
  const observedPoints: TyphoonPoint[] = observedCoords.map(([lat, lng], index) => ({
    time: new Date(new Date(analysisTime).getTime() - (observedCoords.length - 1 - index) * 3 * 60 * 60 * 1000).toISOString(),
    lat,
    lng,
    windMps: index === observedCoords.length - 1 ? numberValue(specAnalysis?.maximumWind?.sustained?.["m/s"]) : 0,
    pressureHpa: index === observedCoords.length - 1 ? numberValue(specAnalysis?.pressure) : 0,
    intensity: specAnalysis?.category?.en ?? "TY",
  }));

  const jmaLatest = observedPoints[observedPoints.length - 1];
  if (jmaLatest) {
    const galeRadiusKm = Math.round((analysis?.galeWarningArea?.radius ?? 0) / 1000);
    const stormRadiusM = Math.max(0, ...(analysis?.stormWarningArea?.arc ?? []).map((arc) => arc[1] ?? 0));
    const stormRadiusKm = Math.round(stormRadiusM / 1000);
    jmaLatest.windRadii = [
      galeRadiusKm > 0 ? { label: "强风圈", thresholdMps: 17.2, radiusKm: galeRadiusKm } : null,
      stormRadiusKm > 0 ? { label: "暴风圈", thresholdMps: 24.5, radiusKm: stormRadiusKm } : null,
    ].filter((radius): radius is WindRadius => radius !== null);
  }

  const forecastPoints: TyphoonPoint[] = forecast
    .filter((entry) => (entry.advancedHours ?? 0) > 0 && entry.center?.length === 2)
    .map((entry) => {
      const spec = specifications.find((item) => item.advancedHours === entry.advancedHours);
      return {
        time: entry.validtime?.UTC ?? new Date().toISOString(),
        lat: entry.center?.[0] ?? 0,
        lng: entry.center?.[1] ?? 0,
        windMps: numberValue(spec?.maximumWind?.sustained?.["m/s"]),
        pressureHpa: numberValue(spec?.pressure),
        intensity: spec?.category?.en ?? "TY",
        isForecast: true,
        hours: entry.advancedHours,
      };
    });

  const points = [...observedPoints, ...forecastPoints];
  if (points.length === 0) return null;

  return {
    id,
    sourceId: "jma",
    sourceName: "日本气象厅 JMA",
    sourceShort: "JMA",
    name: title?.name?.en ?? target.typhoonNumber ?? id,
    nameEn: title?.name?.en ?? id,
    number: target.typhoonNumber ?? "—",
    issueTime,
    speedKmh: numberValue(specAnalysis?.speed?.["km/h"]),
    course: specAnalysis?.course ?? "—",
    points,
  };
}

async function fetchJmaSnapshots(): Promise<TyphoonSnapshot[]> {
  const targets = (await fetchJson(JMA_LIST_URL)) as JmaTarget[];
  const tracks = (await Promise.all(targets.map((target) => fetchJmaTrack(target).catch(() => null)))).filter(
    (track): track is TyphoonTrack => track !== null,
  );
  return tracks.map((track) => ({ track, status: buildStatus(track) }));
}

const cmaRadiusLabels: Record<string, string> = {
  "30KTS": "强风圈",
  "50KTS": "暴风圈",
  "64KTS": "飓风圈",
};

function parseCmaRadius(entry: unknown): WindRadius | null {
  if (!Array.isArray(entry)) return null;
  const [label, ne, se, sw, nw] = entry as [string, unknown, unknown, unknown, unknown, ...unknown[]];
  const radii = [ne, se, sw, nw].map(numberValue).filter((radius) => radius > 0);
  if (radii.length === 0) return null;
  const labelKey = String(label ?? "").toUpperCase();
  return {
    label: cmaRadiusLabels[labelKey] ?? `${labelKey} 风圈`,
    thresholdMps: labelKey === "64KTS" ? 32.9 : labelKey === "50KTS" ? 25.7 : 15.4,
    radiusKm: Math.max(...radii),
  };
}

function parseCmaPoint(point: unknown): TyphoonPoint | null {
  if (!Array.isArray(point)) return null;
  const [, timeRaw, , intensity, lng, lat, pressure, windMps, , , radiiArray] = point as [
    unknown,
    unknown,
    unknown,
    string,
    number,
    number,
    number,
    number,
    unknown,
    unknown,
    unknown,
    ...unknown[],
  ];
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  const windRadii = Array.isArray(radiiArray)
    ? radiiArray.map(parseCmaRadius).filter((radius): radius is WindRadius => radius !== null)
    : [];
  return {
    time: cmaTimeToIso(timeRaw),
    lat,
    lng,
    windMps: numberValue(windMps),
    pressureHpa: numberValue(pressure),
    intensity: String(intensity ?? "TD"),
    windRadii: windRadii.length > 0 ? windRadii : undefined,
  };
}

async function fetchCmaTrack(id: number, nameEn: string, nameCn: string, number: string): Promise<TyphoonTrack | null> {
  const payload = unwrapJsonp(await fetchText(
    `https://typhoon.nmc.cn/weatherservice/typhoon/jsons/view_${id}`,
  )) as CmaViewPayload;
  const meta = payload.typhoon;
  const rawTrack = Array.isArray(meta?.[8]) ? (meta[8] as unknown[]) : [];
  const points = rawTrack.map(parseCmaPoint).filter((point): point is TyphoonPoint => point !== null);
  if (points.length === 0) return null;

  const latestObserved = points[points.length - 1];
  const issueTime = latestObserved?.time ?? new Date().toISOString();
  const latest = rawTrack[rawTrack.length - 1];
  const latestArray = Array.isArray(latest) ? (latest as unknown[]) : [];
  const forecastObject = latestArray[11] as { BABJ?: unknown[][] } | undefined;
  const forecasts = (forecastObject?.BABJ ?? [])
    .map((entry): TyphoonPoint | null => {
      if (!Array.isArray(entry)) return null;
      const [hours, , lng, lat, pressure, windMps, , intensity] = entry as [
        number,
        string,
        number,
        number,
        number,
        number,
        string,
        string,
      ];
      return {
        time: new Date(new Date(issueTime).getTime() + Number(hours) * 60 * 60 * 1000).toISOString(),
        lat,
        lng,
        windMps: numberValue(windMps),
        pressureHpa: numberValue(pressure),
        intensity: String(intensity ?? "TY"),
        isForecast: true,
        hours,
      } satisfies TyphoonPoint;
    })
    .filter((point): point is TyphoonPoint => point !== null);

  const speedKmh = numberValue(latestArray[9]);
  const course = typeof latestArray[8] === "string" ? (latestArray[8] as string) : "—";
  const pointsWithForecast = [...points, ...forecasts];

  return {
    id: `cma-${id}`,
    sourceId: "cma",
    sourceName: "中央气象台 CMA",
    sourceShort: "CMA",
    name: nameCn || nameEn,
    nameEn,
    number: String(number),
    issueTime,
    speedKmh,
    course,
    points: pointsWithForecast,
  };
}

const CWA_CONFIG_PATH = "/web/obsmap/json/typhoon/typhoon.json";
const CWA_DEFAULT_KML_PATH = "/Data/typhoon/PTA_KMZ/fifows_typhoon.kml";
const CWA_JINA_READER_URL = "https://r.jina.ai/";

function parseKmlCoordinates(element: Element | null): Array<[number, number]> {
  const text = element?.textContent?.trim() ?? "";
  return text.split(/\s+/).flatMap((part) => {
    const [lng, lat] = part.split(",").map(Number);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [[lat, lng] as [number, number]] : [];
  });
}

function parseCwaDescription(description: string): Partial<TyphoonPoint> & { speedKmh: number; course: string; name: string; nameEn: string; number: string } {
  const normalized = description
    .replace(/颤/g, "风")
    .replace(/颱/g, "台")
    .replace(/級/g, "级")
    .replace(/徑/g, "径")
    .replace(/裡/g, "里");
  const nameEn = normalized.match(/國際命名\s*([A-Z]+)/)?.[1] ?? "TYPHOON";
  const name = normalized.match(/台[颤风]\s*([^\s(（）]+)/)?.[1] ?? nameEn;
  const number = normalized.match(/第\s*(\d+)\s*號/)?.[1] ?? "—";
  const intensity = normalized.includes("強烈")
    ? "SuperTY"
    : normalized.includes("中度")
      ? "STY"
      : normalized.includes("輕度")
        ? "TY"
        : "TY";
  const radii: WindRadius[] = [
    { label: "7级风圈", thresholdMps: 17.2, radiusKm: Number(normalized.match(/七级风半径\s*(\d+)\s*公里/)?.[1] ?? 0) },
    { label: "10级风圈", thresholdMps: 28.5, radiusKm: Number(normalized.match(/十级风半径\s*(\d+)\s*公里/)?.[1] ?? 0) },
  ].filter((radius) => radius.radiusKm > 0);

  return {
    name,
    nameEn,
    number,
    intensity,
    windMps: Number(normalized.match(/最大风速每秒\s*(\d+)/)?.[1] ?? 0),
    pressureHpa: Number(normalized.match(/(\d+)\s*百帕/)?.[1] ?? 0),
    speedKmh: Number(normalized.match(/每小時\s*(\d+)\s*公里/)?.[1] ?? 0),
    course: normalized.match(/向\s*([^，。；]+?)\s*進行/)?.[1] ?? "—",
    windRadii: radii.length > 0 ? radii : undefined,
  };
}
function parseMarkdownCoordinate(line: string): [number, number] | null {
  const [lng, lat] = line.split(",").map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
}

function parseCwaMarkdown(text: string): TyphoonTrack | null {
  if (!text.includes("Markdown Content")) throw new Error("CWA markdown unavailable");
  const normalizedText = String(text)
    .replace(/7級颤暴风圈/g, "7级风圈")
    .replace(/7級暴风圈/g, "7级风圈")
    .replace(/過去路徑/g, "过去路径")
    .replace(/路徑潜勢預報/g, "路径潜势预报")
    .replace(/颱颤路徑預測/g, "台风路径预测")
    .replace(/預測颱颤位置/g, "预测台风位置")
    .replace(/中心位置位於/g, "中心位置位于")
    .replace(/颱颤中心氣壓/g, "台风中心气压")
    .replace(/颱颤/g, "台风")
    .replace(/颤/g, "风")
    .replace(/級/g, "级")
    .replace(/徑/g, "径")
    .replace(/裡/g, "里");
  const lines = normalizedText.split(/\r?\n/);
  let observed: Array<[number, number]> = [];
  let forecast: Array<[number, number]> = [];
  let windPolygon: Array<[number, number]> = [];
  let currentPoint: [number, number] | null = null;
  let description = "";
  let issueMatch: RegExpMatchArray | null = null;
  let mode: "idle" | "past" | "forecast" | "wind" | "current" = "idle";
  let forecastDone = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (!issueMatch) issueMatch = line.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    if (line.includes("过去路径")) {
      mode = "past";
      continue;
    }
    if (line.includes("路径潜势预报")) {
      mode = "idle";
      continue;
    }
    if (line.includes("台风路径预测")) {
      mode = "forecast";
      continue;
    }
    if (line.includes("7级风圈")) {
      mode = "wind";
      continue;
    }
    if (line.includes("预测台风位置")) {
      mode = "idle";
      forecastDone = true;
      continue;
    }
    if (line.includes("中心位置位于") || line.includes("台风中心气压")) {
      mode = "current";
      if (line.includes("中心位置位于")) description = line;
      continue;
    }
    if (line.startsWith("#fcst") && !forecastDone) {
      mode = "forecast";
      continue;
    }
    if (line.startsWith("#past-track") || line.startsWith("#pta")) {
      continue;
    }
    if (line.startsWith("#current")) {
      mode = mode === "current" ? "current" : "wind";
      continue;
    }

    const coordinate = parseMarkdownCoordinate(line);
    if (!coordinate) continue;
    if (mode === "past") observed.push(coordinate);
    else if (mode === "forecast") forecast.push(coordinate);
    else if (mode === "wind") windPolygon.push(coordinate);
    else if (mode === "current") currentPoint = coordinate;
  }

  if (!description) {
    description = normalizedText.match(/[^\n]*中心位置位于[^\n]*/)?.[0] ?? "";
  }
  const issueTime = issueMatch ? new Date(`${issueMatch[0]}+08:00`).toISOString() : new Date().toISOString();
  return buildCwaTrack({ observed, forecast, windPolygon, currentPoint, description, issueTime });
}

interface CwaTrackInput {
  observed: Array<[number, number]>;
  forecast: Array<[number, number]>;
  windPolygon: Array<[number, number]>;
  currentPoint: [number, number] | null;
  description: string;
  issueTime: string;
}

function buildCwaTrack(input: CwaTrackInput): TyphoonTrack | null {
  const { observed, forecast, windPolygon, currentPoint, description, issueTime } = input;
  const observedPoints: TyphoonPoint[] = observed.map(([lat, lng], index) => ({
    time: new Date(new Date(issueTime).getTime() - (observed.length - 1 - index) * 6 * 60 * 60 * 1000).toISOString(),
    lat,
    lng,
    windMps: 0,
    pressureHpa: 0,
    intensity: "TY",
  }));

  const latest = observedPoints[observedPoints.length - 1] ?? (currentPoint
    ? { time: issueTime, lat: currentPoint[0], lng: currentPoint[1], windMps: 0, pressureHpa: 0, intensity: "TY" }
    : null);
  if (!latest) return null;

  if (windPolygon.length > 2) latest.windPolygon = windPolygon;
  const parsed = parseCwaDescription(description);
  if (parsed.windMps) latest.windMps = parsed.windMps;
  if (parsed.pressureHpa) latest.pressureHpa = parsed.pressureHpa;
  if (parsed.intensity) latest.intensity = parsed.intensity;
  if (parsed.windRadii) latest.windRadii = parsed.windRadii;

  const forecastPoints: TyphoonPoint[] = forecast.slice(1).map(([lat, lng], index) => ({
    time: new Date(new Date(issueTime).getTime() + (index + 1) * 6 * 60 * 60 * 1000).toISOString(),
    lat,
    lng,
    windMps: 0,
    pressureHpa: 0,
    intensity: "TY",
    isForecast: true,
    hours: (index + 1) * 6,
  }));

  return {
    id: "cwa-current",
    sourceId: "cwa",
    sourceName: "台湾中央气象署 CWA",
    sourceShort: "CWA",
    name: parsed.name,
    nameEn: parsed.nameEn,
    number: parsed.number,
    issueTime,
    speedKmh: parsed.speedKmh,
    course: parsed.course,
    points: [...observedPoints, ...forecastPoints],
  };
}

function parseCwaKml(text: string): TyphoonTrack | null {
  const doc = new DOMParser().parseFromString(text, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("CWA KML parse error");
  const placemarks = Array.from(doc.getElementsByTagName("Placemark"));
  let observed: Array<[number, number]> = [];
  let forecast: Array<[number, number]> = [];
  let windPolygon: Array<[number, number]> = [];
  let currentPoint: [number, number] | null = null;
  let description = "";

  for (const placemark of placemarks) {
    const styleUrl = placemark.getElementsByTagName("styleUrl")[0]?.textContent ?? "";
    if (styleUrl.includes("past-track")) {
      const line = placemark.getElementsByTagName("LineString")[0];
      const parsed = parseKmlCoordinates(line?.getElementsByTagName("coordinates")[0] ?? null);
      if (parsed.length > 0) observed = parsed;
    }
    if (styleUrl.includes("fcst")) {
      const line = placemark.getElementsByTagName("LineString")[0];
      const parsed = parseKmlCoordinates(line?.getElementsByTagName("coordinates")[0] ?? null);
      if (parsed.length > 0) forecast = parsed;
    }
    if (styleUrl.includes("current")) {
      const polygon = placemark.getElementsByTagName("Polygon")[0];
      const parsedPolygon = parseKmlCoordinates(polygon?.getElementsByTagName("coordinates")[0] ?? null);
      if (parsedPolygon.length > 0) windPolygon = parsedPolygon;
      const point = placemark.getElementsByTagName("Point")[0];
      const parsedPoint = parseKmlCoordinates(point?.getElementsByTagName("coordinates")[0] ?? null);
      if (parsedPoint.length > 0) currentPoint = parsedPoint[0];
      description = placemark.getElementsByTagName("description")[0]?.textContent?.trim() ?? description;
    }
  }

  const issueMatch = doc.getElementsByTagName("description")[0]?.textContent?.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  const issueTime = issueMatch ? new Date(`${issueMatch[0]}+08:00`).toISOString() : new Date().toISOString();
  return buildCwaTrack({ observed, forecast, windPolygon, currentPoint, description, issueTime });
}


function jtwcTimeToIso(raw: string, now = new Date()): string {
  const match = /^(\d{2})(\d{2})(\d{2})Z$/.exec(raw.trim().toUpperCase());
  if (!match) return new Date().toISOString();
  const day = Number(match[1]);
  const hour = Number(match[2]);
  const minute = Number(match[3]);
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, hour, minute);
  const candidates = [1, 0, -1].map((monthOffset) => new Date(base + monthOffset * 32 * 24 * 60 * 60 * 1000));
  const candidatesInMonth = candidates.map((candidate) => new Date(Date.UTC(candidate.getUTCFullYear(), candidate.getUTCMonth(), day, hour, minute)));
  const closest = candidatesInMonth.sort((a, b) => Math.abs(a.getTime() - now.getTime()) - Math.abs(b.getTime() - now.getTime()))[0];
  return closest.toISOString();
}

function jtwcCoordinateToLatLng(raw: string): [number, number] | null {
  const match = /([\d.]+)\s*([NS])\s*([\d.]+)\s*([EW])/.exec(raw.trim().toUpperCase());
  if (!match) return null;
  const lat = Number(match[1]) * (match[2] === "S" ? -1 : 1);
  const lng = Number(match[3]) * (match[4] === "W" ? -1 : 1);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

function jtwcQuadrantMax(block: number, raw: string): number {
  const label = `${String(block).padStart(3, "0")} KT WINDS`;
  const start = raw.indexOf(`RADIUS OF ${label}`);
  if (start < 0) return 0;
  const nextStart = raw.indexOf("RADIUS OF ", start + 10);
  const segment = raw.slice(start, nextStart > start ? nextStart : start + 420);
  const values = Array.from(segment.matchAll(/([\d.]+)\s*NM/gi)).map((m) => Number(m[1])).filter(Number.isFinite);
  return values.length > 0 ? Math.max(...values) : 0;
}

function jtwcRadius(raw: string, block: number): WindRadius | null {
  const nm = jtwcQuadrantMax(block, raw);
  if (!(nm > 0)) return null;
  const label = jtwcWindRadiusLabels.find((item) => item.kts === block)?.label ?? `${block}KT 风圈`;
  return {
    label,
    thresholdMps: block === 64 ? 32.9 : block === 50 ? 25.7 : 17.5,
    radiusKm: Math.round(nm * JTWC_KM_PER_NM),
  };
}

function jtwcCourseLabel(degrees: string): string {
  const value = Number(degrees);
  if (!Number.isFinite(value)) return "—";
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return directions[Math.round(value / 22.5) % 16] ?? "—";
}

function fetchJtwcSnapshots(): Promise<TyphoonSnapshot[]> {
  return fetchText(JTWC_BULLETIN_URL, undefined, 8000)
    .catch(() => fetchText(JTWC_DIRECT_URL, undefined, 8000))
    .then((text) => {
      const normalized = text.replace(/\r\n/g, "\n");
      const subject = /SUBJ\/(.+?)\s+WARNING NR\s*(\d+)\s*\/\//i.exec(normalized)
        ?? /SUPER TYPHOON\s+(\d+\w?)\s*\(([^)]+)\)\s*WARNING NR\s*(\d+)/i.exec(normalized);
      const intensityMatch = /(SUPER TYPHOON|TYPHOON|SEVERE TROPICAL STORM|TROPICAL STORM|TROPICAL DEPRESSION)\s+(\d+\w?)\s*\(([^)]+)\)/i.exec(normalized);
      const intensityRaw = intensityMatch?.[1]?.toUpperCase() ?? "TY";
      const intensity = jtwcIntensityLabels[intensityRaw] ?? intensityRaw;
      const number = intensityMatch?.[2] ?? subject?.[2] ?? "—";
      const nameEn = intensityMatch?.[3] ?? subject?.[1]?.split(/\s+/)[0] ?? "TYPHOON";
      const warningPosition = /WARNING POSITION:\s*\n?\s*(\d{6}Z)[\s\S]*?NEAR\s+([\d.]+[NS]\s*[\d.]+[EW])/i.exec(normalized);
      const positionRaw = warningPosition?.[2] ?? /NEAR\s+([\d.]+[NS]\s*[\d.]+[EW])/i.exec(normalized)?.[1];
      const latLng = positionRaw ? jtwcCoordinateToLatLng(positionRaw) : null;
      if (!latLng) return [];
      const timeRaw = warningPosition?.[1] ?? "";
      const observedTime = timeRaw ? jtwcTimeToIso(timeRaw) : new Date().toISOString();
      const windMatch = /MAX SUSTAINED WINDS - (\d+)\s*KT,\s*GUSTS\s*(\d+)\s*KT/i.exec(normalized);
      const windMps = windMatch ? Math.round(Number(windMatch[1]) * JTWC_MPS_PER_KT * 10) / 10 : 0;
      const pressureMatch = /MINIMUM CENTRAL PRESSURE AT[\s\S]*?IS\s+(\d+)\s*MB/i.exec(normalized);
      const pressureHpa = pressureMatch ? Number(pressureMatch[1]) : 0;
      const movement = /MOVEMENT PAST SIX HOURS - (\d+)\s*DEGREES AT\s*(\d+)\s*KTS?/i.exec(normalized);
      const speedKmh = movement ? Math.round(Number(movement[2]) * JTWC_KM_PER_NM * 10) / 10 : 0;
      const courseDegrees = movement?.[1] ?? "";
      const radii = [64, 50, 34].map((block) => jtwcRadius(normalized, block)).filter((radius): radius is WindRadius => radius !== null);
      const latest: TyphoonPoint = {
        time: observedTime,
        lat: latLng[0],
        lng: latLng[1],
        windMps,
        pressureHpa,
        intensity,
        windRadii: radii.length > 0 ? radii : undefined,
      };
      const forecast: TyphoonPoint[] = Array.from(normalized.matchAll(/(\d+)\s*HRS?,?\s*VALID AT:\s*(\d{6}Z)\s*---\s*([\d.]+[NS]\s*[\d.]+[EW])/gi)).map((match): TyphoonPoint | null => {
        const latLng = jtwcCoordinateToLatLng(match[3]);
        if (!latLng) return null;
        return {
          time: jtwcTimeToIso(match[2]),
          lat: latLng[0],
          lng: latLng[1],
          windMps: 0,
          pressureHpa: 0,
          intensity,
          isForecast: true,
          hours: Number(match[1]),
        } satisfies TyphoonPoint;
      }).filter((point): point is TyphoonPoint => point !== null);
      const track: TyphoonTrack = {
        id: `jtwc-${number}-current`,
        sourceId: "jtwc",
        sourceName: "美国联合台风警报中心 JTWC",
        sourceShort: "JTWC",
        name: nameEn,
        nameEn,
        number,
        issueTime: observedTime,
        speedKmh,
        course: jtwcCourseLabel(courseDegrees),
        points: [latest, ...forecast],
      };
      return [{ track, status: buildStatus(track) }];
    })
    .catch(() => []);
}

async function fetchCwaSnapshots(): Promise<TyphoonSnapshot[]> {
  if (typeof DOMParser === "undefined") return [];
  let kmlPath = CWA_DEFAULT_KML_PATH;
  try {
    const config = (await fetchJson(`/cwa-proxy${CWA_CONFIG_PATH}`, 2500)) as CwaConfig;
    if (config.typhoon?.list?.url) kmlPath = config.typhoon.list.url;
  } catch {
    // The dev/preview proxy may be unavailable; the known KML path is a safe fallback.
  }
  const normalizedPath = kmlPath.startsWith("/") ? kmlPath : `/${kmlPath}`;
  const directUrl = `https://app.cwa.gov.tw${normalizedPath}`;
  const jinaUrl = `${CWA_JINA_READER_URL}${encodeURIComponent(directUrl)}`;
  const candidates = [
    { url: `/cwa-proxy${normalizedPath}`, markdown: false, headers: undefined },
    { url: jinaUrl, markdown: true, headers: { "x-no-cache": "true" } },
    { url: directUrl, markdown: false, headers: undefined },
  ] as const;
  const results = await Promise.allSettled(
    candidates.map(async (candidate) => {
      const text = await fetchText(candidate.url, candidate.headers, 4000);
      return candidate.markdown ? parseCwaMarkdown(text) : parseCwaKml(text);
    }),
  );
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) return [{ track: result.value, status: buildStatus(result.value) }];
  }
  const firstError = results.find((result) => result.status === "rejected");
  throw firstError && firstError.status === "rejected" ? firstError.reason : new Error("CWA KML unavailable");
}

async function fetchCmaSnapshots(): Promise<TyphoonSnapshot[]> {
  const text = await (await fetch(CMA_LIST_URL, { signal: AbortSignal.timeout(12000) })).text();
  const payload = unwrapJsonp(text) as CmaListPayload;
  const active = (payload.typhoonList ?? []).filter((entry) => entry[7] === "start");
  const tracks = (
    await Promise.all(
      active.map((entry) => fetchCmaTrack(numberValue(entry[0]), String(entry[1] ?? ""), String(entry[2] ?? ""), String(entry[3] ?? "")).catch(() => null)),
    )
  ).filter((track): track is TyphoonTrack => track !== null);
  return tracks.map((track) => ({ track, status: buildStatus(track) }));
}

const courseLabels: Record<string, string> = {
  N: "北",
  NNE: "北东北",
  NE: "东北",
  ENE: "东东北",
  E: "东",
  ESE: "东东南",
  SE: "东南",
  SSE: "南东南",
  S: "南",
  SSW: "南西南",
  SW: "西南",
  WSW: "西西南",
  W: "西",
  WNW: "西西北",
  NW: "西北",
  NNW: "北西北",
};

function courseLabel(course: string): string {
  return courseLabels[course.toUpperCase()] ?? course;
}

function buildStatus(track: TyphoonTrack): TyphoonStatus {
  const latest = track.points.filter((point) => !point.isForecast).at(-1) ?? track.points[0];
  return {
    trackId: track.id,
    sourceId: track.sourceId,
    sourceName: track.sourceName,
    sourceShort: track.sourceShort,
    name: track.name,
    nameEn: track.nameEn,
    number: track.number,
    intensity: intensityLabel(latest?.intensity ?? ""),
    positionLabel: latest ? positionLabel(latest.lat, latest.lng) : "—",
    lat: latest?.lat ?? 0,
    lng: latest?.lng ?? 0,
    pressureHpa: latest?.pressureHpa ?? 0,
    windMps: latest?.windMps ?? 0,
    speedKmh: track.speedKmh,
    course: courseLabel(track.course),
    issueTime: track.issueTime,
    isForecast: Boolean(latest?.isForecast),
  };
}

function demoSnapshots(): TyphoonSnapshot[] {
  return demoTracks.map((track, index) => {
    const start = new Date(track.startTime).getTime();
    const points: TyphoonPoint[] = track.points.map((point, pointIndex) => ({
      time: new Date(start + pointIndex * 12 * 60 * 60 * 1000).toISOString(),
      lat: point.lat,
      lng: point.lng,
      windMps: Number((point.windKmh / 3.6).toFixed(1)),
      pressureHpa: point.pressureHpa,
      intensity: point.intensity,
      isForecast: point.isForecast,
      hours: point.isForecast ? (pointIndex - track.points.findIndex((candidate) => candidate.isForecast)) * 12 : undefined,
    }));
    const liveTrack: TyphoonTrack = {
      id: `demo-${track.id}`,
      sourceId: "demo",
      sourceName: "本地演示 DEMO",
      sourceShort: "DEMO",
      name: track.name,
      nameEn: track.nameEn,
      number: index === 0 ? "2026-13" : "2026-12",
      issueTime: points[0]?.time ?? new Date().toISOString(),
      speedKmh: index === 0 ? 15 : 18,
      course: "西北西",
      points,
    };
    return { track: liveTrack, status: buildStatus(liveTrack) };
  });
}

export async function fetchTyphoonSnapshots(): Promise<TyphoonSnapshot[]> {
  const [jma, cma, cwa, jtwc] = await Promise.all([
    fetchJmaSnapshots().catch(() => []),
    fetchCmaSnapshots().catch(() => []),
    fetchCwaSnapshots().catch(() => []),
    fetchJtwcSnapshots().catch(() => []),
  ]);
  const live = [...jma, ...cma, ...cwa, ...jtwc];
  return live.length > 0 ? live : demoSnapshots();
}

export { positionLabel };















