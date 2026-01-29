// AI Prediction Engine for Chronic Disease Management
// محرك التنبؤ بالذكاء الاصطناعي لإدارة الأمراض المزمنة

export interface PatientData {
  id: string;
  name: string;
  name_en?: string;
  age?: number;
  gender?: string;
  
  // Disease flags
  has_dm?: boolean;
  has_htn?: boolean;
  has_dyslipidemia?: boolean;
  
  // Lab results
  hba1c?: number;
  ldl?: number;
  fasting_blood_glucose?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  bmi?: number;
  
  // Visit data
  visit_count?: number;
  last_visit_date?: string;
  predicted_visit_date?: string;
  days_until_visit?: number;
  avg_days_between_visits?: number;
  
  // Medication data
  dm_medications_count?: number;
  htn_medications_count?: number;
  dlp_medications_count?: number;
  anticoagulant_count?: number;
  total_chronic_meds?: number;
  
  // Registration & patterns
  registration_status?: string;
  dispensing_pattern?: string;
  
  // Existing prediction data (from import)
  dm_prediction_index?: number;
  htn_prediction_index?: number;
  ldl_prediction_index?: number;
  priority_level?: string;
  priority_reason?: string;
  suggested_action?: string;
  prediction_confidence?: number;
}

export interface PredictionResult {
  dmPredictionIndex: number;
  htnPredictionIndex: number;
  ldlPredictionIndex: number;
  overallPredictionIndex: number;
  priorityLevel: 'استشاري + مثقف صحي' | 'أولوية عالية' | 'روتيني';
  priorityReason: string;
  suggestedAction: string;
  confidence: number;
  riskFactors: string[];
}

/**
 * Calculate Diabetes Prediction Index (0-100)
 * Based on: HbA1c, visit frequency, medication count, registration status
 */
export const calculateDMPredictionIndex = (patient: PatientData): number => {
  // If already has imported prediction, use it
  if (patient.dm_prediction_index !== undefined && patient.dm_prediction_index !== null) {
    return patient.dm_prediction_index;
  }
  
  let score = 0;
  
  // Has diabetes flag (baseline)
  if (!patient.has_dm) return 0;
  
  // Visit frequency score (max 30 points)
  const visits = patient.visit_count || 0;
  score += Math.min(visits * 5, 30);
  
  // Registration status score (max 20 points)
  const regStatus = patient.registration_status?.toLowerCase() || '';
  if (regStatus.includes('مؤهل') && regStatus.includes('مسجل')) {
    score += 20;
  } else if (regStatus.includes('مسجل')) {
    score += 15;
  } else if (regStatus.includes('زيارتين')) {
    score += 10;
  } else if (regStatus.includes('زيارة')) {
    score += 5;
  }
  
  // Medication count score (max 20 points)
  const dmMeds = patient.dm_medications_count || 0;
  score += Math.min(dmMeds * 10, 20);
  
  // HbA1c control score (max 30 points)
  const hba1c = patient.hba1c;
  if (hba1c !== undefined && hba1c !== null) {
    if (hba1c < 7) {
      score += 30; // Excellent control
    } else if (hba1c < 8) {
      score += 20; // Good control
    } else if (hba1c < 9) {
      score += 10; // Moderate control
    }
    // Poor control (>=9) adds 0 points
  } else {
    score += 15; // No data - neutral
  }
  
  return Math.min(Math.round(score), 100);
};

/**
 * Calculate Hypertension Prediction Index (0-100)
 * Based on: Blood pressure readings, medication count, visit frequency
 */
export const calculateHTNPredictionIndex = (patient: PatientData): number => {
  // If already has imported prediction, use it
  if (patient.htn_prediction_index !== undefined && patient.htn_prediction_index !== null) {
    return patient.htn_prediction_index;
  }
  
  let score = 0;
  
  // Has hypertension flag (baseline)
  if (!patient.has_htn) return 0;
  
  // Visit frequency score (max 25 points)
  const visits = patient.visit_count || 0;
  score += Math.min(visits * 5, 25);
  
  // Medication count score (max 25 points)
  const htnMeds = patient.htn_medications_count || 0;
  score += Math.min(htnMeds * 10, 25);
  
  // Blood pressure control score (max 50 points)
  const systolic = patient.systolic_bp;
  const diastolic = patient.diastolic_bp;
  
  if (systolic !== undefined && diastolic !== undefined) {
    // Normal: <120/80
    if (systolic < 120 && diastolic < 80) {
      score += 50;
    }
    // Elevated: 120-129/<80
    else if (systolic < 130 && diastolic < 80) {
      score += 40;
    }
    // Stage 1: 130-139/80-89
    else if (systolic < 140 && diastolic < 90) {
      score += 30;
    }
    // Stage 2: >=140/>=90
    else if (systolic < 160 && diastolic < 100) {
      score += 15;
    }
    // Hypertensive Crisis: >180/>120
    // Adds 0 points
  } else {
    score += 25; // No data - neutral
  }
  
  return Math.min(Math.round(score), 100);
};

/**
 * Calculate Dyslipidemia Prediction Index (0-100)
 * Based on: LDL levels, BMI, medication count
 */
export const calculateLDLPredictionIndex = (patient: PatientData): number => {
  // If already has imported prediction, use it
  if (patient.ldl_prediction_index !== undefined && patient.ldl_prediction_index !== null) {
    return patient.ldl_prediction_index;
  }
  
  let score = 0;
  
  // Has dyslipidemia flag (baseline)
  if (!patient.has_dyslipidemia) return 0;
  
  // Medication count score (max 30 points)
  const dlpMeds = patient.dlp_medications_count || 0;
  score += Math.min(dlpMeds * 15, 30);
  
  // LDL control score (max 50 points)
  const ldl = patient.ldl;
  if (ldl !== undefined && ldl !== null) {
    // Optimal: <100
    if (ldl < 100) {
      score += 50;
    }
    // Near optimal: 100-129
    else if (ldl < 130) {
      score += 40;
    }
    // Borderline high: 130-159
    else if (ldl < 160) {
      score += 25;
    }
    // High: 160-189
    else if (ldl < 190) {
      score += 10;
    }
    // Very high: >=190
    // Adds 0 points
  } else {
    score += 25; // No data - neutral
  }
  
  // BMI score (max 20 points)
  const bmi = patient.bmi;
  if (bmi !== undefined && bmi !== null) {
    if (bmi < 25) {
      score += 20; // Normal weight
    } else if (bmi < 30) {
      score += 10; // Overweight
    }
    // Obese: adds 0 points
  } else {
    score += 10; // No data - neutral
  }
  
  return Math.min(Math.round(score), 100);
};

/**
 * Determine Priority Level based on clinical thresholds
 */
export const determinePriorityLevel = (patient: PatientData): {
  level: 'استشاري + مثقف صحي' | 'أولوية عالية' | 'روتيني';
  reason: string;
  action: string;
} => {
  // If already has imported priority, use it
  if (patient.priority_level) {
    return {
      level: patient.priority_level as any,
      reason: patient.priority_reason || '',
      action: patient.suggested_action || '',
    };
  }
  
  const hba1c = patient.hba1c;
  const ldl = patient.ldl;
  const systolic = patient.systolic_bp;
  const diastolic = patient.diastolic_bp;
  
  // Critical thresholds - Consultant + Health Educator
  if (hba1c && hba1c >= 12) {
    return {
      level: 'استشاري + مثقف صحي',
      reason: `HbA1c=${hba1c}%`,
      action: 'تحويل فوري للاستشاري في نفس المركز + إشراك المثقف الصحي',
    };
  }
  
  if (ldl && ldl >= 190) {
    return {
      level: 'استشاري + مثقف صحي',
      reason: `LDL=${Math.round(ldl)}`,
      action: 'تحويل فوري للاستشاري في نفس المركز + إشراك المثقف الصحي',
    };
  }
  
  if (systolic && systolic >= 180) {
    return {
      level: 'استشاري + مثقف صحي',
      reason: `BP=${systolic}/${diastolic || '-'}`,
      action: 'تحويل فوري للاستشاري + مراقبة الضغط المستمرة',
    };
  }
  
  // High Priority thresholds
  if (hba1c && hba1c >= 9) {
    return {
      level: 'أولوية عالية',
      reason: `HbA1c=${hba1c}%`,
      action: 'متابعة مكثفة كل 3 أشهر + مراجعة الخطة العلاجية',
    };
  }
  
  if (ldl && ldl >= 160) {
    return {
      level: 'أولوية عالية',
      reason: `LDL=${Math.round(ldl)}`,
      action: 'متابعة مكثفة + تعديل أدوية الدهون',
    };
  }
  
  if (systolic && systolic >= 160) {
    return {
      level: 'أولوية عالية',
      reason: `BP=${systolic}/${diastolic || '-'}`,
      action: 'متابعة أسبوعية للضغط + تعديل الأدوية',
    };
  }
  
  // Routine
  return {
    level: 'روتيني',
    reason: 'مؤشرات طبيعية',
    action: 'متابعة روتينية حسب الجدول المعتاد',
  };
};

/**
 * Identify Risk Factors for the patient
 */
export const identifyRiskFactors = (patient: PatientData): string[] => {
  const risks: string[] = [];
  
  const hba1c = patient.hba1c;
  const ldl = patient.ldl;
  const systolic = patient.systolic_bp;
  const bmi = patient.bmi;
  const age = patient.age;
  
  if (hba1c && hba1c >= 7) {
    risks.push(`ارتفاع السكر التراكمي (${hba1c}%)`);
  }
  
  if (ldl && ldl >= 130) {
    risks.push(`ارتفاع الكولسترول الضار (${Math.round(ldl)})`);
  }
  
  if (systolic && systolic >= 140) {
    risks.push(`ارتفاع ضغط الدم (${systolic})`);
  }
  
  if (bmi && bmi >= 30) {
    risks.push(`سمنة (BMI=${bmi.toFixed(1)})`);
  }
  
  if (age && age >= 65) {
    risks.push(`عمر متقدم (${age} سنة)`);
  }
  
  // Multiple chronic conditions
  const conditions = [patient.has_dm, patient.has_htn, patient.has_dyslipidemia].filter(Boolean).length;
  if (conditions >= 3) {
    risks.push('أمراض مزمنة متعددة');
  }
  
  return risks;
};

/**
 * Calculate Overall Prediction Confidence
 */
export const calculateConfidence = (patient: PatientData): number => {
  // If already has imported confidence, use it
  if (patient.prediction_confidence !== undefined && patient.prediction_confidence !== null) {
    return patient.prediction_confidence;
  }
  
  let dataPoints = 0;
  let maxPoints = 0;
  
  // Lab data availability
  if (patient.hba1c !== undefined && patient.hba1c !== null) dataPoints += 20;
  maxPoints += 20;
  
  if (patient.ldl !== undefined && patient.ldl !== null) dataPoints += 15;
  maxPoints += 15;
  
  if (patient.systolic_bp !== undefined && patient.systolic_bp !== null) dataPoints += 15;
  maxPoints += 15;
  
  if (patient.bmi !== undefined && patient.bmi !== null) dataPoints += 10;
  maxPoints += 10;
  
  // Visit data availability
  if (patient.visit_count !== undefined && patient.visit_count !== null && patient.visit_count > 0) dataPoints += 20;
  maxPoints += 20;
  
  // Medication data availability
  const totalMeds = (patient.dm_medications_count || 0) + (patient.htn_medications_count || 0) + (patient.dlp_medications_count || 0);
  if (totalMeds > 0) dataPoints += 20;
  maxPoints += 20;
  
  return maxPoints > 0 ? Math.round((dataPoints / maxPoints) * 100) : 0;
};

/**
 * Main function to generate complete prediction for a patient
 */
export const generatePrediction = (patient: PatientData): PredictionResult => {
  const dmIndex = calculateDMPredictionIndex(patient);
  const htnIndex = calculateHTNPredictionIndex(patient);
  const ldlIndex = calculateLDLPredictionIndex(patient);
  
  const priority = determinePriorityLevel(patient);
  const riskFactors = identifyRiskFactors(patient);
  const confidence = calculateConfidence(patient);
  
  // Calculate overall index (weighted average based on patient's conditions)
  let totalWeight = 0;
  let weightedSum = 0;
  
  if (patient.has_dm) {
    weightedSum += dmIndex * 1;
    totalWeight += 1;
  }
  if (patient.has_htn) {
    weightedSum += htnIndex * 1;
    totalWeight += 1;
  }
  if (patient.has_dyslipidemia) {
    weightedSum += ldlIndex * 1;
    totalWeight += 1;
  }
  
  const overallIndex = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  
  return {
    dmPredictionIndex: dmIndex,
    htnPredictionIndex: htnIndex,
    ldlPredictionIndex: ldlIndex,
    overallPredictionIndex: overallIndex,
    priorityLevel: priority.level,
    priorityReason: priority.reason,
    suggestedAction: priority.action,
    confidence,
    riskFactors,
  };
};

/**
 * Batch process patients for prediction statistics
 */
export const calculatePredictionStatistics = (patients: PatientData[]): {
  avgDMIndex: number;
  avgHTNIndex: number;
  avgLDLIndex: number;
  avgConfidence: number;
  priorityDistribution: {
    consultant: number;
    high: number;
    routine: number;
  };
  totalWithPredictions: number;
} => {
  let dmSum = 0, dmCount = 0;
  let htnSum = 0, htnCount = 0;
  let ldlSum = 0, ldlCount = 0;
  let confSum = 0, confCount = 0;
  
  const priorities = { consultant: 0, high: 0, routine: 0 };
  let withPredictions = 0;
  
  for (const patient of patients) {
    const prediction = generatePrediction(patient);
    
    if (patient.has_dm && prediction.dmPredictionIndex > 0) {
      dmSum += prediction.dmPredictionIndex;
      dmCount++;
    }
    
    if (patient.has_htn && prediction.htnPredictionIndex > 0) {
      htnSum += prediction.htnPredictionIndex;
      htnCount++;
    }
    
    if (patient.has_dyslipidemia && prediction.ldlPredictionIndex > 0) {
      ldlSum += prediction.ldlPredictionIndex;
      ldlCount++;
    }
    
    if (prediction.confidence > 0) {
      confSum += prediction.confidence;
      confCount++;
      withPredictions++;
    }
    
    if (prediction.priorityLevel === 'استشاري + مثقف صحي') {
      priorities.consultant++;
    } else if (prediction.priorityLevel === 'أولوية عالية') {
      priorities.high++;
    } else {
      priorities.routine++;
    }
  }
  
  return {
    avgDMIndex: dmCount > 0 ? Math.round(dmSum / dmCount) : 0,
    avgHTNIndex: htnCount > 0 ? Math.round(htnSum / htnCount) : 0,
    avgLDLIndex: ldlCount > 0 ? Math.round(ldlSum / ldlCount) : 0,
    avgConfidence: confCount > 0 ? Math.round(confSum / confCount) : 0,
    priorityDistribution: priorities,
    totalWithPredictions: withPredictions,
  };
};
