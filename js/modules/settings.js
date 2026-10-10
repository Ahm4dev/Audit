/* ============================================================
   AuditPro - Settings Module
   Firm settings, backup/restore, import/export, data management
   ============================================================ */

const SettingsModule = (() => {

  /* ---- Render settings page ---- */
  async function renderSettings() {
    const container = document.getElementById('settingsContent');
    if (!container) return;

    const firmName    = await AuditDB.getSetting('firmName')    || '';
    const firmAddress = await AuditDB.getSetting('firmAddress') || '';
    const firmPhone   = await AuditDB.getSetting('firmPhone')   || '';
    const firmLicense = await AuditDB.getSetting('firmLicense') || '';
    const currency    = await AuditDB.getSetting('defaultCurrency') || 'EGP';
    const logo        = await AuditDB.getSetting('firmLogo')    || '';

    const clients    = await AuditDB.getAll(AuditDB.STORES.CLIENTS);
    const procedures = await AuditDB.getAll(AuditDB.STORES.PROCEDURES);
    const findings   = await AuditDB.getAll(AuditDB.STORES.FINDINGS);
    const workpapers = await AuditDB.getAll(AuditDB.STORES.WORKPAPERS);
    const activity   = await AuditDB.getAll(AuditDB.STORES.ACTIVITY);

    container.innerHTML = `
      <!-- Firm info -->
      <div class="settings-section">
        <div class="settings-section-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
          بيانات المكتب / الشركة
        </div>
        <div class="settings-section-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">اسم المكتب / الشركة</label>
              <input class="form-control" id="set-firmName" type="text" value="${Utils.escapeHtml(firmName)}" placeholder="مكتب المراجعة">
            </div>
            <div class="form-group">
              <label class="form-label">رقم الترخيص المهني</label>
              <input class="form-control" id="set-firmLicense" type="text" value="${Utils.escapeHtml(firmLicense)}" placeholder="CPA-2024-XXXX">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">شعار المكتب (يظهر في التقارير ونماذج الاعتماد)</label>
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
              ${logo ? `<img id="logo-preview" src="${logo}" style="max-height:56px;max-width:140px;border:1px solid var(--border-color);border-radius:6px;padding:4px;background:white;">` : `<div id="logo-preview" style="display:none;"></div>`}
              <label class="btn btn-secondary btn-sm" style="cursor:pointer;">
                📤 ${logo ? 'تغيير الشعار' : 'رفع الشعار'}
                <input type="file" accept="image/*" style="display:none;" onchange="SettingsModule.uploadLogo(this)">
              </label>
              ${logo ? `<button class="btn btn-text" style="color:var(--color-danger);" onclick="SettingsModule.removeLogo()">🗑️ حذف الشعار</button>` : ''}
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">العنوان</label>
              <input class="form-control" id="set-firmAddress" type="text" value="${Utils.escapeHtml(firmAddress)}" placeholder="المدينة - الحي - الشارع">
            </div>
            <div class="form-group">
              <label class="form-label">رقم الهاتف</label>
              <input class="form-control" id="set-firmPhone" type="tel" value="${Utils.escapeHtml(firmPhone)}" placeholder="0114001234">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">العملة الافتراضية للملفات الجديدة</label>
              <select class="form-control" id="set-currency">
                ${Object.values(Utils.CURRENCIES).map(c => `<option value="${c.code}" ${currency===c.code?'selected':''}>${c.label} (${c.code})</option>`).join('')}
              </select>
              <div class="form-helper">تُستخدم هذه العملة تلقائياً عند إنشاء عميل جديد فقط، ويمكن تغيير عملة كل ملف عميل بشكل مستقل من بياناته الأساسية</div>
            </div>
          </div>
          <button class="btn btn-primary" onclick="SettingsModule.saveFirmSettings()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/></svg>
            حفظ بيانات المكتب
          </button>
        </div>
      </div>

      <!-- Data storage -->
      <div class="settings-section">
        <div class="settings-section-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          تخزين البيانات
        </div>
        <div class="settings-section-body">
          ${buildStorageStatusHTML()}
        </div>
      </div>

      <!-- Database stats -->
      <div class="settings-section">
        <div class="settings-section-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          إحصاءات قاعدة البيانات
        </div>
        <div class="settings-section-body">
          <div class="grid grid-4">
            <div class="stat-card" style="--stat-color:var(--color-primary)">
              <div class="stat-card-label">عدد العملاء</div>
              <div class="stat-card-value">${clients.length}</div>
            </div>
            <div class="stat-card" style="--stat-color:var(--color-success)">
              <div class="stat-card-label">إجراءات المراجعة</div>
              <div class="stat-card-value">${procedures.length}</div>
            </div>
            <div class="stat-card" style="--stat-color:var(--color-warning)">
              <div class="stat-card-label">الملاحظات</div>
              <div class="stat-card-value">${findings.length}</div>
            </div>
            <div class="stat-card" style="--stat-color:var(--color-accent)">
              <div class="stat-card-label">أوراق العمل</div>
              <div class="stat-card-value">${workpapers.length}</div>
            </div>
          </div>
          <div class="info-box mt-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <div>
              يُنصح دائماً بتصدير نسخة احتياطية بصفة منتظمة من قسم "النسخ الاحتياطي والاستعادة" أدناه، مهما كانت طريقة التخزين المستخدمة.
            </div>
          </div>
        </div>
      </div>

      <!-- Backup and restore -->
      <div class="settings-section">
        <div class="settings-section-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          النسخ الاحتياطي والاستعادة
        </div>
        <div class="settings-section-body">
          <div class="info-box mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <div><strong>النسخة الاحتياطية الكاملة (موصى بها):</strong> ببساطة انسخ مجلد التخزين المُختار بالكامل (راجع قسم "تخزين البيانات" أعلاه) إلى مكان آخر — فهو يحتوي على البيانات والمرفقات معاً. تصدير/استيراد JSON أدناه يشمل البيانات الوصفية فقط (بدون ملفات المرفقات نفسها)، ويصلح كنسخة احتياطية سريعة أو لنقل البيانات لجهاز لا يحتوي على المرفقات.</div>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-name">تصدير النسخة الاحتياطية</div>
              <div class="setting-desc">تصدير بيانات النظام (بدون ملفات المرفقات) بصيغة JSON</div>
            </div>
            <button class="btn btn-primary" onclick="SettingsModule.exportBackup()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              تصدير Backup
            </button>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-name">استعادة النسخة الاحتياطية</div>
              <div class="setting-desc">استيراد نسخة احتياطية سابقة (JSON). سيتم استبدال جميع البيانات الحالية. ملاحظة: لن تُستعاد ملفات المرفقات إن لم تكن موجودة في مجلد attachments الحالي</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <input type="file" id="importFileInput" accept=".json" style="display:none"
                onchange="SettingsModule.importBackup(this)">
              <button class="btn btn-secondary" onclick="document.getElementById('importFileInput').click()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                استيراد Backup
              </button>
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-name">تصدير البيانات بصيغة JSON</div>
              <div class="setting-desc">تصدير منظّم لبيانات العملاء والمراجعة</div>
            </div>
            <button class="btn btn-secondary" onclick="SettingsModule.exportClients()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
              تصدير بيانات العملاء
            </button>
          </div>
        </div>
      </div>

      <!-- Appearance -->
      <div class="settings-section">
        <div class="settings-section-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          المظهر والعرض
        </div>
        <div class="settings-section-body">
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-name">الوضع الليلي / النهاري</div>
              <div class="setting-desc">التبديل بين وضع النهار والليل</div>
            </div>
            <button class="btn btn-secondary" id="themeToggleSetting" onclick="App.toggleTheme()">
              تبديل الوضع
            </button>
          </div>
        </div>
      </div>

      <!-- Danger zone -->
      <div class="settings-section" style="border-color:var(--color-danger);">
        <div class="settings-section-header" style="color:var(--color-danger);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          منطقة الخطر
        </div>
        <div class="settings-section-body">
          <div class="warning-box mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>العمليات التالية لا يمكن التراجع عنها. يُرجى إنشاء نسخة احتياطية أولاً.</span>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-name">إعادة تحميل البيانات التجريبية</div>
              <div class="setting-desc">إعادة تهيئة قاعدة البيانات ببيانات تجريبية (يحذف البيانات الحالية)</div>
            </div>
            <button class="btn btn-danger" onclick="SettingsModule.resetToDemo()">
              إعادة تحميل Demo
            </button>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-name">مسح جميع البيانات</div>
              <div class="setting-desc">حذف جميع بيانات النظام نهائياً (لا يمكن التراجع)</div>
            </div>
            <button class="btn btn-danger" onclick="SettingsModule.clearAllData()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              مسح الكل
            </button>
          </div>
        </div>
      </div>

      <!-- Activity log -->
      <div class="settings-section">
        <div class="settings-section-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
          سجل النشاط
        </div>
        <div class="settings-section-body">
          ${activity.length === 0
            ? '<p style="color:var(--text-muted);font-size:13px;">لا يوجد نشاط مسجّل</p>'
            : `<ul class="activity-feed">
                ${activity.slice(-20).reverse().map(a => `
                  <li class="activity-item">
                    <div class="activity-dot ${a.type==='success'?'success':a.type==='warning'?'warning':a.type==='error'?'danger':''}"></div>
                    <div class="activity-text">${Utils.escapeHtml(a.description)}</div>
                    <div class="activity-time">${Utils.timeAgo(a.timestamp)}</div>
                  </li>
                `).join('')}
              </ul>`
          }
        </div>
      </div>
    `;
  }

  /* ---- Storage status / controls ----
     إصلاح/تطوير: مكان حفظ ملف بيانات النظام أصبح قابلاً للتخصيص الكامل من
     هنا. تُحفظ البيانات كنص JSON عادي غير مشفّر داخل data/auditpro-data.json،
     وتُحفظ كل مرفقات أوراق العمل/الإجراءات/الملاحظات كملفات حقيقية في
     مجلد attachments منظَّم بمجلد فرعي خاص باسم كل سجل. نسخ المجلد المختار
     بالكامل لاحقاً (لجهاز آخر، قرص خارجي، أو خدمة سحابية) هو نسخة احتياطية/
     نقل كامل للملف بكل بياناته ومرفقاته معاً، دون الحاجة لتصدير/استيراد. */
  function buildStorageStatusHTML() {
    const mode = Storage.getMode();
    const supported = Storage.isSupported();

    if (mode === 'folder') {
      return `
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-name">📁 مرتبط بمجلد على جهازك: «${Utils.escapeHtml(Storage.getFolderName())}»</div>
            <div class="setting-desc">
              يحتوي هذا المجلد على:<br>
              • <code>clients/&lt;اسم الشركة&gt;-&lt;رقم&gt;.json</code> — ملف مستقل ومكتفٍ ذاتياً لكل شركة (${Storage.getClientCount()} ملف شركة حالياً). يمكنك نسخ ملف شركة إلى جهاز آخر أو حذفه من داخل هذا المجلد مباشرة، وسيتعرف عليه البرنامج تلقائياً في المرة القادمة دون أي إعداد إضافي.<br>
              • <code>settings.json</code> — إعدادات المكتب العامة (غير خاصة بشركة بعينها).<br>
              • <code>attachments/&lt;اسم السجل&gt;/</code> — مجلد مستقل لكل ورقة عمل/إجراء/ملاحظة، يحتوي ملفاتها المرفقة الحقيقية كما هي.<br>
              لعمل نسخة احتياطية كاملة أو نقل النظام بالكامل لجهاز آخر: انسخ هذا المجلد بالكامل (أو اضغطه كملف Zip). لنقل شركة واحدة فقط: انسخ ملف الشركة من <code>clients/</code> مع مجلداتها المقابلة داخل <code>attachments/</code>.
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="SettingsModule.changeStorageFolder()">تغيير المجلد</button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-name">التحول إلى تخزين المتصفح</div>
            <div class="setting-desc">غير موصى به إلا في حالات خاصة — بياناتك لن تنتقل تلقائياً عند نقل المجلد</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="SettingsModule.useBrowserStorageInstead()">استخدام تخزين المتصفح</button>
        </div>
      `;
    }

    if (supported) {
      return `
        <div class="warning-box mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div>يتم حالياً استخدام تخزين المتصفح (IndexedDB) وهو غير موصى به: هذه البيانات ليست ملفات حقيقية على جهازك، ولن تنتقل تلقائياً إذا نسخت مجلد البرنامج إلى جهاز آخر، وقد تُفقد عند مسح بيانات المتصفح. يُنصح بربط مجلد Data الآن.</div>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-name">📁 ربط مجلد حفظ البيانات (موصى به)</div>
            <div class="setting-desc">يُنصح بإنشاء مجلد جديد باسم <strong>Data</strong> بجانب مجلد البرنامج (audit-system) واختياره هنا، أو أي مجلد آخر تفضّله. سيُنشئ النظام بداخله ملفاً مستقلاً لكل شركة تلقائياً (مجلد clients) ومجلد مرفقات، ويستمر بالحفظ هناك تلقائياً من الآن فصاعداً.</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="SettingsModule.changeStorageFolder()">📁 اختيار/إنشاء مجلد Data</button>
        </div>
      `;
    }

    return `
      <div class="info-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div>متصفحك الحالي لا يدعم الربط المباشر بمجلد على الجهاز، لذلك يتم استخدام تخزين المتصفح (IndexedDB) تلقائياً. للحصول على بيانات تنتقل مع مجلد البرنامج، استخدم متصفح Chrome أو Edge. ويُنصح بعمل نسخة احتياطية دورية من القسم أدناه.</div>
      </div>
    `;
  }

  async function changeStorageFolder() {
    if (!Storage.isSupported()) {
      Utils.showToast('متصفحك لا يدعم ربط مجلد التخزين', 'error');
      return;
    }
    try {
      await Storage.connectFolder();

      // إصلاح خلل #12: فحص وجود بيانات مختلفة في المجلد المُختار قبل الاستبدال الصامت
      const existingInNewFolder = await Storage.load();
      const hasExistingData = existingInNewFolder && existingInNewFolder.stores &&
        Object.values(existingInNewFolder.stores).some(arr => Array.isArray(arr) && arr.length > 0);

      if (hasExistingData) {
        Utils.openModal('المجلد المُختار يحتوي على بيانات', `
          <p style="margin-bottom:12px;">المجلد «${Utils.escapeHtml(Storage.getFolderName())}» يحتوي بالفعل على ملف بيانات مراجعة مختلف عن بيانات النظام الحالية. ماذا تريد أن تفعل؟</p>
        `, `
          <button class="btn btn-secondary" id="folderLoadExistingBtn">تحميل بيانات هذا المجلد (تجاهل البيانات الحالية)</button>
          <button class="btn btn-danger" id="folderReplaceBtn">استبدالها ببيانات النظام الحالية</button>
          <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
        `);
        document.getElementById('folderReplaceBtn').onclick = async () => {
          const exported = await AuditDB.exportDB();
          await Storage.save(exported, { immediate: true, force: true });
          Utils.closeModal();
          Utils.showToast('تم ربط مجلد التخزين، واستبدال بياناته ببياناتك الحالية بنجاح', 'success');
          await renderSettings();
        };
        document.getElementById('folderLoadExistingBtn').onclick = () => {
          Utils.closeModal();
          window.location.reload();
        };
        return;
      }

      const exported = await AuditDB.exportDB();
      await Storage.save(exported, { immediate: true });
      Utils.showToast('تم ربط مجلد التخزين، ونُسخت بياناتك الحالية إليه بنجاح', 'success');
      await renderSettings();
    } catch (err) {
      if (err && err.name === 'AbortError') return; // المستخدم ألغى الاختيار
      Utils.showToast('تعذر ربط المجلد', 'error');
      console.error(err);
    }
  }

  /* ---- Logo management ---- */
  function uploadLogo(inputEl) {
    const file = inputEl.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) { Utils.showToast('الشعار لا يجب أن يتجاوز 512 كيلوبايت', 'error'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      await AuditDB.setSetting('firmLogo', reader.result);
      Utils.showToast('تم رفع الشعار بنجاح', 'success');
      const preview = document.getElementById('logo-preview');
      if (preview) { preview.src = reader.result; preview.style.display = ''; }
      // Re-render to show delete button
      await renderSettings();
    };
    reader.readAsDataURL(file);
  }

  async function removeLogo() {
    await AuditDB.setSetting('firmLogo', null);
    Utils.showToast('تم حذف الشعار', 'success');
    await renderSettings();
  }

  function useBrowserStorageInstead() {
    Utils.confirmDialog(
      'سيتم نسخ بياناتك الحالية إلى تخزين المتصفح بدلاً من المجلد المرتبط. هل تريد المتابعة؟',
      async () => {
        Storage.useBrowserStorage();
        await Storage.forgetHandle();
        const exported = await AuditDB.exportDB();
        await Storage.save(exported, { immediate: true });
        Utils.showToast('تم التحول إلى تخزين المتصفح', 'success');
        await renderSettings();
      }
    );
  }

  /* ---- Save firm settings ---- */
  async function saveFirmSettings() {
    const firmName    = document.getElementById('set-firmName')?.value.trim() || '';
    const firmAddress = document.getElementById('set-firmAddress')?.value.trim() || '';
    const firmPhone   = document.getElementById('set-firmPhone')?.value.trim() || '';
    const firmLicense = document.getElementById('set-firmLicense')?.value.trim() || '';
    const currency    = document.getElementById('set-currency')?.value || 'EGP';

    await AuditDB.setSetting('firmName',         firmName);
    await AuditDB.setSetting('firmAddress',       firmAddress);
    await AuditDB.setSetting('firmPhone',         firmPhone);
    await AuditDB.setSetting('firmLicense',       firmLicense);
    await AuditDB.setSetting('defaultCurrency',   currency);

    Utils.showToast('تم حفظ بيانات المكتب', 'success');
  }

  /* ---- Export full backup ---- */
  async function exportBackup() {
    Utils.showLoading('جارٍ تصدير النسخة الاحتياطية...');
    try {
      const data = await AuditDB.exportDB();
      const filename = `auditpro-backup-${new Date().toISOString().split('T')[0]}.json`;
      Utils.downloadJSON(data, filename);
      Utils.hideLoading();
      Utils.showToast('تم تصدير النسخة الاحتياطية', 'success');
    } catch(err) {
      Utils.hideLoading();
      Utils.showToast('خطأ في التصدير', 'error');
      console.error(err);
    }
  }

  /* ---- Import backup ---- */
  async function importBackup(input) {
    const file = input.files[0];
    if (!file) return;

    Utils.confirmDialog(
      'سيتم استبدال جميع البيانات الحالية بالنسخة المستوردة. هل أنت متأكد؟',
      async () => {
        Utils.showLoading('جارٍ استيراد النسخة الاحتياطية...');
        try {
          const data = await Utils.readJSONFile(file);
          await AuditDB.importDB(data);
          Utils.hideLoading();
          Utils.showToast('تم استيراد النسخة الاحتياطية بنجاح', 'success');
          setTimeout(() => location.reload(), 1500);
        } catch(err) {
          Utils.hideLoading();
          Utils.showToast('خطأ في الاستيراد: ' + err.message, 'error');
          console.error(err);
        }
      }
    );
    input.value = '';
  }

  /* ---- Export clients only ---- */
  async function exportClients() {
    const clients = await AuditDB.getAll(AuditDB.STORES.CLIENTS);
    const filename = `clients-export-${new Date().toISOString().split('T')[0]}.json`;
    Utils.downloadJSON({ clients, exportedAt: new Date().toISOString() }, filename);
    Utils.showToast('تم تصدير بيانات العملاء', 'success');
  }

  /* ---- Reset to demo data ---- */
  /** حذف كل ملفات/مجلدات المرفقات الحقيقية من القرص (تُستخدم قبل مسح/إعادة تهيئة شاملة) */
  async function purgeAllAttachmentFiles() {
    try {
      const attachments = await AuditDB.getAll(AuditDB.STORES.ATTACHMENTS);
      const folderKeys = [...new Set(attachments.map(a => a.folderKey).filter(Boolean))];
      for (const key of folderKeys) {
        await Storage.deleteAttachmentFolder(key);
      }
    } catch (err) {
      console.error('تعذر حذف بعض ملفات المرفقات', err);
    }
  }

  async function resetToDemo() {
    Utils.confirmDialog(
      'سيتم حذف جميع البيانات الحالية (بما فيها ملفات المرفقات) وإعادة تحميل البيانات التجريبية. هل أنت متأكد؟',
      async () => {
        Utils.showLoading('جارٍ إعادة التهيئة...');
        try {
          await purgeAllAttachmentFiles();
          for (const store of Object.values(AuditDB.STORES)) {
            await AuditDB.clear(store);
          }
          // ملاحظة: مسح مخزن SETTINGS هنا يُزيل علم hasSeededDemo أيضاً،
          // وهو المطلوب تماماً في هذه الحالة بالذات لإعادة الزرع التجريبي عمداً.
          await AuditDB.seed();
          Utils.hideLoading();
          Utils.showToast('تم إعادة تحميل البيانات التجريبية', 'success');
          setTimeout(() => location.reload(), 1500);
        } catch(err) {
          Utils.hideLoading();
          Utils.showToast('خطأ في إعادة التهيئة', 'error');
          console.error(err);
        }
      }
    );
  }

  /* ---- Clear all data ---- */
  async function clearAllData() {
    Utils.confirmDialog(
      '⚠ تحذير: سيتم حذف جميع البيانات (بما فيها ملفات المرفقات) نهائياً ولا يمكن التراجع. هل أنت متأكد تماماً؟',
      async () => {
        Utils.showLoading('جارٍ مسح البيانات...');
        try {
          await purgeAllAttachmentFiles();
          for (const store of Object.values(AuditDB.STORES)) {
            await AuditDB.clear(store);
          }
          // إصلاح خلل #3: تثبيت العلم فوراً بعد المسح كي لا يُعامَل النظام
          // عند إعادة التحميل كـ"تثبيت جديد فاضي" فتعود بيانات Audit Cafe التجريبية تلقائياً
          await AuditDB.setSetting('hasSeededDemo', true);
          Utils.hideLoading();
          Utils.showToast('تم مسح جميع البيانات', 'warning');
          setTimeout(() => location.reload(), 1500);
        } catch(err) {
          Utils.hideLoading();
          Utils.showToast('خطأ في المسح', 'error');
          console.error(err);
        }
      }
    );
  }

  return {
    renderSettings,
    saveFirmSettings,
    exportBackup,
    importBackup,
    exportClients,
    resetToDemo,
    clearAllData,
    changeStorageFolder,
    useBrowserStorageInstead,
    uploadLogo,
    removeLogo
  };
})();
