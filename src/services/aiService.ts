export interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'ai';
  timestamp: string;
  context?: any;
}

export interface ChatRequest {
  message: string;
  context?: any;
  studyId?: string;
}

export interface ChatResponse {
  response: string;
  context?: any;
  suggestions?: string[];
}

export interface GenerateTextRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AnalyzeCriteriaRequest {
  criteria: string;
  studyContext?: any;
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

export const aiService = {
  async getChatResponse(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error('Failed to get chat response');
    }
    const result = await response.json();
    return result.data;
  },

  async generateText(request: GenerateTextRequest): Promise<string> {
    const response = await fetch(`${API_BASE}/ai/generate-text`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error('Failed to generate text');
    }
    const result = await response.json();
    return result.data;
  },

  async analyzeCriteria(request: AnalyzeCriteriaRequest): Promise<any> {
    const response = await fetch(`${API_BASE}/ai/analyze-criteria`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error('Failed to analyze criteria');
    }
    const result = await response.json();
    return result.data;
  },

  async suggestOptimizations(data: any): Promise<any> {
    const response = await fetch(`${API_BASE}/ai/suggest-optimizations`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to get optimization suggestions');
    }
    const result = await response.json();
    return result.data;
  },

  async processDocument(documentData: any): Promise<any> {
    const response = await fetch(`${API_BASE}/ai/process-document`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(documentData),
    });
    if (!response.ok) {
      throw new Error('Failed to process document');
    }
    const result = await response.json();
    return result.data;
  }
};
