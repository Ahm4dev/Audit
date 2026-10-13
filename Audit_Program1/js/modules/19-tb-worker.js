/* Audit-Plus · Trial-balance Web Worker (serialised via toString into a Blob) */
'use strict';
/* ================= a11w · Trial-balance worker (runs in a Blob Web Worker; no libraries) =================
   - CSV/TSV parser (, ; Tab, quotes, UTF-8 / Windows-1256 detection)
   - XLSX reader (ZIP central directory + DecompressionStream('deflate-raw') + XML scanning: sharedStrings, styles/date formats, sheets)
   - Account search index (normalised Arabic/English/code, ranked, capped) */
function TB_WORKER_MAIN(){'use strict';
 let cancel=false,IDX=[],IDXN=[];
 const post=(m,tr)=>self.postMessage(m,tr||[]);
 const prog=(id,p,msg)=>post({id,type:'progress',p,msg});
 function normAr(s){return String(s==null?'':s).normalize('NFKC').toLowerCase().replace(/[ً-ٰٟـ]/g,'').replace(/[آأإٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-0x660)).replace(/[۰-۹]/g,d=>String(d.charCodeAt(0)-0x6F0)).replace(/\s+/g,' ').trim()}
 /* ---------- text decoding ---------- */
 function decode(buf){const u=new Uint8Array(buf);let off=0;if(u[0]===0xEF&&u[1]===0xBB&&u[2]===0xBF)off=3;
  if(u[0]===0xFF&&u[1]===0xFE)return{text:new TextDecoder('utf-16le').decode(u.subarray(2)),enc:'UTF-16LE'};
  try{return{text:new TextDecoder('utf-8',{fatal:true}).decode(u.subarray(off)),enc:'UTF-8'}}catch(e){/* not valid UTF-8 → legacy Arabic code page */}
  try{return{text:new TextDecoder('windows-1256').decode(u),enc:'Windows-1256'}}catch(e){return{text:new TextDecoder('latin1').decode(u),enc:'Latin-1'}}}
 /* ---------- CSV ---------- */
 function sniff(text){const lines=text.slice(0,20000).split(/\r?\n/).slice(0,20).filter(Boolean);let best=',',bs=-1;
  for(const d of [',',';','\t','|']){const counts=lines.map(l=>{let n=0,q=false;for(const ch of l){if(ch==='"')q=!q;else if(ch===d&&!q)n++}return n});const nz=counts.filter(c=>c>0);if(!nz.length)continue;const mode=nz.sort((a,b)=>a-b)[Math.floor(nz.length/2)];const sc=nz.length*10+mode;if(sc>bs){bs=sc;best=d}}return best}
 function parseCSV(id,text,delim){const rows=[];let row=[],f='',q=false,i=0;const n=text.length;let last=0;
  for(;i<n;i++){const c=text[i];
   if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=c;continue}
   if(c==='"'&&f===''){q=true;continue}
   if(c===delim){row.push(f);f='';continue}
   if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(f);f='';rows.push(row);row=[];
    if(rows.length%5000===0){if(cancel)throw new Error('CANCELLED');if(i-last>200000){prog(id,i/n,'تحليل CSV');last=i}}continue}
   f+=c}
  if(f!==''||row.length){row.push(f);rows.push(row)}return rows}
 /* ---------- ZIP + XLSX ---------- */
 async function unzipEntries(buf){const dv=new DataView(buf);const u=new Uint8Array(buf);let eocd=-1;for(let i=u.length-22;i>=Math.max(0,u.length-70000);i--){if(dv.getUint32(i,true)===0x06054b50){eocd=i;break}}
  if(eocd<0)throw new Error('ملف XLSX غير صالح (لم يُعثر على فهرس ZIP).');const cnt=dv.getUint16(eocd+10,true),cdo=dv.getUint32(eocd+16,true);const out={};let p=cdo;
  for(let k=0;k<cnt;k++){if(dv.getUint32(p,true)!==0x02014b50)break;const meth=dv.getUint16(p+10,true),csz=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),el=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true);
   const name=new TextDecoder().decode(u.subarray(p+46,p+46+nl));out[name]={meth,csz,lo};p+=46+nl+el+cl}
  return{names:Object.keys(out),async get(name){const e=out[name];if(!e)return null;const lnl=dv.getUint16(e.lo+26,true),lel=dv.getUint16(e.lo+28,true);const st=e.lo+30+lnl+lel;const raw=u.subarray(st,st+e.csz);
   if(e.meth===0)return new TextDecoder().decode(raw);if(e.meth!==8)throw new Error('طريقة ضغط غير مدعومة في XLSX: '+e.meth);
   if(typeof DecompressionStream==='undefined')throw new Error('المتصفح لا يدعم DecompressionStream اللازم لقراءة XLSX؛ احفظ الملف بصيغة CSV.');
   const ds=new DecompressionStream('deflate-raw');const stream=new Blob([raw]).stream().pipeThrough(ds);return await new Response(stream).text()}}}
 const unx=s=>s.replace(/&(lt|gt|amp|quot|apos|#\d+|#x[0-9a-fA-F]+);/g,(m,e)=>e==='lt'?'<':e==='gt'?'>':e==='amp'?'&':e==='quot'?'"':e==="apos"?"'":e[1]==='x'?String.fromCodePoint(parseInt(e.slice(2),16)):String.fromCodePoint(parseInt(e.slice(1),10)));
 function colIdx(ref){let n=0;for(const ch of ref){const c=ch.charCodeAt(0);if(c<65||c>90)break;n=n*26+(c-64)}return n-1}
 const DATEFMT=new Set([14,15,16,17,18,19,20,21,22,27,30,36,45,46,47,50,57]);
 async function xlsxSheets(buf){const z=await unzipEntries(buf);const wb=await z.get('xl/workbook.xml');if(!wb)throw new Error('ملف XLSX لا يحتوي workbook.xml.');
  const rels=await z.get('xl/_rels/workbook.xml.rels')||'';const rmap={};for(const m of rels.matchAll(/<Relationship\b[^>]*>/g)){const id=/Id="([^"]+)"/.exec(m[0]),tg=/Target="([^"]+)"/.exec(m[0]);if(id&&tg)rmap[id[1]]=tg[1].replace(/^\/?xl\//,'').replace(/^\//,'')}
  const sheets=[];for(const m of wb.matchAll(/<sheet\b[^>]*>/g)){const nm=/name="([^"]*)"/.exec(m[0]),rid=/r:id="([^"]+)"/.exec(m[0])||/\bid="([^"]+)"/.exec(m[0]);sheets.push({name:unx(nm?nm[1]:'Sheet'),path:'xl/'+(rid&&rmap[rid[1]]||('worksheets/sheet'+(sheets.length+1)+'.xml'))})}
  const date1904=/date1904="(1|true)"/.test(wb);return{z,sheets,date1904}}
 async function xlsxRead(id,buf,sheetIdx){const {z,sheets,date1904}=await xlsxSheets(buf);const sh=sheets[sheetIdx||0];if(!sh)throw new Error('الورقة غير موجودة.');prog(id,.05,'قراءة الجداول المشتركة');
  const sst=[];const ssx=await z.get('xl/sharedStrings.xml');if(ssx)for(const m of ssx.matchAll(/<si>([\s\S]*?)<\/si>/g)){let s='';for(const t of m[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g))s+=t[1];sst.push(unx(s))}
  const styles=await z.get('xl/styles.xml')||'';const custom={};for(const m of styles.matchAll(/<numFmt\b[^>]*numFmtId="(\d+)"[^>]*formatCode="([^"]*)"/g))custom[m[1]]=unx(m[2]);
  const xfDate=[];const cx=/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(styles);if(cx)for(const m of cx[1].matchAll(/<xf\b[^>]*>/g)){const f=+(/numFmtId="(\d+)"/.exec(m[0])||[0,0])[1];const code=custom[f]||'';xfDate.push(DATEFMT.has(f)||(/[dmy]/i.test(code.replace(/\[[^\]]*\]|"[^"]*"/g,''))&&!/[#0]/.test(code)))}
  prog(id,.15,'فك ضغط الورقة');const xml=await z.get(sh.path);if(xml==null)throw new Error('تعذر قراءة الورقة '+sh.name);
  const rows=[];const FM=[];const n=xml.length;let k=0;const rowRe=/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g;let m;
  while((m=rowRe.exec(xml))){const rn=+(/\br="(\d+)"/.exec(m[0].slice(0,80))||[0,rows.length+1])[1];const r=[];const body=m[1]||'';
   for(const c of body.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)){const at=c[1];const ref=/r="([A-Z]+)\d+"/.exec(at);const ci=ref?colIdx(ref[1]):r.length;const t=(/\bt="(\w+)"/.exec(at)||[])[1];const s=+(/\bs="(\d+)"/.exec(at)||[0,0])[1];const inner=c[2]||'';
    let v=null;if(t==='inlineStr'){let s2='';for(const x of inner.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g))s2+=x[1];v=unx(s2)}else{const vv=/<v>([\s\S]*?)<\/v>/.exec(inner);if(vv&&!(vv[1]===''&&inner.indexOf('<f')>-1)){const raw=unx(vv[1]);if(t==='s')v=sst[+raw]??'';else if(t==='str'||t==='e')v=raw;else if(t==='b')v=raw==='1';else{const num=+raw;if(isFinite(num)&&xfDate[s]){const d=new Date(Math.round((num-(date1904?-1462:0)-25569)*864e5));v=isNaN(d)?num:d.toISOString().slice(0,10)}else v=isFinite(num)?num:raw}}}
    if(v==null&&inner.indexOf('<f')>-1){const fx=/<f\b([^>]*?)(?:\/>|>([\s\S]*?)<\/f>)/.exec(inner);if(fx)FM.push([rn-1,ci,fx[1],fx[2]==null?'':unx(fx[2])])}r[ci]=v}
   while(rows.length<rn-1)rows.push([]);for(let i=0;i<r.length;i++)if(r[i]===undefined)r[i]=null;rows.push(r);
   if(++k%4000===0){if(cancel)throw new Error('CANCELLED');prog(id,.15+.8*(rowRe.lastIndex/n),'تحليل الصفوف '+k.toLocaleString('en-US'))}}
  let fcalc=0;if(FM.length){try{fcalc=evalFormulas(rows,FM,sh.name)}catch(e){fcalc=-1}}
  return{rows,sheet:sh.name,sheets:sheets.map(s=>s.name),fcalc,fcount:FM.length}}

 /* ---------- formula fallback: files saved by tools that do not store cached results (openpyxl, pandas, exports) ---------- */
 function colName(n){let s='';n++;while(n>0){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26)}return s}
 function shiftRefs(f,dr,dc){return f.replace(/("[^"]*")|(?<![A-Za-z0-9_.!'])(\$?)([A-Z]{1,3})(\$?)(\d+)(?![\d(A-Za-z_])/g,(m,q,ca,cl,ra,rw)=>{if(q)return q;const c=ca?cl:colName(colIdx(cl)+dc);const r=ra?rw:String(Math.max(1,+rw+dr));return ca+c+ra+r})}
 function evalFormulas(rows,FM,sheetName){const SH=new Map();let ok=0;const cache=new Map(),busy=new Set();const F=new Map();
  for(const [r,c,at,tx] of FM){const t=(/\bt="(\w+)"/.exec(at)||[])[1];const si=(/\bsi="(\d+)"/.exec(at)||[])[1];let text=tx;
   if(t==='shared'&&si!=null){if(tx){SH.set(si,[r,c,tx])}else{const m=SH.get(si);if(m)text=shiftRefs(m[2],r-m[0],c-m[1]);else text=''}}
   if(text)F.set(r+':'+c,text)}
  const cellRaw=(r,c)=>{const v=(rows[r]||[])[c];if(v!=null)return v;const k=r+':'+c;if(!F.has(k))return null;if(cache.has(k))return cache.get(k);if(busy.has(k))return null;busy.add(k);let x=null;try{x=run(F.get(k))}catch(e){x=null}busy.delete(k);cache.set(k,x);return x};
  const num=v=>{if(v==null||v==='')return 0;if(typeof v==='number')return v;if(typeof v==='boolean')return v?1:0;const n=parseFloat(String(v).replace(/,/g,''));return isFinite(n)?n:NaN};
  const flat=a=>{const o=[];for(const x of a){if(x&&x.rng){for(let r=x.r1;r<=x.r2;r++)for(let c=x.c1;c<=x.c2;c++)o.push({v:cellRaw(r,c),rng:1})}else o.push({v:x,rng:0})}return o};
  const nums=a=>{const o=[];for(const e of flat(a)){const v=e.v;if(typeof v==='number')o.push(v);else if(!e.rng&&v!=null&&v!==''){const n=num(v);if(!isNaN(n))o.push(n)}}return o};
  const sc=v=>v&&v.rng?cellRaw(v.r1,v.c1):v;
  const FN={SUM:a=>nums(a).reduce((s,x)=>s+x,0),AVERAGE:a=>{const n=nums(a);return n.length?n.reduce((s,x)=>s+x,0)/n.length:NaN},MIN:a=>{const n=nums(a);return n.length?Math.min(...n):0},MAX:a=>{const n=nums(a);return n.length?Math.max(...n):0},COUNT:a=>nums(a).length,COUNTA:a=>flat(a).filter(e=>e.v!=null&&e.v!=='').length,
   ABS:a=>Math.abs(num(sc(a[0]))),ROUND:a=>{const p=Math.pow(10,num(sc(a[1])||0));const x=num(sc(a[0]));return Math.sign(x)*Math.round(Math.abs(x)*p+1e-9)/p},ROUNDUP:a=>{const p=Math.pow(10,num(sc(a[1])||0));const x=num(sc(a[0]));return Math.sign(x)*Math.ceil(Math.abs(x)*p-1e-9)/p},ROUNDDOWN:a=>{const p=Math.pow(10,num(sc(a[1])||0));const x=num(sc(a[0]));return Math.sign(x)*Math.floor(Math.abs(x)*p+1e-9)/p},
   VALUE:a=>num(sc(a[0])),N:a=>num(sc(a[0])),NOT:a=>!truthy(sc(a[0])),TRIM:a=>String(sc(a[0])==null?'':sc(a[0])).trim(),UPPER:a=>String(sc(a[0])||'').toUpperCase(),LOWER:a=>String(sc(a[0])||'').toLowerCase(),LEN:a=>String(sc(a[0])==null?'':sc(a[0])).length,
   CONCATENATE:a=>flat(a).map(e=>e.v==null?'':e.v).join(''),CONCAT:a=>flat(a).map(e=>e.v==null?'':e.v).join(''),TEXT:a=>String(sc(a[0])),SIGN:a=>Math.sign(num(sc(a[0]))),NEG:a=>-num(sc(a[0])),ISBLANK:a=>sc(a[0])==null||sc(a[0])==='',ISNUMBER:a=>typeof sc(a[0])==='number',PRODUCT:a=>nums(a).reduce((s,x)=>s*x,1)};
  const truthy=v=>typeof v==='string'?v!==''&&v.toUpperCase()!=='FALSE':!!v;
  function run(src){const T=[];const re=/\s*(?:("(?:[^"]|"")*")|((?:'[^']+'|[A-Za-z0-9_]+)!)?(\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?)(?![A-Za-z0-9_(])|(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+)|([A-Za-z_][A-Za-z0-9_.]*)(?=\()|(TRUE|FALSE)|(<>|<=|>=|[-+*\/^&=<>(),%:]))/gy;let m;re.lastIndex=0;
   while(re.lastIndex<src.length){const p=re.lastIndex;m=re.exec(src);if(!m){if(/^\s*$/.test(src.slice(p)))break;throw new Error('tok')}
    if(m[1]!=null)T.push(['s',m[1].slice(1,-1).replace(/""/g,'"')]);else if(m[3]!=null){const sh=m[2]?m[2].slice(0,-1).replace(/^'|'$/g,''):'';T.push(['r',m[3].replace(/\$/g,''),sh])}else if(m[4]!=null)T.push(['n',parseFloat(m[4])]);else if(m[5]!=null)T.push(['f',m[5].toUpperCase()]);else if(m[6]!=null)T.push(['b',m[6]==='TRUE']);else T.push(['o',m[7]])}
   let i=0;const pk=()=>T[i],nx=()=>T[i++];const isO=o=>T[i]&&T[i][0]==='o'&&T[i][1]===o;
   const arg=v=>{if(v&&v.rng)return cellRaw(v.r1,v.c1);return v};
   function ref(t){if(t[2]&&t[2]!==sheetName)throw new Error('xsheet');const pt=t[1].split(':');const pr=s=>{const mm=/^([A-Z]+)(\d+)$/.exec(s);return[+mm[2]-1,colIdx(mm[1])]};const a=pr(pt[0]);if(pt.length===1)return{rng:1,r1:a[0],c1:a[1],r2:a[0],c2:a[1],single:1};const b=pr(pt[1]);return{rng:1,r1:Math.min(a[0],b[0]),c1:Math.min(a[1],b[1]),r2:Math.max(a[0],b[0]),c2:Math.max(a[1],b[1])}}
   function prim(){const t=nx();if(!t)throw new Error('eof');if(t[0]==='n')return t[1];if(t[0]==='s')return t[1];if(t[0]==='b')return t[1];if(t[0]==='r')return ref(t);
    if(t[0]==='f'){if(!isO('('))throw new Error('fn');nx();const args=[];const lazy=t[1]==='IF'||t[1]==='IFERROR';
     if(!isO(')')){for(;;){if(lazy){const s0=i;let d=0;while(T[i]&&!(d===0&&T[i][0]==='o'&&(T[i][1]===','||T[i][1]===')'))){if(T[i][0]==='o'&&T[i][1]==='(')d++;if(T[i][0]==='o'&&T[i][1]===')')d--;i++}args.push([s0,i])}else args.push(expr());if(isO(',')){nx();continue}break}}
     if(!isO(')'))throw new Error('paren');nx();
     if(lazy){const ev=([s0,e0])=>{const sv=i;const st=T.slice();const sub=T.slice(s0,e0);const save=T.splice(0,T.length,...sub);const si=i;i=0;let r;try{r=expr()}finally{T.splice(0,T.length,...save);i=si}return r};const L=a=>ev(a);
      if(t[1]==='IF'){const c=arg(L(args[0]));return truthy(c)?(args[1]?arg(L(args[1])):true):(args[2]?arg(L(args[2])):false)}
      try{const v=arg(L(args[0]));if(typeof v==='number'&&!isFinite(v))return arg(L(args[1]));return v}catch(e){return arg(L(args[1]))}}
     if(t[1]==='AND')return flat(args).every(e=>truthy(e.v));if(t[1]==='OR')return flat(args).some(e=>truthy(e.v));
     const f=FN[t[1]];if(!f)throw new Error('nofn '+t[1]);return f(args)}
    if(t[0]==='o'&&t[1]==='('){const v=expr();if(!isO(')'))throw new Error('paren');nx();return v}
    throw new Error('prim')}
   function un(){if(isO('-')){nx();const v=num(arg(un()));return -v}if(isO('+')){nx();return un()}let v=prim();while(isO('%')){nx();v=num(arg(v))/100}return v}
   function pw(){let v=un();while(isO('^')){nx();v=Math.pow(num(arg(v)),num(arg(un())))}return v}
   function mul(){let v=pw();while(isO('*')||isO('/')){const o=nx()[1];const b=num(arg(pw()));const a=num(arg(v));v=o==='*'?a*b:(b===0?NaN:a/b)}return v}
   function add(){let v=mul();while(isO('+')||isO('-')){const o=nx()[1];const b=num(arg(mul()));const a=num(arg(v));v=o==='+'?a+b:a-b}return v}
   function cat(){let v=add();while(isO('&')){nx();const b=arg(add());v=String(arg(v)==null?'':arg(v))+String(b==null?'':b)}return v}
   function expr(){let v=cat();while(T[i]&&T[i][0]==='o'&&['=','<>','<','>','<=','>='].includes(T[i][1])){const o=nx()[1];const b=arg(cat());const a=arg(v);const A_=typeof a==='number'||typeof b==='number'?num(a):a,B_=typeof a==='number'||typeof b==='number'?num(b):b;v=o==='='?A_==B_:o==='<>'?A_!=B_:o==='<'?A_<B_:o==='>'?A_>B_:o==='<='?A_<=B_:A_>=B_}return v}
   const out=expr();if(i<T.length)throw new Error('trail');const res=arg(out);return typeof res==='number'&&!isFinite(res)?null:res}
  for(const k of F.keys()){const [r,c]=k.split(':').map(Number);if((rows[r]||[])[c]!=null)continue;const v=cellRaw(r,c);if(v!=null){while(rows.length<=r)rows.push([]);const row=rows[r];while(row.length<=c)row.push(null);row[c]=v;ok++}}
  return ok}
 /* ---------- search index ---------- */
 function buildIndex(items){IDX=items;IDXN=items.map(x=>({c:normAr(x.code),n:normAr(x.name),e:normAr(x.nameEn||'')}))}
 function search(q,limit){const nq=normAr(q);if(!nq)return{total:IDX.length,items:IDX.slice(0,limit).map(x=>x.code)};const parts=nq.split(' ');const hits=[];
  for(let i=0;i<IDXN.length;i++){const x=IDXN[i];let sc=99;
   if(x.c===nq)sc=0;else if(x.c.startsWith(nq))sc=1;else if(x.n===nq||x.e===nq)sc=2;else if(x.n.startsWith(nq)||x.e.startsWith(nq))sc=3;
   else if(parts.every(p=>(' '+x.n+' '+x.e+' ').includes(' '+p)))sc=4;else if(parts.every(p=>x.n.includes(p)||x.e.includes(p)||x.c.includes(p)))sc=5;
   if(sc<99)hits.push([sc,x.c.length,i])}
  hits.sort((a,b)=>a[0]-b[0]||a[1]-b[1]||(IDX[a[2]].code<IDX[b[2]].code?-1:1));return{total:hits.length,items:hits.slice(0,limit).map(h=>IDX[h[2]].code)}}
 self.onmessage=async e=>{const d=e.data||{};const id=d.id;
  try{if(d.type==='cancel'){cancel=true;return}
   if(d.type==='parse'){cancel=false;const u=new Uint8Array(d.buf);const isZip=u[0]===0x50&&u[1]===0x4B;
    if(isZip){if(d.listOnly){const s=await xlsxSheets(d.buf);post({id,type:'done',kind:'xlsx',sheets:s.sheets.map(x=>x.name)});return}
     const r=await xlsxRead(id,d.buf,d.sheet||0);post({id,type:'done',kind:'xlsx',rows:r.rows,sheet:r.sheet,sheets:r.sheets,enc:'XLSX',fcalc:r.fcalc,fcount:r.fcount});return}
    prog(id,.02,'اكتشاف الترميز');const {text,enc}=decode(d.buf);const delim=d.delim||sniff(text);const rows=parseCSV(id,text,delim);post({id,type:'done',kind:'csv',rows,enc,delim:delim==='\t'?'TAB':delim});return}
   if(d.type==='index'){buildIndex(d.items);post({id,type:'done',n:IDX.length});return}
   if(d.type==='search'){post({id,type:'done',r:search(d.q,d.limit||50)});return}}
  catch(err){post({id,type:'error',message:err&&err.message==='CANCELLED'?'CANCELLED':String(err&&err.message||err)})}}}
