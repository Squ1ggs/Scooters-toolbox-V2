import { STORE, getCounters, json, options, requireEnvKey, requireJson, setCounters } from './_shared.mjs';

export default async (req) => {
  if (req.method === 'OPTIONS') return options();
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  if (!requireEnvKey(req, 'STX_ANALYTICS_TRACK_KEY', 'X-STX-Track-Key')) {
    return json({ ok: false, error: 'forbidden' }, 403);
  }

  const body = await requireJson(req);
  const visitorId = String(body.visitor_id || '').trim().slice(0, 200);
  const path = String(body.path || '/').trim().slice(0, 500) || '/';
  if (!visitorId) return json({ ok: false, error: 'visitor_id_required' }, 400);

  const visitorKey = `visitors/${encodeURIComponent(visitorId)}`;
  const visitCountKey = `visits/${encodeURIComponent(visitorId)}`;
  const visitorSeen = await STORE.get(visitorKey, { type: 'text' });
  const priorVisits = Number((await STORE.get(visitCountKey, { type: 'text' })) || 0) || 0;

  const counters = await getCounters();
  counters.total += 1;
  if (visitorSeen === null) {
    counters.unique += 1;
    await STORE.set(visitorKey, new Date().toISOString());
  }
  await STORE.set(visitCountKey, String(priorVisits + 1));
  await STORE.set(`paths/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, JSON.stringify({ t: new Date().toISOString(), path, visitor_id: visitorId }));
  const saved = await setCounters(counters);

  return json({ ok: true, total: saved.total, unique: saved.unique, items_made: saved.items_made, your_visits: priorVisits + 1 });
};
