/* Audit-Plus · Core utilities, i18n, preferences, storage backends */

import { hub } from '../hub.js';

/* ================= a1 · Core utilities, i18n, preferences, storage backends ================= */
const VERSION = '3.0.0',
  SCHEMA = 3;
const $ = (s, r) => (r || document).querySelector(s),
  $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s =>
  String(s == null ? '' : s).replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
const split = s =>
  String(s == null ? '' : s)
    .split(/[,\s]+/)
    .filter(Boolean);
function fnv(s) {
  s = String(s);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
/* Arabic/English search normalisation: alef forms, ya/alef-maqsura, ta-marbuta/ha, hamza seats, diacritics & tatweel removed, Arabic-Indic & Persian digits → ASCII */
function normAr(s) {
  return String(s == null ? '' : s)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u064A')
    .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x660))
    .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x6f0))
    .replace(/\s+/g, ' ')
    .trim();
}
const pad2 = n => String(Math.floor(n)).padStart(2, '0');
/* Local time (fixes v1 bug: dates were produced with toISOString() = UTC) */
function localISO(d) {
  d = d == null ? new Date() : new Date(d);
  const o = -d.getTimezoneOffset(),
    s = o >= 0 ? '+' : '-',
    a = Math.abs(o);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}${s}${pad2(a / 60)}:${pad2(a % 60)}`;
}
const today = () => localISO().slice(0, 10);
const fmtDT = ms => {
  if (!ms) return '';
  const d = new Date(ms);
  if (isNaN(d)) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const fmtT = ms => {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
/* B9: cryptographically strong ids (crypto.randomUUID, fallback getRandomValues) – no Math.random */
function rndHex(n) {
  if (n >= 32 && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, n);
  const a = new Uint8Array(Math.ceil(n / 2));
  crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, n);
}
function rnd36(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  const c = '0123456789abcdefghijklmnopqrstuvwxyz';
  let s = '';
  for (const b of a) s += c[b % 36];
  return s;
}
const uid = p => (p || '') + Date.now().toString(36) + rnd36(6);
const num = v => {
  const n = parseFloat(
    String(v == null ? '' : v)
      .replace(/[\u0660-\u0669]/g, d => d.charCodeAt(0) - 0x660)
      .replace(/[\u06F0-\u06F9]/g, d => d.charCodeAt(0) - 0x6f0)
      .replace(/٫/g, '.')
      .replace(/[,\s٬،]/g, '')
  );
  return isFinite(n) ? n : 0;
};
const fmtN = v => (isFinite(v) && v ? Math.round(v).toLocaleString('en-US') : '-');
const fmtSize = b =>
  b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const jeq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function b64(buf) {
  const a = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000));
  return btoa(s);
}
function unb64(s) {
  const b = atob(s),
    a = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
  return a;
}
/* File / folder names: strip characters forbidden on Windows/macOS/Linux and reserved device names */
function sanitizeName(s, max) {
  max = max || 60;
  s = String(s == null ? '' : s)
    .normalize('NFC')
    .replace(/[<>:"/\\|?*\u0000-\u001F\u007F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '')
    .replace(/^[. ]+/, '');
  if (/^(con|prn|aux|nul|com\d|lpt\d)(\..*)?$/i.test(s)) s = '_' + s;
  if (s.length > max) s = s.slice(0, max).replace(/[. ]+$/, '');
  return s || '_';
}

/* ---------- Device preferences (per device, not shared) ---------- */
/* B7: central error log – a ring buffer (500 entries) kept in memory and mirrored to localStorage; shown in Settings › System log */
const ERRLOG = (() => {
  let a = [];
  try {
    a = JSON.parse(localStorage.getItem('meap.errlog') || '[]');
  } catch (e) {
    /* storage unavailable: keep in memory only (intentional) */
  }
  return a;
})();
let _errSave = 0;
function logErr(ctx, e, level) {
  const m =
    e && (e.message || e.name)
      ? String(e.name && e.name !== 'Error' ? e.name + ': ' : '') + String(e.message || '')
      : String(e == null ? '' : e);
  ERRLOG.push({
    t: Date.now(),
    ctx: String(ctx),
    lv: level || 'error',
    m: m.slice(0, 500),
    st: e && e.stack ? String(e.stack).split('\n').slice(0, 3).join(' | ').slice(0, 400) : '',
  });
  if (ERRLOG.length > 500) ERRLOG.splice(0, ERRLOG.length - 500);
  clearTimeout(_errSave);
  _errSave = setTimeout(() => {
    try {
      localStorage.setItem('meap.errlog', JSON.stringify(ERRLOG));
    } catch (x) {
      /* cannot persist the log itself – nothing else to report to (intentional) */
    }
  }, 400);
  if (level !== 'info' && typeof console !== 'undefined' && window.__MEAP_DEBUG) console.warn('[Audit-Plus]', ctx, e);
}
window.addEventListener('error', ev => logErr('window.onerror', ev.error || ev.message));
window.addEventListener('unhandledrejection', ev => logErr('unhandledrejection', ev.reason));
const LS = (() => {
  let st = null,
    bad = false;
  try {
    st = window.localStorage;
    st.getItem('meap.probe');
  } catch (e) {
    bad = true;
    st = null;
    logErr('localStorage unavailable – using in-memory + IndexedDB fallbacks', e, 'warn');
  }
  const mem = new Map();
  return {
    avail: !bad,
    get(k, d) {
      if (!st) {
        return mem.has(k) ? JSON.parse(mem.get(k)) : d;
      }
      try {
        const v = st.getItem(k);
        return v == null ? d : JSON.parse(v);
      } catch (e) {
        logErr('LS.get ' + k, e, 'warn');
        return d;
      }
    },
    set(k, v) {
      if (!st) {
        mem.set(k, JSON.stringify(v));
        return false;
      }
      try {
        st.setItem(k, JSON.stringify(v));
        return true;
      } catch (e) {
        logErr('LS.set ' + k, e, 'warn');
        return false;
      }
    },
    del(k) {
      if (!st) {
        mem.delete(k);
        return;
      }
      try {
        st.removeItem(k);
      } catch (e) {
        logErr('LS.del ' + k, e, 'warn');
      }
    },
  };
})();
/* B8: every Blob URL is registered by scope and revoked on close / navigation / re-render */
const BLOBURL = {
  m: new Map(),
  make(blob, scope) {
    const u = URL.createObjectURL(blob);
    this.m.set(u, scope || 'view');
    return u;
  },
  revoke(u) {
    if (this.m.has(u)) {
      URL.revokeObjectURL(u);
      this.m.delete(u);
    }
  },
  scope(sc) {
    for (const [u, s] of [...this.m])
      if (s === sc) {
        URL.revokeObjectURL(u);
        this.m.delete(u);
      }
  },
  all() {
    for (const u of this.m.keys()) URL.revokeObjectURL(u);
    this.m.clear();
  },
  count() {
    return this.m.size;
  },
};
function downloadBlob(blob, name) {
  const u = BLOBURL.make(blob, 'dl');
  const a = document.createElement('a');
  a.href = u;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => BLOBURL.revoke(u), 30000);
}
const PREF = Object.assign(
  { lang: 'ar', theme: 'light', font: 1, density: 'comfy', nav: {} },
  LS.get('meap.prefs', {})
);
/* v4: only light / dark. A previously saved "system" value is converted once to whatever the OS prefers right now. */
if (PREF.theme !== 'light' && PREF.theme !== 'dark') {
  let dk = false;
  try {
    dk = !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  } catch (e) {
    /* light */
  }
  PREF.theme = PREF.theme === 'system' && dk ? 'dark' : 'light';
}
/* D: preferences persist in localStorage AND in IndexedDB (fallback when localStorage is blocked, e.g. some file:// or private contexts) */
let PREF_PERSIST_OK = true;
function savePrefs() {
  PREF_PERSIST_OK = LS.set('meap.prefs', PREF);
  const fail = e => {
    logErr('KV prefs', e, 'warn');
    if (!PREF_PERSIST_OK && typeof hub.toast === 'function') hub.toast(t('prefNotSaved'), 'w', 6000);
  };
  try {
    KV.set('prefs', JSON.parse(JSON.stringify(PREF))).catch(fail);
  } catch (e) {
    fail(e);
  }
  return true;
}
async function loadPrefsFallback() {
  if (LS.avail && LS.get('meap.prefs', null)) return false;
  try {
    const p = await KV.get('prefs');
    if (p && typeof p === 'object') {
      Object.assign(PREF, p);
      applyPrefs();
      return true;
    }
  } catch (e) {
    logErr('KV prefs load', e, 'warn');
  }
  return false;
}
const MQ_DARK = null;
const effTheme = () => (PREF.theme === 'dark' ? 'dark' : 'light');
function applyPrefs() {
  const r = document.documentElement;
  r.lang = PREF.lang;
  r.dir = PREF.lang === 'en' ? 'ltr' : 'rtl';
  r.dataset.theme = PREF.theme;
  r.dataset.eff = effTheme();
  r.dataset.density = PREF.density || 'comfy';
  r.style.setProperty('--fs-scale', String(PREF.font || 1));
  const cs = $('meta[name="color-scheme"]');
  if (cs) cs.content = effTheme();
  const tc = $('meta[name="theme-color"]');
  if (tc) tc.content = effTheme() === 'dark' ? '#151e21' : '#ffffff';
  const tb = $('#themeBtn');
  if (tb) {
    const L = { light: ['☀️', t('light')], dark: ['🌙', t('dark')] }[effTheme()];
    tb.textContent = L[0];
    tb.title = t('theme') + ': ' + L[1];
    tb.setAttribute('aria-label', t('theme') + ': ' + L[1] + ' — ' + t('themeCycle'));
  }
}
function cycleTheme() {
  PREF.theme = PREF.theme === 'dark' ? 'light' : 'dark';
  savePrefs();
  applyPrefs();
  if (typeof hub.toast === 'function') hub.toast(t('theme') + ': ' + t(PREF.theme), 'i', 1800);
  document.querySelectorAll('[data-pref="theme"]').forEach(el => {
    el.value = PREF.theme;
  });
}
let DEVICE = LS.get('meap.device', null);
if (!DEVICE) {
  DEVICE = rnd36(10);
  LS.set('meap.device', DEVICE);
}

/* ---------- Interface language (app chrome; professional content is bilingual by design) ---------- */
const I18N = {
  ar: {
    companies: 'الشركات',
    company: 'الشركة',
    engagement: 'الارتباط',
    engagements: 'الارتباطات',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    search: 'بحث',
    searchPh: 'بحث شامل: حساب، خطر، إجراء، ورقة عمل، ملاحظة… (Ctrl+K)',
    searchAllPh: 'بحث في كل الشركات والارتباطات…',
    saved: 'تم الحفظ',
    saving: 'جارٍ الحفظ…',
    saveFail: 'فشل الحفظ',
    retry: 'إعادة المحاولة',
    undo: 'تراجع',
    menu: 'القائمة',
    home: 'الرئيسية',
    addCompany: 'إضافة شركة',
    edit: 'تعديل',
    archive: 'أرشفة',
    unarchive: 'استعادة',
    open: 'فتح',
    save: 'حفظ',
    cancel: 'إلغاء',
    close: 'إغلاق',
    del: 'حذف',
    confirm: 'تأكيد',
    login: 'تسجيل الدخول',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    display: 'الاسم المعروض',
    role: 'الدور',
    admin: 'مدير',
    reviewer: 'مراجع',
    assistant: 'مساعد',
    viewer: 'مشاهد',
    newEng: 'ارتباط جديد',
    clone: 'استنساخ للسنة التالية',
    showArchived: 'إظهار المؤرشف',
    noData: 'لا توجد بيانات.',
    year: 'السنة المالية',
    skip: 'تخطي إلى المحتوى',
    theme: 'الثيم',
    lang: 'اللغة',
    font: 'حجم الخط',
    light: 'فاتح',
    dark: 'داكن',
    system: 'تلقائي (حسب النظام)',
    readonly: 'وضع القراءة فقط (مشاهد)',
    online: 'يعمل الآن',
    themeCycle: 'اضغط للتبديل بين الوضع الفاتح والداكن',
    prefNotSaved: 'تعذّر حفظ التفضيل في هذا المتصفح؛ سيُطبَّق في هذه الجلسة فقط',
    partner: 'شريك',
    eqr: 'مراجع جودة',
  },
  en: {
    companies: 'Companies',
    company: 'Company',
    engagement: 'Engagement',
    engagements: 'Engagements',
    settings: 'Settings',
    logout: 'Sign out',
    search: 'Search',
    searchPh: 'Search accounts, risks, procedures, working papers, findings… (Ctrl+K)',
    searchAllPh: 'Search across all companies and engagements…',
    saved: 'Saved',
    saving: 'Saving…',
    saveFail: 'Save failed',
    retry: 'Retry',
    undo: 'Undo',
    menu: 'Menu',
    home: 'Home',
    addCompany: 'Add company',
    edit: 'Edit',
    archive: 'Archive',
    unarchive: 'Restore',
    open: 'Open',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    del: 'Delete',
    confirm: 'Confirm',
    login: 'Sign in',
    username: 'Username',
    password: 'Password',
    display: 'Display name',
    role: 'Role',
    admin: 'Administrator',
    reviewer: 'Reviewer',
    assistant: 'Assistant',
    viewer: 'Viewer',
    newEng: 'New engagement',
    clone: 'Clone to next year',
    showArchived: 'Show archived',
    noData: 'No data.',
    year: 'Fiscal year',
    skip: 'Skip to content',
    theme: 'Theme',
    lang: 'Language',
    font: 'Font size',
    light: 'Light',
    dark: 'Dark',
    system: 'Auto (system)',
    readonly: 'Read-only mode (viewer)',
    online: 'Working now',
    themeCycle: 'Click to switch between Light and Dark',
    prefNotSaved: 'Could not save the preference in this browser; applies to this session only',
    partner: 'Partner',
    eqr: 'Quality reviewer',
  },
};
const t = k => (I18N[PREF.lang] || I18N.ar)[k] || I18N.ar[k] || k;

/* ---------- Small device key/value store (IndexedDB): folder handle, session ---------- */
const KV = (() => {
  let dbp;
  const db = () =>
    dbp ||
    (dbp = new Promise((res, rej) => {
      const r = indexedDB.open('meap-local', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
  const tx = (mode, fn) =>
    db().then(
      d =>
        new Promise((res, rej) => {
          const x = d.transaction('kv', mode),
            s = x.objectStore('kv');
          const r = fn(s);
          x.oncomplete = () => res(r && r.result);
          x.onerror = () => rej(x.error);
          x.onabort = () => rej(x.error || new Error('abort'));
        })
    );
  return {
    get: k => tx('readonly', s => s.get(k)),
    set: (k, v) => tx('readwrite', s => s.put(v, k)),
    del: k => tx('readwrite', s => s.delete(k)),
  };
})();

/* ---------- Storage backend A: browser storage (IndexedDB) virtual folder tree ---------- */
function IDBFS() {
  let dbp;
  const db = () =>
    dbp ||
    (dbp = new Promise((res, rej) => {
      const r = indexedDB.open('meap-vfs', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('f', { keyPath: 'p' });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
  const run = (mode, fn) =>
    db().then(
      d =>
        new Promise((res, rej) => {
          const x = d.transaction('f', mode),
            s = x.objectStore('f');
          let out;
          fn(s, v => {
            out = v;
          });
          x.oncomplete = () => res(out);
          x.onerror = () => rej(x.error || new Error('IndexedDB error'));
          x.onabort = () => rej(x.error || new Error('IndexedDB aborted (storage may be full)'));
        })
    );
  const norm = p => String(p).replace(/^\/+|\/+$/g, '');
  const getRec = p =>
    run('readonly', (s, set) => {
      const g = s.get(norm(p));
      g.onsuccess = () => set(g.result);
    });
  return {
    kind: 'idb',
    label: 'IndexedDB',
    async readText(p) {
      const r = await getRec(p);
      if (!r) return null;
      return typeof r.d === 'string' ? r.d : await r.d.text();
    },
    async readBlob(p) {
      const r = await getRec(p);
      if (!r) return null;
      return r.d instanceof Blob ? r.d : new Blob([r.d]);
    },
    writeText: (p, txt) =>
      run('readwrite', s => {
        s.put({ p: norm(p), d: String(txt), m: Date.now(), s: String(txt).length });
      }),
    writeBlob: (p, b) =>
      run('readwrite', s => {
        s.put({ p: norm(p), d: b, m: Date.now(), s: b.size });
      }),
    appendText: (p, txt) =>
      run('readwrite', s => {
        p = norm(p);
        const g = s.get(p);
        g.onsuccess = () => {
          const o = g.result;
          const d = (o && typeof o.d === 'string' ? o.d : '') + txt;
          s.put({ p, d, m: Date.now(), s: d.length });
        };
      }),
    async stat(p) {
      const r = await getRec(p);
      return r ? { size: r.s, mtime: r.m } : null;
    },
    async list(dir) {
      dir = norm(dir);
      const pre = dir ? dir + '/' : '';
      const keys = await run('readonly', (s, set) => {
        const g = s.getAllKeys(IDBKeyRange.bound(pre, pre + '￿'));
        g.onsuccess = () => set(g.result);
      });
      const m = new Map();
      for (const k of keys) {
        const rest = k.slice(pre.length);
        if (!rest) continue;
        const i = rest.indexOf('/');
        if (i < 0) {
          if (rest !== '.keep') m.set(rest, 'file');
        } else m.set(rest.slice(0, i), 'directory');
      }
      return [...m].map(([name, kind]) => ({ name, kind }));
    },
    mkdir: dir =>
      run('readwrite', s => {
        s.put({ p: norm(dir) + '/.keep', d: '', m: Date.now(), s: 0 });
      }),
    remove: p =>
      run('readwrite', s => {
        p = norm(p);
        s.delete(p);
        s.delete(IDBKeyRange.bound(p + '/', p + '/￿'));
      }),
    async wipe() {
      await run('readwrite', s => {
        s.clear();
      });
    },
  };
}

/* ---------- Storage backend B: a real folder chosen by the user (File System Access API) ----------
   Safe write: createWritable() writes into a temporary swap file and replaces the target atomically
   only when close() succeeds; on error abort() discards the temp file and the original stays intact. */
function FSFS(root) {
  const parts = p => String(p).split('/').filter(Boolean);
  const nf = e => e && (e.name === 'NotFoundError' || e.name === 'TypeMismatchError' || e.name === 'NotFoundErr');
  async function dir(ps, create) {
    let d = root;
    for (const n of ps) d = await d.getDirectoryHandle(n, { create });
    return d;
  }
  async function fh(p, create) {
    const ps = parts(p);
    const name = ps.pop();
    const d = await dir(ps, create);
    return d.getFileHandle(name, { create });
  }
  async function writeBlob(p, b) {
    const h = await fh(p, true);
    const w = await h.createWritable();
    try {
      await w.write(b);
      await w.close();
    } catch (e) {
      try {
        await w.abort();
      } catch (_) {
        /* abort after a failed write; the original error is re-thrown (intentional) */
      }
      throw e;
    }
  }
  return {
    kind: 'fs',
    root,
    label: root.name,
    async readText(p) {
      try {
        return await (await (await fh(p, false)).getFile()).text();
      } catch (e) {
        if (nf(e)) return null;
        throw e;
      }
    },
    async readBlob(p) {
      try {
        return await (await fh(p, false)).getFile();
      } catch (e) {
        if (nf(e)) return null;
        throw e;
      }
    },
    writeText: (p, txt) => writeBlob(p, new Blob([String(txt)], { type: 'application/json' })),
    writeBlob,
    async appendText(p, txt) {
      const h = await fh(p, true);
      const f = await h.getFile();
      const w = await h.createWritable({ keepExistingData: true });
      try {
        await w.write({ type: 'write', position: f.size, data: txt });
        await w.close();
      } catch (e) {
        try {
          await w.abort();
        } catch (_) {
          /* abort after a failed write; the original error is re-thrown (intentional) */
        }
        throw e;
      }
    },
    async stat(p) {
      try {
        const f = await (await fh(p, false)).getFile();
        return { size: f.size, mtime: f.lastModified };
      } catch (e) {
        if (nf(e)) return null;
        throw e;
      }
    },
    async list(p) {
      let d;
      try {
        d = await dir(parts(p), false);
      } catch (e) {
        if (nf(e)) return [];
        throw e;
      }
      const out = [];
      for await (const [name, h] of d.entries()) {
        if (name.endsWith('.crswap') || name === '.keep') continue;
        out.push({ name, kind: h.kind });
      }
      return out;
    },
    mkdir: async p => {
      await dir(parts(p), true);
    },
    async remove(p) {
      const ps = parts(p);
      const name = ps.pop();
      try {
        const d = await dir(ps, false);
        await d.removeEntry(name, { recursive: true });
      } catch (e) {
        if (!nf(e)) throw e;
      }
    },
  };
}

const FSA_OK = typeof window.showDirectoryPicker === 'function';
async function copyTree(src, dst, path, progress, opts) {
  opts = opts || {};
  let n = 0;
  const items = await src.list(path);
  for (const it of items) {
    const p = path ? path + '/' + it.name : it.name;
    if (it.kind === 'directory') {
      await dst.mkdir(p);
      n += await copyTree(src, dst, p, progress, opts);
    } else {
      if (opts.skipExisting && (await dst.stat(p))) {
        if (/\/_ops\/[^/]+\.jsonl$/.test('/' + p)) {
          /* union of op lines – LWW makes duplicates harmless */ const a = (await src.readText(p)) || '',
            b = (await dst.readText(p)) || '';
          const have = new Set(b.split('\n'));
          const add = a.split('\n').filter(l => l && !have.has(l));
          if (add.length) await dst.appendText(p, add.join('\n') + '\n');
        }
        continue;
      }
      const b = await src.readBlob(p);
      if (b) {
        await dst.writeBlob(p, b);
        n++;
        progress && progress(n, p);
      }
    }
  }
  return n;
}
async function countFiles(fs, path) {
  let n = 0;
  for (const it of await fs.list(path)) {
    const p = path ? path + '/' + it.name : it.name;
    n += it.kind === 'directory' ? await countFiles(fs, p) : 1;
  }
  return n;
}

export {
  $,
  $$,
  BLOBURL,
  DEVICE,
  ERRLOG,
  FSA_OK,
  FSFS,
  IDBFS,
  KV,
  LS,
  PREF,
  SCHEMA,
  VERSION,
  applyPrefs,
  b64,
  copyTree,
  countFiles,
  cycleTheme,
  downloadBlob,
  esc,
  fmtDT,
  fmtN,
  fmtSize,
  fmtT,
  fnv,
  jeq,
  loadPrefsFallback,
  localISO,
  logErr,
  normAr,
  num,
  pad2,
  rnd36,
  sanitizeName,
  savePrefs,
  sleep,
  split,
  t,
  today,
  uid,
  unb64,
};
