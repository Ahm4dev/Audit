/* Audit-Plus · v10 · Excel export UI: one worksheet, any page, or ALL worksheets (full content + formatting) */
'use strict';
const XU=(()=>{
 const isAr=()=>(PREF&&PREF.lang)!=='en';
 const ST_IDX_H={b:1,sz:11,color:'FFFFFF',fill:'1F6F5C',h:'center',v:'center',wrap:true,bd:{l:{s:'thin',c:'9AA7A3'},r:{s:'thin',c:'9AA7A3'},t:{s:'thin',c:'9AA7A3'},b:{s:'thin',c:'9AA7A3'}}};
 const ST_IDX={sz:10,v:'center',wrap:true,bd:{l:{s:'thin',c:'C9D3D0'},r:{s:'thin',c:'C9D3D0'},t:{s:'thin',c:'C9D3D0'},b:{s:'thin',c:'C9D3D0'}}};
 const ST_LINK=Object.assign({},ST_IDX,{color:'0563C1',u:1});
 const co=()=>CUR.company?CUR.company.name:'';const yr=()=>CUR.eng?CUR.eng.get('eng.year',''):'';
 const stamp=()=>{let u='';try{u=SESSION.display||''}catch(e){/* none */}return (isAr()?'تاريخ التصدير: ':'Exported: ')+localISO()+(u?' — '+u:'')};
 const clean=s=>String(s==null?'':s).replace(/\s+/g,' ').trim();
 function shName(s,used){let n=clean(s).replace(/[\[\]:*?\/\\]/g,'-').slice(0,31)||'Sheet';let b=n,i=2;while(used.has(n.toLowerCase())){n=b.slice(0,28)+'~'+(i++)}used.add(n.toLowerCase());return n}
 function itemTitle(ref){const it=CT.items&&CT.items[ref];const w=WP[ref];const ar=(it&&it.ar)||(w&&w.ar)||'',en=(it&&it.en)||(w&&w.en)||'';return isAr()?(ar||en):(en||ar)}
 function hf(){return{header:'&C&"Arial,Bold"'+co()+' — '+yr(),footer:'&L&F&C&A&R'+(isAr()?'صفحة ':'Page ')+'&P / &N'}}
 const busy={on:false};
 function overlay(msg){let o=document.getElementById('xlprog');if(!o){o=document.createElement('div');o.id='xlprog';o.className='xlprog';o.setAttribute('role','status');o.innerHTML='<div class="xlbox"><b></b><div class="xlbar"><i></i></div><small></small></div>';document.body.appendChild(o)}
  o.querySelector('b').textContent=msg.t;o.querySelector('small').textContent=msg.s||'';o.querySelector('i').style.width=Math.round((msg.p||0)*100)+'%';return o}
 const unoverlay=()=>{const o=document.getElementById('xlprog');if(o)o.remove()};
 const tick=()=>new Promise(r=>setTimeout(r,0));
 /* render one worksheet through its view function, with all global state restored afterwards */
 function wpHTML(ref){const sv={lock:CUR.lock,wp:PRES.cur.wp,focus:CT.focus,view:CUR.view,arg:CUR.arg};try{return V.wp(ref)}finally{CUR.lock=sv.lock;PRES.cur.wp=sv.wp;CT.focus=sv.focus;CUR.view=sv.view;CUR.arg=sv.arg}}
 function mainRefFor(ref){const it=CT.items&&CT.items[ref];if(it&&it.area&&it.kind!=='main'&&CT.areaBy[it.area]&&CT.items[CT.areaBy[it.area].main])return CT.areaBy[it.area].main;return ref}
 async function sheetFromHTML(S,html,o){await XD.renderHTML(S,html);return XD.convert(S,o)}
 async function save(sheets,name,meta){const blob=await XR.build(sheets,Object.assign({title:name,author:(typeof SESSION!=='undefined'&&SESSION.display)||'Audit-Plus',font:'Arial'},meta||{}));downloadBlob(blob,sanitizeName(name,100)+'.xlsx')}
 const fail=e=>{try{logErr('xlsx',e)}catch(x){/* ignore */}unoverlay();busy.on=false;toast((isAr()?'تعذّر التصدير: ':'Export failed: ')+errMsg(e),'e')};

 /* ---- 1) one worksheet ---- */
 async function exportWP(ref){if(busy.on)return;busy.on=true;let S;
  try{ref=mainRefFor(ref);overlay({t:isAr()?'جارٍ تجهيز ملف Excel…':'Preparing Excel…',p:.2});await tick();
   S=await XD.openSession();const title=itemTitle(ref);
   const live=CUR.view==='wp'&&mainRefFor(String(CUR.arg||'').split('/')[0])===ref&&document.getElementById('main');
   const o=Object.assign({name:shName(ref,new Set()),line1:co()+' — '+yr()+' — '+ref,title:(ref+'  '+title),line2:stamp()},hf());
   const sh=live?(await XD.renderNode(S,liveClone()),XD.convert(S,o)):await sheetFromHTML(S,wpHTML(ref),o);
   overlay({t:isAr()?'جارٍ بناء الملف…':'Building file…',p:.8});await tick();
   await save([sh],ref+' '+title+' - '+co()+' '+yr());audit('export.wp',{ref,fmt:'xlsx',full:1});toast(isAr()?'تم تصدير ورقة العمل كاملة.':'Worksheet exported.','s')}
  catch(e){fail(e)}finally{if(S)S.close();unoverlay();busy.on=false}}
 function liveClone(){const m=document.getElementById('main');const c=m.cloneNode(true);c.querySelectorAll('nav.bc,.noprint,.xlbtn').forEach(x=>x.remove());return c}
 /* ---- 2) current page (any view) ---- */
 async function exportPage(){if(busy.on)return;const view=CUR.view||'page';if(view==='wp'&&CUR.arg){return exportWP(String(CUR.arg).split('/')[0])}
  busy.on=true;let S;try{overlay({t:isAr()?'جارٍ تجهيز ملف Excel…':'Preparing Excel…',p:.2});await tick();S=await XD.openSession();
   const ttl=clean(((document.querySelector('#main h1')||{}).textContent)||(typeof VLABEL!=='undefined'&&VLABEL[view])||view);
   await XD.renderNode(S,liveClone());const sh=XD.convert(S,Object.assign({name:shName(ttl,new Set()),line1:co()+' — '+yr(),title:ttl,line2:stamp()},hf()));
   await save([sh],ttl+' - '+co()+' '+yr());audit('export.page',{view,fmt:'xlsx'});toast(isAr()?'تم تصدير الصفحة.':'Page exported.','s')}
  catch(e){fail(e)}finally{if(S)S.close();unoverlay();busy.on=false}}
 /* ---- 3) all worksheets (one workbook, index sheet with links) ---- */
 function allRefs(scope){const refs=[];const seen=new Set();const add=r=>{if(r&&!seen.has(r)&&CT.items[r]){seen.add(r);refs.push(r)}};
  if(scope==='content'){for(const [k] of CUR.eng.entries('wp.')){const r=mainRefFor(k.split('.')[1]);if(CT.items[r])add(r)}const set=new Set(refs);return ctUnitsOrder().filter(r=>set.has(r))}
  ctUnitsOrder().forEach(add);return refs}
 async function exportAll(scope){if(busy.on)return;busy.on=true;let S;
  try{const refs=allRefs(scope||'all');if(!refs.length){toast(isAr()?'لا توجد أوراق عمل للتصدير.':'Nothing to export.','w');return}
   S=await XD.openSession();const used=new Set(['index','الفهرس']);const idxName=isAr()?'الفهرس':'Index';used.add(idxName.toLowerCase());const sheets=[];const meta=[];
   for(let i=0;i<refs.length;i++){const ref=refs[i];overlay({t:isAr()?'جارٍ تصدير أوراق العمل…':'Exporting worksheets…',s:ref+'  ('+(i+1)+'/'+refs.length+')',p:i/refs.length});await tick();
    try{const title=itemTitle(ref);const nm=shName(ref,used);
     const sh=await sheetFromHTML(S,wpHTML(ref),Object.assign({name:nm,line1:co()+' — '+yr()+' — '+ref,title:ref+'  '+title,line2:stamp()},hf()));
     sheets.push(sh);meta.push({ref,title,nm,sec:(CT.items[ref].sec||''),rows:sh.rows.length})}catch(e){try{logErr('xlsx '+ref,e)}catch(x){/* ignore */}}}
   const rtl=isAr();const base={h:rtl?'right':'left',ro:rtl?2:1};
   const H=(isAr()?['#','المرجع','اسم ورقة العمل','القسم','الورقة']:['#','Ref','Worksheet','Section','Sheet']);
   const secName=id=>{const s=CT.secs.find(x=>x.id===id);return s?(isAr()?s.ar:s.en):''};
   const rows=[{h:26,cells:[{c:0,v:co()+' — '+yr(),s:Object.assign({b:1,sz:15,color:'12382F',fill:'E3F1EC',v:'center'},base)},{c:1,v:'',s:{fill:'E3F1EC'}},{c:2,v:'',s:{fill:'E3F1EC'}},{c:3,v:'',s:{fill:'E3F1EC'}},{c:4,v:'',s:{fill:'E3F1EC'}}]},
    {h:18,cells:[{c:0,v:(isAr()?'فهرس أوراق العمل — ':'Worksheet index — ')+meta.length+'   |   '+stamp(),s:Object.assign({sz:9,color:'55635F',fill:'E3F1EC'},base)},{c:1,v:'',s:{fill:'E3F1EC'}},{c:2,v:'',s:{fill:'E3F1EC'}},{c:3,v:'',s:{fill:'E3F1EC'}},{c:4,v:'',s:{fill:'E3F1EC'}}]},{h:8,cells:[]},
    {h:22,cells:H.map((v,c)=>({c,v,s:ST_IDX_H}))}];const links=[];
   meta.forEach((m,i)=>{const r=rows.length;rows.push({h:20,cells:[{c:0,v:i+1,s:Object.assign({},ST_IDX,{h:'center'})},{c:1,v:m.ref,s:Object.assign({},ST_IDX,{b:1})},{c:2,v:m.title,s:Object.assign({},ST_IDX,base)},{c:3,v:secName(m.sec),s:Object.assign({},ST_IDX,base)},{c:4,v:m.nm,s:ST_LINK}]});links.push({ref:'E'+(r+1),loc:"'"+m.nm.replace(/'/g,"''")+"'!A1",tip:m.title,disp:m.nm})});
   const idx={name:idxName,rtl,grid:false,landscape:false,cols:[6,12,70,32,24],rows,merges:['A1:E1','A2:E2'],links,validations:[],freezeRows:4,tab:'FF1F6F5C',header:hf().header,footer:hf().footer};
   overlay({t:isAr()?'جارٍ ضغط وحفظ الملف…':'Compressing and saving…',p:.97});await tick();
   await save([idx].concat(sheets),(isAr()?'كل أوراق العمل - ':'All worksheets - ')+co()+' '+yr());
   audit('export.all',{fmt:'xlsx',sheets:sheets.length});toast((isAr()?'تم تصدير ':'Exported ')+sheets.length+(isAr()?' ورقة عمل في ملف واحد.':' worksheets in one file.'),'s')}
  catch(e){fail(e)}finally{if(S)S.close();unoverlay();busy.on=false}}

 /* ---- UI: export button in every engagement page's breadcrumb bar ---- */
 function addBtn(){const bcr=document.querySelector('#main nav.bc .bcr');if(!bcr||bcr.querySelector('.xlbtn'))return;
  const b=document.createElement('button');b.type='button';b.className='btn sm xlbtn';b.dataset.act='xlpage';b.title=isAr()?'تصدير هذه الصفحة/الورقة إلى Excel بكامل محتواها وتنسيقها':'Export this page/worksheet to Excel with full content and formatting';b.textContent=isAr()?'⤓ Excel':'⤓ Excel';bcr.insertBefore(b,bcr.firstChild)}
 document.addEventListener('meap:routed',()=>setTimeout(addBtn,0));
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-act="xlpage"],[data-act="xlall"],[data-act="xlall-content"]');if(!b)return;e.preventDefault();e.stopPropagation();
  if(b.dataset.act==='xlpage')exportPage();else exportAll(b.dataset.act==='xlall-content'?'content':'all')},true);
 return{exportWP,exportPage,exportAll,allRefs};
})();
/* single-worksheet export (existing buttons / data-act="wpxlsx") now exports the whole page with formatting */
wpXlsxExport=function(ref){return XU.exportWP(ref)};
/* bulk export buttons on the worksheet library page */
(function(){const o=V.wplib;V.wplib=function(){const h=o.apply(this,arguments);const ar=(PREF&&PREF.lang)!=='en';
 const bar=`<div class="xlbulk noprint"><button type="button" class="btn pri" data-act="xlall">⤓ ${ar?'تصدير كل أوراق العمل إلى Excel (ملف واحد)':'Export ALL worksheets to Excel (one file)'}</button> <button type="button" class="btn" data-act="xlall-content">⤓ ${ar?'تصدير الأوراق التي بها بيانات فقط':'Export only worksheets with data'}</button></div>`;
 const i=h.indexOf('</h1>');return i<0?bar+h:h.slice(0,i+5)+bar+h.slice(i+5)}})();
