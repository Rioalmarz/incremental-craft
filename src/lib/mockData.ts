// Mock Data Generator for Development
// Generates realistic patient data matching MOH ISCCP program specifications

import { Tables } from '@/integrations/supabase/types';

type Patient = Tables<'patients'>;

// Team data based on actual KPIs
export const TEAM_DATA = [
  {
    id: 1,
    name_ar: 'الفريق الأول',
    name_en: 'Team 1',
    color: '#3b82f6',
    patient_count: 4000,
    contact_rate: 95,
    dm_control_rate: 50.6,
    htn_control_rate: 30.8,
    ai_prediction_rate: 42.0,
    members: [
      { name_ar: 'د. ريان المرزوقي', name_en: 'Dr. Rayan Almarzuqi', role: 'Consultant Family Medicine', member_type: 'physician' },
      { name_ar: 'د. خالد القحطاني', name_en: 'Dr. Khaled Alkahtani', role: 'General Physician', member_type: 'physician' },
      { name_ar: 'ن. زهراء', name_en: 'N. Zahraa', role: 'Nurse', member_type: 'nurse' },
      { name_ar: 'ن. رؤى', name_en: 'N. Roaa', role: 'Nurse', member_type: 'nurse' },
    ],
  },
  {
    id: 2,
    name_ar: 'الفريق الثاني',
    name_en: 'Team 2',
    color: '#10b981',
    patient_count: 4000,
    contact_rate: 47,
    dm_control_rate: 34.2,
    htn_control_rate: 25.3,
    ai_prediction_rate: 21.0,
    capacity_warning: 'سعة الاستشاري محدودة بـ 30 موعد افتراضي لكل دورة',
    members: [
      { name_ar: 'د. منى الحيدري', name_en: 'Dr. Mona Alhidary', role: 'Consultant Family Medicine', member_type: 'physician' },
      { name_ar: 'ن. عرفة', name_en: 'N. Arfa', role: 'Nurse', member_type: 'nurse' },
      { name_ar: 'ن. فدوى', name_en: 'N. Fadwa', role: 'Nurse', member_type: 'nurse' },
    ],
  },
  {
    id: 3,
    name_ar: 'الفريق الثالث',
    name_en: 'Team 3',
    color: '#f59e0b',
    patient_count: 4000,
    contact_rate: 98,
    dm_control_rate: 58.5,
    htn_control_rate: 34.7,
    ai_prediction_rate: 52.0,
    members: [
      { name_ar: 'د. محمود سيت', name_en: 'Dr. Mahmoud Sit', role: 'Specialist Family Medicine', member_type: 'physician' },
      { name_ar: 'د. روان الجهني', name_en: 'Dr. Rawan Aljohani', role: 'Specialist Family Medicine', member_type: 'physician' },
      { name_ar: 'ن. وفاء', name_en: 'N. Wafaa', role: 'Nurse', member_type: 'nurse' },
      { name_ar: 'ن. عائشة', name_en: 'N. Aisha', role: 'Nurse', member_type: 'nurse' },
    ],
  },
  {
    id: 4,
    name_ar: 'الفريق الرابع',
    name_en: 'Team 4',
    color: '#8b5cf6',
    patient_count: 4000,
    contact_rate: 92,
    dm_control_rate: 43.4,
    htn_control_rate: 29.3,
    ai_prediction_rate: 35.4,
    members: [
      { name_ar: 'د. ريهام المالكي', name_en: 'Dr. Reham Almalki', role: 'Consultant Family Medicine', member_type: 'physician' },
      { name_ar: 'د. سارة النصار', name_en: 'Dr. Sarah Alnassar', role: 'General Physician', member_type: 'physician' },
      { name_ar: 'ن. رحاب', name_en: 'N. Rahab', role: 'Nurse', member_type: 'nurse' },
      { name_ar: 'ن. عبدالله', name_en: 'N. Abdullah', role: 'Nurse', member_type: 'nurse' },
    ],
  },
];

export const SHARED_SUPPORT = [
  { name_ar: 'أ. منال العمري', name_en: 'Manal Al-Omari', role: 'Health Coach', member_type: 'shared_support' },
  { name_ar: 'أ. نادية الغامدي', name_en: 'Nadia Al-Ghamdi', role: 'Case Coordinator', member_type: 'shared_support' },
];

// KPI targets
export const KPI_DATA = {
  totalEnrolled: 16000,
  reservePool: 1317,
  teams: 4,
  patientsPerTeam: 4000,
  dmControlRate: 46.7,
  htnControlRate: 30.0,
  contactRate: 83.0,
  aiPredictionIndex: 37.6,
  highUtilizers: 7.3,
  dmImprovement: 79.8,
};

// Disease distribution per team
export const DISEASE_DISTRIBUTION = {
  team1: { dm: 387, htn: 303, obesity: 685, dlp: 113, multiMorbid: 351, healthy: 2996 },
  team2: { dm: 390, htn: 294, obesity: 688, dlp: 120, multiMorbid: 351, healthy: 2996 },
  team3: { dm: 384, htn: 301, obesity: 685, dlp: 106, multiMorbid: 348, healthy: 2996 },
  team4: { dm: 386, htn: 291, obesity: 686, dlp: 114, multiMorbid: 345, healthy: 2997 },
  total: { dm: 1547, htn: 1189, obesity: 2744, dlp: 453, multiMorbid: 1395, healthy: 11985 },
};

// Engagement levels
export const ENGAGEMENT_DISTRIBUTION = {
  high: { count: 1161, percentage: 7.3 },
  active: { count: 1743, percentage: 10.9 },
  moderate: { count: 7153, percentage: 44.7 },
  low: { count: 5943, percentage: 37.1 },
};

// Arabic first names
const ARABIC_FIRST_NAMES = [
  'محمد', 'أحمد', 'علي', 'عبدالله', 'خالد', 'سعد', 'فهد', 'سلطان', 'عمر', 'يوسف',
  'فاطمة', 'نورة', 'سارة', 'منى', 'ريم', 'هند', 'لمياء', 'عائشة', 'خديجة', 'مريم',
];

// Arabic last names
const ARABIC_LAST_NAMES = [
  'العمري', 'الغامدي', 'القحطاني', 'الزهراني', 'المالكي', 'الحربي', 'الشهري', 'العتيبي',
  'الدوسري', 'السبيعي', 'الشمري', 'المطيري', 'البقمي', 'الحارثي', 'الأحمدي', 'الزبيدي',
];

// Generate random Saudi National ID (starts with 1)
function generateNationalId(): string {
  return '1' + Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
}

// Generate random HbA1c based on control distribution
function generateHbA1c(isControlled: boolean): number {
  if (isControlled) {
    return Math.round((5.5 + Math.random() * 1.4) * 10) / 10; // 5.5 - 6.9
  }
  const ranges = [
    { min: 7.0, max: 8.0, weight: 0.3 },
    { min: 8.0, max: 9.0, weight: 0.25 },
    { min: 9.0, max: 10.0, weight: 0.2 },
    { min: 10.0, max: 12.0, weight: 0.15 },
    { min: 12.0, max: 14.0, weight: 0.1 },
  ];
  const random = Math.random();
  let cumulative = 0;
  for (const range of ranges) {
    cumulative += range.weight;
    if (random <= cumulative) {
      return Math.round((range.min + Math.random() * (range.max - range.min)) * 10) / 10;
    }
  }
  return 8.5;
}

// Generate BP status
function generateBpStatus(isControlled: boolean): string {
  if (isControlled) {
    return Math.random() < 0.48 ? 'Normal' : 'Elevated';
  }
  const statuses = ['Stage 1', 'Stage 2'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// Generate BMI class
function generateBmiClass(hasObesity: boolean): string {
  if (!hasObesity) {
    return Math.random() < 0.6 ? 'Normal' : 'Overweight';
  }
  const classes = ['Obesity Class I', 'Obesity Class II', 'Obesity Class III'];
  const weights = [0.6, 0.3, 0.1];
  const random = Math.random();
  let cumulative = 0;
  for (let i = 0; i < classes.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) return classes[i];
  }
  return 'Obesity Class I';
}

// Generate random date within range
function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
}

// Generate mock patients
export function generateMockPatients(count: number = 16000): Partial<Patient>[] {
  const patients: Partial<Patient>[] = [];
  const patientsPerTeam = Math.floor(count / 4);

  for (let teamId = 1; teamId <= 4; teamId++) {
    const teamData = TEAM_DATA[teamId - 1];
    const teamDistribution = DISEASE_DISTRIBUTION[`team${teamId}` as keyof typeof DISEASE_DISTRIBUTION];

    for (let i = 0; i < patientsPerTeam; i++) {
      const firstName = ARABIC_FIRST_NAMES[Math.floor(Math.random() * ARABIC_FIRST_NAMES.length)];
      const lastName = ARABIC_LAST_NAMES[Math.floor(Math.random() * ARABIC_LAST_NAMES.length)];
      const gender = Math.random() < 0.48 ? 'Male' : 'Female';
      const age = Math.floor(20 + Math.random() * 60);

      // Determine diseases
      const hasDm = Math.random() < (teamDistribution.dm / patientsPerTeam);
      const hasHtn = Math.random() < (teamDistribution.htn / patientsPerTeam);
      const hasObesity = Math.random() < (teamDistribution.obesity / patientsPerTeam);
      const hasDlp = Math.random() < (teamDistribution.dlp / patientsPerTeam);
      const diseaseCount = [hasDm, hasHtn, hasObesity, hasDlp].filter(Boolean).length;

      // Build diseases string
      const diseases: string[] = [];
      if (hasDm) diseases.push('DM');
      if (hasHtn) diseases.push('HTN');
      if (hasObesity) diseases.push('OB');
      if (hasDlp) diseases.push('DLP');
      const diseasesStr = diseases.length > 0 ? diseases.join('+') : 'سليم';

      // Control status
      const dmControlled = hasDm && Math.random() < (teamData.dm_control_rate / 100);
      const htnControlled = hasHtn && Math.random() < (teamData.htn_control_rate / 100);

      // Engagement
      const visitRandom = Math.random();
      let visitCount: number;
      if (visitRandom < 0.073) visitCount = Math.floor(11 + Math.random() * 20);
      else if (visitRandom < 0.182) visitCount = Math.floor(7 + Math.random() * 4);
      else if (visitRandom < 0.629) visitCount = Math.floor(3 + Math.random() * 4);
      else visitCount = Math.floor(Math.random() * 3);

      const contacted = Math.random() < (teamData.contact_rate / 100);
      const aiPrediction = Math.random() < (teamData.ai_prediction_rate / 100);

      const hba1c = hasDm ? generateHbA1c(dmControlled) : null;
      const bpStatus = hasHtn ? generateBpStatus(htnControlled) : (Math.random() < 0.3 ? 'Normal' : null);
      const bmiClass = hasObesity ? generateBmiClass(true) : generateBmiClass(false);

      patients.push({
        id: crypto.randomUUID(),
        national_id: generateNationalId(),
        name: `${firstName} ${lastName}`,
        name_en: null,
        age,
        gender,
        team: `team${teamId}`,
        center_id: 'khalid-model-phc',
        has_dm: hasDm,
        has_htn: hasHtn,
        has_dyslipidemia: hasDlp,
        hba1c,
        ldl: hasDlp && Math.random() < 0.009 ? Math.floor(80 + Math.random() * 140) : null,
        visit_count: visitCount,
        last_visit_date: visitCount > 0 ? randomDate(new Date('2024-01-01'), new Date()) : null,
        contacted,
        status: contacted ? 'contacted' : 'pending',
        risk_classification: diseaseCount >= 2 ? 'High' : diseaseCount === 1 ? 'Moderate' : 'Low',
        obesity_class: bmiClass,
        smoking_status: Math.random() < 0.15 ? 'smoker' : 'non-smoker',
        dm_prediction_index: hasDm ? Math.floor(Math.random() * 100) : null,
        htn_prediction_index: hasHtn ? Math.floor(Math.random() * 100) : null,
        ldl_prediction_index: hasDlp ? Math.floor(Math.random() * 100) : null,
        prediction_confidence: Math.floor(60 + Math.random() * 35),
        priority_level: diseaseCount >= 2 ? 'عالية' : diseaseCount === 1 ? 'متوسطة' : 'روتيني',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  return patients;
}

// Generate reserve pool patients
export function generateReservePatients(count: number = 1317): Partial<Patient>[] {
  return generateMockPatients(count).map(p => ({
    ...p,
    team: null,
    status: 'reserve',
  }));
}

// Dashboard stats
export function getMockDashboardStats() {
  return {
    totalEnrolled: KPI_DATA.totalEnrolled,
    reservePool: KPI_DATA.reservePool,
    teams: TEAM_DATA,
    sharedSupport: SHARED_SUPPORT,
    kpis: {
      dmControlRate: KPI_DATA.dmControlRate,
      htnControlRate: KPI_DATA.htnControlRate,
      contactRate: KPI_DATA.contactRate,
      aiPredictionIndex: KPI_DATA.aiPredictionIndex,
      highUtilizers: KPI_DATA.highUtilizers,
      dmImprovement: KPI_DATA.dmImprovement,
    },
    diseaseDistribution: DISEASE_DISTRIBUTION.total,
    engagementLevels: ENGAGEMENT_DISTRIBUTION,
  };
}

// Export mock data check
// Default to mock mode in development when no API is configured
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const MOCK_ENV = import.meta.env.VITE_USE_MOCK_DATA;

// Use mock data if explicitly set to 'true', OR if not set and using localhost
export const useMockData = MOCK_ENV === 'true' || (MOCK_ENV === undefined && API_BASE_URL.includes('localhost'));
