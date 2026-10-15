/* Audit-Plus · V4 · Trial balance layer (20_tb) */
'use strict';
/* ===== 20_tb.js ===== */
/* =====================================================================
   v4 · Trial balance: manual header row, real balances, classification (التبويب), smart suggestions
   ===================================================================== */
const v4col=i=>{let s='';i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s};
const v4num=v=>typeof v==='number'?fmtA(v):String(v==null?'':v);

/* ---------- classification model ---------- */
const CLSN={tax:null,key:new Map(),note:new Map(),sub:new Map(),cache:new Map(),line:new Map()};
const CLS_KW_ADD=[['rou',['حق الاستخدام','حق الانتفاع','اصول حق']],['ll',['التزام عقود','التزام ايجار','التزامات ايجار','عقود ايجار تمويلي','lease liabilit']],['rpr',['ذات علاقه','اطراف مرتبطه','related part']],['rpp',['ذات علاقه','اطراف مرتبطه','related part']],
 ['emp',['رواتب واجور مستحقه','مستحقات العاملين','مستحقات الموظفين','العاملين','accrued salar']],['cos',['تكلفه المواد','مواد خام مستهلكه','مواد مستهلكه','تكلفه الانتاج','اجور مباشره','مصروفات تصنيع','تكلفه البضاعه','cost of goods','cost of sales','manufacturing']],
 ['res',['احتياطي','احتياطيات','reserve']],['cap',['راس المال','رأس المال','share capital']],['ncao',['تامينات طويله','تأمينات طويلة','ودائع طويله','دفعات مقدمه طويله','لدى الغير']],['orc',['لدى الغير']]];
const stripAl=s=>s.replace(/(^| )ال(?=\S{3})/g,'$1');
function clsInit(){if(CLSN.tax)return;CLSN.tax=CLS_TAX.map(x=>Object.assign({},x,{nn:normAr(x.n),nu:normAr(x.u),ng:normAr(x.g),kwn:x.kw.map(normAr).filter(k=>k.length>=2)}));
 for(const [ln,ks] of CLS_KW_ADD)for(const x of CLSN.tax)if(x.line===ln)for(const k of ks)x.kwn.push(normAr(k));for(const x of CLSN.tax)x.kwn=[...new Set(x.kwn.map(stripAl))];
 for(const x of CLSN.tax){CLSN.key.set(x.st+'|'+x.ng+'|'+x.nu+'|'+x.nn,x);for(const [m,k] of [[CLSN.note,x.nn],[CLSN.sub,x.nu]]){if(!m.has(k))m.set(k,[]);m.get(k).push(x)}}}
const CLS_ST_NAME=Object.fromEntries(CLS_STMT.map(s=>[s[0],s[1]]));
function clsNormSt(s){const h=normAr(s||'');if(!h)return'';if(/شامل|oci|comprehensive/.test(h))return'OCI';if(/مركز|ميزانيه|sfp|balance sheet|financial position/.test(h))return'SFP';if(/حقوق|equity|soce|تغير/.test(h))return'EQ';if(/دخل|ارباح|خسائر|income|profit|p&l|^pl$|اداء/.test(h))return'PL';return''}
function clsNormGrp(st,txt){const h=normAr(txt||'');if(!h)return'';const lst=CLS_GROUP_ORDER[st]||[];const ex=lst.find(g=>normAr(g)===h);if(ex)return ex;
 if(st==='SFP'){const nc=/غير متداول|طويل|non.?current|long/.test(h),cu=/متداول|قصير|current|short/.test(h),li=/التزام|مطلوب|خصوم|liabilit/.test(h),eq=/حقوق|equity|راس/.test(h),as=/اصول|موجودات|assets/.test(h);
  if(li)return nc?'مطلوبات غير متداولة':'مطلوبات متداولة';if(eq&&!as)return'حقوق ملكية';if(as||nc||cu)return nc?'موجودات غير متداولة':'موجودات متداولة';return''}
 if(st==='PL'){if(/ضريب|tax/.test(h))return'ضريبة الدخل';if(/اخر|تمويل|other|finance/.test(h))return'إيرادات ومصروفات أخرى';if(/تكلف|cost of/.test(h))return'تكلفة المبيعات';if(/ايراد|مبيعات|revenue|sales/.test(h))return'الإيرادات';if(/تشغيل|اداري|عمومي|بيع|operating|admin|selling/.test(h))return'المصروفات التشغيلية';return''}
 if(st==='OCI'){if(/لن يعاد|not be|will not/.test(h))return lst[0];if(/قد يعاد|may be|will be/.test(h))return lst[1];return''}
 if(st==='EQ')return lst[0];return''}
const CLS_DEF_LINE={'SFP|موجودات متداولة':'orc','SFP|موجودات غير متداولة':'ncao','SFP|مطلوبات متداولة':'opay','SFP|مطلوبات غير متداولة':'oliab','SFP|حقوق ملكية':'res','PL|الإيرادات':'rev','PL|تكلفة المبيعات':'cos','PL|المصروفات التشغيلية':'admx','PL|إيرادات ومصروفات أخرى':'nonop','PL|ضريبة الدخل':'taxx','OCI|*':'oci','EQ|*':'res'};
/* resolve free text (any wording) to a canonical classification + FS line id */
function clsResolve(o){clsInit();const ck=[o.st,o.g,o.u,o.n].join('\u0001');let c=CLSN.cache.get(ck);if(c)return c;
 let st=clsNormSt(o.st);const u=String(o.u||'').trim(),n=String(o.n||'').trim(),nu=normAr(u),nn=normAr(n);let g=clsNormGrp(st||'SFP',o.g);
 let m=null;const scope=x=>(!st||x.st===st||(st==='EQ'&&x.st==='SFP'))&&(!g||x.g===g||!clsNormGrp(x.st,o.g));
 if(st&&g)m=CLSN.key.get(st+'|'+normAr(g)+'|'+nu+'|'+nn)||null;
 if(!m&&nn){const l=CLSN.note.get(nn);if(l)m=l.find(scope)||l[0]}
 if(!m&&nu){const l=CLSN.sub.get(nu);if(l)m=l.find(scope)||null}
 if(!m&&nn&&nn.length>3){m=CLSN.tax.find(x=>scope(x)&&x.nn.length>3&&(nn.includes(x.nn)||x.nn.includes(nn)))||null}
 if(!m&&nu&&nu.length>3){m=CLSN.tax.find(x=>scope(x)&&x.nu.length>3&&(nu.includes(x.nu)||x.nu.includes(nu)))||null}
 if(m){if(!st||(st==='EQ'&&m.st==='SFP'))st=m.st;if(!g||!clsNormGrp(st,o.g))g=m.g}
 if(st==='EQ'&&g&&/حقوق/.test(g)&&m)st='SFP';
 const line=m?m.line:(CLS_DEF_LINE[st+'|'+g]||CLS_DEF_LINE[st+'|*']||'');
 c={st,g:g||'',u:u||(m?m.u:''),n,line,matched:!!m,ok:!!st&&!!g};if(CLSN.cache.size>60000)CLSN.cache.clear();CLSN.cache.set(ck,c);return c}
/* effective classification of a TB account: engagement edit (tbc.*) > value imported with the TB file */
function clsOf(code){const e=CUR.eng;if(!e)return null;const v=e.get('tbc.'+tbk(code),null);
 if(v!=null){if(v==='-'||!Array.isArray(v)||!v[0])return null;return clsResolve({st:v[0],g:v[1],u:v[2],n:v[3]})}
 const r=TBSTORE.by.get(code);if(r&&r.stmt){const c=r._c||(r._c=clsResolve({st:r.stmt,g:r.cgrp,u:r.sub,n:r.note}));return c.ok?c:null}return null}
function clsLine(code){const c=clsOf(code);return c&&c.line?c.line:''}
/* FS line: engagement override > classification > company mapping */
function tbMapOf(code){const e=CUR.eng;if(e){const v=e.get('tbm.'+tbk(code),null);if(v!=null)return v==='-'?'':v;const l=clsLine(code);if(l)return l}return COMAP.map[code]||''}
let CLSV=0;
/* ---------- company-level memory of classification (carried to next year) ---------- */
let COCLS={cid:null,map:{},loading:null};
async function clsLoadCompany(){if(!CUR.company)return;if(COCLS.cid===CUR.company.id)return;if(COCLS.loading)return COCLS.loading;
 COCLS.loading=(async()=>{try{const j=JSON.parse(await STORE.readText(CUR.company._dir+'/tb-class.json')||'null');COCLS={cid:CUR.company.id,map:(j&&j.map)||{},loading:null}}catch(e){logErr('company tb-class',e,'warn');COCLS={cid:CUR.company.id,map:{},loading:null}}})();return COCLS.loading}
const clsSaveCompanyD=deb0(async()=>{if(!CUR.company||!CUR.eng||!TBSTORE.ready())return;await clsLoadCompany();const m=Object.assign({},COCLS.map);
 for(const r of TBSTORE.rows){const c=clsOf(r.code);if(c)m[r.code]=[c.st,c.g,c.u,c.n,normAr(r.name||r.nameEn).slice(0,60)]}
 COCLS.map=m;try{await withRetry(()=>STORE.writeText(CUR.company._dir+'/tb-class.json',JSON.stringify({format:'MEAP-tb-class',version:1,company:CUR.company.id,updatedAt:localISO(),count:Object.keys(m).length,map:m})))}catch(e){logErr('save company tb-class',e)}},2500);

/* ---------- smart suggestion engine ---------- */
const toks4=s=>normAr(s).split(' ').filter(t=>t.length>2);
function clsNature(x){const contra=/مجمع|مخصص|اضمحلال|خسائر ائتمان|ائتمانيه|allowance|accumulated|مردودات|خصم/.test(normAr(x.u+' '+x.n));
 if(x.st==='SFP'){if(/مطلوبات|حقوق/.test(x.g)){if(/خزينه|treasury|خسائر مرحله/.test(normAr(x.u+' '+x.n)))return 0;return -1}return contra?-1:1}
 if(x.st==='PL'){if(/^الإيرادات/.test(x.g))return contra?1:-1;if(/ومصروفات أخرى/.test(x.g)){return /ايراد|فوائد دائنه|ارباح/.test(normAr(x.u))?-1:(/مصروفات|فوائد مدينه|خسائر|تكاليف/.test(normAr(x.u))?1:0)}return 1}return 0}
const CLSL={key:'',pre:null,tok:null};
function clsLearn(){const k=TBSTORE.ver+':'+CLSV+':'+(CUR.eng&&CUR.eng.path);if(CLSL.key===k)return CLSL;CLSL.key=k;const pre=new Map(),tok=new Map();
 const bump=(m,key,ck,o)=>{let x=m.get(key);if(!x){x={};m.set(key,x)}const e=x[ck]||(x[ck]={o,n:0});e.n++};
 for(const r of TBSTORE.rows){const c=clsOf(r.code);if(!c)continue;const ck=c.st+'|'+c.g+'|'+c.u+'|'+c.n;for(let L_=2;L_<=Math.min(r.code.length-1,6);L_++)bump(pre,r.code.slice(0,L_),ck,c);for(const t of new Set(toks4(r.name+' '+r.nameEn)))bump(tok,t,ck,c)}
 CLSL.pre=pre;CLSL.tok=tok;return CLSL}
function clsSuggestOne(r){clsInit();const nm=stripAl(normAr(r.name+' '+r.nameEn));const cand=new Map();
 const add=(x,v,why)=>{const k=x.st+'|'+x.g+'|'+x.u+'|'+x.n;let c=cand.get(k);if(!c){c={x,score:0,why:[]};cand.set(k,c)}c.score+=v;if(why&&c.why.length<3&&!c.why.includes(why))c.why.push(why)};
 /* 1) previous years of the same company */
 const h=COCLS.map&&COCLS.map[r.code];if(h){const tn=toks4(r.name+' '+r.nameEn);const ht=h[4]?h[4].split(' ').filter(t=>t.length>2):[];const ov=!ht.length||!tn.length||tn.some(t=>ht.includes(t));if(ov){const c=clsResolve({st:h[0],g:h[1],u:h[2],n:h[3]});add(Object.assign({},c),12,'مبوّب في فترة سابقة للشركة')}}
 /* 2) keyword dictionary */
 const hits=[];for(const x of CLSN.tax){let s1=0,s2=0,kws=[];for(const k of x.kwn){const lat=/^[\x20-\x7E]+$/.test(k);let found=lat?(' '+nm).includes(' '+k):nm.includes(k),pen=0;if(!found&&!lat){const ts=k.split(' ');if(ts.length>1&&ts.every(t=>t.length>1&&(' '+nm).includes(' '+t))){found=true;pen=1.2}}/* same words, other order or separated (e.g. «قروض بنكية طويلة الأجل») */if(found){const v=4.5+Math.min(k.length,24)/3-pen;kws.push([v,k])}}
  if(x.nn.length>3&&nm.includes(x.nn)){kws.push([5+x.nn.length/4,x.nn])}if(!kws.length)continue;kws.sort((a,b)=>b[0]-a[0]);s1=kws[0][0];s2=kws[1]?kws[1][0]/2:0;hits.push([x,s1+s2,kws[0][1]])}
 for(const [x,s,k] of hits)add(x,s,'الكلمة الدالة «'+k+'»');
 /* contra / expense-vs-balance disambiguation */
 const isAcc=/مجمع|accumulated/.test(nm);const isExpWord=/مصروف|expense/.test(nm);
 for(const c of cand.values()){const x=c.x;if(isAcc&&x.st==='PL')c.score-=6;if(isAcc&&/مجمع/.test(normAr(x.u+' '+x.n)))c.score+=3;if(isExpWord&&x.st==='SFP'&&!/مستحق|مقدما/.test(nm))c.score-=2.5;if(!isAcc&&/مجمع/.test(normAr(x.u+' '+x.n))&&c.score<9)c.score-=2}
 /* context rules */
 const curP=/الجزء المتداول|جزء متداول|current portion|current maturit/.test(nm);const nc=!curP&&/غير متداول|طويل|non.?current|long.?term/.test(nm),cu=curP||(!nc&&/(^| )متداول|قصير|current|short.?term/.test(nm));
 for(const c of cand.values()){const x=c.x,sfp=x.st==='SFP';if(sfp&&/غير متداولة/.test(x.g)){if(nc)c.score+=3.5;if(cu)c.score-=3}else if(sfp&&/متداولة/.test(x.g)){if(nc)c.score-=3.5;if(cu)c.score+=3}
  if(x.st==='PL'&&(/مستحق|مقدما|accrued|payable|prepaid/.test(nm)||nc||cu))c.score-=4;if(/ذات علاقه|related part/.test(nm)&&(x.line==='rpr'||x.line==='rpp'))c.score+=6;if(/(^| )التزام/.test(nm)){if(x.st==='PL')c.score-=3.5;else if(sfp&&/مطلوبات/.test(x.g))c.score+=2}
  if(/(^| )تكلف/.test(nm)){if(x.g==='تكلفة المبيعات')c.score+=5;else if(sfp)c.score-=3}if(/صناع|انتاج|مصنع|industrial|factory|production/.test(nm)&&x.g==='تكلفة المبيعات')c.score+=4;
  if(/احتياطي|reserve/.test(nm)){if(x.st==='OCI'||x.st==='EQ')c.score-=6;else if(sfp&&x.g==='حقوق ملكية')c.score+=2}else if((x.st==='OCI'||x.st==='EQ')&&!/شامل|توزيعات|oci|dividend/.test(nm))c.score-=3}
 /* 3) code-prefix inheritance + similar names already classified in this engagement */
 const Ln=clsLearn();for(let L_=Math.min(r.code.length-1,6);L_>=2;L_--){const g=Ln.pre.get(r.code.slice(0,L_));if(g){const es=Object.values(g).sort((a,b)=>b.n-a.n);const tot=es.reduce((s,y)=>s+y.n,0);if(tot>=2&&es[0].n/tot>=.6){add(es[0].o,2.5+L_*.8,'نفس نطاق الكود '+r.code.slice(0,L_)+'… مبوّب')}break}}
 const votes={};for(const t of new Set(toks4(r.name+' '+r.nameEn))){const g=Ln.tok.get(t);if(!g)continue;const es=Object.entries(g);const tot=es.reduce((s,[,y])=>s+y.n,0);if(tot>40)continue;for(const [ck,y] of es){const e=votes[ck]||(votes[ck]={o:y.o,s:0});e.s+=y.n/tot}}
 for(const e of Object.values(votes)){if(e.s>=1)add(e.o,Math.min(4,e.s*2.2),'حسابات مشابهة الاسم مبوّبة')}
 /* 4) balance nature */
 if(Math.abs(r.cb)>0.005){for(const c of cand.values()){const ns=clsNature(c.x);if(!ns)continue;if((r.cb>0)===(ns>0))c.score+=.8;else c.score-=2}}
 const all=[...cand.values()].filter(c=>c.score>0).sort((a,b)=>b.score-a.score);if(!all.length)return null;const b=all[0],s2=all[1]?all[1].score:0;const x=b.x;
 const hist=b.why.includes('مبوّب في فترة سابقة للشركة');
 return{st:x.st,g:x.g,u:x.u,n:x.n,line:x.line||clsResolve({st:x.st,g:x.g,u:x.u,n:x.n}).line,score:b.score,conf:hist||(b.score>=9&&b.score-s2>=2.5)?'H':b.score>=5.5?'M':'L',why:b.why,alt:all[1]?{st:all[1].x.st,g:all[1].x.g,u:all[1].x.u,n:all[1].x.n}:null}}
const CSUG={key:'',m:new Map(),
 sync(){const k=TBSTORE.ver+':'+CLSV+':'+(CUR.eng&&CUR.eng.path)+':'+Object.keys(COCLS.map||{}).length;if(k!==this.key){this.key=k;this.m=new Map()}},
 one(code){this.sync();if(this.m.has(code))return this.m.get(code);const r=TBSTORE.by.get(code);const s=r?clsSuggestOne(r):null;this.m.set(code,s);return s},
 async each(list,fn,onp){for(let i=0;i<list.length;i++){fn(list[i],this.one(list[i].code));if(i%800===799){onp&&onp(i+1,list.length);await new Promise(r=>setTimeout(r,0))}}}};
/* the legacy FS-line suggestion (map tab) now also benefits from the classification engine */
function suggestLine(r,learned){const s=clsSuggestOne(r);if(s&&s.line)return{id:s.line,score:s.score,conf:s.conf};return null}

/* ---------- import: smarter column detection ---------- */
const V4X={grp:['بند القائمه','بند القوائم','المجموعه','المجموعه الرئيسيه','group','fs caption','caption','line item','statement item','البيان'],
 stmt:['نوع القائمه','القائمه الماليه','القائمه','statement type','statement','fs type'],
 sub:['التبويب','التصنيف الفرعي','تصنيف فرعي','التصنيف','subclass','sub class','sub classification','sub-classification','classification','category','sub'],
 note:['اسم الايضاح','الايضاح','ايضاح','note name','note','التفصيل','detail'],
 bud:['الموازنه','الموازنه التقديريه','موازنه','budget','تقديري','forecast']};
function detectMapping(headers,sample){const H=headers.map(h=>normAr(h));const X={};const used=new Set();
 const find=(f,exactOnly)=>{for(const k of V4X[f].map(normAr)){const i=H.findIndex((h,j)=>!used.has(j)&&h===k);if(i>-1)return i}if(exactOnly)return -1;for(const k of V4X[f].map(normAr)){if(k.length<4)continue;const i=H.findIndex((h,j)=>!used.has(j)&&h.includes(k)&&!/(مدين|دائن|debit|credit)/.test(h));if(i>-1)return i}return -1};
 const take=(f,i)=>{if(i>-1){X[f]=i;used.add(i)}};
 take('note',find('note'));take('sub',find('sub'));take('stmt',find('stmt',true));take('bud',find('bud'));
 const gi=find('grp');if(gi>-1&&(X.stmt!=null||X.sub!=null||X.note!=null||H[gi]!=='البيان')){if(H[gi]!=='البيان'||(X.stmt!=null&&(X.sub!=null||X.note!=null)))take('grp',gi)}
 if(X.stmt==null){const i=find('stmt');take('stmt',i)}
 const blank=headers.map((h,i)=>used.has(i)?'':h);const m=detectMapping0(blank,sample);for(const k in X)m[k]=X[k];return m}

/* rows → accounts (adds budget + classification columns, keeps all original validations) */
function buildAccounts(raw,hr,map){const out=[],issues={blank:0,totals:0,nonNum:[],noName:[],roll:[],nonNumN:0,noNameN:0,rollN:0};const val=(r,f)=>map[f]==null?null:r[map[f]];const sv=(r,f)=>{const v=val(r,f);return v==null?'':String(v).trim()};
 for(let i=hr+1;i<raw.length;i++){const r=raw[i]||[];if(!r.some(c=>c!=null&&String(c).trim()!=='')){issues.blank++;continue}
  let code=val(r,'code');code=code==null?'':(typeof code==='number'&&Number.isInteger(code)?String(code):String(code).trim().replace(/^(\d+)\.0+$/,'$1'));
  const name=sv(r,'name'),nameEn=sv(r,'nameEn');
  if(!code&&/^(الاجمالي|اجمالي|المجموع|الإجمالي|إجمالي|total|grand total|totals)/i.test(normAr(name||nameEn))){issues.totals++;continue}
  const a={row:i+1,code,name,nameEn,branch:sv(r,'branch'),stmt:sv(r,'stmt'),cgrp:sv(r,'grp'),sub:sv(r,'sub'),note:sv(r,'note')};const n={};
  for(const f of ['obDr','obCr','ob','mvDr','mvCr','cbDr','cbCr','cb','py','bud']){if(map[f]==null)continue;const x=parseNum(val(r,f));if(x!==null&&isNaN(x)){issues.nonNumN++;if(issues.nonNum.length<50)issues.nonNum.push({row:i+1,code,field:TBFL[f],value:String(val(r,f)).slice(0,30)});n[f]=0}else n[f]=x||0}
  if(!code&&!name&&!nameEn){issues.blank++;continue}
  a.ob=map.ob!=null?n.ob:(n.obDr||0)-(n.obCr||0);a.mvDr=n.mvDr||0;a.mvCr=n.mvCr||0;
  a.cb=map.cb!=null?n.cb:(map.cbDr!=null||map.cbCr!=null)?(n.cbDr||0)-(n.cbCr||0):a.ob+a.mvDr-a.mvCr;a.py=map.py!=null?n.py:null;a.bud=map.bud!=null?n.bud:null;
  if((map.cb!=null||map.cbDr!=null)&&(map.ob!=null||map.obDr!=null)&&(map.mvDr!=null||map.mvCr!=null)&&Math.abs(a.ob+a.mvDr-a.mvCr-a.cb)>0.5){issues.rollN++;if(issues.roll.length<50)issues.roll.push({row:a.row,code,diff:r2(a.ob+a.mvDr-a.mvCr-a.cb)})}
  if(!name&&!nameEn){issues.noNameN++;if(issues.noName.length<50)issues.noName.push({row:a.row,code})}
  out.push(a)}
 return{accounts:out,issues}}

/* ---------- generic header-row picker + sample values ---------- */
function v4HdrPicker(raw,hr,key){const N=Math.min(raw.length,26);let mc=1;for(let i=0;i<N;i++)mc=Math.max(mc,(raw[i]||[]).length);mc=Math.min(mc,16);
 let h='<div class="tw v4hp"><table><thead><tr><th>العناوين</th><th>صف</th>'+Array.from({length:mc},(_,j)=>`<th class="ltr">${v4col(j)}</th>`).join('')+'</tr></thead><tbody>';
 for(let i=0;i<N;i++){const r=raw[i]||[];const empty=!r.some(c=>c!=null&&String(c).trim()!=='');h+=`<tr class="${i===hr?'sel':i<hr?'dim':''}${empty?' emp':''}"><td><input type="radio" name="hr-${key}" data-w4="hr" data-key="${key}" value="${i}"${i===hr?' checked':''} aria-label="اختيار الصف ${i+1} كصف للعناوين"></td><td class="mut">${i+1}</td>`;
  for(let j=0;j<mc;j++)h+=`<td>${esc(v4num(r[j]).slice(0,28))}</td>`;h+='</tr>'}
 return h+`</tbody></table></div><label class="row small">أو اكتب رقم صف العناوين (حتى ${raw.length.toLocaleString('en-US')}): <input class="in" type="number" min="1" max="${raw.length}" style="width:6rem" data-w4="hrnum" data-key="${key}" value="${hr+1}"></label>`}
function v4Sample(raw,hr,ci){if(ci==null)return'';const o=[];for(let i=hr+1;i<raw.length&&o.length<3;i++){const v=(raw[i]||[])[ci];if(v!=null&&String(v).trim()!=='')o.push(v4num(v).slice(0,22))}return o.length?'<small class="mut v4smp" dir="auto">مثال: '+o.map(esc).join(' ، ')+'</small>':'<small class="bad v4smp">لا توجد قيم</small>'}
function v4MapFields(raw,hr,map,key,fields){const heads=(raw[hr]||[]).map((x,i)=>v4col(i)+' — '+(String(x==null?'':x).trim()||'(بدون عنوان)'));const opts=sel=>'<option value="">—</option>'+heads.map((h,i)=>`<option value="${i}"${sel===i?' selected':''}>${esc(h)}</option>`).join('');
 return fields.map(f=>`<label class="v4mf">${esc(TBFL[f[0]]||f[1])}${f[2]?' *':''}<select class="sel" data-w4="map" data-key="${key}" data-f="${f[0]}">${opts(map[f[0]])}</select>${v4Sample(raw,hr,map[f[0]])}</label>`).join('')}

/* ---------- upload wizard · step 2 (replaces the original) ---------- */
function tbUploadHTML(){return ''}
/* shared handlers for the header picker / mapping selects (wizard + classification import) */
document.addEventListener('change',e=>{const el=e.target;if(!(el instanceof Element))return;const k=el.dataset&&el.dataset.w4;if(!k)return;
 if(k==='hr'||k==='hrnum'){const key=el.dataset.key;const hr=Math.max(0,(+el.value||1)-1);
  if(key==='upl'){if(!UPL.raw)return;UPL.hr=Math.min(hr,UPL.raw.length-1);UPL.map=detectMapping((UPL.raw[UPL.hr]||[]).map(x=>String(x==null?'':x)),UPL.raw.slice(UPL.hr+1,UPL.hr+40));refreshBlock('tbu')}
  else if(key==='cimp'){if(!CIMP.raw)return;CIMP.hr=Math.min(hr,CIMP.raw.length-1);CIMP.map=cimpDetect();cimpRender()}return}
 if(k==='map'){const key=el.dataset.key,f=el.dataset.f;const M=key==='upl'?UPL.map:CIMP.map;if(el.value==='')delete M[f];else M[f]=+el.value;if(key==='upl')refreshBlock('tbu');else cimpRender();return}
});

/* ---------- classification tab ---------- */
const CLSQ={q:'',f:'unc',st:''};
function clsDatalists(){clsInit();const subs=new Map(),notes=new Map();for(const x of CLSN.tax){const a=x.st+'|'+x.g;if(!subs.has(a))subs.set(a,new Set());subs.get(a).add(x.u);const b=a+'|'+x.u;if(!notes.has(b))notes.set(b,new Set());notes.get(b).add(x.n)}
 let h='';for(const [k,s] of subs)h+=`<datalist id="dls:${esc(k)}">${[...s].map(v=>`<option value="${esc(v)}">`).join('')}</datalist>`;for(const [k,s] of notes)h+=`<datalist id="dln:${esc(k)}">${[...s].map(v=>`<option value="${esc(v)}">`).join('')}</datalist>`;return`<div hidden>${h}</div>`}
function clsGroupsOf(st){return CLS_GROUP_ORDER[st]||[]}
function clsCounts(){let c=0;for(const r of TBSTORE.rows)if(clsOf(r.code))c++;return c}
function clsHTML(){clsLoadCompany();const tot=TBSTORE.rows.length,done=clsCounts(),pct=tot?Math.round(done*100/tot):0;const un=TBSTORE.rows.filter(r=>!clsOf(r.code));const unB=un.reduce((s,r)=>s+Math.abs(r.cb),0);const ed=can('edit');
 return `<div class="card"><p>تم تبويب <b>${done.toLocaleString('en-US')}</b> من <b>${tot.toLocaleString('en-US')}</b> حساب (${pct}%) ${un.length?`· غير مبوّب: ${un.length.toLocaleString('en-US')} حساب بإجمالي أرصدة مطلقة ${fmtA(unB)}`:'<span class="b ok">اكتمل التبويب</span>'}</p>${bar(pct)}
 <p class="mut small">التبويب أربعة مستويات: نوع القائمة (مركز مالي / دخل / دخل شامل / حقوق ملكية) ← بند القائمة (مثال: موجودات متداولة) ← التصنيف الفرعي (مثال: مخزون) ← اسم الإيضاح التفصيلي (مثال: مواد خام). كل ما يُبوَّب هنا يغذّي القوائم المالية وأوراق العمل والتحليلات تلقائيًا.</p>
 ${ed?`<div class="row"><button class="btn sm" type="button" data-w4act="clsacc" data-conf="H">قبول الاقتراحات عالية الثقة (<span id="clshi">…</span>)</button><button class="btn g sm" type="button" data-w4act="clsacc" data-conf="M">قبول عالية + متوسطة (<span id="clshm">…</span>)</button><button class="btn o sm" type="button" data-w4act="clsimp">⤒ استيراد التبويب من Excel</button><button class="btn g sm" type="button" data-w4act="clstpl">⤓ نموذج / تصدير التبويب</button></div>`:''}<span class="small mut" id="clsprog" aria-live="polite"></span></div>
 <div data-block="clsimp">${cimpHTML()}</div>
 <div class="card noprint tbf"><div class="fgrid"><label>بحث<input class="in" type="search" data-w4="clsq" value="${esc(CLSQ.q)}" placeholder="كود أو اسم" autocomplete="off"></label>
 <label>عرض<select class="sel" data-w4="clsf">${[['unc','غير المبوّب'],['all','كل الحسابات'],['done','المبوّب فقط']].map(o=>`<option value="${o[0]}"${CLSQ.f===o[0]?' selected':''}>${o[1]}</option>`).join('')}</select></label>
 <label>القائمة<select class="sel" data-w4="clsst"><option value="">الكل</option>${CLS_STMT.map(s=>`<option value="${s[0]}"${CLSQ.st===s[0]?' selected':''}>${esc(s[1])}</option>`).join('')}</select></label></div></div>
 ${clsDatalists()}<div id="clsgrid" class="tbgrid"></div>`}
function clsFilter(){const nq=normAr(CLSQ.q);let it=TBSTORE.rows;if(nq)it=it.filter(r=>normAr(r.code+' '+r.name+' '+r.nameEn).includes(nq));
 if(CLSQ.f==='unc')it=it.filter(r=>!clsOf(r.code));else if(CLSQ.f==='done')it=it.filter(r=>clsOf(r.code));if(CLSQ.st)it=it.filter(r=>{const c=clsOf(r.code);return c&&c.st===CLSQ.st});return it}
function clsRowCls(r){const c=clsOf(r.code);return c||{st:'',g:'',u:'',n:''}}
function clsMount(){const host=$('#clsgrid');if(!host)return;const ed=can('edit');const items=clsFilter();
 const sel=(code,f,val,opts)=>`<select class="sel" data-w4="clsf4" data-code="${esc(code)}" data-f="${f}" aria-label="${f}"${ed?'':' disabled'}><option value="">—</option>${opts.map(o=>`<option value="${esc(o[0])}"${o[0]===val?' selected':''}>${esc(o[1])}</option>`).join('')}</select>`;
 VT.mount(host,{items,label:'تبويب الحسابات',rh:64,rhM:260,rowClass:x=>clsOf(x.code)?'':'rev',cols:[
  {k:'code',h:'الكود',w:'minmax(5rem,.6fr)',sort:false,r:x=>`<span dir="ltr">${esc(x.code)}</span>`},
  {k:'name',h:'اسم الحساب',w:'minmax(9rem,1.6fr)',sort:false,cls:'clamp2',r:x=>esc(x.name||x.nameEn)},
  {k:'cb',h:'الرصيد',num:1,w:'minmax(6.5rem,.8fr)',sort:false,r:x=>fmtA(x.cb)},
  {k:'st',h:'القائمة',w:'minmax(7rem,.8fr)',sort:false,r:x=>sel(x.code,'st',clsRowCls(x).st,CLS_STMT.map(s=>[s[0],s[1]]))},
  {k:'g',h:'بند القائمة',w:'minmax(9rem,1.1fr)',sort:false,r:x=>{const c=clsRowCls(x);return sel(x.code,'g',c.g,clsGroupsOf(c.st).map(g=>[g,g]))}},
  {k:'u',h:'التصنيف الفرعي',w:'minmax(9rem,1.1fr)',sort:false,r:x=>{const c=clsRowCls(x);return `<input class="in" data-w4="clsf4" data-code="${esc(x.code)}" data-f="u" value="${esc(c.u)}" list="dls:${esc(c.st+'|'+c.g)}" placeholder="مثال: مخزون"${ed?'':' disabled'}>`}},
  {k:'n',h:'اسم الإيضاح التفصيلي',w:'minmax(9rem,1.1fr)',sort:false,r:x=>{const c=clsRowCls(x);return `<input class="in" data-w4="clsf4" data-code="${esc(x.code)}" data-f="n" value="${esc(c.n)}" list="dln:${esc(c.st+'|'+c.g+'|'+c.u)}" placeholder="مثال: مواد خام"${ed?'':' disabled'}>`}},
  {k:'s',h:'اقتراح',w:'minmax(11rem,1.5fr)',sort:false,cls:'clamp2',r:x=>{if(clsOf(x.code))return'';const s=CSUG.one(x.code);if(!s)return'<span class="mut small">لا يوجد اقتراح</span>';return `<button class="btn g sm" type="button" data-w4act="clsone" data-code="${esc(x.code)}"${ed?'':' disabled'} title="${esc(s.why.join(' · '))}"><span class="b ${s.conf==='H'?'ok':s.conf==='M'?'M':''}">${{H:'عالية',M:'متوسطة',L:'منخفضة'}[s.conf]}</span> ${esc([s.u,s.n].filter(Boolean).join(' › ')||s.g)}</button><small class="mut">${esc(CLS_ST_NAME[s.st])} › ${esc(s.g)}${s.why[0]?' — '+esc(s.why[0]):''}</small>`}}]})}
function clsAfter(){clsMount();clsCountS()}
async function clsCountS(){await clsLoadCompany();const un=TBSTORE.rows.filter(r=>!clsOf(r.code));let h=0,m=0;const key=CSUG.key;await CSUG.each(un,(r,s)=>{if(s&&s.conf==='H')h++;if(s&&(s.conf==='H'||s.conf==='M'))m++},(i,n)=>{const p=$('#clsprog');if(p)p.textContent=`تحليل الاقتراحات ${i.toLocaleString('en-US')} / ${n.toLocaleString('en-US')}…`});
 const a=$('#clshi'),b=$('#clshm'),p=$('#clsprog');if(a)a.textContent=h.toLocaleString('en-US');if(b)b.textContent=m.toLocaleString('en-US');if(p)p.textContent=''}
function clsApply(o,label){if(!Object.keys(o).length)return;CUR.eng.setMany(o,{label});CLSV++;TBMV++;clsSaveCompanyD();saveCompanyMapD();TBSTORE.notify()}
async function clsAccept(conf){await clsLoadCompany();const un=TBSTORE.rows.filter(r=>!clsOf(r.code));const o={};let n=0;await CSUG.each(un,(r,s)=>{if(s&&(s.conf==='H'||(conf==='M'&&s.conf==='M'))){o['tbc.'+tbk(r.code)]=[s.st,s.g,s.u,s.n];n++}});
 if(!n){toast('لا توجد اقتراحات بهذا المستوى.','i');return}clsApply(o,'قبول اقتراحات التبويب');audit('tb.cls.accept',{n,conf});toast(`تم تبويب ${n.toLocaleString('en-US')} حساب.`,'s');UI.refreshView()}
function clsSetField(code,f,val){const cur=clsRowCls({code});let {st,g,u,n}=cur;
 if(f==='st'){st=val;g='';u='';n=''}else if(f==='g'){g=val;u='';n=''}else if(f==='u'){u=val.trim();n=''}else if(f==='n'){n=val.trim()}
 if(!st){CUR.eng.set('tbc.'+tbk(code),'-',{label:'إلغاء تبويب '+code})}else{if(f==='st'&&CLS_GROUP_ORDER[st]&&CLS_GROUP_ORDER[st].length===1)g=CLS_GROUP_ORDER[st][0];CUR.eng.set('tbc.'+tbk(code),[st,g,u,n],{label:'تبويب الحساب '+code})}
 CLSV++;TBMV++;clsSaveCompanyD();TBSTORE.notify()}
document.addEventListener('change',e=>{const el=e.target;if(!(el instanceof Element))return;const k=el.dataset&&el.dataset.w4;if(!k)return;
 if(k==='clsf4'){clsSetField(el.dataset.code,el.dataset.f,el.value);VT.inst&&VT.draw(true);const f=el.dataset.f;if(f==='st'||f==='g'){const nxt=document.querySelector(`[data-code="${CSS.escape(el.dataset.code)}"][data-f="${f==='st'?'g':'u'}"]`);nxt&&nxt.focus()}clsCountS();return}
 if(k==='clsf'){CLSQ.f=el.value;clsMount();return}if(k==='clsst'){CLSQ.st=el.value;clsMount();return}});
document.addEventListener('input',e=>{const el=e.target;if(el instanceof Element&&el.dataset&&el.dataset.w4==='clsq'){CLSQ.q=el.value;clsQD()}});
const clsQD=deb0(()=>clsMount(),200);
document.addEventListener('click',async e=>{const b=e.target instanceof Element&&e.target.closest('[data-w4act]');if(!b||b.disabled)return;const a=b.dataset.w4act;
 if(a==='clsacc'){await clsAccept(b.dataset.conf);return}
 if(a==='clsone'){const s=CSUG.one(b.dataset.code);if(s){CUR.eng.set('tbc.'+tbk(b.dataset.code),[s.st,s.g,s.u,s.n],{label:'قبول اقتراح تبويب '+b.dataset.code});CLSV++;TBMV++;clsSaveCompanyD();TBSTORE.notify();if(CLSQ.f==='unc')clsMount();else VT.inst&&VT.draw(true);clsCountS()}return}
 if(a==='clsimp'){cimpStart();return}
 if(a==='clstpl'){clsExport();return}
 if(a==='cimpapply'){await cimpApply();return}if(a==='cimpcancel'){Object.assign(CIMP,{step:0,raw:null,buf:null,file:null});cimpRender();return}});
function clsExport(){const rows=TBSTORE.rows.map(r=>{const c=clsOf(r.code)||{st:'',g:'',u:'',n:''};return[r.code,r.name||r.nameEn,r.cb,c.st?CLS_ST_NAME[c.st]:'',c.g,c.u,c.n]});
 const head=['كود الحساب','اسم الحساب','الرصيد الختامي','نوع القائمة','بند القائمة','التصنيف الفرعي','اسم الإيضاح'];
 const ref=[['نوع القائمة','بند القائمة','التصنيف الفرعي','اسم الإيضاح']].concat(CLS_TAX.map(x=>[CLS_ST_NAME[x.st],x.g,x.u,x.n]));
 const nm=sanitizeName('تبويب الميزان - '+CUR.company.name+' '+G('eng.year',''),80);downloadBlob(xlsxBlob([{name:'التبويب',rows:[head].concat(rows),widths:[14,40,16,16,26,26,26]},{name:'قائمة التصنيفات',rows:ref,widths:[16,30,30,30]}],{title:nm,author:SESSION.display}),nm+'.xlsx');audit('tb.cls.export',{rows:rows.length})}

/* ---------- import classification from Excel/CSV into the active TB ---------- */
const CIMP={step:0,file:null,buf:null,raw:null,hr:0,map:{},sheet:0,sheets:[],res:null,busy:false,msg:''};
const CIMPF=[['code','كود الحساب',1],['name','اسم الحساب (للمطابقة عند غياب الكود)'],['stmt','نوع القائمة'],['grp','بند القائمة'],['sub','التصنيف الفرعي'],['note','اسم الإيضاح التفصيلي']];
function cimpDetect(){const heads=(CIMP.raw[CIMP.hr]||[]).map(x=>String(x==null?'':x));const m=detectMapping(heads,CIMP.raw.slice(CIMP.hr+1,CIMP.hr+40));const o={};for(const f of CIMPF.map(x=>x[0]))if(m[f]!=null)o[f]=m[f];return o}
function cimpStart(){const i=document.createElement('input');i.type='file';i.accept='.csv,.tsv,.txt,.xlsx,.xlsm';i.onchange=async()=>{const f=i.files[0];if(!f)return;const ext=(f.name.split('.').pop()||'').toLowerCase();Object.assign(CIMP,{step:1,file:f,busy:true,raw:null,res:null,sheet:0,msg:'جارٍ القراءة…'});cimpRender();
  try{CIMP.buf=await f.arrayBuffer();if(ext.startsWith('xls')){const l=await TBW.call('parse',{buf:CIMP.buf.slice(0),listOnly:true});CIMP.sheets=l.sheets||[]}else CIMP.sheets=[];
   const r=await TBW.call('parse',{buf:CIMP.buf.slice(0),sheet:CIMP.sheet});CIMP.raw=r.rows;CIMP.hr=detectHeaderRow(CIMP.raw);CIMP.map=cimpDetect();CIMP.busy=false;CIMP.step=2;cimpRender()}
  catch(e){CIMP.busy=false;CIMP.step=0;toast('تعذرت قراءة الملف: '+errMsg(e),'e',9000);cimpRender()}};i.click()}
function cimpCompute(){const M=CIMP.map;const rows=CIMP.raw.slice(CIMP.hr+1);const byName=new Map();if(M.code==null)for(const r of TBSTORE.rows)byName.set(normAr(r.name||r.nameEn),r.code);
 const res={ok:[],miss:[],bad:[],n:0};const sv=(r,f)=>M[f]==null?'':String(r[M[f]]==null?'':r[M[f]]).trim();
 for(const r of rows){if(!r||!r.some(c=>c!=null&&String(c).trim()!==''))continue;res.n++;let code=M.code!=null?sv(r,'code').replace(/^(\d+)\.0+$/,'$1'):(byName.get(normAr(sv(r,'name')))||'');
  if(!code||!TBSTORE.by.has(code)){res.miss.push(code||sv(r,'name'));continue}
  const c=clsResolve({st:sv(r,'stmt'),g:sv(r,'grp'),u:sv(r,'sub'),n:sv(r,'note')});if(!c.ok){res.bad.push(code);continue}res.ok.push([code,c])}
 return res}
function cimpHTML(){if(!can('edit')||CIMP.step===0)return'';
 if(CIMP.step===1)return`<div class="card"><p><b>${esc(CIMP.file.name)}</b> — ${esc(CIMP.msg)}</p></div>`;
 const res=CIMP.res=cimpCompute();const hasMap=CIMP.map.code!=null||CIMP.map.name!=null;
 return `<div class="card"><h3 style="margin-top:0">استيراد التبويب — ${esc(CIMP.file.name)}</h3>
 ${CIMP.sheets.length>1?`<label>الورقة<select class="sel" data-w4="cimpsheet">${CIMP.sheets.map((s,i)=>`<option value="${i}"${CIMP.sheet===i?' selected':''}>${esc(s)}</option>`).join('')}</select></label>`:''}
 <h4>صف العناوين</h4>${v4HdrPicker(CIMP.raw,CIMP.hr,'cimp')}<h4>ربط الأعمدة</h4><div class="fgrid">${v4MapFields(CIMP.raw,CIMP.hr,CIMP.map,'cimp',CIMPF)}</div>
 <p>${hasMap?`صفوف مقروءة: <b>${res.n.toLocaleString('en-US')}</b> · سيُبوَّب: <b class="ok">${res.ok.length.toLocaleString('en-US')}</b> حساب · غير موجود في الميزان: <b>${res.miss.length}</b>${res.miss.length?' ('+esc(res.miss.slice(0,6).join('، '))+(res.miss.length>6?'…':'')+')':''} · تبويب غير مفهوم: <b>${res.bad.length}</b>${res.bad.length?' ('+esc(res.bad.slice(0,6).join('، '))+')':''}`:'اختر عمود كود الحساب.'}</p>
 ${res.ok.length?`<div class="tw"><table><thead><tr><th>الكود</th><th>القائمة</th><th>البند</th><th>التصنيف الفرعي</th><th>الإيضاح</th></tr></thead><tbody>${res.ok.slice(0,8).map(([code,c])=>`<tr><td dir="ltr">${esc(code)}</td><td>${esc(CLS_ST_NAME[c.st]||c.st)}</td><td>${esc(c.g)}</td><td>${esc(c.u)}</td><td>${esc(c.n)}</td></tr>`).join('')}</tbody></table></div>`:''}
 <div class="row"><button class="btn" type="button" data-w4act="cimpapply"${res.ok.length?'':' disabled'}>✓ تطبيق التبويب على ${res.ok.length.toLocaleString('en-US')} حساب</button><button class="btn g" type="button" data-w4act="cimpcancel">إلغاء</button></div></div>`}
function cimpRender(){$$('[data-block="clsimp"]').forEach(el=>{el.innerHTML=cimpHTML()})}
BLOCKS.clsimp=()=>cimpHTML();
document.addEventListener('change',async e=>{const el=e.target;if(el instanceof Element&&el.dataset&&el.dataset.w4==='cimpsheet'){CIMP.sheet=+el.value;CIMP.step=1;CIMP.msg='جارٍ القراءة…';cimpRender();try{const r=await TBW.call('parse',{buf:CIMP.buf.slice(0),sheet:CIMP.sheet});CIMP.raw=r.rows;CIMP.hr=detectHeaderRow(CIMP.raw);CIMP.map=cimpDetect();CIMP.step=2}catch(err){toast(errMsg(err),'e');CIMP.step=0}cimpRender()}});
async function cimpApply(){const res=CIMP.res;if(!res||!res.ok.length)return;const o={};for(const [code,c] of res.ok)o['tbc.'+tbk(code)]=[c.st,c.g,c.u,c.n];
 clsApply(o,'استيراد التبويب من '+CIMP.file.name);audit('tb.cls.import',{n:res.ok.length,file:CIMP.file.name});toast(`تم تبويب ${res.ok.length.toLocaleString('en-US')} حساب من الملف.`,'s');Object.assign(CIMP,{step:0,raw:null,buf:null,file:null});UI.refreshView()}
/* classification imported together with the TB file is also remembered for next year */
const _uplAcceptHook=()=>{try{clsSaveCompanyD()}catch(e){/* best effort */}};
document.addEventListener('click',e=>{const b=e.target instanceof Element&&e.target.closest('[data-act="uplaccept"]');if(b)setTimeout(_uplAcceptHook,4000)});
