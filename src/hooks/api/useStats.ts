// React Query hooks for statistics
import { useQuery } from '@tanstack/react-query';
import { statsService } from '@/services/statsService';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: () => statsService.getOverview(),
    staleTime: 60_000,
  });
}

export function useControlRates() {
  return useQuery({
    queryKey: ['stats', 'control-rates'],
    queryFn: () => statsService.getControlRates(),
    staleTime: 60_000,
  });
}

export function useEngagementStats() {
  return useQuery({
    queryKey: ['stats', 'engagement'],
    queryFn: () => statsService.getEngagement(),
    staleTime: 60_000,
  });
}

export function useTeamStats() {
  return useQuery({
    queryKey: ['stats', 'teams'],
    queryFn: () => statsService.getTeamStats(),
    staleTime: 60_000,
  });
}

export function useGapAnalysis() {
  return useQuery({
    queryKey: ['stats', 'gaps'],
    queryFn: () => statsService.getGapAnalysis(),
    staleTime: 60_000,
  });
}

export function useDemographics() {
  return useQuery({
    queryKey: ['stats', 'demographics'],
    queryFn: () => statsService.getDemographics(),
    staleTime: 60_000,
  });
}
