import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from "recharts";
import { UserX, Phone, AlertTriangle, TrendingDown } from "lucide-react";

interface NotContactedTabProps {
  patients: any[];
}

const COLORS = ['#F44336', '#FF9800', '#FFC107', '#9C27B0', '#607D8B'];

const NON_CONTACT_REASONS = [
  'رقم خاطئ',
  'لا يرد',
  'خارج التغطية',
  'رفض التواصل',
  'أخرى'
];

const NotContactedTab = ({ patients }: NotContactedTabProps) => {
  const totalPatients = patients.length;
  const contactedCount = patients.filter(p => p.contacted === true).length;
  const notContactedCount = totalPatients - contactedCount;
  const notContactedRate = totalPatients > 0 ? Math.round((notContactedCount / totalPatients) * 100) : 0;
  const contactedRate = totalPatients > 0 ? Math.round((contactedCount / totalPatients) * 100) : 0;
  
  // Get non-contact reasons from actual data
  const notContactedPatients = patients.filter(p => p.contacted !== true);
  const reasonsCount = notContactedPatients.reduce((acc, p) => {
    const reason = p.non_delivery_reason || 'أخرى';
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const reasonsData = Object.entries(reasonsCount).map(([name, value], index) => ({
    name,
    value: value as number,
    color: COLORS[index % COLORS.length],
  })).sort((a, b) => b.value - a.value);
  
  // Coverage gap
  const coverageGap = notContactedRate;

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-destructive/20 rounded-xl flex items-center justify-center">
                <UserX className="w-7 h-7 text-destructive" />
              </div>
              <div>
                <p className="text-3xl font-bold text-destructive">{notContactedCount}</p>
                <p className="text-sm text-muted-foreground">لم يتم التواصل</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-warning/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-warning" />
              </div>
              <div>
                <p className="text-3xl font-bold text-warning">{notContactedRate}%</p>
                <p className="text-sm text-muted-foreground">نسبة عدم التواصل</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-muted/30 to-muted/50 border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center">
                <TrendingDown className="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-3xl font-bold">{coverageGap}%</p>
                <p className="text-sm text-muted-foreground">فجوة التغطية</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Impact Card */}
      <Card className="border-warning/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="w-5 h-5" />
            تأثير عدم التواصل على التغطية الصحية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-success/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-success">{contactedRate}%</p>
              <p className="text-sm text-muted-foreground">التغطية الحالية</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">100%</p>
              <p className="text-sm text-muted-foreground">التغطية المستهدفة</p>
            </div>
          </div>
          
          {totalPatients > 0 ? (
            contactedRate >= 80 ? (
              <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                <p className="text-sm">
                  <span className="font-medium text-success">أداء جيد: </span>
                  تم الوصول لـ {contactedRate}% من المستفيدين، مع {notContactedCount} مستفيد لم يتم التواصل معهم
                </p>
              </div>
            ) : (
              <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                <p className="text-sm">
                  <span className="font-medium text-warning">يحتاج تحسين: </span>
                  نسبة التواصل {contactedRate}% - يجب رفعها لتحقيق التغطية المستهدفة
                </p>
              </div>
            )
          ) : (
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground text-center">
                لا توجد بيانات متاحة
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">أسباب عدم التواصل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {reasonsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reasonsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {reasonsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
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
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">تفصيل الأسباب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reasonsData.length > 0 ? (
                reasonsData.map((reason, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: reason.color }}
                        />
                        <span>{reason.name}</span>
                      </div>
                      <span className="font-medium">{reason.value}</span>
                    </div>
                    <Progress 
                      value={notContactedCount > 0 ? (reason.value / notContactedCount) * 100 : 0} 
                      className="h-1.5"
                    />
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  لا توجد بيانات
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotContactedTab;
