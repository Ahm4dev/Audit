/* Audit-Plus · V4 · Areas (47_area) */
'use strict';
/* ===== 47_area.js ===== */
/* =====================================================================
   v4 · Audit areas: account → area mapping from the classified TB, area pages (101, 101E, 101Q, 120, 125),
   risk-of-material-misstatement matrix, controls, procedures. Single source: rmm.<area>.<assertion>.*
   ===================================================================== */
const AREA_SUB={GG:/منح|grant/,LSR:/تاجير تمويلي|مؤجر|lessor|finance lease|صافي الاستثمار/,DEF:/ايرادات مؤجله|ايراد مؤجل|deferred (income|revenue)/,OTX:/قيمه مضافه|كسب العمل|خصم|اضافه|دمغه|vat|withholding|stamp|payroll/,SBP:/مدفوعات|خيارات|share.?based|sbp|esop/,DTX:/مؤجل|deferred/,ZKT:/زكا|zakat/,ITB:/ضريبه الدخل|income tax|ضرائب الدخل|ضريبه الشركات/};
const AREA_FALL={oliab:{'مطلوبات متداولة':'OCL'}};
SRCN['مجال']='مجال';
const AREA_SIGN=a=>(a.sup==='EQ'||a.sup==='NCL'||a.sup==='CL'||a.id==='REV'||a.id==='OIN'||a.id==='OCI')?-1:1;
let AMAP={key:'',m:new Map(),data:new Map(),un:[],lineAreas:null};
function areaOverrideKey(){const parts=[];if(CUR.eng)for(const [k,v] of CUR.eng.entries('tba.'))parts.push(k+'='+v);return parts.join('|')}
function areaOfRow(r,lineAreas,ov){const o=ov.get(r.code);if(o&&CT.areaBy[o])return CT.areaBy[o];const line=tbMapOf(r.code);if(!line)return null;let cs=lineAreas[line];if(!cs)return null;if(cs.length===1)return cs[0];
 const c=clsOf(r.code);const txt=normAr(r.name+' '+r.nameEn+' '+(c?c.u+' '+c.n:''));
 for(const a of cs){const re=AREA_SUB[a.id];if(re&&re.test(txt))return a}
 const fb=AREA_FALL[line];if(fb&&c&&fb[c.g]&&CT.areaBy[fb[c.g]])return CT.areaBy[fb[c.g]];
 if(c&&c.g){const f=cs.filter(a=>!a.gf||a.gf===c.g||a.id==='ITB');if(f.length)cs=f}
 if(line==='nonop')return (r.cb<0?cs.find(a=>a.id==='OIN'):cs.find(a=>a.id==='OEX'))||cs[0];
 return cs.find(a=>!AREA_SUB[a.id])||cs[0]}
function areaMap(){const k=TBSTORE.ver+':'+CLSV+':'+TBMV+':'+(CUR.eng&&CUR.eng.path)+':'+areaOverrideKey();if(AMAP.key===k)return AMAP;
 const la={};for(const a of CT.areas)for(const l of a.lines)(la[l]=la[l]||[]).push(a);
 const ov=new Map();if(CUR.eng)for(const [kk,v] of CUR.eng.entries('tba.')){ov.set(decodeURIComponent(kk.slice(4)),v)}
 const data=new Map(CT.areas.map(a=>[a.id,{rows:[],cy:0,cyu:0,py:null,bud:null,ob:null,obSrc:''}]));const realOb=typeof tbiHasOb==='function'&&tbiHasOb();const un=[];const m=new Map();
 if(TBSTORE.ready()){const adj=tbAdjMap(CUR.eng);const pm=TBSTORE.pyMap;
  for(const r of TBSTORE.rows){const a=areaOfRow(r,la,ov);if(!a){un.push(r);continue}m.set(r.code,a.id);const d=data.get(a.id);const ad=adj.get(r.code)||0;const isPL=a.sup==='PL'||a.id==='REV'||a.id==='OIN'||a.id==='OEX';const ob=realOb?r.ob:(pm&&!isPL?(pm.get(r.code)||0):null);const x={r,cyu:r.cb,adj:ad,cy:r.cb+ad,py:pm?(pm.get(r.code)||0):null,bud:r.bud==null?null:r.bud,ob};
   d.rows.push(x);d.cyu+=x.cyu;d.cy+=x.cy;if(x.py!=null)d.py=(d.py||0)+x.py;if(x.bud!=null)d.bud=(d.bud||0)+x.bud;if(x.ob!=null){d.ob=(d.ob||0)+x.ob;d.obSrc=realOb?'tb':'py'}}}
 AMAP={key:k,m,data,un,lineAreas:la};return AMAP}
function areaData(id){return areaMap().data.get(id)||{rows:[],cy:0,cyu:0,py:null,bud:null,ob:null,obSrc:''}}
function areaOf(code){return areaMap().m.get(code)||''}
const fm=v=>v==null||!isFinite(v)?'—':(v<0?'('+Math.abs(Math.round(v)).toLocaleString('en-US')+')':(Math.round(v)+0).toLocaleString('en-US'));

/* ---------- RMM model ---------- */
const LV=[['L','منخفض'],['M','متوسط'],['H','مرتفع']];const LVN={L:1,M:2,H:3};
const rmmCombine=(ir,cr)=>{const p=(LVN[ir]||2)*(LVN[cr]||2);return p>=6?'H':p>=3?'M':'L'};
function areaAssertions(a){const s=[];for(const l of a.lines){const ac=AC[l];if(ac)split(String(ac.as).replace(/,/g,' ')).forEach(x=>{if(ASR[x]&&s.indexOf(x)<0)s.push(x)})}
 if(!s.length)return a.sup==='PL'?['O','C','A','CO','CL','P','D']:['E','C','R','V','CL','P','D'];return ['E','O','C','A','CO','V','AL','R','CL','P','D'].filter(x=>s.indexOf(x)>-1)}
function areaIRdef(a){for(const l of a.lines){const ac=AC[l];if(ac&&ac.ir)return ac.ir}return 'M'}
function areaCRdef(a){for(const l of a.lines){const ac=AC[l];if(ac&&ac.cr)return ac.cr}return 'M'}
function rmmGet(id,as){const a=CT.areaBy[id];const k='rmm.'+id+'.'+as+'.';const ir=G(k+'ir',areaIRdef(a)),cr=G(k+'cr',areaCRdef(a));return{ir,cr,rmm:rmmCombine(ir,cr),sg:!!G(k+'sg',false),fr:!!G(k+'fr',false),nt:G(k+'nt','')}}
function areaRmm(id){const a=CT.areaBy[id];let best='L';for(const as of areaAssertions(a)){const r=rmmGet(id,as);if(LVN[r.rmm]>LVN[best])best=r.rmm}return best}
function areaSig(id){const a=CT.areaBy[id];return areaAssertions(a).some(as=>rmmGet(id,as).sg)}
const rmmB=l=>`<span class="b ${l}">${({L:'منخفض',M:'متوسط',H:'مرتفع'})[l]}</span>`;
function cgData(ref,gid,spec){const rows=cgRows(ref,gid,spec);const base=cgKey(ref,gid);return rows.map((rid,i)=>{const o={rid};for(const c of spec.cols){let v=G(base+'.v.'+rid+'.'+c.k,null);if(v==null&&spec.pre&&spec.pre[i]&&rid==='r'+i)v=spec.pre[i][c.k];o[c.k]=v==null?'':v}return o})}

/* ---------- area TB panel ---------- */
function areaTBPanel(a,ref,opts){opts=opts||{};if(!TBSTORE.ready())return `<div class="note warn">لم يُحمَّل ميزان المراجعة بعد. <a href="${L('tb/upload')}">ارفع الميزان</a> ثم بوّب الحسابات لتظهر الأرصدة هنا تلقائيًا.</div>`;
 const D=areaData(a.id),sg=AREA_SIGN(a),M=matState(),pm=M.pm;const rows=D.rows.slice().sort((x,y)=>Math.abs(y.cy)-Math.abs(x.cy));const lim=opts.limit||25;const hasPy=D.py!=null;const hasBud=D.bud!=null&&Math.abs(D.bud)>0.5;const hasOb=D.ob!=null&&D.rows.some(x=>x.ob!=null&&Math.abs(x.ob)>0.005);
 const row=x=>{const d=hasPy?x.cy-x.py:null;const ch=hasPy&&x.py?d/Math.abs(x.py):null;const over=pm&&d!=null&&Math.abs(d)>pm;
  return `<tr><td class="ref">${esc(x.r.code)}</td><td class="tx">${esc(x.r.name)}</td>${hasOb?`<td class="num" dir="ltr">${x.ob==null?'—':fm(x.ob*sg)}</td><td class="num" dir="ltr">${x.ob==null?'—':fm((x.cy-x.ob)*sg)}</td>`:''}<td class="num" dir="ltr">${fm(x.cyu*sg)}</td><td class="num" dir="ltr">${x.adj?fm(x.adj*sg):'—'}</td><td class="num" dir="ltr"><b>${fm(x.cy*sg)}</b></td>${hasPy?`<td class="num" dir="ltr">${fm(x.py*sg)}</td><td class="num${over?' ovr':''}" dir="ltr">${fm(d*sg)}</td><td class="num${over?' ovr':''}" dir="ltr">${ch==null?'—':(ch*100).toFixed(0)+'%'}</td>`:''}${hasBud?(()=>{const bd=x.cy-(x.bud||0);const ob=pm&&x.bud&&Math.abs(bd)>pm;return `<td class="num" dir="ltr">${!x.bud?'—':fm(x.bud*sg)}</td><td class="num${ob?' ovr':''}" dir="ltr">${!x.bud?'—':fm(bd*sg)}</td>`})():''}</tr>`};
 const tot=`<tr class="tot"><td></td><td>الإجمالي (${rows.length.toLocaleString('en-US')} حساب)</td>${hasOb?`<td class="num" dir="ltr">${fm(D.ob*sg)}</td><td class="num" dir="ltr">${fm((D.cy-D.ob)*sg)}</td>`:''}<td class="num" dir="ltr">${fm(D.cyu*sg)}</td><td class="num" dir="ltr">${fm((D.cy-D.cyu)*sg)}</td><td class="num" dir="ltr"><b>${fm(D.cy*sg)}</b></td>${hasPy?`<td class="num" dir="ltr">${fm(D.py*sg)}</td><td class="num" dir="ltr">${fm((D.cy-D.py)*sg)}</td><td class="num" dir="ltr">${D.py?(((D.cy-D.py)/Math.abs(D.py))*100).toFixed(0)+'%':'—'}</td>`:''}${hasBud?`<td class="num" dir="ltr">${fm(D.bud*sg)}</td><td class="num" dir="ltr">${fm((D.cy-D.bud)*sg)}</td>`:''}</tr>`;
 const head=`<thead><tr><th>الكود</th><th>الحساب</th>${hasOb?'<th>أول المدة</th><th>الحركة</th>':''}<th>قبل التسويات</th><th>التسويات</th><th>بعد التسويات</th>${hasPy?'<th>السنة السابقة</th><th>التغير</th><th>%</th>':''}${hasBud?'<th>الموازنة</th><th>الفرق عن الموازنة</th>':''}</tr></thead>`;
 if(!rows.length)return `<div class="note warn">لا توجد حسابات مبوّبة على هذا المجال. تحقق من <a href="${L('tb/cls')}">تبويب الحسابات</a> (الخطوط المرتبطة: ${a.lines.map(l=>AC[l]?esc(AC[l].n):esc(l)).join('، ')}).</div>`;
 return `<div class="tw"><table class="v4lead">${head}<tbody>${rows.slice(0,lim).map(row).join('')}</tbody>${tot}</table></div>${rows.length>lim?`<details class="nt"><summary>عرض باقي الحسابات (${rows.length-lim})</summary><div class="tw"><table>${head}<tbody>${rows.slice(lim,500).map(row).join('')}</tbody></table></div>${rows.length>500?'<p class="mut small">تم عرض أول 500 حساب؛ الباقي في صفحة الميزان.</p>':''}</details>`:''}
 ${areaBranchHTML(a,D,sg)}
 ${typeof XC!=='undefined'?XC.areaCharts(a,D,sg):''}<p class="mut small">${hasOb?(D.obSrc==='tb'?'أول المدة من الميزان المرفوع · ':'أول المدة = رصيد ختام السنة السابقة · '):''}${esc(TBSTORE.stamp())} · الأرصدة بالإشارة الطبيعية للمجال · ${pm?`الفروق الأكبر من أهمية الأداء (${fmtN(pm)}) مظللة`:'لم تُحتسب الأهمية النسبية بعد'}.${(a.sup==='PL'||a.sup==='CA'||true)?'':''}</p>`}

function areaBranchHTML(a,D,sg){const m=new Map();for(const x of D.rows){const b=String(x.r.branch||'').trim();if(!b)continue;const o=m.get(b)||{cy:0,py:null,n:0};o.cy+=x.cy;if(x.py!=null)o.py=(o.py||0)+x.py;o.n++;m.set(b,o)}
 if(!m.size)return'';const arr=[...m.entries()].sort((p,q)=>Math.abs(q[1].cy)-Math.abs(p[1].cy));const unb=D.rows.filter(x=>!String(x.r.branch||'').trim());const un=unb.reduce((t,x)=>t+x.cy,0);
 return `<details class="nt" open><summary>التوزيع حسب الفرع / المخزن (${arr.length})</summary><div class="tw"><table><thead><tr><th>الفرع / المخزن</th><th>عدد الحسابات</th><th>الرصيد</th><th>السنة السابقة</th><th>% من الإجمالي</th></tr></thead><tbody>${arr.map(([b,o])=>`<tr><td>${esc(b)}</td><td class="num">${o.n}</td><td class="num" dir="ltr">${fm(o.cy*sg)}</td><td class="num" dir="ltr">${o.py==null?'—':fm(o.py*sg)}</td><td class="num" dir="ltr">${D.cy?(o.cy/D.cy*100).toFixed(1)+'%':'—'}</td></tr>`).join('')}${unb.length?`<tr><td class="mut">بدون فرع</td><td class="num">${unb.length}</td><td class="num" dir="ltr">${fm(un*sg)}</td><td></td><td></td></tr>`:''}</tbody></table></div></details>`}
/* ---------- area page: 101 ---------- */
function areaChain(a,cur){return '';/* sections are now inside one unified page */}
function areaTitleBar(a,ref){if(a.main&&ref!==a.main)return '';const D=areaData(a.id);const rm=areaRmm(a.id);return `<div class="areabar"><span>المجال: <b>${esc(a.ar)}</b></span><span>الرصيد بعد التسويات: <b dir="ltr">${TBSTORE.ready()?fm(D.cy*AREA_SIGN(a)):'—'}</b></span><span>خطر التحريف الجوهري: ${rmmB(rm)}${areaSig(a.id)?' <span class="b sig">خطر جوهري</span>':''}</span>${a.isNew?'<span class="b isa">ورقة جديدة</span>':''}</div>`+areaChain(a,ref)}
function rmmMatrix(a){const ro=RO();const rows=areaAssertions(a).map(as=>{const r=rmmGet(a.id,as);const k='rmm.'+a.id+'.'+as+'.';const sel=(f,v)=>`<select class="st" data-k="${k}${f}" data-dv="${f==='ir'?areaIRdef(a):areaCRdef(a)}" data-rmm="${a.id}|${as}" aria-label="${f==='ir'?'الخطر الملازم':'خطر الرقابة'} — ${esc(ASR[as][0])}"${ro?' disabled':''}>${LV.map(o=>`<option value="${o[0]}"${v===o[0]?' selected':''}>${o[1]}</option>`).join('')}</select>`;
  return `<tr data-rmmrow="${a.id}|${as}"><td><b>${esc(ASR[as][0])}</b><br><span class="mut small">${esc(ASR[as][1])}</span></td><td>${sel('ir',r.ir)}</td><td>${sel('cr',r.cr)}</td><td data-rmmc>${rmmB(r.rmm)}</td><td><label class="row"><input type="checkbox" data-k="${k}sg"${r.sg?' checked':''}${ro?' disabled':''} aria-label="خطر جوهري"> جوهري</label><label class="row"><input type="checkbox" data-k="${k}fr"${r.fr?' checked':''}${ro?' disabled':''} aria-label="خطر غش"> غش</label></td><td>${edc(k+'nt',{label:'ملاحظة '+ASR[as][0],ph:'سبب التقييم…'})}</td></tr>`}).join('');
 return `<div class="tw"><table class="v4rmm"><thead><tr><th>التأكيد</th><th>الخطر الملازم (IR)</th><th>خطر الرقابة (CR)</th><th>RMM</th><th>تصنيف</th><th>الأساس</th></tr></thead><tbody>${rows}</tbody></table></div><p class="mut small">RMM = الخطر الملازم × خطر الرقابة (الجدول: منخفض ≤ 2، متوسط 3–4، مرتفع ≥ 6). الخطر الجوهري يتطلب إجراءات جوهرية محددة وفهم الضوابط (ISA 315/330). القيم الافتراضية مأخوذة من مكتبة المجال ويمكن تعديلها.</p>`}
document.addEventListener('change',e=>{const el=e.target;if(!(el instanceof Element)||!el.dataset||!el.dataset.rmm)return;const [id,as]=el.dataset.rmm.split('|');const tr=el.closest('tr');if(!tr)return;
 const ir=tr.querySelector('[data-k$=".ir"]').value,cr=tr.querySelector('[data-k$=".cr"]').value;const c=tr.querySelector('[data-rmmc]');if(c)c.innerHTML=rmmB(rmmCombine(ir,cr));
 const bar=document.querySelector('.areabar');if(bar){setTimeout(()=>{const b=bar.children[2];if(b)b.innerHTML='خطر التحريف الجوهري: '+rmmB(areaRmm(id))+(areaSig(id)?' <span class="b sig">خطر جوهري</span>':'')},0)}});
const CRK_SPEC={cols:[{k:'d',h:'الخطر المحدد (إضافي)',t:'t'},{k:'lv',h:'المستوى',t:'s',opts:['منخفض','متوسط','مرتفع']},{k:'as',h:'التأكيدات',t:'t'},{k:'sg',h:'جوهري؟',t:'s',opts:['نعم','لا']},{k:'rs',h:'الاستجابة المخططة',t:'t'},{k:'w',h:'المرجع / التعليق',t:'r'}],n:2};
const PXG_COLS=[{k:'p',h:'إجراء المراجعة الإضافي',t:'t'},{k:'as',h:'التأكيدات',t:'t'},{k:'isa',h:'المرجع',t:'t'},{k:'st',h:'الحالة',t:'s',opts:['لم يبدأ','قيد التنفيذ','تم','استثناء']},{k:'w',h:'المرجع / التعليق',t:'r'}];
function areaProcs(a){return PROCS.filter(p=>p.src==='acc'&&a.lines.indexOf(p.acc)>-1)}
function areaRisks(a){return RISKS.filter(r=>r.src==='acc'&&a.lines.indexOf(r.acc)>-1)}
function areaCtrls(a){return CTRLS.filter(c=>c.src==='acc'&&a.lines.indexOf(c.acc)>-1)}
XP.a101=function(it,p,ref){const a=CT.areaBy[it.area];const X=AREA_X[a.id]||{};const risks=areaRisks(a),ctls=areaCtrls(a),procs=areaProcs(a);
 const xrisks=(X.rk||[]).map(r=>({id:'x:'+a.id,lv:r[0],sig:r[1].indexOf('S')>-1,fr:r[1].indexOf('F')>-1,as:split(r[2]),d:r[3],src:'مجال',sn:a.ar,href:L('wp/'+encodeURIComponent(a.main))}));
 const stat=a.items.filter(r=>CT.items[r].kind==='tod')[0];
 const sub=(t,b)=>`<h2 class="subh">${t}</h2>${b}`;
 return areaTitleBar(a,ref)+
 sub('١) أرصدة الميزان المرتبطة (تُحدَّث تلقائيًا)',areaTBPanel(a,ref))+
 sub('٢) تقييم مخاطر التحريف الجوهري حسب التأكيد',rmmMatrix(a))+
 `<h3>مخاطر من مكتبة المجال <span class="cnt">${risks.length+xrisks.length}</span></h3>`+riskTable(xrisks.concat(risks))+
 `<h3>مخاطر إضافية حددها الفريق</h3>`+cgReg(ref,'crk',CRK_SPEC)+
 sub('٣) الضوابط ذات الصلة',ctls.length||(X.ctl||[]).length?ctrlTable(ctls.concat((X.ctl||[]).map((c,i)=>({id:a.id+'-X'+(i+1),d:c,src:'acc',risk:'',ty:'',na:'',fq:'',as:[],test:'',sn:a.ar,href:L('wp/'+encodeURIComponent(a.main))}))) ):'<p class="mut">لا ضوابط معرّفة في المكتبة — وثّق فهم الضوابط في B300.</p>')+
 sub('٤) استجابة المراجعة المخططة',`<div class="fgrid"><label>منهج المراجعة المخطط<select class="sel" data-k="wp.${ref}.appr" data-dv="" aria-label="المنهج"${RO()?' disabled':''}>${['','اختبارات جوهرية فقط','اختبارات رقابة + جوهرية (اعتماد على الضوابط)','اختبارات جوهرية موسعة (خطر جوهري)'].map(o=>`<option${G('wp.'+ref+'.appr','')===o?' selected':''}>${esc(o)}</option>`).join('')}</select></label>
 <label class="full">مبررات المنهج (طبيعة وتوقيت ومدى الاختبارات)${edc('wp.'+ref+'.t.apprwhy',{label:'المبررات',ph:'اربط المنهج بنتائج RMM أعلاه وبأهمية الأداء…'})}</label></div>
 <p>${a.items.filter(r=>r!==ref).map(r=>CT.items[r]).filter(Boolean).filter(x=>x.kind!=='query'&&x.kind!=='est').map(x=>`<a class="btn o sm" href="${L('wp/'+encodeURIComponent(x.ref))}">${esc(x.disp)} — ${esc(x.kind==='an'?'تحليلية':x.kind==='tod'?'عينات وتفاصيل':x.ar.slice(0,30))}</a>`).join(' ')}</p>
 <h3>إجراءات من مكتبة المجال <span class="cnt">${procs.length}</span></h3>${procTable(procs,{lv:1})}
 <h3>إجراءات إضافية خاصة بالمجال</h3>${cgReg(ref,'pxg',{cols:PXG_COLS,n:(X.pr||[]).length||2,pre:(X.pr||[]).map(x=>({p:x[0],as:x[1],isa:x[2]}))})}`)+
 `<h3>الإفصاحات المطلوبة</h3>${ckTable('wp.'+ref+'.dis.',{it:X.dis||AREA_DIS_GEN[a.sup]||[]},'wp.'+ref+'.disc.')}`};

/* ---------- 101E: accounting estimates (ISA 540) ---------- */
XP.a101e=function(it,p,ref){const a=CT.areaBy[it.area];const X=AREA_X[a.id]||{};const est=X.est||[];
 return areaTitleBar(a,ref)+`<div class="note">${est.length?'التقديرات المحاسبية النموذجية لهذا المجال معبّأة مسبقًا؛ عدّلها أو أضف ما يخصّ العميل. إن لم توجد تقديرات جوهرية فوثّق المبرر (ISA 540.13).':'لم يُحدَّد تقدير محاسبي نموذجي لهذا المجال. إن وُجدت تقديرات جوهرية فأضفها وفق ISA 540، وإلا فوثّق عدم وجودها.'}</div>`+
 cgReg(ref,'est',{cols:[{k:'e',h:'التقدير المحاسبي',t:'t'},{k:'m',h:'طريقة الإدارة',t:'t'},{k:'a',h:'الافتراضات والبيانات الجوهرية',t:'t'},{k:'u',h:'عدم التأكد / التعقيد',t:'s',opts:['منخفض','متوسط','مرتفع']},{k:'x',h:'خبير؟',t:'s',opts:['لا','إدارة','مراجع']},{k:'r',h:'استجابة المراجع (ISA 540.18)',t:'t'},{k:'w',h:'المرجع / التعليق',t:'r'}],n:Math.max(est.length,2),pre:est.map(x=>({e:x[0],m:x[1],a:x[2]}))})+
 `<h3>تقييم المخاطر والاستجابة</h3>`+frmHTML(ref,'est_generic')+
 `<h3>التحيز المحتمل للإدارة (Management bias)</h3>${edc('wp.'+ref+'.t.bias',{label:'التحيز',ph:'قارن تقديرات الفترة السابقة بالنتائج الفعلية (انظر A330 / B260) وحدّد مؤشرات التحيز…'})}`};
XP.a101q=function(it,p,ref){const a=CT.areaBy[it.area];return areaTitleBar(a,ref)+qryHTML(ref,'area')};

/* ---------- 120: substantive analytical procedures (ISA 520) ---------- */
XP.a120=function(it,p,ref){const a=CT.areaBy[it.area];const D=areaData(a.id),sg=AREA_SIGN(a),M=matState();const pyOk=D.py!=null;const ro=RO();
 const basis=G('wp.'+ref+'.an.basis','py'),gr=num(G('wp.'+ref+'.an.gr','0')),thrIn=G('wp.'+ref+'.an.thr','');const thr=thrIn!==''?num(thrIn):(M.pm||0);
 const exp=x=>basis==='bud'?x.bud:(x.py!=null?x.py*(1+gr/100):null);
 let body='';
 if(!TBSTORE.ready())body=`<div class="note warn">ارفع الميزان وبوّبه لتظهر الأرصدة والمقارنات. <a href="${L('tb/upload')}">رفع الميزان</a></div>`;
 else{const rows=D.rows.map(x=>{const e=exp(x);const d=e==null?null:x.cy-e;return{x,e,d,over:thr>0&&d!=null&&Math.abs(d)>thr}}).sort((p,q)=>Math.abs(q.d==null?q.x.cy:q.d)-Math.abs(p.d==null?p.x.cy:p.d));
  const nOver=rows.filter(r=>r.over).length;const tot=rows.reduce((s,r)=>s+(r.d||0),0);const lim=40;
  const tr=r=>`<tr${r.over?' class="ovrrow"':''}><td class="ref">${esc(r.x.r.code)}</td><td class="tx">${esc(r.x.r.name)}</td><td class="num" dir="ltr">${r.x.ob==null?'—':fm(r.x.ob*sg)}</td><td class="num" dir="ltr">${fm(r.x.cy*sg)}</td><td class="num" dir="ltr">${r.x.py==null?'—':fm(r.x.py*sg)}</td><td class="num" dir="ltr">${r.x.bud==null?'—':fm(r.x.bud*sg)}</td><td class="num" dir="ltr">${r.e==null?'—':fm(r.e*sg)}</td><td class="num${r.over?' ovr':''}" dir="ltr">${r.d==null?'—':fm(r.d*sg)}</td><td>${r.over?edc('wp.'+ref+'.an.x.'+tbk(r.x.r.code),{label:'تفسير الفرق '+r.x.r.code,ph:'تفسير الفرق + دليل مؤيد…'}):'<span class="mut small">ضمن الحد</span>'}</td></tr>`;
  body=`<p>الحد المقبول للفرق (Threshold): <b dir="ltr">${fmtN(thr)}</b> — الفروق التي تتجاوزه يلزم تفسيرها بالاستفسار ثم تأييدها بدليل (ISA 520.7). عدد البنود المتجاوزة: <b>${nOver}</b> من ${rows.length}.</p>
  <div class="tw"><table><thead><tr><th>الكود</th><th>الحساب</th><th>أول المدة</th><th>آخر المدة (السنة الحالية)</th><th>السنة السابقة</th><th>الموازنة</th><th>التوقع</th><th>الفرق عن التوقع</th><th>التفسير والدليل</th></tr></thead><tbody>${rows.slice(0,lim).map(tr).join('')}</tbody><tfoot><tr class="tot"><td></td><td>الإجمالي</td><td class="num" dir="ltr">${D.ob==null?'—':fm(D.ob*sg)}</td><td class="num" dir="ltr">${fm(D.cy*sg)}</td><td class="num" dir="ltr">${pyOk?fm(D.py*sg):'—'}</td><td class="num" dir="ltr">${D.bud==null?'—':fm(D.bud*sg)}</td><td></td><td class="num" dir="ltr">${fm(tot*sg)}</td><td></td></tr></tfoot></table></div>
  ${typeof XC!=='undefined'?XC.analyticChart(a,rows,sg):''}
  ${rows.length>lim?`<details class="nt"><summary>باقي الحسابات (${rows.length-lim})</summary><div class="tw"><table><tbody>${rows.slice(lim,300).map(tr).join('')}</tbody></table></div></details>`:''}`}
 const rat=typeof anRatiosFor==='function'?anRatiosFor(a):'';
 return areaTitleBar(a,ref)+`<div class="note">إجراء تحليلي جوهري (ISA 520): ضع توقعًا مستقلًا للرصيد، حدّد الفرق المقبول، قارن، فسّر الفروق الجوهرية بأدلة. الحد الافتراضي = أهمية الأداء من A500 ويتحدث تلقائيًا عند تغيرها.</div>
 <div class="fgrid"><label>أساس التوقع<select class="sel" data-k="wp.${ref}.an.basis" data-dv="py" data-an="1"${ro?' disabled':''}><option value="py"${basis==='py'?' selected':''}>السنة السابقة × (1 + نسبة النمو المتوقعة)</option><option value="bud"${basis==='bud'?' selected':''}>الموازنة التقديرية</option></select></label>
 <label>نسبة النمو المتوقعة %<input class="in" dir="ltr" type="number" step="0.5" data-k="wp.${ref}.an.gr" data-dv="0" value="${esc(G('wp.'+ref+'.an.gr','0'))}"${ro?' readonly':''}></label>
 <label>الحد المقبول للفرق (فارغ = PM)<input class="in" dir="ltr" inputmode="decimal" data-k="wp.${ref}.an.thr" value="${esc(thrIn)}" placeholder="${M.pm?fmtN(M.pm):''}"${ro?' readonly':''}></label></div>
 <p class="mut small noprint">بعد تغيير أي حقل أعلاه أعد فتح الورقة لتحديث الحسابات.</p>
 <h3>أ) المقارنة وتحليل الفروق</h3>${body}
 ${rat?`<h3>ب) النسب والمؤشرات المرتبطة (من مركز التحليلات)</h3>${rat}`:''}
 <h3>${rat?'ج':'ب'}) مصدر التوقع ودقته وموثوقية البيانات (ISA 520.5)</h3>${edc('wp.'+ref+'.t.anbasis',{label:'مصدر التوقع',ph:'مصدر البيانات المستخدمة، ما يؤيد دقة التوقع، وأي بيانات غير مالية…'})}`};
document.addEventListener('change',e=>{const el=e.target;if(el instanceof Element&&el.dataset&&el.dataset.an){setTimeout(()=>{if(CUR.view==='wp')UI.refreshView()},50)}});

/* ---------- 125: tests of details & sampling (see 48_samp.js) ---------- */
XP.a125=function(it,p,ref){const a=CT.areaBy[it.area];const X=AREA_X[a.id]||{};
 return areaTitleBar(a,ref)+`<div class="note">اختبارات التفاصيل (ISA 500/530): يُحتسب حجم العينة تلقائيًا من أهمية الأداء ومستوى RMM في ورقة ${wpL(a.main)}، وأي تغيير في الأهمية النسبية ينبّه إلى إعادة الاحتساب.</div>`+
 sampHTML(ref,{area:a,pop:TBSTORE.ready()?Math.abs(areaData(a.id).cy):0,label:a.ar})+
 `<h3>الإجراءات الجوهرية المنفذة ونتائجها</h3>${cgReg(ref,'tod',{cols:[{k:'p',h:'الإجراء',t:'t'},{k:'as',h:'التأكيدات',t:'t'},{k:'n',h:'حجم العينة / النطاق',t:'t'},{k:'r',h:'النتيجة',t:'s',opts:['','بدون استثناءات','استثناءات (انظر الأسفل)','لم يُنفذ']},{k:'e',h:'مبلغ الاستثناء',t:'n',sum:1},{k:'w',h:'المرجع / التعليق',t:'r'}],n:(X.pr||[]).length||3,pre:(X.pr||[]).map(x=>({p:x[0],as:x[1]}))})}`+
 `<h3>التحريفات المكتشفة</h3><p class="mut small">سجّل ما تجاوز حد الضآلة الواضحة؛ يُحال إلى سجل التحريفات (D100/D200) مع التأثير على القوائم.</p>${gridT(ref,'a')}`};
