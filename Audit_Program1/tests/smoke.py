# Audit-Plus smoke test (Playwright): logs in with password 123, creates a company + engagement,
# then visits every route the built-in self-test knows and reports render errors / JS errors.
#
#   pip install playwright && playwright install chromium
#   npm run build && python3 tests/smoke.py dist/index.html [ar|en] [dump.json]
#   (a dev-server URL works too:  python3 tests/smoke.py http://127.0.0.1:5173/ )
import sys, json, time, hashlib, re, os

SRC = sys.argv[1] if len(sys.argv) > 1 else 'dist/index.html'
LANG = sys.argv[2] if len(sys.argv) > 2 else 'ar'
DUMP = sys.argv[3] if len(sys.argv) > 3 else None
WAIT = int(os.environ.get('ROUTE_WAIT_MS', '25'))
if SRC.startswith('http'):
    URL = SRC
else:
    p = os.path.abspath(SRC)
    URL = 'file://' + (p if p.endswith('.html') else p + '/index.html')
URL += ('&' if '?' in URL else '?') + 'ap-debug'

# globals in the classic (pre-ES-module) build, window.__AP in the module build
PRE = "const A=(typeof __AP!=='undefined')?__AP:{CO,createEngagement,SAVER,SELFTEST,route,PREF,XT};"
errs, dumpd = [], {}
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_context(viewport={'width': 1280, 'height': 900}, locale='ar').new_page()
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)[:160]))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text[:160]) if m.type == 'error' else None)
    pg.goto(URL); pg.wait_for_selector('.gate', timeout=20000)
    for n, v in {'u': 'admin', 'd': 'Admin', 'p': '123', 'p2': '123'}.items():
        pg.fill(f'.gate input[name="{n}"]', v)
    pg.click('.gate form button:not([type=button])'); pg.wait_for_selector('#top', timeout=20000)
    print('login with password 123: OK | brand:', pg.inner_text('.brand').replace('\n', ' | '))
    pg.evaluate("async()=>{" + PRE + "const c=await A.CO.save({id:'001',name:'شركة اختبار',industry:''});await A.createEngagement(c,{year:'2026'});await A.SAVER.flush(true)}")
    routes = pg.evaluate("async()=>{" + PRE + "const cos=new Set(A.CO.list.map(c=>String(c.id)));return A.SELFTEST.routes('#/e/001/2026',{cos,engs:new Set(['001/2026']),ok:0})}")
    if os.environ.get('ROUTE_LIMIT'): routes = routes[::max(1, len(routes) // int(os.environ['ROUTE_LIMIT']))]
    print('routes:', len(routes))
    if LANG == 'en':
        pg.evaluate("()=>{" + PRE + "A.PREF.lang='en';A.XT.run()}"); pg.wait_for_timeout(1500)
        print('English dictionary entries:', pg.evaluate("typeof I18N_EN!=='undefined'?Object.keys(I18N_EN).length:0"))
    t0, bad = time.time(), []
    for r in routes:
        pg.evaluate("h=>{const A=(typeof __AP!=='undefined')?__AP:{route};if(location.hash!==h)location.hash=h;else A.route(true)}", r)
        pg.wait_for_timeout(WAIT)
        if DUMP:
            tx = pg.evaluate("()=>(document.querySelector('#main')?document.querySelector('#main').innerText:'')+'||'+(document.querySelector('#nav')?document.querySelector('#nav').innerText:'')")
            dumpd[r] = hashlib.sha1(re.sub(r'[0-9٠-٩]+', '#', tx).encode()).hexdigest()[:12]
        msg = pg.evaluate("()=>{const n=document.querySelector('#main .note.bad');return n?n.textContent.trim().slice(0,80):''}")
        if msg and ('تعذر' in msg or 'غير موجود' in msg or 'Failed' in msg or 'not found' in msg.lower()):
            bad.append((r, msg))
    print('visited %d routes in %.0fs | routes with render errors: %d' % (len(routes), time.time() - t0, len(bad)))
    for r, m in bad[:8]: print('  -', r, m)
    b.close()
if DUMP: json.dump(dumpd, open(DUMP, 'w'))
print('JS errors:', len(set(errs)))
for e in sorted(set(errs))[:10]: print(' *', e)
sys.exit(1 if (bad or errs) else 0)
