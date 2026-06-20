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
    var keys = [];
    var i = code.indexOf('comp_05_legendary_');
    if (i !== -1) keys.push(normPearlKey(code.slice(i + 'comp_05_legendary_'.length)));
    i = code.indexOf('comp_06_pearl_');
    if (i !== -1) keys.push(normPearlKey(code.slice(i + 'comp_06_pearl_'.length)));
    i = code.indexOf('comp_06_pearlescent_');
    if (i !== -1) keys.push(normPearlKey(code.slice(i + 'comp_06_pearlescent_'.length)));
    var m = code.match(/part_barrel_(?:\d+[a-z]_)?([a-z0-9_]+)$/);
    if (m) keys.push(normPearlKey(m[1]));
    m = code.match(/part_body_(?:\d+[a-z]_)?([a-z0-9_]+)$/);
    if (m) keys.push(normPearlKey(m[1]));
    var efHead = q(p.effects != null ? p.effects : (p.effect || '')).split(/\s*-\s*/)[0];
    if (efHead) keys.push(normPearlKey(efHead));
    var nm = q(p.name || p.legendaryName).split(/\s*-\s*/)[0];
    if (nm) keys.push(normPearlKey(nm.replace(/^legendary\s+/i, '')));
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

  /** In-game flavor quote — only from curated gear catalog when present. */
  function partRedTextForDropdown(p) {
    if (!p) return '';
    var row = gearCatalogRowForPart(p);
    var red = row ? q(row.redText) : '';
    return clip(red, 240);
  }

  function enhancementCoreEffectText(p) {
    try {
      if (typeof window.stxEnhancementCoreEffectText === 'function') {
        return q(window.stxEnhancementCoreEffectText(p));
      }
    } catch (_) {}
    return '';
  }

  /** What the part does — ability, perk, stats summary, or effects (not flavor red text). */
  function partEffectDescForDropdown(p) {
    if (!p) return '';

    var row = gearCatalogRowForPart(p);
    var ability = row ? q(row.ability) : '';
    if (ability) return clip(ability, 220);

    var core = enhancementCoreEffectText(p);
    if (core) return clip(core, 220);

    if (typeof window.formatPartStatsSummary === 'function') {
      try {
        var sum = q(window.formatPartStatsSummary(p, 3));
        if (sum && !isGenericPartPlaceholderText(sum)) return clip(sum, 220);
      } catch (_) {}
    }

    var ef = q(p.effects != null ? p.effects : (p.effect || p.effects_text));
    if (ef && !isGenericPartPlaceholderText(ef)) return clip(ef, 220);

    var stats = q(p.stats != null ? p.stats : p.stats_text).replace(/\s+/g, ' ');
    if (stats && !isGenericPartPlaceholderText(stats)) return clip(stats, 220);

    return '';
  }

  function applyPartDropdownMeta(opt, p, ctx) {
    if (!opt || !p) return;
    ctx = ctx || {};

    var red = partRedTextForDropdown(p);
    var desc = partEffectDescForDropdown(p);

    if (red && desc) {
      var redLc = red.toLowerCase();
      var descLc = desc.toLowerCase();
      if (descLc === redLc || descLc.indexOf(redLc) >= 0) desc = '';
      else if (redLc.indexOf(descLc) >= 0) desc = '';
    }

    if (red) opt.setAttribute('data-cc-barrel-sub', red);
    else opt.removeAttribute('data-cc-barrel-sub');

    if (desc) opt.setAttribute('data-cc-part-desc-sub', desc);
    else opt.removeAttribute('data-cc-part-desc-sub');

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

  window.partRedTextForDropdown = partRedTextForDropdown;
  window.partEffectDescForDropdown = partEffectDescForDropdown;
  window.stxApplyPartDropdownMeta = applyPartDropdownMeta;
  window.stxGearCatalogRowForPart = gearCatalogRowForPart;
})();
