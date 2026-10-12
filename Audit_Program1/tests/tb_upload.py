# Audit-Plus · trial-balance upload test: drives the real UI (drop-zone file input → Web Worker parser).
#   python3 tests/tb_upload.py dist/index.html
import sys, os, tempfile
from playwright.sync_api import sync_playwright
SRC = sys.argv[1] if len(sys.argv) > 1 else 'dist/index.html'
URL = SRC if SRC.startswith('http') else 'file://' + os.path.abspath(SRC)
URL += ('&' if '?' in URL else '?') + 'ap-debug'
PRE = "const A=(typeof __AP!=='undefined')?__AP:{CO,createEngagement,SAVER};"
csv = "رمز الحساب,اسم الحساب,رصيد افتتاحي,مدين,دائن,رصيد ختامي\n" + "\n".join(
    f"{1000+i},حساب رقم {i},{i*100},{i*10},{i*5},{i*100+i*5}" for i in range(1, 41)) + "\n"
f = os.path.join(tempfile.mkdtemp(), 'tb.csv'); open(f, 'w', encoding='utf-8').write(csv)
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={'width': 1280, 'height': 900}, locale='ar').new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.on('console', lambda m: errs.append(m.text[:200]) if m.type == 'error' else None)
    pg.goto(URL); pg.wait_for_selector('.gate')
    for n, v in {'u': 'admin', 'd': 'Admin', 'p': '123', 'p2': '123'}.items(): pg.fill(f'.gate input[name="{n}"]', v)
    pg.click('.gate form button:not([type=button])'); pg.wait_for_selector('#top')
    pg.evaluate("async()=>{" + PRE + "const c=await A.CO.save({id:'001',name:'شركة اختبار',industry:''});await A.createEngagement(c,{year:'2026'});await A.SAVER.flush(true)}")
    pg.evaluate("location.hash='#/e/001/2026/tb/upload'"); pg.wait_for_selector('[data-tbdz]', timeout=10000)
    pg.set_input_files('[data-tbdz] input[type=file]', f)
    pg.wait_for_function("document.querySelector('#main').innerText.includes('ربط الأعمدة')", timeout=20000)
    txt = pg.inner_text('#main')
    ok_rows = 'tb.csv' in txt and '41 صف' in txt   # the worker read all 41 lines (header + 40 accounts)
    bad = pg.query_selector('#main .note.bad')
    print('worker parsed the CSV (41 rows) and the mapping step is shown:', ok_rows, '| error banner:', bad.inner_text()[:80] if bad else 'none')
    print('page text sample:', txt[:160].replace('\n', ' | '))
    b.close()
print('JS errors:', errs[:5] or 'none')
sys.exit(0 if (ok_rows and not bad and not errs) else 1)
