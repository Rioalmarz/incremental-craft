-- Create age_groups table
CREATE TABLE public.age_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id INTEGER NOT NULL UNIQUE,
  group_name_ar TEXT NOT NULL,
  group_name_en TEXT NOT NULL,
  min_age INTEGER NOT NULL,
  max_age INTEGER NOT NULL,
  visit_frequency TEXT,
  color_code TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create preventive_services table
CREATE TABLE public.preventive_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id TEXT NOT NULL UNIQUE,
  service_code TEXT NOT NULL,
  service_name_ar TEXT NOT NULL,
  service_name_en TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('screening', 'immunization', 'counseling')),
  min_age INTEGER NOT NULL,
  max_age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'both')),
  frequency_months INTEGER NOT NULL DEFAULT 0,
  uspstf_grade TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  risk_factors TEXT,
  description_ar TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create immunizations table
CREATE TABLE public.immunizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vaccine_id TEXT NOT NULL UNIQUE,
  vaccine_name_ar TEXT NOT NULL,
  vaccine_name_en TEXT NOT NULL,
  min_age_months INTEGER NOT NULL,
  max_age_years INTEGER NOT NULL,
  doses INTEGER NOT NULL DEFAULT 1,
  schedule TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health_education table
CREATE TABLE public.health_education (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id TEXT NOT NULL UNIQUE,
  topic_name_ar TEXT NOT NULL,
  topic_name_en TEXT NOT NULL,
  age_group TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  format TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patient_eligibility table
CREATE TABLE public.patient_eligibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_age INTEGER NOT NULL,
  patient_gender TEXT NOT NULL,
  service_id TEXT NOT NULL,
  service_code TEXT NOT NULL,
  service_name_ar TEXT NOT NULL,
  is_eligible BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'declined')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  due_date DATE,
  last_completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id, service_id)
);

-- Enable RLS on all tables
ALTER TABLE public.age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preventive_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immunizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_eligibility ENABLE ROW LEVEL SECURITY;

-- RLS Policies for age_groups (read-only for authenticated users, full access for superadmins)
CREATE POLICY "Authenticated users can view age groups"
ON public.age_groups FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Superadmins can manage age groups"
ON public.age_groups FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for preventive_services
CREATE POLICY "Authenticated users can view preventive services"
ON public.preventive_services FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Superadmins can manage preventive services"
ON public.preventive_services FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for immunizations
CREATE POLICY "Authenticated users can view immunizations"
ON public.immunizations FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Superadmins can manage immunizations"
ON public.immunizations FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for health_education
CREATE POLICY "Authenticated users can view health education"
ON public.health_education FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Superadmins can manage health education"
ON public.health_education FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for patient_eligibility
CREATE POLICY "Superadmins can view all patient eligibility"
ON public.patient_eligibility FOR SELECT
USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Centers can view their patients eligibility"
ON public.patient_eligibility FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.national_id = patient_eligibility.patient_id
    AND p.center_id = get_user_center_id(auth.uid())
  )
);

CREATE POLICY "Superadmins can manage all patient eligibility"
ON public.patient_eligibility FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Centers can manage their patients eligibility"
ON public.patient_eligibility FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.national_id = patient_eligibility.patient_id
    AND p.center_id = get_user_center_id(auth.uid())
  )
);

CREATE POLICY "Centers can update their patients eligibility"
ON public.patient_eligibility FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.national_id = patient_eligibility.patient_id
    AND p.center_id = get_user_center_id(auth.uid())
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_age_groups_updated_at
BEFORE UPDATE ON public.age_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_preventive_services_updated_at
BEFORE UPDATE ON public.preventive_services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_immunizations_updated_at
BEFORE UPDATE ON public.immunizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_education_updated_at
BEFORE UPDATE ON public.health_education
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_eligibility_updated_at
BEFORE UPDATE ON public.patient_eligibility
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();