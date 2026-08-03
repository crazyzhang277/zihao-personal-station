import assert from "node:assert/strict";
import test from "node:test";
import { convertIbtracs, parseCsv, validateArchive } from "../scripts/historical-typhoons.mjs";

const csv = `SID,SEASON,NUMBER,BASIN,SUBBASIN,NAME,ISO_TIME,NATURE,LAT,LON,WMO_WIND,WMO_PRES,WMO_AGENCY,TRACK_TYPE,USA_WIND,USA_PRES
 ,Year, , , , , , ,degrees_north,degrees_east,kts,mb, , ,kts,mb
1979001N10000,1979,1,WP,MM,OLD,1979-01-01 00:00:00,TS,10,140,40,1000,tokyo,main,,
1980001N10000,1980,1,WP,MM,ORCHID,1980-01-01 00:00:00,TS,10,179.5,35,1002,tokyo,main,,
1980001N10000,1980,1,WP,MM,ORCHID,1980-01-01 06:00:00,TY,11,-179.8,,,tokyo,main,70,960
1980001N10000,1980,1,WP,MM,ORCHID,1980-01-01 09:00:00,TY,11.5,-179.0,75,955,tokyo,spur,75,955
1981001N10000,1981,2,EP,MM,OTHER,1981-01-01 00:00:00,TS,10,140,40,1000,usa_atcf,main,,`;

test("parseCsv handles quoted commas", () => {
  assert.deepEqual(parseCsv('A,B\n"x,y",z'), [["A", "B"], ["x,y", "z"]]);
});

test("convertIbtracs creates filtered summaries and year shards", () => {
  const archive = convertIbtracs(csv, { ORCHID: "兰花" }, "2026-08-03T00:00:00.000Z");
  assert.equal(archive.index.storms.length, 1);
  assert.equal(archive.index.storms[0].nameZh, "兰花");
  assert.equal(archive.index.storms[0].maxWindKts, 70);
  assert.equal(archive.index.storms[0].minPressureHpa, 960);
  assert.deepEqual(archive.years[1980][0].points[1], {
    time: "1980-01-01T06:00:00.000Z",
    lat: 11,
    lng: -179.8,
    windKts: 70,
    pressureHpa: 960,
    nature: "TY",
  });
  assert.equal(archive.years[1980][0].points.length, 2, "spur tracks must be excluded");
});

test("validateArchive rejects unexpectedly small archives in production mode", () => {
  const archive = convertIbtracs(csv, {}, "2026-08-03T00:00:00.000Z");
  assert.throws(() => validateArchive(archive, { minStorms: 100, minYears: 20 }), /too few storms/i);
  assert.doesNotThrow(() => validateArchive(archive, { minStorms: 1, minYears: 1 }));
});
