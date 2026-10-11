/* MEAP · Relations: attachments, procedure links, references, relation graph */
'use strict';
/* ================= a8 · Relations: generic attachments, procedure attachments & links, references, relation graph ================= */
/* Owner token of an attachment set: "E-04" (working paper — v2 compatible) or "pp!<procedureId>" (procedure). */
const OWN={parse(tok){tok=String(tok||'');const i=tok.indexOf('!');return i<0?{t:'wp',id:tok}:{t:tok.slice(0,i),id:tok.slice(i+1)}},
 tok(t,id){return t==='wp'?id:t+'!'+id},pre(o){return o.t+'.'+o.id+'.att.'},
 dir(store,o){return store.path+'/'+(o.t==='wp'?'working-papers/'+wpFolder(store,o.id):'procedures/'+procFolder(o.id))+'/attachments'},
 label(o){if(o.t==='wp'){const w=WP[o.id];return 'ورقة العمل '+o.id+(w?' '+w.ar:'')}const p=PIDX[o.id];return 'الإجراء: '+(p?p.tx.slice(0,70)+(p.tx.length>70?'…':''):o.id)}};
function procFolder(id){const p=PIDX[id];return sanitizeName(id,48)+'__'+sanitizeName(p?p.tx.replace(/^\[[^\]]*\]\s*/,''):'Procedure',48)}
function attListO(store,o){const pre=OWN.pre(o);const out=[];for(const [k,v] of store.entries(pre)){const id=k.slice(pre.length);if(id.includes('.')||!v||typeof v!=='object')continue;out.push(Object.assign({id},v))}return out.sort((a,b)=>a.t-b.t)}

/* ---------- per-version caches (a single pass over the store instead of one pass per table row) ---------- */
const VCACHE={};function vcache(name,fn){const st=CUR.eng;if(!st)return fn();const c=VCACHE[name];if(c&&c.st===st&&c.ver===st.ver)return c.v;const v=fn();VCACHE[name]={st,ver:st.ver,v};return v}
function ppIndex(){return vcache('pp',()=>{const m=new Map();const get=id=>{let r=m.get(id);if(!r){r={a:0,l:0,links:[],att:[]};m.set(id,r)}return r};
 for(const [k,v] of CUR.eng.entries('pp.')){const x=/^pp\.(.+)\.(att|lk)\.([^.]+)$/.exec(k);if(!x||!v)continue;const r=get(x[1]);if(x[2]==='att'&&typeof v==='object'){r.a++;r.att.push(Object.assign({id:x[3]},v))}else if(x[2]==='lk'&&v.to){r.l++;r.links.push(Object.assign({id:x[3],from:x[1]},v))}}
 for(const rf of refList()){const s=rf.src&&rf.src.t==='pp'?rf.src.id:null;if(s)get(s).r=(get(s).r||0)+1}return m})}
function ppLinksTo(ref){const out=[];for(const [id,r] of ppIndex())for(const l of r.links)if(l.to===ref)out.push(l);return out}

/* ---------- attachments (any owner) ---------- */
function attHTML(tok){const o=OWN.parse(tok);const list=attListO(CUR.eng,o);const S=SETTINGS.attach;
 return `${can('edit')?`<div class="dz noprint" data-dz="${esc(tok)}" tabindex="0" role="button" aria-label="إرفاق ملفات بـ ${esc(OWN.label(o))}: اسحبها هنا أو اضغط للاختيار">📎 اسحب الملفات وأفلتها هنا أو <label class="btn o sm">اختر ملفات<input class="sr" type="file" multiple data-attpick="${esc(tok)}"></label><br><small class="mut">الحد: ${esc(S.maxMB)} ميجابايت للملف · ${esc(S.maxFiles)} ملفًا · الأنواع: ${esc(S.types)}</small></div>`:''}
 ${list.length?`<ul class="attl">${list.map(a=>`<li data-att="${esc(a.id)}"><div class="row" style="justify-content:space-between"><div><b>${esc(a.name)}</b> <span class="mut small">${fmtSize(a.size||0)} · ${esc(USERS.nameOf(a.by))} · ${fmtDT(a.t)}</span></div>
  <div class="row noprint"><button class="btn g sm" type="button" data-act="attview" data-ref="${esc(tok)}" data-id="${esc(a.id)}">معاينة</button><button class="btn g sm" type="button" data-act="attdl" data-ref="${esc(tok)}" data-id="${esc(a.id)}">تنزيل</button>${can('edit')?`<button class="btn g sm" type="button" data-act="refnew" data-src="${esc('att:'+tok+'/'+a.id)}" title="إنشاء مرجع لهذا المرفق">🔖 مرجع</button><button class="btn d sm" type="button" data-act="attdel" data-ref="${esc(tok)}" data-id="${esc(a.id)}">حذف</button>`:''}</div></div>
  <label class="fl" style="margin-top:.3rem">وصف المرفق</label>${edc(OWN.pre(o)+a.id+'.d',{label:'وصف المرفق '+a.name,ph:'وصف المرفق ومرجعه…'})}<div class="pv" hidden></div></li>`).join('')}</ul>`:'<p class="mut">لا توجد مرفقات.</p>'}`}
function attPathO(o,a){return OWN.dir(CUR.eng,o)+'/'+a.file}
async function attAdd(tok,files){if(!can('edit'))return;const o=OWN.parse(tok);const S=SETTINGS.attach;const types=split(String(S.types).toLowerCase());let n=attListO(CUR.eng,o).length;let ok=0;
 for(const f of files){const ext=(f.name.split('.').pop()||'').toLowerCase();
  if(types.length&&!types.includes(ext)){toast(`نوع الملف غير مسموح: ${f.name}`,'w');continue}
  if(f.size>num(S.maxMB)*1048576){toast(`الملف أكبر من الحد (${S.maxMB} MB): ${f.name}`,'w');continue}
  if(n>=num(S.maxFiles)){toast(`تم بلوغ الحد الأقصى للمرفقات (${S.maxFiles})`,'w');break}
  const id=uid('at_');const file=id+'__'+sanitizeName(f.name,80);SAVER.set('saving');
  try{await withRetry(()=>STORE.writeBlob(OWN.dir(CUR.eng,o)+'/'+file,f));
   CUR.eng.set(OWN.pre(o)+id,{name:f.name,size:f.size,type:f.type||'',file,by:SESSION.id,t:Date.now()},{label:'إرفاق ملف'});n++;ok++}
  catch(e){logErr('attAdd '+tok,e);SAVER.set('error',errMsg(e));toast(`تعذر حفظ المرفق ${f.name}: ${errMsg(e)}`,'e')}}
 if(ok){toast(`تم إرفاق ${ok} ملف.`,'s');refreshBlock('att|'+tok);if(o.t==='pp')ppRefreshSummary(o.id)}}
async function attBlob(tok,id){const o=OWN.parse(tok);const a=CUR.eng.get(OWN.pre(o)+id);if(!a)return null;const b=await STORE.readBlob(attPathO(o,a));if(!b){toast('ملف المرفق غير موجود في مجلد الحفظ.','e');return null}return{a,b:a.type?new Blob([b],{type:a.type}):b}}
async function attView(tok,id,btn){const li=btn.closest('li');const pv=li.querySelector('.pv');if(!pv.hidden){pv.querySelectorAll('[src^="blob:"],[href^="blob:"]').forEach(x=>BLOBURL.revoke(x.src||x.href));pv.hidden=true;pv.innerHTML='';btn.setAttribute('aria-expanded','false');return}
 const r=await attBlob(tok,id);if(!r)return;const {a,b}=r;
 if(/^image\//.test(a.type)){const u=BLOBURL.make(b,'view');pv.innerHTML=`<img alt="${esc(a.name)}" src="${u}">`}
 else if(/^text\/|json|xml|csv/.test(a.type)||/\.(txt|csv|json|xml)$/i.test(a.name)){pv.innerHTML=`<pre>${esc((await b.slice(0,200000).text()))}</pre>`}
 else{const u=BLOBURL.make(b,'view');pv.innerHTML=`<p>لا يمكن معاينة هذا النوع داخل الصفحة. <a href="${u}" target="_blank" rel="noopener noreferrer">فتح في تبويب جديد</a></p>`}pv.hidden=false;btn.setAttribute('aria-expanded','true')}
async function attDl(tok,id){const r=await attBlob(tok,id);if(!r)return;downloadBlob(r.b,r.a.name)}
/* Delete with undo: the file is moved to _trash/ first, so "Undo" can restore it */
async function attDel(tok,id){const o=OWN.parse(tok);const k=OWN.pre(o)+id;const a=CUR.eng.get(k);if(!a)return;
 if(!(await ask({title:'حذف المرفق',body:`سيُحذف الملف «${esc(a.name)}» من ${esc(OWN.label(o))}. يمكنك التراجع فورًا من الإشعار.`,ok:t('del'),danger:true})))return;
 const src=attPathO(o,a),trash=CUR.eng.path+'/_trash/'+a.file;let moved=false;
 try{const b=await STORE.readBlob(src);if(b){await STORE.writeBlob(trash,b);moved=true}await STORE.remove(src)}catch(e){logErr('attDel move '+src,e)}
 const desc=CUR.eng.get(k+'.d',null);CUR.eng.set(k,null,{noUndo:true});audit('attachment.delete',{owner:tok,name:a.name});refreshBlock('att|'+tok);if(o.t==='pp')ppRefreshSummary(o.id);
 toast('تم حذف المرفق «'+a.name+'».','s',10000,moved?{label:t('undo'),fn:async()=>{try{const b=await STORE.readBlob(trash);if(!b)throw new Error('لم يعد الملف متاحًا في سلة المحذوفات.');await STORE.writeBlob(src,b);await STORE.remove(trash);CUR.eng.set(k,a,{noUndo:true});if(desc)CUR.eng.set(k+'.d',desc,{noUndo:true});refreshBlock('att|'+tok);if(o.t==='pp')ppRefreshSummary(o.id);toast('تمت استعادة المرفق.','s')}catch(e){logErr('attDel undo',e);toast(errMsg(e),'e')}}}:null)}
/* Trash is purged after 30 days (only files whose key is still deleted) */
async function purgeTrash(store){try{const items=await STORE.list(store.path+'/_trash');const lim=Date.now()-30*864e5;for(const it of items){const st=await STORE.stat(store.path+'/_trash/'+it.name);if(st&&st.mtime<lim)await STORE.remove(store.path+'/_trash/'+it.name)}}catch(e){logErr('purgeTrash',e,'warn')}}

/* ---------- procedure panel: attachments + multi-links to working papers + references ---------- */
function ppSummary(id){const r=ppIndex().get(id)||{a:0,l:0,r:0};return `📎 ${r.a} · 🔗 ${r.l}${r.r?' · 🔖 '+r.r:''} <span class="mut">مرفقات وروابط ومراجع</span>`}
function ppDetails(id){return `<details class="nt pp" data-pp="${esc(id)}"><summary data-pps="${esc(id)}">${ppSummary(id)}</summary><div class="ppb" data-block="pp|${esc(id)}"></div></details>`}
function ppRefreshSummary(id){$$(`[data-pps="${CSS.escape(id)}"]`).forEach(s=>{s.innerHTML=ppSummary(id)})}
function ppHTML(id){const p=PIDX[id];if(!p)return '<p class="mut">الإجراء غير موجود في المكتبة.</p>';const r=ppIndex().get(id)||{links:[]};const tok='pp!'+id;const tl=tp=>(LINKT.find(x=>x[0]===tp)||[0,tp])[1];
 const lib=split(p.wp).filter(x=>WP[x]);const refs=refList().filter(x=>(x.src&&x.src.t==='pp'&&x.src.id===id)||(x.targets||[]).some(t=>t.t==='pp'&&t.id===id));
 return `<h4>المرفقات (أدلة الإجراء)</h4><div data-block="att|${esc(tok)}">${attHTML(tok)}</div>
 <h4>أوراق العمل المرتبطة <span class="cnt">${r.links.length}</span></h4>
 ${lib.length?`<p class="small"><span class="mut">حسب البرنامج:</span> ${wpL(lib.join(' '))}</p>`:''}
 ${r.links.length?`<ul class="lkl">${r.links.map(l=>`<li>${wpAlive(l.to)?`<a class="wpl" href="${L('wp/'+encodeURIComponent(l.to))}">${esc(l.to)}</a> ${esc(WP[l.to].ar)}`:`<span class="wpl">${esc(l.to)}</span> <span class="b bad">⚠ رابط مكسور</span>`} · <span class="mut small">${esc(tl(l.type))}${l.note?' — '+esc(l.note):''} · ${esc(USERS.nameOf(l.by))}</span>${can('edit')?` <button class="btn d sm noprint" type="button" data-act="pplkdel" data-id="${esc(id)}" data-lk="${esc(l.id)}" aria-label="حذف الرابط">✕</button>`:''}</li>`).join('')}</ul>`:'<p class="mut small">لا توجد روابط مضافة.</p>'}
 ${can('edit')?`<form class="fgrid noprint" data-form="pplink" data-id="${esc(id)}"><label>أوراق العمل (واحدة أو أكثر، افصل بمسافة أو فاصلة)<input class="in" name="to" list="wplist" required autocomplete="off" placeholder="مثال: E-04 E-05"></label><label>نوع الربط<select class="sel" name="type">${LINKT.map(x=>`<option value="${x[0]}">${esc(x[1])}</option>`).join('')}</select></label><label>ملاحظة<input class="in" name="note"></label><div><button class="btn sm" type="submit">ربط</button></div></form>${wpDatalist()}`:''}
 <h4>المراجع <span class="cnt">${refs.length}</span></h4>${refs.length?`<ul class="lkl">${refs.map(x=>`<li><a href="${L('refs/'+encodeURIComponent(x.id))}"><b>${esc(x.code||'')}</b> ${esc(x.title||'')}</a></li>`).join('')}</ul>`:''}
 ${can('edit')?`<div class="row noprint"><button class="btn g sm" type="button" data-act="refnew" data-src="${esc('pp:'+id)}">🔖 إنشاء مرجع من هذا الإجراء</button><button class="btn g sm" type="button" data-act="ppfind" data-id="${esc(id)}">⚠️ تسجيل ملاحظة على هذا الإجراء</button><a class="btn g sm" href="${L('proc/'+encodeURIComponent(id))}">فتح صفحة الإجراء</a></div>`:''}`}
BLOCKS.pp=id=>ppHTML(id);
function ppSnapshot(store,id){const p=PIDX[id];const pre='pp.'+id+'.';const o={format:'MEAP-procedure',version:3,id,procedure:p?{type:p.t,text:p.tx,assertions:p.as,evidence:p.ev,isa:p.isa,source:p.src+':'+p.sid,libraryWorkingPapers:split(p.wp)}:null,status:store.get('st.'+id,'NS'),note:store.get('nt.'+id,''),attachments:[],links:[],updatedAt:localISO()};
 o.attachments=attListO(store,{t:'pp',id}).map(a=>({id:a.id,name:a.name,file:'attachments/'+a.file,size:a.size,type:a.type,description:store.get(pre+'att.'+a.id+'.d',''),by:a.by,at:localISO(a.t)}));
 for(const [k,v] of store.entries(pre+'lk.')){const lid=k.slice((pre+'lk.').length);if(lid.includes('.')||!v||!v.to)continue;o.links.push({id:lid,to:v.to,type:v.type,note:v.note||'',by:v.by,at:localISO(v.t)})}return o}

/* ---------- references (المراجع): code, source, parent chain, targets ---------- */
function refList(store){store=store||CUR.eng;if(!store)return[];return store===CUR.eng?vcache('refs',()=>recs(store,'ref')):recs(store,'ref')}
function refById(id){return refList().find(r=>r.id===id)}
/* Node ids: wp:E-04 · pp:<procId> · att:<ownerTok>/<attId> · ref:<id> · f:<id> · a:<id> · r:<id> · acc:<accId> · doc:<tplId> · tb:<code> */
function nodeParse(n){n=String(n||'');const i=n.indexOf(':');return{t:n.slice(0,i),id:n.slice(i+1)}}
const NODET={wp:'ورقة عمل',pp:'إجراء',att:'مرفق',ref:'مرجع',f:'ملاحظة',a:'تسوية',r:'ملاحظة مراجعة',acc:'حساب',doc:'نموذج/تقرير',tb:'حساب في الميزان',risk:'خطر',ml:'بند خطاب الإدارة'};
function nodeInfo(n){const {t:tp,id}=nodeParse(n);const o={type:NODET[tp]||tp,title:id,href:'',alive:true};
 if(tp==='wp'){o.title=id+(WP[id]?' '+WP[id].ar:'');o.href=L('wp/'+encodeURIComponent(id));o.alive=wpAlive(id)}
 else if(tp==='pp'){const p=PIDX[id];o.title=p?p.tx.slice(0,90)+(p.tx.length>90?'…':''):id;o.href=p?L('proc/'+encodeURIComponent(id)):'';o.alive=!!p}
 else if(tp==='att'){const j=id.lastIndexOf('/');const tok=id.slice(0,j),aid=id.slice(j+1);const ow=OWN.parse(tok);const a=CUR.eng&&CUR.eng.get(OWN.pre(ow)+aid);o.title=(a?a.name:aid)+' — '+OWN.label(ow);o.alive=!!a;o.href=ow.t==='wp'?L('wp/'+encodeURIComponent(ow.id)):nodeInfo('pp:'+ow.id).href}
 else if(tp==='ref'){const r=refById(id);o.title=r?(r.code||'')+' '+(r.title||''):id;o.href=L('refs/'+encodeURIComponent(id));o.alive=!!r}
 else if(tp==='f'||tp==='a'||tp==='r'){const r=recs(CUR.eng,tp).find(x=>x.id===id);o.title=r?({f:'F-',a:'AJE-',r:'RN-'}[tp]+(r.no||'')+' '+String(r.desc||r.note||'').slice(0,70)):id;o.href=L('logs/'+tp);o.alive=!!r}
 else if(tp==='acc'){o.title=AC[id]?AC[id].n:id;o.href=L('acc/'+id);o.alive=!!AC[id]}
 else if(tp==='doc'){const d=TPLM[id];o.title=d?d.ar:id;o.href=L('form/'+encodeURIComponent(id));o.alive=!!d}
 else if(tp==='tb'){o.title=id;o.href=L('tb/'+encodeURIComponent(id))}
 return o}
const nodeLink=n=>{const i=nodeInfo(n);return `<span class="node"><span class="b">${esc(i.type)}</span> ${i.href?`<a href="${esc(i.href)}">${esc(i.title)}</a>`:esc(i.title)}${i.alive?'':' <span class="b bad">⚠ غير موجود</span>'}</span>`};
const NODE_OF=o=>o?(o.t+':'+o.id):'';
function nextRefCode(src){const all=refList();if(src&&src.t==='wp'){const n=all.filter(r=>r.src&&r.src.t==='wp'&&r.src.id===src.id).length+1;return src.id+'/'+n}
 if(src&&src.t==='att'){const tok=src.id.slice(0,src.id.lastIndexOf('/'));const ow=OWN.parse(tok);if(ow.t==='wp'){const n=all.filter(r=>r.code&&r.code.startsWith(ow.id+'/')).length+1;return ow.id+'/'+n}}
 return 'R-'+String(all.length+1).padStart(3,'0')}

/* ---------- relation graph (derived; persisted read-only as relations.json) ---------- */
const RELT={xref:'مرجع تقاطعي',supports:'يدعم',carried:'يُرحَّل إلى',derived:'مستمد من',depends:'يعتمد على',lead:'جدول رئيسي لـ',sample:'عينة من',supersedes:'يحل محل',evidence:'دليل لـ',source:'مصدر المرجع',target:'هدف المرجع',parent:'مرجع أب',finding:'ملاحظة على',account:'حساب',library:'حسب البرنامج',letter:'ورد في'};
function graphEdges(store,withLib){store=store||CUR.eng;const E=[];const add=(from,to,type,meta)=>E.push(Object.assign({from,to,type},meta||{}));
 for(const [k,v] of store.entries('')){if(!v)continue;let m;
  if((m=/^wp\.([^.]+)\.lk\.([^.]+)$/.exec(k))&&v.to)add('wp:'+m[1],'wp:'+v.to,v.type||'xref',{id:m[2],note:v.note||'',by:v.by,t:v.t,kind:'wp-link'});
  else if((m=/^wp\.([^.]+)\.att\.([^.]+)$/.exec(k))&&typeof v==='object')add('att:'+m[1]+'/'+m[2],'wp:'+m[1],'evidence',{kind:'attachment'});
  else if((m=/^pp\.(.+)\.lk\.([^.]+)$/.exec(k))&&v.to)add('pp:'+m[1],'wp:'+v.to,v.type||'xref',{id:m[2],note:v.note||'',by:v.by,t:v.t,kind:'procedure-link'});
  else if((m=/^pp\.(.+)\.att\.([^.]+)$/.exec(k))&&typeof v==='object')add('att:pp!'+m[1]+'/'+m[2],'pp:'+m[1],'evidence',{kind:'attachment'})}
 for(const r of recs(store,'ref')){const me='ref:'+r.id;if(r.src)add(NODE_OF(r.src),me,'source',{kind:'reference'});if(r.parent)add('ref:'+r.parent,me,'parent',{kind:'reference'});(r.targets||[]).forEach(t=>add(me,NODE_OF(t),'target',{kind:'reference'}))}
 for(const f of recs(store,'f')){if(f.ref)split(f.ref).forEach(x=>add('wp:'+x,'f:'+f.id,'finding',{kind:'finding'}));if(f.acc)add('acc:'+f.acc,'f:'+f.id,'finding',{kind:'finding'});if(f.proc)add('pp:'+f.proc,'f:'+f.id,'finding',{kind:'finding'});if(store.get('ml.f-'+f.id+'.inc',true)!==false&&f.status!=='Cleared')add('f:'+f.id,'doc:mgmtletter','letter',{kind:'management-letter'})}
 for(const a of recs(store,'a')){if(a.acc)add('acc:'+a.acc,'a:'+a.id,'account',{kind:'adjustment'})}
 if(withLib)for(const p of PROCS){if(store.get('st.'+p.id,'NS')==='NS'&&!store.get('nt.'+p.id))continue;split(p.wp).forEach(x=>{if(WP[x])add('pp:'+p.id,'wp:'+x,'library',{kind:'library'})})}
 return E}
function relationsSnapshot(store){const E=graphEdges(store,false);const nodes={};E.forEach(e=>{nodes[e.from]=1;nodes[e.to]=1});
 return{format:'MEAP-relations',version:1,generatedAt:localISO(),
  schema:{nodeTypes:{wp:'Working paper (ref)',pp:'Audit procedure (stable content id)',att:'Attachment (<owner>/<attachmentId>; owner = WP ref or pp!<procId>)',ref:'Reference record',f:'Finding',a:'Adjustment',r:'Review note',acc:'FS account (library id)',doc:'Form / report template instance',tb:'Trial balance account code'},
   edgeTypes:RELT,storage:{'wp.<ref>.lk.<id>':'{to,type,note,by,t}','pp.<procId>.lk.<id>':'{to,type,note,by,t}','pp.<procId>.att.<id>':'{name,size,type,file,by,t}','wp.<ref>.att.<id>':'{name,size,type,file,by,t}','ref.<id>.<field>':'code,title,note,src{t,id},parent,targets[{t,id}],by,t'}},
  counts:{nodes:Object.keys(nodes).length,edges:E.length},edges:E.map(e=>Object.assign({},e,{at:e.t?localISO(e.t):undefined,t:undefined}))}}
/* Lineage: walk the graph up (sources) and down (targets) from a node */
function lineage(start,dir,depth){const E=graphEdges(CUR.eng,true);const seen=new Set([start]);const walk=(n,d)=>{if(d>=depth)return[];const out=[];for(const e of E){const nx=dir==='up'?(e.to===n?e.from:null):(e.from===n?e.to:null);if(!nx||seen.has(nx))continue;seen.add(nx);out.push({n:nx,type:e.type,kids:walk(nx,d+1)})}return out};return walk(start,0)}
function lineageHTML(items){if(!items.length)return '<p class="mut small">—</p>';const li=x=>`<li><span class="mut small">${esc(RELT[x.type]||x.type)}:</span> ${nodeLink(x.n)}${x.kids.length?`<ul class="tree">${x.kids.map(li).join('')}</ul>`:''}</li>`;return `<ul class="tree">${items.map(li).join('')}</ul>`}

/* ---------- node picker (used for reference sources/targets) ---------- */
function nodeCandidates(tp,q){q=normAr(q||'');const hit=s=>!q||normAr(s).includes(q);const out=[];
 if(tp==='wp')Object.values(WP).forEach(w=>{if(hit(w.ref+' '+w.ar+' '+w.en))out.push('wp:'+w.ref)});
 else if(tp==='pp'){for(const p of PROCS){if(hit(p.tx+' '+p.sn)){out.push('pp:'+p.id);if(out.length>=60)break}}}
 else if(tp==='att'){for(const [k,v] of CUR.eng.entries('')){const m=/^(wp|pp)\.(.+)\.att\.([^.]+)$/.exec(k);if(m&&v&&typeof v==='object'&&hit(v.name))out.push('att:'+OWN.tok(m[1],m[2])+'/'+m[3])}}
 else if(tp==='ref')refList().forEach(r=>{if(hit((r.code||'')+' '+(r.title||'')))out.push('ref:'+r.id)});
 else if(tp==='f'||tp==='a'||tp==='r')recs(CUR.eng,tp).forEach(r=>{if(hit(String(r.desc||r.note||'')+' '+(r.no||'')))out.push(tp+':'+r.id)});
 else if(tp==='acc')A.forEach(a=>{if(hit(a.n+' '+a.en))out.push('acc:'+a.id)});
 else if(tp==='doc')TPL.forEach(d=>{if(hit(d.ar+' '+d.en+' '+d.isa))out.push('doc:'+d.id)});
 else if(tp==='tb'&&typeof TB!=='undefined')TB.search(q,60).forEach(r=>out.push('tb:'+r.code));
 return out.slice(0,60)}
function pickNode(title,types){return new Promise(res=>{let done=false;const fin=v=>{if(!done){done=true;res(v)}};
 const box=openDlg(`<h2>${esc(title)}</h2><div class="fgrid"><label>النوع<select class="sel" data-np="t">${(types||Object.keys(NODET).filter(x=>!['risk','ml'].includes(x))).map(x=>`<option value="${x}">${esc(NODET[x])}</option>`).join('')}</select></label><label>بحث<input class="in" data-np="q" autocomplete="off" placeholder="اكتب للبحث…"></label></div><ul class="np" role="listbox" aria-label="النتائج"></ul><div class="acts"><button type="button" class="btn g" data-x="0">${t('cancel')}</button></div>`,{label:title,onClose:v=>fin(v||null)});
 const draw=()=>{const tp=box.querySelector('[data-np=t]').value,q=box.querySelector('[data-np=q]').value;const c=nodeCandidates(tp,q);box.querySelector('.np').innerHTML=c.length?c.map(n=>`<li><button type="button" class="btn g sm" data-pick="${esc(n)}" role="option">${esc(nodeInfo(n).title)}</button></li>`).join(''):'<li class="mut">لا نتائج.</li>'};
 let tm=0;box.addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(draw,120)});box.addEventListener('change',e=>{if(e.target.matches('select'))draw()});
 box.addEventListener('click',e=>{const b=e.target.closest('[data-pick]');if(b){closeDlg(b.dataset.pick);return}const x=e.target.closest('[data-x]');if(x)closeDlg(null)});draw();box.querySelector('[data-np=q]').focus()})}

async function refCreate(srcNode){if(!can('edit'))return;const src=srcNode?nodeParse(srcNode):null;
 const r=await formDlg({title:'مرجع جديد',html:`${src?`<p class="small">المصدر: ${nodeLink(srcNode)}</p>`:''}<div class="fgrid"><label>رمز المرجع<input class="in" name="code" value="${esc(nextRefCode(src))}" required dir="ltr"></label><label class="full">العنوان / الوصف<input class="in" name="title" required></label><label>المرجع الأب (اختياري)<select class="sel" name="parent"><option value="">—</option>${refList().map(x=>`<option value="${esc(x.id)}">${esc((x.code||'')+' '+(x.title||''))}</option>`).join('')}</select></label><label class="full">ملاحظة<textarea class="ta" name="note"></textarea></label></div>`,ok:'إنشاء',
  onOk:async d=>{const id=uid('rf');const code=String(d.code).trim();if(refList().some(x=>x.code===code))throw new Error('رمز المرجع مستخدم بالفعل.');
   CUR.eng.setMany({[`ref.${id}.code`]:code,[`ref.${id}.title`]:String(d.title).trim(),[`ref.${id}.note`]:d.note||'',[`ref.${id}.src`]:src,[`ref.${id}.parent`]:d.parent||null,[`ref.${id}.targets`]:[],[`ref.${id}.by`]:SESSION.id,[`ref.${id}.t`]:Date.now()},{label:'مرجع جديد'});audit('ref.create',{code});return id}});
 if(r)location.hash=L('refs/'+encodeURIComponent(r))}

V.refs=function(){const q=(F.refq||'').trim();
 return `<h1>المراجع وتتبعها (References & Traceability)</h1><p class="sub">كل مرجع له رمز ومصدر (إجراء، ورقة عمل، مرفق، ملاحظة، حساب…) وأهداف متعددة ومرجع أب لبناء السلسلة. يُحفظ كل مرجع كملف مقروء في <code>references/</code> وتُجمع كل العلاقات في <code>relations.json</code>.</p>
 <div class="row noprint">${can('edit')?'<button class="btn" type="button" data-act="refnew">🔖 مرجع جديد</button>':''}<a class="btn g" href="${L('model')}">🧩 نموذج البيانات والعلاقات</a><label class="grow">بحث في المراجع<input class="in" type="search" data-fk="refq" data-fkb="refs" value="${esc(q)}" autocomplete="off"></label></div>
 <div data-block="refs">${refsTable()}</div>`};
function refsTable(){const list=refList();const nq=normAr(F.refq||'');const shown=nq?list.filter(r=>normAr((r.code||'')+' '+(r.title||'')+' '+(r.note||'')).includes(nq)):list;
 return `${shown.length?`<div class="tw"><table><thead><tr><th>الرمز</th><th>العنوان</th><th>المصدر</th><th>المرجع الأب</th><th>الأهداف</th><th>بواسطة</th></tr></thead><tbody>${shown.map(r=>{const par=r.parent&&refById(r.parent);return `<tr><td><a href="${L('refs/'+encodeURIComponent(r.id))}"><b dir="ltr">${esc(r.code||'')}</b></a></td><td class="tx">${esc(r.title||'')}</td><td>${r.src?nodeLink(NODE_OF(r.src)):'<span class="mut">—</span>'}</td><td>${par?`<a href="${L('refs/'+encodeURIComponent(par.id))}">${esc(par.code)}</a>`:'—'}</td><td>${(r.targets||[]).length}</td><td class="sm">${esc(USERS.nameOf(r.by))} · ${fmtDT(r.t)}</td></tr>`}).join('')}</tbody></table></div>`:`<div class="empty"><p>لا توجد مراجع بعد.</p><p class="mut small">أنشئ مرجعًا من هنا، أو من لوحة «📎 مرفقات وروابط» في أي إجراء، أو من زر «🔖 مرجع» بجانب أي مرفق.</p></div>`}`}
BLOCKS.refs=()=>refsTable();
V.ref1=function(id){const r=refById(id);if(!r)return `<div class="note bad">المرجع غير موجود (ربما حُذف).</div><p><a href="${L('refs')}">العودة إلى المراجع</a></p>`;const me='ref:'+id;const ed=can('edit');
 const kids=refList().filter(x=>x.parent===id);const chainUp=[];let p=r.parent,guard=0;while(p&&guard++<20){const pr=refById(p);if(!pr)break;chainUp.unshift(pr);p=pr.parent}
 return `<h1>🔖 <span dir="ltr">${esc(r.code||'')}</span> — ${esc(r.title||'')}</h1>
 <div class="card"><div class="fgrid"><label>الرمز${edcIn('ref.'+id+'.code')}</label><label class="full">العنوان${edcIn('ref.'+id+'.title')}</label><label class="full">ملاحظة</label>${edc('ref.'+id+'.note',{label:'ملاحظة المرجع'})}</div>
 <div class="kv"><div>المصدر</div><div>${r.src?nodeLink(NODE_OF(r.src)):'—'} ${ed?`<button class="btn g sm noprint" type="button" data-act="refsrc" data-id="${esc(id)}">تغيير</button>`:''}</div>
 <div>السلسلة (Chain)</div><div>${chainUp.map(x=>`<a href="${L('refs/'+encodeURIComponent(x.id))}" dir="ltr">${esc(x.code)}</a>`).join(' ← ')}${chainUp.length?' ← ':''}<b dir="ltr">${esc(r.code)}</b>${kids.length?' ← '+kids.map(x=>`<a href="${L('refs/'+encodeURIComponent(x.id))}" dir="ltr">${esc(x.code)}</a>`).join('، '):''}</div>
 <div>المرجع الأب</div><div>${ed?`<select class="sel" data-k="ref.${esc(id)}.parent" data-dv="" aria-label="المرجع الأب"><option value="">—</option>${refList().filter(x=>x.id!==id).map(x=>`<option value="${esc(x.id)}"${r.parent===x.id?' selected':''}>${esc((x.code||'')+' '+(x.title||''))}</option>`).join('')}</select>`:(r.parent?nodeLink('ref:'+r.parent):'—')}</div>
 <div>أنشأه</div><div>${esc(USERS.nameOf(r.by))} · ${fmtDT(r.t)}</div></div></div>
 <h2>الأهداف المرتبطة (أوراق عمل، مرفقات، مراجع، ملاحظات…) <span class="cnt">${(r.targets||[]).length}</span></h2>
 ${(r.targets||[]).length?`<ul class="lkl">${r.targets.map((x,i)=>`<li>${nodeLink(NODE_OF(x))}${ed?` <button class="btn d sm noprint" type="button" data-act="reftgdel" data-id="${esc(id)}" data-i="${i}" aria-label="إزالة الهدف">✕</button>`:''}</li>`).join('')}</ul>`:'<p class="mut">لا توجد أهداف بعد.</p>'}
 ${ed?`<div class="row noprint"><button class="btn sm" type="button" data-act="reftgadd" data-id="${esc(id)}">+ إضافة هدف</button><button class="btn g sm" type="button" data-act="refnew" data-src="${esc(me)}">مرجع فرعي من هذا المرجع</button><button class="btn d sm" type="button" data-act="refdel" data-id="${esc(id)}">حذف المرجع</button></div>`:''}
 <h2>تتبع المصدر (Upstream)</h2>${lineageHTML(lineage(me,'up',5))}
 <h2>ما يترتب عليه (Downstream)</h2>${lineageHTML(lineage(me,'down',5))}`};
/* single-line editable input bound to a key */
function edcIn(k){return `<input class="in" data-k="${esc(k)}" value="${esc(G(k,''))}"${RO()?' readonly':''}>`}

/* ---------- data model page (output #1: the relationship structure) ---------- */
V.model=function(){const E=graphEdges(CUR.eng,false);const cnt={};E.forEach(e=>{cnt[e.kind]=(cnt[e.kind]||0)+1});const nAtt=E.filter(e=>e.kind==='attachment').length;
 const ent=[['الإجراء (Procedure)','pp:<procId>','مكتبة البرنامج + st/nt + pp.<id>.att/lk','procedures/<id>__<text>/data.json + attachments/'],['ورقة العمل (Working Paper)','wp:<ref>','wp.<ref>.*','working-papers/<ref>__<name>/data.json, links.json, attachments/'],['المرفق (Attachment)','att:<owner>/<id>','wp.<ref>.att.<id> · pp.<procId>.att.<id>','الملف الأصلي داخل attachments/ للمالك'],['المرجع (Reference)','ref:<id>','ref.<id>.{code,title,note,src,parent,targets,by,t}','references/<id>.json'],['الملاحظة (Finding)','f:<id>','f.<id>.*','findings/<id>.json'],['التسوية (Adjustment)','a:<id>','a.<id>.*','adjustments/<id>.json'],['الحساب (FS Account)','acc:<id>','مكتبة الحسابات (60)','—'],['حساب الميزان (TB Account)','tb:<code>','tb/v<n>/rows-*.json + tbm.<code>','tb/'],['النموذج/التقرير (Document)','doc:<tplId>','doc.<id>.{o,v,s}.*','documents/<id>/data.json']];
 return `<h1>🧩 نموذج البيانات والعلاقات (Data Model)</h1><p class="sub">الإجراءات ↔ المرفقات ↔ أوراق العمل ↔ المراجع. كل علاقة حافة موجهة (from → to) لها نوع؛ تُحفظ مصادرها في سجلات العمليات وتُولَّد قراءتها الكاملة في <code>relations.json</code> داخل مجلد الارتباط بعد كل حفظ.</p>
 <figure class="card model-fig" aria-label="مخطط العلاقات"><svg viewBox="0 0 640 300" role="img" aria-labelledby="mdT"><title id="mdT">مخطط العلاقات بين الكيانات</title>
 <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="currentColor"/></marker></defs>
 <g class="mdl" font-size="13" text-anchor="middle">
 <rect x="20" y="20" width="150" height="46" rx="10"/><text x="95" y="48">حساب الميزان (tb)</text>
 <rect x="245" y="20" width="150" height="46" rx="10"/><text x="320" y="48">الحساب (acc)</text>
 <rect x="470" y="20" width="150" height="46" rx="10"/><text x="545" y="48">النموذج (doc)</text>
 <rect x="20" y="130" width="150" height="46" rx="10"/><text x="95" y="158">الإجراء (pp)</text>
 <rect x="245" y="130" width="150" height="46" rx="10"/><text x="320" y="158">ورقة العمل (wp)</text>
 <rect x="470" y="130" width="150" height="46" rx="10"/><text x="545" y="158">الملاحظة (f)</text>
 <rect x="20" y="236" width="150" height="46" rx="10"/><text x="95" y="264">المرفق (att)</text>
 <rect x="245" y="236" width="150" height="46" rx="10"/><text x="320" y="264">المرجع (ref)</text>
 <rect x="470" y="236" width="150" height="46" rx="10"/><text x="545" y="264">التسوية (a)</text></g>
 <g class="mde" fill="none" stroke-width="1.6" marker-end="url(#ar)"><path d="M170 43H243"/><path d="M170 153H243"/><path d="M95 234V178"/><path d="M320 234V178"/><path d="M395 153H468"/><path d="M545 128V68"/><path d="M320 128V68"/><path d="M170 259H243"/><path d="M395 259H468"/><path d="M380 236L470 176"/></g>
 <g font-size="11" class="mdt" text-anchor="middle"><text x="207" y="36">ربط</text><text x="207" y="146">روابط متعددة</text><text x="80" y="208">دليل</text><text x="338" y="208">هدف/مصدر</text><text x="432" y="146">ملاحظة على</text><text x="562" y="100">خطاب الإدارة</text><text x="337" y="100">جدول رئيسي</text><text x="207" y="252">مصدر</text><text x="432" y="252">هدف</text></g></svg></figure>
 <h2>الكيانات</h2><div class="tw"><table><thead><tr><th>الكيان</th><th>معرّف العقدة</th><th>التخزين (مفاتيح سجل العمليات)</th><th>الملف المقروء</th></tr></thead><tbody>${ent.map(e=>`<tr><td><b>${esc(e[0])}</b></td><td dir="ltr"><code>${esc(e[1])}</code></td><td dir="ltr" class="sm">${esc(e[2])}</td><td dir="ltr" class="sm">${esc(e[3])}</td></tr>`).join('')}</tbody></table></div>
 <h2>أنواع العلاقات وعددها الحالي في هذا الارتباط</h2><div class="tw"><table><thead><tr><th>النوع</th><th>المعنى</th><th>العدد</th></tr></thead><tbody>${[['wp-link','ورقة ↔ ورقة (روابط متعددة بأنواع)'],['procedure-link','إجراء ↔ أوراق عمل (روابط متعددة)'],['attachment','مرفق → مالكه (ورقة أو إجراء)'],['reference','مرجع: مصدر / هدف / أب'],['finding','ملاحظة ← ورقة / حساب / إجراء'],['management-letter','ملاحظة → خطاب الإدارة'],['adjustment','تسوية ← حساب'],['library','إجراء → ورقة عمل (حسب البرنامج، ثابت)']].map(x=>`<tr><td dir="ltr"><code>${x[0]}</code></td><td>${esc(x[1])}</td><td>${x[0]==='library'?'ثابت':(cnt[x[0]]||0)}</td></tr>`).join('')}</tbody></table></div>
 <p class="row noprint"><button class="btn g" type="button" data-act="reldl">تنزيل relations.json</button><span class="mut small">إجمالي الحواف الحالية: ${E.length} · المرفقات: ${nAtt}</span></p>`};

/* single procedure page (deep-linkable from references, letters, search) */
V.proc=function(id){const p=PIDX[id];if(!p)return `<div class="note bad">الإجراء غير موجود في المكتبة.</div>`;
 return `<h1>إجراء مراجعة</h1><p class="sub"><span class="mut">${SRCN[p.src]}:</span> <a href="${L(srcHref(p))}">${esc(p.sn)}</a> · ${ptB(p.t)} ${asB(p.as)} ${isaL(p.isa)}</p>
 <div class="card"><p class="tx"><b>${esc(p.tx)}</b></p><div class="kv"><div>الدليل المطلوب</div><div>${esc(p.ev)}</div><div>أوراق العمل (البرنامج)</div><div>${wpL(p.wp)}</div><div>الحالة</div><div>${stSel(p.id)}</div></div>${noteBox(p.id)}</div>
 <h2>المرفقات والروابط والمراجع</h2><div class="card" data-block="pp|${esc(id)}">${ppHTML(id)}</div>
 <h2>الملاحظات المرتبطة</h2>${(()=>{const fs=recs(CUR.eng,'f').filter(f=>f.proc===id);return fs.length?`<ul class="lkl">${fs.map(f=>`<li>${nodeLink('f:'+f.id)}</li>`).join('')}</ul>`:'<p class="mut">لا توجد.</p>'})()}
 <h2>التتبع</h2>${lineageHTML(lineage('pp:'+id,'down',4))}`};
