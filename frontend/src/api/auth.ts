export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function parseJson(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const res = await fetch('/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || 'Napaka pri registraciji.');
  return data;
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  const res = await fetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || 'Napaka pri prijavi.');
  return data;
}

export async function logout(): Promise<void> {
  await fetch('/api/users/logout', { method: 'POST' });
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
  const { fetchWithAuth } = await import('./fetchWithAuth');
  const res = await fetchWithAuth('/api/users/me/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Napaka pri spremembi gesla.');
}

export async function updateProfile(payload: { name?: string; email?: string }): Promise<AuthUser> {
  const { fetchWithAuth } = await import('./fetchWithAuth');
  const res = await fetchWithAuth('/api/users/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Napaka pri posodabljanju profila.');
  return data as AuthUser;
}
