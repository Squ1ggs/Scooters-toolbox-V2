/**
 * Modded preset catalog — curated parts that stack well for modded damage / stats (Jun 2026).
 * Used by Quick add presets only; full part lookup stays in Advanced Part Search / guided slots.
 * Run audit-preset-catalog-coverage.mjs to find catalog rows missing from the dataset.
 * Stacks multiply: combined ≈ perStackMult^N (model estimate for testing).
 * Firmware is excluded — only one firmware per item; use the Guided Firmware slot.
 */
(function () {
  'use strict';

  function stacks(perStack, targets) {
    var out = {};
    if (!perStack || perStack <= 1) return out;
    var keys = Object.keys(targets || {});
    for (var i = 0; i < keys.length; i++) {
      var label = keys[i];
      var mult = targets[label];
      if (!mult || mult <= 1) continue;
      out[label] = Math.ceil(Math.log(mult) / Math.log(perStack));
    }
    return out;
  }

  var T = { x2: 2, x3: 3, x5: 5, x10: 10 };

  /** @type {Record<string, Record<string, Array>>} */
  var BY_ITEM_TYPE = {
    weapon: {
      damage: [
        { key: 22, value: '72', perStack: 1.08, note: 'VLA SMG barrel +Damage — extreme stacks in wild (64–1096)', moddedMax: 1096, stackExamples: stacks(1.08, T) },
        { key: 9, value: '28', perStack: 1.05, note: 'Universal +Damage (scope acc)', moddedMax: 64, stackExamples: stacks(1.05, T) },
        { key: 9, value: '55', perStack: 1.05, note: 'Universal +Damage (barrel acc)', moddedMax: 64, stackExamples: stacks(1.05, T) },
        { key: 9, value: '59', perStack: 1.05, note: 'Universal +Damage accessory', moddedMax: 64, stackExamples: stacks(1.05, T) },
        { key: 9, value: '62', perStack: 1.05, note: 'Universal +Damage accessory', moddedMax: 64, stackExamples: stacks(1.05, T) },
        { key: 9, value: '68', perStack: 1.05, note: 'Universal +Damage accessory', moddedMax: 64, stackExamples: stacks(1.05, T) },
        { key: 13, value: '13', perStack: 1.05, note: 'Daedalus AR barrel 02 +Damage', moddedMax: 237, stackExamples: stacks(1.05, T) },
        { key: 7, value: '66', perStack: 1.05, note: 'Jakobs SG barrel +Damage', moddedMax: 180, stackExamples: stacks(1.05, T) },
        { key: 13, value: '9', perStack: 1.05, note: 'Daedalus AR barrel +Damage', moddedMax: 26, stackExamples: stacks(1.05, T) },
      ],
      crit: [
        { key: 3, value: '6', perStack: 2, note: 'JAK PS Body D +Crit — each stack ≈×2 crit mult', moddedMax: 34, stackExamples: stacks(2, T) },
        { key: 24, value: '33', perStack: 2, note: 'JAK SR scope +Crit Damage', moddedMax: 20, stackExamples: stacks(2, T) },
        { key: 13, value: '10', perStack: 1.1, note: 'DAD AR barrel +Crit Damage', moddedMax: 22, stackExamples: stacks(1.1, T) },
      ],
      ammo: [
        { key: 18, value: '14', perStack: 1.02, note: 'VLA AR Mag 02 — 50 round mag base', moddedMax: 60, stackExamples: stacks(1.02, T) },
        { key: 27, value: '75', perStack: 1.05, note: 'Legendary perk token (Rowan FR) — also in ammo pool', moddedMax: 22, stackExamples: stacks(1.05, T) },
        { key: 2, value: '15', perStack: 1.03, note: 'DAD PS Torgue mag — high capacity', moddedMax: 42, stackExamples: stacks(1.03, T) },
        { key: 247, value: '97', perStack: 1.1, note: 'Enhancement Gun Magazine Size', moddedMax: 31, stackExamples: stacks(1.1, T) },
      ],
      firerate: [
        { key: 27, value: '15', perStack: 1.08, note: 'JAK AR barrel +Fire Rate — heavily stacked in modded', moddedMax: 131, stackExamples: stacks(1.08, T) },
        { key: 14, value: '1', perStack: 1.05, note: 'TED AR Chuck mag +Fire Rate', moddedMax: 23, stackExamples: stacks(1.05, T) },
        { key: 247, value: '90', perStack: 1.08, note: 'Enhancement Gun Fire Rate', moddedMax: 45, stackExamples: stacks(1.08, T) },
      ],
      reload: [
        { key: 24, value: '44', perStack: 0.92, note: 'Faster reload (invert mult) — JAK SR scope', stackExamples: {} },
        { key: 9, value: '61', perStack: 0.9, note: 'Faster reload accessory', stackExamples: {} },
        { key: 8, value: '66', perStack: 0.85, note: 'DAD SG barrel -Reload Speed (faster)', moddedMax: 99, stackExamples: {} },
      ],
      accuracy: [
        { key: 13, value: '12', perStack: 1.05, note: 'DAD AR barrel +Accuracy', moddedMax: 26, stackExamples: stacks(1.05, T) },
        { key: 9, value: '48', perStack: 1.05, note: 'Universal +Accuracy', stackExamples: stacks(1.05, T) },
      ],
      ads: [
        { key: 21, value: '25', perStack: 1.05, note: 'ADS / handling stack', moddedMax: 48, stackExamples: stacks(1.05, T) },
        { key: 15, value: '2', perStack: 1.05, note: 'ADS accessory stack', moddedMax: 32, stackExamples: stacks(1.05, T) },
        { key: 2, value: '15', perStack: 1.03, note: 'DAD PS mag / handling context', moddedMax: 42, stackExamples: stacks(1.03, T) },
      ],
      splash: [
        { key: 6, value: '33', perStack: 2, note: 'TOR PS +Blast Radius — extreme stacks', moddedMax: 110, stackExamples: stacks(2, T) },
        { key: 9, value: '89', perStack: 1.1, note: 'Splash damage accessory', stackExamples: stacks(1.1, T) },
        { key: 24, value: '18', perStack: 1.15, note: 'Torgue gyrojets', stackExamples: stacks(1.15, T) },
      ],
    },
    heavy: {
      damage: [
        { key: 289, value: '17', perStack: 1.05, note: 'MAL HW barrel +Damage', moddedMax: 17, stackExamples: stacks(1.05, T) },
        { key: 275, value: '23', perStack: 1.05, note: 'BOR HW barrel -CD +Damage', moddedMax: 25, stackExamples: stacks(1.05, T) },
        { key: 282, value: '7', perStack: 1.05, note: 'VLA HW body +Ammo/+Damage context', moddedMax: 65, stackExamples: stacks(1.05, T) },
        { key: 289, value: '24', perStack: 1.08, note: 'Gamma Void legendary barrel', stackExamples: stacks(1.08, T) },
        { key: 273, value: '35', perStack: 1.1, note: 'Gungnir / Javelin TOR HW barrel', stackExamples: stacks(1.1, T) },
      ],
      splash: [
        { key: 282, value: '18', perStack: 1.1, note: 'VLA HW barrel +Splash Radius', moddedMax: 10, stackExamples: stacks(1.1, T) },
        { key: 289, value: '15', perStack: 1.1, note: 'MAL HW barrel +Splash', stackExamples: stacks(1.1, T) },
      ],
      firerate: [
        { key: 289, value: '14', perStack: 1.15, note: 'MAL HW Speed Loader +Fire Rate', stackExamples: stacks(1.15, T) },
        { key: 273, value: '27', perStack: 1.12, note: 'TOR HW barrel +Fire Rate', stackExamples: stacks(1.12, T) },
        { key: 282, value: '17', perStack: 1.12, note: 'VLA HW barrel +Fire Rate', stackExamples: stacks(1.12, T) },
      ],
    },
    grenade: {
      damage: [
        { key: 245, value: '72', perStack: 1.15, note: 'Explosive damage stat', moddedMax: 452, stackExamples: stacks(1.15, T) },
        { key: 245, value: '39', perStack: 1.12, note: 'Damage Amp payload', moddedMax: 99, stackExamples: stacks(1.12, T) },
        { key: 245, value: '76', perStack: 1.2, note: 'Nuke payload', moddedMax: 164, stackExamples: stacks(1.2, T) },
        { key: 245, value: '29', perStack: 1.1, note: 'MIRV payload augment', stackExamples: stacks(1.1, T) },
        { key: 245, value: '30', perStack: 1.1, note: 'Divider payload', stackExamples: stacks(1.1, T) },
      ],
      crit: [
        { key: 245, value: '75', perStack: 1.15, note: 'Exacting — crit damage', stackExamples: stacks(1.15, T) },
        { key: 245, value: '79', perStack: 1.12, note: 'Merciless — crit damage', stackExamples: stacks(1.12, T) },
      ],
      reload: [
        { key: 245, value: '71', perStack: 0.85, note: 'Express cooldown reduction', moddedMax: 100, stackExamples: {} },
      ],
      ammo: [
        { key: 245, value: '70', perStack: 1.1, note: 'Overflow extra charge', moddedMax: 100, stackExamples: stacks(1.1, T) },
        { key: 245, value: '56', perStack: 1.05, note: 'Maglock augment', stackExamples: stacks(1.05, T) },
      ],
    },
    shield: {
      ammo: [
        { key: 246, value: '54', perStack: 1.05, note: 'Capacity +50% perk — heavily stacked', moddedMax: 214, stackExamples: stacks(1.05, T) },
        { key: 246, value: '53', perStack: 1.05, note: 'Capacity perk', stackExamples: stacks(1.05, T) },
        { key: 246, value: '45', perStack: 1.04, note: 'Magazine Booster', stackExamples: stacks(1.04, T) },
        { key: 246, value: '46', perStack: 1.04, note: 'Magazine Booster alt', stackExamples: stacks(1.04, T) },
      ],
      resistance: [
        { key: 246, value: '56', perStack: 1.08, note: 'Adaptive shield perk', moddedMax: 810, stackExamples: stacks(1.08, T) },
        { key: 246, value: '55', perStack: 1.06, note: 'Adaptive alt', stackExamples: stacks(1.06, T) },
        { key: 246, value: '58', perStack: 1.05, note: 'Absorb perk', stackExamples: stacks(1.05, T) },
        { key: 246, value: '57', perStack: 1.05, note: 'Absorb alt', stackExamples: stacks(1.05, T) },
      ],
      damage: [
        { key: 246, value: '24', perStack: 1.08, note: 'Fire resistance / elemental row', stackExamples: stacks(1.08, T) },
        { key: 246, value: '23', perStack: 1.08, note: 'Cryo resistance row', stackExamples: stacks(1.08, T) },
        { key: 246, value: '22', perStack: 1.08, note: 'Corrosive resistance row', stackExamples: stacks(1.08, T) },
        { key: 246, value: '26', perStack: 1.08, note: 'Shock resistance row', stackExamples: stacks(1.08, T) },
        { key: 246, value: '25', perStack: 1.08, note: 'Radiation resistance row', stackExamples: stacks(1.08, T) },
      ],
    },
    classmod: {
      damage: [
        { key: 234, value: '19', perStack: 1.2, note: 'Damage Dealt +20% per stack', moddedMax: 212, stackExamples: stacks(1.2, T) },
        { key: 234, value: '28', perStack: 1.2, note: 'Elemental Damage +20%', moddedMax: 176, stackExamples: stacks(1.2, T) },
        { key: 234, value: '50', perStack: 1.12, note: 'Gun Damage', stackExamples: stacks(1.12, T) },
        { key: 234, value: '52', perStack: 1.15, note: 'Skill Damage', stackExamples: stacks(1.15, T) },
        { key: 234, value: '17', perStack: 1.12, note: 'Ordnance Damage', stackExamples: stacks(1.12, T) },
      ],
      crit: [
        { key: 234, value: '40', perStack: 1.35, note: 'Crit Damage +35%', moddedMax: 3, stackExamples: stacks(1.35, T) },
        { key: 234, value: '14', perStack: 1.1, note: 'Gun Crit Hit Chance +10%', stackExamples: stacks(1.1, T) },
        { key: 234, value: '60', perStack: 1.2, note: 'Critical Hit Damage', stackExamples: stacks(1.2, T) },
      ],
      firerate: [
        { key: 234, value: '38', perStack: 1.1, note: 'Fire Rate +10%', stackExamples: stacks(1.1, T) },
      ],
      reload: [
        { key: 234, value: '55', perStack: 0.92, note: 'Reload Speed (faster)', stackExamples: {} },
      ],
      ammo: [
        { key: 234, value: '57', perStack: 1.08, note: 'Maximum Health Capacity', stackExamples: stacks(1.08, T) },
        { key: 234, value: '47', perStack: 1.08, note: 'Maximum Shield Capacity', stackExamples: stacks(1.08, T) },
      ],
    },
    enhancement: {
      damage: [
        { key: 247, value: '35', perStack: 1.08, note: 'AR Damage', moddedMax: 5, stackExamples: stacks(1.08, T) },
        { key: 247, value: '33', perStack: 1.08, note: 'SMG Damage', moddedMax: 5, stackExamples: stacks(1.08, T) },
        { key: 247, value: '91', perStack: 1.1, note: 'Gun Damage', moddedMax: 5, stackExamples: stacks(1.1, T) },
      ],
      crit: [
        { key: 247, value: '28', perStack: 1.1, note: 'SMG Critical Damage', moddedMax: 20, stackExamples: stacks(1.1, T) },
        { key: 247, value: '88', perStack: 1.1, note: 'Gun Critical Damage', moddedMax: 7, stackExamples: stacks(1.1, T) },
      ],
      ammo: [
        { key: 247, value: '97', perStack: 1.1, note: 'Gun Magazine Size', moddedMax: 31, stackExamples: stacks(1.1, T) },
      ],
      firerate: [
        { key: 247, value: '90', perStack: 1.08, note: 'Gun Fire Rate', moddedMax: 45, stackExamples: stacks(1.08, T) },
      ],
      reload: [
        { key: 247, value: '82', perStack: 0.92, note: 'Gun Reload Speed (faster)', stackExamples: {} },
      ],
    },
    repkit: {
      reload: [
        { key: 243, value: '65', perStack: 0.9, note: 'Repkit reload speed (faster)', stackExamples: {} },
        { key: 243, value: '88', perStack: 0.9, note: 'Repkit reload speed alt', stackExamples: {} },
      ],
      splat: [
        { key: 243, value: '32', perStack: 1, note: 'Repkit splat row' },
        { key: 243, value: '33', perStack: 1, note: 'Repkit splat row' },
        { key: 243, value: '34', perStack: 1, note: 'Repkit splat row' },
        { key: 243, value: '35', perStack: 1, note: 'Repkit splat row' },
        { key: 243, value: '36', perStack: 1, note: 'Repkit splat row' },
      ],
      nova: [
        { key: 243, value: '37', perStack: 1, note: 'Repkit nova row' },
        { key: 243, value: '38', perStack: 1, note: 'Repkit nova row' },
        { key: 243, value: '39', perStack: 1, note: 'Repkit nova row' },
        { key: 243, value: '40', perStack: 1, note: 'Repkit nova row' },
        { key: 243, value: '41', perStack: 1, note: 'Repkit nova row' },
      ],
      immunity: [
        { key: 243, value: '27', perStack: 1, note: 'Repkit immunity row' },
        { key: 243, value: '28', perStack: 1, note: 'Repkit immunity row' },
        { key: 243, value: '42', perStack: 1, note: 'Repkit immunity row' },
      ],
      resistance: [
        { key: 243, value: '22', perStack: 1, note: 'Repkit resistance row' },
        { key: 243, value: '23', perStack: 1, note: 'Repkit resistance row' },
        { key: 243, value: '24', perStack: 1, note: 'Repkit resistance row' },
        { key: 243, value: '54', perStack: 1, note: 'Overshield row' },
      ],
      elemental: [
        { key: 243, value: '98', perStack: 1, note: 'Fire elemental repkit' },
        { key: 243, value: '99', perStack: 1, note: 'Radiation elemental repkit' },
        { key: 243, value: '100', perStack: 1, note: 'Corrosive elemental repkit' },
        { key: 243, value: '101', perStack: 1, note: 'Shock elemental repkit' },
        { key: 243, value: '102', perStack: 1, note: 'Cryo elemental repkit' },
      ],
    },
  };

  function stackGuideText(entry) {
    if (!entry) return '';
    var parts = [];
    if (entry.perStack && entry.perStack !== 1) {
      parts.push('~×' + Number(entry.perStack).toFixed(3) + ' per stack');
    }
    var ex = entry.stackExamples;
    if (ex && typeof ex === 'object') {
      var bits = [];
      if (ex.x2) bits.push('×2≈' + ex.x2);
      if (ex.x3) bits.push('×3≈' + ex.x3);
      if (ex.x5) bits.push('×5≈' + ex.x5);
      if (ex.x10) bits.push('×10≈' + ex.x10);
      if (bits.length) parts.push('Stacks: ' + bits.join(', '));
    }
    if (entry.moddedMax) parts.push('Seen max ' + entry.moddedMax + '/serial');
    if (entry.note) parts.push(entry.note);
    return parts.join(' · ');
  }

  function detectPresetItemType() {
    try {
      var g = document.getElementById('ccGuidedItemType');
      var gv = g ? String(g.value || '').trim().toLowerCase() : '';
      if (/heavy/.test(gv) || gv === 'gadget') return 'heavy';
      if (/grenade/.test(gv)) return 'grenade';
      if (/shield/.test(gv)) return 'shield';
      if (/class/.test(gv) || /mod/.test(gv)) return 'classmod';
      if (/enhancement/.test(gv)) return 'enhancement';
      if (/repkit/.test(gv) || /rep\s*kit/.test(gv)) return 'repkit';
      if (/weapon|rifle|pistol|shotgun|smg|sniper|assault/.test(gv)) return 'weapon';
      var stx = document.getElementById('stx_itemType') || document.getElementById('itemType');
      var sv = stx ? String(stx.value || '').trim().toLowerCase() : '';
      if (/heavy/.test(sv)) return 'heavy';
      if (/grenade/.test(sv)) return 'grenade';
      if (/shield/.test(sv)) return 'shield';
      if (/class/.test(sv)) return 'classmod';
      if (/enhancement/.test(sv)) return 'enhancement';
      if (/repkit/.test(sv)) return 'repkit';
      if (/weapon|rifle|pistol|shotgun|smg|sniper/.test(sv)) return 'weapon';
    } catch (_) {}
    return 'weapon';
  }

  function getCatalogPool(itemType, category) {
    var it = BY_ITEM_TYPE[itemType] || BY_ITEM_TYPE.weapon;
    return (it && it[category]) ? it[category].slice() : [];
  }

  function mergePools(basePool, catalogPool) {
    var seen = {};
    var out = [];
    function add(e) {
      if (!e) return;
      var k = e.bareId ? ('b:' + e.bareId) : (String(e.key != null ? e.key : e.k) + ':' + String(e.value != null ? e.value : e.v));
      if (seen[k]) return;
      seen[k] = true;
      out.push(e);
    }
    if (Array.isArray(basePool)) for (var i = 0; i < basePool.length; i++) add(basePool[i]);
    if (Array.isArray(catalogPool)) for (var j = 0; j < catalogPool.length; j++) add(catalogPool[j]);
    return out;
  }

  function catalogEntryToToken(e) {
    if (!e) return '';
    if (e.token) return String(e.token).trim();
    if (e.bareId) return '{' + String(e.bareId).trim() + '}';
    var k = e.key != null ? e.key : e.k;
    var v = e.value != null ? e.value : e.v;
    if (k != null && v != null) return '{' + String(k) + ':' + String(v) + '}';
    return '';
  }

  function lookupCatalogEntry(itemType, category, key, value, bareId) {
    var pool = getCatalogPool(itemType, category);
    var wantFam = key != null && value != null ? String(key) + ':' + String(value) : '';
    var wantBare = bareId ? String(bareId) : '';
    for (var i = 0; i < pool.length; i++) {
      var e = pool[i];
      if (wantBare && e.bareId && String(e.bareId) === wantBare) return e;
      var k = String(e.key) + ':' + String(e.value);
      if (wantFam && k === wantFam) return e;
    }
    return null;
  }

  window.MODDED_PRESET_CATALOG = {
    meta: {
      source: 'editor preset catalog + stx_dataset / PARTS_STATS_DATA',
      stackModel: 'multiplicative per identical token: combined ≈ perStack^N',
    },
    byItemType: BY_ITEM_TYPE,
    stackGuideText: stackGuideText,
    detectPresetItemType: detectPresetItemType,
    getCatalogPool: getCatalogPool,
    mergePools: mergePools,
    lookupCatalogEntry: lookupCatalogEntry,
    catalogEntryToToken: catalogEntryToToken,
  };
})();
