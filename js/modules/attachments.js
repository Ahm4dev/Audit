/* ============================================================
   AuditPro - Attachments Module
   ------------------------------------------------------------
   وحدة مشتركة لإرفاق المستندات (صور، PDF، ملفات Office...) بأوراق
   العمل والإجراءات والملاحظات.

   تُحفظ الملفات الآن كملفات حقيقية على القرص (وليس كنص Base64
   مضمَّن داخل ملف بيانات النظام)، داخل مجلد مستقل يُنشأ تلقائياً
   باسم كل سجل (ورقة عمل / إجراء / ملاحظة) تحت:
     <مجلد التخزين المُختار>/attachments/<معرّف-واسم السجل>/

   بهذا الشكل يمكن عمل نسخة احتياطية كاملة (بيانات + مرفقات) بمجرد
   نسخ مجلد التخزين بالكامل، دون الحاجة لتصدير/استيراد منفصل لكل
   ملف. سجل المرفق في قاعدة البيانات يحتفظ فقط بالبيانات الوصفية
   (الاسم، النوع، الحجم، اسم المجلد) دون محتوى الملف نفسه.

   في حال كان المتصفح لا يدعم الربط بمجلد على القرص (Firefox مثلاً)،
   يعمل النظام تلقائياً بنفس الواجهة، لكن يخزّن الملفات كـ Blob داخل
   IndexedDB (مع نفس مفهوم "المجلد" كبادئة منطقية).
   ============================================================ */

const AttachmentsModule = (() => {

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 ميجابايت لكل ملف (لم تعد الملفات تُضمَّن داخل JSON)

  const containerId = (ownerType, ownerId) => `attachments-${ownerType}-${ownerId || 'new'}`;

  function fileIcon(mimeType) {
    if (!mimeType) return '📎';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📕';
    if (mimeType.includes('word')) return '📄';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    return '📎';
  }

  function formatSize(bytes) {
    if (bytes === undefined || bytes === null) return '';
    if (bytes < 1024) return `${bytes} بايت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
  }

  /** اسم مجلد ثابت وآمن لاستخدامه على نظام الملفات، يُبنى مرة واحدة فقط عند أول رفع */
  function buildFolderKey(ownerType, ownerId, label) {
    const clean = (label || '')
      .toString()
      .replace(/[\\/:*?"<>|]/g, ' ')   // إزالة رموز غير صالحة لاسم مجلد
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
    return `${ownerType}-${ownerId}${clean ? '-' + clean : ''}`;
  }

  /** إيجاد اسم المجلد الثابت الفعلي المُستخدَم لهذا السجل (إن وُجدت مرفقات سابقة له) */
  async function resolveFolderKey(ownerType, ownerId, label) {
    const items = await AuditDB.getByIndex(AuditDB.STORES.ATTACHMENTS, 'ownerId', ownerId);
    const existing = items.find(a => a.ownerType === ownerType && a.folderKey);
    return existing ? existing.folderKey : buildFolderKey(ownerType, ownerId, label);
  }

  /* ---- Placeholder markup to embed synchronously inside any form/view ---- */
  function placeholder(ownerType, ownerId) {
    return `<div class="attachments-section" id="${containerId(ownerType, ownerId)}">
      <div class="attachments-empty">جارٍ تحميل المرفقات...</div>
    </div>`;
  }

  /* ---- Build the full section HTML (async - reads from DB) ---- */
  async function renderSection(ownerType, ownerId, clientId, ownerLabel = '') {
    const items = ownerId ? await AuditDB.getByIndex(AuditDB.STORES.ATTACHMENTS, 'ownerId', ownerId) : [];
    const relevant = items.filter(a => a.ownerType === ownerType);
    const safeLabel = Utils.escapeHtml(ownerLabel);

    return `
      <div class="attachments-section" id="${containerId(ownerType, ownerId)}">
        <div class="attachments-header">
          <span class="form-label" style="margin:0;">📎 المرفقات (${relevant.length})</span>
          ${ownerId ? `
            <label class="btn btn-secondary btn-sm attachments-upload-btn">
              إرفاق ملف
              <input type="file" multiple style="display:none;"
                onchange="AttachmentsModule.handleUpload(this, '${ownerType}', ${ownerId}, ${clientId}, '${safeLabel}')">
            </label>
          ` : `<span class="text-xs text-muted">احفظ السجل أولاً لإضافة مرفقات</span>`}
        </div>
        ${relevant.length === 0
          ? `<div class="attachments-empty">لا توجد مرفقات بعد</div>`
          : `<div class="attachments-list">
              ${relevant.map(a => `
                <div class="attachment-item">
                  <span class="attachment-icon">${fileIcon(a.mimeType)}</span>
                  <div class="attachment-info">
                    <div class="attachment-name" title="${Utils.escapeHtml(a.fileName)}">${Utils.escapeHtml(a.fileName)}</div>
                    <div class="attachment-meta">${formatSize(a.size)} • ${Utils.formatDate(a.uploadedAt)}</div>
                  </div>
                  <div class="attachment-actions">
                    <button type="button" class="btn-icon" title="تنزيل" onclick="AttachmentsModule.download(${a.id})">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                    <button type="button" class="btn-icon" title="حذف" onclick="AttachmentsModule.remove(${a.id}, '${ownerType}', ${ownerId})">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>`
        }
      </div>
    `;
  }

  /** يُعيد رسم قسم المرفقات داخل حاويته الحالية في الـ DOM (بعد رفع/حذف ملف) */
  async function refreshSection(ownerType, ownerId, clientId, ownerLabel = '') {
    const el = document.getElementById(containerId(ownerType, ownerId));
    if (!el) return;
    const html = await renderSection(ownerType, ownerId, clientId, ownerLabel);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();
    el.replaceWith(wrapper.firstElementChild);
  }

  async function handleUpload(inputEl, ownerType, ownerId, clientId, ownerLabel = '') {
    const files = Array.from(inputEl.files || []);
    inputEl.value = '';
    if (files.length === 0) return;

    const folderKey = await resolveFolderKey(ownerType, ownerId, ownerLabel);

    let okCount = 0;
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        Utils.showToast(`الملف "${file.name}" أكبر من الحد المسموح (20 ميجابايت)`, 'error');
        continue;
      }
      try {
        await Storage.saveAttachmentFile(folderKey, file.name, file);
        await AuditDB.add(AuditDB.STORES.ATTACHMENTS, {
          clientId, ownerType, ownerId,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          folderKey,
          uploadedAt: new Date().toISOString()
        });
        okCount++;
      } catch (e) {
        console.error(e);
        Utils.showToast(`تعذر إرفاق الملف "${file.name}"`, 'error');
      }
    }
    if (okCount > 0) Utils.showToast(`تم إرفاق ${okCount} ملف بنجاح`, 'success');
    await refreshSection(ownerType, ownerId, clientId, ownerLabel);
  }

  async function remove(id, ownerType, ownerId) {
    Utils.confirmDialog('هل تريد حذف هذا المرفق؟', async () => {
      const att = await AuditDB.get(AuditDB.STORES.ATTACHMENTS, id);
      if (att && att.folderKey) {
        await Storage.deleteAttachmentFile(att.folderKey, att.fileName);
      }
      await AuditDB.delete(AuditDB.STORES.ATTACHMENTS, id);
      Utils.showToast('تم حذف المرفق', 'success');
      await refreshSection(ownerType, ownerId, att?.clientId);
    });
  }

  async function download(id) {
    const att = await AuditDB.get(AuditDB.STORES.ATTACHMENTS, id);
    if (!att) return;
    if (!att.folderKey) { Utils.showToast('تعذر العثور على الملف', 'error'); return; }
    const blob = await Storage.loadAttachmentFile(att.folderKey, att.fileName);
    if (!blob) { Utils.showToast('تعذر تحميل الملف من مجلد المرفقات', 'error'); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = att.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  async function countFor(ownerType, ownerId) {
    if (!ownerId) return 0;
    const items = await AuditDB.getByIndex(AuditDB.STORES.ATTACHMENTS, 'ownerId', ownerId);
    return items.filter(a => a.ownerType === ownerType).length;
  }

  /** عند حذف ورقة عمل/إجراء/ملاحظة بالكامل، تُحذف مرفقاتها (ملفاتها الحقيقية ومجلدها) معها لتفادي بيانات يتيمة */
  async function deleteAllFor(ownerType, ownerId) {
    const items = await AuditDB.getByIndex(AuditDB.STORES.ATTACHMENTS, 'ownerId', ownerId);
    const relevant = items.filter(a => a.ownerType === ownerType);
    if (relevant.length === 0) return;

    // كل مرفقات نفس السجل تتشارك نفس المجلد - يكفي حذفه مرة واحدة
    const folderKey = relevant.find(a => a.folderKey)?.folderKey;
    if (folderKey) await Storage.deleteAttachmentFolder(folderKey);

    for (const a of relevant) {
      await AuditDB.delete(AuditDB.STORES.ATTACHMENTS, a.id);
    }
  }

  return {
    placeholder,
    renderSection,
    refreshSection,
    handleUpload,
    remove,
    download,
    countFor,
    deleteAllFor
  };
})();
