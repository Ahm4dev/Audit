/* MEAP · V4 · Shell & unified area paper (60_shell) */
'use strict';
/* ===== 60_shell.js ===== */
/* =====================================================================
   v4 · New engagement shell
   - header bar: company · financial-statements date · currency · progress · materiality (from A500)
   - 7 tabs: المستندات · البيانات · التسويات · المخاطر والرقابة · القضايا · الاستفسارات · مركز التحليلات
   - sidebar: Caseware-style tree (7 sections + recycle bin) with its own scroll, current-location highlight and filter
   - breadcrumb with section/group, navigation map, open review points, queries, firm data
   ===================================================================== */
const TAB7=[['docs','المستندات','map'],['pbc','متطلبات العميل','pbc/dash'],['data','البيانات','tb'],['adj','التسويات','logs'],['risk','المخاطر والرقابة','risks'],['issues','القضايا','review'],['qry','الاستفسارات','queries'],['hub','مركز التحليلات','hub']];
const TAB_OF={pbc:'pbc',tb:'data',logs:'adj',risks:'risk',rcm:'risk',assert:'risk',evidence:'risk',itc:'risk',cx:'risk',cx1:'risk',review:'issues',queries:'qry',hub:'hub'};
const tabOf=v=>TAB_OF[v]||'docs';
const SEC_ICON={PL:'🧭',RA:'🎯',RR:'🛠',PP:'📐',CO:'🏁',PF:'🗄',SD:'⚙'};
/* ---- counts used by the tabs ---- */
function openRecsAll(){const r=recs(CUR.eng,'r').filter(x=>(x.status||'Open')!=='Cleared');const f=recs(CUR.eng,'f').filter(x=>!['Cleared','Passed'].includes(x.status||'Open'));const a=recs(CUR.eng,'a').filter(x=>x.adj==='Proposed');return{r,f,a}}
function queriesAll(){const m=new Map();for(const [k,v] of CUR.eng.entries('wp.')){const i=k.indexOf('.cg.qry');if(i<0)continue;const m2=/^wp\.([^.]+)\.cg\.(qry[^.]*)\.v\.([^.]+)\.([^.]+)$/.exec('wp.'+k);if(!m2)continue;const key=m2[1]+'|'+m2[2]+'|'+m2[3];const o=m.get(key)||{ref:m2[1],gid:m2[2],rid:m2[3]};o[m2[4]]=v;o.k=key;m.set(key,o)}return [...m.values()].filter(o=>String(o.q||'').trim())}
const qryOpen=o=>!['مغلق'].includes(o.st||'مفتوح');
function tabCounts(){let rv=0,qn=0;try{const o=openRecsAll();rv=o.r.length+o.f.length+o.a.length;qn=queriesAll().filter(qryOpen).length}catch(e){}return{issues:rv,qry:qn}}
/* ---- header ---- */
function engBar(){const fp=firmProfile();const M=matState();const all=ctAliveRefs?ctAliveRefs():CT.order.filter(r=>!ctOff(r));const P=catProg(all);const cur=fp.cur;
 const fsd=G('eng.period',G('eng.year',''));
 return `<div class="engbar"><div class="eb-id">${fp.logo?`<img class="eb-logo" src="${esc(fp.logo)}" alt="شعار المكتب">`:''}<div><b class="eb-co" title="${esc(CUR.company.name)}">${esc(CUR.company.name)}</b><span class="eb-sub">القوائم المالية في <b dir="ltr">${esc(fsd||'—')}</b> · العملة: ${esc(cur)}${fp.country?' · '+esc(fp.country):''}</span></div></div>
 <div class="eb-mat" role="status" aria-label="الأهمية النسبية"><a href="${L('wp/A500')}" title="الأهمية النسبية من ورقة الحساب A500">الأهمية: <b data-matchip="om">${M.om?fmtN(M.om):'—'}</b> · التنفيذية <b data-matchip="pm">${M.pm?fmtN(M.pm):'—'}</b> · التفاهة <b data-matchip="ct">${M.ct?fmtN(M.ct):'—'}</b></a></div>
 <div class="eb-prog" title="مكتمل ${P.d} / تحت المراجعة ${P.rv} / قيد الإعداد ${P.pg} / لم يبدأ ${P.ns}"><span>التقدم ${P.p}%</span>${bar(P.p)}</div>
 <div class="eb-act noprint"><a class="btn g sm" href="${L('map')}" title="خريطة التنقل"><span aria-hidden="true">🗺</span><span class="lbl"> الخريطة</span></a><a class="btn g sm" href="${L('firm')}" title="بيانات المكتب (الشعار، الدولة، العملة)"><span aria-hidden="true">🏢</span><span class="lbl"> المكتب</span></a></div></div>`}
function tabsHTML(cur){const c=tabOf(cur);const n=tabCounts();
 return engBar()+`<div class="etabrow" role="tablist" aria-label="أقسام الارتباط">${TAB7.map(x=>`<a role="tab" href="${L(x[2])}"${c===x[0]?' aria-current="page" aria-selected="true"':' aria-selected="false"'}>${esc(x[1])}${x[0]==='issues'&&n.issues?` <span class="cnt">${n.issues}</span>`:''}${x[0]==='qry'&&n.qry?` <span class="cnt">${n.qry}</span>`:''}</a>`).join('')}</div>`}
/* ---- sidebar ---- */
const NAVOPEN=new Set();let NAVQ='';
/* Accordion: only ONE top-level sidebar tab (a worksheet section 's:*' or the extra-tools panel 'legacy') is open at a time.
   NAVLAST = the tab the user opened last (wins over the tab that holds the current page until the page changes); NAVSEEN = last view+page seen. */
let NAVLAST='',NAVSEEN='',NAVLASTG={};   /* NAVLASTG[sectionId] = group the user opened last inside that section (same idea, one level down) */
function curRef(){if(CUR.view!=='wp'||!CUR.arg)return'';const r=decodeURIComponent(CUR.arg);const it=CT.items[r];if(it&&it.area&&it.kind!=='main')return CT.areaBy[it.area].main;const c=CT.leg[r];if(c&&CT.items[c]&&!CT.items[r]){const ci=CT.items[c];return ci.area&&ci.kind!=='main'?CT.areaBy[ci.area].main:c}return r}
function navItem(ref,cur){const it=CT.items[ref];const s=wpSt4(ref);const on=ref===cur;
 return `<a class="nw st-${s}" href="${L('wp/'+encodeURIComponent(ref))}"${on?' aria-current="page"':''} data-nq="${esc(normAr(it.disp+' '+it.ar+' '+it.en))}" title="${esc(it.ar)}"><i class="dot" aria-hidden="true"></i><span class="nd">${esc(it.disp)}</span><span class="nt">${esc(it.ar)}</span></a>`}
function navArea(a,cur){const r=a.main;if(!CT.items[r]||ctOff(r))return'';const on=r===cur;const s=wpSt4(r);const rm=areaRmm(a.id);
 return `<a class="nw nwa st-${s}" href="${L('wp/'+encodeURIComponent(r))}"${on?' aria-current="page"':''} data-nq="${esc(normAr(a.ar+' '+a.en+' '+CT.items[r].disp))}" title="${esc(a.ar)}"><i class="dot" aria-hidden="true"></i><span class="nd">${esc(CT.items[r].disp)}</span><span class="nt">${esc(a.ar)}</span>${rm==='H'?'<span class="rk H" title="خطر مرتفع">●</span>':''}</a>`}
function navGroup(g,cur,sid,gw){const refs=(g.items||[]).filter(r=>CT.items[r]&&!ctOff(r)&&ctUnit(r));const areas=(g.areas||[]).filter(a=>!ctOff(a.main));
 const aHTML=areas.map(a=>navArea(a,cur)).join('');
 if(!refs.length&&!aHTML)return'';const key='g:'+g.id;const P=catProg(refs.concat(areas.map(a=>a.main)));
 return `<details data-nk="${key}" class="ngg"${gw===key?' open':''}><summary><span>${esc(g.ar)}</span><span class="pc">${P.p}%</span></summary>${refs.map(r=>navItem(r,cur)).join('')}${aHTML}</details>`}
function navHTML(cur0){const cur=curRef();const tree=ctTree();let h=`<div class="nvq noprint"><input class="in" type="search" id="navq" placeholder="ابحث في الشجرة…" aria-label="بحث في شجرة الأوراق" value="${esc(NAVQ)}"></div>`;
 const rec=RECENT.filter(r=>CT.items[r]&&!ctOff(r)).slice(0,6);let tail='';if(rec.length)tail+=`<div class="nrec noprint"><span class="mut small">آخر ما فتحت</span>${rec.map(r=>`<a class="mapchip${r===cur?' on':''}" href="${L('wp/'+encodeURIComponent(r))}" title="${esc(CT.items[r].ar)}">${esc(CT.items[r].disp)}</a>`).join('')}</div>`;
 const allRefs=CT.order.filter(r=>!ctOff(r));const PA=catProg(allRefs);tail+=`<div class="nvp"><span>الإنجاز الكلي ${PA.p}%</span>${bar(PA.p)}</div>`;
 const seen=CUR.view+'|'+cur;if(seen!==NAVSEEN){NAVSEEN=seen;NAVLAST='';NAVLASTG={}}
 const cv=VIEW_NAV[CUR.view]||CUR.view;const legHas=NAV.some(g=>g[2].some(i=>i[0]===cv));
 let hasKey='';for(const s of tree)for(const g of s.groups)if((g.items||[]).includes(cur)||(g.areas||[]).some(a=>a.main===cur))hasKey='s:'+s.id;
 const topKeys=tree.map(s=>'s:'+s.id).concat('legacy');
 const want=NAVLAST&&topKeys.includes(NAVLAST)?NAVLAST:(hasKey||(legHas?'legacy':'')||[...NAVOPEN].find(k=>topKeys.includes(k))||'');
 for(const s of tree){const refs=[];for(const g of s.groups){refs.push(...(g.items||[]));for(const a of (g.areas||[]))refs.push(a.main)}const P=catProg(refs);const key='s:'+s.id;
  const gKeys=s.groups.map(g=>'g:'+g.id);const gHas=s.groups.find(g=>(g.items||[]).includes(cur)||(g.areas||[]).some(a=>a.main===cur));
  const gw=NAVLASTG[s.id]&&gKeys.includes(NAVLASTG[s.id])?NAVLASTG[s.id]:(gHas?'g:'+gHas.id:(gKeys.find(k=>NAVOPEN.has(k))||''));
  const body=s.groups.map(g=>navGroup(g,cur,s.id,gw)).join('');if(!body)continue;
  h+=`<details data-nk="${key}" class="ngs"${want===key?' open':''}><summary><span>${SEC_ICON[s.id]||'📁'} ${esc(s.ar)}</span><span class="pc" title="${P.d} من ${P.t}">${P.p}%</span></summary>${body}</details>`}
 const nOff=CT.order.filter(r=>ctOff(r)&&!CT.items[r].custom).length;
 h+=`<a class="nrb" href="${L('rbin')}"${CUR.view==='rbin'?' aria-current="page"':''}>🗑 سلة المحذوفات${nOff?` <span class="pc">${nOff}</span>`:''}</a>`;
 h+=`<details data-nk="legacy" class="ngl"${want==='legacy'?' open':''}><summary><span>🧰 أدوات وفهارس إضافية</span></summary>${NAV.map(g=>`<div class="nlg">${esc(g[1])}</div>`+g[2].map(i=>`<a href="${L(i[0])}"${cv===i[0]?' aria-current="page"':''}><span>${esc(i[1])}</span></a>`).join('')).join('')}</details>`;
 return h+tail}
function navFit(){const nav=$('#nav');if(!nav||nav.hidden)return;const cur=nav.querySelector('[aria-current=page]');if(!cur)return;const q=nav.querySelector('.nvq');const hid=8;const a=cur.getBoundingClientRect(),b=nav.getBoundingClientRect();if(a.top-b.top<hid||a.bottom>b.bottom-6){try{nav.scrollTop=Math.max(0,nav.scrollTop+(a.top-b.top)-Math.round(nav.clientHeight/2)+Math.round(a.height/2))}catch(e){}}}
document.addEventListener('toggle',e=>{const d=e.target;if(!(d instanceof Element)||!d.matches('#nav details[data-nk]'))return;const k=d.dataset.nk;
 if(d.open)NAVOPEN.add(k);else{NAVOPEN.delete(k);if(NAVLAST===k)NAVLAST=''}
 /* accordion for the top-level tabs only (inner groups stay independent). Skipped while the tree filter is active:
    searching deliberately expands every matching section. */
 if(NAVQ)return;
 if(d.matches('details.ngg')){   /* sub-group: opening it closes its sibling groups inside the same section */
  const sec=d.parentElement,sid=((sec&&sec.dataset.nk)||'').replace(/^s:/,'');
  if(!d.open){if(NAVLASTG[sid]===k)delete NAVLASTG[sid];return}
  NAVLASTG[sid]=k;sec.querySelectorAll(':scope > details.ngg[open]').forEach(o=>{if(o!==d)o.open=false});
  const nav=$('#nav'),sm=d.firstElementChild;if(sm){const a=sm.getBoundingClientRect(),b=nav.getBoundingClientRect();if(a.top<b.top+4)nav.scrollTop+=a.top-b.top-8}
  return}
 if(!d.open||!d.matches('details.ngs,details.ngl'))return;
 NAVLAST=k;const nav=$('#nav');
 nav.querySelectorAll(':scope > details.ngs[open],:scope > details.ngl[open]').forEach(o=>{if(o!==d)o.open=false});
 /* closing the tabs above shrinks the list and can push the clicked tab out of view → keep it visible */
 const sm=d.firstElementChild;if(sm){const a=sm.getBoundingClientRect(),b=nav.getBoundingClientRect();if(a.top<b.top+4)nav.scrollTop+=a.top-b.top-8}
},true);
document.addEventListener('input',e=>{const el=e.target;if(!(el instanceof Element)||el.id!=='navq')return;NAVQ=el.value;const q=normAr(NAVQ);const nav=$('#nav');
 nav.querySelectorAll('a.nw').forEach(a=>{a.hidden=!!q&&!a.dataset.nq.includes(q)});
 nav.querySelectorAll('details.nga,details.ngg,details.ngs').forEach(d=>{const any=[...d.querySelectorAll('a.nw')].some(a=>!a.hidden);d.hidden=!!q&&!any;if(q&&any)d.open=true})});
/* ---- breadcrumb ---- */
function crumbTrail(view,arg){const t=[];
 if(view==='wp'&&arg){const ref=decodeURIComponent(arg);const it=CT.items[ref];if(it){const s=CT.secs.find(x=>x.id===it.sec);const g=it.area?CT.areaBy[it.area]:CT.grpMeta[it.grp];
   t.push(['المستندات',L('dash')]);if(s)t.push([s.ar,L('map')+'#sec-'+s.id]);if(g)t.push([g.ar,'']);t.push([it.disp+' — '+it.ar,'']);return t}
  if(WP[ref]){t.push(['المستندات',L('dash')]);t.push(['أوراق العمل',L('wplib')]);t.push([ref+' '+WP[ref].ar,'']);return t}}
 const tn=TAB7.find(x=>x[0]===tabOf(view));t.push([tn?tn[1]:'المستندات',tn?L(tn[2]):L('dash')]);return t}
/* ---- new views ---- */
V.review=function(){const o=openRecsAll();const n=o.r.length+o.f.length+o.a.length;const qo=queriesAll().filter(qryOpen);
 const pend=[];try{const I=inboxItems();for(const k of Object.keys(I||{}))if(Array.isArray(I[k]))pend.push(...I[k])}catch(e){}
 return `<h1>نقاط المراجعة المفتوحة</h1><p class="sub">كل ما يحتاج إغلاقًا قبل التقرير في صفحة واحدة: ملاحظات المراجعة، الاستثناءات، التسويات المقترحة، الاستفسارات المفتوحة.</p>
 <div class="grid g4"><div class="card"><b>${o.r.length}</b><br><span class="mut">ملاحظات مراجعة مفتوحة</span></div><div class="card"><b>${o.f.length}</b><br><span class="mut">استثناءات/ملاحظات مفتوحة</span></div><div class="card"><b>${o.a.length}</b><br><span class="mut">تسويات مقترحة لم تُقرَّر</span></div><div class="card"><b>${qo.length}</b><br><span class="mut">استفسارات مفتوحة</span></div></div>
 ${n||qo.length?'':'<div class="note ok">لا توجد نقاط مفتوحة 🎉</div>'}
 ${can('edit')?`<div class="card noprint"><b>إضافة ملاحظة مراجعة</b>${typeof rnForm==='function'?rnForm(''):`<a class="btn o sm" href="${L('logs/r')}">فتح نموذج الإضافة</a>`}</div>`:''}
 <h2>ملاحظات المراجعة <span class="cnt">${o.r.length}</span></h2><div data-block="rvnotes">${rnTable(o.r)}</div>
 <h2>الاستثناءات والملاحظات <span class="cnt">${o.f.length}</span></h2>${logTables(o.f,[])}
 <h2>التسويات المقترحة <span class="cnt">${o.a.length}</span></h2>${o.a.length?adjTable(o.a):'<p class="mut">لا توجد.</p>'}
 <h2>الاستفسارات المفتوحة <span class="cnt">${qo.length}</span></h2>${qryTable(qo)}
 <h2>بانتظار الاعتماد <span class="cnt">${pend.length}</span></h2>${pend.length?`<ul class="lkl">${pend.slice(0,60).map(x=>`<li>${objLink(x)}</li>`).join('')}</ul>`:'<p class="mut">لا شيء.</p>'}`};
function qryTable(rows){if(!rows.length)return'<p class="mut">لا توجد استفسارات.</p>';
 return `<div class="tw"><table><thead><tr><th>الورقة</th><th>الاستفسار</th><th>موجّه إلى</th><th>الاستحقاق</th><th>الحالة</th><th>الرد / المرجع</th></tr></thead><tbody>${rows.map(o=>{const it=CT.items[o.ref];const b='wp.'+o.ref+'.cg.'+o.gid+'.v.'+o.rid+'.';
  return `<tr><td>${it?`<a class="wpl" href="${L('wp/'+encodeURIComponent(o.ref))}" title="${esc(it.ar)}">${esc(it.disp)}</a>`:esc(o.ref)}</td><td class="tx">${esc(o.q||'')}</td><td>${esc(o.to||'')}</td><td>${esc(o.due||'')}</td><td><select class="st" data-k="${esc(b+'st')}" data-dv="" aria-label="الحالة"${RO()?' disabled':''}>${['','مفتوح','تم الرد','تم الاستلام جزئيًا','مغلق'].map(s=>`<option${(o.st||'')===s?' selected':''}>${s}</option>`).join('')}</select></td><td>${esc(o.r||'')}</td></tr>`}).join('')}</tbody></table></div>`}
V.queries=function(){const all=queriesAll();const open=all.filter(qryOpen),closed=all.filter(o=>!qryOpen(o));
 return `<h1>الاستفسارات</h1><p class="sub">كل استفسارات الارتباط في مكان واحد؛ سجّل استفسارًا جديدًا من الجدول أسفل الصفحة وحدّث حالته من هنا.</p>
 <h2>مفتوحة <span class="cnt">${open.length}</span></h2>${qryTable(open)}<h2>مغلقة <span class="cnt">${closed.length}</span></h2>${qryTable(closed)}
 <h2>إضافة استفسار</h2>${qryHTML('A355Q','gen')}`};
V.hub=function(){return `<h1>مركز التحليلات (Analytics Hub)</h1><p class="sub">نسب مالية وتحليل أفقي ورأسي وDuPont وفروق جوهرية — مرتبطة بمخاطر المجالات وأوراق العمل. مبنية على الميزان المبوَّب بعد التسويات.</p>${fsUnNote()}<div class="anhub">${anHubHTML()}</div>`};
V.map=function(){const tree=ctTree();return `<h1>خريطة الارتباط</h1><p class="sub">نظرة شاملة على الأقسام السبعة وتقدم كل مجموعة؛ اضغط أي ورقة للانتقال.</p>
 ${tree.map(s=>{const refs=[];for(const g of s.groups){refs.push(...(g.items||[]));for(const a of (g.areas||[]))refs.push(a.main)}const P=catProg(refs);
  return `<section class="mapsec" id="sec-${s.id}"><h2>${SEC_ICON[s.id]||''} ${esc(s.ar)} <span class="cnt">${P.p}%</span></h2><p class="mut small">${P.d} مكتمل · ${P.rv} مراجعة · ${P.pg} قيد الإعداد · ${P.ns} لم يبدأ</p>${bar(P.p)}
  ${s.groups.map(g=>{const rs=(g.items||[]).filter(r=>CT.items[r]&&!ctOff(r));const as=(g.areas||[]).map(a=>[a,a.items.filter(r=>CT.items[r]&&!ctOff(r))]).filter(x=>x[1].length);if(!rs.length&&!as.length)return'';
   const chip=r=>`<a class="mapchip st-${wpSt4(r)}" href="${L('wp/'+encodeURIComponent(r))}" title="${esc(CT.items[r].ar)}">${esc(CT.items[r].disp)}</a>`;
   return `<details class="mapg"${rs.length&&!as.length?' open':''}><summary>${esc(g.ar)} <span class="mut small">(${rs.length+as.length})</span></summary><div class="mapc">${rs.map(chip).join('')}</div><div class="mapc">${as.map(([a])=>`<a class="mapchip mapar st-${wpSt4(a.main)}" href="${L('wp/'+encodeURIComponent(a.main))}" title="${esc(a.ar)}">${esc(CT.items[a.main].disp)} · ${esc(a.ar)} ${areaRmmB(a)}</a>`).join('')}</div></details>`}).join('')}</section>`}).join('')}`};
const areaRmmB=a=>{try{return rmmB(areaRmm(a.id))}catch(e){return''}};
/* firm data (logo, country, currency) */
V.firm=function(){const f=firmProfile();const ro=RO();const inp=(k,l,ph,v)=>`<label class="fl">${l}<input class="in" data-firm="${k}" value="${esc(v)}" placeholder="${esc(ph||'')}"${ro?' readonly':''}></label>`;
 return `<h1>بيانات المكتب</h1><p class="sub">تظهر في ترويسة الارتباط والخطابات والتقارير المطبوعة.</p><div class="card"><div class="fgrid">${inp('name','اسم المكتب','',f.name)}${inp('country','الدولة','مصر',f.country)}${inp('cur','عملة القوائم المالية','جنيه مصري (EGP)',f.cur)}${inp('lic','رقم القيد/الترخيص','',f.lic)}${inp('partner','الشريك المسؤول','',f.partner)}${inp('addr','العنوان','',f.addr)}</div>
 <h3>الشعار</h3><p>${f.logo?`<img class="eb-logo big" src="${esc(f.logo)}" alt="شعار المكتب">`:'<span class="mut">لا يوجد شعار.</span>'}</p>${ro?'':`<p class="row"><label class="btn o sm">رفع شعار (PNG/JPG حتى 300KB)<input type="file" accept="image/png,image/jpeg,image/webp" data-firmlogo hidden></label>${f.logo?'<button class="btn d sm" type="button" data-v4act="firmlogoclr">حذف الشعار</button>':''}</p>`}</div>`};
function firmSave(patch){const f=Object.assign({},G('firm.p',null)||{},patch);CUR.eng.set('firm.p',f,{label:'بيانات المكتب'})}
document.addEventListener('change',e=>{const el=e.target;if(!(el instanceof Element)||RO())return;
 if(el.dataset&&el.dataset.firm){firmSave({[el.dataset.firm]:el.value.trim()});refreshEngBar()}
 else if(el.hasAttribute&&el.hasAttribute('data-firmlogo')){const fl=el.files&&el.files[0];if(!fl)return;if(fl.size>300*1024){toast('حجم الشعار أكبر من 300KB.','w');return}const rd=new FileReader();rd.onload=()=>{firmSave({logo:String(rd.result)});UI.refreshView()};rd.readAsDataURL(fl)}});
document.addEventListener('click',e=>{const b=e.target instanceof Element&&e.target.closest('[data-v4act=firmlogoclr]');if(b&&!RO()){firmSave({logo:''});UI.refreshView()}});
function refreshEngBar(){const tb=$('#etabs');if(tb&&!tb.hidden&&CUR.eng)tb.innerHTML=tabsHTML(CUR.view)}
document.addEventListener('meap:routed',()=>{});
/* keep header counts / progress fresh after edits (cheap: re-render the header only) */
let _ebT=0;document.addEventListener('change',()=>{clearTimeout(_ebT);_ebT=setTimeout(()=>{if(CUR.eng&&CUR.company)refreshEngBar()},400)});
/* ---- renderEng with new chrome ---- */
function renderEng(view,arg,keep){CUR.view=view;CUR.arg=arg;CUR.lock=false;TBSTORE.ensure();PRES.cur.view=view;if(view!=='wp')PRES.cur.wp='';
 let fn=V[view],html;if(view==='refs'&&arg)fn=V.ref1;if(view==='forms'&&arg)fn=V.form;if(view==='cx'&&arg)fn=V.cx1;if(view==='ind'&&arg)fn=V.ind1;if(view==='isa'&&arg)fn=V.isa1;
 try{html=fn?fn(arg):nf()}catch(e){logErr('renderEng '+view,e);html=`<div class="note bad">تعذر عرض الصفحة: ${esc(errMsg(e))}</div>`}
 let last='';if(view==='tb'&&arg){last=arg.startsWith('acct:')?decodeURIComponent(arg.slice(5)):(TBTABS.find(x=>x[0]===arg)||['',arg])[1]}else if(view==='refs'&&arg){const rr=refById(arg);last=rr?rr.code:arg}else if(view==='form'&&TPLM[arg])last=TPLM[arg].ar;else if(view==='proc'&&PIDX[arg])last=PIDX[arg].tx.slice(0,50)+'…';else if(view==='acc'&&AC[arg])last=AC[arg].n;else if(view==='cyc'&&CY[arg])last=CY[arg].n;else if(view==='ph'&&PHM[arg])last=PHM[arg].n;else if(arg&&!['logs','fs','risks','wp','review','queries','hub'].includes(view))last=arg;
 const trail=crumbTrail(view,arg);if(view!=='wp'||!trail.length){if(view!=='wp'||!CT.items[decodeURIComponent(arg||'')]){const lab=VLABEL[view]||({review:'نقاط المراجعة',queries:'الاستفسارات',hub:'مركز التحليلات',map:'الخريطة',firm:'بيانات المكتب',rbin:'سلة المحذوفات'})[view]||view;if(!trail.length||trail[trail.length-1][0]!==lab)trail.push([lab,'']);if(last&&view!=='pbc'&&view!=='queries')trail.push([last,''])}}
 const bc=`<nav class="bc noprint" aria-label="مسار التنقل"><ol><li><a href="#/">${t('companies')}</a></li><li><a href="#/c/${encodeURIComponent(CUR.company.id)}">${esc(CUR.company.name)}</a></li><li><a href="${L('dash')}">${esc(t('year'))} ${esc(CUR.eng.get('eng.year',''))}</a></li>${trail.map((x,i)=>i===trail.length-1?`<li aria-current="page">${esc(x[0])}</li>`:`<li>${x[1]?`<a href="${x[1]}">${esc(x[0])}</a>`:esc(x[0])}</li>`).join('')}</ol><span class="bcr"><a class="bcmap" href="${L('map')}">🗺 الخريطة</a>${pnHTML(view,arg)}</span></nav>`;
 if(view==='wp'&&arg){const cr=curRef();if(cr&&CT.items[cr]){const i=RECENT.indexOf(cr);if(i>-1)RECENT.splice(i,1);RECENT.unshift(cr);RECENT.length=Math.min(RECENT.length,10)}}
 const nav=$('#nav'),tb=$('#etabs');nav.hidden=false;tb.hidden=false;$('#layout').classList.add('has-nav');const st=nav.scrollTop;nav.innerHTML=navHTML();nav.scrollTop=st;tb.innerHTML=tabsHTML(view);UI.measure();
 $('#main').innerHTML=bc+(RO()?`<p class="note warn noprint">${t('readonly')}</p>`:'')+html;if(view==='tb')tbAfter(arg);inboxBadge();document.dispatchEvent(new CustomEvent('meap:routed',{detail:{view,arg}}));
 const ttl=trail.length?trail[trail.length-1][0]:(VLABEL[view]||'');document.title=ttl+' — '+CUR.company.name+' '+CUR.eng.get('eng.year','')+' — MEAP';
 postRender(keep);if(CT.focus){const el=document.getElementById('sec-'+CT.focus);CT.focus='';if(el){el.scrollIntoView({block:'start'});el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),1600)}}ensureFab();navFit();if(view==='explorer')renderRes();if(view==='sampling')calcAll(false);if(view==='audit')renderAudit();UI.presence();PRES.beat(true)}

/* ================= unified area paper: ONE page per item with all its procedures ================= */
const RECENT=(()=>{try{return JSON.parse(localStorage.getItem('meap.recent')||'[]')}catch(e){return[]}})();
const _recSave=()=>{try{localStorage.setItem('meap.recent',JSON.stringify(RECENT.slice(0,10)))}catch(e){}};
document.addEventListener('meap:routed',_recSave);
const ctUnit=r=>{const it=CT.items[r];return !(it&&it.area&&it.kind!=='main')};
function wpSt4(ref){const a=apGet({t:'wp',id:ref});if(['RV','PA','QR'].includes(a.st))return'dn';const wf=G('wp.'+ref+'.wf','NS');if(['RV','CL','FN'].includes(wf))return'dn';if(a.st==='PR')return'rv';
 const st=wpStartedSet();let started=st.has(ref)||wf!=='NS';const it=CT.items[ref];if(!started&&it&&it.area&&it.kind==='main'){started=CT.areaBy[it.area].items.some(x=>st.has(x)||G('wp.'+x+'.wf','NS')!=='NS')}
 return (a.st==='RT'||started)?'pg':'ns'}
function catProg(refs){let t=0,d=0,rv=0,pg=0;for(const r of refs){if(!CT.items[r]||ctOff(r)||!ctUnit(r))continue;t++;const s=wpSt4(r);if(s==='dn')d++;else if(s==='rv')rv++;else if(s==='pg')pg++}return{t,d,rv,pg,ns:t-d-rv-pg,p:t?Math.round(d*100/t):0}}
const SEC_LBL={main:'الإجراءات وتقييم المخاطر والاستجابة',est:'التقديرات المحاسبية',query:'الاستفسارات',an:'الإجراءات التحليلية الجوهرية',tod:'العينات واختبارات التفاصيل'};
function ctSecLabel(it){return SEC_LBL[it.kind]||it.ar}
function ctBody(it,opt){opt=opt||{};if(!it.area||it.kind!=='main')return ctBody0(it,opt);
  const a=CT.areaBy[it.area];const secs=a.items.map(r=>CT.items[r]).filter(x=>x&&!ctOff(x.ref));
  /* v7 · one section at a time (tabs) instead of one very long page */
  const act=(opt.focus&&secs.some(x=>x.ref===opt.focus))?opt.focus:(CT.tab&&CT.tab.m===it.ref&&secs.some(x=>x.ref===CT.tab.s)?CT.tab.s:(secs[0]||{}).ref);
  const chips=`<nav class="wpsecnav noprint" role="tablist" aria-label="أقسام الورقة">${secs.map(x=>`<a href="${L('wp/'+encodeURIComponent(x.ref))}" role="tab" class="${x.ref===act?'on':''}" data-v4act="wpsec" data-sec="${esc(x.ref)}">${esc(ctSecLabel(x))}</a>`).join('')}</nav>`;
  return `<div class="wptabs" data-main="${esc(it.ref)}">`+chips+secs.map(x=>`<section class="wpsec${x.ref===act?' on':''}" id="sec-${esc(x.ref)}"><h2 class="wpsech"><span class="ref">${esc(x.disp)}</span> ${esc(ctSecLabel(x))}</h2>${ctBody0(x,x.ref===opt.focus?{leg:opt.leg}:{})}</section>`).join('')+`</div>`}
function ctShowSec(ref){const el=document.getElementById('sec-'+ref);if(!el)return null;const box=el.closest('.wptabs');if(box){CT.tab={m:box.dataset.main,s:ref};box.querySelectorAll(':scope>.wpsec').forEach(x=>x.classList.toggle('on',x===el));box.querySelectorAll(':scope>.wpsecnav a').forEach(x=>x.classList.toggle('on',x.dataset.sec===ref))}return el}
document.addEventListener('click',e=>{const b=e.target instanceof Element&&e.target.closest('[data-v4act=wpsec]');if(!b)return;e.preventDefault();const el=ctShowSec(b.dataset.sec);if(el&&!b.closest('.wpsecnav'))el.scrollIntoView({behavior:'smooth',block:'start'})});
const V_wp1=V.wp;
V.wp=function(ref){const it=CT.items[ref];if(it&&it.area&&it.kind!=='main'){const m=CT.areaBy[it.area].main;if(CT.items[m]){CT.focus=ref;return ctPage(CT.items[m],{focus:ref})}}
 const c=CT.leg[ref];if(c&&CT.items[c]&&!CT.items[ref]&&WP[ref]&&!WP[ref].custom){const ci=CT.items[c];if(ci.area&&ci.kind!=='main'){const m=CT.areaBy[ci.area].main;CT.focus=c;return `<p class="note noprint">📌 الورقة <b>${esc(ref)} ${esc(WP[ref].ar)}</b> دُمجت ضمن الورقة ${wpL(m)} — القسم مفتوح أدناه.</p>`+ctPage(CT.items[m],{leg:ref,focus:c})}}
 return V_wp1(ref)};
/* previous / next paper in tree order */
function ctUnitsOrder(){const out=[];for(const s of ctTree())for(const g of s.groups){for(const r of (g.items||[]))if(CT.items[r]&&!ctOff(r)&&ctUnit(r))out.push(r);for(const a of (g.areas||[]))if(!ctOff(a.main))out.push(a.main)}return out}
function pnHTML(view,arg){if(view!=='wp'||!arg)return'';const c=curRef();const o=ctUnitsOrder();const i=o.indexOf(c);if(i<0)return'';const lk=(r,t)=>r?`<a class="bcpn" href="${L('wp/'+encodeURIComponent(r))}" title="${esc(CT.items[r].ar)}">${t} ${esc(CT.items[r].disp)}</a>`:'';return lk(o[i-1],'→ السابقة')+lk(o[i+1],'التالية ←')}
function ensureFab(){let f=document.getElementById('navfab');if(!f){f=document.createElement('button');f.id='navfab';f.type='button';f.className='navfab noprint';f.setAttribute('data-act','menu');f.setAttribute('aria-label','قائمة الأوراق');f.innerHTML='☰ <span>الأوراق</span>';document.body.appendChild(f)}f.hidden=!(CUR.eng&&CUR.company)}
