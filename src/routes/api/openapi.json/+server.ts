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
    '/api/v1/events': { get: { summary: 'Read the event flight recorder', responses: { '200': { description: 'Event list' } } } }
  }
});

