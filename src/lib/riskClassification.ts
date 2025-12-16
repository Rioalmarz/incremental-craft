// Risk Classification Logic for Preventive Care
// Classifies patients based on their lab results

export type RiskLevel = 'طبيعي' | 'يحتاج مراقبة' | 'خطر' | 'غير معروف';

export interface LabResults {
  fasting_blood_glucose?: number | null;
  hba1c?: number | null;
  ldl?: number | null;
  bp_last_visit?: string | null;
}

export interface RiskClassificationResult {
  overall: RiskLevel;
  bp: RiskLevel;
  hba1c: RiskLevel;
  fbg: RiskLevel;
  ldl: RiskLevel;
}

// Blood Pressure Classification
// Normal: <120/<80
// Elevated: 120-129/<80
// High Stage 1: 130-139/80-89
// High Stage 2: ≥140/≥90
export const classifyBP = (bp: string | null | undefined): RiskLevel => {
  if (!bp) return 'غير معروف';
  
  const parts = bp.split('/');
  if (parts.length !== 2) return 'غير معروف';
  
  const sys = parseInt(parts[0]);
  const dia = parseInt(parts[1]);
  
  if (isNaN(sys) || isNaN(dia)) return 'غير معروف';
  
  if (sys >= 140 || dia >= 90) return 'خطر';
  if (sys >= 130 || dia >= 80) return 'يحتاج مراقبة';
  return 'طبيعي';
};

// HbA1c Classification
// Normal: <5.7%
// Prediabetes: 5.7-6.4%
// Diabetes: ≥6.5%
export const classifyHBA1C = (value: number | null | undefined): RiskLevel => {
  if (value == null) return 'غير معروف';
  
  if (value >= 6.5) return 'خطر';
  if (value >= 5.7) return 'يحتاج مراقبة';
  return 'طبيعي';
};

// Fasting Blood Glucose Classification
// Normal: <100 mg/dL
// Prediabetes: 100-125 mg/dL
// Diabetes: ≥126 mg/dL
export const classifyFBG = (value: number | null | undefined): RiskLevel => {
  if (value == null) return 'غير معروف';
  
  if (value >= 126) return 'خطر';
  if (value >= 100) return 'يحتاج مراقبة';
  return 'طبيعي';
};

// LDL Classification
// Optimal: <100 mg/dL
// Near optimal: 100-129 mg/dL
// Borderline high: 130-159 mg/dL
// High: 160-189 mg/dL
// Very high: ≥190 mg/dL
export const classifyLDL = (value: number | null | undefined): RiskLevel => {
  if (value == null) return 'غير معروف';
  
  if (value >= 160) return 'خطر';
  if (value >= 130) return 'يحتاج مراقبة';
  return 'طبيعي';
};

// Overall Risk Classification
export const classifyOverallRisk = (labs: LabResults): RiskClassificationResult => {
  const bp = classifyBP(labs.bp_last_visit);
  const hba1c = classifyHBA1C(labs.hba1c);
  const fbg = classifyFBG(labs.fasting_blood_glucose);
  const ldl = classifyLDL(labs.ldl);
  
  const classifications = [bp, hba1c, fbg, ldl].filter(c => c !== 'غير معروف');
  
  let overall: RiskLevel = 'غير معروف';
  
  if (classifications.length > 0) {
    if (classifications.includes('خطر')) {
      overall = 'خطر';
    } else if (classifications.includes('يحتاج مراقبة')) {
      overall = 'يحتاج مراقبة';
    } else {
      overall = 'طبيعي';
    }
  }
  
  return { overall, bp, hba1c, fbg, ldl };
};

// Get color for risk level
export const getRiskColor = (risk: RiskLevel): string => {
  switch (risk) {
    case 'طبيعي': return 'text-success';
    case 'يحتاج مراقبة': return 'text-warning';
    case 'خطر': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
};

export const getRiskBgColor = (risk: RiskLevel): string => {
  switch (risk) {
    case 'طبيعي': return 'bg-success/10';
    case 'يحتاج مراقبة': return 'bg-warning/10';
    case 'خطر': return 'bg-destructive/10';
    default: return 'bg-muted';
  }
};

export const getRiskBorderColor = (risk: RiskLevel): string => {
  switch (risk) {
    case 'طبيعي': return 'border-success/30';
    case 'يحتاج مراقبة': return 'border-warning/30';
    case 'خطر': return 'border-destructive/30';
    default: return 'border-border';
  }
};

export const getRiskIcon = (risk: RiskLevel): string => {
  switch (risk) {
    case 'طبيعي': return '✅';
    case 'يحتاج مراقبة': return '⚠️';
    case 'خطر': return '🔴';
    default: return '❓';
  }
};

// Get recommendations based on risk classification
export const getRecommendations = (risk: RiskLevel): string[] => {
  switch (risk) {
    case 'طبيعي':
      return [
        'متابعة سنوية روتينية',
        'الحفاظ على نمط حياة صحي',
        'تثقيف صحي مستمر',
      ];
    case 'يحتاج مراقبة':
      return [
        'إعادة الفحص خلال 3-6 أشهر',
        'تعديل نمط الحياة (غذاء، رياضة)',
        'متابعة دورية مع الفريق الصحي',
        'تثقيف مكثف حول عوامل الخطر',
      ];
    case 'خطر':
      return [
        'تحويل مباشر للطبيب',
        'بدء العلاج الدوائي إن لزم',
        'متابعة لصيقة كل شهر',
        'تقييم شامل للمضاعفات',
        'تثقيف طارئ للمستفيد',
      ];
    default:
      return ['إجراء الفحوصات اللازمة للتقييم'];
  }
};

// Eligibility for screenings based on age and gender
export interface ScreeningEligibility {
  bp: boolean;
  fbg: boolean;
  lipids: boolean;
}

export const getScreeningEligibility = (
  age: number | null,
  gender: 'male' | 'female' | string | null
): ScreeningEligibility => {
  const ageNum = age ?? 0;
  const isMale = gender === 'male' || gender === 'ذكر' || gender === 'Male';
  
  return {
    bp: ageNum >= 18, // Blood pressure screening for adults 18+
    fbg: ageNum >= 35, // Fasting blood glucose for 35+
    lipids: isMale ? ageNum >= 35 : ageNum >= 45, // Lipids: Men 35+, Women 45+
  };
};
