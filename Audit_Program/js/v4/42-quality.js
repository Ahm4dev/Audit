/* Audit-Plus · V4 · Quality (65_quality) */
'use strict';
/* ===== 65_quality.js ===== */
/* =====================================================================
   v4 · Quality layer
   1) duplicate-field sync, unique ids, auto aria-labels      2) shared helpers
   3) exceptions / misstatements / review notes inside the paper   4) one Excel export for a unified paper
   ===================================================================== */
function wpSheets(ref,st){const it=CT.items[ref];if(it&&it.area&&it.kind==='main'&&!st){const out=[];for(const r of CT.areaBy[it.area].items){if(ctOff(r)||!WP[r])continue;for(const s of wpSheets0(r)){out.push(Object.assign({},s,{name:(CT.items[r].disp+' '+s.name.replace(/^\S+\s/,'')).slice(0,31)}))}}return out}return wpSheets0(ref,st)}
/* ---------- 1) consistency ---------- */
const SYNC_LOCK={on:false};
function syncDup(el){if(SYNC_LOCK.on)return;const k=el.dataset&&el.dataset.k;if(!k)return;const main=document.querySelector('#main');if(!main)return;SYNC_LOCK.on=true;try{
 main.querySelectorAll('[data-k]').forEach(o=>{if(o===el||o.dataset.k!==k||o.tagName==='OPTION')return;if(o.matches('input[type=checkbox]'))o.checked=el.checked;else if(o.matches('input,select,textarea'))o.value=el.value;else if(o.isContentEditable||o.classList.contains('ed'))o.textContent=el.textContent})}finally{SYNC_LOCK.on=false}}
document.addEventListener('input',e=>{if(e.target instanceof Element)syncDup(e.target)});
document.addEventListener('change',e=>{if(e.target instanceof Element)syncDup(e.target)});
function a11yFix(){const m=document.querySelector('#main');if(!m)return;const seen=new Map();m.querySelectorAll('[id]').forEach(e=>{const n=seen.get(e.id)||0;seen.set(e.id,n+1);if(n>0){const nid=e.id+'-'+n;e.id=nid}});
 m.querySelectorAll('input:not([type=hidden]):not([type=file]),select,textarea').forEach(e=>{if(e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')||e.closest('label')||(e.id&&m.querySelector('label[for="'+CSS.escape(e.id)+'"]')))return;
  let t='';const td=e.closest('td,th');if(td){const tr=td.parentElement;const table=td.closest('table');const idx=[...tr.children].indexOf(td);const th=table&&table.tHead&&table.tHead.rows[0]&&table.tHead.rows[0].cells[idx];t=(th?th.textContent:'')+' '+((tr.cells[0]&&tr.cells[0]!==td)?tr.cells[0].textContent:'')}
  else{const p=e.closest('div,p,li');t=p?p.textContent:''}
  t=t.replace(/\s+/g,' ').trim().slice(0,70);e.setAttribute('aria-label',t||e.name||e.dataset.k||'حقل')})}
function wplistGlobal(){try{let h=document.getElementById('wplist-g');if(!h){h=document.createElement('div');h.id='wplist-g';h.hidden=true;document.body.appendChild(h)}const n=Object.keys(WP).length;if(h.dataset.n!==String(n)){h.innerHTML=wpDatalist0();h.dataset.n=String(n)}}catch(e){}}
document.addEventListener('meap:routed',()=>{wplistGlobal();setTimeout(a11yFix,0)});
const UNRES=s=>['Open','Management Responded'].includes(s||'Open');
/* ---------- 3) exceptions block ---------- */
function excRecs(it){const a=it.area?CT.areaBy[it.area]:null;const R=a?a.items:[it.ref];const S=new Set(R);
 const f=recs(CUR.eng,'f').filter(x=>split(x.ref||'').some(y=>S.has(y))||(a&&x.acc&&a.lines.includes(x.acc)));
 const aj=recs(CUR.eng,'a').filter(x=>(a&&x.acc&&a.lines.includes(x.acc)));const rn=recs(CUR.eng,'r').filter(x=>split(x.ref||'').some(y=>S.has(y)||(CT.leg[y]&&S.has(CT.leg[y]))));return{f,aj,rn}}
function excHTML(ref){const it=CT.items[ref];if(!it)return'';const {f,aj,rn}=excRecs(it);const M=matState();
 const un=aj.filter(x=>x.adj!=='Adjusted').reduce((s,x)=>s+Math.abs(num(x.amt)),0);
 const sum=`<p class="mut small">استثناءات: <b>${f.length}</b> (${f.filter(x=>UNRES(x.status)).length} غير معالجة) · تسويات/تحريفات: <b>${aj.length}</b> · غير المعدَّل: <b dir="ltr">${fmtN(un)}</b>${M.pm?` مقابل أهمية الأداء <b dir="ltr">${fmtN(M.pm)}</b> ${un>M.pm?'<span class="b bad">يتجاوز PM</span>':un>M.ct?'<span class="b M">أعلى من حد التفاهة</span>':''}`:''} · ملاحظات مراجعة مفتوحة: <b>${rn.filter(x=>(x.status||'Open')!=='Cleared').length}</b></p>`;
 return sum+(f.length?logTables(f,[]):'<p class="mut">لا توجد استثناءات مسجلة لهذه الورقة.</p>')+(aj.length?'<h4>التسويات والتحريفات</h4>'+adjTable(aj):'')+(rn.length?'<h4>ملاحظات المراجعة</h4>'+rnTable(rn):'')}
BLOCKS.exc=ref=>excHTML(ref);
function excBlock(it){const a=it.area?CT.areaBy[it.area]:null;const acc=a?(a.lines.find(l=>AC[l])||''):'';
 return `<section class="wpsec" id="sec-exc-${esc(it.ref)}"><h2 class="wpsech">الاستثناءات والتحريفات وملاحظات المراجعة</h2><div data-block="exc|${esc(it.ref)}">${excHTML(it.ref)}</div>${can('edit')?`<details class="nt noprint"><summary>+ تسجيل استثناء جديد مرتبط بهذه الورقة</summary><div class="card">${findingForm(acc).replace('data-form="finding"','data-form="finding" data-excref="'+esc(it.ref)+'"').replace('name="ref"','name="ref" value="'+esc(it.ref)+'"')}</div></details>`:''}</section>`}
document.addEventListener('submit',e=>{const f=e.target;if(!(f instanceof Element)||!f.dataset.excref)return;const ref=f.dataset.excref;
 /* attach the paper reference to the newly created record, then refresh the block */
 setTimeout(()=>{const f2=recs(CUR.eng,'f').sort((p,q)=>(q.t||0)-(p.t||0))[0];if(f2&&!f2.ref)CUR.eng.set('f.'+f2.id+'.ref',ref,{noUndo:true,label:'ربط استثناء بالورقة'});refreshBlock('exc|'+ref);rdyLater()},350)},true);
