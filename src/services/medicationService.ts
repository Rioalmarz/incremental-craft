// Medication Service for MOH Internal Server
import { api } from '@/lib/api';
import { useMockData } from '@/lib/mockData';

export interface Medication {
  id: string;
  patient_id: string;
  drug_name: string;
  drug_category: 'Antidiabetic' | 'Antihypertensive' | 'Lipid-Lowering' | 'Other';
  dosage?: string;
  rx_date?: string;
}

export interface MedicationSummary {
  topDrugs: { name: string; category: string; count: number }[];
  categoryTotals: { category: string; count: number; percentage: number }[];
  treatmentAdequacy: {
    dm: { onMeds: number; total: number; percentage: number };
    htn: { onMeds: number; total: number; percentage: number };
    dlp: { onMeds: number; total: number; percentage: number };
  };
  overallOnMedication: number;
}

// Mock medication data based on real report
const MOCK_TOP_DRUGS = [
  { name: 'Metformin', category: 'Antidiabetic', count: 1394 },
  { name: 'Atorvastatin', category: 'Lipid-Lowering', count: 1023 },
  { name: 'Amlodipine', category: 'Antihypertensive', count: 728 },
  { name: 'Valsartan', category: 'Antihypertensive', count: 699 },
  { name: 'Empagliflozin (SGLT2i)', category: 'Antidiabetic', count: 603 },
  { name: 'Insulin', category: 'Antidiabetic', count: 536 },
  { name: 'Sitagliptin (DPP4i)', category: 'Antidiabetic', count: 516 },
  { name: 'Rosuvastatin', category: 'Lipid-Lowering', count: 458 },
  { name: 'Perindopril', category: 'Antihypertensive', count: 361 },
  { name: 'Gliclazide (SU)', category: 'Antidiabetic', count: 345 },
  { name: 'Bisoprolol', category: 'Antihypertensive', count: 269 },
];

export const medicationService = {
  /**
   * Get medications for a patient
   */
  async getByPatient(patientId: string): Promise<Medication[]> {
    if (useMockData) {
      return new Promise(resolve => {
        setTimeout(() => resolve([
          {
            id: '1',
            patient_id: patientId,
            drug_name: 'Metformin',
            drug_category: 'Antidiabetic',
            dosage: '500mg',
          },
          {
            id: '2',
            patient_id: patientId,
            drug_name: 'Amlodipine',
            drug_category: 'Antihypertensive',
            dosage: '5mg',
          },
        ]), 100);
      });
    }
    return api.get<Medication[]>(`/medications?patient_id=${patientId}`);
  },

  /**
   * Get medication summary
   */
  async getSummary(): Promise<MedicationSummary> {
    if (useMockData) {
      const totalDm = 1547;
      const totalHtn = 1189;
      const totalDlp = 453;
      
      return new Promise(resolve => {
        setTimeout(() => resolve({
          topDrugs: MOCK_TOP_DRUGS,
          categoryTotals: [
            { category: 'Antidiabetic', count: 3394, percentage: 46.8 },
            { category: 'Antihypertensive', count: 2057, percentage: 28.4 },
            { category: 'Lipid-Lowering', count: 1481, percentage: 20.4 },
            { category: 'Other', count: 320, percentage: 4.4 },
          ],
          treatmentAdequacy: {
            dm: { onMeds: Math.round(totalDm * 0.35), total: totalDm, percentage: 35.0 },
            htn: { onMeds: Math.round(totalHtn * 0.336), total: totalHtn, percentage: 33.6 },
            dlp: { onMeds: Math.round(totalDlp * 0.313), total: totalDlp, percentage: 31.3 },
          },
          overallOnMedication: 22.7,
        }), 200);
      });
    }
    return api.get<MedicationSummary>('/medications/summary');
  },

  /**
   * Get medications by category
   */
  async getByCategory(category: string): Promise<{ name: string; count: number }[]> {
    if (useMockData) {
      const filtered = MOCK_TOP_DRUGS.filter(d => d.category === category);
      return new Promise(resolve => {
        setTimeout(() => resolve(filtered.map(d => ({ name: d.name, count: d.count }))), 100);
      });
    }
    return api.get(`/medications?category=${category}`);
  },
};
