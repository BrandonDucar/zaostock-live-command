import type { RequestHandler } from './$types';
import { apiJson, optionsResponse } from '$lib/server/http';
import { answerQuestion, database } from '$lib/server/state';

export const POST: RequestHandler = async ({ request, platform }) => {
  const body = await request.json() as { question?: string };
  const question = body.question?.trim();
  if (!question) return apiJson({ ok: false, error: 'question is required' }, { status: 400 });
  const result = await answerQuestion(database(platform), question);
  return apiJson({ ok: true, answer: result.answer, pulse: result.state.pulse, mode: result.state.mode, evidence: 'DETERMINISTIC_STATE_QUERY' });
};

export const OPTIONS = optionsResponse;

