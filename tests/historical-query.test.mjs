import assert from "node:assert/strict";
import test from "node:test";

const bundle = process.env.HISTORICAL_QUERY_BUNDLE;
if (!bundle) throw new Error("HISTORICAL_QUERY_BUNDLE is required");
const { filterHistoricalStorms, historicalIntensity } = await import(bundle);

const storms = [
  { sid: "201822W13115", season: 2018, number: "22", nameEn: "MANGKHUT", nameZh: "山竹", startTime: "2018-09-07T00:00:00Z" },
  { sid: "202305W13000", season: 2023, number: "05", nameEn: "DOKSURI", nameZh: "杜苏芮", startTime: "2023-07-20T00:00:00Z" },
  { sid: "200001W10000", season: 2000, number: "01", nameEn: "DAMREY", nameZh: "达维", startTime: "2000-05-01T00:00:00Z" },
];

test("filterHistoricalStorms searches Chinese, English, SID, and year", () => {
  assert.deepEqual(filterHistoricalStorms(storms, { query: "山竹", year: null }).map((storm) => storm.sid), ["201822W13115"]);
  assert.deepEqual(filterHistoricalStorms(storms, { query: "doks", year: 2023 }).map((storm) => storm.sid), ["202305W13000"]);
  assert.deepEqual(filterHistoricalStorms(storms, { query: "200001", year: null }).map((storm) => storm.sid), ["200001W10000"]);
  assert.deepEqual(filterHistoricalStorms(storms, { query: "", year: null }).map((storm) => storm.season), [2023, 2018, 2000]);
});

test("historicalIntensity uses knot thresholds", () => {
  assert.equal(historicalIntensity(null).label, "未知");
  assert.equal(historicalIntensity(33).code, "TD");
  assert.equal(historicalIntensity(64).code, "TY");
  assert.equal(historicalIntensity(130).code, "SuperTY");
});
