import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { UserCheck, CheckCircle, Pill, Stethoscope, FileText } from "lucide-react";
import { calculatePilotStatistics } from "@/lib/pilotDataGenerator";

interface ContactedTabProps {
  patients: any[];
}

const COLORS = {
  success: '#4CAF50',
  primary: '#00BCD4',
  warning: '#FFC107',
  danger: '#F44336',
  purple: '#9C27B0',
};

const ContactedTab = ({ patients }: ContactedTabProps) => {
  const stats = calculatePilotStatistics(patients);
  
  // Service types delivered (simulated distribution)
  const totalServiced = stats.serviceDelivered;
  const serviceTypes = [
    { name: 'صرف أدوية', value: Math.round(totalServiced * 0.35), color: COLORS.primary },
    { name: 'فحوصات مخبرية', value: Math.round(totalServiced * 0.25), color: COLORS.success },
    { name: 'موعد عيادة', value: Math.round(totalServiced * 0.20), color: COLORS.warning },
    { name: 'تحويل تخصصي', value: Math.round(totalServiced * 0.12), color: COLORS.purple },
    { name: 'لا يحتاج تدخل', value: Math.round(totalServiced * 0.08), color: COLORS.danger },
  ];

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center">
                <UserCheck className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.contacted}</p>
                <p className="text-sm text-muted-foreground">تم التواصل معهم</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-success/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-success" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.serviceDelivered}</p>
                <p className="text-sm text-muted-foreground">تم تقديم الخدمة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-success">{Math.round(stats.serviceDeliveredRate)}%</p>
                <p className="text-sm text-muted-foreground">نسبة الإنجاز</p>
              </div>
              <Badge className="bg-success/20 text-success">
                {stats.serviceDelivered} / {stats.contacted}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>نسبة تقديم الخدمة من المتواصل معهم</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={stats.serviceDeliveredRate} className="h-4 mb-4" />
          <div className="flex justify-between text-sm">
            <span className="text-success">تم تقديم الخدمة: {stats.serviceDelivered}</span>
            <span className="text-muted-foreground">لم يتم تقديم الخدمة: {stats.serviceNotDelivered}</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">نوع الخدمات المقدمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {serviceTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">تفصيل الخدمات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {serviceTypes.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: service.color }}
                    />
                    <span>{service.name}</span>
                  </div>
                  <Badge variant="outline">{service.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactedTab;
