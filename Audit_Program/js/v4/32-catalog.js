/* MEAP · V4 · Catalog (45_cat) */
'use strict';
/* ===== 45_cat.js ===== */
/* =====================================================================
   v4 · Catalog engine — registry of the Caseware-style working-paper tree, status, exclusion,
   legacy-section merging, form renderers, custom papers and the generic working-paper page.
   ===================================================================== */
const CT={secs:[],items:{},order:[],areas:[],areaBy:{},leg:{},grpMeta:{},ready:false};
WSEC.CAT='دليل أوراق العمل الموحّد (Caseware)';
const cref=r=>String(r).replace(/\./g,'-');
function ctTypes(s){return String(s||'').split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf(':');return i<0?{t:x,p:''}:{t:x.slice(0,i),p:x.slice(i+1)}})}
const CT_XISA={mat:['320','450'],rmm:['315','330','240'],risk_report:['315'],risk_summary:['315'],inherent:['315'],eng_risk:['220','300'],pbc:['210','300'],toc:['330','530'],response:['330'],confirmations:['505'],jetlink:['240'],cfproc:['500'],fs_simple:['700'],fs_draft:['700'],fs_final:['700'],mis_summary:['450'],partner_summary:['220'],analytics_prelim:['520','315'],a101:['315','330','500'],a101e:['540'],a101q:['500'],a120:['520'],a125:['530','500','330']};
function ctAdd(o){const ref=cref(o.disp);if(CT.items[ref])return CT.items[ref];
 const isa=new Set(o.isa||[]);for(const t of o.ty||[]){if(t.t==='F'&&FORMS[t.p]&&FORMS[t.p].isa)split(FORMS[t.p].isa).forEach(x=>isa.add(x));else if(t.t==='L')t.p.split(',').forEach(r=>{const w=WP[r.trim()];if(w)w.isa.forEach(x=>isa.add(x))});else if(t.t==='X'){(CT_XISA[t.p.split(':')[0]]||[]).forEach(x=>isa.add(x))}}
 const it=Object.assign({isa:[...isa],ob:''},o,{ref,isa:[...isa]});CT.items[ref]=it;CT.order.push(ref);
 WP[ref]={ref,en:o.en,ar:o.ar,k:'tod',isa:it.isa,ob:it.ob,it:null,cols:null,sec:'CAT',custom:false,cat:true};return it}
function ctBuild(){if(CT.ready)return;CT.ready=true;
 CT.secs=CAT_SECTIONS.map(([id,en,ar])=>({id,en,ar,groups:[]}));const S=id=>CT.secs.find(s=>s.id===id);let cs=null,cg=null;
 for(const ln of CAT_TREE_SRC.split('\n')){const l=ln.trim();if(!l)continue;const p=l.split('|');
  if(p[0]==='@S'){cs=S(p[1]);cg=null;continue}
  if(p[0]==='@G'){cg={id:p[1],en:p[2],ar:p[3],items:[],sec:cs.id};cs.groups.push(cg);CT.grpMeta[cg.id]=cg;continue}
  if(CAT_DROP.has(p[0]))continue;const it=ctAdd({disp:p[0],en:p[1],ar:p[2],sec:cs.id,grp:cg.id,ty:ctTypes(p[3])});cg.items.push(it.ref)}
 /* Plans and Procedures: super-groups → areas → papers */
 const pp=S('PP');pp.groups=[];const sg={};
 for(const [id,ar,en] of CAT_SUPER){const g={id:'PP-'+id,en,ar,items:[],areas:[],sec:'PP'};sg[id]=g;pp.groups.push(g);CT.grpMeta[g.id]=g}
 for(const ln of CAT_AREAS_SRC.split('\n')){const l=ln.trim();if(!l)continue;const p=l.split('|');const [sup,code,id,en,ar,lines,gf,spec]=p;
  const ar_={id,code,sup,en,ar,lines:(lines||'').split(',').filter(Boolean),gf:gf||'',isNew:spec==='new',items:[],main:'',legacy:[]};
  const base=code.indexOf('.')>-1?code:code+'.101',pre=code.split('.')[0];const isCOS=id==='COS';
  const mk=(disp,en2,ar2,ty,kind)=>{const it=ctAdd({disp,en:en2,ar:ar2,sec:'PP',grp:'PP-'+sup,area:id,ty,kind});ar_.items.push(it.ref);return it};
  ar_.main=cref(base);
  mk(base,en+' — Audit procedures and risk response',ar+' — إجراءات المراجعة وتقييم المخاطر والاستجابة',[{t:'X',p:'a101'}],'main');
  if(!CAT_NOEST.has(id))mk(base+'E',en+' — Accounting estimate — Risk assessment and response',ar+' — التقديرات المحاسبية: تقييم المخاطر والاستجابة',[{t:'X',p:'a101e'}],'est');
  const sp=[];if(spec&&spec!=='new')for(const s of spec.split(';')){const q=s.split(':');if(q.length<5)continue;sp.push({key:q[0],ref:q[1],en:q[2],ar:q[3],ty:ctTypes(q.slice(4).join(':'))})}
  for(const s of sp)if(/^\d+$/.test(s.key))mk(s.ref,s.en,s.ar,s.ty,'special');
  mk(isCOS?pre+'.102':pre+'.120','Worksheet - '+en+' - Substantive analytical procedures','ورقة عمل — '+ar+' — الإجراءات التحليلية الجوهرية',[{t:'X',p:'a120'}],'an');
  mk(isCOS?pre+'.103':pre+'.125','Worksheet - '+en+' - Substantive sampling - Tests of details','ورقة عمل — '+ar+' — العينات الجوهرية — اختبارات التفاصيل',[{t:'X',p:'a125'}],'tod');
  for(const s of sp)if(!/^\d+$/.test(s.key))mk(s.ref,s.en,s.ar,s.ty,'special');
  CT.areas.push(ar_);CT.areaBy[id]=ar_;sg[sup].areas.push(ar_)}
 /* legacy claims: tree first, then the account lists of each area, then the remaining legacy papers by letter */
 for(const ref of CT.order){const it=CT.items[ref];for(const t of it.ty)if(t.t==='L')t.p.split(',').forEach(r=>{r=r.trim();if(r&&!CT.leg[r])CT.leg[r]=ref})}
 CT.retired={};for(const [rs,host,why] of CAT_RETIRE)rs.split(' ').forEach(r=>{if(!CT.leg[r]){CT.leg[r]='RETIRED';CT.retired[r]={host,why}}});
  for(const a of CT.areas){const tod=a.items[a.items.length-1];const todItem=a.items.map(r=>CT.items[r]).filter(x=>x.kind==='tod')[0];
  for(const ln of a.lines){const ac=AC[ln];if(!ac)continue;for(const r of split(ac.wps)){if(!WP[r]||CT.leg[r])continue;CT.leg[r]=todItem.ref;a.legacy.push(r);todItem.legacyExtra=(todItem.legacyExtra||[]);todItem.legacyExtra.push(r)}}}
 const sup=pp.groups.length;const sg2={id:'PP-sup',en:'Supplementary library papers',ar:'أوراق مكمّلة من المكتبة (مدمجة)',items:[],areas:[],sec:'PP'};CT.grpMeta[sg2.id]=sg2;
 const byL={};for(const w of W){if(CT.leg[w[0]])continue;(byL[w[0].split('-')[0]]=byL[w[0].split('-')[0]]||[]).push(w[0])}
 for(const L_ of Object.keys(byL).sort()){const refs=byL[L_];const nm=(WSEC[L_]||L_).split(' — ');const it=ctAdd({disp:'SUP-'+L_,en:nm[0],ar:'مكتبة — '+(nm[1]||nm[0]),sec:'PP',grp:'PP-sup',ty:[{t:'L',p:refs.join(',')}],kind:'sup'});sg2.items.push(it.ref);for(const r of refs)CT.leg[r]=it.ref}
 pp.groups.push(sg2)}
ctBuild();

/* ---------- state: status, exclusion, progress ---------- */
const WS4={ns:['لم يبدأ','ns'],pg:['قيد الإعداد','pg'],rv:['بانتظار مراجعة المراجع الأول','rv'],dn:['مكتمل (معتمد)','dn']};
function wpStartedSet(){return vcache('wpstarted',()=>{const s=new Set();if(!CUR.eng)return s;for(const [k,v] of CUR.eng.entries('wp.')){const m=/^wp\.([^.]+)\.(.+)$/.exec(k);if(!m)continue;const r=m[2];if(/^(ap|wf|excluded|due|as|so\.|cm\.|h\.|lk\.|tb)/.test(r))continue;if(v===''||v===false||v===null)continue;s.add(m[1])}return s})}
function wpSt4(ref){const a=apGet({t:'wp',id:ref});if(['RV','PA','QR'].includes(a.st))return'dn';const wf=G('wp.'+ref+'.wf','NS');if(['RV','CL','FN'].includes(wf))return'dn';if(a.st==='PR')return'rv';if(a.st==='RT')return'pg';return (wpStartedSet().has(ref)||wf!=='NS')?'pg':'ns'}
function stChip(ref){const s=wpSt4(ref);return `<span class="b st4 st4-${s}">${WS4[s][0]}</span>`}
function ctOff(ref){return !!G('wp.'+ref+'.excluded',false)}
function ctLegOff(r){const c=CT.leg[r];return c?ctOff(c):false}
function ctAliveRefs(){return CT.order.filter(r=>!ctOff(r))}
function catProg(refs){let t=0,d=0,rv=0,pg=0;for(const r of refs){if(!CT.items[r]||ctOff(r))continue;t++;const s=wpSt4(r);if(s==='dn')d++;else if(s==='rv')rv++;else if(s==='pg')pg++}return{t,d,rv,pg,ns:t-d-rv-pg,p:t?Math.round(d*100/t):0}}
/* every place that prints working-paper links goes through this function; excluded papers are shown unlinked */
wpL=function(s){return split(s).map(r=>{const w=WP[r];if(!w)return `<span class="wpl">${esc(r)}</span>`;if(ctOff(r)||ctLegOff(r)||G('wp.'+r+'.excluded',false))return `<span class="wpl off" title="ورقة مستبعدة من الارتباط — الرابط معطّل">${esc(CT.items[r]?CT.items[r].disp:r)}</span>`;
 return `<a class="wpl" href="${L('wp/'+encodeURIComponent(r))}" title="${esc(w.ar+' · '+w.en)}">${esc(CT.items[r]?CT.items[r].disp:r)}</a>`}).join(' ')}
wpAlive=ref=>!!WP[ref]&&!G('wp.'+ref+'.excluded',false)&&!ctLegOff(ref);

/* ---------- custom papers (new tree) ---------- */
function ctCustomDef(ref,c){return{ref,en:c.en,ar:c.ar,k:c.k||'tod',isa:split(c.isa),ob:c.ob||'',it:c.items&&c.items.length?c.items:(c.k==='memo'?['الوصف','الإجراءات المنفذة','النتائج','الاستنتاج']:null),cols:c.cols||null,sec:c.sec2?'CAT':(c.sec||ref.split('-')[0]),custom:true,cat:!!c.sec2}}
function wpDef(store,ref){if(WP[ref]&&!WP[ref].custom)return WP[ref];const c=store&&store.get('cwp.'+ref,null);if(!c)return WP[ref]||null;return ctCustomDef(ref,c)}
function syncCustomWPs(){for(const r in WP)if(WP[r].custom)delete WP[r];for(const r of Object.keys(CT.items))if(CT.items[r].custom){delete CT.items[r]}CT.order=CT.order.filter(r=>CT.items[r]);for(const g of Object.keys(CT.grpMeta))if(CT.grpMeta[g].custom)delete CT.grpMeta[g];
 if(!CUR.eng)return;for(const [k,v] of CUR.eng.entries('cwp.')){const ref=k.slice(4);if(ref.includes('.'))continue;if(!v||WP[ref])continue;WP[ref]=ctCustomDef(ref,v);
  if(v.sec2){const gid=v.grp||('CG-'+v.sec2);if(!CT.grpMeta[gid])CT.grpMeta[gid]={id:gid,en:v.grpName||'Custom',ar:v.grpName||'أوراق مخصصة',items:[],sec:v.sec2,custom:true};CT.items[ref]={ref,disp:ref,en:v.en,ar:v.ar,sec:v.sec2,grp:gid,ty:[{t:'CUSTOM'}],custom:true,isa:split(v.isa),ob:v.ob||'',kind:'custom'};CT.order.push(ref)}}}
/* the tree as shown to the user: static structure + custom groups/papers */
function ctTree(){const out=CT.secs.map(s=>({id:s.id,en:s.en,ar:s.ar,groups:s.groups.map(g=>Object.assign({},g,{items:g.items.slice(),areas:g.areas?g.areas.slice():undefined}))}));
 for(const r of CT.order){const it=CT.items[r];if(!it.custom)continue;const s=out.find(x=>x.id===it.sec);if(!s)continue;let g=s.groups.find(x=>x.id===it.grp);if(!g){const m=CT.grpMeta[it.grp]||{id:it.grp,en:it.grp,ar:it.grp};g={id:m.id,en:m.en,ar:m.ar,items:[],sec:s.id};s.groups.push(g)}g.items.push(r)}
 return out}

/* ---------- registered special pages (filled by later modules) ---------- */
const XP={};
/* ---------- firm profile ---------- */
function firmProfile(){const f=G('firm.p',null)||{};return{name:f.name||'',logo:f.logo||'',country:f.country||'مصر',cur:f.cur||'جنيه مصري (EGP)',addr:f.addr||'',lic:f.lic||'',partner:f.partner||''}}
function matStrip(){const M=matState();return `<div class="matstrip" role="status"><span class="mst">الأهمية النسبية</span><span>إجمالية <b data-matchip="om">${M.om?fmtN(M.om):'—'}</b></span><span>تنفيذية <b data-matchip="pm">${M.pm?fmtN(M.pm):'—'}</b></span><span>حد التفاهة <b data-matchip="ct">${M.ct?fmtN(M.ct):'—'}</b></span><a href="${L('wp/A500')}" class="small">A500</a></div>`}

/* ---------- legacy papers rendered as accordion sections inside a catalog paper ---------- */
function legSec(ref,open){const w=WP[ref];if(!w)return '';const K=KINDS[w.k]||KINDS.tod;const txt=(k,lb,ph)=>edc('wp.'+ref+'.t.'+k,{label:lb,ph});
 let main;if(w.k==='chk'||w.k==='icq')main=`<h4>قائمة الفحص</h4>${ckTable('wp.'+ref+'.ck.',{it:w.it||[]},'wp.'+ref+'.ckc.')}`;
 else if(w.k==='memo')main=`<h4>محتوى المذكرة</h4>${(w.it||[]).map((h,i)=>`<h4>${i+1}. ${esc(h)}</h4>${edc('wp.'+ref+'.memo.'+fnv(h),{label:h})}`).join('')}`;
 else main=`<h4>جدول الاختبار التفصيلي</h4>${gridT(ref,'m')}`;
 const lp=PROCS.filter(p=>split(p.wp).indexOf(ref)>-1);const done=(w.k==='chk'||w.k==='icq')&&(w.it||[]).length?ckCount('wp.'+ref+'.ck.',{it:w.it}):null;
 return `<details class="acc leg" id="leg-${esc(ref)}"${open?' open':''}><summary><span class="ref">${esc(ref)}</span> ${esc(w.ar)} <span class="mut small">${esc(K[0].split(' — ')[1]||K[0])}</span>${done!=null?` <span class="cnt">${done}/${w.it.length}</span>`:''}</summary><div class="in">
 <p class="note">${esc(w.ob||'')}${K[2]?'<br><span class="small">'+esc(K[2])+'</span>':''}</p>
 <div data-lead="${esc(ref)}">${leadHTML(ref)}</div><div data-tbb="${esc(ref)}">${tbBindHTML(ref)}</div>
 ${lp.length?`<details class="nt"><summary>الإجراءات المرتبطة من برنامج المراجعة (${lp.length})</summary>${procTable(lp,{src:1})}</details>`:''}
 <h4>الإجراءات المنفذة</h4>${txt('proc','الإجراءات المنفذة','صف ما تم تنفيذه فعليًا…')}${main}
 <h4>الأدلة والاستثناءات</h4>${txt('ev','الأدلة','الأدلة ومراجعها…')}${gridT(ref,'x')}
 <h4>التحريفات والتسويات المقترحة</h4>${gridT(ref,'a')}
 <h4>الاستنتاج</h4>${txt('cc','الاستنتاج','الاستنتاج على ما تم اختباره…')}
 <details class="nt"><summary>المرفقات والروابط</summary><div data-block="att|${esc(ref)}">${attHTML(ref)}</div><div data-block="lk|${esc(ref)}">${linksHTML(ref)}</div></details></div></details>`}

/* ---------- form renderers ---------- */
const frmFill=s=>String(s||'').replace(/\{company\}/g,CUR.company?CUR.company.name:'').replace(/\{year\}/g,G('eng.year','')).replace(/\{firm\}/g,firmProfile().name||'مكتب المراجعة').replace(/\{date\}/g,new Date().toLocaleDateString('ar-EG'));
function frmBlock(ref,key,b,i){const kp='wp.'+ref+'.'+key.replace(/\W/g,'')+i;let h=b.h?`<h3>${esc(b.h)}</h3>`:'';
 if(b.chk)h+=ckTable(kp+'.ck.',{it:b.chk},kp+'.ckc.');
 if(b.memo)h+=b.memo.map((q,j)=>`<h4>${j+1}. ${esc(q)}</h4>${edc(kp+'.memo.'+fnv(q),{label:q})}`).join('');
 if(b.grid)h+=cgReg(ref,key.replace(/\W/g,'')+i,{cols:b.grid.cols,n:b.grid.n||3,pre:b.grid.pre});
 if(b.letter)h+=`<div class="letter">${edc(kp+'.letter',{dv:frmFill(b.letter),label:'نص الخطاب'})}</div><p class="mut small noprint">يمكن تعديل النص مباشرة؛ استخدم زر الطباعة لتصديره PDF. المتغيرات (الشركة، السنة، المكتب) تُملأ تلقائيًا.</p>`;
 return h}
function frmHTML(ref,key){const f=FORMS[key];if(!f)return `<p class="note warn">النموذج «${esc(key)}» غير متوفر.</p>`;const bl=f.blocks||[f];return (f.obj?`<div class="note">${esc(f.obj)}</div>`:'')+bl.map((b,i)=>frmBlock(ref,key,b,i)).join('')}
function reqHTML(ref,key){const list=REQLISTS[key];if(!list)return `<p class="note warn">قائمة الطلبات «${esc(key)}» غير متوفرة.</p>`;return `<div class="note">قائمة بنود يُطلب من العميل تقديمها. حدّث الحالة وتاريخ الاستحقاق؛ ما يُستلم يُرفق في قسم المرفقات أدناه.</div>`+cgReg(ref,'req'+key.replace(/\W/g,''),{cols:REQCOLS,n:list.length,pre:list.map(x=>({i:x}))})}
function qryHTML(ref,key){return `<div class="note">سجل الاستفسارات الموجّهة للعميل أو لأطراف أخرى بخصوص هذه الورقة؛ تظهر المفتوحة منها في صفحة «الاستفسارات» العامة.</div>`+cgReg(ref,'qry'+key.replace(/\W/g,''),{cols:QCOLS,n:3})}
function tplHTML(id){const t=TPLM[id];if(!t)return `<p class="note warn">النموذج الجاهز «${esc(id)}» غير متوفر.</p>`;return `<div class="card"><b>📄 نموذج جاهز: ${esc(t.ar||t.id)}</b> <a class="btn o sm" href="${L('form/'+encodeURIComponent(id))}">فتح النموذج وتعبئته</a></div>`}

/* ---------- body of a catalog paper ---------- */
function ctBody0(it,opt){opt=opt||{};const ref=it.ref;let h='';const legs=[];
 for(const t of it.ty){
  if(t.t==='L'){t.p.split(',').map(x=>x.trim()).filter(x=>WP[x]).forEach(x=>legs.push(x))}
  else if(t.t==='F')h+=frmHTML(ref,t.p);
  else if(t.t==='R')h+=reqHTML(ref,t.p);
  else if(t.t==='Q')h+=qryHTML(ref,t.p);
  else if(t.t==='TPL')h+=tplHTML(t.p);
  else if(t.t==='ATT')h+=`<h3>المستند المؤيد (الموقّع)</h3><p class="mut small">أرفق النسخة الموقعة؛ تُحفظ مع الارتباط.</p><div data-block="att|${esc(ref)}">${attHTML(ref)}</div>`;
  else if(t.t==='X'){const nm=t.p.split(':')[0];const fn=XP[nm];h+=fn?fn(it,t.p.split(':').slice(1).join(':'),ref):`<p class="note warn">الصفحة الخاصة «${esc(nm)}» قيد الإعداد.</p>`}
  else if(t.t==='CUSTOM')h+=legSec(ref,true).replace('<details class="acc leg"','<details class="acc leg" open')}
 const extra=(it.legacyExtra||[]).filter(x=>legs.indexOf(x)<0);
 if(legs.length||extra.length){const all=legs.concat(extra);h+=`<h3>أوراق العمل التفصيلية المدمجة <span class="cnt">${all.length}</span></h3><p class="mut small">كانت أوراقًا مستقلة في المكتبة؛ دُمجت هنا بنفس بياناتها. افتح القسم المطلوب واملأه.</p>`+all.map(r=>legSec(r,opt.leg===r)).join('')}
 return h}

/* ---------- the generic paper page ---------- */
function ctAutoObj(it,a){try{const XO={"A105": "تجميع الأوراق المؤيدة لقائمة التدفقات النقدية وربطها بحركات الميزان والقوائم المالية.", "A110": "إسناد حسابات ميزان المراجعة إلى بنود القوائم المالية (التبويب) كأساس لإعداد القوائم والجداول الرئيسية.", "A230": "تقييم عوامل خطر الارتباط (العميل، القطاع، الفريق، الإطار الزمني) وأثرها على قبول الارتباط واستراتيجية المراجعة.", "A330": "تتبع اتجاه تحيز الإدارة في المخصصات والتقديرات والاستحقاقات عبر الفترات وتقييم أثره على مخاطر الاحتيال (ISA 540 وISA 240).", "A355Q": "إعداد قائمة موحدة بطلبات المعلومات من العميل (PBC) ومتابعة استلامها وحالة كل طلب.", "A415": "تقييم عوامل الخطر المتأصل (التعقيد، الذاتية، التغير، عدم التأكد، قابلية التحيز) لكل مجال وتأكيد (ISA 315).", "A500": "تحديد الأهمية النسبية الكلية وأهمية الأداء وحد التفاهة وتوثيق أساس اختيارها (ISA 320 وISA 450).", "B020": "استيراد قيود دفتر اليومية والمعاملات بصيغة CSV للتحقق من اكتمالها واختبارها (ISA 240).", "B030": "التحقق من اكتمال ودقة بيانات القيود والمعاملات المستوردة قبل الاعتماد عليها في الاختبارات (ISA 500.9).", "B031": "عرض نتائج فحص اكتمال البيانات والفروق المكتشفة وإجراءات معالجتها.", "B260": "مقارنة تقديرات السنة السابقة بالنتائج الفعلية لتقييم دقة عملية التقدير واكتشاف مؤشرات التحيز (ISA 540).", "B265": "مقارنة تقديرات السنة السابقة المعقدة بالنتائج الفعلية لتقييم دقة عملية التقدير واكتشاف مؤشرات التحيز (ISA 540).", "B350": "تلخيص نتائج تقييم الرقابة الداخلية (التصميم والتطبيق والفعالية) وأوجه القصور المكتشفة.", "B450": "تلخيص المخاطر المقيّمة واستجاباتها في تقرير موحد للمراجعة (ISA 315 وISA 330).", "C120": "ضبط وتلخيص المصادقات الخارجية المرسلة والمستلمة والفروق والإجراءات البديلة (ISA 505).", "C150": "تصميم وتنفيذ إجراءات مراجعة قائمة التدفقات النقدية والتحقق من اتساقها مع القوائم الأخرى (IAS 7).", "D400": "إعداد قوائم مبسطة من ميزان المراجعة بعد التسويات لدعم المراجعة التحليلية والإحالات.", "D401": "عرض قائمة المركز المالي المستخرجة من الميزان بعد التسويات ومطابقتها بالجداول الرئيسية.", "D402": "عرض قائمة الأرباح أو الخسائر المستخرجة من الميزان بعد التسويات ومطابقتها بالجداول الرئيسية.", "D403": "عرض قائمة الدخل الشامل ومكوناتها وإعادة التبويب (IAS 1).", "D404": "عرض قائمة التغير في حقوق الملكية ومطابقتها بحركة الحسابات.", "D406": "إعداد قائمة التدفقات النقدية بالطريقة غير المباشرة ومطابقتها بالقوائم والميزان (IAS 7).", "D407": "مراجعة الإيضاحات المتممة للقوائم المالية واكتمالها واتساقها مع الأستاذ العام.", "D405": "إعداد مسودة القوائم المالية ومراجعتها قبل الاعتماد.", "D410": "التحقق من أن القوائم المالية النهائية تعكس جميع التسويات المعتمدة وتتطابق مع الميزان النهائي."},TOC={"rev": "الإيرادات والمدينين والمقبوضات", "pur": "المشتريات والدائنين والمدفوعات", "pay": "الرواتب", "fr": "إعداد التقارير المالية", "invst": "الاستثمارات", "inv": "المخزون", "tre": "الخزينة", "fa": "الأصول الثابتة", "entity": "الضوابط على مستوى القوائم المالية"};const ty=it.ty||[];
 if(XO[it.ref])return XO[it.ref];
 for(const t of ty){if(t.t==='X'&&/^toc:/.test(t.p||'')){const n=TOC[String(t.p).slice(4)];if(n)return 'اختبار فعالية تشغيل ضوابط «'+n+'» على عينات ممثلة وتوثيق الانحرافات والاستنتاج عن إمكانية الاعتماد عليها (ISA 330).'}}
 for(const t of ty){if(t.t==='L'){const o=String(t.p||'').split(',').map(r=>WP[r.trim()]).filter(w=>w&&w.ob);if(o.length)return o.slice(0,2).map(w=>w.ob).join(' ')}}
 for(const t of ty){if(t.t==='F'&&FORMS[t.p]&&FORMS[t.p].obj)return FORMS[t.p].obj;if(t.t==='TPL'&&TPLM[t.p]&&TPLM[t.p].desc)return TPLM[t.p].desc}
 for(const t of ty){if(t.t==='R')return 'تحديد المستندات والمعلومات المطلوبة من العميل لهذا البند ومتابعة استلامها وحالة كل طلب.';if(t.t==='Q')return 'تسجيل الاستفسارات الموجهة إلى الأطراف المعنية بخصوص هذا البند وتوثيق الردود والأدلة المستلمة (ISA 500).'}
 if(a&&it.sec==='PP')return 'تحقيق أهداف المراجعة لمجال «'+a.ar+'»: فهم الأعمال والمخاطر وتصميم وتنفيذ الإجراءات المناسبة لكل تأكيد وتوثيق الأدلة والاستنتاج (ISA 315 وISA 330 وISA 500).';
 if(a)return 'توثيق الإجراءات والأدلة والاستنتاجات المتعلقة بمجال «'+a.ar+'» وفق المخاطر المقيّمة (ISA 330).';
 }catch(e){}return ''}
function ctHdrDefaults(it,ref){const w=WP[ref];const a=it.area?CT.areaBy[it.area]:null;return{ref:it.disp,client:CUR.company.name,period:G('eng.period',G('eng.year','')),area:a?a.ar:(CT.secs.find(s=>s.id===it.sec)||{ar:''}).ar,acct:a?a.lines.map(l=>AC[l]?AC[l].n:l).join('، '):'',obj:w.ob||it.ob||ctAutoObj(it,a)}}
const HDRAR={ref:'مرجع الورقة',client:'العميل',period:'الفترة',area:'المجال',acct:'الحساب / العملية',obj:'الهدف',asr:'التأكيدات المعنية',risk:'المخاطر المعنية',pop:'المجتمع',smeth:'طريقة العينة',ssize:'حجم العينة',src:'المستندات المصدرية',xref:'المراجع التبادلية'};
function ctPage(it,opt){opt=opt||{};const ref=it.ref,w=WP[ref];PRES.cur.wp=ref;CUR.lock=apFinal({t:'wp',id:ref});const ex=ctOff(ref);const defs=ctHdrDefaults(it,ref);const sec=CT.secs.find(s=>s.id===it.sec)||{ar:''};
  /* v7 · compact header: identity as one meta line, objective visible, rarely-used fields collapsed */
  const XK=['asr','risk','pop','smeth','ssize','src','xref'];
  const xFilled=XK.some(k=>String(G('wp.'+ref+'.h.'+k,'')||'').trim());
  const xHtml=XK.map(k=>`<div><label class="fl">${HDRAR[k]}</label>${edc('wp.'+ref+'.h.'+k,{dv:defs[k]||'',label:HDRAR[k],ph:'—'})}</div>`).join('');
  const meta=[defs.client,defs.period,defs.area].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('<i>·</i>');
  return `<div class="print-head">${esc(CUR.company.name)} · ${esc(G('eng.year',''))} · ${esc(it.disp)} ${esc(it.ar)} · طُبع بواسطة ${esc(SESSION.display)} في ${fmtDT(Date.now())}</div>
  <div class="card wpcard"><div class="wp-title"><div><div class="ref">${esc(it.disp)} <span class="mut small">· ${esc(sec.ar)}</span></div><h1>${esc(it.ar)}</h1><div class="mut small en" dir="ltr">${esc(it.en)}</div><div class="wpmeta">${meta}</div></div>
  <div class="wpact noprint"><div class="wpst">${stChip(ref)} ${isaL(w.isa)}</div><div class="row">${can('edit')?(it.custom?`<button class="btn d sm" type="button" data-v4act="catdel" data-ref="${esc(ref)}">نقل إلى سلة المحذوفات</button>`:`<button class="btn g sm" type="button" data-v4act="catex" data-ref="${esc(ref)}">${ex?'إعادة إدراج الورقة':'استبعاد من الارتباط'}</button>`):''}<button class="btn g sm" type="button" data-act="wpxlsx" data-ref="${esc(ref)}">⤓ Excel</button><button class="btn g sm" type="button" data-act="print">🖨 طباعة</button></div></div></div>
  ${ex?'<div class="note bad">هذه الورقة مستبعدة من الارتباط ومفصولة عن الروابط والتقدم. أعد إدراجها لتفعيل ربطها من جديد.</div>':''}
  <div class="wpobj"><label class="fl">الهدف</label>${edc('wp.'+ref+'.h.obj',{dv:defs.obj||'',label:'الهدف',ph:'—'})}</div>
  <details class="wpx"${xFilled?' open':''}><summary>بيانات إضافية (التأكيدات، المخاطر، المجتمع، العينة، المستندات)</summary><div class="wph">${XK.includes('acct')?'':`<div><label class="fl">${HDRAR.acct}</label>${edc('wp.'+ref+'.h.acct',{dv:defs.acct||'',label:HDRAR.acct,ph:'—'})}</div>`}${xHtml}</div></details></div>
  <details class="wpx wpap" id="wp-ap"><summary>الاعتماد والجاهزية</summary><div data-block="ap|wp:${esc(ref)}">${apHTML({t:'wp',id:ref})}</div>${typeof rdyPanel==='function'?rdyPanel(it):''}</details>
  ${CUR.lock?'<p class="note ok noprint">🔒 هذه الورقة معتمدة ومقفلة للتعديل. يمكن إعادة فتحها بمبرر موثق.</p>':''}
  <div class="wpbody">${ctBody(it,opt)}</div>
  ${typeof excBlock==='function'?excBlock(it):''}<h3>الاستنتاج (Conclusion)</h3>${edc('wp.'+ref+'.t.cc',{label:'الاستنتاج',ph:'بناءً على العمل المنفذ والموثق، الاستنتاج بشأن هذا البند/المجال…'})}
  <details class="wpx"><summary>ملاحظات المراجِع</summary>${edc('wp.'+ref+'.t.rn',{label:'ملاحظات المراجع',ph:'—'})}</details>
  <details class="wpx" id="wp-cm"><summary>التعليقات</summary><div data-block="cm|${esc(ref)}">${cmHTML(ref)}</div></details>
  <details class="wpx" id="wp-sg"><summary>التوقيعات</summary><div class="sgn">${signBox(ref,'prep','أعدها (المعدّ)','edit')}${signBox(ref,'rev','راجعها (المراجع الأول)','review')}${signBox(ref,'part','الشريك','partner')}</div></details>
  <details class="wpx" id="wp-att"><summary>المرفقات</summary><div data-block="att|${esc(ref)}">${attHTML(ref)}</div></details>
  <details class="wpx" id="wp-lk"><summary>الروابط مع أوراق العمل الأخرى</summary><div data-block="lk|${esc(ref)}">${linksHTML(ref)}</div></details>`}

 const V_wp0=V.wp;
V.wp=function(ref){let it=CT.items[ref];if(it)return ctPage(it);
 if(CT.retired&&CT.retired[ref]){const x=CT.retired[ref];return `<div class="card"><h1>${esc(ref)} — ${esc(WP[ref]?WP[ref].ar:'')}</h1><p class="note">أُلغيت هذه الورقة ضمن تبسيط البرنامج: ${esc(x.why)}.${x.host&&CT.items[x.host]?` <a class="btn o sm" href="${L('wp/'+encodeURIComponent(x.host))}">فتح ${esc(CT.items[x.host].disp)} — ${esc(CT.items[x.host].ar)}</a>`:''}</p></div>`}const c=CT.leg[ref];if(c&&CT.items[c]&&WP[ref]&&!WP[ref].custom){return `<p class="note noprint">📌 الورقة <b>${esc(ref)} ${esc(WP[ref].ar)}</b> دُمجت ضمن الورقة ${wpL(c)} — القسم مفتوح أدناه.</p>`+ctPage(CT.items[c],{leg:ref})}
 return V_wp0(ref)};

/* ---------- actions: exclude / restore / delete / create ---------- */
function ctDependents(ref){const out=[];for(const l of allLinks()){if(l.to===ref&&l.from!==ref&&wpAlive(l.from))out.push(l.from)}return [...new Set(out)]}
async function ctToggleEx(refs,label){refs=refs.filter(r=>CT.items[r]);if(!refs.length)return;const off=!refs.every(r=>ctOff(r));
 if(off){const dep=[...new Set(refs.flatMap(ctDependents))].filter(r=>refs.indexOf(r)<0);
  const ok=await ask({title:'استبعاد من الارتباط',body:`<p>سيتم إخفاء <b>${refs.length}</b> ورقة${label?' ('+esc(label)+')':''} من القائمة والتقدم والروابط. لا تُحذف بياناتها ويمكن استرجاعها وإعادة ربطها كاملة من «سلة المحذوفات» أو من نموذج التحكم في الظهور.</p>${dep.length?`<p class="note warn">أوراق أخرى تشير إليها: ${dep.map(esc).join('، ')} — ستُعرض الإشارات معطّلة.</p>`:''}`,ok:'استبعاد'});if(!ok)return}
 const o={};refs.forEach(r=>{o['wp.'+r+'.excluded']=off});CUR.eng.setMany(o,{label:off?'استبعاد أوراق':'إعادة إدراج أوراق'});audit(off?'wp.exclude':'wp.restore',{n:refs.length,refs:refs.slice(0,20)});UI.refreshView();toast(off?'تم الاستبعاد.':'تمت إعادة الإدراج وربطها.','s')}
async function ctNewDlg(pre){pre=pre||{};const secs=CT.secs;const r=await formDlg({title:'ورقة عمل مخصصة جديدة',html:`<div class="fgrid"><label>القسم<select class="sel" name="sec2">${secs.map(s=>`<option value="${s.id}"${pre.sec===s.id?' selected':''}>${esc(s.ar)}</option>`).join('')}</select></label>
  <label>المجموعة (اتركها فارغة لإنشاء «أوراق مخصصة»)<input class="in" name="grpName" value="${esc(pre.grpName||'')}" placeholder="مثال: إجراءات خاصة بالعميل"></label>
  <label>الاسم بالعربية<input class="in" name="ar" required></label><label>الاسم بالإنجليزية (اختياري)<input class="in" name="en" dir="ltr"></label>
  <label>نوع الورقة<select class="sel" name="k"><option value="memo">مذكرة (عناوين نصية)</option><option value="chk">قائمة فحص (بنود)</option><option value="tod" selected>جدول اختبار تفصيلي</option></select></label>
  <label>معايير ISA (اختياري)<input class="in" name="isa" value=""></label>
  <label class="full">الهدف<textarea class="ta" name="ob"></textarea></label>
  <label class="full">البنود / العناوين (سطر لكل بند — للمذكرة وقائمة الفحص)<textarea class="ta" name="items"></textarea></label></div>`,ok:'إنشاء',
  onOk:async d=>{let i=1;while(WP['CW-'+i]||CUR.eng.get('rb.CW-'+i,null))i++;const ref='CW-'+i;
   const grp=String(d.grpName||'').trim();const gid=grp?'CG-'+d.sec2+'-'+fnv(grp):'CG-'+d.sec2;
   CUR.eng.set('cwp.'+ref,{ref,ar:d.ar.trim(),en:(d.en||d.ar).trim(),k:d.k,sec2:d.sec2,grp:gid,grpName:grp||'أوراق مخصصة',isa:d.isa||'',ob:d.ob||'',items:String(d.items||'').split('\n').map(x=>x.trim()).filter(Boolean),by:SESSION.id,t:Date.now()},{label:'ورقة مخصصة'});syncCustomWPs();audit('wp.create',{ref});return ref}});
 if(r)location.hash=L('wp/'+encodeURIComponent(r))}
async function ctDelCustom(ref){const it=CT.items[ref];if(!it||!it.custom)return;const back=ctDependents(ref);
 const ok=await ask({title:'نقل الورقة إلى سلة المحذوفات',body:(back.length?`<p class="note bad">⚠ مرتبطة من ${back.length} ورقة: ${back.map(esc).join('، ')}.</p>`:'')+'<p>تُنقل الورقة وبياناتها إلى «سلة المحذوفات» ويمكن استرجاعها أو حذفها نهائيًا من هناك.</p>',ok:'نقل',danger:true});if(!ok)return;
 const def=CUR.eng.get('cwp.'+ref,null);CUR.eng.set('rb.'+ref,{def,by:SESSION.id,t:Date.now()},{noUndo:true});CUR.eng.set('cwp.'+ref,null,{noUndo:true});syncCustomWPs();audit('wp.delete',{ref});location.hash=L('rbin');toast('نُقلت الورقة '+ref+' إلى سلة المحذوفات.','s')}
function ctRestoreCustom(ref){const rb=CUR.eng.get('rb.'+ref,null);if(!rb||!rb.def)return;CUR.eng.set('cwp.'+ref,rb.def,{noUndo:true});CUR.eng.set('rb.'+ref,null,{noUndo:true});syncCustomWPs();audit('wp.restore',{ref});UI.refreshView();toast('تمت استعادة الورقة '+ref+'.','s')}
function ctPurge(ref){CUR.eng.set('rb.'+ref,null,{noUndo:true});audit('wp.purge',{ref});UI.refreshView()}
V.rbin=function(){const off=CT.order.filter(r=>ctOff(r)&&!CT.items[r].custom);const rb=[...CUR.eng.entries('rb.')].filter(([k])=>!k.slice(3).includes('.')).map(([k,v])=>Object.assign({ref:k.slice(3)},v));
 return `<h1>🗑 سلة المحذوفات والأوراق المستبعدة</h1><p class="sub">ما يُستبعد أو يُحذف لا يضيع: يُفصل عن الروابط والتقدم فورًا، وعند الاسترجاع تعود الروابط والبيانات كاملة.</p>
 <h2>أوراق مستبعدة من الارتباط <span class="cnt">${off.length}</span></h2>${off.length?`<div class="tw"><table><thead><tr><th>المرجع</th><th>الورقة</th><th>القسم</th><th></th></tr></thead><tbody>${off.map(r=>{const it=CT.items[r];return `<tr><td class="ref">${esc(it.disp)}</td><td>${esc(it.ar)}</td><td class="sm">${esc((CT.secs.find(s=>s.id===it.sec)||{}).ar||'')}</td><td class="noprint">${can('edit')?`<button class="btn sm" type="button" data-v4act="catrestore" data-ref="${esc(r)}">استرجاع وإعادة ربط</button>`:''}</td></tr>`}).join('')}</tbody></table></div>`:'<p class="mut">لا توجد أوراق مستبعدة.</p>'}
 <h2>أوراق مخصصة محذوفة <span class="cnt">${rb.length}</span></h2>${rb.length?`<div class="tw"><table><thead><tr><th>المرجع</th><th>الورقة</th><th>حُذفت بواسطة</th><th></th></tr></thead><tbody>${rb.map(x=>`<tr><td class="ref">${esc(x.ref)}</td><td>${esc(x.def?x.def.ar:'')}</td><td class="sm">${esc(USERS.nameOf(x.by))} · ${fmtDT(x.t)}</td><td class="noprint">${can('edit')?`<button class="btn sm" type="button" data-v4act="rbrestore" data-ref="${esc(x.ref)}">استرجاع</button> <button class="btn d sm" type="button" data-v4act="rbpurge" data-ref="${esc(x.ref)}">حذف نهائي</button>`:''}</td></tr>`).join('')}</tbody></table></div>`:'<p class="mut">السلة فارغة.</p>'}`};
document.addEventListener('click',async e=>{const b=e.target instanceof Element&&e.target.closest('[data-v4act]');if(!b)return;const a=b.dataset.v4act,ref=b.dataset.ref;
 try{if(a==='catex'&&!RO()){await ctToggleEx([ref])}
 else if(a==='catrestore'&&can('edit')){await ctToggleEx([ref])}
 else if(a==='catdel'&&can('edit'))await ctDelCustom(ref);
 else if(a==='rbrestore'&&can('edit'))ctRestoreCustom(ref);
 else if(a==='rbpurge'&&can('edit')){if(await ask({title:'حذف نهائي',body:'حذف الورقة نهائيًا من السلة؟',ok:'حذف',danger:true}))ctPurge(ref)}
 else if(a==='catnew'&&can('edit'))await ctNewDlg({sec:b.dataset.sec})}catch(x){logErr('catalog action '+a,x);toast(errMsg(x),'e')}});
