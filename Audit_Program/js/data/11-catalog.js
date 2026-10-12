/* Audit-Plus data · Procedure catalog (sections, tree, areas, super-areas) */
/* =====================================================================
   v4 · Working-paper tree (Caseware-style), Arabic. Each line:  ref | English | العربية | type[:param]
   types: L:<legacy refs,..>  F:<form key>  R:<request key>  Q:<query key>  TPL:<template id>  X:<special page>  ATT (attachments)
   A suffix ";" chains extra types, e.g.  L:A-04,A-05;ATT
   ===================================================================== */
const CAT_SECTIONS=[['PL','Planning','التخطيط'],['RA','Risk Assessment','تقييم المخاطر'],['RR','Risk Response','الاستجابة للمخاطر'],['PP','Plans and Procedures','الخطط والإجراءات'],['CO','Completion','الإقفال'],['PF','Permanent File','الملف الدائم'],['SD','System Documents','مستندات النظام']];
const CAT_TREE_SRC=`
@S|PL
@G|PL-setup|Engagement Set-up|تأسيس الارتباط
A100|Optimiser checklist - Initial Engagement Decisions|قائمة فحص — القرارات الأولية للارتباط|F:eng_decisions
@G|PL-general|General|عام
A105|Working papers supporting statement of cash flows|أوراق العمل المؤيدة لقائمة التدفقات النقدية|X:cfsupport
A110|Financial groupings assignment tool|أداة إسناد التجميعات المالية (التبويب)|X:groupings
@G|PL-accept|Client Acceptance/Continuance|قبول العميل / استمرار العلاقة
A200|Preliminary engagement activities|الأنشطة التمهيدية للارتباط|L:A-01,A-02,A-03
A200Q|Request - Engagement letter|طلب — خطاب الارتباط|R:eng_letter
A205|Terms of engagement (engagement letter) - signed|شروط الارتباط (خطاب الارتباط) — موقّع|L:A-04,A-05;ATT
A205L|Terms of engagement (engagement letter)|شروط الارتباط (خطاب الارتباط) — النموذج|TPL:engletter
A210Q|Request - Letter to predecessor accountant|طلب — خطاب إلى المراجع السابق|R:pred_letter
A215|Letter to a predecessor accounting firm - signed|خطاب إلى مكتب المراجعة السابق — موقّع|L:A-06;ATT
A215L|Letter to a predecessor accounting firm|خطاب إلى مكتب المراجعة السابق — النموذج|F:letter_pred
A220|Initial audit engagement - Opening balances|ارتباط المراجعة الأول — الأرصدة الافتتاحية|L:V-12;F:opening
A225|Letter to a successor accounting firm - Signed|خطاب إلى مكتب المراجعة اللاحق — موقّع|F:letter_succ;ATT
A230|Worksheet - Engagement risk factors|ورقة عمل — عوامل خطر الارتباط|X:eng_risk
@G|PL-strategy|Overall Audit Strategy|استراتيجية المراجعة العامة
A300|Overall audit strategy|استراتيجية المراجعة العامة|L:A-10,A-11,A-12
A305|Worksheet - Selecting an auditor's expert|ورقة عمل — اختيار خبير المراجع|L:A-15;TPL:expert
A310|Hiring an external audit specialist|التعاقد مع متخصص مراجعة خارجي|F:hire_specialist
A315|Worksheet - Understanding and evaluation of a service organisation|ورقة عمل — فهم وتقييم المنظمة الخدمية|L:A-17
A315-1|Worksheet - Understanding and evaluation of a service organisation (1)|فهم المنظمة الخدمية (١) — الخدمات المقدمة وأهميتها|F:svc_1
A315-2|Worksheet - Understanding and evaluation of a service organisation (2)|فهم المنظمة الخدمية (٢) — تقرير النوع 1 / النوع 2 (ISAE 3402)|F:svc_2
A315-3|Worksheet - Understanding and evaluation of a service organisation (3)|فهم المنظمة الخدمية (٣) — الضوابط المكمّلة لدى المستخدم|F:svc_3
A315-4|Worksheet - Understanding and evaluation of a service organisation (4)|فهم المنظمة الخدمية (٤) — المنظمات الفرعية والاستنتاج|F:svc_4
A320|Worksheet - Understanding and evaluation of the internal audit function|ورقة عمل — فهم وتقييم وظيفة المراجعة الداخلية|F:ia_func;TPL:iaeval
A325Q|Engagement expert - Query|استفسار — خبير الارتباط|Q:expert
A330|Worksheet - Provisions, estimates, allowances and accruals bias tracking|ورقة عمل — تتبع تحيّز المخصصات والتقديرات والاستحقاقات|X:bias
A335|Preliminary time budget|الميزانية الزمنية المبدئية|L:A-13,A-14;X:timebudget
A340|Audit planning letter (Those charged with governance)|خطاب تخطيط المراجعة (المكلفون بالحوكمة) — موقّع|ATT;TPL:tcwg
A340L|Audit planning letter (Those charged with governance)|خطاب تخطيط المراجعة (المكلفون بالحوكمة) — النموذج|F:letter_planning
A340Q|Audit planning letter – Those charged with governance - Query|استفسار — خطاب تخطيط المراجعة|Q:tcwg
A360|Worksheet - Selecting a component auditor|ورقة عمل — اختيار مراجع المكون|L:A-16
@G|PL-meetings|Client Meetings and Deliverables|اجتماعات العميل والمخرجات
A350|Firm deliverables and client information letter|مخرجات المكتب وخطاب معلومات العميل|F:deliverables
A350L|Firm deliverables and client information letter|مخرجات المكتب وخطاب معلومات العميل — النموذج|F:letter_deliverables
A355Q|Overall client information request|طلب معلومات العميل الشامل (قائمة PBC)|X:pbc
@G|PL-team|Team Discussions|مناقشات الفريق
A400|Team planning discussions|مناقشات تخطيط الفريق|L:A-14;F:team_discuss
A405|Preparing the risk assessment procedures|إعداد إجراءات تقييم المخاطر|F:ra_procedures
A410|Fraud scenarios|سيناريوهات الغش|F:fraud_scen;L:B-10,B-11
A415|Worksheet - Inherent risk factors|ورقة عمل — عوامل الخطر المتأصل|X:inherent
@G|PL-mat|Materiality|الأهمية النسبية
A500|Materiality|الأهمية النسبية|X:mat
@S|RA
@G|RA-analytics|Analytics|التحليلات
B020|CSV Transactions Import|استيراد القيود والمعاملات (CSV)|X:csvimport
B030|Data Completeness check|فحص اكتمال البيانات|X:completeness
B031|Data Completeness Results|نتائج فحص اكتمال البيانات|X:completeness_res
@G|RA-review|Analytical Review|المراجعة التحليلية
B100|Analytical review|المراجعة التحليلية (الإجراءات التحليلية المبدئية)|X:analytics_prelim;L:B-19
@G|RA-entity|Understanding the Entity|فهم المنشأة
B200|Understanding the entity and its environment|فهم المنشأة وبيئتها|L:A-22,A-07
B200Q|Understanding the entity and its environment - Query|فهم المنشأة وبيئتها — استفسار|Q:entity
B205|Understanding the entity - Industry, regulatory, and other external factors|فهم المنشأة — الصناعة والبيئة التنظيمية والعوامل الخارجية|F:entity_ext;L:A-19
B210|Understanding the entity - Nature of the entity|فهم المنشأة — طبيعة المنشأة|F:entity_nature
B215|Understanding the entity - Financial reporting framework, accounting policies, estimates|فهم المنشأة — الإطار المحاسبي والسياسات المحاسبية والتقديرات|F:entity_framework;L:V-05
B220|Understanding the entity - Measurement and review of financial performance|فهم المنشأة — قياس ومراجعة الأداء المالي|F:entity_perf
B225|Worksheet - Understanding climate related issues on the entity|ورقة عمل — فهم القضايا المناخية وأثرها على المنشأة|F:climate
B230|Worksheet - Understanding the revenue streams of the entity|ورقة عمل — فهم مصادر إيرادات المنشأة|F:rev_streams
@G|RA-est|Accounting Estimates|التقديرات المحاسبية
B240|Overview of Approaches to Accounting Estimates|نظرة عامة على مناهج التقديرات المحاسبية (ISA 540)|F:est_overview
B250|Worksheet - Understanding accounting estimates|ورقة عمل — فهم التقديرات المحاسبية|F:est_understand
B255|Worksheet - Understanding complex accounting estimates|ورقة عمل — فهم التقديرات المحاسبية المعقدة|F:est_complex
B260|Worksheet - Outcome of prior period accounting estimates|ورقة عمل — نتائج تقديرات الفترة السابقة|X:est_outcome
B265|Worksheet - Outcome of prior period accounting estimates (complex)|ورقة عمل — نتائج تقديرات الفترة السابقة (المعقدة)|X:est_outcome2
@G|RA-ic|Understanding Components of Internal Control|فهم مكونات الرقابة الداخلية
B300|Understanding of the components of the entity's system of internal control|فهم مكونات نظام الرقابة الداخلية للمنشأة|L:C-02,C-21,C-01
B300Q|Understanding of the components of internal control - Query|فهم مكونات الرقابة الداخلية — استفسار|Q:ic
B305|Understanding the IT Environment|فهم بيئة تقنية المعلومات|F:it_env
B310|Understanding the IT environment - Listing|فهم بيئة تقنية المعلومات — قائمة الأنظمة|F:it_listing
B315|Identifying risks through understanding the components of internal control|تحديد المخاطر من خلال فهم مكونات الرقابة الداخلية|L:C-05
B320|General IT Controls|ضوابط تقنية المعلومات العامة|L:C-16,C-13,C-14,C-15,C-17,C-18,C-20
B325|Worksheet - Control implementation - Business process controls|ورقة عمل — تطبيق الضوابط — ضوابط العمليات|L:C-07,C-08
B330|Information flow - Business process|تدفق المعلومات — العمليات|L:C-03,C-04,C-06
B335|Understanding the financial reporting process|فهم عملية إعداد التقارير المالية|F:fin_reporting
B350|Control report|تقرير الرقابة|X:control_report
@G|RA-rmm|Identified Areas of Increased Risk of Material Misstatement|مجالات زيادة خطر التحريف الجوهري
B400|Assessment of RMM (including Fraud Risks)|تقييم مخاطر التحريف الجوهري (بما فيها مخاطر الغش)|X:rmm;L:B-05,B-06,B-07,B-08,B-09,B-12,B-13,B-14,B-15,B-16
B405|Identifying fraud risks|تحديد مخاطر الغش|F:fraud_risks
B410|Worksheet - Minutes of governance meetings|ورقة عمل — محاضر اجتماعات الحوكمة|F:minutes
B450|Risk report|تقرير المخاطر|X:risk_report
@G|RA-summary|Risk Assessment Summary|ملخص تقييم المخاطر
B500|Risk Assessment Report|تقرير تقييم المخاطر|X:risk_summary;TPL:riskassess
B510|Group audit program - Engagement scoping components|برنامج مراجعة المجموعة — نطاق المكونات|L:U-01,U-02,U-03,U-04
@G|RA-proc|Risk Assessment Procedures|إجراءات تقييم المخاطر
B600|Going concern identification|تحديد مؤشرات الاستمرارية|L:A-21,R-01
B610|Going concern considerations|اعتبارات الاستمرارية|L:R-02,R-03,R-04,R-05,R-06,R-07,R-08,R-09,R-10
@S|RR
@G|RR-toc|Tests of Control|اختبارات الرقابة
C050|Worksheet - Sampling - Tests of controls - Revenues, receivables, receipts|ورقة عمل — العينات — اختبارات الرقابة — الإيرادات والمدينون والمقبوضات|X:toc:rev
C055|Worksheet - Sampling - Tests of controls - Purchases, payables, payments|ورقة عمل — العينات — اختبارات الرقابة — المشتريات والدائنون والمدفوعات|X:toc:pur
C060|Worksheet - Sampling - Tests of controls - Payroll|ورقة عمل — العينات — اختبارات الرقابة — الرواتب|X:toc:pay
C065|Worksheet - Sampling - Tests of controls - Financial reporting|ورقة عمل — العينات — اختبارات الرقابة — إعداد التقارير المالية|X:toc:fr
C070|Worksheet - Sampling - Tests of controls - Investments|ورقة عمل — العينات — اختبارات الرقابة — الاستثمارات|X:toc:invst
C075|Worksheet - Sampling - Tests of controls - Inventory|ورقة عمل — العينات — اختبارات الرقابة — المخزون|X:toc:inv
C080|Worksheet - Sampling - Tests of controls - Treasury|ورقة عمل — العينات — اختبارات الرقابة — الخزينة|X:toc:tre
C085|Worksheet - Fixed assets - Sampling - Tests of controls|ورقة عمل — الأصول الثابتة — العينات — اختبارات الرقابة|X:toc:fa
C090|Worksheet - Tests of controls - Financial statement level controls|ورقة عمل — اختبارات الرقابة — الضوابط على مستوى القوائم المالية|X:toc:entity
@G|RR-general|General Audit Procedures|إجراءات المراجعة العامة
C100|Audit response to assessed risks|استجابة المراجعة للمخاطر المقيّمة|X:response;L:B-17,B-18
C105Q|Request for records and documents|طلب السجلات والمستندات|R:records
C110|Responding to risk at the financial statement level|الاستجابة للمخاطر على مستوى القوائم المالية|F:fs_level_resp
C115|Worksheet - Going-concern evaluation|ورقة عمل — تقييم الاستمرارية|F:gc_eval;L:R-09,R-10;TPL:gcmemo
C120|Worksheet - Summary of external confirmations|ورقة عمل — ملخص المصادقات الخارجية|X:confirmations
C130|Litigation, claims and non-compliance|القضايا والمطالبات وعدم الالتزام|L:A-20,Q-01,Q-02,Q-03,Q-04,Q-05;TPL:legalconf
C130E|Litigation, claims and non-compliance - Accounting estimate - Risk assessment and response|القضايا والمطالبات — التقديرات المحاسبية — تقييم المخاطر والاستجابة|F:est_generic
C135|Subsequent events|الأحداث اللاحقة|L:S-01,S-02,S-03,S-04,S-05,S-06,S-07,S-08,S-09;TPL:subsev
C140|Worksheet - Related party transactions|ورقة عمل — معاملات الأطراف ذات العلاقة|L:A-18,O-01,O-02,O-03,O-04,O-05,O-06,O-07;TPL:rpmemo
C145|Use of journal entries|استخدام القيود اليومية|L:T-01,T-02,T-03,T-04,T-05,T-06,T-07,T-08,T-09;X:jetlink
C150|Statement of cash flows - Audit procedures|إجراءات مراجعة قائمة التدفقات النقدية|X:cfproc
C155|Documenting consultation|توثيق الاستشارات|F:consultation
C160|Financial reporting - Audit procedures|إجراءات مراجعة إعداد التقارير المالية|L:V-01,V-02,V-03,V-04,V-06,V-07,V-08,V-09,V-10,V-11
C165|Worksheet - Evaluating the work of a component auditor|ورقة عمل — تقييم عمل مراجع المكون|L:U-05,U-07
@G|RR-comp|Component Auditor Communication|التواصل مع مراجعي المكونات
C205|Letter to a component auditor|خطاب إلى مراجع المكون|TPL:groupinst
C210|Instructions for a component auditor|تعليمات لمراجع المكون|L:U-06
@S|CO
@G|CO-mis|Identified Misstatements|التحريفات المحددة
D100|Evaluation of misstatements identified|تقييم التحريفات المحددة|L:W-01,W-02,W-03,W-04,W-05,W-07,W-08,W-09,W-10
D200|Summary of misstatements|ملخص التحريفات|X:mis_summary;L:W-06;TPL:sum450
@G|CO-evidence|Evaluate Audit Evidence|تقييم أدلة المراجعة
D300|Evaluation of work performed by others involved in the audit|تقييم عمل الآخرين المشاركين في المراجعة|F:others_work
D305|Worksheet - Engagement quality review checklist|ورقة عمل — قائمة فحص مراجعة جودة الارتباط|L:A-23,X-03;TPL:eqr
D350|Partner and manager summary|ملخص الشريك والمدير|X:partner_summary;TPL:compmemo
@G|CO-findings|Audit Findings|نتائج المراجعة
D360|Key audit matters|أمور المراجعة الرئيسية|L:X-21
@G|CO-fs|Financial Statements and Audit Report|القوائم المالية وتقرير المراجعة
D400|Simple Statements|القوائم المبسطة (من الميزان بعد التسويات)|X:fs_simple
D401|Statement of financial position|قائمة المركز المالي|X:fs_sfp
D402|Income statement|قائمة الدخل (الأرباح أو الخسائر)|X:fs_pl
D403|Statement of comprehensive income|قائمة الدخل الشامل|X:fs_oci
D404|Statement of changes in equity|قائمة التغير في حقوق الملكية|X:fs_soce
D406|Statement of cash flows (indirect)|قائمة التدفقات النقدية (الطريقة غير المباشرة)|X:fs_cf
D407|Notes to the financial statements|الإيضاحات المتممة للقوائم المالية|X:fs_notes
D405|Draft financial statements|مسودة القوائم المالية|X:fs_draft
D410|Final financial statements|القوائم المالية النهائية|X:fs_final
D415|Financial statements for regulatory filing|القوائم المالية للإيداع لدى الجهات الرقابية|F:fs_regulatory
D420|Annual report review|مراجعة التقرير السنوي (المعلومات الأخرى)|L:V-13
D425|Tax filings|الإقرارات الضريبية|F:tax_filings
@G|CO-tcwg|Reports to Those Charged with Governance|التقارير إلى المكلفين بالحوكمة
D500|Communications with Management/TCWG|الاتصال بالإدارة والمكلفين بالحوكمة|L:X-09;TPL:tcwg
D500Q|Client deliverables queries - Query|استفسارات مخرجات العميل|Q:deliverables
D505|Worksheet - Matters to be communicated to management and TCWG|ورقة عمل — الأمور الواجب إبلاغها للإدارة والمكلفين بالحوكمة|F:matters_comm
D510|Communications to be made by the auditor with TCWG and management|الاتصالات المطلوبة من المراجع مع المكلفين بالحوكمة والإدارة|F:comm_requirements
D515|Management letter|خطاب الإدارة|TPL:mgmtletter
D515L|Management letter|خطاب الإدارة — النموذج|F:letter_mgmt
D520|Report for those charged with governance|تقرير للمكلفين بالحوكمة|F:tcwg_report
D520L|Report for those charged with governance|تقرير للمكلفين بالحوكمة — النموذج|F:letter_tcwg
D525|Audit findings - Sample letter|نتائج المراجعة — خطاب نموذجي|F:findings_letter
D525L|Audit findings - Sample letter|نتائج المراجعة — خطاب نموذجي (النموذج)|F:letter_findings
D530|Significant deficiencies in internal control (TCWG)|أوجه القصور الجوهرية في الرقابة الداخلية (المكلفون بالحوكمة)|L:C-10,C-11,C-12,X-10;TPL:deflet
D530L|Significant deficiencies in internal control (TCWG)|أوجه القصور الجوهرية في الرقابة الداخلية — النموذج|F:letter_deficiencies
@G|CO-gov|Governance Meeting Notes|محاضر اجتماعات الحوكمة
D535|Governance meeting notes|ملاحظات اجتماعات الحوكمة|F:gov_notes
@G|CO-reps|Management Representations|إقرارات الإدارة
D540Q|Request - Management representation letter|طلب — خطاب إقرارات الإدارة|R:rep_letter
D545|Written representations (management representation letter)|الإقرارات المكتوبة (خطاب إقرارات الإدارة)|L:X-08;ATT
D545L|Written representations (management representation letter)|الإقرارات المكتوبة — النموذج|TPL:replet
@G|CO-wrap|Engagement Wrap-Up|الإقفال النهائي للارتباط
D600|Audit completion|إقفال المراجعة|L:X-01,X-22,X-23
D610|Reporting checklist|قائمة فحص إعداد التقرير|L:X-13,X-12
D615|Documentation checklist|قائمة فحص التوثيق|L:X-11,X-04
D620|Audit report|تقرير المراجعة|L:X-14,X-15,X-16,X-17,X-18,X-19,X-20;TPL:audrep
D625|Checklist - Audit completion|قائمة فحص — إقفال المراجعة|L:X-02,X-05,X-06,X-07;F:completion_check
D630|Worksheet - Withdrawal|ورقة عمل — الانسحاب من الارتباط|F:withdrawal
@S|PF
@G|PF-file|Permanent File|الملف الدائم
D700Q|Request for records and documents - permanent file|طلب السجلات والمستندات — الملف الدائم|R:permfile
D710|Business plan|خطة العمل|F:pf_doc
D720|Organisation chart|الهيكل التنظيمي|F:pf_doc
D730|Articles of incorporation|عقد التأسيس|F:pf_doc
D740|Corporate bylaws|النظام الأساسي واللوائح الداخلية|F:pf_doc
D750|Details of corporate reorganisation|تفاصيل إعادة الهيكلة المؤسسية|F:pf_reorg
D760|Shareholders buy/sell agreement|اتفاقية الشراء والبيع بين المساهمين|F:pf_doc
D770|Partnership agreement|عقد الشراكة|F:pf_doc
D780|Commercial register and tax card|السجل التجاري والبطاقة الضريبية وشهادات التسجيل|F:pf_doc
D790|General assembly and board minutes (key)|محاضر الجمعية العامة ومجلس الإدارة (الجوهرية)|F:pf_doc
D795|Significant contracts, licences and permits|العقود الجوهرية والتراخيص والتصاريح|F:pf_doc
@S|SD
@G|SD-art|ART documents|مستندات جدول الاستجابة للمخاطر
SD-1|Audit Response Table Settings|إعدادات جدول الاستجابة للمخاطر|X:art_settings
SD-2|Dynamic Audit Response Table|جدول الاستجابة الديناميكي للمخاطر|X:art_dynamic
SD-3|GC - Author mode visibility form|نموذج التحكم في ظهور واستبعاد الأوراق (وضع المؤلف)|X:visibility
SD-4|PMSD|إعدادات الأهمية النسبية والعينات الافتراضية (PMSD)|X:pmsd
SD-5|Tests of Details settings form|نموذج إعدادات اختبارات التفاصيل|X:tod_settings
`;

/* ---------- Plans and Procedures: audit areas (account-based). Special items use the numbering of the reference tree. ---------- */
/* id|code|superGroup|English|العربية|FS-line ids|classification group filter|special items  (special: n:ref:En:ar:type) */
const CAT_AREAS_SRC=`
NCA|1|PPE|Property, Plant and Equipment|الممتلكات والآلات والمعدات|ppe,depx||
NCA|3|CIP|Construction in Progress and Capital Advances|المشروعات تحت التنفيذ والدفعات الرأسمالية المقدمة|cip||new
NCA|5|IP|Investment Property|الاستثمارات العقارية|ip||
NCA|10|INT|Intangible Assets|الأصول غير الملموسة والشهرة|int,gw||
NCA|20|INV|Investments|الاستثمارات المالية طويلة الأجل|finv|موجودات غير متداولة|
NCA|21|ASC|Investments in Subsidiaries, Associates and Joint Ventures|الاستثمارات في الشركات التابعة والزميلة والمشروعات المشتركة|isub,assoc||new
NCA|35|NCR|Receivables, Non-Current|الأرصدة المدينة طويلة الأجل|ncao||
NCA|40|AGR|Agricultural Assets|الأصول البيولوجية (الزراعية)|bio||110:40.110:Agricultural asset count checklist:قائمة فحص جرد الأصول البيولوجية:L:H-22
CA|110|INVT|Inventories|المخزون|inv||110:110.110:Inventory count checklist:قائمة فحص جرد المخزون:L:G-03,G-04,G-05,G-06,G-07;consign:A5.2-1:Inventory consigned to others confirmation:مصادقة المخزون لدى الغير (أمانات):TPL:arconf;consign2:A5.2-2:Inventory consigned to others confirmation - Sample response letter:مصادقة المخزون لدى الغير — خطاب رد نموذجي:F:letter_consign;outside:A6.1:Inventory held at outside locations inquiry:استفسار المخزون المحتفظ به في مواقع خارجية:F:inv_outside
CA|120|OFA|Other Financial Assets, Current|الأصول المالية الأخرى المتداولة|finv|موجودات متداولة|
CA|122|DER|Derivatives and Hedging|المشتقات المالية ومحاسبة التحوط|der||new
CA|130|REC|Receivables, Current (Trade and Other)|الذمم المدينة المتداولة (التجارية والأخرى)|tr,nr,orc,eclx||110:130.110:Accounts receivable confirmation - Supplementary procedures:مصادقات المدينين — الإجراءات البديلة والمكملة:L:F-06,F-07;ar:A5.1:Accounts receivable confirmation:مصادقة أرصدة المدينين:TPL:arconf
CA|133|CON|Contract Assets and Contract Liabilities (IFRS 15)|أصول والتزامات العقود (IFRS 15)|ca,cl||new
CA|135|PRE|Prepayments|المصروفات المدفوعة مقدمًا|pre||
CA|140|CASH|Cash and Cash Equivalents|النقدية وما في حكمها|cash||110:140.110:Bank reconciliation procedures:إجراءات التسويات البنكية:L:E-04,E-07,E-08,E-09;115:140.115:Cash count procedures:إجراءات جرد النقدية:L:E-02,E-03
EQ|200|EQY|Equity|حقوق الملكية|cap,shp,trs,re,res,ocires||
EQ|205|NCI|Non-controlling Interests and Consolidation|الحقوق غير المسيطرة والتجميع|nci||new
NCL|300|BOR|Borrowings, Non-Current|القروض طويلة الأجل والسندات|bor,bond|مطلوبات غير متداولة|a53:A5.3:Non-Current Borrowings Confirmation:مصادقة القروض طويلة الأجل:TPL:bankconf
NCL|330|ONL|Other Liabilities, Non-Current|الالتزامات غير المتداولة الأخرى|oliab|مطلوبات غير متداولة|
NCL|335|GG|Government Grants|المنح الحكومية|oliab||
NCL|340|LES|Leases for Lessees (IFRS 16 — Right-of-use assets and lease liabilities)|عقود الإيجار — المستأجر (IFRS 16: أصول حق الاستخدام والتزامات الإيجار)|rou,ll||new
NCL|341|LSR|Leases for Lessors (Finance lease receivables and operating leases)|عقود الإيجار — المؤجر (التأجير التمويلي والتشغيلي)|ncao||new
NCL|345|LTE|Long-term Employee Liabilities|التزامات العاملين طويلة الأجل|ebo||
NCL|346|SBP|Share-based Payments|المدفوعات المبنية على الأسهم|res||new
NCL|350|PRV|Provisions and Contingencies|المخصصات والالتزامات المحتملة|prov,cont||
NCL|355|DEF|Deferred Income|الإيرادات المؤجلة|oliab,cl||
CL|400|CBR|Current borrowings|القروض والتسهيلات قصيرة الأجل|bor,np|مطلوبات متداولة|110:400.110:Bank confirmation - borrowings:مصادقة التسهيلات والقروض:TPL:bankconf
CL|425|PAY|Payables|الدائنون التجاريون والمستحقات|tp,np,accr||110:425.110:Accounts payable confirmation - Supplementary procedures:مصادقات الدائنين — الإجراءات البديلة:TPL:apconf
CL|430|OCL|Other Current Liabilities|الالتزامات المتداولة الأخرى|opay,emp,finl||
CL|435|RPT|Related Parties|الأطراف ذات العلاقة|rpr,rpp||
CL|440|ITB|Income Tax Balance (Current)|رصيد ضريبة الدخل (الجارية)|taxp,taxa|مطلوبات متداولة|
CL|441|OTX|Other Taxes (VAT, Payroll Tax, Withholding, Stamp Duty)|الضرائب الأخرى (القيمة المضافة، كسب العمل، الخصم والإضافة، الدمغة)|taxp||new
CL|445|DTX|Deferred Tax|الضرائب المؤجلة|dtl,taxa||
PL|1500|REV|Revenues|الإيرادات|rev||
PL|1600|COS|Cost of Sales|تكلفة المبيعات|cos||
PL|1600.105|EMP|Employee Benefits|مزايا العاملين (الرواتب)|payx||
PL|1650|OOE|Other operating expenses|المصروفات التشغيلية الأخرى|admx,profx,sellx||
PL|1700|OIN|Other Income|الإيرادات الأخرى|nonop||
PL|1750|FIN|Finance Income and Finance Costs|إيرادات وتكاليف التمويل|fininc,fincost||new
PL|1800|OEX|Other Expenses|المصروفات الأخرى|nonop||
PL|1850|FXA|Foreign Currency and Fair Value Changes|فروق العملة وتغيرات القيمة العادلة|fxfv||new
PL|1900|ITX|Income Tax Expense|مصروف ضريبة الدخل|taxx||
PL|1950|OCI|Other Comprehensive Income and Equity Movements|الدخل الشامل الآخر وحركة حقوق الملكية|oci,eqmov||new
`;
const CAT_SUPER=[['NCA','الموجودات غير المتداولة','Non-current assets'],['CA','الموجودات المتداولة','Current assets'],['EQ','حقوق الملكية','Equity'],['NCL','المطلوبات غير المتداولة','Non-current liabilities'],['CL','المطلوبات المتداولة','Current liabilities'],['PL','قائمة الدخل والدخل الشامل','Income statement']];

/* ===== 25_forms.js ===== */

/* =====================================================================
   v7 · تبسيط الكتالوج — أوراق أُزيلت لأنها مكررة أو قليلة الفائدة
   - CAT_DROP     : أوراق شجرة الكتالوج المحذوفة (طلبات/استفسارات مكررة مع قائمة PBC A355Q، ونسخ «النموذج» المكررة للخطابات)
   - CAT_NOEST    : مجالات لا تحتاج ورقة «التقديرات المحاسبية» (لا تقديرات جوهرية فيها)
   - CAT_RETIRE   : أوراق المكتبة القديمة المُلغاة [المراجع, البديل المقترح]
   أوراق الاستفسار لكل مجال (…Q) أُلغيت؛ سجل الاستفسارات صار في صفحة «الاستفسارات» العامة.
   ===================================================================== */
const CAT_DROP=new Set(['A200Q','A210Q','A325Q','A340Q','B200Q','B300Q','C105Q','D500Q','D540Q','D700Q',
 'A205L','A215L','A340L','A350L','D515L','D520L','D525L','D530L','D545L','B410','A310','C130E','SD-2']);
const CAT_NOEST=new Set(['CASH','EQY','NCI','BOR','ONL','GG','DEF','CBR','OCL','RPT','OTX','COS','EMP','OOE','OIN','FIN','OEX','OCI','PRE']);
const CAT_RETIRE=[
 ['B-01 B-02 B-03 B-04','A500','الأهمية النسبية تُحتسب في A500'],
 ['A-08 A-09','','الفهارس متاحة من «الخريطة»'],
 ['C-09 C-19','C050','اختبارات الرقابة في C050–C090'],
 ['D-01 D-02 D-03 D-04 D-05 D-06 D-07 D-08 D-09 D-10 D-11 D-12 D-13 D-14 D-15 D-16','','حاسبات العينات في صفحة «العينات» وفي ورقة 125 لكل مجال'],
 ['M-12','440-101','النزاعات الضريبية ضمن مجال ضريبة الدخل'],
 ['P-02 P-03 P-04 P-05 P-06 P-09 P-10','B250','التقديرات المحاسبية في B240–B265'],
 ['Q-08','C135','الأحداث اللاحقة في C135'],
 ['Y-01 Y-02 Y-03 Y-04 Y-05 Y-06 Y-07 Y-08 Y-09 Y-10 Y-11 Y-12 Y-13 Y-14 Y-15 Y-16 Y-17 Y-18 Y-19 Y-20','','نماذج عامة قليلة الفائدة']
];
