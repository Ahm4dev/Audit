/* MEAP · Indexes (stable content-based IDs) and audit views */
'use strict';
/* ================= a5 · Indexes (stable content-based IDs) and audit views ================= */
const WP={};
function addWP(w,custom){WP[w[0]]={ref:w[0],en:w[1],ar:w[2],k:w[3],isa:split(w[4]),ob:w[5]||'',it:w[6]||null,cols:w[7]||null,sec:w[0].split('-')[0],custom:!!custom}}
W.forEach(w=>addWP(w));
const AC={};A.forEach(a=>{AC[a.id]=a});const CY={};C.forEach(c=>{CY[c.id]=c});const IN={};IND.forEach(i=>{IN[i.id]=i});const CXM={};CX.forEach(x=>{CXM[x.id]=x});const PHM={};PH.forEach(p=>{PHM[p.id]=p});
/* IDs derive from content (hash of type+text), not from position — editing/reordering the library no longer shifts saved statuses. */
const IDS=new Set();const sid=b=>{let id=b,i=2;while(IDS.has(id))id=b+'~'+(i++);IDS.add(id);return id};
const PROCS=[],RISKS=[],CTRLS=[],OLDID={};
function addP(src,o,arr,base){(arr||[]).forEach((p,i)=>{if(p.length===4)p=[p[0],p[1],p[2],'',p[3]];const id=sid(src+':'+o.id+':'+fnv(p[0]+'|'+p[2]));OLDID[src+':'+o.id+':'+i]=id;
 PROCS.push(Object.assign({id,src,sid:o.id,sn:o.n,t:p[0],as:split(p[1]),tx:p[2],ev:p[3]||'',wp:p[4]||'',isa:split(p[5]||o.isa),lv:'M',cy:'',acc:'',ind:''},base||{}))})}
PH.forEach(p=>{addP('ph',p,p.pr,{lv:'M'});(p.rk||[]).forEach((r,i)=>RISKS.push({id:'ph:'+p.id+':'+i,lv:'M',sig:false,fr:/احتيال|Fraud/i.test(r),as:[],d:r,src:'ph',sid:p.id,sn:p.n,href:'ph/'+p.id}))});
A.forEach(a=>{addP('acc',a,a.pr,{lv:a.ir,cy:a.cy,acc:a.id});
 a.rk.forEach((r,i)=>RISKS.push({id:'acc:'+a.id+':'+i,lv:r[0],sig:r[1].indexOf('S')>-1,fr:r[1].indexOf('F')>-1,as:split(r[2]),d:r[3],src:'acc',sid:a.id,sn:a.n,href:'acc/'+a.id,acc:a.id,cy:a.cy}));
 a.ctl.forEach((c,i)=>CTRLS.push({id:a.id.toUpperCase()+'-K'+(i+1),d:c,src:'acc',sid:a.id,sn:a.n,href:'acc/'+a.id,acc:a.id,cy:a.cy}))});
C.forEach(c=>{const pre=c.id.toUpperCase();const wid=sid('cyc:'+c.id+':wt');OLDID['cyc:'+c.id+':wt']=wid;
 PROCS.push({id:wid,src:'cyc',sid:c.id,sn:c.n,t:'WT',as:[],tx:c.wt,ev:'توثيق جولة التتبع: مستندات المعاملة المختارة، لقطات شاشة النظام، مقابلات أصحاب العمليات، مقارنة الواقع بالسرد',wp:'C-06 C-03 C-04',isa:['315'],lv:'M',cy:c.id,acc:'',ind:''});
 c.rcm.forEach((r,i)=>{const cid=pre+'-C'+String(i+1).padStart(2,'0');const id=sid('rcm:'+c.id+':'+fnv(r[1]));OLDID['rcm:'+c.id+':'+i]=id;
  PROCS.push({id,src:'cyc',sid:c.id,sn:c.n,t:'TOC',as:split(r[5]),tx:'['+cid+'] '+r[6],ev:'عينة اختبار الرقابة موثقة بسمات الرقابة (Control Attributes) وأدلة الأداء والمراجعة',wp:'C-09 C-05',isa:['330'],lv:r[7]||'M',cy:c.id,acc:'',ind:''});
  RISKS.push({id:'rcm:'+c.id+':'+i,lv:r[7]||'M',sig:false,fr:false,as:split(r[5]),d:r[0],src:'cyc',sid:c.id,sn:c.n,href:'cyc/'+c.id,cy:c.id});
  CTRLS.push({id:cid,d:r[1],ty:r[2],na:r[3],fq:r[4],as:split(r[5]),test:r[6],risk:r[0],src:'cyc',sid:c.id,sn:c.n,href:'cyc/'+c.id,cy:c.id})});
 addP('cyc',c,c.sub,{cy:c.id})});
CX.forEach(x=>{addP('cx',x,x.pr,{lv:'H'});x.rk.forEach((r,i)=>RISKS.push({id:'cx:'+x.id+':'+i,lv:r[0],sig:r[1].indexOf('S')>-1,fr:r[1].indexOf('F')>-1,as:split(r[2]),d:r[3],src:'cx',sid:x.id,sn:x.n,href:'cx/'+x.id}))});
IND.forEach(d=>{addP('ind',d,d.pr,{lv:'H',ind:d.id});d.rk.forEach((r,i)=>RISKS.push({id:'ind:'+d.id+':'+i,lv:'H',sig:false,fr:/احتيال|تلاعب/.test(r),as:[],d:r,src:'ind',sid:d.id,sn:d.n,href:'ind/'+d.id,ind:d.id}))});
addP('grp',{id:'grp',n:'مراجعة المجموعات والتجميع (Group Audit)',isa:'600'},GA.pr,{lv:'H'});
GA.rk.forEach((r,i)=>RISKS.push({id:'grp:'+i,lv:r[0],sig:r[1].indexOf('S')>-1,fr:r[1].indexOf('F')>-1,as:split(r[2]),d:r[3],src:'grp',sid:'grp',sn:'Group Audit',href:'group'}));
ITC.forEach((tc,i)=>{const cid='IT-'+String(i+1).padStart(2,'0');const id=sid('itc:'+fnv(tc.n+'|'+tc.test));OLDID['itc:'+i]=id;tc._pid=id;
 PROCS.push({id,src:'itc',sid:'itc',sn:tc.n,t:tc.k==='ITGC'?'ITGC':'TOC',as:split(tc.as),tx:'['+cid+'] '+tc.test,ev:tc.ev,wp:tc.wp,isa:['315','330'],lv:tc.lv||'M',cy:'',acc:'',ind:''});
 CTRLS.push({id:cid,d:tc.ctl,ty:tc.ty||'P',na:tc.na||'A',fq:tc.fq||'',as:split(tc.as),test:tc.test,risk:tc.rk,src:'itc',sid:'itc',sn:tc.n,href:'itc'});
 RISKS.push({id:'itr:'+i,lv:tc.lv||'M',sig:false,fr:false,as:split(tc.as),d:tc.rk,src:'itc',sid:'itc',sn:tc.n,href:'itc'})});
const PIDX={};PROCS.forEach(p=>{PIDX[p.id]=p});
const SRCN={ph:'مرحلة',acc:'حساب',cyc:'دورة',cx:'مجال معقد',ind:'قطاع',grp:'المجموعة',itc:'رقابة/IT'};
const srcHref=p=>({ph:'ph/',acc:'acc/',cyc:'cyc/',cx:'cx/',ind:'ind/'}[p.src]||'')+(p.src==='grp'?'group':p.src==='itc'?'itc':p.sid);
const DONE={CP:1,RV:1,CL:1};
const HDR=[['ref','Working Paper Reference'],['client','Client Name'],['period','Reporting Period'],['area','Audit Area'],['acct','Account / Process'],['obj','Objective'],['asr','Relevant Assertions'],['risk','Relevant Risks'],['mat','Materiality (OM / PM / CT)'],['pop','Population'],['smeth','Sampling Method'],['ssize','Sample Size'],['src','Source Documents'],['xref','Cross-references']];
const XCOLS='# | Description | Item Ref | Assertion | Amount | Root Cause | Impact | Misstatement? (Y/N) | Finding Log Ref'.split(' | ');
const ACOLS='# | Description | Dr Account | Cr Account | Amount | Type (Factual/Judgmental/Projected) | Proposed / Passed | W-Ref'.split(' | ');
const LINKT=[['xref','مرجع تقاطعي (Cross-reference)'],['supports','يدعم / مؤيد لـ (Supports)'],['carried','يُرحَّل إلى (Carried to)'],['derived','مستمد من (Derived from)'],['depends','يعتمد على (Depends on)'],['lead','جدول رئيسي لـ (Lead schedule of)'],['sample','عينة من (Sample of)'],['supersedes','يحل محل (Supersedes)']];

/* ---------- state helpers ---------- */
const G=(k,d)=>CUR.eng?CUR.eng.get(k,d):d;
const RO=()=>!can('edit')||!!CUR.lock;
const L=p=>CUR.base+'/'+p;
function prog(ids,store){store=store||CUR.eng;let d=0,tt=0,ex=0;ids.forEach(id=>{const v=store?store.get('st.'+id,'NS'):'NS';if(v==='NA')return;tt++;if(DONE[v])d++;if(v==='EX')ex++});return{d,t:tt,ex,p:tt?Math.round(d*100/tt):0}}
function keyLabel(k){const p=k.split('.');
 if(p[0]==='st'||p[0]==='nt'){const pr=PIDX[p.slice(1).join('.')];return (p[0]==='st'?'حالة إجراء: ':'ملاحظة إجراء: ')+(pr?pr.tx.slice(0,60)+'…':p[1])}
 if(p[0]==='wp'){const w=WP[p[1]];const part={wf:'سير العمل',h:'رأس الورقة',t:'نص',g:'جدول',memo:'مذكرة',ck:'قائمة فحص',ckc:'تعليق',so:'توقيع',att:'مرفق',lk:'رابط',excluded:'استبعاد'}[p[2]]||p[2];return `${p[1]}${w?' '+w.ar:''} — ${part}`}
 if(p[0]==='f')return 'ملاحظة/استثناء '+(p[2]||'');if(p[0]==='a')return 'تسوية '+(p[2]||'');if(p[0]==='r')return 'ملاحظة مراجعة '+(p[2]||'');
 if(p[0]==='eng')return 'بيانات الارتباط: '+p[1];if(p[0]==='cc')return 'استنتاج حساب: '+(AC[p[1]]?AC[p[1]].n:p[1]);if(p[0]==='ck'||p[0]==='ckc')return 'قائمة فحص';if(p[0]==='cwp')return 'ورقة عمل مخصصة '+p[1];if(p[0]==='sys')return 'النظام: '+p.slice(1).join('.');return k}

/* ---------- UI fragments ---------- */
const lvB=l=>`<span class="b ${l}">${{H:'مرتفع High',M:'متوسط Medium',L:'منخفض Low'}[l]||esc(l)}</span>`;
const asB=a=>(a||[]).map(k=>ASR[k]?`<span class="b as" title="${esc(ASR[k][0]+' — '+ASR[k][2])}">${ASR[k][1]}</span>`:'').join('');
const isaL=a=>(a||[]).map(n=>`<a class="b isa" href="${L('isa/'+n)}">ISA ${esc(n)}</a>`).join('');
let wpL=s=>split(s).map(r=>WP[r]?`<a class="wpl" href="${L('wp/'+encodeURIComponent(r))}" title="${esc(WP[r].ar+' · '+WP[r].en)}">${esc(r)}</a>`:`<span class="wpl">${esc(r)}</span>`).join(' ');
const ptB=tp=>`<span class="pt" title="${esc(PT[tp]?PT[tp][1]:tp)}">${PT[tp]?PT[tp][0]:esc(tp)}</span>`;
function stSel(id){const v=G('st.'+id,'NS');return `<select class="st st-${v}" data-k="st.${esc(id)}" data-dv="NS" aria-label="حالة الإجراء"${RO()?' disabled':''}>${STATUS.map(s=>`<option value="${s[0]}"${s[0]===v?' selected':''}${(s[0]==='RV'||s[0]==='CL')&&!can('review')?' disabled':''}>${s[1]}</option>`).join('')}</select>`}
function wfSel(ref){const k='wp.'+ref+'.wf';const v=G(k,'NS');return `<select class="st st-${v}" data-k="${esc(k)}" data-dv="NS" aria-label="سير عمل ورقة العمل ${esc(ref)}"${RO()?' disabled':''}>${WF.map(s=>`<option value="${s[0]}"${s[0]===v?' selected':''}${['RV','CL','FN'].includes(s[0])&&!can('review')?' disabled':''}>${s[1]}</option>`).join('')}</select>`}
function noteBox(id){const k='nt.'+id;const v=G(k,'');return `<details class="nt"><summary>📝 ${v?'ملاحظة ●':'إضافة ملاحظة'}</summary><textarea class="ta" data-k="${esc(k)}" aria-label="ملاحظات المراجع / المرجع التقاطعي" placeholder="ملاحظات المراجع / المرجع التقاطعي…"${RO()?' readonly':''}>${esc(v)}</textarea></details>`}
function edc(k,o){o=o||{};const v=G(k,null);const dv=o.dv==null?'':String(o.dv);const shown=v==null?dv:v;
 return `<div class="ed" contenteditable="${RO()?'false':CE}" role="textbox" aria-multiline="true" aria-label="${esc(o.label||'')}" data-k="${esc(k)}"${dv?` data-dv="${esc(dv)}"`:''}${o.ph?` data-ph="${esc(o.ph)}"`:''}>${esc(shown)}</div>`}
const bar=p=>`<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><i style="width:${p}%"></i></div>`;
const ul=a=>`<ul class="l">${(a||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
const sec=(id,ti,body,cnt)=>`<h2 id="${id}" tabindex="-1">${ti}${cnt!=null?` <span class="cnt">${cnt}</span>`:''}</h2>${body}`;
const chain=items=>`<div class="chain noprint">${items.map((x,i)=>(i?'<i aria-hidden="true">←</i>':'')+`<button type="button" data-jump="${x[0]}">${esc(x[1])}</button>`).join('')}</div>`;

const PBULK=new Set();
function procTable(list,opt){opt=opt||{};if(!list.length)return '<p class="mut">لا توجد إجراءات مطابقة.</p>';
 return `<div class="tw"><table><thead><tr>${opt.sel?'<th class="noprint"><span class="sr">تحديد</span></th>':''}<th>النوع</th>${opt.src?'<th>المصدر</th>':''}<th>إجراء المراجعة (Audit Procedure)</th><th>التأكيدات</th>${opt.lv?'<th>الخطر</th>':''}<th>الدليل المطلوب (Evidence)</th><th>ورقة العمل</th><th>ISA</th><th>الحالة</th></tr></thead><tbody>${list.map(p=>`<tr>${opt.sel?`<td class="noprint"><input type="checkbox" data-psel="${esc(p.id)}" aria-label="تحديد الإجراء"${PBULK.has(p.id)?' checked':''}></td>`:''}<td>${ptB(p.t)}</td>${opt.src?`<td><span class="mut">${SRCN[p.src]}:</span> <a href="${L(srcHref(p))}">${esc(p.sn)}</a></td>`:''}<td class="tx">${esc(p.tx)}${noteBox(p.id)}${ppDetails(p.id)}</td><td>${asB(p.as)}</td>${opt.lv?`<td>${lvB(p.lv)}</td>`:''}<td class="sm">${esc(p.ev)}</td><td>${wpL(p.wp)}</td><td>${isaL(p.isa)}</td><td>${stSel(p.id)}</td></tr>`).join('')}</tbody></table></div>`}
function riskTable(list){if(!list.length)return '<p class="mut">لا توجد مخاطر مطابقة.</p>';
 return `<div class="tw"><table><thead><tr><th>#</th><th>وصف الخطر (Risk Description)</th><th>المستوى</th><th>جوهري/احتيال</th><th>التأكيدات</th><th>المصدر</th></tr></thead><tbody>${list.map(r=>`<tr><td class="mut">${esc(r.id.split(':').slice(-2).join('-'))}</td><td class="tx">${esc(r.d)}</td><td>${lvB(r.lv)}</td><td>${r.sig?'<span class="b sig">Significant Risk</span>':''}${r.fr?'<span class="b fr">Fraud Risk</span>':''}</td><td>${asB(r.as)}</td><td><span class="mut">${SRCN[r.src]}:</span> <a href="${L(r.href)}">${esc(r.sn)}</a></td></tr>`).join('')}</tbody></table></div>`}
function ctrlTable(list){if(!list.length)return '<p class="mut">لا توجد ضوابط.</p>';
 return `<div class="tw"><table><thead><tr><th>Control ID</th><th>الخطر المعالَج</th><th>وصف الرقابة (Control)</th><th>النوع</th><th>الطبيعة</th><th>التكرار</th><th>التأكيدات</th><th>اختبار الرقابة (TOC)</th><th>المصدر</th></tr></thead><tbody>${list.map(c=>`<tr><td class="ref">${esc(c.id)}</td><td class="sm">${esc(c.risk||'')}</td><td class="tx">${esc(c.d)}</td><td>${c.ty?(c.ty==='P'?'وقائية Preventive':'كاشفة Detective'):''}</td><td>${{M:'يدوية Manual',A:'آلية Automated',ITDM:'IT-dependent Manual'}[c.na]||esc(c.na||'')}</td><td>${esc(c.fq||'')}</td><td>${asB(c.as)}</td><td class="sm">${esc(c.test||'')}</td><td><a href="${L(c.href)}">${esc(c.sn)}</a></td></tr>`).join('')}</tbody></table></div>`}

/* ---------- Engagement navigation ---------- */
const NAV=[['g1','لوحة التحكم',[['dash','📊 لوحة المؤشرات'],['tb','📒 ميزان المراجعة (Trial Balance)'],['inbox','📥 بانتظار مراجعتي والإشعارات'],['program','🧭 البرنامج الرئيسي (Master Audit Program)'],['explorer','🔎 البحث والتصفية المتقدمة'],['logs','⚠️ الملاحظات والتسويات وملاحظات المراجعة'],['report','🖨 التقرير الموحد للارتباط']]],
 ['g2','الفهارس',[['fs','📒 القوائم المالية والحسابات'],['cycles','🔁 دورات العمليات'],['risks','🎯 مكتبة المخاطر'],['rcm','🛡️ مكتبة RCM'],['assert','✅ تأكيدات الإدارة'],['evidence','📎 أدلة المراجعة']]],
 ['g3','المجالات المتخصصة',[['itc','💻 الرقابة الداخلية وتقنية المعلومات'],['cx','⚡ المجالات المعقدة'],['group','🏢 المجموعات والتجميع'],['ind','🏭 القطاعات'],['sampling','🧮 العينات والأهمية النسبية'],['jet','🧾 الاختبار الآلي لقيود اليومية (JET)']]],
 ['g4','التوثيق والإقفال',[['wplib','🗂️ مكتبة أوراق العمل'],['print','🖨 حزمة الطباعة / PDF'],['forms','📝 النماذج والتقارير والخطابات'],['refs','🔖 المراجع وتتبعها'],['model','🧩 نموذج البيانات والعلاقات'],['disc','📑 قائمة الإفصاحات'],['comp','🏁 قائمة الإقفال'],['isa','📘 فهرس ISA'],['docs','🗃️ متطلبات التوثيق'],['audit','🕘 سجل التدقيق (Audit Trail)']]]];
const TABS=[['dash','المؤشرات'],['tb','ميزان المراجعة'],['program','البرنامج'],['fs','الحسابات'],['cycles','الدورات'],['risks','المخاطر وRCM'],['wplib','أوراق العمل'],['logs','الملاحظات والتسويات'],['forms','النماذج والتقارير'],['comp','الإقفال'],['report','التقرير']];
const VIEW_TAB={ph:'program',acc:'fs',cyc:'cycles',rcm:'risks',wp:'wplib',form:'forms',refs:'',ref1:'',model:'',proc:'',disc:'comp',isa:'',search:''};
const VIEW_NAV={ph:'program',acc:'fs',cyc:'cycles',wp:'wplib',form:'forms',ref1:'refs',proc:'explorer',isa1:'isa',cx1:'cx',ind1:'ind'};
function navProg(v){const ck=(pref,list)=>{let tt=0,d=0;list.forEach(x=>x.it.forEach(it=>{tt++;if(G('ck.'+pref+x.id+':'+fnv(it)))d++}));return tt?Math.round(d*100/tt):0};
 const pp=f=>prog(PROCS.filter(f).map(p=>p.id)).p;
 switch(v){case 'program':return pp(p=>p.src==='ph');case 'fs':return pp(p=>p.src==='acc');case 'cycles':return pp(p=>p.src==='cyc');case 'itc':return pp(p=>p.src==='itc');case 'cx':return pp(p=>p.src==='cx');case 'group':return pp(p=>p.src==='grp');
  case 'disc':return ck('disc:',DISC);case 'comp':return ck('comp:',COMP);case 'wplib':{const n=W.filter(w=>['CL','FN'].includes(G('wp.'+w[0]+'.wf'))).length;return Math.round(n*100/W.length)}default:return null}}
/* Sidebar never scrolls on its own: if it gets taller than the screen, only the active group stays open */

const V={};
