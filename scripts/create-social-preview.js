import { chromium } from '@playwright/test';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html lang="ro"><meta charset="UTF-8"><style>
    *{box-sizing:border-box}body{min-height:100vh;background-repeat:no-repeat;margin:0;padding:70px 80px;background:radial-gradient(ellipse at 100% 0,#213c66,transparent 65%),#111a2c;color:#edf3ff;font-family:system-ui,sans-serif}
    .brand{font-size:32px;font-weight:750;letter-spacing:-1px}.dot{color:#75baff}.label{color:#90add1;font-size:19px;letter-spacing:3px;text-transform:uppercase;margin-top:70px}h1{font-size:76px;letter-spacing:-4px;line-height:1.08;margin:18px 0 25px;max-width:820px}p{font-size:25px;color:#b2c5de;margin:0}.chips{display:flex;gap:14px;margin-top:45px}.chips span{border:1px solid #395375;border-radius:30px;padding:12px 22px;font-size:19px;background:#182942}.sun{position:absolute;right:95px;top:90px;width:95px;height:95px;border-radius:50%;background:#f6cc6c;box-shadow:0 0 0 22px #f6cc6c12,0 0 0 44px #f6cc6c09}
  </style><div class="brand">Vremea<span class="dot">.</span></div><div class="sun"></div><div class="label">weather.micutu.com</div><h1>Vremea, pe înțelesul tău.</h1><p>Explorează prognoza. Găsește-ți momentul.</p><div class="chips"><span>Prognoză pe 5 zile</span><span>Grafice interactive</span><span>Planificator de activități</span></div></html>`);
  await page.screenshot({ path: new URL('../images/social-preview.png', import.meta.url).pathname });
} finally { await browser.close(); }
