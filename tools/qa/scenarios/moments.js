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
  ['imo-night', '2026-11-04T20:30:00+07:00', SUN],                 /* 아기 재운 뒤 — 다음은 21:15 유리 이모 도착 */
  ['free-rainy', '2026-11-05T07:00:00+07:00', RAIN],
  ['last-night', '2026-11-06T20:00:00+07:00', SUN],                /* 귀국 날 체크 목록 */
  ['home-checkout', '2026-11-07T11:05:00+07:00', SUN],
  ['home-car', '2026-11-07T11:50:00+07:00', SUN],                  /* 유리 이모 비행기에 맞춘 11:45 차 */
  ['inflight-back', '2026-11-07T18:00:00+07:00', SUN],             /* 한국 날짜 기준으로 돌아옴 */
  ['landed', '2026-11-07T22:30:00+09:00', SUN],
  ['after', '2026-11-08T09:00:00+09:00', SUN],
  /* 유리 이모 폰(me=a) — 11/4 밤 합류 → 11/7 먼저 귀국: 출발 전 띠·지금/다음·끝이 이모 비행기 기준 */
  ['a-pre', '2026-11-02T10:00:00+07:00', SUN, { me: 'a' }],       /* 가족은 호이안, 이모는 아직 한국 → D-2 · 11/4 출발, DAY 안 뜸 */
  ['a-dday', '2026-11-04T16:00:00+09:00', SUN, { me: 'a' }],      /* 오늘 출발 · 18:15 WE201 */
  ['a-inflight', '2026-11-04T19:30:00+09:00', SUN, { me: 'a' }],  /* 지금 WE201 · 다음 21:15 도착 */
  ['a-joined', '2026-11-05T07:00:00+07:00', SUN, { me: 'a' }],    /* 합류 다음 날은 가족과 같은 일정 */
  ['a-home', '2026-11-07T13:00:00+07:00', SUN, { me: 'a' }],      /* 지금 공항 점심 · 다음 14:15 이모 출발 */
  ['a-back', '2026-11-07T17:00:00+07:00', SUN, { me: 'a' }],      /* 지금 이모 출발 · 다음 20:40 인천 T1 */
  ['a-after', '2026-11-07T22:30:00+09:00', SUN, { me: 'a' }],     /* 20:40 + 1시간 지나 끝 */
  ['who-first', '2026-10-29T09:00:00+09:00', SUN, { me: null }],  /* 처음 열면 누구인지 고르기 */
  /* 할아버지 폰(me=g) — 큰 글씨 + 간단히 보기, 본인 몫 할 일만 */
  ['g-pre', '2026-10-30T10:00:00+09:00', SUN, { me: 'g', simple: true, big: true }],
  ['g-free', '2026-11-04T07:00:00+07:00', SUN, { me: 'g', simple: true, big: true }],
  ['g-free-360', '2026-11-04T07:00:00+07:00', SUN, { me: 'g', simple: true, big: true }, 360],
  ['a-pre-ck', '2026-10-30T10:00:00+09:00', SUN, { me: 'a' }],    /* 이모 몫 할 일 수 */
  /* 본인 기준 호칭 — 같은 순간(11/4 20:30, 다음 = 21:15 이모 도착)을 사람마다: 아빠 「처제」(imo-night) · 엄마 「유리」 · 할머니 「유리」 */
  ['m-rel', '2026-11-04T20:30:00+07:00', SUN, { me: 'm' }],
  ['h-rel', '2026-11-04T20:30:00+07:00', SUN, { me: 'h', simple: true, big: true }],
  ['none-rel', '2026-11-04T20:30:00+07:00', SUN, { me: null }]
];
const q = `(function(){ var $=function(s){ return document.querySelector(s); }, NL=String.fromCharCode(10), t=function(s){ var e=$(s); return e ? e.innerText.split(NL).join(' / ') : '-'; };
  return $('#ddayPill').textContent + ' | ' + t('#ticker').slice(0, 90) + ' | now=' + (($('.is-now .ev-tt')||{}).textContent||'-') + ' | day=' + (($('#days [aria-pressed=true]')||{}).getAttribute ? $('#days [aria-pressed=true]').getAttribute('aria-label') : '-') +
    ' | clock=' + $('#ckL').textContent + '/' + $('#ckK').textContent + ' | stay=' + t('#stayTile .pill') + ' | ck=' + ($('#ckTile').hidden ? 'none' : t('#ckTile .pill')) + ' | fc=' + (($('.fc-head')||{}).textContent||'-') + ' | rec=' + document.querySelectorAll('.cand.is-rec').length +
    ' | stage=' + ($('#stage').hidden ? '-' : $('#stage').textContent) + ' | chip=' + (($('#chap .on') || {}).textContent || '-') + ' | route=' + ($('#routeTile').hidden ? '-' : document.querySelectorAll('#routeTile .rr').length + '줄') +
    ' | who=' + ($('#who').hidden ? '-' : 'open') + ' | me=' + (($('.whoBtn') || {}).textContent || '-') + ' | simple=' + document.documentElement.hasAttribute('data-simple') +
    ' | cks=' + document.querySelectorAll('#ckLists input[data-ck]').length + ' | memo=' + document.querySelectorAll('#memoBox [data-memo]').length +
    ' | p8=' + ((document.querySelector('[data-ck=p8]') || { closest: function(){ return null; } }).closest('label') || { textContent: '-' }).textContent.slice(0, 40) + ' | apps=' + Array.prototype.map.call(document.querySelectorAll('#appRow .app span'), function(e){ return e.textContent; }).filter(function(x){ return /Claude|Gemini/.test(x); }).join(',') +
    ' | overflow=' + (document.documentElement.scrollWidth - innerWidth); })()`;
module.exports = { parallel: 1, scenarios: M.map(([n, now, pat, extra, w]) => ({
  name: n, now, w: w || 390, h: w ? 780 : 844, ls: ls(now, pat, extra),
  steps: [{ wait: 900, eval: q }, { shot: `m-${n}.png` }]
})) };
