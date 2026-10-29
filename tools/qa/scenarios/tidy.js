/* 일정 정리 (10/30) — node harness.js scenarios/tidy.js
   보는 것: 식당을 고르면 그 식당 한 줄(추천 메뉴) + 그 장소만 · 「다른 일정으로 바꾸기」 · 첫날 추천 = QQ 저녁 → 강변 → 야시장 ·
            펼칠 게 없는 줄은 … 없이 다 보임 · 큰 글씨는 사람마다 따로 · 360 폭 넘침 0 */
const { ls } = require('./_fake');
const PRE = '2026-10-31T21:00:00+09:00', D1 = '2026-11-01T17:10:00+07:00';
const DAY = i => `document.querySelector('#dock [data-view=days]').click(); document.querySelector('#days [data-day="${i}"]').click()`;
const OPENALL = `[].slice.call(document.querySelectorAll('#tl .ev:not(.is-open) [data-ev]')).forEach(function(h){ h.click(); })`;
const TL = `[].slice.call(document.querySelectorAll('#tl .ev')).map(function(e){ return e.querySelector('.tm').textContent + ' ' + e.querySelector('.ev-tt').textContent + (e.querySelector('.ev-t .rec') ? '(추천)' : '') + (e.querySelector('.ev-r') ? ' [' + e.querySelector('.ev-r').textContent + ']' : ''); }).join(' / ')`;
const EV17 = `(function(){ var e = [].slice.call(document.querySelectorAll('#tl .ev')).filter(function(x){ return /17:00/.test(x.querySelector('.tm').textContent); })[0]; return 'memo=' + [].slice.call(e.querySelectorAll('.ev-m, .ev-ml li')).map(function(x){ return x.textContent; }).join(' | ') + ' || places=' + [].slice.call(e.querySelectorAll('.sprow b')).map(function(x){ return x.textContent; }).join(',') + ' || btns=' + [].slice.call(e.querySelectorAll('.btnrow .btn, .ev__a .mini')).map(function(x){ return x.textContent; }).join(','); })()`;
const CLIP = `'clipped=' + [].slice.call(document.querySelectorAll('#tl .ev-m')).filter(function(m){ return m.scrollHeight > m.clientHeight + 2; }).map(function(m){ return m.closest('.ev').querySelector('.tm').textContent + ' ' + m.closest('.ev').className; }).join(' ; ')`;
const OVF = `' overflow=' + (document.documentElement.scrollWidth - innerWidth)`;
const PICKED = { pool: { '2026-11-01:eve': { p: 'h_oldeats', t: 1, by: 'd' }, '2026-11-01@17:00': { p: 'h_qq', t: 2, by: 'd' } }, theme: 'dark' };
const BTN = (a, v) => `(function(){ var b = document.createElement('button'); b.setAttribute('${a}', '${v}'); document.body.appendChild(b); b.click(); b.remove(); return 1; })()`;
const BIG = `'big=' + document.documentElement.hasAttribute('data-big') + ' me=' + localStorage.getItem('danang26:me') + ' bigBy=' + localStorage.getItem('danang26:bigBy')`;

module.exports = { parallel: 3, scenarios: [
  { name: 'tidy-picked', now: D1, w: 390, h: 844, ls: ls(D1, {}, PICKED), steps: [
    { wait: 900, eval: `${DAY(0)}; ${TL}` },
    { eval: `${CLIP}` },
    { eval: `${OPENALL}; ${EV17}` },
    { eval: OVF },
    { tall: true, shot: 'tidy-picked-390-dark.png' }
  ] },
  { name: 'tidy-rec', now: PRE, w: 360, h: 800, ls: ls(PRE, {}, { theme: 'light' }), steps: [
    { wait: 900, eval: `${DAY(0)}; ${TL}` },
    { eval: `${OPENALL}; ${EV17}` },
    { eval: `${CLIP} + ${OVF}` },
    { tall: true, shot: 'tidy-rec-360-light.png' }
  ] },
  { name: 'tidy-days', now: PRE, w: 390, h: 844, ls: ls(PRE, {}, { theme: 'light' }), steps: [
    { wait: 900, eval: `${DAY(6)}; ${OPENALL}; ${TL} + ' || ' + [].slice.call(document.querySelectorAll('#tl .ev-m, #tl .ev-ml li')).map(function(x){ return x.textContent; }).join(' | ')` },
    { tall: true, shot: 'tidy-day7-390.png' }
  ] },
  { name: 'tidy-big', now: PRE, w: 390, h: 844, ls: ls(PRE, {}, { theme: 'light' }), steps: [
    { wait: 900, eval: `'d start ' + ${BIG}` },
    { eval: `${BTN("data-bigtoggle", "")}; ${BIG}` },
    { eval: `${BTN("data-whoset", "g")}` }, { wait: 1200, eval: `'g ' + ${BIG}` },
    { eval: `${BTN("data-bigtoggle", "")}; ${BIG}` },
    { eval: `${BTN("data-whoset", "m")}` }, { wait: 1200, eval: `'m (처음) ' + ${BIG}` },
    { eval: `${BTN("data-whoset", "d")}` }, { wait: 1200, eval: `'d (돌아옴) ' + ${BIG}` },
    { eval: `${BTN("data-whoset", "g")}` }, { wait: 1200, eval: `'g (돌아옴) ' + ${BIG}` }
  ] }
] };
