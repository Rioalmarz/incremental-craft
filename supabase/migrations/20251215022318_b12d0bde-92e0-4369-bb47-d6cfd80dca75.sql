-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('superadmin', 'center');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    name_ar TEXT,
    center_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Create patients table
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    national_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    phone TEXT,
    team TEXT,
    doctor TEXT,
    has_dm BOOLEAN DEFAULT false,
    has_htn BOOLEAN DEFAULT false,
    has_dyslipidemia BOOLEAN DEFAULT false,
    burden TEXT CHECK (burden IN ('عالي', 'متوسط', 'منخفض')),
    visit_window_text TEXT,
    days_until_visit INTEGER,
    urgency_status TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'virtualClinic', 'completed', 'excluded')),
    center_id TEXT NOT NULL,
    exclusion_reason TEXT,
    action TEXT,
    symptoms JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create screening_data table
CREATE TABLE public.screening_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    prev_contact TEXT,
    residence TEXT,
    rx_status TEXT,
    last_lab TEXT,
    appointment_date DATE,
    visit_type TEXT CHECK (visit_type IN ('labs', 'refill')),
    notes TEXT,
    screened_by TEXT,
    screened_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create medications table
CREATE TABLE public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    dosage TEXT,
    compliance_percent INTEGER CHECK (compliance_percent >= 0 AND compliance_percent <= 100)
);

-- Create settings table
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's center_id
CREATE OR REPLACE FUNCTION public.get_user_center_id(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT center_id FROM public.profiles WHERE user_id = _user_id
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- Patients policies
CREATE POLICY "Superadmins can view all patients"
ON public.patients FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Centers can view their patients"
ON public.patients FOR SELECT
TO authenticated
USING (center_id = public.get_user_center_id(auth.uid()));

CREATE POLICY "Superadmins can manage all patients"
ON public.patients FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Centers can update their patients"
ON public.patients FOR UPDATE
TO authenticated
USING (center_id = public.get_user_center_id(auth.uid()));

-- Screening data policies
CREATE POLICY "Authenticated users can view screening data"
ON public.screening_data FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_id
    AND (
      public.has_role(auth.uid(), 'superadmin')
      OR p.center_id = public.get_user_center_id(auth.uid())
    )
  )
);

CREATE POLICY "Authenticated users can insert screening data"
ON public.screening_data FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_id
    AND (
      public.has_role(auth.uid(), 'superadmin')
      OR p.center_id = public.get_user_center_id(auth.uid())
    )
  )
);

CREATE POLICY "Authenticated users can update screening data"
ON public.screening_data FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_id
    AND (
      public.has_role(auth.uid(), 'superadmin')
      OR p.center_id = public.get_user_center_id(auth.uid())
    )
  )
);

-- Medications policies
CREATE POLICY "Authenticated users can view medications"
ON public.medications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_id
    AND (
      public.has_role(auth.uid(), 'superadmin')
      OR p.center_id = public.get_user_center_id(auth.uid())
    )
  )
);

CREATE POLICY "Authenticated users can manage medications"
ON public.medications FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_id
    AND (
      public.has_role(auth.uid(), 'superadmin')
      OR p.center_id = public.get_user_center_id(auth.uid())
    )
  )
);

-- Settings policies (only superadmins)
CREATE POLICY "Superadmins can view settings"
ON public.settings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can manage settings"
ON public.settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- Allow public read for video URL setting
CREATE POLICY "Public can read video setting"
ON public.settings FOR SELECT
TO anon, authenticated
USING (key = 'video_url');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for patients table
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES 
('video_url', '"https://www.youtube.com/embed/dQw4w9WgXcQ"'),
('n8n_webhook_url', '""');

-- Create indexes for better performance
CREATE INDEX idx_patients_status ON public.patients(status);
CREATE INDEX idx_patients_center_id ON public.patients(center_id);
CREATE INDEX idx_patients_national_id ON public.patients(national_id);
CREATE INDEX idx_screening_data_patient_id ON public.screening_data(patient_id);
CREATE INDEX idx_medications_patient_id ON public.medications(patient_id);