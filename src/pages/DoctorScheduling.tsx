import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, RefreshCw, ArrowRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";

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

const CENTERS = [
  "الشاطئ",
  "النهضة",
  "ذهبان",
  "أبحر",
  "السلحية",
  "الماجد",
  "الشراع",
  "الوفاء",
  "الريان",
  "خالد النموذجي",
  "بريمان",
  "الفردوس",
  "ثول",
  "السواري",
  "الرحاب",
  "البوادي 1",
  "البوادي 2",
  "الصفا 1",
  "الصفا 2",
  "السلامة",
  "المروة",
  "النعيم",
  "الفيصلية",
  "مشرفة",
  "الربوة"
];

const STATUS_STYLES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  "افتراضي": { label: "افتراضي", variant: "default", className: "bg-blue-500 hover:bg-blue-600 text-white" },
  "اجازة": { label: "اجازة", variant: "destructive", className: "bg-red-500 hover:bg-red-600 text-white" },
  "كامل اليوم": { label: "كامل اليوم", variant: "default", className: "bg-green-500 hover:bg-green-600 text-white" },
  "مسائي": { label: "مسائي", variant: "default", className: "bg-purple-500 hover:bg-purple-600 text-white" },
};

const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default function DoctorScheduling() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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
      
      toast.success("تم مزامنة الجداول بنجاح");
      if (selectedCenter) {
        fetchSchedules();
      }
    } catch (error) {
      console.error("Error syncing schedules:", error);
      toast.error("فشل في مزامنة الجداول");
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

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return <span className="text-muted-foreground">-</span>;
    
    const style = STATUS_STYLES[status] || STATUS_STYLES["افتراضي"];
    return (
      <Badge className={cn("text-xs", style.className)}>
        {style.label}
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
              <h1 className="text-3xl font-bold text-foreground">جدولة الأطباء (محدث)</h1>
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
                <SelectContent>
                  {CENTERS.map((center) => (
                    <SelectItem key={center} value={center}>
                      {center}
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
                    {format(weekStart, "d MMMM yyyy", { locale: ar })} - {format(addDays(weekStart, 6), "d MMMM yyyy", { locale: ar })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="pointer-events-auto"
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
                      <TableHead className="text-right min-w-[120px]">رقم الهوية</TableHead>
                      {weekDates.map((date, idx) => (
                        <TableHead key={idx} className="text-center min-w-[100px]">
                          <div className="flex flex-col">
                            <span className="font-medium">{WEEKDAYS[idx]}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(date, "d/M", { locale: ar })}
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
                        <TableCell className="text-muted-foreground">{doctor.doctor_id}</TableCell>
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
            {Object.entries(STATUS_STYLES).map(([key, style]) => (
              <div key={key} className="flex items-center gap-2">
                <Badge className={style.className}>{style.label}</Badge>
                <span className="text-sm text-muted-foreground">{key}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
