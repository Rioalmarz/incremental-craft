import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  UserCog
} from "lucide-react";

const Home = () => {
  const { user, profile, role, signOut, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchVideoUrl = async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "video_url")
        .maybeSingle();
      
      if (data?.value) {
        setVideoUrl(JSON.parse(JSON.stringify(data.value)));
      }
    };
    fetchVideoUrl();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background">
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
      path: "/all-data",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlowerLogo animate={false} size={40} />
            <div>
              <h1 className="text-lg font-bold text-primary">TBC</h1>
              <p className="text-xs text-muted-foreground">الرعاية المبنية على الفريق</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-left">
              <p className="text-sm font-medium">{profile?.name_ar || profile?.username}</p>
              <p className="text-xs text-muted-foreground">
                {isSuperAdmin ? "مدير النظام" : profile?.center_id || "مركز صحي"}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <FlowerLogo animate size={150} className="mx-auto mb-8" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-primary">الرعاية</span>{" "}
            <span className="text-accent">المبنية</span>{" "}
            <span className="text-primary">على الفريق</span>
          </h1>
          <div className="w-64 h-1 bg-gradient-to-l from-transparent via-primary to-transparent mx-auto my-6" />
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            نظام متكامل لإدارة ومتابعة مرضى الأمراض المزمنة
            <br />
            سكري • ضغط • دهون
          </p>
        </div>
      </section>

      {/* Video Section */}
      {videoUrl && (
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-3xl">
            <Card className="glass overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video">
                  <iframe
                    src={videoUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Menu Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">القائمة الرئيسية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {menuItems.map((item) => (
              <Card 
                key={item.path}
                className="glass glass-hover cursor-pointer group"
                onClick={() => navigate(item.path)}
              >
                <CardContent className="p-6 flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-secondary/50 ${item.color} group-hover:scale-110 transition-transform`}>
                    <item.icon size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Admin Section */}
          {isSuperAdmin && (
            <>
              <h2 className="text-2xl font-bold mb-8 mt-12 text-center">الإدارة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {adminMenuItems.map((item) => (
                  <Card 
                    key={item.path}
                    className="glass glass-hover cursor-pointer group border-primary/20"
                    onClick={() => navigate(item.path)}
                  >
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-primary/10 ${item.color} group-hover:scale-110 transition-transform`}>
                        <item.icon size={28} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
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
      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        <p>التجمع الصحي الثاني بجدة</p>
        <p className="mt-1">Jeddah Second Health Cluster</p>
      </footer>
    </div>
  );
};

export default Home;
