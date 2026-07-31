import "../main";

interface BeaufortRange {
  min: number;
  max: number;
  level: string;
  description: string;
}

const BEAUFORT_RANGES: BeaufortRange[] = [
  { min: 0, max: 1, level: "无风", description: "平静无感" },
  { min: 2, max: 17, level: "软风", description: "轻拂脸面" },
  { min: 18, max: 24, level: "轻风", description: "树叶微响" },
  { min: 25, max: 31, level: "微风", description: "旗帜轻展" },
  { min: 32, max: 41, level: "和风", description: "尘土扬起" },
  { min: 42, max: 51, level: "清风", description: "小树摇摆" },
  { min: 52, max: 61, level: "强风", description: "大枝摇动" },
  { min: 62, max: 71, level: "疾风", description: "整树摇动" },
  { min: 72, max: 999, level: "烈风及以上", description: "行走困难" },
];

const windInput = document.getElementById("wind-speed") as HTMLInputElement | null;
const beaufortInput = document.getElementById("beaufort") as HTMLInputElement | null;
const levelEl = document.getElementById("result-level");
const descEl = document.getElementById("result-desc");
const windEl = document.getElementById("result-wind");

function windKmhFromBeaufort(beaufort: number): number {
  const beaufortWindKmh = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117, 133, 149, 166, 184, 201, 220];
  const index = Math.max(0, Math.min(17, Math.round(beaufort)));
  return beaufortWindKmh[index];
}

function beaufortFromWindKmh(windKmh: number): number {
  const thresholds = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118, 134, 150, 167, 185, 202, 220];
  let result = 0;
  for (let i = 0; i < thresholds.length; i += 1) {
    if (windKmh >= thresholds[i]) result = i + 1;
  }
  return Math.min(17, result);
}

function classify(windKmh: number): BeaufortRange {
  return BEAUFORT_RANGES.find((range) => windKmh >= range.min && windKmh <= range.max) ?? BEAUFORT_RANGES[BEAUFORT_RANGES.length - 1];
}

function render(): void {
  if (!windInput || !beaufortInput || !levelEl || !descEl || !windEl) return;
  const wind = Math.max(0, Number(windInput.value) || 0);
  const beaufort = beaufortFromWindKmh(wind);
  beaufortInput.value = String(beaufort);
  const classification = classify(wind);
  levelEl.textContent = classification.level;
  descEl.textContent = classification.description;
  windEl.textContent = `${Math.round(wind)} km/h`;
}

windInput?.addEventListener("input", render);
beaufortInput?.addEventListener("input", () => {
  if (!windInput || !beaufortInput || !levelEl || !descEl || !windEl) return;
  const beaufort = Math.max(0, Math.min(17, Number(beaufortInput.value) || 0));
  const wind = windKmhFromBeaufort(beaufort);
  windInput.value = String(wind);
  const classification = classify(wind);
  levelEl.textContent = classification.level;
  descEl.textContent = classification.description;
  windEl.textContent = `${Math.round(wind)} km/h`;
});

render();