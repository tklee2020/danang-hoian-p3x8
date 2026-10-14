/* index.html 의 <script> 블록마다 문법 검사 + 옛 아이폰(iOS 16.4 미만)에서 깨지는 문법 찾기.
   사용: node syntax-check.js [../../index.html]   — 편집 훅은 HTML 을 검사하지 않으므로 고칠 때마다 돌린다 */
const fs = require('fs');
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'index.html'));
const html = fs.readFileSync(file, 'utf8');
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
let m, n = 0, bad = 0;
while ((m = re.exec(html))) {
  n++;
  const line = html.slice(0, m.index).split('\n').length;
  try { new Function(m[1]); } catch (e) { bad++; console.log('블록 ' + n + ' (줄 ' + line + '): ' + e.message); }
  /* 문자열·주석을 대충 걷어 낸 뒤 금지 문법을 찾는다 */
  const code = m[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/'(?:\\.|[^'\\\n])*'/g, "''").replace(/"(?:\\.|[^"\\\n])*"/g, '""');
  [[/\?\./, '?. (optional chaining)'], [/\?\?/, '?? (nullish)'], [/\(\?<[=!]/, '정규식 lookbehind'], [/\.at\(/, '.at()'], [/structuredClone/, 'structuredClone']].forEach(([r, name]) => {
    const k = code.search(r);
    if (k >= 0 && !/\?\.\d/.test(code.slice(k, k + 3))) { bad++; console.log('블록 ' + n + ': 금지 문법 ' + name + ' — "' + code.slice(Math.max(0, k - 30), k + 20).replace(/\n/g, ' ') + '"'); }
  });
}
console.log(bad ? bad + '건 문제' : 'script 블록 ' + n + '개 문법 통과');
process.exit(bad ? 1 : 0);
