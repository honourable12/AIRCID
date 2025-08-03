import { 
  Patient, 
  PatientMatch, 
  ApiResponse, 
  PaginatedResponse 
} from '@/types';

import { env } from '@/utils/env';

const API_BASE = env.API_BASE_URL;

export class PatientService {
  static async getPatients(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Patient>> {
    const response = await fetch(`${API_BASE}/patients?page=${page}&pageSize=${pageSize}`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  static async getPatient(id: string): Promise<ApiResponse<Patient>> {
    const response = await fetch(`${API_BASE}/patients/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  static async getPatientMatches(studyId: string): Promise<ApiResponse<PatientMatch[]>> {
    const response = await fetch(`${API_BASE}/studies/${studyId}/matches`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  static async reviewPatientMatch(
    matchId: string, 
    status: 'eligible' | 'ineligible', 
    notes?: string
  ): Promise<ApiResponse<PatientMatch>> {
    const response = await fetch(`${API_BASE}/matches/${matchId}/review`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, notes }),
    });
    return response.json();
  }

  static async enrollPatient(studyId: string, patientId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE}/studies/${studyId}/enroll`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ patientId }),
    });
    return response.json();
  }

  static async searchPatients(query: string): Promise<ApiResponse<Patient[]>> {
    const response = await fetch(`${API_BASE}/patients/search?q=${encodeURIComponent(query)}`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth-storage');
    if (token) {
      const parsed = JSON.parse(token);
      if (parsed.state?.token) {
        return {
          'Authorization': `Bearer ${parsed.state.token}`,
        };
      }
    }
    return {};
  }
}
