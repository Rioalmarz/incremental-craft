import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Users, Clock, Stethoscope, CheckCircle, XCircle, Pill, Filter, Search, X, RotateCcw, RefreshCw, Printer, ChevronDown } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

const STORAGE_KEY = 'tbc_filters_v1';
const CHART_COLORS = {
  primary: '#00BCD4',
  male: '#2196F3',
  female: '#E91E63',
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#F44336',
  purple: '#9C27B0',
  teal: '#009688',
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

const GENDER_OPTIONS = [
  { value: 'male', label: 'ذكور' },
  { value: 'female', label: 'إناث' },
];

const DISEASE_OPTIONS = [
  { value: 'dm', label: 'سكري' },
  { value: 'htn', label: 'ضغط' },
  { value: 'dyslipidemia', label: 'دهون' },
  { value: 'none', label: 'لا يوجد مرض' },
];

interface Filters {
  centers: string[];
  statuses: string[];
  burdens: string[];
  ageGroups: string[];
  genders: string[];
  diseases: string[];
}

const MultiSelectFilter = ({ 
  label, 
  options, 
  selected, 
  onChange 
}: { 
  label: string; 
  options: { value: string; label: string }[]; 
  selected: string[]; 
  onChange: (values: string[]) => void;
}) => {
  const [search, setSearch] = useState("");
  const filteredOptions = options.filter(o => o.label.includes(search));
  
  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectAll = () => onChange(options.map(o => o.value));
  const clearAll = () => onChange([]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2 min-w-[120px]", selected.length > 0 && "border-primary bg-primary/10")}>
          {label}
          {selected.length > 0 && <Badge variant="secondary" className="text-xs px-1.5">{selected.length}</Badge>}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-8 h-8 text-sm" />
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="flex-1 text-xs h-7" onClick={selectAll}>تحديد الكل</Button>
            <Button variant="ghost" size="sm" className="flex-1 text-xs h-7" onClick={clearAll}>مسح الكل</Button>
          </div>
          <ScrollArea className="h-40">
            <div className="space-y-1">
              {filteredOptions.map(option => (
                <div key={option.value} className="flex items-center gap-2 p-1.5 hover:bg-accent rounded cursor-pointer" onClick={() => toggleValue(option.value)}>
                  <Checkbox checked={selected.includes(option.value)} />
                  <span className="text-sm">{option.label}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Statistics = () => {
  const { user, profile, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [patientMedCounts, setPatientMedCounts] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { centers: [], statuses: [], burdens: [], ageGroups: [], genders: [], diseases: [] };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, isSuperAdmin, profile]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all patients without limit
      let allPatients: any[] = [];
      let from = 0;
      const batchSize = 1000;
      
      while (true) {
        let query = supabase.from("patients").select("*").range(from, from + batchSize - 1);
        if (!isSuperAdmin && profile?.center_id) query = query.eq("center_id", profile.center_id);
        const { data } = await query;
        if (!data || data.length === 0) break;
        allPatients = [...allPatients, ...data];
        if (data.length < batchSize) break;
        from += batchSize;
      }
      
      setPatients(allPatients);
      
      // Fetch all medications
      if (allPatients.length > 0) {
        const patientIds = allPatients.map(p => p.id);
        let allMeds: any[] = [];
        
        // Batch fetch medications
        for (let i = 0; i < patientIds.length; i += 500) {
          const batch = patientIds.slice(i, i + 500);
          const { data: medsData } = await supabase.from("medications").select("*").in("patient_id", batch);
          if (medsData) allMeds = [...allMeds, ...medsData];
        }
        
        setMedications(allMeds);
        const counts = new Map<string, number>();
        allMeds.forEach(m => counts.set(m.patient_id, (counts.get(m.patient_id) || 0) + 1));
        setPatientMedCounts(counts);
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

  const isMale = (gender: string | null) => gender === "Male" || gender === "ذكر" || gender === "male";
  const isFemale = (gender: string | null) => gender === "Female" || gender === "أنثى" || gender === "female";

  const filteredPatients = patients.filter(p => {
    if (filters.centers.length > 0 && !filters.centers.includes(p.center_id)) return false;
    if (filters.statuses.length > 0 && !filters.statuses.includes(p.status)) return false;
    if (filters.burdens.length > 0 && !filters.burdens.includes(p.burden)) return false;
    if (filters.ageGroups.length > 0 && !filters.ageGroups.includes(getAgeGroup(p.age) || '')) return false;
    if (filters.genders.length > 0) {
      const patientIsMale = isMale(p.gender);
      const patientIsFemale = isFemale(p.gender);
      if (!((filters.genders.includes('male') && patientIsMale) || (filters.genders.includes('female') && patientIsFemale))) return false;
    }
    if (filters.diseases.length > 0) {
      const hasDM = p.has_dm;
      const hasHTN = p.has_htn;
      const hasDyslip = p.has_dyslipidemia;
      const hasNone = !hasDM && !hasHTN && !hasDyslip;
      const matches = (filters.diseases.includes('dm') && hasDM) ||
                      (filters.diseases.includes('htn') && hasHTN) ||
                      (filters.diseases.includes('dyslipidemia') && hasDyslip) ||
                      (filters.diseases.includes('none') && hasNone);
      if (!matches) return false;
    }
    return true;
  });

  const total = filteredPatients.length;
  const pending = filteredPatients.filter(p => p.status === "pending").length;
  const virtualClinic = filteredPatients.filter(p => p.status === "virtualClinic").length;
  const completed = filteredPatients.filter(p => p.status === "completed").length;
  const excluded = filteredPatients.filter(p => p.status === "excluded").length;
  const polypharmacyCount = filteredPatients.filter(p => (patientMedCounts.get(p.id) || 0) >= 5).length;
  const polypharmacyPercent = total > 0 ? Math.round((polypharmacyCount / total) * 100) : 0;

  const urgentCount = filteredPatients.filter(p => p.status === 'pending' && p.days_until_visit != null && p.days_until_visit <= 3).length;
  const soonCount = filteredPatients.filter(p => p.status === 'pending' && p.days_until_visit != null && p.days_until_visit > 3 && p.days_until_visit <= 7).length;
  const scheduledCount = filteredPatients.filter(p => p.status === 'pending' && p.days_until_visit != null && p.days_until_visit > 7).length;

  const burdenChartData = [
    { name: 'عالي', value: filteredPatients.filter(p => p.burden === "عالي").length, color: CHART_COLORS.danger },
    { name: 'متوسط', value: filteredPatients.filter(p => p.burden === "متوسط").length, color: CHART_COLORS.warning },
    { name: 'منخفض', value: filteredPatients.filter(p => p.burden === "منخفض").length, color: CHART_COLORS.success },
  ].filter(d => d.value > 0);

  const ageChartData = [
    { name: '<18', value: filteredPatients.filter(p => p.age && p.age < 18).length },
    { name: '18-34', value: filteredPatients.filter(p => p.age && p.age >= 18 && p.age < 35).length },
    { name: '35-50', value: filteredPatients.filter(p => p.age && p.age >= 35 && p.age <= 50).length },
    { name: '51-65', value: filteredPatients.filter(p => p.age && p.age > 50 && p.age <= 65).length },
    { name: '66-75', value: filteredPatients.filter(p => p.age && p.age > 65 && p.age <= 75).length },
    { name: '>75', value: filteredPatients.filter(p => p.age && p.age > 75).length },
  ];

  const diseaseByGenderData = [
    { name: 'السكري', male: filteredPatients.filter(p => p.has_dm && isMale(p.gender)).length, female: filteredPatients.filter(p => p.has_dm && isFemale(p.gender)).length },
    { name: 'الضغط', male: filteredPatients.filter(p => p.has_htn && isMale(p.gender)).length, female: filteredPatients.filter(p => p.has_htn && isFemale(p.gender)).length },
    { name: 'الدهون', male: filteredPatients.filter(p => p.has_dyslipidemia && isMale(p.gender)).length, female: filteredPatients.filter(p => p.has_dyslipidemia && isFemale(p.gender)).length },
  ];

  // Calculate top 10 medications
  const medCounts = new Map<string, number>();
  const filteredIds = new Set(filteredPatients.map(p => p.id));
  medications.filter(m => filteredIds.has(m.patient_id) && m.name).forEach(m => {
    medCounts.set(m.name, (medCounts.get(m.name) || 0) + 1);
  });
  const topMeds = Array.from(medCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Polypharmacy data
  const lessThan5 = total - polypharmacyCount;
  const polypharmacyData = [
    { name: 'أقل من 5 أدوية', value: lessThan5, color: CHART_COLORS.success },
    { name: '5 أدوية أو أكثر', value: polypharmacyCount, color: CHART_COLORS.purple },
  ].filter(d => d.value > 0);

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);
  const centerOptions = [...new Set(patients.map(p => p.center_id).filter(Boolean))].map(c => ({ value: c, label: c }));
  
  const resetFilters = () => setFilters({ centers: [], statuses: [], burdens: [], ageGroups: [], genders: [], diseases: [] });
  const updateFilter = (key: keyof Filters, values: string[]) => setFilters(prev => ({ ...prev, [key]: values }));

  if (loading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background"><FlowerLogo animate size={100} /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowRight size={20} /></Button>
            <FlowerLogo animate={false} size={40} />
            <div><h1 className="text-lg font-bold text-primary">الإحصائيات</h1><p className="text-xs text-muted-foreground">لوحة تحكم متقدمة</p></div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4 ml-1" />تحديث</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 ml-1" />طباعة</Button>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="sticky top-[60px] z-40 bg-background/90 backdrop-blur-xl border-b border-border/50 py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
              <Filter className="w-4 h-4" />
              <span>الفلاتر:</span>
            </div>
            
            {isSuperAdmin && centerOptions.length > 0 && (
              <MultiSelectFilter label="المركز" options={centerOptions} selected={filters.centers} onChange={v => updateFilter('centers', v)} />
            )}
            <MultiSelectFilter label="الحالة" options={STATUS_OPTIONS} selected={filters.statuses} onChange={v => updateFilter('statuses', v)} />
            <MultiSelectFilter label="العبء" options={BURDEN_OPTIONS} selected={filters.burdens} onChange={v => updateFilter('burdens', v)} />
            <MultiSelectFilter label="العمر" options={AGE_OPTIONS} selected={filters.ageGroups} onChange={v => updateFilter('ageGroups', v)} />
            <MultiSelectFilter label="الجنس" options={GENDER_OPTIONS} selected={filters.genders} onChange={v => updateFilter('genders', v)} />
            <MultiSelectFilter label="المرض" options={DISEASE_OPTIONS} selected={filters.diseases} onChange={v => updateFilter('diseases', v)} />
            
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-destructive hover:text-destructive">
                <RotateCcw className="w-4 h-4 ml-1" />إعادة تعيين
              </Button>
            )}
          </div>
          
          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex gap-1 flex-wrap mt-2">
              {filters.centers.map(c => <Badge key={c} variant="secondary" className="gap-1">{c}<X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('centers', filters.centers.filter(x => x !== c))} /></Badge>)}
              {filters.statuses.map(s => <Badge key={s} variant="secondary" className="gap-1">{STATUS_OPTIONS.find(o => o.value === s)?.label}<X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('statuses', filters.statuses.filter(x => x !== s))} /></Badge>)}
              {filters.burdens.map(b => <Badge key={b} variant="secondary" className="gap-1">{b}<X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('burdens', filters.burdens.filter(x => x !== b))} /></Badge>)}
              {filters.ageGroups.map(a => <Badge key={a} variant="secondary" className="gap-1">{AGE_OPTIONS.find(o => o.value === a)?.label}<X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('ageGroups', filters.ageGroups.filter(x => x !== a))} /></Badge>)}
              {filters.genders.map(g => <Badge key={g} variant="secondary" className="gap-1">{GENDER_OPTIONS.find(o => o.value === g)?.label}<X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('genders', filters.genders.filter(x => x !== g))} /></Badge>)}
              {filters.diseases.map(d => <Badge key={d} variant="secondary" className="gap-1">{DISEASE_OPTIONS.find(o => o.value === d)?.label}<X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('diseases', filters.diseases.filter(x => x !== d))} /></Badge>)}
            </div>
          )}
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Users, value: total, label: "إجمالي المرضى", color: "text-[#00BCD4]", bg: "bg-[#00BCD4]/10" },
            { icon: Clock, value: pending, label: "بانتظار الفرز", color: "text-[#FFC107]", bg: "bg-[#FFC107]/10" },
            { icon: Stethoscope, value: virtualClinic, label: "العيادة الافتراضية", color: "text-[#2196F3]", bg: "bg-[#2196F3]/10" },
            { icon: CheckCircle, value: completed, label: "مكتمل", color: "text-[#4CAF50]", bg: "bg-[#4CAF50]/10" },
            { icon: XCircle, value: excluded, label: "مستبعد", color: "text-[#F44336]", bg: "bg-[#F44336]/10" },
            { icon: Pill, value: polypharmacyCount, label: `تعدد الأدوية (${polypharmacyPercent}%)`, color: "text-[#9C27B0]", bg: "bg-[#9C27B0]/10" },
          ].map((kpi, i) => (
            <Card key={i} className={cn("border-border/30 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl", kpi.bg)}>
              <CardContent className="p-5 text-center">
                <kpi.icon className={cn("mx-auto mb-2 w-8 h-8", kpi.color)} />
                <p className="text-3xl font-bold">{kpi.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Traffic Light */}
        <Card className="border-border/30 shadow-lg">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><Clock className="w-5 h-5 text-primary" />حالة الزيارات</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                { count: urgentCount, label: "عاجل (≤3 أيام)", bg: "bg-[#F44336]" },
                { count: soonCount, label: "قريب (4-7 أيام)", bg: "bg-[#FFC107]" },
                { count: scheduledCount, label: "مجدول (>7 أيام)", bg: "bg-[#4CAF50]" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center p-5 rounded-xl bg-card border border-border/30">
                  <div className={cn("w-10 h-10 rounded-full mb-3 shadow-lg", item.bg)} />
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-xs text-muted-foreground text-center">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Age Distribution */}
          <Card className="border-border/30 shadow-lg">
            <CardHeader className="pb-2"><CardTitle className="text-base">الفئات العمرية</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={50} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} name="العدد" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Burden Levels - Fixed label positioning */}
          <Card className="border-border/30 shadow-lg">
            <CardHeader className="pb-2"><CardTitle className="text-base">مستوى العبء</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={burdenChartData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={50} 
                      outerRadius={80} 
                      dataKey="value"
                      labelLine={false}
                    >
                      {burdenChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`, 'العدد']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} 
                    />
                    <Legend 
                      formatter={(value, entry: any) => {
                        const item = burdenChartData.find(d => d.name === value);
                        const percent = total > 0 && item ? Math.round((item.value / total) * 100) : 0;
                        return `${value} (${percent}%)`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Diseases by Gender */}
          <Card className="border-border/30 shadow-lg">
            <CardHeader className="pb-2"><CardTitle className="text-base">الأمراض حسب الجنس</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={diseaseByGenderData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Bar dataKey="male" name="ذكور" fill={CHART_COLORS.male} />
                    <Bar dataKey="female" name="إناث" fill={CHART_COLORS.female} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Polypharmacy */}
          <Card className="border-border/30 shadow-lg">
            <CardHeader className="pb-2"><CardTitle className="text-base">تعدد الأدوية</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={polypharmacyData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={50} 
                      outerRadius={80} 
                      dataKey="value"
                      labelLine={false}
                    >
                      {polypharmacyData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`, 'العدد']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} 
                    />
                    <Legend 
                      formatter={(value, entry: any) => {
                        const item = polypharmacyData.find(d => d.name === value);
                        const percent = total > 0 && item ? Math.round((item.value / total) * 100) : 0;
                        return `${value} (${percent}%)`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {polypharmacyPercent >= 30 && (
                <div className="mt-2 p-2 bg-[#9C27B0]/10 rounded-lg text-center">
                  <span className="text-sm text-[#9C27B0] font-medium">⚠️ {polypharmacyPercent}% من المرضى يتناولون 5 أدوية أو أكثر</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top 10 Medications */}
          <Card className="border-border/30 shadow-lg lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">أكثر 10 أدوية استخداماً</CardTitle></CardHeader>
            <CardContent>
              {topMeds.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topMeds} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={145} 
                        tick={{ fontSize: 10, textAnchor: 'end' }} 
                        interval={0}
                      />
                      <Tooltip 
                        formatter={(value: number) => [value, 'العدد']}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} 
                      />
                      <Bar dataKey="count" fill={CHART_COLORS.teal} radius={[0, 4, 4, 0]} name="العدد" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <p>لا توجد بيانات أدوية متاحة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Statistics;
