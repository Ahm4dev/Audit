/* Audit-Plus · v11 · Smart trial-balance import (UI + sign-convention engine).
   Re-uses the proven engine (worker parsing, detectMapping, buildAccountsA, validateTB, versioned storage) and replaces the wizard UI:
   stepper · smart layout detection · sign-convention diagnosis (debit-positive / credit-positive / unsigned) with one-click fix ·
   live preview with split Dr/Cr · KPI tiles · downloadable templates.  The decision is stored with the version (tbv.<n>.sign). */
'use strict';
const TBI_STEPS=[['up','رفع الملف'],['map','ربط الأعمدة والإشارات'],['val','التحقق'],['ok','الاعتماد']];
const TBI_SIGN=[['asis','كما هو في الملف','مدين = موجب · دائن = سالب (الوضع القياسي)'],['flip','عكس الإشارة','الملف يعرض الدائن بالموجب والمدين بالسالب'],['nature','استنتاج الاتجاه من طبيعة الحساب','الملف بلا إشارات (كل الأرصدة موجبة): يُحدَّد المدين/الدائن من تبويب الحساب']];
UPL.sign={mode:'asis',auto:true,diag:null,key:'',flip:[]};
const tbiNum=v=>fmtA(v);
/* ---------- nature of an account from the classification engine (1 debit · -1 credit · 0 unknown) ---------- */
const TBI_NAT=new Map();
function tbiNature(a){const k=a.code+'|'+a.name+'|'+a.nameEn;if(TBI_NAT.has(k))return TBI_NAT.get(k);let r=0;const nm=normAr((a.name||'')+' '+(a.nameEn||''));
 /* explicit wording first: contra-assets (credit) and contra-revenue (debit) override the generic class */
 if(/مجمع|accumulated|allowance for|مخصص (خسائر|اضمحلال|ديون)|provision for (doubtful|impair|credit)/.test(nm)&&!/(^| )مصروف|(^| )مصاريف|expense/.test(nm))r=-1;
 else if(/مردودات|returns|خصم مسموح|خصم تجاري|discount allowed|sales discount/.test(nm)&&/مبيعات|ايراد|sales|revenue|مردودات/.test(nm))r=1;
 else{try{const s=clsSuggestOne({code:a.code,name:a.name,nameEn:a.nameEn,cb:0});if(s&&(s.conf==='H'||s.conf==='M')){r=clsNature({st:s.st,g:s.g,u:s.u,n:s.n})||0}}catch(e){r=0}
  /* wording fallback when the engine is unsure */
  const credW=/(^| )(قروض|قرض|سندات|دائنون|موردون|اوراق دفع)|loan|borrowing|payable|supplier|رأس المال|راس المال|share capital|احتياطي|reserve|ايراد|مبيعات|revenue|(^| )sales/.test(nm);const debW=/(^| )(مصروف|مصاريف|تكلفه|رواتب|اجور|ايجار)|expense|cost of|salar|wages|rent expense/.test(nm);
  if(!r){if(/مستحق|accrued|مقدما مستلم|deferred revenue/.test(nm))r=-1;else if(credW&&!debW)r=-1;else if(debW&&!credW)r=1}}
 if(TBI_NAT.size>60000)TBI_NAT.clear();TBI_NAT.set(k,r);return r}
function tbiDiag(accts){const sample=accts.filter(a=>Math.abs(a.cb)>0.005).slice(0,900);let agree=0,dis=0,unk=0,pos=0,neg=0,net=0;
 for(const a of accts){net+=a.cb}
 for(const a of sample){if(a.cb>0)pos++;else neg++;const n=tbiNature(a);if(!n){unk++;continue}if((a.cb>0)===(n>0))agree++;else dis++}
 const known=agree+dis;const ratio=known?agree/known:null;let rec='asis',why='';
 if(!sample.length){return{rec:'asis',why:'',pos,neg,net,known,agree,dis,ratio}}
 if(!neg&&pos>=5){rec='nature';why='كل الأرصدة موجبة — الميزان بلا إشارة مدين/دائن.'}
 else if(known>=6&&ratio<=0.25){rec='flip';why=`${dis} من ${known} حسابًا معروف الطبيعة تظهر بعكس طبيعتها (الأصول/المصروفات بالسالب والالتزامات/الإيرادات بالموجب).`}
 else if(known>=6&&ratio>=0.75){rec='asis';why=`${agree} من ${known} حسابًا معروف الطبيعة متوافق مع الإشارة القياسية.`}
 else if(known>=6){rec='asis';why='الإشارات مختلطة؛ راجع الحسابات يدويًا (قد تحتوي أرصدة عكسية فعلية).'}
 else{rec='asis';why='عدد الحسابات المعروفة الطبيعة قليل لتأكيد الاتجاه.'}
 return{rec,why,pos,neg,net,known,agree,dis,ratio}}
/* apply the chosen sign convention to built accounts (only to single-net columns; Dr/Cr column pairs are already signed correctly) */
function tbApplySign(accts,map,sign){sign=sign||UPL.sign;const mode=sign&&sign.mode||'asis';if(!accts.length)return accts;if(mode==='asis'){const fl0=new Set((sign&&sign.flip)||[]);if(fl0.size)for(const a of accts){if(!fl0.has(a.code))continue;a.ob=-a.ob;a.cb=-a.cb;if(a.py!=null)a.py=-a.py;if(a.bud!=null)a.bud=-a.bud}return accts}
 const netCb=map.cb!=null,netOb=map.ob!=null,derived=!netCb&&map.cbDr==null&&map.cbCr==null;
 for(const a of accts){
  if(mode==='flip'){if(netOb)a.ob=-a.ob;if(netCb)a.cb=-a.cb;if(a.py!=null&&map.py!=null)a.py=-a.py;if(a.bud!=null&&map.bud!=null)a.bud=-a.bud;if(derived)a.cb=a.ob+a.mvDr-a.mvCr}
  else if(mode==='nature'){const n=tbiNature(a);if(!n)continue;const f=v=>v==null?v:(n>0?Math.abs(v):-Math.abs(v));if(netOb)a.ob=f(a.ob);if(netCb)a.cb=f(a.cb);if(a.py!=null&&map.py!=null)a.py=f(a.py);if(a.bud!=null&&map.bud!=null)a.bud=f(a.bud);if(derived)a.cb=a.ob+a.mvDr-a.mvCr}}
 const fl=new Set((sign&&sign.flip)||[]);if(fl.size)for(const a of accts){if(!fl.has(a.code))continue;a.ob=-a.ob;a.cb=-a.cb;if(a.py!=null)a.py=-a.py;if(a.bud!=null)a.bud=-a.bud}
 return accts}
(function(){const o=buildAccountsA;buildAccountsA=async function(raw,hr,map,onp){const r=await o(raw,hr,map,onp);tbApplySign(r.accounts,map,UPL.sign);return r}})();
(function(){const o=uplParsed;uplParsed=async function(r){UPL.sign={mode:'asis',auto:true,diag:null,key:'',flip:[]};return o(r)}})();
/* keep the decision with the saved version */
(function(){const o=uplAccept;uplAccept=async function(){const snap=JSON.parse(JSON.stringify({mode:UPL.sign.mode,auto:UPL.sign.auto,rec:UPL.sign.diag&&UPL.sign.diag.rec,file:UPL.file&&UPL.file.name,map:UPL.map}));const before=TBSTORE.active();
  await o.apply(this,arguments);const v=TBSTORE.active();if(v&&v!==before&&CUR.eng){CUR.eng.set('tbv.'+v+'.sign',snap,{noUndo:true});CUR.eng.set('tbv.'+v+'.hasob',tbiHasOb(),{noUndo:true})}}})();
/* does the active TB carry real opening balances? (column mapped and not all zero) */
let _hob={k:'',v:false};
function tbiHasOb(){if(!TBSTORE.ready())return false;const k=TBSTORE.ver+':'+(CUR.eng&&CUR.eng.path);if(_hob.k===k)return _hob.v;let v=false;for(const r of TBSTORE.rows){if(Math.abs(r.ob)>0.005||Math.abs(r.mvDr)>0.005||Math.abs(r.mvCr)>0.005){v=true;break}}_hob={k,v};return v}
/* ---------- layout detection summary ---------- */
function tbiLayout(map){const has=k=>map[k]!=null;const p=[];
 if(has('cb'))p.push('رصيد ختامي صافي (عمود واحد)');else if(has('cbDr')||has('cbCr'))p.push('رصيد ختامي مدين/دائن');else if(has('ob')||has('obDr')||has('mvDr'))p.push('رصيد ختامي محسوب (أول المدة + الحركة)');
 if(has('ob')||has('obDr')||has('obCr'))p.push('أرصدة أول المدة');if(has('mvDr')||has('mvCr'))p.push('حركة الفترة');if(has('py'))p.push('سنة سابقة');if(has('bud'))p.push('موازنة');if(has('stmt')||has('grp')||has('sub'))p.push('تبويب جاهز في الملف');if(has('branch'))p.push('فرع/مركز تكلفة');return p}
function tbiConf(map,heads){const req=[['code','كود الحساب'],['name','اسم الحساب']];const miss=req.filter(r=>map[r[0]]==null&&!(r[0]==='name'&&map.nameEn!=null)).map(r=>r[1]);const hasBal=map.cb!=null||map.cbDr!=null||map.cbCr!=null||map.ob!=null||map.obDr!=null||map.mvDr!=null;if(!hasBal)miss.push('رصيد آخر المدة');return miss}
/* ---------- templates ---------- */
const TBI_TPL_HEAD=['كود الحساب','اسم الحساب','Account Name','رصيد أول المدة - مدين','رصيد أول المدة - دائن','حركة الفترة - مدين','حركة الفترة - دائن','رصيد آخر المدة - مدين','رصيد آخر المدة - دائن','رصيد السنة السابقة (صافي)','التبويب - نوع القائمة','التبويب - بند القائمة'];
const TBI_TPL_ROWS=[['1101','الصندوق','Cash on hand',50000,0,250000,240000,60000,0,50000,'',''],['2101','الموردون','Trade payables',0,120000,300000,350000,0,170000,-120000,'',''],['4101','إيرادات المبيعات','Sales revenue',0,0,0,900000,0,900000,-850000,'','']];
async function tbiTemplate(kind){try{const f='TB-import-template';
  if(kind==='csv'){const q=v=>'"'+String(v).replace(/"/g,'""')+'"';const csv='﻿'+[TBI_TPL_HEAD].concat(TBI_TPL_ROWS).map(r=>r.map(q).join(',')).join('\r\n');downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),f+'.csv');return}
  const hs={b:1,color:'FFFFFF',fill:'1F6F5C',h:'center',v:'center',wrap:true,bd:{l:{s:'thin',c:'9AA7A3'},r:{s:'thin',c:'9AA7A3'},t:{s:'thin',c:'9AA7A3'},b:{s:'thin',c:'9AA7A3'}}};
  const cs={bd:hs.bd,nf:'#,##0.00;[Red](#,##0.00)'};const ts={bd:hs.bd};
  const rows=[{h:34,cells:TBI_TPL_HEAD.map((v,c)=>({c,v,s:hs}))}].concat(TBI_TPL_ROWS.map(r=>({cells:r.map((v,c)=>({c,v,s:(c>=3&&c<=9)?cs:ts}))})));
  const note={name:'تعليمات',rtl:true,grid:false,cols:[110],rows:['استبدل الصفوف النموذجية بحسابات الميزان الفعلية (لا تحذف صف العناوين).','يكفي: كود الحساب + الاسم + (رصيد آخر المدة مدين/دائن) — باقي الأعمدة اختيارية.','يمكنك استخدام عمود واحد للرصيد الصافي (مدين موجب/دائن سالب) بدلاً من مدين/دائن.','الأرقام السالبة بين أقواس أو بعلامة ناقص مقبولة، كما تُقبل الأرقام العربية.','المستورد يكتشف الأعمدة آليًا ويسمح لك بالتعديل قبل الاعتماد.'].map(t=>({cells:[{c:0,v:t,s:{wrap:true,v:'top',h:'right',ro:2}}],h:24}))};
  const blob=await XR.build([{name:'Trial Balance',rtl:true,grid:false,cols:[14,36,30,16,16,16,16,16,16,18,18,22],rows,freezeRows:1,tab:'FF1F6F5C'},note],{title:'TB import template',font:'Arial'});downloadBlob(blob,f+'.xlsx')}
 catch(e){logErr('tb template',e);toast('تعذر إنشاء القالب: '+errMsg(e),'e')}}
/* ---------- UI ---------- */
function tbiStepper(cur){return `<ol class="tbi-steps" aria-label="مراحل استيراد الميزان">${TBI_STEPS.map((s,i)=>`<li class="${i<cur?'done':i===cur?'on':''}"${i===cur?' aria-current="step"':''}><b>${i<cur?'✓':i+1}</b><span>${s[1]}</span></li>`).join('')}</ol>`}
function tbiKpi(l,v,cls,sub){return `<div class="tbi-kpi ${cls||''}"><span>${l}</span><b dir="ltr">${v}</b>${sub?`<small>${sub}</small>`:''}</div>`}
function tbiUp(){const act=TBSTORE.ready()?TBSTORE.meta:null;
 return `${tbiStepper(0)}<div class="tbi-hero"><div class="dz tbi-dz" data-tbdz tabindex="0" role="button" aria-label="رفع ميزان المراجعة"><div class="tbi-ico" aria-hidden="true">⤒</div><b>اسحب ملف ميزان المراجعة وأفلته هنا</b><span class="mut">CSV · TSV · XLSX — أو</span><label class="btn">اختر ملفًا<input class="sr" type="file" accept=".csv,.tsv,.txt,.xlsx,.xlsm" data-tbfile></label><small class="mut">ترميز UTF-8 أو Windows-1256 يُكتشف تلقائيًا · المعالجة في الخلفية دون تجميد الواجهة</small></div>
 <div class="tbi-side"><h3>ماذا يفعل المستورد الذكي؟</h3><ul class="tbi-feat"><li>يكتشف صف العناوين والأعمدة (عربي/إنجليزي) ويطبّق قالب الشركة المحفوظ.</li><li>يدعم: صافي بإشارة، أو مدين/دائن، أو أول المدة + الحركة، مع السنة السابقة والموازنة.</li><li>يشخّص <b>اتجاه الإشارة</b> (مدين/دائن) ويصلحه بنقرة، حتى لو كان الميزان بلا إشارات.</li><li>يتحقق من التوازن والتكرار والأرقام غير الصالحة وتطابق السنة السابقة قبل الاعتماد.</li><li>يربط الأرصدة تلقائيًا بأوراق العمل والقوائم المالية وإجراءات التحليل (أول المدة وآخرها).</li></ul>
 <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn o sm" type="button" data-tbi-act="tpl-xlsx">⤓ قالب Excel</button><button class="btn o sm" type="button" data-tbi-act="tpl-csv">⤓ قالب CSV</button></div>
 ${act?`<p class="tbi-cur">الميزان النشط: <b>v${act.v}</b> · ${(act.counts&&act.counts.accounts||TBSTORE.rows.length).toLocaleString('en-US')} حساب · ${esc(String(act.createdAt).slice(0,10))} — رفع ملف جديد يُنشئ إصدارًا جديدًا ولا يحذف السابق.</p>`:''}</div></div>`}
function tbiProc(){return `${tbiStepper(UPL.step===4?3:0)}<div class="card tbi-proc"><p><b>${esc(UPL.file?UPL.file.name:'')}</b> ${UPL.file?'<span class="mut">('+fmtSize(UPL.file.size)+')</span>':''}</p><progress max="100" value="${Math.round((UPL.p||0)*100)}" data-upl-prog aria-label="التقدم"></progress><p class="small" data-upl-msg aria-live="polite">${esc(UPL.msg||'')}</p>${UPL.step===1?'<button class="btn d sm" type="button" data-act="uplcancel">إلغاء</button>':''}</div>`}
function tbiMap(){const prevRows=UPL.raw.slice(UPL.hr+1,UPL.hr+2001);const heads=(UPL.raw[UPL.hr]||[]).map(x=>String(x==null?'':x));
 const B=buildAccounts([heads].concat(prevRows),0,UPL.map);let acc=B.accounts;
 /* diagnose on the raw (unsigned) values, then show the preview with the chosen convention */
 const key=JSON.stringify(UPL.map)+'|'+UPL.hr+'|'+(UPL.file&&UPL.file.name);
 if(UPL.sign.key!==key){UPL.sign.key=key;UPL.sign.diag=tbiDiag(acc);if(UPL.sign.auto){const r=UPL.sign.diag.rec;UPL.sign.mode=r}}
 const D=UPL.sign.diag||tbiDiag(acc);acc=tbApplySign(acc.map(a=>Object.assign({},a)),UPL.map,UPL.sign);
 const missing=tbiConf(UPL.map,heads);const lay=tbiLayout(UPL.map);
 const nz=acc.filter(a=>Math.abs(a.cb)>.005).length;let sDr=0,sCr=0,net=0;for(const a of acc){net+=a.cb;if(a.cb>=0)sDr+=a.cb;else sCr-=a.cb}
 const bal=Math.abs(net)<=1;const hasCls=UPL.map.stmt!=null||UPL.map.grp!=null||UPL.map.sub!=null||UPL.map.note!=null;
 let warn='';if(acc.length&&!nz)warn+=`<p class="note bad">⚠ جميع الأرصدة الختامية المقروءة = صفر. تأكد من اختيار العمود الصحيح للرصيد أو من صف العناوين.${UPL.fc&&UPL.fc[1]>UPL.fc[0]?' الملف يحتوي معادلات لم يُحسب '+(UPL.fc[1]-UPL.fc[0]).toLocaleString('en-US')+' منها — افتحه في Excel واحفظه ثم أعد الرفع.':''}</p>`;
 if(UPL.fc&&UPL.fc[0]>0)warn+=`<p class="note ok">✓ احتُسب ${UPL.fc[0].toLocaleString('en-US')} معادلة تلقائيًا من خلايا الملف.</p>`;
 if(B.issues.nonNumN)warn+=`<p class="note warn">⚠ ${B.issues.nonNumN} قيمة غير رقمية في أعمدة الأرصدة (ستُعامل كصفر): ${B.issues.nonNum.slice(0,3).map(x=>`صف ${x.row} «${esc(x.value)}»`).join('، ')}</p>`;
 const rec=D.rec;const recTxt=TBI_SIGN.find(x=>x[0]===rec)[1];
 return `${tbiStepper(1)}
 <div class="card tbi-file"><div class="tbi-chips"><span class="tbi-chip"><b>${esc(UPL.file.name)}</b></span><span class="tbi-chip">${UPL.raw.length.toLocaleString('en-US')} صف</span><span class="tbi-chip">${esc(UPL.kind==='xlsx'?'XLSX':'CSV')}${UPL.enc?' · '+esc(UPL.enc):''}${UPL.delim?' · الفاصل '+esc(UPL.delim):''}</span><span class="tbi-chip">${UPL.parseMs} ms</span>${UPL.tplUsed?'<span class="tbi-chip ok">طُبّق قالب الربط المحفوظ للشركة</span>':'<span class="tbi-chip">اكتشاف آلي من الترويسة</span>'}<button class="btn g sm" type="button" data-act="uplreset">تغيير الملف</button></div>
 ${UPL.sheets.length>1?`<label>الورقة<select class="sel" data-upl="sheet">${UPL.sheets.map((s,i)=>`<option value="${i}"${UPL.sheet===i?' selected':''}>${esc(s)}</option>`).join('')}</select></label>`:''}</div>
 <div class="card tbi-detect ${missing.length?'warn':'ok'}"><h3>الاكتشاف الذكي</h3>${missing.length?`<p class="bad">⚠ ناقص: <b>${missing.join('، ')}</b> — اختر العمود المناسب أدناه.</p>`:`<p class="ok">✓ تم التعرف على: ${lay.map(x=>`<span class="tbi-chip ok">${esc(x)}</span>`).join(' ')}</p>`}</div>
 <details class="card tbi-hdr"${missing.length?' open':''}><summary><b>١) صف العناوين</b> <span class="mut small">— المقترح: الصف ${UPL.hr+1}</span></summary>${v4HdrPicker(UPL.raw,UPL.hr,'upl')}</details>
 <div class="card"><h3>٢) ربط الأعمدة</h3><div class="tbi-grid"><section><h4>بيانات الحساب</h4><div class="fgrid">${v4MapFields(UPL.raw,UPL.hr,UPL.map,'upl',TBF.filter(f=>['code','name','nameEn','branch'].includes(f[0])))}</div></section>
  <section><h4>أول المدة والحركة</h4><div class="fgrid">${v4MapFields(UPL.raw,UPL.hr,UPL.map,'upl',TBF.filter(f=>['ob','obDr','obCr','mvDr','mvCr'].includes(f[0])))}</div></section>
  <section><h4>آخر المدة <small class="mut">(يكفي أحد الخيارات)</small></h4><div class="fgrid">${v4MapFields(UPL.raw,UPL.hr,UPL.map,'upl',TBF.filter(f=>['cb','cbDr','cbCr'].includes(f[0])))}</div></section>
  <section><h4>مقارنات</h4><div class="fgrid">${v4MapFields(UPL.raw,UPL.hr,UPL.map,'upl',TBF.filter(f=>['py','bud'].includes(f[0])))}</div></section>
  <section><h4>التبويب الجاهز <small class="mut">(اختياري)</small></h4><div class="fgrid">${v4MapFields(UPL.raw,UPL.hr,UPL.map,'upl',TBF.filter(f=>['stmt','grp','sub','note'].includes(f[0])))}</div></section></div></div>
 <div class="card tbi-sign"><h3>٣) اتجاه الإشارة (مدين / دائن)</h3>
  <p class="${D.rec==='asis'&&D.known>=6&&D.ratio>=.75?'ok':D.rec==='asis'?'mut':'warn'}"><b>التشخيص:</b> ${esc(D.why||'—')} ${D.known?`<span class="mut small">(عيّنة ${D.known} حساب معروف الطبيعة · المقترح: ${esc(recTxt)})</span>`:''}</p>
  <div class="tbi-radios" role="radiogroup" aria-label="اتجاه الإشارة">${TBI_SIGN.map(s=>`<label class="tbi-radio${UPL.sign.mode===s[0]?' on':''}"><input type="radio" name="tbisign" data-tbi="sign" value="${s[0]}"${UPL.sign.mode===s[0]?' checked':''}><span><b>${s[1]}</b>${s[0]===rec?' <span class="tbi-chip ok">مقترح</span>':''}<small>${s[2]}</small></span></label>`).join('')}</div>
  <div class="tbi-kpis">${tbiKpi('مجموع المدين',tbiNum(sDr))}${tbiKpi('مجموع الدائن',tbiNum(sCr))}${tbiKpi('الفرق',tbiNum(net),bal?'ok':'bad',bal?'✓ متوازن':'⚠ غير متوازن')}${tbiKpi('حسابات برصيد',nz.toLocaleString('en-US'),'',`من ${acc.length.toLocaleString('en-US')}`)}</div>
  ${!bal&&UPL.sign.mode==='asis'&&D.rec!=='asis'?'<p class="note warn">الفرق غير صفري والتشخيص يقترح تعديل الاتجاه — جرّب الخيار المقترح.</p>':''}
  ${tbiFixHTML(acc,net,bal)}</div>
 <div class="card"><h3>٤) معاينة بعد تطبيق الإشارة <span class="mut small">(أول ${Math.min(12,acc.length)} من ${(UPL.raw.length-UPL.hr-1>0?UPL.raw.length-UPL.hr-1:0).toLocaleString('en-US')} صف)</span></h3>${warn}
  <div class="tw"><table><thead><tr><th>الكود</th><th>الحساب</th><th>أول المدة</th><th>مدين الفترة</th><th>دائن الفترة</th><th>آخر المدة — مدين</th><th>آخر المدة — دائن</th>${UPL.map.py!=null?'<th>السنة السابقة</th>':''}${UPL.map.bud!=null?'<th>الموازنة</th>':''}${hasCls?'<th>التبويب</th>':''}</tr></thead><tbody>${acc.slice(0,12).map(a=>{const c=hasCls?clsResolve({st:a.stmt,g:a.cgrp,u:a.sub,n:a.note}):null;return `<tr><td dir="ltr">${esc(a.code)}</td><td>${esc(a.name||a.nameEn)}</td><td class="num" dir="ltr">${tbiNum(a.ob)}</td><td class="num" dir="ltr">${tbiNum(a.mvDr)}</td><td class="num" dir="ltr">${tbiNum(a.mvCr)}</td><td class="num" dir="ltr">${a.cb>0?tbiNum(a.cb):''}</td><td class="num" dir="ltr">${a.cb<0?tbiNum(-a.cb):''}</td>${UPL.map.py!=null?`<td class="num" dir="ltr">${tbiNum(a.py)}</td>`:''}${UPL.map.bud!=null?`<td class="num" dir="ltr">${tbiNum(a.bud)}</td>`:''}${hasCls?`<td>${esc(c&&c.st?(CLS_ST_NAME[c.st]||'')+' / '+(c.g||''):'')}</td>`:''}</tr>`}).join('')}</tbody></table></div>
  ${acc.length>=2000?'<p class="mut small">المعاينة والمؤشرات محسوبة على أول 2000 صف؛ التقرير الكامل في خطوة التحقق.</p>':''}</div>
 <div class="tbi-bar"><button class="btn" type="button" data-act="uplval"${missing.length?' disabled':''}>التحقق من الميزان ←</button><button class="btn g" type="button" data-act="uplreset">إلغاء</button></div>`}
/* when the TB is out of balance: accounts whose side flip would close the gap exactly (|v| = |diff|/2), plus accounts of unknown nature */
function tbiFixHTML(acc,net,bal){const fl=new Set(UPL.sign.flip||[]);let h='';
 if(!bal){const half=Math.abs(net)/2;const cand=acc.filter(a=>Math.abs(Math.abs(a.cb)-half)<=1&&Math.abs(a.cb)>0.005).slice(0,6);
  if(cand.length)h+=`<div class="note warn"><b>اقتراح لسد الفرق:</b> نصف الفرق = <b dir="ltr">${tbiNum(half)}</b> يطابق رصيد ${cand.length>1?'الحسابات':'الحساب'} التالية — غالبًا اتجاهها معكوس:<ul class="l">${cand.map(a=>`<li><b dir="ltr">${esc(a.code)}</b> ${esc(a.name||a.nameEn)} (<span dir="ltr">${tbiNum(a.cb)}</span>) <button class="btn o sm" type="button" data-tbi-act="flipacc" data-code="${esc(a.code)}">اعكس اتجاهه</button></li>`).join('')}</ul></div>`}
 if(fl.size)h+=`<p class="small">حسابات عُكس اتجاهها يدويًا: ${[...fl].map(c=>`<span class="tbi-chip" dir="ltr">${esc(c)} <button class="btn g sm" type="button" data-tbi-act="unflip" data-code="${esc(c)}" aria-label="إلغاء">✕</button></span>`).join(' ')}</p>`;
 return h}
function tbiVal(){const V_=UPL.val;const t=V_.totals;const bal=Math.abs(t.net)<=1;
 const grp=(ttl,list,cls,ic)=>list.length?`<section class="tbi-iss ${cls}"><h4>${ic} ${ttl} <span class="cnt">${list.length}</span></h4><ul class="l">${list.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></section>`:'';
 return `${tbiStepper(2)}<div class="card"><h2 style="margin-top:0">تقرير التحقق</h2><p class="small mut">${t.accounts.toLocaleString('en-US')} حساب · ${UPL.valMs} ms · اتجاه الإشارة: ${esc((TBI_SIGN.find(x=>x[0]===UPL.sign.mode)||[0,''])[1])}</p>
 <div class="tbi-kpis">${tbiKpi('مجموع المدين',tbiNum(t.dr))}${tbiKpi('مجموع الدائن',tbiNum(t.cr))}${tbiKpi('الفرق',tbiNum(t.net),bal?'ok':'bad',bal?'✓ متوازن':'⚠ غير متوازن')}${tbiKpi('أول المدة (صافي)',tbiNum(t.obNet),Math.abs(t.obNet)<=1?'ok':'warn')}${tbiKpi('حركة مدين / دائن',tbiNum(t.mvDr)+' / '+tbiNum(t.mvCr))}</div>
 ${V_.errors.length?'':'<p class="note ok">✓ لا توجد أخطاء — الميزان جاهز للاعتماد.</p>'}${grp('أخطاء',V_.errors,'bad','⛔')}${grp('تنبيهات',V_.warnings,'warn','⚠')}${grp('معلومات',V_.info,'info','ℹ')}
 <div class="tbi-bar"><button class="btn" type="button" data-act="uplaccept">✓ اعتماد كإصدار جديد</button><button class="btn g" type="button" data-act="uplback">← رجوع للربط والإشارات</button><button class="btn d" type="button" data-act="uplreset">✕ رفض</button></div></div>`}
tbUploadHTML=function(){if(!can('edit'))return '<p class="note">رفع الميزان يتطلب صلاحية التعديل.</p>';
 if(UPL.step===0)return tbiUp();if(UPL.step===1||UPL.step===4)return tbiProc();if(UPL.step===2&&UPL.raw)return tbiMap();if(UPL.step===3&&UPL.val)return tbiVal();return tbiUp()};
BLOCKS.tbu=()=>tbUploadHTML();
document.addEventListener('change',e=>{const el=e.target;if(!(el instanceof Element)||!el.dataset||el.dataset.tbi!=='sign')return;UPL.sign.mode=el.value;UPL.sign.auto=false;refreshBlock('tbu')});
document.addEventListener('click',e=>{const b=e.target instanceof Element&&e.target.closest('[data-tbi-act]');if(!b)return;e.preventDefault();const a=b.dataset.tbiAct;if(a==='tpl-xlsx')tbiTemplate('xlsx');else if(a==='tpl-csv')tbiTemplate('csv');
 else if(a==='flipacc'||a==='unflip'){const c=b.dataset.code;const f=new Set(UPL.sign.flip||[]);if(a==='flipacc')f.add(c);else f.delete(c);UPL.sign.flip=[...f];UPL.sign.auto=false;refreshBlock('tbu')}});
