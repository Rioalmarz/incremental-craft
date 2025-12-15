import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Users, Clock, Stethoscope, CheckCircle, XCircle, AlertTriangle, Pill, Activity, Heart, Filter, Search, X, RotateCcw, Download, RefreshCw, Printer, Check } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

const STORAGE_KEY = 'tbc_filters_v1';
const CHART_COLORS = {
  primary: 'hsl(187, 70%, 45%)',
  male: 'hsl(210, 80%, 55%)',
  female: 'hsl(340, 80%, 55%)',
  success: 'hsl(160, 70%, 45%)',
  warning: 'hsl(45, 90%, 50%)',
  danger: 'hsl(0, 70%, 55%)',
  purple: 'hsl(280, 65%, 50%)',
  teal: 'hsl(175, 60%, 40%)',
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'بانتظار الفرز' },
  { value: 'virtualClinic', label: 'العيادة الافتراضية' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'excluded', label: 'مستبعد' },
];

const BURDEN_OPTIONS = [
  { value: 'عالي', label: 'عالي' },
  { value: 'متوسط', label: 'متوسط' },
  { value: 'منخفض', label: 'منخفض' },
];

const AGE_OPTIONS = [
  { value: '<18', label: 'أقل من 18' },
  { value: '18-34', label: '18-34' },
  { value: '35-50', label: '35-50' },
  { value: '51-65', label: '51-65' },
  { value: '66-75', label: '66-75' },
  { value: '>75', label: 'أكثر من 75' },
];

const Statistics = () => {
  const { user, profile, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [patientMedCounts, setPatientMedCounts] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ centers: [] as string[], statuses: [] as string[], burdens: [] as string[], ageGroups: [] as string[] });

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, isSuperAdmin, profile]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("patients").select("*");
      if (!isSuperAdmin && profile?.center_id) query = query.eq("center_id", profile.center_id);
      const { data: patientsData } = await query;
      
      if (patientsData) {
        setPatients(patientsData);
        const patientIds = patientsData.map(p => p.id);
        const { data: medsData } = await supabase.from("medications").select("*").in("patient_id", patientIds);
        if (medsData) {
          setMedications(medsData);
          const counts = new Map<string, number>();
          medsData.forEach(m => counts.set(m.patient_id, (counts.get(m.patient_id) || 0) + 1));
          setPatientMedCounts(counts);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAgeGroup = (age: number | null) => {
    if (!age) return null;
    if (age < 18) return '<18';
    if (age <= 34) return '18-34';
    if (age <= 50) return '35-50';
    if (age <= 65) return '51-65';
    if (age <= 75) return '66-75';
    return '>75';
  };

  const filteredPatients = patients.filter(p => {
    if (filters.centers.length > 0 && !filters.centers.includes(p.center_id)) return false;
    if (filters.statuses.length > 0 && !filters.statuses.includes(p.status)) return false;
    if (filters.burdens.length > 0 && !filters.burdens.includes(p.burden)) return false;
    if (filters.ageGroups.length > 0 && !filters.ageGroups.includes(getAgeGroup(p.age) || '')) return false;
    return true;
  });

  const total = filteredPatients.length;
  const pending = filteredPatients.filter(p => p.status === "pending").length;
  const virtualClinic = filteredPatients.filter(p => p.status === "virtualClinic").length;
  const completed = filteredPatients.filter(p => p.status === "completed").length;
  const excluded = filteredPatients.filter(p => p.status === "excluded").length;
  const polypharmacyCount = filteredPatients.filter(p => (patientMedCounts.get(p.id) || 0) >= 5).length;
  const polypharmacyPercent = total > 0 ? Math.round((polypharmacyCount / total) * 100) : 0;

  const urgentCount = filteredPatients.filter(p => p.status === 'pending' && p.days_until_visit && p.days_until_visit <= 3).length;
  const soonCount = filteredPatients.filter(p => p.status === 'pending' && p.days_until_visit && p.days_until_visit > 3 && p.days_until_visit <= 7).length;
  const scheduledCount = filteredPatients.filter(p => p.status === 'pending' && p.days_until_visit && p.days_until_visit > 7).length;

  const burdenChartData = [
    { name: 'عالي', value: filteredPatients.filter(p => p.burden === "عالي").length, color: CHART_COLORS.danger },
    { name: 'متوسط', value: filteredPatients.filter(p => p.burden === "متوسط").length, color: CHART_COLORS.warning },
    { name: 'منخفض', value: filteredPatients.filter(p => p.burden === "منخفض").length, color: CHART_COLORS.success },
  ];

  const ageChartData = [
    { name: '<18', value: filteredPatients.filter(p => p.age && p.age < 18).length },
    { name: '18-34', value: filteredPatients.filter(p => p.age && p.age >= 18 && p.age < 35).length },
    { name: '35-50', value: filteredPatients.filter(p => p.age && p.age >= 35 && p.age <= 50).length },
    { name: '51-65', value: filteredPatients.filter(p => p.age && p.age > 50 && p.age <= 65).length },
    { name: '66-75', value: filteredPatients.filter(p => p.age && p.age > 65 && p.age <= 75).length },
    { name: '>75', value: filteredPatients.filter(p => p.age && p.age > 75).length },
  ];

  const diseaseByGenderData = [
    { name: 'السكري', male: filteredPatients.filter(p => p.has_dm && (p.gender === "Male" || p.gender === "ذكر")).length, female: filteredPatients.filter(p => p.has_dm && (p.gender === "Female" || p.gender === "أنثى")).length },
    { name: 'الضغط', male: filteredPatients.filter(p => p.has_htn && (p.gender === "Male" || p.gender === "ذكر")).length, female: filteredPatients.filter(p => p.has_htn && (p.gender === "Female" || p.gender === "أنثى")).length },
    { name: 'الدهون', male: filteredPatients.filter(p => p.has_dyslipidemia && (p.gender === "Male" || p.gender === "ذكر")).length, female: filteredPatients.filter(p => p.has_dyslipidemia && (p.gender === "Female" || p.gender === "أنثى")).length },
  ];

  const medCounts = new Map<string, number>();
  const filteredIds = new Set(filteredPatients.map(p => p.id));
  medications.filter(m => filteredIds.has(m.patient_id)).forEach(m => medCounts.set(m.name, (medCounts.get(m.name) || 0) + 1));
  const topMeds = Array.from(medCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);
  const filterOptions = { centers: [...new Set(patients.map(p => p.center_id).filter(Boolean))] };

  if (loading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background"><FlowerLogo animate size={100} /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowRight size={20} /></Button>
            <FlowerLogo animate={false} size={40} />
            <div><h1 className="text-lg font-bold text-primary">الإحصائيات</h1><p className="text-xs text-muted-foreground">لوحة تحكم متقدمة</p></div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Users, value: total, label: "إجمالي المرضى", color: "text-primary" },
            { icon: Clock, value: pending, label: "بانتظار الفرز", color: "text-yellow-500" },
            { icon: Stethoscope, value: virtualClinic, label: "العيادة الافتراضية", color: "text-blue-500" },
            { icon: CheckCircle, value: completed, label: "مكتمل", color: "text-green-500" },
            { icon: XCircle, value: excluded, label: "مستبعد", color: "text-red-500" },
            { icon: Pill, value: polypharmacyCount, label: `تعدد الأدوية (${polypharmacyPercent}%)`, color: "text-purple-500" },
          ].map((kpi, i) => (
            <Card key={i} className="bg-card/60 backdrop-blur-xl border-border/30 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              <CardContent className="p-5 text-center">
                <kpi.icon className={cn("mx-auto mb-2 w-7 h-7", kpi.color)} />
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Traffic Light */}
        <Card className="bg-card/60 backdrop-blur-xl border-border/30">
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />حالة الزيارات</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                { count: urgentCount, label: "عاجل (≤3 أيام)", bg: "bg-red-500", glow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]" },
                { count: soonCount, label: "قريب (4-7 أيام)", bg: "bg-yellow-500", glow: "shadow-[0_0_20px_rgba(234,179,8,0.4)]" },
                { count: scheduledCount, label: "مجدول (>7 أيام)", bg: "bg-green-500", glow: "shadow-[0_0_20px_rgba(34,197,94,0.4)]" },
              ].map((item, i) => (
                <div key={i} className={cn("flex flex-col items-center p-5 rounded-2xl backdrop-blur-xl", item.glow)}>
                  <div className={cn("w-12 h-12 rounded-full mb-3", item.bg)} />
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card/60 backdrop-blur-xl border-border/30">
            <CardHeader><CardTitle>الفئات العمرية</CardTitle></CardHeader>
            <CardContent><div className="h-64"><ResponsiveContainer><BarChart data={ageChartData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" width={50} /><Tooltip /><Bar dataKey="value" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-xl border-border/30">
            <CardHeader><CardTitle>مستوى العبء</CardTitle></CardHeader>
            <CardContent><div className="h-64"><ResponsiveContainer><PieChart><Pie data={burdenChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>{burdenChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-xl border-border/30">
            <CardHeader><CardTitle>الأمراض حسب الجنس</CardTitle></CardHeader>
            <CardContent><div className="h-64"><ResponsiveContainer><BarChart data={diseaseByGenderData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="male" name="ذكور" fill={CHART_COLORS.male} /><Bar dataKey="female" name="إناث" fill={CHART_COLORS.female} /></BarChart></ResponsiveContainer></div></CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-xl border-border/30">
            <CardHeader><CardTitle>أكثر 10 أدوية</CardTitle></CardHeader>
            <CardContent><div className="h-64"><ResponsiveContainer><BarChart data={topMeds} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill={CHART_COLORS.teal} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Statistics;
