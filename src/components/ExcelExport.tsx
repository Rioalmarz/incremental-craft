import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";

const ExcelExport = () => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Build query
      let query = supabase
        .from("patients")
        .select(`
          *,
          medications (name, dosage, compliance_percent),
          screening_data (*)
        `);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: patients, error } = await query;

      if (error) throw error;

      if (!patients || patients.length === 0) {
        toast({
          title: "لا توجد بيانات",
          description: "لا توجد سجلات للتصدير",
          variant: "destructive",
        });
        setIsExporting(false);
        return;
      }

      // Transform data for Excel
      const exportData = patients.map((patient) => {
        const medications = patient.medications?.map((m: any) => m.name).join("; ") || "";
        const screening = patient.screening_data?.[0] as any;

        return {
          "رقم الهوية": patient.national_id,
          "الاسم": patient.name,
          "العمر": patient.age,
          "الجنس": patient.gender,
          "رقم الجوال": patient.phone,
          "المركز": patient.center_id,
          "الفريق": patient.team,
          "الطبيب": patient.doctor,
          "السكري": patient.has_dm ? "نعم" : "لا",
          "الضغط": patient.has_htn ? "نعم" : "لا",
          "الدهون": patient.has_dyslipidemia ? "نعم" : "لا",
          "العبء": patient.burden,
          "أيام حتى الزيارة": patient.days_until_visit,
          "نافذة الزيارة": patient.visit_window_text,
          "تاريخ الزيارة المتوقع": patient.predicted_visit_date,
          "حالة الاستعجال": patient.urgency_status,
          "الحالة": patient.status,
          "الإجراء": patient.action,
          "سبب الاستبعاد": patient.exclusion_reason,
          "الأدوية": medications,
          // Screening data
          "التواصل السابق": screening?.prev_contact || "",
          "آخر تحليل": screening?.last_lab || "",
          "حالة الوصفة": screening?.rx_status || "",
          "السكن": screening?.residence || "",
          "نوع الزيارة": screening?.visit_type || "",
          "تاريخ الموعد": screening?.appointment_date || "",
          "ملاحظات": screening?.notes || "",
          "تاريخ الفرز": screening?.screened_at || "",
          "تم الفرز بواسطة": screening?.screened_by || "",
        };
      });

      // Create workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "المرضى");

      // Generate filename with date
      const date = new Date().toISOString().split("T")[0];
      const statusLabel = statusFilter === "all" ? "الكل" : statusFilter;
      const filename = `تصدير_المرضى_${statusLabel}_${date}.xlsx`;

      // Download
      XLSX.writeFile(workbook, filename);

      toast({
        title: "تم التصدير",
        description: `تم تصدير ${patients.length} سجل بنجاح`,
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في تصدير البيانات",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download size={20} />
          تصدير بيانات المرضى
        </CardTitle>
        <CardDescription>
          تصدير بيانات المرضى إلى ملف Excel (.xlsx)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>تصفية حسب الحالة</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="virtualClinic">العيادة الافتراضية</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="excluded">مستبعد</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="animate-spin ml-2" size={18} />
              جاري التصدير...
            </>
          ) : (
            <>
              <FileSpreadsheet size={18} className="ml-2" />
              تصدير إلى Excel
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExcelExport;
