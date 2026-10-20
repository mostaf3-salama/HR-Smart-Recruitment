# Feature 4 — mahmoud: المقابلات والـ Dashboard

> الجزء ده خاص بـ **mahmoud**. جزء **mostafa** (المتقدمين وقرارات الـHR) في `../applicants/README.md`.

---

## 📁 الـ Structure

```
features/hr/
├── hr.routes.ts                  ← يجمع routes الجزئين
├── interviews/                    ← المقابلات (mahmoud)
│   ├── interviews.routes.ts       ← Routes + providers (`/hr/interviews`)
│   ├── models/interview.models.ts ← الـ Models والـ types (المرجع الوحيد)
│   ├── data/
│   │   ├── interviews-api.ts      ← الـ Port (abstract + InjectionToken)
│   │   ├── mock-interviews.api.ts ← بيانات ديمو (احذفها لما الـ API يجهز)
│   │   └── http-interviews.api.ts ← الـ HTTP الحقيقي
│   └── pages/interview-list/      ← قادمة / منتهية + جدولة + تسجيل نتيجة + إلغاء
└── dashboard/                     ← لوحة الـ HR (mahmoud)
    ├── dashboard.routes.ts        ← Routes + providers (`/hr/dashboard`)
    ├── models/dashboard.models.ts
    ├── data/ (dashboard-api + mock + http)
    └── pages/dashboard/           ← كروت إحصائيات + المقابلات القادمة + المتقدمون حسب الحالة
```

---

## 🧪 تجربة الـ States (Loading / Error / Empty)

| الرابط | الحالة |
|---|---|
| `http://localhost:4200/hr/interviews` | 3 مقابلات قادمة |
| `http://localhost:4200/hr/interviews` + تبويب "منتهية" | 3 مقابلات (ناجح/راسب/ملغية) |
| `http://localhost:4200/hr/interviews?hrMock=error` | حالات الخطأ |
| `http://localhost:4200/hr/interviews?hrMock=empty` | Empty state |
| `http://localhost:4200/hr/interviews?applicationId=1001` | فورم الجدولة مفتوح ومتحدد عليه أحمد سامي (الـ deep-link من صفحة mostafa) |
| `http://localhost:4200/hr/dashboard` | اللوحة |

---

## 🔄 التبديل من Mock للـ API الحقيقي

ملف واحد لكل جزء (`interviews.routes.ts` / `dashboard.routes.ts`):

```ts
// providers: [{ provide: INTERVIEWS_API, useClass: MockInterviewsApi }],
providers: [{ provide: INTERVIEWS_API, useClass: HttpInterviewsApi }],
```

---

## 📡 الـ API Contract المطلوب من الـ Backend

| Method | Endpoint | ملاحظات |
|---|---|---|
| `GET` | `/api/hr/interviews?tab=upcoming\|past` | upcoming = Scheduled (مرتبة الأقرب أولاً) |
| `GET` | `/api/hr/applications?status=Shortlisted` | المرشحون المتاحون للجدولة |
| `POST` | `/api/hr/interviews` | body: `{ applicationId, type: 'HR'\|'Technical'\|'Final', scheduledAt, location? }` |
| `PATCH` | `/api/hr/interviews/{id}/result` | body: `{ result: 'Passed'\|'Failed'\|'Rescheduled', notes? }` |
| `DELETE` | `/api/hr/interviews/{id}` | إلغاء مقابلة مجدولة |
| `GET` | `/api/hr/dashboard` | `{ activeJobs, totalApplicants, shortlistedCount, upcomingInterviewsCount, acceptedCount, rejectedCount, upcomingInterviews[], applicantsByStatus[] }` |

### ✅ حالة الباك إند (اتنفذت)

- `HrInterviewsController` (route `/api/hr`) + جدول `Interviews` + migration `Feature4_HrWorkflow` — كل الـ endpoints فوق شغالة ومتجربة.
- التشغيل: SQL Server + `dotnet ef database update` من فولدر الـ solution، وبعدين شغّل الـ API.
- بعدها بدّل سطر الـ providers لـ `HttpInterviewsApi` / `HttpDashboardApi`.
- لو الـ backend اتغيّر، عدّل المابنج في **`http-interviews.api.ts`** و **`http-dashboard.api.ts`** بس.

---

## ✅ الـ Checklist بتاع mahmoud

- [x] `/hr/interviews` — تبويب قادمة / منتهية
- [x] جدولة مقابلة للـ Shortlisted: التاريخ والوقت + النوع (HR / Technical / Final) + المكان + Validation (معاد في المستقبل)
- [x] تسجيل النتيجة + Notes + القرار (Passed / Failed / Rescheduled) — والـ Rescheduled بيفتح فورم جدولة جديدة تلقائياً
- [x] إلغاء مقابلة مجدولة (بـ Confirm)
- [x] `/hr/dashboard` — الوظائف النشطة، المتقدمين (Shortlisted/مقبولين/مرفوضين)، المقابلات القادمة + المتقدمون حسب الحالة
- [x] حالات Loading / Error / Empty + Responsive
- [ ] ربط الـ `HttpInterviewsApi` / `HttpDashboardApi` (الـ endpoints جاهزة ومتجربة على API حقيقي — فاضل التبديل بس)
- [ ] استبدال الـ inline-confirm والـ flash message بالـ shared components بتاعة Feature 1
- [ ] Branch منفصل: `feature/4-hr-interviews` — PR + Review قبل الدمج

---

## 🤝 اتفاقيات مع باقي الفريق

- مفيش أي تعديل في `core/` أو `shared/` ولا في ملفات mostafa — كل حاجة هنا تحت `features/hr/interviews/` و `features/hr/dashboard/`.
- التنسيق مع mostafa: هو بيعمل Shortlist وانت بتكمل من الـ Shortlisted — والربط بين الصفحتين شغال بـ `?applicationId=`.
