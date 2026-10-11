/* MEAP · v10 · A105 (supporting schedules for the statement of cash flows) and C150 (cash-flow audit procedures) */
'use strict';
(function(){
 const ar=()=>(PREF&&PREF.lang)!=='en';
 const tx=(a,e)=>ar()?a:e;
 XP.cfsupport=function(it,p,ref){
  const B=fsBuild();let h=fsPageHead(it,ref);
  if(!B.ready)return h+fsNoData();
  const d=fsCFData();
  if(!d)return h+`<div class="note warn">${tx('أوراق العمل المؤيدة للتدفقات النقدية تُشتق من حركة أرصدة الميزان بين السنتين؛ حمّل ميزان السنة السابقة أولًا من «رفع الميزان».','Cash-flow support is derived from the movement of TB balances between the two years; upload the prior-year trial balance first.')}</div>`;
  const rows=[]; const add=(grp,l,v)=>rows.push([grp,l,v]);
  const OP=tx('تشغيل','Operating'),IV=tx('استثمار','Investing'),FN=tx('تمويل','Financing');
  add(OP,tx('الربح قبل الضريبة','Profit before tax'),d.pbt);d.adjs.forEach(x=>add(OP,tx('تسوية: ','Adjustment: ')+x[0],x[1]));d.ws.forEach(x=>add(OP,tx('التغير في ','Change in ')+x[0],x[1]));add(OP,tx('ضرائب الدخل المدفوعة','Income tax paid'),d.taxPaid);
  add(IV,tx('اقتناء/(استبعاد) أصول','Capex / disposals'),d.capex);add(IV,tx('استثمارات مالية وأرصدة طويلة الأجل','Financial investments'),d.inv);add(IV,tx('إيرادات تمويلية مقبوضة','Finance income received'),d.fi);
  d.fin_.forEach(x=>add(FN,x[0],x[1]));
  const body=rows.map((r,i)=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td class="num" dir="ltr">${fm(r[2])}</td><td>${edc('wp.'+ref+'.ref.'+i,{label:tx('مرجع ورقة العمل','WP ref'),ph:tx('مرجع…','ref…')})}</td><td>${edc('wp.'+ref+'.note.'+i,{label:tx('تعليق','Comment'),ph:tx('تعليق/دليل…','comment / evidence…')})}</td></tr>`).join('');
  h+=`<h3>${tx('جدول مؤيِّد لبنود قائمة التدفقات النقدية','Schedule supporting the cash-flow lines')}</h3><div class="tw"><table class="fst"><thead><tr><th>${tx('النشاط','Activity')}</th><th>${tx('البند','Line item')}</th><th>${tx('المبلغ','Amount')}</th><th>${tx('مرجع ورقة العمل','WP ref')}</th><th>${tx('تعليق / دليل','Comment / evidence')}</th></tr></thead><tbody>${body}
  <tr class="tot"><td colspan="2">${tx('صافي التغير في النقدية (محسوب)','Net change in cash (computed)')}</td><td class="num" dir="ltr">${fm(d.net)}</td><td colspan="2"></td></tr>
  <tr class="tot"><td colspan="2">${tx('التغير الفعلي في النقدية (الميزان)','Actual change in cash (TB)')}</td><td class="num" dir="ltr">${fm(d.dcash)}</td><td colspan="2"></td></tr>
  <tr class="${Math.abs(d.diff)<=Math.max(1,fsM()*0.05)?'okrow':'bad'}"><td colspan="2">${tx('فرق غير مفسَّر','Unexplained difference')}</td><td class="num" dir="ltr">${fm(d.diff)}</td><td colspan="2">${edc('wp.'+ref+'.diffx',{label:tx('تفسير الفرق','Explanation'),ph:tx('تفسير الفرق…','explain the difference…')})}</td></tr></tbody></table></div>`;
  return h};
 const PROC=[['فحص مطابقة النقدية آخر العام في القائمة مع الميزان وكشوف البنوك ومصادقات البنوك.','Agree closing cash per the statement to the TB, bank statements and confirmations.'],
 ['التحقق من مطابقة أرصدة النقدية أول العام مع القوائم المالية للسنة السابقة.','Agree opening cash to the prior-year financial statements.'],
 ['التحقق من تصنيف التدفقات بين التشغيل والاستثمار والتمويل وفق IAS 7 / EAS 4.','Test classification of flows between operating, investing and financing (IAS 7).'],
 ['إعادة احتساب القائمة (الطريقة غير المباشرة) والتحقق من تسويات البنود غير النقدية.','Recompute the statement (indirect method) and verify non-cash adjustments.'],
 ['مطابقة بنود القائمة مع حركة الحسابات المبوّبة وورقة عمل كل مجال.','Agree line items to account movements and the related area working papers.'],
 ['فحص المعاملات غير النقدية الكبيرة (استبعادات، تحويلات، عقود إيجار) والإفصاح عنها.','Review significant non-cash transactions and their disclosure.'],
 ['فحص تفسير الفروق غير المفسَّرة وفروق العملات وأثرها على النقدية.','Investigate unexplained differences and FX effects on cash.'],
 ['مراجعة الإفصاحات: النقدية وما في حكمها، قيود التحويل، التسهيلات غير المسحوبة.','Review disclosures: cash equivalents, restricted cash, undrawn facilities.'],
 ['مراجعة الأحداث اللاحقة المؤثرة على التدفقات النقدية والاستمرارية.','Review subsequent events affecting cash flows and going concern.']];
 XP.cfproc=function(it,p,ref){
  let h=fsPageHead(it,ref);
  const rows=PROC.map((x,i)=>`<tr><td class="num">${i+1}</td><td>${esc(tx(x[0],x[1]))}</td><td>${edc('wp.'+ref+'.wp.'+i,{label:tx('المرجع','Ref'),ph:tx('مرجع…','ref…')})}</td><td>${edc('wp.'+ref+'.res.'+i,{label:tx('النتيجة','Result'),ph:tx('العمل المنفّذ والنتيجة…','work done and result…'),ml:1})}</td><td>${edc('wp.'+ref+'.by.'+i,{label:tx('المنفذ','Done by'),ph:'…'})}</td></tr>`).join('');
  h+=`<div class="tw"><table class="fst"><thead><tr><th>#</th><th>${tx('إجراء المراجعة','Audit procedure')}</th><th>${tx('مرجع','Ref')}</th><th>${tx('العمل المنفذ والنتيجة','Work done and result')}</th><th>${tx('المنفذ','By')}</th></tr></thead><tbody>${rows}</tbody></table></div>
  <h3>${tx('الاستنتاج','Conclusion')}</h3>${edc('wp.'+ref+'.concl',{label:tx('الاستنتاج','Conclusion'),ph:tx('استنتاج المراجع حول قائمة التدفقات النقدية…','Auditor conclusion on the statement of cash flows…'),ml:1})}`;
  return h};
})();
