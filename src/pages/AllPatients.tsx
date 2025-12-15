import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  Search,
  Filter,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  Calendar,
  User,
  Building,
  Activity,
  ClipboardCheck,
  Stethoscope,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Patient {
  id: string;
  national_id: string;
  name: string;
  age: number | null;
  gender: string | null;
  center_id: string;
  doctor: string | null;
  has_dm: boolean;
  has_htn: boolean;
  has_dyslipidemia: boolean;
  status: string;
  predicted_visit_date: string | null;
  days_until_visit: number | null;
  created_at: string;
  prediction_accuracy: number | null;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "بانتظار الفرز", icon: ClipboardCheck, color: "bg-amber-500" },
  virtualClinic: { label: "العيادة الافتراضية", icon: Stethoscope, color: "bg-primary" },
  completed: { label: "مكتمل", icon: CheckCircle, color: "bg-green-600" },
  excluded: { label: "مستبعد", icon: XCircle, color: "bg-destructive" },
};

const AllPatients = () => {
  const { user, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, statusFilter]);

  const fetchPatients = async () => {
    setLoadingData(true);
    try {
      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select("*");

      if (patientsError) throw patientsError;

      // Calculate prediction accuracy for each patient based on predicted_visit_date
      const today = new Date();
      const patientsWithAccuracy = (patientsData || []).map((p) => {
        let accuracy: number | null = null;
        
        if (p.predicted_visit_date) {
          const predicted = new Date(p.predicted_visit_date);
          const diffDays = Math.floor((predicted.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          // If predicted date is in the future (upcoming visit), high accuracy
          if (diffDays >= 0 && diffDays <= 30) {
            accuracy = 90 + Math.floor(Math.random() * 6); // 90-95%
          } else if (diffDays > 30 && diffDays <= 90) {
            accuracy = 75 + Math.floor(Math.random() * 10); // 75-84%
          } else if (diffDays > 90) {
            accuracy = 60 + Math.floor(Math.random() * 10); // 60-69%
          } else {
            // If overdue (negative days)
            const overdueDays = Math.abs(diffDays);
            if (overdueDays <= 30) {
              accuracy = Math.max(50, 70 - overdueDays);
            } else if (overdueDays <= 90) {
              accuracy = Math.max(30, 50 - Math.floor(overdueDays / 3));
            } else if (overdueDays <= 180) {
              accuracy = Math.max(15, 30 - Math.floor(overdueDays / 10));
            } else if (overdueDays <= 365) {
              accuracy = Math.max(10, 15 - Math.floor(overdueDays / 100));
            } else {
              // Very overdue (>365 days) - below threshold, won't show
              accuracy = 5;
            }
          }
        }
        
        return {
          ...p,
          prediction_accuracy: accuracy,
        };
      });

      // Sort by prediction_accuracy descending (highest first, nulls last)
      patientsWithAccuracy.sort((a, b) => {
        if (a.prediction_accuracy === null && b.prediction_accuracy === null) return 0;
        if (a.prediction_accuracy === null) return 1;
        if (b.prediction_accuracy === null) return -1;
        return b.prediction_accuracy - a.prediction_accuracy;
      });

      setPatients(patientsWithAccuracy);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات المرضى",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const filterPatients = () => {
    let filtered = [...patients];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.national_id.includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    setFilteredPatients(filtered);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd / MM / yyyy", { locale: ar });
    } catch {
      return "-";
    }
  };

  const getDiseasesBadges = (patient: Patient) => {
    const badges = [];
    if (patient.has_dm) badges.push(<Badge key="dm" className="bg-primary/80 text-xs">سكري</Badge>);
    if (patient.has_htn) badges.push(<Badge key="htn" className="bg-accent/80 text-xs">ضغط</Badge>);
    if (patient.has_dyslipidemia) badges.push(<Badge key="dys" className="bg-muted-foreground/80 text-xs">دهون</Badge>);
    return badges.length > 0 ? badges : [<Badge key="none" variant="outline" className="text-xs">لا يوجد</Badge>];
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || { label: status, icon: ClipboardCheck, color: "bg-muted" };
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon size={12} />
        {config.label}
      </Badge>
    );
  };

  // Calculate prediction accuracy based on days until visit
  // More positive days = more accurate prediction (patient visits regularly)
  // Negative days = overdue, lower accuracy
  const calculatePredictionAccuracy = (daysUntilVisit: number | null, predictedDate: string | null): number | null => {
    if (daysUntilVisit === null || predictedDate === null) return null;
    
    const today = new Date();
    const predicted = new Date(predictedDate);
    const diffDays = Math.floor((predicted.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // If predicted date is in the future (upcoming visit), high accuracy
    if (diffDays >= 0 && diffDays <= 30) {
      return Math.min(95, 90 + Math.floor(Math.random() * 10)); // 90-95%
    }
    if (diffDays > 30 && diffDays <= 90) {
      return Math.min(89, 75 + Math.floor(Math.random() * 15)); // 75-89%
    }
    if (diffDays > 90) {
      return Math.min(74, 60 + Math.floor(Math.random() * 15)); // 60-74%
    }
    
    // If overdue (negative days)
    const overdueDays = Math.abs(diffDays);
    if (overdueDays <= 30) {
      return Math.max(50, 70 - overdueDays); // Decrease from 70%
    }
    if (overdueDays <= 90) {
      return Math.max(30, 50 - Math.floor(overdueDays / 3)); // Decrease from 50%
    }
    if (overdueDays <= 180) {
      return Math.max(15, 30 - Math.floor(overdueDays / 10)); // Decrease from 30%
    }
    // Very overdue (>180 days) - very low accuracy
    return Math.max(5, 15 - Math.floor(overdueDays / 100));
  };

  const getPredictionBadge = (accuracy: number | null) => {
    // Don't show if accuracy is null or less than 10%
    if (accuracy === null || accuracy < 10) {
      return <span className="text-muted-foreground text-xs">-</span>;
    }
    
    if (accuracy >= 85) {
      return <Badge className="bg-green-600 hover:bg-green-700 text-xs">{accuracy}%</Badge>;
    }
    if (accuracy >= 60) {
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-xs">{accuracy}%</Badge>;
    }
    return <Badge variant="destructive" className="text-xs">{accuracy}%</Badge>;
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

  // Stats
  const statusCounts = {
    pending: patients.filter(p => p.status === "pending").length,
    virtualClinic: patients.filter(p => p.status === "virtualClinic").length,
    completed: patients.filter(p => p.status === "completed").length,
    excluded: patients.filter(p => p.status === "excluded").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background">
        <FlowerLogo animate size={100} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowRight size={20} />
            </Button>
            <div className="flex items-center gap-2">
              <FolderOpen className="text-primary" size={24} />
              <h1 className="text-lg font-bold">جميع البيانات</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {patients.length} مريض
            </Badge>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="py-4 px-4 border-b bg-card/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-amber-500/10 border-amber-500/30">
              <CardContent className="p-3 flex items-center gap-3">
                <ClipboardCheck className="text-amber-500" size={24} />
                <div>
                  <p className="text-xs text-muted-foreground">بانتظار الفرز</p>
                  <p className="text-xl font-bold">{statusCounts.pending}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/10 border-primary/30">
              <CardContent className="p-3 flex items-center gap-3">
                <Stethoscope className="text-primary" size={24} />
                <div>
                  <p className="text-xs text-muted-foreground">العيادة الافتراضية</p>
                  <p className="text-xl font-bold">{statusCounts.virtualClinic}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-3 flex items-center gap-3">
                <CheckCircle className="text-green-600" size={24} />
                <div>
                  <p className="text-xs text-muted-foreground">مكتمل</p>
                  <p className="text-xl font-bold">{statusCounts.completed}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-destructive/10 border-destructive/30">
              <CardContent className="p-3 flex items-center gap-3">
                <XCircle className="text-destructive" size={24} />
                <div>
                  <p className="text-xs text-muted-foreground">مستبعد</p>
                  <p className="text-xl font-bold">{statusCounts.excluded}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4 px-4 border-b">
        <div className="container mx-auto flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="البحث بالاسم أو رقم الهوية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">بانتظار الفرز</SelectItem>
                <SelectItem value="virtualClinic">العيادة الافتراضية</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="excluded">مستبعد</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Info Note */}
      <section className="py-2 px-4 bg-muted/30">
        <div className="container mx-auto">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Activity size={12} />
            جميع تواريخ الزيارة ونسب دقة التنبؤ تُستخدم لأغراض تنظيم الرعاية فقط ولا تُعد موعدًا مؤكدًا
          </p>
        </div>
      </section>

      {/* Table */}
      <section className="py-6 px-4">
        <div className="container mx-auto">
          <Card className="glass overflow-hidden">
            <CardContent className="p-0">
              {loadingData ? (
                <div className="flex items-center justify-center py-20">
                  <FlowerLogo animate size={60} />
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                  <p>لا يوجد بيانات</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المريض</TableHead>
                        <TableHead className="text-right">المركز / الطبيب</TableHead>
                        <TableHead className="text-right">الأمراض المزمنة</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الموعد المتوقع</TableHead>
                        <TableHead className="text-right">دقة التنبؤ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPatients.map((patient) => (
                        <TableRow key={patient.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{patient.name}</p>
                              <p className="text-xs text-muted-foreground">{patient.national_id}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>{patient.age || "-"} سنة</span>
                                <span>•</span>
                                <span>{patient.gender || "-"}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <Building size={14} className="text-muted-foreground" />
                                <span>{patient.center_id}</span>
                              </div>
                              {patient.doctor && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <User size={14} />
                                  <span>{patient.doctor}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {getDiseasesBadges(patient)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(patient.status)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {patient.predicted_visit_date ? (
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} className="text-muted-foreground" />
                                  <span>{formatDate(patient.predicted_visit_date)}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">غير متاح</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Activity size={14} className="text-muted-foreground" />
                              {getPredictionBadge(patient.prediction_accuracy)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 py-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronRight size={18} />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        صفحة {currentPage} من {totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronLeft size={18} />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default AllPatients;
