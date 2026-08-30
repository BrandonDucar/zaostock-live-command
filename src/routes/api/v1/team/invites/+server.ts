import type { RequestHandler } from './$types';
import { apiJson } from '$lib/server/http';
import { makeToken, sha256, teamIdentity } from '$lib/server/auth';
import { database } from '$lib/server/state';

const roles = ['ADMIN', 'STAGE_MANAGER', 'CREW_LEAD', 'MARKETING'];

export const GET: RequestHandler = async ({ request, platform }) => {
  const db = database(platform);
  const member = await teamIdentity(request, db);
  if (!db || !member) return apiJson({ ok: false, error: 'Organizer access required.' }, { status: 401 });
  const members = await db.prepare('SELECT id, name, role, created_at AS createdAt FROM team_members WHERE event_id = ?1 ORDER BY created_at').bind('zaostock-2026').all();
  return apiJson({ ok: true, members: members.results });
};

export const POST: RequestHandler = async ({ request, platform, url }) => {
  const db = database(platform);
  const member = await teamIdentity(request, db);
  if (!db || !member || !['OWNER', 'ADMIN'].includes(member.role)) return apiJson({ ok: false, error: 'Owner or admin access required.' }, { status: 401 });
  const body = await request.json() as { role?: string };
  const role = roles.includes(String(body.role)) ? String(body.role) : 'ADMIN';
  const token = makeToken('invite');
  await db.prepare('INSERT INTO team_invites (id, event_id, token_hash, role, created_by) VALUES (?1, ?2, ?3, ?4, ?5)')
    .bind(crypto.randomUUID(), 'zaostock-2026', await sha256(token), role, member.id).run();
  return apiJson({ ok: true, role, inviteUrl: `${url.origin}/join?token=${encodeURIComponent(token)}`, shownOnce: true }, { status: 201 });
};
