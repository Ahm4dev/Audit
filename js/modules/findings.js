/* ============================================================
   AuditPro - Findings Module
   Observations, exceptions, violations, management responses
   ============================================================ */

const FindingsModule = (() => {

  const FINDING_TYPES = {
    exception:   { label: 'استثناء',         color: '#DC2626' },
    observation: { label: 'ملاحظة',          color: '#D97706' },
    inquiry:     { label: 'استفسار',         color: '#0891B2' },
    violation:   { label: 'مخالفة',          color: '#7c3aed' },
    weakness:    { label: 'ضعف في الرقابة', color: '#0891b2' }
  };

  const SEVERITY_LEVELS = {
    high:   { label: 'جوهرية',    color: '#DC2626' },
    medium: { label: 'متوسطة',   color: '#D97706' },
    low:    { label: 'منخفضة',   color: '#0891B2' },
    info:   { label: 'معلومية',  color: '#059669' }
  };

  const FINDING_CATEGORIES = [
    'النقدية والبنوك', 'العملاء والمدينون', 'المخزون', 'الأصول الثابتة',
    'الموردون والدائنون', 'القروض والتمويل', 'الإيرادات', 'المصروفات',
    'الضرائب والزكاة', 'الرقابة الداخلية', 'الحوكمة', 'الأطراف ذات العلاقة',
    'الاستمرارية', 'الامتثال', 'أخرى'
  ];

  /* ---- Render findings page ---- */
  async function renderFindings() {
    const container = document.getElementById('findingsContent');
    if (!container) return;

    const clientId = App.getActiveClientId();
    if (!clientId) {
      container.innerHTML = Utils.noClientWarning('عرض الاستفسارات والاستثناءات');
      return;
    }

    await refreshFindingsContent(clientId);
  }

  async function refreshFindingsContent(clientId) {
    const container = document.getElementById('findingsContent');
    if (!container) return;

    const findings = await AuditDB.getByClientYear(AuditDB.STORES.FINDINGS, clientId, App.getActiveYear());
    findings.sort((a, b) => {
      const sev = { high: 0, medium: 1, low: 2, info: 3 };
      return (sev[a.severity] || 3) - (sev[b.severity] || 3);
    });

    const isArchive = App.isArchiveMode();
    const readOnly = App.isEditingBlocked();
    const total    = findings.length;
    const open     = findings.filter(f => f.status === 'open').length;
    const resolved = findings.filter(f => f.status === 'resolved').length;
    const high     = findings.filter(f => f.severity === 'high' && f.status === 'open').length;

    // Update nav badge
    const badge = document.getElementById('findingsBadge');
    if (badge) { badge.textContent = open; badge.style.display = open > 0 ? '' : 'none'; }

    container.innerHTML = `
      ${isArchive ? Utils.archiveBanner(App.getActiveYear(), App.isArchiveEditUnlocked()) : ''}
      <!-- Summary stats -->
      <div class="grid grid-4 mb-5">
        <div class="stat-card" style="--stat-color:var(--color-primary)">
          <div class="stat-card-label">إجمالي الملاحظات</div>
          <div class="stat-card-value">${total}</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--color-danger)">
          <div class="stat-card-label">مفتوحة</div>
          <div class="stat-card-value">${open}</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--color-success)">
          <div class="stat-card-label">تم حلها</div>
          <div class="stat-card-value">${resolved}</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--color-danger)">
          <div class="stat-card-label">جوهرية مفتوحة</div>
          <div class="stat-card-value">${high}</div>
          <div class="stat-card-sub" style="color:var(--color-danger)">تحتاج إجراء عاجل</div>
        </div>
      </div>

      <!-- Filters + list -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            الملاحظات والاستثناءات
          </div>
          ${readOnly ? '' : `
          <button class="btn btn-primary btn-sm" onclick="FindingsModule.openAddModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg>
            إضافة ملاحظة جديدة
          </button>`}
        </div>
        <div class="card-body">
          <div class="toolbar mb-4">
            <div class="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="findSearch" class="search-input" placeholder="بحث في الملاحظات..."
                oninput="FindingsModule.filterFindings()">
            </div>
            <select class="filter-select" id="findSeverityFilter" onchange="FindingsModule.filterFindings()">
              <option value="">كل مستويات الخطورة</option>
              ${Object.entries(SEVERITY_LEVELS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}
            </select>
            <select class="filter-select" id="findTypeFilter" onchange="FindingsModule.filterFindings()">
              <option value="">كل الأنواع</option>
              ${Object.entries(FINDING_TYPES).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}
            </select>
            <select class="filter-select" id="findStatusFilter" onchange="FindingsModule.filterFindings()">
              <option value="">كل الحالات</option>
              <option value="open">مفتوح</option>
              <option value="resolved">تم الحل</option>
              <option value="closed">مغلق</option>
            </select>
          </div>
          <div id="findingsList">
            ${renderFindingsCards(findings, readOnly)}
          </div>
        </div>
      </div>
    `;
  }

  /* ---- Render findings as cards ---- */
  function renderFindingsCards(findings, readOnly = App.isEditingBlocked()) {
    if (findings.length === 0) {
      return Utils.emptyStateHTML('لا توجد ملاحظات', 'لم يتم تسجيل أي ملاحظات أو استثناءات حتى الآن');
    }

    return findings.map(f => {
      const type = FINDING_TYPES[f.type] || FINDING_TYPES.observation;
      const sev  = SEVERITY_LEVELS[f.severity] || SEVERITY_LEVELS.low;

      return `
        <div class="finding-card" id="fc-${f.id}">
          <div class="finding-card-header">
            <div class="finding-severity ${f.severity}"></div>
            <div class="finding-meta">
              <div class="finding-title">${Utils.escapeHtml(f.title || '—')}</div>
              <div class="finding-sub">
                <span style="color:${type.color};font-weight:600;">${type.label}</span>
                <span style="color:${sev.color};font-weight:600;">• ${sev.label}</span>
                <span>• ${Utils.escapeHtml(f.category || '—')}</span>
                <span>• مرجع: <code style="font-family:monospace;">${Utils.escapeHtml(f.wpRef || '—')}</code></span>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;">
              ${Utils.statusBadge(f.status)}
              <div style="font-size:11px;color:var(--text-muted);">
                ${f.raisedDate ? Utils.formatDate(f.raisedDate) : ''}
              </div>
            </div>
          </div>
          <div class="finding-card-body">
            <div class="finding-field">
              <div class="finding-field-label">الوصف</div>
              <div class="finding-field-value">${Utils.escapeHtml(f.description || '—')}</div>
            </div>
            ${f.managementResponse ? `
              <div class="finding-field">
                <div class="finding-field-label" style="color:var(--color-info);">رد الإدارة</div>
                <div class="finding-field-value" style="background:var(--bg-surface-2);padding:10px;border-radius:6px;border-right:3px solid var(--color-info);">
                  ${Utils.escapeHtml(f.managementResponse)}
                </div>
              </div>
            ` : ''}
            ${f.correctiveAction ? `
              <div class="finding-field">
                <div class="finding-field-label" style="color:var(--color-success);">الإجراء التصحيحي</div>
                <div class="finding-field-value" style="background:var(--bg-surface-2);padding:10px;border-radius:6px;border-right:3px solid var(--color-success);">
                  ${Utils.escapeHtml(f.correctiveAction)}
                </div>
              </div>
            ` : ''}
            ${readOnly ? '' : `
            <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm" onclick="FindingsModule.openEditModal(${f.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                تعديل
              </button>
              ${f.status === 'open' ? `
                <button class="btn btn-success btn-sm" onclick="FindingsModule.markResolved(${f.id})">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20,6 9,17 4,12"/></svg>
                  تم الحل
                </button>
              ` : ''}
              <button class="btn btn-danger btn-sm" onclick="FindingsModule.deleteFinding(${f.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                حذف
              </button>
            </div>`}
          </div>
        </div>
      `;
    }).join('');
  }

  /* ---- Filter findings ---- */
  async function filterFindings() {
    const clientId = App.getActiveClientId();
    if (!clientId) return;

    const search   = (document.getElementById('findSearch')?.value || '').toLowerCase();
    const sevF     = document.getElementById('findSeverityFilter')?.value || '';
    const typeF    = document.getElementById('findTypeFilter')?.value || '';
    const statusF  = document.getElementById('findStatusFilter')?.value || '';

    let findings = await AuditDB.getByClientYear(AuditDB.STORES.FINDINGS, clientId, App.getActiveYear());
    findings = findings.filter(f => {
      const matchSearch = !search ||
        (f.title || '').toLowerCase().includes(search) ||
        (f.description || '').toLowerCase().includes(search);
      const matchSev    = !sevF   || f.severity === sevF;
      const matchType   = !typeF  || f.type     === typeF;
      const matchStatus = !statusF || f.status  === statusF;
      return matchSearch && matchSev && matchType && matchStatus;
    });

    findings.sort((a, b) => {
      const sev = { high: 0, medium: 1, low: 2, info: 3 };
      return (sev[a.severity] || 3) - (sev[b.severity] || 3);
    });

    const list = document.getElementById('findingsList');
    if (list) list.innerHTML = renderFindingsCards(findings);
  }

  /* ---- Finding form HTML ---- */
  function findingFormHTML(finding = {}) {
    const typeOptions = Object.entries(FINDING_TYPES).map(([k, v]) =>
      `<option value="${k}" ${finding.type === k ? 'selected' : ''}>${v.label}</option>`
    ).join('');
    const sevOptions = Object.entries(SEVERITY_LEVELS).map(([k, v]) =>
      `<option value="${k}" ${finding.severity === k ? 'selected' : ''}>${v.label}</option>`
    ).join('');
    const catOptions = FINDING_CATEGORIES.map(c =>
      `<option value="${c}" ${finding.category === c ? 'selected' : ''}>${c}</option>`
    ).join('');

    return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">نوع الملاحظة</label>
          <select class="form-control" id="fn-type">${typeOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label required">مستوى الخطورة</label>
          <select class="form-control" id="fn-severity">${sevOptions}</select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label required">عنوان الملاحظة</label>
        <input class="form-control" id="fn-title" type="text"
          value="${Utils.escapeHtml(finding.title || '')}"
          placeholder="عنوان مختصر ووصفي للملاحظة">
      </div>
      <div class="form-group">
        <label class="form-label required">وصف الملاحظة</label>
        <textarea class="form-control textarea-auto" id="fn-description" rows="4"
          placeholder="وصف تفصيلي للملاحظة أو الاستثناء...">${Utils.escapeHtml(finding.description || '')}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">الفئة / البند</label>
          <select class="form-control" id="fn-category">${catOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label">مرجع ورقة العمل</label>
          <input class="form-control" id="fn-wpRef" type="text"
            value="${Utils.escapeHtml(finding.wpRef || '')}" placeholder="مثال: B-1.1">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">رُفعت بواسطة</label>
          <input class="form-control" id="fn-raisedBy" type="text"
            value="${Utils.escapeHtml(finding.raisedBy || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">تاريخ الرفع</label>
          <input class="form-control" id="fn-raisedDate" type="date"
            value="${finding.raisedDate || Utils.today()}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">الحالة</label>
          <select class="form-control" id="fn-status">
            <option value="open"     ${finding.status === 'open'     || !finding.status ? 'selected' : ''}>مفتوح</option>
            <option value="resolved" ${finding.status === 'resolved' ? 'selected' : ''}>تم الحل</option>
            <option value="closed"   ${finding.status === 'closed'   ? 'selected' : ''}>مغلق</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">تاريخ الاستحقاق</label>
          <input class="form-control" id="fn-dueDate" type="date"
            value="${finding.dueDate || ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">رد الإدارة</label>
        <textarea class="form-control textarea-auto" id="fn-managementResponse" rows="3"
          placeholder="رد الإدارة على هذه الملاحظة...">${Utils.escapeHtml(finding.managementResponse || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">الإجراء التصحيحي</label>
        <textarea class="form-control textarea-auto" id="fn-correctiveAction" rows="3"
          placeholder="الإجراء التصحيحي المتخذ أو المقترح...">${Utils.escapeHtml(finding.correctiveAction || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">تاريخ الحل</label>
        <input class="form-control" id="fn-resolvedDate" type="date"
          value="${finding.resolvedDate || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">ملاحظات إضافية</label>
        <textarea class="form-control textarea-auto" id="fn-notes" rows="2"
          placeholder="أي ملاحظات إضافية...">${Utils.escapeHtml(finding.notes || '')}</textarea>
      </div>
      ${AttachmentsModule.placeholder('finding', finding.id)}
    `;
  }

  /* ---- Collect finding form data ---- */
  function collectFindingData() {
    return {
      type:               document.getElementById('fn-type')?.value || 'observation',
      severity:           document.getElementById('fn-severity')?.value || 'low',
      title:              (document.getElementById('fn-title')?.value || '').trim(),
      description:        (document.getElementById('fn-description')?.value || '').trim(),
      category:           document.getElementById('fn-category')?.value || '',
      wpRef:              (document.getElementById('fn-wpRef')?.value || '').trim(),
      raisedBy:           (document.getElementById('fn-raisedBy')?.value || '').trim(),
      raisedDate:         document.getElementById('fn-raisedDate')?.value || '',
      status:             document.getElementById('fn-status')?.value || 'open',
      dueDate:            document.getElementById('fn-dueDate')?.value || '',
      managementResponse: (document.getElementById('fn-managementResponse')?.value || '').trim(),
      correctiveAction:   (document.getElementById('fn-correctiveAction')?.value || '').trim(),
      resolvedDate:       document.getElementById('fn-resolvedDate')?.value || '',
      notes:              (document.getElementById('fn-notes')?.value || '').trim()
    };
  }

  /* ---- Open add modal ---- */
  function openAddModal(prefill = {}) {
    if (Utils.blockIfArchive()) return;
    const clientId = App.getActiveClientId();
    if (!clientId) { Utils.showToast('يجب اختيار عميل', 'error'); return; }

    Utils.openModal('إضافة ملاحظة جديدة', findingFormHTML(prefill), `
      <button class="btn btn-primary" id="saveFindingBtn">حفظ الملاحظة</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
    `, 'lg');
    AttachmentsModule.refreshSection('finding', null, clientId);

    document.getElementById('saveFindingBtn').addEventListener('click', async () => {
      const data = collectFindingData();
      if (!data.title) { Utils.showToast('يجب إدخال عنوان الملاحظة', 'error'); return; }
      if (!data.description) { Utils.showToast('يجب إدخال وصف الملاحظة', 'error'); return; }
      try {
        const newId = await AuditDB.add(AuditDB.STORES.FINDINGS, { ...data, clientId });
        await AuditDB.logActivity(clientId, 'إضافة ملاحظة',
          `تم إضافة ${FINDING_TYPES[data.type]?.label || 'ملاحظة'}: ${data.title}`,
          data.severity === 'high' ? 'warning' : 'info');
        Utils.closeModal();
        await refreshFindingsContent(clientId);
        // إصلاح: إعادة فتح الملاحظة الجديدة في وضع التعديل فوراً لتمكين إرفاق الملفات دون خطوات إضافية
        setTimeout(() => openEditModal(newId), 150);
        Utils.showToast('تمت إضافة الملاحظة — يمكنك الآن إرفاق ملفات', 'success');
      } catch(err) {
        Utils.showToast('خطأ في الحفظ', 'error'); console.error(err);
      }
    });
  }

  /* ---- Open edit modal ---- */
  async function openEditModal(id) {
    if (Utils.blockIfArchive()) return;
    const finding = await AuditDB.get(AuditDB.STORES.FINDINGS, id);
    if (!finding) return;
    const clientId = App.getActiveClientId();

    Utils.openModal('تعديل الملاحظة', findingFormHTML(finding), `
      <button class="btn btn-primary" id="updateFindingBtn">حفظ التعديلات</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
    `, 'lg');
    AttachmentsModule.refreshSection('finding', finding.id, clientId, finding.title);

    document.getElementById('updateFindingBtn').addEventListener('click', async () => {
      const data = collectFindingData();
      if (!data.title) { Utils.showToast('يجب إدخال عنوان الملاحظة', 'error'); return; }
      try {
        await AuditDB.put(AuditDB.STORES.FINDINGS, { ...finding, ...data });
        Utils.showToast('تم تحديث الملاحظة', 'success');
        Utils.closeModal();
        await refreshFindingsContent(clientId);
      } catch(err) {
        Utils.showToast('خطأ في الحفظ', 'error'); console.error(err);
      }
    });
  }

  /* ---- Mark as resolved ---- */
  async function markResolved(id) {
    if (Utils.blockIfArchive()) return;
    const finding = await AuditDB.get(AuditDB.STORES.FINDINGS, id);
    if (!finding) return;
    const clientId = App.getActiveClientId();

    // Quick modal to capture corrective action
    const body = `
      <div class="info-box mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div>تأكيد حل الملاحظة: <strong>${Utils.escapeHtml(finding.title)}</strong></div>
      </div>
      <div class="form-group">
        <label class="form-label">الإجراء التصحيحي المتخذ</label>
        <textarea class="form-control" id="resolve-action" rows="4"
          placeholder="وصف الإجراء التصحيحي الذي أدى إلى حل الملاحظة...">${Utils.escapeHtml(finding.correctiveAction || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">تاريخ الحل</label>
        <input class="form-control" id="resolve-date" type="date" value="${Utils.today()}">
      </div>
    `;

    Utils.openModal('تأكيد الحل', body, `
      <button class="btn btn-success" id="confirmResolveBtn">تأكيد الحل</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
    `);

    document.getElementById('confirmResolveBtn').addEventListener('click', async () => {
      const action = document.getElementById('resolve-action')?.value.trim();
      const date   = document.getElementById('resolve-date')?.value;
      await AuditDB.put(AuditDB.STORES.FINDINGS, {
        ...finding, status: 'resolved',
        correctiveAction: action, resolvedDate: date
      });
      await AuditDB.logActivity(clientId, 'حل ملاحظة', `تم حل: ${finding.title}`, 'success');
      Utils.showToast('تم تأشير الملاحظة كمحلولة', 'success');
      Utils.closeModal();
      await refreshFindingsContent(clientId);
    });
  }

  /* ---- Delete finding ---- */
  async function deleteFinding(id) {
    if (Utils.blockIfArchive()) return;
    Utils.confirmDialog('هل تريد حذف هذه الملاحظة؟ سيتم حذف مرفقاتها أيضاً.', async () => {
      const clientId = App.getActiveClientId();
      await AttachmentsModule.deleteAllFor('finding', id);
      await AuditDB.delete(AuditDB.STORES.FINDINGS, id);
      Utils.showToast('تم حذف الملاحظة', 'success');
      await refreshFindingsContent(clientId);
    });
  }

  /* ---- Get findings summary for reports ---- */
  async function getFindingsSummary(clientId) {
    const findings = await AuditDB.getByClientYear(AuditDB.STORES.FINDINGS, clientId, App.getActiveYear());
    return {
      total:      findings.length,
      open:       findings.filter(f => f.status === 'open').length,
      resolved:   findings.filter(f => f.status === 'resolved').length,
      high:       findings.filter(f => f.severity === 'high').length,
      medium:     findings.filter(f => f.severity === 'medium').length,
      low:        findings.filter(f => f.severity === 'low').length,
      exceptions: findings.filter(f => f.type === 'exception').length,
      findings
    };
  }

  return {
    renderFindings,
    filterFindings,
    openAddModal,
    openEditModal,
    markResolved,
    deleteFinding,
    getFindingsSummary,
    FINDING_TYPES,
    SEVERITY_LEVELS
  };
})();
