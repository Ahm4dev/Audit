/* ============================================================
   AuditPro - Audit Trail Module
   ------------------------------------------------------------
   سجل تدقيق كامل لكل التغييرات التي تجري على بيانات كل عميل.
   يُظهر من غيّر ماذا ومتى، مع إمكانية التصفية والتصدير.
   ============================================================ */

const AuditTrailModule = (() => {

  const ENTITY_LABELS = {
    workpaper:   'ورقة عمل',
    finding:     'ملاحظة',
    procedure:   'إجراء مراجعة',
    client:      'بيانات العميل',
    materiality: 'أهمية نسبية',
    planning:    'تخطيط',
    risk:        'خطر',
    attachment:  'مرفق',
    letter:      'مراسلة',
    going_concern: 'تقييم الاستمرارية',
    component:   'مكوّن مجموعة',
    reliance:    'اعتماد على عمل الغير',
    quality_review: 'مراجعة جودة الارتباط'
  };

  const ACTION_ICONS = {
    add:    { icon: '➕', color: 'var(--color-success)' },
    update: { icon: '✏️', color: 'var(--color-primary)' },
    delete: { icon: '🗑️', color: 'var(--color-danger)'  },
    approve:{ icon: '✅', color: 'var(--color-success)' },
    sign:   { icon: '🔏', color: 'var(--color-primary)' },
    review: { icon: '👁️', color: 'var(--color-accent)'  }
  };

  /** تسجيل حدث في سجل التدقيق (helper for other modules) */
  async function log(clientId, entity, entityId, action, oldVal = null, newVal = null) {
    try {
      await AuditDB.trailLog(clientId, entity, entityId, action, oldVal, newVal);
    } catch (e) {
      console.warn('Audit trail log failed', e);
    }
  }

  /** تسجيل حدث بسيط (بدون قيم قبل/بعد) */
  async function logSimple(clientId, entity, entityId, action) {
    return log(clientId, entity, entityId, action);
  }

  /** صفحة العرض الرئيسية */
  async function renderAuditTrail() {
    const container = document.getElementById('auditTrailContent');
    if (!container) return;

    const clientId = App.getActiveClientId();
    if (!clientId) {
      container.innerHTML = Utils.noClientWarning('سجل التدقيق');
      return;
    }

    const allEntries = await AuditDB.getByIndex(AuditDB.STORES.AUDIT_TRAIL, 'clientId', clientId);
    allEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const entityTypes = [...new Set(allEntries.map(e => e.entity))];

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">🔍 سجل التدقيق (${allEntries.length} حدث)</div>
          <div style="display:flex;gap:8px;">
            <select class="filter-select" id="trailEntityFilter" onchange="AuditTrailModule.filterTrail()">
              <option value="">كل الكيانات</option>
              ${entityTypes.map(e => `<option value="${e}">${ENTITY_LABELS[e] || e}</option>`).join('')}
            </select>
            <select class="filter-select" id="trailActionFilter" onchange="AuditTrailModule.filterTrail()">
              <option value="">كل الإجراءات</option>
              <option value="add">إضافة</option>
              <option value="update">تعديل</option>
              <option value="delete">حذف</option>
              <option value="approve">اعتماد</option>
              <option value="review">مراجعة</option>
            </select>
            <button class="btn btn-secondary btn-sm" onclick="AuditTrailModule.exportTrail()">📥 تصدير</button>
            <button class="btn btn-secondary btn-sm" onclick="AuditTrailModule.clearTrail()" style="color:var(--color-danger);">🗑️ مسح</button>
          </div>
        </div>
        <div class="card-body p-0" id="trailListContainer">
          ${renderTrailList(allEntries)}
        </div>
      </div>
    `;
  }

  function renderTrailList(entries) {
    if (entries.length === 0) {
      return `<div class="text-sm text-muted" style="padding:32px;text-align:center;">لا توجد أحداث مسجّلة بعد. تبدأ البيانات تظهر هنا تلقائياً بمجرد بدء العمل على الملف.</div>`;
    }

    // Group by day
    const grouped = {};
    entries.forEach(e => {
      const day = Utils.formatDate(e.timestamp);
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(e);
    });

    return Object.entries(grouped).map(([day, dayEntries]) => `
      <div class="trail-day-group">
        <div class="trail-day-header">${Utils.escapeHtml(day)}</div>
        ${dayEntries.map(e => {
          const ai = ACTION_ICONS[e.action] || { icon: '📝', color: 'var(--text-muted)' };
          const entityLabel = ENTITY_LABELS[e.entity] || e.entity;
          const time = new Date(e.timestamp).toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit' });

          let detail = '';
          if (e.newValue) {
            try {
              const nv = JSON.parse(e.newValue);
              const fields = Object.keys(nv).filter(k => !['id','clientId','createdAt','updatedAt'].includes(k));
              if (fields.length > 0) {
                detail = fields.slice(0,3).map(k => {
                  const val = String(nv[k] || '').substring(0, 40);
                  return val ? `<span class="chip" style="font-size:10px;">${Utils.escapeHtml(k)}: ${Utils.escapeHtml(val)}</span>` : '';
                }).filter(Boolean).join(' ');
              }
            } catch (ex) { /* ignore */ }
          }

          return `
            <div class="trail-entry">
              <div class="trail-icon" style="color:${ai.color};">${ai.icon}</div>
              <div class="trail-body">
                <div class="trail-title">
                  <strong>${Utils.escapeHtml(entityLabel)}</strong>
                  <span class="trail-action-badge" style="background:${ai.color}15;color:${ai.color};">
                    ${ACTION_LABELS[e.action] || e.action}
                  </span>
                </div>
                ${detail ? `<div class="trail-detail">${detail}</div>` : ''}
              </div>
              <div class="trail-time">${time}</div>
            </div>
          `;
        }).join('')}
      </div>
    `).join('');
  }

  const ACTION_LABELS = { add: 'إضافة', update: 'تعديل', delete: 'حذف', approve: 'اعتماد', sign: 'توقيع', review: 'مراجعة' };

  async function filterTrail() {
    const clientId = App.getActiveClientId();
    if (!clientId) return;
    const entityF = document.getElementById('trailEntityFilter')?.value || '';
    const actionF = document.getElementById('trailActionFilter')?.value || '';

    let entries = await AuditDB.getByIndex(AuditDB.STORES.AUDIT_TRAIL, 'clientId', clientId);
    if (entityF) entries = entries.filter(e => e.entity === entityF);
    if (actionF) entries = entries.filter(e => e.action === actionF);
    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const container = document.getElementById('trailListContainer');
    if (container) container.innerHTML = renderTrailList(entries);
  }

  async function exportTrail() {
    const clientId = App.getActiveClientId();
    if (!clientId) return;
    const entries = await AuditDB.getByIndex(AuditDB.STORES.AUDIT_TRAIL, 'clientId', clientId);
    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const csv = ['الوقت,الكيان,الإجراء,التفاصيل',
      ...entries.map(e => `"${e.timestamp}","${ENTITY_LABELS[e.entity] || e.entity}","${ACTION_LABELS[e.action] || e.action}","${(e.newValue||'').replace(/"/g,'""')}"`)
    ].join('\n');
    Utils.downloadText(csv, `audit-trail-client-${clientId}.csv`);
  }

  async function clearTrail() {
    const clientId = App.getActiveClientId();
    if (!clientId) return;
    Utils.confirmDialog('سيتم حذف كل سجلات التدقيق الخاصة بهذا العميل. لا يمكن التراجع عن هذا الإجراء. هل تريد المتابعة؟', async () => {
      const entries = await AuditDB.getByIndex(AuditDB.STORES.AUDIT_TRAIL, 'clientId', clientId);
      for (const e of entries) await AuditDB.delete(AuditDB.STORES.AUDIT_TRAIL, e.id);
      renderAuditTrail();
      Utils.showToast('تم مسح سجل التدقيق', 'success');
    });
  }

  return { renderAuditTrail, filterTrail, exportTrail, clearTrail, log, logSimple };
})();
