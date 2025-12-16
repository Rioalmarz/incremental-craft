import { useState, useEffect } from "react";
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
import { CalendarIcon, RefreshCw, ArrowRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function DoctorScheduling() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

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
          <Button onClick={syncFromSheets} disabled={syncing} className="gap-2">
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            مزامنة من Google Sheets
          </Button>
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
