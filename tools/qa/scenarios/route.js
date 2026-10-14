/* 오늘 경로 — 그림 카드(오늘 탭)와 지도 탭 날짜 칩·번호 핀·점선. flows.js 에도 들어가 있고 따로도 돌려요: node harness.js scenarios/route.js
   보는 것: 번호·묶음("3·4" = 비스마켓·야시장), 먼 곳 화살표(11/1 공항 · 11/3 리버타운 · 11/7 공항), 이름표가 그림 밖으로 나가거나 서로 겹치지 않는지,
            지도 핀·이름표 겹침 0, 날짜 칩 켜기·끄기, 테마를 바꿔도 경로 선이 남는지, 오늘 계획을 바꾸면 경로도 바뀌는지 */
const { ls } = require('./_fake');
const NL = 'String.fromCharCode(10)';
const H2 = '2026-11-02T08:30:00+07:00', M3 = '2026-11-03T12:05:00+07:00', F4 = '2026-11-04T07:10:00+07:00', D1 = '2026-11-01T14:30:00+07:00', D7 = '2026-11-07T11:05:00+07:00', PRE = '2026-10-20T21:00:00+09:00';
const plan = { '2026-11-04': { cards: ['linhung'], time: '08:30', note: '', by: 'd', t: Date.parse(F4) - 600000 } };
/* 그림 카드: 점 글자 · 먼 곳 수 · 이름표 밖/겹침 · 줄 */
const CARD = `(function(){ var t = document.querySelector('#routeTile'); if (t.hidden) return 'route hidden';
  t.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12);
  var svg = t.querySelector('svg.rmap'); if (!svg) return 'no svg | ' + t.innerText.split(${NL}).join(' / ');
  var sb = svg.getBoundingClientRect(), L = [].slice.call(t.querySelectorAll('.rm-l, .rm-far rect, .rm-stop')).map(function(e){ return e.getBoundingClientRect(); }), out = 0, ov = 0;
  L.forEach(function(a, i){ if (a.left < sb.left - 1 || a.right > sb.right + 1 || a.top < sb.top - 1 || a.bottom > sb.bottom + 1) out++;
    L.slice(i + 1).forEach(function(b){ if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) ov++; }); });
  return '[' + t.querySelector('.rcard .k').textContent + '] marks=' + [].slice.call(t.querySelectorAll('.rm-n')).map(function(e){ return e.textContent; }).join(',') + ' far=' + [].slice.call(t.querySelectorAll('.rm-far text')).map(function(e){ return e.textContent; }).join(',') +
    ' out=' + out + ' overlap=' + ov + ' | ' + [].slice.call(t.querySelectorAll('.rr')).map(function(e){ return e.innerText.split(${NL}).join(' '); }).join(' / ') + ' | overflow=' + (document.documentElement.scrollWidth - innerWidth); })()`;
const toMap = `document.querySelector('#dock [data-view=map]').click(); 1`;
const mapReady = `window.__map && window.__map.loaded() && !window.__map.isMoving() && document.querySelectorAll('.rpin').length > 0`;
/* 지도: 핀 · 핀/이름표 겹침 · 선 · 칩 · 안내 줄 · 경로에 든 보통 핀이 숨었는지 */
const PINS = `(function(){ var box = document.querySelector('#mapBox').getBoundingClientRect(), p = [].slice.call(document.querySelectorAll('.rpin')).filter(function(e){ var r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; return x > box.left && x < box.right && y > box.top && y < box.bottom; });   /* 화면 밖(먼 숙소·공항) 핀은 빼고 */
  var R = p.map(function(e){ return e.querySelector('b').getBoundingClientRect(); }).concat(p.map(function(e){ return e.querySelector('span').getBoundingClientRect(); })), ov = 0, out = 0;
  R.forEach(function(a, i){ if (a.left < box.left || a.right > box.right || a.top < box.top || a.bottom > box.bottom) out++;
    R.slice(i + 1).forEach(function(b){ if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) ov++; }); });
  var src = __map.getSource('route'), f = src && src._data && src._data.features ? src._data.features.length : '?';
  return 'pins=' + p.map(function(e){ return e.innerText.split(${NL}).join(':'); }).join(', ') + ' overlap=' + ov + ' outside=' + out + ' layer=' + !!__map.getLayer('route') +
    ' zoom=' + __map.getZoom().toFixed(1) + ' chip=' + ((document.querySelector('#mapDays .on') || {}).textContent || '-') + ' routing=' + document.querySelector('#mapBox').classList.contains('routing') +
    ' | ' + document.querySelector('#mapRoute').innerText.split(${NL}).join(' '); })()`;
const scrollMap = `document.querySelector('#mapDays').scrollIntoView({ block: 'start' }); window.scrollBy(0, -10); 1`;

const scenarios = [
  /* 호이안 올드타운 날: 아침 한 번(내원교) + 해 질 녘(미노스파 → 비스마켓·야시장 묶음) */
  { name: 'route-hoian', now: H2, w: 390, h: 844, ls: ls(H2, {}, { theme: 'light' }), steps: [
    { wait: 1200, eval: `'chap=' + [].slice.call(document.querySelectorAll('#chap button')).map(function(b){ return b.className + ':' + b.innerText.split(${NL}).join(''); }).join(' ') + ' stage=' + document.querySelector('#stage').textContent + ' apps=' + document.querySelectorAll('#appRow a').length + ' font=' + document.fonts.check('16px Jua')` },
    { shot: 'r-hoian-top.png' },
    { eval: `document.querySelector('#chap [data-chap="2"]').click(); 'chap→day ' + document.querySelector('#days [aria-pressed=true]').getAttribute('aria-label') + ' view=' + document.body.getAttribute('data-view')` },
    { eval: CARD }, { wait: 300, shot: 'r-hoian-card.png' },
    { eval: `document.querySelector('#routeTile [data-rmgo]').click(); document.body.getAttribute('data-view')` },
    { waitFor: mapReady }, { wait: 2500, eval: scrollMap }, { eval: PINS }, { shot: 'r-hoian-map.png' },
    /* 11/3: 숙소를 여러 번 오가는 날 — 푸라마 주변만 보이고 리버타운은 "화면 밖" */
    { eval: `document.querySelector('[data-rmday="2026-11-03"]').click(); 1` }, { waitFor: mapReady }, { wait: 2500, eval: PINS }, { shot: 'r-move-map.png' },
    { eval: `document.querySelector('[data-rmall]').click(); 1` }, { wait: 2500, eval: `'all zoom=' + __map.getZoom().toFixed(1) + ' pins=' + document.querySelectorAll('.rpin').length` }, { shot: 'r-move-map-all.png' },
    /* 테마를 바꿔도 경로 선이 다시 그려지는지 */
    { eval: `document.querySelector('#themeBtn').click(); 1` }, { waitFor: `window.__map.loaded() && !!window.__map.getLayer('route')`, timeout: 30000 }, { wait: 2000, eval: PINS }, { shot: 'r-move-map-dark.png' },
    /* 같은 칩 한 번 더 = 끄기 → 보통 핀이 돌아온다 */
    { eval: `document.querySelector('[data-rmday="2026-11-03"]').click(); 'off routing=' + document.querySelector('#mapBox').classList.contains('routing') + ' pins=' + document.querySelectorAll('.rpin').length + ' note=' + document.querySelector('#mapRoute').hidden + ' mkVisible=' + [].slice.call(document.querySelectorAll('.mk')).filter(function(e){ return e.style.display !== 'none'; }).length + ' toast=' + document.querySelector('#toast').textContent` }
  ] },
  /* 11/3 이동 날, 360 폭 — 리버타운 화살표 + 나들이 두 줄 */
  { name: 'route-move-360', now: M3, w: 360, h: 780, ls: ls(M3, {}, { theme: 'light' }), steps: [{ wait: 1200, eval: CARD }, { wait: 300, shot: 'r-move-card-360.png' }] },
  /* 11/1 도착 날 — 공항 화살표 */
  { name: 'route-day1', now: D1, w: 390, h: 844, ls: ls(D1, {}, { theme: 'light' }), steps: [{ wait: 1200, eval: CARD }, { wait: 300, shot: 'r-day1-card.png' }] },
  /* 11/7 귀국 날 — 냐벱 → 공항 */
  { name: 'route-day7', now: D7, w: 390, h: 844, ls: ls(D7, {}, { theme: 'light' }), steps: [{ wait: 1200, eval: CARD }, { wait: 300, shot: 'r-day7-card.png' }] },
  /* 자유일: 계획이 없으면 기본 배치, 계획(린응사)을 정하면 그림·지도가 바뀐다 */
  { name: 'route-free', now: F4, w: 390, h: 844, ls: ls(F4, { danang: [10, 15, 65, 70] }, { theme: 'light' }), steps: [
    { wait: 1200, eval: CARD },
    { eval: `document.querySelector('[data-plancard=linhung]').click(); document.querySelector('#planForm button[type=submit]').click(); 1` },
    { wait: 300, eval: CARD }, { shot: 'r-free-card.png' },
    { eval: toMap }, { waitFor: mapReady }, { wait: 2500, eval: scrollMap }, { eval: PINS }, { shot: 'r-free-map.png' }
  ] },
  { name: 'route-free-dark', now: F4, w: 390, h: 844, dark: true, ls: ls(F4, {}, { theme: 'dark', plans: plan }), steps: [{ wait: 1200, eval: CARD }, { wait: 300, shot: 'r-free-card-dark.png' }] },
  /* 11/5 계획 없음: 기본 배치 "시내 반나절 또는 린응사" — 첫 장만 그리고 다른 쪽은 제목에 */
  { name: 'route-free-def', now: '2026-11-05T07:00:00+07:00', w: 390, h: 844, ls: ls('2026-11-05T07:00:00+07:00'), steps: [{ wait: 1200, eval: CARD }, { wait: 300, shot: 'r-free-def-card.png' }] },
  /* 출발 전: 경로 카드·DAY 표시 없음, 지도 칩도 꺼진 채 */
  { name: 'route-before', now: PRE, w: 390, h: 844, ls: ls(PRE), steps: [
    { wait: 1000, eval: `'route=' + document.querySelector('#routeTile').hidden + ' stage=' + document.querySelector('#stage').hidden + ' on=' + document.querySelectorAll('#chap .on').length + ' past=' + document.querySelectorAll('#chap .past').length` },
    { eval: toMap }, { wait: 500, eval: `'mapChipOn=' + document.querySelectorAll('#mapDays .on').length + ' note=' + document.querySelector('#mapRoute').hidden` }
  ] }
];
module.exports = { parallel: 1, scenarios };
