import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { ShieldCheck, Activity, Droplets, Heart } from "lucide-react";

interface PreventiveCareTabProps {
  patients: any[];
}

const COLORS = {
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#F44336',
  primary: '#00BCD4',
  muted: '#9CA3AF',
};

const PreventiveCareTab = ({ patients }: PreventiveCareTabProps) => {
  const totalPatients = patients.length;
  
  // Calculate eligible patients for each screening based on age/gender criteria
  // BP screening: >= 18 years
  const bpEligible = patients.filter(p => p.age != null && p.age >= 18).length;
  // FBG screening: >= 35 years
  const fbgEligible = patients.filter(p => p.age != null && p.age >= 35).length;
  // Lipid screening: males >= 35, females >= 45
  const lipidEligible = patients.filter(p => {
    if (p.age == null) return false;
    const isMale = p.gender === "Male" || p.gender === "ذكر" || p.gender === "male";
    const isFemale = p.gender === "Female" || p.gender === "أنثى" || p.gender === "female";
    return (isMale && p.age >= 35) || (isFemale && p.age >= 45);
  }).length;
  
  // Calculate screened patients (those with results)
  const bpScreened = patients.filter(p => p.bp_last_visit != null && p.bp_last_visit !== "").length;
  const fbgScreened = patients.filter(p => p.fasting_blood_glucose != null).length;
  const lipidScreened = patients.filter(p => p.ldl != null).length;
  
  // Calculate rates
  const bpRate = bpEligible > 0 ? Math.round((bpScreened / bpEligible) * 100) : 0;
  const fbgRate = fbgEligible > 0 ? Math.round((fbgScreened / fbgEligible) * 100) : 0;
  const lipidRate = lipidEligible > 0 ? Math.round((lipidScreened / lipidEligible) * 100) : 0;
  
  // Overall screening rate
  const totalEligible = bpEligible + fbgEligible + lipidEligible;
  const totalScreened = bpScreened + fbgScreened + lipidScreened;
  const overallRate = totalEligible > 0 ? Math.round((totalScreened / totalEligible) * 100) : 0;
  
  const screeningByAge = [
    { name: 'ضغط الدم (≥18)', eligible: bpEligible, screened: bpScreened },
    { name: 'سكر صائم (≥35)', eligible: fbgEligible, screened: fbgScreened },
    { name: 'دهون (ذكور ≥35, إناث ≥45)', eligible: lipidEligible, screened: lipidScreened },
  ];
  
  const pieData = [
    { name: 'تم الفحص', value: totalScreened, color: COLORS.success },
    { name: 'لم يتم الفحص', value: Math.max(0, totalEligible - totalScreened), color: COLORS.muted },
  ];

  return (
    <div className="space-y-6">
      {/* Main KPI */}
      <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-success/20 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-success" />
              </div>
              <div>
                <p className="text-4xl font-bold text-success">{overallRate}%</p>
                <p className="text-muted-foreground">من المستفيدين تم إجراء الفحص الوقائي لهم</p>
                {totalPatients === 0 && (
                  <p className="text-sm text-warning mt-1">لا توجد بيانات متاحة</p>
                )}
              </div>
            </div>
            <Badge className="bg-success/20 text-success text-lg px-4 py-2">
              {totalScreened} / {totalEligible}
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      {/* Screening Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">ضغط الدم</p>
                <p className="text-xs text-muted-foreground">≥ 18 سنة</p>
              </div>
            </div>
            <Progress value={bpRate} className="h-2 mb-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{bpScreened} تم فحصهم</span>
              <span className="font-medium">{bpRate}%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="font-medium">سكر صائم</p>
                <p className="text-xs text-muted-foreground">≥ 35 سنة</p>
              </div>
            </div>
            <Progress value={fbgRate} className="h-2 mb-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{fbgScreened} تم فحصهم</span>
              <span className="font-medium">{fbgRate}%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium">الدهون</p>
                <p className="text-xs text-muted-foreground">ذكور ≥35, إناث ≥45</p>
              </div>
            </div>
            <Progress value={lipidRate} className="h-2 mb-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{lipidScreened} تم فحصهم</span>
              <span className="font-medium">{lipidRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">توزيع الفحوصات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
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
            <CardTitle className="text-lg">الفحوصات حسب النوع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={screeningByAge} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="screened" name="تم الفحص" fill={COLORS.success} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="eligible" name="المؤهلون" fill={COLORS.muted} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PreventiveCareTab;
