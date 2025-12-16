import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { Baby, Phone, ClipboardCheck, BookOpen } from "lucide-react";
import { generatePilotDataForPatient, hashPatientId } from "@/lib/pilotDataGenerator";

interface HealthyChildTabProps {
  patients: any[];
}

const COLORS = {
  success: '#4CAF50',
  primary: '#00BCD4',
  warning: '#FFC107',
  muted: '#9CA3AF',
};

const HealthyChildTab = ({ patients }: HealthyChildTabProps) => {
  // Filter children (< 18 years)
  const children = patients.filter(p => p.age != null && p.age < 18);
  
  // Generate pilot data for children
  const childrenWithPilot = children.map(p => {
    if (p.contacted !== undefined && p.contacted !== null) return p;
    const pilotData = generatePilotDataForPatient(hashPatientId(p.id), p.age, {});
    return { ...p, ...pilotData };
  });
  
  const contacted = childrenWithPilot.filter(p => p.contacted).length;
  const contactRate = children.length > 0 ? (contacted / children.length) * 100 : 0;
  
  // Service type distribution (simulated based on age)
  const serviceTypes = {
    assessment: childrenWithPilot.filter(p => p.age && p.age < 5).length,
    followup: childrenWithPilot.filter(p => p.age && p.age >= 5 && p.age < 12).length,
    guidance: childrenWithPilot.filter(p => p.age && p.age >= 12).length,
  };
  
  const ageGroups = [
    { name: '0-2 سنة', value: children.filter(p => p.age != null && p.age <= 2).length },
    { name: '3-5 سنوات', value: children.filter(p => p.age != null && p.age > 2 && p.age <= 5).length },
    { name: '6-11 سنة', value: children.filter(p => p.age != null && p.age > 5 && p.age < 12).length },
    { name: '12-17 سنة', value: children.filter(p => p.age != null && p.age >= 12 && p.age < 18).length },
  ];
  
  const serviceData = [
    { name: 'تقييم', value: serviceTypes.assessment, color: COLORS.primary },
    { name: 'متابعة', value: serviceTypes.followup, color: COLORS.success },
    { name: 'توجيه', value: serviceTypes.guidance, color: COLORS.warning },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Baby className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{children.length}</p>
                <p className="text-xs text-muted-foreground">الأطفال المؤهلون</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contacted}</p>
                <p className="text-xs text-muted-foreground">تم التواصل معهم</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{serviceTypes.assessment}</p>
                <p className="text-xs text-muted-foreground">تقييم</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-info/5 to-info/10 border-info/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-info/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{serviceTypes.guidance}</p>
                <p className="text-xs text-muted-foreground">توجيه</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Contact Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>نسبة التواصل مع الأطفال</span>
            <Badge variant="outline" className="text-lg">
              {Math.round(contactRate)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={contactRate} className="h-4 mb-4" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>تم التواصل: {contacted}</span>
            <span>لم يتم التواصل: {children.length - contacted}</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">نوع الخدمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {serviceData.map((entry, index) => (
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
            <CardTitle className="text-lg">الفئات العمرية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageGroups}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="العدد" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthyChildTab;
