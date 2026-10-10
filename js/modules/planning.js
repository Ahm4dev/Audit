/* ============================================================
   AuditPro - Planning Module
   ISA-compliant audit planning sections
   ============================================================ */

const PlanningModule = (() => {

  /* ---- Planning sections definition (ISA standards) ---- */
  const PLANNING_SECTIONS = [
    {
      id: 'acceptance',
      title: 'قبول واستمرار العميل',
      isaRef: '210, 220',
      icon: '✅',
      items: [
        { id: 'acc1', title: 'تقييم الكفاءة والقدرة على أداء التكليف', desc: 'التحقق من أن المكتب يمتلك الموارد والكفاءات اللازمة لأداء التكليف' },
        { id: 'acc2', title: 'التحقق من استيفاء متطلبات الأخلاقيات', desc: 'التأكد من استيفاء جميع المتطلبات الأخلاقية والمهنية' },
        { id: 'acc3', title: 'تقييم النزاهة الإدارية', desc: 'تقييم نزاهة المالكين والمديرين والمسؤولين عن الحوكمة' },
        { id: 'acc4', title: 'الحصول على اتفاقية التكليف', desc: 'إعداد وتوقيع خطاب التكليف الذي يحدد شروط وأحكام التكليف' },
        { id: 'acc5', title: 'إجراءات قبول العميل الجديد', desc: 'إتمام إجراءات قبول العميل الجديد وفق سياسات المكتب' },
        { id: 'acc6', title: 'إجراءات استمرار العلاقة مع العميل القديم', desc: 'مراجعة معلومات العميل وتقييم استمرارية العلاقة' }
      ]
    },
    {
      id: 'independence',
      title: 'الاستقلالية',
      isaRef: '220',
      icon: '⚖️',
      items: [
        { id: 'ind1', title: 'التحقق من استقلالية أعضاء الفريق', desc: 'الحصول على إقرارات الاستقلالية من جميع أعضاء فريق التكليف' },
        { id: 'ind2', title: 'تحديد التهديدات للاستقلالية', desc: 'تحديد أي تهديدات للاستقلالية واتخاذ إجراءات ضمانية مناسبة' },
        { id: 'ind3', title: 'التحقق من عدم وجود مصالح مالية', desc: 'التأكد من عدم وجود مصالح مالية مباشرة أو غير مباشرة مع العميل' },
        { id: 'ind4', title: 'مراجعة العلاقات الأسرية والشخصية', desc: 'مراجعة العلاقات الأسرية والشخصية القريبة بين أعضاء الفريق وموظفي العميل' },
        { id: 'ind5', title: 'توثيق الضمانات المتخذة', desc: 'توثيق الضمانات والإجراءات المتخذة لمعالجة أي تهديدات للاستقلالية' }
      ]
    },
    {
      id: 'risk_assessment',
      title: 'تقييم المخاطر',
      isaRef: '315',
      icon: '🎯',
      items: [
        { id: 'risk1', title: 'إجراءات تقييم المخاطر', desc: 'تنفيذ إجراءات تقييم المخاطر للحصول على فهم للمنشأة وبيئتها' },
        { id: 'risk2', title: 'تحديد مخاطر التحريف الجوهري', desc: 'تحديد وتقييم مخاطر التحريف الجوهري على مستوى القوائم المالية والبنود' },
        { id: 'risk3', title: 'مخاطر على مستوى القوائم المالية', desc: 'تقييم المخاطر على مستوى القوائم المالية ككل والعوامل المؤثرة' },
        { id: 'risk4', title: 'مخاطر على مستوى التأكيدات', desc: 'تحديد وتقييم مخاطر التحريف الجوهري على مستوى تأكيدات الأرصدة والمعاملات' },
        { id: 'risk5', title: 'المخاطر الجوهرية', desc: 'تحديد المخاطر التي تُقيّم على أنها مخاطر جوهرية وتصميم الإجراءات المناسبة' },
        { id: 'risk6', title: 'تحديث تقييم المخاطر', desc: 'تحديث تقييم المخاطر بناءً على المعلومات الإضافية التي يتم الحصول عليها' }
      ]
    },
    {
      id: 'understanding',
      title: 'فهم المنشأة',
      isaRef: '315',
      icon: '🏢',
      items: [
        { id: 'und1', title: 'فهم الصناعة والبيئة التنظيمية', desc: 'الحصول على فهم لقطاع الصناعة والبيئة التنظيمية والعوامل الخارجية الأخرى' },
        { id: 'und2', title: 'فهم طبيعة المنشأة', desc: 'فهم طبيعة المنشأة بما يشمل عملياتها وهيكلها وطريقة تمويلها' },
        { id: 'und3', title: 'فهم السياسات المحاسبية', desc: 'فهم اختيار وتطبيق السياسات المحاسبية من قبل المنشأة' },
        { id: 'und4', title: 'فهم الأهداف والاستراتيجيات', desc: 'فهم أهداف المنشأة واستراتيجياتها والمخاطر التجارية ذات الصلة' },
        { id: 'und5', title: 'فهم قياس الأداء المالي', desc: 'فهم قياس الأداء المالي وطريقة مراجعة الإدارة لهذا الأداء' },
        { id: 'und6', title: 'اجتماعات مع الإدارة', desc: 'إجراء اجتماعات مع الإدارة للحصول على فهم للمنشأة وعملياتها' }
      ]
    },
    {
      id: 'internal_control',
      title: 'فهم الرقابة الداخلية',
      isaRef: '315',
      icon: '🛡️',
      items: [
        { id: 'ic1', title: 'بيئة الرقابة', desc: 'فهم بيئة الرقابة بما يشمل الالتزام بالنزاهة والقيم الأخلاقية' },
        { id: 'ic2', title: 'عملية تقييم المخاطر بالمنشأة', desc: 'فهم عملية تقييم المخاطر التي تتبعها المنشأة' },
        { id: 'ic3', title: 'أنظمة المعلومات والتواصل', desc: 'فهم أنظمة المعلومات ذات الصلة بإعداد التقارير المالية' },
        { id: 'ic4', title: 'أنشطة الرقابة', desc: 'فهم أنشطة الرقابة ذات الصلة بالمراجعة' },
        { id: 'ic5', title: 'المراقبة والرصد', desc: 'فهم الأنشطة الرئيسية التي تستخدمها المنشأة لمراقبة الرقابة الداخلية' },
        { id: 'ic6', title: 'تقييم فاعلية الرقابة الداخلية', desc: 'تقييم ما إذا كانت ضوابط الرقابة مصممة وتعمل بشكل فعّال' }
      ]
    },
    {
      id: 'fraud_risk',
      title: 'تقييم مخاطر الغش',
      isaRef: '240',
      icon: '🔍',
      items: [
        { id: 'fr1', title: 'نقاش فريق التكليف حول الغش', desc: 'إجراء نقاش بين أعضاء فريق التكليف حول مخاطر الغش' },
        { id: 'fr2', title: 'الاستفسار من الإدارة عن الغش', desc: 'الاستفسار من الإدارة عن الغش المعروف أو المشتبه به أو المتهم' },
        { id: 'fr3', title: 'تحديد مخاطر الغش', desc: 'تحديد مخاطر الغش وتقييمها وتوثيقها' },
        { id: 'fr4', title: 'مخاطر التلاعب في الإيرادات', desc: 'تقييم مخاطر التلاعب في الإيرادات على أنها مخاطر جوهرية' },
        { id: 'fr5', title: 'مخاطر تجاوز الإدارة للضوابط', desc: 'التطرق لمخاطر تجاوز الإدارة لضوابط الرقابة' },
        { id: 'fr6', title: 'مؤشرات الغش', desc: 'مراجعة مؤشرات الغش والإجراءات المتخذة للتصدي لها' }
      ]
    },
    {
      id: 'preliminary_analytics',
      title: 'التحليل المالي الأولي',
      isaRef: '520',
      icon: '📊',
      items: [
        { id: 'pa1', title: 'مقارنة أرقام العام الحالي بالسابق', desc: 'مقارنة المبالغ الفعلية لأرصدة وفئات المعاملات بالفترة المقارنة' },
        { id: 'pa2', title: 'تحليل النسب المالية', desc: 'احتساب ومراجعة النسب المالية الرئيسية ومقارنتها بالقطاع والفترات السابقة' },
        { id: 'pa3', title: 'تحليل الاتجاهات', desc: 'تحليل اتجاهات الأرقام المالية واكتشاف التقلبات غير المعتادة' },
        { id: 'pa4', title: 'تحديد التقلبات غير المعتادة', desc: 'تحديد وتقصي التقلبات غير المعتادة أو غير المتوقعة' },
        { id: 'pa5', title: 'نسب السيولة والربحية', desc: 'تحليل نسب السيولة والربحية والرفع المالي' }
      ]
    },
    {
      id: 'audit_plan',
      title: 'خطة المراجعة',
      isaRef: '300',
      icon: '📋',
      items: [
        { id: 'ap1', title: 'تحديد طبيعة وتوقيت ونطاق الإجراءات', desc: 'تحديد طبيعة وتوقيت ونطاق إجراءات المراجعة المخططة بشكل مفصل' },
        { id: 'ap2', title: 'خطة إجراءات تقييم المخاطر', desc: 'وضع خطة لإجراءات تقييم المخاطر الإضافية' },
        { id: 'ap3', title: 'خطة اختبارات الضوابط', desc: 'تحديد الضوابط التي سيتم اختبارها والإجراءات المناسبة' },
        { id: 'ap4', title: 'خطة الإجراءات التحقيقية', desc: 'وضع خطة للإجراءات التحقيقية والتفصيلية لمعالجة المخاطر المقيّمة' },
        { id: 'ap5', title: 'تخصيص الموارد والمهام', desc: 'تخصيص الموارد وتوزيع المهام على أعضاء الفريق' },
        { id: 'ap6', title: 'توثيق خطة المراجعة', desc: 'توثيق خطة المراجعة وحفظها في ملف التكليف' }
      ]
    },
    {
      id: 'audit_strategy',
      title: 'استراتيجية المراجعة الشاملة',
      isaRef: '300',
      icon: '🗺️',
      items: [
        { id: 'as1', title: 'تحديد خصائص التكليف', desc: 'تحديد خصائص التكليف التي تحدد نطاقه' },
        { id: 'as2', title: 'توقيت أعمال المراجعة', desc: 'التخطيط لتوقيت أعمال المراجعة مع مراعاة أعمال المراجعة المؤقتة ومراجعة التقرير' },
        { id: 'as3', title: 'تحديد اتجاه جهود الفريق', desc: 'التخطيط لتوجيه الجهود نحو المجالات ذات المخاطر العالية' },
        { id: 'as4', title: 'التنسيق مع المراجعين الآخرين', desc: 'التخطيط للتنسيق مع مراجعي الوحدات الفرعية أو الخبراء' },
        { id: 'as5', title: 'الاستعانة بعمل الخبراء', desc: 'تحديد الحاجة للاستعانة بعمل خبراء خارجيين أو داخليين' },
        { id: 'as6', title: 'الإشراف والمراجعة', desc: 'وضع خطة للإشراف على أعضاء الفريق ومراجعة عملهم' }
      ]
    }
  ];

  let planningData = {}; // { [clientId]: { [itemId]: planningRecord } }

  /* ---- Risk register ---- */
  const RISK_LEVEL_MATRIX = {
    'low-low': 'low', 'low-medium': 'low', 'low-high': 'medium',
    'medium-low': 'low', 'medium-medium': 'medium', 'medium-high': 'high',
    'high-low': 'medium', 'high-medium': 'high', 'high-high': 'critical'
  };
  const RISK_LEVEL_LABELS = { low: 'منخفض', medium: 'متوسط', high: 'مرتفع', critical: 'حرج' };
  const RISK_LEVEL_COLORS = {
    low: 'var(--color-success)', medium: 'var(--color-warning)',
    high: 'var(--color-danger)', critical: '#7c1d2e'
  };
  const LIKELIHOOD_LABELS = { low: 'منخفض', medium: 'متوسط', high: 'مرتفع' };

  /* ---- إضافة: تقييم المخاطر على مستوى التوكيدات (ISA 315 المُعدَّل) ----
     التوكيدات السبعة الموحَّدة المستخدمة عملياً لتغطية فئات المعاملات
     وأرصدة الحسابات والعرض والإفصاح معاً (نموذج مبسّط شائع الاستخدام). */
  const ASSERTIONS = {
    occurrence_existence: { code: 'O/E',  label: 'الحدوث / الوجود',           desc: 'المعاملات والأرصدة المُسجَّلة حدثت/موجودة فعلاً' },
    completeness:         { code: 'C',    label: 'الاكتمال',                  desc: 'كل ما يجب تسجيله مُسجَّل بالفعل دون استبعاد' },
    accuracy_valuation:   { code: 'A/V',  label: 'الدقة / التقييم',           desc: 'المبالغ والبيانات الأخرى مُسجَّلة بدقة وبالتقييم الصحيح' },
    cutoff:               { code: 'CO',   label: 'التوقيت السليم (القطع)',    desc: 'المعاملات مُسجَّلة في الفترة المحاسبية الصحيحة' },
    classification:       { code: 'CL',   label: 'التصنيف',                  desc: 'المعاملات والأرصدة مُصنَّفة في الحسابات المناسبة' },
    rights_obligations:   { code: 'R/O',  label: 'الحقوق والالتزامات',        desc: 'المنشأة تملك الحقوق وعليها الالتزامات المرتبطة بالأرصدة' },
    presentation:         { code: 'P/D',  label: 'العرض والإفصاح',           desc: 'البنود مُصنَّفة ومعروضة ومُفصَح عنها بوضوح ووفق المعايير' }
  };

  const RISK_TYPES = {
    normal:      { label: 'خطر عادي',                color: 'var(--color-info)',    icaRef: '' },
    significant: { label: 'خطر جوهري (Significant)', color: 'var(--color-danger)',  icaRef: 'ISA 315' },
    fraud:       { label: 'خطر غش/احتيال (Fraud)',    color: '#7c1d2e',              icaRef: 'ISA 240' }
  };

  const RISK_SCOPE_LABELS = {
    fs:        'مستوى القوائم المالية ككل (Pervasive)',
    assertion: 'مستوى التوكيد لحساب/فئة معاملات محدّدة'
  };

  /* ---- إضافة: تقييم استمرارية المنشأة (ISA 570 المُعدَّل) ---- */
  const GC_INDICATORS = {
    financial: {
      label: 'مؤشرات مالية',
      items: [
        { id: 'f1', text: 'صافي التزامات متداولة أو صافي أصول متداولة سالب' },
        { id: 'f2', text: 'قروض ذات آجال ثابتة تقترب من الاستحقاق دون احتمال معقول للتجديد أو السداد' },
        { id: 'f3', text: 'اعتماد مفرط على قروض قصيرة الأجل لتمويل أصول طويلة الأجل' },
        { id: 'f4', text: 'مؤشرات على انسحاب الدعم المالي من الدائنين أو المساهمين' },
        { id: 'f5', text: 'قوائم مالية تاريخية أو متوقعة تُظهر تدفقات نقدية تشغيلية سالبة' },
        { id: 'f6', text: 'مؤشرات مالية رئيسية سلبية (سيولة، ربحية، رافعة مالية)' },
        { id: 'f7', text: 'خسائر تشغيلية جوهرية أو تدهور كبير في قيمة الأصول المولّدة للتدفقات النقدية' },
        { id: 'f8', text: 'متأخرات أو توقف توزيعات الأرباح' },
        { id: 'f9', text: 'عجز عن سداد الدائنين في مواعيد استحقاقهم' },
        { id: 'f10', text: 'عجز عن الامتثال لشروط اتفاقيات القروض (Covenants)' },
        { id: 'f11', text: 'تحوّل من التعامل بالائتمان إلى الدفع نقداً مع الموردين' },
        { id: 'f12', text: 'عجز عن الحصول على تمويل ضروري لتطوير منتج جديد أو استثمار أساسي آخر' }
      ]
    },
    operating: {
      label: 'مؤشرات تشغيلية',
      items: [
        { id: 'o1', text: 'نية الإدارة تصفية المنشأة أو التوقف عن العمليات' },
        { id: 'o2', text: 'فقدان الإدارة الرئيسية دون إحلال' },
        { id: 'o3', text: 'فقدان سوق رئيسي، أو ترخيص رئيسي، أو مورّد رئيسي' },
        { id: 'o4', text: 'صعوبات في العمالة أو نقص في الإمدادات المهمة' },
        { id: 'o5', text: 'ظهور منافس ناجح جداً يهدد المركز التنافسي للمنشأة' }
      ]
    },
    other: {
      label: 'مؤشرات أخرى',
      items: [
        { id: 'x1', text: 'عدم الامتثال لمتطلبات رأس المال أو المتطلبات القانونية الأخرى' },
        { id: 'x2', text: 'دعاوى قضائية أو تنظيمية معلّقة قد تنشأ عنها مطالبات يستبعد الوفاء بها' },
        { id: 'x3', text: 'تغييرات في التشريع أو السياسة الحكومية يُتوقّع أن تؤثر سلباً على المنشأة' },
        { id: 'x4', text: 'كوارث غير مؤمَّن عليها بشكل كافٍ عند حدوثها' }
      ]
    }
  };

  const GC_CONCLUSIONS = {
    no_material_uncertainty: {
      label: 'لا توجد شكوك جوهرية — أساس الاستمرارية ملائم',
      opinionImpact: 'none'
    },
    material_uncertainty_disclosed: {
      label: 'توجد شكوك جوهرية، وقد تم الإفصاح عنها بشكل كافٍ',
      opinionImpact: 'emphasis' // فقرة "شكوك جوهرية حول الاستمرارية" دون تعديل الرأي (ISA 570 فقرة 22-23)
    },
    material_uncertainty_not_disclosed: {
      label: 'توجد شكوك جوهرية، ولم يتم الإفصاح عنها بشكل كافٍ',
      opinionImpact: 'qualified_or_adverse' // رأي متحفظ أو معاكس (ISA 705)
    },
    basis_inappropriate: {
      label: 'أساس الاستمرارية غير ملائم لإعداد القوائم المالية',
      opinionImpact: 'adverse' // رأي معاكس وجوباً (ISA 570 فقرة 21)
    }
  };

  function computeRiskLevel(likelihood, impact) {
    return RISK_LEVEL_MATRIX[`${likelihood}-${impact}`] || 'medium';
  }

  let cachedRisks = [];

  async function loadRisks(clientId) {
    cachedRisks = await AuditDB.getByClientYear(AuditDB.STORES.RISKS, clientId, App.getActiveYear());
    return cachedRisks;
  }

  function buildRiskRegisterHTML(risks, accountNameMap = {}) {
    const unaddressed = risks.filter(r => !r.linkedProcedures || r.linkedProcedures.length === 0).length;
    const noAssertion  = risks.filter(r => !r.account).length;
    const readOnly = App.isEditingBlocked();

    return `
      <div class="card mb-6" id="riskRegisterCard">
        <div class="card-header">
          <div class="card-title">🎯 سجل المخاطر (${risks.length})</div>
          ${readOnly ? '' : `<button class="btn btn-primary btn-sm" onclick="PlanningModule.openRiskModal()">+ إضافة خطر</button>`}
        </div>
        <div class="card-body">
          ${unaddressed > 0 ? `
            <div class="warning-box mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div>يوجد ${unaddressed} خطر غير مرتبط بأي إجراء مراجعة بعد. يُنصح وفق ISA 330 بربط كل خطر بإجراء يعالجه.</div>
            </div>
          ` : ''}
          ${noAssertion > 0 ? `
            <div class="info-box mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <div>يوجد ${noAssertion} خطر بلا حساب/توكيد محدّد (مُسجَّل كخطر عام على مستوى القوائم المالية ككل). راجع ما إذا كان ينبغي تحديد حساب وتوكيدات محدَّدة له وفق ISA 315.</div>
            </div>
          ` : ''}
          ${risks.length === 0 ? `
            <div class="text-sm text-muted" style="padding:16px 0;">لم يتم تسجيل أي مخاطر بعد. أضف المخاطر التي تم تحديدها أثناء فهم المنشأة وبيئتها (ISA 315).</div>
          ` : `
            <div class="risk-register-list">
              ${risks.map(r => {
                const rt = RISK_TYPES[r.riskType] || RISK_TYPES.normal;
                return `
                <div class="risk-register-item">
                  <div class="risk-register-level" style="background:${RISK_LEVEL_COLORS[r.level]}"></div>
                  <div class="risk-register-info">
                    <div class="risk-register-title">${Utils.escapeHtml(r.title)}</div>
                    ${r.description ? `<div class="risk-register-desc">${Utils.escapeHtml(r.description)}</div>` : ''}
                    <div class="risk-register-meta">
                      <span class="badge" style="background:${RISK_LEVEL_COLORS[r.level]};color:#fff;">${RISK_LEVEL_LABELS[r.level]}</span>
                      ${r.riskType && r.riskType !== 'normal' ? `<span class="badge" style="background:${rt.color};color:#fff;">${rt.label}</span>` : ''}
                      <span class="chip">احتمالية: ${LIKELIHOOD_LABELS[r.likelihood]}</span>
                      <span class="chip">الأثر: ${LIKELIHOOD_LABELS[r.impact]}</span>
                      <span class="chip ${(r.linkedProcedures||[]).length===0 ? 'chip-danger' : ''}">
                        ${(r.linkedProcedures||[]).length} إجراء مرتبط
                      </span>
                      ${r.status === 'addressed' ? `<span class="chip" style="color:var(--color-success);">✓ تمت المعالجة</span>` : ''}
                    </div>
                    ${r.account || (r.assertions||[]).length ? `
                      <div class="risk-register-meta" style="margin-top:6px;">
                        ${r.account ? `<span class="chip" style="border:1px solid var(--color-primary);color:var(--color-primary);">📊 ${Utils.escapeHtml(accountNameMap[r.account] || r.account)}</span>` : ''}
                        ${(r.assertions||[]).map(a => `<span class="chip" title="${Utils.escapeHtml(ASSERTIONS[a]?.label || a)}">${Utils.escapeHtml(ASSERTIONS[a]?.code || a)}</span>`).join('')}
                        ${r.riskScope === 'assertion' ? `<span class="chip" style="font-style:italic;">${RISK_SCOPE_LABELS.assertion}</span>` : ''}
                      </div>
                    ` : ''}
                  </div>
                  ${readOnly ? '' : `
                  <div class="risk-register-actions">
                    <button class="btn-icon" title="تعديل" onclick="PlanningModule.openRiskModal(${r.id})">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon" title="حذف" onclick="PlanningModule.deleteRisk(${r.id})">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                  </div>`}
                </div>
              `;}).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  }

  /* ---- Load planning data for active client ---- */
  async function loadPlanningData(clientId) {
    if (!clientId) return;
    const records = await AuditDB.getByClientYear(AuditDB.STORES.PLANNING, clientId, App.getActiveYear());
    planningData[clientId] = {};
    for (const r of records) {
      planningData[clientId][r.item] = r;
    }
  }

  /* ---- Render planning page ---- */
  async function renderPlanning() {
    const container = document.getElementById('planningContent');
    if (!container) return;

    const clientId = App.getActiveClientId();
    if (!clientId) {
      container.innerHTML = Utils.noClientWarning('بدء التخطيط');
      return;
    }

    await loadPlanningData(clientId);
    const data = planningData[clientId] || {};
    const risks = await loadRisks(clientId);
    const isArchive = App.isArchiveMode();
    const readOnly = App.isEditingBlocked();

    // Count completion
    let totalItems = 0, completedItems = 0;
    PLANNING_SECTIONS.forEach(s => {
      totalItems += s.items.length;
      s.items.forEach(item => {
        if (data[item.id]?.status === 'completed') completedItems++;
      });
    });
    const pct = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;

    const overallHTML = `
      <div class="card mb-6">
        <div class="card-body">
          <div style="display:flex;align-items:center;gap:32px;flex-wrap:wrap;">
            <div class="completion-ring">
              ${Utils.progressRingSVG(pct, 120, 10, pct >= 75 ? 'var(--color-success)' : pct >= 40 ? 'var(--color-warning)' : 'var(--color-danger)')}
              <div class="completion-ring-text">
                <div class="completion-ring-pct">${pct}%</div>
                <div class="completion-ring-label">مكتمل</div>
              </div>
            </div>
            <div>
              <div style="font-size:22px;font-weight:700;color:var(--text-primary);margin-bottom:8px;">
                نسبة إتمام مرحلة التخطيط
              </div>
              <div style="color:var(--text-secondary);font-size:14px;margin-bottom:16px;">
                ${completedItems} من ${totalItems} عنصراً مكتملاً
              </div>
              <div class="progress-bar-wrap" style="width:300px;">
                <div class="progress-bar-fill" style="width:${pct}%;background:${pct>=75?'var(--color-success)':pct>=40?'var(--color-warning)':'var(--color-danger)'}"></div>
              </div>
            </div>
            <div style="margin-right:auto;display:flex;gap:12px;">
              ${readOnly ? '' : `
              <button class="btn btn-secondary" onclick="PlanningModule.markAllCompleted()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="20,6 9,17 4,12"/></svg>
                اعتماد الكل
              </button>`}
              <button class="btn btn-secondary" onclick="PlanningModule.printPlanning()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                طباعة
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const sectionsHTML = PLANNING_SECTIONS.map(section => {
      const sectionCompleted = section.items.filter(i => data[i.id]?.status === 'completed').length;
      const sectionTotal = section.items.length;
      const sectionPct = Math.round((sectionCompleted / sectionTotal) * 100);

      const itemsHTML = section.items.map(item => {
        const rec = data[item.id] || {};
        const isCompleted = rec.status === 'completed';
        const isNA = rec.status === 'na';

        return `
          <div class="planning-check-item ${isCompleted ? 'completed' : ''} ${isNA ? 'not-applicable' : ''}" id="pci-${item.id}">
            <input type="checkbox" class="planning-checkbox" id="chk-${item.id}"
              ${isCompleted ? 'checked' : ''} ${readOnly ? 'disabled' : ''}
              onchange="PlanningModule.toggleItem('${item.id}', this.checked)"
            >
            <div class="planning-item-content">
              <div class="planning-item-title">${Utils.escapeHtml(item.title)}</div>
              <div class="planning-item-desc">${Utils.escapeHtml(item.desc)}</div>
              ${rec.completedBy || rec.completedAt ? `
                <div class="text-xs text-muted mt-2">
                  ${rec.completedBy ? `<span>بواسطة: ${Utils.escapeHtml(rec.completedBy)}</span>` : ''}
                  ${rec.completedAt ? `<span style="margin-right:8px;">${Utils.formatDate(rec.completedAt)}</span>` : ''}
                </div>
              ` : ''}
              ${rec.notes ? `<div class="text-xs mt-2" style="color:var(--color-info);background:var(--bg-surface-2);padding:6px 10px;border-radius:4px;border-right:2px solid var(--color-info);">${Utils.escapeHtml(rec.notes)}</div>` : ''}
            </div>
            <div style="display:flex;gap:8px;flex-shrink:0;">
              <button class="btn btn-sm btn-secondary" ${readOnly ? 'disabled' : ''} onclick="PlanningModule.openItemDetails('${item.id}','${Utils.escapeHtml(item.title)}')" title="إضافة ملاحظات">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-sm ${isNA ? 'btn-primary' : 'btn-secondary'}" ${readOnly ? 'disabled' : ''} onclick="PlanningModule.toggleNA('${item.id}')" title="لا ينطبق">
                N/A
              </button>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="accordion-item open mb-4" id="acc-${section.id}">
          <div class="accordion-header" onclick="Utils.toggleAccordion(this)">
            <div class="accordion-title">
              <span style="font-size:20px;">${section.icon}</span>
              <span>${Utils.escapeHtml(section.title)}</span>
              <span class="isa-ref">${section.isaRef}</span>
            </div>
            <div style="display:flex;align-items:center;gap:16px;">
              <span class="badge ${sectionPct === 100 ? 'badge-success' : sectionPct > 0 ? 'badge-warning' : 'badge-neutral'}">
                ${sectionCompleted}/${sectionTotal}
              </span>
              <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </div>
          </div>
          <div class="accordion-body">
            <ul class="planning-checklist">${itemsHTML}</ul>
          </div>
        </div>
      `;
    }).join('');

    const accountCategories = await ProgramsModule.getAllCategories();
    const accountNameMap = {};
    accountCategories.forEach(c => { accountNameMap[c.id] = c.title; });

    const gcRecords = await AuditDB.getByClientYear(AuditDB.STORES.GOING_CONCERN, clientId, App.getActiveYear());
    const gc = gcRecords.length > 0 ? gcRecords[gcRecords.length - 1] : null;

    container.innerHTML = (isArchive ? Utils.archiveBanner(App.getActiveYear(), App.isArchiveEditUnlocked()) : '') + overallHTML + buildGoingConcernHTML(gc, readOnly) + buildRiskRegisterHTML(risks, accountNameMap) + sectionsHTML;
  }

  /* ---- إضافة: بطاقة تقييم استمرارية المنشأة (ISA 570 المُعدَّل) ---- */
  function buildGoingConcernHTML(gc, readOnly) {
    const conclusion = gc?.conclusion || null;
    const conclusionMeta = conclusion ? GC_CONCLUSIONS[conclusion] : null;
    const checkedCount = (gc?.indicators || []).length;

    const statusColor = !conclusion ? 'var(--text-muted)'
      : conclusion === 'no_material_uncertainty' ? 'var(--color-success)'
      : conclusion === 'material_uncertainty_disclosed' ? 'var(--color-warning)'
      : 'var(--color-danger)';

    return `
      <div class="card mb-6" id="goingConcernCard">
        <div class="card-header">
          <div class="card-title">🏢 تقييم استمرارية المنشأة (ISA 570)</div>
          ${readOnly ? '' : `<button class="btn btn-primary btn-sm" onclick="PlanningModule.openGoingConcernModal()">${gc ? 'تعديل التقييم' : 'بدء التقييم'}</button>`}
        </div>
        <div class="card-body">
          ${!gc ? `
            <div class="text-sm text-muted" style="padding:8px 0;">
              لم يبدأ تقييم الاستمرارية بعد. وفق ISA 570 (المُعدَّل)، يجب على المراجع تقييم مدى ملاءمة استخدام
              الإدارة لأساس الاستمرارية في إعداد القوائم المالية، والاستنتاج بشأن وجود شكوك جوهرية من عدمه.
            </div>
          ` : `
            <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:12px;">
              <div style="width:12px;height:12px;border-radius:50%;background:${statusColor};flex-shrink:0;"></div>
              <div style="font-weight:600;color:${statusColor};">${Utils.escapeHtml(conclusionMeta?.label || '—')}</div>
              <span class="chip">${checkedCount} مؤشر مُحدَّد من قائمة ISA 570</span>
            </div>
            ${conclusion && conclusion !== 'no_material_uncertainty' ? `
              <div class="warning-box mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <div>سيؤثر هذا الاستنتاج تلقائياً على صياغة تقرير رأي المراجع (فقرة "شكوك جوهرية حول الاستمرارية" أو تعديل الرأي حسب الحالة).</div>
              </div>
            ` : ''}
            ${gc.managementPlans ? `<div class="text-xs text-muted mb-2"><strong>خطط الإدارة:</strong> ${Utils.escapeHtml(gc.managementPlans)}</div>` : ''}
            ${gc.auditorAssessment ? `<div class="text-xs text-muted"><strong>تقييم المراجع:</strong> ${Utils.escapeHtml(gc.auditorAssessment)}</div>` : ''}
          `}
        </div>
      </div>
    `;
  }

  async function openGoingConcernModal() {
    if (Utils.blockIfArchive()) return;
    const clientId = App.getActiveClientId();
    if (!clientId) return;

    const gcRecords = await AuditDB.getByClientYear(AuditDB.STORES.GOING_CONCERN, clientId, App.getActiveYear());
    const existing = gcRecords.length > 0 ? gcRecords[gcRecords.length - 1] : {};
    const checkedSet = new Set(existing.indicators || []);

    const indicatorsHTML = Object.entries(GC_INDICATORS).map(([groupKey, group]) => `
      <div class="risk-proc-group">
        <div class="risk-proc-group-title">${Utils.escapeHtml(group.label)}</div>
        ${group.items.map(item => `
          <label class="risk-proc-option">
            <input type="checkbox" class="gc-indicator-chk" value="${item.id}" ${checkedSet.has(item.id) ? 'checked' : ''}>
            <span>${Utils.escapeHtml(item.text)}</span>
          </label>
        `).join('')}
      </div>
    `).join('');

    const body = `
      <div class="info-box mb-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div>حدّد المؤشرات المنطبقة (إن وُجدت)، ثم وثّق خطط الإدارة لمعالجتها وتقييمك النهائي كمراجع، واختر الاستنتاج المناسب وفق ISA 570 (المُعدَّل).</div>
      </div>
      <div class="form-group">
        <label class="form-label">مؤشرات الشك في الاستمرارية (حدّد ما ينطبق)</label>
        <div class="risk-proc-picker" style="max-height:220px;">${indicatorsHTML}</div>
      </div>
      <div class="form-group">
        <label class="form-label">خطط الإدارة لمعالجة المؤشرات المُحدَّدة (إن وُجدت)</label>
        <textarea class="form-control textarea-auto" id="gc-mgmt-plans" rows="2" placeholder="مثال: خطة إعادة هيكلة الديون، ضخ رأس مال إضافي، بيع أصول غير أساسية...">${Utils.escapeHtml(existing.managementPlans || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">تقييم المراجع لخطط الإدارة ومدى كفايتها</label>
        <textarea class="form-control textarea-auto" id="gc-auditor-assessment" rows="2" placeholder="تقييمك لواقعية وكفاية خطط الإدارة، والإجراءات الإضافية المُنفَّذة">${Utils.escapeHtml(existing.auditorAssessment || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label required">الاستنتاج النهائي</label>
        <select class="form-control" id="gc-conclusion">
          <option value="">— اختر الاستنتاج —</option>
          ${Object.entries(GC_CONCLUSIONS).map(([k,v]) => `<option value="${k}" ${existing.conclusion===k?'selected':''}>${Utils.escapeHtml(v.label)}</option>`).join('')}
        </select>
      </div>
    `;

    Utils.openModal('تقييم استمرارية المنشأة (ISA 570)', body, `
      <button class="btn btn-primary" id="saveGCBtn">حفظ التقييم</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
    `, 'lg');

    document.getElementById('saveGCBtn').onclick = async () => {
      const conclusion = document.getElementById('gc-conclusion').value;
      if (!conclusion) { Utils.showToast('يرجى اختيار الاستنتاج النهائي', 'error'); return; }

      const indicators = Array.from(document.querySelectorAll('.gc-indicator-chk:checked')).map(el => el.value);
      const record = {
        clientId,
        indicators,
        managementPlans: document.getElementById('gc-mgmt-plans').value.trim(),
        auditorAssessment: document.getElementById('gc-auditor-assessment').value.trim(),
        conclusion
      };

      if (existing.id) {
        await AuditDB.put(AuditDB.STORES.GOING_CONCERN, { ...existing, ...record });
      } else {
        await AuditDB.add(AuditDB.STORES.GOING_CONCERN, record);
      }
      Utils.closeModal();
      Utils.showToast('تم حفظ تقييم الاستمرارية', 'success');
      renderPlanning();
    };
  }

  /* ---- Toggle single item ---- */
  async function toggleItem(itemId, checked) {
    if (Utils.blockIfArchive()) return;
    const clientId = App.getActiveClientId();
    if (!clientId) return;

    const clientSettings = await AuditDB.getSetting('firmName');
    const teamLead = clientSettings || 'المراجع';

    if (!planningData[clientId]) planningData[clientId] = {};
    const existing = planningData[clientId][itemId];

    const newRecord = {
      clientId,
      item:        itemId,
      status:      checked ? 'completed' : 'not-started',
      completedBy: checked ? teamLead : '',
      completedAt: checked ? new Date().toISOString() : '',
      notes:       existing?.notes || ''
    };

    if (existing?.id) {
      await AuditDB.put(AuditDB.STORES.PLANNING, { ...existing, ...newRecord });
    } else {
      const newId = await AuditDB.add(AuditDB.STORES.PLANNING, newRecord);
      newRecord.id = newId;
    }
    planningData[clientId][itemId] = newRecord;

    // Update UI
    const row = document.getElementById(`pci-${itemId}`);
    if (row) row.classList.toggle('completed', checked);

    if (checked) Utils.showToast('تم تأشير العنصر كمكتمل', 'success');
  }

  /* ---- Toggle N/A ---- */
  async function toggleNA(itemId) {
    if (Utils.blockIfArchive()) return;
    const clientId = App.getActiveClientId();
    if (!clientId) return;

    if (!planningData[clientId]) planningData[clientId] = {};
    const existing = planningData[clientId][itemId];
    const isNA = existing?.status === 'na';

    const newRecord = {
      clientId,
      item:   itemId,
      status: isNA ? 'not-started' : 'na',
      notes:  existing?.notes || ''
    };

    if (existing?.id) {
      await AuditDB.put(AuditDB.STORES.PLANNING, { ...existing, ...newRecord });
    } else {
      const newId = await AuditDB.add(AuditDB.STORES.PLANNING, newRecord);
      newRecord.id = newId;
    }
    planningData[clientId][itemId] = newRecord;

    const row = document.getElementById(`pci-${itemId}`);
    if (row) row.classList.toggle('not-applicable', !isNA);
    Utils.showToast(isNA ? 'تم إلغاء تحديد لا ينطبق' : 'تم تحديد لا ينطبق', 'info');
  }

  /* ---- Open item details modal ---- */
  async function openItemDetails(itemId, itemTitle) {
    const clientId = App.getActiveClientId();
    if (!clientId) return;

    if (!planningData[clientId]) planningData[clientId] = {};
    const existing = planningData[clientId][itemId] || {};

    const body = `
      <div class="form-group">
        <label class="form-label">العنصر</label>
        <div style="font-weight:600;padding:8px 0;color:var(--text-primary);">${Utils.escapeHtml(itemTitle)}</div>
      </div>
      <div class="form-group">
        <label class="form-label">الحالة</label>
        <select class="form-control" id="pd-status">
          <option value="not-started" ${existing.status === 'not-started' || !existing.status ? 'selected' : ''}>لم يبدأ</option>
          <option value="in-progress" ${existing.status === 'in-progress' ? 'selected' : ''}>جارٍ التنفيذ</option>
          <option value="completed"   ${existing.status === 'completed'   ? 'selected' : ''}>مكتمل</option>
          <option value="na"          ${existing.status === 'na'          ? 'selected' : ''}>لا ينطبق</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">بواسطة</label>
          <input class="form-control" id="pd-completedBy" type="text" value="${Utils.escapeHtml(existing.completedBy || '')}" placeholder="اسم المراجع">
        </div>
        <div class="form-group">
          <label class="form-label">التاريخ</label>
          <input class="form-control" id="pd-completedAt" type="date" value="${existing.completedAt ? existing.completedAt.split('T')[0] : ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">ملاحظات</label>
        <textarea class="form-control textarea-auto" id="pd-notes" rows="4" placeholder="أي ملاحظات أو تفاصيل تتعلق بهذا العنصر">${Utils.escapeHtml(existing.notes || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">مرجع ورقة العمل</label>
        <input class="form-control" id="pd-wpRef" type="text" value="${Utils.escapeHtml(existing.wpRef || '')}" placeholder="مثال: P-1.1">
      </div>
    `;

    Utils.openModal(`تفاصيل: ${itemTitle}`, body, `
      <button class="btn btn-primary" id="savePlanItemBtn">حفظ</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
    `);

    document.getElementById('savePlanItemBtn').addEventListener('click', async () => {
      const status      = document.getElementById('pd-status').value;
      const completedBy = document.getElementById('pd-completedBy').value.trim();
      const completedAt = document.getElementById('pd-completedAt').value;
      const notes       = document.getElementById('pd-notes').value.trim();
      const wpRef       = document.getElementById('pd-wpRef').value.trim();

      const newRecord = { clientId, item: itemId, status, completedBy, completedAt, notes, wpRef };

      if (existing?.id) {
        await AuditDB.put(AuditDB.STORES.PLANNING, { ...existing, ...newRecord });
      } else {
        const newId = await AuditDB.add(AuditDB.STORES.PLANNING, newRecord);
        newRecord.id = newId;
      }
      planningData[clientId][itemId] = newRecord;

      Utils.showToast('تم حفظ التفاصيل', 'success');
      Utils.closeModal();
      renderPlanning();
    });
  }

  /* ---- Mark all completed ---- */
  async function markAllCompleted() {
    if (Utils.blockIfArchive()) return;
    const clientId = App.getActiveClientId();
    if (!clientId) return;

    Utils.confirmDialog('هل تريد تأشير جميع عناصر التخطيط كمكتملة؟', async () => {
      const firmName = await AuditDB.getSetting('firmName') || 'المراجع';
      if (!planningData[clientId]) planningData[clientId] = {};

      for (const section of PLANNING_SECTIONS) {
        for (const item of section.items) {
          const existing = planningData[clientId][item.id];
          const newRecord = {
            clientId,
            item: item.id,
            status: 'completed',
            completedBy: firmName,
            completedAt: new Date().toISOString(),
            notes: existing?.notes || ''
          };
          if (existing?.id) {
            await AuditDB.put(AuditDB.STORES.PLANNING, { ...existing, ...newRecord });
          } else {
            const newId = await AuditDB.add(AuditDB.STORES.PLANNING, newRecord);
            newRecord.id = newId;
          }
          planningData[clientId][item.id] = newRecord;
        }
      }
      Utils.showToast('تم اعتماد جميع عناصر التخطيط', 'success');
      renderPlanning();
    });
  }

  /* ---- Print planning ---- */
  function printPlanning() {
    window.print();
  }

  /* ---- Get planning completion for dashboard ---- */
  async function getPlanningCompletion(clientId) {
    const client = await AuditDB.get(AuditDB.STORES.CLIENTS, clientId);
    const records = await AuditDB.getByClientYear(AuditDB.STORES.PLANNING, clientId, client?.financialYear);
    let total = 0, completed = 0;
    PLANNING_SECTIONS.forEach(s => {
      total += s.items.length;
      s.items.forEach(item => {
        const rec = records.find(r => r.item === item.id);
        if (rec?.status === 'completed') completed++;
      });
    });
    return { total, completed, pct: total ? Math.round((completed / total) * 100) : 0 };
  }

  /* ============================================================
     RISK REGISTER MODAL
     ربط كل خطر محدد بإجراءات المراجعة التي تعالجه (ISA 315/330)
     ============================================================ */
  async function openRiskModal(riskId) {
    if (Utils.blockIfArchive()) return;
    const clientId = App.getActiveClientId();
    if (!clientId) return;

    const existing = riskId ? cachedRisks.find(r => r.id === riskId) || await AuditDB.get(AuditDB.STORES.RISKS, riskId) : {};
    const categories = await ProgramsModule.getAllCategories();
    const groups = {};
    categories.forEach(c => { (groups[c.group] = groups[c.group] || []).push(c); });

    const linked = new Set(existing.linkedProcedures || []);

    const procPickerHTML = Object.entries(groups).map(([groupName, cats]) => `
      <div class="risk-proc-group">
        <div class="risk-proc-group-title">${Utils.escapeHtml(groupName)}</div>
        ${cats.map(cat => `
          <div class="risk-proc-cat-block" data-cat-id="${cat.id}">
            ${cat.procedures.map(proc => {
              const key = cat.id + ':' + proc.num;
              return `
                <label class="risk-proc-option" data-cat="${cat.id}">
                  <input type="checkbox" value="${key}" ${linked.has(key) ? 'checked' : ''}>
                  <span>${Utils.escapeHtml(cat.title)} — ${Utils.escapeHtml(proc.title)}</span>
                </label>
              `;
            }).join('')}
          </div>
        `).join('')}
      </div>
    `).join('');

    const accountOptionsHTML = Object.entries(groups).map(([groupName, cats]) => `
      <optgroup label="${Utils.escapeHtml(groupName)}">
        ${cats.map(c => `<option value="${c.id}" ${existing.account === c.id ? 'selected' : ''}>${Utils.escapeHtml(c.title)}</option>`).join('')}
      </optgroup>
    `).join('');

    const existingAssertions = new Set(existing.assertions || []);
    const assertionsHTML = Object.entries(ASSERTIONS).map(([key, a]) => `
      <label class="risk-proc-option" title="${Utils.escapeHtml(a.desc)}">
        <input type="checkbox" class="rk-assertion-chk" value="${key}" ${existingAssertions.has(key) ? 'checked' : ''}>
        <span><strong>${a.code}</strong> — ${Utils.escapeHtml(a.label)}</span>
      </label>
    `).join('');

    const body = `
      <div class="form-group">
        <label class="form-label required">عنوان الخطر</label>
        <input class="form-control" id="rk-title" type="text" value="${Utils.escapeHtml(existing.title || '')}" placeholder="مثال: خطر مبالغة في الإيرادات بسبب ضغط تحقيق أهداف">
      </div>
      <div class="form-group">
        <label class="form-label">الوصف</label>
        <textarea class="form-control textarea-auto" id="rk-desc" rows="2" placeholder="وصف الخطر ومصدره">${Utils.escapeHtml(existing.description || '')}</textarea>
      </div>

      <div class="info-box mb-3" style="font-size:12px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div>تحديد الحساب/البند والتوكيدات المتأثرة مطلوب وفق ISA 315 (المُعدَّل) لربط المخاطر بمستوى التأكيد لا فقط بمستوى القوائم المالية ككل.</div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">الحساب / البند في القوائم المالية</label>
          <select class="form-control" id="rk-account">
            <option value="">— غير محدّد (خطر عام) —</option>
            ${accountOptionsHTML}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">مستوى الخطر</label>
          <select class="form-control" id="rk-scope">
            <option value="fs" ${(!existing.riskScope || existing.riskScope==='fs') ? 'selected' : ''}>${RISK_SCOPE_LABELS.fs}</option>
            <option value="assertion" ${existing.riskScope==='assertion' ? 'selected' : ''}>${RISK_SCOPE_LABELS.assertion}</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">التوكيدات المتأثرة (ISA 315)</label>
        <div class="risk-proc-picker" style="max-height:160px;">${assertionsHTML}</div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">نوع الخطر</label>
          <select class="form-control" id="rk-type">
            ${Object.entries(RISK_TYPES).map(([k,v]) => `<option value="${k}" ${(existing.riskType||'normal')===k?'selected':''}>${v.label}${v.icaRef ? ' — ' + v.icaRef : ''}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">الاحتمالية</label>
          <select class="form-control" id="rk-likelihood">
            <option value="low" ${existing.likelihood==='low'?'selected':''}>منخفضة</option>
            <option value="medium" ${(!existing.likelihood||existing.likelihood==='medium')?'selected':''}>متوسطة</option>
            <option value="high" ${existing.likelihood==='high'?'selected':''}>مرتفعة</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">الأثر</label>
          <select class="form-control" id="rk-impact">
            <option value="low" ${existing.impact==='low'?'selected':''}>منخفض</option>
            <option value="medium" ${(!existing.impact||existing.impact==='medium')?'selected':''}>متوسط</option>
            <option value="high" ${existing.impact==='high'?'selected':''}>مرتفع</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">حالة المعالجة</label>
        <select class="form-control" id="rk-status">
          <option value="open" ${(!existing.status||existing.status==='open')?'selected':''}>مفتوح</option>
          <option value="addressed" ${existing.status==='addressed'?'selected':''}>تمت المعالجة</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" style="display:flex;align-items:center;justify-content:space-between;">
          <span>الإجراءات التي تعالج هذا الخطر (الاستجابة وفق ISA 330)</span>
          <label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:12px;cursor:pointer;">
            <input type="checkbox" id="rk-filter-by-account">
            عرض إجراءات الحساب المُختار فقط
          </label>
        </label>
        <div class="risk-proc-picker" id="rk-proc-picker">${procPickerHTML || '<div class="text-xs text-muted">لا توجد بنود مراجعة متاحة</div>'}</div>
      </div>
    `;

    Utils.openModal(riskId ? 'تعديل الخطر' : 'إضافة خطر جديد', body, `
      <button class="btn btn-primary" id="saveRiskBtn">حفظ</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
    `, 'lg');

    // تصفية قائمة الإجراءات لتعرض فقط إجراءات الحساب المُختار، لتسهيل
    // ربط الخطر باستجابة (إجراء) من نفس الحساب فعلياً وفق ISA 330
    const accountSelect = document.getElementById('rk-account');
    const filterChk = document.getElementById('rk-filter-by-account');
    const applyProcFilter = () => {
      const selectedCat = accountSelect.value;
      const shouldFilter = filterChk.checked && !!selectedCat;
      document.querySelectorAll('#rk-proc-picker .risk-proc-cat-block').forEach(block => {
        block.style.display = (!shouldFilter || block.dataset.catId === selectedCat) ? '' : 'none';
      });
      document.querySelectorAll('#rk-proc-picker .risk-proc-group').forEach(group => {
        const anyVisible = Array.from(group.querySelectorAll('.risk-proc-cat-block')).some(b => b.style.display !== 'none');
        group.style.display = anyVisible ? '' : 'none';
      });
    };
    accountSelect.addEventListener('change', applyProcFilter);
    filterChk.addEventListener('change', applyProcFilter);

    document.getElementById('saveRiskBtn').onclick = async () => {
      const title = document.getElementById('rk-title').value.trim();
      if (!title) { Utils.showToast('يرجى إدخال عنوان الخطر', 'error'); return; }

      const likelihood = document.getElementById('rk-likelihood').value;
      const impact = document.getElementById('rk-impact').value;
      const linkedProcedures = Array.from(document.querySelectorAll('.risk-proc-picker input[type="checkbox"]:checked')).map(el => el.value);
      const assertions = Array.from(document.querySelectorAll('.rk-assertion-chk:checked')).map(el => el.value);
      const account = document.getElementById('rk-account').value || null;
      const riskScope = document.getElementById('rk-scope').value;
      const riskType = document.getElementById('rk-type').value;

      if (riskScope === 'assertion' && !account) {
        Utils.showToast('يرجى تحديد الحساب/البند عند اختيار "مستوى التوكيد"', 'error');
        return;
      }

      const record = {
        clientId,
        title,
        description: document.getElementById('rk-desc').value.trim(),
        likelihood, impact,
        level: computeRiskLevel(likelihood, impact),
        status: document.getElementById('rk-status').value,
        linkedProcedures,
        account, assertions, riskScope, riskType
      };

      if (riskId) {
        await AuditDB.put(AuditDB.STORES.RISKS, { ...existing, ...record, id: riskId });
      } else {
        await AuditDB.add(AuditDB.STORES.RISKS, record);
      }
      Utils.closeModal();
      Utils.showToast('تم حفظ الخطر', 'success');
      renderPlanning();
    };
  }

  async function deleteRisk(id) {
    if (Utils.blockIfArchive()) return;
    Utils.confirmDialog('هل تريد حذف هذا الخطر من السجل؟', async () => {
      await AuditDB.delete(AuditDB.STORES.RISKS, id);
      Utils.showToast('تم حذف الخطر', 'success');
      renderPlanning();
    });
  }

  return {
    renderPlanning,
    toggleItem,
    toggleNA,
    openItemDetails,
    markAllCompleted,
    printPlanning,
    getPlanningCompletion,
    openRiskModal,
    deleteRisk,
    openGoingConcernModal,
    PLANNING_SECTIONS,
    ASSERTIONS,
    RISK_TYPES,
    RISK_SCOPE_LABELS,
    GC_INDICATORS,
    GC_CONCLUSIONS
  };
})();
