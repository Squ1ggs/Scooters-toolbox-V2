/**
 * cc-preset-rebuild.js
 * YAML preset actions: applyUpdatedYAMLToEditors, commitYamlDataToEditor,
 * data-action click handler with flash/toast, and preset functions.
 */
(function () {
  'use strict';

  /** How long preset success/error toasts and the floating tooltip stay visible (ms). */
  var PRESET_MESSAGE_VISIBLE_MS = 12000;

  function byId(id) { return document.getElementById(id); }

  function yamlTextarea() {
    return byId('yamlInput') || byId('fullYamlInput') || document.querySelector('textarea[aria-label="YAML editor"]');
  }

  /** Oak2_CharacterXP_Progression from Nexus-Data-xp_progression0.json (GbxExperienceFunction_Exponential). No per-level table in Nexus; scale is fixed so cumulative XP at level 50 matches known legit saves (3430227). */
  var __oak2CharXpProg = { multiplier: 60, power: 2.8, offset: 7.33, levelCap: 60, anchorLevel: 50, anchorCumulativePoints: 3430227 };
  var __oak2CharXpScale = null;
  function oak2CharacterCumulativeXpPoints(level) {
    var p = __oak2CharXpProg;
    var L = Math.floor(Number(level));
    if (!Number.isFinite(L) || L < 1) return 0;
    if (L > p.levelCap) L = p.levelCap;
    if (__oak2CharXpScale == null) {
      var sumRaw = 0;
      for (var i = 1; i < p.anchorLevel; i++) {
        sumRaw += p.multiplier * Math.pow(i + p.offset, p.power);
      }
      __oak2CharXpScale = p.anchorCumulativePoints / sumRaw;
    }
    var total = 0;
    for (var j = 1; j < L; j++) {
      total += p.multiplier * Math.pow(j + p.offset, p.power) * __oak2CharXpScale;
    }
    return Math.round(total);
  }
  window.getCharacterCumulativeXpForLevel = oak2CharacterCumulativeXpPoints;
  window.getCharacterLevelCap = function () { return __oak2CharXpProg.levelCap; };

  var __yamlItemLevelCap = 60;
  function clampYamlItemLevel(n) {
    var L = Math.floor(Number(n));
    if (!Number.isFinite(L)) L = __yamlItemLevelCap;
    return Math.max(1, Math.min(__yamlItemLevelCap, L));
  }

  /** Ensure profile YAML has domains.local.unlockables so preset merges can run. */
  function ensureProfileUnlockablesRoot(data) {
    if (!data || typeof data !== 'object') return false;
    data.domains = data.domains || {};
    data.domains.local = data.domains.local || {};
    data.domains.local.unlockables = data.domains.local.unlockables || {};
    return true;
  }

  /**
   * Set item level on all backpack / equipped / bank slots (character save).
   * @returns {{ ok: boolean, reason?: string }}
   */
  function applyItemLevelAcrossInventory(data, level) {
    if (!data || !data.state || !data.state.inventory || !data.state.inventory.items) {
      return { ok: false, reason: 'Character save with state.inventory.items required.' };
    }
    var L = clampYamlItemLevel(level);
    var processSlot = window.processSlot;
    if (typeof processSlot !== 'function') return { ok: false, reason: 'Serial toolkit not loaded (processSlot).' };
    try {
      var bp = data.state.inventory.items.backpack;
      if (bp && typeof bp === 'object') {
        for (var k in bp) { if (bp.hasOwnProperty(k)) processSlot(bp[k], L); }
      }
      var eq = data.state.inventory.equipped_inventory && data.state.inventory.equipped_inventory.equipped;
      if (eq && typeof eq === 'object') {
        for (var k2 in eq) { if (eq.hasOwnProperty(k2)) processSlot(eq[k2], L); }
      }
      if (data.domains && data.domains.local && data.domains.local.shared && data.domains.local.shared.inventory && data.domains.local.shared.inventory.items && data.domains.local.shared.inventory.items.bank) {
        var bank = data.domains.local.shared.inventory.items.bank;
        for (var k3 in bank) { if (bank.hasOwnProperty(k3)) processSlot(bank[k3], L); }
      }
    } catch (e) {
      console.error('applyItemLevelAcrossInventory', e);
      return { ok: false, reason: 'Inventory traversal failed.' };
    }
    return { ok: true, level: L };
  }
  window.applyItemLevelAcrossInventory = applyItemLevelAcrossInventory;

  window.applyUpdatedYAMLToEditors = function (updatedYAML) {
    if (!updatedYAML) return;
    var ta = yamlTextarea();
    if (ta) ta.value = String(updatedYAML);
    try {
      if (typeof window.syncYamlToFields === 'function') window.syncYamlToFields();
      if (typeof window.scheduleParseYAMLBackpack === 'function') window.scheduleParseYAMLBackpack(50);
      if (typeof window.__updatePresetButtonsAvailability === 'function') window.__updatePresetButtonsAvailability();
      if (typeof window.__ccRenderRuntimeStatus === 'function') window.__ccRenderRuntimeStatus();
    } catch (_) {}
  };

  window.commitYamlDataToEditor = function (data) {
    try {
      if (typeof window.normalizeYamlExperiencePointsInData === 'function') {
        try {
          window.normalizeYamlExperiencePointsInData(data);
        } catch (_) {}
      }
      var y = window.jsyaml || (typeof jsyaml !== 'undefined' ? jsyaml : null);
      if (!y || typeof y.dump !== 'function') return null;
      var newYaml = y.dump(data, { lineWidth: -1, noRefs: true });
      if (typeof window.sanitizeYamlForSave === 'function') newYaml = window.sanitizeYamlForSave(newYaml);
      if (typeof window.applyUpdatedYAMLToEditors === 'function') window.applyUpdatedYAMLToEditors(newYaml);
      else if (typeof window.setYamlText === 'function') {
        window.setYamlText(newYaml);
        if (typeof window.scheduleParseYAMLBackpack === 'function') window.scheduleParseYAMLBackpack(50);
      }
      else {
        var ta = yamlTextarea();
        if (ta) ta.value = newYaml;
        if (typeof window.scheduleParseYAMLBackpack === 'function') window.scheduleParseYAMLBackpack(50);
      }
      return newYaml;
    } catch (e) {
      console.error('commitYamlDataToEditor error', e);
      return null;
    }
  };

  if (typeof window.sanitizeYamlForSave !== 'function') {
    window.sanitizeYamlForSave = function (yaml) {
      if (!yaml || typeof yaml !== 'string') return yaml;
      yaml = yaml.replace(/:\s*!tags\s*$/gm, ':').replace(/^\s*!tags\s*$/gm, '');
      /** Large uint64 `points` are carried as strings in JS; dump may quote them — game expects plain decimal. */
      yaml = yaml.replace(/^(\s*points\s*:\s*)["'](\d{10,})["'](\s*)$/gm, '$1$2$3');
      if (typeof BigInt !== 'undefined') {
        yaml = yaml.replace(/^(\s*points\s*:\s*)(0x[0-9a-fA-F]+)(\s*)$/gm, function (full, lead, hex, tail) {
          try {
            return lead + BigInt(hex).toString(10) + tail;
          } catch (_) {
            return full;
          }
        });
      }
      return yaml;
    };
  }

  function __ccFlashYaml(ok) {
    var ta = yamlTextarea();
    if (!ta) return;
    var prev = ta.style.boxShadow;
    ta.style.transition = 'box-shadow 180ms ease';
    ta.style.boxShadow = ok ? '0 0 0 2px rgba(0,255,200,0.35)' : '0 0 0 2px rgba(255,100,120,0.45)';
    setTimeout(function () { ta.style.boxShadow = prev; }, 420);
  }

  var __ccToastHideTimer = null;
  function __ccToast(msg, ok) {
    try {
      if (__ccToastHideTimer) {
        clearTimeout(__ccToastHideTimer);
        __ccToastHideTimer = null;
      }
      var el = byId('yaml-status');
      var presetBar = byId('ccPresetActionStatus');
      function apply(node) {
        if (!node) return;
        node.style.display = 'block';
        node.textContent = msg;
        if (node.id === 'ccPresetActionStatus') {
          node.style.color = ok ? 'rgba(200,255,240,0.95)' : 'rgba(255,200,190,0.98)';
          node.style.border = ok ? '1px solid rgba(0,255,200,0.35)' : '1px solid rgba(255,120,100,0.45)';
          node.style.background = ok ? 'rgba(0,45,40,0.45)' : 'rgba(55,20,25,0.5)';
        } else {
          node.style.color = ok ? 'rgba(0,255,200,0.9)' : 'rgba(255,150,120,0.95)';
        }
      }
      apply(el);
      apply(presetBar);
      __ccToastHideTimer = setTimeout(function () {
        if (el) el.style.display = 'none';
        if (presetBar) presetBar.style.display = 'none';
        __ccToastHideTimer = null;
      }, PRESET_MESSAGE_VISIBLE_MS);
    } catch (_) {}
  }

  var PRESET_ACTION_SUCCESS = {
    clearMapFog: 'Map fog data written.',
    discoverAllLocations: 'Location discovery updated.',
    completeAllSafehouseMissions: 'Safehouse/silo mission sets merged.',
    completeAllStoryMissions: 'Story missions merged; epilogue staged.',
    completeAllMissions: 'All mission sets merged; extras applied.',
    unlockPostgame: 'Postgame / UVHM globals updated.',
    setCharacterToMaxLevel: 'Character level and XP updated.',
    setMaxSDU: 'SDU progression maxed.',
    unlockVaultPowers: 'Vault power collectibles set.',
    unlockAllHoverDrives: 'Hover drive unlock list merged.',
    unlockAllSpecialization: 'Specialization XP and tokens updated.',
    maxCurrency: 'Cash and eridium maxed.',
    maxAmmo: 'Ammo pools maxed.',
    unlockMaxEverything: 'Full unlock preset applied.',
    completeAllCollectibles: 'Collectibles merged from preset data.',
    completeAllChallenges: 'Challenge stats updated.',
    completeAllAchievements: 'Achievement counters updated.',
    updateAllSerialLevels: 'Item serial levels synced to character level.',
    setAllItemsToSpecificLevel: 'Item levels set to target.',
    unlockNewGameShortcuts: 'Profile shared_progress entries merged.',
    unlockAllCosmetics: 'Profile cosmetic unlock lists merged.'
  };

  function presetOutcomeMessage(fnName, changed, capturedAlert) {
    if (capturedAlert) return null;
    if (fnName && PRESET_ACTION_SUCCESS[fnName]) {
      return changed ? PRESET_ACTION_SUCCESS[fnName] : PRESET_ACTION_SUCCESS[fnName] + ' (YAML unchanged — may already match.)';
    }
    if (changed) return 'Changes applied to YAML.';
    return 'No YAML change (nothing to do or already applied).';
  }

  var __ccResultTooltipTimer = null;
  function showResultTooltip(button, success, message) {
    var existing = document.getElementById('cc-result-tooltip');
    if (existing) existing.remove();
    if (__ccResultTooltipTimer) clearTimeout(__ccResultTooltipTimer);
    var tip = document.createElement('div');
    tip.id = 'cc-result-tooltip';
    tip.setAttribute('role', 'tooltip');
    tip.style.cssText = 'position:fixed;z-index:999999;max-width:320px;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.45);pointer-events:none;transition:opacity 0.2s ease;';
    tip.style.background = success ? 'linear-gradient(135deg, rgba(0,200,180,0.95), rgba(0,150,180,0.9))' : 'linear-gradient(135deg, rgba(200,60,80,0.95), rgba(180,50,70,0.9))';
    tip.style.color = 'rgba(255,255,255,0.98)';
    tip.style.border = success ? '1px solid rgba(0,255,200,0.5)' : '1px solid rgba(255,120,100,0.5)';
    tip.innerHTML = '<span style="font-weight:800;margin-right:6px;">' + (success ? '&#x2713; Completed' : '&#x2717; Failed') + '</span>' + (message ? '<br><span style="opacity:0.95;font-size:12px;">' + String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>' : '');
    document.body.appendChild(tip);
    var rect = button ? button.getBoundingClientRect() : null;
    if (rect) {
      tip.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 320 - 8)) + 'px';
      var spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow >= 80) {
        tip.style.top = (rect.bottom + 8) + 'px';
      } else {
        tip.style.top = (rect.top - 4) + 'px';
        tip.style.transform = 'translateY(-100%)';
      }
    } else {
      tip.style.left = '50%';
      tip.style.top = '50%';
      tip.style.transform = 'translate(-50%, -50%)';
    }
    __ccResultTooltipTimer = setTimeout(function () {
      tip.style.opacity = '0';
      setTimeout(function () { if (tip.parentNode) tip.parentNode.removeChild(tip); }, 200);
      __ccResultTooltipTimer = null;
    }, PRESET_MESSAGE_VISIBLE_MS);
  }

  function closestActionTarget(start) {
    return start && start.closest ? start.closest('[data-action]') : null;
  }

  function handleAction(target) {
    if (!target) return;
    var action = target.getAttribute('data-action');
    if (!action) return;
    if (target.disabled) return;

    if (action === 'set-difficulty') {
      var mode = target.getAttribute('data-value') || 'Normal';
      if (typeof window.setYAMLDifficulty === 'function') window.setYAMLDifficulty(mode);
      return;
    }
    if (action === 'set-character') {
      var key = target.getAttribute('data-value') || '';
      if (typeof window.setCharacterPreset === 'function') window.setCharacterPreset(key);
      return;
    }
    if (action === 'apply-stats') {
      if (typeof window.applyYAMLStatsChanges === 'function') window.applyYAMLStatsChanges();
      return;
    }
    if (action === 'call') {
      var fnName = target.getAttribute('data-fn') || '';
      if (!fnName) return;
      var fn = window[fnName];
      if (typeof fn !== 'function') {
        alert('Action not available: ' + fnName);
        return;
      }
      try { fn(); } catch (err) {
        console.error(err);
        alert('Action failed: ' + (err && err.message ? err.message : fnName));
      }
      return;
    }
  }

  function postRefresh() {
    try { if (typeof window.__updatePresetButtonsAvailability === 'function') window.__updatePresetButtonsAvailability(); } catch (_) {}
    try { if (typeof window.parseYAMLBackpack === 'function') window.parseYAMLBackpack(); } catch (_) {}
    try { if (typeof window.refreshBackpackUI === 'function') window.refreshBackpackUI(); } catch (_) {}
    try { if (typeof window.__ccRenderRuntimeStatus === 'function') window.__ccRenderRuntimeStatus(); } catch (_) {}
  }

  document.addEventListener('click', function (e) {
    var target = closestActionTarget(e.target);
    if (!target) return;
    e.preventDefault();

    var before = (typeof window.getYamlText === 'function') ? window.getYamlText() : null;
    var beforeText = (before && before.text) || (typeof before === 'string' ? before : '');

    var capturedAlert = null;
    var origAlert = window.alert;
    window.alert = function (msg) { capturedAlert = String(msg || ''); };
    try {
      handleAction(target);
    } catch (err) {
      capturedAlert = (err && err.message) ? err.message : 'Unknown error';
      console.error(err);
    } finally {
      window.alert = origAlert;
    }
    postRefresh();

    var after = (typeof window.getYamlText === 'function') ? window.getYamlText() : null;
    var afterText = (after && after.text) || (typeof after === 'string' ? after : '');
    var changed = String(beforeText || '') !== String(afterText || '');

    __ccFlashYaml(changed);
    if (capturedAlert) {
      showResultTooltip(target, false, capturedAlert);
      __ccToast(capturedAlert, false);
    } else {
      var fnName = target.getAttribute('data-fn') || '';
      var act = target.getAttribute('data-action') || '';
      var msg;
      if (fnName === 'showAddItemsPopup') {
        msg = 'Add Items dialog opened. Paste serials and click Add.';
      } else if (act === 'call' && fnName) {
        msg = presetOutcomeMessage(fnName, changed, null) || 'Done.';
      } else if (act === 'set-character') {
        msg = changed ? 'Character class / name / GUID lines updated in YAML.' : 'YAML unchanged (already this class or no matching lines).';
      } else if (act === 'set-difficulty') {
        msg = changed ? 'player_difficulty updated in YAML.' : 'No change (line missing or already that difficulty).';
      } else if (act === 'apply-stats') {
        msg = changed ? 'Level, XP, spec, and currencies written to YAML.' : 'No change (same values or YAML parse failed).';
      } else if (changed) {
        msg = 'Changes applied successfully.';
      } else {
        msg = 'No YAML change (already applied or nothing to update).';
      }
      showResultTooltip(target, true, msg);
      __ccToast(msg, true);
    }
  }, true);

  function stubNeedFullToolbox(name) {
    alert(name + ' requires preset data. Ensure assets/data/preset_data.js is loaded with COLLECTIBLES, MISSIONSETS, and UNLOCKABLES blobs.');
  }

  var MISSION_PREFIXES = { all: 'missionset_', story: 'missionset_main_', safehouse: 'missionset_zoneactivity_safehouse', silo: 'missionset_zoneactivity_silo' };
  var SAFEHOUSE_SILO_LOCATIONS = ['02504100000113ED01_1588318775', '025041000001181202_1219939729', '0250410000015FED01_1875042151', '02504100000187D401_1882517809', '047C1619B44AA00302_1687647825', '04922658D4A72CD401_1798204775', '04922658D4A75EE201_1362582382', '04922658D4A791C201_1271147543', '089204DCF485770E02_1192963223', '089204DCF7EF120E02_2035944540', '089204DCF7EF92FA01_2135167885', '089204DCF7EFD0FA01_1541512767', '089204DCF7EFF40F02_1177657411', '14F6D87D57071BD501_1530198843', '14F6D87D570787D401_1419323791', '244BFE96422D31D401_2101065829', '244BFE96422DA2F901_1897336641', '244BFE96422DC5FC01_1346905034', '34CFF6FF1DA56FD601_1995548687', '5811224CB62827D501_1937969200', '5811224CB62835D501_1890737431', '907841CAD86511F801_1501116063', 'B04F130572E120DB01_1153963055', 'CC96E5191F743DD401_1223726776', 'CC96E5191F74B8E601_1603838428', 'CC96E5191F74D2D401_1997150008'];

  function addDiscoveredLocations(data, locationSubstrings) {
    if (!data.gbx_discovery_pg) data.gbx_discovery_pg = {};
    var existingBlob = data.gbx_discovery_pg.dlblob || '';
    var existing = existingBlob.split(/:\d:/).filter(Boolean);
    var merged = {};
    for (var i = 0; i < existing.length; i++) merged[existing[i]] = true;
    var locs = window.__ccPresetLocations ? window.__ccPresetLocations() : [];
    for (var j = 0; j < locs.length; j++) {
      for (var k = 0; k < locationSubstrings.length; k++) {
        if (locs[j].indexOf(locationSubstrings[k]) !== -1) { merged[locs[j]] = true; break; }
      }
    }
    for (var s = 0; s < locationSubstrings.length; s++) merged[locationSubstrings[s]] = true;
    data.gbx_discovery_pg.dlblob = Object.keys(merged).join(':2:') + ':2:';
  }

  function discoverSafehouseLocations() {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return;
    var prefix = 'DLMD_World_P_PoAActor_UAID_';
    var substrings = [];
    for (var i = 0; i < SAFEHOUSE_SILO_LOCATIONS.length; i++) substrings.push(prefix + SAFEHOUSE_SILO_LOCATIONS[i]);
    addDiscoveredLocations(data, substrings);
    window.commitYamlDataToEditor(data);
  }

  function stageEpilogueMission() {
    var t = (typeof window.getYamlText === 'function') ? window.getYamlText() : null;
    var yamlText = (t && t.text) || (typeof t === 'string' ? t : '');
    if (!yamlText) return;
    var data;
    try {
      if (typeof window.sanitizeYamlForParse === 'function') yamlText = window.sanitizeYamlForParse(yamlText);
      var y = window.jsyaml || (typeof jsyaml !== 'undefined' ? jsyaml : null);
      if (!y || typeof y.load !== 'function') return;
      data = y.load(yamlText);
      if (typeof window.normalizeYamlExperiencePointsInData === 'function') window.normalizeYamlExperiencePointsInData(data);
    } catch (e) { return; }
    if (!data) return;
    data.missions = data.missions || {};
    data.missions.local_sets = data.missions.local_sets || {};
    data.missions.local_sets['missionset_main_cityepilogue'] = { missions: { mission_main_cityepilogue: { status: 'Active', cursorposition: 8, final: { inv_openportal_endstate: 'completed', phasedimensionentered_1st: true, defeat_arjay_endstate: 'completed', take_object_endstate: 'completed' }, objectives: { entervault: { status: 'Completed_PostFinished' }, defeat_arjay: { status: 'Completed_PostFinished' }, explore_vault: { status: 'Completed_PostFinished' }, lootchests: { status: 'Completed_PostFinished', updatecount: 4 }, returntomoxxisbar: { status: 'Completed_Finishing' }, speaktolilith: { status: 'Completed_PostFinished' }, take_object: { status: 'Completed_PostFinished' } } } } };
    window.commitYamlDataToEditor(data);
  }

  function getMissionsetsOfType(type) {
    var prefix = MISSION_PREFIXES[type] || ('missionset_zoneactivity_' + type);
    var MISSIONSETS = window.__ccPresetMissionsets ? window.__ccPresetMissionsets() : {};
    var result = {};
    for (var key in MISSIONSETS) { if (key.indexOf(prefix) === 0) result[key] = MISSIONSETS[key]; }
    return result;
  }

  function mergeMissionsetsOfType(type) {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return;
    var filtered = getMissionsetsOfType(type);
    data.missions = data.missions || {};
    data.missions.local_sets = data.missions.local_sets || {};
    for (var key in filtered) data.missions.local_sets[key] = filtered[key];
    window.commitYamlDataToEditor(data);
  }

  window.mergeMissionsetsWithPrefix = function (prefix) {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return;
    var MISSIONSETS = window.__ccPresetMissionsets ? window.__ccPresetMissionsets() : {};
    data.missions = data.missions || {};
    data.missions.local_sets = data.missions.local_sets || {};
    for (var key in MISSIONSETS) { if (key.indexOf(prefix) === 0) data.missions.local_sets[key] = MISSIONSETS[key]; }
    window.commitYamlDataToEditor(data);
  };

  function updateSDUPoints() {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return;
    var pointTotal = 0;
    var activityNames = ['missionset_zoneactivity_crawler', 'missionset_zoneactivity_drillsite', 'missionset_zoneactivity_mine', 'missionset_zoneactivity_orderbunker', 'missionset_zoneactivity_safehouse', 'missionset_zoneactivity_silo'];
    var missionSets = (data.missions || {}).local_sets || {};
    for (var a = 0; a < activityNames.length; a++) {
      var missions = (missionSets[activityNames[a]] || {}).missions || {};
      for (var mkey in missions) { if (missions[mkey] && missions[mkey].status === 'completed') pointTotal += 40; }
    }
    var collectiblePoints = { propaspeakers: 20, capsules: 15, evocariums: 15, augurshrines: 10, caches: 10, safes: 10, vaultsymbols: 5 };
    var collectibles = ((data.stats || {}).openworld || {}).collectibles || {};
    for (var ck in collectiblePoints) {
      if (collectibles[ck]) {
        if (typeof collectibles[ck] === 'object') pointTotal += Object.keys(collectibles[ck]).length * (collectiblePoints[ck] || 0);
        else pointTotal += collectiblePoints[ck] || 0;
      }
    }
    data.progression = data.progression || {};
    data.progression.point_pools = data.progression.point_pools || {};
    var old = data.progression.point_pools.echotokenprogresspoints || 0;
    if (pointTotal > old) data.progression.point_pools.echotokenprogresspoints = pointTotal;
    window.commitYamlDataToEditor(data);
  }
  window.updateSDUPoints = updateSDUPoints;

  function openAllVaultDoors() {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return;
    var COLLECTIBLES = window.__ccPresetCollectibles ? window.__ccPresetCollectibles() : {};
    data.stats = data.stats || {};
    data.stats.openworld = data.stats.openworld || {};
    data.stats.openworld.collectibles = data.stats.openworld.collectibles || {};
    if (COLLECTIBLES.vaultdoor) data.stats.openworld.collectibles.vaultdoor = COLLECTIBLES.vaultdoor;
    if (COLLECTIBLES.vaultlock) data.stats.openworld.collectibles.vaultlock = COLLECTIBLES.vaultlock;
    window.commitYamlDataToEditor(data);
  }

  window.clearMapFog = function () {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    var levelnames = ['Intro_P', 'World_P', 'Vault_Grasslands_P', 'Fortress_Grasslands_P', 'Vault_ShatteredLands_P', 'Fortress_Shatteredlands_P', 'Vault_Mountains_P', 'Fortress_Mountains_P', 'ElpisElevator_P', 'Elpis_P', 'UpperCity_P'];
    var commonFields = { foddimensionx: 128, foddimensiony: 128, compressiontype: 'Zlib', foddata: 'eJztwTEBAAAAwqD+qWcMH6AAAAAAAAAAAAAAAAAAAACAtwGw2cOy' };
    data.gbx_discovery_pc = data.gbx_discovery_pc || {};
    var gbx = data.gbx_discovery_pc;
    gbx.foddatas = gbx.foddatas || [];
    for (var i = 0; i < levelnames.length; i++) {
      var newEntry = { levelname: levelnames[i] };
      for (var k in commonFields) newEntry[k] = commonFields[k];
      var idx = -1;
      for (var j = 0; j < gbx.foddatas.length; j++) { if (gbx.foddatas[j].levelname === levelnames[i]) { idx = j; break; } }
      if (idx >= 0) gbx.foddatas[idx] = newEntry; else gbx.foddatas.push(newEntry);
    }
    window.commitYamlDataToEditor(data);
  };

  window.discoverAllLocations = function () {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    data.gbx_discovery_pg = data.gbx_discovery_pg || {};
    data.gbx_discovery_pg.dlblob = (data.gbx_discovery_pg.dlblob || '') + ':2:';
    window.commitYamlDataToEditor(data);
  };

  window.completeAllSafehouseMissions = function () {
    if (!(window.ensurePresetDataLoaded && window.ensurePresetDataLoaded())) return stubNeedFullToolbox('Unlock All Safehouses');
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    mergeMissionsetsOfType('safehouse');
    mergeMissionsetsOfType('silo');
    discoverSafehouseLocations();
    if (typeof window.updateSDUPoints === 'function') window.updateSDUPoints();
  };
  window.completeAllStoryMissions = function () {
    if (!(window.ensurePresetDataLoaded && window.ensurePresetDataLoaded())) return stubNeedFullToolbox('Skip Story Missions');
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    mergeMissionsetsOfType('story');
    stageEpilogueMission();
  };
  window.completeAllMissions = function () {
    if (!(window.ensurePresetDataLoaded && window.ensurePresetDataLoaded())) return stubNeedFullToolbox('Skip All Missions');
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    var MISSIONSETS = window.__ccPresetMissionsets ? window.__ccPresetMissionsets() : {};
    data.missions = data.missions || {};
    data.missions.local_sets = data.missions.local_sets || {};
    for (var key in MISSIONSETS) data.missions.local_sets[key] = MISSIONSETS[key];
    stageEpilogueMission();
    openAllVaultDoors();
    discoverSafehouseLocations();
    if (typeof window.updateSDUPoints === 'function') window.updateSDUPoints();
    window.commitYamlDataToEditor(data);
  };

  window.unlockPostgame = function () {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    data.globals = data.globals || {};
    data.globals.highest_unlocked_vault_hunter_level = 6;
    data.globals.vault_hunter_level = 1;
    window.commitYamlDataToEditor(data);
  };

  window.setCharacterToMaxLevel = function () { window.setCharacterLevel(__oak2CharXpProg.levelCap); };

  window.setCharacterLevel = function (level) {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data || !data.state || !data.state.experience) return alert('Character save data not found.');
    var idx = -1;
    for (var i = 0; i < data.state.experience.length; i++) {
      if (data.state.experience[i] && data.state.experience[i].type === 'Character') { idx = i; break; }
    }
    if (idx < 0) return alert('Character experience entry not found.');
    var L = Math.floor(Number(level));
    if (!Number.isFinite(L)) L = __oak2CharXpProg.levelCap;
    L = Math.max(1, Math.min(__oak2CharXpProg.levelCap, L));
    var xp = oak2CharacterCumulativeXpPoints(L);
    data.state.experience[idx].level = L;
    data.state.experience[idx].points = xp;
    data.progression = data.progression || {};
    data.progression.point_pools = data.progression.point_pools || {};
    data.progression.point_pools.characterprogresspoints = L - 1;
    window.commitYamlDataToEditor(data);
  };

  window.setMaxSDU = function () {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    data.progression = data.progression || {};
    data.progression.graphs = data.progression.graphs || [];
    data.progression.point_pools = data.progression.point_pools || {};
    var points = [5, 10, 20, 30, 50, 80, 120, 235];
    var upgrades = [
      { prefix: 'Ammo_Pistol', levels: 7 }, { prefix: 'Ammo_SMG', levels: 7 }, { prefix: 'Ammo_AR', levels: 7 },
      { prefix: 'Ammo_SG', levels: 7 }, { prefix: 'Ammo_SR', levels: 7 }, { prefix: 'Backpack', levels: 8 },
      { prefix: 'Bank', levels: 8 }, { prefix: 'Lost_Loot', levels: 8 }
    ];
    var nodes = [];
    for (var u = 0; u < upgrades.length; u++) {
      for (var l = 0; l < upgrades[u].levels; l++) {
        nodes.push({ name: upgrades[u].prefix + '_' + String(l + 1).padStart(2, '0'), points_spent: points[l] || 0 });
      }
    }
    var sduGraph = { name: 'sdu_upgrades', group_def_name: 'Oak2_GlobalProgressGraph_Group', nodes: nodes };
    var existingIdx = -1;
    for (var g = 0; g < data.progression.graphs.length; g++) {
      if (data.progression.graphs[g].name === 'sdu_upgrades') { existingIdx = g; break; }
    }
    var totalPoints = 0;
    for (var n = 0; n < nodes.length; n++) totalPoints += nodes[n].points_spent || 0;
    if (existingIdx >= 0) data.progression.graphs[existingIdx] = sduGraph;
    else data.progression.graphs.push(sduGraph);
    data.progression.point_pools.echotokenprogresspoints = Math.max(data.progression.point_pools.echotokenprogresspoints || 0, totalPoints);
    window.commitYamlDataToEditor(data);
  };

  window.unlockVaultPowers = function () {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    data.stats = data.stats || {};
    data.stats.openworld = data.stats.openworld || {};
    data.stats.openworld.collectibles = data.stats.openworld.collectibles || {};
    data.stats.openworld.collectibles.vaultpower_grasslands = 1;
    data.stats.openworld.collectibles.vaultpower_shatteredlands = 1;
    data.stats.openworld.collectibles.vaultpower_mountains = 1;
    window.commitYamlDataToEditor(data);
  };

  function generateHoverDriveList() {
    var manufacturers = ['Borg', 'Daedalus', 'Jakobs', 'Maliwan', 'Order', 'Tediore', 'Torgue', 'Vladof'];
    var list = [];
    for (var m = 0; m < manufacturers.length; m++) {
      var mfr = manufacturers[m];
      for (var i = 1; i <= 5; i++) {
        var num = String(i).padStart(2, '0');
        if (mfr === 'Jakobs' && (i === 1 || i === 3)) {
          list.push('unlockable_hoverdrives.jakobs_' + num);
        } else {
          list.push('unlockable_hoverdrives.' + mfr + '_' + num);
        }
      }
    }
    return list;
  }

  window.unlockAllHoverDrives = function () {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    var list = generateHoverDriveList();
    data.unlockables = data.unlockables || {};
    data.unlockables.unlockable_hoverdrives = data.unlockables.unlockable_hoverdrives || {};
    var existing = Array.isArray(data.unlockables.unlockable_hoverdrives.entries) ? data.unlockables.unlockable_hoverdrives.entries : [];
    var merged = [];
    var seen = {};
    for (var i = 0; i < existing.length; i++) {
      var e = existing[i];
      if (!seen[e]) { seen[e] = true; merged.push(e); }
    }
    for (var j = 0; j < list.length; j++) {
      if (!seen[list[j]]) { seen[list[j]] = true; merged.push(list[j]); }
    }
    merged.sort(function (a, b) { return (a || '').toLowerCase().localeCompare((b || '').toLowerCase()); });
    data.unlockables.unlockable_hoverdrives.entries = merged;
    window.commitYamlDataToEditor(data);
  };

  window.unlockAllSpecialization = function () {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    data.state = data.state || {};
    data.state.experience = data.state.experience || [];
    var found = false;
    for (var i = 0; i < data.state.experience.length; i++) {
      if (data.state.experience[i] && data.state.experience[i].type === 'Specialization') {
        data.state.experience[i].level = 701;
        data.state.experience[i].points = 7431910510;
        found = true;
      }
    }
    if (!found) data.state.experience.push({ type: 'Specialization', level: 701 });
    data.progression = data.progression || {};
    data.progression.point_pools = data.progression.point_pools || {};
    data.progression.point_pools.specializationtokenpool = 700;
    window.commitYamlDataToEditor(data);
  };

  window.maxCurrency = function () {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    data.state = data.state || {};
    data.state.currencies = data.state.currencies || {};
    data.state.currencies.cash = 2147483647;
    data.state.currencies.eridium = 2147483647;
    window.commitYamlDataToEditor(data);
  };

  window.maxAmmo = function () {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    data.state = data.state || {};
    data.state.ammo = { assaultrifle: 1260, pistol: 900, shotgun: 220, smg: 1620, sniper: 190, repkit: 10 };
    window.commitYamlDataToEditor(data);
  };

  window.unlockMaxEverything = function () {
    try {
      if (typeof window.clearMapFog === 'function') window.clearMapFog();
      if (typeof window.discoverAllLocations === 'function') window.discoverAllLocations();
      if (typeof window.unlockPostgame === 'function') window.unlockPostgame();
      if (typeof window.unlockAllHoverDrives === 'function') window.unlockAllHoverDrives();
      if (typeof window.unlockAllSpecialization === 'function') window.unlockAllSpecialization();
      if (typeof window.maxCurrency === 'function') window.maxCurrency();
      if (typeof window.maxAmmo === 'function') window.maxAmmo();
      if (typeof window.setCharacterToMaxLevel === 'function') window.setCharacterToMaxLevel();
      if (typeof window.setMaxSDU === 'function') window.setMaxSDU();
      if (typeof window.unlockVaultPowers === 'function') window.unlockVaultPowers();
    } catch (e) { console.error(e); }
  };

  window.completeAllCollectibles = function () {
    if (!(window.ensurePresetDataLoaded && window.ensurePresetDataLoaded())) return stubNeedFullToolbox('Unlock All Collectibles');
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    var COLLECTIBLES = window.__ccPresetCollectibles ? window.__ccPresetCollectibles() : {};
    data.stats = data.stats || {};
    data.stats.openworld = data.stats.openworld || {};
    data.stats.openworld.collectibles = data.stats.openworld.collectibles || {};
    for (var cat in COLLECTIBLES) {
      var vals = COLLECTIBLES[cat];
      data.stats.openworld.collectibles[cat] = data.stats.openworld.collectibles[cat] || {};
      if (vals && typeof vals === 'object' && !Array.isArray(vals)) {
        for (var k in vals) {
          var v = vals[k];
          if (v && typeof v === 'object' && !Array.isArray(v)) {
            data.stats.openworld.collectibles[cat][k] = data.stats.openworld.collectibles[cat][k] || {};
            for (var kk in v) data.stats.openworld.collectibles[cat][k][kk] = v[kk];
          } else data.stats.openworld.collectibles[cat][k] = v;
        }
      } else data.stats.openworld.collectibles[cat] = vals;
    }
    data.state = data.state || {};
    data.state.seen_eridium_logs = 262143;
    window.commitYamlDataToEditor(data);
    if (typeof window.updateSDUPoints === 'function') window.updateSDUPoints();
  };
  function updateStatsCounters(counters, subkey) {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return;
    data.stats = data.stats || {};
    var target = subkey ? (data.stats[subkey] = data.stats[subkey] || {}) : data.stats;
    for (var k in counters) {
      if (counters[k] && typeof counters[k] === 'object' && !Array.isArray(counters[k])) {
        target[k] = target[k] || {};
        for (var kk in counters[k]) target[k][kk] = counters[k][kk];
      } else target[k] = counters[k];
    }
    window.commitYamlDataToEditor(data);
  }

  window.completeAllChallenges = function () {
    if (!(window.ensurePresetDataLoaded && window.ensurePresetDataLoaded())) return stubNeedFullToolbox('Complete All Challenges');
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    var uvh = { mission_uvh_1a: 1, mission_uvh_1b: 1, mission_uvh_1c: 1, mission_uvh_2a: 1, mission_uvh_2b: 1, mission_uvh_2c: 1, mission_uvh_2d: 1, mission_uvh_3a: 1, mission_uvh_3b: 1, mission_uvh_3c: 1, mission_uvh_3d: 1, mission_uvh_4a: 1, mission_uvh_4b: 1, mission_uvh_4c: 1, mission_uvh_4d: 1, mission_uvh_5a: 1, mission_uvh_5b: 1, mission_uvh_5c: 1, mission_uvh_6a: 1, uvh_1_finalchallenge: 1, uvh_2_finalchallenge: 1, uvh_3_finalchallenge: 1, uvh_4_finalchallenge: 1, uvh_5_finalchallenge: 1 };
    updateStatsCounters(uvh);
    if (typeof window.mergeMissionsetsWithPrefix === 'function') window.mergeMissionsetsWithPrefix('missionset_zoneactivity_');
  };
  window.completeAllAchievements = function () {
    if (!(window.ensurePresetDataLoaded && window.ensurePresetDataLoaded())) return stubNeedFullToolbox('Complete All Achievements');
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    var counters = { '00_level_10': 1, '01_level_30': 1, '02_level_50': 1, '02_level_60': 1, '03_uvh_5': 1, '04_cosmetics_collect': 60, '05_vehicles_collect': 10, '06_legendaries_equip': 1, '07_challenges_gear': 1, '08_challenges_manufacturer': 1, '10_worldevents_colosseum': 1, '11_worldevents_airship': 1, '12_worldevents_meteor': 1, '13_contracts_complete': 80, '14_discovery_grasslands': 54, '15_discovery_mountains': 62, '16_discovery_shatteredlands': 47, '17_discovery_city': 21, '18_worldboss_defeat': 1, '19_vaultguardian_defeat': { '19_vaultguardian_grasslands': 1, '19_vaultguardian_mountains': 1, '19_vaultguardian_shatteredlands': 1 }, '20_missions_survivalist': 3, '21_missions_auger': 7, '22_missions_electi': 3, '23_missions_claptrap': 5, '24_missions_side': 98, '25_missions_grasslands': 1, '26_missions_mountains': 1, '27_missions_shatteredlands': 1, '28_missions_elpis': 1, '29_missions_main': 1, '30_moxxi_hidden': 1, '31_tannis_hidden': 1, '32_zane_hidden': 1, '33_oddman_hidden': 1, '34_dave_hidden': 1 };
    updateStatsCounters(counters, 'achievements');
    if (typeof window.mergeMissionsetsWithPrefix === 'function') window.mergeMissionsetsWithPrefix('missionset_zoneactivity_');
  };
  window.updateAllSerialLevels = function () {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    var level = __oak2CharXpProg.levelCap;
    try {
      if (data.state && Array.isArray(data.state.experience)) {
        for (var i = 0; i < data.state.experience.length; i++) {
          var exp = data.state.experience[i];
          if (exp && exp.type === 'Character' && typeof exp.level === 'number') {
            level = exp.level;
            break;
          }
        }
      }
    } catch (_) {}
    var res = applyItemLevelAcrossInventory(data, level);
    if (!res.ok) {
      if (res.reason && /Character save/.test(res.reason)) return alert(res.reason);
      return stubNeedFullToolbox('Set All Items to Character Level');
    }
    window.commitYamlDataToEditor(data);
  };

  /** Set every item serial level to the value in #yaml-items-target-level (backpack / equipped / bank). */
  window.setAllItemsToSpecificLevel = function () {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    var el = typeof document !== 'undefined' ? document.getElementById('yaml-items-target-level') : null;
    var raw = el && el.value !== undefined && el.value !== null && String(el.value).trim() !== '' ? el.value : String(__yamlItemLevelCap);
    var res = applyItemLevelAcrossInventory(data, raw);
    if (!res.ok) {
      if (res.reason && /Character save/.test(res.reason)) return alert(res.reason);
      return stubNeedFullToolbox('Set All Items to Target Level');
    }
    window.commitYamlDataToEditor(data);
  };
  function getContainerForInsert(data) {
    if (data && data.state && data.state.inventory && data.state.inventory.items) {
      data.state.inventory.items.backpack = data.state.inventory.items.backpack || {};
      return data.state.inventory.items.backpack;
    }
    if (data && data.domains && data.domains.local && data.domains.local.shared && data.domains.local.shared.inventory && data.domains.local.shared.inventory.items) {
      data.domains.local.shared.inventory.items.bank = data.domains.local.shared.inventory.items.bank || {};
      return data.domains.local.shared.inventory.items.bank;
    }
    return null;
  }

  function nextSlotIndexForInsert(container) {
    var maxIdx = -1;
    for (var k in container || {}) {
      if (container.hasOwnProperty(k)) {
        var m = /^slot_(\d+)$/.exec(k);
        if (m) maxIdx = Math.max(maxIdx, parseInt(m[1], 10));
      }
    }
    return maxIdx + 1;
  }

  function inferTemplateForInsert(container) {
    for (var k in container || {}) {
      if (container.hasOwnProperty(k) && /^slot_\d+$/.test(k)) {
        var v = container[k];
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          return { flags: (typeof v.flags === 'number') ? v.flags : 1, state_flags: (typeof v.state_flags === 'number') ? v.state_flags : 1 };
        }
      }
    }
    return { flags: 1, state_flags: 1 };
  }

  window.insertSerials = function (serials, opts) {
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return;
    var container = getContainerForInsert(data);
    if (!container) {
      alert('Could not locate backpack/bank container in this YAML.');
      return;
    }
    var start = nextSlotIndexForInsert(container);
    var template = inferTemplateForInsert(container);
    function parseOptInt(val, def) {
      if (val === undefined || val === null || val === '') return def;
      var n = parseInt(val, 10);
      return (!isNaN(n) && n >= 0) ? n : def;
    }
    var flags = parseOptInt(opts && opts.flags, template.flags);
    var stateFlags = parseOptInt(opts && opts.state_flags, template.state_flags);
    var list = Array.isArray(serials) ? serials : [];
    var added = 0;
    for (var i = 0; i < list.length; i++) {
      var s = String(list[i] || '').trim().replace(/^['"]|['"]$/g, '');
      if (!s) continue;
      if (s.indexOf('@U') !== 0) s = '@U' + s.replace(/^@U/, '');
      if (s.length < 10 || s.indexOf(',') >= 0 || s.indexOf('||') >= 0 || s.indexOf('{') >= 0 || s.indexOf('}') >= 0) continue;
      container['slot_' + (start + added)] = { serial: s, flags: flags, state_flags: stateFlags };
      added++;
    }
    if (!added) {
      alert('No valid BL-base85 serials to add.');
      return;
    }
    window.commitYamlDataToEditor(data);
  };

  window.showAddItemsPopup = function () {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;';
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) document.body.removeChild(overlay);
    });
    var modal = document.createElement('div');
    modal.style.cssText = 'width:min(720px,92vw);max-height:85vh;overflow:auto;background:rgb(28,28,28);border:1px solid rgba(255,255,255,0.14);border-radius:14px;padding:14px;box-shadow:0 20px 60px rgba(0,0,0,0.45);';
    var title = document.createElement('div');
    title.textContent = 'Add Item Serials';
    title.style.cssText = 'font-weight:900;margin-bottom:8px;';
    var help = document.createElement('div');
    help.textContent = 'Paste one serial per line. Flags/state_flags are optional (blank = auto from first slot).';
    help.style.cssText = 'opacity:0.85;font-size:13px;margin-bottom:10px;';
    var textarea = document.createElement('textarea');
    textarea.placeholder = 'Example:\n@UgbV...\n@UgwS...';
    textarea.style.cssText = 'width:100%;min-height:180px;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.16);background:rgb(18,18,18);color:rgb(220,220,220);font-family:monospace;margin-bottom:10px;';
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;';
    function makeNum(labelText, id) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;gap:6px;min-width:160px;';
      var lab = document.createElement('div');
      lab.textContent = labelText;
      lab.style.cssText = 'font-weight:800;font-size:13px;';
      var inp = document.createElement('input');
      inp.type = 'number';
      inp.placeholder = 'auto';
      inp.id = id;
      inp.style.cssText = 'padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,0.16);background:rgb(18,18,18);color:rgb(220,220,220);';
      wrap.appendChild(lab);
      wrap.appendChild(inp);
      return { wrap: wrap, input: inp };
    }
    var flagsInput = makeNum('flags', 'ccManualFlags');
    var stateFlagsInput = makeNum('state_flags', 'ccManualStateFlags');
    row.appendChild(flagsInput.wrap);
    row.appendChild(stateFlagsInput.wrap);
    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;justify-content:flex-end;gap:10px;';
    var cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn btn-Firmware';
    cancelBtn.addEventListener('click', function () { document.body.removeChild(overlay); });
    var addBtn = document.createElement('button');
    addBtn.textContent = 'Add';
    addBtn.className = 'btn btn-Firmware';
    addBtn.addEventListener('click', function () {
      var lines = textarea.value.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
      if (!lines.length) { alert('Paste at least one serial.'); return; }
      addBtn.disabled = true;
      try {
        window.insertSerials(lines, { flags: flagsInput.input.value, state_flags: stateFlagsInput.input.value });
      } finally {
        if (overlay.parentNode) document.body.removeChild(overlay);
      }
    });
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(addBtn);
    modal.appendChild(title);
    modal.appendChild(help);
    modal.appendChild(textarea);
    modal.appendChild(row);
    modal.appendChild(btnRow);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    setTimeout(function () { textarea.focus(); }, 0);
  };
  window.unlockNewGameShortcuts = function () {
    if (!(window.ensurePresetDataLoaded && window.ensurePresetDataLoaded())) return stubNeedFullToolbox('Unlock New Game Shortcuts');
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    if (!ensureProfileUnlockablesRoot(data)) {
      alert('Could not prepare profile unlockables structure.');
      return;
    }
    var UNLOCKABLES = window.__ccPresetUnlockables ? window.__ccPresetUnlockables() : {};
    var sp = UNLOCKABLES.shared_progress;
    if (!sp || !sp.entries || !Array.isArray(sp.entries)) return stubNeedFullToolbox('Unlock New Game Shortcuts');
    data.domains.local.unlockables.shared_progress = data.domains.local.unlockables.shared_progress || {};
    var existing = data.domains.local.unlockables.shared_progress.entries || [];
    var merged = [];
    var seen = {};
    for (var i = 0; i < existing.length; i++) {
      var e = existing[i];
      if (!seen[e]) { seen[e] = true; merged.push(e); }
    }
    for (var j = 0; j < sp.entries.length; j++) {
      if (!seen[sp.entries[j]]) { seen[sp.entries[j]] = true; merged.push(sp.entries[j]); }
    }
    merged.sort(function (a, b) { return (a || '').toLowerCase().localeCompare((b || '').toLowerCase()); });
    data.domains.local.unlockables.shared_progress.entries = merged;
    window.commitYamlDataToEditor(data);
  };

  window.unlockAllCosmetics = function () {
    if (!(window.ensurePresetDataLoaded && window.ensurePresetDataLoaded())) return stubNeedFullToolbox('Unlock All Cosmetics');
    var data = (typeof window.getYamlDataFromEditor === 'function') ? window.getYamlDataFromEditor() : null;
    if (!data) return alert('Load or paste a YAML file first.');
    if (!ensureProfileUnlockablesRoot(data)) {
      alert('Could not prepare profile unlockables structure.');
      return;
    }
    var UNLOCKABLES = window.__ccPresetUnlockables ? window.__ccPresetUnlockables() : {};
    for (var key in UNLOCKABLES) {
      if (key === 'shared_progress') continue;
      var u = UNLOCKABLES[key];
      if (!u || !u.entries || !Array.isArray(u.entries)) continue;
      data.domains.local.unlockables[key] = data.domains.local.unlockables[key] || {};
      var existing = data.domains.local.unlockables[key].entries || [];
      var merged = [];
      var seen = {};
      for (var i = 0; i < existing.length; i++) {
        var e = existing[i];
        if (!seen[e]) { seen[e] = true; merged.push(e); }
      }
      for (var j = 0; j < u.entries.length; j++) {
        if (!seen[u.entries[j]]) { seen[u.entries[j]] = true; merged.push(u.entries[j]); }
      }
      merged.sort(function (a, b) { return (a || '').toLowerCase().localeCompare((b || '').toLowerCase()); });
      data.domains.local.unlockables[key].entries = merged;
    }
    window.commitYamlDataToEditor(data);
  };
})();
