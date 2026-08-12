(function(){
  'use strict';
  var patches = [
  {
    "code": "repair_kit.part_aug_ele_nova_radiation",
    "idRaw": "243:40",
    "id": 40,
    "family": 243
  },
  {
    "code": "ted_shield.part_body_hopscotch",
    "idRaw": "287:12",
    "id": 12,
    "family": 287
  },
  {
    "code": "weapon_orderdrone.comp_badass",
    "idRaw": "389:5",
    "id": 5,
    "family": 389
  },
  {
    "code": "weapon_orderdrone.comp_camera",
    "idRaw": "389:8",
    "id": 8,
    "family": 389
  },
  {
    "code": "weapon_orderdrone.comp_default",
    "idRaw": "389:6",
    "id": 6,
    "family": 389
  },
  {
    "code": "weapon_orderdrone.comp_wideangle",
    "idRaw": "389:2",
    "id": 2,
    "family": 389
  },
  {
    "code": "weapon_orderdrone.comp_zanedrone",
    "idRaw": "389:1",
    "id": 1,
    "family": 389
  },
  {
    "code": "weapon_orderdrone.part_body",
    "idRaw": "389:7",
    "id": 7,
    "family": 389
  },
  {
    "code": "weapon_orderdrone.part_body_badass",
    "idRaw": "389:4",
    "id": 4,
    "family": 389
  },
  {
    "code": "weapon_orderdrone.part_body_camera",
    "idRaw": "389:9",
    "id": 9,
    "family": 389
  },
  {
    "code": "weapon_orderdrone.part_body_wideangle",
    "idRaw": "389:3",
    "id": 3,
    "family": 389
  },
  {
    "code": "weapon_turret_chaingun.comp_turret_chaingun",
    "idRaw": "384:2",
    "id": 2,
    "family": 384
  },
  {
    "code": "weapon_turret_chaingun.part_body",
    "idRaw": "384:1",
    "id": 1,
    "family": 384
  }
];
  function normCode(c){
    return String(c||'').replace(/^\\"|\\"$/g,'').replace(/^"|"$/g,'').trim().toLowerCase();
  }
  function merge(){
    try{
      var ds = (window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS)) ? window.STX_DATASET.ALL_PARTS : null;
      if (!ds) { setTimeout(merge, 25); return; }
      var patched = 0;
      for (var i=0;i<patches.length;i++){
        var patch = patches[i];
        var want = normCode(patch && patch.code);
        if (!want || !patch.idRaw) continue;
        for (var j=0;j<ds.length;j++){
          var p = ds[j];
          if (normCode(p && p.code) !== want) continue;
          if (p.idRaw && /^\d+:\d+$/.test(String(p.idRaw))) break;
          p.idRaw = patch.idRaw;
          if (patch.id != null) p.id = patch.id;
          if (patch.family != null) p.family = patch.family;
          patched++;
          break;
        }
      }
      if (patched){
        try{ window.__ccStablePartRenderStateV1 = null; }catch(_e){}
        try{ if (typeof window.refreshPartSections === 'function') window.refreshPartSections(); }catch(_e){}
      }
    }catch(_e){}
  }
  merge();
})();
