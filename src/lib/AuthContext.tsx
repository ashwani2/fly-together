import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStore, ApiError, type AuthUser, type Role } from './api';

export interface DisplayUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: Role;
}

type UiRole = 'student' | 'admin' | 'agent' | null;

interface AuthContextType {
  user: DisplayUser | null;
  role: UiRole;
  loading: boolean;
  login: (email: string, password: string) => Promise<DisplayUser>;
  register: (input: { email: string; password: string; role?: 'STUDENT' | 'AGENT'; name?: string; phoneNumber?: string }) => Promise<DisplayUser>;
  logout: () => Promise<void>;
  // Backwards-compatible quick logins — now hit the real backend with seeded demo accounts.
  loginAsDummy: () => Promise<void>;
  loginAsAdminDummy: (email?: string) => Promise<void>;
  loginAsAgentDummy: () => Promise<void>;
}

const noop = async () => { throw new Error('AuthProvider not mounted'); };

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  login: noop as never,
  register: noop as never,
  logout: async () => {},
  loginAsDummy: noop,
  loginAsAdminDummy: noop,
  loginAsAgentDummy: noop,
});

const toUiRole = (r: Role): UiRole => (r === 'ADMIN' ? 'admin' : r === 'AGENT' ? 'agent' : 'student');

function toDisplayUser(u: AuthUser): DisplayUser {
  const local = u.email.split('@')[0].replace(/[._]+/g, ' ').trim();
  const pretty = local.replace(/\b\w/g, (c) => c.toUpperCase());
  const displayName = u.role === 'ADMIN' ? 'System Admin' : u.role === 'AGENT' ? 'Premium Agent' : pretty || 'Student';
  return {
    uid: u.id,
    email: u.email,
    displayName,
    photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.email)}`,
    role: u.role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DisplayUser | null>(null);
  const [role, setRole] = useState<UiRole>(null);
  const [loading, setLoading] = useState(true);

  const applyUser = (u: AuthUser): DisplayUser => {
    const d = toDisplayUser(u);
    setUser(d);
    setRole(toUiRole(u.role));
    return d;
  };

  // Restore session from a stored token on first load.
  useEffect(() => {
    (async () => {
      if (tokenStore.access) {
        try {
          const me = await api.auth.me();
          applyUser(me);
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) tokenStore.clear();
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    tokenStore.set(res.accessToken, res.refreshToken);
    return applyUser(res.user);
  };

  const register = async (input: { email: string; password: string; role?: 'STUDENT' | 'AGENT'; name?: string; phoneNumber?: string }) => {
    const res = await api.auth.register({ ...input, consent: true });
    tokenStore.set(res.accessToken, res.refreshToken);
    return applyUser(res.user);
  };

  const logout = async () => {
    try { await api.auth.logout(); } catch { /* ignore */ }
    tokenStore.clear();
    setUser(null);
    setRole(null);
  };

  const loginAsDummy = async () => { await login('alex.j@example.com', 'Password1!'); };
  const loginAsAdminDummy = async (_email?: string) => { await login('admin@flytogether.com', 'Password1!'); };
  const loginAsAgentDummy = async () => { await login('agent@flytogether.com', 'Password1!'); };

  return (
    <AuthContext.Provider
      value={{ user, role, loading, login, register, logout, loginAsDummy, loginAsAdminDummy, loginAsAgentDummy }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
