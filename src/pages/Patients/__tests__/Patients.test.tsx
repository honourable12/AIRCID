import { screen, waitFor } from '@testing-library/react';
import { render } from '@/utils/test-utils';
import Patients from '../Patients';
import { mockPaginatedResponse, mockApiData } from '@/setupTests';

// Mock the auth store
jest.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: mockApiData.user,
    isAuthenticated: true,
  }),
}));

describe('Patients Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders patients page title', () => {
    // Mock the API call
    mockPaginatedResponse(mockApiData.patients);
    
    render(<Patients />);
    
    expect(screen.getByText('Patients')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add patient/i })).toBeInTheDocument();
  });

  test('displays patients list after loading', async () => {
    // Mock the API call
    mockPaginatedResponse(mockApiData.patients);
    
    render(<Patients />);
    
    // Wait for the patients to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('john.doe@email.com')).toBeInTheDocument();
    });
  });

  test('displays search and filter controls', async () => {
    // Mock the API call
    mockPaginatedResponse(mockApiData.patients);
    
    render(<Patients />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search patients...')).toBeInTheDocument();
      expect(screen.getByLabelText('Gender')).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    // Mock API error
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
      new Error('API Error')
    );
    
    render(<Patients />);
    
    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText('Patients')).toBeInTheDocument();
    });
  });
});
