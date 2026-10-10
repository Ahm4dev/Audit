/* ============================================================
   AuditPro - Work Papers Module
   Lead schedules, supporting schedules, cross-referencing, sign-off
   ============================================================ */

const WorkpapersModule = (() => {

  const WP_TYPES = {
    lead:       { label: 'Lead Schedule',         color: '#1F8377' },
    supporting: { label: 'Supporting Schedule',   color: '#16A34A' },
    permanent:  { label: 'Permanent File',         color: '#7c3aed' },
    correspondence:{ label: 'مراسلات',            color: '#D97706' },
    other:      { label: 'أخرى',                  color: '#64748b' }
  };

  const WP_CATEGORIES = [
    'التقارير المالية', 'الأصول المتداولة', 'الأصول غير المتداولة',
    'الالتزامات المتداولة', 'الالتزامات طويلة الأجل', 'حقوق الملكية',
    'قائمة الدخل', 'التدفقات النقدية', 'التخطيط', 'الرقابة الداخلية', 'أخرى'
  ];

  const TICK_MARKS = [
    { symbol: '✓', label: 'تم التحقق', cls: 'tick-verified' },
    { symbol: 'Ⅰ', label: 'تم الاتفاق', cls: 'tick-agreed' },
    { symbol: 'C', label: 'تم الجمع',  cls: 'tick-cast' },
    { symbol: '↔', label: 'إحالة مرجعية', cls: 'tick-cross-ref' }
  ];

  /* ---- Render workpapers page ---- */
  async function renderWorkpapers() {
    const container = document.getElementById('workpapersContent');
    if (!container) return;

    const clientId = App.getActiveClientId();
    if (!clientId) {
      container.innerHTML = Utils.noClientWarning('عرض أوراق العمل');
      return;
    }

    const workpapers = await AuditDB.getByClientYear(AuditDB.STORES.WORKPAPERS, clientId, App.getActiveYear());
    workpapers.sort((a, b) => (a.reference || '').localeCompare(b.reference || ''));
    const isArchive = App.isArchiveMode();
    const readOnly = App.isEditingBlocked();

    const totalWP = workpapers.length;
    const reviewedWP = workpapers.filter(w => w.status === 'reviewed' || w.status === 'approved').length;
    const pendingWP  = workpapers.filter(w => !w.signedOff).length;

    container.innerHTML = `
      ${isArchive ? Utils.archiveBanner(App.getActiveYear(), App.isArchiveEditUnlocked()) : ''}
      <!-- Summary -->
      <div class="grid grid-4 mb-5">
        <div class="stat-card" style="--stat-color:var(--color-primary)">
          <div class="stat-card-label">إجمالي أوراق العمل</div>
          <div class="stat-card-value">${totalWP}</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--color-success)">
          <div class="stat-card-label">تمت مراجعتها</div>
          <div class="stat-card-value">${reviewedWP}</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--color-warning)">
          <div class="stat-card-label">في انتظار التوقيع</div>
          <div class="stat-card-value">${pendingWP}</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--color-accent)">
          <div class="stat-card-label">Lead Schedules</div>
          <div class="stat-card-value">${workpapers.filter(w=>w.type==='lead').length}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
            أوراق العمل
          </div>
          ${readOnly ? '' : `
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary btn-sm" onclick="WorkpapersModule.openAddModal()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg>
              إضافة ورقة عمل
            </button>
            <button class="btn btn-secondary btn-sm" onclick="WorkpapersModule.openSignOffModal()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 11l3 3L22 4"/></svg>
              Sign-Off الملف
            </button>
          </div>`}
        </div>

        <div class="card-body">
          <!-- Type filter -->
          <div class="toolbar mb-4">
            <div class="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="wpSearch" placeholder="بحث في أوراق العمل..." class="search-input"
                oninput="WorkpapersModule.filterWP()">
            </div>
            <select class="filter-select" id="wpTypeFilter" onchange="WorkpapersModule.filterWP()">
              <option value="">كل الأنواع</option>
              ${Object.entries(WP_TYPES).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('')}
            </select>
            <select class="filter-select" id="wpCatFilter" onchange="WorkpapersModule.filterWP()">
              <option value="">كل الفئات</option>
              ${WP_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>

          <!-- Tick marks legend -->
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;padding:12px;background:var(--bg-surface-2);border-radius:8px;align-items:center;">
            <span style="font-size:12px;color:var(--text-muted);font-weight:600;">رموز المراجعة:</span>
            ${TICK_MARKS.map(t => `
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="tick-mark ${t.cls}">${t.symbol}</span>
                <span style="font-size:12px;color:var(--text-secondary);">${t.label}</span>
              </div>
            `).join('')}
          </div>

          <!-- Table -->
          <div class="data-table-wrapper" id="wpTableWrap">
            ${renderWPTable(workpapers, readOnly)}
          </div>
        </div>
      </div>
    `;
  }

  /* ---- Render WP table ---- */
  function renderWPTable(workpapers, readOnly = App.isEditingBlocked()) {
    if (workpapers.length === 0) {
      return Utils.emptyStateHTML('لا توجد أوراق عمل', 'ابدأ بإضافة ورقة عمل جديدة', 'إضافة ورقة عمل', 'WorkpapersModule.openAddModal()');
    }

    const rows = workpapers.map(wp => {
      const type = WP_TYPES[wp.type] || WP_TYPES.other;
      return `
        <tr id="wpr-${wp.id}" class="wp-row-clickable" onclick="WorkpapersModule.openViewModal(${wp.id})" title="انقر لعرض ورقة العمل">
          <td>
            <span class="wp-ref">${Utils.escapeHtml(wp.reference || '—')}</span>
          </td>
          <td>${Utils.escapeHtml(wp.title || '—')}</td>
          <td>
            <span style="background:${type.color};color:white;font-size:11px;padding:2px 8px;border-radius:9px;">
              ${type.label}
            </span>
          </td>
          <td>${Utils.escapeHtml(wp.category || '—')}</td>
          <td>${Utils.escapeHtml(wp.preparedBy || '—')}</td>
          <td>${Utils.formatDate(wp.prepDate)}</td>
          <td>
            ${wp.reviewedBy
              ? `<span class="badge badge-success">✓ ${Utils.escapeHtml(wp.reviewedBy)}</span>`
              : '<span class="badge badge-warning">في الانتظار</span>'
            }
          </td>
          <td>
            ${wp.externalApproval
              ? `<span class="stamp" title="اعتمد بواسطة: ${Utils.escapeHtml(wp.externalApproval.reviewer)} في ${Utils.formatDate(wp.externalApproval.date)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>${Utils.escapeHtml(wp.externalApproval.reviewer)}</span>`
              : '<span class="badge badge-neutral">لم يُعتمد خارجياً</span>'
            }
          </td>
          <td onclick="event.stopPropagation()">
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-sm btn-secondary" onclick="WorkpapersModule.openViewModal(${wp.id})" title="عرض">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              ${readOnly ? '' : `
              <button class="btn btn-sm btn-secondary" onclick="WorkpapersModule.openEditModal(${wp.id})" title="تعديل">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-sm ${wp.externalApproval ? 'btn-success' : 'btn-secondary'}" onclick="WorkpapersModule.externalApproveModal(${wp.id})" title="${wp.externalApproval ? 'تعديل الاعتماد الخارجي' : 'اعتماد خارجي'}">
                🔏
              </button>
              <button class="btn btn-sm btn-danger" onclick="WorkpapersModule.deleteWP(${wp.id})" title="حذف">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
              </button>`}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>المرجع</th>
            <th>العنوان</th>
            <th>النوع</th>
            <th>الفئة</th>
            <th>أعدّه</th>
            <th>تاريخ الإعداد</th>
            <th>المراجعة</th>
            <th>الاعتماد</th>
            <th>اعتماد خارجي</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  /* ---- Filter work papers ---- */
  async function filterWP() {
    const clientId = App.getActiveClientId();
    if (!clientId) return;

    const search   = (document.getElementById('wpSearch')?.value || '').toLowerCase();
    const typeF    = document.getElementById('wpTypeFilter')?.value || '';
    const catF     = document.getElementById('wpCatFilter')?.value || '';

    let wps = await AuditDB.getByClientYear(AuditDB.STORES.WORKPAPERS, clientId, App.getActiveYear());
    wps = wps.filter(w => {
      const matchSearch = !search || (w.title||'').toLowerCase().includes(search) || (w.reference||'').toLowerCase().includes(search);
      const matchType   = !typeF || w.type === typeF;
      const matchCat    = !catF  || w.category === catF;
      return matchSearch && matchType && matchCat;
    });

    wps.sort((a, b) => (a.reference||'').localeCompare(b.reference||''));
    const wrap = document.getElementById('wpTableWrap');
    if (wrap) wrap.innerHTML = renderWPTable(wps);
  }

  /* ---- WP form HTML ---- */
  function wpFormHTML(wp = {}) {
    const typeOptions = Object.entries(WP_TYPES).map(([k,v]) =>
      `<option value="${k}" ${wp.type===k?'selected':''}>${v.label}</option>`
    ).join('');
    const catOptions = WP_CATEGORIES.map(c =>
      `<option value="${c}" ${wp.category===c?'selected':''}>${c}</option>`
    ).join('');

    return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">مرجع ورقة العمل</label>
          <input class="form-control" id="wp-ref" type="text" value="${Utils.escapeHtml(wp.reference||'')}" placeholder="مثال: TB-001, C-1, B-2">
        </div>
        <div class="form-group">
          <label class="form-label required">نوع ورقة العمل</label>
          <select class="form-control" id="wp-type">${typeOptions}</select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label required">عنوان ورقة العمل</label>
        <input class="form-control" id="wp-title" type="text" value="${Utils.escapeHtml(wp.title||'')}" placeholder="وصف مختصر لمحتوى ورقة العمل">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">الفئة</label>
          <select class="form-control" id="wp-category">${catOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label">الحالة</label>
          <select class="form-control" id="wp-status">
            <option value="prepared" ${wp.status==='prepared'?'selected':''}>قيد الإعداد</option>
            <option value="reviewed" ${wp.status==='reviewed'?'selected':''}>تمت المراجعة</option>
            <option value="approved" ${wp.status==='approved'?'selected':''}>معتمد</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">محتوى ورقة العمل / ملخص</label>
        <textarea class="form-control" id="wp-content" rows="5"
          placeholder="وصف محتوى ورقة العمل، النتائج، الاستنتاجات...">${Utils.escapeHtml(wp.content||'')}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">أعدّه</label>
          <input class="form-control" id="wp-preparedBy" type="text" value="${Utils.escapeHtml(wp.preparedBy||'')}">
        </div>
        <div class="form-group">
          <label class="form-label">تاريخ الإعداد</label>
          <input class="form-control" id="wp-prepDate" type="date" value="${wp.prepDate||''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">راجعه</label>
          <input class="form-control" id="wp-reviewedBy" type="text" value="${Utils.escapeHtml(wp.reviewedBy||'')}">
        </div>
        <div class="form-group">
          <label class="form-label">تاريخ المراجعة</label>
          <input class="form-control" id="wp-revDate" type="date" value="${wp.revDate||''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">ملاحظات المراجعة</label>
        <textarea class="form-control" id="wp-notes" rows="3"
          placeholder="ملاحظات المراجع أو الشريك...">${Utils.escapeHtml(wp.notes||'')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">الإحالات المرجعية (Cross References)</label>
        <input class="form-control" id="wp-crossRefs" type="text"
          value="${Utils.escapeHtml(wp.crossRefs||'')}"
          placeholder="مثال: TB-001, B-1, FA-2 (مفصولة بفاصلة)">
      </div>
      <div class="check-row">
        <input type="checkbox" id="wp-signedOff" ${wp.signedOff?'checked':''}>
        <label for="wp-signedOff">معتمدة ومُوقّعة (Signed Off)</label>
      </div>
      ${AttachmentsModule.placeholder('workpaper', wp.id)}
    `;
  }

  /* ---- Collect WP form data ---- */
  function collectWPData() {
    return {
      reference:  (document.getElementById('wp-ref')?.value || '').trim(),
      type:       document.getElementById('wp-type')?.value || 'other',
      title:      (document.getElementById('wp-title')?.value || '').trim(),
      category:   document.getElementById('wp-category')?.value || '',
      status:     document.getElementById('wp-status')?.value || 'prepared',
      content:    (document.getElementById('wp-content')?.value || '').trim(),
      preparedBy: (document.getElementById('wp-preparedBy')?.value || '').trim(),
      prepDate:   document.getElementById('wp-prepDate')?.value || '',
      reviewedBy: (document.getElementById('wp-reviewedBy')?.value || '').trim(),
      revDate:    document.getElementById('wp-revDate')?.value || '',
      notes:      (document.getElementById('wp-notes')?.value || '').trim(),
      crossRefs:  (document.getElementById('wp-crossRefs')?.value || '').trim(),
      signedOff:  document.getElementById('wp-signedOff')?.checked || false
    };
  }

  /* ---- Open add modal ---- */
  function openAddModal() {
    if (Utils.blockIfArchive()) return;
    const clientId = App.getActiveClientId();
    if (!clientId) { Utils.showToast('يجب اختيار عميل', 'error'); return; }

    Utils.openModal('إضافة ورقة عمل جديدة', wpFormHTML(), `
      <button class="btn btn-primary" id="saveWPBtn">حفظ ورقة العمل</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
    `, 'lg');
    AttachmentsModule.refreshSection('workpaper', null, clientId);

    document.getElementById('saveWPBtn').addEventListener('click', async () => {
      const data = collectWPData();
      if (!data.reference || !data.title) { Utils.showToast('يجب إدخال المرجع والعنوان', 'error'); return; }
      try {
        const newId = await AuditDB.add(AuditDB.STORES.WORKPAPERS, { ...data, clientId });
        Utils.closeModal();
        renderWorkpapers();
        // BUG FIX: Re-open in edit mode immediately so the user can add attachments to the new record
        setTimeout(() => openEditModal(newId), 150);
        Utils.showToast('تمت إضافة ورقة العمل — يمكنك الآن إرفاق ملفات', 'success');
      } catch(err) {
        Utils.showToast('خطأ في الحفظ', 'error'); console.error(err);
      }
    });
  }

  /* ---- Open edit modal ---- */
  async function openEditModal(id) {
    if (Utils.blockIfArchive()) return;
    const wp = await AuditDB.get(AuditDB.STORES.WORKPAPERS, id);
    if (!wp) return;

    Utils.openModal('تعديل ورقة العمل', wpFormHTML(wp), `
      <button class="btn btn-primary" id="updateWPBtn">حفظ التعديلات</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
    `, 'lg');
    AttachmentsModule.refreshSection('workpaper', wp.id, wp.clientId, wp.title || wp.reference);

    document.getElementById('updateWPBtn').addEventListener('click', async () => {
      const data = collectWPData();
      if (!data.reference || !data.title) { Utils.showToast('يجب إدخال المرجع والعنوان', 'error'); return; }
      try {
        await AuditDB.put(AuditDB.STORES.WORKPAPERS, { ...wp, ...data });
        Utils.showToast('تم تحديث ورقة العمل', 'success');
        Utils.closeModal();
        renderWorkpapers();
      } catch(err) {
        Utils.showToast('خطأ في الحفظ', 'error'); console.error(err);
      }
    });
  }

  /* ---- Open view modal ---- */
  async function openViewModal(id) {
    const wp = await AuditDB.get(AuditDB.STORES.WORKPAPERS, id);
    if (!wp) return;
    const type = WP_TYPES[wp.type] || WP_TYPES.other;

    const body = `
      <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap;">
        <div><span class="form-label">المرجع</span><div class="wp-ref">${Utils.escapeHtml(wp.reference||'—')}</div></div>
        <div><span class="form-label">النوع</span><div><span style="background:${type.color};color:white;font-size:12px;padding:3px 10px;border-radius:9px;">${type.label}</span></div></div>
        <div><span class="form-label">الحالة</span>${Utils.statusBadge(wp.status)}</div>
        <div><span class="form-label">الفئة</span><div>${Utils.escapeHtml(wp.category||'—')}</div></div>
      </div>

      <div style="font-size:18px;font-weight:700;margin-bottom:16px;color:var(--text-primary);">${Utils.escapeHtml(wp.title||'—')}</div>

      ${wp.content ? `
        <div class="card mb-4">
          <div class="card-header"><div class="card-title">المحتوى / الملخص</div></div>
          <div class="card-body" style="font-size:14px;white-space:pre-wrap;">${Utils.escapeHtml(wp.content)}</div>
        </div>
      ` : ''}

      <div class="sign-off-panel">
        <div class="sign-off-box ${wp.preparedBy?'signed':''}">
          <div class="sign-off-label">أعدّه</div>
          ${wp.preparedBy ? `<div class="sign-off-name">${Utils.escapeHtml(wp.preparedBy)}</div>` : '<div style="color:var(--text-muted);font-size:12px;">—</div>'}
          ${wp.prepDate ? `<div class="sign-off-date">${Utils.formatDate(wp.prepDate)}</div>` : ''}
        </div>
        <div class="sign-off-box ${wp.reviewedBy?'signed':''}">
          <div class="sign-off-label">راجعه</div>
          ${wp.reviewedBy ? `<div class="sign-off-name">${Utils.escapeHtml(wp.reviewedBy)}</div>` : '<div style="color:var(--text-muted);font-size:12px;">لم تتم المراجعة</div>'}
          ${wp.revDate ? `<div class="sign-off-date">${Utils.formatDate(wp.revDate)}</div>` : ''}
        </div>
        <div class="sign-off-box ${wp.signedOff?'signed':''}">
          <div class="sign-off-label">الاعتماد</div>
          ${wp.signedOff ? '<div class="sign-off-name">✓ معتمد</div>' : '<div style="color:var(--text-muted);font-size:12px;">لم يُعتمد</div>'}
        </div>
      </div>

      ${wp.notes ? `<div class="info-box mt-4"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><span>${Utils.escapeHtml(wp.notes)}</span></div>` : ''}
      ${wp.crossRefs ? `<div class="mt-4"><span class="form-label">الإحالات المرجعية: </span>${wp.crossRefs.split(',').map(r=>`<span class="wp-ref" style="margin-left:4px;">${Utils.escapeHtml(r.trim())}</span>`).join('')}</div>` : ''}
      <div class="mt-4">${AttachmentsModule.placeholder('workpaper', wp.id)}</div>
    `;

    Utils.openModal(wp.title || 'ورقة العمل', body, `
      <button class="btn btn-secondary" onclick="WorkpapersModule.openEditModal(${id});Utils.closeModal()">تعديل</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إغلاق</button>
    `, 'lg');
    AttachmentsModule.refreshSection('workpaper', wp.id, wp.clientId, wp.title || wp.reference);
  }

  /* ---- Delete WP ---- */
  async function deleteWP(id) {
    if (Utils.blockIfArchive()) return;
    Utils.confirmDialog('هل تريد حذف ورقة العمل هذه؟ سيتم حذف مرفقاتها أيضاً.', async () => {
      await AttachmentsModule.deleteAllFor('workpaper', id);
      await AuditDB.delete(AuditDB.STORES.WORKPAPERS, id);
      Utils.showToast('تم حذف ورقة العمل', 'success');
      renderWorkpapers();
    });
  }

  /* ---- Sign-off file modal ---- */
  async function openSignOffModal() {
    if (Utils.blockIfArchive()) return;
    const clientId = App.getActiveClientId();
    if (!clientId) return;
    const wps = await AuditDB.getByClientYear(AuditDB.STORES.WORKPAPERS, clientId, App.getActiveYear());
    const notSigned = wps.filter(w => !w.signedOff);

    const body = `
      <div class="info-box mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div>يوجد <strong>${notSigned.length}</strong> ورقة عمل لم تُعتمد من أصل ${wps.length}</div>
      </div>

      <div class="form-group">
        <label class="form-label">توقيع المراجع</label>
        <input class="form-control" id="so-auditor" type="text" placeholder="اسم المراجع الموقّع">
      </div>
      <div class="form-group">
        <label class="form-label">توقيع المدير</label>
        <input class="form-control" id="so-manager" type="text" placeholder="اسم مدير المراجعة الموقّع">
      </div>
      <div class="form-group">
        <label class="form-label">توقيع الشريك</label>
        <input class="form-control" id="so-partner" type="text" placeholder="اسم الشريك الموقّع">
      </div>
      <div class="form-group">
        <label class="form-label">تاريخ الاعتماد</label>
        <input class="form-control" id="so-date" type="date" value="${Utils.today()}">
      </div>
      <div class="form-group">
        <label class="form-label">ملاحظات الاعتماد</label>
        <textarea class="form-control" id="so-notes" rows="3" placeholder="أي ملاحظات عند الاعتماد..."></textarea>
      </div>
    `;

    Utils.openModal('Sign-Off ملف التكليف', body, `
      <button class="btn btn-primary" id="doSignOffBtn">اعتماد الملف</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
    `);

    document.getElementById('doSignOffBtn').addEventListener('click', async () => {
      const auditor = document.getElementById('so-auditor')?.value.trim();
      const manager = document.getElementById('so-manager')?.value.trim();
      const partner = document.getElementById('so-partner')?.value.trim();
      const date    = document.getElementById('so-date')?.value;
      const notes   = document.getElementById('so-notes')?.value.trim();

      // Sign all unsigned WPs
      for (const wp of notSigned) {
        await AuditDB.put(AuditDB.STORES.WORKPAPERS, {
          ...wp,
          signedOff:   true,
          signedBy:    auditor || 'المراجع',
          signedDate:  date,
          signOffNotes: notes
        });
      }

      // Log activity
      await AuditDB.logActivity(clientId, 'Sign-Off الملف',
        `تم اعتماد ${notSigned.length} ورقة عمل. الشريك: ${partner || '—'}`, 'success');

      Utils.showToast(`تم اعتماد ${notSigned.length} ورقة عمل`, 'success');
      Utils.closeModal();
      renderWorkpapers();
    });
  }

  /* ---- External Approval ---- */
  async function externalApproveModal(id) {
    if (Utils.blockIfArchive()) return;
    const wp = await AuditDB.get(AuditDB.STORES.WORKPAPERS, id);
    if (!wp) return;
    const ea = wp.externalApproval || {};

    const body = `
      <div class="info-box mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <div>يُسجَّل هنا اعتماد مراجع خارجي (مراجع الجودة، شريك ثانٍ) لهذه ورقة العمل. يمكنك طباعة نموذج الاعتماد ليوقعه المراجع الخارجي ثم تسجيل البيانات هنا.</div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">اسم المراجع الخارجي</label>
          <input class="form-control" id="ea-reviewer" type="text" value="${Utils.escapeHtml(ea.reviewer || '')}" placeholder="الاسم الكامل">
        </div>
        <div class="form-group">
          <label class="form-label">تاريخ الاعتماد</label>
          <input class="form-control" id="ea-date" type="date" value="${ea.date || Utils.today()}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">صفة المراجع الخارجي</label>
        <input class="form-control" id="ea-role" type="text" value="${Utils.escapeHtml(ea.role || '')}" placeholder="مراجع الجودة / الشريك المسؤول / المدير">
      </div>
      <div class="form-group">
        <label class="form-label">ملاحظات المراجع الخارجي</label>
        <textarea class="form-control textarea-auto" id="ea-notes" rows="3" placeholder="أي ملاحظات أو تحفظات...">${Utils.escapeHtml(ea.notes || '')}</textarea>
      </div>
      ${ea.reviewer ? `
        <div style="margin-top:8px;">
          <span class="badge badge-success">🔏 معتمد بواسطة ${Utils.escapeHtml(ea.reviewer)} في ${Utils.formatDate(ea.date)}</span>
          <button class="btn btn-text" style="color:var(--color-danger);font-size:12px;margin-right:8px;" onclick="WorkpapersModule.revokeExternalApproval(${id})">إلغاء الاعتماد</button>
        </div>
      ` : ''}
    `;

    Utils.openModal('الاعتماد الخارجي', body, `
      <button class="btn btn-primary" id="saveEABtn">💾 حفظ الاعتماد</button>
      <button class="btn btn-secondary" onclick="WorkpapersModule.printExternalApprovalForm(${id})">🖨️ طباعة نموذج الاعتماد</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إغلاق</button>
    `);

    document.getElementById('saveEABtn').onclick = async () => {
      const reviewer = document.getElementById('ea-reviewer').value.trim();
      if (!reviewer) { Utils.showToast('يرجى إدخال اسم المراجع الخارجي', 'error'); return; }
      const externalApproval = {
        reviewer,
        date:  document.getElementById('ea-date').value || Utils.today(),
        role:  document.getElementById('ea-role').value.trim(),
        notes: document.getElementById('ea-notes').value.trim()
      };
      await AuditDB.put(AuditDB.STORES.WORKPAPERS, { ...wp, externalApproval });
      await AuditTrailModule.log(wp.clientId, 'workpaper', id, 'approve', null, externalApproval);
      Utils.closeModal();
      Utils.showToast(`تم تسجيل اعتماد ${reviewer}`, 'success');
      renderWorkpapers();
    };
  }

  async function revokeExternalApproval(id) {
    Utils.confirmDialog('هل تريد إلغاء الاعتماد الخارجي؟', async () => {
      const wp = await AuditDB.get(AuditDB.STORES.WORKPAPERS, id);
      await AuditDB.put(AuditDB.STORES.WORKPAPERS, { ...wp, externalApproval: null });
      Utils.closeModal();
      Utils.showToast('تم إلغاء الاعتماد الخارجي', 'success');
      renderWorkpapers();
    });
  }

  async function printExternalApprovalForm(id) {
    const wp = await AuditDB.get(AuditDB.STORES.WORKPAPERS, id);
    if (!wp) return;
    const clientId = App.getActiveClientId();
    const client   = clientId ? await AuditDB.get(AuditDB.STORES.CLIENTS, clientId) : {};
    const firmName = await AuditDB.getSetting('firmName') || 'مكتب المراجعة والمحاسبة';
    const logo     = await AuditDB.getSetting('firmLogo') || '';

    const printWin = window.open('', '_blank', 'width=800,height=700');
    printWin.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><title>نموذج اعتماد ورقة العمل</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; direction: rtl; color:#333; }
  h2 { text-align:center; border-bottom:2px solid #1F8377; padding-bottom:10px; }
  table { width:100%; border-collapse:collapse; margin:20px 0; }
  td { padding:10px 12px; border:1px solid #ddd; }
  td:first-child { font-weight:bold; width:180px; background:#f8f9fa; }
  .sign-row { display:flex; gap:24px; margin-top:40px; }
  .sign-box { flex:1; border:1px solid #ccc; border-radius:8px; padding:20px; text-align:center; }
  .sign-label { font-size:13px; color:#666; margin-bottom:50px; font-weight:bold; }
  .sign-line { border-top:1px solid #333; margin-top:4px; padding-top:6px; font-size:11px; color:#999; }
  @media print { @page { size:A4; margin:20mm; } }
</style></head>
<body>
${logo ? `<div style="text-align:center;margin-bottom:12px;"><img src="${logo}" style="max-height:70px;"></div>` : ''}
<h2>${Utils.escapeHtml(firmName)}</h2>
<h3 style="text-align:center;color:#555;margin-bottom:20px;">نموذج اعتماد ورقة العمل</h3>
<table>
  <tr><td>العميل</td><td>${Utils.escapeHtml(client?.name||'—')}</td></tr>
  <tr><td>السنة المالية</td><td>${Utils.escapeHtml(client?.financialYear||'—')}</td></tr>
  <tr><td>مرجع ورقة العمل</td><td>${Utils.escapeHtml(wp.reference||'—')}</td></tr>
  <tr><td>عنوان ورقة العمل</td><td>${Utils.escapeHtml(wp.title||'—')}</td></tr>
  <tr><td>الفئة / البند</td><td>${Utils.escapeHtml(wp.category||'—')}</td></tr>
  <tr><td>أُعدّت بواسطة</td><td>${Utils.escapeHtml(wp.preparedBy||'—')}</td></tr>
  <tr><td>تاريخ الإعداد</td><td>${Utils.formatDate(wp.prepDate)}</td></tr>
</table>
<div class="sign-row">
  <div class="sign-box">
    <div class="sign-label">أعدّه<br>Prepared By</div>
    <div>${Utils.escapeHtml(wp.preparedBy||'.....................')}</div>
    <div class="sign-line">التوقيع</div>
    <div class="sign-line">التاريخ: ${Utils.formatDate(wp.prepDate)||'.................'}</div>
  </div>
  <div class="sign-box">
    <div class="sign-label">راجعه<br>Reviewed By</div>
    <div>${Utils.escapeHtml(wp.reviewedBy||'.....................')}</div>
    <div class="sign-line">التوقيع</div>
    <div class="sign-line">التاريخ: ${Utils.formatDate(wp.revDate)||'.................'}</div>
  </div>
  <div class="sign-box">
    <div class="sign-label">اعتمده خارجياً<br>External Approver</div>
    <div>................................................</div>
    <div class="sign-line">التوقيع</div>
    <div class="sign-line">التاريخ: ........................</div>
  </div>
</div>
<script>window.onload=()=>{window.print();}</script>
</body></html>`);
    printWin.document.close();
  }

  return {
    renderWorkpapers,
    filterWP,
    openAddModal,
    openEditModal,
    openViewModal,
    deleteWP,
    openSignOffModal,
    externalApproveModal,
    revokeExternalApproval,
    printExternalApprovalForm
  };
})();
