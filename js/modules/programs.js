/* ============================================================
   AuditPro - Audit Programs Module
   33 audit program categories with detailed procedures
   ============================================================ */

const ProgramsModule = (() => {

  /* ---- All audit program categories ---- */
  const AUDIT_CATEGORIES = [
    {
      id: 'cash', title: 'النقدية بالصندوق', group: 'الأصول المتداولة',
      procedures: [
        { num:'C-1', title:'جرد النقدية الفعلي', type:'substantive', desc:'إجراء جرد فعلي لجميع الصناديق في تاريخ الميزانية وإعداد محضر جرد', objective:'التحقق من الوجود والملكية وصحة الرصيد' },
        { num:'C-2', title:'مراجعة ضوابط الصندوق', type:'controls', desc:'تقييم ضوابط الرقابة الداخلية على النقدية بما يشمل الفصل بين الواجبات', objective:'تقييم فاعلية ضوابط الرقابة على النقدية' },
        { num:'C-3', title:'مراجعة إيصالات الصندوق', type:'substantive', desc:'مراجعة عينة من إيصالات الصندوق والتحقق من صحتها واكتمالها', objective:'التحقق من صحة القيود المحاسبية للنقدية' },
        { num:'C-4', title:'التحليل التحليلي للنقدية', type:'analytical', desc:'مقارنة أرصدة النقدية مع الفترات السابقة وتقييم الاتجاهات', objective:'اكتشاف التقلبات غير المعتادة في أرصدة النقدية' }
      ]
    },
    {
      id: 'banks', title: 'البنوك', group: 'الأصول المتداولة',
      procedures: [
        { num:'B-1', title:'الحصول على مصادقات بنكية', type:'substantive', desc:'إرسال طلبات مصادقة مباشرة لجميع البنوك التي تتعامل معها الشركة', objective:'التحقق من أرصدة البنوك والالتزامات البنكية' },
        { num:'B-2', title:'التسويات البنكية', type:'substantive', desc:'مراجعة التسويات البنكية والتحقق من صحتها وصحة البنود غير المسوّاة', objective:'التأكد من صحة أرصدة البنوك في الدفاتر' },
        { num:'B-3', title:'مراجعة كشوف الحسابات البنكية', type:'substantive', desc:'مراجعة كشوف الحسابات البنكية للتحقق من المعاملات غير المعتادة', objective:'اكتشاف المعاملات المشبوهة أو غير المعتادة' },
        { num:'B-4', title:'اختبار الشيكات المعلقة', type:'substantive', desc:'مراجعة الشيكات المعلقة في تاريخ الميزانية والتحقق من صرفها لاحقاً', objective:'التحقق من صحة الشيكات المعلقة في التسويات البنكية' },
        { num:'B-5', title:'ضوابط الرقابة على البنوك', type:'controls', desc:'تقييم ضوابط الرقابة الداخلية على العمليات البنكية', objective:'تقييم فاعلية ضوابط الرقابة على البنوك' }
      ]
    },
    {
      id: 'investments', title: 'الاستثمارات', group: 'الأصول المتداولة',
      procedures: [
        { num:'INV-1', title:'الحصول على مصادقات استثمارية', type:'substantive', desc:'الحصول على تأكيد من الجهات المصدرة أو الوسطاء الماليين', objective:'التحقق من وجود الاستثمارات وحقوق الملكية' },
        { num:'INV-2', title:'مراجعة القيمة العادلة', type:'substantive', desc:'التحقق من صحة القيمة العادلة المُعترف بها وفق المعايير المحاسبية', objective:'التحقق من صحة تقييم الاستثمارات' },
        { num:'INV-3', title:'مراجعة تصنيف الاستثمارات', type:'substantive', desc:'التحقق من صحة تصنيف الاستثمارات (تداول، متاح للبيع، محتفظ به حتى الاستحقاق)', objective:'التحقق من صحة التصنيف وفق المعايير المحاسبية' }
      ]
    },
    {
      id: 'accounts_receivable', title: 'العملاء والمدينون', group: 'الأصول المتداولة',
      procedures: [
        { num:'AR-1', title:'المصادقات الخارجية للعملاء', type:'substantive', desc:'إرسال طلبات مصادقة للعملاء والحصول على ردودهم', objective:'التحقق من أرصدة العملاء من مصادر خارجية' },
        { num:'AR-2', title:'مراجعة قائمة العملاء', type:'substantive', desc:'مراجعة وتحليل قائمة أعمار الديون وتقييم مخصص الديون المشكوك فيها', objective:'التحقق من اكتمال العملاء وصحة المخصصات' },
        { num:'AR-3', title:'إجراءات المصادقة البديلة', type:'substantive', desc:'مراجعة التحصيلات اللاحقة ووثائق الشحن والفواتير للعملاء غير المستجيبين', objective:'التحقق من أرصدة العملاء عند عدم استجابتهم' },
        { num:'AR-4', title:'اختبار قطع الإيرادات', type:'substantive', desc:'مراجعة المبيعات قرب تاريخ الميزانية والتحقق من صحة القطع المحاسبي', objective:'التحقق من تسجيل الإيرادات في الفترة الصحيحة' },
        { num:'AR-5', title:'ضوابط رقابة الائتمان', type:'controls', desc:'تقييم ضوابط الائتمان وإجراءات الموافقة على العملاء', objective:'تقييم فاعلية ضوابط الرقابة على الائتمان' }
      ]
    },
    {
      id: 'notes_receivable', title: 'أوراق القبض', group: 'الأصول المتداولة',
      procedures: [
        { num:'NR-1', title:'فحص أوراق القبض', type:'substantive', desc:'الاطلاع على أوراق القبض الأصلية والتحقق من شروطها وتواريخ استحقاقها', objective:'التحقق من وجود أوراق القبض وشروطها' },
        { num:'NR-2', title:'المصادقات على أوراق القبض', type:'substantive', desc:'الحصول على مصادقات من المدينين بأوراق القبض', objective:'تأكيد أرصدة أوراق القبض من مصادر خارجية' }
      ]
    },
    {
      id: 'inventory', title: 'المخزون', group: 'الأصول المتداولة',
      procedures: [
        { num:'STK-1', title:'حضور جرد المخزون الفعلي', type:'substantive', desc:'الحضور الفعلي لعملية جرد المخزون ومراقبة إجراءاته', objective:'التحقق من وجود المخزون وكميته' },
        { num:'STK-2', title:'مراجعة تقييم المخزون', type:'substantive', desc:'التحقق من صحة تقييم المخزون وفق طريقة التكلفة أو الصافي القابل للتحقق', objective:'التحقق من صحة تقييم المخزون' },
        { num:'STK-3', title:'اختبار قطع المخزون', type:'substantive', desc:'التحقق من صحة قطع حركة المخزون في تاريخ الميزانية', objective:'التحقق من تسجيل حركة المخزون في الفترة الصحيحة' },
        { num:'STK-4', title:'مراجعة المخزون بطيء الحركة', type:'analytical', desc:'تحديد المخزون بطيء الحركة والتقادم وتقييم الحاجة للإهلاك', objective:'التحقق من صحة مخصصات تقادم المخزون' },
        { num:'STK-5', title:'ضوابط رقابة المخزون', type:'controls', desc:'تقييم ضوابط الرقابة على المخزون بما يشمل إجراءات الاستلام والصرف', objective:'تقييم فاعلية ضوابط الرقابة على المخزون' }
      ]
    },
    {
      id: 'prepaid', title: 'المصروفات المقدمة', group: 'الأصول المتداولة',
      procedures: [
        { num:'PP-1', title:'مراجعة المصروفات المقدمة', type:'substantive', desc:'مراجعة بنود المصروفات المقدمة والتحقق من صحة الفترة التي تخصها', objective:'التحقق من صحة تصنيف وتوزيع المصروفات المقدمة' },
        { num:'PP-2', title:'مراجعة وثائق التأمين والإيجار', type:'substantive', desc:'مراجعة بوالص التأمين وعقود الإيجار المدفوعة مسبقاً', objective:'التحقق من صحة المصروفات المقدمة للتأمين والإيجار' }
      ]
    },
    {
      id: 'accrued_revenues', title: 'الإيرادات المستحقة', group: 'الأصول المتداولة',
      procedures: [
        { num:'AR2-1', title:'مراجعة الإيرادات المستحقة', type:'substantive', desc:'التحقق من الإيرادات المستحقة غير المحصلة وأساس احتسابها', objective:'التحقق من اكتمال وصحة الإيرادات المستحقة' },
        { num:'AR2-2', title:'التحقق من التحصيل اللاحق', type:'substantive', desc:'مراجعة التحصيلات اللاحقة للإيرادات المستحقة', objective:'التحقق من قابلية التحصيل' }
      ]
    },
    {
      id: 'fixed_assets', title: 'الأصول الثابتة', group: 'الأصول غير المتداولة',
      procedures: [
        { num:'FA-1', title:'الفحص الفعلي للأصول الثابتة', type:'substantive', desc:'إجراء فحص فعلي لعينة من الأصول الثابتة والتحقق من وجودها وحالتها', objective:'التحقق من وجود الأصول الثابتة وصلاحيتها' },
        { num:'FA-2', title:'مراجعة سجل الأصول الثابتة', type:'substantive', desc:'مراجعة سجل الأصول الثابتة وتتبع الإضافات والتصرفات خلال العام', objective:'التحقق من اكتمال سجل الأصول الثابتة' },
        { num:'FA-3', title:'مراجعة الإضافات للأصول', type:'substantive', desc:'مراجعة الإضافات الجوهرية للأصول الثابتة والتحقق من صحة رسملتها', objective:'التحقق من صحة تصنيف الإضافات' },
        { num:'FA-4', title:'مراجعة الاستهلاك', type:'substantive', desc:'التحقق من صحة معدلات الاستهلاك وطرق الاحتساب وتطبيقها باتساق', objective:'التحقق من صحة مصروف الاستهلاك' },
        { num:'FA-5', title:'مراجعة التصرفات في الأصول', type:'substantive', desc:'مراجعة عمليات بيع أو التخلص من الأصول وصحة احتساب الأرباح والخسائر', objective:'التحقق من صحة تسجيل التصرفات في الأصول' },
        { num:'FA-6', title:'مراجعة انخفاض قيمة الأصول', type:'analytical', desc:'تقييم مؤشرات انخفاض قيمة الأصول الثابتة', objective:'التحقق من الاعتراف بانخفاض القيمة عند الاقتضاء' }
      ]
    },
    {
      id: 'intangibles', title: 'الأصول غير الملموسة', group: 'الأصول غير المتداولة',
      procedures: [
        { num:'IA-1', title:'مراجعة الأصول غير الملموسة', type:'substantive', desc:'مراجعة طبيعة وتقييم الأصول غير الملموسة واستيفاء شروط الاعتراف', objective:'التحقق من صحة الاعتراف بالأصول غير الملموسة' },
        { num:'IA-2', title:'مراجعة الشهرة', type:'substantive', desc:'مراجعة شهرة المحل واختبار انخفاض قيمتها السنوي', objective:'التحقق من صحة تقييم شهرة المحل' },
        { num:'IA-3', title:'مراجعة مصاريف التطوير', type:'substantive', desc:'التحقق من استيفاء مصاريف التطوير لمعايير الرسملة', objective:'التحقق من صحة رسملة مصاريف التطوير' }
      ]
    },
    {
      id: 'investment_properties', title: 'الاستثمارات العقارية', group: 'الأصول غير المتداولة',
      procedures: [
        { num:'IP-1', title:'مراجعة وثائق ملكية العقارات', type:'substantive', desc:'مراجعة وثائق الملكية والتسجيل العقاري', objective:'التحقق من ملكية العقارات الاستثمارية' },
        { num:'IP-2', title:'مراجعة تقييمات العقارات', type:'substantive', desc:'مراجعة تقييمات المقيّمين المستقلين للعقارات', objective:'التحقق من صحة تقييم الاستثمارات العقارية' }
      ]
    },
    {
      id: 'accounts_payable', title: 'الموردون والدائنون', group: 'الالتزامات المتداولة',
      procedures: [
        { num:'AP-1', title:'مصادقات الموردين', type:'substantive', desc:'إرسال طلبات مصادقة للموردين الرئيسيين والحصول على ردودهم', objective:'التحقق من أرصدة الموردين من مصادر خارجية' },
        { num:'AP-2', title:'مراجعة كشوفات الموردين', type:'substantive', desc:'مقارنة كشوفات الموردين بأرصدة دفاتر الشركة', objective:'التحقق من صحة أرصدة الموردين والكشف عن الاختلافات' },
        { num:'AP-3', title:'اختبار قطع المشتريات', type:'substantive', desc:'مراجعة المشتريات قرب تاريخ الميزانية للتحقق من صحة القطع', objective:'التحقق من تسجيل المشتريات في الفترة الصحيحة' },
        { num:'AP-4', title:'البحث عن الالتزامات غير المسجلة', type:'substantive', desc:'مراجعة الفواتير اللاحقة والمدفوعات اللاحقة للكشف عن التزامات غير مسجلة', objective:'التحقق من اكتمال الالتزامات المسجلة' }
      ]
    },
    {
      id: 'notes_payable', title: 'أوراق الدفع', group: 'الالتزامات المتداولة',
      procedures: [
        { num:'NP-1', title:'مراجعة أوراق الدفع', type:'substantive', desc:'الاطلاع على أوراق الدفع الأصلية والتحقق من شروطها وتواريخ استحقاقها', objective:'التحقق من صحة أوراق الدفع وشروطها' },
        { num:'NP-2', title:'مصادقات أوراق الدفع', type:'substantive', desc:'الحصول على مصادقات من الدائنين بأوراق الدفع', objective:'تأكيد أرصدة أوراق الدفع من مصادر خارجية' }
      ]
    },
    {
      id: 'accrued_expenses', title: 'المصروفات المستحقة', group: 'الالتزامات المتداولة',
      procedures: [
        { num:'AE-1', title:'مراجعة المصروفات المستحقة', type:'substantive', desc:'مراجعة المصروفات المستحقة والتحقق من أساس احتسابها', objective:'التحقق من اكتمال وصحة المصروفات المستحقة' },
        { num:'AE-2', title:'تحليل المصروفات المستحقة', type:'analytical', desc:'مقارنة المصروفات المستحقة مع الفترات السابقة', objective:'اكتشاف التقلبات غير المعتادة في المصروفات المستحقة' }
      ]
    },
    {
      id: 'loans', title: 'القروض والتمويل', group: 'الالتزامات طويلة الأجل',
      procedures: [
        { num:'LN-1', title:'مصادقات القروض البنكية', type:'substantive', desc:'الحصول على مصادقات بشأن القروض والتمويل من البنوك والجهات المالية', objective:'التحقق من أرصدة القروض من مصادر خارجية' },
        { num:'LN-2', title:'مراجعة عقود القروض', type:'substantive', desc:'مراجعة عقود القروض والتحقق من شروطها وفوائدها وجداول السداد', objective:'التحقق من صحة تسجيل القروض وشروطها' },
        { num:'LN-3', title:'الالتزام ببنود العهود المالية', type:'substantive', desc:'التحقق من التزام الشركة ببنود العهود المالية في عقود القروض', objective:'تقييم خطر الإخلال ببنود العهود' },
        { num:'LN-4', title:'مراجعة مصروف الفائدة', type:'substantive', desc:'احتساب مصروف الفائدة للتحقق من صحة المبلغ المسجل', objective:'التحقق من صحة مصروف الفائدة المسجل' }
      ]
    },
    {
      id: 'taxes', title: 'الضرائب', group: 'الالتزامات الأخرى',
      procedures: [
        { num:'TX-1', title:'مراجعة احتساب ضريبة الدخل', type:'substantive', desc:'مراجعة احتساب ضريبة الدخل الحالية والمؤجلة', objective:'التحقق من صحة احتساب وتسجيل ضريبة الدخل' },
        { num:'TX-2', title:'مراجعة إقرارات ضريبية', type:'substantive', desc:'مراجعة الإقرارات الضريبية المقدمة والحصول على تفاصيل النزاعات الضريبية', objective:'التحقق من الامتثال للالتزامات الضريبية' },
        { num:'TX-3', title:'الضريبة المؤجلة', type:'substantive', desc:'مراجعة الأصول والالتزامات الضريبية المؤجلة', objective:'التحقق من صحة الضريبة المؤجلة' },
        { num:'TX-4', title:'مراجعة ضريبة القيمة المضافة', type:'substantive', desc:'مراجعة إقرارات ضريبة القيمة المضافة والتحقق من الامتثال', objective:'التحقق من صحة معالجة ضريبة القيمة المضافة' }
      ]
    },
    {
      id: 'zakat', title: 'الزكاة', group: 'الالتزامات الأخرى',
      procedures: [
        { num:'ZK-1', title:'مراجعة احتساب الزكاة', type:'substantive', desc:'مراجعة احتساب وعاء الزكاة ومبلغ الزكاة المستحقة', objective:'التحقق من صحة احتساب الزكاة' },
        { num:'ZK-2', title:'مراجعة إقرارات الزكاة', type:'substantive', desc:'مراجعة الإقرارات الزكوية المقدمة لهيئة الزكاة والضريبة والجمارك', objective:'التحقق من الامتثال لمتطلبات الزكاة' }
      ]
    },
    {
      id: 'capital', title: 'رأس المال', group: 'حقوق الملكية',
      procedures: [
        { num:'CAP-1', title:'مراجعة عقد التأسيس والنظام الأساسي', type:'substantive', desc:'مراجعة عقد تأسيس الشركة ونظامها الأساسي وأي تعديلات عليهما', objective:'التحقق من صحة رأس المال ومكوناته' },
        { num:'CAP-2', title:'مراجعة شهادات الأسهم', type:'substantive', desc:'مراجعة سجل المساهمين والتحقق من صحة هيكل رأس المال', objective:'التحقق من صحة توزيع رأس المال' },
        { num:'CAP-3', title:'مراجعة الزيادة في رأس المال', type:'substantive', desc:'مراجعة أي زيادة في رأس المال خلال العام والتحقق من إجراءاتها', objective:'التحقق من صحة إجراءات زيادة رأس المال' }
      ]
    },
    {
      id: 'reserves', title: 'الاحتياطيات', group: 'حقوق الملكية',
      procedures: [
        { num:'RES-1', title:'مراجعة الاحتياطيات', type:'substantive', desc:'مراجعة الاحتياطيات وحركتها خلال العام والتحقق من أساسها القانوني', objective:'التحقق من صحة الاحتياطيات ومستوياتها المطلوبة' },
        { num:'RES-2', title:'الاحتياطي النظامي', type:'substantive', desc:'التحقق من صحة احتساب الاحتياطي النظامي وفق اشتراطات نظام الشركات', objective:'التحقق من الامتثال لمتطلبات الاحتياطي النظامي' }
      ]
    },
    {
      id: 'retained_earnings', title: 'الأرباح المحتجزة', group: 'حقوق الملكية',
      procedures: [
        { num:'RE-1', title:'مراجعة حركة الأرباح المحتجزة', type:'substantive', desc:'مراجعة حركة الأرباح المحتجزة خلال العام بما يشمل توزيعات الأرباح', objective:'التحقق من صحة حركة الأرباح المحتجزة' },
        { num:'RE-2', title:'مراجعة توزيعات الأرباح', type:'substantive', desc:'مراجعة قرارات توزيع الأرباح وتوثيق محاضر اجتماعات مجلس الإدارة', objective:'التحقق من صحة توزيعات الأرباح وتسجيلها' }
      ]
    },
    {
      id: 'revenues', title: 'الإيرادات', group: 'قائمة الدخل',
      procedures: [
        { num:'REV-1', title:'اختبار الاعتراف بالإيرادات', type:'substantive', desc:'التحقق من صحة توقيت الاعتراف بالإيرادات وفق معايير المحاسبة IFRS 15', objective:'التحقق من صحة الاعتراف بالإيرادات' },
        { num:'REV-2', title:'التحليل التحليلي للإيرادات', type:'analytical', desc:'تحليل الإيرادات حسب المنتج والعميل والمنطقة الجغرافية', objective:'اكتشاف التقلبات غير المعتادة في الإيرادات' },
        { num:'REV-3', title:'اختبار قطع الإيرادات', type:'substantive', desc:'التحقق من صحة قطع الإيرادات قرب تاريخ الميزانية', objective:'التحقق من تسجيل الإيرادات في الفترة الصحيحة' },
        { num:'REV-4', title:'اختبار المعاملات الجوهرية', type:'substantive', desc:'فحص المعاملات الجوهرية والاستثنائية في الإيرادات', objective:'التحقق من صحة المعاملات الكبيرة في الإيرادات' },
        { num:'REV-5', title:'مخاطر الغش في الإيرادات', type:'substantive', desc:'تطبيق إجراءات لمعالجة مخاطر الغش في الإيرادات', objective:'الكشف عن التلاعب المحتمل في الإيرادات' }
      ]
    },
    {
      id: 'cost_of_sales', title: 'تكلفة المبيعات', group: 'قائمة الدخل',
      procedures: [
        { num:'COS-1', title:'تحليل تكلفة المبيعات', type:'analytical', desc:'مقارنة تكلفة المبيعات مع الفترات السابقة وتحليل هامش الربح الإجمالي', objective:'اكتشاف التقلبات غير المعتادة في تكلفة المبيعات' },
        { num:'COS-2', title:'مراجعة مكونات تكلفة المبيعات', type:'substantive', desc:'مراجعة المكونات الرئيسية لتكلفة المبيعات والتحقق من صحتها', objective:'التحقق من اكتمال وصحة تكلفة المبيعات' },
        { num:'COS-3', title:'اختبار قطع تكلفة المبيعات', type:'substantive', desc:'التحقق من صحة قطع تكلفة المبيعات قرب تاريخ الميزانية', objective:'التحقق من تسجيل التكلفة في الفترة الصحيحة' }
      ]
    },
    {
      id: 'operating_expenses', title: 'المصروفات التشغيلية', group: 'قائمة الدخل',
      procedures: [
        { num:'OE-1', title:'التحليل التحليلي للمصروفات', type:'analytical', desc:'تحليل المصروفات التشغيلية الرئيسية ومقارنتها بالفترات السابقة والميزانية', objective:'اكتشاف التقلبات غير المعتادة في المصروفات التشغيلية' },
        { num:'OE-2', title:'مراجعة مصاريف الموظفين', type:'substantive', desc:'مراجعة كشوف المرتبات والتحقق من صحة ومنطقية مصاريف الموظفين', objective:'التحقق من صحة وأهلية مصاريف الموظفين' },
        { num:'OE-3', title:'مراجعة الإيجارات والمصاريف العامة', type:'substantive', desc:'مراجعة عقود الإيجار ومصروفات التشغيل العامة', objective:'التحقق من صحة مصاريف الإيجار والمصاريف العامة' }
      ]
    },
    {
      id: 'other_revenues', title: 'الإيرادات الأخرى', group: 'قائمة الدخل',
      procedures: [
        { num:'OR-1', title:'مراجعة الإيرادات الأخرى', type:'substantive', desc:'مراجعة الإيرادات الأخرى والتحقق من طبيعتها وصحة تسجيلها', objective:'التحقق من اكتمال وصحة الإيرادات الأخرى' },
        { num:'OR-2', title:'مراجعة إيرادات الاستثمار', type:'substantive', desc:'التحقق من صحة إيرادات الاستثمار (فوائد، أرباح أسهم، إيرادات إيجارية)', objective:'التحقق من صحة إيرادات الاستثمار' }
      ]
    },
    {
      id: 'other_expenses', title: 'المصروفات الأخرى', group: 'قائمة الدخل',
      procedures: [
        { num:'OX-1', title:'مراجعة المصروفات الأخرى', type:'substantive', desc:'مراجعة المصروفات الأخرى والتحقق من طبيعتها وصحة تسجيلها', objective:'التحقق من اكتمال وصحة المصروفات الأخرى' },
        { num:'OX-2', title:'مراجعة خسائر انخفاض القيمة', type:'substantive', desc:'مراجعة خسائر انخفاض قيمة الأصول المسجلة', objective:'التحقق من صحة خسائر انخفاض القيمة' }
      ]
    },
    {
      id: 'related_parties', title: 'الأطراف ذات العلاقة', group: 'إفصاحات خاصة',
      procedures: [
        { num:'RP-1', title:'تحديد الأطراف ذات العلاقة', type:'substantive', desc:'الحصول على قائمة شاملة بالأطراف ذات العلاقة والتحقق من اكتمالها', objective:'التحقق من اكتمال الإفصاح عن الأطراف ذات العلاقة' },
        { num:'RP-2', title:'مراجعة معاملات الأطراف ذات العلاقة', type:'substantive', desc:'مراجعة جميع المعاملات مع الأطراف ذات العلاقة والتحقق من الإفصاح عنها', objective:'التحقق من صحة تسجيل والإفصاح عن معاملات الأطراف ذات العلاقة' },
        { num:'RP-3', title:'شروط معاملات الأطراف ذات العلاقة', type:'substantive', desc:'التحقق من أن المعاملات تمت بشروط السوق أو الإفصاح في حالة العكس', objective:'التحقق من كفاية الإفصاح عن شروط المعاملات' }
      ]
    },
    {
      id: 'subsequent_events', title: 'الأحداث اللاحقة', group: 'إفصاحات خاصة',
      procedures: [
        { num:'SE-1', title:'مراجعة الأحداث اللاحقة', type:'substantive', desc:'الاستفسار من الإدارة ومراجعة الأحداث اللاحقة حتى تاريخ التقرير', objective:'التحقق من الاعتراف والإفصاح عن الأحداث اللاحقة' },
        { num:'SE-2', title:'مراجعة الأحداث بعد التقرير', type:'substantive', desc:'مراجعة الأحداث التي حدثت بعد تاريخ القوائم المالية وتقييم أثرها', objective:'التحقق من صحة معالجة الأحداث اللاحقة' }
      ]
    },
    {
      id: 'contingencies', title: 'الالتزامات المحتملة', group: 'إفصاحات خاصة',
      procedures: [
        { num:'CON-1', title:'الاستفسار عن الالتزامات المحتملة', type:'substantive', desc:'الاستفسار من الإدارة والمستشارين القانونيين عن الالتزامات المحتملة', objective:'التحقق من اكتمال الإفصاح عن الالتزامات المحتملة' },
        { num:'CON-2', title:'خطابات المستشارين القانونيين', type:'substantive', desc:'الحصول على خطابات تأكيد من المستشارين القانونيين بشأن الدعاوى القضائية', objective:'التحقق من الاعتراف بالالتزامات القانونية' },
        { num:'CON-3', title:'مراجعة الضمانات والكفالات', type:'substantive', desc:'مراجعة الضمانات والكفالات الممنوحة والمستلمة', objective:'التحقق من الإفصاح عن الضمانات والكفالات' }
      ]
    },
    {
      id: 'going_concern', title: 'الاستمرارية', group: 'تقييمات خاصة',
      procedures: [
        { num:'GC-1', title:'تقييم الاستمرارية', type:'substantive', desc:'تقييم قدرة المنشأة على الاستمرار بما يشمل تحليل التدفقات النقدية والسيولة', objective:'تقييم افتراض الاستمرارية للمنشأة' },
        { num:'GC-2', title:'مراجعة خطط الإدارة', type:'substantive', desc:'مراجعة خطط الإدارة للتغلب على أي شكوك جوهرية', objective:'تقييم كفاية خطط الإدارة لمعالجة مخاطر الاستمرارية' },
        { num:'GC-3', title:'مراجعة مؤشرات الاستمرارية', type:'analytical', desc:'تحليل المؤشرات المالية والتشغيلية المرتبطة بالاستمرارية', objective:'تحديد مؤشرات المخاطر المرتبطة بالاستمرارية' }
      ]
    },
    {
      id: 'financial_instruments', title: 'الأدوات المالية', group: 'تقييمات خاصة',
      procedures: [
        { num:'FI-1', title:'تحديد الأدوات المالية', type:'substantive', desc:'تحديد وتصنيف جميع الأدوات المالية وفق IFRS 9', objective:'التحقق من صحة تصنيف الأدوات المالية' },
        { num:'FI-2', title:'قياس الأدوات المالية', type:'substantive', desc:'التحقق من صحة قياس الأدوات المالية بالتكلفة المطفأة أو القيمة العادلة', objective:'التحقق من صحة قياس الأدوات المالية' },
        { num:'FI-3', title:'خسائر الائتمان المتوقعة', type:'substantive', desc:'مراجعة احتساب خسائر الائتمان المتوقعة وفق IFRS 9', objective:'التحقق من صحة مخصص خسائر الائتمان' }
      ]
    },
    {
      id: 'leases', title: 'عقود الإيجار', group: 'تقييمات خاصة',
      procedures: [
        { num:'LS-1', title:'تحديد عقود الإيجار', type:'substantive', desc:'تحديد جميع عقود الإيجار الخاضعة لمعيار IFRS 16', objective:'التحقق من اكتمال الاعتراف بعقود الإيجار' },
        { num:'LS-2', title:'مراجعة احتساب الإيجار', type:'substantive', desc:'التحقق من صحة احتساب حق استخدام الأصل والتزام الإيجار', objective:'التحقق من صحة تطبيق IFRS 16' },
        { num:'LS-3', title:'مراجعة عقود الإيجار التشغيلي', type:'substantive', desc:'مراجعة عقود الإيجار قصيرة الأجل وصغيرة القيمة', objective:'التحقق من الإفصاح الصحيح عن الإيجارات التشغيلية' }
      ]
    },
    {
      id: 'mergers', title: 'الاندماجات والاستحواذات', group: 'تقييمات خاصة',
      procedures: [
        { num:'MA-1', title:'مراجعة اتفاقيات الاستحواذ', type:'substantive', desc:'مراجعة اتفاقيات الاستحواذ وشروطها وتوزيع سعر الشراء', objective:'التحقق من صحة توزيع سعر الشراء وفق IFRS 3' },
        { num:'MA-2', title:'مراجعة المشروعات المشتركة', type:'substantive', desc:'مراجعة اتفاقيات المشروعات المشتركة وتسجيلها', objective:'التحقق من صحة المعالجة المحاسبية للمشروعات المشتركة' }
      ]
    }
  ];

  const TEST_TYPE_LABELS = {
    controls:    'اختبار الضوابط',
    substantive: 'اختبار تحقيقي',
    analytical:  'إجراءات تحليلية'
  };

  const TEST_TYPE_COLORS = {
    controls:    '#1F8377',
    substantive: '#16A34A',
    analytical:  '#D97706'
  };

  /* ---- Group categories ---- */
  /* ---- يجمع البنود الأساسية مع البنود والإجراءات المخصصة التي أضافها المستخدم ---- */
  let CACHED_CATEGORIES = AUDIT_CATEGORIES;
  let CACHED_RISKS = [];

  async function getAllCategories() {
    const [customCats, customProcs] = await Promise.all([
      AuditDB.getAll(AuditDB.STORES.CUSTOM_CATEGORIES),
      AuditDB.getAll(AuditDB.STORES.CUSTOM_PROCEDURE_DEFS)
    ]);

    const merged = AUDIT_CATEGORIES.map(cat => ({
      ...cat,
      procedures: [...cat.procedures, ...customProcs.filter(p => p.categoryId === cat.id)]
    }));

    customCats.forEach(cc => {
      const catId = 'custom-' + cc.id;
      merged.push({
        id: catId,
        title: cc.title,
        group: cc.group || 'بنود مخصصة',
        custom: true,
        customDbId: cc.id,
        procedures: customProcs.filter(p => p.categoryId === catId)
      });
    });

    CACHED_CATEGORIES = merged;
    return merged;
  }

  function risksForProcedure(catId, procNum) {
    const key = catId + ':' + procNum;
    return CACHED_RISKS.filter(r => (r.linkedProcedures || []).includes(key));
  }

  function getGroups(categories) {
    const list = categories || CACHED_CATEGORIES;
    const groups = {};
    list.forEach(cat => {
      if (!groups[cat.group]) groups[cat.group] = [];
      groups[cat.group].push(cat);
    });
    return groups;
  }

  /* ---- Render programs page ---- */
  async function renderPrograms() {
    const container = document.getElementById('programsContent');
    if (!container) return;

    const clientId = App.getActiveClientId();
    if (!clientId) {
      container.innerHTML = Utils.noClientWarning('عرض برامج المراجعة');
      return;
    }

    // Load all procedures for this client + merged category templates (built-in + custom) + linked risks
    const [procedures, categories, risks] = await Promise.all([
      AuditDB.getByClientYear(AuditDB.STORES.PROCEDURES, clientId, App.getActiveYear()),
      getAllCategories(),
      AuditDB.getByClientYear(AuditDB.STORES.RISKS, clientId, App.getActiveYear())
    ]);
    CACHED_RISKS = risks;
    const procMap = {};
    procedures.forEach(p => { procMap[p.category + ':' + p.procedureNum] = p; });

    // Count stats
    const totalProcs = procedures.length;
    const completedProcs = procedures.filter(p => p.status === 'completed').length;
    const exceptionProcs = procedures.filter(p => p.status === 'exception').length;

    const isArchive = App.isArchiveMode();
    const readOnly = App.isEditingBlocked();

    // Build HTML
    const groups = getGroups(categories);
    let html = isArchive ? Utils.archiveBanner(App.getActiveYear(), App.isArchiveEditUnlocked()) : '';

    // Summary bar
    html += `
      <div class="card mb-5">
        <div class="card-body">
          <div style="display:flex;align-items:center;gap:32px;flex-wrap:wrap;">
            <div>
              <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px;">إجمالي الإجراءات</div>
              <div style="font-size:28px;font-weight:700;color:var(--text-primary);" id="programsTotalCount">${totalProcs}</div>
            </div>
            <div>
              <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px;">مكتملة</div>
              <div style="font-size:28px;font-weight:700;color:var(--color-success);" id="programsCompletedCount">${completedProcs}</div>
            </div>
            <div>
              <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px;">استثناءات</div>
              <div style="font-size:28px;font-weight:700;color:var(--color-danger);" id="programsExceptionCount">${exceptionProcs}</div>
            </div>
            <div style="flex:1;min-width:200px;">
              <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">نسبة الإنجاز</div>
              <div class="progress-bar-wrap">
                <div class="progress-bar-fill" id="programsProgressFill" style="width:${totalProcs?Math.round(completedProcs/totalProcs*100):0}%;"></div>
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:4px;" id="programsStatsBar">${totalProcs?Math.round(completedProcs/totalProcs*100):0}%</div>
            </div>
            ${readOnly ? '' : `
            <button class="btn btn-primary" onclick="ProgramsModule.initializeAllProcedures()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 5v14M5 12h14"/></svg>
              تهيئة جميع الإجراءات
            </button>`}
          </div>
        </div>
      </div>
    `;

    // Category navigation: grouped + searchable
    const firstCat = categories[0];

    const groupsHTML = Object.entries(groups).map(([groupName, cats]) => `
      <div class="prog-group" data-group="${Utils.escapeHtml(groupName)}">
        <div class="prog-group-title">${Utils.escapeHtml(groupName)}</div>
        ${cats.map(cat => {
          const catProcs = procedures.filter(p => p.category === cat.id);
          const catCompleted = catProcs.filter(p => p.status === 'completed').length;
          const catTotal = catProcs.length;
          const isFirst = cat.id === firstCat.id;
          return `
            <div class="prog-cat-row">
              <button class="prog-cat-btn ${isFirst ? 'active' : ''}" data-cat="${cat.id}"
                data-search="${Utils.escapeHtml(cat.title)}"
                onclick="ProgramsModule.switchCategory('${cat.id}', this)">
                <span class="prog-cat-btn-label">${cat.custom ? '⭐ ' : ''}${Utils.escapeHtml(cat.title)}</span>
                ${catTotal > 0 ? `<span class="prog-cat-badge ${catCompleted === catTotal ? 'done' : ''}">${catCompleted}/${catTotal}</span>` : ''}
              </button>
              ${cat.custom ? `
                <button type="button" class="prog-cat-delete" title="حذف البند المخصص"
                  onclick="event.stopPropagation();ProgramsModule.deleteCustomCategory(${cat.customDbId})">✕</button>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `).join('');

    html += `
      <div class="card">
        <div class="card-header" style="flex-wrap:wrap;gap:8px;">
          <div class="card-title">برنامج المراجعة - اختر بند المراجعة</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <div class="programs-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="programSearchInput" placeholder="ابحث عن بند المراجعة..." oninput="ProgramsModule.filterCategories(this.value)">
            </div>
            <button class="btn btn-secondary btn-sm" onclick="ProgramsModule.openAddCategoryModal()">+ بند مخصص</button>
          </div>
        </div>
        <div class="programs-layout">
          <aside class="programs-groups" id="programsGroupsPanel">
            ${groupsHTML}
            <div class="prog-group-empty" id="progGroupEmptyMsg" style="display:none;">لا توجد بنود مطابقة للبحث</div>
          </aside>
          <div class="programs-body" id="programCategoryBody">
            ${renderCategoryProcedures(firstCat, procMap)}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    refreshProcedureAttachments(firstCat, procMap, clientId);
  }

  /* ---- Refresh attachment sections for all procedures in a category ---- */
  function refreshProcedureAttachments(cat, procMap, clientId) {
    cat.procedures.forEach(proc => {
      const saved = procMap[cat.id + ':' + proc.num] || {};
      AttachmentsModule.refreshSection('procedure', saved.id, clientId, proc.title);
    });
  }

  /* ---- Filter categories by search term ---- */
  function filterCategories(term) {
    const q = (term || '').trim().toLowerCase();
    const groupEls = document.querySelectorAll('#programsGroupsPanel .prog-group');
    let anyVisible = false;

    groupEls.forEach(groupEl => {
      let groupHasVisible = false;
      groupEl.querySelectorAll('.prog-cat-btn').forEach(btn => {
        const text = (btn.dataset.search || '').toLowerCase();
        const match = !q || text.includes(q);
        btn.style.display = match ? '' : 'none';
        if (match) groupHasVisible = true;
      });
      groupEl.style.display = groupHasVisible ? '' : 'none';
      if (groupHasVisible) anyVisible = true;
    });

    const emptyMsg = document.getElementById('progGroupEmptyMsg');
    if (emptyMsg) emptyMsg.style.display = anyVisible ? 'none' : 'block';
  }

  /* ---- Switch visible category ---- */
  function switchCategory(catId, btn) {
    const cat = CACHED_CATEGORIES.find(c => c.id === catId);
    if (!cat) return;

    // Update active state
    document.querySelectorAll('.prog-cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Render category
    const body = document.getElementById('programCategoryBody');
    if (!body) return;

    const clientId = App.getActiveClientId();
    AuditDB.getByClientYear(AuditDB.STORES.PROCEDURES, clientId, App.getActiveYear()).then(procedures => {
      const procMap = {};
      procedures.forEach(p => { procMap[p.category + ':' + p.procedureNum] = p; });
      body.innerHTML = renderCategoryProcedures(cat, procMap);
      body.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      refreshProcedureAttachments(cat, procMap, clientId);
    });
  }

  /* ---- Render category procedures ---- */
  function renderCategoryProcedures(cat, procMap) {
    const readOnly = App.isEditingBlocked();
    const procRows = cat.procedures.map((proc, idx) => {
      const key    = cat.id + ':' + proc.num;
      const saved  = procMap[key] || {};
      const status = saved.status || 'not-started';

      const statusConfig = {
        'not-started': { icon: '⚪', label: 'لم يبدأ',         cls: 'status-not-started' },
        'in-progress':  { icon: '🔵', label: 'جارٍ التنفيذ',   cls: 'status-in-progress'  },
        'completed':    { icon: '🟢', label: 'مكتمل',          cls: 'status-completed'    },
        'exception':    { icon: '🔴', label: 'استثناء',        cls: 'status-exception'    }
      };
      const sc = statusConfig[status] || statusConfig['not-started'];

      return `
        <div class="procedure-row ${status === 'completed' ? 'proc-done' : ''} ${status === 'exception' ? 'proc-exception' : ''}" id="pr-${cat.id}-${idx}">
          <div class="procedure-header" onclick="ProgramsModule.toggleProcedure('${cat.id}','${idx}','${proc.num}')">
            <div class="procedure-number ${status === 'completed' ? 'proc-num-done' : ''}">${proc.num}</div>
            <div class="procedure-title">${proc.id ? '⭐ ' : ''}${Utils.escapeHtml(proc.title)}</div>
            <span class="proc-type-badge" style="background:${TEST_TYPE_COLORS[proc.type]||'#666'};">
              ${TEST_TYPE_LABELS[proc.type] || proc.type}
            </span>
            <!-- Quick-status buttons: visible WITHOUT opening the accordion -->
            <div class="proc-quick-status" onclick="event.stopPropagation()">
              ${['not-started','in-progress','completed','exception'].map(s => `
                <button class="proc-qs-btn ${s === status ? 'active' : ''}" title="${statusConfig[s].label}" ${readOnly ? 'disabled' : ''}
                  onclick="ProgramsModule.quickSetStatus('${cat.id}','${proc.num}','${idx}','${s}',${saved.id||'null'})">
                  ${statusConfig[s].icon}
                </button>
              `).join('')}
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15" class="proc-chevron">
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </div>
          <div class="procedure-body" id="pb-${cat.id}-${idx}" ${readOnly ? 'style="pointer-events:none;opacity:.75;"' : ''}>
            ${renderProcedureForm(cat, proc, saved)}
          </div>
        </div>
      `;
    }).join('');

    /* Inline add-custom-procedure form (no modal) */
    const addProcInlineId = `add-proc-inline-${cat.id}`;

    return `
      <div class="program-section-title">
        <span>${Utils.escapeHtml(cat.title)} — ${Utils.escapeHtml(cat.group)}</span>
        <span style="font-size:13px;opacity:.8;">${cat.procedures.length} إجراء</span>
      </div>
      ${procRows}
      ${readOnly ? '' : `
      <div class="add-proc-inline-wrap">
        <button class="btn btn-secondary btn-sm" style="margin:12px 16px;"
          onclick="ProgramsModule.toggleAddProcInline('${cat.id}')">
          + إضافة إجراء مخصص لهذا البند
        </button>
        <div class="add-proc-inline-form hidden" id="${addProcInlineId}">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">عنوان الإجراء</label>
              <input class="form-control" id="${addProcInlineId}-title" type="text" placeholder="عنوان الإجراء المخصص">
            </div>
            <div class="form-group">
              <label class="form-label">نوع الاختبار</label>
              <select class="form-control" id="${addProcInlineId}-type">
                <option value="substantive">اختبار تفصيلي</option>
                <option value="controls">اختبار ضوابط</option>
                <option value="analytical">إجراء تحليلي</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">وصف موجز</label>
            <input class="form-control" id="${addProcInlineId}-desc" type="text" placeholder="وصف مختصر (اختياري)">
          </div>
          <div style="display:flex;gap:8px;padding-bottom:4px;">
            <button class="btn btn-primary btn-sm"
              onclick="ProgramsModule.saveInlineProcedure('${cat.id}','${addProcInlineId}')">حفظ الإجراء</button>
            <button class="btn btn-secondary btn-sm"
              onclick="ProgramsModule.toggleAddProcInline('${cat.id}')">إلغاء</button>
          </div>
        </div>
      </div>`}
    `;
  }

  /* ---- Render procedure form ---- */
  /* ---- إصلاح خلل: مزامنة حالة الإجراء بين الأزرار السريعة الخارجية
     والقائمة المنسدلة الداخلية في نموذج الإجراء، في الاتجاهين ---- */
  async function refreshProgramsSummaryBar(clientId) {
    const procs = await AuditDB.getByClientYear(AuditDB.STORES.PROCEDURES, clientId, App.getActiveYear());
    const done = procs.filter(p => p.status === 'completed').length;
    const exceptions = procs.filter(p => p.status === 'exception').length;
    const total = procs.length;
    const pct = total ? Math.round(done / total * 100) : 0;

    const totalEl = document.getElementById('programsTotalCount');
    const doneEl = document.getElementById('programsCompletedCount');
    const excEl = document.getElementById('programsExceptionCount');
    const fillEl = document.getElementById('programsProgressFill');
    const statsEl = document.getElementById('programsStatsBar');

    if (totalEl) totalEl.textContent = total;
    if (doneEl) doneEl.textContent = done;
    if (excEl) excEl.textContent = exceptions;
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (statsEl) statsEl.textContent = `${pct}%`;
  }

  function findProcIndex(catId, procNum) {
    const cat = CACHED_CATEGORIES.find(c => c.id === catId);
    if (!cat) return -1;
    return cat.procedures.findIndex(p => p.num === procNum);
  }

  function syncProcedureRowUI(catId, procNum, newStatus) {
    const idx = findProcIndex(catId, procNum);
    if (idx < 0) return;

    // 1) تحديث الأزرار الخارجية السريعة وتنسيق الصف
    const row = document.getElementById(`pr-${catId}-${idx}`);
    if (row) {
      const statuses = ['not-started','in-progress','completed','exception'];
      row.classList.toggle('proc-done', newStatus === 'completed');
      row.classList.toggle('proc-exception', newStatus === 'exception');
      row.querySelectorAll('.proc-qs-btn').forEach((btn, i) => {
        btn.classList.toggle('active', statuses[i] === newStatus);
      });
      const numEl = row.querySelector('.procedure-number');
      if (numEl) numEl.classList.toggle('proc-num-done', newStatus === 'completed');
    }

    // 2) تحديث القائمة المنسدلة الداخلية في نموذج الإجراء
    const sid = `${catId}_${procNum.replace('-','_')}`;
    const statusSelect = document.getElementById(`${sid}_status`);
    if (statusSelect && statusSelect.value !== newStatus) statusSelect.value = newStatus;
  }

  function renderProcedureForm(cat, proc, saved) {
    const sid = `${cat.id}_${proc.num.replace('-','_')}`;
    const linkedRisks = risksForProcedure(cat.id, proc.num);
    return `
      ${linkedRisks.length > 0 ? `
        <div class="info-box mb-3" style="border-color:var(--color-warning);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div>
            <strong>🎯 يعالج هذا الإجراء ${linkedRisks.length} خطر محدد في سجل المخاطر:</strong><br>
            ${linkedRisks.map(r => Utils.escapeHtml(r.title)).join(' • ')}
          </div>
        </div>
      ` : ''}
      <div class="procedure-grid">
        <div class="form-group">
          <label class="form-label">الهدف من الإجراء</label>
          <div style="font-size:13px;color:var(--text-secondary);padding:8px;background:var(--bg-surface-2);border-radius:6px;">
            ${Utils.escapeHtml(proc.objective)}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">نوع الاختبار</label>
          <div>
            <span style="display:inline-flex;align-items:center;gap:6px;background:${TEST_TYPE_COLORS[proc.type]||'#666'};color:white;padding:4px 12px;border-radius:9px;font-size:13px;">
              ${TEST_TYPE_LABELS[proc.type] || proc.type}
            </span>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">وصف الإجراء</label>
        <div style="font-size:13px;color:var(--text-secondary);padding:8px;background:var(--bg-surface-2);border-radius:6px;">
          ${Utils.escapeHtml(proc.desc)}
        </div>
      </div>
      <div class="procedure-grid">
        <div class="form-group">
          <label class="form-label">تفاصيل التنفيذ</label>
          <textarea class="form-control textarea-auto" id="${sid}_impl" rows="3"
            placeholder="وثّق تفاصيل تنفيذ هذا الإجراء...">${Utils.escapeHtml(saved.implementationDetails || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">نتيجة الفحص</label>
          <textarea class="form-control textarea-auto" id="${sid}_finding" rows="3"
            placeholder="النتائج والأرقام التي توصلت إليها...">${Utils.escapeHtml(saved.finding || '')}</textarea>
        </div>
      </div>
      <div class="procedure-grid">
        <div class="form-group">
          <label class="form-label">الاستنتاج</label>
          <textarea class="form-control textarea-auto" id="${sid}_conclusion" rows="2"
            placeholder="استنتاجك من تنفيذ هذا الإجراء...">${Utils.escapeHtml(saved.conclusion || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">ملاحظات المراجع</label>
          <textarea class="form-control textarea-auto" id="${sid}_notes" rows="2"
            placeholder="أي ملاحظات إضافية...">${Utils.escapeHtml(saved.auditorNotes || '')}</textarea>
        </div>
      </div>
      <div class="procedure-grid">
        <div class="form-group">
          <label class="form-label">مرجع ورقة العمل</label>
          <input class="form-control" id="${sid}_wpRef" type="text"
            value="${Utils.escapeHtml(saved.wpRef || proc.num)}" placeholder="مثال: C-1.1">
        </div>
        <div class="form-group">
          <label class="form-label">حالة الإجراء</label>
          <select class="form-control" id="${sid}_status">
            <option value="not-started" ${saved.status==='not-started'||!saved.status ? 'selected':''}>⚪ لم يبدأ</option>
            <option value="in-progress" ${saved.status==='in-progress' ? 'selected':''}>🔵 جارٍ التنفيذ</option>
            <option value="completed"   ${saved.status==='completed'   ? 'selected':''}>🟢 مكتمل</option>
            <option value="exception"   ${saved.status==='exception'   ? 'selected':''}>🔴 استثناء</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-top:8px;">
        <button class="btn btn-primary btn-sm" onclick="ProgramsModule.saveProcedure('${cat.id}','${proc.num}','${sid}',${saved.id||'null'})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/></svg>
          حفظ
        </button>
        <button class="btn btn-secondary btn-sm" onclick="ProgramsModule.markCompleted('${cat.id}','${proc.num}','${sid}',${saved.id||'null'})">
          ✅ اعتماد كمكتمل
        </button>
        ${saved.status === 'exception' ? `
          <button class="btn btn-danger btn-sm" onclick="ProgramsModule.createFindingFromProcedure('${cat.id}','${proc.num}')">
            ⚠️ إنشاء ملاحظة
          </button>
        ` : ''}
        ${proc.id ? `
          <button class="btn btn-text" style="color:var(--color-danger);" onclick="ProgramsModule.deleteCustomProcedure(${proc.id})">
            🗑️ حذف هذا الإجراء المخصص
          </button>
        ` : ''}
      </div>
      <div class="mt-4">${AttachmentsModule.placeholder('procedure', saved.id)}</div>
    `;
  }

  /* ---- Toggle procedure body ---- */
  async function toggleProcedure(catId, idx, procNum) {
    const row = document.getElementById(`pr-${catId}-${idx}`);
    if (!row) return;

    const opening = !row.classList.contains('open');
    row.classList.toggle('open');
    if (!opening) return; // الإغلاق لا يحتاج أي منطق إضافي

    // إصلاح خلل: المرفقات (وكل شيء آخر يعتمد على معرّف حقيقي) لم تكن
    // تعمل إلا بعد ضغط "حفظ" لأن سجل الإجراء لم يكن موجوداً بعد في
    // قاعدة البيانات. الآن يُنشأ سجل أولي بصمت بمجرد فتح الإجراء لأول
    // مرة (بحالة "لم يبدأ")، دون انتظار أي إجراء من المستخدم.
    const clientId = App.getActiveClientId();
    if (!clientId || Utils.blockIfArchive()) return;

    const cat = CACHED_CATEGORIES.find(c => c.id === catId);
    const proc = cat?.procedures.find(p => p.num === procNum);
    if (!cat || !proc) return;

    const procedures = await AuditDB.getByClientYear(AuditDB.STORES.PROCEDURES, clientId, App.getActiveYear());
    const alreadyExists = procedures.some(p => p.category === catId && p.procedureNum === procNum);
    if (alreadyExists) return; // السجل موجود بالفعل، لا حاجة لإنشاء جديد

    await AuditDB.add(AuditDB.STORES.PROCEDURES, {
      clientId,
      category: catId,
      procedureNum: procNum,
      title: proc.title,
      status: 'not-started'
    });

    // إعادة عرض الفئة بالكامل ببيانات محدَّثة (تتضمّن معرّف السجل الجديد
    // في كل الأزرار المرتبطة به)، مع الإبقاء على هذا الإجراء مفتوحاً
    const body = document.getElementById('programCategoryBody');
    if (body) {
      const refreshedProcedures = await AuditDB.getByClientYear(AuditDB.STORES.PROCEDURES, clientId, App.getActiveYear());
      const procMap = {};
      refreshedProcedures.forEach(p => { procMap[p.category + ':' + p.procedureNum] = p; });
      body.innerHTML = renderCategoryProcedures(cat, procMap);
      const newRow = document.getElementById(`pr-${catId}-${idx}`);
      if (newRow) newRow.classList.add('open');
      refreshProcedureAttachments(cat, procMap, clientId);
    }
  }

  /* ---- Save procedure ---- */
  async function saveProcedure(catId, procNum, sid, existingId) {
    if (Utils.blockIfArchive()) return;
    const clientId = App.getActiveClientId();
    if (!clientId) return;

    const record = {
      clientId,
      category:             catId,
      procedureNum:         procNum,
      title:                CACHED_CATEGORIES.find(c=>c.id===catId)?.procedures.find(p=>p.num===procNum)?.title || '',
      implementationDetails: document.getElementById(`${sid}_impl`)?.value.trim() || '',
      finding:              document.getElementById(`${sid}_finding`)?.value.trim() || '',
      conclusion:           document.getElementById(`${sid}_conclusion`)?.value.trim() || '',
      auditorNotes:         document.getElementById(`${sid}_notes`)?.value.trim() || '',
      wpRef:                document.getElementById(`${sid}_wpRef`)?.value.trim() || procNum,
      status:               document.getElementById(`${sid}_status`)?.value || 'not-started'
    };

    try {
      let savedId;
      if (existingId && existingId !== 'null') {
        await AuditDB.put(AuditDB.STORES.PROCEDURES, { ...record, id: parseInt(existingId) });
        savedId = parseInt(existingId);
      } else {
        // BUG FIX: capture the newly assigned ID so we can refresh the attachment section
        savedId = await AuditDB.add(AuditDB.STORES.PROCEDURES, record);
        // Update the save button to pass the real ID on future clicks (avoiding duplicate records)
        const saveBtn = document.querySelector(`button[onclick*="saveProcedure('${catId}','${procNum}','${sid}',null)"]`);
        if (saveBtn) saveBtn.setAttribute('onclick', `ProgramsModule.saveProcedure('${catId}','${procNum}','${sid}',${savedId})`);
        const completedBtn = document.querySelector(`button[onclick*="markCompleted('${catId}','${procNum}','${sid}',null)"]`);
        if (completedBtn) completedBtn.setAttribute('onclick', `ProgramsModule.markCompleted('${catId}','${procNum}','${sid}',${savedId})`);
      }
      // BUG FIX: refresh attachment section with real ID (fixes "احفظ السجل أولاً" staying after first save)
      AttachmentsModule.refreshSection('procedure', savedId, clientId, record.title);
      // إصلاح خلل: مزامنة الأزرار الخارجية السريعة مع الحالة المحفوظة من النموذج الداخلي
      syncProcedureRowUI(catId, procNum, record.status);
      Utils.showToast('تم حفظ الإجراء', 'success');
      // Refresh the stats bar after a short delay (don't re-render the whole page to keep the form open)
      setTimeout(() => refreshProgramsSummaryBar(clientId), 100);
    } catch(err) {
      Utils.showToast('خطأ في الحفظ', 'error');
      console.error(err);
    }
  }

  /* ---- Mark as completed shortcut ---- */
  async function markCompleted(catId, procNum, sid, existingId) {
    const statusEl = document.getElementById(`${sid}_status`);
    if (statusEl) statusEl.value = 'completed';
    await saveProcedure(catId, procNum, sid, existingId);
    Utils.showToast('تم اعتماد الإجراء كمكتمل', 'success');
  }

  /* ---- Create finding from exception ---- */
  function createFindingFromProcedure(catId, procNum) {
    const procTitle = CACHED_CATEGORIES.find(c => c.id === catId)?.procedures.find(p => p.num === procNum)?.title || procNum;
    App.navigateTo('findings');
    setTimeout(() => {
      FindingsModule.openAddModal({ category: catId, wpRef: procNum, title: `استثناء: ${procTitle}` });
    }, 300);
  }

  /* ---- Initialize all procedures for a client ---- */
  async function initializeAllProcedures() {
    if (Utils.blockIfArchive()) return;
    const clientId = App.getActiveClientId();
    if (!clientId) return;

    Utils.confirmDialog(
      'هل تريد تهيئة جميع إجراءات المراجعة لهذا العميل؟ سيتم إنشاء سجلات لجميع الإجراءات بحالة "لم يبدأ".',
      async () => {
        Utils.showLoading('جارٍ تهيئة الإجراءات...');
        try {
          const existingProcs = await AuditDB.getByClientYear(AuditDB.STORES.PROCEDURES, clientId, App.getActiveYear());
          const existingKeys = new Set(existingProcs.map(p => p.category + ':' + p.procedureNum));
          const categories = await getAllCategories();

          let count = 0;
          for (const cat of categories) {
            for (const proc of cat.procedures) {
              const key = cat.id + ':' + proc.num;
              if (!existingKeys.has(key)) {
                await AuditDB.add(AuditDB.STORES.PROCEDURES, {
                  clientId, category: cat.id, procedureNum: proc.num,
                  title: proc.title, status: 'not-started', wpRef: proc.num,
                  implementationDetails: '', finding: '', conclusion: '',
                  auditorNotes: '', reviewNotes: ''
                });
                count++;
              }
            }
          }
          Utils.hideLoading();
          Utils.showToast(`تم تهيئة ${count} إجراء جديد`, 'success');
          await renderPrograms();
        } catch(err) {
          Utils.hideLoading();
          Utils.showToast('خطأ في التهيئة', 'error');
          console.error(err);
        }
      }
    );
  }

  /* ---- Quick status change (from outside the accordion) ---- */
  async function quickSetStatus(catId, procNum, idx, newStatus, existingId) {
    if (Utils.blockIfArchive()) return;
    const clientId = App.getActiveClientId();
    if (!clientId) return;

    const key = catId + ':' + procNum;
    const cat = CACHED_CATEGORIES.find(c => c.id === catId);
    const proc = cat?.procedures.find(p => p.num === procNum) || {};

    const base = {
      clientId, category: catId, procedureNum: procNum,
      title: CACHED_CATEGORIES.find(c=>c.id===catId)?.procedures.find(p=>p.num===procNum)?.title || '',
      status: newStatus
    };

    let savedId;
    if (existingId && existingId !== 'null') {
      const existing = await AuditDB.get(AuditDB.STORES.PROCEDURES, parseInt(existingId));
      await AuditDB.put(AuditDB.STORES.PROCEDURES, { ...(existing || {}), ...base, id: parseInt(existingId) });
      savedId = parseInt(existingId);
    } else {
      savedId = await AuditDB.add(AuditDB.STORES.PROCEDURES, base);
    }

    // تحديث موحّد لكل من الصف الخارجي والقائمة المنسدلة الداخلية (يُصلح خلل عدم المزامنة)
    syncProcedureRowUI(catId, procNum, newStatus);

    // If exception, auto-expand and prompt
    if (newStatus === 'exception') {
      const body = document.getElementById(`pb-${catId}-${idx}`);
      if (body) body.style.display = 'block';
      const row2 = document.getElementById(`pr-${catId}-${idx}`);
      if (row2 && !row2.classList.contains('open')) row2.classList.add('open');
      Utils.showToast('تم تعيين الإجراء كاستثناء — وثّق التفاصيل في الحقول المفتوحة أدناه', 'warning');
    } else {
      Utils.showToast('تم تحديث حالة الإجراء', 'success');
    }

    // Update save buttons inside the accordion body to use real savedId
    const body = document.getElementById(`pb-${catId}-${idx}`);
    if (body) {
      const sid = `${catId}_${procNum.replace('-','_')}`;
      body.querySelectorAll('[onclick*="saveProcedure"]').forEach(btn => {
        btn.setAttribute('onclick', `ProgramsModule.saveProcedure('${catId}','${procNum}','${sid}',${savedId})`);
      });
      body.querySelectorAll('[onclick*="markCompleted"]').forEach(btn => {
        btn.setAttribute('onclick', `ProgramsModule.markCompleted('${catId}','${procNum}','${sid}',${savedId})`);
      });
      // Refresh attachment section now we have a real id
      const procTitleForAttach = CACHED_CATEGORIES.find(c => c.id === catId)?.procedures.find(p => p.num === procNum)?.title || '';
      AttachmentsModule.refreshSection('procedure', savedId, clientId, procTitleForAttach);
    }

    // Update global stats bar live (الأعداد + شريط التقدم + النسبة معاً - إصلاح خلل عدم التزامن)
    await refreshProgramsSummaryBar(clientId);
  }

  /* ---- Inline add custom procedure (no modal) ---- */
  function toggleAddProcInline(catId) {
    const form = document.getElementById(`add-proc-inline-${catId}`);
    if (!form) return;
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
      form.querySelector('input')?.focus();
    }
  }

  async function saveInlineProcedure(catId, formId) {
    if (Utils.blockIfArchive()) return;
    const title = document.getElementById(`${formId}-title`)?.value.trim();
    if (!title) { Utils.showToast('يرجى إدخال عنوان الإجراء', 'error'); return; }
    const type = document.getElementById(`${formId}-type`)?.value || 'substantive';
    const desc = document.getElementById(`${formId}-desc`)?.value.trim() || '';

    const cat = CACHED_CATEGORIES.find(c => c.id === catId);
    const existingNums = (cat?.procedures || []).map(p => p.num);
    let n = 1;
    while (existingNums.includes(`CU-${n}`)) n++;

    await AuditDB.add(AuditDB.STORES.CUSTOM_PROCEDURE_DEFS, {
      categoryId: catId, num: `CU-${n}`, title, type, desc, objective: ''
    });

    Utils.showToast('تمت إضافة الإجراء المخصص', 'success');
    await renderPrograms();
    // Switch to this category
    setTimeout(() => {
      const btn = document.querySelector(`.prog-cat-btn[data-cat="${catId}"]`);
      if (btn) switchCategory(catId, btn);
    }, 100);
  }


  function openAddCategoryModal() {
    const existingGroups = [...new Set(AUDIT_CATEGORIES.map(c => c.group))];
    const body = `
      <div class="form-group">
        <label class="form-label required">اسم البند</label>
        <input class="form-control" id="cc-title" type="text" placeholder="مثال: عقود الإيجار التمويلي">
      </div>
      <div class="form-group">
        <label class="form-label">المجموعة</label>
        <input class="form-control" id="cc-group" type="text" list="cc-groups-list" placeholder="اختر مجموعة موجودة أو اكتب اسم مجموعة جديدة" value="بنود مخصصة">
        <datalist id="cc-groups-list">
          ${existingGroups.map(g => `<option value="${Utils.escapeHtml(g)}">`).join('')}
        </datalist>
      </div>
    `;
    const footer = `
      <button class="btn btn-primary" id="ccSaveBtn">إضافة البند</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
    `;
    Utils.openModal('إضافة بند مراجعة مخصص', body, footer);

    document.getElementById('ccSaveBtn').onclick = async () => {
      const title = document.getElementById('cc-title').value.trim();
      const group = document.getElementById('cc-group').value.trim() || 'بنود مخصصة';
      if (!title) { Utils.showToast('يرجى إدخال اسم البند', 'error'); return; }
      await AuditDB.add(AuditDB.STORES.CUSTOM_CATEGORIES, { title, group });
      Utils.closeModal();
      Utils.showToast('تمت إضافة البند المخصص', 'success');
      await renderPrograms();
    };
  }

  async function deleteCustomCategory(customDbId) {
    Utils.confirmDialog(
      'سيتم حذف هذا البند المخصص وكل إجراءاته، وكذلك كل سجلات التقدّم والمرفقات المرتبطة به لدى جميع العملاء. هل تريد المتابعة؟',
      async () => {
        const catId = 'custom-' + customDbId;

        // Cascade: delete custom procedure defs in this category
        const procDefs = await AuditDB.getAll(AuditDB.STORES.CUSTOM_PROCEDURE_DEFS);
        const toDelete = procDefs.filter(p => p.categoryId === catId);
        for (const p of toDelete) {
          await deleteProcedureProgressAndAttachments(catId, p.num);
          await AuditDB.delete(AuditDB.STORES.CUSTOM_PROCEDURE_DEFS, p.id);
        }

        await AuditDB.delete(AuditDB.STORES.CUSTOM_CATEGORIES, customDbId);
        Utils.showToast('تم حذف البند المخصص', 'success');
        await renderPrograms();
      }
    );
  }

  function openAddProcedureModal(catId) {
    const body = `
      <div class="form-group">
        <label class="form-label required">عنوان الإجراء</label>
        <input class="form-control" id="cp-title" type="text" placeholder="مثال: مراجعة عقد الإيجار التمويلي">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">نوع الاختبار</label>
          <select class="form-control" id="cp-type">
            <option value="substantive">اختبار تفصيلي (Substantive)</option>
            <option value="controls">اختبار ضوابط (Controls)</option>
            <option value="analytical">إجراء تحليلي (Analytical)</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">وصف الإجراء</label>
        <textarea class="form-control textarea-auto" id="cp-desc" rows="2" placeholder="وصف مختصر للإجراء"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">الهدف من الإجراء</label>
        <textarea class="form-control textarea-auto" id="cp-objective" rows="2" placeholder="ما الذي يهدف هذا الإجراء للتحقق منه"></textarea>
      </div>
    `;
    const footer = `
      <button class="btn btn-primary" id="cpSaveBtn">إضافة الإجراء</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
    `;
    Utils.openModal('إضافة إجراء مراجعة مخصص', body, footer);

    document.getElementById('cpSaveBtn').onclick = async () => {
      const title = document.getElementById('cp-title').value.trim();
      if (!title) { Utils.showToast('يرجى إدخال عنوان الإجراء', 'error'); return; }

      const cat = CACHED_CATEGORIES.find(c => c.id === catId);
      const existingNums = (cat?.procedures || []).map(p => p.num);
      let n = 1;
      while (existingNums.includes(`CU-${n}`)) n++;

      await AuditDB.add(AuditDB.STORES.CUSTOM_PROCEDURE_DEFS, {
        categoryId: catId,
        num: `CU-${n}`,
        title,
        type: document.getElementById('cp-type').value,
        desc: document.getElementById('cp-desc').value.trim(),
        objective: document.getElementById('cp-objective').value.trim()
      });
      Utils.closeModal();
      Utils.showToast('تمت إضافة الإجراء المخصص', 'success');
      await renderPrograms();
      setTimeout(() => {
        const btn = document.querySelector(`.prog-cat-btn[data-cat="${catId}"]`);
        if (btn) switchCategory(catId, btn);
      }, 100);
    };
  }

  async function deleteCustomProcedure(procDefId) {
    Utils.confirmDialog(
      'سيتم حذف هذا الإجراء المخصص، وكذلك كل سجلات التقدّم والمرفقات المرتبطة به لدى جميع العملاء. هل تريد المتابعة؟',
      async () => {
        const def = await AuditDB.get(AuditDB.STORES.CUSTOM_PROCEDURE_DEFS, procDefId);
        if (def) await deleteProcedureProgressAndAttachments(def.categoryId, def.num);
        await AuditDB.delete(AuditDB.STORES.CUSTOM_PROCEDURE_DEFS, procDefId);
        Utils.showToast('تم حذف الإجراء المخصص', 'success');
        await renderPrograms();
      }
    );
  }

  /** يحذف كل سجلات تقدّم الإجراء (procedures) ومرفقاتها لدى كل العملاء عند حذف تعريف إجراء/بند مخصص */
  async function deleteProcedureProgressAndAttachments(catId, procNum) {
    if (Utils.blockIfArchive()) return;
    const allProcRecords = await AuditDB.getAll(AuditDB.STORES.PROCEDURES);
    const matching = allProcRecords.filter(p => p.category === catId && p.procedureNum === procNum);
    for (const rec of matching) {
      await AttachmentsModule.deleteAllFor('procedure', rec.id);
      await AuditDB.delete(AuditDB.STORES.PROCEDURES, rec.id);
    }
  }

  return {
    renderPrograms,
    switchCategory,
    filterCategories,
    toggleProcedure,
    quickSetStatus,
    toggleAddProcInline,
    saveInlineProcedure,
    saveProcedure,
    markCompleted,
    createFindingFromProcedure,
    initializeAllProcedures,
    openAddCategoryModal,
    deleteCustomCategory,
    openAddProcedureModal,
    deleteCustomProcedure,
    getAllCategories,
    refreshProcedureAttachments,
    AUDIT_CATEGORIES
  };
})();
