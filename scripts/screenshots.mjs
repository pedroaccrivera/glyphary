import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const artifact = 'file://' + resolve('dist/glyphary.html');
const demo = resolve('tests/fixtures/demo.woff2');
const out = resolve('docs');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });

const shoot = async (theme, width, height, name, prepare) => {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  await page.goto(artifact + '?theme=' + theme);
  await page.waitForTimeout(300);
  if (prepare) await prepare(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: resolve(out, name) });
  await page.close();
  console.log('wrote docs/' + name);
};

const loadDemo = async (page) => {
  await page.setInputFiles('#fileInput', demo);
  await page.waitForSelector('.glyph-card svg path');
  await page.waitForTimeout(2400); // let the "loaded" toast fade out
};

for (const theme of ['light', 'dark']) {
  await shoot(theme, 1440, 1000, 'empty-' + theme + '.png');
  await shoot(theme, 1440, 1000, 'viewer-' + theme + '.png', loadDemo);
  await shoot(theme, 1440, 1000, 'drawer-' + theme + '.png', async (page) => {
    await loadDemo(page);
    await page.locator('.glyph-card').first().click();
  });
  await shoot(theme, 1440, 1000, 'css-' + theme + '.png', async (page) => {
    await loadDemo(page);
    await page.locator('#cssBtn').click();
  });
  await shoot(theme, 390, 844, 'mobile-' + theme + '.png', loadDemo);
}

await browser.close();
console.log('screenshots done');
