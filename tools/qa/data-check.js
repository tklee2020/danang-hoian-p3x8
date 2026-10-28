/* TRIP 데이터 정합성 — 브라우저 없이 index.html 의 const TRIP 만 읽어서 검사해요.
   사용: node data-check.js [../../index.html]
   잡는 것: 요일 오기, 시각 역전(한국 시각 tz:'K' 포함), 없는 장소·플랜 참조, 나들이 칸·기본 배치·플랜 값(10/27), 중복 id, 저장 접두어가 옛 여행 것인지,
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
/* 나들이 플랜 풀 (10/27): 플랜 값 · 칸(slot) · 칸마다 후보가 있는지 · 기본 배치(def)가 그 칸에 들어갈 수 있는지 */
const PLN = {}, T_HUB = Date.parse(TRIP.hubSwitchISO);
(TRIP.plans || []).forEach(p => {
  const w = '플랜 ' + p.id; uniq('plan:' + p.id, '플랜'); PLN[p.id] = p;
  if (!/^(hoian|danang|both)$/.test(p.area)) out.push(w + ': area');
  if (!Array.isArray(p.slots) || !p.slots.length || p.slots.some(x => !/^(am|pm|eve)$/.test(x))) out.push(w + ': slots');
  if (!/^(sun|rain|any)$/.test(p.w)) out.push(w + ': w');
  if (!/^(easy|normal|big)$/.test(p.baby)) out.push(w + ': baby');
  if (!p.dur || !(p.h >= 0) || !p.title || !p.sub) out.push(w + ': dur·h·title·sub');
  (p.places || []).forEach(k => need(k, w));
  (p.route || []).forEach(k => { need(k, w + ' route'); if (SP[k] && p.area !== 'both' && SP[k][1] !== p.area) out.push(w + ': route ' + k + ' 가 다른 지역'); });
  if (!Array.isArray(p.route) || (!p.route.length && (p.places || []).length)) out.push(w + ': route 없음 (경로 그림에 안 나와요)');
});
const NP = (TRIP.plans || []).length;
if (NP < 15 || NP > 40) out.push('플랜 수 ' + NP + ' — 15~40개로 (처음 15~25 → 10/27 재조사 합쳐 늘림)');
const slotSeen = {}, slotCnt = { hoian: 0, danang: 0 };
TRIP.days.forEach(d => d.items.forEach(it => {
  if (!it.slot) return;
  const key = d.date + ':' + it.slot, hub = at(d.date, it.t, it.tz) < T_HUB ? 'hoian' : 'danang';
  if (!/^(am|pm|eve)$/.test(it.slot)) out.push(key + ': slot 값');
  if (slotSeen[key]) out.push(key + ': 같은 칸이 두 번'); slotSeen[key] = 1; slotCnt[hub]++;
  if (it.k !== 'card') out.push(key + ': 칸 항목은 k:card');
  if (it.maxH != null && !(it.maxH > 0)) out.push(key + ': maxH');
  const fit = p => (p.area === hub || p.area === 'both') && p.slots.indexOf(it.slot) >= 0;
  if (!(TRIP.plans || []).some(fit)) out.push(key + ': 고를 플랜이 없어요');
  (it.def || []).forEach(id => { if (!PLN[id]) out.push(key + ': 기본 배치 ' + id + ' 없음'); else if (!fit(PLN[id])) out.push(key + ': 기본 배치 ' + id + ' 가 이 칸(' + hub + '·' + it.slot + ')에 안 맞아요'); });
}));
['2026-11-01:eve', '2026-11-02:am', '2026-11-02:eve', '2026-11-03:am', '2026-11-03:pm', '2026-11-04:am', '2026-11-04:pm', '2026-11-04:eve', '2026-11-05:am', '2026-11-05:pm', '2026-11-05:eve', '2026-11-06:am', '2026-11-06:pm', '2026-11-06:eve', '2026-11-07:am']
  .forEach(k => { if (!slotSeen[k]) out.push('나들이 칸 없음: ' + k); });
const OL = TRIP.outlook || {};
if (!/^\d{4}-\d\d-\d\d$/.test(OL.date || '') || !(OL.rows || []).length || !OL.short || !(OL.links || []).length || OL.links.some(l => !/^https:\/\//.test(l[1]))) out.push('outlook: 날짜·rows·short·links');
TRIP.flood.alt.places.forEach(k => need(k, '침수 대안'));
['hoian', 'danang'].forEach(h => need(TRIP.sos[h].show, '비상 ' + h));
Object.keys(TRIP.showVi || {}).forEach(k => need(k, 'showVi'));
TRIP.lists.forEach(l => l.groups.forEach(g => g.items.forEach(it => uniq('ck:' + it[0], '체크리스트'))));
TRIP.phrases.forEach(g => g.list.forEach(p => { uniq('ph:' + p[0], '표현'); if (!p[1] || !p[2]) out.push('표현 ' + p[0] + ': 빈 칸'); }));
TRIP.crew.forEach(c => uniq('crew:' + c.id, '사람'));
TRIP.days.forEach((d, di) => d.items.forEach(it => (it.only || []).forEach(id => { if (!TRIP.crew.some(c => c.id === id)) out.push(`D${di + 1} ${it.t}: only 에 없는 사람 ${id}`); })));
{ const ids = TRIP.crew.map(c => c.id), STR = [];
  (function walk(v){ if (typeof v === 'string') STR.push(v); else if (v && typeof v === 'object') Object.keys(v).forEach(k => walk(v[k])); })(TRIP);
  STR.forEach(S => {
    (S.match(/\{@[a-z](?::[^}]*)?\}/g) || []).forEach(t => { if (ids.indexOf(t.charAt(2)) < 0) out.push('호칭 ' + t + ': 없는 사람'); });
    const open = (S.match(/\[\[/g) || []).length, ok = S.match(/\[\[([a-z]):([^|\]]*)\|([^\]]*)\]\]/g) || [];
    if (open !== ok.length) out.push('본인/다른 사람 [[x:…|…]] 모양이 깨짐: ' + S.slice(0, 40));
    ok.forEach(t => { if (ids.indexOf(t.charAt(2)) < 0) out.push('호칭 ' + t.slice(0, 20) + ': 없는 사람'); });
  });
  Object.keys(TRIP.rel || {}).forEach(v => { if (ids.indexOf(v) < 0) out.push('rel: 없는 사람 ' + v); }); }
TRIP.crew.forEach(c => { const t = c.trip; if (!t) return; const a = ['departISO', 'arriveISO', 'backISO', 'endISO'].map(k => Date.parse(t[k]));
  if (a.some(isNaN) || !(a[0] < a[1] && a[1] < a[2] && a[2] < a[3])) out.push('crew ' + c.id + ': trip 시각 순서가 이상해요');
  if (!TRIP.days.some(d => d.date === t.start)) out.push('crew ' + c.id + ': trip.start 가 일정 날짜가 아니에요'); });
TRIP.meds.forEach(x => { if (!(x.gapH > 0 && x.maxDay > 0)) out.push('약 ' + x.id + ': 간격·횟수'); });
/* 디자인 D: 날짜 칩 아이콘 · 카드 대표 경로 · 짧은 이름 · 앱 바로가기 · 경로 그림 바탕(geo.js) */
TRIP.days.forEach(d => { if (!d.ic) out.push(d.date + ': 날짜 칩 아이콘(ic) 없음'); });
Object.keys(TRIP.short || {}).forEach(k => { need(k, 'short'); if (TRIP.short[k].length > 9) out.push('short ' + k + ': 9자 넘음'); });
(TRIP.apps || []).forEach(a => { uniq('app:' + a.n, '앱'); if (!/^https:\/\//.test(a.web || '')) out.push('앱 ' + a.n + ': web 주소'); if (a.and && !(a.and[0] === 'play' ? a.and.length === 2 : a.and.length === 3)) out.push('앱 ' + a.n + ': and 형식'); });
if (!(TRIP.apps || []).length) out.push('앱 바로가기(apps) 없음');
/* 숙소로 배달: 평점 기준(구글 4.2↑·리뷰 50↑), 배달K 가게 번호, 지역 */
const DL = (TRIP.delivery || {}).hubs || {};
if (!DL.hoian || !DL.danang) out.push('delivery.hubs 에 hoian·danang 이 있어야 해요');
Object.keys(DL).forEach(h => { if (!TRIP.hubs[h]) out.push('delivery: 없는 지역 ' + h); (DL[h].list || []).forEach(x => {
  uniq('dl:' + h + ':' + x.n, '배달');
  if (!(x.rate >= 4.2 && x.cnt >= 50)) out.push('배달 ' + x.n + ': 평점 기준 미달 ' + x.rate + '/' + x.cnt);
  if (!(x.shop > 0) || !(x.km > 0) || !x.menu || !x.baby || !x.pay || !x.hrs) out.push('배달 ' + x.n + ': 빈 칸');
}); });
const geoF = path.join(root, 'geo.js');
if (!fs.existsSync(geoF)) out.push('geo.js 없음 (경로 그림 바탕)');
else { const w = {}; try { new Function('window', fs.readFileSync(geoF, 'utf8'))(w); } catch (e) { out.push('geo.js: ' + e.message); }
  if (!w.GEO || !w.GEO.sea || !w.GEO.rivers) out.push('geo.js: window.GEO 형식');
  else if (!/OpenStreetMap/.test(fs.readFileSync(geoF, 'utf8').slice(0, 200))) out.push('geo.js: 첫 줄 OSM 출처 표기 없음'); }
if (!/OpenStreetMap contributors/.test(TRIP.footer)) out.push('footer: 경로 그림 OSM 출처 없음');
if (!fs.existsSync(path.join(root, 'fonts', 'Jua-ko.woff2')) || !fs.existsSync(path.join(root, 'fonts', 'LICENSE-Jua.txt'))) out.push('fonts/Jua-ko.woff2 · LICENSE-Jua.txt 없음');
const swS = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
['./geo.js', './fonts/Jua-ko.woff2'].forEach(f => { if (swS.indexOf("'" + f + "'") < 0) out.push('sw.js CORE 에 ' + f + ' 없음 (오프라인)'); });

/* spots ↔ research TSV */
const B = [[107.9, 15.75], [108.5, 16.25]];
const KINDS = ['stay', 'food', 'cafe', 'sight', 'kids', 'spa', 'med', 'mart', 'transit'];   /* index.html 의 SK 와 같게 — kids 는 10/27 */
TRIP.spots.forEach(r => { if (KINDS.indexOf(r[2]) < 0) out.push('spot ' + r[0] + ': 모르는 종류 ' + r[2]); });
const SKs = (html.match(/var SK = \{([^\n]*)\};/) || [])[1] || '';
KINDS.forEach(k => { if (SKs.indexOf(k + ':') < 0) out.push('SK 에 종류 ' + k + ' 없음 (지도·장소 아이콘)'); });
['PLK', 'mapFilt'].forEach(n => { const m2 = n === 'PLK' ? html.match(/var PLK = \[([^\]]*)\]/) : html.match(/\$\('#mapFilt'\)\.innerHTML = \[([^\]]*)\]/); if (!m2 || m2[1].indexOf("'kids'") < 0) out.push(n + ' 에 kids 없음'); });
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
note.push(`일정 ${TRIP.days.length}일 · 항목 ${TRIP.days.reduce((n, d) => n + d.items.length, 0)}개 · 장소 ${TRIP.spots.length}곳 · 플랜 ${NP}개 · 칸 호이안 ${slotCnt.hoian}·다낭 ${slotCnt.danang} · {?} ${q}개`);
const by = {}; (TRIP.plans || []).forEach(p => p.slots.forEach(x => { const k = p.area + '·' + x; by[k] = (by[k] || 0) + 1; }));
note.push('플랜 지역·시간대: ' + Object.keys(by).sort().map(k => k + ' ' + by[k]).join(' / '));
const byw = {}; (TRIP.plans || []).forEach(p => { const k = p.area + '·' + p.w; byw[k] = (byw[k] || 0) + 1; });
note.push('플랜 지역·날씨: ' + Object.keys(byw).sort().map(k => k + ' ' + byw[k]).join(' / '));
console.log((out.length ? out.join('\n') : '문제 없음') + '\n' + note.join('\n'));
process.exit(out.length ? 1 : 0);
