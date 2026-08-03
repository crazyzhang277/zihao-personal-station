import assert from "node:assert/strict";
import test from "node:test";

const apiModulePath = process.env.TYPHOON_API_BUNDLE;

if (!apiModulePath) {
  throw new Error("TYPHOON_API_BUNDLE is required");
}

globalThis.DOMParser = class DOMParser {};

function response(body, contentType = "text/plain") {
  return {
    ok: true,
    status: 200,
    json: async () => JSON.parse(body),
    text: async () => body,
    headers: new Headers({ "content-type": contentType }),
  };
}

test("CWA fallback ignores the path-potential-area coordinates", async () => {
  const markdown = `Markdown Content
2026-08-03T08:00
过去路径
148.40,24.30
147.90,24.40
#pta
147.90,24.40
120.00,20.00
120.00,30.00
147.90,24.40
#fcst
147.90,24.40
147.00,24.70`;

  globalThis.fetch = async (url) => {
    const value = String(url);
    if (value.startsWith("https://r.jina.ai/") && value.includes("app.cwa.gov.tw")) {
      return response(markdown);
    }
    throw new Error(`Offline test fixture has no response for ${value}`);
  };

  const { fetchTyphoonSnapshots } = await import(apiModulePath);
  const snapshots = await fetchTyphoonSnapshots();
  const cwa = snapshots.find((snapshot) => snapshot.track.sourceId === "cwa");

  assert.ok(cwa, "expected the CWA fixture to produce a snapshot");
  const observed = cwa.track.points.filter((point) => !point.isForecast);
  assert.equal(observed.length, 2, "path-potential-area coordinates must not become observed markers");
});
