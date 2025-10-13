
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

export default function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // Load user from localStorage on mount
    try {
      const storedUser = localStorage.getItem('f1-trivia-user');
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
      localStorage.setItem('f1-trivia-user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('f1-trivia-user');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, setUser: handleSetUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
