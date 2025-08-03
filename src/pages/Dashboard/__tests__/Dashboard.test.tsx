import { render, screen, waitFor } from '@/utils/test-utils';
import Dashboard from '../Dashboard';
import { mockApiResponse, mockApiData } from '@/setupTests';

// Mock the auth store  
jest.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: mockApiData.user,
    isAuthenticated: true,
  }),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default API responses for each call
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/dashboard/stats')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: mockApiData.dashboardStats,
          }),
        });
      }
      if (url.includes('/dashboard/recent-studies')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: mockApiData.recentActivity,
          }),
        });
      }
      // Default response
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {},
        }),
      });
    });
  });

  test('renders dashboard with loading state initially', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('displays dashboard statistics after loading', async () => {
    render(<Dashboard />);
    
    // Wait for the stats to load
    await waitFor(() => {
      expect(screen.getByText('Total Studies')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('Active Studies')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('displays recent activity', async () => {
    render(<Dashboard />);
    
    // Wait for the activity to load  
    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('New patient enrolled in COVID-19 Vaccine Study')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('displays quick action buttons', async () => {
    render(<Dashboard />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create study/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add patient/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('handles API error gracefully', async () => {
    // Mock API error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    
    render(<Dashboard />);
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/API Error/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});