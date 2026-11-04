#!/usr/bin/env node
/**
 * Fails when a pushed tag does not match the version in package.json, so a
 * release can never be published under the wrong number.
 *
 * Usage: node scripts/check-version.mjs v0.1.1
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME ?? '';
const fromTag = tag.replace(/^v/, '');
const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

if (!/^\d+\.\d+\.\d+$/.test(fromTag)) {
  console.error(`Tag "${tag}" is not in the vX.Y.Z shape.`);
  process.exit(1);
}

if (fromTag !== version) {
  console.error(`Tag "${tag}" does not match the package.json version "${version}".`);
  console.error('Run `npm run release` so the bump, the commit and the tag stay in step.');
  process.exit(1);
}

console.log(`Tag "${tag}" matches the package.json version "${version}".`);
