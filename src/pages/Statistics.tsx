import { useEffect, useState, useRef } from "react";
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
import { ArrowRight, Users, Clock, Stethoscope, CheckCircle, XCircle, Pill, Filter, Search, X, RotateCcw, RefreshCw, Printer, ChevronDown, TrendingUp, AlertTriangle, Calendar, Download, Image } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";

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

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  
  return <span>{count.toLocaleString()}</span>;
};

// Premium KPI Card Component
const KPICard = ({ 
  icon: Icon, 
  value, 
  label, 
  color, 
  gradient, 
  pulse = false,
  delay = 0 
}: { 
  icon: any; 
  value: number; 
  label: string; 
  color: string; 
  gradient: string;
  pulse?: boolean;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={cn(
        "group relative cursor-default transition-all duration-700",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
    >
      {/* Glow Effect */}
      <div className={cn("absolute -inset-1 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500", gradient)} />
      
      {/* Card */}
      <div className="relative bg-background/80 backdrop-blur-xl border border-border/30 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-1 group-hover:border-primary/30 overflow-hidden">
        {/* Background Gradient */}
        <div className={cn("absolute inset-0 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-500", gradient)} />
        
        {/* Animated Pulse for Critical Values */}
        {pulse && (
          <div className="absolute inset-0 rounded-2xl animate-pulse bg-destructive/10" style={{ animationDuration: '2s' }} />
        )}
        
        {/* Content */}
        <div className="relative z-10 text-center">
          <div className={cn("mx-auto mb-3 p-3 rounded-xl w-fit transition-transform duration-500 group-hover:scale-110", gradient)}>
            <Icon className="w-7 h-7 text-background" />
          </div>
          <p className={cn("text-4xl font-bold mb-1", color)}>
            <AnimatedCounter value={value} />
          </p>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
        </div>
        
        {/* Corner Decoration */}
        <div className={cn("absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-20", gradient)} />
      </div>
    </div>
  );
};

// Traffic Light Card
const TrafficLightCard = ({ 
  count, 
  label, 
  color, 
  bgColor, 
  icon: Icon 
}: { 
  count: number; 
  label: string; 
  color: string; 
  bgColor: string;
  icon: any;
}) => (
  <div className="group relative">
    <div className={cn("absolute -inset-1 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500", bgColor)} />
    <div className="relative bg-background/80 backdrop-blur-xl border border-border/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 text-center">
      <div className={cn("mx-auto w-14 h-14 rounded-full mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300", bgColor)}>
        <Icon className="w-7 h-7 text-background" />
      </div>
      <p className={cn("text-3xl font-bold mb-1", color)}>
        <AnimatedCounter value={count} />
      </p>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
    </div>
  </div>
);

// Premium Chart Card
const ChartCard = ({ 
  title, 
  children, 
  className = "",
  id 
}: { 
  title: string; 
  children: React.ReactNode; 
  className?: string;
  id?: string;
}) => {
  const exportChart = async () => {
    if (!id) return;
    const element = document.getElementById(id);
    if (element) {
      const canvas = await html2canvas(element);
      const link = document.createElement('a');
      link.download = `${title}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className={cn("group relative", className)}>
      <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
      <Card id={id} className="relative bg-background/80 backdrop-blur-xl border-border/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative z-10 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
            {title}
          </CardTitle>
          {id && (
            <Button variant="ghost" size="sm" onClick={exportChart} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Image className="w-4 h-4 ml-1" />
              <span className="text-xs">تصدير</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="relative z-10">
          {children}
        </CardContent>
      </Card>
    </div>
  );
};

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
        <Button 
          variant="outline" 
          size="sm" 
          className={cn(
            "gap-2 min-w-[120px] rounded-xl border-border/50 hover:border-primary/50 transition-all duration-300", 
            selected.length > 0 && "border-primary bg-primary/10 text-primary"
          )}
        >
          {label}
          {selected.length > 0 && (
            <Badge className="bg-primary text-primary-foreground text-xs px-1.5 h-5">
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 bg-background/95 backdrop-blur-xl border-border/50 rounded-xl shadow-2xl" align="start">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="بحث..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pr-8 h-8 text-sm rounded-lg bg-secondary/30" 
            />
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="flex-1 text-xs h-7 rounded-lg" onClick={selectAll}>تحديد الكل</Button>
            <Button variant="ghost" size="sm" className="flex-1 text-xs h-7 rounded-lg" onClick={clearAll}>مسح الكل</Button>
          </div>
          <ScrollArea className="h-40">
            <div className="space-y-1">
              {filteredOptions.map(option => (
                <div 
                  key={option.value} 
                  className="flex items-center gap-2 p-2 hover:bg-primary/10 rounded-lg cursor-pointer transition-colors" 
                  onClick={() => toggleValue(option.value)}
                >
                  <Checkbox checked={selected.includes(option.value)} className="border-primary data-[state=checked]:bg-primary" />
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
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  const [patients, setPatients] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [patientMedCounts, setPatientMedCounts] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [topMedsLimit, setTopMedsLimit] = useState<10 | 15 | 'all'>(10);
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
      
      if (allPatients.length > 0) {
        const patientIds = allPatients.map(p => p.id);
        let allMeds: any[] = [];
        
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
    { 
      name: 'السكري', 
      male: filteredPatients.filter(p => p.has_dm && isMale(p.gender)).length, 
      female: filteredPatients.filter(p => p.has_dm && isFemale(p.gender)).length,
      winner: filteredPatients.filter(p => p.has_dm && isMale(p.gender)).length > filteredPatients.filter(p => p.has_dm && isFemale(p.gender)).length ? 'male' : 'female'
    },
    { 
      name: 'الضغط', 
      male: filteredPatients.filter(p => p.has_htn && isMale(p.gender)).length, 
      female: filteredPatients.filter(p => p.has_htn && isFemale(p.gender)).length,
      winner: filteredPatients.filter(p => p.has_htn && isMale(p.gender)).length > filteredPatients.filter(p => p.has_htn && isFemale(p.gender)).length ? 'male' : 'female'
    },
    { 
      name: 'الدهون', 
      male: filteredPatients.filter(p => p.has_dyslipidemia && isMale(p.gender)).length, 
      female: filteredPatients.filter(p => p.has_dyslipidemia && isFemale(p.gender)).length,
      winner: filteredPatients.filter(p => p.has_dyslipidemia && isMale(p.gender)).length > filteredPatients.filter(p => p.has_dyslipidemia && isFemale(p.gender)).length ? 'male' : 'female'
    },
  ];

  // Calculate top medications with limit
  const medCounts = new Map<string, number>();
  const filteredIds = new Set(filteredPatients.map(p => p.id));
  medications.filter(m => filteredIds.has(m.patient_id) && m.name).forEach(m => {
    medCounts.set(m.name, (medCounts.get(m.name) || 0) + 1);
  });
  const allMeds = Array.from(medCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, percent: total > 0 ? Math.round((count / total) * 100) : 0 }));
  const topMeds = topMedsLimit === 'all' ? allMeds : allMeds.slice(0, topMedsLimit);

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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background gap-4">
        <FlowerLogo animate size={100} />
        <p className="text-muted-foreground animate-pulse">جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-accent/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl hover:bg-primary/10">
              <ArrowRight size={20} />
            </Button>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <FlowerLogo animate={false} size={44} className="relative z-10" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                الإحصائيات
              </h1>
              <p className="text-xs text-muted-foreground">لوحة تحكم متقدمة • Premium Dashboard</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} className="rounded-xl border-border/50 hover:border-primary/50 gap-2">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">تحديث</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-xl border-border/50 hover:border-primary/50 gap-2">
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">طباعة</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="sticky top-[68px] z-40 bg-background/90 backdrop-blur-xl border-b border-border/30 py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/30 rounded-xl">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">الفلاتر</span>
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
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl gap-1">
                <RotateCcw className="w-4 h-4" />
                إعادة تعيين
              </Button>
            )}

            {/* Results Count */}
            <div className="mr-auto flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-xl">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">عدد النتائج: {total.toLocaleString()}</span>
            </div>
          </div>
          
          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex gap-2 flex-wrap mt-3">
              {filters.centers.map(c => (
                <Badge key={c} variant="secondary" className="gap-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer">
                  {c}
                  <X className="w-3 h-3" onClick={() => updateFilter('centers', filters.centers.filter(x => x !== c))} />
                </Badge>
              ))}
              {filters.statuses.map(s => (
                <Badge key={s} variant="secondary" className="gap-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer">
                  {STATUS_OPTIONS.find(o => o.value === s)?.label}
                  <X className="w-3 h-3" onClick={() => updateFilter('statuses', filters.statuses.filter(x => x !== s))} />
                </Badge>
              ))}
              {filters.burdens.map(b => (
                <Badge key={b} variant="secondary" className="gap-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer">
                  {b}
                  <X className="w-3 h-3" onClick={() => updateFilter('burdens', filters.burdens.filter(x => x !== b))} />
                </Badge>
              ))}
              {filters.ageGroups.map(a => (
                <Badge key={a} variant="secondary" className="gap-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer">
                  {AGE_OPTIONS.find(o => o.value === a)?.label}
                  <X className="w-3 h-3" onClick={() => updateFilter('ageGroups', filters.ageGroups.filter(x => x !== a))} />
                </Badge>
              ))}
              {filters.genders.map(g => (
                <Badge key={g} variant="secondary" className="gap-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer">
                  {GENDER_OPTIONS.find(o => o.value === g)?.label}
                  <X className="w-3 h-3" onClick={() => updateFilter('genders', filters.genders.filter(x => x !== g))} />
                </Badge>
              ))}
              {filters.diseases.map(d => (
                <Badge key={d} variant="secondary" className="gap-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer">
                  {DISEASE_OPTIONS.find(o => o.value === d)?.label}
                  <X className="w-3 h-3" onClick={() => updateFilter('diseases', filters.diseases.filter(x => x !== d))} />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <main ref={dashboardRef} className="container mx-auto px-4 py-8 space-y-8 relative z-10">
        {/* Empty State */}
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
              <Users className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">لا توجد نتائج</h3>
            <p className="text-muted-foreground mb-4">لم يتم العثور على بيانات تطابق الفلاتر المحددة</p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={resetFilters} className="rounded-xl">
                <RotateCcw className="w-4 h-4 ml-2" />
                إعادة تعيين الفلاتر
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* KPI Cards Row */}
            <section>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KPICard 
                  icon={Users} 
                  value={total} 
                  label="إجمالي المرضى" 
                  color="text-[#00BCD4]" 
                  gradient="bg-gradient-to-br from-[#00BCD4] to-[#009688]"
                  delay={0}
                />
                <KPICard 
                  icon={Clock} 
                  value={pending} 
                  label="بانتظار الفرز" 
                  color="text-[#FFC107]" 
                  gradient="bg-gradient-to-br from-[#FFC107] to-[#FF9800]"
                  delay={100}
                />
                <KPICard 
                  icon={Stethoscope} 
                  value={virtualClinic} 
                  label="العيادة الافتراضية" 
                  color="text-[#2196F3]" 
                  gradient="bg-gradient-to-br from-[#2196F3] to-[#1976D2]"
                  delay={200}
                />
                <KPICard 
                  icon={CheckCircle} 
                  value={completed} 
                  label="مكتمل" 
                  color="text-[#4CAF50]" 
                  gradient="bg-gradient-to-br from-[#4CAF50] to-[#388E3C]"
                  delay={300}
                />
                <KPICard 
                  icon={XCircle} 
                  value={excluded} 
                  label="مستبعد" 
                  color="text-[#F44336]" 
                  gradient="bg-gradient-to-br from-[#F44336] to-[#D32F2F]"
                  delay={400}
                />
                <KPICard 
                  icon={Pill} 
                  value={polypharmacyCount} 
                  label={`تعدد الأدوية (${polypharmacyPercent}%)`} 
                  color="text-[#9C27B0]" 
                  gradient="bg-gradient-to-br from-[#9C27B0] to-[#7B1FA2]"
                  pulse={polypharmacyPercent >= 30}
                  delay={500}
                />
              </div>
            </section>

            {/* Traffic Light Section */}
            <section>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary" />
                <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">حالة الزيارات</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TrafficLightCard 
                  count={urgentCount} 
                  label="عاجل (≤3 أيام)" 
                  color="text-[#F44336]" 
                  bgColor="bg-[#F44336]"
                  icon={AlertTriangle}
                />
                <TrafficLightCard 
                  count={soonCount} 
                  label="قريب (4-7 أيام)" 
                  color="text-[#FFC107]" 
                  bgColor="bg-[#FFC107]"
                  icon={Clock}
                />
                <TrafficLightCard 
                  count={scheduledCount} 
                  label="مجدول (>7 أيام)" 
                  color="text-[#4CAF50]" 
                  bgColor="bg-[#4CAF50]"
                  icon={Calendar}
                />
              </div>
            </section>

            {/* Charts Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Age Distribution */}
              <ChartCard title="الفئات العمرية" id="chart-age">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageChartData} layout="vertical" margin={{ top: 5, right: 50, left: 80, bottom: 5 }}>
                      <defs>
                        <linearGradient id="ageGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#00BCD4" />
                          <stop offset="100%" stopColor="#009688" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={true} vertical={false} />
                      <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={70} 
                        tick={{ fontSize: 12, fill: 'hsl(var(--foreground))', textAnchor: 'end' }} 
                        tickLine={false}
                        axisLine={false}
                        orientation="left"
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`, 'العدد']}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} 
                      />
                      <Bar 
                        dataKey="value" 
                        fill="url(#ageGradient)" 
                        radius={[0, 8, 8, 0]} 
                        name="العدد"
                        label={{ position: 'right', fill: 'hsl(var(--foreground))', fontSize: 11 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Burden Levels */}
              <ChartCard title="مستوى العبء" id="chart-burden">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <filter id="shadow" height="130%">
                          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.3"/>
                        </filter>
                      </defs>
                      <Pie 
                        data={burdenChartData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={90} 
                        dataKey="value"
                        labelLine={false}
                        style={{ filter: 'url(#shadow)' }}
                      >
                        {burdenChartData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`, 'العدد']}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} 
                      />
                      <Legend 
                        formatter={(value) => {
                          const item = burdenChartData.find(d => d.name === value);
                          const percent = total > 0 && item ? Math.round((item.value / total) * 100) : 0;
                          return <span className="text-sm">{value} ({percent}%)</span>;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Diseases by Gender */}
              <ChartCard title="الأمراض حسب الجنس" id="chart-disease-gender">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={diseaseByGenderData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="maleGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2196F3" />
                          <stop offset="100%" stopColor="#1976D2" />
                        </linearGradient>
                        <linearGradient id="femaleGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#E91E63" />
                          <stop offset="100%" stopColor="#C2185B" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                      <Legend />
                      <Bar dataKey="male" name="ذكور" fill="url(#maleGradient)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="female" name="إناث" fill="url(#femaleGradient)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Gender Winner Badges */}
                <div className="flex justify-center gap-4 mt-4">
                  {diseaseByGenderData.map(d => (
                    <Badge 
                      key={d.name} 
                      className={cn(
                        "text-xs",
                        d.winner === 'male' ? "bg-[#2196F3]/20 text-[#2196F3]" : "bg-[#E91E63]/20 text-[#E91E63]"
                      )}
                    >
                      {d.name}: {d.winner === 'male' ? 'ذكور أعلى' : 'إناث أعلى'}
                    </Badge>
                  ))}
                </div>
              </ChartCard>

              {/* Polypharmacy */}
              <ChartCard title="تعدد الأدوية" id="chart-polypharmacy">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={polypharmacyData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={90} 
                        dataKey="value"
                        labelLine={false}
                      >
                        {polypharmacyData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`, 'العدد']}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} 
                      />
                      <Legend 
                        formatter={(value) => {
                          const item = polypharmacyData.find(d => d.name === value);
                          const percent = total > 0 && item ? Math.round((item.value / total) * 100) : 0;
                          return <span className="text-sm">{value} ({percent}%)</span>;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {polypharmacyPercent >= 30 && (
                  <div className="mt-4 p-3 bg-[#9C27B0]/10 rounded-xl text-center animate-pulse">
                    <span className="text-sm text-[#9C27B0] font-semibold">⚠️ تنبيه: {polypharmacyPercent}% من المرضى يتناولون 5 أدوية أو أكثر</span>
                  </div>
                )}
              </ChartCard>

              {/* Top Medications - Full Width */}
              <ChartCard title="أكثر الأدوية استخداماً" className="lg:col-span-2" id="chart-medications">
                <div className="flex justify-end gap-2 mb-4">
                  {([10, 15, 'all'] as const).map(limit => (
                    <Button
                      key={limit}
                      variant={topMedsLimit === limit ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTopMedsLimit(limit)}
                      className="rounded-lg text-xs"
                    >
                      {limit === 'all' ? 'الكل' : `Top ${limit}`}
                    </Button>
                  ))}
                </div>
                {topMeds.length > 0 ? (
                  <div className="h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={topMeds} 
                        layout="vertical" 
                        margin={{ top: 10, right: 60, left: 160, bottom: 10 }}
                      >
                        <defs>
                          <linearGradient id="medGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#009688" />
                            <stop offset="100%" stopColor="#00BCD4" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={true} vertical={false} />
                        <XAxis 
                          type="number" 
                          tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                          tickLine={{ stroke: 'hsl(var(--border))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                          domain={[0, 'auto']}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={150}
                          tick={{ 
                            fontSize: 11, 
                            fill: 'hsl(var(--foreground))',
                            fontWeight: 500,
                            textAnchor: 'end'
                          }}
                          tickLine={false}
                          axisLine={false}
                          interval={0}
                          orientation="left"
                        />
                        <Tooltip 
                          formatter={(value: number, name: string, props: any) => [
                            `${value} مريض (${props.payload.percent}%)`, 
                            props.payload.name
                          ]}
                          labelFormatter={(label) => `💊 ${label}`}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))', 
                            borderRadius: '12px',
                            direction: 'rtl',
                            textAlign: 'right',
                            fontSize: '13px'
                          }} 
                        />
                        <Bar 
                          dataKey="count" 
                          fill="url(#medGradient)" 
                          radius={[0, 8, 8, 0]} 
                          name="العدد"
                          label={{ 
                            position: 'right', 
                            fill: 'hsl(var(--foreground))', 
                            fontSize: 11,
                            formatter: (value: number) => value
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                    <Pill className="w-12 h-12 mb-4 opacity-30" />
                    <p>لا توجد بيانات أدوية متاحة</p>
                  </div>
                )}
              </ChartCard>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative py-8 text-center border-t border-border/20 bg-secondary/5">
        <p className="text-sm text-muted-foreground">
          الرعاية الأولية المحسّنة • Enhanced Based Care
        </p>
      </footer>
    </div>
  );
};

export default Statistics;
