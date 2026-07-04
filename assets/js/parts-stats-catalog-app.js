/**
 * Dynamic BL4 parts stats catalog — reads STX_DATASET + PARTS_STATS_DATA at runtime
 * (replaces the old static HTML bake that only listed ~800 parts).
 */
(function () {
  'use strict';

  var PAGE_SIZE = 120;
  var allEntries = [];
  var filtered = [];
  var rendered = 0;
  var activeStatMatchers = null;
  var activeStatSearch = false;
  var activeStatLabel = '';

  /** Search terms → stat_field / bucket substrings (longest match wins for sort). */
  var STAT_SEARCH_ALIASES = {
    spread: ['spread_scale', 'spread_value', 'weapon_spread', 'accuracy'],
    accuracy: ['accuracy_scale', 'maxaccuracy_scale', 'spread_scale', 'accuracy'],
    recoil: ['recoil_scale', 'accimpulse_scale', 'ads'],
    sway: ['sway_scale', 'ads'],
    zoom: ['zoomtime_scale', 'zoomduration_scale', 'ads'],
    ads: ['zoomtime_scale', 'zoomduration_scale', 'sway_scale', 'recoil_scale', 'equiptime_scale', 'putdowntime_scale', 'ads'],
    handling: ['zoomtime_scale', 'zoomduration_scale', 'sway_scale', 'recoil_scale', 'equiptime_scale', 'putdowntime_scale', 'ads'],
    damage: ['damage_scale', 'damage_value', 'damage'],
    crit: ['critdamage_add', 'critical_damage', 'crit'],
    firerate: ['firerate_scale', 'firerate_value', 'firerate'],
    reload: ['reloadtime_scale', 'reloadtime_value', 'thrownreloadtime_value', 'reload_time', 'reload'],
    elemental: ['statuschance_scale', 'statusdamage_scale', 'elementaldamage_scale', 'elementalchance_scale', 'elemental'],
    status: ['statuschance_scale', 'statusdamage_scale', 'elemental'],
    projectile: ['projpershot_scale', 'projectilespershot_value', 'projectiles'],
    mag: ['maxloadedammo_value', 'heatimpulse_value', 'ammo_mag'],
    ammo: ['maxloadedammo_value', 'heatimpulse_value', 'ammo_mag'],
    shield: ['shield_capacity', 'shield_regen', 'shield_recharge', 'shield_segments', 'ammo_mag'],
    capacity: ['shield_capacity', 'capacity', 'ammo_mag']
  };

  /** Same inverted-scale idea as cc-build-stats-rebuild (lower raw = better handling). */
  var INVERTED_SCALE_FIELDS = {
    spread_scale: 1,
    spread_value: 1,
    maxaccuracy_scale: 1,
    accuracy_scale: 1,
    recoil_scale: 1,
    accimpulse_scale: 1,
    sway_scale: 1,
    equiptime_scale: 1,
    putdowntime_scale: 1,
    zoomtime_scale: 1,
    zoomduration_scale: 1
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function normCode(c) {
    return String(c || '')
      .trim()
      .replace(/^"+|"+$/g, '')
      .toLowerCase();
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getPartCodes(p) {
    var codes = [];
    var code = String(p.code || p.spawnCode || p.importCode || '')
      .replace(/^"+|"+$/g, '')
      .trim();
    if (code) codes.push(code);
    var idRaw = String(p.idRaw || p.idraw || '').trim();
    if (idRaw) codes.push(idRaw);
    if (p.family != null && p.id != null) codes.push(p.family + ':' + p.id);
    return codes;
  }

  function getStatsForPart(part) {
    var data = window.PARTS_STATS_DATA;
    if (!data || !part) return null;
    var codes = getPartCodes(part);
    for (var i = 0; i < codes.length; i++) {
      var c = String(codes[i] || '').trim();
      if (!c) continue;
      var lo = normCode(c);
      if (data.by_id_raw && data.by_id_raw[c]) return data.by_id_raw[c];
      if (data.by_id_raw && data.by_id_raw[lo]) return data.by_id_raw[lo];
      if (data.by_part_code && data.by_part_code[lo]) return data.by_part_code[lo];
      if (data.by_code_suffix && data.by_code_suffix[lo]) return data.by_code_suffix[lo];
      var suffix = lo.indexOf('.') >= 0 ? lo.split('.').pop() : lo;
      if (data.by_code_suffix && data.by_code_suffix[suffix]) return data.by_code_suffix[suffix];
    }
    return null;
  }

  function inferFamily(code) {
    var c = normCode(code);
    var dot = c.indexOf('.');
    return dot > 0 ? c.slice(0, dot) : c || 'unknown';
  }

  function inferMfr(code, part) {
    var m = String((part && part.manufacturer) || '').trim().toLowerCase();
    if (m) {
      if (m.indexOf('daedalus') === 0) return 'dad';
      if (m.indexOf('jakobs') === 0) return 'jak';
      if (m.indexOf('maliwan') === 0) return 'mal';
      if (m.indexOf('tediore') === 0) return 'ted';
      if (m.indexOf('torgue') === 0) return 'tor';
      if (m.indexOf('vladof') === 0) return 'vla';
      if (m.indexOf('order') === 0) return 'ord';
      if (m.indexOf('borg') === 0) return 'borg';
      if (m.indexOf('ripper') === 0) return 'bor';
      return m.slice(0, 12).replace(/\s+/g, '_');
    }
    var fam = inferFamily(code);
    var hit = fam.match(/^([a-z]{3})_/);
    return hit ? hit[1] : 'unknown';
  }

  function inferSlot(code) {
    return /\.comp_/i.test(String(code || '')) ? 'comp' : 'part';
  }

  function statDedupeKey(row) {
    var canon = canonicalStatField(row.stat_field);
    var comb = String(row.combine || '').trim().toLowerCase() || 'mul';
    var val = Number(row.stat_value);
    var valKey = Number.isFinite(val) ? String(val) : String(row.stat_value);
    return canon + '\x00' + comb + '\x00' + valKey;
  }

  function preferStatRow(a, b) {
    var ca = canonicalStatField(a.stat_field);
    var fa = String(a.stat_field || '').toLowerCase();
    var fb = String(b.stat_field || '').toLowerCase();
    if (fa === ca && fb !== ca) return a;
    if (fb === ca && fa !== ca) return b;
    return a;
  }

  function dedupeStatRows(rows) {
    var map = Object.create(null);
    var order = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (!r) continue;
      var key = statDedupeKey(r);
      if (!map[key]) {
        map[key] = r;
        order.push(key);
      } else {
        map[key] = preferStatRow(map[key], r);
      }
    }
    var out = [];
    for (var j = 0; j < order.length; j++) out.push(map[order[j]]);
    return out;
  }

  function buildDisplayGroups(rows) {
    var deduped = dedupeStatRows(rows);
    var groups = [];
    var index = Object.create(null);
    for (var i = 0; i < deduped.length; i++) {
      var r = deduped[i];
      var gk =
        canonicalStatField(r.stat_field) + '\x00' + String(r.combine || '').trim().toLowerCase();
      if (!index[gk]) {
        var g = {
          field: canonicalStatField(r.stat_field),
          combine: r.combine,
          bucket: r.bucket,
          rows: []
        };
        index[gk] = groups.length;
        groups.push(g);
      }
      groups[index[gk]].rows.push(r);
    }
    return groups;
  }

  function groupMaxImpact(group, matchers) {
    if (!group || !group.rows || !group.rows.length) return 0;
    var best = 0;
    for (var i = 0; i < group.rows.length; i++) {
      var row = group.rows[i];
      if (matchers && !rowMatchesStatMatchers(row, matchers)) continue;
      var imp = scaleImpact(row);
      if (imp > best) best = imp;
    }
    return best;
  }

  function isSimpleView() {
    var el = byId('simpleView');
    return !el || el.checked;
  }

  function simplePercentFromRow(row) {
    if (!row) return null;
    var comb = String(row.combine || '').trim().toLowerCase() || 'mul';
    var val = statNumericValue(row);
    if (val === null) return null;
    var field = canonicalStatField(row.stat_field);
    if (comb === 'add') return val * 100;
    if (comb === 'mul') {
      var effectiveMult = val;
      if (field === 'damage_scale' && val > 0 && val < 0.5) effectiveMult = 1 + val;
      else if (INVERTED_SCALE_FIELDS[field] && val !== 0) effectiveMult = 1 / val;
      return (effectiveMult - 1) * 100;
    }
    return null;
  }

  function formatPct(pct) {
    var rounded = Math.round(pct);
    if (Math.abs(pct - rounded) < 0.45) return (pct >= 0 ? '+' : '') + rounded + '%';
    return (pct >= 0 ? '+' : '') + (Math.round(pct * 10) / 10) + '%';
  }

  function summarizeGroupSimple(group) {
    var rows = group.rows || [];
    if (!rows.length) return null;
    var label = statLabel(group.field);
    var verb = label.toLowerCase();
    var pcts = [];
    var adds = [];
    for (var i = 0; i < rows.length; i++) {
      var p = simplePercentFromRow(rows[i]);
      if (p !== null) pcts.push(p);
      else if (String(rows[i].combine || '').trim().toLowerCase() === 'add') {
        var av = statNumericValue(rows[i]);
        if (av !== null) adds.push(av * 100);
      }
    }
    if (pcts.length) {
      pcts.sort(function (a, b) { return a - b; });
      var lo = pcts[0];
      var hi = pcts[pcts.length - 1];
      if (rows.length > 1 && lo !== hi) {
        return {
          title: label,
          line: formatPct(lo) + ' to ' + formatPct(hi) + ' ' + verb,
          detail: rows.length + ' different modes in game data — compare using the range, not the sum.',
          multi: true
        };
      }
      return { title: label, line: formatPct(lo) + ' ' + verb, detail: '', multi: false };
    }
    if (adds.length) {
      adds.sort(function (a, b) { return a - b; });
      var alo = adds[0];
      var ahi = adds[adds.length - 1];
      if (adds.length > 1 && alo !== ahi) {
        return {
          title: label,
          line: formatPct(alo) + ' to ' + formatPct(ahi) + ' ' + verb,
          detail: rows.length + ' contexts in game data.',
          multi: true
        };
      }
      return { title: label, line: formatPct(alo) + ' ' + verb, detail: '', multi: false };
    }
    if (rows.length === 1 && String(rows[0].combine || '').trim().toLowerCase() === 'value') {
      var field = canonicalStatField(rows[0].stat_field);
      var val = statNumericValue(rows[0]);
      if (val === null) return null;
      if (field === 'armorsegments' || field === 'capacity' || field === 'shield_capacity') {
        return {
          title: label,
          line: formatValueOffsetEffect(field, val).replace(/ — .*/, ''),
          detail: 'Internal engine offset — see technical table for raw value.',
          multi: false
        };
      }
    }
    return null;
  }

  function buildSimpleSummary(groups) {
    var highlights = [];
    var offsetCount = 0;
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      var h = summarizeGroupSimple(g);
      if (h) {
        h.bucket = g.bucket || 'misc';
        h.impact = groupMaxImpact(g, null);
        highlights.push(h);
      } else {
        var rows = g.rows || [];
        for (var j = 0; j < rows.length; j++) {
          if (String(rows[j].combine || '').trim().toLowerCase() === 'value') offsetCount++;
        }
      }
    }
    highlights.sort(function (a, b) {
      return Math.abs(b.impact || 0) - Math.abs(a.impact || 0);
    });
    return { highlights: highlights, offsetCount: offsetCount };
  }

  function chipClassForHighlight(h) {
    if (/^\-/.test(h.line)) return 'stat-chip stat-chip--down';
    if (/^\+/.test(h.line)) return 'stat-chip stat-chip--up';
    return 'stat-chip stat-chip--' + String(h.bucket || 'misc').replace(/[^a-z0-9_]/gi, '_');
  }

  function formatSummaryCount(entry, simple) {
    if (!entry.statCount) return 'no stats';
    if (!simple) return formatStatCountLabel(entry);
    var n = entry.simpleHighlights ? entry.simpleHighlights.length : 0;
    if (!n) return entry.statCount + ' data rows';
    return n + ' effect' + (n === 1 ? '' : 's');
  }

  function formatStatCountLabel(entry) {
    if (!entry.statCount) return 'no stats';
    if (entry.uniqueFieldCount >= entry.statCount) {
      return entry.statCount + ' stat' + (entry.statCount === 1 ? '' : 's');
    }
    var label = entry.uniqueFieldCount + ' fields · ' + entry.statCount + ' rows';
    if (entry.dedupedCount < entry.statCount) {
      label += ' <span class="count-subtle">(' + entry.dedupedCount + ' unique)</span>';
    }
    return label;
  }

  function renderGroupedStatRow(group, matchers) {
    var rows = group.rows || [];
    if (!rows.length) return null;
    var isMatch = matchers && rows.some(function (r) { return rowMatchesStatMatchers(r, matchers); });
    var tr = document.createElement('tr');
    if (rows.length > 1) tr.className = 'stat-group-row';
    if (isMatch) tr.className = (tr.className ? tr.className + ' ' : '') + 'stat-row-match';

    if (rows.length === 1) {
      var r = rows[0];
      tr.innerHTML =
        '<td>' +
        formatStatNameCell(r) +
        "</td><td class='num'>" +
        esc(formatRawValue(r)) +
        '</td><td>' +
        esc(BUCKET_LABELS[r.bucket] || r.bucket || '—') +
        '</td><td>' +
        esc(COMBINE_LABELS[String(r.combine || '').toLowerCase()] || r.combine || '—') +
        "</td><td>" +
        esc(formatStatEffect(r)) +
        '</td>';
      return tr;
    }

    var label = statLabel(group.field);
    var valuesHtml = rows
      .map(function (r) {
        return '<span>' + esc(formatRawValue(r)) + '</span>';
      })
      .join('');
    var effectsHtml = rows
      .map(function (r) {
        return '<span>' + esc(formatStatEffect(r)) + '</span>';
      })
      .join('');
    tr.innerHTML =
      '<td><strong>' +
      esc(label) +
      '</strong><span class="stat-group-badge" title="Different balance contexts / fire modes in game data — not additive duplicates">' +
      rows.length +
      ' contexts</span></td>' +
      "<td class='num stat-multi-val'>" +
      valuesHtml +
      '</td><td>' +
      esc(BUCKET_LABELS[group.bucket] || group.bucket || '—') +
      '</td><td>' +
      esc(COMBINE_LABELS[String(group.combine || '').toLowerCase()] || group.combine || '—') +
      "</td><td class='stat-multi-effect'>" +
      effectsHtml +
      '</td>';
    return tr;
  }

  function countUniqueCanonicalFields(rows) {
    var seen = Object.create(null);
    var n = 0;
    for (var i = 0; i < rows.length; i++) {
      var c = canonicalStatField(rows[i] && rows[i].stat_field);
      if (!c || seen[c]) continue;
      seen[c] = true;
      n++;
    }
    return n;
  }

  function summarizeRows(rows) {
    var buckets = [];
    var fields = [];
    var minV = Infinity;
    var maxV = -Infinity;
    var seenB = Object.create(null);
    var seenF = Object.create(null);
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (!r) continue;
      var b = String(r.bucket || '').trim();
      var f = String(r.stat_field || '').trim();
      if (b && !seenB[b]) {
        seenB[b] = true;
        buckets.push(b);
      }
      if (f && !seenF[f]) {
        seenF[f] = true;
        fields.push(f);
      }
      var v = Number(r.stat_value);
      if (Number.isFinite(v)) {
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
    }
    var range = '';
    if (minV !== Infinity && maxV !== -Infinity) {
      range = minV === maxV ? String(minV) : minV + ' to ' + maxV;
    }
    return { buckets: buckets, fields: fields, range: range };
  }

  /** Strip Nexus row-hash suffixes: capacity_66_d8c5fd80… → capacity */
  function canonicalStatField(field) {
    var f = String(field || '').trim().toLowerCase();
    var m = f.match(/^([a-z][a-z0-9]*?)_\d+_[0-9a-f]{8,}$/i);
    if (m) return m[1];
    m = f.match(/^([a-z][a-z0-9]*?)_[0-9a-f]{8,}$/i);
    if (m) return m[1];
    return f;
  }

  var STAT_LABELS = {
    capacity: 'Shield capacity',
    delay: 'Recharge delay',
    rechargerate: 'Recharge rate',
    armorsegments: 'Armor shield segments',
    armordamagereduction: 'Armor damage reduction',
    armorpassthroughpercent: 'Armor damage passthrough',
    damage_scale: 'Damage',
    damage_value: 'Damage (flat)',
    critdamage_add: 'Critical hit damage',
    firerate_scale: 'Fire rate',
    reloadtime_scale: 'Reload time',
    accuracy_scale: 'Accuracy',
    spread_scale: 'Spread',
    maxaccuracy_scale: 'Max accuracy',
    recoil_scale: 'Recoil',
    sway_scale: 'Sway',
    zoomtime_scale: 'Zoom speed',
    statuschance_scale: 'Status effect chance',
    statusdamage_scale: 'Status effect damage',
    maxloadedammo_value: 'Magazine size',
    modifier: 'Modifier',
    duration: 'Duration',
    shield_capacity: 'Shield capacity',
    shield_regen_rate: 'Shield recharge rate',
    shield_regen_delay: 'Shield recharge delay',
    shield_recharge_rate: 'Shield recharge rate',
    shield_recharge_delay: 'Shield recharge delay',
    shield_segments: 'Shield segments'
  };

  var BUCKET_LABELS = {
    damage: 'Damage',
    crit: 'Critical hit',
    accuracy: 'Accuracy',
    ads: 'Handling / ADS',
    firerate: 'Fire rate',
    reload_time: 'Reload',
    elemental: 'Elemental',
    ammo_mag: 'Magazine / shield',
    projectiles: 'Projectiles',
    misc: 'Other'
  };

  var COMBINE_LABELS = {
    value: 'Engine offset',
    mul: 'Multiplier (×)',
    add: 'Additive (+)'
  };

  function compactStatQuery(s) {
    return String(s || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_\-/.]+/g, '');
  }

  function queryMatchesText(hay, n, nCompact) {
    var h = String(hay || '').toLowerCase();
    var hc = h.replace(/[\s_\-/.]+/g, '');
    return (
      h === n ||
      hc === nCompact ||
      h.indexOf(n) !== -1 ||
      n.indexOf(h) !== -1 ||
      hc.indexOf(nCompact) !== -1 ||
      nCompact.indexOf(hc) !== -1
    );
  }

  function addStatAliasMatchers(matchers, key) {
    matchers[key] = true;
    var aliases = STAT_SEARCH_ALIASES[key];
    if (aliases) {
      for (var j = 0; j < aliases.length; j++) matchers[aliases[j]] = true;
    }
  }

  function resolveStatSearch(needle) {
    var n = String(needle || '').trim().toLowerCase();
    if (!n || n.length < 2) return null;
    var nCompact = compactStatQuery(n);
    var matchers = Object.create(null);
    var isStatSearch = false;
    var label = n;

    matchers[n] = true;
    if (nCompact !== n) matchers[nCompact] = true;

    var keys = Object.keys(STAT_SEARCH_ALIASES);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (
        queryMatchesText(key, n, nCompact) ||
        queryMatchesText(key.replace(/_/g, ' '), n, nCompact)
      ) {
        isStatSearch = true;
        label = BUCKET_LABELS[key] || STAT_LABELS[key] || humanizeCanonical(key);
        addStatAliasMatchers(matchers, key);
      }
    }

    var labelKeys = Object.keys(STAT_LABELS);
    for (var li = 0; li < labelKeys.length; li++) {
      var lk = labelKeys[li];
      if (queryMatchesText(STAT_LABELS[lk], n, nCompact)) {
        isStatSearch = true;
        label = STAT_LABELS[lk];
        matchers[lk] = true;
        matchers[canonicalStatField(lk)] = true;
      }
    }

    var bucketKeys = Object.keys(BUCKET_LABELS);
    for (var bi = 0; bi < bucketKeys.length; bi++) {
      var bk = bucketKeys[bi];
      if (queryMatchesText(BUCKET_LABELS[bk], n, nCompact)) {
        isStatSearch = true;
        label = BUCKET_LABELS[bk];
        matchers[bk] = true;
        addStatAliasMatchers(matchers, bk);
      }
    }

    if (/_scale$|_value$|_add$/.test(n)) {
      matchers[n] = true;
      isStatSearch = true;
    }

    var list = Object.keys(matchers);
    if (!list.length) return null;
    return { matchers: list, isStatSearch: isStatSearch, label: label, query: n };
  }

  function rowMatchesStatMatchers(row, matchers) {
    if (!row || !matchers || !matchers.length) return false;
    var field = String(row.stat_field || '').toLowerCase();
    var canon = canonicalStatField(row.stat_field);
    var bucket = String(row.bucket || '').toLowerCase();
    var label = statLabel(row.stat_field).toLowerCase();
    for (var i = 0; i < matchers.length; i++) {
      var m = matchers[i];
      if (!m) continue;
      var mCompact = compactStatQuery(m);
      if (
        field.indexOf(m) !== -1 ||
        canon.indexOf(m) !== -1 ||
        bucket.indexOf(m) !== -1 ||
        label.indexOf(m) !== -1 ||
        queryMatchesText(label, m, mCompact) ||
        queryMatchesText(canon, m, mCompact)
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Raw datatable offsets (combine "value") — not the same as item-card % text.
   * Game files apply these via attribute effects; UI often uses separate calc attributes.
   */
  var ENGINE_OFFSET_NOTES = {
    capacity:
      'Shield init capacity cell (Shield_Rarity_Init / Shield_Augment_Init). Rarity tiers step by +0.1 above Common in data.',
    shield_capacity: 'Same as capacity — shield_capacity attribute layer.',
    delay:
      'Shield recharge delay offset. Negative values shorten delay (recharge starts sooner).',
    shield_regen_delay: 'Same as delay — shield_regen_delay attribute.',
    shield_recharge_delay: 'Same as delay — shield_regen_delay attribute.',
    rechargerate: 'Shield recharge rate offset. Positive = faster recharge.',
    shield_regen_rate: 'Same as rechargerate — shield_regen_rate attribute.',
    shield_recharge_rate: 'Same as rechargerate — shield_regen_rate attribute.',
    armordamagereduction:
      'Armor shield damage-reduction offset (not the proc % on Sturdy-style augments).',
    armorpassthroughpercent:
      'Internal passthrough balance offset — not a direct card %. Do not multiply by 100.',
    armorsegments: 'Armor segment count offset (integer when non-zero).',
    modifier: 'Generic modifier offset from balance data.',
    duration: 'Duration offset from balance data.',
    weapon_burst_fire_delay: 'Burst fire delay offset (seconds-scale engine value).'
  };

  function statNumericValue(row) {
    if (!row) return null;
    var v = row.stat_value;
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function formatRawValue(row) {
    var n = statNumericValue(row);
    if (n === null) return '—';
    if (Math.abs(n) >= 1000 || (Math.abs(n) > 0 && Math.abs(n) < 0.0001)) return String(n);
    if (Number.isInteger(n)) return String(n);
    return String(Math.round(n * 10000) / 10000);
  }

  function humanizeCanonical(field) {
    return String(field || '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/percent/gi, '%')
      .replace(/\b\w/g, function (c) { return c.toUpperCase(); })
      .trim();
  }

  function statLabel(field) {
    var canon = canonicalStatField(field);
    return STAT_LABELS[canon] || humanizeCanonical(canon);
  }

  function formatStatNameCell(row) {
    var label = statLabel(row.stat_field);
    var canon = canonicalStatField(row.stat_field);
    var raw = String(row.stat_field || '');
    if (raw && raw.toLowerCase() !== canon) {
      return '<strong>' + esc(label) + '</strong><div class="stat-tech-id">' + esc(raw) + '</div>';
    }
    return '<strong>' + esc(label) + '</strong>';
  }

  function formatSignedRawOffset(val) {
    var n = Number(val);
    if (!Number.isFinite(n)) return String(val);
    return (n > 0 ? '+' : '') + formatRawValue({ stat_value: n });
  }

  /** Human-readable effect for engine offsets (combine "value") — raw numbers only unless count-like. */
  function formatValueOffsetEffect(field, val) {
    if (val === 0) return 'Baseline (0) on this field';
    if (field === 'armorsegments') {
      return (
        (val > 0 ? '+' : '') +
        val +
        ' armor segment' +
        (Math.abs(val) === 1 ? '' : 's')
      );
    }
    var line = 'Offset ' + formatSignedRawOffset(val);
    var note = ENGINE_OFFSET_NOTES[field];
    if (note) line += ' — ' + note;
    else line += ' — engine datatable offset (not a card % unless combine is mul/add)';
    return line;
  }

  function humanizeField(field) {
    return statLabel(field);
  }

  function formatStatEffect(row) {
    if (!row) return '—';
    var val = statNumericValue(row);
    if (val === null) return 'Not set on this part';
    var comb = String(row.combine || '').trim().toLowerCase() || 'mul';
    var field = canonicalStatField(row.stat_field);
    if (comb === 'value') {
      return formatValueOffsetEffect(field, val);
    }
    if (comb === 'add') {
      return (val >= 0 ? '+' : '') + (val * 100).toFixed(1) + '% ' + statLabel(row.stat_field).toLowerCase();
    }
    if (comb === 'mul') {
      var label = statLabel(row.stat_field);
      var effectiveMult = val;
      if (field === 'damage_scale' && val > 0 && val < 0.5) effectiveMult = 1 + val;
      else if (INVERTED_SCALE_FIELDS[field] && val !== 0) effectiveMult = 1 / val;
      var pctVsNorm = (effectiveMult - 1) * 100;
      if (INVERTED_SCALE_FIELDS[field]) {
        return '×' + val + ' scale — ' + (pctVsNorm >= 0 ? '+' : '') + pctVsNorm.toFixed(1) + '% better (lower × is better)';
      }
      if (field === 'damage_scale' && val > 0 && val < 0.5) {
        return '×' + val + ' fractional layer — effective ×' + effectiveMult.toFixed(4) + ' (' +
          (pctVsNorm >= 0 ? '+' : '') + pctVsNorm.toFixed(1) + '% vs normal)';
      }
      return '×' + val + ' scale — ' + (pctVsNorm >= 0 ? '+' : '') + pctVsNorm.toFixed(1) + '% vs normal (×1.0000 = neutral)';
    }
    return String(val);
  }

  /** Magnitude of scale change vs neutral (1.0 mul / 0 add) — used to rank stat searches. */
  function scaleImpact(row) {
    if (!row) return 0;
    var val = Number(row.stat_value);
    if (!Number.isFinite(val)) return 0;
    var comb = String(row.combine || '').trim().toLowerCase();
    var field = canonicalStatField(row.stat_field);
    if (comb === 'value') return 0;
    if (comb === 'add' || comb === '') return Math.abs(val);
    if (comb === 'mul') {
      if (field === 'damage_scale' && val > 0 && val < 0.5) return Math.abs(val);
      if (INVERTED_SCALE_FIELDS[field] && val !== 0) return Math.abs(1 / val - 1);
      return Math.abs(val - 1);
    }
    return Math.abs(val);
  }

  function bestStatImpact(entry, matchers) {
    if (!entry || !matchers || !entry.stats || !entry.stats.length) return 0;
    var best = 0;
    var bestRow = null;
    for (var i = 0; i < entry.stats.length; i++) {
      var row = entry.stats[i];
      if (!rowMatchesStatMatchers(row, matchers)) continue;
      var imp = scaleImpact(row);
      if (imp > best) {
        best = imp;
        bestRow = row;
      }
    }
    entry._sortImpact = best;
    entry._sortRow = bestRow;
    return best;
  }

  function formatImpactLabel(row, impact) {
    if (!row) return '';
    if (!impact) return formatStatEffect(row);
    var val = Number(row.stat_value);
    var comb = String(row.combine || '').trim() || 'mul';
    var field = String(row.stat_field || '').trim();
    var pct = Math.round(impact * 1000) / 10;
    return field + ' ' + val + ' (' + comb + ', Δ' + pct + '%)';
  }

  function buildEntry(part) {
    var code = String(part.code || part.spawnCode || part.importCode || '')
      .replace(/^"+|"+$/g, '')
      .trim();
    var idRaw = String(part.idRaw || part.idraw || '').trim();
    var rows = getStatsForPart(part);
    var stats = Array.isArray(rows) ? rows : [];
    var sum = summarizeRows(stats);
    var deduped = dedupeStatRows(stats);
    var displayGroups = buildDisplayGroups(stats);
    var simpleSummary = buildSimpleSummary(displayGroups);
    var family = inferFamily(code);
    var mfr = inferMfr(code, part);
    var slot = inferSlot(code);
    var category = String(part.category || part.itemType || 'Other').trim();
    var variant = code.indexOf('.') >= 0 ? code.split('.').pop() : code;
    var name = String(part.name || part.legendaryName || '').trim();
    var search = [
      code,
      idRaw,
      name,
      category,
      family,
      slot,
      mfr,
      variant,
      sum.buckets.join(' '),
      sum.fields.join(' '),
      simpleSummary.highlights.map(function (h) { return h.title + ' ' + h.line; }).join(' ')
    ]
      .join(' ')
      .toLowerCase();

    return {
      code: code || idRaw || '(unknown)',
      idRaw: idRaw,
      name: name,
      category: category,
      family: family,
      mfr: mfr,
      slot: slot,
      variant: variant,
      stats: stats,
      statCount: stats.length,
      dedupedCount: deduped.length,
      uniqueFieldCount: countUniqueCanonicalFields(stats),
      displayGroups: displayGroups,
      displayGroupCount: displayGroups.length,
      simpleHighlights: simpleSummary.highlights,
      offsetCount: simpleSummary.offsetCount,
      buckets: sum.buckets,
      fields: sum.fields,
      range: sum.range,
      search: search
    };
  }

  function collectDatasetParts() {
    var ds = window.STX_DATASET;
    var all = ds && Array.isArray(ds.ALL_PARTS) ? ds.ALL_PARTS : [];
    var seen = Object.create(null);
    var out = [];
    for (var i = 0; i < all.length; i++) {
      var p = all[i];
      if (!p) continue;
      var key = normCode(p.code) + '\x00' + String(p.idRaw || p.idraw || '').trim();
      if (seen[key]) continue;
      seen[key] = true;
      out.push(p);
    }
    return out;
  }

  function fillSelect(sel, values, labelFn) {
    if (!sel) return;
    var current = sel.value;
    var frag = document.createDocumentFragment();
    var opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = sel.id === 'cat' ? 'All categories' : sel.id === 'mfr' ? 'All manufacturers' : 'All slots';
    frag.appendChild(opt0);
    var arr = values.slice().sort();
    for (var i = 0; i < arr.length; i++) {
      var o = document.createElement('option');
      o.value = arr[i];
      o.textContent = labelFn ? labelFn(arr[i]) : arr[i];
      frag.appendChild(o);
    }
    sel.innerHTML = '';
    sel.appendChild(frag);
    if (current && arr.indexOf(current) >= 0) sel.value = current;
  }

  function appendTechnicalSection(parent, entry, opts) {
    var expanded = !opts || opts.expanded !== false;
    var rowLabel =
      entry.statCount +
      ' rows' +
      (entry.displayGroupCount < entry.statCount ? ', ' + entry.displayGroupCount + ' grouped' : '');
    var container = document.createElement(expanded ? 'div' : 'details');
    container.className = expanded ? 'tech-section' : 'tech-block';
    if (!expanded) {
      container.innerHTML = '<summary>Raw engine data (' + rowLabel + ')</summary>';
    } else {
      var heading = document.createElement('h3');
      heading.className = 'tech-heading';
      heading.textContent = 'Raw engine data (' + rowLabel + ')';
      container.appendChild(heading);
    }

    var grid = document.createElement('div');
    grid.className = 'meta-grid';
    grid.innerHTML =
      (entry.idRaw ? '<div><b>Numeric ID:</b> <span class="mono">' + esc(entry.idRaw) + '</span></div>' : '') +
      '<div><b>Variant:</b> <span class="mono">' + esc(entry.variant) + '</span></div>' +
      '<div><b>Category:</b> ' + esc(entry.category) + '</div>' +
      '<div><b>Unique fields:</b> ' + esc(String(entry.uniqueFieldCount || 0)) + '</div>' +
      '<div><b>Engine rows:</b> ' + entry.statCount + '</div>';
    container.appendChild(grid);

    var table = document.createElement('table');
    table.innerHTML =
      '<thead><tr><th>Stat</th><th>Value</th><th>Category</th><th>How applied</th><th>What it means</th></tr></thead>';
    var tbody = document.createElement('tbody');
    var groups = entry.displayGroups || buildDisplayGroups(entry.stats);
    if (activeStatMatchers) {
      groups.sort(function (a, b) {
        return groupMaxImpact(b, activeStatMatchers) - groupMaxImpact(a, activeStatMatchers);
      });
    }
    for (var gi = 0; gi < groups.length; gi++) {
      var tr = renderGroupedStatRow(groups[gi], activeStatMatchers);
      if (tr) tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    container.appendChild(table);
    parent.appendChild(container);
  }

  function formatSortImpactBadge(entry) {
    if (!entry || !entry._sortRow || !entry._sortImpact) return '';
    var pct = simplePercentFromRow(entry._sortRow);
    var text =
      pct !== null
        ? formatPct(pct)
        : 'Δ' + (Math.round(entry._sortImpact * 1000) / 10) + '%';
    var prefix = activeStatSearch && activeStatLabel ? esc(activeStatLabel) + ' ' : '';
    return (
      "<span class='impact-badge' title='" +
      esc(formatImpactLabel(entry._sortRow, entry._sortImpact)) +
      "'> · " +
      prefix +
      esc(text) +
      '</span>'
    );
  }

  function sortedSimpleHighlights(entry) {
    var highlights = entry.simpleHighlights ? entry.simpleHighlights.slice() : [];
    if (!highlights.length) return highlights;
    if (activeStatSearch && activeStatLabel) {
      var labelCompact = compactStatQuery(activeStatLabel);
      highlights.sort(function (a, b) {
        var am = queryMatchesText(a.title, activeStatLabel, labelCompact) ? Math.abs(a.impact || 0) : -1;
        var bm = queryMatchesText(b.title, activeStatLabel, labelCompact) ? Math.abs(b.impact || 0) : -1;
        return bm - am;
      });
    }
    return highlights;
  }

  function renderCard(entry) {
    var simple = isSimpleView();
    var d = document.createElement('details');
    d.className = 'part-card';
    d.dataset.mfr = entry.mfr;
    d.dataset.slot = entry.slot;
    d.dataset.cat = entry.category;
    d.dataset.search = entry.search;
    d.dataset.hasStats = entry.statCount > 0 ? '1' : '0';

    var summary = document.createElement('summary');
    var summaryBits = [];
    if (entry.name) summaryBits.push("<span class='part-name'>" + esc(entry.name) + '</span>');
    summaryBits.push("<span class='code'>" + esc(entry.code) + '</span>');
    if (entry.idRaw && !simple) {
      summaryBits.push("<span class='meta mono'>" + esc(entry.idRaw) + '</span>');
    }
    summaryBits.push(
      "<span class='meta'>" +
        esc(entry.mfr) +
        ' · ' +
        esc(entry.category) +
        (simple || !entry.name ? ' · ' + esc(entry.slot) : '') +
        '</span>'
    );
    summaryBits.push(
      "<span class='count'>" +
        formatSummaryCount(entry, simple) +
        formatSortImpactBadge(entry) +
        '</span>'
    );
    summary.innerHTML = summaryBits.join('');
    d.appendChild(summary);

    if (!entry.statCount) {
      var miss = document.createElement('p');
      miss.className = 'no-stats';
      miss.textContent =
        'No stat data for this part yet. Re-run scripts/build-parts-stats-from-nexus.mjs after a Nexus refresh.';
      d.appendChild(miss);
      return d;
    }

    if (simple) {
      var intro = document.createElement('p');
      intro.className = 'stat-intro';
      if (entry.simpleHighlights && entry.simpleHighlights.length) {
        intro.textContent = 'Compared to a neutral baseline, this part changes:';
      } else {
        intro.textContent =
          'No simple % bonuses found — this part mostly uses internal engine offsets. Open raw engine data below if you need the numbers.';
      }
      d.appendChild(intro);

      if (entry.simpleHighlights && entry.simpleHighlights.length) {
        var highlights = sortedSimpleHighlights(entry);
        var chips = document.createElement('div');
        chips.className = 'stat-chips';
        for (var ci = 0; ci < highlights.length; ci++) {
          var h = highlights[ci];
          var chip = document.createElement('span');
          chip.className = chipClassForHighlight(h);
          if (activeStatSearch && queryMatchesText(h.title, activeStatLabel, compactStatQuery(activeStatLabel))) {
            chip.className += ' stat-chip--match';
          }
          chip.title = h.detail || h.title;
          chip.textContent = h.line;
          chips.appendChild(chip);
        }
        d.appendChild(chips);

        var wrap = document.createElement('div');
        wrap.className = 'simple-table-wrap';
        var stable = document.createElement('table');
        stable.className = 'simple-table';
        stable.innerHTML = '<thead><tr><th>Stat</th><th>Effect</th><th>Notes</th></tr></thead>';
        var stbody = document.createElement('tbody');
        for (var si = 0; si < highlights.length; si++) {
          var row = highlights[si];
          var str = document.createElement('tr');
          if (
            activeStatMatchers &&
            (rowMatchesStatMatchers({ stat_field: row.title, bucket: row.bucket }, activeStatMatchers) ||
              queryMatchesText(row.title, activeStatLabel, compactStatQuery(activeStatLabel)))
          ) {
            str.className = 'stat-row-match';
          }
          str.innerHTML =
            '<td><strong>' +
            esc(row.title) +
            '</strong></td><td class="effect-cell">' +
            esc(row.line) +
            '</td><td class="hint-cell">' +
            esc(row.detail || '—') +
            '</td>';
          stbody.appendChild(str);
        }
        stable.appendChild(stbody);
        wrap.appendChild(stable);
        d.appendChild(wrap);
      }

      if (entry.offsetCount) {
        var offsetNote = document.createElement('p');
        offsetNote.className = 'offset-note';
        offsetNote.textContent =
          'Also includes ' +
          entry.offsetCount +
          ' internal balance offset' +
          (entry.offsetCount === 1 ? '' : 's') +
          ' (shield tuning, datatable cells, etc.) — hidden here because they are not direct card % values.';
        d.appendChild(offsetNote);
      }

      appendTechnicalSection(d, entry, { expanded: true });
      return d;
    }

    var grid = document.createElement('div');
    grid.className = 'meta-grid';
    grid.innerHTML =
      (entry.idRaw ? '<div><b>Numeric ID:</b> <span class="mono">' + esc(entry.idRaw) + '</span></div>' : '') +
      '<div><b>Variant:</b> <span class="mono">' + esc(entry.variant) + '</span></div>' +
      '<div><b>Category:</b> ' + esc(entry.category) + '</div>' +
      '<div><b>Buckets:</b> ' + esc(entry.buckets.join(', ') || '—') + '</div>' +
      '<div><b>Fields:</b> ' + esc(entry.fields.join(', ') || '—') + '</div>' +
      (entry.range ? '<div><b>Value range:</b> ' + esc(entry.range) + '</div>' : '') +
      '<div><b>Unique fields:</b> ' + esc(String(entry.uniqueFieldCount || 0)) + '</div>' +
      '<div><b>Engine rows:</b> ' + entry.statCount + '</div>' +
      '<div><b>Table groups:</b> ' + esc(String(entry.displayGroupCount || entry.statCount)) + '</div>';
    d.appendChild(grid);

    var table = document.createElement('table');
    table.innerHTML =
      '<thead><tr><th>Stat</th><th>Value</th><th>Category</th><th>How applied</th><th>What it means</th></tr></thead>';
    var tbody = document.createElement('tbody');
    var groups = entry.displayGroups || buildDisplayGroups(entry.stats);
    if (activeStatMatchers) {
      groups.sort(function (a, b) {
        return groupMaxImpact(b, activeStatMatchers) - groupMaxImpact(a, activeStatMatchers);
      });
    }
    for (var gi = 0; gi < groups.length; gi++) {
      var tr = renderGroupedStatRow(groups[gi], activeStatMatchers);
      if (tr) tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    d.appendChild(table);

    return d;
  }

  function updateHeaderMeta() {
    var meta = byId('catalogMeta');
    var withStats = 0;
    for (var i = 0; i < allEntries.length; i++) {
      if (allEntries[i].statCount > 0) withStats++;
    }
    var psMeta = (window.PARTS_STATS_DATA && window.PARTS_STATS_DATA._meta) || {};
    var built = psMeta.builtAt ? String(psMeta.builtAt) : '—';
    if (meta) {
      meta.textContent =
        'Dataset parts: ' +
        allEntries.length +
        ' · With stats: ' +
        withStats +
        ' · PARTS_STATS keys: ' +
        (psMeta.part_count != null ? psMeta.part_count : '—') +
        ' · Built: ' +
        built +
        ' · Simple view shows % vs neutral; open raw engine data for full export rows.';
    }
    var totalEl = byId('totalCount');
    if (totalEl) totalEl.textContent = String(allEntries.length);
    var withEl = byId('withStatsCount');
    if (withEl) withEl.textContent = String(withStats);
  }

  function applyFilter() {
    var q = byId('q');
    var mfr = byId('mfr');
    var slot = byId('slot');
    var cat = byId('cat');
    var onlyStats = byId('onlyStats');
    var needle = q && q.value ? q.value.trim().toLowerCase() : '';
    var m = mfr && mfr.value ? mfr.value : '';
    var s = slot && slot.value ? slot.value : '';
    var c = cat && cat.value ? cat.value : '';
    var requireStats = !onlyStats || onlyStats.checked;

    activeStatMatchers = null;
    activeStatSearch = false;
    activeStatLabel = '';
    var statSearch = resolveStatSearch(needle);
    if (statSearch) {
      activeStatMatchers = statSearch.matchers;
      activeStatSearch = statSearch.isStatSearch;
      activeStatLabel = statSearch.label || needle;
    }

    filtered = [];
    for (var i = 0; i < allEntries.length; i++) {
      var e = allEntries[i];
      e._sortImpact = 0;
      e._sortRow = null;
      if (requireStats && !e.statCount) continue;
      if (activeStatSearch) {
        var impact = bestStatImpact(e, activeStatMatchers);
        if (!impact) continue;
      } else if (needle && e.search.indexOf(needle) === -1) {
        continue;
      }
      if (m && e.mfr !== m) continue;
      if (s && e.slot !== s) continue;
      if (c && e.category !== c) continue;
      if (activeStatMatchers && !activeStatSearch) bestStatImpact(e, activeStatMatchers);
      filtered.push(e);
    }

    if (activeStatSearch) {
      filtered.sort(function (a, b) {
        var d = (b._sortImpact || 0) - (a._sortImpact || 0);
        if (d !== 0) return d;
        return a.code.localeCompare(b.code, undefined, { sensitivity: 'base' });
      });
    } else if (activeStatMatchers) {
      filtered.sort(function (a, b) {
        var d = (b._sortImpact || 0) - (a._sortImpact || 0);
        if (d !== 0) return d;
        return a.code.localeCompare(b.code, undefined, { sensitivity: 'base' });
      });
    }

    var sortHint = byId('sortHint');
    if (sortHint) {
      sortHint.textContent = activeStatSearch
        ? activeStatLabel + ' — biggest change first (highest impact at top)'
        : activeStatMatchers
          ? 'Sorted by largest matching stat change'
          : '';
      sortHint.style.display = activeStatSearch || activeStatMatchers ? '' : 'none';
    }

    rendered = 0;
    var list = byId('list');
    if (list) list.innerHTML = '';
    renderMore();
    updateCounts();
  }

  function updateCounts() {
    var visibleCount = byId('visibleCount');
    var rowCount = byId('rowCount');
    var empty = byId('empty');
    var loadMore = byId('loadMore');
    var vis = Math.min(rendered, filtered.length);
    var effects = 0;
    var simple = isSimpleView();
    for (var i = 0; i < vis; i++) {
      if (simple) {
        effects += filtered[i].simpleHighlights ? filtered[i].simpleHighlights.length : 0;
      } else {
        effects += filtered[i].displayGroupCount || filtered[i].statCount;
      }
    }
    if (visibleCount) visibleCount.textContent = String(filtered.length);
    if (rowCount) rowCount.textContent = String(effects);
    if (empty) empty.style.display = filtered.length ? 'none' : '';
    if (loadMore) {
      loadMore.style.display = rendered < filtered.length ? '' : 'none';
      loadMore.textContent =
        'Load more (' + rendered + ' / ' + filtered.length + ' shown)';
    }
  }

  function renderMore() {
    var list = byId('list');
    if (!list) return;
    var frag = document.createDocumentFragment();
    var end = Math.min(rendered + PAGE_SIZE, filtered.length);
    for (var i = rendered; i < end; i++) {
      frag.appendChild(renderCard(filtered[i]));
    }
    list.appendChild(frag);
    rendered = end;
    updateCounts();
  }

  function initFilters() {
    var mfrSet = Object.create(null);
    var slotSet = Object.create(null);
    var catSet = Object.create(null);
    for (var i = 0; i < allEntries.length; i++) {
      var e = allEntries[i];
      if (e.mfr) mfrSet[e.mfr] = true;
      if (e.slot) slotSet[e.slot] = true;
      if (e.category) catSet[e.category] = true;
    }
    fillSelect(byId('mfr'), Object.keys(mfrSet));
    fillSelect(byId('slot'), Object.keys(slotSet));
    fillSelect(byId('cat'), Object.keys(catSet));
  }

  function bindUi() {
    var q = byId('q');
    var mfr = byId('mfr');
    var slot = byId('slot');
    var cat = byId('cat');
    var onlyStats = byId('onlyStats');
    if (q) q.addEventListener('input', applyFilter);
    if (mfr) mfr.addEventListener('change', applyFilter);
    if (slot) slot.addEventListener('change', applyFilter);
    if (cat) cat.addEventListener('change', applyFilter);
    if (onlyStats) onlyStats.addEventListener('change', applyFilter);
    var simpleView = byId('simpleView');
    if (simpleView) {
      simpleView.addEventListener('change', function () {
        rendered = 0;
        var list = byId('list');
        if (list) list.innerHTML = '';
        renderMore();
      });
    }
    var loadMore = byId('loadMore');
    if (loadMore) loadMore.addEventListener('click', renderMore);
    var expand = byId('expand');
    if (expand) {
      expand.addEventListener('click', function () {
        var cards = document.querySelectorAll('#list .part-card');
        for (var i = 0; i < cards.length; i++) cards[i].open = true;
      });
    }
    var collapse = byId('collapse');
    if (collapse) {
      collapse.addEventListener('click', function () {
        var cards = document.querySelectorAll('#list .part-card');
        for (var i = 0; i < cards.length; i++) cards[i].open = false;
      });
    }
  }

  function boot() {
    var loading = byId('loading');
    if (!window.STX_DATASET || !window.PARTS_STATS_DATA) {
      if (loading) loading.textContent = 'Failed to load dataset or PARTS_STATS_DATA.';
      return;
    }
    var parts = collectDatasetParts();
    allEntries = [];
    for (var i = 0; i < parts.length; i++) {
      allEntries.push(buildEntry(parts[i]));
    }
    allEntries.sort(function (a, b) {
      return a.code.localeCompare(b.code, undefined, { sensitivity: 'base' });
    });
    if (loading) loading.style.display = 'none';
    updateHeaderMeta();
    initFilters();
    bindUi();
    applyFilter();
  }

  function waitAndBoot() {
    var tries = 0;
    function tick() {
      tries++;
      if (window.STX_DATASET && window.PARTS_STATS_DATA) {
        boot();
        return;
      }
      if (tries > 400) {
        var loading = byId('loading');
        if (loading) loading.textContent = 'Timed out waiting for data scripts.';
        return;
      }
      setTimeout(tick, 25);
    }
    tick();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitAndBoot);
  } else {
    waitAndBoot();
  }
})();
