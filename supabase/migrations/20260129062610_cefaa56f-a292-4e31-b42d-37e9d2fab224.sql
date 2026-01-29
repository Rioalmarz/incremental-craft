-- إضافة أعمدة التنبؤ بالذكاء الاصطناعي لجدول patients
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS dm_prediction_index integer,
ADD COLUMN IF NOT EXISTS htn_prediction_index integer,
ADD COLUMN IF NOT EXISTS ldl_prediction_index integer,
ADD COLUMN IF NOT EXISTS priority_level text,
ADD COLUMN IF NOT EXISTS priority_reason text,
ADD COLUMN IF NOT EXISTS suggested_action text,
ADD COLUMN IF NOT EXISTS dm_medications_count integer,
ADD COLUMN IF NOT EXISTS htn_medications_count integer,
ADD COLUMN IF NOT EXISTS dlp_medications_count integer,
ADD COLUMN IF NOT EXISTS anticoagulant_count integer,
ADD COLUMN IF NOT EXISTS dm_medications_list text,
ADD COLUMN IF NOT EXISTS htn_medications_list text,
ADD COLUMN IF NOT EXISTS dlp_medications_list text,
ADD COLUMN IF NOT EXISTS anticoagulant_list text,
ADD COLUMN IF NOT EXISTS prediction_confidence integer,
ADD COLUMN IF NOT EXISTS systolic_bp integer,
ADD COLUMN IF NOT EXISTS diastolic_bp integer,
ADD COLUMN IF NOT EXISTS bmi decimal,
ADD COLUMN IF NOT EXISTS registration_status text,
ADD COLUMN IF NOT EXISTS dispensing_pattern text,
ADD COLUMN IF NOT EXISTS name_en text;

-- إضافة تعليقات للأعمدة الجديدة
COMMENT ON COLUMN public.patients.dm_prediction_index IS 'مؤشر تنبؤ السكري (0-100)';
COMMENT ON COLUMN public.patients.htn_prediction_index IS 'مؤشر تنبؤ الضغط (0-100)';
COMMENT ON COLUMN public.patients.ldl_prediction_index IS 'مؤشر تنبؤ الدهون (0-100)';
COMMENT ON COLUMN public.patients.priority_level IS 'تصنيف الأولوية (استشاري، عالية، روتيني)';
COMMENT ON COLUMN public.patients.priority_reason IS 'سبب تصنيف الأولوية';
COMMENT ON COLUMN public.patients.suggested_action IS 'الإجراء العلاجي المقترح';
COMMENT ON COLUMN public.patients.prediction_confidence IS 'نسبة الثقة في التنبؤ (0-100)';