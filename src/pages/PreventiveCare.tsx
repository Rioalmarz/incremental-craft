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
  Save,
  Upload,
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

interface Patient {
  id: string;
  name: string;
  national_id: string;
  age: number | null;
  gender: string | null;
  has_dm: boolean | null;
  has_htn: boolean | null;
  has_dyslipidemia: boolean | null;
  status: string | null;
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
}

const STATUS_CONFIG = {
  pending: { label: 'قيد الانتظار', icon: Clock, color: 'bg-muted text-muted-foreground' },
  scheduled: { label: 'مجدول', icon: Calendar, color: 'bg-info/10 text-info' },
  completed: { label: 'مكتمل', icon: CheckCircle2, color: 'bg-success/10 text-success' },
  declined: { label: 'مرفوض', icon: XCircle, color: 'bg-destructive/10 text-destructive' },
};

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
      // Fetch patients and eligibility records in parallel
      const [patientsResult, eligibilityResult] = await Promise.all([
        supabase
          .from("patients")
          .select("id, name, national_id, age, gender, has_dm, has_htn, has_dyslipidemia, status")
          .order("name"),
        supabase
          .from("patient_eligibility")
          .select("*")
      ]);

      if (patientsResult.error) throw patientsResult.error;
      if (eligibilityResult.error) throw eligibilityResult.error;

      // Create a map of eligibility records by patient_id + service_id
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
        
        const baseServices = getEligibleServices(age, gender);
        
        // Merge with eligibility records
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
        };
      });

      // Sort by pending count descending (most pending first)
      patientsWithEligibility.sort((a, b) => b.pendingCount - a.pendingCount);
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

      // Update patients state
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

      // Update selected patient if open
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

    return matchesSearch && matchesPriority && matchesAgeGroup;
  });

  const totalPages = Math.ceil(filteredPatients.length / pageSize);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Statistics
  const stats = {
    total: patients.length,
    totalServices: patients.reduce((acc, p) => acc + p.eligibleServices.length, 0),
    completedServices: patients.reduce((acc, p) => acc + p.completedCount, 0),
    pendingServices: patients.reduce((acc, p) => acc + p.pendingCount, 0),
  };

  const completionRate = stats.totalServices > 0 
    ? Math.round((stats.completedServices / stats.totalServices) * 100) 
    : 0;

  const getPriorityBadge = (label: { label_ar: string; color: string }) => {
    const colorMap: Record<string, string> = {
      red: "bg-destructive/10 text-destructive border-destructive/30",
      yellow: "bg-warning/10 text-warning border-warning/30",
      green: "bg-success/10 text-success border-success/30",
    };
    return (
      <Badge variant="outline" className={colorMap[label.color] || ""}>
        {label.label_ar}
      </Badge>
    );
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
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">الرعاية الوقائية</h1>
                  <p className="text-sm text-muted-foreground">
                    خدمات الفحص والتطعيمات والتثقيف الصحي
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
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">إجمالي المرضى</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-info/5 to-info/10 border-info/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-info/20 rounded-lg flex items-center justify-center">
                  <ClipboardCheck className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalServices}</p>
                  <p className="text-xs text-muted-foreground">إجمالي الخدمات</p>
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
                  <p className="text-2xl font-bold">{stats.completedServices}</p>
                  <p className="text-xs text-muted-foreground">خدمات مكتملة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingServices}</p>
                  <p className="text-xs text-muted-foreground">قيد الانتظار</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completion Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">نسبة إنجاز الخدمات الوقائية</span>
              <span className="text-sm font-bold text-primary">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </CardContent>
        </Card>

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
                value={priorityFilter}
                onValueChange={(value) => {
                  setPriorityFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأولويات</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="low">منخفضة</SelectItem>
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
              <span>المرضى والخدمات المؤهلين لها</span>
              <Badge variant="secondary">{filteredPatients.length} مريض</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right">المريض</TableHead>
                    <TableHead className="text-right">العمر</TableHead>
                    <TableHead className="text-right">الجنس</TableHead>
                    <TableHead className="text-right">الفئة العمرية</TableHead>
                    <TableHead className="text-center">الخدمات</TableHead>
                    <TableHead className="text-center">مكتمل</TableHead>
                    <TableHead className="text-center">قيد الانتظار</TableHead>
                    <TableHead className="text-center">الأولوية</TableHead>
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
                        <TableCell>
                          {patient.ageGroup ? (
                            <Badge variant="outline" className="text-xs">
                              {patient.ageGroup.icon} {patient.ageGroup.group_name_ar}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {patient.eligibleServices.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-success/10 text-success">
                            {patient.completedCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-warning/10 text-warning">
                            {patient.pendingCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {getPriorityBadge(patient.priorityLabel)}
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
                {/* Progress Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-primary/5 text-center">
                    <p className="text-2xl font-bold text-primary">{selectedPatient.eligibleServices.length}</p>
                    <p className="text-xs text-muted-foreground">إجمالي الخدمات</p>
                  </div>
                  <div className="p-4 rounded-xl bg-success/5 text-center">
                    <p className="text-2xl font-bold text-success">{selectedPatient.completedCount}</p>
                    <p className="text-xs text-muted-foreground">مكتمل</p>
                  </div>
                  <div className="p-4 rounded-xl bg-warning/5 text-center">
                    <p className="text-2xl font-bold text-warning">{selectedPatient.pendingCount}</p>
                    <p className="text-xs text-muted-foreground">قيد الانتظار</p>
                  </div>
                </div>

                {/* Priority Score */}
                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">نسبة الإنجاز</span>
                    <span className="text-sm font-bold">
                      {selectedPatient.eligibleServices.length > 0 
                        ? Math.round((selectedPatient.completedCount / selectedPatient.eligibleServices.length) * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress
                    value={selectedPatient.eligibleServices.length > 0 
                      ? (selectedPatient.completedCount / selectedPatient.eligibleServices.length) * 100
                      : 0}
                    className="h-2"
                  />
                </div>

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
                      مواضيع التثقيف الصحي ({selectedPatient.healthEducation.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {selectedPatient.healthEducation.map((topic) => (
                        <Badge
                          key={topic.topic_id}
                          variant="outline"
                          className="text-sm py-1.5 px-3"
                        >
                          {topic.topic_name_ar}
                        </Badge>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>استيراد بيانات الرعاية الوقائية</DialogTitle>
          </DialogHeader>
          <SmartExcelImport
            importType="preventive"
            onImportComplete={() => {
              fetchData();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PreventiveCare;
