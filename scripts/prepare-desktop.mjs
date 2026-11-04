#!/usr/bin/env node
/**
 * Builds the self-contained viewer and copies it where Tauri expects the
 * frontend: src-tauri/frontend/index.html.
 *
 * The browser artifact and the desktop app share the same file on purpose, so
 * there is only one rendering path to test.
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

await import('./build-standalone.mjs');

const source = resolve(root, 'dist/glyphary.html');
const target = resolve(root, 'src-tauri/frontend/index.html');

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);

console.log('desktop frontend → ' + target);
