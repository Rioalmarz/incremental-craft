import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
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

gsap.registerPlugin(ScrollTrigger);

interface StorytellingScrollProps {
  isLoaded: boolean;
}

const StorytellingScroll = ({ isLoaded }: StorytellingScrollProps) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { titleAr: "الفرز الأولي", titleEn: "Screening", icon: ClipboardList, path: "/screening", color: "primary" },
    { titleAr: "العيادة الافتراضية", titleEn: "Virtual Clinic", icon: Stethoscope, path: "/virtual-clinic", color: "accent" },
    { titleAr: "الإحصائيات", titleEn: "Statistics", icon: BarChart3, path: "/statistics", color: "primary" },
    { titleAr: "المكتملين", titleEn: "Completed", icon: CheckCircle, path: "/completed", color: "accent" },
    { titleAr: "المستبعدين", titleEn: "Excluded", icon: XCircle, path: "/excluded", color: "primary" },
    { titleAr: "جميع البيانات", titleEn: "All Data", icon: Database, path: "/all-patients", color: "accent" },
    { titleAr: "الرعاية الوقائية", titleEn: "Preventive Care", icon: Shield, path: "/preventive-care", color: "primary" },
    { titleAr: "المؤهلين", titleEn: "Eligible", icon: UserCheck, path: "/eligible", color: "accent" },
    { titleAr: "جدولة الأطباء", titleEn: "Doctor Scheduling", icon: CalendarDays, path: "/doctor-scheduling", color: "primary" },
  ];

  const getTitle = (item: { titleAr: string; titleEn: string }) => 
    language === 'ar' ? item.titleAr : item.titleEn;

  useGSAP(() => {
    if (!containerRef.current || !horizontalRef.current) return;

    const sections = gsap.utils.toArray<HTMLElement>(".horizontal-section");
    
    // Hero text parallax fade
    if (heroTextRef.current) {
      gsap.to(heroTextRef.current, {
        y: -150,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: section1Ref.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        }
      });
    }

    // Logo scale effect
    if (logoRef.current) {
      gsap.fromTo(logoRef.current, 
        { scale: 1, opacity: 1 },
        {
          scale: 0.5,
          opacity: 0.3,
          ease: "none",
          scrollTrigger: {
            trigger: section1Ref.current,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          }
        }
      );
    }

    // Horizontal scroll section
    if (sections.length > 0) {
      const totalWidth = (sections.length - 1) * window.innerWidth;
      
      gsap.to(sections, {
        xPercent: language === 'ar' ? 100 * (sections.length - 1) : -100 * (sections.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: horizontalRef.current,
          pin: true,
          scrub: 1,
          snap: 1 / (sections.length - 1),
          end: () => "+=" + totalWidth,
        }
      });

      // Animate cards in each horizontal section
      sections.forEach((section, i) => {
        const cards = section.querySelectorAll('.menu-card-story');
        gsap.fromTo(cards, 
          { 
            y: 100, 
            opacity: 0,
            rotateX: 15,
          },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              containerAnimation: gsap.getById("horizontal-scroll") || undefined,
              start: "left center",
              end: "center center",
              scrub: 1,
            }
          }
        );
      });
    }

    // Section 3 - Final reveal with parallax
    if (section3Ref.current) {
      const finalCards = section3Ref.current.querySelectorAll('.final-card');
      gsap.fromTo(finalCards,
        { 
          y: 80, 
          opacity: 0,
          scale: 0.9,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section3Ref.current,
            start: "top 80%",
            end: "top 30%",
            scrub: 1,
          }
        }
      );
    }

  }, { scope: containerRef, dependencies: [language] });

  return (
    <div ref={containerRef} className="relative">
      {/* Section 1: Hero with Parallax */}
      <section 
        ref={section1Ref}
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div ref={logoRef} className="relative z-10 mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150" />
          <FlowerLogo animate size={120} />
        </div>
        
        <div ref={heroTextRef} className="text-center relative z-10 px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            {language === 'ar' ? 'نظام الرعاية الصحية' : 'Healthcare System'}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {language === 'ar' 
              ? 'اكتشف خدماتنا المتكاملة لإدارة الرعاية الصحية'
              : 'Discover our integrated healthcare management services'
            }
          </p>
          <div className="animate-bounce mt-12">
            <div className="w-8 h-12 rounded-full border-2 border-primary/50 mx-auto flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Horizontal Scroll */}
      <section ref={horizontalRef} className="relative overflow-hidden">
        <div className={`flex ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Panel 1 */}
          <div className="horizontal-section min-w-screen w-screen h-screen flex items-center justify-center px-8">
            <div className="text-center max-w-4xl">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-8">
                {language === 'ar' ? 'خدمات الفرز والتشخيص' : 'Screening & Diagnosis'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {menuItems.slice(0, 3).map((item) => (
                  <div
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="menu-card-story glass-card p-6 cursor-pointer group hover:-translate-y-2 transition-all duration-300"
                    style={{ perspective: '1000px' }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                      <item.icon size={32} className="text-primary" />
                    </div>
                    <p className="font-semibold text-foreground">{getTitle(item)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel 2 */}
          <div className="horizontal-section min-w-screen w-screen h-screen flex items-center justify-center px-8">
            <div className="text-center max-w-4xl">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-8">
                {language === 'ar' ? 'إدارة المرضى' : 'Patient Management'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {menuItems.slice(3, 6).map((item) => (
                  <div
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="menu-card-story glass-card p-6 cursor-pointer group hover:-translate-y-2 transition-all duration-300"
                    style={{ perspective: '1000px' }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                      <item.icon size={32} className="text-accent" />
                    </div>
                    <p className="font-semibold text-foreground">{getTitle(item)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel 3 */}
          <div className="horizontal-section min-w-screen w-screen h-screen flex items-center justify-center px-8">
            <div className="text-center max-w-4xl">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-8">
                {language === 'ar' ? 'الرعاية الوقائية' : 'Preventive Care'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {menuItems.slice(6, 9).map((item) => (
                  <div
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="menu-card-story glass-card p-6 cursor-pointer group hover:-translate-y-2 transition-all duration-300"
                    style={{ perspective: '1000px' }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                      <item.icon size={32} className="text-primary" />
                    </div>
                    <p className="font-semibold text-foreground">{getTitle(item)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Final Grid - Back to Normal Scroll */}
      <section 
        ref={section3Ref} 
        className="min-h-screen py-20 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            {language === 'ar' ? 'جميع الخدمات' : 'All Services'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {menuItems.map((item, index) => (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                className="final-card menu-card flex flex-col items-center text-center group"
                style={{ 
                  transitionDelay: `${index * 50}ms`,
                }}
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
        </div>
      </section>
    </div>
  );
};

export default StorytellingScroll;
