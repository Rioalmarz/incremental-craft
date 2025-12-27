import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  ArrowLeft,
  Search,
  Filter,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Calendar,
  User,
  Building,
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface Patient {
  id: string;
  national_id: string;
  name: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  center_id: string;
  team: string | null;
  exclusion_reason: string | null;
  updated_at: string;
}

interface ScreeningData {
  screened_by: string;
  notes: string;
}

const Excluded = () => {
  const { user, loading, isSuperAdmin } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [screeningDataMap, setScreeningDataMap] = useState<Record<string, ScreeningData>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [reasonFilter, setReasonFilter] = useState<string>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, reasonFilter]);

  const fetchPatients = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("status", "excluded")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setPatients(data || []);

      const patientIds = (data || []).map(p => p.id);
      if (patientIds.length > 0) {
        const { data: screeningData } = await supabase
          .from("screening_data")
          .select("patient_id, screened_by, notes")
          .in("patient_id", patientIds);

        const screeningMap: Record<string, ScreeningData> = {};
        (screeningData || []).forEach((sd: any) => {
          screeningMap[sd.patient_id] = { screened_by: sd.screened_by, notes: sd.notes };
        });
        setScreeningDataMap(screeningMap);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast({
        title: t('error'),
        description: t('loadError'),
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const filterPatients = () => {
    let filtered = [...patients];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.national_id.includes(term) ||
          p.phone?.includes(term)
      );
    }

    if (reasonFilter !== "all") {
      filtered = filtered.filter((p) => p.exclusion_reason?.includes(reasonFilter));
    }

    setFilteredPatients(filtered);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd / MM / yyyy", { locale: language === 'ar' ? ar : enUS });
    } catch {
      return "-";
    }
  };

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

  const BackIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background">
        <FlowerLogo animate size={100} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className={`container mx-auto px-4 py-3 flex items-center justify-between ${language === 'en' ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <BackIcon size={20} />
            </Button>
            <div className={`flex items-center gap-2 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
              <XCircle className="text-destructive" size={24} />
              <h1 className="text-lg font-bold">{t('excludedTitle')}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {filteredPatients.length} {t('beneficiary')}
            </Badge>
          </div>
        </div>
      </header>

      {/* Info Banner */}
      <section className="py-3 px-4 bg-destructive/10 border-b border-destructive/20">
        <div className="container mx-auto">
          <p className={`text-sm text-destructive flex items-center gap-2 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
            <XCircle size={16} />
            {t('excludedNote')}
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4 px-4 border-b bg-card/50">
        <div className={`container mx-auto flex flex-wrap gap-4 items-center ${language === 'en' ? 'flex-row-reverse' : ''}`}>
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground ${language === 'ar' ? 'right-3' : 'left-3'}`} size={18} />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={language === 'ar' ? 'pr-10' : 'pl-10'}
            />
          </div>
          <div className={`flex items-center gap-2 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
            <Filter size={18} className="text-muted-foreground" />
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('exclusionReason')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all')}</SelectItem>
                <SelectItem value="لا يرد">{t('noAnswer')}</SelectItem>
                <SelectItem value="رقم غير صحيح">{t('wrongNumber')}</SelectItem>
                <SelectItem value="خارج نطاق">{t('outOfService')}</SelectItem>
                <SelectItem value="لا تنطبق">{t('notEligible')}</SelectItem>
                <SelectItem value="لا يحتاج">{t('noFollowUp')}</SelectItem>
                <SelectItem value="انتقل">{t('relocated')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="py-6 px-4">
        <div className="container mx-auto">
          <Card className="glass overflow-hidden">
            <CardContent className="p-0">
              {loadingData ? (
                <div className="flex items-center justify-center py-20">
                  <FlowerLogo animate size={60} />
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <XCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>{t('noExcludedPatients')}</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>{t('beneficiary')}</TableHead>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>{t('center')} / {t('team')}</TableHead>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>{t('exclusionReason')}</TableHead>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>{t('notes')}</TableHead>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>{t('exclusionDate')}</TableHead>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>{t('by')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPatients.map((patient) => {
                        const screeningInfo = screeningDataMap[patient.id];
                        return (
                          <TableRow key={patient.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div>
                                <p className="font-medium">{patient.name}</p>
                                <p className="text-xs text-muted-foreground">{patient.national_id}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <span>{patient.age || "-"} {t('year')}</span>
                                  <span>•</span>
                                  <span>{patient.gender || "-"}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className={`flex items-center gap-1 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
                                  <Building size={14} className="text-muted-foreground" />
                                  <span>{patient.center_id}</span>
                                </div>
                                {patient.team && (
                                  <div className={`flex items-center gap-1 text-muted-foreground ${language === 'en' ? 'flex-row-reverse' : ''}`}>
                                    <User size={14} />
                                    <span>{patient.team}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive" className="whitespace-nowrap">
                                {patient.exclusion_reason || t('notSpecified')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                                {screeningInfo?.notes || "-"}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-1 text-sm ${language === 'en' ? 'flex-row-reverse' : ''}`}>
                                <Calendar size={14} className="text-muted-foreground" />
                                <span>{formatDate(patient.updated_at)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{screeningInfo?.screened_by || "-"}</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 py-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        {language === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {t('page')} {currentPage} {t('of')} {totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        {language === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Excluded;
