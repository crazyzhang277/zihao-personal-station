<p align="center">
  <img src="docs/preview.png" alt="台风多源雷达预览" width="720" />
</p>

<h1 align="center">WEST PACIFIC OBSERVATION · Typhoon Radar</h1>

<p align="center">
  <b>西太平洋台风雷达</b> · 一个只做台风观测的个人数据界面
</p>

<p align="center">
  <a href="https://crazyzhang277.github.io/zihao-personal-station/typhoon.html"><img src="https://img.shields.io/badge/Live-GitHub%20Pages-1f6feb?style=flat-square&logo=github" alt="Live" /></a>
  <img src="https://img.shields.io/badge/Sources-JMA%20%7C%20CMA%20%7C%20CWA%20%7C%20JTWC-2ea44f?style=flat-square" alt="Sources" />
  <img src="https://img.shields.io/badge/Archive-1980--2024-8f1d14?style=flat-square" alt="Archive" />
  <img src="https://img.shields.io/badge/Tests-8%20passing-3f7c65?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/License-MIT-f5a623?style=flat-square" alt="License" />
</p>

---

## 特点

| | |
| --- | --- |
| **实时多源观测** | 同时接入 JMA、CMA、CWA 与 JTWC，比较当前中心位置、强度、路径和预报。 |
| **按台风分别聚合** | 不管同时有多少个台风，每个独立台风都单独计算中心和影响范围，不会互相平均。 |
| **综合平均风圈** | 对同一台风可用数据源的当前位置和风圈半径取平均，分别绘制强风圈、暴风圈与台风圈。 |
| **连续预报路径** | 预报线从该台风最后一个实测点连接，避免路径断开。 |
| **历史台风档案** | 浏览 1980 年以来的西北太平洋历史路径，支持年份、中文名、英文名与编号检索。 |
| **离线可用** | 实时源不可用时自动切换到本地演示路径，页面仍可打开和检查。 |

## 技术栈

| Tech | Purpose |
| --- | --- |
| [Vite](https://vitejs.dev/) | 开发服务器与生产构建 |
| [TypeScript](https://www.typescriptlang.org/) | 数据解析、聚合逻辑与页面交互 |
| [Leaflet](https://leafletjs.com/) | 台风路径、预报线与风圈地图 |
| CSS | Paper-console 视觉系统与响应式布局 |

## 数据源

| Agency | Coverage |
| --- | --- |
| JMA 日本气象厅 | 实测路径、预报、强风圈与暴风圈 |
| CMA 中央气象台 | 实测路径、预报、7/10/12 级风圈 |
| CWA 台湾气象署 | KML/Markdown 路径与风圈多边形 |
| JTWC 联合台风警报中心 | WTPN31 通报、34/50/64KT 风圈 |
| NOAA/NCEI IBTrACS v04r01 | 1980 年以来西北太平洋历史最佳路径 |

> 所有实时数据来自机构公开渠道。不同机构对同一时刻的中心位置、气压和强度可能存在差异；页面用来源对比和综合平均把这种差异明确展示出来。

## 历史档案

`scripts/update-historical-typhoons.mjs` 从 NOAA IBTrACS 下载并生成归档：

```text
public/data/typhoons/
├── index.json              # 全部台风摘要与年份索引
└── years/<year>.json       # 按年份存储的完整路径点
```

更新数据：

```bash
npm run update:typhoons
npm run update:typhoons -- --source=/path/to/ibtracs.WP.list.v04r01.csv
```

## 快速开始

```bash
npm install
npm run dev       # http://127.0.0.1:5173/typhoon.html
npm test
npm run build
npm run preview
```

根地址 `/` 保留为兼容入口，会直接跳转到 `typhoon.html`。项目只构建台风雷达页面，其他观测、实验和个人介绍页面已移除。

## 项目结构

```text
.
├── src/pages/typhoon.ts       # 台风页面与地图交互
├── src/lib/typhoon-api.ts     # 多源抓取、解析、聚合与回退
├── src/lib/historical-typhoons.ts
├── src/styles/typhoon.css
├── scripts/                   # 历史档案生成与导航构建工具
├── tests/                     # API 解析、历史查询与台风显示测试
├── public/data/typhoons/      # 历史台风归档
├── docs/preview.png
├── typhoon.html
└── package.json
```

## 部署

推送 `main` 后，GitHub Actions 会执行：

```text
npm ci → npm test → npm run build → deploy-pages
```

详见 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)。

---

<p align="center"><sub>Paper-console 视觉系统 · 多源台风数据 · 只保留有用的观测</sub></p>

## License

[MIT](LICENSE) · 2026 西太平洋观测站
