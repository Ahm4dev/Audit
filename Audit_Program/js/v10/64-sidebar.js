/* Audit-Plus · v10 · Sidebar: every area sub-paper is listed (nested under its area) and the open worksheet is always highlighted */
'use strict';
function curExact(){if(CUR.view!=='wp'||!CUR.arg)return'';try{return decodeURIComponent(String(CUR.arg).split('/')[0])}catch(e){return String(CUR.arg)}}
function navSub(r,ex){const it=CT.items[r];const s=wpSt4(r);const on=r===ex;const lab=(PREF&&PREF.lang==='en')?(it.en||it.ar):it.ar;
 return `<a class="nw nws st-${s}" href="${L('wp/'+encodeURIComponent(r))}"${on?' aria-current="page"':''} data-nq="${esc(normAr(it.disp+' '+it.ar+' '+it.en))}" title="${esc(it.ar+' — '+it.en)}"><i class="dot" aria-hidden="true"></i><span class="nd">${esc(it.disp)}</span><span class="nt">${esc(lab)}</span></a>`}
navArea=function(a,cur){const r=a.main;if(!CT.items[r]||ctOff(r))return'';const ex=curExact()||'';const exMain=ex&&CT.items[ex]&&CT.items[ex].area===a.id?r:'';
 const active=r===cur;const onMain=active&&(!ex||ex===r||CT.items[ex]===undefined||CT.items[ex].area!==a.id);const s=wpSt4(r);const rm=(typeof areaRmm==='function')?areaRmm(a.id):'';
 const subs=a.items.filter(x=>x!==r&&CT.items[x]&&!ctOff(x));const ar=(PREF&&PREF.lang)==='en'?(a.en||a.ar):a.ar;
 const link=`<a class="nw nwa st-${s}${active&&!onMain?' on-parent':''}" href="${L('wp/'+encodeURIComponent(r))}"${onMain?' aria-current="page"':''} data-nq="${esc(normAr(a.ar+' '+a.en+' '+CT.items[r].disp))}" title="${esc(a.ar)}"><i class="dot" aria-hidden="true"></i><span class="nd">${esc(CT.items[r].disp)}</span><span class="nt">${esc(ar)}</span>${rm==='H'?'<span class="rk H" title="High risk">●</span>':''}</a>`;
 if(!subs.length)return link;
 return `<details class="nga${active?' has-cur':''}" data-nk="a:${esc(a.id)}"${active?' open':''}><summary>${link}</summary><div class="nsub">${subs.map(x=>navSub(x,ex)).join('')}</div></details>`};
/* worksheets that are not in any group/area (custom or orphan) must still be reachable: add them to an "other" group at the end of their section */
document.addEventListener('meap:routed',()=>{const n=document.getElementById('nav');if(!n||!curExact()||!CT.items[curExact()])return;n.querySelectorAll('details.ngl [aria-current=page]').forEach(a=>a.removeAttribute('aria-current'))});
