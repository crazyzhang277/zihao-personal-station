import { spawn } from "node:child_process";
import { mkdir, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tmpDir = resolve(root, ".tmp-test");

await mkdir(tmpDir, { recursive: true });

const bundles = [
  { entry: resolve(root, "src/lib/typhoon-api.ts"), out: resolve(tmpDir, "typhoon-api.mjs") },
  { entry: resolve(root, "src/lib/historical-typhoons.ts"), out: resolve(tmpDir, "historical-query.mjs") },
];

for (const { entry, out } of bundles) {
  await build({
    entryPoints: [entry],
    bundle: true,
    format: "esm",
    outfile: out,
    logLevel: "warning",
  });
}

const env = {
  ...process.env,
  TYPHOON_API_BUNDLE: pathToFileURL(bundles[0].out).href,
  HISTORICAL_QUERY_BUNDLE: pathToFileURL(bundles[1].out).href,
};

const testArgs = ["--test", ...process.argv.slice(2)];
if (process.argv.length === 2) {
  const testFiles = (await readdir(resolve(root, "tests")))
    .filter((file) => file.endsWith(".test.mjs"))
    .sort()
    .map((file) => resolve(root, "tests", file));
  testArgs.push(...testFiles);
}

const child = spawn(process.execPath, testArgs, { cwd: root, env, stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
