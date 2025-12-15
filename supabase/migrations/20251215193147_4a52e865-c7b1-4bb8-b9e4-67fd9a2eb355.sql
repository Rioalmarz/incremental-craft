-- Add unique constraint for upsert functionality
ALTER TABLE patient_eligibility 
ADD CONSTRAINT patient_eligibility_patient_service_unique 
UNIQUE (patient_id, service_id);