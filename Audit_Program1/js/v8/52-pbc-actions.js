/* Audit-Plus · v8 · PBC actions — الأحداث والحوارات والإجراءات الجماعية */

import { hub } from '../hub.js';
import { esc, logErr, normAr, sanitizeName } from '../core/01-utils-i18n-storage.js';
import { CUR, errMsg } from '../core/03-data-engine.js';
import { autogrow, fitTables, formDlg } from '../ui/04-ui-primitives.js';
import { G, L, RO, bar } from '../views/05-indexes.js';
import { refreshBlock } from '../modules/15-working-papers.js';
import { OWN } from '../modules/16-relations.js';
import { XP } from '../v4/32-catalog.js';
import { refCandidates } from '../v4/39-references.js';
import {
  PB_CATBY,
  PB_FLAGS,
  PB_INDMAP,
  PB_PHASE,
  PB_PRI,
  PB_ST,
  PB_STL,
  pbAddDays,
  pbAll,
  pbCustomCats,
  pbCustoms,
  pbK,
  pbLogAdd,
  pbOwners,
  pbProfile,
  pbProfileSet,
  pbRaw,
  pbRow,
  pbSet,
  pbStats,
  pbStatsAll,
  pbToday,
} from './50-pbc-core.js';
import {
  PBUI,
  pbAttIdx,
  pbBadge,
  pbCatBody,
  pbDate,
  pbDrawerHTML,
  pbInhHTML,
  pbLkLineHTML,
  pbMatch,
  pbMetaHTML,
  pbOwnerNames,
  pbRowHTML,
  pbTitleHTML,
} from './51-pbc-view.js';

/* ---------- حالة بند + التواريخ التلقائية (مصدر واحد للمنطق) ---------- */
function pbStatusPatch(id, st, over) {
  const o = {};
  const r = pbRow(id) || {};
  const today = pbToday();
  over = over || {};
  o[pbK(id, 'st')] = st;
  if (['rq', 'pt', 'rc', 'ok'].includes(st) && !(over.rq || r.rq)) o[pbK(id, 'rq')] = today;
  if (['rc', 'ok'].includes(st) && !(over.rcv || r.rcv)) o[pbK(id, 'rcv')] = today;
  if (['pt'].includes(st) && !(over.rcv || r.rcv)) o[pbK(id, 'rcv')] = today;
  if (st === 'nr') {
    o[pbK(id, 'rq')] = null;
    o[pbK(id, 'rcv')] = null;
  }
  return o;
}
const pbRand = () => Math.random().toString(36).slice(2, 6);
/* ---------- تحديث جزئي للواجهة ---------- */
function pbRefreshChrome() {
  refreshBlock('pbx|kpi');
  const S = pbStatsAll();
  document.querySelectorAll('[data-pbk=pct]').forEach(el => {
    el.textContent = S.pct + '%';
    const p = el.parentElement;
    const i = p && p.querySelector('.bar i');
    if (i) i.style.width = S.pct + '%';
    const sp = p && p.querySelector('span');
    if (sp) sp.textContent = 'استُكمل ' + S.res + ' من ' + S.tot;
  });
}
function pbUpdateCatHead(catId) {
  const d = document.querySelector(`details.pbcat[data-cat="${CSS.escape(catId)}"]`);
  if (!d) return;
  const c = pbAll().cats.find(x => x.id === catId);
  if (!c) return;
  const s = pbStats(c.rows);
  const m = d.querySelector('.pbcat-m');
  if (m) m.innerHTML = `${s.res}/${s.tot}${s.od ? ` · <b class="bad">${s.od} متأخر</b>` : ''}`;
  const b = d.querySelector('.pbcat-b');
  if (b) b.innerHTML = bar(s.pct);
}
function pbRefreshRow(id) {
  const r = pbRow(id);
  const w = document.querySelector(`.pbrw[data-id="${CSS.escape(id)}"]`);
  if (!w || !r) return;
  const row = w.querySelector('.pbr');
  if (!row) return;
  /* تحديث موضعي بدون استبدال خانات الإدخال (حتى لا يضيع التركيز أثناء التنقل بين الخانات) */
  row.className = `pbr st-${r.st} pr-${r.pr}${r.od ? ' od' : ''}${r.app ? '' : ' na'}`;
  const st = row.querySelector('.pb-st');
  if (st && st.value !== r.st) st.value = r.st;
  const meta = row.querySelector('.pb-meta');
  if (meta) meta.innerHTML = pbMetaHTML(r);
  const tb = row.querySelector('.pb-t');
  if (tb) tb.innerHTML = pbTitleHTML(r);
  const inh = row.querySelector('.pb-inhw');
  if (inh) inh.innerHTML = pbInhHTML(r);
  const na = pbAttIdx()[r.id] || 0;
  const ba = row.querySelector('[data-open=att]');
  if (ba) ba.innerHTML = pbBadge('📎', na);
  const bl = row.querySelector('button[data-pb=lk]');
  if (bl) bl.innerHTML = pbBadge('🔗', r.lk.length);
  const lk = w.querySelector('.pbx-lk');
  if (lk) lk.innerHTML = pbLkLineHTML(r);
  pbUpdateCatHead(r.cat);
  pbRefreshChrome();
}
/* استبدال كامل للصف (عند الإخفاء/الإظهار أو استرجاع النص) */
function pbReplaceRow(id) {
  const r = pbRow(id);
  const w = document.querySelector(`.pbrw[data-id="${CSS.escape(id)}"]`);
  if (!w || !r) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = pbRowHTML(r);
  const n = tmp.firstElementChild;
  w.replaceWith(n);
  if (PBUI.xr.has(id)) {
    const dr = n.querySelector('.pbr-x');
    dr.hidden = false;
    dr.innerHTML = pbDrawerHTML(r);
    dr.querySelectorAll('textarea').forEach(autogrow);
  }
  pbUpdateCatHead(r.cat);
  pbRefreshChrome();
}
function pbRefreshList() {
  refreshBlock('pbx|listbody');
  refreshBlock('pbx|kpi');
  pbSelCount();
}
function pbSelCount() {
  document.querySelectorAll('[data-pbsel-count],[data-pbsel]:not(input)').forEach(e => {
    e.textContent = PBUI.sel.size;
  });
}
/* ---------- مستمعو التغيير ---------- */
document.addEventListener('change', e => {
  const el = e.target;
  if (!(el instanceof Element) || !CUR.eng || el.closest('#dlg')) return;
  const d = el.dataset || {};
  if (d.pbst && !RO()) {
    const id = d.pbf;
    const st = el.value;
    CUR.eng.setMany(pbStatusPatch(id, st), { label: 'حالة متطلب' });
    pbRefreshRow(id);
    return;
  }
  if (d.pbf && !RO()) {
    const f = (d.k || '').split('.').pop();
    if (['ow', 'due', 'ph', 'pr', 'rq', 'rcv'].includes(f)) {
      pbRefreshRow(d.pbf);
    }
    return;
  }
  if (d.pbsel != null && el.type === 'checkbox') {
    if (el.checked) PBUI.sel.add(d.pbsel);
    else PBUI.sel.delete(d.pbsel);
    pbSelCount();
    return;
  }
  if (d.pbfilter) {
    PBUI.f[d.pbfilter] = el.value;
    if (d.pbfilter !== 'q') {
      pbRefreshList();
    }
    return;
  }
  if (d.pbdue && !RO()) {
    const p = pbProfile();
    const due = Object.assign({}, p.due, { [d.pbdue]: el.value });
    pbProfileSet({ due });
    pbRefreshChrome();
    refreshBlock('pbx|' + (PBUI.tab === 'dash' ? 'dash' : PBUI.tab === 'list' ? 'list' : 'profile'));
    return;
  }
  if (d.pbprof && !RO()) {
    const name = d.pbprof;
    const vals = [...document.querySelectorAll(`[data-pbprof="${name}"]`)].filter(x => x.checked).map(x => x.value);
    pbProfileSet({ [name]: vals });
    refreshBlock('pbx|profile');
    return;
  }
  if (d.pbflag && !RO()) {
    const id = d.pbflag,
      v = el.value;
    if (PB_FLAGS.some(f => f[0] === id)) {
      const flags = Object.assign({}, pbProfile().flags);
      if (v === '') delete flags[id];
      else flags[id] = v === 'y';
      pbProfileSet({ flags });
    } else CUR.eng.set('eng.app.' + id, v, { label: 'خصائص العميل' });
    refreshBlock('pbx|profile');
    return;
  }
  if (d.pbprofd && !RO()) {
    pbProfileSet({ [d.pbprofd]: el.value });
    return;
  }
  if (d.pbct && !RO()) {
    const c = Object.assign({}, pbProfile().contact, { [d.pbct]: el.value.trim() });
    pbProfileSet({ contact: c });
    return;
  }
  if (d.pbown != null && !RO()) {
    const a = pbOwners().map(o => Object.assign({}, o));
    const i = +d.pbown;
    if (a[i]) {
      a[i][d.f] = el.value.trim();
      CUR.eng.set('pbx._own', a, { label: 'مسؤولو العميل' });
    }
    return;
  }
  if (d.pbrefresh) {
    const ind = G('eng.ind', '');
    const add = (PB_INDMAP[ind] || '').split(',').filter(Boolean);
    const raw = pbRaw('pbx._prof');
    if (raw && Array.isArray(raw.sectors) && add.length) {
      const s = [...new Set([...raw.sectors, ...add])];
      pbProfileSet({ sectors: s });
      hub.toast('أُضيفت حزمة القطاع إلى أنشطة العميل.', 'i');
    }
    refreshBlock('pbx|profile');
    return;
  }
  if (el.hasAttribute('data-pbimport')) {
    const f = el.files[0];
    el.value = '';
    if (f) hub.pbImportFile(f);
    return;
  }
});
let _pbqT = 0;
document.addEventListener('input', e => {
  const el = e.target;
  if (!(el instanceof Element) || !el.dataset) return;
  if (el.dataset.pbfilter === 'q') {
    PBUI.f.q = el.value;
    clearTimeout(_pbqT);
    _pbqT = setTimeout(() => {
      refreshBlock('pbx|listbody');
      pbSelCount();
    }, 220);
  }
});
document.addEventListener(
  'toggle',
  e => {
    const d = e.target;
    if (!(d instanceof HTMLDetailsElement) || !d.classList.contains('pbcat')) return;
    const id = d.dataset.cat;
    if (d.open) {
      PBUI.open.add(id);
      const body = d.querySelector('.pbcat-body');
      if (body && !body.childElementCount) {
        const c = pbAll().cats.find(x => x.id === id);
        if (c) {
          body.innerHTML = pbCatBody(c);
          fitTables(body);
          body.querySelectorAll('textarea').forEach(autogrow);
        }
      }
    } else PBUI.open.delete(id);
  },
  true
);
/* ---------- النقر ---------- */
document.addEventListener('click', async e => {
  const b = e.target instanceof Element && e.target.closest('[data-pb]');
  if (!b || !CUR.eng) return;
  const a = b.dataset.pb;
  const id = b.dataset.id;
  const ro = RO();
  try {
    if (a === 'x') {
      e.preventDefault();
      const w = b.closest('.pbrw');
      if (!w) return;
      const dr = w.querySelector('.pbr-x');
      if (dr.hidden) {
        const r = pbRow(id);
        dr.innerHTML = pbDrawerHTML(r);
        dr.hidden = false;
        PBUI.xr.add(id);
        dr.querySelectorAll('textarea').forEach(autogrow);
        w.querySelector('.pb-t').setAttribute('aria-expanded', 'true');
        if (b.dataset.open === 'att') {
          const at = dr.querySelector('.pbx-att');
          at && at.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      } else if (b.dataset.open !== 'att') {
        dr.hidden = true;
        dr.innerHTML = '';
        PBUI.xr.delete(id);
        w.querySelector('.pb-t').setAttribute('aria-expanded', 'false');
      }
      return;
    }
    if (a === 'kfilter') {
      const f = PBUI.f;
      Object.keys(f).forEach(k => (f[k] = ''));
      const d = b.dataset;
      if (d.f !== undefined && d.f !== '') f.st = d.f;
      if (d.st) f.st = d.st;
      if (d.ph) f.ph = d.ph;
      if (d.cat) {
        f.cat = d.cat;
        PBUI.open.add(d.cat);
      }
      if (d.ow) f.ow = d.ow;
      PBUI.tab = 'list';
      if (b.tagName === 'A' && location.hash === b.getAttribute('href')) {
        e.preventDefault();
        refreshBlock('pbx|list');
      }
      return;
    }
    if (a === 'fclear') {
      Object.keys(PBUI.f).forEach(k => (PBUI.f[k] = ''));
      refreshBlock('pbx|list');
      return;
    }
    if (a === 'expand') {
      pbAll().cats.forEach(c => PBUI.open.add(c.id));
      pbRefreshList();
      return;
    }
    if (a === 'collapse') {
      PBUI.open.clear();
      pbRefreshList();
      return;
    }
    if (ro && !['letter', 'xlsx', 'csv', 'json', 'print', 'tplexp'].includes(a)) return;
    if (a === 'lk') {
      await pbLinkDlg(id);
      return;
    }
    if (a === 'add') {
      await pbAddItemDlg(b.dataset.cat || PBUI.f.cat || '');
      return;
    }
    if (a === 'addcat') {
      await pbAddCatDlg();
      return;
    }
    if (a === 'selvis') {
      pbAll()
        .rows.filter(pbMatch)
        .forEach(r => PBUI.sel.add(r.id));
      document.querySelectorAll('input[data-pbsel]').forEach(x => {
        x.checked = PBUI.sel.has(x.dataset.pbsel);
      });
      pbSelCount();
      return;
    }
    if (a === 'selnone') {
      PBUI.sel.clear();
      document.querySelectorAll('input[data-pbsel]').forEach(x => {
        x.checked = false;
      });
      pbSelCount();
      return;
    }
    if (a === 'bulk') {
      await pbBulkDlg();
      return;
    }
    if (a === 'catreq') {
      const c = pbAll().cats.find(x => x.id === b.dataset.cat);
      if (!c) return;
      const o = {};
      let n = 0;
      c.rows
        .filter(r => r.app && r.st === 'nr')
        .forEach(r => {
          Object.assign(o, pbStatusPatch(r.id, 'rq'));
          n++;
        });
      if (n) {
        CUR.eng.setMany(o, { label: 'طلب بنود فئة' });
        pbLogAdd('bulk', 'تعليم ' + n + ' بند «تم الطلب» في فئة «' + c.ar + '»', n);
        pbRefreshList();
        hub.toast('عُلِّم ' + n + ' بندًا كمطلوب.', 's');
      } else hub.toast('لا بنود غير مطلوبة في هذه الفئة.', 'i');
      return;
    }
    if (a === 'delcat') {
      const cid = b.dataset.cat;
      if (
        !(await hub.ask({ title: 'حذف الفئة', body: 'تُحذف الفئة وبنودها المخصصة. متابعة؟', ok: 'حذف', danger: true }))
      )
        return;
      CUR.eng.set(
        'pbx._ccat',
        pbCustomCats().filter(x => x.id !== cid),
        { label: 'حذف فئة PBC' }
      );
      CUR.eng.set(
        'pbx._cus',
        pbCustoms().filter(x => x.cat !== cid),
        { label: 'حذف بنود فئة' }
      );
      pbRefreshList();
      return;
    }
    if (a === 'hide') {
      pbSet(id, 'o', 'n', 'إخفاء متطلب');
      pbReplaceRow(id);
      return;
    }
    if (a === 'show') {
      const r = pbRow(id);
      CUR.eng.setMany(Object.assign({ [pbK(id, 'o')]: 'y' }, r && r.st === 'na' ? { [pbK(id, 'st')]: 'nr' } : {}), {
        label: 'إظهار متطلب',
      });
      pbReplaceRow(id);
      return;
    }
    if (a === 'del') {
      if (
        !(await hub.ask({
          title: 'حذف البند',
          body: 'سيُحذف البند المخصص وكل بياناته. متابعة؟',
          ok: 'حذف',
          danger: true,
        }))
      )
        return;
      CUR.eng.set(
        'pbx._cus',
        pbCustoms().filter(x => x.id !== id),
        { label: 'حذف بند PBC' }
      );
      PBUI.xr.delete(id);
      pbRefreshList();
      return;
    }
    if (a === 'rtext') {
      pbSet(id, 't', null, 'استرجاع نص');
      PBUI.xr.add(id);
      pbReplaceRow(id);
      return;
    }
    if (a === 'autodates') {
      pbAutoDates();
      return;
    }
    if (a === 'addown') {
      const a2 = pbOwners().slice();
      a2.push({ name: '', role: '', email: '', phone: '' });
      CUR.eng.set('pbx._own', a2, { label: 'مسؤول جديد' });
      refreshBlock('pbx|profile');
      return;
    }
    if (a === 'delown') {
      const i = +b.dataset.i;
      CUR.eng.set(
        'pbx._own',
        pbOwners().filter((_, k) => k !== i),
        { label: 'حذف مسؤول' }
      );
      refreshBlock('pbx|profile');
      return;
    }
    if (a === 'defown') {
      const have = new Set(pbOwners().map(o => o.name));
      const base = [
        'المدير المالي',
        'المحاسب العام',
        'محاسب المخزون',
        'مسؤول الخزينة',
        'مسؤول الموارد البشرية والأجور',
        'المسؤول الضريبي',
        'المستشار القانوني',
        'مدير تقنية المعلومات',
        'أمين المخازن',
        'مدير المشتريات',
        'مدير المبيعات',
        'مدير المراجعة الداخلية',
        'سكرتير مجلس الإدارة',
      ]
        .filter(n => !have.has(n))
        .map(n => ({ name: n, role: '', email: '', phone: '' }));
      CUR.eng.set('pbx._own', pbOwners().concat(base), { label: 'مسؤولون نمطيون' });
      refreshBlock('pbx|profile');
      return;
    }
    if (a === 'logadd') {
      const el = document.getElementById('pblogtxt');
      const v = ((el && el.value) || '').trim();
      if (!v) return;
      pbLogAdd('note', v);
      refreshBlock('pbx|follow');
      return;
    }
    if (a === 'issue') {
      await hub.pbIssue();
      return;
    }
    if (a === 'letter') {
      await hub.pbLetter(b.dataset.kind || 'initial', b.dataset.ow || '');
      return;
    }
    if (a === 'xlsx') {
      hub.pbExportXlsx();
      return;
    }
    if (a === 'csv') {
      hub.pbExportCsv();
      return;
    }
    if (a === 'json') {
      hub.pbExportJson();
      return;
    }
    if (a === 'print') {
      hub.pbPrint(b.dataset.mode || 'all');
      return;
    }
    if (a === 'tplsave') {
      await hub.pbTplSave();
      return;
    }
    if (a === 'tplload') {
      await hub.pbTplLoad();
      return;
    }
    if (a === 'tplexp') {
      hub.pbTplExport();
      return;
    }
    if (a === 'prevyear') {
      await hub.pbPrevYear();
      return;
    }
  } catch (x) {
    logErr('pbc action ' + a, x);
    hub.toast(errMsg(x), 'e');
  }
});
/* ---------- مواعيد تلقائية ---------- */
function pbAutoDates() {
  const p = pbProfile();
  const s = p.start,
    r = p.report;
  if (!s && !r) {
    hub.toast('أدخل تاريخ بدء الفحص أو التاريخ المستهدف للتقرير أولًا.', 'w');
    return;
  }
  const st = s || pbAddDays(r, -45),
    rp = r || pbAddDays(s, 45);
  const due = {
    P: pbAddDays(st, -7),
    I: st,
    Y: pbAddDays(st, Math.max(5, Math.round((new Date(rp) - new Date(st)) / 864e5 / 3))),
    C: pbAddDays(rp, -10),
    S: pbAddDays(rp, 30),
  };
  pbProfileSet({ due });
  hub.toast('طُبِّقت مواعيد المراحل المقترحة؛ عدّلها كما يلزم.', 's');
  refreshBlock('pbx|profile');
}
/* ---------- حوار الروابط ---------- */
async function pbLinkDlg(id) {
  const r = pbRow(id);
  if (!r) return;
  const cands = refCandidates();
  const cur = new Set(r.lk);
  const res = await formDlg({
    title: 'ربط المتطلب بأوراق العمل',
    html: `<p class="mut small">اختر أوراق العمل التي تُستخدم فيها هذه المستندات؛ سيظهر البند أيضًا داخل تلك الأوراق.</p><label class="fl">بحث<input class="in" data-refq placeholder="جزء من الرقم أو الاسم…"></label>
  <div class="pblkbox" data-refsel2>${cands.map(x => `<label class="pblk" data-q="${esc(normAr(x[1]))}"><input type="checkbox" name="lk_${esc(x[0])}"${cur.has(x[0]) ? ' checked' : ''}> <span>${esc(x[1])}</span></label>`).join('')}</div>`,
    ok: 'حفظ الروابط',
    after: box => {
      const q = box.querySelector('[data-refq]');
      const wrap = box.querySelector('[data-refsel2]');
      q.addEventListener('input', () => {
        const v = normAr(q.value);
        wrap.querySelectorAll('.pblk').forEach(l => {
          l.hidden = v && !l.dataset.q.includes(v);
        });
      });
    },
    onOk: async d =>
      Object.keys(d)
        .filter(k => k.startsWith('lk_') && d[k])
        .map(k => k.slice(3)),
  });
  if (!res) return;
  CUR.eng.set(pbK(id, 'lk'), res.length ? res : null, { label: 'ربط متطلب بأوراق العمل' });
  pbRefreshRow(id);
}
/* ---------- إضافة بند / فئة ---------- */
async function pbAddItemDlg(cat) {
  const D = pbAll();
  const owners = pbOwnerNames();
  const res = await formDlg({
    title: 'إضافة متطلب جديد',
    html: `<div class="fgrid"><label class="full">نص المتطلب<textarea class="ta" name="t" rows="3" required placeholder="مثال: كشف حساب مفصل لأرصدة المقاولين من الباطن في 31/12 مع مطابقة الأرصدة"></textarea></label>
  <label>الفئة<select class="sel" name="cat">${D.cats.map(c => `<option value="${esc(c.id)}"${c.id === cat ? ' selected' : ''}>${esc(c.ar)}</option>`).join('')}</select></label>
  <label>المجموعة الفرعية (اختياري)<input class="in" name="sub"></label>
  <label>المرجع / المعيار<input class="in" name="ref" placeholder="ISA 500"></label>
  <label>الأولوية<select class="sel" name="pr">${PB_PRI.map(p => `<option value="${p[0]}"${p[0] === 'M' ? ' selected' : ''}>${p[1]}</option>`).join('')}</select></label>
  <label>المرحلة<select class="sel" name="ph">${PB_PHASE.map(p => `<option value="${p[0]}">${esc(p[1])}</option>`).join('')}</select></label>
  <label>المسؤول لدى العميل<input class="in" name="ow" list="pb-owners2"></label><label>الاستحقاق<input class="in" type="date" name="due" dir="ltr"></label></div><datalist id="pb-owners2">${owners.map(o => `<option value="${esc(o)}">`).join('')}</datalist>`,
    ok: 'إضافة',
    onOk: async d => {
      if (!String(d.t || '').trim()) throw new Error('اكتب نص المتطلب');
      return d;
    },
  });
  if (!res) return;
  const id = 'u' + Date.now().toString(36) + pbRand();
  const cus = pbCustoms().slice();
  cus.push({
    id,
    cat: res.cat,
    sub: (res.sub || '').trim(),
    t: res.t.trim(),
    ref: (res.ref || '').trim(),
    pr: res.pr,
    ph: res.ph,
  });
  const o = { 'pbx._cus': cus };
  if (res.ow) o[pbK(id, 'ow')] = res.ow.trim();
  if (res.due) o[pbK(id, 'due')] = res.due;
  CUR.eng.setMany(o, { label: 'إضافة متطلب PBC' });
  PBUI.open.add(res.cat);
  pbRefreshList();
  hub.toast('أُضيف المتطلب.', 's');
}
async function pbAddCatDlg() {
  const res = await formDlg({
    title: 'فئة جديدة',
    html: `<label class="fl">اسم الفئة<input class="in" name="t" required></label><label class="fl">وصف (اختياري)<input class="in" name="d"></label>`,
    ok: 'إضافة',
    onOk: async d => {
      if (!String(d.t || '').trim()) throw new Error('اكتب اسم الفئة');
      return d;
    },
  });
  if (!res) return;
  const cc = pbCustomCats().slice();
  const id = 'c' + Date.now().toString(36);
  cc.push({ id, ar: res.t.trim(), desc: (res.d || '').trim() });
  CUR.eng.set('pbx._ccat', cc, { label: 'فئة PBC' });
  PBUI.open.add(id);
  pbRefreshList();
}
/* ---------- إجراء جماعي ---------- */
async function pbBulkDlg() {
  const vis = pbAll().rows.filter(pbMatch);
  const sel = [...PBUI.sel].filter(id => pbRow(id));
  if (!sel.length && !vis.length) {
    hub.toast('لا توجد بنود لتطبيق الإجراء عليها.', 'w');
    return;
  }
  const owners = pbOwnerNames();
  const row = (k, lab, inner) =>
    `<div class="pbbulk-r"><label class="row"><input type="checkbox" name="u_${k}"> <b>${lab}</b></label><div>${inner}</div></div>`;
  const res = await formDlg({
    title: 'إجراء جماعي على المتطلبات',
    html: `<div class="fgrid"><label class="full">النطاق<select class="sel" name="scope">${sel.length ? `<option value="sel">المحدد (${sel.length})</option>` : ''}<option value="vis"${sel.length ? '' : ' selected'}>كل الظاهر بعد التصفية (${vis.length})</option></select></label></div>
  ${row('st', 'الحالة', `<select class="sel" name="st">${PB_ST.map(s => `<option value="${s[0]}">${esc(s[1])}</option>`).join('')}</select>`)}
  ${row('ow', 'المسؤول لدى العميل', `<input class="in" name="ow" list="pb-owners2">`)}
  ${row('due', 'تاريخ الاستحقاق', `<input class="in" type="date" name="due" dir="ltr">`)}
  ${row('pr', 'الأولوية', `<select class="sel" name="pr">${PB_PRI.map(p => `<option value="${p[0]}">${p[1]}</option>`).join('')}</select>`)}
  ${row('ph', 'المرحلة', `<select class="sel" name="ph">${PB_PHASE.map(p => `<option value="${p[0]}">${esc(p[1])}</option>`).join('')}</select>`)}
  ${row('o', 'الانطباق', `<select class="sel" name="o"><option value="n">إخفاء (لا ينطبق على العميل)</option><option value="y">إظهار</option></select>`)}
  <datalist id="pb-owners2">${owners.map(o => `<option value="${esc(o)}">`).join('')}</datalist>`,
    ok: 'تطبيق',
    onOk: async d => {
      if (!['st', 'ow', 'due', 'pr', 'ph', 'o'].some(k => d['u_' + k]))
        throw new Error('اختر حقلًا واحدًا على الأقل لتغييره');
      return d;
    },
  });
  if (!res) return;
  const ids = res.scope === 'sel' ? sel : vis.map(r => r.id);
  const o = {};
  for (const id of ids) {
    if (res.u_st) Object.assign(o, pbStatusPatch(id, res.st));
    if (res.u_ow) o[pbK(id, 'ow')] = (res.ow || '').trim() || null;
    if (res.u_due) o[pbK(id, 'due')] = res.due || null;
    if (res.u_pr) o[pbK(id, 'pr')] = res.pr;
    if (res.u_ph) o[pbK(id, 'ph')] = res.ph;
    if (res.u_o) o[pbK(id, 'o')] = res.o;
  }
  CUR.eng.setMany(o, { label: 'إجراء جماعي على PBC' });
  pbLogAdd('bulk', 'تحديث جماعي لـ ' + ids.length + ' بندًا', ids.length);
  PBUI.sel.clear();
  pbRefreshList();
  hub.toast('طُبِّق التحديث على ' + ids.length + ' بندًا.', 's');
}
/* ---------- المرفقات: استلام تلقائي + وصف المالك ---------- */
(function () {
  const _label = OWN.label,
    _dir = OWN.dir;
  OWN.label = function (o) {
    if (o.t === 'pbx') {
      const r = pbRow(o.id);
      return 'متطلب العميل: ' + (r ? r.t.slice(0, 70) : o.id);
    }
    return _label.call(OWN, o);
  };
  OWN.dir = function (store, o) {
    if (o.t === 'pbx') return store.path + '/pbc/attachments/' + sanitizeName(o.id, 40);
    return _dir.call(OWN, store, o);
  };
  const _add = hub.attAdd;
  hub.attAdd = async function (tok, files) {
    const pbx = /^pbx!/.test(tok);
    const o = OWN.parse(tok);
    const n0 = pbx ? hub.attListO(CUR.eng, o).length : 0;
    await _add(tok, files);
    if (pbx) {
      const n1 = hub.attListO(CUR.eng, o).length;
      if (n1 > n0) {
        const id = o.id;
        const r = pbRow(id);
        if (r && ['nr', 'rq'].includes(r.st)) {
          CUR.eng.setMany(pbStatusPatch(id, 'rc'), { label: 'استلام متطلب بمرفق' });
          hub.toast('عُدِّلت حالة المتطلب إلى «تم الاستلام».', 'i');
        }
        const rw = document.querySelector(`.pbrw[data-id="${CSS.escape(id)}"]`);
        if (rw) {
          PBUI.xr.add(id);
          pbRefreshRow(id);
        }
      }
    }
  };
  /* لا نترك مرفقات البنود تُحذف عند تحديث الصف: نحدّث العداد بعد الحذف */
  const _del = hub.attDel;
  hub.attDel = async function (tok, id) {
    await _del(tok, id);
    if (/^pbx!/.test(tok)) {
      const x = OWN.parse(tok).id;
      if (document.querySelector(`.pbrw[data-id="${CSS.escape(x)}"]`)) {
        PBUI.xr.add(x);
        pbRefreshRow(x);
      }
    }
  };
})();
/* ---------- ربط عكسي: متطلبات العميل داخل أوراق العمل ---------- */
function pbForPaper(ref) {
  const D = pbAll();
  const out = [];
  for (const r of D.rows) {
    if (!r.app) continue;
    const c = PB_CATBY[r.cat];
    if (r.lk.includes(ref) || (c && c.papers.includes(ref))) out.push(r);
  }
  return out;
}
hub.BLOCKS.pbpaper = ref => {
  const rows = pbForPaper(ref);
  if (!rows.length) return '<p class="mut small">لا متطلبات مرتبطة بهذه الورقة.</p>';
  const S = pbStats(rows);
  const show = rows
    .slice()
    .sort((a, b) => (a.res ? 1 : 0) - (b.res ? 1 : 0) || (a.pr < b.pr ? -1 : 1))
    .slice(0, 25);
  return `<p class="small"><b>${S.res}</b> من <b>${S.tot}</b> مستلم${S.od ? ` · <b class="bad">${S.od} متأخر</b>` : ''} · <a href="${L('pbc/list')}" data-pb="kfilter">فتح القائمة</a></p><div class="tw"><table class="pbt"><thead><tr><th>المتطلب</th><th>المسؤول</th><th>الاستحقاق</th><th>الحالة</th></tr></thead><tbody>${show.map(r => `<tr class="${r.od ? 'od' : ''}"><td class="tx">${esc(r.t)}</td><td>${esc(r.ow || '—')}</td><td>${pbDate(r.dueEff)}</td><td>${esc(PB_STL[r.st])}</td></tr>`).join('')}</tbody></table></div>${rows.length > show.length ? `<p class="mut small">… و${rows.length - show.length} أخرى في القائمة الكاملة.</p>` : ''}`;
};
/* ---------- بطاقة A355Q (الورقة القديمة) ---------- */
XP.pbc = (it, p, ref) => {
  const S = pbStatsAll();
  return `<div class="note">تم نقل قائمة متطلبات العميل إلى قسم مستقل أشمل: <a class="btn o sm" href="${L('pbc/dash')}">فتح «متطلبات العميل» ←</a></div>
 <div class="pbk-row"><div class="pbk"><b>${S.tot}</b><span>بند منطبق</span></div><div class="pbk ok"><b>${S.done}</b><span>مستلم</span></div><div class="pbk"><b>${S.open}</b><span>مفتوح</span></div><div class="pbk bad"><b>${S.od}</b><span>متأخر</span></div></div>
 <p>${bar(S.pct)}</p><p class="mut small">كل ما أُدخل سابقًا في هذه الورقة (الحالة، المسؤول، التواريخ، الملاحظات، البنود المخصصة) محفوظ ويظهر في القسم الجديد تلقائيًا.</p>`;
};
hub.BLOCKS.pbc = () => XP.pbc();

export { pbForPaper, pbRand, pbRefreshChrome, pbStatusPatch };
