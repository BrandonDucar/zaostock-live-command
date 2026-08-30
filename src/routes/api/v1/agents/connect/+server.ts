import type { RequestHandler } from './$types';
import { apiJson, optionsResponse } from '$lib/server/http';
import { database, loadState, saveState } from '$lib/server/state';
import { makeToken, sha256, teamIdentity } from '$lib/server/auth';

export const GET: RequestHandler = async ({ platform }) => {
  const db = database(platform);
  if (!db) return apiJson({ connections: [], source: 'UNBOUND' });
  const rows = await db.prepare(`
    SELECT id, name, runtime, scopes_json AS scopesJson, status, connected_at AS connectedAt
    FROM agent_connections WHERE event_id = ?1 ORDER BY connected_at DESC
  `).bind('zaostock-2026').all();
  const connections = rows.results.map((row) => ({
    id: row.id,
    name: row.name,
    runtime: row.runtime,
    scopes: JSON.parse(String(row.scopesJson)),
    status: row.status,
    connectedAt: row.connectedAt
  }));
  return apiJson({ connections, source: 'D1' });
};

export const POST: RequestHandler = async ({ request, platform, url }) => {
  const db = database(platform);
  if (!db) return apiJson({ ok: false, error: 'D1 binding required' }, { status: 503 });
  const organizer = await teamIdentity(request, db);
  if (!organizer) return apiJson({ ok: false, error: 'Organizer access required before connecting an agent.' }, { status: 401 });
  const body = await request.json() as { name?: string; runtime?: string; capability?: string };
  const name = body.name?.trim();
  if (!name) return apiJson({ ok: false, error: 'Agent name is required' }, { status: 400 });
  const runtime = body.runtime?.trim() || 'CUSTOM';
  const capability = body.capability ?? 'OBSERVER';
  const scopes = ['read:state', 'read:events', 'ask:hermes'];
  if (capability === 'CREW') scopes.push('write:crew_tasks');
  if (capability === 'MARKETING') scopes.push('write:marketing_drafts');
  const id = crypto.randomUUID();
  const secret = makeToken('zao');
  const connectedAt = new Date().toISOString();

  await db.prepare(`
    INSERT INTO agent_connections (id, event_id, name, runtime, scopes_json, token_hash, status, connected_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'CONNECTED', ?7)
  `).bind(id, 'zaostock-2026', name, runtime, JSON.stringify(scopes), await sha256(secret), connectedAt).run();

  const loaded = await loadState(db);
  loaded.state.agentConnections = [
    ...loaded.state.agentConnections.filter((connection) => connection.id !== id),
    { id, name, runtime, scopes, status: 'CONNECTED', connectedAt }
  ];
  await saveState(db, loaded.state);

  return apiJson({
    ok: true,
    connection: { id, name, runtime, scopes, status: 'CONNECTED', connectedAt },
    credential: {
      token: secret,
      shownOnce: true,
      authorization: `Bearer ${secret}`
    },
    agentConfig: {
      baseUrl: url.origin,
      state: `${url.origin}/api/v1/state`,
      events: `${url.origin}/api/v1/events`,
      ask: `${url.origin}/api/v1/ask`,
      context: `${url.origin}/api/v1/agents/context`,
      openapi: `${url.origin}/api/openapi.json`
    },
    authority: {
      granted: scopes,
      denied: ['publish:external', 'write:critical_schedule', 'send:public_message', 'spend:money']
    }
  }, { status: 201 });
};

export const OPTIONS = optionsResponse;
