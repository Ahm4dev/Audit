/* Audit-Plus · Link self-test (?selftest) */

import { hub } from '../hub.js';
import { ISA } from '../data/03-evidence-deficiency-sampling.js';
import { PH } from '../data/04-phases.js';
import { A } from '../data/05-accounts.js';
import { C, CX, IND } from '../data/06-cycles-it-components.js';
import { TPL } from '../data/09-document-templates.js';
import { $, esc, localISO, logErr, rnd36 } from '../core/01-utils-i18n-storage.js';
import { can } from '../core/02-auth.js';
import { CO, CUR, createEngagement, errMsg } from '../core/03-data-engine.js';
import { AC, CXM, CY, IN, NAV, PHM, PIDX, PROCS, TABS, V, WP } from '../views/05-indexes.js';
import { refById, refList } from './16-relations.js';

/* ================= a17 · Link self-test (?selftest): every route, href, hash route, WP reference, anchor id and navigation item ================= */
const SELFTEST = {
  res: null,
  running: false,
  shell() {
    return `<h1>🧪 فاحص الروابط الآلي</h1><p class="sub">يزور كل مسار في البرنامج ويتحقق من أن كل رابط (href) ومسار hash وإحالة ورقة عمل ومعرّف مرساة وعنصر تنقل يؤدي إلى هدف موجود، ويختبر الرجوع والتقدم والروابط العميقة بالترميز العربي وإعادة التحميل. يُستخدم أحدث ارتباط مفتوح (أو ينشئ ارتباطًا مؤقتًا ويحذفه).</p>
 <div class="row noprint"><button class="btn" type="button" data-act="stRun">تشغيل الفحص</button><button class="btn g" type="button" data-act="stDl"${this.res ? '' : ' disabled'}>تنزيل النتيجة (JSON)</button></div><div id="stout" aria-live="polite">${this.res ? this.reportHTML(this.res) : ''}</div>`;
  },
  page() {
    const r = sessionStorage.getItem('meap.selftest.reload');
    if (r) {
      try {
        const st = JSON.parse(r);
        sessionStorage.removeItem('meap.selftest.reload');
        this.res = st.res;
        this.res.reload = { hash: st.hash, ok: false };
        location.hash = st.hash;
        const done = e => {
          if (e.detail && e.detail.view === 'selftest') return;
          document.removeEventListener('meap:routed', done);
          this.res.reload.ok = CUR.view === st.view && !$('#main .note.bad');
          this.res.reload.view = CUR.view;
          try {
            sessionStorage.setItem('meap.selftest.final', JSON.stringify(this.res));
          } catch (x) {
            logErr('selftest store', x);
          }
          location.hash = '#/selftest';
        };
        document.addEventListener('meap:routed', done);
      } catch (e) {
        logErr('selftest reload', e);
      }
      return;
    }
    const f = sessionStorage.getItem('meap.selftest.final');
    if (f) {
      try {
        this.res = JSON.parse(f);
      } catch (e) {
        logErr('selftest final', e);
      }
      const o = $('#stout');
      if (o) o.innerHTML = this.reportHTML(this.res);
      const d = $('[data-act=stDl]');
      if (d) d.disabled = false;
      window.__MEAP_SELFTEST = this.res;
      return;
    }
    if (/[?&]selftest\b/.test(location.search) && !this.res && !this.running) this.run();
  },
  go(hash) {
    return new Promise(res => {
      let done = false;
      const fin = () => {
        if (!done) {
          done = true;
          document.removeEventListener('meap:routed', fin);
          setTimeout(res, 30);
        }
      };
      document.addEventListener('meap:routed', fin);
      if (location.hash === hash) hub.route(true);
      else location.hash = hash;
      setTimeout(fin, 8000);
    });
  },
  /* validate a hash route without navigating */
  valid(h, ctx) {
    if (!/^#\//.test(h)) return 'ليس مسارًا داخليًا';
    const p = h
      .replace(/^#\/?/, '')
      .split('/')
      .map(x => {
        try {
          return decodeURIComponent(x);
        } catch (e) {
          return null;
        }
      });
    if (p.some(x => x === null)) return 'ترميز غير صالح';
    const a = p[0] || '';
    if (a === '' || a === 'selftest') return '';
    if (a === 'c') return ctx.cos.has(p[1]) ? '' : 'شركة غير موجودة: ' + p[1];
    if (a === 'settings') return !p[1] || hub.STABS.some(x => x[0] === p[1]) ? '' : 'تبويب إعدادات غير موجود: ' + p[1];
    if (a === 'find') return '';
    if (a !== 'e') return 'مسار غير معروف: ' + a;
    if (!ctx.engs.has(p[1] + '/' + p[2])) return 'ارتباط غير موجود: ' + p[1] + '/' + p[2];
    const view = p[3] || 'dash',
      arg = p.slice(4).join('/');
    const VX = {
      fs: x => ['', 'A', 'L', 'E', 'P', 'O'].includes(x),
      acc: x => !x || AC[x],
      cyc: x => !x || CY[x],
      cx: x => !x || CXM[x],
      ind: x => !x || IN[x],
      ph: x => !x || PHM[x],
      isa: x => !x || ISA.some(s => String(s[0]) === x),
      wp: x => WP[x],
      form: x => hub.TPLM[x],
      forms: x => !x || hub.TPLM[x],
      refs: x => !x || refById(x),
      proc: x => PIDX[x],
      logs: x => ['', 'f', 'a', 'r'].includes(x),
      risks: x => ['', 'sig', 'fr', 'H'].includes(x) || x.length < 20,
      rcm: x => !x || CY[x],
      tb: x =>
        ['', 'upload', 'map', 'ver', 'ana', 'cls'].includes(x) ||
        (x.startsWith('acct:') && (!hub.TBSTORE.ready() || hub.TBSTORE.by.has(x.slice(5)))),
      jet: x => !x || !!CUR.eng.get('jet.' + x + '.sum', null),
      search: () => true,
    };
    if (!V[view] && !['refs', 'forms'].includes(view)) return 'صفحة غير موجودة: ' + view;
    const f = VX[view];
    if (f && !f(arg)) return 'هدف غير موجود: ' + view + '/' + arg;
    if (!f && arg) return 'معامل غير متوقع: ' + view + '/' + arg;
    return '';
  },
  routes(base, ctx) {
    const R = new Set(['#/', '#/settings/general', '#/find/' + encodeURIComponent('نقدية')]);
    hub.STABS.forEach(s => R.add('#/settings/' + s[0]));
    ctx.cos.forEach(c => R.add('#/c/' + encodeURIComponent(c)));
    const e = v => R.add(base + '/' + v);
    NAV.forEach(g => g[2].forEach(i => e(i[0])));
    TABS.forEach(x => e(x[0]));
    [
      'logs/f',
      'logs/a',
      'logs/r',
      'risks/sig',
      'risks/fr',
      'risks/H',
      'tb/upload',
      'tb/map',
      'tb/ver',
      'tb/ana',
      'refs',
      'model',
      'inbox',
      'print',
      'jet',
      'search/' + encodeURIComponent('النقدية'),
    ].forEach(e);
    A.forEach(a => e('acc/' + a.id));
    C.forEach(c => {
      e('cyc/' + c.id);
      e('rcm/' + c.id);
    });
    CX.forEach(x => e('cx/' + x.id));
    IND.forEach(i => e('ind/' + i.id));
    PH.forEach(p => e('ph/' + p.id));
    ISA.forEach(s => e('isa/' + s[0]));
    Object.keys(WP).forEach(r => e('wp/' + encodeURIComponent(r)));
    TPL.forEach(t => e('form/' + t.id));
    refList().forEach(r => e('refs/' + encodeURIComponent(r.id)));
    PROCS.filter((p, i) => i % 25 === 0).forEach(p => e('proc/' + encodeURIComponent(p.id)));
    if (hub.TBSTORE.ready()) hub.TBSTORE.rows.slice(0, 5).forEach(r => e('tb/acct:' + encodeURIComponent(r.code)));
    return [...R];
  },
  inspect(route, ctx, out) {
    const main = $('#main');
    const add = (kind, msg, href) => out.push({ route, kind, msg, href: href || '' });
    if (
      main.querySelector('.note.bad') &&
      /تعذر عرض الصفحة|الصفحة غير موجودة|غير موجود/.test(main.querySelector('.note.bad').textContent)
    )
      add('render', 'الصفحة عرضت رسالة خطأ: ' + main.querySelector('.note.bad').textContent.slice(0, 80));
    const scope = [main, $('#nav'), $('#etabs'), $('#top')].filter(Boolean);
    const seen = new Set();
    for (const root of scope)
      for (const a of root.querySelectorAll('a')) {
        const h = a.getAttribute('href');
        if (h == null) {
          if (!a.hasAttribute('name')) add('dead', 'رابط بلا href', a.textContent.trim().slice(0, 30));
          continue;
        }
        if (h === '' || h === '#' || /^javascript:/i.test(h)) {
          add('dead', 'رابط ميت', h);
          continue;
        }
        if (/^https?:/i.test(h) || a.target === '_blank') {
          const rel = (a.getAttribute('rel') || '').split(/\s+/);
          if (!(rel.includes('noopener') && rel.includes('noreferrer')))
            add('rel', 'رابط خارجي بدون rel="noopener noreferrer"', h);
          continue;
        }
        if (/^blob:/.test(h)) continue;
        if (seen.has(h)) continue;
        seen.add(h);
        const err = this.valid(h, ctx);
        if (err) add('href', err, h);
        else ctx.ok++;
      }
    for (const j of main.querySelectorAll('[data-jump]')) {
      const id = j.dataset.jump;
      if (id !== 'main' && !document.getElementById(id)) add('anchor', 'مرساة غير موجودة: #' + id, id);
      else ctx.ok++;
    }
    for (const a of main.querySelectorAll('a[href^="#"]:not([href^="#/"])')) {
      const id = a.getAttribute('href').slice(1);
      if (id && !document.getElementById(id)) add('anchor', 'مرساة غير موجودة: #' + id, id);
      else ctx.ok++;
    }
    for (const s of main.querySelectorAll('span.wpl')) {
      if (s.closest('a')) continue;
      const ref = s.textContent.trim();
      if (/^[A-Z]{1,3}-\d/.test(ref) && !WP[ref] && !s.closest('[data-block^="lk|"]') && !s.closest('.lkl'))
        add('wpref', 'إحالة إلى ورقة عمل غير موجودة: ' + ref, ref);
      else ctx.ok++;
    }
    const navCur = $('#nav [aria-current="page"]');
    if (
      CUR.eng &&
      !$('#nav').hidden &&
      !navCur &&
      !/^#\/e\/[^/]+\/[^/]+\/(wp|acc|cyc|cx|ind|ph|isa|refs|proc|form|tb|search|logs|risks|rcm|jet)/.test(route)
    )
      add('nav', 'لا يوجد عنصر تنقل نشط (aria-current)');
  },
  async run() {
    if (this.running) return;
    this.running = true;
    try {
      sessionStorage.removeItem('meap.selftest.final');
    } catch (e) {
      logErr('selftest clear', e);
    }
    this.res = null;
    const out = $('#stout');
    const t0 = performance.now();
    const issues = [];
    let temp = null;
    try {
      await CO.load();
      let cid, year;
      if (hub.CUR_LAST) {
        cid = hub.CUR_LAST.cid;
        year = hub.CUR_LAST.year;
      } else {
        for (const c of CO.list) {
          const e = (await CO.engs(c))[0];
          if (e) {
            cid = c.id;
            year = e.year;
            break;
          }
        }
      }
      if (!cid) {
        if (!can('create')) throw new Error('لا يوجد ارتباط ولا صلاحية لإنشاء ارتباط مؤقت.');
        const c = await CO.save({ id: 'ST' + rnd36(4), name: 'ارتباط الفحص الذاتي المؤقت' });
        await createEngagement(c, { year: '2099', period: '2099-12-31', fw: 'IFRS' });
        temp = c;
        cid = c.id;
        year = '2099';
      }
      const ctx = { cos: new Set(), engs: new Set(), ok: 0 };
      for (const c of CO.list) {
        ctx.cos.add(String(c.id));
        for (const e of await CO.engs(c)) ctx.engs.add(c.id + '/' + e.year);
      }
      const base = '#/e/' + encodeURIComponent(cid) + '/' + encodeURIComponent(year);
      await this.go(base + '/dash');
      const routes = this.routes(base, ctx);
      let i = 0;
      for (const r of routes) {
        await this.go(r);
        this.inspect(r, ctx, issues);
        if (++i % 10 === 0 && out) out.innerHTML = `<p class="mut">تم فحص ${i} / ${routes.length} مسار…</p>`;
      }
      /* history: back / forward */
      const h1 = base + '/wp/' + encodeURIComponent('E-04'),
        h2 = base + '/tb';
      await this.go(h1);
      await this.go(h2);
      const back = await new Promise(res => {
        const f = () => {
          document.removeEventListener('meap:routed', f);
          setTimeout(() => res(CUR.view === 'wp' && CUR.arg === 'E-04'), 30);
        };
        document.addEventListener('meap:routed', f);
        history.back();
      });
      const fwd = await new Promise(res => {
        const f = () => {
          document.removeEventListener('meap:routed', f);
          setTimeout(() => res(CUR.view === 'tb'), 30);
        };
        document.addEventListener('meap:routed', f);
        history.forward();
      });
      /* deep link with Arabic encoding */
      const deep = base + '/search/' + encodeURIComponent('الإيرادات المؤجلة');
      await this.go(deep);
      const deepOk = CUR.view === 'search' && $('#main h1').textContent.includes('الإيرادات المؤجلة');
      this.res = {
        at: localISO(),
        ms: Math.round(performance.now() - t0),
        routes: routes.length,
        checked: ctx.ok,
        issues,
        history: { back, forward: fwd },
        deepLink: { hash: deep, ok: deepOk },
        reload: null,
        temp: temp ? temp.id : null,
      };
      if (temp) {
        await hub.closeEng();
        await hub.STORE.remove(temp._dir);
        await CO.load();
        this.res.tempRemoved = true;
      }
      /* reload test: store state, reload the page, verify the route renders again */
      try {
        sessionStorage.setItem(
          'meap.selftest.reload',
          JSON.stringify({ res: this.res, hash: temp ? '#/settings/general' : h1, view: temp ? 'settings' : 'wp' })
        );
        location.hash = '#/selftest';
        setTimeout(() => location.reload(), 60);
      } catch (e) {
        logErr('selftest reload store', e);
        this.finish();
      }
    } catch (e) {
      logErr('selftest', e);
      if (out) out.innerHTML = `<p class="note bad">${esc(errMsg(e))}</p>`;
    } finally {
      this.running = false;
    }
  },
  finish() {
    const o = $('#stout');
    if (o) o.innerHTML = this.reportHTML(this.res);
    window.__MEAP_SELFTEST = this.res;
  },
  reportHTML(r) {
    if (!r) return '';
    const by = {};
    r.issues.forEach(x => {
      (by[x.kind] = by[x.kind] || []).push(x);
    });
    const pass = !r.issues.length && r.history.back && r.history.forward && r.deepLink.ok && (!r.reload || r.reload.ok);
    return `<div class="card"><h2 style="margin-top:0">${pass ? '✅ كل الروابط سليمة' : '⚠ توجد مشكلات'}</h2><div class="kv"><div>المسارات المفحوصة</div><div>${r.routes}</div><div>الروابط/المراسي/الإحالات السليمة</div><div>${r.checked.toLocaleString('en-US')}</div><div>المشكلات</div><div>${r.issues.length}</div><div>الرجوع / التقدم</div><div>${r.history.back ? '✓' : '✗'} / ${r.history.forward ? '✓' : '✗'}</div><div>رابط عميق بترميز عربي</div><div>${r.deepLink.ok ? '✓' : '✗'} <span dir="ltr" class="small">${esc(r.deepLink.hash)}</span></div><div>إعادة التحميل</div><div>${r.reload ? (r.reload.ok ? '✓ ' + esc(r.reload.view) : '✗') : '—'}</div><div>المدة</div><div>${(r.ms / 1000).toFixed(1)} ث</div>${r.temp ? `<div>ارتباط مؤقت</div><div>${esc(r.temp)} ${r.tempRemoved ? '(حُذف)' : ''}</div>` : ''}</div></div>
  ${Object.keys(by)
    .map(
      k =>
        `<h3>${esc(k)} <span class="cnt">${by[k].length}</span></h3><div class="tw"><table><thead><tr><th>المسار</th><th>المشكلة</th><th>الهدف</th></tr></thead><tbody>${by[
          k
        ]
          .slice(0, 200)
          .map(
            x =>
              `<tr><td class="sm" dir="ltr">${esc(x.route)}</td><td>${esc(x.msg)}</td><td class="sm" dir="ltr">${esc(x.href)}</td></tr>`
          )
          .join('')}</tbody></table></div>`
    )
    .join('')}`;
  },
};

export { SELFTEST };
