import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Loader2, CheckCircle, XCircle, AlertCircle, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  mapExcelColumns, 
  getAvailableFields, 
  transformValue,
  ColumnMapping 
} from "@/lib/smartColumnMapper";
import { CustomFieldManager } from "@/components/CustomFieldManager";

interface SmartExcelImportProps {
  importType: "patients" | "preventive";
  onImportComplete?: () => void;
}

interface ImportResult {
  identifier: string;
  name: string;
  status: "inserted" | "updated" | "failed";
  error?: string;
}

type Step = "upload" | "mapping" | "preview" | "importing" | "results";

const SmartExcelImport = ({ importType, onImportComplete }: SmartExcelImportProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [rawData, setRawData] = useState<Record<string, any>[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [fieldsVersion, setFieldsVersion] = useState(0);

  const availableFields = getAvailableFields(importType);
  
  // Callback when custom fields are updated
  const handleFieldsUpdated = useCallback(() => {
    setFieldsVersion(v => v + 1);
    // Re-map columns if we have data
    if (excelColumns.length > 0) {
      const newMappings = mapExcelColumns(excelColumns, importType);
      setColumnMappings(newMappings);
    }
  }, [excelColumns, importType]);

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
    parseExcel(selectedFile);
  };

  const parseExcel = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
      
      if (jsonData.length === 0) {
        toast({
          title: "خطأ",
          description: "الملف فارغ",
          variant: "destructive",
        });
        return;
      }

      const columns = Object.keys(jsonData[0]);
      setExcelColumns(columns);
      setRawData(jsonData);
      
      // Auto-map columns
      const mappings = mapExcelColumns(columns, importType);
      setColumnMappings(mappings);
      setStep("mapping");
    };
    reader.readAsBinaryString(file);
  };

  const updateMapping = (excelColumn: string, newDbField: string) => {
    setColumnMappings((prev) =>
      prev.map((m) =>
        m.excelColumn === excelColumn
          ? {
              ...m,
              dbField: newDbField || null,
              displayName: availableFields.find((f) => f.value === newDbField)?.label || "-",
              confidence: newDbField ? "high" : "none",
            }
          : m
      )
    );
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "high":
        return <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">تلقائي ✓</Badge>;
      case "medium":
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">محتمل</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-orange-500/20 text-orange-600 border-orange-500/30">ضعيف</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">تجاهل</Badge>;
    }
  };

  const validateMappings = (): boolean => {
    const requiredFields = importType === "patients" 
      ? ["national_id", "name"]
      : ["patient_id", "patient_name", "patient_age", "patient_gender", "service_id", "service_code", "service_name_ar", "priority"];
    
    const mappedFields = columnMappings.filter((m) => m.dbField).map((m) => m.dbField);
    const missingRequired = requiredFields.filter((f) => !mappedFields.includes(f));
    
    if (missingRequired.length > 0) {
      toast({
        title: "حقول مطلوبة مفقودة",
        description: `يرجى ربط الحقول التالية: ${missingRequired.map(f => 
          availableFields.find(af => af.value === f)?.label || f
        ).join(", ")}`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleImport = async () => {
    if (!validateMappings()) return;

    setStep("importing");
    setIsImporting(true);
    setProgress(0);
    setResults([]);

    const importResults: ImportResult[] = [];
    const totalRows = rawData.length;

    // Create mapping lookup
    const fieldLookup: Record<string, string> = {};
    columnMappings.forEach((m) => {
      if (m.dbField) {
        fieldLookup[m.excelColumn] = m.dbField;
      }
    });

    for (let i = 0; i < totalRows; i++) {
      const row = rawData[i];
      
      // Transform row data according to mappings
      const transformedData: Record<string, any> = {};
      let medications: string[] = [];
      
      for (const [excelCol, value] of Object.entries(row)) {
        const dbField = fieldLookup[excelCol];
        if (dbField) {
          if (dbField === "medications") {
            // Handle medications separately
            if (value && String(value).trim()) {
              medications = String(value)
                .split(";")
                .map((med) => med.trim())
                .filter((med) => med.length > 0);
            }
          } else {
            transformedData[dbField] = transformValue(value, dbField);
          }
        }
      }

      try {
        if (importType === "patients") {
          await importPatient(transformedData, medications, importResults);
        } else {
          await importPreventiveCare(transformedData, importResults);
        }
      } catch (error: any) {
        const identifier = transformedData.national_id || transformedData.patient_id || "غير معروف";
        const name = transformedData.name || transformedData.patient_name || "";
        importResults.push({
          identifier,
          name,
          status: "failed",
          error: error.message || "خطأ غير معروف",
        });
      }

      setProgress(Math.round(((i + 1) / totalRows) * 100));
    }

    setResults(importResults);
    setIsImporting(false);
    setStep("results");

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

  const importPatient = async (
    data: Record<string, any>,
    medications: string[],
    results: ImportResult[]
  ) => {
    const nationalId = data.national_id?.toString().trim();
    const name = data.name?.toString().trim() || "";

    if (!nationalId) {
      results.push({
        identifier: nationalId || "غير معروف",
        name,
        status: "failed",
        error: "رقم الهوية مطلوب",
      });
      return;
    }

    const { data: existingPatient } = await supabase
      .from("patients")
      .select("id")
      .eq("national_id", nationalId)
      .maybeSingle();

    const patientData = {
      national_id: nationalId,
      name,
      age: data.age,
      gender: data.gender,
      has_dm: data.has_dm ?? false,
      has_htn: data.has_htn ?? false,
      has_dyslipidemia: data.has_dyslipidemia ?? false,
      burden: data.burden,
      days_until_visit: data.days_until_visit,
      urgency_status: data.urgency_status,
      team: data.team,
      doctor: data.doctor,
      center_id: data.center_id || "",
      predicted_visit_date: data.predicted_visit_date,
      status: "pending",
    };

    let patientId: string;
    let isUpdate = false;

    if (existingPatient) {
      const { error: updateError } = await supabase
        .from("patients")
        .update(patientData)
        .eq("id", existingPatient.id);

      if (updateError) throw updateError;
      patientId = existingPatient.id;
      isUpdate = true;
    } else {
      const { data: newPatient, error: insertError } = await supabase
        .from("patients")
        .insert(patientData)
        .select("id")
        .single();

      if (insertError) throw insertError;
      patientId = newPatient.id;
    }

    // Handle medications
    if (medications.length > 0) {
      await supabase.from("medications").delete().eq("patient_id", patientId);

      const medicationRecords = medications.map((medName) => ({
        patient_id: patientId,
        name: medName,
      }));

      await supabase.from("medications").insert(medicationRecords);
    }

    results.push({
      identifier: nationalId,
      name,
      status: isUpdate ? "updated" : "inserted",
    });
  };

  const importPreventiveCare = async (
    data: Record<string, any>,
    results: ImportResult[]
  ) => {
    const patientId = data.patient_id?.toString().trim();
    const patientName = data.patient_name?.toString().trim() || "";
    const serviceId = data.service_id?.toString().trim();

    if (!patientId || !serviceId) {
      results.push({
        identifier: patientId || "غير معروف",
        name: patientName,
        status: "failed",
        error: "رقم المريض ورمز الخدمة مطلوبان",
      });
      return;
    }

    const eligibilityData = {
      patient_id: patientId,
      patient_name: patientName,
      patient_age: data.patient_age || 0,
      patient_gender: data.patient_gender || "غير محدد",
      service_id: serviceId,
      service_code: data.service_code || serviceId,
      service_name_ar: data.service_name_ar || "",
      priority: data.priority || "متوسطة",
      status: data.status || "pending",
      due_date: data.due_date,
      last_completed_date: data.last_completed_date,
      is_eligible: data.is_eligible ?? true,
    };

    const { data: existing } = await supabase
      .from("patient_eligibility")
      .select("id")
      .eq("patient_id", patientId)
      .eq("service_id", serviceId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("patient_eligibility")
        .update(eligibilityData)
        .eq("id", existing.id);

      if (error) throw error;

      results.push({
        identifier: patientId,
        name: patientName,
        status: "updated",
      });
    } else {
      const { error } = await supabase
        .from("patient_eligibility")
        .insert(eligibilityData);

      if (error) throw error;

      results.push({
        identifier: patientId,
        name: patientName,
        status: "inserted",
      });
    }
  };

  const resetImport = () => {
    setStep("upload");
    setFile(null);
    setExcelColumns([]);
    setColumnMappings([]);
    setRawData([]);
    setResults([]);
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
          {importType === "patients" ? "استيراد بيانات المرضى" : "استيراد بيانات الرعاية الوقائية"}
        </CardTitle>
        <CardDescription>
          رفع ملف Excel (.xlsx) - النظام يستنتج الأعمدة تلقائياً
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Upload */}
        {step === "upload" && (
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
                اختر ملف Excel أو اسحبه هنا
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                اختيار ملف
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Mapping */}
        {step === "mapping" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="text-primary" size={18} />
                <h3 className="font-semibold">ربط الأعمدة (تم الاستنتاج التلقائي)</h3>
              </div>
              <div className="flex items-center gap-2">
                <CustomFieldManager onFieldsUpdated={handleFieldsUpdated} />
                <Button variant="ghost" size="sm" onClick={resetImport}>
                  إلغاء
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              تم اكتشاف {excelColumns.length} عمود في الملف. راجع الربط وعدّل إذا لزم الأمر.
            </p>

            <ScrollArea className="h-[350px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right w-[35%]">عمود الملف</TableHead>
                    <TableHead className="text-right w-[35%]">الحقل في النظام</TableHead>
                    <TableHead className="text-right w-[30%]">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columnMappings.map((mapping) => (
                    <TableRow key={mapping.excelColumn}>
                      <TableCell className="font-mono text-sm">
                        {mapping.excelColumn}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.dbField || ""}
                          onValueChange={(value) => updateMapping(mapping.excelColumn, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر الحقل" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.map((field) => (
                              <SelectItem key={field.value} value={field.value || "none"}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {getConfidenceBadge(mapping.confidence)}
                        {mapping.isRequired && mapping.dbField && (
                          <Badge variant="destructive" className="mr-1 text-xs">مطلوب</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between">
              <Button variant="outline" onClick={resetImport}>
                <ArrowRight className="ml-2" size={16} />
                رجوع
              </Button>
              <Button onClick={() => setStep("preview")}>
                معاينة البيانات
                <ArrowLeft className="mr-2" size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                معاينة البيانات (أول 10 صفوف من {rawData.length})
              </h3>
              <Button variant="ghost" size="sm" onClick={resetImport}>
                إلغاء
              </Button>
            </div>

            <ScrollArea className="h-[300px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columnMappings
                      .filter((m) => m.dbField)
                      .slice(0, 5)
                      .map((m) => (
                        <TableHead key={m.dbField} className="text-right">
                          {m.displayName}
                        </TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawData.slice(0, 10).map((row, idx) => (
                    <TableRow key={idx}>
                      {columnMappings
                        .filter((m) => m.dbField)
                        .slice(0, 5)
                        .map((m) => (
                          <TableCell key={m.dbField} className="text-sm">
                            {String(row[m.excelColumn] ?? "-").substring(0, 30)}
                          </TableCell>
                        ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("mapping")}>
                <ArrowRight className="ml-2" size={16} />
                تعديل الربط
              </Button>
              <Button onClick={handleImport} size="lg">
                <Upload size={18} className="ml-2" />
                استيراد {rawData.length} سجل
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Importing */}
        {step === "importing" && (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-primary" size={48} />
              <p className="text-lg font-medium">جاري الاستيراد...</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>التقدم</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </div>
        )}

        {/* Step 5: Results */}
        {step === "results" && (
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
                        <TableHead className="text-right">المعرّف</TableHead>
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
                              {result.identifier}
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

export default SmartExcelImport;
