(function(){
  'use strict';
  var add = [
  {
    "source": "nexus_coverage_alias",
    "effects": "Radiation Nova",
    "raid2Key": "nexus_alias_repair_kit_part_aug_ele_nova_radiation",
    "category": "Repkit",
    "manufacturer": "",
    "itemType": "Repkit",
    "weaponType": "",
    "partType": "",
    "code": "\"repair_kit.part_aug_ele_nova_radiation\"",
    "name": "Radiation Nova",
    "searchAlias": "Radiation Nova",
    "dataNote": "Alias row for Nexus spawn repair_kit.part_aug_ele_nova_radiation (editor previously used repair_kit.part_aug_ele_nova_radiaion).",
    "stats": "",
    "dropHint": "Drops from Raid Boss 2: Subjugator and Thol the Invincible. Class mods require Silver-tier-or-better UVHM Raid Boss 2 rewards."
  },
  {
    "source": "nexus_coverage_alias",
    "effects": "Hopscotch",
    "raid2Key": "nexus_alias_ted_shield_part_body_hopscotch",
    "category": "Shield",
    "manufacturer": "Tediore",
    "itemType": "Shield",
    "weaponType": "",
    "partType": "Body",
    "code": "\"ted_shield.part_body_hopscotch\"",
    "name": "Hopscotch",
    "searchAlias": "Hopscotch",
    "dataNote": "Alias row for Nexus spawn ted_shield.part_body_hopscotch (editor previously used ted_shield.comp_05_legendary_hopscotch).",
    "stats": "",
    "dropHint": "Drops from Raid Boss 2: Subjugator and Thol the Invincible. Class mods require Silver-tier-or-better UVHM Raid Boss 2 rewards."
  },
  {
    "source": "nexus_coverage_alias",
    "effects": "Camera Drone Comp",
    "raid2Key": "nexus_alias_weapon_orderdrone_comp_camera",
    "category": "Weapon",
    "manufacturer": "",
    "itemType": "Weapon",
    "weaponType": "",
    "partType": "Rarity",
    "code": "\"weapon_orderdrone.comp_camera\"",
    "name": "Camera Drone Comp",
    "searchAlias": "Camera Drone Comp",
    "dataNote": "Alias row for Nexus spawn weapon_orderdrone.comp_camera (editor previously used weapon_orderdrone.part_body_camera).",
    "stats": "",
    "dropHint": "Drops from Raid Boss 2: Subjugator and Thol the Invincible. Class mods require Silver-tier-or-better UVHM Raid Boss 2 rewards."
  },
  {
    "source": "nexus_coverage_alias",
    "effects": "Legendary",
    "raid2Key": "nexus_alias_bor_hw_comp_05_legendary",
    "category": "Heavy Weapon",
    "manufacturer": "Ripper",
    "itemType": "Heavy Weapon",
    "weaponType": "Heavy Weapon",
    "partType": "Rarity",
    "code": "\"bor_hw.comp_05_legendary\"",
    "name": "Legendary",
    "idRaw": "275:30",
    "id": 30,
    "family": 275,
    "searchAlias": "Legendary",
    "dataNote": "Alias row for Nexus spawn bor_hw.comp_05_legendary (editor previously used bor_hw.comp_04_epic).",
    "stats": "",
    "dropHint": "Drops from Raid Boss 2: Subjugator and Thol the Invincible. Class mods require Silver-tier-or-better UVHM Raid Boss 2 rewards."
  },
  {
    "source": "nexus_coverage_alias",
    "effects": "Normal Element",
    "raid2Key": "nexus_alias_grenade_gadget_part_normal",
    "category": "Gadget",
    "manufacturer": "",
    "itemType": "Gadget",
    "weaponType": "",
    "partType": "",
    "code": "\"grenade_gadget.part_normal\"",
    "name": "Normal Element",
    "idRaw": "21",
    "id": 21,
    "searchAlias": "Normal Element",
    "dataNote": "Alias row for Nexus spawn grenade_gadget.part_normal (editor previously used grenade_gadget.part_radiation).",
    "stats": "",
    "dropHint": "Drops from Raid Boss 2: Subjugator and Thol the Invincible. Class mods require Silver-tier-or-better UVHM Raid Boss 2 rewards."
  },
  {
    "source": "nexus_coverage_auto",
    "effects": "Part Barrel 01 Raiden",
    "raid2Key": "nexus_gap_dad_sm_part_barrel_01_raiden",
    "category": "Weapon",
    "manufacturer": "Daedalus",
    "itemType": "SMG",
    "weaponType": "SMG",
    "partType": "Barrel",
    "code": "\"dad_sm.part_barrel_01_raiden\"",
    "name": "Part Barrel 01 Raiden",
    "searchAlias": "Part Barrel 01 Raiden",
    "dataNote": "Auto-filled from Nexus inv deps for coverage (no serialindex in export).",
    "stats": "",
    "dropHint": "Drops from Raid Boss 2: Subjugator and Thol the Invincible. Class mods require Silver-tier-or-better UVHM Raid Boss 2 rewards."
  }
];
  var patches = [
  {
    "raid2Key": "np_screwed_pearl",
    "matchCode": "dad_sm.comp_06_pearl_screwed",
    "name": "Screwstonian",
    "legendaryName": "Screwstonian",
    "effects": "Screwstonian",
    "searchAlias": "Screwstonian Pearl Screwed",
    "itemTypeString": "DAD_SM.comp_06_pearl_screwed",
    "partType": "Rarity",
    "dropHint": "Community-discovered pearlescent (Raid 2).",
    "dataNote": "Pearlescent comp_06_pearl_screwed — idRaw 20:72 from Nexus supplement."
  }
];
  var insertIfMissing = [
  {
    "raid2Key": "np_screwed_pearl",
    "category": "Weapon",
    "manufacturer": "Daedalus",
    "itemType": "SMG",
    "weaponType": "SMG",
    "partType": "Rarity",
    "code": "\"DAD_SM.comp_06_pearl_screwed\"",
    "idRaw": "20:72",
    "id": 72,
    "family": 20,
    "name": "Screwstonian",
    "effects": "Screwstonian",
    "searchAlias": "Screwstonian",
    "source": "verified_pearl_reference"
  },
  {
    "raid2Key": "firmware_active_fire_grenade_gadget",
    "category": "Grenade",
    "manufacturer": "gadgets",
    "itemType": "Grenade",
    "weaponType": "",
    "partType": "Firmware",
    "code": "\"grenade_gadget.part_firmware_active_fire\"",
    "idRaw": "245:249",
    "name": "Active Fire",
    "searchAlias": "Active Fire firmware",
    "source": "verified_raid2_firmware",
    "effects": "Active Fire"
  }
];
  var tries = 0;
  function normCode(c){
    return String(c||'').replace(/^\\"|\\"$/g,'').replace(/^"|"$/g,'').trim().toLowerCase();
  }
  function applyPatch(p, patch){
    if (patch.raid2Key) p.raid2Key = patch.raid2Key;
    if (patch.name) p.name = patch.name;
    if (patch.legendaryName) p.legendaryName = patch.legendaryName;
    if (patch.effects) p.effects = patch.effects;
    if (patch.searchAlias) p.searchAlias = patch.searchAlias;
    if (patch.itemTypeString) p.itemTypeString = patch.itemTypeString;
    if (patch.partType) p.partType = patch.partType;
    if (patch.dropHint) p.dropHint = patch.dropHint;
    if (patch.dataNote) p.dataNote = patch.dataNote;
  }
  function merge(){ try{
    var ds = (window.STX_DATASET && Array.isArray(window.STX_DATASET.ALL_PARTS)) ? window.STX_DATASET.ALL_PARTS : null;
    if (!ds) { if (++tries < 80) setTimeout(merge, 25); return; }
    var haveCode = new Set();
    var haveRaid2Key = new Set();
    for (var i=0;i<ds.length;i++){
      var p = ds[i]; var c = normCode(p && p.code);
      if (c) haveCode.add(c);
      if (p && p.raid2Key) haveRaid2Key.add(String(p.raid2Key).toLowerCase());
    }
    var addedCount = 0;
    var patchedCount = 0;
    for (var j=0;j<add.length;j++){
      var r = add[j];
      var r2 = r && r.raid2Key ? String(r.raid2Key).toLowerCase() : '';
      if (r2 && haveRaid2Key.has(r2)) continue;
      var rc = normCode(r && r.code);
      if (!r2 && rc && haveCode.has(rc)) continue;
      ds.push(r); addedCount++; haveCode.add(rc); if (r2) haveRaid2Key.add(r2);
    }
    for (var ins=0; ins<insertIfMissing.length; ins++){
      var row = insertIfMissing[ins];
      var rc2 = normCode(row && row.code);
      var r2b = row && row.raid2Key ? String(row.raid2Key).toLowerCase() : '';
      if (!rc2) continue;
      if (haveCode.has(rc2) || (r2b && haveRaid2Key.has(r2b))) continue;
      ds.push(row); addedCount++; haveCode.add(rc2); if (r2b) haveRaid2Key.add(r2b);
    }
    for (var pi=0; pi<patches.length; pi++){
      var patch = patches[pi];
      var want = normCode(patch && patch.matchCode);
      if (!want) continue;
      for (var k=0;k<ds.length;k++){
        if (normCode(ds[k] && ds[k].code) !== want) continue;
        applyPatch(ds[k], patch);
        patchedCount++;
        break;
      }
    }
    if (addedCount || patchedCount){
      try{ window.GUN_PARTS = window.GRENADE_PARTS = window.SHIELD_PARTS = window.REPKIT_PARTS = window.ENHANCEMENT_PARTS = window.HEAVY_PARTS = window.CLASSMOD_PARTS = undefined; }catch(_e){}
      try{ if (typeof window.ensurePartPools === 'function') window.ensurePartPools(); }catch(_e){}
      try{ window.__ccStablePartRenderStateV1 = null; }catch(_e){}
      try{ if (typeof window.refreshPartSections === 'function') window.refreshPartSections(); }catch(_e){}
    }
  }catch(_e){} }
  merge();
})();
