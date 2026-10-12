/* Audit-Plus · v8 · PBC core — مكتبة المتطلبات، ملف العميل، قواعد الانطباق، الحالة والإحصاءات */

import { hub } from '../hub.js';
import { PB_SRC_A } from '../data/15-pbc-lib-a.js';
import { PB_SRC_B } from '../data/16-pbc-lib-b.js';
import { PB_SRC_C } from '../data/17-pbc-lib-c.js';
import { PB_SRC_D } from '../data/18-pbc-lib-d.js';
import { PB_SRC_E } from '../data/19-pbc-lib-e.js';
import { PB_SRC_F } from '../data/20-pbc-lib-f.js';
import { logErr } from '../core/01-utils-i18n-storage.js';
import { CUR } from '../core/03-data-engine.js';
import { G, WP } from '../views/05-indexes.js';
import { vcache } from '../modules/16-relations.js';
import { CT } from '../v4/32-catalog.js';
import { APP_FLAGS } from '../v4/35-extras.js';

/* =====================================================================================================
   متطلبات المراجعة من العميل (Client PBC / Audit Requirements) — النواة
   - المكتبة (js/data/15..19) تُحلَّل مرة واحدة إلى PB_CATS / PB_BY؛ معرّفات البنود ثابتة (cat+رقم) ومتوافقة مع القائمة القديمة.
   - ما يخص كل ارتباط يُحفظ بمفاتيح pbx.* (مجموعة تخزين مستقلة → pbc/requests.json):
       pbx._prof   ملف العميل (الشكل القانوني، القطاعات، الأعلام، مواعيد المراحل، جهة الاتصال)
       pbx._cus    بنود مخصصة     pbx._ccat  فئات مخصصة     pbx._own  جهات الاتصال/المسؤولون    pbx._log  سجل المتابعة
       pbx.<id>.<f>  حقل بند: st حالة · ow مسؤول · pr أولوية · ph مرحلة · due استحقاق · rq تاريخ الطلب · rcv تاريخ الاستلام
                              nt ملاحظة · t نص معدّل · o تجاوز الانطباق (y/n) · lk روابط أوراق العمل · cm تعليق المراجع
   - القراءة تتراجع تلقائيًا إلى مفاتيح القائمة القديمة (pbc.A355Q.*) فلا يضيع أي إدخال سابق.
   ===================================================================================================== */
const PB_PHASE = [
  ['P', 'قبل بدء المراجعة (التخطيط)'],
  ['I', 'المراجعة المرحلية'],
  ['Y', 'نهاية السنة (الفحص الختامي)'],
  ['C', 'الإقفال وإصدار التقرير'],
  ['S', 'ما بعد الإصدار / السنة التالية'],
];
const PB_PHL = Object.fromEntries(PB_PHASE);
const PB_PRI = [
  ['H', 'عالية'],
  ['M', 'متوسطة'],
  ['L', 'منخفضة'],
];
const PB_PRL = Object.fromEntries(PB_PRI);
/* الحالات: المفتاح الداخلي ← النص المعروض (النصوص القديمة محفوظة كما هي لتوافق البيانات السابقة) */
const PB_ST = [
  ['nr', 'لم يُطلب'],
  ['rq', 'تم الطلب'],
  ['pt', 'تم الاستلام جزئيًا'],
  ['rc', 'تم الاستلام'],
  ['ok', 'تم الفحص'],
  ['nv', 'لا يوجد لدى العميل'],
  ['na', 'لا ينطبق'],
];
const PB_STL = Object.fromEntries(PB_ST),
  PB_STK = Object.fromEntries(PB_ST.map(x => [x[1], x[0]]));
const PB_DOC = {
  leg: 'قانونية وتأسيسية',
  gov: 'حوكمة وإدارة',
  acc: 'محاسبية ومالية',
  tax: 'ضريبية',
  bnk: 'بنكية وخزينة',
  inv: 'مخزون وإنتاج',
  inv2: 'استثمارات وأدوات مالية',
  rev: 'إيرادات وعملاء',
  ppe: 'أصول وعقارات',
  hr: 'عاملون وأجور',
  it: 'نظم المعلومات',
  fs: 'قوائم وإفصاحات',
  con: 'عقود ومشروعات',
  eq: 'حقوق الملكية',
};
/* الأعلام الإضافية الخاصة بالقائمة (غير الواردة في APP_FLAGS) — الأعلام الأخرى تُقرأ من eng.app.* */
const PB_FLAGS = [
  ['vat', 'مسجّلة في ضريبة القيمة المضافة', 1],
  ['emp', 'لديها عاملون (رواتب/تأمينات)', 1],
  ['rp', 'لديها معاملات مع أطراف ذات علاقة', 1],
  ['imp', 'تستورد سلعًا/مواد (جمارك/اعتمادات)', 0],
  ['xexp', 'تصدّر سلعًا/خدمات', 0],
];
const PB_FLAGDEF = {
  inv: 1,
  bor: 1,
  les: 1,
  fx: 0,
  grp: 0,
  inv2: 0,
  ip: 0,
  cip: 0,
  int: 0,
  bio: 0,
  der: 0,
  con: 0,
  lsr: 0,
  sbp: 0,
  gg: 0,
  def: 0,
  lte: 0,
  dtx: 0,
  svc: 0,
  exp: 0,
  ia: 0,
  first: 0,
  pub: 0,
};
/* الأعلام التي يشغّلها كل قطاع افتراضيًا (يمكن للمستخدم تجاوزها لكل علم) */
const PB_SECFLAG = {
  mfg: 'inv,imp,cip,xexp',
  trade: 'inv,imp,xexp',
  retail: 'inv,les',
  ecom: 'inv',
  contract: 'con,cip,inv',
  re: 'con,ip,inv,bor,cip',
  hosp: 'inv,les',
  health: 'inv',
  pharma: 'inv,imp,int',
  agri: 'bio,inv,gg,xexp',
  oil: 'cip,inv,int,gg',
  energy: 'cip,gg,inv',
  tech: 'int,sbp',
  telecom: 'int,cip',
  trans: 'les,cip',
  fin: 'inv2,der',
  bank: 'inv2,der,fx',
  ins: 'inv2',
  fund: 'inv2',
  hold: 'grp,inv2',
  npo: 'gg',
  startup: 'sbp,int',
};
const PB_SECTORS = [
  ['mfg', 'صناعة وإنتاج'],
  ['trade', 'تجارة وتوزيع وجملة'],
  ['retail', 'تجزئة وفروع'],
  ['ecom', 'تجارة إلكترونية ومنصات رقمية'],
  ['contract', 'مقاولات وإنشاءات'],
  ['re', 'تطوير عقاري'],
  ['hosp', 'فنادق ومطاعم وضيافة'],
  ['health', 'رعاية صحية ومستشفيات'],
  ['pharma', 'أدوية ومستحضرات'],
  ['edu', 'تعليم'],
  ['agri', 'زراعة وثروة حيوانية'],
  ['oil', 'نفط وغاز وتعدين'],
  ['energy', 'طاقة ومرافق'],
  ['tech', 'تكنولوجيا وبرمجيات'],
  ['telecom', 'اتصالات'],
  ['trans', 'نقل ولوجستيات'],
  ['prof', 'خدمات مهنية واستشارية'],
  ['fin', 'تمويل ومؤسسات مالية غير مصرفية'],
  ['bank', 'بنوك'],
  ['ins', 'تأمين وإعادة تأمين'],
  ['fund', 'صناديق استثمار'],
  ['hold', 'شركات قابضة ومجموعات'],
  ['npo', 'جمعيات ومنظمات غير هادفة للربح'],
  ['startup', 'شركات ناشئة'],
];
const PB_LEGAL = [
  ['jsc', 'شركة مساهمة'],
  ['llc', 'شركة ذات مسئولية محدودة'],
  ['partner', 'شركة تضامن / توصية'],
  ['sole', 'منشأة فردية / شركة شخص واحد'],
  ['branch', 'فرع شركة أجنبية'],
  ['fz', 'منطقة حرة / اقتصادية / استثمارية'],
  ['inv', 'شركة مستثمرة بحوافز ق.72/2017'],
  ['listed', 'مقيدة بالبورصة / خاضعة للرقابة المالية'],
  ['gov', 'شركة حكومية / قطاع أعمال عام / هيئة اقتصادية'],
  ['ngo', 'جمعية / مؤسسة أهلية'],
  ['coop', 'جمعية تعاونية'],
  ['fund', 'صندوق / كيان استثمار جماعي'],
];
/* قطاع الارتباط (eng.ind) ← حزم القطاع */
const PB_INDMAP = {
  trading: 'trade',
  manufacturing: 'mfg',
  construction: 'contract',
  contracting: 'contract',
  realestate: 're',
  holding: 'hold',
  investco: 'fin',
  groups: 'hold',
  banks: 'bank,fin',
  finst: 'fin',
  insurance: 'ins',
  leasing: 'fin',
  funds: 'fund,fin',
  tech: 'tech',
  software: 'tech',
  telecom: 'telecom',
  ecom: 'ecom',
  retail: 'retail',
  wholesale: 'trade',
  hotels: 'hosp',
  restaurants: 'hosp',
  healthcare: 'health',
  pharma: 'pharma,mfg',
  education: 'edu',
  transport: 'trans',
  logistics: 'trans',
  oilgas: 'oil',
  mining: 'oil',
  agri: 'agri',
  energy: 'energy',
  npo: 'npo',
  startup: 'startup',
  foreignops: '',
  fxtrans: '',
};
/* ترتيب العرض والتجميع */
const PB_GROUPS = [
  [
    'A',
    'أساسيات الارتباط والحوكمة',
    [
      'gen',
      'e_jsc',
      'e_llc',
      'e_sole',
      'e_branch',
      'e_fz',
      'e_listed',
      'e_gov',
      'e_ngo',
      'e_coop',
      'gov',
      'prev',
      'rep',
    ],
  ],
  ['B', 'النظم والسجلات والرقابة الداخلية', ['tb', 'policy', 'it', 'fraud']],
  [
    'C',
    'الأرصدة ودورات العمليات',
    ['cash', 'rec', 'inv', 'ppe', 'lease', 'inv2', 'liab', 'debt', 'eq', 'hr', 'tax', 'rp', 'fx', 'est'],
  ],
  [
    'D',
    'متطلبات القطاع والنشاط',
    [
      'x_mfg',
      'x_trade',
      'x_retail',
      'x_ecom',
      'x_contract',
      'x_re',
      'x_hosp',
      'x_health',
      'x_pharma',
      'x_edu',
      'x_agri',
      'x_oil',
      'x_energy',
      'x_tech',
      'x_telecom',
      'x_trans',
      'x_prof',
      'x_fin',
      'x_bank',
      'x_ins',
      'x_fund',
      'x_hold',
      'x_npo',
      'x_startup',
    ],
  ],
  ['E', 'الأحداث اللاحقة والمجموعة والقوائم والإقفال', ['events', 'grp', 'fs', 'esg', 'close']],
];
/* ---------- parser ---------- */
const PB_CATS = [],
  PB_BY = {},
  PB_CATBY = {};
(function () {
  const src = [
    typeof PB_SRC_A !== 'undefined' ? PB_SRC_A : '',
    typeof PB_SRC_B !== 'undefined' ? PB_SRC_B : '',
    typeof PB_SRC_C !== 'undefined' ? PB_SRC_C : '',
    typeof PB_SRC_D !== 'undefined' ? PB_SRC_D : '',
    typeof PB_SRC_E !== 'undefined' ? PB_SRC_E : '',
    typeof PB_SRC_F !== 'undefined' ? PB_SRC_F : '',
  ].join('\n');
  let cur = null,
    sub = '';
  const mk = p => ({
    id: p[1],
    ar: p[2] || p[1],
    desc: p[3] || '',
    doc: p[4] || '',
    cyc: p[5] || '',
    papers: (p[6] || '').split(/\s+/).filter(Boolean),
    when: p[7] || '',
    items: [],
  });
  for (const raw of src.split('\n')) {
    const ln = raw.trim();
    if (!ln) continue;
    if (ln.startsWith('@cat|')) {
      const p = ln.split('|');
      cur = mk(p);
      sub = '';
      PB_CATS.push(cur);
      PB_CATBY[cur.id] = cur;
    } else if (ln.startsWith('@sub|')) {
      sub = ln.slice(5).trim();
    } else if (ln.startsWith('@add|')) {
      const p = ln.split('|');
      cur = PB_CATBY[p[1]];
      sub = (p[2] || '').trim();
      if (!cur) throw new Error('PBC lib: @add to unknown category ' + p[1]);
    } else if (cur) {
      const p = ln.split('|');
      if (p.length < 2) continue;
      const it = {
        id: cur.id + (cur.items.length + 1),
        cat: cur.id,
        sub: p[5] ? p[5].trim() : sub,
        t: p[0].trim(),
        when: (p[1] || '').trim(),
        ref: (p[2] || '').trim(),
        pr: (p[3] || 'M').trim() || 'M',
        ph: (p[4] || 'P').trim() || 'P',
      };
      cur.items.push(it);
      PB_BY[it.id] = it;
    }
  }
  /* ترتيب منطقي حسب المجموعات */
  const ord = [];
  PB_GROUPS.forEach(g => g[2].forEach(id => ord.push(id)));
  PB_CATS.sort((a, b) => {
    const ia = ord.indexOf(a.id),
      ib = ord.indexOf(b.id);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });
})();
const PB_GROUPOF = (() => {
  const m = {};
  PB_GROUPS.forEach(g =>
    g[2].forEach(id => {
      m[id] = g[0];
    })
  );
  return m;
})();
/* ---------- مفاتيح وقراءة/كتابة الحقول ---------- */
const pbK = (id, f) => 'pbx.' + id + '.' + f;
const pbEng = () => CUR.eng;
const pbRaw = k => {
  const e = CUR.eng && CUR.eng.map.get(k);
  return e && e.v != null ? e.v : undefined;
};
/* مفتاح القائمة القديمة المقابل لحقل جديد (للقراءة فقط) */
const PB_LEGF = { st: 'st', ow: 'ow', due: 'due', rcv: 'rcv', nt: 'nt', t: 't', o: 'o' };
function pbLegacyId(id) {
  return (typeof PB_LEGACYMAP !== 'undefined' && PB_LEGACYMAP[id]) || id;
}
function pbGet(id, f, d) {
  const v = pbRaw(pbK(id, f));
  if (v !== undefined) return v;
  if (PB_LEGF[f] && /^[a-z0-9]+$/.test(id)) {
    const lv = pbRaw('pbc.A355Q.' + PB_LEGF[f] + '.' + pbLegacyId(id));
    if (lv !== undefined) return f === 'st' ? PB_STK[lv] || 'nr' : lv;
  }
  return d;
}
function pbSet(id, f, v, label) {
  return CUR.eng.set(pbK(id, f), v === '' ? null : v, { label: label || 'متطلبات العميل' });
}
function pbSetMany(obj, label) {
  return CUR.eng.setMany(obj, { label: label || 'متطلبات العميل' });
}
const pbToday = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const pbAddDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
/* ---------- ملف العميل ---------- */
function pbProfile() {
  const p = Object.assign(
    { legal: null, sectors: null, flags: {}, due: {}, contact: {}, notes: '', start: '', report: '' },
    pbRaw('pbx._prof') || {}
  );
  if (!p.legal) p.legal = pbDeriveLegal();
  if (!p.sectors) p.sectors = pbDeriveSectors();
  p.flags = p.flags || {};
  p.due = p.due || {};
  p.contact = p.contact || {};
  return p;
}
function pbProfileSet(patch) {
  const cur = Object.assign({}, pbRaw('pbx._prof') || {});
  CUR.eng.set('pbx._prof', Object.assign(cur, patch), { label: 'ملف العميل (PBC)' });
}
function pbDeriveSectors() {
  const ind = G('eng.ind', '') || (CUR.company && CUR.company.industry) || '';
  const m = PB_INDMAP[ind] || '';
  return m.split(',').filter(Boolean);
}
function pbDeriveLegal() {
  return [];
}
/* حالة العلم: تلقائي/نعم/لا ← قيمة منطقية */
function pbFlagMode(id) {
  if (PB_FLAGS.some(f => f[0] === id)) {
    const v = pbProfile().flags[id];
    return v === true ? 'y' : v === false ? 'n' : '';
  }
  const v = G('eng.app.' + id, '');
  return v === 'y' ? 'y' : v === 'n' ? 'n' : '';
}
function pbFlagOn(id, p, secs) {
  const m = pbFlagMode(id);
  if (m === 'y') return true;
  if (m === 'n') return false;
  const ex = PB_FLAGS.find(f => f[0] === id);
  if (ex && !secs.some(s => (PB_SECFLAG[s] || '').split(',').includes(id))) return !!ex[2];
  if (secs.some(s => (PB_SECFLAG[s] || '').split(',').includes(id))) return true;
  return !!PB_FLAGDEF[id];
}
function pbAtoms() {
  return vcache('pbatoms', () => {
    const p = pbProfile();
    const A = new Set();
    p.legal.forEach(l => A.add('e_' + l));
    p.sectors.forEach(s => A.add('s_' + s));
    const ids = new Set(Object.keys(PB_FLAGDEF));
    PB_FLAGS.forEach(f => ids.add(f[0]));
    try {
      APP_FLAGS.forEach(f => ids.add(f[0]));
    } catch (e) {
      logErr('50-pbc-core:81', e, 'info');
    }
    for (const id of ids) if (pbFlagOn(id, p, p.sectors)) A.add(id);
    /* المنشآت المقيدة تعني ضمنًا المصلحة العامة */
    if (A.has('e_listed')) A.add('pub');
    return A;
  });
}
function pbWhen(expr, A) {
  if (!expr) return true;
  for (const term of expr.split('&')) {
    const t = term.trim();
    if (!t) continue;
    let ok = false;
    for (let a of t.split(',')) {
      a = a.trim();
      if (!a) continue;
      const neg = a[0] === '!';
      if (neg) a = a.slice(1);
      if (A.has(a) !== neg) {
        ok = true;
        break;
      }
    }
    if (!ok) return false;
  }
  return true;
}
/* ---------- البنود المخصصة ---------- */
function pbCustoms() {
  const v = pbRaw('pbx._cus');
  if (Array.isArray(v)) return v;
  const lg = pbRaw('pbc.A355Q.cus');
  return Array.isArray(lg) ? lg.map(x => ({ id: x.id, cat: x.cat, t: x.t, pr: 'M', ph: 'P', sub: '', ref: '' })) : [];
}
function pbCustomCats() {
  const v = pbRaw('pbx._ccat');
  if (Array.isArray(v)) return v;
  const lg = pbRaw('pbc.A355Q.ccat');
  return Array.isArray(lg) ? lg : [];
}
function pbOwners() {
  const v = pbRaw('pbx._own');
  return Array.isArray(v) ? v : [];
}
function pbLog() {
  const v = pbRaw('pbx._log');
  return Array.isArray(v) ? v : [];
}
function pbLogAdd(type, txt, n) {
  const a = pbLog().slice();
  a.unshift({
    t: Date.now(),
    d: pbToday(),
    by: typeof hub.SESSION !== 'undefined' && hub.SESSION ? hub.SESSION.display || hub.SESSION.id : '',
    type,
    txt,
    n: n || 0,
  });
  CUR.eng.set('pbx._log', a.slice(0, 300), { label: 'سجل متابعة PBC', noUndo: true });
}
/* ---------- بناء الصفوف الفعلية ---------- */
/* كل صف: بيانات المكتبة + الحقول المحفوظة + الانطباق. النتيجة مخزّنة بحسب إصدار المخزن. */
function pbAll() {
  return vcache('pball', () => {
    const A = pbAtoms(),
      p = pbProfile(),
      today = pbToday();
    const cats = [];
    const rows = [];
    const idx = {};
    const mkRow = (it, cat, custom) => {
      const id = it.id;
      const ov = pbGet(id, 'o', '');
      const catOk = pbWhen(cat.when, A),
        itOk = !it.when || pbWhen(it.when, A);
      let app = custom ? true : catOk && itOk;
      let why = '';
      if (!app) why = !catOk ? 'الفئة لا تنطبق على ملف العميل' : 'البند لا ينطبق على ملف العميل';
      if (ov === 'y') {
        app = true;
        why = '';
      } else if (ov === 'n') {
        app = false;
        why = 'مُخفى يدويًا';
      }
      const st = pbGet(id, 'st', 'nr');
      const ph = pbGet(id, 'ph', it.ph) || 'P';
      const pr = pbGet(id, 'pr', it.pr) || 'M';
      const due = pbGet(id, 'due', '');
      const dueEff = due || p.due[ph] || '';
      const lk = pbGet(id, 'lk', []);
      const r = {
        id,
        cat: cat.id,
        sub: it.sub || '',
        t: pbGet(id, 't', it.t) || it.t,
        t0: it.t,
        ref: it.ref || '',
        pr,
        ph,
        when: it.when || '',
        custom: !!custom,
        app: app && st !== 'na',
        appRaw: app,
        why,
        st,
        ow: pbGet(id, 'ow', ''),
        due,
        dueEff,
        rq: pbGet(id, 'rq', ''),
        rcv: pbGet(id, 'rcv', ''),
        nt: pbGet(id, 'nt', ''),
        cm: pbGet(id, 'cm', ''),
        lk: Array.isArray(lk) ? lk : [],
      };
      if (st === 'na') r.why = 'لا ينطبق (حالة)';
      const open = ['nr', 'rq', 'pt'].includes(st);
      r.open = r.app && open;
      r.done = r.app && ['rc', 'ok'].includes(st);
      r.res = r.app && ['rc', 'ok', 'nv'].includes(st);
      r.od = r.open && !!dueEff && dueEff < today;
      r.soon = r.open && !!dueEff && dueEff >= today && dueEff <= pbAddDays(today, 7);
      idx[id] = r;
      rows.push(r);
      return r;
    };
    const ccat = pbCustomCats(),
      cus = pbCustoms();
    for (const c of PB_CATS) {
      const o = {
        id: c.id,
        ar: c.ar,
        desc: c.desc,
        doc: c.doc,
        cyc: c.cyc,
        papers: c.papers,
        when: c.when,
        custom: false,
        g: PB_GROUPOF[c.id] || 'D',
        rows: [],
      };
      cats.push(o);
      for (const it of c.items) o.rows.push(mkRow(it, c, false));
    }
    for (const c of ccat) {
      cats.push({
        id: c.id,
        ar: c.ar,
        desc: c.desc || 'فئة مخصصة',
        doc: '',
        cyc: '',
        papers: [],
        when: '',
        custom: true,
        g: 'X',
        rows: [],
      });
    }
    const cb = {};
    cats.forEach(c => {
      cb[c.id] = c;
    });
    for (const x of cus) {
      let c = cb[x.cat];
      if (!c) {
        c =
          cb['_oth'] ||
          ((cb['_oth'] = {
            id: '_oth',
            ar: 'بنود أخرى',
            desc: 'بنود مخصصة بلا فئة',
            doc: '',
            cyc: '',
            papers: [],
            when: '',
            custom: true,
            g: 'X',
            rows: [],
          }),
          cats.push(cb['_oth']));
      }
      const it = { id: x.id, t: x.t, sub: x.sub || '', ref: x.ref || '', pr: x.pr || 'M', ph: x.ph || 'P', when: '' };
      c.rows.push(mkRow(it, c, true));
    }
    return { cats, rows, idx, A };
  });
}
const pbRow = id => pbAll().idx[id];
/* ---------- إحصاءات ---------- */
function pbStats(rows) {
  const s = {
    tot: 0,
    nr: 0,
    rq: 0,
    pt: 0,
    rc: 0,
    ok: 0,
    nv: 0,
    od: 0,
    soon: 0,
    open: 0,
    hiOpen: 0,
    done: 0,
    res: 0,
    na: 0,
  };
  for (const r of rows) {
    if (!r.appRaw) {
      continue;
    }
    if (r.st === 'na') {
      s.na++;
      continue;
    }
    if (!r.app) continue;
    s.tot++;
    s[r.st]++;
    if (r.open) s.open++;
    if (r.od) s.od++;
    if (r.soon) s.soon++;
    if (r.open && r.pr === 'H') s.hiOpen++;
    if (r.done) s.done++;
    if (r.res) s.res++;
  }
  s.pct = s.tot ? Math.round((s.res * 100) / s.tot) : 0;
  s.pctRcv = s.tot ? Math.round((s.done * 100) / s.tot) : 0;
  return s;
}
const pbRowsAll = () => pbAll().rows;
function pbStatsAll() {
  return vcache('pbstat', () => pbStats(pbRowsAll()));
}
/* ---------- مصفوفة تغطية بنود القوائم المالية ← فئات PBC ---------- */
const PB_FSMAP = [
  ['النقدية وما في حكمها والأرصدة البنكية', ['cash', 'fx']],
  ['العملاء وأوراق القبض والمدينون', ['rec', 'cash']],
  [
    'الإيرادات والمبيعات وعقود العملاء',
    ['rec', 'x_contract', 'x_re', 'x_tech', 'x_telecom', 'x_hosp', 'x_retail', 'x_ecom', 'x_trade'],
  ],
  ['المخزون وتكلفة المبيعات', ['inv', 'x_mfg', 'x_agri']],
  ['الأصول الثابتة والاستثمار العقاري', ['ppe', 'x_oil', 'x_energy', 'x_trans']],
  ['الأصول غير الملموسة والشهرة', ['ppe', 'est', 'x_pharma', 'x_tech']],
  ['أصول حق الاستخدام والتزامات الإيجار', ['lease']],
  ['الاستثمارات المالية والمشتقات', ['inv2', 'x_fin', 'x_bank', 'x_fund']],
  ['الاستثمارات في شركات تابعة وشقيقة ومشروعات مشتركة', ['inv2', 'grp', 'x_hold']],
  ['الموردون والدائنون والمستحقات', ['liab']],
  ['المخصصات والالتزامات المحتملة والقضايا', ['liab', 'events', 'gen']],
  ['القروض والتسهيلات وتكاليف التمويل', ['debt', 'cash']],
  ['حقوق الملكية والتوزيعات والاحتياطيات', ['eq', 'e_jsc', 'e_llc']],
  ['العاملون والأجور والمزايا والتأمينات', ['hr']],
  ['ضريبة الدخل الجارية والمؤجلة', ['tax']],
  ['ضريبة القيمة المضافة والضرائب والرسوم الأخرى', ['tax']],
  ['الأطراف ذات العلاقة', ['rp', 'gen']],
  ['العملات الأجنبية', ['fx']],
  ['التقديرات والاضمحلال والقيم العادلة', ['est']],
  ['الأحداث اللاحقة والاستمرارية', ['events']],
  ['القوائم المجمعة وإقرارات المكونات', ['grp']],
  ['القوائم المالية والإيضاحات والمعلومات الأخرى', ['fs', 'esg']],
  ['الحوكمة والرقابة الداخلية ونظم المعلومات', ['gov', 'policy', 'it', 'tb']],
  ['الغش والامتثال للقوانين', ['fraud']],
  ['السنة السابقة والأرصدة الافتتاحية', ['prev']],
  ['الإقرارات وخطابات الارتباط والإقفال', ['rep', 'close']],
];
function pbFsCoverage() {
  const cb = {};
  pbAll().cats.forEach(c => {
    cb[c.id] = c;
  });
  return PB_FSMAP.map(([ar, ids]) => {
    const rows = [];
    ids.forEach(i => {
      if (cb[i]) rows.push(...cb[i].rows);
    });
    const s = pbStats(rows);
    return { ar, cats: ids.filter(i => cb[i] && cb[i].rows.some(r => r.app)), s };
  });
}
/* ---------- فحص سلامة المكتبة (للاختبار) ---------- */
function pbLint() {
  const out = [];
  const known = new Set(['gen']);
  const atoms = new Set([
    ...Object.keys(PB_FLAGDEF),
    ...PB_FLAGS.map(f => f[0]),
    ...PB_SECTORS.map(s => 's_' + s[0]),
    ...PB_LEGAL.map(l => 'e_' + l[0]),
    'pub',
  ]);
  try {
    APP_FLAGS.forEach(f => atoms.add(f[0]));
  } catch (e) {
    logErr('50-pbc-core:125', e, 'info');
  }
  const seen = new Map();
  for (const c of PB_CATS) {
    for (const a of String(c.when).split(/[&,!]/))
      if (a.trim() && !atoms.has(a.trim())) out.push('ذرة مجهولة في الفئة ' + c.id + ': ' + a);
    for (const it of c.items) {
      for (const a of String(it.when).split(/[&,!]/))
        if (a.trim() && !atoms.has(a.trim())) out.push('ذرة مجهولة في ' + it.id + ': ' + a);
      if (!['H', 'M', 'L'].includes(it.pr)) out.push('أولوية غير صحيحة ' + it.id);
      if (!PB_PHL[it.ph]) out.push('مرحلة غير صحيحة ' + it.id + ':' + it.ph);
      const k = it.t.replace(/\s+/g, ' ');
      if (seen.has(k)) out.push('تكرار نص: ' + it.id + ' = ' + seen.get(k));
      else seen.set(k, it.id);
    }
    for (const p of c.papers)
      if (typeof WP !== 'undefined' && typeof CT !== 'undefined' && !WP[p] && !CT.items[p] && !CT.leg[p])
        out.push('ورقة غير موجودة ' + p + ' في الفئة ' + c.id);
  }
  return out;
}

export {
  PB_CATBY,
  PB_CATS,
  PB_DOC,
  PB_FLAGS,
  PB_INDMAP,
  PB_LEGAL,
  PB_PHASE,
  PB_PHL,
  PB_PRI,
  PB_PRL,
  PB_SECTORS,
  PB_ST,
  PB_STL,
  pbAddDays,
  pbAll,
  pbAtoms,
  pbCustomCats,
  pbCustoms,
  pbFlagMode,
  pbFsCoverage,
  pbK,
  pbLog,
  pbLogAdd,
  pbOwners,
  pbProfile,
  pbProfileSet,
  pbRaw,
  pbRow,
  pbRowsAll,
  pbSet,
  pbStats,
  pbStatsAll,
  pbToday,
};
