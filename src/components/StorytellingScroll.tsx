import { useLanguage } from "@/contexts/LanguageContext";
import { FlowerLogo } from "@/components/FlowerLogo";
import { 
  ClipboardList, 
  Stethoscope, 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  Database, 
  Shield, 
  UserCheck, 
  CalendarDays 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StorytellingScrollProps {
  isLoaded: boolean;
}

const StorytellingScroll = ({ isLoaded }: StorytellingScrollProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const menuItems = [
    { titleAr: "الفرز الأولي", titleEn: "Screening", icon: ClipboardList, path: "/screening" },
    { titleAr: "العيادة الافتراضية", titleEn: "Virtual Clinic", icon: Stethoscope, path: "/virtual-clinic" },
    { titleAr: "الإحصائيات", titleEn: "Statistics", icon: BarChart3, path: "/statistics" },
    { titleAr: "المكتملين", titleEn: "Completed", icon: CheckCircle, path: "/completed" },
    { titleAr: "المستبعدين", titleEn: "Excluded", icon: XCircle, path: "/excluded" },
    { titleAr: "جميع البيانات", titleEn: "All Data", icon: Database, path: "/all-patients" },
    { titleAr: "الرعاية الوقائية", titleEn: "Preventive Care", icon: Shield, path: "/preventive-care" },
    { titleAr: "المؤهلين", titleEn: "Eligible", icon: UserCheck, path: "/eligible" },
    { titleAr: "جدولة الأطباء", titleEn: "Doctor Scheduling", icon: CalendarDays, path: "/doctor-scheduling" },
  ];

  const getTitle = (item: { titleAr: string; titleEn: string }) => 
    language === 'ar' ? item.titleAr : item.titleEn;

  return (
    <div className="relative px-4 py-8">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center mb-12">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150" />
          <FlowerLogo animate size={100} />
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {language === 'ar' ? 'نظام الرعاية الصحية' : 'Healthcare System'}
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            {language === 'ar' 
              ? 'اكتشف خدماتنا المتكاملة لإدارة الرعاية الصحية'
              : 'Discover our integrated healthcare management services'
            }
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-foreground text-center mb-8">
          {language === 'ar' ? 'الخدمات' : 'Services'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {menuItems.map((item, index) => (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`menu-card flex flex-col items-center text-center group transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-125" />
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 relative">
                  <item.icon size={28} className="text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
              </div>
              <p className="font-semibold text-foreground text-sm">{getTitle(item)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default StorytellingScroll;
