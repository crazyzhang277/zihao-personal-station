import "../main";
import "leaflet/dist/leaflet.css";
import "../styles/typhoon.css";
import L from "leaflet";
import {
  filterHistoricalStorms,
  historicalIntensity,
  loadHistoricalIndex,
  loadHistoricalYear,
  type HistoricalIndex,
  type HistoricalStorm,
  type HistoricalStormSummary,
} from "../lib/historical-typhoons";
import {
  fetchTyphoonSnapshotsDetail,
  formatTime,
  intensityLabels,
  type TyphoonSnapshot,
  type TyphoonSnapshotDetail,
  type TyphoonSourceId,
  type TyphoonStatus,
  type TyphoonTrack,
} from "../lib/typhoon-api";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const HISTORY_RESULT_LIMIT = 80;
type TyphoonMode = "live" | "history";

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

const amapLayer = L.tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}", {
  attribution: '&copy; <a href="https://www.amap.com/">高德地图</a>',
  maxZoom: 18,
  subdomains: "1234",
});
const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
  subdomains: "abc",
});
amapLayer.addTo(map);

let baseTileErrors = 0;
let baseErrorWindow: number | null = null;
amapLayer.on("tileerror", () => {
  baseTileErrors += 1;
  if (baseErrorWindow === null) {
    baseErrorWindow = window.setTimeout(() => {
      baseErrorWindow = null;
      if (baseTileErrors >= 3) {
        map.removeLayer(amapLayer);
        osmLayer.addTo(map);
      }
      baseTileErrors = 0;
    }, 5000);
  }
});

const layers: Record<TyphoonSourceId, L.LayerGroup> = {
  jma: L.layerGroup().addTo(map),
  cma: L.layerGroup().addTo(map),
  cwa: L.layerGroup().addTo(map),
  jtwc: L.layerGroup().addTo(map),
  demo: L.layerGroup().addTo(map),
};
const historyLayer = L.layerGroup().addTo(map);

const refreshButton = document.getElementById("refresh-typhoons");
const dataBadge = document.getElementById("data-badge");
const lastUpdated = document.getElementById("last-updated");
const sourceCards = document.getElementById("source-cards");
const loadingEl = document.getElementById("map-loading");
const modeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-typhoon-mode]"));
const historyFilters = document.getElementById("history-filters");
const historyYear = document.getElementById("history-year") as HTMLSelectElement | null;
const historySearch = document.getElementById("history-search") as HTMLInputElement | null;
const historyCount = document.getElementById("history-count");
const historyPanel = document.getElementById("history-panel");
const historyResults = document.getElementById("history-results");
const historyDetail = document.getElementById("history-detail");
const liveLegend = document.getElementById("live-legend");
const historyLegend = document.getElementById("history-legend");
const sourcePanelFoot = document.getElementById("source-panel-foot");

let snapshots: TyphoonSnapshot[] = [];
let unavailableSources: TyphoonSourceId[] = [];
let refreshing = false;
let mode: TyphoonMode = "live";
let refreshTimer: number | null = null;
let historyIndex: HistoricalIndex | null = null;
let filteredHistory: HistoricalStormSummary[] = [];
const historyYearCache = new Map<number, HistoricalStorm[]>();

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

function liveLayerGroups(): L.LayerGroup[] {
  return Object.values(layers);
}

function showLiveLayers(show: boolean): void {
  liveLayerGroups().forEach((group) => {
    if (show && !map.hasLayer(group)) group.addTo(map);
    if (!show && map.hasLayer(group)) group.removeFrom(map);
  });
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

function renderSnapshots(next: TyphoonSnapshotDetail): void {
  snapshots = next.snapshots;
  unavailableSources = next.unavailable;
  Object.values(layers).forEach((group) => group.clearLayers());
  snapshots.forEach((snapshot) => renderTrack(snapshot.track));
  renderSourceCards();
  renderBadge();
  fitToSnapshots();
}

function stormDisplayName(storm: Pick<HistoricalStormSummary, "nameEn" | "nameZh">): string {
  return storm.nameZh ? `${storm.nameZh} ${storm.nameEn}` : storm.nameEn;
}

function archiveDate(iso: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function durationDays(start: string, end: string): string {
  const days = (new Date(end).getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 1000);
  return `${Math.max(0, Math.round(days * 10) / 10)} 天`;
}

function renderHistoryFilters(): void {
  if (!historyYear || !historyIndex) return;
  historyYear.innerHTML = [
    '<option value="">全部年份</option>',
    ...historyIndex.years.map((year) => `<option value="${year}">${year} 年</option>`),
  ].join("");
}

function renderHistoryResults(): void {
  if (!historyResults || !historyCount || !historyIndex) return;
  const year = historyYear?.value ? Number(historyYear.value) : null;
  filteredHistory = filterHistoricalStorms(historyIndex.storms, {
    year,
    query: historySearch?.value ?? "",
  });
  historyCount.textContent = `${filteredHistory.length} 条`;

  if (filteredHistory.length === 0) {
    historyResults.innerHTML = '<div class="history-empty"><strong>未找到历史台风</strong><p>尝试其他中文名、英文名、编号或年份。</p></div>';
    return;
  }

  historyResults.innerHTML = filteredHistory.slice(0, HISTORY_RESULT_LIMIT).map((storm) => `
    <button class="history-result" type="button" data-history-sid="${escapeHtml(storm.sid)}" data-history-year="${storm.season}">
      <span class="history-result__year">${storm.season}</span>
      <span class="history-result__name"><strong>${escapeHtml(stormDisplayName(storm))}</strong><small>${escapeHtml(storm.sid)} · #${escapeHtml(storm.number)}</small></span>
      <span class="history-result__strength">${escapeHtml(storm.strongestIntensity)}</span>
    </button>
  `).join("") + (filteredHistory.length > HISTORY_RESULT_LIMIT
    ? `<p class="history-results__more">显示前 ${HISTORY_RESULT_LIMIT} 条，请输入名称或编号缩小范围。</p>`
    : "");
}

function historyMarkerIndexes(pointCount: number): Set<number> {
  const indexes = new Set([0, Math.max(0, pointCount - 1)]);
  const step = Math.max(1, Math.ceil(pointCount / 12));
  for (let index = step; index < pointCount - 1; index += step) indexes.add(index);
  return indexes;
}

function renderHistoricalTrack(storm: HistoricalStorm, summary: HistoricalStormSummary): void {
  historyLayer.clearLayers();
  for (let index = 1; index < storm.points.length; index += 1) {
    const previous = storm.points[index - 1];
    const point = storm.points[index];
    const color = historicalIntensity(point.windKts ?? previous.windKts).color;
    L.polyline([[previous.lat, previous.lng], [point.lat, point.lng]], {
      color,
      weight: 3.4,
      opacity: 0.9,
    }).addTo(historyLayer);
  }

  const markerIndexes = historyMarkerIndexes(storm.points.length);
  markerIndexes.forEach((index) => {
    const point = storm.points[index];
    const endpoint = index === 0 || index === storm.points.length - 1;
    const intensity = historicalIntensity(point.windKts);
    L.circleMarker([point.lat, point.lng], {
      radius: endpoint ? 6 : 3,
      color: endpoint ? "#fbf8f1" : intensity.color,
      weight: endpoint ? 2.5 : 1,
      fillColor: intensity.color,
      fillOpacity: 0.92,
    }).bindTooltip([
      archiveDate(point.time),
      intensity.label,
      point.windKts !== null ? `${point.windKts} kt / ${Math.round(point.windKts * 1.852)} km/h` : "",
      point.pressureHpa !== null ? `${point.pressureHpa} hPa` : "",
    ].filter(Boolean).join("<br>"), { direction: "top", offset: [0, -5] }).addTo(historyLayer);
  });

  const bounds = L.latLngBounds(storm.points.map((point) => [point.lat, point.lng] as [number, number]));
  if (bounds.isValid()) map.fitBounds(bounds, { padding: [48, 48], maxZoom: 7 });
  renderHistoricalDetail(summary);
}

function renderHistoricalDetail(summary: HistoricalStormSummary): void {
  if (!historyDetail) return;
  historyDetail.hidden = false;
  historyDetail.innerHTML = `
    <header><span>SELECTED ARCHIVE</span><strong>${escapeHtml(stormDisplayName(summary))}</strong><small>${escapeHtml(summary.sid)} · #${escapeHtml(summary.number)}</small></header>
    <dl>
      <div><dt>活动时间</dt><dd>${archiveDate(summary.startTime)} — ${archiveDate(summary.endTime)}</dd></div>
      <div><dt>持续</dt><dd>${durationDays(summary.startTime, summary.endTime)}</dd></div>
      <div><dt>最强等级</dt><dd>${escapeHtml(summary.strongestIntensity)}</dd></div>
      <div><dt>最大风速</dt><dd>${summary.maxWindKts !== null ? `${summary.maxWindKts} kt / ${Math.round(summary.maxWindKts * 1.852)} km/h` : "暂无记录"}</dd></div>
      <div><dt>最低气压</dt><dd>${summary.minPressureHpa !== null ? `${summary.minPressureHpa} hPa` : "暂无记录"}</dd></div>
      <div><dt>路径点</dt><dd>${summary.pointCount}</dd></div>
    </dl>`;
}

async function selectHistoricalStorm(summary: HistoricalStormSummary): Promise<void> {
  setLoading(true);
  try {
    let storms = historyYearCache.get(summary.season);
    if (!storms) {
      storms = (await loadHistoricalYear(summary.season)).storms;
      historyYearCache.set(summary.season, storms);
    }
    const storm = storms.find((candidate) => candidate.sid === summary.sid);
    if (!storm) throw new Error(`Year shard does not contain ${summary.sid}`);
    renderHistoricalTrack(storm, summary);
    historyResults?.querySelectorAll(".history-result").forEach((element) => {
      element.classList.toggle("is-selected", (element as HTMLElement).dataset.historySid === summary.sid);
    });
  } catch {
    if (historyDetail) {
      historyDetail.hidden = false;
      historyDetail.innerHTML = '<div class="history-empty"><strong>该年份档案加载失败</strong><p>请检查网络后重新选择。</p></div>';
    }
  } finally {
    setLoading(false);
  }
}

async function ensureHistoryIndex(): Promise<void> {
  if (historyIndex) return;
  setLoading(true);
  try {
    historyIndex = await loadHistoricalIndex();
    renderHistoryFilters();
    renderHistoryResults();
  } catch {
    if (historyResults) {
      historyResults.innerHTML = '<button class="history-retry" type="button" data-history-retry>历史档案加载失败，点击重试</button>';
    }
  } finally {
    setLoading(false);
  }
}

function scheduleRefresh(): void {
  if (refreshTimer !== null) window.clearInterval(refreshTimer);
  refreshTimer = mode === "live" ? window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS) : null;
}

async function setMode(nextMode: TyphoonMode): Promise<void> {
  if (mode === nextMode) return;
  mode = nextMode;
  modeButtons.forEach((button) => {
    const active = button.dataset.typhoonMode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const historical = mode === "history";
  if (historyFilters) historyFilters.hidden = !historical;
  if (historyPanel) historyPanel.hidden = !historical;
  if (sourceCards) sourceCards.hidden = historical;
  if (liveLegend) liveLegend.hidden = historical;
  if (historyLegend) historyLegend.hidden = !historical;
  if (refreshButton) refreshButton.hidden = historical;
  if (dataBadge) dataBadge.hidden = historical;
  if (lastUpdated) lastUpdated.hidden = historical;
  if (sourcePanelFoot) {
    sourcePanelFoot.textContent = historical
      ? "历史最佳路径来自 NOAA/NCEI IBTrACS v04r01，覆盖 1980 年至今的西北太平洋。历史路径用于回顾，不代表实时预报。"
      : "实线为观测路径，虚线为预报外推；半透明圆圈为各机构发布的风圈影响范围。数据源不可用时会自动回退到本地演示路径。";
  }
  showLiveLayers(!historical);
  if (historical) {
    if (!map.hasLayer(historyLayer)) historyLayer.addTo(map);
    await ensureHistoryIndex();
  } else {
    historyLayer.clearLayers();
    historyLayer.removeFrom(map);
    fitToSnapshots();
  }
  scheduleRefresh();
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
  if (snapshots.length === 0 && unavailableSources.length === 0) {
    sourceCards.innerHTML = '<p class="source-cards__empty">暂无可用数据，请稍后重试。</p>';
    return;
  }
  const offlineMarkup = unavailableSources.map(sourceUnavailableMarkup).join("");
  sourceCards.innerHTML = snapshots.map(sourceCardMarkup).join("") + offlineMarkup;
}

const sourceFullNames: Record<TyphoonSourceId, string> = {
  jma: "JMA 日本气象厅",
  cma: "CMA 中央气象台",
  cwa: "CWA 台湾中央气象署",
  jtwc: "JTWC 联合台风警报中心",
  demo: "DEMO 演示数据",
};

function sourceUnavailableMarkup(sourceId: TyphoonSourceId): string {
  const theme = sourceTheme[sourceId];
  return '\n    <article class="source-card source-card--' + sourceId + ' source-card--offline">\n      <header class="source-card__head">\n        <span class="source-card__id" style="--source-color: ' + theme.color + '">' + theme.badge + '</span>\n        <span class="source-card__state">OFFLINE</span>\n      </header>\n      <h3>' + sourceFullNames[sourceId] + '</h3>\n      <p class="source-card__number">数据源当前不可达，本轮已自动跳过；请检查网络或稍后刷新。</p>\n      <footer class="source-card__foot">\n        <span>连接超时</span>\n        <span>降级提示</span>\n      </footer>\n    </article>\n  ';
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
  if (refreshing || mode !== "live") return;
  refreshing = true;
  setLoading(true);
  try {
    renderSnapshots(await fetchTyphoonSnapshotsDetail());
  } catch {
    renderBadge();
  } finally {
    refreshing = false;
    setLoading(false);
  }
}

refreshButton?.addEventListener("click", () => void refresh());
modeButtons.forEach((button) => button.addEventListener("click", () => {
  void setMode(button.dataset.typhoonMode === "history" ? "history" : "live");
}));
historyYear?.addEventListener("change", renderHistoryResults);
historySearch?.addEventListener("input", renderHistoryResults);
historyResults?.addEventListener("click", (event) => {
  const retry = (event.target as HTMLElement).closest<HTMLElement>("[data-history-retry]");
  if (retry) {
    historyIndex = null;
    void ensureHistoryIndex();
    return;
  }
  const result = (event.target as HTMLElement).closest<HTMLElement>("[data-history-sid]");
  if (!result) return;
  const summary = filteredHistory.find((storm) => storm.sid === result.dataset.historySid);
  if (summary) void selectHistoricalStorm(summary);
});
scheduleRefresh();
void refresh();



