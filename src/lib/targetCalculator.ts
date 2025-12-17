// Dynamic Target Calculator based on age, comorbidities, and risk factors

export interface PatientProfile {
  age: number | null;
  has_dm: boolean | null;
  has_htn: boolean | null;
  has_dyslipidemia: boolean | null;
  // Additional risk factors
  hasASCVD?: boolean; // Atherosclerotic cardiovascular disease
  hasCKD?: boolean; // Chronic kidney disease
  hasHeartFailure?: boolean;
}

export interface PatientTargets {
  hba1c: {
    target: string;
    description: string;
    upperLimit: number;
  };
  bp: {
    systolic: { target: string; max: number };
    diastolic: { target: string; max: number };
    description: string;
  };
  ldl: {
    target: string;
    max: number;
    description: string;
  };
  fbg: {
    target: string;
    max: number;
    description: string;
  };
}

// HbA1c Targets based on ADA Guidelines
// شاب صحي <40: <6.5%
// بالغ 40-65: <7.0%
// كبير سن 65-70 صحي: <7.5%
// كبير سن 65-70 + أمراض: <7.5% (حتى 7.7% مقبول)
// >70 + أمراض متعددة: <8.0%
const calculateHba1cTarget = (profile: PatientProfile): PatientTargets['hba1c'] => {
  const age = profile.age ?? 0;
  const hasDM = profile.has_dm ?? false;
  const hasComorbidities = (profile.has_htn || profile.has_dyslipidemia || profile.hasASCVD || profile.hasCKD || profile.hasHeartFailure) ?? false;
  const multipleComorbidities = [profile.has_htn, profile.has_dyslipidemia, profile.hasASCVD, profile.hasCKD, profile.hasHeartFailure].filter(Boolean).length >= 2;

  // Non-diabetic patients
  if (!hasDM) {
    return {
      target: '<5.7%',
      description: 'غير مصاب بالسكري',
      upperLimit: 5.7
    };
  }

  // Age-based targets for diabetic patients
  if (age < 40) {
    return {
      target: '<6.5%',
      description: 'شاب صحي',
      upperLimit: 6.5
    };
  }

  if (age >= 40 && age < 65) {
    return {
      target: '<7.0%',
      description: 'بالغ',
      upperLimit: 7.0
    };
  }

  if (age >= 65 && age < 70) {
    if (multipleComorbidities) {
      return {
        target: '<7.7%',
        description: 'كبير سن + أمراض مصاحبة',
        upperLimit: 7.7
      };
    }
    return {
      target: '<7.5%',
      description: 'كبير سن',
      upperLimit: 7.5
    };
  }

  // Age >= 70
  if (multipleComorbidities) {
    return {
      target: '<8.0%',
      description: 'مسن + أمراض متعددة',
      upperLimit: 8.0
    };
  }
  return {
    target: '<7.5%',
    description: 'مسن',
    upperLimit: 7.5
  };
};

// BP Targets based on guidelines
// <75 + high risk: <120/80
// 65-79: <140/80
// ≥80: 140-150/90
const calculateBPTarget = (profile: PatientProfile): PatientTargets['bp'] => {
  const age = profile.age ?? 0;
  const hasHighRisk = profile.hasASCVD || profile.hasCKD || profile.hasHeartFailure;

  if (age < 65) {
    return {
      systolic: { target: '<130', max: 130 },
      diastolic: { target: '<80', max: 80 },
      description: 'بالغ'
    };
  }

  if (age < 75 && hasHighRisk) {
    return {
      systolic: { target: '<120', max: 120 },
      diastolic: { target: '<80', max: 80 },
      description: 'خطورة عالية'
    };
  }

  if (age >= 65 && age < 80) {
    return {
      systolic: { target: '<140', max: 140 },
      diastolic: { target: '<80', max: 80 },
      description: 'كبير سن'
    };
  }

  // Age >= 80
  return {
    systolic: { target: '<150', max: 150 },
    diastolic: { target: '<90', max: 90 },
    description: 'مسن'
  };
};

// LDL Targets
// ASCVD: <55 mg/dL
// High risk (DM + HTN): <70 mg/dL
// Standard: <100 mg/dL
const calculateLDLTarget = (profile: PatientProfile): PatientTargets['ldl'] => {
  if (profile.hasASCVD) {
    return {
      target: '<55',
      max: 55,
      description: 'خطورة عالية جداً (ASCVD)'
    };
  }

  // High risk: DM with HTN or multiple risk factors
  const hasHighRisk = profile.has_dm && (profile.has_htn || profile.has_dyslipidemia);
  if (hasHighRisk) {
    return {
      target: '<70',
      max: 70,
      description: 'خطورة عالية'
    };
  }

  return {
    target: '<100',
    max: 100,
    description: 'معياري'
  };
};

// FBG Targets
// Normal: <100 mg/dL
// Diabetic with good control: <130 mg/dL fasting
const calculateFBGTarget = (profile: PatientProfile): PatientTargets['fbg'] => {
  if (!profile.has_dm) {
    return {
      target: '<100',
      max: 100,
      description: 'غير مصاب بالسكري'
    };
  }

  return {
    target: '<130',
    max: 130,
    description: 'مصاب بالسكري'
  };
};

// Main function to calculate all targets
export const calculatePatientTargets = (profile: PatientProfile): PatientTargets => {
  return {
    hba1c: calculateHba1cTarget(profile),
    bp: calculateBPTarget(profile),
    ldl: calculateLDLTarget(profile),
    fbg: calculateFBGTarget(profile)
  };
};

// Check if a value is at target
export const isAtTarget = (
  value: number | null | undefined,
  target: number,
  comparison: 'less' | 'lessOrEqual' = 'less'
): boolean | null => {
  if (value == null) return null;
  return comparison === 'less' ? value < target : value <= target;
};

// Get target status text and color
export const getTargetStatus = (
  value: number | null | undefined,
  targetMax: number
): { status: string; isAtTarget: boolean | null; colorClass: string } => {
  if (value == null) {
    return { status: 'لا توجد قراءة', isAtTarget: null, colorClass: 'text-muted-foreground' };
  }
  
  if (value < targetMax) {
    return { status: 'ضمن الهدف ✓', isAtTarget: true, colorClass: 'text-success' };
  }
  
  const percentOver = ((value - targetMax) / targetMax) * 100;
  if (percentOver <= 10) {
    return { status: 'قريب من الهدف', isAtTarget: false, colorClass: 'text-warning' };
  }
  
  return { status: 'يحتاج تحسين', isAtTarget: false, colorClass: 'text-destructive' };
};

// Get BP target status
export const getBPTargetStatus = (
  bp: string | null | undefined,
  targetSystolic: number,
  targetDiastolic: number
): { status: string; isAtTarget: boolean | null; colorClass: string } => {
  if (!bp) {
    return { status: 'لا توجد قراءة', isAtTarget: null, colorClass: 'text-muted-foreground' };
  }
  
  const parts = bp.split('/');
  if (parts.length !== 2) {
    return { status: 'قراءة غير صالحة', isAtTarget: null, colorClass: 'text-muted-foreground' };
  }
  
  const sys = parseInt(parts[0]);
  const dia = parseInt(parts[1]);
  
  if (isNaN(sys) || isNaN(dia)) {
    return { status: 'قراءة غير صالحة', isAtTarget: null, colorClass: 'text-muted-foreground' };
  }
  
  if (sys < targetSystolic && dia < targetDiastolic) {
    return { status: 'ضمن الهدف ✓', isAtTarget: true, colorClass: 'text-success' };
  }
  
  if (sys <= targetSystolic + 10 && dia <= targetDiastolic + 5) {
    return { status: 'قريب من الهدف', isAtTarget: false, colorClass: 'text-warning' };
  }
  
  return { status: 'يحتاج تحسين', isAtTarget: false, colorClass: 'text-destructive' };
};
