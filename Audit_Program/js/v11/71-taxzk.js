/* MEAP · v11 · Zakat & income-tax expense paper (PL / ITX · 1900.110).
   Current income tax (taxable-income build-up) + deferred tax movement (IAS 12) + zakat (base build-up) → total vs the TB line «taxx»,
   with an effective-rate reconciliation. Statutory rates are inputs (default: Egypt corporate rate 22.5 %, zakat 2.5 %) and must be confirmed to the law in force. */
'use strict';
const TZK_CHK=[
 'الربط بين الربح المحاسبي والوعاء الضريبي بتسوية موثّقة بنودها (دائمة/مؤقتة) ومعتمدة من الإدارة',
 'تحديد النظام المنطبق على المنشأة وملّاكها: ضريبة دخل أم زكاة أم مزيج (حصص الملكية) والمستند القانوني',
 'مطابقة الإقرار الضريبي/الزكوي المقدَّم للسنة السابقة مع المحمَّل في الدفاتر وتحليل الفروق (IAS 8)',
 'فحص الربط مع مصلحة الضرائب/الجهة الزكوية: الفحص الجاري والمنازعات والتسويات والمخصصات للالتزامات الضريبية غير المؤكدة (IFRIC 23)',
 'اختبار الضريبة المؤجلة: فروق مؤقتة، الأصل الضريبي المؤجل وإمكانية استرداده (IAS 12.24-36)، المعدل المطبّق، المقاصة (IAS 12.74)',
 'التحقق من الأثر الضريبي للبنود المعترف بها في OCI أو حقوق الملكية وعدم تحميلها على الأرباح والخسائر',
 'التحقق من أن الزكاة (إن كانت تُحتسب على وعاء غير الدخل) مصنَّفة وفق المعيار المنطبق وتُفصح عنها بوضوح (IAS 12 / IAS 37 حسب طبيعتها)',
 'ضريبة الدخل المستقطعة والضريبة المسددة مقدمًا والدفعات تحت الحساب وتسوية رصيد الالتزام/الأصل الضريبي الجاري',
 'الإفصاح: مكونات مصروف الضريبة، تسوية المعدل الفعلي، الفروق المؤقتة غير المعترف بها، والخسائر المرحلة (IAS 12.79-88)',
 'مراجعة الأحداث اللاحقة والتغيرات التشريعية في المعدلات ومعاملتها (IAS 12.47-48 / IAS 10)'];
function tzkF(f,d){return num(G('tzk.'+f,d==null?'':d))}
function tzkGridSum(ref,gid,col){const base='wp.'+ref+'.cg.'+gid;const rows=cgRows(ref,gid,CGR[ref+'|'+gid]||{n:0});return rows.reduce((s,r)=>s+num(G(base+'.v.'+r+'.'+col,0)),0)}
function tzkData(ref){const B=(typeof matTBBench==='function'&&TBSTORE.ready())?matTBBench():null;
 const pbtTB=B?B.cy.PBT:null;const T=TBSTORE.ready()?TBSTORE.lineTotals({adjusted:true}):{};const tbTax=TBSTORE.ready()?(T.taxx||0):null;
 const pbtIn=G('tzk.pbt','');const pbt=pbtIn!==''?num(pbtIn):(pbtTB==null?0:pbtTB);
 const add=tzkGridSum(ref,'tadd','a'),ded=tzkGridSum(ref,'tded','a'),loss=tzkF('loss',0);
 const ti=Math.max(0,pbt+add-ded-Math.max(0,loss));const rate=tzkF('rate',22.5)/100,shT=tzkF('shT',100)/100;
 const cur=ti*rate*shT;
 const zadd=tzkGridSum(ref,'zadd','a'),zded=tzkGridSum(ref,'zded','a');const zb=zadd-zded;const adjProfit=Math.max(0,pbt+add-ded);const zr=tzkF('zr',2.5)/100,shZ=tzkF('shZ',0)/100;
 const zbase=Math.max(zb,adjProfit);const zakat=zbase*zr*shZ;
 const dOpen=tzkF('dto',0),dClose=tzkF('dtc',0),dOci=tzkF('dtoci',0);const def=(dClose-dOpen)-dOci;
 const total=cur+zakat+def;const diff=tbTax==null?null:total-tbTax;
 const exp=pbt*rate*shT;
 return {pbtTB,pbt,add,ded,loss,ti,rate,shT,cur,zb,adjProfit,zbase,zr,shZ,zakat,def,total,tbTax,diff,exp,T}}
const tzkIn=(f,l,d,u)=>`<label>${l}<input class="in num" dir="ltr" inputmode="decimal" data-tzk="1" data-k="tzk.${f}" value="${esc(G('tzk.'+f,d==null?'':d))}" aria-label="${esc(l)}"${RO()?' readonly':''}>${u?`<span class="mut small">${u}</span>`:''}</label>`;
function tzkHTML(ref){if(!TBSTORE.ready())return noTB()+tzkBody(ref,false);return tzkBody(ref,true)}
function tzkBody(ref,hasTB){const d=tzkData(ref);const ro=RO();const f=fm;
 const ok=d.diff!=null&&Math.abs(d.diff)<=Math.max(1,Math.abs(d.tbTax||0)*0.005);
 const eff=d.pbt?d.total/d.pbt*100:null;const effC=d.pbt?d.cur/d.pbt*100:null;
 const permEff=d.pbt?(d.add-d.ded)*d.rate*d.shT:0;
 return `<div class="note ${d.diff==null?'':ok?'':'bad'}"><b>مطابقة مصروف الزكاة والضريبة مع الميزان:</b> المحتسب <b dir="ltr">${f(d.total)}</b> مقابل بند «الزكاة وضريبة الدخل» بالميزان المعدّل <b dir="ltr">${d.tbTax==null?'—':f(d.tbTax)}</b>${d.diff==null?'':` — الفرق <b dir="ltr">${f(d.diff)}</b> ${ok?'✓ مطابق':'⚠ يحتاج تفسيرًا أو تسوية مقترحة'}`}</div>
 <h3>1) المعطيات والمعدلات</h3>
 <div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px">
  ${tzkIn('pbt','الربح المحاسبي قبل الضريبة',d.pbtTB==null?'':Math.round(d.pbtTB),'اتركه فارغًا لأخذه من الميزان: '+(d.pbtTB==null?'—':f(d.pbtTB)))}
  ${tzkIn('rate','معدل ضريبة الدخل %',22.5,'مصر: 22.5% للشركات (يُؤكَّد حسب القانون والقطاع)')}
  ${tzkIn('shT','حصة الأرباح الخاضعة للضريبة %',100,'100% لمنشأة خاضعة بالكامل للضريبة')}
  ${tzkIn('zr','معدل الزكاة %',2.5,'2.5% على الوعاء الزكوي')}
  ${tzkIn('shZ','حصة الملكية الخاضعة للزكاة %',0,'للمنشآت الخاضعة للزكاة (مثل السعودية/الخليجية)')}
  ${tzkIn('loss','خسائر ضريبية مرحّلة مستخدمة',0,'ضمن الحدود المسموح بها نظامًا')}</div>
 <h3>2) الضريبة الجارية — من الربح المحاسبي إلى الوعاء الضريبي</h3>
 <p class="mut small">أضف: مصروفات غير مقبولة (مخصصات، غرامات، مجاملات، إهلاك محاسبي…) · اطرح: إيرادات معفاة وإهلاك ضريبي ومخصصات مستخدمة.</p>
 <b>إضافات</b>${cgReg(ref,'tadd',{n:5,cols:[{k:'d',h:'البند',t:'t'},{k:'a',h:'المبلغ',t:'n',sum:1},{k:'r',h:'المرجع / التعليق',t:'r'}],pre:[{d:'مخصصات غير مستخدمة / غير مقبولة'},{d:'إهلاك محاسبي'},{d:'غرامات وتبرعات غير مقبولة'},{d:'مصروفات بلا مستندات ضريبية'},{d:'مصروفات تمويل تتجاوز حد الخصم'}]})}
 <b>خصومات</b>${cgReg(ref,'tded',{n:4,cols:[{k:'d',h:'البند',t:'t'},{k:'a',h:'المبلغ',t:'n',sum:1},{k:'r',h:'المرجع / التعليق',t:'r'}],pre:[{d:'توزيعات أرباح / إيرادات معفاة'},{d:'إهلاك ضريبي'},{d:'مخصصات مستخدمة خلال السنة'},{d:'أخرى'}]})}
 <table class="tw"><tbody>
  <tr><td>الربح المحاسبي قبل الضريبة</td><td class="num" dir="ltr">${f(d.pbt)}</td></tr>
  <tr><td>+ الإضافات / − الخصومات</td><td class="num" dir="ltr">${f(d.add)} / (${f(d.ded)})</td></tr>
  <tr><td>− خسائر مرحّلة</td><td class="num" dir="ltr">(${f(Math.max(0,d.loss))})</td></tr>
  <tr class="tot"><td>الوعاء الضريبي</td><td class="num" dir="ltr">${f(d.ti)}</td></tr>
  <tr class="tot"><td>الضريبة الجارية = الوعاء × ${(d.rate*100).toFixed(2)}% × ${(d.shT*100).toFixed(0)}%</td><td class="num" dir="ltr">${f(d.cur)}</td></tr></tbody></table>
 <h3>3) الضريبة المؤجلة (IAS 12)</h3>
 <div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px">
  ${tzkIn('dto','صافي الالتزام الضريبي المؤجل — أول المدة','0','التزام = موجب، أصل = سالب')}
  ${tzkIn('dtc','صافي الالتزام الضريبي المؤجل — آخر المدة','0','من ورقة M-03')}
  ${tzkIn('dtoci','الجزء المعترف به في OCI/حقوق الملكية','0','يُستبعد من الأرباح والخسائر')}</div>
 <p>مصروف الضريبة المؤجلة = (آخر − أول) − OCI = <b dir="ltr">${f(d.def)}</b> · راجع ${wpL('M-03')}</p>
 <h3>4) الزكاة — بناء الوعاء</h3>
 <p class="mut small">الوعاء = (حقوق الملكية والمخصصات والالتزامات طويلة الأجل وما في حكمها) − (الأصول الثابتة والاستثمارات والبنود المستبعدة)، وبحد أدنى الربح المعدّل. التفاصيل في ${wpL('Z-01')}. ${d.shZ?'':'<b>الحصة الخاضعة للزكاة = 0% (الزكاة غير منطبقة حاليًا).</b>'}</p>
 <b>إضافات للوعاء</b>${cgReg(ref,'zadd',{n:5,cols:[{k:'d',h:'البند',t:'t'},{k:'a',h:'المبلغ',t:'n',sum:1},{k:'r',h:'المرجع / التعليق',t:'r'}],pre:[{d:'رأس المال المدفوع'},{d:'الاحتياطيات والأرباح المبقاة أول المدة'},{d:'المخصصات (غير المستخدمة)'},{d:'قروض والتزامات طويلة الأجل'},{d:'صافي الربح المعدّل'}]})}
 <b>خصومات من الوعاء</b>${cgReg(ref,'zded',{n:4,cols:[{k:'d',h:'البند',t:'t'},{k:'a',h:'المبلغ',t:'n',sum:1},{k:'r',h:'المرجع / التعليق',t:'r'}],pre:[{d:'صافي الأصول الثابتة'},{d:'استثمارات طويلة الأجل'},{d:'خسائر مرحّلة'},{d:'أخرى مسموح بها'}]})}
 <table class="tw"><tbody>
  <tr><td>الوعاء المحتسب / الربح المعدّل (حد أدنى)</td><td class="num" dir="ltr">${f(d.zb)} / ${f(d.adjProfit)}</td></tr>
  <tr class="tot"><td>الزكاة = الأعلى منهما × ${(d.zr*100).toFixed(2)}% × ${(d.shZ*100).toFixed(0)}%</td><td class="num" dir="ltr">${f(d.zakat)}</td></tr></tbody></table>
 <h3>5) الإجمالي وتسوية المعدل الفعلي</h3>
 <div class="tw"><table><thead><tr><th>المكوّن</th><th>المبلغ</th></tr></thead><tbody>
  <tr><td>ضريبة الدخل الجارية</td><td class="num" dir="ltr">${f(d.cur)}</td></tr>
  <tr><td>الضريبة المؤجلة</td><td class="num" dir="ltr">${f(d.def)}</td></tr>
  <tr><td>الزكاة</td><td class="num" dir="ltr">${f(d.zakat)}</td></tr>
  <tr class="tot"><td>الإجمالي المحتسب</td><td class="num" dir="ltr">${f(d.total)}</td></tr>
  <tr><td>الرصيد بالميزان المعدّل (البند taxx)</td><td class="num" dir="ltr">${d.tbTax==null?'—':f(d.tbTax)}</td></tr>
  <tr class="tot"><td>الفرق</td><td class="num" dir="ltr">${d.diff==null?'—':f(d.diff)}</td></tr></tbody></table></div>
 <div class="tw"><table><thead><tr><th>تسوية المعدل الفعلي</th><th>المبلغ</th><th>%</th></tr></thead><tbody>
  <tr><td>الضريبة المتوقعة = الربح × المعدل القانوني × الحصة</td><td class="num" dir="ltr">${f(d.exp)}</td><td class="num" dir="ltr">${d.pbt?(d.rate*d.shT*100).toFixed(2):'—'}</td></tr>
  <tr><td>أثر البنود الدائمة (إضافات − خصومات)</td><td class="num" dir="ltr">${f(permEff)}</td><td class="num" dir="ltr">${d.pbt?(permEff/d.pbt*100).toFixed(2):'—'}</td></tr>
  <tr><td>أثر الخسائر المرحّلة</td><td class="num" dir="ltr">${f(-Math.max(0,d.loss)*d.rate*d.shT)}</td><td class="num" dir="ltr">${d.pbt?(-Math.max(0,d.loss)*d.rate*d.shT/d.pbt*100).toFixed(2):'—'}</td></tr>
  <tr><td>الضريبة المؤجلة</td><td class="num" dir="ltr">${f(d.def)}</td><td class="num" dir="ltr">${d.pbt?(d.def/d.pbt*100).toFixed(2):'—'}</td></tr>
  <tr><td>الزكاة</td><td class="num" dir="ltr">${f(d.zakat)}</td><td class="num" dir="ltr">${d.pbt?(d.zakat/d.pbt*100).toFixed(2):'—'}</td></tr>
  <tr class="tot"><td>المعدل الفعلي (الإجمالي ÷ الربح قبل الضريبة)</td><td class="num" dir="ltr">${f(d.total)}</td><td class="num" dir="ltr">${eff==null?'—':eff.toFixed(2)}</td></tr></tbody></table></div>
 <p class="mut small">المعدل الجاري الفعلي: ${effC==null?'—':effC.toFixed(2)}% · المعدلات والنسب مدخلات يعتمدها المراجع حسب التشريع الساري للسنة المراجَعة.</p>
 <h3>6) قائمة فحص الزكاة والضريبة</h3>
 <ul class="l" style="list-style:none;padding:0">${TZK_CHK.map((t,i)=>`<li><label><input type="checkbox" data-k="tzk.chk.${i}"${G('tzk.chk.'+i,false)===true?' checked':''}${ro?' disabled':''}> ${esc(t)}</label></li>`).join('')}</ul>
 <h3>7) الاستنتاج</h3>${edc('tzk.conclusion',{label:'استنتاج الزكاة والضريبة',ph:'استنتاج المراجع عن كفاية وسلامة مصروف الزكاة وضريبة الدخل والالتزام المقابل…'})}
 <p class="row noprint">${wpL('M-01 M-02 M-03 Z-01')}</p>`}
BLOCKS.taxzk=tzkHTML;
XP.taxzk=(it,p,ref)=>`<h3>مصروف الزكاة وضريبة الدخل (الجارية والمؤجلة)</h3><div data-block="taxzk|${esc(ref)}">${tzkHTML(ref)}</div>`;
document.addEventListener('change',e=>{const el=e.target;if(el instanceof Element&&el.dataset.k&&CUR.eng&&el.closest('[data-block^="taxzk"]')&&!el.matches('[type=checkbox],.ed')){setTimeout(()=>refreshBlock('taxzk'),0)}});
