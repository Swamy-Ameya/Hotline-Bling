const { chromium } = require('C:/Users/raina/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('path');

async function capture() {
  const browser = await chromium.launch({ channel: 'msedge' });
  const outDir = path.resolve(__dirname, '../deck/assets/screenshots');

  // Context with dark mode
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    colorScheme: 'dark',
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Helper to force dark class
  async function forceDark(p) {
    await p.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    });
    await p.waitForTimeout(500);
  }

  console.log('1. Capturing drilldown-verdict.png and drilldown-permutation.png (filter_fault)...');
  await page.goto('http://localhost:3000/radar/filter_fault', { waitUntil: 'networkidle' });
  await forceDark(page);
  await page.waitForTimeout(1000);

  // 1. drilldown-verdict.png
  const verdictCard = await page.locator('[data-slot="card"]').first();
  if (await verdictCard.count()) {
    await verdictCard.screenshot({ path: path.join(outDir, 'drilldown-verdict.png') });
  } else {
    await page.screenshot({ path: path.join(outDir, 'drilldown-verdict.png') });
  }

  // 2. drilldown-permutation.png
  const permPanel = page.locator('text=Permutation Scan Significance').locator('xpath=ancestor::div[@data-slot="card"]');
  if (await permPanel.count()) {
    await permPanel.screenshot({ path: path.join(outDir, 'drilldown-permutation.png') });
  }

  // 3. epi-curve-water.png (filter_fault smeared curve)
  const epiWater = page.locator('text=Epidemic Curve').locator('xpath=ancestor::div[@data-slot="card"]');
  if (await epiWater.count()) {
    await epiWater.screenshot({ path: path.join(outDir, 'epi-curve-water.png') });
  }

  console.log('4. Capturing epi-curve-food.png (food)...');
  await page.goto('http://localhost:3000/radar/food', { waitUntil: 'networkidle' });
  await forceDark(page);
  await page.waitForTimeout(1000);

  // 4. epi-curve-food.png (food sharp spike)
  const epiFood = page.locator('text=Epidemic Curve').locator('xpath=ancestor::div[@data-slot="card"]');
  if (await epiFood.count()) {
    await epiFood.screenshot({ path: path.join(outDir, 'epi-curve-food.png') });
  }

  console.log('5. Capturing report-form-mobile.png (375px mobile)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    colorScheme: 'dark',
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/report', { waitUntil: 'networkidle' });
  await forceDark(mobilePage);
  await mobilePage.waitForTimeout(1000);

  await mobilePage.screenshot({
    path: path.join(outDir, 'report-form-mobile.png'),
    fullPage: false,
  });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
