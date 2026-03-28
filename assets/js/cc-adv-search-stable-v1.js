
;(function(){
  "use strict";
  if (window.__ccAdvSearchStableV1) return;
  window.__ccAdvSearchStableV1 = true;

  function q(v){ return String(v == null ? "" : v).trim(); }
  function stripQuotes(s){ return q(s).replace(/^"+|"+$/g, ""); }
  function norm(s){ return stripQuotes(s).toLowerCase(); }
  function byId(id){ try{ return document.getElementById(id); }catch(_){ return null; } }
  function asArr(v){ return Array.isArray(v) ? v : []; }
  function normCodeKey(s){ return stripQuotes(s).toLowerCase(); }
  function getStxParts(){
    try{
      var ds = window.STX_DATASET;
      if (ds && Array.isArray(ds.ALL_PARTS)) return ds.ALL_PARTS;
    }catch(_){}
    return [];
  }

  function allParts(){
    return []
      .concat(
        getStxParts(),
        asArr(window.ALL_PARTS),
        asArr(window.GUN_PARTS),
        asArr(window.GRENADE_PARTS),
        asArr(window.SHIELD_PARTS),
        asArr(window.REPKIT_PARTS),
        asArr(window.ENHANCEMENT_PARTS),
        asArr(window.HEAVY_PARTS),
        asArr(window.CLASSMOD_PARTS)
      );
  }

  function normalizeIdRaw(s){
    var m = q(s).match(/^\s*(\d+)\s*:\s*(\d+)\s*$/);
    return m ? (m[1] + ":" + m[2]) : "";
  }

  function getStxIdRawSet(){
    var stx = getStxParts();
    var stamp = String(stx.length);
    if (window.__ccStxIdRawSetV1 && window.__ccStxIdRawSetStampV1 === stamp){
      return window.__ccStxIdRawSetV1;
    }
    var s = Object.create(null);
    for (var i = 0; i < stx.length; i++){
      var p = stx[i];
      var n = normalizeIdRaw(q(p && (p.idRaw != null ? p.idRaw : p.idraw)));
      if (n) s[n] = true;
    }
    window.__ccStxIdRawSetV1 = s;
    window.__ccStxIdRawSetStampV1 = stamp;
    return s;
  }

  function getStxPartByIdRawMap(){
    var stx = getStxParts();
    var stamp = String(stx.length);
    if (window.__ccStxPartByIdRawV1 && window.__ccStxPartByIdRawStampV1 === stamp){
      return window.__ccStxPartByIdRawV1;
    }
    var m = Object.create(null);
    for (var i = 0; i < stx.length; i++){
      var p = stx[i];
      var n = normalizeIdRaw(q(p && (p.idRaw != null ? p.idRaw : p.idraw)));
      if (n && !m[n]) m[n] = p;
    }
    window.__ccStxPartByIdRawV1 = m;
    window.__ccStxPartByIdRawStampV1 = stamp;
    return m;
  }

  function partRefMetaFor(idRaw){
    var id = normalizeIdRaw(idRaw) || q(idRaw);
    if (!id || !window.PART_REF_META) return null;
    return window.PART_REF_META[id] || null;
  }

  function partRefTags(fi, p2){
    var ir = "";
    try{
      if (fi && /^\d+$/.test(q(fi.family)) && /^\d+$/.test(q(fi.id))){
        ir = q(fi.family) + ":" + q(fi.id);
      } else {
        var rx = q(p2 && (p2.idRaw != null ? p2.idRaw : p2.idraw));
        ir = normalizeIdRaw(rx);
      }
    }catch(_){ return { prefix: "", suffix: "" }; }
    if (!ir) return { prefix: "", suffix: "" };
    var suffix = getStxIdRawSet()[ir] ? "" : " [not in STX]";
    return { prefix: "", suffix: suffix };
  }

  function partRefTagSuffix(fi, p2){
    var t = partRefTags(fi, p2);
    return t.prefix + t.suffix;
  }

  function clipDetail(s, max){
    var t = q(s);
    if (!t) return "";
    var n = Math.max(40, Number(max) || 200);
    if (t.length <= n) return t;
    return t.slice(0, n - 1) + "…";
  }

  function escapeMeta(s){
    var t = q(s);
    if (!t) return "";
    return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function metaLineForOption(opt){
    if (!opt) return "";
    var ds = opt.dataset || {};
    var idRaw = normalizeIdRaw(q(ds.idRaw));
    if (!idRaw && ds.family && ds.id){
      var f = q(ds.family), ii = q(ds.id);
      if (/^\d+$/.test(f) && /^\d+$/.test(ii)) idRaw = f + ":" + ii;
    }
    if (!idRaw && ds.token){
      var mt = q(ds.token).match(/\{(\d+)\s*:\s*(\d+)\}/);
      if (mt) idRaw = mt[1] + ":" + mt[2];
    }
    var parts = [];
    if (idRaw) parts.push("ID " + idRaw);
    var stx = getStxIdRawSet();
    if (idRaw) parts.push(stx[idRaw] ? "In STX dataset" : "Not in STX dataset (names may be missing)");
    var rm = idRaw ? partRefMetaFor(idRaw) : null;
    if (rm && rm.note) parts.push(rm.note);
    var idLine = parts.join(" · ");

    var ctx = [];
    var mfr = q(ds.manufacturer);
    var cat = q(ds.category);
    var it = q(ds.itemType);
    var wt = q(ds.weaponType);
    var pt = q(ds.partType);
    if (mfr) ctx.push("Manufacturer: " + mfr);
    if (cat) ctx.push("Category: " + cat);
    if (it) ctx.push("Item type: " + it);
    if (wt && norm(wt) !== norm(it)) ctx.push("Weapon type: " + wt);
    if (pt) ctx.push("Part type: " + pt);
    var sc = q(ds.code);
    if (sc) ctx.push("Spawn code: " + sc);

    var blocks = [idLine];
    if (ctx.length) blocks.push(ctx.join(" · "));
    var leg = q(ds.legendaryName);
    if (leg) blocks.push("Label: " + leg);
    var stH = q(ds.statsHint);
    if (stH) blocks.push("Stats: " + stH);
    var efH = q(ds.effectsHint);
    if (efH) blocks.push("Red text: " + efH);

    return blocks.filter(Boolean).join("\n");
  }

  function metaHTMLForOption(opt){
    if (!opt) return "";
    var ds = opt.dataset || {};
    var idRaw = normalizeIdRaw(q(ds.idRaw));
    if (!idRaw && ds.family && ds.id){
      var f = q(ds.family), ii = q(ds.id);
      if (/^\d+$/.test(f) && /^\d+$/.test(ii)) idRaw = f + ":" + ii;
    }
    if (!idRaw && ds.token){
      var mt = q(ds.token).match(/\{(\d+)\s*:\s*(\d+)\}/);
      if (mt) idRaw = mt[1] + ":" + mt[2];
    }
    var stx = getStxIdRawSet();
    var inStx = idRaw && stx[idRaw];
    var rm = idRaw ? partRefMetaFor(idRaw) : null;

    var html = [];
    if (idRaw){
      html.push('<div style="margin-bottom:6px;font-size:11px;"><strong>ID:</strong> <code style="color:#00f3ff;">' + escapeMeta(idRaw) + '</code>');
      html.push(' &middot; <span style="' + (inStx ? 'color:#7dffb3' : 'color:#ff9b7d') + ';">' + (inStx ? 'In STX dataset' : 'Not in STX dataset') + '</span></div>');
    }
    var ctx = [];
    var mfr = q(ds.manufacturer);
    var cat = q(ds.category);
    var it = q(ds.itemType);
    var wt = q(ds.weaponType);
    var pt = q(ds.partType);
    var sc = q(ds.code);
    if (mfr) ctx.push("Mfr: " + escapeMeta(mfr));
    if (cat) ctx.push("Category: " + escapeMeta(cat));
    if (it) ctx.push("Item: " + escapeMeta(it));
    if (wt && norm(wt) !== norm(it)) ctx.push("Weapon: " + escapeMeta(wt));
    if (pt) ctx.push("Part: " + escapeMeta(pt));
    if (sc) ctx.push("Code: " + escapeMeta(clipDetail(sc, 60)));
    if (ctx.length) html.push('<div style="margin-bottom:6px;font-size:11px;opacity:0.9;">' + ctx.join(" &middot; ") + '</div>');
    if (rm && rm.note) html.push('<div style="margin-bottom:6px;font-size:11px;font-style:italic;color:rgba(200,255,200,0.9);">' + escapeMeta(rm.note) + '</div>');
    var leg = q(ds.legendaryName);
    if (leg) html.push('<div style="margin-bottom:4px;font-size:11px;"><strong>Label:</strong> ' + escapeMeta(leg) + '</div>');
    var stH = q(ds.statsHint);
    if (stH) html.push('<div style="margin-bottom:4px;font-size:11px;"><strong>Stats:</strong> ' + escapeMeta(stH) + '</div>');
    var efH = q(ds.effectsHint);
    if (efH) html.push('<div style="font-size:11px;"><strong>Red text:</strong> <span style="color:#e07a5a;">' + escapeMeta(efH) + '</span></div>');
    return html.join("");
  }

  function refreshStableMeta(sel, meta){
    if (!sel || !meta) return;
    var base = q(window.__ccStablePartLastFilterMsgV1);
    if (!base) base = "-";
    try{
      meta.style.whiteSpace = "normal";
    }catch(_){}
    if (sel.selectedIndex >= 1){
      var opt = sel.options[sel.selectedIndex];
      var html = metaHTMLForOption(opt);
      meta.innerHTML = '<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(0,243,255,0.2);font-size:11px;color:rgba(255,255,255,0.7);">' + escapeMeta(base) + '</div>' + (html || "");
    } else {
      meta.textContent = base;
    }
  }

  function buildCodeIdMap(){
    var stx = getStxParts();
    var stamp = [
      stx.length,
      asArr(window.ALL_PARTS).length,
      asArr(window.GUN_PARTS).length,
      asArr(window.GRENADE_PARTS).length,
      asArr(window.SHIELD_PARTS).length,
      asArr(window.REPKIT_PARTS).length,
      asArr(window.ENHANCEMENT_PARTS).length,
      asArr(window.HEAVY_PARTS).length,
      asArr(window.CLASSMOD_PARTS).length
    ].join("|");
    if (window.__ccAdvStableCodeIdMapV1 && window.__ccAdvStableCodeIdMapStampV1 === stamp){
      return window.__ccAdvStableCodeIdMapV1;
    }

    var map = Object.create(null);
    var prefixVotes = Object.create(null);
    var prefixTypeFromStats = Object.create(null);
    var contextVotes = Object.create(null);
    function addMap(code, fam, id){
      var k = normCodeKey(code);
      if (!k) return;
      if (!/^\d+$/.test(String(fam || ""))) return;
      if (!/^\d+$/.test(String(id || ""))) return;
      if (!map[k]) map[k] = { family: String(fam), id: String(id) };
    }
    function addPart(p){
      if (!p) return;
      var c0 = q(p.code || p.spawnCode || p.importCode || p.raw || p.value || p.name).replace(/^"+|"+$/g, "");
      var px0 = (c0.split(".")[0] || "").trim();
      try{
        var stats0 = q(p.stats || p.statText);
        var mt = stats0.match(/Item\s*Type\s*ID\s*:\s*(\d+)/i);
        if (px0 && mt && /^\d+$/.test(q(mt[1])) && !prefixTypeFromStats[px0]){
          prefixTypeFromStats[px0] = q(mt[1]);
        }
      }catch(_){}
      var fam = q(p.familyId != null ? p.familyId : (p.family_id != null ? p.family_id : (p.family != null ? p.family : p.typeId)));
      var id = q(p.itemId != null ? p.itemId : (p.id != null ? p.id : p.partId));
      var raw = q(p.idRaw != null ? p.idRaw : p.idraw);
      var m = raw.match(/^\s*(\d+)\s*:\s*(\d+)\s*$/);
      if (m){
        fam = fam || m[1];
        id = id || m[2];
      }
      if (!/^\d+$/.test(fam) || !/^\d+$/.test(id)) return;
      if (px0){
        if (!prefixVotes[px0]) prefixVotes[px0] = Object.create(null);
        prefixVotes[px0][fam] = (prefixVotes[px0][fam] || 0) + 1;
      }
      try{
        var mk = q(p.manufacturer || p.mfr).toLowerCase();
        var wk = q(p.weaponType || p.itemType || p.category).toLowerCase();
        var ck = mk + "|" + wk;
        if (mk && wk){
          if (!contextVotes[ck]) contextVotes[ck] = Object.create(null);
          contextVotes[ck][fam] = (contextVotes[ck][fam] || 0) + 1;
        }
      }catch(_){}
      addMap(p.code, fam, id);
      addMap(p.raw, fam, id);
      addMap(p.value, fam, id);
      addMap(p.spawnCode, fam, id);
      addMap(p.importCode, fam, id);
      var nm = q(p.name);
      if (nm && (/^".*"$/.test(nm) || /^[A-Za-z0-9_]+\.[A-Za-z0-9_]+/.test(nm))) addMap(nm, fam, id);
    }

    var pools = allParts();
    for (var i = 0; i < pools.length; i++) addPart(pools[i]);
    var prefixFam = Object.create(null);
    Object.keys(prefixVotes).forEach(function(px){
      var votes = prefixVotes[px] || {};
      var bestFam = "", bestN = -1;
      Object.keys(votes).forEach(function(f){
        var n = Number(votes[f]) || 0;
        if (n > bestN){ bestN = n; bestFam = f; }
      });
      if (bestFam) prefixFam[px] = bestFam;
    });
    var contextFam = Object.create(null);
    Object.keys(contextVotes).forEach(function(k){
      var votes = contextVotes[k] || {};
      var bestFam = "", bestN = -1;
      Object.keys(votes).forEach(function(f){
        var n = Number(votes[f]) || 0;
        if (n > bestN){ bestN = n; bestFam = f; }
      });
      if (bestFam) contextFam[k] = bestFam;
    });
    window.__ccAdvStablePrefixFamilyMapV1 = prefixFam;
    window.__ccAdvStablePrefixTypeFromStatsV1 = prefixTypeFromStats;
    window.__ccAdvStableContextFamilyMapV1 = contextFam;
    window.__ccAdvStableCodeIdMapV1 = map;
    window.__ccAdvStableCodeIdMapStampV1 = stamp;
    return map;
  }

  function domainCategory(domain){
    var d = q(domain).toLowerCase();
    if (d === "gun") return "Gun";
    if (d === "grenade") return "Grenade";
    if (d === "shield") return "Shield";
    if (d === "repkit") return "Repkit";
    if (d === "enhancement") return "Enhancement";
    if (d === "heavy") return "Heavy";
    if (d === "classmod") return "Classmod";
    if (d === "aicar") return "Normal";
    if (d === "other") return "Normal";
    return null;
  }

  function poolFor(domain){
    var d = q(domain).toLowerCase();
    function hasCode(p){ return !!q(p && (p.code || p.spawnCode || p.importCode || p.raw || p.value || p.name)); }
    function dedupeByCode(list){
      var out = [];
      var seen = Object.create(null);
      for (var i = 0; i < list.length; i++){
        var p = list[i];
        if (!p || !hasCode(p)) continue;
        var code = q(p.code || p.spawnCode || p.importCode || p.raw || p.value || p.name);
        var fi = resolveFamIdForPart(p, code);
        var key = fi && /^\d+$/.test(q(fi.family)) && /^\d+$/.test(q(fi.id))
          ? ("famid:" + q(fi.family) + ":" + q(fi.id))
          : ("code:" + normCodeKey(code));
        if (!key || seen[key]) continue;
        seen[key] = true;
        out.push(p);
      }
      return out;
    }
    function quickSpecialPool(kind){
      var rows = [];
      if (kind === "aicar"){
        var ai = asArr(window.AI_CAR_GUNS);
        if (!ai.length){
          ai = [
            { name: "GIANT ROOCKET LAUNCHER", code: "383, 0, 1, 50| 2, 420|| {287:7} {2}|" },
            { name: "Maliwan Car part", code: "390, 0, 1, 50| 2, 420|| {287:7} {2}|" },
            { name: "Minigun", code: "239, 0, 1, 50| 2, 3765|| {273:34}|" },
            { name: "RPG", code: "240, 0, 1, 50| 2, 3765|| {8:1}|" },
            { name: "Flamethrower", code: "391, 0, 1, 50| 2, 420|| {287:7} {2}|" }
          ];
        }
        for (var aii = 0; aii < ai.length; aii++){
          var g = ai[aii];
          var code = q(g && g.code);
          if (!code) continue;
          rows.push({
            code: code,
            name: q(g && g.name) || code,
            manufacturer: "AI Car Guns",
            partType: "AI Car Guns",
            category: "Weapon",
            itemType: "Weapon"
          });
        }
        return rows;
      }
      if (kind === "other"){
        function pushOther(rawCode, rawName, partType){
          var raw = q(rawCode);
          if (!raw) return;
          var clean = raw.replace(/^"+|"+$/g, "").trim();
          if (!clean) return;
          rows.push({
            code: '"' + clean + '"',
            name: q(rawName) || clean,
            manufacturer: "Other",
            partType: q(partType) || "Other",
            category: "Weapon",
            itemType: "Weapon"
          });
        }
        function collectFromSelect(sel, partType){
          if (!sel || !sel.options) return;
          for (var i = 1; i < sel.options.length; i++){
            var o = sel.options[i];
            if (!o) continue;
            pushOther(o.value, o.textContent, partType);
          }
        }
        try{
          collectFromSelect(document.getElementById("normalTerminalSelect"), "Terminal");
          collectFromSelect(document.getElementById("normalTurretSelect"), "Turret");
        }catch(_){}
        if (!rows.length){
          try{ if (typeof window.ensureOtherNameParts === "function") window.ensureOtherNameParts(); }catch(_){}
          var termArr = asArr(window.EXP_TERMINAL);
          var turArr = asArr(window.EXP_TURRET);
          for (var ti = 0; ti < termArr.length; ti++){
            var it = termArr[ti];
            pushOther(it && (it.code || it.string || it.spawn_code), it && (it.name || it.model_name || it.partName), "Terminal");
          }
          for (var ui = 0; ui < turArr.length; ui++){
            var it2 = turArr[ui];
            pushOther(it2 && (it2.code || it2.string || it2.spawn_code), it2 && (it2.name || it2.model_name || it2.partName), "Turret");
          }
        }
        return rows;
      }
      return rows;
    }
    function isClassmodLike(p){
      if (!p) return false;
      var code = q(p.code || p.spawnCode || p.importCode || p.raw || p.value || p.name).toLowerCase();
      var cat = q(p.category).toLowerCase();
      var it = q(p.itemType || p.weaponType).toLowerCase();
      var wt = q(p.weaponType || p.itemType).toLowerCase();
      var pt = q(p.partType).toLowerCase();
      if (cat === "character" || cat === "classmod" || cat === "class mod") return true;
      if (it.indexOf("classmod") !== -1 || it.indexOf("class mod") !== -1) return true;
      if (wt.indexOf("classmod") !== -1 || wt.indexOf("class mod") !== -1) return true;
      if (code.indexOf("classmod.") !== -1) return true;
      if (pt === "perk" || pt.indexOf("class skill") !== -1) return true;
      var fi = resolveFamIdForPart(p, code);
      var fam = Number(fi && fi.family ? fi.family : (p.familyId != null ? p.familyId : p.family));
      if (Number.isFinite(fam) && (fam === 234 || fam === 254 || fam === 255 || fam === 256 || fam === 259)) return true;
      return false;
    }
    function fallbackByDomain(kind){
      return dedupeByCode(allParts().filter(function(p){
        if (!hasCode(p)) return false;
        var cat = q(p.category).toLowerCase();
        var it = q(p.itemType || p.weaponType).toLowerCase();
        var code = q(p.code || p.spawnCode || p.importCode).toLowerCase();
        if (kind === "gun") return cat === "weapon" || cat === "gun" || it === "weapon" || it === "gun";
        if (kind === "grenade") return cat === "grenade" || it === "grenade" || code.indexOf("grenade") !== -1;
        if (kind === "shield") return cat === "shield" || it === "shield" || code.indexOf("shield") !== -1;
        if (kind === "repkit") return cat === "repkit" || cat === "repair kit" || it === "repkit" || code.indexOf("repair_kit") !== -1 || code.indexOf("repkit") !== -1;
        if (kind === "enhancement") return cat === "enhancement" || it === "enhancement" || code.indexOf("enhancement") !== -1;
        if (kind === "heavy") return cat === "heavy" || it === "heavy" || code.indexOf("_hw.") !== -1 || code.indexOf("heavy_weapon") !== -1;
        if (kind === "aicar"){
          var aiHay = (cat + " " + it + " " + code + " " + q(p.partType).toLowerCase() + " " + q(p.name).toLowerCase());
          return /(^|\W)(aicar|vehicle|turret|terminal|np_turret|np_term|runner)(\W|$)/i.test(aiHay);
        }
        if (kind === "other"){
          if (isClassmodLike(p)) return false;
          var core = { "weapon":1, "gun":1, "grenade":1, "shield":1, "repkit":1, "repair kit":1, "enhancement":1, "heavy":1, "classmod":1, "class mod":1 };
          if (core[cat] || core[it]) return false;
          return true;
        }
        return false;
      }));
    }
    if (d === "gun"){
      var gunPool = dedupeByCode(asArr(window.GUN_PARTS));
      return gunPool.length ? gunPool : fallbackByDomain("gun");
    }
    if (d === "grenade"){
      var grenadePool = dedupeByCode(asArr(window.GRENADE_PARTS));
      return grenadePool.length ? grenadePool : fallbackByDomain("grenade");
    }
    if (d === "shield"){
      var shieldPool = dedupeByCode(asArr(window.SHIELD_PARTS));
      return shieldPool.length ? shieldPool : fallbackByDomain("shield");
    }
    if (d === "repkit"){
      var repkitPool = dedupeByCode(asArr(window.REPKIT_PARTS));
      return repkitPool.length ? repkitPool : fallbackByDomain("repkit");
    }
    if (d === "enhancement"){
      var enhancementPool = dedupeByCode(asArr(window.ENHANCEMENT_PARTS));
      return enhancementPool.length ? enhancementPool : fallbackByDomain("enhancement");
    }
    if (d === "heavy"){
      var heavyPool = dedupeByCode(asArr(window.HEAVY_PARTS));
      return heavyPool.length ? heavyPool : fallbackByDomain("heavy");
    }
    if (d === "classmod"){
      var cm = dedupeByCode(asArr(window.CLASSMOD_PARTS).filter(isClassmodLike));
      var extra = dedupeByCode(allParts().filter(isClassmodLike));
      return dedupeByCode(cm.concat(extra));
    }
    if (d === "aicar"){
      return dedupeByCode(quickSpecialPool("aicar"));
    }
    if (d === "other"){
      return dedupeByCode(quickSpecialPool("other"));
    }
    if (d === "all"){
      return dedupeByCode(
        []
          .concat(
            poolFor("gun"),
            poolFor("grenade"),
            poolFor("shield"),
            poolFor("repkit"),
            poolFor("enhancement"),
            poolFor("heavy"),
            poolFor("aicar"),
            poolFor("other"),
            poolFor("classmod"),
            getStxParts()
          )
      );
    }
    return dedupeByCode(allParts());
  }

  function famIdFromPart(p){
    if (!p) return null;
    var fam = q(p.familyId != null ? p.familyId : (p.family_id != null ? p.family_id : (p.family != null ? p.family : (p.typeId != null ? p.typeId : p.itemTypeId))));
    var id = q(p.itemId != null ? p.itemId : (p.id != null ? p.id : p.partId));
    var raw = q(p.idRaw || p.idraw);
    if ((!fam || !id) && raw){
      var m = raw.match(/^\s*(\d+)\s*:\s*(\d+)\s*$/);
      if (m){
        fam = fam || m[1];
        id = id || m[2];
      }
    }
    if ((!fam || !id)){
      var st = q(p.stats || p.statText);
      var ms = st.match(/Item\s*Type\s*ID\s*:\s*(\d+)\s*,?\s*Item\s*ID\s*:\s*(\d+)/i);
      if (ms){
        fam = fam || ms[1];
        id = id || ms[2];
      }
    }
    if (/^\d+$/.test(fam) && /^\d+$/.test(id)) return { family: fam, id: id };
    return null;
  }
  function resolveFamIdForPart(p, code){
    var fi = famIdFromPart(p);
    if (fi) return fi;
    var ck = normCodeKey(code || (p && (p.code || p.spawnCode || p.importCode || p.raw || p.value || p.name)));
    if (ck){
      try{
        var mapHit = buildCodeIdMap()[ck];
        if (mapHit && /^\d+$/.test(mapHit.family) && /^\d+$/.test(mapHit.id)){
          return { family: String(mapHit.family), id: String(mapHit.id) };
        }
      }catch(_){}
      try{
        var tok = window.__CC_TYPEID_MAP && window.__CC_TYPEID_MAP[stripQuotes(code || "")];
        var mt = q(tok).match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
        if (mt) return { family: mt[1], id: mt[2] };
      }catch(_){}
      try{
        if (typeof window.__lookupPartByImportCode === "function"){
          var p2 = window.__lookupPartByImportCode(stripQuotes(code || ""));
          var fi2 = famIdFromPart(p2);
          if (fi2) return fi2;
        }
      }catch(_){}
    }
    try{
      var rawId = q(p && (p.idRaw != null ? p.idRaw : (p.id != null ? p.id : p.partId)));
      var mRaw = rawId.match(/^\s*(\d+)\s*:\s*(\d+)\s*$/);
      if (mRaw) return { family: mRaw[1], id: mRaw[2] };
      if (/^\d+$/.test(rawId)){
        var c = stripQuotes(code || q(p && (p.code || p.spawnCode || p.importCode || p.raw || p.value || p.name)));
        var prefix = q((c.split(".")[0] || ""));
        var fam = "";
        if (prefix){
          var map = window.MANUFACTURER_FAMILIES || window.MANUFACTURER_FAMILY || {};
          var n = Number(map[prefix]);
          if (Number.isFinite(n)) fam = String(n);
        }
        if (!fam){
          try{
            buildCodeIdMap();
            if (prefix){
              fam = q(window.__ccAdvStablePrefixFamilyMapV1 && window.__ccAdvStablePrefixFamilyMapV1[prefix]);
              if (!fam) fam = q(window.__ccAdvStablePrefixTypeFromStatsV1 && window.__ccAdvStablePrefixTypeFromStatsV1[prefix]);
            }
            if (!fam){
              var mk = q(p && (p.manufacturer || p.mfr)).toLowerCase();
              var wk = q(p && (p.weaponType || p.itemType || p.category)).toLowerCase();
              var ctx = mk + "|" + wk;
              fam = q(window.__ccAdvStableContextFamilyMapV1 && window.__ccAdvStableContextFamilyMapV1[ctx]);
            }
          }catch(_){}
        }
        if (/^\d+$/.test(fam)) return { family: fam, id: rawId };
      }
    }catch(_){}
    return null;
  }

  function isNumericMode(){
    try{
      if (typeof window.partEntryMode === "function"){
        var m = q(window.partEntryMode()).toLowerCase();
        if (m) return m.indexOf("numeric") !== -1;
      }
    }catch(_){}
    try{
      var all = document.querySelectorAll("#ccPartEntryMode");
      if (all && all.length){
        // Checkbox label: "Numeric ID" — checked => emit {fam:id} tokens; unchecked => spawn / quoted codes.
        for (var i = 0; i < all.length; i++){
          var el = all[i];
          if (!el || typeof el.checked !== "boolean") continue;
          if (el.offsetParent !== null) return !!el.checked;
        }
        var t = all[0];
        if (t && typeof t.checked === "boolean") return !!t.checked;
      }
    }catch(_){}
    return true;
  }

  function optionToken(opt){
    if (!opt) return "";
    var code = q(opt.dataset && opt.dataset.code ? opt.dataset.code : opt.value);
    if (isNumericMode()){
      var prefTok = q(opt.dataset && (opt.dataset.token || opt.dataset.ccToken || opt.dataset.idToken));
      var mPref = prefTok.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
      if (mPref) return "{" + mPref[1] + ":" + mPref[2] + "}";
      var mLead = q(opt.textContent).match(/^\s*\{\s*(\d+)\s*:\s*(\d+)\s*\}/);
      if (mLead) return "{" + mLead[1] + ":" + mLead[2] + "}";

      var fam = q(opt.dataset && opt.dataset.family);
      var id = q(opt.dataset && opt.dataset.id);
      var raw = q(opt.dataset && (opt.dataset.idRaw || opt.dataset.idraw));
      if ((!fam || !id) && raw){
        var mRaw = raw.match(/^\s*(\d+)\s*:\s*(\d+)\s*$/);
        if (mRaw){
          fam = fam || mRaw[1];
          id = id || mRaw[2];
        }
      }
      if (/^\d+$/.test(fam) && /^\d+$/.test(id)) return "{" + fam + ":" + id + "}";

      var codeKey = normCodeKey(code);
      if (codeKey){
        try{
          var hit = buildCodeIdMap()[codeKey];
          if (hit && /^\d+$/.test(hit.family) && /^\d+$/.test(hit.id)){
            return "{" + hit.family + ":" + hit.id + "}";
          }
        }catch(_){}
        try{
          var tokMap = window.__CC_TYPEID_MAP && window.__CC_TYPEID_MAP[stripQuotes(code)];
          var mMap = q(tokMap).match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
          if (mMap) return "{" + mMap[1] + ":" + mMap[2] + "}";
        }catch(_){}
        try{
          if (typeof window.__lookupPartByImportCode === "function"){
            var p = window.__lookupPartByImportCode(stripQuotes(code));
            var fi = resolveFamIdForPart(p, code);
            if (fi) return "{" + fi.family + ":" + fi.id + "}";
          }
        }catch(_){}
      }

      var mTxt = q(opt.textContent).match(/\{\s*(\d+)\s*:\s*(\d+)\s*\}/);
      if (mTxt) return "{" + mTxt[1] + ":" + mTxt[2] + "}";
      if (code){
        if (/^".*"$/.test(code)) return code;
        code = stripQuotes(code);
        return code ? ('"' + code + '"') : "";
      }
      var selId = q(opt && opt.parentElement && opt.parentElement.id).toLowerCase();
      if (/^\d+$/.test(id)){
        if (selId.indexOf("element") !== -1) return "{1:" + id + "}";
        return "{" + id + "}";
      }
      if (/^\d+$/.test(raw)){
        if (selId.indexOf("element") !== -1) return "{1:" + raw + "}";
        return "{" + raw + "}";
      }
      return "";
    }
    if (!code) return "";
    if (/^".*"$/.test(code)) return code;
    code = stripQuotes(code);
    return code ? ('"' + code + '"') : "";
  }

  function stableOptionKey(opt){
    if (!opt) return "";
    try{
      var fam = q(opt.dataset && opt.dataset.family);
      var id = q(opt.dataset && opt.dataset.id);
      if (/^\d+$/.test(fam) && /^\d+$/.test(id)) return "fid:" + fam + ":" + id;
    }catch(_){}
    try{
      var code = q(opt.dataset && opt.dataset.code ? opt.dataset.code : opt.value);
      if (code) return "code:" + normCodeKey(code);
    }catch(_){}
    try{
      var tok = optionToken(opt);
      if (tok) return "tok:" + q(tok).toLowerCase();
    }catch(_){}
    return "";
  }

  function haystack(p){
    return [
      q(p && p.name),
      q(p && p.manufacturer),
      q(p && p.category),
      q(p && p.itemType),
      q(p && p.weaponType),
      q(p && p.partType),
      stripQuotes(q(p && (p.code || p.spawnCode || p.importCode))),
      q(p && p.idRaw),
      q(p && (p.effects || p.effect))
    ].join(" ").toLowerCase();
  }

  function removeLegacyPanels(){
    try{
      var old = document.querySelectorAll("#ccUniversalAdvancedSearch");
      for (var i = 0; i < old.length; i++){
        var n = old[i];
        if (n && n.parentNode) n.parentNode.removeChild(n);
      }
    }catch(_){}
  }
  function hideLegacyPanels(){
    try{
      var sid = "ccAdvStableHideLegacyStyleV1";
      if (document.getElementById(sid)) return;
      var st = document.createElement("style");
      st.id = sid;
      st.textContent = [
        "#ccUniversalAdvancedSearch{display:none !important;visibility:hidden !important;pointer-events:none !important;}",
        "#ccAdvDomain,#ccAdvQuery,#ccAdvAddBtn,#ccAdvResults,#ccAdvMeta{display:none !important;visibility:hidden !important;pointer-events:none !important;}"
      ].join("");
      (document.head || document.documentElement || document.body).appendChild(st);
    }catch(_){}
  }

  var LARGE_DOMAIN_LIMIT = 600;
  var LARGE_DOMAIN_QUERY_MIN = 2;
  var MAX_RENDERED_RESULTS = 2500;
  var INITIAL_PREVIEW_LIMIT = 200;
  var queryRenderTimer = 0;

  function ensurePanel(){
    var mount = byId("ccAdvancedMount");
    if (!mount) return null;

    removeLegacyPanels();

    var panel = byId("ccAdvStablePanel");
    if (panel && panel.parentNode !== mount){
      try{ panel.parentNode.removeChild(panel); }catch(_){ }
      panel = null;
    }
    if (panel) return panel;

    panel = document.createElement("div");
    panel.id = "ccAdvStablePanel";
    panel.style.cssText = "border:1px solid rgba(0,255,200,0.4);border-radius:10px;padding:12px;margin-bottom:0;max-width:100%;box-sizing:border-box;background:rgba(8,16,24,0.65);";
    panel.innerHTML = [
      '<div style="margin-bottom:8px;color:#b9faff;font-size:12px;line-height:1.35;">Search parts and append serial tokens. <code style="color:#ff9b7d;">[not in STX]</code> = missing from dataset.</div>',
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;">',
      '<div style="min-width:90px;flex:1 1 90px;">',
      '<label for="ccStablePartDomain" style="display:block;color:#00f3ff;font-weight:700;margin-bottom:2px;font-size:11px;">Part domain</label>',
      '<select id="ccStablePartDomain" name="ccStablePartDomain" class="parts-select" style="width:100%;box-sizing:border-box;">',
      '<option value="gun">Gun</option>',
      '<option value="grenade">Grenade</option>',
      '<option value="shield">Shield</option>',
      '<option value="repkit">Repkit</option>',
      '<option value="enhancement">Enhancement</option>',
      '<option value="heavy">Heavy</option>',
      '<option value="classmod">Classmod</option>',
      '<option value="aicar">AI Car Guns</option>',
      '<option value="other">Other</option>',
      '<option value="all">All</option>',
      '</select>',
      '</div>',
      '<div style="min-width:100px;flex:2 1 120px;">',
      '<label for="ccStablePartQuery" style="display:block;color:#00c8ff;font-weight:700;margin-bottom:2px;font-size:11px;">Search</label>',
      '<input id="ccStablePartQuery" name="ccStablePartQuery" type="text" placeholder="Type to search or filter below..." style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:#0b0f18;color:#d8ffff;box-sizing:border-box;">',
      '</div>',
      '<div style="min-width:80px;flex:0 1 auto;">',
      '<button id="ccStablePartAddBtn" class="btn btn-primary" type="button" style="width:100%;padding:8px 12px;">Add to serial</button>',
      '</div>',
      '</div>',
      '<div id="ccStablePartFilterRow" style="display:none;margin-top:6px;gap:8px;flex-wrap:wrap;align-items:flex-end;">',
      '<div style="min-width:100px;flex:1 1 100px;">',
      '<label for="ccStablePartManuFilter" style="display:block;color:#00c8ff;font-weight:600;margin-bottom:2px;font-size:11px;">Manufacturer</label>',
      '<select id="ccStablePartManuFilter" name="ccStablePartManuFilter" class="parts-select" style="width:100%;box-sizing:border-box;"><option value="">All</option></select>',
      '</div>',
      '<div style="min-width:100px;flex:1 1 100px;">',
      '<label for="ccStablePartTypeFilter" style="display:block;color:#00c8ff;font-weight:600;margin-bottom:2px;font-size:11px;">Part type</label>',
      '<select id="ccStablePartTypeFilter" name="ccStablePartTypeFilter" class="parts-select" style="width:100%;box-sizing:border-box;"><option value="">All</option></select>',
      '</div>',
      '</div>',
      '<div style="margin-top:8px;">',
      '<select id="ccStablePartResults" name="ccStablePartResults" class="parts-select" size="8" style="width:100%;min-height:120px;max-height:180px;box-sizing:border-box;"></select>',
      '<div id="ccStablePartMeta" class="small muted" style="margin-top:6px;white-space:pre-line;">-</div>',
      '</div>'
    ].join("");

    mount.insertBefore(panel, mount.firstChild || null);
    return panel;
  }

  function renderPlaceholder(sel, meta, text, detail){
    if (!sel || !meta) return;
    sel.innerHTML = "";
    var ph = document.createElement("option");
    ph.value = "";
    ph.textContent = text;
    sel.appendChild(ph);
    meta.textContent = detail || "-";
  }

  function scheduleRender(delay){
    try{
      if (queryRenderTimer) clearTimeout(queryRenderTimer);
    }catch(_){ }
    queryRenderTimer = setTimeout(function(){
      queryRenderTimer = 0;
      render();
    }, Math.max(0, Number(delay) || 0));
  }

  function render(){
    var panel = ensurePanel();
    if (!panel) return;
    var dom = panel.querySelector("#ccStablePartDomain");
    var query = panel.querySelector("#ccStablePartQuery");
    var sel = panel.querySelector("#ccStablePartResults");
    var meta = panel.querySelector("#ccStablePartMeta");
    if (!dom || !query || !sel || !meta) return;

    var domainNow = q(dom.value).toLowerCase();
    var prevKey = "";
    try{
      var cur = (sel.selectedIndex >= 1 && sel.options) ? sel.options[sel.selectedIndex] : null;
      prevKey = stableOptionKey(cur);
      if (!prevKey && window.__ccStablePartLastSelDomainV1 === domainNow){
        prevKey = q(window.__ccStablePartLastSelKeyV1);
      }
    }catch(_){ }

    var pool = poolFor(dom.value);
    var manuFilter = panel.querySelector("#ccStablePartManuFilter");
    var typeFilter = panel.querySelector("#ccStablePartTypeFilter");
    var filterRow = panel.querySelector("#ccStablePartFilterRow");
    var showFilters = pool.length > 0;
    if (filterRow){
      filterRow.style.display = showFilters ? "flex" : "none";
    }
    if (showFilters && manuFilter && typeFilter){
      var manuSet = Object.create(null);
      var typeSet = Object.create(null);
      for (var fi = 0; fi < pool.length; fi++){
        var fp = pool[fi];
        var m = q(fp && (fp.manufacturer || fp.mfr));
        var t = q(fp && (fp.partType || fp.category || fp.weaponType || fp.itemType));
        if (m) manuSet[m] = true;
        if (t) typeSet[t] = true;
      }
      var manuOpts = Object.keys(manuSet).sort();
      var typeOpts = Object.keys(typeSet).sort();
      var curManu = q(manuFilter.value);
      var curType = q(typeFilter.value);
      manuFilter.innerHTML = '<option value="">All manufacturers</option>';
      for (var mi = 0; mi < manuOpts.length; mi++){
        var opt = document.createElement("option");
        opt.value = manuOpts[mi];
        opt.textContent = manuOpts[mi];
        manuFilter.appendChild(opt);
        if (manuOpts[mi] === curManu) manuFilter.value = curManu;
      }
      typeFilter.innerHTML = '<option value="">All part types</option>';
      for (var ti = 0; ti < typeOpts.length; ti++){
        var opt2 = document.createElement("option");
        opt2.value = typeOpts[ti];
        opt2.textContent = typeOpts[ti];
        typeFilter.appendChild(opt2);
        if (typeOpts[ti] === curType) typeFilter.value = curType;
      }
      pool = pool.filter(function(p){
        if (!p) return false;
        if (curManu && q(p.manufacturer || p.mfr) !== curManu) return false;
        if (curType && q(p.partType || p.category || p.weaponType || p.itemType) !== curType) return false;
        return true;
      });
    }
    var qv = q(query.value).toLowerCase();
    var manuVal = (manuFilter && showFilters) ? q(manuFilter.value) : "";
    var typeVal = (typeFilter && showFilters) ? q(typeFilter.value) : "";
    var renderKey = domainNow + "|" + qv + "|" + String(pool.length || 0) + "|" + manuVal + "|" + typeVal;
    var prevState = window.__ccStablePartRenderStateV1;
    if (prevState && prevState.key === renderKey && prevState.ready){
      try{ refreshStableMeta(sel, meta); }catch(_){}
      return;
    }

    var filtered = [];
    for (var i = 0; i < pool.length; i++){
      var p = pool[i];
      if (!p) continue;
      if (qv && haystack(p).indexOf(qv) === -1) continue;
      filtered.push(p);
    }

    filtered.sort(function(a, b){
      var an = q(a && (a.name || a.code)).toLowerCase();
      var bn = q(b && (b.name || b.code)).toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return 0;
    });

    var isInitialPreview = pool.length > LARGE_DOMAIN_LIMIT && qv.length < LARGE_DOMAIN_QUERY_MIN;
    var cap = isInitialPreview
      ? Math.min(filtered.length, INITIAL_PREVIEW_LIMIT)
      : Math.min(filtered.length, MAX_RENDERED_RESULTS);

    sel.innerHTML = "";
    var frag = document.createDocumentFragment();
    var ph = document.createElement("option");
    ph.value = "";
    ph.textContent = filtered.length
      ? (isInitialPreview ? ("-- Showing first " + cap + " of " + filtered.length + " (type to search all) --") : ("-- " + filtered.length + " matches --"))
      : "-- No matches --";
    frag.appendChild(ph);
    var restoreIndex = -1;
    for (var j = 0; j < cap; j++){
      var p2 = filtered[j];
      var code = q(p2 && (p2.code || p2.spawnCode || p2.importCode || p2.raw || p2.value || p2.name));
      if (!code) continue;
      var opt = document.createElement("option");
      opt.value = code;
      try{ opt.dataset.code = stripQuotes(code); }catch(_){ }
      try{
        opt.dataset.manufacturer = q(p2 && (p2.manufacturer || p2.mfr));
        opt.dataset.itemType = q(p2 && p2.itemType);
        opt.dataset.weaponType = q(p2 && p2.weaponType);
        opt.dataset.category = q(p2 && p2.category);
        opt.dataset.partType = q(p2 && (p2.partType || p2.kind));
        opt.dataset.legendaryName = q(p2 && (p2.legendaryName || p2.label));
        opt.dataset.statsHint = clipDetail(p2 && (p2.stats || p2.statText), 220);
        opt.dataset.effectsHint = clipDetail(p2 && (p2.effects || p2.effect), 160);
      }catch(_){ }
      var fi = resolveFamIdForPart(p2, code);
      if (fi){
        try{
          opt.dataset.family = fi.family;
          opt.dataset.id = fi.id;
          opt.dataset.idRaw = fi.family + ":" + fi.id;
        }catch(_){ }
      } else {
        try{
          var rawOnly = q(p2 && (p2.idRaw || p2.idraw));
          if (rawOnly) opt.dataset.idRaw = rawOnly;
          var idOnly = q(p2 && (p2.itemId != null ? p2.itemId : (p2.id != null ? p2.id : p2.partId)));
          if (/^\d+$/.test(idOnly)) opt.dataset.id = idOnly;
          if (/^\d+\s*:\s*\d+$/.test(rawOnly)){
            var mrx = rawOnly.match(/^\s*(\d+)\s*:\s*(\d+)\s*$/);
            if (mrx){
              opt.dataset.family = mrx[1];
              opt.dataset.id = mrx[2];
              opt.dataset.idRaw = mrx[1] + ":" + mrx[2];
            }
          }
        }catch(_){ }
      }
      var name = q(p2.name) || stripQuotes(code);
      var partType = q(p2.partType || p2.category);
      var manu = q(p2.manufacturer);
      var tok = "";
      if (fi){
        tok = "{" + fi.family + ":" + fi.id + "} ";
      } else {
        var rawTok = q(p2 && (p2.idRaw || p2.idraw));
        var mr = rawTok.match(/^\s*(\d+)\s*:\s*(\d+)\s*$/);
        if (mr) tok = "{" + mr[1] + ":" + mr[2] + "} ";
      }
      try{
        var tk = q(tok).replace(/\s+$/g, "");
        if (tk) opt.dataset.token = tk;
      }catch(_){ }
      var tags = partRefTags(fi, p2);
      var ef = q(p2 && (p2.effects || p2.effect));
      var efSuffix = ef ? (" — " + clipDetail(ef, 55)) : "";
      var label = tags.prefix + tok + name + (partType ? (" - " + partType) : "") + (manu ? (" | " + manu) : "") + efSuffix + tags.suffix;
      opt.textContent = label;
      if (typeof window.partTooltipText === 'function') { var t = window.partTooltipText(p2); if (t) opt.title = t; }
      try{
        var tt = metaLineForOption(opt);
        if (tt){
          if (opt.title) opt.title = String(opt.title) + "\n\n" + tt;
          else opt.title = tt;
        }
      }catch(_){}
      frag.appendChild(opt);
      if (restoreIndex < 0 && prevKey && stableOptionKey(opt) === prevKey){
        restoreIndex = j + 1;
      }
    }
    sel.appendChild(frag);
    if (restoreIndex >= 1){
      try{
        sel.selectedIndex = restoreIndex;
        var chosen = sel.options[restoreIndex];
        var chosenKey = stableOptionKey(chosen);
        if (chosenKey){
          window.__ccStablePartLastSelKeyV1 = chosenKey;
          window.__ccStablePartLastSelDomainV1 = domainNow;
        }
      }catch(_){ }
    }

    var filterMsg = cap < filtered.length
      ? (isInitialPreview
          ? ("Showing first " + cap + " of " + filtered.length + ". Type to search all, or use filters above.")
          : ("Showing first " + cap + " of " + filtered.length + " matches. Narrow the search to see the rest faster."))
      : (filtered.length ? "Select a part and click Add to serial." : "-");
    window.__ccStablePartLastFilterMsgV1 = filterMsg;
    try{ refreshStableMeta(sel, meta); }catch(_){}
    window.__ccStablePartRenderStateV1 = { key: renderKey, ready: true };
  }

  function addSelected(){
    var panel = ensurePanel();
    if (!panel) return false;
    var dom = panel.querySelector("#ccStablePartDomain");
    var sel = panel.querySelector("#ccStablePartResults");
    if (!sel || sel.selectedIndex < 1) return false;
    var opt = sel.options[sel.selectedIndex];
    if (!opt) return false;
    var domainNow = q(dom && dom.value).toLowerCase();
    var rawChoice = q(opt && (opt.value || (opt.dataset && opt.dataset.code)));
    function looksLikeFullItemSerial(v){
      var s = q(v);
      if (!s) return false;
      if (/^\{/.test(s)) return false;
      if (/^".*"$/.test(s)) s = s.slice(1, -1).trim();
      if (!s) return false;
      return s.indexOf(",") !== -1 && s.indexOf("|") !== -1;
    }
    if (domainNow === "aicar" && looksLikeFullItemSerial(rawChoice)){
      var fullSerial = rawChoice.replace(/^"+|"+$/g, "").trim();
      if (!fullSerial) return false;
      function setOutputText(el, v){
        if (!el) return;
        if (typeof el.value === "string") el.value = v;
        else el.textContent = v;
      }
      function writeFullSerial(v){
        var ids = ["outCode","outC","output-code","output-code-live","output-code-yaml","generatedItemCode","floating-output-code","itemCodeOutput","codePreview"];
        for (var i = 0; i < ids.length; i++){
          try{
            var el = document.getElementById(ids[i]);
            if (!el) continue;
            setOutputText(el, v);
          }catch(_){}
        }
      }
      function clearSelectedModel(rootLike){
        try{
          var sd = (rootLike && rootLike.selectedData) || window.selectedData || {};
          if (!sd || typeof sd !== "object") sd = {};
          var arrKeys = [
            "partsOrder","normalParts","legendaryParts","maliwanElementParts",
            "gunParts","shieldParts","grenadeParts","repkitParts",
            "enhancementParts","artifactParts","heavyParts","classmodParts",
            "classmodPerks","classmodFirmwarePerks","skinParts","elementParts"
          ];
          for (var ai = 0; ai < arrKeys.length; ai++){
            sd[arrKeys[ai]] = [];
          }
          sd.manufacturer = "AI Car Guns";
          try{ if (rootLike) rootLike.selectedData = sd; }catch(_){}
          try{ window.selectedData = sd; }catch(_){}
        }catch(_){}
      }
      try{
        var fullRoot = window;
        try{ if (window.top) fullRoot = window.top; }catch(_){}

        // Replace generated output with the selected full AI-car serial.
        writeFullSerial("");
        clearSelectedModel(fullRoot);
        if (window !== fullRoot) clearSelectedModel(window);
        writeFullSerial(fullSerial);

        try{
          fullRoot.__LAST_IMPORTED_DESERIALIZED = fullSerial;
          window.__LAST_IMPORTED_DESERIALIZED = fullSerial;
          var di = fullSerial.indexOf("||");
          var hdr = di >= 0 ? fullSerial.slice(0, di + 2).trim() : "";
          fullRoot.__IMPORTED_HEADER_FULL = hdr;
          window.__IMPORTED_HEADER_FULL = hdr;
          fullRoot.__IMPORTED_TAIL_TOKENS = [];
          fullRoot.originalPartsOrder = [];
          fullRoot.__IMPORTED_PARTS_ORDER_RAW = [];
          if (window !== fullRoot){
            window.__IMPORTED_TAIL_TOKENS = [];
            window.originalPartsOrder = [];
            window.__IMPORTED_PARTS_ORDER_RAW = [];
          }
        }catch(_){}
        try{ if (typeof fullRoot.updatePartsList === "function") fullRoot.updatePartsList(); }catch(_){}
        try{ if (typeof fullRoot.updateConversionButtons === "function") fullRoot.updateConversionButtons(); }catch(_){}
        try{ if (typeof fullRoot.refreshCoverage === "function") fullRoot.refreshCoverage(); }catch(_){}
      }catch(_){}
      return true;
    }

    var numericModeNow = isNumericMode();
    var token = optionToken(opt);
    if (numericModeNow){
      try{
        var mLbl = q(opt.textContent).match(/^\s*\{\s*(\d+)\s*:\s*(\d+)\s*\}/);
        if (mLbl) token = "{" + mLbl[1] + ":" + mLbl[2] + "}";
      }catch(_){}
    }
    if (!token) return false;
    function directAppendStableToken(rawToken, forcedCategory){
      try{
        var root = window;
        try{ if (window.top) root = window.top; }catch(_){}
        function asObj(x){ return (x && typeof x === "object") ? x : null; }
        function getText(el){
          if (!el) return "";
          return (typeof el.value === "string") ? String(el.value || "") : String(el.textContent || "");
        }
        function readCurrentSerialFromOutputs(){
          var ids = ["outCode","outC","output-code","output-code-live","output-code-yaml","generatedItemCode","floating-output-code"];
          try{
            var ae = document.activeElement;
            if (ae && ae.id && ids.indexOf(String(ae.id)) !== -1){
              var av = getText(ae).trim();
              if (av) return av;
            }
          }catch(_){}
          for (var i = 0; i < ids.length; i++){
            var el = document.getElementById(ids[i]);
            if (!el) continue;
            var v = getText(el).trim();
            if (v) return v;
          }
          return "";
        }
        function extractTailTokens(serial){
          var s = String(serial || "").trim();
          if (!s) return [];
          var dbl = s.indexOf("||");
          if (dbl < 0) return [];
          var lastPipe = s.lastIndexOf("|");
          if (lastPipe < dbl + 2) lastPipe = s.length;
          var tail = s.slice(dbl + 2, lastPipe).trim();
          if (!tail) return [];
          return tail.match(/\{[^}]+\}|\"[^\"]+\"|\S+/g) || [];
        }
        function setText(el, v){
          if (!el) return;
          if (typeof el.value === "string") el.value = v;
          else el.textContent = v;
        }
        function writeSerialToOutputs(serial){
          var ids = ["outCode","outC","output-code","output-code-live","output-code-yaml","generatedItemCode","floating-output-code"];
          for (var i = 0; i < ids.length; i++){
            try{
              var el = document.getElementById(ids[i]);
              if (!el) continue;
              setText(el, serial);
            }catch(_){}
          }
        }
        function canonicalTailToken(v){
          var s = String(v == null ? "" : v).trim();
          var m = s.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
          if (m) return "{" + m[1] + ":" + m[2] + "}";
          m = s.match(/^\{\s*(\d+)\s*\}$/);
          if (m) return "{" + m[1] + "}";
          if (/^".*"$/.test(s)) return s;
          return s.replace(/\s+/g, " ").trim().toLowerCase();
        }
        function countTailToken(arr, tok){
          var want = canonicalTailToken(tok);
          if (!want || !Array.isArray(arr) || !arr.length) return 0;
          var n = 0;
          for (var i = 0; i < arr.length; i++){
            if (canonicalTailToken(arr[i]) === want) n++;
          }
          return n;
        }
        function trimTokenArray(arr, tok, keepMax){
          if (!Array.isArray(arr) || !arr.length) return arr;
          var want = canonicalTailToken(tok);
          if (!want) return arr.slice();
          var seen = 0;
          var out = [];
          for (var i = 0; i < arr.length; i++){
            var v = arr[i];
            if (canonicalTailToken(v) === want){
              seen++;
              if (seen > keepMax) continue;
            }
            out.push(v);
          }
          return out;
        }
        function trimTokenArrayByCode(arr, tok, keepMax){
          if (!Array.isArray(arr) || !arr.length) return arr;
          var want = canonicalTailToken(tok);
          if (!want) return arr.slice();
          var seen = 0;
          var out = [];
          for (var i = 0; i < arr.length; i++){
            var it = arr[i];
            var code = String((it && it.code != null) ? it.code : it);
            if (canonicalTailToken(code) === want){
              seen++;
              if (seen > keepMax) continue;
            }
            out.push(it);
          }
          return out;
        }
        function hasUsableHeader(serialOrHeader){
          var s = String(serialOrHeader || "").trim();
          var di = s.indexOf("||");
          if (di < 0) return false;
          var left = s.slice(0, di).trim();
          return !!left && /\d/.test(left);
        }
        function extractHeader(serial){
          var s = String(serial || "").trim();
          var di = s.indexOf("||");
          if (di < 0) return "";
          var h = s.slice(0, di + 2).replace(/\s+$/g, "");
          return hasUsableHeader(h) ? h : "";
        }
        function bestKnownHeader(){
          var cands = [];
          try{ cands.push(String((root && root.__IMPORTED_HEADER_FULL) || window.__IMPORTED_HEADER_FULL || "")); }catch(_){}
          try{ cands.push(String((root && root.__LAST_IMPORTED_DESERIALIZED) || window.__LAST_IMPORTED_DESERIALIZED || "")); }catch(_){}
          try{
            if (typeof root.currentSerial === "function") cands.push(String(root.currentSerial() || ""));
          }catch(_){}
          try{
            if (typeof window.currentSerial === "function") cands.push(String(window.currentSerial() || ""));
          }catch(_){}
          try{ cands.push(String(readCurrentSerialFromOutputs() || "")); }catch(_){}
          for (var i = 0; i < cands.length; i++){
            var cur = String(cands[i] || "").trim();
            if (!cur) continue;
            var h = extractHeader(cur);
            if (h) return h;
            if (hasUsableHeader(cur)) return cur.replace(/\s+$/g, "");
          }
          try{
            var synthFn = (root && root.__ccGuidedSynthesizeHeaderV1) || window.__ccGuidedSynthesizeHeaderV1;
            if (typeof synthFn === "function"){
              var synth = String(synthFn() || "").trim();
              if (hasUsableHeader(synth)) return synth;
            }
          }catch(_){}
          return "";
        }
        function enforceSingleDirectToken(tok, baseline){
          try{
            var keepMax = Math.max(0, Number(baseline) || 0) + 1;

            // 1) Keep serialized output tail capped.
            try{
              var serialNow = readCurrentSerialFromOutputs();
              var sNow = String(serialNow || "").trim();
              var dblNow = sNow.indexOf("||");
              if (dblNow >= 0){
                var beforeNow = sNow.slice(0, dblNow + 2).replace(/\s+$/g, "");
                if (!hasUsableHeader(beforeNow)) beforeNow = bestKnownHeader();
                if (!hasUsableHeader(beforeNow)) return;
                var tailNow = extractTailTokens(sNow);
                var tailTrim = trimTokenArray(tailNow, tok, keepMax);
                if (tailTrim.length !== tailNow.length){
                  var outNow = beforeNow + (tailTrim.length ? (" " + tailTrim.join(" ")) : "") + "|";
                  writeSerialToOutputs(outNow);
                }
              }
            }catch(_){}

            // 2) Keep mirrors capped.
            try{
              if (Array.isArray(root.__IMPORTED_TAIL_TOKENS)){
                root.__IMPORTED_TAIL_TOKENS = trimTokenArray(root.__IMPORTED_TAIL_TOKENS, tok, keepMax);
              }
              if (Array.isArray(window.__IMPORTED_TAIL_TOKENS)){
                window.__IMPORTED_TAIL_TOKENS = trimTokenArray(window.__IMPORTED_TAIL_TOKENS, tok, keepMax);
              }
            }catch(_){}
            try{
              function rebuildRaw(arr){
                return (arr || []).map(function(code, i){
                  var c = String(code || "");
                  var t = c.indexOf(":") >= 0 ? (c.indexOf("[") >= 0 ? "list" : "keyed") : "standalone";
                  return { index: i, code: c, type: t };
                });
              }
              if (Array.isArray(root.__IMPORTED_TAIL_TOKENS)){
                var rr = rebuildRaw(root.__IMPORTED_TAIL_TOKENS);
                root.originalPartsOrder = rr.slice();
                root.__IMPORTED_PARTS_ORDER_RAW = rr.slice();
                if (window !== root){
                  window.originalPartsOrder = rr.slice();
                  window.__IMPORTED_PARTS_ORDER_RAW = rr.slice();
                }
              }
            }catch(_){}

            // 3) Keep selectedData arrays capped so later refresh cannot re-introduce duplicates.
            try{
              var sdx = (root && root.selectedData) || window.selectedData || sd;
              if (sdx && typeof sdx === "object"){
                if (Array.isArray(sdx.partsOrder)) sdx.partsOrder = trimTokenArrayByCode(sdx.partsOrder, tok, keepMax);
                var arrKeys = [
                  "normalParts","legendaryParts","maliwanElementParts",
                  "gunParts","shieldParts","grenadeParts","repkitParts",
                  "enhancementParts","artifactParts","heavyParts","classmodParts",
                  "classmodPerks","classmodFirmwarePerks","skinParts","elementParts"
                ];
                var keepForBuckets = noReorderMode ? 0 : keepMax;
                for (var ai = 0; ai < arrKeys.length; ai++){
                  var ak = arrKeys[ai];
                  if (Array.isArray(sdx[ak])) sdx[ak] = trimTokenArrayByCode(sdx[ak], tok, keepForBuckets);
                }
                try{ root.selectedData = sdx; }catch(_){}
                try{ window.selectedData = sdx; }catch(_){}
              }
            }catch(_){}
          }catch(_){}
        }
        function appendTokenWithoutReorder(tok, preCount){
          try{
            var serial = readCurrentSerialFromOutputs();
            var s = String(serial || "").trim();
            var dbl = s.indexOf("||");
            var before = "";
            var toks = [];
            if (!s){
              var hdr = bestKnownHeader();
              if (!hasUsableHeader(hdr)) return false;
              before = hdr.replace(/\s+$/g, "");
              toks = [];
            } else if (dbl < 0){
              // Header exists but no explicit tail marker yet; normalize into "||" form.
              var head = s.replace(/\s+$/g, "");
              if (head.indexOf("|") >= 0){
                head = head.replace(/\|+$/g, "");
                before = head + "||";
                toks = [];
              } else {
                return false;
              }
            } else {
              before = s.slice(0, dbl + 2).replace(/\s+$/g, "");
              if (!hasUsableHeader(before)){
                before = bestKnownHeader();
                if (!hasUsableHeader(before)) return false;
              }
              toks = extractTailTokens(s);
            }
            var baseline = Math.max(0, Number(preCount) || 0);
            var curCount = countTailToken(toks, tok);
            // If another listener already appended this token for this click, do not append again.
            if (curCount <= baseline){
              toks.push(tok);
            }
            var out = before + (toks.length ? (" " + toks.join(" ")) : "") + "|";
            writeSerialToOutputs(out);
            try{
              var rawOrder = toks.map(function(code, i){
                var t = String(code || "").indexOf(":") >= 0 ? (String(code || "").indexOf("[") >= 0 ? "list" : "keyed") : "standalone";
                return { index: i, code: String(code || ""), type: t };
              });
              root.__IMPORTED_TAIL_TOKENS = toks.slice();
              root.originalPartsOrder = rawOrder.slice();
              root.__IMPORTED_PARTS_ORDER_RAW = rawOrder.slice();
              if (window !== root){
                window.__IMPORTED_TAIL_TOKENS = toks.slice();
                window.originalPartsOrder = rawOrder.slice();
                window.__IMPORTED_PARTS_ORDER_RAW = rawOrder.slice();
              }
            }catch(_){}
            try{
              if (Array.isArray(sd.partsOrder) && sd.partsOrder.length){
                sd.partsOrder = toks.map(function(code){
                  var c = String(code || "").trim();
                  return { type: c.startsWith('"') ? "quoted" : "bracket", code: c, quantity: 1 };
                });
              }
            }catch(_){}
            return true;
          }catch(_){}
          return false;
        }
        function arrLen(o, k){ try{ return Array.isArray(o && o[k]) ? o[k].length : 0; }catch(_){ return 0; } }
        function score(o){
          if (!asObj(o)) return -1;
          return (
            arrLen(o, "partsOrder") * 4 +
            arrLen(o, "normalParts") +
            arrLen(o, "legendaryParts") +
            arrLen(o, "maliwanElementParts") +
            arrLen(o, "gunParts") +
            arrLen(o, "shieldParts") +
            arrLen(o, "grenadeParts") +
            arrLen(o, "repkitParts") +
            arrLen(o, "enhancementParts") +
            arrLen(o, "artifactParts") +
            arrLen(o, "heavyParts") +
            arrLen(o, "classmodParts")
          );
        }
        var sdRoot = asObj(root && root.selectedData);
        var sdWin = asObj(window.selectedData);
        var sd = null;
        if (score(sdRoot) >= score(sdWin)) sd = sdRoot;
        else sd = sdWin;
        if (!sd) sd = {};
        try{
          var mergeKeys = [
            "partsOrder","normalParts","legendaryParts","maliwanElementParts",
            "gunParts","shieldParts","grenadeParts","repkitParts","enhancementParts",
            "artifactParts","heavyParts","classmodParts","classmodPerks","classmodFirmwarePerks",
            "skinParts","elementParts"
          ];
          var peers = [sdRoot, sdWin];
          for (var pi = 0; pi < peers.length; pi++){
            var peer = peers[pi];
            if (!peer || peer === sd) continue;
            for (var mi = 0; mi < mergeKeys.length; mi++){
              var mk = mergeKeys[mi];
              var curArr = Array.isArray(sd[mk]) ? sd[mk] : [];
              var peerArr = Array.isArray(peer[mk]) ? peer[mk] : [];
              if (!curArr.length && peerArr.length){
                sd[mk] = peerArr.slice();
              }
            }
          }
        }catch(_){}
        var keys = [
          "normalParts","legendaryParts","maliwanElementParts","partsOrder",
          "gunParts","shieldParts","grenadeParts","repkitParts","enhancementParts",
          "artifactParts","heavyParts","classmodParts","classmodPerks","classmodFirmwarePerks",
          "skinParts","elementParts"
        ];
        for (var ki = 0; ki < keys.length; ki++){
          var k = keys[ki];
          if (!Array.isArray(sd[k])) sd[k] = [];
        }

        var tok = q(rawToken);
        if (!tok) return false;
        var preTokenCount = 0;
        var serialBeforeAdd = "";
        var hasTailSerial = false;
        try{
          serialBeforeAdd = readCurrentSerialFromOutputs();
          hasTailSerial = String(serialBeforeAdd || "").indexOf("||") >= 0;
          var tailBeforeAdd = extractTailTokens(serialBeforeAdd);
          preTokenCount = countTailToken(tailBeforeAdd, tok);
        }catch(_){}
        try{
          var nowTs = Date.now();
          var directSig = String(tok) + "||" + String(q(forcedCategory || "")).toLowerCase();
          var prevDirect = (root && root.__ccStableDirectAddGuardV1) || window.__ccStableDirectAddGuardV1 || null;
          var allowDupNow = false;
          try{
            allowDupNow = !!(
              (root && (root.__ccAllowDuplicatePartsNextAdd || root.__ccAllowDuplicateAdd)) ||
              window.__ccAllowDuplicatePartsNextAdd ||
              window.__ccAllowDuplicateAdd
            );
          }catch(_){ allowDupNow = false; }
          if (!allowDupNow && prevDirect && prevDirect.sig === directSig && (nowTs - Number(prevDirect.ts || 0)) < 450){
            return false;
          }
          var nextDirect = { sig: directSig, ts: nowTs };
          try{ root.__ccStableDirectAddGuardV1 = nextDirect; }catch(_){}
          try{ window.__ccStableDirectAddGuardV1 = nextDirect; }catch(_){}
        }catch(_){}
        var bare = tok.replace(/^"+|"+$/g, "").trim();
        var preTokens = [];
        try{
          if (Array.isArray(root.__ccGuidedStackTokens) && root.__ccGuidedStackTokens.length){
            preTokens = root.__ccGuidedStackTokens.slice();
          } else if (Array.isArray(window.__ccGuidedStackTokens) && window.__ccGuidedStackTokens.length){
            preTokens = window.__ccGuidedStackTokens.slice();
          } else {
            try{
              if (typeof root.__ccSyncGuidedTokensFromOutputs === "function") root.__ccSyncGuidedTokensFromOutputs();
              else if (typeof window.__ccSyncGuidedTokensFromOutputs === "function") window.__ccSyncGuidedTokensFromOutputs();
            }catch(_){}
            if (Array.isArray(root.__ccGuidedStackTokens) && root.__ccGuidedStackTokens.length){
              preTokens = root.__ccGuidedStackTokens.slice();
            } else if (Array.isArray(window.__ccGuidedStackTokens) && window.__ccGuidedStackTokens.length){
              preTokens = window.__ccGuidedStackTokens.slice();
            }
          }
          if (!preTokens.length){
            var serialSnap = readCurrentSerialFromOutputs();
            preTokens = extractTailTokens(serialSnap);
          }
        }catch(_){}
        if (preTokens.length){
          var rebasePo = false;
          try{
            var poNow = Array.isArray(sd.partsOrder) ? sd.partsOrder : [];
            if (poNow.length !== preTokens.length){
              rebasePo = true;
            } else {
              for (var pti = 0; pti < preTokens.length; pti++){
                var want = String(preTokens[pti] || "").trim();
                var have = String((poNow[pti] && poNow[pti].code) || "").trim();
                if (want !== have){
                  rebasePo = true;
                  break;
                }
              }
            }
          }catch(_){ rebasePo = true; }
          if (rebasePo){
            sd.partsOrder = preTokens.map(function(code){
              var c = String(code || "").trim();
              return { type: c.startsWith('"') ? "quoted" : "bracket", code: c, quantity: 1 };
            });
          }
        }
        var part = null;
        try{
          if (typeof root.__lookupPartByImportCode === "function"){
            part = root.__lookupPartByImportCode(bare) || root.__lookupPartByImportCode(tok);
          }
          if (!part && typeof root.ccLookupPartByCode === "function"){
            part = root.ccLookupPartByCode(bare) || root.ccLookupPartByCode(tok);
          }
        }catch(_){}

        var cat = q(forcedCategory || (part && part.category) || "");
        if (!cat) cat = "Normal";
        var catLc = cat.toLowerCase();
        var noReorderMode = true;
        try{
          if ((root && root.__CC_ADV_STABLE_USE_GENERATOR === true) || window.__CC_ADV_STABLE_USE_GENERATOR === true){
            noReorderMode = false;
          }
        }catch(_){}
        var keepBucketEntry = false;
        try{
          keepBucketEntry = !!((root && root.__CC_ADV_DIRECT_KEEP_BUCKET_ENTRY === true) || window.__CC_ADV_DIRECT_KEEP_BUCKET_ENTRY === true);
        }catch(_){}
        // If there is no existing "|| tail" serial to append into, keep model buckets so
        // generator-based fallback can create the first output with this token.
        if (!hasTailSerial) keepBucketEntry = true;
        var idRaw = "";
        try{
          idRaw = q(part && (part.idRaw || part.idraw));
          if (!idRaw){
            var mList = tok.match(/^\{\s*(\d+)\s*:\s*\[([^\]]+)\]\s*\}$/);
            if (mList) idRaw = mList[1] + ":[" + q(mList[2]).replace(/\s+/g, " ") + "]";
          }
          if (!idRaw){
            var mPair = tok.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*\}$/);
            if (mPair) idRaw = mPair[1] + ":" + mPair[2];
          }
          if (!idRaw){
            var mBare = tok.match(/^\{\s*(\d+)\s*\}$/);
            if (mBare) idRaw = mBare[1];
          }
        }catch(_){}

        var entry = {
          id: (part && part.id != null) ? part.id : ("stable_" + Date.now() + "_" + Math.random().toString(36).slice(2)),
          code: tok,
          idRaw: idRaw,
          spawnCode: q((part && (part.spawnCode || part.code || part.string)) || bare || tok),
          name: q((part && part.name) || bare || tok),
          description: q((part && part.description) || ""),
          quantity: 1,
          category: cat
        };

        if (!noReorderMode || keepBucketEntry){
          if (catLc.indexOf("legendary") !== -1) sd.legendaryParts.push(entry);
          else sd.normalParts.push(entry);

          // Default off: mirroring into both generic and category arrays can serialize twice.
          var mirrorCategoryArrays = !!((root && root.__CC_ADV_DIRECT_MIRROR_CATEGORY_ARRAYS === true) || window.__CC_ADV_DIRECT_MIRROR_CATEGORY_ARRAYS === true);
          if (mirrorCategoryArrays){
            var arrKey = "";
            if (catLc.indexOf("gun") !== -1 || catLc.indexOf("weapon") !== -1) arrKey = "gunParts";
            else if (catLc.indexOf("shield") !== -1) arrKey = "shieldParts";
            else if (catLc.indexOf("grenade") !== -1) arrKey = "grenadeParts";
            else if (catLc.indexOf("repkit") !== -1) arrKey = "repkitParts";
            else if (catLc.indexOf("enhancement") !== -1) arrKey = "enhancementParts";
            else if (catLc.indexOf("artifact") !== -1) arrKey = "artifactParts";
            else if (catLc.indexOf("heavy") !== -1) arrKey = "heavyParts";
            else if (catLc.indexOf("classmod") !== -1) arrKey = "classmodParts";
            if (arrKey){
              if (!Array.isArray(sd[arrKey])) sd[arrKey] = [];
              sd[arrKey].push(entry);
            }
          }
        }

        sd.partsOrder.push({
          type: tok.startsWith('"') ? "quoted" : "bracket",
          code: tok,
          quantity: 1
        });
        try{
          if (preTokens.length || root.__ccGuidedStackActive || window.__ccGuidedStackActive){
            var stack = preTokens.length ? preTokens.slice() : [];
            stack.push(tok);
            try{ root.__ccGuidedStackTokens = stack.slice(); }catch(_){}
            try{ window.__ccGuidedStackTokens = stack.slice(); }catch(_){}
          }
        }catch(_){}

        try{ root.selectedData = sd; }catch(_){}
        try{ window.selectedData = sd; }catch(_){}
        // Do not rebuild imported-tail mirrors from partsOrder here; that can drop
        // previously stacked guided parts when different state snapshots race.
        // Only append to lock mirrors when import-lock is actively enabled.
        try{
          var locked = !!((root && root.__LOCK_IMPORTED_OUTPUT) || window.__LOCK_IMPORTED_OUTPUT);
          if (locked){
            var tail = Array.isArray(root.__IMPORTED_TAIL_TOKENS) ? root.__IMPORTED_TAIL_TOKENS.slice() :
                       (Array.isArray(window.__IMPORTED_TAIL_TOKENS) ? window.__IMPORTED_TAIL_TOKENS.slice() : []);
            tail.push(tok);
            var rawOrder = tail.map(function(code, i){
              var t = code.includes(":") ? (code.includes("[") ? "list" : "keyed") : "standalone";
              return { index: i, code: code, type: t };
            });
            try{ root.__IMPORTED_TAIL_TOKENS = tail.slice(); }catch(_){}
            try{ root.originalPartsOrder = rawOrder.slice(); }catch(_){}
            try{ root.__IMPORTED_PARTS_ORDER_RAW = rawOrder.slice(); }catch(_){}
            if (window !== root){
              try{ window.__IMPORTED_TAIL_TOKENS = tail.slice(); }catch(_){}
              try{ window.originalPartsOrder = rawOrder.slice(); }catch(_){}
              try{ window.__IMPORTED_PARTS_ORDER_RAW = rawOrder.slice(); }catch(_){}
            }
          }
        }catch(_){}

        try{
          if (!noReorderMode && typeof root.updatePartsList === "function") root.updatePartsList();
        }catch(_){}
        if (noReorderMode){
          try{
            if (appendTokenWithoutReorder(tok, preTokenCount)){
              try{
                enforceSingleDirectToken(tok, preTokenCount);
                setTimeout(function(){ enforceSingleDirectToken(tok, preTokenCount); }, 40);
                setTimeout(function(){ enforceSingleDirectToken(tok, preTokenCount); }, 140);
                setTimeout(function(){ enforceSingleDirectToken(tok, preTokenCount); }, 420);
                setTimeout(function(){ enforceSingleDirectToken(tok, preTokenCount); }, 900);
              }catch(_){}
              try{ root.selectedData = sd; }catch(_){}
              try{ window.selectedData = sd; }catch(_){}
              try{
                if (typeof root.__ccGuidedOutputApplyNow === "function") root.__ccGuidedOutputApplyNow();
                else if (typeof window.__ccGuidedOutputApplyNow === "function") window.__ccGuidedOutputApplyNow();
              }catch(_){}
              return true;
            }
          }catch(_){}
        }
        try{
          if (!hasTailSerial){
            if (typeof root.updateOutputCode === "function") root.updateOutputCode();
            else if (typeof root.generateItem === "function") root.generateItem();
            else if (typeof root.updateCodePreview === "function") root.updateCodePreview();
            else if (typeof window.updateOutputCode === "function") window.updateOutputCode();
            else if (typeof window.generateItem === "function") window.generateItem();
            else if (typeof window.updateCodePreview === "function") window.updateCodePreview();
          } else {
            if (typeof root.updateCodePreview === "function") root.updateCodePreview();
            else if (typeof root.updateOutputCode === "function") root.updateOutputCode();
            else if (typeof root.generateItem === "function") root.generateItem();
            else if (typeof window.updateCodePreview === "function") window.updateCodePreview();
            else if (typeof window.updateOutputCode === "function") window.updateOutputCode();
            else if (typeof window.generateItem === "function") window.generateItem();
          }
        }catch(_){}
        try{
          if (typeof root.__ccGuidedOutputApplyNow === "function") root.__ccGuidedOutputApplyNow();
          else if (typeof window.__ccGuidedOutputApplyNow === "function") window.__ccGuidedOutputApplyNow();
        }catch(_){}
        try{
          // Clear stable select-gate after a successful explicit add so other dropdown
          // add flows (grenade/repkit/shield/etc.) are not blocked by stale gate timers.
          root.__ccStablePartSelectGateUntilV1 = 0;
          root.__ccStablePartPendingSigV1 = "";
          root.__ccStablePartPrevSigV1 = "";
          root.__ccStablePartExplicitSigV1 = "";
          root.__ccStablePartExplicitAltSigV1 = "";
          root.__ccStablePartExplicitUntilV1 = 0;
          root.__ccStablePartExplicitUsedV1 = false;
          if (window !== root){
            window.__ccStablePartSelectGateUntilV1 = 0;
            window.__ccStablePartPendingSigV1 = "";
            window.__ccStablePartPrevSigV1 = "";
            window.__ccStablePartExplicitSigV1 = "";
            window.__ccStablePartExplicitAltSigV1 = "";
            window.__ccStablePartExplicitUntilV1 = 0;
            window.__ccStablePartExplicitUsedV1 = false;
          }
        }catch(_){}
        return true;
      }catch(_){}
      return false;
    }
    try{
      var useDirect = true;
      var forcedCat = "";
      try{
        forcedCat = (typeof domainCategory === "function") ? domainCategory(dom && dom.value) : q(dom && dom.value);
      }catch(_){}
      if (useDirect && directAppendStableToken(token, forcedCat)){
        return true;
      }
    }catch(_){}
    try{
      var clearRoot = window;
      try{ if (window.top) clearRoot = window.top; }catch(_){}
      clearRoot.__ccInSelectChange = false;
      window.__ccInSelectChange = false;
    }catch(_){}

    var sig = token + "||" + q(dom && dom.value).toLowerCase();
    var now = Date.now();
    function stableSig(v){
      var s = q(v);
      var mFull = s.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*[\}\)\]]$/);
      if (mFull) return "{" + mFull[1] + ":" + mFull[2] + "}";
      var mBare = s.match(/^\{\s*(\d+)\s*[\}\)\]]$/);
      if (mBare) return "{" + mBare[1] + "}";
      return s.replace(/^"+|"+$/g, "").toLowerCase();
    }
    function stableSigMatches(curSig, wantSig){
      try{
        function parsed(v){
          var s = q(v);
          var m = s.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*[\}\)\]]$/);
          if (m) return { kind: "full", fam: m[1], id: m[2], v: "{" + m[1] + ":" + m[2] + "}" };
          m = s.match(/^\{\s*(\d+)\s*[\}\)\]]$/);
          if (m) return { kind: "bare", fam: "", id: m[1], v: "{" + m[1] + "}" };
          return { kind: "str", fam: "", id: "", v: s.replace(/^"+|"+$/g, "").toLowerCase() };
        }
        var c = parsed(curSig);
        var w = parsed(wantSig);
        if (!c.v || !w.v) return false;
        if (c.kind === "str" || w.kind === "str"){
          return c.kind === "str" && w.kind === "str" && c.v === w.v;
        }
        if (c.id !== w.id) return false;
        if (w.kind === "full"){
          if (c.kind === "full") return c.fam === w.fam;
          return true;
        }
        return true;
      }catch(_){}
      return false;
    }
    function itemCodeForKey(it, key){
      try{
        if (key === "partsOrder"){
          return q(it && it.code != null ? it.code : it);
        }
        return q(it && (it.code != null ? it.code : (it.spawnCode != null ? it.spawnCode : (it.string != null ? it.string : (it.value != null ? it.value : it)))));
      }catch(_){}
      return "";
    }
    function countSigInArrayKey(rootLike, key, wantSig){
      try{
        var sd = (rootLike && rootLike.selectedData) || window.selectedData || {};
        var po = Array.isArray(sd[key]) ? sd[key] : [];
        var n = 0;
        for (var i = 0; i < po.length; i++){
          var cur = stableSig(itemCodeForKey(po[i], key));
          if (stableSigMatches(cur, wantSig)) n++;
        }
        return n;
      }catch(_){}
      return 0;
    }
    function trimSigInArrayKey(rootLike, key, wantSig, keepMax){
      try{
        if (!wantSig) return false;
        var sd = (rootLike && rootLike.selectedData) || window.selectedData || {};
        var po = Array.isArray(sd[key]) ? sd[key] : null;
        if (!po || !po.length) return false;
        var out = [];
        var seen = 0;
        var changed = false;
        for (var i = 0; i < po.length; i++){
          var it = po[i];
          var cur = stableSig(itemCodeForKey(it, key));
          if (stableSigMatches(cur, wantSig)){
            seen++;
            if (seen > keepMax){
              changed = true;
              continue;
            }
          }
          out.push(it);
        }
        if (!changed) return false;
        sd[key] = out;
        try{ if (rootLike) rootLike.selectedData = sd; }catch(_){}
        try{ window.selectedData = sd; }catch(_){}
        return true;
      }catch(_){}
      return false;
    }
    function countSigInRawArray(arr, wantSig, codeField){
      try{
        if (!Array.isArray(arr) || !arr.length || !wantSig) return 0;
        var n = 0;
        for (var i = 0; i < arr.length; i++){
          var it = arr[i];
          var raw = "";
          if (codeField) raw = q(it && it[codeField] != null ? it[codeField] : (it && it.code != null ? it.code : it));
          else raw = q(it && it.code != null ? it.code : it);
          if (stableSigMatches(stableSig(raw), wantSig)) n++;
        }
        return n;
      }catch(_){}
      return 0;
    }
    function trimSigInRootArray(rootLike, key, wantSig, keepMax, codeField){
      try{
        if (!rootLike || !key || !wantSig) return false;
        var arr = rootLike[key];
        if (!Array.isArray(arr) || !arr.length) return false;
        var out = [];
        var seen = 0;
        var changed = false;
        for (var i = 0; i < arr.length; i++){
          var it = arr[i];
          var raw = "";
          if (codeField) raw = q(it && it[codeField] != null ? it[codeField] : (it && it.code != null ? it.code : it));
          else raw = q(it && it.code != null ? it.code : it);
          if (stableSigMatches(stableSig(raw), wantSig)){
            seen++;
            if (seen > keepMax){
              changed = true;
              continue;
            }
          }
          out.push(it);
        }
        if (!changed) return false;
        rootLike[key] = out;
        return true;
      }catch(_){}
      return false;
    }
    var stableClickSig = "";
    var stablePreCounts = Object.create(null);
    var stablePreMirrorCounts = { importedTail: 0, originalOrder: 0, importedRaw: 0 };
    var stableKeys = [
      "partsOrder","normalParts","legendaryParts","maliwanElementParts",
      "gunParts","shieldParts","grenadeParts","repkitParts",
      "enhancementParts","artifactParts","heavyParts","classmodParts",
      "classmodPerks","classmodFirmwarePerks","skinParts","elementParts"
    ];
    try{
      var last = window.__ccAdvStableLastAddV1 || { sig: "", ts: 0 };
      if (last.sig === sig && (now - Number(last.ts || 0)) < 700) return false;
      window.__ccAdvStableLastAddV1 = { sig: sig, ts: now };
    }catch(_){}

    // Declare the expected token for this click window so legacy listeners
    // that fire on the same interaction cannot inject a different part.
    try{
      var root = window;
      try{ if (window.top) root = window.top; }catch(_){}
      var expected = "";
      if (numericModeNow){
        var ef = q(opt && opt.dataset && opt.dataset.family);
        var ei = q(opt && opt.dataset && opt.dataset.id);
        if (/^\d+$/.test(ef) && /^\d+$/.test(ei)){
          expected = "{" + ef + ":" + ei + "}";
        }
        if (!expected){
          var expectedCode = q(opt && opt.dataset && opt.dataset.code ? opt.dataset.code : (opt && opt.value ? opt.value : token));
          try{
            var exHit = buildCodeIdMap()[normCodeKey(expectedCode)];
            if (exHit && /^\d+$/.test(exHit.family) && /^\d+$/.test(exHit.id)){
              expected = "{" + exHit.family + ":" + exHit.id + "}";
            }
          }catch(_){}
        }
      }
      if (!expected) expected = stableSig(token);
      root.__ccAdvStableExpectedSigV1 = expected;
      root.__ccAdvStableExpectedUntilV1 = now + 900;
      // One-click guard: allow exactly one add for this stable-panel click.
      root.__ccAdvStableClickSigV1 = expected;
      root.__ccAdvStableClickUntilV1 = now + 1200;
      root.__ccAdvStableClickUsedV1 = false;
      var explicitSig = stableSig(token);
      // Explicit stable-panel add gate: only this token is allowed once right now.
      root.__ccStablePartExplicitSigV1 = explicitSig;
      root.__ccStablePartExplicitAltSigV1 = expected;
      root.__ccStablePartExplicitUntilV1 = now + 3500;
      root.__ccStablePartExplicitUsedV1 = false;
      stableClickSig = expected || explicitSig;
      var ticketSig = stableClickSig || explicitSig || expected || "";
      var ticket = { sig: ticketSig, until: now + 900, used: false, ts: now };
      root.__ccStableHardOneAddTicketV1 = ticket;
      window.__ccStableHardOneAddTicketV1 = ticket;
    }catch(_){}

    // Clear stale legacy one-shot gates so each explicit stable add can proceed.
    try{
      var gateRoot = window;
      try{ if (window.top) gateRoot = window.top; }catch(_){}
      gateRoot.__ccAdvQuickOneShotAddV1 = null;
      gateRoot.__ccAdvExplicitAddSig = "";
      gateRoot.__ccAdvExplicitAddUntil = 0;
      gateRoot.__ccAdvExplicitAddUsedSig = "";
      gateRoot.__ccAdvExplicitAddUsedUntil = 0;
      gateRoot.__ccAdvSelectChangingUntil = 0;
    }catch(_){}

    try{
      var mirrorRoot = window;
      try{ if (window.top) mirrorRoot = window.top; }catch(_){}
      // Explicit one-click nonce for stable advanced add.
      var nonce = "stable-" + String(now) + "-" + String(Math.random()).slice(2);
      mirrorRoot.__ccStableAddNonceV1 = nonce;
      mirrorRoot.__ccStableAddNonceUntilV1 = now + 3200;
      mirrorRoot.__ccStableAddNonceConsumedV1 = false;
      window.__ccStableAddNonceV1 = nonce;
      window.__ccStableAddNonceUntilV1 = now + 3200;
      window.__ccStableAddNonceConsumedV1 = false;

      // Ensure first explicit add exits imported-lock mode immediately.
      mirrorRoot.__LOCK_IMPORTED_OUTPUT = false;
      window.__LOCK_IMPORTED_OUTPUT = false;
      mirrorRoot.__ccSkipCategoryMirrorOnceV1 = true;
      mirrorRoot.__ccAllowDuplicatePartsNextAdd = false;
      // Let advanced stable add return fast; schedule heavy regeneration after click.
      mirrorRoot.__ccSkipAutoGenerateOnceV1 = true;
      mirrorRoot.__ccStableFastAddOnceV1 = true;
      window.__ccSkipCategoryMirrorOnceV1 = true;
      window.__ccAllowDuplicatePartsNextAdd = false;
      window.__ccSkipAutoGenerateOnceV1 = true;
      window.__ccStableFastAddOnceV1 = true;
    }catch(_){}
    try{
      var countRoot = window;
      try{ if (window.top) countRoot = window.top; }catch(_){}
      if (!stableClickSig) stableClickSig = stableSig(token);
      for (var ci = 0; ci < stableKeys.length; ci++){
        var ck = stableKeys[ci];
        stablePreCounts[ck] = countSigInArrayKey(countRoot, ck, stableClickSig);
      }
      stablePreMirrorCounts.importedTail = countSigInRawArray(countRoot.__IMPORTED_TAIL_TOKENS, stableClickSig, "");
      stablePreMirrorCounts.originalOrder = countSigInRawArray(countRoot.originalPartsOrder, stableClickSig, "code");
      stablePreMirrorCounts.importedRaw = countSigInRawArray(countRoot.__IMPORTED_PARTS_ORDER_RAW, stableClickSig, "code");
      try{
        var snap = countRoot.__ccStablePreSelectSnapshotV1 || window.__ccStablePreSelectSnapshotV1 || null;
        var snapTs = Number(snap && snap.ts || 0);
        var snapSig = q(snap && snap.sig || "");
        if (snap && snapTs > 0 && (now - snapTs) < 15000 && stableSigMatches(snapSig, stableClickSig)){
          var sc = snap.counts || {};
          for (var si = 0; si < stableKeys.length; si++){
            var sk = stableKeys[si];
            var sv = Number(sc[sk]);
            if (Number.isFinite(sv) && sv >= 0){
              stablePreCounts[sk] = Math.min(Math.max(0, Number(stablePreCounts[sk]) || 0), sv);
            }
          }
          var sm = snap.mirrors || {};
          var st = Number(sm.importedTail);
          var so = Number(sm.originalOrder);
          var sr = Number(sm.importedRaw);
          if (Number.isFinite(st) && st >= 0) stablePreMirrorCounts.importedTail = Math.min(Math.max(0, Number(stablePreMirrorCounts.importedTail) || 0), st);
          if (Number.isFinite(so) && so >= 0) stablePreMirrorCounts.originalOrder = Math.min(Math.max(0, Number(stablePreMirrorCounts.originalOrder) || 0), so);
          if (Number.isFinite(sr) && sr >= 0) stablePreMirrorCounts.importedRaw = Math.min(Math.max(0, Number(stablePreMirrorCounts.importedRaw) || 0), sr);
        }
      }catch(_){}
    }catch(_){}

    try{
      if (typeof window.addCodeToSelectedData === "function"){
        window.addCodeToSelectedData(token, 1, domainCategory(dom && dom.value));
      } else if (typeof window.addViaNormalGunSelect === "function"){
        window.addViaNormalGunSelect(token);
      } else {
        return false;
      }
    }catch(_){
      return false;
    }
    try{
      var enforceRoot = window;
      try{ if (window.top) enforceRoot = window.top; }catch(_){}
      if (!stableClickSig) stableClickSig = stableSig(token);
      var trimOnce = function(){
        try{
          var changedAny = false;
          for (var ti = 0; ti < stableKeys.length; ti++){
            var tk = stableKeys[ti];
            var keepMax = Math.max(0, Number(stablePreCounts[tk]) || 0) + 1;
            if (trimSigInArrayKey(enforceRoot, tk, stableClickSig, keepMax)) changedAny = true;
          }
          try{
            var keepTail = Math.max(0, Number(stablePreMirrorCounts.importedTail) || 0) + 1;
            var keepOrig = Math.max(0, Number(stablePreMirrorCounts.originalOrder) || 0) + 1;
            var keepRaw = Math.max(0, Number(stablePreMirrorCounts.importedRaw) || 0) + 1;
            if (trimSigInRootArray(enforceRoot, "__IMPORTED_TAIL_TOKENS", stableClickSig, keepTail, "")) changedAny = true;
            if (trimSigInRootArray(enforceRoot, "originalPartsOrder", stableClickSig, keepOrig, "code")) changedAny = true;
            if (trimSigInRootArray(enforceRoot, "__IMPORTED_PARTS_ORDER_RAW", stableClickSig, keepRaw, "code")) changedAny = true;
            try{
              if (window !== enforceRoot){
                if (Array.isArray(enforceRoot.__IMPORTED_TAIL_TOKENS)) window.__IMPORTED_TAIL_TOKENS = enforceRoot.__IMPORTED_TAIL_TOKENS.slice();
                if (Array.isArray(enforceRoot.originalPartsOrder)) window.originalPartsOrder = enforceRoot.originalPartsOrder.slice();
                if (Array.isArray(enforceRoot.__IMPORTED_PARTS_ORDER_RAW)) window.__IMPORTED_PARTS_ORDER_RAW = enforceRoot.__IMPORTED_PARTS_ORDER_RAW.slice();
              }
            }catch(_){}
          }catch(_){}
          if (!changedAny) return;
          try{ if (typeof enforceRoot.updatePartsList === "function") enforceRoot.updatePartsList(); }catch(_){}
          try{
            if (typeof enforceRoot.updateOutputCode === "function") enforceRoot.updateOutputCode();
            else if (typeof enforceRoot.generateItem === "function") enforceRoot.generateItem();
            else if (typeof enforceRoot.updateCodePreview === "function") enforceRoot.updateCodePreview();
          }catch(_){}
        }catch(_){}
      };
      setTimeout(trimOnce, 0);
      setTimeout(trimOnce, 90);
      setTimeout(trimOnce, 260);
      setTimeout(trimOnce, 900);
    }catch(_){}

    try{
      var postRoot = window;
      try{ if (window.top) postRoot = window.top; }catch(_){}
      if (postRoot.__ccStableAdvPostAddTimerV1) clearTimeout(postRoot.__ccStableAdvPostAddTimerV1);
      postRoot.__ccStableAdvPostAddTimerV1 = setTimeout(function(){
        try{
          if (typeof postRoot.updateOutputCode === "function") postRoot.updateOutputCode();
          else if (typeof postRoot.generateItem === "function") postRoot.generateItem();
          else if (typeof postRoot.syncFloatingOutput === "function") postRoot.syncFloatingOutput(true);
          else if (typeof window.updateOutputCode === "function") window.updateOutputCode();
          else if (typeof window.generateItem === "function") window.generateItem();
          else if (typeof window.syncFloatingOutput === "function") window.syncFloatingOutput(true);
        }catch(_){}
        try{
          if (typeof postRoot.refreshCoverage === "function") postRoot.refreshCoverage();
          else if (typeof window.refreshCoverage === "function") window.refreshCoverage();
        }catch(_){}
        try{ postRoot.__ccStableAdvPostAddTimerV1 = 0; }catch(_){}
      }, 50);
    }catch(_){}
    return true;
  }

  function wire(){
    var panel = ensurePanel();
    if (!panel || panel.__ccAdvStableWiredV1) return;
    panel.__ccAdvStableWiredV1 = true;

    var dom = panel.querySelector("#ccStablePartDomain");
    var query = panel.querySelector("#ccStablePartQuery");
    var add = panel.querySelector("#ccStablePartAddBtn");
    var sel = panel.querySelector("#ccStablePartResults");
    if (!dom || !query || !add || !sel) return;

    function getText(el){
      if (!el) return "";
      return (typeof el.value === "string") ? String(el.value || "") : String(el.textContent || "");
    }
    function setText(el, v){
      if (!el) return;
      if (typeof el.value === "string") el.value = v;
      else el.textContent = v;
    }
    function outputIds(){
      return ["outCode","outC","output-code","output-code-live","output-code-yaml","generatedItemCode","floating-output-code"];
    }
    function readOutputSerial(){
      var ids = outputIds();
      function tailCount(s){
        try{
          var t = String(s || "").trim();
          var di = t.indexOf("||");
          if (di < 0) return 0;
          var lp = t.lastIndexOf("|");
          if (lp < di + 2) lp = t.length;
          var tail = t.slice(di + 2, lp).trim();
          if (!tail) return 0;
          var m = tail.match(/\{[^}]+\}|\"[^\"]+\"|\S+/g);
          return m ? m.length : 0;
        }catch(_){ return 0; }
      }
      var best = "";
      var bestScore = -1;
      function consider(v){
        var s = String(v || "").trim();
        if (!s) return;
        var score = 1;
        var tc = tailCount(s);
        if (tc > 0) score = 3000 + tc;
        else if (s.indexOf("||") >= 0) score = 2000 + Math.min(999, s.length);
        else score = 1000 + Math.min(999, s.length);
        if (score > bestScore){
          bestScore = score;
          best = s;
        }
      }
      try{
        var ae = document.activeElement;
        if (ae && ae.id && ids.indexOf(String(ae.id)) !== -1){
          consider(getText(ae));
        }
      }catch(_){}
      for (var i = 0; i < ids.length; i++){
        try{
          var el = document.getElementById(ids[i]);
          if (!el) continue;
          consider(getText(el));
        }catch(_){}
      }
      if (best) return best;
      return "";
    }
    function writeOutputSerial(serial){
      var ids = outputIds();
      for (var i = 0; i < ids.length; i++){
        try{
          var el = document.getElementById(ids[i]);
          if (!el) continue;
          setText(el, serial);
        }catch(_){}
      }
    }
    function holdOutputDuringSelect(ms){
      try{
        var root = window;
        try{ if (window.top) root = window.top; }catch(_){}
        var cur = readOutputSerial();
        if (!cur || cur.indexOf("||") < 0) return;
        function tailTokenCount(serial){
          try{
            var s = String(serial || "").trim();
            var di = s.indexOf("||");
            if (di < 0) return 0;
            var lp = s.lastIndexOf("|");
            if (lp < di + 2) lp = s.length;
            var tail = s.slice(di + 2, lp).trim();
            if (!tail) return 0;
            var m = tail.match(/\{[^}]+\}|\"[^\"]+\"|\S+/g);
            return m ? m.length : 0;
          }catch(_){
            return 0;
          }
        }
        var hold = {
          serial: cur,
          tailCount: tailTokenCount(cur),
          until: Date.now() + Math.max(800, Number(ms) || 0) + 450
        };
        root.__ccStableOutputHoldV1 = hold;
        window.__ccStableOutputHoldV1 = hold;
        var guard = function(){
          try{
            var h = root.__ccStableOutputHoldV1 || window.__ccStableOutputHoldV1;
            if (!h || !h.serial) return;
            if (Date.now() > Number(h.until || 0)){
              try{ root.__ccStableOutputHoldV1 = null; }catch(_){}
              try{ window.__ccStableOutputHoldV1 = null; }catch(_){}
              return;
            }
            var nowSerial = readOutputSerial();
            if (nowSerial && nowSerial.indexOf("||") < 0 && String(h.serial).indexOf("||") >= 0){
              writeOutputSerial(String(h.serial));
            } else if (nowSerial && String(h.serial).indexOf("||") >= 0){
              var nowCount = tailTokenCount(nowSerial);
              var holdCount = Number(h.tailCount || 0);
              // While browsing search results, never let a preview refresh shrink/drop the visible tail.
              if (holdCount > 0 && nowCount < holdCount){
                writeOutputSerial(String(h.serial));
              }
            }
            setTimeout(guard, 80);
          }catch(_){}
        };
        guard();
      }catch(_){}
    }
    function clearOutputHold(){
      try{
        var root = window;
        try{ if (window.top) root = window.top; }catch(_){}
        root.__ccStableOutputHoldV1 = null;
        window.__ccStableOutputHoldV1 = null;
      }catch(_){}
    }
    function installGlobalAdvQuickOutputHold(){
      try{
        var root = window;
        try{ if (window.top) root = window.top; }catch(_){}
        if (root.__ccGlobalAdvQuickOutputHoldWiredV1) return;
        root.__ccGlobalAdvQuickOutputHoldWiredV1 = true;

        function isWatchSelect(el){
          try{
            if (!el || String(el.tagName || "").toUpperCase() !== "SELECT") return false;
            var id = String(el.id || "").toLowerCase();
            return id === "ccstablepartresults" || id === "ccadvresults" || id === "ccquickpartresults";
          }catch(_){}
          return false;
        }
        function hasWatchSelectAncestor(el){
          try{
            if (!el || !el.closest) return false;
            return !!el.closest("#ccStablePartResults,#ccAdvResults,#ccQuickPartResults");
          }catch(_){}
          return false;
        }
        function isWatchAddButton(el){
          try{
            if (!el || !el.closest) return false;
            return !!el.closest("#ccStablePartAddBtn,#ccAdvAddBtn,#ccQuickAddBtn,#ccQuickPartAddBtn");
          }catch(_){}
          return false;
        }

        document.addEventListener("change", function(e){
          var t = e && e.target;
          if (!isWatchSelect(t)) return;
          holdOutputDuringSelect(900);
        }, true);
        document.addEventListener("input", function(e){
          var t = e && e.target;
          if (!isWatchSelect(t)) return;
          holdOutputDuringSelect(900);
        }, true);
        document.addEventListener("click", function(e){
          var t = e && e.target;
          if (!t) return;
          if (isWatchAddButton(t)){
            clearOutputHold();
            return;
          }
          if (isWatchSelect(t) || hasWatchSelectAncestor(t)){
            holdOutputDuringSelect(760);
          }
        }, true);
      }catch(_){}
    }

    function markStableSelectChanging(ms){
      try{
        var root = window;
        try{ if (window.top) root = window.top; }catch(_){}
        function normalizeStableSig(v){
          var s = String(v || "").trim();
          var m = s.match(/^\{\s*(\d+)\s*:\s*(\d+)\s*[\}\)\]]$/);
          if (m) return "{" + m[1] + ":" + m[2] + "}";
          m = s.match(/^\{\s*(\d+)\s*[\}\)\]]$/);
          if (m) return "{" + m[1] + "}";
          return s.replace(/^"+|"+$/g, "").toLowerCase();
        }
        var selected = "";
        try{
          var opt = sel && sel.options && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null;
          if (opt && sel.selectedIndex >= 1){
            try{
              var sk = stableOptionKey(opt);
              if (sk){
                window.__ccStablePartLastSelKeyV1 = sk;
                window.__ccStablePartLastSelDomainV1 = q(dom && dom.value).toLowerCase();
              }
            }catch(_){}
            selected = normalizeStableSig(optionToken(opt));
          }
        }catch(_){}
        var prevPending = String(root.__ccStablePartPendingSigV1 || "");
        if (selected && selected !== prevPending){
          root.__ccStablePartPrevSigV1 = prevPending || String(root.__ccStablePartPrevSigV1 || "");
          root.__ccStablePartPendingSigV1 = selected;
        }
        try{
          function sigMatchSnap(a, b){
            var sa = normalizeStableSig(a);
            var sb = normalizeStableSig(b);
            if (!sa || !sb) return false;
            if (sa === sb) return true;
            var ma = sa.match(/^\{(\d+):(\d+)\}$/);
            var mb = sb.match(/^\{(\d+):(\d+)\}$/);
            var ba = sa.match(/^\{(\d+)\}$/);
            var bb = sb.match(/^\{(\d+)\}$/);
            if (ma && bb) return ma[2] === bb[1];
            if (mb && ba) return mb[2] === ba[1];
            return false;
          }
          function countInArr(arr, codeField, want){
            if (!Array.isArray(arr) || !arr.length || !want) return 0;
            var n = 0;
            for (var i = 0; i < arr.length; i++){
              var it = arr[i];
              var raw = "";
              if (codeField) raw = String(it && it[codeField] != null ? it[codeField] : (it && it.code != null ? it.code : it));
              else raw = String(it && it.code != null ? it.code : it);
              if (sigMatchSnap(raw, want)) n++;
            }
            return n;
          }
          if (selected){
            var sdSnap = (root && root.selectedData) || window.selectedData || {};
            var keysSnap = [
              "partsOrder","normalParts","legendaryParts","maliwanElementParts",
              "gunParts","shieldParts","grenadeParts","repkitParts",
              "enhancementParts","artifactParts","heavyParts","classmodParts",
              "classmodPerks","classmodFirmwarePerks","skinParts","elementParts"
            ];
            var countsSnap = Object.create(null);
            for (var si = 0; si < keysSnap.length; si++){
              var k = keysSnap[si];
              countsSnap[k] = countInArr(sdSnap[k], "", selected);
            }
            var mirrorsSnap = {
              importedTail: countInArr(root.__IMPORTED_TAIL_TOKENS, "", selected),
              originalOrder: countInArr(root.originalPartsOrder, "code", selected),
              importedRaw: countInArr(root.__IMPORTED_PARTS_ORDER_RAW, "code", selected)
            };
            var snapObj = { sig: selected, ts: Date.now(), counts: countsSnap, mirrors: mirrorsSnap };
            root.__ccStablePreSelectSnapshotV1 = snapObj;
            window.__ccStablePreSelectSnapshotV1 = snapObj;
          }
        }catch(_){}
        // Keep gate short-lived; long stale gates can block unrelated dropdown adds.
        root.__ccStablePartSelectGateUntilV1 = Date.now() + Math.max(900, Number(ms) || 0);
        // Selecting from stable results requires an explicit Add click before insertion.
        root.__ccStablePartExplicitSigV1 = "";
        root.__ccStablePartExplicitAltSigV1 = "";
        root.__ccStablePartExplicitUntilV1 = 0;
        root.__ccStablePartExplicitUsedV1 = false;
        root.__ccInSelectChange = true;
        window.__ccInSelectChange = true;
        holdOutputDuringSelect(ms);
        if (root.__ccAdvStableSelectChangeTimerV1) clearTimeout(root.__ccAdvStableSelectChangeTimerV1);
        root.__ccAdvStableSelectChangeTimerV1 = setTimeout(function(){
          try{ root.__ccInSelectChange = false; }catch(_){}
          try{ window.__ccInSelectChange = false; }catch(_){}
          try{ clearOutputHold(); }catch(_){}
          root.__ccAdvStableSelectChangeTimerV1 = 0;
        }, Number(ms) || 0);
      }catch(_){}
    }
    installGlobalAdvQuickOutputHold();

    dom.addEventListener("change", function(){
      try{ window.__ccStablePartRenderStateV1 = null; }catch(_){ }
      render();
    }, true);
    var manuFilter = panel.querySelector("#ccStablePartManuFilter");
    var typeFilter = panel.querySelector("#ccStablePartTypeFilter");
    if (manuFilter) manuFilter.addEventListener("change", function(){ try{ window.__ccStablePartRenderStateV1 = null; }catch(_){ } render(); }, true);
    if (typeFilter) typeFilter.addEventListener("change", function(){ try{ window.__ccStablePartRenderStateV1 = null; }catch(_){ } render(); }, true);
    query.addEventListener("input", function(){
      try{ window.__ccStablePartRenderStateV1 = null; }catch(_){ }
      scheduleRender(80);
    }, true);
    sel.addEventListener("change", function(){
      markStableSelectChanging(550);
      try{
        var p = ensurePanel();
        if (!p) return;
        refreshStableMeta(p.querySelector("#ccStablePartResults"), p.querySelector("#ccStablePartMeta"));
      }catch(_){}
    }, true);
    sel.addEventListener("input", function(){ markStableSelectChanging(550); }, true);
    add.addEventListener("click", function(e){
      try{
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      }catch(_){}
      try{
        var root = window;
        try{ if (window.top) root = window.top; }catch(_){}
        root.__ccInSelectChange = false;
        window.__ccInSelectChange = false;
        root.__ccStablePartSelectGateUntilV1 = 0;
        root.__ccStablePartPendingSigV1 = "";
        root.__ccStablePartPrevSigV1 = "";
        root.__ccStablePartExplicitSigV1 = "";
        root.__ccStablePartExplicitAltSigV1 = "";
        root.__ccStablePartExplicitUntilV1 = 0;
        root.__ccStablePartExplicitUsedV1 = false;
        if (window !== root){
          window.__ccStablePartSelectGateUntilV1 = 0;
          window.__ccStablePartPendingSigV1 = "";
          window.__ccStablePartPrevSigV1 = "";
          window.__ccStablePartExplicitSigV1 = "";
          window.__ccStablePartExplicitAltSigV1 = "";
          window.__ccStablePartExplicitUntilV1 = 0;
          window.__ccStablePartExplicitUsedV1 = false;
        }
        clearOutputHold();
      }catch(_){}
      addSelected();
    }, true);
    sel.addEventListener("dblclick", function(e){
      try{
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      }catch(_){}
      try{ clearOutputHold(); }catch(_){}
      addSelected();
    }, true);
  }

  function install(){
    hideLegacyPanels();
    ensurePanel();
    wire();
    render();
  }

  try{ window.__ccStablePartInstallV1 = install; }catch(_){ }
  try{ window.__ccEnsureCodeIdMap = buildCodeIdMap; }catch(_){ }

  try{
    window.__exportPartIdsNotInStx = function(){
      /* Dev: run in the main toolbox console; downloads part-ids-not-in-stx.json to prioritize PART_REF_META / STX_DATASET gaps. */
      buildCodeIdMap();
      var stx = getStxIdRawSet();
      var poolIds = Object.create(null);
      var pools = allParts();
      for (var i = 0; i < pools.length; i++){
        var p = pools[i];
        if (!p) continue;
        var code = q(p && (p.code || p.spawnCode || p.importCode || p.raw || p.value || p.name));
        if (!code) continue;
        var fi = resolveFamIdForPart(p, code);
        var ir = "";
        if (fi && /^\d+$/.test(q(fi.family)) && /^\d+$/.test(q(fi.id))) ir = q(fi.family) + ":" + q(fi.id);
        else ir = normalizeIdRaw(q(p.idRaw != null ? p.idRaw : p.idraw));
        if (ir) poolIds[ir] = true;
      }
      var missing = [];
      Object.keys(poolIds).forEach(function(k){
        if (!stx[k]) missing.push(k);
      });
      missing.sort(function(a, b){
        var pa = a.split(":");
        var pb = b.split(":");
        var fa = Number(pa[0]) || 0;
        var fb = Number(pb[0]) || 0;
        if (fa !== fb) return fa - fb;
        return (Number(pa[1]) || 0) - (Number(pb[1]) || 0);
      });
      var rows = missing.map(function(id){
        var o = { id: id };
        var rm = window.PART_REF_META && window.PART_REF_META[id];
        if (rm) o.partRefMeta = rm;
        return o;
      });
      var payload = { generated: new Date().toISOString(), count: missing.length, ids: rows };
      try{
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "part-ids-not-in-stx.json";
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(a.href);
        a.remove();
      }catch(_){}
      return payload;
    };
  }catch(_){}

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }

  setTimeout(install, 900);
  window.addEventListener("load", install, { once:true });
})();
