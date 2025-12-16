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
  // Fixed values: 81% of 594 = 481 contacted
  const totalPatients = 594;
  const contacted = Math.round(totalPatients * 0.81); // 481
  const serviceDelivered = Math.round(contacted * 0.90); // 433 (90% of contacted got service)
  const serviceNotDelivered = contacted - serviceDelivered;
  const serviceDeliveredRate = 90;
  
  // Service types delivered with preventive care as TOP service
  const totalServiced = serviceDelivered;
  const serviceTypes = [
    { name: 'خدمات استباقية (وقائية)', value: Math.round(totalServiced * 0.40), color: COLORS.preventive, icon: Activity },
    { name: 'صرف علاج', value: Math.round(totalServiced * 0.25), color: COLORS.medication, icon: Pill },
    { name: 'فحوصات مخبرية', value: Math.round(totalServiced * 0.20), color: COLORS.lab, icon: FileText },
    { name: 'تحويل تخصصي', value: Math.round(totalServiced * 0.10), color: COLORS.referral, icon: Stethoscope },
    { name: 'لا يحتاج تدخل', value: Math.round(totalServiced * 0.05), color: COLORS.noIntervention, icon: CheckCircle },
  ];

  // Preventive services breakdown (proactive services by age)
  const preventiveTotal = Math.round(totalServiced * 0.40);
  const preventiveServices = [
    { name: 'فحص سكر صائم', count: Math.round(preventiveTotal * 0.30), ageRequirement: '≥ 35 سنة', icon: Droplets, color: '#F44336' },
    { name: 'قياس ضغط الدم', count: Math.round(preventiveTotal * 0.28), ageRequirement: '≥ 18 سنة', icon: Heart, color: '#2196F3' },
    { name: 'فحص الدهون', count: Math.round(preventiveTotal * 0.25), ageRequirement: 'رجال ≥35 / نساء ≥45', icon: Activity, color: '#9C27B0' },
    { name: 'قياس معدل الكتلة (BMI)', count: Math.round(preventiveTotal * 0.17), ageRequirement: 'جميع الأعمار', icon: Scale, color: '#FF9800' },
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
            <span className="text-muted-foreground">لم يتم تقديم الخدمة: {serviceNotDelivered}</span>
          </div>
        </CardContent>
      </Card>

      {/* Preventive Services Highlight */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Activity className="w-5 h-5" />
            الخدمات الاستباقية (الأكثر استخداماً)
            <Badge className="bg-primary/20 text-primary mr-2">40% من الخدمات</Badge>
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
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">نوع الخدمات المقدمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
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
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">تفصيل الخدمات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {serviceTypes.map((service, index) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactedTab;