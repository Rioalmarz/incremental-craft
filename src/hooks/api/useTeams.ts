// React Query hooks for teams
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService, Team } from '@/services/teamService';
import { useToast } from '@/hooks/use-toast';

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.getAll(),
    staleTime: 60_000,
  });
}

export function useTeam(id: number | undefined) {
  return useQuery({
    queryKey: ['team', id],
    queryFn: () => teamService.getById(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: () => teamService.getAllMembers(),
    staleTime: 60_000,
  });
}

export function useSharedSupport() {
  return useQuery({
    queryKey: ['shared-support'],
    queryFn: () => teamService.getSharedSupport(),
    staleTime: 60_000,
  });
}

export function useTeamComparison() {
  return useQuery({
    queryKey: ['teams', 'comparison'],
    queryFn: () => teamService.getComparison(),
    staleTime: 60_000,
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Team> }) =>
      teamService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', variables.id] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث بيانات الفريق بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث الفريق',
        variant: 'destructive',
      });
    },
  });
}
