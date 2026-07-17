/**
 * Profile progression tools — account unlock ledger, world pin registry, echo upgrade tracks.
 * Uses PROFILE_PROGRESSION_CATALOG + profile YAML paths.
 */
(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }

  function catalog() {
    return window.PROFILE_PROGRESSION_CATALOG || null;
  }

  function ensureProfileUnlockablesRoot(data) {
    if (!data || typeof data !== 'object') return false;
    data.domains = data.domains || {};
    data.domains.local = data.domains.local || {};
    data.domains.local.unlockables = data.domains.local.unlockables || {};
    return true;
  }

  function unlockYamlBucket(entryId) {
    var dot = String(entryId || '').indexOf('.');
    return dot >= 0 ? entryId.slice(0, dot) : String(entryId || '');
  }

  function mergeEntryList(existing, addList) {
    var merged = [];
    var seen = {};
    var i;
    existing = Array.isArray(existing) ? existing : [];
    addList = Array.isArray(addList) ? addList : [];
    for (i = 0; i < existing.length; i++) {
      if (!seen[existing[i]]) { seen[existing[i]] = true; merged.push(existing[i]); }
    }
    for (i = 0; i < addList.length; i++) {
      if (!seen[addList[i]]) { seen[addList[i]] = true; merged.push(addList[i]); }
    }
    merged.sort(function (a, b) { return (a || '').toLowerCase().localeCompare((b || '').toLowerCase()); });
    return merged;
  }

  function collectProfileUnlockSet(data) {
    var out = new Set();
    if (!data || !data.domains || !data.domains.local || !data.domains.local.unlockables) return out;
    var U = data.domains.local.unlockables;
    for (var key in U) {
      if (!Object.prototype.hasOwnProperty.call(U, key)) continue;
      var ent = U[key] && U[key].entries;
      if (!Array.isArray(ent)) continue;
      for (var i = 0; i < ent.length; i++) out.add(ent[i]);
    }
    return out;
  }

  function mergeUnlockIdsIntoProfile(data, ids, remove) {
    if (!ensureProfileUnlockablesRoot(data)) return false;
    ids = Array.isArray(ids) ? ids : [];
    for (var x = 0; x < ids.length; x++) {
      var entryId = String(ids[x] || '').trim();
      if (!entryId) continue;
      var bucket = unlockYamlBucket(entryId);
      data.domains.local.unlockables[bucket] = data.domains.local.unlockables[bucket] || {};
      var existing = data.domains.local.unlockables[bucket].entries || [];
      if (remove) {
        data.domains.local.unlockables[bucket].entries = existing.filter(function (e) { return e !== entryId; });
      } else {
        data.domains.local.unlockables[bucket].entries = mergeEntryList(existing, [entryId]);
      }
    }
    return true;
  }

  function getProfileDiscoveryPg(data, create) {
    if (!data) return null;
    if (data.domains && data.domains.local) {
      if (create) data.domains.local.gbx_discovery_pg = data.domains.local.gbx_discovery_pg || {};
      if (data.domains.local.gbx_discovery_pg) return data.domains.local.gbx_discovery_pg;
    }
    if (create) data.gbx_discovery_pg = data.gbx_discovery_pg || {};
    return data.gbx_discovery_pg || null;
  }

  function parseDlblob(blob) {
    return String(blob || '').split(/:\d:/).filter(Boolean);
  }

  function serializeDlblob(keys) {
    var merged = {};
    for (var i = 0; i < keys.length; i++) {
      if (keys[i]) merged[keys[i]] = true;
    }
    return Object.keys(merged).join(':2:') + ':2:';
  }

  function getProfileProgressionShared(data, create) {
    if (!data) return null;
    data.domains = data.domains || {};
    data.domains.local = data.domains.local || {};
    if (create) data.domains.local.progression_shared = data.domains.local.progression_shared || {};
    return data.domains.local.progression_shared;
  }

  function mergeSduGraphIntoGraphs(graphs, sduGraph) {
    graphs = Array.isArray(graphs) ? graphs : [];
    var existingIdx = -1;
    for (var g = 0; g < graphs.length; g++) {
      if (graphs[g] && graphs[g].name === 'sdu_upgrades') { existingIdx = g; break; }
    }
    if (existingIdx >= 0) graphs[existingIdx] = sduGraph;
    else graphs.push(sduGraph);
    return graphs;
  }

  function buildSduGraphFromTiers(tierMap, cat) {
    var points = (cat && cat.sdu_point_steps) || [5, 10, 20, 30, 50, 80, 120, 235];
    var tracks = (cat && cat.sdu_tracks) || [];
    var nodes = [];
    var totalPoints = 0;
    for (var t = 0; t < tracks.length; t++) {
      var tr = tracks[t];
      var max = tr.max || 0;
      var want = Math.max(0, Math.min(max, parseInt(tierMap[tr.id], 10) || 0));
      for (var l = 0; l < want; l++) {
        var pts = points[l] || 0;
        nodes.push({ name: tr.id + '_' + String(l + 1).padStart(2, '0'), points_spent: pts });
        totalPoints += pts;
      }
    }
    return {
      sduGraph: { name: 'sdu_upgrades', group_def_name: 'Oak2_GlobalProgressGraph_Group', nodes: nodes },
      totalPoints: totalPoints
    };
  }

  function readSduTiersFromData(data) {
    var tiers = {};
    var cat = catalog();
    var tracks = (cat && cat.sdu_tracks) || [];
    for (var i = 0; i < tracks.length; i++) tiers[tracks[i].id] = 0;
    var ps = getProfileProgressionShared(data, false);
    var graphs = ps && ps.graphs;
    if (!Array.isArray(graphs)) return tiers;
    var graph = null;
    for (var g = 0; g < graphs.length; g++) {
      if (graphs[g] && graphs[g].name === 'sdu_upgrades') { graph = graphs[g]; break; }
    }
    if (!graph || !Array.isArray(graph.nodes)) return tiers;
    for (var n = 0; n < graph.nodes.length; n++) {
      var nm = String(graph.nodes[n] && graph.nodes[n].name || '');
      var m = nm.match(/^(Ammo_[A-Za-z]+|Backpack|Bank|Lost_Loot)_(\d+)$/);
      if (!m) continue;
      var tier = parseInt(m[2], 10);
      if (tier > (tiers[m[1]] || 0)) tiers[m[1]] = tier;
    }
    return tiers;
  }

  function setStatus(el, msg, ok) {
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = ok === false ? 'rgba(255,150,130,0.95)' : 'rgba(0,243,255,0.88)';
  }

  var unlockFilter = 'all';
  var unlockQuery = '';
  var selectedUnlockIds = new Set();

  function filteredUnlockRows() {
    var cat = catalog();
    var rows = (cat && cat.account_unlocks) || [];
    var q = unlockQuery.trim().toLowerCase();
    return rows.filter(function (row) {
      if (unlockFilter !== 'all' && row.family !== unlockFilter) return false;
      if (!q) return true;
      return (row.id + ' ' + row.label).toLowerCase().indexOf(q) >= 0;
    });
  }

  function renderUnlockLedger(activeSet) {
    var list = byId('ccUnlockLedgerList');
    var meta = byId('ccUnlockLedgerMeta');
    if (!list) return;
    var rows = filteredUnlockRows();
    if (meta) {
      meta.textContent = rows.length + ' catalog row(s) · ' + activeSet.size + ' on profile';
    }
    if (!rows.length) {
      list.innerHTML = '<div style="color:rgba(255,255,255,0.55);font-size:0.88em;padding:6px;">No matches.</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var on = activeSet.has(row.id);
      var sel = selectedUnlockIds.has(row.id);
      var unlockPickId = 'cc-unlock-pick-' + String(row.id || i).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
      html += '<label class="cc-unlock-ledger-row" for="' + escapeAttr(unlockPickId) + '" style="display:flex;align-items:flex-start;gap:8px;padding:6px 4px;border-bottom:1px solid rgba(0,200,255,0.08);cursor:pointer;">' +
        '<input type="checkbox" id="' + escapeAttr(unlockPickId) + '" name="' + escapeAttr(unlockPickId) + '" data-unlock-pick="' + escapeAttr(row.id) + '"' + (sel ? ' checked' : '') + ' style="margin-top:3px;"/>' +
        '<span style="flex:1;min-width:0;">' +
        '<span style="display:block;color:' + (on ? '#7dffb8' : '#c4f0ff') + ';font-size:0.86em;line-height:1.35;">' + escapeHtml(row.label) + '</span>' +
        '<code style="font-size:0.72em;opacity:0.72;word-break:break-all;">' + escapeHtml(row.id) + '</code>' +
        '</span></label>';
    }
    list.innerHTML = html;
  }

  function renderUnlockActiveChips(activeSet) {
    var box = byId('ccUnlockLedgerActive');
    if (!box) return;
    if (!activeSet.size) {
      box.innerHTML = '<span style="color:rgba(255,255,255,0.5);font-size:0.82em;">None staged on this profile yet.</span>';
      return;
    }
    var ids = [...activeSet].sort();
    var html = '';
    for (var i = 0; i < ids.length; i++) {
      html += '<span class="cc-prog-chip" title="' + escapeAttr(ids[i]) + '">' + escapeHtml(shortUnlockLabel(ids[i])) + '</span>';
    }
    box.innerHTML = html;
  }

  function shortUnlockLabel(id) {
    var tail = id.indexOf('.') >= 0 ? id.slice(id.indexOf('.') + 1) : id;
    if (tail.length > 28) return tail.slice(0, 26) + '…';
    return tail.replace(/_/g, ' ');
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

  function renderPinRegistry(activePins) {
    var host = byId('ccPinRegistryGroups');
    var meta = byId('ccPinRegistryMeta');
    var cat = catalog();
    var groups = (cat && cat.pin_groups) || [];
    if (meta) meta.textContent = activePins.size + ' pin(s) marked on profile · ' + groups.length + ' bundle(s) in catalog';
    if (!host) return;
    if (!groups.length) {
      host.innerHTML = '<div style="color:rgba(255,255,255,0.55);font-size:0.88em;">Pin catalog not loaded.</div>';
      return;
    }
    var html = '';
    for (var g = 0; g < groups.length; g++) {
      var grp = groups[g];
      var hit = 0;
      for (var p = 0; p < grp.pins.length; p++) {
        if (activePins.has(grp.pins[p])) hit++;
      }
      html += '<div class="cc-pin-group-card" style="padding:10px;border:1px solid rgba(0,200,255,0.22);border-radius:10px;background:rgba(0,20,40,0.35);">' +
        '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;">' +
        '<div><div style="color:#7dfff0;font-weight:700;font-size:0.9em;">' + escapeHtml(grp.label) + '</div>' +
        '<div style="color:rgba(255,255,255,0.55);font-size:0.75em;">' + grp.count + ' pins · ' + hit + ' on profile</div></div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
        '<button type="button" class="btn btn-Firmware cc-pin-reveal-btn" data-pin-group="' + escapeAttr(grp.id) + '" style="padding:5px 10px;font-size:0.8em;">Reveal</button>' +
        '<button type="button" class="btn cc-pin-hide-btn" data-pin-group="' + escapeAttr(grp.id) + '" style="padding:5px 10px;font-size:0.8em;">Hide</button>' +
        '</div></div></div>';
    }
    host.innerHTML = html;
  }

  function renderSduTracks(data) {
    var cat = catalog();
    var tracks = (cat && cat.sdu_tracks) || [];
    var host = byId('ccSduTrackGrid');
    if (!host) return;
    var tiers = readSduTiersFromData(data);
    var html = '';
    for (var i = 0; i < tracks.length; i++) {
      var tr = tracks[i];
      var val = tiers[tr.id] || 0;
      html += '<div style="display:grid;grid-template-columns:minmax(120px,1fr) 72px;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid rgba(0,200,255,0.1);">' +
        '<label for="ccSduTier_' + escapeAttr(tr.id) + '" style="color:#b8e6f0;font-size:0.86em;">' + escapeHtml(tr.label) + '</label>' +
        '<input id="ccSduTier_' + escapeAttr(tr.id) + '" name="ccSduTier_' + escapeAttr(tr.id) + '" data-sdu-track="' + escapeAttr(tr.id) + '" type="number" min="0" max="' + tr.max + '" value="' + val + '" style="width:100%;padding:6px 8px;background:#1a2332;border:1px solid rgba(0,243,255,0.4);border-radius:8px;color:#00f3ff;"/>' +
        '</div>';
    }
    host.innerHTML = html || '<div style="color:rgba(255,255,255,0.55);font-size:0.88em;">SDU catalog missing.</div>';
  }

  function readSduTiersFromUi() {
    var cat = catalog();
    var tracks = (cat && cat.sdu_tracks) || [];
    var map = {};
    for (var i = 0; i < tracks.length; i++) {
      var inp = byId('ccSduTier_' + tracks[i].id);
      var n = inp ? parseInt(inp.value, 10) : 0;
      if (!Number.isFinite(n) || n < 0) n = 0;
      if (n > tracks[i].max) n = tracks[i].max;
      map[tracks[i].id] = n;
    }
    return map;
  }

  function syncAllFromYaml() {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    var activeUnlocks = collectProfileUnlockSet(data || {});
    var pg = data ? getProfileDiscoveryPg(data, false) : null;
    var activePins = new Set(parseDlblob(pg && pg.dlblob));
    renderUnlockLedger(activeUnlocks);
    renderUnlockActiveChips(activeUnlocks);
    renderPinRegistry(activePins);
    renderSduTracks(data);
  }

  window.__ccSyncProfileProgressionToolsFromYaml = syncAllFromYaml;

  function commitData(data, statusEl, msg) {
    if (typeof window.commitYamlDataToEditor !== 'function') {
      setStatus(statusEl, 'YAML editor not ready.', false);
      return;
    }
    window.commitYamlDataToEditor(data);
    syncAllFromYaml();
    setStatus(statusEl, msg || 'Profile YAML updated.', true);
  }

  function wireUnlockLedger() {
    var search = byId('ccUnlockLedgerSearch');
    var filterSel = byId('ccUnlockLedgerFilter');
    var list = byId('ccUnlockLedgerList');
    var status = byId('ccUnlockLedgerStatus');

    if (search) {
      search.addEventListener('input', function () {
        unlockQuery = search.value || '';
        syncAllFromYaml();
      });
    }
    if (filterSel) {
      filterSel.addEventListener('change', function () {
        unlockFilter = filterSel.value || 'all';
        syncAllFromYaml();
      });
    }
    if (list) {
      list.addEventListener('change', function (ev) {
        var t = ev.target;
        if (!t || !t.getAttribute) return;
        var id = t.getAttribute('data-unlock-pick');
        if (!id) return;
        if (t.checked) selectedUnlockIds.add(id);
        else selectedUnlockIds.delete(id);
      });
    }

    function pickedIds() {
      return [...selectedUnlockIds];
    }

    var stageBtn = byId('ccUnlockLedgerStageBtn');
    if (stageBtn) {
      stageBtn.addEventListener('click', function () {
        var ids = pickedIds();
        if (!ids.length) return setStatus(status, 'Pick at least one catalog row.', false);
        var data = window.getYamlDataFromEditor();
        if (!data) return setStatus(status, 'Load a profile YAML first.', false);
        mergeUnlockIdsIntoProfile(data, ids, false);
        commitData(data, status, 'Staged ' + ids.length + ' unlock(s) on profile.');
      });
    }
    var removeBtn = byId('ccUnlockLedgerRemoveBtn');
    if (removeBtn) {
      removeBtn.addEventListener('click', function () {
        var ids = pickedIds();
        if (!ids.length) return setStatus(status, 'Pick rows to remove.', false);
        var data = window.getYamlDataFromEditor();
        if (!data) return setStatus(status, 'Load a profile YAML first.', false);
        mergeUnlockIdsIntoProfile(data, ids, true);
        commitData(data, status, 'Removed ' + ids.length + ' unlock(s) from profile.');
      });
    }
    var allBtn = byId('ccUnlockLedgerAllBtn');
    if (allBtn) {
      allBtn.addEventListener('click', function () {
        var cat = catalog();
        var rows = (cat && cat.account_unlocks) || [];
        var data = window.getYamlDataFromEditor();
        if (!data) return setStatus(status, 'Load a profile YAML first.', false);
        mergeUnlockIdsIntoProfile(data, rows.map(function (r) { return r.id; }), false);
        commitData(data, status, 'Merged full catalog (' + rows.length + ').');
      });
    }
    var clearBtn = byId('ccUnlockLedgerClearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        var data = window.getYamlDataFromEditor();
        if (!data || !ensureProfileUnlockablesRoot(data)) return setStatus(status, 'Load a profile YAML first.', false);
        var U = data.domains.local.unlockables;
        for (var key in U) {
          if (!Object.prototype.hasOwnProperty.call(U, key)) continue;
          if (key.indexOf('echo_') === 0 || key === 'shared_progress') {
            U[key].entries = [];
          }
        }
        commitData(data, status, 'Cleared account unlock buckets (echo_* + shared_progress).');
      });
    }
    var manualBtn = byId('ccUnlockLedgerManualBtn');
    if (manualBtn) {
      manualBtn.addEventListener('click', function () {
        var inp = byId('ccUnlockLedgerManual');
        var id = inp && String(inp.value || '').trim();
        if (!id) return setStatus(status, 'Enter an unlock id (e.g. shared_progress.story_completed).', false);
        var data = window.getYamlDataFromEditor();
        if (!data) return setStatus(status, 'Load a profile YAML first.', false);
        mergeUnlockIdsIntoProfile(data, [id], false);
        if (inp) inp.value = '';
        commitData(data, status, 'Staged manual unlock.');
      });
    }
  }

  function wirePinRegistry() {
    var host = byId('ccPinRegistryGroups');
    var status = byId('ccPinRegistryStatus');
    if (!host) return;

    host.addEventListener('click', function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest('button') : null;
      if (!btn) return;
      var gid = btn.getAttribute('data-pin-group');
      if (!gid) return;
      var reveal = btn.classList.contains('cc-pin-reveal-btn');
      var cat = catalog();
      var groups = (cat && cat.pin_groups) || [];
      var grp = null;
      for (var i = 0; i < groups.length; i++) {
        if (groups[i].id === gid) { grp = groups[i]; break; }
      }
      if (!grp) return;
      var data = window.getYamlDataFromEditor();
      if (!data) return setStatus(status, 'Load a profile YAML first.', false);
      var pg = getProfileDiscoveryPg(data, true);
      var set = new Set(parseDlblob(pg.dlblob));
      if (reveal) {
        for (var p = 0; p < grp.pins.length; p++) set.add(grp.pins[p]);
      } else {
        for (var r = 0; r < grp.pins.length; r++) set.delete(grp.pins[r]);
      }
      pg.dlblob = serializeDlblob([...set]);
      commitData(data, status, (reveal ? 'Revealed ' : 'Hid ') + grp.label + ' (' + grp.count + ' pins).');
    });

    var allBtn = byId('ccPinRegistryAllBtn');
    if (allBtn) {
      allBtn.addEventListener('click', function () {
        var cat = catalog();
        var groups = (cat && cat.pin_groups) || [];
        var all = [];
        for (var i = 0; i < groups.length; i++) all = all.concat(groups[i].pins);
        var data = window.getYamlDataFromEditor();
        if (!data) return setStatus(status, 'Load a profile YAML first.', false);
        var pg = getProfileDiscoveryPg(data, true);
        pg.dlblob = serializeDlblob(all);
        commitData(data, status, 'Marked all catalog pins (' + all.length + ').');
      });
    }
    var stripBtn = byId('ccPinRegistryStripBtn');
    if (stripBtn) {
      stripBtn.addEventListener('click', function () {
        var data = window.getYamlDataFromEditor();
        if (!data) return setStatus(status, 'Load a profile YAML first.', false);
        var pg = getProfileDiscoveryPg(data, true);
        pg.dlblob = ':2:';
        commitData(data, status, 'Cleared discovery blob on profile.');
      });
    }
  }

  function wireSduTracks() {
    var applyBtn = byId('ccSduTracksApplyBtn');
    var maxBtn = byId('ccSduTracksMaxBtn');
    var status = byId('ccSduTracksStatus');

    if (applyBtn) {
      applyBtn.addEventListener('click', function () {
        var data = window.getYamlDataFromEditor();
        if (!data) return setStatus(status, 'Load a profile YAML first.', false);
        var ps = getProfileProgressionShared(data, true);
        var tierMap = readSduTiersFromUi();
        var built = buildSduGraphFromTiers(tierMap, catalog());
        ps.graphs = mergeSduGraphIntoGraphs(ps.graphs, built.sduGraph);
        ps.point_pools = ps.point_pools || {};
        ps.point_pools.echotokenprogresspoints = Math.max(
          ps.point_pools.echotokenprogresspoints || 0,
          built.totalPoints
        );
        var echoFld = byId('yaml-profile-echotoken-points');
        if (echoFld && String(echoFld.value || '').trim() !== '') {
          var manual = parseInt(echoFld.value, 10);
          if (Number.isFinite(manual) && manual > ps.point_pools.echotokenprogresspoints) {
            ps.point_pools.echotokenprogresspoints = manual;
          }
        }
        commitData(data, status, 'Echo upgrade graph written to profile progression_shared.');
      });
    }
    if (maxBtn) {
      maxBtn.addEventListener('click', function () {
        var cat = catalog();
        var tracks = (cat && cat.sdu_tracks) || [];
        for (var i = 0; i < tracks.length; i++) {
          var inp = byId('ccSduTier_' + tracks[i].id);
          if (inp) inp.value = String(tracks[i].max);
        }
        if (applyBtn) applyBtn.click();
      });
    }
  }

  function boot() {
    if (!byId('ccProfileProgressionTools')) return;
    wireUnlockLedger();
    wirePinRegistry();
    wireSduTracks();
    syncAllFromYaml();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
