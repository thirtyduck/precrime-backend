import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getBackendUrl, setAuthTokenGetter } from '@/services/api';
import type { UserRole } from '@/types/user';

interface AuthContextType {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  canManageDataSources: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const TOKEN_KEY = 'precrime_auth_token';
const USERNAME_KEY = 'precrime_auth_username';
const ROLE_KEY = 'precrime_auth_role';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUsername(null);
    setRole(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(ROLE_KEY);
  }, []);

  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  useEffect(() => {
    const handleExpired = () => logout();
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [logout]);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      verifyToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  async function verifyToken(storedToken: string) {
    try {
      const baseUrl = getBackendUrl();
      const response = await fetch(`${baseUrl}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${storedToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setToken(storedToken);
        setUsername(data.username);
        setRole(data.role || (localStorage.getItem(ROLE_KEY) as UserRole));
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USERNAME_KEY);
        localStorage.removeItem(ROLE_KEY);
      }
    } catch {
      setToken(storedToken);
      setUsername(localStorage.getItem(USERNAME_KEY));
      setRole(localStorage.getItem(ROLE_KEY) as UserRole);
    } finally {
      setIsLoading(false);
    }
  }

  const login = useCallback(async (username: string, password: string) => {
    const baseUrl = getBackendUrl();
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    setToken(data.token);
    setUsername(data.username);
    setRole(data.role);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USERNAME_KEY, data.username);
    localStorage.setItem(ROLE_KEY, data.role);
  }, []);

  const isAdmin = role === 'admin';
  const canManageDataSources = role === 'admin' || role === 'analyst';

  return (
    <AuthContext.Provider value={{
      token,
      username,
      role,
      isAuthenticated: !!token,
      isLoading,
      isAdmin,
      canManageDataSources,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
