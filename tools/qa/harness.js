/* 여행 페이지 QA 하네스 — 헤드리스 크롬으로 "그 시각·그 폭·그 위치"의 화면을 재현해요.
   사용: node harness.js scenarios/moments.js
   환경변수: QA_URL (기본 http://localhost:8765/), CHROME (크롬 실행 파일 경로)

   시나리오 파일: module.exports = { parallel?: n, scenarios: [ {
     name, url?, now?: '2026-10-03T18:30:00+09:00'   // Date를 그 시각으로 속여요 (+07:00 현지 / +09:00 한국)
     w?, h?, dpr?, mobile?, dark?: bool,              // 폭·배율·다크 모드
     ua?: 'Mozilla/5.0 (iPhone; …)',                 // 사용자 에이전트(아이폰 링크 방식 시험 — scenarios/ios-apps.js)
     ls?: { 'danang26:key': '"json"' },               // 시작 localStorage (값은 JSON 문자열) — scenarios/_fake.js 의 ls()
     geo?: [lat, lng, acc?],                          // 위치 권한 + 가짜 GPS
     steps: [ { eval }, { click }, { tap }, { type: [sel, text] }, { key }, { swipe: [sel, dx, dy] },
              { geo: [lat, lng] }, { offline: bool }, { reload: true }, { wait: ms }, { waitFor: 'js 식', timeout? }, { shot: 'a.png', full? }, { tall: true, shot } ] } ] }
   주의: parallel > 1 이면 배경 탭의 타이머·rAF가 느려져요. 시간 민감한 판정은 parallel 1로. */
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');
const cfg = require(path.resolve(process.argv[2]));
const URL0 = process.env.QA_URL || 'http://localhost:8765/';
const CHROME = process.env.CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome'
].find(p => fs.existsSync(p));
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runScenario(b, sc){
  const ctx = await b.createBrowserContext();
  const page = await ctx.newPage();
  const w = sc.w || 390, url = sc.url || URL0;
  await page.setViewport({ width: w, height: sc.h || 844, deviceScaleFactor: sc.dpr || 2, isMobile: sc.mobile !== false && w < 768, hasTouch: sc.mobile !== false && w < 768 });
  /* 이 PC의 "동작 줄이기" 설정이 새어 들어오면 3D·애니메이션이 꺼져요 → 기본은 꺼짐으로 고정 */
  const feats = [{ name: 'prefers-reduced-motion', value: sc.reduce ? 'reduce' : 'no-preference' }];
  if (sc.dark != null) feats.push({ name: 'prefers-color-scheme', value: sc.dark ? 'dark' : 'light' });
  await page.emulateMediaFeatures(feats);
  if (sc.ua) await page.setUserAgent(sc.ua);   /* 아이폰 등 — 앱 바로가기 링크 방식(IS_IOS)을 볼 때 */
  const out = [], logs = [];
  page.on('console', m => { if (['error', 'warn', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => logs.push('pageerror: ' + e.message));
  if (sc.geo){
    await ctx.overridePermissions(new URL(url).origin, ['geolocation']);
    await page.setGeolocation({ latitude: sc.geo[0], longitude: sc.geo[1], accuracy: sc.geo[2] || 25 });
  }
  await page.evaluateOnNewDocument((ls, now) => {
    try { if (ls && !sessionStorage.getItem('__lsdone')) { for (const [k, v] of Object.entries(ls)) localStorage.setItem(k, v); sessionStorage.setItem('__lsdone', '1'); } } catch (e) {}
    if (now) {
      const off = Date.parse(now) - Date.now(), _D = Date;
      class FD extends _D { constructor(...a) { super(...(a.length ? a : [_D.now() + off])); } static now() { return _D.now() + off; } }
      window.Date = FD;
    }
  }, sc.ls || null, sc.now || null);
  try { await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }); }
  catch (e) { logs.push('goto: ' + e.message); }
  for (const st of (sc.steps || [])) {
    try {
      /* 순서: 준비(위치·오프라인·새로고침·기다리기) → 행동(eval·click …) → 찍기. 10/27 전에는 eval 이 reload·wait 보다 먼저 돌아서
         { reload: true, eval } 의 eval 이 새로고침 전 화면을 읽었다(PLAYBOOK 10절) */
      if (st.geo) await page.setGeolocation({ latitude: st.geo[0], longitude: st.geo[1], accuracy: st.geo[2] || 25 });
      if (st.offline !== undefined) await page.setOfflineMode(st.offline);
      if (st.reload) await page.reload({ waitUntil: st.reloadWait || 'domcontentloaded' });
      if (st.waitFor) await page.waitForFunction(st.waitFor, { timeout: st.timeout || 40000, polling: 250 });
      if (st.wait) await sleep(st.wait);
      if (st.eval) { const r = await page.evaluate(st.eval); if (r !== undefined) out.push(sc.name + ' > ' + (typeof r === 'string' ? r : JSON.stringify(r))); }
      if (st.click) await page.click(st.click);
      if (st.tap) await page.tap(st.tap);
      if (st.type) { await page.click(st.type[0]); await page.keyboard.type(st.type[1]); }
      if (st.key) await page.keyboard.press(st.key);
      if (st.swipe) {
        const [sel, dx, dy] = st.swipe;
        const box = await (await page.$(sel)).boundingBox();
        const x0 = box.x + box.width / 2, y0 = box.y + box.height / 2;
        await page.touchscreen.touchStart(x0, y0);
        for (let i = 1; i <= 8; i++) { await page.touchscreen.touchMove(x0 + dx * i / 8, y0 + (dy || 0) * i / 8); await sleep(16); }
        await page.touchscreen.touchEnd();
      }
      if (st.tall) {   /* 긴 화면: 1800px 씩 내려가며 여러 장 (name-1.png …). 한 장으로 길게 찍으면 GPU 타일 한도(8192px)에서 같은 내용이 반복된다 */
        const vp = page.viewport(), SEG = 1800;
        await page.setViewport(Object.assign({}, vp, { height: SEG })); await sleep(300);
        const hh = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0, n = 1; y < hh && n <= 8; y += SEG - 120, n++) {
          await page.evaluate(yy => window.scrollTo(0, yy), y); await sleep(200);
          await page.screenshot({ path: path.join(OUT, st.shot.replace('.png', '-' + n + '.png')) });
        }
        await page.evaluate(() => window.scrollTo(0, 0)); await page.setViewport(vp); await sleep(200);
      } else if (st.shot) await page.screenshot({ path: path.join(OUT, st.shot), fullPage: !!st.full });
    } catch (e) { logs.push('step: ' + e.message.split('\n')[0]); }
  }
  out.push(logs.length ? '[' + sc.name + ']\n  ' + logs.join('\n  ') : '[' + sc.name + '] no console errors');
  try { await ctx.close(); } catch (e) {}
  return out.join('\n');
}

(async () => {
  if (!CHROME) { console.error('크롬을 못 찾았어요. CHROME 환경변수로 경로를 알려 주세요.'); process.exit(1); }
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  const par = cfg.parallel || 1, list = cfg.scenarios.slice(), res = new Array(list.length);
  let i = 0;
  await Promise.all(Array.from({ length: par }, async () => {
    while (i < list.length) { const k = i++; try { res[k] = await runScenario(b, list[k]); } catch (e) { res[k] = '[' + list[k].name + '] FAILED ' + e.message; } }
  }));
  console.log(res.join('\n'));
  await b.close();
})();
