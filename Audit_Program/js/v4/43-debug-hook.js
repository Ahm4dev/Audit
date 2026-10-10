/* MEAP · V4 · Debug hook (99_debug) */
'use strict';
/* ===== 99_debug.js ===== */
/* test hook: exposes internals only when localStorage meap.debug=1 */
try{if(localStorage.getItem('meap.debug')==='1'){window.__V4={get CUR(){return CUR},CSUG,clsOf,clsResolve,TBSTORE,tbMapOf,G,CT,XP,ctTree,wpSt4,catProg,PROCS,SRCN,RISKS,WP:typeof WP!=='undefined'?WP:null,A,V,BLOCKS}}}catch(e){/* storage blocked */}
