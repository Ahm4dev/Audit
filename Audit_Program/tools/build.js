#!/usr/bin/env node
/**
 * Audit-Plus — build a single self-contained HTML file from the multi-file source.
 *
 *   node tools/build.js                 → dist/Audit-Plus-standalone.html
 *   node tools/build.js out/my.html     → custom output path
 *
 * No dependencies. index.html is the single source of truth for ORDER:
 * every <link rel="stylesheet"> and <script src> is inlined in the order it appears.
 * Relative url(...) references inside CSS (fonts) are inlined as base64 data URIs.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outFile = path.resolve(process.cwd(), process.argv[2] || path.join(root, 'dist', 'Audit-Plus-standalone.html'));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8').replace(/\r\n/g, '\n');
const MIME = { '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

let html = read('index.html');

/* ---------- CSS: inline <link rel=stylesheet> (concatenated into one <style>) ---------- */
const linkRe = /^[ \t]*<link rel="stylesheet" href="([^"]+)">[ \t]*\n?/gm;
const cssParts = [];
let firstLinkIdx = -1;
html = html.replace(linkRe, (m, href, offset) => {
  if (firstLinkIdx < 0) firstLinkIdx = offset;
  let css = read(href);
  css = css.replace(/url\((['"]?)(?!data:|https?:|#)([^)'"]+)\1\)/g, (mm, q, rel) => {
    const abs = path.resolve(root, path.dirname(href), rel);
    const buf = fs.readFileSync(abs);
    return 'url(data:' + (MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream') + ';base64,' + buf.toString('base64') + ')';
  });
  cssParts.push(css.trim());
  return '\u0000CSS\u0000';
});
html = html.replace(/(\u0000CSS\u0000\n?)+/, () => '<style>\n' + cssParts.join('\n') + '\n</style>\n').replace(/\u0000CSS\u0000\n?/g, '');

/* ---------- JS: inline <script src>; merge consecutive scripts with the same strictness ---------- */
const scriptRe = /^[ \t]*<script (?:defer )?src="([^"]+)"><\/script>[ \t]*\n?/gm;
const items = [];
html = html.replace(scriptRe, (m, src) => { items.push(src); return '\u0000JS' + (items.length - 1) + '\u0000\n'; });
const isStrict = (code) => /^\s*(?:\/\*[\s\S]*?\*\/\s*)?['"]use strict['"]/.test(code);
const stripStrict = (code) => code.replace(/^(\s*(?:\/\*[\s\S]*?\*\/\s*)?)['"]use strict['"];?[ \t]*\n?/, '$1');
const blocks = []; // {strict, head, codes[], idx[]}
items.forEach((src, i) => {
  const code = read(src).trim();
  if (src.startsWith('js/init/')) { blocks.push({ head: true, codes: [code], idx: [i] }); return; }
  const strict = isStrict(code), last = blocks[blocks.length - 1];
  if (last && !last.head && last.strict === strict) { last.codes.push(strict ? stripStrict(code) : code); last.idx.push(i); }
  else blocks.push({ strict, codes: [strict ? stripStrict(code) : code], idx: [i] });
});
blocks.forEach((b) => {
  const body = (b.strict ? "'use strict';\n" : '') + b.codes.join('\n;\n');
  if (/<\/script/i.test(body)) throw new Error('a script contains "</script" — cannot inline safely');
  const tag = '<script>' + (b.head ? '' : '\n') + body + '\n</script>';
  html = html.replace('\u0000JS' + b.idx[0] + '\u0000\n', () => tag + '\n');
  b.idx.slice(1).forEach((k) => { html = html.replace('\u0000JS' + k + '\u0000\n', ''); });
});

/* ---------- housekeeping ---------- */
html = html.replace(/<!--[\s\S]*?-->\n?/g, ''); // dev-only comments
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, html);
console.log('built', path.relative(process.cwd(), outFile), (fs.statSync(outFile).size / 1024).toFixed(0) + ' KB');
