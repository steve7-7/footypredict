import React, { createContext, useContext, useState } from 'react';

export type UserPlan = 'none' | 'free' | 'premium';

export interface User {
  name: string;
  email: string;
  plan: UserPlan;
  joinDate: string;
  avatar: string;
  country: string;
  bio: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, plan: UserPlan) => void;
  logout: () => void;
  upgrade: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'footypredict.user';

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);

  const persist = (next: User | null) => {
    setUser(next);
    try {
      if (next) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Storage unavailable (private mode, quota) — keep in-memory state only.
    }
  };

  const login = (email: string, plan: UserPlan) => {
    persist({
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      email,
      plan,
      joinDate: new Date().toISOString(),
      avatar: '',
      country: 'United Kingdom',
      bio: 'Football betting enthusiast. Always looking for value picks.',
      notifications: { email: true, sms: false, push: true },
    });
  };

  const logout = () => {
    persist(null);
  };

  const upgrade = () => {
    if (user) {
      persist({ ...user, plan: 'premium' });
    }
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      persist({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, upgrade, updateProfile }}>
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
