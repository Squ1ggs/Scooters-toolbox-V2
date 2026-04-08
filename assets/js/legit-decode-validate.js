/**
 * Legit Builder: decode @U serial via STX bridge (iframe or inline WASM, enrichResolved) + map resolvedParts to manifest + computeLegitValidationState (data checks).
 * Depends: LegitBuilderApi (legacy/legit-builder.html), decodeSerialsViaBridge (cc-stx-decoder-bridge.js), computeSimpleBuilderItemSlug (cc-item-slug.js).
 */
(function () {
  'use strict';

  function escapeHtmlLegit(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&')
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
    if (/^core\s*augment/i.test(k)) return 'core_augment';
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

  function normPartName(s) {
    return String(s || '').toLowerCase().replace(/\s+/g, '_').replace(/^part_|^comp_/i, '').trim();
  }

  /**
   * Pick manifest option for a decoded row. Must prefer the most specific id (e.g. part_barrel_01_hellfire over
   * part_barrel_01) — otherwise inv dependencytags for the real part are never seen and cheats do not fail.
   */
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
       option's name before invDumpKey and bogus "OK" passes while save-editor shows allowlist/prereq fail. */
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
   * The save editor does not treat "two resolved rows for one CM option" as a hard fail: decode can
   * repeat a row or vary alpha vs name while still one pick — so **weapons only** apply a strict
   * same-option identity check; CM skips it (v20 falsely failed ~1k+ banks on stat_group1).
   */
  function buildBulkMappedCompositionSynth(mappedRowsAll, selectedParts, slotFirstRow, opts) {
    opts = opts || {};
    var partitionByOption = opts.partitionByOptionIndex === true;
    var slotToCanon = Object.create(null);
    var slotToRow = Object.create(null);
    var conflictSlots = Object.create(null);
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
    }
    var ckeys = Object.keys(conflictSlots);
    if (ckeys.length) {
      return {
        synth: [],
        conflictLine:
          'Multiple different parts map to the same manifest slot: ' + ckeys.sort().join(', ')
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
    return { synth: synth, conflictLine: '' };
  }

  function matchResolvedToManifest(manifestItem, resolvedParts) {
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
      if (!sk) continue;
      bucket = getManifestSlot(manifestItem, sk);
      if (!bucket || !bucket.slot || !bucket.slot.options) continue;
      opt = findOptionMatch(bucket.slot.options, row, bucket.key);
      if (!opt) continue;
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
    /* Serial omits empty accessory slots; NCS lists every slot. Require decode order ⊆ NCS order (subsequence). */
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
    var slugChk = String(manifestItem.slug || '');
    var isWeaponSlugChk = /_(?:pistol|ar|smg|shotgun|sniper|hw|heavy_weapon)$/i.test(slugChk);
    var isEnhancementSlugChk = /_enhancement$/i.test(slugChk);
    if (!manifestItem || (!isWeaponSlugChk && !isEnhancementSlugChk)) return out;
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
      var keys = parsePartKeysFromSerialized(rawSerial, itemTypeId);
      if (!keys.length) return out;
      var db = window.PARTS_DB;
      var seen = Object.create(null);
      for (var ki = 0; ki < keys.length; ki++) {
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
          /* Exclusion conflicts are effectively global composition constraints; use full pool to avoid order-only escapes. */
          var selfHasExTag = addTags.indexOf(ex) >= 0 || selfInferred.indexOf(ex) >= 0;
          var otherHasExTag = (tagCounts[ex] || 0) - (selfHasExTag ? 1 : 0) > 0;
          if (fullTagPool.has(ex) && otherHasExTag && addTags.indexOf(ex) < 0) {
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
    /* *_enhancement shares rarity comps but not weapon/class-mod slot layout — skip mins (see v54). */
    var rules = !exOnly && compRulesLookup && !isEnhancementSlugChk ? compRulesAll[compRulesLookup] : null;
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

  /** Same bar as LegitBuilderApi invReasonIsSaveEditorBulkHardFail for raw composition lines (enhancement post-pass). */
  function rawCompositionLineIsBulkHardFail(line) {
    var s = String(line || '');
    if (/^\[layout\]\s*Weapon-type stat part on enhancement bank/i.test(s)) return true;
    if (/^Comp allowlist:/i.test(s)) return true;
    if (/^Exclusion:/i.test(s) && /pool/i.test(s)) return true;
    var m = s.match(/Comp slot[^:]+: count (\d+) outside range \[(\d+),(\d+)\]/);
    if (m) {
      var cnt = parseInt(m[1], 10);
      var mi = parseInt(m[2], 10);
      if (Number.isFinite(cnt) && Number.isFinite(mi) && cnt < mi) return true;
    }
    if (/^Compatibility:\s*Missing required/i.test(s)) return true;
    if (/missing dependency tag/i.test(s)) {
      var rxd = /missing dependency tag "([^"]+)"/gi;
      var md;
      var sawQuoted = false;
      var hasActionable = false;
      while ((md = rxd.exec(s)) !== null) {
        sawQuoted = true;
        var tg = String(md[1] || '').toLowerCase();
        if (
          tg.indexOf('uni_') !== 0 &&
          tg.indexOf('leg_') !== 0 &&
          tg.indexOf('licensed_') !== 0 &&
          tg !== 'elem' &&
          tg !== 'ted_mirv'
        ) {
          hasActionable = true;
          break;
        }
      }
      if (hasActionable) return true;
      if (!sawQuoted) return true;
    }
    if (s.indexOf('exclusion tag') >= 0) {
      var tags = [];
      var re = /exclusion tag\s+"([^"]+)"/gi;
      var mm;
      while ((mm = re.exec(s)) !== null) tags.push(String(mm[1]).toLowerCase());
      if (tags.length === 0) return true;
      var bulkNoiseExcl = { unique: true, barrel_01: true, barrel_02: true };
      var ti;
      for (ti = 0; ti < tags.length; ti++) {
        if (!bulkNoiseExcl[tags[ti]]) return true;
      }
    }
    return false;
  }

  /**
   * Full data-backed validation for one enriched decode result (manifest + NCS + schedules + stats coverage).
   * Used by bulk serial validator iframe (Legit Builder context).
   * @param {object} decodeResult — one entry from decodeSerialsViaBridge with enrichResolved
   * @param {{ strictMode?: boolean, itemLevel?: number, relaxInvUniLegDeps?: boolean, invTagFailuresAsErr?: boolean, detectPlainFrameUniLeg?: boolean, failOffPoolNamedLegendaryBarrels?: boolean, bulkCheatAuditMode?: boolean }} [opts] — bulkCheatAuditMode: bulk page — skip spawn/weight/schedule hard-fails; inv chain still runs (exclusions, comp min/max, comp allowlist like Legit Builder; use relaxInvUniLegDeps to skip dependencytags). Unmapped rows OK if raw composition is clean.
   */
  function validateDecodedSerial(decodeResult, opts) {
    opts = opts || {};
    var bulkAudit =
      opts.bulkCheatAuditMode === true ||
      (typeof window !== 'undefined' && window.STX_BULK_CHEAT_AUDIT === true);
    var r = decodeResult;
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
    var matchResult = matchResolvedToManifest(manifestItem, rp);
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
        rawSerial: opts.rawSerial || '',
        unmappedBulkExclusionOnly: bulkAudit === true
      });
      if (rawEarly.length) {
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
            status: 'err',
            statusText: 'Fail (data)',
            className: 'v-err',
            details: rawEarly.slice(),
            statsIdRawFound: 0,
            statsAnyFound: 0,
            partCount: 0,
            itemSlotMax: 0,
            miniLineageHtml: ''
          }
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
            status: 'ok',
            statusText: 'OK (data)',
            className: 'v-ok',
            details: [
              'Bulk cheat-audit: unmapped to manifest slots; global inv-tag exclusion scan on raw parts found no conflict (deps/comp mins skipped — need slot map).'
            ],
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
        for (var ri = 0; ri < rp.length; ri++) {
          var row = rp[ri];
          if (!row || row.unresolved) continue;
          var sk = partTypeToSlotKey(row.part_type);
          if (!sk) sk = partTypeToSlotKey(row.weapon_type_or_category || '');
          sk = refineSlotKeyIfBodyGeneric(row, sk);
          if (sk !== 'barrel_acc' && sk !== 'underbarrel' && sk !== 'body_acc') continue;
          var acTrim = String(row.alpha_code || '').trim();
          var dotRow = acTrim.lastIndexOf('.');
          var tailFromAlpha = dotRow >= 0 ? acTrim.slice(dotRow + 1).trim() : '';
          var invDumpKey = tailFromAlpha
            ? tailFromAlpha.toLowerCase()
            : (/^(?:part_|comp_|leg_)/i.test(acTrim) ? acTrim.toLowerCase() : String(row.name || '').trim().toLowerCase());
          if (!invDumpKey || seenMappedInv[invDumpKey]) continue;
          if (!partsByName || !TC) continue;
          var meta = partsByName[invDumpKey];
          if (!meta) continue;
          var adds = TC.formatTags(meta.addtags);
          var addsLicensed = false;
          for (var ai = 0; ai < adds.length; ai++) {
            var t = adds[ai];
            if (t === 'licensed' || (t && t.indexOf('licensed_') === 0)) {
              addsLicensed = true;
              break;
            }
          }
          if (!addsLicensed) continue;
          extra.push({
            slotKey: sk,
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
        var ls0 =
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
        var prevD = ls0.details && ls0.details.length ? ls0.details.slice() : [];
        legitState = Object.assign({}, ls0, {
          status: 'err',
          statusText: 'Fail (data)',
          className: 'v-err',
          details: prevD.concat(['[composition] ' + builtSynth.conflictLine])
        });
      }
      /* Bulk mapped parity: keep strict fail promotion narrow to editor-significant raw signals only.
         This catches licensed exclusion + barrel_acc under-min cases when key parts are decoded but not
         manifest-mapped, without reintroducing broad raw dependency noise. */
      try {
        var rawMapped = computeRawResolvedInvIssues(r, manifestItem, selectedParts, {
          rawSerial: opts.rawSerial || ''
        });
        var promote = [];
        var sawExclLicensed = false;
        var sawNeed2Found1 = false;
        var sawVlaLicensedBarrelExcl = false;
        var sawLicensedJak = false;
        for (var rmi = 0; rmi < rawMapped.length; rmi++) {
          var line = String(rawMapped[rmi] || '');
          if (/part_barrel_licensed_jak/i.test(line)) sawLicensedJak = true;
          if (/^Exclusion:/i.test(line) && /Excludes tags in pool:\s*licensed/i.test(line)) {
            sawExclLicensed = true;
            if (/part_barrel_0[12]_a/i.test(line)) sawVlaLicensedBarrelExcl = true;
            promote.push(line);
          } else if (/^Compatibility:\s*Missing required barrel_acc:\s*need\s*2,\s*found\s*1/i.test(line)) {
            sawNeed2Found1 = true;
            promote.push(line);
          }
        }
        /* Extremely narrow bulk parity: only fail when the editor's hallmark combo appears for the known
           problematic item family (vladof_sniper). Broader application caused large false-positive waves. */
        var slug = manifestItem && manifestItem.slug ? String(manifestItem.slug) : '';
        var isVladofSniper = /^vladof_sniper$/i.test(slug);
        var isVladofSmg = /^vladof_smg$/i.test(slug);
        var hasLicensedJakByDb = rawSerialHasInvKeyFromDb(opts.rawSerial || '', r, 'part_barrel_licensed_jak');
        if (
          (
            (isVladofSniper &&
              ((sawExclLicensed && sawNeed2Found1) ||
                (sawVlaLicensedBarrelExcl && (sawLicensedJak || hasLicensedJakByDb)))) ||
            (isVladofSmg && sawExclLicensed && sawNeed2Found1 && hasLicensedJakByDb)
          )
        ) {
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
          legitState = Object.assign({}, ls1, {
            status: 'err',
            statusText: 'Fail (data)',
            className: 'v-err',
            details: prevD1.concat(promote.map(function (ln) { return '[raw] ' + ln; }))
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
          rawSerial: opts.rawSerial || '',
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
    resolveManifestItem: resolveManifestItem,
    buildSimpleStateFromDecode: buildSimpleStateFromDecode,
    partTypeToSlotKey: partTypeToSlotKey,
    verifyPartOrderToNcs: verifyPartOrderToNcs,
    /** Exposed for `scripts/smoke-raw-inv-check.cjs` — same logic bulk uses via validateDecodedSerial. */
    computeRawResolvedInvIssues: computeRawResolvedInvIssues,
    __version: 'raw-inv-check-v56-enhancement-wt-stat-layout'
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
