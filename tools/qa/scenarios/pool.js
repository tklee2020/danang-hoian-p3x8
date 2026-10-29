/* 나들이 칸 · 식당 고르기 (10/27 풀 → 10/30 고르기 시트) — flows.js 에도 들어가 있고 따로도 돌려요: node harness.js scenarios/pool.js
   보는 것: 시트에서 11/4 에 넣으면 11/5 후보에서 사라짐 · 빼면 돌아옴 · 새로고침 뒤 유지 · 호이안 칸에 다낭 플랜이 안 나옴 ·
            아기 컨디션 '쉬어야 함'이면 가벼운 것만 · 고른 플랜이 경로 그림에 반영 · 안 고른 칸은 「추천」 · 식당 고르기 ·
            아빠·엄마 폰만 고르기 버튼 · 360 폭 넘침 0 */
const { ls, NS } = require('./_fake');
const NL = 'String.fromCharCode(10)';
const F4 = '2026-11-04T07:10:00+07:00', H2 = '2026-11-02T07:00:00+07:00', PRE = '2026-10-27T21:00:00+09:00';
/* 시트 열기: 그 칸의 data-psheet 버튼을 눌러요(일정에 버튼이 없는 날도 열리게 임시 버튼) */
const PS = k => `(function(){ var b = document.createElement('button'); b.setAttribute('data-psheet', '${k}'); document.body.appendChild(b); b.click(); b.remove(); return 1; })()`;
const CLOSE = `(document.querySelector('[data-psx]') ? document.querySelector('[data-psx]').click() : 0)`;
const OPEN = `(function(){ var b, n = 0; while ((b = document.querySelector('#psBody [data-pkmore]')) && n++ < 20) b.click(); return 1; })()`;
const IDS = slot => `[].slice.call(document.querySelectorAll('#psBody [data-pick^="${slot}|"], #psBody [data-unpick="${slot}"]')).map(function(e){ var a = e.getAttribute('data-pick'); return a ? a.split('|')[1] : 'CUR'; })`;
const DAY = i => `document.querySelector('#dock [data-view=days]').click(); document.querySelector('#days [data-day="${i}"]').click()`;
const TL = `[].slice.call(document.querySelectorAll('#tl .ev')).map(function(e){ return e.querySelector('.tm').textContent + ' ' + e.querySelector('.ev-tt').textContent + (e.querySelector('.ev-t .rec') ? '(추천)' : '') + (e.querySelector('.ev-r') ? ' ' + e.querySelector('.ev-r').textContent : ''); }).join(' / ')`;
const ROUTE = `(function(){ var t = document.querySelector('#routeTile'); return t.hidden ? 'route hidden' : '[' + t.querySelector('.rcard .k').textContent + '] marks=' + [].slice.call(t.querySelectorAll('.rm-n')).map(function(e){ return e.textContent; }).join(','); })()`;
const OVF = `' overflow=' + (document.documentElement.scrollWidth - innerWidth)`;

const scenarios = [
  /* 11/4 오전에 린응사 → 11/5 오전 후보에서 사라짐 · 경로 그림 · 새로고침 유지 · 빼면 돌아옴 */
  { name: 'pool-pick', now: F4, w: 390, h: 844, ls: ls(F4, { danang: [10, 15, 65, 70] }, { theme: 'light' }), steps: [
    { wait: 900, eval: `${DAY(3)}; 'before: ' + ${TL} + ' | route=' + ${ROUTE}` },
    { eval: `${PS('s|2026-11-04:am')}; ${OPEN}; document.querySelector('[data-pick="2026-11-04:am|linhung"]').click(); 'picked: sheet=' + (document.querySelector('#psheet').hidden ? 'closed' : 'open') + ' | toast=' + document.querySelector('#toast').textContent + ' | ' + ${TL}` },
    { eval: `'after: route=' + ${ROUTE}` },
    { eval: `${PS('s|2026-11-05:am')}; ${OPEN}; var a = ${IDS('2026-11-05:am')}; ${CLOSE}; '11/5 am has linhung=' + (a.indexOf('linhung') >= 0) + ' (n=' + a.length + ')'` },
    { eval: `'stored=' + localStorage.getItem('${NS}pool')` },
    { reload: true, wait: 900 }, { eval: `${DAY(3)}; 'reload: ' + ${TL}` },
    { eval: `${PS('s|2026-11-04:am')}; ${OPEN}; var cur = document.querySelector('#psBody .cand.is-cur b').textContent; document.querySelector('[data-unpick="2026-11-04:am"]').click(); ${PS('s|2026-11-05:am')}; ${OPEN}; var a = ${IDS('2026-11-05:am')}; ${CLOSE}; 'unpicked: cur was=' + cur + ' | toast=' + document.querySelector('#toast').textContent + ' | 11/5 am has linhung=' + (a.indexOf('linhung') >= 0) + ' | ' + ${TL}` }
  ] },
  /* 호이안 칸(11/1 저녁·11/2 오전·저녁·11/3 오전)엔 호이안·공통 플랜만, 11/3 오후(다낭)엔 다낭·공통만 */
  { name: 'pool-hub', now: H2, w: 390, h: 844, ls: ls(H2, { hoian: [10, 15, 20, 30] }, { theme: 'light' }), steps: [
    { wait: 900, eval: `var o = [], bad = []; ['2026-11-01:eve', '2026-11-02:am', '2026-11-02:eve', '2026-11-03:am', '2026-11-03:pm'].forEach(function(k){ ${PS("s|' + k + '").replace(/^\(function\(\)\{ /, '(function(){ ')}; var b, n = 0; while ((b = document.querySelector('#psBody [data-pkmore]')) && n++ < 20) b.click();
        var ids = [].slice.call(document.querySelectorAll('#psBody [data-pick^="' + k + '|"]')).map(function(e){ return e.getAttribute('data-pick').split('|')[1]; });
        var hoi = k < '2026-11-03:b'; ids.forEach(function(id){ var ok = id === 'rest' || id === 'delivery' || (hoi ? /^h_/.test(id) : !/^h_/.test(id)); if (!ok) bad.push(k + ':' + id); });
        o.push(k + '=' + ids.join('/')); ${CLOSE}; }); o.join(' | ') + ' || wrong-hub=' + bad.length` }
  ] },
  /* 아기 컨디션: 쉬어야 함 → 가벼운 것만 · 보통 → 힘듦 숨김 · 좋음 → 전부 (기억) */
  { name: 'pool-baby', now: F4, w: 390, h: 844, ls: ls(F4, {}, { theme: 'light' }), steps: [
    { wait: 900, eval: `${PS('s|2026-11-04:am')}; ${OPEN}; 'good am n=' + ${IDS('2026-11-04:am')}.length` },
    { eval: `document.querySelector('[data-babyc=rest]').click(); ${OPEN}; var m = [].slice.call(document.querySelectorAll('#psBody .cand small')).map(function(e){ return e.textContent; }); 'rest: n=' + m.length + ' allEasy=' + m.every(function(t){ return /👶 가벼움/.test(t); }) + ' am=' + ${IDS('2026-11-04:am')}.join('/') + ' hidden=' + [].slice.call(document.querySelectorAll('#psBody .fine')).map(function(e){ return e.textContent; }).filter(function(t){ return /숨겼/.test(t); }).join(' / ')` },
    { eval: `document.querySelector('[data-babyc=ok]').click(); ${OPEN}; var m = [].slice.call(document.querySelectorAll('#psBody .cand small')).map(function(e){ return e.textContent; }); 'ok: n=' + m.length + ' noBig=' + m.every(function(t){ return !/👶 힘듦/.test(t); })` },
    { reload: true, wait: 900 }, { eval: `${PS('s|2026-11-04:am')}; 'reload pressed=' + document.querySelector('[data-babyc][aria-pressed=true]').textContent + ' stored=' + localStorage.getItem('${NS}babyc')` }
  ] },
  /* 식당 고르기: 11/3 17:00 저녁(랑·냐벱) · 11/2 저녁 칸(추천 플랜 안 식당) — 고르면 일정 줄에 🍽, 정하지 않기로 되돌림 */
  { name: 'pool-rest', now: H2, w: 390, h: 844, ls: ls(H2, {}, { theme: 'light' }), steps: [
    { wait: 900, eval: `${DAY(2)}; 'r-btns=' + [].slice.call(document.querySelectorAll('#tl [data-psheet^="r|"]')).map(function(e){ return e.getAttribute('data-psheet'); }).join(',')` },
    { eval: `${PS('r|2026-11-03@17:00')}; var o = [].slice.call(document.querySelectorAll('#psBody .prow b')).map(function(e){ return e.textContent; }), rv = [].slice.call(document.querySelectorAll('#psBody .prow__t > span')).map(function(e){ return e.textContent; }); 'opts=' + o.join('/') + ' | info=' + rv.join(' ; ') + ' | gl=' + document.querySelectorAll('#psBody a.mini[href*="google.com/maps"]').length` },
    { eval: `document.querySelector('[data-rpick="2026-11-03@17:00|d_nhabep"]').click(); 'picked toast=' + document.querySelector('#toast').textContent + ' | ' + ${TL}` },
    { shot: 'p-rest-tl.png' },
    { eval: `${PS('r|2026-11-02@16:30')}; 'eve opts=' + [].slice.call(document.querySelectorAll('#psBody .prow b')).map(function(e){ return e.textContent; }).join('/')` },
    { wait: 200, shot: 'p-rest-sheet.png' },
    { eval: `${CLOSE}; ${PS('r|2026-11-03@17:00')}; document.querySelector('[data-rpick="2026-11-03@17:00|"]').click(); ${DAY(2)}; 'cleared: ' + ${TL} + ' | stored=' + localStorage.getItem('${NS}pool')` }
  ] },
  /* 고르기는 아빠·엄마 폰만: 할머니·이모 폰엔 버튼이 없고, 시트도 안 열린다 */
  { name: 'pool-perm', now: H2, w: 390, h: 844, ls: ls(H2, {}, { theme: 'light', me: 'h', simple: true, big: true }), steps: [
    { wait: 900, eval: `${DAY(1)}; 'h: psheet-btns=' + document.querySelectorAll('[data-psheet]').length + ' | ' + ${TL}` },
    { eval: `${PS('s|2026-11-02:eve')}; 'h: sheet=' + (document.querySelector('#psheet').hidden ? 'closed' : 'OPEN')` }
  ] },
  { name: 'pool-perm-m', now: H2, w: 390, h: 844, ls: ls(H2, {}, { theme: 'light', me: 'm' }), steps: [
    { wait: 900, eval: `${DAY(1)}; 'm: psheet-btns=' + document.querySelectorAll('#tl [data-psheet]').length + ' hero=' + document.querySelectorAll('#hero [data-psheet]').length` }
  ] },
  /* 화면: 360 폭 시트(후보 펼침) — 낮 · 밤 큰 글씨 */
  { name: 'pool-360', now: F4, w: 360, h: 780, ls: ls(F4, { danang: [10, 15, 65, 70] }, { theme: 'light', pool: { '2026-11-04:eve': { p: 'd_thiago', t: Date.parse(F4) - 60000, by: 'm' } } }), steps: [
    { wait: 900, eval: `${PS('s|2026-11-04:am')}; document.querySelector('[data-pkopen="2026-11-04:am|linhung"]').click(); 'p360' + ${OVF} + ' wide=' + [].slice.call(document.querySelectorAll('#psBody *')).filter(function(e){ var r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1; }).length` },
    { wait: 200, shot: 'p-360-sheet.png' },
    { eval: `${CLOSE}; ${DAY(3)}; 'tl' + ${OVF}` }, { tall: true, shot: 'p-360-days.png' }
  ] },
  { name: 'pool-390-dark-big', now: F4, w: 390, h: 844, dark: true, ls: ls(F4, { danang: [80, 75, 65, 70] }, { theme: 'dark', big: true }), steps: [
    { wait: 900, eval: `${PS('s|2026-11-04:pm')}; 'dark-big' + ${OVF} + ' wide=' + [].slice.call(document.querySelectorAll('#psBody *')).filter(function(e){ var r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1; }).length` },
    { wait: 200, shot: 'p-390-dark-big.png' }
  ] },
  /* 출발 전: 일정 탭은 11/1 부터 · 11/1 저녁은 「추천」 · 더보기 → 날씨에 10/27 전망 표 */
  { name: 'pool-pre', now: PRE, w: 390, h: 844, ls: ls(PRE, {}, { theme: 'light' }), steps: [
    { wait: 900, eval: `document.querySelector('#dock [data-view=days]').click(); 'day=' + document.querySelector('#days [aria-pressed=true]').getAttribute('data-day') + ' | ' + ${TL}` },
    { eval: `document.querySelector('#dock [data-view=guide]').click(); document.querySelector('#moreMenu [data-go=flood]').click(); var c = document.querySelector('#outlookCard'); window.scrollTo(0, c.getBoundingClientRect().top + scrollY - 8); 'view=' + document.body.getAttribute('data-view') + ' rows=' + c.querySelectorAll('tr').length + ' links=' + c.querySelectorAll('a.lnk').length + ' fc=' + ((document.querySelector('#fcBox .note') || {}).textContent || '-') + ${OVF}` },
    { wait: 200, shot: 'p-outlook.png' }
  ] }
];
module.exports = { parallel: 1, scenarios };
