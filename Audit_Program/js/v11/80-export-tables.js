/* MEAP · v11 · Excel export quality layer
   1) large tables (> XS.MIN rows) leave the narrative sheet and become native data sheets: header row, frozen panes, auto-filter,
      typed numbers, banding, proper column widths, print titles — so they can be sorted / filtered / pivoted in Excel;
   2) every exported sheet gets frozen title rows and anti-clipping row heights (merged cells never auto-fit in Excel);
   3) pages that render in tabs (COSO …) expose all panes while exporting (window.MEAP_EXPORT). */
'use strict';
const XS=(()=>{
 const MIN=28;
 const isAr=()=>(typeof PREF!=='undefined'&&PREF.lang)!=='en';
 const BD={l:{s:'thin',c:'C9D3D0'},r:{s:'thin',c:'C9D3D0'},t:{s:'thin',c:'C9D3D0'},b:{s:'thin',c:'C9D3D0'}};
 const visible=el=>{for(let n=el;n&&n.nodeType===1;n=n.parentElement){const cs=n.ownerDocument.defaultView.getComputedStyle(n);if(cs.display==='none'||cs.visibility==='hidden')return false}return true};
 function cellText(c){const ctl=[...c.querySelectorAll('input,select,textarea')].filter(x=>(x.type||'')!=='hidden');
  const own=String(c.innerText||'').replace(/\s*\n\s*/g,' ').trim();
  if(!ctl.length)return own;
  const vals=ctl.map(x=>{if(x.tagName==='SELECT'){const o=x.selectedOptions&&x.selectedOptions[0];return o?String(o.textContent||'').trim():''}
   if(x.type==='checkbox'||x.type==='radio')return x.checked?'☑':'☐';return x.value||''}).filter(Boolean);
  return (own&&!vals.includes(own)?own+' ':'')+vals.join(' ')}
 function tableRows(tb){const head=[],body=[];
  for(const tr of tb.rows){if(!visible(tr))continue;const cells=[...tr.cells];if(!cells.length)continue;
   const isH=tr.parentElement&&tr.parentElement.tagName==='THEAD'||cells.every(c=>c.tagName==='TH');
   const foot=tr.parentElement&&tr.parentElement.tagName==='TFOOT';
   (isH&&!body.length?head:body).push({cells:cells.filter(visible),foot})}
  return {head,body}}
 function build(tb,name,title,rtl){const {head,body}=tableRows(tb);if(!body.length)return null;
  const hdr=(head[head.length-1]||body[0]).cells;const dataRows=head.length?body:body.slice(1);
  const nC=Math.max(hdr.length,...dataRows.slice(0,50).map(r=>r.cells.length));
  const al=rtl?'right':'left',ro=rtl?2:1;
  const H={b:1,sz:10,color:'FFFFFF',fill:'1F6F5C',h:'center',v:'center',wrap:true,bd:BD,ro};
  const rows=[];const tit=title?{h:24,cells:[{c:0,v:title,s:{b:1,sz:14,color:'12382F',fill:'E3F1EC',h:al,v:'center',ro}}].concat(Array.from({length:nC-1},(_,i)=>({c:i+1,v:'',s:{fill:'E3F1EC'}})))}:null;
  if(tit)rows.push(tit);
  rows.push({h:30,cells:hdr.map((c,i)=>({c:i,v:cellText(c),s:H}))});
  const W=Array.from({length:nC},(_,i)=>Math.max(6,Math.min(14,String(cellText(hdr[i]||{innerText:''})).length*1.15)));
  const num=Array(nC).fill(0),tot=Array(nC).fill(0);
  dataRows.forEach((r,ri)=>{const cells=[];
   r.cells.forEach((c,ci)=>{if(ci>=nC)return;const t=cellText(c);const n=t.length<24?XD.asNumber(t):null;let v=t,st={sz:10,v:'top',wrap:true,bd:BD,ro:(/[؀-ۿ]/.test(t)?2:1),h:al};
    if(n){v=n.v;st=Object.assign({},st,{h:'right',ro:1,nf:n.dec>0?'#,##0.00;[Red](#,##0.00)':'#,##0;[Red](#,##0)'});num[ci]++}
    if(r.foot||c.tagName==='TH'){st.b=1;st.fill='E3F1EC'}else if(ri%2)st.fill='F6F9F8';
    cells.push({c:ci,v,s:st});W[ci]=Math.max(W[ci],Math.min(r.foot?30:55,(String(t).length)*1.05+2))});
   rows.push({cells})});
  const first=tit?3:2,last=rows.length;
  return {name,rtl,grid:false,landscape:true,tab:'FF2F7D6B',cols:W.map(w=>Math.min(60,Math.max(7,w))),rows,merges:tit&&nC>1?['A1:'+XR.colLetter(nC-1)+'1']:[],
   freezeRows:tit?2:1,autoFilter:'A'+(tit?2:1)+':'+XR.colLetter(nC-1)+(last),links:[],validations:[],n:dataRows.length}}
 /* replace big tables in the rendered host by a pointer note and return their data sheets */
 function extractTables(S,baseName,used,title){const out=[];const rtl=(S.doc.documentElement.dir||'rtl')==='rtl';let k=0;
  [...S.host.querySelectorAll('table')].forEach(tb=>{if(tb.closest('table')!==tb&&tb.parentElement&&tb.parentElement.closest('table'))return;if(!visible(tb))return;
   const nRows=[...tb.tBodies].reduce((s,b)=>s+b.rows.length,0);if(nRows<MIN)return;
   const h=tb.closest('.tw,div')&&tb.closest('.tw,div').previousElementSibling;const ttl=(h&&/^H[1-4]$/.test(h.tagName)?h.textContent.trim():'')||title||'';
   const nm=(typeof used!=='undefined'&&used&&used.add)?uniq(used,baseName+'-T'+(++k)):baseName+'-T'+(++k);
   const sh=build(tb,nm,ttl,rtl);if(!sh)return;out.push(sh);
   const host=tb.closest('.tw')||tb;const p=S.doc.createElement('p');p.className='note';p.textContent=(isAr()?'↗ الجدول ('+sh.n+' صف) مُصدَّر في ورقة مستقلة بالاسم: ':'↗ Table ('+sh.n+' rows) exported to its own sheet: ')+nm;host.replaceWith(p)});
  return out}
 function uniq(used,n){let b=n.replace(/[\[\]:*?\/\\]/g,'-').slice(0,31),x=b,i=2;while(used.has(x.toLowerCase())){x=b.slice(0,28)+'~'+(i++)}used.add(x.toLowerCase());return x}
 /* anti-clipping heights + frozen title rows (post-process of XD.convert output) */
 function fit(sh){if(!sh||!sh.rows)return sh;const cols=sh.cols||[];const span={};
  (sh.merges||[]).forEach(m=>{const g=/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(m);if(!g)return;const c0=colNo(g[1]),c1=colNo(g[3]);span[(+g[2]-1)+':'+c0]={c1,r1:+g[4]-1}});
  sh.rows.forEach((row,ri)=>{if(!row)return;(row.cells||[]).forEach(c=>{if(typeof c.v!=='string'||c.v.length<8)return;const sp=span[ri+':'+c.c]||{c1:c.c,r1:ri};
    let w=0;for(let i=c.c;i<=sp.c1;i++)w+=(cols[i]||8.43);const sz=(c.s&&c.s.sz)||10;const cpl=Math.max(3,(w-1)*(10/sz)*(c.s&&c.s.b?0.92:1));
    const lines=c.v.split('\n').reduce((s,l)=>s+Math.max(1,Math.ceil(l.length/cpl)),0);const need=Math.min(400,lines*sz*1.3+5);
    let have=0;for(let r=ri;r<=sp.r1;r++)have+=(sh.rows[r]&&sh.rows[r].h)||15;
    if(need>have+0.5){const r=sh.rows[sp.r1]||(sh.rows[sp.r1]={cells:[]});r.h=Math.min(409,((r.h)||15)+(need-have))}})});
  return sh}
 const colNo=s=>s.split('').reduce((a,ch)=>a*26+ch.charCodeAt(0)-64,0)-1;
 return {MIN,extractTables,fit,build,uniq};
})();
/* every converted sheet: anti-clipping heights + freeze the title block (title rows are the leading rows that are not data) */
(function(){const o=XD.convert;XD.convert=function(S,opt){const sh=XS.fit(o.call(this,S,opt));if(sh&&opt&&opt.title&&!sh.freezeRows){let n=0;for(const r of sh.rows){if(r.cells&&r.cells.length&&r.cells.every(c=>c.s&&c.s.fill==='E3F1EC'))n++;else if(!r.cells||!r.cells.length){if(n)n++;break}else break}if(n>=1&&n<8)sh.freezeRows=n}return sh}})();
