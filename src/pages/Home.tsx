import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Settings, UserCog, User, Menu, Bell, Search, Globe, Sun, Moon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import mahdiProfile from "@/assets/mahdi-profile.jpg";
import StorytellingScroll from "@/components/StorytellingScroll";
import { ClipboardList, Stethoscope, CheckCircle, XCircle, Database, BarChart3, Shield, CalendarDays, UserCheck } from "lucide-react";

const Home = () => {
  const { user, profile, role, signOut, loading, isSuperAdmin } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FlowerLogo animate size={100} />
      </div>
    );
  }

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

  const adminMenuItems = [
    { titleAr: "إدارة المستخدمين", titleEn: "User Management", icon: UserCog, path: "/admin/users" },
    { titleAr: "الإعدادات", titleEn: "Settings", icon: Settings, path: "/admin/settings" },
  ];

  function getCenterName(centerId: string): string {
    const centerNames: Record<string, { ar: string; en: string }> = {
      'salamah': { ar: 'مركز صحي السلامة', en: 'Salamah Health Center' },
      'khalid_model': { ar: 'مركز صحي خالد النموذجي', en: 'Khalid Model Health Center' },
      'naeem': { ar: 'مركز صحي النعيم', en: 'Naeem Health Center' },
      'obhur': { ar: 'مركز صحي أبحر', en: 'Obhur Health Center' },
      'salhiyah': { ar: 'مركز صحي الصالحية', en: 'Salhiyah Health Center' },
      'majed': { ar: 'مركز صحي الماجد', en: 'Majed Health Center' },
      'shatea': { ar: 'مركز صحي الشاطئ', en: 'Shatea Health Center' },
      'sheraa': { ar: 'مركز صحي الشراع', en: 'Sheraa Health Center' },
      'wafa': { ar: 'مركز صحي الوفاء', en: 'Wafa Health Center' },
      'rayyan': { ar: 'مركز صحي الريان', en: 'Rayyan Health Center' },
      'briman': { ar: 'مركز صحي بريمان', en: 'Briman Health Center' },
      'firdous': { ar: 'مركز صحي الفردوس', en: 'Firdous Health Center' },
      'thuwal': { ar: 'مركز صحي ثول', en: 'Thuwal Health Center' },
      'dhahban': { ar: 'مركز صحي ذهبان', en: 'Dhahban Health Center' },
      'sawari': { ar: 'مركز صحي الصواري', en: 'Sawari Health Center' },
      'rehab': { ar: 'مركز صحي الرحاب', en: 'Rehab Health Center' },
    };
    const center = centerNames[centerId];
    return center ? (language === 'ar' ? center.ar : center.en) : centerId;
  }

  const userDisplayName = profile?.name_ar || profile?.username;
  const userCenter = profile?.center_id ? getCenterName(profile.center_id) : '';
  const isMahdi = profile?.username === 'mahdi';

  const getTitle = (item: { titleAr: string; titleEn: string }) => 
    language === 'ar' ? item.titleAr : item.titleEn;

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6 px-4">
      <nav className="flex-1 space-y-2">
        <button
          onClick={() => { navigate("/"); setSidebarOpen(false); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all duration-200 bg-primary/10 text-primary font-medium"
        >
          <span>{t('home')}</span>
        </button>
        
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => { navigate(item.path); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all duration-200 hover:bg-primary/10 text-foreground hover:text-primary"
          >
            <item.icon size={18} className="text-primary" />
            <span>{getTitle(item)}</span>
          </button>
        ))}

        {isSuperAdmin && (
          <>
            <div className="border-t border-border/50 my-4" />
            <p className="px-4 text-xs text-muted-foreground mb-2">{t('administration')}</p>
            {adminMenuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all duration-200 hover:bg-primary/10 text-foreground hover:text-primary"
              >
                <item.icon size={18} className="text-primary" />
                <span>{getTitle(item)}</span>
              </button>
            ))}
          </>
        )}
      </nav>
    </div>
  );

  return (
    <div className={`min-h-screen transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Top Navigation Bar - Fixed */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <div className={`top-bar flex items-center justify-between max-w-7xl mx-auto backdrop-blur-xl ${language === 'en' ? 'flex-row-reverse' : ''}`}>
          {/* Menu & Icons Section */}
          <div className={`flex items-center gap-2 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10">
                  <Menu size={22} className="text-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-72 p-0 glass-card">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10">
              <Bell size={20} className="text-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10">
              <Search size={20} className="text-foreground" />
            </Button>

            {/* Language Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-xl hover:bg-primary/10 gap-1.5 px-3"
                  onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                >
                  <Globe size={18} className="text-primary" />
                  <span className="text-xs font-medium">{language === 'ar' ? 'EN' : 'عربي'}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-xl hover:bg-primary/10"
                  onClick={toggleTheme}
                >
                  {theme === 'light' ? (
                    <Moon size={20} className="text-foreground" />
                  ) : (
                    <Sun size={20} className="text-primary" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{theme === 'light' ? t('darkMode') : t('lightMode')}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Center - Logo with 3D effect */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150" />
              <FlowerLogo animate size={55} />
            </div>
          </div>

          {/* User & Settings Section */}
          <div className={`flex items-center gap-3 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
            <span className="text-sm text-foreground hidden md:block">{userCenter}</span>
            
            <Button variant="ghost" size="sm" className={`gap-2 rounded-xl hover:bg-primary/10 ${language === 'en' ? 'flex-row-reverse' : ''}`} onClick={() => navigate("/admin/settings")}>
              <Settings size={18} />
              <span className="hidden md:inline">{t('settings')}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-1 transition-all hover:ring-2 hover:ring-primary/30">
                  <Avatar className="h-10 w-10 border-2 border-primary/30 shadow-md">
                    {isMahdi ? (
                      <AvatarImage src={mahdiProfile} alt={userDisplayName || ''} className="object-cover" />
                    ) : profile?.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={userDisplayName || ''} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {userDisplayName?.charAt(0) || 'م'}
                    </AvatarFallback>
                  </Avatar>
                  <span className={`relative flex h-3 w-3 -mt-6 ${language === 'ar' ? '-mr-2' : '-ml-2'}`}>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive text-[8px] text-destructive-foreground items-center justify-center font-bold">3</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={language === 'ar' ? 'start' : 'end'} className="w-56 glass-card p-2">
                <div className="px-3 py-3 mb-2 bg-primary/5 rounded-xl">
                  <p className={`text-sm font-semibold ${language === 'en' ? 'text-left' : ''}`}>{userDisplayName}</p>
                  <p className={`text-xs text-muted-foreground mt-0.5 ${language === 'en' ? 'text-left' : ''}`}>{isSuperAdmin ? t('systemAdmin') : userCenter}</p>
                </div>
                <DropdownMenuItem className={`cursor-pointer gap-3 rounded-xl py-2.5 ${language === 'en' ? 'flex-row-reverse' : ''}`} onClick={() => navigate("/profile")}>
                  <User size={16} className="text-primary" />
                  <span>{t('profile')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem className={`cursor-pointer gap-3 rounded-xl py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10 ${language === 'en' ? 'flex-row-reverse' : ''}`} onClick={handleSignOut}>
                  <LogOut size={16} />
                  <span>{t('logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Storytelling Scroll Content */}
      <main className="pt-20">
        <StorytellingScroll isLoaded={isLoaded} />
      </main>

      {/* Admin Section - After storytelling */}
      {isSuperAdmin && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-bold text-foreground mb-6 text-center">{t('adminPanel')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {adminMenuItems.map((item, index) => (
                <div
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`menu-card flex flex-col items-center text-center transition-all duration-500 group ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ 
                    transitionDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-125" />
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110 group-hover:bg-accent/20 relative">
                      <item.icon size={28} className="text-accent transition-transform duration-300 group-hover:scale-110" />
                    </div>
                  </div>
                  <p className="font-semibold text-foreground text-sm">{getTitle(item)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 text-center relative z-10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-lg scale-150" />
            <FlowerLogo animate={false} size={30} />
          </div>
          <div className={language === 'ar' ? 'text-right' : 'text-left'}>
            <p className="font-semibold text-sm text-foreground">{t('clusterName')}</p>
            <p className="text-xs text-primary">{language === 'ar' ? t('clusterNameEn') : ''}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {t('copyright')}
        </p>
      </footer>
    </div>
  );
};

export default Home;
