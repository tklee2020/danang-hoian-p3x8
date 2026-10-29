/* 아이폰(사파리 UA)에서 앱 바로가기가 어디로 열리는지 — ios id 가 있으면 앱스토어(→ 열기), 없으면 web.
   유리 이모 폰(me=a): 그랩·그랩푸드 → 앱스토어 647268330, 대한항공 없음(항공사 바로가기는 안 넣기로 — 사용자 10/29) */
const { ls } = require('./_fake');
const NOW = '2026-11-04T10:00:00+07:00';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1';
const q = `Array.prototype.map.call(document.querySelectorAll('#appRow a.app'), function(a){ return a.textContent.trim() + '=' + a.getAttribute('href').replace('https://', '').slice(0, 44); }).join(' | ')`;
module.exports = { parallel: 1, scenarios: [
  { name: 'ios-a', now: NOW, w: 390, h: 844, ua: IPHONE, ls: ls(NOW, {}, { me: 'a' }), steps: [{ wait: 900, eval: q }] },
  { name: 'ios-d', now: NOW, w: 390, h: 844, ua: IPHONE, ls: ls(NOW, {}, { me: 'd' }), steps: [{ wait: 900, eval: q }] }
] };
