/* ============================================================
   AuditPro - Reports Module
   Automatic generation of all audit report types
   ============================================================ */

const ReportsModule = (() => {

  const REPORT_TYPES = [
    {
      id: 'completion',
      title: 'Audit Completion Report',
      titleAr: 'تقرير إتمام المراجعة',
      desc: 'ملخص شامل لنتائج المراجعة ومدى إتمام إجراءاتها وجاهزية التقرير',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`
    },
    {
      id: 'management_letter',
      title: 'Management Letter',
      titleAr: 'خطاب الإدارة',
      desc: 'خطاب موجّه للإدارة يوضح الملاحظات ونقاط الضعف في الرقابة الداخلية',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`
    },
    {
      id: 'internal_control',
      title: 'Internal Control Report',
      titleAr: 'تقرير الرقابة الداخلية',
      desc: 'تقرير مفصل عن نقاط الضعف والقوة في منظومة الرقابة الداخلية',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
    },
    {
      id: 'findings_report',
      title: 'Audit Findings Report',
      titleAr: 'تقرير نتائج المراجعة',
      desc: 'تقرير شامل بجميع الملاحظات والاستثناءات والاستفسارات وردود الإدارة',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
    },
    {
      id: 'risk_assessment',
      title: 'Risk Assessment Report',
      titleAr: 'تقرير تقييم المخاطر',
      desc: 'تقرير تقييم المخاطر على مستوى القوائم المالية والبنود والتأكيدات',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`
    },
    {
      id: 'materiality_report',
      title: 'Materiality Report',
      titleAr: 'تقرير الأهمية النسبية',
      desc: 'توثيق احتساب الأهمية النسبية ومستوياتها ومبرراتها',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
    },
    {
      id: 'planning_report',
      title: 'Planning Report',
      titleAr: 'تقرير التخطيط',
      desc: 'توثيق مرحلة التخطيط للمراجعة وفهم المنشأة وتقييم المخاطر',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>`
    },
    {
      id: 'final_summary',
      title: 'Final Audit Summary',
      titleAr: 'الملخص التنفيذي النهائي',
      desc: 'ملخص تنفيذي شامل لجميع مراحل المراجعة ونتائجها وتوصياتها',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>`
    },
    {
      id: 'audit_opinion',
      title: "Auditor's Report (ISA 700)",
      titleAr: 'تقرير المراجع المستقل (ISA 700)',
      desc: 'قالب تقرير رأي المراجع المستقل وفق معيار ISA 700 بصيغة غير معدّلة أو معدّلة',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>`
    },
    {
      id: 'year_comparison',
      title: 'Year-on-Year Comparison',
      titleAr: 'مقارنة بين السنتين',
      desc: 'مقارنة الأهمية النسبية والملاحظات وإجراءات المراجعة بين السنة الحالية والسابقة',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>`
    },
    {
      id: 'client_comparison',
      title: 'Clients Comparison',
      titleAr: 'مقارنة العملاء',
      desc: 'جدول مقارنة شامل بين جميع ملفات العملاء — الإنجاز والمخاطر والملاحظات',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
    }
  ];

  /* ---- Render reports page ---- */
  async function renderReports() {
    const container = document.getElementById('reportsContent');
    if (!container) return;

    const clientId = App.getActiveClientId();
    if (!clientId) {
      container.innerHTML = Utils.noClientWarning('إنشاء التقارير');
      return;
    }

    const client = await AuditDB.get(AuditDB.STORES.CLIENTS, clientId);

    container.innerHTML = `
      <div class="info-box mb-5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div>
          إنشاء التقارير للعميل: <strong>${Utils.escapeHtml(client?.name || '—')}</strong> —
          السنة المالية: <strong>${Utils.escapeHtml(client?.financialYear || '—')}</strong>
        </div>
      </div>

      <div class="grid grid-4" id="reportsGrid">
        ${REPORT_TYPES.map(r => `
          <div class="report-card">
            <div class="report-icon">${r.icon}</div>
            <div class="report-name">${r.titleAr}</div>
            <div style="font-size:11px;color:var(--text-muted);font-style:italic;">${r.title}</div>
            <div class="report-desc">${r.desc}</div>
            <div class="report-footer" style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-primary btn-sm" onclick="ReportsModule.generateReport('${r.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
                إنشاء التقرير
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /* ---- Generate and show report ---- */
  async function generateReport(reportId) {
    const clientId = App.getActiveClientId();
    if (!clientId) return;

    Utils.showLoading('جارٍ إنشاء التقرير...');

    try {
      const activeYear = App.getActiveYear();
      const [client, findings, procedures, materiality, planning, workpapers, risks] = await Promise.all([
        AuditDB.get(AuditDB.STORES.CLIENTS, clientId),
        AuditDB.getByClientYear(AuditDB.STORES.FINDINGS, clientId, activeYear),
        AuditDB.getByClientYear(AuditDB.STORES.PROCEDURES, clientId, activeYear),
        AuditDB.getByClientYear(AuditDB.STORES.MATERIALITY, clientId, activeYear),
        AuditDB.getByClientYear(AuditDB.STORES.PLANNING, clientId, activeYear),
        AuditDB.getByClientYear(AuditDB.STORES.WORKPAPERS, clientId, activeYear),
        AuditDB.getByClientYear(AuditDB.STORES.RISKS, clientId, activeYear)
      ]);

      const firmName = await AuditDB.getSetting('firmName') || 'مكتب المراجعة';
      const firmLogo = await AuditDB.getSetting('firmLogo') || '';
      const mat = materiality.length > 0 ? materiality[materiality.length - 1] : null;

      let reportHTML = '';

      switch(reportId) {
        case 'completion':
          reportHTML = buildCompletionReport(client, procedures, findings, workpapers, firmName, mat);
          break;
        case 'management_letter':
          reportHTML = buildManagementLetter(client, findings, firmName);
          break;
        case 'internal_control':
          reportHTML = buildInternalControlReport(client, findings, planning, firmName);
          break;
        case 'findings_report':
          reportHTML = buildFindingsReport(client, findings, firmName);
          break;
        case 'risk_assessment':
          reportHTML = await buildRiskAssessmentReport(client, planning, procedures, risks, firmName);
          break;
        case 'materiality_report':
          reportHTML = buildMaterialityReport(client, mat, firmName);
          break;
        case 'planning_report':
          reportHTML = buildPlanningReport(client, planning, firmName);
          break;
        case 'final_summary':
          reportHTML = await buildFinalSummary(client, procedures, findings, workpapers, mat, planning, firmName);
          break;
        case 'audit_opinion':
          reportHTML = await buildAuditOpinionReport(client, procedures, findings, mat, firmName, firmLogo);
          break;
        case 'year_comparison':
          reportHTML = await buildYearComparisonReport(client, procedures, findings, mat, risks, firmName);
          break;
        case 'client_comparison':
          reportHTML = await buildClientComparisonReport(firmName);
          break;
        default:
          reportHTML = '<p>التقرير غير متاح</p>';
      }

      Utils.hideLoading();

      const reportType = REPORT_TYPES.find(r => r.id === reportId);
      Utils.openModal(reportType?.titleAr || 'تقرير', reportHTML, `
        <button class="btn btn-primary" onclick="window.print()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          طباعة / PDF
        </button>
        <button class="btn btn-secondary" onclick="Utils.closeModal()">إغلاق</button>
      `, 'xl');

    } catch(err) {
      Utils.hideLoading();
      Utils.showToast('خطأ في إنشاء التقرير', 'error');
      console.error(err);
    }
  }

  /* ---- Shared report header ---- */
  function reportHeader(firmName, reportTitle, client, date = null) {
    return `
      <div style="text-align:center;border-bottom:3px solid var(--color-primary);padding-bottom:20px;margin-bottom:24px;">
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px;">${Utils.escapeHtml(firmName)}</div>
        <div style="font-size:22px;font-weight:700;color:var(--color-primary);margin:8px 0;">${reportTitle}</div>
        <div style="font-size:14px;color:var(--text-secondary);">
          ${Utils.escapeHtml(client?.name || '—')} | السنة المالية: ${Utils.escapeHtml(client?.financialYear || '—')}
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">
          تاريخ الإصدار: ${Utils.formatDate(date || new Date().toISOString())}
        </div>
      </div>
    `;
  }

  /* ---- Section ---- */
  function reportSection(title, content) {
    return `
      <div style="margin-bottom:24px;">
        <div style="font-size:15px;font-weight:700;color:var(--color-primary);border-right:4px solid var(--color-accent);padding-right:12px;margin-bottom:12px;">${title}</div>
        <div style="font-size:13px;line-height:1.7;color:var(--text-primary);">${content}</div>
      </div>
    `;
  }

  /* ---- Audit Completion Report ---- */
  function buildCompletionReport(client, procedures, findings, workpapers, firmName, mat) {
    const total     = procedures.length;
    const completed = procedures.filter(p => p.status === 'completed').length;
    const exception = procedures.filter(p => p.status === 'exception').length;
    const inProg    = procedures.filter(p => p.status === 'in-progress').length;
    const pct       = total ? Math.round((completed / total) * 100) : 0;

    const openFindings = findings.filter(f => f.status === 'open').length;
    const highFindings = findings.filter(f => f.severity === 'high' && f.status === 'open').length;
    const signedWP     = workpapers.filter(w => w.signedOff).length;

    return `
      ${reportHeader(firmName, 'تقرير إتمام المراجعة — Audit Completion Report', client)}

      ${reportSection('معلومات التكليف', `
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          ${tableRow('اسم العميل', client?.name || '—')}
          ${tableRow('رقم الملف', client?.fileNumber || '—')}
          ${tableRow('السنة المالية', client?.financialYear || '—')}
          ${tableRow('النشاط', client?.activity || '—')}
          ${tableRow('مستوى المخاطر', Utils.RISK_LABELS[client?.riskLevel] || '—')}
          ${tableRow('مسؤول التكليف', client?.teamLead || '—')}
          ${tableRow('تاريخ التكليف', Utils.formatDate(client?.engagementDate))}
          ${tableRow('تاريخ التقرير', Utils.formatDate(client?.reportDate))}
        </table>
      `)}

      ${reportSection('ملخص إجراءات المراجعة', `
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:var(--bg-surface-2);">
            <th style="padding:10px;text-align:right;border:1px solid var(--border-color);">البيان</th>
            <th style="padding:10px;text-align:center;border:1px solid var(--border-color);">العدد</th>
            <th style="padding:10px;text-align:center;border:1px solid var(--border-color);">النسبة</th>
          </tr></thead>
          <tbody>
            <tr><td style="padding:8px;border:1px solid var(--border-color);">إجمالي الإجراءات</td><td style="padding:8px;text-align:center;border:1px solid var(--border-color);font-weight:700;">${total}</td><td style="padding:8px;text-align:center;border:1px solid var(--border-color);">100%</td></tr>
            <tr style="background:#f0fdf4;"><td style="padding:8px;border:1px solid var(--border-color);">إجراءات مكتملة</td><td style="padding:8px;text-align:center;border:1px solid var(--border-color);font-weight:700;color:var(--color-success);">${completed}</td><td style="padding:8px;text-align:center;border:1px solid var(--border-color);">${pct}%</td></tr>
            <tr style="background:#fff7ed;"><td style="padding:8px;border:1px solid var(--border-color);">إجراءات جارية</td><td style="padding:8px;text-align:center;border:1px solid var(--border-color);font-weight:700;color:var(--color-warning);">${inProg}</td><td style="padding:8px;text-align:center;border:1px solid var(--border-color);">${total?Math.round(inProg/total*100):0}%</td></tr>
            <tr style="background:#fef2f2;"><td style="padding:8px;border:1px solid var(--border-color);">استثناءات</td><td style="padding:8px;text-align:center;border:1px solid var(--border-color);font-weight:700;color:var(--color-danger);">${exception}</td><td style="padding:8px;text-align:center;border:1px solid var(--border-color);">${total?Math.round(exception/total*100):0}%</td></tr>
          </tbody>
        </table>
      `)}

      ${mat ? reportSection('الأهمية النسبية', `
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          ${tableRow('الأساس المستخدم', MaterialityModule.BENCHMARKS[mat.benchmark]?.label || '—')}
          ${tableRow('الأهمية النسبية الإجمالية', Utils.formatCurrency(mat.overallMat, Utils.currencySymbol(client?.currency)))}
          ${tableRow('أهمية الأداء', Utils.formatCurrency(mat.performanceMat, Utils.currencySymbol(client?.currency)))}
          ${tableRow('الحد الواضح للتفاهة', Utils.formatCurrency(mat.trivialMat, Utils.currencySymbol(client?.currency)))}
          ${mat.specificMat ? tableRow('الأهمية النسبية الخاصة', Utils.formatCurrency(mat.specificMat, Utils.currencySymbol(client?.currency))) : ''}
        </table>
      `) : ''}

      ${reportSection('ملخص الملاحظات', `
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          ${tableRow('إجمالي الملاحظات', findings.length.toString())}
          ${tableRow('ملاحظات مفتوحة', `<span style="color:var(--color-danger);font-weight:700;">${openFindings}</span>`)}
          ${tableRow('ملاحظات جوهرية مفتوحة', `<span style="color:var(--color-danger);font-weight:700;">${highFindings}</span>`)}
          ${tableRow('ملاحظات محلولة', findings.filter(f=>f.status==='resolved').length.toString())}
        </table>
      `)}

      ${reportSection('أوراق العمل', `
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          ${tableRow('إجمالي أوراق العمل', workpapers.length.toString())}
          ${tableRow('أوراق عمل معتمدة', `<span style="color:var(--color-success);font-weight:700;">${signedWP}</span>`)}
          ${tableRow('أوراق عمل غير معتمدة', (workpapers.length - signedWP).toString())}
        </table>
      `)}

      ${reportSection('استنتاج المراجعة', `
        <div style="padding:16px;background:var(--bg-surface-2);border-radius:8px;border-right:4px solid ${pct===100&&openFindings===0?'var(--color-success)':'var(--color-warning)'};">
          ${pct === 100 && openFindings === 0
            ? '<strong style="color:var(--color-success);">✓ تمت المراجعة بالكامل</strong> — تم إتمام جميع إجراءات المراجعة وتسوية جميع الملاحظات.'
            : `<strong style="color:var(--color-warning);">⚠ المراجعة قيد التنفيذ</strong> — نسبة الإنجاز ${pct}%. يوجد ${openFindings} ملاحظة مفتوحة تتطلب متابعة.`
          }
        </div>
      `)}
    `;
  }

  /* ---- Management Letter ---- */
  function buildManagementLetter(client, findings, firmName) {
    const openFindings  = findings.filter(f => f.status === 'open');
    const highFindings  = openFindings.filter(f => f.severity === 'high');
    const medFindings   = openFindings.filter(f => f.severity === 'medium');

    const findingsRows = openFindings.length === 0
      ? '<p style="color:var(--color-success);">لم يتم اكتشاف ملاحظات جوهرية تستوجب الإبلاغ.</p>'
      : openFindings.map((f, i) => `
          <div style="border:1px solid var(--border-color);border-radius:8px;padding:16px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
              <div style="font-weight:700;font-size:14px;">${i+1}. ${Utils.escapeHtml(f.title)}</div>
              <span style="font-size:11px;padding:2px 8px;border-radius:9px;background:${f.severity==='high'?'#fee2e2':f.severity==='medium'?'#fef3c7':'#dbeafe'};color:${f.severity==='high'?'#991b1b':f.severity==='medium'?'#92400e':'#1e40af'};">
                ${FindingsModule.SEVERITY_LEVELS[f.severity]?.label || f.severity}
              </span>
            </div>
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;"><strong>الملاحظة:</strong> ${Utils.escapeHtml(f.description)}</div>
            ${f.managementResponse ? `<div style="font-size:13px;color:var(--color-info);"><strong>رد الإدارة:</strong> ${Utils.escapeHtml(f.managementResponse)}</div>` : ''}
          </div>
        `).join('');

    return `
      ${reportHeader(firmName, 'خطاب الإدارة — Management Letter', client)}

      <div style="margin-bottom:20px;font-size:13px;line-height:1.8;">
        <div>السادة / إدارة ${Utils.escapeHtml(client?.name || '—')}</div>
        <div style="margin-top:8px;">المحترمين،</div>
        <div style="margin-top:12px;">
          تحية طيبة وبعد،<br><br>
          بناءً على تكليفنا بمراجعة القوائم المالية لشركتكم عن السنة المالية المنتهية في
          ${Utils.formatDate(client?.balanceSheetDate || client?.reportDate)},
          نُقدّم لكم هذا الخطاب الذي يتضمن الملاحظات والتوصيات التي توصلنا إليها خلال أعمال المراجعة.
        </div>
      </div>

      ${reportSection(`الملاحظات (${openFindings.length} ملاحظة)`, findingsRows)}

      ${highFindings.length > 0 ? reportSection('الملاحظات الجوهرية العاجلة', `
        <div style="padding:16px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca;">
          <strong style="color:#991b1b;">يستوجب الاهتمام الفوري:</strong>
          يوجد ${highFindings.length} ملاحظة ذات أهمية جوهرية تتطلب اتخاذ إجراء تصحيحي عاجل.
        </div>
      `) : ''}

      ${reportSection('توصياتنا العامة', `
        <ol style="font-size:13px;line-height:2;padding-right:20px;">
          <li>تعزيز منظومة الرقابة الداخلية في المجالات التي تم تحديدها.</li>
          <li>الاستجابة السريعة لجميع الملاحظات المذكورة أعلاه وتنفيذ الإجراءات التصحيحية.</li>
          <li>إطلاع مجلس الإدارة ولجنة المراجعة (إن وجدت) على هذه الملاحظات.</li>
          <li>متابعة حل الملاحظات المفتوحة ومخابرتنا بالإجراءات المتخذة.</li>
        </ol>
      `)}

      <div style="margin-top:32px;font-size:13px;">
        <div>وتفضلوا بقبول فائق التحية والاحترام،</div>
        <div style="margin-top:20px;font-weight:700;">${Utils.escapeHtml(firmName)}</div>
        <div style="color:var(--text-muted);margin-top:4px;">التاريخ: ${Utils.formatDate(new Date().toISOString())}</div>
      </div>
    `;
  }

  /* ---- Internal Control Report ---- */
  function buildInternalControlReport(client, findings, planning, firmName) {
    const icFindings = findings.filter(f => f.category === 'الرقابة الداخلية' || f.type === 'weakness');
    const icPlan = planning.filter(p => p.section === 'internal_control');
    const completed = icPlan.filter(p => p.status === 'completed').length;

    return `
      ${reportHeader(firmName, 'تقرير الرقابة الداخلية — Internal Control Report', client)}

      ${reportSection('مقدمة', `
        <p>يُقدّم هذا التقرير نتائج فحصنا لمنظومة الرقابة الداخلية للشركة خلال مراجعة القوائم المالية
        للسنة المالية ${Utils.escapeHtml(client?.financialYear || '—')}. يُعدّ هذا التقرير مكملاً لتقرير المراجعة الرئيسي
        وليس بديلاً عنه.</p>
      `)}

      ${reportSection('منهجية فحص الرقابة الداخلية', `
        <p>قمنا بفحص منظومة الرقابة الداخلية وفق ما يقتضيه معيار المراجعة الدولي ISA 315 ويتضمن الفحص:</p>
        <ul style="padding-right:20px;line-height:2;">
          <li>بيئة الرقابة والنبرة من القمة (Tone at the Top)</li>
          <li>عملية تقييم المخاطر من قبل المنشأة</li>
          <li>أنظمة المعلومات والتواصل</li>
          <li>أنشطة الرقابة والضوابط التشغيلية</li>
          <li>مراقبة ورصد الضوابط</li>
        </ul>
        <div>عناصر الرقابة المُقيّمة: <strong>${icPlan.length}</strong> | المكتملة: <strong>${completed}</strong></div>
      `)}

      ${reportSection(`نقاط الضعف المُكتشفة (${icFindings.length})`, icFindings.length === 0
        ? '<p style="color:var(--color-success);">لم يُكتشف أي نقاط ضعف جوهرية في منظومة الرقابة الداخلية.</p>'
        : icFindings.map((f,i) => `
            <div style="border:1px solid var(--border-color);border-radius:8px;padding:14px;margin-bottom:10px;">
              <strong>${i+1}. ${Utils.escapeHtml(f.title)}</strong> — ${FindingsModule.SEVERITY_LEVELS[f.severity]?.label || ''}
              <div style="font-size:13px;color:var(--text-secondary);margin-top:6px;">${Utils.escapeHtml(f.description)}</div>
              ${f.correctiveAction ? `<div style="font-size:12px;color:var(--color-success);margin-top:6px;"><strong>التوصية:</strong> ${Utils.escapeHtml(f.correctiveAction)}</div>` : ''}
            </div>
          `).join('')
      )}

      ${reportSection('توصياتنا لتعزيز الرقابة الداخلية', `
        <ol style="font-size:13px;line-height:2;padding-right:20px;">
          <li>تعيين لجنة مراجعة داخلية مستقلة إن لم تكن موجودة.</li>
          <li>تطوير وتوثيق إجراءات الرقابة الداخلية الخاصة بكل عملية.</li>
          <li>إجراء دورات تدريبية دورية للموظفين على إجراءات الرقابة.</li>
          <li>اعتماد نظام متابعة وتقييم فاعلية الرقابة الداخلية بشكل ربع سنوي.</li>
          <li>توفير نظام بلاغات يُمكّن الموظفين من الإبلاغ عن أي مخالفات.</li>
        </ol>
      `)}
    `;
  }

  /* ---- Findings Report ---- */
  function buildFindingsReport(client, findings, firmName) {
    const grouped = {};
    findings.forEach(f => {
      const key = f.severity || 'info';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(f);
    });

    const severityOrder = ['high', 'medium', 'low', 'info'];

    return `
      ${reportHeader(firmName, 'تقرير نتائج المراجعة — Audit Findings Report', client)}

      ${reportSection('إحصاءات الملاحظات', `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px;">
          ${['high','medium','low','info'].map(s => {
            const items = (grouped[s]||[]);
            const sev = FindingsModule.SEVERITY_LEVELS[s];
            return `<div style="text-align:center;padding:16px;background:var(--bg-surface-2);border-radius:8px;border-top:3px solid ${sev?.color||'#666'};">
              <div style="font-size:28px;font-weight:700;color:${sev?.color||'#666'}">${items.length}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${sev?.label||s}</div>
            </div>`;
          }).join('')}
        </div>
      `)}

      ${severityOrder.map(sev => {
        const items = grouped[sev] || [];
        if (items.length === 0) return '';
        const sevInfo = FindingsModule.SEVERITY_LEVELS[sev];
        return reportSection(`الملاحظات ${sevInfo?.label || ''} (${items.length})`,
          items.map((f,i) => `
            <div style="border:1px solid var(--border-color);border-radius:8px;margin-bottom:14px;overflow:hidden;">
              <div style="background:${sevInfo?.color||'#666'};color:white;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:700;">${i+1}. ${Utils.escapeHtml(f.title)}</span>
                <span style="font-size:12px;">${Utils.statusBadge(f.status).replace(/var\(--\w[\w-]*\)/g, '#fff')}</span>
              </div>
              <div style="padding:14px;">
                <div style="font-size:13px;margin-bottom:8px;"><strong>النوع:</strong> ${FindingsModule.FINDING_TYPES[f.type]?.label||f.type} | <strong>الفئة:</strong> ${Utils.escapeHtml(f.category||'—')} | <strong>المرجع:</strong> ${Utils.escapeHtml(f.wpRef||'—')}</div>
                <div style="font-size:13px;margin-bottom:8px;"><strong>الوصف:</strong> ${Utils.escapeHtml(f.description||'—')}</div>
                ${f.managementResponse ? `<div style="font-size:13px;margin-bottom:6px;padding:8px;background:#eff6ff;border-radius:6px;"><strong>رد الإدارة:</strong> ${Utils.escapeHtml(f.managementResponse)}</div>` : ''}
                ${f.correctiveAction ? `<div style="font-size:13px;padding:8px;background:#f0fdf4;border-radius:6px;"><strong>الإجراء التصحيحي:</strong> ${Utils.escapeHtml(f.correctiveAction)}</div>` : ''}
              </div>
            </div>
          `).join('')
        );
      }).join('')}
    `;
  }

  /* ---- Risk Assessment Report ---- */
  async function buildRiskAssessmentReport(client, planning, procedures, risks, firmName) {
    const highRisk  = procedures.filter(p => p.status === 'exception');
    const categories = await ProgramsModule.getAllCategories();
    const accountNameMap = {};
    categories.forEach(c => { accountNameMap[c.id] = c.title; });
    const ASSERTIONS = PlanningModule.ASSERTIONS;
    const RISK_TYPES = PlanningModule.RISK_TYPES;

    const fsLevelRisks = (risks || []).filter(r => !r.account || r.riskScope !== 'assertion');
    const assertionRisks = (risks || []).filter(r => r.account && r.riskScope === 'assertion');
    const significantRisks = (risks || []).filter(r => r.riskType === 'significant' || r.riskType === 'fraud');
    const noResponse = (risks || []).filter(r => !(r.linkedProcedures||[]).length);

    function procTitleFor(key) {
      const [catId, num] = key.split(':');
      const cat = categories.find(c => c.id === catId);
      const proc = cat?.procedures.find(p => p.num === num);
      return proc ? `${Utils.escapeHtml(cat.title)} — ${Utils.escapeHtml(proc.title)}` : Utils.escapeHtml(key);
    }

    function riskRow(r) {
      const rt = RISK_TYPES[r.riskType] || RISK_TYPES.normal;
      return `
        <tr>
          <td style="padding:8px;border:1px solid var(--border-color);">${Utils.escapeHtml(r.title)}</td>
          <td style="padding:8px;border:1px solid var(--border-color);">${r.account ? Utils.escapeHtml(accountNameMap[r.account] || r.account) : '— (عام)'}</td>
          <td style="padding:8px;border:1px solid var(--border-color);font-size:12px;">${(r.assertions||[]).map(a => Utils.escapeHtml(ASSERTIONS[a]?.code || a)).join('، ') || '—'}</td>
          <td style="padding:8px;text-align:center;border:1px solid var(--border-color);">${rt.label}</td>
          <td style="padding:8px;text-align:center;border:1px solid var(--border-color);font-weight:700;color:${RISK_COLORS[r.level]||''};">${RISK_LABELS_AR[r.level] || r.level}</td>
          <td style="padding:8px;border:1px solid var(--border-color);font-size:12px;">
            ${(r.linkedProcedures||[]).length ? r.linkedProcedures.map(procTitleFor).join('<br>') : '<span style="color:var(--color-danger);">بلا استجابة محدَّدة</span>'}
          </td>
        </tr>
      `;
    }

    return `
      ${reportHeader(firmName, 'تقرير تقييم المخاطر — Risk Assessment & Response Report', client)}

      ${reportSection('مستوى المخاطر الإجمالي', `
        <div style="text-align:center;padding:20px;background:var(--bg-surface-2);border-radius:8px;margin-bottom:12px;">
          <div style="font-size:32px;font-weight:700;color:${client?.riskLevel==='high'?'var(--color-danger)':client?.riskLevel==='medium'?'var(--color-warning)':'var(--color-success)'};">
            ${Utils.RISK_LABELS[client?.riskLevel] || '—'}
          </div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">مستوى المخاطر الإجمالي للتكليف</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          ${tableRow('إجمالي المخاطر المُسجَّلة', String(risks.length))}
          ${tableRow('مخاطر على مستوى القوائم المالية ككل (Pervasive)', String(fsLevelRisks.length))}
          ${tableRow('مخاطر على مستوى التوكيد لحساب محدَّد', String(assertionRisks.length))}
          ${tableRow('مخاطر جوهرية / غش (Significant / Fraud)', `<strong style="color:var(--color-danger);">${significantRisks.length}</strong>`)}
          ${tableRow('مخاطر بلا استجابة (إجراء) محدَّدة', noResponse.length > 0 ? `<strong style="color:var(--color-danger);">${noResponse.length}</strong>` : '0')}
        </table>
      `)}

      ${reportSection('منهجية تقييم المخاطر (ISA 315 المُعدَّل)', `
        <p style="font-size:13px;line-height:1.8;">
          تم تقييم المخاطر على مستوى القوائم المالية ككل وعلى مستوى التوكيدات لفئات المعاملات وأرصدة
          الحسابات والإفصاحات، من خلال: (أ) فهم المنشأة وبيئتها وإطار إعداد التقارير المالية المعمول به؛
          (ب) فهم وتقييم نظام الرقابة الداخلية ذو الصلة؛ (ج) الاستفسارات من الإدارة والمسؤولين عن الحوكمة
          عن مخاطر الغش (ISA 240)؛ (د) الإجراءات التحليلية الأولية؛ (هـ) الملاحظة والتفتيش. تم تحديد
          التوكيدات المتأثرة بكل خطر مُحدَّد (الحدوث/الوجود، الاكتمال، الدقة/التقييم، التوقيت السليم،
          التصنيف، الحقوق والالتزامات، العرض والإفصاح)، وربط كل خطر جوهري باستجابة (إجراء مراجعة) تعالجه
          تحديداً وفق ISA 330.
        </p>
      `)}

      ${significantRisks.length > 0 ? reportSection(`⚠️ المخاطر الجوهرية والغش (${significantRisks.length}) — تتطلب اهتماماً خاصاً`, `
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:var(--color-danger);color:white;">
            <th style="padding:8px;text-align:right;">الخطر</th>
            <th style="padding:8px;text-align:right;">الحساب/البند</th>
            <th style="padding:8px;text-align:center;">التوكيدات</th>
            <th style="padding:8px;text-align:center;">النوع</th>
            <th style="padding:8px;text-align:center;">المستوى</th>
            <th style="padding:8px;text-align:right;">الاستجابة (الإجراءات)</th>
          </tr></thead>
          <tbody>${significantRisks.map(riskRow).join('')}</tbody>
        </table>
      `) : ''}

      ${reportSection(`مصفوفة المخاطر والاستجابة الكاملة (${risks.length})`, risks.length === 0 ? `
        <p class="text-muted">لم يتم تسجيل أي مخاطر بعد لهذا العميل. يُنصح بتوثيق المخاطر المُحدَّدة أثناء فهم المنشأة وبيئتها من سجل المخاطر في صفحة التخطيط.</p>
      ` : `
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:var(--bg-surface-2);">
            <th style="padding:8px;text-align:right;border:1px solid var(--border-color);">الخطر</th>
            <th style="padding:8px;text-align:right;border:1px solid var(--border-color);">الحساب/البند</th>
            <th style="padding:8px;text-align:center;border:1px solid var(--border-color);">التوكيدات (ISA 315)</th>
            <th style="padding:8px;text-align:center;border:1px solid var(--border-color);">النوع</th>
            <th style="padding:8px;text-align:center;border:1px solid var(--border-color);">المستوى</th>
            <th style="padding:8px;text-align:right;border:1px solid var(--border-color);">الاستجابة (إجراءات المراجعة)</th>
          </tr></thead>
          <tbody>${risks.map(riskRow).join('')}</tbody>
        </table>
      `)}

      ${highRisk.length > 0 ? reportSection(`بنود الاستثناء في الإجراءات (${highRisk.length})`, `
        <p>البنود التالية تم تصنيفها كاستثناءات أثناء التنفيذ وتتطلب اهتماماً خاصاً:</p>
        ${highRisk.map(p => `<div style="padding:8px;border-bottom:1px solid var(--border-color);font-size:13px;">• ${Utils.escapeHtml(p.title||'')} — ${Utils.escapeHtml(p.finding||'—')}</div>`).join('')}
      `) : ''}
    `;
  }

  const RISK_COLORS = { low: 'var(--color-success)', medium: 'var(--color-warning)', high: 'var(--color-danger)', critical: '#7c1d2e' };
  const RISK_LABELS_AR = { low: 'منخفض', medium: 'متوسط', high: 'مرتفع', critical: 'حرج' };

  /* ---- Materiality Report ---- */
  function buildMaterialityReport(client, mat, firmName) {
    if (!mat) {
      return `${reportHeader(firmName, 'تقرير الأهمية النسبية', client)}<div class="warning-box">لم يتم احتساب الأهمية النسبية لهذا العميل بعد.</div>`;
    }
    return `
      ${reportHeader(firmName, 'تقرير الأهمية النسبية — Materiality Report', client)}

      ${reportSection('مبررات الأساس المختار', `
        <p>تم اختيار <strong>${MaterialityModule.BENCHMARKS[mat.benchmark]?.label || mat.benchmark}</strong>
        كأساس لاحتساب الأهمية النسبية بمبلغ <strong>${Utils.formatCurrency(mat.benchmarkValue, Utils.currencySymbol(client?.currency))}</strong>
        وذلك استناداً إلى طبيعة نشاط المنشأة وهيكلها المالي.</p>
        ${mat.notes ? `<div style="margin-top:8px;padding:10px;background:var(--bg-surface-2);border-radius:6px;">${Utils.escapeHtml(mat.notes)}</div>` : ''}
      `)}

      ${reportSection('مستويات الأهمية النسبية', `
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:var(--color-primary);color:white;">
            <th style="padding:10px;text-align:right;">المستوى</th>
            <th style="padding:10px;text-align:center;">المبلغ (${Utils.escapeHtml(Utils.currencySymbol(client?.currency))})</th>
            <th style="padding:10px;text-align:center;">النسبة</th>
            <th style="padding:10px;text-align:right;">الاستخدام</th>
          </tr></thead>
          <tbody>
            <tr><td style="padding:8px;border:1px solid var(--border-color);">Overall Materiality — الأهمية النسبية الإجمالية</td><td style="padding:8px;text-align:center;border:1px solid var(--border-color);font-weight:700;">${Utils.formatNumber(mat.overallMat)}</td><td style="padding:8px;text-align:center;border:1px solid var(--border-color);">${mat.overallPct}%</td><td style="padding:8px;border:1px solid var(--border-color);">تقييم التحريفات غير المصححة</td></tr>
            <tr style="background:var(--bg-surface-2);"><td style="padding:8px;border:1px solid var(--border-color);">Performance Materiality — أهمية الأداء</td><td style="padding:8px;text-align:center;border:1px solid var(--border-color);font-weight:700;">${Utils.formatNumber(mat.performanceMat)}</td><td style="padding:8px;text-align:center;border:1px solid var(--border-color);">${mat.performancePct}% من الإجمالية</td><td style="padding:8px;border:1px solid var(--border-color);">تصميم الإجراءات وتحديد العينات</td></tr>
            ${mat.specificMat ? `<tr><td style="padding:8px;border:1px solid var(--border-color);">Specific Materiality — الأهمية النسبية الخاصة</td><td style="padding:8px;text-align:center;border:1px solid var(--border-color);font-weight:700;">${Utils.formatNumber(mat.specificMat)}</td><td style="padding:8px;text-align:center;border:1px solid var(--border-color);">—</td><td style="padding:8px;border:1px solid var(--border-color);">${Utils.escapeHtml(mat.specificReason||'بنود حساسة')}</td></tr>` : ''}
            <tr style="background:var(--bg-surface-2);"><td style="padding:8px;border:1px solid var(--border-color);">Clearly Trivial — الحد الواضح للتفاهة</td><td style="padding:8px;text-align:center;border:1px solid var(--border-color);font-weight:700;">${Utils.formatNumber(mat.trivialMat)}</td><td style="padding:8px;text-align:center;border:1px solid var(--border-color);">${mat.trivialPct}% من الإجمالية</td><td style="padding:8px;border:1px solid var(--border-color);">التحريفات دون هذا الحد لا تُجمّع</td></tr>
          </tbody>
        </table>
      `)}

      ${reportSection('ISA 320 — الأساس النظري', `
        <p style="font-size:13px;line-height:1.8;">
          يُعرّف معيار المراجعة الدولي ISA 320 الأهمية النسبية بأنها التحريفات التي يُتوقّع، بصورة معقولة،
          أن تؤثر على القرارات الاقتصادية للمستخدمين المتخذة بناءً على القوائم المالية، سواءً بشكل منفرد أو مجتمعة.
          تُستخدم الأهمية النسبية في التخطيط للمراجعة وتنفيذها وتقييم أثر التحريفات المُكتشفة.
        </p>
      `)}
    `;
  }

  /* ---- Planning Report ---- */
  function buildPlanningReport(client, planning, firmName) {
    const completed = planning.filter(p => p.status === 'completed').length;
    const total = PlanningModule.PLANNING_SECTIONS.reduce((a, s) => a + s.items.length, 0);

    return `
      ${reportHeader(firmName, 'تقرير التخطيط للمراجعة — Planning Report', client)}

      ${reportSection('نظرة عامة', `
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          ${tableRow('إجمالي عناصر التخطيط', total.toString())}
          ${tableRow('العناصر المكتملة', `<strong style="color:var(--color-success);">${completed}</strong>`)}
          ${tableRow('نسبة الإتمام', `${total?Math.round(completed/total*100):0}%`)}
          ${tableRow('مسؤول التكليف', client?.teamLead || '—')}
          ${tableRow('تاريخ بدء التخطيط', Utils.formatDate(client?.engagementDate))}
        </table>
      `)}

      ${PlanningModule.PLANNING_SECTIONS.map(section => {
        const sectionItems = section.items.map(item => {
          const rec = planning.find(p => p.item === item.id);
          return `<tr>
            <td style="padding:8px;border:1px solid var(--border-color);">${Utils.escapeHtml(item.title)}</td>
            <td style="padding:8px;text-align:center;border:1px solid var(--border-color);">${rec?.status==='completed'?'<span style="color:var(--color-success);">✓ مكتمل</span>':rec?.status==='na'?'<span style="color:var(--text-muted);">لا ينطبق</span>':'<span style="color:var(--color-warning);">قيد التنفيذ</span>'}</td>
            <td style="padding:8px;border:1px solid var(--border-color);">${Utils.escapeHtml(rec?.completedBy||'—')}</td>
            <td style="padding:8px;border:1px solid var(--border-color);">${Utils.formatDate(rec?.completedAt||'')}</td>
          </tr>`;
        }).join('');
        return reportSection(`${section.icon} ${section.title} — ISA ${section.isaRef}`, `
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead><tr style="background:var(--bg-surface-2);">
              <th style="padding:8px;text-align:right;border:1px solid var(--border-color);">العنصر</th>
              <th style="padding:8px;text-align:center;border:1px solid var(--border-color);">الحالة</th>
              <th style="padding:8px;text-align:right;border:1px solid var(--border-color);">بواسطة</th>
              <th style="padding:8px;text-align:right;border:1px solid var(--border-color);">التاريخ</th>
            </tr></thead>
            <tbody>${sectionItems}</tbody>
          </table>
        `);
      }).join('')}
    `;
  }

  /* ---- Final Summary ---- */
  async function buildFinalSummary(client, procedures, findings, workpapers, mat, planning, firmName) {
    const procCompleted = procedures.filter(p => p.status === 'completed').length;
    const openFindings  = findings.filter(f => f.status === 'open').length;
    const planCompleted = planning.filter(p => p.status === 'completed').length;
    const planTotal     = PlanningModule.PLANNING_SECTIONS.reduce((a,s) => a+s.items.length, 0);
    const wpSigned      = workpapers.filter(w => w.signedOff).length;

    const readyForReport = procCompleted === procedures.length && openFindings === 0;

    return `
      ${reportHeader(firmName, 'الملخص التنفيذي النهائي — Final Audit Summary', client)}

      <div style="padding:20px;border-radius:12px;text-align:center;background:${readyForReport?'linear-gradient(135deg,#059669,#047857)':'linear-gradient(135deg,#D97706,#b45309)'};color:white;margin-bottom:24px;">
        <div style="font-size:32px;margin-bottom:8px;">${readyForReport?'✅':'⚠️'}</div>
        <div style="font-size:20px;font-weight:700;">${readyForReport?'الملف جاهز للتقرير النهائي':'الملف يحتاج استكمال'}</div>
        <div style="font-size:13px;opacity:0.85;margin-top:6px;">${readyForReport?'تم إتمام جميع الإجراءات وتسوية الملاحظات':'يوجد بنود تتطلب استكمالاً قبل إصدار التقرير'}</div>
      </div>

      ${reportSection('ملخص المراجعة', `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
          ${summaryBox('التخطيط', `${planCompleted}/${planTotal}`, planCompleted===planTotal?'var(--color-success)':'var(--color-warning)')}
          ${summaryBox('الإجراءات', `${procCompleted}/${procedures.length}`, procCompleted===procedures.length?'var(--color-success)':'var(--color-warning)')}
          ${summaryBox('الملاحظات المفتوحة', openFindings.toString(), openFindings===0?'var(--color-success)':'var(--color-danger)')}
          ${summaryBox('أوراق العمل المعتمدة', `${wpSigned}/${workpapers.length}`, wpSigned===workpapers.length?'var(--color-success)':'var(--color-warning)')}
          ${mat?summaryBox('الأهمية النسبية', Utils.formatCurrency(mat.overallMat, Utils.currencySymbol(client?.currency)), 'var(--color-primary)'):''}
          ${summaryBox('مستوى المخاطر', Utils.RISK_LABELS[client?.riskLevel]||'—', client?.riskLevel==='low'?'var(--color-success)':client?.riskLevel==='high'?'var(--color-danger)':'var(--color-warning)')}
        </div>
      `)}

      ${reportSection('قائمة التحقق النهائية', `
        ${checkItem('اكتمال إجراءات التخطيط', planCompleted >= planTotal * 0.9)}
        ${checkItem('اكتمال إجراءات المراجعة', procCompleted === procedures.length)}
        ${checkItem('تسوية جميع الملاحظات الجوهرية', findings.filter(f=>f.severity==='high'&&f.status==='open').length===0)}
        ${checkItem('احتساب الأهمية النسبية', !!mat)}
        ${checkItem('اعتماد أوراق العمل', wpSigned >= workpapers.length * 0.8)}
        ${checkItem('مراجعة الأحداث اللاحقة', (() => {
          const seProcs = procedures.filter(p => p.category === 'subsequent_events');
          return seProcs.length > 0 && seProcs.every(p => p.status === 'completed');
        })())}
        ${await (async () => {
          const gcRecs = client?.id ? await AuditDB.getByClientYear(AuditDB.STORES.GOING_CONCERN, client.id, App.getActiveYear()) : [];
          return checkItem('توثيق تقييم استمرارية المنشأة (ISA 570)', gcRecs.length > 0);
        })()}
        ${await (async () => {
          if (!client?.id) return '';
          const qr = await QualityModule.loadQualityReview(client.id);
          if (!qr || !qr.eqrRequired) return ''; // لا يُعرَض هذا البند إن لم تكن مراجعة الجودة مطلوبة لهذا الارتباط
          return checkItem('اكتمال مراجعة جودة الارتباط (EQR) قبل الإصدار', qr.eqrConclusion === 'no_matters' || qr.eqrConclusion === 'matters_resolved');
        })()}
        ${checkItem('توقيع ورقة إتمام المراجعة', wpSigned > 0)}
      `)}

      ${reportSection('التوصية النهائية', `
        <div style="padding:16px;border-radius:8px;background:${readyForReport?'#f0fdf4':'#fffbeb'};border:1px solid ${readyForReport?'#bbf7d0':'#fde68a'};">
          <strong>${readyForReport?'✓ التوصية: إصدار التقرير':'⚠ التوصية: استكمال الملف أولاً'}</strong><br>
          <span style="font-size:13px;margin-top:6px;display:block;">
            ${readyForReport
              ? 'تم الانتهاء من جميع إجراءات المراجعة. يمكن المضي في إصدار التقرير النهائي.'
              : `يجب استكمال: ${procedures.length-procCompleted} إجراء متبقٍ${openFindings>0?`، و${openFindings} ملاحظة مفتوحة`:''} قبل إصدار التقرير.`
            }
          </span>
        </div>
      `)}
    `;
  }

  /* ---- ISA 700: Auditor's Report ---- */
  async function buildAuditOpinionReport(client, procedures, findings, mat, firmName, firmLogo) {
    const year        = client?.financialYear || new Date().getFullYear() - 1;
    const asOfDate    = client?.balanceSheetDate ? Utils.formatDate(client.balanceSheetDate) : `31/12/${year}`;
    const clientName  = client?.name || '—';
    const currency    = Utils.currencySymbol(client?.currency);
    const openHigh    = findings.filter(f => f.status === 'open' && f.severity === 'high');
    const procDone    = procedures.filter(p => p.status === 'completed').length;
    const readyForOp  = procDone >= procedures.length * 0.9 && openHigh.length === 0;
    const today       = Utils.todayDisplay();

    // إضافة: دمج تقييم استمرارية المنشأة (ISA 570 المُعدَّل) في تحديد نوع الرأي وصياغة التقرير
    const gcRecords = client?.id ? await AuditDB.getByClientYear(AuditDB.STORES.GOING_CONCERN, client.id, App.getActiveYear()) : [];
    const gc = gcRecords.length > 0 ? gcRecords[gcRecords.length - 1] : null;
    const gcConclusion = gc?.conclusion || null;
    const gcMeta = gcConclusion ? PlanningModule.GC_CONCLUSIONS[gcConclusion] : null;

    // تحديد نوع الرأي: الملاحظات الجوهرية المفتوحة أو استنتاج الاستمرارية غير المناسب يفرضان رأياً معدَّلاً
    const forcedByGC = gcMeta && (gcMeta.opinionImpact === 'qualified_or_adverse' || gcMeta.opinionImpact === 'adverse');
    const isModifiedOpinion = openHigh.length > 0 || forcedByGC;
    const hasEmphasisParagraph = gcMeta && gcMeta.opinionImpact === 'emphasis';

    return `
      <div style="max-width:760px;margin:0 auto;">
        ${firmLogo ? `<div style="text-align:center;margin-bottom:16px;"><img src="${firmLogo}" style="max-height:70px;max-width:180px;object-fit:contain;"></div>` : ''}
        ${!readyForOp ? `
          <div class="warning-box mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div><strong>تحذير:</strong> الملف لم يكتمل بعد (${procDone}/${procedures.length} إجراء${openHigh.length>0?`، ${openHigh.length} ملاحظة جوهرية مفتوحة`:''} ). هذا مسودة قالب فقط.</div>
          </div>
        ` : ''}
        ${!gc ? `
          <div class="info-box mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <div>لم يتم توثيق تقييم استمرارية المنشأة (ISA 570) بعد لهذا العميل. يُنصح بإتمامه من صفحة التخطيط قبل إصدار التقرير النهائي.</div>
          </div>
        ` : ''}

        <div style="border:2px solid var(--color-primary);border-radius:12px;padding:32px;background:var(--bg-surface);">
          <div style="text-align:center;margin-bottom:28px;">
            <h2 style="color:var(--color-primary);font-size:20px;margin:0;">تقرير المراجع المستقل</h2>
            <div style="font-size:13px;color:var(--text-muted);margin-top:6px;">وفق معيار المراجعة الدولي ISA 700</div>
          </div>

          <div style="margin-bottom:20px;">
            <strong>إلى مساهمي ومجلس إدارة ${Utils.escapeHtml(clientName)}</strong>
          </div>

          <div style="margin-bottom:18px;">
            <div style="font-weight:bold;margin-bottom:6px;color:var(--color-primary);">رأي المراجع</div>
            <div style="line-height:1.8;font-size:14px;">
              قمنا بمراجعة القوائم المالية لشركة <strong>${Utils.escapeHtml(clientName)}</strong> المتضمّنة لقائمة المركز المالي كما في ${asOfDate}، وقائمة الدخل الشامل وقائمة التدفقات النقدية وقائمة التغيرات في حقوق الملكية للسنة المنتهية في ذلك التاريخ، فضلاً عن الإيضاحات المرفقة.
            </div>
            <div style="margin-top:12px;padding:16px;background:${!isModifiedOpinion?'rgba(34,197,94,0.08)':'rgba(239,68,68,0.08)'};border-radius:8px;border-right:4px solid ${!isModifiedOpinion?'var(--color-success)':'var(--color-danger)'};line-height:1.8;font-size:14px;">
              ${!isModifiedOpinion ? `
                <strong>رأي غير معدَّل (Unmodified Opinion):</strong><br>
                نرى أن القوائم المالية المرفقة تُعبّر بصورة عادلة، من جميع النواحي الجوهرية، عن المركز المالي لشركة ${Utils.escapeHtml(clientName)} كما في ${asOfDate}، وعن أدائها المالي وتدفقاتها النقدية عن السنة المنتهية في ذلك التاريخ وفقاً للمعايير الدولية لإعداد التقارير المالية (IFRS).
              ` : gcMeta?.opinionImpact === 'adverse' ? `
                <strong>رأي معاكس (Adverse Opinion) — ISA 570 فقرة 21:</strong><br>
                نظراً لكون أساس الاستمرارية غير ملائم لإعداد القوائم المالية حسب تقييمنا، نرى أن القوائم المالية المرفقة لا تُعبّر بصورة عادلة عن المركز المالي لشركة ${Utils.escapeHtml(clientName)}. <em>[يجب صياغة فقرة "أساس الرأي المعاكس" التفصيلية قبل الإصدار]</em>
              ` : gcMeta?.opinionImpact === 'qualified_or_adverse' ? `
                <strong>رأي مُعدَّل بسبب عدم كفاية الإفصاح عن شكوك الاستمرارية (ISA 570 فقرة 24):</strong><br>
                <em>[توجد شكوك جوهرية حول قدرة المنشأة على الاستمرار لم يتم الإفصاح عنها بشكل كافٍ في القوائم المالية. يجب تحديد ما إذا كان التعديل تحفظاً أو رأياً معاكساً بناءً على مدى انتشار (pervasiveness) القصور في الإفصاح، وصياغة فقرة "أساس الرأي المُعدَّل" وفق ISA 705]</em>
              ` : `
                <strong>رأي مُعدَّل — تحفظ (Qualified Opinion):</strong><br>
                <em>[يجب مراجعة الملاحظات الجوهرية المفتوحة (${openHigh.length}) وتحديد طبيعة التعديل المطلوب قبل إصدار هذا الرأي]</em>
              `}
            </div>
          </div>

          ${hasEmphasisParagraph ? `
          <div style="margin-bottom:18px;">
            <div style="font-weight:bold;margin-bottom:6px;color:var(--color-warning);">⚠ شكوك جوهرية حول الاستمرارية (Material Uncertainty Related to Going Concern) — ISA 570 فقرة 22-23</div>
            <div style="line-height:1.8;font-size:14px;padding:14px;background:rgba(217,119,6,0.08);border-radius:8px;border-right:4px solid var(--color-warning);">
              نلفت الانتباه إلى الإيضاح [رقم الإيضاح] في القوائم المالية، والذي يُشير إلى أن هناك شكوكاً جوهرية قد تُثير شكاً كبيراً حول قدرة الشركة على الاستمرار في أعمالها وفق مبدأ الاستمرارية.
              ${gc.managementPlans ? `وقد أوضحت الإدارة خططها لمعالجة هذه الشكوك، والتي تتضمّن: ${Utils.escapeHtml(gc.managementPlans)}.` : ''}
              لا يتضمّن رأينا تعديلاً بخصوص هذا الأمر.
            </div>
          </div>
          ` : ''}

          <div style="margin-bottom:18px;">
            <div style="font-weight:bold;margin-bottom:6px;color:var(--color-primary);">أساس الرأي</div>
            <div style="line-height:1.8;font-size:14px;">
              أجرينا عملية المراجعة وفقاً لمعايير المراجعة الدولية (ISA). وتُوضَّح مسؤولياتنا بموجب هذه المعايير بمزيد من التفصيل في قسم مسؤوليات المراجع في تقريرنا. ونؤكد استقلاليتنا عن الشركة وفق متطلبات أخلاقيات المهنة المعمول بها في ولايتنا القضائية، ونرى أن أدلة المراجعة التي حصلنا عليها كافية وملائمة لتوفير أساس لرأينا.
            </div>
          </div>

          ${mat ? `
          <div style="margin-bottom:18px;">
            <div style="font-weight:bold;margin-bottom:6px;color:var(--color-primary);">أمور المراجعة الرئيسية (Key Audit Matters)</div>
            <div style="line-height:1.8;font-size:14px;">
              قمنا بتحديد الأهمية النسبية بمبلغ <strong>${Utils.formatCurrency(mat.overallMat, currency)}</strong> بناءً على ${mat.benchmark === 'revenue' ? 'الإيرادات' : mat.benchmark === 'totalAssets' ? 'إجمالي الأصول' : 'مؤشر مالي مناسب'}.
              ${findings.filter(f=>f.type==='exception').length > 0 ? `<br>تم رصد المسائل التالية كأمور مراجعة رئيسية: ${findings.filter(f=>f.type==='exception').slice(0,3).map(f=>Utils.escapeHtml(f.title)).join(' • ')}.` : '<br>لم تُحدَّد أمور مراجعة رئيسية تستوجب الإفصاح.'}
            </div>
          </div>
          ` : ''}

          <div style="margin-bottom:18px;">
            <div style="font-weight:bold;margin-bottom:6px;color:var(--color-primary);">مسؤولية الإدارة</div>
            <div style="line-height:1.8;font-size:14px;">
              تضطلع إدارة الشركة بمسؤولية إعداد القوائم المالية وعرضها بصورة عادلة وفق المعايير الدولية لإعداد التقارير المالية، وتقييم قدرة الشركة على الاستمرار في أعمالها والإفصاح، متى انطبق الأمر، عن أمور متعلقة بالاستمرارية، بالإضافة إلى استخدام مبدأ الاستمرارية كأساس محاسبي ما لم تعتزم الإدارة تصفية الشركة أو وقف عملياتها أو إن لم يكن أمامها بديل واقعي غير ذلك، والحفاظ على نظام رقابة داخلية فعّال لتفادي الأخطاء الجوهرية الناجمة عن غش أو خطأ.
            </div>
          </div>

          <div style="margin-bottom:24px;">
            <div style="font-weight:bold;margin-bottom:6px;color:var(--color-primary);">مسؤولية المراجع</div>
            <div style="line-height:1.8;font-size:14px;">
              تتمثل مسؤوليتنا في إبداء رأينا في القوائم المالية استناداً إلى أعمال المراجعة التي قمنا بها وفق معايير المراجعة الدولية. تقتضي هذه المعايير التزامنا بمتطلبات أخلاقيات المهنة والتخطيط والتنفيذ للحصول على تأكيد معقول بأن القوائم المالية خالية من الأخطاء الجوهرية. كجزء من عملية المراجعة وفق ISA، نُخضِع أحكامنا المهنية للشك المهني طوال المراجعة، ونستنتج مدى ملاءمة استخدام الإدارة لمبدأ الاستمرارية المحاسبي، وما إذا كانت هناك، استناداً إلى أدلة المراجعة التي حصلنا عليها، شكوك جوهرية تتعلق بأحداث أو ظروف قد تُثير شكاً كبيراً حول قدرة الشركة على الاستمرار (ISA 570).
            </div>
          </div>

          <div style="border-top:1px solid var(--border-color);padding-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <div>
              <div style="font-size:13px;color:var(--text-muted);">مكتب المراجعة</div>
              <div style="font-weight:600;">${Utils.escapeHtml(firmName)}</div>
            </div>
            <div>
              <div style="font-size:13px;color:var(--text-muted);">تاريخ التقرير</div>
              <div style="font-weight:600;">${today}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ---- Year-on-Year Comparison ---- */
  async function buildYearComparisonReport(client, procedures, findings, mat, risks, firmName) {
    const clientId  = client?.id;
    const year      = client?.financialYear || new Date().getFullYear() - 1;
    const prevYear  = String(parseInt(year) - 1);
    const currency  = Utils.currencySymbol(client?.currency);

    // Load prior-year saved snapshot (if any)
    const yearSnaps = clientId ? await AuditDB.getByIndex(AuditDB.STORES.YEAR_DATA, 'clientId', clientId) : [];
    const prevSnap  = yearSnaps.find(s => s.year === prevYear);

    const procDone  = procedures.filter(p => p.status === 'completed').length;
    const exceptions= procedures.filter(p => p.status === 'exception').length;
    const highFdgs  = findings.filter(f => f.severity === 'high').length;
    const openFdgs  = findings.filter(f => f.status === 'open').length;

    function delta(curr, prev, label, higherIsBetter = true) {
      if (prev === undefined || prev === null) return '';
      const diff = curr - prev;
      const pct  = prev !== 0 ? Math.round(Math.abs(diff) / prev * 100) : 0;
      const good = higherIsBetter ? diff >= 0 : diff <= 0;
      return `<span style="font-size:12px;color:${good?'var(--color-success)':'var(--color-danger)'};">
        ${diff >= 0 ? '▲' : '▼'} ${pct}%
      </span>`;
    }

    const rows = [
      ['الأهمية النسبية الإجمالية', mat ? Utils.formatCurrency(mat.overallMat, currency) : '—', prevSnap?.overallMat ? Utils.formatCurrency(prevSnap.overallMat, currency) : '—', delta(mat?.overallMat||0, prevSnap?.overallMat, 'الأهمية', false)],
      ['إجراءات المراجعة المكتملة', `${procDone}/${procedures.length}`, prevSnap?.procDone !== undefined ? `${prevSnap.procDone}/${prevSnap.procTotal||'—'}` : '—', delta(procDone, prevSnap?.procDone)],
      ['ملاحظات جوهرية', highFdgs, prevSnap?.highFdgs ?? '—', delta(highFdgs, prevSnap?.highFdgs, 'ملاحظات', false)],
      ['ملاحظات مفتوحة', openFdgs, prevSnap?.openFdgs ?? '—', delta(openFdgs, prevSnap?.openFdgs, 'مفتوحة', false)],
      ['استثناءات إجراءات', exceptions, prevSnap?.exceptions ?? '—', delta(exceptions, prevSnap?.exceptions, 'استثناءات', false)],
      ['مخاطر مسجّلة', risks.length, prevSnap?.risksCount ?? '—', delta(risks.length, prevSnap?.risksCount, 'مخاطر', false)],
    ];

    const saveBtn = clientId ? `<button class="btn btn-secondary btn-sm" onclick="ReportsModule.saveYearSnapshot(${clientId},${year})">💾 حفظ بيانات هذه السنة كنقطة مقارنة</button>` : '';

    return `
      <div class="page-header" style="margin-bottom:20px;">
        <h2 style="margin:0;font-size:18px;">مقارنة بين السنتين — ${Utils.escapeHtml(String(prevYear))} مقابل ${Utils.escapeHtml(String(year))}</h2>
        <div>${Utils.escapeHtml(client?.name||'')} &nbsp;|&nbsp; ${Utils.escapeHtml(firmName)}</div>
      </div>
      ${!prevSnap ? `<div class="info-box mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div>لا توجد بيانات محفوظة للسنة السابقة (${prevYear}). احفظ بيانات العام الحالي الآن لاستخدامها في مقارنة العام القادم.</div>
      </div>` : ''}
      <div class="data-table-wrapper" style="margin-bottom:20px;">
        <table class="data-table">
          <thead>
            <tr>
              <th>البيان</th>
              <th style="text-align:center;">${prevYear} (سابق)</th>
              <th style="text-align:center;">${year} (حالي)</th>
              <th style="text-align:center;">التغيّر</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(([label,prev,curr,d]) => `<tr>
              <td style="font-weight:600;">${label}</td>
              <td style="text-align:center;color:var(--text-muted);">${prev}</td>
              <td style="text-align:center;font-weight:600;">${curr}</td>
              <td style="text-align:center;">${d}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        ${saveBtn}
      </div>
    `;
  }

  async function saveYearSnapshot(clientId, year) {
    const [procedures, findings, risks, mats] = await Promise.all([
      AuditDB.getByClientYear(AuditDB.STORES.PROCEDURES, clientId, year),
      AuditDB.getByClientYear(AuditDB.STORES.FINDINGS,   clientId, year),
      AuditDB.getByClientYear(AuditDB.STORES.RISKS,       clientId, year),
      AuditDB.getByClientYear(AuditDB.STORES.MATERIALITY, clientId, year)
    ]);
    const mat = mats.length > 0 ? mats[mats.length - 1] : null;
    const snap = {
      clientId, year: String(year),
      overallMat: mat?.overallMat,
      procDone:   procedures.filter(p => p.status === 'completed').length,
      procTotal:  procedures.length,
      highFdgs:   findings.filter(f => f.severity === 'high').length,
      openFdgs:   findings.filter(f => f.status === 'open').length,
      exceptions: procedures.filter(p => p.status === 'exception').length,
      risksCount: risks.length,
      savedAt:    new Date().toISOString()
    };
    // Remove existing snap for this year if any
    const existing = await AuditDB.getByIndex(AuditDB.STORES.YEAR_DATA, 'clientId', clientId);
    const prev = existing.find(s => s.year === String(year));
    if (prev) await AuditDB.put(AuditDB.STORES.YEAR_DATA, { ...snap, id: prev.id });
    else await AuditDB.add(AuditDB.STORES.YEAR_DATA, snap);
    Utils.showToast(`تم حفظ بيانات سنة ${year} كنقطة مقارنة`, 'success');
  }

  /* ---- Client Comparison ---- */
  async function buildClientComparisonReport(firmName) {
    const [clients, allProcs, allFindings, allRisks] = await Promise.all([
      AuditDB.getAll(AuditDB.STORES.CLIENTS),
      AuditDB.getAll(AuditDB.STORES.PROCEDURES),
      AuditDB.getAll(AuditDB.STORES.FINDINGS),
      AuditDB.getAll(AuditDB.STORES.RISKS)
    ]);

    clients.sort((a,b) => (a.name||'').localeCompare(b.name||''));

    const RISK_COL = { low:'var(--color-success)', medium:'var(--color-warning)', high:'var(--color-danger)', critical:'#7c1d2e' };

    const rows = clients.map(c => {
      const fy        = String(c.financialYear || '');
      const procs      = allProcs.filter(p => p.clientId === c.id && String(p.fiscalYear || '') === fy);
      const done       = procs.filter(p => p.status === 'completed').length;
      const pct        = procs.length ? Math.round(done / procs.length * 100) : 0;
      const openFdgs   = allFindings.filter(f => f.clientId === c.id && String(f.fiscalYear || '') === fy && f.status === 'open').length;
      const highFdgs   = allFindings.filter(f => f.clientId === c.id && String(f.fiscalYear || '') === fy && f.severity === 'high' && f.status === 'open').length;
      const critRisks  = allRisks.filter(r => r.clientId === c.id && String(r.fiscalYear || '') === fy && (r.level === 'critical' || r.level === 'high')).length;
      const statusColor = pct===100?'var(--color-success)':pct>50?'var(--color-warning)':'var(--color-danger)';

      return `<tr>
        <td style="font-weight:600;">${Utils.escapeHtml(c.name||'—')}</td>
        <td style="text-align:center;">${Utils.escapeHtml(c.fileNumber||'—')}</td>
        <td style="text-align:center;">${Utils.escapeHtml(c.financialYear||'—')}</td>
        <td style="text-align:center;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:6px;background:var(--border-color);border-radius:3px;">
              <div style="width:${pct}%;height:6px;background:${statusColor};border-radius:3px;"></div>
            </div>
            <span style="font-weight:600;color:${statusColor};min-width:36px;">${pct}%</span>
          </div>
        </td>
        <td style="text-align:center;"><span style="color:${openFdgs>0?'var(--color-warning)':'var(--color-success)'};">${openFdgs}${highFdgs>0?` <span style="color:var(--color-danger);font-size:11px;">(${highFdgs} جوهرية)</span>`:''}</span></td>
        <td style="text-align:center;"><span style="color:${critRisks>0?'var(--color-danger)':'var(--text-muted)'};">${critRisks > 0 ? `⚠ ${critRisks}` : '—'}</span></td>
        <td style="text-align:center;">
          <span style="font-size:12px;background:${RISK_COL[c.riskLevel]||'var(--border-color)'};color:white;padding:2px 8px;border-radius:9px;">
            ${c.riskLevel === 'high' ? 'مرتفع' : c.riskLevel === 'medium' ? 'متوسط' : 'منخفض'}
          </span>
        </td>
        <td style="text-align:center;">
          <span class="badge ${c.status==='completed'?'badge-success':c.status==='active'?'badge-primary':'badge-neutral'}">
            ${c.status === 'completed' ? 'مكتمل' : c.status === 'active' ? 'نشط' : c.status||'—'}
          </span>
        </td>
      </tr>`;
    }).join('');

    return `
      <div style="margin-bottom:20px;">
        <h2 style="font-size:18px;margin:0;">مقارنة العملاء — ${Utils.escapeHtml(firmName)}</h2>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">${clients.length} عميل | آخر تحديث: ${Utils.todayDisplay()}</div>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>العميل</th>
              <th style="text-align:center;">رقم الملف</th>
              <th style="text-align:center;">السنة</th>
              <th style="text-align:center;min-width:140px;">نسبة الإنجاز</th>
              <th style="text-align:center;">ملاحظات مفتوحة</th>
              <th style="text-align:center;">مخاطر مرتفعة</th>
              <th style="text-align:center;">مستوى الخطر</th>
              <th style="text-align:center;">الحالة</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px;">لا يوجد عملاء بعد</td></tr>`}</tbody>
        </table>
      </div>
    `;
  }
  function tableRow(label, value) {
    return `<tr>
      <td style="padding:8px 12px;border:1px solid var(--border-color);font-weight:600;background:var(--bg-surface-2);width:35%;">${label}</td>
      <td style="padding:8px 12px;border:1px solid var(--border-color);">${value}</td>
    </tr>`;
  }

  /* ---- Helper: summary box ---- */
  function summaryBox(label, value, color) {
    return `<div style="text-align:center;padding:16px;background:var(--bg-surface-2);border-radius:8px;border-top:3px solid ${color};">
      <div style="font-size:22px;font-weight:700;color:${color};">${value}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${label}</div>
    </div>`;
  }

  /* ---- Helper: check item ---- */
  function checkItem(label, done) {
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-color);font-size:13px;">
      <span style="color:${done?'var(--color-success)':'var(--color-danger)'};font-size:18px;">${done?'✅':'❌'}</span>
      <span style="${done?'':'color:var(--color-danger);'}">${label}</span>
    </div>`;
  }

  /* ---- Preview (alias for generate) ---- */
  function previewReport(reportId) { generateReport(reportId); }

  return {
    renderReports,
    generateReport,
    previewReport,
    saveYearSnapshot
  };
})();
