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

  /** Search terms → stat_field / bucket substrings (longest match wins for sort). */
  var STAT_SEARCH_ALIASES = {
    spread: ['spread_scale', 'spread_value', 'weapon_spread', 'accuracy'],
    accuracy: ['accuracy_scale', 'maxaccuracy_scale', 'spread_scale', 'accuracy'],
    recoil: ['recoil_scale', 'accimpulse_scale', 'ads'],
    sway: ['sway_scale', 'ads'],
    zoom: ['zoomtime_scale', 'zoomduration_scale', 'ads'],
    ads: ['zoomtime_scale', 'zoomduration_scale', 'sway_scale', 'recoil_scale', 'equiptime_scale', 'putdowntime_scale', 'ads'],
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

  function statMatchersForNeedle(needle) {
    var n = String(needle || '').trim().toLowerCase();
    if (!n || n.length < 2) return null;
    var matchers = Object.create(null);
    matchers[n] = true;
    var keys = Object.keys(STAT_SEARCH_ALIASES);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (n === key || n.indexOf(key) !== -1 || key.indexOf(n) !== -1) {
        var aliases = STAT_SEARCH_ALIASES[key];
        for (var j = 0; j < aliases.length; j++) matchers[aliases[j]] = true;
        matchers[key] = true;
      }
    }
    if (/_scale$|_value$|_add$/.test(n)) matchers[n] = true;
    var list = Object.keys(matchers);
    return list.length ? list : null;
  }

  function rowMatchesStatMatchers(row, matchers) {
    if (!row || !matchers || !matchers.length) return false;
    var field = String(row.stat_field || '').toLowerCase();
    var bucket = String(row.bucket || '').toLowerCase();
    for (var i = 0; i < matchers.length; i++) {
      var m = matchers[i];
      if (!m) continue;
      if (field.indexOf(m) !== -1 || bucket.indexOf(m) !== -1) return true;
    }
    return false;
  }

  /** Magnitude of scale change vs neutral (1.0 mul / 0 add) — used to rank stat searches. */
  function scaleImpact(row) {
    if (!row) return 0;
    var val = Number(row.stat_value);
    if (!Number.isFinite(val)) return 0;
    var comb = String(row.combine || '').trim().toLowerCase();
    var field = String(row.stat_field || '').toLowerCase();
    if (comb === 'value') return Math.abs(val);
    if (comb === 'add' || comb === '') return Math.abs(val);
    if (comb === 'mul') {
      if (field === 'damage_scale' && val > 0 && val < 1) return Math.abs(val);
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
    if (!row || !impact) return '';
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
      sum.fields.join(' ')
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

  function renderCard(entry) {
    var d = document.createElement('details');
    d.className = 'part-card';
    d.dataset.mfr = entry.mfr;
    d.dataset.slot = entry.slot;
    d.dataset.cat = entry.category;
    d.dataset.search = entry.search;
    d.dataset.hasStats = entry.statCount > 0 ? '1' : '0';

    var summary = document.createElement('summary');
    summary.innerHTML =
      "<span class='code'>" +
      esc(entry.code) +
      '</span>' +
      (entry.idRaw ? "<span class='meta mono'>" + esc(entry.idRaw) + '</span>' : '') +
      "<span class='meta'>" +
      esc(entry.mfr) +
      ' · ' +
      esc(entry.category) +
      ' · ' +
      esc(entry.slot) +
      (entry.name ? ' · ' + esc(entry.name) : '') +
      '</span>' +
      "<span class='count'>" +
      (entry.statCount ? entry.statCount + ' stats' : 'no stats') +
      (entry._sortImpact && entry._sortRow
        ? "<span class='impact-badge' title='" + esc(formatImpactLabel(entry._sortRow, entry._sortImpact)) + "'> · top Δ" + (Math.round(entry._sortImpact * 1000) / 10) + '%</span>'
        : '') +
      '</span>';
    d.appendChild(summary);

    var grid = document.createElement('div');
    grid.className = 'meta-grid';
    grid.innerHTML =
      (entry.idRaw ? '<div><b>Numeric ID:</b> <span class="mono">' + esc(entry.idRaw) + '</span></div>' : '') +
      '<div><b>Variant:</b> <span class="mono">' +
      esc(entry.variant) +
      '</span></div>' +
      '<div><b>Category:</b> ' +
      esc(entry.category) +
      '</div>' +
      '<div><b>Buckets:</b> ' +
      esc(entry.buckets.join(', ') || '—') +
      '</div>' +
      '<div><b>Fields:</b> ' +
      esc(entry.fields.join(', ') || '—') +
      '</div>' +
      (entry.range
        ? '<div><b>Value range:</b> ' + esc(entry.range) + '</div>'
        : '') +
      '<div><b>Stats rows:</b> ' +
      entry.statCount +
      '</div>';
    d.appendChild(grid);

    if (entry.statCount) {
      var table = document.createElement('table');
      table.innerHTML =
        '<thead><tr><th>stat_field</th><th>stat_value</th><th>bucket</th><th>combine</th><th>scale Δ</th></tr></thead>';
      var tbody = document.createElement('tbody');
      var rowsToShow = entry.stats.slice();
      if (activeStatMatchers) {
        rowsToShow.sort(function (a, b) {
          var am = rowMatchesStatMatchers(a, activeStatMatchers) ? scaleImpact(a) : -1;
          var bm = rowMatchesStatMatchers(b, activeStatMatchers) ? scaleImpact(b) : -1;
          return bm - am;
        });
      }
      for (var i = 0; i < rowsToShow.length; i++) {
        var r = rowsToShow[i];
        var imp = scaleImpact(r);
        var isMatch = activeStatMatchers && rowMatchesStatMatchers(r, activeStatMatchers);
        var tr = document.createElement('tr');
        if (isMatch) tr.className = 'stat-row-match';
        tr.innerHTML =
          "<td class='mono'>" +
          esc(r.stat_field) +
          "</td><td class='num'>" +
          esc(r.stat_value) +
          '</td><td>' +
          esc(r.bucket) +
          '</td><td>' +
          esc(r.combine || '') +
          "</td><td class='num'>" +
          (imp ? (Math.round(imp * 1000) / 10) + '%' : '—') +
          '</td>';
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      d.appendChild(table);
    } else {
      var miss = document.createElement('p');
      miss.className = 'no-stats';
      miss.textContent =
        'No numeric stat rows in PARTS_STATS_DATA for this part yet. Re-run scripts/build-parts-stats-from-nexus.mjs after a Nexus refresh.';
      d.appendChild(miss);
    }

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
        built;
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

    activeStatMatchers = statMatchersForNeedle(needle);

    filtered = [];
    for (var i = 0; i < allEntries.length; i++) {
      var e = allEntries[i];
      e._sortImpact = 0;
      e._sortRow = null;
      if (requireStats && !e.statCount) continue;
      if (needle && e.search.indexOf(needle) === -1) continue;
      if (m && e.mfr !== m) continue;
      if (s && e.slot !== s) continue;
      if (c && e.category !== c) continue;
      if (activeStatMatchers) bestStatImpact(e, activeStatMatchers);
      filtered.push(e);
    }

    if (activeStatMatchers) {
      filtered.sort(function (a, b) {
        var d = (b._sortImpact || 0) - (a._sortImpact || 0);
        if (d !== 0) return d;
        return a.code.localeCompare(b.code, undefined, { sensitivity: 'base' });
      });
    }

    var sortHint = byId('sortHint');
    if (sortHint) {
      sortHint.textContent = activeStatMatchers
        ? 'Sorted by largest scale impact for: ' + activeStatMatchers.slice(0, 6).join(', ') + (activeStatMatchers.length > 6 ? '…' : '')
        : '';
      sortHint.style.display = activeStatMatchers ? '' : 'none';
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
    var rows = 0;
    for (var i = 0; i < vis; i++) rows += filtered[i].statCount;
    if (visibleCount) visibleCount.textContent = String(filtered.length);
    if (rowCount) rowCount.textContent = String(rows);
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
