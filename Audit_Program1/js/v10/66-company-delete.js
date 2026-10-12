/* Audit-Plus · v10 · Delete a company (home screen + company page): typed confirmation, safe move to _trash, undo */

import { hub } from '../hub.js';
import { PREF, countFiles, esc, localISO, logErr, sanitizeName } from '../core/01-utils-i18n-storage.js';
import { can } from '../core/02-auth.js';
import { CO, CUR, audit, copyDir, errMsg } from '../core/03-data-engine.js';

const CODEL = (() => {
  const ar = () => (PREF && PREF.lang) !== 'en';
  const T = (a, e) => (ar() ? a : e);
  async function del(id) {
    await CO.load();
    const c = CO.byId(id);
    if (!c) return;
    if (!can('del')) {
      hub.toast(T('لا تملك صلاحية حذف الشركات.', 'You do not have permission to delete companies.'), 'e');
      return;
    }
    const engs = await CO.engs(c).catch(() => []);
    const ok = await hub.ask({
      title: T('حذف الشركة نهائيًا', 'Delete company'),
      danger: true,
      ok: T('حذف', 'Delete'),
      body: `<p>${T('سيتم حذف الشركة', 'The company will be deleted:')} <b>${esc(c.name)}</b> (${esc(c.id)}) ${T('وجميع ارتباطاتها', 'and all its engagements')} (<b>${engs.length}</b>) ${T('وملفاتها.', 'with all files.')}</p><p class="note warn">${T('تُنقل البيانات إلى سلة محذوفات داخل المخزن ويمكنك التراجع فورًا.', 'Data is moved to a trash folder inside the store; you can undo right away.')}</p>`,
      input: { label: T('اكتب اسم الشركة للتأكيد', 'Type the company name to confirm'), must: c.name },
    });
    if (!ok) return;
    try {
      await hub.SAVER.flush(true);
      if (CUR.eng && CUR.company && String(CUR.company.id) === String(c.id)) await hub.closeEng();
      const ts = localISO().replace(/[:.+]/g, '-');
      const tdir = '_trash/' + sanitizeName(c.id, 20) + '__' + ts;
      await hub.STORE.mkdir('_trash');
      await hub.STORE.mkdir(tdir);
      const n1 = await countFiles(hub.STORE, c._dir);
      await copyDir(c._dir, tdir);
      const n2 = await countFiles(hub.STORE, tdir);
      if (n2 < n1)
        throw new Error(
          T(
            'تعذر نسخ ملفات الشركة بالكامل إلى السلة؛ لم يُحذف شيء.',
            'Could not copy all files to trash; nothing was deleted.'
          )
        );
      await hub.STORE.remove(c._dir);
      audit('company.delete', { id: c.id, name: c.name, engagements: engs.length, trash: tdir });
      await CO.load();
      hub.toast(T('تم حذف الشركة «', 'Company deleted: ') + c.name + T('».', ''), 's', 12000, {
        label: T('تراجع', 'Undo'),
        fn: async () => {
          try {
            await hub.STORE.mkdir(c._dir);
            await copyDir(tdir, c._dir);
            await hub.STORE.remove(tdir);
            audit('company.restore', { id: c.id });
            await CO.load();
            hub.toast(T('تمت استعادة الشركة.', 'Company restored.'), 's');
            hub.route(true);
          } catch (e) {
            hub.toast(errMsg(e), 'e');
          }
        },
      });
      if (location.hash.startsWith('#/c/') || location.hash.startsWith('#/e/')) location.hash = '#/';
      else hub.route(true);
    } catch (e) {
      logErr('company delete', e);
      hub.toast(errMsg(e), 'e');
    }
  }
  function inject() {
    document.querySelectorAll('.co-card').forEach(card => {
      if (card.querySelector('[data-act=codel]')) return;
      const id = (card.querySelector('.ref') || {}).textContent;
      const row = card.querySelector('.row.noprint');
      if (!id || !row || !can('del')) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn d sm';
      b.dataset.act = 'codel';
      b.dataset.id = id.trim();
      b.textContent = T('حذف', 'Delete');
      row.appendChild(b);
    });
    const m = document.getElementById('main');
    if (m && location.hash.startsWith('#/c/') && can('del') && !m.querySelector('[data-act=codel]')) {
      const ed = m.querySelector('[data-act=coedit]');
      if (ed) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn d';
        b.dataset.act = 'codel';
        b.dataset.id = ed.dataset.id;
        b.textContent = T('حذف الشركة', 'Delete company');
        ed.parentNode.appendChild(b);
      }
    }
  }
  document.addEventListener('meap:routed', () => setTimeout(inject, 0));
  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-act=codel]');
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      del(b.dataset.id);
    },
    true
  );
  return { del, inject };
})();
