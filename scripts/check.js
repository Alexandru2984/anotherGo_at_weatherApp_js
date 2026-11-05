import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const files = ['server.js', 'sw.js', 'sw-v4.js', 'playwright.config.js', ...['scripts', 'test', 'e2e'].flatMap(dir => readdirSync(dir).filter(name => /\.m?js$/.test(name)).map(name => `${dir}/${name}`))];
for (const file of files) execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
for (const file of ['index.html', 'offline.html', 'scripts/api.js', 'scripts/config.js', 'scripts/ui.js']) {
  const content = readFileSync(file, 'utf8');
  assert.ok(!/appid=|OPENWEATHER_API_KEY\s*=\s*["'][^"']+/.test(content), `${file}: public API credential found`);
  assert.ok(!/\beval\s*\(|\.innerHTML\s*=/.test(content), `${file}: unsafe dynamic HTML/script sink`);
}
const html = readFileSync('index.html', 'utf8');
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'one document H1');
assert.ok(html.includes('rel="canonical" href="https://weather.micutu.com/"'));
const worker = readFileSync('sw.js', 'utf8');
const version = worker.match(/const VERSION = '([^']+)'/)[1];
for (const file of ['index.html', 'offline.html', 'sw-v4.js', ...readdirSync('scripts').filter(name => ['app.js', 'api.js', 'ui.js', 'insights.js'].includes(name)).map(name => `scripts/${name}`)]) {
  const versions = [...readFileSync(file, 'utf8').matchAll(/\?v=([\w-]+)/g)].map(match => match[1]);
  assert.ok(versions.every(value => value === version), `${file}: asset version differs from worker`);
}
const { publicPaths } = await import('../server.js');
for (const path of publicPaths) assert.ok(readFileSync(resolve('.', path.slice(1))).length > 0, `missing public asset ${path}`);
console.log(`Syntax checked ${files.length} scripts; public assets, credentials, HTML sinks, SEO and worker versions verified.`);
