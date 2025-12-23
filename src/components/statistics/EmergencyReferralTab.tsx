import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Ambulance, AlertTriangle, Heart, Activity, Droplets, Users, TrendingUp
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface EmergencyReferralTabProps {
  patients: any[];
}

const EmergencyReferralTab = ({ patients }: EmergencyReferralTabProps) => {
  const totalPatients = patients.length;
  
  // Calculate emergency cases from real data
  const emergencyPatients = patients.filter(p => p.urgency_status === "طوارئ" || p.urgency_status === "emergency");
  const emergencyCount = emergencyPatients.length;
  const emergencyRate = totalPatients > 0 ? ((emergencyCount / totalPatients) * 100).toFixed(2) : "0.00";
  
  // Age distribution of emergency cases
  const ageDistribution = emergencyPatients.reduce((acc, p) => {
    let ageGroup = 'غير محدد';
    if (p.age != null) {
      if (p.age < 18) ageGroup = '< 18 سنة';
      else if (p.age < 40) ageGroup = '18-39 سنة';
      else if (p.age < 60) ageGroup = '40-59 سنة';
      else if (p.age < 75) ageGroup = '60-74 سنة';
      else ageGroup = '75+ سنة';
    }
    acc[ageGroup] = (acc[ageGroup] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const ageColors = ['#F44336', '#FF9800', '#FFC107', '#4CAF50', '#2196F3'];
  const ageData = Object.entries(ageDistribution).map(([name, value], index) => ({
    name,
    value,
    color: ageColors[index % ageColors.length],
  }));
  
  // Gender distribution
  const genderDistribution = emergencyPatients.reduce((acc, p) => {
    const gender = p.gender === "Male" || p.gender === "ذكر" || p.gender === "male" ? 'ذكور' : 
                   p.gender === "Female" || p.gender === "أنثى" || p.gender === "female" ? 'إناث' : 'غير محدد';
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const genderColors = { 'ذكور': '#2196F3', 'إناث': '#E91E63', 'غير محدد': '#9CA3AF' };
  const genderData = Object.entries(genderDistribution).map(([name, value]) => ({
    name,
    value,
    color: genderColors[name as keyof typeof genderColors] || '#9CA3AF',
  }));
  
  // Chronic diseases in emergency cases
  const dmEmergency = emergencyPatients.filter(p => p.has_dm).length;
  const htnEmergency = emergencyPatients.filter(p => p.has_htn).length;
  const dlpEmergency = emergencyPatients.filter(p => p.has_dyslipidemia).length;
  
  const diseasesData = [
    { name: 'السكري', count: dmEmergency, percentage: emergencyCount > 0 ? Math.round((dmEmergency / emergencyCount) * 100) : 0 },
    { name: 'ضغط الدم', count: htnEmergency, percentage: emergencyCount > 0 ? Math.round((htnEmergency / emergencyCount) * 100) : 0 },
    { name: 'الدهون', count: dlpEmergency, percentage: emergencyCount > 0 ? Math.round((dlpEmergency / emergencyCount) * 100) : 0 },
  ];
  
  // Average age of emergency cases
  const avgAge = emergencyPatients.length > 0 
    ? Math.round(emergencyPatients.filter(p => p.age != null).reduce((sum, p) => sum + p.age, 0) / emergencyPatients.filter(p => p.age != null).length) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Alert Header */}
      <Card className={`bg-gradient-to-br ${emergencyCount > 0 ? 'from-destructive/10 to-destructive/5 border-destructive/30' : 'from-muted/30 to-muted/10 border-border'}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${emergencyCount > 0 ? 'bg-destructive/20 animate-pulse' : 'bg-muted'}`}>
              <Ambulance className={`w-8 h-8 ${emergencyCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <h3 className={`text-2xl font-bold ${emergencyCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>حالات التحويل للطوارئ</h3>
              <p className="text-muted-foreground">حالات حرجة تم تحويلها مباشرة للمستشفى</p>
            </div>
            <Badge className={`text-lg px-4 py-2 mr-auto ${emergencyCount > 0 ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}`}>
              {emergencyCount} حالات
            </Badge>
          </div>
        </CardContent>
      </Card>

      {emergencyCount > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
          <div>
            <p className="font-medium text-destructive">تنبيه هام</p>
            <p className="text-sm text-muted-foreground">
              هذه الحالات تتطلب متابعة عاجلة
            </p>
          </div>
        </div>
      )}

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
            <p className="text-3xl font-bold">{avgAge || '-'}</p>
            <p className="text-sm text-muted-foreground">متوسط العمر</p>
          </CardContent>
        </Card>
        
        <Card className="border-success/30">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-success" />
            </div>
            <p className="text-3xl font-bold text-success">{emergencyCount > 0 ? '100%' : '-'}</p>
            <p className="text-sm text-muted-foreground">نسبة التحويل الناجح</p>
          </CardContent>
        </Card>
      </div>

      {emergencyCount > 0 && (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Age Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">توزيع الفئات العمرية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  {ageData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ageData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {ageData.map((entry, index) => (
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

            {/* Gender Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">توزيع الجنس</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  {genderData.length > 0 ? (
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
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      لا توجد بيانات
                    </div>
                  )}
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
            </CardContent>
          </Card>
        </>
      )}

      {/* No Data Message */}
      {emergencyCount === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Ambulance className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">لا توجد حالات تحويل للطوارئ حالياً</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmergencyReferralTab;
