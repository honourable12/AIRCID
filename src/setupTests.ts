import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Make TextEncoder/TextDecoder available globally
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Create a proper fetch mock
const createMockResponse = (data: any, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',  
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers({ 'Content-Type': 'application/json' }),
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
    blob: jest.fn().mockResolvedValue(new Blob()),
    formData: jest.fn().mockResolvedValue(new FormData()),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
  };
};

// Global fetch mock returning endpoint-specific mock data for tests
global.fetch = jest.fn().mockImplementation((url: string | Request, options?: RequestInit) => {
  const urlString = typeof url === 'string' ? url : url.url;
  // Patients endpoint
  if (urlString.includes('/patients')) {
    const data = mockApiData.patients;
    const pagination = { page: 1, totalPages: 1, totalItems: data.length, itemsPerPage: data.length };
    return Promise.resolve(createMockResponse({ data, pagination }));
  }
  // Forms endpoint (GET)
  if (urlString.includes('/forms') && (!options || options.method === 'GET')) {
    const data = mockApiData.forms || [];
    return Promise.resolve(createMockResponse({ data }));
  }
  // Dashboard stats
  if (urlString.includes('/dashboard/stats')) {
    return Promise.resolve(createMockResponse({ data: mockApiData.dashboardStats }));
  }
  // Dashboard recent activity
  if (urlString.includes('/dashboard/recent-studies')) {
    return Promise.resolve(createMockResponse({ data: mockApiData.recentActivity }));
  }
  // Default fallback
  return Promise.resolve(createMockResponse({ success: true }));
});

// Mock API response helpers
export const mockApiResponse = (data: any, status = 200) => {
  const mockResponse = createMockResponse(data, status);
  (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
  return mockResponse;
};

export const mockPaginatedResponse = (items: any[], page = 1, totalPages = 1, totalItems = items.length) => {
  return mockApiResponse({
    data: items,
    pagination: {
      page,
      totalPages,
      totalItems,
      itemsPerPage: items.length,
    },
  });
};

export const mockApiError = (message = 'API Error', status = 500) => {
  const mockResponse = createMockResponse({ error: message }, status);
  (fetch as jest.Mock).mockRejectedValueOnce(new Error(message));
  return mockResponse;
};

export const mockApiData = {
  patients: [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-0123',
      dateOfBirth: '1990-01-01',
      gender: 'male' as const,
      address: '123 Main St',
      city: 'Anytown',  
      state: 'CA',
      zipCode: '12345',
      insurance: 'Blue Cross',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '555-0124',
      dateOfBirth: '1985-05-15',
      gender: 'female' as const,
      address: '456 Oak Ave',
      city: 'Somewhere',
      state: 'NY',
      zipCode: '67890',
      insurance: 'Aetna',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  studies: [
    {
      id: '1',
      patientId: '1',
      title: 'Chest X-Ray',
      description: 'Routine chest examination',
      studyDate: new Date().toISOString(),
      modality: 'X-Ray',
      status: 'completed' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  dashboardStats: {
    totalStudies: 4,
    activeStudies: 2,
    totalPatients: 15,
    pendingReviews: 3,
  },
  recentActivity: [
    {
      id: '1',
      type: 'patient_enrolled',
      message: 'New patient enrolled in COVID-19 Vaccine Study',
      timestamp: new Date().toISOString(),
      study: 'COVID-19 Vaccine Study',
    },
    {
      id: '2',
      type: 'study_completed',
      message: 'Study completed for John Doe',
      timestamp: new Date().toISOString(),
      patient: 'John Doe',
    },
  ],
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'doctor' as const,
  },
};

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Mock environment variables for tests (Jest doesn't support import.meta)
process.env.VITE_API_BASE_URL = 'http://localhost:3001/api';
process.env.NODE_ENV = 'test';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: jest.fn().mockReturnValue([]),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Mock HTMLElement.scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock HTMLDialogElement for modal testing
if (!global.HTMLDialogElement) {
  global.HTMLDialogElement = class MockHTMLDialogElement extends HTMLElement {
    open = false;
    returnValue = '';
    
    show() {
      this.open = true;
    }
    
    showModal() {
      this.open = true;
    }
    
    close(returnValue?: string) {
      this.open = false;
      if (returnValue !== undefined) {
        this.returnValue = returnValue;
      }
    }
  } as any;
}
