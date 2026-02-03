// Export all services
export * from './authService';
export * from './patientService';
export * from './statsService';
export * from './teamService';
export * from './medicationService';
export * from './appointmentService';

// Re-export API client
export { api, apiConfig } from '@/lib/api';
