/* Audit-Plus · v11 · COSO 2013 internal-control evaluation (B340).
   5 components · 17 principles · design / implementation / operating effectiveness · deficiencies classified per ISA 265
   · linked to risk areas, assertions, procedures and the reporting papers (D510 / D520 / D530 / D515 / A-opinion).
   Stored per engagement under keys  coso.<principle>.<field>  (auto-persisted by the generic data-k handler). */
'use strict';
const COSO_UI={tab:'sum'};
const COSO_TABS=[['sum','الملخص والاستنتاج','Summary'],['asm','التقييم (17 مبدأ)','Assessment'],['def','أوجه القصور (ISA 265)','Deficiencies'],['lnk','الربط بالمخاطر والإجراءات','Linkage'],['rep','التقرير والتواصل','Reporting']];
const cosoK=(n,f)=>'coso.'+n+'.'+f;
const cosoG=(n,f)=>G(cosoK(n,f),'');
const cosoLabel=(arr,v)=>{const x=arr.find(a=>a[0]===v);return x?x[1]:''};
function cosoAll(){const o=[];COSO_COMPONENTS.forEach(c=>c.pr.forEach(p=>o.push({c,n:p[0],ar:p[1],en:p[2],isa:p[3],pf:p[4]})));return o}
/* status of one principle: na (not assessed) · gap (not present) · present (designed+implemented, operating not yet concluded) · ok (present & functioning) · exc (functioning with exceptions) · fail (not functioning) */
function cosoStat(n){const d=cosoG(n,'des'),i=cosoG(n,'imp'),o=cosoG(n,'ope');
 if(!d&&!i&&!o)return 'na';if(d==='I'||i==='N')return 'gap';if(o==='F')return 'fail';if(o==='X')return 'exc';
 if((d==='A'||d==='P')&&(i==='Y'||i==='P'||i==='NA')){return o==='E'?'ok':'present'}return 'na'}
const COSO_ST={na:['لم يُقيَّم','mut'],gap:['غير موجود / غير منفّذ','bad'],fail:['موجود لكنه غير فعّال','bad'],exc:['فعّال مع استثناءات','warn'],present:['موجود — الفعالية لم تُختبر','warn'],ok:['موجود ويعمل','ok']};
/* ISA 265.A6-A7 factors: likelihood × magnitude (+ fraud/override/ITGC pervasiveness) → suggested class */
function cosoSuggest(n){const st=cosoStat(n);if(st==='na'||st==='ok'||st==='present')return '';
 const lk=cosoG(n,'lk'),mg=cosoG(n,'mg'),comp=String(cosoG(n,'cmp')).trim();const w={L:1,M:2,H:3};
 const sc=(w[lk]||0)*(w[mg]||0);if(!lk||!mg)return 'D?';
 if(sc>=6&&!comp)return 'S';if(sc>=9)return 'S';if(sc>=4&&(st==='gap'||st==='fail')&&!comp)return 'S';return 'D'}
function cosoSev(n){const s=cosoG(n,'sev');if(s)return s;const sg=cosoSuggest(n);return sg==='D?'?'':sg}
function cosoCompStat(c){const sts=c.pr.map(p=>cosoStat(p[0]));const cnt=k=>sts.filter(x=>x===k).length;const tot=sts.length;
 const assessed=tot-cnt('na');let k='na';if(assessed){if(cnt('gap')||cnt('fail'))k='gap';else if(cnt('exc')||cnt('present')||assessed<tot)k='present';else k='ok'}
 return {k,tot,ok:cnt('ok'),exc:cnt('exc'),bad:cnt('gap')+cnt('fail'),pend:cnt('present')+cnt('na')}}
function cosoDefs(){return cosoAll().filter(x=>{const s=cosoSev(x.n);return s==='D'||s==='S'})}
function cosoSystem(){const cs=COSO_COMPONENTS.map(c=>({c,s:cosoCompStat(c)}));const any=cs.some(x=>x.s.k!=='na');
 if(!any)return {k:'na',t:'لم يبدأ التقييم بعد.'};
 const bad=cs.filter(x=>x.s.k==='gap'),pend=cs.filter(x=>x.s.k!=='ok');
 const sg=cosoDefs().filter(x=>cosoSev(x.n)==='S');
 if(bad.length)return {k:'bad',t:'نظام الرقابة الداخلية غير فعّال: '+bad.map(x=>x.c.ar).join('، ')+' — مكوّن غير موجود أو لا يعمل (COSO 2013). لا يُعتمد على الرقابة ويُوسَّع الاختبار الجوهري (ISA 330).'};
 if(sg.length)return {k:'bad',t:'توجد '+sg.length+' أوجه قصور جوهرية — يجب إبلاغ المكلفين بالحوكمة كتابةً (ISA 265.9) وتعديل مخاطر التحريف الجوهري.'};
 if(pend.length)return {k:'warn',t:'التقييم غير مكتمل: '+pend.map(x=>x.c.ar).join('، ')+' — لم تُختبر فعاليتها التشغيلية أو بها استثناءات.'};
 return {k:'ok',t:'المكوّنات الخمسة موجودة وتعمل معًا (COSO 2013) — يمكن الاعتماد على الرقابة في حدود نتائج الاختبار.'}}
const cosoSel=(n,f,opts,extra)=>`<select class="st" data-k="${cosoK(n,f)}" data-dv="" data-struct="1" aria-label="${esc(extra||f)}"${RO()?' disabled':''}>${opts.map(o=>`<option value="${o[0]}"${cosoG(n,f)===o[0]?' selected':''}>${esc(o[1])}</option>`).join('')}</select>`;
const cosoBadge=k=>`<span class="b ${COSO_ST[k][1]}">${COSO_ST[k][0]}</span>`;
function cosoSumHTML(){const sy=cosoSystem();const all=cosoAll();const cnt=k=>all.filter(x=>cosoStat(x.n)===k).length;const done=all.length-cnt('na');
 const comp=COSO_COMPONENTS.map(c=>{const s=cosoCompStat(c);const pc=Math.round(s.ok/s.tot*100);return `<div class="card coso-c"><div class="row" style="justify-content:space-between;gap:8px"><b>${esc(c.ar)}</b><span class="mut small" dir="ltr">${esc(c.en)}</span></div><div class="row" style="gap:6px;margin:6px 0">${cosoBadge(s.k)}<span class="mut small">${s.tot} مبادئ</span></div>${bar(pc)}<div class="mut small" style="margin-top:4px">يعمل: ${s.ok} · استثناءات: ${s.exc} · قصور: ${s.bad} · قيد الاختبار/غير مُقيَّم: ${s.pend}</div></div>`}).join('');
 const sev=cosoDefs();const S=sev.filter(x=>cosoSev(x.n)==='S').length,D=sev.length-S;
 return `<div class="note ${sy.k==='ok'?'':sy.k==='na'?'':'bad'}"><b>الاستنتاج الآلي:</b> ${esc(sy.t)}</div>
 <div class="kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin:8px 0">
  <div class="card"><div class="mut small">المبادئ المُقيَّمة</div><b>${done} / ${all.length}</b></div>
  <div class="card"><div class="mut small">موجودة وتعمل</div><b>${cnt('ok')}</b></div>
  <div class="card"><div class="mut small">قصور (ISA 265)</div><b>${D}</b></div>
  <div class="card"><div class="mut small">قصور جوهري</div><b style="color:${S?'var(--hi)':'inherit'}">${S}</b></div></div>
 <div class="coso-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px">${comp}</div>
 <p class="mut small">الإطار: COSO Internal Control – Integrated Framework (2013) · يُربط بفهم الرقابة وفق ISA 315 (المعدّل) والإبلاغ عن أوجه القصور وفق ISA 265. كل التقييمات أحكام مهنية يعتمدها الشريك.</p>`}
function cosoAsmHTML(){const ro=RO();return COSO_COMPONENTS.map(c=>{const s=cosoCompStat(c);
 return `<details class="card coso-comp" open><summary><b>${esc(c.ar)}</b> <span class="mut small" dir="ltr">${esc(c.en)} · ${esc(c.isa)}</span> ${cosoBadge(s.k)}</summary>${c.pr.map(p=>{const n=p[0];const st=cosoStat(n);
  return `<div class="coso-p" id="coso-p${n}" style="border-top:1px solid var(--bd,#ddd);padding:8px 0">
   <div class="row" style="justify-content:space-between;gap:8px"><b>المبدأ ${n}: ${esc(p[1])}</b>${cosoBadge(st)}</div>
   <div class="mut small" dir="ltr">${esc(p[2])} · ${esc(p[3])}</div>
   <details class="small"><summary>نقاط التركيز (Points of Focus)</summary>${ul(p[4])}</details>
   <div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px">
    <label>التصميم (Design)${cosoSel(n,'des',COSO_DESIGN,'تصميم المبدأ '+n)}</label>
    <label>التطبيق (Implementation)${cosoSel(n,'imp',COSO_IMPL,'تطبيق المبدأ '+n)}</label>
    <label>الفعالية التشغيلية${cosoSel(n,'ope',COSO_OPER,'فعالية المبدأ '+n)}</label>
    <label>أسلوب الاختبار${cosoSel(n,'tst',COSO_TEST,'أسلوب اختبار المبدأ '+n)}</label>
    <label>مرجع الدليل / ورقة العمل<input class="in" data-k="${cosoK(n,'evd')}" value="${esc(cosoG(n,'evd'))}" aria-label="مرجع دليل المبدأ ${n}"${ro?' readonly':''}></label></div>
   <label class="full">ملاحظات التقييم<textarea class="ta" data-k="${cosoK(n,'nt')}" aria-label="ملاحظات المبدأ ${n}"${ro?' readonly':''}>${esc(cosoG(n,'nt'))}</textarea></label></div>`}).join('')}</details>`}).join('')}
function cosoDefHTML(){const ro=RO();const rows=cosoAll().filter(x=>{const s=cosoStat(x.n);return s==='gap'||s==='fail'||s==='exc'||cosoG(x.n,'sev')});
 if(!rows.length)return '<p class="mut">لا توجد أوجه قصور مسجّلة. تظهر هنا تلقائيًا أي مبادئ تقييمها «غير مناسب/غير منفّذ/غير فعّال/استثناءات».</p>';
 return `<div class="note">التصنيف وفق ISA 265: <b>قصور (Deficiency)</b> عند عدم كفاية تصميم/تطبيق/تشغيل الرقابة لمنع أو اكتشاف التحريف في الوقت المناسب؛ و<b>قصور جوهري (Significant Deficiency)</b> عند أهمية كافية لاستحقاق انتباه المكلفين بالحوكمة. العوامل: احتمال حدوث التحريف × حجمه المحتمل، وجود رقابة معوِّضة، الصلة بالغش وتجاوز الإدارة وضوابط تقنية المعلومات.</div>
 <div class="tw"><table><thead><tr><th>المبدأ</th><th>الحالة</th><th>الاحتمال</th><th>الحجم المحتمل</th><th>رقابة معوِّضة</th><th>المقترح آليًا</th><th>التصنيف المعتمد</th><th class="noprint"></th></tr></thead><tbody>${rows.map(x=>{const n=x.n;const sg=cosoSuggest(n);const sgt=sg==='S'?'قصور جوهري':sg==='D'?'قصور':sg==='D?'?'حدّد الاحتمال والحجم':'';
  return `<tr><td class="tx"><a href="#coso-p${n}" data-coso-tab="asm">${n}. ${esc(x.ar)}</a><div class="mut small">${esc(x.c.ar)}</div></td><td>${cosoBadge(cosoStat(n))}</td>
  <td>${cosoSel(n,'lk',COSO_LVL,'احتمال التحريف')}</td><td>${cosoSel(n,'mg',COSO_LVL,'حجم التحريف المحتمل')}</td>
  <td><input class="in" data-k="${cosoK(n,'cmp')}" data-struct="1" value="${esc(cosoG(n,'cmp'))}" placeholder="إن وُجدت" aria-label="رقابة معوِّضة للمبدأ ${n}"${ro?' readonly':''}></td>
  <td>${sgt?`<span class="b ${sg==='S'?'bad':'warn'}">${sgt}</span>`:''}</td>
  <td>${cosoSel(n,'sev',COSO_SEV,'تصنيف القصور')}</td>
  <td class="noprint">${ro?'':`<button class="btn g sm" type="button" data-coso-find="${n}">+ سجل الملاحظات</button>`}</td></tr>
  <tr><td colspan="8"><label class="full">وصف القصور والتوصية<textarea class="ta" data-k="${cosoK(n,'dsc')}" aria-label="وصف قصور المبدأ ${n}"${ro?' readonly':''}>${esc(cosoG(n,'dsc'))}</textarea></label></td></tr>`}).join('')}</tbody></table></div>`}
function cosoLnkHTML(){const ro=RO();const areas=liveAreas();
 const asKeys=Object.keys(ASR);
 return `<div class="note">اربط كل مبدأ فيه قصور أو اعتماد على الرقابة بمجال القوائم والتأكيدات المتأثرة والإجراء البديل/الإضافي. يظهر الربط في تقرير المكلفين بالحوكمة وفي تعديل تقييم المخاطر.</div>
 <div class="tw"><table><thead><tr><th>المبدأ</th><th>الحالة</th><th>المجال المتأثر</th><th>التأكيدات المتأثرة</th><th>الخطر المرتبط</th><th>الإجراء الموسَّع / ورقة العمل</th></tr></thead><tbody>${cosoAll().map(x=>{const n=x.n;const aId=cosoG(n,'area');const a=CT.areaBy&&CT.areaBy[aId];const wp=a&&a.main&&CT.items[a.main]?`<a class="wpl" href="${L('wp/'+encodeURIComponent(a.main))}">${esc(a.main)}</a>`:'';
  return `<tr><td class="tx">${n}. ${esc(x.ar)}</td><td>${cosoBadge(cosoStat(n))}</td>
  <td><select class="st" data-k="${cosoK(n,'area')}" data-dv="" data-struct="1" aria-label="مجال المبدأ ${n}"${ro?' disabled':''}><option value="">—</option>${areas.map(ar=>`<option value="${esc(ar.id)}"${aId===ar.id?' selected':''}>${esc(ar.ar||ar.id)}</option>`).join('')}</select> ${wp}</td>
  <td><div class="row" style="gap:4px;flex-wrap:wrap">${asKeys.map(k=>`<label class="small" title="${esc(ASR[k][0])}" style="white-space:nowrap"><input type="checkbox" data-k="${cosoK(n,'as_'+k)}"${G(cosoK(n,'as_'+k),false)===true?' checked':''}${ro?' disabled':''}> ${esc(ASR[k][1])}</label>`).join('')}</div></td>
  <td><input class="in" data-k="${cosoK(n,'rsk')}" value="${esc(cosoG(n,'rsk'))}" placeholder="وصف/مرجع الخطر" aria-label="الخطر المرتبط بالمبدأ ${n}"${ro?' readonly':''}></td>
  <td><input class="in" data-k="${cosoK(n,'prc')}" value="${esc(cosoG(n,'prc'))}" placeholder="الإجراء / المرجع" aria-label="الإجراء المرتبط بالمبدأ ${n}"${ro?' readonly':''}></td></tr>`}).join('')}</tbody></table></div>`}
function cosoRepHTML(){const S=cosoDefs().filter(x=>cosoSev(x.n)==='S'),D=cosoDefs().filter(x=>cosoSev(x.n)==='D');const sy=cosoSystem();
 const li=(a)=>a.length?`<ul class="l">${a.map(x=>`<li>المبدأ ${x.n} — ${esc(x.ar)}${cosoG(x.n,'dsc')?': '+esc(cosoG(x.n,'dsc')):''}</li>`).join('')}</ul>`:'<p class="mut">لا يوجد.</p>';
 const lk=r=>CT.items[r]?`<a class="btn o sm" href="${L('wp/'+r)}">${esc(r)} — ${esc(CT.items[r].ar||r)}</a>`:'';
 return `<div class="note ${sy.k==='ok'?'':'bad'}"><b>الاستنتاج:</b> ${esc(sy.t)}</div>
 <h3>أوجه قصور جوهرية — تُبلَّغ كتابةً للمكلفين بالحوكمة (ISA 265.9)</h3>${li(S)}
 <h3>أوجه قصور أخرى — تُبلَّغ للإدارة (ISA 265.10)</h3>${li(D)}
 <h3>الأثر على التقرير والارتباط</h3><ul class="l"><li>ISA 315/330: ${S.length||D.length?'عدّل تقييم مخاطر التحريف الجوهري للمجالات المرتبطة، وقلّل الاعتماد على الرقابة ووسّع الاختبارات الجوهرية.':'لا أثر على نهج الاعتماد على الرقابة إلا في حدود نتائج الاختبار.'}</li>
  <li>ISA 260/265: ${S.length?'إبلاغ كتابي بالقصور الجوهري للمكلفين بالحوكمة قبل تاريخ التقرير.':'لا إبلاغ كتابي إلزامي بالقصور الجوهري.'}</li>
  <li>ISA 700/705: يُقيَّم أثر القصور على الرأي إن تعذّر الحصول على أدلة كافية بالإجراءات البديلة.</li></ul>
 <p class="row noprint" style="gap:6px;flex-wrap:wrap">${['D530','D510','D520','D515'].map(lk).join('')}</p>
 <h3>ملخص مُعتمد للملف</h3>${edc('coso.conclusion',{label:'استنتاج تقييم الرقابة الداخلية',ph:'اكتب الاستنتاج النهائي للمراجع حول وجود وفعالية المكونات الخمسة…',dv:''})}`}
function cosoHTML(ref){if(window.MEAP_EXPORT){/* export: every pane, in order */const P={sum:cosoSumHTML,asm:cosoAsmHTML,def:cosoDefHTML,lnk:cosoLnkHTML,rep:cosoRepHTML};return COSO_TABS.map(x=>`<h2>${x[1]}</h2>${P[x[0]]()}`).join('')}
 const t=COSO_UI.tab;const body={sum:cosoSumHTML,asm:cosoAsmHTML,def:cosoDefHTML,lnk:cosoLnkHTML,rep:cosoRepHTML}[t]||cosoSumHTML;
 return `<div class="row noprint coso-tabs" role="tablist" style="gap:4px;flex-wrap:wrap;margin:8px 0">${COSO_TABS.map(x=>`<button type="button" role="tab" class="btn ${x[0]===t?'':'o'} sm" aria-selected="${x[0]===t}" data-coso-tab="${x[0]}">${x[1]}</button>`).join('')}</div>${body()}`}
BLOCKS.coso=cosoHTML;
XP.coso=(it,p,ref)=>`<h3>تقييم نظام الرقابة الداخلية وفق COSO 2013</h3><div data-block="coso|${esc(ref)}">${cosoHTML(ref)}</div>`;
document.addEventListener('click',e=>{const el=e.target instanceof Element?e.target:null;if(!el)return;
 const tb=el.closest('[data-coso-tab]');if(tb){e.preventDefault();COSO_UI.tab=tb.dataset.cosoTab;refreshBlock('coso');return}
 const fb=el.closest('[data-coso-find]');if(fb&&CUR.eng){const n=+fb.dataset.cosoFind;const x=cosoAll().find(y=>y.n===n);if(!x)return;const sv=cosoSev(n)==='S';
  addRec('f',{desc:'COSO مبدأ '+n+' ('+x.ar+'): '+(cosoG(n,'dsc')||COSO_ST[cosoStat(n)][0]),type:sv?'Significant Deficiency قصور جوهري':'Control Deficiency قصور رقابي',sev:sv?'H':'M',ref:'B340'});toast('أُضيف إلى سجل الملاحظات.','s')}});
