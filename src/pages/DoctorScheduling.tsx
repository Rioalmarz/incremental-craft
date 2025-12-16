import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, startOfWeek, addDays } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, RefreshCw, ArrowRight, Users, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

// Centers list (excluding الربوة which is closed)
const CENTERS = [
  { ar: "الشراع", en: "Alsharaa" },
  { ar: "الماجد", en: "Almajid" },
  { ar: "الفردوس", en: "Alfirdous" },
  { ar: "مشرفة", en: "Mushrifa" },
  { ar: "البوادي 1", en: "Albawadi 1" },
  { ar: "الصالحية", en: "Alsalhiya" },
  { ar: "المروة", en: "Almarwa" },
  { ar: "الوفاء", en: "Alwafa" },
  { ar: "النعيم", en: "Alnaeem" },
  { ar: "خالد النموذجي", en: "Khalid Model" },
  { ar: "البوادي ٢", en: "Albawadi 2" },
  { ar: "الريان", en: "Alrayan" },
  { ar: "الفيصلية", en: "Alfaisaliyah" },
  { ar: "بريمان", en: "Briman" },
  { ar: "الصفا 2", en: "Alsafa 2" },
  { ar: "مركز صحي السلامة", en: "Alsalama" },
  { ar: "النهضة", en: "Alnahda" },
  { ar: "الرحاب", en: "Alrehab" },
  { ar: "ذهبان", en: "Dahaban" },
  { ar: "الشاطي", en: "Alshati" },
  { ar: "الصفا 1", en: "Alsafa 1" },
  { ar: "الصواري", en: "Alsawari" },
  { ar: "ثول", en: "Thuwal" },
  { ar: "مركز أبحر الشمالية", en: "Abhur Alshamaliyah" },
];

const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];

interface Schedule {
  id: string;
  center_name: string;
  doctor_name: string;
  doctor_id: string;
  date: string;
  status: string;
}

interface DoctorWeekSchedule {
  doctor_name: string;
  doctor_id: string;
  schedules: Record<string, string>;
}

interface ScheduleRecord {
  center_name: string;
  doctor_name: string;
  doctor_id: string;
  date: string;
  status: string;
}

export default function DoctorScheduling() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (selectedCenter) {
      fetchSchedules();
    }
  }, [selectedCenter, selectedDate]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const startDate = format(weekStart, "yyyy-MM-dd");
      const endDate = format(addDays(weekStart, 6), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("center_name", selectedCenter)
        .gte("date", startDate)
        .lte("date", endDate);

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast.error("فشل في تحميل الجداول");
    } finally {
      setLoading(false);
    }
  };

  const syncFromSheets = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-doctor-schedules");

      if (error) throw error;

      if (data?.success) {
        toast.success(`تم المزامنة: ${data.syncedCount || 0} سجل`);
        if (selectedCenter) {
          fetchSchedules();
        }
      } else {
        toast.error(data?.error || "حدث خطأ في المزامنة");
      }
    } catch (error: any) {
      console.error("Sync error:", error);
      toast.error(error.message || "فشل في المزامنة");
    } finally {
      setSyncing(false);
    }
  };

  // Smart date format detection - analyzes patterns to determine MM-DD vs DD-MM
  const detectDateFormat = (datePatterns: { first: number; second: number }[]): 'first-is-month' | 'second-is-month' => {
    if (datePatterns.length === 0) {
      return 'second-is-month'; // Default: DD-MM (common in Arabic region)
    }

    const currentMonth = new Date().getMonth() + 1; // 12 for December
    
    const firstValues = datePatterns.map(p => p.first);
    const secondValues = datePatterns.map(p => p.second);
    
    const uniqueFirst = new Set(firstValues);
    const uniqueSecond = new Set(secondValues);
    
    console.log(`Date format detection: first values = [${[...uniqueFirst].join(', ')}], second values = [${[...uniqueSecond].join(', ')}]`);
    console.log(`Current month: ${currentMonth}`);
    
    // Rule 1: Constant value is month, changing value is day
    if (uniqueFirst.size === 1 && uniqueSecond.size > 1) {
      console.log(`Detected: first value is constant (${[...uniqueFirst][0]}) = month`);
      return 'first-is-month';
    }
    if (uniqueSecond.size === 1 && uniqueFirst.size > 1) {
      console.log(`Detected: second value is constant (${[...uniqueSecond][0]}) = month`);
      return 'second-is-month';
    }
    
    // Rule 2: If one value matches current month consistently
    const firstMatchesCurrent = firstValues.every(v => v === currentMonth);
    const secondMatchesCurrent = secondValues.every(v => v === currentMonth);
    
    if (firstMatchesCurrent && !secondMatchesCurrent) {
      console.log(`Detected: first value matches current month (${currentMonth}) = month`);
      return 'first-is-month';
    }
    if (secondMatchesCurrent && !firstMatchesCurrent) {
      console.log(`Detected: second value matches current month (${currentMonth}) = month`);
      return 'second-is-month';
    }
    
    // Rule 3: If any value > 12, it must be a day
    if (firstValues.some(v => v > 12)) {
      console.log(`Detected: first value has values > 12, so second = month`);
      return 'second-is-month';
    }
    if (secondValues.some(v => v > 12)) {
      console.log(`Detected: second value has values > 12, so first = month`);
      return 'first-is-month';
    }
    
    // Rule 4: Check if values increment (days typically increment in a week)
    const firstSorted = [...firstValues].sort((a, b) => a - b);
    const secondSorted = [...secondValues].sort((a, b) => a - b);
    
    const isFirstSequential = firstSorted.length > 1 && 
      firstSorted.every((v, i) => i === 0 || v - firstSorted[i-1] <= 2);
    const isSecondSequential = secondSorted.length > 1 && 
      secondSorted.every((v, i) => i === 0 || v - secondSorted[i-1] <= 2);
    
    if (isFirstSequential && !isSecondSequential) {
      console.log(`Detected: first values are sequential (days), second = month`);
      return 'second-is-month';
    }
    if (isSecondSequential && !isFirstSequential) {
      console.log(`Detected: second values are sequential (days), first = month`);
      return 'first-is-month';
    }
    
    // Default: assume DD-MM format (common in Arabic region)
    console.log(`No clear pattern detected, defaulting to DD-MM (second = month)`);
    return 'second-is-month';
  };

  // Extract date from header - handles Date objects, Excel serial numbers, and text patterns
  const extractDateFromHeader = (header: any, colIndex: number, dateFormat: 'first-is-month' | 'second-is-month', currentYear: number, currentMonth: number): string | null => {
    if (!header) return null;
    
    // 1. If it's already a Date object (from cellDates: true)
    if (header instanceof Date && !isNaN(header.getTime())) {
      const result = format(header, 'yyyy-MM-dd');
      console.log(`Column ${colIndex}: Date object -> ${result}`);
      return result;
    }
    
    // 2. If it's an Excel serial number (number between 40000-50000 typically represents 2009-2036)
    if (typeof header === 'number' && header > 30000 && header < 60000) {
      try {
        // Excel serial to date: days since 1899-12-30
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + header * 24 * 60 * 60 * 1000);
        if (!isNaN(date.getTime())) {
          const result = format(date, 'yyyy-MM-dd');
          console.log(`Column ${colIndex}: Excel serial ${header} -> ${result}`);
          return result;
        }
      } catch (e) {
        console.log(`Column ${colIndex}: Failed to parse Excel serial ${header}`);
      }
    }
    
    // 3. Text-based date patterns
    const headerStr = String(header);
    
    // Try various date patterns
    // Pattern: DD/MM/YYYY or MM/DD/YYYY with full year
    const fullDateMatch = headerStr.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if (fullDateMatch) {
      const first = parseInt(fullDateMatch[1], 10);
      const second = parseInt(fullDateMatch[2], 10);
      const year = parseInt(fullDateMatch[3], 10);
      
      let month: number, day: number;
      if (dateFormat === 'first-is-month') {
        month = first;
        day = second;
      } else {
        day = first;
        month = second;
      }
      
      // Validate
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const testDate = new Date(year, month - 1, day);
        if (testDate.getMonth() === month - 1 && testDate.getDate() === day) {
          const result = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          console.log(`Column ${colIndex}: Full date "${headerStr}" -> ${result}`);
          return result;
        }
      }
    }
    
    // Pattern: DD/MM or MM/DD (without year)
    const shortDateMatch = headerStr.match(/(\d{1,2})[-\/](\d{1,2})(?!\d)/);
    if (shortDateMatch) {
      const first = parseInt(shortDateMatch[1], 10);
      const second = parseInt(shortDateMatch[2], 10);
      
      let month: number, day: number;
      if (dateFormat === 'first-is-month') {
        month = first;
        day = second;
      } else {
        day = first;
        month = second;
      }
      
      // Validate
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        let year = currentYear;
        if (month < currentMonth) {
          year = currentYear + 1;
        }
        
        const testDate = new Date(year, month - 1, day);
        if (testDate.getMonth() === month - 1 && testDate.getDate() === day) {
          const result = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          console.log(`Column ${colIndex}: Short date "${headerStr}" -> ${result}`);
          return result;
        }
      }
    }
    
    // Pattern: Just a day number (1-31)
    const dayOnlyMatch = headerStr.match(/^(\d{1,2})$/);
    if (dayOnlyMatch) {
      const day = parseInt(dayOnlyMatch[1], 10);
      if (day >= 1 && day <= 31) {
        let year = currentYear;
        let month = currentMonth;
        
        // If day < current day, probably next month
        const today = new Date().getDate();
        if (day < today - 7) {
          month = currentMonth + 1;
          if (month > 12) {
            month = 1;
            year = currentYear + 1;
          }
        }
        
        const testDate = new Date(year, month - 1, day);
        if (testDate.getMonth() === month - 1 && testDate.getDate() === day) {
          const result = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          console.log(`Column ${colIndex}: Day only "${headerStr}" -> ${result} (assumed month ${month})`);
          return result;
        }
      }
    }
    
    console.log(`Column ${colIndex}: Could not parse date from "${headerStr}" (type: ${typeof header})`);
    return null;
  };

  // Extract date patterns from headers for format detection
  const extractDatePatterns = (headers: any[]): { first: number; second: number }[] => {
    const patterns: { first: number; second: number }[] = [];
    const datePattern = /(\d{1,2})[-\/](\d{1,2})/;
    
    for (const header of headers) {
      if (!header) continue;
      
      // Skip Date objects and numbers for pattern detection (they're already parsed)
      if (header instanceof Date || typeof header === 'number') continue;
      
      const headerStr = String(header);
      const match = headerStr.match(datePattern);
      if (match) {
        patterns.push({
          first: parseInt(match[1]),
          second: parseInt(match[2])
        });
      }
    }
    
    return patterns;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    toast.info("جاري قراءة الملف...");

    try {
      const data = await file.arrayBuffer();
      // Read with cellDates to convert Excel dates to Date objects
      const workbook = XLSX.read(data, { type: "array", cellDates: true });
      
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      // First pass: collect all date patterns from all sheets for text-based headers
      console.log("=== EXCEL IMPORT DEBUG ===");
      console.log(`Total sheets: ${workbook.SheetNames.length}`);
      console.log(`Sheets: ${workbook.SheetNames.join(', ')}`);
      
      const allDatePatterns: { first: number; second: number }[] = [];
      
      for (const sheetName of workbook.SheetNames) {
        if (sheetName.includes("الربوة")) continue;
        
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });
        
        if (rows.length < 2) continue;
        
        const headerRow = rows[0] as any[];
        console.log(`Sheet "${sheetName}" headers:`, headerRow.slice(0, 10));
        console.log(`Header types:`, headerRow.slice(0, 10).map((h: any) => `${typeof h}${h instanceof Date ? '(Date)' : ''}`));
        
        const patterns = extractDatePatterns(headerRow.slice(2));
        allDatePatterns.push(...patterns);
      }
      
      // Detect date format from text patterns
      const dateFormat = detectDateFormat(allDatePatterns);
      console.log(`=== DETECTED DATE FORMAT: ${dateFormat} ===`);
      console.log(`Total patterns found: ${allDatePatterns.length}`);
      
      const allRecords: ScheduleRecord[] = [];
      
      // Second pass: process all sheets
      for (const sheetName of workbook.SheetNames) {
        if (sheetName.includes("الربوة")) {
          console.log(`Skipping sheet: ${sheetName}`);
          continue;
        }

        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });
        
        if (rows.length < 2) {
          console.log(`Sheet "${sheetName}": Skipped (less than 2 rows)`);
          continue;
        }

        const headerRow = rows[0] as any[];
        
        // Find date columns - now handles multiple formats
        const dateColumns: { index: number; date: string }[] = [];
        
        console.log(`\n--- Processing sheet: ${sheetName} ---`);
        
        headerRow.forEach((header, idx) => {
          if (idx < 2) return; // Skip first 2 columns (center, doctor name)
          
          const dateStr = extractDateFromHeader(header, idx, dateFormat, currentYear, currentMonth);
          if (dateStr) {
            dateColumns.push({ index: idx, date: dateStr });
          }
        });

        console.log(`Sheet "${sheetName}": Found ${dateColumns.length} date columns`);
        if (dateColumns.length > 0) {
          console.log(`Date columns: ${dateColumns.slice(0, 5).map(d => `col${d.index}=${d.date}`).join(', ')}`);
        } else {
          console.log(`WARNING: No date columns found in sheet "${sheetName}"`);
          console.log(`Raw headers: ${headerRow.slice(2, 12).map((h: any) => `"${h}" (${typeof h})`).join(', ')}`);
        }

        // Process data rows
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i] as any[];
          if (!row || row.length < 2) continue;

          const centerName = String(row[0] || "").trim();
          const doctorName = String(row[1] || "").trim();
          const doctorId = String(row[2] || "").trim();

          // Skip if center is الربوة or empty row
          if (!doctorName || centerName.includes("الربوة")) continue;

          // Use sheet name as center if cell is empty
          const finalCenterName = centerName || sheetName;

          for (const { index, date } of dateColumns) {
            const status = String(row[index] || "").trim();
            if (!status) continue;

            allRecords.push({
              center_name: finalCenterName,
              doctor_name: doctorName,
              doctor_id: doctorId || `${finalCenterName}-${doctorName}`.replace(/\s/g, '-'),
              date,
              status
            });
          }
        }
      }

      console.log(`Total records to import: ${allRecords.length}`);
      console.log(`Date format used: ${dateFormat}`);
      toast.info(`جاري إدخال ${allRecords.length} سجل...`);

      // Send to edge function
      const { data: result, error } = await supabase.functions.invoke("import-doctor-schedules", {
        body: { records: allRecords }
      });

      if (error) throw error;

      if (result?.success) {
        toast.success(result.message || `تم إدخال ${result.insertedCount} سجل`);
        if (selectedCenter) {
          fetchSchedules();
        }
      } else {
        toast.error(result?.error || "حدث خطأ في الاستيراد");
      }

    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "فشل في استيراد الملف");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getDoctorWeekSchedules = (): DoctorWeekSchedule[] => {
    const doctorMap = new Map<string, DoctorWeekSchedule>();

    schedules.forEach((schedule) => {
      const key = schedule.doctor_id;
      if (!doctorMap.has(key)) {
        doctorMap.set(key, {
          doctor_name: schedule.doctor_name,
          doctor_id: schedule.doctor_id,
          schedules: {},
        });
      }
      doctorMap.get(key)!.schedules[schedule.date] = schedule.status;
    });

    return Array.from(doctorMap.values());
  };

  // Get status badge with specific colors based on Arabic text
  const getStatusBadge = (status: string | undefined) => {
    if (!status || status === "-" || status.trim() === "") {
      return <span className="text-muted-foreground text-xs">-</span>;
    }

    // Check for specific statuses (order matters - more specific first)
    if (status.includes("اجازة مرضية")) {
      return (
        <Badge className="bg-pink-300 hover:bg-pink-400 text-gray-800 text-xs">
          اجازة مرضية
        </Badge>
      );
    }

    if (status.includes("مهام إدارية") || status.includes("مهام ادارية")) {
      return (
        <Badge className="bg-gray-800 hover:bg-gray-900 text-white text-xs">
          مهام إدارية
        </Badge>
      );
    }

    if (status.includes("كامل اليوم") || status.includes("كامل")) {
      return (
        <Badge className="bg-gray-400 hover:bg-gray-500 text-white text-xs">
          كامل اليوم
        </Badge>
      );
    }

    if (status.includes("افتراضي")) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
          افتراضي
        </Badge>
      );
    }

    if (status.includes("اجازة") || status.includes("إجازه") || status.includes("إجازة")) {
      return (
        <Badge className="bg-red-400 hover:bg-red-500 text-white text-xs">
          اجازة
        </Badge>
      );
    }

    if (status.includes("تكليف")) {
      return (
        <Badge className="bg-gray-600 hover:bg-gray-700 text-white text-xs">
          تكليف
        </Badge>
      );
    }

    if (status.includes("مسائي")) {
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs">
          مسائي
        </Badge>
      );
    }

    // Default: show the raw status
    return (
      <Badge variant="outline" className="text-xs">
        {status}
      </Badge>
    );
  };

  const doctorSchedules = getDoctorWeekSchedules();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">جدولة الأطباء</h1>
              <p className="text-muted-foreground">إدارة جداول الأطباء لجميع المراكز الصحية</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={importing}
              className="gap-2"
            >
              <Upload className={cn("h-4 w-4", importing && "animate-pulse")} />
              {importing ? "جاري الاستيراد..." : "استيراد من Excel"}
            </Button>
            <Button onClick={syncFromSheets} disabled={syncing} className="gap-2">
              <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
              مزامنة من Google Sheets
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الفلاتر</CardTitle>
            <CardDescription>اختر المركز والتاريخ لعرض الجدول</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {/* Center Select */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">المركز</label>
              <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المركز" />
                </SelectTrigger>
                <SelectContent className="bg-background border">
                  {CENTERS.map((center) => (
                    <SelectItem key={center.ar} value={center.ar}>
                      {center.ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Picker */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">الأسبوع</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {format(weekStart, "d MMMM yyyy", { locale: ar })} -{" "}
                    {format(addDays(weekStart, 4), "d MMMM yyyy", { locale: ar })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              جدول الأطباء
            </CardTitle>
            <CardDescription>
              {selectedCenter ? `جدول مركز ${selectedCenter} للأسبوع المحدد` : "اختر مركزاً لعرض الجدول"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedCenter ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>الرجاء اختيار مركز صحي لعرض جدول الأطباء</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
                <p>جاري التحميل...</p>
              </div>
            ) : doctorSchedules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد بيانات للأسبوع المحدد</p>
                <p className="text-sm mt-2">قم بالمزامنة من Google Sheets لتحميل البيانات</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right min-w-[150px]">اسم الطبيب</TableHead>
                      {weekDates.map((date, idx) => (
                        <TableHead key={idx} className="text-center min-w-[100px]">
                          <div className="flex flex-col">
                            <span className="font-medium">{WEEKDAYS[idx]}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(date, "MM/dd")}
                            </span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctorSchedules.map((doctor) => (
                      <TableRow key={doctor.doctor_id}>
                        <TableCell className="font-medium">{doctor.doctor_name}</TableCell>
                        {weekDates.map((date) => (
                          <TableCell key={date.toISOString()} className="text-center">
                            {getStatusBadge(doctor.schedules[format(date, "yyyy-MM-dd")])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">دليل الحالات</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500 text-white">افتراضي</Badge>
              <span className="text-sm text-muted-foreground">عيادة افتراضية</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gray-400 text-white">كامل اليوم</Badge>
              <span className="text-sm text-muted-foreground">دوام كامل</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500 text-white">مسائي</Badge>
              <span className="text-sm text-muted-foreground">فترة مسائية</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-400 text-white">اجازة</Badge>
              <span className="text-sm text-muted-foreground">إجازة</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-pink-300 text-gray-800">اجازة مرضية</Badge>
              <span className="text-sm text-muted-foreground">إجازة مرضية</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gray-800 text-white">مهام إدارية</Badge>
              <span className="text-sm text-muted-foreground">مهام إدارية</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gray-600 text-white">تكليف</Badge>
              <span className="text-sm text-muted-foreground">تكليف خارجي</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
