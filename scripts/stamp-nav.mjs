import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderMasthead, renderNav } from "../src/lib/navigation.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const PAGES = [
  "index.html", "typhoon.html", "weather.html", "network.html",
  "lab.html", "about.html", "weather-log.html", "latency-viz.html",
];

const OPEN = '<div id="site-header">';
const START = "<!-- site-header:start -->";
const END = "<!-- site-header:end -->";

function stamp(html, pageId) {
  const content = renderMasthead() + renderNav(pageId);
  const regionStart = html.indexOf(START);
  if (regionStart !== -1) {
    const regionEnd = html.indexOf(END, regionStart);
    if (regionEnd === -1) throw new Error("marker start found but no end");
    return html.slice(0, regionStart) + START + content + END + html.slice(regionEnd + END.length);
  }
  const empty = '<div id="site-header"></div>';
  if (!html.includes(empty)) throw new Error('no empty header div found: ' + empty);
  return html.replace(empty, OPEN + "\n      " + START + content + END + "\n    " + "</div>");
}

let changed = 0;
for (const file of PAGES) {
  const path = resolve(root, file);
  const html = readFileSync(path, "utf8");
  const pageId = html.match(/data-page="([^"]+)"/)?.[1];
  if (!pageId) { console.error("skip " + file + ": no data-page"); continue; }
  const next = stamp(html, pageId);
  writeFileSync(path, next, "utf8");
  const isFresh = next !== html;
  if (isFresh) { changed++; console.log("stamped " + file + " (page=" + pageId + ")"); }
  else { console.log("unchanged " + file); }
}
console.log("done, " + changed + " file(s) updated");
