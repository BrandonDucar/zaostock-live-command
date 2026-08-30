import type { RequestHandler } from './$types';
import { actionCatalog, agentProfiles, PUBLIC_REPOSITORY } from '$lib/agent-contract';
import { apiJson, optionsResponse } from '$lib/server/http';

export const GET: RequestHandler = ({ url }) => apiJson({
  name: 'ZAOstock Live Command',
  version: '0.2.0',
  purpose: 'A shared event operating room for humans and runtime-neutral agents.',
  repository: PUBLIC_REPOSITORY,
  instructions: {
    canonical: `${PUBLIC_REPOSITORY}/blob/main/AGENTS.md`,
    crew: `${PUBLIC_REPOSITORY}/blob/main/docs/CREW_AGENT_PLAYBOOK.md`,
    marketing: `${PUBLIC_REPOSITORY}/blob/main/docs/MARKETING_AGENT_PLAYBOOK.md`,
    llms: `${url.origin}/llms.txt`,
    openapi: `${url.origin}/api/openapi.json`
  },
  profiles: agentProfiles,
  actions: actionCatalog(url.origin),
  authority: {
    neverGrantedToExternalAgents: ['publish:external', 'write:critical_schedule', 'send:public_message', 'spend:money', 'manage:credentials'],
    proofRule: 'Agent-completed work requires proof. Draft creation is not publication.'
  },
  runtime: {
    hermesInstallRequired: false,
    modelProviderRequired: false,
    note: 'The Cloudflare backend owns shared coordination. Any HTTP-capable agent can connect as a client.'
  }
});

export const OPTIONS = optionsResponse;
