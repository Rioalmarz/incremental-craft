// React Query hooks for medications
import { useQuery } from '@tanstack/react-query';
import { medicationService } from '@/services/medicationService';

export function usePatientMedications(patientId: string | undefined) {
  return useQuery({
    queryKey: ['medications', 'patient', patientId],
    queryFn: () => medicationService.getByPatient(patientId!),
    enabled: !!patientId,
    staleTime: 30_000,
  });
}

export function useMedicationSummary() {
  return useQuery({
    queryKey: ['medications', 'summary'],
    queryFn: () => medicationService.getSummary(),
    staleTime: 60_000,
  });
}

export function useMedicationsByCategory(category: string) {
  return useQuery({
    queryKey: ['medications', 'category', category],
    queryFn: () => medicationService.getByCategory(category),
    staleTime: 60_000,
  });
}
