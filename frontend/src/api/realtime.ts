import { getAccessToken } from './auth';
import { ParcelaAnalysis } from './parcele';

export type RealtimeMessage =
  | { type: 'connected' }
  | { type: 'analysis:completed'; parcelaId: string; analysis: ParcelaAnalysis }
  | { type: 'analysis:failed'; parcelaId: string; error: string };

export function openRealtimeSocket(): WebSocket | null {
  const token = getAccessToken();
  if (!token) return null;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return new WebSocket(`${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`);
}

export function parseRealtimeMessage(data: MessageEvent['data']): RealtimeMessage | null {
  try {
    const parsed = JSON.parse(String(data));
    if (parsed && typeof parsed.type === 'string') return parsed as RealtimeMessage;
  } catch {}
  return null;
}
