import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Ambulance, AlertTriangle, Heart, Activity, Droplets, User, Calendar
} from "lucide-react";

interface EmergencyReferralTabProps {
  patients: any[];
}

const EmergencyReferralTab = ({ patients }: EmergencyReferralTabProps) => {
  // Generate 2 high-risk elderly patients with all chronic diseases
  const emergencyPatients = [
    {
      id: 'emergency-1',
      name: 'عبدالله محمد الشهري',
      age: 78,
      gender: 'ذكر',
      national_id: '10XXXXXXXX1',
      has_dm: true,
      has_htn: true,
      has_dyslipidemia: true,
      bp_last_visit: '185/110',
      fasting_blood_glucose: 245,
      hba1c: 9.8,
      ldl: 195,
      symptoms: ['ألم شديد في الصدر', 'ضيق تنفس حاد'],
      referralDate: '2024-12-14',
      referralReason: 'ارتفاع شديد في ضغط الدم مع ألم صدري',
      status: 'تم التحويل للطوارئ'
    },
    {
      id: 'emergency-2',
      name: 'فاطمة أحمد العمري',
      age: 82,
      gender: 'أنثى',
      national_id: '10XXXXXXXX2',
      has_dm: true,
      has_htn: true,
      has_dyslipidemia: true,
      bp_last_visit: '175/105',
      fasting_blood_glucose: 320,
      hba1c: 11.2,
      ldl: 210,
      symptoms: ['انخفاض حاد في السكر', 'فقدان الوعي'],
      referralDate: '2024-12-15',
      referralReason: 'انخفاض حاد في مستوى السكر مع فقدان الوعي',
      status: 'تم التحويل للطوارئ'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Alert Header */}
      <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-destructive/20 rounded-2xl flex items-center justify-center animate-pulse">
              <Ambulance className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-destructive">حالات التحويل للطوارئ</h3>
              <p className="text-muted-foreground">حالات حرجة تم تحويلها مباشرة للمستشفى</p>
            </div>
            <Badge className="bg-destructive text-destructive-foreground text-lg px-4 py-2 mr-auto">
              {emergencyPatients.length} حالات
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Warning Banner */}
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
        <div>
          <p className="font-medium text-destructive">تنبيه هام</p>
          <p className="text-sm text-muted-foreground">
            هذه الحالات تتطلب متابعة عاجلة - مستفيدين كبار السن مع أمراض مزمنة متعددة
          </p>
        </div>
      </div>

      {/* Emergency Patient Cards */}
      <div className="grid gap-6">
        {emergencyPatients.map((patient, index) => (
          <Card key={patient.id} className="border-destructive/30 overflow-hidden">
            <div className="bg-destructive/10 px-6 py-3 border-b border-destructive/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-destructive/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{patient.name}</h4>
                    <p className="text-sm text-muted-foreground">{patient.national_id}</p>
                  </div>
                </div>
                <Badge className="bg-destructive text-destructive-foreground">
                  {patient.status}
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Info */}
                <div className="space-y-4">
                  <h5 className="font-medium text-muted-foreground mb-2">معلومات المستفيد</h5>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">العمر:</span>
                      <span className="font-medium">{patient.age} سنة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">الجنس:</span>
                      <span className="font-medium">{patient.gender}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">الأمراض المزمنة:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1">
                        <Activity className="w-3 h-3" /> السكري
                      </Badge>
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1">
                        <Heart className="w-3 h-3" /> ضغط الدم
                      </Badge>
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1">
                        <Droplets className="w-3 h-3" /> الدهون
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Lab Values */}
                <div className="space-y-4">
                  <h5 className="font-medium text-muted-foreground mb-2">القراءات الحرجة</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-destructive/10 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">ضغط الدم</p>
                      <p className="text-lg font-bold text-destructive">{patient.bp_last_visit}</p>
                    </div>
                    <div className="bg-destructive/10 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">سكر صائم</p>
                      <p className="text-lg font-bold text-destructive">{patient.fasting_blood_glucose}</p>
                    </div>
                    <div className="bg-destructive/10 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">HbA1c</p>
                      <p className="text-lg font-bold text-destructive">{patient.hba1c}%</p>
                    </div>
                    <div className="bg-destructive/10 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">LDL</p>
                      <p className="text-lg font-bold text-destructive">{patient.ldl}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Symptoms & Referral Reason */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">الأعراض:</p>
                    <div className="flex flex-wrap gap-2">
                      {patient.symptoms.map((symptom, i) => (
                        <Badge key={i} variant="outline" className="bg-warning/10 text-warning border-warning/30">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">سبب التحويل:</p>
                    <p className="text-sm font-medium text-destructive">{patient.referralReason}</p>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>تاريخ التحويل: {patient.referralDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ملخص حالات الطوارئ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-destructive">2</p>
              <p className="text-sm text-muted-foreground">إجمالي التحويلات</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">80</p>
              <p className="text-sm text-muted-foreground">متوسط العمر</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-destructive">3</p>
              <p className="text-sm text-muted-foreground">أمراض مزمنة/مستفيد</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-success">100%</p>
              <p className="text-sm text-muted-foreground">نسبة التحويل الناجح</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyReferralTab;
