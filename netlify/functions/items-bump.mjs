import { json, options, requireEnvKey, requireJson, updateCounters } from './_shared.mjs';

export default async (req) => {
  try {
  if (req.method === 'OPTIONS') return options();
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  if (!requireEnvKey(req, 'STX_ITEMS_BUMP_KEY', 'X-STX-Items-Bump-Key')) {
    return json({ ok: false, error: 'forbidden' }, 403);
  }

  const body = await requireJson(req);
  const delta = Math.max(1, Math.min(1000, Number(body.delta || 1) || 1));
  const saved = await updateCounters((c) => {
    c.items_made += delta;
  });
  return json({ ok: true, items_made: saved.items_made, total: saved.total, unique: saved.unique });
  } catch (_err) {
    return json({ ok: false, error: 'items_bump_failed' }, 200);
  }
};
