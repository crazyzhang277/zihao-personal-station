import "../main";
import { getLatencyHistory, type LatencySample } from "./network";

const chartCanvas = document.getElementById("latency-chart") as SVGSVGElement | null;
const chartGridEl = document.getElementById("chart-grid");
const chartLinesEl = document.getElementById("chart-lines");
const chartPointsEl = document.getElementById("chart-points");
const chartLegend = document.getElementById("chart-legend");
const statsGrid = document.getElementById("stats-grid");
const sampleTable = document.getElementById("sample-table");
const sampleTbody = document.getElementById("sample-tbody");
const clearBtn = document.getElementById("clear-history-btn");
const emptyState = document.getElementById("empty-state");

const ENDPOINT_COLORS: Record<string, string> = {
  "https://api.github.com/zen": "#a63c2b",
  "https://www.cloudflare.com/cdn-cgi/trace": "#2b6ca3",
  "https://api.open-meteo.com/v1/forecast?latitude=31.23&longitude=121.47&current_weather=true": "#3f7c65",
};

const ENDPOINT_LABELS: Record<string, string> = {
  "https://api.github.com/zen": "GitHub",
  "https://www.cloudflare.com/cdn-cgi/trace": "Cloudflare",
  "https://api.open-meteo.com/v1/forecast?latitude=31.23&longitude=121.47&current_weather=true": "Open-Meteo",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return month + "-" + day + " " + hour + ":" + min;
}

function groupByDate(samples: LatencySample[]): Map<string, LatencySample[]> {
  const map = new Map<string, LatencySample[]>();
  for (const s of samples) {
    const dateKey = s.timestamp.slice(0, 10);
    const arr = map.get(dateKey) || [];
    arr.push(s);
    map.set(dateKey, arr);
  }
  return map;
}

function renderStats(samples: LatencySample[]): void {
  if (!statsGrid) return;
  if (samples.length === 0) {
    statsGrid.innerHTML = "";
    return;
  }

  const okSamples = samples.filter((s) => s.ok);
  const avgLatency = okSamples.length > 0 ? okSamples.reduce((sum, s) => sum + s.latencyMs, 0) / okSamples.length : 0;
  const minSample = okSamples.length > 0 ? okSamples.reduce((min, s) => (s.latencyMs < min.latencyMs ? s : min), okSamples[0]) : null;
  const maxSample = okSamples.length > 0 ? okSamples.reduce((max, s) => (s.latencyMs > max.latencyMs ? s : max), okSamples[0]) : null;

  const byDate = groupByDate(samples);
  const dateCount = byDate.size;

  statsGrid.innerHTML =
    '<div class="stat-item"><dt class="stat-item__label">样本总数</dt><dd class="stat-item__value">' +
    samples.length +
    '</dd></div>' +
    '<div class="stat-item"><dt class="stat-item__label">记录天数</dt><dd class="stat-item__value">' +
    dateCount +
    '</dd></div>' +
    '<div class="stat-item"><dt class="stat-item__label">平均延迟</dt><dd class="stat-item__value">' +
    avgLatency.toFixed(0) +
    ' ms</dd></div>' +
    '<div class="stat-item"><dt class="stat-item__label">最快端点</dt><dd class="stat-item__value">' +
    (minSample ? ENDPOINT_LABELS[minSample.endpoint] + " (" + minSample.latencyMs + " ms)" : "—") +
    '</dd></div>' +
    '<div class="stat-item"><dt class="stat-item__label">最慢端点</dt><dd class="stat-item__value">' +
    (maxSample ? ENDPOINT_LABELS[maxSample.endpoint] + " (" + maxSample.latencyMs + " ms)" : "—") +
    '</dd></div>';
}

function renderChart(samples: LatencySample[]): void {
  if (!chartCanvas || !chartGridEl || !chartLinesEl || !chartPointsEl || !chartLegend) return;

  if (samples.length === 0) {
    chartGridEl.innerHTML = "";
    chartLinesEl.innerHTML = "";
    chartPointsEl.innerHTML = "";
    chartLegend.innerHTML = "";
    return;
  }

  const width = 800;
  const height = 280;
  const padding = 40;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const okSamples = samples.filter((s) => s.ok);
  const maxLatency = Math.max(...okSamples.map((s) => s.latencyMs), 1) * 1.15;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = padding + plotHeight * (1 - ratio);
    return '<line class="chart-grid-line" x1="' + padding + '" y1="' + y.toFixed(1) + '" x2="' + (width - padding) + '" y2="' + y.toFixed(1) + '" />';
  });
  chartGridEl.innerHTML = gridLines.join("");

  const endpoints = Object.keys(ENDPOINT_COLORS);
  const byEndpoint = new Map<string, LatencySample[]>();
  for (const s of okSamples) {
    const arr = byEndpoint.get(s.endpoint) || [];
    arr.push(s);
    byEndpoint.set(s.endpoint, arr);
  }

  let linesHtml = "";
  let pointsHtml = "";
  const labels: string[] = [];

  const sortedSamples = [...okSamples].reverse();
  const stepX = sortedSamples.length > 1 ? plotWidth / (sortedSamples.length - 1) : plotWidth;

  for (const ep of endpoints) {
    const epSamples = byEndpoint.get(ep) || [];
    if (epSamples.length === 0) continue;

    const points: Array<{ x: number; y: number; ms: number }> = [];
    sortedSamples.forEach((s, idx) => {
      if (s.endpoint === ep) {
        points.push({
          x: padding + stepX * idx,
          y: padding + plotHeight - (s.latencyMs / maxLatency) * plotHeight,
          ms: s.latencyMs,
        });
      }
    });

    if (points.length > 1) {
      const d = points.map((p, i) => (i === 0 ? "M" : "L") + " " + p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" ");
      linesHtml += '<path class="chart-line" d="' + d + '" stroke="' + ENDPOINT_COLORS[ep] + '" stroke-width="2" fill="none" />';
    }

    pointsHtml += points
      .map((p) => '<circle class="chart-point" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="3" fill="' + ENDPOINT_COLORS[ep] + '"><title>' + p.ms + ' ms</title></circle>')
      .join("");

    labels.push('<span class="legend-item" style="color:' + ENDPOINT_COLORS[ep] + '">● ' + ENDPOINT_LABELS[ep] + '</span>');
  }

  chartLinesEl.innerHTML = linesHtml;
  chartPointsEl.innerHTML = pointsHtml;
  chartLegend.innerHTML = labels.join(" ");
}

function renderTable(samples: LatencySample[]): void {
  if (!sampleTable || !sampleTbody || !emptyState) return;

  if (samples.length === 0) {
    sampleTable.hidden = true;
    emptyState.hidden = false;
    return;
  }

  sampleTable.hidden = false;
  emptyState.hidden = true;

  sampleTbody.innerHTML = samples
    .slice(0, 100)
    .map(
      (s) =>
        '<tr>' +
        '<td class="sample-table__time">' +
        formatDate(s.timestamp) +
        '</td>' +
        '<td class="sample-table__endpoint" style="color:' +
        (ENDPOINT_COLORS[s.endpoint] || "inherit") +
        '">' +
        s.label +
        '</td>' +
        '<td class="sample-table__latency">' +
        (s.ok ? s.latencyMs + " ms" : "失败") +
        '</td>' +
        '</tr>'
    )
    .join("");
}

function init(): void {
  const samples = getLatencyHistory();
  renderStats(samples);
  renderChart(samples);
  renderTable(samples);

  clearBtn?.addEventListener("click", () => {
    if (confirm("确定清空所有延迟记录？此操作不可撤销。")) {
      localStorage.removeItem("latency-history");
      renderStats([]);
      renderChart([]);
      renderTable([]);
    }
  });
}

init();
