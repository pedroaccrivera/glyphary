<div align="center">

# Glyphary

**Open an icon font, read every glyph, code point and CSS rule.**

Runs entirely in the browser — no uploads, no server, no font bundled in.

`SVG font` · `WOFF` · `WOFF2` · `TTF` · `OTF` · light & dark themes

</div>

![Glyphary with no font loaded](docs/empty-light.png)

## What it does

Glyphary starts empty: the first thing you do is open a font. From there it turns
every glyph into a specimen you can inspect and export.

- **Open or drop a font** — `.svg` (IcoMoon/FontForge SVG font), `.woff`, `.woff2`, `.ttf`, `.otf`. Files are read locally with `FileReader`; nothing is ever sent anywhere.
- **Real parsing** — SVG fonts are parsed from XML, binary fonts with [fontkit](https://github.com/foliojs/fontkit). Each glyph is converted to an SVG path, so you see the actual outlines, not a font preview.
- **Everything updates on load** — family name, file name, subfamily, version, format, UPM, ascent/descent, code points, `content: "\eXXX"` values and class names.
- **Search** by name, `U+E900`, `e900`, `59648`, `\e900` or the generated class name.
- **Sort** by file order, name or code point; resize the specimens with a slider.
- **Detail drawer** with a large preview, the CSS rule, Unicode/decimal/advance/glyph-id, copy character, copy CSS and a downloadable SVG of the glyph. Navigate with `←` / `→`.
- **Export** the whole sheet as CSS or CSV, with a configurable and sanitised class prefix (defaults to `icon` for every font).
- **Light and dark themes** — follows your system by default, with an Auto → Light → Dark toggle that is remembered.

![Glyphary showing a font](docs/viewer-light.png)

## Privacy

Fonts are read with the browser's `FileReader`/`ArrayBuffer` APIs and parsed in the
page. There is no network request, no analytics, no service worker and no backend.
The standalone HTML file works offline from `file://`. You can verify this in the
browser's Network panel: opening a font produces no requests.

## Quick start

```bash
git clone <repo-url> glyphary
cd glyphary
npm install
npm run dev          # http://localhost:5173 with hot reload
```

Node 22 or newer is required (Node 20 is end-of-life and cannot run the test
toolchain).

Open the app, click **Open font** (or drop a file anywhere), and pick an icon font.

## Build the shareable file

```bash
npm run build        # -> dist/glyphary.html  (one file, ~420 KB)
```

That artifact is completely self-contained: CSS, JavaScript and fontkit are inlined.
The bundle is an IIFE on purpose, because ES modules are blocked on `file://`. You can
double click the file, keep it on a share drive, or attach it to a ticket. It contains
no font: each person opens their own.

```bash
npm start            # opens dist/glyphary.html in your browser
npm run serve        # or serve it on http://localhost:4321
node bin/glyphary.mjs --help
```

## Distribution

| Option           | Command                                             | Good for                                                                                     |
| ---------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Single HTML file | `npm run build`, then share `dist/glyphary.html`    | Zero install; Slack, Drive, a GitHub Release asset                                           |
| Tarball          | `npm pack` → `glyphary-1.0.0.tgz`                   | Teammates run `npx ./glyphary-1.0.0.tgz`, or `npm i -g ./glyphary-1.0.0.tgz` then `glyphary` |
| Private registry | `npm publish` (see `.github/workflows/release.yml`) | Versioned installs from GitHub Packages or an internal registry                              |

```bash
npm pack                       # creates the tarball, prints its name
npx ./glyphary-1.0.0.tgz        # run it straight from the tarball
npm i -g ./glyphary-1.0.0.tgz   # or install the `glyphary` command globally
glyphary --serve                # serve the viewer locally
```

## Using it

| Action        | How                                                                                    |
| ------------- | -------------------------------------------------------------------------------------- |
| Load a font   | **Open font** in the top bar or the welcome panel, or drop a file anywhere on the page |
| Search        | Type in the search box, or press `/` (available after a font loads)                    |
| Sort          | **File / Name / Code** segmented control                                               |
| Glyph details | Click any card; `←` / `→` move between glyphs, `esc` closes                            |
| Change theme  | Click the theme button: **Auto → Light → Dark**                                        |
| Export        | **CSS** button: edit the prefix, copy, or download CSS/CSV                             |

## Project layout

```
index.html               markup (English copy lives here and in src/lib/strings.js)
src/
  main.js                entry point
  styles/
    tokens.css           light + dark palettes (the only place colours are defined)
    app.css              layout and components, token-only colours
  lib/
    text.js              names, slugs, prefixes, number formatting
    glyph.js             CSS rules, viewBox, SVG generation
    search.js            filtering and sorting
    exports.js           CSS / CSV / single-glyph SVG output
    strings.js           every user-visible string
    parse/               svg-font.js, binary-font.js, index.js (file sniffing)
  ui/
    theme.js             auto/light/dark resolution and persistence
    app.js               state, font loading, event wiring
    grid.js drawer.js css-dialog.js dropzone.js toast.js
scripts/
  build-standalone.mjs   builds dist/glyphary.html with esbuild
  screenshots.mjs        writes docs/*.png for both themes
bin/glyphary.mjs         the CLI
tests/unit/              Vitest specs for parsing, exports, search and text
tests/e2e/               Playwright specs, run in both themes
tests/fixtures/          demo fonts generated from Bootstrap Icons (MIT), see its README
```

### Theming

`src/styles/tokens.css` defines every colour, radius and shadow for both palettes;
`src/styles/app.css` contains no literal colour. The theme is resolved before first paint by
a small inline script in `index.html` (query param `?theme=light|dark|auto` → `localStorage` →
system preference), so there is no flash of the wrong palette. Use `?theme=dark` in links and
screenshots to force a palette.

## Scripts

| Script                            | Description                                          |
| --------------------------------- | ---------------------------------------------------- |
| `npm run dev`                     | Vite dev server with hot reload                      |
| `npm run build`                   | Standalone single-file viewer (`dist/glyphary.html`) |
| `npm run build:app`               | Multi-file Vite build (`dist/app/`) for hosting      |
| `npm run preview`                 | Preview the Vite build                               |
| `npm start` / `npm run serve`     | Open or serve the standalone viewer                  |
| `npm run lint` / `npm run format` | ESLint / Prettier                                    |
| `npm test`                        | Unit + end-to-end suites                             |
| `npm run test:unit`               | Vitest                                               |
| `npm run test:e2e`                | Playwright (each spec runs in light and dark)        |
| `npm run shots`                   | Regenerate `docs/*.png`                              |

The end-to-end suite drives the built artifact through `file://` with your installed Chrome
(`channel: 'chrome'`), so it never downloads a browser. Set `PLAYWRIGHT_CHANNEL=chromium` to
use Playwright's own build instead.

## Test fixtures

The repository ships no icon font in the app itself. The test suite uses
`tests/fixtures/demo.*`, a 25-icon font generated from
[Bootstrap Icons](https://github.com/twbs/icons) 1.11.3 (MIT) and remapped to
`U+E900–U+E918`; see `tests/fixtures/README.md` and the bundled license. Those files
are test data only and are not included in the npm package.

## Browser support

Chrome, Edge and Safari 16+ (the app uses native `<dialog>`, the popover API when present,
CSS custom properties and `backdrop-filter`).

## License

MIT. Parsing by [fontkit](https://github.com/foliojs/fontkit), also MIT. Demo fixtures
derive from Bootstrap Icons, MIT.
