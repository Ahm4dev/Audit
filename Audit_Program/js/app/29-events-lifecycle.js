/* Audit-Plus · Events, keyboard, lifecycle, boot() */
'use strict';
/* ================= a7 · Events, keyboard, lifecycle, boot ================= */
const undoToast=msg=>toast(msg,'s',9000,{label:t('undo'),fn:()=>{undo();UI.refreshView()}});
const deb=(fn,ms)=>{let h;return(...a)=>{clearTimeout(h);h=setTimeout(()=>fn(...a),ms)}};
const docPrevD=deb(()=>{if(CUR.view==='form'&&$('[data-block^="docprev|"]'))refreshBlock('docprev|'+CUR.arg)},350);
const tbbD=deb(ref=>refreshTbBind(ref),400);
function liveRefresh(el){const k=el.dataset.k||'';const gm=/^wp\.([^.]+)\.g\.m\.v\./.exec(k);if(gm&&$(`[data-tbb="${CSS.escape(gm[1])}"]`))tbbD(gm[1]);if(!/^(doc|ml|mlp|eng|f|a)\./.test(k))return;if(el.closest('[data-block^="docprev|"]'))return;docPrevD()}
const fkD=deb(b=>refreshBlock(b),160);
const renderResD=deb(renderRes,220),wlD=deb(()=>refreshBlock('wl'),200),auD=deb(drawAudit,200);
function ceText(el){return el.innerText.replace(/\n$/,'')}
function blockOf(el){const b=el.closest('[data-block]');return b?b.dataset.block:null}

const tbqD=deb(()=>tbMountTable(),200);
document.addEventListener('input',e=>{const el=e.target;if(!(el instanceof Element))return;
 if(el.dataset.tbq==='q'){TBQ.q=el.value;tbqD();return}
 if(el.tagName==='TEXTAREA')autogrow(el);
 if(el.dataset.k&&CUR.eng&&!el.hasAttribute('readonly')){const v=el.isContentEditable?ceText(el):el.value;CUR.eng.set(el.dataset.k,v,{label:el.getAttribute('aria-label')||''});if(el.hasAttribute('data-calc'))calcAll(true);liveRefresh(el);return}
 if(el.dataset.fk){F[el.dataset.fk]=el.value;fkD(el.dataset.fkb);return}
 if(el.dataset.f!=null){F[el.dataset.f]=el.value;renderResD();return}
 if(el.id==='wq'){WK.q=el.value;wlD();return}
 if(el.id==='auq'){auD();return}
 if(el.hasAttribute('data-homeq')){HOMEQ=el.value;const q=el.value.toLowerCase().trim();$$('[data-co]').forEach(c=>{const arch=c.querySelector('.b.bad')&&!PREF.showArch;c.hidden=arch||(!!q&&!c.dataset.co.includes(q))});return}});
document.addEventListener('change',async e=>{const el=e.target;if(!(el instanceof Element))return;
 if(el.dataset.jefile!=null){const f=el.files[0];el.value='';if(f)jeStart(f);return}
 if(el.dataset.jemap){if(el.value==='')delete JUPL.map[el.dataset.jemap];else JUPL.map[el.dataset.jemap]=+el.value;return}
 if(el.dataset.jeopt){JUPL.opt[el.dataset.jeopt]=el.value;return}
 if(el.dataset.psel){if(el.checked)PBULK.add(el.dataset.psel);else PBULK.delete(el.dataset.psel);const n=$('[data-pbn]');if(n)n.textContent=PBULK.size;return}
 if(el.hasAttribute('data-pselall')){$$('[data-psel]').forEach(c=>{c.checked=el.checked;if(el.checked)PBULK.add(c.dataset.psel);else PBULK.delete(c.dataset.psel)});const n=$('[data-pbn]');if(n)n.textContent=PBULK.size;return}
 if(el.dataset.ppk){PPK[el.dataset.ppk]=el.checked?1:0;return}
 if(el.dataset.bulksel){if(el.checked)BULK.add(el.dataset.bulksel);else BULK.delete(el.dataset.bulksel);const bb=$('[data-bulkbar]');if(bb){bb.hidden=!BULK.size;bb.querySelector('[data-bulkn]').textContent=BULK.size}return}
 if(el.dataset.tbq&&el.dataset.tbq!=='q'){TBQ[el.dataset.tbq]=el.type==='checkbox'?el.checked:el.value;tbMountTable();return}
 if(el.dataset.tbcol){const all=TBCOLS.map(c=>c.k);const cur=new Set(TBQ.cols||all);if(el.checked)cur.add(el.dataset.tbcol);else cur.delete(el.dataset.tbcol);TBQ.cols=all.filter(k=>cur.has(k));tbMountTable();return}
 if(el.dataset.tbmap!=null){CUR.eng.set('tbm.'+tbk(el.dataset.tbmap),el.value||'-',{label:'ربط حساب بالقوائم '+el.dataset.tbmap});TBMV++;saveCompanyMapD();TBSTORE.notify();return}
 if(el.dataset.tbmq){TBMQ[el.dataset.tbmq]=el.value;tbMountMap();return}
 if(el.dataset.tbfile!=null){const f=el.files[0];el.value='';if(f)uplStart(f);return}
 if(el.dataset.upl==='sheet'){await uplSheet(el.value);return}if(el.dataset.upl==='hr'){UPL.hr=Math.max(0,(+el.value||1)-1);const heads=(UPL.raw[UPL.hr]||[]).map(x=>String(x==null?'':x));UPL.map=detectMapping(heads,UPL.raw.slice(UPL.hr+1,UPL.hr+40));refreshBlock('tbu');return}
 if(el.dataset.uplmap){if(el.value==='')delete UPL.map[el.dataset.uplmap];else UPL.map[el.dataset.uplmap]=+el.value;refreshBlock('tbu');return}
 if(el.dataset.tbbindline){if(el.value){const b=G('wp.'+el.dataset.tbbindline+'.tb',null)||{};const L_=(b.lines||[]).slice();if(!L_.includes(el.value))L_.push(el.value);tbBindSet(el.dataset.tbbindline,{lines:L_})}return}
 if(el.dataset.tbbindadj){tbBindSet(el.dataset.tbbindadj,{adj:el.checked});return}
 if(el.dataset.k&&CUR.eng&&(el.tagName==='SELECT'||el.type==='checkbox')){const v=el.type==='checkbox'?el.checked:el.value;CUR.eng.set(el.dataset.k,v,{label:el.getAttribute('aria-label')||''});
  if(el.classList.contains('st'))el.className=el.className.replace(/\bst-\w+/g,'').trim()+' st-'+el.value;if(el.dataset.k==='eng.ind')F.ind=el.value;if(el.hasAttribute('data-calc'))calcAll(true);if(el.dataset.struct){const b=blockOf(el);if(b)refreshBlock(b)}liveRefresh(el);if(/^ml\.[^.]+\.(inc|cat|sev)$/.test(el.dataset.k))refreshBlock('mlm|'+CUR.arg);return}
 if(el.dataset.f!=null){F[el.dataset.f]=el.value;renderRes();return}
 if(el.id==='wsec'){WK.sec=el.value;refreshBlock('wl');return}if(el.id==='wwf'){WK.wf=el.value;refreshBlock('wl');return}if(el.id==='auu'){drawAudit();return}
 if(el.dataset.pref){PREF[el.dataset.pref]=el.dataset.pref==='font'?+el.value:el.value;savePrefs();applyPrefs();if(el.dataset.pref==='lang'){UI.shell();$('#q').placeholder=t('searchPh');route()}else{refit();UI.measure()}return}
 if(el.dataset.attpick){const f=[...el.files];el.value='';if(f.length)attAdd(el.dataset.attpick,f);return}
 if(el.hasAttribute('data-import')){const f=el.files[0];el.value='';if(f)importFile(f);return}
 const ac=el.dataset.actChange;
 if(ac==='rcm')location.hash=L('rcm'+(el.value?'/'+el.value:''));
 else if(ac==='showarch'){PREF.showArch=el.checked;savePrefs();route(true)}
 else if(ac==='urole'){try{await updateUser(el.dataset.id,{role:el.value});audit('user.role',{id:el.dataset.id,role:el.value});toast('تم تحديث الدور.','s')}catch(x){toast(errMsg(x),'e');route(true)}}});

document.addEventListener('focusout',e=>{const el=e.target;if(el instanceof Element&&el.dataset&&el.dataset.k&&SAVER.q.length)SAVER.kick(30)});
document.addEventListener('paste',e=>{const el=e.target;if(CE!=='true'||!(el instanceof Element)||!el.isContentEditable)return;e.preventDefault();const txt=(e.clipboardData||window.clipboardData).getData('text/plain');document.execCommand('insertText',false,txt)});
document.addEventListener('toggle',e=>{const d=e.target;if(!(d instanceof HTMLDetailsElement))return;if(d.open&&d.dataset.pp){const b=d.querySelector('[data-block]');if(b&&!b.childElementCount){b.innerHTML=ppHTML(d.dataset.pp);b.querySelectorAll('textarea').forEach(autogrow)}}if(d.open)fitTables(d);if(d.dataset.ng){PREF.nav[d.dataset.ng]=d.open;savePrefs();if(d.open)navFit(d)}},true);

document.addEventListener('submit',async e=>{const f=e.target;if(f.id==='sf'){e.preventDefault();const q=$('#q').value.trim();if(!q)return;location.hash=CUR.eng?L('search/'+encodeURIComponent(q)):'#/find/'+encodeURIComponent(q);return}
 const kind=f.dataset.form;if(!kind)return;e.preventDefault();const d=Object.fromEntries(new FormData(f));
 try{
 if(kind==='finding'){if(!String(d.desc||'').trim())return toast('الوصف مطلوب.','w');const acc=f.dataset.acc||d.acc||'';addRec('f',{desc:d.desc.trim(),acc,type:d.type,sev:d.sev,amt:d.amt,ref:d.ref});f.reset();$$('textarea',f).forEach(autogrow);refreshBlock(acc&&f.dataset.acc?'accfn|'+acc:'logs|f');toast('تمت إضافة الملاحظة.','s');f.querySelector('[name=desc]').focus()}
 else if(kind==='adj'){if(!String(d.desc||'').trim()||!d.amt)return toast('الوصف والمبلغ مطلوبان.','w');addRec('a',d);f.reset();refreshBlock('logs|a');toast('تمت إضافة التسوية.','s');f.querySelector('[name=desc]').focus()}
 else if(kind==='rn'){if(!String(d.note||'').trim())return toast('نص الملاحظة مطلوب.','w');addRec('r',{ref:d.ref,note:d.note.trim(),to:d.to});f.reset();$$('textarea',f).forEach(autogrow);refreshBlock('logs|r');toast('تمت إضافة ملاحظة المراجعة.','s')}
 else if(kind==='bkset'){await saveSettings({backup:{freq:d.freq,keep:Math.max(1,+d.keep||10)}});toast('تم حفظ إعدادات النسخ الاحتياطي.','s');return}
 else if(kind==='cm'){cmAdd(f.dataset.ref,d.tx);return}
 else if(kind==='pplink'){const id=f.dataset.id;const tos=split(String(d.to||'').toUpperCase().replace(/[،;]/g,' '));const bad=tos.filter(x=>!WP[x]);if(!tos.length)return;if(bad.length)return toast('أوراق غير موجودة: '+bad.join('، '),'w');const have=new Set((ppIndex().get(id)||{links:[]}).links.map(l=>l.to));let n=0;
  for(const to of tos){if(have.has(to))continue;CUR.eng.set(`pp.${id}.lk.${uid('l')}`,{to,type:d.type,note:d.note||'',by:SESSION.id,t:Date.now()},{label:'ربط إجراء بورقة عمل'});n++}
  refreshBlock('pp|'+id);ppRefreshSummary(id);toast(n?`تم ربط الإجراء بـ ${n} ورقة عمل.`:'الروابط موجودة بالفعل.','s')}
 else if(kind==='link'){const ref=f.dataset.ref,to=String(d.to||'').trim().toUpperCase();if(!WP[to])return toast('ورقة العمل المستهدفة غير موجودة: '+to,'w');if(to===ref)return toast('لا يمكن ربط الورقة بنفسها.','w');
  if(linkList(CUR.eng,ref).some(l=>l.to===to&&l.type===d.type))return toast('الرابط موجود بالفعل.','w');CUR.eng.set(`wp.${ref}.lk.${uid('l_')}`,{to,type:d.type,note:d.note||'',by:SESSION.id,t:Date.now()},{label:'رابط'});f.reset();refreshBlock('lk|'+ref);toast('تمت إضافة الرابط.','s')}
 else if(kind==='findall'){const q=String(d.q||'').trim();if(q)location.hash='#/find/'+encodeURIComponent(q)}
 else if(kind==='firm'){await saveSettings({firmName:d.firmName,poll:Math.max(3,Math.min(120,num(d.poll)||8))});toast('تم الحفظ.','s');SYNC.start()}
 else if(kind==='attach'){await saveSettings({attach:{maxMB:Math.max(1,num(d.maxMB)),maxFiles:Math.max(1,num(d.maxFiles)),types:String(d.types||'').toLowerCase().replace(/[^a-z0-9,]/g,'')}});toast('تم حفظ حدود المرفقات.','s');route(true)}
 else if(kind==='adduser'){await addUser({username:d.username,display:d.display,password:d.password,role:d.role});audit('user.create',{role:d.role});toast('تمت إضافة المستخدم.','s');route(true)}
 else if(kind==='export'){await exportJSON(d.scope,d.att==='on')}}
 catch(x){toast(errMsg(x),'e')}});

document.addEventListener('combo-pick',e=>{const tg=e.detail.target||'';if(tg.startsWith('bind:')){const ref=tg.slice(5);const b=G('wp.'+ref+'.tb',null)||{};const C_=(b.codes||[]).slice();if(!C_.includes(e.detail.code))C_.push(e.detail.code);tbBindSet(ref,{codes:C_})}else if(tg==='tbjump')location.hash=L('tb/acct:'+encodeURIComponent(e.detail.code))});
document.addEventListener('click',async e=>{const el=e.target instanceof Element?e.target:null;if(!el)return;
 if(el.closest('[data-closedlg]')){closeDlg();return}
 const vs=el.closest('[data-vt-sort]');if(vs){const k=vs.dataset.vtSort;if(CUR.view==='tb'&&!CUR.arg){TBQ.sort=TBQ.sort.k===k?{k,d:-TBQ.sort.d}:{k,d:1};tbMountTable();const nb=$(`[data-vt-sort="${k}"]`);nb&&nb.focus()}return}
 const sf=el.closest('[data-setf]');if(sf){const p=sf.dataset.setf.split(':');Object.keys(F).forEach(k=>{F[k]=''});F[p[0]]=p[1]}
 const j=el.closest('[data-jump]');if(j){e.preventDefault();const tg=j.dataset.jump==='main'?$('#main'):document.getElementById(j.dataset.jump);if(tg){tg.scrollIntoView({behavior:'smooth',block:'start'});tg.focus({preventScroll:true})}return}
 const b=el.closest('[data-act]');if(!b)return;const act=b.dataset.act;const id=b.dataset.id,ref=b.dataset.ref;
 try{switch(act){
 case 'menu':{if(matchMedia('(min-width:800px)').matches){const c=document.documentElement.classList.toggle('nav-off');try{localStorage.setItem('meap.navoff',c?'1':'0')}catch(e){}b.setAttribute('aria-expanded',String(!c));break}const o=document.body.classList.toggle('nav-open');b.setAttribute('aria-expanded',o);break}
 case 'srch':$('#top').classList.toggle('ss');$('#q').focus({preventScroll:true});break;
 case 'undo':undo();break;
 case 'print':window.print();break;
 case 'retry':SAVER.flush();break;
 case 'logout':await logout();break;
 case 'theme':cycleTheme();break;
 case 'reload':location.reload();break;
 case 'stRun':await SELFTEST.run();break;case 'stDl':if(SELFTEST.res)downloadBlob(new Blob([JSON.stringify(SELFTEST.res,null,1)],{type:'application/json'}),'Audit-Plus-selftest-'+today()+'.json');break;
 case 'pgmore':{const k=b.dataset.pg,st=+b.dataset.step||PSTEP;PAGER[k]=pgLimit(k,st)+st;if(k==='explorer')renderRes();else if(k==='audit')drawAudit();else if(k==='saudit')renderStoreAudit();else if(k==='find')runFind(parseHash().slice(1).join('/'),true);else UI.refreshView();break}
 case 'fsave':{const r=await formDlg({title:'حفظ الفلاتر',html:'<label class="fl">اسم الفلتر<input class="in" name="n" required></label>',ok:t('save'),onOk:async d=>String(d.n||'').trim()||null});if(r){const L_=savedFilters();L_.push({n:r,f:Object.assign({},F)});LS.set('meap.filters',L_);route(true)}break}
 case 'fload':{const f=savedFilters()[+b.dataset.i];if(f){Object.keys(F).forEach(k=>{F[k]=''});Object.assign(F,f.f);route(true)}break}
 case 'fdel':{const L_=savedFilters();L_.splice(+b.dataset.i,1);LS.set('meap.filters',L_);route(true);break}
 case 'pbulk':{const st=($('[data-pbulkst]')||{}).value;if(!st||!PBULK.size){toast('حدد إجراءات واختر الحالة.','w');break}const o={};PBULK.forEach(id=>{o['st.'+id]=st});const n=CUR.eng.setMany(o,{label:'تغيير حالة جماعي'});audit('bulk.status',{n:PBULK.size,st});toast(`تم تحديث ${PBULK.size} إجراء.`,'s');PBULK.clear();renderRes();break}
 case 'jerun':await jeRun();break;case 'jereset':Object.assign(JUPL,{step:0,raw:null,buf:null,file:null});refreshBlock('jeu');break;
 case 'jefilter':JEF_.f=b.dataset.f||'';UI.refreshView();break;case 'jexlsx':jetXlsx();break;
 case 'wpxlsx':wpXlsxExport(ref);break;case 'logsxlsx':logsXlsxExport();break;case 'engxlsx':engXlsxExport();break;case 'repdocx':reportDocxExport();break;
 case 'ppbuild':{const el=$('#ppdoc');el.innerHTML=printPackHTML();fitTables(el);el.querySelectorAll('textarea').forEach(autogrow);el.scrollIntoView({block:'start'});break}
 case 'ppprint':{const el=$('#ppdoc');if(!el.childElementCount){el.innerHTML=printPackHTML();fitTables(el)}ppPageStyle();document.body.classList.add('pp-printing');window.print();setTimeout(()=>document.body.classList.remove('pp-printing'),500);break}
 case 'bknow':{const pg=$('[data-bkprog]');b.disabled=true;try{const m=await BK.snapshot('manual','',x=>{if(pg)pg.textContent=x});toast(`تم إنشاء النسخة ${m.id}: ${m.files.length} ملف (${m.newObjects} محتوى جديد).`,'s');route(true)}catch(x){logErr('backup',x);toast('تعذر إنشاء النسخة: '+errMsg(x),'e')}finally{b.disabled=false}break}
 case 'bkverify':{const box=$('[data-bkres]');box.innerHTML='<p class="mut">جارٍ الفحص…</p>';try{const r=await BK.verify(id,x=>{box.innerHTML='<p class="mut">'+esc(x)+'</p>'});box.innerHTML=`<div class="card"><h3 style="margin-top:0">فحص سلامة ${esc(id)}</h3><p>${r.ok?'<span class="b ok">✓ سليمة</span>':'<span class="b bad">✗ تالفة</span>'} — ${r.files} ملف · كائنات تالفة: ${r.bad.length} · مفقودة: ${r.missing.length}</p><p class="small">مقارنة بالمجلد الحالي: تغير ${r.changed.length} · حُذف ${r.gone.length} · أُضيف ${r.added.length}</p>${r.changed.length?`<details class="nt"><summary>الملفات المتغيرة</summary><ul class="lkl">${r.changed.slice(0,100).map(p=>`<li dir="ltr">${esc(p)}</li>`).join('')}</ul></details>`:''}</div>`}catch(x){box.innerHTML=`<p class="note bad">${esc(errMsg(x))}</p>`}break}
 case 'bkrestore':{await CO.load();const opts=[['','كل البيانات']];for(const c of CO.list){opts.push([c._dir+'/',c.name]);for(const e of await CO.engs(c))opts.push([e._path+'/',c.name+' — '+e.year])}
  const r=await formDlg({title:'استعادة من '+id,html:`<p class="note warn small">تُنشأ نسخة «قبل الاستعادة» تلقائيًا، ثم تُعاد الملفات المختلفة فقط إلى حالتها في النسخة بعد التحقق من بصمة كل ملف. لا تُحذف ملفات أُضيفت بعد النسخة.</p><label class="fl">النطاق<select class="sel" name="scope">${opts.map(o=>`<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select></label><label class="fl">اكتب «استعادة» للتأكيد<input class="in" name="c" required></label>`,ok:'استعادة',onOk:async d=>{if(String(d.c).trim()!=='استعادة')throw new Error('اكتب كلمة «استعادة» للتأكيد.');await SAVER.flush(true);return await BK.restore(id,d.scope||'',x=>{const p=$('[data-bkprog]');if(p)p.textContent=x})}});
  if(r){toast(`تمت استعادة ${r.n} ملف. نسخة ما قبل الاستعادة: ${r.pre}`,'s',12000);TEMP.clear();await closeEng();boot()}break}
 case 'inbox':if(CUR.eng)location.hash=L('inbox');break;
 case 'apmove':{const o={t:b.dataset.t,id};if(await apMove(o,b.dataset.to)){refreshBlock('ap|'+o.t+':'+id);UI.refreshView()}break}
 case 'cmreply':{const r=await formDlg({title:'ردّ على التعليق',html:`<label class="fl">الرد<textarea class="ta" name="tx" required></textarea></label>`,ok:'إرسال',onOk:async d=>{if(!String(d.tx||'').trim())throw new Error('النص مطلوب.');return d.tx}});if(r)cmAdd(ref,r,id);break}
 case 'cmres':{const k=`wp.${ref}.cm.${id}`;const c=CUR.eng.get(k);if(c){CUR.eng.set(k,Object.assign({},c,{res:!c.res,rby:SESSION.id,rt:Date.now()}),{label:'حل تعليق'});refreshBlock('cm|'+ref)}break}
 case 'cmdel':{const k=`wp.${ref}.cm.${id}`;const c=CUR.eng.get(k);if(c&&(await ask({title:'حذف التعليق',body:'حذف تعليقك؟ يمكن التراجع (Alt+Z).',ok:t('del'),danger:true}))){CUR.eng.set(k,Object.assign({},c,{del:true}),{label:'حذف تعليق'});refreshBlock('cm|'+ref);undoToast('تم حذف التعليق.')}break}
 case 'bulkapply':await bulkApply();break;
 case 'bulkclr':BULK.clear();refreshBlock('wl');{const bb=$('[data-bulkbar]');if(bb)bb.hidden=true}break;
 case 'uplcancel':TBW.cancel();UPL.busy=false;UPL.step=0;JUPL.step=0;refreshBlock('tbu');refreshBlock('jeu');toast('تم إلغاء المعالجة.','i');break;
 case 'uplval':await uplValidate();break;case 'uplaccept':await uplAccept();break;case 'uplback':UPL.step=2;refreshBlock('tbu');break;
 case 'uplreset':Object.assign(UPL,{step:0,raw:null,buf:null,file:null,val:null,res:null});refreshBlock('tbu');break;
 case 'tbact':{const v=+b.dataset.v;if(!(await ask({title:'تفعيل إصدار الميزان v'+v,body:'ستُبنى أوراق العمل والجداول الرئيسية على هذا الإصدار، وتظهر علامة «قديم» على الأوراق المربوطة بإصدار آخر.',ok:'تفعيل'})))break;CUR.eng.set('tbv.active',v,{label:'تفعيل إصدار الميزان'});audit('tb.activate',{v});await TBSTORE.load(CUR.eng,true);route(true);break}
 case 'tbmapacc':await tbAcceptSugg(b.dataset.conf);break;
 case 'tbexp':tbExport(b.dataset.fmt);break;
 case 'tbmat':await tbApplyMateriality();break;
 case 'tbbindclr':CUR.eng.set('wp.'+ref+'.tb',null,{label:'إلغاء ربط الميزان'});refreshTbBind(ref);break;
 case 'tbbindup':tbBindSet(ref,{});toast('تم تحديث الربط إلى الإصدار النشط.','s');break;
 case 'tbman':{const r=await formDlg({title:'رصيد يدوي لورقة العمل '+ref,html:`<p class="note warn small">يُمنع إدخال رصيد يدوي إلا بمبرر موثق؛ يظهر المبرر في الورقة ويُسجل في سجل التدقيق.</p><div class="fgrid"><label>الرصيد<input class="in" name="amount" inputmode="decimal" required></label><label class="full">المبرر (10 أحرف على الأقل)<textarea class="ta" name="reason" required></textarea></label></div>`,ok:'حفظ',onOk:async d=>{const a=parseNum(d.amount);if(a==null||isNaN(a))throw new Error('أدخل رقمًا صحيحًا.');if(String(d.reason||'').trim().length<10)throw new Error('المبرر مطلوب (10 أحرف على الأقل).');CUR.eng.set('wp.'+ref+'.tbman',{amount:a,reason:d.reason.trim(),by:SESSION.id,t:Date.now()},{label:'رصيد يدوي'});audit('wp.manualBalance',{ref,amount:a});return true}});if(r)refreshTbBind(ref);break}
 case 'tbmanclr':CUR.eng.set('wp.'+ref+'.tbman',null,{label:'إلغاء رصيد يدوي'});refreshTbBind(ref);break;
 case 'pplkdel':{const pid=b.dataset.id;CUR.eng.set(`pp.${pid}.lk.${b.dataset.lk}`,null,{label:'حذف رابط إجراء'});refreshBlock('pp|'+pid);ppRefreshSummary(pid);toast('تم حذف الرابط.','s',8000,{label:t('undo'),fn:()=>{undo();refreshBlock('pp|'+pid);ppRefreshSummary(pid)}});break}
 case 'ppfind':{const pid=b.dataset.id;const p=PIDX[pid];const r=await formDlg({title:'ملاحظة على الإجراء',html:`<p class="small">${esc(p?p.tx:'')}</p><div class="fgrid"><label class="full">وصف الملاحظة / الاستثناء<textarea class="ta" name="desc" required></textarea></label><label>النوع<select class="sel" name="type"><option>Exception استثناء</option><option>Misstatement تحريف</option><option>Control Deficiency قصور رقابي</option><option>Significant Deficiency قصور جوهري</option><option>Compliance عدم التزام</option></select></label><label>الأهمية<select class="sel" name="sev"><option value="H">High</option><option value="M" selected>Medium</option><option value="L">Low</option></select></label><label>المبلغ<input class="in" name="amt" inputmode="decimal"></label><label>التوصية<input class="in" name="rec"></label></div>`,ok:'إضافة',onOk:async d=>{if(!String(d.desc||'').trim())throw new Error('الوصف مطلوب.');return addRec('f',{desc:d.desc.trim(),type:d.type,sev:d.sev,amt:d.amt,rec:d.rec,proc:pid,acc:p&&p.acc||'',ref:p?split(p.wp)[0]||'':''})}});if(r){toast('تمت إضافة الملاحظة وستظهر في خطاب الإدارة.','s');refreshBlock('pp|'+pid)}break}
 case 'refnew':await refCreate(b.dataset.src||null);break;
 case 'refsrc':{const n=await pickNode('اختيار مصدر المرجع');if(n){CUR.eng.set('ref.'+id+'.src',nodeParse(n),{label:'مصدر المرجع'});route(true)}break}
 case 'reftgadd':{const n=await pickNode('إضافة هدف للمرجع');if(n){const r=refById(id);const tg=(r.targets||[]).slice();if(!tg.some(x=>NODE_OF(x)===n))tg.push(nodeParse(n));CUR.eng.set('ref.'+id+'.targets',tg,{label:'هدف مرجع'});route(true)}break}
 case 'reftgdel':{const r=refById(id);const tg=(r.targets||[]).slice();tg.splice(+b.dataset.i,1);CUR.eng.set('ref.'+id+'.targets',tg,{label:'إزالة هدف مرجع'});route(true);break}
 case 'refdel':{const r=refById(id);const kids=refList().filter(x=>x.parent===id);if(!(await ask({title:'حذف المرجع',body:(kids.length?`<p class="note bad">⚠ هذا المرجع أب لـ ${kids.length} مرجع: ${kids.map(x=>esc(x.code)).join('، ')}. ستنقطع السلسلة.</p>`:'')+`حذف المرجع «${esc(r.code)}»؟ يمكن التراجع (Alt+Z).`,ok:t('del'),danger:true})))break;CUR.eng.set('ref.'+id+'._del',true,{label:'حذف مرجع'});audit('ref.delete',{code:r.code});location.hash=L('refs');undoToast('تم حذف المرجع «'+r.code+'».');break}
 case 'reldl':downloadBlob(new Blob([JSON.stringify(relationsSnapshot(CUR.eng),null,1)],{type:'application/json'}),'relations-'+sanitizeName(CUR.company.name,30)+'-'+G('eng.year','')+'.json');break;
 case 'docsec':docSecEdit(b.dataset.id,b.dataset.sec,b);break;
 case 'docsecreset':CUR.eng.set('doc.'+b.dataset.id+'.s.'+b.dataset.sec,null,{label:'استعادة نص القسم'});refreshBlock('docprev|'+b.dataset.id);break;
 case 'docreset':{if(!(await ask({title:'إلغاء التعديلات اليدوية',body:'إعادة كل أقسام هذا النموذج إلى النص الآلي؟ (الخيارات والحقول لا تتغير)',ok:'إعادة',danger:true})))break;for(const [k] of [...CUR.eng.entries('doc.'+id+'.s.')])CUR.eng.set(k,null,{label:'إعادة نموذج'});refreshBlock('docprev|'+id);break}
 case 'mlseen':CUR.eng.set('ml.$seen',mlPoints().map(p=>p.key),{label:'اعتماد توليد خطاب الإدارة'});refreshBlock('mlm|'+CUR.arg);break;
 case 'mlprior':await mlImportPrior();break;
 case 'ohapply':{const n=$('#ohN').value,ef=$('#ohE').value;const op=OPMX[n][ef];CUR.eng.setMany({'doc.audrep.o.op':op,'doc.audrep.o.basis':n},{label:'نوع الرأي'});toast('تم ضبط نوع الرأي: '+(TPLM.audrep.opts[0][2].find(x=>x[0]===op)||[])[1],'s');route(true);break}
 case 'docexp':await docExport(b.dataset.id,b.dataset.fmt);break;
 case 'logdl':downloadBlob(new Blob([JSON.stringify({app:'Audit-Plus',version:VERSION,device:DEVICE,exportedAt:localISO(),log:ERRLOG},null,1)],{type:'application/json'}),'Audit-Plus-system-log-'+today()+'.json');break;
 case 'logclr':if(await ask({title:'مسح سجل النظام',body:'حذف كل مدخلات سجل الأخطاء على هذا الجهاز؟',ok:t('del'),danger:true})){ERRLOG.length=0;LS.del('meap.errlog');route(true)}break;
 case 'glang':PREF.lang=PREF.lang==='en'?'ar':'en';savePrefs();applyPrefs();boot();break;
 case 'usermenu':userMenu();break;
 case 'fclr':Object.keys(F).forEach(k=>{F[k]=''});route(true);break;
 case 'coadd':{const c=await companyDlg(null);if(c)location.hash='#/c/'+encodeURIComponent(c.id);break}
 case 'coedit':{await CO.load();const c=await companyDlg(CO.byId(id));if(c)route(true);break}
 case 'coarch':{await CO.load();const c=CO.byId(id);if(!(await ask({title:c.archived?t('unarchive'):t('archive'),body:`${c.archived?'استعادة':'أرشفة'} الشركة «${esc(c.name)}»؟ لا تُحذف أي بيانات.`})))break;await CO.save(Object.assign({},c,{archived:!c.archived}));route(true);break}
 case 'engadd':{await CO.load();const r=await engDlg(CO.byId(id));if(r)location.hash='#/e/'+encodeURIComponent(id)+'/'+encodeURIComponent(r.year)+'/dash';break}
 case 'engclone':case 'clone':{await CO.load();const c=act==='clone'?CO.byId(CUR.company.id):CO.byId(id);const yr=act==='clone'?CUR.eng.get('eng.year',''):b.dataset.year;await SAVER.flush();const r=await cloneDlg(c,yr);if(r){toast('تم الاستنساخ.','s');location.hash='#/e/'+encodeURIComponent(c.id)+'/'+encodeURIComponent(r.year)+'/dash'}break}
 case 'engstat':{await CO.load();const c=CO.byId(id);const st=await storeFor(c._dir+'/'+sanitizeName(b.dataset.year,20));st.set('eng.status',st.get('eng.status')==='closed'?'active':'closed');await SAVER.flush();route(true);break}
 case 'engdel':{await CO.load();const c=CO.byId(id),yr=b.dataset.year;const ok=await ask({title:'حذف الارتباط نهائيًا',body:`سيُحذف ارتباط <b>${esc(c.name)} ${esc(yr)}</b> بكل أوراقه ومرفقاته من مجلد الحفظ. صدّر نسخة JSON أولًا إن لزم.`,ok:t('del'),danger:true,input:{label:`اكتب السنة «${yr}» للتأكيد`,must:yr}});if(!ok)break;const p=c._dir+'/'+sanitizeName(yr,20);TEMP.delete(p);await STORE.remove(p);audit('engagement.delete',{company:id,year:yr});toast('تم حذف الارتباط.','s');route(true);break}
 case 'addrow':{const g=b.dataset.g;const rid=uid('r');CUR.eng.set(`wp.${ref}.g.${g}.r.${rid}`,{o:Date.now()},{label:'إضافة صف'});const tb=$(`table[data-grid="${CSS.escape(ref+'|'+g)}"] tbody`);
  if(tb){tb.insertAdjacentHTML('beforeend',rowHTML(ref,g,gridCols(ref,g),{id:rid},[]));labelTable(tb.closest('table'));fitTables(tb.closest('.tw').parentElement);const c=tb.lastElementChild.querySelector('td');c&&c.focus()}break}
 case 'delrow':{if(!(await ask({title:'حذف الصف',body:'حذف هذا الصف من الجدول؟ يمكنك التراجع (Alt+Z).',ok:t('del'),danger:true})))break;const g=b.dataset.g,rid=b.dataset.row;const prev=CUR.eng.get(`wp.${ref}.g.${g}.r.${rid}`,null);CUR.eng.set(`wp.${ref}.g.${g}.r.${rid}`,Object.assign({o:rid[0]==='d'?+rid.slice(1):Date.now()},prev||{},{del:true}),{label:'حذف صف'});const tr=b.closest('tr');tr&&tr.remove();undoToast('تم حذف الصف.');break}
 case 'sign':case 'unsign':{const s=b.dataset.s;CUR.eng.set(`wp.${ref}.so.${s}`,act==='sign'?{u:SESSION.id,t:Date.now()}:null,{label:'توقيع'});
  if(act==='sign'&&s==='prep'&&G('wp.'+ref+'.wf','NS')==='NS')CUR.eng.set('wp.'+ref+'.wf','PR');if(act==='sign'&&s==='rev'&&['PR','SR','RE','RN','NS'].includes(G('wp.'+ref+'.wf','NS')))CUR.eng.set('wp.'+ref+'.wf','RV');UI.refreshView();break}
 case 'attview':await attView(ref,id,b);break;case 'attdl':await attDl(ref,id);break;case 'attdel':await attDel(ref,id);break;
 case 'lkdel':{if(!(await ask({title:'حذف الرابط',body:'حذف هذا الرابط بين أوراق العمل؟',ok:t('del'),danger:true})))break;CUR.eng.set(`wp.${ref}.lk.${id}`,null,{label:'حذف رابط'});refreshBlock('lk|'+ref);undoToast('تم حذف الرابط.');break}
 case 'delrec':{const kd=b.dataset.kind;if(!(await ask({title:'حذف السجل',body:'حذف هذا السجل؟ يمكنك التراجع (Alt+Z).',ok:t('del'),danger:true})))break;CUR.eng.set(`${kd}.${id}._del`,true,{label:'حذف سجل'});$$('[data-block]').forEach(x=>{const n=x.dataset.block;if(n.startsWith('logs')||n.startsWith('accfn'))refreshBlock(n)});undoToast('تم حذف السجل.');break}
 case 'newwp':await newWpDlg();break;
 case 'delwp':{const back=linksTo(ref);const ok=await ask({title:'حذف ورقة العمل المخصصة',body:(back.length?`<p class="note bad">⚠ هذه الورقة مرتبطة من ${back.length} ورقة: ${back.map(l=>esc(l.from)).join('، ')}. ستصبح هذه الروابط مكسورة.</p>`:'')+'<p>ستُحذف الورقة وبياناتها ومرفقاتها نهائيًا.</p>',ok:t('del'),danger:true,input:{label:`اكتب «${ref}» للتأكيد`,must:ref}});if(!ok)break;
  const folder=CUR.eng.path+'/working-papers/'+wpFolder(CUR.eng,ref);const prevDef=CUR.eng.get('cwp.'+ref,null);const trash=CUR.eng.path+'/_trash/wp-'+sanitizeName(ref,16)+'-'+Date.now().toString(36);try{await copyDir(folder,trash)}catch(x){logErr('delwp trash copy',x)}
  CUR.eng.set('cwp.'+ref,null,{noUndo:true});try{await STORE.remove(folder)}catch(x){logErr('a7_main:78 await STORE.remove(folder)',x)}syncCustomWPs();audit('wp.delete',{ref});location.hash=L('wplib');
  toast('تم حذف الورقة '+ref+'.','s',10000,{label:t('undo'),fn:async()=>{try{await copyDir(trash,folder);await STORE.remove(trash);CUR.eng.set('cwp.'+ref,prevDef,{noUndo:true});syncCustomWPs();toast('تمت استعادة الورقة '+ref+'.','s');location.hash=L('wp/'+encodeURIComponent(ref))}catch(x){logErr('delwp undo',x);toast(errMsg(x),'e')}}});break}
 case 'exclwp':{const ex=G('wp.'+ref+'.excluded',false);if(!ex){const back=linksTo(ref);if(!(await ask({title:'استبعاد ورقة العمل',body:(back.length?`<p class="note bad">⚠ هذه الورقة مرتبطة من ${back.length} ورقة (${back.map(l=>esc(l.from)).join('، ')}). ستظهر هذه الروابط كروابط مكسورة.</p>`:'')+'<p>استبعاد الورقة من هذا الارتباط؟ لا تُحذف بياناتها ويمكن إعادة إدراجها.</p>',ok:'استبعاد'})))break}
  CUR.eng.set('wp.'+ref+'.excluded',!ex,{label:'استبعاد ورقة'});UI.refreshView();break}
 case 'pickfolder':await chooseFolder(false);break;case 'toidb':await useBrowserStorage();break;
 case 'upw':{const r=await formDlg({title:'كلمة مرور جديدة — '+USERS.nameOf(id),html:`<label class="fl">كلمة المرور الجديدة<input class="in" type="password" name="p" required autocomplete="new-password"></label>`,onOk:async d=>{await setPassword(id,d.p);audit('user.password',{id});return true}});if(r)toast('تم تغيير كلمة المرور. ستنتهي جلسات هذا المستخدم على الأجهزة الأخرى.','s');break}
 case 'uname':{const r=await formDlg({title:'تعديل الاسم المعروض',html:`<label class="fl">${t('display')}<input class="in" name="d" value="${esc(USERS.nameOf(id))}" required></label>`,onOk:async d=>{await updateUser(id,{display:d.d});if(id===SESSION.id)SESSION.display=d.d;return true}});if(r)route(true);break}
 case 'uact':{const u=USERS.doc.users.find(x=>x.id===id);await updateUser(id,{active:u.active===false});audit('user.active',{id,active:u.active===false});route(true);break}
 case 'udel':{if(!(await ask({title:'حذف المستخدم',body:`حذف المستخدم «${esc(USERS.nameOf(id))}»؟ ستنتهي جلسته عند أول تحقق. تبقى تعديلاته السابقة في سجل التدقيق.`,ok:t('del'),danger:true})))break;await deleteUser(id);audit('user.delete',{id});route(true);break}
 case 'mypw':{const r=await formDlg({title:'تغيير كلمة المرور',html:`<div class="fgrid"><label class="full">كلمة المرور الحالية<input class="in" type="password" name="o" required autocomplete="current-password"></label><label>الجديدة<input class="in" type="password" name="p" required autocomplete="new-password"></label><label>تأكيد الجديدة<input class="in" type="password" name="p2" required autocomplete="new-password"></label></div>`,
   onOk:async d=>{if(d.p!==d.p2)throw new Error('كلمتا المرور غير متطابقتين.');await USERS.load();const rec=USERS.doc.users.find(u=>u.id===SESSION.id);const {verifier}=await passDerive(d.o,unb64(rec.pSalt));if(!ctEq(verifier,rec.pHash))throw new Error('كلمة المرور الحالية غير صحيحة.');await setPassword(SESSION.id,d.p);return true}});if(r)toast('تم تغيير كلمة المرور.','s');break}
 case 'resetprefs':if(await ask({title:'إعادة ضبط التفضيلات',body:'إعادة اللغة والثيم وحجم الخط إلى الافتراضي على هذا الجهاز؟'})){LS.del('meap.prefs');location.reload()}break;
 case 'unlink':if(await ask({title:'فصل المجلد',body:'فصل مجلد الحفظ عن هذا الجهاز؟ لن تُحذف أي ملفات.',ok:'فصل'})){await SAVER.flush();await KV.del('root');await KV.del('session:'+STORE_ID);location.hash='#/';location.reload()}break;
 case 'wipe':{const ok=await ask({title:'حذف كل بيانات المتصفح',body:'<p class="note bad">لا يمكن التراجع عن هذه العملية.</p>',ok:'حذف نهائي',danger:true,input:{label:'اكتب «حذف» للتأكيد',must:'حذف'}});if(!ok)break;SYNC.stop();await STORE.wipe();await KV.del('session:'+STORE_ID);LS.del(WAL.key());location.hash='#/';location.reload();break}
 }}catch(x){toast(errMsg(x),'e')}});

/* drag & drop attachments; also stop the browser from navigating away when a file is dropped elsewhere */
document.addEventListener('dragover',e=>{const dz=e.target instanceof Element&&e.target.closest('[data-dz],[data-tbdz],[data-jedz]');if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')){e.preventDefault();if(dz)dz.classList.add('over')}});
document.addEventListener('dragleave',e=>{const dz=e.target instanceof Element&&e.target.closest('[data-dz]');if(dz)dz.classList.remove('over')});
document.addEventListener('drop',e=>{if(!e.dataTransfer||![...e.dataTransfer.types].includes('Files'))return;e.preventDefault();const tdz=e.target instanceof Element&&e.target.closest('[data-tbdz]');if(tdz){const f=e.dataTransfer.files[0];if(f)uplStart(f);return}const jdz=e.target instanceof Element&&e.target.closest('[data-jedz]');if(jdz){const f=e.dataTransfer.files[0];if(f)jeStart(f);return}const dz=e.target instanceof Element&&e.target.closest('[data-dz]');if(!dz){toast('أفلت الملفات داخل منطقة المرفقات.','w');return}dz.classList.remove('over');attAdd(dz.dataset.dz,[...e.dataTransfer.files])});

document.addEventListener('keydown',e=>{const k=e.key;
 if((e.ctrlKey||e.metaKey)&&(k==='k'||k==='K')){e.preventDefault();const q=$('#q');if(q){$('#top').classList.add('ss');q.focus({preventScroll:true});q.select()}return}
 if(e.altKey&&(k==='z'||k==='Z'||e.code==='KeyZ')){e.preventDefault();undo();return}
 if(k==='Escape'){if(DLG){closeDlg();return}if(document.body.classList.contains('nav-open')){document.body.classList.remove('nav-open');$('#menuBtn').focus()}return}
 if((k==='Enter'||k===' ')&&e.target instanceof Element&&e.target.matches('[data-dz],[data-tbdz],[data-jedz]')){e.preventDefault();const i=e.target.querySelector('input[type=file]');i&&i.click();return}
 if(k==='Tab'&&DLG){const f=$$('a[href],button:not([disabled]),input:not([disabled]):not(.sr),select:not([disabled]),textarea,[contenteditable=true],[contenteditable=plaintext-only],[tabindex="0"]',DLG.box);if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});

/* lifecycle: flush immediately when the tab is hidden/closed; WAL guarantees nothing is lost meanwhile */
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){SAVER.flush();PRES.beat(true)}else{SYNC.tick()}});
window.addEventListener('pagehide',()=>{SAVER.flush()});
window.addEventListener('beforeunload',e=>{if(SAVER.q.length||SAVER.busy||SAVER.state==='error'){SAVER.flush();e.preventDefault();e.returnValue=''}});
window.addEventListener('hashchange',()=>route());
window.addEventListener('resize',deb(()=>{UI.measure();refit();navFit()},120));
window.addEventListener('focus',()=>{if(SESSION)SYNC.tick()});
let PRINT_OPEN=[];
window.addEventListener('beforeprint',()=>{PRINT_OPEN=$$('details:not([open])').filter(d=>!d.closest('#nav'));PRINT_OPEN.forEach(d=>{d.open=true});$$('table.stack').forEach(tb=>tb.classList.remove('stack'))});
window.addEventListener('afterprint',()=>{PRINT_OPEN.forEach(d=>{d.open=false});PRINT_OPEN=[];refit()});

function userMenu(){const box=openDlg(`<h2>${esc(SESSION.display)}</h2><div class="kv"><div>${t('username')}</div><div dir="ltr">${esc(SESSION.username)}</div><div>${t('role')}</div><div>${esc(ROLEN(SESSION.role))}</div><div>التخزين</div><div>${STORE.kind==='fs'?'📁 '+esc(STORE.label):'💾 IndexedDB'}</div></div>
 <p class="mut small">تسجيل الدخول دائم على هذا الجهاز ولا ينتهي بالخمول.</p><div class="acts"><a class="btn g" href="#/settings/users">حسابي وكلمة المرور</a><button class="btn d" type="button" data-act="logout">${t('logout')}</button></div>`,{label:SESSION.display})}
async function newWpDlg(){const r=await formDlg({title:'ورقة عمل مخصصة جديدة',html:`<div class="fgrid"><label>المرجع (مثال: E-90)<input class="in" name="ref" required pattern="[A-Za-z]{1,3}-[A-Za-z0-9]{1,6}"></label><label>القسم<select class="sel" name="sec">${Object.keys(WSEC).map(k=>`<option value="${k}">${k} · ${esc(WSEC[k])}</option>`).join('')}</select></label>
 <label>الاسم بالعربية<input class="in" name="ar" required></label><label>الاسم بالإنجليزية<input class="in" name="en" dir="ltr" required></label><label>نوع النموذج<select class="sel" name="k">${Object.keys(KINDS).filter(k=>!['chk','icq','memo'].includes(k)).map(k=>`<option value="${k}"${k==='tod'?' selected':''}>${esc(KINDS[k][0])}</option>`).join('')}</select></label><label>ISA (مثال: 500 530)<input class="in" name="isa" value="500"></label><label class="full">الهدف<textarea class="ta" name="ob"></textarea></label></div>`,ok:'إنشاء',
 onOk:async d=>{const ref=String(d.ref).trim().toUpperCase();if(!/^[A-Z]{1,3}-[A-Z0-9]{1,6}$/.test(ref))throw new Error('صيغة المرجع غير صحيحة (مثال: E-90).');if(WP[ref])throw new Error('المرجع مستخدم بالفعل.');
  CUR.eng.set('cwp.'+ref,{ref,ar:d.ar,en:d.en,k:d.k,sec:ref.split('-')[0],isa:d.isa,ob:d.ob,by:SESSION.id,t:Date.now()},{label:'ورقة مخصصة'});syncCustomWPs();audit('wp.create',{ref});return ref}});
 if(r)location.hash=L('wp/'+encodeURIComponent(r))}

function fatal(msg){$('#app').innerHTML=`<main class="gate" id="main"><div class="card"><h1>Audit-Plus</h1><p class="note bad">${esc(msg)}</p><button class="btn" type="button" data-act="reload">إعادة المحاولة</button></div></main>`}
async function boot(){if(window.opener&&/[?&]state=/.test(location.search)&&/[?&](code|error)=/.test(location.search)){document.title='Audit-Plus — تسجيل الدخول';$('#app').innerHTML='<main class="gate"><div class="card"><p>جارٍ إكمال تسجيل الدخول… يمكنك إغلاق هذه النافذة إن لم تُغلق تلقائيًا.</p></div></main>';return}
 applyPrefs();SYNC.stop();BLOBURL.all();
 if(!boot._p){boot._p=1;await loadPrefsFallback()}
 if(!window.crypto||!crypto.subtle){fatal('هذا المتصفح لا يوفر Web Crypto API اللازم لتشفير بيانات الدخول. افتح الملف في Chrome أو Edge أو Firefox أو Safari حديث.');return}
 if(!window.indexedDB){fatal('تخزين المتصفح (IndexedDB) غير متاح (ربما وضع التصفح الخاص). افتح البرنامج في نافذة عادية.');return}
 try{const r=await openStoreFromDevice();if(r.needsPermission){gatePermission(r.handle);return}if(r.missing){gateFolderMissing(r.handle);return}STORE=r.store;
  if(STORE.kind==='idb'&&navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(e=>logErr('storage.persist',e,'info'));
  await loadSettings();await USERS.load();if(!USERS.doc||!USERS.doc.users.length){gateSetup();return}
  const s=await restoreSession();if(!s){gateLogin();return}await enterApp()}
 catch(e){if(isNotFound(e)&&FSA_OK){gateFolderMissing(STORE&&STORE.kind==='fs'?STORE.root:null);return}fatal(errMsg(e))}}
async function enterApp(){UI.shell();$('#q').placeholder=t('searchPh');SAVER.set('saved');
 setTimeout(()=>BK.auto(),4000);SIDX.build();if(STORE.kind==='fs')setTimeout(async()=>{const c=await findSyncConflicts(20);if(c.length)toast(`تنبيه: ${c.length} ملف يبدو نسخة تعارض من تطبيق المزامنة (مثل ${c[0]}). راجع الإعدادات ← مجلد الحفظ.`,'w',15000,{label:'عرض',fn:()=>{location.hash='#/settings/storage'}})},6000);if(/[?&]selftest\b/.test(location.search)&&!/^#\/selftest/.test(location.hash)&&!sessionStorage.getItem('meap.selftest.reload'))location.hash='#/selftest';
 if(MIGRATED){toast(`تم ترحيل مجلد البيانات من الإصدار ${MIGRATED.from} إلى ${MIGRATED.to} (v${VERSION}) دون حذف أي ملف. نسخة احتياطية موثقة ببصمات SHA-256: ${MIGRATED.backup} (${MIGRATED.files} ملف).`,'s',15000);audit('migrate',MIGRATED);MIGRATED=null}
 const wal=WAL.all();if(wal.length){wal.forEach(w=>SAVER.q.push({p:w.p,o:w.o}));toast(`تمت استعادة ${wal.length} تعديل لم يكتمل حفظه في الجلسة السابقة.`,'i');SAVER.kick(200)}
 SYNC.start();LASTHASH='';await route()}
