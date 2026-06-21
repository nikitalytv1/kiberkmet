import { getAccessToken, clearTokens, refreshTokens } from './auth';

let refreshing: Promise<boolean> | null = null;

export async function fetchWithAuth(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res = await fetch(input, { ...init, headers });

  if (res.status === 401) {
    if (!refreshing) refreshing = refreshTokens().finally(() => { refreshing = null; });
    const ok = await refreshing;

    if (ok) {
      headers.set('Authorization', `Bearer ${getAccessToken()}`);
      res = await fetch(input, { ...init, headers });
    } else {
      clearTokens();
      window.location.href = '/login';
    }
  }

  return res;
}
