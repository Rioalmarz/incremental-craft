// React Query hooks for patients
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService, PatientFilters, PaginatedResponse } from '@/services/patientService';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Patient = Tables<'patients'>;

export function usePatients(filters: PatientFilters = {}) {
  return useQuery({
    queryKey: ['patients', filters],
    queryFn: () => patientService.list(filters),
    staleTime: 30_000,
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function usePatientsByTeam(teamId: number) {
  return useQuery({
    queryKey: ['patients', 'team', teamId],
    queryFn: () => patientService.getByTeam(teamId),
    staleTime: 30_000,
  });
}

export function useHighRiskPatients() {
  return useQuery({
    queryKey: ['patients', 'high-risk'],
    queryFn: () => patientService.getHighRisk(),
    staleTime: 60_000,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Partial<Patient>) => patientService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({
        title: 'تم إنشاء المريض',
        description: 'تم إضافة المريض بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إنشاء المريض',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Patient> }) =>
      patientService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', variables.id] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث بيانات المريض بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث المريض',
        variant: 'destructive',
      });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => patientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المريض بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حذف المريض',
        variant: 'destructive',
      });
    },
  });
}

export function useImportPatients() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (file: File) => patientService.importExcel(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({
        title: 'تم الاستيراد',
        description: `تم استيراد ${result.imported} مريض بنجاح`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في استيراد البيانات',
        variant: 'destructive',
      });
    },
  });
}
