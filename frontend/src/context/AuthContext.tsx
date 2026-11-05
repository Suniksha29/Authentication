import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, UserProfile } from '../api/client';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE' | null;
  isAdmin: boolean;
  isHR: boolean;
  isManager: boolean;
  isEmployee: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      const status = await api.auth.getStatus();
      if (status.authenticated) {
        const profile = await api.auth.getMe();
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      // Ignore network error on logout
    } finally {
      setUser(null);
      window.location.href = '/login?logout=true';
    }
  };

  const role = user?.role || null;
  const isAdmin = role === 'ADMIN';
  const isHR = role === 'HR';
  const isManager = role === 'MANAGER' || isAdmin || isHR;
  const isEmployee = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        role,
        isAdmin,
        isHR,
        isManager,
        isEmployee,
        refreshUser: fetchCurrentUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

