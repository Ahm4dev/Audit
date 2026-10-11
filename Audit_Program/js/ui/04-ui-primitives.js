/* MEAP · UI primitives: toasts, dialogs, table fitting, shell, status */
'use strict';
/* ================= a4 · UI primitives: toasts, in-page dialogs, table fitting, shell, status ================= */
function toast(msg,type,ms,action){const box=$('#toasts');if(!box)return;const el=document.createElement('div');el.className='toast '+(type||'');el.setAttribute('role',type==='e'?'alert':'status');
 el.innerHTML=`<span>${esc(msg)}${action?` <button class="lnk" data-ta>${esc(action.label)}</button>`:''}</span><button aria-label="${esc(t('close'))}" data-tx>×</button>`;
 el.querySelector('[data-tx]').onclick=()=>el.remove();if(action)el.querySelector('[data-ta]').onclick=()=>{el.remove();action.fn()};
 box.appendChild(el);while(box.children.length>4)box.firstChild.remove();setTimeout(()=>el.remove(),ms||(type==='e'?10000:type==='w'?7000:4500))}

/* In-page dialog: absolutely positioned inside the document, grows with its content and moves with the page scroll
   (no fixed height, no internal scrollbar). */
let DLG=null;
function openDlg(html,o){o=o||{};closeDlg();const root=$('#dlg');const bk=document.createElement('div');bk.className='dlg-bk';
 const box=document.createElement('div');box.className='dlg';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');if(o.label)box.setAttribute('aria-label',o.label);
 box.style.top=(window.scrollY+Math.max(10,Math.min(60,innerHeight*.06)))+'px';box.innerHTML=html;root.append(bk,box);
 DLG={box,bk,prev:document.activeElement,onClose:o.onClose};bk.addEventListener('click',()=>closeDlg());
 box.querySelectorAll('textarea').forEach(autogrow);fitTables(box);
 const f=box.querySelector('[autofocus]')||box.querySelector('input:not([type=hidden]),select,textarea,button');f&&f.focus({preventScroll:true});return box}
function closeDlg(v){if(!DLG)return;const d=DLG;DLG=null;d.box.remove();d.bk.remove();try{d.onClose&&d.onClose(v)}catch(e){logErr('a4_ui:16 d.onClose&&d.onClose(v)',e)}if(d.prev&&d.prev.focus&&document.contains(d.prev))d.prev.focus({preventScroll:true})}
function ask(o){return new Promise(res=>{let done=false;const fin=v=>{if(!done){done=true;res(v)}};
 const box=openDlg(`<h2>${esc(o.title)}</h2><div>${o.body||''}</div>${o.input?`<label class="fl" style="margin-top:.6rem">${esc(o.input.label)}<input class="in" data-ask autocomplete="off"></label>`:''}<p class="mut small" data-err></p><div class="acts"><button type="button" class="btn g" data-x="0">${esc(o.cancel||t('cancel'))}</button><button type="button" class="btn ${o.danger?'d':''}" data-x="1">${esc(o.ok||t('confirm'))}</button></div>`,{label:o.title,onClose:v=>fin(v||false)});
 box.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b)return;if(b.dataset.x!=='1'){closeDlg(false);return}
  if(o.input){const v=box.querySelector('[data-ask]').value;if(o.input.must&&v.trim()!==o.input.must){box.querySelector('[data-err]').textContent='النص غير مطابق.';return}closeDlg(v||true)}else closeDlg(true)})})}
/* Form dialog: onOk(data) may throw → error is shown inside the dialog and it stays open */
function formDlg(o){return new Promise(res=>{let done=false;const fin=v=>{if(!done){done=true;res(v)}};
 const box=openDlg(`<form data-dlgf novalidate><h2>${esc(o.title)}</h2>${o.html}<p class="note bad" data-err hidden></p><div class="acts"><button type="button" class="btn g" data-x>${esc(t('cancel'))}</button><button class="btn ${o.danger?'d':''}" type="submit">${esc(o.ok||t('save'))}</button></div></form>`,{label:o.title,onClose:v=>fin(v||null)});
 box.querySelector('[data-x]').onclick=()=>closeDlg(null);
 box.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const f=e.target;const data=Object.fromEntries(new FormData(f));$$('input[type=checkbox]',f).forEach(c=>{data[c.name]=c.checked});
  const btn=f.querySelector('[type=submit]');btn.disabled=true;const err=f.querySelector('[data-err]');err.hidden=true;
  try{const r=o.onOk?await o.onOk(data,f):data;closeDlg(r===undefined?data:r)}catch(x){err.textContent=errMsg(x);err.hidden=false;btn.disabled=false}});
 o.after&&o.after(box)})}

/* Tables: label every cell (for card mode) and stack the table into cards whenever it cannot fit its container. */
function labelTable(tb){const hr=tb.tHead&&tb.tHead.rows[tb.tHead.rows.length-1];if(!hr)return;const labels=[];for(const th of hr.cells){const span=th.colSpan||1;for(let i=0;i<span;i++)labels.push(th.textContent.trim())}
 for(const sec of [...tb.tBodies,tb.tFoot].filter(Boolean))for(const tr of sec.rows){let i=0;for(const c of tr.cells){if(!c.hasAttribute('data-label'))c.setAttribute('data-label',labels[i]||'');i+=c.colSpan||1}}}
function fitTables(root){root=root||document;const tabs=$$('.tw>table',root);tabs.forEach(labelTable);const vis=tabs.filter(tb=>tb.offsetParent!==null);
 vis.forEach(tb=>tb.classList.remove('stack'));
 const over=vis.filter(tb=>{const w=tb.parentElement.clientWidth;const tw=tb.getBoundingClientRect().width;if(tw>w+1)return true;const cols=tb.tHead&&tb.tHead.rows[0]?tb.tHead.rows[0].cells.length:0;
  if(cols>=4&&w/cols<78)return true;const tx=tb.querySelector('td.tx');return !!(tx&&tx.getBoundingClientRect().width<150&&cols>3)});
 over.forEach(tb=>tb.classList.add('stack'))}
let fitT=0;const refit=()=>{cancelAnimationFrame(fitT);fitT=requestAnimationFrame(()=>fitTables(document))};
const FS_OK=!!(window.CSS&&CSS.supports&&CSS.supports('field-sizing','content'));
function autogrow(el){if(FS_OK||!el||el.tagName!=='TEXTAREA')return;el.style.height='auto';el.style.height=(el.scrollHeight+2)+'px'}
const CE=(()=>{try{const d=document.createElement('div');d.contentEditable='plaintext-only';return d.contentEditable==='plaintext-only'?'plaintext-only':'true'}catch(e){return 'true'}})();

const UI={
 shell(){$('#app').innerHTML=`<header class="top" id="top">
  <button class="ib" id="menuBtn" type="button" data-act="menu" aria-expanded="false" aria-controls="nav" aria-label="${esc(t('menu'))}">☰</button>
  <a class="brand" href="#/">MEAP<small>البرنامج الرئيسي للمراجعة الخارجية · ISA</small></a>
  <form class="srch" id="sf" role="search"><label class="sr" for="q">${esc(t('search'))}</label><input id="q" type="search" autocomplete="off" enterkeyhint="search"></form>
  <div class="tools">
   <button class="ib" id="srchBtn" type="button" data-act="srch" aria-label="${esc(t('search'))}">🔍</button>
   <span class="save" id="saveSt" role="status" aria-live="polite"></span>
   <button class="ib" id="undoBtn" type="button" data-act="undo" title="${esc(t('undo'))} (Alt+Z)" aria-label="${esc(t('undo'))} (Alt+Z)" disabled>↶<span class="lbl">${esc(t('undo'))}</span></button>
   <button class="ib" id="inboxBtn" type="button" data-act="inbox" hidden>📥<span class="cnt" hidden>0</span></button>
   <button class="ib theme-btn" id="themeBtn" type="button" data-act="theme"></button>
   <button class="ib" type="button" data-act="print" title="طباعة الصفحة (A4)" aria-label="طباعة">🖨</button>
   <a class="ib" href="#/settings" title="${esc(t('settings'))}" aria-label="${esc(t('settings'))}">⚙<span class="lbl">${esc(t('settings'))}</span></a>
   <button class="ib" type="button" data-act="usermenu" id="userBtn" aria-label="${esc(SESSION.display)}">👤<span class="lbl">${esc(SESSION.display)}</span></button>
  </div></header>
 <nav class="etabs" id="etabs" aria-label="أقسام الارتباط" hidden></nav>
 <div class="layout" id="layout"><nav id="nav" aria-label="التنقل التفصيلي" hidden></nav><main id="main" tabindex="-1"></main></div>`;
  const ro=new ResizeObserver(()=>this.measure());ro.observe($('#top'));ro.observe($('#etabs'));this.saveState();this.undoState();applyPrefs()},
 measure(){const r=document.documentElement;const h=$('#top');if(h)r.style.setProperty('--hdr-h',h.offsetHeight+'px');const tb=$('#etabs');
  r.style.setProperty('--tabs-h',(tb&&!tb.hidden&&getComputedStyle(tb).position==='sticky'?tb.offsetHeight:0)+'px');
  const ly=$('#layout');r.classList.toggle('has-nav',!!(ly&&ly.classList.contains('has-nav')));const mb=$('#menuBtn');if(mb&&matchMedia('(min-width:800px)').matches)mb.setAttribute('aria-expanded',String(!r.classList.contains('nav-off')))},
 saveState(){const el=$('#saveSt');if(!el)return;const s=SAVER.state;el.className='save '+(s==='error'?'err':s==='saving'?'ing':'');
  if(s==='error'){el.innerHTML=`⚠ ${esc(t('saveFail'))} <button type="button" data-act="retry">${esc(t('retry'))}</button>`;el.title=SAVER.err}
  else if(s==='saving'){el.textContent='⏳ '+t('saving');el.title=''}
  else{el.textContent='✓ '+t('saved')+(SAVER.lastOk?' '+fmtT(SAVER.lastOk):'');el.title=STORE?(STORE.kind==='fs'?'المجلد: '+STORE.label:'تخزين المتصفح (IndexedDB)'):''}},
 undoState(){const b=$('#undoBtn');if(b)b.disabled=!UNDO.length},
 /* Remote/undo changes: update bound fields in place (keeps focus and scroll) */
 applyRemote(keys,conf,local){let structural=false;const ae=document.activeElement;
  for(const k of keys){const els=$$(`[data-k="${CSS.escape(k)}"]`);if(!els.length){if(/^(f|a|r|cwp|ref|ml|tbv|tbm)\.|^doc\.[^.]+\.(o|v)\.|^(wp|doc)\.[^.]+\.ap$|\.cm\.|\.(r|att|lk)\.|\.excluded$|\.so\./.test(k)||/\.att\.[^.]+$/.test(k))structural=true;continue}
   for(const el of els){if(el===ae&&!local)continue;bindValue(el,CUR.eng.get(k,null))}}
  if(typeof inboxBadge==='function')inboxBadge();
  if(structural){if(!$('#main').contains(ae)||ae===$('#main')||ae===document.body)this.refreshView();else toast('توجد تحديثات جديدة من مستخدمين آخرين.','i',8000,{label:'تحديث العرض',fn:()=>this.refreshView()})}
  for(const c of conf||[])toast(`تعارض في «${keyLabel(c.op.k)}»: عدّله ${USERS.nameOf(c.op.u)} الساعة ${fmtT(c.op.t)}. `+(c.kept==='theirs'?'اعتُمد تعديله لأنه الأحدث.':'احتُفظ بتعديلك لأنه الأحدث.'),'w',12000,c.kept==='theirs'&&CUR.eng.mine.get(c.op.k)?{label:'استعادة قيمتي',fn:()=>{CUR.eng.set(c.op.k,CUR.eng.mine.get(c.op.k).v);this.applyRemote(new Set([c.op.k]),[],true)}}:null)},
 refreshView(){const y=window.scrollY;route(true).then(()=>window.scrollTo(0,y))},
 presence(){const el=$('[data-pres]');if(el){const ref=el.dataset.pres;const ps=PRES.list.filter(p=>!ref||p.wp===ref);
  el.innerHTML=ps.length?`<span class="dot" aria-hidden="true"></span> ${esc(t('online'))}: `+ps.map(p=>esc(USERS.nameOf(p.u))+(p.u===SESSION.id?' (جهاز آخر)':'')).join('، '):''}},
 sessionEnded(){SYNC.stop();SESSION=null;toast('انتهت جلستك (تم تغيير كلمة المرور أو حذف الحساب). سجّل الدخول من جديد.','e',15000);setTimeout(()=>boot(),400)}};
function bindValue(el,v){if(el.tagName==='SELECT'){el.value=v==null?(el.dataset.dv||''):v;if(el.classList.contains('st'))el.className=el.className.replace(/\bst-\w+/g,'')+' st-'+el.value}
 else if(el.type==='checkbox')el.checked=!!v;else if(el.tagName==='TEXTAREA'||el.tagName==='INPUT'){el.value=v==null?'':v;autogrow(el)}
 else el.textContent=v==null?(el.dataset.dv||''):v}
