"use client";

import { createContext, useState, useEffect, type ReactNode } from 'react';
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

  const fetchUser = async (userToken: string) => {
    try {
      const response = await fetch(`${CORE_BACKEND_URL}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setUserEmail(userData.email);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsAuthenticated(true);
        return userData;
      } else {
        console.error("Failed to fetch user data:", response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      logout();
      return null;
    }
  };

  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedLlmToken = localStorage.getItem('llm_token');

        if (storedToken) {
          setToken(storedToken);
          setLlmToken(storedLlmToken);
          const fetchedUser = await fetchUser(storedToken);
          if (fetchedUser) {
            setUser(fetchedUser);
            setUserEmail(fetchedUser.email);
            setIsAuthenticated(true);
          } else {
            logout();
          }
        }
      } catch (error) {
        console.error("Could not read from localStorage or fetch user:", error);
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
      const newLlmToken = coreAuthData.llm_service_token;

      setToken(newToken);
      setLlmToken(newLlmToken);
      localStorage.setItem('token', newToken);
      localStorage.setItem('llm_token', newLlmToken);

      await fetchUser(newToken);
      
      setUserEmail(username);

      router.push('/dashboard/studies');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
      logout();
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

  const logout = () => {
    setToken(null);
    setLlmToken(null);
    setUser(null);
    setUserEmail(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('llm_token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error("Could not write to localStorage", error);
    }
    router.push('/login');
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
