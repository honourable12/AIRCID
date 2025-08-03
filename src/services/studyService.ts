import { 
  Study, 
  CreateStudyRequest, 
  ApiResponse, 
  PaginatedResponse 
} from '@/types';

import { env } from '@/utils/env';

const API_BASE = env.API_BASE_URL;

export class StudyService {
  static async getStudies(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Study>> {
    try {
      const response = await fetch(`${API_BASE}/studies?page=${page}&pageSize=${pageSize}`);
      
      if (!response.ok) {
        console.error('Failed to fetch studies:', response.status, response.statusText);
        throw new Error(`Failed to fetch studies: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in getStudies:', error);
      throw error;
    }
  }

  static async getStudy(id: string): Promise<ApiResponse<Study>> {
    const response = await fetch(`${API_BASE}/studies/${id}`);
    return response.json();
  }

  static async createStudy(study: CreateStudyRequest): Promise<ApiResponse<Study>> {
    try {
      console.log('Creating study:', study);
      console.log('API_BASE:', API_BASE);
      console.log('Auth headers:', this.getAuthHeaders());
      
      const response = await fetch(`${API_BASE}/studies`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(study),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create study:', response.status, response.statusText, errorText);
        throw new Error(`Failed to create study: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Create study result:', result);
      return result;
    } catch (error) {
      console.error('Error in createStudy:', error);
      throw error;
    }
  }

  static async updateStudy(id: string, study: Partial<Study>): Promise<ApiResponse<Study>> {
    const response = await fetch(`${API_BASE}/studies/${id}`, {
      method: 'PATCH',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(study),
    });
    return response.json();
  }

  static async deleteStudy(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE}/studies/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  static async getStudyStats(id: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE}/studies/${id}/stats`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  private static getAuthHeaders(): HeadersInit {
    try {
      const authData = localStorage.getItem('auth-storage');
      console.log('Auth data from localStorage:', authData);
      
      if (authData) {
        const parsed = JSON.parse(authData);
        console.log('Parsed auth data:', parsed);
        
        // Try different possible token locations in the storage
        const token = parsed.state?.token || parsed.token || parsed.state?.state?.token;
        console.log('Extracted token:', token ? 'Present' : 'Missing');
        
        if (token) {
          return {
            'Authorization': `Bearer ${token}`,
          };
        }
      }
      console.log('No valid token found in localStorage');
      return {};
    } catch (error) {
      console.error('Error parsing auth data from localStorage:', error);
      return {};
    }
  }
}
