// Appointment Service for MOH Internal Server
import { api } from '@/lib/api';
import { useMockData } from '@/lib/mockData';

export interface Appointment {
  id: string;
  patient_id: string;
  patient_name?: string;
  appointment_date: string;
  appointment_type: 'Virtual' | 'Physical';
  status: 'Scheduled' | 'Completed' | 'No-Show' | 'Cancelled';
  physician_id?: string;
  physician_name?: string;
  notes?: string;
  created_at?: string;
}

export interface AppointmentFilters {
  date?: string;
  physician_id?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

// Mock appointments
const generateMockAppointments = (): Appointment[] => {
  const appointments: Appointment[] = [];
  const types: ('Virtual' | 'Physical')[] = ['Virtual', 'Physical'];
  const statuses: Appointment['status'][] = ['Scheduled', 'Completed', 'No-Show', 'Cancelled'];
  const physicians = [
    { id: '1', name: 'د. ريان المرزوقي' },
    { id: '2', name: 'د. منى الحيدري' },
    { id: '3', name: 'د. محمود سيت' },
    { id: '4', name: 'د. ريهام المالكي' },
  ];

  for (let i = 0; i < 50; i++) {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 30) - 15);
    const physician = physicians[Math.floor(Math.random() * physicians.length)];
    
    appointments.push({
      id: crypto.randomUUID(),
      patient_id: crypto.randomUUID(),
      patient_name: `مريض ${i + 1}`,
      appointment_date: date.toISOString(),
      appointment_type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      physician_id: physician.id,
      physician_name: physician.name,
    });
  }

  return appointments;
};

let mockAppointmentsCache: Appointment[] | null = null;

function getMockAppointments(): Appointment[] {
  if (!mockAppointmentsCache) {
    mockAppointmentsCache = generateMockAppointments();
  }
  return mockAppointmentsCache;
}

export const appointmentService = {
  /**
   * List appointments with filters
   */
  async list(filters: AppointmentFilters = {}): Promise<Appointment[]> {
    if (useMockData) {
      let appointments = getMockAppointments();
      
      if (filters.date) {
        const filterDate = new Date(filters.date).toDateString();
        appointments = appointments.filter(a => 
          new Date(a.appointment_date).toDateString() === filterDate
        );
      }
      if (filters.physician_id) {
        appointments = appointments.filter(a => a.physician_id === filters.physician_id);
      }
      if (filters.status) {
        appointments = appointments.filter(a => a.status === filters.status);
      }
      if (filters.type) {
        appointments = appointments.filter(a => a.appointment_type === filters.type);
      }

      return new Promise(resolve => setTimeout(() => resolve(appointments), 100));
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    return api.get<Appointment[]>(`/appointments?${params}`);
  },

  /**
   * Get appointment by ID
   */
  async getById(id: string): Promise<Appointment | null> {
    if (useMockData) {
      const appointment = getMockAppointments().find(a => a.id === id);
      return new Promise(resolve => setTimeout(() => resolve(appointment || null), 100));
    }
    return api.get<Appointment>(`/appointments/${id}`);
  },

  /**
   * Create new appointment
   */
  async create(data: Omit<Appointment, 'id'>): Promise<Appointment> {
    if (useMockData) {
      const newAppointment = {
        ...data,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      if (mockAppointmentsCache) {
        mockAppointmentsCache.unshift(newAppointment);
      }
      return new Promise(resolve => setTimeout(() => resolve(newAppointment), 200));
    }
    return api.post<Appointment>('/appointments', data);
  },

  /**
   * Update appointment
   */
  async update(id: string, data: Partial<Appointment>): Promise<Appointment> {
    if (useMockData) {
      const appointments = getMockAppointments();
      const index = appointments.findIndex(a => a.id === id);
      if (index !== -1) {
        appointments[index] = { ...appointments[index], ...data };
        return new Promise(resolve => setTimeout(() => resolve(appointments[index]), 200));
      }
      throw { message: 'Appointment not found', status: 404 };
    }
    return api.put<Appointment>(`/appointments/${id}`, data);
  },

  /**
   * Cancel appointment
   */
  async cancel(id: string): Promise<void> {
    return this.update(id, { status: 'Cancelled' }).then(() => {});
  },

  /**
   * Get appointments for today
   */
  async getToday(): Promise<Appointment[]> {
    return this.list({ date: new Date().toISOString().split('T')[0] });
  },

  /**
   * Get upcoming appointments
   */
  async getUpcoming(days: number = 7): Promise<Appointment[]> {
    const appointments = await this.list();
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return appointments.filter(a => {
      const date = new Date(a.appointment_date);
      return date >= now && date <= futureDate && a.status === 'Scheduled';
    });
  },
};
