import type { RequestHandler } from './$types';
import { askOperatorQuestion } from '$lib/conductor';
import { agentIdentity } from '$lib/server/auth';
import { apiJson, optionsResponse } from '$lib/server/http';
import { database, loadState, saveState } from '$lib/server/state';

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const db = database(platform);
    const agent = await agentIdentity(request, db);
    if (!agent?.scopes.includes('ask:operator')) return apiJson({ ok: false, error: 'ask:operator scope required.' }, { status: 401 });
    const body = await request.json() as Record<string, unknown>;
    const lane = String(body.lane ?? 'GENERAL');
    const priority = String(body.priority ?? 'P1');
    if (!['CREW', 'MARKETING', 'GENERAL'].includes(lane)) return apiJson({ ok: false, error: 'Invalid lane.' }, { status: 400 });
    if (!['P0', 'P1', 'P2'].includes(priority)) return apiJson({ ok: false, error: 'Invalid priority.' }, { status: 400 });
    const loaded = await loadState(db);
    const state = askOperatorQuestion(loaded.state, agent, {
      question: String(body.question ?? ''),
      why: String(body.why ?? ''),
      lane: lane as 'CREW' | 'MARKETING' | 'GENERAL',
      priority: priority as 'P0' | 'P1' | 'P2',
      sourcePromptId: body.sourcePromptId ? String(body.sourcePromptId) : undefined
    });
    await saveState(db, state);
    return apiJson({ ok: true, questions: state.agentQuestions.filter((item) => item.status === 'OPEN') }, { status: 201 });
  } catch (error) {
    return apiJson({ ok: false, error: error instanceof Error ? error.message : 'Question rejected.' }, { status: 400 });
  }
};

export const OPTIONS = optionsResponse;
