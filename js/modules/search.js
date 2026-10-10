/* ============================================================
   AuditPro - Global Search Module
   ------------------------------------------------------------
   بحث موحّد في الوقت الحقيقي عبر جميع كيانات النظام:
   العملاء / أوراق العمل / الملاحظات / إجراءات المراجعة /
   بنود التخطيط / المخاطر
   ============================================================ */

const SearchModule = (() => {

  let _debounceTimer = null;
  let _lastQuery     = '';
  const RESULT_LIMIT = 8;  // نتائج من كل فئة كحد أقصى

  /* ---- Entry points ---- */
  function debounceSearch(query) {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => runSearch(query), 220);
  }

  async function runSearch(query) {
    query = (query || '').trim();
    _lastQuery = query;

    const resultsEl = document.getElementById('globalSearchResults');
    if (!resultsEl) return;

    if (query.length < 2) {
      resultsEl.innerHTML = '<div class="search-hint">اكتب حرفين على الأقل للبدء بالبحث</div>';
      return;
    }

    resultsEl.innerHTML = '<div class="search-hint">جارٍ البحث...</div>';
    resultsEl.classList.remove('hidden');

    try {
      const results = await search(query);
      renderResults(resultsEl, query, results);
    } catch (e) {
      console.error('Search error', e);
      resultsEl.innerHTML = '<div class="search-hint">حدث خطأ أثناء البحث</div>';
    }
  }

  /* ---- Core search logic ---- */
  async function search(q) {
    const lq = q.toLowerCase();
    const matched = { clients: [], workpapers: [], findings: [], procedures: [], risks: [], components: [] };

    // كل الكيانات بدون قيد على العميل (يمكن البحث عبر جميع العملاء)
    const [clients, workpapers, findings, procedures, risks, components] = await Promise.all([
      AuditDB.getAll(AuditDB.STORES.CLIENTS),
      AuditDB.getAll(AuditDB.STORES.WORKPAPERS),
      AuditDB.getAll(AuditDB.STORES.FINDINGS),
      AuditDB.getAll(AuditDB.STORES.PROCEDURES),
      AuditDB.getAll(AuditDB.STORES.RISKS),
      AuditDB.getAll(AuditDB.STORES.COMPONENTS)
    ]);

    const hit = (obj, fields) =>
      fields.some(f => (obj[f] || '').toLowerCase().includes(lq));

    clients.forEach(c => {
      if (hit(c, ['name','fileNumber','activity','address','taxNumber','contactPerson']))
        matched.clients.push(c);
    });

    workpapers.forEach(w => {
      if (hit(w, ['reference','title','content','notes','preparedBy','reviewedBy','category']))
        matched.workpapers.push(w);
    });

    findings.forEach(f => {
      if (hit(f, ['title','description','category','correctiveAction','managementResponse','wpRef']))
        matched.findings.push(f);
    });

    procedures.forEach(p => {
      if (hit(p, ['title','implementationDetails','finding','conclusion','auditorNotes','wpRef']))
        matched.procedures.push(p);
    });

    risks.forEach(r => {
      if (hit(r, ['title','description']))
        matched.risks.push(r);
    });

    components.forEach(c => {
      if (hit(c, ['name','location','componentAuditor']))
        matched.components.push(c);
    });

    return matched;
  }

  /* ---- Build client name lookup map ---- */
  let _clientMap = null;
  async function getClientMap() {
    if (!_clientMap) {
      const clients = await AuditDB.getAll(AuditDB.STORES.CLIENTS);
      _clientMap = {};
      clients.forEach(c => { _clientMap[c.id] = c.name; });
    }
    return _clientMap;
  }

  // invalidate on client list change
  function invalidateClientMap() { _clientMap = null; }

  /* ---- Render results dropdown ---- */
  function highlight(text, q) {
    if (!text || !q) return Utils.escapeHtml(text || '');
    const str = String(text);
    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escapedQ})`, 'gi');

    // نقسّم النص الخام أولاً حول مواقع التطابق، ثم نُعقِّم كل قطعة بمفردها،
    // بدل تطبيق الـ Regex على نص مُعقَّم مسبقاً (وهو ما كان يكسر رموز HTML
    // المُرمَّزة مثل &amp; إذا تطابق جزء من حروفها مع نص البحث).
    const parts = str.split(re);
    return parts.map((part, i) => {
      const safe = Utils.escapeHtml(part);
      return (i % 2 === 1) ? `<mark class="search-highlight">${safe}</mark>` : safe;
    }).join('');
  }

  async function renderResults(el, q, results) {
    const clientMap = await getClientMap();
    const sections = [];

    const addSection = (label, icon, items, renderItem) => {
      if (items.length === 0) return;
      const limited = items.slice(0, RESULT_LIMIT);
      sections.push(`
        <div class="search-section">
          <div class="search-section-title">${icon} ${label} (${items.length})</div>
          ${limited.map(renderItem).join('')}
          ${items.length > RESULT_LIMIT
            ? `<div class="search-more">+ ${items.length - RESULT_LIMIT} نتيجة أخرى — ضيّق نطاق البحث لرؤيتها</div>`
            : ''}
        </div>
      `);
    };

    addSection('عملاء', '👤', results.clients, c => `
      <button class="search-result-item" onclick="SearchModule.goToClient(${c.id})">
        <div class="search-result-title">${highlight(c.name, q)}</div>
        <div class="search-result-meta">${highlight(c.fileNumber || '', q)} • ${Utils.escapeHtml(c.financialYear || '')}</div>
      </button>
    `);

    addSection('أوراق العمل', '📋', results.workpapers, w => `
      <button class="search-result-item" onclick="SearchModule.goToWorkpaper(${w.clientId}, '${Utils.escapeHtml(w.fiscalYear || '')}')">
        <div class="search-result-title">${highlight(w.reference + ' — ' + w.title, q)}</div>
        <div class="search-result-meta">${Utils.escapeHtml(clientMap[w.clientId] || '')} • ${Utils.escapeHtml(w.category || '')}${w.fiscalYear ? ' • سنة ' + Utils.escapeHtml(w.fiscalYear) : ''}</div>
      </button>
    `);

    addSection('الملاحظات', '⚠️', results.findings, f => `
      <button class="search-result-item" onclick="SearchModule.goToFindings(${f.clientId}, '${Utils.escapeHtml(f.fiscalYear || '')}')">
        <div class="search-result-title">${highlight(f.title, q)}</div>
        <div class="search-result-meta">${Utils.escapeHtml(clientMap[f.clientId] || '')} • ${Utils.escapeHtml(f.category || '')}${f.fiscalYear ? ' • سنة ' + Utils.escapeHtml(f.fiscalYear) : ''}</div>
      </button>
    `);

    addSection('إجراءات المراجعة', '✅', results.procedures, p => `
      <button class="search-result-item" onclick="SearchModule.goToPrograms(${p.clientId}, '${Utils.escapeHtml(p.fiscalYear || '')}')">
        <div class="search-result-title">${highlight(p.procedureNum + ' — ' + p.title, q)}</div>
        <div class="search-result-meta">${Utils.escapeHtml(clientMap[p.clientId] || '')}${p.fiscalYear ? ' • سنة ' + Utils.escapeHtml(p.fiscalYear) : ''}</div>
      </button>
    `);

    addSection('سجل المخاطر', '🎯', results.risks, r => `
      <button class="search-result-item" onclick="SearchModule.goToRisk(${r.clientId}, '${Utils.escapeHtml(r.fiscalYear || '')}')">
        <div class="search-result-title">${highlight(r.title, q)}</div>
        <div class="search-result-meta">${Utils.escapeHtml(clientMap[r.clientId] || '')} • مستوى: ${Utils.escapeHtml(r.level || '')}${r.fiscalYear ? ' • سنة ' + Utils.escapeHtml(r.fiscalYear) : ''}</div>
      </button>
    `);

    addSection('مكوّنات المجموعة', '🏢', results.components, c => `
      <button class="search-result-item" onclick="SearchModule.goToQuality(${c.clientId}, '${Utils.escapeHtml(c.fiscalYear || '')}')">
        <div class="search-result-title">${highlight(c.name, q)}</div>
        <div class="search-result-meta">${Utils.escapeHtml(clientMap[c.clientId] || '')}${c.location ? ' • ' + Utils.escapeHtml(c.location) : ''}</div>
      </button>
    `);

    const total = Object.values(results).reduce((s, a) => s + a.length, 0);

    el.innerHTML = total === 0
      ? `<div class="search-hint">لا توجد نتائج مطابقة لـ "${Utils.escapeHtml(q)}"</div>`
      : sections.join('');
  }

  /* ---- Navigation helpers ----
     إصلاح خلل #8: إن كان السجل المطلوب من سنة مالية أرشيفية مختلفة عن
     السنة الحالية للعميل، نُبدِّل العرض لتلك السنة تلقائياً بعد فتح
     العميل، حتى يظهر السجل المطلوب فعلاً في الصفحة المستهدفة. */
  function goToClient(clientId) {
    App.setActiveClient(clientId).then(() => App.navigateTo('clients'));
    hideResults();
  }

  function goToWorkpaper(clientId, fiscalYear) {
    App.setActiveClient(clientId).then(() => {
      if (fiscalYear) App.setActiveYear(fiscalYear);
      App.navigateTo('workpapers');
    });
    hideResults();
  }

  function goToFindings(clientId, fiscalYear) {
    App.setActiveClient(clientId).then(() => {
      if (fiscalYear) App.setActiveYear(fiscalYear);
      App.navigateTo('findings');
    });
    hideResults();
  }

  function goToPrograms(clientId, fiscalYear) {
    App.setActiveClient(clientId).then(() => {
      if (fiscalYear) App.setActiveYear(fiscalYear);
      App.navigateTo('programs');
    });
    hideResults();
  }

  function goToRisk(clientId, fiscalYear) {
    App.setActiveClient(clientId).then(() => {
      if (fiscalYear) App.setActiveYear(fiscalYear);
      App.navigateTo('planning');
    });
    hideResults();
  }

  function goToQuality(clientId, fiscalYear) {
    App.setActiveClient(clientId).then(() => {
      if (fiscalYear) App.setActiveYear(fiscalYear);
      App.navigateTo('quality');
    });
    hideResults();
  }

  /* ---- Show / hide ---- */
  function showResults() {
    const el = document.getElementById('globalSearchResults');
    const input = document.getElementById('globalSearchInput');
    if (!el || !input) return;
    el.classList.remove('hidden');
    if (_lastQuery.length >= 2) runSearch(_lastQuery);
    else el.innerHTML = '<div class="search-hint">ابدأ بالكتابة للبحث...</div>';
  }

  function hideResults() {
    document.getElementById('globalSearchResults')?.classList.add('hidden');
  }

  function hideResultsDelayed() {
    setTimeout(hideResults, 200);
  }

  /* ---- Keyboard shortcut Ctrl+K / Cmd+K ---- */
  function setupShortcut() {
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('globalSearchInput');
        if (!input) return;
        input.focus();
        input.select();
        showResults();
      }
      if (e.key === 'Escape') {
        hideResults();
        document.getElementById('globalSearchInput')?.blur();
      }
    });
  }

  return {
    debounceSearch,
    runSearch,
    showResults,
    hideResults,
    hideResultsDelayed,
    setupShortcut,
    invalidateClientMap,
    goToClient, goToWorkpaper, goToFindings, goToPrograms, goToRisk, goToQuality
  };
})();
