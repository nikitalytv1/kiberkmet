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
