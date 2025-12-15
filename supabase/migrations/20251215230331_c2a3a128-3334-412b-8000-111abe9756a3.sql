-- Create schedules table for doctor scheduling
CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'افتراضي',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(center_name, doctor_id, date)
);

-- Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view schedules"
ON public.schedules
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Superadmins can manage schedules"
ON public.schedules
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Centers can view their schedules"
ON public.schedules
FOR SELECT
USING (center_name = get_user_center_id(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_schedules_updated_at
BEFORE UPDATE ON public.schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_schedules_center_date ON public.schedules(center_name, date);
CREATE INDEX idx_schedules_doctor_id ON public.schedules(doctor_id);