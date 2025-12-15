// Smart Column Mapping System - Intelligent field matching for Excel imports

import { getCustomFields, CustomField } from '@/components/CustomFieldManager';

export interface FieldMapping {
  dbField: string;
  displayName: string;
  keywords: string[];
  required?: boolean;
  targetTable?: string;
  dataType?: 'text' | 'number' | 'boolean' | 'date';
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
    keywords: ["full name", "name", "الاسم", "patient name", "اسم المريض", "full name (arabic)", "full_name_ar", "اسم"],
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
    dbField: "has_dm",
    displayName: "مريض سكري",
    keywords: ["is diabetic", "diabetes", "dm", "سكري", "diabetic", "isdiabetic", "السكري"],
  },
  {
    dbField: "has_htn",
    displayName: "مريض ضغط",
    keywords: ["is hypertensive", "hypertension", "htn", "ضغط", "blood pressure", "ishypertensive", "الضغط"],
  },
  {
    dbField: "has_dyslipidemia",
    displayName: "مريض دهون",
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
];

// Field mappings for preventive care (patient_eligibility table)
export const preventiveCareFieldMappings: FieldMapping[] = [
  {
    dbField: "patient_id",
    displayName: "رقم المريض",
    keywords: ["patient id", "patient_id", "رقم المريض", "national number", "national_number", "رقم الهوية", "هوية"],
    required: true,
  },
  {
    dbField: "patient_name",
    displayName: "اسم المريض",
    keywords: ["patient name", "patient_name", "اسم المريض", "name", "الاسم", "full name"],
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
    .filter(cf => cf.targetTable === targetTable)
    .map(cf => ({
      dbField: cf.dbField,
      displayName: cf.nameAr,
      keywords: cf.keywords,
      required: false,
      targetTable: cf.targetTable,
      dataType: cf.dataType,
      isCustom: true,
    }));
};

// Get all field mappings including custom fields
export const getAllFieldMappings = (importType: "patients" | "preventive"): FieldMapping[] => {
  const baseMappings = importType === "patients" ? patientFieldMappings : preventiveCareFieldMappings;
  const targetTable = importType === "patients" ? "patients" : "patient_eligibility";
  const customMappings = convertCustomFieldsToMappings(targetTable);
  
  // Also get custom fields for related tables
  const relatedTables = importType === "patients" 
    ? ["medications", "screening_data", "virtual_clinic_data", "patient_eligibility"]
    : [];
  
  const relatedCustomMappings = relatedTables.flatMap(table => convertCustomFieldsToMappings(table));
  
  return [...baseMappings, ...customMappings, ...relatedCustomMappings];
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
  return [
    { value: "", label: "تجاهل هذا العمود" },
    ...fieldMappings.map((f) => ({ 
      value: f.dbField, 
      label: f.isCustom ? `${f.displayName} (مخصص)` : f.displayName,
      isCustom: f.isCustom 
    })),
  ];
};

// Value transformers
export const transformValue = (value: any, dbField: string): any => {
  if (value === undefined || value === null || value === "") return null;
  
  const strValue = String(value).trim();
  
  // Boolean fields
  if (["has_dm", "has_htn", "has_dyslipidemia", "is_eligible"].includes(dbField)) {
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
  
  // Numeric fields
  if (["age", "patient_age", "days_until_visit"].includes(dbField)) {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }
  
  // Date fields - handle Excel serial numbers
  if (["predicted_visit_date", "due_date", "last_completed_date"].includes(dbField)) {
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
