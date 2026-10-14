/* TRIP 데이터 정합성 — 브라우저 없이 index.html 의 const TRIP 만 읽어서 검사해요.
   사용: node data-check.js [../../index.html]
   잡는 것: 요일 오기, 시각 역전(한국 시각 tz:'K' 포함), 없는 장소·카드 참조, 중복 id, 저장 접두어가 옛 여행 것인지,
           spots 와 research TSV 불일치(평점·리뷰 수·좌표·이름), 좌표가 지도 범위 밖, 비행 시각과 일정 불일치, {?} 개수 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..');
const file = path.resolve(process.argv[2] || path.join(root, 'index.html'));
const html = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
const m = html.match(/const TRIP = (\{[\s\S]*?\n\});\n<\/script>/);
if (!m) { console.error('const TRIP = {...}; 블록을 못 찾았어요'); process.exit(1); }
const TRIP = eval('(' + m[1] + ')');
const out = [], note = [];
const WK = '일월화수목금토';
const at = (date, t, tz) => Date.parse(date + 'T' + t + ':00' + (tz === 'K' ? '+09:00' : '+07:00'));
const SP = {}; TRIP.spots.forEach(r => { if (SP[r[0]]) out.push('spots 중복 key ' + r[0]); SP[r[0]] = r; });
const need = (k, where) => { if (!SP[k]) out.push(where + ': 없는 장소 ' + k); };

/* 날짜·요일·시각 */
if (TRIP.days[0].date !== TRIP.start || TRIP.days[TRIP.days.length - 1].date !== TRIP.end) out.push('start/end 와 days 의 첫날·끝날이 달라요');
let prev = -Infinity, prevTag = '';
TRIP.days.forEach((d, di) => {
  const wd = WK[new Date(d.date + 'T12:00:00Z').getUTCDay()];
  if (d.label !== wd) out.push(`요일 오기: ${d.date} 는 ${wd} 인데 데이터는 ${d.label}`);
  if (di && Date.parse(d.date) - Date.parse(TRIP.days[di - 1].date) !== 86400000) out.push(`${d.date}: 앞 날짜와 하루 차이가 아니에요`);
  d.items.forEach(it => {
    const tag = `D${di + 1} ${it.t}${it.tz === 'K' ? '(한국)' : ''}`;
    if (!/^\d\d:\d\d$/.test(it.t) || (it.end && !/^\d\d:\d\d$/.test(it.end))) out.push(tag + ': 시각 형식');
    const a = at(d.date, it.t, it.tz);
    if (a < prev) out.push(`${tag}: 앞 일정(${prevTag})보다 이른 시각`);
    if (it.end && at(d.date, it.end, it.tz) <= a) out.push(tag + ': end 가 시작보다 이르거나 같아요');
    prev = a; prevTag = tag;
    if (!it.k || !it.title) out.push(tag + ': k 또는 title 없음');
    if (it.place) need(it.place, tag);
    (it.places || []).forEach(k => need(k, tag));
  });
  (d.def || []).forEach(c => { if (!TRIP.cards.some(x => x.id === c)) out.push(`${d.date}: 기본 카드 ${c} 없음`); });
});
/* 비행 시각 ↔ 일정 */
const find = (re) => { let r = null; TRIP.days.forEach(d => d.items.forEach(it => { if (re.test(it.title)) r = at(d.date, it.t, it.tz); })); return r; };
[[/KE457/, TRIP.departISO, 'KE457 출발'], [/다낭공항 T2 도착/, TRIP.arriveISO, '다낭 도착'], [/KE458/, TRIP.backISO, 'KE458 출발'], [/인천공항 T2 도착/, TRIP.endISO, '인천 도착']].forEach(([re, iso, name]) => {
  const t = find(re); if (t == null) out.push(name + ' 일정을 못 찾았어요'); else if (t !== Date.parse(iso)) out.push(`${name}: 일정 시각과 ${iso} 가 달라요`);
});
/* 숙소 · 카드 · 저녁 · 침수 · 비상 */
TRIP.stays.forEach(s => { need(s.key, '숙소'); if (!TRIP.hubs[s.hub] || TRIP.hubs[s.hub].stay !== s.key) out.push('숙소 ' + s.key + ': hubs 와 안 맞아요'); });
Object.keys(TRIP.hubs).forEach(h => { const s = SP[TRIP.hubs[h].stay]; if (s && (s[7] !== TRIP.hubs[h].ll[0] || s[8] !== TRIP.hubs[h].ll[1])) out.push('hub ' + h + ': 좌표가 숙소 spot 과 달라요'); });
const ids = {};
const uniq = (id, what) => { if (ids[id]) out.push('중복 id ' + id + ' (' + what + ')'); ids[id] = 1; };
TRIP.cards.forEach(c => { uniq('card:' + c.id, '카드'); if (!/^(sun|rain)$/.test(c.w)) out.push('카드 ' + c.id + ': w'); (c.places || []).forEach(k => need(k, '카드 ' + c.id)); });
TRIP.dinners.forEach(g => g.keys.forEach(k => need(k, '저녁 ' + g.name)));
TRIP.flood.alt.places.forEach(k => need(k, '침수 대안'));
['hoian', 'danang'].forEach(h => need(TRIP.sos[h].show, '비상 ' + h));
Object.keys(TRIP.showVi || {}).forEach(k => need(k, 'showVi'));
TRIP.lists.forEach(l => l.groups.forEach(g => g.items.forEach(it => uniq('ck:' + it[0], '체크리스트'))));
TRIP.phrases.forEach(g => g.list.forEach(p => { uniq('ph:' + p[0], '표현'); if (!p[1] || !p[2]) out.push('표현 ' + p[0] + ': 빈 칸'); }));
TRIP.crew.forEach(c => uniq('crew:' + c.id, '사람'));
TRIP.meds.forEach(x => { if (!(x.gapH > 0 && x.maxDay > 0)) out.push('약 ' + x.id + ': 간격·횟수'); });

/* spots ↔ research TSV */
const B = [[107.9, 15.75], [108.5, 16.25]];
TRIP.spots.forEach(r => { if (r[8] < B[0][0] || r[8] > B[1][0] || r[7] < B[0][1] || r[7] > B[1][1]) out.push('spot ' + r[0] + ': 좌표가 지도 범위 밖'); if (!TRIP.hubs[r[1]]) out.push('spot ' + r[0] + ': 지역'); });
const tsvFile = path.join(root, 'research', '2026-10-14-google-places.tsv');
if (fs.existsSync(tsvFile)){
  const L = fs.readFileSync(tsvFile, 'utf8').replace(/\r/g, '').split('\n').filter(l => l.trim()), H = L.shift().split('\t'), ix = n => H.indexOf(n);
  if (L.length !== TRIP.spots.length) out.push(`spots ${TRIP.spots.length}곳 ≠ TSV ${L.length}곳`);
  L.forEach(l => { const c = l.split('\t'), s = SP[c[ix('key')]];
    if (!s) { out.push('TSV 에만 있는 곳 ' + c[ix('key')]); return; }
    const want = [c[ix('area')], c[ix('kind')], c[ix('ko')], c[ix('gname')], c[ix('rating')] ? +c[ix('rating')] : null, +c[ix('reviews')] || 0, +c[ix('lat')], +c[ix('lng')], +c[ix('hub_km')], +c[ix('hub_line_m')], c[ix('addr')] || '', c[ix('phone')] || '', c[ix('note')] || ''];
    want.forEach((v, i) => { if (s[i + 1] !== v) out.push(`spot ${s[0]}: TSV 와 다름 (${H[[1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14][i]]}) ${JSON.stringify(s[i + 1])} ≠ ${JSON.stringify(v)}`); });
  });
} else note.push('research TSV 가 없어서 spots 대조는 건너뜀');

/* 저장 접두어 — 모든 여행이 같은 github.io 주소라 여행마다 달라야 해요 */
const ns = (html.match(/var NS = '([^']+)'/) || [])[1];
if (ns !== 'danang26:') out.push('NS 가 danang26: 이 아니에요: ' + ns);
['tokyoquest', 'ghcamp26', 'ghc-', 'tq-v'].forEach(old => { if (html.indexOf(old) >= 0 && !/도쿄판\(tokyoquest-\*\)/.test(html.slice(Math.max(0, html.indexOf(old) - 10), html.indexOf(old) + 20))) out.push('옛 여행 접두어가 남아 있어요: ' + old); });
(html.match(/localStorage\.getItem\('([^']+)'\)/g) || []).forEach(x => { if (x.indexOf("'danang26:") < 0) out.push('NS 를 안 거치는 저장 키: ' + x); });

/* 개인정보가 들어가면 안 되는 저장소 — 생년월일·주민번호 꼴 */
if (/20\d\d-\d\d-\d\d생|생년월일\s*[:：]\s*\d|\d{6}-\d{7}/.test(html)) out.push('생년월일·주민번호처럼 보이는 문자열이 있어요');

const q = (m[1].match(/\{\?[^}]*\}/g) || []).length;
note.push(`일정 ${TRIP.days.length}일 · 항목 ${TRIP.days.reduce((n, d) => n + d.items.length, 0)}개 · 장소 ${TRIP.spots.length}곳 · 카드 ${TRIP.cards.length}장 · {?} ${q}개`);
console.log((out.length ? out.join('\n') : '문제 없음') + '\n' + note.join('\n'));
process.exit(out.length ? 1 : 0);
