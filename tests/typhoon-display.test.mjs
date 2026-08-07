import assert from "node:assert/strict";
import test from "node:test";

const apiModulePath = process.env.TYPHOON_API_BUNDLE;

if (!apiModulePath) {
  throw new Error("TYPHOON_API_BUNDLE is required");
}

const { averageWindCircles, trackLinePoints } = await import(apiModulePath);

test("forecast line starts at the latest observed point", () => {
  const lines = trackLinePoints({
    points: [
      { lat: 10, lng: 120, isForecast: false },
      { lat: 11, lng: 121, isForecast: false },
      { lat: 12, lng: 122, isForecast: true },
    ],
  });

  assert.deepEqual(lines.observed, [[10, 120], [11, 121]]);
  assert.deepEqual(lines.forecast, [[11, 121], [12, 122]]);
});

test("averages each storm separately and preserves wind impact bands", () => {
  const circles = averageWindCircles([
    {
      track: {
        sourceId: "jma",
        nameEn: "MANGKHUT",
        number: "13",
        points: [{ lat: 20, lng: 130, isForecast: false, windRadii: [
          { label: "gale", thresholdMps: 17, radiusKm: 300 },
          { label: "storm", thresholdMps: 25, radiusKm: 180 },
          { label: "typhoon", thresholdMps: 33, radiusKm: 80 },
        ] }],
      },
    },
    {
      track: {
        sourceId: "cma",
        nameEn: "MANGKHUT",
        number: "13",
        points: [{ lat: 22, lng: 132, isForecast: false, windRadii: [
          { label: "gale", thresholdMps: 15, radiusKm: 500 },
          { label: "storm", thresholdMps: 26, radiusKm: 300 },
          { label: "typhoon", thresholdMps: 33, radiusKm: 120 },
        ] }],
      },
    },
    {
      track: {
        sourceId: "jtwc",
        nameEn: "TRAMI",
        number: "12",
        points: [{ lat: 10, lng: 150, isForecast: false, windRadii: [
          { label: "gale", thresholdMps: 17, radiusKm: 250 },
        ] }],
      },
    },
  ]);

  assert.equal(circles.length, 2);
  assert.deepEqual(circles[0], {
    key: "name:MANGKHUT",
    nameEn: "MANGKHUT",
    number: "13",
    lat: 21,
    lng: 131,
    sourceCount: 2,
    radii: [
      { band: "gale", label: "强风圈", thresholdMps: 16, radiusKm: 400, sourceCount: 2 },
      { band: "storm", label: "暴风圈", thresholdMps: 26, radiusKm: 240, sourceCount: 2 },
      { band: "typhoon", label: "台风圈", thresholdMps: 33, radiusKm: 100, sourceCount: 2 },
    ],
  });
  assert.equal(circles[1].key, "name:TRAMI");
  assert.equal(circles[1].lat, 10);
});
