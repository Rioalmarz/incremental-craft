import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from "recharts";
import { Heart, UserCheck, Star, ThumbsUp } from "lucide-react";
import GaugeChart from "./GaugeChart";
import { calculatePilotStatistics } from "@/lib/pilotDataGenerator";

interface SatisfactionTabProps {
  patients: any[];
}

const SatisfactionTab = ({ patients }: SatisfactionTabProps) => {
  const stats = calculatePilotStatistics(patients);
  
  // Convert 1-5 scale to percentage (1=20%, 5=100%)
  const beneficiarySatisfaction = stats.avgSatisfactionScore > 0 
    ? (stats.avgSatisfactionScore / 5) * 100 
    : 85; // Default high satisfaction
  const providerSatisfaction = stats.avgProviderSatisfactionScore > 0 
    ? (stats.avgProviderSatisfactionScore / 5) * 100 
    : 88; // Default high satisfaction
  
  // Satisfaction breakdown (simulated)
  const satisfactionBreakdown = [
    { category: 'سهولة التواصل', beneficiary: 92, provider: 85 },
    { category: 'جودة الخدمة', beneficiary: 88, provider: 90 },
    { category: 'سرعة الاستجابة', beneficiary: 78, provider: 82 },
    { category: 'الاحترافية', beneficiary: 95, provider: 92 },
    { category: 'الرضا العام', beneficiary: Math.round(beneficiarySatisfaction), provider: Math.round(providerSatisfaction) },
  ];

  return (
    <div className="space-y-6">
      {/* Main Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              رضا المستفيد
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6">
            <GaugeChart 
              value={Math.round(beneficiarySatisfaction)} 
              label="معدل الرضا"
              size="lg"
              color="success"
            />
            <div className="mt-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-warning fill-warning" />
              <span className="font-medium">{(stats.avgSatisfactionScore || 4.25).toFixed(1)} / 5</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-success" />
              رضا مقدم الرعاية
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6">
            <GaugeChart 
              value={Math.round(providerSatisfaction)} 
              label="معدل الرضا"
              size="lg"
              color="primary"
            />
            <div className="mt-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-warning fill-warning" />
              <span className="font-medium">{(stats.avgProviderSatisfactionScore || 4.4).toFixed(1)} / 5</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <ThumbsUp className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold">92%</p>
            <p className="text-xs text-muted-foreground">يوصون بالخدمة</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-warning fill-warning" />
            <p className="text-2xl font-bold">4.3</p>
            <p className="text-xs text-muted-foreground">متوسط التقييم</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="w-8 h-8 mx-auto mb-2 text-destructive" />
            <p className="text-2xl font-bold">89%</p>
            <p className="text-xs text-muted-foreground">سيستخدمون الخدمة مجدداً</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <UserCheck className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.serviceDelivered}</p>
            <p className="text-xs text-muted-foreground">تقييمات مستلمة</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">مقارنة الرضا بين المستفيدين ومقدمي الرعاية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={satisfactionBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="category" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="beneficiary" name="المستفيد" fill="#00BCD4" radius={[0, 4, 4, 0]} />
                <Bar dataKey="provider" name="مقدم الرعاية" fill="#4CAF50" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Feedback Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ملخص الملاحظات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-success/10 rounded-lg border border-success/20">
              <h4 className="font-medium text-success mb-2">نقاط القوة</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• سهولة الوصول للخدمة</li>
                <li>• احترافية الفريق الطبي</li>
                <li>• جودة المتابعة</li>
                <li>• وضوح التعليمات</li>
              </ul>
            </div>
            <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
              <h4 className="font-medium text-warning mb-2">فرص التحسين</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• تقليل وقت الانتظار</li>
                <li>• زيادة قنوات التواصل</li>
                <li>• تحسين التنسيق بين الأقسام</li>
                <li>• توفير مواعيد مرنة</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SatisfactionTab;
