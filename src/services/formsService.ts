export interface FormField {
  id: string;
  type: 'text' | 'number' | 'email' | 'select' | 'multiselect' | 'textarea' | 'date' | 'checkbox' | 'radio';
  label: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface Form {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  studyId?: string;
  version: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFormRequest {
  title: string;
  description: string;
  fields: FormField[];
  studyId?: string;
}

export interface FormResponse {
  id: string;
  formId: string;
  patientId?: string;
  userId: string;
  responses: Record<string, any>;
  submittedAt: string;
}

export interface SubmitFormResponseRequest {
  patientId?: string;
  responses: Record<string, any>;
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

export const formsService = {
  async getAllForms(): Promise<Form[]> {
    const response = await fetch(`${API_BASE}/forms`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch forms');
    }
    const result = await response.json();
    return result.data;
  },

  async getFormById(id: string): Promise<Form> {
    const response = await fetch(`${API_BASE}/forms/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch form');
    }
    const result = await response.json();
    return result.data;
  },

  async createForm(form: CreateFormRequest): Promise<Form> {
    const response = await fetch(`${API_BASE}/forms`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    });
    if (!response.ok) {
      throw new Error('Failed to create form');
    }
    const result = await response.json();
    return result.data;
  },

  async updateForm(id: string, form: CreateFormRequest): Promise<Form> {
    const response = await fetch(`${API_BASE}/forms/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    });
    if (!response.ok) {
      throw new Error('Failed to update form');
    }
    const result = await response.json();
    return result.data;
  },

  async deleteForm(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/forms/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete form');
    }
  },

  async getFormResponses(formId: string): Promise<FormResponse[]> {
    const response = await fetch(`${API_BASE}/forms/${formId}/responses`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch form responses');
    }
    const result = await response.json();
    return result.data;
  },

  async submitFormResponse(formId: string, responseData: SubmitFormResponseRequest): Promise<FormResponse> {
    const response = await fetch(`${API_BASE}/forms/${formId}/responses`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseData),
    });
    if (!response.ok) {
      throw new Error('Failed to submit form response');
    }
    const result = await response.json();
    return result.data;
  },

  async validateFormSchema(schema: any): Promise<{ valid: boolean; errors?: string[] }> {
    const response = await fetch(`${API_BASE}/forms/validate-schema`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ schema }),
    });
    if (!response.ok) {
      throw new Error('Failed to validate form schema');
    }
    const result = await response.json();
    return result.data;
  }
};
