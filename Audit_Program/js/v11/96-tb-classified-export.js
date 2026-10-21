/* Audit-Plus · v11.1 · Export the CLASSIFIED trial balance to Excel (.xlsx)
   Sheet 1  الميزان المبوّب   : one row per account — opening, movements, closing, adjustments, adjusted, prior year, statement / group / sub-group, mapped FS line, classification status
   Sheet 2  ملخص التبويب      : totals per statement › group › sub-group (adjusted, unadjusted, prior year) + statement totals
   Sheet 3  فحوصات            : TB balance, classification coverage, unclassified amount, adjustments, source stamp
   Sign convention is the TB's own: debit (+) / credit (−). Values only (no formulas) so the file opens identically everywhere. */
'use strict';
const TBX_ORDER=['SFP','PL','OCI','EQ'];
function tbClsSheets(){
 const rows=TBSTORE.rows,S=CLS_ST_NAME,auto=(CUR.eng&&CUR.eng.get('fsp.auto',null))||{};
 const py=r=>r2(TBSTORE.pyMap?TBSTORE.bal(r,{priorYear:true}):(r.py||0));
 const rank=c=>{const i=c?TBX_ORDER.indexOf(c.st):-1;return i<0?TBX_ORDER.length:i};
 const data=rows.map(r=>{const c=clsOf(r.code),ok=!!c&&!!S[c.st],adj=r2(TBSTORE.adj(r.code)),cb=r2(r.cb),line=tbMapOf(r.code);
  return{r,c:ok?c:null,cb,adj,adjd:r2(cb+adj),py:py(r),line:line&&AC[line]?AC[line].n:'',st:ok?auto[r.code]==='M'?'مبوَّب آليًا (راجعه)':'مبوَّب':'غير مبوَّب'}});
 data.sort((a,b)=>rank(a.c)-rank(b.c)||String(a.r.code).localeCompare(String(b.r.code),'en',{numeric:true}));
 const main=[['كود الحساب','اسم الحساب','Account name (EN)','أول المدة','حركة مدين','حركة دائن','الرصيد قبل التسويات','التسويات','الرصيد بعد التسويات','رصيد السنة السابقة','القائمة','المجموعة','المجموعة الفرعية','بند الربط','حالة التبويب']];
 for(const d of data){const r=d.r,c=d.c;main.push([r.code,r.name||'',r.nameEn||'',r2(r.ob),r2(r.mvDr),r2(r.mvCr),d.cb,d.adj,d.adjd,d.py,c?S[c.st]:'',c?c.g||'':'',c?c.u||'':'',d.line,d.st])}
 /* summary per statement › group › sub-group */
 const grp=new Map();for(const d of data){const k=(d.c?d.c.st:'~')+'|'+(d.c?d.c.g||'':'')+'|'+(d.c?d.c.u||'':'');let g=grp.get(k);if(!g){g={st:d.c?S[d.c.st]:'غير مبوَّب',o:rank(d.c),g:d.c?d.c.g||'':'',u:d.c?d.c.u||'':'',n:0,cb:0,adjd:0,py:0};grp.set(k,g)}g.n++;g.cb+=d.cb;g.adjd+=d.adjd;g.py+=d.py}
 const gl=[...grp.values()].sort((a,b)=>a.o-b.o||a.g.localeCompare(b.g,'ar')||a.u.localeCompare(b.u,'ar'));
 const sum=[['القائمة','المجموعة','المجموعة الفرعية','عدد الحسابات','قبل التسويات','بعد التسويات','السنة السابقة']];
 let cur=null,t=null;const flush=()=>{if(t)sum.push([t.st,'الإجمالي','',t.n,r2(t.cb),r2(t.adjd),r2(t.py)])};
 for(const g of gl){if(cur!==g.st){flush();cur=g.st;t={st:g.st,n:0,cb:0,adjd:0,py:0}}t.n+=g.n;t.cb+=g.cb;t.adjd+=g.adjd;t.py+=g.py;sum.push([g.st,g.g,g.u,g.n,r2(g.cb),r2(g.adjd),r2(g.py)])}flush();
 /* checks */
 const tot=k=>r2(data.reduce((s,d)=>s+d[k],0)),un=data.filter(d=>!d.c),unB=r2(un.reduce((s,d)=>s+Math.abs(d.cb),0));
 const chk=[['البند','القيمة'],['الشركة',CUR.company.name],['السنة',G('eng.year','')],['المصدر',TBSTORE.stamp()],['عدد الحسابات',data.length],
  ['مجموع الأرصدة قبل التسويات (يجب = 0)',tot('cb')],['مجموع التسويات (يجب = 0)',tot('adj')],['مجموع الأرصدة بعد التسويات (يجب = 0)',tot('adjd')],['مجموع السنة السابقة (يجب = 0)',tot('py')],
  ['الميزان متوازن',Math.abs(tot('adjd'))<0.01&&Math.abs(tot('cb'))<0.01?'نعم':'لا'],
  ['حسابات مبوَّبة',data.length-un.length],['حسابات مبوَّبة آليًا بثقة متوسطة (راجعها)',data.filter(d=>d.st.startsWith('مبوَّب آليًا')).length],
  ['حسابات غير مبوَّبة',un.length],['مجموع أرصدة غير المبوَّب (مطلق)',unB],['أُصدر في',localISO()+' بواسطة '+SESSION.display],['إشارة الأرصدة','مدين (+) / دائن (−)'],['ملاحظة','إجمالي «مركز مالي» = − إجمالي «دخل» = ربح (خسارة) العام قبل ترحيله إلى حقوق الملكية.']];
 return[{name:'الميزان المبوّب',rows:main,widths:[14,38,28,16,16,16,18,16,18,18,14,24,28,32,20]},{name:'ملخص التبويب',rows:sum,widths:[16,30,34,12,18,18,18]},{name:'فحوصات',rows:chk,widths:[48,40],header:true}]}
/* English version of the workbook when the interface language is English (account codes/names and the company name are user data and are never translated) */
const TBX_EN={'الميزان المبوّب':'Classified TB','ملخص التبويب':'Classification summary','فحوصات':'Checks',
 'كود الحساب':'Account code','اسم الحساب':'Account name','Account name (EN)':'Account name (EN)','أول المدة':'Opening balance','حركة مدين':'Debit movement','حركة دائن':'Credit movement','الرصيد قبل التسويات':'Balance before adjustments','التسويات':'Adjustments','الرصيد بعد التسويات':'Balance after adjustments','رصيد السنة السابقة':'Prior-year balance','القائمة':'Statement','المجموعة':'Group','المجموعة الفرعية':'Sub-group','بند الربط':'Mapped FS line','حالة التبويب':'Classification status',
 'مركز مالي':'Financial position','دخل':'Income','دخل شامل':'Other comprehensive income','حقوق ملكية':'Equity','مبوَّب':'Classified','مبوَّب آليًا (راجعه)':'Auto-classified (review)','غير مبوَّب':'Unclassified','الإجمالي':'Total',
 'عدد الحسابات':'No. of accounts','قبل التسويات':'Before adjustments','بعد التسويات':'After adjustments','السنة السابقة':'Prior year',
 'البند':'Item','القيمة':'Value','الشركة':'Company','السنة':'Year','المصدر':'Source','نعم':'Yes','لا':'No',
 'مجموع الأرصدة قبل التسويات (يجب = 0)':'Sum of balances before adjustments (must be 0)','مجموع التسويات (يجب = 0)':'Sum of adjustments (must be 0)','مجموع الأرصدة بعد التسويات (يجب = 0)':'Sum of balances after adjustments (must be 0)','مجموع السنة السابقة (يجب = 0)':'Sum of prior-year balances (must be 0)','الميزان متوازن':'Trial balance is balanced',
 'حسابات مبوَّبة':'Classified accounts','حسابات مبوَّبة آليًا بثقة متوسطة (راجعها)':'Auto-classified with medium confidence (review)','حسابات غير مبوَّبة':'Unclassified accounts','مجموع أرصدة غير المبوَّب (مطلق)':'Total of unclassified balances (absolute)','أُصدر في':'Exported on','إشارة الأرصدة':'Balance sign','مدين (+) / دائن (−)':'Debit (+) / Credit (−)','ملاحظة':'Note',
 '«مركز مالي» = − إجمالي «دخل» = ربح (خسارة) العام قبل ترحيله إلى حقوق الملكية.':'',
 'إجمالي «مركز مالي» = − إجمالي «دخل» = ربح (خسارة) العام قبل ترحيله إلى حقوق الملكية.':'Total of “Financial position” = − total of “Income” = profit (loss) for the year before it is closed to equity.'};
function tbxEnglish(sheets){const T=s=>typeof s==='string'?(TBX_EN[s]!==undefined?TBX_EN[s]:XT.tr(s)):s;
 const by=/ بواسطة /;
 return sheets.map((sh,si)=>({...sh,name:T(sh.name),rows:sh.rows.map((r,ri)=>r.map((v,ci)=>{
  if(typeof v!=='string')return v;
  if(si===0&&ri>0&&ci<3)return v;                       /* account code / name: user data */
  if(si===2&&ri>0&&ci===1&&['الشركة','السنة'].includes(sh.rows[ri][0]))return v;   /* company name / year */
  if(si===2&&ri>0&&ci===1&&sh.rows[ri][0]==='أُصدر في')return v.replace(by,' by ');
  return T(v)}))}))}
function tbClsXlsxExport(){if(!TBSTORE.ready()){toast('لا يوجد ميزان معتمد للتصدير.','e');return}
 try{const nm=sanitizeName('Classified TB - '+CUR.company.name+' '+G('eng.year',''),90);let sh=tbClsSheets();if(XT.on())sh=tbxEnglish(sh);
  downloadBlob(xlsxBlob(sh,{title:nm,author:SESSION.display}),nm+'.xlsx');
  audit('export.tb.classified',{fmt:'xlsx',rows:TBSTORE.rows.length,v:TBSTORE.ver});toast(`تم تصدير الميزان المبوَّب (${TBSTORE.rows.length.toLocaleString('en-US')} حساب) إلى Excel.`,'s')}
 catch(e){logErr('tbClsXlsx',e);toast('تعذر التصدير: '+errMsg(e),'e')}}
document.addEventListener('click',e=>{const b=e.target instanceof Element&&e.target.closest('[data-fsx]');if(!b)return;e.preventDefault();tbClsXlsxExport()});
const TBX_BTN=`<button class="btn sm" type="button" data-fsx="tb">⤓ تصدير الميزان المبوَّب (Excel)</button>`;
/* button on every TB tab that is about the classified data + inside the statements summary + the statement prep bar */
(function(){const o=tbHead;tbHead=function(a){const h=o.apply(this,arguments);return(TBSTORE.ready()&&['','cls','map','fs','link'].includes(a||''))?h+`<div class="row noprint" style="margin:6px 0">${TBX_BTN}</div>`:h}})();
(function(){const o=fsPrepBar;fsPrepBar=function(){const h=o.apply(this,arguments);return h?h.replace(/<\/div>$/,TBX_BTN+'</div>'):h}})();
Object.assign(I18N_EN,{"تصدير الميزان المبوَّب (Excel)":"Export classified TB (Excel)","الميزان المبوّب":"Classified TB","ملخص التبويب":"Classification summary"});
