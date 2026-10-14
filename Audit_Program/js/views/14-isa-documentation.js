/* MEAP · Views: ISA & documentation */
'use strict';
/* ===== ISA & documentation ===== */
V.isa=function(){return `<h1>فهرس معايير المراجعة الدولية (ISA Index)</h1><p class="sub">ISA ← Requirement ← Audit Area ← Procedures ← Working Papers.</p><div class="tw"><table><thead><tr><th>ISA</th><th>موضوع المعيار</th><th>أين يستخدم؟</th><th>الإجراءات الرئيسية</th><th>إجراءات</th><th>أوراق العمل</th></tr></thead><tbody>${ISA.map(s=>{const wps=W.filter(w=>split(w[4]).indexOf(s[0])>-1).map(w=>w[0]);const np=PROCS.filter(p=>p.isa.indexOf(s[0])>-1).length;return `<tr><td><a href="${L('isa/'+s[0])}"><b>ISA ${s[0]}</b></a></td><td><b>${esc(s[2])}</b><br><span class="mut">${esc(s[1])}</span></td><td class="sm">${esc(s[3])}</td><td class="sm">${esc(s[4])}</td><td>${np}</td><td>${wpL(wps.slice(0,10).join(' '))}${wps.length>10?` <a href="${L('isa/'+s[0])}">+${wps.length-10}</a>`:''}</td></tr>`}).join('')}</tbody></table></div>`};
V.isa1=function(n){const s=ISA.find(x=>x[0]===n);if(!s)return nf();const wps=W.filter(w=>split(w[4]).indexOf(n)>-1).map(w=>w[0]);const pp=PROCS.filter(p=>p.isa.indexOf(n)>-1);const phs=PH.filter(p=>split(p.isa).indexOf(n)>-1);
 return `<p class="noprint"><a href="${L('isa')}">← فهرس ISA</a></p><h1>ISA ${n} — ${esc(s[2])}</h1><p class="sub">${esc(s[1])}</p><div class="card kv"><div>المتطلب والاستخدام</div><div>${esc(s[3])}</div><div>الإجراءات الرئيسية</div><div>${esc(s[4])}</div><div>المراحل المرتبطة</div><div>${phs.map(p=>`<a class="b as" href="${L('ph/'+p.id)}">${esc(p.n)}</a>`).join(' ')}</div></div>
 ${sec('is-w','أوراق العمل المرتبطة',`<p>${wpL(wps.join(' '))}</p>`,wps.length)}${sec('is-p','الإجراءات المرتبطة',procTable(pp.slice(0,pgLimit('isa',300)),{src:1})+pgMore('isa',pp.length,300),pp.length)}`};
V.docs=function(){return `<h1>متطلبات توثيق المراجعة (ISA 230)</h1><p class="sub">التوثيق يمكّن مراجعًا خبيرًا لا علاقة له بالارتباط من فهم طبيعة وتوقيت ومدى الإجراءات ونتائجها والأدلة والأحكام.</p>
 <div class="tw"><table><thead><tr><th>المتطلب</th><th>الوصف والتطبيق العملي</th></tr></thead><tbody>${DOCR.map(d=>`<tr><td><b>${esc(d[0])}</b><br><span class="mut">${esc(d[1])}</span></td><td class="tx">${esc(d[2])}</td></tr>`).join('')}</tbody></table></div>
 <h2>علامات المراجعة القياسية (Tick Marks)</h2><div class="tw"><table><thead><tr><th>العلامة</th><th>المعنى</th></tr></thead><tbody>${TICK.map(x=>`<tr><td style="font-size:1.1rem;text-align:center">${esc(x[0])}</td><td>${esc(x[1])}</td></tr>`).join('')}</tbody></table></div>
 <h2>نظام ترميز أوراق العمل</h2><div class="tw"><table><thead><tr><th>القسم</th><th>المحتوى</th><th>النماذج</th></tr></thead><tbody>${Object.keys(WSEC).map(k=>`<tr><td class="ref">${k}</td><td>${esc(WSEC[k])}</td><td>${W.filter(w=>w[0].split('-')[0]===k).length}</td></tr>`).join('')}</tbody></table></div>
 <h2>هيكل مجلد الحفظ</h2><div class="card"><pre style="white-space:pre-wrap;margin:0;font-size:.82rem" dir="ltr">MEAP-Data/
├─ _settings.json
├─ _users/users.json
└─ companies/
   └─ &lt;company-no&gt;__&lt;company-name&gt;/
      ├─ company.json
      └─ &lt;fiscal-year&gt;/
         ├─ engagement.json
         ├─ findings/  adjustments/  review-notes/
         ├─ working-papers/&lt;ref&gt;__&lt;name&gt;/ data.json · links.json · attachments/
         ├─ _ops/   (per-user operation logs)
         ├─ _audit/ (archived history)
         └─ _presence/</pre></div>`};
/* unknown id inside a known view (old bookmark, removed item, mistyped link): explain, offer search + the closest valid areas — never a dead end */
function nf(){const v=CUR.view||'',a=CUR.arg||'';const home=CUR.base?L('dash'):'#/';
 const lib={isa1:'isa',ph:'program',cyc:'cycles',cx1:'cx',ind1:'ind',acc:'fs'}[v]||(CUR.base?'wplib':'');
 return `<div class="card"><h1>العنصر المطلوب غير متاح</h1><p class="note warn">لم يُعثر على «${esc(String(a))}» ${VLABEL&&VLABEL[v]?'ضمن «'+esc(VLABEL[v])+'»':''}. قد يكون الرابط قديمًا أو أن العنصر أُعيدت تسميته أو استُبعد من البرنامج.</p>
 <p class="row" style="gap:6px;flex-wrap:wrap">${CUR.base&&a?`<a class="btn sm" href="${L('search/'+encodeURIComponent(a))}">بحث عن «${esc(String(a))}»</a>`:''}${lib?`<a class="btn o sm" href="${L(lib)}">فتح الفهرس</a>`:''}<a class="btn o sm" href="${home}">العودة إلى الرئيسية</a></p></div>`}

/* H: risk heat map (area × level, with significant/fraud counts), progress by cycle, overdue papers */
function dashHeat(){const areas=[['A','الأصول',r=>r.src==='acc'&&AC[r.acc]&&AC[r.acc].fs==='A'],['L','الالتزامات',r=>r.src==='acc'&&AC[r.acc]&&AC[r.acc].fs==='L'],['E','حقوق الملكية',r=>r.src==='acc'&&AC[r.acc]&&AC[r.acc].fs==='E'],['P','الأرباح والخسائر',r=>r.src==='acc'&&AC[r.acc]&&['P','O'].includes(AC[r.acc].fs)]].concat(C.map(c=>[c.id,c.n,r=>r.src==='cyc'&&r.sid===c.id])).concat([['cx','المجالات المعقدة',r=>r.src==='cx'],['itc','تقنية المعلومات',r=>r.src==='itc'],['grp','المجموعة',r=>r.src==='grp']]);
 const rows=areas.map(a=>{const L_=RISKS.filter(a[2]);return{a,c:['H','M','L'].map(l=>L_.filter(r=>r.lv===l).length),sig:L_.filter(r=>r.sig).length,fr:L_.filter(r=>r.fr).length}}).filter(r=>r.c.some(Boolean));const mx=Math.max(1,...rows.flatMap(r=>r.c));
 const cell=(n,l)=>`<td class="hm hm-${l}" style="--a:${(n/mx).toFixed(2)}" aria-label="${n}"><b>${n||''}</b></td>`;
 const cyc=C.map(c=>[c.n,prog(PROCS.filter(p=>p.cy===c.id).map(p=>p.id))]);const td=today();const od=Object.keys(WP).map(r=>[r,G('wp.'+r+'.due','')]).filter(x=>x[1]&&x[1]<td&&!apFinal({t:'wp',id:x[0]}));
 return `<div class="card"><h3 style="margin-top:0">خريطة حرارية للمخاطر</h3><div class="tw"><table class="heat"><thead><tr><th>المجال</th><th>مرتفع</th><th>متوسط</th><th>منخفض</th><th>جوهرية</th><th>احتيال</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.a[1])}</td>${cell(r.c[0],'H')}${cell(r.c[1],'M')}${cell(r.c[2],'L')}<td>${r.sig||''}</td><td>${r.fr||''}</td></tr>`).join('')}</tbody></table></div><p class="mut small"><a href="${L('risks')}">مكتبة المخاطر</a> · شدة اللون تتناسب مع العدد.</p></div>
 <div class="grid g2"><div class="card"><h3 style="margin-top:0">الإنجاز حسب الدورة</h3>${cyc.map(r=>`<div class="prow"><span>${esc(r[0])}</span>${bar(r[1].p)}<span class="mut">${r[1].p}%</span></div>`).join('')}</div>
 <div class="card"><h3 style="margin-top:0">أوراق متأخرة عن موعدها <span class="cnt">${od.length}</span></h3>${od.length?`<ul class="lkl">${od.map(x=>`<li>${wpL(x[0])} ${esc(WP[x[0]].ar)} — <span class="b bad">${esc(x[1])}</span>${G('wp.'+x[0]+'.as','')?' · '+esc(USERS.nameOf(G('wp.'+x[0]+'.as',''))):''}</li>`).join('')}</ul>`:'<p class="mut small">لا توجد أوراق متأخرة. حدّد تاريخ الاستحقاق من مربع «مسار الاعتماد» في الورقة.</p>'}</div></div>`}
