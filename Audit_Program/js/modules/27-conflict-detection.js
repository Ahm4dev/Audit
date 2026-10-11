/* MEAP · Conflict-copy detection in the shared save folder */
'use strict';
/* ================= a18 · كشف نسخ التعارض في مجلد الحفظ المشترك =================
   (أُزيل الاتصال المباشر بخدمات Microsoft وGoogle) ================= */
const CONFLICT_RE=/conflicted copy|conflict(ed)?[ -]|\(\d+\)\.(json|jsonl)$|-(DESKTOP|LAPTOP|PC|MAC|WIN)[-\w]*\.(json|jsonl)$|\.~?(tmp|swp)$/i;
async function findSyncConflicts(limit){const out=[];const walk=async p=>{if(out.length>=(limit||50))return;for(const it of await STORE.list(p)){const q=p?p+'/'+it.name:it.name;if(/^_backups/.test(q))continue;if(it.kind==='directory')await walk(q);else if(CONFLICT_RE.test(it.name))out.push(q);if(out.length>=(limit||50))return}};try{await walk('')}catch(e){logErr('sync conflict scan',e,'warn')}return out}
function cloudHTML(){return `<div class="card"><h3 style="margin-top:0">مجلد حفظ مشترك ومزامنة الملفات</h3>
 <ol class="l small"><li>أنشئ مجلدًا مشتركًا للفريق (مثل «MEAP-Data») على وسيط مشترك أو جهاز مزامنة تعتمد عليه مؤسستك.</li><li>من «مجلد الحفظ» اختر هذا المجلد على كل جهاز. كل مستخدم يكتب في ملفات عمليات خاصة به فلا تتعارض الكتابة.</li><li>إذا ظهرت نسخ تعارض من تطبيق المزامنة (مثل «conflicted copy» أو اسم الجهاز في نهاية الملف) فسيُنبّهك البرنامج هنا.</li></ol>
 <div data-conflicts><p class="mut small">جارٍ فحص نسخ التعارض…</p></div></div>`}
