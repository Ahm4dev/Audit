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
 /* opening balances: from the TB file when it carries them; otherwise derived = last year's closing for balance-sheet accounts (P&L accounts open at zero),
    with last year's result carried into retained earnings so the opening column balances. Movement = closing − opening. */
 const fileOpen=rows.some(r=>r.ob||r.mvDr||r.mvCr),hasPy=!!TBSTORE.pyMap||rows.some(r=>r.py);const mode=fileOpen?'file':hasPy?'derived':'none';
 let reCode=null,pyPL=0;if(mode==='derived')for(const r of rows){const c=clsOf(r.code);if(!c||!S[c.st])continue;if(c.st==='PL'||c.st==='OCI')pyPL+=py(r);else if(!reCode&&/أرباح مرحلة|أرباح محتجزة|ارباح مرحلة|retained/i.test((c.u||'')+' '+(c.n||'')))reCode=r.code}
 const rank=c=>{const i=c?TBX_ORDER.indexOf(c.st):-1;return i<0?TBX_ORDER.length:i};
 const data=rows.map(r=>{const c=clsOf(r.code),ok=!!c&&!!S[c.st],adj=r2(TBSTORE.adj(r.code)),cb=r2(r.cb),line=tbMapOf(r.code);
  let ob=r2(r.ob),dr=r2(r.mvDr),cr=r2(r.mvCr);
  if(mode==='derived'){ob=ok&&(c.st==='SFP'||c.st==='EQ')?py(r):0;if(r.code===reCode)ob=r2(ob+pyPL);const mv=r2(cb-ob);dr=mv>0?mv:0;cr=mv<0?-mv:0}
  return{r,c:ok?c:null,cb,adj,ob,dr,cr,adjd:r2(cb+adj),py:py(r),line:line&&AC[line]?AC[line].n:'',st:ok?auto[r.code]==='M'?'مبوَّب آليًا (راجعه)':'مبوَّب':'غير مبوَّب'}});
 data.sort((a,b)=>rank(a.c)-rank(b.c)||String(a.r.code).localeCompare(String(b.r.code),'en',{numeric:true}));
 const main=[['كود الحساب','اسم الحساب','Account name (EN)','أول المدة','حركة مدين','حركة دائن','الرصيد قبل التسويات','التسويات','الرصيد بعد التسويات','رصيد السنة السابقة','نوع القائمة','بند القائمة','التصنيف الفرعي','اسم الإيضاح','بند الربط','حالة التبويب']];
 for(const d of data){const r=d.r,c=d.c;main.push([r.code,r.name||'',r.nameEn||'',d.ob,d.dr,d.cr,d.cb,d.adj,d.adjd,d.py,c?S[c.st]:'',c?c.g||'':'',c?c.u||'':'',c?c.n||'':'',d.line,d.st])}
 /* summary per statement › group › sub-group */
 const grp=new Map();for(const d of data){const k=(d.c?d.c.st:'~')+'|'+(d.c?d.c.g||'':'')+'|'+(d.c?d.c.u||'':'');let g=grp.get(k);if(!g){g={st:d.c?S[d.c.st]:'غير مبوَّب',o:rank(d.c),g:d.c?d.c.g||'':'',u:d.c?d.c.u||'':'',n:0,ob:0,cb:0,adjd:0,py:0};grp.set(k,g)}g.n++;g.ob+=d.ob;g.cb+=d.cb;g.adjd+=d.adjd;g.py+=d.py}
 const gl=[...grp.values()].sort((a,b)=>a.o-b.o||a.g.localeCompare(b.g,'ar')||a.u.localeCompare(b.u,'ar'));
 const sum=[['القائمة','المجموعة','المجموعة الفرعية','عدد الحسابات','أول المدة','قبل التسويات','بعد التسويات','السنة السابقة']];
 let cur=null,t=null;const flush=()=>{if(t)sum.push([t.st,'الإجمالي','',t.n,r2(t.ob),r2(t.cb),r2(t.adjd),r2(t.py)])};
 for(const g of gl){if(cur!==g.st){flush();cur=g.st;t={st:g.st,n:0,ob:0,cb:0,adjd:0,py:0}}t.n+=g.n;t.ob+=g.ob;t.cb+=g.cb;t.adjd+=g.adjd;t.py+=g.py;sum.push([g.st,g.g,g.u,g.n,r2(g.ob),r2(g.cb),r2(g.adjd),r2(g.py)])}flush();
 /* checks */
 const tot=k=>r2(data.reduce((s,d)=>s+d[k],0)),un=data.filter(d=>!d.c),unB=r2(un.reduce((s,d)=>s+Math.abs(d.cb),0));
 const chk=[['البند','القيمة'],['الشركة',CUR.company.name],['السنة',G('eng.year','')],['المصدر',TBSTORE.stamp()],['عدد الحسابات',data.length],
  ['مصدر أول المدة',{file:'من ملف الميزان',derived:'مشتقة من أرصدة نهاية السنة السابقة (مع ترحيل نتيجة السنة السابقة إلى الأرباح المرحلة)',none:'غير متوفرة (لا أول مدة ولا سنة سابقة في الملف)'}[mode]],['مجموع أول المدة (يجب = 0)',tot('ob')],['مجموع الأرصدة قبل التسويات (يجب = 0)',tot('cb')],['مجموع التسويات (يجب = 0)',tot('adj')],['مجموع الأرصدة بعد التسويات (يجب = 0)',tot('adjd')],['مجموع السنة السابقة (يجب = 0)',tot('py')],
  ['الميزان متوازن',Math.abs(tot('adjd'))<0.01&&Math.abs(tot('cb'))<0.01?'نعم':'لا'],
  ['حسابات مبوَّبة',data.length-un.length],['حسابات مبوَّبة آليًا بثقة متوسطة (راجعها)',data.filter(d=>d.st.startsWith('مبوَّب آليًا')).length],
  ['حسابات غير مبوَّبة',un.length],['مجموع أرصدة غير المبوَّب (مطلق)',unB],['أُصدر في',localISO()+' بواسطة '+SESSION.display],['إشارة الأرصدة','مدين (+) / دائن (−)'],['ملاحظة','إجمالي «مركز مالي» = − إجمالي «دخل» = ربح (خسارة) العام قبل ترحيله إلى حقوق الملكية.']];
 return[{name:'الميزان المبوّب',rows:main,widths:[14,38,28,16,16,16,18,16,18,18,14,24,28,26,32,20]},{name:'ملخص التبويب',rows:sum,widths:[16,30,34,12,18,18,18,18]},{name:'فحوصات',rows:chk,widths:[48,40],header:true}]}
/* English version of the workbook when the interface language is English (account codes/names and the company name are user data and are never translated) */
const TBX_EN={'الميزان المبوّب':'Classified TB','ملخص التبويب':'Classification summary','فحوصات':'Checks',
 'كود الحساب':'Account code','اسم الحساب':'Account name','Account name (EN)':'Account name (EN)','أول المدة':'Opening balance','حركة مدين':'Debit movement','حركة دائن':'Credit movement','الرصيد قبل التسويات':'Balance before adjustments','التسويات':'Adjustments','الرصيد بعد التسويات':'Balance after adjustments','رصيد السنة السابقة':'Prior-year balance','القائمة':'Statement','نوع القائمة':'Statement type','بند القائمة':'Statement caption','التصنيف الفرعي':'Sub-classification','اسم الإيضاح':'Note name','مصدر أول المدة':'Opening balance source','من ملف الميزان':'From the TB file','مشتقة من أرصدة نهاية السنة السابقة (مع ترحيل نتيجة السنة السابقة إلى الأرباح المرحلة)':'Derived from prior-year closing balances (prior-year result carried to retained earnings)','غير متوفرة (لا أول مدة ولا سنة سابقة في الملف)':'Not available (the file has neither opening nor prior-year balances)','مجموع أول المدة (يجب = 0)':'Sum of opening balances (must be 0)','المجموعة':'Group','المجموعة الفرعية':'Sub-group','بند الربط':'Mapped FS line','حالة التبويب':'Classification status',
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
/* the original re-import template (always Arabic: the import expects Arabic statement / group names) + the list of valid classifications */
function tbClsExtraSheets(en){const ex=[];
 if(en){const rows=TBSTORE.rows.map(r=>{const c=clsOf(r.code)||{st:'',g:'',u:'',n:''};return[r.code,r.name||r.nameEn,r.cb,c.st?CLS_ST_NAME[c.st]:'',c.g,c.u,c.n]});
  ex.push({name:'التبويب',rows:[['كود الحساب','اسم الحساب','الرصيد الختامي','نوع القائمة','بند القائمة','التصنيف الفرعي','اسم الإيضاح']].concat(rows),widths:[14,40,16,16,26,26,26]})}
 ex.push({name:'قائمة التصنيفات',rows:[['نوع القائمة','بند القائمة','التصنيف الفرعي','اسم الإيضاح']].concat(CLS_TAX.map(x=>[CLS_ST_NAME[x.st],x.g,x.u,x.n])),widths:[16,30,30,30]});return ex}
/* ONE export for the classification tab: classified TB (opening / movement / closing / adjusted / prior year + classification) + summary + checks + the valid-classification list.
   The first sheet keeps the import column names, so after editing the classification in Excel it can be loaded back with «⤒ استيراد التبويب من Excel». */
function tbClsXlsxExport(){if(!TBSTORE.ready()){toast('لا يوجد ميزان معتمد للتصدير.','e');return}
 try{const nm=sanitizeName('Classified TB - '+CUR.company.name+' '+G('eng.year',''),90);const en=XT.on();let sh=tbClsSheets();if(en)sh=tbxEnglish(sh);sh=sh.concat(tbClsExtraSheets(en));
  downloadBlob(xlsxBlob(sh,{title:nm,author:SESSION.display}),nm+'.xlsx');
  audit('tb.cls.export',{fmt:'xlsx',rows:TBSTORE.rows.length,v:TBSTORE.ver});toast(`تم تصدير الميزان المبوَّب (${TBSTORE.rows.length.toLocaleString('en-US')} حساب) إلى Excel.`,'s')}
 catch(e){logErr('tbClsXlsx',e);toast('تعذر التصدير: '+errMsg(e),'e')}}
/* the classification tab's own button («نموذج / تصدير التبويب») now runs this single export */
clsExport=tbClsXlsxExport;
Object.assign(I18N_EN,{"تصدير الميزان المبوَّب / نموذج التبويب":"Export classified TB / classification template","الميزان المبوّب":"Classified TB","ملخص التبويب":"Classification summary"});
