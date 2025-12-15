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
  national_number?: string;
  full_name_ar?: string;
  age?: number;
  gender?: string;
  IsDiabetic?: string;
  IsHypertensive?: string;
  IsDyslipidemic?: string;
  Burden_Category?: string;
  LIVE_days_until_visit?: number;
  urgency_status?: string;
  Team?: string;
  Preferred_Doctor?: string;
  Preferred_Center?: string;
  predicted_visit_date?: string;
  chronic_medications_list?: string;
}

interface ImportResult {
  national_id: string;
  name: string;
  status: "inserted" | "updated" | "failed";
  error?: string;
}

const ExcelImport = () => {
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

  const convertYesNo = (value: string | undefined): boolean => {
    if (!value) return false;
    const normalized = value.toString().toLowerCase().trim();
    return normalized === "yes" || normalized === "نعم" || normalized === "1" || normalized === "true";
  };

  const convertBurden = (value: string | undefined): string | null => {
    if (!value) return null;
    const normalized = value.toString().toLowerCase().trim();
    if (normalized.includes("high") || normalized === "عالي") return "عالي";
    if (normalized.includes("moderate") || normalized === "متوسط") return "متوسط";
    if (normalized.includes("low") || normalized === "منخفض") return "منخفض";
    return null; // Return null for unrecognized values to avoid constraint violation
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
      const nationalId = row.national_number?.toString().trim();
      const name = row.full_name_ar?.toString().trim() || "";

      if (!nationalId) {
        importResults.push({
          national_id: nationalId || "غير معروف",
          name,
          status: "failed",
          error: "رقم الهوية مطلوب",
        });
        setProgress(Math.round(((i + 1) / totalRows) * 100));
        continue;
      }

      try {
        // Check if patient exists
        const { data: existingPatient } = await supabase
          .from("patients")
          .select("id")
          .eq("national_id", nationalId)
          .maybeSingle();

        const patientData = {
          national_id: nationalId,
          name,
          age: row.age ? Number(row.age) : null,
          gender: row.gender?.toString().trim() || null,
          has_dm: convertYesNo(row.IsDiabetic),
          has_htn: convertYesNo(row.IsHypertensive),
          has_dyslipidemia: convertYesNo(row.IsDyslipidemic),
          burden: convertBurden(row.Burden_Category),
          days_until_visit: row.LIVE_days_until_visit ? Number(row.LIVE_days_until_visit) : null,
          urgency_status: row.urgency_status?.toString().trim() || null,
          team: row.Team?.toString().trim() || null,
          doctor: row.Preferred_Doctor?.toString().trim() || null,
          center_id: row.Preferred_Center?.toString().trim() || "",
          predicted_visit_date: row.predicted_visit_date ? new Date(row.predicted_visit_date).toISOString().split("T")[0] : null,
          status: "pending",
        };

        let patientId: string;
        let isUpdate = false;

        if (existingPatient) {
          // Update existing patient
          const { error: updateError } = await supabase
            .from("patients")
            .update(patientData)
            .eq("id", existingPatient.id);

          if (updateError) throw updateError;
          patientId = existingPatient.id;
          isUpdate = true;
        } else {
          // Insert new patient
          const { data: newPatient, error: insertError } = await supabase
            .from("patients")
            .insert(patientData)
            .select("id")
            .single();

          if (insertError) throw insertError;
          patientId = newPatient.id;
        }

        // Handle medications
        if (row.chronic_medications_list && row.chronic_medications_list.toString().trim()) {
          const medications = row.chronic_medications_list
            .toString()
            .split(";")
            .map((med) => med.trim())
            .filter((med) => med.length > 0);

          if (medications.length > 0) {
            // Delete existing medications for this patient
            await supabase
              .from("medications")
              .delete()
              .eq("patient_id", patientId);

            // Insert new medications
            const medicationRecords = medications.map((name) => ({
              patient_id: patientId,
              name,
            }));

            const { error: medError } = await supabase
              .from("medications")
              .insert(medicationRecords);

            if (medError) {
              console.error("Medication insert error:", medError);
            }
          }
        }

        importResults.push({
          national_id: nationalId,
          name,
          status: isUpdate ? "updated" : "inserted",
        });
      } catch (error: any) {
        console.error("Import error for row:", row, error);
        importResults.push({
          national_id: nationalId,
          name,
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
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet size={20} />
          استيراد بيانات المرضى
        </CardTitle>
        <CardDescription>
          رفع ملف Excel (.xlsx) لاستيراد بيانات المرضى
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-lg border-muted-foreground/25 hover:border-primary/50 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="excel-upload"
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
            <ScrollArea className="h-[300px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الهوية</TableHead>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">العمر</TableHead>
                    <TableHead className="text-right">المركز</TableHead>
                    <TableHead className="text-right">الأدوية</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">
                        {row.national_number || "-"}
                      </TableCell>
                      <TableCell>{row.full_name_ar || "-"}</TableCell>
                      <TableCell>{row.age || "-"}</TableCell>
                      <TableCell>{row.Preferred_Center || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {row.chronic_medications_list || "-"}
                      </TableCell>
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
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <CheckCircle className="mx-auto mb-2 text-green-500" size={24} />
                <p className="text-2xl font-bold text-green-600">{insertedCount}</p>
                <p className="text-sm text-muted-foreground">تم الإدراج</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                <AlertCircle className="mx-auto mb-2 text-blue-500" size={24} />
                <p className="text-2xl font-bold text-blue-600">{updatedCount}</p>
                <p className="text-sm text-muted-foreground">تم التحديث</p>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                <XCircle className="mx-auto mb-2 text-red-500" size={24} />
                <p className="text-2xl font-bold text-red-600">{failedCount}</p>
                <p className="text-sm text-muted-foreground">فشل</p>
              </div>
            </div>

            {/* Failed Records Details */}
            {failedCount > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">السجلات الفاشلة:</h4>
                <ScrollArea className="h-[200px] rounded-md border border-destructive/20">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم الهوية</TableHead>
                        <TableHead className="text-right">الاسم</TableHead>
                        <TableHead className="text-right">سبب الفشل</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results
                        .filter((r) => r.status === "failed")
                        .map((result, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm">
                              {result.national_id}
                            </TableCell>
                            <TableCell>{result.name}</TableCell>
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

export default ExcelImport;
