#!/usr/bin/env node
/**
 * Audit-Plus build (esbuild).
 *
 *   npm run build            → dist/index.html + dist/assets/*   (minified; opens straight from disk, no server)
 *                              dist/Audit-Plus-standalone.html    (everything inlined in ONE file)
 *   npm run build -- --dev   → same, but unminified with inline source maps
 *
 * index.html is the template: the <link>/<script type="module"> tags it contains are replaced here.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const DEV = process.argv.includes('--dev');
const read = p => fs.readFileSync(path.join(root, p), 'utf8').replace(/\r\n/g, '\n');
const hash = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 8);
const kb = n => (n / 1024).toFixed(0) + ' KB';
/* a literal "</script" inside inlined JS would end the tag early; "<\/script" means the same thing inside JS strings/regexes */
const safeJs = js => js.replace(/<\/script/gi, '<\\/script');

async function main() {
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });

  /* ---------- JS: one bundle (ES modules → single classic script) ---------- */
  const common = { bundle: true, write: false, logLevel: 'warning', charset: 'utf8', legalComments: 'none' };
  const js = (
    await esbuild.build({
      ...common,
      entryPoints: [path.join(root, 'js/main.js')],
      format: 'iife',
      target: 'esnext',
      minify: !DEV,
      sourcemap: DEV ? 'inline' : false,
    })
  ).outputFiles[0].text;

  /* ---------- CSS: minified; fonts → files (dist) or data URIs (standalone) ---------- */
  const cssEntry = [path.join(root, 'css/audit-plus.css')];
  const cssFiles = await esbuild.build({
    ...common,
    entryPoints: cssEntry,
    minify: !DEV,
    loader: { '.woff2': 'file' },
    assetNames: '[name]-[hash]',
    outdir: path.join(dist, 'assets'),
    publicPath: '.',
  });
  const cssText = cssFiles.outputFiles.find(f => f.path.endsWith('.css')).text;
  for (const f of cssFiles.outputFiles) if (!f.path.endsWith('.css')) fs.writeFileSync(f.path, f.contents);
  const cssInline = (
    await esbuild.build({
      ...common,
      entryPoints: cssEntry,
      minify: !DEV,
      loader: { '.woff2': 'dataurl' },
      outdir: dist,
    })
  ).outputFiles[0].text;

  /* ---------- template ---------- */
  const tpl = read('index.html').replace(/<!--[\s\S]*?-->\n?/g, '');
  const jsName = `app.${hash(js)}.js`;
  const cssName = `audit-plus.${hash(cssText)}.css`;
  fs.writeFileSync(path.join(dist, 'assets', jsName), js);
  fs.writeFileSync(path.join(dist, 'assets', cssName), cssText);

  const LINK = /<link rel="stylesheet" href="css\/audit-plus\.css"\s*\/?>/;
  const MOD = /<script type="module" src="js\/main\.js"><\/script>/;
  if (!LINK.test(tpl) || !MOD.test(tpl)) throw new Error('index.html: stylesheet / module-script tag not found');
  const classic = /<script src="(js\/[^"]+)"><\/script>/g;
  const classicFiles = [...tpl.matchAll(classic)].map(m => m[1]);

  /* multi-file build: dist/index.html */
  const multi = tpl
    .replace(LINK, `<link rel="stylesheet" href="assets/${cssName}">`)
    .replace(MOD, `<script src="assets/${jsName}"></script>`);
  for (const f of classicFiles) {
    fs.mkdirSync(path.dirname(path.join(dist, f)), { recursive: true });
    fs.copyFileSync(path.join(root, f), path.join(dist, f));
  }
  fs.mkdirSync(path.join(dist, 'js/i18n'), { recursive: true }); // English dictionary: loaded on demand
  fs.copyFileSync(path.join(root, 'js/i18n/en.js'), path.join(dist, 'js/i18n/en.js'));
  fs.writeFileSync(path.join(dist, 'index.html'), multi);

  /* standalone: everything in one file */
  let one = tpl
    .replace(LINK, () => `<style>\n${cssInline.trim()}\n</style>`)
    .replace(MOD, () => `<script>\n${safeJs(js)}\n</script>`);
  one = one.replace(classic, (m, f) => `<script>\n${safeJs(read(f))}\n</script>`);
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(read('js/i18n/en.js'), ctx);
  const dict = JSON.stringify(ctx.window.I18N_EN).replace(/</g, '\\u003c');
  const at = one.lastIndexOf('</body>');
  one = `${one.slice(0, at)}<script type="application/json" id="i18n-en">${dict}</script>\n${one.slice(at)}`;
  const out = path.join(dist, 'Audit-Plus-standalone.html');
  fs.writeFileSync(out, one);

  console.log(
    `built ${DEV ? '(dev) ' : ''}dist/  ·  app ${kb(js.length)}  ·  css ${kb(cssText.length)}  ·  standalone ${kb(fs.statSync(out).size)}`
  );
}
main().catch(e => {
  console.error(e);
  process.exit(1);
});
