import type { RequestHandler } from './$types';
import { apiJson } from '$lib/server/http';

export const GET: RequestHandler = ({ url }) => apiJson({
  openapi: '3.1.0',
  info: {
    title: 'ZAOstock Live Command API',
    version: '0.1.0',
    description: 'Bounded event-state, rehearsal, crew, and flight-recorder API.'
  },
  servers: [{ url: url.origin }],
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
    '/api/v1/team/session': { get: { summary: 'Read the current role-scoped team session', responses: { '200': { description: 'Team identity or null' } } } },
    '/api/v1/team/invites': { post: { summary: 'Create a one-time admin or crew invite', responses: { '201': { description: 'One-time invite URL' }, '401': { description: 'Owner or admin required' } } } }
  }
});
