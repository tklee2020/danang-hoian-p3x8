/* 진짜 오프라인 — 페이지와 서비스워커 둘 다 네트워크를 끊고 새로고침해도 열리는지, 한 번 본 지도가 다시 뜨는지.
   사용: QA_URL=https://tklee2020.github.io/danang-hoian-p3x8/ node offline.js   (서비스워커는 github.io 에서만 등록된다)
   setOfflineMode 만으로는 서비스워커의 fetch 가 그대로 나가서 "오프라인인데 열림"을 증명 못 해요. */
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');
const URL0 = process.env.QA_URL || 'http://localhost:8765/';
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(p => fs.existsSync(p));
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  const logs = [];
  page.on('console', m => { if (['error', 'warn', 'warning'].includes(m.type()) && !/Expected value to be of type number/.test(m.text())) logs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => logs.push('pageerror: ' + e.message));
  await page.goto(URL0, { waitUntil: 'networkidle2' });
  await sleep(3000);
  await page.reload({ waitUntil: 'networkidle2' }); await sleep(2000);   /* 두 번째 로드부터 서비스워커가 페이지를 잡아요 */
  const swT = await b.waitForTarget(t => t.type() === 'service_worker' && t.browserContext() === ctx, { timeout: 10000 }).catch(() => null);
  console.log('service worker', !!swT, 'controlled', await page.evaluate(() => !!navigator.serviceWorker.controller));
  /* 온라인일 때 지도를 한 번 본다 → 타일이 저장된다 */
  await page.evaluate(() => document.querySelector('#dock [data-view=map]').click());
  await page.waitForFunction('window.__map && window.__map.loaded()', { timeout: 40000 }).catch(e => logs.push('map online: ' + e.message.split('\n')[0]));
  await sleep(1500);
  const online = await page.evaluate(() => ({ build: (document.querySelector('#ver1') || {}).textContent, wx: !!localStorage.getItem('danang26:wx'), fx: !!localStorage.getItem('danang26:fx') }));
  console.log('online', JSON.stringify(online));
  if (swT) { const s = await swT.createCDPSession(); await s.send('Network.enable'); await s.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); }
  await page.setOfflineMode(true);
  await page.reload({ waitUntil: 'domcontentloaded' }).catch(e => logs.push('reload: ' + e.message));
  await sleep(3000);
  const st = await page.evaluate(() => ({
    title: document.title, pill: (document.querySelector('#ddayPill') || {}).textContent, view: document.body.getAttribute('data-view'),
    tl: document.querySelectorAll('#tl .ev').length, spots: typeof TRIP === 'object' ? TRIP.spots.length : 0, geo: !!(window.GEO && window.GEO.sea), apps: document.querySelectorAll('#appRow a').length,
    wx: (document.querySelector('#wxLine') || {}).textContent, build: (document.querySelector('#ver1') || {}).textContent,
    fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).slice(0, 4)
  })).catch(e => 'eval failed ' + e.message);
  console.log('offline', JSON.stringify(st));
  await page.screenshot({ path: path.join(OUT, 'offline.png') });
  await page.evaluate(() => document.querySelector('#dock [data-view=map]').click());
  await page.waitForFunction('window.__map && window.__map.loaded()', { timeout: 30000 }).catch(e => logs.push('map offline: ' + e.message.split('\n')[0]));
  await sleep(2000);
  console.log('offline map', JSON.stringify(await page.evaluate(() => ({ lib: !!window.maplibregl, canvas: !!document.querySelector('#map canvas'), markers: document.querySelectorAll('.mk').length, loaded: !!(window.__map && window.__map.loaded()), msg: document.querySelector('#mapMsg').hidden ? '' : document.querySelector('#mapMsg').textContent }))));
  await page.screenshot({ path: path.join(OUT, 'offline-map.png') });
  console.log(logs.join('\n') || 'no console errors');
  await b.close();
})();
