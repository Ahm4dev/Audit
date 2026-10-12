/* Audit-Plus · View: Cycles */

import { hub } from '../hub.js';
import { C } from '../data/06-cycles-it-components.js';
import { esc } from '../core/01-utils-i18n-storage.js';
import { CUR, recs } from '../core/03-data-engine.js';
import { AC, CTRLS, CY, L, PROCS, V, bar, chain, ctrlTable, procTable, prog, sec, ul } from './05-indexes.js';

/* ===== Cycles ===== */
V.cycles = function () {
  return `<h1>فهرس دورات العمليات (Transaction Cycles)</h1><p class="sub">Process ← Risks ← Controls ← Control Objectives ← Walkthrough ← Tests of Controls ← Substantive ← Assertions ← Evidence ← Findings ← Conclusion.</p><div class="grid g3">${C.map(
    c => {
      const ids = PROCS.filter(p => p.cy === c.id && p.src === 'cyc').map(p => p.id),
        g = prog(ids);
      return `<a class="card" href="${L('cyc/' + c.id)}" style="color:inherit;text-decoration:none;margin:0"><b style="color:var(--pri)">${esc(c.n)}</b><br><span class="mut">${esc(c.en)}</span><br><small>${c.rcm.length} ضوابط · ${ids.length} إجراءات · ${c.ac.length} حسابات</small>${bar(g.p)}</a>`;
    }
  ).join('')}</div>`;
};
V.cyc = function (id) {
  const c = CY[id];
  if (!c) return hub.nf();
  const procs = PROCS.filter(p => p.src === 'cyc' && p.cy === id);
  const fnd = recs(CUR.eng, 'f').filter(f => c.ac.indexOf(f.acc) > -1);
  return `<p class="noprint"><a href="${L('cycles')}">← دورات العمليات</a></p><h1>${esc(c.n)} <span class="mut" style="font-size:.9rem">${esc(c.en)}</span></h1>
 ${chain([
   ['c-pr', 'Process'],
   ['c-rcm', 'Risks & Controls'],
   ['c-co', 'Control Objectives'],
   ['c-wt', 'Walkthrough'],
   ['c-toc', 'Tests of Controls'],
   ['c-sub', 'Substantive'],
   ['c-acc', 'Accounts'],
   ['c-fn', 'Findings'],
   ['c-cc', 'Conclusion'],
 ])}
 ${sec('c-pr', 'وصف العملية (Process Narrative)', `<div class="card">${ul(c.pr)}</div>`)}${sec('c-co', 'أهداف الرقابة (Control Objectives)', ul(c.co))}
 ${sec('c-rcm', 'مصفوفة المخاطر والرقابة (RCM)', ctrlTable(CTRLS.filter(x => x.src === 'cyc' && x.cy === id)), c.rcm.length)}
 ${sec('c-wt', 'جولة التتبع (Walkthrough)', procTable(procs.filter(p => p.t === 'WT')))}${sec('c-toc', 'اختبارات الرقابة (Tests of Controls)', procTable(procs.filter(p => p.t === 'TOC')))}
 ${sec('c-sub', 'الإجراءات الجوهرية على مستوى الدورة', procTable(procs.filter(p => p.t !== 'TOC' && p.t !== 'WT')))}
 ${sec(
   'c-acc',
   'الحسابات المرتبطة',
   `<p>${c.ac
     .filter(x => AC[x])
     .map(x => `<a class="b as" href="${L('acc/' + x)}">${esc(AC[x].n)}</a>`)
     .join(' ')}</p>`
 )}
 ${sec('c-fn', 'الملاحظات (Findings)', hub.logTables(fnd, []))}
 ${sec('c-cc', 'الاستنتاج (Conclusion)', `<div class="note">بناءً على فهم ${esc(c.n)} وتنفيذ جولة التتبع واختبارات تصميم وتطبيق وفعالية تشغيل الضوابط والإجراءات الجوهرية، يتم تحديد ما إذا كان يمكن الاعتماد على الضوابط وتخفيض نطاق الإجراءات الجوهرية، أو تبني منهج جوهري بالكامل، مع توثيق أي قصور في C-11 وإبلاغه وفق ISA 265.</div>`)}`;
};
