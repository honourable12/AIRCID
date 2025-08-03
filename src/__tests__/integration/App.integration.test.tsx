import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render } from '@/utils/test-utils';
import App from '@/App';
import { useAuthStore } from '@/store/authStore';
import { patientsService } from '@/services/patientsService';
import { formsService } from '@/services/formsService';
import { DashboardService } from '@/services/dashboardService';

// Mock all services
jest.mock('@/store/authStore');
jest.mock('@/services/patientsService');
jest.mock('@/services/formsService');
jest.mock('@/services/dashboardService');

const mockUseAuthStore = useAuthStore) as jest.Mocked<typeof useauthstore)>;
const mockPatientsService = patientsService) as jest.Mocked<typeof patientsservice)>;
const mockFormsService = formsService) as jest.Mocked<typeof formsservice)>;
const mockDashboardService = DashboardService) as jest.Mocked<typeof dashboardservice)>;

describe('Application Integration Tests', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'coordinator',
  } as jest.Mocked<typeof {
    id: 'user-1',
    email: 'test@example.com',
    firstname: 'john',
    lastname: 'doe',
    role: 'coordinator',
  }>;

  const mockAuthenticatedStore = {
    user: mockUser,
    token: 'mock-token',
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
    error: null,
  } as jest.Mocked<typeof {
    user: mockuser,
    token: 'mock-token',
    isauthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    isloading: false,
    error: null,
  }>;

  const mockUnauthenticatedStore = {
    user: null,
    token: null,
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
    error: null,
  } as jest.Mocked<typeof {
    user: null,
    token: null,
    isauthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
    isloading: false,
    error: null,
  }>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default authenticated state
    mockUseAuthStore.mockReturnValue(mockAuthenticatedStore);
    
    // Mock service responses
    mockDashboardService.getDashboardStats.mockResolvedValue({
      totalStudies: 10,
      activeStudies: 5,
      totalPatients: 100,
      enrollmentRate: 75,
      completionRate: 80,
    });
    
    mockDashboardService.getRecentStudies.mockResolvedValue([]);
    mockPatientsService.getAllPatients.mockResolvedValue({ data: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } });
    mockFormsService.getAllForms.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    test('should redirect to login when unauthenticated', () => {
      mockUseAuthStore.mockReturnValue(mockUnauthenticatedStore);
      
      render(<App />);
      
      expect(screen.getByText('Login to Health Research Platform')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    test('should show dashboard when authenticated', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Research Dashboard')).toBeInTheDocument();
      });
    });

    test('should complete login flow successfully', async () => {
      const user = userEvent.setup();
      mockUseAuthStore.mockReturnValue(mockUnauthenticatedStore);
      mockAuthenticatedStore.login.mockResolvedValue(undefined);
      
      render(<App />);
      
      // Fill login form
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const loginButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);
      
      expect(mockAuthenticatedStore.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    test('should handle login errors gracefully', async () => {
      const user = userEvent.setup();
      mockUseAuthStore.mockReturnValue({
        ...mockUnauthenticatedStore,
        error: 'Invalid credentials',
      });
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    test('should complete logout flow', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Research Dashboard')).toBeInTheDocument();
      });
      
      // Open user menu and logout
      const userMenu = screen.getByLabelText(/user menu/i);
      await user.click(userMenu);
      
      const logoutButton = screen.getByText('Logout');
      await user.click(logoutButton);
      
      expect(mockAuthenticatedStore.logout).toHaveBeenCalled();
    });
  });

  describe('Navigation and Routing', () => {
    test('should navigate between main sections', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Research Dashboard')).toBeInTheDocument();
      });
      
      // Navigate to Patients
      const patientsLink = screen.getByText('Patients');
      await user.click(patientsLink);
      
      await waitFor(() => {
        expect(screen.getByText('Patient Management')).toBeInTheDocument();
      });
      
      // Navigate to Forms
      const formsLink = screen.getByText('Forms');
      await user.click(formsLink);
      
      await waitFor(() => {
        expect(screen.getByText('Forms Management')).toBeInTheDocument();
      });
      
      // Navigate to Studies
      const studiesLink = screen.getByText('Studies');
      await user.click(studiesLink);
      
      await waitFor(() => {
        expect(screen.getByText('Research Studies')).toBeInTheDocument();
      });
    });

    test('should maintain navigation state across page refreshes', async () => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { pathname: '/patients' },
        writable: true,
      });
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Patient Management')).toBeInTheDocument();
      });
      
      // Patients nav item should be active
      const patientsLink = screen.getByText('Patients');
      expect(patientsLink.closest('a')).toHaveClass('active');
    });

    test('should handle protected routes correctly', async () => {
      mockUseAuthStore.mockReturnValue(mockUnauthenticatedStore);
      
      // Try to access protected route
      Object.defineProperty(window, 'location', {
        value: { pathname: '/patients' },
        writable: true,
      });
      
      render(<App />);
      
      // Should redirect to login
      expect(screen.getByText('Login to Health Research Platform')).toBeInTheDocument();
    });
  });

  describe('Patient Management Workflow', () => {
    test('should complete full patient creation workflow', async () => {
      const user = userEvent.setup();
      const newPatient = {
        id: 'patient-new',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-0123',
        age: 30,
        gender: 'female',
      };
      
      mockPatientsService.createPatient.mockResolvedValue(newPatient);
      mockPatientsService.getAllPatients.mockResolvedValueOnce({ data: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } })
        .mockResolvedValueOnce({ data: [newPatient], pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 } });
      
      render(<App />);
      
      // Navigate to patients
      const patientsLink = screen.getByText('Patients');
      await user.click(patientsLink);
      
      await waitFor(() => {
        expect(screen.getByText('Patient Management')).toBeInTheDocument();
      });
      
      // Create new patient
      const addPatientButton = screen.getByText('Add Patient');
      await user.click(addPatientButton);
      
      // Fill form
      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email');
      
      await user.type(firstNameInput, 'Jane');
      await user.type(lastNameInput, 'Smith');
      await user.type(emailInput, 'jane.smith@example.com');
      
      // Submit
      const createButton = screen.getByText('Create Patient');
      await user.click(createButton);
      
      // Verify creation
      await waitFor(() => {
        expect(mockPatientsService.createPatient).toHaveBeenCalled();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    test('should handle patient search and filtering', async () => {
      const user = userEvent.setup();
      const patients = [
        { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', gender: 'male', age: 30 },
        { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', gender: 'female', age: 25 },
      ];
      
      mockPatientsService.getAllPatients.mockResolvedValue({
        data: patients,
        pagination: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
      });
      
      render(<App />);
      
      // Navigate to patients
      const patientsLink = screen.getByText('Patients');
      await user.click(patientsLink);
      
      await waitFor(() => {
        expect(screen.getByText('Patient Management')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
      
      // Search for specific patient
      const searchInput = screen.getByPlaceholderText(/search patients/i);
      await user.type(searchInput, 'John');
      
      await waitFor(() => {
        expect(mockPatientsService.getAllPatients).toHaveBeenCalledWith(
          expect.objectContaining({ q: 'John' })
        );
      });
    });
  });

  describe('Form Management Workflow', () => {
    test('should complete form creation with fields', async () => {
      const user = userEvent.setup();
      const newForm = {
        id: 'form-new',
        title: 'Patient Intake',
        description: 'Initial patient information',
        fields: [
          { id: 'field-1', type: 'text', label: 'Full Name', required: true },
        ],
        isActive: true,
      };
      
      mockFormsService.createForm.mockResolvedValue(newForm);
      mockFormsService.getAllForms.mockResolvedValueOnce([])
        .mockResolvedValueOnce([newForm]);
      
      render(<App />);
      
      // Navigate to forms
      const formsLink = screen.getByText('Forms');
      await user.click(formsLink);
      
      await waitFor(() => {
        expect(screen.getByText('Forms Management')).toBeInTheDocument();
      });
      
      // Create new form
      const createFormButton = screen.getByText('Create Form');
      await user.click(createFormButton);
      
      // Fill basic info
      const titleInput = screen.getByLabelText('Form Title');
      const descriptionInput = screen.getByLabelText('Description');
      
      await user.type(titleInput, 'Patient Intake');
      await user.type(descriptionInput, 'Initial patient information');
      
      // Add field
      const addFieldButton = screen.getByText('Add Field');
      await user.click(addFieldButton);
      
      const fieldLabelInput = screen.getByLabelText('Field Label');
      await user.type(fieldLabelInput, 'Full Name');
      
      const requiredCheckbox = screen.getByLabelText('Required');
      await user.click(requiredCheckbox);
      
      // Save field
      const saveFieldButton = screen.getByText('Save Field');
      await user.click(saveFieldButton);
      
      // Create form
      const finalCreateButton = screen.getByText('Create Form');
      await user.click(finalCreateButton);
      
      await waitFor(() => {
        expect(mockFormsService.createForm).toHaveBeenCalled();
        expect(screen.getByText('Patient Intake')).toBeInTheDocument();
      });
    });

    test('should preview form before creation', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Navigate to forms
      const formsLink = screen.getByText('Forms');
      await user.click(formsLink);
      
      await waitFor(() => {
        expect(screen.getByText('Forms Management')).toBeInTheDocument();
      });
      
      // Create new form
      const createFormButton = screen.getByText('Create Form');
      await user.click(createFormButton);
      
      // Add some fields
      const titleInput = screen.getByLabelText('Form Title');
      await user.type(titleInput, 'Test Form');
      
      const addFieldButton = screen.getByText('Add Field');
      await user.click(addFieldButton);
      
      const fieldLabelInput = screen.getByLabelText('Field Label');
      await user.type(fieldLabelInput, 'Test Field');
      
      // Preview form
      const previewButton = screen.getByText('Preview');
      await user.click(previewButton);
      
      // Should show preview
      expect(screen.getByText('Form Preview')).toBeInTheDocument();
      expect(screen.getByText('Test Field')).toBeInTheDocument();
    });
  });

  describe('Dashboard Integration', () => {
    test('should display real-time statistics', async () => {
      const mockStats = {
        totalStudies: 15,
        activeStudies: 8,
        totalPatients: 234,
        enrollmentRate: 75.5,
        completionRate: 68.3,
      } as jest.Mocked<typeof {
        totalstudies: 15,
        activestudies: 8,
        totalpatients: 234,
        enrollmentrate: 75.5,
        completionrate: 68.3,
      }>;
      
      mockDashboardService.getDashboardStats.mockResolvedValue(mockStats);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Research Dashboard')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument(); // Total studies
        expect(screen.getByText('8')).toBeInTheDocument(); // Active studies
        expect(screen.getByText('234')).toBeInTheDocument(); // Total patients
      });
    });

    test('should navigate to sections from dashboard widgets', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Research Dashboard')).toBeInTheDocument();
      });
      
      // Click on patients widget
      const patientsWidget = screen.getByText('View All Patients');
      await user.click(patientsWidget);
      
      await waitFor(() => {
        expect(screen.getByText('Patient Management')).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence and State Management', () => {
    test('should persist user session across app restarts', async () => {
      // Mock localStorage
      const mockStorage = {
        'auth-storage': JSON.stringify({
          state: {
            user: mockUser,
            token: 'persisted-token',
            isAuthenticated: true,
          },
        }),
      } as jest.Mocked<typeof {
        'auth-storage': json.stringify({
          state: {
            user: mockuser,
            token: 'persisted-token',
            isauthenticated: true,
          },
        }),
      }>;
      
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn((key) => mockStorage[key]),
          setItem: jest.fn(),
          removeItem: jest.fn(),
        },
      });
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Research Dashboard')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    test('should handle concurrent data updates correctly', async () => {
      const user = userEvent.setup();
      
      // Simulate real-time updates
      mockPatientsService.getAllPatients.mockResolvedValue({
        data: [
          { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        ],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
      });
      
      render(<App />);
      
      // Navigate to patients
      const patientsLink = screen.getByText('Patients');
      await user.click(patientsLink);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Simulate external update
      mockPatientsService.getAllPatients.mockResolvedValue({
        data: [
          { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
        ],
        pagination: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
      });
      
      // Refresh data
      const refreshButton = screen.getByLabelText(/refresh/i);
      await user.click(refreshButton);
      
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle global network errors', async () => {
      mockDashboardService.getDashboardStats.mockRejectedValue(new Error('Network error'));
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });
    });

    test('should recover from temporary errors', async () => {
      const user = userEvent.setup();
      
      // First call fails, second succeeds
      mockDashboardService.getDashboardStats
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          totalStudies: 10,
          activeStudies: 5,
          totalPatients: 100,
          enrollmentRate: 75,
          completionRate: 80,
        });
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/temporary error/i)).toBeInTheDocument();
      });
      
      const retryButton = screen.getByText(/retry/i);
      await user.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('Research Dashboard')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument(); // Total studies
      });
    });

    test('should maintain user experience during partial failures', async () => {
      // Dashboard stats fail but navigation works
      mockDashboardService.getDashboardStats.mockRejectedValue(new Error('Stats error'));
      
      render(<App />);
      
      const user = userEvent.setup();
      
      // Should still be able to navigate
      const patientsLink = screen.getByText('Patients');
      await user.click(patientsLink);
      
      await waitFor(() => {
        expect(screen.getByText('Patient Management')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Loading States', () => {
    test('should show loading states during data fetching', () => {
      mockDashboardService.getDashboardStats.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      render(<App />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('should handle slow network conditions gracefully', async () => {
      // Simulate slow response
      mockDashboardService.getDashboardStats.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            totalStudies: 10,
            activeStudies: 5,
            totalPatients: 100,
            enrollmentRate: 75,
            completionRate: 80,
          }), 3000)
        )
      );
      
      render(<App />);
      
      // Should show loading state
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      // Should eventually show content
      await waitFor(() => {
        expect(screen.getByText('Research Dashboard')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});
