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
} from "lucide-react";
import {
  getEligibleServices,
  getEligibleImmunizations,
  getHealthEducationTopics,
  getAgeGroup,
  calculatePriorityScore,
  getPriorityLabel,
  PREVENTIVE_SERVICES,
  IMMUNIZATIONS,
  HEALTH_EDUCATION,
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

interface PatientWithEligibility extends Patient {
  eligibleServices: PreventiveService[];
  eligibleImmunizations: Immunization[];
  healthEducation: HealthEducation[];
  priorityScore: number;
  priorityLabel: { label_ar: string; label_en: string; color: string };
  ageGroup: typeof AGE_GROUPS[0] | undefined;
}

const PreventiveCare = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientWithEligibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithEligibility | null>(null);
  const pageSize = 15;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPatients();
    }
  }, [user]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, national_id, age, gender, has_dm, has_htn, has_dyslipidemia, status")
        .order("name");

      if (error) throw error;

      const patientsWithEligibility: PatientWithEligibility[] = (data || []).map((patient) => {
        const age = patient.age || 0;
        const gender = patient.gender?.toLowerCase() === "ذكر" || patient.gender?.toLowerCase() === "male" 
          ? "male" as const 
          : "female" as const;
        
        const eligibleServices = getEligibleServices(age, gender);
        const eligibleImmunizations = getEligibleImmunizations(age * 12); // Convert years to months
        const healthEducation = getHealthEducationTopics(age);
        const priorityScore = calculatePriorityScore(eligibleServices);
        const priorityLabel = getPriorityLabel(priorityScore);
        const ageGroup = getAgeGroup(age);

        return {
          ...patient,
          eligibleServices,
          eligibleImmunizations,
          healthEducation,
          priorityScore,
          priorityLabel,
          ageGroup,
        };
      });

      // Sort by priority score descending
      patientsWithEligibility.sort((a, b) => b.priorityScore - a.priorityScore);
      setPatients(patientsWithEligibility);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
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
    highPriority: patients.filter((p) => p.priorityLabel.label_en === "High").length,
    mediumPriority: patients.filter((p) => p.priorityLabel.label_en === "Medium").length,
    lowPriority: patients.filter((p) => p.priorityLabel.label_en === "Low").length,
  };

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

          <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.highPriority}</p>
                  <p className="text-xs text-muted-foreground">أولوية عالية</p>
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
                  <p className="text-2xl font-bold">{stats.mediumPriority}</p>
                  <p className="text-xs text-muted-foreground">أولوية متوسطة</p>
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
                  <p className="text-2xl font-bold">{stats.lowPriority}</p>
                  <p className="text-xs text-muted-foreground">أولوية منخفضة</p>
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
                    <TableHead className="text-center">الفحوصات</TableHead>
                    <TableHead className="text-center">التطعيمات</TableHead>
                    <TableHead className="text-center">التثقيف</TableHead>
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
                          <Badge variant="secondary" className="bg-accent/10 text-accent-foreground">
                            {patient.eligibleImmunizations.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-info/10 text-info">
                            {patient.healthEducation.length}
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
                {/* Priority Score */}
                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">درجة الأولوية</span>
                    {getPriorityBadge(selectedPatient.priorityLabel)}
                  </div>
                  <Progress
                    value={Math.min(100, (selectedPatient.priorityScore / 30) * 100)}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedPatient.priorityScore} نقطة
                  </p>
                </div>

                {/* Eligible Services */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-primary" />
                      الفحوصات الوقائية المؤهل لها ({selectedPatient.eligibleServices.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-2">
                      {selectedPatient.eligibleServices.map((service) => (
                        <div
                          key={service.service_id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{service.service_name_ar}</p>
                            <p className="text-xs text-muted-foreground">
                              {service.description_ar}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                service.priority === "high"
                                  ? "bg-destructive/10 text-destructive border-destructive/30"
                                  : service.priority === "medium"
                                  ? "bg-warning/10 text-warning border-warning/30"
                                  : "bg-success/10 text-success border-success/30"
                              }
                            >
                              {service.priority === "high"
                                ? "عالي"
                                : service.priority === "medium"
                                ? "متوسط"
                                : "منخفض"}
                            </Badge>
                            {service.frequency_months > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                كل {service.frequency_months} شهر
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
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
    </div>
  );
};

export default PreventiveCare;
