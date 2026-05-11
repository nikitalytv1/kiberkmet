import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth';

let refreshing: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
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

export async function fetchWithAuth(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res = await fetch(input, { ...init, headers });

  if (res.status === 401) {
    // Only one concurrent refresh
    if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null; });
    const ok = await refreshing;

    if (ok) {
      const newToken = getAccessToken();
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(input, { ...init, headers });
    } else {
      clearTokens();
      window.location.href = '/login';
    }
  }

  return res;
}
