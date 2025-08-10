
"use client";

import { createContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const CORE_BACKEND_URL = process.env.NEXT_PUBLIC_CORE_BACKEND_URL || "http://127.0.0.1:8000";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  role: {
    name: string;
  } | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  llmToken: string | null;
  userEmail: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [llmToken, setLlmToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  
  const logout = useCallback(() => {
    setToken(null);
    setLlmToken(null);
    setUser(null);
    setUserEmail(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('llm_access_token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error("Could not write to localStorage", error);
    }
    router.push('/login');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const validateToken = useCallback(async (tokenToValidate: string) => {
    try {
      const response = await fetch(`${CORE_BACKEND_URL}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${tokenToValidate}` },
      });
      if (!response.ok) {
         console.error("Token validation failed:", response.status, response.statusText);
         logout();
      }
      // If token is valid, we don't need to do anything, the user is already set from localStorage.
    } catch (error) {
       console.error("Error validating token:", error);
       logout();
    }
  }, [logout]);


  useEffect(() => {
    const loadFromStorage = async () => {
      setIsLoading(true);
      try {
        const storedToken = localStorage.getItem('token');
        const storedLlmToken = localStorage.getItem('llm_access_token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedLlmToken && storedUser) {
          setToken(storedToken);
          setLlmToken(storedLlmToken);
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setUserEmail(parsedUser.email);
          setIsAuthenticated(true);
          // Re-validate the token to ensure it's not expired
          await validateToken(storedToken);
        } else {
           if (router.pathname !== '/login' && router.pathname !== '/register') {
             logout();
           }
        }
      } catch (error) {
        console.error("Could not read from localStorage or validate token:", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    loadFromStorage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const coreAuthResponse = await fetch(`${CORE_BACKEND_URL}/api/v1/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password }).toString(),
      });

      if (!coreAuthResponse.ok) {
        const errorData = await coreAuthResponse.json();
        throw new Error(errorData.detail || 'Authentication failed. Please check your credentials.');
      }
      const coreAuthData = await coreAuthResponse.json();
      const newToken = coreAuthData.access_token;
      const newLlmToken = coreAuthData.llm_access_token;
      const newUser = coreAuthData.user;

      if (!newToken || !newLlmToken || !newUser) {
          throw new Error('Incomplete authentication response from server.');
      }

      setToken(newToken);
      setLlmToken(newLlmToken);
      setUser(newUser);
      setUserEmail(newUser.email);
      setIsAuthenticated(true);
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('llm_access_token', newLlmToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      router.push('/dashboard/studies');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
      logout(); // Clear any partial state
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${CORE_BACKEND_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password }),
      });

      if (response.status === 201) {
        toast({
          title: "Registration Successful",
          description: "You can now log in with your credentials.",
        });
        router.push('/login');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    token,
    llmToken,
    userEmail,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}