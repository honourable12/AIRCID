import { 
  GenAIRequest, 
  GenAIResponse, 
  ChatMessage, 
  ApiResponse 
} from '@/types';

import { env } from '@/utils/env';

const API_BASE = env.API_BASE_URL;

export class GenAIService {
  static async augmentCriteria(studyId: string, criteria: string): Promise<ApiResponse<GenAIResponse>> {
    const request: GenAIRequest = {
      type: 'criteria_augmentation',
      context: `Study ID: ${studyId}`,
      input: criteria,
      studyId,
    };

    const response = await fetch(`${API_BASE}/genai/augment-criteria`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    return response.json();
  }

  static async summarizeNotes(text: string, context?: string): Promise<ApiResponse<GenAIResponse>> {
    const request: GenAIRequest = {
      type: 'note_summarization',
      context: context || '',
      input: text,
    };

    const response = await fetch(`${API_BASE}/genai/summarize`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    return response.json();
  }

  static async askQuestion(
    question: string, 
    context: string, 
    studyId?: string
  ): Promise<ApiResponse<GenAIResponse>> {
    const request: GenAIRequest = {
      type: 'contextual_qa',
      context,
      input: question,
      studyId,
    };

    const response = await fetch(`${API_BASE}/genai/qa`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    return response.json();
  }

  static async getChatHistory(studyId: string): Promise<ApiResponse<ChatMessage[]>> {
    const response = await fetch(`${API_BASE}/genai/chat/${studyId}`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  static async saveChatMessage(message: ChatMessage): Promise<ApiResponse<ChatMessage>> {
    const response = await fetch(`${API_BASE}/genai/chat`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
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
