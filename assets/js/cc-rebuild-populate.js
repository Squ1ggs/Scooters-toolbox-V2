/**
 * cc-rebuild-populate.js
 * Shared population logic for skin/camo, preset parts, and legendary perks.
 * Used by bootstrap, guided builder, and rebuild-presets-random.
 */
(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }

  var PRESET_BOOST_POOLS = {
    damage: [{ key: 22, value: '72' }, { key: 9, value: '28' }, { key: 9, value: '32' }, { key: 9, value: '40' }, { key: 9, value: '55' }, { key: 9, value: '59' }, { key: 9, value: '62' }, { key: 9, value: '68' }],
    accuracy: [{ key: 13, value: '12' }, { key: 9, value: '48' }],
    reload: [{ key: 24, value: '44' }, { key: 9, value: '61' }],
    firerate: [{ key: 14, value: '1' }, { key: 27, value: '15' }],
    ammo: [{ key: 18, value: '14' }, { key: 27, value: '75' }],
    splash: [{ key: 6, value: '33' }, { key: 9, value: '89' }, { key: 24, value: '18' }],
    crit: [{ key: 3, value: '6' }, { key: 24, value: '33' }]
  };

  function getPartTokenForPopulate(p) {
    if (!p) return '';
    var raw = (p.idRaw || p.idraw || '').trim();
    var fam = p.family != null ? String(p.family) : '';
    var id = p.id != null ? String(p.id) : (p.itemId != null ? String(p.itemId) : '');
    return raw && /^\d+:\d+$/.test(raw) ? '{' + raw + '}' : (fam && id ? '{' + fam + ':' + id + '}' : (p.code || '').trim());
  }

  /** Full label in native tooltip when the closed select truncates text. */
  function attachSelectFullTitle(sel) {
    if (!sel || sel.__ccTitleBound) return;
    sel.__ccTitleBound = true;
    function upd() {
      var o = sel.options[sel.selectedIndex];
      sel.title = o ? String(o.textContent || o.label || o.value || '').trim() : '';
    }
    sel.addEventListener('change', upd);
    sel.addEventListener('focus', upd);
    upd();
  }

  /**
   * Populate skin and camo dropdowns from SPAWN_SKINS, SKINS, __CC_EXTRA_NUMERIC_SKINS.
   * @param {HTMLSelectElement|null} skinSel - Skin select element
   * @param {HTMLSelectElement|null} camoSel - Camo select element
   */
  function populateSkinCamo(skinSel, camoSel) {
    var hasSkinData = !!(window.SPAWN_SKINS && window.SPAWN_SKINS.length) || !!(window.SKINS && Object.keys(window.SKINS || {}).length) || !!(window.__CC_EXTRA_NUMERIC_SKINS && window.__CC_EXTRA_NUMERIC_SKINS.length);
    if (skinSel) {
      skinSel.removeAttribute('data-loading');
      if (!hasSkinData) { skinSel.innerHTML = '<option value="">Loading…</option>'; skinSel.setAttribute('data-loading', ''); }
    }
    if (camoSel) {
      camoSel.removeAttribute('data-loading');
      if (!hasSkinData) { camoSel.innerHTML = '<option value="">Loading…</option>'; camoSel.setAttribute('data-loading', ''); }
    }
    if (!hasSkinData) return;

    function appendGroup(sel, title, rows) {
      if (!sel || !rows || !rows.length) return;
      var og = document.createElement('optgroup');
      og.label = title;
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var o = document.createElement('option');
        o.value = r.value || r.code || (Array.isArray(r) ? r[0] : '');
        o.textContent = r.label || r.name || (Array.isArray(r) ? r[1] : '') || o.value;
        if (typeof window.skinTooltipText === 'function') { var t = window.skinTooltipText(o.value, o.textContent); if (t) o.title = t; }
        og.appendChild(o);
      }
      sel.appendChild(og);
    }

    if (skinSel) {
      skinSel.innerHTML = '<option value="">-- None --</option>';
      try {
        var spawn = window.SPAWN_SKINS || [];
        var spawnGroup = [], phosGroup = [], numericGroup = [];
        var numericSeen = {};
        for (var i = 0; i < spawn.length; i++) {
          var s = spawn[i];
          if (!s || !(s.value || s.code)) continue;
          var v = String(s.value || s.code).trim();
          var m = v.match(/Mat\s*0*([0-9]+)/i);
          var disp = s.label || s.name || v;
          if (m) disp = 'Mat' + m[1] + ' - ' + disp;
          var item = { value: v, label: disp };
          if (/Shiny/i.test(v)) phosGroup.push(item);
          else spawnGroup.push(item);
        }
        var extras = window.__CC_EXTRA_NUMERIC_SKINS || [];
        for (var j = 0; j < extras.length; j++) {
          var ex = extras[j];
          var code = Array.isArray(ex) ? ex[0] : (ex && ex.code);
          var name = Array.isArray(ex) ? ex[1] : (ex && (ex.name || ex.label));
          if (!code) continue;
          var k = String(code).toLowerCase();
          if (numericSeen[k]) continue;
          numericSeen[k] = true;
          numericGroup.push({ value: code, label: name ? (code + ' - ' + name) : code });
        }
        var SKINS = window.SKINS || {};
        for (var cat in SKINS) {
          var arr = SKINS[cat] || [];
          for (var idx = 0; idx < arr.length; idx++) {
            var sk = arr[idx];
            if (!sk || !sk.code) continue;
            var ck = String(sk.code).toLowerCase();
            if (numericSeen[ck]) continue;
            numericSeen[ck] = true;
            numericGroup.push({ value: sk.code, label: (sk.name || sk.label) ? (sk.code + ' - ' + (sk.name || sk.label)) : sk.code });
          }
        }
        appendGroup(skinSel, 'Spawn-ID Skins', spawnGroup);
        appendGroup(skinSel, 'Phosphene / Shiny', phosGroup);
        appendGroup(skinSel, 'Numeric ID Skins', numericGroup);
        attachSelectFullTitle(skinSel);
      } catch (_) {}
    }

    if (camoSel) {
      camoSel.innerHTML = '<option value="">-- None --</option>';
      try {
        function extractCamoIdFromCode(code) {
          if (!code || typeof code !== 'string') return [];
          var s = code.replace(/\s+/g, ' ').trim();
          var m = s.match(/^\{\s*\d+\s*:\s*(\d+)\s*\}$/);
          if (m) return [Number(m[1])];
          m = s.match(/^\{\s*\d+\s*:\s*\[\s*(\d+(?:\s+\d+)*)\s*\]\s*\}$/);
          if (m) return (m[1].match(/\d+/g) || []).map(Number);
          return [];
        }
        function toCamoToken(id) { return '|"c",' + String(id) + '|'; }
        var camoGroup = [];
        var camoSeen = {};
        var pushCamo = function (token, label) {
          var k = String(token).toLowerCase();
          if (camoSeen[k]) return;
          camoSeen[k] = true;
          camoGroup.push({ value: token, label: label || token });
        };
        var extras2 = window.__CC_EXTRA_NUMERIC_SKINS || [];
        for (var j2 = 0; j2 < extras2.length; j2++) {
          var ex2 = extras2[j2];
          var code2 = Array.isArray(ex2) ? ex2[0] : (ex2 && ex2.code);
          var name2 = Array.isArray(ex2) ? ex2[1] : (ex2 && (ex2.name || ex2.label));
          if (!code2 || !/^\{\s*\d+\s*:/.test(String(code2))) continue;
          var ids = extractCamoIdFromCode(String(code2));
          var label2 = name2 ? String(name2).trim() : '';
          for (var qi = 0; qi < ids.length; qi++) {
            var tid = ids[qi];
            if (!Number.isFinite(tid)) continue;
            var tok = toCamoToken(tid);
            pushCamo(tok, label2 ? label2 + ' (' + tok + ')' : tok);
          }
        }
        var SKINS2 = window.SKINS || {};
        for (var cat2 in SKINS2) {
          var arr2 = SKINS2[cat2] || [];
          for (var k2 = 0; k2 < arr2.length; k2++) {
            var sk2 = arr2[k2];
            if (!sk2 || !sk2.code || !/^\{\s*\d+\s*:/.test(String(sk2.code))) continue;
            var ids2 = extractCamoIdFromCode(String(sk2.code));
            var lbl2 = (sk2.name || sk2.label) ? String(sk2.name || sk2.label).trim() : '';
            for (var qi2 = 0; qi2 < ids2.length; qi2++) {
              var tid2 = ids2[qi2];
              if (!Number.isFinite(tid2)) continue;
              var tok2 = toCamoToken(tid2);
              pushCamo(tok2, lbl2 ? lbl2 + ' (' + tok2 + ')' : tok2);
            }
          }
        }
        appendGroup(camoSel, 'Camo codes (|"c",id|)', camoGroup);
        attachSelectFullTitle(camoSel);
      } catch (_) {}
    }

    try {
      if (skinSel) skinSel.dispatchEvent(new Event('change', { bubbles: true }));
      if (camoSel) camoSel.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (_) {}
  }

  /**
   * Populate preset category and part dropdowns.
   * @param {HTMLSelectElement|null} catSel - Category select
   * @param {HTMLSelectElement|null} partSel - Part select
   * @param {function} getToken - Optional token function for parts (default: getPartTokenForPopulate)
   */
  function populatePresetParts(catSel, partSel, getToken) {
    var tokFn = typeof getToken === 'function' ? getToken : getPartTokenForPopulate;
    if (!catSel) return;
    if (catSel.options.length <= 1) {
      var cats = ['Damage', 'Accuracy', 'Reload Speed', 'Fire Rate', 'Ammo', 'Splash Damage', 'Crit Damage'];
      var keys = ['damage', 'accuracy', 'reload', 'firerate', 'ammo', 'splash', 'crit'];
      catSel.innerHTML = '<option value="">-- Select Preset Category --</option>';
      for (var ci = 0; ci < cats.length; ci++) {
        var opt = document.createElement('option');
        opt.value = keys[ci];
        opt.textContent = cats[ci];
        catSel.appendChild(opt);
      }
    }
    if (!partSel) return;
    var catKey = (catSel.value || '').trim();
    partSel.innerHTML = '<option value="">-- Select preset --</option>';
    partSel.removeAttribute('data-loading');
    if (!catKey) return;
    var pool = PRESET_BOOST_POOLS[catKey];
    if (!Array.isArray(pool) || pool.length === 0) return;
    var parts = (window.STX_DATASET && window.STX_DATASET.ALL_PARTS) ? window.STX_DATASET.ALL_PARTS : [];
    if (!parts.length) {
      partSel.innerHTML = '<option value="">Loading…</option>';
      partSel.setAttribute('data-loading', '');
      return;
    }
    try {
      var idRawSet = {};
      for (var i = 0; i < pool.length; i++) {
        var e = pool[i];
        var k = e.key != null ? e.key : e.k;
        var v = e.value != null ? e.value : e.v;
        if (k != null && v != null) idRawSet[String(k) + ':' + String(v)] = true;
      }
      for (var j = 0; j < parts.length; j++) {
        var p = parts[j];
        if (!p) continue;
        var idRaw = String(p.idRaw || p.idraw || '').trim();
        if (!idRaw || !idRawSet[idRaw]) continue;
        var tok = tokFn(p);
        if (tok) {
          var human = (p.name || p.legendaryName || '').substring(0, 40);
          var ef = String(p.effects || p.effect || '').trim();
          var efSuffix = ef ? (' — ' + (ef.length > 55 ? ef.substring(0, 54) + '…' : ef)) : '';
          var label = human ? (tok + ' - ' + human + efSuffix) : (tok + efSuffix);
          var o = document.createElement('option');
          o.value = tok;
          o.textContent = label;
          if (typeof window.partTooltipText === 'function') { var t = window.partTooltipText(p); if (t) o.title = t; }
          partSel.appendChild(o);
        }
      }
    } catch (_) {}
  }

  function populatePresetCategories(catSel) {
    if (!catSel) return;
    var cats = ['Damage', 'Accuracy', 'Reload Speed', 'Fire Rate', 'Ammo', 'Splash Damage', 'Crit Damage'];
    var keys = ['damage', 'accuracy', 'reload', 'firerate', 'ammo', 'splash', 'crit'];
    catSel.innerHTML = '<option value="">-- Select Preset Category --</option>';
    for (var i = 0; i < cats.length; i++) {
      var o = document.createElement('option');
      o.value = keys[i];
      o.textContent = cats[i];
      catSel.appendChild(o);
    }
  }

  /**
   * Populate legendary perks dropdown.
   * @param {HTMLSelectElement|null} sel - Legendary perk select
   * @param {function} getToken - Optional token function (default: getPartTokenForPopulate)
   */
  function populateLegendaryPerks(sel, getToken) {
    if (!sel) return;
    var all = (window.STX_DATASET && window.STX_DATASET.ALL_PARTS) ? window.STX_DATASET.ALL_PARTS : [];
    if (!all.length) {
      sel.innerHTML = '<option value="">Loading…</option>';
      sel.setAttribute('data-loading', '');
      return;
    }
    sel.removeAttribute('data-loading');
    sel.innerHTML = '<option value="">-- Select legendary perk --</option>';
    try {
      var leg = all.filter(function (p) { return p && /legendary\s*perk/i.test(String(p.partType || '')); });
      var tokFn = typeof getToken === 'function' ? getToken : getPartTokenForPopulate;
      for (var i = 0; i < Math.min(leg.length, 150); i++) {
        var p = leg[i];
        var tok = tokFn(p);
        if (tok) {
          var human = (p.name || p.legendaryName || '').substring(0, 40);
          var ef = String(p.effects || p.effect || '').trim();
          var efSuffix = ef ? (' — ' + (ef.length > 55 ? ef.substring(0, 54) + '…' : ef)) : '';
          var label = human ? (tok + ' - ' + human + efSuffix) : (tok + efSuffix);
          var o = document.createElement('option');
          o.value = tok;
          o.textContent = label;
          if (typeof window.partTooltipText === 'function') { var t = window.partTooltipText(p); if (t) o.title = t; }
          sel.appendChild(o);
        }
      }
    } catch (_) {}
  }

  window.populateSkinCamo = populateSkinCamo;
  window.populatePresetParts = populatePresetParts;
  window.populatePresetCategories = populatePresetCategories;
  window.populateLegendaryPerks = populateLegendaryPerks;
  window.PRESET_BOOST_POOLS = PRESET_BOOST_POOLS;
})();
