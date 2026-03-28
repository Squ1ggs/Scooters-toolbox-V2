
(function(){
  "use strict";
  if (window.__ccItemTypeTailHardResetV1) return;
  window.__ccItemTypeTailHardResetV1 = true;

  function q(v){ return String(v == null ? "" : v).trim(); }
  function byIdIn(doc, id){
    try{ return doc ? doc.getElementById(id) : null; }catch(_){ return null; }
  }
  function getText(el){
    try{
      if (!el) return "";
      return (typeof el.value === "string") ? String(el.value || "") : String(el.textContent || "");
    }catch(_){ return ""; }
  }
  function setText(el, v){
    try{
      if (!el) return;
      if (typeof el.value === "string") el.value = v;
      else el.textContent = v;
    }catch(_){}
  }
  function stripToHead(serial){
    var s = q(serial);
    var di = s.indexOf("||");
    if (di < 0) return s;
    return s.slice(0, di + 2).replace(/\s+$/g, "");
  }
  function getRoots(){
    var roots = [window];
    try{
      if (window.top && window.top !== window) roots.push(window.top);
    }catch(_){}
    return roots;
  }
  function eachRoot(fn){
    var roots = getRoots();
    for (var i = 0; i < roots.length; i++){
      try{ fn(roots[i]); }catch(_){}
    }
  }

  var OUT_IDS = ["outCode","outC","output-code","output-code-live","output-code-yaml","generatedItemCode","floating-output-code"];
  var RESET_SELECT_IDS = [
    "ccRarityIdSelect","ccBodySelect","ccBodyAccessorySelect","ccBarrelSelect","ccBarrelAccessorySelect",
    "ccMagazineSelect","ccScopeSelect","ccScopeAccessorySelect","ccGripSelect","ccForegripSelect",
    "ccUnderbarrelSelect","ccLicensedManufacturerSelect","ccStatModSelect","ccElementPartSelect","ccElementModSelect",
    "gbGunBody","gbGunBodyAcc","gbGunBarrel","gbGunBarrelAcc","gbGunMagazine","gbGunScope",
    "gbGunScopeAcc","gbGunGrip","gbGunForegrip","gbGunUnderbarrel","gbGunLicensed"
  ];

  function clearOutputsToHeadInDoc(doc){
    if (!doc) return;
    for (var i = 0; i < OUT_IDS.length; i++){
      var el = byIdIn(doc, OUT_IDS[i]);
      if (!el) continue;
      var cur = getText(el);
      if (!cur) continue;
      var next = stripToHead(cur);
      if (next !== cur) setText(el, next);
    }
  }
  function clearOutputsToHead(){
    eachRoot(function(root){
      var doc = null;
      try{ doc = root.document; }catch(_){}
      clearOutputsToHeadInDoc(doc);
    });
  }
  function clearSelectInDoc(doc, id){
    var sel = byIdIn(doc, id);
    if (!sel || String(sel.tagName || "").toUpperCase() !== "SELECT") return;
    try{ sel.value = ""; }catch(_){}
    try{ if (sel.options && sel.options.length) sel.selectedIndex = 0; }catch(_){}
  }
  function clearGuidedSelectsInDoc(doc){
    if (!doc) return;
    for (var i = 0; i < RESET_SELECT_IDS.length; i++) clearSelectInDoc(doc, RESET_SELECT_IDS[i]);
  }
  function clearGuidedSelects(){
    eachRoot(function(root){
      var doc = null;
      try{ doc = root.document; }catch(_){}
      clearGuidedSelectsInDoc(doc);
    });
  }
  function clearSelectedState(){
    eachRoot(function(root){
      try{
        var sd = root.selectedData || (root.selectedData = {});
        var arrKeys = [
          "partsOrder","normalParts","legendaryParts","maliwanElementParts","elementParts","selectedParts","parts","extras",
          "gunParts","shieldParts","grenadeParts","repkitParts","enhancementParts","artifactParts","heavyParts","classmodParts",
          "classmodPerks","classmodFirmwarePerks","skinParts","weaponParts","importedParts","imported_parts","originalPartsOrder"
        ];
        for (var i = 0; i < arrKeys.length; i++){
          var k = arrKeys[i];
          try{
            if (Array.isArray(sd[k])) sd[k].length = 0;
            else if (sd[k] != null) sd[k] = [];
          }catch(_){}
        }
      }catch(_){}
      try{ if (Array.isArray(root.selectedParts)) root.selectedParts.length = 0; }catch(_){}
    });
  }
  function clearTailCaches(){
    eachRoot(function(root){
      try{ root.__ccLastGoodOutputWithTailV1 = ""; }catch(_){}
      try{
        var st = root.__ccSearchFreezeStateV2;
        if (st && typeof st === "object"){
          st.serial = "";
          st.until = 0;
          st.allowUntil = 0;
          st.ticking = false;
        }
      }catch(_){}
      try{
        root.__ccStablePartSelectGateUntilV1 = 0;
        root.__ccStablePartPendingSigV1 = "";
        root.__ccStablePartPrevSigV1 = "";
        root.__ccStablePartExplicitSigV1 = "";
        root.__ccStablePartExplicitAltSigV1 = "";
        root.__ccStablePartExplicitUntilV1 = 0;
        root.__ccStablePartExplicitUsedV1 = false;
        root.__ccAdvStableExpectedSigV1 = "";
        root.__ccAdvStableExpectedUntilV1 = 0;
      }catch(_){}
    });
  }
  var rehydrateUnlockTimer = 0;
  function blockPartsOrderRehydrate(ms){
    var holdMs = Math.max(200, parseInt(ms, 10) || 1200);
    eachRoot(function(root){
      try{ root.__CC_DISABLE_PARTSORDER_REHYDRATE = true; }catch(_){}
    });
    try{ if (rehydrateUnlockTimer) clearTimeout(rehydrateUnlockTimer); }catch(_){}
    rehydrateUnlockTimer = setTimeout(function(){
      rehydrateUnlockTimer = 0;
      eachRoot(function(root){
        try{ root.__CC_DISABLE_PARTSORDER_REHYDRATE = false; }catch(_){}
      });
    }, holdMs);
  }
  function clearGuidedMirrors(){
    eachRoot(function(root){
      try{
        if (typeof root.__ccSetGuidedStackActive === "function") root.__ccSetGuidedStackActive(false);
        else root.__ccGuidedStackActive = false;
      }catch(_){}
      try{ root.__ccGuidedStackActive = false; }catch(_){}
      try{ root.__ccGuidedStackTokens = []; }catch(_){}
      try{ root.__ccGuidedLastTokenBySelect = Object.create(null); }catch(_){}
      try{ root.__ccGuidedLastTokenByButton = Object.create(null); }catch(_){}
      try{
        var doc = null;
        try{ doc = root.document; }catch(_){}
        if (doc){
          for (var i = 0; i < RESET_SELECT_IDS.length; i++){
            var sel = byIdIn(doc, RESET_SELECT_IDS[i]);
            if (sel) sel.__ccLastGuidedToken = "";
          }
        }
      }catch(_){}
      try{ root.__LOCK_IMPORTED_OUTPUT = false; }catch(_){}
      try{ root.__IMPORTED_TAIL_TOKENS = []; }catch(_){}
      try{ root.originalPartsOrder = []; }catch(_){}
      try{ root.__IMPORTED_PARTS_ORDER_RAW = []; }catch(_){}
      try{ root.__IMPORTED_HEADER_FULL = ""; }catch(_){}
      try{ root.__LAST_IMPORTED_DESERIALIZED = ""; }catch(_){}
      try{ root.__LAST_IMPORTED_SERIAL = ""; }catch(_){}
      try{ root.__LAST_IMPORTED_TEXT = ""; }catch(_){}
    });
  }
  function refresh(){
    var fns = ["updatePartsList","refreshGuidedDropdowns","updateCodePreview","updateOutputCode","syncFloatingOutput","renderCore","updateGeneratedCodeSections","updateSelectedDataOutput"];
    eachRoot(function(root){
      for (var i = 0; i < fns.length; i++){
        var fn = root[fns[i]];
        try{ if (typeof fn === "function") fn(); }catch(_){}
      }
    });
  }

  var resetTimer = 0;
  function runReset(){
    resetTimer = 0;
    blockPartsOrderRehydrate(1500);
    clearSelectedState();
    clearTailCaches();
    clearGuidedMirrors();
    clearGuidedSelects();
    clearOutputsToHead();
    refresh();
    try{ setTimeout(clearOutputsToHead, 40); }catch(_){}
    try{ setTimeout(refresh, 90); }catch(_){}
  }
  function scheduleReset(){
    try{ if (resetTimer) clearTimeout(resetTimer); }catch(_){}
    resetTimer = setTimeout(runReset, 0);
  }

  function bindItemTypeInDoc(doc, id){
    var el = byIdIn(doc, id);
    if (!el || el.__ccItemTypeTailHardResetBoundV1) return false;
    el.__ccItemTypeTailHardResetBoundV1 = true;
    el.addEventListener("change", function(){
      scheduleReset();
    }, true);
    return true;
  }
  function bind(){
    eachRoot(function(root){
      var doc = null;
      try{ doc = root.document; }catch(_){}
      if (!doc) return;
      var ids = [
        "itemType","stx_itemType","itemTypeSelect","weaponType",
        "ccWeaponTypeSelect","ccGunTypeSelect",
        "manufacturer","manufacturerSelect","ccManufacturerSelect"
      ];
      for (var i = 0; i < ids.length; i++){
        bindItemTypeInDoc(doc, ids[i]);
      }
    });
  }

  function install(){
    try{
      if (document.readyState === "loading"){
        document.addEventListener("DOMContentLoaded", bind, { once:true });
      } else {
        bind();
      }
    }catch(_){ bind(); }
    try{ setTimeout(bind, 120); }catch(_){}
    try{ setTimeout(bind, 700); }catch(_){}
  }

  install();
})();
