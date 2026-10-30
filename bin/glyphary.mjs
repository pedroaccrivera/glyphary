#!/usr/bin/env node
/**
 * Glyphary CLI.
 *
 *   glyphary                 open the standalone viewer in your browser
 *   glyphary --serve         serve it on http://localhost:4321 instead
 *   glyphary --port 8080     pick another port for --serve
 *   glyphary --path          print the artifact path (no browser, no server)
 *   glyphary --rebuild       force a fresh standalone build first
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifact = resolve(root, 'dist/glyphary.html');
const builder = resolve(root, 'scripts/build-standalone.mjs');

const HELP = `Glyphary — local icon font viewer

Usage: glyphary [options]

Options:
  --serve            serve the viewer on localhost instead of opening it
  --port <number>    port for --serve (default 4321)
  --path             print the artifact path and exit
  --rebuild          rebuild the standalone file before opening
  --no-open          do not launch a browser
  -h, --help         show this help

The viewer runs entirely in your browser; no file you drop is ever uploaded.`;

const parseArgs = (argv) => {
  const options = { serve: false, port: 4321, path: false, rebuild: false, open: true, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--serve') options.serve = true;
    else if (arg === '--port') options.port = Number(argv[++i]) || options.port;
    else if (arg.startsWith('--port=')) options.port = Number(arg.split('=')[1]) || options.port;
    else if (arg === '--path') options.path = true;
    else if (arg === '--rebuild') options.rebuild = true;
    else if (arg === '--no-open') options.open = false;
    else if (arg === '-h' || arg === '--help') options.help = true;
  }
  return options;
};

const buildStandalone = () => {
  console.log('Building the standalone viewer…');
  const result = spawnSync(process.execPath, [builder], { stdio: 'inherit' });
  if (result.status !== 0) {
    if (result.error || !existsSync(builder)) {
      console.error('Cannot build: scripts/build-standalone.mjs needs the dev dependencies (esbuild).');
      console.error('Install them with `npm install`, or use a release that ships dist/glyphary.html.');
    }
    process.exit(result.status || 1);
  }
};

const openInBrowser = (target) => {
  const platform = process.platform;
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', target] : [target];
  const result = spawnSync(command, args, { stdio: 'ignore' });
  if (result.error || result.status !== 0) {
    console.log('Could not open a browser automatically. Open this file:');
    console.log('  ' + target);
  }
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const serve = (port) => {
  const server = createServer((request, response) => {
    const url = new URL(request.url || '/', 'http://localhost');
    if (url.pathname === '/health') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ ok: true, artifact }));
      return;
    }
    if (url.pathname !== '/' && url.pathname !== '/index.html') {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    response.writeHead(200, { 'content-type': MIME['.html'], 'cache-control': 'no-store' });
    createReadStream(artifact).pipe(response);
  });

  server.on('error', (error) => {
    if (error && error.code === 'EADDRINUSE') {
      console.error('Port ' + port + ' is busy. Try: glyphary --serve --port ' + (port + 1));
    } else {
      console.error(error);
    }
    process.exit(1);
  });

  server.listen(port, '127.0.0.1', () => {
    const url = 'http://localhost:' + port + '/';
    console.log('Glyphary is serving the viewer at ' + url);
    console.log('Press Ctrl+C to stop.');
  });
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(HELP);
    return;
  }

  if (options.rebuild || !existsSync(artifact)) buildStandalone();

  if (options.path) {
    console.log(artifact);
    return;
  }

  if (options.serve) {
    serve(options.port);
    return;
  }

  const size = (statSync(artifact).size / 1024).toFixed(1) + ' KB';
  console.log('Glyphary → ' + artifact + ' (' + size + ')');
  if (options.open) openInBrowser(artifact);
};

main();
