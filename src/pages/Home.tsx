import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ChevronDown,
  Shield,
  Activity,
  Heart,
  Sparkles
} from "lucide-react";
import mahdiProfile from "@/assets/mahdi-profile.jpg";

const Home = () => {
  const { user, profile, role, signOut, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Parallax effect for hero
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left - rect.width / 2) / 50,
          y: (e.clientY - rect.top - rect.height / 2) / 50,
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
      gradient: "from-[hsl(var(--primary))] to-[hsl(var(--accent))]"
    },
    { 
      title: "العيادة الافتراضية", 
      icon: Stethoscope, 
      path: "/virtual-clinic",
      description: "متابعة المرضى المحولين للعيادة",
      gradient: "from-[hsl(var(--accent))] to-[hsl(180,70%,35%)]"
    },
    { 
      title: "المكتملين", 
      icon: CheckCircle, 
      path: "/completed",
      description: "الحالات المكتملة والمتابعة",
      gradient: "from-[hsl(var(--success))] to-[hsl(145,60%,35%)]"
    },
    { 
      title: "المستبعدين", 
      icon: XCircle, 
      path: "/excluded",
      description: "الحالات المستبعدة مع الأسباب",
      gradient: "from-[hsl(var(--destructive))] to-[hsl(0,60%,45%)]"
    },
    { 
      title: "جميع البيانات", 
      icon: Database, 
      path: "/all-patients",
      description: "عرض جميع بيانات المرضى",
      gradient: "from-[hsl(var(--muted-foreground))] to-[hsl(220,10%,50%)]"
    },
    { 
      title: "الإحصائيات", 
      icon: BarChart3, 
      path: "/statistics",
      description: "تقارير وإحصائيات شاملة",
      gradient: "from-[hsl(var(--info))] to-[hsl(200,80%,45%)]"
    },
  ];

  const adminMenuItems = [
    { 
      title: "إدارة المستخدمين", 
      icon: UserCog, 
      path: "/admin/users",
      description: "إضافة وإدارة حسابات المراكز",
      gradient: "from-[hsl(var(--primary))] to-[hsl(var(--accent))]"
    },
    { 
      title: "الإعدادات", 
      icon: Settings, 
      path: "/admin/settings",
      description: "إعدادات النظام والتكاملات",
      gradient: "from-[hsl(var(--accent))] to-[hsl(180,70%,35%)]"
    },
  ];

  const pillItems = [
    { text: "الوقاية", icon: Shield, delay: "0s" },
    { text: "الاستباقية", icon: Activity, delay: "0.2s" },
    { text: "الاستمرارية", icon: Heart, delay: "0.4s" },
    { text: "جودة الحياة", icon: Sparkles, delay: "0.6s" },
  ];

  const isMahdi = profile?.username === 'mahdi';

  return (
    <div className={`min-h-screen bg-background overflow-hidden transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-accent/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-primary/3 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Top Header - Vision 2030 Premium Style */}
      <header className="relative z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Platform Name */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <FlowerLogo animate={false} size={40} className="relative z-10" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-foreground leading-tight tracking-tight">
                  الرعاية الأولية المحسّنة
                </h1>
                <p className="text-xs text-primary font-medium tracking-wide">
                  Enhanced Based Care
                </p>
              </div>
            </div>

            {/* Account Dropdown - Premium Style */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-secondary/30 border border-border/50 transition-all duration-300 hover:bg-secondary/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 group">
                  {isMahdi ? (
                    <>
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          د. مهدي محمد الراجحي
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          إدارة • الفريق الثاني • مركز صحي السلامة
                        </p>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Avatar className="h-10 w-10 border-2 border-primary/30 shadow-md group-hover:border-primary/50 group-hover:shadow-lg transition-all relative z-10">
                          <AvatarImage src={mahdiProfile} alt="د. مهدي الراجحي" className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">مهـ</AvatarFallback>
                        </Avatar>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {profile?.name_ar || profile?.username}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {isSuperAdmin ? "مدير النظام" : profile?.center_id || "مركز صحي"}
                        </p>
                      </div>
                      <Avatar className="h-10 w-10 border-2 border-primary/30 shadow-md group-hover:border-primary/50 group-hover:shadow-lg transition-all">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                          {(profile?.name_ar || profile?.username || "م")?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </>
                  )}
                  <ChevronDown size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-xl p-2">
                <div className="px-3 py-3 mb-2 bg-secondary/30 rounded-lg">
                  <p className="text-sm font-semibold">{isMahdi ? "د. مهدي محمد الراجحي" : profile?.name_ar || profile?.username}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{isSuperAdmin ? "مدير النظام" : "مستخدم"}</p>
                </div>
                <DropdownMenuItem className="cursor-pointer gap-3 rounded-lg py-2.5" onClick={() => navigate("/profile")}>
                  <User size={16} className="text-primary" />
                  <span>الملف الشخصي</span>
                </DropdownMenuItem>
                {isSuperAdmin && (
                  <DropdownMenuItem className="cursor-pointer gap-3 rounded-lg py-2.5" onClick={() => navigate("/admin/settings")}>
                    <Settings size={16} className="text-primary" />
                    <span>الإعدادات</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem className="cursor-pointer gap-3 rounded-lg py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10" onClick={handleSignOut}>
                  <LogOut size={16} />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Hero Section - Vision 2030 Premium Style */}
      <section 
        ref={heroRef}
        className="relative py-20 md:py-28 px-4 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, hsl(var(--secondary)/0.3) 0%, hsl(var(--background)) 100%)'
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
            style={{ transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)` }}
          />
          <div 
            className="absolute bottom-20 left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl"
            style={{ transform: `translate(${-mousePosition.x * 1.5}px, ${-mousePosition.y * 1.5}px)` }}
          />
        </div>

        <div className="container mx-auto text-center relative z-10">
          {/* Animated Logo */}
          <div 
            className={`transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
            style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-3xl scale-150 animate-pulse" style={{ animationDuration: '4s' }} />
              <FlowerLogo animate size={160} className="relative z-10 drop-shadow-2xl" />
            </div>
          </div>
          
          {/* Platform Title */}
          <div className={`mt-10 transition-all duration-1000 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-foreground leading-tight">
              <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                الرعاية الأولية المحسّنة
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-primary font-semibold tracking-wider">
              Enhanced Based Care
            </p>
          </div>

          {/* Animated Divider */}
          <div className={`transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`}>
            <div className="w-64 h-1 bg-gradient-to-l from-transparent via-primary to-transparent mx-auto my-8 rounded-full" />
          </div>

          {/* Main Description */}
          <div className={`transition-all duration-1000 delay-600 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
              نظام صحي ذكي متكامل لإدارة الرعاية الأولية
              <br className="hidden md:block" />
              <span className="text-foreground">لا يقتصر على الوقاية والعلاج،</span>
              <br />
              بل يهدف إلى الانتظام في الرعاية وتمكين المستفيد من حياة صحية سليمة ومستدامة
            </p>
          </div>

          {/* Animated Pills */}
          <div className={`flex flex-wrap items-center justify-center gap-3 md:gap-4 mt-10 transition-all duration-1000 delay-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            {pillItems.map((pill, index) => (
              <div
                key={pill.text}
                className="group relative"
                style={{ 
                  animation: isLoaded ? `fadeSlideUp 0.6s ease-out ${0.8 + index * 0.15}s both` : 'none'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-l from-primary to-accent rounded-full blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                <div className="relative flex items-center gap-2 px-5 py-2.5 bg-background/80 backdrop-blur-sm border border-primary/20 rounded-full shadow-lg hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 cursor-default">
                  <pill.icon size={16} className="text-primary" />
                  <span className="text-sm font-semibold text-foreground">{pill.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Menu Cards - 3D Glassmorphism Style */}
      <section className="py-16 px-4 relative">
        <div className="container mx-auto">
          <h2 className={`text-2xl font-bold mb-10 text-center text-foreground transition-all duration-700 delay-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <span className="relative">
              القائمة الرئيسية
              <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-l from-transparent via-primary/50 to-transparent" />
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {menuItems.map((item, index) => (
              <div
                key={item.path}
                className={`group relative cursor-pointer transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${800 + index * 100}ms` }}
                onClick={() => navigate(item.path)}
              >
                {/* Glow Effect */}
                <div className={`absolute -inset-1 bg-gradient-to-l ${item.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                
                {/* Card */}
                <div className="relative bg-background/60 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 group-hover:border-primary/30 overflow-hidden">
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-start gap-4">
                    <div className={`relative p-4 rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}>
                      <div className="absolute inset-0 bg-background/20 rounded-xl" />
                      <item.icon size={28} className="text-background relative z-10" />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute left-4 bottom-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <ChevronDown size={20} className="text-primary rotate-90" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Admin Section */}
          {isSuperAdmin && (
            <>
              <h2 className={`text-2xl font-bold mb-10 mt-16 text-center text-foreground transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                <span className="relative">
                  لوحة الإدارة
                  <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-l from-transparent via-primary/50 to-transparent" />
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {adminMenuItems.map((item, index) => (
                  <div
                    key={item.path}
                    className={`group relative cursor-pointer transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    style={{ transitionDelay: `${1400 + index * 100}ms` }}
                    onClick={() => navigate(item.path)}
                  >
                    <div className={`absolute -inset-1 bg-gradient-to-l ${item.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                    
                    <div className="relative bg-background/60 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 group-hover:border-primary/40 overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
                      
                      <div className="relative z-10 flex items-start gap-4">
                        <div className={`relative p-4 rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}>
                          <div className="absolute inset-0 bg-background/20 rounded-xl" />
                          <item.icon size={28} className="text-background relative z-10" />
                        </div>
                        <div className="flex-1 pt-1">
                          <h3 className="font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors duration-300">
                            {item.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="absolute left-4 bottom-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        <ChevronDown size={20} className="text-primary rotate-90" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer - Premium Style */}
      <footer className="relative py-12 text-center border-t border-border/30 bg-secondary/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <FlowerLogo animate={false} size={32} />
            <div className="w-px h-8 bg-border/50" />
            <div>
              <p className="font-bold text-foreground">التجمع الصحي الثاني بجدة</p>
              <p className="text-sm text-muted-foreground">Jeddah Second Health Cluster</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            © {new Date().getFullYear()} الرعاية الأولية المحسّنة - جميع الحقوق محفوظة
          </p>
        </div>
      </footer>

      {/* Custom Animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          animation: gradient 6s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Home;
