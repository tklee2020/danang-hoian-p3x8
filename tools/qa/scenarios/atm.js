/* 🏧 ATM 종류(장소 칩·지도 필터) · 공략집 「환전·현금」 카드 · 토스 바로가기 — 10/29 */
const { ls } = require('./_fake');
const NOW = '2026-11-01T14:30:00+07:00';
const sc = [];
[[360, 780, 'light'], [390, 844, 'dark']].forEach(([w, h, theme]) => sc.push({ name: `atm-${w}`, now: NOW, w, h, dpr: 2, dark: theme === 'dark', ls: ls(NOW, { danang: [15, 20, 65, 70] }, { theme }),
  steps: [{ wait: 800 },
    { eval: `document.querySelector('#dock [data-view=places]').click(); document.querySelector('[data-plarea=danang]').click(); document.querySelector('[data-plkind=atm]').click(); document.querySelector('#plTile .th').textContent + ' | ' + [].slice.call(document.querySelectorAll('#plTile h3')).map(function(e){ return e.textContent; }).join(' / ') + ' | overflow=' + (document.documentElement.scrollWidth - innerWidth)` },
    { shot: `atm-${w}-places.png` },
    { eval: `document.querySelector('[data-plarea=hoian]').click(); document.querySelector('[data-plkind=atm]').click(); [].slice.call(document.querySelectorAll('#plTile h3')).map(function(e){ return e.textContent; }).join(' / ')` },
    { eval: `document.querySelector('#dock [data-view=guide]').click(); var d = document.querySelectorAll('#guide details'); var t = [].slice.call(d).filter(function(x){ return /환전/.test(x.querySelector('summary').textContent); })[0]; t.open = true; t.scrollIntoView(); 'tip li=' + t.querySelectorAll('li').length + ' apps=' + [].slice.call(document.querySelectorAll('#appsSec .appi b')).map(function(e){ return e.textContent; }).join(',') + ' | overflow=' + (document.documentElement.scrollWidth - innerWidth)` },
    { shot: `atm-${w}-tip.png` },
    { eval: `document.querySelector('#dock [data-view=plan]').click(); var e = [].slice.call(document.querySelectorAll('#v-plan li, #v-plan p')).filter(function(x){ return /500만 동/.test(x.textContent); })[0]; e ? (e.scrollIntoView({ block: 'center' }), e.textContent) : 'none'` },
    { shot: `atm-${w}-day1.png` },
    { eval: `document.querySelector('#dock [data-view=map]').click(); 1` },
    { wait: 6000, eval: `document.querySelector('[data-maparea=danang]').click(); document.querySelector('[data-mapf=atm]').click(); 'atm visible=' + [].slice.call(document.querySelectorAll('.mk--atm')).filter(function(e){ return e.style.display !== 'none'; }).length + ' | overflow=' + (document.documentElement.scrollWidth - innerWidth)` },
    { wait: 1500, shot: `atm-${w}-map.png` }
  ] }));
module.exports = { parallel: 2, scenarios: sc };
