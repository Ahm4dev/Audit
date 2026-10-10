/* ============================================================
   AuditPro - Utility Functions
   Shared helpers: formatting, UI components, dates
   ============================================================ */

/* ---- Date helpers ---- */
function formatDate(isoString, includeTime = false) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d)) return '—';
  const opts = { year: 'numeric', month: '2-digit', day: '2-digit' };
  if (includeTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
  return d.toLocaleDateString('ar-SA-u-nu-latn', opts);
}

/* ---- Currencies ---- */
const CURRENCIES = {
  EGP: { code: 'EGP', label: 'جنيه مصري',    symbol: 'ج.م' },
  SAR: { code: 'SAR', label: 'ريال سعودي',   symbol: 'ر.س' },
  AED: { code: 'AED', label: 'درهم إماراتي', symbol: 'د.إ' },
  KWD: { code: 'KWD', label: 'دينار كويتي',  symbol: 'د.ك' },
  QAR: { code: 'QAR', label: 'ريال قطري',    symbol: 'ر.ق' },
  BHD: { code: 'BHD', label: 'دينار بحريني', symbol: 'د.ب' },
  OMR: { code: 'OMR', label: 'ريال عُماني',  symbol: 'ر.ع' },
  USD: { code: 'USD', label: 'دولار أمريكي', symbol: '$'   }
};
const DEFAULT_CURRENCY_CODE = 'EGP';

/** يحوّل رمز عملة (مثل EGP) إلى رمزها المختصر للعرض (مثل ج.م).
 *  إن لم يكن الرمز معروفاً، يُعاد كما هو (لدعم تمرير رمز جاهز مباشرة). */
function currencySymbol(codeOrSymbol) {
  if (!codeOrSymbol) return CURRENCIES[DEFAULT_CURRENCY_CODE].symbol;
  return (CURRENCIES[codeOrSymbol] && CURRENCIES[codeOrSymbol].symbol) || codeOrSymbol;
}

function currencyLabel(code) {
  return (CURRENCIES[code] && CURRENCIES[code].label) || code || '';
}

function formatCurrency(value, currency = CURRENCIES[DEFAULT_CURRENCY_CODE].symbol) {
  if (value === null || value === undefined || value === '') return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return num.toLocaleString('ar-SA-u-nu-latn', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ' + currency;
}

function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || value === '') return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return num.toLocaleString('ar-SA-u-nu-latn', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '—';
  return parseFloat(value).toFixed(decimals) + '%';
}

function timeAgo(isoString) {
  if (!isoString) return '';
  const now = new Date();
  const then = new Date(isoString);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60)    return 'منذ لحظات';
  if (diff < 3600)  return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 2592000) return `منذ ${Math.floor(diff / 86400)} يوم`;
  return formatDate(isoString);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function todayDisplay() {
  return new Date().toLocaleDateString('ar-SA-u-nu-latn', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

/* ---- String helpers ---- */
function initials(name) {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0];
  return parts[0][0] + parts[parts.length - 1][0];
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* تحويل صياغة **عريض** المبسّطة إلى <strong> بعد التعقيم (إصلاح خلل #11) */
function mdBoldToHtml(escapedStr) {
  if (!escapedStr) return '';
  return String(escapedStr).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function archiveBanner(year, unlocked = false) {
  if (unlocked) {
    return `
      <div class="warning-box mb-4" style="background:var(--color-danger-light,#fef2f2);color:var(--color-danger);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
        <div>هذه سنة مالية أرشيفية (<strong>${escapeHtml(String(year || ''))}</strong>) مفتوحة للتعديل <strong>استثناءً</strong> لهذه الجلسة فقط. كل تعديل ستقوم به مُسجَّل في سجل التدقيق. انقر شارة السنة في الشريط العلوي لإعادة القفل.</div>
      </div>
    `;
  }
  return `
    <div class="warning-box mb-4">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
      <div>أنت تستعرض سنة مالية أرشيفية سابقة (<strong>${escapeHtml(String(year || ''))}</strong>) — وضع قراءة فقط. للعودة للسنة الحالية، أو لفتح هذه السنة للتعديل استثنائياً، انقر على شارة السنة في الشريط العلوي.</div>
    </div>
  `;
}

/** يمنع أي عملية تعديل أثناء استعراض سنة مالية أرشيفية، ويُظهر تنبيهاً. يُستخدم كحارس دفاعي إضافي بجانب تعطيل الأزرار في الواجهة */
function blockIfArchive() {
  if (typeof App !== 'undefined' && App.isEditingBlocked && App.isEditingBlocked()) {
    showToast('لا يمكن التعديل أثناء استعراض سنة مالية أرشيفية. عُد للسنة الحالية، أو افتحها للتعديل استثنائياً من شارة السنة.', 'error');
    return true;
  }
  return false;
}

function truncate(str, max = 50) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

/* ---- Risk / status labels ---- */
const RISK_LABELS = { high: 'مرتفع', medium: 'متوسط', low: 'منخفض' };
const RISK_BADGES = { high: 'danger', medium: 'warning', low: 'success' };
const STATUS_LABELS = {
  active:       'نشط',
  completed:    'مكتمل',
  pending:      'معلق',
  'not-started': 'لم يبدأ',
  'in-progress': 'جارٍ التنفيذ',
  exception:    'استثناء',
  open:         'مفتوح',
  resolved:     'تم الحل',
  closed:       'مغلق'
};
const STATUS_BADGES = {
  active:       'success',
  completed:    'info',
  pending:      'warning',
  'not-started': 'neutral',
  'in-progress': 'warning',
  exception:    'danger',
  open:         'danger',
  resolved:     'success',
  closed:       'neutral'
};

function riskBadge(level) {
  const label = RISK_LABELS[level] || level;
  const cls   = RISK_BADGES[level] || 'neutral';
  return `<span class="badge badge-${cls}">${escapeHtml(label)}</span>`;
}

function statusBadge(status) {
  const label = STATUS_LABELS[status] || status;
  const cls   = STATUS_BADGES[status] || 'neutral';
  return `<span class="badge badge-${cls}">${escapeHtml(label)}</span>`;
}

function severityBadge(sev) {
  const map = { high: ['danger', 'عالية'], medium: ['warning', 'متوسطة'], low: ['info', 'منخفضة'], info: ['success', 'معلومة'] };
  const [cls, label] = map[sev] || ['neutral', sev];
  return `<span class="badge badge-${cls}">${label}</span>`;
}

/* ---- ISA reference chip ---- */
function isaRef(code) {
  return `<span class="isa-ref">ISA ${escapeHtml(code)}</span>`;
}

/* ---- Toast notifications ---- */
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
    <button class="toast-close" onclick="this.closest('.toast').remove()" aria-label="إغلاق التنبيه">×</button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ---- Modal ---- */
function openModal(title, bodyHtml, footerHtml = '', size = '') {
  const overlay  = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const titleEl  = document.getElementById('modalTitle');
  const bodyEl   = document.getElementById('modalBody');
  const footerEl = document.getElementById('modalFooter');

  titleEl.textContent  = title;
  bodyEl.innerHTML     = bodyHtml;
  footerEl.innerHTML   = footerHtml || '';

  modalBox.className = 'modal' + (size ? ' modal-' + size : '');
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

/* ---- Loading overlay ---- */
function showLoading(text = 'جارٍ التحميل...') {
  const el = document.getElementById('loadingOverlay');
  const txt = el.querySelector('.loading-text');
  if (txt) txt.textContent = text;
  el.style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

/* ---- Confirm dialog ---- */
function confirmDialog(message, onConfirm, onCancel = null, options = {}) {
  const confirmText = options.confirmText || 'تأكيد';
  const cancelText  = options.cancelText  || 'إلغاء';
  const confirmCls  = options.danger === false ? 'btn-primary' : 'btn-danger';
  const body = `
    <div style="text-align:center; padding: 16px 0;">
      <div style="font-size:48px; margin-bottom:16px;">⚠️</div>
      <p style="font-size:16px; color:var(--text-primary); margin-bottom:8px;">${escapeHtml(message)}</p>
    </div>
  `;
  const footer = `
    <button class="btn ${confirmCls}" id="confirmYes">${escapeHtml(confirmText)}</button>
    <button class="btn btn-secondary" id="confirmNo">${escapeHtml(cancelText)}</button>
  `;
  openModal('تأكيد الإجراء', body, footer);
  document.getElementById('confirmYes').onclick = () => { closeModal(); onConfirm(); };
  document.getElementById('confirmNo').onclick  = () => { closeModal(); if (onCancel) onCancel(); };
}

/* ---- Generate unique ID ---- */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ---- Accordion toggle ---- */
function toggleAccordion(element) {
  const item = element.closest('.accordion-item');
  if (!item) return;
  const isOpen = item.classList.contains('open');
  // Close all siblings
  const siblings = item.parentElement.querySelectorAll('.accordion-item');
  siblings.forEach(s => s.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

/* ---- Tab switching ---- */
function switchTab(tabsContainer, panelsContainer, targetId) {
  tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === targetId);
  });
  panelsContainer.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === targetId);
  });
}

/* ---- Download helpers ---- */
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---- Progress ring SVG ---- */
function progressRingSVG(percent, size = 120, stroke = 10, color = 'var(--color-primary)') {
  const r  = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}"
        fill="none" stroke="var(--border-color)" stroke-width="${stroke}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}"
        fill="none" stroke="${color}" stroke-width="${stroke}"
        stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
        stroke-linecap="round" style="transition:stroke-dashoffset 0.6s ease"/>
    </svg>
  `;
}

/* ---- No-client warning ---- */
function noClientWarning(action = 'المتابعة') {
  return `
    <div class="no-client-warning">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <h3>لم يتم اختيار عميل</h3>
      <p>يجب اختيار عميل من القائمة في الشريط الجانبي قبل ${escapeHtml(action)}</p>
      <button class="btn btn-accent mt-4" onclick="document.getElementById('activeClientSelect').focus()">
        اختيار عميل
      </button>
    </div>
  `;
}

/* ---- File reader helper ---- */
function readJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => { try { resolve(JSON.parse(e.target.result)); } catch(err) { reject(err); } };
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsText(file);
  });
}

/* ---- Print current page ---- */
function printCurrentPage() {
  window.print();
}

/* ---- Export page to PDF (via print dialog) ---- */
function exportToPDF() {
  const original = document.title;
  document.title = 'AuditPro - تقرير المراجعة';
  window.print();
  document.title = original;
}

/* ---- Debounce ---- */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ---- Empty state HTML ---- */
function emptyStateHTML(title, desc, btnLabel = '', btnAction = '') {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/>
        </svg>
      </div>
      <div class="empty-state-title">${escapeHtml(title)}</div>
      <div class="empty-state-desc">${escapeHtml(desc)}</div>
      ${btnLabel ? `<button class="btn btn-primary" onclick="${escapeHtml(btnAction)}">${escapeHtml(btnLabel)}</button>` : ''}
    </div>
  `;
}

/* ---- Export global Utils ---- */
window.Utils = {
  formatDate, formatCurrency, formatNumber, formatPercent,
  timeAgo, today, todayDisplay,
  initials, escapeHtml, mdBoldToHtml, truncate, archiveBanner, blockIfArchive,
  riskBadge, statusBadge, severityBadge, isaRef,
  showToast, openModal, closeModal,
  showLoading, hideLoading,
  confirmDialog, generateId,
  toggleAccordion, switchTab,
  downloadJSON, downloadText,
  progressRingSVG, noClientWarning,
  readJSONFile, printCurrentPage, exportToPDF,
  debounce, emptyStateHTML,
  RISK_LABELS, STATUS_LABELS,
  CURRENCIES, DEFAULT_CURRENCY_CODE, currencySymbol, currencyLabel
};
