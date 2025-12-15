import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ClipboardCheck,
  Stethoscope,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Phone,
  Calendar,
  Pill,
  AlertTriangle
} from "lucide-react";

interface Patient {
  id: string;
  national_id: string;
  name: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  center_id: string;
  has_dm: boolean;
  has_htn: boolean;
  has_dyslipidemia: boolean;
  burden: string | null;
  team: string | null;
  doctor: string | null;
  urgency_status: string | null;
  days_until_visit: number | null;
  visit_window_text: string | null;
  status: string;
  symptoms: any;
  action: string | null;
  exclusion_reason: string | null;
  created_at: string;
}

interface ScreeningData {
  id?: string;
  patient_id: string;
  prev_contact: string;
  last_lab: string;
  rx_status: string;
  residence: string;
  visit_type: string;
  appointment_date: string | null;
  notes: string;
  screened_by: string;
}

const Screening = () => {
  const { user, profile, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  
  // Modal state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [screeningData, setScreeningData] = useState<ScreeningData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
  }, [patients, searchTerm, urgencyFilter]);

  const fetchPatients = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("status", "pending")
        .order("urgency_status", { ascending: false })
        .order("days_until_visit", { ascending: true });

      if (error) throw error;
      setPatients(data || []);
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
          p.national_id.includes(term) ||
          p.phone?.includes(term)
      );
    }

    if (urgencyFilter !== "all") {
      filtered = filtered.filter((p) => p.urgency_status === urgencyFilter);
    }

    setFilteredPatients(filtered);
    setCurrentPage(1);
  };

  const openScreeningModal = async (patient: Patient) => {
    setSelectedPatient(patient);
    
    // Check if screening data exists
    const { data } = await supabase
      .from("screening_data")
      .select("*")
      .eq("patient_id", patient.id)
      .maybeSingle();

    if (data) {
      setScreeningData(data as ScreeningData);
    } else {
      setScreeningData({
        patient_id: patient.id,
        prev_contact: "",
        last_lab: "",
        rx_status: "",
        residence: "",
        visit_type: "",
        appointment_date: null,
        notes: "",
        screened_by: profile?.username || "",
      });
    }
    
    setIsModalOpen(true);
  };

  const handleScreeningChange = (field: keyof ScreeningData, value: string) => {
    if (screeningData) {
      setScreeningData({ ...screeningData, [field]: value });
    }
  };

  const saveScreening = async (action: "virtualClinic" | "excluded") => {
    if (!selectedPatient || !screeningData) return;

    setIsSaving(true);
    try {
      // Save or update screening data
      if (screeningData.id) {
        await supabase
          .from("screening_data")
          .update({
            prev_contact: screeningData.prev_contact,
            last_lab: screeningData.last_lab,
            rx_status: screeningData.rx_status,
            residence: screeningData.residence,
            visit_type: screeningData.visit_type,
            appointment_date: screeningData.appointment_date,
            notes: screeningData.notes,
            screened_by: screeningData.screened_by,
          })
          .eq("id", screeningData.id);
      } else {
        await supabase.from("screening_data").insert({
          patient_id: selectedPatient.id,
          prev_contact: screeningData.prev_contact,
          last_lab: screeningData.last_lab,
          rx_status: screeningData.rx_status,
          residence: screeningData.residence,
          visit_type: screeningData.visit_type,
          appointment_date: screeningData.appointment_date,
          notes: screeningData.notes,
          screened_by: screeningData.screened_by,
        });
      }

      // Update patient status
      const updateData: any = { status: action };
      if (action === "excluded") {
        updateData.exclusion_reason = screeningData.notes;
      }

      await supabase
        .from("patients")
        .update(updateData)
        .eq("id", selectedPatient.id);

      toast({
        title: "تم الحفظ",
        description: action === "virtualClinic" 
          ? "تم تحويل المريض للعيادة الافتراضية" 
          : "تم استبعاد المريض",
      });

      setIsModalOpen(false);
      fetchPatients();
    } catch (error) {
      console.error("Error saving screening:", error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getUrgencyBadge = (urgency: string | null) => {
    switch (urgency) {
      case "عالي":
        return <Badge variant="destructive">عالي</Badge>;
      case "متوسط":
        return <Badge className="bg-amber-500 hover:bg-amber-600">متوسط</Badge>;
      case "منخفض":
        return <Badge variant="secondary">منخفض</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const getDiseasesBadges = (patient: Patient) => {
    const badges = [];
    if (patient.has_dm) badges.push(<Badge key="dm" className="bg-primary/80">سكري</Badge>);
    if (patient.has_htn) badges.push(<Badge key="htn" className="bg-accent/80">ضغط</Badge>);
    if (patient.has_dyslipidemia) badges.push(<Badge key="dys" className="bg-muted-foreground/80">دهون</Badge>);
    return badges;
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
              <ClipboardCheck className="text-primary" size={24} />
              <h1 className="text-lg font-bold">الفرز الأولي</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {filteredPatients.length} مريض
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
              placeholder="البحث بالاسم أو رقم الهوية أو الجوال..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-muted-foreground" />
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="عالي">عالي</SelectItem>
                <SelectItem value="متوسط">متوسط</SelectItem>
                <SelectItem value="منخفض">منخفض</SelectItem>
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
                  <ClipboardCheck size={48} className="mx-auto mb-4 opacity-50" />
                  <p>لا يوجد مرضى في قائمة الفرز</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المريض</TableHead>
                        <TableHead className="text-right">الأمراض</TableHead>
                        <TableHead className="text-right">العبء</TableHead>
                        <TableHead className="text-right">الأولوية</TableHead>
                        <TableHead className="text-right">الموعد القادم</TableHead>
                        <TableHead className="text-right">الإجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPatients.map((patient) => (
                        <TableRow key={patient.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{patient.name}</p>
                              <p className="text-xs text-muted-foreground">{patient.national_id}</p>
                              {patient.phone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone size={12} /> {patient.phone}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {getDiseasesBadges(patient)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{patient.burden || "-"}</span>
                          </TableCell>
                          <TableCell>
                            {getUrgencyBadge(patient.urgency_status)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {patient.visit_window_text && (
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} className="text-muted-foreground" />
                                  <span>{patient.visit_window_text}</span>
                                </div>
                              )}
                              {patient.days_until_visit !== null && (
                                <p className={`text-xs ${patient.days_until_visit < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                  {patient.days_until_visit < 0 
                                    ? `متأخر ${Math.abs(patient.days_until_visit)} يوم`
                                    : `خلال ${patient.days_until_visit} يوم`
                                  }
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => openScreeningModal(patient)}
                            >
                              <ClipboardCheck size={16} className="ml-1" />
                              فرز
                            </Button>
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

      {/* Screening Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="text-primary" />
              نموذج الفرز الأولي
            </DialogTitle>
          </DialogHeader>

          {selectedPatient && screeningData && (
            <div className="space-y-6">
              {/* Patient Info */}
              <Card className="bg-secondary/30">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">الاسم</p>
                      <p className="font-medium">{selectedPatient.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">رقم الهوية</p>
                      <p className="font-medium">{selectedPatient.national_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">العمر</p>
                      <p className="font-medium">{selectedPatient.age || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">الجوال</p>
                      <p className="font-medium">{selectedPatient.phone || "-"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {getDiseasesBadges(selectedPatient)}
                    {getUrgencyBadge(selectedPatient.urgency_status)}
                  </div>
                </CardContent>
              </Card>

              {/* Screening Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>التواصل السابق</Label>
                  <Select
                    value={screeningData.prev_contact}
                    onValueChange={(v) => handleScreeningChange("prev_contact", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="لا يوجد">لا يوجد</SelectItem>
                      <SelectItem value="تم التواصل">تم التواصل</SelectItem>
                      <SelectItem value="لا يرد">لا يرد</SelectItem>
                      <SelectItem value="رقم خاطئ">رقم خاطئ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>آخر تحليل</Label>
                  <Select
                    value={screeningData.last_lab}
                    onValueChange={(v) => handleScreeningChange("last_lab", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="أقل من 3 أشهر">أقل من 3 أشهر</SelectItem>
                      <SelectItem value="3-6 أشهر">3-6 أشهر</SelectItem>
                      <SelectItem value="أكثر من 6 أشهر">أكثر من 6 أشهر</SelectItem>
                      <SelectItem value="لا يوجد">لا يوجد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>حالة الوصفة</Label>
                  <Select
                    value={screeningData.rx_status}
                    onValueChange={(v) => handleScreeningChange("rx_status", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="فعالة">فعالة</SelectItem>
                      <SelectItem value="منتهية">منتهية</SelectItem>
                      <SelectItem value="تحتاج تجديد">تحتاج تجديد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>الإقامة</Label>
                  <Select
                    value={screeningData.residence}
                    onValueChange={(v) => handleScreeningChange("residence", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="داخل النطاق">داخل النطاق</SelectItem>
                      <SelectItem value="خارج النطاق">خارج النطاق</SelectItem>
                      <SelectItem value="سفر">سفر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>نوع الزيارة</Label>
                  <Select
                    value={screeningData.visit_type}
                    onValueChange={(v) => handleScreeningChange("visit_type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="حضوري">حضوري</SelectItem>
                      <SelectItem value="افتراضي">افتراضي</SelectItem>
                      <SelectItem value="هاتفي">هاتفي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>تاريخ الموعد</Label>
                  <Input
                    type="date"
                    value={screeningData.appointment_date || ""}
                    onChange={(e) => handleScreeningChange("appointment_date", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={screeningData.notes}
                  onChange={(e) => handleScreeningChange("notes", e.target.value)}
                  placeholder="أضف أي ملاحظات إضافية..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className="flex-1"
                  onClick={() => saveScreening("virtualClinic")}
                  disabled={isSaving}
                >
                  <Stethoscope size={18} className="ml-2" />
                  تحويل للعيادة الافتراضية
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => saveScreening("excluded")}
                  disabled={isSaving}
                >
                  <XCircle size={18} className="ml-2" />
                  استبعاد
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Screening;
