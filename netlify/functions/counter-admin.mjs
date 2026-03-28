import { getCounters, json, options, requireEnvKey, requireJson, setCounters } from './_shared.mjs';

export default async (req) => {
  if (req.method === 'OPTIONS') return options();
  if (!requireEnvKey(req, 'STX_ADMIN_KEY', 'X-STX-Admin-Key')) {
    return json({ ok: false, error: 'forbidden' }, 403);
  }

  if (req.method === 'GET') {
    const counters = await getCounters();
    return json({ ok: true, ...counters });
  }

  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  const body = await requireJson(req);
  const action = String(body.action || '').trim();
  const counters = await getCounters();

  if (action === 'reset-all') {
    const saved = await setCounters({ total: 0, unique: 0, items_made: 0 });
    return json({ ok: true, ...saved });
  }

  if (action === 'set-items') {
    counters.items_made = Math.max(0, Number(body.value || 0) || 0);
    const saved = await setCounters(counters);
    return json({ ok: true, ...saved });
  }

  return json({ ok: false, error: 'unknown_action' }, 400);
};
