import "../main";
import { aboutContent } from "../data/content";
import { getCity, fetchWeather, weatherText } from "../lib/weather-api";
import { fetchTyphoonSnapshots } from "../lib/typhoon-api";

const tempEl = document.getElementById("home-weather-temp");
const descEl = document.getElementById("home-weather-desc");
const typeEl = document.getElementById("home-network-type");
const metaEl = document.getElementById("home-network-meta");
const bioEl = document.getElementById("home-about-bio");
const typhoonTitleEl = document.getElementById("home-typhoon-title");
const typhoonMetaEl = document.getElementById("home-typhoon-meta");

if (bioEl) bioEl.textContent = aboutContent.shortBio;

interface HomeNetworkInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  addEventListener?: (type: "change", listener: () => void) => void;
}

function readConnection(): HomeNetworkInfo | undefined {
  const nav = navigator as Navigator & { connection?: HomeNetworkInfo };
  return nav.connection;
}

function updateNetworkSummary(): void {
  const connection = readConnection();
  if (!typeEl || !metaEl) return;
  if (!connection) {
    typeEl.textContent = "未知";
    metaEl.textContent = "浏览器未提供连接信息，可在网络探针页手动探测。";
    return;
  }
  const effective = connection.effectiveType ?? "unknown";
  typeEl.textContent = effective.toUpperCase();
  const rtt = connection.rtt != null ? `${connection.rtt} ms` : "暂无 RTT";
  const downlink = connection.downlink != null ? `${connection.downlink} Mb/s` : "暂无数据";
  metaEl.textContent = `${rtt} · ${downlink}`;
}

async function updateTyphoonSummary(): Promise<void> {
  if (!typhoonTitleEl || !typhoonMetaEl) return;
  try {
    const snapshots = await fetchTyphoonSnapshots();
    const live = snapshots.find((snapshot) => snapshot.track.sourceId === "cma") ?? snapshots.find((snapshot) => snapshot.track.sourceId !== "demo") ?? snapshots[0];
    if (!live) return;
    const status = live.status;
    const movement = status.course.includes("西") ? "西行" : status.course.includes("北") ? "北上" : "移动中";
    typhoonTitleEl.textContent = `${status.name}${movement}`;
    const sourceList = [...new Set(snapshots.map((snapshot) => snapshot.track.sourceShort))].join(" + ");
    typhoonMetaEl.textContent = `${sourceList} · ${status.intensity} · ${snapshots.length} 个源`;
  } catch {
    typhoonTitleEl.textContent = "台风雷达连接中";
    typhoonMetaEl.textContent = "JMA + CMA + CWA · 稍后自动重试";
  }
}

async function updateWeatherSummary(): Promise<void> {
  if (!tempEl || !descEl) return;
  try {
    const city = getCity("shanghai");
    const bundle = await fetchWeather(city, AbortSignal.timeout(8000));
    tempEl.textContent = String(Math.round(bundle.current.temperature));
    descEl.textContent = `${weatherText(bundle.current.weatherCode)} · ${bundle.current.source === "live" ? "Open-Meteo 实时" : "演示"}`;
  } catch {
    tempEl.textContent = "31";
    descEl.textContent = "上海 · 演示数据";
  }
}

if ("connection" in navigator) {
  const connection = readConnection();
  connection?.addEventListener?.("change", updateNetworkSummary);
}
updateNetworkSummary();
void updateTyphoonSummary();
void updateWeatherSummary();


