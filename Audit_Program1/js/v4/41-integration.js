/* Audit-Plus · V4 · Integration (62_integ) */

import { hub } from '../hub.js';
import { CFREQ } from '../data/03-evidence-deficiency-sampling.js';
import { esc, normAr } from '../core/01-utils-i18n-storage.js';
import { can } from '../core/02-auth.js';
import { G, L, V } from '../views/05-indexes.js';
import { matState } from './31-calc.js';
import { CT, ctOff, matStrip, stChip } from './32-catalog.js';
import { AREA_SIGN, areaData, areaRmm, fm, rmmB } from './33-areas.js';
import { SMETH } from './34-sampling.js';

/* ===== 62_integ.js ===== */
/* =====================================================================
   v4 · Integration: sampling hub page, materiality single source, etc.
   ===================================================================== */
V.sampling = function () {
  const M = matState();
  const tods = CT.order.filter(r => CT.items[r].kind === 'tod' && !ctOff(r));
  const tocs = ['C050'].filter(r => CT.items[r] && !ctOff(r));
  const row = r => {
    const it = CT.items[r];
    const a = it.area ? CT.areaBy[it.area] : null;
    const res = G('wp.' + r + '.sm.res', null);
    const stale = res && M.pm && res.pm && res.pm !== M.pm;
    return `<tr><td>${hub.wpL(r)}</td><td>${esc(a ? a.ar : it.ar)}</td><td class="num" dir="ltr">${a && hub.TBSTORE.ready() ? fm(areaData(a.id).cy * AREA_SIGN(a)) : '—'}</td><td>${a ? rmmB(areaRmm(a.id)) : ''}</td><td>${res ? `${esc((SMETH.find(x => x[0] === res.method) || [0, res.method])[1])} · <b>${res.n}</b>${stale ? ' <span class="b M" title="تغيّرت الأهمية بعد اعتماد العينة">أعد الحساب</span>' : ''}` : '<span class="mut">لم تُعتمد</span>'}</td></tr>`;
  };
  return `<h1>العينات والأهمية النسبية</h1><p class="sub">الأهمية تُحتسب مرة واحدة في A500 وتنتقل تلقائيًا إلى كل حاسبات العينات وأوراق العمل؛ وحجم العينة يُحسب داخل ورقة العينات الجوهرية لكل مجال وفق طريقة معيارية (MUS / سمات / كلاسيكية / حكمية).</p>
 ${matStrip()}<p><a class="btn o" href="${L('wp/A500')}">فتح ورقة حساب الأهمية النسبية (A500)</a> <a class="btn g" href="${L('wp/A230')}">عوامل خطر الارتباط</a></p>
 <h2>العينات الجوهرية حسب المجال</h2><div class="tw"><table><thead><tr><th>الورقة</th><th>المجال</th><th>الرصيد</th><th>RMM</th><th>العينة المعتمدة</th></tr></thead><tbody>${tods.map(row).join('')}</tbody></table></div>
 ${tocs.length ? `<h2>اختبارات الرقابة</h2><p>${hub.wpL(tocs.join(' '))} — أحجام العينات حسب تكرار الرقابة ومستوى الثقة (ISA 530 / ISA 330).</p>` : ''}
 <h2>حجم عينات اختبار الضوابط حسب التكرار</h2><div class="tw"><table><thead><tr><th>التكرار</th><th>مرات الأداء السنوي</th><th>العينة (خطر منخفض)</th><th>العينة (خطر مرتفع)</th></tr></thead><tbody>${CFREQ.map(r => `<tr>${r.map(x => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
};
/* ---- working-paper library = the catalog (all papers, with status and exclusion) ---- */
V.wplib = function () {
  const rows = CT.order.map(r => CT.items[r]);
  const P = hub.catProg(CT.order.filter(r => !ctOff(r)));
  const can_ = can('edit');
  return `<h1>مكتبة أوراق العمل</h1><p class="sub">${rows.length} ورقة في 7 أقسام · المكتمل ${P.d} · تحت المراجعة ${P.rv} · قيد الإعداد ${P.pg} · لم يبدأ ${P.ns}. الأوراق المستبعدة تبقى هنا ويمكن استرجاعها بكامل بياناتها وروابطها.</p>
 <p class="row noprint"><input class="in" data-v4act="wlq" placeholder="بحث بالرقم أو الاسم…" aria-label="بحث"><select class="sel" data-v4act="wls" aria-label="القسم"><option value="">كل الأقسام</option>${CT.secs.map(s => `<option value="${s.id}">${esc(s.ar)}</option>`).join('')}</select><select class="sel" data-v4act="wlt" aria-label="الحالة"><option value="">كل الحالات</option><option value="ns">لم تبدأ</option><option value="pg">قيد العمل</option><option value="rv">مراجعة</option><option value="dn">مكتملة</option><option value="off">مستبعدة</option></select>${can_ ? `<button class="btn o sm" type="button" data-v4act="catnew">+ ورقة عمل مخصصة</button>` : ''}</p>
 <div class="tw"><table class="wlt"><thead><tr><th>المرجع</th><th>الورقة</th><th>القسم</th><th>المجال</th><th>الحالة</th><th class="noprint"></th></tr></thead><tbody>${rows
   .map(it => {
     const off = ctOff(it.ref);
     const a = it.area ? CT.areaBy[it.area] : null;
     const s = off ? 'off' : hub.wpSt4(it.ref);
     return `<tr data-wls="${it.sec}" data-wlt="${s}" data-wlq="${esc(normAr(it.disp + ' ' + it.ar + ' ' + it.en))}"${off ? ' class="off"' : ''}><td class="ref">${hub.wpL(it.ref)}</td><td class="tx">${esc(it.ar)}</td><td class="sm">${esc((CT.secs.find(x => x.id === it.sec) || {}).ar || '')}</td><td class="sm">${a ? esc(a.ar) : ''}</td><td>${off ? '<span class="b">مستبعدة</span>' : stChip(it.ref)}</td><td class="noprint">${can_ ? (off ? `<button class="btn sm" type="button" data-v4act="catrestore" data-ref="${esc(it.ref)}">استرجاع</button>` : `<button class="btn g sm" type="button" data-v4act="catex" data-ref="${esc(it.ref)}" title="استبعاد من الارتباط (إخفاء مع فصل الروابط)">استبعاد</button>`) : ''}</td></tr>`;
   })
   .join('')}</tbody></table></div>`;
};
function wlFilter() {
  const q = normAr((document.querySelector('[data-v4act=wlq]') || {}).value || ''),
    s = (document.querySelector('[data-v4act=wls]') || {}).value || '',
    t = (document.querySelector('[data-v4act=wlt]') || {}).value || '';
  document.querySelectorAll('#main tr[data-wls]').forEach(tr => {
    tr.hidden = !((!q || tr.dataset.wlq.includes(q)) && (!s || tr.dataset.wls === s) && (!t || tr.dataset.wlt === t));
  });
}
document.addEventListener('input', e => {
  const el = e.target;
  if (el instanceof Element && el.dataset && el.dataset.v4act === 'wlq') wlFilter();
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el instanceof Element && el.dataset && (el.dataset.v4act === 'wls' || el.dataset.v4act === 'wlt')) wlFilter();
});
