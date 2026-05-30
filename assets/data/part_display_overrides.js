(function(){
  'use strict';
  /** Intentionally empty — do not rename existing parts to DLC display names. */
  var MAP = {};
  function normSpawn(code){
    return String(code||'').replace(/^\\"|\\"$/g,'').replace(/^"|"$/g,'').trim().toLowerCase();
  }
  function applyPartDisplayOverrides(){
    var ds = window.STX_DATASET && window.STX_DATASET.ALL_PARTS;
    if (!ds || !ds.length) return 0;
    return 0;
  }
  window.__STX_PART_DISPLAY_OVERRIDES = MAP;
  window.applyPartDisplayOverrides = applyPartDisplayOverrides;
})();
