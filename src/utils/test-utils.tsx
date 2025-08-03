import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';

// Create a test theme
const testTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Create a custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={testTheme}>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'coordinator',
  ...overrides,
});

export const createMockStudy = (overrides = {}) => ({
  id: 'study-1',
  title: 'Test Study',
  description: 'A test study for unit testing',
  status: 'active',
  principalInvestigator: 'Dr. Test',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  targetEnrollment: 100,
  currentEnrollment: 25,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockPatient = (overrides = {}) => ({
  id: 'patient-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0123',
  dateOfBirth: '1985-01-01',
  age: 39,
  gender: 'male' as const,
  address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
  },
  medicalHistory: [],
  enrolledStudies: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockForm = (overrides = {}) => ({
  id: 'form-1',
  title: 'Test Form',
  description: 'A test form',
  fields: [
    {
      id: 'field-1',
      type: 'text' as const,
      label: 'Test Field',
      required: true,
    },
  ],
  version: 1,
  isActive: true,
  createdBy: 'user-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Mock API responses
export function createMockApiResponse<T>(data: T, success = true) {
  return {
    success,
    data,
    message: success ? 'Success' : 'Error',
  };
}

export function createMockPaginatedResponse<T>(data: T[], page = 1, pageSize = 10) {
  return {
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total: data.length,
      totalPages: Math.ceil(data.length / pageSize),
    },
    message: 'Success',
  };
}

// Accessibility test helper
export const testAccessibility = (component: React.ReactElement) => {
  // This would integrate with axe-core for full a11y testing
  // For now, we'll do basic checks
  const { container } = customRender(component);
  
  // Check for basic accessibility requirements
  const buttons = container.querySelectorAll('button');
  const inputs = container.querySelectorAll('input');
  const images = container.querySelectorAll('img');
  
  // All buttons should have accessible names
  buttons.forEach((button) => {
    expect(button).toHaveAttribute('aria-label');
  });
  
  // All inputs should have labels
  inputs.forEach((input) => {
    const hasLabel = input.getAttribute('aria-label') || 
                    input.getAttribute('aria-labelledby') ||
                    container.querySelector(`label[for="${input.id}"]`);
    expect(hasLabel).toBeTruthy();
  });
  
  // All images should have alt text
  images.forEach((img) => {
    expect(img).toHaveAttribute('alt');
  });
  
  return { container };
};

// Loading state test helper
export const expectLoadingState = (container: HTMLElement) => {
  expect(container.querySelector('[data-testid="loading"]') || 
         container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
};

// Error state test helper
export const expectErrorState = (container: HTMLElement, errorMessage?: string) => {
  const errorElement = container.querySelector('[data-testid="error"]') || 
                      container.querySelector('.MuiAlert-standardError');
  expect(errorElement).toBeInTheDocument();
  
  if (errorMessage) {
    expect(errorElement).toHaveTextContent(errorMessage);
  }
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Export shortened mock names for convenience
export const mockUser = createMockUser;
export const mockStudy = createMockStudy;
export const mockPatient = createMockPatient;
export const mockForm = createMockForm;
