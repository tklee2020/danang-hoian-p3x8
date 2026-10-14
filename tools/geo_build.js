/* OSM 해안선·강(Overpass 응답)을 "오늘 경로" 그림 카드용 단순 도형으로 — 결과는 저장소 맨 위 geo.js (window.GEO)
   데이터: © OpenStreetMap contributors (ODbL) — 그림 카드 아래·공략집 맨 아래에 출처를 적어 둔다
   사용: node tools/geo_build.js <coast.json> <river.json> [water.json]
   받는 법 예시(시안 때 쓴 질의는 기록이 없어 다시 적음 · overpass-turbo.eu, 상자 = 아래 B):
     coast.json : [out:json];way["natural"="coastline"](15.84,108.18,16.16,108.42);out geom;
     river.json : [out:json];way["waterway"="river"](15.84,108.18,16.16,108.42);out geom;
     water.json : [out:json];relation["natural"="water"]["water"="river"](15.84,108.18,16.16,108.42);out geom;
   해안선: 조각을 끝-시작으로 이어 붙인 뒤, 바다는 진행 방향 오른쪽(OSM 규칙: 땅이 왼쪽) → 상자 경계를 시계 방향으로 돌아 닫는다.
   닫힌 조각(섬)은 땅으로 따로. 강: 이름 있는 큰 강만 폭을 주고 나머지는 가늘게. Douglas-Peucker 로 약 15m 단위까지 줄인다 */
const fs = require('fs');
const path = require('path');
const [coastF, riverF, waterF] = process.argv.slice(2);
const B = { s: 15.84, n: 16.16, w: 108.18, e: 108.42 };
const R = 6371000, rad = d => d * Math.PI / 180, K = Math.cos(rad(16));
const xy = p => [(p[1] - B.w) * K * R * Math.PI / 180, (B.n - p[0]) * R * Math.PI / 180];   /* m, 위가 0 */
function dp(pts, tol){
  if (pts.length < 3) return pts;
  /* 닫힌 고리는 시작=끝이라 기준선 길이가 0 — 가장 먼 점에서 둘로 나눠 줄인다 */
  if (pts.length > 3 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]){
    const p0 = xy(pts[0]); let far = 1, fd = -1;
    pts.forEach((p, i) => { const q = xy(p), d = Math.hypot(q[0] - p0[0], q[1] - p0[1]); if (d > fd){ fd = d; far = i; } });
    return dp(pts.slice(0, far + 1), tol).concat(dp(pts.slice(far), tol).slice(1));
  }
  const P = pts.map(xy), keep = new Array(pts.length).fill(false); keep[0] = keep[pts.length - 1] = true;
  const st = [[0, pts.length - 1]];
  while (st.length){
    const [a, b] = st.pop(); let mx = -1, mi = -1;
    const [ax, ay] = P[a], [bx, by] = P[b], L = Math.hypot(bx - ax, by - ay) || 1;
    for (let i = a + 1; i < b; i++){ const d = Math.abs((bx - ax) * (ay - P[i][1]) - (ax - P[i][0]) * (by - ay)) / L; if (d > mx){ mx = d; mi = i; } }
    if (mx > tol){ keep[mi] = true; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((p, i) => keep[i]);
}
const r4 = p => [+p[0].toFixed(4), +p[1].toFixed(4)];
const coast = JSON.parse(fs.readFileSync(coastF, 'utf8')).elements.map(e => e.geometry.map(g => [g.lat, g.lon]));
const key = p => p[0].toFixed(7) + ',' + p[1].toFixed(7);
/* 잇기 */
const ways = coast.slice(), islands = [], chains = [];
const closed = w => key(w[0]) === key(w[w.length - 1]);
ways.filter(closed).forEach(w => islands.push(w));
let open = ways.filter(w => !closed(w));
while (open.length){
  let ch = open.shift(), grew = true;
  while (grew){
    grew = false;
    for (let i = 0; i < open.length; i++){
      const w = open[i];
      if (key(w[0]) === key(ch[ch.length - 1])){ ch = ch.concat(w.slice(1)); open.splice(i, 1); grew = true; break; }
      if (key(w[w.length - 1]) === key(ch[0])){ ch = w.concat(ch.slice(1)); open.splice(i, 1); grew = true; break; }
    }
  }
  if (closed(ch)) islands.push(ch); else chains.push(ch);
}
/* 상자 밖 점은 잘라 낸다 — 상자 안에 든 가장 긴 구간만 */
const inB = p => p[0] >= B.s && p[0] <= B.n && p[1] >= B.w && p[1] <= B.e;
const segs = [];
chains.forEach(ch => { let cur = []; ch.forEach(p => { if (inB(p)) cur.push(p); else { if (cur.length > 1) segs.push(cur); cur = []; } }); if (cur.length > 1) segs.push(cur); });
segs.sort((a, b) => b.length - a.length);
const main = segs[0];
/* 경계 위치(시계 방향 둘레 거리): 위(서→동) → 오른쪽(북→남) → 아래(동→서) → 왼쪽(남→북) */
const W = B.e - B.w, H = B.n - B.s;
function snap(p){
  const d = [[Math.abs(p[0] - B.n), 'n'], [Math.abs(p[1] - B.e), 'e'], [Math.abs(p[0] - B.s), 's'], [Math.abs(p[1] - B.w), 'w']].sort((a, b) => a[0] - b[0])[0][1];
  return d === 'n' ? [B.n, p[1]] : d === 'e' ? [p[0], B.e] : d === 's' ? [B.s, p[1]] : [p[0], B.w];
}
function per(p){ if (p[0] === B.n) return p[1] - B.w; if (p[1] === B.e) return W + (B.n - p[0]); if (p[0] === B.s) return W + H + (B.e - p[1]); return 2 * W + H + (p[0] - B.s); }
const corners = [[B.n, B.e], [B.s, B.e], [B.s, B.w], [B.n, B.w]], cPer = [W, W + H, 2 * W + H, 2 * W + 2 * H];
const exitP = snap(main[main.length - 1]), entryP = snap(main[0]);
const sea = main.slice(); sea.push(exitP);
let a = per(exitP), b = per(entryP); if (b <= a) b += 2 * (W + H);
cPer.concat(cPer.map(c => c + 2 * (W + H))).forEach((c, i) => { if (c > a && c < b) sea.push(corners[i % 4]); });
sea.push(entryP);
const out = {
  box: B,
  sea: dp(sea, 15).map(r4),
  islands: islands.filter(w => w.some(inB) && w.length > 4).map(w => dp(w, 15).map(r4)),
  rivers: []
};
const BIG = { 'Sông Thu Bồn': 40, 'Sông Hàn': 320, 'Sông Cổ Cò': 60, 'Sông Đô Toả': 80, 'Sông Vĩnh Điện': 120, 'Sông Cẩm Lệ': 160 };
JSON.parse(fs.readFileSync(riverF, 'utf8')).elements.forEach(e => {
  const nm = e.tags.name || '', pts = e.geometry.map(g => [g.lat, g.lon]);
  out.rivers.push({ w: BIG[nm] || 40, n: nm, p: dp(pts, 15).map(r4) });
});
/* 강물 면: relation(natural=water, water=river) 의 outer·inner 조각을 고리로 이어 붙여 evenodd 로 그린다 */
function rings(parts){
  let open = parts.slice(), out = [];
  while (open.length){
    let ch = open.shift(), grew = true;
    while (grew && !closed(ch)){
      grew = false;
      for (let i = 0; i < open.length; i++){
        const w = open[i];
        if (key(w[0]) === key(ch[ch.length - 1])){ ch = ch.concat(w.slice(1)); open.splice(i, 1); grew = true; break; }
        if (key(w[w.length - 1]) === key(ch[ch.length - 1])){ ch = ch.concat(w.slice().reverse().slice(1)); open.splice(i, 1); grew = true; break; }
        if (key(w[w.length - 1]) === key(ch[0])){ ch = w.concat(ch.slice(1)); open.splice(i, 1); grew = true; break; }
        if (key(w[0]) === key(ch[0])){ ch = w.slice().reverse().concat(ch.slice(1)); open.splice(i, 1); grew = true; break; }
      }
    }
    out.push(ch);
  }
  return out;
}
out.water = [];
if (waterF) JSON.parse(fs.readFileSync(waterF, 'utf8')).elements.filter(e => e.type === 'relation' && (e.tags || {}).water === 'river').forEach(e => {
  const part = role => e.members.filter(m => m.role === role && m.geometry).map(m => m.geometry.map(g => [g.lat, g.lon]));
  rings(part('outer')).concat(rings(part('inner'))).forEach(r => { const q = dp(r, 6).map(r4); if (q.length > 3) out.water.push(q); });
});
const js = '/* OSM(© OpenStreetMap contributors, ODbL) 해안선·강 — geo_build.js 로 만듦 */\nwindow.GEO = ' + JSON.stringify(out) + ';\n';
fs.writeFileSync(path.join(__dirname, '..', 'geo.js'), js);
console.log('chains', chains.length, 'main pts', main.length, '→ sea', out.sea.length, 'islands', out.islands.length, 'rivers', out.rivers.length, 'water rings', out.water.length, out.water.reduce((n, r) => n + r.length, 0), 'pts', out.rivers.reduce((n, r) => n + r.p.length, 0), 'bytes', js.length,
  'entry', main[0].map(v => v.toFixed(3)), 'exit', main[main.length - 1].map(v => v.toFixed(3)));
