import "../main";

interface NetworkInformationLike {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface ProbeResult {
  endpoint: string;
  label: string;
  latencyMs: number;
  ok: boolean;
}

const LATENCY_STORAGE_KEY = "latency-history";

export interface LatencySample {
  endpoint: string;
  label: string;
  latencyMs: number;
  ok: boolean;
  timestamp: string;
}

function loadLatencyHistory(): LatencySample[] {
  try {
    const raw = localStorage.getItem(LATENCY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLatencyHistory(samples: LatencySample[]): void {
  localStorage.setItem(LATENCY_STORAGE_KEY, JSON.stringify(samples));
}

export function addLatencySamples(newSamples: LatencySample[]): void {
  const history = loadLatencyHistory();
  const updated = [...newSamples, ...history].slice(0, 500);
  saveLatencyHistory(updated);
}

export function getLatencyHistory(): LatencySample[] {
  return loadLatencyHistory();
}

const ENDPOINTS = [
  { endpoint: "https://api.github.com/zen", label: "GitHub Zen" },
  { endpoint: "https://www.cloudflare.com/cdn-cgi/trace", label: "Cloudflare Trace" },
  { endpoint: "https://api.open-meteo.com/v1/forecast?latitude=31.23&longitude=121.47&current_weather=true", label: "Open-Meteo" },
];

const history: number[] = [];
const MAX_HISTORY = 12;

const probeButton = document.getElementById("probe-button") as HTMLButtonElement | null;
const probeStatus = document.getElementById("probe-status");
const resultList = document.getElementById("result-list");
const latestTime = document.getElementById("probe-latest-time");
const chartGrid = document.getElementById("chart-grid");
const chartLine = document.getElementById("chart-line");
const chartPoints = document.getElementById("chart-points");

function readConnection(): NetworkInformationLike | null {
  const nav = navigator as Navigator & { connection?: NetworkInformationLike };
  return nav.connection ?? null;
}

function renderConnection(): void {
  const connection = readConnection();
  const note = document.getElementById("connection-note");
  const fields: Array<[string, string]> = [];
  if (!connection) {
    fields.push(["网络类型", "未知"], ["下载速率", "—"], ["往返延迟", "—"], ["省流量模式", "—"]);
    if (note) note.textContent = "当前浏览器未提供 navigator.connection，可手动探测延迟。";
  } else {
    fields.push(
      ["网络类型", (connection.effectiveType ?? "unknown").toUpperCase()],
      ["下载速率", connection.downlink != null ? connection.downlink + " Mb/s" : "—"],
      ["往返延迟", connection.rtt != null ? connection.rtt + " ms" : "—"],
      ["省流量模式", connection.saveData ? "是" : "否"],
    );
    if (note) note.textContent = "连接信息来自浏览器 Network Information API，手动探测会测量真实 RTT。";
  }
  const ids = ["net-effective-type", "net-downlink", "net-rtt", "net-save-data"];
  ids.forEach((id, index) => {
    const el = document.getElementById(id);
    if (el) el.textContent = fields[index]?.[1] ?? "—";
  });
}

function latencyText(ms: number): string {
  if (ms < 1) return "<1 ms";
  return Math.round(ms) + " ms";
}

function renderResults(results: ProbeResult[]): void {
  if (!resultList) return;
  resultList.innerHTML = results
    .map((result) =>
      '<div class="result-item' + (result.ok ? "" : " is-failed") + '">' +
      '<span class="result-item__endpoint">' + result.label + ' · ' + result.endpoint + '</span>' +
      '<span class="result-item__latency">' + (result.ok ? latencyText(result.latencyMs) : "失败") + '</span>' +
      '</div>'
    )
    .join("");
}

function chartGeometry(): { width: number; height: number; padding: number } {
  return { width: 600, height: 190, padding: 28 };
}

function drawChart(): void {
  if (!chartGrid || !chartLine || !chartPoints) return;
  const { width, height, padding } = chartGeometry();
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const gridHtml = [0, 1, 2, 3].map((i) => {
    const y = padding + (plotHeight / 3) * i;
    return '<line class="chart-grid-line" x1="' + padding + '" y1="' + y + '" x2="' + (width - padding) + '" y2="' + y + '" />';
  }).join("");
  chartGrid.innerHTML = gridHtml;

  if (history.length < 2) {
    chartLine.innerHTML = "";
    chartPoints.innerHTML = "";
    return;
  }

  const max = Math.max(...history) * 1.15;
  const stepX = plotWidth / (history.length - 1);
  const points = history.map((value, index) => ({
    x: padding + stepX * index,
    y: padding + plotHeight - (Math.min(value, max) / max) * plotHeight,
  }));

  const linePath = points.map((p, i) => (i === 0 ? "M" : "L") + " " + p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" ");
  chartLine.innerHTML = '<path class="chart-line" d="' + linePath + '" />';
  chartPoints.innerHTML = points
    .map((p, i) => '<circle class="chart-point" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (i === points.length - 1 ? 4.5 : 3) + '"><title>' + history[i] + ' ms</title></circle>')
    .join("");
}

async function probeEndpoint(endpoint: string): Promise<ProbeResult> {
  const started = performance.now();
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10000);
    await fetch(endpoint, { signal: controller.signal, mode: "cors" });
    window.clearTimeout(timer);
    return { endpoint, label: endpointLabel(endpoint), latencyMs: performance.now() - started, ok: true };
  } catch {
    return { endpoint, label: endpointLabel(endpoint), latencyMs: performance.now() - started, ok: false };
  }
}

function endpointLabel(endpoint: string): string {
  return ENDPOINTS.find((item) => item.endpoint === endpoint)?.label ?? "Endpoint";
}

async function runProbe(): Promise<void> {
  if (!probeButton) return;
  probeButton.disabled = true;
  if (probeStatus) probeStatus.textContent = "正在探测 3 个端点…";
  const results: ProbeResult[] = [];
  const timestamp = new Date().toISOString();
  const persistentSamples: LatencySample[] = [];

  for (const endpoint of ENDPOINTS) {
    const result = await probeEndpoint(endpoint.endpoint);
    results.push(result);
    renderResults(results);
    if (result.ok) {
      history.push(Math.round(result.latencyMs));
      persistentSamples.push({
        endpoint: result.endpoint,
        label: result.label,
        latencyMs: Math.round(result.latencyMs),
        ok: true,
        timestamp,
      });
    }
  }

  if (persistentSamples.length > 0) {
    addLatencySamples(persistentSamples);
  }

  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  drawChart();
  if (latestTime) {
    const time = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date());
    latestTime.textContent = "SESSION / " + time;
  }
  if (probeStatus) {
    const okCount = results.filter((result) => result.ok).length;
    probeStatus.textContent = "探测完成，" + okCount + "/" + results.length + " 个端点成功，已记录 " + history.length + " 个延迟样本。";
  }
  probeButton.disabled = false;
}

probeButton?.addEventListener("click", () => void runProbe());
renderConnection();
drawChart();
