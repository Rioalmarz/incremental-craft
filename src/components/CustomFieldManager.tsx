import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2, Settings } from 'lucide-react';
import { toast } from 'sonner';

export interface CustomField {
  id: string;
  nameAr: string;
  nameEn: string;
  dbField: string;
  keywords: string[];
  targetTable: string;
  dataType: 'text' | 'number' | 'boolean' | 'date';
  createdAt: string;
}

const AVAILABLE_TABLES = [
  { id: 'patients', nameAr: 'جدول المرضى', icon: '👤', description: 'بيانات المرضى الأساسية' },
  { id: 'medications', nameAr: 'جدول الأدوية', icon: '💊', description: 'الأدوية والجرعات' },
  { id: 'screening_data', nameAr: 'جدول بيانات الفحص', icon: '🏥', description: 'التحاليل والفحوصات' },
  { id: 'virtual_clinic_data', nameAr: 'جدول العيادة الافتراضية', icon: '🩺', description: 'بيانات الفحص الطبي' },
  { id: 'patient_eligibility', nameAr: 'جدول أهلية الرعاية الوقائية', icon: '✅', description: 'الخدمات الوقائية' },
];

const DATA_TYPES = [
  { id: 'text', nameAr: 'نص' },
  { id: 'number', nameAr: 'رقم' },
  { id: 'boolean', nameAr: 'نعم/لا' },
  { id: 'date', nameAr: 'تاريخ' },
];

const STORAGE_KEY = 'customFieldMappings';

export const getCustomFields = (): CustomField[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveCustomFields = (fields: CustomField[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
};

interface CustomFieldManagerProps {
  onFieldsUpdated?: () => void;
}

export const CustomFieldManager = ({ onFieldsUpdated }: CustomFieldManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  
  // Form state
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [keywords, setKeywords] = useState('');
  const [targetTable, setTargetTable] = useState('');
  const [dataType, setDataType] = useState<'text' | 'number' | 'boolean' | 'date'>('text');

  useEffect(() => {
    setCustomFields(getCustomFields());
  }, []);

  const resetForm = () => {
    setNameAr('');
    setNameEn('');
    setKeywords('');
    setTargetTable('');
    setDataType('text');
    setEditingField(null);
  };

  const handleSaveField = () => {
    if (!nameAr || !nameEn || !targetTable) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const keywordsList = keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
    
    const newField: CustomField = {
      id: editingField?.id || `custom_${Date.now()}`,
      nameAr,
      nameEn,
      dbField: nameEn.toLowerCase().replace(/\s+/g, '_'),
      keywords: [...keywordsList, nameAr.toLowerCase(), nameEn.toLowerCase()],
      targetTable,
      dataType,
      createdAt: editingField?.createdAt || new Date().toISOString(),
    };

    let updatedFields: CustomField[];
    if (editingField) {
      updatedFields = customFields.map(f => f.id === editingField.id ? newField : f);
    } else {
      updatedFields = [...customFields, newField];
    }

    setCustomFields(updatedFields);
    saveCustomFields(updatedFields);
    toast.success(editingField ? 'تم تحديث الحقل بنجاح' : 'تم إضافة الحقل بنجاح');
    setIsAddDialogOpen(false);
    resetForm();
    onFieldsUpdated?.();
  };

  const handleEditField = (field: CustomField) => {
    setEditingField(field);
    setNameAr(field.nameAr);
    setNameEn(field.nameEn);
    setKeywords(field.keywords.filter(k => k !== field.nameAr.toLowerCase() && k !== field.nameEn.toLowerCase()).join(', '));
    setTargetTable(field.targetTable);
    setDataType(field.dataType);
    setIsAddDialogOpen(true);
  };

  const handleDeleteField = (fieldId: string) => {
    const updatedFields = customFields.filter(f => f.id !== fieldId);
    setCustomFields(updatedFields);
    saveCustomFields(updatedFields);
    toast.success('تم حذف الحقل بنجاح');
    onFieldsUpdated?.();
  };

  const getTableInfo = (tableId: string) => {
    return AVAILABLE_TABLES.find(t => t.id === tableId);
  };

  return (
    <>
      {/* Main Manager Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            إدارة الحقول المخصصة
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>إدارة الحقول المخصصة</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button 
              onClick={() => { resetForm(); setIsAddDialogOpen(true); }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة حقل جديد
            </Button>

            {customFields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد حقول مخصصة بعد
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {customFields.map(field => {
                  const tableInfo = getTableInfo(field.targetTable);
                  return (
                    <div 
                      key={field.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-card"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{field.nameAr}</div>
                        <div className="text-sm text-muted-foreground">
                          {tableInfo?.icon} {tableInfo?.nameAr} • {DATA_TYPES.find(d => d.id === field.dataType)?.nameAr}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          الكلمات المفتاحية: {field.keywords.slice(0, 5).join(', ')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditField(field)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteField(field.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Field Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingField ? 'تعديل حقل' : 'إضافة حقل جديد'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم الحقل (عربي) *</Label>
              <Input 
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: التحاليل"
              />
            </div>

            <div className="space-y-2">
              <Label>اسم الحقل (إنجليزي) *</Label>
              <Input 
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="مثال: lab_tests"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>الكلمات المفتاحية للمطابقة التلقائية</Label>
              <Input 
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="تحاليل, lab, labs, tests (افصل بفاصلة)"
              />
              <p className="text-xs text-muted-foreground">
                أضف كلمات متعددة مفصولة بفاصلة للمطابقة التلقائية
              </p>
            </div>

            <div className="space-y-2">
              <Label>الجدول الهدف *</Label>
              <Select value={targetTable} onValueChange={setTargetTable}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الجدول" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_TABLES.map(table => (
                    <SelectItem key={table.id} value={table.id}>
                      <div className="flex items-center gap-2">
                        <span>{table.icon}</span>
                        <span>{table.nameAr}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {targetTable && (
                <p className="text-xs text-muted-foreground">
                  {getTableInfo(targetTable)?.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>نوع البيانات</Label>
              <Select value={dataType} onValueChange={(v) => setDataType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATA_TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveField} className="flex-1">
                {editingField ? 'تحديث' : 'حفظ الحقل'}
              </Button>
              <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomFieldManager;
