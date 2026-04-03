/** save-editor.be part-selection-data.js (PART_SELECTION_DATA, EXCLUSION_TAGS, PART_WEIGHTS, MIN_MAX_PARTS). Tooling reference — not used by bulk validator logic yet. */
(function(){
const PART_SELECTION_DATA = {
  "ATL_Enhancement_common": {
    "body": {
      "parts": [
        "Part_Body_01_Common"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_01_common'"
      }
    }
  },
  "ATL_Enhancement_uncommon": {
    "body": {
      "parts": [
        "Part_Body_02_Uncommon"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_02_uncommon'"
      }
    }
  },
  "ATL_Enhancement_rare": {
    "body": {
      "parts": [
        "Part_Body_03_Rare"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_03_rare'"
      }
    }
  },
  "ATL_Enhancement_epic": {
    "body": {
      "parts": [
        "Part_Body_04_Epic"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_04_epic'"
      }
    }
  },
  "ATL_Enhancement_legendary": {
    "body": {
      "parts": [
        "Part_Body_05_Legendary"
      ],
      "min": 0,
      "max": 1
    },
    "core_augment": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_05_legendary'"
      }
    }
  },
  "BOR_Enhancement_common": {
    "body": {
      "parts": [
        "Part_Body_01_Common"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_01_common'"
      }
    }
  },
  "BOR_Enhancement_uncommon": {
    "body": {
      "parts": [
        "Part_Body_02_Uncommon"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_02_uncommon'"
      }
    }
  },
  "BOR_Enhancement_rare": {
    "body": {
      "parts": [
        "Part_Body_03_Rare"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_03_rare'"
      }
    }
  },
  "BOR_Enhancement_epic": {
    "body": {
      "parts": [
        "Part_Body_04_Epic"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_04_epic'"
      }
    }
  },
  "BOR_Enhancement_legendary": {
    "body": {
      "parts": [
        "Part_Body_05_Legendary"
      ],
      "min": 0,
      "max": 1
    },
    "core_augment": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_05_legendary'"
      }
    }
  },
  "BOR_REPAIR_KIT_legendary": {
    "primary_augment": {
      "parts": [
        "part_augment_unique_augmenter"
      ],
      "min": 0,
      "max": 1
    },
    "secondary_augment": {
      "parts": [
        "part_aug_ele_splat_fire",
        "part_aug_ele_splat_shock",
        "part_aug_ele_splat_corrosive",
        "part_aug_ele_splat_cryo",
        "part_aug_ele_splat_radiation",
        "part_aug_ele_nova_Fire",
        "part_aug_ele_nova_Shock",
        "part_aug_ele_nova_Corrosive",
        "part_aug_ele_nova_Cryo",
        "part_aug_ele_nova_Radiaion",
        "part_aug_ele_immunity_fire",
        "part_aug_ele_immunity_shock",
        "part_aug_ele_immunity_corrosive",
        "part_aug_ele_immunity_cryo",
        "part_aug_ele_immunity_radiation",
        "part_aug_d_Lifesteal_sec",
        "part_aug_D_Dmg_Reduction_On_Use_sec",
        "part_aug_u_move_speed_on_use_sec",
        "part_aug_u_askill_cooldown_on_use_sec",
        "part_aug_u_gadget_cooldown_on_use_sec",
        "part_aug_u_AllDmg_on_use_sec",
        "part_aug_o_melee_boost_on_use_sec",
        "part_aug_o_fire_rate_on_use_sec",
        "part_aug_o_reload_speed_on_use_sec",
        "part_aug_o_elemental_dmg_on_use_sec",
        "part_aug_o_SplashDmg_on_use_sec"
      ],
      "min": 0,
      "max": 1
    }
  },
  "BOR_SG_legendary": {
    "body_acc": {
      "parts": [],
      "min": 3,
      "max": 4
    },
    "barrel": {
      "parts": [
        "part_unique_barrel_02_convergence"
      ],
      "min": 0,
      "max": 1
    },
    "scope_acc": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "magazine": {
      "parts": [
        "part_mag_01",
        "part_mag_02",
        "part_mag_04_cov"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "endgame": {
      "parts": [],
      "min": 0,
      "max": 1
    }
  },
  "BOR_SM_legendary": {
    "body_acc": {
      "parts": [
        "part_body_d",
        "part_body_c",
        "part_body_b"
      ],
      "min": 3,
      "max": 3
    },
    "barrel_acc": {
      "parts": [
        "part_barrel_01_b",
        "part_barrel_01_d",
        "part_barrel_01_c"
      ],
      "min": 3,
      "max": 3
    },
    "scope_acc": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "magazine_borg": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "endgame": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "barrel": {
      "parts": [
        "part_barrel_01_hellfire"
      ],
      "min": 0,
      "max": 1
    },
    "body_ele": {
      "parts": [
        "part_fire"
      ],
      "min": 0,
      "max": 1
    }
  },
  "borg_grenade_gadget_common": {
    "Payload": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "payload_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "stat_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    }
  },
  "borg_grenade_gadget_legendary": {
    "payload": {
      "parts": [
        "part_payload_unique_buoy"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    }
  },
  "classmod_dark_siren_legendary": {
    "class_mod_body": {
      "parts": [
        "leg_body_01",
        "leg_body_02",
        "leg_body_03",
        "leg_body_04",
        "leg_body_05",
        "leg_body_06"
      ],
      "min": 0,
      "max": 1
    },
    "stat_group1": {
      "parts": [
        "stat_ordnance_damage",
        "statspecial_attunement_duration",
        "stat_sniper_damage",
        "statspecial_commandskill_cooldown",
        "statspecial_phaseclone_healthloss",
        "statspecial_lifesteal"
      ],
      "min": 0,
      "max": 1
    },
    "passive_points": {
      "parts": [],
      "min": 6,
      "max": 6
    }
  },
  "classmod_exo_soldier_legendary": {
    "class_mod_body": {
      "parts": [
        "leg_body_01",
        "leg_body_02",
        "leg_body_03",
        "leg_body_04",
        "leg_body_05",
        "leg_body_06"
      ],
      "min": 0,
      "max": 1
    },
    "stat_group1": {
      "parts": [
        "stat_skill_cooldown_rate",
        "stat_ordnance_damage",
        "stat_skill_duration",
        "stat_skill_damage",
        "stat_melee_damage",
        "Stat_Weapon_Damage"
      ],
      "min": 0,
      "max": 1
    }
  },
  "classmod_gravitar_legendary": {
    "class_mod_body": {
      "parts": [
        "leg_body_01",
        "leg_body_02",
        "leg_body_03",
        "leg_body_04",
        "leg_body_05",
        "leg_body_06"
      ],
      "min": 0,
      "max": 1
    },
    "stat_group1": {
      "parts": [
        "statspecial_puddle_damage",
        "stat_statuseffect_chance",
        "stat_skill_duration",
        "statspecial_lifesteal",
        "statspecial_stasis_damage",
        "stat_splash_damage"
      ],
      "min": 0,
      "max": 1
    }
  },
  "classmod_paladin_legendary": {
    "class_mod_body": {
      "parts": [
        "leg_body_01",
        "leg_body_02",
        "leg_body_03",
        "leg_body_04",
        "leg_body_05",
        "leg_body_06"
      ],
      "min": 0,
      "max": 1
    },
    "stat_group1": {
      "parts": [
        "statspecial_incendiary_damage",
        "stat_skill_damage",
        "statspecial_forgedrone_duration",
        "statspecial_cryo_damage",
        "statspecial_detonation_damage",
        "statspecial_forgeskill_damage"
      ],
      "min": 0,
      "max": 1
    }
  },
  "COV_Enhancement_common": {
    "body": {
      "parts": [
        "Part_Body_01_Common"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_01_common'"
      }
    }
  },
  "COV_Enhancement_uncommon": {
    "body": {
      "parts": [
        "Part_Body_02_Uncommon"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_02_uncommon'"
      }
    }
  },
  "COV_Enhancement_rare": {
    "body": {
      "parts": [
        "Part_Body_03_Rare"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_03_rare'"
      }
    }
  },
  "COV_Enhancement_epic": {
    "body": {
      "parts": [
        "Part_Body_04_Epic"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_04_epic'"
      }
    }
  },
  "COV_Enhancement_legendary": {
    "body": {
      "parts": [
        "Part_Body_05_Legendary"
      ],
      "min": 0,
      "max": 1
    },
    "core_augment": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_05_legendary'"
      }
    }
  },
  "DAD_AR_legendary": {
    "foregrip": {
      "parts": [
        "part_underbarrel_01_grenade_om",
        "part_underbarrel_om_spacelaser",
        "part_underbarrel_06_star_helix"
      ],
      "min": 0,
      "max": 1
    },
    "barrel": {
      "parts": [
        "part_barrel_unique_om",
        "part_barrel_02_star_helix"
      ],
      "min": 0,
      "max": 1
    },
    "magazine": {
      "parts": [
        "part_mag_01",
        "part_mag_02",
        "part_mag_03_tor",
        "part_mag_05_borg",
        "part_mag_04_cov"
      ],
      "min": 0,
      "max": 1
    }
  },
  "DAD_AR_common": {
    "body": {
      "parts": [
        "part_body"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    },
    "barrel": {
      "parts": [
        "part_barrel_01",
        "part_barrel_02"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    },
    "magazine": {
      "parts": [
        "part_mag_01",
        "part_mag_04_cov"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    },
    "scope": {
      "parts": [
        "part_scope_01_lens_01",
        "part_scope_02_lens_01"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    },
    "grip": {
      "parts": [
        "part_grip_02",
        "part_grip_03"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    },
    "foregrip": {
      "parts": [
        "part_foregrip_02",
        "part_foregrip_03"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    },
    "body_mag": {
      "parts": [
        "part_body_mag_PS"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    },
    "body_acc": {
      "parts": [
        "part_body_a",
        "part_body_b"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    },
    "barrel_acc": {
      "parts": [
        "part_barrel_01_a",
        "part_barrel_02_b"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    },
    "scope_acc": {
      "parts": [
        "part_scope_acc_S01_L01_a",
        "part_scope_acc_S02_L01_b"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    }
  },
  "DAD_Enhancement_common": {
    "body": {
      "parts": [
        "Part_Body_01_Common"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_01_common'"
      }
    }
  },
  "DAD_Enhancement_uncommon": {
    "body": {
      "parts": [
        "Part_Body_02_Uncommon"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_02_uncommon'"
      }
    }
  },
  "DAD_Enhancement_rare": {
    "body": {
      "parts": [
        "Part_Body_03_Rare"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_03_rare'"
      }
    }
  },
  "DAD_Enhancement_epic": {
    "body": {
      "parts": [
        "Part_Body_04_Epic"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_04_epic'"
      }
    }
  },
  "DAD_Enhancement_legendary": {
    "body": {
      "parts": [
        "Part_Body_05_Legendary"
      ],
      "min": 0,
      "max": 1
    },
    "core_augment": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_05_legendary'"
      }
    }
  },
  "DAD_PS_common": {
    "barrel": {
      "parts": [
        "part_barrel_02"
      ],
      "min": 0,
      "max": 1
    },
    "magazine": {
      "parts": [
        "part_mag_01"
      ],
      "min": 0,
      "max": 1
    },
    "body_acc": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "barrel_acc": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "scope": {
      "parts": [
        "part_scope_01_lens_01"
      ],
      "min": 0,
      "max": 1
    },
    "grip": {
      "parts": [
        "part_grip_01"
      ],
      "min": 0,
      "max": 1
    },
    "foregrip": {
      "parts": [
        "part_foregrip_01"
      ],
      "min": 0,
      "max": 1
    },
    "body_mag": {
      "parts": [
        "part_body_mag_SMG"
      ],
      "min": 0,
      "max": 1
    }
  },
  "dad_repair_kit_legendary": {
    "primary_augment": {
      "parts": [
        "part_augment_unique_pacemaker"
      ],
      "min": 0,
      "max": 1
    }
  },
  "DAD_SM_legendary": {
    "body_acc": {
      "parts": [
        "part_body_d",
        "part_body_a",
        "part_body_c",
        "part_body_b"
      ],
      "min": 3,
      "max": 3
    },
    "barrel_acc": {
      "parts": [
        "part_barrel_01_a",
        "part_barrel_01_b",
        "part_barrel_01_c",
        "part_barrel_01_d",
        "part_barrel_licensed_jak",
        "part_barrel_licensed_ted"
      ],
      "min": 2,
      "max": 3
    },
    "scope_acc": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "body_ele": {
      "parts": [
        "part_corrosive"
      ],
      "min": 0,
      "max": 1
    },
    "barrel": {
      "parts": [
        "part_barrel_01_Bloodstarved",
        "part_barrel_01_Luty"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    },
    "magazine": {
      "parts": [
        "part_mag_02",
        "part_mag_01",
        "part_mag_04_cov",
        "part_mag_05_borg"
      ],
      "min": 0,
      "max": 1
    },
    "grip": {
      "parts": [
        "part_grip_01",
        "part_grip_02",
        "part_grip_03"
      ],
      "min": 0,
      "max": 1
    },
    "foregrip": {
      "parts": [
        "part_underbarrel_06_malswitch",
        "part_underbarrel_02_shotgun",
        "part_underbarrel_01_stungrenade",
        "part_underbarrel_04_atlas_ball",
        "part_underbarrel_04_atlas",
        "part_foregrip_01",
        "part_foregrip_02",
        "part_foregrip_03"
      ],
      "min": 0,
      "max": 1
    },
    "scope": {
      "parts": [
        "part_scope_ironsight"
      ],
      "min": 0,
      "max": 1
    },
    "body_mag": {
      "parts": [
        "part_body_mag_PS",
        "part_body_mag_AR",
        "part_body_mag_SG",
        "part_body_mag_SR"
      ],
      "min": 0,
      "max": 1
    }
  },
  "DAD_TERMINAL_COMBAT_legendary": {
    "active_augment": {
      "parts": [
        "part_hot_off_the_press"
      ],
      "min": 0,
      "max": 1
    }
  },
  "grenade_gadget_common": {
    "Element": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "Payload": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "payload_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "stat_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_01_common'"
      }
    }
  },
  "grenade_gadget_uncommon": {
    "payload": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "payload_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_02_uncommon'"
      }
    }
  },
  "grenade_gadget_rare": {
    "payload_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_03_rare'"
      }
    }
  },
  "grenade_gadget_epic": {
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_04_epic'"
      }
    }
  },
  "grenade_gadget_legendary": {
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_05_legendary'"
      }
    }
  },
  "HYP_Enhancement_common": {
    "body": {
      "parts": [
        "Part_Body_01_Common"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_01_common'"
      }
    }
  },
  "HYP_Enhancement_uncommon": {
    "body": {
      "parts": [
        "Part_Body_02_Uncommon"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_02_uncommon'"
      }
    }
  },
  "HYP_Enhancement_rare": {
    "body": {
      "parts": [
        "Part_Body_03_Rare"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_03_rare'"
      }
    }
  },
  "HYP_Enhancement_epic": {
    "body": {
      "parts": [
        "Part_Body_04_Epic"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_04_epic'"
      }
    }
  },
  "HYP_Enhancement_legendary": {
    "body": {
      "parts": [
        "Part_Body_05_Legendary"
      ],
      "min": 0,
      "max": 1
    },
    "core_augment": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_05_legendary'"
      }
    }
  },
  "JAK_AR_common": {
    "body": {
      "parts": [
        "part_body"
      ],
      "min": 0,
      "max": 1
    },
    "body_acc": {
      "parts": [
        "part_body_d"
      ],
      "min": 0,
      "max": 1
    },
    "barrel": {
      "parts": [
        "part_barrel_01"
      ],
      "min": 0,
      "max": 1
    },
    "barrel_acc": {
      "parts": [
        "part_barrel_01_b",
        "part_barrel_01_c",
        "part_barrel_01_a"
      ],
      "min": 3,
      "max": 3
    },
    "magazine": {
      "parts": [
        "part_mag_04_cov"
      ],
      "min": 0,
      "max": 1
    },
    "scope": {
      "parts": [
        "part_scope_01_lens_01"
      ],
      "min": 0,
      "max": 1
    },
    "grip": {
      "parts": [
        "part_grip_04_hyp"
      ],
      "min": 0,
      "max": 1
    },
    "foregrip": {
      "parts": [
        "part_foregrip_01"
      ],
      "min": 0,
      "max": 1
    },
    "scope_acc": {
      "parts": [
        "part_scope_acc_S01_L01_b"
      ],
      "min": 0,
      "max": 1
    }
  },
  "JAK_Enhancement_common": {
    "body": {
      "parts": [
        "Part_Body_01_Common"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_01_common'"
      }
    }
  },
  "JAK_Enhancement_uncommon": {
    "body": {
      "parts": [
        "Part_Body_02_Uncommon"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_02_uncommon'"
      }
    }
  },
  "JAK_Enhancement_rare": {
    "body": {
      "parts": [
        "Part_Body_03_Rare"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_03_rare'"
      }
    }
  },
  "JAK_Enhancement_epic": {
    "body": {
      "parts": [
        "Part_Body_04_Epic"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_04_epic'"
      }
    }
  },
  "JAK_Enhancement_legendary": {
    "body": {
      "parts": [
        "Part_Body_05_Legendary"
      ],
      "min": 0,
      "max": 1
    },
    "core_augment": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_05_legendary'"
      }
    }
  },
  "jak_grenade_gadget_legendary": {
    "payload": {
      "parts": [
        "part_spinning_blade"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    },
    "payload_augment": {
      "parts": [
        "part_07_damage_amp_02_suppressor"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    },
    "stat_augment": {
      "parts": [
        "part_stat_05_jak_oversized"
      ],
      "min": 0,
      "max": 1
    }
  },
  "JAK_PS_legendary": {
    "body_acc": {
      "parts": [],
      "min": 3,
      "max": 4
    },
    "barrel_acc": {
      "parts": [],
      "min": 3,
      "max": 4
    },
    "scope_acc": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "endgame": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "barrel": {
      "parts": [
        "part_barrel_01_seventh_Sense"
      ],
      "min": 0,
      "max": 1
    },
    "magazine": {
      "parts": [
        "part_mag_01",
        "part_mag_02",
        "part_mag_04_cov",
        "part_mag_05_borg"
      ],
      "min": 0,
      "max": 1
    }
  },
  "JAK_PS_common": {
    "body_acc": {
      "parts": [
        "part_body_a"
      ],
      "min": 3,
      "max": 3
    },
    "barrel": {
      "parts": [
        "part_barrel_01"
      ],
      "min": 0,
      "max": 1
    },
    "barrel_acc": {
      "parts": [
        "part_barrel_01_b"
      ],
      "min": 4,
      "max": 4
    },
    "magazine": {
      "parts": [
        "part_mag_02"
      ],
      "min": 0,
      "max": 1
    },
    "scope": {
      "parts": [
        "part_scope_ironsight"
      ],
      "min": 0,
      "max": 1
    },
    "grip": {
      "parts": [
        "part_grip_01"
      ],
      "min": 0,
      "max": 1
    },
    "foregrip": {
      "parts": [
        "part_underbarrel_01_microrocket"
      ],
      "min": 0,
      "max": 1
    },
    "scope_acc": {
      "parts": [
        "part_scope_acc_S01_L01_a"
      ],
      "min": 0,
      "max": 1
    }
  },
  "JAK_TERMINAL_COMBAT_legendary": {
    "active_augment": {
      "parts": [
        "part_me_layhem"
      ],
      "min": 0,
      "max": 1
    }
  },
  "MAL_Enhancement_common": {
    "body": {
      "parts": [
        "Part_Body_01_Common"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_01_common'"
      }
    }
  },
  "MAL_Enhancement_uncommon": {
    "body": {
      "parts": [
        "Part_Body_02_Uncommon"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_02_uncommon'"
      }
    }
  },
  "MAL_Enhancement_rare": {
    "body": {
      "parts": [
        "Part_Body_03_Rare"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_03_rare'"
      }
    }
  },
  "MAL_Enhancement_epic": {
    "body": {
      "parts": [
        "Part_Body_04_Epic"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_04_epic'"
      }
    }
  },
  "MAL_Enhancement_legendary": {
    "body": {
      "parts": [
        "Part_Body_05_Legendary"
      ],
      "min": 0,
      "max": 1
    },
    "core_augment": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_05_legendary'"
      }
    }
  },
  "mal_grenade_gadget_common": {
    "Payload": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "payload_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "stat_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    }
  },
  "mal_repair_kit_common": {},
  "mal_repair_kit_uncommon": {
    "curative": {
      "parts": [],
      "min": 2,
      "max": 2
    }
  },
  "mal_repair_kit_rare": {
    "curative": {
      "parts": [],
      "min": 2,
      "max": 2
    }
  },
  "mal_repair_kit_epic": {
    "curative": {
      "parts": [],
      "min": 3,
      "max": 3
    }
  },
  "mal_repair_kit_legendary": {
    "primary_augment": {
      "parts": [
        "part_augment_unique_BloodAnalyzer"
      ],
      "min": 0,
      "max": 1
    }
  },
  "MAL_SG_legendary": {
    "barrel": {
      "parts": [
        "part_barrel_01_Kaleidosplode",
        "part_barrel_01_Kickballer"
      ],
      "min": 0,
      "max": 1
    },
    "barrel_acc": {
      "parts": [
        "part_barrel_01_a",
        "part_barrel_01_b",
        "part_barrel_01_c",
        "part_barrel_01_d"
      ],
      "min": 0,
      "max": 1
    },
    "magazine": {
      "parts": [
        "part_mag_05_borg",
        "part_mag_01",
        "part_mag_02",
        "part_mag_04_cov"
      ],
      "min": 0,
      "max": 1
    },
    "grip": {
      "parts": [
        "part_grip_01",
        "part_grip_02",
        "part_grip_03"
      ],
      "min": 0,
      "max": 1
    },
    "foregrip": {
      "parts": [
        "part_foregrip_01",
        "part_foregrip_02",
        "part_foregrip_03",
        "part_foregrip_04",
        "part_underbarrel_01_blowback",
        "part_underbarrel_02_energydisc",
        "part_underbarrel_03_beam_tosser",
        "part_underbarrel_05_ammoswitcher"
      ],
      "min": 0,
      "max": 1
    },
    "body_ele": {
      "parts": [
        "part_cryo"
      ],
      "min": 0,
      "max": 1
    }
  },
  "mal_shield_legendary": {
    "unique": {
      "parts": [
        "part_unique_supernova"
      ],
      "min": 0,
      "max": 1
    },
    "primary_augment": {
      "parts": [
        "part_eng_vagabond_primary",
        "part_eng_berserker_primary",
        "part_eng_siphon_primary",
        "part_eng_fleeting_primary",
        "part_eng_brimming_primary",
        "part_eng_amp_primary",
        "part_eng_recharge_rate_primary",
        "part_eng_recharge_delay_primary",
        "part_eng_trigger_happy_primary"
      ],
      "min": 0,
      "max": 1
    },
    "secondary_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    }
  },
  "MAL_SM_common": {
    "body": {
      "parts": [
        "part_body"
      ],
      "min": 0,
      "max": 1
    },
    "body_acc": {
      "parts": [
        "part_body_c",
        "part_body_b",
        "part_body_a",
        "part_body_d"
      ],
      "min": 4,
      "max": 4
    },
    "magazine": {
      "parts": [
        "part_mag_01"
      ],
      "min": 0,
      "max": 1
    },
    "secondary_ele": {
      "parts": [
        "part_secondary_ele_shock"
      ],
      "min": 0,
      "max": 1
    },
    "scope": {
      "parts": [
        "part_scope_01_lens_01"
      ],
      "min": 0,
      "max": 1
    },
    "scope_acc": {
      "parts": [
        "part_scope_acc_S01_L01_a"
      ],
      "min": 0,
      "max": 0
    },
    "grip": {
      "parts": [
        "part_grip_01"
      ],
      "min": 0,
      "max": 1
    },
    "foregrip": {
      "parts": [
        "part_underbarrel_02_overcharge"
      ],
      "min": 0,
      "max": 1
    },
    "barrel": {
      "parts": [
        "part_barrel_01"
      ],
      "min": 0,
      "max": 1
    },
    "barrel_acc": {
      "parts": [
        "part_barrel_01_a",
        "part_barrel_01_c",
        "part_barrel_01_b"
      ],
      "min": 3,
      "max": 3
    },
    "body_ele": {
      "parts": [
        "part_fire"
      ],
      "min": 0,
      "max": 1
    }
  },
  "MAL_SR_legendary": {
    "body_acc": {
      "parts": [],
      "min": 3,
      "max": 4
    },
    "barrel_acc": {
      "parts": [],
      "min": 3,
      "max": 4
    },
    "scope_acc": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "magazine": {
      "parts": [
        "part_mag_01",
        "part_mag_02",
        "part_mag_04_cov",
        "part_mag_05_borg"
      ],
      "min": 0,
      "max": 1
    },
    "barrel": {
      "parts": [
        "part_barrel_01_complex_root",
        "part_barrel_02_katagawa"
      ],
      "min": 0,
      "max": 1
    },
    "endgame": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "body_ele": {
      "parts": [
        "part_fire"
      ],
      "min": 0,
      "max": 1
    },
    "secondary_ele": {
      "parts": [
        "part_secondary_elem_fire_shock_mal"
      ],
      "min": 0,
      "max": 1
    },
    "foregrip": {
      "parts": [
        "part_foregrip_01",
        "part_foregrip_02",
        "part_foregrip_03"
      ],
      "min": 0,
      "max": 1
    }
  },
  "MAL_TERMINAL_HEALING_legendary": {
    "active_augment": {
      "parts": [
        "part_active_shield_stabilizer"
      ],
      "min": 0,
      "max": 1
    }
  },
  "ORD_Enhancement_common": {
    "body": {
      "parts": [
        "Part_Body_01_Common"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_01_common'"
      }
    }
  },
  "ORD_Enhancement_uncommon": {
    "body": {
      "parts": [
        "Part_Body_02_Uncommon"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_02_uncommon'"
      }
    }
  },
  "ORD_Enhancement_rare": {
    "body": {
      "parts": [
        "Part_Body_03_Rare"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_03_rare'"
      }
    }
  },
  "ORD_Enhancement_epic": {
    "body": {
      "parts": [
        "Part_Body_04_Epic"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_04_epic'"
      }
    }
  },
  "ORD_Enhancement_legendary": {
    "body": {
      "parts": [
        "Part_Body_05_Legendary"
      ],
      "min": 0,
      "max": 1
    },
    "core_augment": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_05_legendary'"
      }
    }
  },
  "ORD_PS_legendary": {
    "barrel": {
      "parts": [
        "part_barrel_NoisyCricket"
      ],
      "min": 0,
      "max": 1
    },
    "grip": {
      "parts": [
        "part_grip_01",
        "part_grip_03"
      ],
      "min": 0,
      "max": 1
    },
    "magazine": {
      "parts": [
        "part_mag_noisycricket"
      ],
      "min": 0,
      "max": 1
    },
    "foregrip": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "barrel_acc": {
      "parts": [
        "part_barrel_01_a",
        "part_barrel_01_b",
        "part_barrel_01_c",
        "part_barrel_01_d",
        "part_barrel_licensed_ted",
        "part_barrel_licensed_ted_shooting",
        "part_barrel_licensed_ted_mirv",
        "part_barrel_licensed_ted_combo",
        "part_barrel_licensed_hyp"
      ],
      "min": 0,
      "max": 1
    }
  },
  "ORD_PS_common": {
    "body": {
      "parts": [
        "part_body"
      ],
      "min": 0,
      "max": 1
    },
    "body_acc": {
      "parts": [
        "part_body_d",
        "part_body_a"
      ],
      "min": 2,
      "max": 2
    },
    "barrel": {
      "parts": [
        "part_barrel_01"
      ],
      "min": 0,
      "max": 1
    },
    "barrel_acc": {
      "parts": [
        "part_barrel_01_c",
        "part_barrel_01_b",
        "part_barrel_licensed_hyp"
      ],
      "min": 3,
      "max": 3
    },
    "magazine": {
      "parts": [
        "part_mag_01"
      ],
      "min": 0,
      "max": 1
    },
    "magazine_acc": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "scope": {
      "parts": [
        "part_scope_ironsight"
      ],
      "min": 0,
      "max": 1
    },
    "scope_acc": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "grip": {
      "parts": [
        "part_grip_03"
      ],
      "min": 0,
      "max": 1
    },
    "foregrip": {
      "parts": [
        "part_foregrip_01"
      ],
      "min": 0,
      "max": 1
    },
    "hyperion_secondary_acc": {
      "parts": [
        "part_shield_default"
      ],
      "min": 0,
      "max": 1
    }
  },
  "ord_shield_legendary": {
    "unique": {
      "parts": [
        "part_unique_cindershelly"
      ],
      "min": 0,
      "max": 1
    },
    "primary_augment": {
      "parts": [
        "part_eng_vagabond_primary",
        "part_eng_berserker_primary",
        "part_eng_trigger_happy_primary",
        "part_eng_fleeting_primary",
        "part_eng_brimming_primary",
        "part_eng_amp_primary",
        "part_unv_utility_primary",
        "part_unv_pinpoint_primary",
        "part_unv_spike_primary",
        "part_unv_resistant_primary",
        "part_unv_absorb_primary",
        "part_unv_adaptive_primary",
        "part_unv_capacity_primary",
        "part_unv_reflect_primary"
      ],
      "min": 0,
      "max": 1
    },
    "secondary_augment": {
      "parts": [
        "part_eng_vagabond_secondary",
        "part_eng_berserker_secondary",
        "part_eng_trigger_happy_secondary",
        "part_eng_fleeting_secondary",
        "part_eng_brimming_secondary",
        "part_eng_amp_secondary",
        "part_unv_utility_secondary",
        "part_unv_pinpoint_secondary",
        "part_unv_spike_secondary",
        "part_unv_resistant_secondary",
        "part_unv_absorb_secondary",
        "part_unv_adaptive_secondary",
        "part_unv_capacity_secondary",
        "part_unv_reflect_secondary"
      ],
      "min": 0,
      "max": 1
    }
  },
  "ORD_TERMINAL_HEALING_legendary": {
    "active_augment": {
      "parts": [
        "part_active_bogo",
        "part_active_healer_on_the_go"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    }
  },
  "ord_turret_gadget_legendary": {
    "turret_weapon": {
      "parts": [
        "part_unique_beam_anchor"
      ],
      "min": 0,
      "max": 1
    }
  },
  "TED_AR_common": {
    "body": {
      "parts": [
        "part_body"
      ],
      "min": 0,
      "max": 1
    },
    "body_acc": {
      "parts": [
        "part_body_a",
        "part_body_b",
        "part_body_c"
      ],
      "min": 3,
      "max": 3
    },
    "barrel": {
      "parts": [
        "part_barrel_01"
      ],
      "min": 0,
      "max": 1
    },
    "barrel_acc": {
      "parts": [
        "part_barrel_01_c",
        "part_barrel_01_b",
        "part_barrel_01_d"
      ],
      "min": 3,
      "max": 3
    },
    "tediore_acc": {
      "parts": [
        "part_barrel_licensed_ted_shooting"
      ],
      "min": 0,
      "max": 1
    },
    "magazine": {
      "parts": [
        "part_mag_01"
      ],
      "min": 0,
      "max": 1
    },
    "scope": {
      "parts": [
        "part_scope_02_lens_01"
      ],
      "min": 0,
      "max": 1
    },
    "scope_acc": {
      "parts": [
        "part_scope_acc_S02_L01_b"
      ],
      "min": 0,
      "max": 1
    },
    "grip": {
      "parts": [
        "part_grip_01"
      ],
      "min": 0,
      "max": 1
    },
    "foregrip": {
      "parts": [
        "part_underbarrel_02_comboorb"
      ],
      "min": 0,
      "max": 1
    }
  },
  "TED_Enhancement_common": {
    "body": {
      "parts": [
        "Part_Body_01_Common"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_01_common'"
      }
    }
  },
  "TED_Enhancement_uncommon": {
    "body": {
      "parts": [
        "Part_Body_02_Uncommon"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_02_uncommon'"
      }
    }
  },
  "TED_Enhancement_rare": {
    "body": {
      "parts": [
        "Part_Body_03_Rare"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_03_rare'"
      }
    }
  },
  "TED_Enhancement_epic": {
    "body": {
      "parts": [
        "Part_Body_04_Epic"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_04_epic'"
      }
    }
  },
  "TED_Enhancement_legendary": {
    "body": {
      "parts": [
        "Part_Body_05_Legendary"
      ],
      "min": 0,
      "max": 1
    },
    "core_augment": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_05_legendary'"
      }
    }
  },
  "ted_repair_kit_legendary": {
    "primary_augment": {
      "parts": [
        "part_augment_unique_KillSpring"
      ],
      "min": 0,
      "max": 1
    }
  },
  "TED_SG_legendary": {
    "body_acc": {
      "parts": [],
      "min": 3,
      "max": 4
    },
    "barrel_acc": {
      "parts": [
        "part_barrel_01_a",
        "part_barrel_01_b",
        "part_barrel_01_d"
      ],
      "min": 4,
      "max": 4
    },
    "scope_acc": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "barrel": {
      "parts": [
        "part_barrel_01_anarchy"
      ],
      "min": 0,
      "max": 1
    },
    "magazine": {
      "parts": [
        "part_mag_01",
        "part_mag_02",
        "part_mag_03_tor",
        "part_mag_05_borg"
      ],
      "min": 0,
      "max": 1
    },
    "scope": {
      "parts": [
        "part_scope_02_lens_01",
        "part_scope_02_lens_02"
      ],
      "min": 0,
      "max": 1
    }
  },
  "TED_TERMINAL_BARRIER_legendary": {
    "active_augment": {
      "parts": [
        "part_active_sit_rep"
      ],
      "min": 0,
      "max": 1
    }
  },
  "Terminal_Gadget_common": {
    "primary_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "secondary_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "active_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "endgame": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "enemy_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    }
  },
  "Terminal_Gadget_uncommon": {
    "primary_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "secondary_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "enemy_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "active_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "endgame": {
      "parts": [],
      "min": 0,
      "max": 1
    }
  },
  "Terminal_Gadget_rare": {
    "secondary_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "active_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "endgame": {
      "parts": [],
      "min": 0,
      "max": 1
    }
  },
  "Terminal_Gadget_epic": {
    "enemy_augment": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "active_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "endgame": {
      "parts": [],
      "min": 0,
      "max": 1
    }
  },
  "Terminal_Gadget_legendary": {
    "enemy_augment": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "active_augment": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "endgame": {
      "parts": [],
      "min": 0,
      "max": 1
    }
  },
  "TOR_Enhancement_common": {
    "body": {
      "parts": [
        "Part_Body_01_Common"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_01_common'"
      }
    }
  },
  "TOR_Enhancement_uncommon": {
    "body": {
      "parts": [
        "Part_Body_02_Uncommon"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_02_uncommon'"
      }
    }
  },
  "TOR_Enhancement_rare": {
    "body": {
      "parts": [
        "Part_Body_03_Rare"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_03_rare'"
      }
    }
  },
  "TOR_Enhancement_epic": {
    "body": {
      "parts": [
        "Part_Body_04_Epic"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_04_epic'"
      }
    }
  },
  "TOR_Enhancement_legendary": {
    "body": {
      "parts": [
        "Part_Body_05_Legendary"
      ],
      "min": 0,
      "max": 1
    },
    "core_augment": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_05_legendary'"
      }
    }
  },
  "TOR_HW_legendary": {
    "barrel": {
      "parts": [
        "part_unique_barrel_02_ravenfire",
        "part_unique_barrel_01_sidewinder"
      ],
      "min": 0,
      "max": 1
    },
    "barrel_acc": {
      "parts": [
        "part_barrel_02_b",
        "part_barrel_02_c"
      ],
      "min": 0,
      "max": 0
    },
    "body_acc": {
      "parts": [
        "part_body_a",
        "part_body_b",
        "part_body_c"
      ],
      "min": 3,
      "max": 3
    },
    "firmware": {
      "parts": [
        "part_firmware_god_killer"
      ],
      "min": 0,
      "max": 1
    }
  },
  "tor_repair_kit_legendary": {
    "primary_augment": {
      "parts": [
        "part_augment_unique_ShinyWarPaint"
      ],
      "min": 0,
      "max": 1
    }
  },
  "TOR_TERMINAL_COMBAT_legendary": {
    "active_augment": {
      "parts": [
        "part_nova_bomb_active"
      ],
      "min": 0,
      "max": 1
    }
  },
  "turret_gadget_common": {
    "Element": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "primary_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "secondary_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "endgame": {
      "parts": [],
      "min": 0,
      "max": 1
    }
  },
  "turret_gadget_uncommon": {
    "primary_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "secondary_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "endgame": {
      "parts": [],
      "min": 0,
      "max": 1
    }
  },
  "turret_gadget_rare": {
    "secondary_augment": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "endgame": {
      "parts": [],
      "min": 0,
      "max": 1
    }
  },
  "turret_gadget_epic": {
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "endgame": {
      "parts": [],
      "min": 0,
      "max": 1
    }
  },
  "turret_gadget_legendary": {
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1
    },
    "endgame": {
      "parts": [],
      "min": 0,
      "max": 1
    }
  },
  "turret_weapon_basic_common": {
    "secondary_augment": {
      "parts": [
        "turret_weapon_augment_basic_pierce"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000",
        "attribute": "attribute'gadget_turret_pierce'"
      }
    },
    "underbarrel": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'gadget_turret_second_barrel'"
      }
    }
  },
  "turret_weapon_beam_common": {
    "secondary_augment": {
      "parts": [
        "Part_TurretWeapon_Beam_Pierce"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000",
        "attribute": "attribute'gadget_turret_pierce'"
      }
    },
    "underbarrel": {
      "parts": [
        "Part_TurretWeapon_Beam_Underbarrel"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'gadget_turret_second_barrel'"
      }
    }
  },
  "turret_weapon_chaingun_common": {
    "secondary_augment": {
      "parts": [
        "Part_TurretWeapon_Chaingun_Pierce"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000",
        "attribute": "attribute'gadget_turret_pierce'"
      }
    },
    "underbarrel": {
      "parts": [
        "Part_TurretWeapon_Chaingun_Underbarrel"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'gadget_turret_second_barrel'"
      }
    }
  },
  "turret_weapon_longrifle_common": {
    "secondary_augment": {
      "parts": [
        "Part_TurretWeapon_LongRifle_Pierce"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000",
        "attribute": "attribute'gadget_turret_pierce'"
      }
    },
    "underbarrel": {
      "parts": [
        "Part_TurretWeapon_Longrifle_Underbarrel"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'gadget_turret_second_barrel'"
      }
    }
  },
  "turret_weapon_rocketlauncher_common": {
    "secondary_augment": {
      "parts": [
        "Part_TurretWeapon_RL_Pierce"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000",
        "attribute": "attribute'gadget_turret_pierce'"
      }
    },
    "underbarrel": {
      "parts": [
        "Part_TurretWeapon_RL_Underbarrel"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000",
        "attribute": "attribute'gadget_turret_second_barrel'"
      }
    }
  },
  "turret_weapon_shotgun_common": {
    "secondary_augment": {
      "parts": [
        "Part_TurretWeapon_Shotgun_Pierce"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000",
        "attribute": "attribute'gadget_turret_pierce'"
      }
    },
    "underbarrel": {
      "parts": [
        "Part_TurretWeapon_SG_Underbarrel"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'gadget_turret_second_barrel'"
      }
    }
  },
  "VLA_AR_common": {
    "underbarrel_acc": {
      "parts": [],
      "min": 0,
      "max": 0,
      "additionalpartchance": {
        "constant": "0.750000",
        "datatablevalue": {
          "datatable": "gbx_ue_data_table'none'"
        }
      }
    }
  },
  "VLA_AR_uncommon": {
    "underbarrel_acc": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.250000",
        "datatablevalue": {
          "datatable": "gbx_ue_data_table'none'"
        }
      }
    }
  },
  "VLA_AR_rare": {
    "underbarrel_acc": {
      "parts": [],
      "min": 0,
      "max": 2
    }
  },
  "VLA_AR_epic": {
    "underbarrel_acc": {
      "parts": [],
      "min": 0,
      "max": 3,
      "additionalpartchance": {
        "constant": "0.750000",
        "datatablevalue": {
          "datatable": "gbx_ue_data_table'none'"
        }
      }
    }
  },
  "VLA_AR_legendary": {
    "underbarrel_acc": {
      "parts": [],
      "min": 0,
      "max": 3,
      "additionalpartchance": {
        "constant": "0.750000"
      }
    }
  },
  "VLA_Enhancement_common": {
    "body": {
      "parts": [
        "Part_Body_01_Common"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_01_common'"
      }
    }
  },
  "VLA_Enhancement_uncommon": {
    "body": {
      "parts": [
        "Part_Body_02_Uncommon"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_02_uncommon'"
      }
    }
  },
  "VLA_Enhancement_rare": {
    "body": {
      "parts": [
        "Part_Body_04_Epic"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_03_rare'"
      }
    }
  },
  "VLA_Enhancement_epic": {
    "body": {
      "parts": [
        "Part_Body_04_Epic"
      ],
      "min": 0,
      "max": 1
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_04_epic'"
      }
    }
  },
  "VLA_Enhancement_legendary": {
    "body": {
      "parts": [
        "Part_Body_05_Legendary"
      ],
      "min": 0,
      "max": 1
    },
    "core_augment": {
      "parts": [],
      "min": 2,
      "max": 2
    },
    "firmware": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "attribute": "attribute'firmware_weight_05_legendary'"
      }
    }
  },
  "VLA_HW_rare": {
    "barrel_licensed": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    }
  },
  "VLA_HW_epic": {
    "barrel_licensed": {
      "parts": [],
      "min": 2,
      "max": 2,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    }
  },
  "VLA_HW_legendary": {
    "barrel_licensed": {
      "parts": [],
      "min": 2,
      "max": 2,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    },
    "barrel": {
      "parts": [
        "part_unique_barrel_01_atlinggun"
      ],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.000000"
      }
    },
    "barrel_acc": {
      "parts": [],
      "min": 0,
      "max": 0
    }
  },
  "vla_repair_kit_legendary": {
    "primary_augment": {
      "parts": [
        "part_augment_unique_AdrenalinePump"
      ],
      "min": 0,
      "max": 1
    }
  },
  "VLA_SM_common": {
    "underbarrel_acc": {
      "parts": [],
      "min": 0,
      "max": 0
    }
  },
  "VLA_SM_uncommon": {
    "underbarrel_acc": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.250000",
        "datatablevalue": {
          "datatable": "gbx_ue_data_table'none'"
        }
      }
    }
  },
  "VLA_SM_rare": {
    "underbarrel_acc": {
      "parts": [],
      "min": 0,
      "max": 1
    }
  },
  "VLA_SM_epic": {
    "underbarrel_acc": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.750000",
        "datatablevalue": {
          "datatable": "gbx_ue_data_table'none'"
        }
      }
    }
  },
  "VLA_SM_legendary": {
    "underbarrel_acc": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.750000"
      }
    }
  },
  "VLA_SR_common": {
    "underbarrel_acc": {
      "parts": [],
      "min": 0,
      "max": 0
    }
  },
  "VLA_SR_uncommon": {
    "underbarrel_acc": {
      "parts": [],
      "min": 0,
      "max": 1,
      "additionalpartchance": {
        "constant": "0.250000",
        "datatablevalue": {
          "datatable": "gbx_ue_data_table'none'"
        }
      }
    }
  },
  "VLA_SR_rare": {
    "underbarrel_acc": {
      "parts": [],
      "min": 0,
      "max": 2
    }
  },
  "VLA_SR_epic": {
    "underbarrel_acc": {
      "parts": [],
      "min": 0,
      "max": 3,
      "additionalpartchance": {
        "constant": "0.750000",
        "datatablevalue": {
          "datatable": "gbx_ue_data_table'none'"
        }
      }
    }
  },
  "VLA_SR_legendary": {
    "underbarrel_acc": {
      "parts": [],
      "min": 0,
      "max": 3,
      "additionalpartchance": {
        "constant": "0.750000"
      }
    },
    "barrel": {
      "parts": [
        "part_barrel_CrowdSourced"
      ],
      "min": 0,
      "max": 1
    },
    "magazine": {
      "parts": [
        "part_mag_01",
        "part_mag_02",
        "part_mag_04_cov",
        "part_mag_05_borg"
      ],
      "min": 0,
      "max": 1
    },
    "underbarrel": {
      "parts": [
        "part_underbarrel_06_malswitch",
        "part_underbarrel_05_ammoswitcher",
        "part_underbarrel_02_rocket",
        "part_underbarrel_01_shotgun",
        "part_underbarrel_03_bipod"
      ],
      "min": 0,
      "max": 1
    }
  },
  "TED_PS_legendary": {
    "barrel": {
      "parts": [
        "part_barrel_02_ATLien",
        "part_barrel_02_RubysGrasp",
        "part_barrel_01_Sideshow"
      ],
      "min": 0,
      "max": 1
    },
    "barrel_acc": {
      "parts": [
        "part_barrel_licensed_multi"
      ],
      "min": 0,
      "max": 1
    },
    "tediore_acc": {
      "parts": [
        "part_barrel_licensed_ted_replicator_multi",
        "part_barrel_licensed_ted_replicator"
      ],
      "min": 0,
      "max": 1
    },
    "tediore_secondary_acc": {
      "parts": [
        "part_multi_ted_combo_ATLien",
        "part_multi_ted_replicator"
      ],
      "min": 0,
      "max": 1
    },
    "grip": {
      "parts": [
        "part_grip_01",
        "part_grip_02",
        "part_grip_03",
        "part_grip_04_hyp",
        "part_grip_05b_ted_homing_ATLien",
        "part_grip_05c_ted_jav_ATLien",
        "part_grip_05b_ted_homing"
      ],
      "min": 0,
      "max": 1
    },
    "body_acc": {
      "parts": [],
      "min": 0,
      "max": 0
    },
    "magazine": {
      "parts": [
        "part_mag_01"
      ],
      "min": 0,
      "max": 1
    },
    "foregrip": {
      "parts": [
        "part_foregrip_01"
      ],
      "min": 0,
      "max": 1
    }
  }
};
const EXCLUSION_TAGS = {
  "part_ra_armor_segment_primary": [
    "armor"
  ],
  "part_ra_flanking_primary": [
    "ozoneexcluded"
  ],
  "part_ra_flanking_secondary": [
    "ozoneexcluded"
  ],
  "part_ra_nova_segment_primary": [
    "ozoneexcluded"
  ],
  "part_ra_nova_segment_secondary": [
    "ozoneexcluded"
  ],
  "part_barrel_01": [
    "unique",
    "exclude_from_ai"
  ],
  "part_barrel_01_a": [
    "barrel_mod_d",
    "licensed",
    "licensed_ted",
    "barrel_mod_b",
    "barrel_mod_c"
  ],
  "part_barrel_01_d": [
    "barrel_mod_a",
    "licensed_topacc",
    "barrel_mod_b",
    "barrel_mod_c"
  ],
  "part_barrel_02": [
    "unique",
    "underbarrel_barrel"
  ],
  "part_barrel_02_a": [
    "barrel_mod_c",
    "barrel_mod_d",
    "licensed",
    "licensed_ted",
    "underbarrel_barrel"
  ],
  "part_barrel_02_c": [
    "barrel_mod_a",
    "barrel_mod_d"
  ],
  "part_barrel_02_d": [
    "barrel_mod_a",
    "barrel_mod_c",
    "licensed_topacc"
  ],
  "part_barrel_licensed_hyp": [
    "barrel_mod_d",
    "licensed_topacc"
  ],
  "part_barrel_licensed_jak": [
    "barrel_mod_d",
    "licensed_topacc",
    "licensed"
  ],
  "part_barrel_licensed_ted": [
    "barrel_mod_d",
    "licensed_topacc"
  ],
  "part_barrel_licensed_ted_combo": [
    "barrel_mod_d",
    "licensed_topacc",
    "ted_combo"
  ],
  "part_barrel_licensed_ted_mirv": [
    "barrel_mod_d",
    "licensed_topacc",
    "ted_mirv"
  ],
  "part_barrel_licensed_ted_shooting": [
    "barrel_mod_d",
    "licensed_topacc",
    "ted_shooting"
  ],
  "part_mag_torgue_sticky": [
    "exclude_from_ai"
  ],
  "part_scope_acc_S01_L01_a": [
    "lens_02"
  ],
  "part_scope_acc_S01_L01_b": [
    "lens_02"
  ],
  "part_scope_acc_S01_L02_a": [
    "lens_01"
  ],
  "part_scope_acc_S01_L02_b": [
    "lens_01"
  ],
  "part_scope_acc_S02_L01_a": [
    "lens_02"
  ],
  "part_scope_acc_S02_L01_b": [
    "lens_02"
  ],
  "part_scope_acc_S02_L02_a": [
    "lens_01"
  ],
  "part_scope_acc_S02_L02_b": [
    "lens_01"
  ],
  "part_shield_ammo": [
    "hyp_shield_ammo"
  ],
  "part_shield_amp": [
    "hyp_shield_amp"
  ],
  "part_shield_default": [
    "hyp_shield_default"
  ],
  "part_shield_ricochet": [
    "hyp_shield_ricochet"
  ],
  "part_borg": [
    "normal"
  ],
  "passive_green_right_5_2_tier_1": [
    "green_right_5_2_tier_1"
  ],
  "part_core_cov_coldopen": [
    "cov_high_heat"
  ],
  "Part_Core_CoV_DuctTape": [
    "cov_low_heat"
  ],
  "Part_Core_COV_Smelter": [
    "cov_low_heat"
  ],
  "Part_Core_COV_Ventilator": [
    "cov_high_heat"
  ],
  "part_body_bolt": [
    "cov_mag"
  ],
  "part_01_mirv_03_micro_mirv": [
    "jakobs"
  ],
  "part_02_divider": [
    "borg",
    "jakobs",
    "maliwan"
  ],
  "part_02_divider_02_seeker": [
    "borg",
    "jakobs",
    "maliwan"
  ],
  "part_02_divider_04_repeater": [
    "borg",
    "jakobs",
    "maliwan"
  ],
  "part_03_spring": [
    "jakobs"
  ],
  "part_04_artillery": [
    "borg",
    "jakobs"
  ],
  "part_06_lingering_01_duration_bursts": [
    "cryo"
  ],
  "part_06_lingering_05_alchemic": [
    "cryo"
  ],
  "part_06_lingering_corrosive": [
    "jakobs"
  ],
  "part_06_lingering_cryo": [
    "jakobs"
  ],
  "part_06_lingering_fire": [
    "jakobs"
  ],
  "part_06_lingering_radiation": [
    "jakobs"
  ],
  "part_06_lingering_shock": [
    "jakobs"
  ],
  "part_corrosive": [
    "elem",
    "jakobs",
    "order"
  ],
  "part_cryo": [
    "elem",
    "jakobs",
    "order"
  ],
  "part_fire": [
    "elem",
    "jakobs",
    "order"
  ],
  "part_normal": [
    "maliwan",
    "body_acc_ele",
    "elem"
  ],
  "part_radiation": [
    "elem",
    "jakobs",
    "order"
  ],
  "part_shock": [
    "elem",
    "jakobs",
    "order"
  ],
  "part_stat_04_radius": [
    "jakobs"
  ],
  "part_stat_05_elemental_power": [
    "jakobs",
    "order"
  ],
  "part_stat_07_nuke": [
    "jakobs"
  ],
  "part_stat_08_force": [
    "jakobs"
  ],
  "part_underbarrel_02_crank": [
    "borg_mag"
  ],
  "part_scope_ironsight": [
    "barrel_02_b",
    "hyp_shield",
    "barrel_mod_d",
    "ted_shooting",
    "ted_mirv",
    "barrel_mod_a"
  ],
  "part_mag_02": [
    "barrel_02"
  ],
  "part_mag_02_B02": [
    "barrel_01"
  ],
  "part_mal": [
    "normal"
  ],
  "part_mag_05_borg_barrel_01": [
    "uni_complexroot"
  ],
  "part_barrel_licensed_multi": [
    "barrel_mod_d",
    "licensed_topacc"
  ],
  "part_barrel_licensed_ted_replicator": [
    "ted_multimod",
    "ted_replicator"
  ],
  "part_barrel_licensed_ted_replicator_multi": [
    "ted_replicator"
  ],
  "part_grip_05a_ted_legs": [
    "ted_mirv"
  ],
  "part_multi_ted_combo": [
    "ted_combo"
  ],
  "part_multi_ted_mirv": [
    "ted_mirv"
  ],
  "part_multi_ted_replicator": [
    "ted_replicator"
  ],
  "part_multi_ted_shooting": [
    "ted_shooting"
  ],
  "part_secondary_barrier_barred_aggression": [
    "term_aug_barrier_barred_aggro"
  ],
  "part_secondary_barrier_bullet_amp_gate": [
    "term_aug_barrier_bullet_amp"
  ],
  "part_secondary_barrier_dome": [
    "term_aug_barrier_dome"
  ],
  "part_secondary_barrier_elemental_field_corrosive": [
    "term_aug_barrier_elemental_field"
  ],
  "part_secondary_barrier_elemental_field_cryo": [
    "term_aug_barrier_elemental_field"
  ],
  "part_secondary_barrier_elemental_field_fire": [
    "term_aug_barrier_elemental_field"
  ],
  "part_secondary_barrier_elemental_field_radiation": [
    "term_aug_barrier_elemental_field"
  ],
  "part_secondary_barrier_elemental_field_shock": [
    "term_aug_barrier_elemental_field"
  ],
  "part_secondary_barrier_elemental_field_sonic": [
    "term_aug_barrier_elemental_field"
  ],
  "part_secondary_barrier_health": [
    "term_aug_barrier_health"
  ],
  "part_secondary_barrier_reflection": [
    "term_aug_barrier_reflection"
  ],
  "part_secondary_barrier_scopes_up": [
    "term_aug_barrier_scopes_up"
  ],
  "part_secondary_barrier_speed_gate": [
    "term_aug_barrier_speed_gate"
  ],
  "part_secondary_combat_cold_shoulder": [
    "term_aug_combat_cold_shoulder"
  ],
  "part_secondary_combat_contamination": [
    "term_aug_combat_contamination"
  ],
  "part_secondary_combat_kill_clip": [
    "term_aug_combat_kill_clip"
  ],
  "part_secondary_combat_orbiting": [
    "term_aug_combat_orbiting"
  ],
  "part_secondary_combat_potency": [
    "term_aug_combat_potency"
  ],
  "part_secondary_combat_radius": [
    "term_aug_combat_radius"
  ],
  "part_secondary_combat_reverb": [
    "term_aug_combat_reverb"
  ],
  "part_secondary_combat_to_the_nth": [
    "term_aug_combat_to_the_nth"
  ],
  "part_secondary_healing_iron_skin": [
    "term_aug_healing_iron_skin"
  ],
  "part_secondary_healing_leech_seed": [
    "term_aug_healing_leech_seed"
  ],
  "part_secondary_healing_life_steal": [
    "term_aug_healing_life_steal"
  ],
  "part_secondary_healing_overshield": [
    "term_aug_healing_overshield"
  ],
  "part_secondary_healing_potency": [
    "term_aug_healing_potency"
  ],
  "part_secondary_healing_radius": [
    "term_aug_healing_radius"
  ],
  "part_secondary_healing_shield_recharge": [
    "term_aug_healing_shield_recharge"
  ],
  "part_secondary_healing_thorns": [
    "term_aug_healing_thorns"
  ],
  "part_barrel_01_axc": [
    "barrel_mod_b"
  ],
  "part_barrel_01_aXd": [
    "barrel_mod_b",
    "barrel_mod_c"
  ],
  "part_barrel_01_b": [
    "barrel_mod_a",
    "barrel_mod_c",
    "barrel_mod_d"
  ],
  "part_barrel_01_bxd": [
    "barrel_mod_a",
    "barrel_mod_c"
  ],
  "part_barrel_01_c": [
    "barrel_mod_a",
    "barrel_mod_b",
    "barrel_mod_d"
  ],
  "part_barrel_01_cxd": [
    "barrel_mod_a",
    "barrel_mod_b"
  ],
  "part_unique_barrel_02_ravenfire": [
    "barrel_mod_a"
  ],
  "part_sonic": [
    "elem"
  ],
  "part_foregrip_01": [
    "underbarrel_barrel",
    "underbarrel_flamethrower"
  ],
  "part_foregrip_02": [
    "underbarrel_barrel",
    "underbarrel_flamethrower"
  ],
  "part_foregrip_03": [
    "underbarrel_barrel",
    "underbarrel_flamethrower"
  ],
  "part_underbarrel_07_secondbarrel": [
    "barrel_02",
    "barrel_01"
  ],
  "part_underbarrel_secondbarrel_acc_A": [
    "barrel_02"
  ],
  "part_underbarrel_secondbarrel_acc_B": [
    "barrel_02"
  ],
  "part_underbarrel_secondbarrel_acc_C": [
    "barrel_02"
  ],
  "part_core_vla_bottomfeeder": [
    "not_underbarrel"
  ],
  "part_core_vla_boxmagazine": [
    "underbarrel_mode"
  ],
  "part_core_vla_bullethose": [
    "underbarrel_mode"
  ],
  "part_core_vla_underdog": [
    "not_underbarrel"
  ],
  "part_barrel_02_c_d": [
    "barrel_mod_d"
  ],
  "part_barrel_02_d_c": [
    "barrel_mod_c"
  ],
  "part_underbarrel_03_flamethrower": [
    "underbarrel_flamethrower"
  ],
  "part_multi_ted_combo_ATLien": [
    "ted_combo"
  ]
};
const PART_WEIGHTS = {
  "part_barrel_licensed_hyp": {
    "datatablevalue": {
      "datatable": "gbx_ue_data_table'none'"
    },
    "attribute": "attribute'attr_weight_weapon_barrel_mod_hyp'"
  },
  "part_barrel_licensed_jak": {
    "datatablevalue": {
      "datatable": "gbx_ue_data_table'none'"
    },
    "attribute": "attribute'attr_weight_weapon_barrel_mod_jak'"
  },
  "part_barrel_licensed_ted": {
    "constant": "0.250000",
    "datatablevalue": {
      "datatable": "gbx_ue_data_table'none'"
    },
    "attribute": "attribute'attr_weight_weapon_barrel_mod_ted'"
  },
  "part_barrel_licensed_ted_combo": {
    "constant": "0.250000",
    "attribute": "attribute'attr_weight_weapon_barrel_mod_ted_combo'"
  },
  "part_barrel_licensed_ted_mirv": {
    "constant": "0.250000",
    "attribute": "attribute'attr_weight_weapon_barrel_mod_ted_mirv'"
  },
  "part_barrel_licensed_ted_shooting": {
    "constant": "0.250000",
    "attribute": "attribute'attr_weight_weapon_barrel_mod_ted_shooting'"
  },
  "part_grip_04_hyp": {
    "attribute": "attribute'attr_weight_weapon_grip_hyp'"
  },
  "part_grip_05a_ted_legs": {
    "attribute": "attribute'attr_weight_weapon_grip_ted_legs'"
  },
  "part_grip_05b_ted_homing": {
    "datatablevalue": {
      "datatable": "gbx_ue_data_table'none'"
    },
    "attribute": "attribute'attr_weight_weapon_grip_ted_homing'"
  },
  "part_grip_05c_ted_jav": {
    "datatablevalue": {
      "datatable": "gbx_ue_data_table'none'"
    },
    "attribute": "attribute'attr_weight_weapon_grip_ted_jav'"
  },
  "part_mag_03_tor": {
    "constant": "0.400000",
    "attribute": "attribute'attr_weight_weapon_mag_tor'"
  },
  "part_mag_04_cov": {
    "attribute": "attribute'attr_weight_weapon_mag_cov'"
  },
  "part_shield_ammo": {
    "datatablevalue": {
      "datatable": "gbx_ue_data_table'none'"
    },
    "attribute": "attribute'attr_weight_weapon_shield_absorb'"
  },
  "part_shield_amp": {
    "datatablevalue": {
      "datatable": "gbx_ue_data_table'none'"
    },
    "attribute": "attribute'attr_weight_weapon_shield_amp'"
  },
  "part_shield_default": {
    "datatablevalue": {
      "datatable": "gbx_ue_data_table'none'"
    },
    "attribute": "attribute'attr_weight_weapon_shield_default'"
  },
  "part_shield_ricochet": {
    "datatablevalue": {
      "datatable": "gbx_ue_data_table'none'"
    },
    "attribute": "attribute'attr_weight_weapon_shield_reflect'"
  },
  "part_underbarrel_01_beam": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_gauss": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_discharge": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_04_atlas": {
    "constant": "0.500000",
    "attribute": "attribute'attr_weight_weapon_underbarrel_atlas'"
  },
  "part_underbarrel_04_atlas_ball": {
    "constant": "0.500000",
    "attribute": "attribute'attr_weight_weapon_underbarrel_atlas'"
  },
  "part_underbarrel_05_ammoswitcher": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_dad'"
  },
  "part_underbarrel_06_malswitch": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_mal'"
  },
  "part_underbarrel_01_shrapnel": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_drunkrocket": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_gastrap": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_01_gravtrap": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_seeker": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_marked": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "passive_blue_1_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_1_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_1_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_1_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_1_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_1_2_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_1_2_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_1_2_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_1_2_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_1_2_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_1_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_1_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_1_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_1_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_1_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_1_4_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_1_4_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_1_4_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_1_4_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_1_4_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_1_5_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_1_5_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_1_5_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_1_5_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_1_5_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_2_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_2_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_2_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_2_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_2_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_2_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_2_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_2_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_2_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_2_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_2_5_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_2_5_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_2_5_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_2_5_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_2_5_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_3_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_3_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_3_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_3_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_3_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_3_2_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_3_2_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_3_2_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_3_2_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_3_2_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_3_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_3_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_3_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_3_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_3_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_3_4_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_3_4_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_3_4_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_3_4_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_3_4_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_3_5_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_3_5_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_3_5_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_3_5_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_3_5_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_left_4_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_left_4_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_left_4_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_left_4_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_left_4_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_left_4_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_left_4_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_left_4_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_left_4_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_left_4_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_left_5_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_left_5_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_left_5_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_left_5_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_left_5_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_left_5_2_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_left_5_2_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_left_5_2_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_left_5_2_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_left_5_2_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_left_5_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_left_5_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_left_5_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_left_5_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_left_5_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_left_6_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_left_6_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_left_6_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_left_6_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_left_6_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_left_6_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_left_6_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_left_6_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_left_6_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_left_6_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_mid_4_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_mid_4_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_mid_4_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_mid_4_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_mid_4_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_mid_4_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_mid_4_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_mid_4_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_mid_4_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_mid_4_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_mid_5_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_mid_5_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_mid_5_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_mid_5_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_mid_5_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_mid_5_2_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_mid_5_2_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_mid_5_2_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_mid_5_2_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_mid_5_2_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_mid_5_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_mid_5_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_mid_5_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_mid_5_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_mid_5_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_mid_6_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_mid_6_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_mid_6_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_mid_6_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_mid_6_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_mid_6_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_mid_6_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_mid_6_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_mid_6_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_mid_6_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_right_4_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_right_4_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_right_4_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_right_4_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_right_4_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_right_4_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_right_4_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_right_4_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_right_4_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_right_4_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_right_5_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_right_5_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_right_5_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_right_5_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_right_5_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_right_5_2_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_right_5_2_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_right_5_2_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_right_5_2_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_right_5_2_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_right_5_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_right_5_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_right_5_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_right_5_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_right_5_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_right_6_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_right_6_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_right_6_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_right_6_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_right_6_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_right_6_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_blue_right_6_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_blue_right_6_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_blue_right_6_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_blue_right_6_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_1_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_1_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_1_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_1_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_1_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_1_2_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_1_2_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_1_2_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_1_2_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_1_2_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_1_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_1_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_1_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_1_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_1_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_1_4_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_1_4_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_1_4_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_1_4_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_1_4_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_1_5_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_1_5_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_1_5_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_1_5_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_1_5_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_2_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_2_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_2_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_2_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_2_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_2_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_2_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_2_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_2_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_2_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_2_5_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_2_5_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_2_5_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_2_5_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_2_5_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_3_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_3_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_3_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_3_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_3_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_3_2_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_3_2_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_3_2_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_3_2_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_3_2_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_3_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_3_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_3_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_3_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_3_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_3_4_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_3_4_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_3_4_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_3_4_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_3_4_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_3_5_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_3_5_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_3_5_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_3_5_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_3_5_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_left_4_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_left_4_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_left_4_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_left_4_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_left_4_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_left_4_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_left_4_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_left_4_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_left_4_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_left_4_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_left_5_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_left_5_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_left_5_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_left_5_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_left_5_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_left_5_2_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_left_5_2_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_left_5_2_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_left_5_2_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_left_5_2_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_left_5_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_left_5_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_left_5_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_left_5_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_left_5_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_left_6_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_left_6_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_left_6_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_left_6_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_left_6_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_left_6_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_left_6_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_left_6_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_left_6_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_left_6_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_mid_4_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_mid_4_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_mid_4_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_mid_4_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_mid_4_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_mid_4_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_mid_4_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_mid_4_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_mid_4_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_mid_4_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_mid_5_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_mid_5_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_mid_5_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_mid_5_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_mid_5_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_mid_5_2_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_mid_5_2_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_mid_5_2_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_mid_5_2_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_mid_5_2_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_mid_5_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_mid_5_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_mid_5_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_mid_5_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_mid_5_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_mid_6_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_mid_6_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_mid_6_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_mid_6_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_mid_6_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_mid_6_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_mid_6_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_mid_6_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_mid_6_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_mid_6_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_right_4_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_right_4_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_right_4_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_right_4_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_right_4_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_right_4_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_right_4_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_right_4_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_right_4_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_right_4_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_right_5_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_right_5_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_right_5_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_right_5_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_right_5_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_right_5_2_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_right_5_2_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_right_5_2_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_right_5_2_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_right_5_2_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_right_5_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_right_5_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_right_5_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_right_5_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_right_5_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_right_6_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_right_6_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_right_6_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_right_6_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_right_6_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_green_right_6_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_green_right_6_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_green_right_6_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_green_right_6_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_green_right_6_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_1_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_1_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_1_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_1_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_1_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_1_2_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_1_2_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_1_2_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_1_2_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_1_2_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_1_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_1_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_1_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_1_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_1_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_1_4_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_1_4_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_1_4_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_1_4_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_1_4_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_1_5_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_1_5_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_1_5_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_1_5_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_1_5_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_2_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_2_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_2_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_2_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_2_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_2_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_2_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_2_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_2_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_2_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_2_5_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_2_5_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_2_5_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_2_5_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_2_5_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_3_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_3_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_3_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_3_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_3_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_3_2_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_3_2_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_3_2_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_3_2_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_3_2_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_3_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_3_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_3_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_3_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_3_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_3_4_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_3_4_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_3_4_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_3_4_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_3_4_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_3_5_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_3_5_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_3_5_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_3_5_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_3_5_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_left_4_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_left_4_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_left_4_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_left_4_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_left_4_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_left_4_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_left_4_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_left_4_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_left_4_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_left_4_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_left_5_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_left_5_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_left_5_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_left_5_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_left_5_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_left_5_2_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_left_5_2_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_left_5_2_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_left_5_2_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_left_5_2_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_left_5_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_left_5_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_left_5_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_left_5_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_left_5_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_left_6_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_left_6_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_left_6_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_left_6_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_left_6_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_left_6_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_left_6_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_left_6_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_left_6_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_left_6_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_mid_4_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_mid_4_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_mid_4_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_mid_4_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_mid_4_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_mid_4_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_mid_4_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_mid_4_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_mid_4_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_mid_4_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_mid_5_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_mid_5_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_mid_5_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_mid_5_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_mid_5_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_mid_5_2_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_mid_5_2_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_mid_5_2_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_mid_5_2_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_mid_5_2_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_mid_5_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_mid_5_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_mid_5_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_mid_5_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_mid_5_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_mid_6_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_mid_6_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_mid_6_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_mid_6_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_mid_6_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_mid_6_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_mid_6_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_mid_6_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_mid_6_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_mid_6_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_right_4_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_right_4_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_right_4_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_right_4_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_right_4_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_right_4_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_right_4_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_right_4_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_right_4_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_right_4_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_right_5_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_right_5_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_right_5_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_right_5_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_right_5_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_right_5_2_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_right_5_2_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_right_5_2_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_right_5_2_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_right_5_2_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_right_5_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_right_5_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_right_5_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_right_5_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_right_5_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_right_6_1_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_right_6_1_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_right_6_1_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_right_6_1_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_right_6_1_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_red_right_6_3_tier_1": {
    "attribute": "attribute'weight_classmod_tier_01'"
  },
  "passive_red_right_6_3_tier_2": {
    "attribute": "attribute'weight_classmod_tier_02'"
  },
  "passive_red_right_6_3_tier_3": {
    "attribute": "attribute'weight_classmod_tier_03'"
  },
  "passive_red_right_6_3_tier_4": {
    "attribute": "attribute'weight_classmod_tier_04'"
  },
  "passive_red_right_6_3_tier_5": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "passive_blue_2_3_tiers_1": {
    "attribute": "attribute'weight_classmod_tier_05'"
  },
  "part_grav_asm_skill_test": {
    "constant": "0.000000"
  },
  "part_body_b": {
    "constant": "0.350000",
    "datatablevalue": {
      "datatable": "gbx_ue_data_table'none'"
    }
  },
  "part_body_d": {
    "datatablevalue": {
      "datatable": "gbx_ue_data_table'none'"
    },
    "attribute": "attribute'attr_weight_weapon_body_mod_elemental'"
  },
  "part_mag_05_borg": {
    "attribute": "attribute'attr_weight_weapon_mag_bor'"
  },
  "part_underbarrel_01_grenade": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_shotgun": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_microrocket": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_06_star_helix": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_mal'"
  },
  "part_underbarrel_01_taser": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_knifelauncher": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_semtex": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_01_microrocket": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_Singularity": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_mine": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_scope_acc_S02_LB_a": {
    "constant": "0.000000",
    "datatablevalue": {
      "datatable": "gbx_ue_data_table'none'"
    }
  },
  "part_scope_acc_S02_LB_b": {
    "constant": "0.000000",
    "datatablevalue": {
      "datatable": "gbx_ue_data_table'none'"
    }
  },
  "part_underbarrel_01_stungrenade": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_overcharge": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_firmware_action_fist": {
    "attribute": "attribute'firmware_actionfist_weight'"
  },
  "part_firmware_airstrike": {
    "attribute": "attribute'firmware_airstrike_weight'"
  },
  "part_firmware_atlas_ex": {
    "attribute": "attribute'firmware_atlasEX_weight'"
  },
  "part_firmware_atlas_infinum": {
    "attribute": "attribute'firmware_atlasinfinum_weight'"
  },
  "part_firmware_baker": {
    "attribute": "attribute'firmware_baker_weight'"
  },
  "part_firmware_bullets_to_spare": {
    "attribute": "attribute'firmware_bulletstospare_weight'"
  },
  "part_firmware_daeddy_o": {
    "attribute": "attribute'firmware_daeddyo_weight'"
  },
  "part_firmware_deadeye": {
    "attribute": "attribute'firmware_deadeye_weight'"
  },
  "part_firmware_gadget_ahoy": {
    "attribute": "attribute'firmware_gadgetahoy_weight'"
  },
  "part_firmware_get_throwin": {
    "attribute": "attribute'firmware_getthrowd_weight'"
  },
  "part_firmware_god_killer": {
    "attribute": "attribute'firmware_godkiller_weight'"
  },
  "part_firmware_goojfc": {
    "attribute": "attribute'firmware_goojfc_weight'"
  },
  "part_firmware_heating_up": {
    "attribute": "attribute'firmware_heatingup_weight'"
  },
  "part_firmware_high_caliber": {
    "attribute": "attribute'firmware_highcaliber_weight'"
  },
  "part_firmware_jacked": {
    "attribute": "attribute'firmware_jacked_weight'"
  },
  "part_firmware_lifeblood": {
    "attribute": "attribute'firmware_lifeblood_weight'"
  },
  "part_firmware_oscar_mike": {
    "attribute": "attribute'firmware_oscarmike_weight'"
  },
  "part_firmware_reel_big_fist": {
    "attribute": "attribute'firmware_ReelBigFist_weight'"
  },
  "part_firmware_risky_boots": {
    "attribute": "attribute'firmware_riskyboots_weight'"
  },
  "part_firmware_rubberband_man": {
    "attribute": "attribute'firmware_rubberbandman_weight'"
  },
  "part_firmware_trickshot": {
    "attribute": "attribute'firmware_trickshot_weight'"
  },
  "part_underbarrel_01_flintlock": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_crank": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_shotgun": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_vial": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_01_knifelauncher": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_meathook": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_grenade": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_01_shotgun": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_rocket": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_crank": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_01_blowback": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_energydisc": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_beam_tosser": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_01_laserwire": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_overcharge": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_railgun": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_01_singularity": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_multitaser": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_rocketpod": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_01_seeker": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_deathsphere": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_killdrone": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_01_energyburst": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_gravitywell": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_rockets": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_01_spear": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_tether_snare": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_barrel_licensed_multi": {
    "attribute": "attribute'attr_weight_weapon_barrel_mod_ted_multi'"
  },
  "part_grip_05a_ted_legs_mirv": {
    "attribute": "attribute'attr_weight_weapon_grip_ted_legs'"
  },
  "part_grip_05b_ted_jav": {
    "datatablevalue": {
      "datatable": "gbx_ue_data_table'none'"
    },
    "attribute": "attribute'attr_weight_weapon_grip_ted_jav'"
  },
  "part_grip_05c_ted_homing": {
    "attribute": "attribute'attr_weight_weapon_grip_ted_homing'"
  },
  "part_underbarrel_01_buffdrone": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_comboorb": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_01_autoturret": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_stickymine": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_deployable_shield": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_endgame_gadget_used_damage": {
    "attribute": "attribute'anointed_weight_init'"
  },
  "part_primary_barrier_elemental_field_corrosive": {
    "postscale": "0.160000"
  },
  "part_primary_barrier_elemental_field_cryo": {
    "postscale": "0.170000"
  },
  "part_primary_barrier_elemental_field_fire": {
    "postscale": "0.160000"
  },
  "part_primary_barrier_elemental_field_radiation": {
    "postscale": "0.170000"
  },
  "part_primary_barrier_elemental_field_shock": {
    "postscale": "0.170000"
  },
  "part_primary_barrier_elemental_field_sonic": {
    "postscale": "0.160000"
  },
  "part_secondary_barrier_elemental_field_corrosive": {
    "postscale": "0.170000"
  },
  "part_secondary_barrier_elemental_field_cryo": {
    "postscale": "0.160000"
  },
  "part_secondary_barrier_elemental_field_fire": {
    "postscale": "0.170000"
  },
  "part_secondary_barrier_elemental_field_radiation": {
    "postscale": "0.160000"
  },
  "part_secondary_barrier_elemental_field_shock": {
    "postscale": "0.160000"
  },
  "part_secondary_barrier_elemental_field_sonic": {
    "postscale": "0.170000"
  },
  "part_underbarrel_01_mirvgrenade": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_airstrike": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_01_rockets": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_blowback": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_Cleaver": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_01_seeker_missiles": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_flameblast": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_bounce_grenade": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_anointed_movement_speed": {
    "attribute": "attribute'anointed_weight_init'"
  },
  "part_endgame_gadgetused_damage_turret": {
    "attribute": "attribute'anointed_weight_init'"
  },
  "part_endgame_none": {
    "attribute": "attribute'anointed_weight_init'"
  },
  "part_underbarrel_01_grenadelauncher": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_bipod": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_07_secondbarrel": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_01_microrockets": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_02_taser": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_underbarrel_03_flamethrower": {
    "attribute": "attribute'attr_weight_weapon_underbarrel_default'"
  },
  "part_grip_05b_ted_homing_ATLien": {
    "attribute": "attribute'attr_weight_weapon_grip_ted_homing'"
  },
  "part_grip_05c_ted_jav_ATLien": {
    "attribute": "attribute'attr_weight_weapon_grip_ted_jav'"
  }
};
const MIN_MAX_PARTS = {
  "core_augment": [
    {
      "item": "ATL_Enhancement",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    },
    {
      "item": "BOR_Enhancement",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    },
    {
      "item": "COV_Enhancement",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    },
    {
      "item": "DAD_Enhancement",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    },
    {
      "item": "HYP_Enhancement",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    },
    {
      "item": "JAK_Enhancement",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    },
    {
      "item": "MAL_Enhancement",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    },
    {
      "item": "ORD_Enhancement",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    },
    {
      "item": "TED_Enhancement",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    },
    {
      "item": "TOR_Enhancement",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    },
    {
      "item": "VLA_Enhancement",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    }
  ],
  "body_acc": [
    {
      "item": "BOR_SG",
      "rarity": "legendary",
      "min": 3,
      "max": 4
    },
    {
      "item": "BOR_SM",
      "rarity": "legendary",
      "min": 3,
      "max": 3
    },
    {
      "item": "DAD_SM",
      "rarity": "legendary",
      "min": 3,
      "max": 3
    },
    {
      "item": "DAD_SM",
      "rarity": "legendary",
      "min": 3,
      "max": 3
    },
    {
      "item": "JAK_PS",
      "rarity": "legendary",
      "min": 3,
      "max": 4
    },
    {
      "item": "JAK_PS",
      "rarity": "common",
      "min": 3,
      "max": 3
    },
    {
      "item": "MAL_SM",
      "rarity": "common",
      "min": 4,
      "max": 4
    },
    {
      "item": "MAL_SR",
      "rarity": "legendary",
      "min": 3,
      "max": 4
    },
    {
      "item": "MAL_SR",
      "rarity": "legendary",
      "min": 3,
      "max": 4
    },
    {
      "item": "ORD_PS",
      "rarity": "common",
      "min": 2,
      "max": 2
    },
    {
      "item": "ORD_PS",
      "rarity": "common",
      "min": 2,
      "max": 2
    },
    {
      "item": "TED_AR",
      "rarity": "common",
      "min": 3,
      "max": 3
    },
    {
      "item": "TED_SG",
      "rarity": "legendary",
      "min": 3,
      "max": 4
    },
    {
      "item": "TOR_HW",
      "rarity": "legendary",
      "min": 3,
      "max": 3
    }
  ],
  "scope_acc": [
    {
      "item": "BOR_SG",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    },
    {
      "item": "BOR_SM",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    },
    {
      "item": "DAD_SM",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    },
    {
      "item": "JAK_PS",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    },
    {
      "item": "MAL_SR",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    },
    {
      "item": "MAL_SR",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    },
    {
      "item": "TED_SG",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    }
  ],
  "barrel_acc": [
    {
      "item": "BOR_SM",
      "rarity": "legendary",
      "min": 3,
      "max": 3
    },
    {
      "item": "DAD_SM",
      "rarity": "legendary",
      "min": 2,
      "max": 3
    },
    {
      "item": "DAD_SM",
      "rarity": "legendary",
      "min": 2,
      "max": 3
    },
    {
      "item": "JAK_AR",
      "rarity": "common",
      "min": 3,
      "max": 3
    },
    {
      "item": "JAK_PS",
      "rarity": "legendary",
      "min": 3,
      "max": 4
    },
    {
      "item": "JAK_PS",
      "rarity": "common",
      "min": 4,
      "max": 4
    },
    {
      "item": "MAL_SM",
      "rarity": "common",
      "min": 3,
      "max": 3
    },
    {
      "item": "MAL_SR",
      "rarity": "legendary",
      "min": 3,
      "max": 4
    },
    {
      "item": "MAL_SR",
      "rarity": "legendary",
      "min": 3,
      "max": 4
    },
    {
      "item": "ORD_PS",
      "rarity": "common",
      "min": 3,
      "max": 3
    },
    {
      "item": "ORD_PS",
      "rarity": "common",
      "min": 3,
      "max": 3
    },
    {
      "item": "TED_AR",
      "rarity": "common",
      "min": 3,
      "max": 3
    },
    {
      "item": "TED_SG",
      "rarity": "legendary",
      "min": 4,
      "max": 4
    }
  ],
  "magazine_borg": [
    {
      "item": "BOR_SM",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    }
  ],
  "passive_points": [
    {
      "item": "classmod_dark_siren",
      "rarity": "legendary",
      "min": 6,
      "max": 6
    }
  ],
  "curative": [
    {
      "item": "mal_repair_kit",
      "rarity": "uncommon",
      "min": 2,
      "max": 2
    },
    {
      "item": "mal_repair_kit",
      "rarity": "rare",
      "min": 2,
      "max": 2
    },
    {
      "item": "mal_repair_kit",
      "rarity": "epic",
      "min": 3,
      "max": 3
    }
  ],
  "enemy_augment": [
    {
      "item": "Terminal_Gadget",
      "rarity": "epic",
      "min": 2,
      "max": 2
    }
  ],
  "underbarrel_acc": [
    {
      "item": "VLA_AR",
      "rarity": "rare",
      "min": 0,
      "max": 2
    },
    {
      "item": "VLA_AR",
      "rarity": "epic",
      "min": 0,
      "max": 3
    },
    {
      "item": "VLA_AR",
      "rarity": "legendary",
      "min": 0,
      "max": 3
    },
    {
      "item": "VLA_SR",
      "rarity": "rare",
      "min": 0,
      "max": 2
    },
    {
      "item": "VLA_SR",
      "rarity": "epic",
      "min": 0,
      "max": 3
    },
    {
      "item": "VLA_SR",
      "rarity": "legendary",
      "min": 0,
      "max": 3
    },
    {
      "item": "VLA_SR",
      "rarity": "legendary",
      "min": 0,
      "max": 3
    }
  ],
  "barrel_licensed": [
    {
      "item": "VLA_HW",
      "rarity": "epic",
      "min": 2,
      "max": 2
    },
    {
      "item": "VLA_HW",
      "rarity": "legendary",
      "min": 2,
      "max": 2
    }
  ]
};
window.EDITOR_PART_SELECTION_DATA = PART_SELECTION_DATA;
window.EDITOR_EXCLUSION_TAGS = EXCLUSION_TAGS;
window.EDITOR_PART_WEIGHTS = PART_WEIGHTS;
window.EDITOR_MIN_MAX_PARTS = MIN_MAX_PARTS;
})();
