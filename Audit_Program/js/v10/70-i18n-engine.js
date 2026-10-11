/* MEAP · v10 · Runtime Arabic → English translation layer.
   The UI and all professional content are authored in Arabic. When PREF.lang==='en' every text node / label / placeholder shown on
   screen is translated through a phrase dictionary (js/v10/71-i18n-dict.js) using greedy longest-phrase matching; numbers are
   kept in place ("#" wildcards). User-entered data is never touched. Switching back to Arabic re-renders the page from source. */
'use strict';
const XT=(()=>{
 const AR=/[؀-ۿݐ-ݿ]/;
 const TOK=/[؀-ۿݐ-ݿ]+|[0-9٠-٩]+(?:[.,٫٬][0-9٠-٩]+)*|[A-Za-z][A-Za-z0-9_]*|\s+|[\s\S]/g;
 const isNum=s=>/^[0-9٠-٩]/.test(s);
 const PUNCT={'،':',','؛':';','؟':'?','«':'"','»':'"','٪':'%','ـ':''};
 const WEST=d=>String.fromCharCode(d.charCodeAt(0)-0x0660+48);
 let D=null,FIRST=null,MAXLEN=1;
 function keyToks(s){const raw=s.match(TOK)||[];const k=[];for(const t of raw){if(/^\s+$/.test(t)){if(k.length&&k[k.length-1]===' ')continue;k.push(' ')}else k.push(isNum(t)?'#':t)}return k}
 function init(){if(D)return true;if(typeof I18N_EN==='undefined')return false;D=I18N_EN;FIRST=new Map();
  for(const key in D){const k=keyToks(key);if(!k.length)continue;let a=FIRST.get(k[0]);if(!a){a=new Set();FIRST.set(k[0],a)}a.add(k.length);if(k.length>MAXLEN)MAXLEN=k.length}
  for(const [f,s] of FIRST)FIRST.set(f,[...s].sort((a,b)=>b-a));return true}
 const CACHE=new Map();
 function tr(text){if(!text||!AR.test(text))return text;if(!init())return text;
  const lead=text.match(/^\s*/)[0],trail=text.match(/\s*$/)[0];const core=text.slice(lead.length,text.length-trail.length);if(!core)return text;
  let hit=CACHE.get(core);if(hit!==undefined)return lead+hit+trail;
  const raw=core.match(TOK)||[];const toks=[],nums=[];  /* toks: normalised; nums: raw numbers by token index */
  for(const t of raw){if(/^\s+$/.test(t)){if(toks.length&&toks[toks.length-1].k===' ')continue;toks.push({k:' ',r:' '})}else toks.push({k:isNum(t)?'#':t,r:t})}
  let out='',i=0;const n=toks.length;
  while(i<n){const lens=FIRST.get(toks[i].k);let done=false;
   if(lens){for(const L of lens){if(i+L>n)continue;let s='';for(let j=i;j<i+L;j++)s+=toks[j].k;const e=D[s];
     if(e!==undefined){let q=0;const ns=[];for(let j=i;j<i+L;j++)if(toks[j].k==='#')ns.push(toks[j].r);
      out+=e.replace(/#/g,()=>ns.length?(ns[q++]||'#').replace(/[٠-٩]/g,WEST):'#');i+=L;done=true;break}}}
   if(!done){const t=toks[i].r;out+=PUNCT[t]!==undefined?PUNCT[t]:(isNum(t)?t.replace(/[٠-٩]/g,WEST):t);i++}}
  out=out.replace(/ {2,}/g,' ').replace(/\s+([,.;:?!)])/g,'$1').replace(/([(])\s+/g,'$1');
  if(CACHE.size>20000)CACHE.clear();CACHE.set(core,out);return lead+out+trail}
 /* ---------- DOM ---------- */
 const SKIP='script,style,textarea,input,svg,code,pre,[data-notr],.notr';
 const ATTRS=['placeholder','title','aria-label','alt','data-ph'];
 function editableUser(el){const e=el.closest&&el.closest('[contenteditable="true"],[contenteditable=""]');if(!e)return false;const dv=e.getAttribute('data-dv');return !(dv!==null&&e.textContent.trim()===dv.trim())}
 function textNode(n){const p=n.parentElement;if(!p)return;if(p.closest&&p.closest(SKIP))return;const v=n.nodeValue;if(!AR.test(v))return;if(editableUser(p))return;const o=tr(v);if(o!==v)n.nodeValue=o}
 function attrs(el){if(!el.getAttribute)return;for(const a of ATTRS){const v=el.getAttribute(a);if(v&&AR.test(v)){const o=tr(v);if(o!==v)el.setAttribute(a,o)}}
  if(el.tagName==='INPUT'&&/^(button|submit|reset)$/.test(el.type)&&AR.test(el.value)){el.value=tr(el.value)}}
 function tree(root){if(!root)return;if(root.nodeType===3){textNode(root);return}if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
  if(root.nodeType===1){if(root.closest&&root.closest('[data-notr],.notr'))return;attrs(root)}
  const w=(root.ownerDocument||root).createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,{acceptNode(n){if(n.nodeType===1){const t=n.tagName;return (t==='SCRIPT'||t==='STYLE'||n.hasAttribute('data-notr'))?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}return NodeFilter.FILTER_ACCEPT}});
  let n;const T=[],E=[];while((n=w.nextNode())){if(n.nodeType===3)T.push(n);else E.push(n)}
  for(const e of E)attrs(e);for(const t of T)textNode(t)}
 const on=()=>typeof PREF!=='undefined'&&PREF.lang==='en';
 let pend=new Set(),sched=false,busy=false;
 function flush(){sched=false;if(!on()){pend.clear();return}busy=true;try{const a=[...pend];pend.clear();for(const n of a){if(n.isConnected!==false)tree(n)}if(AR.test(document.title))document.title=tr(document.title)}finally{busy=false;mo&&mo.takeRecords()}}
 function queue(n){pend.add(n);if(!sched){sched=true;(window.requestAnimationFrame||setTimeout)(flush)}}
 let mo=null;
 function start(){if(mo||typeof MutationObserver==='undefined')return;
  mo=new MutationObserver(ms=>{if(busy||!on())return;for(const m of ms){if(m.type==='childList')m.addedNodes.forEach(n=>queue(n));else if(m.type==='characterData')queue(m.target);else if(m.type==='attributes')queue(m.target)}});
  mo.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS});
  if(on())queue(document.body)}
 document.addEventListener('meap:routed',()=>{if(on())queue(document.body)});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
 return{tr,tree,on,start,run:()=>queue(document.body)};
})();
