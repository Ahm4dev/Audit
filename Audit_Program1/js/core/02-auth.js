/* Audit-Plus · Users & authentication */

import { defineHub, hub } from '../hub.js';
import { KV, LS, b64, localISO, logErr, uid, unb64 } from './01-utils-i18n-storage.js';

/* Bindings other modules reach through the hub (forward references / cross-module writes / overridden functions). */
defineHub({
  SESSION: [
    () => SESSION,
    v => {
      SESSION = v;
    },
  ],
});

/* ================= a2 · Users & authentication (Web Crypto only) =================
 _users/users.json:
  uSalt  : global salt for the username lookup fingerprint (PBKDF2-SHA256, 100k)
  users[]: uh   = username fingerprint (for matching at login)
           name = username encrypted (AES-GCM-256) with the directory key DK
           disp = display name encrypted with DK
           pSalt/pHash = password verifier: SHA-256 of the first half of PBKDF2-SHA256(310k, 512 bits)
           wDK  = DK encrypted with a key derived from the second half (each user unwraps DK at login)
   No password or username is ever stored in clear text. */
const ENC = new TextEncoder(),
  DEC = new TextDecoder();
const KDF_IT = 310000,
  UH_IT = 100000;
const ROLES = ['admin', 'partner', 'eqr', 'reviewer', 'assistant', 'viewer'];
const normU = u =>
  String(u || '')
    .normalize('NFKC')
    .trim()
    .toLowerCase();
const rnd = n => crypto.getRandomValues(new Uint8Array(n));
async function pbkdf2(pw, salt, it, bits) {
  const k = await crypto.subtle.importKey('raw', ENC.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: it }, k, bits)
  );
}
const sha256 = async b => new Uint8Array(await crypto.subtle.digest('SHA-256', b));
const aesKey = (raw, ext) => crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, !!ext, ['encrypt', 'decrypt']);
async function encBytes(key, bytes) {
  const iv = rnd(12);
  return { iv: b64(iv), ct: b64(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes)) };
}
async function decBytes(key, o) {
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, key, unb64(o.ct)));
}
const encStr = (k, s) => encBytes(k, ENC.encode(String(s)));
const decStr = async (k, o) => DEC.decode(await decBytes(k, o));
async function userHash(u, uSalt) {
  return b64(await pbkdf2(normU(u), unb64(uSalt), UH_IT, 256));
}
async function passDerive(pw, salt) {
  const bits = await pbkdf2(pw, salt, KDF_IT, 512);
  return { verifier: b64(await sha256(bits.slice(0, 32))), kek: await aesKey(bits.slice(32), false) };
}
function ctEq(a, b) {
  a = String(a);
  b = String(b);
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
const pvOf = async rec => b64(await sha256(ENC.encode(rec.pSalt + '|' + rec.pHash))).slice(0, 22);
function pwPolicy(pw) {
  /* Audit-Plus: no password requirements — any non-empty password is accepted (e.g. 123) */ if (
    pw == null ||
    String(pw).length < 1
  )
    return 'كلمة المرور مطلوبة.';
  return '';
}

let SESSION = null; /* {id, role, display, username, dk(CryptoKey), dkRaw(Uint8Array), pv} */
const USERS = {
  doc: null,
  mtime: 0,
  names: {},
  logins: {},
  async load() {
    const txt = await hub.STORE.readText('_users/users.json');
    let d = null;
    if (txt) {
      try {
        d = JSON.parse(txt);
      } catch (e) {
        throw new Error('ملف المستخدمين تالف: _users/users.json');
      }
    }
    if (d && (!Array.isArray(d.users) || typeof d.uSalt !== 'string')) throw new Error('بنية ملف المستخدمين غير صحيحة');
    this.doc = d;
    const st = await hub.STORE.stat('_users/users.json');
    this.mtime = st ? st.mtime : 0;
    return d;
  },
  async write(doc) {
    doc.updatedAt = localISO();
    await hub.withRetry(() => hub.STORE.writeText('_users/users.json', JSON.stringify(doc, null, 1)));
    this.doc = doc;
    const st = await hub.STORE.stat('_users/users.json');
    this.mtime = st ? st.mtime : 0;
  },
  /* read-modify-write: always re-read the latest file before changing it (another admin may have edited it) */
  async mutate(fn) {
    const d = await this.load();
    if (!d) throw new Error('لا يوجد ملف مستخدمين');
    await fn(d);
    await this.write(d);
    await this.decryptAll();
  },
  active() {
    return this.doc ? this.doc.users.filter(u => u.active !== false) : [];
  },
  async decryptAll() {
    this.names = {};
    this.logins = {};
    if (!SESSION || !this.doc) return;
    for (const u of this.doc.users) {
      try {
        this.names[u.id] = await decStr(SESSION.dk, u.disp);
        this.logins[u.id] = await decStr(SESSION.dk, u.name);
      } catch (e) {
        this.names[u.id] = '؟';
      }
    }
  },
  nameOf(id) {
    return this.names[id] || (id ? String(id).slice(0, 8) : '');
  },
};

async function makeUserRecord(dkRaw, uSalt, { username, display, password, role }, by) {
  const pSalt = rnd(16);
  const { verifier, kek } = await passDerive(password, pSalt);
  const dk = await aesKey(dkRaw, false);
  const rec = {
    id: uid('u_'),
    uh: await userHash(username, uSalt),
    pSalt: b64(pSalt),
    pHash: verifier,
    wDK: await encBytes(kek, dkRaw),
    name: await encStr(dk, normU(username)),
    disp: await encStr(dk, display || username),
    role: ROLES.includes(role) ? role : 'assistant',
    active: true,
    created: localISO(),
    createdBy: by || null,
  };
  rec.pv = await pvOf(rec);
  return rec;
}

async function setupFirstAdmin({ username, display, password }) {
  const dkRaw = rnd(32);
  const uSalt = b64(rnd(16));
  const rec = await makeUserRecord(dkRaw, uSalt, { username, display, password, role: 'admin' }, null);
  const doc = {
    format: 'MEAP-users',
    version: 1,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: KDF_IT, usernameIterations: UH_IT, cipher: 'AES-GCM-256' },
    uSalt,
    users: [rec],
    createdAt: localISO(),
  };
  const existing = await USERS.load();
  if (existing && existing.users.length) throw new Error('يوجد مستخدمون بالفعل في هذا المجلد. سجّل الدخول.');
  await USERS.write(doc);
  return login(username, password);
}

const LOGIN_FAILS = { get: () => LS.get('meap.fails', { n: 0, t: 0 }), set: v => LS.set('meap.fails', v) };
async function login(username, password) {
  const f = LOGIN_FAILS.get();
  if (f.n >= 5 && Date.now() - f.t < 30000) throw new Error('محاولات كثيرة. انتظر 30 ثانية ثم أعد المحاولة.');
  const doc = await USERS.load();
  if (!doc) throw new Error('لا يوجد مستخدمون بعد.');
  const uh = await userHash(username, doc.uSalt);
  const rec = doc.users.find(u => ctEq(u.uh, uh) && u.active !== false);
  const fail = () => {
    LOGIN_FAILS.set({ n: f.n + 1, t: Date.now() });
    return new Error('اسم المستخدم أو كلمة المرور غير صحيحة.');
  };
  if (!rec) {
    await passDerive(password, rnd(16));
    throw fail();
  }
  const { verifier, kek } = await passDerive(password, unb64(rec.pSalt));
  if (!ctEq(verifier, rec.pHash)) throw fail();
  const dkRaw = await decBytes(kek, rec.wDK);
  LOGIN_FAILS.set({ n: 0, t: 0 });
  await startSession(rec, dkRaw, true);
  return SESSION;
}

async function startSession(rec, dkRaw, persist) {
  const dk = await aesKey(dkRaw, false);
  SESSION = { id: rec.id, role: rec.role, pv: rec.pv || (await pvOf(rec)), dk, dkRaw };
  await USERS.decryptAll();
  SESSION.display = USERS.nameOf(rec.id);
  SESSION.username = USERS.logins[rec.id] || '';
  /* Persistent sign-in: kept on this device until the user presses "Sign out". No idle or time-based expiry. */
  if (persist) await KV.set('session:' + hub.STORE_ID, { id: rec.id, pv: SESSION.pv, dk: b64(dkRaw), at: localISO() });
}

async function restoreSession() {
  const s = await KV.get('session:' + hub.STORE_ID);
  if (!s) return null;
  const doc = USERS.doc || (await USERS.load());
  if (!doc) return null;
  const rec = doc.users.find(u => u.id === s.id && u.active !== false);
  if (!rec || !ctEq(await pvOf(rec), s.pv)) {
    await KV.del('session:' + hub.STORE_ID);
    return null;
  }
  await startSession(rec, unb64(s.dk), false);
  return SESSION;
}

/* Called on every sync tick: a deleted/deactivated user or a changed password ends the session */
async function checkSession() {
  if (!SESSION) return true;
  const st = await hub.STORE.stat('_users/users.json');
  if (st && st.mtime === USERS.mtime) return true;
  await USERS.load();
  const rec = USERS.doc && USERS.doc.users.find(u => u.id === SESSION.id && u.active !== false);
  if (!rec || !ctEq(await pvOf(rec), SESSION.pv)) {
    await KV.del('session:' + hub.STORE_ID);
    return false;
  }
  SESSION.role = rec.role;
  await USERS.decryptAll();
  SESSION.display = USERS.nameOf(rec.id);
  return true;
}

async function logout() {
  try {
    await hub.SAVER.flush(true);
  } catch (e) {
    logErr('a2_auth:75 await SAVER.flush(true)', e);
  }
  if (
    hub.SAVER.q.length &&
    !(await hub.ask({
      title: 'تغييرات لم تُحفظ',
      body: 'تعذّر حفظ بعض التغييرات. ستبقى في ذاكرة الجهاز وتُحفظ عند الدخول التالي. هل تريد الخروج؟',
      ok: 'خروج',
      danger: true,
    }))
  )
    return;
  try {
    await hub.presenceLeave();
  } catch (e) {
    logErr('a2_auth:77 await presenceLeave()', e);
  }
  await KV.del('session:' + hub.STORE_ID);
  SESSION = null;
  location.hash = '#/';
  location.reload();
}

async function addUser(o) {
  const e = pwPolicy(o.password);
  if (e) throw new Error(e);
  await USERS.mutate(async d => {
    const uh = await userHash(o.username, d.uSalt);
    if (d.users.some(u => ctEq(u.uh, uh))) throw new Error('اسم المستخدم مستخدم بالفعل.');
    d.users.push(await makeUserRecord(SESSION.dkRaw, d.uSalt, o, SESSION.id));
  });
}
async function setPassword(id, pw) {
  const e = pwPolicy(pw);
  if (e) throw new Error(e);
  await USERS.mutate(async d => {
    const r = d.users.find(u => u.id === id);
    if (!r) throw new Error('المستخدم غير موجود');
    const pSalt = rnd(16);
    const { verifier, kek } = await passDerive(pw, pSalt);
    r.pSalt = b64(pSalt);
    r.pHash = verifier;
    r.wDK = await encBytes(kek, SESSION.dkRaw);
    r.pv = await pvOf(r);
    r.updated = localISO();
    r.updatedBy = SESSION.id;
    if (id === SESSION.id) {
      SESSION.pv = r.pv;
      await KV.set('session:' + hub.STORE_ID, { id, pv: r.pv, dk: b64(SESSION.dkRaw), at: localISO() });
    }
  });
}
async function updateUser(id, { display, role, active }) {
  await USERS.mutate(async d => {
    const r = d.users.find(u => u.id === id);
    if (!r) throw new Error('المستخدم غير موجود');
    if ((role && role !== r.role) || active === false) {
      const admins = d.users.filter(u => u.role === 'admin' && u.active !== false && u.id !== id);
      if (r.role === 'admin' && !admins.length) throw new Error('لا يمكن إزالة آخر مدير.');
    }
    if (display != null) r.disp = await encStr(await aesKey(SESSION.dkRaw, false), display);
    if (role && ROLES.includes(role)) r.role = role;
    if (active != null) r.active = !!active;
    r.updated = localISO();
    r.updatedBy = SESSION.id;
  });
}
async function deleteUser(id) {
  if (id === SESSION.id) throw new Error('لا يمكنك حذف حسابك الحالي.');
  await USERS.mutate(async d => {
    const r = d.users.find(u => u.id === id);
    if (!r) return;
    if (r.role === 'admin' && !d.users.some(u => u.role === 'admin' && u.id !== id && u.active !== false))
      throw new Error('لا يمكن حذف آخر مدير.');
    d.users = d.users.filter(u => u.id !== id);
  });
}

/* Role permissions */
/* v3 approval chain: preparer (assistant) → reviewer → partner → engagement quality reviewer (eqr) */
const PERM = {
  admin: { edit: 1, review: 1, create: 1, archive: 1, del: 1, users: 1, settings: 1, partner: 1, eqr: 1, reopen: 1 },
  partner: { edit: 1, review: 1, create: 1, archive: 1, partner: 1, reopen: 1 },
  eqr: { review: 1, eqr: 1, comment: 1 },
  reviewer: { edit: 1, review: 1, create: 1, reopen: 1 },
  assistant: { edit: 1 },
  viewer: {},
};
const can = a => !!(SESSION && PERM[SESSION.role] && PERM[SESSION.role][a]);

export {
  ROLES,
  USERS,
  addUser,
  can,
  checkSession,
  ctEq,
  deleteUser,
  login,
  logout,
  normU,
  passDerive,
  pwPolicy,
  restoreSession,
  setPassword,
  setupFirstAdmin,
  updateUser,
};
