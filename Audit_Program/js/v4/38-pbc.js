/* MEAP · V4 · PBC (53_pbc) */
'use strict';
/* ===== 53_pbc.js ===== */
/* =====================================================================
   v4 · قائمة المتطلبات المبدئية للعميل (PBC) — شاملة وقابلة للتخصيص
   - البنود القياسية (PBC_CATS) تُعرض أو تُخفى حسب أسئلة النشاط (eng.app.*) ويمكن إظهارها/إخفاؤها يدويًا
   - إضافة فئات وبنود مخصصة، تعديل نص أي بند، حالة/مسؤول/تواريخ/مرجع (مع ربط بورقة عمل أو مرفق)
   ===================================================================== */
const PBC_ST=['لم يُطلب','تم الطلب','تم الاستلام','تم الاستلام جزئيًا','لا ينطبق'];
const pbcK=(ref,f,id)=>'pbc.'+ref+'.'+f+(id?'.'+id:'');
function pbcCats(ref){const cus=G(pbcK(ref,'cus'),[])||[],cc=G(pbcK(ref,'ccat'),[])||[];
 const cats=PBC_CATS.map(c=>({id:c.id,ar:c.ar,desc:c.desc,custom:false,items:c.items.map(i=>({...i,custom:false}))}));
 for(const c of cc)cats.push({id:c.id,ar:c.ar,desc:'فئة مخصصة',custom:true,items:[]});
 for(const x of cus){const c=cats.find(k=>k.id===x.cat);if(c)c.items.push({id:x.id,t:x.t,f:'',s:'',custom:true})}
 return cats}
function pbcApplies(ref,i){const o=G(pbcK(ref,'o',i.id),'');if(o==='y')return true;if(o==='n')return false;if(i.f&&G('eng.app.'+i.f,'')==='n')return false;return true}
function pbcStats(ref){let tot=0,req=0,rcv=0;for(const c of pbcCats(ref))for(const i of c.items){if(!pbcApplies(ref,i))continue;const st=G(pbcK(ref,'st',i.id),'')||'لم يُطلب';if(st==='لا ينطبق')continue;tot++;if(st!=='لم يُطلب')req++;if(st==='تم الاستلام')rcv++}return{tot,req,rcv}}
function pbcRow(ref,i,ro){const k=f=>pbcK(ref,f,i.id);const st=G(k('st'),'')||'لم يُطلب';const txt=G(k('t'),null);
 return `<tr data-pbci="${esc(i.id)}" data-st="${esc(st)}" class="pbcr st-${PBC_ST.indexOf(st)}">
 <td class="tx">${edc(k('t'),{dv:i.t,label:'نص البند'})}${i.s?`<div class="mut small">${esc(i.s)}</div>`:''}</td>
 <td><input class="in" data-k="${esc(k('ow'))}" value="${esc(G(k('ow'),''))}" aria-label="المسؤول لدى العميل" placeholder="المسؤول"${ro?' readonly':''}></td>
 <td><input class="in" dir="ltr" type="date" data-k="${esc(k('due'))}" value="${esc(G(k('due'),''))}" aria-label="تاريخ الاستحقاق"${ro?' readonly':''}></td>
 <td><select class="st" data-k="${esc(k('st'))}" data-dv="" data-pbcst="1" aria-label="الحالة"${ro?' disabled':''}>${PBC_ST.map(o=>`<option${st===o?' selected':''}>${o}</option>`).join('')}</select></td>
 <td><input class="in" dir="ltr" type="date" data-k="${esc(k('rcv'))}" value="${esc(G(k('rcv'),''))}" aria-label="تاريخ الاستلام"${ro?' readonly':''}></td>
 <td class="refc"><input class="in" data-k="${esc(k('nt'))}" value="${esc(G(k('nt'),''))}" placeholder="ملاحظة / مرجع" aria-label="ملاحظة"${ro?' readonly':''}><span class="refl" data-refk="${esc(k('nt')+'_r')}">${refChipHTML(G(k('nt')+'_r',null))}</span>${ro?'':`<button class="btn g sm noprint" type="button" data-v4act="refpick" data-rk="${esc(k('nt')+'_r')}" data-ref="${esc(ref)}" title="ربط بورقة عمل أو بمرفق" aria-label="ربط مرجع">🔗</button>`}</td>
 <td class="noprint">${ro?'':`<button class="btn g sm" type="button" data-v4act="${i.custom?'pbcdel':'pbchide'}" data-ref="${esc(ref)}" data-id="${esc(i.id)}" title="${i.custom?'حذف البند':'إخفاء البند (لا ينطبق)'}" aria-label="${i.custom?'حذف':'إخفاء'}">${i.custom?'✕':'🚫'}</button>`}</td></tr>`}
function pbcInner(ref){const ro=RO();const cats=pbcCats(ref);const S=pbcStats(ref);let h='';const head=`<thead><tr><th>البند المطلوب</th><th>المسؤول لدى العميل</th><th>الاستحقاق</th><th>الحالة</th><th>الاستلام</th><th>ملاحظة / مرجع</th><th class="noprint"></th></tr></thead>`;
 for(const c of cats){const ap=c.items.filter(i=>pbcApplies(ref,i)),na=c.items.filter(i=>!pbcApplies(ref,i));
  const rc=ap.filter(i=>G(pbcK(ref,'st',i.id),'')==='تم الاستلام').length;
  h+=`<section class="pbccat" data-pbccat="${esc(c.id)}"><h3>${esc(c.ar)} <span class="cnt">${rc}/${ap.length}</span>${c.custom&&!ro?` <button class="btn g sm noprint" type="button" data-v4act="pbcdelcat" data-ref="${esc(ref)}" data-id="${esc(c.id)}" aria-label="حذف الفئة">✕</button>`:''}</h3>${c.desc?`<p class="mut small">${esc(c.desc)}</p>`:''}
  ${ap.length?`<div class="tw"><table>${head}<tbody>${ap.map(i=>pbcRow(ref,i,ro)).join('')}</tbody></table></div>`:'<p class="mut small">لا بنود منطبقة في هذه الفئة.</p>'}
  ${ro?'':`<button class="btn o sm noprint" type="button" data-v4act="pbcadd" data-ref="${esc(ref)}" data-cat="${esc(c.id)}">+ إضافة بند</button>`}
  ${na.length?`<details class="nt noprint"><summary>بنود غير منطبقة/مخفية (${na.length})</summary><ul class="l">${na.map(i=>`<li>${esc(G(pbcK(ref,'t',i.id),i.t))} ${ro?'':`<button class="btn g sm" type="button" data-v4act="pbcshow" data-ref="${esc(ref)}" data-id="${esc(i.id)}">إظهار</button>`}${i.f&&G('eng.app.'+i.f,'')==='n'?' <span class="mut small">(مخفي لأن النشاط غير منطبق)</span>':''}</li>`).join('')}</ul></details>`:''}</section>`}
 return `<div class="pbcsum row"><span>إجمالي البنود المطلوبة: <b>${S.tot}</b></span><span>تم طلبها: <b>${S.req}</b></span><span>تم استلامها: <b>${S.rcv}</b></span><span>${S.tot?Math.round(S.rcv/S.tot*100):0}% مكتمل</span>${bar(S.tot?Math.round(S.rcv/S.tot*100):0)}</div>${h}`}
BLOCKS.pbc=ref=>pbcInner(ref);
const PBC_LETTER=`السادة / إدارة الشركة — تحية طيبة،
في إطار الاستعداد لمراجعة القوائم المالية للسنة المنتهية في [تاريخ القوائم]، نرجو التكرم بتزويدنا بالبنود الواردة بالقائمة أدناه (بصيغة Excel/PDF حسب الطبيعة) في المواعيد المحددة أمام كل بند، مع إفادتنا بأي بند لا ينطبق على المنشأة. وتفضلوا بقبول فائق الاحترام.`;
XP.pbc=(it,p,ref)=>{const ro=RO();const bn=!CUR.company?'':esc(CUR.company.name);
 return `<div class="note">القائمة تُرسل للعميل قبل بدء الفحص. البنود القياسية تُخفى تلقائيًا إذا حدّدت نشاطًا «غير منطبق» في <a href="${L('wp/SD-3')}">نموذج التحكم في الظهور</a>، ويمكنك إخفاء/إظهار أي بند، وتعديل نصه، وإضافة بنود وفئات خاصة بالعميل.</div>
 <h3>نص الخطاب المرافق</h3>${edc('pbc.'+ref+'.letter',{dv:PBC_LETTER,label:'نص الخطاب'})}
 <p class="row noprint">${ro?'':`<button class="btn o sm" type="button" data-v4act="pbcaddcat" data-ref="${esc(ref)}">+ فئة جديدة</button><button class="btn g sm" type="button" data-v4act="pbcreqall" data-ref="${esc(ref)}">تعليم كل غير المطلوب «تم الطلب» (تاريخ اليوم)</button>`}<select class="sel" data-v4act="pbcfilter" aria-label="تصفية بالحالة"><option value="">كل الحالات</option>${PBC_ST.map(o=>`<option>${o}</option>`).join('')}</select><input class="in" data-v4act="pbcq" placeholder="بحث في البنود…" aria-label="بحث"></p>
 <div data-block="pbc|${esc(ref)}">${pbcInner(ref)}</div>`};
function pbcFilterApply(root){const st=(root.querySelector('[data-v4act=pbcfilter]')||{}).value||'';const q=normAr((root.querySelector('[data-v4act=pbcq]')||{}).value||'');
 root.querySelectorAll('tr.pbcr').forEach(tr=>{const okS=!st||tr.dataset.st===st;const okQ=!q||normAr(tr.textContent).includes(q);tr.hidden=!(okS&&okQ)})}
document.addEventListener('input',e=>{const el=e.target;if(el instanceof Element&&el.dataset&&el.dataset.v4act==='pbcq')pbcFilterApply(document.querySelector('#main'))});
document.addEventListener('change',e=>{const el=e.target;if(!(el instanceof Element)||!el.dataset)return;
 if(el.dataset.v4act==='pbcfilter')pbcFilterApply(document.querySelector('#main'));
 if(el.dataset.pbcst){const tr=el.closest('tr');if(tr){tr.dataset.st=el.value;tr.className='pbcr st-'+PBC_ST.indexOf(el.value);
   if(el.value==='تم الاستلام'){const m=el.dataset.k.replace(/\.st\./,'.rcv.');const inp=tr.querySelector('[data-k="'+m+'"]');if(inp&&!inp.value){const d=new Date().toISOString().slice(0,10);inp.value=d;CUR.eng.set(m,d,{label:'تاريخ استلام PBC'})}}
   const ref=el.dataset.k.split('.')[1];setTimeout(()=>refreshBlock('pbc|'+ref),80)}}});
document.addEventListener('click',async e=>{const b=e.target instanceof Element&&e.target.closest('[data-v4act]');if(!b||RO())return;const a=b.dataset.v4act;if(!/^pbc/.test(a)||['pbcfilter','pbcq'].includes(a))return;const ref=b.dataset.ref;const re=()=>refreshBlock('pbc|'+ref);
 if(a==='pbchide'){CUR.eng.set(pbcK(ref,'o',b.dataset.id),'n',{label:'إخفاء بند PBC'});re()}
 else if(a==='pbcshow'){CUR.eng.set(pbcK(ref,'o',b.dataset.id),'y',{label:'إظهار بند PBC'});re()}
 else if(a==='pbcdel'){const cus=(G(pbcK(ref,'cus'),[])||[]).filter(x=>x.id!==b.dataset.id);CUR.eng.set(pbcK(ref,'cus'),cus,{label:'حذف بند PBC'});re()}
 else if(a==='pbcdelcat'){const id=b.dataset.id;if(!(await ask({title:'حذف الفئة',body:'تُحذف الفئة وبنودها المخصصة. متابعة؟',ok:'حذف',danger:true})))return;CUR.eng.set(pbcK(ref,'ccat'),(G(pbcK(ref,'ccat'),[])||[]).filter(x=>x.id!==id),{label:'حذف فئة PBC'});CUR.eng.set(pbcK(ref,'cus'),(G(pbcK(ref,'cus'),[])||[]).filter(x=>x.cat!==id),{label:'حذف بنود فئة'});re()}
 else if(a==='pbcadd'){const res=await formDlg({title:'إضافة بند مطلوب',html:`<label class="fl">نص البند<textarea class="in" name="t" rows="3" required></textarea></label>`,ok:'إضافة',onOk:async d=>{if(!String(d.t||'').trim())throw new Error('اكتب نص البند');return{t:String(d.t).trim()}}});if(!res)return;
  const cus=(G(pbcK(ref,'cus'),[])||[]).slice();cus.push({id:'u'+Date.now().toString(36),cat:b.dataset.cat,t:res.t});CUR.eng.set(pbcK(ref,'cus'),cus,{label:'إضافة بند PBC'});re()}
 else if(a==='pbcaddcat'){const res=await formDlg({title:'فئة جديدة',html:`<label class="fl">اسم الفئة<input class="in" name="t" required></label>`,ok:'إضافة',onOk:async d=>{if(!String(d.t||'').trim())throw new Error('اكتب اسم الفئة');return{t:String(d.t).trim()}}});if(!res)return;
  const cc=(G(pbcK(ref,'ccat'),[])||[]).slice();cc.push({id:'c'+Date.now().toString(36),ar:res.t});CUR.eng.set(pbcK(ref,'ccat'),cc,{label:'إضافة فئة PBC'});re()}
 else if(a==='pbcreqall'){const d=new Date().toISOString().slice(0,10);const o={};for(const c of pbcCats(ref))for(const i of c.items){if(!pbcApplies(ref,i))continue;if(!G(pbcK(ref,'st',i.id),''))o[pbcK(ref,'st',i.id)]='تم الطلب'}
  if(Object.keys(o).length)CUR.eng.setMany(o,{label:'تعليم بنود PBC كمطلوبة'});re()}});
