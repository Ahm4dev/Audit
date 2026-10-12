/* Audit-Plus · Data engine: stores, companies, engagements, op-logs, autosave, sync */

import { defineHub, hub } from '../hub.js';
import {
  DEVICE,
  FSA_OK,
  FSFS,
  IDBFS,
  KV,
  LS,
  SCHEMA,
  VERSION,
  countFiles,
  jeq,
  localISO,
  logErr,
  sanitizeName,
  sleep,
  uid,
} from './01-utils-i18n-storage.js';
import { can, checkSession } from './02-auth.js';

/* Bindings other modules reach through the hub (forward references / cross-module writes / overridden functions). */
defineHub({
  MIGRATED: [
    () => MIGRATED,
    v => {
      MIGRATED = v;
    },
  ],
  SAVER: [() => SAVER],
  STORE: [
    () => STORE,
    v => {
      STORE = v;
    },
  ],
  STORE_ID: [
    () => STORE_ID,
    v => {
      STORE_ID = v;
    },
  ],
  presenceLeave: [
    () => presenceLeave,
    v => {
      presenceLeave = v;
    },
  ],
  withRetry: [
    () => withRetry,
    v => {
      withRetry = v;
    },
  ],
});

/* ================= a3 · Data engine: store selection, companies, engagements, op-logs, autosave, sync ================= */
let STORE = null,
  STORE_ID = 'idb:local',
  SETTINGS = null;
const DEF_SETTINGS = {
  format: 'MEAP-settings',
  version: 1,
  schema: 3,
  appVersion: VERSION,
  firmName: '',
  poll: 8,
  backup: { freq: 'daily', keep: 10 },
  attach: {
    maxMB: 100,
    maxFiles: 200,
    types:
      'pdf,jpg,jpeg,png,gif,webp,bmp,tif,tiff,xlsx,xls,xlsm,csv,docx,doc,pptx,ppt,txt,msg,eml,json,xml,rtf,odt,ods',
  },
};
const CUR = { company: null, eng: null, base: '', view: '', arg: '' };
const writer = () => (hub.SESSION ? hub.SESSION.id : 'anon') + '__' + DEVICE;
function errMsg(e) {
  if (!e) return 'خطأ غير معروف';
  const n = e.name || '';
  if (n === 'QuotaExceededError' || /quota/i.test(e.message || ''))
    return 'امتلأت مساحة التخزين. احذف مرفقات غير لازمة أو اختر مجلد حفظ على القرص.';
  if (n === 'NotAllowedError' || n === 'SecurityError')
    return 'لا يوجد إذن بالكتابة في مجلد الحفظ. امنح الإذن من الإعدادات.';
  if (n === 'NotFoundError') return 'المسار غير موجود (ربما نُقل أو حُذف).';
  if (n === 'NoModificationAllowedError' || n === 'InvalidStateError')
    return 'الملف مقفل حاليًا من برنامج آخر؛ ستتم إعادة المحاولة.';
  return e.message || String(e);
}
async function withRetry(fn, tries) {
  tries = tries || 3;
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (e && (e.name === 'NotAllowedError' || e.name === 'QuotaExceededError')) break;
      await sleep(250 * Math.pow(3, i));
    }
  }
  throw last;
}
const lockWrite = fn =>
  navigator.locks && navigator.locks.request ? navigator.locks.request('meap-w-' + writer(), fn) : fn();

/* ---------- Choosing the store: folder (File System Access) or browser IndexedDB ---------- */
/* Is the saved folder still there? (the user may have deleted/moved/renamed it on disk) */
function isNotFound(e) {
  return (
    !!e &&
    (e.name === 'NotFoundError' ||
      e.name === 'NotFoundErr' ||
      /not\s*found|could not be found|no longer exists/i.test(e.message || ''))
  );
}
async function rootAlive(h) {
  try {
    if (h.values) {
      await h.values().next();
    } else if (h.entries) {
      await h.entries().next();
    } else {
      await h.getDirectoryHandle('_probe_', { create: false }).catch(e => {
        if (isNotFound(e) && e.name !== 'NotFoundError') throw e;
      });
    }
    return true;
  } catch (e) {
    return !isNotFound(e);
  }
}
async function openStoreFromDevice() {
  /* returns {store, needsPermission, handle, missing} */
  if (window.__MEAP_TEST_ROOT)
    return { store: FSFS(window.__MEAP_TEST_ROOT) }; /* automated tests only: simulated shared folder */
  if (FSA_OK) {
    let h = null;
    try {
      h = await KV.get('root');
    } catch (e) {
      logErr('a3_engine:18 h=await KV.get(root)', e);
    }
    if (h) {
      let p = 'prompt';
      try {
        p = await h.queryPermission({ mode: 'readwrite' });
      } catch (e) {
        logErr('a3_engine:19 p=await h.queryPermission({mode:readwrite})', e);
        if (isNotFound(e)) return { store: null, missing: true, handle: h };
      }
      if (p === 'granted') {
        if (!(await rootAlive(h))) return { store: null, missing: true, handle: h };
        return { store: FSFS(h) };
      }
      return { store: null, needsPermission: true, handle: h };
    }
  }
  return { store: IDBFS() };
}
async function pickFolder() {
  const h = await window.showDirectoryPicker({ id: 'auditplus-data', mode: 'readwrite' });
  const root = h.name === 'Audit-Plus-Data' ? h : await h.getDirectoryHandle('Audit-Plus-Data', { create: true });
  const p = await root.requestPermission({ mode: 'readwrite' });
  if (p !== 'granted') throw new Error('لم يُمنح إذن الكتابة على المجلد.');
  return root;
}
async function loadSettings() {
  let s = null;
  const txt = await STORE.readText('_settings.json');
  if (txt) {
    try {
      s = JSON.parse(txt);
    } catch (e) {
      s = null;
    }
  }
  if (!s || s.format !== 'MEAP-settings') {
    s = Object.assign({}, DEF_SETTINGS, { storeId: uid('s_'), createdAt: localISO() });
    await STORE.mkdir('_users');
    await STORE.mkdir('companies');
    await STORE.writeText('_settings.json', JSON.stringify(s, null, 1));
  }
  if ((s.schema || 2) < SCHEMA) s = await migrateStore(s);
  SETTINGS = Object.assign({}, DEF_SETTINGS, s, { attach: Object.assign({}, DEF_SETTINGS.attach, s.attach || {}) });
  if (SETTINGS.attach && +SETTINGS.attach.maxMB === 25 && +SETTINGS.attach.maxFiles === 50) {
    SETTINGS.attach.maxMB = 100;
    SETTINGS.attach.maxFiles = 200;
  }
  STORE_ID = STORE.kind + ':' + SETTINGS.storeId;
  return SETTINGS;
}
/* ---------- Migration v2 → v3 (schema 3, app 3.0.0) ----------
   Non-destructive and idempotent: first a verified backup of every text/JSON file outside _ops/attachments, then
   only additive changes. Op logs, attachments and folder names are never touched; v2 keys keep their meaning. */
async function sha256Hex(data) {
  const buf =
    typeof data === 'string' ? new TextEncoder().encode(data) : data instanceof Blob ? await data.arrayBuffer() : data;
  const h = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(h), b => b.toString(16).padStart(2, '0')).join('');
}
async function migrateStore(s) {
  const from = s.schema || 2,
    stamp = localISO().replace(/[:T]/g, '-').slice(0, 19),
    bdir = '_backups/pre-v3-' + stamp;
  const files = [];
  const walk = async p => {
    for (const it of await STORE.list(p)) {
      const q = p ? p + '/' + it.name : it.name;
      if (it.kind === 'directory') {
        if (/^(_backups|_presence)$/.test(it.name) || it.name === 'attachments' || it.name === '_ops') continue;
        await walk(q);
      } else if (/\.(json|jsonl)$/i.test(it.name)) files.push(q);
    }
  };
  await walk('');
  const manifest = {
    format: 'MEAP-backup',
    version: 1,
    kind: 'pre-migration',
    from,
    to: SCHEMA,
    createdAt: localISO(),
    files: [],
  };
  for (const f of files) {
    const txt = await STORE.readText(f);
    if (txt == null) continue;
    await withRetry(() => STORE.writeText(bdir + '/' + f, txt));
    const back = await STORE.readText(bdir + '/' + f);
    const h = await sha256Hex(txt);
    if (back == null || (await sha256Hex(back)) !== h)
      throw new Error('تعذر التحقق من النسخة الاحتياطية قبل الترحيل: ' + f);
    manifest.files.push({ path: f, size: txt.length, sha256: h });
  }
  await STORE.writeText(bdir + '/manifest.json', JSON.stringify(manifest, null, 1));
  const n = Object.assign({}, s, {
    schema: SCHEMA,
    appVersion: VERSION,
    migrations: (s.migrations || []).concat([
      { from, to: SCHEMA, app: VERSION, at: localISO(), backup: bdir, files: manifest.files.length },
    ]),
  });
  await withRetry(() => STORE.writeText('_settings.json', JSON.stringify(n, null, 1)));
  await STORE.appendText(
    '_audit/system.jsonl',
    JSON.stringify({
      k: 'sys.migrate',
      v: { from, to: SCHEMA, backup: bdir, files: manifest.files.length },
      t: Date.now(),
      u: 'system',
    }) + '\n'
  );
  MIGRATED = { from, to: SCHEMA, backup: bdir, files: manifest.files.length };
  return n;
}
let MIGRATED = null;
async function saveSettings(patch) {
  const txt = await STORE.readText('_settings.json');
  let s = {};
  try {
    s = JSON.parse(txt) || {};
  } catch (e) {
    logErr('a3_engine:28 s=JSON.parse(txt)||{', e);
  }
  Object.assign(s, patch, { updatedAt: localISO(), updatedBy: hub.SESSION && hub.SESSION.id });
  await withRetry(() => STORE.writeText('_settings.json', JSON.stringify(s, null, 1)));
  SETTINGS = Object.assign({}, DEF_SETTINGS, s, { attach: Object.assign({}, DEF_SETTINGS.attach, s.attach || {}) });
  audit('settings', patch);
}
/* Store-level audit for non-engagement actions (companies, users, settings) */
function audit(action, data) {
  if (!hub.SESSION) return;
  STORE.appendText(
    '_audit/' + writer() + '.jsonl',
    JSON.stringify({ k: 'sys.' + action, v: data == null ? null : data, t: Date.now(), u: hub.SESSION.id }) + '\n'
  ).catch(e => logErr('audit ' + action, e));
}

/* ---------- Companies ---------- */
const CO = {
  list: [],
  async load() {
    const dirs = (await STORE.list('companies')).filter(d => d.kind === 'directory');
    const out = await Promise.all(
      dirs.map(async d => {
        try {
          const txt = await STORE.readText('companies/' + d.name + '/company.json');
          if (!txt) return null;
          const c = JSON.parse(txt);
          if (!c || c.id == null) return null;
          c._dir = 'companies/' + d.name;
          return c;
        } catch (e) {
          logErr('CO.load ' + d.name, e, 'warn');
          return null;
        }
      })
    );
    this.list = out.filter(Boolean).sort((a, b) => String(a.id).localeCompare(String(b.id), 'en', { numeric: true }));
    return this.list;
  },
  byId(id) {
    return this.list.find(c => String(c.id) === String(id));
  },
  nextId() {
    let m = 0;
    this.list.forEach(c => {
      const n = parseInt(c.id, 10);
      if (n > m) m = n;
    });
    return String(m + 1).padStart(3, '0');
  },
  dirFor(c) {
    return 'companies/' + sanitizeName(c.id, 20) + '__' + sanitizeName(c.name, 60);
  },
  async save(c) {
    c = Object.assign({}, c);
    const isNew = !c._dir;
    const dir = this.dirFor(c);
    c.format = 'MEAP-company';
    c.version = 1;
    c.updatedAt = localISO();
    c.updatedBy = hub.SESSION.id;
    if (isNew) {
      if (this.byId(c.id)) throw new Error('رقم الشركة مستخدم بالفعل.');
      c.createdAt = c.updatedAt;
      c.createdBy = hub.SESSION.id;
      await STORE.mkdir(dir);
    } else if (c._dir !== dir) {
      /* rename → move folder safely: copy everything, verify, then remove the old folder */
      if (await STORE.stat(dir + '/company.json')) throw new Error('يوجد مجلد بهذا الاسم بالفعل.');
      await SAVER.flush(true);
      const n1 = await countFiles(STORE, c._dir);
      await copyDir(c._dir, dir);
      const n2 = await countFiles(STORE, dir);
      if (n2 < n1) throw new Error('تعذر نقل مجلد الشركة بالكامل؛ لم يُحذف المجلد القديم.');
      await STORE.remove(c._dir);
      if (CUR.eng && CUR.eng.path.startsWith(c._dir + '/')) CUR.eng.path = dir + CUR.eng.path.slice(c._dir.length);
    }
    const out = Object.assign({}, c);
    delete out._dir;
    await withRetry(() => STORE.writeText(dir + '/company.json', JSON.stringify(out, null, 1)));
    c._dir = dir;
    audit(isNew ? 'company.create' : 'company.update', { id: c.id, name: c.name });
    await this.load();
    return this.byId(c.id);
  },
  async engs(c) {
    const items = (await STORE.list(c._dir)).filter(d => d.kind === 'directory');
    const out = await Promise.all(
      items.map(async d => {
        const p = c._dir + '/' + d.name;
        try {
          const txt = await STORE.readText(p + '/engagement.json');
          if (!txt) return null;
          const e = JSON.parse(txt);
          e._path = p;
          e._folder = d.name;
          return e;
        } catch (err) {
          logErr('CO.engs ' + p, err, 'warn');
          return null;
        }
      })
    );
    return out.filter(Boolean).sort((a, b) => String(b.year).localeCompare(String(a.year), 'en', { numeric: true }));
  },
};
async function copyDir(from, to) {
  for (const it of await STORE.list(from)) {
    const a = from + '/' + it.name,
      b = to + '/' + it.name;
    if (it.kind === 'directory') {
      await STORE.mkdir(b);
      await copyDir(a, b);
    } else {
      const bl = await STORE.readBlob(a);
      if (bl) await STORE.writeBlob(b, bl);
    }
  }
}

/* ---------- Engagement store: per-user op logs merged with last-writer-wins ----------
   Each user/device appends its own operations to _ops/<user>__<device>.jsonl (no two writers share a file),
   readers merge every log by (time, user, seq). Human-readable snapshots (engagement.json, working-papers/…/data.json,
   links.json, findings/*.json …) are regenerated from the merged state after every save. */
let SEQ = 0;
const cmpOp = (a, b) => a.t - b.t || (a.u < b.u ? -1 : a.u > b.u ? 1 : 0) || (a.s || 0) - (b.s || 0);
class EngStore {
  constructor(path, meta) {
    this.path = path;
    this.meta = meta || {};
    this.ver = 0;
    this.map = new Map();
    this.files = {};
    this.mine = new Map();
    this.seen = new Set();
  }
  async load() {
    await STORE.mkdir(this.path + '/_ops');
    await this.pull();
    for (const w of WAL.all()) if (w.p === this.path) this.apply(w.o);
    return this;
  }
  apply(op) {
    if (!op || typeof op.k !== 'string' || typeof op.t !== 'number') return false;
    const cur = this.map.get(op.k);
    if (cur && cmpOp(cur, op) >= 0) return false;
    this.map.set(op.k, { v: op.v === undefined ? null : op.v, t: op.t, u: op.u, s: op.s || 0 });
    this.ver++;
    return true;
  }
  async pull() {
    const files = (await STORE.list(this.path + '/_ops')).filter(f => f.kind === 'file' && f.name.endsWith('.jsonl'));
    const changed = [],
      older = [];
    for (const f of files) {
      const p = this.path + '/_ops/' + f.name;
      const st = await STORE.stat(p);
      if (!st) continue;
      const rec = this.files[f.name];
      if (rec && rec.size === st.size) continue;
      const txt = (await STORE.readText(p)) || '';
      this.files[f.name] = { size: st.size };
      for (const line of txt.split('\n')) {
        if (!line) continue;
        let op;
        try {
          op = JSON.parse(line);
        } catch (e) {
          continue;
        }
        if (this.apply(op)) changed.push(op);
        else if (hub.SESSION && op.u !== hub.SESSION.id && this.mine.has(op.k)) {
          const sig = op.k + '|' + op.t + '|' + op.u + '|' + op.s;
          if (!this.seen.has(sig) && !jeq(op.v, this.mine.get(op.k).v)) {
            this.seen.add(sig);
            older.push(op);
          }
        }
      }
    }
    this.older = older;
    return changed;
  }
  get(k, d) {
    const e = this.map.get(k);
    return e && e.v != null ? e.v : d;
  }
  meta_(k) {
    return this.map.get(k);
  }
  set(k, v, o) {
    o = o || {};
    if (!hub.SESSION) return false;
    if (!o.sys && !can('edit') && !/^(wp|doc)\.[^.]+\.(ap|cm\.)/.test(k)) {
      hub.toast('دورك الحالي للقراءة فقط.', 'w');
      return false;
    }
    if (!o.sys && typeof hub.keyLocked === 'function' && hub.keyLocked(k, this)) {
      hub.toast('هذه الورقة معتمدة ومقفلة (مسار الاعتماد). أعد فتحها أولًا بمبرر.', 'w');
      return false;
    }
    if (v === undefined) v = null;
    const prev = this.map.get(k);
    const pv = prev ? prev.v : null;
    if (jeq(pv, v) || (pv == null && v === '')) return false;
    let tm = Date.now();
    if (prev && prev.t >= tm) tm = prev.t + 1;
    const op = { k, v, t: tm, u: hub.SESSION.id, s: ++SEQ };
    this.map.set(k, { v, t: tm, u: op.u, s: op.s });
    this.ver++;
    this.mine.set(k, op);
    if (!o.noUndo) pushUndo(this, k, pv, o.label);
    SAVER.add(this.path, op);
    return true;
  }
  setMany(obj, o) {
    let n = 0;
    for (const k in obj) if (this.set(k, obj[k], o)) n++;
    return n;
  }
  *entries(prefix) {
    for (const [k, e] of this.map) if (k.startsWith(prefix) && e.v != null) yield [k, e.v];
  }
  async compact() {
    /* keep the active log small: move full history to _audit, keep only latest op per key */
    const name = writer() + '.jsonl',
      p = this.path + '/_ops/' + name;
    const st = await STORE.stat(p);
    if (!st || st.size < 600000) return;
    await lockWrite(async () => {
      const txt = (await STORE.readText(p)) || '';
      const last = new Map();
      for (const l of txt.split('\n')) {
        if (!l) continue;
        try {
          const op = JSON.parse(l);
          const c = last.get(op.k);
          if (!c || cmpOp(c, op) < 0) last.set(op.k, op);
        } catch (e) {
          logErr('a3_engine:78 const op=JSON.parse(l);const c=last.get(op.k);if(!', e);
        }
      }
      await STORE.appendText(this.path + '/_audit/' + name, txt);
      await STORE.writeText(p, [...last.values()].map(o => JSON.stringify(o)).join('\n') + '\n');
      delete this.files[name];
    });
  }
}

/* ---------- Write-ahead journal: every operation is first written synchronously to localStorage,
   so closing the tab before the async write finishes never loses data (replayed at next start). ---------- */
const WAL = {
  ok: true,
  key: () => 'meap.wal.' + STORE_ID + '.' + (hub.SESSION ? hub.SESSION.id : 'x'),
  all() {
    return LS.get(this.key(), []);
  },
  push(p, o) {
    const a = this.all();
    a.push({ p, o });
    this.ok = LS.set(this.key(), a);
  },
  drop(items) {
    if (!items.length) return;
    const ids = new Set(items.map(x => x.o.k + '|' + x.o.t + '|' + x.o.s));
    const a = this.all().filter(x => !ids.has(x.o.k + '|' + x.o.t + '|' + x.o.s));
    this.ok = LS.set(this.key(), a);
  },
};

const TEMP = new Map();
async function storeFor(path) {
  if (CUR.eng && CUR.eng.path === path) return CUR.eng;
  if (TEMP.has(path)) return TEMP.get(path);
  const s = new EngStore(path);
  await s.load();
  TEMP.set(path, s);
  return s;
}

/* ---------- Autosave after every operation ---------- */
const SAVER = {
  q: [],
  extra: new Map(),
  timer: 0,
  busy: null,
  fails: 0,
  state: 'saved',
  err: '',
  lastOk: 0,
  add(p, o) {
    WAL.push(p, o);
    this.q.push({ p, o });
    this.kick(300);
  },
  remat(p, groups) {
    const s = this.extra.get(p) || new Set();
    groups.forEach(g => s.add(g));
    this.extra.set(p, s);
    this.kick(900);
  },
  kick(ms) {
    clearTimeout(this.timer);
    if (!this.fails) this.set('saving');
    this.timer = setTimeout(() => this.flush(), ms);
  },
  set(s, e) {
    this.state = s;
    this.err = e || '';
    if (typeof hub.UI !== 'undefined') hub.UI.saveState();
  },
  pending() {
    return this.q.length > 0 || this.extra.size > 0 || !!this.busy;
  },
  async flush() {
    clearTimeout(this.timer);
    if (this.busy) {
      try {
        await this.busy;
      } catch (e) {
        logErr('a3_engine:98 await this.busy', e);
      }
    }
    if (!this.q.length && !this.extra.size) {
      if (this.state !== 'error') this.set('saved');
      return;
    }
    const batch = this.q.splice(0),
      extra = this.extra;
    this.extra = new Map();
    if (!this.fails) this.set('saving');
    this.busy = (async () => {
      try {
        await this.write(batch, extra);
        this.fails = 0;
        this.lastOk = Date.now();
        WAL.drop(batch);
        if (this.q.length || this.extra.size) this.kick(60);
        else
          this.set(
            WAL.ok ? 'saved' : 'error',
            WAL.ok ? '' : 'تعذّر حفظ نسخة الطوارئ في ذاكرة المتصفح (المساحة ممتلئة) — الحفظ في المجلد ناجح.'
          );
        try {
          BC && BC.postMessage({ t: 'saved', store: STORE_ID });
        } catch (e) {
          logErr('a3_engine:102 BC&&BC.postMessage({t:saved,store:STORE_ID})', e);
        }
      } catch (e) {
        this.q.unshift(...batch);
        for (const [p, g] of extra) {
          const s = this.extra.get(p) || new Set();
          g.forEach(x => s.add(x));
          this.extra.set(p, s);
        }
        this.fails++;
        if (isNotFound(e) && typeof hub.folderLost === 'function' && hub.folderLost()) return;
        const wait = Math.min(30000, 1000 * Math.pow(2, Math.min(this.fails, 5)));
        this.set('error', errMsg(e));
        if (this.fails === 1 && typeof hub.toast === 'function')
          hub.toast(
            'فشل الحفظ: ' + errMsg(e) + ' — تعديلاتك محفوظة مؤقتًا على هذا الجهاز وستُعاد المحاولة تلقائيًا.',
            'e',
            10000
          );
        this.nextRetry = Date.now() + wait;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.flush(), wait);
      } finally {
        this.busy = null;
      }
    })();
    return this.busy;
  },
  async write(batch, extra) {
    const by = new Map();
    for (const it of batch) {
      if (!by.has(it.p)) by.set(it.p, []);
      by.get(it.p).push(it.o);
    }
    for (const path of new Set([...by.keys(), ...extra.keys()])) {
      if (!(await STORE.stat(path + '/engagement.json')) && !(await STORE.stat(path + '/_ops')))
        throw Object.assign(new Error('مجلد الارتباط غير موجود: ' + path), { name: 'NotFoundError' });
      const store = await storeFor(path);
      const ops = by.get(path) || [];
      if (ops.length)
        await withRetry(() =>
          lockWrite(() =>
            STORE.appendText(path + '/_ops/' + writer() + '.jsonl', ops.map(o => JSON.stringify(o)).join('\n') + '\n')
          )
        );
      const groups = new Set(extra.get(path) || []);
      ops.forEach(o => groups.add(groupOf(o.k)));
      await materialize(store, groups);
      if (ops.length) store.compact().catch(e => logErr('compact ' + path, e, 'warn'));
    }
  },
};

/* ---------- Human-readable snapshots ---------- */
function groupOf(k) {
  const p = k.split('.');
  if (p[0] === 'wp') return 'wp:' + p[1] + (p[2] === 'lk' || p[2] === 'att' ? '|graph' : '');
  if (p[0] === 'pp') return 'pp:' + p[1] + '|graph';
  if (p[0] === 'ref') return 'ref:' + p[1] + '|graph';
  if (p[0] === 'doc' || p[0] === 'ml') return 'doc:' + (p[0] === 'ml' ? 'mgmtletter' : p[1]);
  if (p[0] === 'f' || p[0] === 'a' || p[0] === 'r') return p[0] + ':' + p[1] + (p[0] === 'f' ? '|graph' : '');
  if (p[0] === 'cwp') return 'eng|wp:' + p[1];
  if (p[0] === 'pbx') return 'pbx';
  return 'eng';
}
const RECDIR = { f: 'findings', a: 'adjustments', r: 'review-notes', ref: 'references' };
async function materialize(store, groups) {
  const all = new Set();
  groups.forEach(g => g.split('|').forEach(x => all.add(x)));
  for (const g of all) {
    const i_ = g.indexOf(':');
    const kind = i_ < 0 ? g : g.slice(0, i_),
      id = i_ < 0 ? '' : g.slice(i_ + 1);
    if (kind === 'eng') {
      await withRetry(() =>
        STORE.writeText(store.path + '/engagement.json', JSON.stringify(hub.engSnapshot(store), null, 1))
      );
    } else if (kind === 'wp') {
      const dir = store.path + '/working-papers/' + hub.wpFolder(store, id);
      const cw = store.get('cwp.' + id);
      if (cw === null && store.map.has('cwp.' + id)) {
        continue;
      }
      const snap = hub.wpSnapshot(store, id);
      if (!snap) continue;
      await withRetry(() => STORE.writeText(dir + '/data.json', JSON.stringify(snap.data, null, 1)));
      await withRetry(() => STORE.writeText(dir + '/links.json', JSON.stringify(snap.links, null, 1)));
    } else if (kind === 'pp') {
      const snap = hub.ppSnapshot(store, id);
      const dir = store.path + '/procedures/' + hub.procFolder(id);
      if (snap) await withRetry(() => STORE.writeText(dir + '/data.json', JSON.stringify(snap, null, 1)));
    } else if (kind === 'pbx') {
      if (typeof hub.pbSnapshot === 'function')
        await withRetry(() =>
          STORE.writeText(store.path + '/pbc/requests.json', JSON.stringify(hub.pbSnapshot(store), null, 1))
        );
    } else if (kind === 'graph') {
      await withRetry(() =>
        STORE.writeText(store.path + '/relations.json', JSON.stringify(hub.relationsSnapshot(store), null, 1))
      );
    } else if (kind === 'doc') {
      const snap = hub.docSnapshot(store, id);
      if (snap)
        await withRetry(() =>
          STORE.writeText(
            store.path + '/documents/' + sanitizeName(id, 40) + '/data.json',
            JSON.stringify(snap, null, 1)
          )
        );
    } else if (RECDIR[kind]) {
      const r = recOf(store, kind, id);
      const p = store.path + '/' + RECDIR[kind] + '/' + sanitizeName(id, 40) + '.json';
      if (!r || r._del) await STORE.remove(p);
      else
        await withRetry(() =>
          STORE.writeText(p, JSON.stringify(Object.assign({ format: 'MEAP-' + RECDIR[kind], id }, r), null, 1))
        );
    }
  }
}
function recOf(store, kind, id) {
  const pre = kind + '.' + id + '.';
  let r = null;
  for (const [k, v] of store.entries(pre)) {
    (r = r || {})[k.slice(pre.length)] = v;
  }
  return r;
}
function recs(store, kind) {
  const m = {};
  for (const [k, v] of store.entries(kind + '.')) {
    const p = k.split('.');
    const id = p[1],
      f = p.slice(2).join('.');
    if (!f) continue;
    (m[id] = m[id] || { id })[f] = v;
  }
  return Object.values(m)
    .filter(r => !r._del)
    .sort((a, b) => (a.t || 0) - (b.t || 0));
}

/* ---------- Undo (per session) ---------- */
const UNDO = [];
function pushUndo(store, k, prev, label) {
  const top = UNDO[UNDO.length - 1];
  const now = Date.now();
  if (top && top.store === store && top.k === k && now - top.t < 2500) {
    top.t = now;
    return;
  }
  UNDO.push({ store, k, prev, label: label || '', t: now });
  if (UNDO.length > 300) UNDO.shift();
  if (typeof hub.UI !== 'undefined') hub.UI.undoState();
}
function undo() {
  const u = UNDO.pop();
  if (typeof hub.UI !== 'undefined') hub.UI.undoState();
  if (!u) {
    hub.toast('لا يوجد ما يمكن التراجع عنه.', 'i');
    return;
  }
  u.store.set(u.k, u.prev, { noUndo: true });
  hub.toast('تم التراجع عن آخر تعديل: ' + hub.keyLabel(u.k), 'i');
  if (u.store === CUR.eng) hub.UI.applyRemote(new Set([u.k]), [], true);
}

/* ---------- Presence: who is working on which working paper ---------- */
const PRES = {
  list: [],
  cur: { view: '', wp: '' },
  last: 0,
  async beat(force) {
    if (!hub.SESSION || !CUR.eng) return;
    const now = Date.now();
    if (!force && now - this.last < 40000) return;
    this.last = now;
    try {
      await STORE.writeText(
        CUR.eng.path + '/_presence/' + writer() + '.json',
        JSON.stringify({ u: hub.SESSION.id, device: DEVICE, view: this.cur.view, wp: this.cur.wp, t: now })
      );
    } catch (e) {
      logErr('a3_engine:139 await STORE.writeText(CUR.eng.path+/_presence/+w', e);
    }
  },
  async read() {
    if (!CUR.eng) {
      this.list = [];
      return;
    }
    const dir = CUR.eng.path + '/_presence';
    const out = [];
    const now = Date.now();
    for (const f of await STORE.list(dir)) {
      if (f.kind !== 'file') continue;
      try {
        const p = JSON.parse((await STORE.readText(dir + '/' + f.name)) || 'null');
        if (p && now - p.t < 130000 && !(p.u === hub.SESSION.id && p.device === DEVICE)) out.push(p);
      } catch (e) {
        logErr('a3_engine:141 const p=JSON.parse(await STORE.readText(dir+/+f.', e);
      }
    }
    this.list = out;
  },
};
async function presenceLeave() {
  if (CUR.eng && hub.SESSION) await STORE.remove(CUR.eng.path + '/_presence/' + writer() + '.json');
}

/* ---------- Background sync ---------- */
let BC = null;
try {
  BC = new BroadcastChannel('meap');
} catch (e) {
  logErr('BroadcastChannel unsupported – cross-tab sync falls back to polling', e, 'info');
}
const SYNC = {
  timer: 0,
  running: false,
  fails: 0,
  start() {
    this.stop();
    const loop = async () => {
      await this.tick();
      this.timer = setTimeout(
        loop,
        (STORE.kind === 'idb' ? 12 : STORE.kind === 'cloud' ? Math.max(20, SETTINGS.poll || 8) : SETTINGS.poll || 8) *
          1000
      );
    };
    this.timer = setTimeout(loop, 1500);
  },
  stop() {
    clearTimeout(this.timer);
  },
  async tick() {
    if (this.running || !hub.SESSION) return;
    this.running = true;
    try {
      if (!(await checkSession())) {
        hub.UI.sessionEnded();
        return;
      }
      if (CUR.eng) {
        const store = CUR.eng;
        const ch = await store.pull();
        if (ch.length || (store.older && store.older.length)) onRemote(store, ch, store.older || []);
        await PRES.beat();
        await PRES.read();
        hub.UI.presence();
      }
      this.fails = 0;
    } catch (e) {
      this.fails++;
      if (this.fails === 3) hub.toast('تعذّرت قراءة التحديثات من مجلد الحفظ: ' + errMsg(e), 'w');
    } finally {
      this.running = false;
    }
  },
};
if (BC)
  BC.onmessage = ev => {
    if (ev.data && ev.data.store === STORE_ID) setTimeout(() => SYNC.tick(), 200);
  };
function onRemote(store, ops, older) {
  const keys = new Set(),
    conf = [],
    groups = new Set();
  for (const op of ops) {
    keys.add(op.k);
    if (op.u !== hub.SESSION.id) {
      groups.add(groupOf(op.k));
      const m = store.mine.get(op.k);
      if (m && Math.abs(op.t - m.t) < 15 * 60000 && !jeq(op.v, m.v)) conf.push({ op, kept: 'theirs' });
    }
  }
  for (const op of older) conf.push({ op, kept: 'mine' });
  if (groups.size) SAVER.remat(store.path, groups);
  if (store === CUR.eng) hub.UI.applyRemote(keys, conf);
}

/* ---------- Audit trail: every operation carries user + time ---------- */
async function readAudit(path) {
  const out = [];
  const seen = new Set();
  for (const sub of ['_ops', '_audit']) {
    for (const f of await STORE.list(path + '/' + sub)) {
      if (f.kind !== 'file' || !f.name.endsWith('.jsonl')) continue;
      const txt = (await STORE.readText(path + '/' + sub + '/' + f.name)) || '';
      for (const l of txt.split('\n')) {
        if (!l) continue;
        try {
          const o = JSON.parse(l);
          const sig = o.k + '|' + o.t + '|' + o.u + '|' + o.s;
          if (seen.has(sig)) continue;
          seen.add(sig);
          out.push(o);
        } catch (e) {
          logErr('a3_engine:166 const o=JSON.parse(l);const sig=o.k+|+o.t+|+o.', e);
        }
      }
    }
  }
  return out.sort((a, b) => b.t - a.t);
}

/* ---------- Engagement creation / cloning ---------- */
async function createEngagement(c, info, seed) {
  const year = String(info.year || '').trim();
  if (!/^[\w\- ]{2,20}$/.test(year)) throw new Error('السنة المالية غير صالحة (مثال: 2026).');
  const path = c._dir + '/' + sanitizeName(year, 20);
  if (await STORE.stat(path + '/engagement.json')) throw new Error('يوجد ارتباط لهذه السنة بالفعل.');
  for (const d of ['_ops', 'findings', 'adjustments', 'review-notes', 'working-papers'])
    await STORE.mkdir(path + '/' + d);
  const store = new EngStore(path, { companyId: c.id, year });
  TEMP.set(path, store);
  await STORE.writeText(
    path + '/engagement.json',
    JSON.stringify({ format: 'MEAP-engagement', version: 3, companyId: c.id, year, creating: true }, null, 1)
  );
  const base = {
    'eng.year': year,
    'eng.period': info.period || '',
    'eng.fw': info.fw || 'IFRS',
    'eng.ind': info.ind || c.industry || '',
    'eng.status': 'active',
    'eng.created': localISO(),
    'eng.createdBy': hub.SESSION.id,
  };
  Object.assign(base, seed || {});
  store.setMany(base, { sys: true, noUndo: true });
  await SAVER.flush();
  audit('engagement.create', { company: c.id, year });
  TEMP.delete(path);
  return path;
}

export {
  CO,
  CUR,
  EngStore,
  PRES,
  SETTINGS,
  SYNC,
  TEMP,
  UNDO,
  WAL,
  audit,
  copyDir,
  createEngagement,
  errMsg,
  groupOf,
  isNotFound,
  loadSettings,
  materialize,
  openStoreFromDevice,
  pickFolder,
  pushUndo,
  readAudit,
  recs,
  rootAlive,
  saveSettings,
  sha256Hex,
  storeFor,
  undo,
  writer,
};
