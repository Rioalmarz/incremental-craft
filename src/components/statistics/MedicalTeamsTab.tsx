import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, Phone, ShieldCheck, HeartPulse } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { classifyOverallRisk, classifyHBA1C, classifyBP, classifyLDL } from "@/lib/riskClassification";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MedicalTeamsTabProps {
  patients: any[];
}

const TEAM_COLORS = {
  team1: "hsl(var(--primary))",
  team2: "hsl(var(--warning))",
  team3: "hsl(var(--success))"
};

const MedicalTeamsTab = ({ patients }: MedicalTeamsTabProps) => {
  // Group patients by team
  const team1Patients = patients.filter(p => p.team === "الأول" || p.team === "1" || p.team === "Team 1");
  const team2Patients = patients.filter(p => p.team === "الثاني" || p.team === "2" || p.team === "Team 2");
  const team3Patients = patients.filter(p => p.team === "الثالث" || p.team === "3" || p.team === "Team 3");
  
  const team1Count = team1Patients.length;
  const team2Count = team2Patients.length;
  const team3Count = team3Patients.length;
  const total = patients.length;

  // Distribution data for pie chart
  const distributionData = [
    { name: "الفريق الأول", value: team1Count, color: TEAM_COLORS.team1 },
    { name: "الفريق الثاني", value: team2Count, color: TEAM_COLORS.team2 },
    ...(team3Count > 0 ? [{ name: "الفريق الثالث", value: team3Count, color: TEAM_COLORS.team3 }] : [])
  ];

  // Chronic diseases comparison
  const team1DM = team1Patients.filter(p => p.has_dm).length;
  const team1HTN = team1Patients.filter(p => p.has_htn).length;
  const team1DLP = team1Patients.filter(p => p.has_dyslipidemia).length;
  
  const team2DM = team2Patients.filter(p => p.has_dm).length;
  const team2HTN = team2Patients.filter(p => p.has_htn).length;
  const team2DLP = team2Patients.filter(p => p.has_dyslipidemia).length;

  const team3DM = team3Patients.filter(p => p.has_dm).length;
  const team3HTN = team3Patients.filter(p => p.has_htn).length;
  const team3DLP = team3Patients.filter(p => p.has_dyslipidemia).length;

  const chronicData = [
    { name: "السكري", team1: team1DM, team2: team2DM, ...(team3Count > 0 ? { team3: team3DM } : {}) },
    { name: "الضغط", team1: team1HTN, team2: team2HTN, ...(team3Count > 0 ? { team3: team3HTN } : {}) },
    { name: "الدهون", team1: team1DLP, team2: team2DLP, ...(team3Count > 0 ? { team3: team3DLP } : {}) }
  ];

  // Communication rates - calculate as portion of total contacted
  const totalContacted = patients.filter(p => p.contacted || p.contact_date).length;
  const team1Contacted = team1Patients.filter(p => p.contacted || p.contact_date).length;
  const team2Contacted = team2Patients.filter(p => p.contacted || p.contact_date).length;
  const team3Contacted = team3Patients.filter(p => p.contacted || p.contact_date).length;
  
  // Contact rate within each team
  const team1ContactRate = team1Count > 0 ? Math.round((team1Contacted / team1Count) * 100) : 0;
  const team2ContactRate = team2Count > 0 ? Math.round((team2Contacted / team2Count) * 100) : 0;
  const team3ContactRate = team3Count > 0 ? Math.round((team3Contacted / team3Count) * 100) : 0;

  // Contribution to overall contact rate (out of total contacted)
  const totalContactRate = total > 0 ? Math.round((totalContacted / total) * 100) : 0;
  const team1ContactContribution = total > 0 ? Math.round((team1Contacted / total) * 100) : 0;
  const team2ContactContribution = total > 0 ? Math.round((team2Contacted / total) * 100) : 0;
  const team3ContactContribution = total > 0 ? Math.round((team3Contacted / total) * 100) : 0;

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
  const team3Risk = getTeamRiskStats(team3Patients);

  const riskData = [
    { name: "مسيطر عليهم", team1: team1Risk.controlled, team2: team2Risk.controlled, ...(team3Count > 0 ? { team3: team3Risk.controlled } : {}) },
    { name: "يحتاجون مراقبة", team1: team1Risk.monitoring, team2: team2Risk.monitoring, ...(team3Count > 0 ? { team3: team3Risk.monitoring } : {}) },
    { name: "يحتاجون تدخل", team1: team1Risk.intervention, team2: team2Risk.intervention, ...(team3Count > 0 ? { team3: team3Risk.intervention } : {}) }
  ];

  // Service delivery comparison
  const team1ServiceDelivered = team1Patients.filter(p => p.service_delivered).length;
  const team2ServiceDelivered = team2Patients.filter(p => p.service_delivered).length;
  const team3ServiceDelivered = team3Patients.filter(p => p.service_delivered).length;
  
  const team1ServiceRate = team1Contacted > 0 ? Math.round((team1ServiceDelivered / team1Contacted) * 100) : 0;
  const team2ServiceRate = team2Contacted > 0 ? Math.round((team2ServiceDelivered / team2Contacted) * 100) : 0;
  const team3ServiceRate = team3Contacted > 0 ? Math.round((team3ServiceDelivered / team3Contacted) * 100) : 0;

  // Disease Control Statistics by Team
  const getDiseaseControlStats = (teamPatients: any[]) => {
    // DM Control (HbA1c)
    const dmPatients = teamPatients.filter(p => p.has_dm);
    let dmControlled = 0, dmNearControl = 0, dmUncontrolled = 0;
    dmPatients.forEach(p => {
      const result = classifyHBA1C(p.hba1c);
      if (result === "مسيطر عليه") dmControlled++;
      else if (result === "يحتاج مراقبة") dmNearControl++;
      else if (result === "يحتاج تعديل أو تدخل من الطبيب") dmUncontrolled++;
    });

    // HTN Control (BP)
    const htnPatients = teamPatients.filter(p => p.has_htn);
    let htnControlled = 0, htnNearControl = 0, htnUncontrolled = 0;
    htnPatients.forEach(p => {
      const result = classifyBP(p.bp_last_visit);
      if (result === "مسيطر عليه") htnControlled++;
      else if (result === "يحتاج مراقبة") htnNearControl++;
      else if (result === "يحتاج تعديل أو تدخل من الطبيب") htnUncontrolled++;
    });

    // DLP Control (LDL)
    const dlpPatients = teamPatients.filter(p => p.has_dyslipidemia);
    let dlpControlled = 0, dlpNearControl = 0, dlpUncontrolled = 0;
    dlpPatients.forEach(p => {
      const result = classifyLDL(p.ldl);
      if (result === "مسيطر عليه") dlpControlled++;
      else if (result === "يحتاج مراقبة") dlpNearControl++;
      else if (result === "يحتاج تعديل أو تدخل من الطبيب") dlpUncontrolled++;
    });

    return {
      dm: {
        total: dmPatients.length,
        controlled: dmControlled,
        nearControl: dmNearControl,
        uncontrolled: dmUncontrolled,
        controlRate: dmPatients.length > 0 ? Math.round((dmControlled / dmPatients.length) * 100) : 0
      },
      htn: {
        total: htnPatients.length,
        controlled: htnControlled,
        nearControl: htnNearControl,
        uncontrolled: htnUncontrolled,
        controlRate: htnPatients.length > 0 ? Math.round((htnControlled / htnPatients.length) * 100) : 0
      },
      dlp: {
        total: dlpPatients.length,
        controlled: dlpControlled,
        nearControl: dlpNearControl,
        uncontrolled: dlpUncontrolled,
        controlRate: dlpPatients.length > 0 ? Math.round((dlpControlled / dlpPatients.length) * 100) : 0
      }
    };
  };

  const team1DiseaseControl = getDiseaseControlStats(team1Patients);
  const team2DiseaseControl = getDiseaseControlStats(team2Patients);
  const team3DiseaseControl = getDiseaseControlStats(team3Patients);
  const allDiseaseControl = getDiseaseControlStats(patients);

  return (
    <div className="space-y-6 pb-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            <Users className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-3xl font-bold text-success">{team3Count}</p>
            <p className="text-sm text-muted-foreground">الفريق الثالث</p>
            <p className="text-xs text-muted-foreground mt-1">
              {total > 0 ? Math.round((team3Count / total) * 100) : 0}% من الإجمالي
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <Phone className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-primary">{team1ContactContribution}%</p>
            <p className="text-xs text-muted-foreground">مساهمة الفريق الأول</p>
            <p className="text-xs text-muted-foreground">في التواصل</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-4 text-center">
            <Phone className="w-6 h-6 mx-auto mb-2 text-warning" />
            <p className="text-2xl font-bold text-warning">{team2ContactContribution}%</p>
            <p className="text-xs text-muted-foreground">مساهمة الفريق الثاني</p>
            <p className="text-xs text-muted-foreground">في التواصل</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-4 text-center">
            <Phone className="w-6 h-6 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold text-success">{team3ContactContribution}%</p>
            <p className="text-xs text-muted-foreground">مساهمة الفريق الثالث</p>
            <p className="text-xs text-muted-foreground">في التواصل</p>
          </CardContent>
        </Card>
      </div>

      {/* Total Contact Rate Badge */}
      <div className="flex justify-center">
        <div className="bg-muted/50 rounded-full px-6 py-2 text-center">
          <span className="text-sm text-muted-foreground">إجمالي نسبة التواصل: </span>
          <span className="text-lg font-bold text-primary">{totalContactRate}%</span>
          <span className="text-sm text-muted-foreground"> ({team1ContactContribution}% + {team2ContactContribution}% + {team3ContactContribution}%)</span>
        </div>
      </div>

      {/* Disease Control Statistics Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HeartPulse className="w-5 h-5" />
            نسبة السيطرة على الأمراض المزمنة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* DM Control */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold text-center">السيطرة على السكري</h4>
              <p className="text-xs text-center text-muted-foreground">(HbA1c &lt; 7%)</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">🟢 مسيطر</span>
                  <span className="font-bold text-success">{allDiseaseControl.dm.total > 0 ? Math.round((allDiseaseControl.dm.controlled / allDiseaseControl.dm.total) * 100) : 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">🟡 قريب</span>
                  <span className="font-bold text-warning">{allDiseaseControl.dm.total > 0 ? Math.round((allDiseaseControl.dm.nearControl / allDiseaseControl.dm.total) * 100) : 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">🔴 غير مسيطر</span>
                  <span className="font-bold text-destructive">{allDiseaseControl.dm.total > 0 ? Math.round((allDiseaseControl.dm.uncontrolled / allDiseaseControl.dm.total) * 100) : 0}%</span>
                </div>
              </div>
            </div>

            {/* HTN Control */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold text-center">السيطرة على الضغط</h4>
              <p className="text-xs text-center text-muted-foreground">(BP &lt; 140/90)</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">🟢 مسيطر</span>
                  <span className="font-bold text-success">{allDiseaseControl.htn.total > 0 ? Math.round((allDiseaseControl.htn.controlled / allDiseaseControl.htn.total) * 100) : 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">🟡 قريب</span>
                  <span className="font-bold text-warning">{allDiseaseControl.htn.total > 0 ? Math.round((allDiseaseControl.htn.nearControl / allDiseaseControl.htn.total) * 100) : 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">🔴 غير مسيطر</span>
                  <span className="font-bold text-destructive">{allDiseaseControl.htn.total > 0 ? Math.round((allDiseaseControl.htn.uncontrolled / allDiseaseControl.htn.total) * 100) : 0}%</span>
                </div>
              </div>
            </div>

            {/* DLP Control */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold text-center">السيطرة على الدهون</h4>
              <p className="text-xs text-center text-muted-foreground">(LDL &lt; 100)</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">🟢 مسيطر</span>
                  <span className="font-bold text-success">{allDiseaseControl.dlp.total > 0 ? Math.round((allDiseaseControl.dlp.controlled / allDiseaseControl.dlp.total) * 100) : 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">🟡 قريب</span>
                  <span className="font-bold text-warning">{allDiseaseControl.dlp.total > 0 ? Math.round((allDiseaseControl.dlp.nearControl / allDiseaseControl.dlp.total) * 100) : 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">🔴 غير مسيطر</span>
                  <span className="font-bold text-destructive">{allDiseaseControl.dlp.total > 0 ? Math.round((allDiseaseControl.dlp.uncontrolled / allDiseaseControl.dlp.total) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disease Control by Team Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            نسبة السيطرة حسب الفريق
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الفريق</TableHead>
                <TableHead className="text-center">السيطرة على السكري<br/><span className="text-xs text-muted-foreground">(HbA1c at target)</span></TableHead>
                <TableHead className="text-center">السيطرة على الضغط<br/><span className="text-xs text-muted-foreground">(BP &lt; 140/90)</span></TableHead>
                <TableHead className="text-center">السيطرة على الدهون<br/><span className="text-xs text-muted-foreground">(LDL at target)</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-primary/5">
                <TableCell className="font-medium text-primary">الفريق الأول</TableCell>
                <TableCell className="text-center font-bold">{team1DiseaseControl.dm.controlRate}%</TableCell>
                <TableCell className="text-center font-bold">{team1DiseaseControl.htn.controlRate}%</TableCell>
                <TableCell className="text-center font-bold">{team1DiseaseControl.dlp.controlRate}%</TableCell>
              </TableRow>
              <TableRow className="bg-warning/5">
                <TableCell className="font-medium text-warning">الفريق الثاني</TableCell>
                <TableCell className="text-center font-bold">{team2DiseaseControl.dm.controlRate}%</TableCell>
                <TableCell className="text-center font-bold">{team2DiseaseControl.htn.controlRate}%</TableCell>
                <TableCell className="text-center font-bold">{team2DiseaseControl.dlp.controlRate}%</TableCell>
              </TableRow>
              <TableRow className="bg-success/5">
                <TableCell className="font-medium text-success">الفريق الثالث</TableCell>
                <TableCell className="text-center font-bold">{team3DiseaseControl.dm.controlRate}%</TableCell>
                <TableCell className="text-center font-bold">{team3DiseaseControl.htn.controlRate}%</TableCell>
                <TableCell className="text-center font-bold">{team3DiseaseControl.dlp.controlRate}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                {team3Count > 0 && <Bar dataKey="team3" name="الفريق الثالث" fill={TEAM_COLORS.team3} radius={[0, 4, 4, 0]} />}
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
                {team3Count > 0 && <Bar dataKey="team3" name="الفريق الثالث" fill={TEAM_COLORS.team3} radius={[0, 4, 4, 0]} />}
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
                  { name: "نسبة التواصل", team1: team1ContactRate, team2: team2ContactRate, ...(team3Count > 0 ? { team3: team3ContactRate } : {}) },
                  { name: "تقديم الخدمة", team1: team1ServiceRate, team2: team2ServiceRate, ...(team3Count > 0 ? { team3: team3ServiceRate } : {}) }
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
                {team3Count > 0 && <Bar dataKey="team3" name="الفريق الثالث" fill={TEAM_COLORS.team3} radius={[0, 4, 4, 0]} />}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الفريق</TableHead>
                  <TableHead className="text-center">المستفيدين</TableHead>
                  <TableHead className="text-center">تم التواصل</TableHead>
                  <TableHead className="text-center">السكري</TableHead>
                  <TableHead className="text-center">الضغط</TableHead>
                  <TableHead className="text-center">الدهون</TableHead>
                  <TableHead className="text-center">مسيطر عليهم</TableHead>
                  <TableHead className="text-center">تقديم الخدمة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-primary/5">
                  <TableCell className="font-medium text-primary">الفريق الأول</TableCell>
                  <TableCell className="text-center">{team1Count}</TableCell>
                  <TableCell className="text-center">{team1ContactRate}%</TableCell>
                  <TableCell className="text-center">{team1DM}</TableCell>
                  <TableCell className="text-center">{team1HTN}</TableCell>
                  <TableCell className="text-center">{team1DLP}</TableCell>
                  <TableCell className="text-center">{team1Risk.controlled}</TableCell>
                  <TableCell className="text-center">{team1ServiceRate}%</TableCell>
                </TableRow>
                <TableRow className="bg-warning/5">
                  <TableCell className="font-medium text-warning">الفريق الثاني</TableCell>
                  <TableCell className="text-center">{team2Count}</TableCell>
                  <TableCell className="text-center">{team2ContactRate}%</TableCell>
                  <TableCell className="text-center">{team2DM}</TableCell>
                  <TableCell className="text-center">{team2HTN}</TableCell>
                  <TableCell className="text-center">{team2DLP}</TableCell>
                  <TableCell className="text-center">{team2Risk.controlled}</TableCell>
                  <TableCell className="text-center">{team2ServiceRate}%</TableCell>
                </TableRow>
                <TableRow className="bg-success/5">
                  <TableCell className="font-medium text-success">الفريق الثالث</TableCell>
                  <TableCell className="text-center">{team3Count}</TableCell>
                  <TableCell className="text-center">{team3ContactRate}%</TableCell>
                  <TableCell className="text-center">{team3DM}</TableCell>
                  <TableCell className="text-center">{team3HTN}</TableCell>
                  <TableCell className="text-center">{team3DLP}</TableCell>
                  <TableCell className="text-center">{team3Risk.controlled}</TableCell>
                  <TableCell className="text-center">{team3ServiceRate}%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalTeamsTab;
