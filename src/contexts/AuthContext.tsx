import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER';

interface User {
  id: string;
  email: string;
  role: UserRole;
  is_admin?: boolean;
  organization_name?: string;
  organization_logo_url?: string;
  must_reset_password?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; mustResetPassword?: boolean }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Try to get session from backend
        const response = await fetch('/api/session', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Session check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; mustResetPassword?: boolean }> => {
    setIsLoading(true);
    try {
      // Make real API call to backend
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Include cookies for session
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return { 
          success: true, 
          mustResetPassword: data.user.must_reset_password || false 
        };
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
        console.error('Login failed:', errorData);
        return { success: false };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout to clear session
      await fetch('/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};