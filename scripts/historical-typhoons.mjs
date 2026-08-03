function nullableNumber(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function csvTime(value) {
  const normalized = String(value).trim().replace(" ", "T");
  const date = new Date(`${normalized}Z`);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function intensityFromWind(windKts) {
  if (windKts === null) return "未知";
  if (windKts >= 130) return "超强台风";
  if (windKts >= 100) return "强台风";
  if (windKts >= 64) return "台风";
  if (windKts >= 48) return "强热带风暴";
  if (windKts >= 34) return "热带风暴";
  return "热带低压";
}

function maximum(values) {
  const present = values.filter((value) => value !== null);
  return present.length > 0 ? Math.max(...present) : null;
}

function minimum(values) {
  const present = values.filter((value) => value !== null);
  return present.length > 0 ? Math.min(...present) : null;
}

export function convertIbtracs(text, chineseNames = {}, generatedAt = new Date().toISOString()) {
  const rows = parseCsv(text);
  const headers = rows[0] ?? [];
  const column = Object.fromEntries(headers.map((name, index) => [name.trim(), index]));
  const required = ["SID", "SEASON", "NUMBER", "BASIN", "NAME", "ISO_TIME", "NATURE", "LAT", "LON", "TRACK_TYPE"];
  for (const name of required) {
    if (column[name] === undefined) throw new Error(`IBTrACS column missing: ${name}`);
  }

  const storms = new Map();
  for (const values of rows.slice(2)) {
    const season = Number(values[column.SEASON]);
    const basin = values[column.BASIN]?.trim();
    const trackType = values[column.TRACK_TYPE]?.trim().toLowerCase();
    if (season < 1980 || basin !== "WP" || trackType !== "main") continue;

    const sid = values[column.SID]?.trim();
    const time = csvTime(values[column.ISO_TIME]);
    const lat = nullableNumber(values[column.LAT]);
    const lng = nullableNumber(values[column.LON]);
    if (!sid || !time || lat === null || lng === null) continue;

    const nameEn = (values[column.NAME]?.trim() || "UNNAMED").toUpperCase();
    const windKts = nullableNumber(values[column.WMO_WIND]) ?? nullableNumber(values[column.USA_WIND]);
    const pressureHpa = nullableNumber(values[column.WMO_PRES]) ?? nullableNumber(values[column.USA_PRES]);
    const storm = storms.get(sid) ?? {
      sid,
      season,
      number: values[column.NUMBER]?.trim() || sid,
      nameEn,
      nameZh: chineseNames[nameEn] ?? null,
      points: [],
    };
    storm.points.push({
      time,
      lat,
      lng,
      windKts,
      pressureHpa,
      nature: values[column.NATURE]?.trim() || "NR",
    });
    storms.set(sid, storm);
  }

  const years = {};
  const summaries = [];
  for (const storm of storms.values()) {
    storm.points.sort((a, b) => a.time.localeCompare(b.time));
    const maxWindKts = maximum(storm.points.map((point) => point.windKts));
    const minPressureHpa = minimum(storm.points.map((point) => point.pressureHpa));
    const summary = {
      sid: storm.sid,
      season: storm.season,
      number: storm.number,
      nameEn: storm.nameEn,
      nameZh: storm.nameZh,
      startTime: storm.points[0].time,
      endTime: storm.points.at(-1).time,
      maxWindKts,
      minPressureHpa,
      strongestIntensity: intensityFromWind(maxWindKts),
      pointCount: storm.points.length,
    };
    summaries.push(summary);
    (years[storm.season] ??= []).push(storm);
  }

  summaries.sort((a, b) => b.startTime.localeCompare(a.startTime));
  for (const yearStorms of Object.values(years)) {
    yearStorms.sort((a, b) => a.points[0].time.localeCompare(b.points[0].time));
  }

  return {
    index: {
      version: "IBTrACS v04r01",
      basin: "WP",
      generatedAt,
      sourceUrl: "https://www.ncei.noaa.gov/products/international-best-track-archive",
      years: Object.keys(years).map(Number).sort((a, b) => b - a),
      storms: summaries,
    },
    years,
  };
}

export function validateArchive(archive, limits = {}) {
  const minStorms = limits.minStorms ?? 900;
  const minYears = limits.minYears ?? 40;
  if (archive.index.storms.length < minStorms) {
    throw new Error(`Archive has too few storms: ${archive.index.storms.length} < ${minStorms}`);
  }
  if (archive.index.years.length < minYears) {
    throw new Error(`Archive has too few years: ${archive.index.years.length} < ${minYears}`);
  }
  for (const summary of archive.index.storms) {
    if (!archive.years[summary.season]?.some((storm) => storm.sid === summary.sid)) {
      throw new Error(`Archive shard missing storm: ${summary.sid}`);
    }
  }
  return archive;
}

