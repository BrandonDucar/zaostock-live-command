import { json } from '@sveltejs/kit';

export const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type, authorization',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'cache-control': 'no-store'
};

export function apiJson(data: unknown, init: ResponseInit = {}) {
  return json(data, { ...init, headers: { ...corsHeaders, ...(init.headers ?? {}) } });
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

