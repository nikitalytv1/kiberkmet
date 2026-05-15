import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  AuthUser,
  LoginPayload,
  LoginResponse,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '../api/auth';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: (updated: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }

    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401) {
          const refreshed = await tryRefresh();
          if (refreshed) {
            const res2 = await fetch('/api/users/me', {
              headers: { Authorization: `Bearer ${getAccessToken()}` },
            });
            if (res2.ok) setUser(await res2.json());
            else clearTokens();
          } else {
            clearTokens();
          }
        } else if (res.ok) {
          setUser(await res.json());
        } else {
          clearTokens();
        }
      })
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  async function login(payload: LoginPayload) {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data: LoginResponse & { error?: string } = await res.json();
    if (!res.ok) throw new Error(data.error || 'Napaka pri prijavi.');
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  }

  async function logout() {
    const token = getAccessToken();
    if (token) {
      await fetch('/api/users/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    clearTokens();
    setUser(null);
  }

  function refreshUser(updated: AuthUser) {
    setUser(updated);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch('/api/users/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}
