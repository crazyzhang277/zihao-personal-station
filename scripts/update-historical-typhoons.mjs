import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { convertIbtracs, validateArchive } from "./historical-typhoons.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "public/data/typhoons");
const staging = resolve(root, "public/data/typhoons.next");
const sourceUrl = "https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/ibtracs.WP.list.v04r01.csv";

async function downloadText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(5 * 60 * 1000) });
  if (!response.ok) throw new Error(`IBTrACS download failed: HTTP ${response.status}`);
  const text = await response.text();
  if (!text.endsWith("\n") || text.length < 50_000_000) {
    throw new Error(`IBTrACS download appears incomplete (${text.length} bytes)`);
  }
  return text;
}

async function main() {
  const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));
  const source = sourceArg ? await readFile(resolve(root, sourceArg.slice(9)), "utf8") : await downloadText(sourceUrl);
  const names = JSON.parse(await readFile(resolve(root, "scripts/typhoon-name-zh.json"), "utf8"));
  const archive = validateArchive(convertIbtracs(source, names));

  await rm(staging, { recursive: true, force: true });
  await mkdir(resolve(staging, "years"), { recursive: true });
  await writeFile(resolve(staging, "index.json"), JSON.stringify(archive.index));
  for (const [year, storms] of Object.entries(archive.years)) {
    await writeFile(resolve(staging, `years/${year}.json`), JSON.stringify({ year: Number(year), storms }));
  }
  await rm(output, { recursive: true, force: true });
  await rename(staging, output);
  console.log(`Generated ${archive.index.storms.length} storms across ${archive.index.years.length} years in ${output}`);
}

await main();
