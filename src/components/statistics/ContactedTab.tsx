import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from "recharts";
import { UserCheck, CheckCircle, Pill, Stethoscope, FileText, Activity, Heart, Droplets, Scale } from "lucide-react";

interface ContactedTabProps {
  patients: any[];
}

const COLORS = {
  preventive: '#00BCD4',
  medication: '#4CAF50',
  lab: '#2196F3',
  referral: '#9C27B0',
  noIntervention: '#9CA3AF',
};

const ContactedTab = ({ patients }: ContactedTabProps) => {
  const totalPatients = patients.length;
  const contacted = patients.filter(p => p.contacted === true).length;
  const serviceDelivered = patients.filter(p => p.service_delivered === true).length;
  const serviceNotDelivered = contacted - serviceDelivered;
  const serviceDeliveredRate = contacted > 0 ? Math.round((serviceDelivered / contacted) * 100) : 0;
  
  // Calculate service types from real data
  // Count patients with different types of care
  const preventiveCount = patients.filter(p => 
    p.contacted && (p.eligible_dm_screening || p.eligible_htn_screening || p.eligible_dlp_screening)
  ).length;
  const medicationCount = patients.filter(p => 
    p.contacted && p.predicted_medications && p.predicted_medications !== ""
  ).length;
  const labCount = patients.filter(p => 
    p.contacted && (p.fasting_blood_glucose != null || p.hba1c != null || p.ldl != null)
  ).length;
  const referralCount = patients.filter(p => 
    p.contacted && p.urgency_status === "طوارئ"
  ).length;
  const noInterventionCount = Math.max(0, contacted - (preventiveCount + medicationCount + labCount + referralCount));
  
  const totalServiced = serviceDelivered || 1;
  const serviceTypes = [
    { name: 'خدمات استباقية (وقائية)', value: preventiveCount, color: COLORS.preventive, icon: Activity },
    { name: 'صرف علاج', value: medicationCount, color: COLORS.medication, icon: Pill },
    { name: 'فحوصات مخبرية', value: labCount, color: COLORS.lab, icon: FileText },
    { name: 'تحويل تخصصي', value: referralCount, color: COLORS.referral, icon: Stethoscope },
    { name: 'لا يحتاج تدخل', value: noInterventionCount, color: COLORS.noIntervention, icon: CheckCircle },
  ].filter(s => s.value > 0);

  // Preventive services breakdown
  const bpScreened = patients.filter(p => p.contacted && p.bp_last_visit != null).length;
  const fbgScreened = patients.filter(p => p.contacted && p.fasting_blood_glucose != null).length;
  const lipidScreened = patients.filter(p => p.contacted && p.ldl != null).length;
  const bmiCount = patients.filter(p => p.contacted && p.obesity_class != null).length;

  const preventiveServices = [
    { name: 'فحص سكر صائم', count: fbgScreened, ageRequirement: '≥ 35 سنة', icon: Droplets, color: '#F44336' },
    { name: 'قياس ضغط الدم', count: bpScreened, ageRequirement: '≥ 18 سنة', icon: Heart, color: '#2196F3' },
    { name: 'فحص الدهون', count: lipidScreened, ageRequirement: 'رجال ≥35 / نساء ≥45', icon: Activity, color: '#9C27B0' },
    { name: 'قياس معدل الكتلة (BMI)', count: bmiCount, ageRequirement: 'جميع الأعمار', icon: Scale, color: '#FF9800' },
  ];

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center">
                <UserCheck className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{contacted}</p>
                <p className="text-sm text-muted-foreground">تم التواصل معهم</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-success/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-success" />
              </div>
              <div>
                <p className="text-3xl font-bold">{serviceDelivered}</p>
                <p className="text-sm text-muted-foreground">تم تقديم الخدمة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-success">{serviceDeliveredRate}%</p>
                <p className="text-sm text-muted-foreground">نسبة الإنجاز</p>
              </div>
              <Badge className="bg-success/20 text-success">
                {serviceDelivered} / {contacted}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>نسبة تقديم الخدمة من المتواصل معهم</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={serviceDeliveredRate} className="h-4 mb-4" />
          <div className="flex justify-between text-sm">
            <span className="text-success">تم تقديم الخدمة: {serviceDelivered}</span>
            <span className="text-muted-foreground">لم يتم تقديم الخدمة: {Math.max(0, serviceNotDelivered)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Preventive Services Highlight */}
      {(bpScreened > 0 || fbgScreened > 0 || lipidScreened > 0 || bmiCount > 0) && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Activity className="w-5 h-5" />
              الخدمات الاستباقية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {preventiveServices.map((service, index) => (
                <div key={index} className="p-4 bg-background/80 rounded-xl border shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${service.color}20` }}
                    >
                      <service.icon className="w-4 h-4" style={{ color: service.color }} />
                    </div>
                    <span className="font-bold text-xl">{service.count}</span>
                  </div>
                  <p className="text-sm font-medium">{service.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{service.ageRequirement}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">نوع الخدمات المقدمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {serviceTypes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {serviceTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  لا توجد بيانات
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">تفصيل الخدمات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {serviceTypes.length > 0 ? (
                serviceTypes.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center" 
                        style={{ backgroundColor: `${service.color}20` }}
                      >
                        <service.icon className="w-4 h-4" style={{ color: service.color }} />
                      </div>
                      <span>{service.name}</span>
                    </div>
                    <Badge variant="outline">{service.value}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  لا توجد بيانات
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactedTab;
