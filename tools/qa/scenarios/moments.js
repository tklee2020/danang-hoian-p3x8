/* 여행 중 "순간"마다 헤더(D-day·지금/다음)·오늘 강조·기준 숙소·체크 목록이 맞는지.
   시각은 +07:00(현지) 또는 +09:00(한국). 자정 전후·비행 중·숙소 바뀌는 12:00 을 꼭 본다 */
const { ls } = require('./_fake');
const SUN = { danang: [10, 15, 20, 30], hoian: [10, 15, 20, 30] }, RAIN = { danang: [80, 70, 65, 40], hoian: [80, 75, 60, 50] };
const M = [
  ['before', '2026-10-14T21:00:00+09:00', SUN],
  ['d-1-midnight-kst', '2026-10-31T00:30:00+09:00', SUN],          /* 한국 날짜 10/31 → D-1 (현지 날짜로 세면 D-2 가 되는 시각) */
  ['dday-incheon', '2026-11-01T08:30:00+09:00', SUN],
  ['inflight-out', '2026-11-01T12:30:00+09:00', SUN],
  ['arrived', '2026-11-01T14:30:00+07:00', SUN],
  ['hoian-dinner', '2026-11-01T17:20:00+07:00', SUN],
  ['before-midnight', '2026-11-01T23:50:00+07:00', SUN],
  ['after-midnight', '2026-11-02T00:10:00+07:00', SUN],
  ['oldtown-walk', '2026-11-02T08:30:00+07:00', RAIN],
  ['move-eve', '2026-11-02T19:10:00+07:00', SUN],                  /* 이동 날 체크 목록이 뜨는지 */
  ['move-before', '2026-11-03T11:55:00+07:00', SUN],               /* 아직 호이안 기준 */
  ['move-after', '2026-11-03T12:05:00+07:00', SUN],                /* 다낭 기준으로 바뀜 */
  ['free-sunny', '2026-11-04T07:00:00+07:00', SUN],
  ['free-rainy', '2026-11-05T07:00:00+07:00', RAIN],
  ['last-night', '2026-11-06T20:00:00+07:00', SUN],                /* 귀국 날 체크 목록 */
  ['home-checkout', '2026-11-07T11:05:00+07:00', SUN],
  ['home-car', '2026-11-07T13:05:00+07:00', SUN],
  ['inflight-back', '2026-11-07T18:00:00+07:00', SUN],             /* 한국 날짜 기준으로 돌아옴 */
  ['landed', '2026-11-07T22:30:00+09:00', SUN],
  ['after', '2026-11-08T09:00:00+09:00', SUN]
];
const q = `(function(){ var $=function(s){ return document.querySelector(s); }, NL=String.fromCharCode(10), t=function(s){ var e=$(s); return e ? e.innerText.split(NL).join(' / ') : '-'; };
  return $('#ddayPill').textContent + ' | ' + t('#ticker').slice(0, 90) + ' | now=' + (($('.is-now .ev-tt')||{}).textContent||'-') + ' | day=' + (($('#days [aria-pressed=true]')||{}).getAttribute ? $('#days [aria-pressed=true]').getAttribute('aria-label') : '-') +
    ' | clock=' + $('#ckL').textContent + '/' + $('#ckK').textContent + ' | stay=' + t('#stayTile .pill') + ' | ck=' + ($('#ckTile').hidden ? 'none' : t('#ckTile .pill')) + ' | fc=' + (($('.fc-head')||{}).textContent||'-') + ' | rec=' + document.querySelectorAll('.cand.is-rec').length +
    ' | stage=' + ($('#stage').hidden ? '-' : $('#stage').textContent) + ' | chip=' + (($('#chap .on') || {}).textContent || '-') + ' | route=' + ($('#routeTile').hidden ? '-' : document.querySelectorAll('#routeTile .rr').length + '줄') +
    ' | overflow=' + (document.documentElement.scrollWidth - innerWidth); })()`;
module.exports = { parallel: 1, scenarios: M.map(([n, now, pat]) => ({
  name: n, now, w: 390, h: 844, ls: ls(now, pat),
  steps: [{ wait: 900, eval: q }, { shot: `m-${n}.png` }]
})) };
