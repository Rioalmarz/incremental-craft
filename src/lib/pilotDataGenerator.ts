// Pilot Data Generator - Automatically populates pilot data with realistic distributions
// Based on the pilot specifications:
// - 61% contacted
// - 39% not contacted
// - From contacted: 81% service delivered, 19% not delivered

export const PILOT_CONFIG = {
  contactedRate: 0.61,
  serviceDeliveredRate: 0.81,
  predictionAccuracy: 31,
};

export const NON_DELIVERY_REASONS = [
  "لا توجد حاجة طبية حالياً",
  "رفض المستفيد",
  "عدم اكتمال المتطلبات",
  "تعذر التنسيق",
  "أسباب تشغيلية أخرى",
];

export const NON_CONTACT_REASONS = [
  "لم يرد على الاتصال",
  "رقم الهاتف غير صحيح",
  "خارج نطاق التغطية",
  "الرقم مغلق",
  "أسباب أخرى",
];

export interface PilotPatientData {
  contacted: boolean;
  contact_date: string | null;
  service_delivered: boolean | null;
  non_delivery_reason: string | null;
  satisfaction_score: number | null;
  provider_satisfaction_score: number | null;
  risk_classification: string | null;
}

// Seeded random for consistent results
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

// Generate pilot data for a patient based on their ID (deterministic)
export const generatePilotDataForPatient = (
  patientIdHash: number,
  patientAge: number | null,
  labResults?: {
    fasting_blood_glucose?: number | null;
    hba1c?: number | null;
    ldl?: number | null;
    bp_last_visit?: string | null;
  }
): PilotPatientData => {
  const random1 = seededRandom(patientIdHash);
  const random2 = seededRandom(patientIdHash + 1);
  const random3 = seededRandom(patientIdHash + 2);
  const random4 = seededRandom(patientIdHash + 3);
  
  const contacted = random1 < PILOT_CONFIG.contactedRate;
  
  if (!contacted) {
    return {
      contacted: false,
      contact_date: null,
      service_delivered: null,
      non_delivery_reason: null,
      satisfaction_score: null,
      provider_satisfaction_score: null,
      risk_classification: calculateRiskClassification(patientAge, labResults),
    };
  }
  
  const service_delivered = random2 < PILOT_CONFIG.serviceDeliveredRate;
  
  // Generate contact date within last 3 months
  const daysAgo = Math.floor(random3 * 90);
  const contactDate = new Date();
  contactDate.setDate(contactDate.getDate() - daysAgo);
  
  return {
    contacted: true,
    contact_date: contactDate.toISOString().split('T')[0],
    service_delivered,
    non_delivery_reason: service_delivered 
      ? null 
      : NON_DELIVERY_REASONS[Math.floor(random4 * NON_DELIVERY_REASONS.length)],
    satisfaction_score: service_delivered ? Math.floor(3 + random3 * 2) : null, // 3-5
    provider_satisfaction_score: service_delivered ? Math.floor(3 + random4 * 2) : null, // 3-5
    risk_classification: calculateRiskClassification(patientAge, labResults),
  };
};

// Calculate risk classification based on lab results
const calculateRiskClassification = (
  age: number | null,
  labResults?: {
    fasting_blood_glucose?: number | null;
    hba1c?: number | null;
    ldl?: number | null;
    bp_last_visit?: string | null;
  }
): string => {
  if (!labResults) return "غير معروف";
  
  let riskScore = 0;
  let hasData = false;
  
  // Check fasting blood glucose
  if (labResults.fasting_blood_glucose != null) {
    hasData = true;
    if (labResults.fasting_blood_glucose >= 126) riskScore += 2;
    else if (labResults.fasting_blood_glucose >= 100) riskScore += 1;
  }
  
  // Check HbA1c
  if (labResults.hba1c != null) {
    hasData = true;
    if (labResults.hba1c >= 6.5) riskScore += 2;
    else if (labResults.hba1c >= 5.7) riskScore += 1;
  }
  
  // Check LDL
  if (labResults.ldl != null) {
    hasData = true;
    if (labResults.ldl >= 160) riskScore += 2;
    else if (labResults.ldl >= 130) riskScore += 1;
  }
  
  // Check blood pressure
  if (labResults.bp_last_visit) {
    hasData = true;
    const parts = labResults.bp_last_visit.split('/');
    if (parts.length === 2) {
      const sys = parseInt(parts[0]);
      const dia = parseInt(parts[1]);
      if (!isNaN(sys) && !isNaN(dia)) {
        if (sys >= 140 || dia >= 90) riskScore += 2;
        else if (sys >= 130 || dia >= 80) riskScore += 1;
      }
    }
  }
  
  if (!hasData) return "غير معروف";
  
  if (riskScore >= 4) return "خطر";
  if (riskScore >= 2) return "يحتاج مراقبة";
  return "طبيعي";
};

// Hash function for patient ID to ensure deterministic results
export const hashPatientId = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Calculate pilot statistics for a set of patients
export interface PilotStatistics {
  total: number;
  contacted: number;
  notContacted: number;
  contactedRate: number;
  serviceDelivered: number;
  serviceNotDelivered: number;
  serviceDeliveredRate: number;
  nonDeliveryReasons: { reason: string; count: number }[];
  avgSatisfactionScore: number;
  avgProviderSatisfactionScore: number;
  riskDistribution: { classification: string; count: number }[];
}

export const calculatePilotStatistics = (
  patients: Array<{
    id: string;
    age?: number | null;
    fasting_blood_glucose?: number | null;
    hba1c?: number | null;
    ldl?: number | null;
    bp_last_visit?: string | null;
    contacted?: boolean;
    service_delivered?: boolean | null;
    non_delivery_reason?: string | null;
    satisfaction_score?: number | null;
    provider_satisfaction_score?: number | null;
    risk_classification?: string | null;
  }>
): PilotStatistics => {
  const total = patients.length;
  
  // Generate pilot data for each patient
  const patientsWithPilotData = patients.map(p => {
    // If patient already has pilot data from DB, use it
    if (p.contacted !== undefined && p.contacted !== null) {
      return p;
    }
    // Otherwise generate it
    const pilotData = generatePilotDataForPatient(
      hashPatientId(p.id),
      p.age ?? null,
      {
        fasting_blood_glucose: p.fasting_blood_glucose,
        hba1c: p.hba1c,
        ldl: p.ldl,
        bp_last_visit: p.bp_last_visit,
      }
    );
    return { ...p, ...pilotData };
  });
  
  const contacted = patientsWithPilotData.filter(p => p.contacted).length;
  const notContacted = total - contacted;
  
  const contactedPatients = patientsWithPilotData.filter(p => p.contacted);
  const serviceDelivered = contactedPatients.filter(p => p.service_delivered).length;
  const serviceNotDelivered = contactedPatients.length - serviceDelivered;
  
  // Count non-delivery reasons
  const reasonCounts = new Map<string, number>();
  contactedPatients
    .filter(p => !p.service_delivered && p.non_delivery_reason)
    .forEach(p => {
      const count = reasonCounts.get(p.non_delivery_reason!) || 0;
      reasonCounts.set(p.non_delivery_reason!, count + 1);
    });
  
  const nonDeliveryReasons = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
  
  // Calculate average satisfaction scores
  const satisfactionScores = contactedPatients
    .filter(p => p.satisfaction_score != null)
    .map(p => p.satisfaction_score!);
  const avgSatisfactionScore = satisfactionScores.length > 0
    ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length
    : 0;
  
  const providerScores = contactedPatients
    .filter(p => p.provider_satisfaction_score != null)
    .map(p => p.provider_satisfaction_score!);
  const avgProviderSatisfactionScore = providerScores.length > 0
    ? providerScores.reduce((a, b) => a + b, 0) / providerScores.length
    : 0;
  
  // Count risk classifications
  const riskCounts = new Map<string, number>();
  patientsWithPilotData.forEach(p => {
    const classification = p.risk_classification || "غير معروف";
    riskCounts.set(classification, (riskCounts.get(classification) || 0) + 1);
  });
  
  const riskDistribution = Array.from(riskCounts.entries())
    .map(([classification, count]) => ({ classification, count }));
  
  return {
    total,
    contacted,
    notContacted,
    contactedRate: total > 0 ? (contacted / total) * 100 : 0,
    serviceDelivered,
    serviceNotDelivered,
    serviceDeliveredRate: contactedPatients.length > 0 
      ? (serviceDelivered / contactedPatients.length) * 100 
      : 0,
    nonDeliveryReasons,
    avgSatisfactionScore,
    avgProviderSatisfactionScore,
    riskDistribution,
  };
};
