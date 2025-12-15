import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Users, ClipboardList, Pill, Search, Stethoscope, AlertTriangle, Loader2 } from "lucide-react";

interface TableCount {
  name: string;
  label: string;
  icon: React.ReactNode;
  count: number;
}

const AdminDataCleaner = () => {
  const { toast } = useToast();
  const [tableCounts, setTableCounts] = useState<TableCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [currentTable, setCurrentTable] = useState("");

  const fetchCounts = async () => {
    setIsLoading(true);
    try {
      const [patients, eligibility, medications, screening, virtualClinic] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("patient_eligibility").select("id", { count: "exact", head: true }),
        supabase.from("medications").select("id", { count: "exact", head: true }),
        supabase.from("screening_data").select("id", { count: "exact", head: true }),
        supabase.from("virtual_clinic_data").select("id", { count: "exact", head: true }),
      ]);

      setTableCounts([
        { name: "patients", label: "المستفيدين", icon: <Users size={18} />, count: patients.count || 0 },
        { name: "patient_eligibility", label: "أهلية الرعاية الوقائية", icon: <ClipboardList size={18} />, count: eligibility.count || 0 },
        { name: "medications", label: "الأدوية", icon: <Pill size={18} />, count: medications.count || 0 },
        { name: "screening_data", label: "بيانات الفرز", icon: <Search size={18} />, count: screening.count || 0 },
        { name: "virtual_clinic_data", label: "بيانات العيادة الافتراضية", icon: <Stethoscope size={18} />, count: virtualClinic.count || 0 },
      ]);
    } catch (error) {
      console.error("Error fetching counts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const totalRecords = tableCounts.reduce((sum, table) => sum + table.count, 0);

  const handleDelete = async () => {
    if (confirmText !== "حذف") return;

    setIsDeleting(true);
    setDeleteProgress(0);

    // Delete in order to respect foreign keys
    const deleteOrder = [
      "patient_eligibility",
      "medications",
      "screening_data",
      "virtual_clinic_data",
      "patients",
    ];

    try {
      for (let i = 0; i < deleteOrder.length; i++) {
        const tableName = deleteOrder[i];
        setCurrentTable(tableCounts.find(t => t.name === tableName)?.label || tableName);
        
        const { error } = await supabase
          .from(tableName as any)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records

        if (error) {
          console.error(`Error deleting from ${tableName}:`, error);
          throw error;
        }

        setDeleteProgress(((i + 1) / deleteOrder.length) * 100);
      }

      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف ${totalRecords.toLocaleString("ar-SA")} سجل بنجاح`,
      });

      setShowConfirmDialog(false);
      setConfirmText("");
      fetchCounts(); // Refresh counts
    } catch (error: any) {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف البيانات",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteProgress(0);
      setCurrentTable("");
    }
  };

  return (
    <>
      <Card className="glass border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 size={20} />
            حذف بيانات المستفيدين
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-destructive" />
            تحذير: هذا الإجراء سيحذف جميع بيانات المستفيدين بشكل نهائي ولا يمكن التراجع عنه
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : (
            <>
              <div className="space-y-2 bg-background/50 rounded-lg p-4 border">
                {tableCounts.map((table) => (
                  <div key={table.name} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{table.icon}</span>
                      <span>{table.label}</span>
                    </div>
                    <span className="font-mono text-sm font-medium">
                      {table.count.toLocaleString("ar-SA")} سجل
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3 mt-2 border-t-2 font-bold">
                  <span>المجموع</span>
                  <span className="text-destructive">
                    {totalRecords.toLocaleString("ar-SA")} سجل
                  </span>
                </div>
              </div>

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowConfirmDialog(true)}
                disabled={totalRecords === 0}
              >
                <Trash2 size={18} className="ml-2" />
                حذف جميع بيانات المستفيدين
              </Button>

              {totalRecords === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  لا توجد بيانات للحذف
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={24} />
              تأكيد الحذف النهائي
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-lg font-semibold">
                أنت على وشك حذف {totalRecords.toLocaleString("ar-SA")} سجل بشكل نهائي!
              </p>
              
              <div className="bg-destructive/10 rounded-lg p-4 space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <span className="text-destructive">✗</span>
                  لا يمكن التراجع عن هذا الإجراء
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-destructive">✗</span>
                  سيحذف جميع بيانات المستفيدين والأدوية والفرز
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  لن يؤثر على إعدادات النظام أو حسابات المستخدمين
                </p>
              </div>

              {isDeleting ? (
                <div className="space-y-2">
                  <p className="text-sm text-center">جاري حذف: {currentTable}</p>
                  <Progress value={deleteProgress} className="h-2" />
                </div>
              ) : (
                <div className="space-y-2">
                  <p>للتأكيد، اكتب كلمة <strong className="text-destructive">"حذف"</strong> في الحقل أدناه:</p>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder='اكتب "حذف" للتأكيد'
                    className="text-center"
                  />
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={confirmText !== "حذف" || isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "تأكيد الحذف النهائي"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminDataCleaner;
