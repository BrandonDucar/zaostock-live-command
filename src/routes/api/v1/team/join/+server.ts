import type { RequestHandler } from './$types';
import { apiJson } from '$lib/server/http';
import { createSession, sha256 } from '$lib/server/auth';
import { database } from '$lib/server/state';

export const POST: RequestHandler = async ({ request, platform }) => {
  const db = database(platform);
  if (!db) return apiJson({ ok: false, error: 'Team database unavailable.' }, { status: 503 });
  const body = await request.json() as { token?: string; name?: string };
  const invite = body.token ? await db.prepare('SELECT id, role FROM team_invites WHERE token_hash = ?1 AND claimed_at IS NULL').bind(await sha256(body.token)).first<{ id: string; role: string }>() : undefined;
  if (!invite || !body.name?.trim()) return apiJson({ ok: false, error: 'A valid invite and your name are required.' }, { status: 400 });
  const member = { id: crypto.randomUUID(), name: body.name.trim(), role: invite.role };
  await db.batch([
    db.prepare('INSERT INTO team_members (id, event_id, name, role) VALUES (?1, ?2, ?3, ?4)').bind(member.id, 'zaostock-2026', member.name, member.role),
    db.prepare('UPDATE team_invites SET claimed_at = CURRENT_TIMESTAMP WHERE id = ?1').bind(invite.id)
  ]);
  const session = await createSession(db, member.id);
  return apiJson({ ok: true, member }, { headers: { 'set-cookie': session.cookie } });
};
