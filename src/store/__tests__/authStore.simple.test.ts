import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../authStore';

// Mock fetch
global.fetch = jest.fn();

// Mock the env config
jest.mock('@/config/env', () => ({
  env: {
    API_BASE_URL: 'http://localhost:3001/api'
  }
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  test('should have initial state', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  test('should have required methods', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.setUser).toBe('function');
    expect(typeof result.current.setToken).toBe('function');
    expect(typeof result.current.clearAuth).toBe('function');
    expect(typeof result.current.refreshToken).toBe('function');
  });

  test('should set user and token', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'coordinator' as const,
    } as jest.Mocked<typeof {
      id: '1',
      email: 'test@example.com',
      firstname: 'test',
      lastname: 'user',
      role: 'coordinator' as const,
    }>;
    const mockToken = 'mock-token' as jest.Mocked<typeof 'mock-token'>;

    act(() => {
      result.current.setUser(mockUser);
      result.current.setToken(mockToken);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(result.current.isAuthenticated).toBe(true);
  });

  test('should clear auth state', () => {
    const { result } = renderHook(() => useAuthStore());
    
    // First set some data
    act(() => {
      result.current.setUser({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'coordinator',
      });
      result.current.setToken('mock-token');
    });

    // Then clear it
    act(() => {
      result.current.clearAuth();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  test('should handle logout', () => {
    const { result } = renderHook(() => useAuthStore());
    
    // First set some data
    act(() => {
      result.current.setUser({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'coordinator',
      });
      result.current.setToken('mock-token');
    });

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  test('should handle login success', async () => {
    const mockResponse = {
      success: true,
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'coordinator',
        },
        token: 'mock-token',
      },
      message: 'Login successful',
    } as jest.Mocked<typeof {
      success: true,
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          firstname: 'test',
          lastname: 'user',
          role: 'coordinator',
        },
        token: 'mock-token',
      },
      message: 'login successful',
    }>;

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' });
    });

    expect(result.current.user).toEqual(mockResponse.data.user);
    expect(result.current.token).toBe(mockResponse.data.token);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  test('should handle login failure', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Login failed'));

    const { result } = renderHook(() => useAuthStore());

    // First clear any existing state
    act(() => {
      result.current.clearAuth();
    });

    await act(async () => {
      try {
        await result.current.login({ email: 'test@example.com', password: 'wrong-password' });
      } catch (error) {
        // Expected error
      }
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });
});
