import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Phone, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import GaugeChart from "./GaugeChart";
import { PILOT_CONFIG, calculatePilotStatistics } from "@/lib/pilotDataGenerator";

interface CommunicationEfficiencyTabProps {
  patients: any[];
}

const CommunicationEfficiencyTab = ({ patients }: CommunicationEfficiencyTabProps) => {
  const stats = calculatePilotStatistics(patients);
  
  // Simulated response time data
  const avgResponseTime = 2.3; // days
  const targetResponseTime = 3; // days
  const responseEfficiency = Math.min((targetResponseTime / avgResponseTime) * 100, 100);
  
  // Opportunity gap
  const opportunityGap = 100 - stats.contactedRate;

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="p-4 text-center">
            <GaugeChart 
              value={Math.round(stats.contactedRate)} 
              label="نسبة نجاح التواصل" 
              color="success"
              size="md"
            />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <p className="text-3xl font-bold text-primary">{avgResponseTime}</p>
              <p className="text-sm text-muted-foreground text-center">متوسط وقت الاستجابة (أيام)</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="p-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <p className="text-3xl font-bold text-warning">{Math.round(opportunityGap)}%</p>
              <p className="text-sm text-muted-foreground text-center">فجوة التحسين</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-info/5 to-info/10 border-info/20">
          <CardContent className="p-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-info/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-info" />
              </div>
              <p className="text-3xl font-bold text-info">{Math.round(responseEfficiency)}%</p>
              <p className="text-sm text-muted-foreground text-center">كفاءة الاستجابة</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              تفاصيل التواصل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
              <span>تم التواصل</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-success">{stats.contacted}</span>
                <Badge className="bg-success/20 text-success">
                  {Math.round(stats.contactedRate)}%
                </Badge>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span>لم يتم التواصل</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{stats.notContacted}</span>
                <Badge variant="outline">
                  {Math.round(100 - stats.contactedRate)}%
                </Badge>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">الإجمالي</span>
                <span className="font-bold text-xl">{stats.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-warning" />
              فرص التحسين
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>النسبة المستهدفة</span>
                <span className="font-medium">80%</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>النسبة الحالية</span>
                <span className="font-medium text-success">{Math.round(stats.contactedRate)}%</span>
              </div>
              <Progress value={stats.contactedRate} className="h-2" />
            </div>
            
            <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
              <p className="text-sm">
                <span className="font-medium text-warning">فجوة التحسين: </span>
                يمكن تحسين التواصل مع {stats.notContacted} مستفيد إضافي للوصول للهدف
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 bg-muted/30 rounded">
                <p className="text-xs text-muted-foreground">متوسط المحاولات</p>
                <p className="font-bold">2.4</p>
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <p className="text-xs text-muted-foreground">معدل الرد</p>
                <p className="font-bold">72%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunicationEfficiencyTab;
