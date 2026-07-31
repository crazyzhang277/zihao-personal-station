import "../main";
import "leaflet/dist/leaflet.css";
import "../styles/typhoon.css";
import L from "leaflet";
import {
  fetchTyphoonSnapshots,
  formatTime,
  intensityLabels,
  type TyphoonSnapshot,
  type TyphoonSourceId,
  type TyphoonStatus,
  type TyphoonTrack,
} from "../lib/typhoon-api";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const sourceTheme: Record<TyphoonSourceId, { color: string; badge: string }> = {
  jma: { color: "#a63c2b", badge: "JMA" },
  cma: { color: "#1f6878", badge: "CMA" },
  cwa: { color: "#a97c1f", badge: "CWA" },
  jtwc: { color: "#4f6b3e", badge: "JTWC" },
  demo: { color: "#8a7a5f", badge: "DEMO" },
};

const map = L.map("typhoon-map", {
  zoomControl: false,
  attributionControl: true,
  minZoom: 2,
  maxZoom: 10,
}).setView([22, 150], 4);

L.control.zoom({ position: "topright" }).addTo(map);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
  subdomains: "abc",
}).addTo(map);

const layers: Record<TyphoonSourceId, L.LayerGroup> = {
  jma: L.layerGroup().addTo(map),
  cma: L.layerGroup().addTo(map),
  cwa: L.layerGroup().addTo(map),
  jtwc: L.layerGroup().addTo(map),
  demo: L.layerGroup().addTo(map),
};

const refreshButton = document.getElementById("refresh-typhoons");
const dataBadge = document.getElementById("data-badge");
const lastUpdated = document.getElementById("last-updated");
const sourceCards = document.getElementById("source-cards");
const loadingEl = document.getElementById("map-loading");

let snapshots: TyphoonSnapshot[] = [];
let refreshing = false;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setLoading(active: boolean): void {
  if (!loadingEl) return;
  loadingEl.classList.toggle("map-loading--hidden", !active);
  loadingEl.textContent = active ? "正在连接真实数据源…" : "";
}

function pointIntensity(intensity: string): string {
  return (intensityLabels[intensity] ?? intensity) || "未知";
}

function renderWindRadii(track: TyphoonTrack): void {
  const latest = track.points.filter((point) => !point.isForecast).at(-1);
  if (!latest) return;
  const theme = sourceTheme[track.sourceId];
  const group = layers[track.sourceId];
  const windOptions = {
    color: theme.color,
    weight: 1.3,
    dashArray: "5 6",
    fillColor: theme.color,
    fillOpacity: 0.09,
  };

  if (latest.windPolygon?.length) {
    L.polygon(latest.windPolygon, windOptions).addTo(group);
  } else {
    [...(latest.windRadii ?? [])]
      .sort((a, b) => b.radiusKm - a.radiusKm)
      .forEach((radius) => {
        L.circle([latest.lat, latest.lng], {
          ...windOptions,
          radius: radius.radiusKm * 1000,
        }).addTo(group);
      });
  }
}

function renderTrack(track: TyphoonTrack): void {
  const theme = sourceTheme[track.sourceId];
  const group = layers[track.sourceId];
  const observed = track.points.filter((point) => !point.isForecast);
  const forecast = track.points.filter((point) => point.isForecast);
  renderWindRadii(track);

  if (observed.length > 1) {
    L.polyline(
      observed.map((point) => [point.lat, point.lng] as [number, number]),
      { color: theme.color, weight: 3, opacity: 0.9 },
    ).addTo(group);
  }

  if (forecast.length > 0) {
    L.polyline(
      forecast.map((point) => [point.lat, point.lng] as [number, number]),
      { color: theme.color, weight: 2.4, opacity: 0.75, dashArray: "6 8" },
    ).addTo(group);
  }

  observed.forEach((point, index) => {
    const isLatest = index === observed.length - 1;
    const marker = L.circleMarker([point.lat, point.lng], {
      radius: isLatest ? 7 : 3.4,
      color: isLatest ? "#fbf8f1" : theme.color,
      weight: isLatest ? 3 : 1.2,
      fillColor: theme.color,
      fillOpacity: isLatest ? 1 : 0.55,
    }).addTo(group);

    marker.bindTooltip(
      [
        `${formatTime(point.time)}`,
        `${pointIntensity(point.intensity)}`,
        point.pressureHpa > 0 ? `${point.pressureHpa} hPa` : "",
        point.windMps > 0 ? `${point.windMps} m/s` : "",
      ]
        .filter(Boolean)
        .join("<br>"),
      { direction: "top", offset: [0, -6] },
    );

    if (isLatest) {
      marker.bindPopup(
        [
          `<strong>${escapeHtml(track.nameEn)} ${escapeHtml(track.number)}</strong>`,
          `${pointIntensity(point.intensity)}`,
          `位置 ${point.lat.toFixed(2)}°N / ${point.lng.toFixed(2)}°E`,
          track.course && track.course !== "—" ? `移向 ${escapeHtml(track.course)} · ${track.speedKmh} km/h` : "",
        ]
          .filter(Boolean)
          .join("<br>"),
      );
    }
  });

  forecast.forEach((point) => {
    L.circleMarker([point.lat, point.lng], {
      radius: 2.8,
      color: theme.color,
      weight: 1,
      fillColor: "#fbf8f1",
      fillOpacity: 0.8,
      dashArray: "2 2",
    })
      .bindTooltip(
        [
          `预报 +${point.hours ?? "?"}h`,
          `${formatTime(point.time)}`,
          `${pointIntensity(point.intensity)}`,
        ].join("<br>"),
        { direction: "top", offset: [0, -4] },
      )
      .addTo(group);
  });
}

function renderSnapshots(next: TyphoonSnapshot[]): void {
  snapshots = next;
  Object.values(layers).forEach((group) => group.clearLayers());
  snapshots.forEach((snapshot) => renderTrack(snapshot.track));
  renderSourceCards();
  renderBadge();
  fitToSnapshots();
}

function fitToSnapshots(): void {
  const observed = snapshots.flatMap((snapshot) =>
    snapshot.track.points.filter((point) => !point.isForecast).map((point) => [point.lat, point.lng] as [number, number]),
  );
  if (observed.length === 0) return;
  const bounds = L.latLngBounds(observed);
  if (!bounds.isValid()) return;
  map.fitBounds(bounds, { padding: [46, 46], maxZoom: 6 });
}

function renderBadge(): void {
  if (!dataBadge || !lastUpdated) return;
  const liveCount = snapshots.filter((snapshot) => snapshot.track.sourceId !== "demo").length;
  if (snapshots.length === 0 || liveCount === 0) {
    dataBadge.textContent = "演示数据";
    dataBadge.className = "typhoon-data-badge typhoon-data-badge--demo";
  } else {
    dataBadge.textContent = liveCount === snapshots.length ? `${liveCount} 源实时` : `${liveCount}/${snapshots.length} 源实时`;
    dataBadge.className = "typhoon-data-badge typhoon-data-badge--live";
  }
  lastUpdated.textContent = `上次刷新 ${new Date().toLocaleTimeString("zh-CN", { hour12: false })}`;
}

function renderSourceCards(): void {
  if (!sourceCards) return;
  if (snapshots.length === 0) {
    sourceCards.innerHTML = '<p class="source-cards__empty">暂无可用数据，请稍后重试。</p>';
    return;
  }
  sourceCards.innerHTML = snapshots.map(sourceCardMarkup).join("");
}

function sourceCardMarkup(snapshot: TyphoonSnapshot): string {
  const status: TyphoonStatus = snapshot.status;
  const theme = sourceTheme[status.sourceId];
  const isLive = status.sourceId !== "demo";
  const latestPoint = snapshot.track.points.filter((point) => !point.isForecast).at(-1);
  const windRadiiLabel = latestPoint?.windRadii?.length
    ? latestPoint.windRadii.map((radius) => `${radius.label} ${radius.radiusKm}km`).join(" · ")
    : latestPoint?.windPolygon?.length
      ? "风圈已绘制"
      : "—";
  const rows: Array<[string, string]> = [
    ["位置", status.positionLabel],
    ["强度", status.intensity],
    ["中心气压", status.pressureHpa > 0 ? `${status.pressureHpa} hPa` : "—"],
    ["最大风速", status.windMps > 0 ? `${status.windMps} m/s` : "—"],
    ["风圈范围", windRadiiLabel],
    ["移向 / 移速", `${status.course} / ${status.speedKmh > 0 ? `${status.speedKmh} km/h` : "—"}`],
  ];

  return `
    <article class="source-card source-card--${status.sourceId}">
      <header class="source-card__head">
        <span class="source-card__id" style="--source-color: ${theme.color}">${theme.badge}</span>
        <span class="source-card__state">${isLive ? "LIVE" : "DEMO"}</span>
      </header>
      <h3>${escapeHtml(status.name)} <small>${escapeHtml(status.nameEn)}</small></h3>
      <p class="source-card__number">编号 #${escapeHtml(status.number)} · ${escapeHtml(status.sourceName)}</p>
      <dl class="source-card__stats">
        ${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
      </dl>
      <footer class="source-card__foot">
        <span>观测 ${formatTime(status.issueTime)}</span>
        <span>${isLive ? "自动刷新" : "回退数据"}</span>
      </footer>
    </article>
  `;
}

async function refresh(): Promise<void> {
  if (refreshing) return;
  refreshing = true;
  setLoading(true);
  try {
    renderSnapshots(await fetchTyphoonSnapshots());
  } catch {
    renderBadge();
  } finally {
    refreshing = false;
    setLoading(false);
  }
}

refreshButton?.addEventListener("click", () => void refresh());
window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
void refresh();



