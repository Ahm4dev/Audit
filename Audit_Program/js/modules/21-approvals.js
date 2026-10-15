/* Audit-Plus · Approval chain, lock, inbox, assignment, comments, bulk actions */
'use strict';
/* ================= a12 · Approval chain (preparer → reviewer → partner → EQR), lock, inbox, assignment, threaded comments, bulk actions ================= */
const APS={NS:'لم يبدأ',PR:'أعدّها المعدّ',RV:'راجعها المراجع',PA:'اعتمدها الشريك',QR:'اعتمدها مراجع الجودة',RT:'مُعادة للتعديل'};
const APCLS={NS:'',PR:'M',RV:'M',PA:'ok',QR:'ok',RT:'bad'};
const eqrReq=()=>!!G('eng.eqr',false);
const apKey=o=>(o.t==='wp'?'wp.':'doc.')+o.id+'.ap';
/* worksheets: the sign-off boxes at the bottom of the page ARE the approval state (preparer → reviewer → partner);
   a partner signature locks the paper. Other documents keep the explicit approval chain. */
function apGet(o,st){st=st||CUR.eng;if(!st)return{st:'NS',hist:[]};
 if(o.t==='wp'){const so=s=>st.get(`wp.${o.id}.so.${s}`,null);return{st:so('part')?'PA':so('rev')?'RV':so('prep')?'PR':'NS',hist:[]}}
 const v=st.get(apKey(o),null);return v&&v.st?v:{st:'NS',hist:[]}}
function apFinal(o,st){const a=apGet(o,st);return o.t==='wp'?a.st==='PA':a.st==='QR'||(a.st==='PA'&&!(st||CUR.eng).get('eng.eqr',false))}
/* keys that stay writable on a locked paper: approval state, comments, assignment, presence */
function keyLocked(k,st){st=st||CUR.eng;if(!st)return false;const m=/^(wp|doc)\.([^.]+)\.(.*)$/.exec(k);if(!m)return false;const rest=m[3];if(/^(ap|so\.|cm\.|as$|due$)/.test(rest))return false;return apFinal({t:m[1],id:m[2]},st)}
function apNext(o){const a=apGet(o);const s=a.st;const prep=(a.hist.find(h=>h.to==='PR')||{}).by;const acts=[];
 if((s==='NS'||s==='RT')&&can('edit'))acts.push(['PR','✓ اعتماد كمعدّ (Prepared)']);
 if(s==='PR'&&can('review'))acts.push(['RV','✓ اعتماد المراجعة (Reviewed)']);
 if(s==='RV'&&can('partner'))acts.push(['PA','✓ اعتماد الشريك (Partner approval)']);
 if(s==='PA'&&eqrReq()&&can('eqr'))acts.push(['QR','✓ اعتماد مراجعة الجودة (EQR)']);
 if(['PR','RV','PA'].includes(s)&&(can('review')||can('partner')||can('eqr'))&&!apFinal(o))acts.push(['RT','↩ إعادة للمعدّ مع ملاحظة']);
 if(apFinal(o)&&can('reopen'))acts.push(['RO','🔓 إعادة فتح (بمبرر)']);return{acts,prep}}
async function apMove(o,to){const a=apGet(o);const from=a.st;let note='';
 if(to==='RT'||to==='RO'){const r=await formDlg({title:to==='RT'?'إعادة للتعديل':'إعادة فتح ورقة معتمدة',html:`<label class="fl">${to==='RT'?'ملاحظات المراجعة المطلوب معالجتها':'مبرر إعادة الفتح (يُسجل في سجل التدقيق)'}<textarea class="ta" name="n" required></textarea></label>`,ok:to==='RT'?'إعادة':'إعادة فتح',onOk:async d=>{if(String(d.n||'').trim().length<5)throw new Error('الملاحظة مطلوبة.');return d.n.trim()}});if(!r)return false;note=r;if(to==='RO')to='RT'}
 const prep=(a.hist.find(h=>h.to==='PR')||{}).by;if(to==='RV'&&prep===SESSION.id&&SESSION.role!=='admin'){toast('الفصل بين المهام: لا يجوز لمعدّ الورقة اعتماد مراجعتها.','w',8000);return false}
 if(to==='PA'&&apGet(o).hist.some(h=>h.to==='RV'&&h.by===SESSION.id)&&SESSION.role!=='admin'&&SESSION.role!=='partner'){toast('اعتماد الشريك يجب أن يتم من مستخدم بدور شريك.','w');return false}
 const h=a.hist.concat([{from,to,by:SESSION.id,t:Date.now(),note:note||undefined}]);CUR.eng.set(apKey(o),{st:to,hist:h},{label:'مسار الاعتماد',sys:true});
 CUR.eng.set('doc.'+o.id+'.st',{PR:'RV',RV:'RV',PA:'FN',QR:'FN',RT:'DR'}[to]||'DR',{noUndo:true,sys:true});
 audit('approval',{obj:o.t+':'+o.id,from,to,note:note||undefined});toast(`${TPLM[o.id]?TPLM[o.id].ar:o.id}: ${APS[to]}`+(apFinal(o)?' — مقفلة الآن':''),'s');return true}
function apHTML(o){const a=apGet(o);const {acts}=apNext(o);const fin=apFinal(o);const steps=['PR','RV','PA'].concat(eqrReq()?['QR']:[]);const reached=s=>a.hist.some(h=>h.to===s)&&!(a.st==='RT');
 const last=s=>{const h=[...a.hist].reverse().find(x=>x.to===s);return h?`${esc(USERS.nameOf(h.by))} · ${fmtDT(h.t)}`:''};
 return `<div class="card apbox${fin?' locked':''}"><h3 style="margin-top:0">مسار الاعتماد ${fin?'<span class="b ok">🔒 معتمدة ومقفلة</span>':`<span class="b ${APCLS[a.st]}">${esc(APS[a.st])}</span>`}</h3>
 <ol class="apsteps">${steps.map(s=>`<li class="${a.st===s||reached(s)?'done':''}${a.st===s?' cur':''}"><b>${esc({PR:'المعدّ',RV:'المراجع',PA:'الشريك',QR:'مراجع الجودة'}[s])}</b><br><span class="small mut">${last(s)}</span></li>`).join('')}</ol>
 ${acts.length?`<div class="row noprint">${acts.map(x=>`<button class="btn ${x[0]==='RT'||x[0]==='RO'?'g':''} sm" type="button" data-act="apmove" data-t="${o.t}" data-id="${esc(o.id)}" data-to="${x[0]}">${esc(x[1])}</button>`).join('')}</div>`:''}
 ${a.hist.length?`<details class="nt"><summary>سجل الاعتماد (${a.hist.length})</summary><ul class="lkl">${a.hist.slice().reverse().map(h=>`<li>${fmtDT(h.t)} — ${esc(USERS.nameOf(h.by))}: ${esc(APS[h.from]||h.from)} ← ${esc(APS[h.to])}${h.note?` — «${esc(h.note)}»`:''}</li>`).join('')}</ul></details>`:''}
 ${o.t==='wp'?`<div class="fgrid noprint"><label>تاريخ الاستحقاق<input class="in" type="date" data-k="wp.${esc(o.id)}.due" value="${esc(G('wp.'+o.id+'.due',''))}"${can('review')?'':' readonly'}></label><label>المسند إليه<select class="sel" data-k="wp.${esc(o.id)}.as" data-dv="" aria-label="المسند إليه"${can('review')?'':' disabled'}><option value="">—</option>${USERS.active().map(u=>`<option value="${u.id}"${G('wp.'+o.id+'.as','')===u.id?' selected':''}>${esc(USERS.nameOf(u.id))} (${esc(ROLEN(u.role))})</option>`).join('')}</select></label></div>`:''}</div>`}
/* ---------- inbox: computed from approval state (works across users through the shared op logs) ---------- */
function inboxItems(){const me=SESSION.id;const out={wait:[],ret:[],asg:[],feed:[]};const objs=[];for(const [k,v] of CUR.eng.entries('')){const m=/^(wp|doc)\.([^.]+)\.ap$/.exec(k);if(m&&v&&v.st)objs.push({t:m[1],id:m[2],a:v})}
 for(const [k,v] of CUR.eng.entries('wp.')){const m=/^wp\.([^.]+)\.as$/.exec(k);if(m&&v===me&&!apFinal({t:'wp',id:m[1]}))out.asg.push({t:'wp',id:m[1],a:apGet({t:'wp',id:m[1]})})}
 for(const o of objs){const s=o.a.st;const prep=(o.a.hist.find(h=>h.to==='PR')||{}).by;
  if((s==='PR'&&can('review')&&prep!==me)||(s==='RV'&&can('partner'))||(s==='PA'&&eqrReq()&&can('eqr')))out.wait.push(o);
  if(s==='RT'&&(prep===me||G((o.t==='wp'?'wp.':'doc.')+o.id+'.as','')===me))out.ret.push(o);
  for(const h of o.a.hist)if(h.by!==me&&(prep===me||G('wp.'+o.id+'.as','')===me||h.to==='RT'))out.feed.push(Object.assign({o},h))}
 out.feed.sort((a,b)=>b.t-a.t);out.feed=out.feed.slice(0,40);return out}
const objLink=o=>o.t==='wp'?`<a href="${L('wp/'+encodeURIComponent(o.id))}">${esc(o.id)} ${esc(WP[o.id]?WP[o.id].ar:'')}</a>`:`<a href="${L('form/'+encodeURIComponent(o.id))}">${esc(TPLM[o.id]?TPLM[o.id].ar:o.id)}</a>`;
V.inbox=function(){const I=inboxItems();const li=(arr,empty)=>arr.length?`<ul class="lkl">${arr.map(o=>`<li>${objLink(o)} <span class="b ${APCLS[o.a.st]}">${esc(APS[o.a.st])}</span> <span class="mut small">${(()=>{const h=o.a.hist[o.a.hist.length-1];return h?esc(USERS.nameOf(h.by))+' · '+fmtDT(h.t)+(h.note?' — «'+esc(h.note)+'»':''):''})()}</span></li>`).join('')}</ul>`:`<p class="mut">${empty}</p>`;
 return `<h1>📥 بانتظار مراجعتي والإشعارات</h1><p class="sub">دورك: ${esc(ROLEN(SESSION.role))}${eqrReq()?' · مراجعة جودة الارتباط مطلوبة':''}</p>
 ${can('partner')||can('eqr')||can('review')?`<label class="row noprint"><input type="checkbox" data-k="eng.eqr"${eqrReq()?' checked':''}${can('partner')?'':' disabled'}> هذا الارتباط يتطلب مراجعة جودة (EQR — ISQM 2)</label>`:''}
 <h2>بانتظار مراجعتي / اعتمادي <span class="cnt">${I.wait.length}</span></h2>${li(I.wait,'لا يوجد ما ينتظر اعتمادك.')}
 <h2>مُعادة إليّ للتعديل <span class="cnt">${I.ret.length}</span></h2>${li(I.ret,'لا توجد أوراق معادة.')}
 <h2>مسندة إليّ <span class="cnt">${I.asg.length}</span></h2>${li(I.asg,'لا توجد أوراق مسندة إليك.')}
 <h2>آخر الأحداث</h2>${I.feed.length?`<ul class="lkl">${I.feed.map(h=>`<li>${fmtDT(h.t)} — ${esc(USERS.nameOf(h.by))}: ${objLink(h.o)} ${esc(APS[h.from]||'')} ← ${esc(APS[h.to])}${h.note?' — «'+esc(h.note)+'»':''}</li>`).join('')}</ul>`:'<p class="mut">لا توجد أحداث.</p>'}`};
function inboxCount(){if(!CUR.eng||!SESSION)return 0;const I=inboxItems();return I.wait.length+I.ret.length}
let INBOX_LAST=-1;function inboxBadge(){const b=$('#inboxBtn');if(!b)return;const n=CUR.eng?inboxCount():0;b.hidden=!CUR.eng;const c=b.querySelector('.cnt');if(c){c.textContent=n;c.hidden=!n}b.setAttribute('aria-label','بانتظار مراجعتي: '+n);
 if(INBOX_LAST>-1&&n>INBOX_LAST)toast(`لديك ${n} عنصر بانتظار الإجراء.`,'i',6000,{label:'فتح',fn:()=>{location.hash=L('inbox')}});INBOX_LAST=n}
/* ---------- threaded comments on working papers ---------- */
function cmList(ref){const pre='wp.'+ref+'.cm.';const out=[];for(const [k,v] of CUR.eng.entries(pre)){const id=k.slice(pre.length);if(id.includes('.')||!v||v.del)continue;out.push(Object.assign({id},v))}return out.sort((a,b)=>a.t-b.t)}
function cmHTML(ref){const all=cmList(ref);const kids=p=>all.filter(c=>(c.p||null)===p);const ed=SESSION&&(can('edit')||can('review')||can('eqr'));
 const one=c=>`<li class="cm${c.res?' res':''}"><div class="cmh"><b>${esc(USERS.nameOf(c.by))}</b> <span class="mut small">${fmtDT(c.t)}</span>${c.res?' <span class="b ok">محلول</span>':''}</div><div class="cmt">${esc(c.tx)}</div>
  <div class="row noprint">${ed?`<button class="lnk" type="button" data-act="cmreply" data-ref="${esc(ref)}" data-id="${esc(c.id)}">ردّ</button>`:''}${ed&&!c.p?`<button class="lnk" type="button" data-act="cmres" data-ref="${esc(ref)}" data-id="${esc(c.id)}">${c.res?'إعادة فتح':'وضع علامة محلول'}</button>`:''}${c.by===SESSION.id?`<button class="lnk" type="button" data-act="cmdel" data-ref="${esc(ref)}" data-id="${esc(c.id)}">حذف</button>`:''}</div>
  ${kids(c.id).length?`<ul class="cms">${kids(c.id).map(one).join('')}</ul>`:''}</li>`;
 const roots=kids(null);return `<ul class="cms">${roots.map(one).join('')||'<li class="mut">لا توجد تعليقات.</li>'}</ul>${ed?`<form class="noprint fgrid" data-form="cm" data-ref="${esc(ref)}"><label class="full">تعليق جديد<textarea class="ta" name="tx" required placeholder="اكتب تعليقًا…"></textarea></label><div><button class="btn sm" type="submit">إضافة تعليق</button></div></form>`:''}`}
BLOCKS.cm=ref=>cmHTML(ref);
BLOCKS.ap=a=>{const i=a.indexOf(':');return apHTML({t:a.slice(0,i),id:a.slice(i+1)})};
function cmAdd(ref,tx,parent){tx=String(tx||'').trim();if(!tx)return;CUR.eng.set(`wp.${ref}.cm.${uid('c')}`,{p:parent||null,tx,by:SESSION.id,t:Date.now(),res:false},{label:'تعليق'});refreshBlock('cm|'+ref)}
/* ---------- bulk actions in the working-paper library ---------- */
const BULK=new Set();
function bulkBarHTML(){return `<div class="card noprint bulkbar"${BULK.size?'':' hidden'} data-bulkbar><b data-bulkn>${BULK.size}</b> ورقة محددة · <label>الحالة<select class="sel" data-bulk="wf"><option value="">—</option>${WF.filter(w=>can('review')||!['RV','CL','FN'].includes(w[0])).map(w=>`<option value="${w[0]}">${esc(w[1])}</option>`).join('')}</select></label>${can('review')?`<label>إسناد إلى<select class="sel" data-bulk="as"><option value="">—</option>${USERS.active().map(u=>`<option value="${u.id}">${esc(USERS.nameOf(u.id))}</option>`).join('')}</select></label>`:''}<button class="btn sm" type="button" data-act="bulkapply">تطبيق</button><button class="btn g sm" type="button" data-act="bulkclr">إلغاء التحديد</button></div>`}
async function bulkApply(){const wf=($('[data-bulk=wf]')||{}).value,as=($('[data-bulk=as]')||{}).value;if(!wf&&!as){toast('اختر حالة أو مستخدمًا.','w');return}const o={};let skipped=0;
 for(const ref of BULK){if(apFinal({t:'wp',id:ref})){skipped++;continue}if(wf)o['wp.'+ref+'.wf']=wf;if(as)o['wp.'+ref+'.as']=as}const n=CUR.eng.setMany(o,{label:'إجراء جماعي'});audit('bulk',{n:BULK.size,wf,as});toast(`تم التطبيق على ${BULK.size-skipped} ورقة${skipped?` (تُخطّيت ${skipped} معتمدة ومقفلة)`:''}.`,'s');BULK.clear();refreshBlock('wl')}
