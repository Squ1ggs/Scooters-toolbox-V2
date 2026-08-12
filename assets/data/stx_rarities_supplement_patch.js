(function(){
  'use strict';
  var patch = [
  {
    "manufacturer": "Ripper",
    "itemType": "Heavy Weapon",
    "itemTypeString": "BOR_HW.comp_05_legendary_draupner",
    "familyId": 275,
    "itemId": 38,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Ripper",
    "itemType": "Repkit",
    "itemTypeString": "BOR_REPAIR_KIT.comp_05_legendary_hugger",
    "familyId": 274,
    "itemId": 9,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Ripper",
    "itemType": "Shield",
    "itemTypeString": "BOR_SHIELD.comp_05_legendary_overswarm",
    "familyId": 300,
    "itemId": 14,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Ripper",
    "itemType": "SMG",
    "itemTypeString": "BOR_SM.comp_05_legendary_falke",
    "familyId": 19,
    "itemId": 59,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Ripper",
    "itemType": "Grenade",
    "itemTypeString": "BORG_GRENADE_GADGET.comp_05_legendary_pellet",
    "familyId": 278,
    "itemId": 17,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Siren",
    "itemType": "Class Mod",
    "itemTypeString": "classmod_dark_siren.comp_05_legendary_cowbell",
    "familyId": 254,
    "itemId": 540,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Siren",
    "itemType": "Class Mod",
    "itemTypeString": "classmod_dark_siren.comp_05_legendary_raid2",
    "familyId": 254,
    "itemId": 544,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Siren",
    "itemType": "Class Mod",
    "itemTypeString": "classmod_dark_siren.comp_05_legendary_tuba",
    "familyId": 254,
    "itemId": 546,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Exo Soldier",
    "itemType": "Class Mod",
    "itemTypeString": "classmod_exo_soldier.comp_05_legendary_cowbell",
    "familyId": 256,
    "itemId": 541,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Exo Soldier",
    "itemType": "Class Mod",
    "itemTypeString": "classmod_exo_soldier.comp_05_legendary_raid2",
    "familyId": 256,
    "itemId": 545,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Exo Soldier",
    "itemType": "Class Mod",
    "itemTypeString": "classmod_exo_soldier.comp_05_legendary_tuba",
    "familyId": 256,
    "itemId": 547,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Gravitar",
    "itemType": "Class Mod",
    "itemTypeString": "classmod_gravitar.comp_05_legendary_cowbell",
    "familyId": 259,
    "itemId": 543,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Gravitar",
    "itemType": "Class Mod",
    "itemTypeString": "classmod_gravitar.comp_05_legendary_raid2",
    "familyId": 259,
    "itemId": 547,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Gravitar",
    "itemType": "Class Mod",
    "itemTypeString": "classmod_gravitar.comp_05_legendary_tuba",
    "familyId": 259,
    "itemId": 549,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Paladin",
    "itemType": "Class Mod",
    "itemTypeString": "classmod_paladin.comp_05_legendary_cowbell",
    "familyId": 255,
    "itemId": 541,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Paladin",
    "itemType": "Class Mod",
    "itemTypeString": "classmod_paladin.comp_05_legendary_raid2",
    "familyId": 255,
    "itemId": 545,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Paladin",
    "itemType": "Class Mod",
    "itemTypeString": "classmod_paladin.comp_05_legendary_tuba",
    "familyId": 255,
    "itemId": 547,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Robodealer",
    "itemType": "Class Mod",
    "itemTypeString": "classmod_robodealer.comp_05_legendary_raid2",
    "familyId": 404,
    "itemId": 544,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Robodealer",
    "itemType": "Class Mod",
    "itemTypeString": "classmod_robodealer.comp_05_legendary_tuba",
    "familyId": 404,
    "itemId": 546,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Daedalus",
    "itemType": "Assault Rifle",
    "itemTypeString": "DAD_AR.comp_05_legendary_harddark",
    "familyId": 13,
    "itemId": 87,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Daedalus",
    "itemType": "Shotgun",
    "itemTypeString": "DAD_SG.comp_05_legendary_cannonbrawl",
    "familyId": 8,
    "itemId": 82,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Daedalus",
    "itemType": "Shield",
    "itemTypeString": "DAD_SHIELD.comp_05_legendary_honeybadger",
    "familyId": 312,
    "itemId": 11,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Daedalus",
    "itemType": "SMG",
    "itemTypeString": "DAD_SM.comp_05_legendary_follower",
    "familyId": 20,
    "itemId": 2,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Jakobs",
    "itemType": "Assault Rifle",
    "itemTypeString": "JAK_AR.comp_05_legendary_fishward",
    "familyId": 27,
    "itemId": 83,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Jakobs",
    "itemType": "Grenade",
    "itemTypeString": "JAK_GRENADE_GADGET.comp_05_legendary_bismuth",
    "familyId": 267,
    "itemId": 20,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Jakobs",
    "itemType": "Pistol",
    "itemTypeString": "JAK_PS.comp_05_legendary_shoals",
    "familyId": 3,
    "itemId": 85,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Jakobs",
    "itemType": "Repkit",
    "itemTypeString": "JAK_REPAIR_KIT.comp_05_legendary_vitae",
    "familyId": 265,
    "itemId": 9,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Jakobs",
    "itemType": "Shotgun",
    "itemTypeString": "JAK_SG.comp_06_pearl_constable",
    "familyId": 9,
    "itemId": 101,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Jakobs",
    "itemType": "Sniper Rifle",
    "itemTypeString": "JAK_SR.comp_05_legendary_fearstalker",
    "familyId": 24,
    "itemId": 78,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Maliwan",
    "itemType": "Heavy Weapon",
    "itemTypeString": "MAL_HW.comp_05_legendary_barrel",
    "familyId": 289,
    "itemId": 29,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Maliwan",
    "itemType": "Heavy Weapon",
    "itemTypeString": "MAL_HW.comp_05_legendary_ichor",
    "familyId": 289,
    "itemId": 28,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Maliwan",
    "itemType": "Repkit",
    "itemTypeString": "MAL_REPAIR_KIT.comp_05_legendary_geigerroid",
    "familyId": 266,
    "itemId": 8,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Maliwan",
    "itemType": "Shotgun",
    "itemTypeString": "MAL_SG.comp_05_legendary_discybusiness",
    "familyId": 10,
    "itemId": 81,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Maliwan",
    "itemType": "Shotgun",
    "itemTypeString": "MAL_SG.comp_05_legendary_reminisce",
    "familyId": 10,
    "itemId": 61,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Maliwan",
    "itemType": "SMG",
    "itemTypeString": "MAL_SM.comp_05_legendary_flashcyclone",
    "familyId": 21,
    "itemId": 85,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Maliwan",
    "itemType": "SMG",
    "itemTypeString": "MAL_SM.comp_06_pearl_juliet",
    "familyId": 21,
    "itemId": 90,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Maliwan",
    "itemType": "Sniper Rifle",
    "itemTypeString": "MAL_SR.comp_05_legendary_manifest",
    "familyId": 25,
    "itemId": 87,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Order",
    "itemType": "Pistol",
    "itemTypeString": "ORD_PS.comp_05_legendary_rhythm",
    "familyId": 4,
    "itemId": 87,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Order",
    "itemType": "Pistol",
    "itemTypeString": "ORD_PS.comp_05_legendary_sunspot",
    "familyId": 4,
    "itemId": 83,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Order",
    "itemType": "Repkit",
    "itemTypeString": "ORD_REPAIR_KIT.comp_05_legendary_paleblood",
    "familyId": 285,
    "itemId": 9,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Order",
    "itemType": "Sniper Rifle",
    "itemTypeString": "ORD_SR.comp_05_legendary_ishmael",
    "familyId": 26,
    "itemId": 82,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Order",
    "itemType": "Turret",
    "itemTypeString": "ORD_TURRET_GADGET.comp_05_legendary_anchor",
    "familyId": 326,
    "itemId": 1,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Tediore",
    "itemType": "Grenade",
    "itemTypeString": "TED_GRENADE_GADGET.comp_05_legendary_ordinance",
    "familyId": 311,
    "itemId": 13,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Tediore",
    "itemType": "Shield",
    "itemTypeString": "TED_SHIELD.comp_05_legendary_pocketbuddies",
    "familyId": 287,
    "itemId": 14,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Torgue",
    "itemType": "Heavy Weapon",
    "itemTypeString": "TOR_HW.comp_05_legendary_dahlfather",
    "familyId": 273,
    "itemId": 43,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Torgue",
    "itemType": "Pistol",
    "itemTypeString": "TOR_PS.comp_05_legendary_scootshoot",
    "familyId": 6,
    "itemId": 57,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Torgue",
    "itemType": "Pistol",
    "itemTypeString": "TOR_PS.comp_06_pearl_herald",
    "familyId": 6,
    "itemId": 85,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Torgue",
    "itemType": "Shotgun",
    "itemTypeString": "TOR_SG.comp_05_legendary_cormano",
    "familyId": 12,
    "itemId": 83,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Torgue",
    "itemType": "Shotgun",
    "itemTypeString": "TOR_SG.comp_05_legendary_unstable_kor",
    "familyId": 12,
    "itemId": 77,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Vladof",
    "itemType": "Assault Rifle",
    "itemTypeString": "VLA_AR.comp_05_legendary_lasercutter",
    "familyId": 18,
    "itemId": 103,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Vladof",
    "itemType": "Grenade",
    "itemTypeString": "VLA_GRENADE_GADGET.comp_05_legendary_barb",
    "familyId": 291,
    "itemId": 12,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Vladof",
    "itemType": "SMG",
    "itemTypeString": "VLA_SM.comp_05_legendary_brickhouse",
    "familyId": 22,
    "itemId": 94,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Vladof",
    "itemType": "SMG",
    "itemTypeString": "VLA_SM.comp_06_pearl_locust",
    "familyId": 22,
    "itemId": 101,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Vladof",
    "itemType": "Sniper Rifle",
    "itemTypeString": "VLA_SR.comp_05_legendary_hemorrhage",
    "familyId": 16,
    "itemId": 88,
    "legendaryName": "",
    "source": "STX supplement"
  },
  {
    "manufacturer": "Vladof",
    "itemType": "Sniper Rifle",
    "itemTypeString": "VLA_SR.comp_05_legendary_lightgun",
    "familyId": 16,
    "itemId": 91,
    "legendaryName": "",
    "source": "STX supplement"
  }
];
  if (!Array.isArray(window.STX_RARITIES)) window.STX_RARITIES = [];
  var seen = {};
  for (var i = 0; i < window.STX_RARITIES.length; i++) {
    var r = window.STX_RARITIES[i];
    if (r && Number.isFinite(r.familyId) && Number.isFinite(r.itemId)) seen[r.familyId + ':' + r.itemId] = true;
  }
  for (var j = 0; j < patch.length; j++) {
    var p = patch[j];
    var k = p.familyId + ':' + p.itemId;
    if (seen[k]) continue;
    window.STX_RARITIES.push(p);
    seen[k] = true;
  }
})();
