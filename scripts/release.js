// Stage only committed runtime files. Secrets remain in app/.env (systemd).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readlinkSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { publicPaths } from '../server.js';
const repo = fileURLToPath(new URL('..', import.meta.url));
const parent = resolve(repo, '..');
const git = args => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
const ref = process.argv[2] || 'HEAD';
const commit = git(['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]);
const releases = resolve(parent, 'releases');
const target = resolve(releases, commit);
const current = resolve(parent, 'current');
mkdirSync(releases, { recursive: true });
if (!existsSync(target)) {
  const temporary = resolve(releases, `.staging-${process.pid}`);
  mkdirSync(temporary);
  try {
    const files = [...publicPaths].map(path => path.slice(1)).concat(['server.js', 'package.json']);
    const tracked = new Set(git(['ls-tree', '-r', '--name-only', commit]).split('\n'));
    for (const file of files) if (!tracked.has(file)) throw new Error(`Commit does not contain required asset: ${file}`);
    const archive = execFileSync('git', ['archive', '--format=tar', commit, '--', ...files], { cwd: repo, maxBuffer: 20 * 1024 * 1024 });
    execFileSync('tar', ['-x', '-C', temporary], { input: archive });
    writeFileSync(resolve(temporary, '.release-id'), `${commit}\n`);
    execFileSync(process.execPath, ['--check', resolve(temporary, 'server.js')]);
    renameSync(temporary, target);
  } catch (error) { rmSync(temporary, { recursive: true, force: true }); throw error; }
}
console.log(`Staged release ${commit} in ${target}`);
function pointTo(path) {
  const temporary = `${current}.next-${process.pid}`;
  symlinkSync(path, temporary);
  renameSync(temporary, current);
}
if (process.argv.includes('--activate')) {
  if (!existsSync(current)) throw new Error('Bootstrap current and the systemd unit as described in docs/OPERATIONS.md first.');
  const previous = readlinkSync(current);
  try {
    pointTo(target);
    execFileSync('sudo', ['-n', 'systemctl', 'restart', 'weather-canary']);
    let healthy = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        const res = await fetch('http://127.0.0.1:8105/healthz', { signal: AbortSignal.timeout(1000) });
        healthy = res.ok && (await res.json()).release === commit;
      } catch { /* Allow startup time. */ }
      if (healthy) break;
      await delay(200);
    }
    if (!healthy) throw new Error('New release did not become healthy');
    console.log(`Activated ${commit}`);
  } catch (error) {
    pointTo(previous);
    execFileSync('sudo', ['-n', 'systemctl', 'restart', 'weather-canary']);
    throw error;
  }
}
