/**
 * cc-guided-builder-rebuild.js
 * Main Guided Builder: populates dropdowns from STX_DATASET, wires Add buttons,
 * emits codes to outCode. Supports Weapon, Heavy, Gadget, Shield, Grenade, Repkit, Enhancement, Class Mod.
 */
(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }

  /** Read select value reliably (native + custom-select wrapped). */
  function readSelectValue(sel) {
    if (!sel || sel.tagName !== 'SELECT') return '';
    var v = String(sel.value || '').trim();
    if (v) return v;
    try {
      var idx = sel.selectedIndex;
      if (idx >= 0 && sel.options && sel.options[idx]) {
        v = String(sel.options[idx].value || '').trim();
        if (v) return v;
      }
    } catch (_) {}
    return '';
  }

  /** Slot Add buttons: native value, then import-hydrated preferred token. */
  function readGuidedSlotToken(sel) {
    if (!sel) return '';
    var v = readSelectValue(sel);
    if (v) return v;
    v = String(sel.__ccPreferredToken || '').trim();
    if (v) return v;
    try {
      var wrap = sel.closest ? sel.closest('.custom-select-wrapper') : null;
      var disp = wrap && wrap.querySelector ? wrap.querySelector('.custom-select-display') : null;
      if (disp && disp.dataset && disp.dataset.lastValue) {
        v = String(disp.dataset.lastValue || '').trim();
        if (v) return v;
      }
    } catch (_) {}
    return '';
  }

  function extractGuidedTailTokens(serial) {
    var s = String(serial || '').trim();
    var dbl = s.indexOf('||');
    var tail = dbl >= 0 ? s.slice(dbl + 2).trim() : '';
    if (!tail) return [];
    return (tail.match(/\|\s*["']?c["']?\s*,\s*\d+\s*\||\{[^}]*(?:\[[^\]]*\])?[^}]*\}|"[^\"]+"|\S+/g) || []).filter(function (t) {
      var x = String(t || '').trim();
      return x && x !== '|' && x !== '||';
    });
  }

  function getGuidedBuilderStateObj() {
    try {
      return window.state || window.__STX_SIMPLE_STATE || null;
    } catch (_) {
      return null;
    }
  }

  /** Manufacturer + weapon type used for guided slot filtering (DOM + synced simple state). */
  function getGuidedFilterContext() {
    var guidedItem = byId('ccGuidedItemType');
    var guidedMan = byId('ccGuidedManufacturer');
    var guidedWt = byId('ccGuidedWeaponType');
    var stxItem = byId('stx_itemType');
    var stxMan = byId('stx_manufacturer');
    var stxWt = byId('weaponType');
    var gstate = getGuidedBuilderStateObj();

    var itemType = readSelectValue(guidedItem) || readSelectValue(stxItem) || (gstate && gstate.itemType ? String(gstate.itemType) : '') || '';
    var manufacturer = readSelectValue(guidedMan) || readSelectValue(stxMan) || (gstate && gstate.manufacturer ? String(gstate.manufacturer) : '') || '';
    var weaponType = readSelectValue(guidedWt) || readSelectValue(stxWt) || (gstate && gstate.weaponType ? String(gstate.weaponType) : '') || '';

    return { itemType: itemType, manufacturer: manufacturer, weaponType: weaponType };
  }

  /** Strip dataset quote wrappers + lowercase for spawn-prefix filters. */
  function guidedSpawnCodeLo(p) {
    var c = String((p && (p.code != null ? p.code : p.spawnCode)) || '').trim();
    if (c.length >= 2 && c.charAt(0) === '"' && c.charAt(c.length - 1) === '"') c = c.slice(1, -1);
    return c.toLowerCase();
  }

  function guidedSlotIsFirmwareSlot(slotMeta) {
    if (!slotMeta) return false;
    return slotMeta.partType === 'Firmware' || slotMeta.key === 'firmware' || slotMeta.key === 'firmware246';
  }

  /** Dataset firmware rows often omit partType (247-family dupes); match by code too. */
  function guidedPartIsFirmware(p) {
    if (!p) return false;
    if (String(p.partType || '').trim().toLowerCase() === 'firmware') return true;
    return /part_firmware|\.part_firmware/.test(guidedSpawnCodeLo(p));
  }

  function guidedItemTypeForIcons() {
    try {
      var gi = byId('ccGuidedItemType');
      var v = gi ? String(readSelectValue(gi) || '').trim() : '';
      if (/^heavy$/i.test(v)) return 'Heavy Weapon';
      return v || 'Weapon';
    } catch (_) {
      return 'Weapon';
    }
  }

  function syncGuidedCustomSelectIfWrapped(sel) {
    if (!sel) return;
    if (sel.dataset.customSelect !== 'yes' && sel.closest && sel.closest('#rebuildGuidedBuilderSection .cc-guided-slots-grid')) {
      if (typeof window.__ccWrapGuidedSelect === 'function') {
        try { window.__ccWrapGuidedSelect(sel); } catch (_) {}
      }
    }
    if (typeof sel.__customSelectForceRebuild === 'function') {
      try { sel.__customSelectForceRebuild(); return; } catch (_) {}
    }
    if (typeof sel.__customSelectSync === 'function') {
      try { sel.__customSelectSync(); } catch (_) {}
    }
    if (typeof sel.__customSelectPrebuild === 'function') {
      try { sel.__customSelectPrebuild(); } catch (_) {}
    }
  }

  function ensureStaticGuidedIcons() {
    function setIcon(selectId, value, url) {
      var sel = byId(selectId);
      if (!sel || !sel.options) return;
      for (var i = 0; i < sel.options.length; i++) {
        var o = sel.options[i];
        if (!o) continue;
        if (String(o.value || '').trim() !== String(value || '').trim()) continue;
        if (url) o.setAttribute('data-cc-icon', String(url));
      }
      syncGuidedCustomSelectIfWrapped(sel);
    }
    var base = './assets/img/guided-dropdowns/';
    setIcon('ccGuidedItemType', 'Weapon', ccPearlPipUrlInsteadOfLegendaryAug(base + 'legendary-augments/ico_legendary_aug_gun_assault.png'));
    setIcon('ccGuidedItemType', 'Shield', ccPearlPipUrlInsteadOfLegendaryAug(base + 'legendary-augments/ico_legendary_aug_shield.png'));
    setIcon('ccGuidedItemType', 'Repkit', ccPearlPipUrlInsteadOfLegendaryAug(base + 'legendary-augments/ico_legendary_aug_repkit.png'));
    setIcon('ccGuidedItemType', 'Grenade', ccPearlPipUrlInsteadOfLegendaryAug(base + 'legendary-augments/ico_legendary_aug_grenade.png'));
    setIcon('ccGuidedItemType', 'Enhancement', ccPearlPipUrlInsteadOfLegendaryAug(base + 'legendary-augments/ico_legendary_aug_classmod.png'));
    setIcon('ccGuidedItemType', 'Class Mod', ccPearlPipUrlInsteadOfLegendaryAug(base + 'legendary-augments/ico_legendary_aug_classmod.png'));
    setIcon('ccGuidedItemType', 'Gadget', ccPearlPipUrlInsteadOfLegendaryAug(base + 'legendary-augments/ico_legendary_aug_heavy.png'));
    setIcon('ccGuidedItemType', 'Heavy Weapon', ccPearlPipUrlInsteadOfLegendaryAug(base + 'legendary-augments/ico_legendary_aug_heavy.png'));
    setIcon('ccGuidedWeaponType', 'Assault Rifle', base + 'weapon-type/ico_ui_art_assault_small.png');
    setIcon('ccGuidedWeaponType', 'Pistol', base + 'weapon-type/ico_ui_art_pistol_small.png');
    setIcon('ccGuidedWeaponType', 'Shotgun', base + 'weapon-type/ico_ui_art_shotgun_small.png');
    setIcon('ccGuidedWeaponType', 'SMG', base + 'weapon-type/ico_ui_art_smg_small.png');
    setIcon('ccGuidedWeaponType', 'Sniper Rifle', base + 'weapon-type/ico_ui_art_sniper_small.png');
    setIcon('ccGuidedWeaponType', 'Heavy Weapon', base + 'weapon-type/ico_ui_art_heavy_small.png');
    try {
      var btns = document.querySelectorAll('#classmodQuickChecklistButtons .stx-vh-btn[data-cm-class]');
      for (var bi = 0; bi < btns.length; bi++) {
        var b = btns[bi];
        var c = String(b.getAttribute('data-cm-class') || '').trim().toLowerCase();
        var img = b.querySelector('img.stx-vh-btn__icon');
        if (!img) continue;
        if (c === 'vex') img.src = './assets/img/vault-hunters/player_class_dark_siren.png';
        else if (c === 'amon') img.src = './assets/img/vault-hunters/player_class_paladin.png';
        else if (c === 'rafa') img.src = './assets/img/vault-hunters/player_class_exo_soldier.png';
        else if (c === 'harlowe') img.src = './assets/img/vault-hunters/player_class_gravitar.png';
        else if (c === 'c4sh') img.src = './assets/img/vault-hunters/player_robodealer.png';
      }
    } catch (_) {}
  }

  function isGuidedClassModItemType(val) {
    return /class\s*mod|classmod/i.test(String(val || '').trim());
  }

  /** UI wiring for weapon slot keys (NCS schema rows attach these via `attachWeaponSlotUi`). */
  var WEAPON_SLOT_UI = {
    rarity: { selectId: 'ccRaritySelect', btnId: 'ccAddRarity' },
    body: { selectId: 'ccBodySelect', btnId: 'ccAddBody' },
    bodyAcc: { selectId: 'ccBodyAccSelect', btnId: 'ccAddBodyAcc' },
    bodyEle: { selectId: 'ccWeaponBodyEleSelect', btnId: 'ccAddWeaponBodyEle' },
    barrel: { selectId: 'ccBarrelSelect', btnId: 'ccAddBarrel' },
    barrelAcc: { selectId: 'ccBarrelAccSelect', btnId: 'ccAddBarrelAcc' },
    hyperionSecondaryAcc: { selectId: 'ccWeaponHypShieldSelect', btnId: 'ccAddWeaponHypShield' },
    mag: { selectId: 'ccMagazineSelect', btnId: 'ccAddMagazine' },
    magazineAcc: { selectId: 'ccWeaponMagAccSelect', btnId: 'ccAddWeaponMagAcc' },
    magazineBorg: { selectId: 'ccWeaponMagBorgSelect', btnId: 'ccAddWeaponMagBorg' },
    scope: { selectId: 'ccScopeSelect', btnId: 'ccAddScope' },
    scopeAcc: { selectId: 'ccScopeAccSelect', btnId: 'ccAddScopeAcc' },
    grip: { selectId: 'ccGripSelect', btnId: 'ccAddGrip' },
    underbarrel: { selectId: 'ccUnderbarrelSelect', btnId: 'ccAddUnderbarrel' },
    foregrip: { selectId: 'ccForegripSelect', btnId: 'ccAddForegrip' },
    secondaryAmmo: { selectId: 'ccWeaponSecondaryAmmoSelect', btnId: 'ccAddWeaponSecondaryAmmo' },
    secondaryEle: { selectId: 'ccElementSwitchSelect', btnId: 'ccAddElementSwitch', maliwanOnly: true },
    pearlElem: { selectId: 'ccWeaponPearlElemSelect', btnId: 'ccAddWeaponPearlElem', pearlElemPick: true },
    pearlStat: { selectId: 'ccWeaponPearlStatSelect', btnId: 'ccAddWeaponPearlStat', pearlStatPick: true },
    licensed: { selectId: 'ccLicensedSelect', btnId: 'ccAddLicensed' },
    statMod: { selectId: 'ccWeaponStatModSelect', btnId: 'ccAddWeaponStatMod' },
    legendary: { selectId: 'ccWeaponLegendarySelect', btnId: 'ccAddWeaponLegendary' },
    firmware: { selectId: 'ccWeaponFirmwareSelect', btnId: 'ccAddWeaponFirmware' },
    additionalParts: { selectId: 'ccWeaponAdditionalSelect', btnId: 'ccAddWeaponAdditional' },
    element: { selectId: 'ccElementPartSelect', btnId: 'ccAddElementStack' }
  };

  /** Fallback when NCS slug is unknown — classic fixed order. */
  var WEAPON_SLOTS_FALLBACK = [
    { key: 'rarity', label: 'Rarity ID', partType: 'Rarity' },
    { key: 'body', label: 'Body', partType: 'Body' },
    { key: 'bodyAcc', label: 'Body Accessory', partType: 'Body Accessory' },
    { key: 'bodyEle', label: 'Body Element', partType: 'Body Element' },
    { key: 'barrel', label: 'Barrel', partType: 'Barrel' },
    { key: 'barrelAcc', label: 'Barrel Accessory', partType: 'Barrel Accessory' },
    { key: 'hyperionSecondaryAcc', label: 'Hyperion Amp Shield', partType: 'Manufacturer Part' },
    { key: 'mag', label: 'Magazine', partType: 'Magazine' },
    { key: 'magazineAcc', label: 'Magazine Accessory', partType: 'Magazine' },
    { key: 'scope', label: 'Scope', partType: 'Scope' },
    { key: 'scopeAcc', label: 'Scope Accessory', partType: 'Scope Accessory' },
    { key: 'grip', label: 'Grip', partType: 'Grip' },
    { key: 'underbarrel', label: 'Underbarrel', partType: 'Underbarrel' },
    { key: 'foregrip', label: 'Foregrip', partType: 'Foregrip' },
    { key: 'secondaryAmmo', label: 'Secondary Ammo', partType: 'Manufacturer Part' },
    { key: 'secondaryEle', label: 'Secondary Element (Maliwan)', partType: 'Element Switch', maliwanOnly: true },
    { key: 'pearlElem', label: 'Pearl Element', partType: '' },
    { key: 'pearlStat', label: 'Pearl Stat', partType: '' },
    { key: 'licensed', label: 'Licensed Manufacturer Part', partType: 'Manufacturer Part' },
    { key: 'element', label: 'Element', partType: 'Element' }
  ];

  function attachWeaponSlotUi(row) {
    if (!row) return null;
    var ui = WEAPON_SLOT_UI[row.key];
    if (!ui || !ui.selectId) return null;
    var out = {};
    var k;
    for (k in row) if (Object.prototype.hasOwnProperty.call(row, k)) out[k] = row[k];
    for (k in ui) if (Object.prototype.hasOwnProperty.call(ui, k)) out[k] = ui[k];
    return out;
  }

  /** NCS-accurate weapon slots for the current manufacturer + weapon type (Simple Builder parity). */
  function getGuidedWeaponSlots() {
    var fallback = [];
    for (var fi = 0; fi < WEAPON_SLOTS_FALLBACK.length; fi++) {
      var fr = attachWeaponSlotUi(WEAPON_SLOTS_FALLBACK[fi]);
      if (fr) fallback.push(fr);
    }
    var gs = getGuidedState();
    if (!gs || !String(gs.manufacturer || '').trim() || !String(gs.weaponType || '').trim()) return fallback;
    var slug = '';
    if (typeof window.computeSimpleBuilderItemSlug === 'function') {
      try { slug = window.computeSimpleBuilderItemSlug(gs); } catch (_e) {}
    }
    if (!slug || typeof window.buildWeaponSlotSchemaFromNcs !== 'function') return fallback;
    var schema = window.buildWeaponSlotSchemaFromNcs(slug);
    if (!schema || !schema.length) return fallback;
    var out = [];
    var seen = {};
    for (var i = 0; i < schema.length; i++) {
      var row = attachWeaponSlotUi(schema[i]);
      if (!row || seen[row.key]) continue;
      seen[row.key] = true;
      out.push(row);
    }
    if (out.length && !seen.rarity) {
      var rarityRow = attachWeaponSlotUi({ key: 'rarity', label: 'Rarity ID', partType: 'Rarity' });
      if (rarityRow) out.unshift(rarityRow);
    }
    ensureGuidedModdedElementSlots(out, seen, gs);
    return out.length ? out : fallback;
  }

  /** Body / Maliwan switch / stack element rows — always available for modded builds (NCS may omit them). */
  function ensureGuidedModdedElementSlots(out, seen, gs) {
    if (!out || !out.length) return;
    seen = seen || Object.create(null);
    var itemLo = String((gs && gs.itemType) || '').trim().toLowerCase();
    var isHeavy = itemLo === 'heavy' || itemLo === 'heavy weapon';
    function insertBeforeBarrel(row) {
      if (!row) return;
      var insertAt = out.length;
      for (var i = 0; i < out.length; i++) {
        if (out[i].key === 'barrel') { insertAt = i; break; }
      }
      out.splice(insertAt, 0, row);
    }
    if (!seen.bodyEle) {
      var bodyEleRow = attachWeaponSlotUi({ key: 'bodyEle', label: 'Body Element', partType: 'Body Element' });
      if (bodyEleRow) {
        insertBeforeBarrel(bodyEleRow);
        seen.bodyEle = true;
      }
    }
    if (!seen.secondaryEle && !isHeavy) {
      var secEleRow = attachWeaponSlotUi({
        key: 'secondaryEle',
        label: 'Secondary Element (Maliwan)',
        partType: 'Element Switch',
        maliwanOnly: true
      });
      if (secEleRow) {
        insertBeforeBarrel(secEleRow);
        seen.secondaryEle = true;
      }
    }
    if (!seen.element) {
      var elementRow = attachWeaponSlotUi({ key: 'element', label: 'Element', partType: 'Element' });
      if (elementRow) insertBeforeBarrel(elementRow);
    }
  }
  window.getGuidedWeaponSlots = getGuidedWeaponSlots;
  window.getGuidedFilterContext = getGuidedFilterContext;

  var GUIDED_ELEMENTS_PANEL_SLOT_KEYS = { bodyEle: true, secondaryEle: true, element: true };

  function setGuidedSlotRowVisible(sel, show) {
    var row = getGuidedSlotGridRow(sel);
    if (!row) return;
    row.style.display = show ? '' : 'none';
    if (show && sel) {
      var el = sel.parentElement;
      while (el && el !== row) {
        try { if (el.style) el.style.display = ''; } catch (_) {}
        el = el.parentElement;
      }
    }
  }

  function syncGuidedElementsPanelVisibility(ctx) {
    var elePanel = document.querySelector('#ccGunBuilderDetails .cc-slot-panel--elements');
    if (!elePanel) return;
    ctx = ctx || {};
    var itemLo = String(ctx.itemType || '').trim().toLowerCase();
    if (itemLo === 'heavy') itemLo = 'heavy weapon';
    var isWeapon = itemLo === 'weapon' || itemLo === 'heavy weapon';
    var hasGunConfig = !!(String(ctx.manufacturer || '').trim() && String(ctx.weaponType || '').trim());
    var isHeavy = itemLo === 'heavy weapon';
    var showPanel = isWeapon && hasGunConfig;
    elePanel.style.display = showPanel ? '' : 'none';
    if (!showPanel) return;
    /* Modded element panel: always show all element tools regardless of NCS slot map. */
    setGuidedSlotRowVisible(byId('ccWeaponBodyEleSelect'), true);
    setGuidedSlotRowVisible(byId('ccElementSwitchSelect'), !isHeavy);
    setGuidedSlotRowVisible(byId('ccElementPartSelect'), true);
  }

  function syncGuidedWeaponSlotGridVisibility() {
    var active = getGuidedWeaponSlots();
    var activeKeys = Object.create(null);
    for (var i = 0; i < active.length; i++) activeKeys[active[i].key] = true;
    var ctx = getGuidedFilterContext();
    var manLo = String(ctx.manufacturer || '').trim().toLowerCase();
    var keys = Object.keys(WEAPON_SLOT_UI);
    for (var k = 0; k < keys.length; k++) {
      if (GUIDED_ELEMENTS_PANEL_SLOT_KEYS[keys[k]]) continue;
      var ui = WEAPON_SLOT_UI[keys[k]];
      var sel = ui && ui.selectId ? byId(ui.selectId) : null;
      if (!sel) continue;
      var show = !!activeKeys[keys[k]];
      if (keys[k] === 'statMod') show = false;
      if (show && ui.maliwanOnly && manLo.indexOf('maliwan') < 0) show = false;
      setGuidedSlotRowVisible(sel, show);
    }
    try {
      syncGuidedElementsPanelVisibility(ctx);
    } catch (_) {}
  }

  /** @deprecated Use getGuidedWeaponSlots() — kept for callers that still reference WEAPON_SLOTS. */
  var WEAPON_SLOTS = WEAPON_SLOTS_FALLBACK.map(function (r) { return attachWeaponSlotUi(r); }).filter(Boolean);

  /** Shown as a disabled option when a pool is empty so users know to widen filters. */
  var GUIDED_HINT_EMPTY_BODY_ELEMENT = '(Empty) No body element parts match the current filters — try "All manufacturers\' parts" if the dataset is still wide.';
  var GUIDED_HINT_EMPTY_MALIWAN_SWITCH = '(Empty) No Maliwan element-switch parts loaded — enable "All manufacturers\' parts in dropdowns" above for modded cross-manufacturer picks.';

  var ELEMENTS = [
    { key: 'None', code: '' },
    { key: 'Corrosive', code: '{1:10}', iconFile: 'ico_elemental_corrosive.png' },
    { key: 'Cryo', code: '{1:11}', iconFile: 'ico_elemental_cryo.png' },
    { key: 'Fire', code: '{1:12}', iconFile: 'ico_elemental_fire.png' },
    { key: 'Radiation', code: '{1:13}', iconFile: 'ico_elemental_radiation.png' },
    { key: 'Shock', code: '{1:14}', iconFile: 'ico_elemental_shock.png' }
  ];

  /** In-repo textures only (see assets/img/elements/). */
  var CC_ELEMENT_ICON_BASE = './assets/img/elements/';
  /** Multi-element UI art for “no element selected” row (weapon Element stack). */
  var CC_ELEMENT_PLACEHOLDER_ICON_FILE = 'ico_elemental_all.png';
  /** Manufacturer logomarks + weapon-type chips (see assets/img/guided-dropdowns/). */
  var CC_GUIDED_DROPDOWN_BASE = './assets/img/guided-dropdowns/';
  /** BL UI: ico_ui_art_item_augments / legendary_augments — for legendary barrel rows. */
  var CC_GUIDED_LEGENDARY_AUG_BASE = CC_GUIDED_DROPDOWN_BASE + 'legendary-augments/';
  /** DLC pearl slot icons from game `dlc_rarity_pips` (in-repo under assets/img/dlc_rarity_pips/). */
  var CC_GUIDED_PEARL_ITEMTYPE_BASE = './assets/img/dlc_rarity_pips/';

  /** When Simple/Guided pearl override is on, swap gold legendary-augment URLs for matching pearl pip art. */
  function ccPearlPipUrlInsteadOfLegendaryAug(u) {
    if (typeof window.stxPearlPipUrlInsteadOfLegendaryAug === 'function') {
      return window.stxPearlPipUrlInsteadOfLegendaryAug(u);
    }
    var s = String(u || '').trim();
    if (!s) return s;
    // Safety: do not rewrite icon URLs to DLC pearl pips unless your build ships those assets.
    // Pearl override still affects *code output* elsewhere; this is icon-only.
    return s;
  }

  var CC_GUIDED_RARITY_SELECT_IDS = {
    ccRaritySelect: 1,
    ccHeavyRaritySelect: 1,
    ccRepkitRaritySelect: 1,
    ccGrenadeRaritySelect: 1
  };
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
    ccWeaponPearlElemSelect: 1,
    ccWeaponPearlStatSelect: 1,
    toolsPearlElementSelect: 1
  };

  var CC_GUIDED_LEGENDARY_PERK_SELECT_IDS = {
    ccRepkitLegendarySelect: true,
    ccHeavyLegendarySelect: true,
    ccGuidedLegendaryPerkSelect: true,
    ccWeaponLegendarySelect: true
  };

  var CC_GUIDED_FIRMWARE_SELECT_IDS = {
    ccWeaponFirmwareSelect: true,
    ccShieldFirmwareSelect: true,
    ccGrenadeFirmwareSelect: true,
    ccRepkitFirmwareSelect: true,
    ccEnhancementFirmwareSelect: true,
    ccGadgetFirmwareSelect: true,
    ccClassModFirmwareSelect: true,
    ccHeavyFirmwareSelect: true
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

  function guessPearlElementIconFromBlob(blob) {
    var s = String(blob || '').toLowerCase();
    if (!s) return '';
    if (s.indexOf('corrosive') !== -1) return 'pearl_elemental_corrosive.png';
    if (s.indexOf('cryo') !== -1) return 'pearl_elemental_cryo.png';
    if (s.indexOf('radiation') !== -1 || s.indexOf('_rad_') !== -1 || /\brad_shock\b/.test(s) || /\brad_cryo\b/.test(s)) return 'pearl_elemental_radiation.png';
    if (s.indexOf('sonic') !== -1 || s.indexOf('barrier_elemental_field_sonic') !== -1) return 'pearl_elemental_sonic.png';
    if (s.indexOf('shock') !== -1) return 'pearl_elemental_shock.png';
    if ((/\bring\b/.test(s) && (s.indexOf('element') !== -1 || s.indexOf('ele_') !== -1)) || s.indexOf('element_ring') !== -1) return 'pearl_elemental_ring.png';
    if (s.indexOf('kinetic') !== -1) return 'pearl_elemental_kinetic.png';
    if (s.indexOf('incendiary') !== -1 || s.indexOf('ele_fire') !== -1 || /\b_fire\b/.test(s) || /\bfire_rad\b/.test(s) || /\bfire_shock\b/.test(s)) return 'pearl_elemental_fire.png';
    return '';
  }

  function guessStandardElementIconFromBlob(blob) {
    var s = String(blob || '').toLowerCase();
    if (!s) return '';
    if (s.indexOf('corrosive') !== -1) return 'ico_elemental_corrosive.png';
    if (s.indexOf('cryo') !== -1) return 'ico_elemental_cryo.png';
    if (s.indexOf('radiation') !== -1 || s.indexOf('_rad_') !== -1 || /\brad_shock\b/.test(s) || /\brad_cryo\b/.test(s)) return 'ico_elemental_radiation.png';
    if (s.indexOf('sonic') !== -1 || s.indexOf('barrier_elemental_field_sonic') !== -1) return 'ico_elemental_all.png';
    if (s.indexOf('shock') !== -1) return 'ico_elemental_shock.png';
    if ((/\bring\b/.test(s) && (s.indexOf('element') !== -1 || s.indexOf('ele_') !== -1)) || s.indexOf('element_ring') !== -1) return 'ico_elemental_all.png';
    if (s.indexOf('kinetic') !== -1) return 'ico_elemental_kinetic.png';
    if (s.indexOf('incendiary') !== -1 || s.indexOf('ele_fire') !== -1 || /\b_fire\b/.test(s) || /\bfire_rad\b/.test(s) || /\bfire_shock\b/.test(s)) return 'ico_elemental_fire.png';
    return '';
  }

  function ccResolveElementIconFilename(p) {
    if (!p) return '';
    var its = String(p.itemTypeString != null ? p.itemTypeString : '').toLowerCase();
    var code = String(p.code != null ? p.code : '').toLowerCase();
    var nm = String((p.name || p.legendaryName || '')).toLowerCase();
    var blob = its + ' ' + code + ' ' + nm;

    if (/\bpearl_(damage|reload|firerate|handling)\b/.test(blob)) return 'ico_misc_pearl.png';

    var pe = its.match(/\bpearl_(normal|shock|radiation|corrosive|cryo|fire|sonic)\b/);
    if (pe) {
      if (pe[1] === 'normal') return 'pearl_elemental_kinetic.png';
      return 'pearl_elemental_' + pe[1] + '.png';
    }

    if (/part_pearl/i.test(code)) {
      var g = guessPearlElementIconFromBlob(blob);
      return g || 'ico_misc_pearl.png';
    }

    return guessStandardElementIconFromBlob(blob);
  }

  /** Recolor white weapon silhouettes for rarity tiers 0–3; keep in sync with `stx-simple-builder-core.js`. */
  var CC_COMP_TIER_WEAPON_ICON_FILTERS = [
    'brightness(0) saturate(100%) invert(68%) sepia(9%) saturate(214%) hue-rotate(126deg) brightness(94%) contrast(88%)',
    'brightness(0) saturate(100%) invert(56%) sepia(58%) saturate(488%) hue-rotate(90deg) brightness(96%) contrast(91%)',
    'brightness(0) saturate(100%) invert(55%) sepia(72%) saturate(1466%) hue-rotate(176deg) brightness(96%) contrast(92%)',
    'brightness(0) saturate(100%) invert(51%) sepia(71%) saturate(2347%) hue-rotate(238deg) brightness(95%) contrast(92%)'
  ];
  /** Soft rarity tint on full-color legendary aug art (common→epic); match `STX_COMP_TIER_GEAR_LEGENDARY_AUG_FILTERS`. */
  var CC_COMP_TIER_GEAR_LEGENDARY_AUG_FILTERS = [
    'saturate(0.48) brightness(0.84) contrast(1.09)',
    'hue-rotate(78deg) saturate(0.82) brightness(0.86) contrast(1.06)',
    'hue-rotate(168deg) saturate(0.88) brightness(0.87) contrast(1.07)',
    'hue-rotate(228deg) saturate(0.9) brightness(0.86) contrast(1.08)'
  ];

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
      enhancement: 'ico_legendary_aug_classmod.png',
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
    opt.removeAttribute('data-cc-icon-tint');

    var its = String(p.itemTypeString || '').toLowerCase();
    var code = String(p.code || '').toLowerCase();
    var nm = String((p.legendaryName || p.name || '')).toLowerCase();
    var blob = its + ' ' + code + ' ' + nm;

    var tier = null;
    if (blob.indexOf('comp_06_pearlescent') !== -1 || blob.indexOf('pearlescent') !== -1) tier = 5;
    if (tier == null && blob.indexOf('comp_05_legendary') !== -1) {
      tier = ccPartMatchesPearlRarityAllowlist(p) ? 5 : 4;
    }
    if (tier == null) {
      if (blob.indexOf('comp_01_common') !== -1) tier = 0;
      else if (blob.indexOf('comp_02_uncommon') !== -1) tier = 1;
      else if (blob.indexOf('comp_03_rare') !== -1) tier = 2;
      else if (blob.indexOf('comp_04_epic') !== -1) tier = 3;
    }
    if (tier == null) return;

    // Pearl tier: elemental art, then pearl slot icon by gear class, then fallback.
    if (tier === 5) {
      if (/\bpearl_(damage|reload|firerate|handling)\b/.test(blob)) {
        applyDataCcIconFullUrl(opt, CC_GUIDED_PEARL_ITEMTYPE_BASE + 'ico_misc_pearl.png');
        return;
      }
      var pe = its.match(/\bpearl_(normal|shock|radiation|corrosive|cryo|fire|sonic)\b/);
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
      var g = guessPearlElementIconFromBlob(blob);
      if (g) applyDataCcIconIfAny(opt, g);
      else applyDataCcIconFullUrl(opt, CC_GUIDED_PEARL_ITEMTYPE_BASE + 'ico_misc_pearl.png');
      return;
    }

    // Legendary comp tier: `legendary_augments` art (per gear class), then tinted weapon chip fallback.
    if (tier === 4) {
      var legAug = ccLegendaryAugIconUrlForPartGear(p);
      if (legAug) {
        applyDataCcIconFullUrl(opt, ccPearlPipUrlInsteadOfLegendaryAug(legAug));
        return;
      }
    }

    // Non-pearl comp tiers (common..epic): weapon silhouettes vs soft-tinted gear aug art (see legGear branch).
    var k = ccNormalizedWeaponTypeKey(p);
    if (k) {
      var png = ccGuidedWeaponTypePngUrlFromKey(k);
      var iconUrl = png || ccGuidedWeaponTypeIconDataUrl(p);
      if (iconUrl) {
        applyDataCcIconFullUrl(opt, iconUrl);
        if (png && tier >= 0 && tier <= 3) {
          var ft = CC_COMP_TIER_WEAPON_ICON_FILTERS[tier];
          if (ft) opt.setAttribute('data-cc-icon-filter', ft);
        }
        return;
      }
    }
    var legGear = ccLegendaryAugIconUrlForPartGear(p);
    if (legGear && tier >= 0 && tier <= 3) {
      applyDataCcIconFullUrl(opt, ccPearlPipUrlInsteadOfLegendaryAug(legGear));
      var fG = CC_COMP_TIER_GEAR_LEGENDARY_AUG_FILTERS[tier];
      if (fG) opt.setAttribute('data-cc-icon-filter', fG);
    }
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
    else if (cat === 'enhancement') fn = 'ico_pearl_aug_gun_classmod.png';
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

  /** When pearl override is on: explicit pearl pip art for legendaries that lack a clean spawn→icon chain (supplement rows, etc.). Keys = normalized display name (letters+digits only, lower). Values = weapon class key or `classmod`. */
  var CC_PEARL_ICON_OVERRIDE_WEAPON_KEY_BY_NAME_NORM = {
    conflux: 'sniper rifle',
    eigenburst: 'shotgun',
    handcannon: 'pistol',
    crowdsourced: 'assault rifle',
    crowsourced: 'assault rifle',
    soulsurvivor: 'pistol',
    crazedearl: 'shotgun',
    jailbroken: 'smg',
    jailbrokengatling: 'smg',
    jailbrokenkatling: 'smg',
    mercurious: 'smg',
    mercury: 'smg',
    fleabag: 'assault rifle',
    hairtrigger: 'shotgun',
    shalashaska: 'pistol',
    gomie: 'assault rifle',
    herald: 'pistol',
    loomingconstable: 'shotgun',
    looming: 'shotgun',
    firestorm: 'smg',
    firework: 'smg',
    abyss: 'sniper rifle',
    constable: 'shotgun',
    screwstonian: 'smg',
    screwed: 'smg',
    parasite: 'smg',
    solartemper: 'smg',
    chainreaction: 'classmod'
  };

  function ccPearlIconUrlForLegendaryNameOverride(p) {
    if (!p) return '';
    var candidates = [p.name, p.legendaryName, p.effects, p.effect];
    for (var ci = 0; ci < candidates.length; ci++) {
      var raw = String(candidates[ci] || '').trim();
      if (!raw) continue;
      var head = raw.split(/\s*[\-|–—]\s*/)[0].trim();
      var tryKeys = [raw, head];
      for (var ti = 0; ti < tryKeys.length; ti++) {
        var k = tryKeys[ti].replace(/[^a-z0-9]/gi, '').toLowerCase();
        if (!k || !Object.prototype.hasOwnProperty.call(CC_PEARL_ICON_OVERRIDE_WEAPON_KEY_BY_NAME_NORM, k)) continue;
        var w = CC_PEARL_ICON_OVERRIDE_WEAPON_KEY_BY_NAME_NORM[k];
        if (w === 'classmod') return CC_GUIDED_PEARL_ITEMTYPE_BASE + 'ico_pearl_aug_gun_classmod.png';
        var fake = { weaponType: w, category: 'Weapon', code: p.code, spawnCode: p.spawnCode };
        return CC_GUIDED_PEARL_ITEMTYPE_BASE + ccWeaponFamilyPearlAugFilename(fake);
      }
    }
    return '';
  }

  // Legend/pearlescent icons can be tied to base parts by name.
  // Example: base barrel "Rowan's Charge" does not contain `comp_05_legendary`
  // in its own `code`, but a separate rarity-id row exists whose `effects` is
  // exactly "Rowan's Charge". For UI purposes, we want the base part to use
  // the rarity-id icon.
  var CC_RARITY_ID_EFFECT_TO_LEGENDARY_AUG_URL = null;
  var CC_RARITY_ID_LEGENDARY_TOKEN_TO_AUG_URL = null;
  var CC_RARITY_ID_PEARL_TOKEN_TO_AUG_URL = null;

  function ccInitRarityIdIconLookups() {
    if (CC_RARITY_ID_EFFECT_TO_LEGENDARY_AUG_URL && CC_RARITY_ID_LEGENDARY_TOKEN_TO_AUG_URL && CC_RARITY_ID_PEARL_TOKEN_TO_AUG_URL) return;
    CC_RARITY_ID_EFFECT_TO_LEGENDARY_AUG_URL = Object.create(null);
    CC_RARITY_ID_LEGENDARY_TOKEN_TO_AUG_URL = Object.create(null);
    CC_RARITY_ID_PEARL_TOKEN_TO_AUG_URL = Object.create(null);

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

      if (code.indexOf('comp_05_legendary') !== -1) {
        var isPearlRow = ccPartMatchesPearlRarityAllowlist(p);
        var iconUrl = isPearlRow
          ? (ccPearlSlotAugFullUrl(p) || (CC_GUIDED_PEARL_ITEMTYPE_BASE + 'ico_misc_pearl.png'))
          : ccLegendaryAugIconUrlForPartGear(p);
        if (!iconUrl) continue;
        if (isPearlRow) {
          if (rarityTokenFromCode) CC_RARITY_ID_PEARL_TOKEN_TO_AUG_URL[rarityTokenFromCode] = iconUrl;
        } else {
          CC_RARITY_ID_EFFECT_TO_LEGENDARY_AUG_URL[effectsKeyNorm] = iconUrl;
          if (rarityTokenFromCode) CC_RARITY_ID_LEGENDARY_TOKEN_TO_AUG_URL[rarityTokenFromCode] = iconUrl;
        }
      }
    }
  }

  function ccBarrelTokenFromPart(p) {
    if (typeof window.stxBarrelPearlLegendTokenFromPart === 'function') {
      return window.stxBarrelPearlLegendTokenFromPart(p);
    }
    return '';
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
    token = ccBarrelTokenFromPart(p) || String(token || '')
      .replace(/[^a-z0-9]/g, '')
      .toLowerCase();
    var isW = ccSpawnCodeLooksLikeWeaponFamily(p);
    var shortNumericTok = /^[0-9]+$/.test(token) && token.length <= 2;
    if (token && !shortNumericTok && CC_RARITY_ID_PEARL_TOKEN_TO_AUG_URL && CC_RARITY_ID_PEARL_TOKEN_TO_AUG_URL[token]) {
      return CC_RARITY_ID_PEARL_TOKEN_TO_AUG_URL[token];
    }
    if (token && !shortNumericTok && CC_RARITY_ID_LEGENDARY_TOKEN_TO_AUG_URL[token]) {
      var uTok = CC_RARITY_ID_LEGENDARY_TOKEN_TO_AUG_URL[token];
      if (!isW || !/ico_legendary_aug_classmod/i.test(uTok)) return ccPearlPipUrlInsteadOfLegendaryAug(uTok);
    }

    // Fallback: match by rarity-id effects naming.
    var k = String(p.name || p.legendaryName || '').trim().toLowerCase();
    if (!k) return '';
    var kNorm = k.replace(/[^a-z0-9]/g, '');
    var uEff = CC_RARITY_ID_EFFECT_TO_LEGENDARY_AUG_URL[kNorm] || '';
    if (uEff && isW && /ico_legendary_aug_classmod/i.test(uEff)) return '';
    return ccPearlPipUrlInsteadOfLegendaryAug(uEff);
  }

  function ccIsPearlByRarityIdEffectName(p) {
    if (!p) return false;
    var pt = String(p.partType || '').trim().toLowerCase();
    if (!/barrel|body/.test(pt)) return false;
    ccInitRarityIdIconLookups();
    var token = ccBarrelTokenFromPart(p);
    return !!(token && CC_RARITY_ID_PEARL_TOKEN_TO_AUG_URL && CC_RARITY_ID_PEARL_TOKEN_TO_AUG_URL[token]);
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
      if (leg) return ccPearlPipUrlInsteadOfLegendaryAug(leg);
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
    try {
      var pearlOn =
        (typeof window.stxIsPearlOverrideUiActive === 'function' && window.stxIsPearlOverrideUiActive()) ||
        (function () {
          try {
            var a = document.getElementById('stxPearlOverride');
            var b = document.getElementById('ccGuidedPearlOverride');
            return !!((a && a.checked) || (b && b.checked));
          } catch (_e) {
            return false;
          }
        })();
      if (pearlOn) {
        var namedPearl = ccPearlIconUrlForLegendaryNameOverride(p);
        if (namedPearl) {
          applyDataCcIconFullUrl(opt, namedPearl);
          return;
        }
      }
    } catch (_po) {}
    if (sid === 'ccRepkitBodySelect') {
      // Repkit "Body" entries are stored as partType "Base" with `*_repair_kit.part_*` codes,
      // and the dataset manufacturer is often "gadgets". Use the code prefix to pick the right icon.
      try {
        var c0 = String(p.code || p.spawnCode || '').toLowerCase().replace(/^["']|["']$/g, '').trim();
        var m = '';
        if (c0.indexOf('ted_repair_kit.') === 0) m = 'tediore';
        else if (c0.indexOf('tor_repair_kit.') === 0) m = 'torgue';
        else if (c0.indexOf('jak_repair_kit.') === 0) m = 'jakobs';
        else if (c0.indexOf('mal_repair_kit.') === 0) m = 'maliwan';
        else if (c0.indexOf('vla_repair_kit.') === 0) m = 'vladof';
        else if (c0.indexOf('dad_repair_kit.') === 0) m = 'daedalus';
        else if (c0.indexOf('ord_repair_kit.') === 0) m = 'order';
        else if (c0.indexOf('bor_repair_kit.') === 0) m = 'ripper';
        if (m) {
          var u = manufacturerLogomarkUrl(m);
          if (u) applyDataCcIconFullUrl(opt, u);
        }
      } catch (_) {}
      return;
    }
    if (CC_GUIDED_RARITY_SELECT_IDS[sid]) {
      applyGuidedRarityPartOptionIcon(opt, p);
      return;
    }
    if (CC_GUIDED_FIRMWARE_SELECT_IDS[sid]) {
      try {
        if (typeof window.stxResolvePartIconUrl === 'function') {
          var fwUrl = window.stxResolvePartIconUrl(
            p,
            { key: 'firmware', partType: 'Firmware', ncsSlot: 'firmware' },
            guidedItemTypeForIcons()
          );
          if (fwUrl) {
            applyDataCcIconFullUrl(opt, fwUrl);
            return;
          }
        }
      } catch (_fwIcon) {}
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
        applyDataCcIconFullUrl(opt, ccPearlPipUrlInsteadOfLegendaryAug(leg));
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
      var f2 = ccResolveElementIconFilename(p);
      if (f2) applyDataCcIconIfAny(opt, f2);
    }
    if (GUIDED_BARREL_ACCESSORY_SELECT_IDS[sid]) {
      opt.removeAttribute('data-cc-icon');
      opt.removeAttribute('data-cc-icon-filter');
      opt.removeAttribute('data-cc-icon-tint');
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
        applyDataCcIconFullUrl(opt, ccPearlPipUrlInsteadOfLegendaryAug(tiedLegendUrl));
        return;
      }

      // Pearlescent body/barrel rows: pearl pip / elemental art.
      var its2 = String(p.itemTypeString || '').toLowerCase();
      var code2 = String(p.code || '').toLowerCase();
      var nm2 = String((p.legendaryName || p.name || '')).toLowerCase();
      var blob2 = its2 + ' ' + code2 + ' ' + nm2;
      if (ccIsPearlByRarityIdEffectName(p)) {
        var pearlUrl = ccLegendaryAugIconUrlForPartIfTiedByName(p);
        if (pearlUrl) {
          applyDataCcIconFullUrl(opt, pearlUrl);
          return;
        }
        applyDataCcIconFullUrl(opt, CC_GUIDED_PEARL_ITEMTYPE_BASE + 'ico_misc_pearl.png');
        return;
      }

      var looksLegendary2 =
        (ccPartLooksLegendaryBarrel(p) && !ccIsPearlByRarityIdEffectName(p)) ||
        (/comp_05_legendary/.test(blob2) && !ccPartMatchesPearlRarityAllowlist(p)) ||
        (nm2.indexOf('legendary') !== -1 && !ccPartMatchesPearlRarityAllowlist(p));
      if (looksLegendary2) {
        var leg2 = ccLegendaryAugIconUrlForPartGear(p);
        if (leg2) {
          applyDataCcIconFullUrl(opt, ccPearlPipUrlInsteadOfLegendaryAug(leg2));
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
        var codeN = String(normCodeForRepkitGuidedSlot(p && p.code) || '').toLowerCase();
        var grenadeElem = /(?:^|[._])grenade_gadget\.part_(corrosive|cryo|fire|radiation|shock)\b/.test(codeN)
          || /[a-z0-9]+_grenade_gadget\.part_(corrosive|cryo|fire|radiation|shock)\b/.test(codeN);
        var repkitElem = /^part_element_/.test(codeN) || /\.part_element_/.test(codeN);
        return pt === 'element' || pt === 'status' || grenadeElem || repkitElem || /^\{1:(10|11|12|13|14)\}$/.test(getPartToken(p));
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
    if (typeof window.ccRichPartDropdownLabel === 'function') {
      try {
        var rich = String(window.ccRichPartDropdownLabel(p, 180) || '').trim();
        if (rich && rich !== '-') return rich;
      } catch (_e) {}
    }
    var rawCode = guidedNormCode(p);
    var unquoted = rawCode.replace(/^["']|["']$/g, '').trim();
    var codeL = String(unquoted || '').toLowerCase();
    var pt = String(p.partType || '').trim().toLowerCase();
    var isRarityComp = pt === 'rarity' || /\.comp_0[1-6]_/.test(codeL) || /\bcomp_0[1-6]_/.test(codeL);
    var spawnSeg = guidedSpawnSegmentFromCode(rawCode);
    var datasetName = String((p.name || p.legendaryName || '').trim() || '');
    var id = String(p.idRaw != null && p.idRaw !== '' ? p.idRaw : (p.idraw != null ? p.idraw : (p.id != null ? p.id : ''))).trim();
    var stats = (p.stats != null) ? String(p.stats).replace(/\s+/g, ' ').trim() : '';
    if (stats.length > 44) stats = stats.substring(0, 43) + '…';

    var bits = [];
    if (isRarityComp && typeof window.stxRarityIdHumanTitleForPart === 'function') {
      var humanTitle = String(window.stxRarityIdHumanTitleForPart(p) || '').trim();
      if (humanTitle) bits.push(humanTitle);
    }
    if (!bits.length) {
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
    }

    // `(Pearl)` only on rarity-ID comp rows (main rarity picker), not barrels or other slots.
    (function () {
      if (/part_pearl/i.test(codeL) || /part_barrel/.test(codeL) || pt === 'barrel') return;
      if (!isRarityComp) return;
      var isPearl =
        (/(?:^|[._])comp_06_pearlescent/.test(codeL)) ||
        (typeof ccPartMatchesPearlRarityAllowlist === 'function' && ccPartMatchesPearlRarityAllowlist(p) && /comp_05_legendary/.test(codeL));
      var item = Number(p.itemId != null ? p.itemId : p.id);
      if (Number.isFinite(item) && item >= 51 && item <= 60) isPearl = true;
      if (!isPearl) return;
      var lineSoFar = bits.join(' · ');
      if (lineSoFar.indexOf('(Pearl)') === -1) bits.push('(Pearl)');
    })();
    if (id) {
      var idNorm = String(id).replace(/\s+/g, ' ').trim();
      if (/^\d+\s*:\s*\d+$/.test(idNorm)) {
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
    if (typeof window.ccRichPartDropdownLabel === 'function') {
      try {
        var rich = String(window.ccRichPartDropdownLabel(p) || '').trim();
        if (rich) return rich;
      } catch (_e) {}
    }
    if (sel && isGuidedBarrelFamilySelect(sel)) return guidedBarrelOptionPrimaryText(p);
    return compactGuidedPartLabel(p);
  }

  function preservedSelectLabelForToken(sel, token) {
    var t = String(token || '').trim();
    if (!t) return '[Selected]';
    try {
      var wantKey = normTailTokenKey(t);
      var all = getAllParts();
      for (var i = 0; i < all.length; i++) {
        var p = all[i];
        if (!p) continue;
        var pt = String(getPartToken(p) || '').trim();
        if (!pt) continue;
        if (pt === t || normTailTokenKey(pt) === wantKey) {
          return '[Selected] ' + guidedOptionLabelForSelect(sel, p);
        }
      }
    } catch (_) {}
    return '[Selected] ' + t;
  }

  function guidedOptionTitleForSelect(sel, p) {
    var base = '';
    try {
      if (typeof window.partEffectDescForDropdown === 'function') {
        var eff = String(window.partEffectDescForDropdown(p) || '').trim();
        if (eff) return eff;
      }
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
    var effectDesc = (typeof window.partEffectDescForDropdown === 'function')
      ? String(window.partEffectDescForDropdown(p) || '').trim()
      : '';
    var ef = String(p.effects != null ? p.effects : (p.effect || '')).trim();
    if (effectDesc) lines.push('<div><span class="muted">Effect</span> ' + ccEscapeHtml(effectDesc.length > 360 ? effectDesc.slice(0, 359) + '…' : effectDesc) + '</div>');
    else if (ef) lines.push('<div><span class="muted">Effect</span> ' + ccEscapeHtml(ef.length > 360 ? ef.slice(0, 359) + '…' : ef) + '</div>');
    var catalogRed = (typeof window.partRedTextForDropdown === 'function')
      ? String(window.partRedTextForDropdown(p) || '').trim()
      : '';
    if (catalogRed) {
      lines.push('<div class="stx-part-preview__barrel-redtext" style="color:#ff8f8f;font-size:12px;line-height:1.35;margin-top:4px;"><span class="muted">Red text</span> ' + ccEscapeHtml(catalogRed) + '</div>');
    }
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

  /** Flavor quote for coral row — catalog red text only (abilities go in desc sub). */
  function guidedBarrelOptionSubText(p) {
    if (typeof window.partRedTextForDropdown === 'function') {
      try { return String(window.partRedTextForDropdown(p) || '').trim(); } catch (_) {}
    }
    var row = (typeof window.stxGearCatalogRowForPart === 'function') ? window.stxGearCatalogRowForPart(p) : null;
    if (row && row.redText) return String(row.redText).trim();
    return '';
  }

  function applyGuidedBarrelOptionDataAttrs(sel, opt, p) {
    if (!opt || !p) return;
    if (isGuidedBarrelFamilySelect(sel)) {
      opt.textContent = guidedBarrelOptionPrimaryText(p);
    }
    if (typeof window.stxApplyPartDropdownMeta === 'function') {
      try {
        window.stxApplyPartDropdownMeta(opt, p, {
          isBarrelSlot: isGuidedBarrelFamilySelect(sel),
          allowLegendaryTone: isGuidedBarrelFamilySelect(sel)
        });
        return;
      } catch (_) {}
    }
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
    var catalogRed = (typeof window.partRedTextForDropdown === 'function')
      ? String(window.partRedTextForDropdown(p) || '').trim()
      : guidedBarrelOptionSubText(p);
    if (catalogRed) {
      lines.push('<div class="stx-part-preview__barrel-redtext" style="color:#ff8f8f;font-size:12px;line-height:1.35;margin-top:2px;">' + ccEscapeHtml(catalogRed.length > 420 ? catalogRed.slice(0, 419) + '…' : catalogRed) + '</div>');
    }
    var descParts = [];
    var effectDesc = (typeof window.partEffectDescForDropdown === 'function')
      ? String(window.partEffectDescForDropdown(p) || '').trim()
      : '';
    if (effectDesc && effectDesc !== catalogRed) descParts.push(effectDesc);
    else if (split.body && !catalogRed) descParts.push(split.body);
    var statsRaw = String(p.stats != null ? p.stats : (p.stats_text || '')).replace(/\s+/g, ' ').trim();
    var statsTail = statsRaw ? stripStatsHeadlineIfRedundant(statsRaw, title) : '';
    if (/^barrel\s+part\s+for\s+/i.test(statsTail) || /^barrel\s+part\s+for\s+/i.test(statsRaw)) statsTail = '';
    if (statsTail && statsTail !== effectDesc) descParts.push(statsTail);
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

  function guidedRarityGroupRank(label) {
    var m = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4, Pearlescent: 5, Unknown: 6 };
    var L = String(label || '');
    return Object.prototype.hasOwnProperty.call(m, L) ? m[L] : 50;
  }

  /** Collapse duplicate dataset rows ({9} vs {267:9}); prefer richer rows for icons / labels (matches Simple Builder). */
  function dedupePartsForGuidedSelect(parts) {
    if (!parts || !parts.length) return parts || [];
    var normC = function (p) {
      return String((p && p.code) ? p.code : '').toLowerCase().replace(/^["']|["']$/g, '');
    };
    var richness = function (p) {
      if (typeof window.stxPartDropdownRichnessScore === 'function') {
        return window.stxPartDropdownRichnessScore(p);
      }
      var s = 0;
      var ir = String((p && (p.idRaw != null ? p.idRaw : p.idraw)) || '').trim();
      if (/^\d+\s*:\s*\d+$/.test(ir)) s += 8;
      else if (ir) s += 2;
      if (String(p && p.name || '').trim()) s += 1;
      if (String((p && p.code) || '').trim()) s += 1;
      return s;
    };
    var sorted = parts.slice().sort(function (a, b) {
      var rd = richness(b) - richness(a);
      if (rd) return rd;
      return normC(a).localeCompare(normC(b), undefined, { numeric: true });
    });
    var seen = {};
    var out = [];
    for (var i = 0; i < sorted.length; i++) {
      var p = sorted[i];
      var key = '';
      if (typeof window.stxSelectLogicalDedupeKey === 'function') {
        key = window.stxSelectLogicalDedupeKey(p) || '';
      }
      if (!key && typeof window.stxStableDropdownDedupeKey === 'function') {
        key = window.stxStableDropdownDedupeKey(p) || '';
      }
      if (key) {
        if (seen[key]) continue;
        seen[key] = true;
        out.push(p);
        continue;
      }
      var tok = getPartToken(p);
      if (!tok) continue;
      if (seen[tok]) continue;
      seen[tok] = true;
      out.push(p);
    }
    return out;
  }

  function fillSelect(sel, parts, maxItems, emptyHint, fillOpts) {
    if (!sel) return;
    fillOpts = fillOpts || {};
    var groupByRarity = !!(fillOpts.groupByRarity && typeof window.stxRarityOptgroupLabelFromPart === 'function');
    var manHint = String(fillOpts.manufacturer || '').trim();
    var prevValue = String((sel.value != null ? sel.value : '') || '').trim();
    var preferredValue = String((sel.__ccPreferredToken != null ? sel.__ccPreferredToken : prevValue) || '').trim();
    /* Logical dedupe ({9} vs {267:9}) is opt-in: global dedupe can drop icon-rich rows and hurt dropdown art. */
    var dedupeLogical = !!(fillOpts && fillOpts.logicalDedupe);
    var partsList = dedupeLogical ? dedupePartsForGuidedSelect(parts || []) : (parts || []);
    
    // Check if parts list has actually changed to avoid redundant DOM work
    var partsHash = (partsList && partsList.length) ? (partsList.length + ':' + (partsList[0] ? (partsList[0].code || partsList[0].name) : '')) : '0';
    if (groupByRarity) partsHash = 'rfl:' + manHint + ':' + partsHash;
    if (sel.__lastPartsHash === partsHash && !sel.dataset.forceRebuild) {
        if (preferredValue && sel.value !== preferredValue) {
           sel.value = preferredValue;
        }
        syncGuidedCustomSelectIfWrapped(sel);
        return;
    }
    sel.__lastPartsHash = partsHash;

    sel.innerHTML = '';
    sel.appendChild(new Option('-- None / N/A --', ''));
    var listForPreview = [];
    var seenTok = {};
    var plen = (partsList && partsList.length) ? partsList.length : 0;
    var limit = Math.min(plen, maxItems || 300);
    
    if (groupByRarity) {
      var groupsRg = {};
      for (var gi = 0; gi < plen; gi++) {
        var pGlx = partsList[gi];
        var gLbl = window.stxRarityOptgroupLabelFromPart(pGlx, manHint) || 'Unknown';
        if (!groupsRg[gLbl]) groupsRg[gLbl] = [];
        groupsRg[gLbl].push(pGlx);
      }
      var gKeysRg = Object.keys(groupsRg).sort(function (a, b) {
        return guidedRarityGroupRank(a) - guidedRarityGroupRank(b) ||
          String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
      });
      for (var gs = 0; gs < gKeysRg.length; gs++) {
        groupsRg[gKeysRg[gs]].sort(function (a, b) {
          return normPartCodeForSort(a).localeCompare(normPartCodeForSort(b), undefined, { numeric: true });
        });
      }
      /* Same tier order as grouped UI, but one flat list (no optgroup section headers in the custom dropdown). */
      var fragmentRg = document.createDocumentFragment();
      var remainingRg = limit;
      for (var ogI = 0; ogI < gKeysRg.length && remainingRg > 0; ogI++) {
        var ogParts = groupsRg[gKeysRg[ogI]];
        for (var oj = 0; oj < ogParts.length && remainingRg > 0; oj++) {
          var pr = ogParts[oj];
          var t2 = getPartToken(pr);
          if (!t2) continue;
          listForPreview.push(pr);
          var opt2 = new Option(guidedOptionLabelForSelect(sel, pr), t2);
          var tit2 = guidedOptionTitleForSelect(sel, pr);
          if (tit2) opt2.title = tit2;
          applyGuidedPartOptionIcon(sel, opt2, pr);
          applyGuidedBarrelOptionDataAttrs(sel, opt2, pr);
          fragmentRg.appendChild(opt2);
          remainingRg--;
        }
      }
      sel.appendChild(fragmentRg);
    } else {
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < limit; i++) {
      var p = partsList[i];
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
      fragment.appendChild(opt);
    }
    sel.appendChild(fragment);
    }
    
    if (!listForPreview.length && emptyHint) {
      var hi = new Option(emptyHint, '');
      hi.disabled = true;
      sel.appendChild(hi);
    }
    if (preferredValue) {
      var foundPref = false;
      for (var pi = 0; pi < sel.options.length; pi++) {
        if (String(sel.options[pi].value || '').trim() === preferredValue) {
          sel.value = preferredValue;
          foundPref = true;
          break;
        }
      }
      if (!foundPref) {
        var keepOpt = new Option(preservedSelectLabelForToken(sel, preferredValue), preferredValue);
        keepOpt.setAttribute('data-guided-preserved', '1');
        sel.appendChild(keepOpt);
        sel.value = preferredValue;
      }
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

  function fillElementPresetFallbackSelect(sel, placeholder) {
    if (!sel) return;
    sel.innerHTML = '';
    var ph = new Option(placeholder || '-- Element --', '');
    applyDataCcIconIfAny(ph, CC_ELEMENT_PLACEHOLDER_ICON_FILE);
    sel.appendChild(ph);
    for (var j = 0; j < ELEMENTS.length; j++) {
      var ej = ELEMENTS[j];
      if (!ej || !ej.code) continue;
      var o = new Option(guidedPresetElementOptionLabel(ej), ej.code);
      o.title = 'Output token: ' + ej.code;
      if (ej.iconFile) applyDataCcIconIfAny(o, ej.iconFile);
      sel.appendChild(o);
    }
    sel.__ccGuidedPartsList = null;
    bindGuidedSelectPreviewIfNeeded(sel);
    updateGuidedSelectPreview(sel);
    syncGuidedCustomSelectIfWrapped(sel);
  }

  /** Heavy gadget / HW rows — used to split legendary perk dropdown groups. */
  function guidedLegendaryPartIsHeavy(p) {
    if (!p) return false;
    var cat = String(p.category || '').trim().toLowerCase();
    if (cat === 'gadget' || cat === 'heavy weapon' || cat === 'heavy') return true;
    var pwt = String(p.weaponType || p.itemType || '').trim().toLowerCase();
    if (pwt === 'heavy weapon' || pwt === 'heavy' || pwt.indexOf('heavy') >= 0) return true;
    var code = guidedSpawnCodeLo(p);
    if (/_hw[._]|heavy_weapon_gadget/i.test(code)) return true;
    return false;
  }

  function fillSelectWithLegendaryGroups(sel, parts) {
    if (!sel) return;
    var prevValue = String((sel.value != null ? sel.value : '') || '').trim();
    var preferredValue = String((sel.__ccPreferredToken != null ? sel.__ccPreferredToken : prevValue) || '').trim();
    var heavy = [];
    var weapon = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (guidedLegendaryPartIsHeavy(p)) heavy.push(p);
      else weapon.push(p);
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
      g1.label = 'Heavy Legendary Perks & Barrels';
      for (var h = 0; h < Math.min(heavy.length, 800); h++) addPartToGroup(g1, heavy[h]);
      sel.appendChild(g1);
    }
    if (weapon.length) {
      var g2 = document.createElement('optgroup');
      g2.label = 'Weapon Legendary Perks & Barrels';
      for (var w = 0; w < Math.min(weapon.length, 1200); w++) addPartToGroup(g2, weapon[w]);
      sel.appendChild(g2);
    }
    if (preferredValue) {
      var foundLegendaryPref = false;
      for (var li = 0; li < sel.options.length; li++) {
        if (String(sel.options[li].value || '').trim() === preferredValue) {
          sel.value = preferredValue;
          foundLegendaryPref = true;
          break;
        }
      }
      if (!foundLegendaryPref) {
        var keepLegendaryOpt = new Option(preservedSelectLabelForToken(sel, preferredValue), preferredValue);
        keepLegendaryOpt.setAttribute('data-guided-preserved', '1');
        sel.appendChild(keepLegendaryOpt);
        sel.value = preferredValue;
      }
    }
    sel.__ccGuidedPartsList = listed;
    maybeDecoratedGuidedSelectPlaceholder(sel);
    bindGuidedSelectPreviewIfNeeded(sel);
    updateGuidedSelectPreview(sel);
    syncGuidedCustomSelectIfWrapped(sel);
  }

  function getGuidedState() {
    return getGuidedFilterContext();
  }

  /** Map Simple Builder `Heavy` onto Guided gear key `Heavy Weapon` for slot tables + visibility. */
  function normalizeGuidedItemTypeForGear(category) {
    var c = String(category || '').trim();
    if (!c) return c;
    if (c.toLowerCase() === 'heavy') return 'Heavy Weapon';
    return c;
  }

  function getEffectiveManufacturerForFilter() {
    var ctx = getGuidedFilterContext();
    var itemType = String(ctx.itemType || '').trim();
    if (itemType === 'Gadget') return '';
    if (itemType === 'Enhancement') {
      var enhMfg = byId('enhMfgSel');
      var ev = readSelectValue(enhMfg);
      if (ev) return ev;
    }
    var toggle = byId('ccGuidedAllManufacturers');
    if (toggle && toggle.checked) return '';
    return String(ctx.manufacturer || '').trim();
  }

  /** Body slots always use the item's selected manufacturer (ignore all-manufacturers toggle). */
  function getSelectedItemManufacturerForBody() {
    var ctx = getGuidedFilterContext();
    var itemType = String(ctx.itemType || '').trim();
    if (itemType === 'Enhancement') {
      var enhMfg = byId('enhMfgSel');
      var ev = readSelectValue(enhMfg);
      if (ev) return ev;
    }
    return String(ctx.manufacturer || '').trim();
  }

  /** Body / main-body rows: once used to hide when a filter returned 0 rows; always show now so slots stay usable. */
  var GUIDED_BODY_FAMILY_KEYS_BY_CATEGORY = {
    Weapon: { body: true, bodyAcc: true, bodyEle: true },
    'Heavy Weapon': { body: true, bodyAcc: true },
    Shield: { mainBody: true, body: true },
    Grenade: { body: true },
    Enhancement: { body: true },
    Repkit: { body: true }
  };

  function guidedSlotIsBodyFamily(category, slotKey) {
    var m = GUIDED_BODY_FAMILY_KEYS_BY_CATEGORY[category];
    return !!(m && m[slotKey]);
  }

  /** Grid row: direct child of `.cc-guided-slots-grid` (stable after custom-select wrap). */
  function getGuidedSlotGridRow(sel) {
    if (!sel) return null;
    var el = sel;
    while (el && el !== document.body) {
      var parent = el.parentElement;
      if (parent && parent.classList && parent.classList.contains('cc-guided-slots-grid')) return el;
      el = parent;
    }
    if (!sel.parentElement) return null;
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
    wtypes = wtypes.filter(function (w) { return !/^heavy(?:\s*weapon)?$/i.test(String(w || '').trim()); });
    wtypes.sort(function (a, b) { return String(a).localeCompare(String(b), undefined, { numeric: true }); });
    var preserveWt = readSelectValue(wtSel);
    if (/^heavy(?:\s*weapon)?$/i.test(preserveWt)) preserveWt = '';
    wtSel.innerHTML = '<option value="">Select weapon type...</option>';
    for (var j = 0; j < wtypes.length; j++) {
      if (!wtypes[j]) continue;
      var wOpt = new Option(wtypes[j], wtypes[j]);
      var wIcon = guidedWeaponTypeSelectIconUrl(wtypes[j]);
      if (wIcon) applyDataCcIconFullUrl(wOpt, wIcon);
      wtSel.appendChild(wOpt);
    }
    var cur = preserveWt;
    if (cur && wtypes.indexOf(cur) >= 0) wtSel.value = cur;
    else if (window.state && window.state.weaponType && wtypes.indexOf(String(window.state.weaponType)) >= 0) wtSel.value = String(window.state.weaponType);
    else if (wtypes.length) wtSel.value = wtypes[0];
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
    var fromStx = !!(stxItem && stxItem.value) && (!itemSel || !itemSel.value || itemSel.value === stxItem.value);
    if (itemType === 'Gadget') {
      manSel.innerHTML = '<option value="">All gadget pools</option>';
      manSel.disabled = true;
      syncGuidedManufacturerSelects(manSel, stxMan, fromStx);
      return;
    }
    if (itemType === 'Enhancement') {
      manSel.innerHTML = '<option value="">Choose below</option>';
      manSel.disabled = true;
      syncGuidedManufacturerSelects(manSel, stxMan, fromStx);
      return;
    }
    var placeholder = (itemType === 'Class Mod') ? 'Select character...' : 'Select manufacturer...';
    var preserveMan = (manSel.value || '').trim();
    if (!preserveMan) {
      try {
        var st = window.state || window.__STX_SIMPLE_STATE;
        preserveMan = String((st && st.manufacturer) || manSel.__ccPreferredManufacturer || '').trim();
      } catch (_) {}
    }
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
          } else if (preserveMan) {
            var pLab0 = (itemType === 'Class Mod') ? getClassModDisplayName(preserveMan) : preserveMan;
            appendGuidedManufacturerOption(manSel, stxMan, fromStx, pLab0, preserveMan, itemType);
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
          } else if (preserveMan) {
            var pLab1 = (itemType === 'Class Mod') ? getClassModDisplayName(preserveMan) : preserveMan;
            appendGuidedManufacturerOption(manSel, stxMan, fromStx, pLab1, preserveMan, itemType);
            manSel.value = preserveMan;
            if (stxMan && fromStx) stxMan.value = preserveMan;
          }
          syncGuidedManufacturerSelects(manSel, stxMan, fromStx);
          return;
        }
      } catch (_e) {}
    }

    var seen = {};
    var map = { 'Weapon': ['Assault Rifle','Pistol','Shotgun','SMG','Sniper Rifle','Sniper'], 'Heavy Weapon': ['Heavy Weapon','Gadget'] };
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
    } else if (preserveMan) {
      var pLab2 = (itemType === 'Class Mod') ? getClassModDisplayName(preserveMan) : preserveMan;
      appendGuidedManufacturerOption(manSel, stxMan, fromStx, pLab2, preserveMan, itemType);
      manSel.value = preserveMan;
      if (stxMan && fromStx) stxMan.value = preserveMan;
    }
    syncGuidedManufacturerSelects(manSel, stxMan, fromStx);
    ensureStaticGuidedIcons();
  }

  function getGuidedOutputEl() {
    var el = byId('guidedOutputDeserialized');
    return el || null;
  }

  /** Live tail edit target — guided/simple output fields only (not inspector paste buffers). */
  function getActiveTailOutputEl() {
    var gi = byId('ccGuidedItemType');
    var guidedOn = gi && readSelectValue(gi);
    var g = byId('guidedOutputDeserialized');
    var o = byId('outCode');
    var imp = byId('importBox');
    var gv = g && String(g.value || '').trim();
    var ov = o && String(o.value || '').trim();
    var iv = imp && String(imp.value || '').trim();
    if (guidedOn) {
      if (gv) return g;
      if (ov) return o;
    } else {
      if (ov) return o;
      if (gv) return g;
    }
    if (iv) return imp;
    return g || o || null;
  }

  function getInspectorTailEditContext() {
    var serial = '';
    try {
      if (typeof window.__ipiGetInspectorSerialSource === 'function') {
        serial = String(window.__ipiGetInspectorSerialSource() || '').trim();
      }
    } catch (_) {}
    var qp = byId('ipiQuickPaste');
    var gi = byId('ccGuidedItemType');
    var guidedOn = gi && readSelectValue(gi);
    var g = byId('guidedOutputDeserialized');
    var o = byId('outCode');
    var imp = byId('importBox');
    var qv = qp && String(qp.value || '').trim();
    var gv = g && String(g.value || '').trim();
    var ov = o && String(o.value || '').trim();
    var iv = imp && String(imp.value || '').trim();
    var el = null;
    var target = 'guided';
    if (serial) {
      if (qv && serial === qv) { el = qp; target = guidedOn ? 'guided' : (ov ? 'simple' : 'guided'); }
      else if (gv && serial === gv) { el = g; target = 'guided'; }
      else if (ov && serial === ov) { el = o; target = 'simple'; }
      else if (iv && serial === iv) { el = imp; target = guidedOn ? 'guided' : 'simple'; }
    }
    if (!el) {
      if (qv) { el = qp; serial = qv; target = guidedOn ? 'guided' : (ov ? 'simple' : 'guided'); }
      else if (guidedOn) {
        if (gv) { el = g; serial = gv; target = 'guided'; }
        else if (ov) { el = o; serial = ov; target = 'simple'; }
        else if (iv) { el = imp; serial = iv; target = 'import'; }
      } else {
        if (ov) { el = o; serial = ov; target = 'simple'; }
        else if (gv) { el = g; serial = gv; target = 'guided'; }
        else if (iv) { el = imp; serial = iv; target = 'import'; }
      }
    }
    if (!el) el = getActiveTailOutputEl();
    if (!serial && el) serial = String(el.value || '').trim();
    return { el: el, serial: serial, target: target };
  }

  function writeInspectorTailSerialToOutputs(newSerial, serialBefore, primaryEl, targetKey) {
    if (!newSerial) return;
    serialBefore = String(serialBefore || '').trim();
    newSerial = String(newSerial || '').trim();
    var nodes = [
      byId('guidedOutputDeserialized'),
      byId('outCode'),
      byId('importBox'),
      byId('ipiQuickPaste')
    ];
    var primary = primaryEl || null;
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!node) continue;
      var cur = String(node.value || '').trim();
      if (node === primary || !cur || cur === serialBefore) node.value = newSerial;
    }
    var gDes = byId('guidedOutputDeserialized');
    var outCode = byId('outCode');
    if (primary && primary.id === 'ipiQuickPaste') {
      if (targetKey === 'simple' && outCode) outCode.value = newSerial;
      else if (gDes) {
        gDes.value = newSerial;
        if (newSerial.indexOf('||') >= 0) gDes.__ccUserTailEdit = true;
      } else if (outCode) outCode.value = newSerial;
    } else if (primary && primary.id === 'importBox') {
      if (targetKey === 'simple' && outCode) outCode.value = newSerial;
      else if (gDes) {
        gDes.value = newSerial;
        if (newSerial.indexOf('||') >= 0) gDes.__ccUserTailEdit = true;
      }
    } else if (primary && primary.id === 'outCode' && gDes) {
      var gCur = String(gDes.value || '').trim();
      if (!gCur || gCur === serialBefore) {
        gDes.value = newSerial;
        if (newSerial.indexOf('||') >= 0) gDes.__ccUserTailEdit = true;
      }
    } else if (primary && primary.id === 'guidedOutputDeserialized' && outCode) {
      var oCur = String(outCode.value || '').trim();
      if (!oCur || oCur === serialBefore) outCode.value = newSerial;
    }
    if (gDes && String(gDes.value || '').trim().indexOf('||') >= 0) gDes.__ccUserTailEdit = true;
    try {
      window.__CC_LAST_CODE_TARGET = (targetKey === 'simple') ? 'simple' : 'guided';
    } catch (_) {}
  }

  function syncTailOutputMirrors(oldSerial, newSerial) {
    if (!newSerial) return;
    oldSerial = String(oldSerial || '').trim();
    newSerial = String(newSerial || '').trim();
    if (!oldSerial || oldSerial === newSerial) return;
    var nodes = [
      byId('guidedOutputDeserialized'),
      byId('outCode'),
      byId('importBox'),
      byId('ipiQuickPaste')
    ];
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!node || node === getActiveTailOutputEl()) continue;
      if (String(node.value || '').trim() === oldSerial) node.value = newSerial;
    }
  }

  function parseGuidedHeaderNumber(v, fallback) {
    var n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function guidedRowLooksPearl(row) {
    var item = Number(row && (row.itemId != null ? row.itemId : row.id));
    var code = String((row && (row.itemTypeString || row.code)) || '').toLowerCase();
    if (Number.isFinite(item) && item >= 51 && item <= 60) return true;
    return code.indexOf('pearl_') !== -1 || /(?:^|[._])comp_06_pearlescent/.test(code);
  }

  function computeGuidedPrefixFallback() {
    var st = getGuidedState();
    var itemType = String((st && st.itemType) || '').trim();
    if (!itemType) return '';

    var levelEl = byId('ccGuidedLevel');
    var level = parseGuidedHeaderNumber(levelEl && levelEl.value, 60);
    if (!Number.isFinite(level) || level <= 0) level = 60;
    if (typeof window.clampItemLevel === 'function') level = window.clampItemLevel(level);
    else if (level > 60) level = 60;

    var firmwareLockEl = byId('ccGuidedFirmwareLockFlag');
    var firmwareLock = !!(firmwareLockEl && firmwareLockEl.checked);
    var buybackEl = byId('ccGuidedBuybackFlag');
    var buyback = !!(buybackEl && buybackEl.checked);

    var familyId = 1;
    var itemId = 0;
    var rows = Array.isArray(window.STX_RARITIES) ? window.STX_RARITIES : [];
    if (rows.length) {
      var man = getEffectiveManufacturerForFilter();
      var manL = String(man || '').trim().toLowerCase();
      var cat = (itemType === 'Heavy') ? 'Weapon' : itemType;
      var wt = String((st && st.weaponType) || '').trim();
      if (cat === 'Weapon') {
        if (itemType === 'Heavy' || itemType === 'Heavy Weapon') wt = 'Heavy Weapon';
        else if (!wt) wt = 'Assault Rifle';
      } else {
        wt = '';
      }
      var wantType = cat === 'Weapon' ? wt : cat;

      var matchesType = function (rt) {
        var v = String(rt || '').trim();
        if (!v || !wantType) return false;
        if (wantType === 'Heavy Weapon') return v === 'Heavy Weapon' || v === 'Heavy' || v === 'HeavyWeapon';
        return v === wantType;
      };

      var pool = rows.filter(function (r) {
        if (cat === 'Weapon' && guidedRowLooksPearl(r)) return true;
        if (!matchesType(r && r.itemType)) return false;
        if (!manL) return true;
        return String((r && r.manufacturer) || '').trim().toLowerCase() === manL;
      });
      if (!pool.length) {
        pool = rows.filter(function (r) { return matchesType(r && r.itemType); });
      }

      var pick = null;
      for (var i = 0; i < pool.length; i++) {
        if (!String((pool[i] && pool[i].legendaryName) || '').trim()) {
          pick = pool[i];
          break;
        }
      }
      if (!pick && pool.length) pick = pool[0];

      if (pick) {
        familyId = parseGuidedHeaderNumber(pick.familyId, 1);
        itemId = parseGuidedHeaderNumber(pick.itemId, 0);
      }
    }

    var seed = 0;
    if (typeof window.getSeed === 'function') {
      try {
        seed = Number(window.getSeed({ familyId: familyId, itemId: itemId })) || 0;
      } catch (_) {
        seed = 0;
      }
    } else {
      seed = Math.floor(Math.random() * 9999) + 1;
    }

    var header = familyId + ', 0, 1, ' + level + '|';
    if (firmwareLock) header += ' 9, 1|';
    if (buyback) header += ' 10, 1|';
    header += ' 2, ' + seed + '||';
    return header;
  }

  function computeGuidedPrefixSafe() {
    if (typeof window.computeGuidedPrefix === 'function') {
      try {
        var p = String(window.computeGuidedPrefix() || '').trim();
        if (p) return p;
      } catch (_) {}
    }
    return computeGuidedPrefixFallback();
  }

  function getBaseFamilyFromPrefix(prefixStr) {
    var m = (prefixStr || '').match(/^\s*(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }
  function getFamilyFromToken(tok) {
    var m = (tok || '').match(/^\{\s*(\d+)\s*:\s*\d+\s*\}$/);
    return m ? parseInt(m[1], 10) : null;
  }
  function parseGuidedIdToken(tok) {
    var s = String(tok || '').trim();
    if (!s) return null;
    var m = s.match(/^\{\s*(\d+)\s*\}$/);
    if (m) return { kind: 'id', id: Number(m[1]) };
    m = s.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
    if (m) return { kind: 'family', family: Number(m[1]), ids: [Number(m[2])] };
    m = s.match(/^\{\s*(\d+)\s*:\s*\[([^\]]+)\]\s*\}$/);
    if (m) {
      var ids = String(m[2] || '').match(/\d+/g);
      var list = (ids || []).map(function (n) { return Number(n); }).filter(function (n) { return Number.isFinite(n); });
      if (!list.length) return null;
      return { kind: 'family', family: Number(m[1]), ids: list, rawIds: m[2] };
    }
    return null;
  }
  function normalizeGuidedIdTokensLocal(tokens, baseFamily) {
    var src = Array.isArray(tokens) ? tokens : [];
    var bf = Number(baseFamily);
    var hasBase = Number.isFinite(bf);
    var out = [];
    for (var i = 0; i < src.length; i++) {
      var tok = src[i];
      var parsed = parseGuidedIdToken(tok);
      if (!parsed) {
        out.push(tok);
        continue;
      }
      if (parsed.kind === 'id') {
        out.push('{' + String(parsed.id) + '}');
        continue;
      }
      var fam = Number(parsed.family);
      var ids = Array.isArray(parsed.ids) ? parsed.ids : [];
      if (!Number.isFinite(fam) || !ids.length) {
        out.push(tok);
        continue;
      }
      
      // Expansion for bracketed IDs
      if (parsed.rawIds) {
        for (var j = 0; j < ids.length; j++) {
          var id = Number(ids[j]);
          if (!Number.isFinite(id)) continue;
          if (hasBase && fam === bf) out.push('{' + String(id) + '}');
          else out.push('{' + String(fam) + ':' + String(id) + '}');
        }
        continue;
      }
      // Regular family:id tokens must also be preserved.
      for (var k = 0; k < ids.length; k++) {
        var idSingle = Number(ids[k]);
        if (!Number.isFinite(idSingle)) continue;
        if (hasBase && fam === bf) out.push('{' + String(idSingle) + '}');
        else out.push('{' + String(fam) + ':' + String(idSingle) + '}');
      }
    }
    return out;
  }

  /** Lowercase spawn code for tail-token lookup (matches `normCode` strip-quotes behavior). */
  function guidedTailNormSpawnKey(raw) {
    var s = String(raw || '').trim();
    if (s.length >= 2 && s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') s = s.slice(1, -1);
    return s.trim().toLowerCase();
  }

  function guidedTailNumericItemIdFromPart(p) {
    if (!p) return NaN;
    if (Number.isFinite(Number(p.id))) return Number(p.id);
    var ir = String((p.idRaw || p.idraw || '') || '').trim();
    var m = ir.match(/:\s*(\d+)\s*$/);
    if (m) return Number(m[1]);
    var m2 = ir.match(/^(\d+)\s*:\s*(\d+)$/);
    return m2 ? Number(m2[2]) : NaN;
  }

  function guidedTailFamilyFromPart(p) {
    if (!p) return NaN;
    if (Number.isFinite(Number(p.familyId))) return Number(p.familyId);
    if (Number.isFinite(Number(p.family))) return Number(p.family);
    var ir = String((p.idRaw || p.idraw || '') || '').trim();
    var m = ir.match(/^(\d+)\s*:/);
    return m ? Number(m[1]) : NaN;
  }

  /**
   * Index ALL_PARTS so guided tail tokens resolve to dataset rows (Class Mod bucket classification).
   */
  function buildGuidedClassModTailPartLookup() {
    var byLower = Object.create(null);
    var getAll = typeof window.getAllParts === 'function' ? window.getAllParts : null;
    var all = getAll ? getAll() : [];
    if (!Array.isArray(all)) return byLower;
    for (var i = 0; i < all.length; i++) {
      var p = all[i];
      if (!p) continue;
      var raw = String((p.code || p.spawnCode || p.importCode || '') || '').trim();
      if (!raw) continue;
      var k = guidedTailNormSpawnKey(raw);
      if (k) byLower[k] = p;
      var ir = String((p.idRaw || p.idraw || '') || '').trim().replace(/\s+/g, '');
      if (/^\d+:\d+$/.test(ir)) {
        var ps = ir.split(':');
        var fk = Number(ps[0]);
        var ik = Number(ps[1]);
        if (Number.isFinite(fk) && Number.isFinite(ik)) {
          byLower[('{' + fk + ':' + ik + '}').toLowerCase()] = p;
        }
      }
    }
    return byLower;
  }

  function findGuidedClassModPartForTailToken(tok, baseFam, byLower, allParts) {
    var s = String(tok || '').trim();
    var sLow = s.toLowerCase();
    if (byLower[sLow]) return byLower[sLow];
    if (s.length >= 2 && s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') {
      var inner = guidedTailNormSpawnKey(s);
      if (inner && byLower[inner]) return byLower[inner];
    }
    var mq = s.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
    if (mq) {
      var key = ('{' + Number(mq[1]) + ':' + Number(mq[2]) + '}').toLowerCase();
      if (byLower[key]) return byLower[key];
    }
    var mb = s.match(/^\{\s*(\d+)\s*:\s*\[([^\]]+)\]\s*\}$/);
    if (mb) {
      var nums = String(mb[2] || '').match(/\d+/g);
      if (nums && nums.length) {
        var fk = Number(mb[1]);
        var fid = Number(nums[0]);
        var kb = ('{' + fk + ':' + fid + '}').toLowerCase();
        if (byLower[kb]) return byLower[kb];
      }
    }
    var mbare = s.match(/^\{\s*(\d+)\s*\}$/);
    if (mbare && Number.isFinite(baseFam)) {
      var bid = Number(mbare[1]);
      if (!Array.isArray(allParts)) return null;
      for (var j = 0; j < allParts.length; j++) {
        var q = allParts[j];
        if (!q) continue;
        var pf = guidedTailFamilyFromPart(q);
        var qi = guidedTailNumericItemIdFromPart(q);
        if (pf === baseFam && qi === bid) return q;
      }
      var kb2 = ('{' + baseFam + ':' + bid + '}').toLowerCase();
      if (byLower[kb2]) return byLower[kb2];
    }
    return null;
  }

  /** Dataset-derived bucket rank; lower runs earlier in tail (aligned with Simple `cmEmitOrder`). */
  function rankFromClassModPartOrUnknown(p) {
    if (!p) return null;
    var pt = String((p.partType || p.kind || '') || '').trim().toLowerCase();
    var raw = String((p.code || p.spawnCode || '') || '').trim();
    var codeL = guidedTailNormSpawnKey(raw);
    if (guidedPartIsFirmware(p)) return 580;
    // Keep element before 234-family perk runs so firmware can pack with them at the end.
    if (pt === 'element') return 250;
    if (pt === 'skill') return 500;
    if (pt === 'perk') {
      if (codeL.indexOf('statspecial') !== -1) return 200;
      if (/(^|[._])stat2([._]|$)/.test(codeL)) return 400;
      return 300;
    }
    if (pt === 'rarity' || pt === 'item card') return 200;
    if (pt.indexOf('name+skin') === 0) return 200;
    if (pt === 'body') return 200;
    return null;
  }

  /**
   * Canonical Class Mod tail — Universal → Secondary → Perks (skills) → Element → Firmware — regardless of Add click order.
   * Runs before `compressConsecutiveFamilyRefs` so same-family runs pack correctly within each bucket.
   */
  function reorderClassModGuidedTail(tokens, baseFam) {
    var src = Array.isArray(tokens) ? tokens : [];
    if (!src.length) return src;
    var bf = Number(baseFam);
    var getAll = typeof window.getAllParts === 'function' ? window.getAllParts : null;
    var allParts = getAll ? getAll() : [];
    var byLower = buildGuidedClassModTailPartLookup();
    var decorated = [];
    for (var i = 0; i < src.length; i++) {
      var tok = src[i];
      var s = String(tok || '').trim();
      var rank = 200;
      if (!s) continue;

      if (typeof window.isSkinTokenCandidate === 'function') {
        try {
          if (window.isSkinTokenCandidate(tok)) rank = 100;
        } catch (_) {}
      }
      if (rank === 200 && s.indexOf('|') !== -1 && /["']?\s*c\s*["']?\s*,\s*\d+/i.test(s)) {
        rank = 900;
      }

      if (rank === 200 && ELEMENTS && ELEMENTS.length) {
        var sl = s.toLowerCase();
        for (var ei = 0; ei < ELEMENTS.length; ei++) {
          var ec = String(ELEMENTS[ei] && ELEMENTS[ei].code || '').trim().toLowerCase();
          if (ec && sl === ec) {
            rank = 250;
            break;
          }
        }
      }

      if (rank === 200) {
        var pr = findGuidedClassModPartForTailToken(tok, bf, byLower, allParts);
        var rr = rankFromClassModPartOrUnknown(pr);
        if (rr != null) rank = rr;
      }

      decorated.push({ tok: tok, rank: rank, idx: i });
    }
    decorated.sort(function (a, b) {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.idx - b.idx;
    });
    var out = [];
    for (var k = 0; k < decorated.length; k++) out.push(decorated[k].tok);
    return out;
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
    if (baseFamily == null) return tokens.join(' ');
    var norm = null;
    if (window.normalizeIdTokensForBaseFamily) {
      try { norm = window.normalizeIdTokensForBaseFamily(tokens, baseFamily); } catch (_) { norm = null; }
    }
    if (!Array.isArray(norm)) norm = normalizeGuidedIdTokensLocal(tokens, baseFamily);

    var guidedCm = false;
    try {
      var elItCm = document.getElementById('ccGuidedItemType');
      guidedCm = !!(elItCm && /^class\s*mod$/i.test(String(elItCm.value || '').trim()));
    } catch (_) {}

    if (Array.isArray(norm) && guidedCm) {
      try { norm = reorderClassModGuidedTail(norm, baseFamily); } catch (_) {}
    }

    if (Array.isArray(norm) && typeof window.compressConsecutiveFamilyRefs === 'function') {
      var skipCompress = false;
      try {
        var elItSkip = document.getElementById('ccGuidedItemType');
        var itSkip = elItSkip ? String(elItSkip.value || '').trim().toLowerCase() : '';
        skipCompress = (itSkip === 'shield' || itSkip === 'repkit');
      } catch (_) {}
      if (!skipCompress) {
        try {
          var gDesSkip = byId('guidedOutputDeserialized');
          if (gDesSkip && gDesSkip.__ccUserTailEdit && norm.length > 48) skipCompress = true;
        } catch (_) {}
      }
      if (!skipCompress) {
        try { norm = window.compressConsecutiveFamilyRefs(norm); } catch (_) {}
      }
    }
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

  /** Helper to unlock output generation after an import, allowing subsequent interactive edits. */
  function clearGuidedImportLock() {
    if (window.__CC_IMPORT_IN_PROGRESS) return;
    forceClearImportLockForUserEdit();
  }

  /** User edits (+/− inspector, append) must always win over imported-output pins. */
  function forceClearImportLockForUserEdit() {
    try {
      window.__LOCK_IMPORTED_OUTPUT = false;
      window.__LAST_IMPORTED_DESERIALIZED = null;
      var gDes = byId('guidedOutputDeserialized');
      var gSer = byId('guidedOutputSerial');
      var outCode = byId('outCode');
      if (gDes) {
        gDes.__ccImportedValue = null;
        if (String(gDes.value || '').trim().indexOf('||') >= 0) gDes.__ccUserTailEdit = true;
      }
      if (gSer) gSer.__ccImportedValue = null;
      if (outCode) outCode.__ccImportedValue = null;
    } catch (_) {}
  }
  window.clearGuidedImportLock = clearGuidedImportLock;

  /** Guided output / import tail is the live edit target — not Simple `outCode` after a guided import. */
  function shouldEditGuidedTailDirectly() {
    try {
      if (window.__CC_LAST_CODE_TARGET === 'guided') return true;
    } catch (_) {}
    var gDes = byId('guidedOutputDeserialized');
    var gd = gDes && String(gDes.value || '').trim();
    if (gd && gd.indexOf('||') >= 0) return true;
    if (gDes && (gDes.__ccImportedValue || gDes.__ccUserTailEdit) && gd) return true;
    var gi = byId('ccGuidedItemType');
    if (!gi || !readSelectValue(gi)) return false;
    var out = getActiveTailOutputEl();
    if (!out) return false;
    var v = String(out.value || '').trim();
    return v.indexOf('||') >= 0 || (v.indexOf('{') >= 0 && v.length > 8);
  }

  function guidedHasLiveTailSerial() {
    var gDes = byId('guidedOutputDeserialized');
    var gd = gDes && String(gDes.value || '').trim();
    return !!(gd && gd.indexOf('||') >= 0);
  }
  window.__ccGuidedHasLiveTailSerial = guidedHasLiveTailSerial;

  function syncGuidedFloatingOutputFromDeser() {
    try { window.__CC_LAST_CODE_TARGET = 'guided'; } catch (_) {}
    var gDes = byId('guidedOutputDeserialized');
    var v = gDes ? String(gDes.value || '').trim() : '';
    if (!v) return;
    var outCode = byId('outCode');
    if (outCode) outCode.value = v;
    var imp = byId('importBox');
    if (imp && String(imp.value || '').trim() === v) { /* already synced */ }
    else if (imp && !String(imp.value || '').trim()) imp.value = v;
    var floatEl = byId('floating-output-code');
    if (floatEl && document.activeElement !== floatEl) floatEl.value = v;
    try { if (typeof window.__ccSyncCodeCharCounts === 'function') window.__ccSyncCodeCharCounts(); } catch (_) {}
    try {
      if (typeof window.syncFloatingOutput === 'function') {
        setTimeout(function () {
          try { window.syncFloatingOutput(true); } catch (_) {}
        }, 0);
      }
    } catch (_) {}
  }
  window.syncGuidedFloatingOutputFromDeser = syncGuidedFloatingOutputFromDeser;

  var __ccGuidedTailEditFxTimer = 0;
  /** Keep Add/+/− snappy on long imported serials — mirror text now, defer heavy UI refresh. */
  function deferGuidedTailEditSideEffects() {
    try { if (typeof window.__ipiInvalidateSerialCache === 'function') window.__ipiInvalidateSerialCache(); } catch (_) {}
    syncGuidedFloatingOutputFromDeser();
    if (__ccGuidedTailEditFxTimer) clearTimeout(__ccGuidedTailEditFxTimer);
    __ccGuidedTailEditFxTimer = setTimeout(function () {
      __ccGuidedTailEditFxTimer = 0;
      try { if (window.refreshGuidedOutputPreview) window.refreshGuidedOutputPreview(); } catch (_) {}
      try { if (typeof window.refreshBuildStatsCore === 'function') window.refreshBuildStatsCore(); } catch (_) {}
      try { if (typeof window.refreshImportedInspector === 'function') window.refreshImportedInspector(); } catch (_) {}
    }, 150);
  }
  window.deferGuidedTailEditSideEffects = deferGuidedTailEditSideEffects;

  function findGuidedSlotMetaBySelectId(selectId) {
    if (!selectId) return null;
    var weaponSlots = getGuidedWeaponSlots();
    for (var wi = 0; wi < weaponSlots.length; wi++) {
      if (weaponSlots[wi].selectId === selectId) return weaponSlots[wi];
    }
    var cats = Object.keys(GEAR_SLOTS_BY_CATEGORY);
    for (var ci = 0; ci < cats.length; ci++) {
      var gearSlots = GEAR_SLOTS_BY_CATEGORY[cats[ci]];
      for (var gi = 0; gi < gearSlots.length; gi++) {
        if (gearSlots[gi].selectId === selectId) return gearSlots[gi];
      }
    }
    return null;
  }

  var GUIDED_STACK_SLOT_KEYS = {
    bodyAcc: 1, barrelAcc: 1, magazineAcc: 1, scopeAcc: 1, licensed: 1, statMod: 1,
    additionalParts: 1, legendary: 1, augment: 1, perk: 1, universal: 1, secondary: 1,
    other: 1, grenadeKitStats: 1, stats: 1, perkResist: 1, perkImmunity: 1, perkNova: 1,
    perkSplat: 1, specialPlaceholder: 1, primary246: 1, secondary246: 1, armor237: 1, energy248: 1,
    special: 1
  };

  function slotWantsSingleReplace(slotMeta, replaceRarity) {
    if (!slotMeta) return !!replaceRarity;
    if (replaceRarity || slotMeta.key === 'rarity') return true;
    if (GUIDED_STACK_SLOT_KEYS[slotMeta.key]) return false;
    if (slotMeta.key === 'element' && slotMeta.selectId === 'ccElementPartSelect') return false;
    if (slotMeta.multi) return false;
    return !!(String(slotMeta.partType || '').trim() || slotMeta.key === 'body' || slotMeta.key === 'barrel' || slotMeta.key === 'mag');
  }

  function getBaseFamilyFromSerial(serial) {
    var s = String(serial || '').trim();
    var dbl = s.indexOf('||');
    var head = dbl >= 0 ? s.slice(0, dbl).trim() : s;
    var m = head.match(/^\s*(\d+)\s*[,\|]/);
    return m ? Number(m[1]) : null;
  }

  function resolveGuidedTailTokenPart(tok, baseFamilyId) {
    if (typeof window.tryResolveToken !== 'function') return null;
    try {
      var p = window.tryResolveToken(tok);
      if (!p && baseFamilyId != null) {
        var bare = String(tok || '').trim().match(/^\{\s*(\d+)\s*\}$/);
        if (bare) p = window.tryResolveToken('{' + baseFamilyId + ':' + bare[1] + '}');
      }
      return p || null;
    } catch (_) {
      return null;
    }
  }

  function tokenMatchesGuidedSlotPartType(tok, slotMeta, baseFamilyId) {
    if (!slotMeta) return false;
    if (slotMeta.key === 'rarity') return isRarityToken(tok);
    if (guidedSlotIsFirmwareSlot(slotMeta)) {
      var fwPart = resolveGuidedTailTokenPart(tok, baseFamilyId);
      if (!fwPart || !guidedPartIsFirmware(fwPart)) {
        var rawFw = String(tok || '').trim().replace(/^"+|"+$/g, '');
        if (!/part_firmware|\.part_firmware/i.test(rawFw)) return false;
      } else if (slotMeta.key === 'firmware246') {
        var fwFam = fwPart.family != null ? Number(fwPart.family) : (fwPart.familyId != null ? Number(fwPart.familyId) : NaN);
        if (Number(fwFam) !== 246) return false;
      }
      return true;
    }
    var want = String(slotMeta.partType || '').trim();
    if (!want) return false;
    var p = resolveGuidedTailTokenPart(tok, baseFamilyId);
    if (!p) return false;
    return String(p.partType || '').trim().toLowerCase() === want.toLowerCase();
  }

  function collectSlotReplaceTokenKeys(slotMeta, serialBefore) {
    var keys = [];
    if (!slotMeta) return keys;
    var st = getGuidedBuilderStateObj();
    var slotVal = st && st.slots && st.slots[slotMeta.key];
    if (slotMeta.key && slotMeta.key.indexOf('aug') === 0 && st && st.slots && Array.isArray(st.slots.augment)) {
      var augIdx = parseInt(String(slotMeta.key).replace('aug', ''), 10) - 1;
      if (augIdx >= 0 && augIdx < st.slots.augment.length) slotVal = st.slots.augment[augIdx];
    }
    if (Array.isArray(slotVal)) {
      for (var ai = 0; ai < slotVal.length; ai++) {
        var ap = slotVal[ai];
        if (ap && typeof window.tokenForPart === 'function') {
          try {
            var apt = window.tokenForPart(ap);
            if (apt) keys.push(normTailTokenKey(apt));
          } catch (_) {}
        }
      }
    } else {
      var part = slotVal;
      if (part && typeof window.tokenForPart === 'function') {
        try {
          var pt = window.tokenForPart(part);
          if (pt) keys.push(normTailTokenKey(pt));
        } catch (_) {}
      }
    }
    if (!keys.length && serialBefore) {
      var baseFam = getBaseFamilyFromSerial(serialBefore);
      var tailToks = extractGuidedTailTokens(serialBefore);
      for (var ti = 0; ti < tailToks.length; ti++) {
        if (tokenMatchesGuidedSlotPartType(tailToks[ti], slotMeta, baseFam)) {
          keys.push(normTailTokenKey(tailToks[ti]));
        }
      }
    }
    return keys;
  }

  function filterTokensForGuidedSlotReplace(tokens, slotMeta, replaceRarity, newToken, serialBefore) {
    if (!slotWantsSingleReplace(slotMeta, replaceRarity)) return tokens;
    if (slotMeta && GUIDED_STACK_SLOT_KEYS[slotMeta.key]) return tokens;
    var baseFam = getBaseFamilyFromSerial(serialBefore);
    var newKey = normTailTokenKey(newToken);
    var prevKeys = collectSlotReplaceTokenKeys(slotMeta, serialBefore);
    return tokens.filter(function (t) {
      var tk = normTailTokenKey(t);
      if (replaceRarity || (slotMeta && slotMeta.key === 'rarity')) return !isRarityToken(t);
      for (var i = 0; i < prevKeys.length; i++) {
        if (tk === prevKeys[i]) return false;
      }
      return !tokenMatchesGuidedSlotPartType(t, slotMeta, baseFam);
    });
  }

  function syncGuidedSlotStateAfterTailEdit(slotMeta, newTokenRaw) {
    if (!slotMeta || typeof window.tryResolveToken !== 'function') return;
    var part = null;
    try { part = window.tryResolveToken(String(newTokenRaw || '').trim()); } catch (_) {}
    if (!part) return;
    var st = getGuidedBuilderStateObj();
    if (!st) return;
    if (!st.slots || typeof st.slots !== 'object') st.slots = {};
    if (GUIDED_STACK_SLOT_KEYS[slotMeta.key]) {
      var list = Array.isArray(st.slots[slotMeta.key]) ? st.slots[slotMeta.key].slice() : (st.slots[slotMeta.key] ? [st.slots[slotMeta.key]] : []);
      list.push(part);
      st.slots[slotMeta.key] = list;
    } else {
      st.slots[slotMeta.key] = part;
    }
  }

  function appendToOutCode(token, forceTarget, replaceRarity, slotMeta) {
    if (!forceTarget && !shouldEditGuidedTailDirectly() && typeof window.stxAppendPresetToActiveBuilder === 'function') {
      if (window.stxAppendPresetToActiveBuilder(token, { quantity: 1 })) return;
    }
    var out = forceTarget;
    if (!out) {
      out = shouldEditGuidedTailDirectly()
        ? (byId('guidedOutputDeserialized') || getActiveTailOutputEl())
        : getActiveTailOutputEl();
    }
    if (!out) return;
    forceClearImportLockForUserEdit();
    var serialBefore = (out.value || '').trim();
    var serial = serialBefore;
    var dbl = serial.indexOf('||');
    var prefixStr = dbl >= 0 ? serial.slice(0, dbl).trim() : '';
    var tail = dbl >= 0 ? serial.slice(dbl + 2).trim() : '';
    var guidedItem = byId('ccGuidedItemType');
    var isGuided = (guidedItem && readSelectValue(guidedItem));
    if (isGuided && !prefixStr) {
      prefixStr = computeGuidedPrefixSafe();
      if (prefixStr) {
        prefixStr = prefixStr.trim();
        serial = (prefixStr.indexOf('||') >= 0) ? (prefixStr + ' ' + tail) : (prefixStr + ' || ' + tail);
        dbl = serial.indexOf('||');
      }
    }
    var tokens = (tail.match(/\|\s*["']?c["']?\s*,\s*\d+\s*\||\{[^}]*(?:\[[^\]]*\])?[^}]*\}|"[^\"]+"|\S+/g) || []).filter(function (t) {
      var s = String(t || '').trim();
      return s && s !== '|' && s !== '||';
    });
    if (!slotMeta && replaceRarity) {
      tokens = tokens.filter(function (t) { return !isRarityToken(t); });
    }
    var newTokenRaw = String(token || '').trim();
    tokens = filterTokensForGuidedSlotReplace(tokens, slotMeta, replaceRarity, newTokenRaw, serialBefore);

    var skinTokens = [];
    var camoTokens = [];
    var otherTokens = [];
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (String(t).indexOf('|') >= 0 && String(t).indexOf('c') >= 0) {
        camoTokens.push(t);
      } else if (typeof window.isSkinTokenCandidate === 'function' && window.isSkinTokenCandidate(t)) {
        skinTokens.push(t);
      } else {
        otherTokens.push(t);
      }
    }

    var newToken = newTokenRaw.indexOf('{') === 0 ? newTokenRaw : (newTokenRaw.indexOf('"') >= 0 ? newTokenRaw : '"' + newTokenRaw + '"');

    if (String(newToken).indexOf('|') >= 0 && String(newToken).indexOf('c') >= 0) {
      camoTokens.push(newToken);
    } else if (typeof window.isSkinTokenCandidate === 'function' && window.isSkinTokenCandidate(newToken)) {
      skinTokens.push(newToken);
    } else {
      otherTokens.push(newToken);
    }

    tokens = skinTokens.concat(otherTokens).concat(camoTokens);

    var newTail = normalizeGuidedTail(prefixStr, tokens);
    if (newTail && !/\|\s*$/.test(newTail.trim())) newTail = newTail.trim() + '|';
    var newSerial = dbl >= 0 ? serial.slice(0, dbl + 2).trim() + (newTail ? ' ' + newTail : '') : (serial ? (serial.indexOf('||') >= 0 ? serial : serial + ' ||') + ' ' + newTail : (prefixStr ? (prefixStr.indexOf('||') >= 0 ? prefixStr.trim() + ' ' + newTail : prefixStr.trim() + ' || ' + newTail) : '|| ' + newTail));
    syncTailOutputMirrors(serialBefore, newSerial);
    out.value = newSerial;
    try {
      window.__CC_LAST_CODE_TARGET = 'guided';
    } catch (_) {}
    if (slotMeta) syncGuidedSlotStateAfterTailEdit(slotMeta, newTokenRaw);
    deferGuidedTailEditSideEffects();
  }
  /** Tools / rebuild quick-add paths call `window.appendToOutCode`; delegate here when target is Guided output. */
  try { window.appendToOutCodeGuided = appendToOutCode; } catch (_) {}

  /** Match tail tokens for grouping / remove-one (family:id vs quoted code). */
  function normTailTokenKey(t) {
    var u = String(t || '').trim().replace(/^"+|"+$/g, '');
    var bk = u.match(/^\{\s*(\d+)\s*:\s*\[([^\]]+)\]\s*\}$/);
    if (bk) return bk[1] + ':[' + bk[2].trim().replace(/\s+/g, ' ') + ']';
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
    var ctx = getInspectorTailEditContext();
    var out = ctx && ctx.el;
    if (!out || canonicalToken == null || canonicalToken === '') return false;
    forceClearImportLockForUserEdit();
    var d = Number(delta);
    if (!Number.isFinite(d) || d === 0) return false;
    var serialBefore = String((ctx && ctx.serial) || (out.value || '')).trim();
    if (!serialBefore) return false;
    var serial = serialBefore;
    var dbl = serial.indexOf('||');
    var prefixStr = dbl >= 0 ? serial.slice(0, dbl).trim() : '';
    var tail = dbl >= 0 ? serial.slice(dbl + 2).trim() : '';
    try {
      if (typeof window.__ccNormalizeTruncatedTailBracketTokens === 'function') {
        tail = window.__ccNormalizeTruncatedTailBracketTokens(tail);
      }
    } catch (_) {}
    var guidedItem = byId('ccGuidedItemType');
    var isGuided = (guidedItem && (guidedItem.value || '').trim());
    if (isGuided && !prefixStr) {
      prefixStr = computeGuidedPrefixSafe();
      if (prefixStr) {
        prefixStr = prefixStr.trim();
        serial = (prefixStr.indexOf('||') >= 0) ? (prefixStr + ' ' + tail) : (prefixStr + ' || ' + tail);
        dbl = serial.indexOf('||');
      }
    }
    // Enhanced regex to handle {14:[1 1 1]} correctly even with internal spaces
    var tokens = (tail.match(/\|\s*["']?c["']?\s*,\s*\d+\s*\||\{[^}]*(?:\[[^\]]*\])?[^}]*\}|"[^\"]+"|\S+/g) || []).filter(function (t) {
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
    if (newTail && !/\|\s*$/.test(newTail.trim())) newTail = newTail.trim() + '|';
    var newSerial = dbl >= 0 ? serial.slice(0, dbl + 2).trim() + (newTail ? ' ' + newTail : '') : (serial ? (serial.indexOf('||') >= 0 ? serial : serial + ' ||') + ' ' + newTail : (prefixStr ? (prefixStr.indexOf('||') >= 0 ? prefixStr.trim() + ' ' + newTail : prefixStr.trim() + ' || ' + newTail) : '|| ' + newTail));
    writeInspectorTailSerialToOutputs(newSerial, serialBefore, out, ctx.target);
    syncTailOutputMirrors(serialBefore, newSerial);
    deferGuidedTailEditSideEffects();
    return true;
  }

  window.__ccGetGuidedOutputEl = getGuidedOutputEl;
  window.__ccMutateSerialTailDelta = mutateSerialTailDelta;

  function setGuidedSelectByToken(selectId, token) {
    var sel = byId(selectId);
    if (!sel || !token) return;
    var want = String(token).trim();
    sel.__ccPreferredToken = want;
    var wantKey = normTailTokenKey(want);
    
    // Also consider the "short" key if it's a {fam:id} token matching the current base family
    var baseFamilyId = null;
    try {
      var st = window.state || window.__STX_SIMPLE_STATE;
      if (st && Number.isFinite(st.familyId)) {
        baseFamilyId = Number(st.familyId);
      } else if (st && st.slots && st.slots.rarity) {
        baseFamilyId = Number(st.slots.rarity.family ?? st.slots.rarity.familyId);
      }
      if (!Number.isFinite(baseFamilyId) && st && st.mainPart) {
        baseFamilyId = Number(st.mainPart.family ?? st.mainPart.familyId);
      }
    } catch(_) {}
    
    var shortWantKey = null;
    if (wantKey.indexOf('q:') === 0 && Number.isFinite(baseFamilyId)) {
      var parts = wantKey.split(':'); // ['q', 'fam', 'id']
      if (Number(parts[1]) === baseFamilyId) {
        shortWantKey = 's:' + parts[2];
      }
    } else if (wantKey.indexOf('s:') === 0 && Number.isFinite(baseFamilyId)) {
      // If we have a singular token {59} and know the family is 25, then qualified is {25:59}
      var parts = wantKey.split(':'); // ['s', 'id']
      shortWantKey = 'q:' + baseFamilyId + ':' + parts[1];
    }

    var found = false;
    for (var i = 0; i < sel.options.length; i++) {
      var ov = String(sel.options[i].value || '').trim();
      if (!ov) continue;
      var ovKey = normTailTokenKey(ov);
      if (ov === want || ovKey === wantKey || (shortWantKey && ovKey === shortWantKey)) {
        sel.value = ov;
        found = true;
        break;
      }
    }
    if (!found && want) {
      var keep = new Option(preservedSelectLabelForToken(sel, want), want);
      keep.setAttribute('data-guided-preserved', '1');
      sel.appendChild(keep);
      sel.value = want;
      found = true;
    }
    if (found) {
      syncGuidedCustomSelectIfWrapped(sel);
      try { updateGuidedSelectPreview(sel); } catch (_) {}
    }
  }

  /** After guided-only / heavy import: match tail tokens to slot dropdowns (state.slots may be empty). */
  function hydrateGuidedSlotSelectsFromSerial(serial) {
    var s = String(serial || '').trim();
    if (!s || s.indexOf('||') < 0) return false;
    var baseFam = getBaseFamilyFromSerial(s);
    var tokens = extractGuidedTailTokens(s);
    if (!tokens.length) return false;

    var st = getGuidedBuilderStateObj();
    var cat = '';
    if (st && st.itemType) cat = String(st.itemType).trim();
    var gi = byId('ccGuidedItemType');
    if (!cat && gi) cat = readSelectValue(gi);
    if (!cat) cat = 'Weapon';

    var slots = null;
    if (cat === 'Weapon' || /assault rifle|pistol|shotgun|smg|sniper/i.test(cat)) {
      slots = getGuidedWeaponSlots();
    } else {
      var gearCat = normalizeGuidedItemTypeForGear(cat);
      if (GEAR_SLOTS_BY_CATEGORY && GEAR_SLOTS_BY_CATEGORY[gearCat]) slots = GEAR_SLOTS_BY_CATEGORY[gearCat];
    }
    if (!slots || !slots.length) return false;

    window.__ccIsHydrating = true;
    try {
      if (typeof refreshWeaponDropdowns === 'function' && (cat === 'Weapon' || /weapon/i.test(cat))) {
        refreshWeaponDropdowns(true);
      }
      if (typeof refreshGearDropdowns === 'function' && cat !== 'Weapon') {
        refreshGearDropdowns(normalizeGuidedItemTypeForGear(cat));
      }

      for (var si = 0; si < slots.length; si++) {
        var slot = slots[si];
        if (!slot || !slot.selectId) continue;
        if (slot.key === 'element') continue;

        var picked = null;
        if (slot.key === 'rarity') {
          for (var ri = 0; ri < tokens.length; ri++) {
            if (isRarityToken(tokens[ri])) { picked = tokens[ri]; break; }
          }
        } else if (GUIDED_STACK_SLOT_KEYS[slot.key] || slot.multi) {
          for (var ti = tokens.length - 1; ti >= 0; ti--) {
            if (tokenMatchesGuidedSlotPartType(tokens[ti], slot, baseFam)) {
              picked = tokens[ti];
              break;
            }
          }
        } else {
          for (var ui = 0; ui < tokens.length; ui++) {
            if (tokenMatchesGuidedSlotPartType(tokens[ui], slot, baseFam)) {
              picked = tokens[ui];
              break;
            }
          }
        }
        if (picked) setGuidedSelectByToken(slot.selectId, picked);
      }
      return true;
    } catch (_) {
      return false;
    } finally {
      window.__ccIsHydrating = false;
    }
  }
  window.__ccHydrateGuidedSlotSelectsFromSerial = hydrateGuidedSlotSelectsFromSerial;

  function hydrateGuidedSlotsFromSimpleState() {
    window.__ccIsHydrating = true;
    try {
      var st = window.state || window.__STX_SIMPLE_STATE;
      if (!st || typeof st !== 'object') {
        window.__ccIsHydrating = false;
        return false;
      }
      var gi = byId('ccGuidedItemType');
      var gm = byId('ccGuidedManufacturer');
      var gw = byId('ccGuidedWeaponType');
      var gl = byId('ccGuidedLevel');

      // Hydrate Top selectors
      if (gi && st.itemType) { 
        var wantIt = String(st.itemType);
        // Map to Guided values
        if (wantIt === 'Weapon' || (typeof STX_RARITY_WEAPON_ITEM_TYPES !== 'undefined' && STX_RARITY_WEAPON_ITEM_TYPES.has(wantIt))) wantIt = 'Weapon';
        if (wantIt === 'Heavy' || wantIt === 'Heavy Weapon') wantIt = 'Heavy Weapon';

        if (gi.value !== wantIt) {
          gi.value = wantIt; 
          syncGuidedCustomSelectIfWrapped(gi); 
          if (typeof syncGuidedVisibility === 'function') syncGuidedVisibility();
        }
      }
      
      // Load manufacturers for this item type
      if (typeof loadGuidedManufacturers === 'function') loadGuidedManufacturers();
      
      if (gm && st.manufacturer) { 
        var wantMan = String(st.manufacturer);
        gm.__ccPreferredManufacturer = wantMan;
        // If the manufacturer isn't in the list yet, we might need to force it or re-load
        if (gm.value !== wantMan) {
          gm.value = wantMan;
          // If setting value failed (not in list), try to add it temporarily or wait
          if (gm.value !== wantMan && wantMan) {
             var opt = new Option(wantMan, wantMan);
             gm.appendChild(opt);
             gm.value = wantMan;
          }
          syncGuidedCustomSelectIfWrapped(gm); 
        }
      }

      // Load weapon types for this manufacturer/item type
      if (typeof loadGuidedWeaponTypes === 'function') loadGuidedWeaponTypes();
      
      if (gw && st.weaponType) { 
        var wantWt = String(st.weaponType);
        if (gw.value !== wantWt) {
          gw.value = wantWt;
          if (gw.value !== wantWt && wantWt) {
             var opt = new Option(wantWt, wantWt);
             gw.appendChild(opt);
             gw.value = wantWt;
          }
          syncGuidedCustomSelectIfWrapped(gw); 
        }
      }
      if (gl && st.level) {
        if (gl.value !== String(st.level)) {
          gl.value = String(st.level);
        }
      }

      // Sync state and visibility
      if (typeof window.syncGuidedToSimple === 'function') window.syncGuidedToSimple();
      if (typeof syncGuidedVisibility === 'function') syncGuidedVisibility();
      if (typeof refreshWeaponDropdowns === 'function') refreshWeaponDropdowns();
      if (typeof refreshGearDropdowns === 'function') {
        var it = String(st.itemType || '');
        if (it && it !== 'Weapon') refreshGearDropdowns(normalizeGuidedItemTypeForGear(it));
      }
    } catch (e) {
       console.error('Hydration failed (top level):', e);
    }

    try {
      var st = window.state || window.__STX_SIMPLE_STATE;
      var cat = String(st.itemType || '').trim();
      var slots = null;
      if (cat === 'Weapon') slots = getGuidedWeaponSlots();
      else if (cat === 'Heavy Weapon' && GEAR_SLOTS_BY_CATEGORY) slots = GEAR_SLOTS_BY_CATEGORY['Heavy Weapon'];
      else if (GEAR_SLOTS_BY_CATEGORY && GEAR_SLOTS_BY_CATEGORY[cat]) slots = GEAR_SLOTS_BY_CATEGORY[cat];
      
      if (!slots || !slots.length) return true;

      for (var i = 0; i < slots.length; i++) {
        var slot = slots[i];
        if (!slot || !slot.selectId) continue;
        var picked = null;
        
        if (slot.key === 'rarity') {
          var rp = st.slots && st.slots.rarity;
          if (!rp && st.mainPart && String(st.mainPart.partType || '').toLowerCase() === 'rarity') rp = st.mainPart;
          var part = rp;
          if (part && typeof window.tokenForPart === 'function') {
            try { picked = window.tokenForPart(part); } catch (_) { picked = null; }
          }
          if (!picked && part) {
            var rraw = String((part.idRaw || part.idraw || '')).trim();
            if (/^\d+\s*:\s*\d+$/.test(rraw)) picked = '{' + rraw.replace(/\s+/g, '') + '}';
          }
          if (!picked && part) picked = String((part.code || part.spawnCode || '')).trim();
          if (picked) setGuidedSelectByToken(slot.selectId, picked);
          continue;
        }

        if (slot.key === 'element') {
          var ecode = '';
          if (st.primaryElement && Array.isArray(ELEMENTS)) {
            for (var ei = 0; ei < ELEMENTS.length; ei++) {
              if (ELEMENTS[ei] && ELEMENTS[ei].key === st.primaryElement) {
                ecode = String(ELEMENTS[ei].code || '').trim();
                break;
              }
            }
          }
          picked = ecode;
        } else {
          var slotVal = st.slots && st.slots[slot.key];
          // Fallback for Simple Builder's "augment" array -> Guided Builder's "aug1", "aug2", "aug3"
          if (!slotVal && slot.key && slot.key.indexOf('aug') === 0 && st.slots && Array.isArray(st.slots.augment)) {
            var augIdx = parseInt(slot.key.replace('aug', ''), 10) - 1;
            if (augIdx >= 0 && augIdx < st.slots.augment.length) {
              slotVal = st.slots.augment[augIdx];
            }
          }
          // Handle both single objects and arrays (some importers use arrays for slots)
          var part = Array.isArray(slotVal) ? slotVal[0] : slotVal;
          if (!part) continue;

          if (typeof window.tokenForPart === 'function') {
            try { picked = window.tokenForPart(part); } catch (_) { picked = null; }
          }
          if (!picked) {
            var raw = String((part.idRaw || part.idraw || '')).trim();
            if (/^\d+\s*:\s*\d+$/.test(raw)) picked = '{' + raw.replace(/\s+/g, '') + '}';
          }
          if (!picked) picked = String((part.code || part.spawnCode || '')).trim();
        }
        if (picked) setGuidedSelectByToken(slot.selectId, picked);
      }
      
      try { if (typeof window.refreshGuidedOutput === 'function') window.refreshGuidedOutput(); } catch (_) {}
      return true;
    } catch (_) {
      return false;
    } finally {
      window.__ccIsHydrating = false;
    }
  }
  window.__ccHydrateGuidedSlotsFromSimpleState = hydrateGuidedSlotsFromSimpleState;

  function addGunPart(selectId, replaceRarity) {
    var sel = byId(selectId);
    if (!sel) return;
    var tok = readGuidedSlotToken(sel);
    if (!tok) return;
    var slotMeta = findGuidedSlotMetaBySelectId(selectId);
    appendToOutCode(tok, null, !!replaceRarity, slotMeta);
  }

  function addElement() {
    var sel = byId('ccElementPartSelect');
    if (!sel) return;
    var code = readSelectValue(sel);
    if (!code) return;
    appendToOutCode(code);
    try {
      var st = window.state || window.__STX_SIMPLE_STATE;
      if (st && Array.isArray(ELEMENTS)) {
        var hit = null;
        for (var i = 0; i < ELEMENTS.length; i++) {
          if (ELEMENTS[i] && String(ELEMENTS[i].code || '').trim() === code) { hit = ELEMENTS[i]; break; }
        }
        if (hit && hit.key && hit.key !== 'None') {
          if (!st.primaryElement || st.primaryElement === 'None') st.primaryElement = hit.key;
          else {
            st.elementStack = Array.isArray(st.elementStack) ? st.elementStack : [];
            st.elementStack.push(hit.key);
          }
          if (typeof window.stxSyncDualElementMaliwanSwitch === 'function') window.stxSyncDualElementMaliwanSwitch();
        }
      }
    } catch (_e) {}
    try { if (typeof window.refreshBuilder === 'function') window.refreshBuilder(); } catch (_e2) {}
  }

  /** Direct pool for body accessory rows scoped to manufacturer + weapon type. */
  function guidedFilterBodyAccessoryParts(man, wt) {
    man = String(man || '').trim();
    wt = String(wt || '').trim();
    if (!man) return [];
    var out = [];
    var all = getAllParts();
    for (var i = 0; i < all.length; i++) {
      var p = all[i];
      if (!p) continue;
      if (String(p.partType || '').trim().toLowerCase() !== 'body accessory') continue;
      if (String(p.category || '').trim().toLowerCase() !== 'weapon') continue;
      var x = guidedSpawnCodeLo(p);
      if (wt && typeof window.stxWeaponRowMatchesSelectedManufacturer === 'function') {
        if (!window.stxWeaponRowMatchesSelectedManufacturer(x, man.toLowerCase(), wt)) continue;
      } else if (String(p.manufacturer || '').trim().toLowerCase() !== man.toLowerCase()) {
        continue;
      }
      if (wt) {
        var pwt = String(p.weaponType || p.itemType || '').trim().toLowerCase();
        var wwt = wt.toLowerCase();
        if (pwt && pwt !== wwt && pwt !== 'weapon') {
          if (!((pwt === 'sniper' && wwt === 'sniper rifle') || (pwt === 'sniper rifle' && wwt === 'sniper'))) continue;
        }
      }
      out.push(p);
    }
    return out;
  }

  /** Full legendary-perk universe for guided slot dropdowns (no manufacturer / weapon-type gate). */
  function guidedCollectAllLegendaryPerkParts(includeBarrels) {
    var all = getAllParts();
    if (typeof window.collectLegendaryPerkDropdownParts === 'function') {
      return window.collectLegendaryPerkDropdownParts(all, {
        includeBarrels: includeBarrels !== false,
        ignoreWeaponType: true
      });
    }
    return all.filter(function (p) {
      return p && /legendary\s*perk/i.test(String(p.partType || ''));
    });
  }

  /** Shared firmware chips (`part_firmware_*`) — universal pool; prefer 247/234/246 id rows for tokens. */
  function guidedCollectFirmwareParts() {
    var byStem = Object.create(null);
    var all = getAllParts();
    for (var i = 0; i < all.length; i++) {
      var p = all[i];
      if (!p || !guidedPartIsFirmware(p)) continue;
      var code = guidedSpawnCodeLo(p);
      var stemM = code.match(/part_firmware_([a-z0-9_]+)/);
      var stem = stemM ? stemM[1] : code;
      if (!stem) continue;
      var fam = p.family != null ? Number(p.family) : (p.familyId != null ? Number(p.familyId) : NaN);
      var score = 0;
      if (fam === 247) score = 100;
      else if (fam === 234) score = 90;
      else if (fam === 246) score = 80;
      else if (String(p.partType || '').trim().toLowerCase() === 'firmware') score += 5;
      var idRaw = String(p.idRaw || p.idraw || '').trim();
      if (/^\d+\s*:\s*\d+$/.test(idRaw.replace(/\s+/g, ' '))) score += 3;
      var prev = byStem[stem];
      if (!prev || score > prev.score) byStem[stem] = { p: p, score: score };
    }
    var out = [];
    for (var k in byStem) {
      if (Object.prototype.hasOwnProperty.call(byStem, k) && byStem[k]) out.push(byStem[k].p);
    }
    return out;
  }

  function refreshWeaponDropdowns(force) {
    var ctx = getGuidedFilterContext();
    var st = ctx;
    var it = String(st.itemType).toLowerCase();
    if (it === 'heavy') it = 'heavy weapon';
    if (it !== 'weapon' && it !== 'heavy weapon') return;
    var refreshKey = it + '|' + String(st.manufacturer || '') + '|' + String(st.weaponType || '') + '|' + String(getEffectiveManufacturerForFilter() || '');
    if (!force && refreshKey === __lastWeaponDropdownRefreshKey && window.__ccWeaponDropdownsHydrated) return;
    if (force || refreshKey !== __lastWeaponDropdownRefreshKey) {
      var clearSlots = getGuidedWeaponSlots();
      for (var ci = 0; ci < clearSlots.length; ci++) {
        var csel = byId(clearSlots[ci].selectId);
        if (csel) {
          try { delete csel.__lastPartsHash; } catch (_) {}
        }
      }
    }
    __lastWeaponDropdownRefreshKey = refreshKey;
    var man = getEffectiveManufacturerForFilter();
    var wt = String(st.weaponType || '').trim();
    var bodyMan = getSelectedItemManufacturerForBody();
    var cat = (it === 'heavy weapon') ? 'Heavy Weapon' : 'Weapon';
    var useSimpleFilter = typeof window.filterPartsForGuided === 'function';

    function filterGuidedWeaponSlotParts(slot, filteredIn, ctxMan, ctxWt) {
      var filtered = filteredIn;
      if (!filtered || !filtered.length) return filtered;
      var man = String(ctxMan || '').trim();
      var wt = String(ctxWt || '').trim();
      var c = guidedSpawnCodeLo;
      if (slot.key === 'body') {
        return filtered.filter(function (p) {
          var x = c(p);
          if (x.indexOf('part_body_bolt') !== -1 || x.indexOf('part_body_flap') !== -1 || x.indexOf('part_body_ele') !== -1) return false;
          if (man && wt && typeof window.stxIsWeaponNaturalBodyPoolRowCode === 'function') {
            return window.stxIsWeaponNaturalBodyPoolRowCode(x, man, wt);
          }
          if (man && typeof window.stxWeaponRowMatchesSelectedManufacturer === 'function') {
            return window.stxWeaponRowMatchesSelectedManufacturer(x, man.toLowerCase(), wt);
          }
          return /\.part_body(?:_|$|\d)/.test(x) && x.indexOf('part_body_ele') === -1;
        });
      }
      if (slot.key === 'bodyAcc') {
        var baseAcc = (filtered && filtered.length) ? filtered.slice() : guidedFilterBodyAccessoryParts(man, wt);
        if (!baseAcc.length) baseAcc = guidedFilterBodyAccessoryParts(man, wt);
        var seenBt = {};
        baseAcc.forEach(function (p) {
          var t = getPartToken(p);
          if (t) seenBt[t] = true;
        });
        if (useSimpleFilter && man) {
          try {
            var boltRows = window.filterPartsForGuided({
              category: 'Weapon',
              manufacturer: man,
              weaponType: wt,
              partType: 'Body',
              forceItemManufacturer: true
            }) || [];
            for (var bj = 0; bj < boltRows.length; bj++) {
              var pb = boltRows[bj];
              var xb = c(pb);
              if (xb.indexOf('part_body_bolt') === -1 && xb.indexOf('part_body_flap') === -1) continue;
              var tb = getPartToken(pb);
              if (tb && !seenBt[tb]) {
                seenBt[tb] = true;
                baseAcc.push(pb);
              }
            }
          } catch (_) {}
        }
        return baseAcc;
      }
      if (slot.key === 'bodyEle') return filtered.filter(function (p) { return c(p).indexOf('part_body_ele') !== -1; });
      if (slot.key === 'hyperionSecondaryAcc') return filtered.filter(function (p) {
        var x = c(p);
        var n = String((p && (p.name || p.legendaryName)) || '').toLowerCase();
        var pt = String((p && p.partType) || '').toLowerCase();
        return x.indexOf('part_shield') !== -1 || x.indexOf('amp') !== -1 || n.indexOf('amp') !== -1 || pt.indexOf('shield') !== -1;
      });
      if (slot.key === 'secondaryAmmo') return filtered.filter(function (p) { return c(p).indexOf('part_secondary_ammo') !== -1; });
      if (slot.key === 'licensed') return filtered.filter(function (p) { return c(p).indexOf('barrel_licensed') !== -1; });
      /* Main magazine: exclude magazine accessories and Borg specialty mags. */
      if (slot.key === 'mag') {
        var matchAcc = typeof window.magazineAccessoryCodeMatchLo === 'function' ? window.magazineAccessoryCodeMatchLo : null;
        return filtered.filter(function (p) {
          var x = c(p);
          if (matchAcc && matchAcc(x)) return false;
          if (/mag_05_borg|mag_.*_borg/i.test(x)) return false;
          return true;
        });
      }
      if (slot.key === 'magazineBorg') {
        return filtered.filter(function (p) { return /mag_05_borg|mag_.*_borg/i.test(c(p)); });
      }
      if (slot.key === 'magazineAcc') {
        var matchLo = typeof window.magazineAccessoryCodeMatchLo === 'function' ? window.magazineAccessoryCodeMatchLo : null;
        return filtered.filter(function (p) {
          var x = c(p);
          if (matchLo) return matchLo(x);
          return /mag_acc|magazine_acc/.test(x) || (x.indexOf('part_mag') !== -1 && x.indexOf('acc') !== -1);
        });
      }
      if (slot.key === 'pearlElem') {
        var matchElem = typeof window.weaponPearlElemPartMatch === 'function' ? window.weaponPearlElemPartMatch : null;
        return filtered.filter(function (p) { return matchElem ? matchElem(p) : false; });
      }
      if (slot.key === 'pearlStat') {
        var matchStat = typeof window.weaponPearlStatPartMatch === 'function' ? window.weaponPearlStatPartMatch : null;
        return filtered.filter(function (p) { return matchStat ? matchStat(p) : false; });
      }
      return filtered;
    }

    syncGuidedWeaponSlotGridVisibility();
    var weaponSlots = getGuidedWeaponSlots();
    var slotIdx = 0;

    function scheduleWeaponSlot(fn) {
      setTimeout(fn, 16);
    }

    function finishWeaponSlot() {
      if (slotIdx < weaponSlots.length) scheduleWeaponSlot(fillNextWeaponSlot);
      else {
        window.__ccWeaponDropdownsHydrated = true;
        try {
          if (typeof window.__ccBootGuidedSlotSelects === 'function') window.__ccBootGuidedSlotSelects();
        } catch (_) {}
        try { syncGuidedWeaponSlotGridVisibility(); } catch (_) {}
        try {
          if (typeof window.__stxEditorGuardWeaponDropdowns === 'function') {
            window.__stxEditorGuardWeaponDropdowns(getGuidedFilterContext());
          }
        } catch (_) {}
      }
    }

    function fillNextWeaponSlot() {
      if (slotIdx >= weaponSlots.length) return;
      var slot = weaponSlots[slotIdx++];
      var sel = byId(slot.selectId);
      if (!sel) {
        finishWeaponSlot();
        return;
      }
      if (slot.pearlElemPick) {
        var fpElem = [];
        var allPearlElem = getAllParts();
        var matchElemPick = typeof window.weaponPearlElemPartMatch === 'function' ? window.weaponPearlElemPartMatch : null;
        for (var pei = 0; pei < allPearlElem.length; pei++) {
          var pep = allPearlElem[pei];
          if (!pep) continue;
          if (matchElemPick && matchElemPick(pep)) fpElem.push(pep);
        }
        fillSelect(sel, fpElem, 80);
        finishWeaponSlot();
        return;
      }
      if (slot.pearlStatPick) {
        var fpStat = [];
        var allPearlStat = getAllParts();
        var matchStatPick = typeof window.weaponPearlStatPartMatch === 'function' ? window.weaponPearlStatPartMatch : null;
        for (var psi = 0; psi < allPearlStat.length; psi++) {
          var psp = allPearlStat[psi];
          if (!psp) continue;
          if (matchStatPick && matchStatPick(psp)) fpStat.push(psp);
        }
        fillSelect(sel, fpStat, 80);
        finishWeaponSlot();
        return;
      }
      if (slot.pearlPick) {
        var allPearl = getAllParts();
        var fp = [];
        for (var pi = 0; pi < allPearl.length; pi++) {
          var pp = allPearl[pi];
          if (!pp || String(pp.category || '').trim() !== 'Weapon') continue;
          if (/part_pearl/i.test(String(pp.code || ''))) fp.push(pp);
        }
        fillSelect(sel, fp, 80);
        finishWeaponSlot();
        return;
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
        if (typeof window.__ccWrapGuidedSelect === 'function') window.__ccWrapGuidedSelect(sel);
        else syncGuidedCustomSelectIfWrapped(sel);
        finishWeaponSlot();
        return;
      }
      var filtered;
      var slotMan = man || '';
      var isBodyFamily = (slot.key === 'body' || slot.key === 'bodyAcc');
      if (isBodyFamily) slotMan = getSelectedItemManufacturerForBody();
      // Legendary perk + firmware pools are shared — no manufacturer / weapon-type gate.
      if (slot.partType === 'Legendary Perks' || slot.key === 'legendary') slotMan = '';
      if (slot.partType === 'Firmware' || slot.key === 'firmware') slotMan = '';
      // Element pools are shared and should not be restricted by manufacturer toggle/filter.
      if (slot.key === 'bodyEle' || slot.key === 'secondaryEle') slotMan = '';
      var isLegSlot = (slot.partType === 'Legendary Perks' || slot.key === 'legendary');
      var isFwSlot = (slot.partType === 'Firmware' || slot.key === 'firmware');
      if (useSimpleFilter) {
        var wtForFilter = (it === 'heavy weapon') ? 'Heavy Weapon' : (wt || '');
        if (slot.key === 'bodyEle' || isLegSlot || isFwSlot) wtForFilter = '';
        var isAddSlot = (slot.key === 'additionalParts' || slot.customType === 'weaponAdditionalParts');
        filtered = window.filterPartsForGuided({
          category: 'Weapon',
          manufacturer: slotMan,
          weaponType: wtForFilter,
          partType: isAddSlot ? undefined : slot.partType,
          forceItemManufacturer: isBodyFamily,
          ignoreWeaponType: isAddSlot || isLegSlot || isFwSlot
        });
        if (isLegSlot) {
          var legPool = guidedCollectAllLegendaryPerkParts(true);
          if (legPool && legPool.length) filtered = legPool;
        } else if (isFwSlot) {
          var fwPool = guidedCollectFirmwareParts();
          if (fwPool && fwPool.length) filtered = fwPool;
        }
        if (!isLegSlot) filtered = filterGuidedWeaponSlotParts(slot, filtered, bodyMan, wt);
      } else {
        var all = getAllParts();
        if (isLegSlot) {
          filtered = guidedCollectAllLegendaryPerkParts(true);
        } else if (isFwSlot) {
          filtered = guidedCollectFirmwareParts();
        } else {
          filtered = filterByPartType(all, slot.partType, cat, slotMan, wt);
        }
        if (!isLegSlot) filtered = filterGuidedWeaponSlotParts(slot, filtered, bodyMan, wt);
      }
      if (filtered && filtered.length) {
        filtered = sortGuidedPartsByCode(filtered);
      }
      var maxItems = (slot.partType === 'Rarity') ? 600 : 1200;
      var emptyHintWeapon = '';
      if (slot.key === 'bodyEle') emptyHintWeapon = GUIDED_HINT_EMPTY_BODY_ELEMENT;
      else if (slot.key === 'secondaryEle') emptyHintWeapon = GUIDED_HINT_EMPTY_MALIWAN_SWITCH;
      if (slot.key === 'secondaryEle' && (!filtered || !filtered.length)) {
        fillElementPresetFallbackSelect(sel, '-- Secondary element --');
      } else if (isLegSlot && filtered && filtered.length) {
        fillSelectWithLegendaryGroups(sel, filtered);
      } else if (isFwSlot && filtered && filtered.length) {
        fillSelect(sel, filtered, maxItems, '', null);
      } else {
        var rarityFillOptsW = (slot.partType === 'Rarity')
          ? { groupByRarity: true, manufacturer: getEffectiveManufacturerForFilter() }
          : (slot.key === 'body' ? { logicalDedupe: true } : null);
        fillSelect(sel, filtered, maxItems, emptyHintWeapon, rarityFillOptsW);
      }
      var fc = (filtered && filtered.length) ? filtered.length : 0;
      applyGuidedBodySlotRowVisibility(sel, 'Weapon', slot.key, fc);
      finishWeaponSlot();
    }

    fillNextWeaponSlot();
  }

  function wireWeaponAddButtons() {
    var weaponSlots = getGuidedWeaponSlots();
    for (var i = 0; i < weaponSlots.length; i++) {
      var slot = weaponSlots[i];
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
    'Gadget': 'ccGadgetBuilderDetails',
    'Heavy Weapon': 'ccHeavyBuilderDetails',
    'Heavy': 'ccHeavyBuilderDetails'
  };

  var GEAR_SLOTS_BY_CATEGORY = {
    Shield: [
      { key: 'mainBody', label: 'Main Part', partType: 'Body', selectId: 'ccShieldMainPartSelect', btnId: 'ccShieldMainPartAdd' },
      { key: 'elementType1', label: 'Element / resist (Shield 246)', partType: 'TypeID1Element', selectId: 'ccShieldElementSelect', btnId: 'ccShieldElementAdd' },
      { key: 'resistance', label: 'Resistance', partType: '', selectId: 'ccShieldResistanceSelect', btnId: 'ccShieldResistanceAdd' },
      { key: 'primary246', label: 'Primary Perks 246', partType: 'Perk', selectId: 'ccShieldPrimaryPerksSelect', btnId: 'ccShieldPrimaryPerksAdd' },
      { key: 'secondary246', label: 'Secondary Perks 246', partType: 'Perk', selectId: 'ccShieldSecondaryPerksSelect', btnId: 'ccShieldSecondaryPerksAdd' },
      { key: 'armor237', label: 'Armor 237', partType: '', selectId: 'ccShieldArmorSelect', btnId: 'ccShieldArmorAdd' },
      { key: 'energy248', label: 'Energy 248', partType: '', selectId: 'ccShieldEnergySelect', btnId: 'ccShieldEnergyAdd' },
      { key: 'firmware246', label: 'Firmware 246', partType: 'Firmware', selectId: 'ccShieldFirmwareSelect', btnId: 'ccShieldFirmwareAdd' },
    ],
    Grenade: [
      { key: 'rarity', label: 'Rarity ID', partType: 'Rarity', selectId: 'ccGrenadeRaritySelect', btnId: 'ccGrenadeRarityAdd' },
      { key: 'body', label: 'Body', partType: 'Base', selectId: 'ccGrenadeBodySelect', btnId: 'ccGrenadeBodyAdd' },
      { key: 'element', label: 'Element', partType: 'Element', selectId: 'ccGrenadeElementSelect', btnId: 'ccGrenadeElementAdd' },
      { key: 'payload', label: 'Payload', partType: 'Payload', selectId: 'ccGrenadePayloadSelect', btnId: 'ccGrenadePayloadAdd' },
      { key: 'augment', label: 'Augment', partType: 'Augment', selectId: 'ccGrenadeAugmentSelect', btnId: 'ccGrenadeAugmentAdd' },
      { key: 'grenadeKitStats', label: 'Grenade stat parts', partType: '__grenadeKitStats', selectId: 'ccGrenadeKitStatsSelect', btnId: 'ccGrenadeKitStatsAdd' },
      { key: 'special', label: 'Special / Unique', partType: '', selectId: 'ccGrenadeSpecialSelect', btnId: 'ccGrenadeSpecialAdd' },
      { key: 'firmware', label: 'Firmware', partType: 'Firmware', selectId: 'ccGrenadeFirmwareSelect', btnId: 'ccGrenadeFirmwareAdd' }
    ],
    Repkit: [
      { key: 'rarity', label: 'Rarity ID', partType: 'Rarity', selectId: 'ccRepkitRaritySelect', btnId: 'ccRepkitRarityAdd' },
      { key: 'body', label: 'Body', partType: 'Base', selectId: 'ccRepkitBodySelect', btnId: 'ccRepkitBodyAdd' },
      { key: 'payload', label: 'Payload (Size)', partType: 'Payload', selectId: 'ccRepkitPayloadSelect', btnId: 'ccRepkitPayloadAdd' },
      { key: 'element', label: 'Element', partType: 'Element', selectId: 'ccRepkitElementSelect', btnId: 'ccRepkitElementAdd' },
      { key: 'augment', label: 'Augment', partType: 'Augment', selectId: 'ccRepkitAugmentSelect', btnId: 'ccRepkitAugmentAdd' },
      { key: 'perk', label: 'Perk', partType: 'Perk', selectId: 'ccRepkitPerkSelect', btnId: 'ccRepkitPerkAdd' },
      { key: 'specialPlaceholder', label: 'Placeholders (no perk)', partType: '', selectId: 'ccRepkitSpecialPlaceholderSelect', btnId: 'ccRepkitSpecialPlaceholderAdd' },
      { key: 'perkResist', label: 'Element resist add-ons', partType: '', selectId: 'ccRepkitPerkResistSelect', btnId: 'ccRepkitPerkResistAdd' },
      { key: 'perkImmunity', label: 'Element immunity add-ons', partType: '', selectId: 'ccRepkitPerkImmunitySelect', btnId: 'ccRepkitPerkImmunityAdd' },
      { key: 'perkNova', label: 'Nova add-ons', partType: '', selectId: 'ccRepkitPerkNovaSelect', btnId: 'ccRepkitPerkNovaAdd' },
      { key: 'perkSplat', label: 'Splat add-ons', partType: '', selectId: 'ccRepkitPerkSplatSelect', btnId: 'ccRepkitPerkSplatAdd' },
      { key: 'firmware', label: 'Firmware', partType: 'Firmware', selectId: 'ccRepkitFirmwareSelect', btnId: 'ccRepkitFirmwareAdd' },
      { key: 'legendary', label: 'Legendary Perks', partType: 'Legendary Perks', selectId: 'ccRepkitLegendarySelect', btnId: 'ccRepkitLegendaryAdd' }
    ],
    Enhancement: [
      { key: 'rarity', label: 'Rarity ID', partType: 'Rarity', selectId: 'ccEnhancementRaritySelect', btnId: 'ccEnhancementRarityAdd' },
      { key: 'body', label: 'Body', partType: 'Body', selectId: 'ccEnhancementBodySelect', btnId: 'ccEnhancementBodyAdd' },
      { key: 'core', label: 'Core / legendary effect', partType: 'Core', selectId: 'ccEnhancementCoreSelect', btnId: 'ccEnhancementCoreAdd' },
      { key: 'stats', label: 'Stat Group 1', partType: 'Stats', selectId: 'ccEnhancementStatsSelect', btnId: 'ccEnhancementStatsAdd' },
      { key: 'firmware', label: 'Firmware', partType: 'Firmware', selectId: 'ccEnhancementFirmwareSelect', btnId: 'ccEnhancementFirmwareAdd' },
      { key: 'other', label: 'Other parts (stack)', partType: '', selectId: 'ccEnhancementOtherSelect', btnId: 'ccEnhancementOtherAdd' }
    ],
    Gadget: [
      { key: 'rarity', label: 'Rarity ID', partType: 'Rarity', selectId: 'ccGadgetRaritySelect', btnId: 'ccGadgetRarityAdd' },
      { key: 'body', label: 'Body', partType: 'Body', selectId: 'ccGadgetBodySelect', btnId: 'ccGadgetBodyAdd' },
      { key: 'bodyAcc', label: 'Body Accessory', partType: 'Body Accessory', selectId: 'ccGadgetBodyAccSelect', btnId: 'ccGadgetBodyAccAdd' },
      { key: 'barrel', label: 'Barrel', partType: 'Barrel', selectId: 'ccGadgetBarrelSelect', btnId: 'ccGadgetBarrelAdd' },
      { key: 'barrelAcc', label: 'Barrel Accessory', partType: 'Barrel Accessory', selectId: 'ccGadgetBarrelAccSelect', btnId: 'ccGadgetBarrelAccAdd' },
      { key: 'element', label: 'Element', partType: 'Element', selectId: 'ccGadgetElementSelect', btnId: 'ccGadgetElementAdd' },
      { key: 'payload', label: 'Payload', partType: 'Payload', selectId: 'ccGadgetPayloadSelect', btnId: 'ccGadgetPayloadAdd' },
      { key: 'augment', label: 'Augment', partType: 'Augment', selectId: 'ccGadgetAugmentSelect', btnId: 'ccGadgetAugmentAdd' },
      { key: 'firmware', label: 'Firmware', partType: 'Firmware', selectId: 'ccGadgetFirmwareSelect', btnId: 'ccGadgetFirmwareAdd' },
      { key: 'legendary', label: 'Legendary Perks', partType: 'Legendary Perks', selectId: 'ccGadgetLegendarySelect', btnId: 'ccGadgetLegendaryAdd' },
      { key: 'other', label: 'Other parts (stack)', partType: '', selectId: 'ccGadgetOtherSelect', btnId: 'ccGadgetOtherAdd' }
    ],
    'Class Mod': [
      { key: 'perk', label: 'Perks', partType: 'Skill', selectId: 'ccClassModPerkSelect', btnId: 'ccClassModPerkAdd' },
      { key: 'universal', label: 'Universal Parts', partType: 'Universal', selectId: 'ccClassModUniversalSelect', btnId: 'ccClassModUniversalAdd' },
      { key: 'secondary', label: 'Secondary Parts', partType: 'Secondary', selectId: 'ccClassModSecondarySelect', btnId: 'ccClassModSecondaryAdd' },
      { key: 'element', label: 'Element Override', partType: 'Element', selectId: 'ccClassModElementSelect', btnId: 'ccClassModElementAdd' },
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
      { key: 'legendary', label: 'Legendary Perks', partType: 'Legendary Perks', selectId: 'ccHeavyLegendarySelect', btnId: 'ccHeavyLegendaryAdd' },
      { key: 'firmware', label: 'Firmware', partType: 'Firmware', selectId: 'ccHeavyFirmwareSelect', btnId: 'ccHeavyFirmwareAdd' }
    ]
  };

  function normCodeForRepkitGuidedSlot(code) {
    if (code == null) return '';
    var s = String(code).trim();
    if (s.length >= 2 && s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') return s.slice(1, -1);
    return s;
  }

  /** Same bucketing as Simple builder: empty `partType` Repkit rows split by spawn-code shape. */
  function filterRepkitGuidedSpecialParts(parts, slotKey) {
    if (!parts || !parts.length) return parts || [];
    var sk = String(slotKey || '');
    if (sk !== 'specialPlaceholder' && sk !== 'perkResist' && sk !== 'perkImmunity' && sk !== 'perkNova' && sk !== 'perkSplat') return parts;
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var c = normCodeForRepkitGuidedSlot(p && p.code).toLowerCase();
      var n = String((p && p.name) || '').trim().toUpperCase();
      var isPh = !c || n === 'PLACEHOLDER';
      var isPayload = /repair_kit\.part_payload_/.test(c);
      var isElem = /^part_element_/.test(c) || /\.part_element_/.test(c);
      var isAug = /repair_kit\.part_aug_/.test(c);
      var ok = false;
      if (sk === 'specialPlaceholder') ok = isPh;
      else if (sk === 'perkResist') ok = isAug && /resist/.test(c);
      else if (sk === 'perkImmunity') ok = isAug && /immunity/.test(c);
      else if (sk === 'perkNova') ok = isAug && /nova/.test(c);
      else if (sk === 'perkSplat') ok = isAug && /splat/.test(c);
      if (ok) out.push(p);
    }
    return out;
  }

  function refreshGearDropdowns(category) {
    category = normalizeGuidedItemTypeForGear(category);
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
      if (guidedSlotIsBodyFamily(category, slot.key)) slotMan = getSelectedItemManufacturerForBody();
      // Legendary perk pools are shared; never restrict these by manufacturer filter/toggle.
      if (slot.partType === 'Legendary Perks') slotMan = '';
      if (slot.partType === 'Firmware' || slot.key === 'firmware' || slot.key === 'firmware246') slotMan = '';
      // Element pools are shared; never restrict these by manufacturer filter/toggle.
      if (slot.partType === 'Element' || slot.partType === 'TypeID1Element' || slot.partType === 'Element Switch') slotMan = '';
      var isGearLegSlot = slot.partType === 'Legendary Perks' || slot.key === 'legendary';
      var isGearFwSlot = slot.partType === 'Firmware' || slot.key === 'firmware' || slot.key === 'firmware246';
      // Grenade bodies: manufacturer-scoped identity rows only (not cross-manufacturer when all-mfr toggle is on).
      if (category === 'Grenade' && slot.key === 'body' && !slotMan) slotMan = getSelectedItemManufacturerForBody();
      var filtered;
      if (category === 'Grenade' && slot.key === 'grenadeKitStats') {
        var manGk = String(slotMan || '').trim().toLowerCase();
        filtered = [];
        var allGk = getAllParts();
        for (var gki = 0; gki < allGk.length; gki++) {
          var pgk = allGk[gki];
          if (!pgk) continue;
          var cgk = String((pgk.code || pgk.spawnCode || pgk.importCode || '')).toLowerCase().replace(/^["']|["']$/g, '');
          if (!/grenade_gadget\.part_stat_/.test(cgk)) continue;
          if (typeof isAllPartsEnabled === 'function' && isAllPartsEnabled()) {
            filtered.push(pgk);
            continue;
          }
          if (typeof window.stxGrenadeGadgetRowMatchesSelectedManufacturer === 'function' &&
            !window.stxGrenadeGadgetRowMatchesSelectedManufacturer(cgk, manGk)) continue;
          filtered.push(pgk);
        }
        filtered = sortGuidedPartsByCode(filtered);
      } else if (useSimpleFilter) {
        var ptSlot = String(slot.partType || '');
        if (ptSlot === '__grenadeVariant' || ptSlot === '__grenadeKitStats') ptSlot = '';
        filtered = window.filterPartsForGuided({
          category: filterCat,
          manufacturer: slotMan,
          weaponType: filterWt,
          partType: ptSlot,
          forceItemManufacturer: guidedSlotIsBodyFamily(category, slot.key),
          ignoreWeaponType: slot.partType === 'Legendary Perks' || isGearLegSlot || isGearFwSlot
        });
        if (isGearLegSlot) {
          var gearLeg = guidedCollectAllLegendaryPerkParts(true);
          if (gearLeg && gearLeg.length) filtered = gearLeg;
        } else if (isGearFwSlot) {
          var gearFw = guidedCollectFirmwareParts();
          if (gearFw && gearFw.length) filtered = gearFw;
        }
      } else {
        var all = getAllParts();
        if (isGearLegSlot) {
          filtered = guidedCollectAllLegendaryPerkParts(true);
        } else if (isGearFwSlot) {
          filtered = guidedCollectFirmwareParts();
        } else {
          var ptFb = String(slot.partType || '');
          if (ptFb === '__grenadeVariant' || ptFb === '__grenadeKitStats') ptFb = '';
          filtered = filterByPartType(all, ptFb, category === 'Heavy Weapon' ? 'Heavy Weapon' : category, slotMan, category === 'Heavy Weapon' ? 'Heavy Weapon' : null);
        }
      }
      if (category === 'Repkit') {
        filtered = filterRepkitGuidedSpecialParts(filtered, slot.key);
      }
      if (slot.partType !== 'Rarity' && filtered && filtered.length && !(category === 'Heavy Weapon' && slot.partType === 'Legendary Perks')) {
        filtered = sortGuidedPartsByCode(filtered);
      }
      var maxItems = (slot.partType === 'Rarity') ? 600 : 1200;
      var emptyHintGear = (slot.key === 'elementSwitch') ? GUIDED_HINT_EMPTY_MALIWAN_SWITCH : '';
      if ((slot.key === 'elementSwitch' || slot.partType === 'Element' || slot.partType === 'TypeID1Element') && (!filtered || !filtered.length)) {
        fillElementPresetFallbackSelect(sel, slot.key === 'elementSwitch' ? '-- Secondary element --' : '-- Element --');
      } else if (isGearLegSlot && filtered && filtered.length) {
        fillSelectWithLegendaryGroups(sel, filtered);
      } else if (category === 'Heavy Weapon' && slot.partType === 'Legendary Perks' && filtered && filtered.length) {
        fillSelectWithLegendaryGroups(sel, filtered);
      } else {
        var rarityGearOpts = (slot.partType === 'Rarity')
          ? { groupByRarity: true, manufacturer: getEffectiveManufacturerForFilter() }
          : null;
        fillSelect(sel, filtered, maxItems, emptyHintGear, rarityGearOpts);
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
    try {
      if (typeof window.__ccBootGuidedSlotSelects === 'function') window.__ccBootGuidedSlotSelects();
    } catch (_) {}
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

  /** Layout-only visibility toggles — no dropdown pool rebuilds (safe during long import). */
  function syncGuidedVisibilityLayoutOnly() {
    var st = getGuidedState();
    var itemType = normalizeGuidedItemTypeForGear(st.itemType);
    var gunWrap = byId('ccGunBuilder');
    var gearHub = byId('ccGearGuidedHub');
    var hint = byId('ccGunBuilderHint');
    var weaponTypeWrap = byId('ccGuidedWeaponTypeWrap');
    var manLabel = byId('ccGuidedManufacturerLabel');
    var manSel = byId('ccGuidedManufacturer');

    var isWeapon = /weapon/i.test(itemType) && !/heavy/i.test(itemType);
    if (!isWeapon && (itemType === 'Sniper Rifle' || itemType === 'SMG' || itemType === 'Pistol' || itemType === 'Shotgun' || itemType === 'Assault Rifle')) {
      isWeapon = true;
    }
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
      } else if (itemType === 'Gadget') {
        manLabel.textContent = 'Gadget pool';
        manSel.innerHTML = '<option value="">All gadget pools</option>';
        manSel.disabled = true;
      } else {
        manLabel.textContent = 'Manufacturer';
        if (manSel.options.length && manSel.options[0]) manSel.options[0].text = 'Select manufacturer...';
        manSel.disabled = false;
      }
    }

    var builderIds = ['ccShieldBuilderDetails', 'ccGrenadeBuilderDetails', 'ccRepkitBuilderDetails', 'ccEnhancementBuilderDetails', 'ccClassModBuilderDetails', 'ccGadgetBuilderDetails', 'ccHeavyBuilderDetails'];
    var activeId = ITEM_TYPE_TO_BUILDER[itemType];
    for (var b = 0; b < builderIds.length; b++) {
      var el = byId(builderIds[b]);
      if (el) el.style.display = (builderIds[b] === activeId) ? '' : 'none';
    }
  }
  window.syncGuidedVisibilityLayoutOnly = syncGuidedVisibilityLayoutOnly;

  function syncGuidedVisibility() {
    syncGuidedVisibilityLayoutOnly();
    var st = getGuidedState();
    var itemType = normalizeGuidedItemTypeForGear(st.itemType);
    var gunWrap = byId('ccGunBuilder');
    var gearHub = byId('ccGearGuidedHub');
    var isWeapon = /weapon/i.test(itemType) && !/heavy/i.test(itemType);
    if (!isWeapon && (itemType === 'Sniper Rifle' || itemType === 'SMG' || itemType === 'Pistol' || itemType === 'Shotgun' || itemType === 'Assault Rifle')) {
       isWeapon = true;
    }
    var isHeavy = /heavy/i.test(itemType);
    var isGear = !isWeapon && (isHeavy || itemType);

    if (isWeapon) {
      if (window.__CC_IMPORT_IN_PROGRESS) {
        window.__ccDeferredGuidedVisibilityRefresh = true;
      } else {
        refreshWeaponDropdowns(true);
      }
    } else if (itemType && gearHub) {
      var builderIds = ['ccShieldBuilderDetails', 'ccGrenadeBuilderDetails', 'ccRepkitBuilderDetails', 'ccEnhancementBuilderDetails', 'ccClassModBuilderDetails', 'ccGadgetBuilderDetails', 'ccHeavyBuilderDetails'];
      var activeId = ITEM_TYPE_TO_BUILDER[itemType];
      for (var b = 0; b < builderIds.length; b++) {
        var el = byId(builderIds[b]);
        if (el) el.style.display = (builderIds[b] === activeId) ? '' : 'none';
      }
      if (activeId && GEAR_SLOTS_BY_CATEGORY[itemType] && itemType !== 'Class Mod') {
        // Defer Heavy Weapon dropdown refresh to avoid blocking UI (12 filter runs over large dataset)
        if (window.__CC_IMPORT_IN_PROGRESS) {
          window.__ccDeferredGuidedVisibilityRefresh = true;
        } else if (itemType === 'Heavy Weapon') {
          setTimeout(function () { refreshGearDropdowns(itemType); }, 0);
        } else {
          refreshGearDropdowns(itemType);
        }
      }
      if (itemType === 'Class Mod' && typeof window.__ccClassmodChecklistRender === 'function') {
        if (window.__CC_IMPORT_IN_PROGRESS) {
          window.__ccDeferredGuidedVisibilityRefresh = true;
        } else {
          try { window.__ccClassmodChecklistRender(); } catch (_) {}
        }
      }
      if (itemType === 'Enhancement' && typeof window.__ccEnhancementChecklistRender === 'function') {
        if (window.__CC_IMPORT_IN_PROGRESS) {
          window.__ccDeferredGuidedVisibilityRefresh = true;
        } else {
          try { window.__ccEnhancementChecklistRender(); } catch (_) {}
        }
      }
      if (typeof window.refreshPartSections === 'function') {
        if (window.__CC_IMPORT_IN_PROGRESS) {
          window.__ccDeferredPartSectionsRefresh = true;
        } else {
          window.refreshPartSections();
        }
      }
    }

    if (!window.__CC_IMPORT_IN_PROGRESS) {
      var legCtx = (isWeapon || isHeavy) ? 'weapon' : 'other';
      if (window.__ccGuidedLegPerkCtx !== legCtx) {
        window.__ccGuidedLegPerkCtx = legCtx;
        try { loadGuidedLegendaryPerks(); } catch (_) {}
      }
    }
  }

  function flushDeferredGuidedImportUi() {
    if (window.__ccDeferredGuidedVisibilityRefresh) {
      window.__ccDeferredGuidedVisibilityRefresh = false;
      try { syncGuidedVisibility(); } catch (_) {}
    }
    if (window.__ccDeferredPartSectionsRefresh) {
      window.__ccDeferredPartSectionsRefresh = false;
      try { if (typeof window.refreshPartSections === 'function') window.refreshPartSections(true); } catch (_) {}
    }
  }
  window.__ccFlushDeferredGuidedVisibility = flushDeferredGuidedImportUi;

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
      return readSelectValue(sel);
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
          var lv = Number(gl.value || 60);
          if (!Number.isFinite(lv) || lv < 1) lv = 60;
          if (typeof window.clampItemLevel === 'function') lv = window.clampItemLevel(lv);
          else if (lv > 60) lv = 60;
          st.level = lv;
        }
        if (typeof window.stxSyncAllPartsToggleUi === 'function') {
          var gAll = byId('ccGuidedAllManufacturers');
          var sAll = byId('allPartsToggle');
          var on = !!(gAll && gAll.checked) || !!(sAll && sAll.checked) || !!st.allParts;
          window.stxSyncAllPartsToggleUi(on);
        }
        if (st.itemType || st.manufacturer) {
          st.__seedEnabled = true;
          if (window.state) window.state.__seedEnabled = true;
        }
      }
      var giVal = getSelectValue(gi);
      var gmVal = getSelectValue(gm);
      var gwVal = getSelectValue(gw);
      var isGuidedClassMod = isGuidedClassModItemType(giVal);
      var suppressSimpleDispatch = !!(window.__ccIsHydrating || window.__CC_IMPORT_IN_PROGRESS);
      if (gi && si && giVal !== (si.value || '')) {
        si.value = giVal;
        if (!suppressSimpleDispatch) si.dispatchEvent(new Event('change', { bubbles: true }));
      }
      // Class Mod guided uses its own manufacturer control (#ccGuidedManufacturer); do not overwrite Simple Builder's #stx_manufacturer.
      if (!isGuidedClassMod && gm && sm && gmVal !== (sm.value || '')) {
        sm.value = gmVal;
        if (!suppressSimpleDispatch) sm.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (gw && wt && gwVal !== (wt.value || '')) {
        wt.value = gwVal;
        if (!suppressSimpleDispatch) wt.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (gl) {
        var lv = Number(gl.value || 60);
        if (!Number.isFinite(lv) || lv < 1) lv = 60;
        if (typeof window.clampItemLevel === 'function') lv = window.clampItemLevel(lv);
        else if (lv > 60) lv = 60;
        var levEl = byId('level') || byId('level2');
        if (levEl && Number(levEl.value || 0) !== lv) levEl.value = String(lv);
      }
      try {
        if (typeof window.__ccForceCustomSelectSync === 'function') {
          [gi, gm, gw, si, sm, wt].forEach(function (node) {
            if (node) window.__ccForceCustomSelectSync(node);
          });
        }
      } catch (_) {}
    }
    window.syncGuidedToSimple = syncGuidedToSimple;

    function guidedExtractHeaderPrefix(serial) {
      var s = String(serial || '').trim();
      var dbl = s.indexOf('||');
      return dbl >= 0 ? s.slice(0, dbl).trim() : s;
    }

    function guidedCountTailTokens(serial) {
      var s = String(serial || '').trim();
      var dbl = s.indexOf('||');
      if (dbl < 0) return 0;
      var tail = s.slice(dbl + 2).trim();
      if (!tail) return 0;
      return (tail.match(/\|\s*["']?c["']?\s*,\s*\d+\s*\||\{[^}]*(?:\[[^\]]*\])?[^}]*\}|"[^\"]+"|\S+/g) || []).filter(function (t) {
        var x = String(t || '').trim();
        return x && x !== '|' && x !== '||';
      }).length;
    }

    /** Imported / user-edited tails must not be rebuilt from computeGuidedPrefix (destroys modded headers + parts). */
    function guidedShouldPreserveExistingOutput(existing, computedPrefix, deserEl) {
      if (!existing || existing.indexOf('||') < 0) return false;
      if (deserEl.__ccImportedValue && existing === deserEl.__ccImportedValue) return true;
      if (deserEl.__ccUserTailEdit) return true;
      var tailN = guidedCountTailTokens(existing);
      if (tailN < 2) return false;
      var eh = guidedExtractHeaderPrefix(existing);
      var cp = String(computedPrefix || '').trim();
      if (!cp) return tailN >= 2;
      if (eh === cp) return false;
      var em = eh.match(/^\s*(\d+)/);
      var cm = cp.match(/^\s*(\d+)/);
      if (em && cm && em[1] !== cm[1]) return true;
      if (existing.length > cp.length + 80) return true;
      return false;
    }

    function guidedOutputWouldLoseData(existing, finalOut, deserEl) {
      if (!existing || !finalOut) return !!existing && !finalOut;
      if (existing === finalOut) return false;
      if (deserEl.__ccImportedValue && existing === deserEl.__ccImportedValue && existing.length > finalOut.length + 5) return true;
      if (deserEl.__ccUserTailEdit && existing.length > finalOut.length + 15) return true;
      var exN = guidedCountTailTokens(existing);
      var finN = guidedCountTailTokens(finalOut);
      if (exN >= 3 && finN < exN - 1 && existing.length > finalOut.length + 20) return true;
      return false;
    }

    function refreshGuidedOutput() {
      var deserEl = byId('guidedOutputDeserialized');
      if (!deserEl) return;
      
      // If we are currently hydrating, don't clear or update yet to avoid wiping imported values
      if (window.__ccIsHydrating) return;

      /* Enhancement checklist owns #guidedOutputDeserialized (manufacturer-specific header). Do not replace it with computeGuidedPrefix() weapon-style headers or pearl normalization. */
      var guidedItEnh = byId('ccGuidedItemType');
      if (guidedItEnh && String(guidedItEnh.value || '').trim() === 'Enhancement') {
        try { if (typeof window.refreshGuidedOutputPreview === 'function') window.refreshGuidedOutputPreview(); } catch (_) {}
        try { if (typeof window.syncFloatingOutput === 'function') window.syncFloatingOutput(true); } catch (_) {}
        try { if (typeof window.__ccSyncCodeCharCounts === 'function') window.__ccSyncCodeCharCounts(); } catch (_) {}
        return;
      }
      
      var existing = (deserEl.value || '').trim();
      var prefixEarly = (typeof window.computeGuidedPrefix === 'function') ? window.computeGuidedPrefix() : '';
      if (guidedShouldPreserveExistingOutput(existing, prefixEarly, deserEl)) {
        try { if (typeof window.refreshGuidedOutputPreview === 'function') window.refreshGuidedOutputPreview(); } catch (_) {}
        try { if (typeof window.syncFloatingOutput === 'function') window.syncFloatingOutput(true); } catch (_) {}
        try { if (typeof window.__ccSyncCodeCharCounts === 'function') window.__ccSyncCodeCharCounts(); } catch (_) {}
        return;
      }
      // Safety: If current value is exactly the protected imported value, don't clear it or mangle it.
      if (deserEl.__ccImportedValue && existing === deserEl.__ccImportedValue) {
         if (existing.indexOf('||') >= 0) {
            var serialEl = byId('guidedOutputSerial');
            if (serialEl && !serialEl.value) {
               if (serialEl.__ccImportedValue) {
                  serialEl.value = String(serialEl.__ccImportedValue).trim();
               } else if (typeof window.ccSerializeToBase85Async === 'function') {
                  serialEl.value = '…';
                  window.ccSerializeToBase85Async(existing, function (b85) {
                    if (!serialEl || !b85) return;
                    serialEl.value = String(b85).trim();
                  });
               } else if (typeof window.serializeToBase85 === 'function') {
                  try {
                     var b85 = window.serializeToBase85(existing, undefined, true);
                     if (b85) serialEl.value = String(b85).trim();
                  } catch (_) {}
               }
            }
            try { if (typeof window.__ccSyncCodeCharCounts === 'function') window.__ccSyncCodeCharCounts(); } catch (_) {}
            return;
         }
      }

      var prefix = (typeof window.computeGuidedPrefix === 'function') ? window.computeGuidedPrefix() : '';
      if (!prefix) {
        // Only clear if nothing is there. If we have a tail but no prefix (rare but possible),
        // we might want to keep it. But standard behavior is clear if no item selected.
        if (!existing) {
           var serialEl = byId('guidedOutputSerial');
           if (serialEl) serialEl.value = '';
           try { if (typeof window.refreshGuidedOutputPreview === 'function') window.refreshGuidedOutputPreview(); } catch (_) {}
        }
        try { if (typeof window.__ccSyncCodeCharCounts === 'function') window.__ccSyncCodeCharCounts(); } catch (_) {}
        return;
      }
      var dbl = existing.indexOf('||');
      
      // If we don't have a parts tail yet, just set the prefix and return.
      if (dbl < 0) {
        if (existing && existing.indexOf('{') >= 0) {
           deserEl.value = (prefix.indexOf('||') >= 0 ? prefix.trim() : prefix.trim() + ' ||') + ' ' + existing;
        } else if (existing && existing.indexOf('|') >= 0 && existing.length > 20) {
           // Keep existing if it looks like a full code (e.g. from an import)
           if (deserEl.__ccImportedValue === existing) {
              // It's the imported value, don't clear it.
              return;
           }
        } else {
           deserEl.value = (prefix.indexOf('||') >= 0) ? prefix.trim() : (prefix.trim() + ' ||');
        }
        if (deserEl.value && !/\|\s*$/.test(deserEl.value.trim())) deserEl.value = deserEl.value.trim() + '|';
        try { if (typeof window.refreshGuidedOutputPreview === 'function') window.refreshGuidedOutputPreview(); } catch (_) {}
        try { if (typeof window.__ccSyncCodeCharCounts === 'function') window.__ccSyncCodeCharCounts(); } catch (_) {}
        return;
      }
      var tail = existing.slice(dbl + 2).trim();
      while (tail.charAt(0) === '|') tail = tail.replace(/^\|+\s*/, '').trim();
      var tokens = [];
      if (tail) {
        tokens = (tail.match(/\|\s*["']?c["']?\s*,\s*\d+\s*\||\{[^}]*(?:\[[^\]]*\])?[^}]*\}|"[^\"]+"|\S+/g) || []).filter(function(t) {
            var s = String(t || '').trim();
            return s && s !== '|' && s !== '||';
        });
      }
      var pearlChk = byId('ccGuidedPearlOverride');
      var baseFamGuid = null;
      try {
        var mpf = prefix.match(/^\s*(\d+)\s*[,\|]/);
        if (mpf) baseFamGuid = Number(mpf[1]);
      } catch (_pf) {}
      var giPo = byId('ccGuidedItemType');
      var gwtPo = byId('ccGuidedWeaponType');
      var givPo = giPo ? String(giPo.value || '').trim() : '';
      var gwvPo = gwtPo ? String(gwtPo.value || '').trim() : '';
      var isWeaponPo = givPo === 'Weapon' || givPo === 'Heavy Weapon' || givPo === 'Gadget' || givPo === 'Heavy' ||
        (givPo === 'Weapon' && /^heavy(?:\s*weapon)?$/i.test(gwvPo));

      function parseGuidedTailTokenStrings(tailStr) {
        if (!tailStr) return [];
        return (String(tailStr).match(/\|\s*["']?c["']?\s*,\s*\d+\s*\||\{[^}]*(?:\[[^\]]*\])?[^}]*\}|"[^\"]+"|\S+/g) || []).filter(function (t) {
          var s = String(t || '').trim();
          return s && s !== '|' && s !== '||';
        });
      }

      var ptOk = '';
      if (pearlChk && pearlChk.checked && typeof window.stxPickPearlOverrideBraceToken === 'function' && Number.isFinite(baseFamGuid)) {
        ptOk = String(window.stxPickPearlOverrideBraceToken(baseFamGuid, !!isWeaponPo) || '').trim();
      }
      if (ptOk && typeof window.stxPearlTokensDuplicateForOverride === 'function') {
        var filteredTok = [];
        for (var _ti = 0; _ti < tokens.length; _ti++) {
          if (!window.stxPearlTokensDuplicateForOverride(tokens[_ti], ptOk, baseFamGuid)) filteredTok.push(tokens[_ti]);
        }
        tokens = filteredTok;
      }

      var normalized = tokens.length ? normalizeGuidedTail(prefix, tokens) : '';
      tail = normalized;

      if (ptOk && typeof window.stxPrependPearlOverrideToTailSeq === 'function') {
        var tailTok = parseGuidedTailTokenStrings(tail);
        tailTok = window.stxPrependPearlOverrideToTailSeq(tailTok, ptOk, baseFamGuid);
        tail = tailTok.length ? tailTok.join(' ') : '';
      }
      
      // Final assembly
      var finalOut = tail ? (prefix.indexOf('||') >= 0 ? prefix.trim() + ' ' + tail : prefix.trim() + ' || ' + tail) : (prefix.indexOf('||') >= 0 ? prefix.trim() : prefix.trim() + ' ||');
      if (finalOut && !/\|\s*$/.test(finalOut.trim())) finalOut = finalOut.trim() + '|';
      
    // If the final assembly would result in data loss compared to an imported value, abort
    if (deserEl.__ccImportedValue && existing === deserEl.__ccImportedValue && existing.length > finalOut.length && existing.indexOf('||') >= 0) {
      // Allow shortening if it's due to expansion/normalization of bracketed tokens
      if (existing.indexOf(':[' ) === -1 && existing.length - finalOut.length > 5) {
        // Just ensure the serial El is also synced if needed
        var serialEl2 = byId('guidedOutputSerial');
        if (serialEl2 && !serialEl2.value && typeof window.serializeToBase85 === 'function') {
           try {
              var b85_2 = window.serializeToBase85(existing, undefined, true);
              if (b85_2) serialEl2.value = String(b85_2).trim();
           } catch(_) {}
        }
        return;
      }
    }

    if (deserEl.value !== finalOut) {
      if (guidedOutputWouldLoseData(existing, finalOut, deserEl)) {
        // Keep imported / edited serial intact; still refresh packed preview below.
      } else {
        deserEl.value = finalOut;
      }
    }
      try { if (typeof window.refreshGuidedOutputPreview === 'function') window.refreshGuidedOutputPreview(); } catch (_) {}
      try { if (typeof window.syncFloatingOutput === 'function') window.syncFloatingOutput(true); } catch (_) {}
      try { if (typeof window.__ccSyncCodeCharCounts === 'function') window.__ccSyncCodeCharCounts(); } catch (_) {}
    }
    window.refreshGuidedOutput = refreshGuidedOutput;
    function clearCodeSectionsForNewItem() {
      var out = byId('guidedOutputDeserialized');
      var outSerial = byId('guidedOutputSerial');
      
      // If we have an imported value, don't clear it
      if (out && out.__ccImportedValue && out.value === out.__ccImportedValue) {
         return;
      }
      if (out) out.__ccUserTailEdit = false;
      
      if (out) out.value = '';
      if (outSerial) outSerial.value = '';
      
      // Ensure state is ready for prefix computation
      if (typeof syncGuidedToSimple === 'function') syncGuidedToSimple();

      if (typeof window.computeGuidedPrefix === 'function' && typeof window.getGuidedContext === 'function') {
        var ctx = window.getGuidedContext();
        if (ctx && ctx.itemType) {
          var prefix = window.computeGuidedPrefix();
          if (prefix) {
            var deser = byId('guidedOutputDeserialized');
            if (deser) {
              deser.value = (prefix.indexOf('||') >= 0) ? prefix.trim() : (prefix.trim() + ' ||');
            }
          }
        }
      }
      try { if (typeof window.refreshGuidedOutput === 'function') window.refreshGuidedOutput(); } catch (_) {}
    }
    function onItemTypeChange() {
      if (window.__CC_IMPORT_IN_PROGRESS) return;
      clearGuidedImportLock();
      if (window.__ccIsHydrating) return;
      syncGuidedToSimple();
      loadGuidedManufacturers();
      if (typeof loadGuidedWeaponTypes === 'function') loadGuidedWeaponTypes();
      syncGuidedVisibility();
      clearCodeSectionsForNewItem();
      scheduleGuidedPreviewRefreshIfFullStats();
    }
    function onManufacturerOrWeaponChange() {
      if (window.__CC_IMPORT_IN_PROGRESS) return;
      clearGuidedImportLock();
      if (window.__ccIsHydrating) return;
      syncGuidedToSimple();
      if (typeof loadGuidedWeaponTypes === 'function') loadGuidedWeaponTypes();
      syncGuidedVisibility();
      clearCodeSectionsForNewItem();
      scheduleGuidedPreviewRefreshIfFullStats();
    }
    function onWeaponTypeChange() {
      if (window.__CC_IMPORT_IN_PROGRESS) return;
      clearGuidedImportLock();
      if (window.__ccIsHydrating) return;
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
        if (typeof window.stxSyncAllPartsToggleUi === 'function') {
          window.stxSyncAllPartsToggleUi(!!allMansToggle.checked);
        } else {
          try { if (window.state) window.state.allParts = !!allMansToggle.checked; } catch (_) {}
        }
        syncGuidedVisibility();
        try { if (typeof window.refreshGuidedBuilderDropdowns === 'function') window.refreshGuidedBuilderDropdowns(); } catch (_) {}
        try { if (typeof window.refreshBuilder === 'function') window.refreshBuilder(); } catch (_) {}
        try { if (typeof window.refreshOutputs === 'function') window.refreshOutputs(); } catch (_) {}
      });
    }

    var guidedLevel = byId('ccGuidedLevel');
    if (guidedLevel) {
      guidedLevel.addEventListener('change', function () {
        clearGuidedImportLock();
        syncGuidedToSimple();
        try { if (typeof window.refreshGuidedOutput === 'function') window.refreshGuidedOutput(); } catch (_) {}
      });
      guidedLevel.addEventListener('input', function () {
        clearGuidedImportLock();
        syncGuidedToSimple();
        try { if (typeof window.refreshGuidedOutput === 'function') window.refreshGuidedOutput(); } catch (_) {}
      });
    }
    var guidedFirmwareLock = byId('ccGuidedFirmwareLockFlag');
    if (guidedFirmwareLock) {
      guidedFirmwareLock.addEventListener('change', function () {
        clearGuidedImportLock();
        try { if (typeof window.refreshGuidedOutput === 'function') window.refreshGuidedOutput(); } catch (_) {}
        try { if (typeof window.refreshOutputs === 'function') window.refreshOutputs(); } catch (_) {}
      });
    }
    var guidedBuyback = byId('ccGuidedBuybackFlag');
    if (guidedBuyback) {
      guidedBuyback.addEventListener('change', function () {
        clearGuidedImportLock();
        try { if (typeof window.refreshGuidedOutput === 'function') window.refreshGuidedOutput(); } catch (_) {}
        try { if (typeof window.refreshOutputs === 'function') window.refreshOutputs(); } catch (_) {}
      });
    }
    var guidedPearlOv = byId('ccGuidedPearlOverride');
    if (guidedPearlOv) {
      guidedPearlOv.addEventListener('change', function () {
        clearGuidedImportLock();
        try { ensureStaticGuidedIcons(); } catch (_e) {}
        try { refreshWeaponDropdowns(); } catch (_e2) {}
        try { if (typeof window.refreshPartSections === 'function') window.refreshPartSections(); } catch (_e3) {}
        try { if (typeof window.refreshTopSelectors === 'function') window.refreshTopSelectors(); } catch (_e4) {}
        try { if (typeof window.refreshBuilder === 'function') window.refreshBuilder(); } catch (_e5) {}
        try { if (typeof window.refreshGuidedOutput === 'function') window.refreshGuidedOutput(); } catch (_) {}
        try { if (typeof window.refreshOutputs === 'function') window.refreshOutputs(); } catch (_) {}
      });
    }

    if (window.ensurePartPools && !window.__ccPartPoolsReady) window.ensurePartPools();
    loadGuidedManufacturers();
    if (typeof loadGuidedWeaponTypes === 'function') loadGuidedWeaponTypes();
    ensureStaticGuidedIcons();
    syncGuidedVisibility();
    setTimeout(function () { refreshToolsStandaloneElementDropdowns(); }, 0);
    var guidedBootDelayMs = (function () {
      try {
        if (typeof window.stxIsLiteUi === 'function' && window.stxIsLiteUi()) return 0;
        if (typeof window.stxIsTouchUi === 'function' && window.stxIsTouchUi()) return 0;
      } catch (_) {}
      return document.documentElement.classList.contains('stx-lite-ui') ||
        document.documentElement.classList.contains('stx-touch-ui') ? 0 : 500;
    })();
    if (guidedBootDelayMs > 0) {
      setTimeout(function () {
        var it = (guidedItem && guidedItem.value) || (byId('stx_itemType') && byId('stx_itemType').value);
        if (it) {
          loadGuidedManufacturers();
          if (typeof loadGuidedWeaponTypes === 'function') loadGuidedWeaponTypes();
          ensureStaticGuidedIcons();
          syncGuidedVisibility();
        }
        if (typeof window.refreshPartSections === 'function') window.refreshPartSections();
        if (typeof window.refreshGuidedOutput === 'function') window.refreshGuidedOutput();
        refreshToolsStandaloneElementDropdowns();
      }, guidedBootDelayMs);
    }
    var randBtn = byId('rebuildRandomFullBuildBtn');
    if (randBtn && typeof randomFullBuild === 'function') {
      randBtn.onclick = function () { randomFullBuild(); };
    }
    var moddedTypeEl = byId('moddedGenItemType');
    if (moddedTypeEl) {
      moddedTypeEl.addEventListener('change', syncModdedGenWeaponTypeWrap);
      syncModdedGenWeaponTypeWrap();
    }
  }

  var PART_SECTIONS = [
    { key: 'Grenade', selectId: 'partSelectGrenade', btnId: 'partAddGrenade', poolKey: 'GRENADE_PARTS', detailsId: 'partSectionDetailsGrenade' },
    { key: 'Shield', selectId: 'partSelectShield', btnId: 'partAddShield', poolKey: 'SHIELD_PARTS', detailsId: 'partSectionDetailsShield' },
    { key: 'Repkit', selectId: 'partSelectRepkit', btnId: 'partAddRepkit', poolKey: 'REPKIT_PARTS', detailsId: 'partSectionDetailsRepkit' },
    { key: 'Enhancement', selectId: 'partSelectEnhancement', btnId: 'partAddEnhancement', poolKey: 'ENHANCEMENT_PARTS', detailsId: 'partSectionDetailsEnhancement' },
    { key: 'ClassMod', selectId: 'partSelectClassMod', btnId: 'partAddClassMod', poolKey: 'CLASSMOD_PARTS', detailsId: 'partSectionDetailsClassMod' },
    { key: 'Heavy', selectId: 'partSelectHeavy', btnId: 'partAddHeavy', poolKey: 'HEAVY_PARTS', detailsId: 'partSectionDetailsHeavy' },
    { key: 'Gun', selectId: 'partSelectGun', btnId: 'partAddGun', poolKey: 'GUN_PARTS', detailsId: 'partSectionDetailsGun' }
  ];

  function scheduleIdleWork(fn, timeoutMs) {
    if (typeof window.stxScheduleIdle === 'function') {
      window.stxScheduleIdle(fn, timeoutMs || 80);
    } else if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(fn);
    } else {
      setTimeout(fn, 0);
    }
  }

  function fillPartSectionSelect(sel, parts, maxItems) {
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Select part --</option>';
    var isClassmodManualSection = String(sel.id || '') === 'partSelectClassMod';
    var pool = parts || [];
    var cap = (window.__CC_IMPORT_HEAVY && window.__CC_IMPORT_IN_PROGRESS) ? 400 : (maxItems || 1200);
    var limit = Math.min(pool.length, cap);
    var listForPreview = [];
    var seenTok = Object.create(null);
    for (var i = 0; i < limit; i++) {
      var p = pool[i];
      var tok = getPartToken(p);
      if (!tok) continue;
      if (seenTok[tok]) continue;
      seenTok[tok] = true;
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
      applyGuidedBarrelOptionDataAttrs(sel, opt, p);
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

  function poolForPartSection(s) {
    var pool = window[s.poolKey];
    if (s.poolKey === 'CLASSMOD_PARTS' && typeof window.stxIsBrokenClassmodDatasetPlaceholderPart === 'function') {
      pool = (pool || []).filter(function (p) {
        try { return !window.stxIsBrokenClassmodDatasetPlaceholderPart(p); } catch (_e) { return true; }
      });
    }
    return pool || [];
  }

  function fillOnePartSection(s) {
    if (!s) return;
    var sel = byId(s.selectId);
    if (!sel) return;
    fillPartSectionSelect(sel, poolForPartSection(s), 1200);
    s.__filled = true;
  }

  function ensurePartSectionFilled(s) {
    if (!s || s.__filled) return;
    if (window.ensurePartPools) window.ensurePartPools();
    if (typeof window.__ccEnsureCodeIdMap === 'function') {
      try { window.__ccEnsureCodeIdMap(); } catch (_) {}
    }
    fillOnePartSection(s);
  }

  function wireLazyPartSections() {
    if (window.__ccLazyPartSectionsWired) return;
    window.__ccLazyPartSectionsWired = true;
    for (var i = 0; i < PART_SECTIONS.length; i++) {
      (function (sec) {
        var det = byId(sec.detailsId);
        if (!det || det.__ccLazyPartBound) return;
        det.__ccLazyPartBound = true;
        det.addEventListener('toggle', function () {
          if (!det.open) return;
          scheduleIdleWork(function () { ensurePartSectionFilled(sec); }, 120);
        });
        if (det.open) scheduleIdleWork(function () { ensurePartSectionFilled(sec); }, 200);
      })(PART_SECTIONS[i]);
    }
  }

  function refreshOpenPartSectionsOnly() {
    for (var i = 0; i < PART_SECTIONS.length; i++) {
      PART_SECTIONS[i].__filled = false;
    }
    for (var j = 0; j < PART_SECTIONS.length; j++) {
      var det = byId(PART_SECTIONS[j].detailsId);
      if (det && det.open) ensurePartSectionFilled(PART_SECTIONS[j]);
    }
  }

  function refreshPartSections(forceNow) {
    if (window.__CC_IMPORT_IN_PROGRESS && !forceNow) {
      window.__ccDeferredPartSectionsRefresh = true;
      return;
    }
    wireLazyPartSections();
    if (!forceNow && !window.__CC_IMPORT_HEAVY) {
      refreshOpenPartSectionsOnly();
      return;
    }
    if (window.__ccPartSectionsRefreshPending) return;
    window.__ccPartSectionsRefreshPending = true;
    for (var pi = 0; pi < PART_SECTIONS.length; pi++) PART_SECTIONS[pi].__filled = false;
    var startIdx = 0;
    function fillNextSection() {
      if (window.ensurePartPools && startIdx === 0) window.ensurePartPools();
      if (startIdx === 0 && typeof window.__ccEnsureCodeIdMap === 'function') {
        try { window.__ccEnsureCodeIdMap(); } catch (_) {}
      }
      if (startIdx >= PART_SECTIONS.length) {
        window.__ccPartSectionsRefreshPending = false;
        refreshToolsStandaloneElementDropdowns();
        return;
      }
      fillOnePartSection(PART_SECTIONS[startIdx]);
      startIdx++;
      if (startIdx < PART_SECTIONS.length) {
        scheduleIdleWork(fillNextSection, 60);
      } else {
        fillNextSection();
      }
    }
    fillNextSection();
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
    wireLazyPartSections();
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
    var legPool = guidedCollectAllLegendaryPerkParts(true);
    var selIds = ['ccGuidedLegendaryPerkSelect', 'ccWeaponLegendarySelect'];
    for (var si = 0; si < selIds.length; si++) {
      var sel = byId(selIds[si]);
      if (!sel) continue;
      if (legPool && legPool.length) {
        fillSelectWithLegendaryGroups(sel, legPool);
      } else if (typeof window.populateLegendaryPerks === 'function') {
        window.populateLegendaryPerks(sel, getPartToken);
        syncGuidedCustomSelectIfWrapped(sel);
      }
    }
  }

  /* Preset categories — pools come from `window.PRESET_BOOST_POOLS` (cc-rebuild-populate.js), incl. Repkit 243:* rows. */
  var PRESET_BOOST_POOLS_FALLBACK = {
    damage: [{ key: 22, value: '72' }, { key: 9, value: '28' }, { key: 9, value: '32' }, { key: 9, value: '40' }, { key: 9, value: '55' }, { key: 9, value: '59' }, { key: 9, value: '62' }, { key: 9, value: '68' }],
    accuracy: [{ key: 13, value: '12' }, { key: 9, value: '48' }],
    reload: [{ key: 24, value: '44' }, { key: 9, value: '61' }],
    firerate: [{ key: 14, value: '1' }, { key: 27, value: '15' }],
    ammo: [{ key: 18, value: '14' }, { key: 27, value: '75' }],
    splash: [{ key: 6, value: '33' }, { key: 9, value: '89' }, { key: 24, value: '18' }],
    crit: [{ key: 3, value: '6' }, { key: 24, value: '33' }]
  };
  function getGuidedPresetBoostPools() {
    var w = window.PRESET_BOOST_POOLS;
    if (w && typeof w === 'object') return w;
    return PRESET_BOOST_POOLS_FALLBACK;
  }
  var PRESET_CATEGORIES = [
    { key: 'damage', label: 'Damage' },
    { key: 'accuracy', label: 'Accuracy' },
    { key: 'reload', label: 'Reload Speed' },
    { key: 'firerate', label: 'Fire Rate' },
    { key: 'ammo', label: 'Ammo' },
    { key: 'splash', label: 'Splash Damage' },
    { key: 'crit', label: 'Crit Damage' },
    { key: 'splat', label: 'Repkit — Splat' },
    { key: 'nova', label: 'Repkit — Nova' },
    { key: 'immunity', label: 'Repkit — Immunity' },
    { key: 'resistance', label: 'Repkit — Resistance' },
    { key: 'elemental', label: 'Repkit — Elemental' }
  ];

  function loadGuidedPresetCategories() {
    var sel = byId('ccGuidedPresetCategorySelect');
    if (!sel) return;
    var pools = getGuidedPresetBoostPools();
    sel.innerHTML = '<option value="">-- Select category --</option>';
    for (var i = 0; i < PRESET_CATEGORIES.length; i++) {
      var c = PRESET_CATEGORIES[i];
      var pool = pools[c.key];
      if (!Array.isArray(pool) || !pool.length) continue;
      sel.appendChild(new Option(c.label, c.key));
    }
  }

  function loadGuidedPresetParts() {
    var catSel = byId('ccGuidedPresetCategorySelect');
    var partSel = byId('ccGuidedPresetPartSelect');
    var moreSel = byId('ccGuidedPresetMorePartSelect');
    if (!catSel || !partSel) return;
    var guidedOpts = {
      formatLabel: compactGuidedPartLabel,
      onOption: function (sel, opt, p) { applyGuidedBarrelOptionDataAttrs(sel, opt, p); }
    };
    if (typeof window.populatePresetParts === 'function') {
      window.populatePresetParts(catSel, partSel, getPartToken, moreSel, guidedOpts);
      return;
    }
    var catKey = (catSel.value || '').trim();
    partSel.innerHTML = '<option value="">-- Select preset --</option>';
    if (moreSel) moreSel.innerHTML = '<option value="">-- More from catalog --</option>';
    if (!catKey) return;
    var pools = getGuidedPresetBoostPools();
    var pool = pools[catKey];
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
          applyGuidedBarrelOptionDataAttrs(partSel, opt, px);
          partSel.appendChild(opt);
        }
      }
      if (partSel.options.length <= 1) {
        for (var pi = 0; pi < pool.length; pi++) {
          var raw = pool[pi];
          var rk = raw.key != null ? raw.key : raw.k;
          var rv = raw.value != null ? raw.value : raw.v;
          if (rk == null || rv == null) continue;
          var tokFallback = '{' + String(rk) + ':' + String(rv) + '}';
          var optFallback = new Option(tokFallback + ' - Preset token', tokFallback);
          optFallback.title = 'Dataset name unavailable; this preset token will still be added.';
          partSel.appendChild(optFallback);
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
        var leg = (typeof window.collectLegendaryPerkDropdownParts === 'function')
          ? window.collectLegendaryPerkDropdownParts(all)
          : all.filter(function (p) { return p && /legendary\s*perk/i.test(String(p.partType || '')); });
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
    var guidedTypeSel = byId('ccGuidedItemType');
    if (guidedTypeSel) guidedTypeSel.addEventListener('change', loadGuidedPresetParts);
    if (presetBtn) {
      presetBtn.addEventListener('click', function () {
        var partSel = byId('ccGuidedPresetPartSelect');
        var moreSel = byId('ccGuidedPresetMorePartSelect');
        var qtyEl = byId('ccGuidedPresetQuantity');
        var code = (typeof window.resolveActivePresetPartValue === 'function')
          ? window.resolveActivePresetPartValue(partSel, moreSel)
          : String((partSel && partSel.value) || (moreSel && moreSel.value) || '').trim();
        if (!code) return;
        var n = Math.max(1, parseInt((qtyEl && qtyEl.value) || '1', 10) || 1);
        if (typeof window.stxAppendPresetToActiveBuilder === 'function' && window.stxAppendPresetToActiveBuilder(code, { quantity: n })) {
          return;
        }
        var out = getGuidedOutputEl();
        if (!out) return;
        for (var i = 0; i < n; i++) appendToOutCode(code);
        try { if (window.refreshGuidedOutputPreview) window.refreshGuidedOutputPreview(); } catch (_) {}
      });
    }
    wireImportedInspectorQtyButtonsEarly();
  }

  function wireImportedInspectorQtyButtonsEarly() {
    var wrap = byId('importedPartsInspector');
    if (!wrap || wrap.__ipiQtyBound) return;
    wrap.__ipiQtyBound = true;
    wrap.addEventListener('click', function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest('[data-ipi-delta]') : null;
      if (!btn) return;
      var enc = btn.getAttribute('data-ipi-tok');
      if (!enc) return;
      function runMutate() {
        if (typeof window.__ccMutateSerialTailDelta !== 'function') return false;
        try {
          var tok = decodeURIComponent(enc);
          var dlt = parseInt(btn.getAttribute('data-ipi-delta'), 10);
          if (Number.isFinite(dlt)) return window.__ccMutateSerialTailDelta(tok, dlt) !== false;
        } catch (_) {}
        return false;
      }
      if (runMutate()) return;
      if (typeof window.stxEnsureGuidedScripts === 'function') {
        try { window.stxEnsureGuidedScripts(function () { runMutate(); }); } catch (_) {}
      }
    });
  }

  var __lastWeaponDropdownRefreshKey = '';
  var __guidedDropdownRefreshTimer = 0;
  var __guidedDropdownsWired = false;

  function runGuidedDropdownRefresh() {
    __guidedDropdownRefreshTimer = 0;
    var st = getGuidedState();
    var it = String(st.itemType || '').trim();
    var itLo = it.toLowerCase();
    if (itLo === 'heavy') itLo = 'heavy weapon';
    if (itLo === 'weapon' || itLo === 'heavy weapon' || /^(assault rifle|pistol|shotgun|smg|sniper rifle)$/i.test(it)) {
      refreshWeaponDropdowns(true);
      return;
    }
    var gearIt = normalizeGuidedItemTypeForGear(it);
    if (gearIt && GEAR_SLOTS_BY_CATEGORY[gearIt]) refreshGearDropdowns(gearIt);
  }

  function scheduleGuidedDropdownRefresh(forceNow) {
    if (__guidedDropdownRefreshTimer) {
      clearTimeout(__guidedDropdownRefreshTimer);
      __guidedDropdownRefreshTimer = 0;
    }
    if (forceNow) {
      runGuidedDropdownRefresh();
      return;
    }
    __guidedDropdownRefreshTimer = setTimeout(runGuidedDropdownRefresh, 140);
  }

  function wireLazyGuidedDropdownRefresh() {
    if (__guidedDropdownsWired) return;
    __guidedDropdownsWired = true;
    var trigger = function () { scheduleGuidedDropdownRefresh(true); };
    ['ccGuidedItemType', 'ccGuidedManufacturer', 'ccGuidedWeaponType', 'ccGuidedAllManufacturers', 'enhMfgSel'].forEach(function (id) {
      var el = byId(id);
      if (el && !el.__ccLazyGuidedRefreshBound) {
        el.__ccLazyGuidedRefreshBound = true;
        el.addEventListener('change', trigger);
      }
    });
    var panel = byId('rebuildGuidedBuilderSection');
    if (panel && !panel.__ccLazyGuidedRefreshBound) {
      panel.__ccLazyGuidedRefreshBound = true;
      var onInteract = function () {
        scheduleGuidedDropdownRefresh(false);
        panel.removeEventListener('pointerdown', onInteract);
        panel.removeEventListener('focusin', onInteract);
      };
      panel.addEventListener('pointerdown', onInteract, { passive: true });
      panel.addEventListener('focusin', onInteract);
    }
  }

  function bootGuidedBuilder() {
    var advLanding = typeof window.__ccIsAdvSearchDeepLinkV1 === 'function' && window.__ccIsAdvSearchDeepLinkV1();
    var liteUi = document.documentElement.classList.contains('stx-lite-ui') ||
      document.documentElement.classList.contains('stx-touch-ui');
    var runBoot = function () {
      init();
      if (advLanding) return;
      initPartSections();
      wireLazyGuidedDropdownRefresh();
      scheduleGuidedDropdownRefresh(true);
      if (!liteUi) {
        setTimeout(initGuidedExtraSections, 100);
      } else {
        document.addEventListener('pointerdown', function () { initGuidedExtraSections(); }, { once: true, passive: true });
      }
    };
    var queueBoot = function () {
      if (typeof window.stxYieldToMain === 'function') window.stxYieldToMain(runBoot);
      else setTimeout(runBoot, 0);
    };
    if (document.documentElement.classList.contains('stx-splash-dismissed')) {
      queueBoot();
      return;
    }
    if (typeof window.stxWhenSplashDismissed === 'function') {
      window.stxWhenSplashDismissed(queueBoot, { priority: true });
    } else {
      queueBoot();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootGuidedBuilder);
  } else {
    setTimeout(bootGuidedBuilder, 50);
  }

  try {
    window.addEventListener('stx:deferred-core-ready', function () {
      try {
        if (typeof scheduleGuidedDropdownRefresh === 'function') scheduleGuidedDropdownRefresh(true);
      } catch (_) {}
    });
  } catch (_) {}

  window.refreshGuidedBuilderDropdowns = function (force) {
    scheduleGuidedDropdownRefresh(!!force);
  };
  window.scheduleGuidedDropdownRefresh = scheduleGuidedDropdownRefresh;
  window.wireLazyGuidedDropdownRefresh = wireLazyGuidedDropdownRefresh;
  window.refreshToolsStandaloneElementDropdowns = refreshToolsStandaloneElementDropdowns;
  window.syncGuidedVisibility = syncGuidedVisibility;
  window.refreshPartSections = refreshPartSections;
  window.__ccInitPartSectionsV1 = initPartSections;
  window.ensureStaticGuidedIcons = ensureStaticGuidedIcons;
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
  function setModdedGenStatus(msg) {
    var el = byId('moddedGenStatus');
    if (el) el.textContent = String(msg || '');
  }

  function syncModdedGenWeaponTypeWrap() {
    var typeEl = byId('moddedGenItemType');
    var wrap = byId('moddedGenWeaponTypeWrap');
    if (!wrap) return;
    var v = typeEl ? String(typeEl.value || '').trim() : '';
    wrap.style.display = (v === 'Weapon') ? '' : 'none';
  }

  function getModdedGenOptionsFromUI() {
    var intensityEl = byId('moddedGenIntensity');
    var focusEl = byId('moddedGenStatFocus');
    var fillEl = byId('moddedGenFillSlots');
    var stacksEl = byId('moddedGenIncludeStacks');
    var appendEl = byId('moddedGenAppendMode');
    var itemTypeEl = byId('moddedGenItemType');
    var weaponTypeEl = byId('moddedGenWeaponType');
    return {
      intensity: (intensityEl && intensityEl.value) ? String(intensityEl.value) : 'medium',
      statFocus: (focusEl && focusEl.value) ? String(focusEl.value).trim() : '',
      fillSlots: !(fillEl && fillEl.checked === false),
      includeStacks: !(stacksEl && stacksEl.checked === false),
      appendMode: !!(appendEl && appendEl.checked),
      itemType: (itemTypeEl && itemTypeEl.value) ? String(itemTypeEl.value).trim() : '',
      weaponType: (weaponTypeEl && weaponTypeEl.value) ? String(weaponTypeEl.value).trim() : ''
    };
  }

  function pickRandomRarityRowForGenerator(rarities, forcedItemType, forcedWeaponType) {
    if (!Array.isArray(rarities) || !rarities.length) return null;
    var want = String(forcedItemType || '').trim();
    var wantWt = String(forcedWeaponType || '').trim();
    var rows = rarities;
    if (want) {
      rows = rarities.filter(function (r) {
        var it = String(r && r.itemType || '').trim();
        if (want === 'Weapon') {
          if (wantWt) return it === wantWt;
          return /^(Assault Rifle|Pistol|Shotgun|SMG|Sniper Rifle)$/i.test(it);
        }
        if (want === 'Heavy Weapon') return /Heavy Weapon/i.test(it);
        if (want === 'Gadget') return /Gadget/i.test(it);
        return it === want;
      });
      if (!rows.length) return null;
    } else {
      rows = rarities.filter(function (r) {
        var it = String(r && r.itemType || '').trim();
        return /^(Assault Rifle|Pistol|Shotgun|SMG|Sniper Rifle|Heavy Weapon|Shield|Grenade|Repkit|Class Mod|Enhancement|Gadget)$/i.test(it);
      });
      if (!rows.length) rows = rarities;
    }
    return rows[Math.floor(Math.random() * rows.length)];
  }

  function applyForcedModdedGenItemType(forcedItemType, forcedWeaponType, rarities, guidedMan) {
    var itemType = String(forcedItemType || '').trim();
    var weaponType = String(forcedWeaponType || '').trim();
    var manufacturer = '';
    if (guidedMan && String(guidedMan.value || '').trim()) {
      manufacturer = String(guidedMan.value || '').trim();
    }
    if (!manufacturer) {
      var pick = pickRandomRarityRowForGenerator(rarities, itemType, weaponType);
      if (pick) manufacturer = String(pick.manufacturer || '').trim();
    }
    if (itemType === 'Weapon') {
      if (!weaponType) {
        var wtPick = pickRandomRarityRowForGenerator(rarities, 'Weapon', '');
        weaponType = wtPick ? String(wtPick.itemType || '').trim() : 'Assault Rifle';
      }
      var normW = normalizeGuidedItemTypeForGenerator('Weapon', weaponType);
      return applyGuidedGeneratorItemType(normW.itemType, manufacturer, normW.weaponType);
    }
    if (itemType === 'Heavy Weapon') {
      return applyGuidedGeneratorItemType('Heavy Weapon', manufacturer, 'Heavy Weapon');
    }
    var norm = normalizeGuidedItemTypeForGenerator(itemType, itemType);
    return applyGuidedGeneratorItemType(norm.itemType, manufacturer, norm.weaponType);
  }

  function getModdedCatalogItemType(itemType, weaponType) {
    var it = String(itemType || '').trim().toLowerCase();
    var wt = String(weaponType || '').trim().toLowerCase();
    if (/heavy/.test(it) || /heavy/.test(wt)) return 'heavy';
    if (/grenade/.test(it)) return 'grenade';
    if (/shield/.test(it)) return 'shield';
    if (/class/.test(it)) return 'classmod';
    if (/enhancement/.test(it)) return 'enhancement';
    if (/repkit/.test(it)) return 'repkit';
    return 'weapon';
  }

  function getSlotsForModdedGen(itemType) {
    var it = String(itemType || '').trim();
    if (/^(Assault Rifle|Pistol|Shotgun|SMG|Sniper Rifle)$/i.test(it)) return getGuidedWeaponSlots();
    if (/^Weapon$/i.test(it)) return getGuidedWeaponSlots();
    if (/Heavy/i.test(it)) return GEAR_SLOTS_BY_CATEGORY['Heavy Weapon'] || [];
    return GEAR_SLOTS_BY_CATEGORY[it] || [];
  }

  function refreshSlotsForModdedGen(itemType) {
    var it = String(itemType || '').trim();
    if (/^(Assault Rifle|Pistol|Shotgun|SMG|Sniper Rifle|Weapon)$/i.test(it)) {
      refreshWeaponDropdowns();
      return;
    }
    if (/Heavy/i.test(it)) {
      refreshGearDropdowns('Heavy Weapon');
      return;
    }
    if (GEAR_SLOTS_BY_CATEGORY[it]) refreshGearDropdowns(it);
  }

  /** Never random-roll these — universal / secondary / cross-pool slots (same as skipping in a hand build). */
  var MODDED_GEN_ALWAYS_SKIP_SLOTS = {
    licensed: 1,
    secondaryEle: 1,
    hyperionSecondaryAcc: 1,
    secondaryAmmo: 1,
    secondary246: 1,
    universal: 1,
    secondary: 1,
    perkResist: 1,
    perkImmunity: 1,
    perkNova: 1,
    perkSplat: 1,
    specialPlaceholder: 1
  };

  /** Sometimes skip — optional / firmware / pearl / stack extras. */
  var MODDED_GEN_OPTIONAL_SLOTS = {
    pearlElem: 1,
    pearlStat: 1,
    foregrip: 1,
    elementSwitch: 1,
    firmware: 1,
    special: 1,
    grenadeKitStats: 1,
    other: 1,
    legendary: 1
  };

  function selectHasRealOptions(sel) {
    if (!sel || !sel.options || !sel.options.length) return false;
    for (var j = 0; j < sel.options.length; j++) {
      var v = String(sel.options[j].value || '').trim();
      if (!v || v.indexOf('--') === 0 || v.indexOf('(Empty)') >= 0) continue;
      return true;
    }
    return false;
  }

  function pickRandomSelectToken(selectId) {
    var sel = byId(selectId);
    if (!selectHasRealOptions(sel)) return '';
    var opts = [];
    for (var j = 0; j < sel.options.length; j++) {
      var v = String(sel.options[j].value || '').trim();
      if (!v || v.indexOf('--') === 0 || v.indexOf('(Empty)') >= 0) continue;
      opts.push(v);
    }
    if (!opts.length) return '';
    return opts[Math.floor(Math.random() * opts.length)];
  }

  function whenGuidedSlotsReady(itemType, cb, maxWaitMs) {
    maxWaitMs = maxWaitMs || 4200;
    var start = Date.now();
    var slots = getSlotsForModdedGen(itemType);
    var isGear = !!GEAR_SLOTS_BY_CATEGORY[String(itemType || '').trim()];
    function tick() {
      refreshSlotsForModdedGen(itemType);
      var filled = 0;
      var required = 0;
      for (var i = 0; i < slots.length; i++) {
        var sel = byId(slots[i].selectId);
        if (!sel) continue;
        required++;
        if (selectHasRealOptions(sel)) filled++;
      }
      var minNeed = isGear
        ? Math.min(3, Math.max(1, Math.ceil(required * 0.35)))
        : Math.min(4, Math.max(2, Math.ceil(required * 0.2)));
      var ok = required > 0 && filled >= minNeed;
      var timedOut = Date.now() - start >= maxWaitMs;
      if (ok || (timedOut && (!isGear || filled > 0))) {
        cb(filled, required);
        return;
      }
      if (timedOut) {
        setModdedGenStatus('Could not load ' + String(itemType || 'item') + ' slots — pick manufacturer in Guided Builder and retry.');
        return;
      }
      setTimeout(tick, 100);
    }
    setTimeout(tick, 120);
  }

  function presetEntryKeyLocal(e) {
    if (!e) return '';
    if (e.bareId) return 'b:' + String(e.bareId);
    var k = e.key != null ? e.key : e.k;
    var v = e.value != null ? e.value : e.v;
    return (k != null && v != null) ? (String(k) + ':' + String(v)) : '';
  }

  function presetEntryToTokenLocal(entry) {
    var cat = window.MODDED_PRESET_CATALOG;
    if (cat && typeof cat.catalogEntryToToken === 'function') {
      return String(cat.catalogEntryToToken(entry) || '').trim();
    }
    if (entry && entry.bareId) return '{' + String(entry.bareId).trim() + '}';
    var k = entry && (entry.key != null ? entry.key : entry.k);
    var v = entry && (entry.value != null ? entry.value : entry.v);
    return (k != null && v != null) ? ('{' + String(k) + ':' + String(v) + '}') : '';
  }

  function mergeModdedPresetPool(itemType, catKey) {
    var seen = Object.create(null);
    var out = [];
    function add(e) {
      if (!e) return;
      var pk = presetEntryKeyLocal(e);
      if (!pk || seen[pk]) return;
      seen[pk] = true;
      out.push(e);
    }
    var pools = window.PRESET_BOOST_POOLS || {};
    var primary = pools[catKey] || [];
    for (var i = 0; i < primary.length; i++) add(primary[i]);
    if (typeof window.getMorePresetPool === 'function') {
      var more = window.getMorePresetPool(catKey, itemType) || [];
      for (var m = 0; m < more.length; m++) add(more[m]);
    }
    var catalog = window.MODDED_PRESET_CATALOG;
    if (catalog && typeof catalog.getCatalogPool === 'function') {
      var full = catalog.getCatalogPool(itemType, catKey) || [];
      for (var c = 0; c < full.length; c++) add(full[c]);
    }
    return out;
  }

  function stackCountForPresetEntry(entry, intensity) {
    var per = Number(entry && entry.perStack) || 1.05;
    if (per <= 1) per = 1.05;
    var maxSeen = Number(entry && entry.moddedMax) || 0;
    var targetMult = ({ light: 2, medium: 5, heavy: 10, wild: 30 })[intensity] || 5;
    var n = Math.ceil(Math.log(Math.max(1.01, targetMult)) / Math.log(per));
    if (intensity === 'wild') {
      n = Math.floor(Math.random() * 28) + 10;
    } else {
      n += Math.floor(Math.random() * 3);
    }
    var cap = maxSeen > 0 ? Math.min(72, Math.max(6, Math.floor(maxSeen * 0.15))) : 36;
    if (intensity === 'wild') cap = Math.min(96, maxSeen > 0 ? Math.floor(maxSeen * 0.22) : 48);
    return Math.max(1, Math.min(cap, n));
  }

  function pickModdedPresetStackTokens(itemType, weaponType, opts) {
    opts = opts || {};
    var catalogType = getModdedCatalogItemType(itemType, weaponType);
    var catalog = window.MODDED_PRESET_CATALOG;
    var catData = (catalog && catalog.byItemType && catalog.byItemType[catalogType]) ? catalog.byItemType[catalogType] : null;
    if (!catData) return [];

    var catKeys = Object.keys(catData);
    if (!catKeys.length) return [];

    var focus = String(opts.statFocus || '').trim();
    if (focus && catKeys.indexOf(focus) >= 0) {
      catKeys = [focus];
    } else {
      for (var i = catKeys.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = catKeys[i];
        catKeys[i] = catKeys[j];
        catKeys[j] = tmp;
      }
      var pickCats = Math.min(catKeys.length, focus ? 1 : (1 + Math.floor(Math.random() * 3)));
      catKeys = catKeys.slice(0, pickCats);
    }

    var tokens = [];
    for (var ci = 0; ci < catKeys.length; ci++) {
      var pool = mergeModdedPresetPool(catalogType, catKeys[ci]);
      if (!pool.length) continue;
      var entry = pool[Math.floor(Math.random() * pool.length)];
      var tok = presetEntryToTokenLocal(entry);
      if (!tok) continue;
      var stacks = stackCountForPresetEntry(entry, opts.intensity || 'medium');
      for (var s = 0; s < stacks; s++) tokens.push(tok);
    }
    return tokens;
  }

  function addRandomLegitSlots(itemType, manufacturer, weaponType, targetOut, opts) {
    opts = opts || {};
    var slots = getSlotsForModdedGen(itemType);
    var manL = String(manufacturer || '').trim().toLowerCase();
    var added = 0;
    var rejected = 0;
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      if (MODDED_GEN_ALWAYS_SKIP_SLOTS[slot.key]) continue;
      if (opts.skipOptional && MODDED_GEN_OPTIONAL_SLOTS[slot.key]) {
        if (Math.random() < 0.65) continue;
      }
      if (slot.maliwanOnly && manL.indexOf('maliwan') < 0) continue;
      var tok = pickRandomSelectToken(slot.selectId);
      if (!tok) continue;
      if (!isTokenValidForModdedGenItemType(tok, itemType)) {
        rejected++;
        continue;
      }
      appendToOutCode(tok, targetOut);
      added++;
    }
    if (rejected > 0 && added === 0) {
      setModdedGenStatus('No valid ' + String(itemType || 'item') + ' parts in slots — sync Guided Builder and retry.');
    }
    return added;
  }

  function parseModdedStackUnit(tok) {
    var t = String(tok || '').trim();
    var packed = t.match(/^\{\s*(\d+)\s*:\s*\[([^\]]+)\]\s*\}$/);
    if (packed) {
      return { fam: Number(packed[1]), ids: packed[2].trim().split(/\s+/).filter(Boolean) };
    }
    var m = t.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
    if (m) return { fam: Number(m[1]), ids: [String(m[2])] };
    return null;
  }

  /** Collapse repeated modded stacks into one bracket list per part (e.g. 16×{24:44} → {24:[44 44 …]}). */
  function packModdedStackTokens(tokens) {
    var order = [];
    var groups = Object.create(null);
    var passthrough = [];
    for (var i = 0; i < tokens.length; i++) {
      var tok = String(tokens[i] || '').trim();
      if (!tok) continue;
      var unit = parseModdedStackUnit(tok);
      if (!unit || !Number.isFinite(unit.fam) || !unit.ids.length) {
        passthrough.push(tok);
        continue;
      }
      var key = unit.fam + ':' + unit.ids.join(' ');
      if (!groups[key]) {
        groups[key] = { fam: unit.fam, unitIds: unit.ids.slice(), repeats: 0 };
        order.push(key);
      }
      groups[key].repeats++;
    }
    var out = [];
    var stackCount = 0;
    for (var oi = 0; oi < order.length; oi++) {
      var g = groups[order[oi]];
      var flat = [];
      for (var r = 0; r < g.repeats; r++) {
        for (var ui = 0; ui < g.unitIds.length; ui++) flat.push(g.unitIds[ui]);
      }
      stackCount += flat.length;
      if (flat.length === 1) out.push('{' + g.fam + ':' + flat[0] + '}');
      else out.push('{' + g.fam + ':[' + flat.join(' ') + ']}');
    }
    return { tokens: out.concat(passthrough), stackCount: stackCount };
  }

  function addRandomPartsForItemType(itemType, manufacturer, weaponType, appendOnly, targetEl, genOpts) {
    genOpts = genOpts || getModdedGenOptionsFromUI();
    var resolved = resolveModdedGenBuildItemType(genOpts, itemType, weaponType);
    itemType = resolved.itemType;
    weaponType = resolved.weaponType;
    var out = targetEl || getGuidedOutputEl();
    if (!out) return;
    if (!appendOnly && !genOpts.appendMode) {
      out.value = '';
    }
    var addedSlots = 0;
    if (genOpts.fillSlots !== false) {
      addedSlots = addRandomLegitSlots(itemType, manufacturer, weaponType, out, { skipOptional: true });
    }
    var stackTokens = [];
    var stackCount = 0;
    var packedStacks = null;
    if (genOpts.includeStacks !== false) {
      stackTokens = pickModdedPresetStackTokens(itemType, weaponType, genOpts);
      var validStacks = [];
      for (var si = 0; si < stackTokens.length; si++) {
        if (isTokenValidForModdedGenItemType(stackTokens[si], itemType)) validStacks.push(stackTokens[si]);
      }
      packedStacks = packModdedStackTokens(validStacks);
      for (var pi = 0; pi < packedStacks.tokens.length; pi++) {
        appendToOutCode(packedStacks.tokens[pi], out);
      }
      stackCount = packedStacks.stackCount;
    }
    setModdedGenStatus(
      'Added ' + addedSlots + ' base part(s)'
      + (stackCount ? (' + ' + stackCount + ' stacked stat id(s)'
        + (packedStacks && packedStacks.tokens.length ? (' in ' + packedStacks.tokens.length + ' packed token(s)') : '')) : '')
      + ' (' + itemType + ').'
    );
  }

  function syncModdedGenFloatingOutput() {
    syncGuidedFloatingOutputFromDeser();
  }

  function runModdedGenBuild(ctx, genOpts, useAppend, targetOut) {
    try { window.__CC_LAST_CODE_TARGET = 'guided'; } catch (_) {}
    addRandomPartsForItemType(ctx.itemType, ctx.manufacturer, ctx.weaponType, useAppend, targetOut, genOpts);
    try { if (typeof window.refreshGuidedOutput === 'function') window.refreshGuidedOutput(); } catch (_) {}
    try { if (typeof window.refreshGuidedOutputPreview === 'function') window.refreshGuidedOutputPreview(); } catch (_) {}
    try { if (typeof window.refreshImportedInspector === 'function') window.refreshImportedInspector(); } catch (_) {}
    try { if (typeof window.refreshBuildStatsCore === 'function') window.refreshBuildStatsCore(); } catch (_) {}
    syncModdedGenFloatingOutput();
  }

  function scheduleModdedGenBuild(ctx, genOpts, useAppend, targetOut) {
    var syncAttempts = 0;
    function startWhenReady() {
      if (!moddedGenGuidedUiMatches(ctx) && syncAttempts < 8) {
        syncAttempts++;
        setModdedGenStatus('Syncing Guided Builder for ' + ctx.itemType + '…');
        applyGuidedGeneratorItemType(ctx.itemType, ctx.manufacturer, ctx.weaponType);
        dispatchModdedGenGuidedSync(ctx);
        return setTimeout(startWhenReady, 150);
      }
      whenGuidedSlotsReady(ctx.itemType, function () {
        runModdedGenBuild(ctx, genOpts, useAppend, targetOut);
      });
    }
    applyGuidedGeneratorItemType(ctx.itemType, ctx.manufacturer, ctx.weaponType);
    dispatchModdedGenGuidedSync(ctx);
    setTimeout(startWhenReady, ctx.deferUiMs || 60);
  }

  function normalizeGuidedItemTypeForGenerator(itemType, weaponType) {
    var it = String(itemType || '').trim();
    var wt = String(weaponType || '').trim();
    if (/^(Assault Rifle|Pistol|Shotgun|SMG|Sniper Rifle)$/i.test(it)) {
      if (!wt) wt = it;
      return { itemType: 'Weapon', weaponType: wt };
    }
    if (/^Heavy$/i.test(it)) return { itemType: 'Heavy Weapon', weaponType: 'Heavy Weapon' };
    if (/^Heavy Weapon$/i.test(it)) return { itemType: 'Heavy Weapon', weaponType: wt || 'Heavy Weapon' };
    if (/^Gadget$/i.test(it)) return { itemType: 'Gadget', weaponType: wt };
    return { itemType: it, weaponType: wt };
  }

  function applyGuidedGeneratorItemType(itemType, manufacturer, weaponType) {
    var norm = normalizeGuidedItemTypeForGenerator(itemType, weaponType);
    itemType = norm.itemType;
    weaponType = norm.weaponType;
    var guidedItem = byId('ccGuidedItemType');
    var guidedMan = byId('ccGuidedManufacturer');
    var guidedWt = byId('ccGuidedWeaponType');
    var stxItem = byId('stx_itemType');
    var stxMan = byId('stx_manufacturer');
    if (guidedItem) guidedItem.value = itemType;
    if (guidedMan && manufacturer) guidedMan.value = manufacturer;
    if (guidedWt) {
      if (itemType === 'Weapon' || itemType === 'Heavy Weapon') guidedWt.value = weaponType || '';
      else guidedWt.value = '';
    }
    if (stxItem) stxItem.value = itemType;
    if (stxMan && manufacturer && !isGuidedClassModItemType(itemType)) stxMan.value = manufacturer;
    try { if (typeof window.syncGuidedToSimple === 'function') window.syncGuidedToSimple(); } catch (_) {}
    try { if (typeof loadGuidedManufacturers === 'function') loadGuidedManufacturers(); } catch (_) {}
    try { if (typeof syncGuidedVisibility === 'function') syncGuidedVisibility(); } catch (_) {}
    if (itemType === 'Weapon') {
      try { refreshWeaponDropdowns(); } catch (_) {}
    } else if (GEAR_SLOTS_BY_CATEGORY[itemType]) {
      try { refreshGearDropdowns(itemType); } catch (_) {}
    }
    return { itemType: itemType, manufacturer: manufacturer, weaponType: weaponType };
  }

  function moddedGenGuidedUiMatches(ctx) {
    var gi = byId('ccGuidedItemType');
    var dom = gi ? String(gi.value || '').trim() : '';
    return dom === String(ctx && ctx.itemType || '').trim();
  }

  function dispatchModdedGenGuidedSync(ctx) {
    var guidedItem = byId('ccGuidedItemType');
    var guidedMan = byId('ccGuidedManufacturer');
    var guidedWt = byId('ccGuidedWeaponType');
    if (guidedItem) guidedItem.dispatchEvent(new Event('change'));
    if (guidedMan) guidedMan.dispatchEvent(new Event('change'));
    if (ctx && (ctx.itemType === 'Weapon' || ctx.itemType === 'Heavy Weapon') && guidedWt) {
      guidedWt.dispatchEvent(new Event('change'));
    }
  }

  function moddedGenNormalizeToken(tok) {
    return String(tok || '').trim().replace(/^"+|"+$/g, '');
  }

  function moddedGenResolvePartToken(tok) {
    var t = moddedGenNormalizeToken(tok);
    if (!t) return null;
    var all = [];
    try { if (window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS)) all = all.concat(window.STX_DATASET.ALL_PARTS); } catch (_) {}
    try { if (Array.isArray(window.ALL_PARTS)) all = all.concat(window.ALL_PARTS); } catch (_) {}
    for (var i = 0; i < all.length; i++) {
      var p = all[i];
      if (!p) continue;
      if (String(p.idRaw || p.idraw || '').trim() === t) return p;
      var brace = t.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
      if (brace && p.family != null && p.id != null
        && Number(p.family) === Number(brace[1]) && Number(p.id) === Number(brace[2])) return p;
    }
    return null;
  }

  function moddedGenTokenFamily(tok) {
    var t = moddedGenNormalizeToken(tok);
    var m = t.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
    return m ? Number(m[1]) : null;
  }

  function isTokenValidForModdedGenItemType(tok, itemType) {
    var it = String(itemType || '').trim();
    var t = moddedGenNormalizeToken(tok);
    var tl = t.toLowerCase();
    if (!t) return false;
    var fam = moddedGenTokenFamily(t);

    function isGrenadePart() {
      if (tl.indexOf('grenade_gadget') >= 0) return true;
      if (fam === 245) return true;
      if (typeof window.stxPartIsGrenadeKitDatasetPart === 'function') {
        var p = moddedGenResolvePartToken(t);
        if (p && window.stxPartIsGrenadeKitDatasetPart(p)) return true;
      }
      return false;
    }

    function isWeaponishPart() {
      if (/\.part_(barrel|magazine|scope|grip|stock|underbarrel|foregrip|bodyacc|barrelacc)_/i.test(tl)) return true;
      if (/(?:^|[^a-z0-9])(?:dad|jak|mal|tor|vla|ted|cov|bor|borg)_(?:ar|ps|sg|sm|sr|hw)\./i.test(tl)) return true;
      return false;
    }

    function isShieldPart() {
      if (tl.indexOf('shield') >= 0 || tl.indexOf('energy_shield') >= 0) return true;
      return fam === 246 || fam === 237 || fam === 248;
    }

    function isRepkitPart() {
      if (tl.indexOf('repair_kit') >= 0 || tl.indexOf('repkit') >= 0) return true;
      return fam === 243;
    }

    function isClassModPart() {
      if (tl.indexOf('classmod') >= 0) return true;
      return fam === 234;
    }

    function isEnhancementPart() {
      if (tl.indexOf('enhancement') >= 0) return true;
      return fam === 247;
    }

    if (/^Grenade$/i.test(it)) {
      if (isWeaponishPart() || isShieldPart() || isRepkitPart() || isClassModPart() || isEnhancementPart()) return false;
      if (isGrenadePart()) return true;
      return !/\.part_(barrel|magazine|scope|grip|stock)_/i.test(tl);
    }
    if (/^Shield$/i.test(it)) {
      if (isGrenadePart() || isWeaponishPart() || isRepkitPart() || isClassModPart()) return false;
      return isShieldPart() || (fam !== 245 && fam !== 243 && fam !== 234 && fam !== 247);
    }
    if (/^Repkit$/i.test(it)) {
      if (isGrenadePart() || isWeaponishPart() || isShieldPart() || isClassModPart()) return false;
      return isRepkitPart() || (fam !== 245 && fam !== 246 && fam !== 234 && fam !== 247);
    }
    if (/^Class Mod$/i.test(it)) {
      if (isGrenadePart() || isWeaponishPart() || isShieldPart() || isRepkitPart()) return false;
      return isClassModPart() || fam === 234 || (fam !== 245 && fam !== 246 && fam !== 243 && fam !== 247);
    }
    if (/^Enhancement$/i.test(it)) {
      if (isGrenadePart() || isWeaponishPart() || isShieldPart() || isRepkitPart() || isClassModPart()) return false;
      return isEnhancementPart() || fam === 247 || (fam !== 245 && fam !== 246 && fam !== 243 && fam !== 234);
    }
    if (/^(Weapon|Assault Rifle|Pistol|Shotgun|SMG|Sniper Rifle|Heavy Weapon|Heavy|Gadget)$/i.test(it)) {
      return !isGrenadePart() && !isShieldPart() && !isRepkitPart() && !isClassModPart() && !isEnhancementPart();
    }
    if (isGrenadePart() || isWeaponishPart()) return false;
    return true;
  }

  function resolveModdedGenBuildItemType(genOpts, itemType, weaponType) {
    var forced = String(genOpts && genOpts.itemType || '').trim();
    if (forced) {
      var normF = normalizeGuidedItemTypeForGenerator(forced, String(genOpts.weaponType || '').trim());
      return { itemType: normF.itemType, weaponType: normF.weaponType };
    }
    return normalizeGuidedItemTypeForGenerator(itemType, weaponType);
  }

  function randomFullBuild() {
    try {
      window.__CC_LAST_CODE_TARGET = 'guided';
      var genOpts = getModdedGenOptionsFromUI();
      setModdedGenStatus('Preparing generator…');
      var rarities = window.STX_RARITIES;
      if (!Array.isArray(rarities) || !rarities.length) {
        alert('STX_RARITIES not loaded.');
        return;
      }
      var out = byId('guidedOutputDeserialized');
      var existingCode = (out && out.value || '').trim();
      var familyId = parsePrefixFromCode(existingCode);
      var appendOnly = false;
      var itemType, manufacturer, weaponType;
      var forcedType = String(genOpts.itemType || '').trim();
      var forcedWeaponType = String(genOpts.weaponType || '').trim();
      var guidedMan = byId('ccGuidedManufacturer');
      var deferUiMs = 60;

      if (!forcedType && familyId && existingCode.indexOf('||') >= 0 && genOpts.appendMode) {
        var info = getItemTypeFromFamilyId(rarities, familyId);
        if (info && info.itemType) {
          appendOnly = true;
          itemType = info.itemType;
          manufacturer = info.manufacturer;
          weaponType = info.weaponType;
          if (/^(Assault Rifle|Pistol|Shotgun|SMG|Sniper Rifle)$/i.test(itemType)) weaponType = itemType;
          else if (/Heavy Weapon/i.test(itemType)) weaponType = 'Heavy Weapon';
          var normA = normalizeGuidedItemTypeForGenerator(itemType, weaponType);
          itemType = normA.itemType;
          weaponType = normA.weaponType;
        }
      }

      if (!appendOnly) {
        var stPick = getGuidedState();
        var useGuidedPick = !forcedType && String(stPick.itemType || '').trim() && String(stPick.manufacturer || '').trim();

        if (forcedType) {
          var forced = applyForcedModdedGenItemType(forcedType, forcedWeaponType, rarities, guidedMan);
          itemType = forced.itemType;
          manufacturer = forced.manufacturer;
          weaponType = forced.weaponType;
        } else if (useGuidedPick) {
          itemType = String(stPick.itemType).trim();
          manufacturer = String(stPick.manufacturer).trim();
          weaponType = String(stPick.weaponType || '').trim() || itemType;
          var normG = normalizeGuidedItemTypeForGenerator(itemType, weaponType);
          itemType = normG.itemType;
          weaponType = normG.weaponType;
        } else {
          var poolRows = rarities.filter(function (r) {
            var it = String(r && r.itemType || '').trim();
            return /^(Assault Rifle|Pistol|Shotgun|SMG|Sniper Rifle|Heavy Weapon|Shield|Grenade|Repkit|Class Mod|Enhancement|Gadget)$/i.test(it);
          });
          if (!poolRows.length) poolRows = rarities;
          var pick = poolRows[Math.floor(Math.random() * poolRows.length)];
          manufacturer = String(pick.manufacturer || '').trim();
          itemType = String(pick.itemType || '').trim();
          weaponType = itemType;
          if (/^(Assault Rifle|Pistol|Shotgun|SMG|Sniper Rifle)$/i.test(itemType)) weaponType = itemType;
          else if (/Heavy Weapon/i.test(itemType)) weaponType = 'Heavy Weapon';
          var normR = normalizeGuidedItemTypeForGenerator(itemType, weaponType);
          itemType = normR.itemType;
          weaponType = normR.weaponType;
          deferUiMs = 120;
        }
        if (out && !genOpts.appendMode) out.value = '';
      } else {
        var normE = normalizeGuidedItemTypeForGenerator(itemType, weaponType);
        itemType = normE.itemType;
        weaponType = normE.weaponType;
      }

      var ctx = {
        itemType: itemType,
        manufacturer: manufacturer,
        weaponType: weaponType,
        deferUiMs: deferUiMs
      };
      var useAppend = appendOnly && genOpts.appendMode;
      scheduleModdedGenBuild(ctx, genOpts, useAppend, out);
    } catch (err) {
      console.error('Random Full Build failed:', err);
      setModdedGenStatus('Generator failed — see console.');
      alert('Random modded item failed: ' + (err && err.message));
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
      var out = byId('guidedOutputDeserialized');
      var appendEl = byId('moddedGenAppendMode');
      if (out && !(appendEl && appendEl.checked)) out.value = '';
      setModdedGenStatus('Roll ' + (i + 1) + ' / ' + count + '…');
      randomFullBuild();
      i++;
      if (i < count) setTimeout(step, 950);
    }
    step();
  }

  window.randomModdedBuild = randomFullBuild;

  window.randomFullBuild = randomFullBuild;
  window.randomFullBuildBatch = randomFullBuildBatch;
  window.refreshAllGuidedSlotPreviews = refreshAllGuidedSlotPreviews;
  window.syncGuidedVisibility = syncGuidedVisibility;
  if (typeof refreshGuidedOutput === 'function') {
    window.refreshGuidedOutput = refreshGuidedOutput;
    window.__ccRefreshGuidedOutput = refreshGuidedOutput;
  }
  window.__ccHydrateGuidedSlotsFromSimpleState = hydrateGuidedSlotsFromSimpleState;
  window.__ccSyncGuidedVisibility = syncGuidedVisibility;
})();