-- Add pilot-specific columns for tracking contact and service delivery
ALTER TABLE patients ADD COLUMN IF NOT EXISTS contacted BOOLEAN DEFAULT false;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS contact_date DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS service_delivered BOOLEAN;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS non_delivery_reason TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS satisfaction_score INTEGER;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS provider_satisfaction_score INTEGER;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS risk_classification TEXT;

-- Add comment for documentation
COMMENT ON COLUMN patients.contacted IS 'Whether the patient was contacted during pilot';
COMMENT ON COLUMN patients.service_delivered IS 'Whether service was delivered to contacted patients';
COMMENT ON COLUMN patients.non_delivery_reason IS 'Reason for not delivering service';
COMMENT ON COLUMN patients.risk_classification IS 'Risk level: طبيعي/يحتاج مراقبة/خطر';