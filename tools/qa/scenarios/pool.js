/* 나들이 플랜 풀 (10/27) — flows.js 에도 들어가 있고 따로도 돌려요: node harness.js scenarios/pool.js
   보는 것: 11/4 에 고르면 11/5 목록에서 사라짐 · 되돌리면 돌아옴 · 새로고침 뒤 유지 · 호이안 칸에 다낭 플랜이 안 나옴 ·
            아기 컨디션 '쉬어야 함'이면 가벼운 것만 · 고른 플랜이 오늘 경로 그림에 반영 · 360 폭 넘침 0 */
const { ls, NS } = require('./_fake');
const NL = 'String.fromCharCode(10)';
const F4 = '2026-11-04T07:10:00+07:00', H2 = '2026-11-02T07:00:00+07:00', PRE = '2026-10-27T21:00:00+09:00';
/* 그 날짜의 모든 칸 후보를 펼친 뒤 넣기 버튼의 플랜 id */
const OPEN = `(function(){ var b, n = 0; while ((b = document.querySelector('[data-pkmore]')) && n++ < 20) b.click(); return 1; })()`;
const IDS = slot => `[].slice.call(document.querySelectorAll('#planTile [data-pick^="${slot}|"]')).map(function(e){ return e.getAttribute('data-pick').split('|')[1]; })`;
const PKD = d => `document.querySelector('[data-pkd="${d}"]').click()`;
const ROUTE = `(function(){ var t = document.querySelector('#routeTile'); return t.hidden ? 'route hidden' : '[' + t.querySelector('.rcard .k').textContent + '] marks=' + [].slice.call(t.querySelectorAll('.rm-n')).map(function(e){ return e.textContent; }).join(',') + ' rows=' + [].slice.call(t.querySelectorAll('.rr')).map(function(e){ return e.innerText.split(${NL}).join(' '); }).join(' / '); })()`;
const OVF = `' overflow=' + (document.documentElement.scrollWidth - innerWidth)`;

const scenarios = [
  /* 11/4 오전에 린응사 → 11/5 오전 목록에서 사라짐 · 경로 그림 · 새로고침 유지 · 빼면 돌아옴 */
  { name: 'pool-pick', now: F4, w: 390, h: 844, ls: ls(F4, { danang: [10, 15, 65, 70] }, { theme: 'light' }), steps: [
    { wait: 900, eval: `'before: route=' + ${ROUTE}` },
    { eval: `document.querySelector('[data-pick="2026-11-04:am|linhung"]').click(); 'picked=' + document.querySelector('#slot-2026-11-04-am .pick b').textContent + ' | toast=' + document.querySelector('#toast').textContent + ' | chip=' + document.querySelector('[data-pkd="2026-11-04"] i').textContent` },
    { eval: `'after: route=' + ${ROUTE}` },
    { eval: `${PKD('2026-11-05')}; ${OPEN}; var a = ${IDS('2026-11-05:am')}; '11/5 am has linhung=' + (a.indexOf('linhung') >= 0) + ' (n=' + a.length + ') | pool used=' + [].slice.call(document.querySelectorAll('#cardsTile .used')).map(function(e){ return e.textContent; }).join(',')` },
    { eval: `'stored=' + localStorage.getItem('${NS}pool')` },
    { reload: true, wait: 900 }, { eval: `'reload: 11/4 am=' + ((document.querySelector('#slot-2026-11-04-am .pick b') || {}).textContent || '-') + ' | tl=' + [].slice.call(document.querySelectorAll('#tl .ev-tt')).map(function(e){ return e.textContent; }).filter(function(t){ return /오전/.test(t); }).join(',')` },
    { eval: `document.querySelector('[data-unpick="2026-11-04:am"]').click(); ${PKD('2026-11-05')}; ${OPEN}; var a = ${IDS('2026-11-05:am')}; 'unpicked: toast=' + document.querySelector('#toast').textContent + ' | 11/5 am has linhung=' + (a.indexOf('linhung') >= 0) + ' | route=' + ${ROUTE}` }
  ] },
  /* 호이안 칸(11/1 저녁·11/2 오전·저녁·11/3 오전)엔 호이안·공통 플랜만, 11/3 오후(다낭)엔 다낭·공통만 */
  { name: 'pool-hub', now: H2, w: 390, h: 844, ls: ls(H2, { hoian: [10, 15, 20, 30] }, { theme: 'light' }), steps: [
    { wait: 900, eval: `var o = [], bad = []; ['2026-11-01:eve', '2026-11-02:am', '2026-11-02:eve', '2026-11-03:am', '2026-11-03:pm'].forEach(function(k){ document.querySelector('[data-pkd="' + k.slice(0, 10) + '"]').click(); var b, n = 0; while ((b = document.querySelector('[data-pkmore]')) && n++ < 20) b.click();
        var ids = [].slice.call(document.querySelectorAll('#planTile [data-pick^="' + k + '|"]')).map(function(e){ return e.getAttribute('data-pick').split('|')[1]; });
        var hoi = k < '2026-11-03:b'; ids.forEach(function(id){ var ok = id === 'rest' || id === 'delivery' || (hoi ? /^h_/.test(id) : !/^h_/.test(id)); if (!ok) bad.push(k + ':' + id); });
        o.push(k + '=' + ids.join('/')); }); o.join(' | ') + ' || wrong-hub=' + bad.length` }
  ] },
  /* 아기 컨디션: 쉬어야 함 → 가벼운 것만 · 보통 → 힘듦 숨김 · 좋음 → 전부 (기억) */
  { name: 'pool-baby', now: F4, w: 390, h: 844, ls: ls(F4, {}, { theme: 'light' }), steps: [
    { wait: 900, eval: `${OPEN}; 'good am n=' + ${IDS('2026-11-04:am')}.length` },
    { eval: `document.querySelector('[data-babyc=rest]').click(); ${OPEN}; var m = [].slice.call(document.querySelectorAll('#planTile .cand small')).map(function(e){ return e.textContent; }); 'rest: n=' + m.length + ' allEasy=' + m.every(function(t){ return /👶 가벼움/.test(t); }) + ' am=' + ${IDS('2026-11-04:am')}.join('/') + ' hidden=' + [].slice.call(document.querySelectorAll('#planTile .fine')).map(function(e){ return e.textContent; }).filter(function(t){ return /숨겼/.test(t); }).join(' / ')` },
    { eval: `document.querySelector('[data-babyc=ok]').click(); ${OPEN}; var m = [].slice.call(document.querySelectorAll('#planTile .cand small')).map(function(e){ return e.textContent; }); 'ok: n=' + m.length + ' noBig=' + m.every(function(t){ return !/👶 힘듦/.test(t); })` },
    { reload: true, wait: 900 }, { eval: `'reload pressed=' + document.querySelector('[data-babyc][aria-pressed=true]').textContent + ' stored=' + localStorage.getItem('${NS}babyc')` }
  ] },
  /* 화면: 360 폭에서 칸·후보 펼침·고른 칸·풀 목록 — 낮/밤 · 큰 글씨 */
  { name: 'pool-360', now: F4, w: 360, h: 780, ls: ls(F4, { danang: [10, 15, 65, 70] }, { theme: 'light', pool: { '2026-11-04:eve': { p: 'd_thiago', t: Date.parse(F4) - 60000, by: 'm' } } }), steps: [
    { wait: 900, eval: `document.querySelector('[data-pkopen="2026-11-04:am|linhung"]').click(); document.querySelector('#planTile').scrollIntoView(); 'p360' + ${OVF}` },
    { tall: true, shot: 'p-360-plan.png' },
    { eval: `document.querySelector('#cardsTile').scrollIntoView(); 'cards' + ${OVF}` }, { wait: 200, shot: 'p-360-pool.png' }
  ] },
  { name: 'pool-390-dark-big', now: F4, w: 390, h: 844, dark: true, ls: ls(F4, { danang: [80, 75, 65, 70] }, { theme: 'dark', big: true }), steps: [
    { wait: 900, eval: `document.querySelector('#planTile').scrollIntoView(); 'dark-big' + ${OVF} + ' wide=' + [].slice.call(document.querySelectorAll('#planTile *, #cardsTile *')).filter(function(e){ var r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1; }).length` },
    { wait: 200, shot: 'p-390-dark-big.png' }
  ] },
  /* 출발 전: 고르기 날짜는 11/1 부터 · 예보 타일에 10/27 전망 한 줄 · 공략집에 전망 표 */
  { name: 'pool-pre', now: PRE, w: 390, h: 844, ls: ls(PRE, {}, { theme: 'light' }), steps: [
    { wait: 900, eval: `'pkd=' + document.querySelector('[data-pkd][aria-pressed=true]').getAttribute('data-pkd') + ' first=' + ((document.querySelector('#planTile .cand b') || {}).textContent || '-') + ' tag=' + ((document.querySelector('#planTile .cand .tag') || {}).textContent || '-') + ' | fc=' + ((document.querySelector('#fcTile .note') || {}).textContent || '-')` },
    { eval: `document.querySelector('#fcTile [data-go=outlook]').click(); var c = document.querySelector('#outlookCard'); window.scrollTo(0, c.getBoundingClientRect().top + scrollY - 8); 'view=' + document.body.getAttribute('data-view') + ' rows=' + c.querySelectorAll('tr').length + ' links=' + c.querySelectorAll('a.lnk').length + ${OVF}` },
    { wait: 200, shot: 'p-outlook.png' }
  ] }
];
module.exports = { parallel: 1, scenarios };
