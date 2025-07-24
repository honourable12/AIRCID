import axios from 'axios';
import { AuthService } from './authService';
import type { ChatMessage, GenAIResponse, CriteriaAugmentation, FormSchema, SummaryOptions } from '../types';

// Base URL for GenAI backend - can be configured via environment
const BASE_URL = process.env.NEXT_PUBLIC_GENAI_API_URL || 'http://localhost:8000';

export class GenAIService {
  private static async createAuthHeader(userToken: string) {
    const apiToken = await AuthService.getApiToken(userToken);
    return {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Smart Q&A with chat history
  static async askQuestion(
    question: string,
    userToken: string,
    chatHistory: ChatMessage[] = [],
    numContextChunks: number = 3
  ): Promise<GenAIResponse> {
    try {
      const history = chatHistory.map(msg => ({
        role: 'user',
        content: msg.question
      })).concat(chatHistory.map(msg => ({
        role: 'assistant', 
        content: msg.answer
      })));

      const response = await axios.post(
        `${BASE_URL}/qna/ask`,
        {
          question,
          chat_history: history.slice(-10), // Keep last 10 messages
          num_context_chunks: numContextChunks
        },
        {
          headers: await this.createAuthHeader(userToken),
          timeout: 30000 // 30 second timeout
        }
      );

      return {
        answer: response.data.answer,
        sources: response.data.sources || []
      };
    } catch (error) {
      console.error('GenAI askQuestion error:', error);
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  // Criteria refinement and augmentation
  static async augmentCriteria(
    criteria: string,
    userToken: string
  ): Promise<CriteriaAugmentation> {
    try {
      const response = await axios.post(
        `${BASE_URL}/criteria/augment`,
        { researcher_input: criteria },
        {
          headers: await this.createAuthHeader(userToken),
          timeout: 20000
        }
      );

      return {
        clearer_wording: response.data.clearer_wording,
        suggested_rules: response.data.suggested_rules || []
      };
    } catch (error) {
      console.error('GenAI augmentCriteria error:', error);
      throw new Error('Failed to augment criteria. Please try again.');
    }
  }

  // Auto-generate form schema from study objective
  static async generateFormSchema(
    objective: string,
    userToken: string
  ): Promise<FormSchema> {
    try {
      const response = await axios.post(
        `${BASE_URL}/forms/generate`,
        { study_objectives: objective },
        {
          headers: await this.createAuthHeader(userToken),
          timeout: 25000
        }
      );

      return response.data.json_schema;
    } catch (error) {
      console.error('GenAI generateFormSchema error:', error);
      throw new Error('Failed to generate form schema. Please try again.');
    }
  }

  // Text summarization
  static async summarizeText(
    text: string,
    context: string,
    userToken: string,
    targetLength: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<GenAIResponse> {
    try {
      const response = await axios.post(
        `${BASE_URL}/text/summarize`,
        {
          text_content: text,
          summary_context: context,
          target_length: targetLength
        },
        {
          headers: await this.createAuthHeader(userToken),
          timeout: 20000
        }
      );

      return {
        summary: response.data.summary,
        raw_output: response.data.llm_raw_output
      };
    } catch (error) {
      console.error('GenAI summarizeText error:', error);
      throw new Error('Failed to summarize text. Please try again.');
    }
  }

  // Document management
  static async uploadDocument(file: File, userToken: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiToken = await AuthService.getApiToken(userToken);
      const response = await axios.post(
        `${BASE_URL}/documents/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000 // 60 seconds for file upload
        }
      );

      return response.data;
    } catch (error) {
      console.error('GenAI uploadDocument error:', error);
      throw new Error('Failed to upload document. Please try again.');
    }
  }

  static async listDocuments(userToken: string): Promise<any[]> {
    const response = await axios.get(`${BASE_URL}/documents/list`, {
      headers: await this.createAuthHeader(userToken)
    });
    return response.data;
  }
}