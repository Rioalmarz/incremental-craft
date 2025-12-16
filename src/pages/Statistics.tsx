// @ts-nocheck
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowRight, Users, RefreshCw, Printer, 
  ShieldCheck, Activity, Baby, Phone, UserCheck, UserX, Heart, Ambulance 
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tab components
import PreventiveCareTab from "@/components/statistics/PreventiveCareTab";
import ChronicDiseasesTab from "@/components/statistics/ChronicDiseasesTab";
import HealthyChildTab from "@/components/statistics/HealthyChildTab";
import CommunicationEfficiencyTab from "@/components/statistics/CommunicationEfficiencyTab";
import ContactedTab from "@/components/statistics/ContactedTab";
import NotContactedTab from "@/components/statistics/NotContactedTab";
import SatisfactionTab from "@/components/statistics/SatisfactionTab";
import EmergencyReferralTab from "@/components/statistics/EmergencyReferralTab";
import PredictivePerformanceCard from "@/components/statistics/PredictivePerformanceCard";
import { calculatePilotStatistics } from "@/lib/pilotDataGenerator";

const Statistics = () => {
  const { user, profile, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("preventive");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, isSuperAdmin, profile]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let allPatients: any[] = [];
      let from = 0;
      const batchSize = 1000;
      
      while (true) {
        let query = supabase.from("patients").select("*").range(from, from + batchSize - 1);
        if (!isSuperAdmin && profile?.center_id) query = query.eq("center_id", profile.center_id);
        const { data } = await query;
        if (!data || data.length === 0) break;
        allPatients = [...allPatients, ...data];
        if (data.length < batchSize) break;
        from += batchSize;
      }
      
      setPatients(allPatients);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const pilotStats = calculatePilotStatistics(patients);

  const handlePrint = () => window.print();

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <FlowerLogo animate size={80} />
      </div>
    );
  }

  const tabs = [
    { id: "preventive", label: "الرعاية الوقائية", icon: ShieldCheck },
    { id: "chronic", label: "الأمراض المزمنة", icon: Activity },
    { id: "child", label: "الطفل السليم", icon: Baby },
    { id: "efficiency", label: "كفاءة التواصل", icon: Phone },
    { id: "contacted", label: "المتواصل معهم", icon: UserCheck },
    { id: "notContacted", label: "لم يتم التواصل", icon: UserX },
    { id: "emergency", label: "التحويل للطوارئ", icon: Ambulance },
    { id: "satisfaction", label: "قياس الرضا", icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl" ref={dashboardRef}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
                <ArrowRight className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">لوحة الإحصائيات</h1>
                <p className="text-sm text-muted-foreground">نتائج الـ Pilot التجريبي</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                تحديث
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                طباعة
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Main KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold">{pilotStats.total}</p>
              <p className="text-sm text-muted-foreground">إجمالي المستفيدين</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
            <CardContent className="p-4 text-center">
              <UserCheck className="w-8 h-8 mx-auto mb-2 text-success" />
              <p className="text-3xl font-bold text-success">{pilotStats.contacted}</p>
              <p className="text-sm text-muted-foreground">تم التواصل ({Math.round(pilotStats.contactedRate)}%)</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
            <CardContent className="p-4 text-center">
              <UserX className="w-8 h-8 mx-auto mb-2 text-warning" />
              <p className="text-3xl font-bold text-warning">{pilotStats.notContacted}</p>
              <p className="text-sm text-muted-foreground">لم يتم التواصل ({Math.round(100 - pilotStats.contactedRate)}%)</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-info/5 to-info/10 border-info/20">
            <CardContent className="p-4 text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-info" />
              <p className="text-3xl font-bold text-info">{pilotStats.serviceDelivered}</p>
              <p className="text-sm text-muted-foreground">تم تقديم الخدمة ({Math.round(pilotStats.serviceDeliveredRate)}%)</p>
            </CardContent>
          </Card>
        </div>

        {/* Predictive Performance */}
        <PredictivePerformanceCard />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-2 rounded-xl">
            {tabs.map(tab => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4 py-2"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="preventive">
              <PreventiveCareTab patients={patients} />
            </TabsContent>
            
            <TabsContent value="chronic">
              <ChronicDiseasesTab patients={patients} />
            </TabsContent>
            
            <TabsContent value="child">
              <HealthyChildTab patients={patients} />
            </TabsContent>
            
            <TabsContent value="efficiency">
              <CommunicationEfficiencyTab patients={patients} />
            </TabsContent>
            
            <TabsContent value="contacted">
              <ContactedTab patients={patients} />
            </TabsContent>
            
            <TabsContent value="notContacted">
              <NotContactedTab patients={patients} />
            </TabsContent>
            
            <TabsContent value="emergency">
              <EmergencyReferralTab patients={patients} />
            </TabsContent>
            
            <TabsContent value="satisfaction">
              <SatisfactionTab patients={patients} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default Statistics;
