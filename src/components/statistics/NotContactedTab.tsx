import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from "recharts";
import { UserX, Phone, AlertTriangle, TrendingDown } from "lucide-react";
import { calculatePilotStatistics, NON_CONTACT_REASONS } from "@/lib/pilotDataGenerator";

interface NotContactedTabProps {
  patients: any[];
}

const COLORS = ['#F44336', '#FF9800', '#FFC107', '#9C27B0', '#607D8B'];

const NotContactedTab = ({ patients }: NotContactedTabProps) => {
  const stats = calculatePilotStatistics(patients);
  
  // Simulate non-contact reasons distribution
  const notContactedCount = stats.notContacted;
  const reasonsData = NON_CONTACT_REASONS.map((reason, index) => ({
    name: reason,
    value: Math.round(notContactedCount * [0.35, 0.25, 0.18, 0.12, 0.10][index]),
    color: COLORS[index],
  }));
  
  // Impact on coverage
  const coverageWithContact = stats.contactedRate;
  const potentialCoverage = 100;
  const coverageGap = potentialCoverage - coverageWithContact;

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
                <p className="text-3xl font-bold text-destructive">{stats.notContacted}</p>
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
                <p className="text-3xl font-bold text-warning">{Math.round(100 - stats.contactedRate)}%</p>
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
                <p className="text-3xl font-bold">{Math.round(coverageGap)}%</p>
                <p className="text-sm text-muted-foreground">فجوة التغطية</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Impact Card */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            تأثير عدم التواصل على التغطية الصحية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-success/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-success">{Math.round(coverageWithContact)}%</p>
              <p className="text-sm text-muted-foreground">التغطية الحالية</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{potentialCoverage}%</p>
              <p className="text-sm text-muted-foreground">التغطية المستهدفة</p>
            </div>
          </div>
          
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm">
              <span className="font-medium text-destructive">الأثر: </span>
              عدم التواصل مع {stats.notContacted} مستفيد يؤثر على {Math.round(coverageGap)}% من التغطية الصحية المستهدفة
            </p>
          </div>
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
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">تفصيل الأسباب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reasonsData.map((reason, index) => (
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
                    value={(reason.value / notContactedCount) * 100} 
                    className="h-1.5"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotContactedTab;
