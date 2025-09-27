import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer';

interface User {
  id: string;
  email: string;
  role: UserRole;
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
        const response = await fetch('/api/session', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const loginData = await response.json();
        // Refetch user from session to confirm login
        const sessionResponse = await fetch('/api/session', { credentials: 'include' });
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData.user) {
            setUser(sessionData.user);
            return { 
              success: true, 
              mustResetPassword: loginData.must_reset_password 
            };
          }
        }
      }
      return { success: false };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/logout', { method: 'POST', credentials: 'include' });
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