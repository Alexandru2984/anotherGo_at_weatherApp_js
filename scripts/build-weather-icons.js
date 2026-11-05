import { mkdirSync, writeFileSync } from 'node:fs';
const destination = new URL('../icons/weather/', import.meta.url);
mkdirSync(destination, { recursive: true });
const codes = ['01', '02', '03', '04', '09', '10', '11', '13', '50'];
const sun = '<g stroke="#f7b43c" stroke-width="4" stroke-linecap="round"><path d="M36 9v7m0 40v7M9 36h7m40 0h7M17 17l5 5m28 28 5 5M17 55l5-5m28-28 5-5"/><circle cx="36" cy="36" r="15" fill="#ffd36b"/></g>';
const moon = '<path d="M50 11a25 25 0 1 0 16 39 24 24 0 0 1-16-39Z" fill="#9ebdff"/>';
const cloud = '<path d="M27 65a14 14 0 0 1-1-28 21 21 0 0 1 40-5 16 16 0 0 1 7 31 15 15 0 0 1-7 2Z" fill="#b9cbdc"/><path d="M27 65a14 14 0 0 1-1-28 21 21 0 0 1 40-5 16 16 0 0 1 7 31 15 15 0 0 1-7 2Z" fill="none" stroke="#8ea8c0" stroke-width="2"/>';
const rain = '<path d="m32 74-5 10m23-10-5 10m23-10-5 10" stroke="#4d9fe5" stroke-width="4" stroke-linecap="round"/>';
const snow = '<g stroke="#8ab7df" stroke-width="2.5" stroke-linecap="round"><path d="M30 73v16m-7-12 14 8m-14 0 14-8M59 73v16m-7-12 14 8m-14 0 14-8"/></g>';
for (const code of codes) for (const period of ['d', 'n']) {
  let body = '';
  if (code === '01' || code === '02' || code === '10') body += period === 'd' ? sun : moon;
  if (['02', '03', '04', '09', '10', '11', '13'].includes(code)) body += cloud;
  if (['09', '10'].includes(code)) body += rain;
  if (code === '11') body += '<path d="m49 56-13 22h12l-6 17 24-28H53l8-11Z" fill="#f5bd37"/>';
  if (code === '13') body += snow;
  if (code === '50') body += '<g stroke="#9aafc5" stroke-width="6" stroke-linecap="round"><path d="M23 33h54M15 49h65M25 65h45"/></g>';
  writeFileSync(new URL(`${code}${period}.svg`, destination), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>\n`);
}
