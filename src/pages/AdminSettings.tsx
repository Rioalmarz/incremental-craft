import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Settings as SettingsIcon, Save, Video, Webhook, Loader2 } from "lucide-react";
import ExcelImport from "@/components/ExcelImport";

const AdminSettings = () => {
  const { user, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [videoUrl, setVideoUrl] = useState("");
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && !isSuperAdmin) {
      navigate("/");
    }
  }, [user, loading, isSuperAdmin, navigate]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("settings")
        .select("*");

      if (data) {
        data.forEach(setting => {
          if (setting.key === "video_url") {
            setVideoUrl(JSON.parse(JSON.stringify(setting.value)) || "");
          }
          if (setting.key === "n8n_webhook_url") {
            setN8nWebhookUrl(JSON.parse(JSON.stringify(setting.value)) || "");
          }
        });
      }
    };

    if (isSuperAdmin) {
      fetchSettings();
    }
  }, [isSuperAdmin]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Update video URL
      await supabase
        .from("settings")
        .upsert({ key: "video_url", value: JSON.stringify(videoUrl) });

      // Update n8n webhook URL
      await supabase
        .from("settings")
        .upsert({ key: "n8n_webhook_url", value: JSON.stringify(n8nWebhookUrl) });

      toast({
        title: "تم الحفظ",
        description: "تم حفظ الإعدادات بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitSuperAdmins = async () => {
    setIsInitializing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("manage-users", {
        body: { action: "init_superadmins" },
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء حسابات المدراء الافتراضية",
      });

      console.log("Init results:", response.data);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء الحسابات",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background">
        <FlowerLogo animate size={100} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowRight size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <SettingsIcon className="text-primary" size={24} />
            <div>
              <h1 className="text-lg font-bold">الإعدادات</h1>
              <p className="text-xs text-muted-foreground">إعدادات النظام والتكاملات</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Excel Import */}
        <ExcelImport />
        {/* Video Settings */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video size={20} />
              الفيديو التعريفي
            </CardTitle>
            <CardDescription>
              رابط الفيديو الذي يظهر في الصفحة الرئيسية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>رابط الفيديو (YouTube Embed)</Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/embed/..."
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                استخدم رابط التضمين من YouTube (Embed URL)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* n8n Settings */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook size={20} />
              تكامل n8n
            </CardTitle>
            <CardDescription>
              إعداد Webhook لتكامل n8n (اختياري)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>رابط Webhook</Label>
              <Input
                value={n8nWebhookUrl}
                onChange={(e) => setN8nWebhookUrl(e.target.value)}
                placeholder="https://your-n8n-instance.com/webhook/..."
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                سيتم استخدام هذا الرابط لإرسال الإشعارات والتقارير
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          onClick={handleSaveSettings} 
          disabled={isSaving}
          className="w-full"
          size="lg"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <Save size={18} className="ml-2" />
              حفظ الإعدادات
            </>
          )}
        </Button>

        {/* Initialize Super Admins */}
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle>إنشاء الحسابات الافتراضية</CardTitle>
            <CardDescription>
              إنشاء حسابات المدراء الثلاثة (Mahdi, Rayan, Firas)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleInitSuperAdmins}
              disabled={isInitializing}
              variant="outline"
              className="w-full"
            >
              {isInitializing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : "إنشاء الحسابات الافتراضية"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminSettings;
