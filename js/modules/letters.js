/* ============================================================
   AuditPro - Letters Module
   ------------------------------------------------------------
   قوالب المراسلات: رسالة الإدارة (من الملاحظات المفتوحة)
   + قوالب: طلب مصادقة بنكية، استفسار قانوني، خطاب التكليف
   ============================================================ */

const LettersModule = (() => {

  const LETTER_TYPES = {
    management:  { label: 'رسالة الإدارة',          icon: '📋' },
    representation: { label: 'خطاب إقرارات الإدارة (ISA 580)', icon: '🖋️' },
    governance:  { label: 'التواصل مع الحوكمة (ISA 260)', icon: '🏛️' },
    bank_confirm:{ label: 'طلب مصادقة بنكية',       icon: '🏦' },
    lawyer:      { label: 'خطاب الاستفسار القانوني', icon: '⚖️' },
    engagement:  { label: 'خطاب التكليف',           icon: '📝' },
    custom:      { label: 'مراسلة مخصصة',           icon: '✉️'  }
  };

  async function renderLetters() {
    const container = document.getElementById('lettersContent');
    if (!container) return;

    const clientId = App.getActiveClientId();
    if (!clientId) { container.innerHTML = Utils.noClientWarning('المراسلات'); return; }

    const [letters, client] = await Promise.all([
      AuditDB.getByClientYear(AuditDB.STORES.LETTERS, clientId, App.getActiveYear()),
      AuditDB.get(AuditDB.STORES.CLIENTS, clientId)
    ]);
    letters.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const isArchive = App.isArchiveMode();
    const readOnly = App.isEditingBlocked();

    container.innerHTML = `
      ${isArchive ? Utils.archiveBanner(App.getActiveYear(), App.isArchiveEditUnlocked()) : ''}
      <div class="card mb-5">
        <div class="card-header">
          <div class="card-title">✉️ المراسلات (${letters.length})</div>
          ${readOnly ? '' : `
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" onclick="LettersModule.openNewLetterModal()">+ مراسلة جديدة</button>
            <button class="btn btn-secondary btn-sm" onclick="LettersModule.generateManagementLetter()">📋 رسالة الإدارة (تلقائي)</button>
          </div>`}
        </div>
        <div class="card-body p-0">
          ${letters.length === 0 ? `
            <div class="text-sm text-muted" style="padding:32px;text-align:center;">لا توجد مراسلات بعد. استخدم "رسالة الإدارة (تلقائي)" لإنشاء رسالة الإدارة تلقائياً من الملاحظات المفتوحة.</div>
          ` : `
            <div class="data-table-wrapper">
              <table class="data-table">
                <thead>
                  <tr><th>النوع</th><th>الموضوع</th><th>التاريخ</th><th>الحالة</th><th></th></tr>
                </thead>
                <tbody>
                  ${letters.map(l => {
                    const lt = LETTER_TYPES[l.type] || LETTER_TYPES.custom;
                    return `
                      <tr>
                        <td><span class="chip">${lt.icon} ${lt.label}</span></td>
                        <td>${Utils.escapeHtml(l.title || '—')}</td>
                        <td>${Utils.formatDate(l.createdAt)}</td>
                        <td>
                          ${l.status==='sent'
                            ? `<span class="stamp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>أُرسلت</span>`
                            : `<span class="badge badge-neutral">📝 مسودة</span>`}
                        </td>
                        <td>
                          <div style="display:flex;gap:6px;">
                            <button class="btn btn-sm btn-secondary" onclick="LettersModule.viewLetter(${l.id})" title="عرض وطباعة">👁️</button>
                            ${readOnly ? '' : `
                            <button class="btn btn-sm btn-secondary" onclick="LettersModule.editLetter(${l.id})" title="تعديل">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="LettersModule.deleteLetter(${l.id})" title="حذف">🗑️</button>`}
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
  }

  /* ---- New letter modal ---- */
  function openNewLetterModal(prefill = {}) {
    if (Utils.blockIfArchive()) return;
    const typeOptions = Object.entries(LETTER_TYPES).map(([k,v]) =>
      `<option value="${k}" ${prefill.type===k?'selected':''}>${v.icon} ${v.label}</option>`
    ).join('');

    const body = `
      <div class="form-group">
        <label class="form-label required">نوع المراسلة</label>
        <select class="form-control" id="lt-type" onchange="LettersModule.applyTemplate()">${typeOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label required">الموضوع / العنوان</label>
        <input class="form-control" id="lt-title" type="text" value="${Utils.escapeHtml(prefill.title || '')}" placeholder="موضوع المراسلة">
      </div>
      <div class="form-group">
        <label class="form-label">المرسَل إليه</label>
        <input class="form-control" id="lt-addressee" type="text" value="${Utils.escapeHtml(prefill.addressee || '')}" placeholder="اسم الجهة أو الشخص المرسَل إليه">
      </div>
      <div class="form-group">
        <label class="form-label required">نص المراسلة</label>
        <textarea class="form-control textarea-auto" id="lt-body" rows="10" placeholder="نص المراسلة...">${Utils.escapeHtml(prefill.body || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">حالة المراسلة</label>
        <select class="form-control" id="lt-status">
          <option value="draft" ${prefill.status==='draft'||!prefill.status ? 'selected' : ''}>📝 مسودة</option>
          <option value="sent" ${prefill.status==='sent' ? 'selected' : ''}>✅ أُرسلت</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">ملاحظات داخلية</label>
        <textarea class="form-control textarea-auto" id="lt-notes" rows="2" placeholder="ملاحظات للاستخدام الداخلي فقط...">${Utils.escapeHtml(prefill.notes || '')}</textarea>
      </div>
    `;
    Utils.openModal(prefill.id ? 'تعديل المراسلة' : 'مراسلة جديدة', body, `
      <button class="btn btn-primary" id="saveLetterBtn">حفظ</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
    `, 'lg');

    if (!prefill.body) applyTemplate(); // Apply default template for new letters

    document.getElementById('saveLetterBtn').onclick = async () => {
      const clientId = App.getActiveClientId();
      const title = document.getElementById('lt-title').value.trim();
      if (!title) { Utils.showToast('يرجى إدخال موضوع المراسلة', 'error'); return; }
      const record = {
        clientId,
        type:      document.getElementById('lt-type').value,
        title,
        addressee: document.getElementById('lt-addressee').value.trim(),
        body:      document.getElementById('lt-body').value,
        status:    document.getElementById('lt-status').value,
        notes:     document.getElementById('lt-notes').value.trim()
      };
      if (prefill.id) {
        await AuditDB.put(AuditDB.STORES.LETTERS, { ...record, id: prefill.id });
      } else {
        await AuditDB.add(AuditDB.STORES.LETTERS, record);
      }
      Utils.closeModal();
      Utils.showToast('تم حفظ المراسلة', 'success');
      renderLetters();
    };
  }

  async function applyTemplate() {
    const type = document.getElementById('lt-type')?.value;
    const bodyEl = document.getElementById('lt-body');
    const titleEl = document.getElementById('lt-title');
    if (!type || !bodyEl) return;

    const clientId = App.getActiveClientId();
    const client = clientId ? await AuditDB.get(AuditDB.STORES.CLIENTS, clientId) : {};
    const firmName = await AuditDB.getSetting('firmName') || 'مكتب المراجعة والمحاسبة';
    const year = client?.financialYear || new Date().getFullYear() - 1;
    const asOfDate = client?.balanceSheetDate ? Utils.formatDate(client.balanceSheetDate) : `31/12/${year}`;
    const today = Utils.todayDisplay();

    // بيانات إضافية مطلوبة لقوالب خطابي إقرارات الإدارة (ISA 580) والتواصل مع الحوكمة (ISA 260)
    const currency = Utils.currencySymbol(client?.currency);
    const [matRecords, findings, gcRecords] = clientId ? await Promise.all([
      AuditDB.getByClientYear(AuditDB.STORES.MATERIALITY, clientId, App.getActiveYear()),
      AuditDB.getByClientYear(AuditDB.STORES.FINDINGS, clientId, App.getActiveYear()),
      AuditDB.getByClientYear(AuditDB.STORES.GOING_CONCERN, clientId, App.getActiveYear())
    ]) : [[], [], []];
    const mat = matRecords.length > 0 ? matRecords[matRecords.length - 1] : null;
    const gc  = gcRecords.length > 0 ? gcRecords[gcRecords.length - 1] : null;
    const openFindingsForLetter = findings.filter(f => f.status === 'open');
    const uncorrectedList = openFindingsForLetter.length > 0
      ? openFindingsForLetter.map(f => `- ${f.title}${f.description ? ': ' + f.description : ''}`).join('\n')
      : 'لا توجد تحريفات غير مُصحَّحة جوهرية تم تحديدها أثناء المراجعة.';

    const templates = {
      bank_confirm: {
        title: `طلب مصادقة بنكية — ${year}`,
        addressee: 'إدارة البنك',
        body: `${today}

إلى / إدارة بنك [اسم البنك] — فرع [اسم الفرع]

السادة المحترمون،

تحية طيبة وبعد،

نحن مراجعو حسابات شركة **${Utils.escapeHtml(client?.name || 'العميل')}**، ونطلب منكم التكرم بتزويدنا بصورة مباشرة على عنواننا أدناه بالمعلومات التالية وذلك في إطار مراجعة حسابات الشركة للسنة المالية المنتهية في ${asOfDate}:

1. أرصدة جميع الحسابات الجارية والادخارية والودائع بتاريخ ${asOfDate}.
2. تفاصيل أي قروض أو تسهيلات ائتمانية قائمة بتاريخ ${asOfDate} (المبلغ، معدل الفائدة، تاريخ الاستحقاق، الضمانات).
3. أي التزامات أو كفالات بنكية.

يُرجى الإفادة في أقرب وقت ممكن.

مع وافر التقدير،

[التوقيع]
${Utils.escapeHtml(firmName)}`
      },
      lawyer: {
        title: `خطاب الاستفسار القانوني — ${year}`,
        addressee: 'محامي الشركة',
        body: `${today}

إلى / الأستاذ [اسم المحامي]
المحامي القانوني لشركة ${Utils.escapeHtml(client?.name || 'العميل')}

السادة المحترمون،

تحية طيبة وبعد،

نتشرف بإبلاغكم أننا نقوم بمراجعة حسابات **${Utils.escapeHtml(client?.name || 'العميل')}** للسنة المالية المنتهية في ${asOfDate}. وعلى ضوء متطلبات معايير المراجعة الدولية (ISA 501)، نأمل التكرم بإفادتنا مباشرة بما يلي:

1. قائمة بجميع الدعاوى القضائية والتحكيمية القائمة أو المتوقعة على الشركة أو من قِبلها.
2. تقديركم لنتائج كل قضية واحتمالية الخسارة والمبالغ المحتملة.
3. أي التزامات عرضية أخرى تعلمون بها.

يُرجى الإفادة في أقرب وقت ممكن.

مع وافر التقدير،

[التوقيع]
${Utils.escapeHtml(firmName)}`
      },
      engagement: {
        title: `خطاب التكليف — السنة المالية ${year}`,
        addressee: `إدارة ${client?.name || 'شركة العميل'}`,
        body: `${today}

إلى / مجلس إدارة
**${Utils.escapeHtml(client?.name || 'شركة العميل')}**

السادة المحترمون،

تحية طيبة وبعد،

يسعدنا تأكيد قبولنا للقيام بمراجعة القوائم المالية لشركتكم الموقرة للسنة المالية المنتهية في ${asOfDate}.

**نطاق عملنا:**
سنقوم بمراجعة القوائم المالية وفق معايير المراجعة الدولية (ISA)، وسيكون رأينا بشأن ما إذا كانت القوائم المالية تعرض بصورة عادلة المركز المالي للشركة وفق معايير المحاسبة الدولية (IFRS).

**مسؤولية الإدارة:**
تتمثل مسؤولية إدارة الشركة في إعداد القوائم المالية التي تعطي صورة صادقة وعادلة وفق الإطار المحاسبي المنطبق، وفي الحفاظ على نظام رقابة داخلية فعّال.

**مسؤولية المراجع:**
مسؤوليتنا تقتصر على إبداء الرأي في القوائم المالية استناداً إلى ما تكشف لنا عن طريق أعمال المراجعة.

**الأتعاب:**
تبلغ أتعاب المراجعة المتفق عليها: [المبلغ] [العملة] تُسدَّد على النحو الآتي: [شروط الدفع].

نأمل تكرّمكم بتوقيع نسخة من هذا الخطاب وإعادتها إلينا قبل الشروع في العمل.

مع وافر التقدير والاحترام،

[التوقيع]
${Utils.escapeHtml(firmName)}

الاعتماد:
مجلس إدارة ${Utils.escapeHtml(client?.name || 'الشركة')}: ..........................   التاريخ: ....................`
      },
      representation: {
        title: `خطاب إقرارات الإدارة — السنة المالية ${year}`,
        addressee: `${Utils.escapeHtml(firmName)}`,
        body: `${today}

السادة / ${Utils.escapeHtml(firmName)}
مكتب مراجعة حسابات

السادة المحترمون،

نقدّم لكم هذا الخطاب بمناسبة مراجعتكم للقوائم المالية لشركة **${Utils.escapeHtml(client?.name || 'الشركة')}** كما في ${asOfDate} وللسنة المنتهية في ذلك التاريخ، بغرض إبداء رأيكم فيما إذا كانت هذه القوائم المالية تعرض بصورة عادلة، من جميع النواحي الجوهرية، المركز المالي ونتائج الأعمال والتدفقات النقدية للشركة وفقاً للمعايير الدولية لإعداد التقارير المالية (IFRS).

نُقرّ ونؤكد لكم، على حد علمنا واعتقادنا، وبعد إجراء الاستفسارات التي رأيناها مناسبة، ما يلي:

**مسؤوليتنا عن القوائم المالية**
1. أوفينا بمسؤوليتنا عن إعداد وعرض القوائم المالية بصورة عادلة وفقاً للمعايير الدولية لإعداد التقارير المالية (IFRS).
2. تتضمّن القوائم المالية كافة الإفصاحات اللازمة وفق الإطار المحاسبي المعمول به.
3. السياسات المحاسبية المُطبَّقة ملائمة ومطبَّقة بصورة ثابتة، وقد أُفصح عنها بشكل مناسب.
4. الافتراضات والتقديرات المحاسبية الجوهرية معقولة.

**اكتمال المعلومات**
5. أتحنا لكم إمكانية الوصول الكامل إلى جميع السجلات والمستندات والمعلومات ذات الصلة بإعداد القوائم المالية، وكافة المعاملات مُسجَّلة ومُنعكسة بالكامل في القوائم المالية.
6. أطلعناكم على محاضر اجتماعات المساهمين ومجلس الإدارة (أو ملخصات لها) ذات الصلة.

**الغش والمخالفات**
7. أقررنا بمسؤوليتنا عن تصميم وتنفيذ والمحافظة على نظام رقابة داخلية لمنع واكتشاف الغش والخطأ.
8. أفصحنا لكم عن نتائج تقييمنا لمخاطر احتمال أن تكون القوائم المالية محرَّفة جوهرياً نتيجة غش.
9. أفصحنا لكم عن جميع حالات الغش الفعلي أو المشتبه به التي نعلم بها والتي تشمل الإدارة، أو الموظفين الذين لهم دور جوهري في الرقابة الداخلية، أو آخرين حيث يمكن أن يكون للغش أثر جوهري على القوائم المالية.
10. أفصحنا لكم عن جميع المعلومات المتعلقة بادعاءات الغش أو الاشتباه فيه، الواردة من الموظفين أو الجهات الرقابية أو أطراف أخرى.
11. أفصحنا لكم عن جميع حالات عدم الامتثال الفعلي أو المحتمل للقوانين واللوائح التي ينبغي أخذها في الاعتبار عند إعداد القوائم المالية.

**التحريفات**
12. أُدرجت في الجدول المرفق (إن وُجد) قائمة بالتحريفات غير المُصحَّحة التي جمّعتموها أثناء المراجعة، ونرى أن أثرها غير جوهري، سواء منفردة أو مجتمعة، على القوائم المالية ككل:
${uncorrectedList}

**الأطراف ذوو العلاقة**
13. أفصحنا لكم عن هوية الأطراف ذوي العلاقة بالشركة وجميع العلاقات والمعاملات معهم التي نعلم بها.

${gc ? `**الاستمرارية**
14. ${gc.conclusion === 'no_material_uncertainty'
    ? 'نرى أن الشركة قادرة على الاستمرار في أعمالها في المستقبل المنظور، ولا توجد شكوك جوهرية تُثير شكاً كبيراً حول قدرتها على الاستمرار.'
    : 'أفصحنا لكم عن جميع الأمور المتعلقة بقدرة الشركة على الاستمرار في أعمالها، بما في ذلك الخطط المستقبلية ذات الصلة.'}

` : ''}**الأحداث اللاحقة**
${gc ? '15' : '14'}. أُخذت في الاعتبار كافة الأحداث اللاحقة لتاريخ القوائم المالية وحتى تاريخ هذا الخطاب التي قد تستدعي تعديلاً أو إفصاحاً في القوائم المالية، وقد عُدِّلت القوائم المالية أو أُفصح عنها بشكل مناسب، بحسب الحالة.

**الالتزامات والدعاوى**
${gc ? '16' : '15'}. أفصحنا لكم عن جميع الالتزامات المحتملة والدعاوى القضائية الفعلية أو المحتملة التي قد يكون لها تأثير على القوائم المالية، سواء أُخذت هذه الأمور برأي محامٍ أم لا.

مع وافر التقدير والاحترام،

[التوقيع]
الرئيس التنفيذي / المدير المالي
${Utils.escapeHtml(client?.name || 'الشركة')}

التاريخ: ${today}`
      },
      governance: {
        title: `التواصل مع المسؤولين عن الحوكمة — السنة المالية ${year}`,
        addressee: `مجلس إدارة / لجنة المراجعة — ${client?.name || 'الشركة'}`,
        body: `${today}

إلى / السادة أعضاء مجلس الإدارة ولجنة المراجعة الموقرين
**${Utils.escapeHtml(client?.name || 'الشركة')}**

السادة المحترمون،

وفقاً لمعيار المراجعة الدولي ISA 260 (التواصل مع المسؤولين عن الحوكمة)، نتشرف بتلخيص أهم الأمور المتعلقة بمراجعتنا للقوائم المالية للسنة المنتهية في ${asOfDate}:

**1. نطاق وتوقيت المراجعة**
أجرينا المراجعة وفقاً لمعايير المراجعة الدولية (ISA)، بهدف إبداء رأي مستقل حول ما إذا كانت القوائم المالية معدَّة، من جميع النواحي الجوهرية، وفقاً للمعايير الدولية لإعداد التقارير المالية (IFRS).

**2. استقلالية المراجع**
نؤكد لكم استقلاليتنا كمكتب مراجعة عن الشركة، وعدم وجود أي علاقات أو خدمات أخرى تُخلّ بهذه الاستقلالية وفق متطلبات أخلاقيات المهنة المعمول بها.

**3. أوجه القصور الجوهرية في الرقابة الداخلية**
${(() => {
  const icFindings = openFindingsForLetter.filter(f => (f.category || '').includes('رقاب') || (f.category || '').toLowerCase().includes('control'));
  if (icFindings.length === 0) return 'لم يتم رصد أوجه قصور جوهرية في نظام الرقابة الداخلية تستدعي الإفصاح عنها لكم بشكل منفصل.';
  return icFindings.map((f, i) => `${i+1}. ${f.title}${f.description ? ' — ' + f.description : ''}`).join('\n');
})()}

**4. الملاحظات والتحريفات غير المُصحَّحة**
${uncorrectedList}

**5. الأمور الجوهرية التي نوقشت مع الإدارة**
تمت مناقشة السياسات المحاسبية الجوهرية والتقديرات المحاسبية ذات الأثر الأكبر على القوائم المالية مع إدارة الشركة أثناء سير أعمال المراجعة، ولم تنشأ أي خلافات جوهرية مع الإدارة حول هذه الأمور${openFindingsForLetter.length > 0 ? ' باستثناء ما ورد أعلاه' : ''}.

${gc && gc.conclusion !== 'no_material_uncertainty' ? `**6. شكوك جوهرية حول الاستمرارية**
نلفت انتباهكم إلى وجود شكوك جوهرية تتعلق بقدرة الشركة على الاستمرار في أعمالها، والتي تم تقييمها وفق ISA 570. ${gc.managementPlans ? 'اطلعنا على خطط الإدارة لمعالجة هذه الشكوك: ' + gc.managementPlans + '.' : 'نوصي بمناقشة خطط الإدارة لمعالجة هذه الشكوك بشكل مفصّل مع المجلس.'}

` : ''}**${gc && gc.conclusion !== 'no_material_uncertainty' ? '7' : '6'}. الأهمية النسبية**
${mat ? `تم تحديد الأهمية النسبية الإجمالية بمبلغ ${Utils.formatCurrency(mat.overallMat, currency)} بناءً على ${mat.benchmark === 'revenue' ? 'الإيرادات' : mat.benchmark === 'totalAssets' ? 'إجمالي الأصول' : 'مؤشر مالي مناسب'}.` : 'لم يتم توثيق احتساب الأهمية النسبية بعد.'}

نبقى تحت تصرفكم لمناقشة أي من هذه الأمور بمزيد من التفصيل.

مع وافر التقدير والاحترام،

[التوقيع]
${Utils.escapeHtml(firmName)}`
      },
      management: {
        title: `رسالة الإدارة — ${year}`,
        addressee: `إدارة ${client?.name || ''}`,
        body: `[تُولَّد تلقائياً من الملاحظات المفتوحة]`
      },
      custom: {
        title: '',
        addressee: '',
        body: `${today}\n\nإلى / [الجهة المُرسَل إليها]\n\nالسادة المحترمون،\n\n[نص المراسلة]\n\nمع وافر التقدير،\n\n${Utils.escapeHtml(firmName)}`
      }
    };

    const tpl = templates[type];
    if (tpl) {
      if (titleEl && !titleEl.value) titleEl.value = tpl.title;
      if (bodyEl && (!bodyEl.value || bodyEl.value === '[تُولَّد تلقائياً من الملاحظات المفتوحة]')) bodyEl.value = tpl.body;
    }
  }

  /* ---- Management letter auto-generated from open findings ---- */
  async function generateManagementLetter() {
    if (Utils.blockIfArchive()) return;
    const clientId = App.getActiveClientId();
    if (!clientId) { Utils.showToast('اختر عميلاً أولاً', 'error'); return; }

    const [client, findings, firmName] = await Promise.all([
      AuditDB.get(AuditDB.STORES.CLIENTS, clientId),
      AuditDB.getByClientYear(AuditDB.STORES.FINDINGS, clientId, App.getActiveYear()),
      AuditDB.getSetting('firmName')
    ]);

    const openFindings = findings.filter(f => f.status === 'open' || f.status === 'in-progress');
    const year = client?.financialYear || new Date().getFullYear() - 1;
    const asOfDate = client?.balanceSheetDate ? Utils.formatDate(client.balanceSheetDate) : `31/12/${year}`;
    const today = Utils.todayDisplay();

    const findingsText = openFindings.length === 0
      ? 'لم يتم رصد ملاحظات جوهرية تستدعي الإشارة إليها.'
      : openFindings.map((f, i) => `
${i + 1}. **${f.title}**
   الوصف: ${f.description || '—'}
   التصنيف: ${f.category || '—'} | الخطورة: ${f.severity === 'high' ? 'مرتفعة' : f.severity === 'medium' ? 'متوسطة' : 'منخفضة'}
   الإجراء التصحيحي المقترح: ${f.correctiveAction || 'يرجى مراجعة الملاحظة واتخاذ الإجراء المناسب'}
      `.trim()).join('\n\n');

    openNewLetterModal({
      type:      'management',
      title:     `رسالة الإدارة — السنة المالية ${year}`,
      addressee: `مجلس إدارة ${client?.name || ''}`,
      body:      `${today}

إلى / مجلس إدارة
**${client?.name || 'الشركة'}**

السادة المحترمون،

تحية طيبة وبعد،

نتشرف برفع هذه الرسالة إلى مجلس الإدارة الموقر في إطار المراجعة التي قمنا بها على القوائم المالية لشركتكم عن السنة المالية المنتهية في ${asOfDate}، وذلك وفقاً لمعايير المراجعة الدولية (ISA).

**الملاحظات المُرصَدة خلال أعمال المراجعة:**

${findingsText}

${openFindings.length > 0 ? `
**توصيتنا العامة:**
نوصي الإدارة باتخاذ الإجراءات التصحيحية المشار إليها في أقرب وقت ممكن وإخطارنا بما تم اتخاذه في هذا الشأن.
` : ''}

**شكر وتقدير:**
نود أن نسجّل شكرنا وتقديرنا للسيد الرئيس التنفيذي وكافة موظفي الشركة على التعاون والمساعدة التي قدّموها لنا خلال عملية المراجعة.

مع وافر الاحترام والتقدير،

[التوقيع]
${firmName || 'مكتب المراجعة والمحاسبة'}`,
      status: 'draft'
    });
  }

  async function viewLetter(id) {
    const letter = await AuditDB.get(AuditDB.STORES.LETTERS, id);
    if (!letter) return;
    const firmName = await AuditDB.getSetting('firmName') || '';
    const logo = await AuditDB.getSetting('firmLogo') || '';
    const lt = LETTER_TYPES[letter.type] || LETTER_TYPES.custom;

    // Render a printable HTML view
    const body = `
      <div id="letterPrintArea" style="font-family:var(--font-main);line-height:1.8;color:var(--text-primary);">
        ${logo ? `<div style="text-align:center;margin-bottom:16px;"><img src="${logo}" style="max-height:80px;max-width:200px;object-fit:contain;"></div>` : ''}
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:18px;font-weight:bold;">${Utils.escapeHtml(firmName)}</div>
          <div style="font-size:13px;color:var(--text-muted);">${lt.icon} ${lt.label}</div>
        </div>
        ${letter.addressee ? `<div style="margin-bottom:16px;"><strong>إلى:</strong> ${Utils.escapeHtml(letter.addressee)}</div>` : ''}
        <div style="white-space:pre-wrap;font-size:14px;">${Utils.mdBoldToHtml(Utils.escapeHtml(letter.body))}</div>
      </div>
    `;
    Utils.openModal(letter.title, body, `
      <button class="btn btn-primary" onclick="window.print()">🖨️ طباعة</button>
      <button class="btn btn-secondary" onclick="LettersModule.editLetter(${id});Utils.closeModal()">✏️ تعديل</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إغلاق</button>
    `, 'lg');
  }

  async function editLetter(id) {
    if (Utils.blockIfArchive()) return;
    const letter = await AuditDB.get(AuditDB.STORES.LETTERS, id);
    if (!letter) return;
    openNewLetterModal({ ...letter });
  }

  async function deleteLetter(id) {
    if (Utils.blockIfArchive()) return;
    Utils.confirmDialog('هل تريد حذف هذه المراسلة؟', async () => {
      await AuditDB.delete(AuditDB.STORES.LETTERS, id);
      Utils.showToast('تم حذف المراسلة', 'success');
      renderLetters();
    });
  }

  return { renderLetters, openNewLetterModal, generateManagementLetter, applyTemplate, viewLetter, editLetter, deleteLetter };
})();
