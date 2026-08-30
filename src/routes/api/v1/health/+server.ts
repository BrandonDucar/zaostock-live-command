import type { RequestHandler } from './$types';
import { apiJson, optionsResponse } from '$lib/server/http';
import { database } from '$lib/server/state';

export const GET: RequestHandler = async ({ platform }) => {
  const db = database(platform);
  let databaseStatus = 'UNBOUND';
  if (db) {
    try {
      const schema = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'event_state'").first<{ name: string }>();
      databaseStatus = schema?.name === 'event_state' ? 'REACHABLE' : 'SCHEMA_MISSING';
    } catch {
      databaseStatus = 'ERROR';
    }
  }
  return apiJson({
    ok: databaseStatus === 'REACHABLE',
    service: 'zaostock-live-command',
    version: '0.1.0',
    runtime: 'cloudflare-pages',
    database: databaseStatus,
    authority: 'REHEARSAL_AND_BOUNDED_CREW_ACTIONS',
    timestamp: new Date().toISOString()
  }, { status: databaseStatus === 'REACHABLE' ? 200 : 503 });
};

export const OPTIONS = optionsResponse;
