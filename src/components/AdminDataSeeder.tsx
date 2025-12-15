import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2, Database, Users, Syringe, BookOpen, ClipboardCheck } from 'lucide-react';
import {
  AGE_GROUPS,
  PREVENTIVE_SERVICES,
  IMMUNIZATIONS,
  HEALTH_EDUCATION,
  seedAgeGroups,
  seedPreventiveServices,
  seedImmunizations,
  seedHealthEducation,
  calculateAndSaveEligibility
} from '@/data/preventiveCareSupabase';

interface SeedStatus {
  ageGroups: 'idle' | 'loading' | 'success' | 'error';
  services: 'idle' | 'loading' | 'success' | 'error';
  immunizations: 'idle' | 'loading' | 'success' | 'error';
  education: 'idle' | 'loading' | 'success' | 'error';
  eligibility: 'idle' | 'loading' | 'success' | 'error';
}

export const AdminDataSeeder: React.FC = () => {
  const [status, setStatus] = useState<SeedStatus>({
    ageGroups: 'idle',
    services: 'idle',
    immunizations: 'idle',
    education: 'idle',
    eligibility: 'idle'
  });
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  const updateStatus = (key: keyof SeedStatus, value: SeedStatus[keyof SeedStatus]) => {
    setStatus(prev => ({ ...prev, [key]: value }));
  };

  const handleSeedAll = async () => {
    setIsSeeding(true);
    setProgress(0);
    setMessage('جاري رفع البيانات...');

    try {
      // 1. رفع الفئات العمرية
      setMessage('رفع الفئات العمرية...');
      updateStatus('ageGroups', 'loading');
      setProgress(10);
      const ageResult = await seedAgeGroups();
      updateStatus('ageGroups', ageResult ? 'success' : 'error');

      // 2. رفع الخدمات الوقائية
      setMessage('رفع الخدمات الوقائية...');
      updateStatus('services', 'loading');
      setProgress(30);
      const servicesResult = await seedPreventiveServices();
      updateStatus('services', servicesResult ? 'success' : 'error');

      // 3. رفع التطعيمات
      setMessage('رفع التطعيمات...');
      updateStatus('immunizations', 'loading');
      setProgress(50);
      const immunResult = await seedImmunizations();
      updateStatus('immunizations', immunResult ? 'success' : 'error');

      // 4. رفع التثقيف الصحي
      setMessage('رفع التثقيف الصحي...');
      updateStatus('education', 'loading');
      setProgress(70);
      const eduResult = await seedHealthEducation();
      updateStatus('education', eduResult ? 'success' : 'error');

      // 5. حساب أهلية المرضى
      setMessage('حساب أهلية المرضى...');
      updateStatus('eligibility', 'loading');
      setProgress(80);
      
      const eligResult = await calculateAndSaveEligibility(
        (current, total) => {
          setProgress(80 + Math.round((current / total) * 20));
          setMessage(`معالجة ${current} من ${total} مريض...`);
        }
      );
      updateStatus('eligibility', eligResult.success ? 'success' : 'error');
      
      if (eligResult.count > 0) {
        setMessage(`تم إنشاء ${eligResult.count} سجل أهلية`);
      } else {
        setMessage('لا يوجد مرضى لحساب الأهلية');
      }

      setProgress(100);
      setMessage('تم رفع جميع البيانات بنجاح!');
      
    } catch (error) {
      console.error('Error:', error);
      setMessage('حدث خطأ أثناء رفع البيانات');
    }

    setIsSeeding(false);
  };

  const getStatusIcon = (s: SeedStatus[keyof SeedStatus]) => {
    switch (s) {
      case 'loading': return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  const items = [
    { key: 'ageGroups' as const, icon: Users, label: 'الفئات العمرية', count: AGE_GROUPS.length },
    { key: 'services' as const, icon: ClipboardCheck, label: 'الخدمات الوقائية', count: PREVENTIVE_SERVICES.length },
    { key: 'immunizations' as const, icon: Syringe, label: 'التطعيمات', count: IMMUNIZATIONS.length },
    { key: 'education' as const, icon: BookOpen, label: 'التثقيف الصحي', count: HEALTH_EDUCATION.length },
    { key: 'eligibility' as const, icon: CheckCircle2, label: 'حساب أهلية المرضى', count: null }
  ];

  return (
    <Card className="max-w-xl mx-auto" dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-lg">رفع بيانات الرعاية الوقائية</div>
            <div className="text-sm text-muted-foreground font-normal">رفع البيانات الأساسية للنظام</div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Items */}
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span>{item.label} {item.count !== null && `(${item.count})`}</span>
              </div>
              {getStatusIcon(status[item.key])}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        {isSeeding && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">{message}</p>
          </div>
        )}

        {/* Result Message */}
        {!isSeeding && message && (
          <div className={`p-4 rounded-lg text-center ${
            status.eligibility === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 
            status.eligibility === 'error' ? 'bg-destructive/10 text-destructive' : 
            'bg-primary/10 text-primary'
          }`}>
            {message}
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleSeedAll}
          disabled={isSeeding}
          className="w-full"
          size="lg"
        >
          {isSeeding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              جاري الرفع...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 ml-2" />
              رفع جميع البيانات
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminDataSeeder;
