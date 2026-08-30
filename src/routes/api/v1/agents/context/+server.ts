import type { RequestHandler } from './$types';
import { apiJson, optionsResponse } from '$lib/server/http';
import { agentIdentity } from '$lib/server/auth';
import { database, loadState } from '$lib/server/state';
import { currentProgram } from '$lib/conductor';

export const GET: RequestHandler = async ({ request, platform, url }) => {
  const db = database(platform);
  const agent = await agentIdentity(request, db);
  if (!agent) return apiJson({ ok: false, error: 'Valid agent bearer token required.' }, { status: 401 });
  const { state } = await loadState(db);
  const program = currentProgram(state);
  return apiJson({
    ok: true,
    agent,
    event: {
      id: state.eventId,
      name: state.eventName,
      date: state.eventDate,
      location: 'Franklin Street Parklet, Ellsworth, Maine',
      mode: state.mode,
      pulse: state.pulse,
      now: program.now ?? null,
      next: program.next ?? null,
      systems: state.systems,
      risks: state.hermes.riskSummary
    },
    work: state.tasks.filter((task) => task.status !== 'DONE'),
    handoff: {
      principle: 'Read shared state, take only work inside granted scopes, leave proof, and escalate consequential public effects.',
      stateUrl: `${url.origin}/api/v1/state`,
      eventsUrl: `${url.origin}/api/v1/events`,
      forbidden: ['Publish externally without approval', 'Change critical schedule', 'Spend money', 'Claim rehearsal data is live evidence']
    }
  });
};

export const OPTIONS = optionsResponse;
