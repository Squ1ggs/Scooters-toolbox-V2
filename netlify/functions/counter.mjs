import { getCounters, json, options, requireEnvKey } from './_shared.mjs';

export default async (req) => {
  if (req.method === 'OPTIONS') return options();
  if (req.method !== 'GET') return json({ ok: false, error: 'method_not_allowed' }, 405);
  if (!requireEnvKey(req, 'STX_COUNTER_PUBLIC_KEY', 'X-STX-Public-Key')) {
    return json({ ok: false, error: 'forbidden' }, 403);
  }
  const counters = await getCounters();
  return json({ ok: true, ...counters });
};
