/* MEAP · View: Dashboard */
'use strict';
/* ===== Dashboard ===== */
V.dash=function(){const all=PROCS.map(p=>p.id),pr=prog(all);const F_=recs(CUR.eng,'f'),A_=recs(CUR.eng,'a'),R_=recs(CUR.eng,'r');const rnOpen=R_.filter(r=>r.status!=='Cleared').length;
 const wpDone=W.filter(w=>['CL','FN'].indexOf(G('wp.'+w[0]+'.wf'))>-1).length;const subs=A.reduce((s,a)=>s+a.subs.length,0);
 const k=(n,l,c,href)=>`<${href?'a href="'+href+'"':'div'} class="kpi ${c||''}"><b>${n}</b><span>${l}</span></${href?'a':'div'}>`;
 const fsG=[['A','الأصول Assets'],['L','الالتزامات Liabilities'],['E','حقوق الملكية Equity'],['P','الربح أو الخسارة P&L'],['O','الدخل الشامل الآخر OCI']];
 const rows=[['مراحل المراجعة (Audit Phases)',prog(PROCS.filter(p=>p.src==='ph').map(p=>p.id))]];
 fsG.forEach(g=>rows.push([g[1],prog(PROCS.filter(p=>p.src==='acc'&&AC[p.acc].fs===g[0]).map(p=>p.id))]));
 rows.push(['دورات العمليات (Cycles & RCM)',prog(PROCS.filter(p=>p.src==='cyc').map(p=>p.id))],['الرقابة الداخلية وتقنية المعلومات',prog(PROCS.filter(p=>p.src==='itc').map(p=>p.id))],['المجالات المعقدة',prog(PROCS.filter(p=>p.src==='cx').map(p=>p.id))],['مراجعة المجموعة',prog(PROCS.filter(p=>p.src==='grp').map(p=>p.id))]);
 const wfc={};WF.forEach(w=>{wfc[w[0]]=0});W.forEach(w=>{wfc[G('wp.'+w[0]+'.wf','NS')]++});
 const broken=brokenLinks().length;let nAtt=0;for(const [kk] of CUR.eng.entries('wp.'))if(/^wp\.[^.]+\.att\.[^.]+$/.test(kk))nAtt++;
 const flow=[['','Client'],['ph/accept','Acceptance'],['ph/terms','Engagement'],['ph/strategy','Planning'],['ph/entity','Understanding'],['ph/risk','Risk Assessment'],['sampling','Materiality'],['itc','Internal Controls'],['rcm','RCM'],['ph/resp','Strategy'],['program','Program'],['explorer','Testing'],['evidence','Evidence'],['wplib','Working Papers'],['logs','Findings & Adjustments'],['comp','Completion'],['disc','Disclosures'],['ph/gc','Going Concern'],['ph/subev','Subsequent Events'],['ph/mrl','Representations'],['ph/comm','Governance'],['ph/opinion','Opinion'],['ph/report','Report'],['ph/doc','Archiving']];
 const fws=['IFRS','IFRS for SMEs','EAS - معايير المحاسبة المصرية','Local GAAP','Special Purpose (ISA 800)'];const fw=G('eng.fw','IFRS');
 return `<h1>لوحة المؤشرات (Dashboard)</h1><p class="sub">${esc(CUR.company.name)} · ${esc(t('year'))} ${esc(G('eng.year',''))} — يُحفظ كل تعديل تلقائيًا في ${STORE.kind==='fs'?'مجلد الحفظ':'تخزين المتصفح'}.</p>
 <div class="card"><h3 style="margin-top:0">بيانات الارتباط (Engagement Details)</h3><div class="fgrid">
 <label>الشركة<input class="in" value="${esc(CUR.company.name)}" readonly></label>
 <label>الفترة المالية المنتهية في<input class="in" data-k="eng.period" value="${esc(G('eng.period',''))}" placeholder="2026-12-31"${RO()?' readonly':''}></label>
 <label>إطار التقرير (Framework)<select class="sel" data-k="eng.fw"${RO()?' disabled':''}>${fws.map(x=>`<option${fw===x?' selected':''}>${esc(x)}</option>`).join('')}</select></label>
 <label>القطاع (Industry)<select class="sel" data-k="eng.ind"${RO()?' disabled':''}><option value="">— الكل —</option>${IND.map(i=>`<option value="${i.id}"${G('eng.ind')===i.id?' selected':''}>${esc(i.n)}</option>`).join('')}</select></label>
 <label>الأهمية النسبية (OM) — من A500<input class="in" dir="ltr" data-matchip="om" value="${esc(G('eng.mat',''))}" readonly></label>
 <label>أهمية الأداء (PM) — من A500<input class="in" dir="ltr" data-matchip="pm" value="${esc(G('eng.pm',''))}" readonly></label>
 <label>حد الضآلة الواضحة (CT) — من A500<input class="in" dir="ltr" data-matchip="ct" value="${esc(G('eng.ct',''))}" readonly></label>
 </div><div class="row noprint" style="margin-top:.7rem">${can('create')?`<button class="btn o" type="button" data-act="clone">${esc(t('clone'))}</button>`:''}<a class="btn g" href="${L('report')}">🖨 التقرير الموحد</a><span data-pres="" class="pres"></span></div></div>
 <div class="grid g4">${k(PH.length+C.length+CX.length+1,'مجالات المراجعة (Audit Areas)')}${k(A.length+' / '+subs,'الحسابات / الفرعية')}${k(PROCS.length,'الإجراءات (Procedures)',null,L('explorer'))}${k(RISKS.length,'المخاطر (Risks)',null,L('risks'))}${k(CTRLS.length,'الضوابط (Controls)',null,L('rcm'))}${k(Object.keys(WP).length,'أوراق العمل (Working Papers)',null,L('wplib'))}${k(pr.d,'إجراءات مكتملة','g')}${k(pr.t-pr.d,'إجراءات معلقة','w')}${k(pr.ex+F_.length,'الاستثناءات والملاحظات','r',L('logs/f'))}${k(A_.length,'التسويات (Adjustments)','w',L('logs/a'))}${k(rnOpen+' / '+R_.length,'ملاحظات المراجعة المفتوحة','w',L('logs/r'))}${k(pr.p+'%','نسبة الإنجاز','g')}${k(nAtt,'المرفقات (Attachments)')}${k(broken,'روابط مكسورة بين الأوراق',broken?'r':'g',L('wplib'))}</div>
 <div class="card"><h3 style="margin-top:0">نسبة الإنجاز حسب المجال</h3>${rows.map(r=>`<div class="prow"><span>${r[0]}</span>${bar(r[1].p)}<span class="mut">${r[1].p}% <small>(${r[1].d}/${r[1].t})</small></span></div>`).join('')}
 <div class="prow"><span>قائمة الإفصاحات</span>${bar(navProg('disc'))}<span class="mut">${navProg('disc')}%</span></div><div class="prow"><span>قائمة الإقفال</span>${bar(navProg('comp'))}<span class="mut">${navProg('comp')}%</span></div>
 <div class="prow"><span>أوراق العمل المُنهاة</span>${bar(Math.round(wpDone*100/W.length))}<span class="mut">${Math.round(wpDone*100/W.length)}% <small>(${wpDone}/${W.length})</small></span></div></div>
 ${dashHeat()}
 <div class="card"><h3 style="margin-top:0">سير عمل أوراق العمل (Workflow)</h3><div class="grid g4">${WF.map(w=>k(wfc[w[0]],w[1])).join('')}</div></div>
 <div class="card"><h3 style="margin-top:0">الهيكل المتكامل للمراجعة</h3><div class="flow">${flow.map(f=>`<a href="${f[0]?L(f[0]):'#/c/'+encodeURIComponent(CUR.company.id)}">${f[1]}</a>`).join('<span class="mut" aria-hidden="true">←</span>')}</div>
 <p class="note">المسار التحليلي لكل حساب: الحساب ← المخاطر ← التأكيدات ← الضوابط ← الإجراءات ← الأدلة ← أوراق العمل ← الملاحظات ← التسويات ← الاستنتاج.</p></div>`};
