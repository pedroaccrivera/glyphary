#!/usr/bin/env node
/**
 * Release: bump the version, keep the Rust package in step, commit, tag and push.
 *
 * Usage: npm run release [-- patch|minor|major]   (patch is the default)
 *
 * This lives in one script because `npm version` only stages package.json and
 * package-lock.json, so files written by the version lifecycle (Cargo.toml and
 * Cargo.lock) would be left out of the release commit.
 */
import { execFileSync, execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const run = (command, args) => execFileSync(command, args, { cwd: root, stdio: 'inherit' });
const output = (command, args) => execFileSync(command, args, { cwd: root, encoding: 'utf8' }).trim();

const bump = process.argv[2] ?? 'patch';
if (!['patch', 'minor', 'major'].includes(bump)) {
  console.error(`Unknown bump "${bump}". Use patch, minor or major.`);
  process.exit(1);
}

const status = output('git', ['status', '--porcelain']);
if (status) {
  console.error('The working tree is not clean. Commit or stash your changes before releasing.');
  console.error(status);
  process.exit(1);
}

// Bumps package.json and package-lock.json without committing or tagging.
execSync(`npm version ${bump} --no-git-tag-version`, { cwd: root, stdio: 'inherit' });

const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
run(process.execPath, [resolve(root, 'scripts/sync-desktop-version.mjs')]);

run('git', ['add', '-A']);
run('git', ['commit', '-m', `Release ${version}`]);
run('git', ['tag', '-a', `v${version}`, '-m', `Release ${version}`]);
run('git', ['push', '--follow-tags']);
