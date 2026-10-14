/* 기능 흐름: 체크 저장·배지, 지출(동→원), 체온·해열제 다음 시각, 메모, 기사에게 보여주기, 오늘 계획, 예보→카드 추천,
   큰 글씨·테마, 장소 목록, 지도 핀, 공략집(확인 필요·앱 버전), 가족 공유(위치·계획 — 실제 ntfy.sh 로 암호화된 시험 값을 보낸다) */
const { ls, NS } = require('./_fake');
const U = process.env.QA_URL || 'http://localhost:8765/';
const CODE = 'QA' + Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
const NL = 'String.fromCharCode(10)';
const T = s => `(function(){ var e=document.querySelector('${s}'); return e ? e.innerText.split(${NL}).join(' / ') : '-'; })()`;
const FREE = '2026-11-04T07:10:00+07:00', PRE = '2026-10-20T21:00:00+09:00';
module.exports = { parallel: 1, scenarios: [
  { name: 'ck', now: PRE, ls: ls(PRE), steps: [
    { wait: 600, eval: `'badge=' + document.querySelector('#dockLog').textContent + ' hero=' + document.querySelector('#hero .btn--pri').textContent + ' mini=' + document.querySelector('#ckTile [data-mini-list]').getAttribute('data-mini-list')` },
    { eval: `document.querySelector('#ckTile input[data-ck=p1]').click(); document.querySelector('#dock [data-view=log]').click(); document.querySelector('#ckLists input[data-ck=b1]').click(); [document.querySelector('#dockLog').textContent, document.querySelector('[data-list=pre] .ck__n').textContent, document.querySelector('#ckLists input[data-ck=p1]').checked, ${T('#ticker')}].join(' | ')` },
    { reload: true, wait: 800, eval: `[document.querySelector('#ckLists input[data-ck=b1]').checked, localStorage.getItem('${NS}ck'), document.querySelector('#hero .btn--pri').textContent].join(' | ')` },
    { eval: `document.querySelector('#dock [data-view=log]').click(); 'lists=' + document.querySelectorAll('#ckLists .ck').length` }, { shot: 'f-ck.png' }
  ] },
  { name: 'exp', now: FREE, ls: ls(FREE), steps: [
    { wait: 600, eval: `document.querySelector('#expTile [data-go]').click(); document.body.getAttribute('data-view') + ' ' + document.querySelector('#fxPill').textContent` },
    { type: ['#eAmt', '150'] }, { eval: `document.querySelector('#eK').click(); document.querySelector('[data-ecat="식사"]').click(); document.querySelector('#eAmt').value + ' ' + document.querySelector('#eConv').textContent` },
    { type: ['#eWhat', '냐벱 점심'] }, { eval: `document.querySelector('#expForm button[type=submit]').click(); ${T('#toast')}` },
    { eval: `document.querySelector('[data-cur=KRW]').click(); 'kHidden=' + document.querySelector('#eK').hidden` }, { type: ['#eAmt', '12000'] },
    { eval: `document.querySelector('[data-ecat="카페"]').click(); document.querySelector('#eConv').textContent` },
    { eval: `document.querySelector('#expForm button[type=submit]').click(); ${T('#expList')}.slice(0, 260)` },
    { reload: true, wait: 800, eval: `${T('#expTile')} + ' || ' + localStorage.getItem('${NS}exp').length` },
    { eval: `document.querySelector('#dock [data-view=log]').click(); 1` }, { shot: 'f-exp.png' }
  ] },
  /* 체온: 5시간 전 아세트아미노펜(4시간 간격) → 지금 가능 / 방금 이부프로펜(6시간) → 6시간 뒤 */
  { name: 'fev', now: FREE, ls: ls(FREE, {}, { fev: [{ t: Date.parse(FREE) - 5 * 3600000, temp: 38.6, med: 'acet' }] }), steps: [
    { wait: 600, eval: `${T('#fevTile')}` },
    { eval: `document.querySelector('#fevTile [data-go]').click(); document.querySelector('#fTime').value.length` },
    { type: ['#fTemp', '38.2'] }, { eval: `document.querySelector('[data-fmed=ibu]').click(); document.querySelector('#fevForm button[type=submit]').click(); ${T('#fevDose')}.slice(0, 330)` },
    { eval: `${T('#fevList')}` },
    { type: ['#fTemp', '50'] }, { eval: `document.querySelector('#fevForm button[type=submit]').click(); ${T('#toast')} + ' n=' + JSON.parse(localStorage.getItem('${NS}fev')).length` },
    { shot: 'f-fev.png' }
  ] },
  /* 24시간 안에 아세트아미노펜 5번 → 경고 */
  { name: 'fev-over', now: FREE, ls: ls(FREE, {}, { fev: [1, 5, 9, 13, 17].map(h => ({ t: Date.parse(FREE) - h * 3600000, temp: 38.5, med: 'acet' })) }), steps: [
    { wait: 600, eval: `${T('#fevTile')}` }
  ] },
  { name: 'memo', now: PRE, ls: ls(PRE), steps: [
    { wait: 600, eval: `document.querySelector('#dock [data-view=log]').click(); document.querySelectorAll('[data-memo]').length` },
    { eval: `document.querySelector('#mf0').scrollIntoView({ block: 'center' }); 1` }, { type: ['#mf0', 'QA-TEST-123'] },
    { eval: `document.querySelector('#mfFree').scrollIntoView({ block: 'center' }); 1` }, { type: ['#mfFree', 'memo free text'] },
    { reload: true, wait: 700, eval: `document.querySelector('#mf0').value + ' | ' + document.querySelector('#mfFree').value + ' | inSource=' + (document.documentElement.outerHTML.indexOf('QA-TEST-123') >= 0 && !document.querySelector('#mf0').value)` }
  ] },
  { name: 'show', now: FREE, ls: ls(FREE), steps: [
    { wait: 600, eval: `document.querySelector('#stayTile [data-show]').click(); 'open=' + !document.querySelector('#show').hidden + ' | ' + ${T('#show')}` },
    { shot: 'f-show-stay.png' },
    { eval: `document.querySelector('[data-showx]').click(); 'closed=' + document.querySelector('#show').hidden + ' scroll=' + (scrollY > 0)` },
    { eval: `document.querySelector('#dock [data-view=places]').click(); document.querySelector('[data-plarea=danang]').click(); document.querySelector('[data-plkind=all]').click(); document.querySelector('#sp-d_airport [data-show]').click(); ${T('#show')}` },
    { shot: 'f-show-airport.png' },
    { eval: `history.back(); 1` }, { wait: 300, eval: `'back-closed=' + document.querySelector('#show').hidden + ' view=' + document.body.getAttribute('data-view')` },
    { eval: `document.querySelector('#sp-d_nhabep [data-show]').click(); ${T('#show')}` },
    { eval: `document.querySelector('[data-showx]').click(); document.querySelector('#dock [data-view=guide]').click(); document.querySelector('[data-phrase=ph17]').click(); ${T('#show')} + ' | say=' + document.querySelectorAll('[data-say]').length + ' phrases=' + document.querySelectorAll('[data-phrase]').length` },
    { shot: 'f-show-phrase.png' }
  ] },
  /* 오늘 계획 (가족 코드 없이 — 이 폰에만) + 예보 → 추천 */
  { name: 'plan-sunny', now: FREE, ls: ls(FREE, { danang: [10, 15, 20, 30] }), steps: [
    { wait: 600, eval: `${T('.fc-head')} + ' | rec=' + [].slice.call(document.querySelectorAll('.wc.is-rec h3')).map(function(e){ return e.textContent; }).join(',') + ' | seg=' + document.querySelector('#cardsTile [aria-pressed=true]').textContent` },
    { eval: `document.querySelector('[data-plancard=linhung]').click(); 'form=' + !!document.querySelector('#planForm') + ' sel=' + document.querySelectorAll('#planCards [aria-pressed=true]').length + ' who=' + document.querySelectorAll('#planForm [data-me]').length` },
    { eval: `document.querySelector('[data-pc=marble]').click(); document.querySelector('[data-pc=city]').click(); [].slice.call(document.querySelectorAll('#planCards [aria-pressed=true]')).map(function(e){ return e.textContent; }).join(',')` },
    { eval: `document.querySelector('#planTime').value = '08:30'; document.querySelector('#planForm button[type=submit]').click(); ${T('#planTile')}.slice(0, 200) + ' || hero: ' + ${T('#hero .alt')}` },
    { shot: 'f-plan.png' }
  ] },
  { name: 'plan-rainy', now: FREE, ls: ls(FREE, { danang: [80, 70, 65, 40, 5] }), steps: [
    { wait: 600, eval: `${T('.fc-head')} + ' | rec=' + [].slice.call(document.querySelectorAll('.wc.is-rec h3')).map(function(e){ return e.textContent; }).join(',') + ' | seg=' + document.querySelector('#cardsTile [aria-pressed=true]').textContent` },
    { eval: `document.querySelector('[data-fchub=hoian]').click(); ${T('.fc-head')}` },
    { eval: `document.querySelector('#cardsTile [data-cardseg=dinner]').click(); document.querySelectorAll('#cardsTile .sprow').length + ' dinner rows; ' + (document.querySelector('#cardsTile [data-cardseg=flood]').click(), document.querySelectorAll('#cardsTile .sprow').length) + ' flood rows'` }
  ] },
  /* 새벽에 비가 온 맑은 아침 → 오행산 미끄럼 안내 */
  { name: 'plan-slip', now: FREE, ls: ls(FREE, { danang: [10, 15, 20, 30, 80] }), steps: [
    { wait: 600, eval: `${T('#fcTile .note')}` }
  ] },
  { name: 'big-theme', now: FREE, ls: ls(FREE), steps: [
    { wait: 600, eval: `document.querySelector('#bigBtn').click(); [document.documentElement.hasAttribute('data-big'), getComputedStyle(document.documentElement).fontSize, getComputedStyle(document.querySelector('.now-title')).fontSize, localStorage.getItem('${NS}big'), 'overflow=' + (document.documentElement.scrollWidth - innerWidth)].join(' | ')` },
    { shot: 'f-big.png' },
    { reload: true, wait: 600, eval: `'after reload big=' + document.documentElement.hasAttribute('data-big') + ' pressed=' + document.querySelector('#bigBtn').getAttribute('aria-pressed')` },
    { eval: `document.querySelector('#themeBtn').click(); [document.documentElement.getAttribute('data-theme'), localStorage.getItem('${NS}theme'), getComputedStyle(document.body).backgroundColor, document.querySelector('#themeColor').content].join(' | ')` },
    { eval: `document.querySelector('#bigBtn').click(); document.querySelector('#themeBtn').click(); [document.documentElement.hasAttribute('data-big'), document.documentElement.getAttribute('data-theme'), localStorage.getItem('${NS}theme')].join(' | ')` }
  ] },
  { name: 'places', now: FREE, ls: ls(FREE), steps: [
    { wait: 600, eval: `document.querySelector('#dock [data-view=places]').click(); ${T('#plTile .th')} + ' first=' + document.querySelector('#plTile .pl__c h3').textContent` },
    { eval: `document.querySelector('[data-plsort=rate]').click(); 'rate-first=' + document.querySelector('#plTile .pl__c h3').textContent + ' ' + document.querySelector('#plTile .pl__rate').textContent` },
    { eval: `var o=[]; ['hoian','danang'].forEach(function(a){ document.querySelector('[data-plarea='+a+']').click(); document.querySelector('[data-plkind=all]').click(); o.push(a + '=' + document.querySelectorAll('#plTile .pl__c').length); }); o.join(' ') + ' href=' + document.querySelector('#sp-d_nhabep .btn--pri').getAttribute('href').slice(0, 120)` },
    { eval: `'links=' + [].slice.call(document.querySelectorAll('#plTile a[href^=tel]')).length + ' tel0=' + document.querySelector('#plTile a[href^=tel]').getAttribute('href')` }
  ] },
  { name: 'map', now: FREE, ls: ls(FREE), w: 390, h: 844, steps: [
    { wait: 600, eval: `document.querySelector('#dock [data-view=map]').click(); 1` },
    { waitFor: `window.__map && window.__map.loaded()` }, { eval: `(function(){ var mk = [].slice.call(document.querySelectorAll('.mk')); return 'markers=' + mk.length + ' visible=' + mk.filter(function(e){ return e.style.display !== 'none'; }).length + ' msgHidden=' + document.querySelector('#mapMsg').hidden + ' canvas=' + !!document.querySelector('#map canvas') + ' zoom=' + (window.__map ? window.__map.getZoom().toFixed(1) : '-') + ' loaded=' + (window.__map ? window.__map.loaded() : '-'); })()` },
    { shot: 'f-map-danang.png' },
    { eval: `document.querySelector('[data-mapf=spa]').click(); 'spa visible=' + [].slice.call(document.querySelectorAll('.mk')).filter(function(e){ return e.style.display !== 'none'; }).length` },
    { eval: `document.querySelector('.mk--spa').click(); ${T('#mapCard h3')}` },
    { eval: `document.querySelector('[data-maparea=hoian]').click(); document.querySelector('[data-mapf=all]').click(); 1` },
    { waitFor: `window.__map.getCenter().lat < 15.9 && !window.__map.isMoving()` }, { wait: 2500, eval: `'hoian center=' + window.__map.getCenter().lat.toFixed(3) + ',' + window.__map.getCenter().lng.toFixed(3)` },
    { shot: 'f-map-hoian.png' },
    { eval: `document.querySelector('#dock [data-view=places]').click(); document.querySelector('[data-plarea=hoian]').click(); document.querySelector('[data-plkind=food]').click(); document.querySelector('#sp-h_yoon [data-mapgo]').click(); document.body.getAttribute('data-view') + ' ' + ${T('#mapCard h3')}` },
    { waitFor: `window.__map.getZoom() > 15 && !window.__map.isMoving()` }, { wait: 2500, eval: `'sel=' + document.querySelectorAll('.mk.is-sel').length + ' zoom=' + window.__map.getZoom().toFixed(1)` },
    { shot: 'f-map-sel.png' }
  ] },
  { name: 'guide', now: PRE, ls: ls(PRE), steps: [
    { wait: 600, eval: `document.querySelector('#dock [data-view=guide]').click(); ${T('#qSec .pill')} + ' | ' + ${T('.foot')}.slice(-40) + ' | lastEl=' + document.querySelector('#guide').lastElementChild.className + ' | ver1=' + document.querySelector('#ver1').textContent + ' | details=' + document.querySelectorAll('#guide details').length + ' links=' + document.querySelectorAll('#floodSec a.lnk').length` },
    { eval: `document.querySelectorAll('.qbadge').length + ' badges on page; q list: ' + [].slice.call(document.querySelectorAll('.qlist li')).length` }
  ] },
  /* 가족 공유: 아빠 폰이 코드·위치·계획을 보내고, 엄마 폰이 같은 코드로 받는다 (ntfy.sh, 암호화) */
  { name: 'share-dad', url: U + '#join=' + CODE, now: FREE, geo: [16.0412, 108.2498], ls: ls(FREE, {}, { me: 'd' }), steps: [
    { wait: 1500, eval: `'hash=' + location.hash + ' code=' + localStorage.getItem('${NS}lsCode').length + ' shared=' + ${T('#planTile .pill')}` },
    { eval: `document.querySelector('#dock [data-view=guide]').click(); document.querySelector('[data-ls=toggle]').click(); ${T('#toast')}` },
    { wait: 5000, eval: `document.querySelector('[data-ls=toggle]').textContent` },
    { eval: `document.querySelector('#dock [data-view=plan]').click(); document.querySelector('#cardsTile [data-cardseg=rain]').click(); document.querySelector('[data-plancard=lotte]').click(); document.querySelector('#planTime').value = '09:00'; document.querySelector('#planNote').value = 'QA 우비'; document.querySelector('#planForm button[type=submit]').click(); 1` },
    { waitFor: `/보냈어요|저장했어요/.test(document.querySelector('#toast').textContent)`, timeout: 25000 }, { eval: `${T('#toast')} + ' | ' + ${T('#planTile .plan-now')}` }
  ] },
  { name: 'share-mom', url: U + '#join=' + CODE, now: FREE, ls: ls(FREE, {}, { me: 'm' }), steps: [
    { waitFor: `!!document.querySelector('#planTile .plan-now') && !!document.querySelector('#shareBox .peer')`, timeout: 40000 }, { eval: `document.querySelector('#dock [data-view=guide]').click(); ${T('#shareBox .peer')} + ' || plan: ' + ${T('#planTile .plan-now')} + ' / ' + ${T('#planTile .plan-by')} + ' || hero: ' + ${T('#hero .alt')}` },
    { shot: 'f-share-mom.png' },
    { eval: `document.querySelector('[data-peer=d]').click(); 1` }, { waitFor: `document.querySelectorAll('.pmk').length > 0 && window.__map.loaded()` }, { wait: 3000, eval: `'view=' + document.body.getAttribute('data-view') + ' peerPins=' + document.querySelectorAll('.pmk').length + ' ' + ${T('.pmk')}` },
    { shot: 'f-share-map.png' }
  ] },
  /* 다른 코드의 폰에는 안 보인다 */
  { name: 'share-other', url: U + '#join=' + CODE.split('').reverse().join(''), now: FREE, ls: ls(FREE, {}, { me: 'g' }), steps: [
    { wait: 6000, eval: `'peers=' + document.querySelectorAll('#shareBox .peer').length + ' plan=' + ${T('#planTile .plan-now')}` }
  ] }
] };
