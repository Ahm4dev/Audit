/* ===== إعادة تصميم الهيدر + لوحة النظرة العامة ===== */

import { hub } from '../hub.js';
import { IQ_TO } from '../data/21-iq-lib.js';
import { esc, fmtN, logErr } from '../core/01-utils-i18n-storage.js';
import { CUR } from '../core/03-data-engine.js';
import { G, L, V, bar } from '../views/05-indexes.js';
import { matState } from '../v4/31-calc.js';
import { CT, ctAliveRefs, ctOff, ctTree, firmProfile } from '../v4/32-catalog.js';
import { SEC_ICON, TAB7, openRecsAll, tabOf } from '../v4/40-shell.js';
import { pbStatsAll } from './50-pbc-core.js';
import { IQ_STL, iqAll, iqStats } from './54-iq.js';

/* الهيدر: صف واحد يجمع هوية الارتباط والتبويبات والمؤشرات (بدل شريطين متراصّين) */
hub.tabsHTML = function (cur) {
  const fp = firmProfile();
  const M = matState();
  const all = typeof ctAliveRefs === 'function' ? ctAliveRefs() : CT.order.filter(r => !ctOff(r));
  const P = hub.catProg(all);
  const c = tabOf(cur);
  const n = hub.tabCounts();
  const fsd = G('eng.period', G('eng.year', ''));
  const mt = M.om ? fmtN(M.om) : '—';
  let pb = '';
  try {
    const S = pbStatsAll();
    pb = S.od ? `<span class="cnt bad" title="${S.od} متطلب متأخر">${S.od}</span>` : '';
  } catch (e) {
    logErr('55-shell:5', e, 'info');
  }
  return `<div class="engbar eng2"><div class="eb-id">${fp.logo ? `<img class="eb-logo" src="${esc(fp.logo)}" alt="شعار المكتب">` : ''}<div><b class="eb-co" title="${esc(CUR.company.name)}">${esc(CUR.company.name)}</b><span class="eb-sub">${esc(G('eng.year', ''))} · القوائم في <b dir="ltr">${esc(fsd || '—')}</b> · ${esc(fp.cur)}</span></div></div>
 <nav class="etabrow" role="tablist" aria-label="أقسام الارتباط">${TAB7.map(x => `<a role="tab" href="${L(x[2])}"${c === x[0] ? ' aria-current="page" aria-selected="true"' : ' aria-selected="false"'}>${esc(x[1])}${x[0] === 'issues' && n.issues ? ` <span class="cnt">${n.issues}</span>` : ''}${x[0] === 'qry' && n.qry ? ` <span class="cnt">${n.qry}</span>` : ''}${x[0] === 'pbc' ? pb : ''}</a>`).join('')}</nav>
 <div class="eb-end noprint"><a class="eb-mat2" href="${L('wp/A500')}" title="الأهمية النسبية ${mt} · التنفيذية ${M.pm ? fmtN(M.pm) : '—'} · التفاهة ${M.ct ? fmtN(M.ct) : '—'}">الأهمية <b dir="ltr" data-matchip="om">${mt}</b></a>
 <span class="eb-ring" title="مكتمل ${P.d} / تحت المراجعة ${P.rv} / قيد الإعداد ${P.pg} / لم يبدأ ${P.ns}"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.5" class="rb"/><circle cx="18" cy="18" r="15.5" class="rf" style="stroke-dasharray:${Math.round(P.p * 0.974)} 100"/></svg><b>${P.p}%</b></span>
 <a class="btn g sm" href="${L('map')}" title="خريطة التنقل" aria-label="الخريطة">🗺</a><a class="btn g sm" href="${L('firm')}" title="بيانات المكتب" aria-label="بيانات المكتب">🏢</a></div></div>`;
};
/* ---------- لوحة النظرة العامة ---------- */
const _dashOld = V.dash;
V.dash = function () {
  const old = _dashOld();
  const gi = old.indexOf('<div class="grid g4">');
  const ci = old.indexOf('<div class="card">');
  const form = ci >= 0 && gi > ci ? old.slice(ci, gi) : '';
  const rest = gi >= 0 ? old.slice(gi) : '';
  let P = hub.catProg(CT.order.filter(r => !ctOff(r)));
  let pbS = { tot: 0, pct: 0, od: 0, open: 0, hiOpen: 0, res: 0 },
    iq = { tot: 0, pend: 0, od: 0, pct: 0, nr: 0, res: 0 };
  try {
    pbS = pbStatsAll();
  } catch (e) {
    logErr('55-shell:16', e, 'info');
  }
  try {
    iq = iqStats(iqAll());
  } catch (e) {
    logErr('55-shell:16', e, 'info');
  }
  const o = openRecsAll();
  const nOpen = o.r.length + o.f.length + o.a.length;
  const card = (href, ico, title, big, sub, pct, warn) =>
    `<a class="dc" href="${href}"><div class="dc-h"><span class="dc-i" aria-hidden="true">${ico}</span><span>${title}</span></div><div class="dc-b"><b>${big}</b>${sub ? `<span class="dc-s">${sub}</span>` : ''}</div>${pct != null ? bar(pct) : ''}${warn ? `<div class="dc-w">${warn}</div>` : ''}</a>`;
  const todo = [];
  if (pbS.od) todo.push([L('pbc/follow'), 'متطلبات عميل متأخرة', pbS.od, 'bad']);
  if (pbS.hiOpen) todo.push([L('pbc/list'), 'متطلبات عالية الأولوية مفتوحة', pbS.hiOpen, 'warn']);
  if (iq.od) todo.push([L('queries'), 'استفسارات متأخرة', iq.od, 'bad']);
  if (iq.pend) todo.push([L('queries'), 'استفسارات معلّقة بانتظار الرد', iq.pend, 'warn']);
  if (o.r.length) todo.push([L('review'), 'ملاحظات مراجعة مفتوحة', o.r.length, 'warn']);
  if (o.a.length) todo.push([L('logs/a'), 'تسويات مقترحة لم تُقرَّر', o.a.length, 'warn']);
  if (o.f.length) todo.push([L('review'), 'استثناءات مفتوحة', o.f.length, 'warn']);
  const tree = ctTree();
  const secs = tree
    .map(s => {
      const refs = [];
      for (const g of s.groups) {
        refs.push(...(g.items || []));
        for (const a of g.areas || []) refs.push(a.main);
      }
      const p = hub.catProg(refs);
      return p.t
        ? `<a class="dsec" href="${L('map')}#sec-${s.id}"><span>${SEC_ICON[s.id] || ''} ${esc(s.ar)}</span>${bar(p.p)}<small>${p.p}% · ${p.d}/${p.t}</small></a>`
        : '';
    })
    .join('');
  return `<h1>نظرة عامة على الارتباط</h1><p class="sub">${esc(CUR.company.name)} · السنة المالية ${esc(G('eng.year', ''))} — يُحفظ كل تعديل تلقائيًا.</p>
 <div class="dcards">${card(L('map'), '📁', 'أوراق العمل', P.p + '%', `${P.d} مكتملة من ${P.t}`, P.p, P.rv ? `${P.rv} قيد المراجعة` : '')}${card(L('pbc/dash'), '📥', 'متطلبات العميل', pbS.pct + '%', `${pbS.res || 0} من ${pbS.tot} مستوفاة`, pbS.pct, pbS.od ? `${pbS.od} متأخر` : '')}${card(L('queries'), '❓', 'الاستفسارات', iq.pct + '%', `${iq.res} من ${iq.tot - iq.na} مجاب`, iq.pct, iq.pend ? `${iq.pend} معلّق` : '')}${card(L('review'), '✅', 'نقاط المراجعة', nOpen, 'مفتوحة', null, '')}</div>
 ${todo.length ? `<div class="card dtodo"><h3>يحتاج انتباهك الآن</h3><div class="dtl">${todo.map(t => `<a class="${t[3]}" href="${t[0]}"><b>${t[2]}</b><span>${esc(t[1])}</span><i aria-hidden="true">‹</i></a>`).join('')}</div></div>` : '<div class="note ok">لا توجد بنود عاجلة حاليًا.</div>'}
 <div class="card"><h3>التقدم حسب الأقسام</h3><div class="dsecs">${secs}</div></div>
 <details class="wpx dtl2"><summary>بيانات الارتباط (الإطار، القطاع، الأهمية النسبية)</summary>${form}</details>
 <details class="wpx dtl2"><summary>مؤشرات تفصيلية وسير العمل</summary>${rest}</details>`;
};
/* ---------- نقاط المراجعة: تضمين الاستفسارات المعلّقة ---------- */
const _rev = V.review;
V.review = function () {
  let h = _rev();
  try {
    const S = iqStats(iqAll());
    if (S.pend || S.od) {
      const rows = iqAll()
        .filter(r => !r.hid && (r.pend || r.od))
        .slice(0, 25);
      h += `<h2>استفسارات معلّقة <span class="cnt">${S.pend}</span></h2><div class="tw"><table><thead><tr><th>الورقة</th><th>الاستفسار</th><th>موجّه إلى</th><th>الاستحقاق</th><th>الحالة</th></tr></thead><tbody>${rows.map(r => `<tr><td><a class="wpl" href="${L('wp/' + encodeURIComponent(r.host))}">${esc(CT.items[r.host].disp)}</a></td><td class="tx">${esc(r.t)}</td><td>${esc(IQ_TO[r.to] || '')}</td><td>${esc(r.due)}</td><td>${esc(IQ_STL[r.st])}</td></tr>`).join('')}</tbody></table></div><p><a class="btn g sm" href="${L('queries')}">كل الاستفسارات ←</a></p>`;
    }
  } catch (e) {
    logErr('55-shell:36', e, 'info');
  }
  return h;
};
