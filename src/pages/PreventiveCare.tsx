import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  Search,
  Filter,
  Users,
  Syringe,
  ClipboardCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  XCircle,
  Loader2,
  Upload,
  ShieldCheck,
  Heart,
  Activity,
  Droplets,
  AlertTriangle,
  Download,
} from "lucide-react";
import SmartExcelImport from "@/components/SmartExcelImport";
import {
  getEligibleServices,
  getEligibleImmunizations,
  getHealthEducationTopics,
  getAgeGroup,
  calculatePriorityScore,
  getPriorityLabel,
  AGE_GROUPS,
  type PreventiveService,
  type Immunization,
  type HealthEducation,
} from "@/data/preventiveCareSupabase";
import {
  classifyOverallRisk,
  classifyBP,
  classifyHBA1C,
  classifyFBG,
  classifyLDL,
  getRiskColor,
  getRiskBgColor,
  getRiskBorderColor,
  getRecommendations,
  type RiskLevel,
} from "@/lib/riskClassification";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  name: string;
  national_id: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  has_dm: boolean | null;
  has_htn: boolean | null;
  has_dyslipidemia: boolean | null;
  status: string | null;
  fasting_blood_glucose: number | null;
  hba1c: number | null;
  ldl: number | null;
  bp_last_visit: string | null;
  call_status: string | null;
  call_date: string | null;
  call_notes: string | null;
}

interface EligibilityRecord {
  id?: string;
  patient_id: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  service_id: string;
  service_code: string;
  service_name_ar: string;
  is_eligible: boolean;
  status: 'pending' | 'scheduled' | 'completed' | 'declined';
  priority: string;
  due_date?: string | null;
  last_completed_date?: string | null;
}

interface ServiceWithStatus extends PreventiveService {
  eligibilityStatus: 'pending' | 'scheduled' | 'completed' | 'declined';
  eligibilityId?: string;
  dueDate?: string | null;
  lastCompletedDate?: string | null;
}

interface PatientWithEligibility extends Patient {
  eligibleServices: ServiceWithStatus[];
  eligibleImmunizations: Immunization[];
  healthEducation: HealthEducation[];
  priorityScore: number;
  priorityLabel: { label_ar: string; label_en: string; color: string };
  ageGroup: typeof AGE_GROUPS[0] | undefined;
  completedCount: number;
  pendingCount: number;
  riskClassification: RiskLevel;
  riskDetails: {
    bp: RiskLevel;
    hba1c: RiskLevel;
    fbg: RiskLevel;
    ldl: RiskLevel;
  };
}

const STATUS_CONFIG = {
  pending: { label: 'قيد الانتظار', icon: Clock, color: 'bg-muted text-muted-foreground' },
  scheduled: { label: 'مجدول', icon: Calendar, color: 'bg-info/10 text-info' },
  completed: { label: 'مكتمل', icon: CheckCircle2, color: 'bg-success/10 text-success' },
  declined: { label: 'مرفوض', icon: XCircle, color: 'bg-destructive/10 text-destructive' },
};

const RISK_FILTER_OPTIONS = [
  { value: 'all', label: 'جميع التصنيفات' },
  { value: 'مسيطر عليه', label: '✅ مسيطر عليه' },
  { value: 'يحتاج مراقبة', label: '⚠️ يحتاج مراقبة' },
  { value: 'يحتاج تعديل أو تدخل من الطبيب', label: '🔴 يحتاج تدخل' },
  { value: 'غير معروف', label: '❓ غير معروف' },
];

const PreventiveCare = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<PatientWithEligibility[]>([]);
  const [eligibilityRecords, setEligibilityRecords] = useState<Map<string, EligibilityRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithEligibility | null>(null);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const pageSize = 15;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [patientsResult, eligibilityResult] = await Promise.all([
        supabase
          .from("patients")
          .select("id, name, national_id, age, gender, phone, has_dm, has_htn, has_dyslipidemia, status, fasting_blood_glucose, hba1c, ldl, bp_last_visit, call_status, call_date, call_notes")
          .order("name"),
        supabase
          .from("patient_eligibility")
          .select("*")
      ]);

      if (patientsResult.error) throw patientsResult.error;
      if (eligibilityResult.error) throw eligibilityResult.error;

      const eligibilityMap = new Map<string, EligibilityRecord>();
      (eligibilityResult.data || []).forEach((record) => {
        const key = `${record.patient_id}_${record.service_id}`;
        eligibilityMap.set(key, record as EligibilityRecord);
      });
      setEligibilityRecords(eligibilityMap);

      const patientsWithEligibility: PatientWithEligibility[] = (patientsResult.data || []).map((patient) => {
        const age = patient.age || 0;
        const gender = patient.gender?.toLowerCase() === "ذكر" || patient.gender?.toLowerCase() === "male" 
          ? "male" as const 
          : "female" as const;
        
        // Calculate risk classification
        const riskResult = classifyOverallRisk({
          fasting_blood_glucose: patient.fasting_blood_glucose,
          hba1c: patient.hba1c,
          ldl: patient.ldl,
          bp_last_visit: patient.bp_last_visit,
        });
        
        const baseServices = getEligibleServices(age, gender);
        
        const eligibleServices: ServiceWithStatus[] = baseServices.map((service) => {
          const key = `${patient.national_id}_${service.service_id}`;
          const record = eligibilityMap.get(key);
          return {
            ...service,
            eligibilityStatus: (record?.status as ServiceWithStatus['eligibilityStatus']) || 'pending',
            eligibilityId: record?.id,
            dueDate: record?.due_date,
            lastCompletedDate: record?.last_completed_date,
          };
        });

        const eligibleImmunizations = getEligibleImmunizations(age * 12);
        const healthEducation = getHealthEducationTopics(age);
        const priorityScore = calculatePriorityScore(baseServices);
        const priorityLabel = getPriorityLabel(priorityScore);
        const ageGroup = getAgeGroup(age);

        const completedCount = eligibleServices.filter(s => s.eligibilityStatus === 'completed').length;
        const pendingCount = eligibleServices.filter(s => s.eligibilityStatus === 'pending').length;

        return {
          ...patient,
          eligibleServices,
          eligibleImmunizations,
          healthEducation,
          priorityScore,
          priorityLabel,
          ageGroup,
          completedCount,
          pendingCount,
          riskClassification: riskResult.overall,
          riskDetails: {
            bp: riskResult.bp,
            hba1c: riskResult.hba1c,
            fbg: riskResult.fbg,
            ldl: riskResult.ldl,
          },
        };
      });

      patientsWithEligibility.sort((a, b) => {
        // Sort by risk first (يحتاج تدخل > يحتاج مراقبة > مسيطر عليه)
        const riskOrder = { 'يحتاج تعديل أو تدخل من الطبيب': 0, 'يحتاج مراقبة': 1, 'مسيطر عليه': 2, 'غير معروف': 3 };
        const riskDiff = (riskOrder[a.riskClassification] ?? 3) - (riskOrder[b.riskClassification] ?? 3);
        if (riskDiff !== 0) return riskDiff;
        return b.pendingCount - a.pendingCount;
      });
      setPatients(patientsWithEligibility);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateServiceStatus = async (
    patient: PatientWithEligibility,
    service: ServiceWithStatus,
    newStatus: 'pending' | 'scheduled' | 'completed' | 'declined'
  ) => {
    setSavingStatus(`${patient.national_id}_${service.service_id}`);
    
    try {
      const gender = patient.gender?.toLowerCase() === "ذكر" || patient.gender?.toLowerCase() === "male" 
        ? "male" : "female";

      const eligibilityData: Omit<EligibilityRecord, 'id'> = {
        patient_id: patient.national_id,
        patient_name: patient.name,
        patient_age: patient.age || 0,
        patient_gender: gender,
        service_id: service.service_id,
        service_code: service.service_code,
        service_name_ar: service.service_name_ar,
        is_eligible: true,
        status: newStatus,
        priority: service.priority,
        last_completed_date: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : service.lastCompletedDate,
      };

      const { error } = await supabase
        .from("patient_eligibility")
        .upsert(eligibilityData, {
          onConflict: 'patient_id,service_id',
        });

      if (error) throw error;

      // Update local state
      const key = `${patient.national_id}_${service.service_id}`;
      const updatedRecord: EligibilityRecord = {
        ...eligibilityData,
        id: service.eligibilityId,
      };
      
      setEligibilityRecords(prev => {
        const newMap = new Map(prev);
        newMap.set(key, updatedRecord);
        return newMap;
      });

      setPatients(prev => prev.map(p => {
        if (p.id !== patient.id) return p;
        
        const updatedServices = p.eligibleServices.map(s => {
          if (s.service_id !== service.service_id) return s;
          return {
            ...s,
            eligibilityStatus: newStatus,
            lastCompletedDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : s.lastCompletedDate,
          };
        });

        return {
          ...p,
          eligibleServices: updatedServices,
          completedCount: updatedServices.filter(s => s.eligibilityStatus === 'completed').length,
          pendingCount: updatedServices.filter(s => s.eligibilityStatus === 'pending').length,
        };
      }));

      if (selectedPatient?.id === patient.id) {
        setSelectedPatient(prev => {
          if (!prev) return null;
          const updatedServices = prev.eligibleServices.map(s => {
            if (s.service_id !== service.service_id) return s;
            return {
              ...s,
              eligibilityStatus: newStatus,
              lastCompletedDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : s.lastCompletedDate,
            };
          });
          return {
            ...prev,
            eligibleServices: updatedServices,
            completedCount: updatedServices.filter(s => s.eligibilityStatus === 'completed').length,
            pendingCount: updatedServices.filter(s => s.eligibilityStatus === 'pending').length,
          };
        });
      }

      toast({
        title: "تم التحديث",
        description: `تم تحديث حالة "${service.service_name_ar}" إلى "${STATUS_CONFIG[newStatus].label}"`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الحالة",
        variant: "destructive",
      });
    } finally {
      setSavingStatus(null);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.national_id.includes(searchTerm);
    
    const matchesPriority =
      priorityFilter === "all" || patient.priorityLabel.label_en.toLowerCase() === priorityFilter;
    
    const matchesAgeGroup =
      ageGroupFilter === "all" || patient.ageGroup?.group_id.toString() === ageGroupFilter;

    const matchesRisk =
      riskFilter === "all" || patient.riskClassification === riskFilter;

    return matchesSearch && matchesPriority && matchesAgeGroup && matchesRisk;
  });

  const totalPages = Math.ceil(filteredPatients.length / pageSize);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Statistics
  const stats = {
    total: patients.length,
    normal: patients.filter(p => p.riskClassification === 'مسيطر عليه').length,
    needsMonitoring: patients.filter(p => p.riskClassification === 'يحتاج مراقبة').length,
    atRisk: patients.filter(p => p.riskClassification === 'يحتاج تعديل أو تدخل من الطبيب').length,
  };

  const getRiskBadge = (risk: RiskLevel) => {
    const icons = {
      'مسيطر عليه': '✅',
      'يحتاج مراقبة': '⚠️',
      'يحتاج تعديل أو تدخل من الطبيب': '🔴',
      'غير معروف': '❓',
    };
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "gap-1",
          getRiskBgColor(risk),
          getRiskColor(risk),
          getRiskBorderColor(risk)
        )}
      >
        {icons[risk]} {risk}
      </Badge>
    );
  };

  const formatLabValue = (value: number | null | undefined, unit: string) => {
    if (value == null) return <span className="text-muted-foreground">-</span>;
    return <span>{value} {unit}</span>;
  };

  const getLabValueWithColor = (value: number | null | undefined, classifier: (v: number | null | undefined) => RiskLevel) => {
    if (value == null) return <span className="text-muted-foreground">-</span>;
    const risk = classifier(value);
    return <span className={getRiskColor(risk)}>{value}</span>;
  };

  const getBPWithColor = (bp: string | null | undefined) => {
    if (!bp) return <span className="text-muted-foreground">-</span>;
    const risk = classifyBP(bp);
    return <span className={getRiskColor(risk)}>{bp}</span>;
  };

  const getGenderDisplay = (gender: string | null) => {
    if (!gender) return "-";
    const g = gender.toLowerCase();
    if (g === "male" || g === "ذكر") return "ذكر";
    if (g === "female" || g === "أنثى") return "أنثى";
    return gender;
  };

  const getStatusBadge = (status: keyof typeof STATUS_CONFIG) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <FlowerLogo animate size={80} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="rounded-full"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">🛡️ الرعاية الوقائية</h1>
                  <p className="text-sm text-muted-foreground">
                    الفحوصات – التطعيمات – التثقيف الصحي
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              استيراد البيانات
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Risk Distribution KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">الإجمالي</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{stats.normal}</p>
                  <p className="text-xs text-muted-foreground">✅ طبيعي</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{stats.needsMonitoring}</p>
                  <p className="text-xs text-muted-foreground">⚠️ يحتاج مراقبة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{stats.atRisk}</p>
                  <p className="text-xs text-muted-foreground">🔴 خطر</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو رقم الهوية..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pr-10"
                />
              </div>

              <Select
                value={riskFilter}
                onValueChange={(value) => {
                  setRiskFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-48">
                  <AlertTriangle className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {RISK_FILTER_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={ageGroupFilter}
                onValueChange={(value) => {
                  setAgeGroupFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-48">
                  <Users className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="الفئة العمرية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  {AGE_GROUPS.map((group) => (
                    <SelectItem key={group.group_id} value={group.group_id.toString()}>
                      {group.icon} {group.group_name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>المستفيدين ونتائج الفحوصات</span>
              <Badge variant="secondary">{filteredPatients.length} مستفيد</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right">المستفيد</TableHead>
                    <TableHead className="text-right">العمر</TableHead>
                    <TableHead className="text-right">الجنس</TableHead>
                    <TableHead className="text-center">سكر صائم</TableHead>
                    <TableHead className="text-center">HBA1C</TableHead>
                    <TableHead className="text-center">LDL</TableHead>
                    <TableHead className="text-center">ضغط الدم</TableHead>
                    <TableHead className="text-center">التصنيف</TableHead>
                    <TableHead className="text-center">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                        لا توجد نتائج
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPatients.map((patient) => (
                      <TableRow key={patient.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-xs text-muted-foreground">{patient.national_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>{patient.age || "-"}</TableCell>
                        <TableCell>{getGenderDisplay(patient.gender)}</TableCell>
                        <TableCell className="text-center">
                          {getLabValueWithColor(patient.fasting_blood_glucose, classifyFBG)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getLabValueWithColor(patient.hba1c, classifyHBA1C)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getLabValueWithColor(patient.ldl, classifyLDL)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getBPWithColor(patient.bp_last_visit)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getRiskBadge(patient.riskClassification)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPatient(patient)}
                            className="gap-1"
                          >
                            <UserCheck className="h-4 w-4" />
                            عرض
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  عرض {(currentPage - 1) * pageSize + 1} -{" "}
                  {Math.min(currentPage * pageSize, filteredPatients.length)} من{" "}
                  {filteredPatients.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Patient Details Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          {selectedPatient && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl">{selectedPatient.name}</p>
                    <p className="text-sm text-muted-foreground font-normal">
                      {selectedPatient.ageGroup?.icon} {selectedPatient.ageGroup?.group_name_ar} •{" "}
                      {selectedPatient.age} سنة • {getGenderDisplay(selectedPatient.gender)}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Risk Classification Card */}
                <Card className={cn(
                  "border-2",
                  getRiskBorderColor(selectedPatient.riskClassification)
                )}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        التصنيف العام
                      </span>
                      {getRiskBadge(selectedPatient.riskClassification)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-muted/30 text-center">
                        <Heart className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-xs text-muted-foreground mb-1">ضغط الدم</p>
                        <p className={cn("font-bold", getRiskColor(selectedPatient.riskDetails.bp))}>
                          {selectedPatient.bp_last_visit || '-'}
                        </p>
                        <Badge variant="outline" className={cn("text-xs mt-1", getRiskBgColor(selectedPatient.riskDetails.bp), getRiskColor(selectedPatient.riskDetails.bp))}>
                          {selectedPatient.riskDetails.bp}
                        </Badge>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 text-center">
                        <Activity className="h-5 w-5 mx-auto mb-1 text-warning" />
                        <p className="text-xs text-muted-foreground mb-1">سكر صائم</p>
                        <p className={cn("font-bold", getRiskColor(selectedPatient.riskDetails.fbg))}>
                          {selectedPatient.fasting_blood_glucose ?? '-'}
                        </p>
                        <Badge variant="outline" className={cn("text-xs mt-1", getRiskBgColor(selectedPatient.riskDetails.fbg), getRiskColor(selectedPatient.riskDetails.fbg))}>
                          {selectedPatient.riskDetails.fbg}
                        </Badge>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 text-center">
                        <Activity className="h-5 w-5 mx-auto mb-1 text-destructive" />
                        <p className="text-xs text-muted-foreground mb-1">HBA1C</p>
                        <p className={cn("font-bold", getRiskColor(selectedPatient.riskDetails.hba1c))}>
                          {selectedPatient.hba1c ?? '-'}
                        </p>
                        <Badge variant="outline" className={cn("text-xs mt-1", getRiskBgColor(selectedPatient.riskDetails.hba1c), getRiskColor(selectedPatient.riskDetails.hba1c))}>
                          {selectedPatient.riskDetails.hba1c}
                        </Badge>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 text-center">
                        <Droplets className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                        <p className="text-xs text-muted-foreground mb-1">LDL</p>
                        <p className={cn("font-bold", getRiskColor(selectedPatient.riskDetails.ldl))}>
                          {selectedPatient.ldl ?? '-'}
                        </p>
                        <Badge variant="outline" className={cn("text-xs mt-1", getRiskBgColor(selectedPatient.riskDetails.ldl), getRiskColor(selectedPatient.riskDetails.ldl))}>
                          {selectedPatient.riskDetails.ldl}
                        </Badge>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className={cn(
                      "p-4 rounded-lg border",
                      getRiskBgColor(selectedPatient.riskClassification),
                      getRiskBorderColor(selectedPatient.riskClassification)
                    )}>
                      <p className="font-medium mb-2">التوصيات:</p>
                      <ul className="space-y-1 text-sm">
                        {getRecommendations(selectedPatient.riskClassification).map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span>•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Info */}
                {selectedPatient.phone && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                            <Clock className="h-5 w-5 text-info" />
                          </div>
                          <div>
                            <p className="font-medium">معلومات الاتصال</p>
                            <p className="text-sm text-muted-foreground">{selectedPatient.phone}</p>
                          </div>
                        </div>
                        {selectedPatient.call_status && (
                          <Badge variant="outline">
                            {selectedPatient.call_status}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Eligible Services with Status Update */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-primary" />
                      الفحوصات الوقائية ({selectedPatient.eligibleServices.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {selectedPatient.eligibleServices.map((service) => {
                        const isSaving = savingStatus === `${selectedPatient.national_id}_${service.service_id}`;
                        return (
                          <div
                            key={service.service_id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors gap-3"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">{service.service_name_ar}</p>
                                {getStatusBadge(service.eligibilityStatus)}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {service.description_ar}
                              </p>
                              {service.lastCompletedDate && (
                                <p className="text-xs text-success mt-1">
                                  آخر إنجاز: {new Date(service.lastCompletedDate).toLocaleDateString('ar-SA')}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Select
                                value={service.eligibilityStatus}
                                onValueChange={(value) => 
                                  updateServiceStatus(
                                    selectedPatient, 
                                    service, 
                                    value as 'pending' | 'scheduled' | 'completed' | 'declined'
                                  )
                                }
                                disabled={isSaving}
                              >
                                <SelectTrigger className="w-36">
                                  {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <SelectValue />
                                  )}
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">
                                    <span className="flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      قيد الانتظار
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="scheduled">
                                    <span className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      مجدول
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="completed">
                                    <span className="flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4" />
                                      مكتمل
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="declined">
                                    <span className="flex items-center gap-2">
                                      <XCircle className="h-4 w-4" />
                                      مرفوض
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Immunizations */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Syringe className="h-5 w-5 text-accent" />
                      التطعيمات المؤهل لها ({selectedPatient.eligibleImmunizations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-2">
                      {selectedPatient.eligibleImmunizations.map((vaccine) => (
                        <div
                          key={vaccine.vaccine_id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{vaccine.vaccine_name_ar}</p>
                            <p className="text-xs text-muted-foreground">{vaccine.schedule}</p>
                          </div>
                          <Badge variant="secondary">{vaccine.doses} جرعات</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Health Education */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-info" />
                      التثقيف الصحي ({selectedPatient.healthEducation.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-2">
                      {selectedPatient.healthEducation.map((topic) => (
                        <div
                          key={topic.topic_id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{topic.topic_name_ar}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {topic.format}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>استيراد بيانات الرعاية الوقائية</DialogTitle>
          </DialogHeader>
          <SmartExcelImport
            importType="preventive"
            onImportComplete={() => {
              setShowImportDialog(false);
              fetchData();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PreventiveCare;
