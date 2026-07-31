# ZHANG ZIHAO - Personal Station

喜欢把天气、网络与真实世界的信号整理成可读的界面。

> Live: https://crazyzhang277.github.io/zihao-personal-station/

![Preview](docs/preview.png)

## Features

- **实时台风对比**: 同时接入 JMA 日本气象厅、CMA 中央气象台、CWA 台湾中央气象署与 JTWC 美国联合台风警报中心，对比真实路径、风圈与预报，每 5 分钟自动刷新。
- **风圈 / 影响范围**: 实线为观测路径，虚线为预报外推；半透明圆圈为各机构发布的 7 级/强风圈、10 级/暴风圈与 JTWC 风圈影响范围。数据源不可用时会自动回退到本地演示路径。
- **天气观测站**: 使用 Open-Meteo 获取实时天气，失败时自动切换到演示数据。
- **网络观测站**: 读取浏览器连接信息，并用 fetch 测量真实端点延迟。
- **实验舱**: 工具会慢慢生长：这里收录可用的换算器与规划中的实验。
- Responsive layout for desktop and mobile.
- Auto refresh every 5 minutes with manual refresh support.

## Tech Stack

| Tech | Purpose |
| --- | --- |
| [Vite](https://vitejs.dev/) | Build tool and dev server |
| [TypeScript](https://www.typescriptlang.org/) | Typed data parsing and page logic |
| [Leaflet](https://leafletjs.com/) | Typhoon track and wind radius map |
| CSS | Paper-console visual system and responsive layout |

## Data Sources

| Agency | Coverage |
| --- | --- |
| JMA | Track, forecast, gale radius, storm radius |
| CMA | Track, forecast, 7/10/12-level wind radii |
| CWA | KML/Markdown track and wind polygon |
| JTWC | WTPN31 bulletin, 34/50/64KT wind radii |

> Public data from official agencies. Differences in position, pressure and intensity between agencies are expected and are exactly what this multi-source comparison makes visible.

## Local Development

```bash
npm install
npm run dev
```

Build production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```text
.
|-- src/
|   |-- pages/          # Page entry points
|   |-- lib/            # Typhoon and weather data parsing
|   |-- data/           # Static demo data
|   `-- styles/         # Visual system and page styles
|-- docs/               # Docs and screenshots
|-- .github/workflows/  # GitHub Pages deployment
|-- *.html              # Vite multi-page entries
`-- package.json
```

## Deployment

Pushing to `main` triggers GitHub Actions:

```text
npm ci -> npm run build -> deploy-pages
```

See [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

## License

[MIT](LICENSE) © 2026 张梓皓 (ZHANG ZIHAO)
