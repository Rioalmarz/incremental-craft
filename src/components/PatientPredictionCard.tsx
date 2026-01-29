import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Droplets, Heart, Stethoscope, AlertTriangle, Sparkles } from "lucide-react";
import { generatePrediction, PatientData } from "@/lib/aiPredictionEngine";
import { useMemo } from "react";

interface PatientPredictionCardProps {
  patient: any;
  compact?: boolean;
}

const PatientPredictionCard = ({ patient, compact = false }: PatientPredictionCardProps) => {
  const prediction = useMemo(() => {
    const patientData: PatientData = {
      id: patient.id,
      name: patient.name,
      name_en: patient.name_en,
      age: patient.age,
      gender: patient.gender,
      has_dm: patient.has_dm,
      has_htn: patient.has_htn,
      has_dyslipidemia: patient.has_dyslipidemia,
      hba1c: patient.hba1c,
      ldl: patient.ldl,
      fasting_blood_glucose: patient.fasting_blood_glucose,
      systolic_bp: patient.systolic_bp,
      diastolic_bp: patient.diastolic_bp,
      bmi: patient.bmi,
      visit_count: patient.visit_count,
      dm_medications_count: patient.dm_medications_count,
      htn_medications_count: patient.htn_medications_count,
      dlp_medications_count: patient.dlp_medications_count,
      registration_status: patient.registration_status,
      dispensing_pattern: patient.dispensing_pattern,
      dm_prediction_index: patient.dm_prediction_index,
      htn_prediction_index: patient.htn_prediction_index,
      ldl_prediction_index: patient.ldl_prediction_index,
      priority_level: patient.priority_level,
      priority_reason: patient.priority_reason,
      suggested_action: patient.suggested_action,
      prediction_confidence: patient.prediction_confidence,
    };
    return generatePrediction(patientData);
  }, [patient]);

  const getPriorityColor = () => {
    switch (prediction.priorityLevel) {
      case 'استشاري + مثقف صحي':
        return 'from-destructive/5 to-destructive/10 border-destructive/20';
      case 'أولوية عالية':
        return 'from-warning/5 to-warning/10 border-warning/20';
      default:
        return 'from-success/5 to-success/10 border-success/20';
    }
  };

  const getPriorityBadge = () => {
    switch (prediction.priorityLevel) {
      case 'استشاري + مثقف صحي':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">🔴 {prediction.priorityLevel}</Badge>;
      case 'أولوية عالية':
        return <Badge className="bg-warning/10 text-warning border-warning/20">🟠 {prediction.priorityLevel}</Badge>;
      default:
        return <Badge className="bg-success/10 text-success border-success/20">🟢 {prediction.priorityLevel}</Badge>;
    }
  };

  const getProgressColor = (value: number) => {
    if (value >= 70) return 'bg-success';
    if (value >= 40) return 'bg-warning';
    return 'bg-destructive';
  };

  // Check if patient has any chronic conditions
  const hasChronicConditions = patient.has_dm || patient.has_htn || patient.has_dyslipidemia;

  if (!hasChronicConditions) {
    return null;
  }

  if (compact) {
    return (
      <div className={`p-3 rounded-lg bg-gradient-to-br ${getPriorityColor()}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">التنبؤ AI</span>
          </div>
          {getPriorityBadge()}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {prediction.priorityReason && (
            <span>السبب: {prediction.priorityReason}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${getPriorityColor()}`}>
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="w-5 h-5 text-primary" />
            التنبؤ بالذكاء الاصطناعي
          </CardTitle>
          <Badge className="bg-gradient-to-r from-primary to-accent text-background gap-1">
            <Sparkles className="w-3 h-3" />
            AI
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Prediction Indices */}
        <div className="space-y-3">
          {patient.has_dm && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-primary" />
                  <span className="text-sm">مؤشر تنبؤ السكري</span>
                </div>
                <span className="text-sm font-bold">{prediction.dmPredictionIndex}%</span>
              </div>
              <Progress 
                value={prediction.dmPredictionIndex} 
                className="h-2"
              />
            </div>
          )}
          
          {patient.has_htn && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-info" />
                  <span className="text-sm">مؤشر تنبؤ الضغط</span>
                </div>
                <span className="text-sm font-bold">{prediction.htnPredictionIndex}%</span>
              </div>
              <Progress 
                value={prediction.htnPredictionIndex} 
                className="h-2"
              />
            </div>
          )}
          
          {patient.has_dyslipidemia && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-warning" />
                  <span className="text-sm">مؤشر تنبؤ الدهون</span>
                </div>
                <span className="text-sm font-bold">{prediction.ldlPredictionIndex}%</span>
              </div>
              <Progress 
                value={prediction.ldlPredictionIndex} 
                className="h-2"
              />
            </div>
          )}
        </div>

        {/* Priority Box */}
        <div className="bg-background/50 rounded-lg p-3 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">الأولوية</span>
            {getPriorityBadge()}
          </div>
          
          {prediction.priorityReason && (
            <div className="text-sm mb-2">
              <span className="text-muted-foreground">السبب: </span>
              <span className="font-medium">{prediction.priorityReason}</span>
            </div>
          )}
          
          {prediction.suggestedAction && (
            <div className="text-sm">
              <span className="text-muted-foreground">الإجراء: </span>
              <span>{prediction.suggestedAction}</span>
            </div>
          )}
        </div>

        {/* Risk Factors */}
        {prediction.riskFactors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium">عوامل الخطورة</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {prediction.riskFactors.map((factor, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Confidence */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">نسبة الثقة في التنبؤ</span>
          <span className="text-sm font-medium text-primary">{prediction.confidence}%</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientPredictionCard;
