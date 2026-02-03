// React Query hooks for appointments
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService, Appointment, AppointmentFilters } from '@/services/appointmentService';
import { useToast } from '@/hooks/use-toast';

export function useAppointments(filters: AppointmentFilters = {}) {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => appointmentService.list(filters),
    staleTime: 30_000,
  });
}

export function useAppointment(id: string | undefined) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentService.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useTodayAppointments() {
  return useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: () => appointmentService.getToday(),
    staleTime: 30_000,
  });
}

export function useUpcomingAppointments(days: number = 7) {
  return useQuery({
    queryKey: ['appointments', 'upcoming', days],
    queryFn: () => appointmentService.getUpcoming(days),
    staleTime: 30_000,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<Appointment, 'id'>) => appointmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'تم إنشاء الموعد',
        description: 'تم إضافة الموعد بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إنشاء الموعد',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      appointmentService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', variables.id] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الموعد بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث الموعد',
        variant: 'destructive',
      });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => appointmentService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'تم الإلغاء',
        description: 'تم إلغاء الموعد بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إلغاء الموعد',
        variant: 'destructive',
      });
    },
  });
}
