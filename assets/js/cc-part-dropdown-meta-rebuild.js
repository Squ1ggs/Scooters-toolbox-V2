/**
 * cc-part-dropdown-meta-rebuild.js
 * Shared part dropdown lines: effect/ability description (muted) + catalog red text (coral) only.
 */
(function () {
  'use strict';

  function q(s) {
    return String(s == null ? '' : s).trim();
  }

  function normCode(p) {
    return q((p && (p.code || p.spawnCode || p.importCode || '')).replace(/^"+|"+$/g, ''));
  }

  function normPearlKey(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function splitEffectPerkBody(ef) {
    var s = q(ef);
    if (!s) return { perk: '', body: '' };
    var idx = -1;
    var sepLen = 0;
    var seps = [' - ', ' – ', ' — ', ' \u2013 ', ' \u2014 '];
    for (var si = 0; si < seps.length; si++) {
      var j = s.indexOf(seps[si]);
      if (j >= 0 && (idx < 0 || j < idx)) {
        idx = j;
        sepLen = seps[si].length;
      }
    }
    if (idx < 0) {
      var m = s.match(/\s[\u2013\u2014\-]\s/);
      if (m && m.index != null) {
        idx = m.index;
        sepLen = m[0].length;
      }
    }
    if (idx >= 0) {
      return { perk: s.slice(0, idx).trim(), body: s.slice(idx + sepLen).trim() };
    }
    if (s.length <= 52 && s.indexOf('.') === -1 && s.split(/\s+/).length <= 6) {
      return { perk: s, body: '' };
    }
    return { perk: '', body: s };
  }

  function legendaryTokensFromSpawnCode(code) {
    var keys = [];
    var c = q(code).toLowerCase();
    if (!c) return keys;
    var i = c.indexOf('comp_05_legendary_');
    if (i !== -1) keys.push(normPearlKey(c.slice(i + 'comp_05_legendary_'.length)));
    i = c.indexOf('comp_06_pearl_');
    if (i !== -1) keys.push(normPearlKey(c.slice(i + 'comp_06_pearl_'.length)));
    i = c.indexOf('comp_06_pearlescent_');
    if (i !== -1) keys.push(normPearlKey(c.slice(i + 'comp_06_pearlescent_'.length)));
    var m = c.match(/part_(?:barrel|body)_\d+_([a-z0-9_]+)$/);
    if (m) keys.push(normPearlKey(m[1]));
    m = c.match(/part_(?:barrel|body)_(?:\d+[a-z]_)([a-z0-9_]+)$/);
    if (m) keys.push(normPearlKey(m[1]));
    return keys;
  }

  function legendaryTokenFromDisplayName(nm) {
    var s = q(nm);
    if (!s) return '';
    var m = s.match(/(?:^|\s)([A-Za-z][A-Za-z0-9_'-]*)\s*$/);
    if (!m) return '';
    if (/^(barrel|body|part|legendary|comp|magazine|scope|grip|stock|accessory)$/i.test(m[1])) return '';
    return normPearlKey(m[1]);
  }

  function gearCatalogRowForPart(p) {
    if (!p) return null;
    try {
      if (typeof window.stxPearlGearCatalogRowForPart === 'function') {
        return window.stxPearlGearCatalogRowForPart(p);
      }
    } catch (_) {}
    var cat = window.STX_PEARL_GEAR_CATALOG && window.STX_PEARL_GEAR_CATALOG.byNorm;
    if (!cat) return null;
    var code = normCode(p).toLowerCase();
    var keys = legendaryTokensFromSpawnCode(code);
    var efHead = q(p.effects != null ? p.effects : (p.effect || '')).split(/\s*-\s*/)[0];
    if (efHead) keys.push(normPearlKey(efHead));
    var nm = q(p.name || p.legendaryName).split(/\s*-\s*/)[0];
    if (nm) keys.push(normPearlKey(nm.replace(/^legendary\s+/i, '')));
    var tail = legendaryTokenFromDisplayName(nm || q(p.legendaryName));
    if (tail) keys.push(tail);
    for (var ki = 0; ki < keys.length; ki++) {
      var k = keys[ki];
      if (k && cat[k]) return cat[k];
    }
    return null;
  }

  function isGenericPartPlaceholderText(s) {
    var t = q(s).toLowerCase();
    if (!t) return true;
    if (/^(barrel|magazine|scope|body|grip|stock|underbarrel|muzzle|sight|accessory|shield|grenade|firmware|core|stat)\s+part\s+for\s+/i.test(t)) return true;
    if (/^part\s+for\s+/i.test(t)) return true;
    if (/^placeholder$/i.test(t)) return true;
    return false;
  }

  function clip(s, max) {
    s = q(s);
    if (!s) return '';
    max = max || 240;
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  }

  /** Flavor after "Perk - …" split — mechanical ability body, NOT card red-text quotes. */
  function partAbilityBodyFromEffectsField(p) {
    if (!p) return '';
    var ef = q(p.effects != null ? p.effects : (p.effect || p.effects_text));
    if (!ef) return '';
    var split = splitEffectPerkBody(ef);
    if (split.body && !isGenericPartPlaceholderText(split.body)) return clip(split.body, 240);
    return '';
  }

  /**
   * In-game card “red text” (flavor quote) only.
   * Does NOT use effects/ability bodies — those belong in partEffectDescForDropdown.
   * Falling back to effect text was painting Mag Acc / normal parts coral incorrectly.
   */
  function partRedTextForDropdown(p) {
    if (!p) return '';
    var row = gearCatalogRowForPart(p);
    var red = row ? q(row.redText) : '';
    if (red) return clip(red, 240);
    red = q(p.redText || p.red_text || p.flavorText || p.flavor_text);
    if (red) return clip(red, 240);
    return '';
  }

  function enhancementCoreEffectText(p) {
    try {
      if (typeof window.stxEnhancementCoreEffectText === 'function') {
        return q(window.stxEnhancementCoreEffectText(p));
      }
    } catch (_) {}
    return '';
  }

  /** What the part does — ability / effect body / stats (not flavor red-text quotes). */
  function partEffectDescForDropdown(p) {
    if (!p) return '';

    var row = gearCatalogRowForPart(p);
    var ability = row ? q(row.ability) : '';
    if (ability) return clip(ability, 220);

    var core = enhancementCoreEffectText(p);
    if (core) return clip(core, 220);

    var body = partAbilityBodyFromEffectsField(p);
    if (body) return body;

    var ef = q(p.effects != null ? p.effects : (p.effect || p.effects_text));
    var split = ef ? splitEffectPerkBody(ef) : { perk: '', body: '' };
    // Perk title only when there is no mechanical body (short single-line perks).
    if (split.perk && !isGenericPartPlaceholderText(split.perk)) return clip(split.perk, 220);

    if (typeof window.formatPartStatsSummary === 'function') {
      try {
        var sum = q(window.formatPartStatsSummary(p, 3));
        if (sum && !isGenericPartPlaceholderText(sum)) return clip(sum, 220);
      } catch (_) {}
    }

    if (ef && !isGenericPartPlaceholderText(ef)) return clip(ef, 220);

    var stats = q(p.stats != null ? p.stats : p.stats_text).replace(/\s+/g, ' ');
    if (stats && !isGenericPartPlaceholderText(stats)) return clip(stats, 220);

    return '';
  }

  function textsLooselySame(a, b) {
    var x = q(a).toLowerCase().replace(/\s+/g, ' ');
    var y = q(b).toLowerCase().replace(/\s+/g, ' ');
    if (!x || !y) return false;
    if (x === y) return true;
    if (x.length > 12 && y.indexOf(x) >= 0) return true;
    if (y.length > 12 && x.indexOf(y) >= 0) return true;
    return false;
  }

  function applyPartDropdownMeta(opt, p, ctx) {
    if (!opt || !p) return;
    ctx = ctx || {};

    var red = partRedTextForDropdown(p);
    var desc = partEffectDescForDropdown(p);

    if (red && desc && textsLooselySame(red, desc)) desc = '';

    if (red) opt.setAttribute('data-cc-barrel-sub', red);
    else opt.removeAttribute('data-cc-barrel-sub');

    if (desc) opt.setAttribute('data-cc-part-desc-sub', desc);
    else opt.removeAttribute('data-cc-part-desc-sub');

    var raw = normCode(p);
    if (raw) opt.setAttribute('data-cc-spawn-sub', raw);
    else opt.removeAttribute('data-cc-spawn-sub');

    if (ctx.allowLegendaryTone === false) {
      opt.removeAttribute('data-cc-primary-tone');
      return;
    }

    var legendaryTone = false;
    if (red) legendaryTone = true;
    else if (ctx.isBarrelSlot) {
      try {
        if (typeof window.stxPartLooksLegendaryBarrel === 'function' && window.stxPartLooksLegendaryBarrel(p)) legendaryTone = true;
        else if (typeof window.stxPartCarriesLegendaryEffectWeaponFamilyBarrel === 'function' && window.stxPartCarriesLegendaryEffectWeaponFamilyBarrel(p)) legendaryTone = true;
      } catch (_) {}
    }

    if (legendaryTone) opt.setAttribute('data-cc-primary-tone', 'legendary');
    else opt.removeAttribute('data-cc-primary-tone');
  }

  function spawnSegmentFromCode(rawCode) {
    var c = q(rawCode).replace(/^"+|"+$/g, '');
    if (!c) return '';
    var seg = c.indexOf('.') >= 0 ? c.slice(c.lastIndexOf('.') + 1) : c;
    return seg.replace(/^"+|"+$/g, '').trim();
  }

  /** Strip part_/comp_ prefix and underscores → spaces. */
  function formatSpawnPartName(code) {
    return spawnSegmentFromCode(code).replace(/^part_|^comp_/i, '').replace(/_/g, ' ').trim();
  }

  function partIdTokenForDropdown(p) {
    if (!p) return '';
    var id = q(p.idRaw != null ? p.idRaw : (p.idraw != null ? p.idraw : p.id));
    if (/^\d+\s*:\s*\d+$/.test(id)) {
      var parts = id.split(':');
      return '{' + String(parts[0]).trim() + ':' + String(parts[1]).trim() + '}';
    }
    return id;
  }

  /** Rich one-line label: spawn name · display name · {fam:id} · stats/effects. */
  function ccRichPartDropdownLabel(p, maxLen) {
    if (!p) return '-';
    maxLen = maxLen || 220;
    var raw = normCode(p);
    var spawn = formatSpawnPartName(raw);
    var name = q(p.name).replace(/^part_|^comp_/i, '').replace(/_/g, ' ').trim();
    var pt = q(p.partType);
    var ptLo = pt.toLowerCase();
    var isRarity = ptLo === 'rarity' || /\.comp_0[1-6]_/i.test(raw) || /\.part_rarity\b/i.test(raw);
    if (isRarity && typeof window.stxStripRarityIdSkinDisplaySuffix === 'function') {
      name = window.stxStripRarityIdSkinDisplaySuffix(name) || name;
    }
    /* Rarity ID: prefer human title over raw spawn · name · stats dumps. */
    if (isRarity && typeof window.stxRarityIdHumanTitleForPart === 'function') {
      try {
        var human = q(window.stxRarityIdHumanTitleForPart(p));
        if (human) name = human;
      } catch (_) {}
    }
    var idTok = partIdTokenForDropdown(p);
    var stats = q(p.stats).replace(/\s+/g, ' ').trim();
    var ef = q(p.effects || p.effect).replace(/\s+/g, ' ').trim();

    var bits = [];
    if (isRarity) {
      if (name) bits.push(name);
      if (idTok) bits.push(idTok);
    } else {
      if (raw) bits.push(raw);
      else if (spawn) bits.push(spawn);
      if (name) {
        var spawnNorm = spawn.toLowerCase().replace(/[^a-z0-9]/g, '');
        var nameNorm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (nameNorm && nameNorm !== spawnNorm && spawnNorm.indexOf(nameNorm) === -1) bits.push(name);
      }
      if (idTok) bits.push(idTok);
      if (stats) bits.push(stats.length > 44 ? stats.slice(0, 43) + '…' : stats);
      else if (ef) bits.push(ef.length > 44 ? ef.slice(0, 43) + '…' : ef);
      else if (pt && ptLo !== 'body' && ptLo !== 'magazine') bits.push(pt);
    }

    var line = bits.filter(Boolean).join(' · ');
    if (line.length > maxLen) line = line.slice(0, maxLen - 1) + '…';
    return line || spawn || raw || '-';
  }

  window.partRedTextForDropdown = partRedTextForDropdown;
  window.partEffectDescForDropdown = partEffectDescForDropdown;
  window.stxApplyPartDropdownMeta = applyPartDropdownMeta;
  window.stxGearCatalogRowForPart = gearCatalogRowForPart;
  window.ccRichPartDropdownLabel = ccRichPartDropdownLabel;
  window.ccFormatSpawnPartName = formatSpawnPartName;
})();
