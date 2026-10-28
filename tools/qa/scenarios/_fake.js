/* 시나리오용 가짜 데이터 — 페이지는 실제 예보를 "오늘부터 3일"만 받으므로, 시각을 여행 날짜로 속인 시험에서는 예보를 넣어 줘야 해요.
   wx(now, pattern): pattern = { hoian: [아침, 오전, 낮, 오후 비 확률 …], danang: [...] } (그날·다음 날·그다음 날 같은 값) */
const NS = 'danang26:';
function loc(startDate, probs){
  const time = [], pp = [], pr = [], wc = [], tt = [], dt = [], ss = [];
  for (let d = 0; d < 3; d++){
    const day = new Date(Date.parse(startDate + 'T00:00:00Z') + d * 86400000).toISOString().slice(0, 10);
    dt.push(day); ss.push(day + 'T17:17');
    for (let h = 0; h < 24; h++){
      const p = h < 6 ? (probs[4] || 10) : h < 9 ? probs[0] : h < 12 ? probs[1] : h < 15 ? probs[2] : h < 18 ? probs[3] : 30;
      time.push(day + 'T' + String(h).padStart(2, '0') + ':00'); pp.push(p); pr.push(p >= 60 ? 1.5 : p >= 35 ? 0.2 : 0); wc.push(p >= 60 ? 61 : p >= 35 ? 3 : 1); tt.push(24 + (h > 9 && h < 17 ? 3 : 0));
    }
  }
  return { hourly: { time, precipitation_probability: pp, precipitation: pr, weather_code: wc, temperature_2m: tt },
           daily: { time: dt, weather_code: dt.map(() => Math.max(...probs) >= 60 ? 61 : 2), temperature_2m_max: dt.map(() => 27), temperature_2m_min: dt.map(() => 23), precipitation_probability_max: dt.map(() => Math.max(...probs.slice(0, 4))), sunset: ss } };
}
function wx(now, pat){
  const date = new Date(Date.parse(now) + 7 * 3600000).toISOString().slice(0, 10);
  return JSON.stringify({ _t: Date.parse(now), L: { hoian: loc(date, pat.hoian || [20, 20, 30, 30]), danang: loc(date, pat.danang || [20, 20, 30, 30]) } });
}
const fx = now => JSON.stringify({ r: 0.0518, _t: Date.parse(now) });
/* 기본 ls: 예보·환율을 넣어 실제 API 를 안 부르게 */
function ls(now, pat, extra){
  const o = {}; o[NS + 'wx'] = wx(now, pat || {}); o[NS + 'fx'] = fx(now);
  o[NS + 'me'] = '"d"';   /* 처음 열면 「누구세요?」 창이 화면을 덮으므로 기본은 아빠 폰 — 창을 볼 땐 extra { me: null } */
  Object.keys(extra || {}).forEach(k => { o[NS + k] = JSON.stringify(extra[k]); });
  return o;
}
module.exports = { NS, wx, fx, ls };
