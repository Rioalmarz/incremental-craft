import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, Phone, ShieldCheck } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { classifyOverallRisk } from "@/lib/riskClassification";

interface MedicalTeamsTabProps {
  patients: any[];
}

const TEAM_COLORS = {
  team1: "hsl(var(--primary))",
  team2: "hsl(var(--warning))"
};

const MedicalTeamsTab = ({ patients }: MedicalTeamsTabProps) => {
  // Group patients by team
  const team1Patients = patients.filter(p => p.team === "الأول" || p.team === "1" || p.team === "Team 1");
  const team2Patients = patients.filter(p => p.team === "الثاني" || p.team === "2" || p.team === "Team 2");
  
  const team1Count = team1Patients.length;
  const team2Count = team2Patients.length;
  const total = team1Count + team2Count;

  // Distribution data for pie chart
  const distributionData = [
    { name: "الفريق الأول", value: team1Count, color: TEAM_COLORS.team1 },
    { name: "الفريق الثاني", value: team2Count, color: TEAM_COLORS.team2 }
  ];

  // Comparison bar chart data
  const comparisonData = [
    { name: "عدد المستفيدين", team1: team1Count, team2: team2Count }
  ];

  // Chronic diseases comparison
  const team1DM = team1Patients.filter(p => p.has_dm).length;
  const team1HTN = team1Patients.filter(p => p.has_htn).length;
  const team1DLP = team1Patients.filter(p => p.has_dyslipidemia).length;
  
  const team2DM = team2Patients.filter(p => p.has_dm).length;
  const team2HTN = team2Patients.filter(p => p.has_htn).length;
  const team2DLP = team2Patients.filter(p => p.has_dyslipidemia).length;

  const chronicData = [
    { name: "السكري", team1: team1DM, team2: team2DM },
    { name: "الضغط", team1: team1HTN, team2: team2HTN },
    { name: "الدهون", team1: team1DLP, team2: team2DLP }
  ];

  // Communication rates
  const team1Contacted = team1Patients.filter(p => p.contacted || p.contact_date).length;
  const team2Contacted = team2Patients.filter(p => p.contacted || p.contact_date).length;
  
  const team1ContactRate = team1Count > 0 ? Math.round((team1Contacted / team1Count) * 100) : 0;
  const team2ContactRate = team2Count > 0 ? Math.round((team2Contacted / team2Count) * 100) : 0;

  const communicationData = [
    { name: "نسبة التواصل %", team1: team1ContactRate, team2: team2ContactRate }
  ];

  // Risk classification comparison
  const getTeamRiskStats = (teamPatients: any[]) => {
    let controlled = 0, monitoring = 0, intervention = 0;
    
    teamPatients.forEach(p => {
      const risk = classifyOverallRisk(p);
      if (risk.overall === "مسيطر عليه") controlled++;
      else if (risk.overall === "يحتاج مراقبة") monitoring++;
      else if (risk.overall === "يحتاج تعديل أو تدخل من الطبيب") intervention++;
    });
    
    return { controlled, monitoring, intervention };
  };

  const team1Risk = getTeamRiskStats(team1Patients);
  const team2Risk = getTeamRiskStats(team2Patients);

  const riskData = [
    { name: "مسيطر عليهم", team1: team1Risk.controlled, team2: team2Risk.controlled },
    { name: "يحتاجون مراقبة", team1: team1Risk.monitoring, team2: team2Risk.monitoring },
    { name: "يحتاجون تدخل", team1: team1Risk.intervention, team2: team2Risk.intervention }
  ];

  // Service delivery comparison
  const team1ServiceDelivered = team1Patients.filter(p => p.service_delivered).length;
  const team2ServiceDelivered = team2Patients.filter(p => p.service_delivered).length;
  
  const team1ServiceRate = team1Contacted > 0 ? Math.round((team1ServiceDelivered / team1Contacted) * 100) : 0;
  const team2ServiceRate = team2Contacted > 0 ? Math.round((team2ServiceDelivered / team2Contacted) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold text-primary">{team1Count}</p>
            <p className="text-sm text-muted-foreground">الفريق الأول</p>
            <p className="text-xs text-muted-foreground mt-1">
              {total > 0 ? Math.round((team1Count / total) * 100) : 0}% من الإجمالي
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-warning" />
            <p className="text-3xl font-bold text-warning">{team2Count}</p>
            <p className="text-sm text-muted-foreground">الفريق الثاني</p>
            <p className="text-xs text-muted-foreground mt-1">
              {total > 0 ? Math.round((team2Count / total) * 100) : 0}% من الإجمالي
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-4 text-center">
            <Phone className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-3xl font-bold text-success">{team1ContactRate}%</p>
            <p className="text-sm text-muted-foreground">تواصل الفريق الأول</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/20">
          <CardContent className="p-4 text-center">
            <Phone className="w-8 h-8 mx-auto mb-2 text-info" />
            <p className="text-3xl font-bold text-info">{team2ContactRate}%</p>
            <p className="text-sm text-muted-foreground">تواصل الفريق الثاني</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              توزيع المستفيدين حسب الفريق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, "عدد المستفيدين"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chronic Diseases Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              مقارنة الأمراض المزمنة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chronicData} layout="vertical" margin={{ right: 80 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="team1" name="الفريق الأول" fill={TEAM_COLORS.team1} radius={[0, 4, 4, 0]} />
                <Bar dataKey="team2" name="الفريق الثاني" fill={TEAM_COLORS.team2} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Classification Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              مقارنة تصنيف المخاطر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={riskData} layout="vertical" margin={{ right: 100 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="team1" name="الفريق الأول" fill={TEAM_COLORS.team1} radius={[0, 4, 4, 0]} />
                <Bar dataKey="team2" name="الفريق الثاني" fill={TEAM_COLORS.team2} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Communication Rate Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="w-5 h-5" />
              مقارنة معدل التواصل وتقديم الخدمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart 
                data={[
                  { name: "نسبة التواصل", team1: team1ContactRate, team2: team2ContactRate },
                  { name: "تقديم الخدمة", team1: team1ServiceRate, team2: team2ServiceRate }
                ]}
                layout="vertical"
                margin={{ right: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value: number) => [`${value}%`, ""]} />
                <Legend />
                <Bar dataKey="team1" name="الفريق الأول" fill={TEAM_COLORS.team1} radius={[0, 4, 4, 0]} />
                <Bar dataKey="team2" name="الفريق الثاني" fill={TEAM_COLORS.team2} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ملخص أداء الفرق الطبية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right p-3 font-semibold">الفريق</th>
                  <th className="text-center p-3 font-semibold">المستفيدين</th>
                  <th className="text-center p-3 font-semibold">تم التواصل</th>
                  <th className="text-center p-3 font-semibold">السكري</th>
                  <th className="text-center p-3 font-semibold">الضغط</th>
                  <th className="text-center p-3 font-semibold">الدهون</th>
                  <th className="text-center p-3 font-semibold">مسيطر عليهم</th>
                  <th className="text-center p-3 font-semibold">تقديم الخدمة</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50 bg-primary/5">
                  <td className="p-3 font-medium text-primary">الفريق الأول</td>
                  <td className="text-center p-3">{team1Count}</td>
                  <td className="text-center p-3">{team1ContactRate}%</td>
                  <td className="text-center p-3">{team1DM}</td>
                  <td className="text-center p-3">{team1HTN}</td>
                  <td className="text-center p-3">{team1DLP}</td>
                  <td className="text-center p-3">{team1Risk.controlled}</td>
                  <td className="text-center p-3">{team1ServiceRate}%</td>
                </tr>
                <tr className="bg-warning/5">
                  <td className="p-3 font-medium text-warning">الفريق الثاني</td>
                  <td className="text-center p-3">{team2Count}</td>
                  <td className="text-center p-3">{team2ContactRate}%</td>
                  <td className="text-center p-3">{team2DM}</td>
                  <td className="text-center p-3">{team2HTN}</td>
                  <td className="text-center p-3">{team2DLP}</td>
                  <td className="text-center p-3">{team2Risk.controlled}</td>
                  <td className="text-center p-3">{team2ServiceRate}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalTeamsTab;
