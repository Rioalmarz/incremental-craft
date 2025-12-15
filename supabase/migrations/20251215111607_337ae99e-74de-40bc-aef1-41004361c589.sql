-- Create virtual_clinic_data table for storing virtual clinic examination data
CREATE TABLE public.virtual_clinic_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  -- Symptoms assessment (emergency indicators)
  chest_pain BOOLEAN DEFAULT false,
  severe_headache BOOLEAN DEFAULT false,
  vision_changes BOOLEAN DEFAULT false,
  severe_shortness_of_breath BOOLEAN DEFAULT false,
  loss_of_consciousness BOOLEAN DEFAULT false,
  severe_hypoglycemia BOOLEAN DEFAULT false,
  -- Final action
  final_action TEXT NOT NULL, -- 'refill_rx', 'order_labs', 'schedule_clinical', 'referral', 'no_intervention'
  referral_specialty TEXT, -- if referral selected
  -- Notes and metadata
  notes TEXT,
  examined_by TEXT,
  examined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add compliance_percent column to medications table if not exists
-- (already exists based on schema)

-- Enable RLS
ALTER TABLE public.virtual_clinic_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view virtual clinic data"
ON public.virtual_clinic_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = virtual_clinic_data.patient_id
    AND (has_role(auth.uid(), 'superadmin'::app_role) OR p.center_id = get_user_center_id(auth.uid()))
  )
);

CREATE POLICY "Authenticated users can insert virtual clinic data"
ON public.virtual_clinic_data
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = virtual_clinic_data.patient_id
    AND (has_role(auth.uid(), 'superadmin'::app_role) OR p.center_id = get_user_center_id(auth.uid()))
  )
);

CREATE POLICY "Authenticated users can update virtual clinic data"
ON public.virtual_clinic_data
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = virtual_clinic_data.patient_id
    AND (has_role(auth.uid(), 'superadmin'::app_role) OR p.center_id = get_user_center_id(auth.uid()))
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_virtual_clinic_data_updated_at
BEFORE UPDATE ON public.virtual_clinic_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();