/* ============================================================
   AuditPro - Storage Engine (v2 — ملف مستقل لكل شركة)
   ------------------------------------------------------------
   يخزّن هذا المحرك بيانات كل شركة/عميل في ملف JSON مستقل خاص به
   (غير مشفّر، نص عادي قابل للقراءة) داخل مجلد يختاره المستخدم،
   باستخدام File System Access API.

   هيكل المجلد المُختار:
     <المجلد المُختار>/
       clients/
         <اسم الشركة>-<رقم>.json   ← ملف مستقل ومكتفٍ ذاتياً لكل عميل
                                     (بياناته + تخطيطه + إجراءاته...)
       settings.json                ← إعدادات المكتب العامة (ليست خاصة
                                       بعميل بعينه: اسم المكتب، الشعار،
                                       الفئات والإجراءات المخصصة...)
       attachments/<مجلد كل سجل>/  ← الملفات المرفقة الحقيقية

   بهذا الشكل:
   • يمكن إضافة ملف شركة جديد (منسوخ من جهاز آخر) داخل مجلد clients/
     مباشرة من خارج البرنامج، وسيظهر تلقائياً عند إعادة فتح النظام.
   • يمكن حذف ملف شركة من داخل مجلد clients/ مباشرة (أو نقله خارج
     المجلد) لإخفائه/التخلص منه، دون أي أثر على باقي الشركات.
   • نسخ مجلد شركة واحدة (ملفها + مرفقاتها) يكفي لنقلها كاملة.

   إن كان المتصفح لا يدعم هذه التقنية (Firefox / Safari / الجوال)،
   يتحول النظام تلقائياً لتخزين المتصفح (IndexedDB) كحل بديل أخير
   فقط، مع تنبيه دائم للمستخدم بذلك (وليس هذا الوضع الافتراضي أبداً
   عندما يكون الربط بمجلد ممكناً).

   يدعم هذا المحرك أيضاً كشف التعارض (تعديل من جهاز/نافذة أخرى)
   والترحيل التلقائي لمرة واحدة من الإصدار القديم (ملف واحد ضخم
   لكل النظام) إلى هذا الهيكل الجديد.
   ============================================================ */

const Storage = (() => {

  const CLIENTS_SUBFOLDER      = 'clients';
  const ATTACHMENTS_SUBFOLDER  = 'attachments';
  const GLOBAL_FILENAME        = 'settings.json';
  const LEGACY_SUBFOLDER       = 'data';
  const LEGACY_FILENAME        = 'auditpro-data.json';

  /* مفاتيح "عامة" لا تخص عميلاً بعينه، تُحفظ في settings.json */
  const GLOBAL_KEYS = ['settings', 'customCategories', 'customProcedureDefs'];

  const HANDLE_DB_NAME    = 'AuditProHandleStore';
  const HANDLE_DB_VERSION = 1;
  const HANDLE_STORE      = 'handles';
  const HANDLE_KEY        = 'dataDirHandle';

  const FALLBACK_DB_NAME    = 'AuditProFallbackDB';
  const FALLBACK_DB_VERSION = 1;
  const FALLBACK_STORE      = 'kv';
  const FALLBACK_KEY        = 'auditpro-data';

  /* مخزن منفصل لملفات المرفقات في حال عدم توافر File System Access API */
  const ATTACH_DB_NAME    = 'AuditProAttachmentsDB';
  const ATTACH_DB_VERSION = 1;
  const ATTACH_STORE       = 'files';

  let mode          = null;   // 'folder' | 'browser'
  let dirHandle      = null;
  let clientsDirHandle = null;
  let attachmentsDirHandle = null;
  let folderName     = '';
  let saveTimer      = null;
  let savingCb       = null;
  let conflictCb     = null;
  let lastSaveError  = null;

  /* حالة مجلد "folder": مرجع اسم الملف الحالي وتاريخ آخر تعديل معروف
     لكل عميل (لاكتشاف إعادة التسمية والتعارضات)، وكذلك للملف العام */
  let fileNameByClientId = new Map();  // clientId -> اسم الملف الحالي
  let fileMetaByClientId = new Map();  // clientId -> { fileName, lastModified }
  let globalMeta          = null;      // { lastModified } لملف settings.json

  const supportsFSA = () =>
    typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

  /* ---------------------------------------------------------
     Tiny generic IndexedDB helpers (تخزين مرجع المجلد، الاحتياطي
     الكامل عند عدم توافر FSA، وملفات المرفقات في نفس الحالة)
     --------------------------------------------------------- */
  function openSimpleDB(name, version, storeName) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(name, version);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(storeName)) {
          req.result.createObjectStore(storeName);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }

  function idbGet(dbInst, storeName, key) {
    return new Promise((resolve, reject) => {
      const tx  = dbInst.transaction([storeName], 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }

  function idbSet(dbInst, storeName, key, value) {
    return new Promise((resolve, reject) => {
      const tx  = dbInst.transaction([storeName], 'readwrite');
      const req = tx.objectStore(storeName).put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror   = () => reject(req.error);
    });
  }

  function idbDelete(dbInst, storeName, key) {
    return new Promise((resolve) => {
      try {
        const tx = dbInst.transaction([storeName], 'readwrite');
        tx.objectStore(storeName).delete(key);
        tx.oncomplete = () => resolve(true);
        tx.onerror    = () => resolve(false);
      } catch (e) { resolve(false); }
    });
  }

  function idbDeletePrefix(dbInst, storeName, prefix) {
    return new Promise((resolve) => {
      try {
        const tx    = dbInst.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const range = IDBKeyRange.bound(prefix, prefix + '\uffff');
        const req   = store.openCursor(range);
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) { cursor.delete(); cursor.continue(); }
          else resolve(true);
        };
        req.onerror = () => resolve(false);
      } catch (e) { resolve(false); }
    });
  }

  function openAttachDB() { return openSimpleDB(ATTACH_DB_NAME, ATTACH_DB_VERSION, ATTACH_STORE); }

  /* ---------------------------------------------------------
     Remembering the chosen directory handle (just a pointer —
     the actual audit data always lives inside the chosen folder)
     --------------------------------------------------------- */
  async function rememberHandle(handle) {
    try {
      const db = await openSimpleDB(HANDLE_DB_NAME, HANDLE_DB_VERSION, HANDLE_STORE);
      await idbSet(db, HANDLE_STORE, HANDLE_KEY, handle);
    } catch (e) { console.warn('تعذر حفظ مرجع مجلد البيانات', e); }
  }

  async function recallHandle() {
    try {
      const db = await openSimpleDB(HANDLE_DB_NAME, HANDLE_DB_VERSION, HANDLE_STORE);
      return await idbGet(db, HANDLE_STORE, HANDLE_KEY);
    } catch (e) { return null; }
  }

  async function forgetHandle() {
    try {
      const db = await openSimpleDB(HANDLE_DB_NAME, HANDLE_DB_VERSION, HANDLE_STORE);
      const tx = db.transaction([HANDLE_STORE], 'readwrite');
      tx.objectStore(HANDLE_STORE).delete(HANDLE_KEY);
    } catch (e) { /* ignore */ }
  }

  /* ---------------------------------------------------------
     أسماء ملفات الشركات
     --------------------------------------------------------- */
  function sanitizeFileName(str) {
    return String(str || 'شركة')
      .replace(/[\/\\:*?"<>|\u0000-\u001F]/g, ' ')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'شركة';
  }

  function clientFileNameFor(client) {
    const label = sanitizeFileName(client.name || client.fileNumber || 'شركة');
    return `${label}-${client.id}.json`;
  }

  async function ensureClientsDir(create = true) {
    if (!clientsDirHandle) {
      clientsDirHandle = await dirHandle.getDirectoryHandle(CLIENTS_SUBFOLDER, { create });
    }
    return clientsDirHandle;
  }

  /* ---------------------------------------------------------
     Folder backend — setup / connect
     --------------------------------------------------------- */
  async function setupFromDirHandle(handle) {
    dirHandle  = handle;
    folderName = handle.name;
    mode = 'folder';
    clientsDirHandle = null;
    fileNameByClientId = new Map();
    fileMetaByClientId = new Map();
    globalMeta = null;
    attachmentsDirHandle = await handle.getDirectoryHandle(ATTACHMENTS_SUBFOLDER, { create: true });
    await ensureClientsDir(true);
    await migrateLegacyIfNeeded();
  }

  /** يطلب من المستخدم اختيار مجلد (يتطلب تفاعل المستخدم - نقرة زر).
      يوصى بإنشاء مجلد جديد باسم "Data" بجانب مجلد البرنامج واختياره هنا؛
      سيُنشئ النظام بداخله مجلد "clients" بملف مستقل لكل شركة تلقائياً. */
  async function connectFolder() {
    if (!supportsFSA()) throw new Error('FSA_UNSUPPORTED');
    const handle = await window.showDirectoryPicker({ id: 'auditpro-data', mode: 'readwrite' });
    await setupFromDirHandle(handle);
    await rememberHandle(handle);
    return true;
  }

  /** محاولة إعادة الاتصال التلقائي (دون تدخل المستخدم) بمجلد سبق اختياره */
  async function tryReconnect() {
    if (!supportsFSA()) return 'unsupported';
    let handle;
    try { handle = await recallHandle(); } catch (e) { handle = null; }
    if (!handle) return 'none';

    try {
      const perm = await handle.queryPermission({ mode: 'readwrite' });
      if (perm === 'granted') {
        await setupFromDirHandle(handle);
        return 'connected';
      }
      // نحتفظ بالمرجع لإعادة طلب الإذن بنقرة واحدة من المستخدم
      dirHandle  = handle;
      folderName = handle.name;
      return 'needs-permission';
    } catch (e) {
      return 'none';
    }
  }

  /** إعادة طلب الإذن بعد تفاعل المستخدم (نقرة زر) */
  async function reconnectWithPermission() {
    if (!dirHandle) return false;
    const perm = await dirHandle.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted') return false;
    await setupFromDirHandle(dirHandle);
    return true;
  }

  /** التحول الصريح لتخزين المتصفح (اختيار المستخدم أو عدم دعم المتصفح فقط) */
  function useBrowserStorage() {
    mode = 'browser';
  }

  /* ---------------------------------------------------------
     ترحيل تلقائي لمرة واحدة: من الإصدار القديم (ملف واحد ضخم
     data/auditpro-data.json يحوي كل الشركات معاً) إلى ملف مستقل
     لكل شركة داخل clients/. يعمل تلقائياً دون أي تدخل من المستخدم
     أول مرة يُفتح فيها مجلد بيانات قديم بالنظام الجديد.
     --------------------------------------------------------- */
  async function migrateLegacyIfNeeded() {
    try {
      const legacyDir = await dirHandle.getDirectoryHandle(LEGACY_SUBFOLDER, { create: false }).catch(() => null);
      if (!legacyDir) return;
      const legacyFh = await legacyDir.getFileHandle(LEGACY_FILENAME, { create: false }).catch(() => null);
      if (!legacyFh) return;

      // إن كان مجلد clients يحتوي بالفعل ملفات، فقد سبق الترحيل - لا نكرره
      const cDir = await ensureClientsDir(true);
      for await (const [name] of cDir.entries()) { if (name) return; }

      const file = await legacyFh.getFile();
      const text = await file.text();
      if (!text || !text.trim()) return;
      let json; try { json = JSON.parse(text); } catch (e) { return; }
      const stores = (json && json.stores) || json;
      if (!stores || !Array.isArray(stores.clients) || stores.clients.length === 0) return;

      await saveFolderData(stores, true);

      // نُبقي نسخة احتياطية من الملف القديم بدل حذفه نهائياً، احتياطاً
      try {
        const backupFh = await legacyDir.getFileHandle('auditpro-data.legacy-backup.json', { create: true });
        const w = await backupFh.createWritable();
        await w.write(text);
        await w.close();
        await legacyDir.removeEntry(LEGACY_FILENAME);
      } catch (e) { /* ignore */ }

      console.log('✅ تم ترحيل بيانات النسخة السابقة تلقائياً إلى ملف مستقل لكل شركة داخل مجلد clients/');
    } catch (e) {
      console.warn('تعذر فحص/ترحيل بيانات النسخة القديمة', e);
    }
  }

  /* ---------------------------------------------------------
     قراءة كل ملفات الشركات من مجلد clients/ (اكتشاف تلقائي — أي
     ملف يُضاف أو يُحذف مباشرة من هذا المجلد يظهر/يختفي هنا تلقائياً)
     --------------------------------------------------------- */
  async function loadFolderClientStores() {
    const dir = await ensureClientsDir(true);
    const merged = { clients: [] };
    const seenIds = new Set();
    let remapCounter = 900000 + (Date.now() % 90000);
    let anyRemapped = false;

    for await (const [name, handle] of dir.entries()) {
      if (!handle || handle.kind !== 'file' || !name.toLowerCase().endsWith('.json')) continue;
      let json;
      try {
        const file = await handle.getFile();
        const text = await file.text();
        if (!text || !text.trim()) continue;
        json = JSON.parse(text);
      } catch (e) {
        console.warn(`ملف شركة تالف أو غير قابل للقراءة تم تجاهله: ${name}`, e);
        continue;
      }
      if (!json || !json.client || json.client.id === undefined || json.client.id === null) {
        console.warn(`ملف داخل مجلد clients/ بصيغة غير متعرَّف عليها تم تجاهله: ${name}`);
        continue;
      }

      let clientId = json.client.id;
      if (seenIds.has(clientId)) {
        // تعارض رقم عميل (غالباً بسبب نسخ ملف شركة من نظام/جهاز آخر يحمل
        // نفس الرقم التسلسلي) - نعيد ترقيمه تلقائياً بأمان بدل تجاهله
        const oldId = clientId;
        clientId = remapCounter++;
        json.client.id = clientId;
        Object.keys(json.stores || {}).forEach(k => {
          (json.stores[k] || []).forEach(r => { if (r && r.clientId === oldId) r.clientId = clientId; });
        });
        anyRemapped = true;
        console.warn(`تعارض في رقم الشركة داخل الملف "${name}" — تمت إعادة ترقيمه تلقائياً لتفادي التداخل مع شركة أخرى`);
      }
      seenIds.add(clientId);

      merged.clients.push(json.client);
      Object.keys(json.stores || {}).forEach(k => {
        if (!Array.isArray(merged[k])) merged[k] = [];
        merged[k] = merged[k].concat(Array.isArray(json.stores[k]) ? json.stores[k] : []);
      });

      fileNameByClientId.set(clientId, name);
      try {
        const f = await handle.getFile();
        fileMetaByClientId.set(clientId, { fileName: name, lastModified: f.lastModified });
      } catch (e) { /* ignore */ }
    }

    merged.__anyRemapped = anyRemapped;
    return merged;
  }

  async function loadGlobalFileData() {
    try {
      const gfh = await dirHandle.getFileHandle(GLOBAL_FILENAME, { create: true });
      const file = await gfh.getFile();
      globalMeta = { lastModified: file.lastModified };
      const text = await file.text();
      if (!text || !text.trim()) return { settings: [], customCategories: [], customProcedureDefs: [] };
      const json = JSON.parse(text);
      return {
        settings:            Array.isArray(json.settings) ? json.settings : [],
        customCategories:    Array.isArray(json.customCategories) ? json.customCategories : [],
        customProcedureDefs: Array.isArray(json.customProcedureDefs) ? json.customProcedureDefs : []
      };
    } catch (e) {
      console.error('تعذرت قراءة ملف الإعدادات العامة', e);
      return { settings: [], customCategories: [], customProcedureDefs: [] };
    }
  }

  /* ---------------------------------------------------------
     كتابة البيانات: ملف مستقل لكل شركة + ملف إعدادات عام واحد
     --------------------------------------------------------- */
  async function saveFolderData(stores, force) {
    const dir = await ensureClientsDir(true);
    const clients = Array.isArray(stores.clients) ? stores.clients : [];
    const currentIds = new Set(clients.map(c => c.id));

    /* 1) فحص التعارض أولاً (إلا في حال force): هل عُدِّل أي ملف من مكان آخر؟ */
    if (!force) {
      for (const client of clients) {
        const prevMeta = fileMetaByClientId.get(client.id);
        if (!prevMeta) continue;
        try {
          const fh = await dir.getFileHandle(prevMeta.fileName);
          const f  = await fh.getFile();
          if (f.lastModified !== prevMeta.lastModified) return { conflict: true };
        } catch (e) { /* الملف غير موجود - ليس تعارضاً، سنعيد إنشاءه */ }
      }
      if (globalMeta) {
        try {
          const gfh = await dirHandle.getFileHandle(GLOBAL_FILENAME);
          const gf  = await gfh.getFile();
          if (gf.lastModified !== globalMeta.lastModified) return { conflict: true };
        } catch (e) { /* تجاهل */ }
      }
    }

    /* 2) كتابة ملف كل شركة (مع تنظيف الملف القديم إن تغيّر اسمه) */
    for (const client of clients) {
      const fname   = clientFileNameFor(client);
      const oldName = fileNameByClientId.get(client.id);
      if (oldName && oldName !== fname) {
        try { await dir.removeEntry(oldName); } catch (e) { /* تجاهل */ }
      }

      const payload = { version: 2, savedAt: new Date().toISOString(), client, stores: {} };
      Object.keys(stores).forEach(k => {
        if (k === 'clients' || GLOBAL_KEYS.includes(k) || k.startsWith('__')) return;
        payload.stores[k] = (stores[k] || []).filter(r => r && r.clientId === client.id);
      });

      const fh = await dir.getFileHandle(fname, { create: true });
      const writable = await fh.createWritable();
      await writable.write(JSON.stringify(payload, null, 2));
      await writable.close();

      const after = await fh.getFile();
      fileNameByClientId.set(client.id, fname);
      fileMetaByClientId.set(client.id, { fileName: fname, lastModified: after.lastModified });
    }

    /* 3) حذف ملفات الشركات التي لم تعد موجودة (تم حذفها من داخل النظام) */
    for (const [id, fname] of [...fileNameByClientId.entries()]) {
      if (!currentIds.has(id)) {
        try { await dir.removeEntry(fname); } catch (e) { /* تجاهل */ }
        fileNameByClientId.delete(id);
        fileMetaByClientId.delete(id);
      }
    }

    /* 4) ملف الإعدادات العامة (لا يخص شركة بعينها) */
    const globalPayload = {
      version: 2, savedAt: new Date().toISOString(),
      settings:            stores.settings || [],
      customCategories:    stores.customCategories || [],
      customProcedureDefs: stores.customProcedureDefs || []
    };
    const gfh = await dirHandle.getFileHandle(GLOBAL_FILENAME, { create: true });
    const gwritable = await gfh.createWritable();
    await gwritable.write(JSON.stringify(globalPayload, null, 2));
    await gwritable.close();
    const gafter = await gfh.getFile();
    globalMeta = { lastModified: gafter.lastModified };

    return { conflict: false };
  }

  /* ---------------------------------------------------------
     تخزين المتصفح الاحتياطي (IndexedDB) — فقط عند عدم توافر FSA
     أو باختيار صريح من المستخدم؛ ليس الوضع الافتراضي أبداً.
     --------------------------------------------------------- */
  async function loadBrowserData() {
    try {
      const db    = await openSimpleDB(FALLBACK_DB_NAME, FALLBACK_DB_VERSION, FALLBACK_STORE);
      const value = await idbGet(db, FALLBACK_STORE, FALLBACK_KEY);
      if (!value) return { stores: null };
      const parsed = JSON.parse(value);
      return { stores: (parsed && parsed.stores) || parsed };
    } catch (e) {
      console.error('تعذرت قراءة بيانات المتصفح', e);
      return { stores: null };
    }
  }

  async function saveBrowserData(stores) {
    const db = await openSimpleDB(FALLBACK_DB_NAME, FALLBACK_DB_VERSION, FALLBACK_STORE);
    await idbSet(db, FALLBACK_STORE, FALLBACK_KEY, JSON.stringify({ stores }));
    return { conflict: false };
  }

  /* ---------------------------------------------------------
     Public load / save
     (نفس الشكل الخارجي القديم بالضبط: { stores: {...} } — بحيث
     لا حاجة لأي تعديل في db.js أو أي وحدة أخرى تستخدم هذه الواجهة)
     --------------------------------------------------------- */
  async function load() {
    if (mode === 'folder') {
      const clientStores = await loadFolderClientStores();
      const remapped = !!clientStores.__anyRemapped;
      delete clientStores.__anyRemapped;
      const globalStores = await loadGlobalFileData();
      const merged = Object.assign({}, clientStores, globalStores);
      if (remapped) {
        try { await saveFolderData(merged, true); } catch (e) { console.warn(e); }
      }
      return { stores: merged };
    }
    return await loadBrowserData();
  }

  function save(dataObj, opts = {}) {
    const immediate = !!opts.immediate;
    const force      = !!opts.force;
    clearTimeout(saveTimer);

    const doSave = async () => {
      notifySaving(true);
      try {
        const stores = (dataObj && dataObj.stores) ? dataObj.stores : dataObj;
        const result = mode === 'folder'
          ? await saveFolderData(stores, force)
          : await saveBrowserData(stores);

        if (result && result.conflict) {
          lastSaveError = null;
          if (typeof conflictCb === 'function') conflictCb(dataObj);
          return;
        }
        lastSaveError = null;
      } catch (e) {
        lastSaveError = e;
        console.error('فشل حفظ البيانات', e);
      } finally {
        notifySaving(false);
      }
    };

    if (immediate) return doSave();
    saveTimer = setTimeout(doSave, 400);
    return Promise.resolve();
  }

  function onSavingChange(cb)  { savingCb = cb; }
  function onConflict(cb)      { conflictCb = cb; }
  function notifySaving(isSaving) { if (typeof savingCb === 'function') savingCb(isSaving, lastSaveError); }

  function getMode()        { return mode; }
  function getFolderName()  { return folderName; }
  function isSupported()    { return supportsFSA(); }
  function getClientCount() { return fileNameByClientId.size; }

  /* ---------------------------------------------------------
     تخزين ملفات المرفقات الحقيقية (لكل سجل "مجلد" خاص به) —
     بلا تغيير عن الإصدار السابق (لا يزال مجلد attachments/ واحداً
     مشتركاً في جذر مجلد التخزين، منظَّماً بمجلد فرعي لكل سجل)
     --------------------------------------------------------- */
  async function getOwnerDirHandle(folderKey, create) {
    if (!attachmentsDirHandle) {
      attachmentsDirHandle = await dirHandle.getDirectoryHandle(ATTACHMENTS_SUBFOLDER, { create: true });
    }
    return attachmentsDirHandle.getDirectoryHandle(folderKey, { create: !!create });
  }

  /** حفظ ملف مرفق حقيقي داخل مجلد السجل الخاص به */
  async function saveAttachmentFile(folderKey, fileName, blob) {
    if (mode === 'folder') {
      const ownerDir = await getOwnerDirHandle(folderKey, true);
      const fh = await ownerDir.getFileHandle(fileName, { create: true });
      const writable = await fh.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    }
    const db = await openAttachDB();
    await idbSet(db, ATTACH_STORE, `${folderKey}/${fileName}`, blob);
    return true;
  }

  /** قراءة ملف مرفق (يُعيد Blob/File أو null) */
  async function loadAttachmentFile(folderKey, fileName) {
    if (mode === 'folder') {
      try {
        const ownerDir = await getOwnerDirHandle(folderKey, false);
        const fh = await ownerDir.getFileHandle(fileName);
        return await fh.getFile();
      } catch (e) { return null; }
    }
    try {
      const db  = await openAttachDB();
      const val = await idbGet(db, ATTACH_STORE, `${folderKey}/${fileName}`);
      return val || null;
    } catch (e) { return null; }
  }

  /** حذف ملف مرفق واحد فقط */
  async function deleteAttachmentFile(folderKey, fileName) {
    if (mode === 'folder') {
      try {
        const ownerDir = await getOwnerDirHandle(folderKey, false);
        await ownerDir.removeEntry(fileName);
      } catch (e) { /* تجاهل إن كان غير موجود مسبقاً */ }
      return;
    }
    try {
      const db = await openAttachDB();
      await idbDelete(db, ATTACH_STORE, `${folderKey}/${fileName}`);
    } catch (e) { /* ignore */ }
  }

  /** حذف مجلد السجل بالكامل (كل مرفقاته) عند حذف السجل نفسه */
  async function deleteAttachmentFolder(folderKey) {
    if (!folderKey) return;
    if (mode === 'folder') {
      try {
        if (!attachmentsDirHandle) {
          attachmentsDirHandle = await dirHandle.getDirectoryHandle(ATTACHMENTS_SUBFOLDER, { create: true });
        }
        await attachmentsDirHandle.removeEntry(folderKey, { recursive: true });
      } catch (e) { /* تجاهل إن كان غير موجود */ }
      return;
    }
    try {
      const db = await openAttachDB();
      await idbDeletePrefix(db, ATTACH_STORE, `${folderKey}/`);
    } catch (e) { /* ignore */ }
  }

  return {
    isSupported,
    connectFolder,
    tryReconnect,
    reconnectWithPermission,
    useBrowserStorage,
    load,
    save,
    onSavingChange,
    onConflict,
    getMode,
    getFolderName,
    getClientCount,
    forgetHandle,
    // Attachments (ملفات حقيقية داخل مجلد attachments/<folderKey>/)
    saveAttachmentFile,
    loadAttachmentFile,
    deleteAttachmentFile,
    deleteAttachmentFolder
  };
})();
