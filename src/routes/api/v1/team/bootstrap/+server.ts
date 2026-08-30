import type { RequestHandler } from './$types';
import { apiJson } from '$lib/server/http';
import { createSession, sha256 } from '$lib/server/auth';
import { database } from '$lib/server/state';

export const POST: RequestHandler = async ({ request, platform }) => {
  const db = database(platform);
  const expected = platform?.env?.ADMIN_BOOTSTRAP_SECRET;
  if (!db || !expected) return apiJson({ ok: false, error: 'Organizer access is not configured.' }, { status: 503 });
  const body = await request.json() as { code?: string; name?: string };
  if (!body.code || await sha256(body.code) !== await sha256(expected)) return apiJson({ ok: false, error: 'Organizer code is invalid.' }, { status: 401 });
  const existing = await db.prepare("SELECT id, name, role FROM team_members WHERE event_id = ?1 AND role = 'OWNER' LIMIT 1").bind('zaostock-2026').first<{ id: string; name: string; role: string }>();
  const member = existing ?? { id: crypto.randomUUID(), name: body.name?.trim() || 'ZAO Organizer', role: 'OWNER' };
  if (!existing) await db.prepare('INSERT INTO team_members (id, event_id, name, role) VALUES (?1, ?2, ?3, ?4)').bind(member.id, 'zaostock-2026', member.name, member.role).run();
  const session = await createSession(db, member.id);
  return apiJson({ ok: true, member }, { headers: { 'set-cookie': session.cookie } });
};
