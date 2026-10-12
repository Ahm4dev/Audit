/* Audit-Plus · V4 · Sampling (48_samp) */

import { defineHub, hub } from '../hub.js';
import { esc, fmtDT, fmtN, logErr, normAr, num } from '../core/01-utils-i18n-storage.js';
import { CUR, errMsg } from '../core/03-data-engine.js';
import { formDlg } from '../ui/04-ui-primitives.js';
import { G, L, RO } from '../views/05-indexes.js';
import { refreshBlock } from '../modules/15-working-papers.js';
import { TBW } from '../modules/20-trial-balance.js';
import { SAMP_RMM, SM, cgReg, matState } from './31-calc.js';
import { CT } from './32-catalog.js';
import { areaData, areaRmm } from './33-areas.js';

/* Bindings other modules reach through the hub (forward references / cross-module writes / overridden functions). */
defineHub({
  sampHTML: [
    () => sampHTML,
    v => {
      sampHTML = v;
    },
  ],
  smAfDef: [
    () => smAfDef,
    v => {
      smAfDef = v;
    },
  ],
  smConfDef: [
    () => smConfDef,
    v => {
      smConfDef = v;
    },
  ],
  smVals: [
    () => smVals,
    v => {
      smVals = v;
    },
  ],
});

/* ===== 48_samp.js ===== */
/* =====================================================================
   v4 · Sampling workbench embedded in test-of-details papers (ISA 530):
   MUS / attribute / classical variables / judgemental / 100% — sample size from materiality + RMM,
   population upload, seeded selection, results, error projection, stale-materiality detection.
   ===================================================================== */
const SAMPPOP = {};
const SMETH = [
  ['mus', 'المعاينة بالوحدة النقدية (MUS)'],
  ['attr', 'عينة السمات (اختبار الضوابط/الاستثناءات)'],
  ['classic', 'عينة المتغيرات الكلاسيكية (الانحراف المعياري)'],
  ['judg', 'عينة حكمية (عامل الاطمئنان)'],
  ['full', 'فحص 100%'],
];
const smK = ref => 'wp.' + ref + '.sm.';
let smConfDef = l => (SAMP_RMM.find(x => x[0] === l) || SAMP_RMM[1])[2];
let smAfDef = l => (SAMP_RMM.find(x => x[0] === l) || SAMP_RMM[1])[3];
function smRng(seed) {
  let h = 2166136261;
  for (const c of String(seed)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function smVals(ref, ctx) {
  const k = smK(ref),
    M = matState();
  const rm = ctx && ctx.area ? areaRmm(ctx.area.id) : 'M';
  const g = (f, d) => {
    const v = G(k + f, null);
    return v == null || v === '' ? d : v;
  };
  const popAuto = (ctx && ctx.pop) || 0;
  return {
    method: g('method', 'mus'),
    pop: num(g('pop', popAuto)),
    tm: num(g('tm', M.pm || 0)),
    emp: num(g('emp', '0')),
    conf: num(g('conf', String(smConfDef(rm) * 100))) / 100,
    tdr: num(g('tdr', '5')) / 100,
    edr: num(g('edr', '0')) / 100,
    sd: num(g('sd', '0')),
    N: num(g('N', '0')),
    af: num(g('af', String(smAfDef(rm)))),
    minn: num(g('minn', '10')),
    rm,
    seed: g('seed', ''),
    popAuto,
    pm: M.pm,
  };
}
function smCalc(v) {
  let r = null,
    note = '';
  const em = (v.tm * v.emp) / 100;
  if (v.method === 'mus') {
    r = SM.mus(v.pop, v.tm, em, v.conf);
    if (r) r.key = r.interval;
    else
      note =
        'تعذّر الاحتساب: تأكد أن قيمة المجتمع > 0 وأن الأهمية المقبولة (TM) أكبر من التحريف المتوقع × عامل التوسع.';
  } else if (v.method === 'attr') {
    r = SM.attr(v.conf, v.tdr, v.edr);
    if (!r) note = 'تعذّر الاحتساب: معدل الانحراف المقبول يجب أن يكون أكبر من المتوقع.';
  } else if (v.method === 'classic') {
    r = SM.classic(v.N, v.sd, v.tm, em, 0.2, 1 - v.conf);
    if (!r) note = 'أدخل عدد البنود (N) والانحراف المعياري للمجتمع وتأكد أن TM > التحريف المتوقع.';
  } else if (v.method === 'judg') {
    r = SM.judg(v.pop, v.tm, v.af, v.minn);
    if (!r) note = 'أدخل قيمة المجتمع و TM.';
  } else {
    r = { n: v.N || 0 };
    if (!v.N) note = 'فحص كامل: أدخل عدد البنود.';
  }
  return { r, note, em };
}
function smResBox(v, c) {
  if (!c.r) return `<div class="note warn">${esc(c.note)}</div>`;
  const r = c.r;
  return `<div class="v4res"><div><span>حجم العينة المحتسب</span><b>${r.n.toLocaleString('en-US')}</b></div>${r.interval ? `<div><span>فترة الاختيار / حد البنود الرئيسية</span><b dir="ltr">${fmtN(r.interval)}</b></div>` : ''}${v.method === 'attr' ? `<div><span>الانحرافات المسموحة</span><b>${r.k}</b></div>` : ''}<div><span>مستوى الثقة</span><b>${Math.round(v.conf * 100)}%</b></div><div class="v4resn">${{ mus: 'كل بند ≥ الفترة يُفحص بالكامل (بنود رئيسية)، والباقي بالاختيار المنتظم.', attr: 'إذا تجاوزت الانحرافات المسموحة فلا اعتماد على الرقابة/المجتمع.', classic: 'تُسقَط النتائج على المجتمع بمتوسط الخطأ × N.', judg: 'عدد البنود = قيمة المجتمع ÷ TM × عامل الاطمئنان (مع حد أدنى).', full: 'اختبار جميع البنود.' }[v.method] || ''}</div></div>`;
}
function sampHTML(ref, ctx) {
  return `<div class="card sampbox" data-block="smp|${esc(ref)}">${sampInner(ref, ctx)}</div>`;
}
hub.BLOCKS.smp = ref => {
  const it = CT.items[ref];
  const a = it && it.area ? CT.areaBy[it.area] : null;
  return sampInner(ref, { area: a, pop: a && hub.TBSTORE.ready() ? Math.abs(areaData(a.id).cy) : 0 });
};
function sampInner(ref, ctx) {
  const ro = RO();
  const k = smK(ref);
  const v = smVals(ref, ctx);
  const c = smCalc(v);
  const M = matState();
  const res = G(k + 'res', null);
  const sel = G(k + 'sel', null);
  const psum = G(k + 'popsum', null);
  const stale =
    res &&
    (res.pm !== M.pm ||
      res.rm !== v.rm ||
      (ctx && ctx.pop && Math.abs((res.pop || 0) - v.pop) > Math.max(1, M.pm || 0) * 0.0));
  const stalePM = res && res.pm !== M.pm,
    staleRM = res && res.rm !== v.rm;
  const inp = (f, lb, def, attrs) =>
    `<label>${lb}<input class="in" dir="ltr" inputmode="decimal" data-k="${k}${f}" data-smp="${f}" value="${esc(G(k + f, ''))}" placeholder="${esc(def == null ? '' : def)}"${attrs || ''}${ro ? ' readonly' : ''}></label>`;
  const showAttr = v.method === 'attr',
    showClassic = v.method === 'classic',
    showJudg = v.method === 'judg',
    showMus = v.method === 'mus';
  return `<h3 style="margin-top:0">🧮 حاسبة العينة وأداة الاختيار (ISA 530)</h3>
 ${!M.pm ? `<p class="note warn">لم تُحتسب الأهمية النسبية بعد — أكمل <a href="${L('wp/A500')}">A500</a> لتُملأ حدود TM تلقائيًا.</p>` : ''}
 ${res && (stalePM || staleRM) ? `<div class="note bad" data-stale>⚠ تغيّرت ${stalePM ? 'الأهمية النسبية (PM من ' + fmtN(res.pm) + ' إلى ' + fmtN(M.pm) + ')' : ''}${stalePM && staleRM ? ' و' : ''}${staleRM ? 'تقييم RMM للمجال' : ''} منذ آخر احتساب معتمد (${fmtDT(res.t)}). أعد الاحتساب واعتمده، وأعد الاختيار إن لزم. ${ro ? '' : '<button class="btn sm" type="button" data-v4act="smsave" data-ref="' + esc(ref) + '">اعتماد الاحتساب بالقيم الحالية</button>'}</div>` : ''}
 <div class="fgrid">
 <label>طريقة العينة<select class="sel" data-k="${k}method" data-dv="mus" data-smp="method" data-smref="1"${ro ? ' disabled' : ''}>${SMETH.map(o => `<option value="${o[0]}"${v.method === o[0] ? ' selected' : ''}>${o[1]}</option>`).join('')}</select></label>
 ${showAttr ? '' : inp('pop', 'قيمة المجتمع (افتراضي: رصيد الميزان بعد التسويات)', fmtN(v.popAuto))}
 ${showAttr ? '' : inp('tm', 'الأهمية المقبولة TM (افتراضي: PM)', M.pm ? fmtN(M.pm) : '')}
 ${showAttr ? '' : inp('emp', 'التحريف المتوقع % من TM', '0')}
 ${showAttr ? inp('tdr', 'معدل الانحراف المقبول %', '5') + inp('edr', 'معدل الانحراف المتوقع %', '0') : ''}
 ${inp('conf', 'مستوى الثقة % (افتراضي حسب RMM ' + { L: 'منخفض', M: 'متوسط', H: 'مرتفع' }[v.rm] + ')', Math.round(smConfDef(v.rm) * 100))}
 ${showClassic || v.method === 'full' || showAttr ? inp('N', 'عدد بنود المجتمع (N)', '') : ''}
 ${showClassic ? inp('sd', 'الانحراف المعياري لمبالغ المجتمع', '') : ''}
 ${showJudg ? inp('af', 'عامل الاطمئنان', smAfDef(v.rm)) + inp('minn', 'حد أدنى لعدد البنود', '10') : ''}
 </div>
 <div data-smout>${smResBox(v, c)}</div>
 ${c.r && !ro ? `<p class="noprint"><button class="btn sm" type="button" data-v4act="smsave" data-ref="${esc(ref)}">اعتماد الاحتساب</button> ${res ? `<span class="mut small">آخر اعتماد: n=${res.n.toLocaleString('en-US')} · PM ${fmtN(res.pm)} · ${fmtDT(res.t)}</span>` : ''}</p>` : ''}
 <h4>المجتمع والاختيار</h4>
 <p class="mut small">ارفع ملف المجتمع (Excel/CSV: رقم، مبلغ، بيان) للتسوية مع الميزان واختيار البنود بالبذرة العشوائية، أو أدخل البنود يدويًا في جدول الفحص.</p>
 ${ro ? '' : `<div class="row noprint"><label class="btn o sm" tabindex="0">⤒ رفع ملف المجتمع<input type="file" accept=".xlsx,.xlsm,.csv,.tsv,.txt" hidden data-smpop="${esc(ref)}"></label><label class="row small">البذرة (Seed) <input class="in" dir="ltr" style="width:7rem" data-k="${k}seed" value="${esc(G(k + 'seed', ''))}" placeholder="تلقائي"></label><button class="btn sm" type="button" data-v4act="smselect" data-ref="${esc(ref)}"${SAMPPOP[ref] || psum ? '' : ' disabled'}>اختيار العينة</button></div>`}
 ${psum ? `<div class="note ${ctx && ctx.pop && Math.abs(ctx.pop - psum.abs) > (M.pm || 1) ? 'warn' : 'ok'}">المجتمع المرفوع: <b>${esc(psum.file)}</b> — ${psum.count.toLocaleString('en-US')} بند · الإجمالي المطلق ${fmtN(psum.abs)} · صافي ${fmtN(psum.sum)}${ctx && ctx.pop ? ` · الفرق عن الميزان: <b dir="ltr">${fmtN(psum.abs - ctx.pop)}</b>${Math.abs(ctx.pop - psum.abs) > (M.pm || 1) ? ' (يتجاوز PM — اشرح الفرق قبل الاعتماد على العينة)' : ''}` : ''}${SAMPPOP[ref] ? '' : ' <span class="mut small">(أعد رفع الملف لإعادة الاختيار — البنود لا تُحفظ في الارتباط)</span>'}</div>` : ''}
 ${sampSelHTML(ref, v, sel, c)}`;
}
function sampSelHTML(ref, v, sel, c) {
  const ro = RO(),
    k = smK(ref);
  if (!sel || !sel.items)
    return `<h4>جدول الفحص والنتائج</h4><p class="mut small">لم يتم اختيار عينة بعد. أضف البنود يدويًا:</p>${cgReg(
      ref,
      'smman',
      {
        cols: [
          { k: 'id', h: 'رقم/مرجع البند', t: 't' },
          { k: 'd', h: 'البيان', t: 't' },
          { k: 'a', h: 'المبلغ الدفتري', t: 'n', sum: 1 },
          { k: 'r', h: 'نتيجة الفحص', t: 's', opts: ['', 'سليم', 'استثناء'] },
          { k: 'e', h: 'مبلغ الخطأ (+ تضخيم / − تخفيض)', t: 'n', sum: 1 },
          { k: 'w', h: 'المرجع / التعليق', t: 'r' },
        ],
        n: 5,
      }
    )}`;
  const it = sel.items;
  const body = it
    .map((x, i) => {
      const kk = k + 't.' + i + '.';
      return `<tr data-smrow="${i}"><td class="mut">${i + 1}</td><td class="ref">${esc(x.id)}${x.key ? ' <span class="b isa">رئيسي</span>' : ''}</td><td class="tx">${esc(x.desc || '')}</td><td class="num" dir="ltr">${fmtN(x.amt)}</td><td><select class="st" data-k="${kk}r" data-dv="" data-smt="1" aria-label="النتيجة"${ro ? ' disabled' : ''}><option value=""></option><option value="ok"${G(kk + 'r', '') === 'ok' ? ' selected' : ''}>سليم</option><option value="ex"${G(kk + 'r', '') === 'ex' ? ' selected' : ''}>استثناء</option></select></td><td><input class="in num" dir="ltr" inputmode="decimal" data-k="${kk}e" data-smt="1" value="${esc(G(kk + 'e', ''))}" aria-label="مبلغ الخطأ"${ro ? ' readonly' : ''}></td><td><input class="in" data-k="${kk}n" value="${esc(G(kk + 'n', ''))}" placeholder="تعليق / مرجع" aria-label="تعليق"${ro ? ' readonly' : ''}></td></tr>`;
    })
    .join('');
  return `<h4>جدول الفحص والنتائج <span class="cnt">${it.length}</span></h4><p class="mut small">اختيار بتاريخ ${fmtDT(sel.t)} · البذرة <b dir="ltr">${esc(sel.seed)}</b> · الطريقة ${esc((SMETH.find(o => o[0] === sel.method) || [0, sel.method])[1])}${sel.interval ? ` · الفترة ${fmtN(sel.interval)}` : ''} — الاختيار قابل للتكرار بنفس البذرة والملف.</p>
 <div class="tw"><table class="v4smt"><thead><tr><th>#</th><th>البند</th><th>البيان</th><th>المبلغ الدفتري</th><th>النتيجة</th><th>الخطأ (+ تضخيم)</th><th>تعليق</th></tr></thead><tbody>${body}</tbody></table></div>
 <div data-smproj>${smProject(ref, sel)}</div>`;
}
/* error projection and conclusion */
function smProject(ref, sel) {
  const k = smK(ref);
  const v = smVals(ref, null);
  const tm = v.tm || matState().pm || 0;
  const items = sel.items;
  let ex = 0,
    err = 0;
  const keyErr = [];
  const taints = [];
  items.forEach((x, i) => {
    const e = num(G(k + 't.' + i + '.e', ''));
    const r = G(k + 't.' + i + '.r', '');
    if (r === 'ex' || e) {
      ex++;
      err += e;
      if (x.key) keyErr.push(e);
      else if (x.amt) taints.push(Math.max(-1, Math.min(1, e / Math.abs(x.amt))));
    }
  });
  const m = sel.method;
  let out = '';
  if (m === 'mus') {
    const iv = sel.interval || 0;
    const pos = taints.filter(t => t > 0).sort((a, b) => b - a);
    const keySum = keyErr.reduce((s, x) => s + x, 0);
    let uel = iv * SM.rf(v.conf, 0);
    let prev = SM.rf(v.conf, 0);
    pos.forEach((t, j) => {
      const rf = SM.rf(v.conf, j + 1);
      uel += iv * (rf - prev) * t;
      prev = rf;
    });
    const proj = taints.reduce((s, t) => s + t * iv, 0);
    const total = uel + Math.max(0, keySum);
    const ok = tm > 0 && total <= tm;
    out = `<div class="v4res"><div><span>أخطاء مكتشفة</span><b>${ex}</b></div><div><span>التحريف المسقط (الأرجح)</span><b dir="ltr">${fmtN(proj + keySum)}</b></div><div><span>الحد الأعلى للتحريف (Stringer)</span><b dir="ltr">${fmtN(total)}</b></div><div><span>TM</span><b dir="ltr">${fmtN(tm)}</b></div></div><p class="note ${ok ? 'ok' : 'bad'}">${tm ? (ok ? 'الحد الأعلى للتحريف أقل من الأهمية المقبولة — العينة تدعم عدم وجود تحريف جوهري في المجتمع عند مستوى الثقة المحدد.' : 'الحد الأعلى للتحريف يتجاوز الأهمية المقبولة — وسّع العينة أو أطلب تسوية الإدارة أو نفّذ إجراءات إضافية.') : 'أكمل الأهمية النسبية لحساب النتيجة.'}</p>`;
  } else if (m === 'attr') {
    const n = items.length;
    const k_ = ex;
    let lo = 0,
      hi = 1;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (SM.binomCdf(k_, n, mid) > 1 - v.conf) lo = mid;
      else hi = mid;
    }
    const udr = hi;
    const ok = udr <= v.tdr;
    out = `<div class="v4res"><div><span>الانحرافات</span><b>${k_} من ${n}</b></div><div><span>معدل الانحراف في العينة</span><b>${n ? ((k_ / n) * 100).toFixed(1) : 0}%</b></div><div><span>الحد الأعلى للانحراف</span><b>${(udr * 100).toFixed(1)}%</b></div><div><span>المقبول</span><b>${(v.tdr * 100).toFixed(1)}%</b></div></div><p class="note ${ok ? 'ok' : 'bad'}">${ok ? 'الحد الأعلى للانحراف ضمن المقبول — يمكن الاعتماد.' : 'الحد الأعلى للانحراف يتجاوز المقبول — لا اعتماد على الضابط/المجتمع، أو وسّع العينة.'}</p>`;
  } else {
    const n = items.length || 1;
    const mean = err / n;
    const N = v.N || n;
    const proj = mean * N;
    const ok = tm > 0 && Math.abs(proj) <= tm;
    out = `<div class="v4res"><div><span>أخطاء مكتشفة</span><b>${ex}</b></div><div><span>إجمالي الأخطاء في العينة</span><b dir="ltr">${fmtN(err)}</b></div><div><span>التحريف المسقط على المجتمع</span><b dir="ltr">${fmtN(proj)}</b></div><div><span>TM</span><b dir="ltr">${fmtN(tm)}</b></div></div><p class="note ${ok ? 'ok' : 'warn'}">${tm ? (ok ? 'التحريف المسقط أقل من الأهمية المقبولة.' : 'التحريف المسقط يتجاوز TM — فكّر في توسيع العينة أو تسوية الفروق.') : 'أكمل الأهمية النسبية.'}</p>`;
  }
  return out;
}
/* ---------- events ---------- */
function smPreview(host) {
  if (!host) return;
  const ref = (host.dataset.block || '').split('|')[1];
  const it0 = CT.items[ref];
  const a = it0 && it0.area ? CT.areaBy[it0.area] : null;
  const g = f => {
    const el = host.querySelector('[data-smp="' + f + '"]');
    return el ? el.value : null;
  };
  const ctx = { area: a, pop: a && hub.TBSTORE.ready() ? Math.abs(areaData(a.id).cy) : 0 };
  const base = smVals(ref, ctx);
  const v = Object.assign({}, base);
  const M = matState();
  const num_ = (f, d) => {
    const x = g(f);
    return x == null || x === '' ? d : num(x);
  };
  v.method = g('method') || v.method;
  v.pop = num_('pop', ctx.pop);
  v.tm = num_('tm', M.pm || 0);
  v.emp = num_('emp', 0);
  v.conf = num_('conf', smConfDef(v.rm) * 100) / 100;
  v.tdr = num_('tdr', 5) / 100;
  v.edr = num_('edr', 0) / 100;
  v.sd = num_('sd', 0);
  v.N = num_('N', 0);
  v.af = num_('af', smAfDef(v.rm));
  v.minn = num_('minn', 10);
  const o = host.querySelector('[data-smout]');
  if (o) o.innerHTML = smResBox(v, smCalc(v));
}
document.addEventListener('input', e => {
  const el = e.target;
  if (el instanceof Element && el.dataset && el.dataset.smp && el.dataset.smp !== 'method')
    smPreview(el.closest('[data-block^="smp|"]'));
  if (el instanceof Element && el.dataset && el.dataset.smt) {
    const row = el.closest('tr');
    const host = el.closest('[data-block^="smp|"]');
    const ref = host && host.dataset.block.split('|')[1];
    const sel = ref && G(smK(ref) + 'sel', null);
    const p = host && host.querySelector('[data-smproj]');
    if (p && sel)
      setTimeout(() => {
        p.innerHTML = smProject(ref, sel);
      }, 30);
  }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (!(el instanceof Element) || !el.dataset) return;
  if (el.dataset.smref) {
    setTimeout(() => refreshBlock(el.closest('[data-block^="smp|"]').dataset.block), 60);
  }
  if (el.dataset.smt) {
    const host = el.closest('[data-block^="smp|"]');
    const ref = host && host.dataset.block.split('|')[1];
    const sel = ref && G(smK(ref) + 'sel', null);
    const p = host && host.querySelector('[data-smproj]');
    if (p && sel)
      setTimeout(() => {
        p.innerHTML = smProject(ref, sel);
      }, 30);
  }
  if (el.dataset.smpop && el.files && el.files[0]) smUpload(el.dataset.smpop, el.files[0]);
  if (el.dataset.smp && el.dataset.smp !== 'method') smPreview(el.closest('[data-block^="smp|"]'));
});
async function smUpload(ref, file) {
  try {
    const buf = await file.arrayBuffer();
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const r = await TBW.call('parse', { buf, sheet: 0 });
    const rows = (r.rows || []).filter(x => x && x.some(c => c !== '' && c != null));
    if (rows.length < 2) {
      hub.toast('الملف لا يحتوي بيانات كافية.', 'w');
      return;
    }
    const head = rows[0].map(c => String(c == null ? '' : c));
    const nc = Math.max(...rows.slice(0, 50).map(x => x.length));
    let ia = -1,
      ii = 0,
      id = -1;
    head.forEach((h, i) => {
      const n = normAr(h);
      if (ia < 0 && /مبلغ|قيمه|رصيد|amount|value|balance|total|اجمالي/.test(n)) ia = i;
      if (/رقم|كود|مرجع|id|ref|no|number|فاتوره|invoice/.test(n) && id < 0) ii = i;
      if (/بيان|وصف|اسم|desc|name|details/.test(n)) id = i;
    });
    if (ia < 0) {
      let best = -1,
        bs = -1;
      for (let c = 0; c < nc; c++) {
        const s = rows.slice(1, 50).filter(x => x[c] !== '' && isFinite(num(x[c])) && num(x[c]) !== 0).length;
        if (s > bs) {
          bs = s;
          best = c;
        }
      }
      ia = best;
    }
    const opts = sel =>
      head
        .concat(new Array(Math.max(0, nc - head.length)).fill(''))
        .map((h, i) => `<option value="${i}"${i === sel ? ' selected' : ''}>${i + 1} — ${esc(h || '(عمود)')}</option>`)
        .join('');
    const res = await formDlg({
      title: 'ملف المجتمع — تحديد الأعمدة',
      html: `<p class="mut small">${rows.length - 1} صف تقريبًا. الصف الأول يُعدّ عناوين.</p><div class="fgrid"><label>عمود رقم/مرجع البند<select class="sel" name="ci">${opts(ii)}</select></label><label>عمود المبلغ<select class="sel" name="ca">${opts(ia)}</select></label><label>عمود البيان<select class="sel" name="cd"><option value="-1">—</option>${opts(id)}</select></label></div><div class="tw"><table><tbody>${rows
        .slice(0, 4)
        .map(
          x =>
            `<tr>${x
              .slice(0, 6)
              .map(c => `<td class="sm">${esc(String(c == null ? '' : c).slice(0, 25))}</td>`)
              .join('')}</tr>`
        )
        .join('')}</tbody></table></div>`,
      ok: 'اعتماد',
      onOk: async d => ({ ci: +d.ci, ca: +d.ca, cd: +d.cd }),
    });
    if (!res) return;
    const items = [];
    let sum = 0,
      abs = 0;
    for (let i = 1; i < rows.length; i++) {
      const x = rows[i];
      const a = num(x[res.ca]);
      if (!a && String(x[res.ca] || '') === '') continue;
      items.push({
        id: String(x[res.ci] == null ? i : x[res.ci]),
        amt: a,
        desc: res.cd > -1 ? String(x[res.cd] == null ? '' : x[res.cd]) : '',
      });
      sum += a;
      abs += Math.abs(a);
    }
    SAMPPOP[ref] = { items, file: file.name };
    CUR.eng.set(
      smK(ref) + 'popsum',
      {
        file: file.name,
        count: items.length,
        sum: Math.round(sum * 100) / 100,
        abs: Math.round(abs * 100) / 100,
        by: hub.SESSION.id,
        t: Date.now(),
      },
      { label: 'ملف مجتمع العينة' }
    );
    if (!G(smK(ref) + 'N', '')) CUR.eng.set(smK(ref) + 'N', String(items.length), { noUndo: true });
    refreshBlock('smp|' + ref);
    hub.toast('تم تحميل ' + items.length.toLocaleString('en-US') + ' بند.', 's');
  } catch (e) {
    logErr('sample population', e);
    hub.toast('تعذرت قراءة الملف: ' + errMsg(e), 'e');
  }
}
document.addEventListener('click', e => {
  const b = e.target instanceof Element && e.target.closest('[data-v4act]');
  if (!b) return;
  const a = b.dataset.v4act;
  if (a !== 'smsave' && a !== 'smselect') return;
  const ref = b.dataset.ref;
  if (RO()) return;
  const host = b.closest('[data-block^="smp|"]');
  const it0 = CT.items[ref];
  const area = it0 && it0.area ? CT.areaBy[it0.area] : null;
  const ctx = { area, pop: area && hub.TBSTORE.ready() ? Math.abs(areaData(area.id).cy) : 0 };
  if (a === 'smsave') {
    const v = smVals(ref, ctx);
    const c = smCalc(v);
    if (!c.r) {
      hub.toast('لا يمكن الاعتماد قبل اكتمال المدخلات.', 'w');
      return;
    }
    const M = matState();
    CUR.eng.set(
      smK(ref) + 'res',
      {
        n: c.r.n,
        interval: c.r.interval || 0,
        method: v.method,
        conf: v.conf,
        tm: v.tm,
        pm: M.pm,
        om: M.om,
        rm: v.rm,
        pop: v.pop,
        by: hub.SESSION.id,
        t: Date.now(),
      },
      { label: 'اعتماد حجم العينة' }
    );
    CUR.eng.setMany(
      {
        ['wp.' + ref + '.h.smeth']: (SMETH.find(o => o[0] === v.method) || [0, ''])[1],
        ['wp.' + ref + '.h.ssize']: String(c.r.n),
      },
      { noUndo: true }
    );
    refreshBlock(host.dataset.block);
    hub.toast('تم اعتماد حجم العينة: ' + c.r.n.toLocaleString('en-US'), 's');
  } else {
    const P = SAMPPOP[ref];
    if (!P) {
      hub.toast('أعد رفع ملف المجتمع أولًا.', 'w');
      return;
    }
    const v = smVals(ref, ctx);
    const c = smCalc(v);
    if (!c.r) {
      hub.toast('أكمل مدخلات الاحتساب أولًا.', 'w');
      return;
    }
    const seed = G(smK(ref) + 'seed', '') || String(Math.floor(Math.random() * 900000 + 100000));
    if (!G(smK(ref) + 'seed', '')) CUR.eng.set(smK(ref) + 'seed', seed, { noUndo: true });
    const rnd = smRng(seed);
    let sel = [];
    let interval = 0;
    const items = P.items;
    if (v.method === 'full') sel = items.map(x => Object.assign({}, x));
    else if (v.method === 'mus') {
      interval = c.r.interval;
      const keys = items.filter(x => Math.abs(x.amt) >= interval).map(x => Object.assign({ key: 1 }, x));
      const rest = items.filter(x => Math.abs(x.amt) < interval);
      const R = rest.reduce((s, x) => s + Math.abs(x.amt), 0);
      const nRem = Math.max(1, c.r.n - keys.length);
      const iv2 = R / nRem || interval;
      let pos = rnd() * iv2,
        cum = 0,
        j = 0;
      const picked = new Set();
      for (const x of rest) {
        cum += Math.abs(x.amt);
        while (pos < cum && j < nRem) {
          picked.add(x);
          pos += iv2;
          j++;
        }
      }
      sel = keys.concat([...picked].map(x => Object.assign({}, x)));
      interval = iv2;
    } else {
      const n = Math.min(c.r.n, items.length);
      const idx = items.map((_, i) => i);
      for (let i = idx.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [idx[i], idx[j]] = [idx[j], idx[i]];
      }
      sel = idx
        .slice(0, n)
        .sort((x, y) => x - y)
        .map(i => Object.assign({}, items[i]));
    }
    const o = {};
    for (const [kk] of CUR.eng.entries(smK(ref) + 't.')) o[kk] = null;
    CUR.eng.setMany(o, { noUndo: true });
    CUR.eng.set(
      smK(ref) + 'sel',
      {
        seed,
        method: v.method,
        n: c.r.n,
        interval: Math.round(interval),
        conf: v.conf,
        items: sel.slice(0, 5000),
        t: Date.now(),
        by: hub.SESSION.id,
      },
      { label: 'اختيار العينة' }
    );
    refreshBlock(host.dataset.block);
    hub.toast('تم اختيار ' + sel.length.toLocaleString('en-US') + ' بند (بذرة ' + seed + ').', 's');
  }
});

export { SMETH, smCalc, smK };
