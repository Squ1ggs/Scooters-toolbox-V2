import { STORE, getCounters, json, options, requireJson, setCounters, timingSafeEqualLoose } from './_shared.mjs';

export default async (req) => {
  if (req.method === 'OPTIONS') return options();
  const adminKey = process.env.STX_ADMIN_KEY;
  const supplied = req.headers.get('X-STX-Admin-Key') || new URL(req.url).searchParams.get('key') || '';
  if (!adminKey || !timingSafeEqualLoose(adminKey, supplied)) {
    return json({ ok: false, error: 'forbidden' }, 403);
  }

  if (req.method === 'GET') {
    const counters = await getCounters();
    return json({ ok: true, counters });
  }

  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);

  const body = await requireJson(req);
  const action = String(body.action || '').trim();
  const counters = await getCounters();

  if (action === 'reset-all') {
    await setCounters({ total: 0, unique: 0, items_made: 0 });
    const { blobs } = await STORE.list({ prefix: 'visits/' });
    for (const blob of blobs) await STORE.delete(blob.key);
    const { blobs: visitors } = await STORE.list({ prefix: 'visitors/' });
    for (const blob of visitors) await STORE.delete(blob.key);
    return json({ ok: true, counters: { total: 0, unique: 0, items_made: 0 } });
  }

  if (action === 'set-items') {
    counters.items_made = Math.max(0, Number(body.value) || 0);
    const saved = await setCounters(counters);
    return json({ ok: true, counters: saved });
  }

  if (action === 'set-counters') {
    const saved = await setCounters({
      total: body.total,
      unique: body.unique,
      items_made: body.items_made,
    });
    return json({ ok: true, counters: saved });
  }

  return json({ ok: false, error: 'unknown_action' }, 400);
};
