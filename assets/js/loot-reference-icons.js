(function () {
  'use strict';

  var BASE = './img/guided-dropdowns/';
  var LEG_BASE = BASE + 'legendary-augments/';
  var WEAPON_BASE = BASE + 'weapon-type/';
  var MANU_BASE = BASE + 'manufacturer/';
  var PEARL_BASE = './img/dlc_rarity_pips/';

  var WEAPON_TYPE_ICONS = {
    'assault rifle': 'ico_ui_art_assault_small.png',
    assault: 'ico_ui_art_assault_small.png',
    pistol: 'ico_ui_art_pistol_small.png',
    shotgun: 'ico_ui_art_shotgun_small.png',
    smg: 'ico_ui_art_smg_small.png',
    'sniper rifle': 'ico_ui_art_sniper_small.png',
    sniper: 'ico_ui_art_sniper_small.png',
    'heavy weapon': 'ico_ui_art_heavy_small.png',
    heavy: 'ico_ui_art_heavy_small.png',
  };

  var LEG_WEAPON_AUG = {
    'assault rifle': 'ico_legendary_aug_gun_assault.png',
    assault: 'ico_legendary_aug_gun_assault.png',
    pistol: 'ico_legendary_aug_gun_pistol.png',
    shotgun: 'ico_legendary_aug_gun_shotgun.png',
    smg: 'ico_legendary_aug_gun_smg.png',
    'sniper rifle': 'ico_legendary_aug_gun_sniper.png',
    sniper: 'ico_legendary_aug_gun_sniper.png',
    'heavy weapon': 'ico_legendary_aug_heavy.png',
    heavy: 'ico_legendary_aug_heavy.png',
  };

  var CATEGORY_LEG_AUG = {
    shield: 'ico_legendary_aug_shield.png',
    repkit: 'ico_legendary_aug_repkit.png',
    grenade: 'ico_legendary_aug_grenade.png',
    class_mod: 'ico_legendary_aug_classmod.png',
    enhancement: 'ico_legendary_aug_classmod.png',
    heavy: 'ico_legendary_aug_heavy.png',
    gear: 'ico_legendary_aug_gun_assault.png',
    gun: 'ico_legendary_aug_gun_assault.png',
    pool: 'ico_legendary_aug_gun_assault.png',
    utility: 'ico_legendary_aug_repkit.png',
  };

  var TIER_WEAPON_FILTERS = [
    'brightness(0) saturate(100%) invert(68%) sepia(9%) saturate(214%) hue-rotate(126deg) brightness(94%) contrast(88%)',
    'brightness(0) saturate(100%) invert(56%) sepia(58%) saturate(488%) hue-rotate(90deg) brightness(96%) contrast(91%)',
    'brightness(0) saturate(100%) invert(55%) sepia(72%) saturate(1466%) hue-rotate(176deg) brightness(96%) contrast(92%)',
    'brightness(0) saturate(100%) invert(51%) sepia(71%) saturate(2347%) hue-rotate(238deg) brightness(95%) contrast(92%)',
  ];

  var TIER_GEAR_FILTERS = [
    'saturate(0.48) brightness(0.84) contrast(1.09)',
    'hue-rotate(78deg) saturate(0.82) brightness(0.86) contrast(1.06)',
    'hue-rotate(168deg) saturate(0.88) brightness(0.87) contrast(1.07)',
    'hue-rotate(228deg) saturate(0.9) brightness(0.86) contrast(1.08)',
  ];

  var MANU_PREFIX = {
    dad: 'daedalus',
    mal: 'maliwan',
    jak: 'jakobs',
    tor: 'torgue',
    vla: 'vladof',
    bor: 'ripper',
    ted: 'tediore',
    ord: 'order',
    atl: 'atlas',
    cov: 'cov',
    hyp: 'hyperion',
  };

  var MANU_LOGO = {
    atlas: 'ui_art_manu_logomark_atlas_small.png',
    cov: 'ui_art_manu_logomark_cov_small.png',
    daedalus: 'ui_art_manu_logomark_daedalus_small.png',
    hyperion: 'ui_art_manu_logomark_hyperion_small.png',
    jakobs: 'ui_art_manu_logomark_jakobs_small.png',
    maliwan: 'ui_art_manu_logomark_maliwan_small.png',
    order: 'ui_art_manu_logomark_order_small.png',
    ripper: 'ui_art_manu_logomark_ripper_small.png',
    tediore: 'ui_art_manu_logomark_tediore_small.png',
    torgue: 'ui_art_manu_logomark_torgue_small.png',
    vladof: 'ui_art_manu_logomark_vladof_small.png',
  };

  function tierIndex(kind) {
    var k = String(kind || '').toLowerCase();
    if (k === 'common') return 0;
    if (k === 'uncommon') return 1;
    if (k === 'rare') return 2;
    if (k === 'epic') return 3;
    if (k === 'legendary' || k === 'legendary_pool') return 4;
    if (k === 'pearl' || k === 'pearlescent') return 5;
    return -1;
  }

  function normWeaponKey(wt) {
    var w = String(wt || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (w === 'submachine gun') return 'smg';
    if (w === 'heavy') return 'heavy weapon';
    if (w === 'sniper') return 'sniper rifle';
    return w;
  }

  function weaponTypeFromComp(comp) {
    var code = String(comp || '').toUpperCase();
    if (!code) return null;
    if (/_HW\.|\b[A-Z]{3}_HW\b/.test(code)) return 'heavy weapon';
    if (/_AR\.|\b[A-Z]{3}_AR\b/.test(code)) return 'assault rifle';
    if (/_SM\.|\b[A-Z]{3}_SM\b/.test(code)) return 'smg';
    if (/_SG\.|\b[A-Z]{3}_SG\b/.test(code)) return 'shotgun';
    if (/_PS\.|\b[A-Z]{3}_PS\b/.test(code)) return 'pistol';
    if (/_SR\.|\b[A-Z]{3}_SR\b/.test(code)) return 'sniper rifle';
    var inv = String(comp || '').split('.')[0].toLowerCase();
    var m = inv.match(/_(ar|ps|sg|sm|sr|hw)$/);
    if (!m) return null;
    var map = { ar: 'assault rifle', ps: 'pistol', sg: 'shotgun', sm: 'smg', sr: 'sniper rifle', hw: 'heavy weapon' };
    return map[m[1]] || null;
  }

  function weaponTypeFromPoolKey(poolKey) {
    var p = String(poolKey || '').toLowerCase();
    if (/_hw(?:_|$)/.test(p) || /heavy/.test(p)) return 'heavy weapon';
    if (/_sr(?:_|$)/.test(p)) return 'sniper rifle';
    if (/_sg(?:_|$)/.test(p)) return 'shotgun';
    if (/_sm(?:_|$)/.test(p)) return 'smg';
    if (/_ps(?:_|$)/.test(p)) return 'pistol';
    if (/_ar(?:_|$)/.test(p)) return 'assault rifle';
    if (/guns/.test(p)) return 'assault rifle';
    return null;
  }

  function manufacturerFromComp(comp) {
    var inv = String(comp || '').split('.')[0].toLowerCase();
    var prefix = inv.split('_')[0];
    return MANU_PREFIX[prefix] || null;
  }

  function manufacturerFromPoolKey(poolKey) {
    if (!isManufacturerSpecificPool(poolKey)) return null;
    var p = String(poolKey || '').toLowerCase().replace(/^itempool_/, '');
    var prefix = p.split('_')[0];
    return MANU_PREFIX[prefix] || null;
  }

  /** True only for pools like itempool_dad_ar — not itempool_1st_shield or itempool_guns_01_common. */
  function isManufacturerSpecificPool(poolKey) {
    var p = String(poolKey || '').toLowerCase().replace(/^itempool_/, '');
    var prefix = p.split('_')[0];
    if (!MANU_PREFIX[prefix]) return false;
    if (/^(1st|enemies|guns|shields|gadgets|class|enhancements|terminal|assaultrifle|pistol|shotgun|smg|sniper)/.test(p)) return false;
    return true;
  }

  function manufacturerIconUrlForPool(poolKey) {
    var mfr = manufacturerFromPoolKey(poolKey);
    if (!mfr || !MANU_LOGO[mfr]) return '';
    return MANU_BASE + MANU_LOGO[mfr];
  }

  function legendaryAugFor(category, weaponType, comp) {
    var cat = String(category || '').toLowerCase();
    var wt = normWeaponKey(weaponType || weaponTypeFromComp(comp) || weaponTypeFromPoolKey(comp));
    if (!wt && comp) wt = normWeaponKey(weaponTypeFromComp(comp));
    if (cat === 'gun' || cat === 'heavy' || cat === 'gear') {
      if (wt && LEG_WEAPON_AUG[wt]) return LEG_BASE + LEG_WEAPON_AUG[wt];
      return LEG_BASE + LEG_WEAPON_AUG['assault rifle'];
    }
    if (CATEGORY_LEG_AUG[cat]) return LEG_BASE + CATEGORY_LEG_AUG[cat];
    return LEG_BASE + CATEGORY_LEG_AUG.gear;
  }

  function weaponSilhouetteUrl(weaponType) {
    var wt = normWeaponKey(weaponType);
    if (wt && WEAPON_TYPE_ICONS[wt]) return WEAPON_BASE + WEAPON_TYPE_ICONS[wt];
    return '';
  }

  function resolveIcon(d) {
    if (!d) return { url: '', filter: '' };

    var kind = String(d.kind || '').toLowerCase();
    var cat = String(d.category || '').toLowerCase();
    var comp = d.comp || '';
    var pool = d.itempool || '';
    var tier = tierIndex(kind);
    if (tier < 0 && comp) {
      var cm = String(comp).match(/\.comp_0([1-6])_/i);
      if (cm) tier = Number(cm[1]) - 1;
    }

    var wt = weaponTypeFromComp(comp) || weaponTypeFromPoolKey(pool) || weaponTypeFromPoolKey(comp);

    if (kind === 'shiny' || d.is_shiny) {
      var shinyUrl = weaponSilhouetteUrl(wt);
      if (shinyUrl) return { url: shinyUrl, filter: '' };
    }

    if (tier >= 0 && tier <= 3) {
      if (cat === 'gun' || cat === 'heavy' || (!cat && wt)) {
        var wUrl = weaponSilhouetteUrl(wt);
        if (wUrl) return { url: wUrl, filter: TIER_WEAPON_FILTERS[tier] || '' };
      }
      var gearUrl = legendaryAugFor(cat, wt, comp);
      return { url: gearUrl, filter: TIER_GEAR_FILTERS[tier] || '' };
    }

    if (tier === 4 || kind === 'legendary' || kind === 'legendary_pool') {
      return { url: legendaryAugFor(cat, wt, comp), filter: '' };
    }

    if (tier === 5 || kind === 'pearl') {
      if (cat === 'shield') return { url: PEARL_BASE + 'ico_pearl_aug_gun_shield.png', filter: '' };
      if (cat === 'grenade') return { url: PEARL_BASE + 'ico_pearl_aug_gun_grenade.png', filter: '' };
      if (cat === 'repkit') return { url: PEARL_BASE + 'ico_pearl_aug_gun_repkit.png', filter: '' };
      if (cat === 'class_mod') return { url: PEARL_BASE + 'ico_pearl_aug_gun_classmod.png', filter: '' };
      if (wt) {
        var pearlWt = {
          'assault rifle': 'ico_pearl_aug_gun_assault.png',
          pistol: 'ico_pearl_aug_gun_pistol.png',
          shotgun: 'ico_pearl_aug_gun_shotgun.png',
          smg: 'ico_pearl_aug_gun_smg.png',
          'sniper rifle': 'ico_pearl_aug_gun_sniper.png',
          'heavy weapon': 'ico_pearl_aug_gun_heavy.png',
        };
        if (pearlWt[wt]) return { url: PEARL_BASE + pearlWt[wt], filter: '' };
      }
      return { url: PEARL_BASE + 'ico_misc_pearl.png', filter: '' };
    }

    if (cat === 'gun' || cat === 'heavy') {
      var gunUrl = weaponSilhouetteUrl(wt);
      if (gunUrl) return { url: gunUrl, filter: '' };
    }

    if (CATEGORY_LEG_AUG[cat]) return { url: LEG_BASE + CATEGORY_LEG_AUG[cat], filter: '' };
    return { url: LEG_BASE + CATEGORY_LEG_AUG.gear, filter: '' };
  }

  function iconUrlForDrop(d) {
    return resolveIcon(d).url;
  }

  function manufacturerIconUrl(compOrPool) {
    if (isManufacturerSpecificPool(compOrPool)) {
      return manufacturerIconUrlForPool(compOrPool);
    }
    var mfr = manufacturerFromComp(compOrPool);
    if (!mfr || !MANU_LOGO[mfr]) return '';
    return MANU_BASE + MANU_LOGO[mfr];
  }

  function iconHtml(url, size, alt, filter) {
    if (!url) return '';
    var s = size || 18;
    var img = '<img class="loot-ref-icon" src="' + url + '" width="' + s + '" height="' + s + '" alt="' + (alt || '') + '" loading="lazy" decoding="async" onerror="this.style.visibility=\'hidden\'"/>';
    if (filter) {
      return '<span class="loot-ref-icon-filter-wrap" style="filter:' + filter + '">' + img + '</span>';
    }
    return img;
  }

  function dropIconHtml(d, size) {
    var resolved = resolveIcon(d);
    return iconHtml(resolved.url, size, d && d.label ? String(d.label) : '', resolved.filter);
  }

  function tierIconHtml(tier, size, category, comp, itempool) {
    return dropIconHtml({
      kind: tier,
      category: category || 'gear',
      comp: comp || '',
      itempool: itempool || '',
    }, size);
  }

  function poolHeaderIconHtml(poolRow) {
    if (!poolRow) return '';
    var sample = (poolRow.inv_comps && poolRow.inv_comps[0]) ? poolRow.inv_comps[0].comp : '';
    var mfrUrl = manufacturerIconUrlForPool(poolRow.itempool);
    var main = dropIconHtml({
      kind: poolRow.tier,
      category: poolRow.category,
      comp: sample,
      itempool: poolRow.itempool,
    }, 20);
    if (mfrUrl) {
      return iconHtml(mfrUrl, 16, 'Manufacturer', '') + main;
    }
    return main;
  }

  window.LootRefIcons = {
    iconUrlForDrop: iconUrlForDrop,
    manufacturerIconUrl: manufacturerIconUrl,
    manufacturerIconUrlForPool: manufacturerIconUrlForPool,
    isManufacturerSpecificPool: isManufacturerSpecificPool,
    iconHtml: iconHtml,
    dropIconHtml: dropIconHtml,
    tierIconHtml: tierIconHtml,
    poolHeaderIconHtml: poolHeaderIconHtml,
    headerToolboxIcon: LEG_BASE + 'ico_legendary_aug_gun_assault.png',
    headerSaveIcon: LEG_BASE + 'ico_legendary_aug_shield.png',
    headerBuilderIcon: LEG_BASE + 'ico_legendary_aug_repkit.png',
  };
})();
