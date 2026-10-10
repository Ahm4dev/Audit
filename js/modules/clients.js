/* ============================================================
   AuditPro - Clients Module
   Full CRUD for client management
   ============================================================ */

const ClientsModule = (() => {

  let allClients = [];
  let filteredClients = [];

  /* ---- INDUSTRY options ---- */
  const INDUSTRIES = {
    wholesale:    'تجارة الجملة والتجزئة',
    construction: 'مقاولات وإنشاءات',
    healthcare:   'رعاية صحية',
    manufacturing:'تصنيع',
    financial:    'خدمات مالية',
    realestate:   'عقارات',
    technology:   'تقنية المعلومات',
    education:    'تعليم',
    hospitality:  'ضيافة وسياحة',
    energy:       'طاقة ومعادن',
    telecom:      'اتصالات',
    transport:    'نقل ولوجستيات',
    government:   'قطاع حكومي',
    nonprofit:    'منظمات غير ربحية',
    other:        'أخرى'
  };

  const ENTITY_SIZES = {
    micro:  'ميكرو (< 10 موظفين)',
    small:  'صغيرة (10-50 موظف)',
    medium: 'متوسطة (50-250 موظف)',
    large:  'كبيرة (> 250 موظف)',
    listed: 'شركة مدرجة'
  };

  /* ---- Load and render clients list ---- */
  async function loadClients() {
    allClients = await AuditDB.getAll(AuditDB.STORES.CLIENTS);
    allClients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    applyFilters();
  }

  function applyFilters() {
    const search     = (document.getElementById('clientSearch')?.value || '').toLowerCase();
    const riskFilter = document.getElementById('clientRiskFilter')?.value || '';
    const statFilter = document.getElementById('clientStatusFilter')?.value || '';

    filteredClients = allClients.filter(c => {
      const matchSearch = !search ||
        (c.name       || '').toLowerCase().includes(search) ||
        (c.fileNumber || '').toLowerCase().includes(search) ||
        (c.activity   || '').toLowerCase().includes(search);
      const matchRisk   = !riskFilter || c.riskLevel === riskFilter;
      const matchStatus = !statFilter || c.status    === statFilter;
      return matchSearch && matchRisk && matchStatus;
    });

    renderClientsTable();
  }

  function renderClientsTable() {
    const container = document.getElementById('clientsTable');
    if (!container) return;

    if (filteredClients.length === 0) {
      container.innerHTML = Utils.emptyStateHTML(
        'لا توجد عملاء',
        allClients.length === 0
          ? 'ابدأ بإضافة عميل جديد لإنشاء ملف مراجعة'
          : 'لا توجد نتائج تطابق معايير البحث',
        allClients.length === 0 ? 'إضافة عميل جديد' : '',
        allClients.length === 0 ? 'ClientsModule.openAddModal()' : ''
      );
      return;
    }

    const rows = filteredClients.map(c => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="client-avatar" style="width:36px;height:36px;font-size:14px;border-radius:8px;">
              ${Utils.initials(c.name)}
            </div>
            <div>
              <div class="font-semi">${Utils.escapeHtml(c.name)}</div>
              <div class="text-xs text-muted" style="font-family:monospace;">${Utils.escapeHtml(c.fileNumber || '—')}</div>
            </div>
          </div>
        </td>
        <td>${Utils.escapeHtml(c.financialYear || '—')} <span class="chip">${Utils.escapeHtml(c.currency || Utils.DEFAULT_CURRENCY_CODE)}</span></td>
        <td>${Utils.escapeHtml(c.activity ? Utils.truncate(c.activity, 30) : '—')}</td>
        <td>${Utils.riskBadge(c.riskLevel)}</td>
        <td>${Utils.statusBadge(c.status)}</td>
        <td>${Utils.escapeHtml(c.teamLead || '—')}</td>
        <td>${Utils.formatDate(c.engagementDate)}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-secondary" onclick="ClientsModule.selectClient(${c.id})" title="اختيار وعرض">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn btn-sm btn-secondary" onclick="ClientsModule.openEditModal(${c.id})" title="تعديل">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-sm btn-danger" onclick="ClientsModule.deleteClient(${c.id})" title="حذف">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>العميل</th>
            <th>السنة المالية</th>
            <th>النشاط</th>
            <th>مستوى المخاطر</th>
            <th>الحالة</th>
            <th>مسؤول التكليف</th>
            <th>تاريخ التكليف</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  /* ---- Client form HTML ---- */
  function clientFormHTML(client = {}) {
    const industryOptions = Object.entries(INDUSTRIES)
      .map(([v, l]) => `<option value="${v}" ${client.industry === v ? 'selected' : ''}>${l}</option>`)
      .join('');
    const sizeOptions = Object.entries(ENTITY_SIZES)
      .map(([v, l]) => `<option value="${v}" ${client.entitySize === v ? 'selected' : ''}>${l}</option>`)
      .join('');
    const currencyOptions = Object.values(Utils.CURRENCIES)
      .map(c => `<option value="${c.code}" ${(client.currency || Utils.DEFAULT_CURRENCY_CODE) === c.code ? 'selected' : ''}>${c.label} (${c.code})</option>`)
      .join('');

    return `
      <div class="tabs" id="clientFormTabs">
        <button class="tab-btn active" data-tab="tab-basic">البيانات الأساسية</button>
        <button class="tab-btn" data-tab="tab-team">فريق المراجعة</button>
        <button class="tab-btn" data-tab="tab-dates">التواريخ</button>
        <button class="tab-btn" data-tab="tab-notes">ملاحظات</button>
      </div>
      <div id="clientFormPanels">

        <!-- Basic info tab -->
        <div class="tab-panel active" id="tab-basic">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">اسم العميل</label>
              <input class="form-control" id="cf-name" type="text" value="${Utils.escapeHtml(client.name || '')}" placeholder="الاسم الكامل للشركة / المنشأة" required>
            </div>
            <div class="form-group">
              <label class="form-label required">رقم الملف</label>
              <input class="form-control" id="cf-fileNumber" type="text" value="${Utils.escapeHtml(client.fileNumber || '')}" placeholder="AF-2024-001">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">السنة المالية</label>
              <input class="form-control" id="cf-financialYear" type="text" value="${Utils.escapeHtml(client.financialYear || new Date().getFullYear().toString())}" placeholder="2024">
            </div>
            <div class="form-group">
              <label class="form-label">القطاع / النشاط</label>
              <select class="form-control" id="cf-industry">${industryOptions}</select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">وصف النشاط</label>
              <input class="form-control" id="cf-activity" type="text" value="${Utils.escapeHtml(client.activity || '')}" placeholder="وصف مختصر لنشاط المنشأة">
            </div>
            <div class="form-group">
              <label class="form-label required">عملة هذا الملف</label>
              <select class="form-control" id="cf-currency">${currencyOptions}</select>
              <div class="form-helper">تُستخدم هذه العملة في جميع المبالغ المالية الخاصة بملف هذا العميل فقط</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">العنوان</label>
            <input class="form-control" id="cf-address" type="text" value="${Utils.escapeHtml(client.address || '')}" placeholder="المدينة - الحي - الشارع">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">الرقم الضريبي</label>
              <input class="form-control" id="cf-taxNumber" type="text" value="${Utils.escapeHtml(client.taxNumber || '')}" placeholder="300000000000003">
            </div>
            <div class="form-group">
              <label class="form-label">رقم السجل التجاري</label>
              <input class="form-control" id="cf-commercialReg" type="text" value="${Utils.escapeHtml(client.commercialReg || '')}" placeholder="1010000000">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">مستوى المخاطر</label>
              <select class="form-control" id="cf-riskLevel">
                <option value="low"    ${client.riskLevel === 'low'    ? 'selected' : ''}>منخفض</option>
                <option value="medium" ${client.riskLevel === 'medium' ? 'selected' : ''}>متوسط</option>
                <option value="high"   ${client.riskLevel === 'high'   ? 'selected' : ''}>مرتفع</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">حالة التكليف</label>
              <select class="form-control" id="cf-status">
                <option value="active"    ${client.status === 'active'    ? 'selected' : ''}>نشط</option>
                <option value="pending"   ${client.status === 'pending'   ? 'selected' : ''}>معلق</option>
                <option value="completed" ${client.status === 'completed' ? 'selected' : ''}>مكتمل</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">حجم المنشأة</label>
              <select class="form-control" id="cf-entitySize">${sizeOptions}</select>
            </div>
            <div class="form-group">
              <label class="form-label">شخص الاتصال</label>
              <input class="form-control" id="cf-contactPerson" type="text" value="${Utils.escapeHtml(client.contactPerson || '')}" placeholder="الاسم ودوره في الشركة">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">رقم الهاتف</label>
              <input class="form-control" id="cf-phone" type="tel" value="${Utils.escapeHtml(client.phone || '')}" placeholder="0114561234">
            </div>
            <div class="form-group">
              <label class="form-label">البريد الإلكتروني</label>
              <input class="form-control" id="cf-email" type="email" value="${Utils.escapeHtml(client.email || '')}" placeholder="info@company.com">
            </div>
          </div>
        </div>

        <!-- Team tab -->
        <div class="tab-panel" id="tab-team">
          <div class="info-box mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>يُرجى تحديد أعضاء فريق المراجعة وأدوارهم للتأكد من متطلبات الاستقلالية</span>
          </div>
          <div class="form-group">
            <label class="form-label required">مسؤول التكليف / الشريك</label>
            <input class="form-control" id="cf-teamLead" type="text" value="${Utils.escapeHtml(client.teamLead || '')}" placeholder="اسم الشريك المسؤول عن التكليف">
          </div>
          <div class="form-group">
            <label class="form-label">مدير المراجعة</label>
            <input class="form-control" id="cf-manager" type="text" value="${Utils.escapeHtml(client.manager || '')}" placeholder="اسم مدير المراجعة">
          </div>
          <div class="form-group">
            <label class="form-label">أعضاء الفريق</label>
            <textarea class="form-control textarea-auto" id="cf-teamMembers" placeholder="أسماء أعضاء فريق المراجعة (يفصل بينهم فاصلة أو سطر جديد)">${Utils.escapeHtml(client.teamMembers || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">مراجع الجودة (QCR)</label>
            <input class="form-control" id="cf-qualityReviewer" type="text" value="${Utils.escapeHtml(client.qualityReviewer || '')}" placeholder="اسم مراجع ضمان الجودة">
          </div>
        </div>

        <!-- Dates tab -->
        <div class="tab-panel" id="tab-dates">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">تاريخ قبول التكليف</label>
              <input class="form-control" id="cf-engagementDate" type="date" value="${client.engagementDate || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">تاريخ ميزانية العميل</label>
              <input class="form-control" id="cf-balanceSheetDate" type="date" value="${client.balanceSheetDate || ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">تاريخ التقرير المستهدف</label>
              <input class="form-control" id="cf-reportDate" type="date" value="${client.reportDate || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">تاريخ بدء الفحص الميداني</label>
              <input class="form-control" id="cf-fieldworkStart" type="date" value="${client.fieldworkStart || ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">تاريخ انتهاء الفحص الميداني</label>
              <input class="form-control" id="cf-fieldworkEnd" type="date" value="${client.fieldworkEnd || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">تاريخ إصدار التقرير</label>
              <input class="form-control" id="cf-reportIssuedDate" type="date" value="${client.reportIssuedDate || ''}">
            </div>
          </div>
        </div>

        <!-- Notes tab -->
        <div class="tab-panel" id="tab-notes">
          <div class="form-group">
            <label class="form-label">ملاحظات عامة</label>
            <textarea class="form-control textarea-auto" id="cf-notes" rows="5" placeholder="أي ملاحظات عامة عن العميل أو طبيعة التكليف">${Utils.escapeHtml(client.notes || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">متطلبات خاصة</label>
            <textarea class="form-control textarea-auto" id="cf-specialRequirements" rows="3" placeholder="أي متطلبات خاصة أو قيود">${Utils.escapeHtml(client.specialRequirements || '')}</textarea>
          </div>
        </div>
      </div>
    `;
  }

  /* ---- Setup tabs inside modal ---- */
  function setupModalTabs() {
    setTimeout(() => {
      const tabsEl   = document.getElementById('clientFormTabs');
      const panelsEl = document.getElementById('clientFormPanels');
      if (!tabsEl || !panelsEl) return;
      tabsEl.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => Utils.switchTab(tabsEl, panelsEl, btn.dataset.tab));
      });
    }, 50);
  }

  /* ---- Collect form data ---- */
  function collectFormData() {
    return {
      name:               (document.getElementById('cf-name')?.value || '').trim(),
      fileNumber:         (document.getElementById('cf-fileNumber')?.value || '').trim(),
      financialYear:      (document.getElementById('cf-financialYear')?.value || '').trim(),
      industry:           document.getElementById('cf-industry')?.value || '',
      activity:           (document.getElementById('cf-activity')?.value || '').trim(),
      currency:           document.getElementById('cf-currency')?.value || Utils.DEFAULT_CURRENCY_CODE,
      address:            (document.getElementById('cf-address')?.value || '').trim(),
      taxNumber:          (document.getElementById('cf-taxNumber')?.value || '').trim(),
      commercialReg:      (document.getElementById('cf-commercialReg')?.value || '').trim(),
      riskLevel:          document.getElementById('cf-riskLevel')?.value || 'medium',
      status:             document.getElementById('cf-status')?.value || 'active',
      entitySize:         document.getElementById('cf-entitySize')?.value || '',
      contactPerson:      (document.getElementById('cf-contactPerson')?.value || '').trim(),
      phone:              (document.getElementById('cf-phone')?.value || '').trim(),
      email:              (document.getElementById('cf-email')?.value || '').trim(),
      teamLead:           (document.getElementById('cf-teamLead')?.value || '').trim(),
      manager:            (document.getElementById('cf-manager')?.value || '').trim(),
      teamMembers:        (document.getElementById('cf-teamMembers')?.value || '').trim(),
      qualityReviewer:    (document.getElementById('cf-qualityReviewer')?.value || '').trim(),
      engagementDate:     document.getElementById('cf-engagementDate')?.value || '',
      balanceSheetDate:   document.getElementById('cf-balanceSheetDate')?.value || '',
      reportDate:         document.getElementById('cf-reportDate')?.value || '',
      fieldworkStart:     document.getElementById('cf-fieldworkStart')?.value || '',
      fieldworkEnd:       document.getElementById('cf-fieldworkEnd')?.value || '',
      reportIssuedDate:   document.getElementById('cf-reportIssuedDate')?.value || '',
      notes:              (document.getElementById('cf-notes')?.value || '').trim(),
      specialRequirements:(document.getElementById('cf-specialRequirements')?.value || '').trim()
    };
  }

  /* ---- Validate ---- */
  function validateForm(data) {
    if (!data.name)       { Utils.showToast('يجب إدخال اسم العميل', 'error'); return false; }
    if (!data.fileNumber) { Utils.showToast('يجب إدخال رقم الملف', 'error'); return false; }
    return true;
  }

  /* ---- Open add modal ---- */
  async function openAddModal() {
    const defaultCurrency = await AuditDB.getSetting('defaultCurrency') || Utils.DEFAULT_CURRENCY_CODE;
    const body = clientFormHTML({ currency: defaultCurrency });
    Utils.openModal('إضافة عميل جديد', body, `
      <button class="btn btn-primary" id="saveClientBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>
        حفظ العميل
      </button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
    `, 'lg');

    setupModalTabs();

    document.getElementById('saveClientBtn').addEventListener('click', async () => {
      const data = collectFormData();
      if (!validateForm(data)) return;
      try {
        const newId = await AuditDB.add(AuditDB.STORES.CLIENTS, data);
        await AuditDB.logActivity(newId, 'إنشاء ملف العميل', `تم إنشاء ملف العميل: ${data.name}`, 'success');
        Utils.showToast('تم إضافة العميل بنجاح', 'success');
        Utils.closeModal();
        await loadClients();
        App.refreshClientSelect();
      } catch(err) {
        if (err.name === 'ConstraintError') {
          Utils.showToast('رقم الملف مستخدم بالفعل', 'error');
        } else {
          Utils.showToast('حدث خطأ أثناء الحفظ', 'error');
          console.error(err);
        }
      }
    });
  }

  /* ---- Open edit modal ---- */
  async function openEditModal(id) {
    const client = await AuditDB.get(AuditDB.STORES.CLIENTS, id);
    if (!client) { Utils.showToast('العميل غير موجود', 'error'); return; }

    const body = clientFormHTML(client);
    Utils.openModal('تعديل بيانات العميل', body, `
      <button class="btn btn-primary" id="updateClientBtn">حفظ التعديلات</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
    `, 'lg');

    setupModalTabs();

    document.getElementById('updateClientBtn').addEventListener('click', async () => {
      const data = collectFormData();
      if (!validateForm(data)) return;
      try {
        await AuditDB.put(AuditDB.STORES.CLIENTS, { ...client, ...data });
        await AuditDB.logActivity(id, 'تعديل بيانات العميل', `تم تعديل بيانات: ${data.name}`, 'info');
        Utils.showToast('تم تحديث بيانات العميل', 'success');
        Utils.closeModal();
        await loadClients();
        App.refreshClientSelect();
        // update topbar if this is active client
        if (App.getActiveClientId() === id) App.updateActiveClientDisplay(data);
      } catch(err) {
        Utils.showToast('حدث خطأ أثناء الحفظ', 'error');
        console.error(err);
      }
    });
  }

  /* ---- Delete client ---- */
  async function deleteClient(id) {
    const client = await AuditDB.get(AuditDB.STORES.CLIENTS, id);
    if (!client) return;

    Utils.confirmDialog(
      `هل تريد حذف العميل "${client.name}"؟ سيتم حذف جميع بيانات المراجعة المرتبطة به (التخطيط، الأهمية النسبية، الإجراءات، أوراق العمل، الملاحظات، المخاطر، المراسلات، ومرفقاتها) بشكل نهائي.`,
      async () => {
        try {
          // إصلاح خلل #1: الحذف السابق كان يتجاهل RISKS و LETTERS و YEAR_DATA،
          // ولا يُنظّف مرفقات الإجراءات/أوراق العمل/الملاحظات الحقيقية، مما يترك
          // بيانات يتيمة يمكن أن "تتسرّب" لعميل جديد لاحقاً إذا أُعيد استخدام نفس المعرّف.
          const ATTACHMENT_OWNER_TYPE = {
            [AuditDB.STORES.PROCEDURES]: 'procedure',
            [AuditDB.STORES.WORKPAPERS]: 'workpaper',
            [AuditDB.STORES.FINDINGS]:   'finding'
          };

          for (const store of [AuditDB.STORES.PLANNING, AuditDB.STORES.MATERIALITY,
                                AuditDB.STORES.PROCEDURES, AuditDB.STORES.WORKPAPERS,
                                AuditDB.STORES.FINDINGS, AuditDB.STORES.RISKS,
                                AuditDB.STORES.LETTERS, AuditDB.STORES.YEAR_DATA,
                                AuditDB.STORES.GOING_CONCERN, AuditDB.STORES.COMPONENTS,
                                AuditDB.STORES.RELIANCE, AuditDB.STORES.QUALITY_REVIEW]) {
            const related = await AuditDB.getByIndex(store, 'clientId', id);
            const ownerType = ATTACHMENT_OWNER_TYPE[store];
            for (const r of related) {
              if (ownerType) await AttachmentsModule.deleteAllFor(ownerType, r.id);
              await AuditDB.delete(store, r.id);
            }
          }

          await AuditDB.delete(AuditDB.STORES.CLIENTS, id);
          Utils.showToast('تم حذف العميل وجميع بياناته', 'success');
          if (App.getActiveClientId() === id) App.setActiveClient(null);
          await loadClients();
          App.refreshClientSelect();
        } catch(err) {
          Utils.showToast('حدث خطأ أثناء الحذف', 'error');
          console.error(err);
        }
      }
    );
  }

  /* ---- Select client as active ---- */
  async function selectClient(id) {
    await App.setActiveClient(id);
    Utils.showToast('تم اختيار العميل', 'success');
  }

  /* ---- Get client stats for dashboard ---- */
  async function getClientStats(clientId) {
    const client = await AuditDB.get(AuditDB.STORES.CLIENTS, clientId);
    const fy = client?.financialYear;
    const [procedures, findings, workpapers] = await Promise.all([
      AuditDB.getByClientYear(AuditDB.STORES.PROCEDURES, clientId, fy),
      AuditDB.getByClientYear(AuditDB.STORES.FINDINGS,   clientId, fy),
      AuditDB.getByClientYear(AuditDB.STORES.WORKPAPERS,  clientId, fy)
    ]);

    const completed  = procedures.filter(p => p.status === 'completed').length;
    const exceptions = procedures.filter(p => p.status === 'exception').length;
    const openFindings = findings.filter(f => f.status === 'open').length;
    const highRiskFindings = findings.filter(f => f.severity === 'high' && f.status === 'open').length;
    const pct = procedures.length ? Math.round((completed / procedures.length) * 100) : 0;

    return {
      total:       procedures.length,
      completed,
      inProgress:  procedures.filter(p => p.status === 'in-progress').length,
      notStarted:  procedures.filter(p => p.status === 'not-started').length,
      exceptions,
      openFindings,
      highRiskFindings,
      workpapers:  workpapers.length,
      completionPct: pct
    };
  }

  /* ---- Init event listeners ---- */
  function init() {
    document.getElementById('addClientBtn')?.addEventListener('click', openAddModal);

    const searchInput = document.getElementById('clientSearch');
    if (searchInput) searchInput.addEventListener('input', Utils.debounce(applyFilters, 300));

    document.getElementById('clientRiskFilter')?.addEventListener('change', applyFilters);
    document.getElementById('clientStatusFilter')?.addEventListener('change', applyFilters);
  }

  /* ---- إصلاح خلل #8: بدء سنة مراجعة جديدة لعميل قائم ----
     يحدّث السنة المالية الحالية للعميل فقط؛ كل السجلات الجديدة
     (تخطيط/أهمية نسبية/إجراءات/أوراق عمل/ملاحظات/مخاطر) التي تُضاف
     بعد ذلك تُوسَم تلقائياً بالسنة الجديدة (عبر طبقة قاعدة البيانات)،
     بينما تبقى بيانات السنوات السابقة محفوظة كأرشيف يمكن استعراضه
     من مُبدِّل السنوات في الشريط العلوي. */
  function startNewEngagementYearPrompt(clientId) {
    AuditDB.get(AuditDB.STORES.CLIENTS, clientId).then(async client => {
      if (!client) return;
      const suggested = (parseInt(client.financialYear) || new Date().getFullYear() - 1) + 1;
      const oldYear = client.financialYear;

      // إحصاء ما يمكن ترحيله من السنة الحالية، لعرضه للمستخدم قبل الاختيار
      const [openRisks, understandingItems] = await Promise.all([
        AuditDB.getByClientYear(AuditDB.STORES.RISKS, clientId, oldYear).then(r => r.filter(x => x.status !== 'addressed')),
        AuditDB.getByClientYear(AuditDB.STORES.PLANNING, clientId, oldYear).then(p =>
          p.filter(x => ['understanding','internal_control','acceptance'].includes(PlanningModule.PLANNING_SECTIONS.find(s => s.items.some(i => i.id === x.item))?.id) && x.status === 'completed')
        )
      ]);

      const body = `
        <p class="text-sm mb-3">سيبدأ هذا إجراء سنة مراجعة جديدة للعميل <strong>${Utils.escapeHtml(client.name)}</strong>. ستبقى بيانات السنة الحالية (${Utils.escapeHtml(oldYear || '—')}) محفوظة كأرشيف يمكن استعراضه لاحقاً (قراءة فقط)، وستبدأ كل الإجراءات وأوراق العمل والملاحظات الجديدة فارغة تحت السنة الجديدة.</p>
        <div class="form-group">
          <label class="form-label required">السنة المالية الجديدة</label>
          <input class="form-control" id="newEngagementYearInput" type="text" value="${suggested}" placeholder="مثال: ${suggested}">
        </div>
        <div class="form-helper" id="newEngagementYearError" style="display:none;color:var(--color-danger);"></div>

        <div class="info-box mb-3" style="margin-top:12px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <div>ترحيل (Rollforward): يمكنك ترحيل بعض بيانات السنة الحالية كنقطة بداية قابلة للتحديث في السنة الجديدة، دون التأثير على نسختها الأرشيفية الأصلية.</div>
        </div>
        <label class="setting-row" style="cursor:pointer;">
          <input type="checkbox" id="rf-risks" ${openRisks.length ? 'checked' : 'disabled'}>
          <div class="setting-info">
            <div class="setting-name">ترحيل المخاطر غير المُعالجة (${openRisks.length})</div>
            <div class="setting-desc">نسخ المخاطر التي لم تُعالَج بعد من السنة الحالية كنقطة بداية في سجل مخاطر السنة الجديدة، مع الإشارة إلى أنها مُرحَّلة من العام السابق.</div>
          </div>
        </label>
        <label class="setting-row" style="cursor:pointer;">
          <input type="checkbox" id="rf-understanding" ${understandingItems.length ? 'checked' : 'disabled'}>
          <div class="setting-info">
            <div class="setting-name">ترحيل فهم المنشأة والرقابة الداخلية (${understandingItems.length} بند)</div>
            <div class="setting-desc">نسخ ملاحظات بنود "فهم المنشأة" و"الرقابة الداخلية" و"قبول/استمرار العميل" المكتملة كنقطة بداية، بحالة "جارٍ" تحتاج مراجعة وتحديث للسنة الجديدة (لا تُعتبر مكتملة تلقائياً).</div>
          </div>
        </label>
      `;
      const footer = `
        <button class="btn btn-primary" id="confirmNewYearBtn">بدء السنة الجديدة</button>
        <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
      `;
      Utils.openModal('بدء سنة مراجعة جديدة', body, footer, 'lg');

      document.getElementById('confirmNewYearBtn').onclick = async () => {
        const newYear = document.getElementById('newEngagementYearInput').value.trim();
        const errEl = document.getElementById('newEngagementYearError');
        if (!newYear || !/^\d{4}$/.test(newYear)) {
          errEl.textContent = 'أدخل سنة صحيحة من 4 أرقام';
          errEl.style.display = 'block';
          return;
        }
        if (newYear === String(client.financialYear)) {
          errEl.textContent = 'هذه هي السنة المالية الحالية فعلاً';
          errEl.style.display = 'block';
          return;
        }
        const doRollRisks = document.getElementById('rf-risks').checked;
        const doRollUnderstanding = document.getElementById('rf-understanding').checked;

        await AuditDB.put(AuditDB.STORES.CLIENTS, { ...client, financialYear: newYear });

        // الترحيل يتم بعد تحديث السنة الحالية للعميل، حتى يُوسَم كل سجل جديد بالسنة الصحيحة تلقائياً
        let rolledCount = 0;
        if (doRollRisks) {
          for (const r of openRisks) {
            const { id, createdAt, updatedAt, fiscalYear, ...rest } = r;
            await AuditDB.add(AuditDB.STORES.RISKS, { ...rest, rolledForwardFrom: oldYear });
            rolledCount++;
          }
        }
        if (doRollUnderstanding) {
          for (const p of understandingItems) {
            const { id, createdAt, updatedAt, fiscalYear, ...rest } = p;
            await AuditDB.add(AuditDB.STORES.PLANNING, {
              ...rest,
              status: 'in-progress',
              notes: (rest.notes ? rest.notes + '\n\n' : '') + `[مُرحَّل من سنة ${oldYear} — يحتاج مراجعة وتحديث]`,
              rolledForwardFrom: oldYear
            });
            rolledCount++;
          }
        }

        Utils.closeModal();
        Utils.showToast(`تم بدء سنة مراجعة جديدة (${newYear})${rolledCount ? ` مع ترحيل ${rolledCount} سجل كنقطة بداية` : ''}`, 'success');
        await loadClients();
        App.refreshClientSelect();
        if (App.getActiveClientId() === clientId) App.setActiveYear(newYear);
      };
    });
  }

  return {
    init,
    loadClients,
    openAddModal,
    openEditModal,
    deleteClient,
    selectClient,
    getClientStats,
    startNewEngagementYearPrompt,
    getAllClients: () => allClients
  };
})();
