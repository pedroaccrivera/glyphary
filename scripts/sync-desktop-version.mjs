#!/usr/bin/env node
/**
 * Keeps the Rust package on the same version as package.json.
 *
 * npm runs this from the `version` lifecycle, after bumping package.json and
 * before creating the release commit, so both files move together.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

const replace = (file, pattern, replacement) => {
  const path = resolve(root, file);
  if (!existsSync(path)) return;
  const before = readFileSync(path, 'utf8');
  const after = before.replace(pattern, replacement);
  if (after !== before) {
    writeFileSync(path, after);
    console.log(file + ' → ' + version);
  }
};

replace('src-tauri/Cargo.toml', /^version = "[^"]*"$/m, 'version = "' + version + '"');
replace('src-tauri/Cargo.lock', /(\[\[package\]\]\nname = "glyphary"\nversion = ")[^"]*(")/, '$1' + version + '$2');
