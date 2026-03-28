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

  function normPartName(s) {
    return String(s || '').toLowerCase().replace(/\s+/g, '_').replace(/^part_|^comp_/i, '').trim();
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
    for (i = 0; i < options.length; i++) {
      o = options[i];
      if (!o || !o.name) continue;
      if (o.name === compPart || o.name === nameFromRow) return o;
      if (normPartName(o.name) === normPartName(nameFromRow)) return o;
      if (compPart && normPartName(o.name) === normPartName(compPart)) return o;
      if (compPart && (nameFromRow.indexOf(o.name) >= 0 || o.name.indexOf(compPart) >= 0)) return o;
      if (compPart && normPartName(compPart).indexOf(normPartName(o.name)) >= 0) return o;
    }
    if (slotKey === 'class_mod' && options.length > 0 && (/body|name\+skin|name and skin/i.test(pt) || /body|grav|leg|asm/i.test(compPart + nameFromRow))) {
      return options[0];
    }
    if ((slotKey === 'stat_group1' || slotKey === 'stat_group2' || slotKey === 'stat_group3') && options.length > 0 && /skill|perk|stat/i.test(pt)) {
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
    return null;
  }

  function matchResolvedToManifest(manifestItem, resolvedParts) {
    var selectedParts = {};
    var slotOrder = [];
    if (!manifestItem || !manifestItem.slots || !Array.isArray(resolvedParts)) return { selectedParts: selectedParts, slotOrder: slotOrder };
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
      if (!sk) continue;
      bucket = getManifestSlot(manifestItem, sk);
      if (!bucket || !bucket.slot || !bucket.slot.options) continue;
      opt = findOptionMatch(bucket.slot.options, row, bucket.key);
      if (!opt) continue;
      var slotKey = bucket.key;
      if (seenSlot[slotKey]) continue;
      seenSlot[slotKey] = true;
      selectedParts[slotKey] = { index: opt.index, name: opt.name, in_pool: opt.in_pool === true, slot: slotKey };
      slotOrder[i] = slotKey;
    }
    return { selectedParts: selectedParts, slotOrder: slotOrder };
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
    var mismatches = [];
    for (var i = 0; i < slotOrder.length; i++) {
      var mapped = slotOrder[i];
      if (!mapped) continue;
      var expected = ncsSlots[i];
      if (!expected) continue;
      if (slotToNcsEquiv(mapped) !== slotToNcsEquiv(expected)) {
        mismatches.push('Position ' + i + ': expected ' + expected + ', got ' + mapped);
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

  /**
   * Full data-backed validation for one enriched decode result (manifest + NCS + schedules + sources + stats coverage).
   * Used by bulk serial validator iframe (Legit Builder context).
   * @param {object} decodeResult — one entry from decodeSerialsViaBridge with enrichResolved
   * @param {{ strictMode?: boolean, itemLevel?: number }} [opts]
   */
  function validateDecodedSerial(decodeResult, opts) {
    opts = opts || {};
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
    var mappedCount = Object.keys(selectedParts).length;
    var il = r.level != null ? Number(r.level) : (opts.itemLevel != null ? Number(opts.itemLevel) : 60);
    if (!Number.isFinite(il)) il = 60;
    if (mappedCount === 0) {
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
    var legitState = window.LegitBuilderApi.computeLegitValidationState(manifestItem, selectedParts, {
      strictMode: opts.strictMode !== false,
      itemLevel: il,
      partOrderMismatches: orderMismatches
    });
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
    verifyPartOrderToNcs: verifyPartOrderToNcs
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
          itemLevel: il
        });

        out.className = 'validation-bar ' + legitState.className;
        out.innerHTML = pre + '<strong>' + escapeHtmlLegit(legitState.statusText) + '</strong><div class="v-details">' + formatLegitDetailsHtml(legitState.details) + '</div>' + legitState.miniLineageHtml;
      }, { enrichResolved: true });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
