import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { expect, test } from '@playwright/test';

import { STRINGS } from '../../src/lib/strings.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const artifact = resolve(root, 'dist/glyphary.html');
const fixture = (name) => resolve(root, 'tests/fixtures/' + name);

const SVG_FONT = fixture('demo.svg');
const WOFF2 = fixture('demo.woff2');
const WOFF = fixture('demo.woff');
const TTF = fixture('demo.ttf');
const OTF = fixture('demo.otf');
const ARIAL = '/System/Library/Fonts/Supplemental/Arial.ttf';

const THEMES = ['light', 'dark'];

const open = (page, theme, query = '') => page.goto('file://' + artifact + '?theme=' + theme + query);

const upload = async (page, file) => {
  await page.setInputFiles('#fileInput', file);
};

const waitForFont = async (page, family = 'Glyphary Demo') => {
  await expect(page.locator('#fontName')).toHaveText(family);
  await expect(page.locator('#welcome')).toBeHidden();
  await expect(page.locator('#grid')).toBeVisible();
};

const readStream = (stream) =>
  new Promise((done, fail) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => done(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', fail);
  });

const cssRuleCount = (css) => (css.match(/\{ content: "\\[0-9a-f]+"; \}/g) || []).length;

for (const theme of THEMES) {
  test.describe('viewer · ' + theme, () => {
    test.beforeEach(async ({ page }) => {
      await open(page, theme);
      await expect(page.locator('#fontName')).toHaveText('No font loaded');
    });

    test('starts empty and asks for a font', async ({ page }) => {
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('#welcome')).toBeVisible();
      await expect(page.locator('#welcomeTitle')).toHaveText('Open a font to begin.');
      await expect(page.locator('#fontSub')).toHaveText('Waiting for a font file.');
      await expect(page.locator('#fontFile')).toBeHidden();
      await expect(page.locator('.stats dd')).toHaveText(['—', '—', '—', '—']);
      await expect(page.locator('#resultCount')).toBeHidden();
      await expect(page.locator('#grid')).toBeHidden();
      await expect(page.locator('.glyph-card')).toHaveCount(0);
      await expect(page.locator('#searchInput')).toBeDisabled();
      await expect(page.locator('#sizeRange')).toBeDisabled();
      await expect(page.locator('#cssBtn')).toBeDisabled();
      await expect(page.locator('[data-sort="file"]')).toBeDisabled();
      await expect(page.locator('#resetBtn')).toHaveCount(0);
      await expect(page).toHaveTitle('Glyphary — icon font viewer');
    });

    test('loads the first font from the welcome button', async ({ page }) => {
      const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.locator('#welcomeOpen').click()]);
      await chooser.setFiles(WOFF2);

      await waitForFont(page);
      await expect(page.locator('#fontSub')).toHaveText('Regular · WOFF2 · v1.000');
      await expect(page.locator('#fontFile')).toHaveText('File: demo.woff2');
      await expect(page.locator('#statGlyphs')).toHaveText('25');
      await expect(page.locator('#statUpem')).toHaveText('1000');
      await expect(page.locator('#statMetrics')).toHaveText('1000 / 0');
      await expect(page.locator('#statFormat')).toHaveText('WOFF2');
      await expect(page.locator('.glyph-card')).toHaveCount(25);
      await expect(page.locator('#resultCount')).toHaveText('25 glyphs');
      await expect(page).toHaveTitle('Glyphary Demo — Glyphary');
      await expect(page.locator('#searchInput')).toBeEnabled();
      await expect(page.locator('#sizeRange')).toBeEnabled();
      await expect(page.locator('#cssBtn')).toBeEnabled();
      await expect(page.locator('.glyph-card .glyph-name').first()).toHaveText('house');
    });

    test('uses a distinct palette per theme', async ({ page }) => {
      const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      const ink = await page.evaluate(() => getComputedStyle(document.body).color);
      if (theme === 'dark') {
        expect(background).toBe('rgb(20, 19, 15)');
        expect(ink).toBe('rgb(242, 239, 230)');
      } else {
        expect(background).toBe('rgb(244, 242, 236)');
        expect(ink).toBe('rgb(27, 26, 23)');
      }
    });

    test('theme button cycles auto → light → dark and persists the choice', async ({ page }) => {
      // No ?theme= here: the default mode comes from the system preference.
      await page.goto('file://' + artifact);

      const html = page.locator('html');
      const button = page.locator('#themeBtn');
      await expect(html).toHaveAttribute('data-theme-mode', 'auto');
      expect(['light', 'dark']).toContain(await html.getAttribute('data-theme'));

      await button.click();
      await expect(html).toHaveAttribute('data-theme-mode', 'light');
      await expect(html).toHaveAttribute('data-theme', 'light');
      await expect(page.locator('#themeLabel')).toHaveText('Light');

      await button.click();
      await expect(html).toHaveAttribute('data-theme-mode', 'dark');
      await expect(html).toHaveAttribute('data-theme', 'dark');
      await expect(page.locator('#themeLabel')).toHaveText('Dark');
      expect(await page.evaluate(() => window.localStorage.getItem('glyphary:theme'))).toBe('dark');

      await button.click();
      await expect(html).toHaveAttribute('data-theme-mode', 'auto');
      await expect(page.locator('#themeLabel')).toHaveText('Auto');
    });

    test('search matches names, code points and classes', async ({ page }) => {
      await upload(page, WOFF2);
      await waitForFont(page);

      const search = page.locator('#searchInput');
      const count = page.locator('#resultCount');

      await search.fill('house');
      await expect(count).toHaveText('1 of 25');
      await expect(page.locator('.glyph-card .glyph-name')).toHaveText(['house']);

      await search.fill('star');
      await expect(count).toHaveText('1 of 25');

      await search.fill('U+E902');
      await expect(count).toHaveText('1 of 25');
      await expect(page.locator('.glyph-card .glyph-name')).toHaveText('x-lg');

      await search.fill('e902');
      await expect(count).toHaveText('1 of 25');

      await search.fill(String(0xe902));
      await expect(count).toHaveText('1 of 25');

      await search.fill('\\e902');
      await expect(count).toHaveText('1 of 25');

      await search.fill('icon-x-lg');
      await expect(count).toHaveText('1 of 25');

      await search.fill('zzzz-no-match');
      await expect(count).toHaveText('0 of 25');
      await expect(page.locator('#empty')).toBeVisible();
      await expect(page.locator('#emptyQuery')).toHaveText('“zzzz-no-match”');

      await page.locator('#emptyClear').click();
      await expect(count).toHaveText('25 glyphs');
      await expect(search).toHaveValue('');
    });

    test('sorting and the size slider', async ({ page }) => {
      await upload(page, WOFF2);
      await waitForFont(page);

      await page.locator('[data-sort="name"]').click();
      await expect(page.locator('[data-sort="name"]')).toHaveAttribute('aria-pressed', 'true');
      const names = await page.locator('.glyph-card .glyph-name').allTextContents();
      const sorted = names.slice().sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));
      expect(names).toEqual(sorted);

      await page.locator('[data-sort="code"]').click();
      await expect(page.locator('.glyph-card .glyph-code').first()).toHaveText('\\e900');

      await page.locator('#sizeRange').fill('48');
      await expect(page.locator('#sizeOut')).toHaveText('48 px');
      const size = await page.evaluate(() =>
        getComputedStyle(document.getElementById('grid')).getPropertyValue('--gsize').trim(),
      );
      expect(size).toBe('48px');
    });

    test('drawer shows the glyph, its CSS and its metadata', async ({ page }) => {
      await upload(page, WOFF2);
      await waitForFont(page);

      await page.locator('.glyph-card').first().click();
      const drawer = page.locator('#drawer');
      await expect(drawer).toBeVisible();
      await expect(page.locator('#drawerTitle')).toHaveText('house');
      await expect(page.locator('#drawerIndex')).toHaveText('GLYPH 001 / 025');
      await expect(page.locator('#cssRule')).toHaveText('.icon-house::before { content: "\\e900"; }');
      await expect(page.locator('.preview-label')).toHaveText(STRINGS.drawer.preview);
      await expect(page.locator('#meta dt')).toHaveText(['Unicode', 'Decimal', 'Advance', 'Glyph ID']);
      await expect(page.locator('#meta dd').first()).toHaveText('U+E900');
      await expect(page.locator('#variantBadge')).toBeHidden();
      await expect(page.locator('html')).toHaveClass(/locked/);

      await page.keyboard.press('ArrowRight');
      await expect(page.locator('#drawerTitle')).toHaveText('search');
      await expect(page.locator('#cssRule')).toContainText('\\e901');
      await page.keyboard.press('ArrowLeft');
      await expect(page.locator('#drawerTitle')).toHaveText('house');

      await page.keyboard.press('Escape');
      await expect(drawer).toBeHidden();
      await expect(page.locator('html')).not.toHaveClass(/locked/);
      await expect(page.locator('.glyph-card').first()).toBeFocused();
    });

    test('drawer closes on a backdrop click', async ({ page }) => {
      await upload(page, WOFF2);
      await waitForFont(page);

      await page.locator('.glyph-card').first().click();
      await expect(page.locator('#drawer')).toBeVisible();
      await page.mouse.click(150, 600);
      await expect(page.locator('#drawer')).toBeHidden();
    });

    test('copies the character and the CSS rule', async ({ page }) => {
      await upload(page, WOFF2);
      await waitForFont(page);

      await page.locator('.glyph-card').first().click();
      const toast = page.locator('#toast');
      await page.locator('#copyChar').click();
      await expect(toast).toBeVisible();
      await expect(toast).toHaveText(/Character copied|Could not copy/);
      await page.locator('#copyRule').click();
      await expect(toast).toHaveText(/CSS copied|Could not copy/);
    });

    test('downloads the glyph as SVG', async ({ page }) => {
      await upload(page, WOFF2);
      await waitForFont(page);

      await page.locator('.glyph-card').first().click();
      const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#downloadSvg').click()]);
      expect(download.suggestedFilename()).toBe('glyphary-demo-house.svg');
      const svg = await readStream(await download.createReadStream());
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('transform="scale(1,-1)"');
      expect(svg).toMatch(/d="M544 906/);
    });

    test('exports the CSS with a custom, sanitized prefix', async ({ page }) => {
      await upload(page, WOFF2);
      await waitForFont(page);

      await page.locator('#cssBtn').click();
      const dialog = page.locator('#cssDialog');
      await expect(dialog).toBeVisible();
      await expect(page.locator('#cssMeta')).toHaveText('25 rules · prefix .icon');
      await expect(page.locator('#prefixInput')).toHaveValue('icon');
      expect(cssRuleCount(await page.locator('#cssOutput').textContent())).toBe(25);
      await expect(page.locator('#cssOutput')).toContainText('.icon-house::before { content: "\\e900"; }');

      await page.locator('#prefixInput').fill('test_icons');
      await expect(page.locator('#cssMeta')).toHaveText('25 rules · prefix .test_icons');
      await expect(page.locator('#cssOutput')).toContainText('.test_icons-house::before');

      await page.locator('#prefixInput').fill('9 bad prefix!');
      await page.locator('#prefixInput').blur();
      await expect(page.locator('#prefixInput')).toHaveValue('i-9-bad-prefix');
      await expect(page.locator('#cssOutput')).toContainText('.i-9-bad-prefix-house::before');

      await page.mouse.click(60, 200);
      await expect(dialog).toBeHidden();
    });

    test('resets the prefix when another font is loaded', async ({ page }) => {
      await upload(page, WOFF2);
      await waitForFont(page);

      await page.locator('#cssBtn').click();
      await page.locator('#prefixInput').fill('myicons');
      await page.keyboard.press('Escape');
      await expect(page.locator('#cssDialog')).toBeHidden();

      await upload(page, TTF);
      await expect(page.locator('#statFormat')).toHaveText('TTF');
      await page.locator('#cssBtn').click();
      await expect(page.locator('#prefixInput')).toHaveValue('icon');
    });

    test('downloads the CSS and the CSV', async ({ page }) => {
      await upload(page, WOFF2);
      await waitForFont(page);

      await page.locator('#cssBtn').click();
      await expect(page.locator('#cssDialog')).toBeVisible();

      const [cssDownload] = await Promise.all([page.waitForEvent('download'), page.locator('#downloadCss').click()]);
      expect(cssDownload.suggestedFilename()).toBe('glyphary-demo-glyphs.css');
      const css = await readStream(await cssDownload.createReadStream());
      expect(cssRuleCount(css)).toBe(25);
      expect(css).toContain('Generated by Glyphary');

      const [csvDownload] = await Promise.all([page.waitForEvent('download'), page.locator('#downloadCsv').click()]);
      expect(csvDownload.suggestedFilename()).toBe('glyphary-demo-glyphs.csv');
      const csv = await readStream(await csvDownload.createReadStream());
      const lines = csv.split('\r\n');
      expect(csv.charCodeAt(0)).toBe(0xfeff);
      expect(lines[0]).toBe('\ufeffglyph_name,unicode,codepoint_decimal,css_content,css_class');
      expect(lines.filter(Boolean)).toHaveLength(26);
      expect(lines[1]).toBe('house,U+E900,59648,\\e900,icon-house');
    });

    test('loads SVG font, WOFF2, WOFF, TTF and OTF uploads', async ({ page }) => {
      const cases = [
        { file: SVG_FONT, name: 'demo.svg', format: 'SVG', sub: 'SVG' },
        { file: WOFF2, name: 'demo.woff2', format: 'WOFF2', sub: 'Regular · WOFF2 · v1.000' },
        { file: WOFF, name: 'demo.woff', format: 'WOFF', sub: 'Regular · WOFF · v1.000' },
        { file: TTF, name: 'demo.ttf', format: 'TTF', sub: 'Regular · TTF · v1.000' },
        { file: OTF, name: 'demo.otf', format: 'OTF', sub: 'Regular · OTF · v1.000' },
      ];

      for (const item of cases) {
        await upload(page, item.file);
        await waitForFont(page);
        await expect(page.locator('#fontSub')).toHaveText(item.sub);
        await expect(page.locator('#fontFile')).toHaveText('File: ' + item.name);
        await expect(page.locator('#statFormat')).toHaveText(item.format);
        await expect(page.locator('.glyph-card')).toHaveCount(25);
        await expect(page.locator('#resultCount')).toHaveText('25 glyphs');
        await expect(page.locator('#searchInput')).toHaveValue('');
        await expect(page.locator('[data-sort="file"]')).toHaveClass(/active/);
        await expect(page.locator('.glyph-card .glyph-name').first()).toHaveText('house');
        await expect(page.locator('.glyph-card svg path').first()).toHaveAttribute('d', /^M544/);
      }

      await page.locator('#cssBtn').click();
      await expect(page.locator('#prefixInput')).toHaveValue('icon');
    });

    test('reports unreadable files and keeps the current font', async ({ page }) => {
      const errorBox = page.locator('#errorBox');

      await upload(page, { name: 'broken.woff', mimeType: 'font/woff', buffer: Buffer.from('definitely not a font') });
      await expect(errorBox).toBeVisible();
      await expect(page.locator('#errorMsg')).toContainText('Unrecognized format');
      await expect(page.locator('#toast')).toHaveText(STRINGS.toast.readFailed);
      await expect(page.locator('#fontName')).toHaveText('No font loaded');
      await expect(page.locator('#welcome')).toBeVisible();

      await page.locator('#closeError').click();
      await expect(errorBox).toBeHidden();

      await upload(page, {
        name: 'icon.svg',
        mimeType: 'image/svg+xml',
        buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4h16"/></svg>'),
      });
      await expect(errorBox).toBeVisible();
      await expect(page.locator('#errorMsg')).toContainText('No <font> element found');

      await upload(page, {
        name: 'malformed.svg',
        mimeType: 'image/svg+xml',
        buffer: Buffer.from('<svg><font><glyph unicode="&#xe900;" d="M0 0"/></svg>'),
      });
      await expect(page.locator('#errorMsg')).toContainText('could not be parsed');

      await upload(page, WOFF2);
      await waitForFont(page);
      await expect(errorBox).toBeHidden();

      await upload(page, { name: 'broken.woff', mimeType: 'font/woff', buffer: Buffer.from('nope') });
      await expect(errorBox).toBeVisible();
      await expect(page.locator('#fontName')).toHaveText('Glyphary Demo');
      await expect(page.locator('.glyph-card')).toHaveCount(25);
    });

    test('accepts a font dropped on the window', async ({ page }) => {
      const base64 = readFileSync(WOFF2).toString('base64');

      const overlay = await page.evaluate((data) => {
        const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
        const transfer = new DataTransfer();
        transfer.items.add(new File([bytes], 'demo.woff2', { type: 'font/woff2' }));
        window.__dropTransfer = transfer;
        window.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: transfer }));
        const shown = {
          dragging: document.body.classList.contains('dragging'),
          display: getComputedStyle(document.getElementById('dropOverlay')).display,
        };
        window.dispatchEvent(new DragEvent('dragleave', { bubbles: true, cancelable: true, dataTransfer: transfer }));
        return {
          shown,
          hidden: {
            dragging: document.body.classList.contains('dragging'),
            display: getComputedStyle(document.getElementById('dropOverlay')).display,
          },
        };
      }, base64);

      expect(overlay.shown).toEqual({ dragging: true, display: 'grid' });
      expect(overlay.hidden).toEqual({ dragging: false, display: 'none' });

      await page.evaluate(() => {
        window.dispatchEvent(
          new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: window.__dropTransfer }),
        );
        window.dispatchEvent(
          new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: window.__dropTransfer }),
        );
      });
      await waitForFont(page);
      await expect(page.locator('.glyph-card')).toHaveCount(25);
    });

    test('stays usable on a phone viewport', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const emptyOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(emptyOverflow).toBeLessThanOrEqual(1);
      await expect(page.locator('#welcome')).toBeVisible();

      await upload(page, WOFF2);
      await waitForFont(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);

      await page.locator('.glyph-card').first().click();
      const width = await page.locator('#drawer').evaluate((node) => node.getBoundingClientRect().width);
      expect(Math.abs(width - 390)).toBeLessThan(2);
      await page.keyboard.press('Escape');

      await page.locator('#cssBtn').click();
      await expect(page.locator('#cssDialog')).toBeVisible();
      const cssOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(cssOverflow).toBeLessThanOrEqual(1);
      const copyWidth = await page.locator('#copyCss').evaluate((node) => node.getBoundingClientRect().width);
      expect(copyWidth).toBeGreaterThan(200);
    });

    test('enables the slash shortcut once a font is loaded', async ({ page }) => {
      await page.keyboard.press('/');
      await expect(page.locator('#searchInput')).not.toBeFocused();

      await upload(page, WOFF2);
      await waitForFont(page);
      await page.keyboard.press('/');
      await expect(page.locator('#searchInput')).toBeFocused();
    });
  });
}

test.describe('large font', () => {
  test('renders a 2.7k glyph font within the render cap', async ({ page }) => {
    test.skip(!existsSync(ARIAL), 'Arial is not installed on this machine');
    test.setTimeout(120_000);

    await open(page, 'light');
    await expect(page.locator('#fontName')).toHaveText('No font loaded');

    const started = Date.now();
    await upload(page, ARIAL);
    await expect(page.locator('#fontName')).toHaveText('Arial');
    const elapsed = Date.now() - started;

    await expect(page.locator('#statFormat')).toHaveText('TTF');
    await expect(page.locator('.glyph-card')).toHaveCount(2000);
    await expect(page.locator('#limitNote')).toBeVisible();
    await expect(page.locator('#limitNote')).toContainText('Showing the first 2,000 of');
    expect(elapsed).toBeLessThan(90_000);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
