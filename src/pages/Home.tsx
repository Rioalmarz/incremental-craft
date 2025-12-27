import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Users, ClipboardList, Stethoscope, CheckCircle, XCircle, Database, BarChart3, Settings, UserCog, User, Menu, Bell, Search, Shield, CalendarDays, UserCheck } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import mahdiProfile from "@/assets/mahdi-profile.jpg";

const Home = () => {
  const { user, profile, role, signOut, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch real statistics from database
  const { data: stats } = useQuery({
    queryKey: ['home-stats'],
    queryFn: async () => {
      const { data: patients, error } = await supabase
        .from('patients')
        .select('id, status, exclusion_reason, contacted, service_delivered');
      
      if (error) throw error;
      
      const total = patients?.length || 0;
      const completed = patients?.filter(p => p.status === 'مكتمل' || p.service_delivered).length || 0;
      const excluded = patients?.filter(p => p.status === 'مستبعد' || p.exclusion_reason).length || 0;
      
      return { total, completed, excluded };
    }
  });

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
    { title: "الفرز الأولي", icon: ClipboardList, path: "/screening", count: stats?.total || 0 },
    { title: "العيادة الافتراضية", icon: Stethoscope, path: "/virtual-clinic", count: 0 },
    { title: "الإحصائيات", icon: BarChart3, path: "/statistics" },
    { title: "المكتملين", icon: CheckCircle, path: "/completed", count: stats?.completed || 0 },
    { title: "المستبعدين", icon: XCircle, path: "/excluded", count: stats?.excluded || 0 },
    { title: "جميع البيانات", icon: Database, path: "/all-patients", count: stats?.total || 0 },
    { title: "الرعاية الوقائية", icon: Shield, path: "/preventive-care" },
    { title: "المؤهلين", icon: UserCheck, path: "/eligible" },
    { title: "جدولة الأطباء", icon: CalendarDays, path: "/doctor-scheduling" },
  ];

  const adminMenuItems = [
    { title: "إدارة المستخدمين", icon: UserCog, path: "/admin/users" },
    { title: "الإعدادات", icon: Settings, path: "/admin/settings" },
  ];

  function getCenterName(centerId: string): string {
    const centerNames: Record<string, string> = {
      'salamah': 'مركز صحي السلامة',
      'khalid_model': 'مركز صحي خالد النموذجي',
      'naeem': 'مركز صحي النعيم',
      'obhur': 'مركز صحي أبحر',
      'salhiyah': 'مركز صحي الصالحية',
      'majed': 'مركز صحي الماجد',
      'shatea': 'مركز صحي الشاطئ',
      'sheraa': 'مركز صحي الشراع',
      'wafa': 'مركز صحي الوفاء',
      'rayyan': 'مركز صحي الريان',
      'briman': 'مركز صحي بريمان',
      'firdous': 'مركز صحي الفردوس',
      'thuwal': 'مركز صحي ثول',
      'dhahban': 'مركز صحي ذهبان',
      'sawari': 'مركز صحي الصواري',
      'rehab': 'مركز صحي الرحاب',
    };
    return centerNames[centerId] || centerId;
  }

  const userDisplayName = profile?.name_ar || profile?.username;
  const userCenter = profile?.center_id ? getCenterName(profile.center_id) : '';
  const isMahdi = profile?.username === 'mahdi';

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6 px-4">
      <nav className="flex-1 space-y-2">
        <button
          onClick={() => { navigate("/"); setSidebarOpen(false); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all duration-200 bg-primary/10 text-primary font-medium"
        >
          <span>الرئيسية</span>
        </button>
        
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => { navigate(item.path); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all duration-200 hover:bg-primary/10 text-foreground hover:text-primary"
          >
            <item.icon size={18} className="text-primary" />
            <span>{item.title}</span>
          </button>
        ))}

        {isSuperAdmin && (
          <>
            <div className="border-t border-border/50 my-4" />
            <p className="px-4 text-xs text-muted-foreground mb-2">الإدارة</p>
            {adminMenuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all duration-200 hover:bg-primary/10 text-foreground hover:text-primary"
              >
                <item.icon size={18} className="text-primary" />
                <span>{item.title}</span>
              </button>
            ))}
          </>
        )}
      </nav>
    </div>
  );

  return (
    <div className={`min-h-screen transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 px-4 pt-4">
        <div className="top-bar flex items-center justify-between max-w-7xl mx-auto">
          {/* Left Section - Menu & Icons */}
          <div className="flex items-center gap-3">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10">
                  <Menu size={22} className="text-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0 glass-card">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10">
              <Bell size={20} className="text-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10">
              <Search size={20} className="text-foreground" />
            </Button>
          </div>

          {/* Center - Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
            <FlowerLogo animate size={55} />
          </div>

          {/* Right Section - User & Settings */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground hidden md:block">{userCenter}</span>
            
            <Button variant="ghost" size="sm" className="gap-2 rounded-xl hover:bg-primary/10" onClick={() => navigate("/admin/settings")}>
              <Settings size={18} />
              <span className="hidden md:inline">الإعدادات</span>
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
                  <span className="relative flex h-3 w-3 -mr-2 -mt-6">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive text-[8px] text-destructive-foreground items-center justify-center font-bold">3</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 glass-card p-2">
                <div className="px-3 py-3 mb-2 bg-primary/5 rounded-xl">
                  <p className="text-sm font-semibold">{userDisplayName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{isSuperAdmin ? "مدير النظام" : userCenter}</p>
                </div>
                <DropdownMenuItem className="cursor-pointer gap-3 rounded-xl py-2.5" onClick={() => navigate("/profile")}>
                  <User size={16} className="text-primary" />
                  <span>الملف الشخصي</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem className="cursor-pointer gap-3 rounded-xl py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10" onClick={handleSignOut}>
                  <LogOut size={16} />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="stat-card">
            <p className="text-4xl md:text-5xl font-bold text-foreground mb-1">{stats?.total?.toLocaleString() || 0}</p>
            <p className="text-sm text-muted-foreground">المستفيدين</p>
            <p className="text-xs text-primary mt-1">Beneficiaries</p>
          </div>
          <div className="stat-card">
            <p className="text-4xl md:text-5xl font-bold text-foreground mb-1">{stats?.completed?.toLocaleString() || 0}</p>
            <p className="text-sm text-muted-foreground">المكتملين</p>
            <p className="text-xs text-primary mt-1">Completed</p>
          </div>
          <div className="stat-card">
            <p className="text-4xl md:text-5xl font-bold text-foreground mb-1">{stats?.excluded?.toLocaleString() || 0}</p>
            <p className="text-sm text-muted-foreground">المستبعدين</p>
            <p className="text-xs text-primary mt-1">Excluded</p>
          </div>
        </div>

        {/* Menu Cards Grid - First Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {menuItems.slice(0, 4).map((item, index) => (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`menu-card flex flex-col items-center text-center transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                <item.icon size={28} className="text-primary" />
              </div>
              <p className="font-semibold text-foreground text-sm mb-1">{item.title}</p>
              {item.count !== undefined && (
                <p className="text-xs text-muted-foreground">{item.count.toLocaleString()}</p>
              )}
            </div>
          ))}
        </div>

        {/* Menu Cards Grid - Second Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {menuItems.slice(4, 8).map((item, index) => (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`menu-card flex flex-col items-center text-center transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${(index + 4) * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <item.icon size={28} className="text-primary" />
              </div>
              <p className="font-semibold text-foreground text-sm mb-1">{item.title}</p>
              {item.count !== undefined && (
                <p className="text-xs text-muted-foreground">{item.count.toLocaleString()}</p>
              )}
            </div>
          ))}
        </div>

        {/* Third Row - Single Item */}
        {menuItems.length > 8 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {menuItems.slice(8).map((item, index) => (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`menu-card flex flex-col items-center text-center transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${(index + 8) * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                  <item.icon size={28} className="text-primary" />
                </div>
                <p className="font-semibold text-foreground text-sm mb-1">{item.title}</p>
              </div>
            ))}
          </div>
        )}

        {/* Admin Section */}
        {isSuperAdmin && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-foreground mb-4 text-center">لوحة الإدارة</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {adminMenuItems.map((item, index) => (
                <div
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`menu-card flex flex-col items-center text-center transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${(index + menuItems.length) * 100}ms` }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-3">
                    <item.icon size={28} className="text-accent" />
                  </div>
                  <p className="font-semibold text-foreground text-sm">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <FlowerLogo animate={false} size={30} />
          <div className="text-right">
            <p className="font-semibold text-sm text-foreground">التجمع الصحي الثاني بجدة</p>
            <p className="text-xs text-primary">Jeddah Second Health Cluster</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} الرعاية الأولية المحسّنة
        </p>
      </footer>
    </div>
  );
};

export default Home;