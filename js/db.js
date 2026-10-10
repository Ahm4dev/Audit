/* ============================================================
   AuditPro - Database Layer
   ------------------------------------------------------------
   طبقة بيانات داخل الذاكرة (In-memory) تُحفظ تلقائياً عبر محرك
   التخزين Storage (مجلد البرنامج أو المتصفح كحل بديل).
   تحافظ هذه الطبقة على نفس واجهة الاستخدام (AuditDB.*) التي
   تعتمد عليها جميع وحدات النظام، بحيث لا حاجة لتعديلها.
   ============================================================ */

const STORES = {
  CLIENTS:               'clients',
  PLANNING:              'planning',
  MATERIALITY:           'materiality',
  PROGRAMS:              'programs',
  PROCEDURES:            'procedures',
  WORKPAPERS:            'workpapers',
  FINDINGS:              'findings',
  SETTINGS:              'settings',
  ACTIVITY:              'activity',
  ATTACHMENTS:           'attachments',
  RISKS:                 'risks',
  CUSTOM_CATEGORIES:     'customCategories',
  CUSTOM_PROCEDURE_DEFS: 'customProcedureDefs',
  AUDIT_TRAIL:           'auditTrail',
  YEAR_DATA:             'yearData',
  LETTERS:               'letters',
  GOING_CONCERN:         'goingConcern',
  COMPONENTS:            'components',
  RELIANCE:              'reliance',
  QUALITY_REVIEW:        'qualityReview'
};

/* حقول يجب أن تبقى فريدة داخل مخزن معيّن (محاكاة لقيود IndexedDB القديمة) */
const UNIQUE_FIELDS = {
  [STORES.CLIENTS]: ['fileNumber']
};

const DB_FORMAT_VERSION = 4;

/* ---- Audit trail helper ---- */
function trailLog(clientId, entity, entityId, action, oldVal = null, newVal = null) {
  return dbAdd(STORES.AUDIT_TRAIL, {
    timestamp: new Date().toISOString(),
    clientId:  clientId || null,
    entity, entityId, action,
    oldValue: oldVal ? JSON.stringify(oldVal) : null,
    newValue: newVal ? JSON.stringify(newVal) : null
  });
}

/* ---- إصلاح خلل #2: سجل تدقيق تلقائي على مستوى طبقة التخزين ----
   بدلاً من الاعتماد على كل وحدة لتسجيل تغييراتها يدوياً (وهو ما لم
   يكن يحدث في معظم الوحدات)، يُسجَّل هنا تلقائياً كل إضافة/تعديل/
   حذف على المخازن "المهمة" مباشرة من dbAdd/dbPut/dbDelete، بحيث
   يصبح سجل التدقيق شاملاً فعلاً ولا يعتمد على تذكّر المطوّر. */
const TRAIL_ENTITY_MAP = {
  [STORES.CLIENTS]:     'client',
  [STORES.PLANNING]:    'planning',
  [STORES.MATERIALITY]: 'materiality',
  [STORES.PROCEDURES]:  'procedure',
  [STORES.WORKPAPERS]:  'workpaper',
  [STORES.FINDINGS]:    'finding',
  [STORES.RISKS]:       'risk',
  [STORES.LETTERS]:     'letter',
  [STORES.ATTACHMENTS]: 'attachment',
  [STORES.GOING_CONCERN]: 'going_concern',
  [STORES.COMPONENTS]:  'component',
  [STORES.RELIANCE]:    'reliance',
  [STORES.QUALITY_REVIEW]: 'quality_review'
};

function resolveTrailClientId(storeName, record) {
  if (!record) return null;
  return storeName === STORES.CLIENTS ? record.id : (record.clientId ?? null);
}

function autoTrailLog(storeName, action, id, oldRecord, newRecord) {
  const entity = TRAIL_ENTITY_MAP[storeName];
  if (!entity) return; // مخازن داخلية/نظامية لا تُسجَّل في سجل التدقيق
  const clientId = resolveTrailClientId(storeName, newRecord || oldRecord);
  // Fire-and-forget: لا ننتظر هذا التسجيل ولا نُفشل العملية الأصلية بسببه
  trailLog(clientId, entity, id, action, oldRecord, newRecord).catch(() => {});
}

let DATA     = null;  // { clients: [...], planning: [...], ... }
let NEXT_ID  = {};     // عدّاد تلقائي الزيادة لكل مخزن

class ConstraintError extends Error {
  constructor(msg) { super(msg); this.name = 'ConstraintError'; }
}

/* ---- إصلاح خلل #8: دعم تعدد السنوات المالية لكل عميل ----
   سابقاً، كانت كل سجلات الإجراءات/أوراق العمل/الملاحظات/التخطيط/
   المخاطر مرتبطة بـ clientId فقط دون أي بُعد زمني، فإذا استمرّ
   المكتب باستخدام نفس ملف العميل لسنة المراجعة التالية (وهو
   الاستخدام الطبيعي)، تختلط بيانات كل السنوات معاً بلا أي فصل.

   الآن يحمل كل سجل من هذه المخازن حقل "fiscalYear" (نص السنة، مثل
   "2024") يُوسَم تلقائياً من السنة المالية الحالية للعميل (client.
   financialYear) وقت إنشاء السجل. عند "بدء سنة مراجعة جديدة" لعميل
   (من شاشة العميل)، تتغيّر السنة المالية الحالية للعميل، فتُوسَم كل
   السجلات الجديدة بالسنة الجديدة، بينما تبقى سجلات السنوات السابقة
   محفوظة كما هي تحت وسمها القديم (أرشيف يمكن استعراضه، وضع قراءة فقط). */
const FISCAL_YEAR_STORES = new Set([
  STORES.PLANNING, STORES.MATERIALITY, STORES.PROCEDURES,
  STORES.WORKPAPERS, STORES.FINDINGS, STORES.RISKS, STORES.LETTERS,
  STORES.GOING_CONCERN, STORES.COMPONENTS, STORES.RELIANCE, STORES.QUALITY_REVIEW
]);

function getClientFinancialYear(clientId) {
  const client = (DATA[STORES.CLIENTS] || []).find(c => c.id === clientId);
  return client && client.financialYear ? String(client.financialYear) : null;
}

/** يوسم السجلات الجديدة تلقائياً بالسنة المالية الحالية للعميل إن لم تُحدَّد صريحاً */
function stampFiscalYear(storeName, data) {
  if (!FISCAL_YEAR_STORES.has(storeName)) return data;
  if (data.fiscalYear) return data; // مُحدَّدة صريحاً مسبقاً (مثل بدء سنة جديدة)
  if (!data.clientId) return data;
  const fy = getClientFinancialYear(data.clientId);
  return fy ? { ...data, fiscalYear: fy } : data;
}

/** ترحيل لمرة واحدة: وسم السجلات القديمة (قبل هذا الإصدار) التي لا تحمل fiscalYear
    بالسنة المالية الحالية للعميل وقت الترحيل، بحيث لا تضيع أو تختلط لاحقاً. */
function migrateFiscalYears() {
  let migrated = 0;
  FISCAL_YEAR_STORES.forEach(storeName => {
    (DATA[storeName] || []).forEach(record => {
      if (!record.fiscalYear && record.clientId) {
        const fy = getClientFinancialYear(record.clientId);
        if (fy) { record.fiscalYear = fy; migrated++; }
      }
    });
  });
  if (migrated > 0) {
    console.log(`🗂️ تم ترحيل ${migrated} سجلاً لربطها بالسنة المالية الحالية لكل عميل`);
    persist();
  }
}

function emptyData() {
  const d = {};
  Object.values(STORES).forEach(s => { d[s] = []; });
  return d;
}

function computeNextIds() {
  Object.values(STORES).forEach(s => {
    const arr = DATA[s] || [];
    const maxId = arr.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);
    NEXT_ID[s] = maxId + 1;
  });
}

function checkUnique(storeName, data, excludeId = null) {
  const fields = UNIQUE_FIELDS[storeName];
  if (!fields) return;
  for (const field of fields) {
    const val = data[field];
    if (val === undefined || val === null || val === '') continue;
    const clash = DATA[storeName].some(r => r.id !== excludeId && r[field] === val);
    if (clash) throw new ConstraintError(`القيمة مكررة في الحقل: ${field}`);
  }
}

/* ---- Open / initialize ---- */
async function openDB() {
  let loaded = null;
  try { loaded = await Storage.load(); } catch (e) { console.error(e); }

  DATA = emptyData();
  if (loaded && typeof loaded === 'object') {
    const sourceStores = loaded.stores && typeof loaded.stores === 'object' ? loaded.stores : loaded;
    Object.keys(DATA).forEach(k => {
      if (Array.isArray(sourceStores[k])) DATA[k] = sourceStores[k];
    });
  }
  computeNextIds();
  migrateFiscalYears();
  return DATA;
}

function persist() {
  Storage.save({
    version: DB_FORMAT_VERSION,
    savedAt: new Date().toISOString(),
    stores: DATA
  });
}

/* ---- Generic CRUD helpers ---- */

function dbAdd(storeName, data) {
  return new Promise((resolve, reject) => {
    try {
      data = stampFiscalYear(storeName, data);
      checkUnique(storeName, data);
      const id = NEXT_ID[storeName]++;
      const now = new Date().toISOString();
      const record = { ...data, id, createdAt: now, updatedAt: now };
      DATA[storeName].push(record);
      persist();
      autoTrailLog(storeName, 'add', id, null, record);
      resolve(id);
    } catch (err) { reject(err); }
  });
}

function dbPut(storeName, data) {
  return new Promise((resolve, reject) => {
    try {
      if (data.id === undefined || data.id === null) {
        reject(new Error('Missing id for put()')); return;
      }
      data = stampFiscalYear(storeName, data);
      checkUnique(storeName, data, data.id);
      const idx = DATA[storeName].findIndex(r => r.id === data.id);
      const oldRecord = idx >= 0 ? { ...DATA[storeName][idx] } : null;
      const record = { ...data, updatedAt: new Date().toISOString() };
      if (idx >= 0) DATA[storeName][idx] = { ...DATA[storeName][idx], ...record };
      else DATA[storeName].push(record);
      if (Number(data.id) >= NEXT_ID[storeName]) NEXT_ID[storeName] = Number(data.id) + 1;
      persist();
      const newRecord = DATA[storeName].find(r => r.id === data.id);
      autoTrailLog(storeName, oldRecord ? 'update' : 'add', data.id, oldRecord, newRecord);
      resolve(data.id);
    } catch (err) { reject(err); }
  });
}

function dbGet(storeName, id) {
  return new Promise((resolve) => {
    resolve(DATA[storeName].find(r => r.id === id));
  });
}

function dbGetAll(storeName) {
  return new Promise((resolve) => resolve([...DATA[storeName]]));
}

function dbGetByIndex(storeName, indexName, value) {
  return new Promise((resolve) => resolve(DATA[storeName].filter(r => r[indexName] === value)));
}

/** يُعيد سجلات عميل معيّن لمخزن معيّن، مفلترة بسنة مالية محدّدة فقط
    (إصلاح خلل #8). إن لم يُمرَّر year، تُعاد كل سجلات العميل كما كانت سابقاً
    (للاستخدامات التي تحتاج عرضاً عابراً للسنوات مثل تقرير مقارنة السنتين). */
function dbGetByClientYear(storeName, clientId, fiscalYear) {
  return new Promise((resolve) => {
    let rows = DATA[storeName].filter(r => r.clientId === clientId);
    if (fiscalYear !== undefined && fiscalYear !== null) {
      const fy = String(fiscalYear);
      rows = rows.filter(r => String(r.fiscalYear || '') === fy);
    }
    resolve(rows);
  });
}

/** يُعيد قائمة السنوات المالية التي توجد لها بيانات فعلية لعميل معيّن
    (مُرتَّبة تنازلياً، الأحدث أولاً)، مع إضافة السنة المالية الحالية
    للعميل دائماً حتى لو لم تحتوِ على بيانات بعد. */
function getAvailableYears(clientId) {
  return new Promise((resolve) => {
    const years = new Set();
    FISCAL_YEAR_STORES.forEach(storeName => {
      DATA[storeName].forEach(r => {
        if (r.clientId === clientId && r.fiscalYear) years.add(String(r.fiscalYear));
      });
    });
    const currentFy = getClientFinancialYear(clientId);
    if (currentFy) years.add(currentFy);
    resolve([...years].sort((a, b) => Number(b) - Number(a)));
  });
}

function dbDelete(storeName, id) {
  return new Promise((resolve) => {
    const existing = DATA[storeName].find(r => r.id === id) || null;
    DATA[storeName] = DATA[storeName].filter(r => r.id !== id);
    persist();
    autoTrailLog(storeName, 'delete', id, existing, null);
    resolve(true);
  });
}

function dbClear(storeName) {
  return new Promise((resolve) => {
    DATA[storeName] = [];
    persist();
    resolve(true);
  });
}

/* ---- Settings helpers ---- */
function getSetting(key, defaultValue = null) {
  return new Promise((resolve) => {
    const rec = DATA[STORES.SETTINGS].find(r => r.key === key);
    resolve(rec ? rec.value : defaultValue);
  });
}

function setSetting(key, value) {
  return new Promise((resolve) => {
    const idx = DATA[STORES.SETTINGS].findIndex(r => r.key === key);
    const rec = { key, value, updatedAt: new Date().toISOString() };
    if (idx >= 0) DATA[STORES.SETTINGS][idx] = rec;
    else DATA[STORES.SETTINGS].push(rec);
    persist();
    resolve(true);
  });
}

/* ---- Activity log ---- */
function logActivity(clientId, action, description, type = 'info') {
  return dbAdd(STORES.ACTIVITY, {
    clientId, action, description, type,
    timestamp: new Date().toISOString()
  });
}

/* ---- Full database export ---- */
async function exportDatabase() {
  return {
    version: DB_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    stores: JSON.parse(JSON.stringify(DATA))
  };
}

/* ---- Full database import ---- */
async function importDatabase(data) {
  if (!data || !data.stores) throw new Error('ملف الاستيراد غير صحيح');
  const next = emptyData();
  Object.keys(next).forEach(k => {
    if (Array.isArray(data.stores[k])) next[k] = data.stores[k];
  });
  DATA = next;
  computeNextIds();
  await Storage.save({
    version: DB_FORMAT_VERSION,
    savedAt: new Date().toISOString(),
    stores: DATA
  }, { immediate: true });
  return true;
}

/* ---- Seed demo data: ملف تجريبي واحد لشركة "Audit Cafe" ----
   إصلاح خلل #3: سابقاً كان الشرط الوحيد هو "هل قائمة العملاء فاضية؟"،
   فكان أي مستخدم يحذف كل عملائه الحقيقيين (أو يضغط "مسح كل البيانات")
   يجد عميل Audit Cafe التجريبي يعود تلقائياً عند إعادة فتح النظام.
   الآن نعتمد على علم دائم مستقل (hasSeededDemo) لا يتأثر بحذف
   العملاء العاديين، ولا يُعاد ضبطه إلا عند مسح كامل لمخزن الإعدادات
   نفسه (مثل "إعادة تحميل البيانات التجريبية" المتعمّدة من الإعدادات). */
async function seedDemoData() {
  const alreadySeeded = await getSetting('hasSeededDemo', false);
  if (alreadySeeded) return;

  const existing = DATA[STORES.CLIENTS];
  if (existing.length > 0) {
    // بيانات حقيقية موجودة فعلاً (مثل ترقية من نسخة أقدم) - لا تتم التهيئة، فقط نُثبّت العلم
    await setSetting('hasSeededDemo', true);
    return;
  }

  const year = new Date().getFullYear();
  const py = year - 1; // السنة المالية للملف التجريبي (سنة سابقة مكتملة)

  const clientId = await dbAdd(STORES.CLIENTS, {
    name:            'شركة Audit Cafe',
    fileNumber:      `AF-${year}-001`,
    financialYear:   String(py),
    activity:        'تشغيل سلسلة مقاهي ومطاعم خدمة سريعة',
    address:         'القاهرة - مدينة نصر - شارع عباس العقاد',
    taxNumber:        '123-456-789',
    commercialReg:    '45821',
    riskLevel:        'medium',
    status:           'completed',
    teamLead:         'أحمد عبد الرحمن',
    manager:          'مروة سامي',
    teamMembers:      'ياسمين خالد، كريم محمود',
    qualityReviewer:  'هشام فتحي',
    phone:            '01012345678',
    email:            'finance@auditcafe-eg.example',
    contactPerson:    'مديرة الحسابات - رنا سعيد',
    engagementDate:   `${year}-01-10`,
    balanceSheetDate: `${py}-12-31`,
    reportDate:       `${year}-03-31`,
    fieldworkStart:   `${year}-02-01`,
    fieldworkEnd:     `${year}-03-15`,
    reportIssuedDate: `${year}-03-31`,
    notes:            'عميل تجريبي "مكتمل" يوضح طريقة استخدام النظام على ملف مراجعة كامل من التخطيط حتى إصدار التقرير - يمكن حذفه أو تعديله بحرية.',
    specialRequirements: '',
    industry:         'hospitality',
    entitySize:       'small',
    currency:         'EGP'
  });

  /* ============================================================
     1) التخطيط — كل الأقسام التسعة مكتملة بالكامل (ISA 210/220/300/315/240)
     ============================================================ */
  const planningNotes = {
    // القبول والاستمرار (ISA 210/220)
    acc1: 'يمتلك المكتب فريقاً متخصصاً بقطاع التجزئة والمطاعم وخبرة كافية بمراجعة الشركات المماثلة',
    acc2: 'تم توقيع إقرارات الاستقلالية والأخلاقيات المهنية من جميع أعضاء الفريق دون استثناء',
    acc3: 'لا توجد مؤشرات سلبية على نزاهة الإدارة من خلال المقابلات والاستعلامات الأولية',
    acc4: 'تم توقيع خطاب التكليف بتاريخ 10/01 من الطرفين ويُحدِّد نطاق ومسؤوليات كل طرف',
    acc5: 'العميل الجديد - تمت إجراءات القبول الكاملة شاملة فحص السمعة والاتصال بالمراجع السابق',
    acc6: 'لا ينطبق (عميل مُراجَع لأول مرة)',
    // الاستقلالية (ISA 220 المُعدَّل)
    ind1: 'تم الحصول على إقرارات استقلالية موقَّعة من كل عضو في فريق التكليف قبل بدء العمل',
    ind2: 'لم تُحدَّد أي تهديدات جوهرية للاستقلالية؛ الخدمات المُقدَّمة تقتصر على المراجعة فقط',
    ind3: 'تم التأكد من عدم امتلاك أي عضو بالفريق أو أسرته المباشرة لأي مصلحة مالية في الشركة',
    ind4: 'لا توجد علاقات أسرية أو شخصية بين أعضاء الفريق وموظفي أو مديري الشركة',
    ind5: 'لا ينطبق - لم تُحدَّد أي تهديدات تستوجب ضمانات',
    // تقييم المخاطر (ISA 315 المُعدَّل)
    risk1: 'تم تنفيذ إجراءات تقييم المخاطر: استفسارات، إجراءات تحليلية، ملاحظة وتفتيش، ومراجعة السنة السابقة',
    risk2: 'تم تحديد المخاطر الجوهرية في: الإيرادات النقدية اليومية، والمخزون القابل للتلف، والمصادقات البنكية',
    risk3: 'لا توجد مخاطر جوهرية على مستوى القوائم المالية ككل تستدعي استراتيجية مراجعة شاملة خاصة',
    risk4: 'تم تحديد التوكيدات المتأثرة لكل خطر على مستوى الحساب (راجع سجل المخاطر أدناه)',
    risk5: 'خطر الغش في تسجيل الإيرادات النقدية اليومية للفروع صُنِّف كخطر جوهري (Significant Risk)',
    risk6: 'لم تظهر معلومات إضافية أثناء التنفيذ تستدعي تحديث تقييم المخاطر الأولي',
    // فهم المنشأة (ISA 315 المُعدَّل)
    und1: 'قطاع المطاعم والمقاهي في مصر يشهد نمواً وتنافسية عالية، مع تنظيم من هيئة سلامة الغذاء',
    und2: 'الشركة تُشغِّل 3 فروع رئيسية بالقاهرة الكبرى، تمويلها الأساسي من رأس المال الذاتي وتسهيل بنكي محدود',
    und3: 'السياسات المحاسبية متوافقة مع المعايير الدولية لإعداد التقارير المالية (IFRS) وثابتة عن العام السابق',
    und4: 'هدف الشركة التوسع لفرعين إضافيين خلال العامين القادمين، وهو ما نوقش أثره على المخاطر والاستمرارية',
    und5: 'الإدارة تراجع الأداء المالي شهرياً عبر تقارير مبيعات الفروع ونسب الهامش الإجمالي',
    und6: 'تم عقد اجتماعين مع المدير المالي والرئيس التنفيذي بتاريخ 15/01 و20/01 وتوثيق محاضرهما',
    // الرقابة الداخلية (ISA 315 المُعدَّل)
    ic1: 'بيئة رقابة مقبولة؛ يوجد دليل سياسات مكتوب وتوزيع صلاحيات واضح بين الفروع والإدارة المركزية',
    ic2: 'الإدارة تُجري تقييماً دورياً غير رسمي للمخاطر التشغيلية دون عملية موثَّقة رسمياً',
    ic3: 'نظام نقاط البيع (POS) مربوط مركزياً بالمحاسبة، مع ترحيل يومي آلي لإجمالي المبيعات',
    ic4: 'يوجد فصل مناسب بين تحصيل النقدية وتسجيلها في الفروع الكبرى، مع ضعف بسيط في أحد الفروع',
    ic5: 'الإدارة تراجع تقارير المبيعات اليومية وتُقارنها بمعدلات الفروع المماثلة لرصد الانحرافات',
    ic6: 'ضوابط الرقابة على الصندوق والمخزون فعّالة بشكل عام مع ملاحظة بسيطة على توثيق الإقفال اليومي',
    // مخاطر الغش (ISA 240)
    fr1: 'تم عقد اجتماع عصف ذهني لفريق التكليف بتاريخ 12/01 لمناقشة مخاطر الغش المحتملة',
    fr2: 'تم الاستفسار من الإدارة والمسؤولين عن الحوكمة؛ لا يوجد غش معروف أو مُبلَّغ عنه',
    fr3: 'أهم مخاطر الغش المُحدَّدة: التلاعب في تسجيل مبيعات الفروع النقدية واختلاس نقدية الصندوق',
    fr4: 'خطر مبالغة/تسجيل ناقص للإيرادات صُنِّف كخطر جوهري افتراضي وفق ISA 240 وتم تصميم إجراءات مضادة',
    fr5: 'تم تصميم إجراءات لمعالجة مخاطر تجاوز الإدارة للضوابط، منها فحص القيود اليومية غير المعتادة',
    fr6: 'لا توجد مؤشرات غش ملحوظة أثناء الفحص الميداني حتى تاريخه',
    // التحليل المالي الأولي (ISA 520)
    pa1: 'نمو الإيرادات 14% عن العام السابق، متسق مع افتتاح فرع جديد في الربع الثالث',
    pa2: 'هامش الربح الإجمالي مستقر عند ~62% متوافق مع متوسط القطاع لسلاسل المقاهي',
    pa3: 'لوحظ ارتفاع طفيف في نسبة تكلفة المخزون التالف، تم تناوله ضمن اختبارات المخزون',
    pa4: 'لا توجد تقلبات جوهرية غير مُفسَّرة في الأرصدة الرئيسية بخلاف ما ورد أعلاه',
    pa5: 'نسبة التداول 1.8 ونسبة السيولة السريعة 1.2 - وضع سيولة مريح لا يثير مخاوف',
    // خطة المراجعة (ISA 300)
    ap1: 'تحديد نهج مُختلَط: اختبارات ضوابط محدودة على المبيعات + إجراءات تحقيقية موسّعة على النقدية',
    ap2: 'إجراءات تقييم مخاطر إضافية مُخطَّطة أثناء زيارات الفروع الميدانية',
    ap3: 'اختبار ضوابط تسوية نقاط البيع (POS) اليومية في الفروع الثلاثة',
    ap4: 'إجراءات تحقيقية موسّعة على النقدية والمصادقات البنكية والمخزون كأولوية للمخاطر المُحدَّدة',
    ap5: 'تم توزيع المهام: كريم محمود (النقدية والبنوك)، ياسمين خالد (المخزون والإيرادات)',
    ap6: 'تم توثيق واعتماد خطة المراجعة النهائية من مدير الارتباط بتاريخ 25/01',
    // استراتيجية المراجعة (ISA 300)
    as1: 'ارتباط مراجعة قوائم مالية سنوية لمنشأة صغيرة غير مُدرَجة، بمعيار تقارير IFRS',
    as2: 'تم التخطيط لأعمال ميدانية مؤقتة في فبراير وأعمال ختامية في مارس قبل إصدار التقرير',
    as3: 'تركيز جهود الفريق على النقدية والإيرادات والمخزون باعتبارها مناطق المخاطر الأعلى',
    as4: 'لا ينطبق - لا توجد مكوّنات أو وحدات فرعية (منشأة واحدة، ليست مجموعة)',
    as5: 'لم تظهر حاجة للاستعانة بخبراء خارجيين أو الاعتماد على مراجعة داخلية لهذا التكليف',
    as6: 'خطة إشراف: مراجعة يومية لأوراق العمل من مدير الارتباط، ومراجعة نهائية من شريك الجودة'
  };

  for (const [item, notes] of Object.entries(planningNotes)) {
    await dbAdd(STORES.PLANNING, {
      clientId, item, status: 'completed', notes,
      completedBy: 'أحمد عبد الرحمن', completedAt: `${year}-01-28`
    });
  }

  /* ============================================================
     2) الأهمية النسبية (ISA 320)
     ============================================================ */
  await dbAdd(STORES.MATERIALITY, {
    clientId,
    benchmark:       'revenue',
    benchmarkValue:  8500000,
    overallPct:      1.0,
    performancePct:  75,
    trivialPct:      5,
    overallMat:      85000,
    performanceMat:  63750,
    trivialMat:      4250,
    specificMat:     20000,
    specificReason:  'مخاطر الغش في الإيرادات النقدية اليومية لفروع المقاهي',
    notes:           'تم اختيار الإيرادات كأساس للأهمية النسبية نظراً لطبيعة النشاط التجاري للشركة (تشغيل مقاهي)، وتحقُّق الاستقرار النسبي في الربحية عن استخدام صافي الربح كأساس',
    calculatedAt:    `${year}-01-25`
  });

  /* ============================================================
     3) تقييم استمرارية المنشأة (ISA 570 المُعدَّل)
     ============================================================ */
  await dbAdd(STORES.GOING_CONCERN, {
    clientId,
    indicators: [],
    managementPlans: '',
    auditorAssessment: 'لا توجد مؤشرات مالية أو تشغيلية أو غيرها تُثير شكاً حول استمرارية الشركة. السيولة مريحة، والشركة تُحقق أرباحاً تشغيلية موجبة ونمواً في الإيرادات، ولا توجد نية للتصفية أو التوقف عن العمليات.',
    conclusion: 'no_material_uncertainty'
  });

  /* ============================================================
     4) سجل المخاطر (ISA 315 المُعدَّل / ISA 240) — مرتبط بالإجراءات أدناه
     ============================================================ */
  const riskCashFraudId = await dbAdd(STORES.RISKS, {
    clientId,
    title: 'خطر التلاعب أو الاختلاس في الإيرادات النقدية اليومية للفروع',
    description: 'اعتماد جزء كبير من الإيرادات على التحصيل النقدي المباشر بالفروع يزيد من مخاطر عدم تسجيل/اختلاس جزء من المبيعات قبل ترحيلها',
    likelihood: 'medium',
    impact: 'high',
    level: 'high',
    status: 'addressed',
    linkedProcedures: ['cash:C-1', 'cash:C-2', 'revenue:R-1'],
    account: 'revenues',
    assertions: ['completeness', 'occurrence_existence'],
    riskScope: 'assertion',
    riskType: 'fraud'
  });

  const riskBankId = await dbAdd(STORES.RISKS, {
    clientId,
    title: 'خطر عدم اكتمال أو دقة أرصدة البنوك نتيجة تأخر المصادقات',
    description: 'تأخر ورود ردود المصادقات البنكية قد يُعيق التحقق المستقل من اكتمال ودقة أرصدة البنوك في الموعد المحدَّد',
    likelihood: 'low',
    impact: 'medium',
    level: 'medium',
    status: 'addressed',
    linkedProcedures: ['banks:B-1'],
    account: 'banks',
    assertions: ['completeness', 'accuracy_valuation'],
    riskScope: 'assertion',
    riskType: 'normal'
  });

  await dbAdd(STORES.RISKS, {
    clientId,
    title: 'خطر تقادم أو تلف جزء من مخزون المواد الغذائية سريعة التلف',
    description: 'طبيعة نشاط المقاهي تتضمن مخزوناً من مواد غذائية سريعة التلف، ما يزيد من خطر عدم تسجيل مخصص كافٍ للتقادم/التلف',
    likelihood: 'medium',
    impact: 'medium',
    level: 'medium',
    status: 'addressed',
    linkedProcedures: ['inventory:I-1'],
    account: 'inventory',
    assertions: ['accuracy_valuation'],
    riskScope: 'assertion',
    riskType: 'normal'
  });

  /* ============================================================
     5) إجراءات المراجعة عبر عدة فئات (تنفيذ ISA 330 استجابةً للمخاطر)
     ============================================================ */
  const proc = async (data) => dbAdd(STORES.PROCEDURES, { clientId, status: 'completed', ...data });

  await proc({
    category: 'cash', procedureNum: 'C-1', title: 'جرد النقدية الفعلي',
    implementationDetails: 'تم جرد صناديق النقدية في 3 فروع رئيسية بحضور أمناء الصناديق بتاريخ 31/12',
    finding: 'الرصيد المجرود: 142,500 جنيه - مطابق للدفاتر في فرعين، وبه عجز بسيط 350 جنيه في الفرع الثالث',
    conclusion: 'لا توجد استثناءات جوهرية', auditorNotes: 'تمت متابعة سبب العجز البسيط مع إدارة الفرع وتبين أنه خطأ صرف بسيط',
    wpRef: 'C-1.1'
  });
  await proc({
    category: 'cash', procedureNum: 'C-2', title: 'مراجعة ضوابط الصندوق',
    implementationDetails: 'مراجعة سياسات إقفال الصندوق اليومي ومطابقة إيصالات نقاط البيع (POS) بالنقدية الفعلية',
    finding: 'يوجد فصل كافٍ بين تحصيل النقدية وتسجيلها في الفروع الكبرى', conclusion: 'إجراءات الرقابة فعّالة بشكل عام',
    auditorNotes: '', wpRef: 'C-1.2'
  });
  await proc({
    category: 'banks', procedureNum: 'B-1', title: 'الحصول على مصادقات بنكية', status: 'exception',
    implementationDetails: 'تم إرسال طلبات مصادقة لبنكي مصر و CIB بتاريخ 05/01',
    finding: 'تم استلام مصادقة بنك مصر مطابقة للدفاتر - تأخر رد بنك CIB وتم استلامه لاحقاً بتاريخ 10/03 مطابقاً أيضاً',
    conclusion: 'تمت التسوية النهائية - لا يوجد فرق جوهري', auditorNotes: 'تم إرسال تذكير ثانٍ للبنك وأُغلق الاستثناء بعد استلام الرد',
    wpRef: 'B-1.1'
  });
  await proc({
    category: 'receivables', procedureNum: 'AR-1', title: 'مصادقات أرصدة العملاء',
    implementationDetails: 'إرسال مصادقات لعينة من عملاء البيع الآجل (عقود التوريد للشركات) تمثل 65% من الرصيد',
    finding: 'تم استلام جميع الردود مطابقة للدفاتر دون استثناءات', conclusion: 'لا توجد استثناءات', auditorNotes: '', wpRef: 'AR-1.1'
  });
  await proc({
    category: 'inventory', procedureNum: 'I-1', title: 'حضور جرد المخزون الفعلي',
    implementationDetails: 'حضور جرد مخزون المواد الغذائية والمشروبات بالمخازن المركزية والفروع بتاريخ 31/12',
    finding: 'تم رصد كمية محدودة من مواد منتهية الصلاحية غير مُستبعَدة من الجرد بقيمة 8,200 جنيه',
    conclusion: 'تم تعديل القيد وتكوين مخصص إضافي كافٍ', auditorNotes: 'تم التأكد من تسجيل قيد التسوية في دفاتر العميل قبل الإصدار', wpRef: 'I-1.1'
  });
  await proc({
    category: 'revenues', procedureNum: 'R-1', title: 'الإجراءات التحليلية للإيرادات',
    implementationDetails: 'مطابقة إجمالي مبيعات نظام نقاط البيع (POS) اليومية بدفتر الأستاذ العام لعينة من الأيام عبر الفروع الثلاثة',
    finding: 'تطابق تام دون فروقات جوهرية', conclusion: 'لا توجد استثناءات', auditorNotes: '', wpRef: 'R-1.1'
  });
  await proc({
    category: 'payables', procedureNum: 'AP-1', title: 'اختبار البحث عن الالتزامات غير المُسجَّلة',
    implementationDetails: 'مراجعة المدفوعات والفواتير الواردة بعد تاريخ الميزانية للتحقق من اكتمال تسجيل الالتزامات',
    finding: 'لم يُعثر على التزامات جوهرية غير مُسجَّلة تخص الفترة', conclusion: 'الاكتمال مقبول', auditorNotes: '', wpRef: 'AP-1.1'
  });
  await proc({
    category: 'fixed_assets', procedureNum: 'FA-1', title: 'مراجعة إضافات الأصول الثابتة',
    implementationDetails: 'فحص مستندات إضافات تجهيزات الفرع الجديد والتحقق من الرسملة الصحيحة وفق السياسة المحاسبية',
    finding: 'الإضافات مدعومة بمستندات كاملة ومُرسملة بشكل صحيح', conclusion: 'لا توجد استثناءات', auditorNotes: '', wpRef: 'FA-1.1'
  });
  await proc({
    category: 'subsequent_events', procedureNum: 'SE-1', title: 'مراجعة الأحداث اللاحقة',
    implementationDetails: 'الاستفسار من الإدارة ومراجعة محاضر الاجتماعات ومراسلات ما بعد تاريخ الميزانية وحتى تاريخ التقرير',
    finding: 'لا توجد أحداث لاحقة جوهرية تستدعي تعديل أو إفصاح إضافي بخلاف ما ورد', conclusion: 'لا توجد استثناءات', auditorNotes: '', wpRef: 'SE-1.1'
  });

  /* ============================================================
     6) أوراق العمل — معتمدة وموقَّعة كملف مكتمل (ISA 230)
     ============================================================ */
  const wp = async (data) => dbAdd(STORES.WORKPAPERS, { clientId, signedOff: true, status: 'reviewed', ...data });

  await wp({
    type: 'lead', reference: 'TB-001', title: 'ميزان المراجعة الإجمالي', category: 'التقارير المالية',
    preparedBy: 'ياسمين خالد', reviewedBy: 'أحمد عبد الرحمن', prepDate: `${year}-02-05`, revDate: `${year}-02-10`,
    content: `ميزان مراجعة إجمالي للسنة المالية المنتهية في 31/12/${py}`, notes: 'تمت المراجعة والاعتماد',
    externalApproval: { reviewer: 'هشام فتحي', date: `${year}-03-20`, role: 'شريك مراجعة الجودة', notes: 'تم الاعتماد النهائي قبل إصدار التقرير' }
  });
  await wp({
    type: 'supporting', reference: 'C-1', title: 'جدول النقدية والبنوك', category: 'الأصول المتداولة',
    preparedBy: 'كريم محمود', reviewedBy: 'أحمد عبد الرحمن', prepDate: `${year}-02-12`, revDate: `${year}-02-16`,
    content: 'تفاصيل أرصدة صناديق الفروع الثلاثة وحسابات البنوك مع نتائج الجرد والمصادقات', notes: ''
  });
  await wp({
    type: 'supporting', reference: 'AR-1', title: 'جدول الذمم المدينة', category: 'الأصول المتداولة',
    preparedBy: 'ياسمين خالد', reviewedBy: 'أحمد عبد الرحمن', prepDate: `${year}-02-14`, revDate: `${year}-02-18`,
    content: 'تحليل أعمار الذمم المدينة ونتائج المصادقات المُستلمة من العملاء', notes: ''
  });
  await wp({
    type: 'supporting', reference: 'I-1', title: 'جدول المخزون', category: 'الأصول المتداولة',
    preparedBy: 'ياسمين خالد', reviewedBy: 'مروة سامي', prepDate: `${year}-02-20`, revDate: `${year}-02-24`,
    content: 'نتائج حضور الجرد الفعلي للمخزون وتسوية مخصص التقادم', notes: 'يتضمّن تعديل مخصص التالف المُشار إليه في الإجراء I-1'
  });
  await wp({
    type: 'supporting', reference: 'FA-1', title: 'جدول الأصول الثابتة', category: 'الأصول غير المتداولة',
    preparedBy: 'كريم محمود', reviewedBy: 'أحمد عبد الرحمن', prepDate: `${year}-02-22`, revDate: `${year}-02-25`,
    content: 'حركة الأصول الثابتة خلال العام وتفاصيل الإضافات والاستهلاك', notes: ''
  });
  await wp({
    type: 'permanent', reference: 'PF-1', title: 'ملف دائم - عقد التأسيس والسجل التجاري', category: 'أخرى',
    preparedBy: 'مروة سامي', reviewedBy: 'أحمد عبد الرحمن', prepDate: `${year}-01-15`, revDate: `${year}-01-16`,
    content: 'نسخ من عقد التأسيس والسجل التجاري والبطاقة الضريبية وخطاب التكليف', notes: ''
  });
  await wp({
    type: 'correspondence', reference: 'CR-1', title: 'مراسلات المصادقات البنكية', category: 'أخرى',
    preparedBy: 'كريم محمود', reviewedBy: 'أحمد عبد الرحمن', prepDate: `${year}-03-10`, revDate: `${year}-03-12`,
    content: 'نسخ من طلبات وردود المصادقات البنكية لبنكي مصر و CIB', notes: ''
  });

  /* ============================================================
     7) الملاحظات والاستثناءات
     ============================================================ */
  await dbAdd(STORES.FINDINGS, {
    clientId, type: 'exception', severity: 'low', title: 'تأخر استلام مصادقة بنك CIB',
    description: 'تأخر ورود رد المصادقة البنكية المُرسلة لبنك CIB عن الموعد المخطَّط، وتم استلامه لاحقاً ومطابقته دون فروقات',
    category: 'banks', wpRef: 'B-1.1', status: 'resolved',
    raisedBy: 'أحمد عبد الرحمن', raisedDate: `${year}-02-01`, dueDate: `${year}-02-20`,
    managementResponse: 'تم التواصل مع البنك لتسريع الرد', correctiveAction: 'تم استلام الرد ومطابقته دون فروقات',
    resolvedDate: `${year}-03-10`
  });
  await dbAdd(STORES.FINDINGS, {
    clientId, type: 'observation', severity: 'low', title: 'ضعف توثيق محاضر إقفال الصندوق اليومي في أحد الفروع',
    description: 'محاضر إقفال الصندوق اليومي في فرع التجمع الخامس غير موقعة بشكل منتظم من أمين الصندوق ومسؤول الوردية',
    category: 'cash', wpRef: 'C-1.1', status: 'resolved',
    raisedBy: 'كريم محمود', raisedDate: `${year}-02-08`, dueDate: `${year}-02-28`,
    managementResponse: 'سيتم تعميم نموذج إقفال موحّد على جميع الفروع وتفعيل التوقيع المزدوج',
    correctiveAction: 'تم تعميم النموذج الموحّد على جميع الفروع وتدريب أمناء الصناديق', resolvedDate: `${year}-02-25`
  });
  await dbAdd(STORES.FINDINGS, {
    clientId, type: 'exception', severity: 'medium', title: 'مخزون منتهي الصلاحية غير مُستبعَد من الجرد',
    description: 'تم رصد كمية محدودة من المواد الغذائية منتهية الصلاحية ضمن رصيد المخزون الجاري دون استبعادها أو تكوين مخصص كافٍ لها',
    category: 'inventory', wpRef: 'I-1.1', status: 'resolved',
    raisedBy: 'ياسمين خالد', raisedDate: `${year}-02-20`, dueDate: `${year}-03-05`,
    managementResponse: 'تم قبول الملاحظة وتسجيل قيد تعديل بقيمة المخصص الإضافي', correctiveAction: 'تم تسجيل قيد التسوية في الدفاتر قبل إصدار القوائم المالية',
    resolvedDate: `${year}-03-08`
  });

  /* ============================================================
     8) المراسلات (ISA 505 / 580 / 260)
     ============================================================ */
  await dbAdd(STORES.LETTERS, {
    clientId, type: 'bank_confirm', title: `طلب مصادقة بنكية - بنك مصر وبنك CIB - ${py}`,
    addressee: 'بنك مصر / بنك CIB', status: 'sent',
    body: `نتشرف بطلب تأكيدكم مباشرة لنا بأرصدة شركة Audit Cafe لديكم كما في 31/12/${py}، وذلك في إطار قيامنا بمراجعة القوائم المالية لهذه الشركة.`,
    notes: 'تم استلام الردود من البنكين ومطابقتها دون فروقات جوهرية'
  });
  await dbAdd(STORES.LETTERS, {
    clientId, type: 'representation', title: `خطاب إقرارات الإدارة - السنة المالية ${py}`,
    addressee: 'مكتب المراجعة والمحاسبة', status: 'sent',
    body: `نُقرّ لكم، على حد علمنا واعتقادنا، بمسؤوليتنا عن إعداد وعرض القوائم المالية بصورة عادلة وفق المعايير الدولية لإعداد التقارير المالية، وباكتمال المعلومات المُتاحة لكم، وعدم علمنا بأي غش أو مخالفات جوهرية لم يُفصَح عنها.`,
    notes: 'تم توقيعه من الرئيس التنفيذي والمدير المالي بتاريخ إصدار التقرير'
  });
  await dbAdd(STORES.LETTERS, {
    clientId, type: 'management', title: 'رسالة الإدارة - ملاحظات المراجعة', addressee: 'الرئيس التنفيذي - شركة Audit Cafe',
    status: 'sent',
    body: 'نتشرف بإحاطتكم بالملاحظات التي تم رصدها أثناء مراجعتنا للقوائم المالية والتوصيات المُقترَحة لمعالجتها، وأبرزها توحيد نموذج إقفال الصندوق اليومي وتحسين ضوابط استبعاد المخزون منتهي الصلاحية.',
    notes: 'تم إرسالها وتلقي رد الإدارة بالموافقة على التوصيات وتنفيذها بالفعل'
  });

  /* ============================================================
     9) مراجعة جودة الارتباط (ISA 220 المُعدَّل / ISQM 1)
     ============================================================ */
  await dbAdd(STORES.QUALITY_REVIEW, {
    clientId,
    eqrRequired: false // منشأة صغيرة غير مُدرَجة وغير ذات مصلحة عامة - لا تستوجب EQR إلزامياً وفق سياسة المكتب
  });

  /* ============================================================
     10) قطة بيانات السنة السابقة (لعرض تقرير "مقارنة السنتين" فوراً)
     ============================================================ */
  await dbAdd(STORES.YEAR_DATA, {
    clientId,
    year: String(Number(py) - 1),
    overallMat: 76000,
    procDone: 8, procTotal: 8,
    highFdgs: 1, openFdgs: 0,
    exceptions: 0,
    risksCount: 2,
    savedAt: `${py}-03-28T00:00:00.000Z`
  });

  /* Activity log */
  await logActivity(clientId, 'إنشاء ملف العميل', 'تم إنشاء ملف العميل التجريبي: شركة Audit Cafe', 'success');
  await logActivity(clientId, 'اعتماد خطة التخطيط', 'تم توثيق واعتماد جميع أقسام التخطيط التسعة', 'success');
  await logActivity(clientId, 'احتساب الأهمية النسبية', 'تم احتساب الأهمية النسبية بالجنيه المصري', 'info');
  await logActivity(clientId, 'تسجيل مخاطر', 'تم تسجيل 3 مخاطر في السجل، منها خطر جوهري (غش) على الإيرادات', 'warning');
  await logActivity(clientId, 'إتمام الإجراءات', 'تم إتمام 9 إجراءات مراجعة عبر مختلف الفئات', 'success');
  await logActivity(clientId, 'إضافة ملاحظة', 'تم إضافة ملاحظة مخزون منتهي الصلاحية وتسويتها', 'warning');
  await logActivity(clientId, 'إصدار المراسلات', 'تم إرسال المصادقات البنكية وخطاب إقرارات الإدارة ورسالة الإدارة', 'info');
  await logActivity(clientId, 'اعتماد الملف', 'تم اعتماد ملف المراجعة نهائياً وإصدار التقرير', 'success');

  /* Default firm / system settings */
  await setSetting('theme', 'light');
  await setSetting('firmName', 'مكتب المراجعة والمحاسبة');
  await setSetting('firmAddress', '');
  await setSetting('firmPhone', '');
  await setSetting('firmLicense', '');
  await setSetting('defaultCurrency', 'EGP');
  await setSetting('defaultLanguage', 'ar');
  await setSetting('activeClientId', clientId);
  await setSetting('hasSeededDemo', true);

  console.log('✅ تم تجهيز ملف تجريبي مكتمل (شركة Audit Cafe) بنجاح');
}

/* ---- Export global DB API (نفس الواجهة القديمة بدون تغيير) ---- */
window.AuditDB = {
  open:        openDB,
  seed:        seedDemoData,
  add:         dbAdd,
  put:         dbPut,
  get:         dbGet,
  getAll:      dbGetAll,
  getByIndex:  dbGetByIndex,
  getByClientYear: dbGetByClientYear,
  getAvailableYears,
  delete:      dbDelete,
  clear:       dbClear,
  getSetting,
  setSetting,
  logActivity,
  trailLog,
  exportDB:    exportDatabase,
  importDB:    importDatabase,
  STORES
};
