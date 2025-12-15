import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Users, Clock, ClipboardList, Stethoscope, CheckCircle, XCircle, AlertTriangle, Pill, Activity, Heart, Droplets } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PatientStats {
  total: number;
  pending: number;
  virtualClinic: number;
  completed: number;
  excluded: number;
  urgent: number;
}

interface UrgencyStats {
  urgent: number;
  soon: number;
  scheduled: number;
  variable: number;
}

interface ChronicStats {
  dm: number;
  htn: number;
  dyslipidemia: number;
  dmHtn: number;
  all: number;
}

interface BurdenStats {
  high: number;
  medium: number;
  low: number;
}

interface AgeStats {
  under18: number;
  age18to34: number;
  age35to50: number;
  age50to65: number;
  age65to75: number;
  over75: number;
}

interface GenderStats {
  male: number;
  female: number;
}

interface CenterStats {
  center_id: string;
  total: number;
  completed: number;
  urgent: number;
  completionRate: number;
}

interface MedicationStats {
  polypharmacyCount: number;
  averageMeds: number;
  polypharmacyPercent: number;
  averageCompliance: number;
}

const Statistics = () => {
  const { user, profile, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [patientStats, setPatientStats] = useState<PatientStats>({ total: 0, pending: 0, virtualClinic: 0, completed: 0, excluded: 0, urgent: 0 });
  const [urgencyStats, setUrgencyStats] = useState<UrgencyStats>({ urgent: 0, soon: 0, scheduled: 0, variable: 0 });
  const [chronicStats, setChronicStats] = useState<ChronicStats>({ dm: 0, htn: 0, dyslipidemia: 0, dmHtn: 0, all: 0 });
  const [burdenStats, setBurdenStats] = useState<BurdenStats>({ high: 0, medium: 0, low: 0 });
  const [ageStats, setAgeStats] = useState<AgeStats>({ under18: 0, age18to34: 0, age35to50: 0, age50to65: 0, age65to75: 0, over75: 0 });
  const [genderStats, setGenderStats] = useState<GenderStats>({ male: 0, female: 0 });
  const [centerStats, setCenterStats] = useState<CenterStats[]>([]);
  const [medicationStats, setMedicationStats] = useState<MedicationStats>({ polypharmacyCount: 0, averageMeds: 0, polypharmacyPercent: 0, averageCompliance: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAllStats();
    }
  }, [user, isSuperAdmin, profile]);

  const fetchAllStats = async () => {
    setIsLoading(true);
    try {
      // Fetch patients
      let query = supabase.from("patients").select("*");
      if (!isSuperAdmin && profile?.center_id) {
        query = query.eq("center_id", profile.center_id);
      }
      const { data: patients } = await query;
      
      if (!patients) {
        setIsLoading(false);
        return;
      }

      // Patient Stats
      const stats: PatientStats = {
        total: patients.length,
        pending: patients.filter(p => p.status === "pending").length,
        virtualClinic: patients.filter(p => p.status === "virtualClinic").length,
        completed: patients.filter(p => p.status === "completed").length,
        excluded: patients.filter(p => p.status === "excluded").length,
        urgent: patients.filter(p => p.urgency_status?.includes("🔴") || (p.days_until_visit && p.days_until_visit <= 3)).length,
      };
      setPatientStats(stats);

      // Urgency Stats
      const urgency: UrgencyStats = {
        urgent: patients.filter(p => p.days_until_visit && p.days_until_visit <= 3).length,
        soon: patients.filter(p => p.days_until_visit && p.days_until_visit > 3 && p.days_until_visit <= 7).length,
        scheduled: patients.filter(p => p.days_until_visit && p.days_until_visit > 7).length,
        variable: patients.filter(p => !p.days_until_visit).length,
      };
      setUrgencyStats(urgency);

      // Chronic Stats
      const chronic: ChronicStats = {
        dm: patients.filter(p => p.has_dm && !p.has_htn && !p.has_dyslipidemia).length,
        htn: patients.filter(p => p.has_htn && !p.has_dm && !p.has_dyslipidemia).length,
        dyslipidemia: patients.filter(p => p.has_dyslipidemia && !p.has_dm && !p.has_htn).length,
        dmHtn: patients.filter(p => p.has_dm && p.has_htn && !p.has_dyslipidemia).length,
        all: patients.filter(p => p.has_dm && p.has_htn && p.has_dyslipidemia).length,
      };
      setChronicStats(chronic);

      // Burden Stats
      const burden: BurdenStats = {
        high: patients.filter(p => p.burden === "عالي").length,
        medium: patients.filter(p => p.burden === "متوسط").length,
        low: patients.filter(p => p.burden === "منخفض").length,
      };
      setBurdenStats(burden);

      // Age Stats
      const age: AgeStats = {
        under18: patients.filter(p => p.age && p.age < 18).length,
        age18to34: patients.filter(p => p.age && p.age >= 18 && p.age < 35).length,
        age35to50: patients.filter(p => p.age && p.age >= 35 && p.age <= 50).length,
        age50to65: patients.filter(p => p.age && p.age > 50 && p.age <= 65).length,
        age65to75: patients.filter(p => p.age && p.age > 65 && p.age <= 75).length,
        over75: patients.filter(p => p.age && p.age > 75).length,
      };
      setAgeStats(age);

      // Gender Stats
      const gender: GenderStats = {
        male: patients.filter(p => p.gender === "Male" || p.gender === "ذكر").length,
        female: patients.filter(p => p.gender === "Female" || p.gender === "أنثى").length,
      };
      setGenderStats(gender);

      // Center Stats (only for superadmin)
      if (isSuperAdmin) {
        const centerMap = new Map<string, { total: number; completed: number; urgent: number }>();
        patients.forEach(p => {
          if (!p.center_id) return;
          const existing = centerMap.get(p.center_id) || { total: 0, completed: 0, urgent: 0 };
          existing.total++;
          if (p.status === "completed") existing.completed++;
          if (p.days_until_visit && p.days_until_visit <= 3) existing.urgent++;
          centerMap.set(p.center_id, existing);
        });
        
        const centers: CenterStats[] = Array.from(centerMap.entries()).map(([center_id, data]) => ({
          center_id,
          total: data.total,
          completed: data.completed,
          urgent: data.urgent,
          completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        })).sort((a, b) => b.completionRate - a.completionRate);
        
        setCenterStats(centers);
      }

      // Medication Stats
      const patientIds = patients.map(p => p.id);
      const { data: medications } = await supabase
        .from("medications")
        .select("*")
        .in("patient_id", patientIds);

      if (medications) {
        const patientMedCounts = new Map<string, number>();
        medications.forEach(m => {
          patientMedCounts.set(m.patient_id, (patientMedCounts.get(m.patient_id) || 0) + 1);
        });
        
        const polypharmacyCount = Array.from(patientMedCounts.values()).filter(c => c >= 5).length;
        const totalMeds = medications.length;
        const totalPatients = patientMedCounts.size;
        const averageMeds = totalPatients > 0 ? Math.round((totalMeds / totalPatients) * 10) / 10 : 0;
        
        const complianceValues = medications.filter(m => m.compliance_percent !== null).map(m => m.compliance_percent as number);
        const averageCompliance = complianceValues.length > 0 
          ? Math.round(complianceValues.reduce((a, b) => a + b, 0) / complianceValues.length)
          : 0;

        setMedicationStats({
          polypharmacyCount,
          averageMeds,
          polypharmacyPercent: patientMedCounts.size > 0 ? Math.round((polypharmacyCount / patientMedCounts.size) * 100) : 0,
          averageCompliance,
        });
      }

    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background">
        <FlowerLogo animate size={100} />
      </div>
    );
  }

  // Chart colors using design tokens
  const COLORS = {
    primary: "hsl(187, 70%, 45%)",
    accent: "hsl(195, 65%, 35%)",
    success: "hsl(160, 70%, 40%)",
    warning: "hsl(45, 90%, 50%)",
    destructive: "hsl(0, 84%, 60%)",
    info: "hsl(200, 80%, 50%)",
    muted: "hsl(200, 15%, 45%)",
  };

  const urgencyChartData = [
    { name: "عاجل (≤3 أيام)", value: urgencyStats.urgent, color: COLORS.destructive },
    { name: "قريب (4-7 أيام)", value: urgencyStats.soon, color: COLORS.warning },
    { name: "مجدول (>7 أيام)", value: urgencyStats.scheduled, color: COLORS.success },
    { name: "غير محدد", value: urgencyStats.variable, color: COLORS.muted },
  ];

  const chronicChartData = [
    { name: "سكري فقط", value: chronicStats.dm },
    { name: "ضغط فقط", value: chronicStats.htn },
    { name: "دهون فقط", value: chronicStats.dyslipidemia },
    { name: "سكري + ضغط", value: chronicStats.dmHtn },
    { name: "الثلاثة", value: chronicStats.all },
  ];

  const burdenChartData = [
    { name: "عالي", value: burdenStats.high, color: COLORS.destructive },
    { name: "متوسط", value: burdenStats.medium, color: COLORS.warning },
    { name: "منخفض", value: burdenStats.low, color: COLORS.success },
  ];

  const ageChartData = [
    { name: "<18", value: ageStats.under18 },
    { name: "18-34", value: ageStats.age18to34 },
    { name: "35-50", value: ageStats.age35to50 },
    { name: "50-65", value: ageStats.age50to65 },
    { name: "65-75", value: ageStats.age65to75 },
    { name: ">75", value: ageStats.over75 },
  ];

  const genderChartData = [
    { name: "ذكور", value: genderStats.male, color: COLORS.info },
    { name: "إناث", value: genderStats.female, color: COLORS.accent },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowRight size={20} />
            </Button>
            <FlowerLogo animate={false} size={40} />
            <div>
              <h1 className="text-lg font-bold text-primary">الإحصائيات</h1>
              <p className="text-xs text-muted-foreground">تقارير وتحليلات شاملة</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full" dir="rtl">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="overview">لوحة عامة</TabsTrigger>
            <TabsTrigger value="health">تحليل صحي</TabsTrigger>
            <TabsTrigger value="performance">أداء وتشغيل</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="glass">
                <CardContent className="p-4 text-center">
                  <Users className="mx-auto mb-2 text-primary" size={28} />
                  <p className="text-2xl font-bold">{patientStats.total}</p>
                  <p className="text-xs text-muted-foreground">إجمالي المرضى</p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="p-4 text-center">
                  <Clock className="mx-auto mb-2 text-[hsl(var(--warning))]" size={28} />
                  <p className="text-2xl font-bold">{patientStats.pending}</p>
                  <p className="text-xs text-muted-foreground">بانتظار الفرز</p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="p-4 text-center">
                  <Stethoscope className="mx-auto mb-2 text-accent" size={28} />
                  <p className="text-2xl font-bold">{patientStats.virtualClinic}</p>
                  <p className="text-xs text-muted-foreground">العيادة الافتراضية</p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="mx-auto mb-2 text-[hsl(var(--success))]" size={28} />
                  <p className="text-2xl font-bold">{patientStats.completed}</p>
                  <p className="text-xs text-muted-foreground">مكتمل</p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="p-4 text-center">
                  <XCircle className="mx-auto mb-2 text-destructive" size={28} />
                  <p className="text-2xl font-bold">{patientStats.excluded}</p>
                  <p className="text-xs text-muted-foreground">مستبعد</p>
                </CardContent>
              </Card>
              <Card className="glass border-destructive/50">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="mx-auto mb-2 text-destructive" size={28} />
                  <p className="text-2xl font-bold text-destructive">{patientStats.urgent}</p>
                  <p className="text-xs text-muted-foreground">حالات عاجلة</p>
                </CardContent>
              </Card>
            </div>

            {/* Urgency Chart */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock size={20} className="text-primary" />
                  حالة الزيارة (أولوية الاستحقاق)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={urgencyChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {urgencyChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Analysis Tab */}
          <TabsContent value="health" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chronic Conditions */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity size={20} className="text-primary" />
                    الأمراض المزمنة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chronicChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="value" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Burden Levels */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart size={20} className="text-primary" />
                    العبء المرضي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={burdenChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {burdenChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Polypharmacy */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill size={20} className="text-primary" />
                    تعدد الأدوية (Polypharmacy)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-bold text-primary">{medicationStats.polypharmacyCount}</p>
                      <p className="text-xs text-muted-foreground">مرضى ≥5 أدوية</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-accent">{medicationStats.averageMeds}</p>
                      <p className="text-xs text-muted-foreground">متوسط عدد الأدوية</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-[hsl(var(--warning))]">{medicationStats.polypharmacyPercent}%</p>
                      <p className="text-xs text-muted-foreground">نسبة Polypharmacy</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">نسبة تعدد الأدوية</span>
                      <span className="text-sm font-bold">{medicationStats.polypharmacyPercent}%</span>
                    </div>
                    <Progress value={medicationStats.polypharmacyPercent} className="h-3" />
                  </div>
                </CardContent>
              </Card>

              {/* Medication Compliance */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets size={20} className="text-primary" />
                    الالتزام الدوائي المتوقع
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-primary">{medicationStats.averageCompliance}%</p>
                    <p className="text-sm text-muted-foreground mt-2">متوسط الالتزام العام</p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">نسبة الالتزام</span>
                      <span className="text-sm font-bold">{medicationStats.averageCompliance}%</span>
                    </div>
                    <Progress 
                      value={medicationStats.averageCompliance} 
                      className={`h-3 ${medicationStats.averageCompliance < 50 ? "[&>div]:bg-destructive" : medicationStats.averageCompliance < 80 ? "[&>div]:bg-[hsl(var(--warning))]" : "[&>div]:bg-[hsl(var(--success))]"}`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Age Distribution */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users size={20} className="text-primary" />
                    التوزيع العمري
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill={COLORS.info} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Gender Distribution */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users size={20} className="text-primary" />
                    التوزيع حسب الجنس
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {genderChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-8">
            {/* Workflow Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass">
                <CardContent className="p-4 text-center">
                  <ClipboardList className="mx-auto mb-2 text-primary" size={28} />
                  <p className="text-2xl font-bold">{patientStats.pending}</p>
                  <p className="text-xs text-muted-foreground">بانتظار الفرز</p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="p-4 text-center">
                  <Stethoscope className="mx-auto mb-2 text-accent" size={28} />
                  <p className="text-2xl font-bold">{patientStats.virtualClinic}</p>
                  <p className="text-xs text-muted-foreground">في العيادة الافتراضية</p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="mx-auto mb-2 text-[hsl(var(--success))]" size={28} />
                  <p className="text-2xl font-bold">{patientStats.completed}</p>
                  <p className="text-xs text-muted-foreground">مكتمل</p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="p-4 text-center">
                  <XCircle className="mx-auto mb-2 text-destructive" size={28} />
                  <p className="text-2xl font-bold">{patientStats.excluded}</p>
                  <p className="text-xs text-muted-foreground">مستبعد</p>
                </CardContent>
              </Card>
            </div>

            {/* Completion Rate */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>معدل الإنجاز العام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>نسبة الإكمال من الإجمالي</span>
                    <span className="font-bold">
                      {patientStats.total > 0 ? Math.round((patientStats.completed / patientStats.total) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={patientStats.total > 0 ? (patientStats.completed / patientStats.total) * 100 : 0} 
                    className="h-4"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>مكتمل: {patientStats.completed}</span>
                    <span>الإجمالي: {patientStats.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Center Performance (Superadmin only) */}
            {isSuperAdmin && centerStats.length > 0 && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle>أداء المراكز الصحية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">#</TableHead>
                          <TableHead className="text-right">المركز الصحي</TableHead>
                          <TableHead className="text-center">إجمالي المرضى</TableHead>
                          <TableHead className="text-center">مكتمل</TableHead>
                          <TableHead className="text-center">عاجل</TableHead>
                          <TableHead className="text-center">نسبة الإكمال</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {centerStats.slice(0, 10).map((center, index) => (
                          <TableRow key={center.center_id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>{center.center_id}</TableCell>
                            <TableCell className="text-center">{center.total}</TableCell>
                            <TableCell className="text-center text-[hsl(var(--success))]">{center.completed}</TableCell>
                            <TableCell className="text-center text-destructive">{center.urgent}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <Progress value={center.completionRate} className="h-2 w-16" />
                                <span className="text-sm font-medium">{center.completionRate}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Statistics;
