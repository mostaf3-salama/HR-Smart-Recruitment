# Smart Recruitment Platform — Backend (.NET 10)

> الباك إند بتاع منصة التوظيف الذكي: Auth + وظائف + جهة المرشح + جهة الـ HR (متقدمين/مقابلات/لوحة) + **✨ AI بيرشّح وظائف من الـ CV تلقائياً (Gemma عبر OpenRouter)**.

## 🧱 هيكل الـ Solution

```
HrSmartRecruitment.sln
├── HrSmartRecruitment/            ← Web API (Controllers, Program.cs, appsettings)
├── SmartRecruitment.Domain/       ← الكيانات + واجهات المستودعات
├── SmartRecruitment.Application/  ← DTOs + Services + Validators + Result wrappers
└── SmartRecruitment.Infrastucture/ ← DbContext + Migrations + Repositories + Jwt + Seeders
```

كل المشاريع `net8.0` + `Nullable enable`. ترتيب الاعتماد: `API → Infrastructure → Application → Domain`.

## ✅ اللي اتنفذ

### 1. Auth (`/api/Auth`)
| Method | Endpoint | ملاحظات |
|---|---|---|
| POST | `/Register` | حساب Candidate (الدور ثابت) |
| POST | `/Login` | يرجع `{ value: { accessToken, refreshToken, role, ... } }` ⚠️ مغلف بـ ResultData |
| POST | `/RefreshToken` | محتاج توكن ساري (limitation — مفيش تجديد صامت) |
| POST | `/forgotPassword` · `/resetPassword` | بالإيميل |
| POST | `/CreateHrByAdmin` · `/create-admin` | للأدمن فقط |

### 2. Jobs (`/api/Job`)
`GET` مفتوحة (قائمة/تفاصيل) · `POST/PUT/PATCH/DELETE` لـ HR/Admin.
الإضافات عن الأصل: **`IsActive`** حقيقي (الإنشاء active + `toggle-status` بيقلب فعلاً + راجع في الرد)، والقائمة الفاضية بترجع `[]` بدل خطأ.

### 3. Candidate (`/api/Candidate`, دور Candidate فقط)
- `GET/POST profile` — بيانات الـ ML + المهارات والنبذة (إنشاء/تعديل)
- `POST upload-cv` — PDF حتى 5MB على `wwwroot/uploads/cvs` (بيتسجل مساره على المرشح)
- `POST apply-job` — يمنع التكرار والتقديم على المقفولة
- `GET my-applications` + `GET my-applications/{id}` (بتحقق الملكية)

### 4. HR Applicants (`/api/hr`, قراءة مفتوحة/كتابة HR/Admin)
- `GET jobs/{jobId}/applicants?search=&status=` — مرتبة بالـ Match Score تنازلياً
- `GET applications?status=Shortlisted` — dropdown الجدولة
- `GET applications/{id}` — الملف الكامل (مهارات متطابقة/ناقصة محسوبة + ML + سجل + مقابلة + CV)
- `PATCH applications/{id}/status` — `{shortlist|reject|accept}` بقواعد انتقال + history
- `GET applications/{id}/cv` — تحميل الـ PDF
- `GET me` — هوية الـ HR (`hrId` اللي الفورم محتاجه)

### 5. Interviews + Dashboard (`/api/hr`)
- `GET interviews?tab=upcoming|past` + `GET interviews/{id}`
- `POST interviews` — للـ Shortlisted فقط (ينقل الطلب لـ Interview)
- `PATCH interviews/{id}/result` — Passed→Accepted ،Failed→Rejected ،Rescheduled→إلغاء
- `DELETE interviews/{id}` — إلغاء + إرجاع الطلب Shortlisted (يرجع 200 بالكائن)
- `GET dashboard` — الوظائف النشطة/المتقدمون/عدادات/القادمة/حسب الحالة

رحلة الطلب: `Submitted → Shortlisted → Interview → Accepted/Rejected` وكل حركة متسجلة في `ApplicationStatusHistory`.

### 6. ✨ AI CV → Job Recommendations (`/api/Candidate`) — الجديد

رفع الـ CV بقى بيحلل أوتوماتيك بـ **LLM مجاني (Gemma عبر OpenRouter)**:

| Method | Endpoint | بيعمل ايه |
|---|---|---|
| POST | `/upload-cv` | يرفع الـ PDF → يستخرج النص (PdfPig) → الـ AI يحلله (ملخص + مهارات) → يولّد الترشيحات وبيتكاشن |
| GET | `/recommended-jobs` | أفضل الوظائف للمرشح مرتبة: `matchScore` + سبب ذكي + المهارات المشتركة — من كاش جدول `JobRecommendations` |
| GET | `/cv-analysis` | "اللي الـ AI فهمه" من الـ CV (الملخص + المهارات المستخرجة) |
| POST | `/recommended-jobs/refresh` | إعادة التحليل والترشيح من الصفر (برسالة واضحة لو الـ PDF مش مقروء/سكانر) |

- **Fail-safe بالتصميم**: لو الـ AI وقع (network / rate-limit 429 من النسخة المجانية)، الترشيحات ترجع بتسكور محلي (heuristic) — الفلو مش هيقع أبداً.
- كاش الترشيحات بيتجدد تلقائياً مع **كل رفعة CV جديدة**.
- من الـ Swagger: هتلاقي زرار **🔒 Authorize** فوق — JWT Bearer (حط الـ `accessToken` من `/Login`).

## 🗄️ الداتابيز

Migrations (بالترتيب):
1. `AddUserEntities` 2. `Feature4_HrWorkflow` (جداول Interviews/History + أعمدة المرشح + توحيد أسماء الجداول) 3. `AddJobIsActive` 4. `Feature3_CandidateLinkAndCvPath` (جدول الربط + مسار الـ CV) 5. `AddAiJobRecommendations` — جدول `JobRecommendations` (كاش ترشيحات الـ AI) + أعمدة `CvText / CvSummary / Skills`

```powershell
# من فولدر الـ solution (محتاج dotnet-ef 8 — متثبت عبر dotnet-tools.json):
dotnet ef database update --project SmartRecruitment.Infrastucture --startup-project HrSmartRecruitment
```

`appsettings.json` فيه `Server=.` (standard التيم) و`appsettings.Development.json` للإعدادات المحلية لكل جهاز.

## ▶️ التشغيل

1. `HrSmartRecruitment` كـ Startup Project + بروفايل **http** + **F5** → Swagger على `http://localhost:5030/swagger`
2. أول تشغيل بيزرع ديمو تلقائياً: أدمن + HR + شركتين + وظيفتين + 3 مرشحين + طلبات + مقابلة
3. الدخول: `admin@smartrecruitment.com` / `Admin@123456` (ملف `.http` فيه كل الطلبات جاهزة)

> ⚠️ ملحوظة أجهزة: المشروع `net8.0` — لو الـ runtime مش متسطب عندك حط متغير `DOTNET_ROLL_FORWARD=LatestMajor`.

## 🔑 مفتاح OpenRouter (لازم لفيتشر الـ AI)

المفتاح **مش موجود في المشروع ولا في الريبو** — في **user-secrets** على جهازك (خارج المجلد بتاع الكود):

```powershell
cd HrSmartRecruitment
dotnet user-secrets set "OpenRouter:ApiKey" "sk-or-v1-..."
```

| معلومة | التفصيل |
|---|---|
| فين المفتاح؟ | `%APPDATA%\Microsoft\UserSecrets\<UserSecretsId>\secrets.json` — ما يتمش تتبعه بـ Git |
| `appsettings.json` | فيه placeholder بس: `"ApiKey": "SET-VIA-USER-SECRETS..."` |
| الموديل | متغير من `OpenRouter:Model` (موديل مجاني من عيلة Gemma) — لو وقع فيه fallback لموديل تاني تلقائياً |
| لو المفتاح مش موجود/غلط؟ | الفيتشر بيكمل بالتسكور المحلي (heuristic) — التطبيق مش هيتأثر |
| المفتاح اتسرّب؟ | اعمل Revoke من [openrouter.ai/keys](https://openrouter.ai/keys) وولّد واحد جديد بنفس الأمر فوق |

## 🩺 مشاكل سريعة والحلول

| العرض | السبب / الحل |
|---|---|
| 502 Bad Gateway من صفحة الـ Angular على `/api/...` | الـ API مش شغال — شغّل `dotnet run --project HrSmartRecruitment` (أو F5 في VS) وسيب الترمنال مفتوح |
| SQL timeout (`post-login phase`) أو `4060 Cannot open database` | SQL Express مع `AUTO_CLOSE = ON` بيقفل الداتابيز بعد عدم النشاط ويعمل recovery بطيء (~20-60s) عند أول اتصال — علاج مرة واحدة: `sqlcmd -S ".\SQLEXPRESS" -E -C -Q "ALTER DATABASE SmartRecruitmentDev SET ONLINE; ALTER DATABASE SmartRecruitmentDev SET AUTO_CLOSE OFF;"` |
| بعد رفع الـ CV: رسالة retry للترشيحات | Rate-limit من OpenRouter المجاني (429) — اضغط Retry بعد دقيقة؛ في أي الحالات التسكور الجزئي موجود |
| أول طلب ترشيحات بطيء (حتى دقيقة) | طبيعي — أول استدعاء LLM حي؛ بعدها كل حاجة من الكاش فورية |

## ⚠️ ملحوظات معروفة

- الـ `Candidate` فيه أعمدة ML رقمية + أعمدة بروفايل؛ الاسم/الإيميل الأساسي من الـ `User` المرتبط.
- أقسام التعليم/الخبرات في تفاصيل المتقدم فاضية (مفيش جداول ليها بعد).
- حسابات الديمو (`hr.demo`, المرشحين) باسورد غير صالح للدخول — الدخول الفعلي بالأدمن أو حساب مسجل جديد.
- داتابيز `SmartRecruitmentDB` على جهاز التطوير ده فيها جداول تجريبية قديمة (مفرد+جمع) — استخدم اسم نضيف أو نظفها قبل `update-database`.

## 🔗 الفرونت

`frontend/` (جوه الريبو جنب الـ solution) — Angular 22 (standalone + zoneless) مربوطة على الـ API ده:

```powershell
cd frontend
npm install
npm start    # http://localhost:4200 — الـ proxy بيحوّل /api على 5030
```

- صفحة **Candidate Profile** فيها قسم **✨ Recommended jobs for you**: بعد رفع الـ CV بيتحدث لوحده (Score bar + سبب الـ AI + المهارات المشتركة + تحليل الـ CV).
- تفاصيل الفرونت الكاملة في `README.md` بتاعه.
