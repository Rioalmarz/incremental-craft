// Authentication Service for MOH Internal Server
import { api } from '@/lib/api';
import { useMockData } from '@/lib/mockData';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name_ar: string;
  name_en?: string;
  role: 'admin' | 'physician' | 'viewer';
  team_id?: number;
  center_id?: string;
  avatar_url?: string;
  job_title?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Mock users for development
const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
  mahdi: {
    password: '116140',
    user: {
      id: '1',
      email: 'mahdi@tbc.local',
      username: 'mahdi',
      name_ar: 'مهدي',
      name_en: 'Mahdi',
      role: 'admin',
      center_id: 'khalid-model-phc',
    },
  },
  rayan: {
    password: '116140',
    user: {
      id: '2',
      email: 'rayan@tbc.local',
      username: 'rayan',
      name_ar: 'ريان المرزوقي',
      name_en: 'Rayan Almarzuqi',
      role: 'admin',
      center_id: 'khalid-model-phc',
      job_title: 'Consultant Family Medicine',
      team_id: 1,
    },
  },
  firas: {
    password: '116140',
    user: {
      id: '3',
      email: 'firas@tbc.local',
      username: 'firas',
      name_ar: 'فراس',
      name_en: 'Firas',
      role: 'admin',
      center_id: 'khalid-model-phc',
    },
  },
  physician: {
    password: 'physician123',
    user: {
      id: '4',
      email: 'physician@tbc.local',
      username: 'physician',
      name_ar: 'طبيب عام',
      name_en: 'General Physician',
      role: 'physician',
      center_id: 'khalid-model-phc',
      team_id: 1,
    },
  },
  viewer: {
    password: 'viewer123',
    user: {
      id: '5',
      email: 'viewer@tbc.local',
      username: 'viewer',
      name_ar: 'مشاهد',
      name_en: 'Viewer',
      role: 'viewer',
      center_id: 'khalid-model-phc',
    },
  },
};

export const authService = {
  /**
   * Login with username and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    if (useMockData) {
      // Mock authentication
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const mockUser = MOCK_USERS[credentials.username.toLowerCase()];
          if (mockUser && mockUser.password === credentials.password) {
            const token = `mock_token_${Date.now()}_${credentials.username}`;
            api.setToken(token);
            resolve({ token, user: mockUser.user });
          } else {
            reject({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة', status: 401 });
          }
        }, 500);
      });
    }

    const response = await api.post<LoginResponse>('/auth/login', {
      email: `${credentials.username.toLowerCase()}@tbc.local`,
      password: credentials.password,
    });
    api.setToken(response.token);
    return response;
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    if (!useMockData) {
      try {
        await api.post('/auth/logout', {});
      } catch {
        // Ignore logout errors
      }
    }
    api.clearToken();
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!api.getToken()) {
      return null;
    }

    if (useMockData) {
      // Parse mock token to get username
      const token = api.getToken();
      if (token?.startsWith('mock_token_')) {
        const parts = token.split('_');
        const username = parts[parts.length - 1];
        const mockUser = MOCK_USERS[username];
        if (mockUser) {
          return mockUser.user;
        }
      }
      return null;
    }

    try {
      return await api.get<AuthUser>('/auth/me');
    } catch {
      api.clearToken();
      return null;
    }
  },

  /**
   * Check if user has specific role
   */
  hasRole(user: AuthUser | null, role: 'admin' | 'physician' | 'viewer'): boolean {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has all permissions
    return user.role === role;
  },

  /**
   * Check if user is admin
   */
  isAdmin(user: AuthUser | null): boolean {
    return user?.role === 'admin';
  },

  /**
   * Check if user can edit patients
   */
  canEditPatients(user: AuthUser | null): boolean {
    return user?.role === 'admin' || user?.role === 'physician';
  },
};
