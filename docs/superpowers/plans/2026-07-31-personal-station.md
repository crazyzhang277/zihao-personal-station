# 张梓皓个人观测站 Implementation Plan

> **For agentic workers:** 本计划面向执行者；步骤使用 `- [ ]` 跟踪。当前用户未要求 git commit，执行时不要提交。

**Goal:** 用 Vite + TypeScript 搭建一个纸感编辑风格的多页个人观测站，包含总览、台风雷达、天气站、网络探针、实验舱、关于六个页面与二级导航。

**Architecture:** 纯静态多页应用：六个 HTML 入口共享同一套纸感设计系统，导航由 TS 注入；台风与站点文案使用类型化本地数据模块，天气与网络延迟通过浏览器可用的公开接口获取并优雅降级。

**Tech Stack:** Vite 7+、TypeScript、原生 DOM TS、CSS 自定义属性；无 React/Tailwind。

## Global Constraints

- 用户姓名：张梓皓；站点定位：个人观测站。
- 调色板：纸面 `#F4F0E8`、墨色 `#17140F`、次级灰 `#6D675B`、朱红 `#A63C2B`。
- 展示字体：`Georgia / Times New Roman / Songti SC`；正文：`Avenir Next / Segoe UI / PingFang SC / Microsoft YaHei`；数据：等宽字体。
- 每个页面必须有期刊式报头与「梓」印章；二级菜单桌面下拉、移动可折叠，支持键盘。
- 文案为真实中文，不使用 Lorem ipsum；外部请求失败时显示降级数据，不允许白屏。
- Windows 下 npm 使用 `npm.cmd`。
- 不提交 git、不创建分支、不修改 `.superpowers/` 或 `docs/superpowers/specs/`。

---
### Task 1: 项目脚手架与设计令牌

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `.gitignore`
- Create: `src/styles/tokens.css`

**Interfaces:**
- Consumes: 无
- Produces: `npm run dev` / `npm run build` / `npm run preview`；CSS 变量 `--paper`、`--ink`、`--muted`、`--accent`、`--hairline`。

- [ ] 1. 创建 `package.json`，`type: "module"`，devDependencies 含 `vite`、`typescript`，scripts 含 `dev`、`build`、`preview`。
- [ ] 2. 创建 `tsconfig.json` 启用 `strict` 与 DOM lib。
- [ ] 3. 创建 `vite.config.ts`，用 `rollupOptions.input` 注册 6 个 HTML 入口。
- [ ] 4. 创建 `.gitignore`，忽略 `node_modules/`、`dist/`、`.superpowers/`、编辑器文件。
- [ ] 5. 创建设计令牌 CSS，定义上述调色板、字体、间距、圆角、阴影与动效时长。
- [ ] 6. 运行 `npm.cmd run build`，期望构建成功。

### Task 2: 共享布局、导航与编辑器语言

**Files:**
- Create: `src/lib/nav.ts`
- Create: `src/lib/layout.ts`
- Create: `src/styles/base.css`
- Create: `src/styles/components.css`

**Interfaces:**
- Consumes: `src/styles/tokens.css`
- Produces: `renderLayout(active: string): void`，`initNavigation(): void`；导航项包含 `overview / typhoon / weather / network / lab / about`。

- [ ] 1. 实现共享页头：报头、期号、站点名、红「梓」印章、二级导航。
- [ ] 2. 实现 `initNavigation`：桌面 hover/click 下拉、移动 hamburger、`aria-expanded`、焦点可见。
- [ ] 3. 实现页脚：期刊版权行与功能索引。
- [ ] 4. 运行 `npm.cmd run build` 并确认无 TS 错误。

### Task 3: 数据模块

**Files:**
- Create: `src/data/typhoons.ts`
- Create: `src/data/weather.ts`
- Create: `src/data/content.ts`
- Create: `src/lib/weather-api.ts`

**Interfaces:**
- Consumes: 无
- Produces: `TyphoonTrack[]`、`getWeatherFor(city: CityId)`、`SITE_CONTENT`；`CityId = "shanghai" | "beijing" | "guangzhou"`。

- [ ] 1. 定义类型化台风演示路径：名称、等级、时间序列点位、气压、风速。
- [ ] 2. 定义三个城市的坐标与 Open-Meteo 请求函数，含超时与失败降级。
- [ ] 3. 定义可编辑站点文案 `SITE_CONTENT`（简介、兴趣、联系方式）。
- [ ] 4. 运行 `npm.cmd run build`。

### Task 4: 总览页

**Files:**
- Create: `index.html`
- Create: `src/pages/overview.ts`
- Create: `src/styles/pages/overview.css`

**Interfaces:**
- Consumes: `renderLayout`、`TyphoonTrack`、`getWeatherFor`、`SITE_CONTENT`
- Produces: 首页摘要卡片与模块入口。

- [ ] 1. 实现编辑风 hero：姓名、定位、观测日期。
- [ ] 2. 实现台风/天气/网络摘要卡片；天气请求失败时显示演示数据。
- [ ] 3. 实现模块网格与关于摘要。
- [ ] 4. 运行 `npm.cmd run build` 并手动检查移动端。

### Task 5: 台风雷达页

**Files:**
- Create: `typhoon.html`
- Create: `src/pages/typhoon.ts`
- Create: `src/styles/pages/typhoon.css`

**Interfaces:**
- Consumes: `TyphoonTrack`
- Produces: SVG 地图、时间步进控件、强度面板。

- [ ] 1. 实现西太平洋示意地图与多条演示路径。
- [ ] 2. 实现时间滑块/步进动画，暂停时更新状态面板。
- [ ] 3. 实现图例与数据来源说明。
- [ ] 4. 运行 `npm.cmd run build`。

### Task 6: 天气站页

**Files:**
- Create: `weather.html`
- Create: `src/pages/weather.ts`
- Create: `src/styles/pages/weather.css`

**Interfaces:**
- Consumes: `getWeatherFor`
- Produces: 当前天气、7 日预报、城市切换。

- [ ] 1. 实现城市切换与当前天气卡片。
- [ ] 2. 实现 7 日预报列表。
- [ ] 3. 请求失败时显示演示值并标注「降级数据」。
- [ ] 4. 运行 `npm.cmd run build`。

### Task 7: 网络探针页

**Files:**
- Create: `network.html`
- Create: `src/pages/network.ts`
- Create: `src/styles/pages/network.css`

**Interfaces:**
- Consumes: 无
- Produces: `startProbe(): Promise<ProbeResult[]>`、延迟历史渲染。

- [ ] 1. 读取 `navigator.connection` 信息并展示。
- [ ] 2. 实现「开始探测」：并行 fetch 多个 CORS 友好端点，计算 RTT。
- [ ] 3. 实现延迟历史小图与失败提示。
- [ ] 4. 运行 `npm.cmd run build`。

### Task 8: 实验舱与关于页

**Files:**
- Create: `lab.html`
- Create: `src/pages/lab.ts`
- Create: `src/styles/pages/lab.css`
- Create: `about.html`
- Create: `src/pages/about.ts`
- Create: `src/styles/pages/about.css`

**Interfaces:**
- Consumes: `SITE_CONTENT`
- Produces: 台风强度换算工具、实验索引、个人简介页。

- [ ] 1. 实现台风强度换算（km/h、蒲福风级、等级）。
- [ ] 2. 实现两个「规划中」实验卡片。
- [ ] 3. 实现关于页简介、兴趣、联系方式。
- [ ] 4. 运行 `npm.cmd run build`。

### Task 9: 全站验证与打磨

**Files:**
- Modify: 全部上述文件
- Test: `npm.cmd run build`

**Interfaces:**
- Consumes: 全部模块
- Produces: 可发布构建产物 `dist/`。

- [ ] 1. 运行 `npm.cmd run build`，修复所有 TS 错误。
- [ ] 2. 运行 `npm.cmd run preview`，用浏览器/HTTP 检查六个页面可访问。
- [ ] 3. 检查 320px 与桌面宽度下的布局、键盘焦点、二级菜单。
- [ ] 4. 停止 preview，给出验证结果与已知降级点。
*** End of plan