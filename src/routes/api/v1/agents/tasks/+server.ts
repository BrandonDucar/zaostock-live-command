import type { RequestHandler } from './$types';
import { updateTaskByAgent } from '$lib/conductor';
import { agentIdentity } from '$lib/server/auth';
import { apiJson, optionsResponse } from '$lib/server/http';
import { database, loadState, saveState } from '$lib/server/state';
import type { CrewTask } from '$lib/types';

const allowedStatuses: CrewTask['status'][] = ['CLAIMED', 'ACTIVE', 'BLOCKED', 'PROOF', 'DONE'];

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const db = database(platform);
    const agent = await agentIdentity(request, db);
    if (!agent?.scopes.includes('write:crew_tasks')) return apiJson({ ok: false, error: 'write:crew_tasks scope required.' }, { status: 401 });
    const body = await request.json() as Record<string, unknown>;
    const status = String(body.status ?? 'CLAIMED') as CrewTask['status'];
    if (!allowedStatuses.includes(status)) return apiJson({ ok: false, error: 'Invalid agent task status.' }, { status: 400 });
    const loaded = await loadState(db);
    const state = updateTaskByAgent(loaded.state, agent, {
      id: String(body.taskId ?? ''),
      status,
      progress: body.progress === undefined ? undefined : Number(body.progress),
      proof: body.proof === undefined ? undefined : String(body.proof),
      blockedReason: body.blockedReason === undefined ? undefined : String(body.blockedReason)
    });
    await saveState(db, state);
    return apiJson({ ok: true, task: state.tasks.find((task) => task.id === body.taskId), state });
  } catch (error) {
    return apiJson({ ok: false, error: error instanceof Error ? error.message : 'Task update rejected.' }, { status: 400 });
  }
};

export const OPTIONS = optionsResponse;
