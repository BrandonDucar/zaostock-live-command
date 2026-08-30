import type { RequestHandler } from './$types';
import { apiJson, optionsResponse } from '$lib/server/http';
import { database, loadState, mutateState } from '$lib/server/state';
import { agentIdentity, canTeamAct, teamIdentity, type TeamAction } from '$lib/server/auth';

export const GET: RequestHandler = async ({ platform }) => {
  const result = await loadState(database(platform));
  return apiJson({ ...result, reality: result.state.mode === 'REHEARSAL' ? 'SIMULATED' : 'OBSERVED' });
};

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const db = database(platform);
    const type = String(body.type ?? '');
    const teamWrites: TeamAction[] = ['approve', 'program_save', 'program_move', 'program_substitute', 'crew_save', 'crew_checkin', 'task_save', 'marketing_approve', 'question_answer', 'blackboard_post', 'scenario', 'reset'];
    const action = type as TeamAction;
    const organizer = teamWrites.includes(action) || type === 'marketing_generate' ? await teamIdentity(request, db) : undefined;
    if (teamWrites.includes(action) && !canTeamAct(organizer, action)) return apiJson({ ok: false, error: 'Your team role does not allow this action.' }, { status: 403 });
    if (type === 'marketing_generate') {
      const authorizedOrganizer = canTeamAct(organizer, 'marketing_generate') ? organizer : undefined;
      const agent = authorizedOrganizer ? undefined : await agentIdentity(request, db);
      if (!authorizedOrganizer && !agent?.scopes.includes('write:marketing_drafts')) return apiJson({ ok: false, error: 'Marketing scope required.' }, { status: 403 });
      const state = await mutateState(db, body, authorizedOrganizer ? { id: authorizedOrganizer.id, name: authorizedOrganizer.name } : agent);
      return apiJson({ ok: true, state, reality: state.mode === 'REHEARSAL' ? 'SIMULATED' : 'OBSERVED' });
    }
    const state = await mutateState(db, body, organizer ? { id: organizer.id, name: organizer.name } : undefined);
    return apiJson({ ok: true, state, reality: state.mode === 'REHEARSAL' ? 'SIMULATED' : 'OBSERVED' });
  } catch (error) {
    return apiJson({ ok: false, error: error instanceof Error ? error.message : 'Invalid request' }, { status: 400 });
  }
};

export const OPTIONS = optionsResponse;
