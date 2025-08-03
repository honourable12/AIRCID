export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  medicalHistory: Array<{
    condition: string;
    diagnosisDate: string;
    severity: 'mild' | 'moderate' | 'severe';
    notes?: string;
  }>;
  enrolledStudies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  medicalHistory?: Array<{
    condition: string;
    diagnosisDate: string;
    severity: 'mild' | 'moderate' | 'severe';
    notes?: string;
  }>;
}

export interface PatientsResponse {
  data: Patient[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

import { env } from '@/utils/env';

const API_BASE = env.API_BASE_URL;

const getAuthHeaders = (): HeadersInit => {
  try {
    const authData = localStorage.getItem('auth-storage');
    if (authData) {
      const parsed = JSON.parse(authData);
      const token = parsed.state?.token || parsed.token || parsed.state?.state?.token;
      if (token) {
        return {
          'Authorization': `Bearer ${token}`,
        };
      }
    }
    return {};
  } catch (error) {
    console.error('Error parsing auth data from localStorage:', error);
    return {};
  }
};

export const patientsService = {
  async getAllPatients(params?: {
    page?: number;
    pageSize?: number;
    q?: string;
    age?: number;
    gender?: string;
    condition?: string;
  }): Promise<PatientsResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(`${API_BASE}/patients?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch patients');
    }
    return response.json();
  },

  async getPatientById(id: string): Promise<Patient> {
    const response = await fetch(`${API_BASE}/patients/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch patient');
    }
    const result = await response.json();
    return result.data;
  },

  async createPatient(patient: CreatePatientRequest): Promise<Patient> {
    const response = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patient),
    });
    if (!response.ok) {
      throw new Error('Failed to create patient');
    }
    const result = await response.json();
    return result.data;
  },

  async updatePatient(id: string, patient: CreatePatientRequest): Promise<Patient> {
    const response = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patient),
    });
    if (!response.ok) {
      throw new Error('Failed to update patient');
    }
    const result = await response.json();
    return result.data;
  },

  async deletePatient(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete patient');
    }
  },

  async searchPatients(searchCriteria: any): Promise<Patient[]> {
    const response = await fetch(`${API_BASE}/patients/search`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchCriteria),
    });
    if (!response.ok) {
      throw new Error('Failed to search patients');
    }
    const result = await response.json();
    return result.data;
  },

  async getPatientMedicalHistory(id: string): Promise<any> {
    const response = await fetch(`${API_BASE}/patients/${id}/medical-history`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch patient medical history');
    }
    const result = await response.json();
    return result.data;
  }
};
