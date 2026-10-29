/* 폭 × 테마 × 화면 5개 전수 — 가로 넘침(scrollWidth > innerWidth)과 렌더를 봐요. 360 은 큰 글씨 보기도. wide = 화면 밖으로 삐져나간 요소 수(지도·앱 바로가기 줄·경로 그림 SVG 는 안에서 잘리므로 뺌)
   스크린샷은 fullPage 대신 뷰포트를 페이지 높이로 키운 한 장(유리+고정 배경은 fullPage 가 같은 내용을 반복해 찍는다 — 강화 PLAYBOOK 6절) */
const { ls, NS } = require('./_fake');
const views = ['plan', 'days', 'map', 'guide', 'places', 'log'];
/* 장소·기록은 더보기 아래 화면 — 더보기 바로 가기로 들어간다 */
const GO = v => v === 'places' || v === 'log' ? `document.querySelector('#dock [data-view=guide]').click(); document.querySelector('#moreMenu [data-go=${v === 'log' ? 'ck' : 'places'}]').click()` : `document.querySelector('#dock [data-view=${v}]').click()`;
const sizes = [[360, 780, 2], [390, 844, 2], [1280, 860, 1]];
const NOW = '2026-11-04T07:10:00+07:00';
const sc = [];
function add(name, w, h, dpr, theme, extra){
  const o = Object.assign({ theme }, extra || {});
  sc.push({ name, now: NOW, w, h, dpr, dark: theme === 'dark', ls: ls(NOW, { danang: [15, 20, 65, 70] }, o),
    steps: [{ wait: 800 }].concat(...views.map(v => [
      { eval: GO(v) },
      { wait: v === 'map' ? 6000 : 300, eval: `'${v} overflow=' + (document.documentElement.scrollWidth - innerWidth) + ' h=' + document.documentElement.scrollHeight + ' wide=' + [].slice.call(document.querySelectorAll('#v-${v} *')).filter(function(e){ var r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && !e.closest('#mapBox, .approw, svg.rmap'); }).length` },
      { shot: `w-${name}-${v}.png` },
      { tall: true, shot: `w-${name}-${v}-full.png` }
    ])) });
}
sizes.forEach(([w, h, dpr]) => ['light', 'dark'].forEach(t => add(`${w}-${t}`, w, h, dpr, t)));
add('360-big', 360, 780, 2, 'light', { big: true });
add('390-big-dark', 390, 844, 2, 'dark', { big: true });
module.exports = { parallel: 2, scenarios: sc };
