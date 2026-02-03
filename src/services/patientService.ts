// Patient Service for MOH Internal Server
import { api } from '@/lib/api';
import { generateMockPatients, generateReservePatients, useMockData } from '@/lib/mockData';
import { Tables } from '@/integrations/supabase/types';

type Patient = Tables<'patients'>;

export interface PatientFilters {
  team_id?: string;
  has_dm?: boolean;
  has_htn?: boolean;
  has_dlp?: boolean;
  risk_level?: string;
  contacted?: boolean;
  pool?: 'enrolled' | 'reserve';
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Cache for mock patients
let mockPatientsCache: Partial<Patient>[] | null = null;
let mockReserveCache: Partial<Patient>[] | null = null;

function getMockPatients(): Partial<Patient>[] {
  if (!mockPatientsCache) {
    mockPatientsCache = generateMockPatients(16000);
  }
  return mockPatientsCache;
}

function getMockReserve(): Partial<Patient>[] {
  if (!mockReserveCache) {
    mockReserveCache = generateReservePatients(1317);
  }
  return mockReserveCache;
}

function filterMockPatients(
  patients: Partial<Patient>[],
  filters: PatientFilters
): PaginatedResponse<Partial<Patient>> {
  let filtered = [...patients];

  if (filters.team_id) {
    filtered = filtered.filter(p => p.team === filters.team_id);
  }
  if (filters.has_dm !== undefined) {
    filtered = filtered.filter(p => p.has_dm === filters.has_dm);
  }
  if (filters.has_htn !== undefined) {
    filtered = filtered.filter(p => p.has_htn === filters.has_htn);
  }
  if (filters.has_dlp !== undefined) {
    filtered = filtered.filter(p => p.has_dyslipidemia === filters.has_dlp);
  }
  if (filters.risk_level) {
    filtered = filtered.filter(p => p.risk_classification === filters.risk_level);
  }
  if (filters.contacted !== undefined) {
    filtered = filtered.filter(p => p.contacted === filters.contacted);
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.national_id?.includes(search)
    );
  }

  const total = filtered.length;
  const page = filters.page || 1;
  const limit = filters.limit || 25;
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export const patientService = {
  /**
   * List patients with filters and pagination
   */
  async list(filters: PatientFilters = {}): Promise<PaginatedResponse<Partial<Patient>>> {
    if (useMockData) {
      const patients = filters.pool === 'reserve' ? getMockReserve() : getMockPatients();
      return new Promise(resolve => {
        setTimeout(() => resolve(filterMockPatients(patients, filters)), 200);
      });
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    return api.get<PaginatedResponse<Partial<Patient>>>(`/patients?${params}`);
  },

  /**
   * Get patient by ID
   */
  async getById(id: string): Promise<Partial<Patient> | null> {
    if (useMockData) {
      const allPatients = [...getMockPatients(), ...getMockReserve()];
      const patient = allPatients.find(p => p.id === id);
      return new Promise(resolve => setTimeout(() => resolve(patient || null), 100));
    }
    return api.get<Partial<Patient>>(`/patients/${id}`);
  },

  /**
   * Create new patient
   */
  async create(data: Partial<Patient>): Promise<Partial<Patient>> {
    if (useMockData) {
      const newPatient = {
        ...data,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (mockPatientsCache) {
        mockPatientsCache.unshift(newPatient);
      }
      return new Promise(resolve => setTimeout(() => resolve(newPatient), 200));
    }
    return api.post<Partial<Patient>>('/patients', data);
  },

  /**
   * Update patient
   */
  async update(id: string, data: Partial<Patient>): Promise<Partial<Patient>> {
    if (useMockData) {
      const allPatients = mockPatientsCache || [];
      const index = allPatients.findIndex(p => p.id === id);
      if (index !== -1) {
        allPatients[index] = { ...allPatients[index], ...data, updated_at: new Date().toISOString() };
        return new Promise(resolve => setTimeout(() => resolve(allPatients[index]), 200));
      }
      throw { message: 'Patient not found', status: 404 };
    }
    return api.put<Partial<Patient>>(`/patients/${id}`, data);
  },

  /**
   * Delete patient
   */
  async delete(id: string): Promise<void> {
    if (useMockData) {
      if (mockPatientsCache) {
        mockPatientsCache = mockPatientsCache.filter(p => p.id !== id);
      }
      return new Promise(resolve => setTimeout(resolve, 200));
    }
    return api.delete(`/patients/${id}`);
  },

  /**
   * Import patients from Excel
   */
  async importExcel(file: File): Promise<{ imported: number; errors: string[] }> {
    if (useMockData) {
      return new Promise(resolve => {
        setTimeout(() => resolve({ imported: 100, errors: [] }), 1000);
      });
    }
    return api.uploadFile('/patients/import', file);
  },

  /**
   * Export patients to Excel
   */
  async exportExcel(password?: string): Promise<Blob> {
    if (useMockData) {
      // Return mock blob
      return new Promise(resolve => {
        setTimeout(() => resolve(new Blob(['mock data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })), 500);
      });
    }
    const params = password ? `?password=${encodeURIComponent(password)}` : '';
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/patients/export${params}`, {
      headers: { Authorization: `Bearer ${api.getToken()}` },
    });
    return response.blob();
  },

  /**
   * Get patients by team
   */
  async getByTeam(teamId: number): Promise<Partial<Patient>[]> {
    const result = await this.list({ team_id: `team${teamId}`, limit: 4000 });
    return result.data;
  },

  /**
   * Get high risk patients
   */
  async getHighRisk(): Promise<Partial<Patient>[]> {
    const result = await this.list({ risk_level: 'High', limit: 100 });
    return result.data;
  },
};
