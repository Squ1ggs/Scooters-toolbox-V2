import { getCounters, json, options, requireEnvKey, requireJson, setCounters } from './_shared.mjs';

export default async (req) => {
  if (req.method === 'OPTIONS') return options();
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  if (!requireEnvKey(req, 'STX_ITEMS_BUMP_KEY', 'X-STX-Items-Bump-Key')) {
    return json({ ok: false, error: 'forbidden' }, 403);
  }

  const body = await requireJson(req);
  const delta = Math.max(1, Math.min(1000, Number(body.delta || 1) || 1));
  const counters = await getCounters();
  counters.items_made += delta;
  const saved = await setCounters(counters);
  return json({ ok: true, items_made: saved.items_made, total: saved.total, unique: saved.unique });
};
