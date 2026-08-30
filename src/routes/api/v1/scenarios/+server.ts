import type { RequestHandler } from './$types';
import { scenarios } from '$lib/conductor';
import { apiJson, optionsResponse } from '$lib/server/http';

export const GET: RequestHandler = () => apiJson({ scenarios, mode: 'REHEARSAL_ONLY' });
export const OPTIONS = optionsResponse;

