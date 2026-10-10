/* ============================================================
   AuditPro - Audit Tools Module
   ------------------------------------------------------------
   حاسبة العينات الإحصائية (MUS + Attribute Sampling)
   واستيراد ميزان المراجعة من ملف CSV
   ============================================================ */

const ToolsModule = (() => {

  /* معاملات الموثوقية الشائعة (Zero expected error / Poisson approximation)
     مرجع: AICPA Audit Sampling Guide / Arens, Elder & Beasley - Auditing & Assurance Services */
  const RELIABILITY_FACTORS = { 90: 2.31, 95: 3.00, 99: 4.61 };

  /* ---- Render tools page ---- */
  async function renderTools() {
    const container = document.getElementById('toolsContent');
    if (!container) return;

    container.innerHTML = `
      <div class="tabs" id="toolsTabs">
        <button class="tab-btn active" data-tab="tool-mus">عينات نقدية (MUS)</button>
        <button class="tab-btn" data-tab="tool-attr">عينات اختبار الضوابط</button>
        <button class="tab-btn" data-tab="tool-csv">استيراد ميزان المراجعة (CSV)</button>
      </div>
      <div id="toolsPanels">
        <div class="tab-panel active" id="tool-mus">${musCalculatorHTML()}</div>
        <div class="tab-panel" id="tool-attr">${attributeCalculatorHTML()}</div>
        <div class="tab-panel" id="tool-csv">${csvImportHTML()}</div>
      </div>
    `;

    setupToolsTabs();
    recalcMUS();
    recalcAttribute();
  }

  function setupToolsTabs() {
    const tabsEl   = document.getElementById('toolsTabs');
    const panelsEl = document.getElementById('toolsPanels');
    if (!tabsEl || !panelsEl) return;
    tabsEl.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => Utils.switchTab(tabsEl, panelsEl, btn.dataset.tab));
    });
  }

  /* ============================================================
     MUS / Monetary Unit Sampling Calculator
     ============================================================ */
  function musCalculatorHTML() {
    return `
      <div class="card mb-5">
        <div class="card-header"><div class="card-title">1️⃣ تخطيط العينة — حجم العينة والفترة</div></div>
        <div class="card-body">
          <div class="info-box mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <div>أداة تخطيطية تقريبية لتحديد حجم العينة باستخدام معامل الموثوقية (Reliability Factor)، وليست بديلاً عن برمجيات أو جداول العينات الإحصائية المتخصصة.</div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">قيمة المجتمع (الرصيد الدفتري)</label>
              <input class="form-control" id="mus-population" type="number" min="0" value="1000000" oninput="ToolsModule.recalcMUS()">
            </div>
            <div class="form-group">
              <label class="form-label required">الأهمية النسبية لأداء العمل (Tolerable Misstatement)</label>
              <input class="form-control" id="mus-tolerable" type="number" min="1" value="50000" oninput="ToolsModule.recalcMUS()">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">مستوى الثقة المطلوب</label>
              <select class="form-control" id="mus-confidence" onchange="ToolsModule.recalcMUS()">
                <option value="90">90%</option>
                <option value="95" selected>95%</option>
                <option value="99">99%</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">خطأ متوقع (اختياري)</label>
              <input class="form-control" id="mus-expected" type="number" min="0" value="0" oninput="ToolsModule.recalcMUS()">
            </div>
          </div>
          <div id="mus-warning" class="info-box mb-4" style="display:none;background:var(--color-danger-light,#fef2f2);color:var(--color-danger);"></div>
          <div class="materiality-breakdown mt-4">
            <div class="materiality-item">
              <div class="materiality-item-value" id="mus-out-rf">—</div>
              <div class="materiality-item-label">معامل الموثوقية</div>
            </div>
            <div class="materiality-item">
              <div class="materiality-item-value" id="mus-out-interval">—</div>
              <div class="materiality-item-label">الفترة بين العينات<br><small>Sampling Interval</small></div>
            </div>
            <div class="materiality-item primary">
              <div class="materiality-item-value" id="mus-out-size">—</div>
              <div class="materiality-item-label">حجم العينة المقترح</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card mb-5">
        <div class="card-header"><div class="card-title">2️⃣ بيانات المجتمع الفعلية (اختياري، لكن يُوصى به)</div></div>
        <div class="card-body">
          <div class="info-box mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <div>الصق قائمة بنود المجتمع الفعلية (كل سطر: الوصف، ثم الرصيد، مفصولين بفاصلة) — مثل كشف أرصدة العملاء أو تفاصيل المخزون — ليطابق النظام كل نقطة اختيار تلقائياً بالبند الحقيقي المقابل بدل تحديده يدوياً. يمكن أيضاً سحب البيانات مباشرة من ملف CSV الذي استوردته في تبويب "استيراد ميزان المراجعة" إن كان مناسباً.</div>
          </div>
          <div class="form-group">
            <label class="form-label">بنود المجتمع (سطر لكل بند: الوصف, الرصيد)</label>
            <textarea class="form-control textarea-auto" id="mus-population-items" rows="5" placeholder="مثال:&#10;فاتورة 1001 - شركة النور, 45000&#10;فاتورة 1002 - مؤسسة الأمل, 12500&#10;..." oninput="ToolsModule.parseMUSPopulationItems()"></textarea>
          </div>
          <div id="mus-population-summary" class="text-xs text-muted"></div>
        </div>
      </div>

      <div class="card mb-5">
        <div class="card-header">
          <div class="card-title">3️⃣ اختيار وحدات العينة فعلياً (الاختيار المنتظم)</div>
          <button class="btn btn-primary btn-sm" onclick="ToolsModule.generateMUSSample()">توليد نقاط العينة</button>
        </div>
        <div class="card-body">
          <div class="text-sm text-muted mb-3">يُولِّد هذا القسم نقاط الاختيار الفعلية (Sampling Points) بطريقة الاختيار المنتظم بدءاً من نقطة عشوائية. إن أدخلت بيانات المجتمع أعلاه، سيُطابِق النظام كل نقطة تلقائياً بالبند الحقيقي المقابل لها؛ وإلا يمكنك تحديد البند يدوياً من دفاتر العميل.</div>
          <div id="mus-sample-points"></div>
        </div>
      </div>

      <div class="card mb-5">
        <div class="card-header">
          <div class="card-title">4️⃣ تقييم نتائج الفحص وإسقاط التحريف</div>
          <button class="btn btn-secondary btn-sm" onclick="ToolsModule.addMUSExceptionRow()">+ إضافة استثناء</button>
        </div>
        <div class="card-body">
          <div class="text-sm text-muted mb-3">أضف كل بند تم فحصه ووُجد به فرق بين الرصيد الدفتري والرصيد الفعلي (المؤكَّد)، وسيُسقِط النظام أثر هذا التحريف على المجتمع بالكامل تلقائياً وفق طريقة النسبة (Ratio Method) المُستخدَمة في تقييم عينات الوحدة النقدية.</div>
          <div id="mus-exceptions-table"></div>
          <div id="mus-evaluation-result" class="mt-4"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-body" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div class="text-sm text-muted">احفظ كامل تخطيط وتقييم هذه العينة (الحجم، نقاط الاختيار، الاستثناءات، الاستنتاج) كورقة عمل مرتبطة بالعميل النشط.</div>
          <button class="btn btn-accent" onclick="ToolsModule.saveMUSAsWorkpaper()">💾 حفظ كورقة عمل</button>
        </div>
      </div>
    `;
  }

  let musExceptions = []; // { bookValue, auditedValue }
  let musPopulationItems = []; // { label, balance, cumulativeStart, cumulativeEnd }

  /* تحليل بنود المجتمع الملصوقة (الوصف, الرصيد لكل سطر) واحتساب الأرصدة
     التراكمية لكل بند، تمهيداً لمطابقة نقاط الاختيار ببنود حقيقية تلقائياً */
  function parseMUSPopulationItems() {
    const raw = document.getElementById('mus-population-items')?.value || '';
    const summaryEl = document.getElementById('mus-population-summary');
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

    let cumulative = 0;
    musPopulationItems = [];
    let skipped = 0;
    lines.forEach(line => {
      const parts = line.split(',');
      if (parts.length < 2) { skipped++; return; }
      const balance = parseFloat(parts[parts.length - 1].replace(/[^\d.-]/g, ''));
      const label = parts.slice(0, -1).join(',').trim();
      if (!label || isNaN(balance) || balance <= 0) { skipped++; return; }
      const cumulativeStart = cumulative;
      cumulative += balance;
      musPopulationItems.push({ label, balance, cumulativeStart, cumulativeEnd: cumulative });
    });

    if (summaryEl) {
      if (musPopulationItems.length === 0) {
        summaryEl.textContent = raw.trim() ? 'تعذّر التعرّف على أي بند صالح — تأكد أن كل سطر بصيغة: الوصف, الرصيد' : '';
      } else {
        const pop = parseFloat(document.getElementById('mus-population')?.value) || 0;
        const mismatch = pop > 0 && Math.abs(cumulative - pop) > pop * 0.01;
        summaryEl.innerHTML = `تم التعرّف على <strong>${Utils.formatNumber(musPopulationItems.length)}</strong> بند بإجمالي رصيد <strong>${Utils.formatNumber(Math.round(cumulative))}</strong>${skipped > 0 ? ` (تم تجاهل ${skipped} سطر غير صالح)` : ''}.` +
          (mismatch ? `<br><span style="color:var(--color-warning);">⚠ هذا الإجمالي يختلف عن "قيمة المجتمع" المُدخَلة أعلاه (${Utils.formatNumber(pop)}) بأكثر من 1% — تأكد من صحة البيانات.</span>` : '');
      }
    }
  }

  /** إيجاد البند المقابل لنقطة اختيار مُعيَّنة عبر البحث في الأرصدة التراكمية */
  function findItemForPoint(point) {
    return musPopulationItems.find(it => point >= it.cumulativeStart && point < it.cumulativeEnd) || null;
  }

  function recalcMUS() {
    const pop = parseFloat(document.getElementById('mus-population')?.value) || 0;
    const tol = parseFloat(document.getElementById('mus-tolerable')?.value) || 0;
    const conf = parseInt(document.getElementById('mus-confidence')?.value) || 95;
    const expected = parseFloat(document.getElementById('mus-expected')?.value) || 0;

    const warningEl = document.getElementById('mus-warning');
    if (warningEl) {
      if (tol > 0 && expected >= tol) {
        warningEl.style.display = 'flex';
        warningEl.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>تنبيه: الخطأ المتوقع أكبر من أو يساوي الأهمية النسبية لأداء العمل، وهذا غير منطقي إحصائياً. النتيجة أدناه تقريبية فقط (تم فرض حد أدنى صناعي)، ويُنصح بمراجعة قيمتي "الأهمية النسبية" و"الخطأ المتوقع" قبل الاعتماد على حجم العينة.</div>`;
      } else {
        warningEl.style.display = 'none';
        warningEl.innerHTML = '';
      }
    }

    const rf = RELIABILITY_FACTORS[conf] || 3.0;
    const adjustedTolerable = Math.max(tol - expected, tol * 0.1); // لا تقل الفجوة عن 10% لتفادي قيم غير واقعية
    const interval = adjustedTolerable > 0 ? (adjustedTolerable / rf) : 0;
    const size = interval > 0 ? Math.ceil(pop / interval) : 0;

    setText('mus-out-rf', rf.toFixed(2));
    setText('mus-out-interval', interval > 0 ? Utils.formatNumber(Math.round(interval)) : '—');
    setText('mus-out-size', size > 0 ? Utils.formatNumber(size) + ' بند' : '—');

    // إعادة ضبط قسمي الاختيار والتقييم عند تغيير مدخلات التخطيط لتفادي بيانات غير متسقة
    const pointsEl = document.getElementById('mus-sample-points');
    if (pointsEl) pointsEl.innerHTML = '<div class="text-xs text-muted">اضغط "توليد نقاط العينة" لعرضها هنا بعد استقرار حجم العينة.</div>';
    musExceptions = [];
    renderMUSExceptionsTable();
  }

  /* ---- توليد نقاط الاختيار الفعلية بطريقة الاختيار المنتظم ---- */
  function generateMUSSample() {
    const pop = parseFloat(document.getElementById('mus-population')?.value) || 0;
    const interval = parseFloat(document.getElementById('mus-out-interval')?.textContent.replace(/[^\d.]/g, '')) || 0;
    const pointsEl = document.getElementById('mus-sample-points');
    if (!pointsEl) return;

    if (!interval || !pop) {
      pointsEl.innerHTML = `<div class="warning-box">يرجى إدخال قيمة المجتمع والتأكد من احتساب الفترة بين العينات أولاً.</div>`;
      return;
    }

    const size = Math.ceil(pop / interval);
    if (size > 1000) {
      pointsEl.innerHTML = `<div class="warning-box">حجم العينة كبير جداً (${Utils.formatNumber(size)} بند) لعرضه كنقاط فردية هنا. يُنصح بمراجعة معايير التخطيط (الأهمية النسبية/مستوى الثقة) لتقليل الحجم، أو استخدام برمجية عينات متخصصة لهذا الحجم.</div>`;
      return;
    }

    const randomStart = Math.round((Math.random() * interval) * 100) / 100;
    const points = [];
    for (let i = 0; i < size; i++) {
      points.push(Math.round((randomStart + i * interval) * 100) / 100);
    }

    const hasPopulationData = musPopulationItems.length > 0;

    pointsEl.innerHTML = `
      <div class="text-xs text-muted mb-2">نقطة البداية العشوائية: <strong>${Utils.formatNumber(randomStart)}</strong> — الفترة: <strong>${Utils.formatNumber(interval)}</strong> — إجمالي النقاط: <strong>${points.length}</strong></div>
      ${hasPopulationData ? `<div class="text-xs mb-2" style="color:var(--color-success);">✓ تمت مطابقة نقاط الاختيار تلقائياً ببنود المجتمع المُدخَلة. أدخل الرصيد الفعلي (المؤكَّد) بعد الفحص مباشرة، وسيُضاف تلقائياً لجدول الاستثناءات إن وُجد فرق.</div>` : ''}
      <div class="data-table-wrapper" style="max-height:400px;overflow-y:auto;">
        <table class="data-table">
          <thead><tr><th>م</th><th>نقطة الاختيار</th><th>البند المقابل</th>${hasPopulationData ? '<th>الرصيد الدفتري</th><th>الرصيد الفعلي (بعد الفحص)</th>' : ''}</tr></thead>
          <tbody>
            ${points.map((p, i) => {
              const item = hasPopulationData ? findItemForPoint(p) : null;
              return `
              <tr>
                <td>${i + 1}</td>
                <td style="font-family:var(--font-mono);">${Utils.formatNumber(p)}</td>
                <td>${item
                  ? `<span style="font-weight:600;">${Utils.escapeHtml(item.label)}</span>`
                  : hasPopulationData
                    ? `<span class="text-xs text-muted">لم يُطابَق أي بند (تحقق من بيانات المجتمع)</span>`
                    : `<input class="form-control" style="min-width:180px;" placeholder="رقم القيد / اسم العميل...">`}
                </td>
                ${hasPopulationData ? `
                  <td style="font-family:var(--font-mono);">${item ? Utils.formatNumber(item.balance) : '—'}</td>
                  <td>${item ? `<input class="form-control" type="number" style="min-width:130px;" placeholder="أدخل بعد الفحص..." onchange="ToolsModule.recordMUSSampleResult('${Utils.escapeHtml(item.label).replace(/'/g,"&#39;")}', ${item.balance}, this.value)">` : '—'}</td>
                ` : ''}
              </tr>
            `;}).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** عند إدخال الرصيد الفعلي مباشرة من جدول نقاط الاختيار، يُضاف تلقائياً
      (أو يُحدَّث) كصف في جدول الاستثناءات إن وُجد فرق عن الرصيد الدفتري،
      بدل مطالبة المستخدم بإعادة كتابة نفس البيانات في جدول منفصل يدوياً */
  function recordMUSSampleResult(label, bookValue, auditedValueStr) {
    const auditedValue = parseFloat(auditedValueStr);
    if (isNaN(auditedValue)) return;

    const existingIdx = musExceptions.findIndex(ex => ex.label === label);
    if (auditedValue === bookValue) {
      // لا فرق - إزالته إن كان مُسجَّلاً سابقاً بالخطأ
      if (existingIdx >= 0) { musExceptions.splice(existingIdx, 1); renderMUSExceptionsTable(); }
      return;
    }
    if (existingIdx >= 0) musExceptions[existingIdx] = { label, bookValue, auditedValue };
    else musExceptions.push({ label, bookValue, auditedValue });
    renderMUSExceptionsTable();
    Utils.showToast(`تم تسجيل فرق تلقائياً لبند "${label}" في جدول الاستثناءات أدناه`, 'info');
  }

  function renderMUSExceptionsTable() {
    const el = document.getElementById('mus-exceptions-table');
    if (!el) return;

    if (musExceptions.length === 0) {
      el.innerHTML = `<div class="text-xs text-muted" style="padding:8px 0;">لا توجد استثناءات مُسجَّلة بعد. أضف بنداً عند اكتشاف فرق بين الرصيد الدفتري والفعلي أثناء الفحص.</div>`;
      updateMUSEvaluation();
      return;
    }

    el.innerHTML = `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>البند</th><th>الرصيد الدفتري</th><th>الرصيد الفعلي (المؤكَّد)</th><th>التحريف</th><th></th></tr></thead>
          <tbody>
            ${musExceptions.map((ex, i) => `
              <tr>
                <td><input class="form-control" value="${Utils.escapeHtml(ex.label || '')}" oninput="ToolsModule.updateMUSException(${i},'label',this.value)" placeholder="وصف البند"></td>
                <td><input class="form-control" type="number" value="${ex.bookValue}" oninput="ToolsModule.updateMUSException(${i},'bookValue',this.value)"></td>
                <td><input class="form-control" type="number" value="${ex.auditedValue}" oninput="ToolsModule.updateMUSException(${i},'auditedValue',this.value)"></td>
                <td style="font-family:var(--font-mono);color:var(--color-danger);">${Utils.formatNumber((ex.bookValue||0) - (ex.auditedValue||0))}</td>
                <td><button class="btn-icon" onclick="ToolsModule.removeMUSException(${i})" title="حذف">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    updateMUSEvaluation();
  }

  function addMUSExceptionRow() {
    musExceptions.push({ label: '', bookValue: 0, auditedValue: 0 });
    renderMUSExceptionsTable();
  }

  function updateMUSException(idx, field, value) {
    if (!musExceptions[idx]) return;
    musExceptions[idx][field] = (field === 'label') ? value : (parseFloat(value) || 0);
    if (field !== 'label') updateMUSEvaluation(); // تحديث الاستنتاج فوراً مع كل تعديل رقمي، دون إعادة رسم الجدول (لإبقاء تركيز الكتابة في الحقل)
  }

  function removeMUSException(idx) {
    musExceptions.splice(idx, 1);
    renderMUSExceptionsTable();
  }

  /* ---- إسقاط التحريف على المجتمع (طريقة النسبة - Ratio Method) ---- */
  function updateMUSEvaluation() {
    const resultEl = document.getElementById('mus-evaluation-result');
    if (!resultEl) return;

    const interval = parseFloat(document.getElementById('mus-out-interval')?.textContent.replace(/[^\d.]/g, '')) || 0;
    const tol = parseFloat(document.getElementById('mus-tolerable')?.value) || 0;

    if (musExceptions.length === 0) {
      resultEl.innerHTML = '';
      return;
    }

    let totalProjected = 0;
    let totalActual = 0;
    musExceptions.forEach(ex => {
      const bv = ex.bookValue || 0;
      const av = ex.auditedValue || 0;
      const actualMisstatement = bv - av;
      totalActual += actualMisstatement;
      if (bv <= 0) return;
      if (bv >= interval && interval > 0) {
        // "وحدة منطقية" أكبر من الفترة (فُحصت بالكامل) - لا يُسقَط التحريف، يُؤخذ كما هو
        totalProjected += actualMisstatement;
      } else {
        const tainting = actualMisstatement / bv;
        totalProjected += tainting * interval;
      }
    });

    const withinTolerable = totalProjected <= tol;

    resultEl.innerHTML = `
      <div class="materiality-breakdown mb-3">
        <div class="materiality-item">
          <div class="materiality-item-value">${Utils.formatNumber(Math.round(totalActual))}</div>
          <div class="materiality-item-label">إجمالي التحريف الفعلي بالعينة</div>
        </div>
        <div class="materiality-item ${withinTolerable ? '' : 'primary'}">
          <div class="materiality-item-value" style="color:${withinTolerable ? 'var(--color-success)' : 'var(--color-danger)'};">${Utils.formatNumber(Math.round(totalProjected))}</div>
          <div class="materiality-item-label">التحريف المُسقَط على المجتمع (Projected Misstatement)</div>
        </div>
      </div>
      <div class="warning-box" style="background:${withinTolerable ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)'};color:${withinTolerable ? 'var(--color-success)' : 'var(--color-danger)'};">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div>
          ${withinTolerable
            ? `<strong>الاستنتاج: التحريف المُسقَط (${Utils.formatNumber(Math.round(totalProjected))}) أقل من الأهمية النسبية لأداء العمل (${Utils.formatNumber(tol)}).</strong> النتائج تدعم قبول الرصيد كما هو، مع مراعاة إضافة هامش احتياطي كافٍ لمخاطر أخذ العينات قبل الاستنتاج النهائي.`
            : `<strong>الاستنتاج: التحريف المُسقَط (${Utils.formatNumber(Math.round(totalProjected))}) يتجاوز الأهمية النسبية لأداء العمل (${Utils.formatNumber(tol)}).</strong> يُوصى بتوسيع نطاق العينة أو إجراء إجراءات تحقيقية إضافية أو مطالبة العميل بتصحيح البنود المتأثرة.`}
        </div>
      </div>
    `;
  }

  async function saveMUSAsWorkpaper() {
    const clientId = App.getActiveClientId();
    if (!clientId) { Utils.showToast('يرجى اختيار عميل أولاً من القائمة العلوية', 'error'); return; }
    if (Utils.blockIfArchive()) return;

    const pop = document.getElementById('mus-population')?.value || '0';
    const tol = document.getElementById('mus-tolerable')?.value || '0';
    const conf = document.getElementById('mus-confidence')?.value || '95';
    const rf = document.getElementById('mus-out-rf')?.textContent || '—';
    const interval = document.getElementById('mus-out-interval')?.textContent || '—';
    const size = document.getElementById('mus-out-size')?.textContent || '—';

    const intervalNum = parseFloat(interval.replace(/[^\d.]/g, '')) || 0;
    const popNum = parseFloat(pop) || 0;
    const points = [];
    if (intervalNum > 0 && popNum > 0) {
      // إعادة توليد نفس تسلسل النقاط المعروضة حالياً في الجدول (إن وُجد) بقراءتها من الـ DOM مباشرة لضمان مطابقة ما يراه المستخدم فعلياً
      document.querySelectorAll('#mus-sample-points table tbody tr').forEach(tr => {
        const cells = tr.querySelectorAll('td');
        if (cells.length >= 3) {
          points.push({
            point: cells[1]?.textContent.trim() || '',
            item: cells[2]?.innerText.trim() || '',
            bookValue: cells[3]?.textContent.trim() || '',
            auditedValue: cells[4]?.querySelector('input')?.value || cells[4]?.textContent.trim() || ''
          });
        }
      });
    }

    const totalActual = musExceptions.reduce((s, ex) => s + ((ex.bookValue||0) - (ex.auditedValue||0)), 0);
    let totalProjected = 0;
    musExceptions.forEach(ex => {
      const bv = ex.bookValue || 0, av = ex.auditedValue || 0;
      const actualMisstatement = bv - av;
      if (bv <= 0) return;
      if (bv >= intervalNum && intervalNum > 0) totalProjected += actualMisstatement;
      else totalProjected += (actualMisstatement / bv) * intervalNum;
    });
    const withinTolerable = totalProjected <= parseFloat(tol);

    const content = `
ورقة عمل تخطيط وتقييم عينة الوحدة النقدية (MUS) — Monetary Unit Sampling
==========================================================================

أولاً: معايير التخطيط
----------------------
قيمة المجتمع:                          ${Utils.formatNumber(parseFloat(pop))}
الأهمية النسبية لأداء العمل:            ${Utils.formatNumber(parseFloat(tol))}
مستوى الثقة المطلوب:                    ${conf}%
معامل الموثوقية (Reliability Factor):   ${rf}
الفترة بين العينات (Sampling Interval): ${interval}
حجم العينة المحتسب:                     ${size}

${musPopulationItems.length > 0 ? `ثانياً: بنود المجتمع المُدخَلة
------------------------------
إجمالي عدد البنود: ${musPopulationItems.length}
إجمالي الرصيد: ${Utils.formatNumber(Math.round(musPopulationItems[musPopulationItems.length-1]?.cumulativeEnd || 0))}
` : ''}
${points.length > 0 ? `${musPopulationItems.length > 0 ? 'ثالثاً' : 'ثانياً'}: نقاط الاختيار الفعلية والبنود المقابلة
-------------------------------------------------
${points.map((p, i) => `  ${i+1}. نقطة ${p.point} → ${p.item}${p.bookValue && p.bookValue !== '—' ? ` (دفتري: ${p.bookValue}${p.auditedValue && p.auditedValue !== '—' ? '، فعلي: ' + p.auditedValue : ''})` : ''}`).join('\n')}
` : ''}
${musPopulationItems.length > 0 ? 'رابعاً' : 'ثالثاً'}: الاستثناءات المُسجَّلة (${musExceptions.length})
-------------------------------------------
${musExceptions.length > 0 ? musExceptions.map((ex, i) => `  ${i+1}. ${ex.label || '(بلا وصف)'} — دفتري: ${Utils.formatNumber(ex.bookValue)} / فعلي: ${Utils.formatNumber(ex.auditedValue)} / فرق: ${Utils.formatNumber((ex.bookValue||0)-(ex.auditedValue||0))}`).join('\n') : '  لا توجد استثناءات مُسجَّلة.'}

${musPopulationItems.length > 0 ? 'خامساً' : 'رابعاً'}: التقييم والاستنتاج النهائي
-----------------------------------------
إجمالي التحريف الفعلي بالعينة:           ${Utils.formatNumber(Math.round(totalActual))}
التحريف المُسقَط على المجتمع بالكامل:      ${Utils.formatNumber(Math.round(totalProjected))}
النتيجة:                                 ${withinTolerable ? 'ضمن الأهمية النسبية لأداء العمل ✓' : 'يتجاوز الأهمية النسبية لأداء العمل ✗'}

${withinTolerable
  ? 'الاستنتاج: التحريف المُسقَط أقل من الأهمية النسبية لأداء العمل. النتائج تدعم قبول الرصيد كما هو، مع مراعاة هامش احتياطي كافٍ لمخاطر أخذ العينات قبل الاستنتاج النهائي.'
  : 'الاستنتاج: التحريف المُسقَط يتجاوز الأهمية النسبية لأداء العمل. يُوصى بتوسيع نطاق العينة أو إجراء إجراءات تحقيقية إضافية أو مطالبة العميل بتصحيح البنود المتأثرة.'}
    `.trim();

    await AuditDB.add(AuditDB.STORES.WORKPAPERS, {
      clientId,
      type: 'supporting',
      reference: `MUS-${Date.now().toString().slice(-6)}`,
      title: 'ورقة عمل عينة الوحدة النقدية (MUS)',
      category: 'أدوات المراجعة والعينات',
      preparedBy: '',
      reviewedBy: '',
      prepDate: new Date().toISOString().split('T')[0],
      revDate: '',
      signedOff: false,
      content,
      status: 'prepared',
      notes: 'تم إنشاؤها تلقائياً من حاسبة عينات الوحدة النقدية في صفحة أدوات المراجعة، وتتضمّن تفاصيل نقاط الاختيار والاستثناءات الكاملة.'
    });

    Utils.showToast('تم حفظ العينة كورقة عمل كاملة بنجاح', 'success');
    App.navigateTo('workpapers');
  }

  /* ============================================================
     Attribute Sampling Calculator (Tests of Controls)
     ============================================================ */
  function attributeCalculatorHTML() {
    return `
      <div class="card mb-5">
        <div class="card-header"><div class="card-title">1️⃣ تخطيط العينة — حجم عينة اختبار الضوابط</div></div>
        <div class="card-body">
          <div class="info-box mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <div>تقريب مبسّط (Poisson) لتحديد حجم عينة اختبار الضوابط، يصلح للتخطيط الأولي.</div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">معدل الانحراف المسموح به (TDR %)</label>
              <input class="form-control" id="attr-tdr" type="number" min="0.1" step="0.1" value="5" oninput="ToolsModule.recalcAttribute()">
            </div>
            <div class="form-group">
              <label class="form-label">معدل الانحراف المتوقع (EDR %)</label>
              <input class="form-control" id="attr-edr" type="number" min="0" step="0.1" value="1" oninput="ToolsModule.recalcAttribute()">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">مستوى الثقة المطلوب</label>
              <select class="form-control" id="attr-confidence" onchange="ToolsModule.recalcAttribute()">
                <option value="90">90%</option>
                <option value="95" selected>95%</option>
                <option value="99">99%</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">حجم المجتمع (اختياري، مطلوب لتوليد أرقام العينة)</label>
              <input class="form-control" id="attr-population" type="number" min="0" placeholder="اتركه فارغاً إن كان كبيراً" oninput="ToolsModule.recalcAttribute()">
            </div>
          </div>
          <div class="materiality-breakdown mt-4">
            <div class="materiality-item">
              <div class="materiality-item-value" id="attr-out-rf">—</div>
              <div class="materiality-item-label">معامل الموثوقية</div>
            </div>
            <div class="materiality-item primary">
              <div class="materiality-item-value" id="attr-out-size">—</div>
              <div class="materiality-item-label">حجم العينة المقترح</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card mb-5">
        <div class="card-header">
          <div class="card-title">2️⃣ اختيار وحدات العينة عشوائياً</div>
          <button class="btn btn-primary btn-sm" onclick="ToolsModule.generateAttributeSample()">توليد أرقام العينة</button>
        </div>
        <div class="card-body">
          <div class="text-sm text-muted mb-3">يُولِّد هذا القسم أرقام بنود عشوائية (Simple Random Sampling) من إجمالي حجم المجتمع المُدخَل أعلاه، لسحب البند المقابل لكل رقم فعلياً من سجلات العميل واختباره.</div>
          <div id="attr-sample-points"></div>
        </div>
      </div>

      <div class="card mb-5">
        <div class="card-header"><div class="card-title">3️⃣ تقييم نتائج الفحص</div></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">عدد الانحرافات (حالات عدم الالتزام بالضابط) المكتشفة فعلياً</label>
              <input class="form-control" id="attr-deviations-found" type="number" min="0" value="0" oninput="ToolsModule.updateAttributeEvaluation()">
            </div>
          </div>
          <div id="attr-evaluation-result" class="mt-3"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-body" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div class="text-sm text-muted">احفظ كامل تخطيط وتقييم هذه العينة كورقة عمل مرتبطة بالعميل النشط.</div>
          <button class="btn btn-accent" onclick="ToolsModule.saveAttributeAsWorkpaper()">💾 حفظ كورقة عمل</button>
        </div>
      </div>
    `;
  }

  function recalcAttribute() {
    const tdr = (parseFloat(document.getElementById('attr-tdr')?.value) || 0) / 100;
    const edr = (parseFloat(document.getElementById('attr-edr')?.value) || 0) / 100;
    const conf = parseInt(document.getElementById('attr-confidence')?.value) || 95;
    const popInput = parseFloat(document.getElementById('attr-population')?.value);

    const rf = RELIABILITY_FACTORS[conf] || 3.0;
    const gap = tdr - edr;

    let size = 0;
    if (gap > 0) {
      size = Math.ceil(rf / gap);
      // تصحيح للمجتمع المحدود إن تم إدخاله (Finite Population Correction مبسّط)
      if (popInput && popInput > 0 && size > popInput * 0.05) {
        size = Math.ceil(size / (1 + (size / popInput)));
      }
    }

    setText('attr-out-rf', rf.toFixed(2));
    setText('attr-out-size', size > 0 ? Utils.formatNumber(size) + ' بند' : 'يرجى التأكد أن معدل الانحراف المتوقع أقل من المسموح به');

    const pointsEl = document.getElementById('attr-sample-points');
    if (pointsEl) pointsEl.innerHTML = '<div class="text-xs text-muted">اضغط "توليد أرقام العينة" لعرضها هنا بعد استقرار حجم العينة.</div>';
    attributeSampleItems = [];
    const evalEl = document.getElementById('attr-evaluation-result');
    if (evalEl) evalEl.innerHTML = '';
  }

  let attributeSampleItems = []; // { number, result: 'ok'|'deviation' }

  function generateAttributeSample() {
    const pop = parseFloat(document.getElementById('attr-population')?.value) || 0;
    const sizeText = document.getElementById('attr-out-size')?.textContent || '';
    const size = parseInt(sizeText.replace(/[^\d]/g, '')) || 0;
    const pointsEl = document.getElementById('attr-sample-points');
    if (!pointsEl) return;

    if (!pop || pop <= 0) {
      pointsEl.innerHTML = `<div class="warning-box">يرجى إدخال حجم المجتمع في القسم الأول لتوليد أرقام عينة فعلية.</div>`;
      return;
    }
    if (!size || size <= 0) {
      pointsEl.innerHTML = `<div class="warning-box">يرجى التأكد من صحة معدلات الانحراف المُدخَلة لاحتساب حجم عينة صالح أولاً.</div>`;
      return;
    }
    if (size > pop) {
      pointsEl.innerHTML = `<div class="warning-box">حجم العينة المحسوب أكبر من حجم المجتمع المُدخَل — يلزم فحص المجتمع بالكامل (100%) بدل أخذ عينة.</div>`;
      return;
    }

    // اختيار عشوائي بسيط بدون تكرار (Simple Random Sampling)
    const chosen = new Set();
    while (chosen.size < size) {
      chosen.add(1 + Math.floor(Math.random() * pop));
    }
    const numbers = Array.from(chosen).sort((a, b) => a - b);
    attributeSampleItems = numbers.map(n => ({ number: n, description: '', result: 'ok' }));

    pointsEl.innerHTML = `
      <div class="text-xs text-muted mb-2">تم اختيار ${numbers.length} رقماً عشوائياً من إجمالي مجتمع قوامه ${Utils.formatNumber(pop)} بند (بدون تكرار)</div>
      <div class="data-table-wrapper" style="max-height:320px;overflow-y:auto;">
        <table class="data-table">
          <thead><tr><th>م</th><th>رقم البند في المجتمع</th><th>وصف البند (اختياري)</th><th>نتيجة الفحص</th></tr></thead>
          <tbody>
            ${numbers.map((n, i) => `
              <tr>
                <td>${i + 1}</td>
                <td style="font-family:var(--font-mono);">#${Utils.formatNumber(n)}</td>
                <td><input class="form-control" style="min-width:160px;" placeholder="رقم القيد / اسم العميل..." oninput="ToolsModule.updateAttributeItem(${i},'description',this.value)"></td>
                <td>
                  <select class="form-control" onchange="ToolsModule.updateAttributeItem(${i},'result',this.value)">
                    <option value="ok">✓ ملتزم بالضابط</option>
                    <option value="deviation">✗ انحراف/عدم التزام</option>
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    // إصلاح: مزامنة حقل "عدد الانحرافات" تلقائياً مع نتائج الجدول بدل تركه منفصلاً يُملأ يدوياً
    syncAttributeDeviationCount();
  }

  /* إصلاح خلل: قائمة "نتيجة الفحص" لكل بند لم تكن مربوطة بأي منطق فعلي
     من قبل — أي اختيار "انحراف" لم يكن يُحدِّث عدد الانحرافات إطلاقاً،
     ما يفرض على المستخدم عدّها يدوياً بنفسه. الآن يتم الاحتساب تلقائياً. */
  function updateAttributeItem(idx, field, value) {
    if (!attributeSampleItems[idx]) return;
    attributeSampleItems[idx][field] = value;
    if (field === 'result') syncAttributeDeviationCount();
  }

  function syncAttributeDeviationCount() {
    const count = attributeSampleItems.filter(it => it.result === 'deviation').length;
    const input = document.getElementById('attr-deviations-found');
    if (input) input.value = count;
    updateAttributeEvaluation();
  }

  function updateAttributeEvaluation() {
    const el = document.getElementById('attr-evaluation-result');
    if (!el) return;

    const sizeText = document.getElementById('attr-out-size')?.textContent || '';
    const size = parseInt(sizeText.replace(/[^\d]/g, '')) || 0;
    const tdr = parseFloat(document.getElementById('attr-tdr')?.value) || 0;
    const deviations = parseInt(document.getElementById('attr-deviations-found')?.value) || 0;

    if (!size) { el.innerHTML = ''; return; }

    const sampleRate = (deviations / size) * 100;
    const withinTolerable = sampleRate <= tdr;

    el.innerHTML = `
      <div class="materiality-breakdown mb-3">
        <div class="materiality-item">
          <div class="materiality-item-value">${sampleRate.toFixed(2)}%</div>
          <div class="materiality-item-label">معدل الانحراف الفعلي في العينة</div>
        </div>
        <div class="materiality-item">
          <div class="materiality-item-value">${tdr.toFixed(1)}%</div>
          <div class="materiality-item-label">معدل الانحراف المسموح به</div>
        </div>
      </div>
      <div class="warning-box" style="background:${withinTolerable ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)'};color:${withinTolerable ? 'var(--color-success)' : 'var(--color-danger)'};">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div>
          ${withinTolerable
            ? `<strong>الاستنتاج: معدل الانحراف الفعلي (${sampleRate.toFixed(2)}%) أقل من أو يساوي المسموح به (${tdr.toFixed(1)}%).</strong> نتائج العينة تدعم الاعتماد المخطَّط له على فاعلية تشغيل الضابط الرقابي.`
            : `<strong>الاستنتاج: معدل الانحراف الفعلي (${sampleRate.toFixed(2)}%) يتجاوز المسموح به (${tdr.toFixed(1)}%).</strong> لا تدعم نتائج العينة الاعتماد على هذا الضابط بمستوى الثقة المخطَّط؛ يُوصى بخفض مستوى الاعتماد المخطَّط على الرقابة الداخلية وتوسيع الاختبارات التحقيقية التعويضية.`}
        </div>
      </div>
    `;
  }

  async function saveAttributeAsWorkpaper() {
    const clientId = App.getActiveClientId();
    if (!clientId) { Utils.showToast('يرجى اختيار عميل أولاً من القائمة العلوية', 'error'); return; }
    if (Utils.blockIfArchive()) return;

    const tdr = document.getElementById('attr-tdr')?.value || '0';
    const edr = document.getElementById('attr-edr')?.value || '0';
    const conf = document.getElementById('attr-confidence')?.value || '95';
    const rf = document.getElementById('attr-out-rf')?.textContent || '—';
    const size = document.getElementById('attr-out-size')?.textContent || '—';
    const deviations = document.getElementById('attr-deviations-found')?.value || '0';
    const sampleRate = attributeSampleItems.length ? ((parseInt(deviations)||0) / attributeSampleItems.length * 100).toFixed(2) : '—';
    const withinTolerable = parseFloat(sampleRate) <= parseFloat(tdr);

    // التقاط أوصاف البنود المُدخَلة يدوياً في الجدول (إن وُجدت) لضمان تطابق ما يُحفَظ مع ما يراه المستخدم فعلياً
    document.querySelectorAll('#attr-sample-points table tbody tr').forEach((tr, i) => {
      const desc = tr.querySelector('td:nth-child(3) input')?.value || '';
      if (attributeSampleItems[i]) attributeSampleItems[i].description = desc;
    });

    const content = `
ورقة عمل تخطيط وتقييم عينة اختبار الضوابط (Attribute Sampling)
================================================================

أولاً: معايير التخطيط
----------------------
معدل الانحراف المسموح به (TDR):   ${tdr}%
معدل الانحراف المتوقع (EDR):      ${edr}%
مستوى الثقة المطلوب:              ${conf}%
معامل الموثوقية:                  ${rf}
حجم العينة المحتسب:               ${size}

ثانياً: بنود العينة المفحوصة (${attributeSampleItems.length})
---------------------------------------------------
${attributeSampleItems.length > 0
  ? attributeSampleItems.map((it, i) => `  ${i+1}. بند رقم #${it.number}${it.description ? ' — ' + it.description : ''} — ${it.result === 'deviation' ? '✗ انحراف' : '✓ ملتزم'}`).join('\n')
  : '  لم يتم توليد أرقام عينة بعد.'}

ثالثاً: التقييم والاستنتاج النهائي
-----------------------------------
عدد الانحرافات المكتشفة فعلياً:     ${deviations}
معدل الانحراف الفعلي في العينة:     ${sampleRate}%
معدل الانحراف المسموح به:           ${tdr}%
النتيجة:                            ${withinTolerable ? 'ضمن المعدل المسموح به ✓' : 'يتجاوز المعدل المسموح به ✗'}

${withinTolerable
  ? 'الاستنتاج: معدل الانحراف الفعلي أقل من أو يساوي المسموح به. نتائج العينة تدعم الاعتماد المخطَّط له على فاعلية تشغيل الضابط الرقابي.'
  : 'الاستنتاج: معدل الانحراف الفعلي يتجاوز المسموح به. لا تدعم نتائج العينة الاعتماد على هذا الضابط بمستوى الثقة المخطَّط؛ يُوصى بخفض مستوى الاعتماد المخطَّط على الرقابة الداخلية وتوسيع الاختبارات التحقيقية التعويضية.'}
    `.trim();

    await AuditDB.add(AuditDB.STORES.WORKPAPERS, {
      clientId,
      type: 'supporting',
      reference: `ATTR-${Date.now().toString().slice(-6)}`,
      title: 'ورقة عمل عينة اختبار الضوابط',
      category: 'أدوات المراجعة والعينات',
      preparedBy: '',
      reviewedBy: '',
      prepDate: new Date().toISOString().split('T')[0],
      revDate: '',
      signedOff: false,
      content,
      status: 'prepared',
      notes: 'تم إنشاؤها تلقائياً من حاسبة عينات اختبار الضوابط في صفحة أدوات المراجعة، وتتضمّن تفاصيل كل بند تم فحصه.'
    });

    Utils.showToast('تم حفظ العينة كورقة عمل كاملة بنجاح', 'success');
    App.navigateTo('workpapers');
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ============================================================
     CSV Trial Balance Import
     ============================================================ */
  let parsedCSV = null; // { headers: [...], rows: [[...], ...] }

  function csvImportHTML() {
    return `
      <div class="card">
        <div class="card-header"><div class="card-title">استيراد ميزان المراجعة من ملف CSV</div></div>
        <div class="card-body">
          <div class="info-box mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <div>صدّر ميزان المراجعة من برنامج العميل المحاسبي أو من Excel بصيغة CSV، ثم ارفعه هنا لمعاينة الإجماليات واستخدامها مباشرة كأساس لاحتساب الأهمية النسبية.</div>
          </div>
          <div class="form-group">
            <label class="btn btn-secondary attachments-upload-btn">
              📄 اختيار ملف CSV
              <input type="file" accept=".csv,text/csv" style="display:none;" onchange="ToolsModule.handleCSVUpload(this)">
            </label>
          </div>
          <div id="csvPreviewArea"></div>
        </div>
      </div>
    `;
  }

  function parseCSV(text) {
    // إزالة BOM إن وُجد
    text = text.replace(/^\uFEFF/, '');
    // محاولة اكتشاف الفاصل: فاصلة أو فاصلة منقوطة (شائعة في تصدير Excel بالمنطقة العربية)
    const sampleLine = text.split(/\r?\n/)[0] || '';
    const delimiter = (sampleLine.match(/;/g) || []).length > (sampleLine.match(/,/g) || []).length ? ';' : ',';

    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i], next = text[i + 1];
      if (inQuotes) {
        if (ch === '"' && next === '"') { field += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { field += ch; }
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === delimiter) { row.push(field); field = ''; }
        else if (ch === '\n' || ch === '\r') {
          if (ch === '\r' && next === '\n') i++;
          row.push(field); field = '';
          if (row.length > 1 || row[0] !== '') rows.push(row);
          row = [];
        } else { field += ch; }
      }
    }
    if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }

    if (rows.length === 0) return { headers: [], rows: [] };
    const headers = rows[0].map(h => h.trim());
    return { headers, rows: rows.slice(1).filter(r => r.some(c => c.trim() !== '')) };
  }

  function handleCSVUpload(inputEl) {
    const file = inputEl.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        parsedCSV = parseCSV(reader.result);
        renderCSVPreview();
      } catch (e) {
        console.error(e);
        Utils.showToast('تعذرت قراءة الملف. تأكد أنه ملف CSV صحيح', 'error');
      }
    };
    reader.onerror = () => Utils.showToast('تعذرت قراءة الملف', 'error');
    reader.readAsText(file, 'UTF-8');
  }

  function renderCSVPreview() {
    const area = document.getElementById('csvPreviewArea');
    if (!area || !parsedCSV) return;

    const { headers, rows } = parsedCSV;
    if (headers.length === 0 || rows.length === 0) {
      area.innerHTML = `<div class="warning-box mt-4">لم يتم العثور على بيانات صالحة في الملف</div>`;
      return;
    }

    // اكتشاف الأعمدة الرقمية وحساب إجمالي كل منها
    const numericCols = headers.map((h, idx) => {
      const values = rows.map(r => parseFloat(String(r[idx] || '').replace(/,/g, '')));
      const validCount = values.filter(v => !isNaN(v)).length;
      const isNumeric = validCount > rows.length * 0.5;
      const total = isNumeric ? values.reduce((s, v) => s + (isNaN(v) ? 0 : v), 0) : null;
      return { idx, header: h, isNumeric, total };
    });

    const previewRows = rows.slice(0, 15);

    area.innerHTML = `
      <div class="mt-4 data-table-wrapper">
        <table class="data-table">
          <thead><tr>${headers.map(h => `<th>${Utils.escapeHtml(h)}</th>`).join('')}</tr></thead>
          <tbody>
            ${previewRows.map(r => `<tr>${headers.map((h, i) => `<td>${Utils.escapeHtml(r[i] || '')}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${rows.length > 15 ? `<div class="text-xs text-muted mt-2">عرض أول 15 صفاً من إجمالي ${Utils.formatNumber(rows.length)} صفاً</div>` : ''}

      <div class="mt-5">
        <div class="form-label" style="margin-bottom:8px;">إجماليات الأعمدة الرقمية</div>
        <div class="risk-register-list">
          ${numericCols.filter(c => c.isNumeric).map(c => `
            <div class="risk-register-item" style="align-items:center;">
              <div class="risk-register-info" style="padding:var(--space-3);">
                <div class="risk-register-title">${Utils.escapeHtml(c.header)}</div>
                <div class="risk-register-desc">الإجمالي: ${Utils.formatNumber(Math.round(c.total))}</div>
              </div>
              <div class="risk-register-actions" style="padding:var(--space-3);">
                <button class="btn btn-secondary btn-sm" onclick="ToolsModule.sendToMateriality(${Math.round(c.total)})">استخدام كأساس للأهمية النسبية</button>
              </div>
            </div>
          `).join('') || '<div class="text-xs text-muted">لم يتم العثور على أعمدة رقمية</div>'}
        </div>
      </div>
    `;
  }

  async function sendToMateriality(amount) {
    const clientId = App.getActiveClientId();
    if (!clientId) {
      Utils.showToast('يرجى اختيار عميل أولاً من القائمة العلوية', 'error');
      return;
    }
    await AuditDB.setSetting('pendingMaterialityBenchmark', { clientId, amount });
    Utils.showToast('تم نقل المبلغ إلى صفحة الأهمية النسبية', 'success');
    App.navigateTo('materiality');
  }

  return {
    renderTools,
    recalcMUS,
    recalcAttribute,
    generateMUSSample,
    parseMUSPopulationItems,
    recordMUSSampleResult,
    addMUSExceptionRow,
    updateMUSException,
    removeMUSException,
    saveMUSAsWorkpaper,
    generateAttributeSample,
    updateAttributeItem,
    updateAttributeEvaluation,
    saveAttributeAsWorkpaper,
    handleCSVUpload,
    sendToMateriality
  };
})();
