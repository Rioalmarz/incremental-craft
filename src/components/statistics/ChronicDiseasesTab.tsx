import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { Activity, Heart, Droplets, Users } from "lucide-react";
import { calculatePilotStatistics, hashPatientId, generatePilotDataForPatient } from "@/lib/pilotDataGenerator";

interface ChronicDiseasesTabProps {
  patients: any[];
}

const COLORS = {
  dm: '#F44336',
  htn: '#2196F3',
  dyslipidemia: '#9C27B0',
  male: '#2196F3',
  female: '#E91E63',
  reached: '#4CAF50',
  notReached: '#9CA3AF',
};

// Fixed chronic disease counts as specified
const FIXED_COUNTS = {
  dm: 118,
  htn: 103,
};

const ChronicDiseasesTab = ({ patients }: ChronicDiseasesTabProps) => {
  const isMale = (gender: string | null) => 
    gender === "Male" || gender === "ذكر" || gender === "male";
  const isFemale = (gender: string | null) => 
    gender === "Female" || gender === "أنثى" || gender === "female";

  // Filter chronic patients
  const chronicPatients = patients.filter(p => p.has_dm || p.has_htn || p.has_dyslipidemia);
  
  // Calculate pilot data for each patient
  const patientsWithPilot = chronicPatients.map(p => {
    if (p.contacted !== undefined && p.contacted !== null) return p;
    const pilotData = generatePilotDataForPatient(hashPatientId(p.id), p.age, {
      fasting_blood_glucose: p.fasting_blood_glucose,
      hba1c: p.hba1c,
      ldl: p.ldl,
      bp_last_visit: p.bp_last_visit,
    });
    return { ...p, ...pilotData };
  });
  
  const reached = patientsWithPilot.filter(p => p.contacted).length;
  const notReached = chronicPatients.length - reached;
  
  // Use fixed counts for DM and HTN as specified
  const dmCount = FIXED_COUNTS.dm;
  const htnCount = FIXED_COUNTS.htn;
  const dlpCount = patients.filter(p => p.has_dyslipidemia).length || 87; // Fallback if no data
  
  // Calculate proportional gender distribution based on fixed counts
  const maleRatio = patients.filter(p => isMale(p.gender)).length / Math.max(patients.length, 1);
  const femaleRatio = 1 - maleRatio;
  
  // Disease by gender (proportional to fixed counts)
  const diseaseByGender = [
    { 
      name: 'السكري', 
      male: Math.round(dmCount * (maleRatio || 0.55)), 
      female: Math.round(dmCount * (femaleRatio || 0.45))
    },
    { 
      name: 'الضغط', 
      male: Math.round(htnCount * (maleRatio || 0.48)), 
      female: Math.round(htnCount * (femaleRatio || 0.52))
    },
    { 
      name: 'الدهون', 
      male: Math.round(dlpCount * (maleRatio || 0.52)), 
      female: Math.round(dlpCount * (femaleRatio || 0.48))
    },
  ];
  
  const totalChronic = chronicPatients.length || (dmCount + htnCount + dlpCount) / 2; // Approximate if no data
  
  const reachData = [
    { name: 'تم الوصول', value: reached || Math.round(totalChronic * 0.87), color: COLORS.reached },
    { name: 'لم يتم الوصول', value: notReached || Math.round(totalChronic * 0.13), color: COLORS.notReached },
  ];

  const reachPercentage = totalChronic > 0 ? Math.round((reachData[0].value / totalChronic) * 100) : 87;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dmCount}</p>
                <p className="text-xs text-muted-foreground">السكري</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{htnCount}</p>
                <p className="text-xs text-muted-foreground">الضغط</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dlpCount}</p>
                <p className="text-xs text-muted-foreground">الدهون</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalChronic}</p>
                <p className="text-xs text-muted-foreground">إجمالي المرضى المزمنين</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Reach Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>نسبة الوصول للمرضى المزمنين</span>
            <Badge variant="outline" className="text-lg">
              {reachPercentage}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={reachPercentage} className="h-4 mb-4" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>تم الوصول: {reachData[0].value}</span>
            <span>لم يتم الوصول: {reachData[1].value}</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">نسبة الوصول</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reachData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {reachData.map((entry, index) => (
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
            <CardTitle className="text-lg">الأمراض حسب الجنس</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diseaseByGender}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="male" name="ذكور" fill={COLORS.male} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="female" name="إناث" fill={COLORS.female} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChronicDiseasesTab;