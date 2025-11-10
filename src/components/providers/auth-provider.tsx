'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, logout as authLogout, getApiKey } from '@/lib/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  apiKey: string | null;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const auth = isAuthenticated();
    const key = getApiKey();
    setIsAuth(auth);
    setApiKey(key);
    setIsLoading(false);

    // Redirect to login if not authenticated and not on login page
    if (!auth && pathname !== '/login') {
      router.push('/login');
    }

    // Redirect to dashboard if authenticated and on login page
    if (auth && pathname === '/login') {
      router.push('/');
    }
  }, [pathname, router]);

  const logout = () => {
    authLogout();
    setIsAuth(false);
    setApiKey(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: isAuth, apiKey, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
