import { useEffect, useState, useRef, useCallback } from "react";
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
  Sparkles,
  CalendarDays
} from "lucide-react";
import mahdiProfile from "@/assets/mahdi-profile.jpg";

// Particle component for animated background with mouse interaction
const ParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
    }> = [];
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    const createParticles = () => {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 12000);
      
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2.5 + 1,
          opacity: Math.random() * 0.5 + 0.2,
          color: Math.random() > 0.5 ? '0, 188, 212' : '0, 150, 136'
        });
      }
    };
    
    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mouse = mouseRef.current;
      const interactionRadius = 150;
      const repelStrength = 80;
      
      particles.forEach((particle, i) => {
        // Calculate distance from mouse
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Repel particles away from mouse
        if (distance < interactionRadius && distance > 0) {
          const force = (interactionRadius - distance) / interactionRadius;
          const angle = Math.atan2(dy, dx);
          particle.x -= Math.cos(angle) * force * repelStrength * 0.05;
          particle.y -= Math.sin(angle) * force * repelStrength * 0.05;
        } else {
          // Normal floating movement
          particle.x += particle.vx;
          particle.y += particle.vy;
        }
        
        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        // Pulsing size effect near mouse
        let currentSize = particle.size;
        if (distance < interactionRadius) {
          currentSize = particle.size * (1 + (1 - distance / interactionRadius) * 0.5);
        }
        
        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, currentSize * 2
        );
        gradient.addColorStop(0, `rgba(${particle.color}, ${particle.opacity})`);
        gradient.addColorStop(1, `rgba(${particle.color}, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw connections
        particles.slice(i + 1).forEach(other => {
          const dx2 = particle.x - other.x;
          const dy2 = particle.y - other.y;
          const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(0, 188, 212, ${0.15 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        });
      });
      
      animationFrameId = requestAnimationFrame(drawParticles);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };
    
    resize();
    createParticles();
    drawParticles();
    
    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
};

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
      description: "فرز المستفيدين الجدد وتحديد الأولويات",
      gradient: "from-[hsl(var(--primary))] to-[hsl(var(--accent))]"
    },
    { 
      title: "العيادة الافتراضية", 
      icon: Stethoscope, 
      path: "/virtual-clinic",
      description: "متابعة المستفيدين المحولين للعيادة",
      gradient: "from-[hsl(var(--accent))] to-[hsl(180,70%,35%)]"
    },
    { 
      title: "الرعاية الوقائية", 
      icon: Shield, 
      path: "/preventive-care",
      description: "الفحوصات والتطعيمات والتثقيف الصحي",
      gradient: "from-[hsl(var(--info))] to-[hsl(220,70%,50%)]"
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
      description: "عرض جميع بيانات المستفيدين",
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
      title: "جدولة الأطباء (محدث)", 
      icon: CalendarDays, 
      path: "/doctor-scheduling",
      description: "جداول الأطباء لجميع المراكز الصحية",
      gradient: "from-[hsl(280,60%,50%)] to-[hsl(320,60%,45%)]"
    },
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

  const isSuperAdminUser = profile?.username === 'mahdi' || profile?.username === 'rayan' || profile?.username === 'firas';
  const userDisplayName = profile?.name_ar || profile?.username;
  const userTeam = profile?.team || '';
  const userCenter = profile?.center_id ? getCenterName(profile.center_id) : '';
  const isMahdi = profile?.username === 'mahdi';

  // Helper function to get center display name
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
      'bawadi1': 'مركز صحي البوادي 1',
      'bawadi2': 'مركز صحي البوادي 2',
      'safa1': 'مركز صحي الصفا 1',
      'safa2': 'مركز صحي الصفا 2',
      'marwah': 'مركز صحي المروة',
      'nahda': 'مركز صحي النهضة',
      'faisaliyah': 'مركز صحي الفيصلية',
      'mushrifah': 'مركز صحي المشرفة',
      'rabwah': 'مركز صحي الربوة',
    };
    return centerNames[centerId] || centerId;
  }

  return (
    <div className={`min-h-screen bg-background overflow-hidden transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Animated Particles Background */}
      <ParticlesBackground />
      
      {/* Gradient Overlays */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-accent/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
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
                  {isSuperAdminUser ? (
                    <>
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {userDisplayName}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          {profile?.job_title || 'إدارة'} • {userTeam} • {userCenter}
                        </p>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Avatar className="h-10 w-10 border-2 border-primary/30 shadow-md group-hover:border-primary/50 group-hover:shadow-lg transition-all relative z-10">
                          {isMahdi ? (
                            <AvatarImage src={mahdiProfile} alt={userDisplayName || ''} className="object-cover" />
                          ) : profile?.avatar_url ? (
                            <AvatarImage src={profile.avatar_url} alt={userDisplayName || ''} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {userDisplayName?.charAt(0) || 'م'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {userDisplayName}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {userCenter || profile?.center_id || "مركز صحي"}
                        </p>
                      </div>
                      <Avatar className="h-10 w-10 border-2 border-primary/30 shadow-md group-hover:border-primary/50 group-hover:shadow-lg transition-all">
                        {profile?.avatar_url ? (
                          <AvatarImage src={profile.avatar_url} alt={userDisplayName || ''} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                          {userDisplayName?.charAt(0) || 'م'}
                        </AvatarFallback>
                      </Avatar>
                    </>
                  )}
                  <ChevronDown size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-xl p-2">
                <div className="px-3 py-3 mb-2 bg-secondary/30 rounded-lg">
                  <p className="text-sm font-semibold">{userDisplayName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{isSuperAdmin ? "مدير النظام" : userCenter || "مستخدم"}</p>
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
              Enhanced Primary Care
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

      {/* Main Menu Cards - Ultra Creative 3D Design */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto">
          <h2 className={`text-3xl font-bold mb-16 text-center text-foreground transition-all duration-700 delay-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <span className="relative inline-block">
              <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                القائمة الرئيسية
              </span>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-l from-primary via-accent to-primary rounded-full" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-l from-primary via-accent to-primary rounded-full blur-sm" />
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto perspective-1000">
            {menuItems.map((item, index) => (
              <div
                key={item.path}
                className={`group relative cursor-pointer transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ 
                  transitionDelay: `${800 + index * 150}ms`,
                  animation: isLoaded ? `float 6s ease-in-out ${index * 0.5}s infinite` : 'none'
                }}
                onClick={() => navigate(item.path)}
              >
                {/* Animated Gradient Border */}
                <div className="absolute -inset-[2px] rounded-3xl overflow-hidden">
                  <div 
                    className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    style={{ animation: 'spin-slow 4s linear infinite' }}
                  />
                </div>
                
                {/* Outer Glow */}
                <div className={`absolute -inset-4 bg-gradient-to-r ${item.gradient} rounded-3xl blur-2xl opacity-0 group-hover:opacity-25 transition-all duration-700`} />
                
                {/* Card Container with 3D Transform */}
                <div 
                  className="relative bg-background/90 backdrop-blur-2xl rounded-3xl p-8 shadow-xl transition-all duration-500 group-hover:shadow-2xl overflow-hidden border border-border/30 group-hover:border-transparent"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(0)',
                  }}
                >
                  {/* Inner Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500`} />
                  
                  {/* Animated Light Beam */}
                  <div className="absolute inset-0 overflow-hidden rounded-3xl">
                    <div className="absolute -top-full left-0 w-full h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent transform -translate-y-full group-hover:translate-y-[200%] transition-transform duration-1000 ease-in-out" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon Container - Floating Effect */}
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        {/* Icon Glow */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-2xl blur-xl opacity-50 group-hover:opacity-80 group-hover:scale-125 transition-all duration-500`} />
                        
                        {/* Icon Box */}
                        <div 
                          className={`relative p-5 rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110`}
                          style={{
                            transform: 'translateZ(30px)',
                          }}
                        >
                          <item.icon 
                            size={36} 
                            className="text-background relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" 
                          />
                        </div>
                        
                        {/* Floating Particles */}
                        <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-primary/60 opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDuration: '1.5s' }} />
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-accent/60 opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-bold text-xl mb-3 text-center text-foreground group-hover:text-primary transition-colors duration-300">
                      {item.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-muted-foreground text-center leading-relaxed mb-4">
                      {item.description}
                    </p>
                    
                    {/* Action Indicator */}
                    <div className="flex justify-center">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-l ${item.gradient} opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-lg`}>
                        <span className="text-xs font-bold text-background">اضغط للدخول</span>
                        <ChevronDown size={14} className="text-background rotate-90 animate-pulse" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Corner Decorations */}
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${item.gradient} opacity-10 rounded-bl-full`} />
                  <div className={`absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr ${item.gradient} opacity-10 rounded-tr-full`} />
                </div>
              </div>
            ))}
          </div>

          {/* Admin Section */}
          {isSuperAdmin && (
            <>
              <h2 className={`text-3xl font-bold mb-16 mt-24 text-center text-foreground transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                <span className="relative inline-block">
                  <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                    لوحة الإدارة
                  </span>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-l from-primary via-accent to-primary rounded-full" />
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {adminMenuItems.map((item, index) => (
                  <div
                    key={item.path}
                    className={`group relative cursor-pointer transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                    style={{ 
                      transitionDelay: `${1400 + index * 150}ms`,
                      animation: isLoaded ? `float 6s ease-in-out ${index * 0.5 + 3}s infinite` : 'none'
                    }}
                    onClick={() => navigate(item.path)}
                  >
                    {/* Animated Border */}
                    <div className="absolute -inset-[2px] rounded-3xl overflow-hidden">
                      <div 
                        className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-500`}
                        style={{ animation: 'spin-slow 4s linear infinite' }}
                      />
                    </div>
                    
                    {/* Glow */}
                    <div className={`absolute -inset-4 bg-gradient-to-r ${item.gradient} rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-all duration-700`} />
                    
                    <div className="relative bg-background/90 backdrop-blur-2xl rounded-3xl p-8 shadow-xl transition-all duration-500 group-hover:shadow-2xl overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-[0.05] group-hover:opacity-[0.12] transition-opacity duration-500`} />
                      
                      <div className="relative z-10">
                        <div className="flex justify-center mb-6">
                          <div className="relative">
                            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-2xl blur-xl opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500`} />
                            <div className={`relative p-5 rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110`}>
                              <item.icon size={36} className="text-background relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />
                            </div>
                          </div>
                        </div>
                        
                        <h3 className="font-bold text-xl mb-3 text-center text-foreground group-hover:text-primary transition-colors duration-300">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-4">
                          {item.description}
                        </p>
                        
                        <div className="flex justify-center">
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-l ${item.gradient} opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-lg`}>
                            <span className="text-xs font-bold text-background">اضغط للدخول</span>
                            <ChevronDown size={14} className="text-background rotate-90" />
                          </div>
                        </div>
                      </div>
                      
                      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${item.gradient} opacity-10 rounded-bl-full`} />
                      <div className={`absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr ${item.gradient} opacity-10 rounded-tr-full`} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer - Premium Style */}
      <footer className="relative py-16 text-center border-t border-border/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-primary/10 to-transparent rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
              <FlowerLogo animate={false} size={40} className="relative z-10" />
            </div>
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-border to-transparent" />
            <div className="text-right">
              <p className="font-bold text-lg text-foreground">التجمع الصحي الثاني بجدة</p>
              <p className="text-sm text-primary font-medium">Jeddah Second Health Cluster</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-6">
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
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }
        
        .animate-gradient {
          animation: gradient 6s ease infinite;
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .group:hover .card-3d {
          transform: rotateX(5deg) rotateY(-5deg) translateZ(20px);
        }
      `}</style>
    </div>
  );
};

export default Home;
