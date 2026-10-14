/* ===== وحدة الاستفسارات الديناميكية (Inquiries) =====
   مكتبة قياسية (21-iq-lib.js) تظهر داخل أوراق العمل المناسبة، مع: جهة موجّه إليها، حالة، تاريخ، إجابة، مرفقات، ربط بأوراق أخرى،
   وإضافة استفسارات مخصصة. تُجمَّع كلها في تبويب «الاستفسارات» مع مصفوفة تغطية المعايير.
   مفاتيح التخزين:  iq.<host>~<id>.<st|to|due|a|lk|t|x>   ·   iq.<host>._cus (مخصصة)   ·   المرفقات: iq!<host>~<id> */
const IQ_ST=[['nr','لم يُوجَّه'],['rq','تم التوجيه'],['an','تم الرد'],['fu','يحتاج متابعة'],['ok','مستوفى'],['na','لا ينطبق']];
const IQ_STL=Object.fromEntries(IQ_ST);
const IQ_PEND=new Set(['rq','fu']),IQ_DONE=new Set(['an','ok','na']);
const IQK=(host,id,f)=>'iq.'+host+'~'+id+'.'+f;
let IQ_CACHE=null;
function iqLib(){if(IQ_CACHE)return IQ_CACHE;const by=new Map(),common=[];let cur=null;
 const res=t=>{const o=[];for(const x of String(t||'').split(/\s+/).filter(Boolean)){if(CT.items[x])o.push(x);else if(CT.areaBy[x])o.push(CT.areaBy[x].main)}return o};
 for(const ln of String(typeof IQ_SRC!=='undefined'?IQ_SRC:'').split('\n')){const s=ln.trim();if(!s)continue;
  if(s[0]==='@'){const p=s.slice(1).split('|');if(p[0]==='host'){const h=p[1];cur={host:h,title:p[2]||'',items:[],isCommon:false};if(!by.has(h))by.set(h,[]);by.get(h).push(cur)}
   else if(p[0]==='area'){if(p[1]==='COMMON'){cur={host:'*',title:p[2],items:[],isCommon:true};common.push(cur)}else{const a=CT.areaBy[p[1]];if(!a){cur=null;continue}cur={host:a.main,title:p[2]||a.ar,items:[],isCommon:false,area:p[1]};if(!by.has(a.main))by.set(a.main,[]);by.get(a.main).push(cur)}}continue}
  if(!cur)continue;const f=s.split('|');if(!f[0])continue;cur.items.push({t:f[0],to:f[1]||'M',isa:f[2]||'',lk:res(f[3])})}
 /* ترقيم ثابت */
 const hosts=new Map();
 for(const [h,groups] of by){let n=0;const list=[];for(const g of groups)for(const it of g.items){n++;list.push(Object.assign({id:'q'+n,host:h,grp:g.title},it))}hosts.set(h,list)}
 let cn=0;const com=[];for(const g of common)for(const it of g.items){cn++;com.push(Object.assign({id:'c'+cn,grp:g.title},it))}
 IQ_CACHE={hosts,common:com};return IQ_CACHE}
const iqIsAreaMain=ref=>!!Object.values(CT.areaBy).find(a=>a.main===ref);
const iqHostable=ref=>{const it=CT.items[ref];if(!it)return false;if(iqIsAreaMain(ref))return true;return ['PL','RA','RR','CO'].includes(it.sec)&&!it.area};
function iqCustoms(host){const v=G('iq.'+host+'._cus',null);return Array.isArray(v)?v:[]}
function iqHostRows(host){const lib=iqLib();let base=(lib.hosts.get(host)||[]).slice();
 if(iqIsAreaMain(host))for(const c of lib.common)base.push(Object.assign({host,isCommon:true},c));
 for(const c of iqCustoms(host))base.push({id:c.id,host,t:c.t,to:c.to||'M',isa:c.isa||'',lk:c.lk||[],grp:'استفسارات مضافة',custom:true});
 return base.map(b=>iqRow(host,b))}
function iqRow(host,b){const id=b.id;const g=f=>G(IQK(host,id,f),'');const st=g('st')||'nr';const hid=g('x')==='h';
 const lkS=G(IQK(host,id,'lk'),null);const lk=Array.isArray(lkS)?lkS:b.lk;const due=g('due');
 const t=g('t')||b.t;const today=new Date().toISOString().slice(0,10);
 return{key:host+'~'+id,host,id,t,t0:b.t,to:g('to')||b.to,isa:b.isa,grp:b.grp,custom:!!b.custom,common:!!b.isCommon,st,hid,lk,due,a:g('a'),
  open:IQ_PEND.has(st)||st==='nr',pend:IQ_PEND.has(st),done:IQ_DONE.has(st),od:!!(due&&due<today&&!IQ_DONE.has(st)&&st!=='ok')}}
function iqStats(rows){const s={tot:0,nr:0,rq:0,an:0,fu:0,ok:0,na:0,od:0};for(const r of rows){if(r.hid)continue;s.tot++;s[r.st]++;if(r.od)s.od++}
 const act=s.tot-s.na;s.res=s.an+s.ok;s.pct=act?Math.round(s.res/act*100):100;s.pend=s.rq+s.fu;return s}
function iqAll(){return vcache('iqall',()=>{const lib=iqLib();const hs=new Set([...lib.hosts.keys()]);for(const [k] of CUR.eng.entries('iq.')){const m=/^iq\.([^.~]+)\./.exec(k);if(m&&CT.items[m[1]])hs.add(m[1])}
 for(const a of Object.values(CT.areaBy))hs.add(a.main);const out=[];
 for(const h of hs){if(!CT.items[h]||ctOff(h))continue;for(const r of iqHostRows(h))out.push(r)}return out})}
function iqLinked(ref){return iqAll().filter(r=>!r.hid&&r.host!==ref&&r.lk.includes(ref))}
/* ---------- واجهة الورقة ---------- */
function iqRowHTML(r){const ro=RO();const k=f=>esc(IQK(r.host,r.id,f));const na=iqAttCount(r);
 const toOpts=Object.entries(IQ_TO).map(([c,l])=>`<option value="${c}"${r.to===c?' selected':''}>${esc(l)}</option>`).join('');
 const lks=r.lk.length?`<span class="iq-lks">${wpL(r.lk)}</span>`:'';
 return `<div class="iqr st-${r.st}${r.od?' od':''}${r.hid?' hid':''}" data-iq="${esc(r.key)}">
 <div class="iq-q"><span class="iq-t">${esc(r.t)}</span>${r.isa?`<span class="iq-isa" dir="ltr">${esc(r.isa)}</span>`:''}${r.custom?'<span class="iq-cu">مضاف</span>':''}</div>
 <div class="iq-f"><select class="sel iq-to" data-k="${k('to')}" data-dv="${esc(r.to)}" data-iqf="${esc(r.key)}" aria-label="موجّه إلى"${ro?' disabled':''}>${toOpts}</select>
  <select class="sel iq-st" data-k="${k('st')}" data-dv="nr" data-iqf="${esc(r.key)}" data-iqst="1" aria-label="الحالة"${ro?' disabled':''}>${IQ_ST.map(([c,l])=>`<option value="${c}"${r.st===c?' selected':''}>${esc(l)}</option>`).join('')}</select>
  <input class="in iq-due" type="date" dir="ltr" data-k="${k('due')}" data-iqf="${esc(r.key)}" value="${esc(r.due)}" aria-label="تاريخ الاستحقاق" title="تاريخ الاستحقاق"${ro?' readonly':''}>
  <button class="btn g sm iq-ib noprint" type="button" data-iq-act="x" data-key="${esc(r.key)}" aria-label="الرد والمرفقات" title="الرد والمرفقات">💬${na?` <b class="iq-n">${na}</b>`:''}</button></div>
 <div class="iq-x" data-xkey="${esc(r.key)}"${r.a||IQUI.open.has(r.key)?'':' hidden'}>
  <label class="fl">الرد / النتيجة<textarea class="ta" rows="2" data-k="${k('a')}" data-iqf="${esc(r.key)}" placeholder="ملخص رد الجهة المستفسَر منها، ومن أجاب وتاريخه…"${ro?' readonly':''}>${esc(r.a)}</textarea></label>
  <div class="iq-lkrow">${lks}${ro?'':`<button class="btn g sm noprint" type="button" data-iq-act="lk" data-key="${esc(r.key)}">🔗 ربط بأوراق</button>`}${ro?'':(r.custom?`<button class="btn d sm noprint" type="button" data-iq-act="del" data-key="${esc(r.key)}">حذف</button>`:`<button class="btn g sm noprint" type="button" data-iq-act="hide" data-key="${esc(r.key)}">${r.hid?'إظهار':'إخفاء (لا ينطبق على العميل)'}</button>`)}</div>
  <div class="iq-att"><b class="small">المرفقات (ردود، مراسلات، مستندات)</b><div data-block="att|iq!${esc(r.key)}">${attHTML('iq!'+r.key)}</div></div></div></div>`}
const IQUI={open:new Set(),showHid:false};
function iqAttCount(r){try{return attListO(CUR.eng,OWN.parse('iq!'+r.key)).length}catch(e){return 0}}
function iqPanel(ref){const rows=iqHostRows(ref);const S=iqStats(rows);const lnk=iqLinked(ref);
 return `<details class="wpx iqp noprint-x" id="wp-iq"${S.pend||S.od?' open':''}><summary>الاستفسارات <span class="cnt">${S.res}/${S.tot-S.na}</span>${S.pend?` <span class="cnt warn">${S.pend} معلّق</span>`:''}${S.od?` <span class="cnt bad">${S.od} متأخر</span>`:''}</summary><div data-block="iq|${esc(ref)}">${iqBody(ref)}</div></details>`}
function iqBody(ref){const rows=iqHostRows(ref);const vis=rows.filter(r=>IQUI.showHid||!r.hid);const S=iqStats(rows);const hidN=rows.filter(r=>r.hid).length;const lnk=iqLinked(ref);
 const groups=[];for(const r of vis){let g=groups.find(x=>x.t===r.grp);if(!g){g={t:r.grp,rows:[]};groups.push(g)}g.rows.push(r)}
 return `<div class="iq-bar noprint"><div class="iq-prog"><span>${S.pct}%</span>${bar(S.pct)}</div>
  <div class="iq-acts">${RO()?'':`<button class="btn g sm" type="button" data-iq-act="add" data-host="${esc(ref)}">+ استفسار</button><button class="btn g sm" type="button" data-iq-act="allrq" data-host="${esc(ref)}" title="تحويل «لم يُوجَّه» إلى «تم التوجيه»">توجيه الكل</button>`}<a class="btn g sm" href="${L('queries')}">كل الاستفسارات ←</a>${hidN?`<button class="btn g sm" type="button" data-iq-act="showhid" data-host="${esc(ref)}">${IQUI.showHid?'إخفاء':'عرض'} المخفية (${hidN})</button>`:''}</div></div>
  ${groups.length?groups.map(g=>`<div class="iq-grp"><h4>${esc(g.t)}</h4>${g.rows.map(iqRowHTML).join('')}</div>`).join(''):'<p class="mut">لا توجد استفسارات قياسية لهذه الورقة. أضف استفسارًا مخصصًا إن لزم.</p>'}
  ${lnk.length?`<div class="iq-in"><b class="small">استفسارات من أوراق أخرى مرتبطة بهذه الورقة (${lnk.length})</b>${lnk.slice(0,12).map(r=>`<div class="iq-inr st-${r.st}"><a class="wpl" href="${L('wp/'+encodeURIComponent(r.host))}">${esc(CT.items[r.host].disp)}</a> ${esc(r.t)} <span class="iq-b st-${r.st}">${esc(IQ_STL[r.st])}</span></div>`).join('')}</div>`:''}`}
BLOCKS.iq=ref=>iqBody(ref);
const _ctPageIQ=ctPage;
ctPage=function(it,opt){let h=_ctPageIQ(it,opt);try{if(iqHostable(it.ref)){const m='<h3>الاستنتاج (Conclusion)</h3>';const i=h.indexOf(m);if(i>=0)h=h.slice(0,i)+iqPanel(it.ref)+pbPaperPanel(it.ref)+h.slice(i)}}catch(e){logErr('iq panel',e)}return h};
function pbPaperPanel(ref){try{if(typeof pbForPaper!=='function')return'';const rows=pbForPaper(ref);if(!rows.length)return'';const S=pbStats(rows);
 return `<details class="wpx pbpp" id="wp-pbc"><summary>متطلبات العميل المرتبطة <span class="cnt">${S.done}/${S.tot}</span>${S.od?` <span class="cnt bad">${S.od} متأخر</span>`:''}</summary><div data-block="pbpaper|${esc(ref)}">${BLOCKS.pbpaper(ref)}</div></details>`}catch(e){return''}}
/* ---------- تحديث موضعي ---------- */
function iqSplit(key){const i=key.indexOf('~');return[key.slice(0,i),key.slice(i+1)]}
function iqRefreshRow(key){const w=document.querySelector(`.iqr[data-iq="${CSS.escape(key)}"]`);if(!w)return;const[h,id]=iqSplit(key);const r=iqHostRows(h).find(x=>x.id===id);if(!r)return;
 w.className=`iqr st-${r.st}${r.od?' od':''}${r.hid?' hid':''}`;const p=w.closest('.iqp');if(p){const S=iqStats(iqHostRows(h));const sm=p.querySelector(':scope>summary');if(sm)sm.innerHTML=`الاستفسارات <span class="cnt">${S.res}/${S.tot-S.na}</span>${S.pend?` <span class="cnt warn">${S.pend} معلّق</span>`:''}${S.od?` <span class="cnt bad">${S.od} متأخر</span>`:''}`;const pg=p.querySelector('.iq-prog');if(pg)pg.innerHTML=`<span>${S.pct}%</span>${bar(S.pct)}`}
 try{refreshTabCounts&&refreshTabCounts()}catch(e){}}
document.addEventListener('change',e=>{const t=e.target.closest&&e.target.closest('[data-iqf]');if(!t)return;setTimeout(()=>iqRefreshRow(t.dataset.iqf),30)});
document.addEventListener('input',e=>{const t=e.target.closest&&e.target.closest('textarea[data-iqf]');if(!t)return;const key=t.dataset.iqf;clearTimeout(t._iqt);t._iqt=setTimeout(()=>iqRefreshRow(key),600)});
function iqRerender(host){IQUI.keep=1;try{refreshBlock('iq|'+host)}catch(e){}const ee=document.querySelector('[data-block^="iqall|"]');if(ee)try{refreshBlock(ee.dataset.block)}catch(e){}}
document.addEventListener('click',async e=>{const b=e.target.closest&&e.target.closest('[data-iq-act]');if(!b)return;e.preventDefault();const a=b.dataset.iqAct;
 if(a==='x'){const key=b.dataset.key;const w=document.querySelector(`.iq-x[data-xkey="${CSS.escape(key)}"]`);if(!w)return;w.hidden=!w.hidden;if(w.hidden)IQUI.open.delete(key);else IQUI.open.add(key);return}
 if(a==='add')return iqAddDlg(b.dataset.host);
 if(a==='showhid'){IQUI.showHid=!IQUI.showHid;return iqRerender(b.dataset.host)}
 if(a==='allrq'){const h=b.dataset.host;let n=0;CUR.eng.setMany&&0;for(const r of iqHostRows(h)){if(!r.hid&&r.st==='nr'){CUR.eng.set(IQK(h,r.id,'st'),'rq',{label:'توجيه استفسار'});if(!r.due){}n++}}toast(n?`وُجّه ${n} استفسارًا`:'لا استفسارات جديدة',n?'ok':'');return iqRerender(h)}
 const[h,id]=iqSplit(b.dataset.key||'~');
 if(a==='hide'){const r=iqHostRows(h).find(x=>x.id===id);CUR.eng.set(IQK(h,id,'x'),r&&r.hid?null:'h',{label:'إخفاء استفسار'});return iqRerender(h)}
 if(a==='del'){if(!await ask({title:'حذف الاستفسار',body:'سيُحذف هذا الاستفسار المضاف وكل بياناته.',ok:'حذف',danger:true}))return;CUR.eng.set('iq.'+h+'._cus',iqCustoms(h).filter(c=>c.id!==id),{label:'حذف استفسار مضاف'});return iqRerender(h)}
 if(a==='lk')return iqLinkDlg(h,id)});
async function iqLinkDlg(h,id){const r=iqHostRows(h).find(x=>x.id===id);if(!r)return;const cands=refCandidates().filter(x=>x[0]!==h);const cur=new Set(r.lk);
 const res=await formDlg({title:'ربط الاستفسار بأوراق العمل',html:`<p class="mut small">اختر أوراق العمل المتصلة بهذا الاستفسار؛ سيظهر في تلك الأوراق ضمن «استفسارات مرتبطة».</p><label class="fl">بحث<input class="in" data-refq placeholder="جزء من الرقم أو الاسم…"></label><div class="pblkbox">${cands.map(x=>`<label class="pblk" data-q="${esc(normAr(x[1]))}"><input type="checkbox" name="lk_${esc(x[0])}"${cur.has(x[0])?' checked':''}> <span>${esc(x[1])}</span></label>`).join('')}</div>`,
  ok:'حفظ',after:box=>{const q=box.querySelector('[data-refq]');q.addEventListener('input',()=>{const v=normAr(q.value);box.querySelectorAll('.pblk').forEach(l=>{l.hidden=v&&!l.dataset.q.includes(v)})})},
  onOk:async d=>Object.keys(d).filter(k=>k.startsWith('lk_')&&d[k]).map(k=>k.slice(3))});
 if(!res)return;CUR.eng.set(IQK(h,id,'lk'),res,{label:'ربط استفسار بأوراق العمل'});iqRerender(h)}
async function iqAddDlg(host){const res=await formDlg({title:'إضافة استفسار',html:`<div class="fgrid"><label class="full">نص الاستفسار<textarea class="ta" name="t" rows="3" required placeholder="اكتب الاستفسار الموجّه…"></textarea></label>
  <label>موجّه إلى<select class="sel" name="to">${Object.entries(IQ_TO).map(([c,l])=>`<option value="${c}">${esc(l)}</option>`).join('')}</select></label><label>المعيار / المرجع<input class="in" name="isa" dir="ltr" placeholder="ISA 500"></label><label>الاستحقاق<input class="in" type="date" name="due" dir="ltr"></label></div>`,ok:'إضافة',
  onOk:async d=>String(d.t||'').trim()?d:null});
 if(!res)return;const list=iqCustoms(host);const id='u'+Date.now().toString(36);list.push({id,t:res.t.trim(),to:res.to||'M',isa:res.isa||''});
 CUR.eng.set('iq.'+host+'._cus',list,{label:'إضافة استفسار'});if(res.due)CUR.eng.set(IQK(host,id,'due'),res.due);IQUI.open.add(host+'~'+id);iqRerender(host)}
/* attachments: owner type iq */
(function(){const _label=OWN.label,_dir=OWN.dir;
 OWN.label=function(o){if(o.t==='iq'){const[h,id]=iqSplit(o.id);const r=iqHostRows(h).find(x=>x.id===id);return 'استفسار '+(CT.items[h]?CT.items[h].disp:h)+': '+(r?r.t:id)}return _label.call(OWN,o)};
 OWN.dir=function(store,o){if(o.t==='iq')return store.path+'/inquiries/attachments/'+sanitizeName(o.id.replace('~','_'),40);return _dir.call(OWN,store,o)};
 const _add=attAdd;attAdd=async function(tok,files){await _add(tok,files);if(/^iq!/.test(tok)){const key=tok.slice(3);const[h,id]=iqSplit(key);const r=iqHostRows(h).find(x=>x.id===id);if(r&&(r.st==='nr'||r.st==='rq'))CUR.eng.set(IQK(h,id,'st'),'an',{label:'استلام رد على الاستفسار'});IQUI.open.add(key);iqRerender(h)}};
 const _del=attDel;attDel=async function(tok,id){await _del(tok,id);if(/^iq!/.test(tok)){const[h]=iqSplit(tok.slice(3));iqRerender(h)}}})();
/* ---------- صفحة الاستفسارات المجمّعة ---------- */
const IQALL={st:'',to:'',q:'',isa:'',grp:'pend'};
function iqLegacyAll(){const m=new Map();for(const[k,v] of CUR.eng.entries('wp.')){if(k.indexOf('.cg.qry')<0)continue;const m2=/^wp\.([^.]+)\.cg\.(qry[^.]*)\.v\.([^.]+)\.([^.]+)$/.exec(k);if(!m2)continue;const key=m2[1]+'|'+m2[2]+'|'+m2[3];const o=m.get(key)||{ref:m2[1],gid:m2[2],rid:m2[3]};o[m2[4]]=v;o.k=key;m.set(key,o)}return[...m.values()].filter(o=>String(o.q||'').trim())}
function iqIsaCoverage(rows){const m=new Map();for(const r of rows){if(r.hid||r.st==='na')continue;for(const x of String(r.isa||'').split('·').map(s=>s.trim()).filter(Boolean)){const o=m.get(x)||{n:0,d:0,p:0};o.n++;if(r.st==='an'||r.st==='ok')o.d++;if(IQ_PEND.has(r.st))o.p++;m.set(x,o)}}
 return[...m.entries()].sort((a,b)=>a[0].localeCompare(b[0],'en',{numeric:true}))}
function iqFilter(rows){const q=normAr(IQALL.q||'');return rows.filter(r=>{if(r.hid)return false;if(IQALL.grp==='pend'&&!(r.pend||r.od))return false;if(IQALL.grp==='done'&&!r.done)return false;if(IQALL.grp==='nr'&&r.st!=='nr')return false;
 if(IQALL.st&&r.st!==IQALL.st)return false;if(IQALL.to&&r.to!==IQALL.to)return false;if(IQALL.isa&&!r.isa.includes(IQALL.isa))return false;if(q&&!normAr(r.t+' '+(CT.items[r.host]?CT.items[r.host].ar:'')+' '+r.a).includes(q))return false;return true})}
function iqPageBody(){const all=iqAll();const S=iqStats(all);const f=iqFilter(all);const cov=iqIsaCoverage(all);const leg=iqLegacyAll();
 const kp=(l,v,c)=>`<div class="iq-kpi ${c||''}"><b>${v}</b><span>${l}</span></div>`;
 const byHost=[];for(const r of f){let g=byHost.find(x=>x.h===r.host);if(!g){g={h:r.host,rows:[]};byHost.push(g)}g.rows.push(r)}
 const sel=(id,v,opts)=>`<select class="sel" data-iqq="${id}">${opts.map(([k,l])=>`<option value="${esc(k)}"${v===k?' selected':''}>${esc(l)}</option>`).join('')}</select>`;
 const isas=[...new Set(all.flatMap(r=>String(r.isa||'').split('·').map(s=>s.trim()).filter(Boolean)))].sort((a,b)=>a.localeCompare(b,'en',{numeric:true}));
 return `<div class="iq-kpis">${kp('إجمالي الاستفسارات',S.tot)}${kp('لم تُوجَّه',S.nr)}${kp('معلّقة (موجّهة/متابعة)',S.pend,S.pend?'warn':'')}${kp('متأخرة',S.od,S.od?'bad':'')}${kp('مُستوفاة',S.res,'ok')}<div class="iq-kpi big"><b>${S.pct}%</b><span>نسبة الاستيفاء</span>${bar(S.pct)}</div></div>
 <div class="iq-flt noprint">${sel('grp',IQALL.grp,[['pend','المعلّقة والمتأخرة'],['nr','غير الموجّهة'],['done','المستوفاة'],['all','الكل']])}${sel('st',IQALL.st,[['','كل الحالات'],...IQ_ST])}${sel('to',IQALL.to,[['','كل الجهات'],...Object.entries(IQ_TO)])}${sel('isa',IQALL.isa,[['','كل المعايير'],...isas.map(x=>[x,x])])}<input class="in" data-iqq="q" value="${esc(IQALL.q)}" placeholder="بحث…">
  <span class="mut small">${f.length} نتيجة</span><span class="sp"></span><button class="btn g sm" type="button" data-iqx="xlsx">⤓ Excel</button><button class="btn g sm" type="button" data-iqx="print">🖨 طباعة</button></div>
 ${byHost.length?byHost.map(g=>{const it=CT.items[g.h];return `<details class="iq-hg" open><summary><a class="wpl" href="${L('wp/'+encodeURIComponent(g.h))}">${esc(it.disp)}</a> ${esc(it.ar)} <span class="cnt">${g.rows.length}</span></summary>${g.rows.map(iqRowHTML).join('')}</details>`}).join(''):'<p class="mut">لا توجد استفسارات مطابقة.</p>'}
 <h2>تغطية المعايير <span class="cnt">${cov.length}</span></h2><div class="tw"><table class="iq-cov"><thead><tr><th>المعيار</th><th>الاستفسارات</th><th>مستوفاة</th><th>معلّقة</th><th>الاستيفاء</th></tr></thead><tbody>${cov.map(([k,o])=>`<tr><td dir="ltr">${esc(k)}</td><td>${o.n}</td><td>${o.d}</td><td>${o.p}</td><td>${bar(Math.round(o.d/o.n*100))}</td></tr>`).join('')}</tbody></table></div>
 ${leg.length?`<h2>سجل الاستفسارات السابق <span class="cnt">${leg.length}</span></h2>${qryTable(leg)}`:''}`}
BLOCKS.iqall=()=>iqPageBody();
V.queries=function(){return `<h1>الاستفسارات</h1><p class="sub">كل الاستفسارات القياسية والمضافة في الارتباط، مرتبة حسب الورقة، مع تتبع الجهة والحالة والاستحقاق والمرفقات وتغطية معايير المراجعة. تُجاب من داخل الورقة أو من هنا مباشرة.</p><div data-block="iqall|x">${iqPageBody()}</div>`};
document.addEventListener('change',e=>{const s=e.target.closest&&e.target.closest('[data-iqq]');if(!s)return;IQALL[s.dataset.iqq]=s.value;refreshBlock('iqall|x')});
document.addEventListener('input',e=>{const s=e.target.closest&&e.target.closest('input[data-iqq]');if(!s)return;clearTimeout(s._t);s._t=setTimeout(()=>{IQALL.q=s.value;refreshBlock('iqall|x');const n=document.querySelector('input[data-iqq="q"]');if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}},350)});
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-iqx]');if(!b)return;if(b.dataset.iqx==='print')return window.print();if(b.dataset.iqx==='xlsx')iqExport()});
function iqExport(){const rows=iqAll().filter(r=>!r.hid);const hd=['الورقة','اسم الورقة','المجموعة','الاستفسار','موجّه إلى','المعيار','الحالة','الاستحقاق','الرد','أوراق مرتبطة','مرفقات'];
 const data=[hd].concat(rows.map(r=>{const it=CT.items[r.host];return[it.disp,it.ar,r.grp,r.t,IQ_TO[r.to]||r.to,r.isa,IQ_STL[r.st],r.due,r.a,r.lk.map(x=>CT.items[x]?CT.items[x].disp:x).join(' '),iqAttCount(r)]}));
 const cov=[['المعيار','الاستفسارات','مستوفاة','معلّقة']].concat(iqIsaCoverage(rows).map(([k,o])=>[k,o.n,o.d,o.p]));
 const blob=xlsxBlob([{name:'الاستفسارات',rows:data,widths:[10,34,24,70,18,18,14,12,50,22,8],header:true,rtl:true},{name:'تغطية المعايير',rows:cov,widths:[20,12,12,12],header:true,rtl:true}],{title:'الاستفسارات'});
 downloadBlob(blob,'inquiries-'+sanitizeName(G('eng.year',''),10)+'.xlsx');toast('تم تصدير الاستفسارات','ok')}
/* ---------- تبويبات / عدّادات ---------- */
queriesAll=function(){return iqLegacyAll()};
const _tabCounts=tabCounts;
tabCounts=function(){const o=_tabCounts();try{const S=iqStats(iqAll());o.qry=S.pend+iqLegacyAll().filter(qryOpen).length}catch(e){}return o};
