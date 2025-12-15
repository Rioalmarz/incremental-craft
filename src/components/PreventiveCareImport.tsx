import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExcelRow {
  patient_id?: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
  service_id?: string;
  service_code?: string;
  service_name_ar?: string;
  status?: string;
  priority?: string;
  due_date?: string | number;
  last_completed_date?: string | number;
}

interface ImportResult {
  patient_id: string;
  service_id: string;
  status: "inserted" | "updated" | "failed";
  error?: string;
}

interface PreventiveCareImportProps {
  onImportComplete?: () => void;
}

const PreventiveCareImport = ({ onImportComplete }: PreventiveCareImportProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ExcelRow[]>([]);
  const [allData, setAllData] = useState<ExcelRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف Excel (.xlsx أو .xls)",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setResults([]);
    setShowResults(false);
    parseExcel(selectedFile);
  };

  const parseExcel = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(sheet);
      
      setAllData(jsonData);
      setPreviewData(jsonData.slice(0, 20));
    };
    reader.readAsBinaryString(file);
  };

  const convertStatus = (value: string | undefined): string => {
    if (!value) return "pending";
    const normalized = value.toString().toLowerCase().trim();
    if (normalized === "completed" || normalized === "مكتمل") return "completed";
    if (normalized === "scheduled" || normalized === "مجدول") return "scheduled";
    if (normalized === "declined" || normalized === "مرفوض") return "declined";
    return "pending";
  };

  const convertPriority = (value: string | undefined): string => {
    if (!value) return "medium";
    const normalized = value.toString().toLowerCase().trim();
    if (normalized === "high" || normalized === "عالي" || normalized === "عالية") return "high";
    if (normalized === "low" || normalized === "منخفض" || normalized === "منخفضة") return "low";
    return "medium";
  };

  const convertGender = (value: string | undefined): string => {
    if (!value) return "male";
    const normalized = value.toString().toLowerCase().trim();
    if (normalized === "female" || normalized === "أنثى" || normalized === "انثى") return "female";
    return "male";
  };

  // Convert Excel serial number or string to date string (YYYY-MM-DD)
  const convertDate = (value: string | number | undefined): string | null => {
    if (!value) return null;
    
    // If it's a number (Excel serial)
    if (typeof value === "number") {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      return date.toISOString().split("T")[0];
    }
    
    // If it's already a string date
    const strValue = value.toString().trim();
    if (strValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return strValue;
    }
    
    // Try parsing as date
    const parsed = new Date(strValue);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
    
    return null;
  };

  const handleImport = async () => {
    if (allData.length === 0) {
      toast({
        title: "خطأ",
        description: "لا توجد بيانات للاستيراد",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setResults([]);
    setShowResults(false);

    const importResults: ImportResult[] = [];
    const totalRows = allData.length;

    for (let i = 0; i < totalRows; i++) {
      const row = allData[i];
      const patientId = row.patient_id?.toString().trim();
      const serviceId = row.service_id?.toString().trim();

      if (!patientId || !serviceId) {
        importResults.push({
          patient_id: patientId || "غير معروف",
          service_id: serviceId || "غير معروف",
          status: "failed",
          error: "رقم المريض ومعرف الخدمة مطلوبان",
        });
        setProgress(Math.round(((i + 1) / totalRows) * 100));
        continue;
      }

      try {
        const eligibilityData = {
          patient_id: patientId,
          patient_name: row.patient_name?.toString().trim() || "",
          patient_age: row.patient_age ? Number(row.patient_age) : 0,
          patient_gender: convertGender(row.patient_gender),
          service_id: serviceId,
          service_code: row.service_code?.toString().trim() || serviceId,
          service_name_ar: row.service_name_ar?.toString().trim() || "",
          is_eligible: true,
          status: convertStatus(row.status),
          priority: convertPriority(row.priority),
          due_date: convertDate(row.due_date),
          last_completed_date: convertDate(row.last_completed_date),
        };

        // Check if record exists
        const { data: existing } = await supabase
          .from("patient_eligibility")
          .select("id")
          .eq("patient_id", patientId)
          .eq("service_id", serviceId)
          .maybeSingle();

        let isUpdate = false;

        if (existing) {
          const { error: updateError } = await supabase
            .from("patient_eligibility")
            .update(eligibilityData)
            .eq("id", existing.id);

          if (updateError) throw updateError;
          isUpdate = true;
        } else {
          const { error: insertError } = await supabase
            .from("patient_eligibility")
            .insert(eligibilityData);

          if (insertError) throw insertError;
        }

        importResults.push({
          patient_id: patientId,
          service_id: serviceId,
          status: isUpdate ? "updated" : "inserted",
        });
      } catch (error: any) {
        console.error("Import error for row:", row, error);
        importResults.push({
          patient_id: patientId,
          service_id: serviceId,
          status: "failed",
          error: error.message || "خطأ غير معروف",
        });
      }

      setProgress(Math.round(((i + 1) / totalRows) * 100));
    }

    setResults(importResults);
    setShowResults(true);
    setIsImporting(false);

    const inserted = importResults.filter((r) => r.status === "inserted").length;
    const updated = importResults.filter((r) => r.status === "updated").length;
    const failed = importResults.filter((r) => r.status === "failed").length;

    toast({
      title: "تم الانتهاء من الاستيراد",
      description: `تم إدراج ${inserted} | تم تحديث ${updated} | فشل ${failed}`,
    });

    if (onImportComplete) {
      onImportComplete();
    }
  };

  const resetImport = () => {
    setFile(null);
    setPreviewData([]);
    setAllData([]);
    setResults([]);
    setShowResults(false);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const insertedCount = results.filter((r) => r.status === "inserted").length;
  const updatedCount = results.filter((r) => r.status === "updated").length;
  const failedCount = results.filter((r) => r.status === "failed").length;

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileSpreadsheet size={20} />
          استيراد بيانات الرعاية الوقائية
        </CardTitle>
        <CardDescription>
          رفع ملف Excel (.xlsx) لاستيراد حالات الخدمات الوقائية للمرضى
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Expected Columns Info */}
        <div className="p-3 bg-muted/50 rounded-lg text-sm">
          <p className="font-medium mb-2">الأعمدة المطلوبة في ملف Excel:</p>
          <div className="grid grid-cols-2 gap-2 text-muted-foreground text-xs">
            <span>• patient_id (رقم الهوية)</span>
            <span>• patient_name (اسم المريض)</span>
            <span>• patient_age (العمر)</span>
            <span>• patient_gender (الجنس)</span>
            <span>• service_id (معرف الخدمة)</span>
            <span>• service_code (كود الخدمة)</span>
            <span>• service_name_ar (اسم الخدمة)</span>
            <span>• status (الحالة)</span>
            <span>• priority (الأولوية)</span>
            <span>• due_date (تاريخ الاستحقاق)</span>
            <span>• last_completed_date (آخر إكمال)</span>
          </div>
        </div>

        {/* File Upload */}
        <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-lg border-muted-foreground/25 hover:border-primary/50 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="preventive-excel-upload"
          />
          <Upload size={40} className="text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {file ? file.name : "اختر ملف Excel أو اسحبه هنا"}
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              اختيار ملف
            </Button>
          </div>
        </div>

        {/* Preview Table */}
        {previewData.length > 0 && !showResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                معاينة البيانات (أول 20 صف من {allData.length})
              </h3>
              <Button variant="ghost" size="sm" onClick={resetImport}>
                إلغاء
              </Button>
            </div>
            <ScrollArea className="h-[250px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم المريض</TableHead>
                    <TableHead className="text-right">اسم المريض</TableHead>
                    <TableHead className="text-right">الخدمة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">
                        {row.patient_id || "-"}
                      </TableCell>
                      <TableCell>{row.patient_name || "-"}</TableCell>
                      <TableCell>{row.service_name_ar || row.service_id || "-"}</TableCell>
                      <TableCell>{row.status || "pending"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Import Button */}
            <div className="space-y-2">
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>جاري الاستيراد...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="w-full"
                size="lg"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="animate-spin ml-2" size={18} />
                    جاري الاستيراد...
                  </>
                ) : (
                  <>
                    <Upload size={18} className="ml-2" />
                    استيراد {allData.length} سجل
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">نتائج الاستيراد</h3>
              <Button variant="outline" size="sm" onClick={resetImport}>
                استيراد ملف جديد
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-center">
                <CheckCircle className="mx-auto mb-2 text-success" size={24} />
                <p className="text-2xl font-bold text-success">{insertedCount}</p>
                <p className="text-sm text-muted-foreground">تم الإدراج</p>
              </div>
              <div className="p-4 rounded-lg bg-info/10 border border-info/20 text-center">
                <AlertCircle className="mx-auto mb-2 text-info" size={24} />
                <p className="text-2xl font-bold text-info">{updatedCount}</p>
                <p className="text-sm text-muted-foreground">تم التحديث</p>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                <XCircle className="mx-auto mb-2 text-destructive" size={24} />
                <p className="text-2xl font-bold text-destructive">{failedCount}</p>
                <p className="text-sm text-muted-foreground">فشل</p>
              </div>
            </div>

            {/* Failed Records Details */}
            {failedCount > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">السجلات الفاشلة:</h4>
                <ScrollArea className="h-[150px] rounded-md border border-destructive/20">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم المريض</TableHead>
                        <TableHead className="text-right">معرف الخدمة</TableHead>
                        <TableHead className="text-right">سبب الفشل</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results
                        .filter((r) => r.status === "failed")
                        .map((result, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm">
                              {result.patient_id}
                            </TableCell>
                            <TableCell>{result.service_id}</TableCell>
                            <TableCell className="text-destructive">
                              {result.error}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PreventiveCareImport;
