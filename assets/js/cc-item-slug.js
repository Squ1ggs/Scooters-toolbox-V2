/**
 * cc-item-slug.js — Shared item slug + spawn prefix mapping for Legit Builder and Scooter's Toolbox Rebuild.
 * Single source of truth: keep in sync with bl4_manifest item slugs / NCS where possible.
 */
(function () {
  'use strict';
  if (window.__ccItemSlugV1) return;
  window.__ccItemSlugV1 = true;

  var SLUG_TO_PREFIX = {
    shield: 'GEN_SH',
    enhancement: 'GEN_EN',
    daedalus_pistol: 'DAD_PS', daedalus_shotgun: 'DAD_SG', daedalus_ar: 'DAD_AR', daedalus_smg: 'DAD_SM',
    jakobs_pistol: 'JAK_PS', jakobs_shotgun: 'JAK_SG', jakobs_ar: 'JAK_AR', jakobs_sniper: 'JAK_SR',
    tediore_pistol: 'TED_PS', tediore_shotgun: 'TED_SG', tediore_ar: 'TED_AR', tediore_shield: 'TED_SH',
    torgue_pistol: 'TOR_PS', torgue_shotgun: 'TOR_SG', torgue_ar: 'TOR_AR', torgue_heavy_weapon: 'TOR_HW',
    order_pistol: 'ORD_PS', order_ar: 'ORD_AR', order_sniper: 'ORD_SR',
    vladof_ar: 'VLA_AR', vladof_smg: 'VLA_SM', vladof_sniper: 'VLA_SR', vladof_heavy_weapon: 'VLA_HW',
    ripper_shotgun: 'BOR_SG', ripper_smg: 'BOR_SM', ripper_sniper: 'BOR_SR', ripper_heavy_weapon: 'BOR_HW',
    maliwan_shotgun: 'MAL_SG', maliwan_smg: 'MAL_SM', maliwan_sniper: 'MAL_SR', maliwan_heavy_weapon: 'MAL_HW',
    jakobs_shield: 'JAK_SH', vladof_shield: 'VLA_SH', daedalus_shield: 'DAD_SH', torgue_shield: 'TOR_SH',
    ripper_shield: 'BOR_SH', tediore_shield: 'TED_SH', maliwan_shield: 'MAL_SH', order_shield: 'ORD_SH',
    maliwan_grenade_gadget: 'MAL_GR', jakobs_grenade_gadget: 'JAK_GR', daedalus_grenade_gadget: 'DAD_GR',
    ripper_grenade_gadget: 'BOR_GR', order_grenade_gadget: 'ORD_GR', torgue_grenade_gadget: 'TOR_GR',
    vladof_grenade_gadget: 'VLA_GR', tediore_grenade_gadget: 'TED_GR',
    atlas_enhancement: 'ATL_EN', hyperion_enhancement: 'HYP_EN', jakobs_enhancement: 'JAK_EN',
    maliwan_enhancement: 'MAL_EN', order_enhancement: 'ORD_EN', cov_enhancement: 'COV_EN',
    tediore_enhancement: 'TED_EN', torgue_enhancement: 'TOR_EN', daedalus_enhancement: 'DAD_EN',
    ripper_enhancement: 'BOR_EN', vladof_enhancement: 'VLA_EN',
    torgue_repair_kit: 'TOR_RK', jakobs_repair_kit: 'JAK_RK', maliwan_repair_kit: 'MAL_RK',
    vladof_repair_kit: 'VLA_RK', daedalus_repair_kit: 'DAD_RK', ripper_repair_kit: 'BOR_RK',
    order_repair_kit: 'ORD_RK', tediore_repair_kit: 'TED_RK',
    vladof_turret_gadget: 'VLA_TG', tediore_turret_gadget: 'TED_TG', torgue_turret_gadget: 'TOR_TG',
    order_turret_gadget: 'ORD_TG',
    terminal_gadget_barrier: 'TB', terminal_gadget_combat: 'TC', terminal_gadget_healing: 'TH',
    ripper_terminal_barrier: 'BOR_TB', daedalus_terminal_combat: 'DAD_TC', jakobs_terminal_combat: 'JAK_TC',
    maliwan_terminal_healing: 'MAL_TH', order_terminal_healing: 'ORD_TH', tediore_terminal_barrier: 'TED_TB',
    torgue_terminal_combat: 'TOR_TC', vladof_terminal_barrier: 'VLA_TB',
    turret_weapon_basic: 'TWB', turret_weapon_beam: 'TWB', turret_weapon_chaingun: 'TWC',
    turret_weapon_longrifle: 'TWL', turret_weapon_rocketlauncher: 'TWR', turret_weapon_shotgun: 'TWS',
    weapon_turret_chaingun: 'WTC',
    turret_gadget: 'TUR_GA', terminal_gadget: 'TER_GA',
    classmod_dark_siren: 'CM_DS', classmod_exo_soldier: 'CM_EX', classmod_gravitar: 'CM_GR', classmod_paladin: 'CM_PA',
    classmod_robodealer: 'CM_RD'
  };

  function buildSlugPrefix(slug) {
    if (!slug) return '';
    if (SLUG_TO_PREFIX[slug]) return SLUG_TO_PREFIX[slug];
    var map = { daedalus: 'DAD', jakobs: 'JAK', tediore: 'TED', torgue: 'TOR', order: 'ORD', vladof: 'VLA', ripper: 'BOR', maliwan: 'MAL', atlas: 'ATL', cov: 'COV', hyperion: 'HYP' };
    var types = { pistol: 'PS', shotgun: 'SG', ar: 'AR', smg: 'SM', sniper: 'SR', heavy_weapon: 'HW', shield: 'SH', grenade_gadget: 'GR', repair_kit: 'RK', enhancement: 'EN', turret_gadget: 'TG', terminal_barrier: 'TB', terminal_combat: 'TC', terminal_healing: 'TH' };
    var parts = String(slug).split('_');
    var mfr = parts[0] || '';
    var type = parts.slice(1).join('_');
    if (!type && types[mfr]) return types[mfr];
    var left = (map[mfr] || (mfr ? mfr.substring(0, 3).toUpperCase() : ''));
    var right = (types[type] || (type ? type.substring(0, 2).toUpperCase() : ''));
    var pref = left + '_' + right;
    return /^[A-Z0-9]{3}_[A-Z0-9]{2}$/.test(pref) ? pref : '';
  }

  function normMfrSlugToken(m) {
    var s = String(m || '').trim().toLowerCase();
    var map = {
      maliwan: 'maliwan', jakobs: 'jakobs', daedalus: 'daedalus', torgue: 'torgue',
      tediore: 'tediore', order: 'order', vladof: 'vladof', borg: 'ripper', ripper: 'ripper',
      atlas: 'atlas', cov: 'cov', hyperion: 'hyperion'
    };
    return map[s] || s.replace(/\s+/g, '_');
  }

  function weaponTypeToSlugSuffix(wt) {
    var w = String(wt || '').trim().toLowerCase();
    var map = {
      pistol: 'pistol', shotgun: 'shotgun', 'assault rifle': 'ar', smg: 'smg',
      'sniper rifle': 'sniper', sniper: 'sniper', 'heavy weapon': 'heavy_weapon', heavy: 'heavy_weapon'
    };
    return map[w] || '';
  }

  /**
   * @param {{ itemType?: string, manufacturer?: string, weaponType?: string }} st — Simple Builder state shape
   * @returns {string} Legit-style slug or ''
   */
  function computeSimpleBuilderItemSlug(st) {
    if (!st || typeof st !== 'object') return '';
    var catUi = st.itemType || '';
    var cat = (catUi === 'Heavy' || catUi === 'Heavy Weapon') ? 'Weapon' : catUi;
    var man = normMfrSlugToken(st.manufacturer);
    if (!man) return '';

    if (cat === 'Weapon') {
      var wt = weaponTypeToSlugSuffix(st.weaponType);
      if (!wt) return '';
      return man + '_' + wt;
    }
    if (cat === 'Shield') return man + '_shield';
    if (cat === 'Grenade') return man + '_grenade_gadget';
    if (cat === 'Enhancement') return man + '_enhancement';
    if (cat === 'Repkit') return man + '_repair_kit';
    if (cat === 'Class Mod') {
      var ch = String(st.manufacturer || '').trim().toLowerCase().replace(/\s+/g, '_');
      var cm = {
        siren: 'classmod_dark_siren',
        paladin: 'classmod_paladin',
        exo_soldier: 'classmod_exo_soldier',
        gravitar: 'classmod_gravitar',
        robodealer: 'classmod_robodealer'
      };
      return cm[ch] || ('classmod_' + ch);
    }
    if (cat === 'Gadget') {
      var hm = { maliwan: 1, ripper: 1, torgue: 1, vladof: 1 };
      if (hm[man]) return man + '_heavy_weapon';
      return '';
    }
    return '';
  }

  window.SLUG_TO_PREFIX = SLUG_TO_PREFIX;
  window.buildSlugPrefix = buildSlugPrefix;
  window.computeSimpleBuilderItemSlug = computeSimpleBuilderItemSlug;
})();
