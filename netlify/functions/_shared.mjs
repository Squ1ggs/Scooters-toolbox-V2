import { getStore } from '@netlify/blobs';

export const STORE = getStore('stx-toolbox');

const COUNTERS_KEY = 'counters';
/** Hot-path updates use ETag CAS so concurrent track/items-bump requests do not stomp counts. */
const COUNTER_CAS_ATTEMPTS = 20;

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
  const data = await STORE.get(COUNTERS_KEY, { type: 'json' });
  return data ?? { total: 0, unique: 0, items_made: 0 };
}

/**
 * @param {(draft: { total: number, unique: number, items_made: number }) => void} mutator
 */
export async function updateCounters(mutator) {
  for (let attempt = 0; attempt < COUNTER_CAS_ATTEMPTS; attempt++) {
    const meta = await STORE.getWithMetadata(COUNTERS_KEY, { type: 'json' });
    const base = meta?.data ?? { total: 0, unique: 0, items_made: 0 };
    const etag = meta?.etag ?? null;
    const draft = {
      total: Math.max(0, Number(base.total || 0) || 0),
      unique: Math.max(0, Number(base.unique || 0) || 0),
      items_made: Math.max(0, Number(base.items_made || 0) || 0),
    };
    mutator(draft);
    const normalized = {
      total: Math.max(0, Math.floor(draft.total)),
      unique: Math.max(0, Math.floor(draft.unique)),
      items_made: Math.max(0, Math.floor(draft.items_made)),
    };

    if (etag == null) {
      const r = await STORE.setJSON(COUNTERS_KEY, normalized, { onlyIfNew: true });
      if (r.modified !== false) return normalized;
      continue;
    }
    const r = await STORE.setJSON(COUNTERS_KEY, normalized, { onlyIfMatch: etag });
    if (r.modified !== false) return normalized;
  }
  /* Last resort: avoid hard-failing analytics endpoints under bursts.
     This can lose a tiny number of increments but prevents 502 spam. */
  const base = await getCounters();
  const draft = {
    total: Math.max(0, Number(base.total || 0) || 0),
    unique: Math.max(0, Number(base.unique || 0) || 0),
    items_made: Math.max(0, Number(base.items_made || 0) || 0),
  };
  mutator(draft);
  return setCounters(draft);
}

export async function setCounters(counters) {
  const normalized = {
    total: Number(counters?.total || 0) || 0,
    unique: Number(counters?.unique || 0) || 0,
    items_made: Number(counters?.items_made || 0) || 0,
  };
  await STORE.setJSON(COUNTERS_KEY, normalized);
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
