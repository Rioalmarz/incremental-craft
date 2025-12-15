// ════════════════════════════════════════════════════════════════════════════════
// 🏥 نظام الرعاية الوقائية الشامل - Preventive Care Complete System
// ════════════════════════════════════════════════════════════════════════════════

import { supabase } from '@/integrations/supabase/client';

// ════════════════════════════════════════════════════════════════════════════════
// الجزء 1: TYPES & INTERFACES - الأنواع والواجهات
// ════════════════════════════════════════════════════════════════════════════════

export interface AgeGroup {
  id?: string;
  group_id: number;
  group_name_ar: string;
  group_name_en: string;
  min_age: number;
  max_age: number;
  visit_frequency: string;
  color_code: string;
  icon: string;
  created_at?: string;
  updated_at?: string;
}

export interface PreventiveService {
  id?: string;
  service_id: string;
  service_code: string;
  service_name_ar: string;
  service_name_en: string;
  category: 'screening' | 'immunization' | 'counseling';
  min_age: number;
  max_age: number;
  gender: 'male' | 'female' | 'both';
  frequency_months: number;
  uspstf_grade: string;
  priority: 'high' | 'medium' | 'low';
  risk_factors: string;
  description_ar?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Immunization {
  id?: string;
  vaccine_id: string;
  vaccine_name_ar: string;
  vaccine_name_en: string;
  min_age_months: number;
  max_age_years: number;
  doses: number;
  schedule: string;
  priority: 'high' | 'medium' | 'low';
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HealthEducation {
  id?: string;
  topic_id: string;
  topic_name_ar: string;
  topic_name_en: string;
  age_group: string;
  priority: 'high' | 'medium' | 'low';
  format: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PatientEligibility {
  id?: string;
  patient_id: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  service_id: string;
  service_code: string;
  service_name_ar: string;
  is_eligible: boolean;
  status: 'pending' | 'scheduled' | 'completed' | 'declined';
  priority: string;
  due_date?: string;
  last_completed_date?: string;
  created_at?: string;
  updated_at?: string;
}

// ════════════════════════════════════════════════════════════════════════════════
// الجزء 2: AGE GROUPS - الفئات العمرية (8 فئات)
// ════════════════════════════════════════════════════════════════════════════════

export const AGE_GROUPS: AgeGroup[] = [
  { group_id: 1, group_name_ar: "الرضع والأطفال", group_name_en: "Infants & Toddlers", min_age: 0, max_age: 5, visit_frequency: "12 زيارة خلال 5 سنوات", color_code: "#FCE4EC", icon: "👶" },
  { group_id: 2, group_name_ar: "الطفولة المبكرة", group_name_en: "School-Age Children", min_age: 6, max_age: 11, visit_frequency: "سنوياً + فحص مدرسي", color_code: "#E3F2FD", icon: "🧒" },
  { group_id: 3, group_name_ar: "المراهقون", group_name_en: "Adolescents", min_age: 12, max_age: 17, visit_frequency: "سنوياً شامل", color_code: "#E8F5E9", icon: "🧑‍🎓" },
  { group_id: 4, group_name_ar: "الشباب", group_name_en: "Young Adults", min_age: 18, max_age: 29, visit_frequency: "كل 1-3 سنوات", color_code: "#FFF3E0", icon: "👨" },
  { group_id: 5, group_name_ar: "البالغون", group_name_en: "Adults", min_age: 30, max_age: 44, visit_frequency: "كل 1-2 سنة", color_code: "#F3E5F5", icon: "👨‍💼" },
  { group_id: 6, group_name_ar: "متوسطو العمر", group_name_en: "Middle-Aged", min_age: 45, max_age: 59, visit_frequency: "سنوياً", color_code: "#E0F7FA", icon: "🧔" },
  { group_id: 7, group_name_ar: "كبار السن", group_name_en: "Seniors", min_age: 60, max_age: 74, visit_frequency: "سنوياً أو أكثر", color_code: "#FBE9E7", icon: "👴" },
  { group_id: 8, group_name_ar: "المسنون", group_name_en: "Elderly", min_age: 75, max_age: 120, visit_frequency: "كل 3-6 أشهر", color_code: "#EFEBE9", icon: "👵" }
];

// ════════════════════════════════════════════════════════════════════════════════
// الجزء 3: PREVENTIVE SERVICES - الخدمات الوقائية (35 خدمة)
// ════════════════════════════════════════════════════════════════════════════════

export const PREVENTIVE_SERVICES: PreventiveService[] = [
  // فحوصات عامة
  { service_id: "S001", service_code: "BP_SCREEN", service_name_ar: "فحص ضغط الدم", service_name_en: "Blood Pressure Screening", category: "screening", min_age: 3, max_age: 120, gender: "both", frequency_months: 12, uspstf_grade: "A", priority: "high", risk_factors: "", description_ar: "قياس ضغط الدم للكشف المبكر عن ارتفاع الضغط" },
  { service_id: "S002", service_code: "BMI_SCREEN", service_name_ar: "قياس مؤشر كتلة الجسم", service_name_en: "BMI Screening", category: "screening", min_age: 2, max_age: 120, gender: "both", frequency_months: 12, uspstf_grade: "B", priority: "high", risk_factors: "", description_ar: "حساب مؤشر كتلة الجسم للكشف عن السمنة" },
  { service_id: "S003", service_code: "OBESITY_INTERVENTION", service_name_ar: "تدخل سلوكي للسمنة", service_name_en: "Obesity Behavioral Intervention", category: "counseling", min_age: 6, max_age: 120, gender: "both", frequency_months: 12, uspstf_grade: "B", priority: "high", risk_factors: "obesity", description_ar: "برنامج تدخل سلوكي لمرضى السمنة" },
  // فحوصات السكري
  { service_id: "S004", service_code: "DM_SCREEN_ADULT", service_name_ar: "فحص السكري للبالغين", service_name_en: "Diabetes Screening (Adults 35+)", category: "screening", min_age: 35, max_age: 70, gender: "both", frequency_months: 36, uspstf_grade: "B", priority: "high", risk_factors: "", description_ar: "فحص السكر الصائم أو HbA1c للبالغين 35+ سنة" },
  { service_id: "S005", service_code: "DM_SCREEN_RISK", service_name_ar: "فحص السكري (عوامل خطر)", service_name_en: "Diabetes Screening (Risk Factors)", category: "screening", min_age: 18, max_age: 70, gender: "both", frequency_months: 36, uspstf_grade: "B", priority: "high", risk_factors: "obesity,family_history", description_ar: "فحص السكري للبالغين مع عوامل خطر (سمنة/تاريخ عائلي)" },
  // فحوصات الدهون
  { service_id: "S006", service_code: "LIPID_MEN", service_name_ar: "فحص الدهون للرجال", service_name_en: "Lipid Screening (Men 35+)", category: "screening", min_age: 35, max_age: 75, gender: "male", frequency_months: 60, uspstf_grade: "A", priority: "high", risk_factors: "", description_ar: "تحليل الدهون الكامل للرجال 35+ سنة" },
  { service_id: "S007", service_code: "LIPID_WOMEN", service_name_ar: "فحص الدهون للنساء", service_name_en: "Lipid Screening (Women 45+)", category: "screening", min_age: 45, max_age: 75, gender: "female", frequency_months: 60, uspstf_grade: "B", priority: "high", risk_factors: "", description_ar: "تحليل الدهون الكامل للنساء 45+ سنة" },
  // فحوصات السرطان
  { service_id: "S008", service_code: "BREAST_MAMMO", service_name_ar: "تصوير الثدي الشعاعي", service_name_en: "Breast Cancer Mammography", category: "screening", min_age: 40, max_age: 74, gender: "female", frequency_months: 24, uspstf_grade: "B", priority: "high", risk_factors: "", description_ar: "ماموجرام للكشف المبكر عن سرطان الثدي" },
  { service_id: "S009", service_code: "CERVICAL_PAP", service_name_ar: "مسحة عنق الرحم", service_name_en: "Cervical Cancer Screening (Pap)", category: "screening", min_age: 21, max_age: 65, gender: "female", frequency_months: 36, uspstf_grade: "A", priority: "high", risk_factors: "", description_ar: "فحص عنق الرحم للكشف المبكر عن السرطان" },
  { service_id: "S010", service_code: "COLORECTAL_FOBT", service_name_ar: "فحص سرطان القولون", service_name_en: "Colorectal Cancer Screening", category: "screening", min_age: 45, max_age: 75, gender: "both", frequency_months: 12, uspstf_grade: "A", priority: "high", risk_factors: "", description_ar: "فحص الدم الخفي في البراز أو منظار القولون" },
  { service_id: "S011", service_code: "LUNG_LDCT", service_name_ar: "فحص سرطان الرئة", service_name_en: "Lung Cancer Screening (LDCT)", category: "screening", min_age: 50, max_age: 80, gender: "both", frequency_months: 12, uspstf_grade: "B", priority: "medium", risk_factors: "smoking_20pack_years", description_ar: "أشعة مقطعية منخفضة الجرعة للمدخنين" },
  // الصحة النفسية
  { service_id: "S012", service_code: "DEPRESSION_ADULT", service_name_ar: "فحص الاكتئاب للبالغين", service_name_en: "Depression Screening (Adults)", category: "screening", min_age: 18, max_age: 120, gender: "both", frequency_months: 12, uspstf_grade: "B", priority: "medium", risk_factors: "", description_ar: "استبيان PHQ-9 للكشف عن الاكتئاب" },
  { service_id: "S013", service_code: "DEPRESSION_ADOLESCENT", service_name_ar: "فحص الاكتئاب للمراهقين", service_name_en: "Depression Screening (Adolescents)", category: "screening", min_age: 12, max_age: 17, gender: "both", frequency_months: 12, uspstf_grade: "B", priority: "medium", risk_factors: "", description_ar: "فحص الاكتئاب للمراهقين 12-17 سنة" },
  { service_id: "S014", service_code: "ANXIETY_SCREEN", service_name_ar: "فحص القلق", service_name_en: "Anxiety Screening", category: "screening", min_age: 8, max_age: 18, gender: "both", frequency_months: 12, uspstf_grade: "B", priority: "medium", risk_factors: "", description_ar: "فحص اضطرابات القلق للأطفال والمراهقين" },
  // التدخين والمواد
  { service_id: "S015", service_code: "TOBACCO_SCREEN", service_name_ar: "فحص التدخين", service_name_en: "Tobacco Use Screening", category: "screening", min_age: 12, max_age: 120, gender: "both", frequency_months: 12, uspstf_grade: "A", priority: "high", risk_factors: "", description_ar: "سؤال عن استخدام التبغ والتدخين" },
  { service_id: "S016", service_code: "TOBACCO_CESSATION", service_name_ar: "برنامج الإقلاع عن التدخين", service_name_en: "Tobacco Cessation Intervention", category: "counseling", min_age: 18, max_age: 120, gender: "both", frequency_months: 0, uspstf_grade: "A", priority: "high", risk_factors: "smoking", description_ar: "تحويل للبرنامج الوطني للإقلاع عن التدخين" },
  { service_id: "S017", service_code: "ALCOHOL_SCREEN", service_name_ar: "فحص استخدام الكحول", service_name_en: "Alcohol Misuse Screening", category: "screening", min_age: 18, max_age: 120, gender: "both", frequency_months: 12, uspstf_grade: "B", priority: "medium", risk_factors: "", description_ar: "فحص سوء استخدام الكحول" },
  // الأمراض المعدية
  { service_id: "S018", service_code: "HIV_SCREEN", service_name_ar: "فحص الإيدز", service_name_en: "HIV Screening", category: "screening", min_age: 15, max_age: 65, gender: "both", frequency_months: 0, uspstf_grade: "A", priority: "medium", risk_factors: "", description_ar: "فحص فيروس نقص المناعة (مرة واحدة على الأقل)" },
  { service_id: "S019", service_code: "HEPB_SCREEN", service_name_ar: "فحص التهاب الكبد ب", service_name_en: "Hepatitis B Screening", category: "screening", min_age: 18, max_age: 79, gender: "both", frequency_months: 0, uspstf_grade: "B", priority: "medium", risk_factors: "risk_group", description_ar: "فحص التهاب الكبد ب للفئات المعرضة" },
  { service_id: "S020", service_code: "HEPC_SCREEN", service_name_ar: "فحص التهاب الكبد سي", service_name_en: "Hepatitis C Screening", category: "screening", min_age: 18, max_age: 79, gender: "both", frequency_months: 0, uspstf_grade: "B", priority: "medium", risk_factors: "", description_ar: "فحص التهاب الكبد سي (مرة واحدة)" },
  // صحة المرأة
  { service_id: "S021", service_code: "PRECONCEPTION", service_name_ar: "استشارة ما قبل الحمل", service_name_en: "Preconception Counseling", category: "counseling", min_age: 18, max_age: 45, gender: "female", frequency_months: 0, uspstf_grade: "B", priority: "medium", risk_factors: "", description_ar: "استشارة صحية للتخطيط للحمل" },
  { service_id: "S022", service_code: "FOLIC_ACID", service_name_ar: "حمض الفوليك", service_name_en: "Folic Acid Supplementation", category: "counseling", min_age: 15, max_age: 45, gender: "female", frequency_months: 0, uspstf_grade: "A", priority: "high", risk_factors: "", description_ar: "توصية بتناول حمض الفوليك للنساء في سن الإنجاب" },
  // صحة العظام والسقوط
  { service_id: "S023", service_code: "OSTEO_SCREEN", service_name_ar: "فحص هشاشة العظام", service_name_en: "Osteoporosis Screening (DEXA)", category: "screening", min_age: 65, max_age: 120, gender: "female", frequency_months: 0, uspstf_grade: "B", priority: "medium", risk_factors: "", description_ar: "فحص كثافة العظام للنساء 65+ سنة" },
  { service_id: "S024", service_code: "FALL_PREVENTION", service_name_ar: "تقييم خطر السقوط", service_name_en: "Fall Risk Assessment", category: "screening", min_age: 65, max_age: 120, gender: "both", frequency_months: 12, uspstf_grade: "B", priority: "high", risk_factors: "", description_ar: "تقييم خطر السقوط وتدخلات الوقاية" },
  // القلب والأوعية
  { service_id: "S025", service_code: "AAA_SCREEN", service_name_ar: "فحص تمدد الشريان الأورطي", service_name_en: "AAA Screening", category: "screening", min_age: 65, max_age: 75, gender: "male", frequency_months: 0, uspstf_grade: "B", priority: "medium", risk_factors: "smoking_history", description_ar: "سونار للبطن للرجال المدخنين سابقاً" },
  { service_id: "S026", service_code: "ASCVD_RISK", service_name_ar: "تقييم خطر أمراض القلب", service_name_en: "ASCVD Risk Assessment", category: "screening", min_age: 40, max_age: 75, gender: "both", frequency_months: 60, uspstf_grade: "B", priority: "high", risk_factors: "", description_ar: "حساب خطر أمراض القلب والأوعية الدموية" },
  // فحوصات الأطفال
  { service_id: "S027", service_code: "HEARING_NEWBORN", service_name_ar: "فحص السمع للمواليد", service_name_en: "Newborn Hearing Screening", category: "screening", min_age: 0, max_age: 0, gender: "both", frequency_months: 0, uspstf_grade: "B", priority: "high", risk_factors: "", description_ar: "فحص السمع عند الولادة" },
  { service_id: "S028", service_code: "VISION_CHILD", service_name_ar: "فحص النظر للأطفال", service_name_en: "Vision Screening (Children)", category: "screening", min_age: 3, max_age: 5, gender: "both", frequency_months: 12, uspstf_grade: "B", priority: "high", risk_factors: "", description_ar: "فحص النظر للأطفال 3-5 سنوات" },
  { service_id: "S029", service_code: "AUTISM_MCHAT", service_name_ar: "فحص التوحد", service_name_en: "Autism Screening (M-CHAT)", category: "screening", min_age: 1, max_age: 2, gender: "both", frequency_months: 0, uspstf_grade: "B", priority: "high", risk_factors: "", description_ar: "استبيان M-CHAT عند 18 و 24 شهر" },
  { service_id: "S030", service_code: "DEVELOPMENTAL", service_name_ar: "تقييم التطور", service_name_en: "Developmental Screening", category: "screening", min_age: 0, max_age: 3, gender: "both", frequency_months: 6, uspstf_grade: "B", priority: "high", risk_factors: "", description_ar: "تقييم التطور الحركي والإدراكي" },
  { service_id: "S031", service_code: "ANEMIA_INFANT", service_name_ar: "فحص فقر الدم للرضع", service_name_en: "Iron Deficiency Anemia Screening", category: "screening", min_age: 0, max_age: 1, gender: "both", frequency_months: 0, uspstf_grade: "B", priority: "medium", risk_factors: "", description_ar: "فحص فقر الدم عند 9-12 شهر" },
  // فحوصات كبار السن
  { service_id: "S032", service_code: "COGNITIVE_ASSESS", service_name_ar: "تقييم الوظائف الإدراكية", service_name_en: "Cognitive Assessment", category: "screening", min_age: 65, max_age: 120, gender: "both", frequency_months: 12, uspstf_grade: "I", priority: "medium", risk_factors: "", description_ar: "فحص الذاكرة والإدراك لكبار السن" },
  { service_id: "S033", service_code: "FUNCTIONAL_ADL", service_name_ar: "تقييم الأنشطة اليومية", service_name_en: "Functional Assessment (ADL)", category: "screening", min_age: 65, max_age: 120, gender: "both", frequency_months: 12, uspstf_grade: "B", priority: "medium", risk_factors: "", description_ar: "تقييم القدرة على أداء الأنشطة اليومية" },
  { service_id: "S034", service_code: "POLYPHARMACY", service_name_ar: "مراجعة الأدوية المتعددة", service_name_en: "Medication Review", category: "counseling", min_age: 65, max_age: 120, gender: "both", frequency_months: 6, uspstf_grade: "B", priority: "high", risk_factors: "", description_ar: "مراجعة الأدوية لتجنب التداخلات" },
  { service_id: "S035", service_code: "NUTRITION_ELDERLY", service_name_ar: "تقييم سوء التغذية", service_name_en: "Malnutrition Screening", category: "screening", min_age: 65, max_age: 120, gender: "both", frequency_months: 12, uspstf_grade: "B", priority: "medium", risk_factors: "", description_ar: "فحص سوء التغذية لكبار السن" }
];

// ════════════════════════════════════════════════════════════════════════════════
// الجزء 4: IMMUNIZATIONS - التطعيمات (18 تطعيم)
// ════════════════════════════════════════════════════════════════════════════════

export const IMMUNIZATIONS: Immunization[] = [
  { vaccine_id: "V001", vaccine_name_ar: "لقاح السل (بي سي جي)", vaccine_name_en: "BCG", min_age_months: 0, max_age_years: 0, doses: 1, schedule: "عند الولادة", priority: "high" },
  { vaccine_id: "V002", vaccine_name_ar: "التهاب الكبد ب", vaccine_name_en: "Hepatitis B", min_age_months: 0, max_age_years: 18, doses: 3, schedule: "الولادة، شهرين، 6 أشهر", priority: "high" },
  { vaccine_id: "V003", vaccine_name_ar: "الثلاثي البكتيري", vaccine_name_en: "DTaP/DTP", min_age_months: 2, max_age_years: 6, doses: 5, schedule: "2، 4، 6، 18 شهر، 4-6 سنوات", priority: "high" },
  { vaccine_id: "V004", vaccine_name_ar: "شلل الأطفال", vaccine_name_en: "Polio (IPV/OPV)", min_age_months: 2, max_age_years: 6, doses: 4, schedule: "2، 4، 6-18 شهر، 4-6 سنوات", priority: "high" },
  { vaccine_id: "V005", vaccine_name_ar: "المستدمية النزلية", vaccine_name_en: "Hib", min_age_months: 2, max_age_years: 5, doses: 4, schedule: "2، 4، 6، 12-15 شهر", priority: "high" },
  { vaccine_id: "V006", vaccine_name_ar: "المكورات الرئوية", vaccine_name_en: "PCV", min_age_months: 2, max_age_years: 5, doses: 4, schedule: "2، 4، 6، 12-15 شهر", priority: "high" },
  { vaccine_id: "V007", vaccine_name_ar: "فيروس الروتا", vaccine_name_en: "Rotavirus", min_age_months: 2, max_age_years: 1, doses: 3, schedule: "2، 4، 6 أشهر", priority: "high" },
  { vaccine_id: "V008", vaccine_name_ar: "الحصبة والنكاف والحصبة الألمانية", vaccine_name_en: "MMR", min_age_months: 12, max_age_years: 6, doses: 2, schedule: "12-15 شهر، 4-6 سنوات", priority: "high" },
  { vaccine_id: "V009", vaccine_name_ar: "الجدري المائي", vaccine_name_en: "Varicella", min_age_months: 12, max_age_years: 12, doses: 2, schedule: "12-15 شهر، 4-6 سنوات", priority: "high" },
  { vaccine_id: "V010", vaccine_name_ar: "التهاب الكبد أ", vaccine_name_en: "Hepatitis A", min_age_months: 12, max_age_years: 2, doses: 2, schedule: "12-23 شهر (جرعتين)", priority: "high" },
  { vaccine_id: "V011", vaccine_name_ar: "فيروس الورم الحليمي", vaccine_name_en: "HPV", min_age_months: 108, max_age_years: 26, doses: 2, schedule: "9-14 سنة (جرعتين)، 15-26 (3 جرعات)", priority: "high" },
  { vaccine_id: "V012", vaccine_name_ar: "السحايا", vaccine_name_en: "Meningococcal (MenACWY)", min_age_months: 132, max_age_years: 21, doses: 2, schedule: "11-12 سنة، جرعة تنشيطية 16 سنة", priority: "high" },
  { vaccine_id: "V013", vaccine_name_ar: "الإنفلونزا الموسمية", vaccine_name_en: "Influenza", min_age_months: 6, max_age_years: 120, doses: 1, schedule: "سنوياً", priority: "high" },
  { vaccine_id: "V014", vaccine_name_ar: "الكزاز والدفتيريا", vaccine_name_en: "Td/Tdap", min_age_months: 84, max_age_years: 120, doses: 1, schedule: "كل 10 سنوات", priority: "medium" },
  { vaccine_id: "V015", vaccine_name_ar: "الهربس النطاقي (الحزام الناري)", vaccine_name_en: "Shingles (Shingrix)", min_age_months: 600, max_age_years: 120, doses: 2, schedule: "50+ سنة (جرعتين)", priority: "medium" },
  { vaccine_id: "V016", vaccine_name_ar: "المكورات الرئوية (بالغين)", vaccine_name_en: "Pneumococcal (PPSV23/PCV)", min_age_months: 780, max_age_years: 120, doses: 2, schedule: "65+ سنة أو عوامل خطر", priority: "high" },
  { vaccine_id: "V017", vaccine_name_ar: "كوفيد-19", vaccine_name_en: "COVID-19", min_age_months: 6, max_age_years: 120, doses: 2, schedule: "السلسلة الأساسية + جرعات تنشيطية", priority: "high" },
  { vaccine_id: "V018", vaccine_name_ar: "الفيروس التنفسي المخلوي", vaccine_name_en: "RSV", min_age_months: 720, max_age_years: 120, doses: 1, schedule: "60+ سنة (جرعة واحدة)", priority: "medium" }
];

// ════════════════════════════════════════════════════════════════════════════════
// الجزء 5: HEALTH EDUCATION - التثقيف الصحي (18 موضوع)
// ════════════════════════════════════════════════════════════════════════════════

export const HEALTH_EDUCATION: HealthEducation[] = [
  { topic_id: "E001", topic_name_ar: "الرضاعة الطبيعية", topic_name_en: "Breastfeeding", age_group: "0-2", priority: "high", format: "counseling" },
  { topic_id: "E002", topic_name_ar: "التغذية السليمة للأطفال", topic_name_en: "Child Nutrition", age_group: "0-11", priority: "high", format: "counseling" },
  { topic_id: "E003", topic_name_ar: "السلامة المنزلية", topic_name_en: "Home Safety", age_group: "0-5", priority: "high", format: "counseling" },
  { topic_id: "E004", topic_name_ar: "النمو والتطور", topic_name_en: "Growth & Development", age_group: "0-5", priority: "high", format: "counseling" },
  { topic_id: "E005", topic_name_ar: "صحة الفم والأسنان", topic_name_en: "Oral Health", age_group: "0-120", priority: "medium", format: "counseling" },
  { topic_id: "E006", topic_name_ar: "النشاط البدني", topic_name_en: "Physical Activity", age_group: "6-120", priority: "high", format: "counseling" },
  { topic_id: "E007", topic_name_ar: "التغذية الصحية", topic_name_en: "Healthy Nutrition", age_group: "6-120", priority: "high", format: "counseling" },
  { topic_id: "E008", topic_name_ar: "الوقاية من التدخين", topic_name_en: "Tobacco Prevention", age_group: "12-120", priority: "high", format: "counseling" },
  { topic_id: "E009", topic_name_ar: "الصحة النفسية", topic_name_en: "Mental Health", age_group: "12-120", priority: "high", format: "counseling" },
  { topic_id: "E010", topic_name_ar: "الصحة الإنجابية", topic_name_en: "Reproductive Health", age_group: "15-45", priority: "high", format: "counseling" },
  { topic_id: "E011", topic_name_ar: "الوقاية من السكري", topic_name_en: "Diabetes Prevention", age_group: "30-120", priority: "high", format: "counseling" },
  { topic_id: "E012", topic_name_ar: "صحة القلب", topic_name_en: "Heart Health", age_group: "30-120", priority: "high", format: "counseling" },
  { topic_id: "E013", topic_name_ar: "الوقاية من السرطان", topic_name_en: "Cancer Prevention", age_group: "40-120", priority: "high", format: "counseling" },
  { topic_id: "E014", topic_name_ar: "الوقاية من السقوط", topic_name_en: "Fall Prevention", age_group: "65-120", priority: "high", format: "counseling" },
  { topic_id: "E015", topic_name_ar: "إدارة الأدوية", topic_name_en: "Medication Management", age_group: "65-120", priority: "high", format: "counseling" },
  { topic_id: "E016", topic_name_ar: "الشيخوخة الصحية", topic_name_en: "Healthy Aging", age_group: "60-120", priority: "medium", format: "counseling" },
  { topic_id: "E017", topic_name_ar: "الوقاية من الإصابات", topic_name_en: "Injury Prevention", age_group: "0-120", priority: "medium", format: "counseling" },
  { topic_id: "E018", topic_name_ar: "التطعيمات", topic_name_en: "Immunizations", age_group: "0-120", priority: "high", format: "counseling" }
];

// ════════════════════════════════════════════════════════════════════════════════
// الجزء 6: UTILITY FUNCTIONS - الدوال المساعدة
// ════════════════════════════════════════════════════════════════════════════════

/**
 * الحصول على الفئة العمرية للمريض
 */
export const getAgeGroup = (age: number): AgeGroup | undefined => {
  return AGE_GROUPS.find(group => age >= group.min_age && age <= group.max_age);
};

/**
 * الحصول على الخدمات المؤهل لها المريض
 */
export const getEligibleServices = (
  age: number,
  gender: 'male' | 'female',
  riskFactors: string[] = []
): PreventiveService[] => {
  return PREVENTIVE_SERVICES.filter(service => {
    if (age < service.min_age || age > service.max_age) return false;
    if (service.gender !== 'both' && service.gender !== gender) return false;
    return true;
  });
};

/**
 * الحصول على التطعيمات المؤهل لها المريض
 */
export const getEligibleImmunizations = (ageMonths: number): Immunization[] => {
  return IMMUNIZATIONS.filter(vaccine => {
    const ageYears = ageMonths / 12;
    return ageMonths >= vaccine.min_age_months && ageYears <= vaccine.max_age_years;
  });
};

/**
 * الحصول على مواضيع التثقيف الصحي المناسبة
 */
export const getHealthEducationTopics = (age: number): HealthEducation[] => {
  return HEALTH_EDUCATION.filter(topic => {
    if (topic.age_group === 'all') return true;
    const [minAge, maxAge] = topic.age_group.split('-').map(Number);
    return age >= minAge && age <= maxAge;
  });
};

/**
 * حساب درجة الأولوية للمريض
 */
export const calculatePriorityScore = (eligibleServices: PreventiveService[]): number => {
  let score = 0;
  eligibleServices.forEach(service => {
    if (service.priority === 'high') score += 3;
    else if (service.priority === 'medium') score += 2;
    else score += 1;
  });
  return score;
};

/**
 * الحصول على تصنيف الأولوية
 */
export const getPriorityLabel = (score: number): { label_ar: string; label_en: string; color: string } => {
  if (score >= 10) return { label_ar: 'عالي', label_en: 'High', color: 'red' };
  if (score >= 5) return { label_ar: 'متوسط', label_en: 'Medium', color: 'yellow' };
  return { label_ar: 'منخفض', label_en: 'Low', color: 'green' };
};

/**
 * حساب العمر من تاريخ الميلاد
 */
export const calculateAge = (birthDate: string | Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// ════════════════════════════════════════════════════════════════════════════════
// الجزء 7: SUPABASE SEEDING FUNCTIONS - دوال رفع البيانات
// ════════════════════════════════════════════════════════════════════════════════

export const seedAgeGroups = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('age_groups')
      .upsert(AGE_GROUPS.map(group => ({
        ...group,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })), { onConflict: 'group_id' });
    
    if (error) throw error;
    console.log(`✅ تم رفع ${AGE_GROUPS.length} فئة عمرية`);
    return true;
  } catch (error) {
    console.error('❌ خطأ في رفع الفئات العمرية:', error);
    return false;
  }
};

export const seedPreventiveServices = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('preventive_services')
      .upsert(PREVENTIVE_SERVICES.map(service => ({
        ...service,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })), { onConflict: 'service_id' });
    
    if (error) throw error;
    console.log(`✅ تم رفع ${PREVENTIVE_SERVICES.length} خدمة وقائية`);
    return true;
  } catch (error) {
    console.error('❌ خطأ في رفع الخدمات الوقائية:', error);
    return false;
  }
};

export const seedImmunizations = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('immunizations')
      .upsert(IMMUNIZATIONS.map(vaccine => ({
        ...vaccine,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })), { onConflict: 'vaccine_id' });
    
    if (error) throw error;
    console.log(`✅ تم رفع ${IMMUNIZATIONS.length} تطعيم`);
    return true;
  } catch (error) {
    console.error('❌ خطأ في رفع التطعيمات:', error);
    return false;
  }
};

export const seedHealthEducation = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('health_education')
      .upsert(HEALTH_EDUCATION.map(topic => ({
        ...topic,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })), { onConflict: 'topic_id' });
    
    if (error) throw error;
    console.log(`✅ تم رفع ${HEALTH_EDUCATION.length} موضوع تثقيفي`);
    return true;
  } catch (error) {
    console.error('❌ خطأ في رفع التثقيف الصحي:', error);
    return false;
  }
};

export const calculateAndSaveEligibility = async (
  onProgress?: (current: number, total: number) => void
): Promise<{ success: boolean; count: number }> => {
  try {
    const { data: patients, error: fetchError } = await supabase
      .from('patients')
      .select('*');
    
    if (fetchError) throw fetchError;
    if (!patients || patients.length === 0) {
      return { success: true, count: 0 };
    }

    const eligibilityRecords: PatientEligibility[] = [];

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const age = patient.age || 0;
      const gender = patient.gender?.toLowerCase() === 'ذكر' || 
                     patient.gender?.toLowerCase() === 'male' ? 'male' : 'female';

      const eligibleServices = getEligibleServices(age, gender as 'male' | 'female');

      for (const service of eligibleServices) {
        eligibilityRecords.push({
          patient_id: patient.national_id || patient.id,
          patient_name: patient.name,
          patient_age: age,
          patient_gender: gender,
          service_id: service.service_id,
          service_code: service.service_code,
          service_name_ar: service.service_name_ar,
          is_eligible: true,
          status: 'pending',
          priority: service.priority
        });
      }

      if (onProgress) onProgress(i + 1, patients.length);
    }

    const batchSize = 500;
    for (let i = 0; i < eligibilityRecords.length; i += batchSize) {
      const batch = eligibilityRecords.slice(i, i + batchSize);
      const { error } = await supabase
        .from('patient_eligibility')
        .upsert(batch as any);
      
      if (error) throw error;
    }

    console.log(`✅ تم إنشاء ${eligibilityRecords.length} سجل أهلية لـ ${patients.length} مريض`);
    return { success: true, count: eligibilityRecords.length };
    
  } catch (error) {
    console.error('❌ خطأ في حساب الأهلية:', error);
    return { success: false, count: 0 };
  }
};

export const seedAllPreventiveCareData = async (): Promise<boolean> => {
  console.log('🚀 بدء رفع بيانات الرعاية الوقائية...');
  
  const results = {
    ageGroups: await seedAgeGroups(),
    services: await seedPreventiveServices(),
    immunizations: await seedImmunizations(),
    education: await seedHealthEducation()
  };

  const allSuccess = Object.values(results).every(r => r);
  
  if (allSuccess) {
    console.log('🎉 تم رفع جميع البيانات بنجاح!');
  } else {
    console.log('⚠️ بعض البيانات لم يتم رفعها بنجاح');
  }
  
  return allSuccess;
};
