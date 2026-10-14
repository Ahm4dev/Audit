/* MEAP · v7 · Simplified worksheet UX helpers (collapsible sections, tabs reveal, print) */
'use strict';
/* open every collapsed <details> / hidden tab that contains the element, so anchors and jump links always land on visible content */
function revealFor(el){for(let n=el;n&&n!==document.body;n=n.parentElement){if(n.tagName==='DETAILS')n.open=true;if(n.classList&&n.classList.contains('wpsec')&&/^sec-/.test(n.id)&&typeof ctShowSec==='function')ctShowSec(n.id.slice(4))}}
document.addEventListener('click',e=>{const t=e.target instanceof Element?e.target:null;if(!t)return;
  const j=t.closest('[data-jump]');if(j){const el=document.getElementById(j.dataset.jump);if(el)revealFor(el)}
  const a=t.closest('a[href^="#"]:not([href^="#/"])');if(a){const id=a.getAttribute('href').slice(1);const el=id&&document.getElementById(id);if(el)revealFor(el)}},true);
document.addEventListener('meap:routed',()=>{const h=decodeURIComponent((location.hash.match(/#\/e\/[^#]*#(.+)$/)||[])[1]||'');if(h){const el=document.getElementById(h);if(el){revealFor(el);setTimeout(()=>{try{el.scrollIntoView({block:'start'})}catch(e){}},40)}}});
/* printing must show everything */
let _prDet=[];
window.addEventListener('beforeprint',()=>{document.body.classList.add('print-all');_prDet=[...document.querySelectorAll('#main details:not([open])')];_prDet.forEach(d=>d.open=true)});
window.addEventListener('afterprint',()=>{document.body.classList.remove('print-all');_prDet.forEach(d=>d.open=false);_prDet=[]});
