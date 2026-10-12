/* Audit-Plus · View: Master program & phases */

import { hub } from '../hub.js';
import { PH } from '../data/04-phases.js';
import { esc, split } from '../core/01-utils-i18n-storage.js';
import { L, PHM, PROCS, V, isaL, procTable, prog, ul } from './05-indexes.js';

/* ===== Master program & phases ===== */
V.program = function () {
  const stages = [];
  PH.forEach(p => {
    if (stages.indexOf(p.stg) < 0) stages.push(p.stg);
  });
  return (
    `<h1>البرنامج الرئيسي للمراجعة (Master Audit Program)</h1><p class="sub">الهدف ← المخاطر ← الإجراءات ← الأدلة ← أوراق العمل ← النتائج ← الاستنتاج.</p>` +
    stages
      .map(
        s =>
          `<h2>${esc(s)}</h2>` +
          PH.filter(p => p.stg === s)
            .map(p => {
              const g = prog(PROCS.filter(x => x.src === 'ph' && x.sid === p.id).map(x => x.id));
              return `<details class="acc" id="ph-${p.id}"><summary>${esc(p.n)} <span class="mut">${esc(p.en)}</span> ${isaL(split(p.isa))} <span class="cnt">${g.p}%</span></summary><div class="in">${phBody(p)}</div></details>`;
            })
            .join('')
      )
      .join('')
  );
};
function phBody(p) {
  return `<div class="kv"><div>الهدف (Objective)</div><div>${esc(p.obj)}</div><div>نطاق المرحلة</div><div>${esc(p.cov || '')}</div></div><h3>المخاطر (Risks)</h3>${ul(p.rk)}<h3>الإجراءات (Procedures)</h3>${procTable(PROCS.filter(x => x.src === 'ph' && x.sid === p.id))}<h3>الأدلة المطلوبة</h3>${ul(p.ev)}<h3>أوراق العمل</h3><p>${hub.wpL(p.wps)}</p><h3>النتائج المتوقعة والاستثناءات</h3><p>${esc(p.res || '')}</p><h3>الاستنتاج</h3><div class="note">${esc(p.concl)}</div>`;
}
V.ph = function (id) {
  const p = PHM[id];
  if (!p) return hub.nf();
  return `<p class="noprint"><a href="${L('program')}">← البرنامج الرئيسي</a></p><h1>${esc(p.n)}</h1><p class="sub">${esc(p.en)} · ${esc(p.stg)} ${isaL(split(p.isa))}</p><div class="card">${phBody(p)}</div>`;
};
