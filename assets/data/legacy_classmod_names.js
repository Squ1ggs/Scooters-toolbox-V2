/**
 * Legacy Class Mod name parts (Name+Skin) for the Guided Class Mod Builder.
 * Used when __LEGACY_CLASSMOD_PARTS_BY_KEY is not provided by the main toolbox.
 * Format: [id, name, kind] where kind is "Name+Skin" (normal) or "Name+Skin+Leg Effect" (legendary).
 */
(function () {
  'use strict';
  if (typeof window.__LEGACY_CLASSMOD_PARTS_BY_KEY !== 'undefined') return;
  window.__LEGACY_CLASSMOD_PARTS_BY_KEY = {
    vex: [
      [1, "Transistor", "Name+Skin"], [2, "Firedancer", "Name+Skin"], [3, "Naturalist", "Name+Skin"],
      [4, "Weaver", "Name+Skin"], [5, "Radiance", "Name+Skin"], [6, "Ritualist", "Name+Skin"],
      [7, "Alchemist", "Name+Skin"], [8, "Commander", "Name+Skin"], [9, "Hunter", "Name+Skin"],
      [10, "Technomancer", "Name+Skin+Leg Effect"], [11, "Avatar", "Name+Skin+Leg Effect"],
      [12, "Undead Eye", "Name+Skin+Leg Effect"], [13, "Kindread Spirits", "Name+Skin+Leg Effect"],
      [14, "Illusionist", "Name+Skin+Leg Effect"], [15, "Teen Witch", "Name+Skin+Leg Effect"]
    ],
    amon: [
      [1, "Brawler", "Name+Skin"], [2, "Grenadier", "Name+Skin"], [3, "Icebringer", "Name+Skin"],
      [4, "Torchbearer", "Name+Skin"], [5, "Stormcaller", "Name+Skin"], [6, "Soldier", "Name+Skin"],
      [7, "Commando", "Name+Skin"], [8, "Cyborg", "Name+Skin"], [9, "Outlaw", "Name+Skin"],
      [10, "Furnace", "Name+Skin+Leg Effect"], [11, "Elementalist", "Name+Skin+Leg Effect"],
      [12, "Blacksmith", "Name+Skin+Leg Effect"], [13, "Shatterwight", "Name+Skin+Leg Effect"],
      [14, "Viking", "Name+Skin+Leg Effect"], [15, "Forge Master", "Name+Skin+Leg Effect"]
    ],
    rafa: [
      [1, "Genio", "Name+Skin"], [2, "Soldado", "Name+Skin"], [3, "Demolitionist", "Name+Skin"],
      [4, "Tecnico", "Name+Skin"], [5, "Mercenario", "Name+Skin"], [6, "Gearhead", "Name+Skin"],
      [7, "Trooper", "Name+Skin"], [8, "Tanker", "Name+Skin"], [9, "Practitioner", "Name+Skin"],
      [10, "Dancer", "Name+Skin+Leg Effect"], [11, "Filantropo", "Name+Skin+Leg Effect"],
      [12, "Instigator", "Name+Skin+Leg Effect"], [13, "Buster", "Name+Skin+Leg Effect"],
      [14, "Esgrimidor", "Name+Skin+Leg Effect"], [15, "Grenazerker", "Name+Skin+Leg Effect"]
    ],
    harlowe: [
      [1, "Chemist", "Name+Skin"], [2, "Assistant", "Name+Skin"], [3, "Physicist", "Name+Skin"],
      [4, "Controller", "Name+Skin"], [5, "Compiler", "Name+Skin"], [6, "Specialist", "Name+Skin"],
      [7, "Bookworm", "Name+Skin"], [8, "Radiologist", "Name+Skin"], [9, "Savant", "Name+Skin"],
      [10, "Bio Robot", "Name+Skin+Leg Effect"], [11, "Reactor", "Name+Skin+Leg Effect"],
      [12, "Generator", "Name+Skin+Leg Effect"], [13, "Driver", "Name+Skin+Leg Effect"],
      [14, "Skeptic", "Name+Skin+Leg Effect"], [15, "Scientist", "Name+Skin+Leg Effect"]
    ],
    /* C4sh (Robodealer): C4sh class mod names + legendary bodies + skill perks */
    c4sh: [
      [1, "Pistoleer", "Name+Skin"], [2, "Bane", "Name+Skin"], [3, "Gambler", "Name+Skin"],
      [4, "Puppeteer", "Name+Skin"], [5, "Swindler", "Name+Skin"], [6, "Antagonist", "Name+Skin"],
      [7, "Powderbot", "Name+Skin"], [8, "Triggerbot", "Name+Skin"], [9, "CrackShot", "Name+Skin"],
      [10, "Pack Leader", "Name+Skin"],
      [11, "Rounder", "Name+Skin+Leg Effect"], [12, "Ludopath", "Name+Skin+Leg Effect"],
      [13, "Hotshot", "Name+Skin+Leg Effect"], [14, "Cooler", "Name+Skin+Leg Effect"],
      [15, "Whale", "Name+Skin+Leg Effect"],
      [51, "Windrider", "Name+Skin+Leg Effect"],
      [222, "Gamer", "Name+Skin+Leg Effect"],
      [538, "Hooligan", "Name+Skin+Leg Effect"],

      // C4sh per-class legendary skill perks (tiered) for classmod UI via getLegacyClassModSkillParts
      [192, "Splash the pot", "Skill"], [160, "Splash the pot", "Skill"], [128, "Splash the pot", "Skill"], [96, "Splash the pot", "Skill"], [64, "Splash the pot", "Skill"],
      [189, "Sounds of Rain", "Skill"], [157, "Sounds of Rain", "Skill"], [125, "Sounds of Rain", "Skill"], [93, "Sounds of Rain", "Skill"], [61, "Sounds of Rain", "Skill"],
      [197, "Before She Knows You're Dead", "Skill"], [165, "Before She Knows You're Dead", "Skill"], [133, "Before She Knows You're Dead", "Skill"], [101, "Before She Knows You're Dead", "Skill"], [69, "Before She Knows You're Dead", "Skill"],
      [252, "Truck Full of Nitro", "Skill"], [315, "Truck Full of Nitro", "Skill"], [378, "Truck Full of Nitro", "Skill"], [441, "Truck Full of Nitro", "Skill"], [504, "Truck Full of Nitro", "Skill"],
      [282, "Tender Hearts", "Skill"], [345, "Tender Hearts", "Skill"], [408, "Tender Hearts", "Skill"], [471, "Tender Hearts", "Skill"], [534, "Tender Hearts", "Skill"],
      [230, "Potent Posse", "Skill"], [293, "Potent Posse", "Skill"], [356, "Potent Posse", "Skill"], [419, "Potent Posse", "Skill"], [482, "Potent Posse", "Skill"],
      [237, "Accursed Bones", "Skill"], [300, "Accursed Bones", "Skill"], [363, "Accursed Bones", "Skill"], [426, "Accursed Bones", "Skill"], [489, "Accursed Bones", "Skill"],
      [194, "Fast Hands", "Skill"], [162, "Fast Hands", "Skill"], [130, "Fast Hands", "Skill"], [98, "Fast Hands", "Skill"], [66, "Fast Hands", "Skill"],
      [193, "Insurance", "Skill"], [161, "Insurance", "Skill"], [129, "Insurance", "Skill"], [97, "Insurance", "Skill"], [65, "Insurance", "Skill"],
      [191, "Alchemy", "Skill"], [159, "Alchemy", "Skill"], [127, "Alchemy", "Skill"], [95, "Alchemy", "Skill"], [63, "Alchemy", "Skill"],
      [190, "Go for Broke", "Skill"], [158, "Go for Broke", "Skill"], [126, "Go for Broke", "Skill"], [94, "Go for Broke", "Skill"], [62, "Go for Broke", "Skill"],
      [188, "Trick-Taker", "Skill"], [156, "Trick-Taker", "Skill"], [124, "Trick-Taker", "Skill"], [92, "Trick-Taker", "Skill"], [60, "Trick-Taker", "Skill"],
      [187, "Late Scratch", "Skill"], [155, "Late Scratch", "Skill"], [123, "Late Scratch", "Skill"], [91, "Late Scratch", "Skill"], [59, "Late Scratch", "Skill"],
      [30, "Double-Down", "Skill"], [29, "Double-Down", "Skill"], [28, "Double-Down", "Skill"], [27, "Double-Down", "Skill"], [26, "Double-Down", "Skill"],
      [185, "Wretched Shadows", "Skill"], [153, "Wretched Shadows", "Skill"], [121, "Wretched Shadows", "Skill"], [89, "Wretched Shadows", "Skill"], [57, "Wretched Shadows", "Skill"],
      [265, "High Roller", "Skill"], [328, "High Roller", "Skill"], [391, "High Roller", "Skill"], [454, "High Roller", "Skill"], [517, "High Roller", "Skill"],
      [266, "Take the Pot", "Skill"], [329, "Take the Pot", "Skill"], [392, "Take the Pot", "Skill"], [455, "Take the Pot", "Skill"], [518, "Take the Pot", "Skill"],
      [267, "Stack the Deck", "Skill"], [330, "Stack the Deck", "Skill"], [393, "Stack the Deck", "Skill"], [456, "Stack the Deck", "Skill"], [519, "Stack the Deck", "Skill"],
      [268, "Legerdamain", "Skill"], [331, "Legerdamain", "Skill"], [394, "Legerdamain", "Skill"], [457, "Legerdamain", "Skill"], [520, "Legerdamain", "Skill"],
      [269, "Vigorish", "Skill"], [332, "Vigorish", "Skill"], [395, "Vigorish", "Skill"], [458, "Vigorish", "Skill"], [521, "Vigorish", "Skill"],
      [270, "Dealer's Bluff", "Skill"], [333, "Dealer's Bluff", "Skill"], [396, "Dealer's Bluff", "Skill"], [459, "Dealer's Bluff", "Skill"], [522, "Dealer's Bluff", "Skill"],
      [272, "Ace in the Hole", "Skill"], [335, "Ace in the Hole", "Skill"], [398, "Ace in the Hole", "Skill"], [461, "Ace in the Hole", "Skill"], [524, "Ace in the Hole", "Skill"],
      [273, "Around the Corner", "Skill"], [336, "Around the Corner", "Skill"], [399, "Around the Corner", "Skill"], [462, "Around the Corner", "Skill"], [525, "Around the Corner", "Skill"],
      [275, "House Edge", "Skill"], [338, "House Edge", "Skill"], [401, "House Edge", "Skill"], [464, "House Edge", "Skill"], [527, "House Edge", "Skill"],
      [276, "C4SH Game", "Skill"], [339, "C4SH Game", "Skill"], [402, "C4SH Game", "Skill"], [465, "C4SH Game", "Skill"], [528, "C4SH Game", "Skill"],
      [277, "No Limit", "Skill"], [340, "No Limit", "Skill"], [403, "No Limit", "Skill"], [466, "No Limit", "Skill"], [529, "No Limit", "Skill"],
      [278, "Ante Up", "Skill"], [341, "Ante Up", "Skill"], [404, "Ante Up", "Skill"], [467, "Ante Up", "Skill"], [530, "Ante Up", "Skill"],
      [279, "Kill Button", "Skill"], [342, "Kill Button", "Skill"], [405, "Kill Button", "Skill"], [468, "Kill Button", "Skill"], [531, "Kill Button", "Skill"],
      [280, "Payout", "Skill"], [343, "Payout", "Skill"], [406, "Payout", "Skill"], [469, "Payout", "Skill"], [532, "Payout", "Skill"],
      [281, "Boom or Bust", "Skill"], [344, "Boom or Bust", "Skill"], [407, "Boom or Bust", "Skill"], [470, "Boom or Bust", "Skill"], [533, "Boom or Bust", "Skill"],
      [283, "Card Sharp", "Skill"], [346, "Card Sharp", "Skill"], [409, "Card Sharp", "Skill"], [472, "Card Sharp", "Skill"], [535, "Card Sharp", "Skill"],
      [284, "Hot Streak", "Skill"], [347, "Hot Streak", "Skill"], [410, "Hot Streak", "Skill"], [473, "Hot Streak", "Skill"], [536, "Hot Streak", "Skill"],
      [205, "Luck Be a Robot", "Skill"], [173, "Luck Be a Robot", "Skill"], [141, "Luck Be a Robot", "Skill"], [109, "Luck Be a Robot", "Skill"], [77, "Luck Be a Robot", "Skill"],
      [204, "Sweet Roll", "Skill"], [172, "Sweet Roll", "Skill"], [140, "Sweet Roll", "Skill"], [108, "Sweet Roll", "Skill"], [76, "Sweet Roll", "Skill"],
      [202, "Charm Bracelet", "Skill"], [170, "Charm Bracelet", "Skill"], [138, "Charm Bracelet", "Skill"], [106, "Charm Bracelet", "Skill"], [74, "Charm Bracelet", "Skill"],
      [201, "O Fortuna", "Skill"], [169, "O Fortuna", "Skill"], [137, "O Fortuna", "Skill"], [105, "O Fortuna", "Skill"], [73, "O Fortuna", "Skill"],
      [200, "Red Moon Rising", "Skill"], [168, "Red Moon Rising", "Skill"], [136, "Red Moon Rising", "Skill"], [104, "Red Moon Rising", "Skill"], [72, "Red Moon Rising", "Skill"],
      [199, "Ready to Roll", "Skill"], [167, "Ready to Roll", "Skill"], [135, "Ready to Roll", "Skill"], [103, "Ready to Roll", "Skill"], [71, "Ready to Roll", "Skill"],
      [195, "Riding High", "Skill"], [163, "Riding High", "Skill"], [131, "Riding High", "Skill"], [99, "Riding High", "Skill"], [67, "Riding High", "Skill"],
      [196, "Bonemeal Ticket", "Skill"], [164, "Bonemeal Ticket", "Skill"], [132, "Bonemeal Ticket", "Skill"], [100, "Bonemeal Ticket", "Skill"], [68, "Bonemeal Ticket", "Skill"],
      [197, "Before She Knows You're Dead", "Skill"], [165, "Before She Knows You're Dead", "Skill"], [133, "Before She Knows You're Dead", "Skill"], [101, "Before She Knows You're Dead", "Skill"], [69, "Before She Knows You're Dead", "Skill"],
      [198, "Luckless", "Skill"], [166, "Luckless", "Skill"], [134, "Luckless", "Skill"], [102, "Luckless", "Skill"], [70, "Luckless", "Skill"],
      [223, "Can't Stop Winning", "Skill"], [286, "Can't Stop Winning", "Skill"], [349, "Can't Stop Winning", "Skill"], [412, "Can't Stop Winning", "Skill"], [475, "Can't Stop Winning", "Skill"],
      [224, "Turn of Fate", "Skill"], [287, "Turn of Fate", "Skill"], [350, "Turn of Fate", "Skill"], [413, "Turn of Fate", "Skill"], [476, "Turn of Fate", "Skill"],
      [225, "High Stakes", "Skill"], [288, "High Stakes", "Skill"], [351, "High Stakes", "Skill"], [414, "High Stakes", "Skill"], [477, "High Stakes", "Skill"],
      [227, "Fortune's Favor", "Skill"], [290, "Fortune's Favor", "Skill"], [353, "Fortune's Favor", "Skill"], [416, "Fortune's Favor", "Skill"], [479, "Fortune's Favor", "Skill"],
      [228, "Let it Ride", "Skill"]
    ]
  };
})();
