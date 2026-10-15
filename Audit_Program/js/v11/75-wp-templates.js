/* Audit-Plus · v11 · Worksheet templates — a purpose-built working template for every audit area (instead of one generic layout).
   Each family of areas gets its own input grids (with live formulas), automatic tie-out to the trial balance (natural sign, after adjustments),
   status against performance materiality, and a one-click path to the findings log.  The template is placed at the top of the area's main paper;
   data are stored with the engagement (wp.<ref>.cg.* grids and wt.<ref>.* inputs) and are exported to Excel like any other table. */
'use strict';
const WT={fam:{},byArea:{}};
const wtT=(k,h)=>({k,h,t:'t'}),wtN=(k,h,sum)=>({k,h,t:'n',sum:sum?1:0}),wtF=(k,h,f,sum,fmt)=>({k,h,t:'f',f,sum:sum?1:0,fmt});
const wtPre=(col,names)=>names.map(n=>({[col]:n}));
function wtReg(key,spec){WT.fam[key]=spec;(spec.areas||[]).forEach(a=>{WT.byArea[a]=key})}
const wtIn=(ref,k,d)=>num(G('wt.'+ref+'.'+k,d==null?'':d));
function wtGridRows(ref,g){const spec=g.spec;return cgRows(ref,g.id,spec).map((rid,i)=>{const base=cgKey(ref,g.id)+'.v.'+rid+'.';const vals={};spec.cols.forEach(c=>{let v=G(base+c.k,null);if(v==null&&spec.pre&&spec.pre[i]&&rid==='r'+i)v=spec.pre[i][c.k];vals[c.k]=v});return cgCompute(ref,g.id,spec,rid,vals)})}
function wtTBVal(a){if(!TBSTORE.ready())return null;const D=areaData(a.id),sg=AREA_SIGN(a);const T=TBSTORE.lineTotals({adjusted:true});
 return{cy:D.cy*sg,ob:D.ob==null?null:D.ob*sg,py:D.py==null?null:D.py*sg,n:D.rows.length,T,line:id=>T[id]||0}}
function wtCtx(ref,a,F){const grids=F.grids(a).map(g=>({id:g.id,t:g.t,h:g.h,spec:g.spec}));const rowsCache={};
 return{ref,a,tb:wtTBVal(a),M:matState(),grids,
  v:(k,d)=>wtIn(ref,k,d),
  rows:gid=>{if(!rowsCache[gid]){const g=grids.find(x=>x.id===gid);rowsCache[gid]=g?wtGridRows(ref,g):[]}return rowsCache[gid]},
  sum:(gid,col)=>(rowsCache[gid]||(rowsCache[gid]=wtGridRows(ref,grids.find(x=>x.id===gid)))).reduce((s,r)=>s+(isFinite(r[col])?r[col]:0),0),
  pl:id=>{const x=fsLines('PL',[id]);return x.cy}}}
/* result items: hd / tie(label,a,b) / val(label,v,note) / chk(label,ok,note) */
const wtTie=(l,a,b,note)=>({t:'tie',l,a,b,note}),wtVal=(l,v,note,fmt)=>({t:'val',l,v,note,fmt}),wtChk=(l,ok,note)=>({t:'chk',l,ok,note}),wtHd=l=>({t:'hd',l});
const wtPct=(a,b)=>b?a/b*100:null;
function wtStat(diff,M){const d=Math.abs(diff);const tol=Math.max(1,M.ct||0);if(d<=tol)return['ok','✓ مطابق'];if(M.pm&&d<=M.pm)return['warn','⚠ ضمن أهمية الأداء — يُدرج في ملخص التحريفات غير المعدلة'];if(!M.pm)return['warn','⚠ فرق — حدّد الأهمية النسبية'];return['bad','✖ يتجاوز أهمية الأداء — يستلزم تسوية أو إجراء إضافي']}
function wtResHTML(ref,a,F){const X=wtCtx(ref,a,F);let items=[];try{items=F.calc(X)||[]}catch(e){logErr('wt calc '+a.id,e);return`<div class="note bad">تعذّر الاحتساب: ${esc(errMsg(e))}</div>`}
 const ro=RO();let nb=0,nw=0,rows='';
 for(const x of items){
  if(x.t==='hd'){rows+=`<tr class="grp"><td colspan="6">${esc(x.l)}</td></tr>`;continue}
  if(x.t==='tie'){if(x.b==null||x.a==null||!isFinite(x.a)||!isFinite(x.b)){rows+=`<tr><td class="sub1">${esc(x.l)}</td><td class="num" dir="ltr">${x.a==null?'—':fm(x.a)}</td><td class="num" dir="ltr">—</td><td class="num">—</td><td colspan="2" class="mut small">${X.tb?'':'ارفع الميزان وبوّبه ليظهر الطرف المقابل'}</td></tr>`;continue}
   const d=x.a-x.b;const [c,t]=wtStat(d,X.M);if(c==='bad')nb++;else if(c==='warn')nw++;
   const btn=c!=='ok'&&!ro?`<button class="btn g sm noprint" type="button" data-wt-find="${esc(x.l)}" data-amt="${Math.round(d)}" data-ref="${esc(ref)}">+ سجل الملاحظات</button>`:'';
   rows+=`<tr class="${c==='ok'?'okrow':c==='bad'?'bad':''}"><td class="sub1">${esc(x.l)}${x.note?`<div class="mut small">${esc(x.note)}</div>`:''}</td><td class="num" dir="ltr">${fm(x.a)}</td><td class="num" dir="ltr">${fm(x.b)}</td><td class="num" dir="ltr"><b>${fm(d)}</b></td><td class="small">${t}</td><td class="noprint">${btn}</td></tr>`;continue}
  if(x.t==='val'){const v=x.v;const s=v==null||!isFinite(v)?'—':(x.fmt==='pct'?v.toFixed(1)+'%':x.fmt==='days'?Math.round(v)+' يوم':x.fmt==='x'?v.toFixed(2):fm(v));rows+=`<tr><td class="sub1">${esc(x.l)}</td><td class="num" dir="ltr"><b>${s}</b></td><td></td><td></td><td colspan="2" class="mut small">${esc(x.note||'')}</td></tr>`;continue}
  if(x.t==='chk'){if(x.ok===false)nb++;rows+=`<tr class="${x.ok===true?'okrow':x.ok===false?'bad':''}"><td class="sub1">${esc(x.l)}</td><td colspan="3"></td><td colspan="2" class="small">${x.ok===true?'✓ ':x.ok===false?'✖ ':'ℹ '}${esc(x.note||'')}</td></tr>`}}
 const sum=nb?`<div class="note bad">${nb} بند يحتاج معالجة${nw?` و${nw} فرق ضمن أهمية الأداء`:''} — راجع الأسطر المظللة.</div>`:nw?`<div class="note warn">${nw} فرق ضمن أهمية الأداء — قيّمها مع التحريفات الأخرى.</div>`:`<div class="note ok">لا فروق جوهرية في نتائج النموذج الحالية.</div>`;
 return `${sum}<div class="tw"><table class="fst wt-res"><thead><tr><th>الاختبار / المؤشر</th><th>المحتسب (الورقة)</th><th>الميزان / المقابل</th><th>الفرق</th><th>الحالة</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`}
function wtHTML(it){const key=WT.byArea[it.area];if(!key)return'';const F=WT.fam[key];const a=CT.areaBy[it.area];const ref=it.ref;const ro=RO();
 const grids=F.grids(a).map(g=>({id:g.id,t:g.t,h:g.h,spec:g.spec}));
 const ins=(F.inputs?F.inputs(a):[]).map(i=>`<label>${esc(i.l)}<input class="in num" dir="ltr" inputmode="decimal" data-wtin="1" data-k="wt.${esc(ref)}.${i.k}" value="${esc(G('wt.'+ref+'.'+i.k,i.d==null?'':i.d))}" placeholder="${esc(i.ph||'')}" aria-label="${esc(i.l)}"${ro?' readonly':''}>${i.u?`<span class="mut small">${esc(i.u)}</span>`:''}</label>`).join('');
 const tbn=wtTBVal(a);
 return `<section class="wtpl card" data-wtpl="${esc(ref)}" aria-label="${esc(F.name)}">
 <h3 style="margin-top:0">${F.icon||'🧩'} نموذج مخصص: ${esc(F.name)} <span class="b isa">${esc(a.ar)}</span></h3>
 <p class="mut small">${esc(F.intro)}</p>
 ${tbn?`<div class="kpis"><div><span>الرصيد بعد التسويات</span><b dir="ltr">${fm(tbn.cy)}</b></div><div><span>أول المدة</span><b dir="ltr">${tbn.ob==null?'—':fm(tbn.ob)}</b></div><div><span>السنة السابقة</span><b dir="ltr">${tbn.py==null?'—':fm(tbn.py)}</b></div><div><span>عدد الحسابات</span><b>${tbn.n}</b></div></div>`:`<div class="note warn">لم يُحمَّل الميزان — النموذج يعمل بالمدخلات اليدوية ولا تظهر مطابقة الميزان. <a href="${L('tb/upload')}">ارفع الميزان</a></div>`}
 ${ins?`<div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;margin:8px 0">${ins}</div>`:''}
 ${grids.map(g=>`<h4>${esc(g.t)}</h4>${g.h?`<p class="mut small">${esc(g.h)}</p>`:''}${cgReg(ref,g.id,g.spec)}`).join('')}
 <h4>نتائج الاحتساب والمطابقة</h4><div data-wtres="${esc(ref)}">${wtResHTML(ref,a,F)}</div>
 ${(F.tips||[]).length?`<details class="nt"><summary>إرشادات المراجع لهذا النموذج</summary><ul class="l">${F.tips.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></details>`:''}
 ${edc('wp.'+ref+'.wt.concl',{label:'استنتاج النموذج',ph:'اكتب استنتاج المراجع عن هذه الورقة استنادًا لنتائج النموذج…',ml:1})}
 </section>`}
function wtRefresh(ref){const box=document.querySelector(`[data-wtres="${CSS.escape(ref)}"]`);if(!box)return;const it=CT.items[ref];if(!it||!it.area)return;const F=WT.fam[WT.byArea[it.area]];if(!F)return;box.innerHTML=wtResHTML(ref,CT.areaBy[it.area],F)}
/* wrap the generic body: the template goes first, then the generic procedures/risks of the paper */
const ctBody0_generic=ctBody0;
ctBody0=function(it,opt){const g=ctBody0_generic(it,opt);if(it&&it.area&&it.kind==='main'&&WT.byArea[it.area]){try{return wtHTML(it)+g}catch(e){logErr('wt '+it.area,e)}}return g};
document.addEventListener('cgcalc',e=>{const d=e.detail;if(d&&d.ref)setTimeout(()=>wtRefresh(d.ref),0)});
document.addEventListener('input',e=>{const el=e.target;if(el instanceof Element&&el.dataset&&el.dataset.wtin){const p=el.closest('[data-wtpl]');if(p)setTimeout(()=>wtRefresh(p.dataset.wtpl),0)}});
document.addEventListener('click',e=>{const b=e.target instanceof Element&&e.target.closest('[data-wt-find]');if(!b||!CUR.eng||RO())return;const it=CT.items[b.dataset.ref];
 addRec('f',{desc:'نموذج الورقة '+(it?it.disp:b.dataset.ref)+': '+b.dataset.wtFind+' — فرق '+fm(+b.dataset.amt),type:'Misstatement تحريف / فرق',sev:'M',amt:Math.abs(+b.dataset.amt),ref:it?it.disp:b.dataset.ref});toast('أُضيف إلى سجل الملاحظات.','s')});

/* =============== families =============== */
const WT_NAMES={
 PPE:['أراضي','مباني وإنشاءات','آلات ومعدات','سيارات ووسائل نقل','أثاث وتجهيزات','أجهزة حاسب وبرامج'],CIP:['مشروع (1)','مشروع (2)','مشروع (3)'],IP:['أراضٍ استثمارية','مبانٍ استثمارية'],
 INT:['برمجيات','علامات وتراخيص','قوائم عملاء','تكاليف تطوير','شهرة (لا تُطفأ)'],AGR:['أصول بيولوجية متداولة','أصول بيولوجية مثمرة'],LES:['أراضٍ ومبانٍ مؤجرة','مركبات','معدات وآلات']};
/* 1) fixed-asset style roll-forward */
wtReg('rollfwd',{name:'جدول حركة الأصول (Roll-forward) وإعادة احتساب الإهلاك',icon:'🏗️',areas:['PPE','CIP','IP','INT','AGR','LES'],
 intro:'أدخل حركة كل فئة من سجل الأصول: التكلفة أول المدة والإضافات والاستبعادات والتحويلات ثم مجمع الإهلاك وإهلاك العام ومعدله. يُحتسب الرصيد الختامي وصافي القيمة الدفترية ويُعاد احتساب الإهلاك (متوسط التكلفة × المعدل) وتُطابق النتائج مع الميزان.',
 grids:a=>[{id:'rf',t:'حركة التكلفة ومجمع الإهلاك لكل فئة',h:'إهلاك العام المحتسب = متوسط التكلفة (أول + آخر) ÷ 2 × المعدل. تُترك الأراضي والشهرة بمعدل صفر.',
  spec:{n:(WT_NAMES[a.id]||['فئة (1)','فئة (2)','فئة (3)']).length,pre:wtPre('a',WT_NAMES[a.id]||['فئة (1)','فئة (2)','فئة (3)']),cols:[wtT('a','الفئة'),wtN('co','التكلفة أول المدة',1),wtN('ad','إضافات',1),wtN('ds','استبعادات (تكلفة)',1),wtN('tr','تحويلات (±)',1),wtF('cc','التكلفة آخر المدة','co+ad-ds+tr',1),wtN('ao','مجمع الإهلاك أول المدة',1),wtN('ac','إهلاك/إطفاء العام',1),wtN('ads','إهلاك المستبعد',1),wtF('acl','مجمع الإهلاك آخر المدة','ao+ac-ads',1),wtF('nbv','صافي القيمة الدفترية','cc-acl',1),wtN('rt','المعدل %'),wtF('dc','الإهلاك المعاد احتسابه','(co+cc)/2*rt/100',1),wtF('df','فرق الإهلاك (المسجل − المحتسب)','ac-dc',1)]}}],
 calc:X=>{const r=[];const tb=X.tb,M=X.M;r.push(wtHd('مطابقة مع الميزان'));
  r.push(wtTie('صافي القيمة الدفترية بالجدول مقابل رصيد المجال بالميزان',X.sum('rf','nbv'),tb?tb.cy:null));
  if(tb&&tb.ob!=null)r.push(wtTie('صافي القيمة أول المدة (التكلفة − المجمع) مقابل أول المدة بالميزان',X.sum('rf','co')-X.sum('rf','ao'),tb.ob));
  if(tb&&['PPE','INT','IP','LES'].includes(X.a.id))r.push(wtTie('إهلاك/إطفاء العام بالجدول مقابل مصروف الإهلاك بقائمة الدخل',X.sum('rf','ac'),tb.line('depx'),'يشمل مصروف الإهلاك كل الفئات؛ تأكد من تغطية الجدول لجميع الأصول'));
  r.push(wtHd('إعادة الاحتساب والتحليل'));
  r.push(wtTie('إهلاك العام المسجل مقابل المعاد احتسابه',X.sum('rf','ac'),X.sum('rf','dc')));
  const rows=X.rows('rf');const bad=rows.filter(x=>M.pm&&Math.abs(x.df)>M.pm).length;
  r.push(wtChk('فئات يتجاوز فرق إهلاكها أهمية الأداء',bad===0,bad?bad+' فئة — افحص الأعمار الإنتاجية والمعدلات':'لا توجد'));
  r.push(wtChk('عدم وجود صافي قيمة دفترية سالب',!rows.some(x=>x.nbv<-0.5),rows.some(x=>x.nbv<-0.5)?'يوجد صافي سالب — راجع الاستبعادات والمجمع':'سليم'));
  r.push(wtVal('الإضافات كنسبة من التكلفة أول المدة',wtPct(X.sum('rf','ad'),X.sum('rf','co')),'عالية = وسّع فحص الرسملة','pct'));
  r.push(wtVal('نسبة الإهلاك إلى متوسط التكلفة',wtPct(X.sum('rf','ac'),(X.sum('rf','co')+X.sum('rf','cc'))/2),'قارنها بالسياسة المعلنة','pct'));return r},
 tips:['اختبر الإضافات فوق أهمية الأداء بالفواتير والعقود ومحاضر الاستلام، وفرّق بين المصروف الرأسمالي والإيرادي.','تحقق من الاستبعادات: المتحصلات والتخلص الفعلي وربح/خسارة البيع.','قارن الأعمار الإنتاجية بالسياسة والممارسة القطاعية ومؤشرات الانخفاض (IAS 36).']});
/* 2) receivables / contract assets */
wtReg('recv',{name:'أعمار الديون والخسائر الائتمانية المتوقعة والمصادقات',icon:'📬',areas:['REC','NCR','CON','LSR'],
 intro:'أدخل أعمار الأرصدة من كشف الأعمار وفئات الخسارة المتوقعة (مصفوفة IFRS 9)، وسجّل نتائج المصادقات. يُقارَن الإجمالي بالميزان (الصافي + المخصص) وتُحتسب الخسائر المتوقعة وتغطية المصادقات.',
 inputs:()=>[{k:'alw',l:'مخصص الخسائر الائتمانية المسجل بالدفاتر',d:'',ph:'0'},{k:'sub',l:'المقبوض بعد تاريخ القوائم من أرصدة نهاية العام',d:'',ph:'0'},{k:'rev',l:'إيرادات السنة (للحساب DSO) — فارغ = من الميزان',d:'',ph:'تلقائي'}],
 grids:()=>[{id:'age',t:'أعمار الأرصدة ومصفوفة الخسائر المتوقعة',h:'نسبة الخسارة لكل فئة من خبرة التحصيل التاريخية معدّلة بالظروف الحالية والمستقبلية.',
  spec:{n:7,pre:[{b:'غير مستحق',rt:0.5},{b:'1-30 يوم',rt:1.5},{b:'31-60 يوم',rt:4},{b:'61-90 يوم',rt:10},{b:'91-180 يوم',rt:25},{b:'181-365 يوم',rt:50},{b:'أكثر من سنة',rt:90}],cols:[wtT('b','الفئة'),wtN('am','الرصيد الإجمالي',1),wtN('rt','نسبة الخسارة %'),wtF('ecl','الخسارة المتوقعة','am*rt/100',1)]}},
  {id:'cf',t:'سجل المصادقات (العملاء الأعلى رصيدًا)',h:'المصادَق عليه = رد متفق. فرق = رد بفرق. بديل = إجراءات بديلة (مقبوضات لاحقة/مستندات شحن).',
  spec:{n:6,cols:[wtT('c','العميل'),wtN('bal','الرصيد الدفتري',1),wtN('agr','رد متفق',1),wtN('dif','رد بفرق',1),wtN('alt','إجراء بديل',1),wtF('unc','غير مغطى','bal-agr-dif-alt',1)]}}],
 calc:X=>{const r=[],tb=X.tb;const alw=X.v('alw'),gross=tb?tb.cy+alw:null;r.push(wtHd('المطابقة'));
  r.push(wtTie('إجمالي الأعمار مقابل (الرصيد بالميزان + مخصص الخسائر)',X.sum('age','am'),gross));
  r.push(wtTie('الخسائر المتوقعة المحتسبة مقابل المخصص المسجل',X.sum('age','ecl'),alw,'عجز المخصص = المحتسب − المسجل (تحريف محتمل)'));
  r.push(wtHd('المصادقات والتحصيل'));
  const bal=X.sum('cf','bal');r.push(wtVal('نسبة تغطية الأرصدة المصادَق عليها من إجمالي الأرصدة',wtPct(bal,gross),'الأهداف: رصيد جوهري ومخاطر مرتفعة','pct'));
  r.push(wtVal('الأرصدة غير المغطاة في السجل',X.sum('cf','unc'),'وسّع المصادقات أو الإجراءات البديلة'));
  r.push(wtVal('الردود بفروق',X.sum('cf','dif'),'سوِّ كل فرق وصنّفه (توقيت/خطأ/نزاع)'));
  r.push(wtVal('نسبة المقبوض اللاحق من الرصيد',wtPct(X.v('sub'),gross),'دليل بديل على الوجود والتقييم','pct'));
  const rev=X.v('rev')||(tb?(X.pl('rev')):0);r.push(wtVal('أيام التحصيل (DSO)',rev?gross/rev*365:null,'قارنها بالسنة السابقة وشروط الائتمان','days'));
  const old=(X.rows('age').slice(5).reduce((s,x)=>s+x.am,0));r.push(wtVal('الأرصدة المتأخرة أكثر من 180 يومًا',old,'اختبر قابلية التحصيل والمخصص الخاص'));return r},
 tips:['طابق كشف الأعمار مع الأستاذ المساعد والعام (اكتمال ودقة التقرير قبل الاعتماد عليه).','اختبر قطع الإيراد وحالة الأرصدة الدائنة للعملاء وإعادة تصنيفها.','اشرح أي مخصص خاص وأي ضمانات أو تأمين ائتماني.']});
/* 3) inventory */
wtReg('invt',{name:'جرد المخزون وصافي القيمة القابلة للتحقق وبطء الحركة',icon:'📦',areas:['INVT'],
 intro:'سجّل نتائج المشاهدة الفعلية للجرد وتسوية حركة ما بعد الجرد، وصافي القيمة القابلة للتحقق (IAS 2) وأعمار المخزون لاحتساب مخصص بطء الحركة، وقارن النتائج بالميزان.',
 inputs:()=>[{k:'prov',l:'مخصص المخزون المسجل (تلف/بطء/NRV)',d:'',ph:'0'},{k:'cogs',l:'تكلفة المبيعات — فارغ = من الميزان',d:'',ph:'تلقائي'}],
 grids:()=>[{id:'cnt',t:'مطابقة الجرد الفعلي مع الدفاتر',h:'تسوية تاريخ الجرد = المستلم − المصروف بين تاريخ الجرد وتاريخ القوائم (± للوصول لرصيد القوائم).',spec:{n:5,pre:wtPre('a',['مواد خام','إنتاج تحت التشغيل','منتجات تامة','بضاعة بغرض البيع','قطع غيار ومهمات']),cols:[wtT('a','الصنف'),wtN('bk','رصيد الدفاتر',1),wtN('ct','قيمة الجرد الفعلي',1),wtN('rf','تسوية تاريخ الجرد (±)',1),wtF('adj','الجرد المعدَّل','ct+rf',1),wtF('df','فرق الجرد (المعدل − الدفاتر)','ct+rf-bk',1)]}},
  {id:'nrv',t:'اختبار صافي القيمة القابلة للتحقق (IAS 2.28)',h:'الانخفاض = التكلفة − NRV عندما تزيد التكلفة على NRV.',spec:{n:5,cols:[wtT('c','المجموعة/الصنف'),wtN('cost','التكلفة',1),wtN('nrv','NRV',1),wtF('wd','الانخفاض المطلوب','max(0,cost-nrv)',1)]}},
  {id:'age',t:'أعمار المخزون (بطء الحركة والتقادم)',spec:{n:4,pre:[{b:'أقل من 6 شهور',pv:0},{b:'6-12 شهرًا',pv:10},{b:'1-2 سنة',pv:40},{b:'أكثر من سنتين',pv:80}],cols:[wtT('b','الفئة'),wtN('am','القيمة',1),wtN('pv','نسبة المخصص %'),wtF('pr','المخصص المحتسب','am*pv/100',1)]}}],
 calc:X=>{const r=[],tb=X.tb,pv=X.v('prov');r.push(wtHd('المطابقة مع الميزان'));
  r.push(wtTie('رصيد الدفاتر بالجدول مقابل رصيد الميزان (+ المخصص)',X.sum('cnt','bk'),tb?tb.cy+pv:null));
  r.push(wtTie('الجرد المعدَّل مقابل رصيد الدفاتر',X.sum('cnt','adj'),X.sum('cnt','bk'),'الفرق = فروق الجرد المحتمل تسويتها'));
  r.push(wtTie('الانخفاض المطلوب (NRV + بطء حركة) مقابل المخصص المسجل',X.sum('nrv','wd')+X.sum('age','pr'),pv));
  r.push(wtHd('مؤشرات'));
  r.push(wtVal('نسبة تغطية الجرد المشاهَد من رصيد الدفاتر',wtPct(X.sum('cnt','ct'),X.sum('cnt','bk')),'يجب أن تغطي المشاهدة الأصناف الجوهرية','pct'));
  const c=X.v('cogs')||(tb?X.pl('cos')*-1:0);const c2=Math.abs(c);r.push(wtVal('أيام المخزون (DIO)',c2&&tb?tb.cy/c2*365:null,'قارنها بالسنة السابقة','days'));
  r.push(wtVal('نسبة الأصناف الراكدة (أكثر من سنة) من الإجمالي',wtPct(X.rows('age').slice(2).reduce((s,x)=>s+x.am,0),X.sum('age','am')),'','pct'));return r},
 tips:['احضر الجرد أو اختبر ضوابطه، وأعد عد عينة (من الأرض للسجل ومن السجل للأرض).','اختبر قطع المشتريات والمبيعات حول تاريخ الجرد.','اختبر التكلفة (فواتير الشراء ومعيار التحميل) وبنود الأمانة لدى الغير.']});
/* 4) cash and bank */
wtReg('cash',{name:'التسويات البنكية والمصادقات وتغطية الأرصدة',icon:'🏦',areas:['CASH'],
 intro:'لكل حساب بنكي: رصيد الدفاتر ورصيد كشف الحساب والإيداعات في الطريق والشيكات المعلقة والبنود الأخرى؛ يُحتسب الرصيد المعدَّل والفرق غير المفسَّر وتُتابَع المصادقات البنكية.',
 inputs:()=>[{k:'stale',l:'شيكات معلقة أقدم من 6 شهور',d:'',ph:'0'},{k:'petty',l:'نقدية بالصندوق تم جردها',d:'',ph:'0'}],
 grids:()=>[{id:'bank',t:'التسوية البنكية لكل حساب',h:'الفرق = رصيد الدفاتر − رصيد البنك المعدَّل (بعد الإيداعات والشيكات). المصادقة: 1 = مستلمة، 0 = لا.',spec:{n:5,cols:[wtT('bk','البنك/الحساب'),wtT('cur','العملة'),wtN('bb','رصيد الدفاتر',1),wtN('sb','رصيد الكشف',1),wtN('dt','إيداعات في الطريق',1),wtN('oc','شيكات معلقة',1),wtN('ot','بنود أخرى (±)',1),wtF('ad','رصيد البنك المعدَّل','sb+dt-oc+ot',1),wtF('df','الفرق غير المفسَّر','bb-ad',1),wtN('cf','مصادقة (1/0)')]}}],
 calc:X=>{const r=[],tb=X.tb;r.push(wtHd('المطابقة'));
  r.push(wtTie('مجموع أرصدة الدفاتر بالتسويات مقابل رصيد النقدية بالميزان',X.sum('bank','bb')+X.v('petty'),tb?tb.cy:null,'يشمل الصندوق المجرود إن أُدخل'));
  r.push(wtTie('الفروق غير المفسرة بالتسويات مقابل صفر',X.sum('bank','df'),0));
  const rows=X.rows('bank');const bb=X.sum('bank','bb');const conf=rows.filter(x=>x.cf>=1).reduce((s,x)=>s+x.bb,0);
  r.push(wtHd('المصادقات والبنود المعلقة'));
  r.push(wtVal('تغطية المصادقات البنكية من إجمالي الأرصدة',wtPct(conf,bb),'المطلوب 100% للحسابات الجوهرية','pct'));
  r.push(wtChk('جميع الحسابات المسجلة مصادَق عليها',rows.filter(x=>x.bb).every(x=>x.cf>=1),'اطلب المصادقة للحسابات المتبقية'));
  r.push(wtVal('الشيكات المعلقة الأقدم من 6 شهور',X.v('stale'),'اختبر قابلية الرد/الإلغاء والتصنيف'));
  r.push(wtVal('الإيداعات في الطريق كنسبة من رصيد الدفاتر',wtPct(X.sum('bank','dt'),bb),'تحقق من الإيداع في كشف ما بعد القوائم','pct'));return r},
 tips:['احصل على المصادقة مباشرة من البنك وبيّن أرصدة القروض والضمانات والتعهدات.','اختبر تحويلات نهاية العام (kiting) بين الحسابات.','طابق الإيداعات والشيكات المعلقة مع كشف ما بعد القوائم.']});
/* 5) equity */
wtReg('equity',{name:'حركة حقوق الملكية والاحتياطي القانوني',icon:'🏛️',areas:['EQY','NCI','SBP','OCI'],
 intro:'أدخل حركة كل مكون من مكونات حقوق الملكية. يُحتسب الرصيد الختامي ويُطابَق مع الميزان وربح العام مع قائمة الدخل، ويُختبر التحويل للاحتياطي القانوني.',
 inputs:()=>[{k:'lrp',l:'نسبة الاحتياطي القانوني من الأرباح %',d:'5',u:'قانون الشركات: يُؤكَّد حسب الشكل القانوني'},{k:'lrc',l:'حد الاحتياطي % من رأس المال',d:'50',u:'يوقف التجنيب عند بلوغه'}],
 grids:()=>[{id:'soce',t:'قائمة التغير في حقوق الملكية (جدول عمل)',h:'التوزيعات تُدخل بالسالب. التحويلات تُلغي بعضها (مجموعها صفر).',spec:{n:8,pre:wtPre('a',['رأس المال','علاوة الإصدار','الاحتياطي القانوني','احتياطيات أخرى','أرباح مرحلة','أسهم خزينة','احتياطي الدخل الشامل الآخر','الحقوق غير المسيطرة']),cols:[wtT('a','المكوّن'),wtN('op','الرصيد أول المدة',1),wtN('pf','ربح العام',1),wtN('oc','دخل شامل آخر',1),wtN('dv','توزيعات (−)',1),wtN('is','إصدار/تخفيض',1),wtN('ot','تحويلات (±)',1),wtF('cl','الرصيد آخر المدة','op+pf+oc+dv+is+ot',1)]}}],
 calc:X=>{const r=[],tb=X.tb,M=X.M;r.push(wtHd('المطابقة'));
  r.push(wtTie('مجموع حقوق الملكية آخر المدة مقابل رصيد المجال بالميزان',X.sum('soce','cl'),tb?tb.cy:null,'يتضمن ربح العام المرحل إن كان الميزان بعد الإقفال'));
  const pl=TBSTORE.ready()?fsSt('PL').cy:null;r.push(wtTie('ربح العام بالجدول مقابل قائمة الدخل',X.sum('soce','pf'),pl));
  r.push(wtChk('صافي التحويلات بين المكونات = صفر',Math.abs(X.sum('soce','ot'))<=1,'مجموع التحويلات '+fm(X.sum('soce','ot'))));
  const rows=X.rows('soce');const cap=rows[0]?rows[0].cl:0,lop=rows[2]?rows[2].op:0,lmv=rows[2]?rows[2].cl-rows[2].op:0;const prof=X.sum('soce','pf');
  const req=Math.max(0,Math.min(Math.max(prof,0)*X.v('lrp',5)/100,cap*X.v('lrc',50)/100-lop));r.push(wtHd('اختبار الاحتياطي القانوني'));
  r.push(wtTie('التحويل المطلوب للاحتياطي القانوني مقابل الحركة المسجلة',req,lmv,'التجنيب = 5% من الربح حتى بلوغ 50% من رأس المال (النسب مدخلات قابلة للتعديل)'));
  r.push(wtVal('الاحتياطي القانوني كنسبة من رأس المال',wtPct(rows[2]?rows[2].cl:0,cap),'','pct'));
  r.push(wtVal('التوزيعات كنسبة من ربح العام',wtPct(-X.sum('soce','dv'),prof),'اختبر قابلية التوزيع وقرار الجمعية','pct'));return r},
 tips:['طابق رأس المال بالنظام الأساسي والسجل التجاري وقرارات الجمعية العامة.','تحقق من إقرار التوزيعات ومن استيفاء الاحتياطيات قبل التوزيع.','اختبر أسهم الخزينة والمدفوعات القائمة على الأسهم (IFRS 2).']});
/* 6) debt and long-term schedules */
wtReg('debt',{name:'جدول القروض والفوائد والتصنيف المتداول وغير المتداول',icon:'💳',areas:['BOR','CBR','ONL','GG','DEF','LTE'],
 intro:'لكل قرض/التزام: الرصيد أول المدة والسحوبات والسداد، ويُعاد احتساب الفائدة (متوسط الرصيد × المعدل) ويُقارَن بالمحمَّل، ويُفصل الجزء المتداول عن غير المتداول وتُختبر التعهدات.',
 inputs:()=>[{k:'cva',l:'نسبة التعهد الفعلية (مثلاً الرافعة)',d:'',ph:'0'},{k:'cvt',l:'الحد الأقصى المسموح بالتعهد',d:'',ph:'0'}],
 grids:()=>[{id:'ln',t:'جدول القروض والالتزامات',h:'الفائدة المعاد احتسابها = متوسط الرصيد × المعدل %. المصادقة 1 = مستلمة.',spec:{n:5,cols:[wtT('l','الجهة/القرض'),wtN('op','الرصيد أول المدة',1),wtN('dr','السحوبات',1),wtN('rp','السداد',1),wtF('cl','الرصيد آخر المدة','op+dr-rp',1),wtN('rt','معدل الفائدة %'),wtF('av','متوسط الرصيد','(op+cl)/2',1),wtF('ic','الفائدة المعاد احتسابها','av*rt/100',1),wtN('ib','الفائدة المحمّلة بالدفاتر',1),wtF('id','فرق الفائدة','ib-ic',1),wtN('cu','الجزء المتداول',1),wtF('nc','الجزء غير المتداول','cl-cu',1),wtN('cf','مصادقة (1/0)')]}}],
 calc:X=>{const r=[],tb=X.tb;r.push(wtHd('المطابقة'));
  r.push(wtTie('الرصيد آخر المدة بالجدول مقابل رصيد المجال بالميزان',X.sum('ln','cl'),tb?tb.cy:null));
  if(tb&&tb.ob!=null)r.push(wtTie('الرصيد أول المدة بالجدول مقابل أول المدة بالميزان',X.sum('ln','op'),tb.ob));
  r.push(wtTie('الفائدة المعاد احتسابها مقابل المحمَّلة بالدفاتر',X.sum('ln','ic'),X.sum('ln','ib')));
  if(tb&&['BOR','CBR'].includes(X.a.id))r.push(wtTie('الفائدة المحمَّلة بالجدول مقابل تكاليف التمويل بقائمة الدخل',X.sum('ln','ib'),tb.line('fincost'),'تشمل التكاليف الأخرى (عمولات/إيجار) فاستعن بتحليل الحساب'));
  r.push(wtHd('التصنيف والتعهدات'));
  r.push(wtVal('الجزء المتداول كنسبة من الرصيد',wtPct(X.sum('ln','cu'),X.sum('ln','cl')),'اختبر التصنيف مقابل جدول السداد والتعهدات','pct'));
  const a=X.v('cva'),t=X.v('cvt');r.push(wtChk('الالتزام بالتعهدات المالية',a||t?(a<=t):null,a||t?`الفعلية ${a} مقابل الحد ${t}${a>t?' — الإخلال يستلزم إعادة التصنيف إلى متداول (IAS 1)':''}`:'أدخل التعهد الفعلي والحد'));
  const rows=X.rows('ln');r.push(wtVal('تغطية المصادقة من الرصيد',wtPct(rows.filter(x=>x.cf>=1).reduce((s,x)=>s+x.cl,0),X.sum('ln','cl')),'','pct'));return r},
 tips:['صادق على الأرصدة والشروط والضمانات من المقرضين مباشرة.','اختبر الفوائد المستحقة وتكاليف الاقتراض المرسملة (IAS 23).','قيّم الإخلال بالتعهدات وأثره على التصنيف والاستمرارية.']});
/* 7) payables and other liabilities */
wtReg('pay',{name:'البحث عن الالتزامات غير المسجلة ومطابقة كشوف الموردين',icon:'🧾',areas:['PAY','OCL','RPT'],
 intro:'سجّل المدفوعات اللاحقة المفحوصة (اكتمال الالتزامات) ونتائج مطابقة كشوف الموردين؛ يُحتسب إجمالي الالتزامات غير المسجلة وفروق المطابقة وأيام السداد.',
 inputs:()=>[{k:'cogs',l:'تكلفة المبيعات/المشتريات — فارغ = من الميزان',d:'',ph:'تلقائي'}],
 grids:()=>[{id:'un',t:'البحث عن الالتزامات غير المسجلة (مدفوعات بعد نهاية العام)',h:'يخص السنة = 1 إذا كان الالتزام يخص فترات القوائم. مسجل = 1 إذا كان مثبتًا بالدفاتر.',spec:{n:8,cols:[wtT('p','المستفيد/المرجع'),wtT('d','تاريخ السداد'),wtN('am','المبلغ',1),wtN('ye','يخص السنة (1/0)'),wtN('rc','مسجل (1/0)'),wtF('un','غير مسجل','am*ye*(1-rc)',1)]}},
  {id:'st',t:'مطابقة كشوف الموردين',spec:{n:6,cols:[wtT('s','المورد'),wtN('ps','رصيد كشف المورد',1),wtN('pb','رصيد الدفاتر',1),wtF('df','الفرق','pb-ps',1),wtN('ex','فرق مفسَّر',1),wtF('ux','فرق غير مفسَّر','df-ex',1)]}}],
 calc:X=>{const r=[],tb=X.tb;r.push(wtHd('اكتمال الالتزامات'));
  r.push(wtTie('الالتزامات غير المسجلة المكتشفة مقابل صفر',X.sum('un','un'),0,'تحريف بالتقليل في الالتزامات والمصروفات'));
  r.push(wtHd('مطابقة الموردين'));
  r.push(wtVal('تغطية كشوف الموردين من رصيد الميزان',wtPct(X.sum('st','pb'),tb?tb.cy:null),'','pct'));
  r.push(wtTie('الفروق غير المفسرة في المطابقة مقابل صفر',X.sum('st','ux'),0));
  const c=Math.abs(X.v('cogs')||(tb?X.pl('cos'):0));r.push(wtVal('أيام السداد (DPO)',c&&tb?tb.cy/c*365:null,'قارنها بالسنة السابقة وشروط الموردين','days'));return r},
 tips:['افحص المدفوعات بعد نهاية العام وفواتير لم تُسجل وإيصالات استلام بلا فاتورة (GRNI).','اختبر الأرصدة المدينة للموردين وإعادة تصنيفها.','أرصدة الأطراف ذات العلاقة تُطابق مع كشوفهم وتُفصح.']});
/* 8) provisions */
wtReg('prov',{name:'اختبار المخصصات والالتزامات المحتملة (IAS 37)',icon:'⚖️',areas:['PRV'],
 intro:'لكل قضية/التزام: احتمال الخسارة وأفضل تقدير والمسجل؛ تُثبت المخصصات عند احتمال التدفق الخارج أكثر من 50% ويُفصح عن المحتمل (10-50%). يُطابق الرصيد مع الميزان وتُحتسب حركة المخصص.',
 inputs:()=>[{k:'op',l:'رصيد المخصص أول المدة',d:''},{k:'ch',l:'المكوّن خلال العام',d:''},{k:'us',l:'المستخدم خلال العام',d:''},{k:'rl',l:'المردود (انتفاء الحاجة)',d:''}],
 grids:()=>[{id:'pr',t:'سجل القضايا والالتزامات المحتملة',spec:{n:6,cols:[wtT('m','البند/القضية'),wtN('pb','احتمال التدفق الخارج %'),wtN('be','أفضل تقدير للمبلغ',1),wtN('bk','المسجل بالدفاتر',1),wtF('rq','المطلوب إثباته','if(pb>50,be,0)',1),wtF('df','الفرق (المطلوب − المسجل)','if(pb>50,be,0)-bk',1),wtF('ct','محتمل يلزم الإفصاح','if(pb>=10,if(pb<=50,be,0),0)',1)]}}],
 calc:X=>{const r=[],tb=X.tb;r.push(wtHd('المطابقة'));
  r.push(wtTie('المسجل بالجدول مقابل رصيد المجال بالميزان',X.sum('pr','bk'),tb?tb.cy:null));
  r.push(wtTie('المطلوب إثباته مقابل المسجل',X.sum('pr','rq'),X.sum('pr','bk')));
  const cl=X.v('op')+X.v('ch')-X.v('us')-X.v('rl');r.push(wtTie('حركة المخصص (أول + مكوّن − مستخدم − مردود) مقابل الميزان',cl,tb?tb.cy:null));
  r.push(wtVal('التزامات محتملة تتطلب الإفصاح فقط',X.sum('pr','ct'),'ليست مخصصًا لكنها إفصاح (IAS 37.86)'));return r},
 tips:['احصل على مصادقات المستشار القانوني ومراجعة محاضر مجلس الإدارة والجمعيات.','اختبر استنفاد القضايا التي سُوّيت بعد نهاية العام (حدث لاحق).']});
/* 9) taxes */
wtReg('tax',{name:'تسوية الأرصدة الضريبية والزكوية',icon:'🧮',areas:['ITB','OTX','DTX','ZKT'],
 intro:'تسوية الرصيد الضريبي: أول المدة + المحمَّل − المسدد ± المقاصة = الختامي، ومراجعة ضريبة القيمة المضافة (مخرجات − مدخلات) والفروق المؤقتة (IAS 12) والزكاة وفق ورقة الزكاة والضريبة.',
 inputs:a=>a.id==='OTX'?[{k:'out',l:'ضريبة المخرجات (حسب الإقرارات)',d:''},{k:'inp',l:'ضريبة المدخلات',d:''},{k:'pd',l:'المسدد',d:''},{k:'vr',l:'معدل ض.ق.م %',d:'14',u:'يُؤكَّد حسب القانون'}]:a.id==='ITB'?[{k:'op',l:'الرصيد أول المدة (التزام +)',d:''},{k:'ch',l:'ضريبة الدخل الجارية المحمَّلة',d:''},{k:'pd',l:'المسدد/دفعات تحت الحساب',d:''},{k:'of',l:'مقاصة/خصم من المنبع',d:''}]:a.id==='ZKT'?[{k:'zb',l:'الوعاء الزكوي (من ورقة الزكاة)',d:''},{k:'zr',l:'معدل الزكاة %',d:'2.5'},{k:'pd',l:'المسدد من الزكاة',d:''},{k:'op',l:'الرصيد أول المدة',d:''}]:[{k:'dr',l:'معدل الضريبة المؤجلة %',d:'22.5'}],
 grids:a=>a.id==='DTX'?[{id:'tmp',t:'الفروق المؤقتة والضريبة المؤجلة',h:'فرق موجب = التزام مؤجل (القيمة الدفترية أعلى من الأساس الضريبي للأصل)، وسالب = أصل مؤجل.',spec:{n:5,pre:wtPre('i',['أصول ثابتة (إهلاك محاسبي/ضريبي)','مخصصات غير مقبولة','خسائر ضريبية مرحَّلة','فروق تقييم','أخرى']),cols:[wtT('i','البند'),wtN('cv','القيمة الدفترية',1),wtN('tb','الأساس الضريبي',1),wtF('df','الفرق المؤقت','cv-tb',1),wtN('rt','المعدل %'),wtF('dt','الضريبة المؤجلة','df*rt/100',1)]}}]:[],
 calc:X=>{const r=[],tb=X.tb;const id=X.a.id;
  if(id==='OTX'){const net=X.v('out')-X.v('inp');r.push(wtHd('ضريبة القيمة المضافة'));r.push(wtTie('الصافي المستحق (مخرجات − مدخلات − مسدد) مقابل الميزان',net-X.v('pd'),tb?tb.cy:null));
   const rev=Math.abs(X.pl('rev'));r.push(wtTie('ضريبة المخرجات المعاد احتسابها (الإيراد × المعدل) مقابل المقرَّة',rev*X.v('vr',14)/100,X.v('out'),'قد يوجد إيراد معفى أو بسعر صفري'));}
  else if(id==='ITB'){r.push(wtHd('تسوية الرصيد'));const cl=X.v('op')+X.v('ch')-X.v('pd')-X.v('of');r.push(wtTie('الرصيد المحتسب آخر المدة مقابل الميزان',cl,tb?tb.cy:null));
   r.push(wtTie('الضريبة الجارية المحمَّلة مقابل مصروف الضريبة بالميزان',X.v('ch'),tb?tb.line('taxx'):null,'قارن مع ورقة الزكاة وضريبة الدخل 1900.110'));}
  else if(id==='ZKT'){const z=X.v('zb')*X.v('zr',2.5)/100;r.push(wtHd('الزكاة'));r.push(wtVal('الزكاة المحتسبة (الوعاء × المعدل)',z,'الوعاء من ورقة الزكاة والضريبة'));r.push(wtTie('الرصيد المحتسب (أول + الزكاة − المسدد) مقابل الميزان',X.v('op')+z-X.v('pd'),tb?tb.cy:null));}
  else{r.push(wtHd('الضريبة المؤجلة'));r.push(wtTie('صافي الضريبة المؤجلة بالجدول مقابل الميزان',X.sum('tmp','dt'),tb?tb.cy:null));
   const dta=X.rows('tmp').filter(x=>x.dt<0).reduce((s,x)=>s+x.dt,0);r.push(wtVal('أصول ضريبية مؤجلة (قابلة للخصم)',-dta,'اختبر إمكانية الاسترداد بأرباح مستقبلية (IAS 12.24)'));}
  return r},
 tips:['طابق الإقرارات المقدَّمة بالمحمَّل واستفسر عن الفحص الضريبي الجاري والمنازعات.','يربط هذا النموذج بورقة 1900.110 (الزكاة والضريبة) لاحتساب مصروف العام.']});
/* 10) revenue */
wtReg('rev',{name:'تحليل الإيراد (سعر/كمية) واختبار القطع',icon:'📈',areas:['REV'],
 intro:'قارن إيراد كل منتج/خدمة بالسنة السابقة وفكّك التغير إلى أثر كمية وأثر سعر، وسجّل نتائج اختبار القطع (الفواتير حول نهاية العام) لاحتساب التحريف.',
 grids:()=>[{id:'pv',t:'تحليل الإيراد: السعر والكمية والمزيج',h:'أثر الكمية = (كمية العام − كمية السابق) × سعر السابق. أثر السعر = (سعر العام − سعر السابق) × كمية العام.',spec:{n:5,cols:[wtT('p','المنتج/الخدمة'),wtN('qp','الكمية السابقة'),wtN('pp','السعر السابق'),wtN('qc','الكمية الحالية'),wtN('pc','السعر الحالي'),wtF('rp','إيراد السابق','qp*pp',1),wtF('rc','إيراد الحالي','qc*pc',1),wtF('vo','أثر الكمية','(qc-qp)*pp',1),wtF('pr','أثر السعر','(pc-pp)*qc',1)]}},
  {id:'co',t:'اختبار قطع الإيراد (Cut-off)',h:'يخص السنة = 1 إذا كان الأداء/الشحن قبل نهاية العام. مسجل = 1 إذا أُثبت بإيراد السنة. التحريف = المبلغ × (مسجل − يخص).',spec:{n:8,cols:[wtT('i','الفاتورة/المرجع'),wtT('d','تاريخ الشحن/الأداء'),wtN('am','المبلغ',1),wtN('ip','يخص السنة (1/0)'),wtN('rc','مسجل بإيراد السنة (1/0)'),wtF('ms','التحريف','am*(rc-ip)',1)]}}],
 calc:X=>{const r=[],tb=X.tb;r.push(wtHd('المطابقة'));
  r.push(wtTie('إيراد الحالي بالتحليل مقابل رصيد الإيراد بالميزان',X.sum('pv','rc'),tb?tb.cy:null));
  if(tb&&tb.py!=null)r.push(wtTie('إيراد السابق بالتحليل مقابل السنة السابقة بالميزان',X.sum('pv','rp'),tb.py));
  r.push(wtTie('تحريف القطع المكتشف مقابل صفر',X.sum('co','ms'),0,'موجب = إيراد مبالغ فيه (إثبات مبكر)'));
  r.push(wtHd('تفكيك التغير'));r.push(wtVal('أثر الكمية',X.sum('pv','vo')));r.push(wtVal('أثر السعر',X.sum('pv','pr')));
  r.push(wtVal('التغير الكلي في الإيراد',X.sum('pv','rc')-X.sum('pv','rp'),'يساوي أثر الكمية + أثر السعر + أثر المنتجات الجديدة/المتوقفة'));return r},
 tips:['اختبر الاعتراف بالإيراد وفق IFRS 15 (الخطوات الخمس) وعقود العملاء الجوهرية.','وسّع القطع حول نهاية العام وأرصدة المرتجعات والخصومات بعد نهاية العام.','قارن الهوامش بالقطاع واختبر قيود الإيراد اليدوية (مخاطر الغش).']});
/* 11) cost of sales */
wtReg('cos',{name:'معادلة تكلفة المبيعات وتحليل هامش الربح',icon:'⚙️',areas:['COS'],
 intro:'أعد احتساب تكلفة المبيعات: مخزون أول + مشتريات + أجور مباشرة + مصروفات صناعية − مخزون آخر، وقارنها بالميزان وحلّل هامش مجمل الربح.',
 inputs:()=>[{k:'oi',l:'مخزون أول المدة'},{k:'pu',l:'المشتريات/تكلفة الإنتاج'},{k:'dl',l:'الأجور المباشرة'},{k:'oh',l:'مصروفات صناعية'},{k:'ci',l:'مخزون آخر المدة — فارغ = من الميزان',ph:'تلقائي'}],
 grids:()=>[],
 calc:X=>{const r=[],tb=X.tb;const ci=X.v('ci')||(tb?Math.abs(TBSTORE.lineTotals({adjusted:true}).inv||0):0);const cogs=X.v('oi')+X.v('pu')+X.v('dl')+X.v('oh')-ci;r.push(wtHd('إعادة الاحتساب'));
  r.push(wtTie('تكلفة المبيعات المحتسبة مقابل الميزان',cogs,tb?tb.cy:null));
  const rev=Math.abs(X.pl('rev'));r.push(wtHd('الهامش'));r.push(wtVal('هامش مجمل الربح الحالي',rev?(rev-(tb?tb.cy:cogs))/rev*100:null,'قارنه بالسنة السابقة والموازنة والقطاع','pct'));
  if(tb&&tb.py!=null){const rp=Math.abs(fsLines('PL',['rev']).py||0);r.push(wtVal('هامش مجمل الربح السابق',rp?(rp-tb.py)/rp*100:null,'','pct'))}return r},
 tips:['اختبر التحميل على الإنتاج واستيعاب التكاليف الثابتة والفروق المعيارية.','قطع المشتريات والإنتاج والمخزون يؤثر مباشرة على التكلفة.']});
/* 12) employee costs */
wtReg('emp',{name:'مطابقة الأجور والتأمينات الاجتماعية',icon:'👥',areas:['EMP'],
 intro:'قدّر إجمالي الأجور من عدد العاملين ومتوسط الراتب وعدد أشهر الصرف والمكافآت، وحصة صاحب العمل في التأمينات، وقارنها بالمحمَّل بالدفاتر.',
 inputs:()=>[{k:'hc',l:'متوسط عدد العاملين'},{k:'sal',l:'متوسط الراتب الشهري الإجمالي'},{k:'mo',l:'عدد أشهر الصرف',d:'12'},{k:'bn',l:'مكافآت/حوافز/أرباح موزعة'},{k:'si',l:'نسبة حصة صاحب العمل في التأمينات %',d:'18.75',u:'يُؤكَّد حسب قانون التأمينات وسقف الأجر'},{k:'sib',l:'الأجر التأميني كنسبة من الإجمالي %',d:'100'}],
 grids:()=>[],
 calc:X=>{const r=[],tb=X.tb;const g=X.v('hc')*X.v('sal')*X.v('mo',12)+X.v('bn');const si=X.v('hc')*X.v('sal')*X.v('mo',12)*X.v('sib',100)/100*X.v('si',18.75)/100;r.push(wtHd('التوقع'));
  r.push(wtVal('إجمالي الأجور المتوقعة',g));r.push(wtVal('حصة صاحب العمل في التأمينات المتوقعة',si));
  r.push(wtTie('الأجور + التأمينات المتوقعة مقابل تكاليف العاملين بالميزان',g+si,tb?tb.cy:null,'يشمل الأجور المحمَّلة على تكلفة المبيعات إن كانت منفصلة فاستكملها'));
  r.push(wtVal('متوسط التكلفة للعامل',X.v('hc')&&tb?tb.cy/X.v('hc'):null,'قارنه بالسنة السابقة'));return r},
 tips:['اختبر كشوف الرواتب (عينة) وعاملين وهميين ومدفوعات نهاية الخدمة والإجازات المستحقة.','طابق التأمينات وضريبة كسب العمل مع الإقرارات والمسدد.']});
/* 13) operating expense / income analytics */
wtReg('opx',{name:'تحليل المصروفات والإيرادات التشغيلية الأخرى',icon:'📊',areas:['OOE','OIN','OEX'],
 intro:'قارن كل بند بالسنة السابقة والموازنة وحدّد الانحرافات التي تتجاوز أهمية الأداء لاختبارها.',
 grids:()=>[{id:'va',t:'تحليل البنود مقابل السنة السابقة والموازنة',spec:{n:8,cols:[wtT('i','البند'),wtN('cy','الحالي',1),wtN('py','السابق',1),wtN('bd','الموازنة',1),wtF('vc','التغير عن السابق','cy-py',1),wtF('vp','% التغير','if(py,(cy-py)/abs(py),0)',0,'pct'),wtF('vb','الفرق عن الموازنة','cy-bd',1)]}}],
 calc:X=>{const r=[],tb=X.tb,pm=X.M.pm;r.push(wtHd('المطابقة'));r.push(wtTie('مجموع البنود مقابل رصيد المجال بالميزان',X.sum('va','cy'),tb?tb.cy:null));
  if(tb&&tb.py!=null)r.push(wtTie('مجموع السابق مقابل السنة السابقة بالميزان',X.sum('va','py'),tb.py));
  const rows=X.rows('va');const big=rows.filter(x=>pm&&Math.abs(x.vc)>pm).length;r.push(wtChk('بنود يتجاوز تغيرها أهمية الأداء',big===0,big?big+' بند — احصل على تفسير مدعَّم':'لا توجد'));return r},
 tips:['اطلب تفسير الإدارة لكل انحراف جوهري وتحقق منه بأدلة مستقلة.','اختبر المصروفات الكبيرة غير المعتادة وأطراف العلاقة والتصنيف بين مصروف/أصل.']});
/* 14) finance income and cost */
wtReg('fin',{name:'إعادة احتساب الفوائد وتكاليف التمويل',icon:'💹',areas:['FIN'],
 intro:'أعد احتساب فوائد القروض (متوسط الرصيد × المعدل) وإيرادات الفوائد على الودائع، وقارنها بالمحمَّل والميزان.',
 grids:()=>[{id:'fc',t:'تكاليف التمويل',spec:{n:4,cols:[wtT('i','القرض/الجهة'),wtN('av','متوسط الرصيد',1),wtN('rt','المعدل %'),wtF('ic','المحتسب','av*rt/100',1),wtN('bk','المحمّل',1),wtF('df','الفرق','bk-ic',1)]}},
  {id:'fi',t:'إيرادات الفوائد',spec:{n:3,cols:[wtT('i','الوديعة/البنك'),wtN('av','متوسط الرصيد',1),wtN('rt','المعدل %'),wtF('ic','المحتسب','av*rt/100',1),wtN('bk','المسجل',1),wtF('df','الفرق','bk-ic',1)]}}],
 calc:X=>{const r=[],tb=X.tb;r.push(wtHd('تكاليف التمويل'));r.push(wtTie('المحتسب مقابل المحمّل',X.sum('fc','ic'),X.sum('fc','bk')));r.push(wtTie('المحمّل بالجدول مقابل الميزان',X.sum('fc','bk'),tb?tb.line('fincost'):null));
  r.push(wtHd('إيرادات الفوائد'));r.push(wtTie('المحتسب مقابل المسجل',X.sum('fi','ic'),X.sum('fi','bk')));r.push(wtTie('المسجل بالجدول مقابل الميزان',X.sum('fi','bk'),tb?-tb.line('fininc'):null));return r},
 tips:['طابق الفوائد المحمَّلة مع جداول الأقساط وتكاليف الاقتراض المرسملة (IAS 23).']});
/* 15) FX */
wtReg('fx',{name:'إعادة تقييم البنود بالعملات الأجنبية',icon:'💱',areas:['FXA'],
 intro:'أعد احتساب فروق العملة على الأرصدة النقدية (EAS 13 / IAS 21): المبلغ بالعملة الأجنبية × (سعر الإقفال − سعر التسجيل).',
 grids:()=>[{id:'fx',t:'البنود النقدية بالعملة الأجنبية',spec:{n:6,cols:[wtT('i','البند'),wtT('c','العملة'),wtN('fa','المبلغ بالعملة الأجنبية'),wtN('rb','سعر التسجيل'),wtN('ry','سعر الإقفال'),wtF('ev','فرق التقييم المحتسب','fa*(ry-rb)',1),wtN('bk','المحمّل بالدفاتر',1),wtF('df','الفرق','bk-ev',1)]}}],
 calc:X=>{const r=[],tb=X.tb;r.push(wtHd('المطابقة'));r.push(wtTie('الفرق المحتسب مقابل المحمّل',X.sum('fx','ev'),X.sum('fx','bk')));r.push(wtTie('المحمّل بالجدول مقابل الميزان',X.sum('fx','bk'),tb?tb.cy:null,'إشارة الأرباح موجبة'));return r},
 tips:['استخدم أسعار الإقفال الرسمية (البنك المركزي) وبيّن البنود غير النقدية بالتكلفة التاريخية.']});
/* 16) prepayments */
wtReg('pre',{name:'إهلاك المدفوعات المقدمة (جدول الإطفاء)',icon:'🗓️',areas:['PRE'],
 intro:'أعد احتساب المطفأ من كل دفعة مقدمة: المبلغ × (الأشهر المنقضية ÷ إجمالي الأشهر) وقارن الرصيد المتبقي بالميزان.',
 grids:()=>[{id:'pp',t:'جدول المدفوعات المقدمة',spec:{n:6,cols:[wtT('i','البند (تأمين/إيجار/غيره)'),wtN('am','المبلغ المدفوع',1),wtN('tm','إجمالي الأشهر'),wtN('em','الأشهر المنقضية'),wtF('ex','المطفأ','if(tm,am*em/tm,0)',1),wtF('bl','الرصيد المتبقي','am-if(tm,am*em/tm,0)',1)]}}],
 calc:X=>{const r=[],tb=X.tb;r.push(wtTie('الرصيد المتبقي بالجدول مقابل الميزان',X.sum('pp','bl'),tb?tb.cy:null));return r},
 tips:['اختبر وجود الوثائق (بوليصة/عقد) وانقضاء المنفعة وأي دفعات يجب رسملتها أو تحميلها.']});
/* 17) financial investments */
wtReg('fv',{name:'القيمة العادلة والمستويات للأدوات المالية',icon:'📉',areas:['INV','OFA','DER'],
 intro:'سجّل لكل أداة التكلفة والقيمة العادلة ومستوى التسلسل (1-3) والمثبت بالدفاتر؛ يُحتسب فرق التقييم ويُقارَن بالمثبت والميزان.',
 grids:()=>[{id:'fv',t:'الأدوات المالية والتقييم',h:'المستوى 1 أسعار سوق معلنة، 2 مدخلات ملحوظة، 3 مدخلات غير ملحوظة (أعلى مخاطرة).',spec:{n:6,cols:[wtT('i','الأداة'),wtN('co','التكلفة',1),wtN('fv','القيمة العادلة',1),wtN('lv','المستوى (1-3)'),wtF('gl','ربح/خسارة التقييم','fv-co',1),wtN('bk','القيمة المسجلة',1),wtF('df','الفرق (العادلة − المسجلة)','fv-bk',1)]}}],
 calc:X=>{const r=[],tb=X.tb;r.push(wtHd('المطابقة'));r.push(wtTie('القيمة العادلة بالجدول مقابل الدفاتر',X.sum('fv','fv'),X.sum('fv','bk')));r.push(wtTie('المسجل بالجدول مقابل رصيد الميزان',X.sum('fv','bk'),tb?tb.cy:null));
  const l3=X.rows('fv').filter(x=>x.lv>=3).reduce((s,x)=>s+x.fv,0);r.push(wtVal('أدوات المستوى 3',l3,'تتطلب خبيرًا/اختبارًا لنموذج التقييم والمدخلات (ISA 540)'));return r},
 tips:['حصل على مصادقة الأمين/الوسيط وتحقق من الملكية ومن الأسعار من مصادر مستقلة.']});
/* 18) subsidiaries and associates */
wtReg('asc',{name:'الاستثمارات في الشركات التابعة والشقيقة (حقوق الملكية)',icon:'🤝',areas:['ASC'],
 intro:'طبّق طريقة حقوق الملكية: التكلفة + حصة الأرباح − التوزيعات − الانخفاض؛ وقارن بالميزان وبحصة الأرباح بقائمة الدخل.',
 grids:()=>[{id:'as',t:'جدول الاستثمارات',spec:{n:4,cols:[wtT('e','الشركة'),wtN('ow','نسبة الملكية %'),wtN('co','التكلفة/الرصيد أول المدة',1),wtN('np','صافي ربح الشركة'),wtF('sh','حصتنا','np*ow/100',1),wtN('dv','توزيعات مستلمة',1),wtN('im','انخفاض قيمة',1),wtF('cl','الرصيد آخر المدة','co+np*ow/100-dv-im',1)]}}],
 calc:X=>{const r=[],tb=X.tb;r.push(wtTie('الرصيد الختامي بالجدول مقابل الميزان',X.sum('as','cl'),tb?tb.cy:null));r.push(wtTie('حصة الأرباح بالجدول مقابل الميزان',X.sum('as','sh'),tb?-tb.line("isub"):null));return r},
 tips:['حدّد نوع السيطرة/النفوذ الجوهري والتوحيد، وحصل على قوائم مراجعة وبيانات المكوّنات (ISA 600).']});
