// Smart Column Mapping System - Intelligent field matching for Excel imports

import { getCustomFields, CustomField, FieldOption } from '@/components/CustomFieldManager';

export interface FieldMapping {
  dbField: string;
  displayName: string;
  keywords: string[];
  required?: boolean;
  targetTable?: string;
  dataType?: 'text' | 'number' | 'boolean' | 'date' | 'select';
  options?: FieldOption[]; // Updated to use FieldOption structure
  isCustom?: boolean;
}

// Field mappings for patients table
export const patientFieldMappings: FieldMapping[] = [
  {
    dbField: "national_id",
    displayName: "رقم الهوية",
    keywords: ["national number", "national_number", "national id", "رقم الهوية", "id_number", "iqama", "هوية", "الهوية"],
    required: true,
  },
  {
    dbField: "name",
    displayName: "الاسم",
    keywords: ["full name", "name", "الاسم", "patient name", "اسم المستفيد", "full name (arabic)", "full_name_ar", "اسم"],
    required: true,
  },
  {
    dbField: "age",
    displayName: "العمر",
    keywords: ["age", "العمر", "patient_age", "عمر"],
  },
  {
    dbField: "gender",
    displayName: "الجنس",
    keywords: ["gender", "الجنس", "sex", "patient_gender", "جنس"],
  },
  {
    dbField: "phone",
    displayName: "رقم الهاتف",
    keywords: ["phone", "phone_number", "رقم الهاتف", "هاتف", "جوال", "mobile", "telephone"],
  },
  {
    dbField: "has_dm",
    displayName: "مستفيد سكري",
    keywords: ["is diabetic", "diabetes", "dm", "سكري", "diabetic", "isdiabetic", "السكري"],
  },
  {
    dbField: "has_htn",
    displayName: "مستفيد ضغط",
    keywords: ["is hypertensive", "hypertension", "htn", "ضغط", "blood pressure", "ishypertensive", "الضغط"],
  },
  {
    dbField: "has_dyslipidemia",
    displayName: "مستفيد دهون",
    keywords: ["is dyslipidemic", "dyslipidemia", "dlp", "دهون", "lipids", "isdyslipidemic", "الدهون"],
  },
  {
    dbField: "burden",
    displayName: "العبء",
    keywords: ["burden", "burden category", "العبء", "severity", "burden_category"],
  },
  {
    dbField: "center_id",
    displayName: "المركز",
    keywords: ["center", "preferred center", "المركز", "health center", "preferred_center", "مركز"],
  },
  {
    dbField: "doctor",
    displayName: "الطبيب",
    keywords: ["doctor", "preferred doctor", "الطبيب", "physician", "preferred_doctor", "طبيب"],
  },
  {
    dbField: "team",
    displayName: "الفريق",
    keywords: ["team", "الفريق", "medical team", "فريق"],
  },
  {
    dbField: "days_until_visit",
    displayName: "أيام للزيارة",
    keywords: ["days until visit", "days_until_visit", "أيام للزيارة", "days"],
  },
  {
    dbField: "urgency_status",
    displayName: "حالة الطوارئ",
    keywords: ["urgency", "urgency_status", "حالة الطوارئ", "urgency status"],
  },
  {
    dbField: "predicted_visit_date",
    displayName: "تاريخ الزيارة المتوقع",
    keywords: ["predicted visit", "new_predicted_visit", "تاريخ الزيارة", "visit date", "predicted_visit_date"],
  },
  {
    dbField: "medications",
    displayName: "الأدوية",
    keywords: ["medications", "current medications", "الأدوية", "drugs", "chronic_medications_list", "أدوية", "medicine"],
  },
  // New fields - Source and visits
  {
    dbField: "source",
    displayName: "المصدر",
    keywords: ["source", "المصدر", "data source", "مصدر البيانات"],
  },
  {
    dbField: "visit_count",
    displayName: "عدد الزيارات",
    keywords: ["visit count", "visit_count", "عدد الزيارات", "visits", "total visits", "number of visits"],
  },
  // Health status
  {
    dbField: "obesity_class",
    displayName: "تصنيف السمنة",
    keywords: ["obesity", "obesity_class", "تصنيف السمنة", "السمنة", "bmi class", "weight class"],
  },
  {
    dbField: "smoking_status",
    displayName: "حالة التدخين",
    keywords: ["smoking", "smoking_status", "تدخين", "حالة التدخين", "مدخن", "smoker"],
  },
  // Screening eligibility
  {
    dbField: "eligible_dm_screening",
    displayName: "مؤهل لفحص السكري",
    keywords: ["dm screening", "eligible_dm_screening", "مؤهل لفحص السكري", "diabetes screening", "فحص السكري"],
  },
  {
    dbField: "eligible_htn_screening",
    displayName: "مؤهل لفحص الضغط",
    keywords: ["htn screening", "eligible_htn_screening", "مؤهل لفحص الضغط", "hypertension screening", "فحص الضغط"],
  },
  {
    dbField: "eligible_dlp_screening",
    displayName: "مؤهل لفحص الدهون",
    keywords: ["dlp screening", "eligible_dlp_screening", "مؤهل لفحص الدهون", "dyslipidemia screening", "فحص الدهون"],
  },
  // Lab results
  {
    dbField: "fasting_blood_glucose",
    displayName: "سكر صائم",
    keywords: ["fasting glucose", "fasting_blood_glucose", "سكر صائم", "fbg", "fasting blood sugar"],
  },
  {
    dbField: "hba1c",
    displayName: "السكر التراكمي",
    keywords: ["hba1c", "a1c", "السكر التراكمي", "تراكمي", "hemoglobin a1c", "glycated hemoglobin"],
  },
  {
    dbField: "ldl",
    displayName: "الكولسترول الضار",
    keywords: ["ldl", "ldl cholesterol", "الكولسترول الضار", "ldl_cholesterol", "bad cholesterol"],
  },
  {
    dbField: "bp_last_visit",
    displayName: "ضغط آخر زيارة",
    keywords: ["bp last visit", "bp_last_visit", "ضغط آخر زيارة", "blood pressure", "last bp"],
  },
  // Advanced medication
  {
    dbField: "latest_prescription_date",
    displayName: "تاريخ آخر وصفة",
    keywords: ["prescription date", "latest_prescription_date", "تاريخ آخر وصفة", "last prescription", "آخر وصفة"],
  },
  {
    dbField: "chronic_risk_score",
    displayName: "درجة خطورة الأمراض المزمنة",
    keywords: ["risk score", "chronic_risk_score", "درجة الخطورة", "chronic risk", "مخاطر الأمراض المزمنة"],
  },
  {
    dbField: "predicted_medications",
    displayName: "الأدوية المتوقعة",
    keywords: ["predicted medications", "predicted_medications", "الأدوية المتوقعة", "expected medications"],
  },
  {
    dbField: "prescription_with_dosage",
    displayName: "الوصفة مع الجرعة",
    keywords: ["prescription with dosage", "prescription_with_dosage", "الوصفة مع الجرعة", "dosage", "جرعة"],
  },
  {
    dbField: "medication_categories",
    displayName: "فئات الأدوية",
    keywords: ["medication categories", "medication_categories", "فئات الأدوية", "drug categories", "med categories"],
  },
  {
    dbField: "total_chronic_meds",
    displayName: "إجمالي الأدوية المزمنة",
    keywords: ["total chronic meds", "total_chronic_meds", "إجمالي الأدوية", "chronic medication count", "عدد الأدوية المزمنة"],
  },
  {
    dbField: "med_prediction_confidence",
    displayName: "دقة التنبؤ بالأدوية",
    keywords: ["prediction confidence", "med_prediction_confidence", "دقة التنبؤ", "medication confidence", "confidence"],
  },
  {
    dbField: "clinical_validation",
    displayName: "التحقق السريري",
    keywords: ["clinical validation", "clinical_validation", "التحقق السريري", "validation", "تحقق"],
  },
  // Visit and prediction
  {
    dbField: "last_visit_date",
    displayName: "تاريخ آخر زيارة",
    keywords: ["last visit", "last_visit_date", "تاريخ آخر زيارة", "آخر زيارة", "previous visit"],
  },
  {
    dbField: "avg_days_between_visits",
    displayName: "متوسط الأيام بين الزيارات",
    keywords: ["avg days", "avg_days_between_visits", "متوسط الأيام", "average days", "visit frequency"],
  },
  {
    dbField: "cycle_days",
    displayName: "أيام الدورة",
    keywords: ["cycle days", "cycle_days", "أيام الدورة", "cycle length", "دورة"],
  },
  {
    dbField: "cycle_type_new",
    displayName: "نوع الدورة",
    keywords: ["cycle type", "cycle_type_new", "نوع الدورة", "cycle category", "تصنيف الدورة"],
  },
  {
    dbField: "action_required",
    displayName: "الإجراء المطلوب",
    keywords: ["action required", "action_required", "الإجراء المطلوب", "required action", "إجراء"],
  },
  // Communication
  {
    dbField: "call_status",
    displayName: "حالة الاتصال",
    keywords: ["call status", "call_status", "حالة الاتصال", "contact status", "اتصال"],
  },
  {
    dbField: "call_date",
    displayName: "تاريخ الاتصال",
    keywords: ["call date", "call_date", "تاريخ الاتصال", "contact date", "تاريخ التواصل"],
  },
  {
    dbField: "call_notes",
    displayName: "ملاحظات الاتصال",
    keywords: ["call notes", "call_notes", "ملاحظات الاتصال", "contact notes", "ملاحظات التواصل"],
  },
];

// Field mappings for preventive care (patient_eligibility table)
export const preventiveCareFieldMappings: FieldMapping[] = [
  {
    dbField: "patient_id",
    displayName: "رقم المستفيد",
    keywords: ["patient id", "patient_id", "رقم المستفيد", "national number", "national_number", "رقم الهوية", "هوية"],
    required: true,
  },
  {
    dbField: "patient_name",
    displayName: "اسم المستفيد",
    keywords: ["patient name", "patient_name", "اسم المستفيد", "name", "الاسم", "full name"],
    required: true,
  },
  {
    dbField: "patient_age",
    displayName: "العمر",
    keywords: ["age", "patient_age", "العمر", "عمر"],
    required: true,
  },
  {
    dbField: "patient_gender",
    displayName: "الجنس",
    keywords: ["gender", "patient_gender", "الجنس", "sex", "جنس"],
    required: true,
  },
  {
    dbField: "service_id",
    displayName: "رمز الخدمة",
    keywords: ["service id", "service_id", "رمز الخدمة", "service"],
    required: true,
  },
  {
    dbField: "service_code",
    displayName: "كود الخدمة",
    keywords: ["service code", "service_code", "كود الخدمة", "code"],
    required: true,
  },
  {
    dbField: "service_name_ar",
    displayName: "اسم الخدمة",
    keywords: ["service name", "service_name_ar", "اسم الخدمة", "خدمة"],
    required: true,
  },
  {
    dbField: "priority",
    displayName: "الأولوية",
    keywords: ["priority", "الأولوية", "أولوية"],
    required: true,
  },
  {
    dbField: "status",
    displayName: "الحالة",
    keywords: ["status", "الحالة", "حالة"],
  },
  {
    dbField: "due_date",
    displayName: "تاريخ الاستحقاق",
    keywords: ["due date", "due_date", "تاريخ الاستحقاق", "استحقاق"],
  },
  {
    dbField: "last_completed_date",
    displayName: "تاريخ آخر إتمام",
    keywords: ["last completed", "last_completed_date", "تاريخ آخر إتمام", "آخر إتمام"],
  },
  {
    dbField: "is_eligible",
    displayName: "مؤهل",
    keywords: ["eligible", "is_eligible", "مؤهل", "أهلية"],
  },
];

export interface ColumnMapping {
  excelColumn: string;
  dbField: string | null;
  displayName: string;
  confidence: "high" | "medium" | "low" | "none";
  isRequired: boolean;
}

// Normalize string for comparison
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[_\-\s]+/g, " ")
    .replace(/[()]/g, "");
};

// Calculate similarity between two strings
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  // Exact match
  if (s1 === s2) return 1;
  
  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Word match
  const words1 = s1.split(" ");
  const words2 = s2.split(" ");
  const matchingWords = words1.filter(w => words2.some(w2 => w === w2 || w.includes(w2) || w2.includes(w)));
  if (matchingWords.length > 0) {
    return 0.6 * (matchingWords.length / Math.max(words1.length, words2.length));
  }
  
  return 0;
};

// Find best matching field for an Excel column
const findBestMatch = (
  excelColumn: string,
  fieldMappings: FieldMapping[]
): { field: FieldMapping | null; confidence: "high" | "medium" | "low" | "none" } => {
  let bestMatch: FieldMapping | null = null;
  let bestScore = 0;
  
  for (const field of fieldMappings) {
    for (const keyword of field.keywords) {
      const score = calculateSimilarity(excelColumn, keyword);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = field;
      }
    }
  }
  
  let confidence: "high" | "medium" | "low" | "none" = "none";
  if (bestScore >= 0.8) confidence = "high";
  else if (bestScore >= 0.5) confidence = "medium";
  else if (bestScore >= 0.3) confidence = "low";
  else bestMatch = null;
  
  return { field: bestMatch, confidence };
};

// Convert custom fields to FieldMapping format
const convertCustomFieldsToMappings = (targetTable: string): FieldMapping[] => {
  const customFields = getCustomFields();
  return customFields
    .filter(cf => {
      // Support both old single targetTable and new targetTables array
      const tables = cf.targetTables || [cf.targetTable];
      return tables.includes(targetTable);
    })
    .map(cf => ({
      dbField: cf.dbField,
      displayName: cf.nameAr,
      keywords: cf.keywords,
      required: false,
      targetTable: targetTable,
      dataType: cf.dataType,
      options: cf.options,
      isCustom: true,
    }));
};

// Get all field mappings including custom fields
export const getAllFieldMappings = (importType: "patients" | "preventive"): FieldMapping[] => {
  // دمج جميع الحقول الافتراضية من كلا النوعين
  const allBaseMappings = [...patientFieldMappings, ...preventiveCareFieldMappings];
  
  // إزالة التكرارات (الحقول المشتركة مثل العمر والجنس)
  const uniqueBaseMappings = allBaseMappings.reduce((acc, current) => {
    const isDuplicate = acc.find(item => item.dbField === current.dbField);
    if (!isDuplicate) {
      acc.push(current);
    }
    return acc;
  }, [] as FieldMapping[]);
  
  // جلب الحقول المخصصة من جميع الجداول
  const allTables = ["patients", "medications", "screening_data", "virtual_clinic_data", "patient_eligibility"];
  const allCustomMappings = allTables.flatMap(table => convertCustomFieldsToMappings(table));
  
  return [...uniqueBaseMappings, ...allCustomMappings];
};

// Main function to map Excel columns to database fields
export const mapExcelColumns = (
  excelColumns: string[],
  importType: "patients" | "preventive"
): ColumnMapping[] => {
  const fieldMappings = getAllFieldMappings(importType);
  const usedFields = new Set<string>();
  
  return excelColumns.map((excelColumn) => {
    const { field, confidence } = findBestMatch(excelColumn, fieldMappings);
    
    // Avoid duplicate mappings
    if (field && usedFields.has(field.dbField)) {
      return {
        excelColumn,
        dbField: null,
        displayName: "-",
        confidence: "none",
        isRequired: false,
      };
    }
    
    if (field) {
      usedFields.add(field.dbField);
    }
    
    return {
      excelColumn,
      dbField: field?.dbField || null,
      displayName: field?.displayName || "-",
      confidence,
      isRequired: field?.required || false,
    };
  });
};

// Get all available fields for manual selection (including custom fields)
export const getAvailableFields = (importType: "patients" | "preventive"): { value: string; label: string; isCustom?: boolean }[] => {
  const fieldMappings = getAllFieldMappings(importType);
  return fieldMappings.map((f) => ({ 
    value: f.dbField, 
    label: f.isCustom ? `${f.displayName}` : f.displayName,
    isCustom: f.isCustom 
  }));
};

// Transform value using custom field options (N:1 mapping)
const transformCustomFieldValue = (value: any, options: FieldOption[]): any => {
  if (value === undefined || value === null || value === "") return null;
  
  const strValue = String(value).trim().toLowerCase();
  
  // Find matching option by checking all possible values
  for (const option of options) {
    const matchingValue = option.values.find(v => v.toLowerCase() === strValue);
    if (matchingValue) {
      return option.displayName; // Return the Arabic display name
    }
  }
  
  // If no match found, return original value
  return String(value).trim();
};

// Value transformers
export const transformValue = (value: any, dbField: string, fieldMapping?: FieldMapping): any => {
  if (value === undefined || value === null || value === "") return null;
  
  const strValue = String(value).trim();
  
  // Check if this is a custom field with options
  if (fieldMapping?.isCustom && fieldMapping.options && fieldMapping.options.length > 0) {
    return transformCustomFieldValue(value, fieldMapping.options);
  }
  
  // Boolean fields
  if (["has_dm", "has_htn", "has_dyslipidemia", "is_eligible", "eligible_dm_screening", "eligible_htn_screening", "eligible_dlp_screening"].includes(dbField)) {
    const normalized = strValue.toLowerCase();
    if (["yes", "نعم", "1", "true", "unknown"].includes(normalized)) return true;
    return false;
  }
  
  // Burden field
  if (dbField === "burden") {
    const normalized = strValue.toLowerCase();
    if (normalized.includes("high") || normalized === "عالي") return "عالي";
    if (normalized.includes("moderate") || normalized === "متوسط") return "متوسط";
    if (normalized.includes("low") || normalized === "منخفض") return "منخفض";
    return null;
  }
  
  // Gender field
  if (["gender", "patient_gender"].includes(dbField)) {
    const normalized = strValue.toLowerCase();
    if (normalized === "male" || normalized === "ذكر" || normalized === "m") return "ذكر";
    if (normalized === "female" || normalized === "أنثى" || normalized === "f") return "أنثى";
    return strValue;
  }
  
  // Status field
  if (dbField === "status") {
    const normalized = strValue.toLowerCase();
    if (["pending", "معلق"].includes(normalized)) return "pending";
    if (["scheduled", "مجدول"].includes(normalized)) return "scheduled";
    if (["completed", "مكتمل"].includes(normalized)) return "completed";
    if (["declined", "مرفوض"].includes(normalized)) return "declined";
    return "pending";
  }
  
  // Priority field
  if (dbField === "priority") {
    const normalized = strValue.toLowerCase();
    if (normalized.includes("high") || normalized === "عالي" || normalized === "عالية") return "عالية";
    if (normalized.includes("medium") || normalized === "متوسط" || normalized === "متوسطة") return "متوسطة";
    if (normalized.includes("low") || normalized === "منخفض" || normalized === "منخفضة") return "منخفضة";
    return "متوسطة";
  }
  
  // Numeric fields - extended list
  if (["age", "patient_age", "days_until_visit", "visit_count", "total_chronic_meds", "cycle_days", "fasting_blood_glucose", "hba1c", "ldl", "med_prediction_confidence", "avg_days_between_visits"].includes(dbField)) {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }
  
  // Date fields - handle Excel serial numbers - extended list
  if (["predicted_visit_date", "due_date", "last_completed_date", "latest_prescription_date", "last_visit_date", "call_date"].includes(dbField)) {
    if (typeof value === "number") {
      // Excel serial date: days since 1899-12-30
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      return date.toISOString().split("T")[0];
    }
    // Try to parse as date string
    const date = new Date(strValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
    return null;
  }
  
  return strValue;
};

// Get field mapping by dbField for use in transformValue
export const getFieldMappingByDbField = (dbField: string, importType: "patients" | "preventive"): FieldMapping | undefined => {
  const allMappings = getAllFieldMappings(importType);
  return allMappings.find(m => m.dbField === dbField);
};
