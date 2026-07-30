(function(){
  'use strict';
  var patches = [
  {
    "code": "armor_shield.comp_01_common",
    "idRaw": "237:26",
    "id": 26,
    "family": 237
  },
  {
    "code": "armor_shield.comp_02_uncommon",
    "idRaw": "237:27",
    "id": 27,
    "family": 237
  },
  {
    "code": "armor_shield.comp_03_rare",
    "idRaw": "237:28",
    "id": 28,
    "family": 237
  },
  {
    "code": "armor_shield.comp_04_epic",
    "idRaw": "237:29",
    "id": 29,
    "family": 237
  },
  {
    "code": "armor_shield.comp_05_legendary",
    "idRaw": "237:30",
    "id": 30,
    "family": 237
  },
  {
    "code": "bor_hw.comp_05_legendary_draupner",
    "idRaw": "275:38",
    "id": 38,
    "family": 275
  },
  {
    "code": "bor_hw.part_barrel_02_draupner",
    "idRaw": "275:37",
    "id": 37,
    "family": 275
  },
  {
    "code": "bor_repair_kit.part_augment_unique_hugger",
    "idRaw": "274:8",
    "id": 8,
    "family": 274
  },
  {
    "code": "bor_sg.comp_05_legendary",
    "idRaw": "7:99",
    "id": 99,
    "family": 7
  },
  {
    "code": "bor_sg.comp_05_legendary_crazedearl",
    "idRaw": "7:54",
    "id": 54,
    "family": 7
  },
  {
    "code": "bor_sg.part_barrel_crazedearl",
    "idRaw": "7:21",
    "id": 21,
    "family": 7
  },
  {
    "code": "bor_sg.part_mag_01_crazedearl",
    "idRaw": "7:58",
    "id": 58,
    "family": 7
  },
  {
    "code": "bor_sg.part_mag_02_crazedearl",
    "idRaw": "7:57",
    "id": 57,
    "family": 7
  },
  {
    "code": "bor_shield.comp_05_legendary",
    "idRaw": "300:5",
    "id": 5,
    "family": 300
  },
  {
    "code": "bor_shield.part_body_energy_overswarm",
    "idRaw": "300:13",
    "id": 13,
    "family": 300
  },
  {
    "code": "bor_sm.comp_05_legendary",
    "idRaw": "19:18",
    "id": 18,
    "family": 19
  },
  {
    "code": "bor_sm.comp_05_legendary_falke",
    "idRaw": "19:59",
    "id": 59,
    "family": 19
  },
  {
    "code": "bor_sm.part_barrel_01_falke",
    "idRaw": "19:58",
    "id": 58,
    "family": 19
  },
  {
    "code": "bor_sm.part_barrel_01_jailbroken",
    "idRaw": "19:60",
    "id": 60,
    "family": 19
  },
  {
    "code": "bor_sr.comp_05_legendary",
    "idRaw": "23:18",
    "id": 18,
    "family": 23
  },
  {
    "code": "bor_sr.comp_05_legendary_abyss",
    "idRaw": "23:61",
    "id": 61,
    "family": 23
  },
  {
    "code": "bor_sr.part_barrel_02_abyss",
    "idRaw": "23:60",
    "id": 60,
    "family": 23
  },
  {
    "code": "bor_sr.part_scope_acc_s01_l01_b_abyss",
    "idRaw": "23:59",
    "id": 59,
    "family": 23
  },
  {
    "code": "bor_terminal_barrier.comp_01_common",
    "idRaw": "305:1",
    "id": 1,
    "family": 305
  },
  {
    "code": "bor_terminal_barrier.comp_02_uncommon",
    "idRaw": "305:2",
    "id": 2,
    "family": 305
  },
  {
    "code": "bor_terminal_barrier.comp_03_rare",
    "idRaw": "305:3",
    "id": 3,
    "family": 305
  },
  {
    "code": "bor_terminal_barrier.comp_04_epic",
    "idRaw": "305:4",
    "id": 4,
    "family": 305
  },
  {
    "code": "bor_terminal_barrier.comp_05_legendary",
    "idRaw": "305:5",
    "id": 5,
    "family": 305
  },
  {
    "code": "bor_terminal_barrier.part_body",
    "idRaw": "305:6",
    "id": 6,
    "family": 305
  },
  {
    "code": "bor_turret_gadget.comp_01_common",
    "idRaw": "335:1",
    "id": 1,
    "family": 335
  },
  {
    "code": "bor_turret_gadget.comp_02_uncommon",
    "idRaw": "335:2",
    "id": 2,
    "family": 335
  },
  {
    "code": "bor_turret_gadget.comp_03_rare",
    "idRaw": "335:3",
    "id": 3,
    "family": 335
  },
  {
    "code": "bor_turret_gadget.comp_04_epic",
    "idRaw": "335:4",
    "id": 4,
    "family": 335
  },
  {
    "code": "bor_turret_gadget.comp_05_legendary",
    "idRaw": "335:5",
    "id": 5,
    "family": 335
  },
  {
    "code": "bor_turret_gadget.part_ele_control",
    "idRaw": "335:6",
    "id": 6,
    "family": 335
  },
  {
    "code": "borg_grenade_gadget.comp_05_legendary",
    "idRaw": "278:8",
    "id": 8,
    "family": 278
  },
  {
    "code": "borg_grenade_gadget.part_02_divider_02_seeker_borg",
    "idRaw": "278:13",
    "id": 13,
    "family": 278
  },
  {
    "code": "borg_grenade_gadget.part_02_divider_04_repeater_borg",
    "idRaw": "278:1",
    "id": 1,
    "family": 278
  },
  {
    "code": "borg_grenade_gadget.part_02_divider_borg",
    "idRaw": "278:3",
    "id": 3,
    "family": 278
  },
  {
    "code": "borg_grenade_gadget.part_payload_unique_pellet",
    "idRaw": "278:16",
    "id": 16,
    "family": 278
  },
  {
    "code": "classmod_dark_siren.comp_05_legendary_01",
    "idRaw": "254:56",
    "id": 56,
    "family": 254
  },
  {
    "code": "classmod_dark_siren.comp_05_legendary_02",
    "idRaw": "254:55",
    "id": 55,
    "family": 254
  },
  {
    "code": "classmod_dark_siren.comp_05_legendary_03",
    "idRaw": "254:54",
    "id": 54,
    "family": 254
  },
  {
    "code": "classmod_dark_siren.comp_05_legendary_04",
    "idRaw": "254:53",
    "id": 53,
    "family": 254
  },
  {
    "code": "classmod_dark_siren.comp_05_legendary_05",
    "idRaw": "254:52",
    "id": 52,
    "family": 254
  },
  {
    "code": "classmod_dark_siren.comp_05_legendary_06",
    "idRaw": "254:51",
    "id": 51,
    "family": 254
  },
  {
    "code": "classmod_dark_siren.comp_05_legendary_cowbell",
    "idRaw": "254:540",
    "id": 540,
    "family": 254
  },
  {
    "code": "classmod_dark_siren.comp_05_legendary_raid2",
    "idRaw": "254:544",
    "id": 544,
    "family": 254
  },
  {
    "code": "classmod_dark_siren.comp_05_legendary_tuba",
    "idRaw": "254:546",
    "id": 546,
    "family": 254
  },
  {
    "code": "classmod_dark_siren.leg_body_cowbell",
    "idRaw": "254:539",
    "id": 539,
    "family": 254
  },
  {
    "code": "classmod_dark_siren.leg_body_tuba",
    "idRaw": "254:545",
    "id": 545,
    "family": 254
  },
  {
    "code": "classmod_exo_soldier.comp_05_legendary_01",
    "idRaw": "256:26",
    "id": 26,
    "family": 256
  },
  {
    "code": "classmod_exo_soldier.comp_05_legendary_02",
    "idRaw": "256:25",
    "id": 25,
    "family": 256
  },
  {
    "code": "classmod_exo_soldier.comp_05_legendary_03",
    "idRaw": "256:24",
    "id": 24,
    "family": 256
  },
  {
    "code": "classmod_exo_soldier.comp_05_legendary_04",
    "idRaw": "256:23",
    "id": 23,
    "family": 256
  },
  {
    "code": "classmod_exo_soldier.comp_05_legendary_05",
    "idRaw": "256:22",
    "id": 22,
    "family": 256
  },
  {
    "code": "classmod_exo_soldier.comp_05_legendary_06",
    "idRaw": "256:21",
    "id": 21,
    "family": 256
  },
  {
    "code": "classmod_exo_soldier.comp_05_legendary_cowbell",
    "idRaw": "256:541",
    "id": 541,
    "family": 256
  },
  {
    "code": "classmod_exo_soldier.comp_05_legendary_raid2",
    "idRaw": "256:545",
    "id": 545,
    "family": 256
  },
  {
    "code": "classmod_exo_soldier.comp_05_legendary_tuba",
    "idRaw": "256:547",
    "id": 547,
    "family": 256
  },
  {
    "code": "classmod_exo_soldier.leg_body_cowbell",
    "idRaw": "256:540",
    "id": 540,
    "family": 256
  },
  {
    "code": "classmod_exo_soldier.leg_body_tuba",
    "idRaw": "256:546",
    "id": 546,
    "family": 256
  },
  {
    "code": "classmod_gravitar.comp_05_legendary_01",
    "idRaw": "259:26",
    "id": 26,
    "family": 259
  },
  {
    "code": "classmod_gravitar.comp_05_legendary_02",
    "idRaw": "259:25",
    "id": 25,
    "family": 259
  },
  {
    "code": "classmod_gravitar.comp_05_legendary_03",
    "idRaw": "259:24",
    "id": 24,
    "family": 259
  },
  {
    "code": "classmod_gravitar.comp_05_legendary_04",
    "idRaw": "259:23",
    "id": 23,
    "family": 259
  },
  {
    "code": "classmod_gravitar.comp_05_legendary_05",
    "idRaw": "259:22",
    "id": 22,
    "family": 259
  },
  {
    "code": "classmod_gravitar.comp_05_legendary_06",
    "idRaw": "259:21",
    "id": 21,
    "family": 259
  },
  {
    "code": "classmod_gravitar.comp_05_legendary_cowbell",
    "idRaw": "259:543",
    "id": 543,
    "family": 259
  },
  {
    "code": "classmod_gravitar.comp_05_legendary_raid2",
    "idRaw": "259:547",
    "id": 547,
    "family": 259
  },
  {
    "code": "classmod_gravitar.comp_05_legendary_tuba",
    "idRaw": "259:549",
    "id": 549,
    "family": 259
  },
  {
    "code": "classmod_gravitar.leg_body_cowbell",
    "idRaw": "259:542",
    "id": 542,
    "family": 259
  },
  {
    "code": "classmod_gravitar.leg_body_tuba",
    "idRaw": "259:548",
    "id": 548,
    "family": 259
  },
  {
    "code": "classmod_gravitar.part_grav_asm_skill_test",
    "idRaw": "259:219",
    "id": 219,
    "family": 259
  },
  {
    "code": "classmod_paladin.comp_05_legendary_01",
    "idRaw": "255:25",
    "id": 25,
    "family": 255
  },
  {
    "code": "classmod_paladin.comp_05_legendary_02",
    "idRaw": "255:24",
    "id": 24,
    "family": 255
  },
  {
    "code": "classmod_paladin.comp_05_legendary_03",
    "idRaw": "255:23",
    "id": 23,
    "family": 255
  },
  {
    "code": "classmod_paladin.comp_05_legendary_04",
    "idRaw": "255:22",
    "id": 22,
    "family": 255
  },
  {
    "code": "classmod_paladin.comp_05_legendary_05",
    "idRaw": "255:21",
    "id": 21,
    "family": 255
  },
  {
    "code": "classmod_paladin.comp_05_legendary_06",
    "idRaw": "255:20",
    "id": 20,
    "family": 255
  },
  {
    "code": "classmod_paladin.comp_05_legendary_cowbell",
    "idRaw": "255:541",
    "id": 541,
    "family": 255
  },
  {
    "code": "classmod_paladin.comp_05_legendary_raid2",
    "idRaw": "255:545",
    "id": 545,
    "family": 255
  },
  {
    "code": "classmod_paladin.comp_05_legendary_tuba",
    "idRaw": "255:547",
    "id": 547,
    "family": 255
  },
  {
    "code": "classmod_paladin.leg_body_cowbell",
    "idRaw": "255:540",
    "id": 540,
    "family": 255
  },
  {
    "code": "classmod_paladin.leg_body_tuba",
    "idRaw": "255:546",
    "id": 546,
    "family": 255
  },
  {
    "code": "classmod_robodealer.comp_05_legendary_raid2",
    "idRaw": "404:544",
    "id": 544,
    "family": 404
  },
  {
    "code": "classmod_robodealer.comp_05_legendary_tuba",
    "idRaw": "404:546",
    "id": 546,
    "family": 404
  },
  {
    "code": "classmod_robodealer.leg_body_tuba",
    "idRaw": "404:545",
    "id": 545,
    "family": 404
  },
  {
    "code": "classmod.part_firmware_active_fire",
    "idRaw": "234:104",
    "id": 104,
    "family": 234
  },
  {
    "code": "classmod.part_firmware_bruiser",
    "idRaw": "234:106",
    "id": 106,
    "family": 234
  },
  {
    "code": "dad_ar.comp_05_legendary",
    "idRaw": "13:99",
    "id": 99,
    "family": 13
  },
  {
    "code": "dad_ar.comp_ds_as_phaseshard_specter_weapon",
    "idRaw": "13:74",
    "id": 74,
    "family": 13
  },
  {
    "code": "dad_ar.comp_gnpc_weapon",
    "idRaw": "13:19",
    "id": 19,
    "family": 13
  },
  {
    "code": "dad_ar.part_barrel_02_harddark",
    "idRaw": "13:86",
    "id": 86,
    "family": 13
  },
  {
    "code": "dad_grenade_gadget.comp_05_legendary",
    "idRaw": "270:5",
    "id": 5,
    "family": 270
  },
  {
    "code": "dad_ps.comp_05_legendary",
    "idRaw": "2:56",
    "id": 56,
    "family": 2
  },
  {
    "code": "dad_ps.comp_05_legendary_soulsurvivor",
    "idRaw": "2:80",
    "id": 80,
    "family": 2
  },
  {
    "code": "dad_ps.comp_first_gun",
    "idRaw": "2:55",
    "id": 55,
    "family": 2
  },
  {
    "code": "dad_ps.part_barrel_02_soulsurvivor",
    "idRaw": "2:79",
    "id": 79,
    "family": 2
  },
  {
    "code": "dad_ps.part_mag_torgue_normal_soulsurvivor",
    "idRaw": "2:82",
    "id": 82,
    "family": 2
  },
  {
    "code": "dad_ps.part_mag_torgue_sticky_soulsurvivor",
    "idRaw": "2:81",
    "id": 81,
    "family": 2
  },
  {
    "code": "dad_sg.comp_05_legendary",
    "idRaw": "8:1",
    "id": 1,
    "family": 8
  },
  {
    "code": "dad_sg.part_barrel_cannonbrawl",
    "idRaw": "8:60",
    "id": 60,
    "family": 8
  },
  {
    "code": "dad_sg.part_underbarrel_01_cannonbrawl",
    "idRaw": "8:81",
    "id": 81,
    "family": 8
  },
  {
    "code": "dad_shield.comp_05_legendary",
    "idRaw": "312:5",
    "id": 5,
    "family": 312
  },
  {
    "code": "dad_shield.comp_05_legendary_honeybadger",
    "idRaw": "312:11",
    "id": 11,
    "family": 312
  },
  {
    "code": "dad_shield.part_body_honeybadger",
    "idRaw": "312:12",
    "id": 12,
    "family": 312
  },
  {
    "code": "dad_sm.comp_05_legendary",
    "idRaw": "20:61",
    "id": 61,
    "family": 20
  },
  {
    "code": "dad_sm.comp_05_legendary_follower",
    "idRaw": "20:2",
    "id": 2,
    "family": 20
  },
  {
    "code": "dad_sm.part_barrel_01_raiden",
    "idRaw": "20:59",
    "id": 59,
    "family": 20
  },
  {
    "code": "dad_sm.part_barrel_02_follower",
    "idRaw": "20:1",
    "id": 1,
    "family": 20
  },
  {
    "code": "dad_sm.part_barrel_02_screwed",
    "idRaw": "20:71",
    "id": 71,
    "family": 20
  },
  {
    "code": "dad_terminal_combat.comp_01_common",
    "idRaw": "307:2",
    "id": 2,
    "family": 307
  },
  {
    "code": "dad_terminal_combat.comp_02_uncommon",
    "idRaw": "307:3",
    "id": 3,
    "family": 307
  },
  {
    "code": "dad_terminal_combat.comp_03_rare",
    "idRaw": "307:4",
    "id": 4,
    "family": 307
  },
  {
    "code": "dad_terminal_combat.comp_04_epic",
    "idRaw": "307:5",
    "id": 5,
    "family": 307
  },
  {
    "code": "dad_terminal_combat.comp_05_hotoffthepress",
    "idRaw": "307:7",
    "id": 7,
    "family": 307
  },
  {
    "code": "dad_terminal_combat.comp_05_legendary",
    "idRaw": "307:6",
    "id": 6,
    "family": 307
  },
  {
    "code": "dad_terminal_combat.part_body",
    "idRaw": "307:1",
    "id": 1,
    "family": 307
  },
  {
    "code": "dad_turret_gadget.comp_01_common",
    "idRaw": "360:1",
    "id": 1,
    "family": 360
  },
  {
    "code": "dad_turret_gadget.comp_02_uncommon",
    "idRaw": "360:2",
    "id": 2,
    "family": 360
  },
  {
    "code": "dad_turret_gadget.comp_03_rare",
    "idRaw": "360:3",
    "id": 3,
    "family": 360
  },
  {
    "code": "dad_turret_gadget.comp_04_epic",
    "idRaw": "360:4",
    "id": 4,
    "family": 360
  },
  {
    "code": "dad_turret_gadget.comp_05_legendary",
    "idRaw": "360:5",
    "id": 5,
    "family": 360
  },
  {
    "code": "dad_turret_gadget.part_ele_control",
    "idRaw": "360:6",
    "id": 6,
    "family": 360
  },
  {
    "code": "energy_shield.comp_01_common",
    "idRaw": "248:22",
    "id": 22,
    "family": 248
  },
  {
    "code": "energy_shield.comp_02_uncommon",
    "idRaw": "248:23",
    "id": 23,
    "family": 248
  },
  {
    "code": "energy_shield.comp_03_rare",
    "idRaw": "248:24",
    "id": 24,
    "family": 248
  },
  {
    "code": "energy_shield.comp_04_epic",
    "idRaw": "248:25",
    "id": 25,
    "family": 248
  },
  {
    "code": "energy_shield.comp_05_legendary",
    "idRaw": "248:26",
    "id": 26,
    "family": 248
  },
  {
    "code": "enhancement.part_firmware_active_fire",
    "idRaw": "247:249",
    "id": 249,
    "family": 247
  },
  {
    "code": "enhancement.part_firmware_bruiser",
    "idRaw": "247:250",
    "id": 250,
    "family": 247
  },
  {
    "code": "grenade_gadget.comp_01_common",
    "idRaw": "245:82",
    "id": 82,
    "family": 245
  },
  {
    "code": "grenade_gadget.comp_02_uncommon",
    "idRaw": "245:83",
    "id": 83,
    "family": 245
  },
  {
    "code": "grenade_gadget.comp_03_rare",
    "idRaw": "245:84",
    "id": 84,
    "family": 245
  },
  {
    "code": "grenade_gadget.comp_04_epic",
    "idRaw": "245:85",
    "id": 85,
    "family": 245
  },
  {
    "code": "grenade_gadget.comp_05_legendary",
    "idRaw": "245:86",
    "id": 86,
    "family": 245
  },
  {
    "code": "grenade_gadget.part_firmware_bruiser",
    "idRaw": "245:90",
    "id": 90,
    "family": 245
  },
  {
    "code": "grenade_gadget.part_normal",
    "idRaw": "245:23",
    "id": 23,
    "family": 245
  },
  {
    "code": "heavy_weapon_gadget.comp_01_common",
    "idRaw": "244:25",
    "id": 25,
    "family": 244
  },
  {
    "code": "heavy_weapon_gadget.comp_02_uncommon",
    "idRaw": "244:24",
    "id": 24,
    "family": 244
  },
  {
    "code": "heavy_weapon_gadget.comp_03_rare",
    "idRaw": "244:23",
    "id": 23,
    "family": 244
  },
  {
    "code": "heavy_weapon_gadget.comp_04_epic",
    "idRaw": "244:22",
    "id": 22,
    "family": 244
  },
  {
    "code": "heavy_weapon_gadget.comp_05_legendary",
    "idRaw": "244:21",
    "id": 21,
    "family": 244
  },
  {
    "code": "heavy_weapon_gadget.part_firmware_active_fire",
    "idRaw": "244:28",
    "id": 28,
    "family": 244
  },
  {
    "code": "heavy_weapon_gadget.part_firmware_bruiser",
    "idRaw": "244:29",
    "id": 29,
    "family": 244
  },
  {
    "code": "jak_ar.comp_05_legendary",
    "idRaw": "27:72",
    "id": 72,
    "family": 27
  },
  {
    "code": "jak_ar.comp_05_legendary_fishward",
    "idRaw": "27:83",
    "id": 83,
    "family": 27
  },
  {
    "code": "jak_ar.comp_05_legendary_gomie",
    "idRaw": "27:81",
    "id": 81,
    "family": 27
  },
  {
    "code": "jak_ar.comp_zane_weapon",
    "idRaw": "27:70",
    "id": 70,
    "family": 27
  },
  {
    "code": "jak_ar.part_barrel_01_gomie",
    "idRaw": "27:80",
    "id": 80,
    "family": 27
  },
  {
    "code": "jak_ar.part_barrel_02_fishward",
    "idRaw": "27:82",
    "id": 82,
    "family": 27
  },
  {
    "code": "jak_ar.part_underbarrel_02_crank_fishward",
    "idRaw": "27:84",
    "id": 84,
    "family": 27
  },
  {
    "code": "jak_grenade_gadget.comp_05_legendary",
    "idRaw": "267:8",
    "id": 8,
    "family": 267
  },
  {
    "code": "jak_grenade_gadget.comp_05_legendary_bismuth",
    "idRaw": "267:20",
    "id": 20,
    "family": 267
  },
  {
    "code": "jak_grenade_gadget.part_02_divider_02_seeker_jak",
    "idRaw": "267:3",
    "id": 3,
    "family": 267
  },
  {
    "code": "jak_grenade_gadget.part_02_divider_04_repeater_jak",
    "idRaw": "267:13",
    "id": 13,
    "family": 267
  },
  {
    "code": "jak_grenade_gadget.part_02_divider_jak",
    "idRaw": "267:2",
    "id": 2,
    "family": 267
  },
  {
    "code": "jak_grenade_gadget.part_bismuth_corrosive",
    "idRaw": "267:18",
    "id": 18,
    "family": 267
  },
  {
    "code": "jak_grenade_gadget.part_bismuth_cryo",
    "idRaw": "267:17",
    "id": 17,
    "family": 267
  },
  {
    "code": "jak_grenade_gadget.part_bismuth_fire",
    "idRaw": "267:16",
    "id": 16,
    "family": 267
  },
  {
    "code": "jak_grenade_gadget.part_bismuth_radiation",
    "idRaw": "267:15",
    "id": 15,
    "family": 267
  },
  {
    "code": "jak_grenade_gadget.part_bismuth_shock",
    "idRaw": "267:14",
    "id": 14,
    "family": 267
  },
  {
    "code": "jak_grenade_gadget.part_jak_bismuth",
    "idRaw": "267:19",
    "id": 19,
    "family": 267
  },
  {
    "code": "jak_ps.comp_05_legendary",
    "idRaw": "3:74",
    "id": 74,
    "family": 3
  },
  {
    "code": "jak_ps.comp_cine_weapon",
    "idRaw": "3:73",
    "id": 73,
    "family": 3
  },
  {
    "code": "jak_ps.comp_moxxi_weapon",
    "idRaw": "3:1",
    "id": 1,
    "family": 3
  },
  {
    "code": "jak_ps.comp_zane_weapon",
    "idRaw": "3:71",
    "id": 71,
    "family": 3
  },
  {
    "code": "jak_ps.part_barrel_shoals",
    "idRaw": "3:84",
    "id": 84,
    "family": 3
  },
  {
    "code": "jak_repair_kit.comp_05_legendary_vitae",
    "idRaw": "265:9",
    "id": 9,
    "family": 265
  },
  {
    "code": "jak_repair_kit.part_augment_unique_vitae",
    "idRaw": "265:8",
    "id": 8,
    "family": 265
  },
  {
    "code": "jak_sg.comp_05_legendary",
    "idRaw": "9:81",
    "id": 81,
    "family": 9
  },
  {
    "code": "jak_sg.comp_06_pearl_constable",
    "idRaw": "9:101",
    "id": 101,
    "family": 9
  },
  {
    "code": "jak_sg.part_barrel_01_constable",
    "idRaw": "9:102",
    "id": 102,
    "family": 9
  },
  {
    "code": "jak_shield.comp_05_legendary",
    "idRaw": "306:5",
    "id": 5,
    "family": 306
  },
  {
    "code": "jak_sr.comp_05_legendary",
    "idRaw": "24:71",
    "id": 71,
    "family": 24
  },
  {
    "code": "jak_sr.comp_05_legendary_fearstalker",
    "idRaw": "24:78",
    "id": 78,
    "family": 24
  },
  {
    "code": "jak_sr.part_barrel_02_fearstalker",
    "idRaw": "24:77",
    "id": 77,
    "family": 24
  },
  {
    "code": "jak_sr.part_mag_torgue_normal_fearstalker",
    "idRaw": "24:81",
    "id": 81,
    "family": 24
  },
  {
    "code": "jak_sr.part_mag_torgue_sticky_fearstalker",
    "idRaw": "24:80",
    "id": 80,
    "family": 24
  },
  {
    "code": "jak_terminal_combat.comp_01_common",
    "idRaw": "309:2",
    "id": 2,
    "family": 309
  },
  {
    "code": "jak_terminal_combat.comp_02_uncommon",
    "idRaw": "309:3",
    "id": 3,
    "family": 309
  },
  {
    "code": "jak_terminal_combat.comp_03_rare",
    "idRaw": "309:4",
    "id": 4,
    "family": 309
  },
  {
    "code": "jak_terminal_combat.comp_04_epic",
    "idRaw": "309:5",
    "id": 5,
    "family": 309
  },
  {
    "code": "jak_terminal_combat.comp_05_legendary",
    "idRaw": "309:6",
    "id": 6,
    "family": 309
  },
  {
    "code": "jak_terminal_combat.comp_05_melaymen",
    "idRaw": "309:7",
    "id": 7,
    "family": 309
  },
  {
    "code": "jak_terminal_combat.part_body",
    "idRaw": "309:1",
    "id": 1,
    "family": 309
  },
  {
    "code": "jak_turret_gadget.comp_01_common",
    "idRaw": "373:1",
    "id": 1,
    "family": 373
  },
  {
    "code": "jak_turret_gadget.comp_02_uncommon",
    "idRaw": "373:2",
    "id": 2,
    "family": 373
  },
  {
    "code": "jak_turret_gadget.comp_03_rare",
    "idRaw": "373:3",
    "id": 3,
    "family": 373
  },
  {
    "code": "jak_turret_gadget.comp_04_epic",
    "idRaw": "373:4",
    "id": 4,
    "family": 373
  },
  {
    "code": "jak_turret_gadget.comp_05_legendary",
    "idRaw": "373:5",
    "id": 5,
    "family": 373
  },
  {
    "code": "jak_turret_gadget.part_ele_control",
    "idRaw": "373:6",
    "id": 6,
    "family": 373
  },
  {
    "code": "mal_grenade_gadget.comp_05_legendary",
    "idRaw": "263:8",
    "id": 8,
    "family": 263
  },
  {
    "code": "mal_grenade_gadget.part_02_divider_02_seeker_mal",
    "idRaw": "263:1",
    "id": 1,
    "family": 263
  },
  {
    "code": "mal_grenade_gadget.part_02_divider_04_repeater_mal",
    "idRaw": "263:13",
    "id": 13,
    "family": 263
  },
  {
    "code": "mal_grenade_gadget.part_02_divider_maliwan",
    "idRaw": "263:2",
    "id": 2,
    "family": 263
  },
  {
    "code": "mal_hw.comp_05_legendary",
    "idRaw": "289:4",
    "id": 4,
    "family": 289
  },
  {
    "code": "mal_hw.comp_05_legendary_ichor",
    "idRaw": "289:28",
    "id": 28,
    "family": 289
  },
  {
    "code": "mal_hw.part_barrel_01_ichor",
    "idRaw": "289:27",
    "id": 27,
    "family": 289
  },
  {
    "code": "mal_hw.part_barrel_02_barrel",
    "idRaw": "289:30",
    "id": 30,
    "family": 289
  },
  {
    "code": "mal_repair_kit.comp_05_legendary_geigerroid",
    "idRaw": "266:8",
    "id": 8,
    "family": 266
  },
  {
    "code": "mal_sg.comp_05_legendary",
    "idRaw": "10:99",
    "id": 99,
    "family": 10
  },
  {
    "code": "mal_sg.comp_05_legendary_reminisce",
    "idRaw": "10:61",
    "id": 61,
    "family": 10
  },
  {
    "code": "mal_sg.part_barrel_01_discybusiness",
    "idRaw": "10:82",
    "id": 82,
    "family": 10
  },
  {
    "code": "mal_sg.part_barrel_01_reminisce",
    "idRaw": "10:60",
    "id": 60,
    "family": 10
  },
  {
    "code": "mal_shield.comp_05_elpisstar",
    "idRaw": "279:12",
    "id": 12,
    "family": 279
  },
  {
    "code": "mal_shield.comp_05_legendary",
    "idRaw": "279:7",
    "id": 7,
    "family": 279
  },
  {
    "code": "mal_shield.part_unique_elpisstar",
    "idRaw": "279:11",
    "id": 11,
    "family": 279
  },
  {
    "code": "mal_sm.comp_05_legendary",
    "idRaw": "21:1",
    "id": 1,
    "family": 21
  },
  {
    "code": "mal_sm.comp_05_legendary_flashcyclone",
    "idRaw": "21:85",
    "id": 85,
    "family": 21
  },
  {
    "code": "mal_sm.comp_06_pearl_juliet",
    "idRaw": "21:90",
    "id": 90,
    "family": 21
  },
  {
    "code": "mal_sm.comp_amara_weapon",
    "idRaw": "21:64",
    "id": 64,
    "family": 21
  },
  {
    "code": "mal_sm.part_barrel_02_flashcyclone",
    "idRaw": "21:84",
    "id": 84,
    "family": 21
  },
  {
    "code": "mal_sm.part_barrel_02_juliet",
    "idRaw": "21:89",
    "id": 89,
    "family": 21
  },
  {
    "code": "mal_sm.part_foregrip_01_flashcyclone",
    "idRaw": "21:88",
    "id": 88,
    "family": 21
  },
  {
    "code": "mal_sm.part_foregrip_02_flashcyclone",
    "idRaw": "21:87",
    "id": 87,
    "family": 21
  },
  {
    "code": "mal_sm.part_foregrip_03_flashcyclone",
    "idRaw": "21:86",
    "id": 86,
    "family": 21
  },
  {
    "code": "mal_sr.comp_05_legendary",
    "idRaw": "25:1",
    "id": 1,
    "family": 25
  },
  {
    "code": "mal_sr.part_barrel_01_manifest",
    "idRaw": "25:85",
    "id": 85,
    "family": 25
  },
  {
    "code": "mal_sr.part_mag_05_borg_acc_manifest",
    "idRaw": "25:86",
    "id": 86,
    "family": 25
  },
  {
    "code": "mal_terminal_healing.comp_01_common",
    "idRaw": "319:2",
    "id": 2,
    "family": 319
  },
  {
    "code": "mal_terminal_healing.comp_02_uncommon",
    "idRaw": "319:3",
    "id": 3,
    "family": 319
  },
  {
    "code": "mal_terminal_healing.comp_03_rare",
    "idRaw": "319:4",
    "id": 4,
    "family": 319
  },
  {
    "code": "mal_terminal_healing.comp_04_epic",
    "idRaw": "319:5",
    "id": 5,
    "family": 319
  },
  {
    "code": "mal_terminal_healing.comp_05_legendary",
    "idRaw": "319:6",
    "id": 6,
    "family": 319
  },
  {
    "code": "mal_terminal_healing.comp_05_stabilizer",
    "idRaw": "319:7",
    "id": 7,
    "family": 319
  },
  {
    "code": "mal_terminal_healing.part_body",
    "idRaw": "319:1",
    "id": 1,
    "family": 319
  },
  {
    "code": "mal_turret_gadget.comp_01_common",
    "idRaw": "374:1",
    "id": 1,
    "family": 374
  },
  {
    "code": "mal_turret_gadget.comp_02_uncommon",
    "idRaw": "374:2",
    "id": 2,
    "family": 374
  },
  {
    "code": "mal_turret_gadget.comp_03_rare",
    "idRaw": "374:3",
    "id": 3,
    "family": 374
  },
  {
    "code": "mal_turret_gadget.comp_04_epic",
    "idRaw": "374:4",
    "id": 4,
    "family": 374
  },
  {
    "code": "mal_turret_gadget.comp_05_legendary",
    "idRaw": "374:5",
    "id": 5,
    "family": 374
  },
  {
    "code": "mal_turret_gadget.part_ele_control",
    "idRaw": "374:6",
    "id": 6,
    "family": 374
  },
  {
    "code": "ord_ar.comp_05_legendary",
    "idRaw": "15:73",
    "id": 73,
    "family": 15
  },
  {
    "code": "ord_ar.comp_05_legendary_crowsourced",
    "idRaw": "15:77",
    "id": 77,
    "family": 15
  },
  {
    "code": "ord_ar.part_barrel_02_crowsourced",
    "idRaw": "15:78",
    "id": 78,
    "family": 15
  },
  {
    "code": "ord_grenade_gadget.comp_05_legendary",
    "idRaw": "272:6",
    "id": 6,
    "family": 272
  },
  {
    "code": "ord_ps.comp_05_legendary",
    "idRaw": "4:77",
    "id": 77,
    "family": 4
  },
  {
    "code": "ord_ps.comp_05_legendary_sunspot",
    "idRaw": "4:83",
    "id": 83,
    "family": 4
  },
  {
    "code": "ord_ps.comp_tkhuman_weapon",
    "idRaw": "4:73",
    "id": 73,
    "family": 4
  },
  {
    "code": "ord_ps.part_barrel_rhythm",
    "idRaw": "4:86",
    "id": 86,
    "family": 4
  },
  {
    "code": "ord_ps.part_barrel_sunspot",
    "idRaw": "4:82",
    "id": 82,
    "family": 4
  },
  {
    "code": "ord_repair_kit.comp_05_legendary_paleblood",
    "idRaw": "285:9",
    "id": 9,
    "family": 285
  },
  {
    "code": "ord_repair_kit.part_augment_unique_paleblood",
    "idRaw": "285:8",
    "id": 8,
    "family": 285
  },
  {
    "code": "ord_shield.comp_05_legendary",
    "idRaw": "293:9",
    "id": 9,
    "family": 293
  },
  {
    "code": "ord_shield.part_body_energy_collector",
    "idRaw": "293:11",
    "id": 11,
    "family": 293
  },
  {
    "code": "ord_sr.comp_05_legendary",
    "idRaw": "26:73",
    "id": 73,
    "family": 26
  },
  {
    "code": "ord_sr.comp_05_legendary_temper",
    "idRaw": "26:84",
    "id": 84,
    "family": 26
  },
  {
    "code": "ord_sr.part_barrel_02_ishmael",
    "idRaw": "26:81",
    "id": 81,
    "family": 26
  },
  {
    "code": "ord_sr.part_barrel_02_temper",
    "idRaw": "26:83",
    "id": 83,
    "family": 26
  },
  {
    "code": "ord_sr.part_underbarrel_02_tether_snare_ishmael",
    "idRaw": "26:80",
    "id": 80,
    "family": 26
  },
  {
    "code": "ord_terminal_healing.comp_01_common",
    "idRaw": "322:3",
    "id": 3,
    "family": 322
  },
  {
    "code": "ord_terminal_healing.comp_02_uncommon",
    "idRaw": "322:4",
    "id": 4,
    "family": 322
  },
  {
    "code": "ord_terminal_healing.comp_03_rare",
    "idRaw": "322:5",
    "id": 5,
    "family": 322
  },
  {
    "code": "ord_terminal_healing.comp_04_epic",
    "idRaw": "322:6",
    "id": 6,
    "family": 322
  },
  {
    "code": "ord_terminal_healing.comp_05_bogo",
    "idRaw": "322:1",
    "id": 1,
    "family": 322
  },
  {
    "code": "ord_terminal_healing.comp_05_legendary",
    "idRaw": "322:7",
    "id": 7,
    "family": 322
  },
  {
    "code": "ord_terminal_healing.comp_05_onthego",
    "idRaw": "322:8",
    "id": 8,
    "family": 322
  },
  {
    "code": "ord_terminal_healing.part_body",
    "idRaw": "322:2",
    "id": 2,
    "family": 322
  },
  {
    "code": "ord_turret_gadget.comp_01_common",
    "idRaw": "326:3",
    "id": 3,
    "family": 326
  },
  {
    "code": "ord_turret_gadget.comp_02_uncommon",
    "idRaw": "326:4",
    "id": 4,
    "family": 326
  },
  {
    "code": "ord_turret_gadget.comp_03_rare",
    "idRaw": "326:5",
    "id": 5,
    "family": 326
  },
  {
    "code": "ord_turret_gadget.comp_04_epic",
    "idRaw": "326:6",
    "id": 6,
    "family": 326
  },
  {
    "code": "ord_turret_gadget.comp_05_legendary",
    "idRaw": "326:7",
    "id": 7,
    "family": 326
  },
  {
    "code": "ord_turret_gadget.comp_05_legendary_anchor",
    "idRaw": "326:1",
    "id": 1,
    "family": 326
  },
  {
    "code": "ord_turret_gadget.part_ele_control",
    "idRaw": "326:2",
    "id": 2,
    "family": 326
  },
  {
    "code": "ord_turret_gadget.part_unique_beam_anchor",
    "idRaw": "326:8",
    "id": 8,
    "family": 326
  },
  {
    "code": "repair_kit.comp_01_common",
    "idRaw": "243:107",
    "id": 107,
    "family": 243
  },
  {
    "code": "repair_kit.comp_02_uncommon",
    "idRaw": "243:108",
    "id": 108,
    "family": 243
  },
  {
    "code": "repair_kit.comp_03_rare",
    "idRaw": "243:109",
    "id": 109,
    "family": 243
  },
  {
    "code": "repair_kit.comp_04_epic",
    "idRaw": "243:110",
    "id": 110,
    "family": 243
  },
  {
    "code": "repair_kit.comp_05_legendary",
    "idRaw": "243:111",
    "id": 111,
    "family": 243
  },
  {
    "code": "repair_kit.part_aug_ele_nova_radiation",
    "idRaw": "243:40",
    "id": 40,
    "family": 243
  },
  {
    "code": "repair_kit.part_aug_unique_geigerroid_corrosive_sec",
    "idRaw": "243:119",
    "id": 119,
    "family": 243
  },
  {
    "code": "repair_kit.part_aug_unique_geigerroid_cryo_sec",
    "idRaw": "243:118",
    "id": 118,
    "family": 243
  },
  {
    "code": "repair_kit.part_aug_unique_geigerroid_fire_sec",
    "idRaw": "243:117",
    "id": 117,
    "family": 243
  },
  {
    "code": "repair_kit.part_aug_unique_geigerroid_radiation_sec",
    "idRaw": "243:116",
    "id": 116,
    "family": 243
  },
  {
    "code": "repair_kit.part_aug_unique_geigerroid_shock_sec",
    "idRaw": "243:115",
    "id": 115,
    "family": 243
  },
  {
    "code": "repair_kit.part_firmware_active_fire",
    "idRaw": "243:114",
    "id": 114,
    "family": 243
  },
  {
    "code": "repair_kit.part_firmware_bruiser",
    "idRaw": "243:120",
    "id": 120,
    "family": 243
  },
  {
    "code": "shield.comp_01_common",
    "idRaw": "246:59",
    "id": 59,
    "family": 246
  },
  {
    "code": "shield.comp_02_uncommon",
    "idRaw": "246:60",
    "id": 60,
    "family": 246
  },
  {
    "code": "shield.comp_03_rare",
    "idRaw": "246:61",
    "id": 61,
    "family": 246
  },
  {
    "code": "shield.comp_04_epic",
    "idRaw": "246:62",
    "id": 62,
    "family": 246
  },
  {
    "code": "shield.comp_05_legendary",
    "idRaw": "246:63",
    "id": 63,
    "family": 246
  },
  {
    "code": "shield.part_firmware_active_fire",
    "idRaw": "246:66",
    "id": 66,
    "family": 246
  },
  {
    "code": "shield.part_firmware_bruiser",
    "idRaw": "246:67",
    "id": 67,
    "family": 246
  },
  {
    "code": "ted_ar.comp_05_legendary",
    "idRaw": "14:37",
    "id": 37,
    "family": 14
  },
  {
    "code": "ted_ar.comp_nudge_weapon",
    "idRaw": "14:38",
    "id": 38,
    "family": 14
  },
  {
    "code": "ted_grenade_gadget.comp_05_legendary",
    "idRaw": "311:5",
    "id": 5,
    "family": 311
  },
  {
    "code": "ted_grenade_gadget.comp_05_legendary_ordinance",
    "idRaw": "311:13",
    "id": 13,
    "family": 311
  },
  {
    "code": "ted_grenade_gadget.part_ordinance",
    "idRaw": "311:14",
    "id": 14,
    "family": 311
  },
  {
    "code": "ted_ps.comp_05_legendary",
    "idRaw": "5:13",
    "id": 13,
    "family": 5
  },
  {
    "code": "ted_ps.part_barrel_01_shammy",
    "idRaw": "5:88",
    "id": 88,
    "family": 5
  },
  {
    "code": "ted_ps.part_mag_torgue_normal_inscriber",
    "idRaw": "5:84",
    "id": 84,
    "family": 5
  },
  {
    "code": "ted_sg.comp_05_legendary",
    "idRaw": "11:1",
    "id": 1,
    "family": 11
  },
  {
    "code": "ted_sg.part_barrel_01_sharkbait",
    "idRaw": "11:89",
    "id": 89,
    "family": 11
  },
  {
    "code": "ted_sg.part_grip_05a_ted_legs_mirv_sharkbait",
    "idRaw": "11:87",
    "id": 87,
    "family": 11
  },
  {
    "code": "ted_sg.part_grip_05a_ted_legs_sharkbait",
    "idRaw": "11:88",
    "id": 88,
    "family": 11
  },
  {
    "code": "ted_sg.part_grip_05b_ted_homing_sharkbait",
    "idRaw": "11:86",
    "id": 86,
    "family": 11
  },
  {
    "code": "ted_sg.part_grip_05c_ted_jav_sharkbait",
    "idRaw": "11:85",
    "id": 85,
    "family": 11
  },
  {
    "code": "ted_sg.part_mag_torgue_normal_sharkbait",
    "idRaw": "11:84",
    "id": 84,
    "family": 11
  },
  {
    "code": "ted_sg.part_mag_torgue_sticky_sharkbait",
    "idRaw": "11:83",
    "id": 83,
    "family": 11
  },
  {
    "code": "ted_shield.comp_05_legendary",
    "idRaw": "287:5",
    "id": 5,
    "family": 287
  },
  {
    "code": "ted_shield.part_body_hopscotch",
    "idRaw": "287:12",
    "id": 12,
    "family": 287
  },
  {
    "code": "ted_shield.part_body_pocketbuddies",
    "idRaw": "287:13",
    "id": 13,
    "family": 287
  },
  {
    "code": "ted_terminal_barrier.comp_01_common",
    "idRaw": "325:2",
    "id": 2,
    "family": 325
  },
  {
    "code": "ted_terminal_barrier.comp_02_uncommon",
    "idRaw": "325:3",
    "id": 3,
    "family": 325
  },
  {
    "code": "ted_terminal_barrier.comp_03_rare",
    "idRaw": "325:4",
    "id": 4,
    "family": 325
  },
  {
    "code": "ted_terminal_barrier.comp_04_epic",
    "idRaw": "325:5",
    "id": 5,
    "family": 325
  },
  {
    "code": "ted_terminal_barrier.comp_05_legendary",
    "idRaw": "325:6",
    "id": 6,
    "family": 325
  },
  {
    "code": "ted_terminal_barrier.comp_05_sitrep",
    "idRaw": "325:7",
    "id": 7,
    "family": 325
  },
  {
    "code": "ted_terminal_barrier.part_body",
    "idRaw": "325:1",
    "id": 1,
    "family": 325
  },
  {
    "code": "ted_turret_gadget.comp_01_common",
    "idRaw": "377:1",
    "id": 1,
    "family": 377
  },
  {
    "code": "ted_turret_gadget.comp_02_uncommon",
    "idRaw": "377:2",
    "id": 2,
    "family": 377
  },
  {
    "code": "ted_turret_gadget.comp_03_rare",
    "idRaw": "377:3",
    "id": 3,
    "family": 377
  },
  {
    "code": "ted_turret_gadget.comp_04_epic",
    "idRaw": "377:4",
    "id": 4,
    "family": 377
  },
  {
    "code": "ted_turret_gadget.comp_05_legendary",
    "idRaw": "377:5",
    "id": 5,
    "family": 377
  },
  {
    "code": "ted_turret_gadget.part_ele_control",
    "idRaw": "377:6",
    "id": 6,
    "family": 377
  },
  {
    "code": "terminal_gadget_barrier.part_active_sit_rep",
    "idRaw": "280:1",
    "id": 1,
    "family": 280
  },
  {
    "code": "terminal_gadget_combat.part_hot_off_the_press",
    "idRaw": "295:2",
    "id": 2,
    "family": 295
  },
  {
    "code": "terminal_gadget_combat.part_me_layhem",
    "idRaw": "295:1",
    "id": 1,
    "family": 295
  },
  {
    "code": "terminal_gadget_combat.part_nova_bomb_active",
    "idRaw": "295:3",
    "id": 3,
    "family": 295
  },
  {
    "code": "terminal_gadget_healing.part_active_bogo",
    "idRaw": "297:2",
    "id": 2,
    "family": 297
  },
  {
    "code": "terminal_gadget_healing.part_active_healer_on_the_go",
    "idRaw": "297:1",
    "id": 1,
    "family": 297
  },
  {
    "code": "terminal_gadget_healing.part_active_shield_stabilizer",
    "idRaw": "297:3",
    "id": 3,
    "family": 297
  },
  {
    "code": "terminal_gadget.comp_01_common",
    "idRaw": "294:61",
    "id": 61,
    "family": 294
  },
  {
    "code": "terminal_gadget.comp_02_uncommon",
    "idRaw": "294:62",
    "id": 62,
    "family": 294
  },
  {
    "code": "terminal_gadget.comp_03_rare",
    "idRaw": "294:63",
    "id": 63,
    "family": 294
  },
  {
    "code": "terminal_gadget.comp_04_epic",
    "idRaw": "294:64",
    "id": 64,
    "family": 294
  },
  {
    "code": "terminal_gadget.comp_05_legendary",
    "idRaw": "294:65",
    "id": 65,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_endgame_gadget_used_damage",
    "idRaw": "294:66",
    "id": 66,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_enemy_corrosive",
    "idRaw": "294:1",
    "id": 1,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_enemy_cryo",
    "idRaw": "294:2",
    "id": 2,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_barrier_barred_aggression",
    "idRaw": "294:25",
    "id": 25,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_barrier_bullet_amp_gate",
    "idRaw": "294:21",
    "id": 21,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_barrier_dome",
    "idRaw": "294:20",
    "id": 20,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_barrier_elemental_field_corrosive",
    "idRaw": "294:28",
    "id": 28,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_barrier_elemental_field_cryo",
    "idRaw": "294:27",
    "id": 27,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_barrier_elemental_field_fire",
    "idRaw": "294:26",
    "id": 26,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_barrier_elemental_field_radiation",
    "idRaw": "294:31",
    "id": 31,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_barrier_elemental_field_shock",
    "idRaw": "294:29",
    "id": 29,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_barrier_elemental_field_sonic",
    "idRaw": "294:30",
    "id": 30,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_barrier_health",
    "idRaw": "294:19",
    "id": 19,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_barrier_reflection",
    "idRaw": "294:22",
    "id": 22,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_barrier_scopes_up",
    "idRaw": "294:24",
    "id": 24,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_barrier_speed_gate",
    "idRaw": "294:23",
    "id": 23,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_combat_cold_shoulder",
    "idRaw": "294:18",
    "id": 18,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_combat_contamination",
    "idRaw": "294:13",
    "id": 13,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_combat_kill_clip",
    "idRaw": "294:15",
    "id": 15,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_combat_orbiting",
    "idRaw": "294:17",
    "id": 17,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_combat_potency",
    "idRaw": "294:11",
    "id": 11,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_combat_radius",
    "idRaw": "294:12",
    "id": 12,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_combat_reverb",
    "idRaw": "294:14",
    "id": 14,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_combat_to_the_nth",
    "idRaw": "294:16",
    "id": 16,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_healing_iron_skin",
    "idRaw": "294:8",
    "id": 8,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_healing_leech_seed",
    "idRaw": "294:7",
    "id": 7,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_healing_life_steal",
    "idRaw": "294:6",
    "id": 6,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_healing_overshield",
    "idRaw": "294:3",
    "id": 3,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_healing_potency",
    "idRaw": "294:10",
    "id": 10,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_healing_radius",
    "idRaw": "294:9",
    "id": 9,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_healing_shield_recharger",
    "idRaw": "294:5",
    "id": 5,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_primary_healing_thorns",
    "idRaw": "294:4",
    "id": 4,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_barrier_barred_aggression",
    "idRaw": "294:60",
    "id": 60,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_barrier_bullet_amp_gate",
    "idRaw": "294:59",
    "id": 59,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_barrier_dome",
    "idRaw": "294:58",
    "id": 58,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_barrier_elemental_field_corrosive",
    "idRaw": "294:54",
    "id": 54,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_barrier_elemental_field_cryo",
    "idRaw": "294:53",
    "id": 53,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_barrier_elemental_field_fire",
    "idRaw": "294:52",
    "id": 52,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_barrier_elemental_field_radiation",
    "idRaw": "294:57",
    "id": 57,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_barrier_elemental_field_shock",
    "idRaw": "294:55",
    "id": 55,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_barrier_elemental_field_sonic",
    "idRaw": "294:56",
    "id": 56,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_barrier_health",
    "idRaw": "294:48",
    "id": 48,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_barrier_reflection",
    "idRaw": "294:51",
    "id": 51,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_barrier_scopes_up",
    "idRaw": "294:50",
    "id": 50,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_barrier_speed_gate",
    "idRaw": "294:49",
    "id": 49,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_combat_cold_shoulder",
    "idRaw": "294:47",
    "id": 47,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_combat_contamination",
    "idRaw": "294:46",
    "id": 46,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_combat_kill_clip",
    "idRaw": "294:45",
    "id": 45,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_combat_orbiting",
    "idRaw": "294:44",
    "id": 44,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_combat_potency",
    "idRaw": "294:40",
    "id": 40,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_combat_radius",
    "idRaw": "294:41",
    "id": 41,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_combat_reverb",
    "idRaw": "294:43",
    "id": 43,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_combat_to_the_nth",
    "idRaw": "294:42",
    "id": 42,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_healing_iron_skin",
    "idRaw": "294:37",
    "id": 37,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_healing_leech_seed",
    "idRaw": "294:36",
    "id": 36,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_healing_life_steal",
    "idRaw": "294:35",
    "id": 35,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_healing_overshield",
    "idRaw": "294:32",
    "id": 32,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_healing_potency",
    "idRaw": "294:39",
    "id": 39,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_healing_radius",
    "idRaw": "294:38",
    "id": 38,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_healing_shield_recharge",
    "idRaw": "294:34",
    "id": 34,
    "family": 294
  },
  {
    "code": "terminal_gadget.part_secondary_healing_thorns",
    "idRaw": "294:33",
    "id": 33,
    "family": 294
  },
  {
    "code": "tor_ar.comp_05_legendary",
    "idRaw": "17:2",
    "id": 2,
    "family": 17
  },
  {
    "code": "tor_ar.part_barrel_lockjaw",
    "idRaw": "17:84",
    "id": 84,
    "family": 17
  },
  {
    "code": "tor_grenade_gadget.comp_05_legendary",
    "idRaw": "298:5",
    "id": 5,
    "family": 298
  },
  {
    "code": "tor_hw.comp_05_legendary",
    "idRaw": "273:13",
    "id": 13,
    "family": 273
  },
  {
    "code": "tor_hw.comp_05_legendary_dahlfather",
    "idRaw": "273:43",
    "id": 43,
    "family": 273
  },
  {
    "code": "tor_hw.part_barrel_01_ted_sg_heavyturret",
    "idRaw": "273:41",
    "id": 41,
    "family": 273
  },
  {
    "code": "tor_hw.part_barrel_dahlfather",
    "idRaw": "273:42",
    "id": 42,
    "family": 273
  },
  {
    "code": "tor_hw.part_normal",
    "idRaw": "273:19",
    "id": 19,
    "family": 273
  },
  {
    "code": "tor_ps.comp_05_legendary",
    "idRaw": "6:55",
    "id": 55,
    "family": 6
  },
  {
    "code": "tor_ps.comp_05_legendary_scootshoot",
    "idRaw": "6:57",
    "id": 57,
    "family": 6
  },
  {
    "code": "tor_ps.comp_06_pearl_herald",
    "idRaw": "6:85",
    "id": 85,
    "family": 6
  },
  {
    "code": "tor_ps.part_barrel_01_herald",
    "idRaw": "6:86",
    "id": 86,
    "family": 6
  },
  {
    "code": "tor_ps.part_barrel_02_scootshoot",
    "idRaw": "6:56",
    "id": 56,
    "family": 6
  },
  {
    "code": "tor_ps.part_foregrip_01_herald",
    "idRaw": "6:84",
    "id": 84,
    "family": 6
  },
  {
    "code": "tor_ps.part_foregrip_02_herald",
    "idRaw": "6:83",
    "id": 83,
    "family": 6
  },
  {
    "code": "tor_ps.part_foregrip_03_herald",
    "idRaw": "6:82",
    "id": 82,
    "family": 6
  },
  {
    "code": "tor_sg.comp_05_legendary",
    "idRaw": "12:55",
    "id": 55,
    "family": 12
  },
  {
    "code": "tor_sg.comp_05_legendary_unstable_kor",
    "idRaw": "12:77",
    "id": 77,
    "family": 12
  },
  {
    "code": "tor_sg.part_barrel_01_unstable_kor",
    "idRaw": "12:76",
    "id": 76,
    "family": 12
  },
  {
    "code": "tor_sg.part_barrel_02_cormano",
    "idRaw": "12:84",
    "id": 84,
    "family": 12
  },
  {
    "code": "tor_sg.part_foregrip_01_cormano",
    "idRaw": "12:82",
    "id": 82,
    "family": 12
  },
  {
    "code": "tor_sg.part_foregrip_01_unstable_kor",
    "idRaw": "12:75",
    "id": 75,
    "family": 12
  },
  {
    "code": "tor_sg.part_foregrip_02_cormano",
    "idRaw": "12:81",
    "id": 81,
    "family": 12
  },
  {
    "code": "tor_sg.part_foregrip_02_unstable_kor",
    "idRaw": "12:60",
    "id": 60,
    "family": 12
  },
  {
    "code": "tor_sg.part_foregrip_03_cormano",
    "idRaw": "12:80",
    "id": 80,
    "family": 12
  },
  {
    "code": "tor_sg.part_foregrip_03_unstable_kor",
    "idRaw": "12:59",
    "id": 59,
    "family": 12
  },
  {
    "code": "tor_shield.comp_05_legendary",
    "idRaw": "321:5",
    "id": 5,
    "family": 321
  },
  {
    "code": "tor_terminal_combat.comp_01_common",
    "idRaw": "327:2",
    "id": 2,
    "family": 327
  },
  {
    "code": "tor_terminal_combat.comp_02_uncommon",
    "idRaw": "327:3",
    "id": 3,
    "family": 327
  },
  {
    "code": "tor_terminal_combat.comp_03_rare",
    "idRaw": "327:4",
    "id": 4,
    "family": 327
  },
  {
    "code": "tor_terminal_combat.comp_04_epic",
    "idRaw": "327:5",
    "id": 5,
    "family": 327
  },
  {
    "code": "tor_terminal_combat.comp_05_legendary",
    "idRaw": "327:6",
    "id": 6,
    "family": 327
  },
  {
    "code": "tor_terminal_combat.comp_05_novabomb",
    "idRaw": "327:7",
    "id": 7,
    "family": 327
  },
  {
    "code": "tor_terminal_combat.part_body",
    "idRaw": "327:1",
    "id": 1,
    "family": 327
  },
  {
    "code": "tor_turret_gadget.comp_01_common",
    "idRaw": "378:1",
    "id": 1,
    "family": 378
  },
  {
    "code": "tor_turret_gadget.comp_02_uncommon",
    "idRaw": "378:2",
    "id": 2,
    "family": 378
  },
  {
    "code": "tor_turret_gadget.comp_03_rare",
    "idRaw": "378:3",
    "id": 3,
    "family": 378
  },
  {
    "code": "tor_turret_gadget.comp_04_epic",
    "idRaw": "378:4",
    "id": 4,
    "family": 378
  },
  {
    "code": "tor_turret_gadget.comp_05_legendary",
    "idRaw": "378:5",
    "id": 5,
    "family": 378
  },
  {
    "code": "tor_turret_gadget.part_ele_control",
    "idRaw": "378:6",
    "id": 6,
    "family": 378
  },
  {
    "code": "turret_gadget.comp_01_common",
    "idRaw": "288:52",
    "id": 52,
    "family": 288
  },
  {
    "code": "turret_gadget.comp_02_uncommon",
    "idRaw": "288:53",
    "id": 53,
    "family": 288
  },
  {
    "code": "turret_gadget.comp_03_rare",
    "idRaw": "288:54",
    "id": 54,
    "family": 288
  },
  {
    "code": "turret_gadget.comp_04_epic",
    "idRaw": "288:55",
    "id": 55,
    "family": 288
  },
  {
    "code": "turret_gadget.comp_05_legendary",
    "idRaw": "288:56",
    "id": 56,
    "family": 288
  },
  {
    "code": "turret_gadget.part_01_basic_gun",
    "idRaw": "288:12",
    "id": 12,
    "family": 288
  },
  {
    "code": "turret_gadget.part_02_chaingun",
    "idRaw": "288:13",
    "id": 13,
    "family": 288
  },
  {
    "code": "turret_gadget.part_03_longrifle",
    "idRaw": "288:14",
    "id": 14,
    "family": 288
  },
  {
    "code": "turret_gadget.part_04_shotgun",
    "idRaw": "288:15",
    "id": 15,
    "family": 288
  },
  {
    "code": "turret_gadget.part_05_rocketlauncher",
    "idRaw": "288:16",
    "id": 16,
    "family": 288
  },
  {
    "code": "turret_gadget.part_06_beam",
    "idRaw": "288:17",
    "id": 17,
    "family": 288
  },
  {
    "code": "turret_gadget.part_anointed_movement_speed",
    "idRaw": "288:51",
    "id": 51,
    "family": 288
  },
  {
    "code": "turret_gadget.part_body_01_ground",
    "idRaw": "288:2",
    "id": 2,
    "family": 288
  },
  {
    "code": "turret_gadget.part_body_02_floating",
    "idRaw": "288:3",
    "id": 3,
    "family": 288
  },
  {
    "code": "turret_gadget.part_body_03_maglock",
    "idRaw": "288:4",
    "id": 4,
    "family": 288
  },
  {
    "code": "turret_gadget.part_corrosive",
    "idRaw": "288:6",
    "id": 6,
    "family": 288
  },
  {
    "code": "turret_gadget.part_cryo",
    "idRaw": "288:7",
    "id": 7,
    "family": 288
  },
  {
    "code": "turret_gadget.part_endgame_gadgetused_damage_turret",
    "idRaw": "288:1",
    "id": 1,
    "family": 288
  },
  {
    "code": "turret_gadget.part_endgame_none",
    "idRaw": "288:57",
    "id": 57,
    "family": 288
  },
  {
    "code": "turret_gadget.part_fire",
    "idRaw": "288:8",
    "id": 8,
    "family": 288
  },
  {
    "code": "turret_gadget.part_normal",
    "idRaw": "288:5",
    "id": 5,
    "family": 288
  },
  {
    "code": "turret_gadget.part_primary_01_cooldown",
    "idRaw": "288:18",
    "id": 18,
    "family": 288
  },
  {
    "code": "turret_gadget.part_primary_02_damage",
    "idRaw": "288:19",
    "id": 19,
    "family": 288
  },
  {
    "code": "turret_gadget.part_primary_03_fire_rate",
    "idRaw": "288:20",
    "id": 20,
    "family": 288
  },
  {
    "code": "turret_gadget.part_primary_04_targeting",
    "idRaw": "288:21",
    "id": 21,
    "family": 288
  },
  {
    "code": "turret_gadget.part_primary_05_elemental_power",
    "idRaw": "288:22",
    "id": 22,
    "family": 288
  },
  {
    "code": "turret_gadget.part_primary_06_duration",
    "idRaw": "288:23",
    "id": 23,
    "family": 288
  },
  {
    "code": "turret_gadget.part_primary_07_accuracy",
    "idRaw": "288:24",
    "id": 24,
    "family": 288
  },
  {
    "code": "turret_gadget.part_primary_08_armor",
    "idRaw": "288:25",
    "id": 25,
    "family": 288
  },
  {
    "code": "turret_gadget.part_primary_09_deployed_detonation",
    "idRaw": "288:26",
    "id": 26,
    "family": 288
  },
  {
    "code": "turret_gadget.part_primary_10_welterweight",
    "idRaw": "288:27",
    "id": 27,
    "family": 288
  },
  {
    "code": "turret_gadget.part_radiation",
    "idRaw": "288:9",
    "id": 9,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_01_double_turret",
    "idRaw": "288:28",
    "id": 28,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_02_second_weapon_01_basic_gun",
    "idRaw": "288:29",
    "id": 29,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_02_second_weapon_02_chaingun",
    "idRaw": "288:30",
    "id": 30,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_02_second_weapon_03_longbarrel",
    "idRaw": "288:31",
    "id": 31,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_02_second_weapon_04_shotgun",
    "idRaw": "288:32",
    "id": 32,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_02_second_weapon_05_rocket",
    "idRaw": "288:33",
    "id": 33,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_02_second_weapon_06_beam",
    "idRaw": "288:34",
    "id": 34,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_03_mortar",
    "idRaw": "288:35",
    "id": 35,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_04_railgun",
    "idRaw": "288:36",
    "id": 36,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_05_pierce",
    "idRaw": "288:37",
    "id": 37,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_06_critical_chance",
    "idRaw": "288:38",
    "id": 38,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_07_thorns",
    "idRaw": "288:39",
    "id": 39,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_08_two_shot",
    "idRaw": "288:40",
    "id": 40,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_09_kill_streak",
    "idRaw": "288:41",
    "id": 41,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_10_bouncing_grenades",
    "idRaw": "288:42",
    "id": 42,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_11_cooldown",
    "idRaw": "288:43",
    "id": 43,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_12_damage",
    "idRaw": "288:44",
    "id": 44,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_13_fire_rate",
    "idRaw": "288:45",
    "id": 45,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_14_targeting",
    "idRaw": "288:46",
    "id": 46,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_15_elemental_power",
    "idRaw": "288:47",
    "id": 47,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_16_duration",
    "idRaw": "288:48",
    "id": 48,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_17_accuracy",
    "idRaw": "288:49",
    "id": 49,
    "family": 288
  },
  {
    "code": "turret_gadget.part_secondary_19_deployed_detonation",
    "idRaw": "288:50",
    "id": 50,
    "family": 288
  },
  {
    "code": "turret_gadget.part_shock",
    "idRaw": "288:10",
    "id": 10,
    "family": 288
  },
  {
    "code": "turret_gadget.part_sonic",
    "idRaw": "288:11",
    "id": 11,
    "family": 288
  },
  {
    "code": "turret_weapon_basic.comp_turret_weapon",
    "idRaw": "376:4",
    "id": 4,
    "family": 376
  },
  {
    "code": "turret_weapon_basic.part_body",
    "idRaw": "376:3",
    "id": 3,
    "family": 376
  },
  {
    "code": "turret_weapon_basic.part_normal",
    "idRaw": "376:2",
    "id": 2,
    "family": 376
  },
  {
    "code": "turret_weapon_basic.part_turretweapon_underbarrel_basic",
    "idRaw": "376:5",
    "id": 5,
    "family": 376
  },
  {
    "code": "turret_weapon_beam.comp_turret_weapon",
    "idRaw": "379:6",
    "id": 6,
    "family": 379
  },
  {
    "code": "turret_weapon_beam.comp_turret_weapon_beam_anchor",
    "idRaw": "379:3",
    "id": 3,
    "family": 379
  },
  {
    "code": "turret_weapon_beam.part_body",
    "idRaw": "379:5",
    "id": 5,
    "family": 379
  },
  {
    "code": "turret_weapon_beam.part_body_anchor",
    "idRaw": "379:2",
    "id": 2,
    "family": 379
  },
  {
    "code": "turret_weapon_beam.part_normal",
    "idRaw": "379:4",
    "id": 4,
    "family": 379
  },
  {
    "code": "turret_weapon_beam.part_turretweapon_beam_pierce",
    "idRaw": "379:1",
    "id": 1,
    "family": 379
  },
  {
    "code": "turret_weapon_beam.part_turretweapon_beam_underbarrel",
    "idRaw": "379:7",
    "id": 7,
    "family": 379
  },
  {
    "code": "turret_weapon_chaingun.comp_turret_weapon",
    "idRaw": "304:5",
    "id": 5,
    "family": 304
  },
  {
    "code": "turret_weapon_chaingun.part_body",
    "idRaw": "304:4",
    "id": 4,
    "family": 304
  },
  {
    "code": "turret_weapon_chaingun.part_normal",
    "idRaw": "304:3",
    "id": 3,
    "family": 304
  },
  {
    "code": "turret_weapon_chaingun.part_turretweapon_chaingun_pierce",
    "idRaw": "304:2",
    "id": 2,
    "family": 304
  },
  {
    "code": "turret_weapon_chaingun.part_turretweapon_chaingun_underbarrel",
    "idRaw": "304:1",
    "id": 1,
    "family": 304
  },
  {
    "code": "turret_weapon_longrifle.comp_turret_weapon",
    "idRaw": "308:4",
    "id": 4,
    "family": 308
  },
  {
    "code": "turret_weapon_longrifle.part_body",
    "idRaw": "308:3",
    "id": 3,
    "family": 308
  },
  {
    "code": "turret_weapon_longrifle.part_normal",
    "idRaw": "308:2",
    "id": 2,
    "family": 308
  },
  {
    "code": "turret_weapon_longrifle.part_turretweapon_longrifle_pierce",
    "idRaw": "308:1",
    "id": 1,
    "family": 308
  },
  {
    "code": "turret_weapon_longrifle.part_turretweapon_longrifle_underbarrel",
    "idRaw": "308:5",
    "id": 5,
    "family": 308
  },
  {
    "code": "turret_weapon_rocketlauncher.comp_turret_weapon",
    "idRaw": "320:5",
    "id": 5,
    "family": 320
  },
  {
    "code": "turret_weapon_rocketlauncher.part_body",
    "idRaw": "320:4",
    "id": 4,
    "family": 320
  },
  {
    "code": "turret_weapon_rocketlauncher.part_normal",
    "idRaw": "320:3",
    "id": 3,
    "family": 320
  },
  {
    "code": "turret_weapon_rocketlauncher.part_turretweapon_rl_pierce",
    "idRaw": "320:2",
    "id": 2,
    "family": 320
  },
  {
    "code": "turret_weapon_rocketlauncher.part_turretweapon_rl_underbarrel",
    "idRaw": "320:1",
    "id": 1,
    "family": 320
  },
  {
    "code": "turret_weapon_shotgun.comp_turret_weapon",
    "idRaw": "324:5",
    "id": 5,
    "family": 324
  },
  {
    "code": "turret_weapon_shotgun.part_body",
    "idRaw": "324:4",
    "id": 4,
    "family": 324
  },
  {
    "code": "turret_weapon_shotgun.part_normal",
    "idRaw": "324:3",
    "id": 3,
    "family": 324
  },
  {
    "code": "turret_weapon_shotgun.part_turretweapon_sg_underbarrel",
    "idRaw": "324:1",
    "id": 1,
    "family": 324
  },
  {
    "code": "turret_weapon_shotgun.part_turretweapon_shotgun_pierce",
    "idRaw": "324:2",
    "id": 2,
    "family": 324
  },
  {
    "code": "vla_ar.comp_05_legendary",
    "idRaw": "18:68",
    "id": 68,
    "family": 18
  },
  {
    "code": "vla_ar.comp_05_legendary_lasercutter",
    "idRaw": "18:103",
    "id": 103,
    "family": 18
  },
  {
    "code": "vla_ar.part_barrel_01_lasercutter",
    "idRaw": "18:102",
    "id": 102,
    "family": 18
  },
  {
    "code": "vla_ar.part_underbarrel_07_secondbarrel_lasercutter",
    "idRaw": "18:101",
    "id": 101,
    "family": 18
  },
  {
    "code": "vla_grenade_gadget.comp_05_legendary",
    "idRaw": "291:5",
    "id": 5,
    "family": 291
  },
  {
    "code": "vla_grenade_gadget.comp_05_legendary_barb",
    "idRaw": "291:12",
    "id": 12,
    "family": 291
  },
  {
    "code": "vla_grenade_gadget.part_barb",
    "idRaw": "291:11",
    "id": 11,
    "family": 291
  },
  {
    "code": "vla_hw.comp_05_legendary",
    "idRaw": "282:3",
    "id": 3,
    "family": 282
  },
  {
    "code": "vla_hw.part_barrel_02_flak",
    "idRaw": "282:30",
    "id": 30,
    "family": 282
  },
  {
    "code": "vla_hw.part_normal",
    "idRaw": "282:11",
    "id": 11,
    "family": 282
  },
  {
    "code": "vla_shield.comp_05_legendary",
    "idRaw": "283:5",
    "id": 5,
    "family": 283
  },
  {
    "code": "vla_sm.comp_05_legendary",
    "idRaw": "22:39",
    "id": 39,
    "family": 22
  },
  {
    "code": "vla_sm.comp_06_pearl_locust",
    "idRaw": "22:101",
    "id": 101,
    "family": 22
  },
  {
    "code": "vla_sm.part_barrel_brickhouse",
    "idRaw": "22:93",
    "id": 93,
    "family": 22
  },
  {
    "code": "vla_sm.part_barrel_locust",
    "idRaw": "22:103",
    "id": 103,
    "family": 22
  },
  {
    "code": "vla_sm.part_mag_torgue_normal_locust",
    "idRaw": "22:100",
    "id": 100,
    "family": 22
  },
  {
    "code": "vla_sm.part_mag_torgue_sticky_locust",
    "idRaw": "22:99",
    "id": 99,
    "family": 22
  },
  {
    "code": "vla_sm.part_underbarrel_uni_locust_rocket",
    "idRaw": "22:102",
    "id": 102,
    "family": 22
  },
  {
    "code": "vla_sr.comp_05_legendary",
    "idRaw": "16:70",
    "id": 70,
    "family": 16
  },
  {
    "code": "vla_sr.comp_05_legendary_hemorrhage",
    "idRaw": "16:88",
    "id": 88,
    "family": 16
  },
  {
    "code": "vla_sr.part_barrel_01_hemorrhage",
    "idRaw": "16:87",
    "id": 87,
    "family": 16
  },
  {
    "code": "vla_sr.part_barrel_01_lightgun",
    "idRaw": "16:90",
    "id": 90,
    "family": 16
  },
  {
    "code": "vla_terminal_barrier.comp_01_common",
    "idRaw": "328:1",
    "id": 1,
    "family": 328
  },
  {
    "code": "vla_terminal_barrier.comp_02_uncommon",
    "idRaw": "328:2",
    "id": 2,
    "family": 328
  },
  {
    "code": "vla_terminal_barrier.comp_03_rare",
    "idRaw": "328:3",
    "id": 3,
    "family": 328
  },
  {
    "code": "vla_terminal_barrier.comp_04_epic",
    "idRaw": "328:4",
    "id": 4,
    "family": 328
  },
  {
    "code": "vla_terminal_barrier.comp_05_legendary",
    "idRaw": "328:5",
    "id": 5,
    "family": 328
  },
  {
    "code": "vla_terminal_barrier.part_body",
    "idRaw": "328:6",
    "id": 6,
    "family": 328
  },
  {
    "code": "vla_turret_gadget.comp_01_common",
    "idRaw": "323:1",
    "id": 1,
    "family": 323
  },
  {
    "code": "vla_turret_gadget.comp_02_uncommon",
    "idRaw": "323:2",
    "id": 2,
    "family": 323
  },
  {
    "code": "vla_turret_gadget.comp_03_rare",
    "idRaw": "323:3",
    "id": 3,
    "family": 323
  },
  {
    "code": "vla_turret_gadget.comp_04_epic",
    "idRaw": "323:4",
    "id": 4,
    "family": 323
  },
  {
    "code": "vla_turret_gadget.comp_05_legendary",
    "idRaw": "323:5",
    "id": 5,
    "family": 323
  },
  {
    "code": "vla_turret_gadget.part_ele_control",
    "idRaw": "323:6",
    "id": 6,
    "family": 323
  },
  {
    "code": "weapon_ar.comp_01_common",
    "idRaw": "276:4",
    "id": 4,
    "family": 276
  },
  {
    "code": "weapon_ar.comp_02_uncommon",
    "idRaw": "276:3",
    "id": 3,
    "family": 276
  },
  {
    "code": "weapon_ar.comp_03_rare",
    "idRaw": "276:2",
    "id": 2,
    "family": 276
  },
  {
    "code": "weapon_ar.comp_04_epic",
    "idRaw": "276:1",
    "id": 1,
    "family": 276
  },
  {
    "code": "weapon_ar.comp_05_legendary",
    "idRaw": "276:5",
    "id": 5,
    "family": 276
  },
  {
    "code": "weapon_brute_facelaser.comp_badass",
    "idRaw": "387:3",
    "id": 3,
    "family": 387
  },
  {
    "code": "weapon_brute_facelaser.comp_brute_facelaser",
    "idRaw": "387:6",
    "id": 6,
    "family": 387
  },
  {
    "code": "weapon_brute_facelaser.comp_cannon",
    "idRaw": "387:4",
    "id": 4,
    "family": 387
  },
  {
    "code": "weapon_brute_facelaser.comp_missile",
    "idRaw": "387:8",
    "id": 8,
    "family": 387
  },
  {
    "code": "weapon_brute_facelaser.part_body",
    "idRaw": "387:7",
    "id": 7,
    "family": 387
  },
  {
    "code": "weapon_brute_facelaser.part_body_badass",
    "idRaw": "387:2",
    "id": 2,
    "family": 387
  },
  {
    "code": "weapon_brute_facelaser.part_body_cannon",
    "idRaw": "387:5",
    "id": 5,
    "family": 387
  },
  {
    "code": "weapon_brute_facelaser.part_body_missile",
    "idRaw": "387:1",
    "id": 1,
    "family": 387
  },
  {
    "code": "weapon_dahlmech_chaingun.comp_dahlmech_chaingun",
    "idRaw": "418:2",
    "id": 2,
    "family": 418
  },
  {
    "code": "weapon_dahlmech_chaingun.part_body",
    "idRaw": "418:1",
    "id": 1,
    "family": 418
  },
  {
    "code": "weapon_dahlmech_emp.comp_dahlmech_emp",
    "idRaw": "419:1",
    "id": 1,
    "family": 419
  },
  {
    "code": "weapon_dahlmech_emp.part_body",
    "idRaw": "419:2",
    "id": 2,
    "family": 419
  },
  {
    "code": "weapon_dahlmech_energygun.comp_dahlmech_energygun",
    "idRaw": "471:1",
    "id": 1,
    "family": 471
  },
  {
    "code": "weapon_dahlmech_energygun.part_body",
    "idRaw": "471:2",
    "id": 2,
    "family": 471
  },
  {
    "code": "weapon_dahlmech_flamespitter.comp_dahlmech_flamespitter",
    "idRaw": "420:1",
    "id": 1,
    "family": 420
  },
  {
    "code": "weapon_dahlmech_flamespitter.part_body",
    "idRaw": "420:2",
    "id": 2,
    "family": 420
  },
  {
    "code": "weapon_dahlmech_flamespitterunderbarrel.comp_dahlmech_flamespitter",
    "idRaw": "459:1",
    "id": 1,
    "family": 459
  },
  {
    "code": "weapon_dahlmech_flamespitterunderbarrel.part_body",
    "idRaw": "459:2",
    "id": 2,
    "family": 459
  },
  {
    "code": "weapon_dahlmech_grenadelauncher.comp_dahlmech_grenadelauncher",
    "idRaw": "421:1",
    "id": 1,
    "family": 421
  },
  {
    "code": "weapon_dahlmech_grenadelauncher.part_body",
    "idRaw": "421:2",
    "id": 2,
    "family": 421
  },
  {
    "code": "weapon_gunship_maingun.comp_gunship_maingun",
    "idRaw": "388:1",
    "id": 1,
    "family": 388
  },
  {
    "code": "weapon_gunship_maingun.part_body",
    "idRaw": "388:2",
    "id": 2,
    "family": 388
  },
  {
    "code": "weapon_meathead_chaingun.comp_meathead_chaingun",
    "idRaw": "390:1",
    "id": 1,
    "family": 390
  },
  {
    "code": "weapon_meathead_chaingun.part_body",
    "idRaw": "390:2",
    "id": 2,
    "family": 390
  },
  {
    "code": "weapon_meathead_flamethrower.comp_meathead_flamethrower",
    "idRaw": "391:1",
    "id": 1,
    "family": 391
  },
  {
    "code": "weapon_meathead_flamethrower.part_body",
    "idRaw": "391:2",
    "id": 2,
    "family": 391
  },
  {
    "code": "weapon_meathead_rocket.comp_meathead_rocket",
    "idRaw": "383:1",
    "id": 1,
    "family": 383
  },
  {
    "code": "weapon_meathead_rocket.part_body",
    "idRaw": "383:2",
    "id": 2,
    "family": 383
  },
  {
    "code": "weapon_missionturret_chaingun.comp_missionturret_chaingun",
    "idRaw": "382:1",
    "id": 1,
    "family": 382
  },
  {
    "code": "weapon_missionturret_chaingun.part_body",
    "idRaw": "382:2",
    "id": 2,
    "family": 382
  },
  {
    "code": "weapon_orderdrone.comp_camera",
    "idRaw": "389:8",
    "id": 8,
    "family": 389
  },
  {
    "code": "weapon_ripperturret_flamethrower.comp_ripperturret_flamethrower",
    "idRaw": "385:1",
    "id": 1,
    "family": 385
  },
  {
    "code": "weapon_ripperturret_flamethrower.part_body",
    "idRaw": "385:2",
    "id": 2,
    "family": 385
  },
  {
    "code": "weapon_ripperturret_rocket.comp_ripperturret_rocket",
    "idRaw": "386:1",
    "id": 1,
    "family": 386
  },
  {
    "code": "weapon_ripperturret_rocket.part_body",
    "idRaw": "386:2",
    "id": 2,
    "family": 386
  },
  {
    "code": "weapon_splicearm_launcher.comp_splicearm_launcher",
    "idRaw": "392:1",
    "id": 1,
    "family": 392
  },
  {
    "code": "weapon_splicearm_launcher.part_body",
    "idRaw": "392:2",
    "id": 2,
    "family": 392
  },
  {
    "code": "weapon_splicespiderjumbo_rocketgun.part_body",
    "idRaw": "399:1",
    "id": 1,
    "family": 399
  },
  {
    "code": "weapon_turret_dahlchaingun.comp_turret_dahlchaingun",
    "idRaw": "470:1",
    "id": 1,
    "family": 470
  },
  {
    "code": "weapon_turret_dahlchaingun.part_body",
    "idRaw": "470:2",
    "id": 2,
    "family": 470
  },
  {
    "code": "weapon_uberhead.comp_uberhead",
    "idRaw": "491:2",
    "id": 2,
    "family": 491
  },
  {
    "code": "weapon_uberhead.part_body_uberhead",
    "idRaw": "491:1",
    "id": 1,
    "family": 491
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
