// @ts-nocheck
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowRight, ArrowLeft, Users, RefreshCw, Printer, 
  ShieldCheck, Activity, Baby, Phone, UserCheck, UserX, Heart, Ambulance, UsersRound 
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
import MedicalTeamsTab from "@/components/statistics/MedicalTeamsTab";
import PredictivePerformanceCard from "@/components/statistics/PredictivePerformanceCard";
import AIPredictionTab from "@/components/statistics/AIPredictionTab";

const Statistics = () => {
  const { user, profile, loading, isSuperAdmin } = useAuth();
  const { language, t } = useLanguage();
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

  // Calculate real statistics from data
  const totalPatients = patients.length;
  const contactedCount = patients.filter(p => p.contacted === true).length;
  const notContactedCount = totalPatients - contactedCount;
  const contactedRate = totalPatients > 0 ? Math.round((contactedCount / totalPatients) * 100) : 0;
  const notContactedRate = totalPatients > 0 ? Math.round((notContactedCount / totalPatients) * 100) : 0;
  
  // Calculate satisfaction from real data
  const patientsWithSatisfaction = patients.filter(p => p.satisfaction_score != null && p.satisfaction_score > 0);
  const avgSatisfaction = patientsWithSatisfaction.length > 0 
    ? Math.round((patientsWithSatisfaction.reduce((sum, p) => sum + p.satisfaction_score, 0) / patientsWithSatisfaction.length) * 20) 
    : 0;

  const handlePrint = () => window.print();

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <FlowerLogo animate size={80} />
      </div>
    );
  }

  const tabs = [
    { id: "preventive", labelAr: "الرعاية الوقائية", labelEn: "Preventive Care", icon: ShieldCheck },
    { id: "chronic", labelAr: "الأمراض المزمنة", labelEn: "Chronic Diseases", icon: Activity },
    { id: "child", labelAr: "الطفل السليم", labelEn: "Healthy Child", icon: Baby },
    { id: "teams", labelAr: "الفرق الطبية", labelEn: "Medical Teams", icon: UsersRound },
    { id: "efficiency", labelAr: "كفاءة التواصل", labelEn: "Communication", icon: Phone },
    { id: "contacted", labelAr: "المتواصل معهم", labelEn: "Contacted", icon: UserCheck },
    { id: "notContacted", labelAr: "لم يتم التواصل", labelEn: "Not Contacted", icon: UserX },
    { id: "emergency", labelAr: "التحويل للطوارئ", labelEn: "Emergency", icon: Ambulance },
    { id: "satisfaction", labelAr: "قياس الرضا", labelEn: "Satisfaction", icon: Heart },
  ];

  const BackIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'} ref={dashboardRef}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className={`flex items-center justify-between ${language === 'en' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-4 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
                <BackIcon className="h-5 w-5" />
              </Button>
              <div className={language === 'en' ? 'text-left' : ''}>
                <h1 className="text-xl font-bold">{t('statisticsTitle')}</h1>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'Statistics Dashboard' : ''}</p>
              </div>
            </div>
            <div className={`flex gap-2 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
              <Button variant="outline" size="sm" onClick={fetchData} className={`gap-2 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
                <RefreshCw className="h-4 w-4" />
                {t('refresh')}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className={`gap-2 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
                <Printer className="h-4 w-4" />
                {t('print')}
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
              <p className="text-3xl font-bold">{totalPatients}</p>
              <p className="text-sm text-muted-foreground">{t('totalBeneficiaries')}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
            <CardContent className="p-4 text-center">
              <UserCheck className="w-8 h-8 mx-auto mb-2 text-success" />
              <p className="text-3xl font-bold text-success">{contactedCount}</p>
              <p className="text-sm text-muted-foreground">{t('contacted')} ({contactedRate}%)</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
            <CardContent className="p-4 text-center">
              <UserX className="w-8 h-8 mx-auto mb-2 text-warning" />
              <p className="text-3xl font-bold text-warning">{notContactedCount}</p>
              <p className="text-sm text-muted-foreground">{t('notContacted')} ({notContactedRate}%)</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-info/5 to-info/10 border-info/20">
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-info" />
              <p className="text-3xl font-bold text-info">{avgSatisfaction}%</p>
              <p className="text-sm text-muted-foreground">{t('beneficiarySatisfaction')}</p>
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
                <span className="hidden md:inline">{language === 'ar' ? tab.labelAr : tab.labelEn}</span>
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
            
            <TabsContent value="teams">
              <MedicalTeamsTab patients={patients} />
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
