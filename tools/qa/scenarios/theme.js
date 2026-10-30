/* 테마 — 폰 다크 모드와 상관없이 밝게가 기본, 🌗(설정 칸 「밝게 · 어둡게」)로 고른 폰만 어둡게 (PLAYBOOK 23절) */
const { NS, ls } = require('./_fake');
const NOW = '2026-11-04T07:10:00+07:00';
const S = `[document.documentElement.getAttribute('data-theme'), getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(), document.querySelector('#schemeMeta').content, document.querySelector('#themeColor').content, localStorage.getItem('${NS}theme')].join(' | ')`;
const BTN = `document.querySelector('#themeBtn').click()`;
module.exports = { parallel: 2, scenarios: [
  { name: 'theme-sysdark-new', now: NOW, dark: true, ls: ls(NOW), steps: [{ wait: 600, eval: S }, { shot: 'theme-sysdark-new.png' }] },
  { name: 'theme-sysdark-old-system', now: NOW, dark: true, ls: ls(NOW, {}, { theme: 'system' }), steps: [{ wait: 600, eval: S }] },
  { name: 'theme-sysdark-chosen-dark', now: NOW, dark: true, ls: ls(NOW, {}, { theme: 'dark' }), steps: [
    { wait: 600, eval: S }, { eval: BTN + '; ' + S }, { reload: true, wait: 600, eval: S }, { eval: BTN + '; ' + S } ] },
  { name: 'theme-syslight-chosen-dark', now: NOW, dark: false, ls: ls(NOW, {}, { theme: 'dark' }), steps: [{ wait: 600, eval: S }, { eval: BTN + '; ' + S }] }
] };
