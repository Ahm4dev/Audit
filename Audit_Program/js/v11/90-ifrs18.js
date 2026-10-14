/* MEAP · v11 · IFRS 18 presentation of the primary statements, generated from the classified trial balance.
   - Statement of profit or loss: operating / investing / financing / income-taxes / discontinued-operations categories with the three mandatory
     subtotals (operating profit; profit before financing and income taxes; profit before income taxes) then profit.
   - Notes: expenses by nature (D&A, employee benefits, impairment) and management-defined performance measures (MPMs) with reconciliation.
   - Statement of cash flows (IAS 7 as amended by IFRS 18): starts from operating profit; interest/dividends received → investing,
     interest paid → financing.
   The user may re-tag any P&L line (category selectors) and may switch back to the IAS 1 layout. IFRS 18 is effective for annual periods beginning on/after 1 Jan 2027. */
'use strict';
const I18S={mode:'i18',gp:0};
try{const s=JSON.parse(localStorage.getItem('meap.i18')||'{}');if(s.mode==='ias1'||s.mode==='i18')I18S.mode=s.mode;I18S.gp=s.gp?1:0}catch(e){}
const i18Save=()=>{try{localStorage.setItem('meap.i18',JSON.stringify(I18S))}catch(e){}};
const I18_DEF={rev:'op',cos:'op',depx:'op',payx:'op',admx:'op',profx:'op',sellx:'op',eclx:'op',fxfv:'op',nonop:'op',fininc:'inv',assoc:'inv',fincost:'fin',taxx:'tax'};
const I18_CATS=[['op','أنشطة التشغيل'],['inv','أنشطة الاستثمار'],['fin','أنشطة التمويل'],['tax','ضرائب الدخل (والزكاة)'],['disc','العمليات المتوقفة']];
const I18_FREE={fxfv:1,nonop:1,fininc:1,assoc:1,fincost:1};/* lines that may move between operating / investing / financing */
function i18Opts(line){if(line==='taxx')return['tax'];return I18_FREE[line]?['op','inv','fin','disc']:['op','disc']}
function i18Cat(line){const d=I18_DEF[line]||'op';if(!line)return d;const o=G('i18.cat.'+line,'');return o&&i18Opts(line).includes(o)?o:d}
const i18Add=(a,b)=>({cy:a.cy+b.cy,py:a.py==null?null:a.py+(b.py||0)});
/* Units of the FS builder can merge several FS lines (e.g. G&A = payroll + rent + depreciation), so categories and amounts are resolved per account row. */
const I18C={b:null,v:-1,m:null};let I18V=0;
function i18Model(){const B=fsBuild();if(I18C.b===B&&I18C.v===I18V)return I18C.m;const m=i18Build(B);I18C.b=B;I18C.v=I18V;I18C.m=m;return m}
function i18Build(B){
const C={op:[],inv:[],fin:[],tax:[],disc:[]};const T={};const L={};const names={};
 for(const g of fsOrder('PL')){const m=B.S.PL.get(g);if(!m)continue;for(const n of m.values()){const parts={};
  for(const x of n.rows){const c=clsOf(x.r.code);const line=(c&&c.line)||n.line||'';const cat=i18Cat(line);
   const p=parts[cat]||(parts[cat]={g,n:{u:n.u,g:n.g,line:line,cy:0,py:B.hasPy?0:null,rows:[]}});p.n.cy+=x.cy;if(p.n.py!=null)p.n.py+=x.py||0;p.n.rows.push(x);
   const o=L[line]||(L[line]={cy:0,py:B.hasPy?0:null});o.cy+=x.cy;if(o.py!=null)o.py+=x.py||0;(names[line]||(names[line]=new Set())).add(n.u)}
  for(const cat of Object.keys(parts))C[cat].push(parts[cat])}}
 for(const k in C){T[k]={cy:0,py:B.hasPy?0:null};C[k].forEach(x=>{T[k].cy+=x.n.cy;if(T[k].py!=null)T[k].py+=x.n.py||0})}
 const opP=T.op,pbfit=i18Add(opP,T.inv),pbt=i18Add(pbfit,T.fin),cont=i18Add(pbt,T.tax),prof=i18Add(cont,T.disc);
 return{C,T,L,names,opP,pbfit,pbt,cont,prof}}
const i18Line=l=>{const o=i18Model().L[l];return o?{cy:o.cy,py:o.py}:{cy:0,py:fsBuild().hasPy?0:null}};
function i18Rows(list,o){o=o||{};let h='',last=null;const gpG=o.gpAfter;let gp={cy:0,py:o.hasPy?0:null},gpDone=false;
 for(const x of list){
  if(gpG&&!gpDone&&last&&last!==x.g&&(last==='تكلفة المبيعات'||last==='الإيرادات')&&x.g!=='تكلفة المبيعات'&&x.g!=='الإيرادات'){h+=i18GP(list);gpDone=true}
  if(x.g!==last){h+=`<tr class="grp"><td colspan="7">${esc(x.g)}</td></tr>`;last=x.g}
  h+=fsRow(x.n.u,{cy:x.n.cy,py:x.n.py},{sub:1,ref:fsWpLink(x.n.line),note:`<a href="#fsn-${fsNoteNo('PL',x.n.u)}">${fsNoteNo('PL',x.n.u)}</a>`})}
 if(gpG&&!gpDone&&list.some(x=>x.g==='تكلفة المبيعات'||x.g==='الإيرادات'))h+=i18GP(list);
 return h}
function i18GPval(list){const B=fsBuild();let cy=0,py=B.hasPy?0:null;list.forEach(x=>{if(x.g==='تكلفة المبيعات'||x.g==='الإيرادات'){cy+=x.n.cy;if(py!=null)py+=x.n.py||0}});return{cy,py}}
const i18GP=list=>fsRow('مجمل الربح (مقياس أداء إداري — MPM)',i18GPval(list),{cls:'tot i18-mpm'});
function i18Bar(){const m=I18S.mode;return `<div class="i18-bar" role="group" aria-label="أسلوب العرض"><span class="mut small">أسلوب عرض قائمة الدخل والتدفقات:</span>
 <button class="btn${m==='i18'?'':' o'} sm" data-i18="mode:i18">IFRS 18 (الجديد)</button><button class="btn${m==='ias1'?'':' o'} sm" data-i18="mode:ias1">IAS 1 (السابق)</button>
 ${m==='i18'?`<label class="small"><input type="checkbox" data-i18="gp"${I18S.gp?' checked':''}> إظهار مجمل الربح كإجمالي فرعي (MPM)</label>`:''}</div>`}
function i18PL(){const B=fsBuild();const M=i18Model();let h='';const hp=B.hasPy;const cat=(k,t)=>`<tr class="grp i18-cat"><td colspan="7">${esc(t)}</td></tr>`;
 h+=cat('op','فئة التشغيل (Operating)')+i18Rows(M.C.op,{gpAfter:I18S.gp,hasPy:hp});
 h+=fsRow('ربح (خسارة) التشغيل',M.opP,{cls:'tot i18-sub'});
 h+=cat('inv','فئة الاستثمار (Investing)')+(M.C.inv.length?i18Rows(M.C.inv):`<tr><td class="sub1 mut" colspan="7">لا بنود مبوَّبة</td></tr>`);
 h+=fsRow('الربح (الخسارة) قبل التمويل وضرائب الدخل',M.pbfit,{cls:'tot i18-sub'});
 h+=cat('fin','فئة التمويل (Financing)')+(M.C.fin.length?i18Rows(M.C.fin):`<tr><td class="sub1 mut" colspan="7">لا بنود مبوَّبة</td></tr>`);
 h+=fsRow('الربح (الخسارة) قبل ضرائب الدخل',M.pbt,{cls:'tot i18-sub'});
 h+=cat('tax','ضرائب الدخل والزكاة (Income taxes)')+(M.C.tax.length?i18Rows(M.C.tax):`<tr><td class="sub1 mut" colspan="7">لا بنود مبوَّبة</td></tr>`);
 if(M.C.disc.length){h+=fsRow('الربح (الخسارة) من العمليات المستمرة',M.cont,{cls:'tot i18-sub'});h+=cat('disc','العمليات المتوقفة (Discontinued operations)')+i18Rows(M.C.disc)}
 h+=fsRow('ربح (خسارة) العام',M.prof,{cls:'tot big'});
 return `<div class="tw"><table class="fst">${fsHead()}<tbody>${h}</tbody></table></div>
 <p class="mut small">الإيرادات والأرباح موجبة، والمصروفات والخسائر سالبة (بين أقواس) — بعد قيود التسوية المرحَّلة. التصنيف إلى فئات IFRS 18 تلقائي من بنود الميزان المبوَّب ويمكن تعديله أدناه. المعيار الدولي IFRS 18 يسري على الفترات السنوية التي تبدأ في/بعد 1 يناير 2027، وقد لا يكون معتمدًا بعد ضمن معايير المحاسبة المصرية (EAS)؛ يمكن العودة لعرض IAS 1 من الأعلى.</p>
 ${i18Nature(M)}${i18MPM(M)}${i18Panel(M)}`}
function i18Nature(M){const B=fsBuild();const l=id=>i18Line(id);const d=l('depx'),p=l('payx'),e=l('eclx');
 const hasFn=M.C.op.some(x=>x.g==='تكلفة المبيعات'||x.g==='المصروفات التشغيلية');if(!hasFn)return'';
 const r=(t,x,c)=>`<tr class="${c||''}"><td class="${c?'':'sub1'}">${t}</td><td class="num" dir="ltr">${fm(-x.cy)}</td><td class="num" dir="ltr">${x.py==null?'—':fm(-x.py)}</td></tr>`;
 const tot={cy:d.cy+p.cy+e.cy,py:d.py==null?null:d.py+p.py+e.py};
 return `<h3>إفصاح المصروفات حسب الطبيعة (IFRS 18.83)</h3><p class="mut small">المصروفات معروضة حسب الوظيفة (تكلفة المبيعات/عمومية/بيع)، لذا يلزم الإفصاح عن المبالغ الإجمالية للإهلاك والإطفاء ومزايا العاملين وانخفاض القيمة المتضمَّنة في كل بند وظيفي.</p>
 <div class="tw"><table class="fst"><thead><tr><th>بند بحسب الطبيعة</th><th>السنة الحالية</th><th>السنة السابقة</th></tr></thead><tbody>
 ${r('الإهلاك والإطفاء',d)}${r('مزايا العاملين (الرواتب والأجور المبوَّبة ضمن المصروفات التشغيلية)',p)}${r('خسائر الائتمان المتوقعة وانخفاض القيمة',e)}${r('الإجمالي',tot,'tot')}</tbody></table></div>
 <div class="note">الأجور المباشرة والإهلاك الصناعي المحمَّلة على تكلفة المبيعات تظهر ضمن بنودها عند تبويبها في الميزان؛ استكمل من الدفاتر الفرعية أي مزايا عاملين محمَّلة على التكلفة المباشرة.</div>`}
function i18MPM(M){const dep=i18Line('depx');const rate=num(G('tzk.rate',22.5));const gp=i18GPval(M.C.op);const ebitda={cy:M.opP.cy-dep.cy,py:M.opP.py==null?null:M.opP.py-(dep.py||0)};
 const tx=-dep.cy*rate/100;const t=(a,x)=>`<td class="num" dir="ltr">${x==null?'—':fm(x)}</td>`;
 const row=(l,x,c)=>`<tr class="${c||''}"><td class="${c?'':'sub1'}">${l}</td>${t(0,x)}</tr>`;
 const othOp=M.opP.cy-gp.cy;
 return `<h3>مقاييس الأداء المعرَّفة من الإدارة — MPMs (IFRS 18.117-125)</h3>
 <p class="mut small">أي إجمالي فرعي تعلنه الإدارة خارج الإجماليات المحددة في المعيار يُعد MPM ويلزم تسويته بأقرب إجمالي محدد (ربح التشغيل أو الربح) مع الأثر الضريبي والحصص غير المسيطرة، وبيان سبب إفادته للمستخدمين.</p>
 <div class="tw"><table class="fst"><thead><tr><th>التسوية</th><th>السنة الحالية</th></tr></thead><tbody>
 <tr class="grp"><td colspan="2">1) مجمل الربح</td></tr>
 ${row('مجمل الربح',gp.cy)}${row('(±) بنود التشغيل الأخرى (مصروفات تشغيلية وإيرادات/مصروفات أخرى مبوَّبة في التشغيل)',othOp)}${row('ربح (خسارة) التشغيل — أقرب إجمالي محدد',M.opP.cy,'tot')}
 <tr class="grp"><td colspan="2">2) الأرباح قبل الفوائد والضرائب والإهلاك والإطفاء (EBITDA)</td></tr>
 ${row('ربح (خسارة) التشغيل',M.opP.cy)}${row('(+) الإهلاك والإطفاء',-dep.cy)}${row('EBITDA (MPM)',ebitda.cy,'tot')}
 ${row('الأثر الضريبي لبند التسوية (تقديري بمعدل '+rate+'% من إعدادات الضريبة)',tx)}${row('أثر الحصص غير المسيطرة',0)}
 </tbody></table></div><div class="note">الأثر الضريبي تقديري ويُستبدل بالمحتسب الفعلي من ورقة الزكاة والضريبة؛ أثر الحصص غير المسيطرة يُستكمل عند وجودها.</div>`}
function i18Panel(M){const ro=RO();const rows=Object.keys(M.L).map(line=>{const op=i18Opts(line);const cur=i18Cat(line);const lock=op.length<2||ro;const nm=[...(M.names[line]||[])].join('، ')||line;
  return `<tr><td>${esc(nm)}</td><td class="num" dir="ltr">${fm(M.L[line].cy)}</td><td><select class="st" data-k="i18.cat.${esc(line)}" data-dv="" aria-label="${esc(nm)}"${lock?' disabled':''}>${I18_CATS.filter(c=>op.includes(c[0])).map(c=>`<option value="${c[0]}"${cur===c[0]?' selected':''}>${esc(c[1])}</option>`).join('')}</select></td></tr>`}).join('');
 return `<details class="card" style="margin-top:12px"><summary><b>تخصيص تبويب البنود إلى فئات IFRS 18</b></summary>
 <p class="mut small">الفئة الافتراضية: التشغيل (الباقي)، الاستثمار (إيرادات التمويل/الاستثمار والشركات الشقيقة)، التمويل (تكاليف التمويل)، ضرائب الدخل (تشمل الزكاة). غيّر فئة بند عند اختلاف طبيعته لدى المنشأة (مثل منشأة تتمثل أنشطتها الرئيسية في الاستثمار أو التمويل). لتبويب بند كعمليات متوقفة اختر «العمليات المتوقفة» (للبند بأكمله؛ التجزئة الجزئية تتم بقيد تحليلي).</p>
 <div class="tw"><table class="fst"><thead><tr><th>البند</th><th>المبلغ</th><th>الفئة</th></tr></thead><tbody>${rows}</tbody></table></div></details>`}
/* ---- statement of profit or loss ---- */
const fsPL_ias1=fsPL;
fsPL=function(){const B=fsBuild();if(!B.ready)return fsNoData();return I18S.mode==='i18'?i18PL():fsPL_ias1()};
/* ---- cash flows ---- */
const fsCFData_ias1=fsCFData;
fsCFData=function(){if(I18S.mode!=='i18')return fsCFData_ias1();
 const B=fsBuild();if(!B.ready||!B.hasPy)return null;const M=i18Model();
 const dA=ids=>{const x=fsLines('SFP',ids);return x.cy-x.py};const dL=dA;const A=l=>i18Line(l).cy;
 const inOp=l=>{const c=i18Cat(l);return c==='op'||c==='disc'};
 const tax=A('taxx'),dep=-A('depx'),eclx=-A('eclx'),fc=-A('fincost'),fi=A('fininc'),as=A('assoc');
 const adjs=[['إهلاك وإطفاء',dep],['خسائر ائتمانية متوقعة',eclx]];
 if(inOp('fincost')&&fc)adjs.push(['تكاليف التمويل (تُعرض في التمويل)',fc]);
 if(inOp('fininc')&&fi)adjs.push(['إيرادات التمويل والاستثمار (تُعرض في الاستثمار)',-fi]);
 if(inOp('assoc')&&as)adjs.push(['حصة في نتائج شركات شقيقة (غير نقدية)',-as]);
 if(M.T.disc.cy)adjs.push(['ضم نتائج العمليات المتوقفة (صافي)',M.T.disc.cy]);
 const ws=[['المخزون',-dA(['inv'])],['العملاء وأوراق القبض وأصول العقود',-dA(['tr','nr','ca'])],['أرصدة مدينة ومدفوعات مقدمة وأطراف ذات علاقة (مدينة)',-dA(['rpr','orc','pre'])],['الموردون وأوراق الدفع والمستحقات',dL(['tp','np','accr'])],['أرصدة دائنة أخرى ومستحقات العاملين والتزامات العقود',dL(['opay','emp','cl','rpp'])],['المخصصات ومزايا العاملين',dL(['prov','ebo','oliab'])]];
 const taxPaid=tax+dL(['taxp'])-dA(['taxa'])+dL(['dtl']);
 const pbt=M.opP.cy;/* start = operating profit (IAS 7.18 as amended) */
 const op=pbt+adjs.reduce((s,x)=>s+x[1],0)+ws.reduce((s,x)=>s+x[1],0)+taxPaid;
 const xs=c=>['nonop','fxfv'].filter(l=>i18Cat(l)===c).reduce((s,l)=>s+A(l),0);
 const capex=-(dA(['ppe','cip','rou','int','gw','ip','bio'])+dep);
 const inv=-dA(['isub','finv','der','ncao'])+as+xs('inv');/* share of associates' profit is non-cash: added back so the investment movement reflects cash only */
 const invI=capex+inv+fi;
 const fin_=[['القروض والتسهيلات والسندات',dL(['bor','bond'])],['التزامات عقود الإيجار',dL(['ll'])],['رأس المال والعلاوة وأسهم الخزينة',dL(['cap','shp','trs','nci'])],['توزيعات الأرباح المدفوعة (حركات مبوّبة)',fsLines('EQ',['re']).cy],['الفوائد المدفوعة (تكاليف التمويل)',-fc]];
 if(xs('fin'))fin_.push(['نتائج بنود مبوَّبة في التمويل',xs('fin')]);
 const finT=fin_.reduce((s,x)=>s+x[1],0);const dcash=dA(['cash']);const net=op+invI+finT;
 return{mode:'i18',startLbl:'ربح (خسارة) التشغيل',startEn:'Operating profit',pbt,tax,adjs,ws,taxPaid,op,capex,inv,fi,invI,fin_,finT,net,dcash,diff:dcash-net,cashPy:fsLines('SFP',['cash']).py,cashCy:fsLines('SFP',['cash']).cy}};
const fsCF_ias1=fsCF;
fsCF=function(){const B=fsBuild();if(!B.ready)return fsNoData();if(I18S.mode!=='i18')return fsCF_ias1();const d=fsCFData();
 if(!d)return `<div class="note warn">قائمة التدفقات النقدية تُشتق من حركة أرصدة الميزان بين السنتين؛ حمّل ميزان السنة السابقة (أو عمودها) أولًا من «رفع الميزان».</div>`;
 const r=(l,v,c)=>`<tr class="${c||''}"><td class="${c?'':'sub1'}">${esc(l)}</td><td class="num" dir="ltr">${fm(v)}</td></tr>`;
 const h=`<tr class="grp"><td colspan="2">التدفقات النقدية من أنشطة التشغيل</td></tr>`+r(d.startLbl,d.pbt)+d.adjs.map(x=>r('تسوية: '+x[0],x[1])).join('')+d.ws.map(x=>r('التغير في '+x[0],x[1])).join('')+r('ضرائب الدخل المدفوعة (تقديرية)',d.taxPaid)+r('صافي التدفق النقدي من أنشطة التشغيل',d.op,'tot')
 +`<tr class="grp"><td colspan="2">التدفقات النقدية من أنشطة الاستثمار</td></tr>`+r('اقتناء/(استبعاد) أصول ثابتة وغير ملموسة وعقارية وحق استخدام (صافي)',d.capex)+r('استثمارات مالية وشركات ومشتقات وأرصدة طويلة الأجل وبنود استثمار أخرى (صافي نقدي)',d.inv)+r('فوائد وتوزيعات مقبوضة',d.fi)+r('صافي التدفق النقدي من أنشطة الاستثمار',d.invI,'tot')
 +`<tr class="grp"><td colspan="2">التدفقات النقدية من أنشطة التمويل</td></tr>`+d.fin_.map(x=>r(x[0],x[1])).join('')+r('صافي التدفق النقدي من أنشطة التمويل',d.finT,'tot')
 +r('صافي التغير في النقدية وما في حكمها (محسوب)',d.net,'tot big')+r('رصيد النقدية أول العام',d.cashPy)+r('رصيد النقدية آخر العام (من الميزان)',d.cashCy)
 +`<tr class="${Math.abs(d.diff)<=Math.max(1,fsM()*0.05)?'okrow':'bad'}"><td>فروق غير مفسَّرة (التغير الفعلي في النقدية − المحسوب)</td><td class="num" dir="ltr">${fm(d.diff)}</td></tr>`;
 return `<div class="tw"><table class="fst cf"><thead><tr><th>البيان</th><th>السنة الحالية</th></tr></thead><tbody>${h}</tbody></table></div>
 <p class="mut small">مشتقة من حركة الأرصدة المبوَّبة (الطريقة غير المباشرة) وفق IAS 7 المعدَّل بموجب IFRS 18: تبدأ من ربح التشغيل، والفوائد والتوزيعات المقبوضة في الاستثمار، والفوائد المدفوعة والتوزيعات المدفوعة في التمويل. الفرق غير المفسَّر يدل عادة على حركات غير نقدية أو فروق عملة أو أخطاء تبويب؛ قدِّم تفسيره وأرفق الدليل.</p>
 ${edc('wp.D406.diffx',{label:'تفسير الفروق غير المفسَّرة',ph:'اكتب تفسير الفروق والدليل…',ml:1})}`};
/* ---- wire pages ---- */
FS_PAGES.forEach(x=>{if(x[0]==='pl')x[2]=()=>fsPL();if(x[0]==='cf')x[2]=()=>fsCF()});
XP.fs_pl=(it,p,ref)=>{FSNT={map:new Map(),n:0};return fsPageHead(it,ref)+i18Bar()+fsPL()};
XP.fs_cf=(it,p,ref)=>{FSNT={map:new Map(),n:0};return fsPageHead(it,ref)+i18Bar()+fsCF()};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button[data-i18]');if(!b)return;const v=b.dataset.i18;if(v.startsWith('mode:')){I18S.mode=v.slice(5)==='ias1'?'ias1':'i18';i18Save();route(true)}});
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.dataset)return;if(t.dataset.i18==='gp'){I18S.gp=t.checked?1:0;i18Save();route(true)}else if((t.dataset.k||'').startsWith('i18.cat.')){I18V++;setTimeout(()=>route(true),0)}});
