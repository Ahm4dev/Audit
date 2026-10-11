/* MEAP · v10 · Risk library: live filters (text, level, significant/fraud, source, assertion) */
'use strict';
(function(){
 const old=V.risks;
 V.risks=function(f){f=f||'';const ar=(PREF&&PREF.lang)!=='en';const T=(a,e)=>ar?a:e;
  const base=old(f==='sig'||f==='fr'||f==='H'?'':'');           /* header, methodology card */
  const i=base.indexOf('<div class="tabs">');const head=i<0?base:base.slice(0,i);
  const srcs=Object.keys(SRCN||{});const asr=Object.keys(ASR||{});
  const opt=(v,l,sel)=>`<option value="${esc(v)}"${sel?' selected':''}>${esc(l)}</option>`;
  const bar=`<div class="fbar noprint rkbar" role="search" aria-label="${T('تصفية المخاطر','Filter risks')}">
   <input class="in" type="search" id="rkq" placeholder="${T('بحث في وصف الخطر…','Search risk description…')}" aria-label="${T('بحث','Search')}">
   <select class="sel" id="rklv" aria-label="${T('المستوى','Level')}">${opt('',T('كل المستويات','All levels'))}${opt('H','High',f==='H')}${opt('M','Medium')}${opt('L','Low')}</select>
   <select class="sel" id="rkty" aria-label="${T('النوع','Type')}">${opt('',T('الكل (جوهري/احتيال)','All (significant/fraud)'))}${opt('sig',T('جوهري Significant','Significant'),f==='sig')}${opt('fr',T('احتيال Fraud','Fraud'),f==='fr')}</select>
   <select class="sel" id="rksrc" aria-label="${T('المصدر','Source')}">${opt('',T('كل المصادر','All sources'))}${srcs.map(k=>opt(k,SRCN[k])).join('')}</select>
   <select class="sel" id="rkas" aria-label="${T('التأكيد','Assertion')}">${opt('',T('كل التأكيدات','All assertions'))}${asr.map(k=>opt(k,(ASR[k][1]||k)+' — '+ASR[k][0])).join('')}</select>
   <button type="button" class="btn sm" id="rkclr">${T('مسح الفلاتر','Clear')}</button><span class="mut" id="rkcnt" aria-live="polite"></span></div>`;
  const rows=RISKS.map(r=>`<tr data-lv="${esc(r.lv)}" data-sig="${r.sig?1:0}" data-fr="${r.fr?1:0}" data-src="${esc(r.src)}" data-as="${esc((r.as||[]).join(','))}" data-q="${esc(normAr(r.d+' '+r.sn))}"><td class="mut">${esc(r.id.split(':').slice(-2).join('-'))}</td><td class="tx">${esc(r.d)}</td><td>${lvB(r.lv)}</td><td>${r.sig?'<span class="b sig">Significant Risk</span>':''}${r.fr?'<span class="b fr">Fraud Risk</span>':''}</td><td>${asB(r.as)}</td><td><span class="mut">${SRCN[r.src]}:</span> <a href="${L(r.href)}">${esc(r.sn)}</a></td></tr>`).join('');
  const tbl=`<div class="tw"><table id="rktbl"><thead><tr><th>#</th><th>${T('وصف الخطر','Risk description')}</th><th>${T('المستوى','Level')}</th><th>${T('جوهري/احتيال','Significant/Fraud')}</th><th>${T('التأكيدات','Assertions')}</th><th>${T('المصدر','Source')}</th></tr></thead><tbody>${rows}</tbody></table><p class="note" id="rkempty" hidden>${T('لا توجد مخاطر مطابقة للفلاتر.','No risks match the filters.')}</p></div>`;
  return head+bar+tbl};
 function apply(){const q=normAr((document.getElementById('rkq')||{}).value||'');const lv=document.getElementById('rklv').value,ty=document.getElementById('rkty').value,sr=document.getElementById('rksrc').value,as=document.getElementById('rkas').value;let n=0;
  document.querySelectorAll('#rktbl tbody tr').forEach(tr=>{const d=tr.dataset;const ok=(!q||d.q.includes(q))&&(!lv||d.lv===lv)&&(!ty||(ty==='sig'?d.sig==='1':d.fr==='1'))&&(!sr||d.src===sr)&&(!as||(','+d.as+',').includes(','+as+','));tr.hidden=!ok;if(ok)n++});
  const c=document.getElementById('rkcnt');if(c)c.textContent=n+' / '+RISKS.length;const e=document.getElementById('rkempty');if(e)e.hidden=n>0}
 const on=e=>{if(e.target.closest&&e.target.closest('.rkbar'))apply()};document.addEventListener('input',on);document.addEventListener('change',on);
 document.addEventListener('click',e=>{if(e.target.id==='rkclr'){document.querySelectorAll('.rkbar input,.rkbar select').forEach(x=>x.value='');apply()}});
 document.addEventListener('meap:routed',e=>{if(e.detail&&e.detail.view==='risks')apply()});
})();
