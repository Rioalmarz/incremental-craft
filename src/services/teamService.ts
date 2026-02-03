// Team Service for MOH Internal Server
import { api } from '@/lib/api';
import { TEAM_DATA, SHARED_SUPPORT, useMockData } from '@/lib/mockData';

export interface TeamMember {
  id?: string;
  name_ar: string;
  name_en: string;
  role: string;
  member_type: 'physician' | 'nurse' | 'shared_support';
  team_id?: number;
  is_shared?: boolean;
}

export interface Team {
  id: number;
  name_ar: string;
  name_en: string;
  color: string;
  patient_count: number;
  contact_rate: number;
  dm_control_rate: number;
  htn_control_rate: number;
  ai_prediction_rate: number;
  members: TeamMember[];
  capacity_warning?: string;
}

export const teamService = {
  /**
   * Get all teams
   */
  async getAll(): Promise<Team[]> {
    if (useMockData) {
      return new Promise(resolve => {
        setTimeout(() => resolve(TEAM_DATA.map(t => ({
          ...t,
          members: t.members as TeamMember[],
        }))), 200);
      });
    }
    return api.get<Team[]>('/teams');
  },

  /**
   * Get team by ID
   */
  async getById(id: number): Promise<Team | null> {
    if (useMockData) {
      const team = TEAM_DATA.find(t => t.id === id);
      return new Promise(resolve => {
        setTimeout(() => resolve(team ? { ...team, members: team.members as TeamMember[] } : null), 100);
      });
    }
    return api.get<Team>(`/teams/${id}`);
  },

  /**
   * Get all team members including shared support
   */
  async getAllMembers(): Promise<TeamMember[]> {
    if (useMockData) {
      const allMembers: TeamMember[] = [];
      
      // Add team members
      TEAM_DATA.forEach(team => {
        team.members.forEach(member => {
          allMembers.push({
            ...member,
            team_id: team.id,
            is_shared: false,
          } as TeamMember);
        });
      });

      // Add shared support
      SHARED_SUPPORT.forEach(member => {
        allMembers.push({
          ...member,
          is_shared: true,
        } as TeamMember);
      });

      return new Promise(resolve => setTimeout(() => resolve(allMembers), 100));
    }
    return api.get<TeamMember[]>('/team-members');
  },

  /**
   * Get shared support staff
   */
  async getSharedSupport(): Promise<TeamMember[]> {
    if (useMockData) {
      return new Promise(resolve => {
        setTimeout(() => resolve(SHARED_SUPPORT.map(s => ({
          ...s,
          is_shared: true,
        } as TeamMember))), 100);
      });
    }
    return api.get<TeamMember[]>('/team-members?shared=true');
  },

  /**
   * Update team
   */
  async update(id: number, data: Partial<Team>): Promise<Team> {
    if (useMockData) {
      const team = TEAM_DATA.find(t => t.id === id);
      if (!team) throw { message: 'Team not found', status: 404 };
      return new Promise(resolve => {
        setTimeout(() => resolve({ ...team, ...data, members: team.members as TeamMember[] }), 200);
      });
    }
    return api.put<Team>(`/teams/${id}`, data);
  },

  /**
   * Get team comparison data
   */
  async getComparison(): Promise<{
    teams: Team[];
    bestPerformer: { dm: number; htn: number; contact: number };
    averages: { dm: number; htn: number; contact: number; ai: number };
  }> {
    const teams = await this.getAll();
    
    const avgDm = teams.reduce((sum, t) => sum + t.dm_control_rate, 0) / teams.length;
    const avgHtn = teams.reduce((sum, t) => sum + t.htn_control_rate, 0) / teams.length;
    const avgContact = teams.reduce((sum, t) => sum + t.contact_rate, 0) / teams.length;
    const avgAi = teams.reduce((sum, t) => sum + t.ai_prediction_rate, 0) / teams.length;

    const bestDm = teams.reduce((best, t) => t.dm_control_rate > best.dm_control_rate ? t : best);
    const bestHtn = teams.reduce((best, t) => t.htn_control_rate > best.htn_control_rate ? t : best);
    const bestContact = teams.reduce((best, t) => t.contact_rate > best.contact_rate ? t : best);

    return {
      teams,
      bestPerformer: {
        dm: bestDm.id,
        htn: bestHtn.id,
        contact: bestContact.id,
      },
      averages: {
        dm: Math.round(avgDm * 10) / 10,
        htn: Math.round(avgHtn * 10) / 10,
        contact: Math.round(avgContact * 10) / 10,
        ai: Math.round(avgAi * 10) / 10,
      },
    };
  },
};
