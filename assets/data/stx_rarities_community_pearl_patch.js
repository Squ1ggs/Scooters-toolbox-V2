(function(){
  'use strict';
  var patch = [
  {
    "manufacturer": "Ripper",
    "itemType": "Sniper Rifle",
    "itemTypeString": "BOR_SR.comp_05_legendary_abyss",
    "familyId": 23,
    "itemId": 61,
    "legendaryName": "Abyss",
    "source": "Community Pearl"
  },
  {
    "manufacturer": "Ripper",
    "itemType": "Shotgun",
    "itemTypeString": "BOR_SG.comp_05_legendary_crazedearl",
    "familyId": 7,
    "itemId": 54,
    "legendaryName": "Crazed Earl",
    "source": "Community Pearl"
  },
  {
    "manufacturer": "Order",
    "itemType": "Assault Rifle",
    "itemTypeString": "ORD_AR.comp_05_legendary_crowsourced",
    "familyId": 15,
    "itemId": 77,
    "legendaryName": "Crow-Sourced",
    "source": "Community Pearl"
  },
  {
    "manufacturer": "Maliwan",
    "itemType": "SMG",
    "itemTypeString": "MAL_SM.comp_06_pearl_juliet",
    "familyId": 21,
    "itemId": 90,
    "legendaryName": "Firestorm",
    "source": "Community Pearl"
  },
  {
    "manufacturer": "Jakobs",
    "itemType": "Assault Rifle",
    "itemTypeString": "JAK_AR.comp_05_legendary_gomie",
    "familyId": 27,
    "itemId": 81,
    "legendaryName": "Gomie",
    "source": "Community Pearl"
  },
  {
    "manufacturer": "Torgue",
    "itemType": "Pistol",
    "itemTypeString": "TOR_PS.comp_06_pearl_herald",
    "familyId": 6,
    "itemId": 85,
    "legendaryName": "Herald",
    "source": "Community Pearl"
  },
  {
    "manufacturer": "Jakobs",
    "itemType": "Shotgun",
    "itemTypeString": "JAK_SG.comp_06_pearl_constable",
    "familyId": 9,
    "itemId": 101,
    "legendaryName": "Looming Constable",
    "source": "Community Pearl"
  },
  {
    "manufacturer": "Vladof",
    "itemType": "SMG",
    "itemTypeString": "VLA_SM.comp_06_pearl_locust",
    "familyId": 22,
    "itemId": 101,
    "legendaryName": "Parasite",
    "source": "Community Pearl"
  },
  {
    "manufacturer": "Daedalus",
    "itemType": "SMG",
    "itemTypeString": "DAD_SM.comp_06_pearl_screwed",
    "familyId": 245,
    "itemId": 249,
    "legendaryName": "Screwstonian",
    "source": "Community Pearl"
  },
  {
    "manufacturer": "Tediore",
    "itemType": "Shotgun",
    "itemTypeString": "TED_SG.comp_06_pearl_sharkbait",
    "familyId": 11,
    "itemId": 90,
    "legendaryName": "Sharkbait",
    "source": "Community Pearl"
  },
  {
    "manufacturer": "Order",
    "itemType": "Sniper Rifle",
    "itemTypeString": "ORD_SR.comp_05_legendary_temper",
    "familyId": 26,
    "itemId": 84,
    "legendaryName": "SolarTemper",
    "source": "Community Pearl"
  },
  {
    "manufacturer": "Daedalus",
    "itemType": "Pistol",
    "itemTypeString": "DAD_PS.comp_05_legendary_soulsurvivor",
    "familyId": 2,
    "itemId": 80,
    "legendaryName": "Soul Survivor",
    "source": "Community Pearl"
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
