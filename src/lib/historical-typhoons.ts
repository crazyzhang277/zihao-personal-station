export interface HistoricalStormSummary {
  sid: string;
  season: number;
  number: string;
  nameEn: string;
  nameZh: string | null;
  startTime: string;
  endTime: string;
  maxWindKts: number | null;
  minPressureHpa: number | null;
  strongestIntensity: string;
  pointCount: number;
}

export interface HistoricalPoint {
  time: string;
  lat: number;
  lng: number;
  windKts: number | null;
  pressureHpa: number | null;
  nature: string;
}

export interface HistoricalStorm {
  sid: string;
  season: number;
  number: string;
  nameEn: string;
  nameZh: string | null;
  points: HistoricalPoint[];
}

export interface HistoricalIndex {
  version: string;
  basin: "WP";
  generatedAt: string;
  sourceUrl: string;
  years: number[];
  storms: HistoricalStormSummary[];
}

export interface HistoricalYear {
  year: number;
  storms: HistoricalStorm[];
}

export interface HistoricalFilters {
  query: string;
  year: number | null;
}

export interface HistoricalIntensity {
  code: "unknown" | "TD" | "TS" | "STS" | "TY" | "STY" | "SuperTY";
  label: string;
  color: string;
}

function dataUrl(path: string): string {
  return `${import.meta.env.BASE_URL}data/typhoons/${path}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(dataUrl(path), { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`历史台风数据加载失败：HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export function loadHistoricalIndex(): Promise<HistoricalIndex> {
  return fetchJson<HistoricalIndex>("index.json");
}

export function loadHistoricalYear(year: number): Promise<HistoricalYear> {
  return fetchJson<HistoricalYear>(`years/${year}.json`);
}

export function filterHistoricalStorms(
  storms: HistoricalStormSummary[],
  filters: HistoricalFilters,
): HistoricalStormSummary[] {
  const query = filters.query.trim().toLocaleLowerCase("zh-CN");
  return storms
    .filter((storm) => filters.year === null || storm.season === filters.year)
    .filter((storm) => {
      if (!query) return true;
      return [storm.sid, storm.number, storm.nameEn, storm.nameZh ?? "", String(storm.season)]
        .some((value) => value.toLocaleLowerCase("zh-CN").includes(query));
    })
    .sort((a, b) => b.startTime.localeCompare(a.startTime));
}

export function historicalIntensity(windKts: number | null): HistoricalIntensity {
  if (windKts === null) return { code: "unknown", label: "未知", color: "#777267" };
  if (windKts >= 130) return { code: "SuperTY", label: "超强台风", color: "#8f1d14" };
  if (windKts >= 100) return { code: "STY", label: "强台风", color: "#c24825" };
  if (windKts >= 64) return { code: "TY", label: "台风", color: "#d37828" };
  if (windKts >= 48) return { code: "STS", label: "强热带风暴", color: "#b09a2b" };
  if (windKts >= 34) return { code: "TS", label: "热带风暴", color: "#3f7c65" };
  return { code: "TD", label: "热带低压", color: "#52758a" };
}
