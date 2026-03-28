import { getStore } from '@netlify/blobs';

export const STORE = getStore('stx-toolbox');

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'Content-Type, X-STX-Track-Key, X-STX-Items-Bump-Key, X-STX-Admin-Key',
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
      'access-control-allow-headers': 'Content-Type, X-STX-Track-Key, X-STX-Items-Bump-Key, X-STX-Admin-Key',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'cache-control': 'no-store',
    },
  });
}

export async function getCounters() {
  return (await STORE.getJSON('counters')) || { total: 0, unique: 0, items_made: 0 };
}

export async function setCounters(counters) {
  const clean = {
    total: Math.max(0, Number(counters?.total) || 0),
    unique: Math.max(0, Number(counters?.unique) || 0),
    items_made: Math.max(0, Number(counters?.items_made) || 0),
  };
  await STORE.setJSON('counters', clean);
  return clean;
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
