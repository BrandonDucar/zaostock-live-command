import type { RequestHandler } from './$types';
import { apiJson } from '$lib/server/http';
import { teamIdentity } from '$lib/server/auth';
import { database } from '$lib/server/state';

export const GET: RequestHandler = async ({ request, platform }) => apiJson({ member: await teamIdentity(request, database(platform)) ?? null });
