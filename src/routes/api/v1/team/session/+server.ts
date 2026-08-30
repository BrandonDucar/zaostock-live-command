import type { RequestHandler } from './$types';
import { apiJson } from '$lib/server/http';
import { teamIdentity, teamPermissions } from '$lib/server/auth';
import { database } from '$lib/server/state';

export const GET: RequestHandler = async ({ request, platform }) => {
  const member = await teamIdentity(request, database(platform));
  return apiJson({ member: member ?? null, permissions: teamPermissions(member) });
};
