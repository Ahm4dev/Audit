import threading, functools, http.server, json, os, sys, time, base64
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIX = os.path.join(ROOT, 'tests', 'fixtures')
OUT = os.path.join(ROOT, 'tests', 'out'); os.makedirs(OUT, exist_ok=True)

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()

_srv = None
def serve(port=8765):
    global _srv
    if _srv: return
    h = functools.partial(Q, directory=ROOT)
    _srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), h)
    threading.Thread(target=_srv.serve_forever, daemon=True).start()

class App:
    def __init__(self, settings=None, block_net=True, headless=True, viewport=(1500, 950)):
        serve()
        self.pw = sync_playwright().start()
        self.br = self.pw.chromium.launch(headless=headless, args=['--disable-web-security=false'])
        self.ctx = self.br.new_context(viewport={'width': viewport[0], 'height': viewport[1]}, accept_downloads=True, locale='ar-EG')
        st = {'libBase': '/libs/', 'workers': '2', 'store': False}
        st.update(settings or {})
        self.ctx.add_init_script(f"localStorage.setItem('docrebuild.settings', JSON.stringify({json.dumps(st)}));")
        if block_net:
            self.ctx.route(lambda u: not u.startswith('http://127.0.0.1') and not u.startswith('data:') and not u.startswith('blob:'), lambda r: r.abort())
        self.page = self.ctx.new_page()
        self.logs = []
        self.page.on('console', lambda m: self.logs.append(f'[{m.type}] {m.text}'))
        self.page.on('pageerror', lambda e: self.logs.append(f'[pageerror] {e}'))
        self.page.on('dialog', lambda d: d.accept())
        self.page.goto('http://127.0.0.1:8765/doc-rebuilder.html')
        self.page.wait_for_function('window.APP !== undefined')

    def open(self, name, timeout=60000):
        path = name if os.path.isabs(name) else os.path.join(FIX, name)
        n0 = self.page.evaluate('APP.files.length')
        self.page.set_input_files('#fileIn', path)
        self.page.wait_for_function(f'APP.files.length > {n0} && APP.cur && APP.cur.pages.length > 0 || document.getElementById("info").className==="err"', timeout=timeout)
        time.sleep(0.3)
        return self.page.evaluate('document.getElementById("info").textContent')

    def run(self, pages=None, mode=None, timeout=900000):
        js = 'async ([p,m]) => { await APP.run([APP.cur], p, m); return document.getElementById("info").textContent; }'
        return self.page.evaluate(js, [pages, mode])

    def pages(self):
        return self.page.evaluate('''APP.cur.pages.map(p => ({n:p.n, status:p.status, error:p.error, meta:p.meta && Object.assign({}, p.meta, {base:undefined}), html: document.querySelector(`.pg[data-n="${p.n}"] .ed`).innerHTML, text: VALID.textOf(document.querySelector(`.pg[data-n="${p.n}"] .ed`))}))''')

    def export(self, fmt, mode='preserve', fname=None, extra=None):
        """Use the real export dialog flow."""
        p = self.page
        p.click('#bExport')
        p.check(f'input[name=xf][value={fmt}]')
        if fmt in ('docx', 'html'): p.check(f'input[name=xm][value={mode}]')
        for k, v in (extra or {}).items():
            if isinstance(v, bool): (p.check if v else p.uncheck)(k)
            else: p.select_option(k, v)
        with p.expect_download(timeout=600000) as d:
            p.click('#xGo')
        dl = d.value
        path = os.path.join(OUT, fname or dl.suggested_filename)
        dl.save_as(path)
        p.evaluate("document.getElementById('dlgExport').close()")
        return path

    def shot(self, name, full=False):
        path = os.path.join(OUT, name); self.page.screenshot(path=path, full_page=full); return path

    def close(self):
        try: self.br.close(); self.pw.stop()
        except Exception: pass
