import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, Phone, ShieldCheck, HeartPulse, Info } from "lucide-react";
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
  team2: "hsl(var(--warning))"
};

const MedicalTeamsTab = ({ patients }: MedicalTeamsTabProps) => {
  const totalPatients = patients.length;
  const totalContacted = patients.filter(p => p.contacted === true).length;
  
  // Group patients by team
  const team1Patients = patients.filter(p => p.team === "الأول" || p.team === "1" || p.team === "Team 1");
  const team2Patients = patients.filter(p => p.team === "الثاني" || p.team === "2" || p.team === "Team 2" || p.team === "الثالث" || p.team === "3" || p.team === "Team 3");
  const unassignedPatients = patients.filter(p => !p.team || (p.team !== "الأول" && p.team !== "1" && p.team !== "Team 1" && p.team !== "الثاني" && p.team !== "2" && p.team !== "Team 2" && p.team !== "الثالث" && p.team !== "3" && p.team !== "Team 3"));
  
  const team1Count = team1Patients.length;
  const team2Count = team2Patients.length + unassignedPatients.length; // Include unassigned in team 2 for display
  
  const team1Contacted = team1Patients.filter(p => p.contacted === true).length;
  const team2Contacted = (team2Patients.filter(p => p.contacted === true).length) + (unassignedPatients.filter(p => p.contacted === true).length);

  // Percentages
  const team1PercentOfTotal = totalPatients > 0 ? Math.round((team1Count / totalPatients) * 100) : 0;
  const team2PercentOfTotal = totalPatients > 0 ? Math.round((team2Count / totalPatients) * 100) : 0;
  const team1PercentOfContacted = totalContacted > 0 ? Math.round((team1Contacted / totalContacted) * 100) : 0;
  const team2PercentOfContacted = totalContacted > 0 ? Math.round((team2Contacted / totalContacted) * 100) : 0;
  const totalContactRate = totalPatients > 0 ? Math.round((totalContacted / totalPatients) * 100) : 0;

  // Distribution data for pie chart
  const distributionData = [
    { name: "الفريق الأول", value: team1Count, color: TEAM_COLORS.team1 },
    { name: "الفريق الثاني", value: team2Count, color: TEAM_COLORS.team2 }
  ].filter(d => d.value > 0);

  // Chronic diseases comparison
  const allTeam2 = [...team2Patients, ...unassignedPatients];
  const team1DM = team1Patients.filter(p => p.has_dm).length;
  const team1HTN = team1Patients.filter(p => p.has_htn).length;
  const team1DLP = team1Patients.filter(p => p.has_dyslipidemia).length;
  
  const team2DM = allTeam2.filter(p => p.has_dm).length;
  const team2HTN = allTeam2.filter(p => p.has_htn).length;
  const team2DLP = allTeam2.filter(p => p.has_dyslipidemia).length;

  const chronicData = [
    { name: "السكري", team1: team1DM, team2: team2DM },
    { name: "الضغط", team1: team1HTN, team2: team2HTN },
    { name: "الدهون", team1: team1DLP, team2: team2DLP }
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
  const team2Risk = getTeamRiskStats(allTeam2);

  const riskData = [
    { name: "مسيطر عليهم", team1: team1Risk.controlled, team2: team2Risk.controlled },
    { name: "يحتاجون مراقبة", team1: team1Risk.monitoring, team2: team2Risk.monitoring },
    { name: "يحتاجون تدخل", team1: team1Risk.intervention, team2: team2Risk.intervention }
  ];

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
        controlRate: dmPatients.length > 0 ? Math.round((dmControlled / dmPatients.length) * 100) : 0
      },
      htn: {
        total: htnPatients.length,
        controlled: htnControlled,
        controlRate: htnPatients.length > 0 ? Math.round((htnControlled / htnPatients.length) * 100) : 0
      },
      dlp: {
        total: dlpPatients.length,
        controlled: dlpControlled,
        controlRate: dlpPatients.length > 0 ? Math.round((dlpControlled / dlpPatients.length) * 100) : 0
      }
    };
  };

  const team1DiseaseControl = getDiseaseControlStats(team1Patients);
  const team2DiseaseControl = getDiseaseControlStats(allTeam2);
  const allDiseaseControl = getDiseaseControlStats(patients);

  return (
    <div className="space-y-6 pb-8">
      {/* KPI Cards - Team Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold text-primary">{team1Count}</p>
            <p className="text-sm text-muted-foreground">الفريق الأول</p>
            <p className="text-xs text-muted-foreground mt-1">
              {team1PercentOfTotal}% من الإجمالي
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-warning" />
            <p className="text-3xl font-bold text-warning">{team2Count}</p>
            <p className="text-sm text-muted-foreground">الفريق الثاني</p>
            <p className="text-xs text-muted-foreground mt-1">
              {team2PercentOfTotal}% من الإجمالي
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <Phone className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-primary">{team1Contacted}</p>
            <p className="text-xs text-muted-foreground">تواصل الفريق الأول</p>
            <p className="text-xs text-muted-foreground mt-1">
              {team1PercentOfContacted}% من المتواصل معهم
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-4 text-center">
            <Phone className="w-6 h-6 mx-auto mb-2 text-warning" />
            <p className="text-2xl font-bold text-warning">{team2Contacted}</p>
            <p className="text-xs text-muted-foreground">تواصل الفريق الثاني</p>
            <p className="text-xs text-muted-foreground mt-1">
              {team2PercentOfContacted}% من المتواصل معهم
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Total Contact Rate Badge */}
      <div className="flex flex-col items-center gap-2">
        <div className="bg-muted/50 rounded-full px-6 py-2 text-center">
          <span className="text-sm text-muted-foreground">إجمالي نسبة التواصل: </span>
          <span className="text-lg font-bold text-primary">{totalContactRate}%</span>
          <span className="text-sm text-muted-foreground"> ({totalContacted} من {totalPatients})</span>
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
              <div className="text-center">
                <span className="text-2xl font-bold text-success">{allDiseaseControl.dm.controlRate}%</span>
                <p className="text-xs text-muted-foreground">({allDiseaseControl.dm.controlled} من {allDiseaseControl.dm.total})</p>
              </div>
            </div>

            {/* HTN Control */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold text-center">السيطرة على الضغط</h4>
              <p className="text-xs text-center text-muted-foreground">(BP &lt; 140/90)</p>
              <div className="text-center">
                <span className="text-2xl font-bold text-success">{allDiseaseControl.htn.controlRate}%</span>
                <p className="text-xs text-muted-foreground">({allDiseaseControl.htn.controlled} من {allDiseaseControl.htn.total})</p>
              </div>
            </div>

            {/* DLP Control */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold text-center">السيطرة على الدهون</h4>
              <p className="text-xs text-center text-muted-foreground">(LDL &lt; 100)</p>
              <div className="text-center">
                <span className="text-2xl font-bold text-success">{allDiseaseControl.dlp.controlRate}%</span>
                <p className="text-xs text-muted-foreground">({allDiseaseControl.dlp.controlled} من {allDiseaseControl.dlp.total})</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disease Control by Team Table */}
      {(team1Count > 0 || team2Count > 0) && (
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
                  <TableHead className="text-center">السيطرة على السكري</TableHead>
                  <TableHead className="text-center">السيطرة على الضغط</TableHead>
                  <TableHead className="text-center">السيطرة على الدهون</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team1Count > 0 && (
                  <TableRow className="bg-primary/5">
                    <TableCell className="font-medium text-primary">الفريق الأول</TableCell>
                    <TableCell className="text-center font-bold">{team1DiseaseControl.dm.controlRate}%</TableCell>
                    <TableCell className="text-center font-bold">{team1DiseaseControl.htn.controlRate}%</TableCell>
                    <TableCell className="text-center font-bold">{team1DiseaseControl.dlp.controlRate}%</TableCell>
                  </TableRow>
                )}
                {team2Count > 0 && (
                  <TableRow className="bg-warning/5">
                    <TableCell className="font-medium text-warning">الفريق الثاني</TableCell>
                    <TableCell className="text-center font-bold">{team2DiseaseControl.dm.controlRate}%</TableCell>
                    <TableCell className="text-center font-bold">{team2DiseaseControl.htn.controlRate}%</TableCell>
                    <TableCell className="text-center font-bold">{team2DiseaseControl.dlp.controlRate}%</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
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
            {distributionData.length > 0 ? (
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
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
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
            {(team1DM > 0 || team2DM > 0 || team1HTN > 0 || team2HTN > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chronicData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="team1" name="الفريق الأول" fill={TEAM_COLORS.team1} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="team2" name="الفريق الثاني" fill={TEAM_COLORS.team2} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* No Data Message */}
      {totalPatients === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">لا توجد بيانات متاحة حالياً</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MedicalTeamsTab;
