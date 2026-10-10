/* MEAP · V4 · Analytics Hub (part of 52_fs) */
'use strict';
/* =====================================================================
   Analytics Hub — ratios with expectations, horizontal/vertical analysis, DuPont, flux — linked to risks and WPs
   ===================================================================== */
function anVals(){const B=fsBuild();if(!B.ready)return null;const g=(st,ids,py)=>{const x=fsLines(st,ids);return py?x.py:x.cy};
 const mk=py=>{if(py&&!B.hasPy)return null;const f=(st,ids)=>g(st,ids,py);
  const rev=f('PL',['rev']),cos=-f('PL',['cos'])-f('PL',['depx'])*0,pbt=fsSt('PL')[py?'py':'cy']-f('PL',['taxx']),np=fsSt('PL')[py?'py':'cy'];
  const cosT=-(fsG('PL','تكلفة المبيعات')[py?'py':'cy']);const opx=-(fsG('PL','المصروفات التشغيلية')[py?'py':'cy']);
  const ca=fsG('SFP','موجودات متداولة')[py?'py':'cy'],cl=fsG('SFP','مطلوبات متداولة')[py?'py':'cy'];const ta=['موجودات غير متداولة','موجودات متداولة'].reduce((s,x)=>s+fsG('SFP',x)[py?'py':'cy'],0);
  const prof=fsSt('PL')[py?'py':'cy'];const eqb=fsG('SFP','حقوق ملكية')[py?'py':'cy']+prof;const liab=ta-eqb;
  const inv=f('SFP',['inv']),rec=f('SFP',['tr','nr','ca']),pay=f('SFP',['tp','np']),cash=f('SFP',['cash','finv']);
  const debt=f('SFP',['bor','bond','ll']),fcst=-f('PL',['fincost']);
  return{rev,cosT,opx,gp:rev-cosT,op:rev-cosT-opx,pbt,np,ca,cl,ta,eqb,liab,inv,rec,pay,cash,debt,fcst}};return{cy:mk(false),py:mk(true)}}
const AN_RATIOS=[
 ['cur','نسبة التداول','سيولة',v=>v.cl?v.ca/v.cl:null,'x',['PAY','OCL','CBR','CASH','INVT','REC'],'ISA 570 — الاستمرارية'],
 ['quick','نسبة السيولة السريعة','سيولة',v=>v.cl?(v.ca-v.inv)/v.cl:null,'x',['CASH','REC','PAY'],'ISA 570'],
 ['gm','هامش مجمل الربح %','ربحية',v=>v.rev?v.gp/v.rev*100:null,'%',['REV','COS','INVT'],'ISA 240 — إيرادات / ISA 315'],
 ['om','هامش ربح التشغيل %','ربحية',v=>v.rev?v.op/v.rev*100:null,'%',['REV','OOE','EMP'],'ISA 315'],
 ['nm','هامش صافي الربح %','ربحية',v=>v.rev?v.np/v.rev*100:null,'%',['REV','ITX','FIN'],'ISA 315'],
 ['roa','العائد على الأصول %','ربحية',v=>v.ta?v.np/v.ta*100:null,'%',['PPE','INVT','REC'],'ISA 315'],
 ['roe','العائد على حقوق الملكية %','ربحية',v=>v.eqb?v.np/v.eqb*100:null,'%',['EQY'],'ISA 315'],
 ['dso','فترة تحصيل العملاء (يوم)','نشاط',v=>v.rev?v.rec/v.rev*365:null,'d',['REC','REV'],'ISA 540 — خسائر ائتمانية / قطع الإيرادات'],
 ['dio','فترة بقاء المخزون (يوم)','نشاط',v=>v.cosT?v.inv/v.cosT*365:null,'d',['INVT','COS'],'ISA 501/540 — تقادم المخزون'],
 ['dpo','فترة سداد الموردين (يوم)','نشاط',v=>v.cosT?v.pay/v.cosT*365:null,'d',['PAY','COS'],'ISA 315 — اكتمال الالتزامات'],
 ['dte','الديون إلى حقوق الملكية','هيكل تمويل',v=>v.eqb?v.debt/v.eqb:null,'x',['CBR','BOR','EQY','LES'],'ISA 570 / التعهدات'],
 ['lta','المطلوبات إلى الأصول %','هيكل تمويل',v=>v.ta?v.liab/v.ta*100:null,'%',['PAY','BOR','EQY'],'ISA 570'],
 ['icr','تغطية الفوائد (مرة)','هيكل تمويل',v=>v.fcst?(v.pbt+v.fcst)/v.fcst:null,'x',['FIN','BOR','CBR'],'ISA 570'],
 ['at','معدل دوران الأصول','نشاط',v=>v.ta?v.rev/v.ta:null,'x',['REV','PPE'],'ISA 315']];
const anFmt=(v,u)=>v==null||!isFinite(v)?'—':u==='%'?v.toFixed(1)+'%':u==='d'?Math.round(v)+' يوم':v.toFixed(2);
const anRatioVal=(r,x)=>x?r[3](x):null;
const anThr=()=>num(G('an.thr','20'));/* relative change threshold % */
function anAreaLinks(ids){return ids.map(id=>CT.areaBy[id]).filter(a=>a&&!ctOff(a.main)).map(a=>`<a class="wpl" href="${L('wp/'+encodeURIComponent(a.main))}" title="${esc(a.ar)}">${esc(CT.items[a.main].disp)}</a>`).join(' ')}
function anRiskBadges(ids){return ids.map(id=>CT.areaBy[id]).filter(a=>a&&!ctOff(a.main)).map(a=>{const rm=areaRmm(a.id);return rm==='H'||areaSig(a.id)?`<span class="b ${rm==='H'?'bad':'isa'}" title="${esc(a.ar)}">${rm==='H'?'مرتفع':'جوهري'} · ${esc(a.id)}</span>`:''}).join('')}
function anRatiosFor(a){const V=anVals();if(!V||!V.cy)return'';const rs=AN_RATIOS.filter(r=>r[5].includes(a.id));if(!rs.length)return'';
 return `<h3>النسب المالية المرتبطة بالمجال (من مركز التحليلات)</h3><div class="tw"><table><thead><tr><th>النسبة</th><th>السنة الحالية</th><th>السنة السابقة</th><th>التغير</th></tr></thead><tbody>${rs.map(r=>{const c=anRatioVal(r,V.cy),p=anRatioVal(r,V.py);const ch=c!=null&&p?fsPct(c,p):null;const hi=ch!=null&&Math.abs(ch)>anThr();return `<tr${hi?' class="ovrrow"':''}><td>${esc(r[1])}</td><td class="num" dir="ltr">${anFmt(c,r[4])}</td><td class="num" dir="ltr">${anFmt(p,r[4])}</td><td class="num${hi?' ovr':''}" dir="ltr">${ch==null?'—':ch.toFixed(0)+'%'}</td></tr>`}).join('')}</tbody></table></div>`}
function anRatiosTab(){const V=anVals();if(!V)return fsNoData();const thr=anThr();const groups=[...new Set(AN_RATIOS.map(r=>r[2]))];let h='';
 for(const gr of groups){h+=`<tr class="grp"><td colspan="7">${gr}</td></tr>`;for(const r of AN_RATIOS.filter(x=>x[2]===gr)){const c=anRatioVal(r,V.cy),p=anRatioVal(r,V.py);const ch=c!=null&&p?fsPct(c,p):null;const hi=ch!=null&&Math.abs(ch)>thr;
  h+=`<tr${hi?' class="ovrrow"':''}><td>${esc(r[1])}</td><td class="num" dir="ltr">${anFmt(c,r[4])}</td><td class="num" dir="ltr">${anFmt(p,r[4])}</td><td class="num${hi?' ovr':''}" dir="ltr">${ch==null?'—':ch.toFixed(0)+'%'}</td><td>${hi?anRiskBadges(r[5])||'<span class="mut">—</span>':'<span class="mut">—</span>'}</td><td>${anAreaLinks(r[5])}</td><td class="small mut">${esc(r[6])}</td></tr>`}}
 return `<div class="note">تُظلَّل النسبة عندما يتجاوز تغيرها عن السنة السابقة <b>${thr}%</b> (قابلة للتعديل أدناه). عند التجاوز تُعرض مخاطر المجالات المرتبطة؛ فسِّر الفرق في ورقة الإجراءات التحليلية (A120) للمجال، وحدِّث تقييم RMM عند اللزوم.</div>
 <label class="fl" style="max-width:260px">حد التغير % للتنبيه<input class="in" dir="ltr" type="number" step="1" data-k="an.thr" data-dv="20" value="${esc(G('an.thr','20'))}" data-anrefresh="1"${RO()?' readonly':''}></label>
 <div class="tw"><table><thead><tr><th>النسبة</th><th>الحالية</th><th>السابقة</th><th>التغير</th><th>مخاطر مرتبطة</th><th>أوراق العمل</th><th>معيار/غرض</th></tr></thead><tbody>${h}</tbody></table></div>`}
function anHV(){const B=fsBuild();if(!B.ready)return fsNoData();const V=anVals();const thr=fsM();const taC=V.cy.ta,taP=V.py?V.py.ta:null,rvC=V.cy.rev,rvP=V.py?V.py.rev:null;
 const mkRows=(st,base,basep)=>{let h='';for(const g of fsOrder(st)){h+=`<tr class="grp"><td colspan="7">${esc(g)}</td></tr>`;for(const n of [...B.S[st].get(g).values()].sort((a,b)=>Math.abs(b.cy)-Math.abs(a.cy))){const d=n.py==null?null:n.cy-n.py;const p=d==null?null:fsPct(n.cy,n.py);const over=thr>0&&d!=null&&Math.abs(d)>thr;const a=fsWpOf(n.line);
   h+=`<tr${over?' class="ovrrow"':''}><td class="sub1">${esc(n.u)}</td><td class="num" dir="ltr">${fm(n.cy)}</td><td class="num" dir="ltr">${n.py==null?'—':fm(n.py)}</td><td class="num${over?' ovr':''}" dir="ltr">${d==null?'—':fm(d)}</td><td class="num" dir="ltr">${p==null||!isFinite(p)?'—':p.toFixed(1)+'%'}</td><td class="num" dir="ltr">${base?(n.cy/base*100).toFixed(1)+'%':'—'}${basep&&n.py!=null?` <span class="mut">/ ${(n.py/basep*100).toFixed(1)}%</span>`:''}</td><td>${a?`<a class="wpl" href="${L('wp/'+encodeURIComponent(fsAnRef(a)))}">${esc(CT.items[a.main].disp)}</a> ${anRiskBadges([a.id])}`:''}</td></tr>`}}return h};
 const th=`<thead><tr><th>البند</th><th>الحالية</th><th>السابقة</th><th>الفرق</th><th>% أفقي</th><th>% رأسي</th><th>ورقة/خطر</th></tr></thead>`;
 return `<div class="note">التحليل الأفقي (التغير عن السنة السابقة) والرأسي (% من إجمالي الأصول لقائمة المركز، و% من الإيرادات لقائمة الدخل). تُظلَّل الفروق الأعلى من الأهمية النسبية (${thr?fmtN(thr):'غير محسوبة'}). الرابط يفتح ورقة الإجراءات التحليلية للمجال.</div>
 <h3>قائمة المركز المالي — % من إجمالي الأصول</h3><div class="tw"><table class="fst">${th}<tbody>${mkRows('SFP',taC,taP)}</tbody></table></div>
 <h3>قائمة الدخل — % من الإيرادات</h3><div class="tw"><table class="fst">${th}<tbody>${mkRows('PL',rvC,rvP)}</tbody></table></div>`}
function anDuPont(){const V=anVals();if(!V)return fsNoData();const f=v=>v?{nm:v.rev?v.np/v.rev*100:null,at:v.ta?v.rev/v.ta:null,em:v.eqb?v.ta/v.eqb:null,roe:v.eqb?v.np/v.eqb*100:null}:null;const c=f(V.cy),p=f(V.py);
 const r=(l,k,u)=>`<tr><td>${l}</td><td class="num" dir="ltr">${anFmt(c[k],u)}</td><td class="num" dir="ltr">${p?anFmt(p[k],u):'—'}</td><td class="num" dir="ltr">${p&&c[k]!=null&&p[k]?(fsPct(c[k],p[k])).toFixed(0)+'%':'—'}</td></tr>`;
 return `<div class="tw"><table><thead><tr><th>مكوّن DuPont</th><th>الحالية</th><th>السابقة</th><th>التغير</th></tr></thead><tbody>${r('هامش صافي الربح %','nm','%')}${r('معدل دوران الأصول','at','x')}${r('الرافعة المالية (الأصول ÷ حقوق الملكية)','em','x')}${r('العائد على حقوق الملكية % (حاصل الضرب)','roe','%')}</tbody></table></div><p class="mut small">ROE = هامش الربح × دوران الأصول × الرافعة. حدِّد أي مكوّن غيّر العائد: الهامش (تسعير/تكاليف/إيراد)، الدوران (أصول معطلة/إيراد منخفض)، أم الرافعة (ديون جديدة—ISA 570).</p>`}
function anFlux(){const B=fsBuild();if(!B.ready)return fsNoData();if(!B.hasPy)return `<div class="note warn">قائمة الفروق الجوهرية تحتاج أرصدة السنة السابقة؛ حمّلها من «رفع الميزان». كما يمكن مقارنة الموازنة في ورقة A120 لكل مجال.</div>`;
 const thr=fsM();const rows=[];for(const st of ['SFP','PL'])for(const g of fsOrder(st))for(const n of B.S[st].get(g).values()){const d=n.cy-n.py;rows.push({st,g,n,d})}
 const hi=rows.filter(x=>thr>0?Math.abs(x.d)>thr:false).sort((a,b)=>Math.abs(b.d)-Math.abs(a.d));
 return `<div class="note">بنود تجاوز فرقها عن السنة السابقة الأهمية النسبية للأداء <b dir="ltr">${thr?fmtN(thr):'—'}</b>: <b>${hi.length}</b> من ${rows.length}. كل بند يحتاج تفسيرًا (استفسار + دليل) في ورقة A120 للمجال المرتبط (ISA 520.7).</div>
 <div class="tw"><table><thead><tr><th>البند</th><th>القائمة</th><th>الحالية</th><th>السابقة</th><th>الفرق</th><th>%</th><th>ورقة/خطر</th></tr></thead><tbody>${hi.slice(0,80).map(x=>{const a=fsWpOf(x.n.line);const p=fsPct(x.n.cy,x.n.py);const an=a?CT.items[fsAnRef(a)]:null;
  return `<tr class="ovrrow"><td>${esc(x.n.u)}</td><td>${x.st==='SFP'?'مركز مالي':'دخل'}</td><td class="num" dir="ltr">${fm(x.n.cy)}</td><td class="num" dir="ltr">${fm(x.n.py)}</td><td class="num ovr" dir="ltr">${fm(x.d)}</td><td class="num" dir="ltr">${p==null||!isFinite(p)?'—':p.toFixed(0)+'%'}</td><td>${an?`<a class="wpl" href="${L('wp/'+encodeURIComponent(an.ref))}">${esc(an.disp)}</a> `:''}${a?anRiskBadges([a.id]):''}</td></tr>`}).join('')}</tbody></table></div>`}
function anVar(){if(!TBSTORE.ready())return fsNoData();const thr=fsM();const am=areaMap();const only=CUR.anOnly!==false;const q=normAr(CUR.anQ||'');const pyOk=!!TBSTORE.pyMap;
 const rows=[];for(const [id,d] of am.data){const a=CT.areaBy[id];const sg=AREA_SIGN(a);for(const x of d.rows){const dp=x.py==null?null:x.cy-x.py;const db=!x.bud?null:x.cy-x.bud;const o=(dp!=null&&thr>0&&Math.abs(dp)>thr)||(db!=null&&thr>0&&Math.abs(db)>thr);rows.push({x,a,sg,dp,db,o})}}
 let f=rows.filter(r=>(!only||r.o)&&(!q||normAr(r.x.r.code+' '+r.x.r.name).includes(q)));f.sort((p1,p2)=>Math.max(Math.abs(p2.dp||0),Math.abs(p2.db||0))-Math.max(Math.abs(p1.dp||0),Math.abs(p1.db||0)));const nO=rows.filter(r=>r.o).length;
 return `<div class="note">مقارنة كل حساب بالسنة السابقة وبالموازنة؛ يُظلَّل ما يتجاوز <b>الأهمية النسبية للأداء (${thr?fmtN(thr):'غير محسوبة'})</b>. عدد الحسابات المتجاوزة: <b>${nO}</b> من ${rows.length}.${pyOk?'':' <span class="mut">(لا توجد أرصدة سنة سابقة)</span>'}</div>
 <p class="row noprint"><label class="row"><input type="checkbox" data-v4act="anonly"${only?' checked':''}> المتجاوزة للأهمية فقط</label><input class="in" data-v4act="anq" placeholder="بحث بالكود أو الاسم…" value="${esc(CUR.anQ||'')}" aria-label="بحث"></p>
 <div class="tw"><table><thead><tr><th>الكود</th><th>الحساب</th><th>المجال / ورقة العمل</th><th>الحالية</th><th>السابقة</th><th>الفرق</th><th>%</th><th>الموازنة</th><th>الفرق عن الموازنة</th></tr></thead><tbody>${f.slice(0,300).map(r=>{const c=r.x.cy*r.sg;const ov=(v,b)=>b?' ovr':'';const p=r.dp!=null&&r.x.py?r.dp/Math.abs(r.x.py)*100:null;
  return `<tr${r.o?' class="ovrrow"':''}><td class="ref">${esc(r.x.r.code)}</td><td class="tx">${esc(r.x.r.name)}</td><td><a class="wpl" href="${L('wp/'+encodeURIComponent(fsAnRef(r.a)))}" title="${esc(r.a.ar)}">${esc(r.a.id)}</a> ${anRiskBadges([r.a.id])}</td><td class="num" dir="ltr">${fm(c)}</td><td class="num" dir="ltr">${r.x.py==null?'—':fm(r.x.py*r.sg)}</td><td class="num${thr&&r.dp!=null&&Math.abs(r.dp)>thr?' ovr':''}" dir="ltr">${r.dp==null?'—':fm(r.dp*r.sg)}</td><td class="num" dir="ltr">${p==null||!isFinite(p)?'—':p.toFixed(0)+'%'}</td><td class="num" dir="ltr">${!r.x.bud?'—':fm(r.x.bud*r.sg)}</td><td class="num${thr&&r.db!=null&&Math.abs(r.db)>thr?' ovr':''}" dir="ltr">${r.db==null?'—':fm(r.db*r.sg)}</td></tr>`}).join('')}</tbody></table></div>${f.length>300?`<p class="mut small">عُرض أكبر 300 من ${f.length}.</p>`:''}`}
document.addEventListener('change',e=>{const el=e.target;if(el instanceof Element&&el.dataset&&el.dataset.v4act==='anonly'){CUR.anOnly=el.checked;refreshBlock('anh')}});
let _anqT=0;document.addEventListener('input',e=>{const el=e.target;if(el instanceof Element&&el.dataset&&el.dataset.v4act==='anq'){CUR.anQ=el.value;clearTimeout(_anqT);_anqT=setTimeout(()=>{refreshBlock('anh');const i=document.querySelector('[data-v4act=anq]');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},250)}});
const AN_TABS=[['ratios','النسب المالية',anRatiosTab],['hv','أفقي ورأسي',anHV],['dupont','DuPont',anDuPont],['flux','الفروق الجوهرية',anFlux],['var','مقارنة الحسابات (سنة سابقة/موازنة)',anVar]];
function anHubHTML(){const cur=(CUR.anTab&&AN_TABS.some(t=>t[0]===CUR.anTab))?CUR.anTab:'ratios';const t=AN_TABS.find(x=>x[0]===cur);
 return `<nav class="tabs noprint" role="tablist" aria-label="مركز التحليلات">${AN_TABS.map(x=>`<a role="tab" href="#" data-v4act="antab" data-t="${x[0]}" aria-selected="${x[0]===cur}">${x[1]}</a>`).join('')}</nav><div data-block="anh">${t[2]()}</div>`}
BLOCKS.anh=()=>{const cur=(CUR.anTab&&AN_TABS.some(t=>t[0]===CUR.anTab))?CUR.anTab:'ratios';return AN_TABS.find(x=>x[0]===cur)[2]()};
document.addEventListener('click',e=>{const b=e.target instanceof Element&&e.target.closest('[data-v4act="antab"]');if(!b)return;e.preventDefault();CUR.anTab=b.dataset.t;const host=b.closest('.anhub')||document;host.querySelectorAll('[data-v4act="antab"]').forEach(x=>x.setAttribute('aria-selected',x===b?'true':'false'));refreshBlock('anh')});
document.addEventListener('change',e=>{const el=e.target;if(el instanceof Element&&el.dataset&&el.dataset.anrefresh)setTimeout(()=>refreshBlock('anh'),60)});
XP.analytics_prelim=(it,p,ref)=>`<div class="note">الإجراءات التحليلية المبدئية (ISA 315.A14 / ISA 520.5) لتحديد مجالات الخطر قبل التخطيط التفصيلي: النسب المالية، التحليل الأفقي والرأسي، DuPont، والفروق الجوهرية — مرتبطة بمخاطر المجالات وأوراق عملها.</div>
 <div class="anhub">${anHubHTML()}</div>
 <h3>الاستنتاج</h3>${edc('wp.'+ref+'.concl',{label:'استنتاج الإجراءات التحليلية المبدئية',ph:'المجالات التي تستدعي اهتمامًا خاصًا وسبب ذلك…',ml:1})}`;
XP.analytics_hub=XP.analytics_prelim;
