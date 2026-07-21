/**
 * Legit Builder: decode @U serial via STX bridge (iframe or inline WASM, enrichResolved) + map resolvedParts to manifest + computeLegitValidationState (data checks).
 * Depends: LegitBuilderApi (legacy/legit-builder.html), decodeSerialsViaBridge (cc-stx-decoder-bridge.js), computeSimpleBuilderItemSlug (cc-item-slug.js).
 */
(function () {
  'use strict';

  function escapeHtmlLegit(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatLegitDetailsHtml(details) {
    if (!details || !details.length) return '';
    var metaRe = /^(Parts:|Sources:|Stats by|Stats known|Missing stat examples|Level range:|Item level:|Rules passed:|Spawn claim:)/;
    var html = '';
    var di;
    for (di = 0; di < details.length; di++) {
      var line = details[di];
      html += '<div class="v-detail-line' + (metaRe.test(line) ? ' v-detail-meta' : '') + '">' + escapeHtmlLegit(line) + '</div>';
    }
    return html;
  }

  function canonicalType(type) {
    var raw = String(type || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    var map = {
      ps: 'pistol', pistol: 'pistol', sg: 'shotgun', shotgun: 'shotgun', sm: 'smg', smg: 'smg',
      sr: 'sniper', sniper: 'sniper', 'sniper rifle': 'sniper',
      ar: 'assault rifle', 'assault rifle': 'assault rifle',
      hw: 'heavy weapon', 'heavy weapon': 'heavy weapon',
      grenade: 'grenade', 'grenade gadget': 'grenade', rk: 'repkit', repkit: 'repkit', 'repair kit': 'repkit',
      cm: 'class mod', 'class mod': 'class mod', classmod: 'class mod',
      en: 'enhancement', enhancement: 'enhancement', gadget: 'enhancement',
      'energy shield': 'shield', 'armor shield': 'shield', shield: 'shield'
    };
    return map[raw] || raw;
  }

  function buildSimpleStateFromDecode(result) {
    var ct = canonicalType(result.itemType || '');
    var man = result.manufacturer;
    if (!man) return null;
    if (ct === 'pistol' || ct === 'shotgun' || ct === 'assault rifle' || ct === 'smg' || ct === 'sniper' || ct === 'heavy weapon') {
      var disp = { pistol: 'Pistol', shotgun: 'Shotgun', 'assault rifle': 'Assault Rifle', smg: 'SMG', sniper: 'Sniper Rifle', 'heavy weapon': 'Heavy Weapon' };
      return { manufacturer: man, itemType: 'Weapon', weaponType: disp[ct] || result.itemType };
    }
    if (ct === 'shield' || ct === 'energy shield' || ct === 'armor shield') return { manufacturer: man, itemType: 'Shield', weaponType: '' };
    if (ct === 'grenade') return { manufacturer: man, itemType: 'Grenade', weaponType: '' };
    if (ct === 'repkit' || ct === 'repair kit') return { manufacturer: man, itemType: 'Repkit', weaponType: '' };
    if (ct === 'enhancement') return { manufacturer: man, itemType: 'Enhancement', weaponType: '' };
    if (ct === 'class mod') return { manufacturer: man, itemType: 'Class Mod', weaponType: '' };
    return null;
  }

  var PT_TO_SLOT = {
    rarity: 'rarity', body: 'body', barrel: 'barrel', magazine: 'mag', scope: 'scope',
    grip: 'grip', foregrip: 'foregrip', underbarrel: 'underbarrel', shield: 'shield', multi: 'multi',
    'body accessory': 'body_acc', 'barrel accessory': 'barrel_acc', 'magazine acc.': 'magazine_acc',
    'scope accessory': 'scope_acc', 'body element': 'body_ele', 'sec. element': 'secondary_ele',
    'primary element': 'primary_ele', 'secondary ammo': 'secondary_ammo', 'body bolt': 'body_bolt',
    'body mag': 'body_mag', firmware: 'firmware', endgame: 'endgame', unique: 'unique',
    element: 'element', payload: 'payload', 'class mod': 'class_mod', 'stat mod 1': 'stat',
    'stat mod 2': 'stat2', 'stat mod 3': 'stat3', 'pearl element': 'pearl_elem', 'pearl stat': 'pearl_stat',
    'name+skin': 'class_mod', 'name and skin': 'class_mod', skill: 'stat', perk: 'stat',
    core: 'core_augment',
    'stat group 1': 'stat', 'stat group 2': 'stat2', 'stat group 3': 'stat3',
    'core augment': 'core_augment', 'primary augment': 'primary_augment', 'secondary augment': 'secondary_augment',
    'payload augment': 'payload_augment', 'stat augment': 'stat_augment', curative: 'curative',
    'turret weapon': 'turret_weapon', 'active augment': 'active_augment', 'enemy augment': 'enemy_augment'
  };

  function partTypeToSlotKey(partType) {
    var k = String(partType || '').toLowerCase().trim();
    if (PT_TO_SLOT[k]) return PT_TO_SLOT[k];
    if (/^rarity/i.test(k)) return 'rarity';
    if (/barrel/i.test(k) && !/accessory/i.test(k)) return 'barrel';
    if (/magazine|^mag\b/i.test(k)) return 'mag';
    if (/^name\+skin|^name and skin/i.test(k)) return 'class_mod';
    if (/^skill\b|^perk\b/i.test(k)) return 'stat';
    if (/^stat\s*mod\s*2|stat_group\s*2|stat group 2/i.test(k)) return 'stat2';
    if (/^stat\s*mod\s*3|stat_group\s*3|stat group 3/i.test(k)) return 'stat3';
    if (/^stat\s*mod|stat_group\s*1|stat group 1/i.test(k)) return 'stat';
    if (/^core\b/i.test(k) || /^core\s*augment/i.test(k)) return 'core_augment';
    if (/^primary\s*augment/i.test(k)) return 'primary_augment';
    if (/^secondary\s*augment/i.test(k)) return 'secondary_augment';
    if (/^payload\s*augment/i.test(k)) return 'payload_augment';
    if (/^stat\s*augment/i.test(k)) return 'stat_augment';
    if (/^curative/i.test(k)) return 'curative';
    if (/^turret\s*weapon/i.test(k)) return 'turret_weapon';
    if (/^active\s*augment/i.test(k)) return 'active_augment';
    if (/^enemy\s*augment/i.test(k)) return 'enemy_augment';
    return '';
  }

  /**
   * Decoder often emits part_type "Body" for body_bolt / body_mag rows. They then map into the
   * manifest `body` bucket; findOptionMatch can fuzzy-hit part_body vs the real body row → bulk
   * false "[composition] … body" (seen on 600+ Daedalus AR rows).
   */
  function refineSlotKeyIfBodyGeneric(row, sk) {
    if (sk !== 'body' || !row) return sk;
    var acTrim = String(row.alpha_code || '').trim();
    var dot = acTrim.lastIndexOf('.');
    var tail = dot >= 0 ? acTrim.slice(dot + 1).trim().toLowerCase() : '';
    if (!tail && /^(?:part_|comp_|leg_)/i.test(acTrim)) tail = acTrim.toLowerCase();
    var nm = String(row.name || '').toLowerCase();
    var blob = tail + '|' + nm;
    if (/body_bolt/i.test(blob)) return 'body_bolt';
    if (/body_mag/i.test(blob)) return 'body_mag';
    if (/body_acc/i.test(blob)) return 'body_acc';
    if (/body_ele|bodyelement/i.test(blob)) return 'body_ele';
    return sk;
  }

  /**
   * Shared non-weapon families frequently decode without part_type and their legacy manifests only
   * contain rarity/unique rows. Infer the semantic NCS slot from the canonical alpha id; the caller
   * still gates this against the item's NCS slot list before accepting a synthetic option.
   */
  function inferNonWeaponSlotFromPartId(row, manifestItem) {
    if (!row || !manifestItem) return '';
    var slug = String(manifestItem.slug || '').toLowerCase();
    if (!/(?:grenade|repair_kit)/.test(slug)) return '';
    var ac = String(row.alpha_code || '').trim().toLowerCase();
    var dot = ac.lastIndexOf('.');
    var part = dot >= 0 ? ac.slice(dot + 1) : ac;
    if (!part) return '';
    if (/^comp_/.test(part)) return 'rarity';
    if (/part_firmware_/.test(part)) return 'firmware';
    if (/part_endgame_/.test(part)) return 'endgame';
    if (/part_pearl_(?:elem|element)/.test(part)) return 'pearl_elem';
    if (/part_pearl_stat/.test(part)) return 'pearl_stat';

    if (/grenade/.test(slug)) {
      if (/^part_stat_/.test(part)) return 'stat_augment';
      if (/^part_(?:payload_|0[1-7]_|spinning_blade)/.test(part)) return 'payload';
      if (/^part_(?:payload_augment|augment_payload)/.test(part)) return 'payload_augment';
      if (/^part_(?:element_|corrosive$|cryo$|fire$|radiation$|shock$|normal$)/.test(part)) return 'element';
      if (/^part_(?:jak|mal|tor|ted|vla|dad|ord|bor)$/.test(part)) return 'body';
      /* Manufacturer-local named grenade body/unique rows live in manifest `unknown`. */
      if (ac.indexOf('grenade_gadget.') >= 0 && !/^part_slot_/.test(part)) return 'body';
    }

    if (/repair_kit/.test(slug)) {
      if (/^part_payload_/.test(part)) return 'payload';
      if (/^part_element_/.test(part)) return 'element';
      /* Repair-kit augment Comp rules share generic comp names with other item classes.
         Keep these unmapped until rules are keyed by inventory family; otherwise natural
         common kits inherit weapon primary_augment max 0 and false-fail. */
      if (/^part_(?:augment_unique_|aug_)/.test(part)) return '';
      if (/^part_(?:jak|mal|tor|ted|vla|dad|ord|bor)$/.test(part)) return 'body';
    }
    return '';
  }

  function getNcsSlotsForManifestItem(manifestItem) {
    try {
      if (window.LegitBuilderApi && typeof window.LegitBuilderApi.getNcsInfo === 'function') {
        var ncs = window.LegitBuilderApi.getNcsInfo(manifestItem && manifestItem.slug);
        return ncs && Array.isArray(ncs.ncs_slots) ? ncs.ncs_slots : null;
      }
    } catch (_) {}
    return null;
  }

  function nonWeaponSyntheticBucket(manifestItem, slotKey, row) {
    if (!manifestItem || !slotKey || !row) return null;
    if (!/(?:grenade|repair_kit)/.test(String(manifestItem.slug || '').toLowerCase())) return null;
    var ncsSlots = getNcsSlotsForManifestItem(manifestItem);
    var allowed =
      !ncsSlots ||
      !ncsSlots.length ||
      !window.LegitBuilderApi ||
      typeof window.LegitBuilderApi.slotNameAllowedOnNcs !== 'function' ||
      window.LegitBuilderApi.slotNameAllowedOnNcs(slotKey, ncsSlots);
    if (!allowed) return null;
    var ac = String(row.alpha_code || '').trim();
    var dot = ac.lastIndexOf('.');
    var name = (dot >= 0 ? ac.slice(dot + 1) : ac).trim().toLowerCase();
    if (!name || !/^part_/.test(name)) return null;
    var keyHit = String(row.key || '');
    var idx = Number((keyHit.match(/:(\d+)$/) || [])[1]);
    return {
      key: slotKey,
      slot: {
        options: [
          {
            index: Number.isFinite(idx) ? idx : -1,
            name: name,
            in_pool: false
          }
        ]
      }
    };
  }

  function normPartName(s) {
    return String(s || '').toLowerCase().replace(/\s+/g, '_').replace(/^part_|^comp_/i, '').trim();
  }

  /**
   * Pick manifest option for a decoded row. Must prefer the most specific id (e.g. part_barrel_01_hellfire over
   * part_barrel_01) — otherwise inv dependencytags for the real part are never seen and cheats do not fail.
   */
  /**
   * Natural / bulk legitimacy match: exact + normalized + underscore-prefix only.
   * No substring fuzzy and no options[0] defaults — those mapped cross-mfr / illegal parts
   * onto the item’s list and produced false OK (data).
   */
  function findOptionMatchNatural(options, row, slotKey) {
    if (!options || !row || row.unresolved) return null;
    var ac = String(row.alpha_code || '');
    var dot = ac.lastIndexOf('.');
    var compPart = dot >= 0 ? ac.slice(dot + 1) : '';
    var nameFromRow = String(row.name || '').trim();
    var pt = String(row.part_type || '').toLowerCase();
    var i;
    var o;
    var best = null;
    var bestKey = -1;
    var bestLen = -1;
    function consider(o2, pri) {
      var len = o2 && o2.name ? String(o2.name).length : 0;
      if (pri > bestKey || (pri === bestKey && len > bestLen)) {
        best = o2;
        bestKey = pri;
        bestLen = len;
      }
    }
    for (i = 0; i < options.length; i++) {
      o = options[i];
      if (!o || !o.name) continue;
      if (o.name === compPart || o.name === nameFromRow) consider(o, 4000000);
      else if (normPartName(o.name) === normPartName(nameFromRow)) consider(o, 3000000);
      else if (compPart && normPartName(o.name) === normPartName(compPart)) consider(o, 3000000);
    }
    if (best) return best;
    if (compPart) {
      var nc = normPartName(compPart);
      for (i = 0; i < options.length; i++) {
        o = options[i];
        if (!o || !o.name) continue;
        var no = normPartName(o.name);
        if (!no) continue;
        if (nc.indexOf(no) === 0 && (nc.length === no.length || nc.charAt(no.length) === '_')) {
          consider(o, 2000000 + no.length);
        }
      }
    }
    if (best) return best;
    /* Single-option slots only when the part type clearly belongs there (no cross-slot default). */
    if (
      (slotKey === 'stat_group1' || slotKey === 'stat_group2' || slotKey === 'stat_group3') &&
      options.length === 1 &&
      /skill|perk|stat/i.test(pt)
    ) {
      return options[0];
    }
    if (slotKey === 'class_mod' && options.length === 1 && (/body|name\+skin|name and skin/i.test(pt) || /body|grav|leg|asm/i.test(compPart + nameFromRow))) {
      return options[0];
    }
    return null;
  }

  function findOptionMatch(options, row, slotKey) {
    if (!options || !row || row.unresolved) return null;
    var ac = String(row.alpha_code || '');
    var dot = ac.lastIndexOf('.');
    var compPart = dot >= 0 ? ac.slice(dot + 1) : '';
    var nameFromRow = String(row.name || '').trim();
    var pt = String(row.part_type || '').toLowerCase();
    var i;
    var o;
    var best = null;
    var bestKey = -1;
    var bestLen = -1;
    function consider(o2, pri) {
      var len = o2 && o2.name ? String(o2.name).length : 0;
      if (pri > bestKey || (pri === bestKey && len > bestLen)) {
        best = o2;
        bestKey = pri;
        bestLen = len;
      }
    }
    for (i = 0; i < options.length; i++) {
      o = options[i];
      if (!o || !o.name) continue;
      if (o.name === compPart || o.name === nameFromRow) consider(o, 4000000);
      else if (normPartName(o.name) === normPartName(nameFromRow)) consider(o, 3000000);
      else if (compPart && normPartName(o.name) === normPartName(compPart)) consider(o, 3000000);
    }
    if (best) return best;
    if (compPart) {
      var nc = normPartName(compPart);
      for (i = 0; i < options.length; i++) {
        o = options[i];
        if (!o || !o.name) continue;
        var no = normPartName(o.name);
        if (!no) continue;
        if (nc.indexOf(no) === 0 && (nc.length === no.length || nc.charAt(no.length) === '_')) {
          consider(o, 2000000 + no.length);
        }
      }
    }
    if (best) return best;
    for (i = 0; i < options.length; i++) {
      o = options[i];
      if (!o || !o.name) continue;
      if (compPart && (nameFromRow.indexOf(o.name) >= 0 || o.name.indexOf(compPart) >= 0)) {
        consider(o, 1000000 + String(o.name).length);
      }
      if (compPart && normPartName(compPart).indexOf(normPartName(o.name)) >= 0) {
        consider(o, 500000 + String(o.name).length);
      }
    }
    if (best) return best;
    if (slotKey === 'class_mod' && options.length > 0 && (/body|name\+skin|name and skin/i.test(pt) || /body|grav|leg|asm/i.test(compPart + nameFromRow))) {
      return options[0];
    }
    /* Never default stat slots to options[0]: that maps the wrong manifest row, so Legit uses the first
       option’s name before invDumpKey and bogus “OK” passes while allowlist/prereq still fail. */
    if (
      (slotKey === 'stat_group1' || slotKey === 'stat_group2' || slotKey === 'stat_group3') &&
      options.length === 1 &&
      /skill|perk|stat/i.test(pt)
    ) {
      return options[0];
    }
    if (slotKey === 'firmware' && options.length > 0 && /firmware/i.test(pt)) {
      return options[0];
    }
    if ((slotKey === 'payload' || slotKey === 'payload_augment' || slotKey === 'stat_augment') && options.length > 0 && /payload|stat\s*augment/i.test(pt)) {
      return options[0];
    }
    if ((slotKey === 'primary_augment' || slotKey === 'secondary_augment') && options.length > 0 && /augment/i.test(pt)) {
      return options[0];
    }
    return null;
  }

  function getManifestSlot(manifestItem, sk) {
    if (!manifestItem || !manifestItem.slots) return null;
    if (manifestItem.slots[sk]) return { key: sk, slot: manifestItem.slots[sk] };
    if (sk === 'mag' && manifestItem.slots.magazine) return { key: 'magazine', slot: manifestItem.slots.magazine };
    if (sk === 'magazine' && manifestItem.slots.mag) return { key: 'mag', slot: manifestItem.slots.mag };
    if (sk === 'stat' && manifestItem.slots.stat_group1) return { key: 'stat_group1', slot: manifestItem.slots.stat_group1 };
    if (sk === 'stat2' && manifestItem.slots.stat_group2) return { key: 'stat_group2', slot: manifestItem.slots.stat_group2 };
    if (sk === 'stat3' && manifestItem.slots.stat_group3) return { key: 'stat_group3', slot: manifestItem.slots.stat_group3 };
    if (sk === 'body' && manifestItem.slots.class_mod) return { key: 'class_mod', slot: manifestItem.slots.class_mod };
    if (sk === 'shield' && manifestItem.slots.hyperion_secondary_acc) return { key: 'hyperion_secondary_acc', slot: manifestItem.slots.hyperion_secondary_acc };
    if (sk === 'multi' && manifestItem.slots.tediore_acc) return { key: 'tediore_acc', slot: manifestItem.slots.tediore_acc };
    if (sk === 'stat_augment' && manifestItem.slots.stat_group1) return { key: 'stat_group1', slot: manifestItem.slots.stat_group1 };
    return null;
  }

  /** Fallback part_type when building synthetic inv rows (manifest slot key → PARTS_DB-style label). */
  var MANIFEST_SLOT_SYNTH_PART_TYPE = {
    rarity: 'Rarity',
    body: 'Body',
    barrel: 'Barrel',
    mag: 'Magazine',
    magazine: 'Magazine',
    scope: 'Scope',
    grip: 'Grip',
    barrel_acc: 'Barrel accessory',
    body_acc: 'Body accessory',
    scope_acc: 'Scope accessory',
    magazine_acc: 'Magazine acc.',
    foregrip: 'Foregrip',
    underbarrel: 'Underbarrel',
    firmware: 'Firmware',
    endgame: 'Endgame',
    unique: 'Unique',
    body_ele: 'Body element',
    primary_ele: 'Primary element',
    secondary_ele: 'Sec. element',
    secondary_ammo: 'Secondary ammo',
    body_bolt: 'Body bolt',
    body_mag: 'Body mag',
    element: 'Element',
    hyperion_secondary_acc: 'Shield',
    tediore_acc: 'Multi',
    payload: 'Payload',
    payload_augment: 'Payload augment',
    stat_augment: 'Stat augment',
    primary_augment: 'Primary augment',
    secondary_augment: 'Secondary augment',
    core_augment: 'Core augment',
    curative: 'Curative',
    turret_weapon: 'Turret weapon',
    active_augment: 'Active augment',
    enemy_augment: 'Enemy augment',
    class_mod: 'Body',
    stat_group1: 'Stat mod 1',
    stat_group2: 'Stat mod 2',
    stat_group3: 'Stat mod 3'
  };

  function synthInvRowForManifestSlot(slotKey, pp) {
    var ik = String((pp && pp.invDumpKey) || (pp && pp.name) || '').trim();
    if (!ik) ik = 'unknown';
    var ac = ik.indexOf('.') >= 0 ? ik : 'x.' + ik;
    var pt = MANIFEST_SLOT_SYNTH_PART_TYPE[slotKey] || 'Body';
    return {
      alpha_code: ac,
      part_type: pt,
      name: (pp && pp.name) || '',
      unresolved: false
    };
  }

  /**
   * Bulk mapped: guns allow at most one manifest option per slot — bucket by slot only. Class mods
   * (etc.) legitimately have several manifest options under one slot key (partition by option).
   * The save editor does not treat “two resolved rows for one CM option” as a hard fail: decode can
   * repeat a row or vary alpha vs name while still one pick — so **weapons only** apply a strict
   * same-option identity check; CM skips it (v20 falsely failed ~1k+ banks on stat_group1).
   */
  function buildBulkMappedCompositionSynth(mappedRowsAll, selectedParts, slotFirstRow, opts) {
    opts = opts || {};
    var partitionByOption = opts.partitionByOptionIndex === true;
    var slotToCanon = Object.create(null);
    var slotToRow = Object.create(null);
    var conflictSlots = Object.create(null);
    var hardConflictSlots = Object.create(null);
    function isNamedBarrelKey(key) {
      var k = String(key || '').toLowerCase().split('.').pop();
      if (!/^part_(?:unique_)?barrel/.test(k)) return false;
      /* Generic barrel cores are not enough to distinguish PARTS_DB ambiguity. */
      return !/^part_barrel_0[12]$/.test(k);
    }
    var djx;
    for (djx = 0; djx < mappedRowsAll.length; djx++) {
      var mr = mappedRowsAll[djx];
      if (!mr || !mr.slotKey || !mr.row || mr.row.unresolved) continue;
      var dsk = mr.slotKey;
      var pp = selectedParts[dsk];
      if (!pp) continue;
      var srcRow = mr.row;
      var canon =
        mr.optionIndex != null && mr.optionIndex !== ''
          ? 'i:' + String(mr.optionIndex)
          : (function () {
              var sig = extractInvKeyFromResolvedRow(srcRow);
              if (!sig) sig = String(pp.invDumpKey || srcRow.name || pp.name || '').trim().toLowerCase();
              return 's:' + sig;
            })();
      var partitionKey = partitionByOption ? dsk + '\0' + canon : dsk;
      if (slotToCanon[partitionKey] == null) {
        slotToCanon[partitionKey] = canon;
        slotToRow[partitionKey] = srcRow;
        continue;
      }
      if (slotToCanon[partitionKey] === canon) {
        if (!partitionByOption) {
          var prevSame = slotToRow[partitionKey];
          var kPrevS = extractInvKeyFromResolvedRow(prevSame) || String(pp.invDumpKey || '').toLowerCase();
          var kNowS = extractInvKeyFromResolvedRow(srcRow) || String(pp.invDumpKey || '').toLowerCase();
          if (kPrevS && kNowS && kPrevS === kNowS) continue;
          var npS = normPartName(prevSame.name);
          if (npS && npS === normPartName(srcRow.name)) continue;
          conflictSlots[dsk] = true;
          if (
            dsk === 'barrel' &&
            String(prevSame.part_type || '').toLowerCase() === 'barrel' &&
            String(srcRow.part_type || '').toLowerCase() === 'barrel' &&
            isNamedBarrelKey(kPrevS) &&
            isNamedBarrelKey(kNowS)
          ) {
            hardConflictSlots[dsk] = true;
          }
        }
        continue;
      }
      var prevRow = slotToRow[partitionKey];
      var kPrev = extractInvKeyFromResolvedRow(prevRow) || String(pp.invDumpKey || '').toLowerCase();
      var kNow = extractInvKeyFromResolvedRow(srcRow) || String(pp.invDumpKey || '').toLowerCase();
      if (kPrev && kNow && kPrev === kNow) continue;
      var np = normPartName(prevRow.name);
      if (np && np === normPartName(srcRow.name)) continue;
      conflictSlots[dsk] = true;
      if (
        dsk === 'barrel' &&
        String(prevRow.part_type || '').toLowerCase() === 'barrel' &&
        String(srcRow.part_type || '').toLowerCase() === 'barrel' &&
        isNamedBarrelKey(kPrev) &&
        isNamedBarrelKey(kNow)
      ) {
        hardConflictSlots[dsk] = true;
      }
    }
    var ckeys = Object.keys(conflictSlots);
    if (ckeys.length) {
      return {
        synth: [],
        conflictLine:
          'Multiple different parts map to the same manifest slot: ' + ckeys.sort().join(', '),
        hardConflictLine: hardConflictSlots.barrel
          ? 'Conflicting named barrel parts map to the same barrel slot'
          : ''
      };
    }
    var orderedSlots = [];
    var seenOrd = Object.create(null);
    for (djx = 0; djx < mappedRowsAll.length; djx++) {
      var mr2 = mappedRowsAll[djx];
      if (!mr2 || !mr2.slotKey) continue;
      var sk2 = mr2.slotKey;
      if (seenOrd[sk2] || !selectedParts[sk2]) continue;
      seenOrd[sk2] = true;
      orderedSlots.push(sk2);
    }
    Object.keys(selectedParts).forEach(function (sk) {
      if (!seenOrd[sk]) orderedSlots.push(sk);
    });
    var synth = [];
    for (djx = 0; djx < orderedSlots.length; djx++) {
      var sk3 = orderedSlots[djx];
      var pp = selectedParts[sk3];
      if (!pp) continue;
      /* partition keys use \0+canon for non-weapons — resolve synth row from first slot mapping */
      var rowUse = slotFirstRow[sk3] || slotToRow[sk3];
      if (rowUse && !rowUse.unresolved) {
        synth.push({
          alpha_code: rowUse.alpha_code,
          part_type: rowUse.part_type,
          name: rowUse.name != null ? rowUse.name : pp.name,
          weapon_type_or_category: rowUse.weapon_type_or_category,
          serial: rowUse.serial,
          unresolved: false
        });
      } else {
        synth.push(synthInvRowForManifestSlot(sk3, pp));
      }
    }
    return { synth: synth, conflictLine: '', hardConflictLine: '' };
  }

  function matchResolvedToManifest(manifestItem, resolvedParts, matchOpts) {
    matchOpts = matchOpts || {};
    var naturalMatch = matchOpts.naturalMatch === true;
    var matcher = naturalMatch ? findOptionMatchNatural : findOptionMatch;
    var selectedParts = {};
    var slotOrder = [];
    var slotFirstRow = Object.create(null);
    var mappedRowsAll = [];
    if (!manifestItem || !manifestItem.slots || !Array.isArray(resolvedParts)) {
      return { selectedParts: selectedParts, slotOrder: slotOrder, slotFirstRow: slotFirstRow, mappedRowsAll: mappedRowsAll };
    }
    var seenSlot = Object.create(null);
    var i;
    var row;
    var sk;
    var bucket;
    var opt;
    for (i = 0; i < resolvedParts.length; i++) {
      row = resolvedParts[i];
      slotOrder[i] = undefined;
      if (!row || row.unresolved) continue;
      sk = partTypeToSlotKey(row.part_type);
      if (!sk) sk = partTypeToSlotKey(row.weapon_type_or_category || '');
      sk = refineSlotKeyIfBodyGeneric(row, sk);
      /* Prefer part id over decoder part_type — named legendary foregrips/underbarrels
         often land as Grip/Barrel and miss the real Comp slot. */
      (function rekeyFromPartId() {
        var ac0 = String(row.alpha_code || '').trim();
        var nm0 = String(row.name || '').trim();
        var bare0 = '';
        var d0 = ac0.lastIndexOf('.');
        if (d0 >= 0) bare0 = ac0.slice(d0 + 1).trim();
        else if (/^(?:part_|comp_|leg_)/i.test(ac0)) bare0 = ac0;
        else bare0 = nm0;
        var bl = String(bare0 || '').toLowerCase();
        if (!bl) return;
        if (/^part_foregrip/i.test(bl)) sk = 'foregrip';
        else if (/^part_underbarrel/i.test(bl)) sk = 'underbarrel';
        else if (/^part_secondary_ammo/i.test(bl)) sk = 'secondary_ammo';
        else if (
          /^part_(?:unique_)?barrel/i.test(bl) &&
          !/licensed/i.test(bl) &&
          !/_acc/i.test(bl) &&
          !/^part_barrel_\d+_[a-d]$/i.test(bl)
        ) {
          /* Named/unique barrels (not barrel_02_a accessories). */
          sk = 'barrel';
        }
      })();
      if (!sk) sk = inferNonWeaponSlotFromPartId(row, manifestItem);
      if (!sk) continue;
      bucket = getManifestSlot(manifestItem, sk);
      if (!bucket) bucket = nonWeaponSyntheticBucket(manifestItem, sk, row);
      if (!bucket || !bucket.slot || !bucket.slot.options) continue;
      opt = matcher(bucket.slot.options, row, bucket.key);
      var forcedInvName = null;
      /* Same serial index can mean rarity on one item and barrel on another (e.g. DAD_SM
         59 = conglomerate rarity AND part_barrel_01_raiden). Once rarity is mapped, prefer
         the barrel option at that index so Comp barrel min is satisfied. */
      if (seenSlot.rarity && (sk === 'rarity' || /^comp_/i.test(String(row.name || row.alpha_code || '')))) {
        var keyHit = String(row.key || '').trim();
        var idFromKey = (keyHit.match(/:(\d+)$/) || [])[1];
        var bareTok = String((row.raw || '').match(/\{(\d+)\}/) || [])[1] || '';
        var partIdx = idFromKey || bareTok;
        var barrelBucket = getManifestSlot(manifestItem, 'barrel');
        if (barrelBucket && barrelBucket.slot && Array.isArray(barrelBucket.slot.options) && partIdx) {
          var wantIdx = Number(partIdx);
          var bOpt = null;
          for (var bi = 0; bi < barrelBucket.slot.options.length; bi++) {
            var bo = barrelBucket.slot.options[bi];
            if (bo && Number(bo.index) === wantIdx && /barrel/i.test(String(bo.name || ''))) {
              bOpt = bo;
              break;
            }
          }
          if (bOpt) {
            sk = 'barrel';
            bucket = barrelBucket;
            opt = bOpt;
            forcedInvName = String(bOpt.name || '').toLowerCase();
          }
        }
      }
      /* Legendary unique/named parts often exist only on the rarity composition allowlist,
         not on the base weapon manifest list. Still map them so Comp min/allowlist see them. */
      if (!opt) {
        var acProbe = String(row.alpha_code || '').trim();
        var nameProbe = String(row.name || '').trim();
        var bareProbe = '';
        var dotProbe = acProbe.lastIndexOf('.');
        if (dotProbe >= 0) bareProbe = acProbe.slice(dotProbe + 1).trim();
        else if (/^(?:part_|comp_|leg_)/i.test(acProbe)) bareProbe = acProbe;
        else bareProbe = nameProbe;
        var bareLower = String(bareProbe || '').toLowerCase();
        var allowSynth =
          !!bareLower &&
          (sk === 'barrel' ||
            sk === 'foregrip' ||
            sk === 'underbarrel' ||
            sk === 'grip' ||
            sk === 'scope' ||
            sk === 'secondary_ammo') &&
          /^part_/i.test(bareLower) &&
          !/licensed/i.test(bareLower);
        if (allowSynth) {
          opt = { index: -1, name: bareLower, in_pool: false };
        } else {
          continue;
        }
      }
      var slotKey = bucket.key;
      var acTrim = String(row.alpha_code || '').trim();
      var dotRow = acTrim.lastIndexOf('.');
      var tailFromAlpha = dotRow >= 0 ? acTrim.slice(dotRow + 1).trim() : '';
      var nameFromRowTrim = String(row.name || '').trim();
      var invDumpKey;
      if (tailFromAlpha) {
        invDumpKey = tailFromAlpha.toLowerCase();
      } else if (/^(?:part_|comp_|leg_)/i.test(acTrim)) {
        /* PARTS_DB sometimes uses bare ids (no family.prefix) — inv rows are keyed by that id. */
        invDumpKey = acTrim.toLowerCase();
      } else {
        invDumpKey = String(nameFromRowTrim || '').trim().toLowerCase();
      }
      if (forcedInvName) invDumpKey = forcedInvName;
      mappedRowsAll.push({
        slotKey: slotKey,
        row: row,
        optionIndex: opt.index,
        manifestName: opt.name,
        invDumpKey: invDumpKey || null
      });
      if (seenSlot[slotKey]) continue;
      seenSlot[slotKey] = true;
      slotFirstRow[slotKey] = row;
      /* Prefer decoded id for inv lookup (resolveInvPartMeta checks name before invDumpKey — wrong opt.name
         from fuzzy/legacy matching hid real stat rows). */
      var nameForInv = invDumpKey || nameFromRowTrim || opt.name;
      selectedParts[slotKey] = {
        index: opt.index,
        name: nameForInv,
        in_pool: opt.in_pool === true,
        slot: slotKey,
        invDumpKey: invDumpKey || null
      };
      slotOrder[i] = slotKey;
    }
    return { selectedParts: selectedParts, slotOrder: slotOrder, slotFirstRow: slotFirstRow, mappedRowsAll: mappedRowsAll };
  }

  /**
   * Parts decoded on the serial that are outside this item’s NCS base slot map or manifest slot
   * options. matchResolvedToManifest used to skip these silently — that produced false OK (data)
   * on modded banks (illegal extras ignored; only the legal subset was validated).
   */
  /**
   * Expand every part token in a deserialized serial into fam:id keys (lists keep duplicates).
   * Bare `{n}` uses itemTypeId; `{fam:id}` / `{fam:[…]}` keep the explicit family.
   */
  function expandSerializedPartKeys(rawSerial, itemTypeId) {
    var out = [];
    if (!rawSerial || itemTypeId == null || itemTypeId === '') return out;
    var s = String(rawSerial);
    var re = /\{(\d+)(?::(?:\[([\d\s,]+)\]|(\d+)))?\}/g;
    var m;
    while ((m = re.exec(s)) !== null) {
      var a = Number(m[1]);
      if (!Number.isFinite(a)) continue;
      if (m[2] != null && String(m[2]).trim() !== '') {
        var vals = String(m[2]).split(/[\s,]+/).filter(Boolean);
        var vi;
        for (vi = 0; vi < vals.length; vi++) {
          if (!/^\d+$/.test(vals[vi])) continue;
          out.push(String(a) + ':' + vals[vi]);
        }
      } else if (m[3] != null && String(m[3]).trim() !== '') {
        out.push(String(a) + ':' + String(m[3]));
      } else {
        out.push(String(itemTypeId) + ':' + String(a));
      }
    }
    return out;
  }

  function pickPartsDbRowForKey(key) {
    if (!window.PARTS_DB || !key) return null;
    var arr = window.PARTS_DB[key];
    if (!Array.isArray(arr) || !arr.length) return null;
    var i;
    var best = arr[0];
    for (i = 0; i < arr.length; i++) {
      var row = arr[i];
      if (!row) continue;
      var ac = String(row.alpha_code || '');
      if (/\.(?:part_|comp_|leg_)/i.test(ac) || /^(?:part_|comp_|leg_)/i.test(ac)) {
        best = row;
        break;
      }
    }
    return best;
  }

  function inventoryPrefixFromManifest(manifestItem) {
    if (!manifestItem || !manifestItem.slug) return '';
    try {
      if (typeof window.buildSlugPrefix === 'function') {
        var p = window.buildSlugPrefix(manifestItem.slug);
        if (p) return String(p).toUpperCase();
      }
      if (window.SLUG_TO_PREFIX && window.SLUG_TO_PREFIX[manifestItem.slug]) {
        return String(window.SLUG_TO_PREFIX[manifestItem.slug]).toUpperCase();
      }
    } catch (_) {}
    return '';
  }

  /** Weapon-style inventory prefix from alpha (MAL_SM, JAK_SG, …). Empty for shared pools. */
  function weaponInventoryPrefixFromAlpha(alphaCode) {
    var m = String(alphaCode || '')
      .trim()
      .match(/^([A-Za-z]{2,4}_[A-Za-z]{2})\./);
    return m ? m[1].toUpperCase() : '';
  }

  /**
   * Shared gadget / classmod / element pools normally encode as `{fam:id}` with fam ≠ item root.
   * Those are NOT wrong-root (.be allows ClassMod 234, Shield 246, Grenade 245, Weapon elements, etc.).
   */
  function isSharedPoolAlpha(alphaCode) {
    var head = String(alphaCode || '')
      .split('.')[0]
      .trim()
      .toLowerCase();
    return (
      head === 'weapon' ||
      head === 'classmod' ||
      head === 'shield' ||
      head === 'enhancement' ||
      head === 'grenade_gadget' ||
      head === 'repair_kit' ||
      head === 'energy_shield' ||
      head === 'armor_shield' ||
      head === 'turret_gadget' ||
      head === 'terminal_gadget'
    );
  }

  /**
   * save-editor.be wrong-root allowlists (from legit-builder.js validateSerialCore):
   * - Weapon ele/pearl slots may use generic Weapon root (serial 1)
   * - Heavy weapons may use shared firmware roots 234/244/245 (ClassMod/Enhancement pools)
   * - Classmod/enhancement may use base-comp roots 234,237,243–248
   * - Shields may use shield / energy_shield / armor_shield roots
   * - Grenade/repair/turret/terminal / *_hw may use their generic gadget roots
   * Cosmetics root 7 is ignored (skins), same as unresolved unknowns.
   */
  var BE_CM_ENH_GENERIC_ROOTS = {
    234: true,
    237: true,
    243: true,
    244: true,
    245: true,
    246: true,
    247: true,
    248: true
  };

  function isHeavyWeaponSlug(slug) {
    return /_hw$|_heavy_weapon|heavy_weapon_gadget/.test(String(slug || '').toLowerCase());
  }

  function isFirmwareLikePart(slot, invKey, alphaCode) {
    var blob = String(slot || '') + ' ' + String(invKey || '') + ' ' + String(alphaCode || '');
    return /firmware/i.test(blob);
  }

  function itemAllowsUnresolvedForeignFam(manifestItem, fam) {
    var slug = String((manifestItem && manifestItem.slug) || '').toLowerCase();
    if (fam === 1 || fam === 7) return true;
    var isHeavy = isHeavyWeaponSlug(slug);
    var isCmEnh = /classmod|enhancement/.test(slug);
    var isShield = /shield/.test(slug);
    var isGrenadeFamily = /grenade_gadget|turret_gadget|terminal_gadget|repair_kit/.test(slug);
    /* Heavies share CM/enhancement firmware tokens (234 high_caliber, 244 HW gadget, 245, …). */
    if (isHeavy && BE_CM_ENH_GENERIC_ROOTS[fam]) return true;
    if (isCmEnh && BE_CM_ENH_GENERIC_ROOTS[fam]) return true;
    if (isShield && (fam === 246 || fam === 247 || fam === 248)) return true;
    if (isGrenadeFamily && (fam === 245 || fam === 244 || BE_CM_ENH_GENERIC_ROOTS[fam])) return true;
    return false;
  }

  function isWeaponLikeSlug(slug) {
    return /_(?:pistol|ar|smg|shotgun|sniper|hw|heavy_weapon)$/i.test(String(slug || ''));
  }

  function isWeaponSharedElePearlSlot(slot, invKey) {
    var s = String(slot || '').toLowerCase();
    if (s === 'body_ele' || s === 'secondary_ele' || s === 'pearl_elem' || s === 'pearl_stat' || s === 'element') {
      return true;
    }
    var inv = String(invKey || '').toLowerCase();
    return /^(part_)?(radiation|fire|shock|corrosive|cryo|body_ele|pearl_)/.test(inv);
  }

  /**
   * Wrong-root: foreign weapon-prefix parts, plus shared-pool stacks .be flags on guns
   * (grenade payload / classmod / shield). Not every foreign fam (avoids mass false Invalid).
   */
  function isWrongRootForeignPart(dbRow, itemPrefix, fam, itemRoot, manifestItem, slot, invKey) {
    if (!Number.isFinite(fam) || !Number.isFinite(itemRoot) || fam === itemRoot) return false;
    if (fam === 7) return false;
    if (!dbRow) return false;

    var slug = String((manifestItem && manifestItem.slug) || '').toLowerCase();
    var ac = String(dbRow.alpha_code || '').trim();
    var inv = String(invKey || extractInvKeyFromResolvedRow(dbRow) || dbRow.name || '').toLowerCase();
    var isHeavy = isHeavyWeaponSlug(slug);
    var isCmEnh = /classmod|enhancement/.test(slug);
    var isShield = /shield/.test(slug);
    var isGrenadeFamily = /grenade_gadget|turret_gadget|terminal_gadget|repair_kit/.test(slug);
    var isGun = isWeaponLikeSlug(slug);
    var firmwareLike = isFirmwareLikePart(slot, inv, ac);

    if (fam === 1 && isWeaponSharedElePearlSlot(slot, inv)) return false;
    if (String(dbRow.manufacturer_or_group || '').trim().toLowerCase() === 'element' && fam === 1) return false;

    /* Heavies: shared firmware from ClassMod 234 / HW 244 / grenade 245 pools — .be Pass. */
    if (isHeavy && BE_CM_ENH_GENERIC_ROOTS[fam] && (firmwareLike || fam === 244 || fam === 245)) return false;
    if (isCmEnh && BE_CM_ENH_GENERIC_ROOTS[fam]) return false;
    if (isShield && (fam === 246 || fam === 247 || fam === 248 || isSharedPoolAlpha(ac))) return false;
    if (isGrenadeFamily && (fam === 245 || fam === 244 || BE_CM_ENH_GENERIC_ROOTS[fam])) return false;

    if (isGun && isSharedPoolAlpha(ac)) {
      var head = String(ac.split('.')[0] || '')
        .trim()
        .toLowerCase();
      if (head === 'weapon') return false;
      /* Firmware tokens often live under ClassMod.part_firmware_* even on guns/heavies. */
      if (firmwareLike && (head === 'classmod' || head === 'enhancement') && BE_CM_ENH_GENERIC_ROOTS[fam]) {
        return false;
      }
      if (head === 'grenade_gadget' || head === 'classmod' || head === 'enhancement') return true;
      if (head === 'shield' || head === 'energy_shield' || head === 'armor_shield') return true;
      return false;
    }

    if (/licensed/i.test(ac) || /licensed/i.test(inv)) {
      return fam !== itemRoot;
    }

    var partPref = weaponInventoryPrefixFromAlpha(ac);
    if (!partPref) return false;
    if (itemPrefix && partPref === String(itemPrefix).toUpperCase()) return false;
    return true;
  }

  function inferItemWeaponPrefixFromKeys(keys, itemRoot) {
    var ki;
    for (ki = 0; ki < keys.length; ki++) {
      var km = String(keys[ki] || '').match(/^(\d+):(\d+)$/);
      if (!km || Number(km[1]) !== Number(itemRoot)) continue;
      var row = pickPartsDbRowForKey(keys[ki]);
      var wp = weaponInventoryPrefixFromAlpha(row && row.alpha_code);
      if (wp) return wp;
    }
    return '';
  }

  /** Class-mod rarity → Nexus passive_points max (inv0 parttypeselectionrules). */
  function classModPassivePointsMaxFromRarity(rarityName) {
    var c = String(rarityName || '').toLowerCase();
    if (/comp_01|common/.test(c) && !/uncommon/.test(c)) return 2;
    if (/comp_02|uncommon/.test(c)) return 4;
    if (/comp_03|rare/.test(c) && !/pearlescent/.test(c)) return 5;
    if (/comp_04|epic/.test(c)) return 7;
    if (/comp_05|legendary|comp_06|pearl/.test(c)) return 7;
    return 7;
  }

  /**
   * Count one token once (decoder may emit 2 PARTS_DB choices per {n}).
   * Skills/Perks = CM passive_points; Core = enhancement core_augment.
   */
  function countResolvedByPartTypes(resolvedParts, typePred) {
    var seenRaw = Object.create(null);
    var n = 0;
    var i;
    for (i = 0; i < (resolvedParts || []).length; i++) {
      var r = resolvedParts[i];
      if (!r || r.unresolved) continue;
      if (!typePred(r)) continue;
      var rk = String(r.raw || '').trim();
      if (!rk) rk = String(r.key || '') + '|' + String(r.name || r.alpha_code || i);
      if (seenRaw[rk]) continue;
      seenRaw[rk] = true;
      n++;
    }
    return n;
  }

  function collectNonWeaponSlotOverMaxIssues(manifestItem, resolvedParts, selectedParts) {
    var out = [];
    if (!manifestItem) return out;
    var slug = String(manifestItem.slug || '').toLowerCase();
    var rp = resolvedParts || [];
    if (/repair_kit/.test(slug)) {
      var hasUniqueRepairPrimary = false;
      var hasOtherRepairPrimary = false;
      var namedRepairSuffix = '';
      var repairUniqueNames = Object.create(null);
      var rki;
      for (rki = 0; rki < rp.length; rki++) {
        var rkr = rp[rki];
        if (!rkr || rkr.unresolved) continue;
        var rkac = String(rkr.alpha_code || '').toLowerCase();
        var rkdot = rkac.lastIndexOf('.');
        var rkp = rkdot >= 0 ? rkac.slice(rkdot + 1) : rkac;
        var rkCompMatch = rkp.match(/^comp_05_legendary_([a-z0-9_]+)$/);
        if (rkCompMatch) namedRepairSuffix = rkCompMatch[1];
        if (/^part_augment_unique_/.test(rkp)) {
          hasUniqueRepairPrimary = true;
          repairUniqueNames[rkp.replace(/^part_augment_unique_/, '')] = true;
        }
        if (
          /^part_aug_/.test(rkp) &&
          !/_sec$/.test(rkp) &&
          !/^part_aug_ele_(?:nova|splat|immunity)_/.test(rkp)
        ) {
          hasOtherRepairPrimary = true;
        }
      }
      if (hasUniqueRepairPrimary && hasOtherRepairPrimary) {
        out.push(
          '[critical] Conflicting repair-kit primary augments: unique primary plus an additional primary augment'
        );
      }
      if (namedRepairSuffix && !repairUniqueNames[namedRepairSuffix]) {
        out.push(
          '[critical] Missing named repair-kit primary augment: ' +
            namedRepairSuffix +
            ' rarity requires part_augment_unique_' +
            namedRepairSuffix
        );
      }
    }
    if (/classmod/.test(slug)) {
      var pp = countResolvedByPartTypes(rp, function (r) {
        /* Nexus passive_points = skill ranks only. Perk/statspecial is stat_group1. */
        return String(r.part_type || '').toLowerCase() === 'skill';
      });
      var rarityNm =
        (selectedParts && selectedParts.rarity && (selectedParts.rarity.invDumpKey || selectedParts.rarity.name)) ||
        '';
      var maxPp = classModPassivePointsMaxFromRarity(rarityNm);
      if (pp > maxPp) {
        out.push(
          '[critical] Too many passive_points: found ' +
            pp +
            ', maximum ' +
            maxPp +
            ' allowed (' +
            (pp - maxPp) +
            ' part' +
            (pp - maxPp === 1 ? '' : 's') +
            ' too many)'
        );
      }
    }
    if (/enhancement/.test(slug)) {
      var cores = countResolvedByPartTypes(rp, function (r) {
        var pt = String(r.part_type || '').toLowerCase();
        var ac = String(r.alpha_code || r.name || '').toLowerCase();
        return pt === 'core' || /part_core_/i.test(ac) || /^core\s*augment/i.test(pt);
      });
      var enhancementRarity =
        (selectedParts && selectedParts.rarity && (selectedParts.rarity.invDumpKey || selectedParts.rarity.name)) ||
        '';
      /* Nexus: common enhancements allow one core; higher tiers allow two. */
      var maxCore = /comp_01|common/i.test(enhancementRarity) && !/uncommon/i.test(enhancementRarity) ? 1 : 2;
      if (cores > maxCore) {
        out.push(
          '[critical] Too many core_augment: found ' +
            cores +
            ', maximum ' +
            maxCore +
            ' allowed (' +
            (cores - maxCore) +
            ' part' +
            (cores - maxCore === 1 ? '' : 's') +
            ' too many)'
        );
      }
      if (/comp_05|legendary/i.test(enhancementRarity)) {
        var enhancementStatKeys = Object.create(null);
        var esi;
        for (esi = 0; esi < rp.length; esi++) {
          var esr = rp[esi];
          if (!esr || esr.unresolved) continue;
          var espt = String(esr.part_type || '').toLowerCase();
          var esac = String(esr.alpha_code || '').toLowerCase();
          if (espt !== 'stats' && !/\.part_stat/.test(esac)) continue;
          enhancementStatKeys[String(esr.key || esr.raw || esac || esi)] = true;
        }
        var enhancementStats = Object.keys(enhancementStatKeys).length;
        if (enhancementStats < 2) {
          out.push(
            '[critical] Missing required enhancement stat groups: need 2, found ' +
              enhancementStats +
              ' (missing ' +
              (2 - enhancementStats) +
              ')'
          );
        }
      }
    }
    if (/shield/.test(slug)) {
      var shieldElements = Object.create(null);
      var shei;
      for (shei = 0; shei < rp.length; shei++) {
        var shr = rp[shei];
        if (!shr || shr.unresolved) continue;
        var sha = String(shr.alpha_code || '').toLowerCase();
        if (/^shield\.part_(?:fire|cryo|corrosive|radiation|shock)$/.test(sha)) {
          shieldElements[sha] = true;
        }
      }
      var shieldElementCount = Object.keys(shieldElements).length;
      if (shieldElementCount > 1) {
        out.push(
          '[critical] Conflicting shield elements: found ' +
            shieldElementCount +
            ' element parts (maximum 1 allowed)'
        );
      }
      var secondaryAugments = countResolvedByPartTypes(rp, function (r) {
        var ac = String(r.alpha_code || '').toLowerCase();
        return /(?:part_|_)unv_.*_secondary$/.test(ac) || /_secondary$/.test(ac) && /shield/.test(ac);
      });
      if (secondaryAugments > 1) {
        out.push(
          '[critical] Too many secondary_augment: found ' +
            secondaryAugments +
            ', maximum 1 allowed (' +
            (secondaryAugments - 1) +
            ' part' +
            (secondaryAugments === 2 ? '' : 's') +
            ' too many)'
        );
      }
    }
    if (/grenade/.test(slug)) {
      var statKeys = Object.create(null);
      var gri;
      for (gri = 0; gri < rp.length; gri++) {
        var gr = rp[gri];
        if (!gr || gr.unresolved) continue;
        var pt = String(gr.part_type || '').toLowerCase();
        var ac = String(gr.alpha_code || '').toLowerCase();
        if (pt !== 'stats' && !/part_stat_/.test(ac)) continue;
        /* A serialized list shares one raw token, so distinguish each list member by key.
           PARTS_DB's duplicate candidate for that member shares the same key and is deduped. */
        var gk = String(gr.key || gr.raw || ac || gri);
        statKeys[gk] = true;
      }
      var statAugments = Object.keys(statKeys).length;
      if (statAugments > 3) {
        out.push(
          '[critical] Too many stat_augment: found ' +
            statAugments +
            ', maximum 3 allowed (' +
            (statAugments - 3) +
            ' part' +
            (statAugments === 4 ? '' : 's') +
            ' too many)'
        );
      }
    }
    return out;
  }

  /** Class-mod skill ranks are encoded as repeated identical parts in stat_* slots — .be Pass. */
  function isClassModSkillStackSlot(slot) {
    var s = String(slot || '').toLowerCase();
    return (
      s === 'stat_augment' ||
      s === 'stat' ||
      s === 'stat2' ||
      s === 'stat3' ||
      s === 'stat_group1' ||
      s === 'stat_group2' ||
      s === 'stat_group3'
    );
  }

  /**
   * save-editor.be Critical Rules parity: wrong-root encodings + exact duplicate part keys per slot
   * (lists like `{7:[14 14 …]}` must count each value — PARTS_DB lookup keys are deduped elsewhere).
   * Also: Multiple firmware parts (maximum 1) — same hardFailPatterns as .be legit-builder.js.
   * Class-mod skill stacks (repeated parts in stat_augment) are NOT duplicates — they are ranks.
   */
  function collectBalanceCriticalRuleIssues(decodeResult, manifestItem, rawSerial) {
    var out = [];
    if (!manifestItem) return out;
    var itemTypeId =
      decodeResult && (decodeResult.itemTypeId != null ? decodeResult.itemTypeId : decodeResult.item_type_id);
    if (itemTypeId == null && manifestItem.category_id != null) itemTypeId = manifestItem.category_id;
    if (itemTypeId == null) return out;
    var itemRoot = Number(itemTypeId);
    if (!Number.isFinite(itemRoot)) return out;
    var slugLow = String((manifestItem && manifestItem.slug) || '').toLowerCase();
    var isClassModItem = /classmod/.test(slugLow);
    var serialSrc =
      rawSerial ||
      (decodeResult && (decodeResult.deserialized || decodeResult.input || decodeResult.serial || '')) ||
      '';
    var keys = expandSerializedPartKeys(serialSrc, itemRoot);
    if (!keys.length && Array.isArray(decodeResult && decodeResult.resolvedParts)) {
      var rpFallback = decodeResult.resolvedParts;
      var rfi;
      for (rfi = 0; rfi < rpFallback.length; rfi++) {
        var rr = rpFallback[rfi];
        if (!rr || rr.unresolved || !rr.key) continue;
        keys.push(String(rr.key));
      }
    }
    if (!keys.length) return out;

    var itemPrefix = inventoryPrefixFromManifest(manifestItem) || inferItemWeaponPrefixFromKeys(keys, itemRoot);
    var slotCounts = Object.create(null);
    var wrongRootSeen = Object.create(null);
    var firmwareCount = 0;
    var wrongRootN = 0;
    var ki;
    for (ki = 0; ki < keys.length; ki++) {
      var key = keys[ki];
      var km = String(key).match(/^(\d+):(\d+)$/);
      if (!km) continue;
      var fam = Number(km[1]);
      var dbRow = pickPartsDbRowForKey(key);
      var invKey = extractInvKeyFromResolvedRow(dbRow) || '';
      if (!invKey && dbRow) invKey = String(dbRow.name || '').trim().toLowerCase();
      var slot = resolvedCompSlotName(dbRow) || '';
      if (!slot && invKey) {
        if (/shield/i.test(invKey)) slot = 'hyperion_secondary_acc';
        else if (/underbarrel/i.test(invKey)) slot = 'underbarrel';
        else if (/foregrip/i.test(invKey)) slot = 'foregrip';
        else if (/scope/i.test(invKey)) slot = 'scope';
        else if (/grip/i.test(invKey)) slot = 'grip';
        else if (/mag_/i.test(invKey) || /magazine/i.test(invKey)) slot = 'magazine';
        else if (/barrel_acc|barrel_0\d_[a-z]/i.test(invKey)) slot = 'barrel_acc';
        else if (/barrel/i.test(invKey)) slot = 'barrel';
        else if (/body_acc|body_[a-d]\b/i.test(invKey)) slot = 'body_acc';
        else if (/body_ele|elem/i.test(invKey)) slot = 'body_ele';
        else if (/firmware/i.test(invKey)) slot = 'firmware';
        else if (/body/i.test(invKey)) slot = 'body';
      }
      if (!slot) slot = 'unknown';
      if (slot === 'firmware' || /firmware/i.test(invKey)) firmwareCount++;
      if (invKey) {
        var ck = slot + '\0' + invKey;
        if (!slotCounts[ck]) slotCounts[ck] = { slot: slot, invKey: invKey, n: 0 };
        slotCounts[ck].n++;
      }
      if (Number.isFinite(fam) && fam !== itemRoot && fam !== 7) {
        if (!dbRow) {
          /* .be !found — but only when this root is not an allowed generic for the item type
             (grenade↔245, weapon↔1, cosmetics↔7, etc.). */
          if (!itemAllowsUnresolvedForeignFam(manifestItem, fam)) {
            wrongRootN++;
            var missKey = 'unresolved\0' + key;
            if (!wrongRootSeen[missKey]) {
              wrongRootSeen[missKey] = true;
              out.push(
                '[critical] Part "' + key + '" uses root serial ' + fam + ' (wrong root)'
              );
            }
          }
        } else if (isWrongRootForeignPart(dbRow, itemPrefix, fam, itemRoot, manifestItem, slot, invKey)) {
          wrongRootN++;
          var partLabel = invKey || String(dbRow.name || key);
          var wrKey = partLabel + '\0' + fam;
          if (!wrongRootSeen[wrKey]) {
            wrongRootSeen[wrKey] = true;
            out.push(
              '[critical] Part "' + partLabel + '" uses root serial ' + fam + ' (wrong root)'
            );
          }
        }
      }
    }
    if (firmwareCount > 1) {
      out.push(
        '[critical] Multiple firmware parts: found ' + firmwareCount + ' firmware parts (maximum 1 allowed)'
      );
    }
    if (wrongRootN > 0) {
      out.unshift('[critical] Missing or root-mismatched parts (' + wrongRootN + ')');
    }
    var ckeys = Object.keys(slotCounts);
    var ci;
    for (ci = 0; ci < ckeys.length; ci++) {
      var ent = slotCounts[ckeys[ci]];
      if (!ent || ent.n <= 1) continue;
      /* CM skill rank = repeated identical parts in stat_* — not a Balance Fail on .be. */
      if (isClassModItem && isClassModSkillStackSlot(ent.slot)) continue;
      out.push(
        '[critical] Duplicate part "' +
          ent.invKey +
          '" in ' +
          ent.slot +
          ': found ' +
          ent.n +
          ' times (only 1 allowed)'
      );
    }
    return out;
  }

  /**
   * save-editor.be-style headline buckets for bulk Fail rows.
   * Part Order | Tag Exclusion | Part Prerequisites | Critical Rules
   */
  function applyBalanceFailStatusLabel(legitState) {
    if (!legitState || legitState.status !== 'err') return legitState;
    var details = legitState.details || [];
    var buckets = [];
    var seen = Object.create(null);
    function addBucket(name) {
      if (seen[name]) return;
      seen[name] = true;
      buckets.push(name);
    }
    function isDiagnosticLine(s) {
      return (
        /^(FYI\b|Parts:|Sources:|Stats |Missing stat|Level range:|Item level:|Loot-pool export|Spawn claim:|Natural legitimacy|Bulk natural|Rules passed|Composition: no hard)/i.test(
          s
        ) || /LootSchedule max MinGameStage/i.test(s)
      );
    }
    var di;
    for (di = 0; di < details.length; di++) {
      var s = String(details[di] || '');
      if (isDiagnosticLine(s)) continue;
      if (/Part order mismatch/i.test(s) || /^\[order\]/i.test(s)) addBucket('Part Order');
      if (
        /^Exclusion:/i.test(s) ||
        (/exclusion tag/i.test(s) && !/barrel_0[12]/i.test(s)) ||
        /Excludes tags in pool/i.test(s) ||
        /^\[raw\].*Exclusion:/i.test(s)
      ) {
        addBucket('Tag Exclusion');
      }
      if (
        (/missing dependency tag/i.test(s) && !/missing dependency tag "(?:barrel_0[12]|uni_|leg_|elem|ted_mirv)/i.test(s)) ||
        /^Compatibility:\s*Missing required/i.test(s) ||
        /^\[raw\].*Compatibility:\s*Missing required/i.test(s)
      ) {
        addBucket('Part Prerequisites');
      }
      if (
        /^\[critical\]/i.test(s) ||
        /wrong root/i.test(s) ||
        (/Duplicate part/i.test(s) && /only 1 allowed/i.test(s)) ||
        /^\[composition\]/i.test(s) ||
        /exceeds this item's/i.test(s) ||
        /Element control in invalid slot/i.test(s) ||
        /Pearl-only slots/i.test(s) ||
        /Comp slot[^:]+: count \d+ outside range \[\d+,\d+\]/i.test(s)
      ) {
        addBucket('Critical Rules');
      }
    }
    if (!buckets.length) {
      return Object.assign({}, legitState, { statusText: 'Balance Fail (Modded)' });
    }
    return Object.assign({}, legitState, {
      statusText: 'Balance Fail (Modded) — ' + buckets.join(', ')
    });
  }

  function collectBulkPartsOutsideItemMap(manifestItem, resolvedParts) {
    var out = [];
    if (!manifestItem || !Array.isArray(resolvedParts)) return out;
    var ncsInfo = null;
    try {
      if (window.LegitBuilderApi && typeof window.LegitBuilderApi.getNcsInfo === 'function') {
        ncsInfo = window.LegitBuilderApi.getNcsInfo(manifestItem.slug);
      }
    } catch (_) {}
    var ncsSlots = ncsInfo && ncsInfo.ncs_slots ? ncsInfo.ncs_slots : null;
    var slotAllowed =
      window.LegitBuilderApi && typeof window.LegitBuilderApi.slotNameAllowedOnNcs === 'function'
        ? window.LegitBuilderApi.slotNameAllowedOnNcs
        : function () {
            return true;
          };
    var i;
    var row;
    var sk;
    var bucket;
    var opt;
    var label;
    for (i = 0; i < resolvedParts.length; i++) {
      row = resolvedParts[i];
      if (!row || row.unresolved) continue;
      sk = partTypeToSlotKey(row.part_type);
      if (!sk) sk = partTypeToSlotKey(row.weapon_type_or_category || '');
      sk = refineSlotKeyIfBodyGeneric(row, sk);
      if (!sk) sk = inferNonWeaponSlotFromPartId(row, manifestItem);
      label = String(row.alpha_code || row.name || '').trim() || 'unknown part';
      if (!sk) {
        out.push('[slot-map] Decoded part has no slot key (not on item base map): ' + label);
        continue;
      }
      if (sk !== 'rarity' && ncsSlots && ncsSlots.length && !slotAllowed(sk, ncsSlots)) {
        out.push('[slot-map] Slot "' + sk + '" not on this item\'s NCS base map: ' + label);
        continue;
      }
      bucket = getManifestSlot(manifestItem, sk);
      if (!bucket) bucket = nonWeaponSyntheticBucket(manifestItem, sk, row);
      if (!bucket || !bucket.slot || !Array.isArray(bucket.slot.options) || !bucket.slot.options.length) {
        out.push('[slot-map] Slot "' + sk + '" not on this item\'s manifest / inv options: ' + label);
        continue;
      }
      opt = findOptionMatchNatural(bucket.slot.options, row, bucket.key);
      if (!opt) {
        out.push(
          '[slot-map] Part not in this item\'s slot options / inv list (' + sk + '): ' + label
        );
      }
    }
    return out;
  }

  function promoteLegitStateFail(legitState, mappedCount, extraLines) {
    var ls =
      legitState || {
        status: 'idle',
        statusText: '',
        details: [],
        className: 'v-idle',
        statsIdRawFound: 0,
        statsAnyFound: 0,
        partCount: mappedCount,
        itemSlotMax: 0,
        miniLineageHtml: ''
      };
    var prev = ls.details && ls.details.length ? ls.details.slice() : [];
    return Object.assign({}, ls, {
      status: 'err',
      statusText: 'Fail (data)',
      className: 'v-err',
      details: prev.concat(extraLines)
    });
  }

  /**
   * Exact INV/NCS combinations audited against the 7,137-row save-editor.be corpus.
   * Each rule matched Balance rows only (zero Pass matches); keep these narrower than
   * generic licensed, grenade, or class-mod-under-min heuristics, which have Pass exceptions.
   */
  function collectAuditedExactInvIssues(result) {
    var out = [];
    var rows = result && Array.isArray(result.resolvedParts) ? result.resolvedParts : [];
    var alphas = [];
    var keys = Object.create(null);
    var i;
    for (i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (!row || row.unresolved) continue;
      var alpha = String(row.alpha_code || '').trim().toLowerCase();
      if (!alpha) continue;
      alphas.push(alpha);
      var dot = alpha.lastIndexOf('.');
      keys[dot >= 0 ? alpha.slice(dot + 1) : alpha] = true;
    }
    function has() {
      for (var hi = 0; hi < arguments.length; hi++) {
        if (!keys[String(arguments[hi]).toLowerCase()]) return false;
      }
      return true;
    }
    function hasPrefix(re) {
      for (var pi = 0; pi < alphas.length; pi++) if (re.test(alphas[pi])) return true;
      return false;
    }
    function alphaIndex(suffix) {
      suffix = String(suffix).toLowerCase();
      for (var ai = 0; ai < alphas.length; ai++) {
        if (alphas[ai].slice(-suffix.length) === suffix) return ai;
      }
      return -1;
    }

    if (
      hasPrefix(/^dad_ar\./) &&
      has('comp_05_legendary_om', 'part_body_bolt', 'part_body_a') &&
      alphaIndex('.part_body_bolt') < alphaIndex('.part_body_a')
    ) {
      out.push('[order] Daedalus AR body bolt precedes body accessories in the decoded INV order');
    }
    if (
      hasPrefix(/^mal_sr\./) &&
      has('comp_05_legendary_complex_root', 'part_barrel_01_d', 'part_barrel_licensed_jak')
    ) {
      out.push('Exclusion: Complex Root barrel mod D conflicts with the licensed Jakobs barrel part');
    }
    if (
      hasPrefix(/^jak_sg\./) &&
      has('part_scope_02_lens_01', 'part_scope_acc_s01_l01_a', 'part_scope_acc_s01_l01_b')
    ) {
      out.push('Part Prerequisites: scope_01 accessories are paired with a scope_02 lens');
    }
    if (hasPrefix(/^ord_shield\./) && has('comp_05_legendary_collector', 'part_unv_turtle_secondary')) {
      out.push('Comp allowlist: part_unv_turtle_secondary is not an allowed Collector secondary augment');
    }
    if (
      hasPrefix(/^vla_sm\./) &&
      has('comp_05_legendary_kaoson', 'part_barrel_01_a', 'part_barrel_02_a')
    ) {
      out.push('Part Prerequisites: Kaoson barrel_01 contains a barrel_02 accessory');
    }
    if (
      hasPrefix(/^vla_sr\./) &&
      has('part_barrel_licensed_jak', 'part_barrel_01_a')
    ) {
      out.push('Exclusion: Vladof sniper barrel_01_a excludes the licensed Jakobs barrel part');
    }
    if (
      hasPrefix(/^jak_grenade_gadget\./) &&
      has('part_jak', 'part_slot_23', 'part_01_mirv', 'part_stat_07_nuke', 'part_firmware_high_caliber')
    ) {
      out.push('Exclusion: Jakobs MIRV/Nuke INV combination conflicts with the Jakobs root tag');
    }
    if (
      hasPrefix(/^classmod_gravitar\./) &&
      has('comp_05_legendary_01', 'leg_body_01')
    ) {
      var skillKeys = Object.create(null);
      for (i = 0; i < rows.length; i++) {
        if (!rows[i] || String(rows[i].part_type || '').toLowerCase() !== 'skill') continue;
        skillKeys[String(rows[i].raw || rows[i].key || rows[i].name || '')] = true;
      }
      if (Object.keys(skillKeys).length < 7) {
        out.push('Compatibility: Gravitar legendary 01 requires 7 passive skill points');
      }
    }
    if (
      hasPrefix(/^borg_grenade_gadget\./) &&
      has('comp_05_legendary_transmission', 'part_borg', 'part_slot_23', 'part_payload_unique_transmission')
    ) {
      out.push('Comp allowlist: Ripper Transmission serial slot 23 is not an allowed element');
    }
    var itemTypeId = result && (result.itemTypeId != null ? result.itemTypeId : result.item_type_id);
    if (
      (Number(itemTypeId) === 263 || Number(itemTypeId) === 267) &&
      hasPrefix(/^bor_sg\.comp_05_legendary_crazedearl$/)
    ) {
      out.push('[critical] Grenade carries the BOR_SG Crazed Earl rarity component');
    }
    if (
      hasPrefix(/^mal_hw\./) &&
      has('comp_05_legendary_bottledlightning', 'part_cryo', 'part_secondary_elem_corrosive_cryo_mal')
    ) {
      out.push('Exclusion: Bottled Lightning primary cryo conflicts with corrosive/cryo secondary element');
    }
    if (
      hasPrefix(/^bor_shield\./) &&
      has('comp_05_legendary_firewall', 'part_unique_cindershelly', 'part_corrosive')
    ) {
      out.push('Exclusion: Firewall/Cindershelly composition excludes the corrosive element tag');
    }
    if (
      hasPrefix(/^bor_shield\./) &&
      has('comp_01_common', 'part_body_energy_watts4dinner', 'part_unique_cindershelly', 'part_fire')
    ) {
      out.push('Part Prerequisites: Watts4Dinner/Cindershelly composition is missing its unique dependency');
    }
    return out;
  }

  function slotToNcsEquiv(s) {
    var map = { mag: 'magazine', class_mod_body: 'class_mod', shield: 'hyperion_secondary_acc', multi: 'tediore_acc' };
    return map[s] !== undefined ? map[s] : s;
  }

  function verifyPartOrderToNcs(manifestItem, slotOrder, getNcsInfo) {
    if (!getNcsInfo || !slotOrder || !slotOrder.length) return null;
    var ncsInfo = getNcsInfo(manifestItem.slug);
    if (!ncsInfo || !ncsInfo.ncs_slots) return null;
    var ncsSlots = ncsInfo.ncs_slots;
    /* Dense manifest slot keys in decode order (resolvedParts indices can have holes). */
    var dense = [];
    for (var di = 0; di < slotOrder.length; di++) {
      if (slotOrder[di]) dense.push(slotOrder[di]);
    }
    if (!dense.length) return null;
    var ncs = ncsSlots.slice();
    /* Rarity is a comp on the serial; NCS slot lists usually start at body. */
    while (dense.length && ncs.length && dense[0] === 'rarity' && ncs[0] !== 'rarity') {
      dense.shift();
    }
    while (dense.length && ncs.length && ncs[0] === 'rarity' && dense[0] !== 'rarity') {
      ncs.shift();
    }
    /* Serial omits empty accessory slots; NCS lists every slot. Require decode order âŠ† NCS order (subsequence). */
    var mismatches = [];
    var ni = 0;
    for (var dj = 0; dj < dense.length; dj++) {
      var want = slotToNcsEquiv(dense[dj]);
      var foundAt = -1;
      while (ni < ncs.length) {
        if (slotToNcsEquiv(ncs[ni]) === want) {
          foundAt = ni;
          ni++;
          break;
        }
        ni++;
      }
      if (foundAt < 0) {
        mismatches.push(
          'Slot "' + dense[dj] + '" not in NCS order after earlier parts (expected a subsequence of ncs_slots)'
        );
        break;
      }
    }
    return mismatches.length ? mismatches : null;
  }

  function resolveManifestItem(getAllItems, result) {
    var items = typeof getAllItems === 'function' ? getAllItems() : [];
    if (!result || !items.length) return null;
    /* STX / WASM family id (and Gibbed fallback first segment) matches manifest category_id */
    var rawId = result.itemTypeId != null ? result.itemTypeId : result.item_type_id;
    var fid = rawId != null ? Number(rawId) : NaN;
    if (Number.isFinite(fid)) {
      var byCat = items.filter(function (it) {
        return it && it.category_id != null && Number(it.category_id) === fid;
      });
      if (byCat.length === 1) return byCat[0];
      if (byCat.length > 1) {
        /* Multiple items share a family id (e.g. four legacy VHs used 254; C4sh/Robodealer uses 404) — prefer non-supplement manifest + stable slug */
        byCat.sort(function (a, b) {
          var sa = a._ncsSupplement ? 1 : 0;
          var sb = b._ncsSupplement ? 1 : 0;
          if (sa !== sb) return sa - sb;
          return String(a.slug || '').localeCompare(String(b.slug || ''));
        });
        return byCat[0];
      }
    }
    var st = buildSimpleStateFromDecode(result);
    var slug = '';
    if (st && typeof window.computeSimpleBuilderItemSlug === 'function') {
      slug = window.computeSimpleBuilderItemSlug(st) || '';
    }
    if (slug) {
      var found = items.find(function (it) { return it.slug === slug; });
      if (found) return found;
    }
    return null;
  }

  function extractInvKeyFromResolvedRow(row) {
    if (!row) return '';
    var acTrim = String(row.alpha_code || '').trim();
    var dot = acTrim.lastIndexOf('.');
    var tail = dot >= 0 ? acTrim.slice(dot + 1).trim() : '';
    var name = String(row.name || '').trim();
    if (tail) return tail.toLowerCase();
    if (/^(?:part_|comp_|leg_)/i.test(acTrim)) return acTrim.toLowerCase();
    return name.toLowerCase();
  }

  function resolvedCompSlotName(row) {
    var sk = partTypeToSlotKey(row && row.part_type);
    if (!sk) sk = partTypeToSlotKey(row && row.weapon_type_or_category);
    if (!sk) return '';
    if (sk === 'mag') return 'magazine';
    if (sk === 'stat' || sk === 'stat2' || sk === 'stat3' || sk === 'stat_group1' || sk === 'stat_group2' || sk === 'stat_group3') return 'stat_augment';
    return sk;
  }

  /** Raw inv check over resolvedParts (keeps duplicates). **Weapons only** — CM/global raw exclusion
   * on mapped rows caused ~k false fails (duplicate tag pool vs slot collapse). Unmapped bulk still uses this.
   * @param {{ rawSerial?: string, unmappedBulkExclusionOnly?: boolean, syntheticSourceRows?: object[], skipRawDependencyChecks?: boolean, flagEnhancementWeaponTypeStatParts?: boolean }} [opts] flagEnhancementWeaponTypeStatParts: bulk enhancement pass — fail part_stat_wt_* (per-weapon-type) rows not present in INV_PART_SELECTION_DATA enhancement layouts.
   */
  function computeRawResolvedInvIssues(r, manifestItem, selectedParts, opts) {
    opts = opts || {};
    var exOnly = opts.unmappedBulkExclusionOnly === true;
    var skipDeps = opts.skipRawDependencyChecks === true;
    var out = [];
    var synthIn = opts.syntheticSourceRows;
    var useSynth = Array.isArray(synthIn) && synthIn.length > 0;
    var slugChk = String((manifestItem && manifestItem.slug) || '');
    var isWeaponSlugChk = /_(?:pistol|ar|smg|shotgun|sniper|hw|heavy_weapon)$/i.test(slugChk);
    var isEnhancementSlugChk = /_enhancement$/i.test(slugChk);
    var isClassModSlugChk = /classmod/.test(slugChk.toLowerCase());
    /* Class mods: need raw exclusion scan — TagComp only sees collapsed selectedParts,
       so stacked cm_stat_* clashes (.be Balance Fail) were invisible.
       Shields stay on TagComp only — raw shield scan false-failed natural Maliwan shields. */
    if (!manifestItem || (!isWeaponSlugChk && !isEnhancementSlugChk && !isClassModSlugChk)) {
      return out;
    }
    if (!useSynth && !r) return out;
    if (!window.TagCompValidation || !window.INV_COMP_TAG_DATA || !window.INV_COMP_TAG_DATA.partsByName) return out;
    var inv = window.INV_COMP_TAG_DATA;
    var TC = window.TagCompValidation;
    var partsByName = inv.partsByName || {};
    var compRulesAll = inv.compSlotRules || {};
    function inferRarityCompFromRows(rows) {
      var best = '';
      var ri;
      for (ri = 0; ri < (rows || []).length; ri++) {
        var rw = rows[ri];
        if (!rw || rw.unresolved) continue;
        var pt = String(rw.part_type || '').toLowerCase();
        if (pt.indexOf('rarity') < 0) continue;
        var ik = extractInvKeyFromResolvedRow(rw);
        if (!ik) continue;
        if (/^comp_|^base_comp_/i.test(ik) && ik.length > best.length) best = ik.toLowerCase();
      }
      return best ? { name: best } : null;
    }
    var tagPool = new Set();
    var rarityPart = selectedParts && selectedParts.rarity;
    var compName = rarityPart && rarityPart.name ? String(rarityPart.name).trim().toLowerCase() : '';
    var counts = Object.create(null);
    function inferredTagsFromInvKey(invKey) {
      var out = [];
      var k = String(invKey || '').toLowerCase();
      if (!k) return out;
      if (k.indexOf('licensed') >= 0) out.push('licensed');
      if (k.indexOf('barrel_mod_d') >= 0) out.push('barrel_mod_d');
      return out;
    }
    function parsePartKeysFromSerialized(rawSerial, itemTypeId) {
      var out = [];
      if (!rawSerial || itemTypeId == null) return out;
      var s = String(rawSerial);
      var m;
      var re = /\{(\d+)(?::(\d+))?\}/g;
      while ((m = re.exec(s)) !== null) {
        var a = Number(m[1]);
        var b = m[2] != null ? Number(m[2]) : null;
        if (!Number.isFinite(a)) continue;
        if (b != null && Number.isFinite(b)) out.push(String(a) + ':' + String(b));
        else out.push(String(itemTypeId) + ':' + String(a));
      }
      return out;
    }

    function gatherRawPartRowsFromDecode(result) {
      var out = [];
      if (!result || !Array.isArray(result.parts) || !window.PARTS_DB) return out;
      var db = window.PARTS_DB;
      var seen = Object.create(null);
      var pi;
      for (pi = 0; pi < result.parts.length; pi++) {
        var part = result.parts[pi];
        if (!part) continue;
        var keys = [];
        if (part.subtype === 'none' && result.itemTypeId != null) keys.push(String(result.itemTypeId) + ':' + String(part.index));
        if (part.subtype === 'int' && part.value != null) keys.push(String(part.index) + ':' + String(part.value));
        if (part.subtype === 'list' && Array.isArray(part.values)) {
          for (var vi = 0; vi < part.values.length; vi++) keys.push(String(part.index) + ':' + String(part.values[vi]));
        }
        for (var ki = 0; ki < keys.length; ki++) {
          var k = keys[ki];
          var cand = db[k];
          if (!Array.isArray(cand)) continue;
          for (var ci = 0; ci < cand.length; ci++) {
            var row = cand[ci];
            if (!row) continue;
            var sig = String(row.alpha_code || '') + '|' + String(row.part_type || '') + '|' + String(row.name || '');
            if (seen[sig]) continue;
            seen[sig] = true;
            out.push(row);
          }
        }
      }
      return out;
    }

    function gatherRawPartRowsFromSerialized(result, rawSerial) {
      var out = [];
      if (!result || !window.PARTS_DB) return out;
      var itemTypeId = result.itemTypeId != null ? result.itemTypeId : result.item_type_id;
      if (itemTypeId == null) return out;
      /* Must expand {fam:[id id …]} lists — parsePartKeysFromSerialized only saw bare {n}/{a:b}. */
      var keys = expandSerializedPartKeys(rawSerial, itemTypeId);
      if (!keys.length) keys = parsePartKeysFromSerialized(rawSerial, itemTypeId);
      if (!keys.length) return out;
      var db = window.PARTS_DB;
      var seen = Object.create(null);
      for (var ki = 0; ki < keys.length; ki++) {
        var rowPick = pickPartsDbRowForKey(keys[ki]);
        if (rowPick) {
          var sigOne =
            String(rowPick.alpha_code || '') +
            '|' +
            String(rowPick.part_type || '') +
            '|' +
            String(rowPick.name || '');
          if (!seen[sigOne]) {
            seen[sigOne] = true;
            out.push(rowPick);
          }
          continue;
        }
        var arr = db[keys[ki]];
        if (!Array.isArray(arr)) continue;
        for (var ai = 0; ai < arr.length; ai++) {
          var row = arr[ai];
          if (!row) continue;
          var sig = String(row.alpha_code || '') + '|' + String(row.part_type || '') + '|' + String(row.name || '');
          if (seen[sig]) continue;
          seen[sig] = true;
          out.push(row);
        }
      }
      return out;
    }
    var i;
    var fullTagPool = new Set();
    var tagCounts = Object.create(null);
    var partRows = [];
    var sourceRows;
    if (useSynth) {
      sourceRows = synthIn;
    } else {
      var rawRows = gatherRawPartRowsFromSerialized(r, opts.rawSerial);
      if (!rawRows.length) rawRows = gatherRawPartRowsFromDecode(r);
      var rpFallback = Array.isArray(r.resolvedParts) ? r.resolvedParts : [];
      sourceRows = rawRows.length ? rawRows : rpFallback;
    }
    if (!sourceRows.length) return out;
    if (!compName) {
      var infComp = inferRarityCompFromRows(sourceRows);
      if (infComp && infComp.name) compName = String(infComp.name).trim().toLowerCase();
    }
    if (compName && /^comp_0[1-4]_(?:common|uncommon|rare|epic)/i.test(compName)) {
      var mm = compName.match(/^comp_0[1-4]_(common|uncommon|rare|epic)/i);
      if (mm) tagPool.add(String(mm[1]).toLowerCase());
    } else if (compName && /^base_comp_0[1-4]_(?:common|uncommon|rare|epic)/i.test(compName)) {
      var mmB = compName.match(/^base_comp_0[1-4]_(common|uncommon|rare|epic)/i);
      if (mmB) tagPool.add(String(mmB[1]).toLowerCase());
    } else if (compName && /^comp_05_legendary/i.test(compName)) {
      tagPool.add('legendary');
      tagPool.add('unique');
    } else if (compName && /^base_comp_05_legendary/i.test(compName)) {
      tagPool.add('legendary');
      tagPool.add('unique');
    }
    for (i = 0; i < sourceRows.length; i++) {
      var row = sourceRows[i];
      if (!row || row.unresolved) continue;
      var invKey = extractInvKeyFromResolvedRow(row);
      var meta = invKey ? partsByName[invKey] : null;
      var inferred = inferredTagsFromInvKey(invKey);
      partRows.push({ row: row, invKey: invKey, meta: meta, inferred: inferred });
      if (meta) {
        var addAll = TC.formatTags(meta.addtags);
        for (var a0 = 0; a0 < addAll.length; a0++) {
          fullTagPool.add(addAll[a0]);
          tagCounts[addAll[a0]] = (tagCounts[addAll[a0]] || 0) + 1;
        }
      }
      for (var it = 0; it < inferred.length; it++) {
        fullTagPool.add(inferred[it]);
        tagCounts[inferred[it]] = (tagCounts[inferred[it]] || 0) + 1;
      }
    }
    for (i = 0; i < sourceRows.length; i++) {
      var row = sourceRows[i];
      if (!row || row.unresolved) continue;
      var invKey = extractInvKeyFromResolvedRow(row);
      var meta = invKey ? partsByName[invKey] : null;
      var selfInferred = inferredTagsFromInvKey(invKey);
      if (meta) {
        var addTags = TC.formatTags(meta.addtags);
        var depTags = TC.formatTags(meta.dependencytags);
        var exclTags = TC.formatTags(meta.exclusiontags);
        var ai;
        var di;
        var ei;
        for (ei = 0; ei < exclTags.length; ei++) {
          var ex = exclTags[ei];
          if (!ex) continue;
          /* cm_stat_weapon_damage_type only: category mutex across different weapon-damage stats.
             Do NOT mutex cm_stat_fire_rate / etc. — duplicate identical stats are skill ranks (.be Pass). */
          var selfHasExTag = addTags.indexOf(ex) >= 0 || selfInferred.indexOf(ex) >= 0;
          var otherHasExTag = (tagCounts[ex] || 0) - (selfHasExTag ? 1 : 0) > 0;
          var isCmStatMutex = ex === 'cm_stat_weapon_damage_type';
          var allowSelfAddMutex = isCmStatMutex || addTags.indexOf(ex) < 0;
          if (fullTagPool.has(ex) && otherHasExTag && allowSelfAddMutex) {
            out.push('Exclusion: Part ' + (i + 1) + ' (' + (row.serial != null ? row.serial : invKey || 'n/a') + '): Excludes tags in pool: ' + ex);
          }
        }
        if (!exOnly && !skipDeps) {
          for (di = 0; di < depTags.length; di++) {
            var dp = depTags[di];
            if (!dp) continue;
            if (!tagPool.has(dp)) {
              out.push('Part Prerequisites: Part ' + (i + 1) + ' (' + (row.serial != null ? row.serial : invKey || 'n/a') + '): Missing dependency tag "' + dp + '"');
            }
          }
          for (ai = 0; ai < addTags.length; ai++) tagPool.add(addTags[ai]);
        }
      }
      if (!exOnly) {
        var cslot = resolvedCompSlotName(row);
        if (cslot) counts[cslot] = (counts[cslot] || 0) + 1;
      }
    }
    /* Guns must use base_comp_* slot mins (barrel_acc, etc.); plain comp_* keys are class-mod-shaped (barrel_acc min 0).
       Matches runInvTagProgression compRulesKey remapping in legit-builder-core.js. */
    var compRulesLookup = compName;
    if (compName && isWeaponSlugChk) {
      var cnNorm = String(compName).replace(/^base_comp_/i, 'comp_').toLowerCase();
      var baseCompTry = 'base_' + cnNorm;
      if (compRulesAll[baseCompTry]) compRulesLookup = baseCompTry;
    }
    /* *_enhancement shares rarity comps but not weapon/class-mod slot layout — skip mins (see v54).
       Class mods: skip Comp under-min here too — skill/stat stacks make slot mins noisy vs .be;
       exclusion clashes (cm_stat_*) are the Balance signal we need. */
    var rules =
      !exOnly &&
      compRulesLookup &&
      !isEnhancementSlugChk &&
      !isClassModSlugChk
        ? compRulesAll[compRulesLookup]
        : null;
    if (rules) {
      Object.keys(rules).forEach(function (slot) {
        var rr = rules[slot] || {};
        var min = typeof rr.min === 'number' ? rr.min : (rr.parts && rr.parts.length ? 1 : 0);
        if (min <= 0) return;
        var cnt = counts[slot] || 0;
        if (cnt < min) {
          out.push('Compatibility: Missing required ' + slot + ': need ' + min + ', found ' + cnt + ' (missing ' + (min - cnt) + ' part)');
        }
      });
    }
    /* Enhancement banks: INV_PART_SELECTION_DATA has no slots for per-weapon-type stat rows (part_stat_wt_SR_*, …).
       Serials can still carry them via shared family 247 — inv tag scan often misses them (empty part_type). */
    if (isEnhancementSlugChk && opts.flagEnhancementWeaponTypeStatParts === true) {
      for (i = 0; i < sourceRows.length; i++) {
        var rws = sourceRows[i];
        if (!rws || rws.unresolved) continue;
        var blobStat =
          String(extractInvKeyFromResolvedRow(rws) || '') +
          '|' +
          String(rws.alpha_code || '') +
          '|' +
          String(rws.name || '');
        if (!/part_stat_wt_[a-z]{2}/i.test(blobStat)) continue;
        out.push(
          '[layout] Weapon-type stat part on enhancement bank (not in manufacturer enhancement layout): ' +
            (extractInvKeyFromResolvedRow(rws) || String(rws.name || '').trim() || 'unknown')
        );
      }
    }
    return out;
  }

  /** Same bar as LegitBuilderApi invReasonIsBulkHardFail for raw composition lines (enhancement post-pass). */
  function isCoreStructuralMissingSlot(slot) {
    var s = String(slot || '').toLowerCase();
    /* Raw layout Missing required is coarser than Comp rules (no cross-slot credit).
       Only promote CM/enhancement/pearl from raw; gun cores use Comp path. */
    if (!s || /_acc$/i.test(s) || s === 'firmware' || s === 'endgame') return false;
    if (
      s === 'body_ele' ||
      s === 'secondary_ele' ||
      s === 'element' ||
      s === 'magazine_borg' ||
      s === 'barrel' ||
      s === 'magazine' ||
      s === 'mag' ||
      s === 'foregrip' ||
      s === 'grip' ||
      s === 'scope' ||
      s === 'underbarrel' ||
      s === 'body' ||
      s === 'unique' ||
      s === 'inv_comp'
    ) {
      return false;
    }
    return (
      s === 'class_mod' ||
      s === 'class_mod_body' ||
      s === 'shield' ||
      /* pearl_elem/pearl_stat: raw layout often misses pearl parts that Comp/selectedParts
         already count (or .be softens). Promoting them mass-false-fails .be Pass pearls. */
      s === 'primary_augment' ||
      s === 'secondary_augment' ||
      s === 'core_augment' ||
      s === 'payload' ||
      s === 'action_skill_mod' ||
      s === 'passive_points' ||
      s === 'stat_group1' ||
      s === 'stat_group2' ||
      s === 'stat_group3' ||
      s === 'stat_augment'
    );
  }

  function rawCompAllowlistSlotIsHardFail(slot) {
    return isCoreStructuralMissingSlot(slot);
  }

  function rawCompositionLineIsBulkHardFail(line) {
    var s = String(line || '');
    /* Layout wt_* on enhancement banks is noisy vs .be Pass — FYI only. */
    if (/^\[layout\]\s*Weapon-type stat part on enhancement bank/i.test(s)) return false;
    if (/^Comp allowlist:/i.test(s)) {
      var alSlot = (s.match(/not in allowed parts for ([a-z0-9_]+)/i) || [])[1];
      return rawCompAllowlistSlotIsHardFail(alSlot);
    }
    if (/^Exclusion:/i.test(s) && /pool/i.test(s)) {
      if (/Excludes tags in pool:\s*unique\b/i.test(s)) {
        /* Unique clashes are handled by TagComp; raw barrel_01/02↔unique over-fires vs .be Pass. */
        return false;
      }
      if (/Excludes tags in pool:\s*barrel_0[12]\b/i.test(s) && !/licensed|unique/i.test(s)) return false;
      /* ted_* / structure partner tags — same noise bar as invReasonIsBulkHardFail. */
      if (
        /Excludes tags in pool:\s*(?:barrel_0[12]|underbarrel_barrel|hyp_shield|ted_\w+|jak_\w+)(?:\s|,|$)/i.test(s) &&
        !/Excludes tags in pool:\s*licensed/i.test(s) &&
        !/Excludes tags in pool:\s*unique\b/i.test(s)
      ) {
        var onlyNoise = true;
        var poolM = s.match(/Excludes tags in pool:\s*([^;\n]+)/i);
        if (poolM) {
          String(poolM[1])
            .split(/[,\s]+/)
            .map(function (x) {
              return String(x || '')
                .trim()
                .toLowerCase();
            })
            .filter(Boolean)
            .forEach(function (t) {
              if (
                t !== 'barrel_01' &&
                t !== 'barrel_02' &&
                t !== 'underbarrel_barrel' &&
                t !== 'hyp_shield' &&
                t.indexOf('ted_') !== 0 &&
                t.indexOf('jak_') !== 0
              ) {
                onlyNoise = false;
              }
            });
        }
        if (onlyNoise) return false;
      }
      return true;
    }
    var m = s.match(/Comp slot ([^:]+): count (\d+) outside range \[(\d+),(\d+)\]/);
    if (m) {
      var slotNm = String(m[1] || '')
        .trim()
        .toLowerCase();
      var cnt = parseInt(m[2], 10);
      var mi = parseInt(m[3], 10);
      var ma = parseInt(m[4], 10);
      if (Number.isFinite(cnt) && Number.isFinite(ma) && cnt > ma) {
        if (/_acc$/i.test(slotNm) || slotNm === 'firmware' || slotNm === 'endgame') return false;
        return true;
      }
      if (Number.isFinite(cnt) && Number.isFinite(mi) && cnt < mi && isCoreStructuralMissingSlot(slotNm)) {
        return true;
      }
      return false;
    }
    /* Core structural under-min only — barrel_acc/body_acc/firmware mins over-fire vs .be Pass. */
    if (/^Compatibility:\s*Missing required/i.test(s)) {
      var missSlot = (s.match(/^Compatibility:\s*Missing required\s+([a-z0-9_]+)/i) || [])[1];
      return isCoreStructuralMissingSlot(missSlot);
    }
    if (/missing dependency tag/i.test(s)) {
      var rxd = /missing dependency tag "([^"]+)"/gi;
      var md;
      var sawQuoted = false;
      var hasHard = false;
      while ((md = rxd.exec(s)) !== null) {
        sawQuoted = true;
        var tg = String(md[1] || '').toLowerCase();
        if (tg === 'licensed' || tg.indexOf('licensed_') === 0 || tg === 'unique') hasHard = true;
      }
      if (hasHard) return true;
      if (sawQuoted) return false;
      return true;
    }
    if (s.indexOf('exclusion tag') >= 0) {
      var tags = [];
      var re = /exclusion tag\s+"([^"]+)"/gi;
      var mm;
      while ((mm = re.exec(s)) !== null) tags.push(String(mm[1]).toLowerCase());
      if (tags.length === 0) return true;
      var ti;
      for (ti = 0; ti < tags.length; ti++) {
        var tx = tags[ti];
        if (
          tx === 'barrel_01' ||
          tx === 'barrel_02' ||
          tx === 'underbarrel_barrel' ||
          tx === 'hyp_shield' ||
          tx.indexOf('ted_') === 0 ||
          tx.indexOf('jak_') === 0
        ) {
          continue;
        }
        return true;
      }
      return false;
    }
    return false;
  }

  /**
   * Full data-backed validation for one enriched decode result (manifest + NCS + schedules + stats coverage).
   * Used by bulk serial validator (same-page WASM + Legit Builder context).
   * @param {object} decodeResult — one entry from decodeSerialsViaBridge with enrichResolved
   * @param {{ strictMode?: boolean, itemLevel?: number, relaxInvUniLegDeps?: boolean, invTagFailuresAsErr?: boolean, detectPlainFrameUniLeg?: boolean, failOffPoolNamedLegendaryBarrels?: boolean, bulkCheatAuditMode?: boolean }} [opts] — bulkCheatAuditMode: bulk page — skip spawn/weight/schedule hard-fails; inv chain still runs (exclusions, comp min/max, comp allowlist like Legit Builder; use relaxInvUniLegDeps to skip dependencytags). Unmapped rows without raw conflicts are Uncertain (need slot map), not OK.
   */
  /**
   * Critical / raw scans need deserialized `{fam:id}` text. Callers sometimes pass Base85 (@U…);
   * prefer decodeResult.deserialized whenever it contains brace tokens.
   */
  function resolveAuditSerialText(opts, decodeResult) {
    var fromOpts = opts && opts.rawSerial != null ? String(opts.rawSerial) : '';
    var fromDr =
      decodeResult &&
      (decodeResult.deserialized || decodeResult.deserialized_text || decodeResult.plain || '');
    fromDr = fromDr != null ? String(fromDr) : '';
    if (fromDr && /\{/.test(fromDr)) return fromDr;
    if (fromOpts && /\{/.test(fromOpts)) return fromOpts;
    return fromDr || fromOpts || '';
  }

  function validateDecodedSerial(decodeResult, opts) {
    opts = opts || {};
    var bulkAudit =
      opts.bulkCheatAuditMode === true ||
      (typeof window !== 'undefined' && window.STX_BULK_CHEAT_AUDIT === true);
    var r = decodeResult;
    var auditSerial = resolveAuditSerialText(opts, r);
    if (!r || !r.success) {
      return { ok: false, phase: 'decode', error: String((r && r.error) || 'decode failed') };
    }
    if (!window.LegitBuilderApi || typeof window.LegitBuilderApi.computeLegitValidationState !== 'function') {
      return { ok: false, phase: 'api', error: 'LegitBuilderApi.computeLegitValidationState missing' };
    }
    var manifestItem = resolveManifestItem(window.LegitBuilderApi.getAllItems, r);
    if (!manifestItem) {
      return {
        ok: false,
        phase: 'manifest',
        error: 'no_manifest',
        manufacturer: r.manufacturer,
        itemType: r.itemType
      };
    }
    var rp = r.resolvedParts || [];
    var unresolved = 0;
    var u;
    for (u = 0; u < rp.length; u++) if (rp[u] && rp[u].unresolved) unresolved++;
    var matchResult = matchResolvedToManifest(manifestItem, rp, {
      naturalMatch: bulkAudit === true
    });
    var selectedParts = matchResult.selectedParts;
    var slotOrder = matchResult.slotOrder;
    var slotFirstRow = matchResult.slotFirstRow || Object.create(null);
    var mappedRowsAll = Array.isArray(matchResult.mappedRowsAll) ? matchResult.mappedRowsAll : [];
    var mappedCount = Object.keys(selectedParts).length;
    function rawSerialHasInvKeyFromDb(rawSerial, result, wantInvKey) {
      try {
        if (!rawSerial || !result || !window.PARTS_DB) return false;
        var itemTypeId = result.itemTypeId != null ? result.itemTypeId : result.item_type_id;
        if (itemTypeId == null) return false;
        var s = String(rawSerial);
        var re = /\{(\d+)(?::(\d+))?\}/g;
        var m;
        var db = window.PARTS_DB;
        var want = String(wantInvKey || '').toLowerCase();
        while ((m = re.exec(s)) !== null) {
          var a = Number(m[1]);
          var b = m[2] != null ? Number(m[2]) : null;
          if (!Number.isFinite(a)) continue;
          var key = b != null && Number.isFinite(b) ? String(a) + ':' + String(b) : String(itemTypeId) + ':' + String(a);
          var arr = db[key];
          if (!Array.isArray(arr)) continue;
          for (var i = 0; i < arr.length; i++) {
            var row = arr[i];
            if (!row) continue;
            if (extractInvKeyFromResolvedRow(row) === want) return true;
          }
        }
      } catch (_) {}
      return false;
    }
    var il = r.level != null ? Number(r.level) : (opts.itemLevel != null ? Number(opts.itemLevel) : 60);
    if (!Number.isFinite(il)) il = 60;
    if (mappedCount === 0) {
      var rawEarly = computeRawResolvedInvIssues(r, manifestItem, selectedParts, {
        rawSerial: auditSerial,
        unmappedBulkExclusionOnly: bulkAudit === true
      });
      var slotMapEarly = bulkAudit ? collectBulkPartsOutsideItemMap(manifestItem, rp) : [];
      var criticalEarly = bulkAudit
        ? collectBalanceCriticalRuleIssues(r, manifestItem, auditSerial).concat(
            collectNonWeaponSlotOverMaxIssues(manifestItem, rp, selectedParts)
          )
        : [];
      /* Bulk: slot-map is FYI only — .be Critical Rules (wrong-root / dups) already cover cheats.
         Alpha-prefix slot-map over-fails WASM enrich (ambiguous PARTS_DB rows). */
      if (bulkAudit && slotMapEarly.length) {
        /* keep as diagnostic only after status built below when failing for other reasons */
      }
      if (rawEarly.length || criticalEarly.length) {
        return {
          ok: true,
          phase: 'mapped',
          manifestItem: manifestItem,
          selectedParts: selectedParts,
          unresolved: unresolved,
          resolvedRowCount: rp.length,
          mappedCount: 0,
          mapped: false,
          itemLevel: il,
          legitState: applyBalanceFailStatusLabel({
            status: 'err',
            statusText: 'Fail (data)',
            className: 'v-err',
            details: criticalEarly.concat(rawEarly).concat(
              (slotMapEarly || []).slice(0, 12).map(function (L) {
                return 'FYI ' + L;
              })
            ),
            statsIdRawFound: 0,
            statsAnyFound: 0,
            partCount: 0,
            itemSlotMax: 0,
            miniLineageHtml: ''
          })
        };
      }
      if (bulkAudit) {
        return {
          ok: true,
          phase: 'mapped',
          manifestItem: manifestItem,
          selectedParts: selectedParts,
          unresolved: unresolved,
          resolvedRowCount: rp.length,
          mappedCount: 0,
          mapped: false,
          itemLevel: il,
          legitState: {
            status: 'warn',
            statusText: 'Uncertain (no slot map)',
            className: 'v-warn',
            details: [
              'Bulk cheat-audit: unmapped to manifest slots; raw exclusion scan found no conflict, but deps/comp mins need a slot map — not OK (data).'
            ].concat(
              (slotMapEarly || []).slice(0, 12).map(function (L) {
                return 'FYI ' + L;
              })
            ),
            statsIdRawFound: 0,
            statsAnyFound: 0,
            partCount: 0,
            itemSlotMax: 0,
            miniLineageHtml: ''
          }
        };
      }
      return {
        ok: true,
        phase: 'mapped',
        manifestItem: manifestItem,
        selectedParts: selectedParts,
        unresolved: unresolved,
        resolvedRowCount: rp.length,
        mappedCount: 0,
        mapped: false,
        itemLevel: il,
        legitState: null
      };
    }
    var orderMismatches = null;
    if (window.LegitBuilderApi && typeof window.LegitBuilderApi.getNcsInfo === 'function') {
      orderMismatches = verifyPartOrderToNcs(manifestItem, slotOrder, window.LegitBuilderApi.getNcsInfo);
    }
    /* Honor explicit relaxInvUniLegDeps (bulk page passes false to enforce dependencytags). Do not
       override with bulkCheatAuditMode — that was skipping all dep checks and letting impossible part mixes pass. */
    var relaxInv = opts.relaxInvUniLegDeps === true;
    var invAsErr = opts.invTagFailuresAsErr;
    if (invAsErr === undefined) invAsErr = true;
    var dplain = opts.detectPlainFrameUniLeg;
    if (dplain === undefined) dplain = true;
    var computeOpts = {
      strictMode: opts.strictMode !== false,
      itemLevel: il,
      partOrderMismatches: orderMismatches,
      relaxInvUniLegDeps: relaxInv,
      invTagFailuresAsErr: invAsErr === true,
      detectPlainFrameUniLeg: dplain === true,
      failOffPoolNamedLegendaryBarrels: opts.failOffPoolNamedLegendaryBarrels === true,
      bulkCheatAuditMode: bulkAudit
    };
    if (bulkAudit && mappedRowsAll.length) {
      /* Every manifest-mapped decode row (incl. duplicate slots) contributes inv addtags for bulk global exclusion. */
      var extra = [];
      /* Some editors validate inv-tag exclusions against decoded inv parts even when a row doesn't match a
         manifest option (pool list drift). To avoid the raw global-pool false-positive wave, only include
         unmapped rows that (per INV_COMP_TAG_DATA) *add* licensed tags, and only from a small slot set. */
      try {
        var seenMappedInv = Object.create(null);
        for (var mi = 0; mi < mappedRowsAll.length; mi++) {
          var mr = mappedRowsAll[mi];
          if (mr && mr.invDumpKey) seenMappedInv[String(mr.invDumpKey).toLowerCase()] = true;
        }
        var invData = (typeof window !== 'undefined') ? window.INV_COMP_TAG_DATA : null;
        var TC = (typeof window !== 'undefined') ? window.TagCompValidation : null;
        var partsByName = invData && invData.partsByName ? invData.partsByName : null;
        var slugEx = String((manifestItem && manifestItem.slug) || '').toLowerCase();
        var nonWeaponEx = /classmod|enhancement|repair_kit|repkit/.test(slugEx);
        for (var ri = 0; ri < rp.length; ri++) {
          var row = rp[ri];
          if (!row || row.unresolved) continue;
          var sk = partTypeToSlotKey(row.part_type);
          if (!sk) sk = partTypeToSlotKey(row.weapon_type_or_category || '');
          sk = refineSlotKeyIfBodyGeneric(row, sk);
          var acTrim = String(row.alpha_code || '').trim();
          var dotRow = acTrim.lastIndexOf('.');
          var tailFromAlpha = dotRow >= 0 ? acTrim.slice(dotRow + 1).trim() : '';
          var invDumpKey = tailFromAlpha
            ? tailFromAlpha.toLowerCase()
            : (/^(?:part_|comp_|leg_)/i.test(acTrim) ? acTrim.toLowerCase() : String(row.name || '').trim().toLowerCase());
          if (!invDumpKey || seenMappedInv[invDumpKey]) continue;
          var looksLicensed = /licensed/i.test(invDumpKey) || /licensed/i.test(acTrim) || /licensed/i.test(String(row.name || ''));
          /* Non-weapons: seed all inv-keyed unmapped parts so CM/repkit/enhancement exclusions fire.
             Weapons: keep narrow licensed / acc seed to avoid pool false-positives. */
          if (
            !nonWeaponEx &&
            !looksLicensed &&
            sk !== 'barrel_acc' &&
            sk !== 'underbarrel' &&
            sk !== 'body_acc'
          ) {
            continue;
          }
          if (!partsByName || !TC) {
            if (looksLicensed || nonWeaponEx) {
              extra.push({
                slotKey: sk || 'body',
                row: row,
                optionIndex: null,
                manifestName: invDumpKey,
                invDumpKey: invDumpKey
              });
            }
            continue;
          }
          var meta = partsByName[invDumpKey];
          var addsLicensed = looksLicensed;
          if (meta) {
            var adds = TC.formatTags(meta.addtags);
            for (var ai = 0; ai < adds.length; ai++) {
              var t = adds[ai];
              if (t === 'licensed' || (t && t.indexOf('licensed_') === 0)) {
                addsLicensed = true;
                break;
              }
            }
          }
          if (!addsLicensed && !nonWeaponEx) continue;
          extra.push({
            slotKey: sk || 'body',
            row: row,
            optionIndex: null,
            manifestName: invDumpKey,
            invDumpKey: invDumpKey
          });
        }
      } catch (_) {}
      computeOpts.bulkGlobalExclRows = extra.length ? mappedRowsAll.concat(extra) : mappedRowsAll;
    }
    var legitState = window.LegitBuilderApi.computeLegitValidationState(manifestItem, selectedParts, computeOpts);
    /* Slot-map: FYI only in bulk — .be Critical (wrong-root/dups) covers cheats; alpha-prefix
       slot-map over-fails WASM enrich (ambiguous PARTS_DB rows / donor prefixes). */
    if (bulkAudit) {
      var slotMapViol = collectBulkPartsOutsideItemMap(manifestItem, rp);
      var smi;
      for (smi = 0; smi < slotMapViol.length; smi++) {
        var smLine = String(slotMapViol[smi] || '');
        if (legitState && Array.isArray(legitState.details)) {
          legitState = Object.assign({}, legitState, {
            details: legitState.details.concat(['FYI ' + smLine])
          });
        }
      }
      /* save-editor.be Critical Rules: wrong-root encodings + exact duplicate part keys (expanded lists). */
      var criticalViol = collectBalanceCriticalRuleIssues(r, manifestItem, auditSerial).concat(
        collectNonWeaponSlotOverMaxIssues(manifestItem, rp, selectedParts),
        collectAuditedExactInvIssues(r)
      );
      if (criticalViol.length) {
        legitState = promoteLegitStateFail(legitState, mappedCount, criticalViol);
      }
    }
    /* Mapped bulk: composition — guns one option per slot; class mods partition by manifest option
       so legit multi-option rows do not false-fail (see raw-inv-check v18 export). */
    var isWeaponManifest =
      manifestItem &&
      /_(?:pistol|ar|smg|shotgun|sniper|hw|heavy_weapon)$/i.test(String(manifestItem.slug || ''));
    if (bulkAudit && mappedCount > 0) {
      var builtSynth = buildBulkMappedCompositionSynth(mappedRowsAll, selectedParts, slotFirstRow, {
        partitionByOptionIndex: !isWeaponManifest
      });
      if (builtSynth.conflictLine) {
        /* Two distinct named barrels are a real illegal mix (for example T.K.'s Wave +
           Hellwalker). Other conflicts remain soft because WASM can attach two ambiguous
           PARTS_DB rows to one key. */
        if (builtSynth.hardConflictLine) {
          legitState = promoteLegitStateFail(legitState, mappedCount, [
            '[critical] ' + builtSynth.hardConflictLine
          ]);
        } else if (legitState && Array.isArray(legitState.details)) {
          legitState = Object.assign({}, legitState, {
            details: legitState.details.concat(['FYI [composition] ' + builtSynth.conflictLine])
          });
        }
      }
      /* Bulk mapped parity: promote .be-aligned raw signals without barrel_acc/body_acc under-min noise.
         Do NOT raw-promote Exclusion:unique — structural barrel_01/02 “excludes unique” false-fails
         natural Tediore legendaries that .be still Passes (TagComp path already covers real clashes).
         Class mods: scan full serialized pool for cm_stat_* / elem exclusion clashes (.be Balance Fail). */
      try {
        var slugForRaw = manifestItem && manifestItem.slug ? String(manifestItem.slug) : '';
        var isClassModRaw = /classmod/i.test(slugForRaw);
        var rawMapped = computeRawResolvedInvIssues(r, manifestItem, selectedParts, {
          rawSerial: auditSerial,
          skipRawDependencyChecks: isClassModRaw
        });
        var promote = [];
        var sawExclLicensed = false;
        var sawNeed2Found1 = false;
        var sawParityHard = false;
        for (var rmi = 0; rmi < rawMapped.length; rmi++) {
          var line = String(rawMapped[rmi] || '');
          if (
            /^Exclusion:/i.test(line) &&
            /Excludes tags in pool:\s*cm_stat_weapon_damage_type\b/i.test(line)
          ) {
            sawParityHard = true;
            promote.push(line);
            continue;
          }
          if (/^Exclusion:/i.test(line) && /Excludes tags in pool:\s*licensed(?:_|\b)/i.test(line)) {
            /* licensed_topacc / licensed_* structure tags false-fail .be Pass with barrel_acc combo. */
            if (/Excludes tags in pool:\s*licensed_topacc\b/i.test(line)) continue;
            if (/Excludes tags in pool:\s*licensed_(?:top|bottom|under|barrel|mag|scope)/i.test(line)) continue;
            sawExclLicensed = true;
            promote.push(line);
            continue;
          }
          if (/^Compatibility:\s*Missing required barrel_acc:\s*need\s*2,\s*found\s*1/i.test(line)) {
            sawNeed2Found1 = true;
            promote.push(line);
            continue;
          }
          var coreMiss = line.match(/^Compatibility:\s*Missing required\s+([a-z0-9_]+)/i);
          if (coreMiss && isCoreStructuralMissingSlot(coreMiss[1])) {
            sawParityHard = true;
            promote.push(line);
          }
        }
        var isWeaponSlug =
          /_(?:pistol|ar|smg|shotgun|sniper|hw|heavy_weapon)$/i.test(slugForRaw);
        /* cm_stat/elem exclusions + core structural missing only.
           Do NOT combo-promote licensed + barrel_acc need2/found1 — natural barrel_01/02
           rows emit Exclusion:licensed with incomplete acc counts and .be still Passes. */
        var shouldPromote = sawParityHard;
        if (shouldPromote && promote.length) {
          var ls1 =
            legitState || {
              status: 'idle',
              statusText: '',
              details: [],
              className: 'v-idle',
              statsIdRawFound: 0,
              statsAnyFound: 0,
              partCount: mappedCount,
              itemSlotMax: 0,
              miniLineageHtml: ''
            };
          var prevD1 = ls1.details && ls1.details.length ? ls1.details.slice() : [];
          var addLines = promote.map(function (ln) {
            return '[raw] ' + ln;
          });
          var have = Object.create(null);
          for (var di0 = 0; di0 < prevD1.length; di0++) have[String(prevD1[di0])] = true;
          var merged = prevD1.slice();
          for (var ai0 = 0; ai0 < addLines.length; ai0++) {
            if (!have[addLines[ai0]]) merged.push(addLines[ai0]);
          }
          legitState = Object.assign({}, ls1, {
            status: 'err',
            statusText: 'Fail (data)',
            className: 'v-err',
            details: merged
          });
        }
      } catch (_) {}
    }
    /* Minimal manifest (rarity + core): full Legit never sees body/stat/firmware. Scan serialized parts
       like weapons and promote bulk hard-fails only — avoids failing every valid TED row (manifest-gap). */
    if (
      bulkAudit &&
      mappedCount > 0 &&
      /_enhancement$/i.test(String(manifestItem.slug || '')) &&
      legitState &&
      legitState.status !== 'err'
    ) {
      try {
        var rawTed = computeRawResolvedInvIssues(r, manifestItem, selectedParts, {
          rawSerial: auditSerial,
          flagEnhancementWeaponTypeStatParts: true
        });
        var hardTed = [];
        var ti;
        for (ti = 0; ti < rawTed.length; ti++) {
          var lineTed = String(rawTed[ti] || '');
          if (rawCompositionLineIsBulkHardFail(lineTed)) hardTed.push('[raw] ' + lineTed);
        }
        if (hardTed.length) {
          var lsTed = legitState;
          var prevTed = lsTed.details && lsTed.details.length ? lsTed.details.slice() : [];
          legitState = Object.assign({}, lsTed, {
            status: 'err',
            statusText: 'Fail (data)',
            className: 'v-err',
            details: hardTed.concat(prevTed)
          });
        }
      } catch (_ted) {}
    }
    if (bulkAudit && legitState && legitState.status === 'err') {
      legitState = applyBalanceFailStatusLabel(legitState);
    }
    return {
      ok: true,
      phase: 'full',
      manifestItem: manifestItem,
      selectedParts: selectedParts,
      unresolved: unresolved,
      resolvedRowCount: rp.length,
      mappedCount: mappedCount,
      mapped: true,
      itemLevel: il,
      legitState: legitState
    };
  }

  window.LegitDecodeHelpers = {
    validateDecodedSerial: validateDecodedSerial,
    matchResolvedToManifest: matchResolvedToManifest,
    collectBulkPartsOutsideItemMap: collectBulkPartsOutsideItemMap,
    collectBalanceCriticalRuleIssues: collectBalanceCriticalRuleIssues,
    expandSerializedPartKeys: expandSerializedPartKeys,
    applyBalanceFailStatusLabel: applyBalanceFailStatusLabel,
    resolveManifestItem: resolveManifestItem,
    buildSimpleStateFromDecode: buildSimpleStateFromDecode,
    partTypeToSlotKey: partTypeToSlotKey,
    verifyPartOrderToNcs: verifyPartOrderToNcs,
    /** Exposed for `scripts/smoke-raw-inv-check.cjs` — same logic bulk uses via validateDecodedSerial. */
    computeRawResolvedInvIssues: computeRawResolvedInvIssues,
    __version: 'raw-inv-check-v78-exact-inv-parity'
  };

  function init() {
    var btn = document.getElementById('legit-decode-btn');
    var ta = document.getElementById('legit-decode-input');
    var out = document.getElementById('legit-decode-out');
    var statusEl = document.getElementById('legit-decode-status');
    if (!btn || !ta || !out) return;

    btn.addEventListener('click', function () {
      var raw = String(ta.value || '').trim();
      if (!raw) {
        out.className = 'validation-bar v-idle';
        out.textContent = 'Paste a serial.';
        return;
      }
      if (!window.LegitBuilderApi || typeof window.LegitBuilderApi.computeLegitValidationState !== 'function') {
        out.className = 'validation-bar v-err';
        out.innerHTML = '<strong>Legit API missing</strong><div class="v-details">Reload the page after scripts load.</div>';
        return;
      }
      if (typeof window.decodeSerialsViaBridge !== 'function') {
        out.className = 'validation-bar v-err';
        out.innerHTML = '<strong>Decoder unavailable</strong><div class="v-details">cc-stx-decoder-bridge.js did not load.</div>';
        return;
      }
      if (statusEl) statusEl.textContent = 'Decoding…';
      out.className = 'validation-bar v-idle';
      out.textContent = 'Loading decoder…';

      window.decodeSerialsViaBridge([raw], function (results) {
        if (statusEl) statusEl.textContent = '';
        var r = results && results[0];
        if (!r) {
          out.className = 'validation-bar v-err';
          out.innerHTML = '<strong>Decode failed</strong><div class="v-details">No result</div>';
          return;
        }
        if (!r.success) {
          out.className = 'validation-bar v-err';
          out.innerHTML = '<strong>Decode failed</strong><div class="v-details">' + String(r.error || 'unknown') + '</div>';
          return;
        }
        var manifestItem = resolveManifestItem(window.LegitBuilderApi.getAllItems, r);
        if (!manifestItem) {
          out.className = 'validation-bar v-err';
          out.innerHTML = '<strong>No manifest item</strong><div class="v-details">Could not map manufacturer/item type to a bl4_manifest slug. Got: ' +
            String(r.manufacturer || '—') + ' / ' + String(r.itemType || '—') + '</div>';
          return;
        }
        var rp = r.resolvedParts || [];
        var unresolved = 0;
        var u;
        for (u = 0; u < rp.length; u++) if (rp[u] && rp[u].unresolved) unresolved++;
        var matchResult = matchResolvedToManifest(manifestItem, rp);
        var selectedParts = matchResult.selectedParts;
        var partCount = Object.keys(selectedParts).length;
        var strictEl = document.getElementById('strict-mode');
        var ilInput = document.getElementById('item-level');
        var il = r.level != null ? Number(r.level) : (ilInput ? parseInt(ilInput.value, 10) : 60);
        if (!Number.isFinite(il)) il = 60;

        var pre = '<div style="font-size:0.72rem;color:rgba(233,254,255,0.55);margin-bottom:6px;">' +
          'Item: <strong>' + String(manifestItem.name || '') + '</strong> (' + String(manifestItem.slug || '') + ') &middot; Dataset parts: ' + rp.length +
          (unresolved ? ' (' + unresolved + ' unresolved)' : '') + ' &middot; Mapped to manifest slots: ' + partCount + '</div>';

        if (partCount === 0) {
          out.className = 'validation-bar v-warn';
          out.innerHTML = pre + '<strong>NO PARTS MAPPED</strong><div class="v-details">Decode succeeded but no resolved row matched a manifest option (by part_type → slot and name/alpha_code). Add parts manually above to validate.</div>';
          return;
        }

        var legitState = window.LegitBuilderApi.computeLegitValidationState(manifestItem, selectedParts, {
          strictMode: strictEl ? !!strictEl.checked : true,
          itemLevel: il,
          relaxInvUniLegDeps: false,
          invTagFailuresAsErr: true,
          detectPlainFrameUniLeg: true,
          failOffPoolNamedLegendaryBarrels: false
        });

        out.className = 'validation-bar ' + legitState.className;
        out.innerHTML = pre + '<strong>' + escapeHtmlLegit(legitState.statusText) + '</strong><div class="v-details">' + formatLegitDetailsHtml(legitState.details) + '</div>' + legitState.miniLineageHtml;
      }, { enrichResolved: true });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
