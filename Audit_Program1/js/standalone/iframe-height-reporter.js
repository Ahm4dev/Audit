/* ============================================================
   iframe Height Reporter
   يُرسل الارتفاع الحقيقي للصفحة الأم لضبط ارتفاع iframe تلقائياً
   ============================================================ */
(function () {
  'use strict';

  function sendHeight() {
    var h = Math.max(
      document.body ? document.body.scrollHeight : 0,
      document.documentElement ? document.documentElement.scrollHeight : 0,
      document.body ? document.body.offsetHeight : 0,
      document.documentElement ? document.documentElement.offsetHeight : 0
    );

    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(
          { iframeHeight: h, frameHeight: h, type: 'resize' },
          '*'
        );
      } catch (e) { /* ignore */ }
    }
  }

  // عند التحميل الكامل
  window.addEventListener('load', sendHeight);

  // عند تغيير حجم النافذة
  window.addEventListener('resize', function () {
    clearTimeout(window.__hTimer);
    window.__hTimer = setTimeout(sendHeight, 120);
  });

  // عند تغيير DOM (محتوى ديناميكي)
  if (window.MutationObserver) {
    var mo = new MutationObserver(function () {
      clearTimeout(window.__hTimer);
      window.__hTimer = setTimeout(sendHeight, 200);
    });
    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });
  }

  // إرسال دوري احتياطي (كل ثانية) للتعامل مع الصور البطيئة
  setInterval(sendHeight, 1000);

  // إرسال فوري
  sendHeight();
})();
