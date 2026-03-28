/**
 * cc-guided-builder-rebuild.js
 * Main Guided Builder: populates dropdowns from STX_DATASET, wires Add buttons,
 * emits codes to outCode. Supports Weapon, Heavy, Shield, Grenade, Repkit, Enhancement, Class Mod.
 */
(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }

  function isGuidedClassModItemType(val) {
    return /class\s*mod|classmod/i.test(String(val || '').trim());
  }

  var WEAPON_SLOTS = [
    { key: 'rarity', label: 'Rarity ID', partType: 'Rarity', selectId: 'ccRaritySelect', btnId: 'ccAddRarity' },
    { key: 'body', label: 'Body', partType: 'Body', selectId: 'ccBodySelect', btnId: 'ccAddBody' },
    { key: 'bodyAcc', label: 'Body Accessory', partType: 'Body Accessory', selectId: 'ccBodyAccSelect', btnId: 'ccAddBodyAcc' },
    { key: 'barrel', label: 'Barrel', partType: 'Barrel', selectId: 'ccBarrelSelect', btnId: 'ccAddBarrel' },
    { key: 'barrelAcc', label: 'Barrel Accessory', partType: 'Barrel Accessory', selectId: 'ccBarrelAccSelect', btnId: 'ccAddBarrelAcc' },
    { key: 'mag', label: 'Magazine', partType: 'Magazine', selectId: 'ccMagazineSelect', btnId: 'ccAddMagazine' },
    { key: 'scope', label: 'Scope', partType: 'Scope', selectId: 'ccScopeSelect', btnId: 'ccAddScope' },
    { key: 'scopeAcc', label: 'Scope Accessory', partType: 'Scope Accessory', selectId: 'ccScopeAccSelect', btnId: 'ccAddScopeAcc' },
    { key: 'grip', label: 'Grip', partType: 'Grip', selectId: 'ccGripSelect', btnId: 'ccAddGrip' },
    { key: 'foregrip', label: 'Foregrip', partType: 'Foregrip', selectId: 'ccForegripSelect', btnId: 'ccAddForegrip' },
    { key: 'underbarrel', label: 'Underbarrel', partType: 'Underbarrel', selectId: 'ccUnderbarrelSelect', btnId: 'ccAddUnderbarrel' },
    { key: 'licensed', label: 'Licensed Manufacturer Part', partType: 'Manufacturer Part', selectId: 'ccLicensedSelect', btnId: 'ccAddLicensed' },
    { key: 'element', label: 'Element', partType: 'Element', selectId: 'ccElementPartSelect', btnId: 'ccAddElementStack' },
    { key: 'elementSwitch', label: 'Maliwan Switch (2nd element)', partType: 'Element Switch', selectId: 'ccElementSwitchSelect', btnId: 'ccAddElementSwitch', maliwanOnly: true }
  ];

  var ELEMENTS = [
    { key: 'None', code: '' },
    { key: 'Corrosive', code: '{1:10}' },
    { key: 'Cryo', code: '{1:11}' },
    { key: 'Fire', code: '{1:12}' },
    { key: 'Radiation', code: '{1:13}' },
    { key: 'Shock', code: '{1:14}' }
  ];

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

  function fillSelect(sel, parts, maxItems) {
    if (!sel) return;
    sel.innerHTML = '';
    sel.appendChild(new Option('-- None / N/A --', ''));
    var limit = Math.min(parts.length, maxItems || 300);
    for (var i = 0; i < limit; i++) {
      var p = parts[i];
      var tok = getPartToken(p);
      if (!tok) continue;
      var name = (p.name || p.legendaryName || tok).substring(0, 60);
      var isPearl = /pearl/i.test(String(p.stats || ''));
      if (isPearl && name.indexOf('(Pearl)') === -1) name = name + ' (Pearl)';
      var ef = String(p.effects || p.effect || '').trim();
      if (ef) name = name + ' — ' + (ef.length > 50 ? ef.substring(0, 49) + '…' : ef);
      var opt = new Option(name, tok);
      var tit = partOptionHoverTitle(p);
      if (tit) opt.title = tit;
      sel.appendChild(opt);
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
    sel.innerHTML = '';
    sel.appendChild(new Option('-- None / N/A --', ''));
    var addPartToGroup = function (group, p) {
      var tok = getPartToken(p);
      if (!tok) return;
      var human = (p.name || p.legendaryName || '').substring(0, 40);
      var ef = String(p.effects || p.effect || '').trim();
      var efSuffix = ef ? (' — ' + (ef.length > 55 ? ef.substring(0, 54) + '…' : ef)) : '';
      var label = human ? (tok + ' - ' + human + efSuffix) : (tok + efSuffix);
      var opt = new Option(label, tok);
      try { opt.setAttribute('data-part', JSON.stringify(p)); } catch (_) {}
      var t = '';
      if (typeof window.partTooltipText === 'function') { try { t = window.partTooltipText(p) || ''; } catch (_) {} }
      if (!t) t = partOptionHoverTitle(p);
      if (t) opt.title = t;
      group.appendChild(opt);
    };
    if (heavy.length) {
      var g1 = document.createElement('optgroup');
      g1.label = 'Heavy Legendary Perks';
      for (var h = 0; h < Math.min(heavy.length, 100); h++) addPartToGroup(g1, heavy[h]);
      sel.appendChild(g1);
    }
    if (weapon.length) {
      var g2 = document.createElement('optgroup');
      g2.label = 'Weapon Legendary Perks';
      for (var w = 0; w < Math.min(weapon.length, 200); w++) addPartToGroup(g2, weapon[w]);
      sel.appendChild(g2);
    }
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
      if (wt && !seen[wt]) { seen[wt] = true; wtypes.push(wt); }
    }
    if (seen['Sniper'] && !seen['Sniper Rifle']) wtypes.push('Sniper Rifle');
    wtypes = wtypes.filter(function (w) { return w !== 'Sniper'; });
    wtypes.sort(function (a, b) { return String(a).localeCompare(String(b), undefined, { numeric: true }); });
    wtSel.innerHTML = '<option value="">Select weapon type...</option>';
    for (var j = 0; j < wtypes.length; j++) {
      if (wtypes[j]) wtSel.appendChild(new Option(wtypes[j], wtypes[j]));
    }
    var cur = (wtSel.value || '').trim();
    if (cur && wtypes.indexOf(cur) >= 0) { wtSel.value = cur; } else if (wtypes.length) { wtSel.value = wtypes[0]; }
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
      return;
    }
    var fromStx = !!(stxItem && stxItem.value) && (!itemSel || !itemSel.value || itemSel.value === stxItem.value);
    var placeholder = (itemType === 'Class Mod') ? 'Select character...' : 'Select manufacturer...';
    var preserveMan = (manSel.value || '').trim();
    manSel.innerHTML = '<option value="">' + placeholder + '</option>';
    manSel.disabled = false;
    if (stxMan && fromStx) stxMan.innerHTML = '<option value="">' + placeholder + '</option>';
    if (!itemType) return;

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
            manSel.appendChild(new Option(m, m));
            if (stxMan && fromStx) stxMan.appendChild(new Option(m, m));
          }
        }
        if (Object.keys(seen).length > 0) {
          if (preserveMan && Array.prototype.some.call(manSel.options, function (o) { return (o.value || '').trim() === preserveMan; })) {
            manSel.value = preserveMan;
            if (stxMan && fromStx) stxMan.value = preserveMan;
          }
          return;
        }
      }
      for (var f = 0; f < HEAVY_FALLBACK_MANS.length; f++) {
        manSel.appendChild(new Option(HEAVY_FALLBACK_MANS[f], HEAVY_FALLBACK_MANS[f]));
        if (stxMan && fromStx) stxMan.appendChild(new Option(HEAVY_FALLBACK_MANS[f], HEAVY_FALLBACK_MANS[f]));
      }
      if (preserveMan && Array.prototype.some.call(manSel.options, function (o) { return (o.value || '').trim() === preserveMan; })) {
        manSel.value = preserveMan;
        if (stxMan && fromStx) stxMan.value = preserveMan;
      }
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
              manSel.appendChild(new Option(displayName, m));
              if (stxMan && fromStx) stxMan.appendChild(new Option(displayName, m));
            }
          }
          if (preserveMan && Array.prototype.some.call(manSel.options, function(o){ return (o.value||'').trim() === preserveMan; })) {
            manSel.value = preserveMan;
            if (stxMan && fromStx) stxMan.value = preserveMan;
          }
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
          manSel.appendChild(new Option(displayName, m));
          if (stxMan && fromStx) stxMan.appendChild(new Option(displayName, m));
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
          var opt = new Option(displayName, pm);
          manSel.appendChild(opt);
          if (stxMan && fromStx) stxMan.appendChild(new Option(opt.text, opt.value));
        }
      }
    }
    if (Object.keys(seen).length === 0) {
      var fallback = itemType === 'Class Mod' ? CLASSMOD_FALLBACK_MANS : (itemType === 'Heavy Weapon' ? HEAVY_FALLBACK_MANS : (itemType === 'Weapon' ? WEAPON_FALLBACK_MANS : null));
      if (fallback) {
        for (var f = 0; f < fallback.length; f++) {
          var value = fallback[f];
          var label = (itemType === 'Class Mod') ? getClassModDisplayName(value) : value;
          manSel.appendChild(new Option(label, value));
          if (stxMan && fromStx) stxMan.appendChild(new Option(label, value));
        }
      }
    }
    if (preserveMan && Array.prototype.some.call(manSel.options, function(o){ return (o.value||'').trim() === preserveMan; })) {
      manSel.value = preserveMan;
      if (stxMan && fromStx) stxMan.value = preserveMan;
    }
  }

  function getGuidedOutputEl() {
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
    var baseFamily = null;
    for (var i = 0; i < tokens.length; i++) {
      baseFamily = getFamilyFromToken(tokens[i]);
      if (baseFamily != null) break;
    }
    if (baseFamily == null) baseFamily = getBaseFamilyFromPrefix(prefixStr);
    if (baseFamily == null || !window.normalizeIdTokensForBaseFamily) return tokens.join(' ');
    var norm = window.normalizeIdTokensForBaseFamily(tokens, baseFamily);
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
    var tokens = (tail.match(/\{[^}]+\}|\"[^\"]+\"|\S+/g) || []);
    if (replaceRarity) {
      tokens = tokens.filter(function (t) { return !isRarityToken(t); });
    }
    tokens.push(token.indexOf('{') === 0 ? token : (token.indexOf('"') >= 0 ? token : '"' + token + '"'));
    var newTail = normalizeGuidedTail(prefixStr, tokens);
    var newSerial = dbl >= 0 ? serial.slice(0, dbl + 2) + newTail : (serial ? serial + ' || ' + newTail : '|| ' + newTail);
    out.value = newSerial;
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
      return t && String(t).trim();
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

    for (var i = 0; i < WEAPON_SLOTS.length; i++) {
      var slot = WEAPON_SLOTS[i];
      var sel = byId(slot.selectId);
      if (!sel) continue;
      if (slot.partType === 'Element') {
        sel.innerHTML = '<option value="">-- Element --</option>';
        for (var j = 0; j < ELEMENTS.length; j++) {
          sel.appendChild(new Option(ELEMENTS[j].key, ELEMENTS[j].code));
        }
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
      } else {
        var all = getAllParts();
        filtered = filterByPartType(all, slot.partType, cat, man, wt);
      }
      if (slot.partType === 'Rarity' && filtered && filtered.length) {
        filtered = filtered.slice().sort(function (a, b) {
          var na = (a.name || a.legendaryName || '').toLowerCase();
          var nb = (b.name || b.legendaryName || '').toLowerCase();
          return na.localeCompare(nb, undefined, { numeric: true });
        });
      }
      var maxItems = (slot.partType === 'Rarity') ? 600 : 200;
      fillSelect(sel, filtered, maxItems);
    }
  }

  function wireWeaponAddButtons() {
    for (var i = 0; i < WEAPON_SLOTS.length; i++) {
      var slot = WEAPON_SLOTS[i];
      var btn = byId(slot.btnId);
      if (!btn) continue;
      (function (sid, isElement, isRarity) {
        btn.addEventListener('click', function () {
          if (isElement) addElement();
          else addGunPart(sid, isRarity);
        });
      })(slot.selectId, slot.partType === 'Element', slot.key === 'rarity');
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
      var maxItems = (slot.partType === 'Rarity') ? 600 : 200;
      if (category === 'Heavy Weapon' && slot.partType === 'Legendary Perks' && filtered && filtered.length) {
        fillSelectWithLegendaryGroups(sel, filtered);
      } else {
        fillSelect(sel, filtered, maxItems);
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

  function init() {
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
    }
    function onManufacturerOrWeaponChange() {
      syncGuidedToSimple();
      if (typeof loadGuidedWeaponTypes === 'function') loadGuidedWeaponTypes();
      syncGuidedVisibility();
      clearCodeSectionsForNewItem();
    }
    function onWeaponTypeChange() {
      syncGuidedToSimple();
      syncGuidedVisibility();
      clearCodeSectionsForNewItem();
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
    setTimeout(function () {
      var it = (guidedItem && guidedItem.value) || (byId('stx_itemType') && byId('stx_itemType').value);
      if (it) {
        loadGuidedManufacturers();
        if (typeof loadGuidedWeaponTypes === 'function') loadGuidedWeaponTypes();
        syncGuidedVisibility();
      }
      if (typeof window.refreshPartSections === 'function') window.refreshPartSections();
      if (typeof window.refreshGuidedOutput === 'function') window.refreshGuidedOutput();
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
    var pool = parts || [];
    var limit = Math.min(pool.length, maxItems || 200);
    for (var i = 0; i < limit; i++) {
      var p = pool[i];
      var tok = getPartToken(p);
      if (!tok) continue;
      var human = (p.name || p.legendaryName || '').substring(0, 40);
      var label = human ? (tok + ' - ' + human) : tok;
      var opt = new Option(label, tok);
      if (typeof window.partTooltipText === 'function') { var t = window.partTooltipText(p); if (t) opt.title = t; }
      sel.appendChild(opt);
    }
  }

  function refreshPartSections() {
    if (window.ensurePartPools) window.ensurePartPools();
    if (typeof window.__ccEnsureCodeIdMap === 'function') { try { window.__ccEnsureCodeIdMap(); } catch (_) {} }
    for (var i = 0; i < PART_SECTIONS.length; i++) {
      var s = PART_SECTIONS[i];
      var sel = byId(s.selectId);
      var pool = window[s.poolKey];
      fillPartSectionSelect(sel, pool || [], 200);
    }
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
        // Show token (numeric IDs) + human name so IDs are visible.
        var human = (px.name || px.legendaryName || '').substring(0, 40);
        var name = human ? (tok + ' - ' + human) : tok;
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
})();
