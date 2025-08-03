# Jest API Mocking Setup

## Overview

The application now uses **Jest native mocking** instead of MSW (Mock Service Worker) for API testing. This approach is simpler, lighter, and easier to maintain while still providing comprehensive testing capabilities.

## Key Benefits

### ✅ **Simpler Setup**
- No additional dependencies (MSW removed)
- Straightforward Jest mocking patterns
- Less configuration overhead

### ✅ **Easier Testing**
- Direct control over mock responses
- Clear test isolation
- Simple error scenario testing

### ✅ **Better Performance**
- No network interception overhead
- Faster test execution
- Lighter test bundle

## Implementation

### **Setup File (`src/setupTests.ts`)**
```typescript
// Mock fetch globally
global.fetch = jest.fn();

// Helper functions
export const mockApiResponse = (data: any) => { /* ... */ };
export const mockPaginatedResponse = (data: any[]) => { /* ... */ };
export const mockApiError = (status, message) => { /* ... */ };

// Predefined mock data
export const mockApiData = {
  user: { /* ... */ },
  studies: [/* ... */],
  patients: [/* ... */],
  // ...
};
```

### **Usage in Tests**
```typescript
import { mockApiResponse, mockApiData } from '@/setupTests';

test('should load data', async () => {
  // Mock the API call
  mockApiResponse(mockApiData.studies);
  
  render(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Study Title')).toBeInTheDocument();
  });
});
```

### **Error Testing**
```typescript
test('handles API errors', async () => {
  // Mock API error
  (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
    new Error('API Error')
  );
  
  render(<MyComponent />);
  // Test error handling...
});
```

## Available Mock Helpers

### **mockApiResponse(data)**
Mock successful API responses with data

### **mockPaginatedResponse(data[], page?, pageSize?)**
Mock paginated API responses with pagination metadata

### **mockApiError(status?, message?)**
Mock API error responses

### **mockLoginResponse(user?)**
Mock authentication responses

### **mockApiData**
Predefined mock data for consistent testing:
- `user` - Admin user data
- `studies` - Array of study objects
- `patients` - Array of patient objects
- `forms` - Array of form objects
- `dashboardStats` - Dashboard statistics

## Test Structure

```typescript
describe('Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  test('renders correctly', () => {
    mockApiResponse(mockApiData.studies);
    render(<Component />);
    // Assertions...
  });
});
```

## Migration from MSW

### **Removed**
- ❌ MSW dependency
- ❌ MSW server setup in `main.tsx`
- ❌ Complex request handlers
- ❌ Network-level interception

### **Added**
- ✅ Jest fetch mocking
- ✅ Simple helper functions
- ✅ Predefined mock data
- ✅ Streamlined test setup

## Development Workflow

Since we removed MSW from development, the app now expects a real backend API or you can:

1. **Use the existing services** - They'll fail gracefully with empty states
2. **Mock in development** - Add mock responses in service files
3. **Backend integration** - Connect to a real API server

For **testing purposes**, all API calls are properly mocked with realistic data.

## Summary

This Jest-based mocking approach provides:

- **Simpler configuration** with fewer dependencies
- **Faster test execution** without network interception
- **Easier maintenance** with direct Jest patterns
- **Full test coverage** with realistic mock data
- **Clear error testing** capabilities

The testing infrastructure is now more lightweight while maintaining the same level of functionality and coverage.
