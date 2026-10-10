/* ============================================================
   AuditPro - Main Application Controller
   Routing, navigation, theme management, initialization
   ============================================================ */

const App = (() => {

  let currentPage     = 'dashboard';
  let activeClientId  = null;
  let activeFiscalYear = null;        // السنة المالية المُستعرَضة حالياً (إصلاح خلل #8)
  let activeClientCurrentYear = null; // السنة المالية "الحالية" الفعلية المسجّلة في ملف العميل
  let archiveEditOverride = null;     // {clientId, year} عند فتح سنة أرشيفية للتعديل استثنائياً لهذه الجلسة فقط
  let isDarkTheme     = false;

  /* ============================================================
     INITIALIZATION
     ============================================================ */
  async function init() {
    try {
      // Determine / connect the storage backend (folder on disk, or
      // browser storage as a fallback) before touching the database.
      await initStorageBackend();

      // Open / initialize the data store (بيانات غير مشفّرة دائماً)
      await AuditDB.open();

      // Seed demo data if empty
      await AuditDB.seed();

      // Load saved preferences
      const savedTheme    = await AuditDB.getSetting('theme');
      const savedClientId = await AuditDB.getSetting('activeClientId');
      const savedPage     = await AuditDB.getSetting('lastPage');

      // Apply theme
      if (savedTheme === 'dark') {
        enableDark();
      }

      // Initialize all modules (set up event listeners etc.)
      ClientsModule.init();

      // Restore active client
      if (savedClientId) {
        const client = await AuditDB.get(AuditDB.STORES.CLIENTS, savedClientId);
        if (client) {
          activeClientId = savedClientId;
          activeFiscalYear = client.financialYear || null;
          activeClientCurrentYear = client.financialYear || null;
        }
      }

      // Populate client selector
      await refreshClientSelect();

      // Navigate to last page or dashboard
      const startPage = savedPage && isValidPage(savedPage) ? savedPage : 'dashboard';
      navigateTo(startPage);

      // Setup global events
      setupEvents();

      // Wire search shortcut
      SearchModule.setupShortcut();

      // Check due dates and show reminders
      await checkDueDates();

      // Register PWA service worker
      registerServiceWorker();

      // Wire the saving indicator + show a one-time notice for unsupported browsers
      setupStorageIndicator();

      // Wire conflict detection (file edited from another tab/device)
      setupConflictHandling();

      console.log('✅ AuditPro initialized successfully');

    } catch(err) {
      console.error('❌ Initialization error:', err);
      Utils.showToast('حدث خطأ في تهيئة النظام. يُرجى إعادة تحميل الصفحة.', 'error', 8000);
    }
  }

  /* ============================================================
     STORAGE BACKEND SETUP
     يحدد مكان حفظ بيانات النظام: مجلد على الجهاز (موصى به) أو
     تخزين المتصفح كحل بديل، ويعرض شاشة الإعداد عند الحاجة فقط.
     ============================================================ */
  async function initStorageBackend() {
    if (!Storage.isSupported()) {
      // متصفح لا يدعم الربط بمجلد - استخدام تخزين المتصفح تلقائياً وبصمت
      Storage.useBrowserStorage();
      sessionFlags.browserFallbackNotice = true;
      return;
    }

    const result = await Storage.tryReconnect();
    if (result === 'connected') return; // تم الاتصال تلقائياً بصمت

    // نحتاج تفاعلاً من المستخدم (اختيار مجلد لأول مرة، أو إعادة منح إذن)
    await showStorageSetupScreen(result);
  }

  const sessionFlags = { browserFallbackNotice: false };

  function showStorageSetupScreen(state) {
    return new Promise((resolve) => {
      const overlay   = document.getElementById('storageSetupOverlay');
      const titleEl   = document.getElementById('storageSetupTitle');
      const descEl    = document.getElementById('storageSetupDesc');
      const connectBtn= document.getElementById('storageConnectBtn');
      const skipBtn   = document.getElementById('storageSkipBtn');
      const errorEl   = document.getElementById('storageSetupError');
      if (!overlay) { resolve(); return; }

      const isReconnect = state === 'needs-permission';

      titleEl.textContent = isReconnect
        ? 'إعادة الاتصال بمجلد البيانات'
        : 'أين تريد حفظ بيانات النظام؟';

      descEl.innerHTML = isReconnect
        ? `يطلب المتصفح إذنك مجدداً للوصول إلى مجلد البيانات «${Utils.escapeHtml(Storage.getFolderName())}» الذي اخترته سابقاً.`
        : `يُنصح بإنشاء مجلد جديد باسم <strong>Data</strong> بجانب مجلد البرنامج (audit-system) واختياره هنا — أو أي مجلد آخر تفضّله، ويمكنك تغييره لاحقاً في أي وقت من الإعدادات.
           <br><br>
           سيُنشئ النظام بداخله <strong>ملفاً مستقلاً لكل شركة</strong> تلقائياً (مجلد <code>clients</code>)، بحيث يمكنك لاحقاً نسخ ملف شركة من جهاز آخر ووضعه هناك، أو حذف ملف شركة من داخل المجلد مباشرة، وسيتعرف عليه البرنامج فوراً دون أي إعداد إضافي. تُحفظ البيانات كنص JSON عادي غير مشفّر.`;

      connectBtn.textContent = isReconnect ? '🔓 إعادة الاتصال' : '📁 اختيار/إنشاء مجلد Data';
      skipBtn.textContent = 'المتابعة بتخزين المتصفح مؤقتاً (غير موصى به)';
      skipBtn.style.display = isReconnect ? 'none' : '';

      errorEl.style.display = 'none';
      overlay.classList.remove('hidden');

      connectBtn.onclick = async () => {
        connectBtn.disabled = true;
        errorEl.style.display = 'none';
        try {
          if (isReconnect) {
            const ok = await Storage.reconnectWithPermission();
            if (!ok) throw new Error('PERMISSION_DENIED');
          } else {
            await Storage.connectFolder();
          }
          overlay.classList.add('hidden');
          resolve();
        } catch (err) {
          connectBtn.disabled = false;
          if (err && err.name === 'AbortError') return; // المستخدم ألغى نافذة الاختيار
          errorEl.textContent = isReconnect
            ? 'تعذّر الحصول على الإذن. يمكنك المتابعة بتخزين المتصفح، أو اختيار مجلد جديد من الإعدادات لاحقاً.'
            : 'حدث خطأ أثناء اختيار المجلد. حاول مرة أخرى.';
          errorEl.style.display = 'block';
          if (isReconnect) {
            Storage.useBrowserStorage();
            overlay.classList.add('hidden');
            resolve();
          }
        }
      };

      skipBtn.onclick = () => {
        Utils.confirmDialog(
          'تخزين المتصفح غير موصى به: بياناتك لن تكون ملفات حقيقية على جهازك، ولن تنتقل مع نسخ/نقل مجلد البرنامج، وقد تُفقد عند مسح بيانات المتصفح. هل تريد المتابعة به مؤقتاً على أي حال؟',
          () => {
            Storage.useBrowserStorage();
            sessionFlags.browserFallbackNotice = true;
            overlay.classList.add('hidden');
            resolve();
          },
          null,
          { confirmText: 'المتابعة بتخزين المتصفح', cancelText: 'رجوع' }
        );
      };
    });
  }

  /* ============================================================
     CONFLICT DETECTION
     تنبيه إن تم تعديل ملف البيانات من جهاز أو نافذة أخرى أثناء
     استخدامك للنظام، بدلاً من الكتابة فوق تعديلات الطرف الآخر بصمت.
     ============================================================ */
  function setupConflictHandling() {
    Storage.onConflict(() => {
      Utils.confirmDialog(
        'تم تعديل ملف البيانات من جهاز أو نافذة أخرى منذ آخر مرة قرأت فيها البيانات هنا. ' +
        'إذا تابعت الحفظ الآن فقد تُفقد التعديلات التي تمت في المكان الآخر. ' +
        'اضغط "إعادة التحميل" لتحميل أحدث نسخة (وستفقد تعديلاتك الحالية في هذه النافذة)، ' +
        'أو أغلق هذه الرسالة واستمر في العمل ثم احفظ يدوياً لاحقاً لإعادة المحاولة.',
        () => { window.location.reload(); },
        null,
        { confirmText: 'إعادة التحميل', cancelText: 'إغلاق' }
      );
    });
  }

  /* ============================================================
     DUE DATE REMINDERS
     يفحص النظام عند كل فتح مواعيد إصدار التقارير وانتهاء المسح
     الميداني لكل العملاء النشطين ويعرض تنبيهات في لوحة التحكم
     ============================================================ */
  async function checkDueDates() {
    const clients = await AuditDB.getAll(AuditDB.STORES.CLIENTS);
    const today   = new Date(); today.setHours(0, 0, 0, 0);
    const alerts  = [];

    clients.filter(c => c.status === 'active').forEach(c => {
      const check = (label, dateStr, warnDays = 14) => {
        if (!dateStr) return;
        const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
        const diff = Math.round((d - today) / 864e5);
        if (diff < 0)   alerts.push({ type: 'danger',  msg: `${c.name}: ${label} كان في ${Utils.formatDate(dateStr)} (تجاوز بـ${Math.abs(diff)} يوم)` });
        else if (diff <= warnDays) alerts.push({ type: 'warning', msg: `${c.name}: ${label} بعد ${diff} يوم (${Utils.formatDate(dateStr)})` });
      };
      check('موعد إصدار التقرير',        c.reportDate,       21);
      check('موعد انتهاء المسح الميداني', c.fieldworkEnd,      7);
      check('تاريخ موافقة العميل',        c.reportIssuedDate, 10);
    });

    if (alerts.length === 0) return;

    const banner = document.getElementById('dueDateBanner');
    if (!banner) return;
    banner.innerHTML = alerts.map(a => `
      <div class="due-date-alert due-date-${a.type}">
        <span>${a.type === 'danger' ? '🔴' : '🟡'}</span>
        <span>${Utils.escapeHtml(a.msg)}</span>
      </div>
    `).join('');
    banner.style.display = 'flex';
  }

  /* ============================================================
     PWA SERVICE WORKER REGISTRATION
     ============================================================ */
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          nw?.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              Utils.showToast('يوجد تحديث متاح. أعد تحميل الصفحة للحصول عليه.', 'info', 8000);
            }
          });
        });
      })
      .catch(e => console.warn('SW registration failed', e));
  }

  function setupStorageIndicator() {
    const dot   = document.getElementById('storageStatusDot');
    const label = document.getElementById('storageStatusLabel');

    function refreshLabel() {
      // Sidebar footer label
      if (label) {
        if (Storage.getMode() === 'folder') {
          label.textContent = `💾 ${Storage.getFolderName()}`;
          label.title = 'محفوظ في مجلد على جهازك';
        } else {
          label.textContent = '⚠️ تخزين المتصفح';
          label.title = 'غير موصى به - لم يتم ربط مجلد، والبيانات محفوظة داخل المتصفح فقط';
        }
      }
      // Topbar folder indicator
      const folderBtn   = document.getElementById('folderIndicatorBtn');
      const folderLabel = document.getElementById('folderIndicatorLabel');
      const isBrowserMode = Storage.getMode() !== 'folder';
      if (dot) dot.classList.toggle('browser-mode', isBrowserMode);
      if (folderBtn) folderBtn.classList.toggle('browser-mode', isBrowserMode);
      if (folderLabel) {
        if (Storage.getMode() === 'folder') {
          folderLabel.textContent = Storage.getFolderName();
          if (folderBtn) {
            folderBtn.title = `مجلد الحفظ: ${Storage.getFolderName()} — انقر لتغييره`;
            folderBtn.style.display = '';
          }
        } else {
          folderLabel.textContent = 'تخزين المتصفح ⚠️';
          if (folderBtn) {
            folderBtn.title = 'غير موصى به — انقر لربط مجلد حفظ حقيقي على جهازك';
            folderBtn.style.display = Storage.isSupported() ? '' : 'none';
          }
        }
      }
    }
    refreshLabel();

    Storage.onSavingChange((isSaving, error) => {
      if (!dot) return;
      dot.classList.toggle('saving', !!isSaving);
      dot.classList.toggle('save-error', !!error && !isSaving);
      dot.title = error ? 'فشل آخر عملية حفظ' : (isSaving ? 'جارٍ الحفظ...' : 'محفوظ');
    });

    if (Storage.getMode() === 'browser') {
      showBrowserStorageBanner();
    }
  }

  /** تنبيه دائم (وليس مجرد رسالة عابرة) عند العمل بتخزين المتصفح، حتى لا
      يغفل المستخدم عن أن بياناته ليست ملفات حقيقية محفوظة على جهازه بعد */
  function showBrowserStorageBanner() {
    const banner = document.getElementById('dueDateBanner');
    if (!banner) return;
    const notice = document.createElement('div');
    notice.className = 'due-date-alert due-date-warning';
    notice.innerHTML = `<span>⚠️</span><span>يتم الحفظ حالياً داخل تخزين المتصفح فقط (غير موصى به) — البيانات لن تنتقل مع نسخ مجلد البرنامج وقد تُفقد عند مسح بيانات المتصفح.
      <a href="#" onclick="App.navigateTo('settings'); return false;" style="text-decoration:underline;">اربط مجلد Data الآن</a></span>`;
    banner.prepend(notice);
    banner.style.display = 'flex';
  }

  /** تغيير مجلد الحفظ مباشرة من زر الأعلى — متاح دائماً بنقرة واحدة */
  async function changeFolderFromTopbar() {
    if (!Storage.isSupported()) {
      Utils.showToast('متصفحك لا يدعم ربط مجلد التخزين. استخدم Chrome أو Edge.', 'error');
      return;
    }
    try {
      await Storage.connectFolder();

      // إصلاح خلل #12: فحص ما إذا كان المجلد المُختار يحتوي بيانات مختلفة
      // مسبقاً قبل استبدالها صامتاً ببيانات الجلسة الحالية
      const existingInNewFolder = await Storage.load();
      const hasExistingData = existingInNewFolder && existingInNewFolder.stores &&
        Object.values(existingInNewFolder.stores).some(arr => Array.isArray(arr) && arr.length > 0);

      if (hasExistingData) {
        Utils.openModal('المجلد المُختار يحتوي على بيانات', `
          <p style="margin-bottom:12px;">المجلد «${Utils.escapeHtml(Storage.getFolderName())}» يحتوي بالفعل على ملف بيانات مراجعة مختلف عن الجلسة الحالية. ماذا تريد أن تفعل؟</p>
        `, `
          <button class="btn btn-secondary" id="folderLoadExistingBtn">تحميل بيانات هذا المجلد (تجاهل الجلسة الحالية)</button>
          <button class="btn btn-danger" id="folderReplaceBtn">استبدالها ببيانات الجلسة الحالية</button>
          <button class="btn btn-secondary" onclick="Utils.closeModal()">إلغاء</button>
        `);
        document.getElementById('folderReplaceBtn').onclick = async () => {
          const exported = await AuditDB.exportDB();
          await Storage.save(exported, { immediate: true, force: true });
          Utils.closeModal();
          Utils.showToast(`تم ربط مجلد "${Storage.getFolderName()}" واستبدال بياناته بنجاح`, 'success');
          setupStorageIndicator();
        };
        document.getElementById('folderLoadExistingBtn').onclick = () => {
          Utils.closeModal();
          window.location.reload(); // إعادة التحميل لقراءة بيانات المجلد الجديد من جديد بأمان
        };
        return;
      }

      // المجلد فارغ - نسخ البيانات الحالية إليه مباشرة دون أي خطر
      const exported = await AuditDB.exportDB();
      await Storage.save(exported, { immediate: true, force: true });
      Utils.showToast(`تم ربط مجلد "${Storage.getFolderName()}" بنجاح`, 'success');
      setupStorageIndicator();
    } catch (err) {
      if (err && err.name === 'AbortError') return; // المستخدم ألغى نافذة الاختيار
      Utils.showToast('تعذر ربط المجلد', 'error');
      console.error(err);
    }
  }

  /* ---- Valid pages ---- */
  function isValidPage(page) {
    return ['dashboard','clients','planning','materiality','programs','workpapers','quality','findings','reports','tools','letters','audit-trail','settings'].includes(page);
  }

  /* ============================================================
     NAVIGATION
     ============================================================ */
  function navigateTo(pageId) {
    if (!isValidPage(pageId)) return;

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show target page
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === pageId);
    });

    // Update breadcrumb
    const labels = {
      dashboard:   'لوحة التحكم',
      clients:     'إدارة العملاء',
      planning:    'التخطيط للمراجعة',
      materiality: 'الأهمية النسبية',
      programs:    'برامج المراجعة',
      workpapers:  'أوراق العمل',
      quality:      'الجودة والاعتماد على الغير',
      findings:    'الاستفسارات والاستثناءات',
      reports:      'التقارير',
      tools:        'أدوات المراجعة',
      letters:      'المراسلات',
      'audit-trail':'سجل التدقيق',
      settings:     'الإعدادات'
    };
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) breadcrumb.innerHTML = `<span>${labels[pageId] || pageId}</span>`;

    currentPage = pageId;

    // Save last page
    AuditDB.setSetting('lastPage', pageId).catch(() => {});

    // Render the page content
    renderPage(pageId);

    // Close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');
  }

  /* ---- Render page based on ID ---- */
  function renderPage(pageId) {
    switch(pageId) {
      case 'dashboard':   DashboardModule.renderDashboard();  break;
      case 'clients':     ClientsModule.loadClients();        break;
      case 'planning':    PlanningModule.renderPlanning();    break;
      case 'materiality': MaterialityModule.renderMateriality(); break;
      case 'programs':    ProgramsModule.renderPrograms();    break;
      case 'workpapers':  WorkpapersModule.renderWorkpapers();break;
      case 'quality':     QualityModule.renderQuality();      break;
      case 'findings':    FindingsModule.renderFindings();    break;
      case 'reports':      ReportsModule.renderReports();          break;
      case 'tools':        ToolsModule.renderTools();              break;
      case 'letters':      LettersModule.renderLetters();          break;
      case 'audit-trail':  AuditTrailModule.renderAuditTrail();   break;
      case 'settings':     SettingsModule.renderSettings();        break;
    }
  }

  /* ============================================================
     CLIENT MANAGEMENT
     ============================================================ */
  async function refreshClientSelect() {
    const select  = document.getElementById('activeClientSelect');
    if (!select) return;

    const clients = await AuditDB.getAll(AuditDB.STORES.CLIENTS);
    clients.sort((a, b) => a.name.localeCompare(b.name));

    select.innerHTML = '<option value="">— اختر عميلاً —</option>';
    clients.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.financialYear || '—'})`;
      if (c.id === activeClientId) opt.selected = true;
      select.appendChild(opt);
    });

    updateActiveClientDisplay();
  }

  async function setActiveClient(clientId) {
    activeClientId = clientId ? parseInt(clientId) : null;
    await AuditDB.setSetting('activeClientId', activeClientId);

    // عند تبديل العميل، نعود دائماً لعرض سنته المالية الحالية (لا سنة أرشيفية سابقة)
    archiveEditOverride = null;
    if (activeClientId) {
      const client = await AuditDB.get(AuditDB.STORES.CLIENTS, activeClientId);
      activeFiscalYear = client ? client.financialYear : null;
      activeClientCurrentYear = client ? client.financialYear : null;
    } else {
      activeFiscalYear = null;
      activeClientCurrentYear = null;
    }

    // Update selector
    const select = document.getElementById('activeClientSelect');
    if (select) select.value = activeClientId || '';

    updateActiveClientDisplay();

    // Re-render current page
    renderPage(currentPage);

    // Update findings badge
    await updateFindingsBadge();
  }

  function getActiveYear() {
    return activeFiscalYear;
  }

  /** true إذا كان العرض الحالي لسنة مالية أرشيفية سابقة (وليس سنة العميل الحالية) */
  function isArchiveMode() {
    if (!activeFiscalYear || !activeClientCurrentYear) return false;
    return String(activeFiscalYear) !== String(activeClientCurrentYear);
  }

  /** تبديل السنة المالية المُستعرَضة لنفس العميل النشط دون تغييره (إصلاح خلل #8) */
  function setActiveYear(year) {
    activeFiscalYear = year ? String(year) : null;
    archiveEditOverride = null; // أي تبديل سنة يُلغي الفتح الاستثنائي السابق تلقائياً لتفادي نسيانه مفعّلاً
    updateActiveClientDisplay();
    renderPage(currentPage);
  }

  /** true إذا كان التعديل مسموحاً فعلياً (السنة الحالية، أو سنة أرشيفية فُتحت استثنائياً) */
  function isEditingBlocked() {
    if (!isArchiveMode()) return false;
    if (archiveEditOverride &&
        archiveEditOverride.clientId === activeClientId &&
        String(archiveEditOverride.year) === String(activeFiscalYear)) {
      return false; // مفتوحة استثنائياً للتعديل لهذه الجلسة
    }
    return true;
  }

  function isArchiveEditUnlocked() {
    return isArchiveMode() && !isEditingBlocked();
  }

  /** فتح السنة الأرشيفية الحالية للتعديل استثنائياً، بعد تأكيد صريح، مع تسجيل الأمر في سجل التدقيق للشفافية */
  function unlockArchiveYearForEditing() {
    if (!activeClientId || !activeFiscalYear) return;
    Utils.confirmDialog(
      `أنت على وشك فتح سنة مالية أرشيفية مُغلَقة (${activeFiscalYear}) للتعديل استثنائياً. سيُسجَّل هذا الإجراء في سجل التدقيق. هل تريد المتابعة؟`,
      async () => {
        archiveEditOverride = { clientId: activeClientId, year: activeFiscalYear };
        await AuditDB.trailLog(activeClientId, 'client', activeClientId, 'update', null,
          { note: `فتح السنة المالية الأرشيفية ${activeFiscalYear} للتعديل استثنائياً` });
        Utils.showToast(`تم فتح سنة ${activeFiscalYear} للتعديل استثنائياً لهذه الجلسة`, 'warning');
        updateActiveClientDisplay();
        renderPage(currentPage);
      },
      null,
      { confirmText: 'فتح للتعديل', danger: true }
    );
  }

  /** إعادة قفل السنة الأرشيفية (إلغاء الفتح الاستثنائي) دون الحاجة لتبديل السنة */
  function relockArchiveYear() {
    archiveEditOverride = null;
    Utils.showToast('تمت إعادة قفل السنة الأرشيفية', 'info');
    updateActiveClientDisplay();
    renderPage(currentPage);
  }

  /** نافذة تبديل/أرشفة السنوات المالية لعرض سنوات سابقة أو بدء سنة جديدة */
  async function openYearSwitcher() {
    if (!activeClientId) return;
    const client = await AuditDB.get(AuditDB.STORES.CLIENTS, activeClientId);
    if (!client) return;
    const years = await AuditDB.getAvailableYears(activeClientId);
    const unlocked = isArchiveEditUnlocked();

    const body = `
      <p class="text-sm text-muted mb-3">العميل: <strong>${Utils.escapeHtml(client.name)}</strong> — السنة المالية الحالية: <strong>${Utils.escapeHtml(client.financialYear || '—')}</strong></p>
      <div class="year-switch-list" style="display:flex;flex-direction:column;gap:6px;">
        ${years.map(y => `
          <button type="button" class="btn ${String(y) === String(activeFiscalYear) ? 'btn-primary' : 'btn-secondary'} btn-sm" style="justify-content:space-between;display:flex;" onclick="App.setActiveYear('${y}');Utils.closeModal();">
            <span>سنة ${Utils.escapeHtml(String(y))}</span>
            ${String(y) === String(client.financialYear) ? '<span class="text-xs">(الحالية)</span>' : '<span class="text-xs">(أرشيف - قراءة فقط)</span>'}
          </button>
        `).join('')}
      </div>
      ${isArchiveMode() ? `
        <div class="warning-box mt-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div>
            ${unlocked
              ? 'هذه السنة مفتوحة للتعديل استثنائياً لهذه الجلسة. أي تغيير ستقوم به سيُسجَّل في سجل التدقيق.'
              : 'أنت تستعرض سنة أرشيفية بوضع قراءة فقط. يمكنك فتحها للتعديل استثنائياً إذا احتجت تصحيح خطأ في ملف مُغلَق (يُسجَّل ذلك في سجل التدقيق).'}
          </div>
        </div>
        <button type="button" class="btn ${unlocked ? 'btn-secondary' : 'btn-danger'} btn-sm mt-2" style="width:100%;"
          onclick="${unlocked ? 'App.relockArchiveYear()' : 'App.unlockArchiveYearForEditing()'};Utils.closeModal();">
          ${unlocked ? '🔒 إعادة القفل (إيقاف وضع التعديل الاستثنائي)' : '🔓 فتح هذه السنة للتعديل استثنائياً'}
        </button>
      ` : ''}
    `;
    const footer = `
      <button class="btn btn-primary" onclick="Utils.closeModal();ClientsModule.startNewEngagementYearPrompt(${activeClientId});">📅 بدء سنة مراجعة جديدة</button>
      <button class="btn btn-secondary" onclick="Utils.closeModal()">إغلاق</button>
    `;
    Utils.openModal('السنوات المالية لهذا العميل', body, footer, 'lg');
  }

  async function updateActiveClientDisplay(clientData = null) {
    const infoEl    = document.getElementById('activeClientInfo');
    const nameEl    = document.getElementById('activeClientName');
    const yearEl    = document.getElementById('activeClientYear');

    if (!activeClientId) {
      if (infoEl) infoEl.style.display = 'none';
      return;
    }

    let client = clientData;
    if (!client) {
      client = await AuditDB.get(AuditDB.STORES.CLIENTS, activeClientId);
    }

    if (client) {
      activeClientCurrentYear = client.financialYear || null;
      if (infoEl) infoEl.style.display = 'flex';
      if (nameEl) nameEl.textContent = Utils.truncate(client.name, 30);
      if (yearEl) {
        const isArchive = activeFiscalYear && String(activeFiscalYear) !== String(client.financialYear);
        const unlocked  = isArchive && isArchiveEditUnlocked();
        yearEl.textContent = [activeFiscalYear || client.financialYear, client.currency || Utils.DEFAULT_CURRENCY_CODE].filter(Boolean).join(' • ') + (unlocked ? ' 🔓' : isArchive ? ' 🗂️' : '');
        yearEl.title = unlocked
          ? 'سنة أرشيفية مفتوحة للتعديل استثنائياً لهذه الجلسة — انقر لإعادة القفل'
          : isArchive ? 'تستعرض سنة مالية أرشيفية سابقة (قراءة فقط) — انقر للتبديل' : 'انقر لاستعراض سنة مالية أخرى أو بدء سنة جديدة';
        yearEl.classList.toggle('client-year-badge-archive', !!isArchive && !unlocked);
        yearEl.classList.toggle('client-year-badge-unlocked', !!unlocked);
      }
    } else {
      if (infoEl) infoEl.style.display = 'none';
    }
  }

  function getActiveClientId() {
    return activeClientId;
  }

  async function updateFindingsBadge() {
    const badge = document.getElementById('findingsBadge');
    if (!badge) return;

    if (!activeClientId) {
      badge.textContent = '0';
      badge.style.display = 'none';
      return;
    }

    const findings = await AuditDB.getByClientYear(AuditDB.STORES.FINDINGS, activeClientId, activeFiscalYear);
    const open = findings.filter(f => f.status === 'open').length;
    badge.textContent = open;
    badge.dataset.count = open;
    badge.style.display = open > 0 ? '' : 'none';
  }

  /* ============================================================
     THEME
     ============================================================ */
  function enableDark() {
    document.getElementById('app-body').className = 'theme-dark';
    isDarkTheme = true;
    const icon  = document.getElementById('themeIcon');
    const label = document.getElementById('themeLabel');
    if (icon) icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
    if (label) label.textContent = 'الوضع النهاري';
  }

  function enableLight() {
    document.getElementById('app-body').className = 'theme-light';
    isDarkTheme = false;
    const icon  = document.getElementById('themeIcon');
    const label = document.getElementById('themeLabel');
    if (icon) icon.innerHTML = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
    if (label) label.textContent = 'الوضع الليلي';
  }

  function toggleTheme() {
    if (isDarkTheme) {
      enableLight();
      AuditDB.setSetting('theme', 'light').catch(() => {});
    } else {
      enableDark();
      AuditDB.setSetting('theme', 'dark').catch(() => {});
    }
  }

  /* ============================================================
     SIDEBAR
     ============================================================ */
  function toggleSidebar() {
    const sidebar     = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    if (!sidebar) return;

    const isCollapsed = sidebar.classList.toggle('collapsed');
    if (mainContent) mainContent.classList.toggle('sidebar-collapsed', isCollapsed);
    AuditDB.setSetting('sidebarCollapsed', isCollapsed).catch(() => {});
  }

  function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('mobile-open');
  }

  /* ============================================================
     EVENT SETUP
     ============================================================ */
  function setupEvents() {
    // Sidebar navigation
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        navigateTo(item.dataset.page);
      });
    });

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);

    const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
    if (mobileSidebarToggle) mobileSidebarToggle.addEventListener('click', toggleMobileSidebar);

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    // Client selector
    const clientSelect = document.getElementById('activeClientSelect');
    if (clientSelect) {
      clientSelect.addEventListener('change', async e => {
        const val = e.target.value;
        await setActiveClient(val ? parseInt(val) : null);
        if (val) {
          const client = await AuditDB.get(AuditDB.STORES.CLIENTS, parseInt(val));
          if (client) Utils.showToast(`تم اختيار: ${client.name}`, 'success');
        }
      });
    }

    // Modal close
    const modalClose   = document.getElementById('modalClose');
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalClose)   modalClose.addEventListener('click', Utils.closeModal);
    if (modalOverlay) {
      modalOverlay.addEventListener('click', e => {
        if (e.target === modalOverlay) Utils.closeModal();
      });
    }

    // Print button
    const printBtn = document.getElementById('printBtn');
    if (printBtn) printBtn.addEventListener('click', Utils.printCurrentPage);

    // Export PDF button
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', Utils.exportToPDF);

    // Add client button in sidebar (if any)
    const addClientBtn = document.getElementById('addClientBtn');
    if (addClientBtn) addClientBtn.addEventListener('click', ClientsModule.openAddModal);

    // Add finding button
    const addFindingBtn = document.getElementById('addFindingBtn');
    if (addFindingBtn) addFindingBtn.addEventListener('click', () => FindingsModule.openAddModal());

    // ESC key closes modal
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const overlay = document.getElementById('modalOverlay');
        if (overlay && overlay.style.display !== 'none') Utils.closeModal();
      }
    });

    // Click outside sidebar on mobile
    document.addEventListener('click', e => {
      const sidebar = document.getElementById('sidebar');
      const mobileBtn = document.getElementById('mobileSidebarToggle');
      if (sidebar && sidebar.classList.contains('mobile-open')) {
        if (!sidebar.contains(e.target) && e.target !== mobileBtn) {
          sidebar.classList.remove('mobile-open');
        }
      }
    });

    // Restore sidebar collapsed state
    AuditDB.getSetting('sidebarCollapsed').then(collapsed => {
      if (collapsed) {
        const sidebar     = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        if (sidebar)     sidebar.classList.add('collapsed');
        if (mainContent) mainContent.classList.add('sidebar-collapsed');
      }
    }).catch(() => {});
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */
  return {
    init,
    navigateTo,
    setActiveClient,
    getActiveClientId,
    getActiveYear,
    setActiveYear,
    isArchiveMode,
    isEditingBlocked,
    isArchiveEditUnlocked,
    unlockArchiveYearForEditing,
    relockArchiveYear,
    openYearSwitcher,
    refreshClientSelect,
    updateActiveClientDisplay,
    updateFindingsBadge,
    toggleTheme,
    toggleSidebar,
    toggleMobileSidebar,
    changeFolderFromTopbar
  };

})();

/* ============================================================
   BOOT - Start the application when DOM is ready
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
