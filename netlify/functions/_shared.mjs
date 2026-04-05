import { getStore } from '@netlify/blobs';

export const STORE = getStore('stx-toolbox');

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'Content-Type, X-STX-Track-Key, X-STX-Counter-Key, X-STX-Items-Bump-Key, X-STX-Admin-Key',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      ...extraHeaders,
    },
  });
}

export function options() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'Content-Type, X-STX-Track-Key, X-STX-Counter-Key, X-STX-Items-Bump-Key, X-STX-Admin-Key',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'cache-control': 'no-store',
    },
  });
}

export async function getCounters() {
  const data = await STORE.get('counters', { type: 'json' });
  return data ?? { total: 0, unique: 0, items_made: 0 };
}

export async function setCounters(counters) {
  const normalized = {
    total: Number(counters?.total || 0) || 0,
    unique: Number(counters?.unique || 0) || 0,
    items_made: Number(counters?.items_made || 0) || 0,
  };
  await STORE.setJSON('counters', normalized);
  return normalized;
}

export async function requireJson(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export function timingSafeEqualLoose(a, b) {
  return typeof a === 'string' && typeof b === 'string' && a.length > 0 && a === b;
}

export function requireEnvKey(req, envName, headerName, queryName = 'key') {
  const expected = process.env[envName];
  if (!expected) return true;
  const gotHeader = req.headers.get(headerName) || '';
  const url = new URL(req.url);
  const gotQuery = url.searchParams.get(queryName) || '';
  return timingSafeEqualLoose(expected, gotHeader) || timingSafeEqualLoose(expected, gotQuery);
}
