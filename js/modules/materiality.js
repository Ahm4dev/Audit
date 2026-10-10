/* ============================================================
   AuditPro - Materiality Module
   Full ISA 320 materiality calculation and management
   ============================================================ */

const MaterialityModule = (() => {

  const BENCHMARKS = {
    revenue:        { label: 'الإيرادات',        pctRange: [0.5, 1.0],  default: 1.0 },
    profitBeforeTax:{ label: 'الربح قبل الضريبة', pctRange: [5.0, 10.0], default: 7.5 },
    totalAssets:    { label: 'إجمالي الأصول',     pctRange: [0.5, 2.0],  default: 1.0 },
    equity:         { label: 'حقوق الملكية',      pctRange: [1.0, 5.0],  default: 2.0 },
    expenses:       { label: 'إجمالي المصروفات',  pctRange: [0.5, 1.5],  default: 1.0 }
  };

  /* عملة الملف النشط حالياً - تُحدَّث عند كل عرض لصفحة الأهمية النسبية */
  let activeCurrencyCode = Utils.DEFAULT_CURRENCY_CODE;

  /* ---- Render materiality page ---- */
  async function renderMateriality() {
    const container = document.getElementById('materialityContent');
    if (!container) return;

    const clientId = App.getActiveClientId();
    if (!clientId) {
      container.innerHTML = Utils.noClientWarning('احتساب الأهمية النسبية');
      return;
    }

    const client = await AuditDB.get(AuditDB.STORES.CLIENTS, clientId);
    activeCurrencyCode = client?.currency || Utils.DEFAULT_CURRENCY_CODE;
    const isArchive = App.isArchiveMode();
    const readOnly = App.isEditingBlocked();

    // Load existing materiality record (السنة المالية النشطة فقط - إصلاح خلل #8)
    const records = await AuditDB.getByClientYear(AuditDB.STORES.MATERIALITY, clientId, App.getActiveYear());
    const mat = records.length > 0 ? records[records.length - 1] : {};

    // إن جاء المستخدم من أداة استيراد ميزان المراجعة (CSV)، نعبئ القيمة المرسلة تلقائياً
    // - فقط إذا كانت مرسَلة لهذا العميل بالتحديد (إصلاح خلل #14: تسرّب القيمة لعميل آخر)
    const pendingBenchmark = await AuditDB.getSetting('pendingMaterialityBenchmark');
    if (!readOnly && pendingBenchmark && pendingBenchmark.clientId === clientId) {
      mat.benchmarkValue = pendingBenchmark.amount;
      await AuditDB.setSetting('pendingMaterialityBenchmark', null);
      Utils.showToast('تم تعبئة قيمة الأساس من ميزان المراجعة المستورد', 'info');
    }

    container.innerHTML = (isArchive ? Utils.archiveBanner(App.getActiveYear(), App.isArchiveEditUnlocked()) : '') + buildMaterialityHTML(mat, readOnly);
    attachMaterialityEvents(mat);
  }

  /* ---- Build HTML ---- */
  function buildMaterialityHTML(mat, readOnly = false) {
    const benchmarkOptions = Object.entries(BENCHMARKS).map(([k, v]) =>
      `<option value="${k}" ${mat.benchmark === k ? 'selected' : ''}>${v.label}</option>`
    ).join('');

    const selectedBenchmark = BENCHMARKS[mat.benchmark || 'revenue'];

    return `
      <div ${readOnly ? 'style="pointer-events:none;opacity:.75;"' : ''}>
      <!-- ISA reference info -->
      <div class="info-box mb-6">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div>
          <strong>ISA 320 - الأهمية النسبية في التخطيط والتنفيذ</strong><br>
          <span style="font-size:13px;">تُستخدم الأهمية النسبية لتوجيه طبيعة ونطاق وتوقيت إجراءات المراجعة وتقييم أثر التحريفات.</span>
        </div>
      </div>

      <div class="grid grid-2" style="gap:24px;align-items:start;">

        <!-- Left column: inputs -->
        <div>
          <div class="card mb-4">
            <div class="card-header">
              <div class="card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                مدخلات الأهمية النسبية
              </div>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label required">أساس الاحتساب (Benchmark)</label>
                <select class="form-control" id="mat-benchmark" onchange="MaterialityModule.onBenchmarkChange()">
                  ${benchmarkOptions}
                </select>
                <div class="form-helper" id="mat-benchmark-hint">
                  النطاق المعتاد: ${selectedBenchmark.pctRange[0]}% — ${selectedBenchmark.pctRange[1]}%
                </div>
              </div>

              <div class="form-group">
                <label class="form-label required">قيمة الأساس المختار (بـ ${Utils.escapeHtml(Utils.currencyLabel(activeCurrencyCode))})</label>
                <input class="form-control" id="mat-benchmarkValue" type="number" min="0"
                  value="${mat.benchmarkValue || ''}" placeholder="أدخل المبلغ"
                  oninput="MaterialityModule.recalculate()">
              </div>

              <div class="form-group">
                <label class="form-label">نسبة الأهمية النسبية الإجمالية (%)</label>
                <div class="range-slider-wrap">
                  <input type="range" class="range-slider" id="mat-overallPct"
                    min="0.1" max="15" step="0.1"
                    value="${mat.overallPct || selectedBenchmark.default}"
                    oninput="document.getElementById('mat-overallPctVal').textContent=this.value+'%';MaterialityModule.recalculate()">
                  <div class="range-value" id="mat-overallPctVal">${mat.overallPct || selectedBenchmark.default}%</div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">نسبة أهمية الأداء من الإجمالية (%)</label>
                <div class="range-slider-wrap">
                  <input type="range" class="range-slider" id="mat-performancePct"
                    min="50" max="90" step="5"
                    value="${mat.performancePct || 75}"
                    oninput="document.getElementById('mat-performancePctVal').textContent=this.value+'%';MaterialityModule.recalculate()">
                  <div class="range-value" id="mat-performancePctVal">${mat.performancePct || 75}%</div>
                </div>
                <div class="form-helper">المعتاد: 50%-90% من الأهمية النسبية الإجمالية</div>
              </div>

              <div class="form-group">
                <label class="form-label">نسبة الحد الواضح للتفاهة (Clearly Trivial %)</label>
                <div class="range-slider-wrap">
                  <input type="range" class="range-slider" id="mat-trivialPct"
                    min="1" max="10" step="1"
                    value="${mat.trivialPct || 5}"
                    oninput="document.getElementById('mat-trivialPctVal').textContent=this.value+'%';MaterialityModule.recalculate()">
                  <div class="range-value" id="mat-trivialPctVal">${mat.trivialPct || 5}%</div>
                </div>
                <div class="form-helper">عادةً 5% من الأهمية النسبية الإجمالية</div>
              </div>
            </div>
          </div>

          <!-- Specific materiality -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">أهمية نسبية خاصة (Specific Materiality)</div>
            </div>
            <div class="card-body">
              <div class="info-box mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span>تُطبق على بنود بعينها ذات مخاطر مرتفعة أو حساسية خاصة (مثل معاملات الأطراف ذات العلاقة، مكافآت الإدارة)</span>
              </div>
              <div class="form-group">
                <label class="form-label">مبلغ الأهمية النسبية الخاصة</label>
                <input class="form-control" id="mat-specificMat" type="number" min="0"
                  value="${mat.specificMat || ''}" placeholder="اختياري"
                  oninput="MaterialityModule.recalculate()">
              </div>
              <div class="form-group">
                <label class="form-label">مبرر الأهمية النسبية الخاصة</label>
                <textarea class="form-control" id="mat-specificReason" rows="3"
                  placeholder="وصف البنود التي تنطبق عليها والسبب">${Utils.escapeHtml(mat.specificReason || '')}</textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Right column: results -->
        <div>
          <!-- Main result card -->
          <div class="materiality-result mb-4" id="mat-result-card">
            <div class="materiality-result-label">الأهمية النسبية الإجمالية</div>
            <div class="materiality-result-value" id="mat-overall-display">${mat.overallMat ? Utils.formatCurrency(mat.overallMat, Utils.currencySymbol(activeCurrencyCode)) : '—'}</div>
            <div class="materiality-result-label" id="mat-benchmark-display">
              ${mat.benchmark ? `${BENCHMARKS[mat.benchmark]?.label || ''} × ${mat.overallPct || '—'}%` : 'اختر الأساس وأدخل القيمة'}
            </div>
          </div>

          <!-- Breakdown -->
          <div class="materiality-breakdown mb-4" id="mat-breakdown">
            <div class="materiality-item">
              <div class="materiality-item-value" id="mat-overall-val">${mat.overallMat ? Utils.formatNumber(mat.overallMat) : '—'}</div>
              <div class="materiality-item-label">الأهمية النسبية الإجمالية<br><small>Overall Materiality</small></div>
            </div>
            <div class="materiality-item">
              <div class="materiality-item-value" id="mat-performance-val">${mat.performanceMat ? Utils.formatNumber(mat.performanceMat) : '—'}</div>
              <div class="materiality-item-label">أهمية الأداء<br><small>Performance Materiality</small></div>
            </div>
            <div class="materiality-item">
              <div class="materiality-item-value" id="mat-specific-val">${mat.specificMat ? Utils.formatNumber(mat.specificMat) : '—'}</div>
              <div class="materiality-item-label">الأهمية النسبية الخاصة<br><small>Specific Materiality</small></div>
            </div>
            <div class="materiality-item">
              <div class="materiality-item-value" id="mat-trivial-val">${mat.trivialMat ? Utils.formatNumber(mat.trivialMat) : '—'}</div>
              <div class="materiality-item-label">الحد الواضح للتفاهة<br><small>Clearly Trivial</small></div>
            </div>
          </div>

          <!-- Explanation card -->
          <div class="card mb-4">
            <div class="card-header"><div class="card-title">شرح مستويات الأهمية النسبية</div></div>
            <div class="card-body">
              <table style="width:100%;font-size:13px;border-collapse:collapse;">
                <thead>
                  <tr style="background:var(--bg-surface-2);">
                    <th style="padding:8px;text-align:right;border-bottom:1px solid var(--border-color);">المستوى</th>
                    <th style="padding:8px;text-align:center;border-bottom:1px solid var(--border-color);">المبلغ</th>
                    <th style="padding:8px;text-align:right;border-bottom:1px solid var(--border-color);">الاستخدام</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding:8px;border-bottom:1px solid var(--border-color);font-weight:600;">Overall Materiality</td>
                    <td style="padding:8px;border-bottom:1px solid var(--border-color);text-align:center;" id="exp-overall">—</td>
                    <td style="padding:8px;border-bottom:1px solid var(--border-color);color:var(--text-secondary);">الحد الأعلى - لتقييم التحريفات غير المصححة</td>
                  </tr>
                  <tr>
                    <td style="padding:8px;border-bottom:1px solid var(--border-color);font-weight:600;">Performance Materiality</td>
                    <td style="padding:8px;border-bottom:1px solid var(--border-color);text-align:center;" id="exp-performance">—</td>
                    <td style="padding:8px;border-bottom:1px solid var(--border-color);color:var(--text-secondary);">لتصميم إجراءات المراجعة وتحديد العينات</td>
                  </tr>
                  <tr>
                    <td style="padding:8px;border-bottom:1px solid var(--border-color);font-weight:600;">Specific Materiality</td>
                    <td style="padding:8px;border-bottom:1px solid var(--border-color);text-align:center;" id="exp-specific">—</td>
                    <td style="padding:8px;border-bottom:1px solid var(--border-color);color:var(--text-secondary);">للبنود الحساسة ذات المخاطر الخاصة</td>
                  </tr>
                  <tr>
                    <td style="padding:8px;font-weight:600;">Clearly Trivial</td>
                    <td style="padding:8px;text-align:center;" id="exp-trivial">—</td>
                    <td style="padding:8px;color:var(--text-secondary);">التحريفات دون هذا الحد تُعدّ غير ذات أهمية</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Notes -->
          <div class="form-group">
            <label class="form-label">مسوّغات ومبررات الأهمية النسبية</label>
            <textarea class="form-control" id="mat-notes" rows="4"
              placeholder="وثّق أسباب اختيارك للأساس والنسبة المستخدمة">${Utils.escapeHtml(mat.notes || '')}</textarea>
          </div>

          <!-- Action buttons -->
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="MaterialityModule.saveMateriality()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>
              حفظ الأهمية النسبية
            </button>
            <button class="btn btn-secondary" onclick="MaterialityModule.printMateriality()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              طباعة ورقة الأهمية النسبية
            </button>
          </div>
        </div>
      </div>
      </div>
    `;
  }

  /* ---- Attach events ---- */
  function attachMaterialityEvents(mat) {
    // Initial calculation if data exists
    if (mat.benchmarkValue) {
      setTimeout(recalculate, 100);
    }
  }

  /* ---- On benchmark change: update hint & recalculate ---- */
  function onBenchmarkChange() {
    const benchmark = document.getElementById('mat-benchmark')?.value;
    const bm = BENCHMARKS[benchmark];
    if (!bm) return;

    const hint = document.getElementById('mat-benchmark-hint');
    if (hint) hint.textContent = `النطاق المعتاد: ${bm.pctRange[0]}% — ${bm.pctRange[1]}%`;

    const slider = document.getElementById('mat-overallPct');
    if (slider) {
      slider.value = bm.default;
      document.getElementById('mat-overallPctVal').textContent = bm.default + '%';
    }

    recalculate();
  }

  /* ---- Recalculate materiality ---- */
  function recalculate() {
    const benchmarkValue = parseFloat(document.getElementById('mat-benchmarkValue')?.value) || 0;
    const overallPct     = parseFloat(document.getElementById('mat-overallPct')?.value) || 0;
    const performancePct = parseFloat(document.getElementById('mat-performancePct')?.value) || 75;
    const trivialPct     = parseFloat(document.getElementById('mat-trivialPct')?.value) || 5;
    const specificMat    = parseFloat(document.getElementById('mat-specificMat')?.value) || 0;
    const benchmark      = document.getElementById('mat-benchmark')?.value || 'revenue';

    if (!benchmarkValue || !overallPct) {
      clearDisplays();
      return;
    }

    const overallMat    = Math.round((benchmarkValue * overallPct) / 100);
    const performanceMat = Math.round((overallMat * performancePct) / 100);
    const trivialMat    = Math.round((overallMat * trivialPct) / 100);

    // Update displays
    const currency = Utils.currencySymbol(activeCurrencyCode);
    const fmt = n => Utils.formatNumber(n);

    updateEl('mat-overall-display',  Utils.formatCurrency(overallMat, currency));
    updateEl('mat-benchmark-display', `${BENCHMARKS[benchmark]?.label || ''} × ${overallPct}%`);

    updateEl('mat-overall-val',     fmt(overallMat));
    updateEl('mat-performance-val', fmt(performanceMat));
    updateEl('mat-specific-val',    specificMat ? fmt(specificMat) : '—');
    updateEl('mat-trivial-val',     fmt(trivialMat));

    updateEl('exp-overall',     fmt(overallMat));
    updateEl('exp-performance', fmt(performanceMat));
    updateEl('exp-specific',    specificMat ? fmt(specificMat) : '—');
    updateEl('exp-trivial',     fmt(trivialMat));
  }

  function clearDisplays() {
    ['mat-overall-display','mat-overall-val','mat-performance-val',
     'mat-specific-val','mat-trivial-val',
     'exp-overall','exp-performance','exp-specific','exp-trivial'
    ].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '—'; });

    const bd = document.getElementById('mat-benchmark-display');
    if (bd) bd.textContent = 'اختر الأساس وأدخل القيمة';
  }

  function updateEl(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /* ---- Save materiality ---- */
  async function saveMateriality() {
    if (Utils.blockIfArchive()) return;
    const clientId = App.getActiveClientId();
    if (!clientId) { Utils.showToast('يجب اختيار عميل', 'error'); return; }

    const benchmarkValue = parseFloat(document.getElementById('mat-benchmarkValue')?.value) || 0;
    const overallPct     = parseFloat(document.getElementById('mat-overallPct')?.value) || 0;
    const performancePct = parseFloat(document.getElementById('mat-performancePct')?.value) || 75;
    const trivialPct     = parseFloat(document.getElementById('mat-trivialPct')?.value) || 5;
    const specificMat    = parseFloat(document.getElementById('mat-specificMat')?.value) || 0;
    const benchmark      = document.getElementById('mat-benchmark')?.value || 'revenue';
    const specificReason = document.getElementById('mat-specificReason')?.value.trim() || '';
    const notes          = document.getElementById('mat-notes')?.value.trim() || '';

    if (!benchmarkValue) { Utils.showToast('يجب إدخال قيمة الأساس', 'error'); return; }

    const overallMat     = Math.round((benchmarkValue * overallPct) / 100);
    const performanceMat = Math.round((overallMat * performancePct) / 100);
    const trivialMat     = Math.round((overallMat * trivialPct) / 100);

    const record = {
      clientId, benchmark, benchmarkValue, overallPct, performancePct, trivialPct,
      overallMat, performanceMat, trivialMat,
      specificMat: specificMat || null,
      specificReason, notes,
      calculatedAt: new Date().toISOString()
    };

    try {
      const existing = await AuditDB.getByClientYear(AuditDB.STORES.MATERIALITY, clientId, App.getActiveYear());
      if (existing.length > 0) {
        const latest = existing[existing.length - 1];
        await AuditDB.put(AuditDB.STORES.MATERIALITY, { ...latest, ...record });
      } else {
        await AuditDB.add(AuditDB.STORES.MATERIALITY, record);
      }
      await AuditDB.logActivity(clientId, 'احتساب الأهمية النسبية',
        `تم احتساب الأهمية النسبية: ${Utils.formatNumber(overallMat)} ${Utils.currencyLabel(activeCurrencyCode)}`, 'info');
      Utils.showToast('تم حفظ الأهمية النسبية', 'success');
    } catch(err) {
      Utils.showToast('خطأ في الحفظ', 'error');
      console.error(err);
    }
  }

  /* ---- Print ---- */
  function printMateriality() { window.print(); }

  /* ---- Get materiality for client (for reports/dashboard) ---- */
  async function getMaterialityForClient(clientId, fiscalYear = null) {
    let fy = fiscalYear;
    if (!fy) {
      const client = await AuditDB.get(AuditDB.STORES.CLIENTS, clientId);
      fy = client?.financialYear || null;
    }
    const records = await AuditDB.getByClientYear(AuditDB.STORES.MATERIALITY, clientId, fy);
    return records.length > 0 ? records[records.length - 1] : null;
  }

  return {
    renderMateriality,
    onBenchmarkChange,
    recalculate,
    saveMateriality,
    printMateriality,
    getMaterialityForClient,
    BENCHMARKS
  };
})();
