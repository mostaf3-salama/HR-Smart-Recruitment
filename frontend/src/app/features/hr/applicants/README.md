# Feature 4 — HR: Applicants & Interviews

> الجزء ده خاص بـ **mostafa**: المتقدمين وقرارات الـHR.
> الجزء التاني (**mahmoud**): جدولة/نتائج المقابلات + الـ Dashboard — في مجلد منفصل.

---

## 📁 الـ Structure

```
features/hr/
├── hr.routes.ts                     ← يجمع routes الجزئين (mostly shared)
└── applicants/                      ← mostafa (الملف ده كله)
    ├── applicants.routes.ts         ← Routes + providers بتاعة الجزء ده
    ├── README.md                    ← الملف ده
    ├── models/applicant.models.ts   ← الـ Models والـ types (المرجع الوحيد)
    ├── data/
    │   ├── applicants-api.ts        ← الـ Port (abstract + InjectionToken)
    │   ├── mock-applicants.api.ts   ← بيانات ديمو (احذفها لما الـ API يجهز)
    │   └── http-applicants.api.ts   ← الـ HTTP الحقيقي
    ├── components/status-actions/   ← أزرار Shortlist / Reject / Accept
    └── pages/
        ├── applicant-list/          ← /hr/jobs/:jobId/applicants
        └── application-details/     ← /hr/applications/:id
```

---

## ▶️ التشغيل (نسخة الديمو المستقلة)

```bash
cd frontend
npm install
npm start          # http://localhost:62758/
```

> المشروع ده دلوقتي **standalone** (scaffold رسمي من Angular CLI v22) عشان mostafa يجرّب شغله من غير ما يستنى حد.
> لما Feature 1 يعمل المشروع الرسمي، انسخ مجلد `src/app/features/hr/` جوه `<المشروع الرسمي>/src/app/features/hr/` وسجّل الـ routes.

---

## 🔌 التسجيل في `app.routes.ts` (بتاع dina & seleem)

`src/app/app.routes.ts` الحالي بيسجّلها بالظبط كده:

```ts
{
  path: 'hr',
  loadChildren: () => import('./features/hr/hr.routes').then((m) => m.HR_ROUTES),
}
```

وقت ما الـ guards تجهز ضيف `canActivate: [authGuard, hrGuard]` على نفس الـ route.

---

## 🧪 تجربة الـ States (Loading / Error / Empty)

من غير ما تعدّل كود:

| الرابط | الحالة |
|---|---|
| `http://localhost:62758/hr/jobs/1/applicants` | بيانات عادية (Loading أول 450ms) |
| `http://localhost:62758/hr/jobs/1/applicants?hrMock=error` | حالات الخطأ |
| `http://localhost:62758/hr/jobs/99/applicants` | Empty state (مفيش متقدمين) |

جرّب كمان البحث (`Angular`)، الفلترة بالحالة، والصفحة التانية `/hr/applications/1001`.

---

## 🔄 التبديل من Mock للـ API الحقيقي

ملف واحد بس: `applicants.routes.ts`

```ts
// providers: [{ provide: APPLICANTS_API, useClass: MockApplicantsApi }],
providers: [{ provide: APPLICANTS_API, useClass: HttpApplicantsApi }],
```

الـ Components مش هتتعدّل خالص — ده بالظبط اللي طلبه الملف: *كل HTTP Call يعدي من Service مش من Component*.

---

## 📡 الـ API Contract المطلوب من الـ Backend

| Method | Endpoint | ملاحظات |
|---|---|---|
| `GET` | `/api/hr/jobs/{jobId}/applicants?search=&status=` | مرتب بالـ `matchScore` DESC |
| `GET` | `/api/hr/applications/{id}` | MatchScore + ML Feedback + Skills + CV + History |
| `PATCH` | `/api/hr/applications/{id}/status` | body: `{ action: 'shortlist'\|'reject'\|'accept', note? }` |
| `GET` | `/api/hr/applications/{id}/cv` | يرجّع PDF (`application/pdf`) |

### ✅ حالة الباك إند (اتنفذت)

- `HrApplicantsController` + `HrInterviewsController` (route `/api/hr`) + migration `Feature4_HrWorkflow` — كل الـ endpoints فوق شغالة ومتجربة.
- التشغيل: SQL Server + `dotnet ef database update` من فولدر الـ solution، وبعدين شغّل الـ API.
- بعدها بدّل سطر الـ providers لـ `HttpApplicantsApi` في `applicants.routes.ts`.
- ملحوظة: الـ `Candidate` اتمدد بحقول الملف الشخصي (الاسم/الإيميل/المهارات/CV) من غير ما نمس أعمدة الـ ML.

---

## ✅ الـ Checklist بتاعي (mostafa)

- [x] `/hr/jobs/:jobId/applicants` — مرتبين بالـ Match Score تنازلي
- [x] فلترة بالحالة + بحث بالاسم/المهارات (debounced 300ms)
- [x] `/hr/applications/:id` — بياناته + Match Score + ML Feedback + المهارات المتطابقة
- [x] عرض/تحميل الـ CV (PDF)
- [x] تغيير الحالة: Shortlist / Reject / Accept + سجل الحالة
- [x] حالات Loading / Error / Empty
- [x] Responsive (الجدول بيبقى Cards تحت 860px)
- [ ] Validation إضافي (لاحظ إن تغيير الحالة معمول من الواجهة بس، أي validation تاني هيكون على الـ backend)
- [ ] ربط الـ `HttpApplicantsApi` (الـ endpoints جاهزة ومتجربة على API حقيقي — فاضل التبديل بس)
- [ ] استبدال الـ inline-confirm بـ `confirm-dialog` المشترك (بتاع Feature 1)
- [ ] استبدال الـ flash message بـ `Toast/Snackbar` المشترك (بتاع Feature 1)

---

## 🤝 اتفاقيات مع باقي الفريق

- مفيش أي تعديل في `core/` أو `shared/` — كل حاجة هنا تحت `features/hr/applicants/`.
- ألوان الـ CSS بتستخدم متغيرات (`--hr-primary`, `--hr-border`, …) بـ fallback، فهتشتغل مع ثيم Feature 1 من غير ما نكسر حاجة.
- Branch: `feature/4-hr-applicants` — PR + Review قبل الدمج.
