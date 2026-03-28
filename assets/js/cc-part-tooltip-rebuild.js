/**
 * cc-part-tooltip-rebuild.js
 * Provides partTooltipText() for hover tooltips: numeric ID, name/spawn ID, short stats.
 * Use when creating options or part elements so users can see IDs for skin mixing etc.
 */
(function () {
  'use strict';

  function q(s) { return String(s == null ? '' : s).trim(); }

  var BUCKET_LABELS = { damage: 'Damage', crit: 'Crit', elemental: 'Elemental', accuracy: 'Accuracy', ads: 'ADS/Handling', firerate: 'Fire Rate', reload_time: 'Reload Time', reload_speed: 'Reload Speed', ammo_mag: 'Ammo/Mag', projectiles: 'Projectiles' };

  function formatPartsStatsData(part) {
    try {
      var data = window.PARTS_STATS_DATA;
      if (!data) return '';
      var codes = [];
      var c1 = q(part && (part.code || part.spawnCode || part.importCode || '')).replace(/^"+|"+$/g, '');
      if (c1) codes.push(c1);
      var idRaw = q(part && (part.idRaw || part.idraw || ''));
      if (idRaw) codes.push(idRaw);
      if (part && part.family != null && part.id != null) codes.push(part.family + ':' + part.id);
      for (var i = 0; i < codes.length; i++) {
        var c = String(codes[i] || '').trim();
        if (!c) continue;
        var arr = (data.by_id_raw && data.by_id_raw[c]) || (data.by_part_code && data.by_part_code[c]);
        // Stats export normalizes part_code casing; dataset casing can differ.
        // Try lowercased lookups + suffix fallback to avoid missing numeric effects.
        if (!arr && data.by_part_code) {
          arr = data.by_part_code[String(c).toLowerCase()];
        }
        if (!arr && data.by_code_suffix) {
          var suffix = String(c).split('.').pop();
          arr = data.by_code_suffix[String(suffix).toLowerCase()];
        }
        if (!arr || !arr.length) continue;
        var out = [];
        for (var j = 0; j < Math.min(arr.length, 4); j++) {
          var s = arr[j];
          var bucket = (s && s.bucket) ? String(s.bucket).trim() : '';
          var lbl = BUCKET_LABELS[bucket] || bucket;
          var v = Number(s && s.stat_value);
          if (!Number.isFinite(v)) continue;
          var mult = (s.combine === 'mul') ? v : (1 + v);
          if (s.invert && mult) mult = 1 / mult;
          var pct = ((mult - 1) * 100).toFixed(0);
          out.push((pct >= 0 ? '+' : '') + pct + '% ' + lbl);
        }
        if (out.length) return out.join(', ').substring(0, 120);
      }
    } catch (_) {}
    return '';
  }

  function shortStats(part) {
    try {
      var p = part;
      var isLegendary = /legendary\s*perk/i.test(String(p && (p.partType || p.kind || '')));
      var statsStr = '';
      var effectsStr = q(p && (p.effects || p.effect || ''));
      if (p && typeof p.stats === 'string' && p.stats.trim()) statsStr = p.stats.trim();
      else if (p && typeof p.statText === 'string' && p.statText.trim()) statsStr = p.statText.trim();
      else {
        var code = q(p && (p.code || p.spawnCode || p.importCode || ''));
        if (code) {
          var zip = window.__CC_ZIP_WEAPON_PARTS || window.ZIP_WEAPON_PARTS;
          if (zip && zip[code] && zip[code].stats) statsStr = String(zip[code].stats).trim();
        }
      }
      // For legendary perks, show both: the "effects" name AND the numeric stat deltas.
      // Many legendary perk entries have generic `stats` text like "Barrel part for X".
      // The real numeric deltas live in PARTS_STATS_DATA (computed by formatPartsStatsData()).
      var legendaryFromData = '';
      if (isLegendary) {
        legendaryFromData = formatPartsStatsData(p);
        // Some legendary entries carry only human-readable `code`, while the numeric deltas
        // exist for the sibling non-legendary part with the same `idRaw`.
        if (!legendaryFromData) {
          try {
            var idRaw = q(p && (p.idRaw || p.idraw || ''));
            if (idRaw) {
              var all = (window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS))
                ? window.STX_DATASET.ALL_PARTS : [];
              for (var fi = 0; fi < all.length; fi++) {
                var sib = all[fi];
                if (!sib) continue;
                var sibId = q(sib.idRaw || sib.idraw || '');
                if (sibId !== idRaw) continue;
                if (/legendary\s*perk/i.test(String(sib.partType || sib.kind || ''))) continue;
                legendaryFromData = formatPartsStatsData(sib);
                if (legendaryFromData) break;
              }
            }
          } catch (_) {}
        }
      }
      if (isLegendary && effectsStr && !/^\s*$/.test(effectsStr)) {
        if (legendaryFromData) return (effectsStr + ' | ' + legendaryFromData).substring(0, 170);
        if (statsStr && effectsStr && statsStr !== effectsStr) return (effectsStr + ' – ' + statsStr).substring(0, 150);
        if (effectsStr) return effectsStr.substring(0, 120);
      }
      if (statsStr) return statsStr.substring(0, 150);
      if (legendaryFromData) return legendaryFromData;
      var fromData = formatPartsStatsData(p);
      if (fromData) return fromData;
    } catch (_) {}
    return '';
  }

  /**
   * Build tooltip for a part object (from STX_DATASET etc.)
   * Includes: numeric ID, spawn ID, part name, stats/effects (what it does).
   * For legendary perks, prefers effects over generic "Barrel part for X" stats.
   * @param {Object} part - Part with idRaw, name, legendaryName, code, stats, effects, etc.
   * @returns {string} Tooltip text
   */
  function partTooltipText(part) {
    if (!part) return '';
    var idRaw = q(part.idRaw || part.idraw || part.rawId || '');
    if (!idRaw && part.family != null && part.id != null) idRaw = part.family + ':' + part.id;
    if (!idRaw && part.id != null) idRaw = String(part.id);
    var name = q(part.name || part.legendaryName || part.label || '');
    var code = q((part.code || part.spawnCode || part.importCode || '').replace(/^"+|"+$/g, ''));
    var stats = shortStats(part);
    var parts = [];
    if (idRaw) parts.push('Numeric ID: ' + idRaw);
    if (code) parts.push('Spawn ID: ' + code);
    if (name) parts.push('Part: ' + name);
    var cat = q(part.category || '');
    var mfr = q(part.manufacturer || part.mfr || '');
    var ptype = q(part.partType || part.kind || '');
    var it = q(part.itemType || '');
    var wt = q(part.weaponType || '');
    var ctx = [];
    if (cat) ctx.push('Category: ' + cat);
    if (mfr) ctx.push('Mfr: ' + mfr);
    if (ptype) ctx.push('Part type: ' + ptype);
    if (it) ctx.push('Item type: ' + it);
    if (wt && wt !== it) ctx.push('Weapon type: ' + wt);
    if (ctx.length) parts.push(ctx.join(' · '));
    if (stats) parts.push('Effect/Stats: ' + stats);
    return parts.join(' | ') || '';
  }

  /**
   * Build tooltip for skin/camo option (value is code like {9:[85 90]} or Cosmetics_Weapon_Mat01)
   * @param {string} value - Option value (code)
   * @param {string} label - Option label (name)
   * @returns {string} Tooltip text
   */
  function skinTooltipText(value, label) {
    var v = q(value);
    var l = q(label);
    if (!v && !l) return '';
    var parts = [];
    if (v) parts.push('ID: ' + v);
    if (l && l !== v) parts.push('Name: ' + l);
    return parts.join(' | ') || '';
  }

  /**
   * Unified: accepts part object or { value, label } for skins.
   */
  function formatPartTooltip(obj) {
    if (!obj) return '';
    if (obj.idRaw != null || obj.idraw != null || obj.family != null || (obj.code && obj.name)) {
      return partTooltipText(obj);
    }
    return skinTooltipText(obj.value, obj.label || obj.name);
  }

  window.partTooltipText = partTooltipText;
  window.skinTooltipText = skinTooltipText;
  window.formatPartTooltip = formatPartTooltip;
})();
