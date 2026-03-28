/*!
 * Skin/camo data for rebuild – SPAWN_SKINS, SKINS (numeric), __CC_EXTRA_NUMERIC_SKINS.
 * Ported from ScootersToolbox.html for standalone rebuild use.
 */
(function () {
  'use strict';

  var SPAWN_SKINS = [
    { value: "Cosmetics_Weapon_Mat01_Synthwave", label: "Solar Flair - Synthwave" },
    { value: "Cosmetics_Weapon_Mat02_LavaRock", label: "The Gun is Lava - Lava Rock" },
    { value: "Cosmetics_Weapon_Mat03_BioGoo", label: "Coast to Coast - Bio Goo" },
    { value: "Cosmetics_Weapon_Mat04_Doodles", label: "Drawn This Way - Doodles" },
    { value: "Cosmetics_Weapon_Mat05_FransFroyo", label: "Fran's Frogurt - FransFroyo" },
    { value: "Cosmetics_Weapon_Mat06_ElectiSamurai", label: "Carcade Shooter - ElectiSamurai" },
    { value: "Cosmetics_Weapon_Mat07_CuteCat", label: "Itty Bitty Kitty Committee - CuteCat" },
    { value: "Cosmetics_Weapon_Mat08_EchoBot", label: "Game Bot - EchoBot" },
    { value: "Cosmetics_Weapon_Mat09_FolkHero", label: "Never Say DIY - FolkHero" },
    { value: "Cosmetics_Weapon_Mat10_Graffiti", label: "Prison Buddy - Graffiti" },
    { value: "Cosmetics_Weapon_Mat11_Cupcake", label: "Sprinked - Cupcake" },
    { value: "Cosmetics_Weapon_Mat12_AnimalPrint", label: "Awoooooo! - AnimalPrint" },
    { value: "Cosmetics_Weapon_Mat13_Whiteout", label: "Gloss - Whiteout" },
    { value: "Cosmetics_Weapon_Mat14_Grunt", label: "Chain of Command - Grunt" },
    { value: "Cosmetics_Weapon_Mat15_Retro", label: "Pixel Perfect - Retro" },
    { value: "Cosmetics_Weapon_Mat16_PolePosition", label: "Bestia Rossa - PolePosition" },
    { value: "Cosmetics_Weapon_Mat17_DeadWood", label: "With the Grain - DeadWood" },
    { value: "Cosmetics_Weapon_Mat18_CrashTest", label: "High Impact - CrashTest" },
    { value: "Cosmetics_Weapon_Mat19_Meltdown", label: "Meltdown - Meltdown" },
    { value: "Cosmetics_Weapon_Mat20_Cyberspace", label: "Halt, Citizen - Cyberspace" },
    { value: "Cosmetics_Weapon_Mat21_Afterburn", label: "Afterparty - Afterburn" },
    { value: "Cosmetics_Weapon_Mat22_Overload", label: "Frenzy Forever - Overload" },
    { value: "Cosmetics_Weapon_Mat23_FutureProof", label: "Future Proof - FutureProof" },
    { value: "Cosmetics_Weapon_Mat24_Propaganda", label: "The System - Propaganda" },
    { value: "Cosmetics_Weapon_Mat25_LocustGas", label: "Devourer - LocustGas" },
    { value: "Cosmetics_Weapon_Mat26_AugerSight", label: "Wellspring-Loaded - AugerSight" },
    { value: "Cosmetics_Weapon_Mat27_GoldenPower", label: "Highrise - GoldenPower" },
    { value: "Cosmetics_Weapon_Mat28_Ripper", label: "Self Excision - Ripper" },
    { value: "Cosmetics_Weapon_Mat29_Cheers", label: "Soused - Cheers" },
    { value: "Cosmetics_Weapon_Mat30_CrimsonRaiders", label: "Bird of Prey - CrimsonRaiders" },
    { value: "Cosmetics_Weapon_Mat31_Splash", label: "Splash Damage - Splash" },
    { value: "Cosmetics_Weapon_Mat32_ImperialGuard", label: "Eternal Defender - ImperialGuard" },
    { value: "Cosmetics_Weapon_Mat33_Creepy", label: "Weirdo - Creepy" },
    { value: "Cosmetics_Weapon_Mat34_MoneyCamo", label: "Smiley - MoneyCamo" },
    { value: "Cosmetics_Weapon_Mat35_GearboxDev", label: "Gearbox Gear - GearboxDev" },
    { value: "Cosmetics_Weapon_Mat36_PreOrder", label: "Broken Order - PreOrder" },
    { value: "Cosmetics_Weapon_Mat37_SHiFT", label: "Hazard Pay - SHiFT" },
    { value: "Cosmetics_Weapon_Mat38_HeadHunter", label: "Firehawk's Fury - HeadHunter" },
    { value: "Cosmetics_Weapon_Mat39_Premium", label: "Sugar Coated - Premium" },
    { value: "Cosmetics_Weapon_Mat40_Halloween", label: "Hex Appeal - Halloween" },
    { value: "Cosmetics_Weapon_Mat41_StarryNight", label: "Silent Fight, Holy Fight - StarryNight" },
    { value: "Cosmetics_Weapon_Mat42_UglyXmasSweater", label: "It's The Thought That Counts - UglyXmasSweater" },
    { value: "Cosmetics_Weapon_Mat43_Snowfall", label: "Baby You're Cold Inside - Snowfall" },
    { value: "Cosmetics_Weapon_Mat44_GiftWrap", label: "So Much More Than A Bag - GiftWrap" },
    { value: "Cosmetics_Weapon_Mat45_Gingerbread", label: "Eat Me - Gingerbread" },
    { value: "Cosmetics_Weapon_Shiny_anarchy", label: "Phosphene - Anarchy" },
    { value: "Cosmetics_Weapon_Shiny_Asher", label: "Phosphene - Asher" },
    { value: "Cosmetics_Weapon_Shiny_ATLien", label: "Phosphene - ATLien" },
    { value: "Cosmetics_Weapon_Shiny_Ballista", label: "Phosphene - Ballista" },
    { value: "Cosmetics_Weapon_Shiny_BeeGun", label: "Phosphene - BeeGun" },
    { value: "Cosmetics_Weapon_Shiny_bloodstarved", label: "Phosphene - Bloodstarved" },
    { value: "Cosmetics_Weapon_Shiny_Bod", label: "Phosphene - Bod" },
    { value: "Cosmetics_Weapon_Shiny_BonnieClyde", label: "Phosphene - BonnieClyde" },
    { value: "Cosmetics_Weapon_Shiny_Boomslang", label: "Phosphene - Boomslang" },
    { value: "Cosmetics_Weapon_Shiny_Breadth", label: "Phosphene - Breadth" },
    { value: "Cosmetics_Weapon_Shiny_Bugbear", label: "Phosphene - Bugbear" },
    { value: "Cosmetics_Weapon_Shiny_Bully", label: "Phosphene - Bully" },
    { value: "Cosmetics_Weapon_Shiny_Chuck", label: "Phosphene - Chuck" },
    { value: "Cosmetics_Weapon_Shiny_ColdShoulder", label: "Phosphene - ColdShoulder" },
    { value: "Cosmetics_Weapon_Shiny_CommBD", label: "Phosphene - CommBD" },
    { value: "Cosmetics_Weapon_Shiny_complex_root", label: "Phosphene - Complex Root" },
    { value: "Cosmetics_Weapon_Shiny_convergence", label: "Phosphene - Convergence" },
    { value: "Cosmetics_Weapon_Shiny_CrowdSourced", label: "Phosphene - CrowdSourced" },
    { value: "Cosmetics_Weapon_Shiny_DividedFocus", label: "Phosphene - DividedFocus" },
    { value: "Cosmetics_Weapon_Shiny_DualDamage", label: "Phosphene - DualDamage" },
    { value: "Cosmetics_Weapon_Shiny_Finnty", label: "Phosphene - Finnty" },
    { value: "Cosmetics_Weapon_Shiny_Fisheye", label: "Phosphene - Fisheye" },
    { value: "Cosmetics_Weapon_Shiny_GMR", label: "Phosphene - GMR" },
    { value: "Cosmetics_Weapon_Shiny_Goalkeeper", label: "Phosphene - Goalkeeper" },
    { value: "Cosmetics_Weapon_Shiny_GoldenGod", label: "Phosphene - GoldenGod" },
    { value: "Cosmetics_Weapon_Shiny_GoreMaster", label: "Phosphene - GoreMaster" },
    { value: "Cosmetics_Weapon_Shiny_HeartGun", label: "Phosphene - HeartGun" },
    { value: "Cosmetics_Weapon_Shiny_HeavyTurret", label: "Phosphene - HeavyTurret" },
    { value: "Cosmetics_Weapon_Shiny_hellfire", label: "Phosphene - Hellfire" },
    { value: "Cosmetics_Weapon_Shiny_Hellwalker", label: "Phosphene - Hellwalker" },
    { value: "Cosmetics_Weapon_Shiny_Inscriber", label: "Phosphene - Inscriber" },
    { value: "Cosmetics_Weapon_Shiny_Kaleidosplode", label: "Phosphene - Kaleidosplode" },
    { value: "Cosmetics_Weapon_Shiny_KaoSon", label: "Phosphene - KaoSon" },
    { value: "Cosmetics_Weapon_Shiny_katagawa", label: "Phosphene - Katagawa" },
    { value: "Cosmetics_Weapon_Shiny_Kickballer", label: "Phosphene - Kickballer" },
    { value: "Cosmetics_Weapon_Shiny_KingsGambit", label: "Phosphene - KingsGambit" },
    { value: "Cosmetics_Weapon_Shiny_LeadBalloon", label: "Phosphene - LeadBalloon" },
    { value: "Cosmetics_Weapon_Shiny_Linebacker", label: "Phosphene - Linebacker" },
    { value: "Cosmetics_Weapon_Shiny_Loarmaster", label: "Phosphene - Loarmaster" },
    { value: "Cosmetics_Weapon_Shiny_Lucian", label: "Phosphene - Lucian" },
    { value: "Cosmetics_Weapon_Shiny_Lumberjack", label: "Phosphene - Lumberjack" },
    { value: "Cosmetics_Weapon_Shiny_Luty", label: "Phosphene - Luty" },
    { value: "Cosmetics_Weapon_Shiny_misslaser", label: "Phosphene - Misslaser" },
    { value: "Cosmetics_Weapon_Shiny_murder", label: "Phosphene - Murder (Mantra)" },
    { value: "Cosmetics_Weapon_Shiny_NoisyCricket", label: "Phosphene - NoisyCricket" },
    { value: "Cosmetics_Weapon_Shiny_OhmIGot", label: "Phosphene - OhmIGot" },
    { value: "Cosmetics_Weapon_Shiny_OM", label: "Phosphene - OM" },
    { value: "Cosmetics_Weapon_Shiny_Onslaught", label: "Phosphene - Onslaught" },
    { value: "Cosmetics_Weapon_Shiny_Phantom_Flame", label: "Phosphene - Phantom Flame" },
    { value: "Cosmetics_Weapon_Shiny_PlasmaCoil", label: "Phosphene - PlasmaCoil" },
    { value: "Cosmetics_Weapon_Shiny_PotatoThrower", label: "Phosphene - PotatoThrower" },
    { value: "Cosmetics_Weapon_Shiny_Prince", label: "Phosphene - Prince" },
    { value: "Cosmetics_Weapon_Shiny_QueensRest", label: "Phosphene - QueensRest" },
    { value: "Cosmetics_Weapon_Shiny_QuickDraw", label: "Phosphene - QuickDraw" },
    { value: "Cosmetics_Weapon_Shiny_rainmaker", label: "Phosphene - Rainmaker" },
    { value: "Cosmetics_Weapon_Shiny_RainbowVomit", label: "Phosphene - RainbowVomit" },
    { value: "Cosmetics_Weapon_Shiny_Rangefinder", label: "Phosphene - Rangefinder" },
    { value: "Cosmetics_Weapon_Shiny_Roach", label: "Phosphene - Roach" },
    { value: "Cosmetics_Weapon_Shiny_roil", label: "Phosphene - Roil" },
    { value: "Cosmetics_Weapon_Shiny_RocketReload", label: "Phosphene - RocketReload" },
    { value: "Cosmetics_Weapon_Shiny_Rowan", label: "Phosphene - Rowan" },
    { value: "Cosmetics_Weapon_Shiny_rowdy", label: "Phosphene - Rowdy" },
    { value: "Cosmetics_Weapon_Shiny_RubysGrasp", label: "Phosphene - RubysGrasp" },
    { value: "Cosmetics_Weapon_Shiny_seamstress", label: "Phosphene - Seamstress" },
    { value: "Cosmetics_Weapon_Shiny_seventh_sense", label: "Phosphene - Seventh Sense" },
    { value: "Cosmetics_Weapon_Shiny_Sideshow", label: "Phosphene - Sideshow" },
    { value: "Cosmetics_Weapon_Shiny_Slugger", label: "Phosphene - Slugger" },
    { value: "Cosmetics_Weapon_Shiny_star_helix", label: "Phosphene - Star Helix" },
    { value: "Cosmetics_Weapon_Shiny_StopGap", label: "Phosphene - StopGap" },
    { value: "Cosmetics_Weapon_Shiny_Stray", label: "Phosphene - Stray" },
    { value: "Cosmetics_Weapon_Shiny_Sweet_Embrace", label: "Phosphene - Sweet Embrace" },
    { value: "Cosmetics_Weapon_Shiny_Symmetry", label: "Phosphene - Symmetry" },
    { value: "Cosmetics_Weapon_Shiny_TKsWave", label: "Phosphene - TKsWave" },
    { value: "Cosmetics_Weapon_Shiny_Truck", label: "Phosphene - Truck" },
    { value: "Cosmetics_Weapon_Shiny_Ultimate", label: "Ratatataclysm - Ultimate" },
    { value: "Cosmetics_Weapon_Shiny_Vamoose", label: "Phosphene - Vamoose" },
    { value: "Cosmetics_Weapon_Shiny_WF", label: "Phosphene - WF" },
    { value: "Cosmetics_Weapon_Shiny_WomboCombo", label: "Phosphene - WomboCombo" },
    { value: "Cosmetics_Weapon_Shiny_Zipgun", label: "Phosphene - Zipgun" }
  ];

  var EXTRA_SKINS = [
    { name: 'Tye Die Ingraind Flowers', code: '{9:[85 90]}' },
    { name: 'Steam Punk', code: '{289:25}' },
    { name: 'Joker Camo (Green Purp)', code: '{7:100}' },
    { name: 'Midnight Purple', code: '{8:53}' },
    { name: 'Magma Lava', code: '{255:10}' },
    { name: 'Red Grid Lazar', code: '{13:72}' },
    { name: 'Red Diamond Patterns', code: '{10:100}' },
    { name: 'Red with Blue Digital', code: '{4:76}' },
    { name: 'Gold/Grey with Green Blood Splats', code: '{20:63}' },
    { name: 'Pink Purple Siren Tattoos', code: '{254:11}' },
    { name: 'Purple with Blue/Green/Yellow Color Splat', code: '{10:1}' },
    { name: 'Red with Blue Lightning Streaks', code: '{255:11}' },
    { name: 'Blue Green MBX', code: '{254:10}' },
    { name: 'White', code: '{2:54}' },
    { name: 'DLC Skin Pine Green', code: '{13:85}' },
    { name: 'Lime Green', code: '{13:100}' },
    { name: 'Light Purple Pink with Flower Engravings', code: '{25:59}' },
    { name: 'Chrome Green and Yellow', code: '{254:221}' },
    { name: 'Copper and Greenish', code: '{3:81}' },
    { name: 'White and Grey', code: '{9:[80 90]}' },
    { name: 'Pink and Aqua Blue', code: '{8:55}' },
    { name: 'Pink Purple Fade Mix', code: '{5:66}' },
    { name: 'Blue Orange and Copper', code: '{289:23}' },
    { name: 'Blue and Silver with Copper Outlines', code: '{289:22}' },
    { name: 'Grey and Aqua Blue Entrails', code: '{289:20}' },
    { name: 'Blue White with Red Outlines', code: '{289:21}' },
    { name: 'Black and Gold', code: '{13:73}' },
    { name: 'Barney', code: '{14:36}' },
    { name: 'Grey and Black', code: '{14:35}' },
    { name: 'Black and Yellow Digital', code: '{254:12}' },
    { name: 'Halo Camo', code: '{255:1}' },
    { name: 'Black Silver Yellow Outlines', code: '{15:97}' },
    { name: 'Brown Green with Yellow Trim', code: '{255:1}' },
    { name: 'White Blue', code: '{255:9}' },
    { name: 'Purple Pink and Gold Flower Patterns', code: '{25:61}' },
    { name: 'Pink Purple Yellow Reactive', code: '{20:68}' },
    { name: 'Burgundy and Copper', code: '{10:57}' },
    { name: 'Chrome', code: '{4:80}' },
    { name: 'Purple Gold', code: '{3:76}' },
    { name: 'Colorful Reactive Polka Dots', code: '{5:1}' },
    { name: 'Chrome Chameleon', code: '{321:7}' },
    { name: 'Susano Armor', code: '{19:17}' },
    { name: 'Ice Camo', code: '{255:[13 13]}' }
  ];

  var NUMERIC_BRACE_RE = /^\{\s*\d+\s*:\s*(?:\[\s*\d+(?:\s+\d+)*\s*\]|\d+)\s*\}$/;

  function publishExtraNumericSkins() {
    try {
      var seen = new Set();
      var list = [];
      (EXTRA_SKINS || []).forEach(function (item) {
        var name = String(item.name || '').trim();
        var code = String(item.code || '').trim().replace(/\s+/g, ' ');
        if (!NUMERIC_BRACE_RE.test(code)) return;
        var key = code.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        list.push({ name: name || 'Numeric Skin', code: code });
      });
      window.__CC_EXTRA_NUMERIC_SKINS = list;
      return list;
    } catch (_) {
      window.__CC_EXTRA_NUMERIC_SKINS = window.__CC_EXTRA_NUMERIC_SKINS || [];
      return window.__CC_EXTRA_NUMERIC_SKINS;
    }
  }

  window.SPAWN_SKINS = SPAWN_SKINS;
  window.SKINS = {
    Experimental: EXTRA_SKINS.slice(),
    Special: EXTRA_SKINS.slice()
  };
  publishExtraNumericSkins();
})();
