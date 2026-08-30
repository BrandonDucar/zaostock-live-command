import type { RequestHandler } from './$types';
import { postBlackboardMessage } from '$lib/conductor';
import { agentIdentity } from '$lib/server/auth';
import { apiJson, optionsResponse } from '$lib/server/http';
import { database, loadState, saveState } from '$lib/server/state';

const lanes = ['ALL', 'CREW', 'MARKETING', 'STAGE', 'MEDIA'] as const;

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const db = database(platform);
    const agent = await agentIdentity(request, db);
    if (!agent?.scopes.includes('write:blackboard')) return apiJson({ ok: false, error: 'write:blackboard scope required.' }, { status: 401 });
    const body = await request.json() as Record<string, unknown>;
    const lane = String(body.lane ?? 'ALL') as typeof lanes[number];
    if (!lanes.includes(lane)) return apiJson({ ok: false, error: 'Invalid Blackboard lane.' }, { status: 400 });
    const loaded = await loadState(db);
    const state = postBlackboardMessage(loaded.state, { id: agent.id, name: agent.name, type: 'AGENT' }, {
      lane,
      text: String(body.text ?? ''),
      proof: body.proof ? String(body.proof) : undefined
    });
    await saveState(db, state);
    return apiJson({ ok: true, message: state.blackboard.at(-1) }, { status: 201 });
  } catch (error) {
    return apiJson({ ok: false, error: error instanceof Error ? error.message : 'Message rejected.' }, { status: 400 });
  }
};

export const OPTIONS = optionsResponse;
