import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Ambulance, AlertTriangle, Heart, Activity, Droplets, Users, TrendingUp
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface EmergencyReferralTabProps {
  patients: any[];
}

const EmergencyReferralTab = ({ patients }: EmergencyReferralTabProps) => {
  // Fixed statistics for emergency referrals
  const totalPatients = 594;
  const emergencyCount = 2;
  const emergencyRate = ((emergencyCount / totalPatients) * 100).toFixed(2);
  
  // Age distribution data
  const ageDistribution = [
    { name: '75-79 سنة', value: 1, color: '#F44336' },
    { name: '80+ سنة', value: 1, color: '#D32F2F' },
  ];
  
  // Gender distribution
  const genderData = [
    { name: 'ذكور', value: 1, color: '#2196F3' },
    { name: 'إناث', value: 1, color: '#E91E63' },
  ];
  
  // Diseases data - all emergency cases have all 3 diseases
  const diseasesData = [
    { name: 'السكري', count: 2, percentage: 100 },
    { name: 'ضغط الدم', count: 2, percentage: 100 },
    { name: 'الدهون', count: 2, percentage: 100 },
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
              {emergencyCount} حالات
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-destructive/30">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Ambulance className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-3xl font-bold text-destructive">{emergencyCount}</p>
            <p className="text-sm text-muted-foreground">إجمالي التحويلات</p>
          </CardContent>
        </Card>
        
        <Card className="border-warning/30">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-warning" />
            </div>
            <p className="text-3xl font-bold text-warning">{emergencyRate}%</p>
            <p className="text-sm text-muted-foreground">نسبة التحويل</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">80</p>
            <p className="text-sm text-muted-foreground">متوسط العمر</p>
          </CardContent>
        </Card>
        
        <Card className="border-success/30">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-success" />
            </div>
            <p className="text-3xl font-bold text-success">100%</p>
            <p className="text-sm text-muted-foreground">نسبة التحويل الناجح</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">توزيع الفئات العمرية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ageDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {ageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {ageDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">توزيع الجنس</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {genderData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diseases Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">الأمراض المزمنة للحالات المحولة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {diseasesData.map((disease, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium flex items-center gap-2">
                  {disease.name === 'السكري' && <Activity className="w-4 h-4 text-destructive" />}
                  {disease.name === 'ضغط الدم' && <Heart className="w-4 h-4 text-destructive" />}
                  {disease.name === 'الدهون' && <Droplets className="w-4 h-4 text-destructive" />}
                  {disease.name}
                </div>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div 
                    className="h-full bg-destructive rounded-full transition-all duration-500"
                    style={{ width: `${disease.percentage}%` }}
                  />
                </div>
                <div className="w-20 text-left">
                  <span className="font-bold text-destructive">{disease.percentage}%</span>
                  <span className="text-muted-foreground text-sm mr-1">({disease.count})</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm">
              <span className="font-medium text-destructive">ملاحظة: </span>
              جميع حالات التحويل للطوارئ ({emergencyCount} مستفيدين) يعانون من الأمراض المزمنة الثلاثة معاً 
              (السكري + ضغط الدم + الدهون) مما يزيد من خطورة حالتهم الصحية
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-muted/50 to-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">ملخص حالات الطوارئ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-background rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">الفئة العمرية</p>
              <p className="text-lg font-bold">كبار السن (75+ سنة)</p>
            </div>
            <div className="p-4 bg-background rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">عدد الأمراض المزمنة</p>
              <p className="text-lg font-bold text-destructive">3 أمراض لكل مستفيد</p>
            </div>
            <div className="p-4 bg-background rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">نتيجة التحويل</p>
              <p className="text-lg font-bold text-success">تحويل ناجح 100%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyReferralTab;
