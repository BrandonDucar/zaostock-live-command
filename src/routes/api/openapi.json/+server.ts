import type { RequestHandler } from './$types';
import { apiJson } from '$lib/server/http';

export const GET: RequestHandler = ({ url }) => apiJson({
  openapi: '3.1.0',
  info: {
    title: 'ZAOstock Live Command API',
    version: '0.2.0',
    description: 'Bounded event-state, rehearsal, crew, and flight-recorder API.'
  },
  servers: [{ url: url.origin }],
  components: {
    securitySchemes: {
      agentBearer: { type: 'http', scheme: 'bearer' },
      farcasterQuickAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'Farcaster Quick Auth JWT' }
    }
  },
  paths: {
    '/api/v1/health': { get: { summary: 'Runtime and D1 health', responses: { '200': { description: 'Healthy' } } } },
    '/api/v1/state': {
      get: { summary: 'Read current shared event state', responses: { '200': { description: 'Event state' } } },
      post: { summary: 'Apply a bounded state mutation', responses: { '200': { description: 'Updated event state' }, '400': { description: 'Rejected mutation' } } }
    },
    '/api/v1/scenarios': { get: { summary: 'List rehearsal scenarios', responses: { '200': { description: 'Scenarios' } } } },
    '/api/v1/ask': { post: { summary: 'Ask Hermes a deterministic state question', responses: { '200': { description: 'State-derived answer' } } } },
    '/api/v1/events': { get: { summary: 'Read the event flight recorder', responses: { '200': { description: 'Event list' } } } },
    '/api/v1/agents/connect': { post: { summary: 'Create a scoped, one-time agent credential (organizer required)', responses: { '201': { description: 'Agent handoff packet' }, '401': { description: 'Organizer access required' } } } },
    '/api/v1/agents/context': { get: { summary: 'Read role-scoped event context with a bearer token', responses: { '200': { description: 'Agent context and work queue' }, '401': { description: 'Invalid credential' } } } },
    '/api/v1/agents/manifest': { get: { summary: 'Discover public agent profiles, actions, instructions, and authority limits', responses: { '200': { description: 'Runtime-neutral agent manifest' } } } },
    '/api/v1/agents/messages': { post: { summary: 'Post an attributed message to the shared Blackboard', security: [{ agentBearer: [] }], responses: { '201': { description: 'Blackboard message accepted' }, '401': { description: 'Blackboard scope required' } } } },
    '/api/v1/agents/questions': { post: { summary: 'Ask the operator one bounded, decision-relevant question', security: [{ agentBearer: [] }], responses: { '201': { description: 'Question placed in operator inbox' }, '401': { description: 'Operator-question scope required' } } } },
    '/api/v1/agents/tasks': { post: { summary: 'Claim or advance crew work assigned to the authenticated agent', security: [{ agentBearer: [] }], responses: { '200': { description: 'Task updated with attribution and proof' }, '401': { description: 'Crew task scope required' } } } },
    '/api/v1/auth/farcaster': { post: { summary: 'Create a safe team session from a verified Farcaster identity', security: [{ farcasterQuickAuth: [] }], responses: { '200': { description: 'Observer or allowlisted admin session created' }, '401': { description: 'Invalid Farcaster identity' } } } },
    '/api/v1/team/session': { get: { summary: 'Read the current role-scoped team session', responses: { '200': { description: 'Team identity or null' } } } },
    '/api/v1/team/invites': { post: { summary: 'Create a one-time admin or crew invite', responses: { '201': { description: 'One-time invite URL' }, '401': { description: 'Owner or admin required' } } } }
  }
});
