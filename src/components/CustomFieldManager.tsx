import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit2, Settings, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export interface CustomField {
  id: string;
  nameAr: string;
  nameEn: string;
  dbField: string;
  keywords: string[];
  targetTables: string[]; // Changed from targetTable to support multiple tables
  targetTable: string; // Keep for backward compatibility
  dataType: 'text' | 'number' | 'boolean' | 'date' | 'select';
  options?: string[]; // Custom options for select type
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
  { id: 'text', nameAr: 'نص حر' },
  { id: 'number', nameAr: 'رقم' },
  { id: 'boolean', nameAr: 'نعم/لا/غير معروف' },
  { id: 'select', nameAr: 'قائمة خيارات محددة' },
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
  const [targetTables, setTargetTables] = useState<string[]>([]);
  const [dataType, setDataType] = useState<'text' | 'number' | 'boolean' | 'date' | 'select'>('text');
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    setCustomFields(getCustomFields());
  }, []);

  const resetForm = () => {
    setNameAr('');
    setNameEn('');
    setKeywords('');
    setTargetTables([]);
    setDataType('text');
    setOptions([]);
    setNewOption('');
    setEditingField(null);
  };

  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (optionToRemove: string) => {
    setOptions(options.filter(opt => opt !== optionToRemove));
  };

  const handleToggleTable = (tableId: string) => {
    setTargetTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(t => t !== tableId)
        : [...prev, tableId]
    );
  };

  const handleSaveField = () => {
    if (!nameAr || !nameEn || targetTables.length === 0) {
      toast.error('يرجى ملء جميع الحقول المطلوبة واختيار جدول واحد على الأقل');
      return;
    }

    if (dataType === 'select' && options.length === 0) {
      toast.error('يرجى إضافة خيار واحد على الأقل للقائمة');
      return;
    }

    const keywordsList = keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
    
    const newField: CustomField = {
      id: editingField?.id || `custom_${Date.now()}`,
      nameAr,
      nameEn,
      dbField: nameEn.toLowerCase().replace(/\s+/g, '_'),
      keywords: [...keywordsList, nameAr.toLowerCase(), nameEn.toLowerCase()],
      targetTables,
      targetTable: targetTables[0], // For backward compatibility
      dataType,
      options: dataType === 'select' ? options : (dataType === 'boolean' ? ['نعم', 'لا', 'غير معروف'] : undefined),
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
    setTargetTables(field.targetTables || [field.targetTable]);
    setDataType(field.dataType);
    setOptions(field.options || []);
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
                  const tables = field.targetTables || [field.targetTable];
                  return (
                    <div 
                      key={field.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-card"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{field.nameAr}</div>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-1 mt-1">
                          {tables.map(tableId => {
                            const tableInfo = getTableInfo(tableId);
                            return (
                              <Badge key={tableId} variant="secondary" className="text-xs">
                                {tableInfo?.icon} {tableInfo?.nameAr}
                              </Badge>
                            );
                          })}
                          <Badge variant="outline" className="text-xs">
                            {DATA_TYPES.find(d => d.id === field.dataType)?.nameAr}
                          </Badge>
                        </div>
                        {field.options && field.options.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            الخيارات: {field.options.join('، ')}
                          </div>
                        )}
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
          
          <p className="text-xs text-primary bg-primary/10 p-2 rounded border border-primary/20">
            💡 الحقول المخصصة تظهر في جميع صفحات الاستيراد (الإعدادات والرعاية الوقائية)
          </p>
          
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
              <Label>الجداول الهدف * (يمكن اختيار أكثر من جدول)</Label>
              <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                {AVAILABLE_TABLES.map(table => (
                  <div key={table.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`table-${table.id}`}
                      checked={targetTables.includes(table.id)}
                      onCheckedChange={() => handleToggleTable(table.id)}
                    />
                    <label 
                      htmlFor={`table-${table.id}`}
                      className="text-sm cursor-pointer flex items-center gap-2 flex-1"
                    >
                      <span>{table.icon}</span>
                      <span>{table.nameAr}</span>
                      <span className="text-xs text-muted-foreground">- {table.description}</span>
                    </label>
                  </div>
                ))}
              </div>
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
              {dataType === 'boolean' && (
                <p className="text-xs text-muted-foreground">
                  الخيارات: نعم، لا، غير معروف
                </p>
              )}
            </div>

            {dataType === 'select' && (
              <div className="space-y-2">
                <Label>خيارات القائمة *</Label>
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="أضف خيار جديد"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                  />
                  <Button type="button" size="sm" onClick={handleAddOption}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {options.map((opt, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {opt}
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(opt)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  مثال: طبيعي، زيادة وزن، سمنة درجة 1، سمنة درجة 2، سمنة درجة 3
                </p>
              </div>
            )}

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
