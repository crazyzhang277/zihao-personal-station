export type PageId = "typhoon";

export function renderMasthead(): string {
  return '<header class="masthead">' +
    '<a class="masthead__brand" href="typhoon.html" aria-label="回到台风监测台">' +
    '<span class="brand-mark" aria-hidden="true">WP</span>' +
    '<span class="masthead__title">' +
    '<strong>西太平洋台风监测台</strong>' +
    '<span>WEST PACIFIC OBSERVATION / PERSONAL STATION</span>' +
    '</span>' +
    '<span class="masthead__divider" aria-hidden="true"></span>' +
    '<span class="masthead__station">DATA DESK / 个人观测站</span>' +
    '</a>' +
    '<div class="masthead__right">' +
    '<p class="masthead__issue">LIVE STATION · 2026</p>' +
    '<button class="nav-toggle" id="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">' +
    '<span class="nav-toggle__line" aria-hidden="true"></span>' +
    '<span class="nav-toggle__line" aria-hidden="true"></span>' +
    '<span class="visually-hidden">打开导航菜单</span>' +
    '</button>' +
    '</div>' +
    '</header>';
}

export function renderNav(current: PageId): string {
  const active = current === "typhoon" ? ' aria-current="page"' : "";
  return '<nav id="site-nav" class="site-nav" aria-label="主导航" aria-expanded="false">' +
    '<ul class="nav-list">' +
    '<li class="nav-item is-active"><a href="typhoon.html"' + active + '><span><span class="nav-link__code">01</span>实时台风</span><span aria-hidden="true">↗</span></a></li>' +
    '</ul>' +
    '<p class="nav-foot">OBSERVATION STATION / VOL. 01 — 2026</p>' +
    '</nav>';
}

function renderFooter(): string {
  return '<footer class="site-footer">' +
    '<div class="site-footer__main">' +
    '<div class="site-footer__brand">' +
    '<span class="brand-mark" aria-hidden="true">WP</span>' +
    '<div>' +
    '<strong>西太平洋台风监测台 / WEST PACIFIC OBSERVATION</strong>' +
    '<p>多源台风数据与路径记录</p>' +
    '</div>' +
    '</div>' +
    '<div class="site-footer__links" aria-label="功能索引">' +
    '<a href="typhoon.html">实时台风 ↗</a>' +
    '</div>' +
    '</div>' +
    '<div class="site-footer__meta">' +
    '<span>© 2026 WEST PACIFIC OBSERVATION</span>' +
    '<span>WGS84 / DATA DESK / ISSUE 01</span>' +
    '</div>' +
    '</footer>';
}

function initializeMenu(): void {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

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
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setExpanded(false);
  });
}

export function initNavigation(): void {
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");
  if (header) header.innerHTML = renderMasthead() + renderNav("typhoon");
  if (footer) footer.innerHTML = renderFooter();
  initializeMenu();
}
