# النشر على GitHub Pages

هذا المجلد كله هو جذر المستودع. لا تغيّر أسماء المجلدات ولا تنقل `libs/`.

## 1) إنشاء المستودع ورفعه (من سطر الأوامر)
> لا تستخدم "Upload files" في موقع GitHub: المجلد فيه أكثر من 200 ملف والواجهة تقبل 100 ملف فقط في المرة.

```
cd doc-rebuilder-github
git init -b main
git add .
git commit -m "Doc Rebuilder v2.2"
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```
بديل بلا سطر أوامر: برنامج **GitHub Desktop** (Add local repository ثم Publish).

## 2) تفعيل Pages
Settings → Pages → Source: **Deploy from a branch** → Branch: `main` / `(root)` → Save.
بعد دقيقة أو دقيقتين يظهر الرابط: `https://USERNAME.github.io/REPO/`

المستودع يجب أن يكون **Public** في الحسابات المجانية.

## 3) التحقق
افتح الرابط. الشارة في أعلى الصفحة يجب أن تقول «الملفات والمكتبات محلية بالكامل».
إن قالت غير ذلك فمجلد `libs/` لم يُرفع كاملًا.

## تحديث لاحق
`git add . && git commit -m "update" && git push`
