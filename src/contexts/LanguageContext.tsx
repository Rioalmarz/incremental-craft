import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Navigation & Common
    'home': 'الرئيسية',
    'screening': 'الفرز الأولي',
    'virtualClinic': 'العيادة الافتراضية',
    'statistics': 'الإحصائيات',
    'completed': 'المكتملين',
    'excluded': 'المستبعدين',
    'allPatients': 'جميع البيانات',
    'preventiveCare': 'الرعاية الوقائية',
    'eligible': 'المؤهلين',
    'doctorScheduling': 'جدولة الأطباء',
    'userManagement': 'إدارة المستخدمين',
    'settings': 'الإعدادات',
    'profile': 'الملف الشخصي',
    'logout': 'تسجيل الخروج',
    'administration': 'الإدارة',
    'adminPanel': 'لوحة الإدارة',
    'systemAdmin': 'مدير النظام',
    
    // Header
    'search': 'بحث',
    'searchPlaceholder': 'البحث بالاسم أو رقم الهوية...',
    'notifications': 'الإشعارات',
    'language': 'اللغة',
    'darkMode': 'الوضع الداكن',
    'lightMode': 'الوضع الفاتح',
    
    // Footer
    'clusterName': 'التجمع الصحي الثاني بجدة',
    'clusterNameEn': 'Jeddah Second Health Cluster',
    'copyright': 'الرعاية الأولية المحسّنة',
    
    // Common Actions & Labels
    'save': 'حفظ',
    'cancel': 'إلغاء',
    'delete': 'حذف',
    'edit': 'تعديل',
    'add': 'إضافة',
    'back': 'رجوع',
    'next': 'التالي',
    'previous': 'السابق',
    'loading': 'جاري التحميل...',
    'noData': 'لا توجد بيانات',
    'beneficiary': 'مستفيد',
    'beneficiaries': 'مستفيدين',
    'all': 'الكل',
    'filter': 'تصفية',
    'refresh': 'تحديث',
    'print': 'طباعة',
    'export': 'تصدير',
    'page': 'صفحة',
    'of': 'من',
    'yes': 'نعم',
    'no': 'لا',
    'notSpecified': 'غير محدد',
    'notAvailable': 'غير متاح',
    'year': 'سنة',
    'years': 'سنوات',
    
    // Patient Info
    'patientName': 'اسم المستفيد',
    'nationalId': 'رقم الهوية',
    'age': 'العمر',
    'gender': 'الجنس',
    'phone': 'الهاتف',
    'male': 'ذكر',
    'female': 'أنثى',
    'center': 'المركز',
    'team': 'الفريق',
    'doctor': 'الطبيب',
    
    // Diseases
    'chronicDiseases': 'الأمراض المزمنة',
    'diabetes': 'سكري',
    'hypertension': 'ضغط',
    'dyslipidemia': 'دهون',
    'noDiseases': 'لا يوجد',
    
    // Status
    'status': 'الحالة',
    'pending': 'بانتظار الفرز',
    'inVirtualClinic': 'العيادة الافتراضية',
    'completedStatus': 'مكتمل',
    'excludedStatus': 'مستبعد',
    'allStatuses': 'جميع الحالات',
    
    // Urgency
    'urgency': 'الأولوية',
    'high': 'عالي',
    'medium': 'متوسط',
    'low': 'منخفض',
    
    // Screening Page
    'initialScreening': 'الفرز الأولي',
    'transferToClinic': 'تحويل للعيادة',
    'exclude': 'استبعاد',
    'transferReason': 'سبب التحويل',
    'exclusionReason': 'سبب الاستبعاد',
    'refillMedication': 'لإعادة صرف العلاج',
    'orderTests': 'لعمل تحاليل',
    'preventiveExam': 'للفحص الوقائي',
    'noAnswer': 'لا يرد على الاتصال',
    'wrongNumber': 'رقم غير صحيح',
    'outOfService': 'خارج نطاق الخدمة',
    'notEligible': 'لا تنطبق معايير المبادرة',
    'noFollowUp': 'لا يحتاج متابعة حالياً',
    'relocated': 'انتقل لمنطقة أخرى',
    'otherReason': 'سبب آخر',
    'notes': 'ملاحظات',
    'screenedBy': 'بواسطة',
    
    // Virtual Clinic
    'virtualClinicTitle': 'العيادة الافتراضية',
    'emergencySymptoms': 'أعراض طارئة',
    'chestPain': 'ألم في الصدر',
    'severeHeadache': 'صداع شديد',
    'visionChanges': 'تغيرات في الرؤية',
    'shortnessOfBreath': 'ضيق تنفس شديد',
    'lossOfConsciousness': 'فقدان الوعي',
    'severeHypoglycemia': 'هبوط سكر حاد',
    'finalAction': 'الإجراء النهائي',
    'refillRx': 'إعادة صرف علاج',
    'orderLabs': 'طلب تحاليل',
    'scheduleClinical': 'موعد فحص سريري',
    'referral': 'تحويل خارجي',
    'noIntervention': 'لا يحتاج تدخل',
    'examinedBy': 'الفاحص',
    
    // Completed Page
    'completedTitle': 'المكتملين',
    'actionTaken': 'الإجراء المتخذ',
    'expectedDate': 'الموعد المتوقع',
    'predictionAccuracy': 'دقة التنبؤ',
    'completionDate': 'تاريخ الإكمال',
    'by': 'بواسطة',
    'regular': 'منتظم',
    'variable': 'متغير',
    'irregular': 'غير منتظم',
    
    // Excluded Page
    'excludedTitle': 'المستبعدين',
    'excludedNote': 'الحالات المستبعدة لا تعود للمسار إلا بإعادة تفعيل يدوي من المشرف',
    'exclusionDate': 'تاريخ الاستبعاد',
    
    // All Patients Page
    'allPatientsTitle': 'جميع البيانات',
    'predictionNote': 'جميع تواريخ الزيارة ونسب دقة التنبؤ تُستخدم لأغراض تنظيم الرعاية فقط ولا تُعد موعدًا مؤكدًا',
    
    // Eligible Page
    'eligibleTitle': 'المؤهلين',
    'eligibleSubtitle': 'قائمة المستفيدين المؤهلين للخدمات',
    'totalEligible': 'إجمالي المؤهلين',
    'columnsCount': 'عدد الأعمدة',
    'eligibleList': 'قائمة المؤهلين',
    'searchAllData': 'البحث في جميع البيانات...',
    
    // Statistics Page
    'statisticsTitle': 'لوحة الإحصائيات',
    'statisticsSubtitle': 'Statistics Dashboard',
    'totalBeneficiaries': 'إجمالي المستفيدين',
    'contacted': 'تم التواصل',
    'notContacted': 'لم يتم الرد',
    'beneficiarySatisfaction': 'رضا المستفيد',
    'preventiveCareTab': 'الرعاية الوقائية',
    'chronicDiseasesTab': 'الأمراض المزمنة',
    'healthyChild': 'الطفل السليم',
    'medicalTeams': 'الفرق الطبية',
    'communicationEfficiency': 'كفاءة التواصل',
    'contactedTab': 'المتواصل معهم',
    'notContactedTab': 'لم يتم التواصل',
    'emergencyReferral': 'التحويل للطوارئ',
    'satisfactionMeasure': 'قياس الرضا',
    
    // Error Messages
    'error': 'خطأ',
    'loadError': 'فشل في تحميل بيانات المستفيدين',
    'saveError': 'فشل في حفظ البيانات',
    'saved': 'تم الحفظ',
    'transferred': 'تم تحويل المستفيد للعيادة الافتراضية',
    'excludedSuccess': 'تم استبعاد المستفيد',
    'completedSuccess': 'تم إكمال الحالة ونقلها إلى قائمة المكتملين',
    'selectTransferReason': 'يرجى اختيار سبب التحويل',
    'selectExclusionReason': 'يرجى اختيار سبب الاستبعاد',
    'writeExclusionReason': 'يرجى كتابة سبب الاستبعاد',
    'selectFinalAction': 'يرجى اختيار الإجراء النهائي',
    'emergencyAlert': 'يجب توجيه المستفيد فورًا للطوارئ أو التنسيق العاجل',
    
    // No Data Messages
    'noCompletedPatients': 'لا يوجد مستفيدين مكتملين',
    'noExcludedPatients': 'لا يوجد مستفيدين مستبعدين',
  },
  en: {
    // Navigation & Common
    'home': 'Home',
    'screening': 'Initial Screening',
    'virtualClinic': 'Virtual Clinic',
    'statistics': 'Statistics',
    'completed': 'Completed',
    'excluded': 'Excluded',
    'allPatients': 'All Data',
    'preventiveCare': 'Preventive Care',
    'eligible': 'Eligible',
    'doctorScheduling': 'Doctor Scheduling',
    'userManagement': 'User Management',
    'settings': 'Settings',
    'profile': 'Profile',
    'logout': 'Logout',
    'administration': 'Administration',
    'adminPanel': 'Admin Panel',
    'systemAdmin': 'System Admin',
    
    // Header
    'search': 'Search',
    'searchPlaceholder': 'Search by name or ID...',
    'notifications': 'Notifications',
    'language': 'Language',
    'darkMode': 'Dark Mode',
    'lightMode': 'Light Mode',
    
    // Footer
    'clusterName': 'Jeddah Second Health Cluster',
    'clusterNameEn': 'Jeddah Second Health Cluster',
    'copyright': 'Enhanced Primary Care',
    
    // Common Actions & Labels
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'add': 'Add',
    'back': 'Back',
    'next': 'Next',
    'previous': 'Previous',
    'loading': 'Loading...',
    'noData': 'No data available',
    'beneficiary': 'beneficiary',
    'beneficiaries': 'beneficiaries',
    'all': 'All',
    'filter': 'Filter',
    'refresh': 'Refresh',
    'print': 'Print',
    'export': 'Export',
    'page': 'Page',
    'of': 'of',
    'yes': 'Yes',
    'no': 'No',
    'notSpecified': 'Not specified',
    'notAvailable': 'N/A',
    'year': 'year',
    'years': 'years',
    
    // Patient Info
    'patientName': 'Patient Name',
    'nationalId': 'National ID',
    'age': 'Age',
    'gender': 'Gender',
    'phone': 'Phone',
    'male': 'Male',
    'female': 'Female',
    'center': 'Center',
    'team': 'Team',
    'doctor': 'Doctor',
    
    // Diseases
    'chronicDiseases': 'Chronic Diseases',
    'diabetes': 'Diabetes',
    'hypertension': 'Hypertension',
    'dyslipidemia': 'Dyslipidemia',
    'noDiseases': 'None',
    
    // Status
    'status': 'Status',
    'pending': 'Pending Screening',
    'inVirtualClinic': 'In Virtual Clinic',
    'completedStatus': 'Completed',
    'excludedStatus': 'Excluded',
    'allStatuses': 'All Statuses',
    
    // Urgency
    'urgency': 'Urgency',
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low',
    
    // Screening Page
    'initialScreening': 'Initial Screening',
    'transferToClinic': 'Transfer to Clinic',
    'exclude': 'Exclude',
    'transferReason': 'Transfer Reason',
    'exclusionReason': 'Exclusion Reason',
    'refillMedication': 'Medication Refill',
    'orderTests': 'Order Lab Tests',
    'preventiveExam': 'Preventive Exam',
    'noAnswer': 'No answer',
    'wrongNumber': 'Wrong number',
    'outOfService': 'Out of service area',
    'notEligible': 'Not eligible',
    'noFollowUp': 'No follow-up needed',
    'relocated': 'Relocated',
    'otherReason': 'Other reason',
    'notes': 'Notes',
    'screenedBy': 'Screened by',
    
    // Virtual Clinic
    'virtualClinicTitle': 'Virtual Clinic',
    'emergencySymptoms': 'Emergency Symptoms',
    'chestPain': 'Chest Pain',
    'severeHeadache': 'Severe Headache',
    'visionChanges': 'Vision Changes',
    'shortnessOfBreath': 'Severe Shortness of Breath',
    'lossOfConsciousness': 'Loss of Consciousness',
    'severeHypoglycemia': 'Severe Hypoglycemia',
    'finalAction': 'Final Action',
    'refillRx': 'Refill Prescription',
    'orderLabs': 'Order Labs',
    'scheduleClinical': 'Schedule Clinical Visit',
    'referral': 'External Referral',
    'noIntervention': 'No Intervention Needed',
    'examinedBy': 'Examined by',
    
    // Completed Page
    'completedTitle': 'Completed',
    'actionTaken': 'Action Taken',
    'expectedDate': 'Expected Date',
    'predictionAccuracy': 'Prediction Accuracy',
    'completionDate': 'Completion Date',
    'by': 'By',
    'regular': 'Regular',
    'variable': 'Variable',
    'irregular': 'Irregular',
    
    // Excluded Page
    'excludedTitle': 'Excluded',
    'excludedNote': 'Excluded cases can only be reactivated manually by a supervisor',
    'exclusionDate': 'Exclusion Date',
    
    // All Patients Page
    'allPatientsTitle': 'All Data',
    'predictionNote': 'All visit dates and prediction accuracy are for care coordination purposes only and do not constitute confirmed appointments',
    
    // Eligible Page
    'eligibleTitle': 'Eligible',
    'eligibleSubtitle': 'List of eligible beneficiaries',
    'totalEligible': 'Total Eligible',
    'columnsCount': 'Columns Count',
    'eligibleList': 'Eligible List',
    'searchAllData': 'Search all data...',
    
    // Statistics Page
    'statisticsTitle': 'Statistics Dashboard',
    'statisticsSubtitle': 'Statistics Dashboard',
    'totalBeneficiaries': 'Total Beneficiaries',
    'contacted': 'Contacted',
    'notContacted': 'Not Contacted',
    'beneficiarySatisfaction': 'Beneficiary Satisfaction',
    'preventiveCareTab': 'Preventive Care',
    'chronicDiseasesTab': 'Chronic Diseases',
    'healthyChild': 'Healthy Child',
    'medicalTeams': 'Medical Teams',
    'communicationEfficiency': 'Communication Efficiency',
    'contactedTab': 'Contacted',
    'notContactedTab': 'Not Contacted',
    'emergencyReferral': 'Emergency Referral',
    'satisfactionMeasure': 'Satisfaction Measure',
    
    // Error Messages
    'error': 'Error',
    'loadError': 'Failed to load beneficiary data',
    'saveError': 'Failed to save data',
    'saved': 'Saved',
    'transferred': 'Beneficiary transferred to virtual clinic',
    'excludedSuccess': 'Beneficiary excluded',
    'completedSuccess': 'Case completed and moved to completed list',
    'selectTransferReason': 'Please select a transfer reason',
    'selectExclusionReason': 'Please select an exclusion reason',
    'writeExclusionReason': 'Please write the exclusion reason',
    'selectFinalAction': 'Please select the final action',
    'emergencyAlert': 'Beneficiary must be directed to emergency immediately',
    
    // No Data Messages
    'noCompletedPatients': 'No completed beneficiaries',
    'noExcludedPatients': 'No excluded beneficiaries',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'ar';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
