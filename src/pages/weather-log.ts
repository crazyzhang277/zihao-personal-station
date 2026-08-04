import "../main";
import { fetchWeather, getCity, weatherText, windDirectionText } from "../lib/weather-api";
import type { WeatherBundle } from "../data/weather";

const STORAGE_KEY = "weather-log-entries";

interface WeatherLogEntry {
  date: string;
  weatherCode: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeedKmh: number;
  windDirection: number;
  note: string;
  recordedAt: string;
}

function loadEntries(): WeatherLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: WeatherLogEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  return month + "-" + day + " 周" + weekday;
}

function renderStats(entries: WeatherLogEntry[]): void {
  const section = document.getElementById("stats-section");
  const grid = document.getElementById("stats-grid");
  if (!section || !grid) return;

  if (entries.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  const temps = entries.map((e) => e.temperature);
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);
  const maxTempEntry = entries.find((e) => e.temperature === maxTemp);
  const minTempEntry = entries.find((e) => e.temperature === minTemp);

  grid.innerHTML = [
    ["已记录", entries.length + " 天"],
    ["最高温", maxTemp.toFixed(1) + "°C" + (maxTempEntry ? " (" + formatDateDisplay(maxTempEntry.date) + ")" : "")],
    ["最低温", minTemp.toFixed(1) + "°C" + (minTempEntry ? " (" + formatDateDisplay(minTempEntry.date) + ")" : "")],
  ]
    .map(
      ([dt, dd]) =>
        '<div class="stat-item"><dt class="stat-item__label">' + dt + '</dt><dd class="stat-item__value">' + dd + '</dd></div>'
    )
    .join("");
}

function renderTable(entries: WeatherLogEntry[]): void {
  const table = document.getElementById("log-table");
  const tbody = document.getElementById("log-tbody");
  const empty = document.getElementById("empty-state");
  const count = document.getElementById("entries-count");

  if (!table || !tbody || !empty || !count) return;

  if (entries.length === 0) {
    table.hidden = true;
    empty.hidden = false;
    count.textContent = "暂无记录";
    return;
  }

  table.hidden = false;
  empty.hidden = true;
  count.textContent = "共 " + entries.length + " 条记录";

  tbody.innerHTML = entries
    .map(
      (entry) =>
        '<tr>' +
        '<td class="log-table__date">' +
        formatDateDisplay(entry.date) +
        '</td>' +
        '<td class="log-table__weather">' +
        weatherText(entry.weatherCode) +
        '</td>' +
        '<td class="log-table__temp">' +
        entry.temperature.toFixed(1) +
        '°C' +
        (entry.apparentTemperature !== entry.temperature ? ' (体感 ' + entry.apparentTemperature.toFixed(0) + '°C)' : '') +
        '</td>' +
        '<td class="log-table__wind">' +
        windDirectionText(entry.windDirection) +
        ' ' +
        Math.round(entry.windSpeedKmh) +
        ' km/h' +
        '</td>' +
        '<td class="log-table__note">' +
        (entry.note || "—") +
        '</td>' +
        '</tr>'
    )
    .join("");
}

async function recordToday(entries: WeatherLogEntry[]): Promise<WeatherLogEntry | null> {
  const today = todayDateString();
  const existing = entries.find((e) => e.date === today);
  if (existing) return existing;

  const city = getCity("shanghai");
  let bundle: WeatherBundle;
  try {
    bundle = await fetchWeather(city);
  } catch {
    return null;
  }

  const entry: WeatherLogEntry = {
    date: today,
    weatherCode: bundle.current.weatherCode,
    temperature: bundle.current.temperature,
    apparentTemperature: bundle.current.apparentTemperature,
    humidity: bundle.current.humidity,
    windSpeedKmh: bundle.current.windSpeedKmh,
    windDirection: bundle.current.windDirection,
    note: "",
    recordedAt: new Date().toISOString(),
  };

  const updated = [entry, ...entries.filter((e) => e.date !== today)];
  saveEntries(updated);
  return entry;
}

function renderToday(entry: WeatherLogEntry | null, error: boolean): void {
  const status = document.getElementById("today-status");
  const form = document.getElementById("today-form");
  const weather = document.getElementById("today-weather");
  const noteInput = document.getElementById("today-note-input") as HTMLInputElement | null;

  if (!status || !form || !weather) return;

  if (error) {
    status.textContent = "获取天气失败，请稍后刷新重试。";
    status.hidden = false;
    form.hidden = true;
    return;
  }

  if (!entry) {
    status.textContent = "正在获取今日天气...";
    status.hidden = false;
    form.hidden = true;
    return;
  }

  status.hidden = true;
  form.hidden = false;

  weather.innerHTML =
    '<div class="today-weather__row">' +
    '<span class="today-weather__label">天气</span>' +
    '<span class="today-weather__value">' +
    weatherText(entry.weatherCode) +
    '</span>' +
    '</div>' +
    '<div class="today-weather__row">' +
    '<span class="today-weather__label">温度</span>' +
    '<span class="today-weather__value">' +
    entry.temperature.toFixed(1) +
    '°C (体感 ' +
    entry.apparentTemperature.toFixed(0) +
    '°C)' +
    '</span>' +
    '</div>' +
    '<div class="today-weather__row">' +
    '<span class="today-weather__label">湿度</span>' +
    '<span class="today-weather__value">' +
    entry.humidity.toFixed(0) +
    '%</span>' +
    '</div>' +
    '<div class="today-weather__row">' +
    '<span class="today-weather__label">风力</span>' +
    '<span class="today-weather__value">' +
    windDirectionText(entry.windDirection) +
    ' ' +
    Math.round(entry.windSpeedKmh) +
    ' km/h' +
    '</span>' +
    '</div>';

  if (noteInput) {
    noteInput.value = entry.note || "";
  }
}

function updateNote(today: string, note: string): void {
  const entries = loadEntries();
  const entry = entries.find((e) => e.date === today);
  if (entry) {
    entry.note = note;
    saveEntries(entries);
  }
}

async function init(): Promise<void> {
  let entries = loadEntries();
  let todayEntry: WeatherLogEntry | null = entries.find((e) => e.date === todayDateString()) || null;
  let todayError = false;

  if (!todayEntry) {
    try {
      const recorded = await recordToday(entries);
      if (recorded) {
        todayEntry = recorded;
        entries = [recorded, ...entries.filter((e) => e.date !== recorded.date)];
      }
    } catch {
      todayError = true;
    }
  }

  renderStats(entries);
  renderTable(entries);
  renderToday(todayEntry, todayError);

  const saveBtn = document.getElementById("save-note-btn") as HTMLButtonElement | null;
  const noteInput = document.getElementById("today-note-input") as HTMLInputElement | null;

  saveBtn?.addEventListener("click", () => {
    if (!noteInput || !todayEntry) return;
    const note = noteInput.value.trim();
    updateNote(todayDateString(), note);
    todayEntry.note = note;
    entries = loadEntries();
    renderTable(entries);
    saveBtn.textContent = "已保存";
    setTimeout(() => {
      if (saveBtn) saveBtn.textContent = "保存备注";
    }, 1500);
  });
}

init().catch(console.error);
