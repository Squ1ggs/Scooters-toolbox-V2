/**
 * cc-guided-builder-rebuild.js
 * Main Guided Builder: populates dropdowns from STX_DATASET, wires Add buttons,
 * emits codes to outCode. Supports Weapon, Heavy, Shield, Grenade, Repkit, Enhancement, Class Mod.
 */
(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }

  function syncGuidedCustomSelectIfWrapped(sel) {
    if (!sel || typeof sel.__customSelectSync !== 'function') return;
    try { sel.__customSelectSync(); } catch (_) {}
  }

  function isGuidedClassModItemType(val) {
    return /class\s*mod|classmod/i.test(String(val || '').trim());
  }

  /** Order follows typical NCS weapon flow (see `NCS_SLOT_MAP` + Legit Builder); extras cover common part pools. */
  var WEAPON_SLOTS = [
    { key: 'rarity', label: 'Rarity ID', partType: 'Rarity', selectId: 'ccRaritySelect', btnId: 'ccAddRarity' },
    { key: 'body', label: 'Body', partType: 'Body', selectId: 'ccBodySelect', btnId: 'ccAddBody' },
    { key: 'bodyAcc', label: 'Body Accessory', partType: 'Body Accessory', selectId: 'ccBodyAccSelect', btnId: 'ccAddBodyAcc' },
    { key: 'bodyEle', label: 'Body Element', partType: 'Body', selectId: 'ccWeaponBodyEleSelect', btnId: 'ccAddWeaponBodyEle' },
    { key: 'barrel', label: 'Barrel', partType: 'Barrel', selectId: 'ccBarrelSelect', btnId: 'ccAddBarrel' },
    { key: 'barrelAcc', label: 'Barrel Accessory', partType: 'Barrel Accessory', selectId: 'ccBarrelAccSelect', btnId: 'ccAddBarrelAcc' },
    { key: 'hyperionSecondaryAcc', label: 'Hyperion Shield', partType: 'Manufacturer Part', selectId: 'ccWeaponHypShieldSelect', btnId: 'ccAddWeaponHypShield' },
    { key: 'mag', label: 'Magazine', partType: 'Magazine', selectId: 'ccMagazineSelect', btnId: 'ccAddMagazine' },
    { key: 'magazineAcc', label: 'Magazine Accessory', partType: 'Magazine', selectId: 'ccWeaponMagAccSelect', btnId: 'ccAddWeaponMagAcc' },
    { key: 'magazineTedThrown', label: 'Tediore Thrown Mag', partType: 'Magazine', selectId: 'ccWeaponMagTedSelect', btnId: 'ccAddWeaponMagTed' },
    { key: 'scope', label: 'Scope', partType: 'Scope', selectId: 'ccScopeSelect', btnId: 'ccAddScope' },
    { key: 'scopeAcc', label: 'Scope Accessory', partType: 'Scope Accessory', selectId: 'ccScopeAccSelect', btnId: 'ccAddScopeAcc' },
    { key: 'grip', label: 'Grip', partType: 'Grip', selectId: 'ccGripSelect', btnId: 'ccAddGrip' },
    { key: 'underbarrel', label: 'Underbarrel', partType: 'Underbarrel', selectId: 'ccUnderbarrelSelect', btnId: 'ccAddUnderbarrel' },
    { key: 'foregrip', label: 'Foregrip', partType: 'Foregrip', selectId: 'ccForegripSelect', btnId: 'ccAddForegrip' },
    { key: 'secondaryAmmo', label: 'Secondary Ammo', partType: 'Manufacturer Part', selectId: 'ccWeaponSecondaryAmmoSelect', btnId: 'ccAddWeaponSecondaryAmmo' },
    { key: 'secondaryEle', label: 'Secondary Element (Maliwan)', partType: 'Element Switch', selectId: 'ccElementSwitchSelect', btnId: 'ccAddElementSwitch', maliwanOnly: true },
    { key: 'weaponPearl', label: 'Pearl Parts', pearlPick: true, selectId: 'ccWeaponPearlSelect', btnId: 'ccAddWeaponPearl' },
    { key: 'licensed', label: 'Licensed Manufacturer Part', partType: 'Manufacturer Part', selectId: 'ccLicensedSelect', btnId: 'ccAddLicensed' },
    { key: 'element', label: 'Element', partType: 'Element', selectId: 'ccElementPartSelect', btnId: 'ccAddElementStack' }
  ];

  /** Shown as a disabled option when a pool is empty so users know to widen filters. */
  var GUIDED_HINT_EMPTY_BODY_ELEMENT = '(Empty) Turn on "All manufacturers\' parts in dropdowns" above, then open this list again — body element parts are shared across manufacturers.';
  var GUIDED_HINT_EMPTY_MALIWAN_SWITCH = '(Empty) Maliwan guns only. If nothing appears, turn on "All manufacturers\' parts in dropdowns" above so Maliwan switch parts can load.';

  var ELEMENTS = [
    { key: 'None', code: '' },
    { key: 'Corrosive', code: '{1:10}', iconFile: 'pearl_elemental_corrosive.png' },
    { key: 'Cryo', code: '{1:11}', iconFile: 'pearl_elemental_cryo.png' },
    { key: 'Fire', code: '{1:12}', iconFile: 'pearl_elemental_fire.png' },
    { key: 'Radiation', code: '{1:13}', iconFile: 'pearl_elemental_radiation.png' },
    { key: 'Shock', code: '{1:14}', iconFile: 'pearl_elemental_shock.png' }
  ];

  /** In-repo textures only (see assets/img/elements/). */
  var CC_ELEMENT_ICON_BASE = './assets/img/elements/';
  /** Multi-element UI art for “no element selected” row (weapon Element stack). */
  var CC_ELEMENT_PLACEHOLDER_ICON_FILE = 'ico_elemental_all.png';
  /** Manufacturer logomarks + weapon-type chips (see assets/img/guided-dropdowns/). */
  var CC_GUIDED_DROPDOWN_BASE = './assets/img/guided-dropdowns/';
  /** BL UI: ico_ui_art_item_augments / legendary_augments — for legendary barrel rows. */
  var CC_GUIDED_LEGENDARY_AUG_BASE = CC_GUIDED_DROPDOWN_BASE + 'legendary-augments/';
  /** DLC pearl slot icons (dlc_rarity_pips) — weapon/gear class for pearlescent rows. */
  var CC_GUIDED_PEARL_ITEMTYPE_BASE = CC_GUIDED_DROPDOWN_BASE + 'pearl-item-types/';

  var CC_GUIDED_RARITY_SELECT_IDS = { ccRaritySelect: 1, ccHeavyRaritySelect: 1, ccRepkitRaritySelect: 1 };
  var CC_GUIDED_ELEMENTISH_SELECT_IDS = {
    ccWeaponBodyEleSelect: 1,
    ccElementSwitchSelect: 1,
    ccElementPartSelect: 1,
    ccGrenadeElementSelect: 1,
    ccHeavyElementSelect: 1,
    ccHeavyElementSwitchSelect: 1,
    ccShieldElementSelect: 1,
    ccRepkitElementSelect: 1,
    ccClassModElementSelect: 1,
    toolsDualElementSelect: 1
  };

  /** Pearl / part_pearl rows: generic pearl icon on the empty first option. */
  var CC_GUIDED_PEARL_SELECT_IDS = {
    ccWeaponPearlSelect: 1,
    toolsPearlElementSelect: 1
  };

  var CC_GUIDED_LEGENDARY_PERK_SELECT_IDS = {
    ccRepkitLegendarySelect: true,
    ccHeavyLegendarySelect: true,
    ccGuidedLegendaryPerkSelect: true
  };

  function ccPartMatchesPearlRarityAllowlist(p) {
    if (typeof window.stxPartMatchesPearlRarityIdAllowlist === 'function') {
      return window.stxPartMatchesPearlRarityIdAllowlist(p);
    }
    return false;
  }

  function ccPartLooksPearlRarityId(p) {
    return ccPartMatchesPearlRarityAllowlist(p);
  }

  function ccPartLooksLegendaryRarityId(p) {
    if (!p) return false;
    var its = String(p.itemTypeString || '').toLowerCase();
    var code = String(p.code || p.spawnCode || p.importCode || '').toLowerCase();
    var nm = String((p.legendaryName || p.name || '')).toLowerCase();
    if (/comp_05_legendary/.test(its) || /comp_05_legendary/.test(code) || /comp_05_legendary/.test(nm)) return true;
    // Fallback: treat as legendary only if it says legendary but not pearlescent/pearl rarity-id.
    if (its.indexOf('legendary') !== -1 && !ccPartLooksPearlRarityId(p) && nm.indexOf('pearlescent') === -1) return true;
    return false;
  }

  /** Weapon / heavy body + body accessory: same pearl / legendary aug icons as barrels. */
  var GUIDED_BODY_SLOT_IDS = {
    ccBodySelect: true,
    ccBodyAccSelect: true,
    ccHeavyBodySelect: true,
    ccHeavyBodyAccSelect: true
  };

  function maybeDecoratedGuidedSelectPlaceholder(sel) {
    if (!sel || !sel.id) return;
    var fo = sel.options[0];
    if (!fo || String(fo.value || '').trim() !== '') return;
    var id = String(sel.id);
    if (CC_GUIDED_PEARL_SELECT_IDS[id]) {
      applyDataCcIconFullUrl(fo, CC_GUIDED_PEARL_ITEMTYPE_BASE + 'ico_misc_pearl.png');
      return;
    }
    if (CC_GUIDED_ELEMENTISH_SELECT_IDS[id]) {
      applyDataCcIconIfAny(fo, CC_ELEMENT_PLACEHOLDER_ICON_FILE);
    }
  }

  function guessElementIconFromBlob(blob) {
    var s = String(blob || '').toLowerCase();
    if (!s) return '';
    if (s.indexOf('corrosive') !== -1) return 'pearl_elemental_corrosive.png';
    if (s.indexOf('cryo') !== -1) return 'pearl_elemental_cryo.png';
    if (s.indexOf('radiation') !== -1 || s.indexOf('_rad_') !== -1 || /\brad_shock\b/.test(s) || /\brad_cryo\b/.test(s)) return 'pearl_elemental_radiation.png';
    if (s.indexOf('shock') !== -1) return 'pearl_elemental_shock.png';
    if (s.indexOf('kinetic') !== -1) return 'pearl_elemental_kinetic.png';
    if (s.indexOf('incendiary') !== -1 || s.indexOf('ele_fire') !== -1 || /\b_fire\b/.test(s) || /\bfire_rad\b/.test(s) || /\bfire_shock\b/.test(s)) return 'pearl_elemental_fire.png';
    return '';
  }

  function ccResolveElementIconFilename(p) {
    if (!p) return '';
    var its = String(p.itemTypeString != null ? p.itemTypeString : '').toLowerCase();
    var code = String(p.code != null ? p.code : '').toLowerCase();
    var nm = String((p.name || p.legendaryName || '')).toLowerCase();
    var blob = its + ' ' + code + ' ' + nm;

    if (/\bpearl_(damage|reload|firerate|handling)\b/.test(blob)) return 'ico_misc_pearl.png';

    var pe = its.match(/\bpearl_(normal|shock|radiation|corrosive|cryo|fire)\b/);
    if (pe) {
      if (pe[1] === 'normal') return 'pearl_elemental_kinetic.png';
      return 'pearl_elemental_' + pe[1] + '.png';
    }

    if (/part_pearl/i.test(code)) {
      var g = guessElementIconFromBlob(blob);
      return g || 'ico_misc_pearl.png';
    }

    return guessElementIconFromBlob(blob);
  }

  /** Legendary augment PNG (`legendary_augments/`) by gear category + weapon class. */
  function ccLegendaryAugIconUrlForPartGear(p) {
    if (!p) return '';
    if (ccSpawnCodeLooksLikeWeaponFamily(p)) {
      var gunAugFirst = ccLegendaryAugIconUrlFromWeaponKey(ccNormalizedWeaponTypeKey(p));
      if (gunAugFirst) return gunAugFirst;
    }
    var cat = String(p.category || '').trim().toLowerCase();
    if (cat === 'character') cat = 'class mod';
    var byCat = {
      shield: 'ico_legendary_aug_shield.png',
      repkit: 'ico_legendary_aug_repkit.png',
      grenade: 'ico_legendary_aug_grenade.png',
      'class mod': 'ico_legendary_aug_classmod.png',
      'heavy weapon': 'ico_legendary_aug_heavy.png',
      gadget: 'ico_legendary_aug_heavy.png'
    };
    if (byCat[cat]) return CC_GUIDED_LEGENDARY_AUG_BASE + byCat[cat];
    var fn = ccLegendaryAugIconUrlFromWeaponKey(ccNormalizedWeaponTypeKey(p));
    if (fn) return fn;
    // Last resort so legendary-perk dropdowns always have an icon.
    return CC_GUIDED_LEGENDARY_AUG_BASE + 'ico_legendary_aug_gun_assault.png';
  }

  /** Rarity ID dropdown: show comp tier icons (common->tinted, legendary->gold, pearlescent->pearl). */
  function applyGuidedRarityPartOptionIcon(opt, p) {
    if (!opt || !p) return;
    opt.removeAttribute('data-cc-icon-filter');

    var its = String(p.itemTypeString || '').toLowerCase();
    var code = String(p.code || '').toLowerCase();
    var nm = String((p.legendaryName || p.name || '')).toLowerCase();
    var blob = its + ' ' + code + ' ' + nm;

    // Infer BL comp tier (0..5) from row tokens.
    var tier = null;
    // Pearlescent tier only for user-curated pearlescent rarity-id names (shared allowlist).
    if (ccPartMatchesPearlRarityAllowlist(p)) tier = 5;
    if (tier == null) {
      if (blob.indexOf('comp_01_common') !== -1) tier = 0;
      else if (blob.indexOf('comp_02_uncommon') !== -1) tier = 1;
      else if (blob.indexOf('comp_03_rare') !== -1) tier = 2;
      else if (blob.indexOf('comp_04_epic') !== -1) tier = 3;
      else if (blob.indexOf('comp_05_legendary') !== -1) tier = 4;
    }
    if (tier == null) return;

    // Pearl tier: elemental art, then pearl slot icon by gear class, then fallback.
    if (tier === 5) {
      if (/\bpearl_(damage|reload|firerate|handling)\b/.test(blob)) {
        applyDataCcIconFullUrl(opt, CC_GUIDED_PEARL_ITEMTYPE_BASE + 'ico_misc_pearl.png');
        return;
      }
      var pe = its.match(/\bpearl_(normal|shock|radiation|corrosive|cryo|fire)\b/);
      if (pe) {
        applyDataCcIconIfAny(
          opt,
          pe[1] === 'normal' ? 'pearl_elemental_kinetic.png' : 'pearl_elemental_' + pe[1] + '.png'
        );
        return;
      }
      var slotUrl = ccPearlSlotAugFullUrl(p);
      if (slotUrl) {
        applyDataCcIconFullUrl(opt, slotUrl);
        return;
      }
      var g = guessElementIconFromBlob(blob);
      if (g) applyDataCcIconIfAny(opt, g);
      else applyDataCcIconFullUrl(opt, CC_GUIDED_PEARL_ITEMTYPE_BASE + 'ico_misc_pearl.png');
      return;
    }

    // Legendary comp tier: `legendary_augments` art (per gear class), then tinted weapon chip fallback.
    if (tier === 4) {
      var legAug = ccLegendaryAugIconUrlForPartGear(p);
      if (legAug) {
        applyDataCcIconFullUrl(opt, legAug);
        return;
      }
    }

    // Non-pearl comp tiers (common..epic): weapon-type icon with tint.
    var tierFilters = [
      'grayscale(0.5) brightness(0.85)',                                // common
      'sepia(0.45) saturate(1.7) hue-rotate(48deg) brightness(0.9)',    // uncommon
      'sepia(0.32) saturate(2.1) hue-rotate(195deg) brightness(0.94)',  // rare
      'sepia(0.38) saturate(2.6) hue-rotate(268deg) brightness(1.0)'    // epic
    ];
    var filter = tierFilters[tier] || '';

    var k = ccNormalizedWeaponTypeKey(p);
    if (!k) return;
    var png = ccGuidedWeaponTypePngUrlFromKey(k);
    var iconUrl = png || ccGuidedWeaponTypeIconDataUrl(p);
    if (!iconUrl) return;
    applyDataCcIconFullUrl(opt, iconUrl);
    if (filter) opt.setAttribute('data-cc-icon-filter', filter);
  }

  function applyDataCcIconIfAny(opt, filename) {
    if (!opt || !filename) return;
    opt.setAttribute('data-cc-icon', CC_ELEMENT_ICON_BASE + filename);
  }

  function applyDataCcIconFullUrl(opt, url) {
    if (!opt || !url) return;
    opt.setAttribute('data-cc-icon', String(url).trim());
  }

  /** Letter chips as inline SVG (no external PNGs required). */
  var CC_WEAPON_TYPE_ICON_LABELS = {
    'assault rifle': 'AR',
    pistol: 'PS',
    shotgun: 'SG',
    smg: 'SMG',
    'submachine gun': 'SMG',
    'sniper rifle': 'SR',
    sniper: 'SR',
    'heavy weapon': 'HW',
    heavy: 'HW'
  };

  function ccEscapeSvgText(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Resolve weapon class from fields, then spawn code (legendary rows often omit itemType). */
  function ccNormalizedWeaponTypeKey(p) {
    if (!p) return '';
    var wt = String(p.weaponType || p.itemType || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (wt === 'submachine gun') wt = 'smg';
    if (CC_WEAPON_TYPE_ICON_LABELS[wt]) return wt;

    var c = String(p.code || p.spawnCode || p.importCode || '').replace(/^["']|["']$/g, '').toUpperCase();
    if (!c) return '';
    if (/_HW\.|\bMAL_HW\b|\bTOR_HW\b|\bBOR_HW\b|\bVLA_HW\b|\bJAK_HW\b|\bTED_HW\b/i.test(c)) return 'heavy weapon';
    if (/_AR\.|\bDAD_AR\b|\bJAK_AR\b|\bATL_AR\b|\bVLA_AR\b|\bMAL_AR\b|\bTED_AR\b|\bHYP_AR\b/i.test(c)) return 'assault rifle';
    if (/_SM\.|\bDAD_SM\b|\bJAK_SM\b|\bMAL_SM\b|\bVLA_SM\b|\bTED_SM\b|\bHYP_SM\b/i.test(c)) return 'smg';
    if (/_SG\.|\bDAD_SG\b|\bJAK_SG\b|\bMAL_SG\b|\bVLA_SG\b|\bTED_SG\b|\bHYP_SG\b/i.test(c)) return 'shotgun';
    if (/_PS\.|\bDAD_PS\b|\bJAK_PS\b|\bMAL_PS\b|\bVLA_PS\b|\bTED_PS\b|\bHYP_PS\b/i.test(c)) return 'pistol';
    if (/_SR\.|\bDAD_SR\b|\bJAK_SR\b|\bMAL_SR\b|\bVLA_SR\b|\bTED_SR\b|\bHYP_SR\b/i.test(c)) return 'sniper rifle';
    return '';
  }

  /** Weapon / HW spawn prefixes — never use shield/repkit/class-mod aug art for these rows. */
  function ccSpawnCodeLooksLikeWeaponFamily(p) {
    if (!p) return false;
    var c = String(p.code || p.spawnCode || p.importCode || '').replace(/^["']|["']$/g, '').toLowerCase();
    return /\.(ar|ps|sg|sm|sr|hw)\./.test(c);
  }

  function ccWeaponFamilyPearlAugFilename(p) {
    var kw = ccNormalizedWeaponTypeKey(p);
    if (kw === 'submachine gun') kw = 'smg';
    var map = {
      'assault rifle': 'ico_pearl_aug_gun_assault.png',
      pistol: 'ico_pearl_aug_gun_pistol.png',
      shotgun: 'ico_pearl_aug_gun_shotgun.png',
      smg: 'ico_pearl_aug_gun_smg.png',
      'sniper rifle': 'ico_pearl_aug_gun_sniper.png',
      sniper: 'ico_pearl_aug_gun_sniper.png',
      'heavy weapon': 'ico_pearl_aug_gun_heavy.png',
      heavy: 'ico_pearl_aug_gun_heavy.png'
    };
    return map[kw] || 'ico_pearl_aug_gun_assault.png';
  }

  /** DLC pearl slot art (ico_pearl_aug_gun_*) by gear category / weapon class. */
  function ccPearlSlotAugFullUrl(p) {
    if (!p) return '';
    if (ccSpawnCodeLooksLikeWeaponFamily(p)) {
      return CC_GUIDED_PEARL_ITEMTYPE_BASE + ccWeaponFamilyPearlAugFilename(p);
    }
    var cat = String(p.category || '').trim().toLowerCase();
    if (cat === 'character') cat = 'class mod';
    var fn = '';
    if (cat === 'class mod') fn = 'ico_pearl_aug_gun_classmod.png';
    else if (cat === 'grenade') fn = 'ico_pearl_aug_gun_grenade.png';
    else if (cat === 'repkit') fn = 'ico_pearl_aug_gun_repkit.png';
    else if (cat === 'shield') fn = 'ico_pearl_aug_gun_shield.png';
    else if (cat === 'heavy weapon' || cat === 'gadget') fn = 'ico_pearl_aug_gun_heavy.png';
    else if (cat === 'weapon') {
      fn = ccWeaponFamilyPearlAugFilename(p);
      if (fn === 'ico_pearl_aug_gun_assault.png' && !ccNormalizedWeaponTypeKey(p)) fn = '';
    }
    if (!fn) return '';
    return CC_GUIDED_PEARL_ITEMTYPE_BASE + fn;
  }

  // Legend/pearlescent icons can be tied to base parts by name.
  // Example: base barrel "Rowan's Charge" does not contain `comp_05_legendary`
  // in its own `code`, but a separate rarity-id row exists whose `effects` is
  // exactly "Rowan's Charge". For UI purposes, we want the base part to use
  // the rarity-id icon.
  var CC_RARITY_ID_EFFECT_TO_LEGENDARY_AUG_URL = null;
  var CC_RARITY_ID_LEGENDARY_TOKEN_TO_AUG_URL = null;

  function ccInitRarityIdIconLookups() {
    if (CC_RARITY_ID_EFFECT_TO_LEGENDARY_AUG_URL && CC_RARITY_ID_LEGENDARY_TOKEN_TO_AUG_URL) return;
    CC_RARITY_ID_EFFECT_TO_LEGENDARY_AUG_URL = Object.create(null);
    CC_RARITY_ID_LEGENDARY_TOKEN_TO_AUG_URL = Object.create(null);

    var all = getAllParts();
    if (!all || !all.length) return;

    for (var i = 0; i < all.length; i++) {
      var p = all[i];
      if (!p) continue;
      var pt = String(p.partType || '').trim().toLowerCase();
      if (pt !== 'rarity') continue;

      var code = String(p.code || p.spawnCode || p.importCode || '').toLowerCase();
      var catLow = String(p.category || '').trim().toLowerCase();
      if (catLow === 'classmod' || catLow === 'class mod') continue;
      if (code.indexOf('classmod_') !== -1) continue;

      var effectsRaw = String(p.effects || p.effect || p.name || '').trim();
      if (!effectsRaw) continue;
      var effectsKeyNorm = effectsRaw.toLowerCase().replace(/[^a-z0-9]/g, '');

      var rarityTokenFromCode = '';
      var compLegendIdx = code.indexOf('comp_05_legendary_');
      if (compLegendIdx !== -1) {
        rarityTokenFromCode = code.slice(compLegendIdx + 'comp_05_legendary_'.length);
      } else {
        // Fallback for non-legendary rarity-id rows: keep last underscore chunk.
        rarityTokenFromCode = String(code || '')
          .replace(/^["']|["']$/g, '')
          .split('_')
          .pop();
      }
      // Normalize so `crowd_sourced`, `Crowd-Sourced`, `CrowdSourced` all match.
      rarityTokenFromCode = String(rarityTokenFromCode || '')
        .replace(/[^a-z0-9]/g, '')
        .toLowerCase();

      // Legendary rarity-id: uses `comp_05_legendary` in code.
      if (code.indexOf('comp_05_legendary') !== -1) {
        var iconUrl = ccLegendaryAugIconUrlForPartGear(p);
        if (iconUrl) CC_RARITY_ID_EFFECT_TO_LEGENDARY_AUG_URL[effectsKeyNorm] = iconUrl;
        if (rarityTokenFromCode && iconUrl) CC_RARITY_ID_LEGENDARY_TOKEN_TO_AUG_URL[rarityTokenFromCode] = iconUrl;
      }
    }
  }

  function ccLegendaryAugIconUrlForPartIfTiedByName(p) {
    if (!p) return '';
    var pt = String(p.partType || '').trim().toLowerCase();
    if (!/barrel|body/.test(pt)) return '';
    ccInitRarityIdIconLookups();
    var token = '';
    var code = String(p.code || p.spawnCode || p.importCode || '').toLowerCase();
    code = code.replace(/^["']|["']$/g, '');
    var partBarrelIdx = code.indexOf('part_barrel_');
    if (partBarrelIdx !== -1) {
      // Capture after `part_barrel_<something>_` preserving internal underscores.
      var m = code.match(/part_barrel_[0-9a-z]+_(.+)$/);
      token = m ? m[1] : code.slice(partBarrelIdx + 'part_barrel_'.length);
    } else {
      var partBodyIdx = code.indexOf('part_body_');
      if (partBodyIdx !== -1) {
        var m2 = code.match(/part_body_[0-9a-z]+_(.+)$/);
        token = m2 ? m2[1] : code.slice(partBodyIdx + 'part_body_'.length);
      } else {
        token = code.split('_').pop();
      }
    }
    token = String(token || '')
      .replace(/[^a-z0-9]/g, '')
      .toLowerCase();
    var isW = ccSpawnCodeLooksLikeWeaponFamily(p);
    var shortNumericTok = /^[0-9]+$/.test(token) && token.length <= 2;
    if (token && !shortNumericTok && CC_RARITY_ID_LEGENDARY_TOKEN_TO_AUG_URL[token]) {
      var uTok = CC_RARITY_ID_LEGENDARY_TOKEN_TO_AUG_URL[token];
      if (!isW || !/ico_legendary_aug_classmod/i.test(uTok)) return uTok;
    }

    // Fallback: match by rarity-id effects naming.
    var k = String(p.name || p.legendaryName || '').trim().toLowerCase();
    if (!k) return '';
    var kNorm = k.replace(/[^a-z0-9]/g, '');
    var uEff = CC_RARITY_ID_EFFECT_TO_LEGENDARY_AUG_URL[kNorm] || '';
    if (uEff && isW && /ico_legendary_aug_classmod/i.test(uEff)) return '';
    return uEff;
  }

  function ccIsPearlByRarityIdEffectName(p) {
    if (!p) return false;
    var pt = String(p.partType || '').trim().toLowerCase();
    if (!/barrel|body/.test(pt)) return false;
    return ccPartMatchesPearlRarityAllowlist(p);
  }

  function ccPartLooksLegendaryBarrel(p) {
    if (!p) return false;
    // Keep explicit Legendary name/partType matches as a fallback,
    // but prefer the rarity-id signal for correctness (avoid misclassifying incidental text).
    if (String(p.legendaryName || '').trim()) return true;
    if (/legendary/i.test(String(p.partType || ''))) return true;
    // Prefer explicit rarity-id signal so we only show legendary aug art for rows
    // that are truly tied to Legendary rarity-id items.
    if (ccPartLooksLegendaryRarityId(p)) return true;
    // Base barrel (partType: Barrel) can be tied to legendary rarity-id via name match.
    if (ccLegendaryAugIconUrlForPartIfTiedByName(p)) return true;
    var c = String(p.code || p.spawnCode || p.importCode || '').replace(/^["']|["']$/g, '').toLowerCase();
    return c.indexOf('comp_05_legendary') !== -1;
  }

  function ccLegendaryAugIconUrlFromWeaponKey(key) {
    var k = String(key || '').trim().toLowerCase();
    if (k === 'submachine gun') k = 'smg';
    var map = {
      'assault rifle': 'ico_legendary_aug_gun_assault.png',
      pistol: 'ico_legendary_aug_gun_pistol.png',
      shotgun: 'ico_legendary_aug_gun_shotgun.png',
      smg: 'ico_legendary_aug_gun_smg.png',
      'sniper rifle': 'ico_legendary_aug_gun_sniper.png',
      sniper: 'ico_legendary_aug_gun_sniper.png',
      'heavy weapon': 'ico_legendary_aug_heavy.png',
      heavy: 'ico_legendary_aug_heavy.png'
    };
    var fn = map[k];
    return fn ? CC_GUIDED_LEGENDARY_AUG_BASE + fn : '';
  }

  function ccGuidedLegendaryAugIconUrlForPart(p) {
    if (!ccPartLooksLegendaryBarrel(p)) return '';
    return ccLegendaryAugIconUrlForPartGear(p);
  }

  function ccGuidedWeaponTypeIconDataUrl(p) {
    var key = ccNormalizedWeaponTypeKey(p);
    if (!key) return '';
    var label = CC_WEAPON_TYPE_ICON_LABELS[key];
    if (!label) return '';
    var fs = label.length >= 3 ? 6.5 : 8.5;
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">' +
      '<rect x="1" y="1" width="20" height="20" rx="5" fill="rgba(6,22,38,0.92)" stroke="#00e5ff" stroke-width="1.1"/>' +
      '<text x="11" y="14.5" text-anchor="middle" font-size="' + fs + '" font-family="system-ui,Segoe UI,sans-serif" font-weight="700" fill="#c8fbff">' +
      ccEscapeSvgText(label) +
      '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function ccGuidedWeaponTypePngUrlFromKey(key) {
    var files = {
      'assault rifle': 'weapon-type/ico_ui_art_assault_small.png',
      pistol: 'weapon-type/ico_ui_art_pistol_small.png',
      shotgun: 'weapon-type/ico_ui_art_shotgun_small.png',
      smg: 'weapon-type/ico_ui_art_smg_small.png',
      'sniper rifle': 'weapon-type/ico_ui_art_sniper_small.png',
      sniper: 'weapon-type/ico_ui_art_sniper_small.png',
      'heavy weapon': 'weapon-type/ico_ui_art_heavy_small.png',
      heavy: 'weapon-type/ico_ui_art_heavy_small.png'
    };
    var rel = files[key];
    return rel ? CC_GUIDED_DROPDOWN_BASE + rel : '';
  }

  /** Prefer shipped UI PNGs for barrel rows; legendary barrels use BL legendary augment art. */
  function ccGuidedWeaponTypeIconForPart(p) {
    if (ccPartLooksLegendaryBarrel(p)) {
      var leg = ccGuidedLegendaryAugIconUrlForPart(p);
      if (leg) return leg;
    }
    var k = ccNormalizedWeaponTypeKey(p);
    if (k) {
      var png = ccGuidedWeaponTypePngUrlFromKey(k);
      if (png) return png;
    }
    return ccGuidedWeaponTypeIconDataUrl(p);
  }

  function applyGuidedPartOptionIcon(sel, opt, p) {
    if (!sel || !opt || !p) return;
    var sid = String(sel.id || '');
    if (CC_GUIDED_RARITY_SELECT_IDS[sid]) {
      applyGuidedRarityPartOptionIcon(opt, p);
      return;
    }
    if (CC_GUIDED_LEGENDARY_PERK_SELECT_IDS[sid]) {
      // Legendary perks inherit the rarity-id style:
      // - pearlescent rows get pearl pip/aug art (from DLC rarity packs)
      // - legendary rows get legendary aug art (gold augment logos)
      if (ccPartLooksPearlRarityId(p)) {
        var fp = ccResolveElementIconFilename(p);
        if (fp && /^pearl_elemental_/.test(fp)) {
          applyDataCcIconIfAny(opt, fp);
          return;
        }
        var slotUrl = ccPearlSlotAugFullUrl(p);
        if (slotUrl) applyDataCcIconFullUrl(opt, slotUrl);
        else applyDataCcIconFullUrl(opt, CC_GUIDED_PEARL_ITEMTYPE_BASE + 'ico_misc_pearl.png');
        return;
      }

      // Default for Legendary Perk sections: use legendary aug art even when
      // the row lacks explicit `comp_05_legendary` text tokens.
      var leg = ccLegendaryAugIconUrlForPartGear(p);
      if (leg) {
        applyDataCcIconFullUrl(opt, leg);
        return;
      }

      // Fallback to tier icon inference if category/weapon type was missing.
      applyGuidedRarityPartOptionIcon(opt, p);
      return;
    }
    if (CC_GUIDED_PEARL_SELECT_IDS[sid]) {
      var fp = ccResolveElementIconFilename(p);
      if (fp && /^pearl_elemental_/.test(fp)) {
        applyDataCcIconIfAny(opt, fp);
        return;
      }
      var pAug = ccPearlSlotAugFullUrl(p);
      if (pAug) {
        applyDataCcIconFullUrl(opt, pAug);
        return;
      }
      if (fp === 'ico_misc_pearl.png') applyDataCcIconFullUrl(opt, CC_GUIDED_PEARL_ITEMTYPE_BASE + fp);
      else if (fp) applyDataCcIconIfAny(opt, fp);
      return;
    }
    if (CC_GUIDED_ELEMENTISH_SELECT_IDS[sid]) {
      var f2 = guessElementIconFromBlob(String((p.itemTypeString || '') + ' ' + (p.code || '') + ' ' + (p.name || p.legendaryName || '')).toLowerCase());
      if (f2) applyDataCcIconIfAny(opt, f2);
    }
    if (GUIDED_BARREL_ACCESSORY_SELECT_IDS[sid]) {
      opt.removeAttribute('data-cc-icon');
      opt.removeAttribute('data-cc-icon-filter');
      return;
    }
    if (GUIDED_BARREL_FAMILY_SELECT_IDS[sid] || GUIDED_BODY_SLOT_IDS[sid]) {
      // If this base barrel/body is tied to a rarity-id by name,
      // prefer the rarity-id icons over any weapon-type fallback.
      if (ccIsPearlByRarityIdEffectName(p)) {
        applyDataCcIconFullUrl(opt, CC_GUIDED_PEARL_ITEMTYPE_BASE + 'ico_misc_pearl.png');
        return;
      }
      var tiedLegendUrl = ccLegendaryAugIconUrlForPartIfTiedByName(p);
      if (tiedLegendUrl) {
        applyDataCcIconFullUrl(opt, tiedLegendUrl);
        return;
      }

      // Pearlescent body/barrel rows: pearl pip / elemental art.
      var its2 = String(p.itemTypeString || '').toLowerCase();
      var code2 = String(p.code || '').toLowerCase();
      var nm2 = String((p.legendaryName || p.name || '')).toLowerCase();
      var blob2 = its2 + ' ' + code2 + ' ' + nm2;
      if (ccPartMatchesPearlRarityAllowlist(p)) {
        applyGuidedRarityPartOptionIcon(opt, p);
        return;
      }

      // Legendary body/barrel rows: `legendary_augments` art (per gear class).
      var looksLegendary2 =
        ccPartLooksLegendaryBarrel(p) ||
        /comp_05_legendary/.test(blob2) ||
        nm2.indexOf('legendary') !== -1;
      if (looksLegendary2) {
        var leg2 = ccLegendaryAugIconUrlForPartGear(p);
        if (leg2) {
          applyDataCcIconFullUrl(opt, leg2);
          return;
        }
      }

      var wu = ccGuidedWeaponTypeIconForPart(p);
      if (wu) applyDataCcIconFullUrl(opt, wu);
    }
  }

  /** Preset element row for weapon stack: show human name + universal `{1:10}` token in the list. */
  function guidedPresetElementOptionLabel(row) {
    if (!row) return '';
    var k = String(row.key || '').trim();
    var c = String(row.code || '').trim();
    if (!c) return k || '—';
    return k + ' (' + c + ')';
  }

  function getAllParts() {
    var ds = window.STX_DATASET;
    return (ds && Array.isArray(ds.ALL_PARTS)) ? ds.ALL_PARTS : (Array.isArray(window.ALL_PARTS) ? window.ALL_PARTS : []);
  }

  /** Align state.idMode + both checkboxes (#idMode Simple, #ccPartEntryMode Guided/advanced). */
  function syncIdModeFromCheckbox() {
    try {
      var idEl = document.getElementById('idMode');
      var ccEl = document.getElementById('ccPartEntryMode');
      var st = window.state || window.__STX_SIMPLE_STATE;
      var v;
      if (idEl && typeof idEl.checked === 'boolean') {
        v = !!idEl.checked;
        if (ccEl && ccEl.checked !== v) ccEl.checked = v;
      } else if (ccEl && typeof ccEl.checked === 'boolean') {
        v = !!ccEl.checked;
      } else {
        v = true;
      }
      if (st && typeof st === 'object') st.idMode = v;
    } catch (_) {}
  }

  function getPartToken(p) {
    if (!p) return '';
    syncIdModeFromCheckbox();
    if (typeof window.tokenForPart === 'function') {
      try {
        var tok = window.tokenForPart(p);
        if (tok) return tok;
      } catch (_) {}
    }
    var st = window.state || window.__STX_SIMPLE_STATE;
    var idMode = !!(st && st.idMode);
    var c = (p.code || p.spawnCode || p.raw || '').trim();
    var unwrap = function (s) { return (s.startsWith('"') && s.endsWith('"')) ? s.slice(1, -1) : s; };
    if (!idMode) {
      if (c) return unwrap(c);
    } else {
      var raw = (p.idRaw || p.idraw || '').trim();
      var fam = p.family != null ? String(p.family) : (p.familyId != null ? String(p.familyId) : (p.typeId != null ? String(p.typeId) : ''));
      var id = p.id != null ? String(p.id) : (p.itemId != null ? String(p.itemId) : '');
      if (raw && /^\d+\s*:\s*\d+$/.test(raw.replace(/\s+/g, ' '))) {
        var parts = raw.split(':');
        return '{' + String(parts[0]).trim() + ':' + String(parts[1]).trim() + '}';
      }
      if (fam && id && /^\d+$/.test(fam) && /^\d+$/.test(id)) return '{' + fam + ':' + id + '}';
    }
    if (c) return unwrap(c);
    return '';
  }

  function filterByPartType(parts, partType, category, manufacturer, weaponType) {
    var want = String(partType || '').trim().toLowerCase();
    var catNorm = category ? String(category).toLowerCase() : '';
    var isHeavy = catNorm === 'heavy weapon';
    return parts.filter(function (p) {
      if (!p) return false;
      var pt = String(p.partType || '').trim().toLowerCase();
      var cat = String(p.category || '').toLowerCase();
      if (catNorm === 'weapon') {
        if (cat !== 'weapon' && cat !== 'prefix' && cat !== 'rarity') return false;
      } else if (isHeavy) {
        if (cat !== 'gadget' && cat !== 'prefix' && cat !== 'rarity') return false;
      } else if (category) {
        var wantCat = String(category).toLowerCase();
        if (cat !== wantCat && cat !== 'character' && wantCat !== 'class mod') return false;
      }
      if (manufacturer && want !== 'element') {
        var pm = String(p.manufacturer || '').toLowerCase();
        if (pm && pm !== String(manufacturer).toLowerCase()) return false;
      }
      if (weaponType && (p.weaponType || p.itemType)) {
        var pwt = String(p.weaponType || p.itemType || '').toLowerCase();
        var wwt = String(weaponType || '').toLowerCase();
        var sniperMatch = (pwt === 'sniper' && wwt === 'sniper rifle') || (pwt === 'sniper rifle' && wwt === 'sniper');
        if (pwt && wwt && !sniperMatch && pwt !== wwt && pwt !== 'weapon') return false;
      }
      if (want === 'element') {
        return pt === 'element' || pt === 'status' || /^\{1:(10|11|12|13|14)\}$/.test(getPartToken(p));
      }
      if (want === 'element switch') {
        var code = String(p.code || '').toLowerCase();
        var pm = String(p.manufacturer || '').toLowerCase();
        return pm === 'maliwan' && code.indexOf('part_secondary_elem') !== -1 && code.indexOf('_mal') !== -1;
      }
      if (want === '') return true;
      return pt === want || (want === 'manufacturer part' && pt.indexOf('manufacturer') !== -1);
    });
  }

  function partOptionHoverTitle(p) {
    if (!p) return '';
    try {
      if (typeof window.partTooltipText === 'function') {
        var t = window.partTooltipText(p);
        if (t && String(t).trim()) return String(t).trim();
      }
    } catch (_) {}
    var bits = [
      p.name || p.legendaryName,
      p.code || p.spawnCode,
      p.idRaw || p.idraw,
      p.partType,
      p.manufacturer,
      (p.stats && String(p.stats).length) ? String(p.stats).slice(0, 500) : ''
    ].filter(Boolean);
    return bits.join(' · ');
  }

  function ccEscapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function guidedNormCode(p) {
    var c = (p && (p.code != null ? p.code : p.spawnCode)) || '';
    return String(c).trim();
  }

  /** Last path segment of spawn code, e.g. `DAD_AR.part_barrel_01` → `part_barrel_01`. */
  function guidedSpawnSegmentFromCode(rawCode) {
    var c = String(rawCode || '').replace(/^["']|["']$/g, '').trim();
    if (!c) return '';
    var seg = c.indexOf('.') >= 0 ? c.slice(c.lastIndexOf('.') + 1) : c;
    return String(seg).replace(/^["']|["']$/g, '').trim();
  }

  /**
   * Dropdown line for long part lists: actual spawn part name + dataset label + id + stats.
   * Tooltip / preview still carry full detail.
   */
  function compactGuidedPartLabel(p) {
    if (!p) return '-';
    var rawCode = guidedNormCode(p);
    var unquoted = rawCode.replace(/^["']|["']$/g, '').trim();
    var spawnSeg = guidedSpawnSegmentFromCode(rawCode);
    var datasetName = String((p.name || p.legendaryName || '').trim() || '');
    var id = String(p.idRaw != null && p.idRaw !== '' ? p.idRaw : (p.idraw != null ? p.idraw : (p.id != null ? p.id : ''))).trim();
    var stats = (p.stats != null) ? String(p.stats).replace(/\s+/g, ' ').trim() : '';
    if (stats.length > 44) stats = stats.substring(0, 43) + '…';

    var bits = [];
    if (spawnSeg) bits.push(spawnSeg);
    else if (unquoted) bits.push(unquoted.length <= 52 ? unquoted : unquoted.substring(0, 49) + '…');

    if (datasetName) {
      var dCompact = datasetName.replace(/\s+/g, ' ');
      if (dCompact.length > 56) dCompact = dCompact.substring(0, 55) + '…';
      var spawnLc = (spawnSeg || '').toLowerCase();
      var dLc = dCompact.toLowerCase().replace(/[^a-z0-9]/g, '');
      var sLc = spawnLc.replace(/[^a-z0-9]/g, '');
      if (!spawnSeg || (dLc !== sLc && dLc.indexOf(sLc) === -1 && dCompact.toLowerCase().indexOf(spawnLc) === -1)) {
        bits.push(dCompact);
      }
    }

    if (/pearl/i.test(String(p.stats || ''))) {
      var lineSoFar = bits.join(' · ');
      if (lineSoFar.indexOf('(Pearl)') === -1) bits.push('(Pearl)');
    }
    if (id) {
      var ptypeLo = String(p.partType || '').trim().toLowerCase().replace(/\s+/g, '');
      var idNorm = String(id).replace(/\s+/g, ' ').trim();
      var useBracedId = (ptypeLo === 'element' || ptypeLo === 'status' || ptypeLo === 'typeid1element' || ptypeLo === 'elementswitch')
        && /^\d+\s*:\s*\d+$/.test(idNorm);
      if (useBracedId) {
        var idParts = idNorm.split(':');
        bits.push('{' + String(idParts[0]).trim() + ':' + String(idParts[1]).trim() + '}');
      } else {
        bits.push(id);
      }
    }
    if (stats) bits.push(stats);

    var line = bits.filter(Boolean).join(' · ');
    if (line.length > 150) line = line.substring(0, 147) + '…';
    if (line) return line;
    return getPartToken(p) || rawCode || '-';
  }

  function guidedOptionLabelForSelect(sel, p) {
    if (sel && isGuidedBarrelFamilySelect(sel)) return guidedBarrelOptionPrimaryText(p);
    return compactGuidedPartLabel(p);
  }

  function guidedOptionTitleForSelect(sel, p) {
    var base = '';
    try {
      if (typeof window.partTooltipText === 'function') base = String(window.partTooltipText(p) || '').trim();
    } catch (_) {}
    if (!base) base = partOptionHoverTitle(p);
    if (!sel || !isGuidedBarrelFamilySelect(sel)) return base;
    var ef = String(p.effects != null ? p.effects : (p.effect || p.effects_text || '')).trim();
    if (ef && base.indexOf(ef) === -1) return base ? (base + ' | ' + ef) : ef;
    return base;
  }

  function isGuidedFullStatsPreviewOn() {
    var el = byId('ccGuidedFullStatsPreview');
    return !!(el && el.checked);
  }

  function getGuidedPreviewSlugHint() {
    try {
      if (typeof window.__STX_ITEM_SLUG === 'string' && window.__STX_ITEM_SLUG.trim()) {
        return window.__STX_ITEM_SLUG.trim();
      }
    } catch (_) {}
    var gs = getGuidedState();
    if (typeof window.computeSimpleBuilderItemSlug === 'function') {
      try {
        var slug = window.computeSimpleBuilderItemSlug(gs);
        if (slug) return slug;
      } catch (_) {}
    }
    return '';
  }

  function refreshAllGuidedSlotPreviews() {
    try {
      var nodes = document.querySelectorAll('[id^="cc-guided-preview-"]');
      for (var i = 0; i < nodes.length; i++) {
        var sid = String(nodes[i].id || '').replace(/^cc-guided-preview-/, '');
        if (!sid) continue;
        var sel = byId(sid);
        if (sel) updateGuidedSelectPreview(sel);
      }
    } catch (_) {}
  }

  function scheduleGuidedPreviewRefreshIfFullStats() {
    if (!isGuidedFullStatsPreviewOn()) return;
    setTimeout(refreshAllGuidedSlotPreviews, 120);
  }

  function formatGuidedPartPreviewHtml(p, opts) {
    opts = opts || {};
    if (!p) return '';
    var lines = [];
    var name = String((p.name || p.legendaryName || '').trim());
    if (!name) name = String(getPartToken(p) || '').trim();
    if (name) lines.push('<div class="stx-part-preview__title">' + ccEscapeHtml(name) + '</div>');
    try {
      var tok2 = getPartToken(p);
      if (tok2) lines.push('<div><span class="muted">Token</span> <code>' + ccEscapeHtml(tok2) + '</code></div>');
    } catch (_) {}
    var id = String(p.idRaw != null && p.idRaw !== '' ? p.idRaw : (p.idraw || '')).trim();
    if (id) lines.push('<div><span class="muted">ID</span> <code>' + ccEscapeHtml(id) + '</code></div>');
    var code = guidedNormCode(p);
    if (code) lines.push('<div><span class="muted">Spawn</span> <code>' + ccEscapeHtml(code) + '</code></div>');
    if (p.manufacturer) lines.push('<div><span class="muted">Mfr</span> ' + ccEscapeHtml(String(p.manufacturer)) + '</div>');
    if (p.partType) lines.push('<div><span class="muted">Part type</span> ' + ccEscapeHtml(String(p.partType)) + '</div>');
    var statsRaw = p.stats != null ? String(p.stats) : '';
    var stats = statsRaw.replace(/\s+/g, ' ').trim();
    if (stats) lines.push('<div><span class="muted">Stats</span> ' + ccEscapeHtml(stats.length > 520 ? stats.slice(0, 519) + '…' : stats) + '</div>');
    if (opts.fullStats && typeof window.getFullStatLinesForPart === 'function') {
      try {
        var slugH = opts.slugHint != null ? opts.slugHint : '';
        var fb = window.getFullStatLinesForPart(p, slugH);
        if (fb && fb.lines && fb.lines.length) {
          lines.push('<div class="stx-part-preview__fullstats-head" style="margin-top:8px;"><span class="muted">Full stats</span></div>');
          lines.push('<ul class="stx-part-preview__fullstats-list">');
          for (var fi = 0; fi < fb.lines.length; fi++) {
            lines.push('<li>' + ccEscapeHtml(fb.lines[fi]) + '</li>');
          }
          lines.push('</ul>');
        }
      } catch (_) {}
    }
    var ef = String(p.effects != null ? p.effects : (p.effect || '')).trim();
    if (ef) lines.push('<div><span class="muted">Effect</span> ' + ccEscapeHtml(ef.length > 360 ? ef.slice(0, 359) + '…' : ef) + '</div>');
    var tip = '';
    try {
      if (typeof window.partTooltipText === 'function') tip = String(window.partTooltipText(p) || '').trim();
    } catch (_) {}
    if (!tip) tip = partOptionHoverTitle(p);
    if (tip && tip.length > 12) {
      var clipped = tip.length > 520 ? tip.slice(0, 519) + '…' : tip;
      var tipRedundant = name && (clipped === name || (clipped.indexOf(name) === 0 && clipped.length < name.length + 25));
      if (!tipRedundant) lines.push('<div class="small muted" style="margin-top:6px;opacity:.92;">' + ccEscapeHtml(clipped) + '</div>');
    }
    return lines.join('');
  }

  /** Barrel / barrel accessory dropdowns: headline, perk accent line, description + stats. */
  var GUIDED_BARREL_FAMILY_SELECT_IDS = {
    ccBarrelSelect: true,
    ccBarrelAccSelect: true,
    ccHeavyBarrelSelect: true,
    ccHeavyBarrelAccSelect: true
  };
  /** No dropdown icons for barrel accessory rows (main barrel keeps pearl/legendary aug art). */
  var GUIDED_BARREL_ACCESSORY_SELECT_IDS = {
    ccBarrelAccSelect: true,
    ccHeavyBarrelAccSelect: true
  };

  function isGuidedBarrelFamilySelect(sel) {
    return !!(sel && sel.id && GUIDED_BARREL_FAMILY_SELECT_IDS[sel.id]);
  }

  /** e.g. "Constellation - Projectiles…" → perk + body; short single-line → perk only. */
  function splitGuidedEffectPerkBody(ef) {
    var s = String(ef || '').trim();
    if (!s) return { perk: '', body: '' };
    // Dataset / exports sometimes use ASCII " - ", Unicode en/em dash, or thin spaces.
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

  /** If stats starts with the same headline shown as title, return only the trailing detail. */
  function stripStatsHeadlineIfRedundant(statsRaw, title) {
    var st = String(statsRaw || '').replace(/\s+/g, ' ').trim();
    var tl = String(title || '').replace(/\s+/g, ' ').trim();
    if (!st || !tl) return st;
    if (st.toLowerCase().indexOf(tl.toLowerCase()) !== 0) return st;
    var rest = st.slice(tl.length).replace(/^,\s*/, '').trim();
    return rest || st;
  }

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function guidedBarrelEffectMeta(p) {
    var ef = String(p && (p.effects != null ? p.effects : (p.effect || p.effects_text || ''))).trim();
    var split = splitGuidedEffectPerkBody(ef);
    return { ef: ef, perk: split.perk || '', red: split.body || '' };
  }

  function stripRedundantParenBarrelName(displayName, perkHeadline) {
    var n = String(displayName || '').trim();
    var ph = String(perkHeadline || '').trim();
    if (!n || !ph) return n;
    try {
      var re = new RegExp('\\s*\\(\\s*' + escapeRegExp(ph) + '\\s*\\)\\s*$', 'i');
      if (re.test(n)) return n.replace(re, '').trim();
    } catch (_) {}
    return n;
  }

  /** One-line barrel row: item headline, id, stat numbers — no duplicate name, no flavor (flavor → data-cc-barrel-sub). */
  function guidedBarrelOptionPrimaryText(p) {
    if (!p) return '-';
    var meta = guidedBarrelEffectMeta(p);
    var stRaw = String(p.stats != null ? p.stats : (p.statText || '')).replace(/\s+/g, ' ').trim();

    var head = '';
    if (stRaw && stRaw.indexOf(',') > 0) {
      var seg = stRaw.slice(0, stRaw.indexOf(',')).trim();
      if (seg.length >= 3 && seg.length <= 88) head = seg;
    }

    var displayName = String((p.legendaryName || p.name || '').trim());
    if (!head) {
      head = stripRedundantParenBarrelName(displayName, meta.perk)
        || displayName
        || guidedSpawnSegmentFromCode(guidedNormCode(p))
        || String(getPartToken(p) || '').trim();
    }
    if (!head || head === '-') head = String(getPartToken(p) || guidedNormCode(p) || '-').trim();

    var statTail = stRaw ? stripStatsHeadlineIfRedundant(stRaw, head) : '';
    if (/^barrel\s+part\s+for\s+/i.test(statTail) || /^barrel\s+part\s+for\s+/i.test(stRaw)) statTail = '';
    if (meta.red && statTail.toLowerCase() === meta.red.toLowerCase()) statTail = '';
    if (meta.perk && statTail.toLowerCase() === meta.perk.toLowerCase()) statTail = '';
    if (meta.ef && statTail === meta.ef) statTail = '';
    if (meta.red && statTail.toLowerCase().indexOf(meta.red.toLowerCase()) === 0) statTail = '';

    var bits = [head];
    var id = String(p.idRaw != null && p.idRaw !== '' ? p.idRaw : (p.idraw != null ? p.idraw : (p.family != null && p.id != null ? (p.family + ':' + p.id) : ''))).trim();
    if (id) bits.push(id);

    if (statTail) {
      var stOne = statTail.length > 88 ? statTail.slice(0, 87) + '…' : statTail;
      bits.push(stOne);
    }

    var line = bits.join(' · ');
    if (line.length > 180) line = line.slice(0, 177) + '…';
    return line || '-';
  }

  /** Flavor / long perk body for coral “red text” row under the main label (custom select). */
  function guidedBarrelOptionSubText(p) {
    if (!p) return '';
    var meta = guidedBarrelEffectMeta(p);
    var line = '';
    if (meta.red) line = meta.perk ? (meta.perk + ' — ' + meta.red) : meta.red;
    else if (meta.perk && meta.ef.length > 52) line = meta.ef;
    var out = line.replace(/\s+/g, ' ').trim();
    if (out.length > 240) out = out.slice(0, 237) + '…';
    return out;
  }

  function applyGuidedBarrelOptionDataAttrs(sel, opt, p) {
    if (!opt || !isGuidedBarrelFamilySelect(sel)) return;
    opt.textContent = guidedBarrelOptionPrimaryText(p);
    var sub = guidedBarrelOptionSubText(p);
    if (sub) opt.setAttribute('data-cc-barrel-sub', sub);
    else opt.removeAttribute('data-cc-barrel-sub');
  }

  /** Prefer "Star Helix Barrel"-style lead from stats; else display name. */
  function guidedBarrelHeadlineTitle(p) {
    if (!p) return '';
    var meta = guidedBarrelEffectMeta(p);
    var st = String(p.stats != null ? p.stats : (p.stats_text || '')).replace(/\s+/g, ' ').trim();
    if (st && st.indexOf(',') > 0) {
      var head = st.slice(0, st.indexOf(',')).trim();
      if (head.length >= 3 && head.length <= 88) return head;
    }
    var nm = String((p.legendaryName || p.name || '').trim());
    var cleaned = stripRedundantParenBarrelName(nm, meta.perk);
    if (cleaned) return cleaned;
    try { return String(getPartToken(p) || '').trim(); } catch (_) { return ''; }
  }

  function formatGuidedBarrelFamilyPreviewHtml(p, opts) {
    opts = opts || {};
    if (!p) return '';
    var lines = [];
    var title = guidedBarrelHeadlineTitle(p);
    if (title) lines.push('<div class="stx-part-preview__title">' + ccEscapeHtml(title) + '</div>');

    var efRaw = String(p.effects != null ? p.effects : (p.effect || p.effects_text || '')).trim();
    var split = splitGuidedEffectPerkBody(efRaw);
    if (split.perk) lines.push('<div class="stx-part-preview__barrel-perk">' + ccEscapeHtml(split.perk) + '</div>');
    if (split.body) {
      lines.push('<div class="stx-part-preview__barrel-redtext" style="color:#ff8f8f;font-size:12px;line-height:1.35;margin-top:2px;">' + ccEscapeHtml(split.body.length > 420 ? split.body.slice(0, 419) + '…' : split.body) + '</div>');
    }
    var descParts = [];
    var statsRaw = String(p.stats != null ? p.stats : (p.stats_text || '')).replace(/\s+/g, ' ').trim();
    var statsTail = statsRaw ? stripStatsHeadlineIfRedundant(statsRaw, title) : '';
    if (/^barrel\s+part\s+for\s+/i.test(statsTail) || /^barrel\s+part\s+for\s+/i.test(statsRaw)) statsTail = '';
    if (statsTail) descParts.push(statsTail);
    var descMerge = descParts.filter(Boolean);
    if (descMerge.length) {
      lines.push('<div class="stx-part-preview__barrel-desc">' + ccEscapeHtml(descMerge.join('\n\n')) + '</div>');
    }

    lines.push('<div class="stx-part-preview__barrel-meta">');
    try {
      var tok2 = getPartToken(p);
      if (tok2) lines.push('<div><span class="muted">Token</span> <code>' + ccEscapeHtml(tok2) + '</code></div>');
    } catch (_) {}
    var id = String(p.idRaw != null && p.idRaw !== '' ? p.idRaw : (p.idraw || '')).trim();
    if (id) lines.push('<div><span class="muted">ID</span> <code>' + ccEscapeHtml(id) + '</code></div>');
    var code = guidedNormCode(p);
    if (code) lines.push('<div><span class="muted">Spawn</span> <code>' + ccEscapeHtml(code) + '</code></div>');
    if (p.manufacturer) lines.push('<div><span class="muted">Mfr</span> ' + ccEscapeHtml(String(p.manufacturer)) + '</div>');
    if (p.partType) lines.push('<div><span class="muted">Part type</span> ' + ccEscapeHtml(String(p.partType)) + '</div>');
    lines.push('</div>');

    if (opts.fullStats && typeof window.getFullStatLinesForPart === 'function') {
      try {
        var slugH = opts.slugHint != null ? opts.slugHint : '';
        var fb = window.getFullStatLinesForPart(p, slugH);
        if (fb && fb.lines && fb.lines.length) {
          lines.push('<div class="stx-part-preview__fullstats-head" style="margin-top:8px;"><span class="muted">Full stats</span></div>');
          lines.push('<ul class="stx-part-preview__fullstats-list">');
          for (var fi = 0; fi < fb.lines.length; fi++) {
            lines.push('<li>' + ccEscapeHtml(fb.lines[fi]) + '</li>');
          }
          lines.push('</ul>');
        }
      } catch (_) {}
    }
    return lines.join('');
  }

  function ensureGuidedPartPreviewHost(sel) {
    if (!sel || !sel.id) return null;
    var pid = 'cc-guided-preview-' + sel.id;
    var preview = byId(pid);
    if (preview) return preview;
    preview = document.createElement('div');
    preview.id = pid;
    preview.className = 'stx-part-preview small cc-guided-slot-preview';
    preview.setAttribute('role', 'status');
    preview.setAttribute('aria-live', 'polite');
    var row = sel.parentElement;
    if (!row) return null;
    var outer = row.parentElement;
    var hasRowButton = !!(row.querySelector && row.querySelector('button'));
    if (hasRowButton && outer && outer !== row && outer.contains(sel) && row.contains(sel)) {
      if (row.nextSibling) outer.insertBefore(preview, row.nextSibling);
      else outer.appendChild(preview);
    } else {
      if (sel.nextSibling) row.insertBefore(preview, sel.nextSibling);
      else row.appendChild(preview);
    }
    return preview;
  }

  function bindGuidedSelectPreviewIfNeeded(sel) {
    if (!sel || sel.__ccGuidedPreviewBound) return;
    sel.__ccGuidedPreviewBound = true;
    sel.addEventListener('change', function () {
      updateGuidedSelectPreview(sel);
    });
  }

  function updateGuidedSelectPreview(sel) {
    var host = ensureGuidedPartPreviewHost(sel);
    if (!host) return;
    var barrelish = isGuidedBarrelFamilySelect(sel);
    host.classList.toggle('stx-part-preview--barrel', barrelish);
    var tok = (sel.value || '').trim();
    if (!tok) {
      host.classList.remove('stx-part-preview--fullstats');
      host.innerHTML = '<span class="muted">Select a part to see token, IDs, spawn code, and stats (compare rolls before Add).</span>';
      return;
    }
    var plist = sel.__ccGuidedPartsList;
    var p = null;
    if (plist && plist.length) {
      for (var pi = 0; pi < plist.length; pi++) {
        if (getPartToken(plist[pi]) === tok) {
          p = plist[pi];
          break;
        }
      }
    }
    if (!p && sel.selectedIndex >= 0) {
      var opt = sel.options[sel.selectedIndex];
      var tx = opt ? String(opt.text || '').trim() : '';
      host.classList.remove('stx-part-preview--fullstats');
      host.innerHTML = '<div class="stx-part-preview__title">' + ccEscapeHtml(tx || 'Selection') + '</div>'
        + '<div><span class="muted">Token</span> <code>' + ccEscapeHtml(tok) + '</code></div>'
        + '<p class="small muted" style="margin:6px 0 0;">Element / preset row — limited metadata in the dataset for this picker.</p>';
      return;
    }
    if (!p) {
      host.classList.remove('stx-part-preview--fullstats');
      host.innerHTML = '<span class="muted">Full stats unavailable for this token. Hover an option for the tooltip if present.</span>';
      return;
    }
    var full = isGuidedFullStatsPreviewOn();
    if (full) host.classList.add('stx-part-preview--fullstats');
    else host.classList.remove('stx-part-preview--fullstats');
    if (barrelish) {
      host.innerHTML = formatGuidedBarrelFamilyPreviewHtml(p, { fullStats: full, slugHint: getGuidedPreviewSlugHint() });
    } else {
      host.innerHTML = formatGuidedPartPreviewHtml(p, { fullStats: full, slugHint: getGuidedPreviewSlugHint() });
    }
  }

  function normalizePerkNameForMeta(name) {
    if (typeof window.__normalizePerkName === 'function') {
      try { return String(window.__normalizePerkName(name) || ''); } catch (_) {}
    }
    return String(name || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '').trim();
  }

  function getClassmodPerkMetaByName(name) {
    var raw = String(name || '').trim();
    if (!raw) return null;
    var byName = window.__CLASSMOD_PERK_META_BY_NAME || null;
    if (byName && byName[raw]) return byName[raw];
    var byKey = window.__CLASSMOD_PERK_META || null;
    var key = normalizePerkNameForMeta(raw);
    return byKey && key ? (byKey[key] || null) : null;
  }

  function updateClassmodPartPreview(sel) {
    var wrap = byId('partSelectClassModPreview');
    var nameEl = byId('partSelectClassModPreviewName');
    var descEl = byId('partSelectClassModPreviewDesc');
    if (!wrap || !nameEl || !descEl || !sel) return;
    var opt = sel.options && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null;
    var n = String(opt && opt.getAttribute('data-perk-name') || '').trim();
    var d = String(opt && opt.getAttribute('data-perk-desc') || '').trim();
    if (!n && !d) {
      wrap.style.display = 'none';
      nameEl.textContent = '';
      descEl.textContent = '';
      return;
    }
    wrap.style.display = 'flex';
    nameEl.textContent = n || 'Class Mod Perk';
    descEl.textContent = d || 'No description available yet.';
  }

  function fillSelect(sel, parts, maxItems, emptyHint) {
    if (!sel) return;
    sel.innerHTML = '';
    sel.appendChild(new Option('-- None / N/A --', ''));
    var listForPreview = [];
    var seenTok = {};
    var plen = (parts && parts.length) ? parts.length : 0;
    var limit = Math.min(plen, maxItems || 300);
    for (var i = 0; i < limit; i++) {
      var p = parts[i];
      var tok = getPartToken(p);
      if (!tok) continue;
      if (seenTok[tok]) continue;
      seenTok[tok] = true;
      listForPreview.push(p);
      var opt = new Option(guidedOptionLabelForSelect(sel, p), tok);
      var tit = guidedOptionTitleForSelect(sel, p);
      if (tit) opt.title = tit;
      applyGuidedPartOptionIcon(sel, opt, p);
      applyGuidedBarrelOptionDataAttrs(sel, opt, p);
      sel.appendChild(opt);
    }
    if (!listForPreview.length && emptyHint) {
      var hi = new Option(emptyHint, '');
      hi.disabled = true;
      sel.appendChild(hi);
    }
    sel.__ccGuidedPartsList = listForPreview;
    maybeDecoratedGuidedSelectPlaceholder(sel);
    bindGuidedSelectPreviewIfNeeded(sel);
    updateGuidedSelectPreview(sel);
    syncGuidedCustomSelectIfWrapped(sel);
  }

  function normPartCodeForSort(p) {
    return String((p && p.code) ? p.code : '').toLowerCase().replace(/^["']|["']$/g, '');
  }

  function sortGuidedPartsByCode(parts) {
    if (!parts || !parts.length) return parts;
    return parts.slice().sort(function (a, b) {
      return normPartCodeForSort(a).localeCompare(normPartCodeForSort(b), undefined, { numeric: true });
    });
  }

  var GUIDED_HINT_EMPTY_STANDALONE_DUAL =
    '(Empty) Dataset not loaded yet, or no dual / switch parts. Turn on "All manufacturers\' parts in dropdowns" and try again.';

  function countElementTokensInCodeLower(c) {
    var hits = 0;
    if (c.indexOf('_cor_') !== -1 || c.indexOf('corrosive') !== -1) hits++;
    if (c.indexOf('_cryo') !== -1 || c.indexOf('cryo') !== -1) hits++;
    if (c.indexOf('_rad_') !== -1 || c.indexOf('radiation') !== -1) hits++;
    if (c.indexOf('_fire') !== -1 || c.indexOf('incendiary') !== -1 || c.indexOf('ele_fire') !== -1) hits++;
    if (c.indexOf('_shock') !== -1 || c.indexOf('shock') !== -1) hits++;
    return hits;
  }

  function collectStandaloneDualElementParts() {
    var all = getAllParts();
    var out = [];
    var seen = Object.create(null);
    for (var i = 0; i < all.length; i++) {
      var p = all[i];
      if (!p) continue;
      var cat = String(p.category || '').trim();
      if (cat !== 'Weapon' && cat !== 'Gadget' && cat !== 'Heavy Weapon') continue;
      var pt = String(p.partType || '').trim().toLowerCase();
      var c = String(p.code || '').toLowerCase();
      var ok = false;
      if (pt === 'element switch') ok = true;
      else if (pt === 'body' && c.indexOf('rainbowvomit') !== -1) ok = true;
      else if (pt === 'body' && c.indexOf('part_body_ele') !== -1 && countElementTokensInCodeLower(c) >= 2) ok = true;
      if (!ok) continue;
      var tok = getPartToken(p);
      if (!tok || seen[tok]) continue;
      seen[tok] = true;
      out.push(p);
    }
    return sortGuidedPartsByCode(out);
  }

  function collectStandalonePearlParts() {
    var all = getAllParts();
    var out = [];
    var seen = Object.create(null);
    for (var i = 0; i < all.length; i++) {
      var p = all[i];
      if (!p) continue;
      if (String(p.category || '').trim() !== 'Weapon') continue;
      if (!/part_pearl/i.test(String(p.code || ''))) continue;
      var tok = getPartToken(p);
      if (!tok || seen[tok]) continue;
      seen[tok] = true;
      out.push(p);
    }
    return sortGuidedPartsByCode(out);
  }

  function refreshToolsStandaloneElementDropdowns() {
    var te = byId('toolsElementSelect');
    if (te) {
      te.innerHTML = '';
      var ph = new Option('-- Element --', '');
      applyDataCcIconIfAny(ph, CC_ELEMENT_PLACEHOLDER_ICON_FILE);
      te.appendChild(ph);
      for (var j = 0; j < ELEMENTS.length; j++) {
        var ej = ELEMENTS[j];
        if (!ej.code) continue;
        var o = new Option(guidedPresetElementOptionLabel(ej), ej.code);
        o.title = 'Output token: ' + ej.code;
        if (ej.iconFile) applyDataCcIconIfAny(o, ej.iconFile);
        te.appendChild(o);
      }
      te.__ccGuidedPartsList = null;
      bindGuidedSelectPreviewIfNeeded(te);
      updateGuidedSelectPreview(te);
      syncGuidedCustomSelectIfWrapped(te);
    }
    var td = byId('toolsDualElementSelect');
    if (td) {
      var dual = collectStandaloneDualElementParts();
      fillSelect(td, dual, 500, GUIDED_HINT_EMPTY_STANDALONE_DUAL);
    }
    var tp = byId('toolsPearlElementSelect');
    if (tp) {
      var pearls = collectStandalonePearlParts();
      fillSelect(tp, pearls, 120, '(Empty) No pearl parts in dataset.');
    }
  }

  function fillSelectWithLegendaryGroups(sel, parts) {
    if (!sel) return;
    var heavy = [];
    var weapon = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var cat = String(p.category || '').trim();
      if (cat === 'Gadget') heavy.push(p);
      else if (cat === 'Weapon') weapon.push(p);
    }
    heavy = sortGuidedPartsByCode(heavy);
    weapon = sortGuidedPartsByCode(weapon);
    sel.innerHTML = '';
    sel.appendChild(new Option('-- None / N/A --', ''));
    var listed = [];
    var seenTokGroup = {};
    var addPartToGroup = function (group, p) {
      var tok = getPartToken(p);
      if (!tok) return;
      if (seenTokGroup[tok]) return;
      seenTokGroup[tok] = true;
      listed.push(p);
      var opt = new Option(guidedOptionLabelForSelect(sel, p), tok);
      try { opt.setAttribute('data-part', JSON.stringify(p)); } catch (_) {}
      var t = guidedOptionTitleForSelect(sel, p);
      if (t) opt.title = t;
      applyGuidedPartOptionIcon(sel, opt, p);
      applyGuidedBarrelOptionDataAttrs(sel, opt, p);
      group.appendChild(opt);
    };
    if (heavy.length) {
      var g1 = document.createElement('optgroup');
      g1.label = 'Heavy Legendary Perks';
      for (var h = 0; h < Math.min(heavy.length, 800); h++) addPartToGroup(g1, heavy[h]);
      sel.appendChild(g1);
    }
    if (weapon.length) {
      var g2 = document.createElement('optgroup');
      g2.label = 'Weapon Legendary Perks';
      for (var w = 0; w < Math.min(weapon.length, 1200); w++) addPartToGroup(g2, weapon[w]);
      sel.appendChild(g2);
    }
    sel.__ccGuidedPartsList = listed;
    maybeDecoratedGuidedSelectPlaceholder(sel);
    bindGuidedSelectPreviewIfNeeded(sel);
    updateGuidedSelectPreview(sel);
    syncGuidedCustomSelectIfWrapped(sel);
  }

  function getGuidedState() {
    var guidedItem = byId('ccGuidedItemType');
    var guidedMan = byId('ccGuidedManufacturer');
    var guidedWt = byId('ccGuidedWeaponType');
    var stxItem = byId('stx_itemType');
    var stxMan = byId('stx_manufacturer');
    var itemType = (guidedItem && guidedItem.value) || (stxItem && stxItem.value) || '';
    var manufacturer = '';
    if (guidedItem && guidedItem.value) {
      manufacturer = (guidedMan && guidedMan.value) || '';
    } else if (stxItem && stxItem.value) {
      manufacturer = (stxMan && stxMan.value) || '';
    } else {
      manufacturer = (guidedMan && guidedMan.value) || (stxMan && stxMan.value) || '';
    }
    var weaponType = (guidedWt && guidedWt.value) || (byId('weaponType') && byId('weaponType').value) || '';
    return { itemType: itemType, manufacturer: manufacturer, weaponType: weaponType };
  }

  function getEffectiveManufacturerForFilter() {
    var toggle = byId('ccGuidedAllManufacturers');
    if (toggle && toggle.checked) return '';
    return (getGuidedState().manufacturer || '').trim();
  }

  /** Body / main-body rows: once used to hide when a filter returned 0 rows; always show now so slots stay usable. */
  var GUIDED_BODY_FAMILY_KEYS_BY_CATEGORY = {
    Weapon: { body: true, bodyAcc: true, bodyEle: true },
    'Heavy Weapon': { body: true, bodyAcc: true },
    Shield: { mainBody: true }
  };

  function guidedSlotIsBodyFamily(category, slotKey) {
    var m = GUIDED_BODY_FAMILY_KEYS_BY_CATEGORY[category];
    return !!(m && m[slotKey]);
  }

  /** Grid row: wrapper around label + flex(select, button) in guided slot grids. */
  function getGuidedSlotGridRow(sel) {
    if (!sel || !sel.parentElement) return null;
    return sel.parentElement.parentElement || null;
  }

  function applyGuidedBodySlotRowVisibility(sel, category, slotKey, partCount) {
    if (!guidedSlotIsBodyFamily(category, slotKey)) return;
    var row = getGuidedSlotGridRow(sel);
    if (row) row.style.display = '';
  }

  var HEAVY_FALLBACK_MANS = ['Maliwan', 'Ripper', 'Torgue', 'Vladof'];
  var WEAPON_FALLBACK_MANS = ['Daedalus', 'Jakobs', 'Maliwan', 'Order', 'Ripper', 'Tediore', 'Torgue', 'Vladof'];
  var CLASSMOD_FALLBACK_MANS = ['Siren', 'Paladin', 'Exo Soldier', 'Gravitar', 'Robodealer'];

  function getClassModDisplayName(manufacturer) {
    var m = String(manufacturer || '').trim();
    if (!m) return '';
    if (/^siren$/i.test(m)) return 'Vex';
    if (/^paladin$/i.test(m)) return 'Amon';
    if (/^exo\s*soldier$/i.test(m) || /^exosoldier$/i.test(m)) return 'Rafa';
    if (/^gravitar$/i.test(m)) return 'Harlowe';
    if (/^c4sh$/i.test(m) || /^robodealer$/i.test(m)) return 'C4sh';
    if (/^universal$/i.test(m)) return 'Universal';
    return m;
  }

  function classModCharacterIconUrl(internalMfr) {
    var m = String(internalMfr || '').trim().toLowerCase().replace(/\s+/g, ' ');
    var base = './assets/img/vault-hunters/';
    if (m === 'siren') return base + 'player_class_dark_siren.png';
    if (m === 'paladin') return base + 'player_class_paladin.png';
    if (m === 'exo soldier' || m === 'exosoldier') return base + 'player_class_exo_soldier.png';
    if (m === 'gravitar') return base + 'player_class_gravitar.png';
    if (m === 'robodealer' || m === 'c4sh') return base + 'player_robodealer.png';
    return '';
  }

  function manufacturerLogomarkUrl(rawMfr) {
    var m = String(rawMfr || '').trim().toLowerCase();
    var map = {
      atlas: 'manufacturer/ui_art_manu_logomark_atlas_small.png',
      cov: 'manufacturer/ui_art_manu_logomark_cov_small.png',
      daedalus: 'manufacturer/ui_art_manu_logomark_daedalus_small.png',
      hyperion: 'manufacturer/ui_art_manu_logomark_hyperion_small.png',
      jakobs: 'manufacturer/ui_art_manu_logomark_jakobs_small.png',
      maliwan: 'manufacturer/ui_art_manu_logomark_maliwan_small.png',
      order: 'manufacturer/ui_art_manu_logomark_order_small.png',
      ripper: 'manufacturer/ui_art_manu_logomark_ripper_small.png',
      tediore: 'manufacturer/ui_art_manu_logomark_tediore_small.png',
      torgue: 'manufacturer/ui_art_manu_logomark_torgue_small.png',
      vladof: 'manufacturer/ui_art_manu_logomark_vladof_small.png',
      borg: 'manufacturer/ui_art_manu_logomark_ripper_small.png'
    };
    var rel = map[m];
    return rel ? CC_GUIDED_DROPDOWN_BASE + rel : '';
  }

  function decorateGuidedManufacturerOption(opt, rawValue, itemType) {
    if (!opt) return;
    var it = String(itemType || '').trim();
    var url = it === 'Class Mod' ? classModCharacterIconUrl(rawValue) : manufacturerLogomarkUrl(rawValue);
    if (url) applyDataCcIconFullUrl(opt, url);
    else opt.removeAttribute('data-cc-icon');
  }

  function appendGuidedManufacturerOption(manSel, stxMan, fromStx, label, value, itemType) {
    var opt = new Option(label, value);
    decorateGuidedManufacturerOption(opt, value, itemType);
    manSel.appendChild(opt);
    if (stxMan && fromStx) {
      var o2 = new Option(label, value);
      decorateGuidedManufacturerOption(o2, value, itemType);
      stxMan.appendChild(o2);
    }
  }

  function syncGuidedManufacturerSelects(manSel, stxMan, fromStx) {
    syncGuidedCustomSelectIfWrapped(manSel);
    if (stxMan && fromStx) syncGuidedCustomSelectIfWrapped(stxMan);
  }

  function guidedWeaponTypeSelectIconUrl(displayValue) {
    var k = String(displayValue || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (k === 'submachine gun') k = 'smg';
    return ccGuidedWeaponTypePngUrlFromKey(k);
  }

  function loadGuidedWeaponTypes() {
    var wtSel = byId('ccGuidedWeaponType');
    var manSel = byId('ccGuidedManufacturer');
    if (!wtSel || !manSel) return;
    var itemType = (byId('ccGuidedItemType') && byId('ccGuidedItemType').value) || (byId('stx_itemType') && byId('stx_itemType').value) || '';
    if (itemType !== 'Weapon') return;
    var man = (byId('ccGuidedAllManufacturers') && byId('ccGuidedAllManufacturers').checked) ? '' : (manSel.value || '').trim();
    var parts = [];
    if (typeof window.filterPartsForGuided === 'function') {
      parts = window.filterPartsForGuided({ category: 'Weapon', manufacturer: man }) || [];
    } else {
      var all = getAllParts();
      parts = filterByPartType(all, '', 'Weapon', man, null);
    }
    var wtypes = [];
    var seen = {};
    for (var i = 0; i < parts.length; i++) {
      var wt = String(parts[i].weaponType || parts[i].itemType || '').trim();
      if (!wt || String(wt).toLowerCase() === 'weapon') continue;
      if (!seen[wt]) { seen[wt] = true; wtypes.push(wt); }
    }
    if (seen['Sniper'] && !seen['Sniper Rifle']) wtypes.push('Sniper Rifle');
    wtypes = wtypes.filter(function (w) { return w !== 'Sniper'; });
    wtypes = wtypes.filter(function (w) { return String(w).trim().toLowerCase() !== 'weapon'; });
    wtypes.sort(function (a, b) { return String(a).localeCompare(String(b), undefined, { numeric: true }); });
    wtSel.innerHTML = '<option value="">Select weapon type...</option>';
    for (var j = 0; j < wtypes.length; j++) {
      if (!wtypes[j]) continue;
      var wOpt = new Option(wtypes[j], wtypes[j]);
      var wIcon = guidedWeaponTypeSelectIconUrl(wtypes[j]);
      if (wIcon) applyDataCcIconFullUrl(wOpt, wIcon);
      wtSel.appendChild(wOpt);
    }
    var cur = (wtSel.value || '').trim();
    if (cur && wtypes.indexOf(cur) >= 0) { wtSel.value = cur; } else if (wtypes.length) { wtSel.value = wtypes[0]; }
    syncGuidedCustomSelectIfWrapped(wtSel);
  }

  function loadGuidedManufacturers() {
    var itemSel = byId('ccGuidedItemType');
    var stxItem = byId('stx_itemType');
    var manSel = byId('ccGuidedManufacturer');
    var stxMan = byId('stx_manufacturer');
    var wtSel = byId('ccGuidedWeaponType');
    if (!manSel) return;
    var itemType = (itemSel && itemSel.value ? itemSel.value : (stxItem && stxItem.value ? stxItem.value : '')).trim();
    if (itemType === 'Enhancement') {
      manSel.innerHTML = '<option value="">Choose below</option>';
      manSel.disabled = true;
      syncGuidedManufacturerSelects(manSel, stxMan, fromStx);
      return;
    }
    var fromStx = !!(stxItem && stxItem.value) && (!itemSel || !itemSel.value || itemSel.value === stxItem.value);
    var placeholder = (itemType === 'Class Mod') ? 'Select character...' : 'Select manufacturer...';
    var preserveMan = (manSel.value || '').trim();
    manSel.innerHTML = '<option value="">' + placeholder + '</option>';
    manSel.disabled = false;
    if (stxMan && fromStx) stxMan.innerHTML = '<option value="">' + placeholder + '</option>';
    if (!itemType) {
      syncGuidedManufacturerSelects(manSel, stxMan, fromStx);
      return;
    }

    // For Heavy Weapon, use fast STX_RARITIES path first to avoid blocking; getManufacturersForCategory does expensive filterParts
    if (itemType === 'Heavy Weapon') {
      var rarities = window.STX_RARITIES;
      if (Array.isArray(rarities) && rarities.length) {
        var seen = {};
        for (var r = 0; r < rarities.length; r++) {
          var row = rarities[r];
          if (!row || String(row.itemType || '') !== 'Heavy Weapon') continue;
          var m = String(row.manufacturer || '').trim();
          if (m && !seen[m] && m.toLowerCase() !== 'characters' && m.toLowerCase() !== 'weapon' && m.toLowerCase() !== 'heavy weapon') {
            seen[m] = true;
            appendGuidedManufacturerOption(manSel, stxMan, fromStx, m, m, itemType);
          }
        }
        if (Object.keys(seen).length > 0) {
          if (preserveMan && Array.prototype.some.call(manSel.options, function (o) { return (o.value || '').trim() === preserveMan; })) {
            manSel.value = preserveMan;
            if (stxMan && fromStx) stxMan.value = preserveMan;
          }
          syncGuidedManufacturerSelects(manSel, stxMan, fromStx);
          return;
        }
      }
      for (var f = 0; f < HEAVY_FALLBACK_MANS.length; f++) {
        appendGuidedManufacturerOption(manSel, stxMan, fromStx, HEAVY_FALLBACK_MANS[f], HEAVY_FALLBACK_MANS[f], itemType);
      }
      if (preserveMan && Array.prototype.some.call(manSel.options, function (o) { return (o.value || '').trim() === preserveMan; })) {
        manSel.value = preserveMan;
        if (stxMan && fromStx) stxMan.value = preserveMan;
      }
      syncGuidedManufacturerSelects(manSel, stxMan, fromStx);
      return;
    }

    if (typeof window.getManufacturersForCategory === 'function') {
      try {
        var catUi = itemType;
        var weaponType = (wtSel && wtSel.value) ? String(wtSel.value).trim() : null;
        if (itemType === 'Weapon') { catUi = 'Weapon'; if (!weaponType) weaponType = (wtSel && wtSel.options && wtSel.options[0]) ? wtSel.options[0].value : 'Assault Rifle'; }
        var mans = window.getManufacturersForCategory(catUi, weaponType);
        if (Array.isArray(mans) && mans.length) {
          for (var k = 0; k < mans.length; k++) {
            var m = String(mans[k]).trim();
            if (m) {
              var displayName = (itemType === 'Class Mod') ? getClassModDisplayName(m) : m;
              appendGuidedManufacturerOption(manSel, stxMan, fromStx, displayName, m, itemType);
            }
          }
          if (preserveMan && Array.prototype.some.call(manSel.options, function(o){ return (o.value||'').trim() === preserveMan; })) {
            manSel.value = preserveMan;
            if (stxMan && fromStx) stxMan.value = preserveMan;
          }
          syncGuidedManufacturerSelects(manSel, stxMan, fromStx);
          return;
        }
      } catch (_e) {}
    }

    var seen = {};
    var map = { 'Weapon': ['Assault Rifle','Pistol','Shotgun','SMG','Sniper Rifle','Sniper','Heavy Weapon'], 'Heavy Weapon': ['Heavy Weapon','Gadget'] };
    var rarities = window.STX_RARITIES;
    if (Array.isArray(rarities)) {
      for (var i = 0; i < rarities.length; i++) {
        var r = rarities[i];
        if (!r || !r.manufacturer) continue;
        var it = String(r.itemType || '').trim();
        var itStr = String(r.itemTypeString || '').toLowerCase();
        var match = (it.toLowerCase() === itemType.toLowerCase()) ||
          (itemType === 'Weapon' && map['Weapon'] && map['Weapon'].indexOf(it) >= 0) ||
          (itemType === 'Heavy Weapon' && (it === 'Heavy Weapon' || it === 'Gadget')) ||
          (itemType === 'Class Mod' && (it === 'Class Mod' || /classmod|class\s*mod/i.test(itStr)));
        if (!match) continue;
        var m = String(r.manufacturer).trim();
        if (m && !seen[m] && m.toLowerCase() !== 'characters' && m.toLowerCase() !== 'weapon' && m.toLowerCase() !== 'heavy weapon') {
          seen[m] = true;
          var displayName = (itemType === 'Class Mod') ? getClassModDisplayName(m) : m;
          appendGuidedManufacturerOption(manSel, stxMan, fromStx, displayName, m, itemType);
        }
      }
    }
    if (Object.keys(seen).length === 0) {
      var all = getAllParts();
      var catNorm = itemType.toLowerCase();
      var skipMans = { characters: 1, gadgets: 1, generic: 1, all: 1, universal: 1, firmware: 1, weapon: 1, 'heavy weapon': 1 };
      for (var j = 0; j < all.length; j++) {
        var p = all[j];
        if (!p || !p.manufacturer) continue;
        var pCat = String(p.category || p.itemType || '').toLowerCase();
        var pIt = String(p.itemType || '').toLowerCase();
        var ok = (pCat === catNorm || pIt === catNorm) ||
          (catNorm === 'weapon' && /assault|pistol|shotgun|smg|sniper|heavy/i.test(pCat + pIt)) ||
          (catNorm === 'heavy weapon' && /heavy|gadget/i.test(pCat + pIt)) ||
          (itemType === 'Class Mod' && (pCat === 'character' || /classmod/i.test(pCat)));
        if (!ok) continue;
        var pm = String(p.manufacturer).trim();
        var pmLower = pm.toLowerCase();
        if (pm && !seen[pmLower] && !skipMans[pmLower]) {
          seen[pmLower] = true;
          var displayName = (itemType === 'Class Mod') ? getClassModDisplayName(pm) : pm;
          appendGuidedManufacturerOption(manSel, stxMan, fromStx, displayName, pm, itemType);
        }
      }
    }
    if (Object.keys(seen).length === 0) {
      var fallback = itemType === 'Class Mod' ? CLASSMOD_FALLBACK_MANS : (itemType === 'Heavy Weapon' ? HEAVY_FALLBACK_MANS : (itemType === 'Weapon' ? WEAPON_FALLBACK_MANS : null));
      if (fallback) {
        for (var f = 0; f < fallback.length; f++) {
          var value = fallback[f];
          var label = (itemType === 'Class Mod') ? getClassModDisplayName(value) : value;
          appendGuidedManufacturerOption(manSel, stxMan, fromStx, label, value, itemType);
        }
      }
    }
    if (preserveMan && Array.prototype.some.call(manSel.options, function(o){ return (o.value||'').trim() === preserveMan; })) {
      manSel.value = preserveMan;
      if (stxMan && fromStx) stxMan.value = preserveMan;
    }
    syncGuidedManufacturerSelects(manSel, stxMan, fromStx);
  }

  function getGuidedOutputEl() {
    if (typeof window.getCodeAppendOutputEl === 'function') {
      try {
        var ap = window.getCodeAppendOutputEl();
        if (ap) return ap;
      } catch (_) {}
    }
    var el = byId('guidedOutputDeserialized');
    return el || byId('outCode');
  }

  function getBaseFamilyFromPrefix(prefixStr) {
    var m = (prefixStr || '').match(/^\s*(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }
  function getFamilyFromToken(tok) {
    var m = (tok || '').match(/^\{\s*(\d+)\s*:\s*\d+\s*\}$/);
    return m ? parseInt(m[1], 10) : null;
  }
  function normalizeGuidedTail(prefixStr, tokens) {
    if (!tokens || !tokens.length) return '';
    // Item family always comes from the header (e.g. "13, 0, 1, 60| … ||"), not from the first {fam:id} in the tail.
    var baseFamily = getBaseFamilyFromPrefix(prefixStr);
    if (baseFamily == null) {
      for (var i = 0; i < tokens.length; i++) {
        baseFamily = getFamilyFromToken(tokens[i]);
        if (baseFamily != null) break;
      }
    }
    if (baseFamily == null || !window.normalizeIdTokensForBaseFamily) return tokens.join(' ');
    var norm = window.normalizeIdTokensForBaseFamily(tokens, baseFamily, { compactSameFamily: false });
    return Array.isArray(norm) ? norm.join(' ') : tokens.join(' ');
  }
  function isRarityToken(tok) {
    var s = String(tok || '').trim();
    var m = s.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
    if (m) {
      var fam = Number(m[1]);
      var id = Number(m[2]);
      if (fam === 1 && id >= 10 && id <= 14) return false;
      if (fam === 1 && id >= 55 && id <= 60) return false;
      return true;
    }
    m = s.match(/^\{\s*(\d+)\s*\}$/);
    return !!m;
  }

  function appendToOutCode(token, forceTarget, replaceRarity) {
    var out = forceTarget || getGuidedOutputEl();
    if (!out) return;
    var serial = (out.value || '').trim();
    var dbl = serial.indexOf('||');
    var prefixStr = dbl >= 0 ? serial.slice(0, dbl).trim() : '';
    var tail = dbl >= 0 ? serial.slice(dbl + 2).trim() : '';
    // When guided output is empty (no prefix), ensure we have a prefix before appending
    var guidedItem = byId('ccGuidedItemType');
    var isGuided = guidedItem && (guidedItem.value || '').trim();
    if (isGuided && !prefixStr && typeof window.computeGuidedPrefix === 'function') {
      prefixStr = window.computeGuidedPrefix();
      if (prefixStr) {
        serial = prefixStr + '|| ';
        dbl = serial.indexOf('||');
      }
    }
    var tokens = (tail.match(/\{[^}]+\}|\"[^\"]+\"|\S+/g) || []).filter(function (t) {
      var s = String(t || '').trim();
      return s && s !== '|' && s !== '||';
    });
    if (replaceRarity) {
      tokens = tokens.filter(function (t) { return !isRarityToken(t); });
    }
    tokens.push(token.indexOf('{') === 0 ? token : (token.indexOf('"') >= 0 ? token : '"' + token + '"'));
    var newTail = normalizeGuidedTail(prefixStr, tokens);
    var newSerial = dbl >= 0 ? serial.slice(0, dbl + 2) + newTail : (serial ? serial + ' || ' + newTail : '|| ' + newTail);
    out.value = newSerial;
    try {
      window.__CC_LAST_CODE_TARGET = (out.id === 'outCode') ? 'simple' : 'guided';
    } catch (_) {}
    try { if (window.refreshGuidedOutputPreview) window.refreshGuidedOutputPreview(); } catch (_) {}
    try { if (typeof window.refreshBuildStatsCore === 'function') window.refreshBuildStatsCore(); } catch (_) {}
  }

  /** Match tail tokens for grouping / remove-one (family:id vs quoted code). */
  function normTailTokenKey(t) {
    var u = String(t || '').trim().replace(/^"+|"+$/g, '');
    var m = u.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
    if (m) return m[1] + ':' + m[2];
    m = u.match(/^\{\s*(\d+)\s*\}$/);
    if (m) return 's:' + m[1];
    return u;
  }

  /**
   * Add (+1) or remove (−1) one instance of a part token from the active guided/simple output tail.
   * @param {string} canonicalToken — token as shown in serial (e.g. {254:10} or spawn code)
   */
  function mutateSerialTailDelta(canonicalToken, delta) {
    var out = getGuidedOutputEl();
    if (!out || canonicalToken == null || canonicalToken === '') return false;
    var d = Number(delta);
    if (!Number.isFinite(d) || d === 0) return false;
    var serial = (out.value || '').trim();
    var dbl = serial.indexOf('||');
    var prefixStr = dbl >= 0 ? serial.slice(0, dbl).trim() : '';
    var tail = dbl >= 0 ? serial.slice(dbl + 2).trim() : '';
    var guidedItem = byId('ccGuidedItemType');
    var isGuided = guidedItem && (guidedItem.value || '').trim();
    if (isGuided && !prefixStr && typeof window.computeGuidedPrefix === 'function') {
      prefixStr = window.computeGuidedPrefix();
      if (prefixStr) {
        serial = prefixStr + '|| ';
        dbl = serial.indexOf('||');
        tail = '';
      }
    }
    var tokens = (tail.match(/\{[^}]+\}|\"[^\"]+\"|\|\s*["']?c["']?\s*,\s*\d+\s*\||\S+/g) || []).filter(function (t) {
      var s = String(t || '').trim();
      return s && s !== '|' && s !== '||';
    });
    var keyWant = normTailTokenKey(canonicalToken);
    if (d < 0) {
      var idx = -1;
      for (var i = 0; i < tokens.length; i++) {
        if (normTailTokenKey(tokens[i]) === keyWant) {
          idx = i;
          break;
        }
      }
      if (idx < 0) return false;
      tokens.splice(idx, 1);
    } else {
      var tok = String(canonicalToken).trim();
      if (tok.indexOf('{') !== 0 && tok.indexOf('"') !== 0) tok = '"' + tok + '"';
      tokens.push(tok);
    }
    var newTail = normalizeGuidedTail(prefixStr, tokens);
    var newSerial = dbl >= 0 ? serial.slice(0, dbl + 2) + newTail : (serial ? serial + ' || ' + newTail : '|| ' + newTail);
    out.value = newSerial;
    try {
      window.__CC_LAST_CODE_TARGET = (out.id === 'outCode') ? 'simple' : 'guided';
    } catch (_) {}
    try { if (window.refreshGuidedOutputPreview) window.refreshGuidedOutputPreview(); } catch (_) {}
    try { if (typeof window.refreshBuildStatsCore === 'function') window.refreshBuildStatsCore(); } catch (_) {}
    try { if (typeof window.refreshImportedInspector === 'function') window.refreshImportedInspector(); } catch (_) {}
    try { if (typeof window.syncFloatingOutput === 'function') window.syncFloatingOutput(true); } catch (_) {}
    return true;
  }

  window.__ccGetGuidedOutputEl = getGuidedOutputEl;
  window.__ccMutateSerialTailDelta = mutateSerialTailDelta;

  function addGunPart(selectId, replaceRarity) {
    var sel = byId(selectId);
    if (!sel || !sel.value) return;
    var tok = sel.value.trim();
    if (!tok) return;
    appendToOutCode(tok, null, !!replaceRarity);
  }

  function addElement() {
    var sel = byId('ccElementPartSelect');
    if (!sel) return;
    var code = (sel.value || '').trim();
    if (!code) return;
    appendToOutCode(code);
  }

  function refreshWeaponDropdowns() {
    var st = getGuidedState();
    var it = String(st.itemType).toLowerCase();
    if (it !== 'weapon' && it !== 'heavy weapon') return;
    var man = getEffectiveManufacturerForFilter();
    var wt = st.weaponType;
    var cat = (it === 'heavy weapon') ? 'Heavy Weapon' : 'Weapon';
    var useSimpleFilter = typeof window.filterPartsForGuided === 'function';

    function filterGuidedWeaponSlotParts(slot, filteredIn) {
      var filtered = filteredIn;
      if (!filtered || !filtered.length) return filtered;
      var c = function (p) { return String((p && p.code) ? p.code : '').toLowerCase(); };
      if (slot.key === 'body') {
        return filtered.filter(function (p) {
          var x = c(p);
          return x.indexOf('part_body_bolt') === -1 && x.indexOf('part_body_flap') === -1;
        });
      }
      if (slot.key === 'bodyAcc' && !useSimpleFilter) {
        var baseAcc = filtered.slice();
        var seenBt = {};
        baseAcc.forEach(function (p) {
          var t = getPartToken(p);
          if (t) seenBt[t] = true;
        });
        try {
          var allB = getAllParts();
          var bodyRows = filterByPartType(allB, 'Body', cat, man, wt);
          for (var bj = 0; bj < bodyRows.length; bj++) {
            var pb = bodyRows[bj];
            var xb = c(pb);
            if (xb.indexOf('part_body_bolt') === -1 && xb.indexOf('part_body_flap') === -1) continue;
            var tb = getPartToken(pb);
            if (tb && !seenBt[tb]) {
              seenBt[tb] = true;
              baseAcc.push(pb);
            }
          }
        } catch (_e) {}
        return baseAcc;
      }
      if (slot.key === 'bodyEle') return filtered.filter(function (p) { return c(p).indexOf('part_body_ele') !== -1; });
      if (slot.key === 'hyperionSecondaryAcc') return filtered.filter(function (p) { return c(p).indexOf('part_shield') !== -1; });
      if (slot.key === 'secondaryAmmo') return filtered.filter(function (p) { return c(p).indexOf('part_secondary_ammo') !== -1; });
      if (slot.key === 'licensed') return filtered.filter(function (p) { return c(p).indexOf('barrel_licensed') !== -1; });
      /* Main magazine: exclude Tediore thrown + parts that belong in Magazine Accessory (avoids duplicates with those rows). */
      if (slot.key === 'mag') {
        var matchAcc = typeof window.magazineAccessoryCodeMatchLo === 'function' ? window.magazineAccessoryCodeMatchLo : null;
        return filtered.filter(function (p) {
          var x = c(p);
          if (x.indexOf('mag_ted_thrown') !== -1) return false;
          if (matchAcc && matchAcc(x)) return false;
          return true;
        });
      }
      if (slot.key === 'magazineAcc') {
        var matchLo = typeof window.magazineAccessoryCodeMatchLo === 'function' ? window.magazineAccessoryCodeMatchLo : null;
        return filtered.filter(function (p) {
          var x = c(p);
          if (matchLo) return matchLo(x);
          return /mag_acc|magazine_acc/.test(x) || (x.indexOf('part_mag') !== -1 && x.indexOf('acc') !== -1);
        });
      }
      if (slot.key === 'magazineTedThrown') return filtered.filter(function (p) { return c(p).indexOf('mag_ted_thrown') !== -1; });
      return filtered;
    }

    for (var i = 0; i < WEAPON_SLOTS.length; i++) {
      var slot = WEAPON_SLOTS[i];
      var sel = byId(slot.selectId);
      if (!sel) continue;
      if (slot.pearlPick) {
        var allPearl = getAllParts();
        var fp = [];
        for (var pi = 0; pi < allPearl.length; pi++) {
          var pp = allPearl[pi];
          if (!pp || String(pp.category || '').trim() !== 'Weapon') continue;
          if (/part_pearl/i.test(String(pp.code || ''))) fp.push(pp);
        }
        fillSelect(sel, fp, 80);
        continue;
      }
      if (slot.partType === 'Element' && slot.key === 'element') {
        sel.innerHTML = '';
        var phEl = new Option('-- Element --', '');
        applyDataCcIconIfAny(phEl, CC_ELEMENT_PLACEHOLDER_ICON_FILE);
        sel.appendChild(phEl);
        for (var j = 0; j < ELEMENTS.length; j++) {
          var ej = ELEMENTS[j];
          var optEl = new Option(guidedPresetElementOptionLabel(ej), ej.code);
          if (ej.code) optEl.title = 'Output token: ' + ej.code;
          if (ej.iconFile) applyDataCcIconIfAny(optEl, ej.iconFile);
          sel.appendChild(optEl);
        }
        sel.__ccGuidedPartsList = null;
        bindGuidedSelectPreviewIfNeeded(sel);
        updateGuidedSelectPreview(sel);
        syncGuidedCustomSelectIfWrapped(sel);
        continue;
      }
      var filtered;
      if (useSimpleFilter) {
        filtered = window.filterPartsForGuided({
          category: 'Weapon',
          manufacturer: man || '',
          weaponType: (it === 'heavy weapon') ? 'Heavy Weapon' : (wt || ''),
          partType: slot.partType
        });
        filtered = filterGuidedWeaponSlotParts(slot, filtered);
      } else {
        var all = getAllParts();
        filtered = filterByPartType(all, slot.partType, cat, man, wt);
        filtered = filterGuidedWeaponSlotParts(slot, filtered);
      }
      if (slot.partType === 'Rarity' && filtered && filtered.length) {
        filtered = filtered.slice().sort(function (a, b) {
          var na = (a.name || a.legendaryName || '').toLowerCase();
          var nb = (b.name || b.legendaryName || '').toLowerCase();
          return na.localeCompare(nb, undefined, { numeric: true });
        });
      } else if (filtered && filtered.length) {
        filtered = sortGuidedPartsByCode(filtered);
      }
      var maxItems = (slot.partType === 'Rarity') ? 600 : 1200;
      var emptyHintWeapon = '';
      if (slot.key === 'bodyEle') emptyHintWeapon = GUIDED_HINT_EMPTY_BODY_ELEMENT;
      else if (slot.key === 'secondaryEle') emptyHintWeapon = GUIDED_HINT_EMPTY_MALIWAN_SWITCH;
      fillSelect(sel, filtered, maxItems, emptyHintWeapon);
      var fc = (filtered && filtered.length) ? filtered.length : 0;
      applyGuidedBodySlotRowVisibility(sel, 'Weapon', slot.key, fc);
    }
  }

  function wireWeaponAddButtons() {
    for (var i = 0; i < WEAPON_SLOTS.length; i++) {
      var slot = WEAPON_SLOTS[i];
      var btn = byId(slot.btnId);
      if (!btn) continue;
      (function (sid, isElementPreset, isRarity) {
        btn.addEventListener('click', function () {
          if (isElementPreset) addElement();
          else addGunPart(sid, isRarity);
        });
      })(slot.selectId, slot.key === 'element', slot.key === 'rarity');
    }
  }

  var ITEM_TYPE_TO_BUILDER = {
    'Shield': 'ccShieldBuilderDetails',
    'Grenade': 'ccGrenadeBuilderDetails',
    'Repkit': 'ccRepkitBuilderDetails',
    'Enhancement': 'ccEnhancementBuilderDetails',
    'Class Mod': 'ccClassModBuilderDetails',
    'Heavy Weapon': 'ccHeavyBuilderDetails'
  };

  var GEAR_SLOTS_BY_CATEGORY = {
    Shield: [
      { key: 'mainBody', label: 'Main Part', partType: 'Body', selectId: 'ccShieldMainPartSelect', btnId: 'ccShieldMainPartAdd' },
      { key: 'resistance', label: 'Resistance', partType: '', selectId: 'ccShieldResistanceSelect', btnId: 'ccShieldResistanceAdd' },
      { key: 'primary246', label: 'Primary Perks 246', partType: 'Perk', selectId: 'ccShieldPrimaryPerksSelect', btnId: 'ccShieldPrimaryPerksAdd' },
      { key: 'secondary246', label: 'Secondary Perks 246', partType: 'Perk', selectId: 'ccShieldSecondaryPerksSelect', btnId: 'ccShieldSecondaryPerksAdd' },
      { key: 'armor237', label: 'Armor 237', partType: '', selectId: 'ccShieldArmorSelect', btnId: 'ccShieldArmorAdd' },
      { key: 'energy248', label: 'Energy 248', partType: '', selectId: 'ccShieldEnergySelect', btnId: 'ccShieldEnergyAdd' },
      { key: 'firmware246', label: 'Firmware 246', partType: 'Firmware', selectId: 'ccShieldFirmwareSelect', btnId: 'ccShieldFirmwareAdd' },
      { key: 'elementType1', label: 'Element (TypeID 1)', partType: 'TypeID1Element', selectId: 'ccShieldElementSelect', btnId: 'ccShieldElementAdd' }
    ],
    Grenade: [
      { key: 'firmware', label: 'Firmware', partType: 'Firmware', selectId: 'ccGrenadeFirmwareSelect', btnId: 'ccGrenadeFirmwareAdd' },
      { key: 'payload', label: 'Payload', partType: 'Payload', selectId: 'ccGrenadePayloadSelect', btnId: 'ccGrenadePayloadAdd' },
      { key: 'augment', label: 'Augment', partType: 'Augment', selectId: 'ccGrenadeAugmentSelect', btnId: 'ccGrenadeAugmentAdd' },
      { key: 'element', label: 'Element', partType: 'Element', selectId: 'ccGrenadeElementSelect', btnId: 'ccGrenadeElementAdd' },
      { key: 'special', label: 'Special / Unique', partType: '', selectId: 'ccGrenadeSpecialSelect', btnId: 'ccGrenadeSpecialAdd' }
    ],
    Repkit: [
      { key: 'rarity', label: 'Legendary ID', partType: 'Rarity', selectId: 'ccRepkitRaritySelect', btnId: 'ccRepkitRarityAdd' },
      { key: 'augment', label: 'Augment', partType: 'Augment', selectId: 'ccRepkitAugmentSelect', btnId: 'ccRepkitAugmentAdd' },
      { key: 'perk', label: 'Perk', partType: 'Perk', selectId: 'ccRepkitPerkSelect', btnId: 'ccRepkitPerkAdd' },
      { key: 'firmware', label: 'Firmware', partType: 'Firmware', selectId: 'ccRepkitFirmwareSelect', btnId: 'ccRepkitFirmwareAdd' },
      { key: 'element', label: 'Element', partType: 'Element', selectId: 'ccRepkitElementSelect', btnId: 'ccRepkitElementAdd' },
      { key: 'legendary', label: 'Legendary Perks', partType: 'Legendary Perks', selectId: 'ccRepkitLegendarySelect', btnId: 'ccRepkitLegendaryAdd' },
      { key: 'special', label: 'Special / Unique', partType: '', selectId: 'ccRepkitSpecialSelect', btnId: 'ccRepkitSpecialAdd' }
    ],
    Enhancement: [],
    'Class Mod': [
      { key: 'namePart', label: 'Prefix Part', partType: 'Name+Skin', selectId: 'ccClassModPrefixSelect', btnId: 'ccClassModPrefixAdd' },
      { key: 'universal', label: 'Universal Parts', partType: 'Universal', selectId: 'ccClassModUniversalSelect', btnId: 'ccClassModUniversalAdd' },
      { key: 'perk', label: 'Perks', partType: 'Skill', selectId: 'ccClassModPerkSelect', btnId: 'ccClassModPerkAdd' },
      { key: 'element', label: 'Element Override', partType: 'Element', selectId: 'ccClassModElementSelect', btnId: 'ccClassModElementAdd' },
      { key: 'secondary', label: 'Secondary Parts', partType: 'Secondary', selectId: 'ccClassModSecondarySelect', btnId: 'ccClassModSecondaryAdd' },
      { key: 'firmware', label: 'Firmware', partType: 'Firmware', selectId: 'ccClassModFirmwareSelect', btnId: 'ccClassModFirmwareAdd' }
    ],
    'Heavy Weapon': [
      { key: 'rarity', label: 'Rarity ID', partType: 'Rarity', selectId: 'ccHeavyRaritySelect', btnId: 'ccHeavyRarityAdd' },
      { key: 'body', label: 'Body', partType: 'Body', selectId: 'ccHeavyBodySelect', btnId: 'ccHeavyBodyAdd' },
      { key: 'bodyAcc', label: 'Body Accessory', partType: 'Body Accessory', selectId: 'ccHeavyBodyAccSelect', btnId: 'ccHeavyBodyAccAdd' },
      { key: 'barrel', label: 'Barrel', partType: 'Barrel', selectId: 'ccHeavyBarrelSelect', btnId: 'ccHeavyBarrelAdd' },
      { key: 'barrelAcc', label: 'Barrel Accessory', partType: 'Barrel Accessory', selectId: 'ccHeavyBarrelAccSelect', btnId: 'ccHeavyBarrelAccAdd' },
      { key: 'payload', label: 'Payload', partType: 'Payload', selectId: 'ccHeavyPayloadSelect', btnId: 'ccHeavyPayloadAdd' },
      { key: 'augment', label: 'Augment', partType: 'Augment', selectId: 'ccHeavyAugmentSelect', btnId: 'ccHeavyAugmentAdd' },
      { key: 'element', label: 'Element', partType: 'Element', selectId: 'ccHeavyElementSelect', btnId: 'ccHeavyElementAdd' },
      { key: 'elementSwitch', label: 'Maliwan Switch (2nd element)', partType: 'Element Switch', selectId: 'ccHeavyElementSwitchSelect', btnId: 'ccHeavyElementSwitchAdd', maliwanOnly: true },
      { key: 'firmware', label: 'Firmware', partType: 'Firmware', selectId: 'ccHeavyFirmwareSelect', btnId: 'ccHeavyFirmwareAdd' },
      { key: 'legendary', label: 'Legendary Perks', partType: 'Legendary Perks', selectId: 'ccHeavyLegendarySelect', btnId: 'ccHeavyLegendaryAdd' }
    ]
  };

  function refreshGearDropdowns(category) {
    var st = getGuidedState();
    var man = getEffectiveManufacturerForFilter();
    var slots = GEAR_SLOTS_BY_CATEGORY[category];
    if (!slots) return;
    var useSimpleFilter = typeof window.filterPartsForGuided === 'function';
    var filterCat = (category === 'Class Mod') ? 'Class Mod' : category;
    var filterWt = (category === 'Heavy Weapon') ? 'Heavy Weapon' : '';
    if (category === 'Heavy Weapon') filterCat = 'Weapon';

    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      var sel = byId(slot.selectId);
      if (!sel) continue;
      var slotMan = man || '';
      if (category === 'Heavy Weapon' && slot.partType === 'Legendary Perks') slotMan = '';
      var filtered;
      if (useSimpleFilter) {
        filtered = window.filterPartsForGuided({
          category: filterCat,
          manufacturer: slotMan,
          weaponType: filterWt,
          partType: slot.partType || ''
        });
      } else {
        var all = getAllParts();
        filtered = filterByPartType(all, slot.partType, category === 'Heavy Weapon' ? 'Heavy Weapon' : category, slotMan, category === 'Heavy Weapon' ? 'Heavy Weapon' : null);
      }
      if (slot.partType !== 'Rarity' && filtered && filtered.length && !(category === 'Heavy Weapon' && slot.partType === 'Legendary Perks')) {
        filtered = sortGuidedPartsByCode(filtered);
      }
      var maxItems = (slot.partType === 'Rarity') ? 600 : 1200;
      var emptyHintGear = (slot.key === 'elementSwitch') ? GUIDED_HINT_EMPTY_MALIWAN_SWITCH : '';
      if (category === 'Heavy Weapon' && slot.partType === 'Legendary Perks' && filtered && filtered.length) {
        fillSelectWithLegendaryGroups(sel, filtered);
      } else {
        fillSelect(sel, filtered, maxItems, emptyHintGear);
      }
      if (category === 'Heavy Weapon' && (slot.partType === 'Payload' || slot.partType === 'Augment')) {
        var wrap = sel && sel.parentElement && sel.parentElement.parentElement ? sel.parentElement.parentElement : null;
        var hasParts = filtered && filtered.length > 0;
        var greyClass = 'cc-heavy-slot-empty';
        if (wrap) {
          if (hasParts) wrap.classList.remove(greyClass);
          else wrap.classList.add(greyClass);
        }
        var btn = byId(slot.btnId);
        if (btn) {
          if (hasParts) btn.classList.remove(greyClass);
          else btn.classList.add(greyClass);
        }
      }
      var fgc = (filtered && filtered.length) ? filtered.length : 0;
      applyGuidedBodySlotRowVisibility(sel, category, slot.key, fgc);
    }
  }

  function wireGearAddButtons() {
    var cats = Object.keys(GEAR_SLOTS_BY_CATEGORY);
    for (var c = 0; c < cats.length; c++) {
      var slots = GEAR_SLOTS_BY_CATEGORY[cats[c]];
      for (var i = 0; i < slots.length; i++) {
        var slot = slots[i];
        var btn = byId(slot.btnId);
        if (!btn) continue;
        (function (sid, replaceRarity) {
          btn.addEventListener('click', function () { addGunPart(sid, replaceRarity); });
        })(slot.selectId, slot.key === 'rarity');
      }
    }
  }

  function syncGuidedVisibility() {
    var st = getGuidedState();
    var itemType = st.itemType;
    var gunWrap = byId('ccGunBuilder');
    var gearHub = byId('ccGearGuidedHub');
    var hint = byId('ccGunBuilderHint');
    var weaponTypeWrap = byId('ccGuidedWeaponTypeWrap');
    var manLabel = byId('ccGuidedManufacturerLabel');
    var manSel = byId('ccGuidedManufacturer');

    var isWeapon = /weapon/i.test(itemType) && !/heavy/i.test(itemType);
    var isHeavy = /heavy/i.test(itemType);
    var isGear = !isWeapon && (isHeavy || itemType);
    if (gunWrap) gunWrap.style.display = isWeapon ? '' : 'none';
    if (gearHub) gearHub.style.display = isGear ? '' : 'none';
    if (hint) hint.textContent = isWeapon ? 'Select parts below and click Add to append to output.' : 'Select a non-weapon item type above to see gear builders.';
    if (weaponTypeWrap) weaponTypeWrap.style.display = isWeapon ? '' : 'none';

    if (manLabel && manSel) {
      if (itemType === 'Class Mod') {
        manLabel.textContent = 'Character';
        if (manSel.options.length && manSel.options[0]) manSel.options[0].text = 'Select character...';
        manSel.disabled = false;
      } else if (itemType === 'Enhancement') {
        manLabel.textContent = 'Choose below';
        manSel.innerHTML = '<option value="">Choose below</option>';
        manSel.disabled = true;
      } else {
        manLabel.textContent = 'Manufacturer';
        if (manSel.options.length && manSel.options[0]) manSel.options[0].text = 'Select manufacturer...';
        manSel.disabled = false;
      }
    }

    if (isWeapon) {
      refreshWeaponDropdowns();
    } else if (itemType && gearHub) {
      var builderIds = ['ccShieldBuilderDetails', 'ccGrenadeBuilderDetails', 'ccRepkitBuilderDetails', 'ccEnhancementBuilderDetails', 'ccClassModBuilderDetails', 'ccHeavyBuilderDetails'];
      var activeId = ITEM_TYPE_TO_BUILDER[itemType];
      for (var b = 0; b < builderIds.length; b++) {
        var el = byId(builderIds[b]);
        if (el) el.style.display = (builderIds[b] === activeId) ? '' : 'none';
      }
      if (activeId && GEAR_SLOTS_BY_CATEGORY[itemType] && itemType !== 'Class Mod' && itemType !== 'Enhancement') {
        // Defer Heavy Weapon dropdown refresh to avoid blocking UI (12 filter runs over large dataset)
        if (itemType === 'Heavy Weapon') {
          setTimeout(function () { refreshGearDropdowns(itemType); }, 0);
        } else {
          refreshGearDropdowns(itemType);
        }
      }
      if (itemType === 'Class Mod' && typeof window.__ccClassmodChecklistRender === 'function') {
        try { window.__ccClassmodChecklistRender(); } catch (_) {}
      }
      if (itemType === 'Enhancement' && typeof window.__ccEnhancementChecklistRender === 'function') {
        try { window.__ccEnhancementChecklistRender(); } catch (_) {}
      }
      if (typeof window.refreshPartSections === 'function') window.refreshPartSections();
    }
  }

  function wireGuidedFullStatsPreviewToggle() {
    var el = byId('ccGuidedFullStatsPreview');
    if (!el || el.__ccFullStatsWired) return;
    el.__ccFullStatsWired = true;
    try {
      if (localStorage.getItem('ccGuidedFullStatsPreview') === '1') el.checked = true;
    } catch (_) {}
    el.addEventListener('change', function () {
      try {
        localStorage.setItem('ccGuidedFullStatsPreview', el.checked ? '1' : '0');
      } catch (_) {}
      refreshAllGuidedSlotPreviews();
    });
  }

  function init() {
    wireGuidedFullStatsPreviewToggle();
    wireWeaponAddButtons();
    wireGearAddButtons();

    function getSelectValue(sel) {
      if (!sel || sel.tagName !== 'SELECT') return '';
      var v = (sel.value || '').trim();
      if (v) return v;
      var opt = sel.options[sel.selectedIndex];
      return (opt && (opt.value || '').trim()) || '';
    }
    function syncGuidedToSimple() {
      syncIdModeFromCheckbox();
      var gi = byId('ccGuidedItemType');
      var gm = byId('ccGuidedManufacturer');
      var gw = byId('ccGuidedWeaponType');
      var gl = byId('ccGuidedLevel');
      var si = byId('stx_itemType');
      var sm = byId('stx_manufacturer');
      var wt = byId('weaponType');
      var st = window.state || window.__STX_SIMPLE_STATE;
      if (st) {
        if (gi) st.itemType = getSelectValue(gi);
        if (gm) st.manufacturer = getSelectValue(gm);
        if (gw) st.weaponType = getSelectValue(gw);
        if (gl) {
          var lv = Number(gl.value || 50);
          if (!Number.isFinite(lv) || lv < 1) lv = 50;
          if (lv > 100) lv = 100;
          st.level = lv;
        }
      }
      var giVal = getSelectValue(gi);
      var gmVal = getSelectValue(gm);
      var gwVal = getSelectValue(gw);
      var isGuidedClassMod = isGuidedClassModItemType(giVal);
      if (gi && si && giVal !== (si.value || '')) { si.value = giVal; si.dispatchEvent(new Event('change', { bubbles: true })); }
      // Class Mod guided uses its own manufacturer control (#ccGuidedManufacturer); do not overwrite Simple Builder's #stx_manufacturer.
      if (!isGuidedClassMod && gm && sm && gmVal !== (sm.value || '')) { sm.value = gmVal; sm.dispatchEvent(new Event('change', { bubbles: true })); }
      if (gw && wt && gwVal !== (wt.value || '')) { wt.value = gwVal; wt.dispatchEvent(new Event('change', { bubbles: true })); }
      if (gl) {
        var lv = Number(gl.value || 50);
        if (!Number.isFinite(lv) || lv < 1) lv = 50;
        if (lv > 100) lv = 100;
        var levEl = byId('level') || byId('level2');
        if (levEl && Number(levEl.value || 0) !== lv) levEl.value = String(lv);
      }
    }
    window.syncGuidedToSimple = syncGuidedToSimple;
    function refreshGuidedOutput() {
      var deserEl = byId('guidedOutputDeserialized');
      if (!deserEl) return;
      var prefix = (typeof window.computeGuidedPrefix === 'function') ? window.computeGuidedPrefix() : '';
      if (!prefix) {
        deserEl.value = '';
        var serialEl = byId('guidedOutputSerial');
        if (serialEl) serialEl.value = '';
        try { if (typeof window.refreshGuidedOutputPreview === 'function') window.refreshGuidedOutputPreview(); } catch (_) {}
        return;
      }
      var existing = (deserEl.value || '').trim();
      var dbl = existing.indexOf('||');
      if (dbl < 0) {
        if (existing) {
          try { if (typeof window.refreshGuidedOutputPreview === 'function') window.refreshGuidedOutputPreview(); } catch (_) {}
          return;
        }
        deserEl.value = prefix;
        try { if (typeof window.refreshGuidedOutputPreview === 'function') window.refreshGuidedOutputPreview(); } catch (_) {}
        return;
      }
      var tail = existing.slice(dbl + 2).trim();
      while (tail.charAt(0) === '|') tail = tail.replace(/^\|+\s*/, '').trim();
      if (tail) {
        var tokens = (tail.match(/\{[^}]+\}|\"[^\"]+\"|\S+/g) || []);
        tail = normalizeGuidedTail(prefix, tokens);
      }
      deserEl.value = tail ? prefix + ' ' + tail : prefix;
      try { if (typeof window.refreshGuidedOutputPreview === 'function') window.refreshGuidedOutputPreview(); } catch (_) {}
    }
    window.refreshGuidedOutput = refreshGuidedOutput;
    function clearCodeSectionsForNewItem() {
      var out = byId('guidedOutputDeserialized');
      if (out) out.value = '';
      out = byId('guidedOutputSerial');
      if (out) out.value = '';
      try { if (typeof window.refreshGuidedOutput === 'function') window.refreshGuidedOutput(); } catch (_) {}
    }
    function onItemTypeChange() {
      syncGuidedToSimple();
      loadGuidedManufacturers();
      if (typeof loadGuidedWeaponTypes === 'function') loadGuidedWeaponTypes();
      syncGuidedVisibility();
      clearCodeSectionsForNewItem();
      scheduleGuidedPreviewRefreshIfFullStats();
    }
    function onManufacturerOrWeaponChange() {
      syncGuidedToSimple();
      if (typeof loadGuidedWeaponTypes === 'function') loadGuidedWeaponTypes();
      syncGuidedVisibility();
      clearCodeSectionsForNewItem();
      scheduleGuidedPreviewRefreshIfFullStats();
    }
    function onWeaponTypeChange() {
      syncGuidedToSimple();
      syncGuidedVisibility();
      clearCodeSectionsForNewItem();
      scheduleGuidedPreviewRefreshIfFullStats();
    }
    var guidedItem = byId('ccGuidedItemType');
    var guidedMan = byId('ccGuidedManufacturer');
    var guidedWt = byId('ccGuidedWeaponType');
    if (guidedItem) guidedItem.addEventListener('change', onItemTypeChange);
    if (guidedMan) guidedMan.addEventListener('change', onManufacturerOrWeaponChange);
    if (guidedWt) guidedWt.addEventListener('change', onWeaponTypeChange);
    var allMansToggle = byId('ccGuidedAllManufacturers');
    if (allMansToggle) {
      allMansToggle.addEventListener('change', function () {
        syncGuidedVisibility();
        try { if (typeof window.refreshOutputs === 'function') window.refreshOutputs(); } catch (_) {}
      });
    }

    var guidedLevel = byId('ccGuidedLevel');
    if (guidedLevel) {
      guidedLevel.addEventListener('change', function () {
        syncGuidedToSimple();
        try { if (typeof window.refreshGuidedOutput === 'function') window.refreshGuidedOutput(); } catch (_) {}
      });
      guidedLevel.addEventListener('input', function () {
        syncGuidedToSimple();
        try { if (typeof window.refreshGuidedOutput === 'function') window.refreshGuidedOutput(); } catch (_) {}
      });
    }
    var guidedBuyback = byId('ccGuidedBuybackFlag');
    if (guidedBuyback) {
      guidedBuyback.addEventListener('change', function () {
        try { if (typeof window.refreshGuidedOutput === 'function') window.refreshGuidedOutput(); } catch (_) {}
        try { if (typeof window.refreshOutputs === 'function') window.refreshOutputs(); } catch (_) {}
      });
    }

    if (window.ensurePartPools) window.ensurePartPools();
    loadGuidedManufacturers();
    if (typeof loadGuidedWeaponTypes === 'function') loadGuidedWeaponTypes();
    syncGuidedVisibility();
    setTimeout(function () { refreshToolsStandaloneElementDropdowns(); }, 0);
    setTimeout(function () {
      var it = (guidedItem && guidedItem.value) || (byId('stx_itemType') && byId('stx_itemType').value);
      if (it) {
        loadGuidedManufacturers();
        if (typeof loadGuidedWeaponTypes === 'function') loadGuidedWeaponTypes();
        syncGuidedVisibility();
      }
      if (typeof window.refreshPartSections === 'function') window.refreshPartSections();
      if (typeof window.refreshGuidedOutput === 'function') window.refreshGuidedOutput();
      refreshToolsStandaloneElementDropdowns();
    }, 500);
    var randBtn = byId('rebuildRandomFullBuildBtn');
    if (randBtn && typeof randomFullBuild === 'function') {
      randBtn.onclick = function () { randomFullBuild(); };
    }
  }

  var PART_SECTIONS = [
    { key: 'Grenade', selectId: 'partSelectGrenade', btnId: 'partAddGrenade', poolKey: 'GRENADE_PARTS' },
    { key: 'Shield', selectId: 'partSelectShield', btnId: 'partAddShield', poolKey: 'SHIELD_PARTS' },
    { key: 'Repkit', selectId: 'partSelectRepkit', btnId: 'partAddRepkit', poolKey: 'REPKIT_PARTS' },
    { key: 'Enhancement', selectId: 'partSelectEnhancement', btnId: 'partAddEnhancement', poolKey: 'ENHANCEMENT_PARTS' },
    { key: 'ClassMod', selectId: 'partSelectClassMod', btnId: 'partAddClassMod', poolKey: 'CLASSMOD_PARTS' },
    { key: 'Heavy', selectId: 'partSelectHeavy', btnId: 'partAddHeavy', poolKey: 'HEAVY_PARTS' },
    { key: 'Gun', selectId: 'partSelectGun', btnId: 'partAddGun', poolKey: 'GUN_PARTS' }
  ];

  function fillPartSectionSelect(sel, parts, maxItems) {
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Select part --</option>';
    var isClassmodManualSection = String(sel.id || '') === 'partSelectClassMod';
    var pool = parts || [];
    var limit = Math.min(pool.length, maxItems || 1200);
    var listForPreview = [];
    for (var i = 0; i < limit; i++) {
      var p = pool[i];
      var tok = getPartToken(p);
      if (!tok) continue;
      listForPreview.push(p);
      var human = (p.name || p.legendaryName || '').trim();
      var label = compactGuidedPartLabel(p);
      var perkMeta = null;
      if (isClassmodManualSection) {
        perkMeta = getClassmodPerkMetaByName(human || p.name || p.legendaryName || '');
      }
      var opt = new Option(label, tok);
      if (typeof window.partTooltipText === 'function') { var t = window.partTooltipText(p); if (t) opt.title = t; }
      if (perkMeta) {
        opt.setAttribute('data-perk-name', String(perkMeta.name || human || ''));
        opt.setAttribute('data-perk-desc', String(perkMeta.description || ''));
      }
      sel.appendChild(opt);
    }
    sel.__ccGuidedPartsList = listForPreview;
    if (isClassmodManualSection) {
      updateClassmodPartPreview(sel);
    } else {
      bindGuidedSelectPreviewIfNeeded(sel);
      updateGuidedSelectPreview(sel);
    }
  }

  function refreshPartSections() {
    if (window.ensurePartPools) window.ensurePartPools();
    if (typeof window.__ccEnsureCodeIdMap === 'function') { try { window.__ccEnsureCodeIdMap(); } catch (_) {} }
    for (var i = 0; i < PART_SECTIONS.length; i++) {
      var s = PART_SECTIONS[i];
      var sel = byId(s.selectId);
      var pool = window[s.poolKey];
      fillPartSectionSelect(sel, pool || [], 1200);
    }
    refreshToolsStandaloneElementDropdowns();
  }

  function wirePartSectionAdd(selectId) {
    var sel = byId(selectId);
    if (!sel) return;
    var btn = sel.nextElementSibling;
    while (btn && btn.tagName !== 'BUTTON') btn = btn.nextElementSibling;
    if (!btn) btn = byId(selectId.replace('partSelect', 'partAdd'));
    if (!btn) return;
    btn.addEventListener('click', function () {
      var tok = (sel.value || '').trim();
      if (tok) appendToOutCode(tok);
    });
  }

  function initPartSections() {
    for (var i = 0; i < PART_SECTIONS.length; i++) {
      var s = PART_SECTIONS[i];
      var sel = byId(s.selectId);
      var btn = byId(s.btnId);
      if (btn && sel) {
        (function (sid) {
          btn.addEventListener('click', function () {
            var tok = (byId(sid).value || '').trim();
            if (tok) appendToOutCode(tok);
          });
        })(s.selectId);
      }
    }
    var cmSel = byId('partSelectClassMod');
    if (cmSel && !cmSel.__perkPreviewBound) {
      cmSel.__perkPreviewBound = true;
      cmSel.addEventListener('change', function () { updateClassmodPartPreview(cmSel); });
      updateClassmodPartPreview(cmSel);
    }
    refreshPartSections();
  }

  function loadGuidedSkinCamo() {
    var skinSel = byId('ccGuidedSkinSelect');
    var camoSel = byId('ccGuidedCamoSelect');
    if (typeof window.populateSkinCamo === 'function') {
      window.populateSkinCamo(skinSel, camoSel);
    }
  }

  function loadGuidedLegendaryPerks() {
    var sel = byId('ccGuidedLegendaryPerkSelect');
    if (typeof window.populateLegendaryPerks === 'function') {
      window.populateLegendaryPerks(sel, getPartToken);
      try {
        // `populateLegendaryPerks` only writes token text; map options back to parts
        // so custom-select can render rarity-aware icons in this standalone section.
        var all = getAllParts();
        var tokToPart = Object.create(null);
        for (var i = 0; i < all.length; i++) {
          var p = all[i];
          if (!p) continue;
          if (!/legendary\s*perk/i.test(String(p.partType || ''))) continue;
          var tok = getPartToken(p);
          if (!tok || tokToPart[tok]) continue;
          tokToPart[tok] = p;
        }
        if (sel && sel.options) {
          for (var j = 0; j < sel.options.length; j++) {
            var opt = sel.options[j];
            if (!opt || !opt.value) continue;
            var pp = tokToPart[String(opt.value || '')];
            if (!pp) continue;
            applyGuidedPartOptionIcon(sel, opt, pp);
          }
        }
      } catch (_) {}
      syncGuidedCustomSelectIfWrapped(sel);
    }
  }

  /* Preset categories and parts from reference ScootersToolbox.html (BOOST_POOLS) */
  var PRESET_CATEGORIES = [
    { key: 'damage', label: 'Damage' },
    { key: 'accuracy', label: 'Accuracy' },
    { key: 'reload', label: 'Reload Speed' },
    { key: 'firerate', label: 'Fire Rate' },
    { key: 'ammo', label: 'Ammo' },
    { key: 'splash', label: 'Splash Damage' },
    { key: 'crit', label: 'Crit Damage' }
  ];
  var PRESET_BOOST_POOLS = {
    damage: [{ key: 22, value: '72' }, { key: 9, value: '28' }, { key: 9, value: '32' }, { key: 9, value: '40' }, { key: 9, value: '55' }, { key: 9, value: '59' }, { key: 9, value: '62' }, { key: 9, value: '68' }],
    accuracy: [{ key: 13, value: '12' }, { key: 9, value: '48' }],
    reload: [{ key: 24, value: '44' }, { key: 9, value: '61' }],
    firerate: [{ key: 14, value: '1' }, { key: 27, value: '15' }],
    ammo: [{ key: 18, value: '14' }, { key: 27, value: '75' }],
    splash: [{ key: 6, value: '33' }, { key: 9, value: '89' }, { key: 24, value: '18' }],
    crit: [{ key: 3, value: '6' }, { key: 24, value: '33' }]
  };

  function loadGuidedPresetCategories() {
    var sel = byId('ccGuidedPresetCategorySelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Select category --</option>';
    for (var i = 0; i < PRESET_CATEGORIES.length; i++) {
      var c = PRESET_CATEGORIES[i];
      sel.appendChild(new Option(c.label, c.key));
    }
  }

  function loadGuidedPresetParts() {
    var catSel = byId('ccGuidedPresetCategorySelect');
    var partSel = byId('ccGuidedPresetPartSelect');
    if (!catSel || !partSel) return;
    var catKey = (catSel.value || '').trim();
    partSel.innerHTML = '<option value="">-- Select preset --</option>';
    if (!catKey) return;
    var pool = PRESET_BOOST_POOLS[catKey];
    if (!Array.isArray(pool) || pool.length === 0) return;
    try {
      var parts = (window.STX_DATASET && window.STX_DATASET.ALL_PARTS) ? window.STX_DATASET.ALL_PARTS : [];
      var idRawSet = {};
      for (var i = 0; i < pool.length; i++) {
        var entry = pool[i];
        var k = entry.key != null ? entry.key : entry.k;
        var v = entry.value != null ? entry.value : entry.v;
        if (k != null && v != null) idRawSet[String(k) + ':' + String(v)] = true;
      }
      var filtered = parts.filter(function (p) {
        if (!p) return false;
        var idRaw = String(p.idRaw || p.idraw || '').trim();
        return idRaw && idRawSet[idRaw];
      });
      for (var j = 0; j < filtered.length; j++) {
        var px = filtered[j];
        var tok = getPartToken(px);
        var name = compactGuidedPartLabel(px);
        if (tok) {
          var opt = new Option(name, tok);
          if (typeof window.partTooltipText === 'function') { var t = window.partTooltipText(px); if (t) opt.title = t; }
          partSel.appendChild(opt);
        }
      }
    } catch (_) {}
  }

  var __guidedExtraWired = false;
  function initGuidedExtraSections() {
    loadGuidedSkinCamo();
    loadGuidedLegendaryPerks();
    loadGuidedPresetCategories();
    loadGuidedPresetParts();

    if (__guidedExtraWired) return;
    __guidedExtraWired = true;

    var btnSkinCamo = byId('ccGuidedAddSkinCamo');
    if (btnSkinCamo) {
      btnSkinCamo.addEventListener('click', function () {
        var skin = byId('ccGuidedSkinSelect');
        var camo = byId('ccGuidedCamoSelect');
        if (skin && skin.value) appendToOutCode(skin.value);
        if (camo && camo.value) appendToOutCode(camo.value);
        try { if (window.refreshGuidedOutputPreview) window.refreshGuidedOutputPreview(); } catch (_) {}
      });
    }

    var btnLeg = byId('ccGuidedAddLegendaryPart');
    if (btnLeg) {
      btnLeg.addEventListener('click', function () {
        var s = byId('ccGuidedLegendaryPerkSelect');
        if (s && s.value) appendToOutCode(s.value);
        try { if (window.refreshGuidedOutputPreview) window.refreshGuidedOutputPreview(); } catch (_) {}
      });
    }

    var btnLegAll = byId('ccGuidedAddAllLegendaryParts');
    if (btnLegAll) {
      btnLegAll.addEventListener('click', function () {
        var s = byId('ccGuidedLegendaryPerkSelect');
        if (!s) return;
        var all = (window.STX_DATASET && window.STX_DATASET.ALL_PARTS) ? window.STX_DATASET.ALL_PARTS : [];
        var leg = all.filter(function (p) { return p && /legendary\s*perk/i.test(String(p.partType || '')); });
        for (var i = 0; i < leg.length; i++) {
          var tok = getPartToken(leg[i]);
          if (tok) appendToOutCode(tok);
        }
        try { if (window.refreshGuidedOutputPreview) window.refreshGuidedOutputPreview(); } catch (_) {}
      });
    }

    var catSel = byId('ccGuidedPresetCategorySelect');
    var presetBtn = byId('ccGuidedPresetAddBtn');
    if (catSel) catSel.addEventListener('change', loadGuidedPresetParts);
    if (presetBtn) {
      presetBtn.addEventListener('click', function () {
        var partSel = byId('ccGuidedPresetPartSelect');
        var qtyEl = byId('ccGuidedPresetQuantity');
        var out = getGuidedOutputEl();
        if (!partSel || !out) return;
        var code = (partSel.value || '').trim();
        if (!code) return;
        var n = Math.max(1, parseInt((qtyEl && qtyEl.value) || '1', 10) || 1);
        for (var i = 0; i < n; i++) appendToOutCode(code);
        try { if (window.refreshGuidedOutputPreview) window.refreshGuidedOutputPreview(); } catch (_) {}
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
      initPartSections();
      setTimeout(initGuidedExtraSections, 100);
    });
  } else {
    setTimeout(function () {
      init();
      initPartSections();
      setTimeout(initGuidedExtraSections, 100);
    }, 50);
  }

  window.refreshGuidedBuilderDropdowns = refreshWeaponDropdowns;
  window.refreshToolsStandaloneElementDropdowns = refreshToolsStandaloneElementDropdowns;
  window.syncGuidedVisibility = syncGuidedVisibility;
  window.refreshPartSections = refreshPartSections;
  window.loadGuidedManufacturers = loadGuidedManufacturers;
  window.loadGuidedSkinCamo = loadGuidedSkinCamo;
  window.initGuidedExtraSections = initGuidedExtraSections;

  function parsePrefixFromCode(code) {
    var s = (code || '').trim();
    var dbl = s.indexOf('||');
    var prefix = dbl >= 0 ? s.slice(0, dbl).trim() : '';
    var m = prefix.match(/^\s*(\d+)\s*,\s*0\s*,\s*1\s*,\s*\d+/);
    return m ? parseInt(m[1], 10) : null;
  }
  function getItemTypeFromFamilyId(rarities, familyId) {
    if (!Array.isArray(rarities) || !Number.isFinite(familyId)) return null;
    var r = rarities.find(function (x) { return Number(x && x.familyId) === familyId; });
    return r ? { itemType: String(r.itemType || '').trim(), manufacturer: String(r.manufacturer || '').trim(), weaponType: String(r.itemType || '').trim() } : null;
  }
  function addRandomPartsForItemType(itemType, manufacturer, weaponType, appendOnly, targetEl) {
    var st = { itemType: itemType, manufacturer: manufacturer, weaponType: weaponType || '' };
    var it = String(itemType || '').toLowerCase();
    var isWeapon = /weapon/i.test(it) && !/heavy/i.test(it);
    var isHeavy = /heavy/i.test(it);
    var slots = [];
    if (isWeapon) {
      slots = WEAPON_SLOTS;
    } else if (isHeavy) {
      slots = GEAR_SLOTS_BY_CATEGORY['Heavy Weapon'] || [];
    } else if (GEAR_SLOTS_BY_CATEGORY[itemType]) {
      slots = GEAR_SLOTS_BY_CATEGORY[itemType];
    }
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      var sel = byId(slot.selectId);
      if (!sel || !sel.options.length) continue;
      var opts = [];
      for (var j = 0; j < sel.options.length; j++) {
        var v = (sel.options[j].value || '').trim();
        if (v && v.indexOf('--') < 0) opts.push(v);
      }
      if (opts.length) {
        var tok = opts[Math.floor(Math.random() * opts.length)];
        appendToOutCode(tok, targetEl);
      }
    }
  }
  function randomFullBuild() {
    try {
      var rarities = window.STX_RARITIES;
      if (!Array.isArray(rarities) || !rarities.length) {
        alert('STX_RARITIES not loaded.');
        return;
      }
      var guidedItem = byId('ccGuidedItemType');
      var out = byId('guidedOutputDeserialized') || byId('outCode');
      var existingCode = (out && out.value || '').trim();
      var familyId = parsePrefixFromCode(existingCode);
      var appendOnly = false;
      var itemType, manufacturer, weaponType;

      if (familyId && existingCode.indexOf('||') >= 0) {
        var info = getItemTypeFromFamilyId(rarities, familyId);
        if (info && info.itemType) {
          appendOnly = true;
          itemType = info.itemType;
          manufacturer = info.manufacturer;
          weaponType = info.weaponType;
          if (/^(Assault Rifle|Pistol|Shotgun|SMG|Sniper Rifle)$/i.test(itemType)) weaponType = itemType;
          else if (/Heavy Weapon/i.test(itemType)) weaponType = 'Heavy Weapon';
        }
      }

      if (!appendOnly) {
        var stPick = getGuidedState();
        var useGuidedPick = String(stPick.itemType || '').trim() && String(stPick.manufacturer || '').trim();
        var guidedMan = byId('ccGuidedManufacturer');
        var guidedWt = byId('ccGuidedWeaponType');
        var stxItem = byId('stx_itemType');
        var stxMan = byId('stx_manufacturer');

        if (useGuidedPick) {
          itemType = String(stPick.itemType).trim();
          manufacturer = String(stPick.manufacturer).trim();
          weaponType = String(stPick.weaponType || '').trim() || itemType;
          if (/^(Assault Rifle|Pistol|Shotgun|SMG|Sniper Rifle)$/i.test(itemType)) {
            if (!weaponType || /heavy/i.test(String(weaponType))) weaponType = itemType;
          } else if (/Heavy Weapon/i.test(itemType)) {
            weaponType = 'Heavy Weapon';
          }
          if (guidedItem) guidedItem.value = itemType;
          if (guidedMan) guidedMan.value = manufacturer;
          if (guidedWt && /^(Assault Rifle|Pistol|Shotgun|SMG|Sniper Rifle)$/i.test(itemType)) guidedWt.value = weaponType;
          if (stxItem) stxItem.value = itemType;
          if (stxMan && !isGuidedClassModItemType(itemType)) stxMan.value = manufacturer;
          try { if (typeof window.syncGuidedToSimple === 'function') window.syncGuidedToSimple(); } catch (_) {}
          try { if (typeof loadGuidedManufacturers === 'function') loadGuidedManufacturers(); } catch (_) {}
          try { if (typeof syncGuidedVisibility === 'function') syncGuidedVisibility(); } catch (_) {}
        } else {
          var weaponRows = rarities.filter(function (r) {
            var it = String(r && r.itemType || '').trim();
            return /^(Assault Rifle|Pistol|Shotgun|SMG|Sniper Rifle|Heavy Weapon|Shield|Grenade|Repkit|Class Mod)$/i.test(it);
          });
          if (!weaponRows.length) weaponRows = rarities;
          var pick = weaponRows[Math.floor(Math.random() * weaponRows.length)];
          manufacturer = String(pick.manufacturer || '').trim();
          itemType = String(pick.itemType || '').trim();
          weaponType = itemType;
          if (/^(Assault Rifle|Pistol|Shotgun|SMG|Sniper Rifle)$/i.test(itemType)) weaponType = itemType;
          else if (/Heavy Weapon/i.test(itemType)) weaponType = 'Heavy Weapon';

          if (guidedItem) { guidedItem.value = itemType; guidedItem.dispatchEvent(new Event('change')); }
          if (stxItem) { stxItem.value = itemType; stxItem.dispatchEvent(new Event('change')); }
          if (guidedMan) {
            setTimeout(function () {
              guidedMan.value = manufacturer;
              guidedMan.dispatchEvent(new Event('change'));
              if (guidedWt && /^(Assault Rifle|Pistol|Shotgun|SMG|Sniper Rifle)$/i.test(itemType)) {
                guidedWt.value = weaponType;
                guidedWt.dispatchEvent(new Event('change'));
              }
            }, 50);
          }
          if (stxMan && !isGuidedClassModItemType(itemType)) {
            setTimeout(function () { stxMan.value = manufacturer; stxMan.dispatchEvent(new Event('change')); }, 100);
          }
        }
        if (out) out.value = '';
      } else {
        var guidedMan = byId('ccGuidedManufacturer');
        var guidedWt = byId('ccGuidedWeaponType');
        var stxItem = byId('stx_itemType');
        var stxMan = byId('stx_manufacturer');
        if (guidedItem) guidedItem.value = itemType;
        if (guidedMan) guidedMan.value = manufacturer;
        if (guidedWt) guidedWt.value = weaponType || '';
        if (stxItem) stxItem.value = itemType;
        if (stxMan && !isGuidedClassModItemType(itemType)) stxMan.value = manufacturer;
        if (typeof window.syncGuidedToSimple === 'function') window.syncGuidedToSimple();
        loadGuidedManufacturers();
        syncGuidedVisibility();
      }

      var targetOut = out;
      setTimeout(function () {
        var st = getGuidedState();
        addRandomPartsForItemType(st.itemType, st.manufacturer, st.weaponType, appendOnly, appendOnly ? targetOut : null);
        if (typeof window.syncFloatingOutput === 'function') window.syncFloatingOutput(true);
        if (typeof window.refreshGuidedOutput === 'function') window.refreshGuidedOutput();
        if (typeof window.refreshOutputs === 'function') window.refreshOutputs();
      }, appendOnly ? 100 : 200);
    } catch (err) {
      console.error('Random Full Build failed:', err);
      alert('Random Full Build failed: ' + (err && err.message));
    }
  }

  /**
   * Run random full build N times. Clears output before each roll so every item is a fresh random mod
   * (otherwise the 2nd+ run would append-only to the previous serial).
   */
  function randomFullBuildBatch(n) {
    var count = Math.min(50, Math.max(1, parseInt(n, 10) || 1));
    var i = 0;
    function step() {
      if (i >= count) return;
      var out = byId('guidedOutputDeserialized') || byId('outCode');
      if (out) out.value = '';
      randomFullBuild();
      i++;
      if (i < count) setTimeout(step, 500);
    }
    step();
  }

  window.randomFullBuild = randomFullBuild;
  window.randomFullBuildBatch = randomFullBuildBatch;
  window.refreshAllGuidedSlotPreviews = refreshAllGuidedSlotPreviews;
})();
