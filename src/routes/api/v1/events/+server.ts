import type { RequestHandler } from './$types';
import { apiJson, optionsResponse } from '$lib/server/http';
import { database, loadState } from '$lib/server/state';

export const GET: RequestHandler = async ({ platform, url }) => {
  const db = database(platform);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 40)));
  if (db) {
    const rows = await db.prepare(`
      SELECT id, at_minute AS atMinute, source, severity, message, proof_class AS proofClass, mode, created_at AS createdAt
      FROM event_events WHERE event_id = ?1 ORDER BY created_at DESC LIMIT ?2
    `).bind('zaostock-2026', limit).all();
    return apiJson({ events: rows.results, source: 'D1', limit });
  }
  const { state } = await loadState();
  return apiJson({ events: [...state.wire].reverse().slice(0, limit), source: 'FALLBACK', limit });
};

export const OPTIONS = optionsResponse;

