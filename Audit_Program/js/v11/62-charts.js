/* Audit-Plus · v11 · Inline SVG chart kit (no dependencies, theme-aware, print/Excel friendly) + analytics charts. */
'use strict';
const XC=(()=>{
 const PAL=['#1f6f5c','#d9a21a','#4c78a8','#b0527a','#7a8f2a','#8c6d4f'];
 const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const cut=(s,n)=>{s=String(s==null?'':s);return s.length>n?s.slice(0,n-1)+'…':s};
 const cmp=v=>{const a=Math.abs(v);const s=a>=1e9?(a/1e9).toFixed(a>=1e10?0:1)+'B':a>=1e6?(a/1e6).toFixed(a>=1e7?0:1)+'M':a>=1e3?(a/1e3).toFixed(a>=1e4?0:1)+'K':String(Math.round(a));return(v<0?'-':'')+s};
 function nice(max){if(max<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(max)));const f=max/p;return(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p}
 function scale(vals){let lo=Math.min(0,...vals),hi=Math.max(0,...vals);if(hi===lo)hi=lo+1;const span=nice(Math.max(hi,-lo));const L=lo<0?-span*Math.ceil(-lo/span*1):0;const H=hi>0?span*Math.ceil(hi/span):0;return{lo:lo<0?-nice(-lo):0,hi:hi>0?nice(hi):0}}
 const legend=ser=>ser.length>1?`<div class="xc-leg">${ser.map((s,i)=>`<span><i style="background:${s.color||PAL[i%PAL.length]}"></i>${E(s.name)}</span>`).join('')}</div>`:'';
 /* horizontal grouped bars: cats[], series[{name,vals[],color}] */
 function hbars(o){const cats=o.cats||[],ser=o.series||[];if(!cats.length)return '';const n=ser.length,bh=17,gap=10,rowH=n*bh+gap,W=720,lab=230,pad=44,top=8,H=top+cats.length*rowH+26;
  const all=ser.flatMap(s=>s.vals.map(v=>+v||0));const {lo,hi}=scale(all);const span=hi-lo||1;const px=v=>lab+(v-lo)/span*(W-lab-pad);const x0=px(0);
  let g='';for(let i=0;i<=4;i++){const v=lo+span*i/4,x=px(v);g+=`<line class="gl" x1="${x}" x2="${x}" y1="${top}" y2="${H-22}"/><text class="mu" x="${x}" y="${H-8}" text-anchor="middle">${cmp(v)}</text>`}
  cats.forEach((c,i)=>{const y=top+i*rowH;g+=`<text x="${lab-8}" y="${y+rowH/2}" text-anchor="end" dominant-baseline="middle" font-size="15">${E(cut(c,26))}</text>`;
   ser.forEach((s,k)=>{const v=+s.vals[i]||0;const x=Math.min(px(v),x0),w=Math.max(1,Math.abs(px(v)-x0));g+=`<rect x="${x}" y="${y+k*bh}" width="${w}" height="${bh-2}" rx="2" fill="${s.color||PAL[k%PAL.length]}"><title>${E(s.name)}: ${(o.fmt||fm)(v)}</title></rect><text class="mu" x="${v>=0?x+w+4:x-4}" y="${y+k*bh+bh-4}" text-anchor="${v>=0?'start':'end'}">${cmp(v)}</text>`})});
  g+=`<line class="ax" x1="${x0}" x2="${x0}" y1="${top}" y2="${H-22}"/>`;
  return `<figure class="xc-wrap">${o.title?`<h4>${E(o.title)}</h4>`:''}<svg class="xc" viewBox="0 0 ${W} ${H}" dir="ltr" role="img" aria-label="${E(o.title||'chart')}">${g}</svg>${legend(ser)}</figure>`}
 /* vertical grouped columns */
 function vbars(o){const cats=o.cats||[],ser=o.series||[];if(!cats.length)return '';const n=ser.length,W=720,H=300,l=46,b=46,t=14,r=10;const all=ser.flatMap(s=>s.vals.map(v=>+v||0));const {lo,hi}=scale(all);const span=hi-lo||1;const py=v=>t+(hi-v)/span*(H-t-b);const gw=(W-l-r)/cats.length,bw=Math.min(34,(gw-8)/n);
  let g='';for(let i=0;i<=4;i++){const v=lo+span*i/4,y=py(v);g+=`<line class="gl" x1="${l}" x2="${W-r}" y1="${y}" y2="${y}"/><text class="mu" x="${l-6}" y="${y+4}" text-anchor="end">${cmp(v)}</text>`}
  cats.forEach((c,i)=>{const cx=l+gw*i+gw/2;g+=`<text class="mu" x="${cx}" y="${H-b+16}" text-anchor="middle">${E(cut(c,14))}</text>`;ser.forEach((s,k)=>{const v=+s.vals[i]||0;const x=cx-n*bw/2+k*bw;const y=Math.min(py(v),py(0)),h=Math.max(1,Math.abs(py(v)-py(0)));g+=`<rect x="${x}" y="${y}" width="${bw-2}" height="${h}" rx="2" fill="${s.color||PAL[k%PAL.length]}"><title>${E(s.name)} — ${E(c)}: ${(o.fmt||fm)(v)}</title></rect>`})});
  g+=`<line class="ax" x1="${l}" x2="${W-r}" y1="${py(0)}" y2="${py(0)}"/>`;
  return `<figure class="xc-wrap">${o.title?`<h4>${E(o.title)}</h4>`:''}<svg class="xc" viewBox="0 0 ${W} ${H}" dir="ltr" role="img" aria-label="${E(o.title||'chart')}">${g}</svg>${legend(ser)}</figure>`}
 /* donut: items[{label,value}] (absolute values) */
 function donut(o){const it=(o.items||[]).filter(x=>Math.abs(x.value)>0).map(x=>({label:x.label,v:Math.abs(x.value)}));if(!it.length)return '';const tot=it.reduce((s,x)=>s+x.v,0);if(!tot)return '';const R=80,r=48,cx=100,cy=100;let a=-Math.PI/2,g='';
  it.forEach((x,i)=>{const f=x.v/tot,b=a+f*2*Math.PI;const lg=f>.5?1:0;const p=(ang,rad)=>[cx+rad*Math.cos(ang),cy+rad*Math.sin(ang)];const [x1,y1]=p(a,R),[x2,y2]=p(b-1e-4,R),[x3,y3]=p(b-1e-4,r),[x4,y4]=p(a,r);
   g+=`<path d="M${x1} ${y1}A${R} ${R} 0 ${lg} 1 ${x2} ${y2}L${x3} ${y3}A${r} ${r} 0 ${lg} 0 ${x4} ${y4}Z" fill="${PAL[i%PAL.length]}"><title>${E(x.label)}: ${(f*100).toFixed(1)}%</title></path>`;a=b});
  return `<figure class="xc-wrap">${o.title?`<h4>${E(o.title)}</h4>`:''}<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><svg viewBox="0 0 200 200" width="190" height="190" dir="ltr" role="img" aria-label="${E(o.title||'chart')}">${g}</svg><ul class="xc-leg" style="flex-direction:column;list-style:none;margin:0;padding:0">${it.map((x,i)=>`<li><i style="background:${PAL[i%PAL.length]};display:inline-block;width:10px;height:10px;border-radius:2px;margin-inline-end:6px"></i>${E(cut(x.label,32))} <span class="mut" dir="ltr">${(x.v/tot*100).toFixed(1)}%</span></li>`).join('')}</ul></div></figure>`}
 /* ---------- area charts (TB panel) ---------- */
 function areaCharts(a,D,sg){const rows=D.rows.slice().sort((x,y)=>Math.abs(y.cy)-Math.abs(x.cy));if(rows.length<2)return '';const top=rows.slice(0,8);const hasOb=top.some(x=>x.ob!=null),hasPy=top.some(x=>x.py!=null);
  const ser=[];if(hasOb)ser.push({name:'أول المدة',vals:top.map(x=>(x.ob||0)*sg),color:PAL[2]});if(hasPy)ser.push({name:'السنة السابقة',vals:top.map(x=>(x.py||0)*sg),color:PAL[1]});ser.push({name:'آخر المدة',vals:top.map(x=>x.cy*sg),color:PAL[0]});
  const rest=rows.slice(8).reduce((s,x)=>s+x.cy,0);const items=top.map(x=>({label:x.r.name||x.r.code,value:x.cy})).concat(Math.abs(rest)>0?[{label:'أخرى',value:rest}]:[]);
  return `<div class="xc-row noprint-x">${hbars({title:'أكبر الحسابات: '+ser.map(s=>s.name).join(' / '),cats:top.map(x=>x.r.name||x.r.code),series:ser})}${donut({title:'تركيب رصيد المجال',items})}</div>`}
 /* ---------- A120 chart: expectation vs actual ---------- */
 function analyticChart(a,rows,sg){const top=rows.filter(r=>r.x).slice(0,10);if(top.length<2)return '';const ser=[{name:'السنة الحالية',vals:top.map(r=>r.x.cy*sg),color:PAL[0]}];
  if(top.some(r=>r.e!=null))ser.unshift({name:'التوقع',vals:top.map(r=>(r.e==null?0:r.e)*sg),color:PAL[1]});if(top.some(r=>r.x.ob!=null))ser.unshift({name:'أول المدة',vals:top.map(r=>(r.x.ob||0)*sg),color:PAL[2]});
  const dif=top.map(r=>r.d==null?0:r.d*sg);return `<div class="xc-row">${hbars({title:'التوقع مقابل الفعلي (أكبر الفروق)',cats:top.map(r=>r.x.r.name||r.x.r.code),series:ser})}${top.some(r=>r.d!=null)?hbars({title:'الفروق عن التوقع',cats:top.map(r=>r.x.r.name||r.x.r.code),series:[{name:'الفرق',vals:dif,color:PAL[3]}]}):''}</div>`}
 return{hbars,vbars,donut,areaCharts,analyticChart,PAL};
})();
/* ---------- analytics hub: every tab is backed by charts ---------- */
(function(){if(typeof AN_TABS==='undefined')return;const PAL=XC.PAL;
 const ratioChart=()=>{const V=anVals();if(!V||!V.cy)return '';const grp=(ttl,keys,u)=>{const rs=AN_RATIOS.filter(r=>keys.includes(r[0]));const cy=rs.map(r=>anRatioVal(r,V.cy)),py=rs.map(r=>V.py?anRatioVal(r,V.py):null);if(!cy.some(v=>v!=null&&isFinite(v)))return '';
   const ser=[{name:'السنة الحالية',vals:cy.map(v=>v==null||!isFinite(v)?0:v),color:PAL[0]}];if(V.py)ser.push({name:'السنة السابقة',vals:py.map(v=>v==null||!isFinite(v)?0:v),color:PAL[1]});
   return XC.vbars({title:ttl,cats:rs.map(r=>r[1]),series:ser,fmt:v=>(+v).toFixed(2)+(u||'')})};
  return `<div class="xc-row">${grp('الربحية %',['gm','om','nm','roa','roe'],'%')}${grp('السيولة وهيكل التمويل (مرة)',['cur','quick','dte','icr','at'],'')}${grp('النشاط (أيام)',['dso','dio','dpo'],' يوم')}</div>`};
 const hvChart=()=>{const B=fsBuild();if(!B.ready)return '';const out=[];for(const [st,ttl] of [['SFP','المركز المالي — الحالية مقابل السابقة'],['PL','الدخل — الحالية مقابل السابقة']]){const gs=fsOrder(st).map(g=>{let cy=0,py=0;for(const n of B.S[st].get(g).values()){cy+=n.cy;py+=(n.py||0)}return{g,cy,py}}).filter(x=>Math.abs(x.cy)>0||Math.abs(x.py)>0);if(gs.length<2)continue;
   const ser=[{name:'الحالية',vals:gs.map(x=>x.cy),color:PAL[0]}];if(B.hasPy)ser.push({name:'السابقة',vals:gs.map(x=>x.py),color:PAL[1]});out.push(XC.hbars({title:ttl,cats:gs.map(x=>x.g),series:ser}));
   if(st==='SFP')out.push(XC.donut({title:'تركيب بنود المركز المالي (حالية)',items:gs.map(x=>({label:x.g,value:x.cy}))}))}
  return `<div class="xc-row">${out.join('')}</div>`};
 const fluxChart=()=>{const B=fsBuild();if(!B.ready||!B.hasPy)return '';const rows=[];for(const st of ['SFP','PL'])for(const g of fsOrder(st))for(const n of B.S[st].get(g).values())rows.push({n:n.u,d:n.cy-n.py});rows.sort((a,b)=>Math.abs(b.d)-Math.abs(a.d));const t=rows.slice(0,12);if(t.length<2)return '';return XC.hbars({title:'أكبر الفروق عن السنة السابقة',cats:t.map(x=>x.n),series:[{name:'الفرق',vals:t.map(x=>x.d),color:PAL[3]}]})};
 const dupChart=()=>{const V=anVals();if(!V||!V.cy)return '';const f=v=>v?{a:v.rev?v.np/v.rev*100:0,b:v.ta?v.rev/v.ta:0,c:v.eqb?v.ta/v.eqb:0,d:v.eqb?v.np/v.eqb*100:0}:null;const c=f(V.cy),p=f(V.py);return `<div class="xc-row">${XC.vbars({title:'مكوّنات DuPont (هامش % · دوران · رافعة)',cats:['هامش الربح %','دوران الأصول','الرافعة'],series:[{name:'الحالية',vals:[c.a,c.b,c.c],color:PAL[0]}].concat(p?[{name:'السابقة',vals:[p.a,p.b,p.c],color:PAL[1]}]:[]),fmt:v=>(+v).toFixed(2)})}${XC.vbars({title:'العائد على حقوق الملكية %',cats:['ROE'],series:[{name:'الحالية',vals:[c.d],color:PAL[0]}].concat(p?[{name:'السابقة',vals:[p.d],color:PAL[1]}]:[]),fmt:v=>(+v).toFixed(1)+'%'})}</div>`};
 const varChart=()=>{if(!TBSTORE.ready())return '';const am=areaMap();const rows=[];for(const [id,d] of am.data){const a=CT.areaBy[id];if(!d.rows.length)continue;const sg=AREA_SIGN(a);rows.push({n:a.ar||id,cy:d.cy*sg,py:d.py==null?null:d.py*sg,ob:d.ob==null?null:d.ob*sg})}rows.sort((x,y)=>Math.abs(y.cy)-Math.abs(x.cy));const t=rows.slice(0,10);if(t.length<2)return '';
  const ser=[];if(t.some(x=>x.ob!=null))ser.push({name:'أول المدة',vals:t.map(x=>x.ob||0),color:PAL[2]});if(t.some(x=>x.py!=null))ser.push({name:'السنة السابقة',vals:t.map(x=>x.py||0),color:PAL[1]});ser.push({name:'آخر المدة',vals:t.map(x=>x.cy),color:PAL[0]});return XC.hbars({title:'أكبر مجالات القوائم: أول المدة / السابقة / آخر المدة',cats:t.map(x=>x.n),series:ser})};
 const wrap=(i,ch)=>{const o=AN_TABS[i][2];AN_TABS[i][2]=()=>{let c='';try{c=ch()}catch(e){logErr('chart',e,'warn')}return o()+c}};
 AN_TABS.forEach((t,i)=>{if(t[0]==='ratios')wrap(i,ratioChart);else if(t[0]==='hv')wrap(i,hvChart);else if(t[0]==='flux')wrap(i,fluxChart);else if(t[0]==='dupont')wrap(i,dupChart);else if(t[0]==='var')wrap(i,varChart)})})();
