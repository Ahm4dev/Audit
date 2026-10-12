/* Audit-Plus · v8 · PBC view — لوحة المتابعة، القائمة، ملف العميل، المتابعة، التغطية */

import { hub } from '../hub.js';
import { IND } from '../data/06-cycles-it-components.js';
import { esc, logErr, normAr } from '../core/01-utils-i18n-storage.js';
import { CUR, errMsg } from '../core/03-data-engine.js';
import { G, L, RO, V, bar } from '../views/05-indexes.js';
import { vcache } from '../modules/16-relations.js';
import { VLABEL } from '../app/28-gate-router-settings.js';
import { APP_FLAGS } from '../v4/35-extras.js';
import {
  PB_CATBY,
  PB_CATS,
  PB_DOC,
  PB_FLAGS,
  PB_LEGAL,
  PB_PHASE,
  PB_PHL,
  PB_PRI,
  PB_PRL,
  PB_SECTORS,
  PB_ST,
  PB_STL,
  pbAll,
  pbAtoms,
  pbFlagMode,
  pbFsCoverage,
  pbK,
  pbLog,
  pbOwners,
  pbProfile,
  pbRaw,
  pbRowsAll,
  pbStats,
  pbStatsAll,
  pbToday,
} from './50-pbc-core.js';

const PBUI = {
  tab: 'dash',
  f: { q: '', st: '', pr: '', ph: '', ow: '', doc: '', cat: '', show: '' },
  open: new Set(),
  sel: new Set(),
  xr: new Set(),
  all: false,
};
const PB_TABS = [
  ['dash', 'لوحة المتابعة'],
  ['list', 'قائمة المتطلبات'],
  ['profile', 'ملف العميل'],
  ['follow', 'المتابعة والمراسلات'],
  ['cover', 'تغطية القوائم'],
  ['io', 'تصدير واستيراد'],
];
VLABEL.pbc = 'متطلبات العميل';
const pbPct = (a, b) => (b ? Math.round((a * 100) / b) : 0);
const pbDate = d => (d ? `<span dir="ltr">${esc(d)}</span>` : '<span class="mut">—</span>');
/* ---------- فهارس مساعدة ---------- */
function pbAttIdx() {
  return vcache('pbatt', () => {
    const m = {};
    for (const [k] of CUR.eng.entries('pbx.')) {
      const x = /^pbx\.([^.]+)\.att\.([^.]+)$/.exec(k);
      if (x) m[x[1]] = (m[x[1]] || 0) + 1;
    }
    return m;
  });
}
function pbOwnerNames() {
  const s = new Set(
    pbOwners()
      .map(o => o.name)
      .filter(Boolean)
  );
  for (const r of pbRowsAll()) if (r.ow) s.add(r.ow);
  return [...s].sort((a, b) => a.localeCompare(b, 'ar'));
}
function pbMatch(r) {
  const f = PBUI.f;
  if (f.show === 'na') {
    if (r.appRaw && r.st !== 'na') return false;
  } else if (f.show !== 'all') {
    if (!r.app) return false;
  }
  if (f.cat && r.cat !== f.cat) return false;
  if (f.pr && r.pr !== f.pr) return false;
  if (f.ph && r.ph !== f.ph) return false;
  if (f.ow) {
    if (f.ow === '-') {
      if (r.ow) return false;
    } else if (r.ow !== f.ow) return false;
  }
  if (f.doc) {
    const c = PB_CATBY[r.cat];
    if (!c || c.doc !== f.doc) return false;
  }
  if (f.st) {
    const s = f.st;
    if (s === 'open') {
      if (!r.open) return false;
    } else if (s === 'od') {
      if (!r.od) return false;
    } else if (s === 'soon') {
      if (!r.soon) return false;
    } else if (s === 'done') {
      if (!r.done) return false;
    } else if (s === 'hi') {
      if (!(r.open && r.pr === 'H')) return false;
    } else if (s === 'att') {
      if (!pbAttIdx()[r.id]) return false;
    } else if (s === 'noatt') {
      if (pbAttIdx()[r.id] || !r.done) return false;
    } else if (r.st !== s) return false;
  }
  if (f.q) {
    const q = normAr(f.q);
    if (!normAr(r.t + ' ' + r.ref + ' ' + r.ow + ' ' + r.nt + ' ' + r.sub).includes(q)) return false;
  }
  return true;
}
const pbFiltering = () => {
  const f = PBUI.f;
  return !!(f.q || f.st || f.pr || f.ph || f.ow || f.doc || f.cat || f.show);
};
/* ---------- هيكل الصفحة ---------- */
V.pbc = function (arg) {
  const tab = PB_TABS.some(t => t[0] === arg) ? arg : PBUI.tab || 'dash';
  PBUI.tab = tab;
  const S = pbStatsAll();
  let body = '';
  try {
    body = {
      dash: pbDashHTML,
      list: pbListPage,
      profile: pbProfileHTML,
      follow: pbFollowHTML,
      cover: pbCoverHTML,
      io: pbIOHTML,
    }[tab]();
  } catch (e) {
    logErr('pbc view ' + tab, e);
    body = `<div class="note bad">تعذر عرض هذا القسم: ${esc(errMsg(e))}</div>`;
  }
  return `<div class="pbx"><div class="pbx-head"><div><h1>متطلبات المراجعة من العميل</h1><p class="sub">قائمة PBC الديناميكية: تُبنى من ملف العميل (الشكل القانوني + القطاع + الأنشطة) وتتابع الاستلام والتأخير والمسؤول والاستحقاق حتى إغلاق الملف.</p></div>
 <div class="pbx-big" role="status" aria-label="نسبة الإنجاز"><b data-pbk="pct">${S.pct}%</b><span>استُكمل ${S.res} من ${S.tot}</span>${bar(S.pct)}</div></div>
 <nav class="pbx-tabs noprint" role="tablist" aria-label="أقسام المتطلبات">${PB_TABS.map(t => `<a role="tab" href="${L('pbc/' + t[0])}"${t[0] === tab ? ' aria-selected="true" aria-current="page"' : ' aria-selected="false"'}>${esc(t[1])}${t[0] === 'follow' && S.od ? ` <span class="cnt bad">${S.od}</span>` : ''}</a>`).join('')}</nav>
 <div class="pbx-body" data-block="pbx|${tab}">${body}</div></div>`;
};
hub.BLOCKS.pbx = arg =>
  ({
    dash: pbDashHTML,
    list: pbListPage,
    profile: pbProfileHTML,
    follow: pbFollowHTML,
    cover: pbCoverHTML,
    io: pbIOHTML,
    kpi: pbKpiHTML,
    listbody: pbListBody,
  })[arg]();
/* ---------- بطاقات المؤشرات ---------- */
function pbKpiHTML() {
  const S = pbStatsAll();
  const c = (n, l, cls, f) =>
    `<a class="pbk ${cls || ''}" href="${L('pbc/list')}" data-pb="kfilter" data-f="${f || ''}"><b>${n}</b><span>${l}</span></a>`;
  return `<div class="pbk-row">${c(S.tot, 'بند منطبق', '', '')}${c(S.done, 'تم استلامه/فحصه', 'ok', 'done')}${c(S.open, 'مفتوح (لم يُستلم)', '', 'open')}${c(S.nr, 'لم يُطلب بعد', 'mut', 'nr')}${c(S.od, 'متأخر', 'bad', 'od')}${c(S.soon, 'يستحق خلال 7 أيام', 'warn', 'soon')}${c(S.hiOpen, 'عالي الأولوية ومفتوح', 'bad', 'hi')}${c(S.nv, 'لا يوجد لدى العميل', 'warn', 'nv')}</div>`;
}
/* ---------- لوحة المتابعة ---------- */
function pbDashHTML() {
  const D = pbAll(),
    S = pbStatsAll(),
    p = pbProfile(),
    ro = RO();
  const today = pbToday();
  const needProfile = !pbRaw('pbx._prof');
  let h = '';
  if (needProfile)
    h += `<div class="note warn pbx-nudge"><b>لم يُراجَع ملف العميل بعد.</b> القائمة الحالية مبنية على القطاع الأساسي للارتباط فقط (${p.sectors.length ? esc(p.sectors.map(s => (PB_SECTORS.find(x => x[0] === s) || [0, s])[1]).join('، ')) : 'غير محدد'}). حدّد الشكل القانوني والأنشطة لتظهر المتطلبات الخاصة وتختفي غير المنطبقة. <a class="btn o sm" href="${L('pbc/profile')}">فتح ملف العميل</a></div>`;
  h += `<div data-block="pbx|kpi">${pbKpiHTML()}</div>`;
  /* المراحل */
  h += `<h2>التقدم بحسب مرحلة الارتباط</h2><div class="tw"><table class="pbt"><thead><tr><th>المرحلة</th><th>موعد التسليم</th><th>الإجمالي</th><th>مستلم</th><th>مفتوح</th><th>متأخر</th><th>التقدم</th></tr></thead><tbody>${PB_PHASE.map(
    ([k, l]) => {
      const rows = D.rows.filter(r => r.ph === k);
      const s = pbStats(rows);
      if (!s.tot) return '';
      return `<tr><td><a href="${L('pbc/list')}" data-pb="kfilter" data-ph="${k}"><b>${esc(l)}</b></a></td><td><input class="in" type="date" dir="ltr" value="${esc(p.due[k] || '')}" data-pbdue="${k}" aria-label="موعد مرحلة ${esc(l)}"${ro ? ' readonly' : ''}></td><td>${s.tot}</td><td>${s.done}</td><td>${s.open}</td><td class="${s.od ? 'bad' : ''}">${s.od}</td><td class="pbbar">${bar(s.pct)}<small>${s.pct}%</small></td></tr>`;
    }
  ).join('')}</tbody></table></div>
 <p class="mut small">موعد المرحلة يُطبَّق تلقائيًا على كل بند بلا موعد خاص به؛ ويمكن تحديد موعد مختلف لأي بند من قائمة المتطلبات.</p>`;
  /* الفئات */
  h += `<h2>التقدم بحسب الفئة</h2><div class="pbcats">${D.cats
    .map(c => {
      const s = pbStats(c.rows);
      if (!s.tot) return '';
      return `<a class="pbcat-card" href="${L('pbc/list')}" data-pb="kfilter" data-cat="${esc(c.id)}"><span class="t">${esc(c.ar)}</span><span class="m">${s.res}/${s.tot}${s.od ? ` · <b class="bad">${s.od} متأخر</b>` : ''}</span>${bar(s.pct)}</a>`;
    })
    .join('')}</div>`;
  /* المسؤولون */
  const own = {};
  D.rows.forEach(r => {
    if (!r.app) return;
    const k = r.ow || '— غير معيّن —';
    const o = own[k] || (own[k] = { n: k, tot: 0, open: 0, od: 0, done: 0 });
    o.tot++;
    if (r.open) o.open++;
    if (r.od) o.od++;
    if (r.res) o.done++;
  });
  const ol = Object.values(own).sort((a, b) => b.od - a.od || b.open - a.open);
  h += `<h2>التقدم بحسب المسؤول لدى العميل</h2><div class="tw"><table class="pbt"><thead><tr><th>المسؤول</th><th>الإجمالي</th><th>مستلم</th><th>مفتوح</th><th>متأخر</th></tr></thead><tbody>${ol.map(o => `<tr><td>${o.n.startsWith('—') ? `<a href="${L('pbc/list')}" data-pb="kfilter" data-ow="-">${esc(o.n)}</a>` : `<a href="${L('pbc/list')}" data-pb="kfilter" data-ow="${esc(o.n)}">${esc(o.n)}</a>`}</td><td>${o.tot}</td><td>${o.done}</td><td>${o.open}</td><td class="${o.od ? 'bad' : ''}">${o.od}</td></tr>`).join('')}</tbody></table></div>`;
  /* أقرب الاستحقاقات */
  const nxt = D.rows
    .filter(r => r.open && r.dueEff)
    .sort((a, b) => (a.dueEff < b.dueEff ? -1 : a.dueEff > b.dueEff ? 1 : 0))
    .slice(0, 12);
  h += `<h2>أقرب الاستحقاقات والمتأخرات</h2>${nxt.length ? `<div class="tw"><table class="pbt"><thead><tr><th>البند</th><th>الفئة</th><th>المسؤول</th><th>الاستحقاق</th><th>الحالة</th></tr></thead><tbody>${nxt.map(r => `<tr class="${r.od ? 'od' : ''}"><td class="tx">${esc(r.t)}</td><td>${esc((D.cats.find(c => c.id === r.cat) || {}).ar || '')}</td><td>${esc(r.ow || '—')}</td><td>${pbDate(r.dueEff)}${r.od ? ' <b class="bad">متأخر</b>' : ''}</td><td>${esc(PB_STL[r.st])}</td></tr>`).join('')}</tbody></table></div>` : '<p class="mut">لا توجد بنود مفتوحة بمواعيد. حدّد مواعيد المراحل أعلاه أو من «ملف العميل».</p>'}`;
  return h;
}
/* ---------- القائمة ---------- */
function pbListPage() {
  const D = pbAll(),
    f = PBUI.f;
  const ro = RO();
  const sel = (k, opts, lab) =>
    `<label class="pbf"><span>${lab}</span><select class="sel" data-pbfilter="${k}">${opts.map(o => `<option value="${esc(o[0])}"${f[k] === o[0] ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`;
  const owners = pbOwnerNames();
  const docs = [...new Set(PB_CATS.map(c => c.doc).filter(Boolean))];
  return `<div data-block="pbx|kpi">${pbKpiHTML()}</div>
 <div class="pbfilters noprint"><label class="pbf pbq"><span>بحث</span><input class="in" type="search" data-pbfilter="q" placeholder="ابحث في البنود والمعايير والمسؤول والملاحظات…" value="${esc(f.q)}"></label>
  ${sel('st', [['', 'كل الحالات'], ['open', 'مفتوح (لم يُستلم)'], ['od', 'متأخر'], ['soon', 'يستحق قريبًا'], ['hi', 'عالي الأولوية ومفتوح'], ['done', 'مستلم / مفحوص'], ...PB_ST.filter(s => s[0] !== 'na').map(s => [s[0], s[1]]), ['att', 'لديه مرفقات'], ['noatt', 'مستلم بلا مرفق']], 'الحالة')}
  ${sel('pr', [['', 'الكل'], ...PB_PRI], 'الأولوية')}${sel('ph', [['', 'الكل'], ...PB_PHASE], 'المرحلة')}
  ${sel('ow', [['', 'الكل'], ['-', '— غير معيّن —'], ...owners.map(o => [o, o])], 'المسؤول')}
  ${sel('doc', [['', 'الكل'], ...docs.map(d => [d, PB_DOC[d] || d])], 'نوع المستند')}
  ${sel('cat', [['', 'كل الفئات'], ...D.cats.map(c => [c.id, c.ar])], 'الفئة')}
  ${sel(
    'show',
    [
      ['', 'المنطبقة فقط'],
      ['all', 'المنطبقة وغير المنطبقة'],
      ['na', 'غير المنطبقة / المخفية فقط'],
    ],
    'العرض'
  )}
  <button class="btn g sm" type="button" data-pb="fclear">مسح التصفية</button></div>
 <div class="pbtools noprint"><button class="btn g sm" type="button" data-pb="expand">فتح كل الفئات</button><button class="btn g sm" type="button" data-pb="collapse">طيّ الكل</button>
  ${ro ? '' : `<button class="btn o sm" type="button" data-pb="add">+ إضافة بند</button><button class="btn g sm" type="button" data-pb="addcat">+ فئة جديدة</button><button class="btn g sm" type="button" data-pb="selvis">تحديد الظاهر</button><button class="btn g sm" type="button" data-pb="selnone">إلغاء التحديد</button><button class="btn" type="button" data-pb="bulk" data-sel-count>إجراء جماعي على المحدد (<span data-pbsel>${PBUI.sel.size}</span>)</button>`}</div>
 <datalist id="pb-owners">${owners.map(o => `<option value="${esc(o)}">`).join('')}</datalist>
 <div class="pblist" data-block="pbx|listbody">${pbListBody()}</div>`;
}
function pbListBody() {
  const D = pbAll();
  const filt = pbFiltering();
  let h = '';
  const gname = {
    A: 'أساسيات الارتباط والحوكمة',
    B: 'النظم والسجلات والرقابة الداخلية',
    C: 'الأرصدة ودورات العمليات',
    D: 'متطلبات القطاع والنشاط',
    E: 'الأحداث اللاحقة والمجموعة والقوائم والإقفال',
    X: 'فئات وبنود مخصصة',
  };
  let shown = 0;
  for (const g of ['A', 'B', 'C', 'D', 'E', 'X']) {
    const cs = D.cats.filter(c => c.g === g);
    let gh = '';
    for (const c of cs) {
      const rows = c.rows.filter(pbMatch);
      if (filt && !rows.length) continue;
      const sAll = pbStats(c.rows);
      if (!rows.length && !c.custom && !sAll.tot && !filt) continue;
      const open =
        PBUI.open.has(c.id) ||
        (filt && (PBUI.f.q || PBUI.f.cat || PBUI.f.st || PBUI.f.ow || PBUI.f.ph || PBUI.f.pr) && rows.length <= 60);
      shown += rows.length;
      gh += `<details class="pbcat" data-cat="${esc(c.id)}"${open ? ' open' : ''}><summary><span class="pbcat-t">${esc(c.ar)}</span><span class="pbcat-m">${sAll.res}/${sAll.tot}${sAll.od ? ` · <b class="bad">${sAll.od} متأخر</b>` : ''}${filt ? ` · <span class="mut">يظهر ${rows.length}</span>` : ''}</span><span class="pbcat-b">${bar(sAll.pct)}</span></summary><div class="pbcat-body" data-pbcatbody="${esc(c.id)}">${open ? pbCatBody(c, rows) : ''}</div></details>`;
    }
    if (gh) h += `<h3 class="pbgrp">${esc(gname[g])}</h3>${gh}`;
  }
  if (!h) h = `<div class="note">لا توجد بنود مطابقة للتصفية الحالية.</div>`;
  return h;
}
function pbCatBody(c, rows) {
  rows = rows || c.rows.filter(pbMatch);
  const ro = RO();
  let h = '';
  if (c.desc) h += `<p class="mut small">${esc(c.desc)}</p>`;
  if (c.papers && c.papers.length)
    h += `<p class="small noprint">أوراق العمل المرتبطة: ${hub.wpL(c.papers.join(' '))}</p>`;
  if (!rows.length)
    return (
      h +
      '<p class="mut small">لا بنود مطابقة.</p>' +
      (ro ? '' : `<button class="btn o sm" type="button" data-pb="add" data-cat="${esc(c.id)}">+ إضافة بند</button>`)
    );
  let sub = null;
  for (const r of rows) {
    if (r.sub !== sub) {
      sub = r.sub;
      if (sub) h += `<div class="pbsub">${esc(sub)}</div>`;
    }
    h += pbRowHTML(r);
  }
  if (!ro)
    h += `<div class="pbcat-act noprint"><button class="btn o sm" type="button" data-pb="add" data-cat="${esc(c.id)}">+ إضافة بند لهذه الفئة</button><button class="btn g sm" type="button" data-pb="catreq" data-cat="${esc(c.id)}">تعليم بنود الفئة «تم الطلب»</button>${c.custom ? `<button class="btn d sm" type="button" data-pb="delcat" data-cat="${esc(c.id)}">حذف الفئة</button>` : ''}</div>`;
  return h;
}
const pbBadge = (i, n) => i + (n ? `<i>${n}</i>` : '');
const pbTitleHTML = r => esc(r.t) + (r.t !== r.t0 ? ' <i class="pb-mod" title="نص معدّل">✎</i>' : '');
const pbInhHTML = r =>
  !r.due && r.dueEff ? `<small class="mut pb-inh" title="موعد المرحلة">↳ ${esc(r.dueEff)}</small>` : '';
const pbMetaHTML = r =>
  `<span class="pb-pr pr-${r.pr}" title="الأولوية: ${esc(PB_PRL[r.pr])}">●</span><span class="pb-ph">${esc(PB_PHL[r.ph] || r.ph)}</span>${r.ref ? `<span class="pb-ref" dir="auto">${esc(r.ref)}</span>` : ''}${r.custom ? '<span class="pb-cu">مخصص</span>' : ''}${r.app ? '' : `<span class="pb-cu na">${esc(r.why || 'غير منطبق')}</span>`}`;
const pbLkLineHTML = r => {
  const c = PB_CATBY[r.cat];
  const papers = (c && c.papers) || [];
  return `<b>أوراق العمل:</b> ${r.lk.length ? hub.wpL(r.lk.join(' ')) : '<span class="mut">لا روابط خاصة</span>'}${papers.length ? ` <span class="mut small">· مرتبط بالفئة: </span>${hub.wpL(papers.join(' '))}` : ''}${RO() ? '' : ` <button class="btn g sm" type="button" data-pb="lk" data-id="${esc(r.id)}">🔗 تعديل الروابط</button>`}`;
};
function pbRowHTML(r) {
  const ro = RO(),
    id = r.id;
  const na = pbAttIdx()[id] || 0;
  const nl = r.lk.length;
  const x = PBUI.xr.has(id);
  const stSel = `<select class="pb-st" data-k="${pbK(id, 'st')}" data-pbf="${esc(id)}" data-pbst="1" aria-label="الحالة"${ro ? ' disabled' : ''}>${PB_ST.map(([k, l]) => `<option value="${k}"${r.st === k ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  return `<div class="pbrw" data-id="${esc(id)}"><div class="pbr st-${r.st} pr-${r.pr}${r.od ? ' od' : ''}${r.app ? '' : ' na'}" data-id="${esc(id)}">
  ${ro ? '' : `<input class="pb-sel" type="checkbox" data-pbsel="${esc(id)}" aria-label="تحديد البند"${PBUI.sel.has(id) ? ' checked' : ''}>`}
  <div class="pb-main"><button class="pb-t" type="button" data-pb="x" data-id="${esc(id)}" aria-expanded="${x}">${pbTitleHTML(r)}</button>
   <div class="pb-meta">${pbMetaHTML(r)}</div></div>
  <div class="pb-c pb-cst">${stSel}</div>
  <div class="pb-c pb-cow"><input class="in pb-ow" data-k="${pbK(id, 'ow')}" data-pbf="${esc(id)}" list="pb-owners" value="${esc(r.ow)}" placeholder="المسؤول" aria-label="المسؤول لدى العميل"${ro ? ' readonly' : ''}></div>
  <div class="pb-c pb-cdue"><input class="in pb-due" type="date" dir="ltr" data-k="${pbK(id, 'due')}" data-pbf="${esc(id)}" value="${esc(r.due)}" aria-label="تاريخ الاستحقاق"${ro ? ' readonly' : ''}><span class="pb-inhw">${pbInhHTML(r)}</span></div>
  <div class="pb-c pb-cb noprint"><button class="btn g sm pb-ib" type="button" data-pb="x" data-id="${esc(id)}" data-open="att" title="المرفقات" aria-label="المرفقات">${pbBadge('📎', na)}</button><button class="btn g sm pb-ib" type="button" data-pb="lk" data-id="${esc(id)}" title="ربط بأوراق العمل" aria-label="ربط بأوراق العمل">${pbBadge('🔗', nl)}</button></div></div>
  <div class="pbr-x" data-xid="${esc(id)}"${x ? '' : ' hidden'}>${x ? pbDrawerHTML(r) : ''}</div></div>`;
}
function pbDrawerHTML(r) {
  const ro = RO(),
    id = r.id;
  const c = PB_CATBY[r.cat];
  const papers = (c && c.papers) || [];
  const opt = (arr, v) =>
    arr.map(([k, l]) => `<option value="${k}"${v === k ? ' selected' : ''}>${esc(l)}</option>`).join('');
  return `<div class="pbx-g">
  <label class="fl full">نص البند (قابل للتعديل لهذا العميل)<textarea class="ta" rows="2" data-k="${pbK(id, 't')}" data-pbf="${esc(id)}" data-dv="${esc(r.t0)}"${ro ? ' readonly' : ''}>${esc(r.t)}</textarea></label>
  <label class="fl">المرحلة<select class="sel" data-k="${pbK(id, 'ph')}" data-pbf="${esc(id)}"${ro ? ' disabled' : ''}>${opt(PB_PHASE, r.ph)}</select></label>
  <label class="fl">الأولوية<select class="sel" data-k="${pbK(id, 'pr')}" data-pbf="${esc(id)}"${ro ? ' disabled' : ''}>${opt(PB_PRI, r.pr)}</select></label>
  <label class="fl">تاريخ الطلب<input class="in" type="date" dir="ltr" data-k="${pbK(id, 'rq')}" data-pbf="${esc(id)}" value="${esc(r.rq)}"${ro ? ' readonly' : ''}></label>
  <label class="fl">تاريخ الاستلام<input class="in" type="date" dir="ltr" data-k="${pbK(id, 'rcv')}" data-pbf="${esc(id)}" value="${esc(r.rcv)}"${ro ? ' readonly' : ''}></label>
  <label class="fl full">ملاحظة / رد العميل<textarea class="ta" rows="2" data-k="${pbK(id, 'nt')}" data-pbf="${esc(id)}" placeholder="ما تم استلامه، النقص، رد العميل…"${ro ? ' readonly' : ''}>${esc(r.nt)}</textarea></label>
  <label class="fl full">تعليق المراجع (داخلي)<textarea class="ta" rows="2" data-k="${pbK(id, 'cm')}" data-pbf="${esc(id)}" placeholder="نتيجة الفحص أو الإجراء المطلوب…"${ro ? ' readonly' : ''}>${esc(r.cm)}</textarea></label></div>
  <div class="pbx-lk">${pbLkLineHTML(r)}</div>
  <div class="pbx-att"><b>المرفقات (المستندات المستلمة)</b><div data-block="att|pbx!${esc(id)}">${hub.attHTML('pbx!' + id)}</div></div>
  ${ro ? '' : `<div class="pbx-act">${r.appRaw && r.st !== 'na' ? `<button class="btn g sm" type="button" data-pb="hide" data-id="${esc(id)}">إخفاء (لا ينطبق على العميل)</button>` : `<button class="btn g sm" type="button" data-pb="show" data-id="${esc(id)}">إظهار البند</button>`}${r.t !== r.t0 ? `<button class="btn g sm" type="button" data-pb="rtext" data-id="${esc(id)}">استرجاع النص الأصلي</button>` : ''}${r.custom ? `<button class="btn d sm" type="button" data-pb="del" data-id="${esc(id)}">حذف البند</button>` : ''}</div>`}`;
}
/* ---------- ملف العميل ---------- */
function pbProfileHTML() {
  const p = pbProfile(),
    ro = RO();
  const co = CUR.company || {};
  const chips = (name, list, sel) =>
    `<div class="pbchips">${list.map(([k, l]) => `<label class="pbchip"><input type="checkbox" data-pbprof="${name}" value="${k}"${sel.includes(k) ? ' checked' : ''}${ro ? ' disabled' : ''}><span>${esc(l)}</span></label>`).join('')}</div>`;
  const ex = PB_FLAGS.map(f => [f[0], f[1]]);
  let apps = [];
  try {
    apps = APP_FLAGS.map(f => [f[0], f[1]]);
  } catch (e) {
    logErr('51-pbc-view:119', e, 'info');
  }
  const flagRow = (id, l, extra) => {
    const m = pbFlagMode(id);
    const on = pbAtoms().has(id);
    return `<label class="pbflag"><span>${esc(l)}</span><select class="sel" data-pbflag="${id}"${ro ? ' disabled' : ''}><option value=""${m === '' ? ' selected' : ''}>تلقائي (${on ? 'نعم' : 'لا'})</option><option value="y"${m === 'y' ? ' selected' : ''}>نعم</option><option value="n"${m === 'n' ? ' selected' : ''}>لا</option></select></label>`;
  };
  const fl = p.flags;
  const ct = p.contact;
  const inCo = (k, l, ph) =>
    `<label class="fl">${l}<input class="in" data-pbct="${k}" value="${esc(ct[k] || '')}" placeholder="${esc(ph || '')}"${ro ? ' readonly' : ''}></label>`;
  const own = pbOwners();
  return `<div class="note">يحدد هذا الملف المتطلبات الظاهرة: كل فئة/بند مرتبط بشرط (شكل قانوني، قطاع، أو نشاط). يمكنك دائمًا إظهار أو إخفاء أي بند يدويًا من القائمة.</div>
 <section class="card pbsec"><h3>١ — بيانات الارتباط</h3><div class="pbx-g"><div class="kvl"><span>العميل</span><b>${esc(co.name || '')}</b></div><div class="kvl"><span>السنة المالية</span><b>${esc(G('eng.year', ''))}</b></div><div class="kvl"><span>تاريخ القوائم</span><b dir="ltr">${esc(G('eng.period', '') || '—')}</b></div><div class="kvl"><span>الإطار المحاسبي</span><b>${esc(G('eng.fw', 'IFRS'))}</b></div>
  <label class="fl">القطاع الأساسي للارتباط<select class="sel" data-k="eng.ind" data-pbrefresh="1"${ro ? ' disabled' : ''}><option value="">— غير محدد —</option>${IND.map(i => `<option value="${i.id}"${G('eng.ind', '') === i.id ? ' selected' : ''}>${esc(i.n)}</option>`).join('')}</select></label>
  <label class="fl">تاريخ بدء الفحص<input class="in" type="date" dir="ltr" data-pbprofd="start" value="${esc(p.start || '')}"${ro ? ' readonly' : ''}></label>
  <label class="fl">التاريخ المستهدف لإصدار التقرير<input class="in" type="date" dir="ltr" data-pbprofd="report" value="${esc(p.report || '')}"${ro ? ' readonly' : ''}></label></div></section>
 <section class="card pbsec"><h3>٢ — الشكل القانوني (اختر ما ينطبق)</h3>${chips('legal', PB_LEGAL, p.legal)}</section>
 <section class="card pbsec"><h3>٣ — القطاعات والأنشطة (تُفعِّل حزم المتطلبات الخاصة)</h3><p class="mut small">اختيار القطاع الأساسي أعلاه يحدد الحزمة تلقائيًا؛ يمكنك إضافة أنشطة أخرى متعددة (مثلًا شركة صناعية لها فروع تجزئة وتصدير).</p>${chips('sectors', PB_SECTORS, p.sectors)}</section>
 <section class="card pbsec"><h3>٤ — الخصائص المحاسبية والتشغيلية</h3><p class="mut small">«تلقائي» = حسب القطاع المختار. تُشارك الخصائص المعتمدة على نموذج التحكم في الظهور (SD-3) بقية البرنامج.</p><div class="pbflags">${apps.map(a => flagRow(a[0], a[1])).join('')}${ex.map(a => flagRow(a[0], a[1])).join('')}</div></section>
 <section class="card pbsec"><h3>٥ — مواعيد التسليم المتفق عليها</h3><div class="pbx-g">${PB_PHASE.map(([k, l]) => `<label class="fl">${esc(l)}<input class="in" type="date" dir="ltr" data-pbdue="${k}" value="${esc(p.due[k] || '')}"${ro ? ' readonly' : ''}></label>`).join('')}</div>${ro ? '' : `<p><button class="btn g sm" type="button" data-pb="autodates">اقتراح المواعيد تلقائيًا من تاريخ بدء الفحص وتاريخ التقرير</button></p>`}</section>
 <section class="card pbsec"><h3>٦ — جهة الاتصال الرئيسية لدى العميل</h3><div class="pbx-g">${inCo('name', 'الاسم')}${inCo('title', 'الوظيفة', 'المدير المالي')}${inCo('email', 'البريد الإلكتروني', 'name@company.com')}${inCo('phone', 'الهاتف')}</div></section>
 <section class="card pbsec"><h3>٧ — المسؤولون لدى العميل (للإسناد والمراسلات)</h3>
  <div class="tw"><table class="pbt"><thead><tr><th>الاسم</th><th>الوظيفة / القسم</th><th>البريد</th><th>الهاتف</th><th class="noprint"></th></tr></thead><tbody>${own.map((o, i) => `<tr data-ow="${i}"><td><input class="in" data-pbown="${i}" data-f="name" value="${esc(o.name || '')}"${ro ? ' readonly' : ''}></td><td><input class="in" data-pbown="${i}" data-f="role" value="${esc(o.role || '')}"${ro ? ' readonly' : ''}></td><td><input class="in" dir="ltr" data-pbown="${i}" data-f="email" value="${esc(o.email || '')}"${ro ? ' readonly' : ''}></td><td><input class="in" dir="ltr" data-pbown="${i}" data-f="phone" value="${esc(o.phone || '')}"${ro ? ' readonly' : ''}></td><td class="noprint">${ro ? '' : `<button class="btn d sm" type="button" data-pb="delown" data-i="${i}" aria-label="حذف">✕</button>`}</td></tr>`).join('') || '<tr><td colspan="5" class="mut">لم يُضف مسؤولون بعد.</td></tr>'}</tbody></table></div>
  ${ro ? '' : '<p><button class="btn o sm" type="button" data-pb="addown">+ إضافة مسؤول</button> <button class="btn g sm" type="button" data-pb="defown">إضافة مسؤولين نمطيين (المدير المالي، المحاسب، الموارد البشرية…)</button></p>'}</section>
 <section class="card pbsec"><h3>٨ — حفظ وإعادة استخدام قائمة العميل</h3><p class="mut small">القالب يحفظ ملف العميل والبنود المخصصة والتعديلات والمسؤولين ليُعاد استخدامه في السنوات التالية (بدون حالات الاستلام). عند «استنساخ» الارتباط لسنة جديدة تُنقل القائمة تلقائيًا إذا فعّلت الخيار.</p>
  <div class="row noprint">${ro ? '' : `<button class="btn" type="button" data-pb="tplsave">حفظ كقالب لهذا العميل</button><button class="btn g" type="button" data-pb="tplload">تحميل قالب العميل المحفوظ</button><button class="btn g" type="button" data-pb="prevyear">استيراد من سنة سابقة</button>`}<button class="btn g" type="button" data-pb="tplexp">تصدير القالب (ملف JSON)</button></div></section>`;
}
/* ---------- المتابعة والمراسلات ---------- */
function pbFollowHTML() {
  const D = pbAll(),
    ro = RO();
  const S = pbStatsAll();
  const by = {};
  D.rows.forEach(r => {
    if (!r.open) return;
    const k = r.ow || '';
    (by[k] || (by[k] = [])).push(r);
  });
  const names = Object.keys(by).sort((a, b) =>
    a === '' ? 1 : b === '' ? -1 : by[b].filter(r => r.od).length - by[a].filter(r => r.od).length
  );
  const logs = pbLog();
  return `<div data-block="pbx|kpi">${pbKpiHTML()}</div>
 <section class="card pbsec"><h3>إصدار الطلب الأولي</h3><p class="mut small">يُعلِّم البنود المنطبقة غير المطلوبة بعد في المرحلة المختارة «تم الطلب» بتاريخ اليوم، ويُنتج خطاب الطلب (Word) بقائمة البنود وموعد كل مرحلة، ثم يسجّل العملية في سجل المتابعة.</p>
  <div class="row noprint"><select class="sel" id="pbphsel" aria-label="المرحلة">${PB_PHASE.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}<option value="*">كل المراحل</option></select>${ro ? '' : '<button class="btn" type="button" data-pb="issue">إصدار الطلب (تعليم + خطاب)</button>'}<button class="btn g" type="button" data-pb="letter" data-kind="initial">خطاب الطلب فقط</button></div></section>
 <section class="card pbsec"><h3>البنود المفتوحة حسب المسؤول</h3>${
   names.length
     ? names
         .map(n => {
           const rs = by[n];
           const od = rs.filter(r => r.od).length;
           return `<details class="pbfo"><summary><b>${esc(n || '— غير معيّن —')}</b> <span class="mut">${rs.length} مفتوح</span>${od ? ` <b class="bad">${od} متأخر</b>` : ''}</summary>
  <div class="row noprint">${n ? `<button class="btn g sm" type="button" data-pb="letter" data-kind="reminder" data-ow="${esc(n)}">خطاب تذكير (Word)</button>` : ''}<button class="btn g sm" type="button" data-pb="kfilter" data-ow="${esc(n || '-')}" data-st="open">فتحها في القائمة</button></div>
  <ul class="pbfl">${rs
    .slice(0, 30)
    .map(
      r =>
        `<li class="${r.od ? 'od' : ''}">${esc(r.t)} <span class="mut small">· ${r.dueEff ? `<span dir="ltr">${esc(r.dueEff)}</span>` : 'بلا موعد'} · ${esc(PB_STL[r.st])}</span></li>`
    )
    .join('')}${rs.length > 30 ? `<li class="mut">… و${rs.length - 30} أخرى</li>` : ''}</ul></details>`;
         })
         .join('')
     : '<p class="mut">لا توجد بنود مفتوحة — كل المتطلبات مستلمة أو غير منطبقة.</p>'
 }
  ${S.open ? `<p class="row noprint"><button class="btn g" type="button" data-pb="letter" data-kind="reminder" data-ow="*">خطاب تذكير شامل بالمتأخر والمفتوح</button><button class="btn g" type="button" data-pb="print" data-mode="open">طباعة قائمة النواقص</button></p>` : ''}</section>
 <section class="card pbsec"><h3>سجل المتابعة</h3>${ro ? '' : '<div class="row noprint"><input class="in" id="pblogtxt" placeholder="سجّل اتصالًا أو اجتماعًا أو وعدًا بالتسليم…" style="flex:1"><button class="btn o sm" type="button" data-pb="logadd">إضافة</button></div>'}
  ${
    logs.length
      ? `<div class="tw"><table class="pbt"><thead><tr><th>التاريخ</th><th>النوع</th><th>التفاصيل</th><th>بواسطة</th></tr></thead><tbody>${logs
          .slice(0, 60)
          .map(
            l =>
              `<tr><td dir="ltr">${esc(l.d || '')}</td><td>${esc({ letter: 'خطاب', issue: 'طلب', note: 'ملاحظة', import: 'استيراد', bulk: 'تحديث جماعي', tpl: 'قالب' }[l.type] || l.type || '')}</td><td class="tx">${esc(l.txt || '')}</td><td>${esc(l.by || '')}</td></tr>`
          )
          .join('')}</tbody></table></div>`
      : '<p class="mut">لا توجد سجلات.</p>'
  }</section>`;
}
/* ---------- تغطية القوائم المالية ---------- */
function pbCoverHTML() {
  const cv = pbFsCoverage();
  return `<div class="note">تبيّن هذه المصفوفة مدى تغطية قائمة المتطلبات لكل بند من بنود القوائم المالية والإيضاحات، وما استُلم منها. اضغط أي صف لتصفية القائمة على فئاته.</div>
 <div class="tw"><table class="pbt"><thead><tr><th>بند القوائم المالية / الإيضاح</th><th>الفئات المرتبطة</th><th>الإجمالي</th><th>مستلم</th><th>مفتوح</th><th>متأخر</th><th>التقدم</th></tr></thead><tbody>${cv.map(r => `<tr><td class="tx"><b>${esc(r.ar)}</b></td><td class="small">${r.cats.map(c => esc((PB_CATBY[c] || { ar: c }).ar)).join('، ')}</td><td>${r.s.tot}</td><td>${r.s.done}</td><td>${r.s.open}</td><td class="${r.s.od ? 'bad' : ''}">${r.s.od}</td><td class="pbbar">${bar(r.s.pct)}<small>${r.s.pct}%</small></td></tr>`).join('')}</tbody></table></div>`;
}
/* ---------- تصدير واستيراد ---------- */
function pbIOHTML() {
  const ro = RO();
  return `<div class="pbio">
 <section class="card pbsec"><h3>تصدير</h3><p class="mut small">كل صيغة تتضمن البنود المنطبقة فقط وفق التصفية الافتراضية للعرض (غير المنطبقة تظهر في ورقة مستقلة بملف Excel).</p>
  <div class="row"><button class="btn" type="button" data-pb="xlsx">⤓ Excel (قائمة + ملخص + متأخر)</button><button class="btn g" type="button" data-pb="csv">⤓ CSV</button><button class="btn g" type="button" data-pb="json">⤓ JSON (نسخة كاملة)</button><button class="btn g" type="button" data-pb="letter" data-kind="initial">⤓ خطاب الطلب (Word)</button><button class="btn g" type="button" data-pb="print" data-mode="all">🖨 طباعة القائمة كاملة</button><button class="btn g" type="button" data-pb="print" data-mode="open">🖨 طباعة النواقص</button></div></section>
 <section class="card pbsec"><h3>استيراد</h3><p class="mut small">أرسل ملف Excel/CSV المُصدَّر للعميل ليحدّث الحالة والمسؤول والموعد والملاحظات، ثم استورده هنا: تُطابَق البنود بعمود «الرقم»، وتُضاف البنود الجديدة كبنود مخصصة. يقبل أيضًا ملف JSON أو قالب عميل.</p>
  ${ro ? '<p class="mut">القراءة فقط.</p>' : `<label class="btn o">اختيار ملف (xlsx / csv / json)<input class="sr" type="file" accept=".xlsx,.csv,.json,.txt" data-pbimport></label>`}</section>
 <section class="card pbsec"><h3>أعمدة الملف المتوقعة عند الاستيراد</h3><p class="small mono" dir="rtl">${PB_COLS.map(c => esc(c)).join(' · ')}</p></section></div>`;
}
const PB_COLS = [
  'الرقم',
  'الفئة',
  'المجموعة الفرعية',
  'البند',
  'المرجع / المعيار',
  'الأولوية',
  'المرحلة',
  'المسؤول لدى العميل',
  'تاريخ الطلب',
  'تاريخ الاستحقاق',
  'الحالة',
  'تاريخ الاستلام',
  'ملاحظة / رد العميل',
  'تعليق المراجع',
  'أوراق العمل المرتبطة',
  'عدد المرفقات',
  'منطبق',
];

export {
  PBUI,
  PB_COLS,
  pbAttIdx,
  pbBadge,
  pbCatBody,
  pbDate,
  pbDrawerHTML,
  pbInhHTML,
  pbLkLineHTML,
  pbMatch,
  pbMetaHTML,
  pbOwnerNames,
  pbRowHTML,
  pbTitleHTML,
};
