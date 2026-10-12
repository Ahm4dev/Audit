/* Audit-Plus · V4 · References (55_ref) */

import { defineHub, hub } from '../hub.js';
import { W } from '../data/07-working-papers.js';
import { esc, fnv, normAr } from '../core/01-utils-i18n-storage.js';
import { CUR, errMsg } from '../core/03-data-engine.js';
import { CE, formDlg } from '../ui/04-ui-primitives.js';
import { G, L, RO, WP } from '../views/05-indexes.js';
import { attView } from '../modules/16-relations.js';
import { CT, ctLegOff, ctOff } from './32-catalog.js';

/* Bindings other modules reach through the hub (forward references / cross-module writes / overridden functions). */
defineHub({
  refChipHTML: [
    () => refChipHTML,
    v => {
      refChipHTML = v;
    },
  ],
  rowHTML: [
    () => rowHTML,
    v => {
      rowHTML = v;
    },
  ],
});

/* ===== 55_ref.js ===== */
/* =====================================================================
   v4 · Reference / comment column: each cell keeps its comment and can additionally link to another working
   paper or to an attachment of the current paper. Broken links (excluded papers) are shown disabled.
   ===================================================================== */
function refChipHTML(v) {
  if (!v || (!v.to && !v.att)) return '';
  let h = '';
  if (v.to) {
    const w = WP[v.to];
    const off = !w || !hub.wpAlive(v.to);
    h += off
      ? `<span class="wpl off" title="الورقة مستبعدة أو غير موجودة">⛓‍💥 ${esc(CT.items[v.to] ? CT.items[v.to].disp : v.to)}</span>`
      : `<a class="wpl" href="${L('wp/' + encodeURIComponent(v.to))}" title="${esc(w.ar)}">↗ ${esc(CT.items[v.to] ? CT.items[v.to].disp : v.to)}</a>`;
  }
  if (v.att) {
    const exists = v.from && G('wp.' + v.from + '.att.' + v.att, null);
    h += exists
      ? ` <a class="wpl" href="#" data-v4act="refatt" data-ref="${esc(v.from)}" data-att="${esc(v.att)}" title="فتح المرفق">📎 ${esc(v.an || 'مرفق')}</a>`
      : ` <span class="wpl off" title="المرفق محذوف">📎 ${esc(v.an || 'مرفق')} (محذوف)</span>`;
  }
  return h;
}
function refCandidates() {
  const out = [];
  for (const r of CT.order) {
    const it = CT.items[r];
    out.push([r, it.disp + ' — ' + it.ar, ctOff(r)]);
  }
  for (const w of W) {
    if (CT.leg[w[0]]) out.push([w[0], w[0] + ' — ' + w[2], ctLegOff(w[0])]);
  }
  return out.filter(x => !x[2]);
}
async function refPick(rk, ref) {
  const cur = G(rk, null) || {};
  const atts = hub.attListO(CUR.eng, { t: 'wp', id: ref });
  const cands = refCandidates();
  const res = await formDlg({
    title: 'ربط المرجع',
    html: `<p class="mut small">يبقى التعليق المكتوب في الخانة كما هو؛ هذا الربط إضافي. اختر ورقة عمل، أو مرفقًا من هذه الورقة، أو كليهما.</p>
 <label class="fl">البحث في أوراق العمل<input class="in" data-refq placeholder="اكتب جزءًا من الرقم أو الاسم…"></label>
 <label class="fl">ورقة العمل المرتبطة<select class="sel" name="to" size="6" data-refsel><option value="">— بدون —</option>${cands.map(x => `<option value="${esc(x[0])}"${cur.to === x[0] ? ' selected' : ''}>${esc(x[1])}</option>`).join('')}</select></label>
 <label class="fl">مرفق من الورقة الحالية<select class="sel" name="att"><option value="">— بدون —</option>${atts.map(a => `<option value="${esc(a.id)}"${cur.att === a.id ? ' selected' : ''}>${esc(a.name)}</option>`).join('')}</select></label>
 ${atts.length ? '' : '<p class="mut small">لا توجد مرفقات بهذه الورقة بعد — أرفق الملف من قسم «المرفقات» أسفل الورقة ثم عُد لربطه.</p>'}`,
    ok: 'حفظ الربط',
    onOk: async d => ({ to: d.to || '', att: d.att || '' }),
  });
  if (!res) return;
  const att = atts.find(a => a.id === res.att);
  const v = res.to || res.att ? { to: res.to || '', att: res.att || '', an: att ? att.name : '', from: ref } : null;
  CUR.eng.set(rk, v, { label: 'ربط مرجع' });
  const el = document.querySelector('[data-refk="' + rk + '"]');
  if (el) el.innerHTML = refChipHTML(v);
}
document.addEventListener('input', e => {
  const el = e.target;
  if (!(el instanceof Element) || !el.hasAttribute('data-refq')) return;
  const q = normAr(el.value);
  const sel = el.closest('form,.dlg').querySelector('[data-refsel]');
  if (!sel) return;
  [...sel.options].forEach(o => {
    o.hidden = q && o.value && !normAr(o.textContent).includes(q);
  });
});
document.addEventListener('click', async e => {
  const b = e.target instanceof Element && e.target.closest('[data-v4act]');
  if (!b) return;
  const a = b.dataset.v4act;
  if (a === 'refpick' && !RO()) {
    await refPick(b.dataset.rk, b.dataset.ref);
  } else if (a === 'refatt') {
    e.preventDefault();
    try {
      await attView(b.dataset.ref, b.dataset.att, b);
    } catch (x) {
      hub.toast(errMsg(x), 'e');
    }
  }
});
/* legacy free-form grids: add the same link button to every reference-like column */
const REFCOL = /(^|[\s-])(ref|wp)(\b|$)|مرجع|cross-ref/i;
function rowHTML(ref, g, cols, r, pre) {
  const di = r.id[0] === 'd' ? +r.id.slice(1) : -1;
  const ro = RO();
  return `<tr data-row="${esc(r.id)}">${cols
    .map((c, ci) => {
      const k = `wp.${ref}.g.${g}.v.${r.id}.${fnv(c)}`;
      const dv = di > -1 && pre[di] && pre[di][ci] != null ? String(pre[di][ci]) : '';
      const v = G(k, null);
      if (REFCOL.test(c) && !/amount|مبلغ|pop/i.test(c))
        return `<td class="refc"><div class="e ed" contenteditable="${ro ? 'false' : CE}" role="textbox" aria-label="${esc(c)}" data-k="${esc(k)}"${dv ? ` data-dv="${esc(dv)}"` : ''}>${esc(v == null ? dv : v)}</div><span class="refl" data-refk="${esc(k + '_r')}">${refChipHTML(G(k + '_r', null))}</span>${ro ? '' : `<button class="btn g sm noprint" type="button" data-v4act="refpick" data-rk="${esc(k + '_r')}" data-ref="${esc(ref)}" title="ربط بورقة عمل أو بمرفق" aria-label="ربط مرجع">🔗</button>`}</td>`;
      return `<td class="e" contenteditable="${ro ? 'false' : CE}" role="textbox" aria-label="${esc(c)}" data-k="${esc(k)}"${dv ? ` data-dv="${esc(dv)}"` : ''}>${esc(v == null ? dv : v)}</td>`;
    })
    .join(
      ''
    )}${ro ? '' : `<td class="noprint"><button class="btn g sm" type="button" data-act="delrow" data-ref="${esc(ref)}" data-g="${g}" data-row="${esc(r.id)}" aria-label="حذف الصف">✕</button></td>`}</tr>`;
}

export { refCandidates };
