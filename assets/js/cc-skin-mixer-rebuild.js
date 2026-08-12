/**
 * cc-skin-mixer-rebuild.js
 * Skin mixer: generate hybrid mixes from numeric-id brace skins.
 * Ported from ScootersToolbox.html with minor tweaks.
 */
(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }
  function norm(v) { return String(v == null ? '' : v).trim(); }

  function isNumericBrace(code) {
    var s = norm(code);
    return /^\{\s*\d+\s*:\s*(?:\[\s*\d+(?:\s+\d+)*\s*\]|\d+)\s*\}$/.test(s);
  }

  function extractFV(code) {
    var raw = String(code || '').trim();
    if (!raw || raw[0] !== '{' || raw[raw.length - 1] !== '}') return null;
    var clean = raw.slice(1, -1).trim();
    var idx = clean.indexOf(':');
    if (idx === -1) return null;
    var fam = clean.slice(0, idx).trim();
    var val = clean.slice(idx + 1).trim().replace(/[\[\]]/g, '').trim();
    if (!fam || !val) return null;
    return { fam: fam, val: val, raw: raw };
  }

  function getMixCategoryKey() {
    try {
      var SKINS = window.SKINS || {};
      if (SKINS.Special) return 'Special';
      var keys = Object.keys(SKINS);
      for (var i = 0; i < keys.length; i++) {
        if (/special/i.test(keys[i])) return keys[i];
      }
      return keys.length ? keys[0] : null;
    } catch (_) { return null; }
  }

  function addCustomMixSkin(name, fam, valueString) {
    var catKey = getMixCategoryKey();
    if (!catKey) return;
    var code = '{' + fam + ':[' + valueString + ']}';
    if (!window.SKINS) window.SKINS = {};
    if (!window.SKINS[catKey]) window.SKINS[catKey] = [];
    window.SKINS[catKey].push({ name: name, code: code, isCustomMix: true });
  }

  function buildMixOptions(familyFilter) {
    var out = [];
    var seen = new Set();
    function add(codeRaw, labelRaw) {
      var code = norm(codeRaw).replace(/\s+/g, ' ');
      if (!isNumericBrace(code)) return;
      if (familyFilter != null) {
        var fv = extractFV(code);
        if (!fv || fv.fam !== familyFilter) return;
      }
      var key = code.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      var label = norm(labelRaw);
      out.push({ value: code, label: label || 'Numeric Skin' });
    }
    try {
      var SKINS = window.SKINS || {};
      for (var cat in SKINS) {
        var arr = SKINS[cat] || [];
        for (var i = 0; i < arr.length; i++) {
          var sk = arr[i] || {};
          add(sk.code, sk.name || sk.label || '');
        }
      }
    } catch (_) {}
    try {
      var extras = window.__CC_EXTRA_NUMERIC_SKINS || [];
      for (var ei = 0; ei < extras.length; ei++) {
        var ex = extras[ei];
        if (Array.isArray(ex)) add(ex[0], ex[1]);
        else add(ex && ex.code, ex && (ex.name || ex.label || ''));
      }
    } catch (_) {}
    return out;
  }

  function populateOptionsInSelect(sel, options, placeholder) {
    if (!sel) return;
    var cur = sel.value;
    sel.innerHTML = '<option value="">' + (placeholder || '-- Select --') + '</option>';
    var seen = new Set();
    for (var i = 0; i < options.length; i++) {
      var e = options[i];
      var k = e.value + '|' + e.label;
      if (seen.has(k)) continue;
      seen.add(k);
      var o = document.createElement('option');
      o.value = e.value;
      o.textContent = e.label;
      if (typeof window.skinTooltipText === 'function') { var t = window.skinTooltipText(e.value, e.label); if (t) o.title = t; }
      sel.appendChild(o);
    }
    if (cur && Array.from(sel.options).some(function (opt) { return opt.value === cur; })) sel.value = cur;
  }

  function populateMixDropdowns() {
    var s1 = byId('mixSkin1');
    var s2 = byId('mixSkin2');
    var s3 = byId('mixSkin3');
    if (!s1 || !s2 || !s3) return;
    var prev1 = s1.value, prev2 = s2.value, prev3 = s3.value;

    var allOptions = buildMixOptions(null);
    var seen = new Set();
    var deduped = [];
    for (var i = 0; i < allOptions.length; i++) {
      var e = allOptions[i];
      var k = e.value + '|' + e.label;
      if (seen.has(k)) continue;
      seen.add(k);
      deduped.push(e);
    }

    s1.innerHTML = '<option value="">-- Skin 1 --</option>';
    for (var i = 0; i < deduped.length; i++) {
      var e = deduped[i];
      var o = document.createElement('option');
      o.value = e.value;
      o.textContent = e.label;
      if (typeof window.skinTooltipText === 'function') { var t = window.skinTooltipText(e.value, e.label); if (t) o.title = t; }
      s1.appendChild(o);
    }
    if (prev1 && Array.from(s1.options).some(function (opt) { return opt.value === prev1; })) s1.value = prev1;

    var fam = null;
    var s1Val = s1.value;
    if (s1Val) {
      var fv = extractFV(s1Val);
      if (fv) fam = fv.fam;
    }
    var optionsFor2and3 = fam != null ? buildMixOptions(fam) : [];
    if (s1Val && optionsFor2and3.length) {
      optionsFor2and3 = optionsFor2and3.filter(function (e) { return e.value !== s1Val; });
    }
    populateOptionsInSelect(s2, optionsFor2and3, '-- Skin 2 (select Skin 1 first) --');
    populateOptionsInSelect(s3, optionsFor2and3, '-- Skin 3 (optional) --');
    if (prev2 && Array.from(s2.options).some(function (opt) { return opt.value === prev2; })) s2.value = prev2;
    if (prev3 && Array.from(s3.options).some(function (opt) { return opt.value === prev3; })) s3.value = prev3;
  }

  function updateSkin2AndSkin3Options() {
    var s1 = byId('mixSkin1');
    var s2 = byId('mixSkin2');
    var s3 = byId('mixSkin3');
    if (!s1 || !s2 || !s3) return;
    var prev2 = s2.value, prev3 = s3.value;
    var fam = null;
    var s1Val = s1.value;
    if (s1Val) {
      var fv = extractFV(s1Val);
      if (fv) fam = fv.fam;
    }
    var options = fam != null ? buildMixOptions(fam) : [];
    if (s1Val && options.length) {
      options = options.filter(function (e) { return e.value !== s1Val; });
    }
    populateOptionsInSelect(s2, options, '-- Skin 2 (select Skin 1 first) --');
    populateOptionsInSelect(s3, options, '-- Skin 3 (optional) --');
    if (prev2 && Array.from(s2.options).some(function (opt) { return opt.value === prev2; })) s2.value = prev2;
    if (prev3 && Array.from(s3.options).some(function (opt) { return opt.value === prev3; })) s3.value = prev3;
  }

  function generateSkinMix() {
    var status = byId('mixStatus');
    var n = (byId('mixName') && byId('mixName').value) ? byId('mixName').value.trim() : '';
    var s1 = byId('mixSkin1') && byId('mixSkin1').value;
    var s2 = byId('mixSkin2') && byId('mixSkin2').value;
    var s3 = byId('mixSkin3') && byId('mixSkin3').value;

    if (!s1 || !s2) {
      if (status) status.textContent = 'Select required skins.';
      return;
    }
    var fv1 = extractFV(s1);
    var fv2 = extractFV(s2);
    var fv3 = s3 ? extractFV(s3) : null;

    if (!fv1 || !fv2) {
      if (status) status.textContent = 'Pick numeric-id brace skins (e.g. {289:25} or {9:[85 90]}).';
      return;
    }
    if (fv1.fam !== fv2.fam || (fv3 && fv1.fam !== fv3.fam)) {
      if (status) status.textContent = 'Selected skins must share the same family to mix.';
      return;
    }
    var fam = fv1.fam;
    var fvList = [fv1.val, fv2.val];
    if (fv3) fvList.push(fv3.val);
    var combinedVals = fvList.join(' ').trim();
    if (!combinedVals) {
      if (status) status.textContent = 'Selected skins are not mixable.';
      return;
    }
    var name = n || (fv3 ? 'Auto 3-Way Mix Skin' : 'Auto 2-Way Mix Skin');
    addCustomMixSkin(name, fam, combinedVals);
    if (status) status.textContent = 'Mix added!';
    populateMixDropdowns();
    if (typeof window.loadSkinOptions === 'function') window.loadSkinOptions();
    if (typeof window.loadToolsSkinCamo === 'function') window.loadToolsSkinCamo();
    if (typeof window.loadGuidedSkinCamo === 'function') window.loadGuidedSkinCamo();
  }

  function exportCustomMixes() {
    var mixes = [];
    try {
      var SKINS = window.SKINS || {};
      for (var cat in SKINS) {
        (SKINS[cat] || []).forEach(function (sk) {
          if (sk && sk.isCustomMix) {
            mixes.push({ category: cat, name: sk.name, code: sk.code });
          }
        });
      }
    } catch (_) {}
    var text = JSON.stringify(mixes, null, 2);
    var blob = new Blob([text], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'custom_mixes.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importCustomMixes(file) {
    var status = byId('mixStatus');
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) throw new Error('Invalid mix file');
        var SKINS = window.SKINS || {};
        data.forEach(function (entry) {
          if (!entry || !entry.code) return;
          var cat = (entry.category && SKINS[entry.category]) ? entry.category : getMixCategoryKey();
          if (!cat) return;
          if (!SKINS[cat]) SKINS[cat] = [];
          SKINS[cat].push({ name: entry.name || 'Imported Mix', code: entry.code, isCustomMix: true });
        });
        populateMixDropdowns();
        if (typeof window.loadSkinOptions === 'function') window.loadSkinOptions();
        if (typeof window.loadToolsSkinCamo === 'function') window.loadToolsSkinCamo();
        if (typeof window.loadGuidedSkinCamo === 'function') window.loadGuidedSkinCamo();
        if (status) status.textContent = 'Mixes imported!';
      } catch (err) {
        console.error('Import mixes failed:', err);
        if (status) status.textContent = 'Failed to import mixes (invalid file).';
      }
    };
    reader.readAsText(file);
  }

  function init() {
    populateMixDropdowns();
    var s1 = byId('mixSkin1');
    if (s1) s1.addEventListener('change', updateSkin2AndSkin3Options);
    var btn = byId('btnGenerateSkinMix');
    if (btn) btn.addEventListener('click', generateSkinMix);
    var exportBtn = byId('btnExportMixes');
    if (exportBtn) exportBtn.addEventListener('click', exportCustomMixes);
    var importInput = byId('mixImportInput');
    if (importInput) {
      importInput.addEventListener('change', function () {
        if (this.files && this.files[0]) importCustomMixes(this.files[0]);
        this.value = '';
      });
    }
  }

  window.populateMixDropdowns = populateMixDropdowns;
  window.generateSkinMix = generateSkinMix;
  window.exportCustomMixes = exportCustomMixes;
  window.importCustomMixes = importCustomMixes;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 100); });
  } else {
    setTimeout(init, 100);
  }
  window.addEventListener('load', function () { setTimeout(init, 200); });
})();
