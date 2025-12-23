import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from "recharts";
import { Heart, UserCheck, Star, ThumbsUp } from "lucide-react";
import GaugeChart from "./GaugeChart";

interface SatisfactionTabProps {
  patients: any[];
}

const SatisfactionTab = ({ patients }: SatisfactionTabProps) => {
  // Calculate satisfaction from real data
  const patientsWithSatisfaction = patients.filter(p => p.satisfaction_score != null && p.satisfaction_score > 0);
  const patientsWithProviderSatisfaction = patients.filter(p => p.provider_satisfaction_score != null && p.provider_satisfaction_score > 0);
  
  const avgSatisfactionScore = patientsWithSatisfaction.length > 0 
    ? patientsWithSatisfaction.reduce((sum, p) => sum + p.satisfaction_score, 0) / patientsWithSatisfaction.length 
    : 0;
  const avgProviderScore = patientsWithProviderSatisfaction.length > 0 
    ? patientsWithProviderSatisfaction.reduce((sum, p) => sum + p.provider_satisfaction_score, 0) / patientsWithProviderSatisfaction.length 
    : 0;
  
  // Convert 1-5 scale to percentage (1=20%, 5=100%)
  const beneficiarySatisfaction = avgSatisfactionScore > 0 ? (avgSatisfactionScore / 5) * 100 : 0;
  const providerSatisfaction = avgProviderScore > 0 ? (avgProviderScore / 5) * 100 : 0;
  
  // Total feedback count
  const totalFeedback = patientsWithSatisfaction.length;
  
  // Satisfaction breakdown
  const satisfactionBreakdown = [
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
              <span className="font-medium">{avgSatisfactionScore.toFixed(1)} / 5</span>
            </div>
            {totalFeedback === 0 && (
              <p className="text-sm text-muted-foreground mt-2">لا توجد تقييمات</p>
            )}
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
              <span className="font-medium">{avgProviderScore.toFixed(1)} / 5</span>
            </div>
            {patientsWithProviderSatisfaction.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">لا توجد تقييمات</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <ThumbsUp className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold">{Math.round(beneficiarySatisfaction)}%</p>
            <p className="text-xs text-muted-foreground">معدل الرضا</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-warning fill-warning" />
            <p className="text-2xl font-bold">{avgSatisfactionScore.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">متوسط التقييم</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="w-8 h-8 mx-auto mb-2 text-destructive" />
            <p className="text-2xl font-bold">{Math.round(providerSatisfaction)}%</p>
            <p className="text-xs text-muted-foreground">رضا مقدم الخدمة</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <UserCheck className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{totalFeedback}</p>
            <p className="text-xs text-muted-foreground">تقييمات مستلمة</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Comparison */}
      {(beneficiarySatisfaction > 0 || providerSatisfaction > 0) && (
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
      )}
      
      {/* No Data Message */}
      {totalFeedback === 0 && patientsWithProviderSatisfaction.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">لا توجد بيانات رضا متاحة حالياً</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SatisfactionTab;
