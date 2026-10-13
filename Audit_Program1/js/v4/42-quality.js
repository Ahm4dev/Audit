/* Audit-Plus · V4 · Quality (65_quality) */
'use strict';
/* ===== 65_quality.js ===== */
/* =====================================================================
   v4 · Quality layer
   1) duplicate-field sync, unique ids, auto aria-labels      2) paper readiness panel + approval gating
   3) exceptions / misstatements / review notes inside the paper   4) one Excel export for a unified paper
   ===================================================================== */
function wpSheets(ref,st){const it=CT.items[ref];if(it&&it.area&&it.kind==='main'&&!st){const out=[];for(const r of CT.areaBy[it.area].items){if(ctOff(r)||!WP[r])continue;for(const s of wpSheets0(r)){out.push(Object.assign({},s,{name:(CT.items[r].disp+' '+s.name.replace(/^\S+\s/,'')).slice(0,31)}))}}return out}return wpSheets0(ref,st)}
/* ---------- 1) consistency ---------- */
const SYNC_LOCK={on:false};
function syncDup(el){if(SYNC_LOCK.on)return;const k=el.dataset&&el.dataset.k;if(!k)return;const main=document.querySelector('#main');if(!main)return;SYNC_LOCK.on=true;try{
 main.querySelectorAll('[data-k]').forEach(o=>{if(o===el||o.dataset.k!==k||o.tagName==='OPTION')return;if(o.matches('input[type=checkbox]'))o.checked=el.checked;else if(o.matches('input,select,textarea'))o.value=el.value;else if(o.isContentEditable||o.classList.contains('ed'))o.textContent=el.textContent})}finally{SYNC_LOCK.on=false}}
document.addEventListener('input',e=>{if(e.target instanceof Element)syncDup(e.target)});
document.addEventListener('change',e=>{if(e.target instanceof Element)syncDup(e.target)});
function a11yFix(){const m=document.querySelector('#main');if(!m)return;const seen=new Map();m.querySelectorAll('[id]').forEach(e=>{const n=seen.get(e.id)||0;seen.set(e.id,n+1);if(n>0){const nid=e.id+'-'+n;e.id=nid}});
 m.querySelectorAll('input:not([type=hidden]):not([type=file]),select,textarea').forEach(e=>{if(e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')||e.closest('label')||(e.id&&m.querySelector('label[for="'+CSS.escape(e.id)+'"]')))return;
  let t='';const td=e.closest('td,th');if(td){const tr=td.parentElement;const table=td.closest('table');const idx=[...tr.children].indexOf(td);const th=table&&table.tHead&&table.tHead.rows[0]&&table.tHead.rows[0].cells[idx];t=(th?th.textContent:'')+' '+((tr.cells[0]&&tr.cells[0]!==td)?tr.cells[0].textContent:'')}
  else{const p=e.closest('div,p,li');t=p?p.textContent:''}
  t=t.replace(/\s+/g,' ').trim().slice(0,70);e.setAttribute('aria-label',t||e.name||e.dataset.k||'حقل')})}
function wplistGlobal(){try{let h=document.getElementById('wplist-g');if(!h){h=document.createElement('div');h.id='wplist-g';h.hidden=true;document.body.appendChild(h)}const n=Object.keys(WP).length;if(h.dataset.n!==String(n)){h.innerHTML=wpDatalist0();h.dataset.n=String(n)}}catch(e){}}
document.addEventListener('meap:routed',()=>{wplistGlobal();setTimeout(a11yFix,0)});
/* ---------- 2) readiness ---------- */
const UNRES=s=>['Open','Management Responded'].includes(s||'Open');
function anUnexplained(a,ref){const D=areaData(a.id);const M=matState();const basis=G('wp.'+ref+'.an.basis','py'),gr=num(G('wp.'+ref+'.an.gr','0')),thrIn=G('wp.'+ref+'.an.thr','');const thr=thrIn!==''?num(thrIn):(M.pm||0);if(!(thr>0))return{n:0,over:0};
 let n=0,over=0;for(const x of D.rows){const e=basis==='bud'?x.bud:(x.py!=null?x.py*(1+gr/100):null);if(e==null)continue;const d=x.cy-e;if(Math.abs(d)>thr){over++;if(!String(G('wp.'+ref+'.an.x.'+tbk(x.r.code),'')).trim())n++}}return{n,over}}
function wpReady(ref){const it=CT.items[ref];if(!it)return null;const a=it.area?CT.areaBy[it.area]:null;const R=a?a.items.filter(r=>!ctOff(r)):[ref];const M=matState();const out=[];
 const add=(stage,lv,t,sec)=>out.push({stage,lv,t,sec:sec||ref});
 if(a&&!M.set)add('PR','b','لم تُحتسب الأهمية النسبية — أكمل ورقة A500 قبل الاستمرار.',ref);
 if(!String(G('wp.'+ref+'.t.cc','')).trim())add('PR','b','الاستنتاج فارغ — اكتب استنتاج المراجع المبني على العمل المنفذ.',ref);
 if(a){const st=wpStartedSet();const started=R.some(r=>st.has(r)||G('wp.'+r+'.wf','NS')!=='NS');const rm=areaRmm(a.id);
  if(!started)add('PR',rm==='H'||areaSig(a.id)?'b':'w','لم يُوثَّق أي عمل في هذه الورقة'+(rm==='H'||areaSig(a.id)?' رغم أن خطر التحريف الجوهري «مرتفع/جوهري» — يلزم توثيق الاستجابة.':'.'),ref);
  if(!TBSTORE.ready())add('PR','w','لا يوجد ميزان محمّل — الأرصدة والعينات والتحليلات لا تُحتسب.',ref);
  for(const r of R){const x=CT.items[r];if(x.kind==='an'&&TBSTORE.ready()){const u=anUnexplained(a,r);if(u.n)add('RV','b',`${u.n} فرق تحليلي يتجاوز الحد المقبول بلا تفسير ودليل (ISA 520.7).`,r)}
   if(x.kind==='tod'){const res=G('wp.'+r+'.sm.res',null);if(res&&M.pm&&res.pm&&res.pm!==M.pm)add('RV','b','حجم العينة محسوب بأهمية أداء مختلفة عن الحالية — أعد الاحتساب واعتمده.',r);else if(!res&&TBSTORE.ready()&&M.pm&&Math.abs(areaData(a.id).cy)>M.pm)add('RV','w','رصيد المجال يتجاوز أهمية الأداء ولم تُعتمد عينة بعد.',r)}}}
 const refsSet=new Set(R);const rn=recs(CUR.eng,'r').filter(x=>(x.status||'Open')!=='Cleared'&&split(x.ref||'').some(y=>refsSet.has(y)||(CT.leg[y]&&refsSet.has(CT.leg[y]))));
 if(rn.length)add('RV','b',`${rn.length} ملاحظة مراجعة مفتوحة على هذه الورقة.`,'exc-'+ref);
 const fs=recs(CUR.eng,'f').filter(x=>UNRES(x.status)&&(split(x.ref||'').some(y=>refsSet.has(y))||(a&&x.acc&&a.lines.includes(x.acc))));
 const fh=fs.filter(x=>x.sev==='H');if(fh.length)add('RV','b',`${fh.length} استثناء/ملاحظة عالية الأهمية لم تُعالج.`,'exc-'+ref);if(fs.length>fh.length)add('RV','w',`${fs.length-fh.length} ملاحظة/استثناء بانتظار الرد أو التقييم.`,'exc-'+ref);
 const cc=String(G('wp.'+ref+'.t.cc',''));if(fs.length&&/خالٍ|خال من|لا توجد (استثناءات|تحريفات)|لا استثناءات/.test(cc))add('RV','w','تعارض: الاستنتاج يذكر عدم وجود استثناءات بينما توجد ملاحظات غير معالجة.',ref);
 for(const l of allLinks()){if(refsSet.has(l.from)&&l.to&&CT.items[l.to]&&ctOff(l.to))add('RV','w',`مرجع إلى ورقة مستبعدة: ${CT.items[l.to].disp}.`,ref)}
 if(it.ty.some(t=>t.t==='ATT')&&!attListO(CUR.eng,{t:'wp',id:ref}).length)add('RV','b','المستند الموقّع غير مرفق.',ref);
 if(a&&TBSTORE.ready()){const D=areaData(a.id);const tbv=Math.abs(D.cy);
  for(const r of R){const x=CT.items[r];if(x.kind!=='tod')continue;const k='wp.'+r+'.sm.';const res=G(k+'res',null);const man=G(k+'pop',null);
   if(man!=null&&man!==''&&M.pm&&Math.abs(Math.abs(num(man))-tbv)>M.pm)add('RV','w',`تعارض مع الميزان: قيمة مجتمع العينة المُدخلة يدويًا (${fmtN(num(man))}) تختلف عن رصيد الميزان بعد التسويات (${fmtN(tbv)}) بأكثر من أهمية الأداء — اشرح الفرق.`,r);
   else if(res&&res.pop&&(man==null||man==='')&&M.pm&&Math.abs(res.pop-tbv)>M.pm)add('RV','w','الميزان أو التسويات تغيّرت بعد اعتماد حجم العينة (المجتمع المحسوب يختلف عن الرصيد الحالي بأكثر من PM) — أعد احتساب العينة.',r)}
  const aj=recs(CUR.eng,'a').filter(y=>y.acc&&a.lines.includes(y.acc)&&y.adj!=='Adjusted');const un=aj.reduce((t,y)=>t+Math.abs(num(y.amt)),0);
  if(M.pm&&un>M.pm)add('RV','w',`التحريفات غير المعدَّلة المرتبطة (${fmtN(un)}) تتجاوز أهمية الأداء — قيّم الأثر الإجمالي ونطاق الإجراءات (ISA 450).`,'exc-'+ref);
  const cc2=String(G('wp.'+ref+'.t.cc',''));if(un>0&&/(سليم|عادل|لا تحريف|دون تحريف|لا توجد تحريفات)/.test(cc2)&&M.ct&&un>M.ct)add('RV','w','تعارض: الاستنتاج لا يذكر تحريفات بينما توجد تحريفات غير معدَّلة فوق حد التفاهة.',ref)}
 return out}
function wpSuggest(ref){const it=CT.items[ref];if(!it||!it.area)return[];const a=CT.areaBy[it.area];const out=[];const nm=String((CT.items[a.main]||{}).ar||'');const rm=areaRmm(a.id);const sig=areaSig(a.id);
 const R=a.items.filter(r=>!ctOff(r));const st=wpStartedSet();const done=r=>st.has(r);
 if(/الإيرادات/.test(nm)&&!/الأخرى/.test(nm))out.push('الإيرادات: افترض خطر الغش في الإثبات ما لم تفنّد ذلك وثّق السبب (ISA 240.26)، وركّز على اختبار القطع (Cut-off) ومخاطر الإثبات في نهاية الفترة.');
 if(rm==='H'||sig)out.push('خطر مرتفع/جوهري: ضع إجراءات تفصيلية بدل الاعتماد على التحليلات وحدها، وراجع التخطيط لتضمين عنصر المفاجأة (ISA 330.21).');
 const fs=recs(CUR.eng,'f').filter(x=>x.acc&&a.lines.includes(x.acc)&&x.type&&/Misstatement|تحريف/.test(x.type));if(fs.length)out.push('سُجّل تحريف: قدّر الأثر المتوقع على المجتمع (Projected Misstatement) وقيّم الحاجة لتوسيع العينة (ISA 530.14).');
 if(TBSTORE.ready()){const D=areaData(a.id),M=matState();if(M.pm&&D.py!=null&&Math.abs(D.cy-D.py)>M.pm&&!R.some(r=>CT.items[r].kind==='an'&&done(r)))out.push('تغيّر الرصيد عن السنة السابقة بأكثر من أهمية الأداء ولم تُوثَّق تحليلات: افهم أسباب التغير واحصل على تفسير مؤيَّد بدليل (ISA 520).')}
 if(/(المخصصات|المخزون|الذمم المدينة|الأدوات المالية|الأصول غير الملموسة|الضرائب المؤجلة|الإيجار)/.test(nm)&&!(R.some(r=>/E$/.test(r)&&done(r))))out.push('بند يتضمن تقديرات محاسبية: وثّق الأساليب والافتراضات ومؤشرات تحيّز الإدارة، وقارن بنتائج تقديرات السنة السابقة (ISA 540).');
 if(/(ذات العلاقة)/.test(nm))out.push('الأطراف ذات العلاقة: تأكد من اكتمال القائمة وفحص المعاملات خارج السياق العادي للنشاط (ISA 550).');
 return out}
function provHTML(ref){const it=CT.items[ref];if(!it)return'';const a=it.area?CT.areaBy[it.area]:null;const M=matState();const bits=[];
 if(TBSTORE.ready())bits.push(`<span class="prv a">آلي</span> أرصدة الميزان: ${esc(TBSTORE.stamp())}`);
 if(M.set)bits.push(`<span class="prv a">آلي</span> الأهمية: PM ${fmtN(M.pm)} / CT ${fmtN(M.ct)} من A500`);
 if(a){const R=a.items.filter(r=>!ctOff(r));let man=0;for(const [k,v] of CUR.eng.entries('wp.')){const m=/^wp\.([^.]+)\.(.+)$/.exec(k);if(!m||!R.includes(m[1]))continue;if(/^(wf|ap|ovr|excluded|sm\.res|sm\.sel|sm\.popsum)/.test(m[2]))continue;if(v!==''&&v!=null&&v!==false)man++}
  bits.push(`<span class="prv m">يدوي</span> ${man} حقل أدخله المراجع`);const smr=R.map(r=>G('wp.'+r+'.sm.res',null)).filter(Boolean);if(smr.length)bits.push(`<span class="prv a">محسوب</span> ${smr.length} عينة معتمدة (تعتمد على PM وقت الاعتماد)`)}
 return bits.length?`<p class="small mut prvl">مصادر القيم: ${bits.join(' · ')}</p>`:''}
function _rdyExtra(ref){const sg=wpSuggest(ref);return provHTML(ref)+(sg.length?`<details class="nt noprint"><summary>اقتراحات مساعدة للمراجع (${sg.length}) — للاسترشاد وليست نتائج أو أدلة</summary><ul class="l">${sg.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="mut small">القرار بشأن تنفيذها يعود للحكم المهني للمراجع، ولا يُعدّ ظهور الاقتراح دليلًا على تنفيذ إجراء.</p></details>`:'')}
function rdyHTML(ref){const items=wpReady(ref);if(!items)return'';const b=items.filter(x=>x.lv==='b'),w=items.filter(x=>x.lv==='w');
 const li=x=>`<li class="${x.lv==='b'?'rdyb':'rdyw'}"><span>${x.lv==='b'?'⛔':'⚠'}</span> ${esc(x.t)} <span class="b">${x.stage==='PR'?'قبل الإعداد':'قبل المراجعة'}</span> <a href="#" data-v4act="wpsec" data-sec="${esc(x.sec)}" class="small noprint">انتقل</a></li>`;
 return `<div class="card rdy ${b.length?'rdy-bad':w.length?'rdy-warn':'rdy-ok'}"><h3 style="margin-top:0">جاهزية الورقة للإعداد والمراجعة ${b.length?`<span class="b bad">${b.length} مانع</span>`:'<span class="b ok">لا موانع</span>'}${w.length?` <span class="b M">${w.length} تنبيه</span>`:''}</h3>${items.length?`<ul class="l rdyl">${b.map(li).join('')}${w.map(li).join('')}</ul>`:'<p class="mut">المتطلبات الجوهرية مستوفاة. هذه الفحوص مساعدة للمراجع ولا تغني عن حكمه المهني.</p>'}${_rdyExtra(ref)}</div>`}
function rdyPanel(it){return `<div data-block="rdy|${esc(it.ref)}">${rdyHTML(it.ref)}</div>`}
BLOCKS.rdy=ref=>rdyHTML(ref);
let _rdyT=0;function rdyLater(){clearTimeout(_rdyT);_rdyT=setTimeout(()=>{const b=document.querySelector('#main [data-block^="rdy|"]');if(b)refreshBlock(b.dataset.block)},700)}
document.addEventListener('change',rdyLater);document.addEventListener('input',e=>{if(e.target instanceof Element&&e.target.closest('.ed,.in,textarea'))rdyLater()});
/* gating of approval transitions */
let _GATE_PASS=false;
document.addEventListener('click',async e=>{const b=e.target instanceof Element&&e.target.closest('[data-act=apmove]');if(!b||b.dataset.t!=='wp')return;const to=b.dataset.to;if(!['PR','RV','PA','QR'].includes(to))return;
 if(_GATE_PASS){_GATE_PASS=false;return}const ref=b.dataset.id;if(!CT.items[ref])return;
 const items=wpReady(ref).filter(x=>x.lv==='b'&&(x.stage==='PR'||to!=='PR'));if(!items.length)return;
 e.preventDefault();e.stopImmediatePropagation();
 const list=`<ul class="l">${items.map(x=>`<li>${esc(x.t)}</li>`).join('')}</ul>`;const priv=SESSION&&['admin','partner'].includes(SESSION.role);
 if(!priv){await ask({title:'لا يمكن المتابعة — متطلبات غير مستوفاة',body:`<p>استوفِ البنود التالية أولًا:</p>${list}<p class="mut small">يمكن للشريك أو المدير تجاوز الحجب بمبرر موثّق.</p>`,ok:'حسنًا'});return}
 const r=await formDlg({title:'تجاوز موثّق لمتطلبات غير مستوفاة',html:`<p>البنود التالية غير مستوفاة:</p>${list}<label class="fl">مبرر التجاوز (يُسجَّل في سجل التدقيق)<textarea class="ta" name="n" required></textarea></label>`,ok:'تجاوز ومتابعة',onOk:async d=>{if(String(d.n||'').trim().length<10)throw new Error('اكتب مبررًا واضحًا (10 أحرف على الأقل).');return d.n.trim()}});
 if(!r)return;const log=(G('wp.'+ref+'.ovr',[])||[]).slice();log.push({to,by:SESSION.id,t:Date.now(),reason:r,items:items.map(x=>x.t)});CUR.eng.set('wp.'+ref+'.ovr',log,{label:'تجاوز متطلبات الاعتماد',noUndo:true});audit('approval.override',{ref,to,reason:r,n:items.length});
 _GATE_PASS=true;b.click()},true);
/* ---------- 3) exceptions block ---------- */
function excRecs(it){const a=it.area?CT.areaBy[it.area]:null;const R=a?a.items:[it.ref];const S=new Set(R);
 const f=recs(CUR.eng,'f').filter(x=>split(x.ref||'').some(y=>S.has(y))||(a&&x.acc&&a.lines.includes(x.acc)));
 const aj=recs(CUR.eng,'a').filter(x=>(a&&x.acc&&a.lines.includes(x.acc)));const rn=recs(CUR.eng,'r').filter(x=>split(x.ref||'').some(y=>S.has(y)||(CT.leg[y]&&S.has(CT.leg[y]))));return{f,aj,rn}}
function excHTML(ref){const it=CT.items[ref];if(!it)return'';const {f,aj,rn}=excRecs(it);const M=matState();
 const un=aj.filter(x=>x.adj!=='Adjusted').reduce((s,x)=>s+Math.abs(num(x.amt)),0);
 const sum=`<p class="mut small">استثناءات: <b>${f.length}</b> (${f.filter(x=>UNRES(x.status)).length} غير معالجة) · تسويات/تحريفات: <b>${aj.length}</b> · غير المعدَّل: <b dir="ltr">${fmtN(un)}</b>${M.pm?` مقابل أهمية الأداء <b dir="ltr">${fmtN(M.pm)}</b> ${un>M.pm?'<span class="b bad">يتجاوز PM</span>':un>M.ct?'<span class="b M">أعلى من حد التفاهة</span>':''}`:''} · ملاحظات مراجعة مفتوحة: <b>${rn.filter(x=>(x.status||'Open')!=='Cleared').length}</b></p>`;
 return sum+(f.length?logTables(f,[]):'<p class="mut">لا توجد استثناءات مسجلة لهذه الورقة.</p>')+(aj.length?'<h4>التسويات والتحريفات</h4>'+adjTable(aj):'')+(rn.length?'<h4>ملاحظات المراجعة</h4>'+rnTable(rn):'')}
BLOCKS.exc=ref=>excHTML(ref);
function excBlock(it){const a=it.area?CT.areaBy[it.area]:null;const acc=a?(a.lines.find(l=>AC[l])||''):'';
 return `<section class="wpsec" id="sec-exc-${esc(it.ref)}"><h2 class="wpsech">الاستثناءات والتحريفات وملاحظات المراجعة</h2><div data-block="exc|${esc(it.ref)}">${excHTML(it.ref)}</div>${can('edit')?`<details class="nt noprint"><summary>+ تسجيل استثناء جديد مرتبط بهذه الورقة</summary><div class="card">${findingForm(acc).replace('data-form="finding"','data-form="finding" data-excref="'+esc(it.ref)+'"').replace('name="ref"','name="ref" value="'+esc(it.ref)+'"')}</div></details>`:''}</section>`}
document.addEventListener('submit',e=>{const f=e.target;if(!(f instanceof Element)||!f.dataset.excref)return;const ref=f.dataset.excref;
 /* attach the paper reference to the newly created record, then refresh the block */
 setTimeout(()=>{const f2=recs(CUR.eng,'f').sort((p,q)=>(q.t||0)-(p.t||0))[0];if(f2&&!f2.ref)CUR.eng.set('f.'+f2.id+'.ref',ref,{noUndo:true,label:'ربط استثناء بالورقة'});refreshBlock('exc|'+ref);rdyLater()},350)},true);
document.addEventListener('meap:routed',()=>{});
