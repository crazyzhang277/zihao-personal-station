import { chromium } from "playwright-core";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function debugSubmenuHover() {
  console.log("[DEBUG-Hover] 启动浏览器...");
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: false,
  });
  
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto("http://localhost:5173/index.html");
  await page.waitForTimeout(1000);
  
  // 检查 nav-item--group 的边界
  const navGroup = await page.locator(".nav-item--group");
  const groupBox = await navGroup.boundingBox();
  console.log("[DEBUG-Hover] nav-item--group 边界:", JSON.stringify(groupBox));
  
  // 悬停到"观测"按钮
  await navGroup.hover();
  await page.waitForTimeout(500);
  
  // 检查子菜单
  const submenu = await page.locator(".submenu");
  const submenuBox = await submenu.boundingBox();
  console.log("[DEBUG-Hover] submenu 边界:", JSON.stringify(submenuBox));
  
  // 计算间隙
  if (groupBox && submenuBox) {
    const gap = submenuBox.y - (groupBox.y + groupBox.height);
    console.log("[DEBUG-Hover] 按钮底部与子菜单顶部间隙:", gap, "px");
  }
  
  // 测试：移动到子菜单底部（最后一个选项下方）
  const links = await submenu.locator("a").all();
  const lastLink = links[links.length - 1];
  const lastLinkBox = await lastLink.boundingBox();
  
  if (lastLinkBox && submenuBox) {
    // 移动到最后一个选项的下方空白区域
    const bottomY = lastLinkBox.y + lastLinkBox.height + 5;
    console.log("[DEBUG-Hover] 测试移动到子菜单底部空白区域 y:", bottomY);
    
    await page.mouse.move(submenuBox.x + submenuBox.width / 2, bottomY);
    await page.waitForTimeout(300);
    
    const visible = await submenu.isVisible();
    console.log("[DEBUG-Hover] 移动到底部空白区域后，子菜单是否显示:", visible);
  }
  
  console.log("[DEBUG-Hover] 诊断完成，10秒后关闭浏览器...");
  await page.waitForTimeout(10000);
  await browser.close();
}

debugSubmenuHover().catch(console.error);
