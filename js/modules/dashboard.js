/* ============================================================
   AuditPro - Dashboard Module
   Comprehensive overview with stats, charts, activity feed
   ============================================================ */

const DashboardModule = (() => {

  /* ---- Render dashboard ---- */
  async function renderDashboard() {
    const container = document.getElementById('dashboardContent');
    if (!container) return;

    const allClients   = await AuditDB.getAll(AuditDB.STORES.CLIENTS);
    const allProcsRaw  = await AuditDB.getAll(AuditDB.STORES.PROCEDURES);
    const allFindingsRaw = await AuditDB.getAll(AuditDB.STORES.FINDINGS);
    const allWPRaw     = await AuditDB.getAll(AuditDB.STORES.WORKPAPERS);
    const allActivity  = await AuditDB.getAll(AuditDB.STORES.ACTIVITY);
    const allRisksRaw  = await AuditDB.getAll(AuditDB.STORES.RISKS);
    const firmName     = await AuditDB.getSetting('firmName') || 'مكتب المراجعة';
    const activeId     = App.getActiveClientId();

    // إصلاح خلل #8: الإحصاءات الإجمالية للمكتب تعكس السنة المالية "الحالية"
    // لكل عميل على حدة (لا كل سنواته التاريخية مجتمعة)
    const currentYearOf = {};
    allClients.forEach(c => { currentYearOf[c.id] = c.financialYear ? String(c.financialYear) : null; });
    const isCurrentYear = r => !currentYearOf[r.clientId] || String(r.fiscalYear || '') === currentYearOf[r.clientId];

    const allProcs    = allProcsRaw.filter(isCurrentYear);
    const allFindings = allFindingsRaw.filter(isCurrentYear);
    const allWP        = allWPRaw.filter(isCurrentYear);
    const allRisks     = allRisksRaw.filter(isCurrentYear);

    // Global stats
    const totalClients     = allClients.length;
    const activeClients    = allClients.filter(c => c.status === 'active').length;
    const completedClients = allClients.filter(c => c.status === 'completed').length;
    const highRiskClients  = allClients.filter(c => c.riskLevel === 'high').length;

    const totalProcs     = allProcs.length;
    const completedProcs = allProcs.filter(p => p.status === 'completed').length;
    const exceptionProcs = allProcs.filter(p => p.status === 'exception').length;
    const openFindings   = allFindings.filter(f => f.status === 'open').length;
    const highFindings   = allFindings.filter(f => f.severity === 'high' && f.status === 'open').length;
    const overallPct     = totalProcs > 0 ? Math.round((completedProcs / totalProcs) * 100) : 0;
    const criticalRisks  = allRisks.filter(r => r.level === 'critical' || r.level === 'high').length;
    const unaddressedRisks = allRisks.filter(r => !r.linkedProcedures?.length).length;
    const significantRisks = allRisks.filter(r => r.riskType === 'significant' || r.riskType === 'fraud').length;

    // Active client stats (تعكس السنة المُستعرَضة فعلياً للعميل النشط، قد تكون أرشيفية)
    let activeClientHTML = '';
    if (activeId) {
      const activeClient = allClients.find(c => c.id === activeId);
      if (activeClient) {
        const viewedYear     = App.getActiveYear() || activeClient.financialYear;
        const clientProcs    = allProcsRaw.filter(p => p.clientId === activeId && String(p.fiscalYear || '') === String(viewedYear || ''));
        const clientFindings = allFindingsRaw.filter(f => f.clientId === activeId && String(f.fiscalYear || '') === String(viewedYear || ''));
        const clientWP       = allWPRaw.filter(w => w.clientId === activeId && String(w.fiscalYear || '') === String(viewedYear || ''));
        const clientRisks    = allRisksRaw.filter(r => r.clientId === activeId && String(r.fiscalYear || '') === String(viewedYear || ''));
        const clientCompleted = clientProcs.filter(p => p.status === 'completed').length;
        const clientExceptions= clientProcs.filter(p => p.status === 'exception').length;
        const clientPct      = clientProcs.length ? Math.round(clientCompleted / clientProcs.length * 100) : 0;
        const clientOpenFindings = clientFindings.filter(f => f.status === 'open').length;
        const clientCriticalRisks = clientRisks.filter(r => r.level === 'critical' || r.level === 'high').length;

        activeClientHTML = `
          <div class="card mb-5">
            <div class="card-header">
              <div class="card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                العميل الحالي: ${Utils.escapeHtml(activeClient.name)}
              </div>
              <div style="display:flex;gap:8px;align-items:center;">
                ${Utils.riskBadge(activeClient.riskLevel)}
                ${Utils.statusBadge(activeClient.status)}
                <span class="chip">${Utils.escapeHtml(activeClient.financialYear || '—')}</span>
              </div>
            </div>
            <div class="card-body">
              <div class="grid grid-4" style="gap:16px;margin-bottom:20px;">
                <div class="stat-card" style="--stat-color:var(--color-primary)">
                  <div class="stat-card-label">إجراءات المراجعة</div>
                  <div class="stat-card-value">${clientProcs.length}</div>
                  <div class="stat-card-sub">${clientCompleted} مكتمل</div>
                </div>
                <div class="stat-card" style="--stat-color:${clientPct===100?'var(--color-success)':'var(--color-warning)'}">
                  <div class="stat-card-label">نسبة الإنجاز</div>
                  <div class="stat-card-value" style="color:${clientPct===100?'var(--color-success)':'var(--color-warning)'}">${clientPct}%</div>
                  <div class="progress-bar-wrap" style="margin-top:8px;">
                    <div class="progress-bar-fill" style="width:${clientPct}%;background:${clientPct===100?'var(--color-success)':'var(--color-warning)'}"></div>
                  </div>
                </div>
                <div class="stat-card" style="--stat-color:${clientExceptions>0?'var(--color-danger)':'var(--color-success)'}">
                  <div class="stat-card-label">الاستثناءات</div>
                  <div class="stat-card-value" style="color:${clientExceptions>0?'var(--color-danger)':'var(--color-success)'}">${clientExceptions}</div>
                  <div class="stat-card-sub">${clientExceptions>0?'تتطلب متابعة':'لا توجد استثناءات'}</div>
                </div>
                <div class="stat-card" style="--stat-color:${clientOpenFindings>0?'var(--color-warning)':'var(--color-success)'}">
                  <div class="stat-card-label">ملاحظات مفتوحة</div>
                  <div class="stat-card-value">${clientOpenFindings}</div>
                  <div class="stat-card-sub">من ${clientFindings.length} إجمالي</div>
                </div>
                <div class="stat-card" style="--stat-color:${clientCriticalRisks>0?'var(--color-danger)':clientRisks.length>0?'var(--color-warning)':'var(--text-muted)'}">
                  <div class="stat-card-label">🎯 مخاطر مسجّلة</div>
                  <div class="stat-card-value">${clientRisks.length}</div>
                  <div class="stat-card-sub" style="color:${clientCriticalRisks>0?'var(--color-danger)':'var(--text-muted)'}">
                    ${clientCriticalRisks > 0 ? `${clientCriticalRisks} حرج/مرتفع` : 'لا مخاطر عالية'}
                  </div>
                </div>
              </div>

              <!-- Client quick actions -->
              <div style="display:flex;gap:12px;flex-wrap:wrap;">
                <button class="btn btn-primary btn-sm" onclick="App.navigateTo('programs')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                  برامج المراجعة
                </button>
                <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('materiality')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  الأهمية النسبية
                </button>
                <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('planning')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 11l3 3L22 4"/></svg>
                  التخطيط
                </button>
                <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('findings')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                  الملاحظات
                </button>
                <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('quality')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  الجودة والاعتماد
                </button>
                <button class="btn btn-accent btn-sm" onclick="App.navigateTo('reports')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
                  إنشاء التقارير
                </button>
              </div>
            </div>
          </div>
        `;
      }
    }

    // Risk distribution for chart
    const riskCounts = {
      high:   allClients.filter(c => c.riskLevel === 'high').length,
      medium: allClients.filter(c => c.riskLevel === 'medium').length,
      low:    allClients.filter(c => c.riskLevel === 'low').length
    };

    // Status distribution
    const statusCounts = {
      active:    allClients.filter(c => c.status === 'active').length,
      pending:   allClients.filter(c => c.status === 'pending').length,
      completed: allClients.filter(c => c.status === 'completed').length
    };

    // Recent activity
    const recentActivity = allActivity
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 8);

    // Upcoming deadline clients
    const today = new Date();
    const upcomingClients = allClients
      .filter(c => c.reportDate && new Date(c.reportDate) > today && c.status === 'active')
      .sort((a, b) => new Date(a.reportDate) - new Date(b.reportDate))
      .slice(0, 5);

    container.innerHTML = `
      <!-- Welcome banner -->
      <div class="dashboard-welcome mb-6">
        <div class="welcome-content">
          <div class="welcome-title">مرحباً بك في ${Utils.escapeHtml(firmName)}</div>
          <div class="welcome-subtitle">نظام إدارة المراجعة الاحترافي — ISA Standards</div>
          <div class="welcome-date">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${Utils.todayDisplay()}
          </div>
        </div>
      </div>

      <!-- Global KPI cards -->
      <div class="grid grid-4 mb-6">
        <div class="stat-card" style="--stat-color:var(--color-primary)">
          <div class="stat-card-label">إجمالي العملاء</div>
          <div class="stat-card-value">${totalClients}</div>
          <div class="stat-card-sub">${activeClients} نشط | ${completedClients} مكتمل</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--color-success)">
          <div class="stat-card-label">نسبة الإنجاز الكلية</div>
          <div class="stat-card-value" style="color:${overallPct>=75?'var(--color-success)':overallPct>=40?'var(--color-warning)':'var(--color-danger)'}">${overallPct}%</div>
          <div class="progress-bar-wrap" style="margin-top:8px;">
            <div class="progress-bar-fill" style="width:${overallPct}%;background:${overallPct>=75?'var(--color-success)':overallPct>=40?'var(--color-warning)':'var(--color-danger)'}"></div>
          </div>
        </div>
        <div class="stat-card" style="--stat-color:${openFindings>0?'var(--color-warning)':'var(--color-success)'}">
          <div class="stat-card-label">ملاحظات مفتوحة</div>
          <div class="stat-card-value">${openFindings}</div>
          <div class="stat-card-sub" style="color:${highFindings>0?'var(--color-danger)':'var(--text-muted)'}">
            ${highFindings > 0 ? `⚠ ${highFindings} جوهرية` : 'لا توجد ملاحظات جوهرية'}
          </div>
        </div>
        <div class="stat-card" style="--stat-color:${significantRisks>0?'var(--color-danger)':criticalRisks>0?'var(--color-danger)':unaddressedRisks>0?'var(--color-warning)':'var(--color-success)'}">
          <div class="stat-card-label">🎯 المخاطر المسجّلة</div>
          <div class="stat-card-value" style="color:${criticalRisks>0?'var(--color-danger)':'var(--text-primary)'}">${allRisks.length}</div>
          <div class="stat-card-sub" style="color:${unaddressedRisks>0?'var(--color-warning)':'var(--text-muted)'}">
            ${significantRisks > 0 ? `⚠ ${significantRisks} جوهري/غش (ISA 240)` : criticalRisks > 0 ? `⚠ ${criticalRisks} حرج/مرتفع` : unaddressedRisks > 0 ? `${unaddressedRisks} غير مرتبط بإجراءات` : 'جميعها مغطاة'}
          </div>
        </div>
      </div>

      ${allRisks.length > 0 ? buildRiskHeatmap(allRisks) : ''}

      <!-- Active client panel -->
      ${activeClientHTML || `
        <div class="info-box mb-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <div>لم يتم اختيار عميل بعد. اختر عميلاً من القائمة الجانبية لعرض تفاصيله هنا.</div>
        </div>
      `}

      <!-- Charts row -->
      <div class="grid grid-2 mb-5" style="gap:20px;">

        <!-- Procedures breakdown -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
              توزيع إجراءات المراجعة
            </div>
          </div>
          <div class="card-body">
            ${totalProcs === 0
              ? '<div style="text-align:center;color:var(--text-muted);padding:20px;">لا توجد إجراءات مراجعة مسجّلة</div>'
              : buildProceduresChart(allProcs)
            }
          </div>
        </div>

        <!-- Client risk distribution -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              توزيع العملاء حسب المخاطر
            </div>
          </div>
          <div class="card-body">
            ${totalClients === 0
              ? '<div style="text-align:center;color:var(--text-muted);padding:20px;">لا يوجد عملاء مسجّلون</div>'
              : buildRiskChart(riskCounts, totalClients)
            }
          </div>
        </div>
      </div>

      <!-- Bottom row -->
      <div class="grid grid-2 mb-5" style="gap:20px;">

        <!-- Upcoming deadlines -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              المهام القادمة
            </div>
          </div>
          <div class="card-body">
            ${upcomingClients.length === 0
              ? '<div style="text-align:center;color:var(--text-muted);padding:20px;">لا توجد مهام قادمة</div>'
              : `<table style="width:100%;border-collapse:collapse;font-size:13px;">
                  <thead>
                    <tr style="background:var(--bg-surface-2);">
                      <th style="padding:8px;text-align:right;border-bottom:1px solid var(--border-color);">العميل</th>
                      <th style="padding:8px;text-align:center;border-bottom:1px solid var(--border-color);">تاريخ التقرير</th>
                      <th style="padding:8px;text-align:center;border-bottom:1px solid var(--border-color);">المتبقي</th>
                      <th style="padding:8px;text-align:center;border-bottom:1px solid var(--border-color);">المخاطر</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${upcomingClients.map(c => {
                      const days = Math.ceil((new Date(c.reportDate) - today) / (1000 * 60 * 60 * 24));
                      const urgency = days <= 7 ? 'var(--color-danger)' : days <= 30 ? 'var(--color-warning)' : 'var(--color-success)';
                      return `<tr>
                        <td style="padding:8px;border-bottom:1px solid var(--border-color);">
                          <div style="font-weight:600;">${Utils.escapeHtml(Utils.truncate(c.name, 25))}</div>
                          <div style="font-size:11px;color:var(--text-muted);">${Utils.escapeHtml(c.fileNumber||'')}</div>
                        </td>
                        <td style="padding:8px;text-align:center;border-bottom:1px solid var(--border-color);">${Utils.formatDate(c.reportDate)}</td>
                        <td style="padding:8px;text-align:center;border-bottom:1px solid var(--border-color);">
                          <span style="color:${urgency};font-weight:700;">${days} يوم</span>
                        </td>
                        <td style="padding:8px;text-align:center;border-bottom:1px solid var(--border-color);">${Utils.riskBadge(c.riskLevel)}</td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>`
            }
          </div>
        </div>

        <!-- Activity feed -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              آخر الأنشطة
            </div>
          </div>
          <div class="card-body">
            ${recentActivity.length === 0
              ? '<div style="text-align:center;color:var(--text-muted);padding:20px;">لا يوجد نشاط مسجّل</div>'
              : `<ul class="activity-feed">
                  ${recentActivity.map(a => `
                    <li class="activity-item">
                      <div class="activity-dot ${a.type==='success'?'success':a.type==='warning'?'warning':a.type==='error'?'danger':''}"></div>
                      <div class="activity-text">
                        <strong>${Utils.escapeHtml(a.action)}</strong><br>
                        <span style="font-size:12px;">${Utils.escapeHtml(Utils.truncate(a.description, 60))}</span>
                      </div>
                      <div class="activity-time">${Utils.timeAgo(a.timestamp)}</div>
                    </li>
                  `).join('')}
                </ul>`
            }
          </div>
        </div>
      </div>

      <!-- Clients overview table -->
      ${totalClients > 0 ? `
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              ملخص العملاء
            </div>
            <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('clients')">
              عرض الكل
            </button>
          </div>
          <div class="card-body" style="padding:0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>السنة</th>
                  <th>المخاطر</th>
                  <th>الحالة</th>
                  <th>تاريخ التقرير</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                ${allClients.slice(0, 8).map(c => `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,var(--color-primary),var(--color-primary-light));color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">
                          ${Utils.initials(c.name)}
                        </div>
                        <div>
                          <div style="font-weight:600;font-size:13px;">${Utils.escapeHtml(Utils.truncate(c.name, 28))}</div>
                          <div style="font-size:11px;color:var(--text-muted);font-family:monospace;">${Utils.escapeHtml(c.fileNumber||'')}</div>
                        </div>
                      </div>
                    </td>
                    <td style="font-size:13px;">${Utils.escapeHtml(c.financialYear||'—')}</td>
                    <td>${Utils.riskBadge(c.riskLevel)}</td>
                    <td>${Utils.statusBadge(c.status)}</td>
                    <td style="font-size:13px;">${Utils.formatDate(c.reportDate)}</td>
                    <td>
                      <button class="btn btn-sm btn-primary" onclick="ClientsModule.selectClient(${c.id})">
                        اختيار
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : `
        <div class="card">
          <div class="card-body">
            ${Utils.emptyStateHTML(
              'لا يوجد عملاء',
              'ابدأ بإضافة عميلك الأول لإنشاء ملف مراجعة',
              'إضافة أول عميل',
              "App.navigateTo('clients');setTimeout(()=>ClientsModule.openAddModal(),300)"
            )}
          </div>
        </div>
      `}
    `;
  }

  /* ---- Build procedures status chart (SVG bars) ---- */
  function buildProceduresChart(procedures) {
    const counts = {
      'مكتمل':       procedures.filter(p => p.status === 'completed').length,
      'جارٍ':         procedures.filter(p => p.status === 'in-progress').length,
      'لم يبدأ':      procedures.filter(p => p.status === 'not-started').length,
      'استثناء':      procedures.filter(p => p.status === 'exception').length
    };
    const colors = {
      'مكتمل':  'var(--color-success)',
      'جارٍ':    'var(--color-warning)',
      'لم يبدأ': 'var(--border-strong)',
      'استثناء': 'var(--color-danger)'
    };
    const total = procedures.length || 1;
    const maxVal = Math.max(...Object.values(counts), 1);

    return `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${Object.entries(counts).map(([label, count]) => `
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="font-size:13px;color:var(--text-secondary);">${label}</span>
              <span style="font-size:13px;font-weight:700;color:var(--text-primary);">${count} (${Math.round(count/total*100)}%)</span>
            </div>
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" style="width:${Math.round(count/total*100)}%;background:${colors[label]};"></div>
            </div>
          </div>
        `).join('')}
        <div style="text-align:center;font-size:12px;color:var(--text-muted);margin-top:8px;">إجمالي: ${procedures.length} إجراء</div>
      </div>
    `;
  }

  /* ---- Build risk distribution chart ---- */
  function buildRiskChart(riskCounts, total) {
    const items = [
      { label: 'مخاطر عالية',   count: riskCounts.high,   color: 'var(--color-danger)'  },
      { label: 'مخاطر متوسطة', count: riskCounts.medium, color: 'var(--color-warning)' },
      { label: 'مخاطر منخفضة', count: riskCounts.low,    color: 'var(--color-success)' }
    ];

    const statusCounts = [
      { label: 'نشط',    count: 0, color: 'var(--color-success)' },
      { label: 'معلق',   count: 0, color: 'var(--color-warning)' },
      { label: 'مكتمل',  count: 0, color: 'var(--color-info)'    }
    ];

    return `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${items.map(item => {
          const pct = Math.round((item.count / total) * 100);
          return `
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <span style="font-size:13px;color:var(--text-secondary);">${item.label}</span>
                <span style="font-size:13px;font-weight:700;color:${item.color};">${item.count} عميل (${pct}%)</span>
              </div>
              <div class="progress-bar-wrap">
                <div class="progress-bar-fill" style="width:${pct}%;background:${item.color};"></div>
              </div>
            </div>
          `;
        }).join('')}

        <!-- Donut-style summary -->
        <div style="display:flex;justify-content:center;gap:20px;margin-top:12px;flex-wrap:wrap;">
          ${items.map(item => `
            <div style="display:flex;align-items:center;gap:6px;">
              <div style="width:12px;height:12px;border-radius:50%;background:${item.color};flex-shrink:0;"></div>
              <span style="font-size:12px;color:var(--text-secondary);">${item.label}: <strong>${item.count}</strong></span>
            </div>
          `).join('')}
        </div>
        <div style="text-align:center;font-size:12px;color:var(--text-muted);">إجمالي: ${total} عميل</div>
      </div>
    `;
  }

  function buildRiskHeatmap(risks) {
    // مصفوفة 3×3: الاحتمالية (الأعمدة: low/medium/high) × الأثر (الصفوف: high/medium/low)
    const labels = { low: 'منخفض', medium: 'متوسط', high: 'مرتفع' };
    const cellColor = {
      'low-low':'var(--color-success)', 'low-medium':'var(--color-success)', 'low-high':'var(--color-warning)',
      'medium-low':'var(--color-success)', 'medium-medium':'var(--color-warning)', 'medium-high':'var(--color-danger)',
      'high-low':'var(--color-warning)', 'high-medium':'var(--color-danger)', 'high-high':'#7c1d2e'
    };
    const likelihoods = ['low','medium','high'];
    const impacts     = ['high','medium','low'];

    const riskGrid = {};
    risks.forEach(r => {
      const key = `${r.likelihood || 'medium'}-${r.impact || 'medium'}`;
      riskGrid[key] = (riskGrid[key] || []);
      riskGrid[key].push(r.title);
    });

    const cells = impacts.map(impact =>
      likelihoods.map(likelihood => {
        const key = `${likelihood}-${impact}`;
        const count = (riskGrid[key] || []).length;
        const titles = (riskGrid[key] || []).slice(0, 2).join('\n');
        const color = cellColor[key] || 'var(--border-color)';
        return `
          <div class="heatmap-cell" style="background:${color}10;border:1px solid ${color}40;" title="${Utils.escapeHtml(titles)}">
            ${count > 0 ? `<div class="heatmap-count" style="background:${color};color:#fff;">${count}</div>` : ''}
            <div class="heatmap-level" style="color:${color};">${count > 0 ? count + ' خطر' : '—'}</div>
          </div>
        `;
      }).join('')
    );

    return `
      <div class="card mb-5">
        <div class="card-header">
          <div class="card-title">🎯 خريطة حرارة المخاطر (${risks.length} خطر)</div>
          <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('planning')">عرض سجل المخاطر</button>
        </div>
        <div class="card-body">
          <div class="heatmap-container">
            <div class="heatmap-y-label">
              <span>الأثر ↑</span>
              ${impacts.map(i => `<div class="heatmap-y-tick">${labels[i]}</div>`).join('')}
            </div>
            <div style="flex:1;">
              <div class="heatmap-grid">
                ${cells.map(row => row).join('')}
              </div>
              <div class="heatmap-x-axis">
                ${likelihoods.map(l => `<div class="heatmap-x-label">${labels[l]}</div>`).join('')}
              </div>
              <div style="text-align:center;font-size:var(--fs-xs);color:var(--text-muted);margin-top:4px;">الاحتمالية →</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return {
    renderDashboard
  };
})();
