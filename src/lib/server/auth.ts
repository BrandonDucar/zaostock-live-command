type Database = import('@cloudflare/workers-types').D1Database;

export interface TeamIdentity {
  id: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'STAGE_MANAGER' | 'CREW_LEAD' | 'MARKETING' | 'OBSERVER';
}

export type TeamAction =
  | 'agent_connect'
  | 'approve'
  | 'program_save'
  | 'program_move'
  | 'program_substitute'
  | 'crew_save'
  | 'crew_checkin'
  | 'task_save'
  | 'marketing_generate'
  | 'marketing_approve'
  | 'question_answer'
  | 'blackboard_post'
  | 'scenario'
  | 'reset';

const permissionsByRole: Record<TeamIdentity['role'], TeamAction[]> = {
  OWNER: ['agent_connect', 'approve', 'program_save', 'program_move', 'program_substitute', 'crew_save', 'crew_checkin', 'task_save', 'marketing_generate', 'marketing_approve', 'question_answer', 'blackboard_post', 'scenario', 'reset'],
  ADMIN: ['agent_connect', 'approve', 'program_save', 'program_move', 'program_substitute', 'crew_save', 'crew_checkin', 'task_save', 'marketing_generate', 'marketing_approve', 'question_answer', 'blackboard_post', 'scenario', 'reset'],
  STAGE_MANAGER: ['approve', 'program_save', 'program_move', 'program_substitute', 'crew_save', 'crew_checkin', 'task_save', 'question_answer', 'blackboard_post', 'scenario'],
  CREW_LEAD: ['crew_save', 'crew_checkin', 'task_save', 'question_answer', 'blackboard_post'],
  MARKETING: ['marketing_generate', 'marketing_approve', 'blackboard_post'],
  OBSERVER: []
};

export function teamPermissions(identity?: TeamIdentity): TeamAction[] {
  return identity ? permissionsByRole[identity.role] ?? [] : [];
}

export function canTeamAct(identity: TeamIdentity | undefined, action: TeamAction): boolean {
  return teamPermissions(identity).includes(action);
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function makeToken(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return `${prefix}_${Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function cookieValue(request: Request, name: string): string | undefined {
  const cookie = request.headers.get('cookie') ?? '';
  return cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

export async function teamIdentity(request: Request, db?: Database): Promise<TeamIdentity | undefined> {
  const token = cookieValue(request, 'zao_team');
  if (!db || !token) return undefined;
  const row = await db.prepare(`
    SELECT m.id, m.name, m.role FROM team_sessions s
    JOIN team_members m ON m.id = s.member_id
    WHERE s.token_hash = ?1 AND s.expires_at > CURRENT_TIMESTAMP
  `).bind(await sha256(token)).first<TeamIdentity>();
  return row ?? undefined;
}

export async function createSession(db: Database, memberId: string): Promise<{ token: string; cookie: string }> {
  const token = makeToken('team');
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await db.prepare('INSERT INTO team_sessions (id, member_id, token_hash, expires_at) VALUES (?1, ?2, ?3, ?4)')
    .bind(crypto.randomUUID(), memberId, await sha256(token), expires).run();
  return { token, cookie: `zao_team=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000` };
}

export async function agentIdentity(request: Request, db?: Database): Promise<{ id: string; name: string; runtime: string; scopes: string[] } | undefined> {
  const raw = request.headers.get('authorization');
  if (!db || !raw?.startsWith('Bearer ')) return undefined;
  const row = await db.prepare(`SELECT id, name, runtime, scopes_json AS scopesJson FROM agent_connections WHERE token_hash = ?1 AND status = 'CONNECTED'`)
    .bind(await sha256(raw.slice(7))).first<{ id: string; name: string; runtime: string; scopesJson: string }>();
  if (!row) return undefined;
  await db.prepare('UPDATE agent_connections SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?1').bind(row.id).run();
  return { id: row.id, name: row.name, runtime: row.runtime, scopes: JSON.parse(row.scopesJson) };
}
