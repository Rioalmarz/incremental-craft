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
    // Navigation
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
    'notifications': 'الإشعارات',
    'language': 'اللغة',
    'darkMode': 'الوضع الداكن',
    'lightMode': 'الوضع الفاتح',
    
    // Footer
    'clusterName': 'التجمع الصحي الثاني بجدة',
    'clusterNameEn': 'Jeddah Second Health Cluster',
    'copyright': 'الرعاية الأولية المحسّنة',
    
    // Common
    'welcome': 'مرحباً',
    'loading': 'جاري التحميل...',
  },
  en: {
    // Navigation
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
    'notifications': 'Notifications',
    'language': 'Language',
    'darkMode': 'Dark Mode',
    'lightMode': 'Light Mode',
    
    // Footer
    'clusterName': 'Jeddah Second Health Cluster',
    'clusterNameEn': 'Jeddah Second Health Cluster',
    'copyright': 'Enhanced Primary Care',
    
    // Common
    'welcome': 'Welcome',
    'loading': 'Loading...',
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
