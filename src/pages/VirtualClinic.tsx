import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Stethoscope,
  ChevronRight,
  ChevronLeft,
  Phone,
  Calendar,
  Pill,
  AlertTriangle,
  FlaskConical,
  CalendarCheck,
  ArrowRightLeft,
  CheckCircle,
  FileText,
  Shield,
  Activity,
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
  created_at: string;
}

interface Medication {
  id: string;
  patient_id: string;
  name: string;
  dosage: string | null;
  compliance_percent: number | null;
  prediction_accuracy: number | null;
}

interface ScreeningData {
  id: string;
  patient_id: string;
  referral_reason: string | null;
}

interface ClinicData {
  id?: string;
  patient_id: string;
  chest_pain: boolean;
  severe_headache: boolean;
  vision_changes: boolean;
  severe_shortness_of_breath: boolean;
  loss_of_consciousness: boolean;
  severe_hypoglycemia: boolean;
  final_action: string;
  referral_specialty: string;
  notes: string;
  examined_by: string;
}

interface MedicationStatus {
  [medId: string]: boolean; // true = يأخذه, false = لا يأخذه
}

const EMERGENCY_SYMPTOMS = [
  { key: "chest_pain", label: "ألم في الصدر" },
  { key: "severe_headache", label: "صداع شديد" },
  { key: "vision_changes", label: "تغيرات في الرؤية" },
  { key: "severe_shortness_of_breath", label: "ضيق تنفس شديد" },
  { key: "loss_of_consciousness", label: "فقدان الوعي" },
  { key: "severe_hypoglycemia", label: "هبوط سكر حاد" },
];

const FINAL_ACTIONS = [
  { value: "refill_rx", label: "إعادة صرف علاج", icon: Pill },
  { value: "order_labs", label: "طلب تحاليل", icon: FlaskConical },
  { value: "schedule_clinical", label: "تنسيق موعد فحص سريري", icon: CalendarCheck },
  { value: "referral", label: "تحويل لتخصص آخر", icon: ArrowRightLeft },
  { value: "no_intervention", label: "لا يحتاج تدخل", icon: CheckCircle },
];

// Preventive screening recommendations based on Saudi/USPSTF guidelines
const getPreventiveScreenings = (age: number | null, gender: string | null): { name: string; recommendation: string }[] => {
  if (!age) return [];
  
  const screenings: { name: string; recommendation: string }[] = [];
  
  // Fasting glucose for age >= 35
  if (age >= 35) {
    screenings.push({ name: "سكر صائم", recommendation: "العمر ≥ 35" });
  }
  
  // Breast cancer screening for females >= 40
  if (gender === "أنثى" && age >= 40) {
    screenings.push({ name: "فحص سرطان الثدي (ماموجرام)", recommendation: "السعودية Grade A - العمر ≥ 40" });
  }
  
  // Colorectal cancer screening for age >= 45
  if (age >= 45) {
    screenings.push({ name: "فحص سرطان القولون (FIT)", recommendation: "USPSTF Grade A - العمر ≥ 45" });
  }
  
  // PSA for males >= 50
  if (gender === "ذكر" && age >= 50) {
    screenings.push({ name: "فحص PSA (البروستاتا)", recommendation: "USPSTF Grade C - العمر ≥ 50" });
  }
  
  // Pap smear for females 21-65
  if (gender === "أنثى" && age >= 21 && age <= 65) {
    screenings.push({ name: "مسحة عنق الرحم (Pap smear)", recommendation: "USPSTF Grade A" });
  }
  
  // Osteoporosis screening for females >= 65
  if (gender === "أنثى" && age >= 65) {
    screenings.push({ name: "فحص هشاشة العظام", recommendation: "USPSTF Grade B - العمر ≥ 65" });
  }
  
  // Pneumococcal vaccine for age >= 65
  if (age >= 65) {
    screenings.push({ name: "تطعيم المكورات الرئوية", recommendation: "العمر ≥ 65" });
  }
  
  // Herpes Zoster vaccine for age >= 50
  if (age >= 50) {
    screenings.push({ name: "تطعيم الهربس النطاقي (الحزام الناري)", recommendation: "العمر ≥ 50" });
  }
  
  // HPV vaccine for ages 9-26
  if (age >= 9 && age <= 26) {
    screenings.push({ name: "تطعيم فيروس الورم الحليمي (HPV)", recommendation: "العمر 9-26" });
  }
  
  return screenings;
};

const getReferralReasonLabel = (reason: string | null): string => {
  if (!reason) return "غير محدد";
  const labels: { [key: string]: string } = {
    "طلب_تحليل": "طلب تحليل",
    "إعادة_صرف": "إعادة صرف",
    "فحص_وقائي": "فحص وقائي",
    "خدمة_استباقية": "خدمة استباقية",
  };
  return labels[reason] || reason;
};

const VirtualClinic = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");

  // Modal state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationStatus, setMedicationStatus] = useState<MedicationStatus>({});
  const [screeningData, setScreeningData] = useState<ScreeningData | null>(null);
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
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
        .eq("status", "virtualClinic")
        .order("urgency_status", { ascending: false })
        .order("days_until_visit", { ascending: true });

      if (error) throw error;
      setPatients(data || []);
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

  const openClinicModal = async (patient: Patient) => {
    setSelectedPatient(patient);

    // Fetch screening data for referral reason
    const { data: screenData } = await supabase
      .from("screening_data")
      .select("id, patient_id, referral_reason")
      .eq("patient_id", patient.id)
      .maybeSingle();

    setScreeningData(screenData as ScreeningData | null);

    // Fetch medications
    const { data: medsData } = await supabase
      .from("medications")
      .select("*")
      .eq("patient_id", patient.id);

    setMedications(medsData || []);
    
    // Initialize medication status (default to true = يأخذه)
    const initialStatus: MedicationStatus = {};
    (medsData || []).forEach((med: Medication) => {
      initialStatus[med.id] = true;
    });
    setMedicationStatus(initialStatus);

    // Check if clinic data exists
    const { data: existingData } = await supabase
      .from("virtual_clinic_data")
      .select("*")
      .eq("patient_id", patient.id)
      .maybeSingle();

    if (existingData) {
      setClinicData(existingData as ClinicData);
    } else {
      setClinicData({
        patient_id: patient.id,
        chest_pain: false,
        severe_headache: false,
        vision_changes: false,
        severe_shortness_of_breath: false,
        loss_of_consciousness: false,
        severe_hypoglycemia: false,
        final_action: "",
        referral_specialty: "",
        notes: "",
        examined_by: profile?.username || "",
      });
    }

    setIsModalOpen(true);
  };

  const hasEmergencySymptom = () => {
    if (!clinicData) return false;
    return (
      clinicData.chest_pain ||
      clinicData.severe_headache ||
      clinicData.vision_changes ||
      clinicData.severe_shortness_of_breath ||
      clinicData.loss_of_consciousness ||
      clinicData.severe_hypoglycemia
    );
  };

  const handleSymptomChange = (symptom: string, checked: boolean) => {
    if (clinicData) {
      setClinicData({ ...clinicData, [symptom]: checked });
    }
  };

  const handleMedicationStatusChange = (medId: string, taking: boolean) => {
    setMedicationStatus(prev => ({ ...prev, [medId]: taking }));
  };

  const saveClinicData = async () => {
    if (!selectedPatient || !clinicData) return;

    // Check emergency symptoms
    if (hasEmergencySymptom()) {
      toast({
        title: "⚠️ تنبيه طارئ",
        description: "يجب توجيه المستفيد فورًا للطوارئ أو التنسيق العاجل",
        variant: "destructive",
      });
      return;
    }

    if (!clinicData.final_action) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار الإجراء النهائي",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Save or update clinic data
      if (clinicData.id) {
        await supabase
          .from("virtual_clinic_data")
          .update({
            chest_pain: clinicData.chest_pain,
            severe_headache: clinicData.severe_headache,
            vision_changes: clinicData.vision_changes,
            severe_shortness_of_breath: clinicData.severe_shortness_of_breath,
            loss_of_consciousness: clinicData.loss_of_consciousness,
            severe_hypoglycemia: clinicData.severe_hypoglycemia,
            final_action: clinicData.final_action,
            referral_specialty: clinicData.referral_specialty,
            notes: clinicData.notes,
            examined_by: clinicData.examined_by,
            examined_at: new Date().toISOString(),
          })
          .eq("id", clinicData.id);
      } else {
        await supabase.from("virtual_clinic_data").insert({
          patient_id: selectedPatient.id,
          chest_pain: clinicData.chest_pain,
          severe_headache: clinicData.severe_headache,
          vision_changes: clinicData.vision_changes,
          severe_shortness_of_breath: clinicData.severe_shortness_of_breath,
          loss_of_consciousness: clinicData.loss_of_consciousness,
          severe_hypoglycemia: clinicData.severe_hypoglycemia,
          final_action: clinicData.final_action,
          referral_specialty: clinicData.referral_specialty,
          notes: clinicData.notes,
          examined_by: clinicData.examined_by,
        });
      }

      // Update patient status to completed
      await supabase
        .from("patients")
        .update({ 
          status: "completed",
          action: clinicData.final_action 
        })
        .eq("id", selectedPatient.id);

      toast({
        title: "تم الحفظ",
        description: "تم إكمال الحالة ونقلها إلى قائمة المكتملين",
      });

      setIsModalOpen(false);
      fetchPatients();
    } catch (error) {
      console.error("Error saving clinic data:", error);
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

  const hasChronicDisease = (patient: Patient) => {
    return patient.has_dm || patient.has_htn || patient.has_dyslipidemia;
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
              <Stethoscope className="text-primary" size={24} />
              <h1 className="text-lg font-bold">العيادة الافتراضية</h1>
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
                  <Stethoscope size={48} className="mx-auto mb-4 opacity-50" />
                  <p>لا يوجد مستفيدين في قائمة العيادة الافتراضية</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المستفيد</TableHead>
                        <TableHead className="text-right">الأمراض</TableHead>
                        <TableHead className="text-right">سبب التحويل</TableHead>
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
                              {!hasChronicDisease(patient) && (
                                <Badge variant="outline" className="text-xs">لا يوجد</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {getReferralReasonLabel(patient.action)}
                            </Badge>
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
                                <p className={`text-xs ${patient.days_until_visit < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                  {patient.days_until_visit < 0
                                    ? `متأخر ${Math.abs(patient.days_until_visit)} يوم`
                                    : `خلال ${patient.days_until_visit} يوم`}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" onClick={() => openClinicModal(patient)}>
                              <Stethoscope size={16} className="ml-1" />
                              فحص
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

      {/* Virtual Clinic Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="text-primary" />
              نموذج العيادة الافتراضية
            </DialogTitle>
          </DialogHeader>

          {selectedPatient && clinicData && (
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

              {/* Referral Reason from Screening */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="text-primary" size={18} />
                    <h3 className="font-semibold">سبب التحويل من الفرز الأولي</h3>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    {getReferralReasonLabel(screeningData?.referral_reason || selectedPatient.action)}
                  </Badge>
                </CardContent>
              </Card>

              {/* Emergency Symptoms Assessment */}
              <Card className={hasEmergencySymptom() ? "border-destructive bg-destructive/10" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className={hasEmergencySymptom() ? "text-destructive" : "text-muted-foreground"} />
                    <h3 className="font-semibold">تقييم الأعراض الطارئة</h3>
                    {hasEmergencySymptom() && (
                      <Badge variant="destructive">يوجد عرض طارئ!</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {EMERGENCY_SYMPTOMS.map((symptom) => (
                      <div key={symptom.key} className="flex items-center gap-2">
                        <Switch
                          id={symptom.key}
                          checked={clinicData[symptom.key as keyof ClinicData] as boolean}
                          onCheckedChange={(checked) =>
                            handleSymptomChange(symptom.key, checked)
                          }
                        />
                        <Label htmlFor={symptom.key} className="text-sm cursor-pointer">
                          {symptom.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {hasEmergencySymptom() && (
                    <div className="mt-4 p-3 bg-destructive/20 rounded-lg text-destructive text-sm">
                      ⚠️ تنبيه: في حال اختيار أي عرض طارئ، يجب توجيه المستفيد فورًا للطوارئ أو التنسيق العاجل
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Medications - Simple Takes/Doesn't Take */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Pill className="text-primary" />
                    <h3 className="font-semibold">الأدوية المتوقعة</h3>
                  </div>
                  {medications.length === 0 ? (
                    <p className="text-muted-foreground text-sm">لا توجد أدوية مسجلة</p>
                  ) : (
                    <div className="space-y-3">
                      {medications.map((med) => (
                        <div key={med.id} className="flex items-center justify-between border rounded-lg p-3">
                          <div className="flex-1">
                            <p className="font-medium">{med.name}</p>
                            {med.dosage && (
                              <p className="text-xs text-muted-foreground">{med.dosage}</p>
                            )}
                            {med.prediction_accuracy !== null && (
                              <div className="flex items-center gap-1 mt-1">
                                <Activity size={12} className="text-primary" />
                                <span className="text-xs text-primary">
                                  دقة التنبؤ: {med.prediction_accuracy}%
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleMedicationStatusChange(med.id, true)}
                              className={`px-3 py-1 rounded-full text-sm transition-all ${
                                medicationStatus[med.id] === true
                                  ? "bg-green-500 text-white"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              يأخذه
                            </button>
                            <button
                              onClick={() => handleMedicationStatusChange(med.id, false)}
                              className={`px-3 py-1 rounded-full text-sm transition-all ${
                                medicationStatus[med.id] === false
                                  ? "bg-destructive text-white"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              لا يأخذه
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Preventive Screening Recommendations - Only for patients without chronic diseases */}
              {!hasChronicDisease(selectedPatient) && (
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="text-green-600" />
                      <h3 className="font-semibold text-green-700">الفحوصات الوقائية المقترحة</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      بناءً على إرشادات وزارة الصحة السعودية و USPSTF
                    </p>
                    {getPreventiveScreenings(selectedPatient.age, selectedPatient.gender).length === 0 ? (
                      <p className="text-muted-foreground text-sm">لا توجد فحوصات مقترحة حاليًا</p>
                    ) : (
                      <div className="space-y-2">
                        {getPreventiveScreenings(selectedPatient.age, selectedPatient.gender).map((screening, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 bg-background/50 rounded">
                            <CheckCircle size={16} className="text-green-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-sm">{screening.name}</p>
                              <p className="text-xs text-muted-foreground">{screening.recommendation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Final Action */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">الإجراء النهائي</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {FINAL_ACTIONS.map((action) => {
                      const Icon = action.icon;
                      const isSelected = clinicData.final_action === action.value;
                      return (
                        <button
                          key={action.value}
                          onClick={() =>
                            setClinicData({ ...clinicData, final_action: action.value })
                          }
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }`}
                        >
                          <Icon size={20} />
                          <span>{action.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {clinicData.final_action === "referral" && (
                    <div className="mt-4">
                      <Label>التخصص المحول إليه</Label>
                      <Input
                        value={clinicData.referral_specialty}
                        onChange={(e) =>
                          setClinicData({ ...clinicData, referral_specialty: e.target.value })
                        }
                        placeholder="مثال: القلب، الكلى، العيون..."
                        className="mt-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={clinicData.notes}
                  onChange={(e) => setClinicData({ ...clinicData, notes: e.target.value })}
                  placeholder="أضف أي ملاحظات إضافية..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className="flex-1"
                  onClick={saveClinicData}
                  disabled={isSaving || hasEmergencySymptom()}
                >
                  <CheckCircle size={18} className="ml-2" />
                  إكمال الحالة
                </Button>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VirtualClinic;
