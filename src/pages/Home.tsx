import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { 
  LogOut, 
  Users, 
  ClipboardList, 
  Stethoscope, 
  CheckCircle, 
  XCircle, 
  Database, 
  BarChart3, 
  Settings,
  UserCog,
  User,
  ChevronDown
} from "lucide-react";
import mahdiProfile from "@/assets/mahdi-profile.jpg";

const Home = () => {
  const { user, profile, role, signOut, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Trigger fade-in animation
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <FlowerLogo animate size={100} />
      </div>
    );
  }

  const menuItems = [
    { 
      title: "الفرز الأولي", 
      icon: ClipboardList, 
      path: "/screening",
      description: "فرز المرضى الجدد وتحديد الأولويات",
      color: "text-primary"
    },
    { 
      title: "العيادة الافتراضية", 
      icon: Stethoscope, 
      path: "/virtual-clinic",
      description: "متابعة المرضى المحولين للعيادة",
      color: "text-accent"
    },
    { 
      title: "المكتملين", 
      icon: CheckCircle, 
      path: "/completed",
      description: "الحالات المكتملة والمتابعة",
      color: "text-[hsl(var(--success))]"
    },
    { 
      title: "المستبعدين", 
      icon: XCircle, 
      path: "/excluded",
      description: "الحالات المستبعدة مع الأسباب",
      color: "text-destructive"
    },
    { 
      title: "جميع البيانات", 
      icon: Database, 
      path: "/all-patients",
      description: "عرض جميع بيانات المرضى",
      color: "text-muted-foreground"
    },
    { 
      title: "الإحصائيات", 
      icon: BarChart3, 
      path: "/statistics",
      description: "تقارير وإحصائيات شاملة",
      color: "text-[hsl(var(--info))]"
    },
  ];

  const adminMenuItems = [
    { 
      title: "إدارة المستخدمين", 
      icon: UserCog, 
      path: "/admin/users",
      description: "إضافة وإدارة حسابات المراكز",
      color: "text-primary"
    },
    { 
      title: "الإعدادات", 
      icon: Settings, 
      path: "/admin/settings",
      description: "إعدادات النظام والتكاملات",
      color: "text-accent"
    },
  ];

  const isMahdi = profile?.username === 'mahdi';

  return (
    <div className={`min-h-screen bg-background transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Top Account Bar - Vision 2030 Style */}
      <div className="bg-background border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo & Platform Name */}
            <div className="flex items-center gap-4">
              <FlowerLogo animate={false} size={36} />
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-foreground leading-tight">الرعاية الأولية المحسّنة</h1>
                <p className="text-xs text-muted-foreground">Enhanced Based Care</p>
              </div>
            </div>

            {/* Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-secondary/50 hover:shadow-md group">
                  {isMahdi ? (
                    <>
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          د. مهدي محمد الراجحي
                        </p>
                        <p className="text-xs text-muted-foreground">
                          إدارة • الفريق الثاني • مركز صحي السلامة
                        </p>
                      </div>
                      <Avatar className="h-9 w-9 border-2 border-primary/20 shadow-sm group-hover:border-primary/40 group-hover:shadow-md transition-all">
                        <AvatarImage src={mahdiProfile} alt="د. مهدي الراجحي" className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">مهـ</AvatarFallback>
                      </Avatar>
                    </>
                  ) : (
                    <>
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {profile?.name_ar || profile?.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isSuperAdmin ? "مدير النظام" : profile?.center_id || "مركز صحي"}
                        </p>
                      </div>
                      <Avatar className="h-9 w-9 border-2 border-primary/20 shadow-sm group-hover:border-primary/40 group-hover:shadow-md transition-all">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {(profile?.name_ar || profile?.username || "م")?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </>
                  )}
                  <ChevronDown size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border shadow-lg">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">{isMahdi ? "د. مهدي محمد الراجحي" : profile?.name_ar || profile?.username}</p>
                  <p className="text-xs text-muted-foreground">{isSuperAdmin ? "مدير النظام" : "مستخدم"}</p>
                </div>
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate("/profile")}>
                  <User size={16} />
                  <span>الملف الشخصي</span>
                </DropdownMenuItem>
                {isSuperAdmin && (
                  <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate("/admin/settings")}>
                    <Settings size={16} />
                    <span>الإعدادات</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer gap-2 text-destructive focus:text-destructive" onClick={handleSignOut}>
                  <LogOut size={16} />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Hero Section - Vision 2030 Style */}
      <section className="py-16 px-4 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container mx-auto text-center">
          <div className={`transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <FlowerLogo animate size={140} className="mx-auto mb-8" />
          </div>
          
          <div className={`transition-all duration-1000 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-foreground">
              الرعاية الأولية المحسّنة
            </h1>
            <p className="text-lg md:text-xl text-primary font-medium mb-2">
              Enhanced Based Care
            </p>
          </div>

          <div className={`transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`}>
            <div className="w-48 h-0.5 bg-gradient-to-l from-transparent via-primary to-transparent mx-auto my-6" />
          </div>

          <div className={`transition-all duration-1000 delay-600 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              نظام متكامل لإدارة ومتابعة مرضى الأمراض المزمنة
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">سكري</span>
              <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">ضغط</span>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">دهون</span>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className={`text-xl font-bold mb-8 text-center text-foreground transition-all duration-700 delay-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            القائمة الرئيسية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {menuItems.map((item, index) => (
              <Card 
                key={item.path}
                className={`bg-background border shadow-sm hover:shadow-lg cursor-pointer group transition-all duration-300 hover:-translate-y-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${800 + index * 100}ms` }}
                onClick={() => navigate(item.path)}
              >
                <CardContent className="p-5 flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-secondary/50 ${item.color} group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300`}>
                    <item.icon size={26} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1 text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Admin Section */}
          {isSuperAdmin && (
            <>
              <h2 className={`text-xl font-bold mb-8 mt-12 text-center text-foreground transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                الإدارة
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
                {adminMenuItems.map((item, index) => (
                  <Card 
                    key={item.path}
                    className={`bg-background border border-primary/20 shadow-sm hover:shadow-lg cursor-pointer group transition-all duration-300 hover:-translate-y-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    style={{ transitionDelay: `${1400 + index * 100}ms` }}
                    onClick={() => navigate(item.path)}
                  >
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-primary/10 ${item.color} group-hover:scale-110 transition-all duration-300`}>
                        <item.icon size={26} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-1 text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t bg-secondary/20">
        <p className="font-medium">التجمع الصحي الثاني بجدة</p>
        <p className="mt-1">Jeddah Second Health Cluster</p>
      </footer>
    </div>
  );
};

export default Home;
