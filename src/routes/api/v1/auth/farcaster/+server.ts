import { createClient, Errors } from '@farcaster/quick-auth';
import type { RequestHandler } from './$types';
import { apiJson } from '$lib/server/http';
import { createSession } from '$lib/server/auth';
import { database } from '$lib/server/state';

const quickAuth = createClient();

function cleanName(value: unknown, fid: number): string {
  const name = String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 64);
  return name || `Farcaster ${fid}`;
}

function adminFids(value?: string): Set<number> {
  return new Set((value ?? '').split(',').map((item) => Number(item.trim())).filter(Number.isSafeInteger));
}

export const POST: RequestHandler = async ({ request, platform, url }) => {
  const db = database(platform);
  if (!db) return apiJson({ ok: false, error: 'Team database unavailable.' }, { status: 503 });

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return apiJson({ ok: false, error: 'Farcaster Quick Auth token required.' }, { status: 401 });

  try {
    const payload = await quickAuth.verifyJwt({ token: authorization.slice(7), domain: url.hostname });
    const fid = payload.sub;
    const body = await request.json().catch(() => ({})) as { name?: string };
    const name = cleanName(body.name, fid);
    const providerSubject = String(fid);

    let member = await db.prepare(`
      SELECT id, name, role FROM team_members
      WHERE event_id = ?1 AND auth_provider = 'FARCASTER' AND provider_subject = ?2
      LIMIT 1
    `).bind('zaostock-2026', providerSubject).first<{ id: string; name: string; role: string }>();

    if (!member) {
      const role = adminFids(platform?.env?.FARCASTER_ADMIN_FIDS).has(fid) ? 'ADMIN' : 'OBSERVER';
      member = { id: crypto.randomUUID(), name, role };
      await db.prepare(`
        INSERT INTO team_members (id, event_id, name, role, auth_provider, provider_subject)
        VALUES (?1, ?2, ?3, ?4, 'FARCASTER', ?5)
      `).bind(member.id, 'zaostock-2026', member.name, member.role, providerSubject).run();
    } else if (member.name !== name) {
      member.name = name;
      await db.prepare('UPDATE team_members SET name = ?1 WHERE id = ?2').bind(name, member.id).run();
    }

    const session = await createSession(db, member.id);
    return apiJson({ ok: true, member, farcaster: { fid }, provider: 'FARCASTER_QUICK_AUTH' }, { headers: { 'set-cookie': session.cookie } });
  } catch (error) {
    if (error instanceof Errors.InvalidTokenError) return apiJson({ ok: false, error: 'Invalid Farcaster session.' }, { status: 401 });
    return apiJson({ ok: false, error: error instanceof Error ? error.message : 'Farcaster sign-in failed.' }, { status: 400 });
  }
};
