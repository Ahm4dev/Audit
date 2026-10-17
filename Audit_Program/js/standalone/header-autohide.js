/* V6 — إخفاء الهيدر عند التمرير للأسفل وإظهاره عند التمرير للأعلى */
(function(){
 var root=document.documentElement,off=false,last=window.pageYOffset||0,tick=false;
 try{if(localStorage.getItem('meap.navoff')==='1')root.classList.add('nav-off')}catch(e){}
 function topEl(){return document.getElementById('top')}
 function hh(){var t=topEl();return t?t.offsetHeight:56}
 function locked(){var t=topEl();if(!t)return true;var q=document.getElementById('q');
  return document.body.classList.contains('nav-open')||!!(q&&document.activeElement===q)}
 function set(v){if(v===off)return;off=v;root.classList.add('hdr-anim');root.classList.toggle('hdr-off',v)}
 function upd(){tick=false;var y=window.pageYOffset||0;
  if(locked()||y<=hh()){set(false);last=y;return}
  var d=y-last;if(Math.abs(d)<8)return;set(d>0);last=y}
 window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});
 window.addEventListener('hashchange',function(){set(false);last=window.pageYOffset||0});
 document.addEventListener('focusin',function(e){var t=topEl();if(t&&t.contains(e.target))set(false)});
 /* التقاط مبكر: إظهار الهيدر قبل أن يحاول الكود الأصلي نقل التركيز إلى البحث (Ctrl+K) أو عند Tab */
 document.addEventListener('keydown',function(e){if(e.key==='Tab'||((e.ctrlKey||e.metaKey)&&(e.key==='k'||e.key==='K')))set(false)},true);
 new MutationObserver(function(){if(locked())set(false)}).observe(document.body,{attributes:true,attributeFilter:['class']});
 document.addEventListener('focusout',function(e){if(e.target&&e.target.id==='q'){setTimeout(function(){var t=topEl();if(t&&document.activeElement!==e.target)t.classList.remove('ss')},120)}});
 document.addEventListener('submit',function(e){if(e.target&&e.target.id==='sf'){var t=topEl();if(t)t.classList.remove('ss')}},true);
 document.addEventListener('click',function(e){if(e.target===document.body&&document.body.classList.contains('nav-open')){document.body.classList.remove('nav-open');var b=document.getElementById('menuBtn');if(b)b.setAttribute('aria-expanded','false')}});
})();
