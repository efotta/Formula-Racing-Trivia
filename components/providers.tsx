
'use client';

import { ReactNode, useEffect, useState, createContext, useContext } from 'react';

interface User {
  id: string;
  username: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

interface ProvidersProps {
  children: ReactNode;
}

// Safe localStorage wrapper for Safari private browsing compatibility
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof window !== 'undefined' && window.localStorage 
        ? window.localStorage.getItem(key) 
        : null;
    } catch (e) {
      console.warn('localStorage access denied (Safari Private Browsing?):', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('localStorage write denied (Safari Private Browsing?):', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('localStorage remove denied (Safari Private Browsing?):', e);
    }
  }
};

export default function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // Load user from localStorage on mount with Safari compatibility
    try {
      const storedUser = safeLocalStorage.getItem('f1-trivia-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
    }
    setIsLoading(false);
  }, []);

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      safeLocalStorage.setItem('f1-trivia-user', JSON.stringify(newUser));
    } else {
      safeLocalStorage.removeItem('f1-trivia-user');
    }
  };

  // Always render content wrapped in provider - Safari compatibility
  // The loading state will handle the hydration
  return (
    <AuthContext.Provider value={{ user, setUser: handleSetUser, isLoading: !mounted || isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
