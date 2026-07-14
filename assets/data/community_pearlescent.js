(function () {
  'use strict';
  window.COMMUNITY_PEARLESCENT_DATA = {
  "generated_at": "2026-07-13T23:07:03.566Z",
  "game_version": "Raid 2 (May 2026)",
  "gear_database_source": "Borderlands 4 Gear Database (PDF/DOCX) + Nexus export sync + Nexus export sync + Nexus export sync + Nexus export sync + Nexus export sync + Nexus export sync",
  "nexus_dir": "references/bl4_toolbox_export/ncs/json",
  "refresh_command": "node scripts/build-pearl-phosphene-flags.mjs && node scripts/build-community-pearlescent.mjs && node scripts/build-loot-reference-data.mjs",
  "sources": [
    "assets/data/borderlands4_gear_database_raid2.json",
    "assets/data/pearl_phosphene_flags.json",
    "assets/data/pearl_phosphene_overrides.json",
    "assets/data/stx_dataset_supplement.js",
    "assets/data/stx_raid2_supplement.js",
    "assets/data/echo4_shiny_codes.js",
    "assets/data/yaml_save_catalog.js",
    "scripts/lib/pearl-acquisition-export.mjs (ItemPoolList dedicated + itempool_*_06_pearl world path)",
    "references/bl4_toolbox_export/ncs/json"
  ],
  "acquisition_export": {
    "proof_rule": "Dedicated = inv handle on ItemPoolList_*; world = no dedicated list + matching itempool_{sm|ar|ps|sg|sr}_06_pearl criteria pool present",
    "generic_pools": {
      "sm": "itempool_sm_06_pearl",
      "ar": "itempool_ar_06_pearl",
      "ps": "itempool_ps_06_pearl",
      "sg": "itempool_sg_06_pearl",
      "sr": "itempool_sr_06_pearl"
    },
    "stats": {
      "dedicated": 6,
      "world_criteria": 11,
      "named_pearl_pool": 0,
      "unknown": 0
    }
  },
  "stats": {
    "total": 17,
    "with_pearl_comp": 17,
    "with_pearl_comp_expected": 0,
    "with_id_raw": 17,
    "with_serial_u": 4,
    "in_nexus_export": 7,
    "in_supplement": 14,
    "verified_status": 17,
    "needs_verification": 0,
    "export_pending": 0,
    "phosphene_yes": 2,
    "phosphene_no": 15,
    "phosphene_ambiguous": 0,
    "acquisition_dedicated": 6,
    "acquisition_world_criteria": 11,
    "acquisition_named_pearl_pool": 0,
    "acquisition_unknown": 0
  },
  "items": [
    {
      "slug": "abyss",
      "gear_slug": "abyss",
      "display_name": "Abyss",
      "spawn_tokens": [
        "abyss"
      ],
      "yaml_key": "shiny_abyss",
      "expected_inv": "bor_sr",
      "weapon_type": "Sniper Rifle",
      "manufacturer": "Ripper",
      "rarity": "Pearlescent",
      "red_text": "It stares back.",
      "unique_effect": "Abyss — Increases damage the higher it is charged. If full charge is held too long, triggers a self-damaging explosion.",
      "drop_source": "World Drop (Raid 2)",
      "dedicated_drop": false,
      "raid_drop": true,
      "world_drop": true,
      "mission_reward": false,
      "vendor": false,
      "dlc": "Raid 2",
      "patch_introduced": "1.8",
      "patch_removed": null,
      "status": "verified",
      "notes": "Export-synced pearl (rarity_06_pearlescent).",
      "comp_pearl": "BOR_SR.comp_05_legendary_abyss",
      "comp_pearl_expected": null,
      "pearl_comp_style": "legendary_pearl",
      "comp_pearl_slug": "abyss",
      "itempool_pearl": null,
      "comp_legendary_candidates": [
        "bor_sr.comp_05_legendary_abyss"
      ],
      "comp_candidates": [
        "bor_sr.comp_05_legendary_abyss",
        "bor_sr.comp_06_pearl_abyss",
        "bor_sr.comp_06_pearlescent_abyss"
      ],
      "alternate_editor_comps": [],
      "id_raw": "23:61",
      "skin_code": "{23:61}",
      "serial_u": null,
      "serial_hint": "{23:61} + |\"c\",1|",
      "camo_token": "|\"c\",1|",
      "internal_balance_name": "BOR_SR.comp_05_legendary_abyss",
      "internal_name": "abyss",
      "can_be_phosphene": false,
      "phosphene_status": "verified_no",
      "phosphene_evidence": {
        "source": "assets/data/pearl_phosphene_flags.json",
        "flag_key": "abyss",
        "status": "verified_no",
        "notes": "Export: no Challenge_Shiny_* / challengereward_*_shiny_* and no itempool_*_shiny with Cosmetics_Weapon_Shiny_* for this pearl slug.",
        "evidence": []
      },
      "can_be_pearlescent": true,
      "wiki_url": null,
      "verification": {
        "in_gear_database": true,
        "in_supplement": true,
        "in_nexus_export": false,
        "in_pearl_itempool": false,
        "in_echo4": false,
        "in_yaml_catalog": false,
        "comp_match_via": "legendary_supplement",
        "pearl_comp_style": "legendary_pearl",
        "in_dedicated_itempoollist": false,
        "in_world_criteria_pool": true
      },
      "itempool_lists": [],
      "world_criteria_pool": "itempool_sr_06_pearl",
      "acquisition_kind": "world_criteria",
      "acquisition_evidence": [
        {
          "kind": "world_criteria_pool",
          "itempool": "itempool_sr_06_pearl",
          "weapon_type_code": "sr",
          "note": "Criteria pool selects rarity tag pearl + weapon type; membership inferred from pearlescent inv. NCS Rarity table lacks 06_pearlescent row in current dump."
        }
      ],
      "acquisition_notes": "Export: no dedicated ItemPoolList hit; candidate world path itempool_sr_06_pearl (wired under type *_all parents e.g. itempool_smg_all / itempool_assaultrifle_all) via Att_RarityWeight_06_Pearl."
    },
    {
      "slug": "conflux",
      "gear_slug": "conflux",
      "display_name": "Conflux",
      "spawn_tokens": [
        "conflux",
        "vestigialconflux"
      ],
      "yaml_key": "shiny_conflux",
      "expected_inv": "mal_sr",
      "weapon_type": "Sniper Rifle",
      "manufacturer": "Maliwan",
      "rarity": "Pearlescent",
      "red_text": "It's self-indulgent, I admit.",
      "unique_effect": "Sinew — Deals damage per Status Effect on the target.",
      "drop_source": "World Drop (Raid 2)",
      "dedicated_drop": false,
      "raid_drop": true,
      "world_drop": true,
      "mission_reward": false,
      "vendor": false,
      "dlc": "Raid 2",
      "patch_introduced": "1.8",
      "patch_removed": null,
      "status": "verified",
      "notes": "Export-synced pearl (rarity_06_pearlescent+itempool_legendary_pearl).",
      "comp_pearl": "MAL_SR.comp_05_legendary_conflux",
      "comp_pearl_expected": null,
      "pearl_comp_style": "legendary_pearl",
      "comp_pearl_slug": "conflux",
      "itempool_pearl": "itempool_mal_sr_05_legendary_conflux_pearl",
      "comp_legendary_candidates": [
        "mal_sr.comp_05_legendary_conflux",
        "mal_sr.comp_05_legendary_vestigialconflux"
      ],
      "comp_candidates": [
        "mal_sr.comp_05_legendary_conflux",
        "mal_sr.comp_06_pearl_conflux",
        "mal_sr.comp_06_pearlescent_conflux",
        "mal_sr.comp_05_legendary_vestigialconflux",
        "mal_sr.comp_06_pearl_vestigialconflux",
        "mal_sr.comp_06_pearlescent_vestigialconflux"
      ],
      "alternate_editor_comps": [
        "mal_sr.comp_05_legendary_conflux"
      ],
      "id_raw": "25:82",
      "skin_code": "{25:82}",
      "serial_u": null,
      "serial_hint": "{25:82} + |\"c\",1|",
      "camo_token": "|\"c\",1|",
      "internal_balance_name": "MAL_SR.comp_05_legendary_conflux",
      "internal_name": "conflux",
      "can_be_phosphene": false,
      "phosphene_status": "verified_no",
      "phosphene_evidence": {
        "source": "assets/data/pearl_phosphene_flags.json",
        "flag_key": "conflux",
        "status": "verified_no",
        "notes": "Export: no Challenge_Shiny_* / challengereward_*_shiny_* and no itempool_*_shiny with Cosmetics_Weapon_Shiny_* for this pearl slug.",
        "evidence": []
      },
      "can_be_pearlescent": true,
      "wiki_url": null,
      "verification": {
        "in_gear_database": true,
        "in_supplement": false,
        "in_nexus_export": true,
        "in_pearl_itempool": true,
        "in_echo4": false,
        "in_yaml_catalog": false,
        "comp_match_via": "legendary_pearl_pool",
        "pearl_comp_style": "legendary_pearl",
        "in_dedicated_itempoollist": false,
        "in_world_criteria_pool": true
      },
      "itempool_lists": [],
      "world_criteria_pool": "itempool_sr_06_pearl",
      "acquisition_kind": "world_criteria",
      "acquisition_evidence": [
        {
          "kind": "world_criteria_pool",
          "itempool": "itempool_sr_06_pearl",
          "weapon_type_code": "sr",
          "note": "Criteria pool selects rarity tag pearl + weapon type; membership inferred from pearlescent inv. NCS Rarity table lacks 06_pearlescent row in current dump."
        },
        {
          "kind": "named_pearl_itempool",
          "itempool": "itempool_mal_sr_05_legendary_conflux_pearl",
          "note": "Named legendary_*_pearl itempool exists; no ItemPoolList consumer found for dedicated boss wiring."
        }
      ],
      "acquisition_notes": "Export: no dedicated ItemPoolList hit; candidate world path itempool_sr_06_pearl (wired under type *_all parents e.g. itempool_smg_all / itempool_assaultrifle_all) via Att_RarityWeight_06_Pearl."
    },
    {
      "slug": "constable",
      "gear_slug": "loomingconstable",
      "display_name": "Constable",
      "spawn_tokens": [
        "loomingconstable",
        "looming",
        "constable"
      ],
      "yaml_key": "shiny_constable",
      "expected_inv": "jak_sg",
      "weapon_type": "Shotgun",
      "manufacturer": "Jakobs",
      "rarity": "Pearlescent",
      "red_text": "We see nothing truly till we understand it.",
      "unique_effect": "Lethal Deterrent",
      "drop_source": "World Drop (Raid 2)",
      "dedicated_drop": false,
      "raid_drop": true,
      "world_drop": true,
      "mission_reward": false,
      "vendor": false,
      "dlc": "Raid 2",
      "patch_introduced": "1.8",
      "patch_removed": null,
      "status": "partial",
      "notes": "Nexus supplement uses comp_06_pearl_constable with display Pearl Constable Export-synced pearl (comp_06_pearl_key+rarity_06_pearlescent).",
      "comp_pearl": "JAK_SG.comp_06_pearl_constable",
      "comp_pearl_expected": null,
      "pearl_comp_style": "comp_06_pearl",
      "comp_pearl_slug": "constable",
      "itempool_pearl": null,
      "comp_legendary_candidates": [
        "jak_sg.comp_05_legendary_loomingconstable",
        "jak_sg.comp_05_legendary_looming",
        "jak_sg.comp_05_legendary_constable"
      ],
      "comp_candidates": [
        "jak_sg.comp_05_legendary_loomingconstable",
        "jak_sg.comp_06_pearl_loomingconstable",
        "jak_sg.comp_06_pearlescent_loomingconstable",
        "jak_sg.comp_05_legendary_looming",
        "jak_sg.comp_06_pearl_looming",
        "jak_sg.comp_06_pearlescent_looming",
        "jak_sg.comp_05_legendary_constable",
        "jak_sg.comp_06_pearl_constable",
        "jak_sg.comp_06_pearlescent_constable"
      ],
      "alternate_editor_comps": [
        "jak_sg.comp_06_pearl_constable"
      ],
      "id_raw": "9:101",
      "skin_code": "{9:101}",
      "serial_u": null,
      "serial_hint": "{9:101} + |\"c\",1|",
      "camo_token": "|\"c\",1|",
      "internal_balance_name": "JAK_SG.comp_06_pearl_constable",
      "internal_name": "constable",
      "can_be_phosphene": false,
      "phosphene_status": "verified_no",
      "phosphene_evidence": {
        "source": "assets/data/pearl_phosphene_flags.json",
        "flag_key": "constable",
        "status": "verified_no",
        "notes": "Export: no Challenge_Shiny_* / challengereward_*_shiny_* and no itempool_*_shiny with Cosmetics_Weapon_Shiny_* for this pearl slug.",
        "evidence": []
      },
      "can_be_pearlescent": true,
      "wiki_url": null,
      "verification": {
        "in_gear_database": true,
        "in_supplement": true,
        "in_nexus_export": false,
        "in_pearl_itempool": false,
        "in_echo4": false,
        "in_yaml_catalog": true,
        "comp_match_via": "supplement_slug",
        "pearl_comp_style": "comp_06_pearl",
        "in_dedicated_itempoollist": false,
        "in_world_criteria_pool": true
      },
      "itempool_lists": [],
      "world_criteria_pool": "itempool_sg_06_pearl",
      "acquisition_kind": "world_criteria",
      "acquisition_evidence": [
        {
          "kind": "world_criteria_pool",
          "itempool": "itempool_sg_06_pearl",
          "weapon_type_code": "sg",
          "note": "Criteria pool selects rarity tag pearl + weapon type; membership inferred from pearlescent inv. NCS Rarity table lacks 06_pearlescent row in current dump."
        }
      ],
      "acquisition_notes": "Export: no dedicated ItemPoolList hit; candidate world path itempool_sg_06_pearl (wired under type *_all parents e.g. itempool_smg_all / itempool_assaultrifle_all) via Att_RarityWeight_06_Pearl."
    },
    {
      "slug": "crazedearl",
      "gear_slug": "crazedearl",
      "display_name": "Crazed Earl",
      "spawn_tokens": [
        "crazedearl"
      ],
      "yaml_key": "shiny_crazedearl",
      "expected_inv": "bor_sg",
      "weapon_type": "Shotgun",
      "manufacturer": "Ripper",
      "rarity": "Pearlescent",
      "red_text": "Earlescent.",
      "unique_effect": "BOGO — Fires Shards that stick into enemies. Meleeing enemies with Shards explodes the Shards and sends them toward nearby enemies.",
      "drop_source": "Crazy Earl",
      "dedicated_drop": true,
      "raid_drop": false,
      "world_drop": false,
      "mission_reward": false,
      "vendor": false,
      "dlc": "Raid 2",
      "patch_introduced": "1.8",
      "patch_removed": null,
      "status": "verified",
      "notes": "Export-synced pearl (rarity_06_pearlescent+itempool_legendary_pearl).",
      "comp_pearl": "BOR_SG.comp_05_legendary_CrazedEarl",
      "comp_pearl_expected": null,
      "pearl_comp_style": "legendary_pearl",
      "comp_pearl_slug": "crazedearl",
      "itempool_pearl": "itempool_bor_sg_05_legendary_crazedearl_pearl",
      "comp_legendary_candidates": [
        "bor_sg.comp_05_legendary_crazedearl"
      ],
      "comp_candidates": [
        "bor_sg.comp_05_legendary_crazedearl",
        "bor_sg.comp_06_pearl_crazedearl",
        "bor_sg.comp_06_pearlescent_crazedearl"
      ],
      "alternate_editor_comps": [
        "bor_sg.comp_05_legendary_crazedearl"
      ],
      "id_raw": "7:54",
      "skin_code": "{7:54}",
      "serial_u": "@Ugd77*FnkbUJa$k!RG}J`s9{5EP&H90Q72LJP<v2+P@zz@P~}j=J<xCt@G$mKjNkKinVufczxQ$&{&s)o=(Ick9m~V/GPxX<vjG",
      "serial_hint": "{7:54} + |\"c\",1|",
      "camo_token": "|\"c\",1|",
      "internal_balance_name": "BOR_SG.comp_05_legendary_crazedearl",
      "internal_name": "crazedearl",
      "can_be_phosphene": true,
      "phosphene_status": "verified_yes",
      "phosphene_evidence": {
        "source": "assets/data/pearl_phosphene_flags.json",
        "flag_key": "crazedearl",
        "status": "verified_yes",
        "notes": "Export: shiny pool itempool_mal_sg_05_legendary_crazedearl_shiny + Cosmetics_Weapon_Shiny_crazedEarl",
        "evidence": [
          {
            "kind": "itempool_shiny",
            "itempool_shiny": "itempool_mal_sg_05_legendary_crazedearl_shiny",
            "comp": "BOR_SG.comp_05_legendary_CrazedEarl",
            "cosmetic": "Cosmetics_Weapon_Shiny_crazedEarl",
            "matched_key": "crazedearl"
          }
        ]
      },
      "can_be_pearlescent": true,
      "wiki_url": null,
      "verification": {
        "in_gear_database": true,
        "in_supplement": true,
        "in_nexus_export": true,
        "in_pearl_itempool": true,
        "in_echo4": true,
        "in_yaml_catalog": false,
        "comp_match_via": "legendary_pearl_pool",
        "pearl_comp_style": "legendary_pearl",
        "in_dedicated_itempoollist": true,
        "in_world_criteria_pool": false
      },
      "itempool_lists": [
        "ItemPoolList_CrazyEarl",
        "ItemPoolList_CrazyEarl_True"
      ],
      "world_criteria_pool": null,
      "acquisition_kind": "dedicated",
      "acquisition_evidence": [
        {
          "kind": "itempoollist_dedicated",
          "itempool_lists": [
            "ItemPoolList_CrazyEarl",
            "ItemPoolList_CrazyEarl_True"
          ],
          "comps": [
            "BOR_SG.comp_05_legendary_CrazedEarl"
          ],
          "label": "Crazy Earl",
          "dropped_hybrid_lists": [
            "ItemPoolList_Tuba_hybrids_True"
          ]
        }
      ],
      "acquisition_notes": "Export: dedicated inv handle on ItemPoolList_* (Nexus). Hybrid cross-pools (e.g. Tuba_hybrids) excluded unless pearl pack is Tuba. Big Encore / _True omitted from label when base list present."
    },
    {
      "slug": "crowsourced",
      "gear_slug": "crowsourced",
      "display_name": "Crow-Sourced",
      "spawn_tokens": [
        "crowsourced"
      ],
      "yaml_key": "shiny_crowsourced",
      "expected_inv": "ord_ar",
      "weapon_type": "Assault Rifle",
      "manufacturer": "Order",
      "rarity": "Pearlescent",
      "red_text": "And we had to share the rock!",
      "unique_effect": "Left of the Murder — Fires random objects.",
      "drop_source": "Dahlfather",
      "dedicated_drop": true,
      "raid_drop": false,
      "world_drop": false,
      "mission_reward": false,
      "vendor": false,
      "dlc": "Raid 2",
      "patch_introduced": "1.8",
      "patch_removed": null,
      "status": "verified",
      "notes": "Order AR pearlescent. Do not use crowdsourced/CrowdSourced (that is Vladof Midnight Defiance sniper). Export-synced pearl (rarity_06_pearlescent+itempool_legendary_pearl).",
      "comp_pearl": "ORD_AR.comp_05_legendary_crowsourced",
      "comp_pearl_expected": null,
      "pearl_comp_style": "legendary_pearl",
      "comp_pearl_slug": "crowsourced",
      "itempool_pearl": "itempool_ord_ar_05_legendary_crowsourced_pearl",
      "comp_legendary_candidates": [
        "ord_ar.comp_05_legendary_crowsourced"
      ],
      "comp_candidates": [
        "ord_ar.comp_05_legendary_crowsourced",
        "ord_ar.comp_06_pearl_crowsourced",
        "ord_ar.comp_06_pearlescent_crowsourced"
      ],
      "alternate_editor_comps": [
        "ord_ar.comp_05_legendary_crowsourced"
      ],
      "id_raw": "15:77",
      "skin_code": "{15:77}",
      "serial_u": null,
      "serial_hint": "{15:77} + |\"c\",1|",
      "camo_token": "|\"c\",1|",
      "internal_balance_name": "ORD_AR.comp_05_legendary_crowsourced",
      "internal_name": "crowsourced",
      "can_be_phosphene": false,
      "phosphene_status": "verified_no",
      "phosphene_evidence": {
        "source": "assets/data/pearl_phosphene_flags.json",
        "flag_key": "crowsourced",
        "status": "verified_no",
        "notes": "Override: Order AR Crow-Sourced is not Midnight Defiance (Cosmetics_Weapon_Shiny_CrowdSourced / Challenge_Shiny_CrowdSourced).",
        "evidence": [
          {
            "kind": "override",
            "notes": "Override: Order AR Crow-Sourced is not Midnight Defiance (Cosmetics_Weapon_Shiny_CrowdSourced / Challenge_Shiny_CrowdSourced).",
            "source_file": "pearl_phosphene_overrides.json"
          }
        ]
      },
      "can_be_pearlescent": true,
      "wiki_url": null,
      "verification": {
        "in_gear_database": true,
        "in_supplement": true,
        "in_nexus_export": true,
        "in_pearl_itempool": true,
        "in_echo4": false,
        "in_yaml_catalog": false,
        "comp_match_via": "legendary_pearl_pool",
        "pearl_comp_style": "legendary_pearl",
        "in_dedicated_itempoollist": true,
        "in_world_criteria_pool": false
      },
      "itempool_lists": [
        "ItemPoolList_DahlFather_True",
        "ItemPoolList_dAHLfATHER"
      ],
      "world_criteria_pool": null,
      "acquisition_kind": "dedicated",
      "acquisition_evidence": [
        {
          "kind": "itempoollist_dedicated",
          "itempool_lists": [
            "ItemPoolList_DahlFather_True",
            "ItemPoolList_dAHLfATHER"
          ],
          "comps": [
            "ORD_AR.comp_05_legendary_crowsourced"
          ],
          "label": "Dahlfather",
          "dropped_hybrid_lists": []
        }
      ],
      "acquisition_notes": "Export: dedicated inv handle on ItemPoolList_* (Nexus). Hybrid cross-pools (e.g. Tuba_hybrids) excluded unless pearl pack is Tuba. Big Encore / _True omitted from label when base list present."
    },
    {
      "slug": "eigenburst",
      "gear_slug": "eigenburst",
      "display_name": "Eigenburst",
      "spawn_tokens": [
        "eigenburst",
        "iigenburst",
        "eagenburst"
      ],
      "yaml_key": "shiny_eigenburst",
      "expected_inv": "ted_sg",
      "weapon_type": "Shotgun",
      "manufacturer": "Tediore",
      "rarity": "Pearlescent",
      "red_text": "An affinity for disobedience.",
      "unique_effect": "Determined — Damage increases as loaded ammo decreases.",
      "drop_source": "World Drop (Raid 2)",
      "dedicated_drop": false,
      "raid_drop": true,
      "world_drop": true,
      "mission_reward": false,
      "vendor": false,
      "dlc": "Raid 2",
      "patch_introduced": "1.8",
      "patch_removed": null,
      "status": "verified",
      "notes": "Export-synced pearl (rarity_06_pearlescent+itempool_legendary_pearl).",
      "comp_pearl": "TED_SG.comp_05_legendary_Eigenburst",
      "comp_pearl_expected": null,
      "pearl_comp_style": "legendary_pearl",
      "comp_pearl_slug": "eigenburst",
      "itempool_pearl": "itempool_ted_sg_05_legendary_eigenburst_pearl",
      "comp_legendary_candidates": [
        "ted_sg.comp_05_legendary_eigenburst",
        "ted_sg.comp_05_legendary_iigenburst",
        "ted_sg.comp_05_legendary_eagenburst"
      ],
      "comp_candidates": [
        "ted_sg.comp_05_legendary_eigenburst",
        "ted_sg.comp_06_pearl_eigenburst",
        "ted_sg.comp_06_pearlescent_eigenburst",
        "ted_sg.comp_05_legendary_iigenburst",
        "ted_sg.comp_06_pearl_iigenburst",
        "ted_sg.comp_06_pearlescent_iigenburst",
        "ted_sg.comp_05_legendary_eagenburst",
        "ted_sg.comp_06_pearl_eagenburst",
        "ted_sg.comp_06_pearlescent_eagenburst"
      ],
      "alternate_editor_comps": [
        "ted_sg.comp_05_legendary_eigenburst"
      ],
      "id_raw": "11:82",
      "skin_code": "{11:82}",
      "serial_u": null,
      "serial_hint": "{11:82} + |\"c\",1|",
      "camo_token": "|\"c\",1|",
      "internal_balance_name": "TED_SG.comp_05_legendary_Eigenburst",
      "internal_name": "eigenburst",
      "can_be_phosphene": false,
      "phosphene_status": "verified_no",
      "phosphene_evidence": {
        "source": "assets/data/pearl_phosphene_flags.json",
        "flag_key": "eigenburst",
        "status": "verified_no",
        "notes": "Export: no Challenge_Shiny_* / challengereward_*_shiny_* and no itempool_*_shiny with Cosmetics_Weapon_Shiny_* for this pearl slug.",
        "evidence": []
      },
      "can_be_pearlescent": true,
      "wiki_url": null,
      "verification": {
        "in_gear_database": true,
        "in_supplement": false,
        "in_nexus_export": true,
        "in_pearl_itempool": true,
        "in_echo4": false,
        "in_yaml_catalog": false,
        "comp_match_via": "legendary_pearl_pool",
        "pearl_comp_style": "legendary_pearl",
        "in_dedicated_itempoollist": false,
        "in_world_criteria_pool": true
      },
      "itempool_lists": [],
      "world_criteria_pool": "itempool_sg_06_pearl",
      "acquisition_kind": "world_criteria",
      "acquisition_evidence": [
        {
          "kind": "world_criteria_pool",
          "itempool": "itempool_sg_06_pearl",
          "weapon_type_code": "sg",
          "note": "Criteria pool selects rarity tag pearl + weapon type; membership inferred from pearlescent inv. NCS Rarity table lacks 06_pearlescent row in current dump."
        },
        {
          "kind": "named_pearl_itempool",
          "itempool": "itempool_ted_sg_05_legendary_eigenburst_pearl",
          "note": "Named legendary_*_pearl itempool exists; no ItemPoolList consumer found for dedicated boss wiring."
        }
      ],
      "acquisition_notes": "Export: no dedicated ItemPoolList hit; candidate world path itempool_sg_06_pearl (wired under type *_all parents e.g. itempool_smg_all / itempool_assaultrifle_all) via Att_RarityWeight_06_Pearl."
    },
    {
      "slug": "gomie",
      "gear_slug": "gomie",
      "display_name": "Gomie",
      "spawn_tokens": [
        "gomie"
      ],
      "yaml_key": "shiny_gomie",
      "expected_inv": "jak_ar",
      "weapon_type": "Assault Rifle",
      "manufacturer": "Jakobs",
      "rarity": "Pearlescent",
      "red_text": "Still Got It.",
      "unique_effect": "Ascending Storm — On hit, gain a stack of Firestorm. Each stack increases Weapon Damage. Reloading unleashes Firestorm on nearby enemies.",
      "drop_source": "World Drop (Raid 2)",
      "dedicated_drop": false,
      "raid_drop": true,
      "world_drop": true,
      "mission_reward": false,
      "vendor": false,
      "dlc": "Raid 2",
      "patch_introduced": "1.8",
      "patch_removed": null,
      "status": "verified",
      "notes": "Export-synced pearl (base_comp_06_pearlescent).",
      "comp_pearl": "JAK_AR.comp_05_legendary_gomie",
      "comp_pearl_expected": null,
      "pearl_comp_style": "legendary_pearl",
      "comp_pearl_slug": "gomie",
      "itempool_pearl": null,
      "comp_legendary_candidates": [
        "jak_ar.comp_05_legendary_gomie"
      ],
      "comp_candidates": [
        "jak_ar.comp_05_legendary_gomie",
        "jak_ar.comp_06_pearl_gomie",
        "jak_ar.comp_06_pearlescent_gomie"
      ],
      "alternate_editor_comps": [],
      "id_raw": "27:81",
      "skin_code": "{27:81}",
      "serial_u": null,
      "serial_hint": "{27:81} + |\"c\",1|",
      "camo_token": "|\"c\",1|",
      "internal_balance_name": "JAK_AR.comp_05_legendary_gomie",
      "internal_name": "gomie",
      "can_be_phosphene": false,
      "phosphene_status": "verified_no",
      "phosphene_evidence": {
        "source": "assets/data/pearl_phosphene_flags.json",
        "flag_key": "gomie",
        "status": "verified_no",
        "notes": "Export: no Challenge_Shiny_* / challengereward_*_shiny_* and no itempool_*_shiny with Cosmetics_Weapon_Shiny_* for this pearl slug.",
        "evidence": []
      },
      "can_be_pearlescent": true,
      "wiki_url": null,
      "verification": {
        "in_gear_database": true,
        "in_supplement": true,
        "in_nexus_export": false,
        "in_pearl_itempool": false,
        "in_echo4": false,
        "in_yaml_catalog": false,
        "comp_match_via": "legendary_supplement",
        "pearl_comp_style": "legendary_pearl",
        "in_dedicated_itempoollist": false,
        "in_world_criteria_pool": true
      },
      "itempool_lists": [],
      "world_criteria_pool": "itempool_ar_06_pearl",
      "acquisition_kind": "world_criteria",
      "acquisition_evidence": [
        {
          "kind": "world_criteria_pool",
          "itempool": "itempool_ar_06_pearl",
          "weapon_type_code": "ar",
          "note": "Criteria pool selects rarity tag pearl + weapon type; membership inferred from pearlescent inv. NCS Rarity table lacks 06_pearlescent row in current dump."
        }
      ],
      "acquisition_notes": "Export: no dedicated ItemPoolList hit; candidate world path itempool_ar_06_pearl (wired under type *_all parents e.g. itempool_smg_all / itempool_assaultrifle_all) via Att_RarityWeight_06_Pearl."
    },
    {
      "slug": "handcannon",
      "gear_slug": "handcannon",
      "display_name": "Handcannon",
      "spawn_tokens": [
        "handcannon",
        "handconnon"
      ],
      "yaml_key": "shiny_handcannon",
      "expected_inv": "tor_ps",
      "weapon_type": "Pistol",
      "manufacturer": "Torgue",
      "rarity": "Pearlescent",
      "red_text": "Dangerous toys are fun, but you could get hurt.",
      "unique_effect": "Click Boom Boom — Sticky Projectiles deal Damage while attached to targets.",
      "drop_source": "World Drop (Raid 2)",
      "dedicated_drop": false,
      "raid_drop": true,
      "world_drop": true,
      "mission_reward": false,
      "vendor": false,
      "dlc": "Raid 2",
      "patch_introduced": "1.8",
      "patch_removed": null,
      "status": "verified",
      "notes": "Export-synced pearl (rarity_06_pearlescent+itempool_legendary_pearl).",
      "comp_pearl": "TOR_PS.comp_05_legendary_handcannon",
      "comp_pearl_expected": null,
      "pearl_comp_style": "legendary_pearl",
      "comp_pearl_slug": "handcannon",
      "itempool_pearl": "itempool_tor_ps_05_legendary_handcannon_pearl",
      "comp_legendary_candidates": [
        "tor_ps.comp_05_legendary_handcannon",
        "tor_ps.comp_05_legendary_handconnon"
      ],
      "comp_candidates": [
        "tor_ps.comp_05_legendary_handcannon",
        "tor_ps.comp_06_pearl_handcannon",
        "tor_ps.comp_06_pearlescent_handcannon",
        "tor_ps.comp_05_legendary_handconnon",
        "tor_ps.comp_06_pearl_handconnon",
        "tor_ps.comp_06_pearlescent_handconnon"
      ],
      "alternate_editor_comps": [
        "tor_ps.comp_05_legendary_handcannon"
      ],
      "id_raw": "6:78",
      "skin_code": "{6:78}",
      "serial_u": null,
      "serial_hint": "{6:78} + |\"c\",1|",
      "camo_token": "|\"c\",1|",
      "internal_balance_name": "TOR_PS.comp_05_legendary_handcannon",
      "internal_name": "handcannon",
      "can_be_phosphene": false,
      "phosphene_status": "verified_no",
      "phosphene_evidence": {
        "source": "assets/data/pearl_phosphene_flags.json",
        "flag_key": "handcannon",
        "status": "verified_no",
        "notes": "Export: no Challenge_Shiny_* / challengereward_*_shiny_* and no itempool_*_shiny with Cosmetics_Weapon_Shiny_* for this pearl slug.",
        "evidence": []
      },
      "can_be_pearlescent": true,
      "wiki_url": null,
      "verification": {
        "in_gear_database": true,
        "in_supplement": false,
        "in_nexus_export": true,
        "in_pearl_itempool": true,
        "in_echo4": false,
        "in_yaml_catalog": false,
        "comp_match_via": "legendary_pearl_pool",
        "pearl_comp_style": "legendary_pearl",
        "in_dedicated_itempoollist": false,
        "in_world_criteria_pool": true
      },
      "itempool_lists": [],
      "world_criteria_pool": "itempool_ps_06_pearl",
      "acquisition_kind": "world_criteria",
      "acquisition_evidence": [
        {
          "kind": "world_criteria_pool",
          "itempool": "itempool_ps_06_pearl",
          "weapon_type_code": "ps",
          "note": "Criteria pool selects rarity tag pearl + weapon type; membership inferred from pearlescent inv. NCS Rarity table lacks 06_pearlescent row in current dump."
        },
        {
          "kind": "named_pearl_itempool",
          "itempool": "itempool_tor_ps_05_legendary_handcannon_pearl",
          "note": "Named legendary_*_pearl itempool exists; no ItemPoolList consumer found for dedicated boss wiring."
        }
      ],
      "acquisition_notes": "Export: no dedicated ItemPoolList hit; candidate world path itempool_ps_06_pearl (wired under type *_all parents e.g. itempool_smg_all / itempool_assaultrifle_all) via Att_RarityWeight_06_Pearl."
    },
    {
      "slug": "herald",
      "gear_slug": "herald",
      "display_name": "Herald",
      "spawn_tokens": [
        "herald"
      ],
      "yaml_key": "shiny_herald",
      "expected_inv": "tor_ps",
      "weapon_type": "Pistol",
      "manufacturer": "Torgue",
      "rarity": "Pearlescent",
      "red_text": "Out of 87 bazillion, ONE of them had to be the best.",
      "unique_effect": "Unkempt",
      "drop_source": "World Drop (Raid 2)",
      "dedicated_drop": false,
      "raid_drop": true,
      "world_drop": true,
      "mission_reward": false,
      "vendor": false,
      "dlc": "Raid 2",
      "patch_introduced": "1.8",
      "patch_removed": null,
      "status": "partial",
      "notes": "Dataset may use comp_06_pearl_herald instead of comp_05_legendary Export-synced pearl (comp_06_pearl_key+rarity_06_pearlescent).",
      "comp_pearl": "TOR_PS.comp_06_pearl_herald",
      "comp_pearl_expected": null,
      "pearl_comp_style": "comp_06_pearl",
      "comp_pearl_slug": "herald",
      "itempool_pearl": null,
      "comp_legendary_candidates": [
        "tor_ps.comp_05_legendary_herald"
      ],
      "comp_candidates": [
        "tor_ps.comp_05_legendary_herald",
        "tor_ps.comp_06_pearl_herald",
        "tor_ps.comp_06_pearlescent_herald"
      ],
      "alternate_editor_comps": [
        "tor_ps.comp_06_pearl_herald"
      ],
      "id_raw": "6:85",
      "skin_code": "{6:85}",
      "serial_u": null,
      "serial_hint": "{6:85} + |\"c\",1|",
      "camo_token": "|\"c\",1|",
      "internal_balance_name": "TOR_PS.comp_06_pearl_herald",
      "internal_name": "herald",
      "can_be_phosphene": false,
      "phosphene_status": "verified_no",
      "phosphene_evidence": {
        "source": "assets/data/pearl_phosphene_flags.json",
        "flag_key": "herald",
        "status": "verified_no",
        "notes": "Export: no Challenge_Shiny_* / challengereward_*_shiny_* and no itempool_*_shiny with Cosmetics_Weapon_Shiny_* for this pearl slug.",
        "evidence": []
      },
      "can_be_pearlescent": true,
      "wiki_url": null,
      "verification": {
        "in_gear_database": true,
        "in_supplement": true,
        "in_nexus_export": false,
        "in_pearl_itempool": false,
        "in_echo4": false,
        "in_yaml_catalog": true,
        "comp_match_via": "supplement_slug",
        "pearl_comp_style": "comp_06_pearl",
        "in_dedicated_itempoollist": false,
        "in_world_criteria_pool": true
      },
      "itempool_lists": [],
      "world_criteria_pool": "itempool_ps_06_pearl",
      "acquisition_kind": "world_criteria",
      "acquisition_evidence": [
        {
          "kind": "world_criteria_pool",
          "itempool": "itempool_ps_06_pearl",
          "weapon_type_code": "ps",
          "note": "Criteria pool selects rarity tag pearl + weapon type; membership inferred from pearlescent inv. NCS Rarity table lacks 06_pearlescent row in current dump."
        }
      ],
      "acquisition_notes": "Export: no dedicated ItemPoolList hit; candidate world path itempool_ps_06_pearl (wired under type *_all parents e.g. itempool_smg_all / itempool_assaultrifle_all) via Att_RarityWeight_06_Pearl."
    },
    {
      "slug": "jailbroken",
      "gear_slug": "jailbroken",
      "display_name": "Jail-Broken Gatling",
      "spawn_tokens": [
        "jailbroken",
        "jailbrokengatling"
      ],
      "yaml_key": "shiny_jailbroken",
      "expected_inv": "bor_sm",
      "weapon_type": "SMG",
      "manufacturer": "Ripper",
      "rarity": "Pearlescent",
      "red_text": "Get busy shooting or get busy dying.",
      "unique_effect": "Jailbroken — On hit, gain a stack of Backfire. For each Backfire stack, gain increased Fire Rate and an increased chance to fire additional projectiles.",
      "drop_source": "Subjugator (Raid 2) & Thol the Invincible (Raid 2)",
      "dedicated_drop": true,
      "raid_drop": true,
      "world_drop": false,
      "mission_reward": false,
      "vendor": false,
      "dlc": "Raid 2",
      "patch_introduced": "1.8",
      "patch_removed": null,
      "status": "verified",
      "notes": "Export-synced pearl (rarity_06_pearlescent).",
      "comp_pearl": "BOR_SM.comp_05_legendary_jailbroken",
      "comp_pearl_expected": null,
      "pearl_comp_style": "legendary_pearl",
      "comp_pearl_slug": "jailbroken",
      "itempool_pearl": null,
      "comp_legendary_candidates": [
        "bor_sm.comp_05_legendary_jailbroken",
        "bor_sm.comp_05_legendary_jailbrokengatling"
      ],
      "comp_candidates": [
        "bor_sm.comp_05_legendary_jailbroken",
        "bor_sm.comp_06_pearl_jailbroken",
        "bor_sm.comp_06_pearlescent_jailbroken",
        "bor_sm.comp_05_legendary_jailbrokengatling",
        "bor_sm.comp_06_pearl_jailbrokengatling",
        "bor_sm.comp_06_pearlescent_jailbrokengatling"
      ],
      "alternate_editor_comps": [
        "bor_sm.comp_05_legendary_jailbroken"
      ],
      "id_raw": "19:61",
      "skin_code": "{19:61}",
      "serial_u": "@Ugv?-o35E/Mj1AB}RG}J`s9{6-P&H8{Q72KIx`X<I3WchLYKQ8F8ffsy9PlvqQ4HVncA1_Y&%f7l82)yDr/7gh/5b+5Y_a^kF1rB",
      "serial_hint": "{19:61} + |\"c\",1|",
      "camo_token": "|\"c\",1|",
      "internal_balance_name": "BOR_SM.comp_05_legendary_jailbroken",
      "internal_name": "jailbroken",
      "can_be_phosphene": false,
      "phosphene_status": "verified_no",
      "phosphene_evidence": {
        "source": "assets/data/pearl_phosphene_flags.json",
        "flag_key": "jailbroken",
        "status": "verified_no",
        "notes": "Export: no Challenge_Shiny_* / challengereward_*_shiny_* and no itempool_*_shiny with Cosmetics_Weapon_Shiny_* for this pearl slug.",
        "evidence": []
      },
      "can_be_pearlescent": true,
      "wiki_url": null,
      "verification": {
        "in_gear_database": true,
        "in_supplement": true,
        "in_nexus_export": false,
        "in_pearl_itempool": false,
        "in_echo4": true,
        "in_yaml_catalog": false,
        "comp_match_via": "legendary_supplement",
        "pearl_comp_style": "legendary_pearl",
        "in_dedicated_itempoollist": true,
        "in_world_criteria_pool": false
      },
      "itempool_lists": [
        "ItemPoolList_Raid2_Subjugator",
        "ItemPoolList_Raid2_Subjugator_True",
        "ItemPoolList_Raid2_Thol",
        "ItemPoolList_Raid2_Thol_True"
      ],
      "world_criteria_pool": null,
      "acquisition_kind": "dedicated",
      "acquisition_evidence": [
        {
          "kind": "itempoollist_dedicated",
          "itempool_lists": [
            "ItemPoolList_Raid2_Subjugator",
            "ItemPoolList_Raid2_Subjugator_True",
            "ItemPoolList_Raid2_Thol",
            "ItemPoolList_Raid2_Thol_True"
          ],
          "comps": [
            "BOR_SM.comp_05_legendary_Jailbroken"
          ],
          "label": "Subjugator (Raid 2) & Thol the Invincible (Raid 2)",
          "dropped_hybrid_lists": []
        }
      ],
      "acquisition_notes": "Export: dedicated inv handle on ItemPoolList_* (Nexus). Hybrid cross-pools (e.g. Tuba_hybrids) excluded unless pearl pack is Tuba. Big Encore / _True omitted from label when base list present."
    },
    {
      "slug": "juliet",
      "gear_slug": "firestorm",
      "display_name": "Juliet's Sparkle",
      "spawn_tokens": [
        "firestorm",
        "firework",
        "juliet",
        "julietssparkle"
      ],
      "yaml_key": "shiny_juliet",
      "expected_inv": "mal_sm",
      "weapon_type": "SMG",
      "manufacturer": "Maliwan",
      "rarity": "Pearlescent",
      "red_text": "Dazzle the world.",
      "unique_effect": "Starfall — Chance for Stars to fall for bonus damage.",
      "drop_source": "World Drop (Raid 2)",
      "dedicated_drop": false,
      "raid_drop": true,
      "world_drop": true,
      "mission_reward": false,
      "vendor": false,
      "dlc": "Raid 2",
      "patch_introduced": "1.8",
      "patch_removed": null,
      "status": "partial",
      "notes": "Nexus supplement comp_06_pearl_juliet (Pearl Juliet) Export-synced pearl (comp_06_pearl_key+base_comp_06_pearlescent).",
      "comp_pearl": "MAL_SM.comp_06_pearl_juliet",
      "comp_pearl_expected": null,
      "pearl_comp_style": "comp_06_pearl",
      "comp_pearl_slug": "juliet",
      "itempool_pearl": null,
      "comp_legendary_candidates": [
        "mal_sm.comp_05_legendary_firestorm",
        "mal_sm.comp_05_legendary_firework",
        "mal_sm.comp_05_legendary_juliet",
        "mal_sm.comp_05_legendary_julietssparkle"
      ],
      "comp_candidates": [
        "mal_sm.comp_05_legendary_firestorm",
        "mal_sm.comp_06_pearl_firestorm",
        "mal_sm.comp_06_pearlescent_firestorm",
        "mal_sm.comp_05_legendary_firework",
        "mal_sm.comp_06_pearl_firework",
        "mal_sm.comp_06_pearlescent_firework",
        "mal_sm.comp_05_legendary_juliet",
        "mal_sm.comp_06_pearl_juliet",
        "mal_sm.comp_06_pearlescent_juliet",
        "mal_sm.comp_05_legendary_julietssparkle",
        "mal_sm.comp_06_pearl_julietssparkle",
        "mal_sm.comp_06_pearlescent_julietssparkle"
      ],
      "alternate_editor_comps": [
        "mal_sm.comp_06_pearl_juliet"
      ],
      "id_raw": "21:90",
      "skin_code": "{21:90}",
      "serial_u": null,
      "serial_hint": "{21:90} + |\"c\",1|",
      "camo_token": "|\"c\",1|",
      "internal_balance_name": "MAL_SM.comp_06_pearl_juliet",
      "internal_name": "juliet",
      "can_be_phosphene": false,
      "phosphene_status": "verified_no",
      "phosphene_evidence": {
        "source": "assets/data/pearl_phosphene_flags.json",
        "flag_key": "juliet",
        "status": "verified_no",
        "notes": "Export: no Challenge_Shiny_* / challengereward_*_shiny_* and no itempool_*_shiny with Cosmetics_Weapon_Shiny_* for this pearl slug.",
        "evidence": []
      },
      "can_be_pearlescent": true,
      "wiki_url": null,
      "verification": {
        "in_gear_database": true,
        "in_supplement": true,
        "in_nexus_export": false,
        "in_pearl_itempool": false,
        "in_echo4": false,
        "in_yaml_catalog": true,
        "comp_match_via": "supplement_slug",
        "pearl_comp_style": "comp_06_pearl",
        "in_dedicated_itempoollist": false,
        "in_world_criteria_pool": true
      },
      "itempool_lists": [],
      "world_criteria_pool": "itempool_sm_06_pearl",
      "acquisition_kind": "world_criteria",
      "acquisition_evidence": [
        {
          "kind": "world_criteria_pool",
          "itempool": "itempool_sm_06_pearl",
          "weapon_type_code": "sm",
          "note": "Criteria pool selects rarity tag pearl + weapon type; membership inferred from pearlescent inv. NCS Rarity table lacks 06_pearlescent row in current dump."
        }
      ],
      "acquisition_notes": "Export: no dedicated ItemPoolList hit; candidate world path itempool_sm_06_pearl (wired under type *_all parents e.g. itempool_smg_all / itempool_assaultrifle_all) via Att_RarityWeight_06_Pearl."
    },
    {
      "slug": "locust",
      "gear_slug": "parasite",
      "display_name": "Parasite",
      "spawn_tokens": [
        "parasite",
        "locust"
      ],
      "yaml_key": "shiny_locust",
      "expected_inv": "vla_sm",
      "weapon_type": "SMG",
      "manufacturer": "Vladof",
      "rarity": "Pearlescent",
      "red_text": "The obligation of the weak is to nourish the strong.",
      "unique_effect": "Devour — Hitting enemies with Locust Rockets increases Damage taken from Parasite's primary fire. Killing affected enemies with primary fire grants Overshield and refills magazine ammo.",
      "drop_source": "World Drop (Raid 2)",
      "dedicated_drop": false,
      "raid_drop": true,
      "world_drop": true,
      "mission_reward": false,
      "vendor": false,
      "dlc": "Raid 2",
      "patch_introduced": "1.8",
      "patch_removed": null,
      "status": "verified",
      "notes": "Nexus inv_name_part Uni_VLA_SM_Locust; editor uses comp_06_pearl_locust with display name Parasite Export-synced pearl (comp_06_pearl_key+base_comp_06_pearlescent).",
      "comp_pearl": "VLA_SM.comp_06_pearl_locust",
      "comp_pearl_expected": null,
      "pearl_comp_style": "comp_06_pearl",
      "comp_pearl_slug": "locust",
      "itempool_pearl": null,
      "comp_legendary_candidates": [
        "vla_sm.comp_05_legendary_parasite",
        "vla_sm.comp_05_legendary_locust"
      ],
      "comp_candidates": [
        "vla_sm.comp_05_legendary_parasite",
        "vla_sm.comp_06_pearl_parasite",
        "vla_sm.comp_06_pearlescent_parasite",
        "vla_sm.comp_05_legendary_locust",
        "vla_sm.comp_06_pearl_locust",
        "vla_sm.comp_06_pearlescent_locust"
      ],
      "alternate_editor_comps": [
        "vla_sm.comp_06_pearl_locust"
      ],
      "id_raw": "22:101",
      "skin_code": "{22:101}",
      "serial_u": "@UgxFw!35E/M48;gqjVe^54mDipH7YDBC+btDQFBmtP=8RNP`Oa8QTI>-4Ih~U9>%_h;d/aL)6?Vm_gW6a-/p`eop$HH%=frHrvm",
      "serial_hint": "{22:101} + |\"c\",1|",
      "camo_token": "|\"c\",1|",
      "internal_balance_name": "VLA_SM.comp_06_pearl_locust",
      "internal_name": "locust",
      "can_be_phosphene": false,
      "phosphene_status": "verified_no",
      "phosphene_evidence": {
        "source": "assets/data/pearl_phosphene_flags.json",
        "flag_key": "locust",
        "status": "verified_no",
        "notes": "Export: no Challenge_Shiny_* / challengereward_*_shiny_* and no itempool_*_shiny with Cosmetics_Weapon_Shiny_* for this pearl slug.",
        "evidence": []
      },
      "can_be_pearlescent": true,
      "wiki_url": null,
      "verification": {
        "in_gear_database": true,
        "in_supplement": true,
        "in_nexus_export": false,
        "in_pearl_itempool": false,
        "in_echo4": true,
        "in_yaml_catalog": true,
        "comp_match_via": "supplement_slug",
        "pearl_comp_style": "comp_06_pearl",
        "in_dedicated_itempoollist": false,
        "in_world_criteria_pool": true
      },
      "itempool_lists": [],
      "world_criteria_pool": "itempool_sm_06_pearl",
      "acquisition_kind": "world_criteria",
      "acquisition_evidence": [
        {
          "kind": "world_criteria_pool",
          "itempool": "itempool_sm_06_pearl",
          "weapon_type_code": "sm",
          "note": "Criteria pool selects rarity tag pearl + weapon type; membership inferred from pearlescent inv. NCS Rarity table lacks 06_pearlescent row in current dump."
        }
      ],
      "acquisition_notes": "Export: no dedicated ItemPoolList hit; candidate world path itempool_sm_06_pearl (wired under type *_all parents e.g. itempool_smg_all / itempool_assaultrifle_all) via Att_RarityWeight_06_Pearl."
    },
    {
      "slug": "raiden",
      "gear_slug": "raiden",
      "display_name": "Raiden",
      "spawn_tokens": [
        "raiden"
      ],
      "yaml_key": "shiny_raiden",
      "expected_inv": "dad_sm",
      "weapon_type": "SMG",
      "manufacturer": "Daedalus",
      "rarity": "Pearlescent",
      "red_text": "Our frothing demand for this gun increases.",
      "unique_effect": "Raiden — On Kill, spawn a Projectile Count Booster that increases projectiles per shot for a duration. Pickup effect stacks.",
      "drop_source": "Biff Fistful (Mandolin / Bounty Pack 3)",
      "dedicated_drop": true,
      "raid_drop": false,
      "world_drop": false,
      "mission_reward": false,
      "vendor": false,
      "dlc": "Mandolin",
      "patch_introduced": "1.8",
      "patch_removed": null,
      "status": "verified",
      "notes": "Mandolin (Bounty Pack 3) pearlescent. Dedicated ItemPoolList_Murderer. Export-synced pearl (rarity_06_pearlescent).",
      "comp_pearl": "DAD_SM.comp_05_legendary_raiden",
      "comp_pearl_expected": null,
      "pearl_comp_style": "legendary_pearl",
      "comp_pearl_slug": "raiden",
      "itempool_pearl": null,
      "comp_legendary_candidates": [
        "dad_sm.comp_05_legendary_raiden"
      ],
      "comp_candidates": [
        "dad_sm.comp_05_legendary_raiden",
        "dad_sm.comp_06_pearl_raiden",
        "dad_sm.comp_06_pearlescent_raiden"
      ],
      "alternate_editor_comps": [
        "dad_sm.comp_05_legendary_raiden"
      ],
      "id_raw": "20:70",
      "skin_code": "{20:70}",
      "serial_u": null,
      "serial_hint": "{20:70} + |\"c\",1|",
      "camo_token": "|\"c\",1|",
      "internal_balance_name": "DAD_SM.comp_05_legendary_raiden",
      "internal_name": "raiden",
      "can_be_phosphene": false,
      "phosphene_status": "verified_no",
      "phosphene_evidence": {
        "source": "assets/data/pearl_phosphene_flags.json",
        "flag_key": "raiden",
        "status": "verified_no",
        "notes": "Export: no Challenge_Shiny_* / challengereward_*_shiny_* and no itempool_*_shiny with Cosmetics_Weapon_Shiny_* for this pearl slug.",
        "evidence": []
      },
      "can_be_pearlescent": true,
      "wiki_url": null,
      "verification": {
        "in_gear_database": true,
        "in_supplement": true,
        "in_nexus_export": false,
        "in_pearl_itempool": false,
        "in_echo4": false,
        "in_yaml_catalog": false,
        "comp_match_via": "legendary_supplement",
        "pearl_comp_style": "legendary_pearl",
        "in_dedicated_itempoollist": true,
        "in_world_criteria_pool": false
      },
      "itempool_lists": [
        "ItemPoolList_Murderer",
        "ItemPoolList_Murderer_TRUE"
      ],
      "world_criteria_pool": null,
      "acquisition_kind": "dedicated",
      "acquisition_evidence": [
        {
          "kind": "itempoollist_dedicated",
          "itempool_lists": [
            "ItemPoolList_Murderer",
            "ItemPoolList_Murderer_TRUE"
          ],
          "comps": [
            "DAD_SM.comp_05_legendary_Raiden"
          ],
          "label": "Biff Fistful (Mandolin / Bounty Pack 3)",
          "dropped_hybrid_lists": []
        }
      ],
      "acquisition_notes": "Export: dedicated inv handle on ItemPoolList_* (Nexus). Hybrid cross-pools (e.g. Tuba_hybrids) excluded unless pearl pack is Tuba. Big Encore / _True omitted from label when base list present."
    },
    {
      "slug": "screwed",
      "gear_slug": "screwstonian",
      "display_name": "Screwstonian",
      "spawn_tokens": [
        "screwstonian",
        "screwed"
      ],
      "yaml_key": "shiny_screwstonian",
      "expected_inv": "dad_sm",
      "weapon_type": "SMG",
      "manufacturer": "Daedalus",
      "rarity": "Pearlescent",
      "red_text": "This reference was chopped.",
      "unique_effect": "Screwed Up — After consecutive bursts, Fire Rate is reduced and Damage is increased for following bursts.",
      "drop_source": "World Drop (Raid 2)",
      "dedicated_drop": false,
      "raid_drop": true,
      "world_drop": true,
      "mission_reward": false,
      "vendor": false,
      "dlc": "Raid 2",
      "patch_introduced": "1.8",
      "patch_removed": null,
      "status": "partial",
      "notes": "Nexus may expose comp_06_pearl_screwed before comp_05_legendary Export-synced pearl (comp_06_pearl_key+base_comp_06_pearlescent).",
      "comp_pearl": "DAD_SM.comp_06_pearl_screwed",
      "comp_pearl_expected": null,
      "pearl_comp_style": "comp_06_pearl",
      "comp_pearl_slug": "screwed",
      "itempool_pearl": null,
      "comp_legendary_candidates": [
        "dad_sm.comp_05_legendary_screwstonian",
        "dad_sm.comp_05_legendary_screwed"
      ],
      "comp_candidates": [
        "dad_sm.comp_05_legendary_screwstonian",
        "dad_sm.comp_06_pearl_screwstonian",
        "dad_sm.comp_06_pearlescent_screwstonian",
        "dad_sm.comp_05_legendary_screwed",
        "dad_sm.comp_06_pearl_screwed",
        "dad_sm.comp_06_pearlescent_screwed"
      ],
      "alternate_editor_comps": [
        "dad_sm.comp_06_pearl_screwed"
      ],
      "id_raw": "245:249",
      "skin_code": "{245:249}",
      "serial_u": null,
      "serial_hint": "{245:249} + |\"c\",1|",
      "camo_token": "|\"c\",1|",
      "internal_balance_name": "DAD_SM.comp_06_pearl_screwed",
      "internal_name": "screwed",
      "can_be_phosphene": false,
      "phosphene_status": "verified_no",
      "phosphene_evidence": {
        "source": "assets/data/pearl_phosphene_flags.json",
        "flag_key": "screwed",
        "status": "verified_no",
        "notes": "Export: no Challenge_Shiny_* / challengereward_*_shiny_* and no itempool_*_shiny with Cosmetics_Weapon_Shiny_* for this pearl slug.",
        "evidence": []
      },
      "can_be_pearlescent": true,
      "wiki_url": null,
      "verification": {
        "in_gear_database": true,
        "in_supplement": true,
        "in_nexus_export": false,
        "in_pearl_itempool": false,
        "in_echo4": false,
        "in_yaml_catalog": false,
        "comp_match_via": "supplement_slug",
        "pearl_comp_style": "comp_06_pearl",
        "in_dedicated_itempoollist": false,
        "in_world_criteria_pool": true
      },
      "itempool_lists": [],
      "world_criteria_pool": "itempool_sm_06_pearl",
      "acquisition_kind": "world_criteria",
      "acquisition_evidence": [
        {
          "kind": "world_criteria_pool",
          "itempool": "itempool_sm_06_pearl",
          "weapon_type_code": "sm",
          "note": "Criteria pool selects rarity tag pearl + weapon type; membership inferred from pearlescent inv. NCS Rarity table lacks 06_pearlescent row in current dump."
        }
      ],
      "acquisition_notes": "Export: no dedicated ItemPoolList hit; candidate world path itempool_sm_06_pearl (wired under type *_all parents e.g. itempool_smg_all / itempool_assaultrifle_all) via Att_RarityWeight_06_Pearl."
    },
    {
      "slug": "sharkbait",
      "gear_slug": "sharkbait",
      "display_name": "Sharkbait",
      "spawn_tokens": [
        "sharkbait"
      ],
      "yaml_key": "shiny_sharkbait",
      "expected_inv": "ted_sg",
      "weapon_type": "Shotgun",
      "manufacturer": "Tediore",
      "rarity": "Pearlescent",
      "red_text": "Now, look fellas, let's be reasonable.",
      "unique_effect": "Chum the Water — Every bullet that hits enemies applies 1 stack of Chum. At enough Chum stacks, the enemy explodes for bonus Damage.",
      "drop_source": "Child of Terramorphous (Tuba takedown)",
      "dedicated_drop": true,
      "raid_drop": true,
      "world_drop": false,
      "mission_reward": false,
      "vendor": false,
      "dlc": "Tuba",
      "patch_introduced": "1.8",
      "patch_removed": null,
      "status": "verified",
      "notes": "Tuba DLC pearlescent (FModel DLC/Tuba + ItemPoolList_Tuba_Terra). Export-synced pearl (comp_06_pearl_key+rarity_06_pearlescent).",
      "comp_pearl": "TED_SG.comp_06_pearl_sharkbait",
      "comp_pearl_expected": null,
      "pearl_comp_style": "comp_06_pearl",
      "comp_pearl_slug": "sharkbait",
      "itempool_pearl": null,
      "comp_legendary_candidates": [
        "ted_sg.comp_05_legendary_sharkbait"
      ],
      "comp_candidates": [
        "ted_sg.comp_05_legendary_sharkbait",
        "ted_sg.comp_06_pearl_sharkbait",
        "ted_sg.comp_06_pearlescent_sharkbait"
      ],
      "alternate_editor_comps": [
        "ted_sg.comp_06_pearl_sharkbait"
      ],
      "id_raw": "11:90",
      "skin_code": "{11:90}",
      "serial_u": null,
      "serial_hint": "{11:90} + |\"c\",1|",
      "camo_token": "|\"c\",1|",
      "internal_balance_name": "TED_SG.comp_06_pearl_sharkbait",
      "internal_name": "sharkbait",
      "can_be_phosphene": false,
      "phosphene_status": "verified_no",
      "phosphene_evidence": {
        "source": "assets/data/pearl_phosphene_flags.json",
        "flag_key": "sharkbait",
        "status": "verified_no",
        "notes": "Export: no Challenge_Shiny_* / challengereward_*_shiny_* and no itempool_*_shiny with Cosmetics_Weapon_Shiny_* for this pearl slug.",
        "evidence": []
      },
      "can_be_pearlescent": true,
      "wiki_url": null,
      "verification": {
        "in_gear_database": true,
        "in_supplement": true,
        "in_nexus_export": true,
        "in_pearl_itempool": false,
        "in_echo4": false,
        "in_yaml_catalog": true,
        "comp_match_via": "supplement_slug",
        "pearl_comp_style": "comp_06_pearl",
        "in_dedicated_itempoollist": true,
        "in_world_criteria_pool": false
      },
      "itempool_lists": [
        "ItemPoolList_Tuba_Terra"
      ],
      "world_criteria_pool": null,
      "acquisition_kind": "dedicated",
      "acquisition_evidence": [
        {
          "kind": "itempoollist_dedicated",
          "itempool_lists": [
            "ItemPoolList_Tuba_Terra"
          ],
          "comps": [
            "TED_SG.comp_06_pearl_sharkbait"
          ],
          "label": "Child of Terramorphous (Tuba takedown)",
          "dropped_hybrid_lists": []
        }
      ],
      "acquisition_notes": "Export: dedicated inv handle on ItemPoolList_* (Nexus). Hybrid cross-pools (e.g. Tuba_hybrids) excluded unless pearl pack is Tuba. Big Encore / _True omitted from label when base list present."
    },
    {
      "slug": "temper",
      "gear_slug": "temper",
      "display_name": "Solar Temper",
      "spawn_tokens": [
        "temper",
        "solartemper",
        "solar_temper"
      ],
      "yaml_key": "shiny_temper",
      "expected_inv": "ord_sr",
      "weapon_type": "Sniper Rifle",
      "manufacturer": "Order",
      "rarity": "Pearlescent",
      "red_text": "Carrington's Omen.",
      "unique_effect": "Temper — On Hit explodes. The explosion radius increases with each charge.",
      "drop_source": "World Drop (Raid 2)",
      "dedicated_drop": false,
      "raid_drop": true,
      "world_drop": true,
      "mission_reward": false,
      "vendor": false,
      "dlc": "Raid 2",
      "patch_introduced": "1.8",
      "patch_removed": null,
      "status": "verified",
      "notes": "Slug temper (ORD_SR). Export-synced pearl (rarity_06_pearlescent).",
      "comp_pearl": "ORD_SR.comp_05_legendary_temper",
      "comp_pearl_expected": null,
      "pearl_comp_style": "legendary_pearl",
      "comp_pearl_slug": "temper",
      "itempool_pearl": null,
      "comp_legendary_candidates": [
        "ord_sr.comp_05_legendary_temper",
        "ord_sr.comp_05_legendary_solartemper",
        "ord_sr.comp_05_legendary_solar_temper"
      ],
      "comp_candidates": [
        "ord_sr.comp_05_legendary_temper",
        "ord_sr.comp_06_pearl_temper",
        "ord_sr.comp_06_pearlescent_temper",
        "ord_sr.comp_05_legendary_solartemper",
        "ord_sr.comp_06_pearl_solartemper",
        "ord_sr.comp_06_pearlescent_solartemper",
        "ord_sr.comp_05_legendary_solar_temper",
        "ord_sr.comp_06_pearl_solar_temper",
        "ord_sr.comp_06_pearlescent_solar_temper"
      ],
      "alternate_editor_comps": [
        "ord_sr.comp_05_legendary_temper"
      ],
      "id_raw": "26:84",
      "skin_code": "{26:84}",
      "serial_u": null,
      "serial_hint": "{26:84} + |\"c\",1|",
      "camo_token": "|\"c\",1|",
      "internal_balance_name": "ORD_SR.comp_05_legendary_temper",
      "internal_name": "temper",
      "can_be_phosphene": false,
      "phosphene_status": "verified_no",
      "phosphene_evidence": {
        "source": "assets/data/pearl_phosphene_flags.json",
        "flag_key": "temper",
        "status": "verified_no",
        "notes": "Export: no Challenge_Shiny_* / challengereward_*_shiny_* and no itempool_*_shiny with Cosmetics_Weapon_Shiny_* for this pearl slug.",
        "evidence": []
      },
      "can_be_pearlescent": true,
      "wiki_url": null,
      "verification": {
        "in_gear_database": true,
        "in_supplement": true,
        "in_nexus_export": false,
        "in_pearl_itempool": false,
        "in_echo4": false,
        "in_yaml_catalog": false,
        "comp_match_via": "legendary_supplement",
        "pearl_comp_style": "legendary_pearl",
        "in_dedicated_itempoollist": false,
        "in_world_criteria_pool": true
      },
      "itempool_lists": [],
      "world_criteria_pool": "itempool_sr_06_pearl",
      "acquisition_kind": "world_criteria",
      "acquisition_evidence": [
        {
          "kind": "world_criteria_pool",
          "itempool": "itempool_sr_06_pearl",
          "weapon_type_code": "sr",
          "note": "Criteria pool selects rarity tag pearl + weapon type; membership inferred from pearlescent inv. NCS Rarity table lacks 06_pearlescent row in current dump."
        }
      ],
      "acquisition_notes": "Export: no dedicated ItemPoolList hit; candidate world path itempool_sr_06_pearl (wired under type *_all parents e.g. itempool_smg_all / itempool_assaultrifle_all) via Att_RarityWeight_06_Pearl."
    },
    {
      "slug": "soulsurvivor",
      "gear_slug": "soulsurvivor",
      "display_name": "Soul Survivor",
      "spawn_tokens": [
        "soulsurvivor"
      ],
      "yaml_key": "shiny_soulsurvivor",
      "expected_inv": "dad_ps",
      "weapon_type": "Pistol",
      "manufacturer": "Daedalus",
      "rarity": "Pearlescent",
      "red_text": "At first I was afraid...",
      "unique_effect": "Adrenaline — Deals increased Damage for each ally in Fight For Your Life.",
      "drop_source": "Drone Captain",
      "dedicated_drop": true,
      "raid_drop": false,
      "world_drop": false,
      "mission_reward": false,
      "vendor": false,
      "dlc": "Raid 2",
      "patch_introduced": "1.8",
      "patch_removed": null,
      "status": "verified",
      "notes": "Export-synced pearl (rarity_06_pearlescent+itempool_legendary_pearl).",
      "comp_pearl": "DAD_PS.comp_05_legendary_soulsurvivor",
      "comp_pearl_expected": null,
      "pearl_comp_style": "legendary_pearl",
      "comp_pearl_slug": "soulsurvivor",
      "itempool_pearl": "itempool_dad_ps_05_legendary_soulsurvivor_pearl",
      "comp_legendary_candidates": [
        "dad_ps.comp_05_legendary_soulsurvivor"
      ],
      "comp_candidates": [
        "dad_ps.comp_05_legendary_soulsurvivor",
        "dad_ps.comp_06_pearl_soulsurvivor",
        "dad_ps.comp_06_pearlescent_soulsurvivor"
      ],
      "alternate_editor_comps": [
        "dad_ps.comp_05_legendary_soulsurvivor"
      ],
      "id_raw": "2:80",
      "skin_code": "{2:80}",
      "serial_u": "@Uga`vnFnkbUJa$l6RG}J`sG&nYQ6W(yQ72JhP<2p!P=8RhP`gmWEzmFzG@JuGjQtej_q<)Er^oZ}y&Q(W-QPJn?aqJa?>c*4m)q0!w;T",
      "serial_hint": "{2:80} + |\"c\",1|",
      "camo_token": "|\"c\",1|",
      "internal_balance_name": "DAD_PS.comp_05_legendary_soulsurvivor",
      "internal_name": "soulsurvivor",
      "can_be_phosphene": true,
      "phosphene_status": "verified_yes",
      "phosphene_evidence": {
        "source": "assets/data/pearl_phosphene_flags.json",
        "flag_key": "soulsurvivor",
        "status": "verified_yes",
        "notes": "Export: shiny pool itempool_dad_ps_05_legendary_soulsurvivor_shiny + Cosmetics_Weapon_Shiny_soulsurvivor",
        "evidence": [
          {
            "kind": "itempool_shiny",
            "itempool_shiny": "itempool_dad_ps_05_legendary_soulsurvivor_shiny",
            "comp": "DAD_PS.comp_05_legendary_soulsurvivor",
            "cosmetic": "Cosmetics_Weapon_Shiny_soulsurvivor",
            "matched_key": "soulsurvivor"
          }
        ]
      },
      "can_be_pearlescent": true,
      "wiki_url": null,
      "verification": {
        "in_gear_database": true,
        "in_supplement": true,
        "in_nexus_export": true,
        "in_pearl_itempool": true,
        "in_echo4": true,
        "in_yaml_catalog": false,
        "comp_match_via": "legendary_pearl_pool",
        "pearl_comp_style": "legendary_pearl",
        "in_dedicated_itempoollist": true,
        "in_world_criteria_pool": false
      },
      "itempool_lists": [
        "ItemPoolList_DroneCaptain"
      ],
      "world_criteria_pool": null,
      "acquisition_kind": "dedicated",
      "acquisition_evidence": [
        {
          "kind": "itempoollist_dedicated",
          "itempool_lists": [
            "ItemPoolList_DroneCaptain"
          ],
          "comps": [
            "DAD_PS.comp_05_legendary_soulsurvivor"
          ],
          "label": "Drone Captain",
          "dropped_hybrid_lists": []
        }
      ],
      "acquisition_notes": "Export: dedicated inv handle on ItemPoolList_* (Nexus). Hybrid cross-pools (e.g. Tuba_hybrids) excluded unless pearl pack is Tuba. Big Encore / _True omitted from label when base list present."
    }
  ]
};
})();
