import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock browser APIs that are not available in test environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch if not available
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock environment variables
vi.mock('@/config/env', () => ({
  env: {
    API_BASE_URL: 'http://localhost:3001/api',
    NODE_ENV: 'test',
  },
}));

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
});

// Setup before each test
beforeEach(() => {
  // Reset DOM
  document.body.innerHTML = '';
  
  // Reset window location
  Object.defineProperty(window, 'location', {
    value: {
      pathname: '/',
      search: '',
      hash: '',
      href: 'http://localhost:3000/',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
    },
    writable: true,
  });
  
  // Reset window dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
  });
});

// Global test utilities
export const mockTimers = () => {
  vi.useFakeTimers();
  return {
    advanceTimersByTime: (time: number) => vi.advanceTimersByTime(time),
    runAllTimers: () => vi.runAllTimers(),
    restore: () => vi.useRealTimers(),
  };
};

export const mockDate = (date: string | Date) => {
  const mockDate = new Date(date);
  vi.setSystemTime(mockDate);
  return {
    restore: () => vi.useRealTimers(),
  };
};

export const mockViewport = (width: number, height: number = 768) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

export const mockClipboard = () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  const readText = vi.fn().mockResolvedValue('');
  
  Object.assign(navigator, {
    clipboard: {
      writeText,
      readText,
    },
  });
  
  return { writeText, readText };
};

export const mockGeolocation = () => {
  const getCurrentPosition = vi.fn();
  const watchPosition = vi.fn();
  const clearWatch = vi.fn();
  
  Object.assign(navigator, {
    geolocation: {
      getCurrentPosition,
      watchPosition,
      clearWatch,
    },
  });
  
  return { getCurrentPosition, watchPosition, clearWatch };
};

export const mockNotification = () => {
  const mockNotification = vi.fn();
  const requestPermission = vi.fn().mockResolvedValue('granted');
  
  Object.assign(window, {
    Notification: Object.assign(mockNotification, {
      requestPermission,
      permission: 'granted',
    }),
  });
  
  return { mockNotification, requestPermission };
};

// Test data generators
export const generateMockUsers = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    email: `user${i + 1}@example.com`,
    firstName: `User${i + 1}`,
    lastName: 'Test',
    role: i % 2 === 0 ? 'coordinator' : 'researcher',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

export const generateMockPatients = (count: number) => {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  const genders = ['male', 'female', 'other'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `patient-${i + 1}`,
    firstName: firstNames[i % firstNames.length],
    lastName: lastNames[i % lastNames.length],
    email: `patient${i + 1}@example.com`,
    phone: `+1-555-${String(i).padStart(4, '0')}`,
    dateOfBirth: new Date(1950 + (i % 50), i % 12, (i % 28) + 1).toISOString().split('T')[0],
    age: 25 + (i % 50),
    gender: genders[i % genders.length],
    address: {
      street: `${100 + i} Test St`,
      city: 'Test City',
      state: 'TS',
      zipCode: `${10000 + i}`,
    },
    medicalHistory: [],
    enrolledStudies: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

export const generateMockStudies = (count: number) => {
  const statuses = ['active', 'recruiting', 'completed', 'paused'];
  const investigators = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `study-${i + 1}`,
    title: `Study ${i + 1}: Research Topic`,
    description: `This is a research study about topic ${i + 1}`,
    status: statuses[i % statuses.length],
    principalInvestigator: investigators[i % investigators.length],
    startDate: new Date(2024, i % 12, 1).toISOString().split('T')[0],
    endDate: new Date(2024, (i + 6) % 12, 1).toISOString().split('T')[0],
    targetEnrollment: 50 + (i * 10),
    currentEnrollment: 20 + (i * 5),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

export const generateMockForms = (count: number) => {
  const fieldTypes = ['text', 'email', 'number', 'textarea', 'select', 'checkbox'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `form-${i + 1}`,
    title: `Form ${i + 1}`,
    description: `Description for form ${i + 1}`,
    fields: Array.from({ length: 3 + (i % 3) }, (_, j) => ({
      id: `field-${i}-${j}`,
      type: fieldTypes[j % fieldTypes.length],
      label: `Field ${j + 1}`,
      required: j % 2 === 0,
      options: fieldTypes[j % fieldTypes.length] === 'select' ? ['Option 1', 'Option 2', 'Option 3'] : [],
    })),
    version: 1,
    isActive: i % 2 === 0,
    createdBy: `user-${i + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

// Performance testing utilities
export const measureRenderTime = (component: React.ComponentType) => {
  const start = performance.now();
  render(React.createElement(component));
  const end = performance.now();
  return end - start;
};

export const measureAsyncOperation = async (operation: () => Promise<any>) => {
  const start = performance.now();
  await operation();
  const end = performance.now();
  return end - start;
};

// Accessibility testing helpers
export const checkAriaLabels = (container: HTMLElement) => {
  const interactiveElements = container.querySelectorAll(
    'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const elementsWithoutLabels: Element[] = [];
  
  interactiveElements.forEach(element => {
    const hasAriaLabel = element.hasAttribute('aria-label');
    const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
    const hasAssociatedLabel = element.id && container.querySelector(`label[for="${element.id}"]`);
    const hasInnerText = element.textContent?.trim();
    
    if (!hasAriaLabel && !hasAriaLabelledBy && !hasAssociatedLabel && !hasInnerText) {
      elementsWithoutLabels.push(element);
    }
  });
  
  return elementsWithoutLabels;
};

export const checkColorContrast = (element: Element) => {
  const styles = window.getComputedStyle(element);
  const backgroundColor = styles.backgroundColor;
  const color = styles.color;
  
  // This is a simplified check - in a real implementation,
  // you'd use a proper color contrast calculation library
  return {
    backgroundColor,
    color,
    hasGoodContrast: backgroundColor !== color, // Simplified check
  };
};

// Error boundary testing utility
export const TestErrorBoundary: React.FC<{ children: React.ReactNode; onError?: (error: Error) => void }> = ({ 
  children, 
  onError 
}) => {
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      setHasError(true);
      onError?.(new Error(error.message));
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true);
      onError?.(new Error(event.reason));
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);
  
  if (hasError) {
    return <div data-testid="error-boundary">Something went wrong</div>;
  }
  
  return <>{children}</>;
};
