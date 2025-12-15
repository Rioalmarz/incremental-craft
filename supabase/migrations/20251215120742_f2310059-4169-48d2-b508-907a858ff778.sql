-- Add referral_reason column to screening_data to store the action from screening
ALTER TABLE public.screening_data 
ADD COLUMN IF NOT EXISTS referral_reason TEXT;

-- Add prediction_accuracy column to medications for storing imported prediction accuracy
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS prediction_accuracy INTEGER;