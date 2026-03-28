import { getCounters, json, options, requireEnvKey, requireJson, setCounters } from './_shared.mjs';

export default async (req) => {
  if (req.method === 'OPTIONS') return options();
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  if (!requireEnvKey(req, 'STX_ITEMS_BUMP_KEY', 'X-STX-Items-Bump-Key')) {
    return json({ ok: false, error: 'forbidden' }, 403);
  }

  const body = await requireJson(req);
  const deltaRaw = Number(body.delta);
  const delta = Number.isFinite(deltaRaw) ? Math.trunc(deltaRaw) : 1;
  const safeDelta = Math.min(100, Math.max(1, delta));

  const counters = await getCounters();
  counters.items_made += safeDelta;
  const saved = await setCounters(counters);
  return json({ ok: true, items_made: saved.items_made, total: saved.total, unique: saved.unique });
};
