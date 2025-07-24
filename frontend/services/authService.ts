import axios from 'axios';
import { generateDummyToken, validateToken, getUserFromToken } from '../utils/dummyToken';
import type { User } from '../types';

export class AuthService {
  private static readonly TOKEN_KEY = 'aircid_token';
  private static readonly USER_KEY = 'aircid_user';

  static async login(username: string): Promise<{ user: User; token: string }> {
    if (!username.trim()) {
      throw new Error('Username is required');
    }

    // Generate dummy token for frontend authentication
    const token = generateDummyToken(username);
    
    // Create user object
    const user: User = {
      username: username,
      name: username,
      role: 'researcher'
    };

    // Store in sessionStorage
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));

    return { user, token };
  }

  static logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  }

  static getCurrentToken(): string | null {
    const token = sessionStorage.getItem(this.TOKEN_KEY);
    if (token && validateToken(token)) {
      return token;
    }
    
    // Clean up invalid token
    this.logout();
    return null;
  }

  static getCurrentUser(): User | null {
    try {
      const userStr = sessionStorage.getItem(this.USER_KEY);
      const token = this.getCurrentToken();
      
      if (userStr && token) {
        return JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Error retrieving current user:', error);
    }
    
    return null;
  }

  static isAuthenticated(): boolean {
    return this.getCurrentToken() !== null;
  }

  // Get API token for backend communication
  static async getApiToken(userToken: string): Promise<string> {
    const BASE_URL = process.env.NEXT_PUBLIC_GENAI_API_URL || 'http://localhost:8000';
    
    try {
      const user = getUserFromToken(userToken);
      if (!user) {
        throw new Error('Invalid user token');
      }

      const response = await axios.post(`${BASE_URL}/token`, {
        user_id: user.username,
        username: user.name,
        roles: [user.role]
      });

      return response.data.access_token;
    } catch (error) {
      throw new Error('Failed to get API token');
    }
  }
}