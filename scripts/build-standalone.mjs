#!/usr/bin/env node
/**
 * Builds dist/glyphary.html: one self-contained file with the CSS, the JS and
 * fontkit inlined.
 *
 * The bundle is an IIFE on purpose — ES modules are blocked on file://, and the
 * whole point of this artifact is that teammates can double click it.
 */
import { build } from 'esbuild';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = resolve(root, 'build/standalone');
const outFile = resolve(root, 'dist/glyphary.html');

const kb = (bytes) => (bytes / 1024).toFixed(1) + ' KB';

rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

await build({
  entryPoints: [resolve(root, 'src/main.js')],
  outdir: tmp,
  entryNames: 'app',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  sourcemap: false,
  legalComments: 'none',
  logLevel: 'warning',
});

const js = readFileSync(resolve(tmp, 'app.js'), 'utf8');
const css = readFileSync(resolve(tmp, 'app.css'), 'utf8');

// Inlining is byte-exact: a stray closing tag would break out of the element.
if (/<\/script/i.test(js)) throw new Error('bundle contains </script>; cannot inline safely');
if (/<\/style/i.test(css)) throw new Error('stylesheet contains </style>; cannot inline safely');

const cssBlock = /<!-- build:css -->[\s\S]*?<!-- \/build:css -->/;
const jsBlock = /<!-- build:js -->[\s\S]*?<!-- \/build:js -->/;

let html = readFileSync(resolve(root, 'index.html'), 'utf8');
if (!cssBlock.test(html) || !jsBlock.test(html)) {
  throw new Error('index.html is missing the build:css / build:js placeholders');
}

html = html.replace(cssBlock, '<style>\n' + css + '\n</style>');
html = html.replace(jsBlock, '<script>\n' + js + '\n</script>');

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, html, 'utf8');

console.log('standalone → ' + outFile);
console.log(
  '  total ' +
    kb(Buffer.byteLength(html)) +
    ' (css ' +
    kb(Buffer.byteLength(css)) +
    ', js ' +
    kb(Buffer.byteLength(js)) +
    ')',
);
