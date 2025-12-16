-- Add 29 new columns to patients table for comprehensive Excel import support

-- Basic information columns
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS visit_count INTEGER;

-- Health status columns
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS obesity_class TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS smoking_status TEXT;

-- Screening eligibility columns
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS eligible_dm_screening BOOLEAN DEFAULT false;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS eligible_htn_screening BOOLEAN DEFAULT false;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS eligible_dlp_screening BOOLEAN DEFAULT false;

-- Lab results columns
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS fasting_blood_glucose NUMERIC;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS hba1c NUMERIC;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS ldl NUMERIC;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS bp_last_visit TEXT;

-- Advanced medication columns
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS latest_prescription_date DATE;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS chronic_risk_score TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS predicted_medications TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS prescription_with_dosage TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medication_categories TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS total_chronic_meds INTEGER;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS med_prediction_confidence NUMERIC;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS clinical_validation TEXT;

-- Visit and prediction columns
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS last_visit_date DATE;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS avg_days_between_visits NUMERIC;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS cycle_days INTEGER;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS cycle_type_new TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS action_required TEXT;

-- Communication and follow-up columns
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS call_status TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS call_date DATE;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS call_notes TEXT;