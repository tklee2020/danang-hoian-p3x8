/* 다낭 · 호이안 오프라인 지원 (강화판 sw.js + 도쿄판의 지도 타일 저장)
   - 페이지(index.html): 인터넷이 되면 항상 새 버전, 안 되거나 4초 넘게 걸리면 저장해 둔 버전
   - 아이콘·글꼴(fonts/Pretendard, 설치 때 미리 저장)·지도 라이브러리(jsDelivr): 한 번 받으면 저장해 두고 씀 (뒤에서 조용히 새로 받기)
   - 실제 지도(OpenFreeMap) 타일·글꼴·아이콘: 한 번 본 곳은 저장해 두고 씀 (최근 1,500장까지)
   - 날씨·환율 API, 구글 지도 링크, 가족 공유(ntfy.sh): 가로채지 않음 (날씨·환율은 페이지가 따로 저장해 둬요) */
const V = 'dnh-v1';   /* 바꾸면 저장해 둔 글꼴·아이콘·지도 라이브러리도 새로 받아요 */
const CORE = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './fonts/PretendardVariable.woff2'];
const PAGE = new URL('./', self.registration.scope).href;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('dnh-') && k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function pageFirst(){
  return caches.open(V).then(c => {
    /* GitHub Pages는 CDN이 10분씩 들고 있어서, 주소에 매번 다른 꼬리를 붙여 원본을 바로 받아요 (저장은 원래 주소로) */
    const net = fetch(PAGE + (PAGE.indexOf('?') < 0 ? '?' : '&') + 'sw=' + Date.now(), { cache: 'no-store' }).then(r => { if (r.ok){ c.put(PAGE, r.clone()); return r; } return c.match(PAGE).then(h => h || r); });
    const late = new Promise(res => setTimeout(res, 4000)).then(() => c.match(PAGE));
    return Promise.race([net, late.then(r => r || net)]).catch(() => c.match(PAGE)).then(r => r || net);
  });
}
function keep(req){
  return caches.open(V).then(c => c.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; });
    if (hit){ net.catch(() => {}); return hit; }
    return net;
  }));
}
const KEEP_HOSTS = /(^|\.)(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com)$/;
const TILES = 'dnmap-tiles', TILE_MAX = 1500;   /* 'dnh-'로 시작하지 않아서 V를 올려도 안 지워져요 */
let tilePuts = 0;
function trimTiles(c){ c.keys().then(ks => { if (ks.length > TILE_MAX) return Promise.all(ks.slice(0, ks.length - TILE_MAX).map(k => c.delete(k))); }).catch(() => {}); }
/* 타일(.pbf·.png)·글꼴·스프라이트는 주소에 버전이 박혀 있어서 저장본 우선, 스타일·TileJSON은 저장본 주고 뒤에서 새로 받기 */
function keepTile(req, revalidate){
  return caches.open(TILES).then(c => c.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok){ c.put(req, r.clone()); if (++tilePuts % 60 === 0) trimTiles(c); } return r; });
    if (hit){ if (revalidate) net.catch(() => {}); return hit; }
    return net;
  }));
}

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (r.mode === 'navigate' && u.origin === location.origin){ e.respondWith(pageFirst()); return; }
  if (u.origin === location.origin){ if (!u.pathname.endsWith('/sw.js')) e.respondWith(keep(r)); return; }
  if (KEEP_HOSTS.test(u.hostname)){ e.respondWith(keep(r)); return; }
  if (u.hostname === 'tiles.openfreemap.org') e.respondWith(keepTile(r, /\/styles\/|\/planet\/?$/.test(u.pathname)));
});
