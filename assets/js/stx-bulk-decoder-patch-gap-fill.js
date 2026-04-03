(() => {
  const ap = window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS) ? window.STX_DATASET.ALL_PARTS : null;
  const db = window.PARTS_DB;
  if (!ap || !db || typeof db !== 'object') {
    window.__STX_PATCH_V11 = { note: 'skipped: STX_DATASET.ALL_PARTS or PARTS_DB missing' };
    return;
  }
  let added = 0;
  for (let i = 0; i < ap.length; i++) {
    const p = ap[i];
    const idRaw = p.idRaw;
    if (idRaw == null || !/^\d+:\d+$/.test(String(idRaw))) continue;
    const key = String(idRaw);
    if (db[key] && db[key].length) continue;
    const rawCode = p.code;
    const code = typeof rawCode === 'string' ? rawCode.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"') : '';
    const row = {
      manufacturer_or_group: p.manufacturer || '',
      weapon_type_or_category: p.itemType || p.category || '',
      part_type: p.partType || '',
      name: p.name || '',
      alpha_code: code,
      stats_text: p.stats || '',
      effects_text: '',
      context_path: 'stx_dataset > ' + (p.category || '') + ' > ' + key,
      source: 'stx_dataset'
    };
    db[key] = [row];
    added++;
  }
  const MANUAL_PART_ROWS = {
    '273:19': [{ manufacturer_or_group: 'Torgue', weapon_type_or_category: 'Heavy Weapon', part_type: 'Barrel', name: 'Part ID 19 (not in STX dataset export)', alpha_code: 'TOR_HW', stats_text: 'Between documented 273:18 (body) and 273:20 (barrel) — verify alpha in game files.', effects_text: '', context_path: 'stx_bulk_decoder_gap', source: 'stx_bulk_decoder_gap' }],
    '282:11': [{ manufacturer_or_group: 'Vladof', weapon_type_or_category: 'Heavy Weapon', part_type: 'Part', name: 'Part ID 11 (not in STX dataset export)', alpha_code: 'VLA_HW', stats_text: 'Verify in game — gap for Vladof HW family 282.', effects_text: '', context_path: 'stx_bulk_decoder_gap', source: 'stx_bulk_decoder_gap' }]
  };
  let manual = 0;
  for (const k of Object.keys(MANUAL_PART_ROWS)) {
    if (db[k] && db[k].length) continue;
    db[k] = MANUAL_PART_ROWS[k];
    manual++;
  }
  window.__STX_PATCH_V11 = { note: 'filled PARTS_DB from STX_DATASET.ALL_PARTS for missing idRaw keys', addedKeys: added, manualGapKeys: manual };
})();