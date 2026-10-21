/* Audit-Plus · v11.1 · Automatic preparation of the primary statements (SFP / P&L / cash flows) from the classified trial balance.
   Flow:  upload TB → (auto) classify unclassified accounts with the engine's High + Medium suggestions → statements appear in their working papers
          (D401 financial position · D402 profit or loss · D406 cash flows, plus D403/D404/D407/D405/D410) with no manual step.
   - Never overwrites a classification the user (or the TB file) already made: only accounts with NO classification are touched.
   - Medium-confidence results are remembered (fsp.auto) and listed for review; accounts with no confident suggestion stay visible on every statement page.
   - Skipped for read-only users / locked engagements. Every automatic run is written to the audit trail (fs.prepare) and is undoable. */
'use strict';
const FSP={busy:false,done:new Set()};

/* ---------- status of the preparation (cached per data version) ---------- */
function fsPrepStatus(){return vcache('fsps:'+TBSTORE.ver+':'+CLSV+':'+TBMV,()=>{const rows=TBSTORE.rows;let cls=0;const un=[];
 for(const r of rows){if(clsOf(r.code))cls++;else un.push(r)}
 const total=rows.length;const auto=CUR.eng?CUR.eng.get('fsp.auto',null):null;
 return{total,cls,un,pct:total?Math.round(cls/total*100):0,review:auto?Object.keys(auto).filter(c=>auto[c]==='M'&&clsOf(c)).length:0}})}

/* ---------- the preparation itself ---------- */
async function fsPrepare(o){o=o||{};if(!TBSTORE.ready()||!CUR.eng||RO()||FSP.busy)return null;FSP.busy=true;
 try{await clsLoadCompany();
  const un=TBSTORE.rows.filter(r=>!clsOf(r.code));const put={},med={};let h=0,m=0,left=0;
  await CSUG.each(un,(r,s)=>{if(s&&(s.conf==='H'||s.conf==='M')){put['tbc.'+tbk(r.code)]=[s.st,s.g,s.u,s.n];if(s.conf==='H')h++;else{m++;med[r.code]='M'}}else left++});
  const n=h+m;
  if(n){clsApply(put,'إعداد القوائم المالية آليًا من الميزان');
   if(m){const prev=CUR.eng.get('fsp.auto',null)||{};CUR.eng.set('fsp.auto',Object.assign({},prev,med),{noUndo:true})}
   audit('fs.prepare',{n,h,m,left,auto:!!o.auto,v:TBSTORE.ver})}
  return{n,h,m,left,total:TBSTORE.rows.length}}
 finally{FSP.busy=false}}
function fsAnnounce(r,manual){if(!r)return;
 if(!r.n){if(manual)toast(r.left?`لا يوجد اقتراح بثقة كافية لـ ${r.left.toLocaleString('en-US')} حساب — أكملها من «التبويب».`:'كل حسابات الميزان مبوّبة — القوائم محدَّثة.','i');return}
 toast(`أُعدّت القوائم المالية من الميزان: تبويب ${r.n.toLocaleString('en-US')} حساب${r.m?` (منها ${r.m.toLocaleString('en-US')} بثقة متوسطة — راجعها)`:''}${r.left?` · ${r.left.toLocaleString('en-US')} حساب يحتاج تبويبًا يدويًا`:''}.`,'s',12000,{label:'فتح قائمة المركز المالي',fn:()=>{location.hash=L('wp/D401')}})}

/* run automatically right after a trial balance version is accepted */
(function(){const o=uplAccept;uplAccept=async function(){const before=TBSTORE.active();const r=await o.apply(this,arguments);
 try{const v=TBSTORE.active();if(v&&v!==before&&TBSTORE.ready()){FSP.done.add(CUR.eng.path+'|'+v);const res=await fsPrepare({auto:true});fsAnnounce(res);if(res&&res.n)UI.refreshView()}}catch(e){logErr('fs auto-prepare',e)}
 return r}})();
/* …and once when a statement page is opened for a trial balance that has no classification at all (e.g. uploaded before this feature existed) */
function fsAutoOnce(){try{if(!TBSTORE.ready()||RO()||FSP.busy||!CUR.eng)return;const k=CUR.eng.path+'|'+TBSTORE.ver;if(FSP.done.has(k))return;FSP.done.add(k);
 if(TBSTORE.rows.some(r=>clsOf(r.code)))return;
 fsPrepare({auto:true}).then(r=>{if(r&&r.n){fsAnnounce(r);UI.refreshView()}}).catch(e=>logErr('fs auto-once',e))}catch(e){logErr('fsAutoOnce',e)}}

/* ---------- UI: preparation bar on every statement page ---------- */
function fsPrepBar(){if(!TBSTORE.ready())return'';const S=fsPrepStatus();const ro=RO();
 return `<div class="fsprep noprint"><span>المصدر: <b>ميزان v${TBSTORE.ver}</b> · ${S.total.toLocaleString('en-US')} حساب</span><span>المبوَّب: <b dir="ltr">${S.cls.toLocaleString('en-US')} / ${S.total.toLocaleString('en-US')}</b> (${S.pct}%)</span>${S.review?`<span class="mut small">${S.review.toLocaleString('en-US')} حساب مبوَّب آليًا بثقة متوسطة — <a href="${L('tb/fs')}">راجعها</a></span>`:''}${ro?'':`<button class="btn sm" type="button" data-fsp="prep">${S.un.length?'⚙ إعداد القوائم من الميزان':'↻ تحديث القوائم'}</button>`}<a class="btn g sm" href="${L('tb/cls')}">🏷 مراجعة التبويب</a><a class="btn g sm" href="${L('tb/fs')}">📊 ملخص القوائم</a></div>`}
const fsPageHead_base=fsPageHead;
fsPageHead=function(it,ref,sub){fsAutoOnce();return fsPageHead_base(it,ref,sub)+fsPrepBar()};
/* accounts left out of the statements: absolute total, biggest items, and one-click acceptance of the engine's suggestion */
function fsUnList(list){const top=list.slice().sort((a,b)=>Math.abs(b.cb)-Math.abs(a.cb)).slice(0,10);const ro=RO();
 const rows=top.map(r=>{const s=CSUG.one(r.code);const sug=s?`${esc(CLS_ST_NAME[s.st]||'')} › ${esc(s.g)}${s.u?' › '+esc(s.u):''} <span class="mut small">(${{H:'عالية',M:'متوسطة',L:'منخفضة'}[s.conf]})</span>`:'<span class="mut">لا يوجد اقتراح — بوّبه من «التبويب»</span>';
  return `<tr><td class="ref">${esc(r.code)}</td><td class="tx">${esc(r.name||r.nameEn)}</td><td class="num" dir="ltr">${fm(r.cb)}</td><td>${sug}</td><td>${s&&!ro?`<button class="btn g sm" type="button" data-fsp="acc" data-code="${esc(r.code)}">قبول</button>`:''}</td></tr>`}).join('');
 return `<details class="card noprint fsunl" open><summary><b>أكبر الحسابات غير المبوَّبة</b> <span class="mut small">(${top.length} من ${list.length.toLocaleString('en-US')})</span></summary><div class="tw"><table><thead><tr><th>الكود</th><th>الحساب</th><th>الرصيد</th><th>الاقتراح</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></details>`}
fsUnNote=function(){const B=fsBuild();if(!B.ready||!B.un.length)return'';
 const nz=B.un.filter(r=>Math.abs(r.cb)>.005||Math.abs(r.py||0)>.005);if(!nz.length)return'';/* zero-balance accounts cannot change a statement */
 const s=nz.reduce((t,r)=>t+Math.abs(r.cb),0);
 return `<div class="note warn">⚠ ${nz.length.toLocaleString('en-US')} حسابًا برصيد غير مبوَّب (مجموع أرصدتها المطلقة <b dir="ltr">${fm(s)}</b>) خارج القوائم — ${RO()?'':'<button class="btn sm" type="button" data-fsp="prep">⚙ تبويب آلي</button> '}<a href="${L('tb/cls')}">أو أكمل التبويب يدويًا</a>.</div>${fsUnList(nz)}`};

/* ---------- UI: events ---------- */
document.addEventListener('click',async e=>{const b=e.target instanceof Element&&e.target.closest('[data-fsp]');if(!b||b.disabled)return;e.preventDefault();const a=b.dataset.fsp;
 try{if(a==='prep'){b.disabled=true;const r=await fsPrepare({});fsAnnounce(r,true);UI.refreshView()}
  else if(a==='acc'){const code=b.dataset.code,s=CSUG.one(code);if(s&&!RO()){clsApply({['tbc.'+tbk(code)]:[s.st,s.g,s.u,s.n]},'قبول اقتراح تبويب '+code);UI.refreshView()}}}
 catch(err){logErr('fsp action',err);toast('تعذر إعداد القوائم: '+errMsg(err),'e')}});

/* ---------- TB tab “📊 القوائم المالية”: one page that shows the three statements' status and links to their working papers ---------- */
(function(){const i=TBTABS.findIndex(x=>x[0]==='map');TBTABS.splice(i<0?TBTABS.length:i+1,0,['fs','📊 القوائم المالية'])})();
function fsAutoReview(){const a=CUR.eng.get('fsp.auto',null)||{};const rows=Object.keys(a).filter(c=>a[c]==='M'&&clsOf(c)&&TBSTORE.by.get(c)).map(c=>({r:TBSTORE.by.get(c),c:clsOf(c)})).sort((x,y)=>Math.abs(y.r.cb)-Math.abs(x.r.cb));
 if(!rows.length)return'';
 return `<details class="card fsunl"><summary><b>مبوَّبة آليًا بثقة متوسطة — راجعها</b> <span class="mut small">(${rows.length.toLocaleString('en-US')} حساب · الأكبر أولًا)</span></summary><div class="tw"><table><thead><tr><th>الكود</th><th>الحساب</th><th>الرصيد</th><th>التبويب المقترح</th></tr></thead><tbody>${rows.slice(0,25).map(x=>`<tr><td class="ref">${esc(x.r.code)}</td><td class="tx">${esc(x.r.name||x.r.nameEn)}</td><td class="num" dir="ltr">${fm(x.r.cb)}</td><td>${esc(CLS_ST_NAME[x.c.st]||'')} › ${esc(x.c.g)}${x.c.u?' › '+esc(x.c.u):''}</td></tr>`).join('')}</tbody></table></div><p class="small mut">لتعديل أي حساب افتح <a href="${L('tb/cls')}">التبويب</a>؛ أي تعديل ينعكس فورًا على القوائم.</p></details>`}
function tbFsHTML(){const S=fsPrepStatus();const ro=RO();const B=fsBuild();
 const kp=(l,v,c,sub)=>`<div class="tbi-kpi ${c||''}"><span>${l}</span><b dir="ltr">${v}</b>${sub?`<small>${sub}</small>`:''}</div>`;
 const bal=fsSFPbal(),pl=fsSt('PL'),cf=fsCFData();let ta=0,tel=0;
 for(const g of fsOrder('SFP')){const x=fsG('SFP',g).cy;if(FS_ASSET(g))ta+=x;else tel+=x}tel+=pl.cy+fsSt('OCI').cy+fsSt('EQ').cy;
 const rev=fsG('PL','الإيرادات'),opP=(typeof I18S!=='undefined'&&I18S.mode==='i18')?i18Model().opP:null;
 const cfOk=!!cf&&Math.abs(cf.diff)<=Math.max(1,fsM()*0.05);
 const card=(ref,title,rows,ok,msg)=>`<div class="fscard ${ok?'ok':'warn'}"><h3><a href="${L('wp/'+ref)}">${ref} — ${title}</a></h3>${rows.map(r=>`<div class="fsl"><span>${r[0]}</span><b dir="ltr">${r[1]}</b></div>`).join('')}<p class="small ${ok?'ok':'bad'}">${msg}</p><a class="btn sm" href="${L('wp/'+ref)}">فتح ورقة العمل ←</a></div>`;
 const un=S.un.filter(r=>Math.abs(r.cb)>.005||Math.abs(r.py||0)>.005);
 const ready=S.cls>0&&!un.length&&bal.ok;
 return tbHead('fs')+`<div class="note ${ready?'ok':'warn'}"><b>${ready?'✓ القوائم جاهزة':'⚠ القوائم تحتاج مراجعة'}</b> — تُولَّد القوائم المالية آليًا من الميزان بعد التبويب والتسويات، وتظهر في أوراق عملها مباشرةً. ${S.pct}% من الحسابات مبوَّبة${un.length?` و${un.length.toLocaleString('en-US')} حسابًا برصيد خارج القوائم`:''}.</div>
 <div class="row noprint" style="gap:8px;flex-wrap:wrap;margin:8px 0">${ro?'':`<button class="btn" type="button" data-fsp="prep">⚙ إعداد القوائم من الميزان (تبويب آلي للحسابات غير المبوَّبة)</button>`}<a class="btn g" href="${L('tb/cls')}">🏷 التبويب</a><a class="btn g" href="${L('tb/map')}">🔗 الربط</a></div>
 <div class="tbi-kpis">${kp('الحسابات',S.total.toLocaleString('en-US'))}${kp('المبوَّب',S.pct+'%',S.pct===100?'ok':'warn',S.cls.toLocaleString('en-US')+' / '+S.total.toLocaleString('en-US'))}${kp('اتزان المركز المالي',bal.ok?'✓':'✖',bal.ok?'ok':'bad',bal.txt)}${kp('السنة السابقة',B.hasPy?'متوفرة':'غير متوفرة',B.hasPy?'ok':'warn',B.hasPy?'':'لازمة للتدفقات والمقارنة')}</div>
 <div class="fscards">
 ${card('D401','قائمة المركز المالي',[['إجمالي الموجودات',fm(ta)],['إجمالي حقوق الملكية والمطلوبات',fm(tel)],['الفرق',fm(ta-tel)]],bal.ok,bal.ok?'✔ متزنة':'✖ غير متزنة — راجع التبويب والتسويات')}
 ${card('D402','قائمة الدخل (الأرباح أو الخسائر)',[['الإيرادات',fm(rev.cy)]].concat(opP?[['ربح (خسارة) التشغيل',fm(opP.cy)]]:[]).concat([['صافي ربح (خسارة) العام',fm(pl.cy)],['السنة السابقة',pl.py==null?'—':fm(pl.py)]]),S.cls>0,S.cls>0?'مولَّدة من البنود المبوَّبة':'لا حسابات مبوَّبة بعد')}
 ${card('D406','قائمة التدفقات النقدية',cf?[['صافي التشغيل',fm(cf.op)],['صافي الاستثمار',fm(cf.invI)],['صافي التمويل',fm(cf.finT)],['صافي التغير في النقدية',fm(cf.net)],['فروق غير مفسَّرة',fm(cf.diff)]]:[['الحالة','يلزم ميزان السنة السابقة']],cfOk,cf?(cfOk?'✔ مطابقة لحركة النقدية':'✖ فرق غير مفسَّر — راجع الحركات غير النقدية والتبويب'):'ارفع الميزان بعمود «السنة السابقة»')}
 </div>
 <p class="small noprint">أوراق أخرى مبنية على نفس البيانات: <a href="${L('wp/D403')}">D403 الدخل الشامل</a> · <a href="${L('wp/D404')}">D404 التغير في حقوق الملكية</a> · <a href="${L('wp/D407')}">D407 الإيضاحات</a> · <a href="${L('wp/D405')}">D405 المسودة</a> · <a href="${L('wp/D410')}">D410 النهائية</a></p>
 ${un.length?fsUnList(un):''}${fsAutoReview()}`}
(function(){const o=V.tb;V.tb=function(arg){arg=arg||'';if(arg==='fs'&&TBSTORE.ready()&&!TBSTORE.loading&&!TBSTORE.stale())return tbFsHTML();return o.call(this,arg)}})();
/* the classification tab itself: a pointer to where the result shows up */
(function(){const o=clsHTML;clsHTML=function(){const r=o.apply(this,arguments);if(!TBSTORE.ready())return r;
 return `<div class="fsprep noprint"><span>🔗 كل ما تبوّبه هنا يظهر فورًا في:</span><a href="${L('wp/D401')}">D401 المركز المالي</a><a href="${L('wp/D402')}">D402 الدخل</a><a href="${L('wp/D406')}">D406 التدفقات</a><a class="btn g sm" href="${L('tb/fs')}">📊 ملخص القوائم</a></div>`+r}})();

/* English phrases for the runtime translation layer */
Object.assign(I18N_EN,{
"أُعدّت القوائم المالية من الميزان":"Financial statements prepared from the trial balance",
"فتح قائمة المركز المالي":"Open statement of financial position",
"إعداد القوائم من الميزان":"Prepare statements from TB",
"تحديث القوائم":"Refresh statements",
"مراجعة التبويب":"Review classification",
"ملخص القوائم":"Statements summary",
"القوائم المالية":"Financial statements",
"المبوَّب":"Classified",
"المصدر":"Source",
"حسابًا برصيد غير مبوَّب":"accounts with unclassified balances",
"تبويب آلي":"Auto-classify",
"أو أكمل التبويب يدويًا":"or complete the classification manually",
"أكبر الحسابات غير المبوَّبة":"Largest unclassified accounts",
"مبوَّبة آليًا بثقة متوسطة — راجعها":"Auto-classified with medium confidence — review",
"القوائم جاهزة":"Statements ready",
"القوائم تحتاج مراجعة":"Statements need review",
"اتزان المركز المالي":"Financial position balance",
"السنة السابقة":"Prior year",
"فتح ورقة العمل":"Open working paper",
"كل ما تبوّبه هنا يظهر فورًا في":"Everything you classify here shows immediately in",
"جارٍ تحميل ميزان المراجعة…":"Loading the trial balance…",
"تُولَّد القوائم المالية آليًا من الميزان بعد التبويب والتسويات، وتظهر في أوراق عملها مباشرةً.":"The financial statements are generated automatically from the trial balance after classification and adjustments, and appear in their working papers immediately.",
"من الحسابات مبوَّبة":"of accounts are classified",
"حساب مبوَّب آليًا بثقة متوسطة —":"accounts auto-classified with medium confidence —",
"حساب":"accounts","راجعها":"review them",
"إعداد القوائم من الميزان (تبويب آلي للحسابات غير المبوَّبة)":"Prepare statements from TB (auto-classify unclassified accounts)",
"المصدر: ":"Source: ","ميزان v":"Trial balance v","لتعديل أي حساب افتح":"To change an account open",
"التبويب":"classification","أي تعديل ينعكس فورًا على القوائم.":"any change is reflected immediately in the statements.",
"أوراق أخرى مبنية على نفس البيانات:":"Other papers built on the same data:",
"لا يوجد اقتراح — بوّبه من «التبويب»":"No suggestion — classify it in the Classification tab"});
