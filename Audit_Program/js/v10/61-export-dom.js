/* Audit-Plus · v10 · DOM → Excel converter: exports a rendered worksheet exactly as it appears (content + formatting) */
'use strict';
/* =====================================================================================================
   The page is rendered in a hidden 1200px-wide iframe (so media queries behave like a desktop and the
   on-screen theme/tab/collapse state does not matter), every visible block becomes a "unit" with a pixel
   rectangle, the rectangles are snapped to a shared column/row grid, and each unit is written as one
   (merged) Excel cell with its font, colours, borders, alignment and wrapping.
   ===================================================================================================== */
const XD=(()=>{
 const BLOCKISH=new Set(['block','flex','grid','table','list-item','flow-root','table-row','table-cell','table-row-group','table-header-group','table-footer-group','table-caption','-webkit-box']);
 const SKIP='script,style,template,noscript,svg,canvas,img,video,audio,iframe,hr,button,datalist,option,optgroup,.noprint,[hidden],nav,.print-head,.skip,input[type=hidden],input[type=file],input[type=button],input[type=submit],input[type=reset],.btn,.navfab,[role=tooltip],[aria-hidden=true]:not(.xlhost)';
 const gcs=el=>el.ownerDocument.defaultView.getComputedStyle(el);
 const isCtl=el=>{const t=el.tagName;if(t==='INPUT'||t==='SELECT'||t==='TEXTAREA')return true;const ce=el.getAttribute&&el.getAttribute('contenteditable');return !!ce&&ce!=='false'};
 const skip=el=>{try{return el.matches(SKIP)}catch(e){return false}};
 const hidden=cs=>cs.display==='none'||cs.visibility==='hidden'||cs.visibility==='collapse';
 function ctlText(el){const t=el.tagName;if(t==='SELECT'){const o=el.selectedOptions&&el.selectedOptions[0];return o?String(o.textContent||'').trim():''}
  if(t==='TEXTAREA')return el.value||'';
  if(t==='INPUT'){const ty=(el.type||'text').toLowerCase();if(ty==='checkbox'||ty==='radio')return el.checked?'☑':'☐';return el.value||''}
  return el.innerText!=null&&el.innerText!==''?el.innerText:(el.textContent||'')}
 /* ---------- colours ---------- */
 const _cc=new Map();let _cx=null;
 function rgba(css){if(!css)return null;if(_cc.has(css))return _cc.get(css);let r=null;const m=/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(css);
  if(m){let a=m[4]==null?1:(String(m[4]).endsWith('%')?parseFloat(m[4])/100:parseFloat(m[4]));r=[+m[1],+m[2],+m[3],a]}
  else if(css==='transparent')r=[0,0,0,0];
  else{try{if(!_cx){const c=document.createElement('canvas');c.width=c.height=1;_cx=c.getContext('2d',{willReadFrequently:true})}_cx.clearRect(0,0,1,1);_cx.fillStyle='#000';_cx.fillStyle=css;_cx.fillRect(0,0,1,1);const d=_cx.getImageData(0,0,1,1).data;r=[d[0],d[1],d[2],d[3]/255]}catch(e){r=null}}
  _cc.set(css,r);return r}
 const hex=(r,g,b)=>[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('').toUpperCase();
 function blend(c){if(!c||c[3]<0.06)return null;const a=Math.min(1,c[3]);return hex(c[0]*a+255*(1-a),c[1]*a+255*(1-a),c[2]*a+255*(1-a))}
 const nearWhite=h=>h&&parseInt(h.slice(0,2),16)>=0xF9&&parseInt(h.slice(2,4),16)>=0xF9&&parseInt(h.slice(4,6),16)>=0xF9;
 function bgOf(el,stop){for(let n=el;n&&n.nodeType===1;n=n.parentElement){const h=blend(rgba(gcs(n).backgroundColor));if(h)return nearWhite(h)?null:h;if(n===stop)break}return null}
 /* ---------- number detection ---------- */
 function asNumber(t){const s=String(t).replace(/[٠-٩]/g,d=>d.charCodeAt(0)-0x660).replace(/[۰-۹]/g,d=>d.charCodeAt(0)-0x6F0).replace(/٫/g,'.').replace(/[٬،]/g,',').replace(/ /g,' ').trim();
  const m=/^(\()?\s*(-)?\s*(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?\s*(\))?$/.exec(s);if(!m)return null;if(!!m[1]!==!!m[5])return null;const ip=m[3].replace(/,/g,'');if(/^0\d/.test(ip)||ip.length>15)return null;
  let v=parseFloat(ip+(m[4]||''));if(m[2]||m[1])v=-v;const dec=m[4]?m[4].length-1:0;return{v,dec,comma:m[3].indexOf(',')>=0}}
 function borderOf(cs,side){const w=parseFloat(cs['border'+side+'Width'])||0,st=cs['border'+side+'Style'];if(w<=0||st==='none'||st==='hidden')return null;const c=rgba(cs['border'+side+'Color']);if(c&&c[3]<0.25)return null;
  return{s:st==='dashed'?'dashed':st==='dotted'?'dotted':st==='double'?'double':w>=3?'thick':w>=1.6?'medium':'thin',c:c?hex(c[0],c[1],c[2]):'9AA7A3'}}
 function bordersOf(cs){const b={t:borderOf(cs,'Top'),r:borderOf(cs,'Right'),b:borderOf(cs,'Bottom'),l:borderOf(cs,'Left')};return(b.t||b.r||b.b||b.l)?b:null}
 const hasAr=s=>/[؀-ۿ]/.test(s),hasLat=s=>/[A-Za-z]/.test(s);
 function alignOf(cs){let a=cs.textAlign;const rtl=cs.direction==='rtl';if(a==='start'||a==='justify'||a==='-webkit-auto'||a==='auto')a=rtl?'right':'left';else if(a==='end')a=rtl?'left':'right';else if(a==='-webkit-right')a='right';else if(a==='-webkit-left')a='left';else if(a==='-webkit-center')a='center';return a}
 function styleOf(el,cs,text,opt){opt=opt||{};const st={};const px=parseFloat(cs.fontSize)||14;st.sz=Math.max(8,Math.min(26,Math.round(px*0.78*2)/2));
  const fw=parseInt(cs.fontWeight,10)||(cs.fontWeight==='bold'?700:400);if(fw>=600)st.b=1;if(cs.fontStyle==='italic')st.i=1;
  const col=rgba(cs.color);if(col&&col[3]>0.3){const h=hex(col[0],col[1],col[2]);if(h!=='000000')st.color=h}
  const fill=opt.fill===undefined?bgOf(el,opt.stop):opt.fill;if(fill)st.fill=fill;
  const bd=opt.bd===undefined?bordersOf(cs):opt.bd;if(bd)st.bd=bd;
  st.h=opt.h||alignOf(cs);const va=cs.verticalAlign;st.v=opt.v||(va==='middle'?'center':va==='bottom'?'bottom':'top');st.wrap=true;
  const t=String(text||'');st.ro=hasAr(t)?2:(hasLat(t)?1:(cs.direction==='rtl'?2:1));return st}
 /* ---------- text flattening ---------- */
 function flat(nodes,ctx){ctx=ctx||{};let out='';const nl=()=>{if(out&&!out.endsWith('\n'))out+='\n'};
  const rec=n=>{if(n.nodeType===3){out+=n.nodeValue.replace(/[ \t\r\n ]+/g,' ');return}if(n.nodeType!==1)return;if(skip(n))return;const cs=gcs(n);if(hidden(cs))return;
   if(n.tagName==='BR'){out+='\n';return}
   if(n.matches&&n.matches('.bar[role=progressbar]')){out+=(n.getAttribute('aria-valuenow')||'0')+'%';return}
   if(isCtl(n)){const v=ctlText(n);if(out&&!/[\s\n]$/.test(out))out+=' ';out+=String(v).replace(/\r/g,'');return}
   const blk=BLOCKISH.has(cs.display)||n.tagName==='LI';if(blk)nl();
   if(n.tagName==='LI'){const p=n.parentElement;out+=(p&&p.tagName==='OL'?(([...p.children].filter(x=>x.tagName==='LI').indexOf(n))+1)+'. ':'• ')}
   for(const c of n.childNodes)rec(c);if(blk)nl()};
  for(const n of nodes)rec(n);
  return out.split('\n').map(s=>s.replace(/[ \t]+/g,' ').trim()).join('\n').replace(/\n{3,}/g,'\n\n').trim()}
 function inlineOnly(el){for(const c of el.children){if(skip(c))continue;const cs=gcs(c);if(hidden(cs))continue;if(isCtl(c))continue;if(c.tagName==='TABLE'||BLOCKISH.has(cs.display))return false;if(!inlineOnly(c))return false}return true}

 /* ---------- unit collection ---------- */
 function collect(root,rootRect){const units=[];const dv=[];let seq=0;let pendingPrefix='';
  const rel=r=>({x0:r.left-rootRect.left,x1:r.right-rootRect.left,y0:r.top-rootRect.top,y1:r.bottom-rootRect.top});
  const push=(r,text,style,extra)=>{if(r.x1-r.x0<1||r.y1-r.y0<1)return;const o=Object.assign({r,text,style,seq:seq++},extra||{});units.push(o);return o};
  function emitRun(run,parent){let text=flat(run);if(pendingPrefix&&text){text=pendingPrefix+text;pendingPrefix=''}
   const pcs=gcs(parent);const sig=[...parent.childNodes].filter(n=>!(n.nodeType===3&&!n.nodeValue.trim())&&!(n.nodeType===1&&(skip(n)||hidden(gcs(n)))));
   const whole=sig.length===run.filter(n=>!(n.nodeType===3&&!n.nodeValue.trim())).length&&BLOCKISH.has(pcs.display)&&parent!==root;
   const bd=whole?bordersOf(pcs):null;const fill=whole?bgOf(parent,root):bgOf(parent,root);
   if(!text&&!bd&&!(whole&&fill))return;
   let rect;if(whole){rect=rel(parent.getBoundingClientRect());
     const pl=parseFloat(pcs.paddingLeft)||0,pr=parseFloat(pcs.paddingRight)||0;rect=rect}
   else{const rg=parent.ownerDocument.createRange();rg.setStartBefore(run[0]);rg.setEndAfter(run[run.length-1]);const rs=[...rg.getClientRects()].filter(q=>q.width>0&&q.height>0);if(!rs.length)return;
    rect=rel({left:Math.min(...rs.map(q=>q.left)),right:Math.max(...rs.map(q=>q.right)),top:Math.min(...rs.map(q=>q.top)),bottom:Math.max(...rs.map(q=>q.bottom))})}
   push(rect,text,styleOf(parent,pcs,text,{fill,bd,stop:root}),{kind:'text'})}
  function unitCtl(el,cs){const t=el.tagName;let text=ctlText(el);const ty=(el.type||'').toLowerCase();const chk=(ty==='checkbox'||ty==='radio');
   const rect=rel(el.getBoundingClientRect());if(chk){push(rect,text,styleOf(el,cs,text,{h:'center',v:'center',bd:null,fill:null}),{kind:'ctl'});return}
   const bd=bordersOf(cs)||{t:{s:'thin',c:'B8C4C0'},r:{s:'thin',c:'B8C4C0'},b:{s:'thin',c:'B8C4C0'},l:{s:'thin',c:'B8C4C0'}};
   const u=push(rect,text,styleOf(el,cs,text,{bd,v:t==='TEXTAREA'||(el.getAttribute&&el.getAttribute('contenteditable'))?'top':'center'}),{kind:'ctl'});
   if(u&&t==='SELECT'){const opts=[...el.options].map(o=>String(o.textContent||'').trim()).filter(Boolean);if(opts.length&&opts.length<40&&!opts.some(o=>o.indexOf(',')>=0)&&opts.join(',').length<250)u.list=opts}}
  function table(tb){const tcs=gcs(tb);if(hidden(tcs))return;
   for(const row of tb.rows){const rcs=gcs(row);if(hidden(rcs))continue;
    for(const cell of row.cells){const cs=gcs(cell);if(hidden(cs))continue;const rect=rel(cell.getBoundingClientRect());if(rect.x1-rect.x0<1)continue;
     const text=flat(cell.childNodes);const own=bordersOf(cs);
     const ln={s:'thin',c:'C9D2CF'};const bd=own||{t:ln,r:ln,b:ln,l:ln};
     const fill=bgOf(cell,root);const st=styleOf(cell,cs,text,{fill,bd,stop:root});
     if(cell.tagName==='TH'&&!st.b)st.b=1;
     const u=push(rect,text,st,{kind:'cell'});
     if(u){const sel=cell.querySelectorAll('select');if(sel.length===1&&!cell.querySelector('input,textarea')){const o=[...sel[0].options].map(x=>String(x.textContent||'').trim()).filter(Boolean);if(o.length&&o.length<40&&!o.some(x=>x.indexOf(',')>=0)&&o.join(',').length<250)u.list=o}}}}}
  function walk(el){if(skip(el))return;const cs=gcs(el);if(hidden(cs))return;const tag=el.tagName;
   if(tag==='TABLE'){table(el);return}
   if(el.matches('.bar[role=progressbar]')){const p=parseFloat(el.getAttribute('aria-valuenow'))||0;const r=rel(el.getBoundingClientRect());push(r,p+'%',{sz:9,h:'center',v:'center',wrap:false,color:'6B7A76',bd:{t:{s:'hair',c:'B8C4C0'},b:{s:'hair',c:'B8C4C0'},l:{s:'hair',c:'B8C4C0'},r:{s:'hair',c:'B8C4C0'}}},{kind:'text'});return}
   if(isCtl(el)){unitCtl(el,cs);return}
   if(tag==='LI'){const p=el.parentElement;pendingPrefix=(p&&p.tagName==='OL'?(([...p.children].filter(x=>x.tagName==='LI').indexOf(el))+1)+'. ':'• ')}
   let run=[];const flush=()=>{if(run.length){emitRun(run,el);run=[]}};
   for(const n of el.childNodes){if(n.nodeType===3){if(n.nodeValue.trim()||run.length)run.push(n);continue}if(n.nodeType!==1)continue;if(skip(n))continue;const ncs=gcs(n);if(hidden(ncs))continue;
    if(n.tagName==='BR'){run.push(n);continue}
    if(isCtl(n)){flush();unitCtl(n,ncs);continue}
    if(n.tagName==='TABLE'||BLOCKISH.has(ncs.display)||!inlineOnly(n)||n.matches('.bar[role=progressbar]')){flush();walk(n);continue}
    run.push(n)}
   flush();pendingPrefix=''}
  walk(root);return units}

 /* ---------- grid snapping ---------- */
 function cluster(vals,tol){const s=[...new Set(vals.map(v=>Math.round(v*10)/10))].sort((a,b)=>a-b);const out=[];let cur=[];for(const v of s){if(cur.length&&v-cur[cur.length-1]>tol){out.push(cur);cur=[]}cur.push(v)}if(cur.length)out.push(cur);return out.map(c=>c.reduce((a,b)=>a+b,0)/c.length)}
 const nearest=(edges,v)=>{let lo=0,hi=edges.length-1;while(lo<hi){const m=(lo+hi)>>1;if(edges[m]<v)lo=m+1;else hi=m}if(lo>0&&Math.abs(edges[lo-1]-v)<=Math.abs(edges[lo]-v))lo--;return lo};
 function layout(units,rtl){if(!units.length)return{cols:[8],rows:[],merges:[],validations:[],nCols:1};
  let W=0;units.forEach(u=>{W=Math.max(W,u.r.x1)});let minX=Infinity;units.forEach(u=>{minX=Math.min(minX,u.r.x0)});if(!isFinite(minX))minX=0;
  const U=units.map(u=>{const x0=Math.max(0,u.r.x0-minX),x1=Math.max(0,u.r.x1-minX),Wd=W-minX;return Object.assign({},u,{a:rtl?Wd-x1:x0,b:rtl?Wd-x0:x1,y0:u.r.y0,y1:u.r.y1})});
  let xe,tol=10;for(const t of [10,14,20,28,40]){tol=t;xe=cluster(U.flatMap(u=>[u.a,u.b]),t);if(xe.length<=46)break}
  const ye=cluster(U.flatMap(u=>[u.y0,u.y1]),2.5);
  const placed=[];const occ=new Set();const K=100000;
  U.forEach(u=>{u.c0=nearest(xe,u.a);u.c1=nearest(xe,u.b);if(u.c1<=u.c0)u.c1=Math.min(xe.length-1,u.c0+1);if(u.c1<=u.c0){u.c0=Math.max(0,xe.length-2);u.c1=u.c0+1}
   u.r0=nearest(ye,u.y0);u.r1=nearest(ye,u.y1);if(u.r1<=u.r0)u.r1=u.r0+1});
  U.sort((p,q)=>p.r0-q.r0||p.c0-q.c0||p.seq-q.seq);
  let dropped=0;
  for(const u of U){let c0=u.c0,c1=u.c1,r0=u.r0,r1=u.r1;const free=(c,r)=>!occ.has(r*K+c);
   /* shrink to the free region starting at the top-left cell; if the start is taken look right, then give up */
   let guard=0;while(!free(c0,r0)&&c0<c1-1&&guard++<60)c0++;
   if(!free(c0,r0)){dropped++;u.drop=true;continue}
   let cc=c0;while(cc<c1&&free(cc,r0))cc++;c1=cc;
   let rr=r0+1;while(rr<r1){let ok=true;for(let c=c0;c<c1;c++)if(!free(c,rr)){ok=false;break}if(!ok)break;rr++}r1=rr;
   for(let r=r0;r<r1;r++)for(let c=c0;c<c1;c++)occ.add(r*K+c);u.pc0=c0;u.pc1=c1;u.pr0=r0;u.pr1=r1;placed.push(u)}
  const nCols=xe.length-1,nRows=ye.length-1;
  const cols=[];for(let i=0;i<nCols;i++){const px=xe[i+1]-xe[i];cols.push(Math.max(0.9,(px-5)/7))}
  const rows=[];for(let j=0;j<nRows;j++)rows.push({h:Math.max(3,(ye[j+1]-ye[j])*0.75),cells:[]});
  const merges=[],validations=[];const CL=XR.colLetter;
  for(const u of placed){const top=rows[u.pr0];const spanC=u.pc1-u.pc0,spanR=u.pr1-u.pr0;let v=u.text,f=null;
   const num=u.kind!=='text'||true?asNumber(v):null;const st=Object.assign({},u.style);
   if(num&&String(v).length<24){v=num.v;if(num.comma||Math.abs(num.v)>=10000||num.dec>0)st.nf=num.dec>0?'#,##0.00':'#,##0'}
   else if(typeof v==='string'&&v.length>32000)v=v.slice(0,32000);
   for(let r=u.pr0;r<u.pr1;r++)for(let c=u.pc0;c<u.pc1;c++){const first=(r===u.pr0&&c===u.pc0);
    if(!first&&spanC*spanR>240&&r!==u.pr0&&r!==u.pr1-1&&c!==u.pc0&&c!==u.pc1-1)continue;
    rows[r].cells.push({c,v:first?v:'',s:st})}
   if(spanC>1||spanR>1)merges.push(CL(u.pc0)+(u.pr0+1)+':'+CL(u.pc1-1)+u.pr1);
   if(u.list)validations.push({sqref:CL(u.pc0)+(u.pr0+1),list:u.list})}
  return{cols,rows,merges,validations,nCols,nRows,dropped,tol}}

 /* ---------- hidden iframe session ---------- */
 const OVERRIDE=`html,body{background:#fff!important;margin:0!important;padding:0!important;overflow:visible!important}body{width:1200px!important;min-width:1200px!important}
  .xlhost{width:1160px;margin:0 20px;padding:0;color:#1b2b27;font-size:14px;line-height:1.5}
  .xlhost .tw{overflow:visible!important;max-width:none!important}.xlhost .wptabs>.wpsec{display:block!important}.xlhost .noprint,.xlhost .print-head{display:none!important}
  .xlhost *{animation:none!important;transition:none!important;scroll-margin:0!important}.xlhost [data-lazy]{content-visibility:visible!important}`;
 async function openSession(){const f=document.createElement('iframe');f.setAttribute('aria-hidden','true');f.tabIndex=-1;f.title='export';
  f.style.cssText='position:fixed;left:-20000px;top:0;width:1200px;height:1400px;border:0;visibility:hidden;pointer-events:none';document.body.appendChild(f);
  const d=f.contentDocument;const R=document.documentElement;
  const css=[...document.querySelectorAll('head style, head link[rel=stylesheet]')].map(n=>n.tagName==='STYLE'?`<style>${n.textContent}</style>`:`<link rel="stylesheet" href="${n.href}">`).join('');
  d.open();d.write(`<!doctype html><html lang="${R.lang||'ar'}" dir="${R.dir||'rtl'}" data-theme="light" data-eff="light" data-density="comfy" style="--fs-scale:1"><head><meta charset="utf-8"><meta name="viewport" content="width=1200"><meta name="color-scheme" content="light">${css}<style>${OVERRIDE}</style></head><body><div id="xh" class="xlhost"></div></body></html>`);d.close();
  await new Promise(r=>{if(d.readyState==='complete')r();else{f.addEventListener('load',()=>r(),{once:true});setTimeout(r,4000)}});
  try{await d.fonts.ready}catch(e){/* fonts API unavailable */}
  return{frame:f,doc:d,host:d.getElementById('xh'),close(){try{f.remove()}catch(e){/* already gone */}}}}
 function prepare(S){const h=S.host,d=S.doc;try{if(typeof XT!=='undefined'&&XT.on())XT.tree(h)}catch(e){/* ignore */}h.querySelectorAll('details').forEach(x=>{x.open=true});
  h.querySelectorAll('.wptabs>.wpsec').forEach(x=>x.classList.add('on'));
  h.querySelectorAll('textarea').forEach(t=>{t.style.height='auto';t.style.height=Math.max(t.scrollHeight,24)+'px'});
  h.querySelectorAll('[contenteditable]').forEach(t=>{t.style.maxHeight='none';t.style.overflow='visible'})}
 /* render an HTML string (e.g. the output of V.wp(ref)) */
 async function renderHTML(S,html){S.host.innerHTML=html;prepare(S);try{await S.doc.fonts.ready}catch(e){/* ok */}return S.host}
 /* render a clone of live DOM (keeps typed-but-unsaved values) */
 async function renderNode(S,node){S.host.innerHTML='';const c=S.doc.importNode(node,true);S.host.appendChild(c);
  const a=[...node.querySelectorAll('input,textarea,select')],b=[...c.querySelectorAll('input,textarea,select')];
  a.forEach((x,i)=>{const y=b[i];if(!y)return;try{if(x.tagName==='SELECT'){y.selectedIndex=x.selectedIndex}else if(x.type==='checkbox'||x.type==='radio')y.checked=x.checked;else y.value=x.value}catch(e){/* ignore */}});
  prepare(S);try{await S.doc.fonts.ready}catch(e){/* ok */}return S.host}

 /* ---------- convert the host into a sheet (with title block) ---------- */
 function convert(S,opt){opt=opt||{};const host=S.host;const rtl=(S.doc.documentElement.dir||'rtl')==='rtl';
  const units=collect(host,host.getBoundingClientRect());const L=layout(units,rtl);
  const TB=Math.max(L.nCols,1);const pre=[];
  const head=(txt,st,h)=>{if(!txt)return;const r={h,cells:[]};for(let c=0;c<TB;c++)r.cells.push({c,v:c===0?txt:'',s:st});pre.push(r);if(TB>1)L.preMerge=(L.preMerge||[]).concat([[pre.length-1,0,pre.length-1,TB-1]])};
  const base={h:rtl?'right':'left',v:'center',wrap:true,ro:rtl?2:1};
  head(opt.line1,Object.assign({},base,{b:1,sz:11,color:'1F5F50',fill:'E3F1EC'}),20);
  head(opt.title,Object.assign({},base,{b:1,sz:16,color:'12382F',fill:'E3F1EC'}),30);
  head(opt.line2,Object.assign({},base,{sz:9,color:'55635F',fill:'E3F1EC'}),18);
  if(pre.length){pre.push({h:8,cells:[]})}
  const off=pre.length;const rows=pre.concat(L.rows);
  const shift=m=>m.replace(/([A-Z]+)(\d+):([A-Z]+)(\d+)/,(x,a,r1,b,r2)=>a+(+r1+off)+':'+b+(+r2+off));
  const merges=(L.preMerge||[]).map(m=>XR.colLetter(m[1])+(m[0]+1)+':'+XR.colLetter(m[3])+(m[2]+1)).concat(L.merges.map(shift));
  const vals=L.validations.map(v=>({sqref:v.sqref.replace(/(\d+)$/,n=>(+n+off)),list:v.list}));
  return{name:opt.name||'Sheet',rtl,grid:false,landscape:true,cols:L.cols,rows,merges,validations:vals,tab:opt.tab,header:opt.header,footer:opt.footer,dropped:L.dropped,units:units.length}}
 return{openSession,renderHTML,renderNode,convert,collect,layout,asNumber}})();
