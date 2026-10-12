/* Audit-Plus · v8 · PBC IO — تصدير/استيراد/خطابات/طباعة/قوالب/ترحيل السنة */
'use strict';
const pbCoName=()=>(CUR.company&&CUR.company.name)||'';
const pbFileBase=(w)=>sanitizeName(w+' - '+pbCoName()+' '+G('eng.year',''),90);
const pbCatName=id=>{const c=pbAll().cats.find(x=>x.id===id);return c?c.ar:id};
function pbRowCells(r){const att=pbAttIdx()[r.id]||0;return[r.id,pbCatName(r.cat),r.sub,r.t,r.ref,PB_PRL[r.pr],PB_PHL[r.ph],r.ow,r.rq,r.dueEff,PB_STL[r.st],r.rcv,r.nt,r.cm,r.lk.join(' '),att,r.appRaw&&r.st!=='na'?'نعم':'لا']}
function pbExportRows(rows){return [PB_COLS].concat(rows.map(pbRowCells))}
/* ---------- Excel ---------- */
function pbExportXlsx(){const D=pbAll();const S=pbStatsAll();const p=pbProfile();
 const app=D.rows.filter(r=>r.appRaw&&r.st!=='na'||r.app);
 const sum=[['الفئة','الإجمالي','مستلم/مفحوص','مفتوح','متأخر','نسبة الإنجاز %']].concat(D.cats.map(c=>{const s=pbStats(c.rows);return s.tot?[c.ar,s.tot,s.done,s.open,s.od,s.pct]:null}).filter(Boolean)).concat([['الإجمالي',S.tot,S.done,S.open,S.od,S.pct]]);
 const open=[['الرقم','الفئة','البند','الأولوية','المسؤول','الاستحقاق','الحالة','ملاحظة']].concat(D.rows.filter(r=>r.open).sort((a,b)=>(b.od?1:0)-(a.od?1:0)||(a.dueEff||'9')<(b.dueEff||'9')?-1:1).map(r=>[r.id,pbCatName(r.cat),r.t,PB_PRL[r.pr],r.ow,r.dueEff,PB_STL[r.st],r.nt]));
 const na=[['الرقم','الفئة','البند','سبب عدم الانطباق']].concat(D.rows.filter(r=>!r.app).map(r=>[r.id,pbCatName(r.cat),r.t,r.why||'غير منطبق']));
 const prof=[['البند','القيمة'],['العميل',pbCoName()],['السنة المالية',G('eng.year','')],['تاريخ القوائم',G('eng.period','')],['الإطار المحاسبي',G('eng.fw','')],
  ['الشكل القانوني',p.legal.map(l=>(PB_LEGAL.find(x=>x[0]===l)||[0,l])[1]).join('، ')],['القطاعات',p.sectors.map(s=>(PB_SECTORS.find(x=>x[0]===s)||[0,s])[1]).join('، ')],
  ['جهة الاتصال',[p.contact.name,p.contact.title,p.contact.email,p.contact.phone].filter(Boolean).join(' · ')],...PB_PHASE.map(([k,l])=>['موعد: '+l,p.due[k]||'']),['تاريخ التصدير',pbToday()]];
 const sheets=[{name:'قائمة المتطلبات',rows:pbExportRows(app),widths:[9,26,22,70,20,10,22,20,12,12,16,12,40,30,16,9,8]},{name:'ملخص الفئات',rows:sum,widths:[44,10,14,10,10,14]},{name:'المفتوحة والمتأخرة',rows:open,widths:[9,26,70,10,20,12,16,40]},{name:'غير المنطبقة',rows:na,widths:[9,26,70,34]},{name:'ملف العميل',rows:prof,widths:[22,70],header:true}];
 downloadBlob(xlsxBlob(sheets,{title:'PBC',author:SESSION&&SESSION.display}),pbFileBase('متطلبات العميل PBC')+'.xlsx');audit('export.pbc',{fmt:'xlsx'});toast('تم تصدير ملف Excel.','s')}
function pbCsvCell(v){const s=String(v==null?'':v);return /[",\n\r;]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function pbExportCsv(){const rows=pbExportRows(pbAll().rows.filter(r=>r.app));const txt='﻿'+rows.map(r=>r.map(pbCsvCell).join(',')).join('\r\n');downloadBlob(new Blob([txt],{type:'text/csv;charset=utf-8'}),pbFileBase('متطلبات العميل PBC')+'.csv');audit('export.pbc',{fmt:'csv'});toast('تم تصدير CSV.','s')}
/* ---------- JSON (نسخة كاملة / قالب) ---------- */
function pbDump(store){const o={format:'MEAP-pbc',version:1,exportedAt:localISO(),company:store===CUR.eng?pbCoName():'',year:store.get('eng.year',''),profile:store.get('pbx._prof',null),customs:store.get('pbx._cus',[]),ccats:store.get('pbx._ccat',[]),owners:store.get('pbx._own',[]),log:store.get('pbx._log',[]),flags:{},items:{}};
 try{APP_FLAGS.forEach(f=>{const v=store.get('eng.app.'+f[0],'');if(v)o.flags[f[0]]=v})}catch(e){}
 for(const [k,v] of store.entries('pbx.')){const x=/^pbx\.([^.]+)\.([a-z]+)$/.exec(k);if(!x||x[1][0]==='_'||x[2]==='att')continue;(o.items[x[1]]||(o.items[x[1]]={}))[x[2]]=v}
 return o}
function pbExportJson(){downloadBlob(new Blob([JSON.stringify(pbDump(CUR.eng),null,1)],{type:'application/json'}),pbFileBase('متطلبات العميل PBC')+'.json');audit('export.pbc',{fmt:'json'});toast('تم تصدير JSON.','s')}
/* القالب: بدون الحالات والتواريخ الفعلية والمرفقات */
const PB_TPLDROP=['st','rq','rcv','nt','cm'];
function pbTemplate(store){const d=pbDump(store);d.format='MEAP-pbc-template';delete d.log;const it={};for(const id in d.items){const o={};for(const f in d.items[id])if(!PB_TPLDROP.includes(f))o[f]=d.items[id][f];if(Object.keys(o).length)it[id]=o}d.items=it;return d}
function pbTplExport(){downloadBlob(new Blob([JSON.stringify(pbTemplate(CUR.eng),null,1)],{type:'application/json'}),pbFileBase('قالب متطلبات العميل')+'.json');toast('تم تصدير قالب العميل.','s')}
const pbTplPath=()=>CO&&CUR.company&&CUR.company._dir?CUR.company._dir+'/pbc-template.json':null;
async function pbTplSave(){const p=pbTplPath();if(!p){toast('تعذر تحديد مجلد العميل.','e');return}
 await STORE.writeText(p,JSON.stringify(pbTemplate(CUR.eng),null,1));pbLogAdd('tpl','حفظ قالب متطلبات العميل');toast('تم حفظ قالب العميل (يُستخدم للسنوات القادمة).','s')}
async function pbTplLoad(){const p=pbTplPath();const txt=p?await STORE.readText(p):null;if(!txt){toast('لا يوجد قالب محفوظ لهذا العميل بعد.','w');return}
 await pbApplyTemplate(JSON.parse(txt),'قالب العميل المحفوظ')}
async function pbPrevYear(){const c=CUR.company;const engs=(await CO.engs(c)).filter(e=>String(e.year)!==String(G('eng.year','')));if(!engs.length){toast('لا توجد سنوات سابقة لهذا العميل.','w');return}
 const res=await formDlg({title:'استيراد قائمة من سنة سابقة',html:`<label class="fl">السنة<select class="sel" name="y">${engs.map(e=>`<option>${esc(e.year)}</option>`).join('')}</select></label><p class="mut small">يُنقل ملف العميل والبنود المخصصة وتعديلات النص والمسؤولون والأولويات (بدون حالات الاستلام والمرفقات).</p>`,ok:'استيراد',onOk:async d=>d});if(!res)return;
 const s=new EngStore(c._dir+'/'+sanitizeName(res.y,20),{companyId:c.id,year:res.y});await s.load();await pbApplyTemplate(pbTemplate(s),'سنة '+res.y)}
async function pbApplyTemplate(t,label){if(!t||!/^Audit-Plus-pbc/.test(t.format||'')){toast('الملف ليس قالب متطلبات صالحًا.','e');return}
 const n=Object.keys(t.items||{}).length;if(!(await ask({title:'تطبيق القالب',body:`سيُطبَّق «${esc(label)}» على هذا الارتباط: ملف العميل، ${(t.customs||[]).length} بندًا مخصصًا، وتعديلات ${n} بندًا. الحالات الحالية لا تُمس. متابعة؟`,ok:'تطبيق'})))return;
 const o={};if(t.profile){const pr=Object.assign({},t.profile);if(pr.due)pr.due=pbShiftDates(pr.due,t.year,G('eng.year',''));delete pr.start;delete pr.report;o['pbx._prof']=pr}
 if((t.customs||[]).length){const cur=pbCustoms().slice();const have=new Set(cur.map(x=>x.id));t.customs.forEach(x=>{if(!have.has(x.id))cur.push(x)});o['pbx._cus']=cur}
 if((t.ccats||[]).length){const cur=pbCustomCats().slice();const have=new Set(cur.map(x=>x.id));t.ccats.forEach(x=>{if(!have.has(x.id))cur.push(x)});o['pbx._ccat']=cur}
 if((t.owners||[]).length){const cur=pbOwners().slice();const have=new Set(cur.map(x=>x.name));t.owners.forEach(x=>{if(!have.has(x.name))cur.push(x)});o['pbx._own']=cur}
 for(const id in (t.items||{}))for(const f in t.items[id]){let v=t.items[id][f];if(f==='due')v=pbShiftYear(v,t.year,G('eng.year',''));o[pbK(id,f)]=v}
 for(const f in (t.flags||{}))if(!G('eng.app.'+f,''))o['eng.app.'+f]=t.flags[f];
 CUR.eng.setMany(o,{label:'تطبيق قالب PBC'});pbLogAdd('tpl','تطبيق '+label,n);toast('طُبِّق القالب.','s');route(true)}
function pbShiftYear(d,fromY,toY){if(!d||!/^\d{4}-/.test(d))return d;const a=parseInt(fromY),b=parseInt(toY);if(!a||!b||a===b)return d;return String(+d.slice(0,4)+(b-a))+d.slice(4)}
function pbShiftDates(obj,fromY,toY){const o={};for(const k in obj)o[k]=pbShiftYear(obj[k],fromY,toY);return o}
/* ترحيل القائمة عند استنساخ ارتباط لسنة جديدة (يُستدعى من cloneDlg) */
function pbRollSeed(src,toYear){const t=pbTemplate(src);const seed={};const fromY=src.get('eng.year','');
 if(t.profile){const pr=Object.assign({},t.profile);if(pr.due)pr.due=pbShiftDates(pr.due,fromY,toYear);delete pr.start;delete pr.report;seed['pbx._prof']=pr}
 if(t.customs.length)seed['pbx._cus']=t.customs;if(t.ccats.length)seed['pbx._ccat']=t.ccats;if(t.owners.length)seed['pbx._own']=t.owners;
 for(const id in t.items)for(const f in t.items[id]){let v=t.items[id][f];if(f==='due')v=pbShiftYear(v,fromY,toYear);seed[pbK(id,f)]=v}
 /* الأعلام المشتركة eng.app.* تُنسخ أصلًا مع الارتباط عبر خيار الإعدادات إن وُجد؛ نضمنها هنا */
 for(const f in t.flags)seed['eng.app.'+f]=t.flags[f];
 return seed}
/* ---------- الاستيراد ---------- */
const PB_STSYN={'مستلم':'rc','تم':'rc','تم التسليم':'rc','تم الاستلام':'rc','received':'rc','done':'rc','rc':'rc','مطلوب':'rq','تم الطلب':'rq','requested':'rq','rq':'rq','جزئي':'pt','استلام جزئي':'pt','تم الاستلام جزئيا':'pt','partial':'pt','pt':'pt','لم يطلب':'nr','لم يتم':'nr','لم يُطلب':'nr','not requested':'nr','nr':'nr','تم الفحص':'ok','مفحوص':'ok','مراجع':'ok','reviewed':'ok','ok':'ok','لا يوجد':'nv','لا يوجد لدى العميل':'nv','غير متوفر':'nv','nv':'nv','لا ينطبق':'na','n/a':'na','na':'na'};
const pbNormSt=v=>{const s=normAr(String(v||'')).replace(/\s+/g,' ').trim();if(!s)return'';for(const k in PB_STSYN)if(normAr(k)===s)return PB_STSYN[k];return''};
const pbNormPr=v=>{const s=normAr(String(v||''));return /عال|high|^h$/.test(s)?'H':/متوسط|medium|^m$/.test(s)?'M':/منخفض|low|^l$/.test(s)?'L':''};
const pbNormPh=v=>{const s=String(v||'').trim();for(const [k,l] of PB_PHASE)if(normAr(l)===normAr(s)||s===k)return k;return''};
function pbNormDate(v){if(v==null||v==='')return'';if(typeof v==='number'&&v>20000&&v<80000){const d=new Date(Math.round((v-25569)*864e5));return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0')}
 let s=String(v).trim().replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-0x660));let m=/^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);if(m)return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');
 m=/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/.exec(s);if(m)return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');return''}
async function pbImportFile(file){try{const name=file.name.toLowerCase();
 if(name.endsWith('.json')){const t=JSON.parse(await file.text());if(/^Audit-Plus-pbc/.test(t.format||'')){await pbApplyTemplate(t,'ملف '+file.name);return}throw new Error('ملف JSON غير معروف.')}
 const buf=await file.arrayBuffer();toast('جارٍ قراءة الملف…','i');const r=await TBW.call('parse',{buf},null,[buf]);const rows=r.rows||[];
 /* صف العناوين: يحتوي «البند» و«الحالة» أو «الرقم» */
 let hr=-1;for(let i=0;i<Math.min(rows.length,15);i++){const j=(rows[i]||[]).map(c=>normAr(c));if(j.some(c=>c==='البند'||c.includes('البند'))&&(j.some(c=>c.includes('الحاله'))||j.some(c=>c==='الرقم'))){hr=i;break}}
 if(hr<0)throw new Error('تعذر العثور على صف العناوين (يلزم عمودا «البند» و«الحالة» أو «الرقم»). استخدم ملف التصدير من هذه الصفحة.');
 const H=(rows[hr]||[]).map(c=>normAr(c));const col=(...ks)=>{for(const k of ks){const i=H.findIndex(h=>h===normAr(k)||h.includes(normAr(k)));if(i>-1)return i}return -1};
 const C={id:col('الرقم'),cat:col('الفئة'),sub:col('المجموعة الفرعية'),t:col('البند'),ref:col('المرجع'),pr:col('الأولوية'),ph:col('المرحلة'),ow:col('المسؤول'),rq:col('تاريخ الطلب'),due:col('تاريخ الاستحقاق','الاستحقاق'),st:col('الحالة'),rcv:col('تاريخ الاستلام'),nt:col('ملاحظة','ملاحظات'),cm:col('تعليق المراجع')};
 await pbImportRows(rows.slice(hr+1),C,file.name)}catch(e){logErr('pb import',e);toast(errMsg(e),'e',8000)}}
async function pbImportRows(rows,C,fname){const D=pbAll();const get=(r,k)=>C[k]>-1?r[C[k]]:undefined;const str=v=>v==null?'':String(v).trim();
 const upd=[],neu=[],skip=[];const o={};const catByName={};D.cats.forEach(c=>{catByName[normAr(c.ar)]=c.id});
 const cus=pbCustoms().slice();let newN=0;
 for(const r of rows){if(!r||!r.some(x=>x!=null&&String(x).trim()!==''))continue;const id=str(get(r,'id'));const text=str(get(r,'t'));const row=id&&D.idx[id];
  if(row){const ch={};const set=(f,v)=>{if(v!==undefined&&v!==''&&String(v)!==String(row[f]||''))ch[f]=v};
   const st=pbNormSt(get(r,'st'));if(st&&st!==row.st)ch.st=st;
   set('ow',str(get(r,'ow')));const due=pbNormDate(get(r,'due'));if(due&&due!==row.dueEff)ch.due=due;const rq=pbNormDate(get(r,'rq'));if(rq&&rq!==row.rq)ch.rq=rq;const rc=pbNormDate(get(r,'rcv'));if(rc&&rc!==row.rcv)ch.rcv=rc;
   const nt=str(get(r,'nt'));if(nt&&nt!==row.nt)ch.nt=nt;const cm=str(get(r,'cm'));if(cm&&cm!==row.cm)ch.cm=cm;const pr=pbNormPr(get(r,'pr'));if(pr&&pr!==row.pr)ch.pr=pr;const ph=pbNormPh(get(r,'ph'));if(ph&&ph!==row.ph)ch.ph=ph;
   if(text&&normAr(text)!==normAr(row.t))ch.t=text;
   if(Object.keys(ch).length){upd.push([id,ch])}else skip.push(id)}
  else if(text){const cname=normAr(str(get(r,'cat')));const cat=catByName[cname]||'_oth';const nid='u'+Date.now().toString(36)+pbRand()+(newN++);
   neu.push({id:nid,cat,sub:str(get(r,'sub')),t:text,ref:str(get(r,'ref')),pr:pbNormPr(get(r,'pr'))||'M',ph:pbNormPh(get(r,'ph'))||'P',_r:r})}
  else skip.push('?')}
 if(!upd.length&&!neu.length){toast('لا تغييرات في الملف مقارنة بالحالة الحالية.','i');return}
 const stN=upd.filter(u=>u[1].st).length;
 const ok=await ask({title:'معاينة الاستيراد',body:`<ul class="l"><li>بنود سيُحدَّث بعضها: <b>${upd.length}</b> (منها تغيّرت حالتها: ${stN})</li><li>بنود جديدة ستضاف كمخصصة: <b>${neu.length}</b></li><li>بنود بلا تغيير: ${skip.length}</li></ul>${neu.length&&!D.cats.some(c=>c.id==='_oth')?'<p class="mut small">البنود الجديدة بلا فئة معروفة ستُضاف إلى فئة «بنود أخرى».</p>':''}`,ok:'تطبيق الاستيراد'});if(!ok)return;
 for(const [id,ch] of upd){
  if(ch.st){Object.assign(o,pbStatusPatch(id,ch.st,{rq:ch.rq,rcv:ch.rcv}))}
  for(const f of ['ow','due','rq','rcv','nt','cm','pr','ph','t'])if(ch[f]!==undefined)o[pbK(id,f)]=ch[f]}
 for(const n of neu){cus.push({id:n.id,cat:n.cat,sub:n.sub,t:n.t,ref:n.ref,pr:n.pr,ph:n.ph});const r=n._r;const st=pbNormSt(get(r,'st'));
  if(st)Object.assign(o,pbStatusPatch(n.id,st,{}));const ow=str(get(r,'ow'));if(ow)o[pbK(n.id,'ow')]=ow;const du=pbNormDate(get(r,'due'));if(du)o[pbK(n.id,'due')]=du;const nt=str(get(r,'nt'));if(nt)o[pbK(n.id,'nt')]=nt}
 if(neu.length)o['pbx._cus']=cus;
 CUR.eng.setMany(o,{label:'استيراد PBC'});pbLogAdd('import','استيراد من «'+fname+'»: تحديث '+upd.length+' وإضافة '+neu.length,upd.length+neu.length);toast(`تم الاستيراد: ${upd.length} تحديث، ${neu.length} جديد.`,'s');route(true)}
/* ---------- الخطابات (Word) ---------- */
function pbFirm(){try{return firmProfile()}catch(e){return{name:'',partner:'',addr:''}}}
function pbLetterBlocks(kind,owner,idSet){const D=pbAll();const p=pbProfile();const firm=pbFirm();const today=pbToday();
 let rows=D.rows.filter(r=>kind==='initial'?r.app&&['nr','rq','pt'].includes(r.st):r.open);
 if(owner&&owner!=='*')rows=rows.filter(r=>r.ow===owner);
 if(idSet)rows=rows.filter(r=>idSet.has(r.id));
 const to=owner&&owner!=='*'?(pbOwners().find(o=>o.name===owner)||{name:owner}):null;
 const B=[{t:'title',text:kind==='initial'?'طلب مستندات ومعلومات لازمة لمراجعة القوائم المالية':'تذكير بالمستندات والمعلومات المطلوبة لمراجعة القوائم المالية'}];
 B.push({t:'p',text:`التاريخ: ${today}`});
 B.push({t:'p',text:`السادة / ${pbCoName()}${to?' — عناية: '+to.name+(to.role?' ('+to.role+')':''):(p.contact.name?' — عناية: '+p.contact.name+(p.contact.title?' ('+p.contact.title+')':''):'')}`});
 B.push({t:'p',text:'تحية طيبة وبعد،'});
 B.push({t:'p',text:kind==='initial'?`في إطار مراجعة القوائم المالية للسنة المنتهية في ${G('eng.period','')||G('eng.year','')}، نرجو التكرم بتزويدنا بالمستندات والبيانات والإيضاحات الواردة بالجداول أدناه في المواعيد المحددة أمام كل مرحلة، وبالصيغة الأنسب (Excel/PDF أو أصل المستند حسب طبيعته)، مع إفادتنا كتابةً بأي بند لا ينطبق على المنشأة أو لا يتوافر لديها حتى نتمكن من تحديد الإجراءات البديلة.`:`نشير إلى طلباتنا السابقة بخصوص مراجعة القوائم المالية للسنة المنتهية في ${G('eng.period','')||G('eng.year','')}، ونرجو التكرم باستكمال البنود التالية التي لم تصلنا بعد أو وصلت جزئيًا، علمًا بأن تأخر استلامها قد يؤثر على الجدول الزمني لإصدار التقرير.`});
 if(kind==='initial'&&PB_PHASE.some(([k])=>p.due[k]))B.push({t:'p',text:'المواعيد المتفق عليها: '+PB_PHASE.filter(([k])=>p.due[k]).map(([k,l])=>l+' ← '+p.due[k]).join(' · ')});
 const cats={};rows.forEach(r=>{(cats[r.cat]||(cats[r.cat]=[])).push(r)});let n=0;
 for(const c of D.cats){const rs=cats[c.id];if(!rs)continue;B.push({t:'h2',text:c.ar});
  B.push({t:'table',rows:[['م','المتطلب','الأولوية','الاستحقاق','الحالة']].concat(rs.map(r=>[String(++n),r.t+(r.ref?' ['+r.ref+']':''),PB_PRL[r.pr],r.dueEff||'—',PB_STL[r.st]+(r.od?' (متأخر)':'')]))})}
 if(!rows.length)B.push({t:'p',text:'لا توجد بنود مفتوحة ضمن هذا النطاق.'});
 B.push({t:'p',text:'وتفضلوا بقبول فائق الاحترام والتقدير،'});B.push({t:'p',text:[firm.name,firm.partner].filter(Boolean).join(' — ')||'مراقب الحسابات'});
 return{blocks:B,n:rows.length,rows}}
async function pbLetter(kind,owner){const r=pbLetterBlocks(kind,owner);if(!r.n){toast('لا توجد بنود ضمن هذا النطاق لإدراجها في الخطاب.','w');return}
 const nm=pbFileBase((kind==='initial'?'خطاب طلب مستندات':'خطاب تذكير')+(owner&&owner!=='*'?' - '+owner:''));
 downloadBlob(docxBlob(r.blocks,{title:nm,author:SESSION&&SESSION.display,header:`${pbFirm().name||''} · ${pbCoName()} · ${G('eng.year','')}`,footer:'متطلبات المراجعة'}),nm+'.docx');
 if(!RO())pbLogAdd('letter',(kind==='initial'?'إصدار خطاب طلب':'إصدار خطاب تذكير')+(owner&&owner!=='*'?' إلى '+owner:'')+' ('+r.n+' بندًا)',r.n);toast('تم إنشاء الخطاب (Word).','s')}
async function pbIssue(){const el=document.getElementById('pbphsel');const ph=el?el.value:'*';const D=pbAll();
 const rows=D.rows.filter(r=>r.app&&r.st==='nr'&&(ph==='*'||r.ph===ph));
 if(!rows.length){toast('لا توجد بنود غير مطلوبة في هذه المرحلة.','i');return}
 if(!(await ask({title:'إصدار الطلب',body:`سيُعلَّم <b>${rows.length}</b> بندًا «تم الطلب» بتاريخ اليوم، وينزَّل خطاب الطلب. متابعة؟`,ok:'إصدار'})))return;
 const o={};rows.forEach(r=>Object.assign(o,pbStatusPatch(r.id,'rq')));CUR.eng.setMany(o,{label:'إصدار طلب PBC'});
 const B=pbLetterBlocks('initial','',new Set(rows.map(r=>r.id))).blocks;const nm=pbFileBase('خطاب طلب مستندات - '+(ph==='*'?'كل المراحل':PB_PHL[ph]));
 downloadBlob(docxBlob(B,{title:nm,author:SESSION&&SESSION.display,header:`${pbFirm().name||''} · ${pbCoName()} · ${G('eng.year','')}`,footer:'متطلبات المراجعة'}),nm+'.docx');
 pbLogAdd('issue','إصدار الطلب الأولي — '+(ph==='*'?'كل المراحل':PB_PHL[ph])+' ('+rows.length+' بندًا)',rows.length);refreshBlock('pbx|follow');pbRefreshChrome();toast('تم إصدار الطلب وتعليم البنود.','s')}
/* ---------- طباعة ---------- */
function pbPrint(mode){const D=pbAll();const rows=D.rows.filter(r=>mode==='open'?r.open:r.app);const firm=pbFirm();
 let h=`<div class="pbp-h"><h1>قائمة المتطلبات من العميل ${mode==='open'?'— النواقص والمفتوح':''}</h1><div class="pbp-m"><b>${esc(pbCoName())}</b> · السنة المالية ${esc(G('eng.year',''))} · تاريخ القوائم <span dir="ltr">${esc(G('eng.period',''))}</span> · ${esc(firm.name||'')} · طُبعت في <span dir="ltr">${pbToday()}</span></div></div>`;
 for(const c of D.cats){const rs=rows.filter(r=>r.cat===c.id);if(!rs.length)continue;const s=pbStats(c.rows);
  h+=`<h2>${esc(c.ar)} <small>(${s.res}/${s.tot})</small></h2><table class="pbp-t"><thead><tr><th style="width:2rem">م</th><th>المتطلب</th><th style="width:5rem">الأولوية</th><th style="width:6rem">المسؤول</th><th style="width:5.5rem">الاستحقاق</th><th style="width:5.5rem">الحالة</th><th style="width:2.2rem">☐</th></tr></thead><tbody>${rs.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.t)}${r.ref?` <small>[${esc(r.ref)}]</small>`:''}${r.nt?`<div class="pbp-n">${esc(r.nt)}</div>`:''}</td><td>${esc(PB_PRL[r.pr])}</td><td>${esc(r.ow)}</td><td dir="ltr">${esc(r.dueEff)}</td><td>${esc(PB_STL[r.st])}</td><td>${r.done?'☑':'☐'}</td></tr>`).join('')}</tbody></table>`}
 let host=document.getElementById('pbprint');if(!host){host=document.createElement('div');host.id='pbprint';document.body.appendChild(host)}
 host.innerHTML=h;document.body.classList.add('pb-printing');const done=()=>{document.body.classList.remove('pb-printing');host.innerHTML='';window.removeEventListener('afterprint',done)};
 window.addEventListener('afterprint',done);setTimeout(()=>{window.print();setTimeout(()=>{if(document.body.classList.contains('pb-printing'))done()},1500)},50)}
/* ---------- تجسيد قراءة للبشر: pbc/requests.json ---------- */
function pbSnapshot(store){const d=pbDump(store);d.format='MEAP-pbc';return d}
