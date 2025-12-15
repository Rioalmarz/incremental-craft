-- Add predicted_visit_date column to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS predicted_visit_date date;