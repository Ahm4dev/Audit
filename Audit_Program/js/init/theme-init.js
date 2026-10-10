/*HEADTHEME*/(function(){var p={};try{p=JSON.parse(localStorage.getItem('meap.prefs')||'{}')||{}}catch(e){/* storage blocked: defaults apply, full fallback runs later */}
var th=p.theme==='dark'?'dark':'light',d=document.documentElement;
if(p.theme==='system'){try{th=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){/* no matchMedia: light */}}
d.setAttribute('data-theme',th);d.setAttribute('data-eff',th);if(p.density)d.setAttribute('data-density',p.density);if(p.lang==='en'){d.lang='en';d.dir='ltr'}
var m=document.querySelector('meta[name="color-scheme"]');if(m)m.content=th;var c=document.querySelector('meta[name="theme-color"]');if(c)c.content=th==='dark'?'#0a1f3b':'#0f3a68'})();
