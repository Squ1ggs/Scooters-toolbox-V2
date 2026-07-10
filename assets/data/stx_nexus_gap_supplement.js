(function(){
  'use strict';
  var add = [
  {
    "category": "Weapon",
    "manufacturer": "",
    "itemType": "Weapon",
    "weaponType": "",
    "partType": "Rarity",
    "code": "\"weapon_soldier_sprayer.comp_soldier_sprayer_0\"",
    "name": "Comp Soldier Sprayer 0",
    "source": "export_spawn_catalog",
    "dataNote": "From inv deps (full export catalog).",
    "scanSources": [
      "inv_deps"
    ]
  }
  ];
  function merge(){
    try{
      var ds = (window.STX_DATASET = window.STX_DATASET || []);
      var have = new Set();
      for (var i=0;i<ds.length;i++){
        var p = ds[i];
        var c = p && p.code ? String(p.code) : '';
        c = c.replace(/^\\"|\\"$/g,'').replace(/^"|"$/g,'').trim().toLowerCase();
        if (c) have.add(c);
      }
      for (var j=0;j<add.length;j++){
        var r = add[j];
        var rc = r && r.code ? String(r.code) : '';
        rc = rc.replace(/^\\"|\\"$/g,'').replace(/^"|"$/g,'').trim().toLowerCase();
        if (!rc || have.has(rc)) continue;
        ds.push(r);
        have.add(rc);
      }
    }catch(_e){}
  }
  merge();
})();
