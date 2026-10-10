/* ============================================================
   AuditPro - Quality & Reliance Module
   ------------------------------------------------------------
   وحدة شاملة تغطي أربعة معايير مراجعة دولية لم تكن مُغطاة سابقاً:
     - ISA 600  : مراجعة القوائم المالية للمجموعات (مكوّنات المجموعة)
     - ISA 610  : استخدام أعمال المراجعين الداخليين
     - ISA 620  : استخدام أعمال خبير المراجع
     - ISA 220 (المُعدَّل) / ISQM 1 : إدارة جودة الارتباط ومراجعة الجودة (EQR)
   ============================================================ */

const QualityModule = (() => {

  let activeTab = 'components';

  /* ---------------------------------------------------------
     ISA 600 - Group Audit Components
     --------------------------------------------------------- */
  const SIGNIFICANCE_LABELS = {
    significant_individually: 'مكوّن جوهري بذاته (Individually Significant)',
    significant_risk:         'مكوّن جوهري بسبب مخاطر محتملة',
    not_significant:          'مكوّن غير جوهري'
  };
  const SIGNIFICANCE_COLORS = {
    significant_individually: 'var(--color-danger)',
    significant_risk:         'var(--color-warning)',
    not_significant:          'var(--color-success)'
  };
  const WORK_PERFORMED_LABELS = {
    full_audit:          'مراجعة كاملة لمكوّن واحد',
    specified_procedures: 'إجراءات محدَّدة على أرصدة/فئات معاملات',
    review:               'مراجعة محدودة (Review)',
    analytical_only:      'إجراءات تحليلية على مستوى المجموعة فقط'
  };
  const COMPONENT_STATUS_LABELS = { not_started: 'لم يبدأ', in_progress: 'جارٍ', completed: 'مكتمل' };

  async function loadComponents(clientId) {
    return AuditDB.getByClientYear(AuditDB.STORES.COMPONENTS, clientId, App.getActiveYear());
  }

  function componentsTabHTML(components, readOnly) {
    const total = components.length;
    const significant = components.filter(c => c.significance !== 'not_significant').length;
    const completed = components.filter(c => c.status === 'completed').length;

    return `
      <div class="info-box mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div><strong>ISA 600 (المُعدَّل):</strong> يُستخدم هذا القسم عند مراجعة قوائم مالية موحَّدة/مجمَّعة تضم أكثر من منشأة أو وحدة تشغيلية (مكوّن). حدّد كل مكوّن ومستوى جوهريته، والعمل المطلوب تنفيذه عليه، وما إذا كان سيُنفَّذه فريق المجموعة أو مراجع مكوّن مستقل.</div>
      </div>

      <div class="grid grid-3 mb-5">
        <div class="stat-card" style="--stat-color:var(--color-primary)">
          <div class="stat-card-label">إجمالي المكوّنات</div>
          <div class="stat-card-value">${total}</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--color-warning)">
          <div class="stat-card-label">مكوّنات جوهرية</div>
          <div class="stat-card-value">${significant}</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--color-success)">
          <div class="stat-card-label">اكتمل العمل عليها</div>
          <div class="stat-card-value">${completed}/${total}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">🏢 مكوّنات المجموعة</div>
          ${readOnly ? '' : `<button class="btn btn-primary btn-sm" onclick="QualityModule.openComponentModal()">+ إضافة مكوّن</button>`}
        </div>
        <div class="card-body">
          ${total === 0 ? `
            <div class="text-sm text-muted" style="padding:16px 0;">لم يتم تسجيل أي مكوّنات بعد. إن كانت هذه مراجعة لمنشأة واحدة (غير مجموعة)، يمكنك تجاهل هذا القسم بالكامل.</div>
          ` : `
            <div class="risk-register-list">
              ${components.map(c => `
                <div class="risk-register-item">
                  <div class="risk-register-level" style="background:${SIGNIFICANCE_COLORS[c.significance]}"></div>
                  <div class="risk-register-info">
                    <div class="risk-register-title">${Utils.escapeHtml(c.name)} ${c.location ? `<span class="text-xs text-muted">(${Utils.escapeHtml(c.location)})</span>` : ''}</div>
                    <div class="risk-register-meta">
                      <span class="badge" style="background:${SIGNIFICANCE_COLORS[c.significance]};color:#fff;">${SIGNIFICANCE_LABELS[c.significance]}</span>
                      <span class="chip">${WORK_PERFORMED_LABELS[c.workPerformed] || '—'}</span>
                      <span class="chip">${COMPONENT_STATUS_LABELS[c.status] || 'لم يبدأ'}</span>
                      ${c.componentAuditor ? `<span class="chip">مراجع المكوّن: ${Utils.escapeHtml(c.componentAuditor)}</span>` : `<span class="chip">يُنفَّذه فريق المجموعة</span>`}
                      ${c.componentMateriality ? `<span class="chip">أهمية نسبية: ${Utils.formatNumber(c.componentMateriality)}</span>` : ''}
                    </div>
                    <div class="risk-register-meta" style="margin-top:4px;">
                      ${c.instructionsSent ? `<span class="chip" style="color:var(--color-success);">✓ أُرسلت التعليمات</span>` : `<span class="chip chip-danger">لم تُرسَل التعليمات بعد</span>`}
                      ${c.componentAuditor ? (c.reportReceived ? `<span class="chip" style="color:var(--color-success);">✓ استُلم تقرير المكوّن</span>` : `<span class="chip chip-danger">لم يُستلَم تقرير المكوّن بعد</span>`) : ''}
                    </div>
                    ${c.reviewNotes ? `<div class="text-xs text-muted mt-2">${Utils.escapeHtml(c.reviewNotes)}</div>` : ''}
                  </div>
                  ${readOnly ? '' : `
                  <div class="risk-register-actions">
                    <button class="btn-icon" title="تعديل" onclick="QualityModule.openComponentModal(${c.id})">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon" title="حذف" onclick="QualityModule.deleteComponent(${c.id})">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                  </div>`}
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  }

  async function openComponentModal(id) {
    if (Utils.blockIfArchive()) return;
    const clientId = App.getActiveClientId();
    if (!clientId) return;
    const existing = id ? await AuditDB.get(AuditDB.STORES.COMPONENTS, id) : {};

    const body = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">اسم المكوّن</label>
          <input class="form-control" id="cm-name" type="text" value="${Utils.escapeHtml(existing.name || '')}" placeholder="مثال: الشركة التابعة - فرع الإسكندرية">
        </div>
        <div class="form-group">
          <label class="form-label">الموقع / الدولة</label>
          <input class="form-control" id="cm-location" type="text" value="${Utils.escapeHtml(existing.location || '')}" placeholder="مثال: مصر - الإسكندرية">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">مستوى الجوهرية</label>
          <select class="form-control" id="cm-significance">
            ${Object.entries(SIGNIFICANCE_LABELS).map(([k,v]) => `<option value="${k}" ${(existing.significance||'not_significant')===k?'selected':''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">العمل المطلوب تنفيذه</label>
          <select class="form-control" id="cm-work">
            ${Object.entries(WORK_PERFORMED_LABELS).map(([k,v]) => `<option value="${k}" ${(existing.workPerformed||'analytical_only')===k?'selected':''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">مراجع المكوّن (اتركه فارغاً إن نفّذه فريق المجموعة)</label>
          <input class="form-control" id="cm-auditor" type="text" value="${Utils.escapeHtml(existing.componentAuditor || '')}" placeholder="اسم مكتب/مراجع المكوّن المستقل">
        </div>
        <div class="form-group">
          <label class="form-label">الأهمية النسبية للمكوّن</label>
          <input class="form-control" id="cm-materiality" type="number" min="0" value="${existing.componentMateriality || ''}" placeholder="بالعملة المحلية">
        </div>
      </div>
      <div class="form-row">
        <label class="setting-row" style="cursor:pointer;">
          <input type="checkbox" id="cm-instructions" ${existing.instructionsSent ? 'checked' : ''}>
          <div class="setting-info"><div class="setting-name">تم إرسال التعليمات لمراجع المكوّن</div></div>
        </label>
        <label class="setting-row" style="cursor:pointer;">
          <input type="checkbox" id="cm-report" ${existing.reportReceived ? 'checked' : ''}>
          <div class="setting-info"><div class="setting-name">تم استلام تقرير/عمل المكوّن ومراجعته</div></div>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label">حالة العمل</label>
        <select class="form-control" id="cm-status">
          <option value="not_started" ${(existing.status||'not_started')==='not_started'?'selected':''}>لم يبدأ</option>
          <option value="in_progress" ${existing.status==='in_progress'?'selected':''}>جارٍ</option>
          <option value="completed" ${existing.status==='completed'?'selected':''}>مكتمل</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">ملاحظات مراجعة فريق المجموعة على عمل المكوّن</label>
        <textarea class="form-control textarea-auto" id="cm-notes" rows="2">${Utils.escapeHtml(existing.reviewNotes || '')}</textarea>
      </div>
    `;

    Utils.openModal(id ? 'تعديل مكوّن' : 'إضافة مكوّن جديد', body, `
      <button class="btn btn-primary" id="saveComponentBtn">حفظ</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
    `, 'lg');

    document.getElementById('saveComponentBtn').onclick = async () => {
      const name = document.getElementById('cm-name').value.trim();
      if (!name) { Utils.showToast('يرجى إدخال اسم المكوّن', 'error'); return; }
      const record = {
        clientId,
        name,
        location: document.getElementById('cm-location').value.trim(),
        significance: document.getElementById('cm-significance').value,
        workPerformed: document.getElementById('cm-work').value,
        componentAuditor: document.getElementById('cm-auditor').value.trim(),
        componentMateriality: parseFloat(document.getElementById('cm-materiality').value) || null,
        instructionsSent: document.getElementById('cm-instructions').checked,
        reportReceived: document.getElementById('cm-report').checked,
        status: document.getElementById('cm-status').value,
        reviewNotes: document.getElementById('cm-notes').value.trim()
      };
      if (id) await AuditDB.put(AuditDB.STORES.COMPONENTS, { ...existing, ...record });
      else await AuditDB.add(AuditDB.STORES.COMPONENTS, record);
      Utils.closeModal();
      Utils.showToast('تم حفظ بيانات المكوّن', 'success');
      renderQuality();
    };
  }

  async function deleteComponent(id) {
    if (Utils.blockIfArchive()) return;
    Utils.confirmDialog('هل تريد حذف هذا المكوّن؟', async () => {
      await AuditDB.delete(AuditDB.STORES.COMPONENTS, id);
      Utils.showToast('تم الحذف', 'success');
      renderQuality();
    });
  }

  /* ---------------------------------------------------------
     ISA 610 / ISA 620 - Reliance on the Work of Others
     --------------------------------------------------------- */
  const RELIANCE_TYPE_LABELS = { internal_audit: 'المراجعة الداخلية (ISA 610)', expert: 'خبير المراجع (ISA 620)' };
  const RELIANCE_DECISION_LABELS = {
    relied: 'تم الاعتماد على العمل',
    partial: 'اعتماد جزئي مع إجراءات إضافية',
    not_relied: 'لم يُعتمَد على العمل'
  };
  const RELIANCE_DECISION_COLORS = {
    relied: 'var(--color-success)',
    partial: 'var(--color-warning)',
    not_relied: 'var(--color-danger)'
  };

  async function loadReliance(clientId) {
    return AuditDB.getByClientYear(AuditDB.STORES.RELIANCE, clientId, App.getActiveYear());
  }

  function relianceTabHTML(items, readOnly) {
    const iaItems = items.filter(r => r.type === 'internal_audit');
    const expertItems = items.filter(r => r.type === 'expert');

    return `
      <div class="info-box mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div>
          <strong>ISA 610:</strong> عند الاعتماد على عمل وظيفة المراجعة الداخلية، يجب تقييم موضوعيتها وكفاءتها ونهجها المنظّم قبل الاعتماد على عملها.<br>
          <strong>ISA 620:</strong> عند استخدام عمل خبير المراجع (تقييم عقاري، اكتواري، فني...)، يجب تقييم كفاءته وقدراته وموضوعيته، وفهم طبيعة عمله ومدى ملاءمته كأدلة مراجعة.
        </div>
      </div>

      <div class="card mb-5">
        <div class="card-header">
          <div class="card-title">🔍 الاعتماد على المراجعة الداخلية (ISA 610)</div>
          ${readOnly ? '' : `<button class="btn btn-primary btn-sm" onclick="QualityModule.openRelianceModal(null, 'internal_audit')">+ إضافة تقييم</button>`}
        </div>
        <div class="card-body">
          ${iaItems.length === 0 ? `<div class="text-sm text-muted" style="padding:8px 0;">لا يوجد تقييم مُسجَّل. إن لم تكن هناك وظيفة مراجعة داخلية لدى العميل، يمكن تجاهل هذا القسم.</div>` : relianceListHTML(iaItems, readOnly)}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">🧑‍🔬 الاعتماد على خبراء المراجع (ISA 620)</div>
          ${readOnly ? '' : `<button class="btn btn-primary btn-sm" onclick="QualityModule.openRelianceModal(null, 'expert')">+ إضافة تقييم</button>`}
        </div>
        <div class="card-body">
          ${expertItems.length === 0 ? `<div class="text-sm text-muted" style="padding:8px 0;">لا يوجد تقييم مُسجَّل. إن لم يُستخدَم أي خبير خارجي في هذه المراجعة، يمكن تجاهل هذا القسم.</div>` : relianceListHTML(expertItems, readOnly)}
        </div>
      </div>
    `;
  }

  function relianceListHTML(items, readOnly) {
    return `
      <div class="risk-register-list">
        ${items.map(r => `
          <div class="risk-register-item">
            <div class="risk-register-level" style="background:${RELIANCE_DECISION_COLORS[r.relianceDecision]}"></div>
            <div class="risk-register-info">
              <div class="risk-register-title">${Utils.escapeHtml(r.name)}${r.expertiseField ? ` <span class="text-xs text-muted">(${Utils.escapeHtml(r.expertiseField)})</span>` : ''}</div>
              <div class="risk-register-meta">
                <span class="badge" style="background:${RELIANCE_DECISION_COLORS[r.relianceDecision]};color:#fff;">${RELIANCE_DECISION_LABELS[r.relianceDecision]}</span>
                ${r.objectivityRating ? `<span class="chip">الموضوعية: ${r.objectivityRating === 'high' ? 'مرتفعة' : r.objectivityRating === 'medium' ? 'متوسطة' : 'منخفضة'}</span>` : ''}
              </div>
              ${r.competenceAssessment ? `<div class="text-xs text-muted mt-2"><strong>تقييم الكفاءة والموضوعية:</strong> ${Utils.escapeHtml(r.competenceAssessment)}</div>` : ''}
              ${r.workReviewed ? `<div class="text-xs text-muted mt-1"><strong>العمل الذي تمت مراجعته:</strong> ${Utils.escapeHtml(r.workReviewed)}</div>` : ''}
              ${r.conclusion ? `<div class="text-xs mt-1" style="color:var(--color-info);"><strong>الاستنتاج:</strong> ${Utils.escapeHtml(r.conclusion)}</div>` : ''}
            </div>
            ${readOnly ? '' : `
            <div class="risk-register-actions">
              <button class="btn-icon" title="تعديل" onclick="QualityModule.openRelianceModal(${r.id}, '${r.type}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn-icon" title="حذف" onclick="QualityModule.deleteReliance(${r.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            </div>`}
          </div>
        `).join('')}
      </div>
    `;
  }

  async function openRelianceModal(id, presetType) {
    if (Utils.blockIfArchive()) return;
    const clientId = App.getActiveClientId();
    if (!clientId) return;
    const existing = id ? await AuditDB.get(AuditDB.STORES.RELIANCE, id) : { type: presetType };
    const isExpert = (existing.type || presetType) === 'expert';

    const body = `
      <div class="form-group">
        <label class="form-label required">${isExpert ? 'اسم الخبير / الجهة' : 'اسم وظيفة/قسم المراجعة الداخلية'}</label>
        <input class="form-control" id="rl-name" type="text" value="${Utils.escapeHtml(existing.name || '')}" placeholder="${isExpert ? 'مثال: مكتب التقييم العقاري ABC' : 'مثال: إدارة المراجعة الداخلية بالشركة'}">
      </div>
      ${isExpert ? `
      <div class="form-group">
        <label class="form-label">مجال التخصص</label>
        <input class="form-control" id="rl-field" type="text" value="${Utils.escapeHtml(existing.expertiseField || '')}" placeholder="مثال: تقييم عقاري، اكتواري، تقييم فني...">
      </div>
      ` : `
      <div class="form-group">
        <label class="form-label">تقييم الموضوعية (الاستقلالية عن الإدارة التنفيذية)</label>
        <select class="form-control" id="rl-objectivity">
          <option value="high" ${existing.objectivityRating==='high'?'selected':''}>مرتفعة</option>
          <option value="medium" ${(!existing.objectivityRating||existing.objectivityRating==='medium')?'selected':''}>متوسطة</option>
          <option value="low" ${existing.objectivityRating==='low'?'selected':''}>منخفضة</option>
        </select>
      </div>
      `}
      <div class="form-group">
        <label class="form-label">تقييم الكفاءة ${isExpert ? 'والقدرات والموضوعية' : 'والنهج المنظّم'}</label>
        <textarea class="form-control textarea-auto" id="rl-competence" rows="2" placeholder="${isExpert ? 'المؤهلات، الخبرة، العضوية المهنية، سمعة الجهة...' : 'المؤهلات المهنية، الخبرة، مدى الالتزام بمعايير المراجعة الداخلية...'}">${Utils.escapeHtml(existing.competenceAssessment || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">وصف العمل الذي تمت مراجعته / الاعتماد عليه</label>
        <textarea class="form-control textarea-auto" id="rl-work" rows="2">${Utils.escapeHtml(existing.workReviewed || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label required">قرار الاعتماد</label>
        <select class="form-control" id="rl-decision">
          ${Object.entries(RELIANCE_DECISION_LABELS).map(([k,v]) => `<option value="${k}" ${(existing.relianceDecision||'not_relied')===k?'selected':''}>${v}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">الاستنتاج النهائي</label>
        <textarea class="form-control textarea-auto" id="rl-conclusion" rows="2">${Utils.escapeHtml(existing.conclusion || '')}</textarea>
      </div>
    `;

    Utils.openModal(id ? 'تعديل التقييم' : `إضافة تقييم — ${RELIANCE_TYPE_LABELS[existing.type || presetType]}`, body, `
      <button class="btn btn-primary" id="saveRelianceBtn">حفظ</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
    `, 'lg');

    document.getElementById('saveRelianceBtn').onclick = async () => {
      const name = document.getElementById('rl-name').value.trim();
      if (!name) { Utils.showToast('يرجى إدخال الاسم', 'error'); return; }
      const record = {
        clientId,
        type: existing.type || presetType,
        name,
        expertiseField: isExpert ? document.getElementById('rl-field').value.trim() : null,
        objectivityRating: !isExpert ? document.getElementById('rl-objectivity').value : null,
        competenceAssessment: document.getElementById('rl-competence').value.trim(),
        workReviewed: document.getElementById('rl-work').value.trim(),
        relianceDecision: document.getElementById('rl-decision').value,
        conclusion: document.getElementById('rl-conclusion').value.trim()
      };
      if (id) await AuditDB.put(AuditDB.STORES.RELIANCE, { ...existing, ...record });
      else await AuditDB.add(AuditDB.STORES.RELIANCE, record);
      Utils.closeModal();
      Utils.showToast('تم حفظ التقييم', 'success');
      renderQuality();
    };
  }

  async function deleteReliance(id) {
    if (Utils.blockIfArchive()) return;
    Utils.confirmDialog('هل تريد حذف هذا التقييم؟', async () => {
      await AuditDB.delete(AuditDB.STORES.RELIANCE, id);
      Utils.showToast('تم الحذف', 'success');
      renderQuality();
    });
  }

  /* ---------------------------------------------------------
     ISA 220 (Revised) / ISQM 1 - Engagement Quality Review (EQR)
     --------------------------------------------------------- */
  const EQR_CHECKLIST_ITEMS = [
    { id: 'significantJudgments',  text: 'تمت مناقشة الأحكام المهنية الجوهرية والاستنتاجات مع فريق الارتباط' },
    { id: 'riskAssessmentAppropriate', text: 'تقييم المخاطر واستجابات المراجعة له ملائمة ومُوثَّقة بشكل كافٍ' },
    { id: 'materialityAppropriate', text: 'مستويات الأهمية النسبية (الإجمالية وأداء العمل) محدَّدة ومُبرَّرة بشكل ملائم' },
    { id: 'findingsAddressed',     text: 'تمت معالجة/تسوية جميع الملاحظات الجوهرية المفتوحة بشكل مناسب' },
    { id: 'conclusionsSupported',  text: 'استنتاجات المراجعة مدعومة بأدلة مراجعة كافية وملائمة موثَّقة في الملف' },
    { id: 'disclosuresAdequate',   text: 'الإفصاحات في القوائم المالية كافية ومتسقة مع نتائج المراجعة' },
    { id: 'independenceThreatsAddressed', text: 'تم تقييم تهديدات الاستقلالية وتوثيق الضمانات المُطبَّقة (إن وُجدت)' },
    { id: 'goingConcernAddressed', text: 'تم توثيق تقييم استمرارية المنشأة (ISA 570) بشكل مناسب' },
    { id: 'reportConsistent',      text: 'مسودة تقرير المراجع متسقة مع نتائج أعمال المراجعة المُنفَّذة' }
  ];
  const EQR_CONCLUSION_LABELS = {
    no_matters: 'لا توجد أمور معلَّقة — يمكن إصدار التقرير',
    matters_resolved: 'كانت هناك أمور، وتمت تسويتها بالكامل',
    matters_pending: 'توجد أمور معلَّقة تستوجب المعالجة قبل إصدار التقرير'
  };

  async function loadQualityReview(clientId) {
    const records = await AuditDB.getByClientYear(AuditDB.STORES.QUALITY_REVIEW, clientId, App.getActiveYear());
    return records.length > 0 ? records[records.length - 1] : null;
  }

  function qualityReviewTabHTML(qr, readOnly) {
    const checklistDone = qr ? Object.values(qr.checklist || {}).filter(Boolean).length : 0;
    const checklistTotal = EQR_CHECKLIST_ITEMS.length;
    const conclusionMeta = qr?.eqrConclusion ? EQR_CONCLUSION_LABELS[qr.eqrConclusion] : null;
    const statusColor = !qr ? 'var(--text-muted)'
      : qr.eqrConclusion === 'matters_pending' ? 'var(--color-danger)'
      : checklistDone === checklistTotal ? 'var(--color-success)' : 'var(--color-warning)';

    return `
      <div class="info-box mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div><strong>ISA 220 (المُعدَّل) / ISQM 1:</strong> توثيق إدارة جودة الارتباط، وإجراء مراجعة جودة الارتباط (EQR) بواسطة مراجع مستقل عن فريق الارتباط عند الحاجة (إلزامية عادةً للعملاء المُدرَجين أو مرتفعي المخاطر)، قبل إصدار تقرير المراجع.</div>
      </div>

      <div class="card mb-5">
        <div class="card-header">
          <div class="card-title">✅ هل يتطلب هذا الارتباط مراجعة جودة (EQR)؟</div>
        </div>
        <div class="card-body">
          <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
            ${qr?.eqrConclusion === 'no_matters' || qr?.eqrConclusion === 'matters_resolved' ? `
              <span class="stamp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>مُعتمَد جودة</span>
            ` : `<div style="width:12px;height:12px;border-radius:50%;background:${statusColor};flex-shrink:0;"></div>`}
            <div style="font-weight:600;color:${statusColor};">
              ${!qr ? 'لم يبدأ توثيق مراجعة الجودة بعد' : qr.eqrRequired ? (conclusionMeta || `${checklistDone}/${checklistTotal} بنود مكتملة`) : 'تم تحديد أن هذا الارتباط لا يتطلب EQR'}
            </div>
          </div>
        </div>
      </div>

      ${qr && qr.eqrRequired ? `
        <div class="card mb-5">
          <div class="card-header"><div class="card-title">قائمة تحقق مراجعة الجودة</div></div>
          <div class="card-body">
            <div class="risk-proc-picker" style="max-height:none;">
              ${EQR_CHECKLIST_ITEMS.map(item => `
                <label class="risk-proc-option" style="cursor:default;">
                  <span style="color:${qr.checklist?.[item.id] ? 'var(--color-success)' : 'var(--color-danger)'};">${qr.checklist?.[item.id] ? '✓' : '✗'}</span>
                  <span>${Utils.escapeHtml(item.text)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="card mb-5">
          <div class="card-body">
            <div class="text-xs text-muted mb-2"><strong>مراجع الجودة:</strong> ${Utils.escapeHtml(qr.eqrReviewerName || '—')}</div>
            <div class="text-xs text-muted mb-2"><strong>تاريخ المراجعة:</strong> ${qr.eqrDate ? Utils.formatDate(qr.eqrDate) : '—'}</div>
            <div class="text-xs text-muted mb-2"><strong>استقلالية المراجع مؤكَّدة:</strong> ${qr.independenceConfirmed ? 'نعم' : 'لا'}</div>
            ${qr.reviewerComments ? `<div class="text-xs text-muted"><strong>ملاحظات المراجع:</strong> ${Utils.escapeHtml(qr.reviewerComments)}</div>` : ''}
          </div>
        </div>
      ` : ''}

      ${readOnly ? '' : `<button class="btn btn-primary" onclick="QualityModule.openQualityReviewModal()">${qr ? 'تعديل مراجعة الجودة' : 'بدء توثيق مراجعة الجودة'}</button>`}
    `;
  }

  async function openQualityReviewModal() {
    if (Utils.blockIfArchive()) return;
    const clientId = App.getActiveClientId();
    if (!clientId) return;
    const existing = await loadQualityReview(clientId) || {};
    const checklist = existing.checklist || {};

    const body = `
      <label class="setting-row mb-3" style="cursor:pointer;">
        <input type="checkbox" id="qr-required" ${existing.eqrRequired ? 'checked' : ''} onchange="document.getElementById('qr-details-section').style.display=this.checked?'block':'none'">
        <div class="setting-info">
          <div class="setting-name">هذا الارتباط يتطلب مراجعة جودة (EQR)</div>
          <div class="setting-desc">إلزامية عادةً لمراجعة الشركات المُدرَجة، أو المنشآت ذات المصلحة العامة، أو مرتفعة المخاطر وفق سياسة جودة المكتب (ISQM 1)</div>
        </div>
      </label>

      <div id="qr-details-section" style="display:${existing.eqrRequired ? 'block' : 'none'};">
        <div class="form-group">
          <label class="form-label">اسم مراجع الجودة (EQ Reviewer)</label>
          <input class="form-control" id="qr-reviewer" type="text" value="${Utils.escapeHtml(existing.eqrReviewerName || '')}" placeholder="يجب أن يكون شريكاً/مراجعاً مستقلاً عن فريق الارتباط">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">تاريخ المراجعة</label>
            <input class="form-control" id="qr-date" type="date" value="${existing.eqrDate ? existing.eqrDate.split('T')[0] : ''}">
          </div>
          <div class="form-group">
            <label class="form-label" style="display:flex;align-items:center;gap:8px;margin-top:22px;">
              <input type="checkbox" id="qr-independence" ${existing.independenceConfirmed ? 'checked' : ''}>
              تم تأكيد استقلالية مراجع الجودة عن فريق الارتباط
            </label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">قائمة التحقق</label>
          <div class="risk-proc-picker" style="max-height:260px;">
            ${EQR_CHECKLIST_ITEMS.map(item => `
              <label class="risk-proc-option">
                <input type="checkbox" class="qr-check" value="${item.id}" ${checklist[item.id] ? 'checked' : ''}>
                <span>${Utils.escapeHtml(item.text)}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">ملاحظات مراجع الجودة</label>
          <textarea class="form-control textarea-auto" id="qr-comments" rows="2">${Utils.escapeHtml(existing.reviewerComments || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label required">الاستنتاج</label>
          <select class="form-control" id="qr-conclusion">
            <option value="">— اختر —</option>
            ${Object.entries(EQR_CONCLUSION_LABELS).map(([k,v]) => `<option value="${k}" ${existing.eqrConclusion===k?'selected':''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>
    `;

    Utils.openModal('مراجعة جودة الارتباط (ISA 220 / ISQM 1)', body, `
      <button class="btn btn-primary" id="saveQRBtn">حفظ</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
    `, 'lg');

    document.getElementById('saveQRBtn').onclick = async () => {
      const eqrRequired = document.getElementById('qr-required').checked;
      let record = { clientId, eqrRequired };

      if (eqrRequired) {
        const conclusion = document.getElementById('qr-conclusion').value;
        if (!conclusion) { Utils.showToast('يرجى اختيار الاستنتاج', 'error'); return; }
        const newChecklist = {};
        document.querySelectorAll('.qr-check').forEach(el => { newChecklist[el.value] = el.checked; });
        record = {
          ...record,
          eqrReviewerName: document.getElementById('qr-reviewer').value.trim(),
          eqrDate: document.getElementById('qr-date').value || null,
          independenceConfirmed: document.getElementById('qr-independence').checked,
          checklist: newChecklist,
          reviewerComments: document.getElementById('qr-comments').value.trim(),
          eqrConclusion: conclusion
        };
      }

      if (existing.id) await AuditDB.put(AuditDB.STORES.QUALITY_REVIEW, { ...existing, ...record });
      else await AuditDB.add(AuditDB.STORES.QUALITY_REVIEW, record);
      Utils.closeModal();
      Utils.showToast('تم حفظ بيانات مراجعة الجودة', 'success');
      renderQuality();
    };
  }

  /* ---------------------------------------------------------
     Main render / tabs
     --------------------------------------------------------- */
  async function renderQuality() {
    const container = document.getElementById('qualityContent');
    if (!container) return;

    const clientId = App.getActiveClientId();
    if (!clientId) {
      container.innerHTML = Utils.noClientWarning('استعراض الجودة والاعتماد على الغير');
      return;
    }

    const isArchive = App.isArchiveMode();
    const readOnly = App.isEditingBlocked();

    const [components, reliance, qr] = await Promise.all([
      loadComponents(clientId),
      loadReliance(clientId),
      loadQualityReview(clientId)
    ]);

    container.innerHTML = `
      ${isArchive ? Utils.archiveBanner(App.getActiveYear(), App.isArchiveEditUnlocked()) : ''}
      <div class="tabs mb-4">
        <button class="tab-btn ${activeTab==='components'?'active':''}" data-tab="components" onclick="QualityModule.switchTab('components')">🏢 مكوّنات المجموعة (ISA 600)</button>
        <button class="tab-btn ${activeTab==='reliance'?'active':''}" data-tab="reliance" onclick="QualityModule.switchTab('reliance')">🔍 الاعتماد على الغير (ISA 610/620)</button>
        <button class="tab-btn ${activeTab==='eqr'?'active':''}" data-tab="eqr" onclick="QualityModule.switchTab('eqr')">✅ جودة الارتباط (ISA 220/ISQM1)</button>
      </div>
      <div id="qualityTabContent">
        ${activeTab === 'components' ? componentsTabHTML(components, readOnly)
          : activeTab === 'reliance' ? relianceTabHTML(reliance, readOnly)
          : qualityReviewTabHTML(qr, readOnly)}
      </div>
    `;
  }

  function switchTab(tab) {
    activeTab = tab;
    renderQuality();
  }

  return {
    renderQuality,
    switchTab,
    openComponentModal,
    deleteComponent,
    openRelianceModal,
    deleteReliance,
    openQualityReviewModal,
    // exposed for reports.js integration
    EQR_CHECKLIST_ITEMS,
    EQR_CONCLUSION_LABELS,
    loadComponents,
    loadReliance,
    loadQualityReview
  };
})();
