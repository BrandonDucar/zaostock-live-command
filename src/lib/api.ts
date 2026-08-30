import type { EventState } from './types';

export async function loadEventState(): Promise<EventState> {
  const response = await fetch('/api/v1/state');
  if (!response.ok) throw new Error('Could not load event state');
  const payload = await response.json() as { state: EventState };
  return payload.state;
}

export async function mutateEventState(action: Record<string, unknown>): Promise<EventState> {
  const response = await fetch('/api/v1/state', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(action)
  });
  const payload = await response.json() as { state?: EventState; error?: string };
  if (!response.ok || !payload.state) throw new Error(payload.error ?? 'Event change rejected');
  return payload.state;
}

export function minuteToInput(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
}

export function inputToMinute(value: string): number {
  const [hour, minute] = value.split(':').map(Number);
  return (hour || 0) * 60 + (minute || 0);
}

