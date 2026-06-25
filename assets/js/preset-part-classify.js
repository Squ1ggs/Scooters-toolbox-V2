/**
 * Map dataset parts → preset item type + category; resolve numeric OR spawn tokens.
 * Shared by preset picker UI and scripts/audit-preset-catalog-coverage.mjs.
 */
(function () {
  'use strict';

  var FAMILY_BY_TYPE = {
    grenade: { 245: true },
    shield: { 246: true },
    classmod: { 234: true },
    repkit: { 243: true },
    enhancement: { 247: true },
    heavy: { 244: true },
  };

  var BUCKET_TO_CATEGORY = {
    damage: 'damage',
    crit: 'crit',
    firerate: 'firerate',
    reload_time: 'reload',
    reload: 'reload',
    ammo_mag: 'ammo',
    accuracy: 'accuracy',
    elemental: 'elemental',
    ads: 'accuracy',
  };

  function stripCode(code) {
    return String(code || '').replace(/^"|"$/g, '').trim();
  }

  function stripSpawnCode(p) {
    return stripCode(p && (p.code || p.spawnCode || p.importCode));
  }

  function statsRowsForPart(p) {
    try {
      var data = window.PARTS_STATS_DATA;
      if (!data || !data.by_part_code) return null;
      var code = stripCode(p.code).toLowerCase();
      return data.by_part_code[code] || null;
    } catch (_) {
      return null;
    }
  }

  function repkitCategoryFromName(name, effects) {
    var s = (String(name || '') + ' ' + String(effects || '')).toLowerCase();
    if (/splat|lifesteal|healthsteal|health steal/.test(s)) return 'splat';
    if (/nova|explosion|radiate/.test(s)) return 'nova';
    if (/immun|cleanse|cc/.test(s)) return 'immunity';
    if (/resist|armor|shield/.test(s)) return 'resistance';
    if (/element|corrosive|cryo|fire|shock|radiat/.test(s)) return 'elemental';
    if (/cooldown|reload/.test(s)) return 'reload';
    return 'elemental';
  }

  function inferItemType(p) {
    var cat = String(p.category || '').toLowerCase();
    var it = String(p.itemType || p.itemtype || '').toLowerCase();
    var code = stripCode(p.code).toLowerCase();
    var fam = Number(p.family);
    if (FAMILY_BY_TYPE.heavy[fam] && /firmware/.test(code)) return 'heavy';
    if (cat === 'gadget' && /heavy|_hw/.test(code)) return 'heavy';
    if (cat === 'gadget' && /grenade/.test(code)) return 'grenade';
    if (/heavy_weapon|_hw\.|heavy_weapon_gadget/.test(code)) return 'heavy';
    if (/grenade_gadget|_grenade/.test(code)) return 'grenade';
    if (cat === 'shield' || /\.shield\.|_shield\./.test(code) || /^armor_shield|^energy_shield/.test(code)) {
      return 'shield';
    }
    if (cat === 'class mod' || /classmod/.test(code)) return 'classmod';
    if (cat === 'enhancement' || /enhancement\./.test(code)) return 'enhancement';
    if (cat === 'repair kit' || /repair_kit|repkit/.test(code)) return 'repkit';
    if (cat === 'weapon' || /\.(ar|sm|sg|sr|ps|hw)\./.test(code) || /_ar\.|_sm\.|_sg\.|_sr\.|_ps\./.test(code)) {
      return 'weapon';
    }
    if (/weapon/.test(it) && !/heavy/.test(it)) return 'weapon';
    if (FAMILY_BY_TYPE.grenade[fam]) return 'grenade';
    if (FAMILY_BY_TYPE.shield[fam]) return 'shield';
    if (FAMILY_BY_TYPE.classmod[fam]) return 'classmod';
    if (FAMILY_BY_TYPE.repkit[fam]) return 'repkit';
    if (FAMILY_BY_TYPE.enhancement[fam]) return 'enhancement';
    return '';
  }

  function mapCategory(itemType, p) {
    var rows = statsRowsForPart(p);
    var bucket = rows && rows[0] && rows[0].bucket ? String(rows[0].bucket) : '';
    if (itemType === 'repkit') {
      var rk = repkitCategoryFromName(p.name || '', p.effects || '');
      if (rk) return rk;
    }
    if (BUCKET_TO_CATEGORY[bucket]) return BUCKET_TO_CATEGORY[bucket];
    var ef = String(p.effects || p.effect || p.name || '').toLowerCase();
    var code = stripCode(p.code).toLowerCase();
    if (/firmware/.test(code)) return 'firmware';
    if (/damage/.test(ef)) return 'damage';
    if (/crit/.test(ef)) return 'crit';
    if (/fire rate|firerate/.test(ef)) return 'firerate';
    if (/reload/.test(ef)) return 'reload';
    if (/mag|ammo|capacity/.test(ef)) return 'ammo';
    if (/accuracy/.test(ef)) return 'accuracy';
    if (/splash|radius|blast/.test(ef)) return 'splash';
    if (/splat|lifesteal/.test(ef)) return 'splat';
    if (/nova/.test(ef)) return 'nova';
    if (/immun|cleanse/.test(ef)) return 'immunity';
    if (/resist/.test(ef)) return 'resistance';
    if (/element|corrosive|cryo|fire|shock|radiat/.test(ef)) return 'elemental';
    return 'damage';
  }

  function partIdRaw(p) {
    return String(p.idRaw || p.idraw || '').trim().replace(/\s+/g, '');
  }

  /** Infer `{fam:id}` from bare idRaw + spawn-code pool prefix (matches builder core). */
  function numericTokenFromPartBare(p) {
    if (!p) return '';
    var raw = String(p.idRaw || p.idraw || '').trim().replace(/\s+/g, '');
    if (/^\d+:\d+$/.test(raw)) return '{' + raw + '}';
    var bare = /^\d+$/.test(raw) ? raw : (p.id != null && /^\d+$/.test(String(p.id)) ? String(p.id) : '');
    var fam = p.family != null ? String(p.family) : (p.familyId != null ? String(p.familyId) : '');
    var id = p.id != null ? String(p.id) : (p.itemId != null ? String(p.itemId) : '');
    if (!bare && /^\d+$/.test(fam) && /^\d+$/.test(id)) return '{' + fam + ':' + id + '}';
    if (!bare) return '';
    var c = stripSpawnCode(p).toLowerCase();
    if (c.indexOf('repair_kit.') === 0) return '{243:' + bare + '}';
    if (c.indexOf('heavy_weapon_gadget.') === 0) return '{244:' + bare + '}';
    if (c.indexOf('classmod.') === 0) return '{234:' + bare + '}';
    if (c.indexOf('enhancement.') === 0) return '{247:' + bare + '}';
    if (c.indexOf('grenade_gadget.') === 0) return '{245:' + bare + '}';
    if (c.indexOf('shield.part_') === 0) return '{246:' + bare + '}';
    if (/^\d+$/.test(fam)) return '{' + fam + ':' + bare + '}';
    return '{' + bare + '}';
  }

  function presetTokenForPart(p) {
    var spawn = stripSpawnCode(p);
    var numeric = numericTokenFromPartBare(p);
    // Same fallback chain as the builder: numeric when resolvable, else spawn code.
    if (numeric) return numeric;
    if (spawn) return spawn;
    return '';
  }

  /** One row per logical part — merges duplicate numeric + spawn dataset entries. */
  function partCanonicalKey(p, itemType, category) {
    var numeric = numericTokenFromPartBare(p);
    var spawn = stripSpawnCode(p).toLowerCase();
    if (numeric && /^\{\d+:\d+\}$/.test(numeric)) {
      return itemType + '|' + category + '|' + numeric.replace(/^\{|\}$/g, '');
    }
    if (spawn) return itemType + '|' + category + '|s:' + spawn;
    if (numeric) return itemType + '|' + category + '|' + numeric.replace(/^\{|\}$/g, '');
    var idRaw = partIdRaw(p);
    if (idRaw) return itemType + '|' + category + '|b:' + idRaw;
    return '';
  }

  function isValidPresetToken(tok) {
    var s = String(tok || '').trim();
    if (!s) return false;
    if (/^\{[^}]+\}$/.test(s)) return true;
    if (/^[a-z0-9_][a-z0-9_.]*$/i.test(s)) return true;
    return false;
  }

  function partDedupeKey(p, itemType, category) {
    return partCanonicalKey(p, itemType, category);
  }

  function partMatchesPreset(p, itemType, category) {
    if (!p || !itemType || !category) return false;
    if (inferItemType(p) !== itemType) return false;
    if (mapCategory(itemType, p) !== category) return false;
    return isValidPresetToken(presetTokenForPart(p));
  }

  window.PRESET_PART_CLASSIFY = {
    inferItemType: inferItemType,
    mapCategory: mapCategory,
    partMatchesPreset: partMatchesPreset,
    partIdRaw: partIdRaw,
    stripSpawnCode: stripSpawnCode,
    numericTokenFromPartBare: numericTokenFromPartBare,
    presetTokenForPart: presetTokenForPart,
    partCanonicalKey: partCanonicalKey,
    isValidPresetToken: isValidPresetToken,
    partDedupeKey: partDedupeKey,
    FAMILY_BY_TYPE: FAMILY_BY_TYPE,
  };
})();
