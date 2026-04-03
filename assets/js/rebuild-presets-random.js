/**
 * rebuild-presets-random.js - Presets, random build, tools, build stats
 */
(function(){
  "use strict";
  function byId(id){ return document.getElementById(id); }
  function loadPresetCategories(){
    var sel = byId("presetCategorySelect");
    if (!sel) return;
    if (typeof window.populatePresetCategories === 'function') window.populatePresetCategories(sel);
  }
  function loadPresetParts(){
    var catSel = byId("presetCategorySelect");
    var partSel = byId("presetPartSelect");
    if (!catSel || !partSel) return;
    if (typeof window.populatePresetParts === 'function') window.populatePresetParts(catSel, partSel);
  }
  function isRarityTokenBootstrap(t) {
    var s = String(t || "").trim();
    var m = s.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
    if (m) {
      var fam = Number(m[1]);
      var id = Number(m[2]);
      if (fam === 1 && id >= 10 && id <= 14) return false;
      if (fam === 1 && id >= 55 && id <= 60) return false;
      return true;
    }
    return !!s.match(/^\{\s*\d+\s*\}$/);
  }

  function getBaseFamilyIdFromSerial(serial) {
    try {
      var s = String(serial || "");
      var dbl = s.indexOf("||");
      var prefix = dbl >= 0 ? s.slice(0, dbl).trim() : s.trim();
      var m = prefix.match(/^\s*(\d+)\s*[,\|]/);
      if (!m) m = prefix.match(/^\s*(\d+)/);
      return m ? Number(m[1]) : null;
    } catch (_) { return null; }
  }

  function normalizeBracedIdToken(token) {
    // Accept "22:72" / "95" too; always return something like "{22:72}" or "{95}".
    var t = String(token || "").trim();
    t = t.replace(/^"+|"+$/g, '');
    if (/^\d+:\d+$/.test(t)) return '{' + t + '}';
    if (/^\d+$/.test(t)) return '{' + t + '}';
    return t;
  }

  function normalizeIdTokenForBaseFamily(token, baseFamilyId) {
    var t = normalizeBracedIdToken(token);
    var m = t.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
    if (!m) return t; // already singular like "{95}" or non-matching
    var fam = Number(m[1]);
    var id = Number(m[2]);
    if (baseFamilyId != null && fam === baseFamilyId) {
      // Same family as the item header: allow singular "{95}" form.
      return '{' + id + '}';
    }
    return '{' + fam + ':' + id + '}';
  }

  function addPresetPart(){
    var partSel = byId("presetPartSelect");
    var qty = byId("presetQuantity");
    var outCode = byId("outCode");
    if (!partSel || !outCode) return;
    var code = (partSel.value || "").trim();
    if (!code) return;
    code = normalizeBracedIdToken(code);
    var n = Math.max(1, parseInt((qty && qty.value) || "1", 10) || 1);
    var serial = (outCode.value || "").trim();
    var dbl = serial.indexOf("||");
    var tail = dbl >= 0 ? serial.slice(dbl + 2) : "";
    var baseFamilyId = getBaseFamilyIdFromSerial(serial);
    var tokens = (tail.match(/\{[^}]+\}|\"[^\"]+\"|\S+/g) || []);
    if (isRarityTokenBootstrap(code)) {
      tokens = tokens.filter(function(t){ return !isRarityTokenBootstrap(t); });
    }
    for (var i = 0; i < n; i++) tokens.push(normalizeIdTokenForBaseFamily(code, baseFamilyId));
    var newTail = tokens.join(" ");
    var newSerial = dbl >= 0 ? serial.slice(0, dbl + 2) + newTail : (serial ? serial + " || " + newTail : "|| " + newTail);
    outCode.value = newSerial;
    try { if (window.refreshOutputs) window.refreshOutputs(); } catch(_){}
  }
  function appendToOutCode(tok) {
    var out = byId("outCode");
    if (!out) return;
    var serial = (out.value || "").trim();
    var dbl = serial.indexOf("||");
    var tail = dbl >= 0 ? serial.slice(dbl + 2).trim() : "";
    var tokens = (tail.match(/\{[^}]+\}|\"[^\"]+\"|\S+/g) || []);
    var baseFamilyId = getBaseFamilyIdFromSerial(serial);
    var token = normalizeBracedIdToken(tok);
    if (isRarityTokenBootstrap(token)) {
      tokens = tokens.filter(function(t){ return !isRarityTokenBootstrap(t); });
    }
    tokens.push(normalizeIdTokenForBaseFamily(token, baseFamilyId));
    var newTail = tokens.join(" ");
    var newSerial = dbl >= 0 ? serial.slice(0, dbl + 2) + newTail : (serial ? serial + " || " + newTail : "|| " + newTail);
    out.value = newSerial;
    try { if (window.refreshOutputs) window.refreshOutputs(); } catch(_){}
    try { if (typeof window.refreshBuildStatsCore === 'function') window.refreshBuildStatsCore(); } catch(_){}
  }
  function loadLegendaryPerks() {
    var sel = byId("legendaryPerkSelect");
    if (typeof window.populateLegendaryPerks === 'function') window.populateLegendaryPerks(sel);
  }
  function parseBrace(s) {
    s = String(s || "").trim();
    var m = s.match(/^\{\s*(\d+)\s*(?::\s*(\d+)\s*)?\}$/);
    if (!m) return null;
    var a = Number(m[1]);
    var b = m[2] != null ? Number(m[2]) : null;
    return { a: a, b: b, id: b != null ? b : a };
  }
  function tryResolveToken(tok) {
    var t = String(tok || "").trim();
    if (!t) return null;
    var all = [];
    try { if (window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS)) all = all.concat(window.STX_DATASET.ALL_PARTS); } catch(_){}
    try { if (Array.isArray(window.ALL_PARTS)) all = all.concat(window.ALL_PARTS); } catch(_){}
    try { if (Array.isArray(window.GUN_PARTS)) all = all.concat(window.GUN_PARTS); } catch(_){}
    try { if (Array.isArray(window.GRENADE_PARTS)) all = all.concat(window.GRENADE_PARTS); } catch(_){}
    try { if (Array.isArray(window.SHIELD_PARTS)) all = all.concat(window.SHIELD_PARTS); } catch(_){}
    var norm = function(s){ return String(s||"").replace(/^"+|"+$/g,"").trim(); };
    var tNorm = norm(t);
    for (var i = 0; i < all.length; i++) {
      var p = all[i];
      if (!p) continue;
      if (String(p.idRaw || p.idraw || "").trim() === t) return p;
      if (/^\d+$/.test(t) && Number(p.id) === Number(t)) return p;
      if (norm(p.code || p.spawnCode || "") === tNorm) return p;
      var brace = parseBrace(t);
      if (brace && p.family != null && p.id != null && brace.a === Number(p.family) && brace.b === Number(p.id)) return p;
    }
    return null;
  }
  function resolveTokenWithContext(tok, baseFamilyId) {
    var t = String(tok || "").trim();
    var p = tryResolveToken(t);
    if (p) return p;
    var brace = parseBrace(t);
    if (!brace || brace.b != null || !Number.isFinite(baseFamilyId)) return null;
    var targetId = Number(brace.id);
    var all = [];
    try { if (window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS)) all = all.concat(window.STX_DATASET.ALL_PARTS); } catch(_){}
    try { if (Array.isArray(window.ALL_PARTS)) all = all.concat(window.ALL_PARTS); } catch(_){}
    for (var i = 0; i < all.length; i++) {
      var row = all[i];
      if (!row) continue;
      if (Number(row.family) === Number(baseFamilyId) && Number(row.id) === targetId) return row;
    }
    return null;
  }
  function extractInspectorTokens(src) {
    var work = String(src || "").trim();
    if (!work) return [];
    if (work.indexOf("||") < 0 && work.indexOf("{") < 0 && work.length > 20 && typeof window.deserializeBase85 === "function") {
      try {
        var deser = window.deserializeBase85(work);
        if (deser && typeof deser === "string" && deser.indexOf("||") >= 0) work = deser.trim();
      } catch (_) {}
    }
    var tail = "";
    var dbl = work.indexOf("||");
    if (dbl >= 0) {
      tail = work.slice(dbl + 2).trim();
    } else {
      var firstBrace = work.indexOf("{");
      tail = firstBrace >= 0 ? work.slice(firstBrace).trim() : work;
    }
    var rawTokens = (tail.match(/\{[^}]+\}|\"[^\"]+\"|\|\s*["']?c["']?\s*,\s*\d+\s*\||[A-Za-z_][A-Za-z0-9_.:-]*/g) || []);
    var out = [];
    for (var i = 0; i < rawTokens.length; i++) {
      var tok = String(rawTokens[i] || "").trim();
      if (!tok) continue;
      if (/^\{\s*\d+\s*(?::\s*\d+\s*)?\}$/.test(tok) || /^\"[^\"]+\"$/.test(tok) || /^\|\s*["']?c["']?\s*,\s*\d+\s*\|$/.test(tok) || /[A-Za-z_]/.test(tok)) {
        out.push(tok);
      }
    }
    return out;
  }
  window.__lookupPartByImportCode = function(code) {
    var c = String(code || "").replace(/^"+|"+$/g, "").trim();
    if (!c) return null;
    var p = tryResolveToken(c) || tryResolveToken('"' + c + '"');
    if (p) return p;
    if (typeof window.tryResolveToken === "function") return window.tryResolveToken(c) || window.tryResolveToken('"' + c + '"');
    return null;
  };
  function getFamilyForPart(part) {
    if (!part) return "";
    if (typeof part === "object") {
      if (part.family != null) return String(part.family);
      if (part.familyId != null) return String(part.familyId);
    }
    var code = String(typeof part === "string" ? part : (part.code || part.spawnCode || "")).trim();
    var brace = parseBrace(code);
    if (brace && brace.b != null) return String(brace.a);
    return "";
  }
  function getStatsText(part) {
    var BUCKET_LABELS = {
      damage: 'Damage',
      crit: 'Crit',
      elemental: 'Elemental',
      accuracy: 'Accuracy',
      ads: 'ADS/Handling',
      firerate: 'Fire Rate',
      reload_time: 'Reload Time',
      reload_speed: 'Reload Speed',
      ammo_mag: 'Ammo/Mag',
      projectiles: 'Projectiles'
    };
    function fromPartsStatsData(p) {
      try {
        var data = window.PARTS_STATS_DATA;
        if (!data) return '';
        var keys = [];
        var c1 = String((p && (p.code || p.spawnCode || p.importCode || '')) || '').trim().replace(/^"+|"+$/g, '');
        if (c1) keys.push(c1);
        var idRaw = String((p && (p.idRaw || p.idraw || '')) || '').trim();
        if (idRaw) keys.push(idRaw);
        if (p && p.family != null && p.id != null) keys.push(String(p.family) + ':' + String(p.id));
        for (var i = 0; i < keys.length; i++) {
          var k = String(keys[i] || '').trim();
          if (!k) continue;
          var rows = (data.by_id_raw && data.by_id_raw[k]) || (data.by_part_code && data.by_part_code[k]);
          if (!rows && data.by_part_code) rows = data.by_part_code[String(k).toLowerCase()];
          if (!rows && data.by_code_suffix) {
            var suffix = String(k).split('.').pop();
            rows = data.by_code_suffix[String(suffix || '').toLowerCase()];
          }
          if (!rows || !rows.length) continue;
          var out = [];
          for (var j = 0; j < Math.min(rows.length, 4); j++) {
            var s = rows[j];
            var v = Number(s && s.stat_value);
            if (!Number.isFinite(v)) continue;
            var bucket = (s && s.bucket) ? String(s.bucket).trim() : '';
            var lbl = BUCKET_LABELS[bucket] || bucket || 'Stat';
            var mult = (s && s.combine === 'mul') ? v : (1 + v);
            if (s && s.invert && mult) mult = 1 / mult;
            var pct = ((mult - 1) * 100).toFixed(0);
            out.push((pct >= 0 ? '+' : '') + pct + '% ' + lbl);
          }
          if (out.length) return out.join(', ');
        }
      } catch (_) {}
      return '';
    }
    try {
      if (typeof window.getPrecisePartStats === "function") {
        var val = window.getPrecisePartStats(part);
        var s = String(val || "").trim();
        if (s && !/^no stat changes/i.test(s)) return s;
      }
    } catch(_){}
    try {
      var direct = fromPartsStatsData(part);
      if (direct) return direct;
    } catch (_) {}
    try {
      var st = String(part && (part.stats || part.statText || part.effects || part.effect) || '').trim();
      if (st && !/^barrel part for/i.test(st)) return st;
    } catch (_) {}
    return "";
  }
  function esc(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

  /** Prefer Guided deserialized when Guided item type is set; else Generated code; else paste box. */
  function getInspectorSerialSource() {
    var gi = byId("ccGuidedItemType");
    var guidedOn = gi && String(gi.value || "").trim();
    var g = byId("guidedOutputDeserialized");
    var o = byId("outCode");
    var imp = byId("importBox");
    var gv = g && String(g.value || "").trim();
    var ov = o && String(o.value || "").trim();
    var iv = imp && String(imp.value || "").trim();
    if (guidedOn) {
      if (gv) return gv;
      if (ov) return ov;
      return iv || "";
    }
    if (ov) return ov;
    if (gv) return gv;
    return iv || "";
  }

  function normTailTokenKeyIpi(t) {
    var u = String(t || "").trim().replace(/^"+|"+$/g, "");
    var m = u.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
    if (m) return m[1] + ":" + m[2];
    m = u.match(/^\{\s*(\d+)\s*\}$/);
    if (m) return "s:" + m[1];
    return u;
  }

  function refreshImportedInspector() {
    var tbody = byId("ipiBody");
    var badge = byId("ipiCount");
    var src = getInspectorSerialSource();
    if (!tbody || !badge) return;
    var baseFamilyId = getBaseFamilyIdFromSerial(src);
    var tokens = extractInspectorTokens(src);
    if (!tokens.length) {
      badge.textContent = "0 added";
      tbody.innerHTML = '<tr><td class="ipi-dim" colspan="7" style="color:rgba(255,255,255,0.62);">No part tokens after <code>||</code>. Paste or import a serial above, or build in Guided / Simple Builder.</td></tr>';
      return;
    }
    var order = [];
    var counts = {};
    var firstTok = {};
    for (var ti = 0; ti < tokens.length; ti++) {
      var tok = tokens[ti];
      var k = normTailTokenKeyIpi(tok);
      if (!counts[k]) {
        counts[k] = 0;
        firstTok[k] = tok;
        order.push(k);
      }
      counts[k]++;
    }
    badge.textContent = tokens.length + (tokens.length === 1 ? " token" : " tokens") + " (" + order.length + " unique)";
    var rows = [];
    for (var oi = 0; oi < order.length; oi++) {
      var key = order[oi];
      var rep = firstTok[key];
      var p = resolveTokenWithContext(rep, baseFamilyId);
      var cat = p ? String(p.category || p.itemType || "").trim() || "—" : "—";
      var name = p ? String(p.name || p.legendaryName || rep).trim() || "(unknown)" : String(rep);
      var rawCode = String(rep).replace(/^"+|"+$/g, "");
      var brace = parseBrace(rawCode);
      var fam = p ? getFamilyForPart(p) : (brace && brace.b != null ? String(brace.a) : "");
      var familyOrSpawn = (brace && brace.b != null) ? String(brace.a) : (fam || rawCode || "—");
      var numericId = (brace && brace.b != null) ? String(brace.b) : (brace ? String(brace.id) : (p && p.id != null ? String(p.id) : "—"));
      var stats = p ? getStatsText(p) : "";
      var cnt = counts[key];
      var encTok = encodeURIComponent(String(rep).trim());
      var statsShort = stats.length > 120 ? stats.slice(0, 117) + "…" : stats;
      rows.push(
        "<tr><td class=\"ipi-dim\" style=\"color:rgba(255,255,255,0.62);\">" + esc(cat) + "</td><td>" + esc(name) + "</td><td style=\"color:rgba(0,243,255,0.95);\">" + esc(familyOrSpawn) + "</td><td>" + esc(numericId) + "</td>" +
        "<td style=\"text-align:center;font-weight:700;\">" + cnt + "</td>" +
        "<td style=\"white-space:nowrap;\"><button type=\"button\" class=\"btn ipi-qty\" style=\"padding:2px 8px;min-width:32px;\" data-ipi-delta=\"-1\" data-ipi-tok=\"" + encTok + "\" title=\"Remove one\">−</button> " +
        "<button type=\"button\" class=\"btn ipi-qty\" style=\"padding:2px 8px;min-width:32px;\" data-ipi-delta=\"1\" data-ipi-tok=\"" + encTok + "\" title=\"Add one\">+</button></td>" +
        "<td class=\"ipi-dim\" style=\"color:rgba(255,255,255,0.62);white-space:pre-line;font-size:0.88em;\">" + esc(statsShort) + "</td></tr>"
      );
    }
    tbody.innerHTML = rows.join("");
  }

  function wireImportedInspectorQtyButtons() {
    var wrap = byId("importedPartsInspector");
    if (!wrap || wrap.__ipiQtyBound) return;
    wrap.__ipiQtyBound = true;
    wrap.addEventListener("click", function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest("[data-ipi-delta]") : null;
      if (!btn || typeof window.__ccMutateSerialTailDelta !== "function") return;
      var enc = btn.getAttribute("data-ipi-tok");
      if (!enc) return;
      try {
        var tok = decodeURIComponent(enc);
        var d = parseInt(btn.getAttribute("data-ipi-delta"), 10);
        if (Number.isFinite(d)) window.__ccMutateSerialTailDelta(tok, d);
      } catch (_) {}
    });
  }

  function getCombinedPasteForInspector() {
    var q = byId("ipiQuickPaste");
    var imp = byId("importBox");
    var a = q && String(q.value || "").trim();
    var b = imp && String(imp.value || "").trim();
    return a || b || "";
  }

  function applyInspectorPasteToGuided() {
    var g = byId("guidedOutputDeserialized");
    if (!g) {
      alert("Guided output field not found.");
      return;
    }
    var code = getCombinedPasteForInspector();
    if (!code) {
      alert("Paste a serial in the inspector box or in “Paste code to edit” first.");
      return;
    }
    if (code.indexOf("||") < 0 && code.indexOf("{") < 0 && code.length > 20) {
      try {
        if (typeof window.deserializeBase85 === "function") {
          var deser = window.deserializeBase85(code);
          if (deser && typeof deser === "string" && deser.trim().length) code = deser.trim();
        }
      } catch (_) {}
    }
    g.value = code;
    try { if (typeof window.refreshGuidedOutputPreview === "function") window.refreshGuidedOutputPreview(); } catch (_) {}
    try { if (typeof window.syncFloatingOutput === "function") window.syncFloatingOutput(true); } catch (_) {}
    refreshImportedInspector();
    try { if (typeof window.refreshBuildStatsCore === "function") window.refreshBuildStatsCore(); } catch (_) {}
  }

  function applyInspectorPasteToSimpleBuilder() {
    var importBox = byId("importBox");
    if (!importBox) {
      alert("Import box not found.");
      return;
    }
    var code = getCombinedPasteForInspector();
    if (!code) {
      alert("Paste a serial in the inspector box or in “Paste code to edit” first.");
      return;
    }
    importBox.value = code;
    if (code.indexOf("||") < 0 && code.indexOf("{") < 0 && code.length > 20) {
      try {
        if (typeof window.deserializeBase85 === "function") {
          var deser = window.deserializeBase85(code);
          if (deser && typeof deser === "string" && deser.trim().length) importBox.value = deser.trim();
        }
      } catch (_) {}
    }
    try {
      if (typeof window.importTokens === "function") window.importTokens();
      else if (typeof window.refreshOutputs === "function") window.refreshOutputs();
    } catch (_) {}
    setTimeout(function () {
      try { if (window.refreshOutputs) window.refreshOutputs(); } catch (_) {}
      try { if (window.refreshBuilder) window.refreshBuilder(); } catch (_) {}
      refreshImportedInspector();
      try { if (typeof window.refreshBuildStatsCore === "function") window.refreshBuildStatsCore(); } catch (_) {}
    }, 50);
  }
  function init(){
    loadPresetCategories();
    var catSel = byId("presetCategorySelect");
    var addBtn = byId("rebuildPresetAddBtn");
    if (catSel) catSel.addEventListener("change", loadPresetParts);
    if (addBtn) addBtn.addEventListener("click", addPresetPart);
    var randBtn = byId("rebuildRandomFullBuildBtn");
    if (randBtn) {
      randBtn.onclick = function () {
        var repEl = byId("rebuildRandomRepeat");
        var n = repEl ? parseInt(String(repEl.value || "1"), 10) : 1;
        if (!Number.isFinite(n) || n < 1) n = 1;
        if (n > 50) n = 50;
        if (n > 1 && typeof window.randomFullBuildBatch === "function") {
          window.randomFullBuildBatch(n);
        } else if (typeof window.randomFullBuild === "function") {
          window.randomFullBuild();
        } else {
          alert("Random full build: loading… Try again in a moment.");
        }
      };
    }
    setTimeout(loadLegendaryPerks, 300);
    function loadToolsSkinCamo() {
      var skinSel = byId("toolsSkinSelect");
      var camoSel = byId("toolsCamoSelect");
      if (typeof window.populateSkinCamo === 'function') window.populateSkinCamo(skinSel, camoSel);
    }
    loadToolsSkinCamo();
    window.loadToolsSkinCamo = loadToolsSkinCamo;
    var btnLeg = byId("btnAddLegendaryPart");
    var btnLegAll = byId("btnAddAllLegendaryParts");
    if (btnLeg) btnLeg.addEventListener("click", function(){ var s=byId("legendaryPerkSelect"); if(s&&s.value) appendToOutCode(s.value); });
    if (btnLegAll) btnLegAll.addEventListener("click", function(){
      var s=byId("legendaryPerkSelect"); if(!s) return;
      var all = (window.STX_DATASET && window.STX_DATASET.ALL_PARTS) ? window.STX_DATASET.ALL_PARTS : [];
      var leg = all.filter(function(p){ return p && /legendary\s*perk/i.test(String(p.partType || "")); });
      for (var i=0;i<leg.length;i++) {
        var p=leg[i];
        var raw=(p.idRaw||p.idraw||"").trim();
        var fam=p.family!=null?String(p.family):"";
        var id=p.id!=null?String(p.id):(p.itemId!=null?String(p.itemId):"");
        var tok=raw&&/^\d+:\d+$/.test(raw)?"{"+raw+"}":(fam&&id?"{"+fam+":"+id+"}":(p.code||"").trim());
        if(tok) appendToOutCode(tok);
      }
    });
    var btnElem = byId("btnAddElement");
    if (btnElem) btnElem.addEventListener("click", function(){ var s=byId("toolsElementSelect"); if(s&&s.value) appendToOutCode(s.value); });
    var btnSkin = byId("btnAddSkinCamo");
    if (btnSkin) btnSkin.addEventListener("click", function(){
      var skin=byId("toolsSkinSelect"); var camo=byId("toolsCamoSelect");
      if (skin&&skin.value) appendToOutCode(skin.value);
      if (camo&&camo.value) appendToOutCode(camo.value);
    });
    var btnInsp = byId("btnRefreshInspector");
    if (btnInsp) btnInsp.addEventListener("click", function(){ refreshImportedInspector(); refreshBuildStatsCore(); });
    wireImportedInspectorQtyButtons();
    function wireIpiBtns() {
      var btnIpiG = byId("ipiBtnApplyGuided");
      var btnIpiS = byId("ipiBtnApplySimple");
      if (btnIpiG && !btnIpiG.__wired) {
        btnIpiG.__wired = true;
        btnIpiG.addEventListener("click", function () { applyInspectorPasteToGuided(); });
      }
      if (btnIpiS && !btnIpiS.__wired) {
        btnIpiS.__wired = true;
        btnIpiS.addEventListener("click", function () { applyInspectorPasteToSimpleBuilder(); });
      }
    }
    wireIpiBtns();
    setTimeout(wireIpiBtns, 800);
    window.__rebuildApplyInspectorPasteToGuided = applyInspectorPasteToGuided;
    window.__rebuildApplyInspectorPasteToSimple = applyInspectorPasteToSimpleBuilder;
    refreshImportedInspector();
    refreshBuildStatsCore();
    window.refreshImportedInspector = refreshImportedInspector;
    window.refreshBuildStatsCore = refreshBuildStatsCore;
  }
  function refreshBuildStatsCore() {
    var grid = byId("buildStatsCoreGrid");
    var sub = byId("buildStatsCoreSubtitle");
    if (!grid || !sub) return;
    var core = null;
    var lastBuckets = null;
    try {
      if (typeof window.accumulateFromSelected === "function") {
        var b = window.accumulateFromSelected();
        lastBuckets = b || null;
        if (b && typeof b === "object") {
          var reloadSpeedMult = Number((b.reload_speed && b.reload_speed.mult) || 1) / Math.max(1e-9, Number((b.reload_time && b.reload_time.mult) || 1));
          var items = [
            { label: "Damage", mult: (b.damage && b.damage.mult) || 1, hits: (b.damage && b.damage.hits) || 0, nonNumeric: (b.damage && b.damage.nonNumeric) || 0 },
            { label: "Critical Damage", mult: (b.crit && b.crit.mult) || 1, hits: (b.crit && b.crit.hits) || 0, nonNumeric: (b.crit && b.crit.nonNumeric) || 0 },
            { label: "Elemental", mult: (b.elemental && b.elemental.mult) || 1, hits: (b.elemental && b.elemental.hits) || 0, nonNumeric: (b.elemental && b.elemental.nonNumeric) || 0 },
            { label: "Accuracy", mult: (b.accuracy && b.accuracy.mult) || 1, hits: (b.accuracy && b.accuracy.hits) || 0, nonNumeric: (b.accuracy && b.accuracy.nonNumeric) || 0 },
            { label: "ADS / Handling", mult: (b.ads && b.ads.mult) || 1, hits: (b.ads && b.ads.hits) || 0, nonNumeric: (b.ads && b.ads.nonNumeric) || 0 },
            { label: "Fire Rate", mult: (b.firerate && b.firerate.mult) || 1, hits: (b.firerate && b.firerate.hits) || 0, nonNumeric: (b.firerate && b.firerate.nonNumeric) || 0 },
            { label: "Reload Speed", mult: reloadSpeedMult, hits: Number((b.reload_speed && b.reload_speed.hits) || 0) + Number((b.reload_time && b.reload_time.hits) || 0), nonNumeric: Number((b.reload_speed && b.reload_speed.nonNumeric) || 0) + Number((b.reload_time && b.reload_time.nonNumeric) || 0) },
            { label: "Ammo / Mag", mult: (b.ammo_mag && b.ammo_mag.mult) || 1, hits: (b.ammo_mag && b.ammo_mag.hits) || 0, nonNumeric: (b.ammo_mag && b.ammo_mag.nonNumeric) || 0 },
            { label: "Projectiles", mult: (b.projectiles && b.projectiles.mult) || 1, hits: (b.projectiles && b.projectiles.hits) || 0, nonNumeric: (b.projectiles && b.projectiles.nonNumeric) || 0 }
          ];
          var detected = 0;
          try { var r = Object.keys(b); for (var i = 0; i < r.length; i++) { var k = b[r[i]]; if (k && k.hits) detected += Number(k.hits) || 0; } } catch(_){}
          core = { detectedParts: detected, items: items };
        }
      }
    } catch(_){ lastBuckets = null; }
    var defaultItems = [
        { label: "Damage", mult: 1, hits: 0, nonNumeric: 0 },
        { label: "Critical Damage", mult: 1, hits: 0, nonNumeric: 0 },
        { label: "Elemental", mult: 1, hits: 0, nonNumeric: 0 },
        { label: "Accuracy", mult: 1, hits: 0, nonNumeric: 0 },
        { label: "ADS / Handling", mult: 1, hits: 0, nonNumeric: 0 },
        { label: "Fire Rate", mult: 1, hits: 0, nonNumeric: 0 },
        { label: "Reload Speed", mult: 1, hits: 0, nonNumeric: 0 },
        { label: "Ammo / Mag", mult: 1, hits: 0, nonNumeric: 0 },
        { label: "Projectiles", mult: 1, hits: 0, nonNumeric: 0 }
      ];
    if (!core || !core.items || !core.items.length) {
      sub.innerHTML = "Model estimate — coarse buckets, not in-game DPS. Import or select parts. Full lines and per-bucket contributions below.";
      core = { detectedParts: 0, items: defaultItems };
    }
    var debugBody = byId("buildStatsDebugBody");
    if (debugBody && (!core || core.detectedParts === 0)) {
      try {
        var dbg = typeof window.getBuildStatsDebugInfo === "function" ? window.getBuildStatsDebugInfo() : null;
        if (dbg && dbg.refs && dbg.refs.length) {
          var zipLoaded = !!(window.__CC_ZIP_WEAPON_PARTS || window.ZIP_WEAPON_PARTS);
          var lines = [];
          lines.push("Refs collected: " + (dbg.refs && dbg.refs.length) + " | With stats: " + (dbg.withStats && dbg.withStats.length) + " | Without stats: " + (dbg.withoutStats && dbg.withoutStats.length));
          if (!zipLoaded && (dbg.withoutStats && dbg.withoutStats.length)) lines.push("Note: ZIP_WEAPON_PARTS not loaded. Stats come from ALL_PARTS or ZIP_WEAPON_PARTS.");
          lines.push("Refs: " + (dbg.refs || []).join(", "));
          if (dbg.withoutStats && dbg.withoutStats.length) {
            lines.push("");
            lines.push("Parts without stats:");
            for (var j = 0; j < Math.min(dbg.withoutStats.length, 15); j++) {
              var u = dbg.withoutStats[j];
              var uname = String((u.part && (u.part.name || u.part.code || u.part.idRaw)) || u.ref || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
              lines.push("  " + uname);
            }
          }
          debugBody.innerHTML = lines.join("<br>");
        } else {
          debugBody.textContent = "No refs found. Add parts via Guided Builder or paste serial into output.";
        }
      } catch (e) { debugBody.textContent = "Debug: " + String(e && e.message); }
    }
    if (core && core.items && core.items.length) {
    sub.innerHTML = (core.detectedParts > 0)
      ? "<span>Model estimate — " + Number(core.detectedParts) + " stat line(s) rolled into buckets (compare builds; not exact DPS).</span><span class=\"cc-stats-disclaimer\"><strong>1\xD7 = baseline.</strong> Shown scale is the combined multiplier for that bucket; the line below is the equivalent % change from 1\xD7. Uses PARTS_STATS_DATA when available, else weapon init tables (if <code>weapon_stats_data.js</code> loads + item slug in output), else parsed text.</span>"
      : "<span>Model estimate — no stat lines detected yet.</span><span class=\"cc-stats-disclaimer\"><strong>1\xD7 = baseline.</strong> Paste a serial, pick parts in Guided Builder, or ensure output lists an item slug (e.g. <code>maliwan_pistol</code>) for manufacturer / barrel-mag tables.</span>";
    var pal = function(lbl) {
      var k = String(lbl||"").toLowerCase().replace(/\s+/g,"");
      if (k.indexOf("critical") >= 0) return { border: "rgba(255,179,71,0.42)", bgTop: "rgba(255,179,71,0.16)", bgBottom: "rgba(45,26,6,0.34)", title: "#ffd7a0", value: "#fff1d8", pos: "#ffc76a", neg: "#ff9a7a", meta: "rgba(255,236,210,0.9)" };
      if (k.indexOf("elemental") >= 0) return { border: "rgba(92,241,196,0.42)", bgTop: "rgba(92,241,196,0.14)", bgBottom: "rgba(5,38,34,0.34)", title: "#aaf8df", value: "#e8fff8", pos: "#7df0d2", neg: "#ff9aa8", meta: "rgba(222,255,245,0.9)" };
      if (k.indexOf("accuracy") >= 0) return { border: "rgba(88,198,255,0.42)", bgTop: "rgba(88,198,255,0.14)", bgBottom: "rgba(7,27,43,0.34)", title: "#a9e8ff", value: "#effaff", pos: "#6fd8ff", neg: "#ff9ca6", meta: "rgba(224,245,255,0.9)" };
      if (k.indexOf("ads") >= 0) return { border: "rgba(178,134,255,0.42)", bgTop: "rgba(178,134,255,0.14)", bgBottom: "rgba(29,18,47,0.34)", title: "#d9c1ff", value: "#f6efff", pos: "#caa2ff", neg: "#ff9dc9", meta: "rgba(239,228,255,0.9)" };
      if (k.indexOf("fire") >= 0) return { border: "rgba(255,107,107,0.42)", bgTop: "rgba(255,107,107,0.16)", bgBottom: "rgba(49,12,12,0.34)", title: "#ffc2c2", value: "#fff0f0", pos: "#ff9d78", neg: "#ff8f8f", meta: "rgba(255,228,228,0.9)" };
      if (k.indexOf("reload") >= 0) return { border: "rgba(54,225,179,0.42)", bgTop: "rgba(54,225,179,0.14)", bgBottom: "rgba(6,40,31,0.34)", title: "#98f4d6", value: "#eafff8", pos: "#67f0c1", neg: "#ff9da0", meta: "rgba(220,255,244,0.9)" };
      if (k.indexOf("ammo") >= 0) return { border: "rgba(156,230,86,0.42)", bgTop: "rgba(156,230,86,0.14)", bgBottom: "rgba(21,39,10,0.34)", title: "#cff7a7", value: "#f7ffeb", pos: "#b8f36e", neg: "#ffb08b", meta: "rgba(238,255,216,0.9)" };
      if (k.indexOf("projectile") >= 0) return { border: "rgba(255,122,186,0.42)", bgTop: "rgba(255,122,186,0.14)", bgBottom: "rgba(49,13,31,0.34)", title: "#ffc0df", value: "#fff0f8", pos: "#ff9ad1", neg: "#ff9f9f", meta: "rgba(255,228,241,0.9)" };
      return { border: "rgba(255,255,255,0.2)", bgTop: "rgba(255,255,255,0.08)", bgBottom: "rgba(255,255,255,0.02)", title: "#fff", value: "#fff", pos: "#7df", neg: "#f99", meta: "rgba(255,255,255,0.9)" };
    };
    var esc = function(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); };
    grid.innerHTML = core.items.map(function(it) {
      var mult = Number(it.mult || 1);
      var hits = Number(it.hits || 0);
      var nn = Number(it.nonNumeric || 0);
      var delta = (mult - 1) * 100;
      var absDelta = Math.abs(delta);
      var deltaCapped = Math.max(-500, Math.min(500, delta));
      var suffix = absDelta > 500 ? (delta > 0 ? "+" : "\u2212") : "";
      var pctText = "\u2248 " + (deltaCapped >= 0 ? "+" : "") + deltaCapped.toFixed(1) + "%";
      var scaleText = "\xD7" + (mult >= 1000 ? mult.toExponential(2) : mult.toFixed(4));
      var meta = hits ? ("Lines: " + hits + (nn ? " | non-numeric: " + nn : "")) : "—";
      var p = pal(it.label);
      return "<div class=\"cc-core-card\" style=\"border-color:" + p.border + ";background:linear-gradient(180deg," + p.bgTop + " 0%," + p.bgBottom + " 100%);\"><div class=\"cc-core-card-title\" style=\"color:" + p.title + "\">" + esc(it.label) + "</div><div class=\"cc-core-card-scale\" style=\"color:" + (delta >= 0 ? p.pos : p.neg) + "\">" + scaleText + "</div><div class=\"cc-core-card-pct\">" + pctText + "</div><div class=\"cc-core-card-meta\" style=\"color:" + p.meta + "\">" + esc(meta) + "</div></div>";
    }).join("");
    var fullPanel = byId("buildStatsFullStats");
    if (fullPanel) {
      try {
        var br = typeof window.getFullStatsBreakdown === "function" ? window.getFullStatsBreakdown() : null;
        if (!br || !br.entries || !br.entries.length) {
          fullPanel.innerHTML = "<p class=\"cc-full-stats-empty\">" + esc(br && br.message ? br.message : "\u2014") + "</p>";
        } else {
          var chunks = ["<div class=\"cc-full-stats-heading\">Full stat lines (per resolved part)</div>"];
          for (var fi = 0; fi < br.entries.length; fi++) {
            var en = br.entries[fi];
            chunks.push("<div class=\"cc-full-stats-part\"><div class=\"cc-full-stats-part-title\">" + esc(en.name) + " <span class=\"cc-full-stats-src\">" + esc(en.source || "") + "</span></div>");
            if (!en.lines || !en.lines.length) {
              chunks.push("<p class=\"cc-full-stats-empty cc-full-stats-none\">No stat lines for this part.</p>");
            } else {
              chunks.push("<ul class=\"cc-full-stats-lines\">");
              for (var li = 0; li < en.lines.length; li++) {
                chunks.push("<li>" + esc(en.lines[li]) + "</li>");
              }
              chunks.push("</ul>");
            }
            chunks.push("</div>");
          }
          fullPanel.innerHTML = chunks.join("");
        }
      } catch (e) {
        fullPanel.innerHTML = "<p class=\"cc-full-stats-empty\">" + esc(String(e && e.message)) + "</p>";
      }
    }
    var buckEl = byId("buildStatsBucketBreakdown");
    if (buckEl) {
      try {
        if (!lastBuckets) {
          buckEl.innerHTML = "";
        } else {
          var order = [
            ["damage", "Damage"], ["crit", "Critical Damage"], ["elemental", "Elemental"], ["accuracy", "Accuracy"],
            ["ads", "ADS / Handling"], ["firerate", "Fire Rate"], ["reload_time", "Reload (time)"], ["reload_speed", "Reload (speed)"],
            ["ammo_mag", "Ammo / Mag"], ["projectiles", "Projectiles"]
          ];
          var parts = ["<details class=\"cc-bucket-details\"><summary>How multipliers were combined (per source line)</summary>"];
          var any = false;
          for (var bi = 0; bi < order.length; bi++) {
            var bk = lastBuckets[order[bi][0]];
            if (!bk || !bk.contributions || !bk.contributions.length) continue;
            any = true;
            parts.push("<div class=\"cc-bucket-block\"><div class=\"cc-bucket-block-title\">" + esc(order[bi][1]) + "</div>");
            for (var ci = 0; ci < bk.contributions.length; ci++) {
              var c = bk.contributions[ci];
              var ma = "";
              if (c.multApplied != null && Number.isFinite(Number(c.multApplied))) ma = " \u2192 applied \xD7" + Number(c.multApplied).toFixed(4);
              else if (c.combine) ma = " [" + esc(c.combine) + "]";
              parts.push("<div class=\"cc-bucket-line\"><strong>" + esc(c.part || "") + "</strong> <span class=\"cc-bucket-src\">" + esc(c.source || "") + "</span><br>" + esc(c.detail || "") + ma + "</div>");
            }
            parts.push("</div>");
          }
          if (!any) parts.push("<p class=\"cc-full-stats-empty\">No contribution lines yet.</p>");
          parts.push("</details>");
          buckEl.innerHTML = parts.join("");
        }
      } catch (e2) {
        buckEl.innerHTML = "<p class=\"cc-full-stats-empty\">" + esc(String(e2 && e2.message)) + "</p>";
      }
    }
    var debugBody = byId("buildStatsDebugBody");
    var debugDetails = byId("buildStatsDebugDetails");
    if (debugBody && debugDetails) {
      try {
        var dbg = typeof window.getBuildStatsDebugInfo === "function" ? window.getBuildStatsDebugInfo() : null;
        if (dbg) {
          var zipLoaded = !!(window.__CC_ZIP_WEAPON_PARTS || window.ZIP_WEAPON_PARTS);
          var lines = [];
          lines.push("Refs collected: " + (dbg.refs && dbg.refs.length) + " | With stats: " + (dbg.withStats && dbg.withStats.length) + " | Without stats: " + (dbg.withoutStats && dbg.withoutStats.length));
          if (!zipLoaded && (dbg.withoutStats && dbg.withoutStats.length)) lines.push("Note: ZIP_WEAPON_PARTS not loaded. Stats come from ALL_PARTS or ZIP_WEAPON_PARTS.");
          if (dbg.refs && dbg.refs.length) {
            lines.push("");
            lines.push("Refs: " + dbg.refs.join(", "));
          }
          if (dbg.withStats && dbg.withStats.length) {
            lines.push("");
            lines.push("Parts with stats:");
            for (var i = 0; i < Math.min(dbg.withStats.length, 20); i++) {
              var w = dbg.withStats[i];
              var name = (w.part && (w.part.name || w.part.code || w.part.idRaw)) || w.ref;
              lines.push("  " + esc(String(name)) + " -> " + esc((w.stats || "").substring(0, 60)) + (w.stats && w.stats.length > 60 ? "..." : ""));
            }
            if (dbg.withStats.length > 20) lines.push("  ... and " + (dbg.withStats.length - 20) + " more");
          }
          if (dbg.withoutStats && dbg.withoutStats.length) {
            lines.push("");
            lines.push("Parts without stats:");
            for (var j = 0; j < Math.min(dbg.withoutStats.length, 15); j++) {
              var u = dbg.withoutStats[j];
              var uname = (u.part && (u.part.name || u.part.code || u.part.idRaw)) || u.ref;
              lines.push("  " + esc(String(uname)));
            }
            if (dbg.withoutStats.length > 15) lines.push("  ... and " + (dbg.withoutStats.length - 15) + " more");
          }
          debugBody.innerHTML = lines.join("<br>");
        } else {
          debugBody.textContent = "No debug info available.";
        }
      } catch (e) {
        debugBody.textContent = "Debug error: " + String(e && e.message);
      }
    }
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else setTimeout(init, 500);
})();
