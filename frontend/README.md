# Smart Recruitment Platform — Frontend (Angular 22)

> واجهات المنصة كاملة: الأساس والهوية (Feature 1) + الوظائف (Feature 2) + جهة المرشح (Feature 3) + جهة الـ HR (Feature 4) — كلها مربوطة على الـ API الحقيقي، من غير Mock.

## 🧱 الهيكل

```
frontend/src/
├── environments/environment.ts   ← عنوان الـ API (مرة واحدة)
├── app/
│   ├── core/                     ← Feature 1: auth + guards + interceptors + layout
│   │   ├── models/ · services/ (auth, token, toast, loading)
│   │   ├── guards/ (auth, role) · interceptors/ (jwt, error, loading)
│   │   └── layout/ (navbar + sidebar حسب الدور)
│   ├── shared/                   ← مكونات + صفحات مشتركة
│   │   ├── components/ (confirm-dialog, toast, loader, empty-state, status-badge, score-bar)
│   │   └── pages/ (forbidden 403, not-found 404, home-redirect)
│   └── features/
│       ├── auth/                 ← login / register
│       ├── jobs/                 ← Feature 2: تصفح + تفاصيل + إدارة + فورم
│       ├── candidate/            ← Feature 3: بروفايل + تقديم + طلباتي + تفاصيل
│       └── hr/                   ← Feature 4: متقدمين + مقابلات + لوحة
│           ├── applicants/ (Mostafa) · interviews/ + dashboard/ (mahmoud)
```

## ✅ التغطية حسب التقسيم

| التاسك | Routes | الحالة |
|---|---|---|
| Feature 1 — Core+Auth | `/auth/login` `/auth/register` `/forbidden` 404 + guards + interceptors + layout | ✅ |
| Feature 2 — Jobs (omar) | `/jobs` (بحث/فلترة/صفحات) `/jobs/:id` (+Apply) | ✅ |
| Feature 2 — Jobs (amgad) | `/hr/jobs` (جدول + عدد المتقدمين) `/hr/jobs/new` `/hr/jobs/:id/edit` + فتح/غلق/حذف | ✅ |
| Feature 3 — (samy) | `/candidate/profile` (فورم ML + رفع PDF بتقدم) `/jobs/:id/apply` (يمنع التكرار) | ✅ |
| Feature 3 — (ahmed) | `/candidate/applications` (فلترة) `/candidate/applications/:id` (timeline + المقابلة) | ✅ |
| Feature 4 — (mostafa) | `/hr/jobs/:jobId/applicants` (ترتيب Score + بحث) `/hr/applications/:id` + Shortlist/Reject/Accept + CV | ✅ |
| Feature 4 — (mahmoud) | `/hr/interviews` (قادمة/منتهية + جدولة + نتيجة + إلغاء) `/hr/dashboard` | ✅ |

> ملحوظة تنظيمية: صفحات 2 و3 اتنفذت هنا للربط الكامل، والملكية تفضل لفرقها الأصلية.

## 🔌 الربط بالباك

- كل HTTP يعدي من Service (port + InjectionToken لكل جزء) — مفيش `HttpClient` في الكومبوننتس.
- الـ dev proxy بيحول `/api` ← `http://localhost:5030` (الباك لازم يبقى شغال).
- الدخول: `admin@smartrecruitment.com` / `Admin@123456` (HR) أو سجّل مرشح جديد.
- نقاط تكامل حرجة مع الباك: رد الـ Login مغلف `{value,...}` · الدور في التوكن بصيغة URI طويلة · الـ 401 بترجع للوجن · مفيش تجديد صامت للتوكن (limitation في الباك).

## ▶️ التشغيل

```powershell
cd "D:\Mostafa\Project hr\frontend"
npm install   # أول مرة بس
npm start     # http://localhost:4200
```

## ⚠️ قواعد للي هيكمل (مهمة)

1. **Zoneless**: تحديث الشاشة بعد الردود غير المتزامنة محتاج `cdr.markForCheck()` للحقول العادية (الـ async pipe بيحدث نفسه).
2. مسارات الـ import النسبية حسب عمق الملف — البناء (`ng build`) هو الحكم.
3. أي تعديل في `core/` أو `shared/` بالاتفاق (بيأثر على الكل).
4. الـ Toast/Confirm المشتركين بدل أي رسائل محلية.

## 🔗 الباك

`D:\Mostafa\Project hr\HrRcurment-master\HrRcurment-master` — التفاصيل في `README.md` بتاعه.
