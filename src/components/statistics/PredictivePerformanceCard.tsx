import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Brain, TrendingUp } from "lucide-react";
import { PILOT_CONFIG } from "@/lib/pilotDataGenerator";
const PredictivePerformanceCard = () => {
  const accuracy = PILOT_CONFIG.predictionAccuracy;
  return <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 border-primary/20">
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
            AI-Assisted Pilot
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
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-background/50 rounded-lg p-3 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-xs text-muted-foreground">مرحلة أولى</span>
              </div>
              <p className="text-sm font-medium">قابل للتحسين</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">المصدر</span>
              </div>
              <p className="text-sm font-medium">بيانات فعلية</p>
            </div>
          </div>
          
          {/* Note */}
          <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
            يعتمد هذا النظام على تحليل البيانات الصحية للتنبؤ بالخدمات الوقائية والعلاجية المطلوبة لكل مستفيد
          </p>
        </div>
      </CardContent>
    </Card>;
};
export default PredictivePerformanceCard;