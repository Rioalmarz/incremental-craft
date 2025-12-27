import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, Search, UserCheck, Users, CheckCircle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

const Eligible = () => {
  const { user, loading } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [tableWidth, setTableWidth] = useState(0);

  // Fetch real statistics from database
  const { data: stats } = useQuery({
    queryKey: ['eligible-stats'],
    queryFn: async () => {
      const { data: patients, error } = await supabase
        .from('patients')
        .select('id, status, exclusion_reason, service_delivered');
      
      if (error) throw error;
      
      const total = patients?.length || 0;
      const completed = patients?.filter(p => p.status === 'مكتمل' || p.service_delivered).length || 0;
      const excluded = patients?.filter(p => p.status === 'مستبعد' || p.exclusion_reason).length || 0;
      
      return { total, completed, excluded };
    }
  });

  // Sync scrollbars
  const handleTopScroll = () => {
    if (tableScrollRef.current && topScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  };

  // Update table width for top scrollbar
  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;

    const raf = requestAnimationFrame(() => {
      setTableWidth(el.scrollWidth);

      // Start from the right side (RTL-friendly)
      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      el.scrollLeft = language === 'ar' ? max : 0;
      if (topScrollRef.current) topScrollRef.current.scrollLeft = language === 'ar' ? max : 0;
    });

    return () => cancelAnimationFrame(raf);
  }, [filteredData.length, columns.length, language]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/temp_khaled_data.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length > 0) {
          const allColumns = Object.keys(jsonData[0] as object);
          setColumns(allColumns);
        }
        
        const validData = jsonData.filter((row: any) => {
          const ageValue = row["age"] || row["Age"] || row["العمر"];
          const numAge = Number(ageValue);
          return !isNaN(numAge) && typeof ageValue !== 'boolean' && ageValue !== "نعم" && ageValue !== "لا";
        });
        
        setData(validData);
        setFilteredData(validData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredData(data);
      return;
    }
    
    const filtered = data.filter((row) => {
      return Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredData(filtered);
  }, [searchTerm, data]);

  const renderCellValue = (value: any, columnName: string) => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-muted-foreground">-</span>;
    }
    
    const ageColumns = ["age", "Age", "العمر"];
    if (ageColumns.includes(columnName)) {
      return String(value);
    }
    
    const diseaseKeywords = ["dm", "htn", "dyslipidemia", "سكري", "ضغط", "دهون", "مرض", "has_"];
    const isDisease = diseaseKeywords.some(keyword => 
      columnName.toLowerCase().includes(keyword)
    );
    
    if (isDisease) {
      if (value === true || value === 1 || value === "TRUE" || value === "نعم" || value === "Yes" || value === "1" || value === "true") {
        return <span className="text-destructive font-medium">{t('yes')}</span>;
      }
      if (value === false || value === 0 || value === "FALSE" || value === "لا" || value === "No" || value === "0" || value === "false") {
        return <span className="text-muted-foreground">{t('no')}</span>;
      }
    }
    
    return String(value);
  };

  const BackIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto max-w-full">
        {/* Header */}
        <div className={`flex items-center justify-between mb-8 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <BackIcon className="h-5 w-5" />
            </Button>
            <div className={language === 'en' ? 'text-left' : ''}>
              <h1 className={`text-2xl font-bold text-foreground flex items-center gap-2 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
                <UserCheck className="h-7 w-7 text-primary" />
                {t('eligibleTitle')}
              </h1>
              <p className="text-muted-foreground">{t('eligibleSubtitle')}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards - Database Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mx-auto mb-3">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <p className="text-4xl font-bold text-foreground mb-1">{stats?.total?.toLocaleString() || 0}</p>
              <p className="text-sm text-muted-foreground">{t('beneficiaries')}</p>
              <p className="text-xs text-primary mt-1">{language === 'ar' ? 'Beneficiaries' : ''}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-success/10 rounded-xl w-fit mx-auto mb-3">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <p className="text-4xl font-bold text-foreground mb-1">{stats?.completed?.toLocaleString() || 0}</p>
              <p className="text-sm text-muted-foreground">{t('completed')}</p>
              <p className="text-xs text-primary mt-1">{language === 'ar' ? 'Completed' : ''}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-destructive/10 rounded-xl w-fit mx-auto mb-3">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-4xl font-bold text-foreground mb-1">{stats?.excluded?.toLocaleString() || 0}</p>
              <p className="text-sm text-muted-foreground">{t('excluded')}</p>
              <p className="text-xs text-primary mt-1">{language === 'ar' ? 'Excluded' : ''}</p>
            </CardContent>
          </Card>
        </div>

        {/* Eligible Table Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className={`p-4 flex items-center gap-4 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
              <div className="p-3 bg-primary/20 rounded-xl">
                <UserCheck className="h-6 w-6 text-primary" />
              </div>
              <div className={language === 'en' ? 'text-right' : ''}>
                <p className="text-sm text-muted-foreground">{t('totalEligible')}</p>
                <p className="text-2xl font-bold text-foreground">{data.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className={`p-4 flex items-center gap-4 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
              <div className="p-3 bg-accent/20 rounded-xl">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div className={language === 'en' ? 'text-right' : ''}>
                <p className="text-sm text-muted-foreground">{t('columnsCount')}</p>
                <p className="text-2xl font-bold text-foreground">{columns.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${language === 'ar' ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={t('searchAllData')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={language === 'ar' ? 'pr-10' : 'pl-10'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('eligibleList')} ({filteredData.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Top horizontal scrollbar */}
            <div
              ref={topScrollRef}
              dir="ltr"
              onScroll={handleTopScroll}
              className="overflow-x-scroll overflow-y-hidden border-b border-border bg-muted/10"
              style={{ height: "22px" }}
            >
              <div style={{ width: tableWidth, height: 1 }} />
            </div>

            {/* Table with bottom scrollbar */}
            <div
              ref={tableScrollRef}
              dir="ltr"
              onScroll={handleTableScroll}
              className="overflow-auto max-h-[600px]"
            >
              <table className="w-full caption-bottom text-sm min-w-max" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className={`bg-muted/50 ${language === 'ar' ? 'text-right' : 'text-left'}`}>#</TableHead>
                    {columns.map((col, index) => (
                      <TableHead key={index} className={`bg-muted/50 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{rowIndex + 1}</TableCell>
                      {columns.map((col, colIndex) => (
                        <TableCell key={colIndex} className="whitespace-nowrap">
                          {renderCellValue(row[col], col)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Eligible;
