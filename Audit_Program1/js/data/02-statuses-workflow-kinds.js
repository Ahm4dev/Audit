/* Audit-Plus data · Statuses, workflow, working-paper sections, WP kinds */

const STATUS = [
  ['NS', 'لم يبدأ · Not Started'],
  ['IP', 'قيد التنفيذ · In Progress'],
  ['CP', 'مكتمل · Completed'],
  ['EX', 'استثناء · Exception'],
  ['RR', 'يتطلب مراجعة · Review Required'],
  ['RV', 'تمت المراجعة · Reviewed'],
  ['CL', 'مُخلاة · Cleared'],
  ['NA', 'لا ينطبق · Not Applicable'],
];
const WF = [
  ['NS', 'لم يبدأ · Not Started'],
  ['PR', 'أُعدت · Prepared'],
  ['SR', 'أُرسلت للمراجعة · Submitted for Review'],
  ['RN', 'ملاحظات مراجعة · Review Notes'],
  ['RE', 'مُعدلة · Revised'],
  ['RV', 'تمت المراجعة · Reviewed'],
  ['CL', 'مُخلاة · Cleared'],
  ['FN', 'نهائية · Finalized'],
];
const WSEC = {
  A: 'Engagement & Planning — القبول والتخطيط',
  B: 'Risk Assessment & Materiality — تقييم المخاطر والأهمية النسبية',
  C: 'Internal Controls & IT — الرقابة الداخلية وتقنية المعلومات',
  D: 'Sampling — العينات',
  E: 'Cash & Treasury — النقدية والخزينة',
  F: 'Revenue & Receivables — الإيرادات والمدينون',
  G: 'Inventory — المخزون',
  H: 'PPE & Intangibles — الأصول الثابتة وغير الملموسة',
  I: 'Payables & Expenses — الدائنون والمصروفات',
  J: 'Payroll & Employee Benefits — الرواتب ومزايا العاملين',
  K: 'Borrowings & Financing — القروض والتمويل',
  L: 'Investments & Financial Instruments — الاستثمارات والأدوات المالية',
  M: 'Tax — الضرائب',
  N: 'Equity — حقوق الملكية',
  O: 'Related Parties — الأطراف ذات العلاقة',
  P: 'Estimates & Judgments — التقديرات والأحكام',
  Q: 'Legal & Contingencies — القضايا والالتزامات المحتملة',
  R: 'Going Concern — الاستمرارية',
  S: 'Subsequent Events — الأحداث اللاحقة',
  T: 'Journal Entries & Fraud — القيود والاحتيال',
  U: 'Group Audit & Consolidation — المجموعة والتجميع',
  V: 'Financial Statements & Disclosures — القوائم والإفصاحات',
  W: 'Misstatements & Adjustments — التحريفات والتسويات',
  X: 'Completion & Reporting — الإقفال والتقرير',
  Y: 'General Templates — نماذج عامة',
};
const KINDS = {
  lead: [
    'Lead Schedule — جدول رئيسي',
    'Account Code|Account Name|PY Audited|CY Unadjusted (TB)|AJE (Dr/Cr)|RJE (Dr/Cr)|CY Final|Variance|Var %|Explanation of Variance|Supporting WP|Tick',
    'اربط الأرصدة بميزان المراجعة النهائي (T/B) وبالقوائم المالية، وقارن بالسنة السابقة المدققة، وفسّر أي فرق يتجاوز الحد المحدد في التخطيط (مثل 10% أو نسبة من PM)، وأحِل كل رقم إلى ورقة العمل المؤيدة.',
  ],
  sup: [
    'Supporting Schedule — جدول مؤيد',
    'Item|Description|Reference|Amount|Per Supporting Document|Difference|Tested (✓)|Comment|WP Ref',
    'فصّل الرصيد إلى مكوناته واربط الإجمالي بالـ Lead Schedule.',
  ],
  rec: [
    'Reconciliation — مطابقة',
    'Item|Description|Per GL|Per Sub-ledger / Third Party|Difference|Nature of Reconciling Item|Supporting Evidence|Cleared Subsequently? (Date)|Exception|WP Ref',
    'ابدأ بالرصيد حسب الأستاذ العام ثم بنود التسوية حتى تصل إلى الرصيد حسب المصدر المستقل؛ افحص كل بند تسوية جوهري أو قديم مقابل الدليل وتحقق من تسويته لاحقًا.',
  ],
  tod: [
    'Test of Details — اختبار تفاصيل',
    '#|Document / Transaction No.|Date|Counterparty|Description|Amount per GL|Test Performed|Evidence Inspected|Assertion Tested|Result (✓/✗)|Exception Amount|Adjustment Ref',
    'سجّل طريقة اختيار العينة وحجمها، ولكل عنصر: المستند المفحوص، سمات الاختبار، والنتيجة. يُسقط أي خطأ على المجتمع في D-15.',
  ],
  toc: [
    'Test of Controls — اختبار رقابة',
    '#|Sample Ref|Transaction Date|Amount|Attribute 1: Authorization|Attribute 2: Matching / Check|Attribute 3: Evidence of Review|Attribute 4: Timeliness|Performed By (SoD)|Deviation (Y/N)|Nature of Deviation|WP Ref',
    'حدّد سمات الرقابة (Control Attributes) قبل الاختبار، وحجم العينة حسب التكرار (انظر حاسبة العينات)، وقيّم أي انحراف: هل هو عرضي أم منهجي، وأثره على الاعتماد على الرقابة.',
  ],
  conf: [
    'Confirmation Control — سيطرة على المصادقات',
    '#|Counterparty|Address / Email Verified Against|Balance per Books|Type (Positive/Negative)|Date Sent|Sent By Auditor|Date 2nd Request|Date Received|Received Directly (Y/N)|Balance Confirmed|Difference|Reconciled / Explained|Alternative Procedure Ref|Conclusion',
    'احتفظ بالسيطرة الكاملة: تحقق من العنوان بشكل مستقل، أرسل بنفسك، استلم مباشرة، وتابع غير المستلم بطلب ثانٍ ثم إجراءات بديلة؛ قيّم موثوقية الردود الإلكترونية (ISA 505).',
  ],
  chk: [
    'Checklist — قائمة فحص',
    '',
    'أجب عن كل بند بنعم/لا/لا ينطبق مع الإحالة إلى الدليل؛ أي إجابة بـ «لا» تتطلب تقييمًا وتوثيقًا لأثرها على المراجعة.',
  ],
  icq: [
    'Internal Control Questionnaire — استبيان رقابة',
    '',
    'الإجابة بـ «لا» تشير إلى ضعف محتمل في تصميم الرقابة؛ وثّق مصدر الإجابة (مقابلة/ملاحظة/فحص) وقيّم الأثر في C-11.',
  ],
  memo: ['Memorandum — مذكرة', '', 'مذكرة نصية منظمة تُوقّع من المعد والمراجع.'],
  calc: [
    'Calculation — حساب/إعادة احتساب',
    'Item|Basis / Source|Input Data|Formula / Method|Client Amount|Auditor Recalculation|Difference|Within Threshold?|Comment',
    'وثّق مصدر كل مدخل واختبر موثوقيته، ثم أعد الاحتساب بشكل مستقل وقارن بنتيجة العميل.',
  ],
  roll: [
    'Roll-forward — حركة الرصيد',
    'Description / Category|Opening Balance (Audited PY)|Additions|Disposals / Settlements|Transfers / Reclass|Charge / Revaluation / FX|Closing Balance|Per GL / TB|Difference|Tested WP Ref',
    'تحقق أن الرصيد الافتتاحي = الرصيد الختامي المدقق للسنة السابقة، واختبر الحركات، وطابق الرصيد الختامي مع الأستاذ العام.',
  ],
  ana: [
    'Analytical Review — مراجعة تحليلية',
    'Line Item / Ratio|CY Actual|PY / Budget|Auditor Expectation & Basis|Variance|Var %|Threshold|Explanation Obtained|Corroborating Evidence|Further Work Required?|WP Ref',
    'طوّر توقعًا مستقلًا (Expectation) من بيانات موثوقة، وحدد الحد المقبول للفرق قبل المقارنة، واحصل على أدلة مؤيدة لتفسيرات الإدارة.',
  ],
  log: [
    'Log — سجل',
    '#|Date|WP Ref|Description|Raised By|Assigned To|Response / Action|Status|Cleared By|Date Cleared',
    'سجل تراكمي يُحدّث باستمرار حتى إقفال الملف.',
  ],
  risk: [
    'Risk Matrix — مصفوفة مخاطر',
    '#|Risk Description (What can go wrong)|FS Level / Account|Assertion|Inherent Risk Factors (Complexity/Subjectivity/Change/Uncertainty/Bias)|Likelihood|Magnitude|Inherent Risk|Control Risk|RMM|Significant? (Y/N)|Fraud? (Y/N)|Planned Response|WP Ref',
    'قيّم كل خطر على طيف الخطر المتأصل، وحدد استجابة مخصصة ترتبط مباشرة بالتأكيد (ISA 315 / 330).',
  ],
  rcm: [
    'RCM — مصفوفة المخاطر والرقابة',
    'Process / Sub-process|Risk (What can go wrong)|Control ID|Control Description|Preventive/Detective|Manual/Automated/ITDM|Frequency|Control Owner|Assertion|Key Control (Y/N)|Design Effective?|Implemented?|TOC Ref|Operating Effectiveness Conclusion',
    'لكل خطر على مستوى التأكيد حدد الضابط الذي يعالجه، وقيّم التصميم والتطبيق عبر Walkthrough، ثم اختبر التشغيل للضوابط التي سيُعتمد عليها.',
  ],
  count: [
    'Inventory Count — جرد',
    'Tag / Sheet No.|Location|Item Code|Description|UOM|Client Count|Auditor Count|Difference|Direction (Floor→Sheet / Sheet→Floor)|Condition (Damaged/Obsolete)|Agreed to Final Listing?|Comment',
    'اختر العينات من الأرض إلى السجلات (للاكتمال) ومن السجلات إلى الأرض (للوجود)، وتحقق من البنود التالفة وبطيئة الحركة، وتتبع أرقام بطاقات الجرد للقائمة النهائية.',
  ],
  mis: [
    'Misstatements — تحريفات',
    '#|Description|WP Ref|Account Dr|Account Cr|Type (Factual/Judgmental/Projected)|Amount|Effect on Profit before Tax|Effect on Equity|Effect on Assets|Effect on Liabilities|Current/Non-current|Adjusted (Y/N)|Management Reason if Unadjusted',
    'جمّع جميع التحريفات غير التافهة (أكبر من CT)، وقيّم أثرها الفردي والمجمع كمًّا ونوعًا مقابل الأهمية النسبية (ISA 450).',
  ],
  est: [
    'Estimate Assessment — تقييم تقدير',
    'Estimate|Method / Model|Key Assumptions|Data Source & Reliability|Management Point Estimate|Auditor Point Estimate / Range|Difference|Sensitivity (±%)|Indicators of Management Bias|Retrospective Outcome (PY)|Conclusion',
    'اختر نهجًا أو أكثر وفق ISA 540: اختبار طريقة الإدارة، أو تطوير تقدير/مدى مستقل، أو الأحداث حتى تاريخ التقرير؛ وقيّم مؤشرات التحيز.',
  ],
  samp: [
    'Sampling Plan — خطة عينة',
    'Parameter|Value|Basis / Justification|Source / WP Ref',
    'وثّق هدف الاختبار، تعريف المجتمع ووحدة العينة، تعريف الخطأ/الانحراف، الخطأ المقبول والمتوقع، مستوى الثقة، الطريقة، وحجم العينة.',
  ],
  sel: [
    'Sample Selection — اختيار العينة',
    '#|Selection Method (Random seed / Interval / Key item)|Population Item Ref|Date|Description|Amount|Cumulative Amount (MUS)|Selection Point|Selected (Y/N)|Tested in WP',
    'وثّق بذرة الاختيار العشوائي أو نقطة البداية وفترة الاختيار حتى يمكن إعادة الأداء.',
  ],
  legal: [
    'Legal / Claims Schedule — القضايا',
    'Case / Claim No.|Counterparty|Court / Forum|Nature of Claim|Amount Claimed|Status|Lawyer Assessment (Probable/Possible/Remote)|Estimated Outflow|Provision Recorded|Disclosure Made|Legal Letter Ref|Conclusion',
    'طابق الجدول مع ردود المستشارين القانونيين ومحاضر المجلس ومصروفات الأتعاب القانونية، وقيّم الاعتراف وفق IAS 37.',
  ],
  aging: [
    'Aging Analysis — تحليل أعمار',
    'Customer / Supplier / Item|Total Balance|Current|1–30|31–60|61–90|91–180|181–365|>365|Subsequently Settled|Provision Required|Comment',
    'اختبر دقة تحليل الأعمار بإعادة تعمير عينة من الفواتير، وطابق الإجمالي مع الأستاذ العام.',
  ],
  cut: [
    'Cut-off Test — فصل زمني',
    '#|Document (Invoice/GRN/Delivery) No.|Document Date|Shipment/Receipt Date|Transfer of Control Date|Recorded Period|Correct Period|Amount|Before/After Year-end|Correct (✓/✗)|Adjustment Ref',
    'اختر المعاملات من الأيام الأخيرة قبل نهاية الفترة والأولى بعدها (حسب الحجم والخطر) من المستندات المادية والسجلات، وتأكد من تطابق الفترة المسجلة مع تاريخ نقل السيطرة/الاستلام.',
  ],
  sub: [
    'Subsequent Testing — اختبار لاحق',
    '#|Party|Year-end Balance / Invoice|Subsequent Receipt/Payment Date|Bank Statement Ref|Amount|Relates to Pre-year-end Item? (Y/N)|Unrecorded? (Y/N)|Comment',
    'افحص الحركات النقدية بعد نهاية الفترة حتى تاريخ قريب من تاريخ التقرير وحدد ما يخص الفترة المراجعة.',
  ],
  fv: [
    'Fair Value — القيمة العادلة',
    'Instrument / Asset|Fair Value Hierarchy (L1/L2/L3)|Valuation Technique|Key Inputs|Source of Inputs|Client Fair Value|Auditor Fair Value / Range|Difference|FV Change to P&L / OCI|Sensitivity|Conclusion',
    'تحقق من مستوى الهرمية، وموثوقية المدخلات، ومدى ملاءمة النموذج، والاستعانة بخبير تقييم عند المستوى الثالث (IFRS 13 / ISA 540).',
  ],
  eir: [
    'Effective Interest — الفائدة الفعلية',
    'Period|Opening Amortised Cost|Cash Flow (Coupon/Installment)|EIR %|Interest at EIR|Amortisation of Premium/Discount/Fees|Closing Amortised Cost|Per GL|Difference',
    'أعد بناء جدول التكلفة المستهلكة باستخدام سعر الفائدة الفعلي المحسوب من التدفقات التعاقدية والرسوم (IFRS 9).',
  ],
  dep: [
    'Depreciation / Amortisation — الاستهلاك',
    'Asset Class|Cost Opening|Additions (Date-weighted)|Disposals|Cost Closing|Method|Useful Life / Rate|Residual Value|Auditor Charge|Client Charge|Difference|Comment',
    'أعد احتساب مصروف الاستهلاك على مستوى الفئة أو بعينة على مستوى الأصل، مع مراعاة تواريخ الإضافة والاستبعاد.',
  ],
  team: [
    'Team & Responsibilities — الفريق',
    'Name|Role (Partner/EQR/Manager/Senior/Staff/Specialist)|Qualifications & Experience|Independence Confirmed (Date)|Assigned Areas / WPs|Hours Budget|Hours Actual|Review Responsibility|Sign-off',
    'حدد المسؤوليات والإشراف والمراجعة لكل عضو وفق ISA 220.',
  ],
  time: [
    'Timeline — الجدول الزمني',
    'Milestone|Planned Date|Responsible|Client Deliverable (PBC)|Actual Date|Status|Comment',
    'تابع خطة العمل وقائمة متطلبات العميل (PBC List) والمواعيد النهائية للتقرير.',
  ],
  plan: [
    'Detailed Audit Plan — خطة تفصيلية',
    'Audit Area / Account|Significant? (Y/N)|RMM by Assertion|Controls Reliance (Y/N)|Nature of Procedures|Timing (Interim/Final)|Extent (Sample Size)|Assigned To|Budget Hours|WP Ref',
    'ترجم تقييم المخاطر إلى طبيعة وتوقيت ومدى الإجراءات لكل مجال (ISA 300 / 330).',
  ],
  idx: [
    'File Index — فهرس الملف',
    'Section|WP Ref Range|Description|Prepared By|Reviewed By|Status|Comment',
    'فهرس مرجعي يحدد محتويات الملف وأرقام أوراق العمل.',
  ],
  sod: [
    'SoD Matrix — فصل المهام',
    'Function / User|Initiate|Authorize|Record|Custody of Assets|Reconcile|System Admin|Conflict Identified|Compensating Control|Conclusion',
    'حدد التعارضات (مثل من يسجل المورد ويعتمد الدفع) والضوابط التعويضية.',
  ],
  auth: [
    'Authorization Matrix — مصفوفة الصلاحيات',
    'Transaction Type|Threshold From|Threshold To|Approver 1|Approver 2|System Enforced (Y/N)|Policy Ref|Tested Sample Ref|Exceptions',
    'قارن حدود الصلاحيات المعتمدة بما هو مطبق في النظام وما لوحظ في العينات.',
  ],
  uar: [
    'User Access Review — مراجعة صلاحيات',
    'User ID|Name|Department|Role / Profile|Access Rights|Appropriate per Job (Y/N)|Active Employee (HR)|Last Login|Privileged (Y/N)|Reviewed by Owner (Date)|Exception|Action',
    'طابق قائمة المستخدمين المستخرجة من النظام مع سجلات الموارد البشرية ومصفوفة الأدوار.',
  ],
  itgc: [
    'ITGC Testing — ضوابط تقنية المعلومات',
    'ITGC Domain|Control ID|Control Description|System / Layer (App/DB/OS)|Population|Sample Size|Test Performed|Evidence|Deviation (Y/N)|Impact on Application Controls|Conclusion',
    'اختبر الوصول للبرامج والبيانات، إدارة التغيير، عمليات الحاسب، وتطوير الأنظمة لكل نظام مالي ذي صلة.',
  ],
  appc: [
    'Application / Automated Controls — ضوابط التطبيقات',
    'Control ID|System|Control Description|Configuration Setting|Test Approach (Test of One / Reperformance)|Baseline Date|ITGC Reliance (Y/N)|Result|Conclusion',
    'اختبر الضابط الآلي بعنصر واحد لكل سيناريو (موجب وسالب) مع الاعتماد على ITGC فعالة، أو اختبار الأساس (Baselining).',
  ],
  ipe: [
    'IPE Reliability — موثوقية تقارير النظام',
    'Report Name|System|Used In WP|Purpose|Source Data|Parameters / Filters|Completeness Test|Accuracy Test|Report Logic Tested|ITGC Reliance|Conclusion',
    'اختبر اكتمال ودقة المعلومات التي تنتجها المنشأة (IPE) قبل استخدامها كأساس للعينة أو التوقع (ISA 500.9).',
  ],
  wt: [
    'Walkthrough — جولة تتبع',
    'Step|Process Activity|Document / System Screen|Performed By|Control Point Observed|Control ID|Design Adequate (Y/N)|Implemented (Y/N)|Evidence Ref|Comment',
    'تتبع معاملة واحدة من البداية للنهاية عبر الاستفسار والملاحظة والفحص، وقارن الواقع بالسرد المكتوب.',
  ],
  def: [
    'Deficiency Assessment — تقييم القصور',
    'Deficiency ID|Description|Control / Process|Design or Operating|Accounts / Assertions Affected|Likelihood|Potential Magnitude|Compensating Controls|Classification (Deficiency/Significant Deficiency)|Communicated To (Mgmt/TCWG)|Date|Mgmt Response',
    'قيّم احتمال وحجم التحريف المحتمل، والضوابط التعويضية، وصنّف القصور وأبلغه كتابيًا عند كونه جوهريًا (ISA 265).',
  ],
  rp: [
    'Related Party Register — سجل الأطراف',
    "Related Party Name|Relationship|Source of Identification|Nature of Transactions|Volume CY|Balance at YE|Terms (Arm's Length?)|Approved By|Disclosed (Y/N)|Comment",
    'طابق قائمة الإدارة مع مصادر مستقلة: السجل التجاري، المحاضر، إقرارات المديرين، سجلات المساهمين، المعاملات غير العادية.',
  ],
  cov: [
    'Covenant Compliance — التعهدات',
    'Covenant|Agreement Clause|Required Threshold|Calculation Basis|Actual (Auditor Recalc)|Compliant (Y/N)|Waiver Obtained Before YE?|Impact on Classification (IAS 1)|Going Concern Impact|Comment',
    'أعد احتساب كل تعهد مالي وفق تعريفات الاتفاقية، وقيّم أثر الإخلال على التبويب كالتزام متداول.',
  ],
  dt: [
    'Deferred Tax — الضريبة المؤجلة',
    'Item|Carrying Amount|Tax Base|Temporary Difference|Taxable / Deductible|Tax Rate|DTA / DTL|Recognised (Y/N)|Movement P&L|Movement OCI/Equity|Comment',
    'احسب الفروق المؤقتة بين القيمة الدفترية والأساس الضريبي، واختبر قابلية استرداد الأصل الضريبي المؤجل (IAS 12).',
  ],
  vat: [
    'VAT / GST Reconciliation — ضريبة القيمة المضافة',
    'Month|Output VAT per Returns|Output VAT per GL|Diff|Input VAT per Returns|Input VAT per GL|Diff|Net Payable per Returns|Paid (Date / Ref)|Balance per GL|Comment',
    'طابق الإقرارات الشهرية مع الأستاذ العام ومع الإيرادات والمشتريات، وتحقق من السداد والغرامات.',
  ],
  taxrec: [
    'Tax Reconciliation — تسوية ضريبية',
    'Item|Amount|Tax Effect|Source / Evidence|Comment',
    'تسوية الربح المحاسبي بالربح الضريبي، ثم تسوية مصروف الضريبة الفعلي بالمعدل القانوني (Tax Rate Reconciliation).',
  ],
  div: [
    'Dividends — توزيعات',
    'Declaration Date|Approved By (GA/Board Minute Ref)|Per Share|Number of Shares|Total Declared|Paid (Date / Bank Ref)|Payable at YE|Withholding Tax|Legal Restrictions Checked|Comment',
    'تحقق من الاعتماد القانوني، توفر أرباح قابلة للتوزيع، الاحتساب، والسداد.',
  ],
  soce: [
    'Equity Movement — حركة حقوق الملكية',
    'Component|Opening|Profit/Loss|OCI|Dividends|Share Issues|Treasury Shares|Transfers to Reserves|Other|Closing|Per SOCE|Difference',
    'طابق قائمة التغيرات في حقوق الملكية مع أوراق العمل والأستاذ العام والمحاضر.',
  ],
  imp: [
    'Impairment Test — اختبار الانخفاض',
    'CGU / Asset|Carrying Amount (incl. Goodwill)|Method (VIU/FVLCOD)|Forecast Period|Revenue Growth %|Terminal Growth %|Discount Rate (Pre-tax)|Recoverable Amount|Headroom|Sensitivity: Break-even Assumption|Impairment|Conclusion',
    'اختبر معقولية الافتراضات مقارنةً بالأداء التاريخي والبيانات الخارجية، وأعد احتساب النموذج، ونفذ تحليل الحساسية (IAS 36).',
  ],
  ecl: [
    'ECL Calculation — الخسائر الائتمانية المتوقعة',
    'Segment / Aging Bucket|Gross Exposure|Historical Loss Rate|Forward-looking Adjustment|ECL Rate|ECL Required|Specific Provisions|Total ECL per Auditor|ECL per Client|Difference|Comment',
    'اختبر البيانات التاريخية، ومصفوفة المخصص (Provision Matrix)، والتعديلات المستقبلية، والمخصصات المحددة (IFRS 9).',
  ],
  bankrec: [
    'Bank Reconciliation — تسوية بنكية',
    'Bank / Account No.|Currency|Balance per Bank Statement|Balance per Confirmation|Deposits in Transit|Outstanding Cheques|Other Reconciling Items|Adjusted Bank Balance|Balance per GL|Difference|Items Cleared After YE (Ref)|Comment',
    'احصل على كشف الحساب مباشرة أو المصادقة، اختبر بنود التسوية بالكشوف اللاحقة، وتحقق من الدقة الحسابية.',
  ],
  cashcount: [
    'Cash Count — جرد النقدية',
    'Denomination|Quantity|Amount|Currency|Vouchers / IOUs on Hand|Total Counted|Balance per Cash Book|Difference|Custodian Signature|Count Date/Time',
    'اجرد بحضور أمين الصندوق، وأعد النقدية إليه بعد التوقيع، واجرد كل الصناديق في نفس الوقت لمنع التحويل بينها.',
  ],
  proj: [
    'Projection — إسقاط التحريف',
    'Sample Item|Book Value|Audited Value|Misstatement|Tainting %|Sampling Interval|Projected Misstatement|Key Item? (Y/N)|Comment',
    'أسقط التحريفات على المجتمع، وأضف هامش الدقة، وقارن بالخطأ المقبول.',
  ],
  url: [
    'Unrecorded Liabilities — الالتزامات غير المسجلة',
    '#|Payment / Invoice Ref|Date Paid / Received|Supplier|Amount|Goods/Service Received Date|Relates to Period Under Audit? (Y/N)|Recorded at YE? (Y/N)|Unrecorded Amount|Adjustment Ref',
    'افحص المدفوعات والفواتير المستلمة بعد نهاية الفترة فوق حد محدد حتى قرب تاريخ التقرير، وحدد ما يخص الفترة ولم يُسجل.',
  ],
  emp: [
    'Employee Testing — اختبار الموظفين',
    'Employee ID|Name|Department|Contract / Appointment Ref|Start / Exit Date|Basic Salary per Contract|Allowances|Gross per Payroll|Deductions (Tax/SS)|Net Paid (Bank Ref)|Attendance / Timesheet|Exception',
    'طابق كل موظف في العينة مع ملفه في الموارد البشرية والعقد والسداد البنكي، وتأكد من وجوده الفعلي (Existence).',
  ],
  pre: [
    'Prepayments — مصروفات مقدمة',
    'Supplier / Item|Invoice Ref|Total Amount|Service Period From|Service Period To|Months Elapsed|Expensed|Prepaid at YE (Auditor)|Per Client|Difference',
    'أعد احتساب الجزء غير المستنفد بناءً على فترة الخدمة الفعلية.',
  ],
  disp: [
    'Disposals — الاستبعادات',
    'Asset Code|Description|Disposal Date|Cost|Accumulated Depreciation|NBV|Proceeds|Gain/(Loss) Auditor|Gain/(Loss) Client|Approval Ref|Removed from FAR (Y/N)|Comment',
    'افحص الموافقة وعقد البيع والمتحصلات وإعادة احتساب الربح أو الخسارة وإزالة الأصل من السجل.',
  ],
  pv: [
    'Physical Verification — معاينة',
    'Asset Tag|Description|Location per FAR|Location Observed|Condition|In Use (Y/N)|Direction (FAR→Floor / Floor→FAR)|Exception|Photo / Evidence Ref',
    'اختر من السجل إلى الواقع (Existence) ومن الواقع إلى السجل (Completeness)، ولاحظ مؤشرات الانخفاض.',
  ],
  nrv: [
    'NRV Testing — صافي القيمة البيعية',
    'Item Code|Description|Qty|Unit Cost|Carrying Amount|Subsequent Selling Price (Invoice Ref)|Costs to Sell|NRV per Unit|Write-down Required|Recorded Write-down|Difference',
    'قارن التكلفة بصافي القيمة البيعية باستخدام فواتير بيع لاحقة فعلية (IAS 2).',
  ],
  cost: [
    'Inventory Costing — تكلفة المخزون',
    'Item Code|Description|Qty|Costing Method|Unit Cost per Client|Supporting Invoice / Cost Sheet|Material|Labour|Overhead Absorbed|Unit Cost per Auditor|Difference|Total Effect',
    'اختبر تكلفة الشراء أو التصنيع مقابل الفواتير وبطاقات التكاليف، ومعقولية تحميل التكاليف الصناعية على الطاقة العادية.',
  ],
  contract: [
    'Contract Revenue — عقود طويلة الأجل',
    'Contract|Customer|Total Contract Price|Variations / Claims|Total Estimated Cost|Cost Incurred to Date|% Complete (Input/Output)|Revenue to Date|Revenue CY|Billed to Date|Contract Asset / (Liability)|Onerous? (Y/N)',
    'اختبر سعر العقد والتعديلات والتكاليف المتكبدة والتكلفة المتوقعة للإنجاز، وأعد احتساب نسبة الإنجاز والإيراد (IFRS 15).',
  ],
  ifrs15: [
    'IFRS 15 Five-step Assessment — تقييم الإيراد',
    'Revenue Stream|Step 1: Contract|Step 2: Performance Obligations|Step 3: Transaction Price (Variable Consideration)|Step 4: Allocation (SSP)|Step 5: Point in Time / Over Time|Principal vs Agent|Policy Compliant (Y/N)|Comment',
    'وثّق تحليل الخطوات الخمس لكل مصدر إيراد جوهري وقارن بالسياسة المطبقة.',
  ],
  mus: [
    'MUS Sampling — العينة النقدية',
    'Parameter / Item|Value|Comment',
    'حدد فترة الاختيار ونقطة البداية العشوائية، واختر العناصر بالتراكم النقدي، وقيّم بالتلوث (Tainting).',
  ],
  fraud: [
    'Fraud Risk Assessment — مخاطر الاحتيال',
    'Fraud Risk Factor (Incentive/Pressure, Opportunity, Rationalisation)|Source (Inquiry/Brainstorming/Analytics)|Type (Fraudulent Reporting/Misappropriation)|Accounts / Assertions Affected|Presumed? (Revenue / Override)|Assessed RMM|Specific Response|Unpredictability Element|WP Ref',
    'وثّق جلسة العصف الذهني للفريق والاستفسارات من الإدارة والمراجعة الداخلية والمكلفين بالحوكمة (ISA 240).',
  ],
  resp: [
    'Risk Response — استجابة للخطر',
    'Risk ID|Risk Description|Assertion|RMM|Significant (Y/N)|Overall Response|Controls Tested (Ref)|Substantive Procedures (Nature)|Timing|Extent|Procedure WP Ref|Result|Residual Risk Conclusion',
    'اربط كل خطر بإجراء يستجيب له مباشرة، وأثبت أن الاستجابة كافية لتخفيض خطر المراجعة لمستوى منخفض مقبول (ISA 330).',
  ],
  asm: [
    'Assertion-level Risk — مخاطر التأكيدات',
    'Account / Disclosure|Existence/Occurrence|Completeness|Accuracy|Cut-off|Classification|Valuation/Allocation|Rights & Obligations|Presentation & Disclosure|Significant Risk|Planned Approach',
    'قيّم RMM لكل تأكيد ذي صلة بكل حساب جوهري (H/M/L).',
  ],
  sigacc: [
    'Significant Accounts — الحسابات الجوهرية',
    'Account / Disclosure|Balance|% of PM|Quantitative Significant (>PM)|Qualitative Factors|Relevant Assertions|Significant (Y/N)|Material Classes of Transactions|Processes|Comment',
    'الحساب جوهري إذا كان رصيده يتجاوز أهمية الأداء أو ارتبط بعوامل نوعية (أطراف ذات علاقة، تقديرات، احتيال، تعقيد).',
  ],
  dsg: [
    'Control Design & Implementation — تصميم وتطبيق',
    'Control ID|Control Description|Risk Addressed|Precision Level|Competence & Authority of Performer|Information Used (IPE)|Design Effective (Y/N)|Implemented (Walkthrough Ref)|Conclusion',
    'قيّم ما إذا كان الضابط قادرًا منفردًا أو مع غيره على منع أو اكتشاف وتصحيح التحريف الجوهري، وتحقق من تطبيقه فعليًا.',
  ],
  cf: [
    'Cash Flow Forecast — توقعات التدفق النقدي',
    'Month|Opening Cash|Receipts from Customers|Other Receipts|Payments to Suppliers|Payroll|Debt Service|Capex|Tax|Closing Cash|Facility Headroom|Key Assumption|Auditor Challenge',
    'قيّم افتراضات التوقعات مقابل الأداء الفعلي والعقود والتسهيلات المتاحة لفترة 12 شهرًا على الأقل من تاريخ القوائم.',
  ],
  sens: [
    'Sensitivity Analysis — تحليل الحساسية',
    'Scenario|Assumption Changed|Change Applied|Revised Cash Headroom|Covenant Breach? (Y/N)|Probability|Mitigation Available|Conclusion',
    'طبّق سيناريوهات معقولة سلبية لتحديد مدى اعتماد الاستمرارية على الافتراضات الرئيسية.',
  ],
  comp: [
    'Component Assessment — المكونات',
    'Component|Country|% Group Revenue|% Group Assets|% Group PBT|Significant Risks|Scope (Full/Specific/Analytical)|Component Materiality|Component Auditor|Work Required|Reporting Deadline|Comment',
    'حدد نطاق العمل لكل مكون بناءً على الحجم والمخاطر وفق ISA 600 (Revised).',
  ],
  ic: [
    'Intercompany Reconciliation — مطابقة البينيات',
    'Entity A|Entity B|Account Type|Balance per A|Balance per B (Translated)|Difference|Explanation (Cut-off/FX/Dispute)|Adjusted in Consolidation|Elimination Ref|Comment',
    'طابق كل زوج من الأرصدة والمعاملات البينية وحلّ الفروقات قبل الحذف.',
  ],
  cons: [
    'Consolidation Adjustments — تسويات التجميع',
    'Entry No.|Description|Dr Account|Cr Account|Amount|Entity|Type (Elimination/Alignment/FX/NCI/Goodwill)|Supporting WP|Recurring (Y/N)|Tested (✓)|Comment',
    'اختبر كل قيد تجميع من حيث الاحتساب والدعم والاتساق مع السنة السابقة.',
  ],
  gw: [
    'Goodwill / PPA — الشهرة وتوزيع سعر الشراء',
    'Item|Amount|Source / Valuation Ref|Auditor Assessment|Comment',
    'تحقق من المقابل المحول، القيمة العادلة للأصول والالتزامات المستحوذ عليها، الحقوق غير المسيطرة، والشهرة الناتجة (IFRS 3).',
  ],
  nci: [
    'NCI Calculation — الحقوق غير المسيطرة',
    'Subsidiary|NCI %|Net Assets of Subsidiary|NCI Share of Net Assets|Profit for Year|NCI Share of Profit|NCI Share of OCI|Dividends to NCI|Closing NCI|Per Consolidation|Difference',
    'أعد احتساب حصة الحقوق غير المسيطرة في صافي الأصول والأرباح والدخل الشامل.',
  ],
  trans: [
    'FX Translation — ترجمة العمليات الأجنبية',
    'Item|Functional Currency Amount|Rate Type (Closing/Average/Historical)|Rate Used|Rate Source|Translated Amount|Auditor Recalc|Difference|FCTR Impact',
    'الأصول والالتزامات بسعر الإقفال، والإيرادات والمصروفات بالمتوسط أو سعر المعاملة، وحقوق الملكية بالسعر التاريخي، والفرق في FCTR (IAS 21).',
  ],
  tie: [
    'Tie-out — المطابقة النهائية',
    'FS Line Item / Note|Amount per FS|Amount per TB / Note|Amount per Lead Schedule|Difference|Casting / Cross-casting (✓)|Cross-reference to Note|Comparatives Agreed (✓)|Comment',
    'طابق كل رقم في القوائم والإيضاحات مع ميزان المراجعة وأوراق العمل، وتحقق من الجمع الرأسي والأفقي.',
  ],
  kam: [
    'Key Audit Matters — أمور المراجعة الرئيسية',
    'Matter|Why Communicated to TCWG|Why Significant (Higher RMM / Judgment / Significant Event)|How Addressed in Audit|Related Disclosure Note|Selected as KAM (Y/N)|Rationale|Draft KAM Wording Ref',
    'حدد الأمور التي تطلبت اهتمامًا كبيرًا من المراجع من بين الأمور المبلغة للمكلفين بالحوكمة (ISA 701).',
  ],
  op: [
    'Opinion Determination — تحديد الرأي',
    'Matter|Nature (Misstatement / Inability to Obtain Evidence)|Material (Y/N)|Pervasive (Y/N)|Resulting Opinion|Basis Paragraph Required|EOM/OM Needed|Partner Conclusion',
    'طبق مصفوفة ISA 705: تحريف جوهري غير منتشر = متحفظ؛ منتشر = عكسي؛ عدم كفاية الأدلة غير منتشر = متحفظ؛ منتشر = امتناع.',
  ],
  cap: [
    'Share Capital — رأس المال',
    'Class of Shares|Authorised (No. / Amount)|Issued|Called-up|Paid-up|Unpaid|Par Value|Per Commercial Register|Per Articles|Per GL|Difference|Comment',
    'طابق رأس المال مع النظام الأساسي والسجل التجاري وسجل المساهمين والأستاذ العام.',
  ],
  cnt: [
    'Petty Cash Count — جرد العهدة',
    'Fund / Custodian|Imprest Amount|Cash Counted|Vouchers on Hand (Approved?)|IOUs|Total Accounted|Shortage / Overage|Last Replenishment Date|Comment',
    'اجرد العهدة المستديمة وطابق مع قيمتها المعتمدة وافحص المستندات غير المعوضة.',
  ],
  xfer: [
    'Bank Transfers — التحويلات البنكية',
    'Date Out|From Bank / Account|Date In|To Bank / Account|Amount|Recorded Out (Period)|Recorded In (Period)|Kiting Indicator (Y/N)|Comment',
    'أعد جدول التحويلات بين الحسابات حول نهاية الفترة لاكتشاف التلاعب (Kiting) والتسجيل المزدوج.',
  ],
  bconf: [
    'Bank Confirmation Summary — ملخص المصادقات البنكية',
    'Bank|Accounts Confirmed|Balances Agreed|Loans / Facilities Disclosed|Guarantees / LCs|Pledges / Liens|Signatories|Other Relationships|Items Not in Books|Follow-up',
    'لخص جميع المعلومات الواردة في المصادقة البنكية وتأكد من انعكاس الضمانات والرهون والتسهيلات في الإيضاحات.',
  ],
};

export { KINDS, STATUS, WF, WSEC };
