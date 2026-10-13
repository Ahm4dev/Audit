/* Audit-Plus · V4 · Calculations (25_calc) */
'use strict';
/* ===== 25_calc.js ===== */
/* =====================================================================
   v4 · Calculation library: formulas, calc grids, sampling methods (ISA 530), analytical thresholds (ISA 520)
   ===================================================================== */
/* ---------- tiny safe expression evaluator (no eval / Function: CSP) ---------- */
function v4Expr(src,vars){const T=[];const re=/\s*(?:(\d+\.?\d*|\.\d+)|([A-Za-z_][A-Za-z0-9_]*)|(<>|<=|>=|[-+*\/^(),<>=%]))/gy;let m;re.lastIndex=0;
 while(re.lastIndex<src.length){const p=re.lastIndex;m=re.exec(src);if(!m){if(/^\s*$/.test(src.slice(p)))break;return NaN}if(m[1]!=null)T.push(['n',+m[1]]);else if(m[2]!=null)T.push(['i',m[2]]);else T.push(['o',m[3]])}
 let i=0;const isO=o=>T[i]&&T[i][0]==='o'&&T[i][1]===o;const FN={min:a=>Math.min(...a),max:a=>Math.max(...a),abs:a=>Math.abs(a[0]),round:a=>{const p=Math.pow(10,a[1]||0);return Math.round(a[0]*p)/p},if:a=>a[0]?a[1]:a[2],sum:a=>a.reduce((s,x)=>s+x,0),ceil:a=>Math.ceil(a[0]),floor:a=>Math.floor(a[0]),sqrt:a=>Math.sqrt(a[0])};
 function prim(){const t=T[i++];if(!t)throw 0;if(t[0]==='n')return t[1];if(t[0]==='i'){if(isO('(')){i++;const a=[];if(!isO(')')){for(;;){a.push(cmp());if(isO(',')){i++;continue}break}}if(!isO(')'))throw 0;i++;const f=FN[t[1].toLowerCase()];if(!f)throw 0;return f(a)}const v=vars[t[1]];return typeof v==='number'?v:(+v||0)}
  if(t[1]==='('){const v=cmp();if(!isO(')'))throw 0;i++;return v}if(t[1]==='-')return -un();if(t[1]==='+')return un();throw 0}
 function un(){let v=prim();while(isO('%')){i++;v/=100}return v}
 function pw(){let v=un();while(isO('^')){i++;v=Math.pow(v,un())}return v}
 function mul(){let v=pw();while(isO('*')||isO('/')){const o=T[i++][1];const b=pw();v=o==='*'?v*b:(b===0?0:v/b)}return v}
 function add(){let v=mul();while(isO('+')||isO('-')){const o=T[i++][1];const b=mul();v=o==='+'?v+b:v-b}return v}
 function cmp(){let v=add();while(T[i]&&T[i][0]==='o'&&['<','>','<=','>=','=','<>'].includes(T[i][1])){const o=T[i++][1];const b=add();v=o==='<'?v<b:o==='>'?v>b:o==='<='?v<=b:o==='>='?v>=b:o==='='?v===b:v!==b}return v}
 try{const r=cmp();if(i<T.length)return NaN;return typeof r==='boolean'?(r?1:0):r}catch(e){return NaN}}

/* ---------- statistics for sampling ---------- */
const SM={
 zq(p){/* normal quantile (A&S 26.2.23) for upper-tail probability p */if(p<=0)return 8;if(p>=1)return -8;const s=p>.5?-1:1;const q=p>.5?1-p:p;const t=Math.sqrt(-2*Math.log(q));return s*(t-(2.515517+.802853*t+.010328*t*t)/(1+1.432788*t+.189269*t*t+.001308*t*t*t))},
 binomCdf(k,n,p){let s=0,c=1;const q=1-p;let pw=Math.pow(q,n);for(let i=0;i<=k;i++){s+=pw;if(i<k){pw=pw*(n-i)/(i+1)*(p/q)}}return Math.min(1,s)},
 /* attribute sampling: smallest n with P(<=k deviations) <= 1-confidence when the true rate equals the tolerable rate */
 attr(conf,tdr,expRate){if(!(tdr>0)||!(conf>0))return null;const a=1-conf;for(let n=1;n<=20000;n++){const k=Math.floor(n*(expRate||0)+1e-9);if(SM.binomCdf(k,n,tdr)<=a+1e-12)return{n,k}}return null},
 /* Poisson reliability factor for k expected errors (monetary unit sampling) */
 rf(conf,k){const a=1-conf;let lo=0,hi=60;const cdf=l=>{let s=0,t=Math.exp(-l);for(let i=0;i<=k;i++){s+=t;t=t*l/(i+1)}return s};for(let it=0;it<80;it++){const mid=(lo+hi)/2;if(cdf(mid)>a)lo=mid;else hi=mid}return (lo+hi)/2},
 EF:{.8:1.2,.85:1.3,.9:1.5,.95:1.6,.99:1.9},
 mus(bv,tm,em,conf){const rf=SM.rf(conf,0);const ef=SM.EF[Math.round(conf*100)/100]||1.6;const den=tm-em*ef;if(!(bv>0)||!(den>0))return null;const n=Math.ceil(bv*rf/den);return{n,interval:bv/n,rf,ef}},
 classic(N,sd,tm,em,beta,alpha){const den=tm-em;if(!(N>0)||!(sd>0)||!(den>0))return null;const zb=SM.zq(beta),za=SM.zq(alpha);let n=Math.ceil(Math.pow((za+zb)*sd*N/den,2));n=Math.ceil(n/(1+n/N));return{n:Math.min(n,N),zb,za}},
 judg(bv,tm,af,minN){if(!(bv>0)||!(tm>0))return null;return{n:Math.max(Math.ceil(bv/tm*af),minN||0)}}
};
const SAMP_RMM=[['L','منخفض',.8,1.6],['M','متوسط',.9,2.3],['H','مرتفع',.95,3.0]];
const CFREQ4=[['سنوي (1)',1,1,1],['ربع سنوي (4)',2,2,2],['شهري (12)',2,3,5],['أسبوعي (52)',5,10,15],['يومي (250+)',20,30,40],['عدة مرات يوميًا (متكرر)',25,40,60]];

/* ---------- generic calc grid (rows × columns with formulas and totals) ---------- */
const CGR={};
function cgKey(ref,gid){return 'wp.'+ref+'.cg.'+gid}
function cgRows(ref,gid,spec){const k=cgKey(ref,gid)+'.rows';let r=G(k,null);if(!Array.isArray(r)){r=[];const n=spec.n||0;for(let i=0;i<n;i++)r.push('r'+i)}return r}
function cgCompute(ref,gid,spec,rid,vals){/* vals: {colKey: raw} → numbers for formula columns */const o={};for(const c of spec.cols){if(c.t==='n'){o[c.k]=num(vals[c.k])}}
 for(const c of spec.cols){if(c.t==='f'){o[c.k]=v4Expr(c.f,o)}}return o}
function cgHTML(ref,gid,spec){const ro=RO();const rows=cgRows(ref,gid,spec);const pre=spec.pre||[];const base=cgKey(ref,gid);
 const rowHTML=(rid,i)=>{const vals={};const cells=spec.cols.map(c=>{const k=base+'.v.'+rid+'.'+c.k;let v=G(k,null);if(v==null&&pre[i]&&pre[i][c.k]!=null&&rid==='r'+i)v=pre[i][c.k];vals[c.k]=v;return{c,k,v}});
  const calc=cgCompute(ref,gid,spec,rid,vals);
  return `<tr data-cgr="${esc(rid)}">${cells.map(({c,k,v})=>c.t==='f'?`<td class="num cgf" dir="ltr" data-cgf="${esc(c.k)}">${isNaN(calc[c.k])?'':(c.fmt==='pct'?(calc[c.k]*100).toFixed(1)+'%':fmtA(calc[c.k]))}</td>`
   :c.t==='r'?`<td class="refc"><input class="in" data-k="${esc(k)}" data-cg="${esc(c.k)}" value="${esc(v==null?'':v)}" placeholder="تعليق" aria-label="${esc(c.h)}"${ro?' readonly':''}><span class="refl" data-refk="${esc(k+'_r')}">${refChipHTML(G(k+'_r',null))}</span>${ro?'':`<button class="btn g sm noprint" type="button" data-v4act="refpick" data-rk="${esc(k+'_r')}" data-ref="${esc(ref)}" title="ربط بورقة عمل أو بمرفق" aria-label="ربط مرجع">🔗</button>`}</td>`
   :c.t==='s'?`<td><select class="st" data-k="${esc(k)}" data-cg="${esc(c.k)}" data-dv="" aria-label="${esc(c.h)}"${ro?' disabled':''}><option value="">—</option>${(c.opts||[]).map(o=>`<option${v===o?' selected':''}>${esc(o)}</option>`).join('')}</select></td>`
   :`<td><input class="in ${c.t==='n'?'num':''}" ${c.t==='n'?'inputmode="decimal" dir="ltr"':''} data-k="${esc(k)}" data-cg="${esc(c.k)}" value="${esc(v==null?'':v)}" aria-label="${esc(c.h)}"${ro?' readonly':''}></td>`).join('')}${ro||spec.fixed?'':`<td class="noprint"><button class="btn g sm" type="button" data-v4act="cgdel" data-ref="${esc(ref)}" data-gid="${esc(gid)}" data-rid="${esc(rid)}" aria-label="حذف الصف">✕</button></td>`}</tr>`};
 const body=rows.map(rowHTML).join('');
 const tots=spec.cols.map(c=>c.sum?`<td class="num" dir="ltr" data-cgt="${esc(c.k)}"><b></b></td>`:'<td></td>').join('');
 return `<div class="tw v4cg" data-v4cg="${esc(ref)}|${esc(gid)}"><table><thead><tr>${spec.cols.map(c=>`<th>${esc(c.h)}</th>`).join('')}${ro||spec.fixed?'':'<th class="noprint"></th>'}</tr></thead><tbody>${body}</tbody>${spec.cols.some(c=>c.sum)?`<tfoot><tr class="tot">${tots}${ro||spec.fixed?'':'<td></td>'}</tr></tfoot>`:''}</table></div>${ro||spec.fixed?'':`<button class="btn o sm noprint" type="button" data-v4act="cgadd" data-ref="${esc(ref)}" data-gid="${esc(gid)}">+ إضافة صف</button>`}`}
function cgRecalc(el){const host=el.closest('[data-v4cg]');if(!host)return;const [ref,gid]=host.dataset.v4cg.split('|');const spec=CGR[ref+'|'+gid];if(!spec)return;const tot={};
 host.querySelectorAll('tbody tr').forEach(tr=>{const vals={};tr.querySelectorAll('[data-cg]').forEach(i=>{vals[i.dataset.cg]=i.value});const calc=cgCompute(ref,gid,spec,'',vals);
  spec.cols.forEach(c=>{if(c.t==='f'){const td=tr.querySelector(`[data-cgf="${c.k}"]`);if(td)td.textContent=isNaN(calc[c.k])?'':(c.fmt==='pct'?(calc[c.k]*100).toFixed(1)+'%':fmtA(calc[c.k]))}if(c.sum)tot[c.k]=(tot[c.k]||0)+(isNaN(calc[c.k])?0:calc[c.k])})});
 spec.cols.forEach(c=>{if(c.sum){const t=host.querySelector(`[data-cgt="${c.k}"] b`);if(t)t.textContent=fmtA(tot[c.k]||0)}});host.dispatchEvent(new CustomEvent('cgcalc',{bubbles:true,detail:{ref,gid,tot}}))}
function cgReg(ref,gid,spec){CGR[ref+'|'+gid]=spec;return cgHTML(ref,gid,spec)}
document.addEventListener('input',e=>{const el=e.target;if(el instanceof Element&&el.dataset&&el.dataset.cg!=null)cgRecalc(el)});
document.addEventListener('change',e=>{const el=e.target;if(el instanceof Element&&el.dataset&&el.dataset.cg!=null)cgRecalc(el)});
document.addEventListener('click',e=>{const b=e.target instanceof Element&&e.target.closest('[data-v4act]');if(!b)return;const a=b.dataset.v4act;
 if(a==='cgadd'||a==='cgdel'){const {ref,gid}=b.dataset;const spec=CGR[ref+'|'+gid];if(!spec||RO())return;const k=cgKey(ref,gid)+'.rows';let rows=cgRows(ref,gid,spec).slice();
  if(a==='cgadd')rows.push('n'+Date.now().toString(36));else{rows=rows.filter(r=>r!==b.dataset.rid)}CUR.eng.set(k,rows,{label:a==='cgadd'?'إضافة صف':'حذف صف'});const blk=b.closest('[data-v4cg]');const host=blk.parentElement;blk.outerHTML=cgHTML(ref,gid,spec);const nb=host.querySelector('.btn.o[data-v4act=cgadd]');if(nb&&nb.previousElementSibling&&nb.previousElementSibling.matches('.btn.o'))nb.remove()}});

/* ---------- materiality state (single source of truth: eng.mat / eng.pm / eng.ct written by A500) ---------- */
function matState(){const om=num(G('eng.mat','')),pm=num(G('eng.pm','')),ct=num(G('eng.ct',''));return{om,pm,ct,set:om>0,bm:G('eng.bm','PBT'),bv:num(G('eng.bv','')),mp:num(G('eng.mp','5')),pmp:num(G('eng.pmp','75')),ctp:num(G('eng.ctp','5'))}}
function matSpecific(){const a=G('eng.sm',[]);return Array.isArray(a)?a:[]}
/* tolerable misstatement for a given FS line: the lowest specific materiality that covers it, else PM */
function matFor(line){const M=matState();let v=M.pm;for(const s of matSpecific()){if(s&&s.line===line&&num(s.amt)>0)v=v?Math.min(v,num(s.amt)):num(s.amt)}return v}
const MAT_BANDS={PBT:[3,7,5],REV:[.5,1,.75],GP:[1,2,1.5],EXP:[.5,2,1],TA:[.5,1,.75],EQ:[1,2,1.5]};
const MAT_NAMES={PBT:'الربح قبل الضريبة من العمليات المستمرة',REV:'إجمالي الإيرادات',GP:'مجمل الربح',EXP:'إجمالي المصروفات',TA:'إجمالي الأصول',EQ:'حقوق الملكية'};
const MAT_PMF=[['first','ارتباط لأول مرة / أرصدة افتتاحية غير مراجعة',10],['pmis','تحريفات أو أوجه قصور رقابي جوهرية في سنوات سابقة',10],['fraud','مخاطر احتيال مرتفعة أو تجاوز إدارة ملحوظ',10],['env','بيئة رقابة ضعيفة أو اعتماد كبير على أنظمة غير موثوقة',10],['pie','منشأة ذات مصلحة عامة / مدرجة / جهات رقابية متعددة',5],['gc','شك في الاستمرارية أو ضائقة مالية',10],['est','تقديرات محاسبية معقدة وأحكام جوهرية',5],['rp','معاملات أطراف ذات علاقة جوهرية أو غير اعتيادية',5]];
function matTBBench(){if(!TBSTORE.ready())return null;const calc=o=>{const T=TBSTORE.lineTotals(o);const g=ids=>ids.reduce((s,i)=>s+(T[i]||0),0);const P=A.filter(a=>a.fs==='P');
  const REV=-g(['rev']),PBT=-g(P.filter(a=>a.id!=='taxx').map(a=>a.id)),TA=g(A.filter(a=>a.fs==='A').map(a=>a.id)),EXP=g(['cos','payx','admx','profx','sellx','depx','eclx','fincost']),EQ=-g(A.filter(a=>a.fs==='E').map(a=>a.id)),GP=REV-g(['cos']);return{PBT,REV,GP,EXP,TA,EQ}};
 const cy=calc({adjusted:true});const py=TBSTORE.pyMap?calc({priorYear:true}):null;return{cy,py}}
function matHTML(ref){const M=matState();const B=matTBBench();const ro=RO();const bm=M.bm in MAT_NAMES?M.bm:(M.bm==='OTH'?'OTH':'PBT');const log=G('eng.matlog',[])||[];const flags=G('eng.pmf',{})||{};
  const bandOf=MAT_BANDS[bm]||[0,100,5];const pctWarn=M.mp&&bm!=='OTH'&&(M.mp<bandOf[0]||M.mp>bandOf[1]);const tbv=B&&bm in B.cy?Math.abs(B.cy[bm]):null;const drift=B&&M.bv&&tbv?(tbv-M.bv)/M.bv:null;
  const used=MAT_PMF.reduce((s,f)=>s+(flags[f[0]]?f[2]:0),0);const sugPM=Math.max(50,75-used);
  const tbEmpty=!!B&&Object.keys(MAT_NAMES).every(k=>!Math.abs(B.cy[k]||0));
  const nSM=matSpecific().length;
  const tbBlock=B?(tbEmpty?`<p class="note warn">الميزان محمّل لكن حساباته غير مربوطة ببنود القوائم المالية، فلا يمكن استخراج المعيار منه. <a href="${L('tb/cls')}">اربط الحسابات (التبويب)</a> أو أدخل قيمة المعيار يدويًا أدناه.</p>`
   :`<div class="tw"><table class="mtb"><thead><tr><th>المعيار</th><th>السنة الحالية</th><th>السابقة</th><th>النطاق الشائع</th><th></th></tr></thead><tbody>${Object.keys(MAT_NAMES).map(k=>{const c=B.cy[k],p=B.py?B.py[k]:null;return `<tr${k===bm?' class="sel"':''}><td>${esc(MAT_NAMES[k])}</td><td dir="ltr">${fmtN(Math.abs(c))}${c<0&&k==='PBT'?' <span class="b bad">خسارة</span>':''}</td><td dir="ltr">${p==null?'—':fmtN(Math.abs(p))}</td><td>${MAT_BANDS[k][0]}%–${MAT_BANDS[k][1]}%</td><td>${ro?'':`<button class="btn ${k===bm?'':'g'} sm" type="button" data-v4act="matpick" data-bm="${k}">${k===bm?'✓ المختار':'اختيار'}</button>`}</td></tr>`}).join('')}</tbody></table></div><p class="mut small">${esc(TBSTORE.stamp())}. عند ربحية متقلبة أو خسارة استخدم متوسط ثلاث سنوات أو معيارًا بديلًا ووثّق السبب.</p>`)
   :`<p class="mut small">لم يُرفع ميزان مراجعة — أدخل قيمة المعيار يدويًا أو <a href="${L('tb/upload')}">ارفع الميزان</a> ليُقترح تلقائيًا.</p>`;
  return `<div class="v4mat" data-v4c="mat">
  <div class="v4res"><div><span>الأهمية الكلية OM</span><b id="mOM">${M.om?fmtN(M.om):'—'}</b></div><div><span>أهمية الأداء PM</span><b id="mPM">${M.pm?fmtN(M.pm):'—'}</b></div><div><span>حد الضآلة CT</span><b id="mCT">${M.ct?fmtN(M.ct):'—'}</b></div>
   <div class="v4resn" id="mHint">${M.set?'تُعمَّم تلقائيًا على كل أوراق العمل والعينات وتقييم التحريفات.':'أدخل قيمة المعيار ونسبته فتُحتسب الأهمية فورًا.'}</div></div>
  ${drift!=null&&Math.abs(drift)>=.1?`<p class="note warn">⚠ قيمة المعيار في الميزان (${fmtN(tbv)}) تختلف ${(drift*100).toFixed(0)}% عن المستخدمة (${fmtN(M.bv)}) — أعد التقييم (ISA 320.12).${ro?'':' <button class="btn sm" type="button" data-v4act="matusetb">استخدام قيمة الميزان</button>'}</p>`:''}
  <h3>١) المعيار والنسبة</h3>${tbBlock}
  <div class="fgrid"><label>المعيار المختار<select class="sel" data-k="eng.bm" data-v4in aria-label="المعيار"${ro?' disabled':''}>${Object.keys(MAT_NAMES).concat(['OTH']).map(k=>`<option value="${k}"${k===bm?' selected':''}>${esc(MAT_NAMES[k]||'معيار آخر (متوسط 3 سنوات / مُعدَّل)')}</option>`).join('')}</select></label>
   <label>قيمة المعيار<input class="in" dir="ltr" inputmode="decimal" data-k="eng.bv" data-v4in value="${esc(G('eng.bv',''))}" placeholder="مثال: 1000000"${ro?' readonly':''}></label>
   <label>نسبة الأهمية الكلية %<input class="in" dir="ltr" inputmode="decimal" data-k="eng.mp" data-v4in value="${esc(G('eng.mp','5'))}"${ro?' readonly':''}></label></div>
  ${pctWarn?`<p class="note warn">النسبة خارج النطاق الشائع (${bandOf[0]}%–${bandOf[1]}%) — وثّق المبرر في خانة الأساس.</p>`:''}
  <h3>٢) أهمية الأداء وحد الضآلة</h3>
  <div class="fgrid"><label>PM كنسبة من OM %<input class="in" dir="ltr" inputmode="decimal" data-k="eng.pmp" data-v4in value="${esc(G('eng.pmp','75'))}"${ro?' readonly':''}></label><label>CT كنسبة من OM %<input class="in" dir="ltr" inputmode="decimal" data-k="eng.ctp" data-v4in value="${esc(G('eng.ctp','5'))}"${ro?' readonly':''}></label></div>
  <details class="wpx"><summary>عوامل الخطر التي تخفّض نسبة PM <span class="mut small">(المقترح ${sugPM}%)</span></summary>
   <div class="v4chk">${MAT_PMF.map(f=>`<label class="row"><input type="checkbox" data-v4pmf="${f[0]}"${flags[f[0]]?' checked':''}${ro?' disabled':''}> ${esc(f[1])} <span class="mut small">(−${f[2]}%)</span></label>`).join('')}</div>
   <p>النسبة المقترحة: <b>${sugPM}%</b> ${ro?'':`<button class="btn g sm" type="button" data-v4act="matsug" data-pm="${sugPM}">تطبيق</button>`}</p></details>
  <details class="wpx"${nSM?' open':''}><summary>أهمية خاصة لبنود محددة (ISA 320.10) ${nSM?`<span class="cnt">${nSM}</span>`:''}</summary>
   <p class="mut small">مبالغ أقل من OM لبنود يتوقع أن تؤثر على قرارات المستخدمين؛ تُستخدم بدل PM في ورقة البند.</p>
   ${cgReg(ref,'spm',{cols:[{k:'line',h:'بند القوائم المالية',t:'s',opts:A.map(a=>a.id+' — '+a.n)},{k:'amt',h:'المبلغ',t:'n',sum:0},{k:'why',h:'المبرر',t:'t'}],n:2})}</details>
  <h3>٣) أساس الاختيار</h3>${edc('wp.'+ref+'.t.matbasis',{label:'أساس اختيار المعيار والنسب',ph:'اشرح سبب اختيار المعيار والنسبة وعوامل الخطر…'})}
  ${log.length?`<details class="wpx"><summary>سجل التغييرات (${log.length})</summary><ul class="lkl">${log.slice().reverse().slice(0,30).map(x=>`<li>${fmtDT(x.t)} — ${esc(x.note||'')} OM=${fmtN(x.om)} PM=${fmtN(x.pm)} CT=${fmtN(x.ct)} — ${esc(USERS.nameOf(x.by))}</li>`).join('')}</ul></details>`:''}</div>`}
/* recompute and save OM/PM/CT whenever an input of the materiality sheet changes */
function matRecalc(note){if(!CUR.eng||RO())return;const bv=num(G('eng.bv','')),mp=num(G('eng.mp','5')),pmp=num(G('eng.pmp','75')),ctp=num(G('eng.ctp','5'));const om=Math.round(bv*mp/100),pm=Math.round(om*pmp/100),ct=Math.round(om*ctp/100);
 const old=matState();if(om===old.om&&pm===old.pm&&ct===old.ct)return;const o={'eng.mat':fmtN(om),'eng.pm':fmtN(pm),'eng.ct':fmtN(ct)};if(!om){o['eng.mat']='';o['eng.pm']='';o['eng.ct']=''}CUR.eng.setMany(o,{label:'احتساب الأهمية النسبية'});
 const log=(G('eng.matlog',[])||[]).slice();log.push({bm:G('eng.bm','PBT'),value:bv,om,pm,ct,ver:TBSTORE.ver,by:SESSION.id,t:Date.now(),note:note||'تعديل'});CUR.eng.set('eng.matlog',log.slice(-100),{label:'سجل الأهمية النسبية',noUndo:true});matPaint();document.dispatchEvent(new CustomEvent('meap:mat'))}
function matPaint(){const M=matState();const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v?fmtN(v):'—'};set('mOM',M.om);set('mPM',M.pm);set('mCT',M.ct);const hn=document.getElementById('mHint');if(hn)hn.textContent=M.set?'تُعمَّم تلقائيًا على كل أوراق العمل والعينات وتقييم التحريفات.':'أدخل قيمة المعيار ونسبته فتُحتسب الأهمية فورًا.';$$('[data-matchip]').forEach(c=>{const k=c.dataset.matchip;c.textContent=M[k]?fmtN(M[k]):'—'})}
document.addEventListener('input',e=>{const el=e.target;if(el instanceof Element&&el.hasAttribute&&el.hasAttribute('data-v4in')&&el.closest('[data-v4c="mat"]'))matRecalc()});
document.addEventListener('change',e=>{const el=e.target;if(!(el instanceof Element))return;if(el.hasAttribute('data-v4in')&&el.closest('[data-v4c="mat"]')){matRecalc();return}
 if(el.dataset&&el.dataset.v4pmf){const f=Object.assign({},G('eng.pmf',{})||{});f[el.dataset.v4pmf]=el.checked;CUR.eng.set('eng.pmf',f,{label:'عوامل خطر أهمية الأداء'});const used=MAT_PMF.reduce((s,x)=>s+(f[x[0]]?x[2]:0),0);const blk=el.closest('[data-v4c="mat"]');const p=blk&&blk.querySelector('[data-pm]');if(p){p.dataset.pm=Math.max(50,75-used);p.parentElement.querySelector('b').textContent=Math.max(50,75-used)+'%'}}});
document.addEventListener('click',e=>{const b=e.target instanceof Element&&e.target.closest('[data-v4act]');if(!b||RO())return;const a=b.dataset.v4act;
 if(a==='matpick'){CUR.eng.set('eng.bm',b.dataset.bm,{label:'معيار الأهمية'});const B=matTBBench();if(B){const v=Math.round(Math.abs(B.cy[b.dataset.bm]||0));if(v>0)CUR.eng.set('eng.bv',String(v),{label:'قيمة المعيار من الميزان'});else toast('لا توجد قيمة لهذا المعيار في الميزان (الحسابات غير مربوطة ببنود القوائم). أدخل القيمة يدويًا أو اربط الحسابات من «التبويب».','w',7000);const m=MAT_BANDS[b.dataset.bm];if(m)CUR.eng.set('eng.mp',String(m[2]),{label:'نسبة الأهمية'})}matRecalc('اختيار معيار '+b.dataset.bm);UI.refreshView()}
 else if(a==='matusetb'){const B=matTBBench();if(B){CUR.eng.set('eng.bv',String(Math.round(Math.abs(B.cy[G('eng.bm','PBT')]||0))),{label:'قيمة المعيار من الميزان'});matRecalc('تحديث قيمة المعيار من الميزان');UI.refreshView()}}
 else if(a==='matsug'){CUR.eng.set('eng.pmp',b.dataset.pm,{label:'نسبة أهمية الأداء'});matRecalc('تطبيق نسبة PM المقترحة');UI.refreshView()}});
/* specific materiality rows → eng.sm (kept as one array so any sheet can read it) */
document.addEventListener('cgcalc',e=>{const d=e.detail;if(d.ref!=='A500'||d.gid!=='spm')return;const rows=[];const host=e.target.closest('[data-v4cg]');if(!host)return;host.querySelectorAll('tbody tr').forEach(tr=>{const sel=tr.querySelector('select');const amt=tr.querySelector('[data-cg="amt"]');const why=tr.querySelector('[data-cg="why"]');const line=sel&&sel.value?sel.value.split(' — ')[0]:'';if(line&&amt&&num(amt.value)>0)rows.push({line,amt:num(amt.value),why:why?why.value:''})});if(JSON.stringify(rows)!==JSON.stringify(matSpecific()))CUR.eng.set('eng.sm',rows,{label:'الأهمية الخاصة',noUndo:true})});
