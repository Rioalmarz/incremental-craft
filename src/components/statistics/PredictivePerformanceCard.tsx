import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Brain, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculatePredictionStatistics, PatientData } from "@/lib/aiPredictionEngine";
import { useMemo } from "react";

const PredictivePerformanceCard = () => {
  const { data: patients = [] } = useQuery({
    queryKey: ['patients-prediction-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate statistics from real patient data
  const stats = useMemo(() => {
    if (patients.length === 0) {
      return {
        avgConfidence: 0,
        avgDMIndex: 0,
        avgHTNIndex: 0,
        avgLDLIndex: 0,
        priorityDistribution: { consultant: 0, high: 0, routine: 0 },
        totalWithPredictions: 0,
      };
    }

    const patientData: PatientData[] = patients.map(p => ({
      id: p.id,
      name: p.name,
      has_dm: p.has_dm,
      has_htn: p.has_htn,
      has_dyslipidemia: p.has_dyslipidemia,
      hba1c: p.hba1c ? Number(p.hba1c) : undefined,
      ldl: p.ldl ? Number(p.ldl) : undefined,
      systolic_bp: p.systolic_bp,
      diastolic_bp: p.diastolic_bp,
      bmi: p.bmi ? Number(p.bmi) : undefined,
      visit_count: p.visit_count,
      dm_medications_count: p.dm_medications_count,
      htn_medications_count: p.htn_medications_count,
      dlp_medications_count: p.dlp_medications_count,
      dm_prediction_index: p.dm_prediction_index,
      htn_prediction_index: p.htn_prediction_index,
      ldl_prediction_index: p.ldl_prediction_index,
      priority_level: p.priority_level,
      prediction_confidence: p.prediction_confidence,
    }));

    return calculatePredictionStatistics(patientData);
  }, [patients]);

  const accuracy = stats.avgConfidence;
  const totalPriority = stats.priorityDistribution.consultant + stats.priorityDistribution.high;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 border-primary/20">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
      
      <CardContent className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-background" />
            </div>
            <div>
              <h3 className="font-bold text-lg">التنبؤ بالخدمات الوقائية و العلاجية</h3>
              <p className="text-sm text-muted-foreground">Predictive Service Performance</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-primary to-accent text-background gap-1 shadow-lg">
            <Sparkles className="w-3 h-3" />
            AI-Powered
          </Badge>
        </div>
        
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">دقة التنبؤ</span>
              <span className="text-2xl font-bold text-primary">{accuracy}%</span>
            </div>
            <Progress value={accuracy} className="h-3" />
          </div>
          
          {/* Info cards */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-background/50 rounded-lg p-3 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-xs text-muted-foreground">استشاري</span>
              </div>
              <p className="text-lg font-bold text-destructive">{stats.priorityDistribution.consultant}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-warning" />
                <span className="text-xs text-muted-foreground">أولوية عالية</span>
              </div>
              <p className="text-lg font-bold text-warning">{stats.priorityDistribution.high}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-xs text-muted-foreground">روتيني</span>
              </div>
              <p className="text-lg font-bold text-success">{stats.priorityDistribution.routine}</p>
            </div>
          </div>
          
          {/* Note */}
          <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
            يعتمد هذا النظام على تحليل البيانات الصحية للتنبؤ بالخدمات الوقائية والعلاجية المطلوبة لكل مستفيد.
            إجمالي المرضى المحللين: {patients.length} مستفيد
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictivePerformanceCard;