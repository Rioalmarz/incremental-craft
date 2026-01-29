import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Brain, TrendingUp, AlertTriangle, CheckCircle2, 
  Users, Activity, Heart, Droplets, Stethoscope 
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { generatePrediction, calculatePredictionStatistics, PatientData } from "@/lib/aiPredictionEngine";
import { useMemo } from "react";

interface AIPredictionTabProps {
  patients: any[];
}

const AIPredictionTab = ({ patients }: AIPredictionTabProps) => {
  // Convert patients to PatientData format and calculate statistics
  const stats = useMemo(() => {
    const patientData: PatientData[] = patients.map(p => ({
      id: p.id,
      name: p.name,
      name_en: p.name_en,
      age: p.age,
      gender: p.gender,
      has_dm: p.has_dm,
      has_htn: p.has_htn,
      has_dyslipidemia: p.has_dyslipidemia,
      hba1c: p.hba1c,
      ldl: p.ldl,
      fasting_blood_glucose: p.fasting_blood_glucose,
      systolic_bp: p.systolic_bp,
      diastolic_bp: p.diastolic_bp,
      bmi: p.bmi,
      visit_count: p.visit_count,
      last_visit_date: p.last_visit_date,
      predicted_visit_date: p.predicted_visit_date,
      days_until_visit: p.days_until_visit,
      dm_medications_count: p.dm_medications_count,
      htn_medications_count: p.htn_medications_count,
      dlp_medications_count: p.dlp_medications_count,
      anticoagulant_count: p.anticoagulant_count,
      total_chronic_meds: p.total_chronic_meds,
      registration_status: p.registration_status,
      dispensing_pattern: p.dispensing_pattern,
      dm_prediction_index: p.dm_prediction_index,
      htn_prediction_index: p.htn_prediction_index,
      ldl_prediction_index: p.ldl_prediction_index,
      priority_level: p.priority_level,
      priority_reason: p.priority_reason,
      suggested_action: p.suggested_action,
      prediction_confidence: p.prediction_confidence,
    }));
    
    return calculatePredictionStatistics(patientData);
  }, [patients]);

  // Get top priority patients for the table
  const priorityPatients = useMemo(() => {
    return patients
      .map(p => {
        const prediction = generatePrediction(p as PatientData);
        return { ...p, prediction };
      })
      .filter(p => p.prediction.priorityLevel !== 'روتيني')
      .sort((a, b) => {
        const priorityOrder = { 'استشاري + مثقف صحي': 0, 'أولوية عالية': 1, 'روتيني': 2 };
        return (priorityOrder[a.prediction.priorityLevel] || 2) - (priorityOrder[b.prediction.priorityLevel] || 2);
      })
      .slice(0, 10);
  }, [patients]);

  // Pie chart data for priority distribution
  const priorityPieData = [
    { name: 'استشاري + مثقف صحي', value: stats.priorityDistribution.consultant, color: 'hsl(var(--destructive))' },
    { name: 'أولوية عالية', value: stats.priorityDistribution.high, color: 'hsl(var(--warning))' },
    { name: 'روتيني', value: stats.priorityDistribution.routine, color: 'hsl(var(--success))' },
  ].filter(d => d.value > 0);

  // Bar chart data for prediction indices
  const indexBarData = [
    { name: 'السكري', value: stats.avgDMIndex, fill: 'hsl(var(--primary))' },
    { name: 'الضغط', value: stats.avgHTNIndex, fill: 'hsl(var(--info))' },
    { name: 'الدهون', value: stats.avgLDLIndex, fill: 'hsl(var(--warning))' },
  ];

  const getPriorityBadge = (level: string) => {
    switch (level) {
      case 'استشاري + مثقف صحي':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">🔴 {level}</Badge>;
      case 'أولوية عالية':
        return <Badge className="bg-warning/10 text-warning border-warning/20">🟠 {level}</Badge>;
      default:
        return <Badge className="bg-success/10 text-success border-success/20">🟢 {level}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <Brain className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-primary">{stats.avgConfidence}%</p>
            <p className="text-sm text-muted-foreground">دقة التنبؤ</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-destructive" />
            <p className="text-2xl font-bold text-destructive">{stats.priorityDistribution.consultant}</p>
            <p className="text-sm text-muted-foreground">استشاري + مثقف</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-warning" />
            <p className="text-2xl font-bold text-warning">{stats.priorityDistribution.high}</p>
            <p className="text-sm text-muted-foreground">أولوية عالية</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold text-success">{stats.priorityDistribution.routine}</p>
            <p className="text-sm text-muted-foreground">روتيني</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Priority Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              توزيع الأولويات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {priorityPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              {priorityPieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Prediction Indices Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              متوسط مؤشرات التنبؤ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={indexBarData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={60} />
                  <Tooltip formatter={(value) => [`${value}%`, 'المؤشر']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {indexBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Individual Progress Bars */}
            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-3">
                <Droplets className="w-4 h-4 text-primary" />
                <span className="text-sm w-16">السكري</span>
                <Progress value={stats.avgDMIndex} className="flex-1 h-2" />
                <span className="text-sm font-medium w-12 text-left">{stats.avgDMIndex}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-info" />
                <span className="text-sm w-16">الضغط</span>
                <Progress value={stats.avgHTNIndex} className="flex-1 h-2" />
                <span className="text-sm font-medium w-12 text-left">{stats.avgHTNIndex}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Stethoscope className="w-4 h-4 text-warning" />
                <span className="text-sm w-16">الدهون</span>
                <Progress value={stats.avgLDLIndex} className="flex-1 h-2" />
                <span className="text-sm font-medium w-12 text-left">{stats.avgLDLIndex}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            قائمة المرضى حسب الأولوية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {priorityPatients.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">HbA1c</TableHead>
                    <TableHead className="text-right">LDL</TableHead>
                    <TableHead className="text-right">BP</TableHead>
                    <TableHead className="text-right">الأولوية</TableHead>
                    <TableHead className="text-right">السبب</TableHead>
                    <TableHead className="text-right">الإجراء المقترح</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priorityPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>
                        {patient.hba1c ? (
                          <span className={patient.hba1c >= 9 ? 'text-destructive font-bold' : ''}>
                            {patient.hba1c}%
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {patient.ldl ? (
                          <span className={patient.ldl >= 160 ? 'text-destructive font-bold' : ''}>
                            {Math.round(patient.ldl)}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {patient.systolic_bp ? (
                          <span className={patient.systolic_bp >= 160 ? 'text-destructive font-bold' : ''}>
                            {patient.systolic_bp}/{patient.diastolic_bp || '-'}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{getPriorityBadge(patient.prediction.priorityLevel)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {patient.prediction.priorityReason}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {patient.prediction.suggestedAction}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-success" />
              <p>جميع المرضى ضمن الفئة الروتينية</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Note */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium mb-1">ملاحظة حول التنبؤات</p>
              <p className="text-sm text-muted-foreground">
                يعتمد نظام التنبؤ على تحليل البيانات المخبرية (HbA1c, LDL, BP) وأنماط الزيارات والأدوية. 
                دقة التنبؤ تزداد مع توفر المزيد من البيانات للمريض. 
                تصنيف الأولوية يتم آلياً بناءً على معايير سريرية محددة.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIPredictionTab;
