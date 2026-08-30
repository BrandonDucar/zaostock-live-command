import type { RequestHandler } from './$types';
import { apiJson, optionsResponse } from '$lib/server/http';
import { database, loadState, mutateState } from '$lib/server/state';

export const GET: RequestHandler = async ({ platform }) => {
  const result = await loadState(database(platform));
  return apiJson({ ...result, reality: result.state.mode === 'REHEARSAL' ? 'SIMULATED' : 'OBSERVED' });
};

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const state = await mutateState(database(platform), body);
    return apiJson({ ok: true, state, reality: state.mode === 'REHEARSAL' ? 'SIMULATED' : 'OBSERVED' });
  } catch (error) {
    return apiJson({ ok: false, error: error instanceof Error ? error.message : 'Invalid request' }, { status: 400 });
  }
};

export const OPTIONS = optionsResponse;

