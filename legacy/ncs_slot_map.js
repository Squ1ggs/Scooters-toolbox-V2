const NCS_SLOT_MAP = {
  _meta: {
    source: 'NCS Parser inv4.json cross-referenced with bl4_manifest.js; inv tags refreshed via ../references/json (see scripts/DATA_PIPELINE.txt)',
    note: 'True part slot definitions per item type from game data'
  },

  slot_categories: {
    core:      ['body','barrel','grip','magazine','scope','foregrip','underbarrel'],
    accessory: ['body_acc','barrel_acc','magazine_acc','scope_acc','hyperion_secondary_acc','tediore_acc','tediore_secondary_acc','underbarrel_acc','underbarrel_acc_vis','barrel_licensed'],
    visual:    ['body_ele','body_bolt','body_mag','secondary_ele','primary_ele'],
    ammo:      ['secondary_ammo','magazine_ted_thrown','magazine_borg'],
    endgame:   ['pearl_elem','pearl_stat','firmware','endgame'],
    other:     ['rarity','unique','multi','element','payload','payload_augment','stat_augment','primary_augment','secondary_augment','active_augment','enemy_augment','turret_weapon','class_mod','core_augment','stat_group1','stat_group2','stat_group3','curative']
  },

  slot_labels: {
    body: 'Body', barrel: 'Barrel', grip: 'Grip', magazine: 'Magazine', scope: 'Scope',
    foregrip: 'Foregrip', underbarrel: 'Underbarrel', rarity: 'Rarity',
    body_acc: 'Body Accessory', barrel_acc: 'Barrel Accessory',
    magazine_acc: 'Magazine Accessory', scope_acc: 'Scope Accessory',
    hyperion_secondary_acc: 'Hyperion Shield', tediore_acc: 'Tediore Accessory',
    tediore_secondary_acc: 'Tediore Sec. Acc.', underbarrel_acc: 'Underbarrel Acc.',
    underbarrel_acc_vis: 'Underbarrel Acc. Vis.', barrel_licensed: 'Licensed Barrel',
    body_ele: 'Body Element', body_bolt: 'Body Bolt', body_mag: 'Body Mag',
    secondary_ele: 'Secondary Element', primary_ele: 'Primary Element',
    secondary_ammo: 'Secondary Ammo', magazine_ted_thrown: 'Tediore Thrown Mag',
    magazine_borg: 'Borg Magazine', pearl_elem: 'Pearl Element', pearl_stat: 'Pearl Stat',
    firmware: 'Firmware', endgame: 'Endgame', unique: 'Unique', multi: 'Multi',
    element: 'Element', Element: 'Element', payload: 'Payload', Payload: 'Payload',
    payload_augment: 'Payload Augment', stat_augment: 'Stat Augment',
    primary_augment: 'Primary Augment', secondary_augment: 'Secondary Augment',
    active_augment: 'Active Augment', enemy_augment: 'Enemy Augment',
    turret_weapon: 'Turret Weapon', class_mod: 'Class Mod', shield: 'Shield',
    core_augment: 'Core Augment', stat_group1: 'Stat Group 1', stat_group2: 'Stat Group 2', stat_group3: 'Stat Group 3', curative: 'Curative'
  },

  items: {
    daedalus_ar: {
      ncs_id: 'DAD_AR', type: 'Weapon_AR', manufacturer: 'Daedalus',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','body_bolt','scope','scope_acc','grip','underbarrel','foregrip','body_mag','secondary_ele','pearl_elem','pearl_stat'],
      ncs_slot_count: 19
    },
    jakobs_ar: {
      ncs_id: 'JAK_AR', type: 'Weapon_AR', manufacturer: 'Jakobs',
      ncs_slots: ['body','body_acc','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','scope','scope_acc','grip','underbarrel','foregrip','secondary_ammo','pearl_elem','pearl_stat'],
      ncs_slot_count: 16
    },
    order_ar: {
      ncs_id: 'ORD_AR', type: 'Weapon_AR', manufacturer: 'Order',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','scope','scope_acc','grip','underbarrel','foregrip','secondary_ele','secondary_ammo','pearl_elem','pearl_stat'],
      ncs_slot_count: 18
    },
    tediore_ar: {
      ncs_id: 'TED_AR', type: 'Weapon_AR', manufacturer: 'Tediore',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','tediore_acc','tediore_secondary_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','scope','scope_acc','grip','underbarrel','foregrip','secondary_ele','secondary_ammo','pearl_elem','pearl_stat'],
      ncs_slot_count: 20
    },
    torgue_ar: {
      ncs_id: 'TOR_AR', type: 'Weapon_AR', manufacturer: 'Torgue',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','scope','scope_acc','grip','underbarrel','foregrip','body_mag','secondary_ammo','secondary_ele','pearl_elem','pearl_stat'],
      ncs_slot_count: 19
    },
    vladof_ar: {
      ncs_id: 'VLA_AR', type: 'Weapon_AR', manufacturer: 'Vladof',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','body_bolt','scope','scope_acc','grip','underbarrel','underbarrel_acc','underbarrel_acc_vis','foregrip','secondary_ammo','secondary_ele','pearl_elem','pearl_stat'],
      ncs_slot_count: 21
    },

    daedalus_pistol: {
      ncs_id: 'DAD_PS', type: 'Weapon_PS', manufacturer: 'Daedalus',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','scope','scope_acc','grip','underbarrel','foregrip','body_mag','secondary_ele','pearl_elem','pearl_stat'],
      ncs_slot_count: 18
    },
    jakobs_pistol: {
      ncs_id: 'JAK_PS', type: 'Weapon_PS', manufacturer: 'Jakobs',
      ncs_slots: ['body','body_acc','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','scope','scope_acc','grip','underbarrel','foregrip','secondary_ammo','pearl_elem','pearl_stat'],
      ncs_slot_count: 16
    },
    order_pistol: {
      ncs_id: 'ORD_PS', type: 'Weapon_PS', manufacturer: 'Order',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','scope','scope_acc','grip','underbarrel','foregrip','secondary_ele','secondary_ammo','pearl_elem','pearl_stat'],
      ncs_slot_count: 18
    },
    tediore_pistol: {
      ncs_id: 'TED_PS', type: 'Weapon_PS', manufacturer: 'Tediore',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','tediore_acc','tediore_secondary_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','scope','scope_acc','grip','underbarrel','foregrip','secondary_ele','secondary_ammo','pearl_elem','pearl_stat'],
      ncs_slot_count: 20
    },
    torgue_pistol: {
      ncs_id: 'TOR_PS', type: 'Weapon_PS', manufacturer: 'Torgue',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','scope','scope_acc','grip','underbarrel','foregrip','body_mag','secondary_ammo','secondary_ele','pearl_elem','pearl_stat'],
      ncs_slot_count: 19
    },

    ripper_shotgun: {
      ncs_id: 'BOR_SG', type: 'Weapon_SG', manufacturer: 'Borg',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_borg','magazine_ted_thrown','body_bolt','scope','scope_acc','grip','underbarrel','foregrip','body_mag','secondary_ele','secondary_ammo','pearl_elem','pearl_stat'],
      ncs_slot_count: 21
    },
    daedalus_shotgun: {
      ncs_id: 'DAD_SG', type: 'Weapon_SG', manufacturer: 'Daedalus',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','body_bolt','scope','scope_acc','grip','underbarrel','foregrip','body_mag','secondary_ele','pearl_elem','pearl_stat'],
      ncs_slot_count: 19
    },
    jakobs_shotgun: {
      ncs_id: 'JAK_SG', type: 'Weapon_SG', manufacturer: 'Jakobs',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','body_bolt','scope','scope_acc','grip','underbarrel','foregrip','body_mag','secondary_ammo','secondary_ele','pearl_elem','pearl_stat'],
      ncs_slot_count: 20
    },
    maliwan_shotgun: {
      ncs_id: 'MAL_SG', type: 'Weapon_SG', manufacturer: 'Maliwan',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','body_bolt','scope','scope_acc','grip','underbarrel','foregrip','body_mag','secondary_ammo','secondary_ele','pearl_elem','pearl_stat'],
      ncs_slot_count: 20
    },
    tediore_shotgun: {
      ncs_id: 'TED_SG', type: 'Weapon_SG', manufacturer: 'Tediore',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','tediore_acc','tediore_secondary_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','scope','scope_acc','grip','underbarrel','underbarrel_acc','foregrip','secondary_ele','secondary_ammo','pearl_elem','pearl_stat'],
      ncs_slot_count: 21
    },
    torgue_shotgun: {
      ncs_id: 'TOR_SG', type: 'Weapon_SG', manufacturer: 'Torgue',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','scope','scope_acc','grip','underbarrel','foregrip','body_mag','secondary_ammo','secondary_ele','pearl_elem','pearl_stat'],
      ncs_slot_count: 19
    },

    ripper_smg: {
      ncs_id: 'BOR_SM', type: 'Weapon_SM', manufacturer: 'Borg',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_borg','magazine_ted_thrown','body_bolt','scope','scope_acc','grip','underbarrel','foregrip','body_mag','secondary_ele','secondary_ammo','pearl_elem','pearl_stat'],
      ncs_slot_count: 21
    },
    daedalus_smg: {
      ncs_id: 'DAD_SM', type: 'Weapon_SM', manufacturer: 'Daedalus',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','body_bolt','scope','scope_acc','grip','underbarrel','foregrip','body_mag','secondary_ele','pearl_elem','pearl_stat'],
      ncs_slot_count: 19
    },
    maliwan_smg: {
      ncs_id: 'MAL_SM', type: 'Weapon_SM', manufacturer: 'Maliwan',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','body_bolt','scope','scope_acc','grip','underbarrel','foregrip','body_mag','secondary_ammo','secondary_ele','pearl_elem','pearl_stat'],
      ncs_slot_count: 20
    },
    vladof_smg: {
      ncs_id: 'VLA_SM', type: 'Weapon_SM', manufacturer: 'Vladof',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','body_bolt','scope','scope_acc','grip','underbarrel','underbarrel_acc','foregrip','secondary_ammo','secondary_ele','pearl_elem','pearl_stat'],
      ncs_slot_count: 20
    },

    ripper_sniper: {
      ncs_id: 'BOR_SR', type: 'Weapon_SR', manufacturer: 'Borg',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_borg','magazine_ted_thrown','body_bolt','scope','scope_acc','grip','underbarrel','underbarrel_acc','foregrip','body_mag','primary_ele','secondary_ele','secondary_ammo','pearl_elem','pearl_stat'],
      ncs_slot_count: 23
    },
    jakobs_sniper: {
      ncs_id: 'JAK_SR', type: 'Weapon_SR', manufacturer: 'Jakobs',
      ncs_slots: ['body','body_acc','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','scope','scope_acc','grip','underbarrel','underbarrel_acc','foregrip','secondary_ammo','pearl_elem','pearl_stat'],
      ncs_slot_count: 17
    },
    maliwan_sniper: {
      ncs_id: 'MAL_SR', type: 'Weapon_SR', manufacturer: 'Maliwan',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','body_bolt','scope','scope_acc','grip','underbarrel','underbarrel_acc','foregrip','body_mag','secondary_ammo','secondary_ele','pearl_elem','pearl_stat'],
      ncs_slot_count: 21
    },
    order_sniper: {
      ncs_id: 'ORD_SR', type: 'Weapon_SR', manufacturer: 'Order',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','scope','scope_acc','grip','underbarrel','underbarrel_acc','foregrip','secondary_ele','secondary_ammo','pearl_elem','pearl_stat'],
      ncs_slot_count: 19
    },
    vladof_sniper: {
      ncs_id: 'VLA_SR', type: 'Weapon_SR', manufacturer: 'Vladof',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','hyperion_secondary_acc','magazine','magazine_acc','magazine_ted_thrown','body_bolt','scope','scope_acc','grip','underbarrel','underbarrel_acc','foregrip','secondary_ammo','secondary_ele','pearl_elem','pearl_stat'],
      ncs_slot_count: 20
    },

    ripper_heavy_weapon: {
      ncs_id: 'BOR_HW', type: 'heavy_weapon_gadget', manufacturer: 'Borg',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','firmware','endgame','pearl_elem','pearl_stat'],
      ncs_slot_count: 9
    },
    maliwan_heavy_weapon: {
      ncs_id: 'MAL_HW', type: 'heavy_weapon_gadget', manufacturer: 'Maliwan',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','secondary_ele','firmware','endgame','pearl_elem','pearl_stat'],
      ncs_slot_count: 10
    },
    torgue_heavy_weapon: {
      ncs_id: 'TOR_HW', type: 'heavy_weapon_gadget', manufacturer: 'Torgue',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','firmware','endgame','pearl_elem','pearl_stat'],
      ncs_slot_count: 9
    },
    vladof_heavy_weapon: {
      ncs_id: 'VLA_HW', type: 'heavy_weapon_gadget', manufacturer: 'Vladof',
      ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','barrel_licensed','firmware','endgame','pearl_elem','pearl_stat'],
      ncs_slot_count: 10
    },

    ripper_shield: {
      ncs_id: 'bor_shield', type: 'energy_shield', manufacturer: 'Borg',
      ncs_slots: ['body','element','primary_augment','secondary_augment','body_acc','firmware','endgame','unique'],
      ncs_slot_count: 8
    },
    tediore_shield: {
      ncs_id: 'ted_shield', type: 'Armor_Shield', manufacturer: 'Tediore',
      ncs_slots: ['body','element','primary_augment','secondary_augment','body_acc','firmware','endgame','unique'],
      ncs_slot_count: 8
    },

    grenade_gadget: {
      ncs_id: 'grenade_gadget', type: 'Gadget', manufacturer: null,
      ncs_slots: ['body','element','payload','payload_augment','stat_augment','firmware','endgame','pearl_elem','pearl_stat'],
      ncs_slot_count: 9
    },
    turret_gadget: {
      ncs_id: 'turret_gadget', type: 'Gadget', manufacturer: null,
      ncs_slots: ['body','body_acc','element','turret_weapon','primary_augment','secondary_augment','firmware','endgame'],
      ncs_slot_count: 8
    },
    terminal_gadget: {
      ncs_id: 'Terminal_Gadget', type: 'Gadget', manufacturer: null,
      ncs_slots: ['body','primary_augment','secondary_augment','enemy_augment','active_augment','firmware','endgame'],
      ncs_slot_count: 7
    },

    enhancement: {
      ncs_id: 'Enhancement', type: 'Enhancement', manufacturer: null,
      ncs_slots: ['body','core_augment','firmware','stat_group1'],
      ncs_slot_count: 4
    },
    atlas_enhancement: { ncs_id: 'ATL_Enhancement', type: 'Enhancement', manufacturer: 'Atlas', ncs_slots: ['body','core_augment','firmware','stat_group1'], ncs_slot_count: 4 },
    hyperion_enhancement: { ncs_id: 'HYP_Enhancement', type: 'Enhancement', manufacturer: 'Hyperion', ncs_slots: ['body','core_augment','firmware','stat_group1'], ncs_slot_count: 4 },
    jakobs_enhancement: { ncs_id: 'JAK_Enhancement', type: 'Enhancement', manufacturer: 'Jakobs', ncs_slots: ['body','core_augment','firmware','stat_group1'], ncs_slot_count: 4 },
    maliwan_enhancement: { ncs_id: 'MAL_Enhancement', type: 'Enhancement', manufacturer: 'Maliwan', ncs_slots: ['body','core_augment','firmware','stat_group1'], ncs_slot_count: 4 },
    order_enhancement: { ncs_id: 'ORD_Enhancement', type: 'Enhancement', manufacturer: 'Order', ncs_slots: ['body','core_augment','firmware','stat_group1'], ncs_slot_count: 4 },
    cov_enhancement: { ncs_id: 'COV_Enhancement', type: 'Enhancement', manufacturer: 'COV', ncs_slots: ['body','core_augment','firmware','stat_group1'], ncs_slot_count: 4 },
    tediore_enhancement: { ncs_id: 'TED_Enhancement', type: 'Enhancement', manufacturer: 'Tediore', ncs_slots: ['body','core_augment','firmware','stat_group1'], ncs_slot_count: 4 },
    torgue_enhancement: { ncs_id: 'TOR_Enhancement', type: 'Enhancement', manufacturer: 'Torgue', ncs_slots: ['body','core_augment','firmware','stat_group1'], ncs_slot_count: 4 },
    daedalus_enhancement: { ncs_id: 'DAD_Enhancement', type: 'Enhancement', manufacturer: 'Daedalus', ncs_slots: ['body','core_augment','firmware','stat_group1'], ncs_slot_count: 4 },
    ripper_enhancement: { ncs_id: 'BOR_Enhancement', type: 'Enhancement', manufacturer: 'Borg', ncs_slots: ['body','core_augment','firmware','stat_group1'], ncs_slot_count: 4 },
    vladof_enhancement: { ncs_id: 'VLA_Enhancement', type: 'Enhancement', manufacturer: 'Vladof', ncs_slots: ['body','core_augment','firmware','stat_group1'], ncs_slot_count: 4 },

    torgue_repair_kit: { ncs_id: 'TOR_RepairKit', type: 'RepairKit', manufacturer: 'Torgue', ncs_slots: ['primary_augment'], ncs_slot_count: 1 },
    jakobs_repair_kit: { ncs_id: 'JAK_RepairKit', type: 'RepairKit', manufacturer: 'Jakobs', ncs_slots: ['primary_augment'], ncs_slot_count: 1 },
    maliwan_repair_kit: { ncs_id: 'MAL_RepairKit', type: 'RepairKit', manufacturer: 'Maliwan', ncs_slots: ['curative','primary_augment'], ncs_slot_count: 2 },
    vladof_repair_kit: { ncs_id: 'VLA_RepairKit', type: 'RepairKit', manufacturer: 'Vladof', ncs_slots: ['primary_augment'], ncs_slot_count: 1 },
    daedalus_repair_kit: { ncs_id: 'DAD_RepairKit', type: 'RepairKit', manufacturer: 'Daedalus', ncs_slots: ['primary_augment'], ncs_slot_count: 1 },
    ripper_repair_kit: { ncs_id: 'BOR_RepairKit', type: 'RepairKit', manufacturer: 'Borg', ncs_slots: ['primary_augment','secondary_augment'], ncs_slot_count: 2 },
    order_repair_kit: { ncs_id: 'ORD_RepairKit', type: 'RepairKit', manufacturer: 'Order', ncs_slots: ['primary_augment'], ncs_slot_count: 1 },
    tediore_repair_kit: { ncs_id: 'TED_RepairKit', type: 'RepairKit', manufacturer: 'Tediore', ncs_slots: ['primary_augment'], ncs_slot_count: 1 },

    maliwan_grenade_gadget: { ncs_id: 'MAL_GrenadeGadget', type: 'Gadget', manufacturer: 'Maliwan', ncs_slots: ['element','payload','payload_augment','stat_augment'], ncs_slot_count: 4 },
    jakobs_grenade_gadget: { ncs_id: 'JAK_GrenadeGadget', type: 'Gadget', manufacturer: 'Jakobs', ncs_slots: ['payload','payload_augment','stat_augment'], ncs_slot_count: 3 },
    daedalus_grenade_gadget: { ncs_id: 'DAD_GrenadeGadget', type: 'Gadget', manufacturer: 'Daedalus', ncs_slots: ['body','element','payload','payload_augment','stat_augment','firmware','endgame','pearl_elem','pearl_stat'], ncs_slot_count: 9 },
    ripper_grenade_gadget: { ncs_id: 'BOR_GrenadeGadget', type: 'Gadget', manufacturer: 'Borg', ncs_slots: ['element','payload','payload_augment','stat_augment'], ncs_slot_count: 4 },
    order_grenade_gadget: { ncs_id: 'ORD_GrenadeGadget', type: 'Gadget', manufacturer: 'Order', ncs_slots: ['body','element','payload','payload_augment','stat_augment','firmware','endgame','pearl_elem','pearl_stat'], ncs_slot_count: 9 },
    torgue_grenade_gadget: { ncs_id: 'TOR_GrenadeGadget', type: 'Gadget', manufacturer: 'Torgue', ncs_slots: ['body','element','payload','payload_augment','stat_augment','firmware','endgame','pearl_elem','pearl_stat'], ncs_slot_count: 9 },
    vladof_grenade_gadget: { ncs_id: 'VLA_GrenadeGadget', type: 'Gadget', manufacturer: 'Vladof', ncs_slots: ['body','element','payload','payload_augment','stat_augment','firmware','endgame','pearl_elem','pearl_stat'], ncs_slot_count: 9 },
    tediore_grenade_gadget: { ncs_id: 'TED_GrenadeGadget', type: 'Gadget', manufacturer: 'Tediore', ncs_slots: ['body','element','payload','payload_augment','stat_augment','firmware','endgame','pearl_elem','pearl_stat'], ncs_slot_count: 9 },

    shield: { ncs_id: 'Shield', type: 'energy_shield', manufacturer: null, ncs_slots: ['body','element','primary_augment','secondary_augment','body_acc','firmware','endgame','unique'], ncs_slot_count: 8 },
    maliwan_shield: { ncs_id: 'MAL_Shield', type: 'energy_shield', manufacturer: 'Maliwan', ncs_slots: ['primary_augment','secondary_augment','unique'], ncs_slot_count: 3 },
    vladof_shield: { ncs_id: 'VLA_Shield', type: 'energy_shield', manufacturer: 'Vladof', ncs_slots: ['body','element','primary_augment','secondary_augment','body_acc','firmware','endgame','unique'], ncs_slot_count: 8 },
    order_shield: { ncs_id: 'ORD_Shield', type: 'energy_shield', manufacturer: 'Order', ncs_slots: ['primary_augment','secondary_augment','unique'], ncs_slot_count: 3 },
    jakobs_shield: { ncs_id: 'JAK_Shield', type: 'energy_shield', manufacturer: 'Jakobs', ncs_slots: ['body','element','primary_augment','secondary_augment','body_acc','firmware','endgame','unique'], ncs_slot_count: 8 },
    daedalus_shield: { ncs_id: 'DAD_Shield', type: 'energy_shield', manufacturer: 'Daedalus', ncs_slots: ['body','element','primary_augment','secondary_augment','body_acc','firmware','endgame','unique'], ncs_slot_count: 8 },
    torgue_shield: { ncs_id: 'TOR_Shield', type: 'energy_shield', manufacturer: 'Torgue', ncs_slots: ['body','element','primary_augment','secondary_augment','body_acc','firmware','endgame','unique'], ncs_slot_count: 8 },

    terminal_gadget_barrier: { ncs_id: 'Terminal_Barrier', type: 'Gadget', manufacturer: null, ncs_slots: ['body','primary_augment','secondary_augment','enemy_augment','active_augment','firmware','endgame'], ncs_slot_count: 7 },
    terminal_gadget_combat: { ncs_id: 'Terminal_Combat', type: 'Gadget', manufacturer: null, ncs_slots: ['body','primary_augment','secondary_augment','enemy_augment','active_augment','firmware','endgame'], ncs_slot_count: 7 },
    terminal_gadget_healing: { ncs_id: 'Terminal_Healing', type: 'Gadget', manufacturer: null, ncs_slots: ['body','primary_augment','secondary_augment','enemy_augment','active_augment','firmware','endgame'], ncs_slot_count: 7 },
    ripper_terminal_barrier: { ncs_id: 'BOR_TerminalBarrier', type: 'Gadget', manufacturer: 'Borg', ncs_slots: ['active_augment'], ncs_slot_count: 1 },
    daedalus_terminal_combat: { ncs_id: 'DAD_TerminalCombat', type: 'Gadget', manufacturer: 'Daedalus', ncs_slots: ['active_augment'], ncs_slot_count: 1 },
    jakobs_terminal_combat: { ncs_id: 'JAK_TerminalCombat', type: 'Gadget', manufacturer: 'Jakobs', ncs_slots: ['active_augment'], ncs_slot_count: 1 },
    maliwan_terminal_healing: { ncs_id: 'MAL_TerminalHealing', type: 'Gadget', manufacturer: 'Maliwan', ncs_slots: ['active_augment'], ncs_slot_count: 1 },
    order_terminal_healing: { ncs_id: 'ORD_TerminalHealing', type: 'Gadget', manufacturer: 'Order', ncs_slots: ['active_augment','primary_augment','secondary_augment'], ncs_slot_count: 3 },
    tediore_terminal_barrier: { ncs_id: 'TED_TerminalBarrier', type: 'Gadget', manufacturer: 'Tediore', ncs_slots: ['active_augment'], ncs_slot_count: 1 },
    torgue_terminal_combat: { ncs_id: 'TOR_TerminalCombat', type: 'Gadget', manufacturer: 'Torgue', ncs_slots: ['active_augment'], ncs_slot_count: 1 },
    vladof_terminal_barrier: { ncs_id: 'VLA_TerminalBarrier', type: 'Gadget', manufacturer: 'Vladof', ncs_slots: ['body','primary_augment','secondary_augment','enemy_augment','active_augment','firmware','endgame'], ncs_slot_count: 7 },

    vladof_turret_gadget: { ncs_id: 'VLA_TurretGadget', type: 'Gadget', manufacturer: 'Vladof', ncs_slots: ['body','body_acc','element','turret_weapon','primary_augment','secondary_augment','firmware','endgame'], ncs_slot_count: 8 },
    tediore_turret_gadget: { ncs_id: 'TED_TurretGadget', type: 'Gadget', manufacturer: 'Tediore', ncs_slots: ['body','body_acc','element','turret_weapon','primary_augment','secondary_augment','firmware','endgame'], ncs_slot_count: 8 },
    torgue_turret_gadget: { ncs_id: 'TOR_TurretGadget', type: 'Gadget', manufacturer: 'Torgue', ncs_slots: ['body','body_acc','element','turret_weapon','primary_augment','secondary_augment','firmware','endgame'], ncs_slot_count: 8 },
    order_turret_gadget: { ncs_id: 'ORD_TurretGadget', type: 'Gadget', manufacturer: 'Order', ncs_slots: ['turret_weapon'], ncs_slot_count: 1 },

    turret_weapon_basic: { ncs_id: 'TurretWeapon_Basic', type: 'weapon_gadget_turret', manufacturer: null, ncs_slots: ['body','secondary_augment','body_ele','underbarrel'], ncs_slot_count: 4 },
    turret_weapon_beam: { ncs_id: 'TurretWeapon_Beam', type: 'weapon_gadget_turret', manufacturer: null, ncs_slots: ['body','secondary_augment','body_ele','underbarrel'], ncs_slot_count: 4 },
    turret_weapon_chaingun: { ncs_id: 'TurretWeapon_Chaingun', type: 'weapon_gadget_turret', manufacturer: null, ncs_slots: ['body','secondary_augment','body_ele','underbarrel'], ncs_slot_count: 4 },
    turret_weapon_longrifle: { ncs_id: 'TurretWeapon_Longrifle', type: 'weapon_gadget_turret', manufacturer: null, ncs_slots: ['body','secondary_augment','body_ele','underbarrel'], ncs_slot_count: 4 },
    turret_weapon_rocketlauncher: { ncs_id: 'TurretWeapon_RocketLauncher', type: 'weapon_gadget_turret', manufacturer: null, ncs_slots: ['body','secondary_augment','body_ele','underbarrel'], ncs_slot_count: 4 },
    turret_weapon_shotgun: { ncs_id: 'TurretWeapon_Shotgun', type: 'weapon_gadget_turret', manufacturer: null, ncs_slots: ['body','secondary_augment','body_ele','underbarrel'], ncs_slot_count: 4 },
    weapon_turret_chaingun: { ncs_id: 'Weapon_TurretChaingun', type: 'weapon_gadget_turret', manufacturer: null, ncs_slots: ['body','secondary_augment','body_ele','underbarrel'], ncs_slot_count: 4 },

    classmod_dark_siren: { ncs_id: 'ClassMod_DarkSiren', type: 'ClassMod', manufacturer: null, ncs_slots: ['rarity','class_mod','stat_group1'], ncs_slot_count: 3 },
    classmod_exo_soldier: { ncs_id: 'ClassMod_ExoSoldier', type: 'ClassMod', manufacturer: null, ncs_slots: ['rarity','class_mod','stat_group1'], ncs_slot_count: 3 },
    classmod_gravitar: { ncs_id: 'ClassMod_Gravitar', type: 'ClassMod', manufacturer: null, ncs_slots: ['rarity','class_mod','stat_group1'], ncs_slot_count: 3 },
    classmod_paladin: { ncs_id: 'ClassMod_Paladin', type: 'ClassMod', manufacturer: null, ncs_slots: ['rarity','class_mod','stat_group1'], ncs_slot_count: 3 },
    classmod_robodealer: { ncs_id: 'ClassMod_RoboDealer', type: 'ClassMod', manufacturer: null, ncs_slots: ['rarity','class_mod','stat_group1'], ncs_slot_count: 3 },

    weapon_ar: { ncs_id: 'Weapon_AR', type: 'Weapon_AR', manufacturer: null, ncs_slots: ['rarity'], ncs_slot_count: 1 },
    heavy_weapon_gadget: { ncs_id: 'HeavyWeapon_Gadget', type: 'heavy_weapon_gadget', manufacturer: null, ncs_slots: ['body','body_acc','body_ele','barrel','barrel_acc','firmware','endgame','pearl_elem','pearl_stat'], ncs_slot_count: 9 }
  },

  weapon_type_codes: {
    Weapon_AR: 'AR', Weapon_PS: 'PS', Weapon_SG: 'SG', Weapon_SM: 'SM', Weapon_SR: 'SR',
    heavy_weapon_gadget: 'HW', energy_shield: 'SH', Armor_Shield: 'SH', Gadget: 'GD'
  },

  manufacturer_map: {
    daedalus: 'Daedalus', jakobs: 'Jakobs', order: 'Order', tediore: 'Tediore',
    torgue: 'Torgue', vladof: 'Vladof', ripper: 'Borg', maliwan: 'Maliwan'
  },

  category_ids: {
    Weapon_AR: 2, Weapon_PS: 2, Weapon_SG: 2, Weapon_SM: 2, Weapon_SR: 2,
    heavy_weapon_gadget: 273, weapon_gadget_turret: 282,
    energy_shield: 246, Armor_Shield: 246, Gadget: 291, RepairKit: 243, Enhancement: 310,
    ClassMod: 254
  }
};
