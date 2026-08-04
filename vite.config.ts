import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
import { defineConfig } from "vite";

const root = resolve(__dirname);
const page = (name: string) => resolve(root, name + ".html");

const cwaProxy = {
  "/cwa-proxy": {
    target: "https://app.cwa.gov.tw",
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/cwa-proxy/, ""),
  },
  "/noaa-proxy": {
    target: "https://tgftp.nws.noaa.gov",
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/noaa-proxy/, ""),
  },
};

export default defineConfig({
  base: "./",
  server: { proxy: cwaProxy },
  preview: { proxy: cwaProxy },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        index: page("index"),
        typhoon: page("typhoon"),
        weather: page("weather"),
        network: page("network"),
        lab: page("lab"),
        about: page("about"),
        "weather-log": page("weather-log"),
        "latency-viz": page("latency-viz"),
      },
    },
  },
});
