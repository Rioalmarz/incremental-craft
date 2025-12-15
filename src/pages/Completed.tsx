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
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Calendar,
  User,
  Pill,
  FlaskConical,
  CalendarCheck,
  ArrowRightLeft,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Patient {
  id: string;
  national_id: string;
  name: string;
  age: number | null;
  gender: string | null;
  has_dm: boolean;
  has_htn: boolean;
  has_dyslipidemia: boolean;
  action: string | null;
  updated_at: string;
  predicted_visit_date: string | null;
  days_until_visit: number | null;
}

interface ClinicData {
  examined_by: string;
  notes: string;
  examined_at: string;
  final_action: string;
}

const ACTION_LABELS: Record<string, { label: string; icon: any }> = {
  refill_rx: { label: "إعادة صرف علاج", icon: Pill },
  order_labs: { label: "طلب تحاليل", icon: FlaskConical },
  schedule_clinical: { label: "موعد فحص سريري", icon: CalendarCheck },
  referral: { label: "تحويل خارجي", icon: ArrowRightLeft },
  no_intervention: { label: "لا يحتاج تدخل", icon: CheckCircle },
  "إعادة_صرف_علاج": { label: "إعادة صرف علاج", icon: Pill },
  "عمل_تحاليل": { label: "طلب تحاليل", icon: FlaskConical },
  "فحص_وقائي": { label: "فحص وقائي", icon: CalendarCheck },
};

const Completed = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [clinicDataMap, setClinicDataMap] = useState<Record<string, ClinicData>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

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
  }, [patients, searchTerm, actionFilter]);

  const fetchPatients = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("status", "completed")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setPatients(data || []);

      // Fetch clinic data for all completed patients
      const patientIds = (data || []).map(p => p.id);
      if (patientIds.length > 0) {
        const { data: clinicData } = await supabase
          .from("virtual_clinic_data")
          .select("patient_id, examined_by, notes, examined_at, final_action")
          .in("patient_id", patientIds);

        const clinicMap: Record<string, ClinicData> = {};
        (clinicData || []).forEach((cd: any) => {
          clinicMap[cd.patient_id] = {
            examined_by: cd.examined_by,
            notes: cd.notes,
            examined_at: cd.examined_at,
            final_action: cd.final_action,
          };
        });
        setClinicDataMap(clinicMap);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات المستفيدين",
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

    if (actionFilter !== "all") {
      filtered = filtered.filter((p) => {
        const clinicInfo = clinicDataMap[p.id];
        return clinicInfo?.final_action === actionFilter || p.action === actionFilter;
      });
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
    if (patient.has_dm) badges.push(<Badge key="dm" className="bg-primary/80">سكري</Badge>);
    if (patient.has_htn) badges.push(<Badge key="htn" className="bg-accent/80">ضغط</Badge>);
    if (patient.has_dyslipidemia) badges.push(<Badge key="dys" className="bg-muted-foreground/80">دهون</Badge>);
    return badges.length > 0 ? badges : [<Badge key="none" variant="outline">لا يوجد</Badge>];
  };

  const getActionBadge = (action: string | null, clinicInfo?: ClinicData) => {
    const actionKey = clinicInfo?.final_action || action || "";
    const actionInfo = ACTION_LABELS[actionKey];
    if (actionInfo) {
      const Icon = actionInfo.icon;
      return (
        <Badge className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
          <Icon size={12} />
          {actionInfo.label}
        </Badge>
      );
    }
    return <Badge variant="outline">{action || "غير محدد"}</Badge>;
  };

  const getPredictionBadge = (accuracy: number | null) => {
    if (accuracy === null || accuracy === undefined) {
      return <Badge variant="outline">غير متاح</Badge>;
    }
    if (accuracy >= 85) {
      return <Badge className="bg-green-600 hover:bg-green-700">{accuracy}% (منتظم)</Badge>;
    }
    if (accuracy >= 60) {
      return <Badge className="bg-amber-500 hover:bg-amber-600">{accuracy}% (متغير)</Badge>;
    }
    return <Badge variant="destructive">{accuracy}% (غير منتظم)</Badge>;
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

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
              <CheckCircle className="text-green-600" size={24} />
              <h1 className="text-lg font-bold">المكتملين</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {filteredPatients.length} مستفيد
            </Badge>
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="py-4 px-4 border-b bg-card/50">
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
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الإجراء" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="refill_rx">إعادة صرف علاج</SelectItem>
                <SelectItem value="order_labs">طلب تحاليل</SelectItem>
                <SelectItem value="schedule_clinical">موعد فحص</SelectItem>
                <SelectItem value="referral">تحويل خارجي</SelectItem>
                <SelectItem value="no_intervention">لا يحتاج تدخل</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                  <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>لا يوجد مستفيدين مكتملين</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المستفيد</TableHead>
                        <TableHead className="text-right">الأمراض المزمنة</TableHead>
                        <TableHead className="text-right">الإجراء المتخذ</TableHead>
                        <TableHead className="text-right">الموعد المتوقع</TableHead>
                        <TableHead className="text-right">دقة التنبؤ</TableHead>
                        <TableHead className="text-right">تاريخ الإكمال</TableHead>
                        <TableHead className="text-right">بواسطة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPatients.map((patient) => {
                        const clinicInfo = clinicDataMap[patient.id];
                        return (
                          <TableRow key={patient.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div>
                                <p className="font-medium">{patient.name}</p>
                                <p className="text-xs text-muted-foreground">{patient.national_id}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {getDiseasesBadges(patient)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getActionBadge(patient.action, clinicInfo)}
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
                                {getPredictionBadge(patient.days_until_visit !== null ? Math.max(0, Math.min(100, 100 - Math.abs(patient.days_until_visit))) : null)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar size={14} className="text-muted-foreground" />
                                <span>{formatDate(clinicInfo?.examined_at || patient.updated_at)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <User size={14} className="text-muted-foreground" />
                                <span>{clinicInfo?.examined_by || "-"}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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

export default Completed;
