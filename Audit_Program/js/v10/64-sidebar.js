/* Audit-Plus · v10 · Sidebar helpers.
   The tree shows ONE entry per area (its main worksheet). Sub-papers (estimates, analytics, sampling…) open as tabs inside the main
   worksheet page (see ctBody in v4/40-shell.js), so they are intentionally NOT listed in the sidebar. */
'use strict';
function curExact(){if(CUR.view!=='wp'||!CUR.arg)return'';try{return decodeURIComponent(String(CUR.arg).split('/')[0])}catch(e){return String(CUR.arg)}}
/* tools/index links (legacy group) must not keep a stale "current page" mark while a worksheet is open */
document.addEventListener('meap:routed',()=>{const n=document.getElementById('nav');if(!n||!n.querySelector('a.nw[aria-current=page]'))return;n.querySelectorAll('details.ngl [aria-current=page]').forEach(a=>a.removeAttribute('aria-current'))});
