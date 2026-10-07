/**
 * Conglomerate (DAD_SM) named barrels missing from main stx_dataset.js / current Nexus inv deps.
 * Serial indices match bl4_manifest / ncs_parts (family 20).
 */
(function () {
  'use strict';
  var add = [
    {
      category: 'Weapon',
      manufacturer: 'Daedalus',
      itemType: 'SMG',
      weaponType: 'SMG',
      partType: 'Barrel',
      code: '"DAD_SM.part_barrel_02_conglomerate"',
      name: 'Conglomerate',
      legendaryName: 'Conglomerate',
      idRaw: '20:2',
      id: 2,
      family: 20,
      source: 'conglomerate_barrel_patch'
    },
    {
      category: 'Weapon',
      manufacturer: 'Daedalus',
      itemType: 'SMG',
      weaponType: 'SMG',
      partType: 'Barrel',
      code: '"DAD_SM.part_barrel_licensed_conglomerate"',
      name: 'Conglomerate (Licensed)',
      legendaryName: 'Conglomerate',
      idRaw: '20:1',
      id: 1,
      family: 20,
      source: 'conglomerate_barrel_patch'
    }
  ];
  var tries = 0;
  function merge() {
    try {
      var ds =
        window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS)
          ? window.STX_DATASET.ALL_PARTS
          : null;
      if (!ds) {
        if (++tries < 80) setTimeout(merge, 25);
        return;
      }
      var have = new Set();
      for (var i = 0; i < ds.length; i++) {
        var c = ds[i] && ds[i].code ? String(ds[i].code) : '';
        c = c.replace(/^"+|"+$/g, '').trim().toLowerCase();
        if (c) have.add(c);
      }
      var n = 0;
      for (var j = 0; j < add.length; j++) {
        var r = add[j];
        var rc = r && r.code ? String(r.code).replace(/^"+|"+$/g, '').trim().toLowerCase() : '';
        if (!rc || have.has(rc)) continue;
        ds.push(r);
        have.add(rc);
        n++;
      }
      if (n) {
        try {
          if (typeof window.stxInvalidateSimpleBuilderPartCaches === 'function') {
            window.stxInvalidateSimpleBuilderPartCaches();
          }
        } catch (_e) {}
        try {
          window.dispatchEvent(new CustomEvent('stx:dataset-growth'));
        } catch (_e2) {}
      }
    } catch (_e3) {}
  }
  merge();
})();
