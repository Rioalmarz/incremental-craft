import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight, 
  User, 
  Save, 
  Loader2, 
  Camera, 
  Mail, 
  Calendar,
  Building2,
  Users,
  Briefcase,
  Shield,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  BarChart3,
  UserCog,
  Stethoscope,
  ClipboardList,
  Upload,
  Download
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ExcelImport from "@/components/ExcelImport";
import ExcelExport from "@/components/ExcelExport";

const Profile = () => {
  const { user, profile, role, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [nameAr, setNameAr] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [team, setTeam] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setNameAr(profile.name_ar || "");
      // Fetch additional profile data
      fetchProfileData();
    }
  }, [profile]);

  const fetchProfileData = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("job_title, team, avatar_url")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setJobTitle(data.job_title || "");
      setTeam(data.team || "");
      setAvatarUrl(data.avatar_url);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "خطأ",
          description: "حجم الصورة يجب أن يكون أقل من 2 ميجابايت",
          variant: "destructive",
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);

    try {
      let uploadedAvatarUrl = avatarUrl;

      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        uploadedAvatarUrl = `${publicUrl}?t=${Date.now()}`;
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          name_ar: nameAr,
          job_title: jobTitle,
          team: team,
          avatar_url: uploadedAvatarUrl,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setAvatarUrl(uploadedAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);

      toast({
        title: "تم الحفظ",
        description: "تم تحديث الملف الشخصي بنجاح",
      });

      // Refresh page to update header
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ البيانات",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال كلمة المرور الجديدة",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمة المرور الجديدة غير متطابقة",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast({
        title: "تم بنجاح",
        description: "تم تغيير كلمة المرور بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تغيير كلمة المرور",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getPermissions = () => {
    const permissions = [];
    
    if (isSuperAdmin) {
      permissions.push(
        { name: "الوصول للإحصائيات", icon: BarChart3, granted: true },
        { name: "إدارة المستخدمين", icon: UserCog, granted: true },
        { name: "العيادة الافتراضية", icon: Stethoscope, granted: true },
        { name: "الفرز الأولي", icon: ClipboardList, granted: true },
        { name: "استيراد البيانات", icon: Upload, granted: true },
        { name: "تصدير البيانات", icon: Download, granted: true },
      );
    } else {
      permissions.push(
        { name: "الوصول للإحصائيات", icon: BarChart3, granted: true },
        { name: "إدارة المستخدمين", icon: UserCog, granted: false },
        { name: "العيادة الافتراضية", icon: Stethoscope, granted: true },
        { name: "الفرز الأولي", icon: ClipboardList, granted: true },
        { name: "استيراد البيانات", icon: Upload, granted: false },
        { name: "تصدير البيانات", icon: Download, granted: false },
      );
    }
    
    return permissions;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background">
        <FlowerLogo animate size={100} />
      </div>
    );
  }

  const displayAvatar = avatarPreview || avatarUrl;
  const createdAt = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : "-";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowRight size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <User className="text-primary" size={24} />
            <div>
              <h1 className="text-lg font-bold">الملف الشخصي</h1>
              <p className="text-xs text-muted-foreground">إدارة بيانات حسابك</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Section 1: Basic Information */}
        <Card className="glass overflow-hidden">
          <CardHeader className="bg-gradient-to-l from-primary/10 to-accent/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <User size={20} className="text-primary" />
              المعلومات الأساسية
            </CardTitle>
            <CardDescription>
              معلومات حسابك الشخصية
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-xl">
                    {displayAvatar ? (
                      <AvatarImage src={displayAvatar} alt="صورة المستخدم" className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                        {(nameAr || profile?.username || "م")?.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                  >
                    <Camera className="text-white" size={24} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={16} className="ml-2" />
                  تغيير الصورة
                </Button>
                {avatarPreview && (
                  <p className="text-xs text-muted-foreground">سيتم حفظ الصورة عند الضغط على حفظ التعديلات</p>
                )}
              </div>

              {/* Form Fields */}
              <div className="flex-1 grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User size={14} className="text-primary" />
                      الاسم الكامل
                    </Label>
                    <Input
                      value={nameAr}
                      onChange={(e) => setNameAr(e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Briefcase size={14} className="text-primary" />
                      المسمّى الوظيفي
                    </Label>
                    <Select value={jobTitle} onValueChange={setJobTitle}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المسمّى الوظيفي" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="مدير النظام">مدير النظام</SelectItem>
                        <SelectItem value="طبيب أسرة">طبيب أسرة</SelectItem>
                        <SelectItem value="منسق فريق">منسق فريق</SelectItem>
                        <SelectItem value="مشرف إداري">مشرف إداري</SelectItem>
                        <SelectItem value="ممرض">ممرض</SelectItem>
                        <SelectItem value="صيدلي">صيدلي</SelectItem>
                        <SelectItem value="أخصائي">أخصائي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users size={14} className="text-primary" />
                      الفريق
                    </Label>
                    <Input
                      value={team}
                      onChange={(e) => setTeam(e.target.value)}
                      placeholder="مثال: الفريق الثاني"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 size={14} className="text-primary" />
                      المركز الصحي
                    </Label>
                    <Input
                      value={profile?.center_id || "-"}
                      disabled
                      className="bg-muted/50"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail size={14} className="text-primary" />
                      البريد الإلكتروني
                    </Label>
                    <Input
                      value={user?.email || "-"}
                      disabled
                      className="bg-muted/50"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar size={14} className="text-primary" />
                      تاريخ إنشاء الحساب
                    </Label>
                    <Input
                      value={createdAt}
                      disabled
                      className="bg-muted/50"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="w-full mt-4"
                  size="lg"
                >
                  {isSavingProfile ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Save size={18} className="ml-2" />
                      حفظ التعديلات
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Account Settings */}
        <Card className="glass">
          <CardHeader className="bg-gradient-to-l from-accent/10 to-primary/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <Key size={20} className="text-primary" />
              إعدادات الحساب
            </CardTitle>
            <CardDescription>
              تغيير كلمة المرور وإعدادات الأمان
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Change Password */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Key size={16} className="text-primary" />
                تغيير كلمة المرور
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>كلمة المرور الحالية</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleChangePassword}
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                variant="outline"
                className="w-full md:w-auto"
              >
                {isChangingPassword ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Key size={16} className="ml-2" />
                    تحديث كلمة المرور
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import/Export Section - Only for SuperAdmin */}
        {isSuperAdmin && (
          <>
            <ExcelImport />
            <ExcelExport />
          </>
        )}

        {/* Section 3: Permissions (Read-only) */}
        <Card className="glass">
          <CardHeader className="bg-gradient-to-l from-primary/10 to-accent/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <Shield size={20} className="text-primary" />
              الصلاحيات
            </CardTitle>
            <CardDescription>
              صلاحيات حسابك في النظام (للقراءة فقط)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4 p-4 rounded-lg bg-secondary/30 border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Shield size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold">الدور الحالي</p>
                  <p className="text-sm text-muted-foreground">
                    {isSuperAdmin ? "مدير النظام (Superadmin)" : "مستخدم مركز صحي"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {getPermissions().map((permission, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    permission.granted 
                      ? "bg-success/10 border-success/30" 
                      : "bg-muted/30 border-muted"
                  }`}
                >
                  <div className={`p-1.5 rounded-full ${permission.granted ? "bg-success/20" : "bg-muted"}`}>
                    {permission.granted ? (
                      <Check size={14} className="text-success" />
                    ) : (
                      <X size={14} className="text-muted-foreground" />
                    )}
                  </div>
                  <permission.icon size={16} className={permission.granted ? "text-success" : "text-muted-foreground"} />
                  <span className={`text-sm ${permission.granted ? "text-foreground" : "text-muted-foreground"}`}>
                    {permission.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;