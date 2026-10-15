/* Audit-Plus · V4 · Financial statements (52_fs) */
'use strict';
/* ===== 52_fs.js ===== */
/* =====================================================================
   v4 · Financial statements generated from the classified trial balance (after adjustments)
   SFP / P&L / OCI / SOCE / indirect cash flow / notes  +  Analytics Hub (ratios, horizontal, vertical, DuPont, flux)
   Every statement line links to the working paper of the area that owns it; every analytic links to the related risks.
   ===================================================================== */
const FS_ASSET=g=>/موجودات/.test(g);
const FS_COL=[['cap','رأس المال'],['prem','علاوة وأسهم خزينة'],['res','احتياطيات'],['oci','احتياطي الدخل الشامل'],['re','أرباح مرحلة'],['nci','حقوق غير مسيطرة']];
const FS_COLOF={cap:'cap',shp:'prem',trs:'prem',res:'res',ocires:'oci',re:'re',nci:'nci'};
/* build once per data version: nodes[st][g][u] = {cy,cyu,py,bud,rows:[{r,cy,py}],line} — values are in PRESENTATION sign */
function fsBuild(){return vcache('fsb:'+TBSTORE.ver+':'+CLSV+':'+TBMV,()=>{
 const S={SFP:new Map(),PL:new Map(),OCI:new Map(),EQ:new Map()},un=[];const hasPy=!!TBSTORE.pyMap;
 if(!TBSTORE.ready())return{S,un,hasPy:false,ready:false};
 const adj=tbAdjMap(CUR.eng);const pm=TBSTORE.pyMap;
 for(const r of TBSTORE.rows){const c=clsOf(r.code);if(!c||!S[c.st]){un.push(r);continue}
  const sg=c.st==='PL'?-1:CLS_SIGN(c.st,c.g);const dr=r.cb+(adj.get(r.code)||0),dru=r.cb,dpy=pm?(pm.get(r.code)||0):null;
  let G_=S[c.st].get(c.g);if(!G_){G_=new Map();S[c.st].set(c.g,G_)}
  const key=(c.u||c.g);let n=G_.get(key);if(!n){n={u:key,g:c.g,line:c.line||'',cy:0,cyu:0,py:hasPy?0:null,bud:null,rows:[]};G_.set(key,n)}
  const cy=dr*sg,cyu=dru*sg,py=dpy==null?null:dpy*sg;n.cy+=cy;n.cyu+=cyu;if(py!=null)n.py+=py;if(r.bud!=null)n.bud=(n.bud||0)+r.bud*sg;n.rows.push({r,cy,cyu,py,dr})}
 return{S,un,hasPy,ready:true}})}
const fsG=(st,g)=>{const B=fsBuild();const m=B.S[st]&&B.S[st].get(g);let cy=0,cyu=0,py=B.hasPy?0:null,bud=null;if(m)for(const n of m.values()){cy+=n.cy;cyu+=n.cyu;if(py!=null)py+=n.py||0;if(n.bud!=null)bud=(bud||0)+n.bud}return{cy,cyu,py,bud}};
const fsSt=st=>{const B=fsBuild();let cy=0,cyu=0,py=B.hasPy?0:null;for(const g of B.S[st].keys()){const x=fsG(st,g);cy+=x.cy;cyu+=x.cyu;if(py!=null)py+=x.py||0}return{cy,cyu,py}};
/* net profit (credit-positive): Σ PL groups */
function fsLines(st,ids){const B=fsBuild();let cy=0,py=B.hasPy?0:null;if(!B.ready)return{cy:0,py:null};for(const m of B.S[st].values())for(const n of m.values())if(ids.includes(n.line)){cy+=n.cy;if(py!=null)py+=n.py||0}return{cy,py}}
/* the owning working paper of an FS line (first live area that lists the line) */
function fsWpOf(line){if(!line)return null;const la=areaMap().lineAreas||{};const as=(la[line]||[]).filter(a=>!ctOff(a.main));return as.length?as[0]:null}
const fsAnRef=a=>{const r=a.items.find(x=>CT.items[x].kind==='an');return r||a.main};
function fsWpLink(line){const a=fsWpOf(line);return a?`<a class="wpl" href="${L('wp/'+encodeURIComponent(a.main))}" title="${esc(a.ar)}">${esc(CT.items[a.main].disp)}</a>`:'<span class="mut">—</span>'}
let FSNT={map:new Map(),n:0};
function fsNoteNo(st,u){const k=st+'|'+u;if(!FSNT.map.has(k))FSNT.map.set(k,FSNT.map.size+1);return FSNT.map.get(k)}
const fsPct=(a,b)=>b?((a-b)/Math.abs(b)*100):null;
const fsM=()=>{const M=matState();return M.pm||M.om||0};
function fsRow(label,x,o){o=o||{};const thr=fsM();const hasPy=x.py!=null;const d=hasPy?x.cy-x.py:null;const p=hasPy?fsPct(x.cy,x.py):null;const over=thr>0&&d!=null&&Math.abs(d)>thr;
 return `<tr class="${o.cls||''}${over?' ovrrow':''}"><td class="${o.sub?'sub1':''}">${o.lbl||esc(label)}</td><td>${o.ref||''}</td><td class="num">${o.note||''}</td><td class="num" dir="ltr">${fm(x.cy)}</td><td class="num" dir="ltr">${hasPy?fm(x.py):'—'}</td><td class="num${over?' ovr':''}" dir="ltr">${d==null?'—':fm(d)}</td><td class="num" dir="ltr">${p==null||!isFinite(p)?'—':p.toFixed(1)+'%'}</td></tr>`}
const fsHead=()=>`<thead><tr><th>البند</th><th>ورقة العمل</th><th>إيضاح</th><th>السنة الحالية</th><th>السنة السابقة</th><th>الفرق</th><th>%</th></tr></thead>`;
function fsGroupRows(st,g,o){o=o||{};const B=fsBuild();const m=B.S[st].get(g);if(!m)return'';let h='';const gs=fsG(st,g);
 h+=`<tr class="grp"><td colspan="7">${esc(g)}</td></tr>`;
 const subs=[...m.values()].sort((a,b)=>Math.abs(b.cy)-Math.abs(a.cy));
 for(const n of subs)h+=fsRow(n.u,{cy:n.cy*(o.neg?-1:1),py:n.py==null?null:n.py*(o.neg?-1:1)},{sub:1,ref:fsWpLink(n.line),note:`<a href="#fsn-${fsNoteNo(st,n.u)}">${fsNoteNo(st,n.u)}</a>`});
 h+=fsRow('إجمالي '+g,{cy:gs.cy*(o.neg?-1:1),py:gs.py==null?null:gs.py*(o.neg?-1:1)},{cls:'tot'});return h}
function fsOrder(st){const B=fsBuild();const ord=CLS_GROUP_ORDER[st]||[];const ex=[...B.S[st].keys()].filter(g=>!ord.includes(g));return ord.filter(g=>B.S[st].has(g)).concat(ex)}
const fsNoData=()=>TBSTORE.ready()?'':`<div class="note warn">لم يُحمَّل ميزان المراجعة. <a href="${L('tb/upload')}">ارفع الميزان</a> ثم بوّب الحسابات لتُولَّد القوائم تلقائيًا.</div>`;
function fsUnNote(){const B=fsBuild();if(!B.ready||!B.un.length)return'';const s=B.un.reduce((t,r)=>t+r.cb,0);return `<div class="note warn">⚠ ${B.un.length} حسابًا غير مبوَّب (رصيدها المجمّع <b dir="ltr">${fm(s)}</b>) خارج القوائم — <a href="${L('tb/classify')}">أكمل التبويب</a>.</div>`}

/* ---- statements ---- */
function fsSFP(){const B=fsBuild();if(!B.ready)return fsNoData();let h='';const prof=fsSt('PL');
 const gA=['موجودات غير متداولة','موجودات متداولة'],gE=['حقوق ملكية'],gL=['مطلوبات غير متداولة','مطلوبات متداولة'];
 for(const g of gA)h+=fsGroupRows('SFP',g);
 const ta={cy:0,py:B.hasPy?0:null};for(const g of fsOrder('SFP').filter(FS_ASSET)){const x=fsG('SFP',g);ta.cy+=x.cy;if(ta.py!=null)ta.py+=x.py||0}
 h+=fsRow('إجمالي الموجودات',ta,{cls:'tot big'});
 h+=fsGroupRows('SFP','حقوق ملكية');
 const oci=fsSt('OCI'),eq=fsSt('EQ');
 h+=fsRow('أرباح (خسائر) العام من قائمة الدخل',{cy:prof.cy,py:B.hasPy?prof.py:null},{sub:1,ref:'<a class="wpl" href="'+L('wp/D402')+'">D402</a>'});
 if(oci.cy||oci.py)h+=fsRow('الدخل الشامل الآخر للعام',{cy:oci.cy,py:oci.py},{sub:1});
 if(eq.cy||eq.py)h+=fsRow('حركات حقوق الملكية المبوّبة للعام',{cy:eq.cy,py:eq.py},{sub:1});
 const e0=fsG('SFP','حقوق ملكية');const te={cy:e0.cy+prof.cy+oci.cy+eq.cy,py:B.hasPy?(e0.py||0)+(prof.py||0)+(oci.py||0)+(eq.py||0):null};
 h+=fsRow('إجمالي حقوق الملكية',te,{cls:'tot'});
 for(const g of gL)h+=fsGroupRows('SFP',g);
 const tl={cy:0,py:B.hasPy?0:null};for(const g of gL){const x=fsG('SFP',g);tl.cy+=x.cy;if(tl.py!=null)tl.py+=x.py||0}
 h+=fsRow('إجمالي المطلوبات',tl,{cls:'tot'});
 const tel={cy:te.cy+tl.cy,py:te.py==null?null:te.py+tl.py};h+=fsRow('إجمالي حقوق الملكية والمطلوبات',tel,{cls:'tot big'});
 const df=ta.cy-tel.cy,dfp=ta.py==null?null:ta.py-tel.py;
 h+=`<tr class="${Math.abs(df)<1?'okrow':'bad'}"><td colspan="3">فرق الاتزان (الموجودات − حقوق الملكية والمطلوبات)</td><td class="num" dir="ltr">${fm(df)}</td><td class="num" dir="ltr">${dfp==null?'—':fm(dfp)}</td><td colspan="2">${Math.abs(df)<1?'✔ متزنة':'✖ غير متزنة — راجع التبويب والتسويات'}</td></tr>`;
 return `<div class="tw"><table class="fst">${fsHead()}<tbody>${h}</tbody></table></div>`}
function fsPL(){const B=fsBuild();if(!B.ready)return fsNoData();let h='';let run={cy:0,py:B.hasPy?0:null};const add=x=>{run.cy+=x.cy;if(run.py!=null)run.py+=x.py||0};
 const gs=fsOrder('PL');const sub={ 'تكلفة المبيعات':'مجمل الربح (الخسارة)','المصروفات التشغيلية':'ربح (خسارة) التشغيل','إيرادات ومصروفات أخرى':'الربح قبل الضريبة'};
 for(const g of gs){h+=fsGroupRows('PL',g);add(fsG('PL',g));if(sub[g])h+=fsRow(sub[g],{cy:run.cy,py:run.py},{cls:'tot'})}
 h+=fsRow('صافي ربح (خسارة) العام',{cy:run.cy,py:run.py},{cls:'tot big'});
 return `<div class="tw"><table class="fst">${fsHead()}<tbody>${h}</tbody></table></div><p class="mut small">الإيرادات والأرباح موجبة، والمصروفات والخسائر سالبة (بين أقواس) — المعروض بعد قيود التسوية المرحَّلة.</p>`}
function fsOCI(){const B=fsBuild();if(!B.ready)return fsNoData();const pr=fsSt('PL');let h=fsRow('صافي ربح (خسارة) العام',{cy:pr.cy,py:pr.py},{cls:'tot'});
 for(const g of fsOrder('OCI'))h+=fsGroupRows('OCI',g);const o=fsSt('OCI');h+=fsRow('إجمالي الدخل الشامل الآخر',o,{cls:'tot'});
 h+=fsRow('إجمالي الدخل الشامل للعام',{cy:pr.cy+o.cy,py:pr.py==null?null:pr.py+(o.py||0)},{cls:'tot big'});
 return `<div class="tw"><table class="fst">${fsHead()}<tbody>${h}</tbody></table></div>${B.S.OCI.size?'':'<p class="mut small">لا توجد حسابات مبوَّبة كدخل شامل آخر — إن كانت للمنشأة بنود (إعادة تقييم، فروق ترجمة، تحوط) فبوّبها في «OCI».</p>'}`}
function fsSOCE(){const B=fsBuild();if(!B.ready)return fsNoData();
 const comp=(which)=>{const o={cap:0,prem:0,res:0,oci:0,re:0,nci:0};const hasP=which==='py';if(hasP&&!B.hasPy)return null;
  const m=B.S.SFP.get('حقوق ملكية');if(m)for(const n of m.values()){const c=FS_COLOF[n.line];if(c)o[c]+=hasP?(n.py||0):n.cy;else o.re+=hasP?(n.py||0):n.cy}
  const pr=fsSt('PL'),oc=fsSt('OCI'),eq=fsSt('EQ');o.re+=hasP?(pr.py||0):pr.cy;o.oci+=hasP?(oc.py||0):oc.cy;
  if(!hasP){for(const mm of B.S.EQ.values())for(const n of mm.values()){const c=FS_COLOF[n.line]||'re';o[c]+=n.cy}}return o};
 const sum=o=>FS_COL.reduce((s,c)=>s+o[c[0]],0);const cl=comp('cy'),op=comp('py');const pr=fsSt('PL'),oc=fsSt('OCI');
 const mv={cap:0,prem:0,res:0,oci:0,re:0,nci:0};for(const mm of B.S.EQ.values())for(const n of mm.values()){mv[FS_COLOF[n.line]||'re']+=n.cy}
 const rowOf=(lbl,o,cls)=>`<tr class="${cls||''}"><td>${esc(lbl)}</td>${FS_COL.map(c=>`<td class="num" dir="ltr">${o?fm(o[c[0]]):'—'}</td>`).join('')}<td class="num" dir="ltr">${o?fm(sum(o)):'—'}</td></tr>`;
 const z={cap:0,prem:0,res:0,oci:0,re:0,nci:0};const prr={...z,re:pr.cy},ocr={...z,oci:oc.cy};
 let h=rowOf('الرصيد في بداية العام (السنة السابقة بعد الإقفال)',op,'tot');
 if(op){const plug={};for(const c of FS_COL)plug[c[0]]=cl[c[0]]-op[c[0]]-prr[c[0]]-ocr[c[0]]-mv[c[0]];
  h+=rowOf('صافي ربح (خسارة) العام',prr)+rowOf('الدخل الشامل الآخر',ocr)+rowOf('حركات مبوَّبة (توزيعات، زيادة رأس مال، تحويلات)',mv)+rowOf('حركات أخرى غير مفسَّرة (تُراجَع)',plug,'bad')}
 else h+=rowOf('صافي ربح (خسارة) العام',prr)+rowOf('الدخل الشامل الآخر',ocr)+rowOf('حركات مبوَّبة (توزيعات، زيادة رأس مال، تحويلات)',mv);
 h+=rowOf('الرصيد في نهاية العام',cl,'tot big');
 return `<div class="tw"><table class="fst"><thead><tr><th>البيان</th>${FS_COL.map(c=>`<th>${c[1]}</th>`).join('')}<th>الإجمالي</th></tr></thead><tbody>${h}</tbody></table></div>
 ${op?'':'<div class="note warn">لا تتوفر أرصدة السنة السابقة — حمّل ميزان السنة السابقة (أو عمودها) ليُحتسب الرصيد الافتتاحي والحركات غير المفسَّرة.</div>'}
 <p class="mut small">الرصيد الافتتاحي = أرصدة حقوق الملكية في ميزان السنة السابقة (مع أرباحها إن لم تكن مقفلة). أي حركة غير مفسَّرة تعني توزيعات أو تسويات سنوات سابقة أو أخطاء تبويب تحتاج دليلًا.</p>`}
/* indirect cash flow from balance sheet movements */
function fsCFData(){const B=fsBuild();if(!B.ready||!B.hasPy)return null;
 const dA=ids=>{const x=fsLines('SFP',ids);return x.cy-x.py};/* asset movement in Dr terms */
 const dL=ids=>{const x=fsLines('SFP',ids);return x.cy-x.py};/* liability/equity movement in Cr terms (presentation sign) */
 const pl=l=>fsLines('PL',[l]).cy;const plp=l=>fsLines('PL',[l]).py;
 const pr=fsSt('PL'),tax=pl('taxx');const pbt=pr.cy-tax;
 const dep=-pl('depx'),eclx=-pl('eclx'),fc=-pl('fincost'),fi=pl('fininc'),as=pl('assoc');
 const adjs=[['إهلاك وإطفاء',dep],['خسائر ائتمانية متوقعة',eclx],['تكاليف التمويل',fc],['إيرادات التمويل والاستثمار',-fi],['حصة في نتائج شركات شقيقة',-as]];
 const ws=[['المخزون',-dA(['inv'])],['العملاء وأوراق القبض وأصول العقود',-dA(['tr','nr','ca'])],['أرصدة مدينة ومدفوعات مقدمة وأطراف ذات علاقة (مدينة)',-dA(['rpr','orc','pre'])],['الموردون وأوراق الدفع والمستحقات',dL(['tp','np','accr'])],['أرصدة دائنة أخرى ومستحقات العاملين والتزامات العقود',dL(['opay','emp','cl','rpp'])],['المخصصات ومزايا العاملين',dL(['prov','ebo','oliab'])]];
 const taxPaid=tax+dL(['taxp'])-dA(['taxa'])+dL(['dtl']);
 const op=pbt+adjs.reduce((s,x)=>s+x[1],0)+ws.reduce((s,x)=>s+x[1],0)+taxPaid;
 const capex=-(dA(['ppe','cip','rou','int','gw','ip','bio'])+dep),inv=-dA(['isub','finv','der','ncao']);const invI=capex+inv+fi;
 const fin_=[['القروض والتسهيلات والسندات',dL(['bor','bond'])],['التزامات عقود الإيجار',dL(['ll'])],['رأس المال والعلاوة وأسهم الخزينة',dL(['cap','shp','trs','nci'])],['توزيعات الأرباح (حركات مبوّبة)',fsLines('EQ',['re']).cy],['تكاليف التمويل المدفوعة',-fc]];
 const finT=fin_.reduce((s,x)=>s+x[1],0);const dcash=dA(['cash']);const net=op+invI+finT;
 return{pbt,tax,adjs,ws,taxPaid,op,capex,inv,fi,invI,fin_,finT,net,dcash,diff:dcash-net,cashPy:fsLines('SFP',['cash']).py,cashCy:fsLines('SFP',['cash']).cy}}
function fsCF(){const B=fsBuild();if(!B.ready)return fsNoData();const d=fsCFData();
 if(!d)return `<div class="note warn">قائمة التدفقات النقدية تُشتق من حركة أرصدة الميزان بين السنتين؛ حمّل ميزان السنة السابقة (أو عمودها) أولًا من «رفع الميزان».</div>`;
 const r=(l,v,c)=>`<tr class="${c||''}"><td class="${c?'':'sub1'}">${esc(l)}</td><td class="num" dir="ltr">${fm(v)}</td></tr>`;
 let h=`<tr class="grp"><td colspan="2">التدفقات النقدية من أنشطة التشغيل</td></tr>`+r('الربح قبل الضريبة',d.pbt)+d.adjs.map(x=>r('تسوية: '+x[0],x[1])).join('')+d.ws.map(x=>r('التغير في '+x[0],x[1])).join('')+r('ضرائب الدخل المدفوعة (تقديرية)',d.taxPaid)+r('صافي التدفق النقدي من أنشطة التشغيل',d.op,'tot')
 +`<tr class="grp"><td colspan="2">التدفقات النقدية من أنشطة الاستثمار</td></tr>`+r('اقتناء/(استبعاد) أصول ثابتة وغير ملموسة وعقارية وحق استخدام (صافي)',d.capex)+r('استثمارات مالية وشركات ومشتقات وأرصدة طويلة الأجل (صافي)',d.inv)+r('إيرادات تمويلية وتوزيعات مقبوضة',d.fi)+r('صافي التدفق النقدي من أنشطة الاستثمار',d.invI,'tot')
 +`<tr class="grp"><td colspan="2">التدفقات النقدية من أنشطة التمويل</td></tr>`+d.fin_.map(x=>r(x[0],x[1])).join('')+r('صافي التدفق النقدي من أنشطة التمويل',d.finT,'tot')
 +r('صافي التغير في النقدية وما في حكمها (محسوب)',d.net,'tot big')+r('رصيد النقدية أول العام',d.cashPy)+r('رصيد النقدية آخر العام (من الميزان)',d.cashCy)
 +`<tr class="${Math.abs(d.diff)<=Math.max(1,fsM()*0.05)?'okrow':'bad'}"><td>فروق غير مفسَّرة (التغير الفعلي في النقدية − المحسوب)</td><td class="num" dir="ltr">${fm(d.diff)}</td></tr>`;
 return `<div class="tw"><table class="fst cf"><thead><tr><th>البيان</th><th>السنة الحالية</th></tr></thead><tbody>${h}</tbody></table></div>
 <p class="mut small">مشتقة من حركة الأرصدة المبوَّبة (الطريقة غير المباشرة — EAS 4 / IAS 7). الفرق غير المفسَّر يدل عادة على حركات غير نقدية (استبعادات، إعادة تقييم، تحويل بين البنود، فروق عملة) أو أخطاء تبويب؛ قدِّم تفسيره وأرفق الدليل.</p>
 ${edc('wp.D406.diffx',{label:'تفسير الفروق غير المفسَّرة',ph:'اكتب تفسير الفروق والدليل…',ml:1})}`}
function fsNotes(){const B=fsBuild();if(!B.ready)return fsNoData();let h='';FSNT={map:new Map(),n:0};
 for(const st of ['SFP','PL','OCI'])for(const g of fsOrder(st))for(const n of [...B.S[st].get(g).values()].sort((a,b)=>Math.abs(b.cy)-Math.abs(a.cy))){const no=fsNoteNo(st,n.u);
  const rows=n.rows.slice().sort((a,b)=>Math.abs(b.cy)-Math.abs(a.cy));
  h+=`<details class="nt" id="fsn-${no}"><summary><b>إيضاح ${no}</b> — ${esc(n.u)} <span class="mut">(${esc(g)})</span> <span class="num" dir="ltr">${fm(n.cy)}</span> ${n.py==null?'':`<span class="mut" dir="ltr">/ ${fm(n.py)}</span>`} ${fsWpLink(n.line)}</summary>
  <div class="tw"><table><thead><tr><th>الكود</th><th>الحساب</th><th>السنة الحالية</th><th>السنة السابقة</th></tr></thead><tbody>${rows.slice(0,60).map(x=>`<tr><td class="ref">${esc(x.r.code)}</td><td class="tx">${esc(x.r.name)}</td><td class="num" dir="ltr">${fm(x.cy)}</td><td class="num" dir="ltr">${x.py==null?'—':fm(x.py)}</td></tr>`).join('')}</tbody></table></div>${rows.length>60?`<p class="mut small">… و${rows.length-60} حسابًا آخر.</p>`:''}
  ${edc('wp.D407.n.'+fnv(st+'|'+n.u),{label:'نص الإيضاح والإفصاحات المطلوبة',ph:'السياسة المحاسبية والإفصاحات (EAS/IFRS) لهذا البند…',ml:1})}</details>`}
 return `<p class="mut small">تُرقَّم الإيضاحات تلقائيًا وتتصل برقم الإيضاح في كل قائمة وبورقة عمل المجال؛ أضف النص والإفصاحات المتطلبة لكل بند.</p>${h||'<div class="note">لا توجد بنود مبوَّبة.</div>'}`}

/* ---- statement pages ---- */
const FS_PAGES=[['sfp','قائمة المركز المالي',fsSFP],['pl','قائمة الدخل',fsPL],['oci','قائمة الدخل الشامل',fsOCI],['soce','قائمة التغير في حقوق الملكية',fsSOCE],['cf','قائمة التدفقات النقدية',fsCF]];
function fsPageHead(it,ref,sub){const M=matState();return `<div class="areabar"><span>${esc(CUR.company?CUR.company.name:'')}</span><span>تاريخ القوائم: <b>${esc(G('eng.period',G('eng.year','')))}</b></span><span>الأهمية للتمييز: <b dir="ltr">${M.pm?fmtN(M.pm):'—'}</b> (الفروق الأعلى تُظلَّل)</span>${sub||''}</div>${fsUnNote()}`}
function fsSingle(fn){return(it,p,ref)=>{FSNT={map:new Map(),n:0};return fsPageHead(it,ref)+fn()}}
XP.fs_sfp=fsSingle(fsSFP);XP.fs_pl=fsSingle(fsPL);XP.fs_oci=fsSingle(fsOCI);XP.fs_soce=fsSingle(fsSOCE);XP.fs_cf=fsSingle(fsCF);
XP.fs_notes=(it,p,ref)=>fsPageHead(it,ref)+fsNotes();
function fsAll(withNotes){FSNT={map:new Map(),n:0};const B=fsBuild();if(!B.ready)return fsNoData();
 const pre=FS_PAGES.map(x=>x[1]);let h='';FS_PAGES.forEach((x,i)=>{h+=`<section class="fssec"><h3>${i+1}) ${esc(x[1])}</h3>${x[2]()}</section>`});
 if(withNotes)h+=`<section class="fssec"><h3>الإيضاحات المتممة</h3>${fsNotes()}</section>`;return h}
XP.fs_simple=(it,p,ref)=>fsPageHead(it,ref)+`<div class="note">قوائم مبسطة تُولَّد آليًا من الميزان المبوَّب بعد قيود التسوية — للفحص السريع واتساق الأرقام قبل إعداد المسودة. أي تغيير في التبويب أو التسويات ينعكس هنا فورًا.</div>`+fsAll(false);
XP.fs_draft=(it,p,ref)=>fsPageHead(it,ref)+`<div class="note">مسودة القوائم المالية للعرض على العميل: القوائم الأساسية + الإيضاحات. راجع كل بند مع ورقة المجال المرتبطة قبل إصدار النسخة النهائية.</div>`+fsAll(true)+
 `<div class="fgrid"><label>ملاحظات الشريك على المسودة${edc('wp.'+ref+'.draftnote',{label:'ملاحظات المسودة',ph:'…',ml:1})}</label></div>`;
XP.fs_final=(it,p,ref)=>{const B=fsBuild();const M=matState();const chk=[];
 if(B.ready){const ta=fsSFPbal();chk.push([ta.ok,'اتزان قائمة المركز المالي',ta.txt]);chk.push([!B.un.length,'جميع حسابات الميزان مبوّبة',B.un.length?B.un.length+' حسابًا غير مبوّب':'']);const cf=fsCFData();chk.push([!!cf&&Math.abs(cf.diff)<=Math.max(1,M.pm*0.05),'تفسير فروق التدفقات النقدية',cf?'الفرق '+fm(cf.diff):'يلزم ميزان السنة السابقة']);}
 chk.push([M.set,'احتُسبت الأهمية النسبية (A500)',M.set?'':'لم تُحتسب']);
 const rows=chk.map(c=>`<tr class="${c[0]?'okrow':'bad'}"><td>${c[0]?'✔':'✖'}</td><td>${esc(c[1])}</td><td>${esc(c[2]||'')}</td></tr>`).join('');
 return fsPageHead(it,ref)+`<div class="note">النسخة النهائية: لا تُعتمد إلا بعد اجتياز الفحوص أدناه، وتطابق أرقامها مع القوائم الموقَّعة من العميل ومع المسودة المعتمدة.</div><div class="tw"><table><thead><tr><th></th><th>فحص قبل الإصدار</th><th>ملاحظة</th></tr></thead><tbody>${rows}</tbody></table></div>`+fsAll(true)}
function fsSFPbal(){const B=fsBuild();if(!B.ready)return{ok:false,txt:'لا ميزان'};let ta=0,tel=0;for(const g of fsOrder('SFP')){const x=fsG('SFP',g);if(FS_ASSET(g))ta+=x.cy;else tel+=x.cy}const pr=fsSt('PL').cy,oc=fsSt('OCI').cy,eq=fsSt('EQ').cy;tel+=pr+oc+eq;return{ok:Math.abs(ta-tel)<1,txt:'الفرق '+fm(ta-tel)}}
