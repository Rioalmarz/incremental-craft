

# خطة ترحيل ISCCP إلى خادم وزارة الصحة الداخلي

## نظرة عامة على المشروع

هذه الخطة تهدف لتحويل المنصة الحالية (المبنية على Lovable Cloud/Supabase) إلى منصة تعمل بالكامل على الخادم الداخلي لوزارة الصحة بدون أي اعتماد على خدمات سحابية خارجية.

---

## التغييرات المعمارية الأساسية

### قبل (الحالي):
- Supabase للمصادقة وقاعدة البيانات
- Edge Functions للوظائف الخلفية
- Lovable AI Gateway للذكاء الاصطناعي

### بعد (المستهدف):
- REST API داخلي (Node.js/Express أو FastAPI)
- JWT للمصادقة
- PostgreSQL على خادم MOH
- Ollama للذكاء الاصطناعي المحلي

---

## المراحل التنفيذية

### المرحلة 1: إنشاء طبقة API Client

**ملف جديد:** `src/lib/api.ts`

```text
+------------------------------------------+
|           API Client Layer               |
+------------------------------------------+
| - BaseURL من متغير البيئة                |
| - إدارة JWT Token                        |
| - معالجة الأخطاء (401, 500)              |
| - Methods: GET, POST, PUT, PATCH, DELETE |
+------------------------------------------+
```

- BaseURL قابل للتكوين: `VITE_API_BASE_URL`
- إضافة/إزالة Token تلقائياً
- إعادة التوجيه لصفحة تسجيل الدخول عند انتهاء الجلسة

### المرحلة 2: إنشاء طبقة الخدمات (Services)

**مجلد جديد:** `src/services/`

| الملف | الوظيفة |
|-------|---------|
| `patientService.ts` | CRUD للمرضى + استيراد Excel |
| `statsService.ts` | إحصائيات لوحة التحكم |
| `teamService.ts` | إدارة الفرق الطبية |
| `medicationService.ts` | إدارة الأدوية |
| `appointmentService.ts` | المواعيد |
| `authService.ts` | تسجيل الدخول/الخروج |

### المرحلة 3: إعادة كتابة AuthContext

**تعديل:** `src/contexts/AuthContext.tsx`

التغييرات:
- إزالة كل استيرادات Supabase Auth
- استخدام JWT مع localStorage
- استدعاء `/api/auth/login` و `/api/auth/me`
- الأدوار: `admin` | `physician` | `viewer`

```text
Login Flow:
1. المستخدم يدخل email + password
2. POST /api/auth/login → { token, user, role }
3. حفظ token في localStorage
4. تعيين token في API client
5. إعادة التوجيه للصفحة الرئيسية
```

### المرحلة 4: إنشاء React Query Hooks

**مجلد جديد:** `src/hooks/api/`

| الملف | الوظيفة |
|-------|---------|
| `usePatients.ts` | جلب/تحديث المرضى |
| `useStats.ts` | إحصائيات Dashboard |
| `useTeams.ts` | بيانات الفرق |
| `useMedications.ts` | بيانات الأدوية |

ميزات:
- `staleTime: 30_000` للتخزين المؤقت
- Background refetch
- Error handling مع toast

### المرحلة 5: تحديث صفحات التطبيق

**الملفات للتعديل:**

| الملف | التغييرات |
|-------|-----------|
| `AllPatients.tsx` | استبدال supabase.from() بـ usePatients() |
| `Statistics.tsx` | استبدال fetch مباشر بـ useStats() |
| `Screening.tsx` | استخدام patientService.update() |
| `VirtualClinic.tsx` | استخدام services بدل supabase |
| `PreventiveCare.tsx` | نفس التحويل |
| `Completed.tsx` | نفس التحويل |
| `Excluded.tsx` | نفس التحويل |
| `AdminUsers.tsx` | استخدام authService |
| `AdminSettings.tsx` | استخدام settingsService |

### المرحلة 6: وضع Mock Data للتطوير

**ملف جديد:** `src/lib/mockData.ts`

عند `VITE_USE_MOCK_DATA=true`:
- توليد 16,000 مريض وهمي
- 4 فرق طبية بالبيانات الحقيقية
- 1,317 احتياطي
- إحصائيات مطابقة للتقرير

### المرحلة 7: تكامل Ollama للذكاء الاصطناعي

**تعديل:** `src/components/AiChat.tsx` (جديد)

```text
Ollama Integration:
- URL: VITE_AI_CHAT_URL (مثل: http://ollama.moh.local:11434/api/chat)
- Model: VITE_AI_MODEL (مثل: llama3)
- Streaming response
- RTL Arabic chat interface
```

### المرحلة 8: تحديث Environment Variables

**تعديل:** `.env.development` و `.env.production`

```text
# Development
VITE_API_BASE_URL=http://localhost:3001/api
VITE_AI_CHAT_URL=http://localhost:11434/api/chat
VITE_AI_MODEL=llama3
VITE_USE_MOCK_DATA=true

# Production (MOH)
VITE_API_BASE_URL=https://isccp-api.moh.local/api
VITE_AI_CHAT_URL=http://ollama.moh.local:11434/api/chat
VITE_AI_MODEL=llama3
VITE_USE_MOCK_DATA=false
```

---

## الصفحات الجديدة المطلوبة

### 1. `/chronic` — الأمراض المزمنة
- 3 tabs: السكري | الضغط | الدهون
- Control Analysis بـ 4 طرق من التقرير
- جداول ورسوم بيانية

### 2. `/teams` — الفرق الطبية (محسّن)
- 4 فرق + 2 دعم مشترك
- Team 2 تحذير السعة
- مقارنة الأداء

### 3. `/risk` — إدارة المخاطر
- 4 مستويات: روتيني | متابعة | عالي | استشاري
- Severity Score
- قائمة المرضى

### 4. `/engagement` — متابعة المشاركة
- Engagement funnel
- معدلات التواصل
- توزيع الزيارات

### 5. `/medications` — الأدوية
- أعلى 10 أدوية
- فئات الأدوية
- Treatment Adequacy

### 6. `/obesity` — السمنة
- BMI distribution
- Manageable range: 59.6%

### 7. `/uncontrolled` — غير المسيطر عليهم
- HbA1c ≥ 12 | LDL ≥ 190 | BP Stage 2
- Consultant referral filter

### 8. `/ai-chat` — المحادثة الذكية
- Chat interface (RTL)
- Ollama integration
- Quick actions

---

## التصميم والثيمات

### Dark Mode (الافتراضي)
```css
- Background: from-[#0a0f1e] via-[#0d1528] to-[#0a1a2e]
- Cards: bg-white/5 backdrop-blur-xl border-white/10
- Accent: #14b8a6 (Teal)
- Font: 'Tajawal', 'Inter', sans-serif
```

### RTL Support
- `dir="rtl"` على الجذر
- flex-row-reverse للـ EN
- جميع النصوص ثنائية اللغة

---

## الملفات للإنشاء

```text
src/
├── lib/
│   ├── api.ts                    # API Client
│   └── mockData.ts              # بيانات وهمية للتطوير
├── services/
│   ├── authService.ts
│   ├── patientService.ts
│   ├── statsService.ts
│   ├── teamService.ts
│   ├── medicationService.ts
│   └── appointmentService.ts
├── hooks/api/
│   ├── usePatients.ts
│   ├── useStats.ts
│   ├── useTeams.ts
│   └── useMedications.ts
├── pages/
│   ├── Chronic.tsx              # جديد
│   ├── Teams.tsx                # محسّن
│   ├── Risk.tsx                 # جديد
│   ├── Engagement.tsx           # جديد
│   ├── Medications.tsx          # جديد
│   ├── Obesity.tsx              # جديد
│   ├── Uncontrolled.tsx         # جديد
│   └── AiChat.tsx               # جديد
└── components/
    └── NetworkStatus.tsx        # مؤشر حالة الاتصال
```

## الملفات للتعديل

```text
- src/contexts/AuthContext.tsx   # JWT بدل Supabase
- src/App.tsx                    # Routes جديدة
- src/pages/Home.tsx             # Navigation grid جديد
- src/pages/AllPatients.tsx      # استخدام services
- src/pages/Statistics.tsx       # استخدام services
- src/pages/Screening.tsx        # استخدام services
- src/pages/VirtualClinic.tsx    # استخدام services
- src/contexts/LanguageContext.tsx # ترجمات جديدة
- .env.example                   # متغيرات جديدة
```

## الملفات للحذف/عدم الاستخدام

```text
- src/integrations/supabase/*    # لن تُستخدم
- supabase/functions/*           # لن تُستخدم
- supabase/config.toml           # لن يُستخدم
```

---

## KPIs الفعلية من البيانات

| المؤشر | القيمة |
|--------|--------|
| إجمالي المسجلين | 16,000 |
| الفرق | 4 × 4,000 |
| الاحتياط | 1,317 |
| نسبة السيطرة على السكري | 46.7% |
| نسبة السيطرة على الضغط | 30.0% |
| معدل التواصل | 83.0% |
| مؤشر التنبؤ AI | 37.6% |
| عالي الاستخدام (>10 زيارات) | 7.3% |

### توزيع الفرق
| الفريق | معدل التواصل | السيطرة على السكري |
|--------|-------------|-------------------|
| Team 1 | 95% | 50.6% |
| Team 2 | 47% | 34.2% |
| Team 3 | 98% | 58.5% (الأفضل) |
| Team 4 | 92% | 43.4% |

---

## ملاحظات مهمة

1. **لا خدمات سحابية**: جميع البيانات تبقى داخل شبكة MOH
2. **JWT فقط**: لا Supabase Auth
3. **Ollama محلي**: لا Lovable AI أو OpenAI
4. **Mock Mode**: للتطوير بدون خادم خلفي
5. **RTL أولاً**: العربية هي اللغة الافتراضية
6. **Dark Mode أولاً**: الوضع الداكن هو الافتراضي

---

## ترتيب التنفيذ المقترح

1. API Client + Auth Context (الأساس)
2. Services Layer (البنية التحتية)
3. React Query Hooks (التكامل)
4. Mock Data Mode (التطوير)
5. تحديث الصفحات الموجودة
6. إنشاء الصفحات الجديدة
7. تكامل Ollama
8. Network Status + Error Handling
9. اختبار شامل

