export type PageId = "index" | "typhoon" | "weather" | "network" | "lab" | "about";

const NAV_ITEMS = [
  { id: "index", label: "总览", href: "index.html", aria: "返回总览" },
  {
    id: "observe",
    label: "观测",
    href: "typhoon.html",
    aria: "观测功能与数据工具",
    children: [
      { id: "typhoon", label: "台风雷达", href: "typhoon.html" },
      { id: "weather", label: "天气站", href: "weather.html" },
      { id: "network", label: "网络探针", href: "network.html" },
    ],
  },
  { id: "lab", label: "实验", href: "lab.html", aria: "实验与工具" },
  { id: "about", label: "关于", href: "about.html", aria: "关于西太平洋观测站" },
] as const;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char];
  });
}

function renderMasthead(): string {
  return `
    <header class="masthead">
      <a class="masthead__brand" href="index.html" aria-label="回到西太平洋观测站首页">
        <span class="stamp masthead__stamp" aria-hidden="true">观</span>
        <span class="masthead__title">
          <strong>西太平洋观测站</strong>
          <span>WEST PACIFIC OBSERVATION</span>
        </span>
        <span class="masthead__divider" aria-hidden="true"></span>
        <span class="masthead__station">PERSONAL STATION / 个人观测站</span>
      </a>
      <div class="masthead__right">
        <p class="masthead__issue">VOL. 01 — 2026</p>
        <button class="nav-toggle" id="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
          <span class="nav-toggle__line" aria-hidden="true"></span>
          <span class="visually-hidden">打开导航菜单</span>
        </button>
      </div>
    </header>
  `;
}

function renderNav(current: PageId): string {
  const topItems = NAV_ITEMS.map((item) => {
    if ("children" in item) {
      const childLinks = item.children
        .map((child) => {
          const active = child.id === current ? " aria-current=\"page\"" : "";
          return `<li><a href="${child.href}"${active}>${escapeHtml(child.label)}</a></li>`;
        })
        .join("");
      const activeClass = item.children.some((child) => child.id === current) ? " is-active" : "";
      return `
        <li class="nav-item nav-item--group${activeClass}">
          <button class="nav-group-toggle" type="button" aria-expanded="false" aria-controls="observe-submenu">
            <span>${escapeHtml(item.label)}</span><span class="nav-chevron" aria-hidden="true">›</span>
          </button>
          <ul class="submenu" id="observe-submenu">
            ${childLinks}
          </ul>
        </li>
      `;
    }
    const active = item.id === current ? " is-active" : "";
    return `
      <li class="nav-item${active}">
        <a href="${item.href}">${escapeHtml(item.label)}</a>
      </li>
    `;
  }).join("");
  return `
    <nav id="site-nav" class="site-nav" aria-label="主导航" aria-expanded="false">
      <ul class="nav-list">
        ${topItems}
      </ul>
      <p class="nav-foot">OBSERVATION STATION / VOL. 01 — 2026</p>
    </nav>
  `;
}

function renderFooter(current: PageId): string {
  return `
    <footer class="site-footer">
      <div class="site-footer__main">
        <div class="site-footer__brand">
          <span class="stamp" aria-hidden="true">观</span>
          <div>
            <strong>西太平洋观测站 / WEST PACIFIC OBSERVATION</strong>
            <p>个人观测站 / 数字工具与实验</p>
          </div>
        </div>
        <div class="site-footer__links" aria-label="功能索引">
          <a href="index.html">总览</a>
          <a href="typhoon.html">台风雷达</a>
          <a href="weather.html">天气站</a>
          <a href="network.html">网络探针</a>
          <a href="lab.html">实验舱</a>
          <a href="about.html">关于</a>
        </div>
      </div>
      <div class="site-footer__meta">
        <span>© 2026 西太平洋观测站</span>
        <span>VOL. 01 — 2026 / ISSUE ${currentIssue(current)}</span>
      </div>
    </footer>
  `;
}

function currentIssue(page: PageId): string {
  const issues: Record<PageId, string> = {
    index: "01",
    typhoon: "02",
    weather: "03",
    network: "04",
    lab: "05",
    about: "06",
  };
  return issues[page];
}

function initializeMenu(): void {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("site-nav");
  const groupToggle = document.querySelector<HTMLButtonElement>(".nav-group-toggle");
  const submenu = document.getElementById("observe-submenu");

  if (!toggle || !nav) return;

  const setSubmenu = (expanded: boolean): void => {
    if (!groupToggle || !submenu) return;
    groupToggle.setAttribute("aria-expanded", String(expanded));
    submenu.setAttribute("aria-expanded", String(expanded));
    document.body.classList.toggle("submenu-open", expanded);
  };

  const setExpanded = (expanded: boolean): void => {
    nav.setAttribute("aria-expanded", String(expanded));
    toggle.setAttribute("aria-expanded", String(expanded));
    const label = toggle.querySelector(".visually-hidden");
    if (label) label.textContent = expanded ? "关闭导航菜单" : "打开导航菜单";
    document.body.classList.toggle("nav-open", expanded);
  };

  toggle.addEventListener("click", () => setExpanded(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).closest("a")) setExpanded(false);
  });

  if (groupToggle && submenu) {
    groupToggle.addEventListener("click", () => setSubmenu(groupToggle.getAttribute("aria-expanded") !== "true"));
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setExpanded(false);
      if (groupToggle) setSubmenu(false);
    }
  });
}

export function initNavigation(): void {
  const body = document.body;
  const page = (body.dataset.page ?? "index") as PageId;
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");
  if (header) header.innerHTML = renderMasthead() + renderNav(page);
  if (footer) footer.innerHTML = renderFooter(page);
  initializeMenu();
}