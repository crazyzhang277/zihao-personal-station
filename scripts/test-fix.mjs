import { chromium } from "playwright-core";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function testFix() {
  console.log("[TEST-FIX] 启动浏览器...");
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: false,
  });
  
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto("http://localhost:5173/index.html");
  await page.waitForTimeout(1000);
  
  const navGroup = await page.locator(".nav-item--group");
  const submenu = await page.locator(".submenu");
  
  // 先悬停到"观测"展开菜单
  await navGroup.hover();
  await page.waitForTimeout(500);
  
  // 测试所有选项
  const links = await submenu.locator("a").all();
  let allPass = true;
  
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const text = await link.textContent();
    await link.hover({ force: true });
    await page.waitForTimeout(200);
    
    const visible = await submenu.isVisible();
    console.log("[TEST-FIX] 选项", i + 1, text, "=> 子菜单显示:", visible);
    if (!visible) allPass = false;
  }
  
  // 额外测试：移动到子菜单底部空白区域
  const lastLink = links[links.length - 1];
  const lastBox = await lastLink.boundingBox();
  const subBox = await submenu.boundingBox();
  if (lastBox && subBox) {
    const bottomY = lastBox.y + lastBox.height + 5;
    await page.mouse.move(subBox.x + subBox.width / 2, bottomY);
    await page.waitForTimeout(300);
    const visible = await submenu.isVisible();
    console.log("[TEST-FIX] 移动到子菜单底部空白区域 => 子菜单显示:", visible);
    if (!visible) allPass = false;
  }
  
  console.log(allPass ? "[TEST-FIX] ✓ 所有测试通过" : "[TEST-FIX] ✗ 仍有问题");
  console.log("[TEST-FIX] 10秒后关闭...");
  await page.waitForTimeout(10000);
  await browser.close();
}

testFix().catch(console.error);
