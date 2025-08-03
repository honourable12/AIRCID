import { 
  Study, 
  StudyStats, 
  ApiResponse, 
  PaginatedResponse 
} from '@/types';
import { env } from '@/utils/env';

const API_BASE = env.API_BASE_URL;

export class DashboardService {
  static async getDashboardStats(): Promise<ApiResponse<StudyStats>> {
    try {
      const response = await fetch(`${API_BASE}/dashboard/stats`);
      
      if (!response.ok) {
        console.error('Failed to fetch dashboard stats:', response.status, response.statusText);
        throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      throw error;
    }
  }

  static async getRecentStudies(limit: number = 5): Promise<PaginatedResponse<Study>> {
    try {
      // Since the studies API doesn't support sorting yet, we'll get all studies and sort client-side
      // In a production app, you'd want server-side sorting for performance
      const response = await fetch(`${API_BASE}/studies?page=1&pageSize=50`); // Get more studies to sort from
      
      if (!response.ok) {
        console.error('Failed to fetch recent studies:', response.status, response.statusText);
        throw new Error(`Failed to fetch recent studies: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Sort studies by creation date (most recent first) and take the requested limit
        const sortedStudies = result.data
          .sort((a: Study, b: Study) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
          .slice(0, limit);
        
        return {
          data: sortedStudies,
          pagination: {
            page: 1,
            pageSize: limit,
            total: sortedStudies.length,
            totalPages: 1,
          },
        };
      }
      
      // Return empty result if no data
      return {
        data: [],
        pagination: {
          page: 1,
          pageSize: limit,
          total: 0,
          totalPages: 0,
        },
      };
    } catch (error) {
      console.error('Error in getRecentStudies:', error);
      throw error;
    }
  }

  static async getRecentActivity(limit: number = 10): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_BASE}/dashboard/activity?limit=${limit}`);
      
      if (!response.ok) {
        console.error('Failed to fetch recent activity:', response.status, response.statusText);
        throw new Error(`Failed to fetch recent activity: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in getRecentActivity:', error);
      throw error;
    }
  }
}
