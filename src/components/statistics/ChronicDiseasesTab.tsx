import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { Activity, Heart, Droplets, Users } from "lucide-react";
import { classifyOverallRisk, classifyHBA1C, classifyBP, classifyLDL } from "@/lib/riskClassification";

interface ChronicDiseasesTabProps {
  patients: any[];
}

const COLORS = {
  dm: '#F44336',
  htn: '#2196F3',
  dyslipidemia: '#9C27B0',
  male: '#2196F3',
  female: '#E91E63',
  controlled: '#4CAF50',
  monitoring: '#FFC107',
  intervention: '#F44336',
};

const ChronicDiseasesTab = ({ patients }: ChronicDiseasesTabProps) => {
  const isMale = (gender: string | null) => 
    gender === "Male" || gender === "ذكر" || gender === "male";
  const isFemale = (gender: string | null) => 
    gender === "Female" || gender === "أنثى" || gender === "female";

  // Calculate real counts from data
  const dmCount = patients.filter(p => p.has_dm === true).length;
  const htnCount = patients.filter(p => p.has_htn === true).length;
  const dlpCount = patients.filter(p => p.has_dyslipidemia === true).length;
  
  // Filter chronic patients
  const chronicPatients = patients.filter(p => p.has_dm || p.has_htn || p.has_dyslipidemia);
  const totalChronic = chronicPatients.length;
  
  // Calculate risk classification for chronic patients
  const riskStats = chronicPatients.reduce((acc, p) => {
    const risk = classifyOverallRisk({
      fasting_blood_glucose: p.fasting_blood_glucose,
      hba1c: p.hba1c,
      ldl: p.ldl,
      bp_last_visit: p.bp_last_visit,
    });
    
    if (risk.overall === 'مسيطر عليه') acc.controlled++;
    else if (risk.overall === 'يحتاج مراقبة') acc.monitoring++;
    else if (risk.overall === 'يحتاج تعديل أو تدخل من الطبيب') acc.intervention++;
    return acc;
  }, { controlled: 0, monitoring: 0, intervention: 0 });

  const riskClassificationData = [
    { name: 'مسيطر عليهم', value: riskStats.controlled, fill: COLORS.controlled },
    { name: 'يحتاجون مراقبة', value: riskStats.monitoring, fill: COLORS.monitoring },
    { name: 'يحتاجون تدخل', value: riskStats.intervention, fill: COLORS.intervention },
  ];
  
  // Calculate disease by gender from real data
  const dmMale = patients.filter(p => p.has_dm && isMale(p.gender)).length;
  const dmFemale = patients.filter(p => p.has_dm && isFemale(p.gender)).length;
  const htnMale = patients.filter(p => p.has_htn && isMale(p.gender)).length;
  const htnFemale = patients.filter(p => p.has_htn && isFemale(p.gender)).length;
  const dlpMale = patients.filter(p => p.has_dyslipidemia && isMale(p.gender)).length;
  const dlpFemale = patients.filter(p => p.has_dyslipidemia && isFemale(p.gender)).length;

  const diseaseByGender = [
    { name: 'السكري', male: dmMale, female: dmFemale },
    { name: 'الضغط', male: htnMale, female: htnFemale },
    { name: 'الدهون', male: dlpMale, female: dlpFemale },
  ];

  // Calculate control rates for each disease
  const dmPatients = patients.filter(p => p.has_dm);
  const dmControlStats = dmPatients.reduce((acc, p) => {
    const result = classifyHBA1C(p.hba1c);
    if (result === "مسيطر عليه") acc.controlled++;
    else if (result === "يحتاج مراقبة") acc.nearControl++;
    else if (result === "يحتاج تعديل أو تدخل من الطبيب") acc.uncontrolled++;
    return acc;
  }, { controlled: 0, nearControl: 0, uncontrolled: 0 });

  const htnPatients = patients.filter(p => p.has_htn);
  const htnControlStats = htnPatients.reduce((acc, p) => {
    const result = classifyBP(p.bp_last_visit);
    if (result === "مسيطر عليه") acc.controlled++;
    else if (result === "يحتاج مراقبة") acc.nearControl++;
    else if (result === "يحتاج تعديل أو تدخل من الطبيب") acc.uncontrolled++;
    return acc;
  }, { controlled: 0, nearControl: 0, uncontrolled: 0 });

  const dlpPatients = patients.filter(p => p.has_dyslipidemia);
  const dlpControlStats = dlpPatients.reduce((acc, p) => {
    const result = classifyLDL(p.ldl);
    if (result === "مسيطر عليه") acc.controlled++;
    else if (result === "يحتاج مراقبة") acc.nearControl++;
    else if (result === "يحتاج تعديل أو تدخل من الطبيب") acc.uncontrolled++;
    return acc;
  }, { controlled: 0, nearControl: 0, uncontrolled: 0 });

  // Calculate percentages
  const dmControlledPct = dmPatients.length > 0 ? Math.round((dmControlStats.controlled / dmPatients.length) * 100) : 0;
  const dmNearPct = dmPatients.length > 0 ? Math.round((dmControlStats.nearControl / dmPatients.length) * 100) : 0;
  const dmUncontrolledPct = dmPatients.length > 0 ? Math.round((dmControlStats.uncontrolled / dmPatients.length) * 100) : 0;

  const htnControlledPct = htnPatients.length > 0 ? Math.round((htnControlStats.controlled / htnPatients.length) * 100) : 0;
  const htnNearPct = htnPatients.length > 0 ? Math.round((htnControlStats.nearControl / htnPatients.length) * 100) : 0;
  const htnUncontrolledPct = htnPatients.length > 0 ? Math.round((htnControlStats.uncontrolled / htnPatients.length) * 100) : 0;

  const dlpControlledPct = dlpPatients.length > 0 ? Math.round((dlpControlStats.controlled / dlpPatients.length) * 100) : 0;
  const dlpNearPct = dlpPatients.length > 0 ? Math.round((dlpControlStats.nearControl / dlpPatients.length) * 100) : 0;
  const dlpUncontrolledPct = dlpPatients.length > 0 ? Math.round((dlpControlStats.uncontrolled / dlpPatients.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dmCount}</p>
                <p className="text-xs text-muted-foreground">السكري</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{htnCount}</p>
                <p className="text-xs text-muted-foreground">الضغط</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dlpCount}</p>
                <p className="text-xs text-muted-foreground">الدهون</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalChronic}</p>
                <p className="text-xs text-muted-foreground">إجمالي المرضى المزمنين</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Disease Control Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            نسبة السيطرة على الأمراض المزمنة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Diabetes Control */}
            <div className="space-y-3">
              <div className="text-center">
                <h4 className="font-semibold text-foreground">السيطرة على السكري</h4>
                <p className="text-sm text-muted-foreground">(HbA1c &lt; 7%)</p>
                <p className="text-xs text-muted-foreground mt-1">({dmPatients.length} مريض)</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-success"></span>
                    🟢 مسيطر
                  </span>
                  <span className="font-bold text-success">{dmControlledPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-warning"></span>
                    🟡 قريب
                  </span>
                  <span className="font-bold text-warning">{dmNearPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-destructive"></span>
                    🔴 غير مسيطر
                  </span>
                  <span className="font-bold text-destructive">{dmUncontrolledPct}%</span>
                </div>
              </div>
            </div>

            {/* Blood Pressure Control */}
            <div className="space-y-3">
              <div className="text-center">
                <h4 className="font-semibold text-foreground">السيطرة على الضغط</h4>
                <p className="text-sm text-muted-foreground">(BP &lt; 140/90)</p>
                <p className="text-xs text-muted-foreground mt-1">({htnPatients.length} مريض)</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-success"></span>
                    مسيطر
                  </span>
                  <span className="font-bold text-success">{htnControlledPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-warning"></span>
                    قريب
                  </span>
                  <span className="font-bold text-warning">{htnNearPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-destructive"></span>
                    غير مسيطر
                  </span>
                  <span className="font-bold text-destructive">{htnUncontrolledPct}%</span>
                </div>
              </div>
            </div>

            {/* Lipids Control */}
            <div className="space-y-3">
              <div className="text-center">
                <h4 className="font-semibold text-foreground">السيطرة على الدهون</h4>
                <p className="text-sm text-muted-foreground">(LDL &lt; 100)</p>
                <p className="text-xs text-muted-foreground mt-1">({dlpPatients.length} مريض)</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-success"></span>
                    مسيطر
                  </span>
                  <span className="font-bold text-success">{dlpControlledPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-warning"></span>
                    قريب
                  </span>
                  <span className="font-bold text-warning">{dlpNearPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-destructive"></span>
                    غير مسيطر
                  </span>
                  <span className="font-bold text-destructive">{dlpUncontrolledPct}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">تصنيف مستوى السيطرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskClassificationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" name="عدد المستفيدين" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الأمراض حسب الجنس</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diseaseByGender}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="male" name="ذكور" fill={COLORS.male} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="female" name="إناث" fill={COLORS.female} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChronicDiseasesTab;
