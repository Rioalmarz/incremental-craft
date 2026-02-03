// Statistics Service for MOH Internal Server
import { api } from '@/lib/api';
import { getMockDashboardStats, TEAM_DATA, KPI_DATA, DISEASE_DISTRIBUTION, ENGAGEMENT_DISTRIBUTION, useMockData } from '@/lib/mockData';

export interface DashboardStats {
  totalEnrolled: number;
  reservePool: number;
  teams: typeof TEAM_DATA;
  sharedSupport: { name_ar: string; name_en: string; role: string; member_type: string }[];
  kpis: {
    dmControlRate: number;
    htnControlRate: number;
    contactRate: number;
    aiPredictionIndex: number;
    highUtilizers: number;
    dmImprovement: number;
  };
  diseaseDistribution: {
    dm: number;
    htn: number;
    obesity: number;
    dlp: number;
    multiMorbid: number;
    healthy: number;
  };
  engagementLevels: typeof ENGAGEMENT_DISTRIBUTION;
}

export interface ControlRates {
  byDisease: {
    diabetes: { controlled: number; monitoring: number; uncontrolled: number };
    hypertension: { controlled: number; elevated: number; stage1: number; stage2: number };
    dyslipidemia: { controlled: number; moderate: number; uncontrolled: number };
    obesity: { manageable: number; classII: number; classIII: number };
  };
  byTeam: {
    team1: { dm: number; htn: number; dlp: number };
    team2: { dm: number; htn: number; dlp: number };
    team3: { dm: number; htn: number; dlp: number };
    team4: { dm: number; htn: number; dlp: number };
  };
  methods: {
    clinicalTarget: Record<string, number>;
    treatmentAdequacy: Record<string, number>;
    engagementAdjusted: Record<string, number>;
    compositeControl: Record<string, number>;
  };
}

export interface TeamStats {
  id: number;
  name_ar: string;
  name_en: string;
  patient_count: number;
  contact_rate: number;
  dm_control_rate: number;
  htn_control_rate: number;
  ai_prediction_rate: number;
  members: { name_ar: string; name_en: string; role: string }[];
  capacity_warning?: string;
}

export const statsService = {
  /**
   * Get dashboard overview stats
   */
  async getOverview(): Promise<DashboardStats> {
    if (useMockData) {
      return new Promise(resolve => {
        setTimeout(() => resolve(getMockDashboardStats()), 200);
      });
    }
    return api.get<DashboardStats>('/stats/overview');
  },

  /**
   * Get control rates by disease and team
   */
  async getControlRates(): Promise<ControlRates> {
    if (useMockData) {
      return new Promise(resolve => {
        setTimeout(() => resolve({
          byDisease: {
            diabetes: { controlled: 46.7, monitoring: 25.0, uncontrolled: 28.3 },
            hypertension: { controlled: 14.5, elevated: 15.5, stage1: 40.0, stage2: 30.0 },
            dyslipidemia: { controlled: 38.3, moderate: 26.9, uncontrolled: 34.8 },
            obesity: { manageable: 59.6, classII: 25.4, classIII: 15.0 },
          },
          byTeam: {
            team1: { dm: 50.6, htn: 30.8, dlp: 34.3 },
            team2: { dm: 34.2, htn: 25.3, dlp: 42.3 },
            team3: { dm: 58.5, htn: 34.7, dlp: 31.6 },
            team4: { dm: 43.4, htn: 29.3, dlp: 45.2 },
          },
          methods: {
            clinicalTarget: {
              dmControlled: 46.7,
              dmImproved: 79.8,
              htnControlled: 30.0,
              htnStrictly: 14.5,
              obesityManageable: 59.6,
              dlpControlled: 38.3,
            },
            treatmentAdequacy: {
              dmOnMeds: 35.0,
              htnOnMeds: 33.6,
              dlpOnMeds: 31.3,
            },
            engagementAdjusted: {
              dm3Visits: 46.7,
              dm7Visits: 47.1,
              htn3Visits: 30.2,
            },
            compositeControl: {
              dmHtnDual: 16.0,
              tripleDisease: 52.6,
              anyTargetMet: 87.2,
            },
          },
        }), 200);
      });
    }
    return api.get<ControlRates>('/stats/control-rates');
  },

  /**
   * Get engagement stats
   */
  async getEngagement(): Promise<typeof ENGAGEMENT_DISTRIBUTION & { contactByTeam: Record<string, number> }> {
    if (useMockData) {
      return new Promise(resolve => {
        setTimeout(() => resolve({
          ...ENGAGEMENT_DISTRIBUTION,
          contactByTeam: {
            team1: 95,
            team2: 47,
            team3: 98,
            team4: 92,
          },
        }), 200);
      });
    }
    return api.get('/stats/engagement');
  },

  /**
   * Get team comparison stats
   */
  async getTeamStats(): Promise<TeamStats[]> {
    if (useMockData) {
      return new Promise(resolve => {
        setTimeout(() => resolve(TEAM_DATA.map(t => ({
          id: t.id,
          name_ar: t.name_ar,
          name_en: t.name_en,
          patient_count: t.patient_count,
          contact_rate: t.contact_rate,
          dm_control_rate: t.dm_control_rate,
          htn_control_rate: t.htn_control_rate,
          ai_prediction_rate: t.ai_prediction_rate,
          members: t.members,
          capacity_warning: t.capacity_warning,
        }))), 200);
      });
    }
    return api.get<TeamStats[]>('/stats/teams');
  },

  /**
   * Get gap analysis
   */
  async getGapAnalysis(): Promise<{
    ldlCoverage: { tested: number; total: number; percentage: number };
    missingHba1c: number;
    missingBp: number;
    noRecentLabs: number;
  }> {
    if (useMockData) {
      return new Promise(resolve => {
        setTimeout(() => resolve({
          ldlCoverage: { tested: 141, total: 16000, percentage: 0.9 },
          missingHba1c: 2340,
          missingBp: 3200,
          noRecentLabs: 4100,
        }), 200);
      });
    }
    return api.get('/stats/gaps');
  },

  /**
   * Get demographics
   */
  async getDemographics(): Promise<{
    ageGroups: Record<string, number>;
    genderSplit: { male: number; female: number };
    diseaseCountDistribution: Record<number, number>;
  }> {
    if (useMockData) {
      return new Promise(resolve => {
        setTimeout(() => resolve({
          ageGroups: {
            '20-29': 1200,
            '30-39': 2800,
            '40-49': 4200,
            '50-59': 4000,
            '60-69': 2600,
            '70+': 1200,
          },
          genderSplit: { male: 7680, female: 8320 },
          diseaseCountDistribution: {
            0: 11985,
            1: 2620,
            2: 945,
            3: 377,
            4: 73,
          },
        }), 200);
      });
    }
    return api.get('/stats/demographics');
  },
};
