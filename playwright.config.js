import { defineConfig } from '@playwright/test';

/**
 * The end-to-end suite runs against the standalone artifact (dist/glyphary.html)
 * through file://, so it validates exactly what the team opens by double click.
 *
 * Uses the locally installed Google Chrome (`channel: 'chrome'`) to avoid
 * downloading a browser. Override with PLAYWRIGHT_CHANNEL=chromium if needed.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
  },
});
