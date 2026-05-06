    var M = typeof BL4_MANIFEST !== 'undefined' ? BL4_MANIFEST : null;
    var NCS = typeof NCS_EXTRA !== 'undefined' ? NCS_EXTRA : null;
    var NMAP = typeof NCS_SLOT_MAP !== 'undefined' ? NCS_SLOT_MAP : null;
    var NPARTS = typeof NCS_PARTS !== 'undefined' ? NCS_PARTS : null;
    var WSTATS = typeof WEAPON_STATS_DATA !== 'undefined' ? WEAPON_STATS_DATA : null;
    var PSTATS = (typeof window !== 'undefined' && window.PARTS_STATS_DATA) ? window.PARTS_STATS_DATA : null;
    var IPDROPROWS = (typeof window !== 'undefined' && window.ITEMPOOLLIST_DROP_ROWS_DATA) ? window.ITEMPOOLLIST_DROP_ROWS_DATA : null;
    var SPATHS = (typeof window !== 'undefined' && window.SOURCE_PATHS_DATA) ? window.SOURCE_PATHS_DATA : null;
    var LSCHED = (typeof window !== 'undefined' && window.LEGIT_LOOT_SCHEDULE) ? window.LEGIT_LOOT_SCHEDULE : null;
    var WPWEIGHTS = (typeof window !== 'undefined' && window.LEGIT_WEAPON_PART_WEIGHTS) ? window.LEGIT_WEAPON_PART_WEIGHTS : null;
    var STX_RAR = (typeof window !== 'undefined' && Array.isArray(window.STX_RARITIES)) ? window.STX_RARITIES : [];
    if (!M) {
      document.body.innerHTML = '<div class="legit-header"><h1 style="color:#ff6b6b">Error</h1><p style="color:rgba(233,254,255,0.6)">bl4_manifest.js not found.</p></div>';
      throw new Error('BL4_MANIFEST not loaded');
    }

    var SLUG_TO_PREFIX = window.SLUG_TO_PREFIX;
    var buildSlugPrefix = window.buildSlugPrefix;

    function getAllItems() {
      var list = (M && M.items) ? M.items.slice() : [];
      var cm = (typeof CLASSMOD_MANIFEST_ITEMS !== 'undefined' && Array.isArray(CLASSMOD_MANIFEST_ITEMS)) ? CLASSMOD_MANIFEST_ITEMS : [];
      if (cm.length) {
        var haveCm = {};
        list.forEach(function(i) { haveCm[i.slug] = true; });
        cm.forEach(function(i) {
          if (!haveCm[i.slug]) { list.push(i); haveCm[i.slug] = true; }
        });
      }
      if (!NMAP || !NMAP.items || !NMAP.category_ids) return list;
      var manifestSlugs = {};
      list.forEach(function(i) { manifestSlugs[i.slug] = true; });
      var supplement = [];
      Object.keys(NMAP.items).forEach(function(slug) {
        if (manifestSlugs[slug]) return;
        var info = NMAP.items[slug];
        /* Avoid synthetic classmod entries without manifest slot data (causes broken/incomplete slot UI). */
        if (String((info && info.type) || '').toLowerCase() === 'classmod') return;
        var typeCode = NMAP.category_ids[info.type] || 291;
        var name = slug.split('_').map(function(s) { return s.charAt(0).toUpperCase() + s.slice(1); }).join(' ');
        supplement.push({
          slug: slug,
          name: name,
          category_id: typeCode,
          slot_count: info.ncs_slot_count,
          slots: {},
          total_parts: 0,
          _ncsSupplement: true
        });
      });
      supplement.sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });
      return list.concat(supplement);
    }

    var SLOT_LABELS = {
      rarity: 'Rarity', body: 'Body', barrel: 'Barrel', grip: 'Grip', magazine: 'Magazine', mag: 'Magazine',
      scope: 'Scope', foregrip: 'Foregrip', underbarrel: 'Underbarrel', shield: 'Shield',
      body_acc: 'Body Accessory', barrel_acc: 'Barrel Accessory', magazine_acc: 'Magazine Acc.',
      scope_acc: 'Scope Accessory', hyperion_secondary_acc: 'Hyperion Shield',
      tediore_acc: 'Tediore Acc.', tediore_secondary_acc: 'Tediore Sec. Acc.',
      underbarrel_acc: 'Underbarrel Acc.', underbarrel_acc_vis: 'UB Acc. Visual',
      barrel_licensed: 'Licensed Barrel',
      body_ele: 'Body Element', body_bolt: 'Body Bolt', body_mag: 'Body Mag',
      secondary_ele: 'Sec. Element', primary_ele: 'Primary Element',
      secondary_ammo: 'Sec. Ammo', magazine_ted_thrown: 'Tediore Thrown Mag',
      magazine_borg: 'Borg Magazine', pearl_elem: 'Pearl Element', pearl_stat: 'Pearl Stat',
      firmware: 'Firmware', endgame: 'Endgame', unique: 'Unique', multi: 'Multi',
      element: 'Element', payload: 'Payload', payload_augment: 'Payload Augment',
      stat_augment: 'Stat Augment', primary_augment: 'Primary Augment',
      secondary_augment: 'Sec. Augment', active_augment: 'Active Augment',
      enemy_augment: 'Enemy Augment', turret_weapon: 'Turret Weapon',
      class_mod: 'Class Mod', body_energy: 'Body Energy', body_armor: 'Body Armor',
      secondary: 'Secondary', unknown: 'Unknown',
      stat: 'Stat Mod 1', stat2: 'Stat Mod 2', stat3: 'Stat Mod 3',
      stat_group1: 'Stat Group 1', stat_group2: 'Stat Group 2', stat_group3: 'Stat Group 3'
    };

    var SLOT_CATEGORY_MAP = {};
    if (NMAP && NMAP.slot_categories) {
      Object.keys(NMAP.slot_categories).forEach(function(cat) {
        NMAP.slot_categories[cat].forEach(function(s) { SLOT_CATEGORY_MAP[s] = cat; });
      });
    }
    function getSlotCategory(slotName) {
      if (slotName === 'rarity') return 'core';
      if (/^(body_ele|primary_ele|secondary_ele|pearl_elem|element)$/.test(String(slotName || ''))) return 'core';
      if (SLOT_CATEGORY_MAP[slotName]) return SLOT_CATEGORY_MAP[slotName];
      if (slotName.indexOf('_acc') !== -1) return 'accessory';
      return 'other';
    }

    /** Map NCS slot name → manifest `item.slots` key (magazine/mag, shield/hyperion, etc.). */
    function resolveManifestSlotKey(ns, item) {
      if (!item || !item.slots) return null;
      if (item.slots[ns]) return ns;
      if (ns === 'element') {
        if (item.slots.body_ele) return 'body_ele';
        if (item.slots.primary_ele) return 'primary_ele';
        if (item.slots.secondary_ele) return 'secondary_ele';
      }
      if ((ns === 'body_ele' || ns === 'primary_ele' || ns === 'secondary_ele') && item.slots.element) return 'element';
      if (ns === 'magazine' && item.slots.mag) return 'mag';
      if (ns === 'mag' && item.slots.magazine) return 'magazine';
      if (ns === 'hyperion_secondary_acc' && item.slots.shield) return 'shield';
      if (ns === 'shield' && item.slots.hyperion_secondary_acc) return 'hyperion_secondary_acc';
      if (ns === 'tediore_acc' && item.slots.multi) return 'multi';
      if (ns === 'multi' && item.slots.tediore_acc) return 'tediore_acc';
      if (ns === 'class_mod_body' && item.slots.class_mod) return 'class_mod';
      if (ns === 'class_mod' && item.slots.class_mod_body) return 'class_mod_body';
      return null;
    }

    /* Show build flow first (core -> accessories) before misc properties. */
    var CAT_ORDER = ['core','accessory','ammo','visual','endgame','other'];
    var CAT_LABELS = { core:'Core Parts', accessory:'Accessories', ammo:'Ammo / Mags', visual:'Visual', endgame:'Endgame / Firmware', other:'Item Properties' };
    var CAT_CSS = { core:'cat-core', accessory:'cat-accessory', ammo:'cat-ammo', visual:'cat-visual', endgame:'cat-endgame', other:'cat-other' };

    var WEAPON_TYPE_MAP = { pistol:'PS', shotgun:'SG', ar:'AR', smg:'SM', sniper:'SR', heavy_weapon:'HW' };

    function getWeaponTypeCode(slug) {
      var parts = slug.split('_');
      var type = parts.slice(1).join('_');
      return WEAPON_TYPE_MAP[type] || null;
    }

    function getMfrFromSlug(slug) {
      var parts = slug.split('_');
      var map = { daedalus:'Daedalus', jakobs:'Jakobs', tediore:'Tediore', torgue:'Torgue', order:'Order', vladof:'Vladof', ripper:'Borg', maliwan:'Maliwan', atlas:'Atlas', cov:'COV', hyperion:'Hyperion' };
      return map[parts[0]] || null;
    }

    function rarityTierFromRow(row) {
      var s = String((row && row.itemTypeString) || '').toLowerCase();
      var m = s.match(/comp_\d+_(common|uncommon|rare|epic|legendary)/);
      if (m && m[1]) return m[1];
      if (s.indexOf('legendary') >= 0) return 'legendary';
      if (s.indexOf('epic') >= 0) return 'epic';
      if (s.indexOf('rare') >= 0) return 'rare';
      if (s.indexOf('uncommon') >= 0) return 'uncommon';
      if (s.indexOf('common') >= 0) return 'common';
      return '';
    }

    function getExtraRarityOptions(item, existingOptions) {
      if (!item || !Array.isArray(STX_RAR) || !STX_RAR.length) return [];
      var fam = Number(item.category_id);
      if (!Number.isFinite(fam)) return [];
      var seen = {};
      (existingOptions || []).forEach(function (o) {
        var idx = Number(o && o.index);
        if (Number.isFinite(idx)) seen[idx] = true;
      });
      var mfr = (getNcsInfo(item.slug) && getNcsInfo(item.slug).manufacturer) || getMfrFromSlug(item.slug) || '';
      var mfrNorm = String(mfr || '').trim().toLowerCase();
      var out = [];
      for (var i = 0; i < STX_RAR.length; i++) {
        var row = STX_RAR[i];
        if (!row) continue;
        var rowFam = Number(row.familyId);
        var itemId = Number(row.itemId);
        if (!Number.isFinite(rowFam) || rowFam !== fam || !Number.isFinite(itemId) || seen[itemId]) continue;
        var rowMfr = String(row.manufacturer || '').trim().toLowerCase();
        if (mfrNorm && rowMfr && rowMfr !== mfrNorm) continue;
        var tier = rarityTierFromRow(row);
        var tierLabel = tier ? (tier.charAt(0).toUpperCase() + tier.slice(1)) : 'Rarity';
        var legend = String(row.legendaryName || row.source || '').trim();
        var label = tierLabel + (legend ? (' - ' + legend) : '');
        out.push({
          index: itemId,
          name: label,
          in_pool: true,
          invDumpKey: String(row.itemTypeString || '').trim().toLowerCase(),
          _fromStxRarity: true
        });
        seen[itemId] = true;
      }
      return out;
    }

    var MFR_BARREL_PREFIX = { Daedalus:'DAD', Jakobs:'JAK', Tediore:'TED', Torgue:'TOR', Order:'ORD', Vladof:'VLA', Borg:'BOR', Maliwan:'MAL' };

    var itemSelect = document.getElementById('item-type');
    var slotsContainer = document.getElementById('slots');
    var outputEl = document.getElementById('output');
    var codeOutput = document.getElementById('code-output');
    var validationEl = document.getElementById('validation');
    var itemStatsEl = document.getElementById('item-stats');
    var statEffectsEl = document.getElementById('stat-effects');
    var proofEvidenceEl = document.getElementById('proof-evidence');
    var statsRef = document.getElementById('stats-ref');
    var dropSourcesEl = document.getElementById('drop-sources');
    var copyBtn = document.getElementById('copy-btn');
    var resetBtn = document.getElementById('reset-btn');
    var spawnToggle = document.getElementById('spawn-toggle');
    var strictModeToggle = document.getElementById('strict-mode');
    var modeLabelNum = document.getElementById('mode-label-num');
    var modeLabelSpawn = document.getElementById('mode-label-spawn');
    var dataHealthEl = document.getElementById('data-health');
    var itemLevelInput = document.getElementById('item-level');
    var selectedItem = null;
    var selectedParts = {};
    var useSpawnMode = false;
    var strictMode = true;
    var sourceEvidenceCache = {};

    var invTagHintEl = document.getElementById('inv-tag-rules-hint');
    if (invTagHintEl && typeof window !== 'undefined' && window.INV_COMP_TAG_DATA && window.INV_COMP_TAG_DATA.partsByName) {
      invTagHintEl.style.display = 'inline-block';
    }

    function escapeHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function formatPartName(name) { return name.replace(/^part_|^comp_/i, '').replace(/_/g, ' ').trim(); }
    function getSlotLabel(s) { return SLOT_LABELS[s] || s.replace(/_/g, ' '); }
    function getSlotDisplayLabel(slotKey) {
      var raw = String(slotKey || '');
      var base = slotBaseKey(raw);
      var lbl = getSlotLabel(base);
      var mDup = raw.match(/__dup(\d+)$/i);
      if (mDup && mDup[1]) return lbl + ' #' + String(mDup[1]);
      var mNum = raw.match(/__(\d+)$/);
      if (mNum && mNum[1]) return lbl + ' #' + String(mNum[1]);
      return lbl;
    }

    /** Manifest slot names vs NCS: mag/magazine, shield/hyperion_secondary_acc, multi/tediore_acc. */
    function slotNameAllowedOnNcs(slotName, ncsSlots) {
      if (!ncsSlots || !ncsSlots.length) return true;
      /* Rarity = inv_comp row (comp_01_common …); serial always carries it but ncs_slots often omits it. */
      if (slotName === 'rarity') return true;
      function has(n) { return ncsSlots.indexOf(n) >= 0; }
      if (has(slotName)) return true;
      if (slotName === 'mag' && has('magazine')) return true;
      if (slotName === 'magazine' && has('mag')) return true;
      if (slotName === 'shield' && has('hyperion_secondary_acc')) return true;
      if (slotName === 'hyperion_secondary_acc' && has('shield')) return true;
      if (slotName === 'multi' && has('tediore_acc')) return true;
      if (slotName === 'tediore_acc' && has('multi')) return true;
      return false;
    }

    function normalizeCanonEl(t) {
      if (t == null || t === '') return null;
      var k = String(t).toLowerCase();
      if (k === 'normal' || k === 'none' || k === 'kinetic') return null;
      if (k === 'cryo') return 'cryo';
      if (k === 'corrosive' || k === 'corr' || k === 'acid') return 'corrosive';
      if (k === 'fire' || k === 'incend' || k === 'burn') return 'fire';
      if (k === 'shock' || k === 'electr' || k === 'lightning') return 'shock';
      if (k === 'radiation' || k === 'rad') return 'radiation';
      if (k === 'sonic') return 'sonic';
      return null;
    }

    function isElementLikePartName(name) {
      var n = String(name || '').toLowerCase().trim();
      if (!n) return false;
      if (/^part_(corrosive|cryo|fire|radiation|shock)$/.test(n)) return true;
      if (/^part_element_/.test(n)) return true;
      if (/^part_body_ele_/.test(n)) return true;
      if (/^part_primary_ele_/.test(n)) return true;
      if (/^part_secondary_elem_/.test(n)) return true;
      if (/^part_pearl_elem_/.test(n)) return true;
      return false;
    }

    /** Inv/NCS placeholder (not selected on legit drops; UI label "ele control"). Omit from all slot dropdowns. */
    function isEleControlPlaceholderPartName(name) {
      return String(name || '').toLowerCase().trim() === 'part_ele_control';
    }

    function getAllowedElementSlotSetForItem(item, ncsInfo) {
      var set = {};
      var add = function (s) { if (s) set[String(s).toLowerCase()] = true; };
      if (item && item.slots) {
        if (item.slots.element) add('element');
        if (item.slots.body_ele) add('body_ele');
        if (item.slots.primary_ele) add('primary_ele');
        if (item.slots.secondary_ele) add('secondary_ele');
        if (item.slots.pearl_elem) add('pearl_elem');
      }
      if (ncsInfo && Array.isArray(ncsInfo.ncs_slots)) {
        ncsInfo.ncs_slots.forEach(function (s) {
          var k = String(s || '').toLowerCase().trim();
          if (!k) return;
          if (k === 'element' || k === 'body_ele' || k === 'primary_ele' || k === 'secondary_ele' || k === 'pearl_elem') add(k);
        });
      }
      return set;
    }

    /**
     * Element tokens contributed by a part in a slot (for cross-slot duplicate checks).
     * Skips RainbowVomit-style body parts (multi-element in one part).
     */
    function partElementsForSlot(slotName, partName) {
      var n = String(partName || '').toLowerCase();
      if (!n) return { skipOverlap: false, tokens: [] };
      if (/rainbowvomit/i.test(n)) return { skipOverlap: true, tokens: [] };

      if (slotName === 'secondary_ele') {
        var m = n.match(/^part_secondary_elem_([^_]+)_([^_]+)(?:_mal)?$/);
        if (m) {
          var a = normalizeCanonEl(m[1]), b = normalizeCanonEl(m[2]);
          return { skipOverlap: false, tokens: [a, b].filter(Boolean) };
        }
        return { skipOverlap: false, tokens: [] };
      }

      if (slotName === 'pearl_elem') {
        var pm = n.match(/^part_pearl_elem_([^_]+)_([^_]+)/);
        if (pm) {
          var pa = normalizeCanonEl(pm[1]), pb = normalizeCanonEl(pm[2]);
          return { skipOverlap: false, tokens: [pa, pb].filter(Boolean) };
        }
        return { skipOverlap: false, tokens: [] };
      }

      if (slotName === 'primary_ele') {
        if (/part_primary_ele_normal/.test(n)) return { skipOverlap: false, tokens: [] };
        if (/part_primary_ele_sonic/.test(n)) return { skipOverlap: false, tokens: ['sonic'] };
        var pmm = n.match(/part_primary_ele_([^_]+)/);
        if (pmm) {
          var pt = normalizeCanonEl(pmm[1]);
          return { skipOverlap: false, tokens: pt ? [pt] : [] };
        }
        return { skipOverlap: false, tokens: [] };
      }

      if (slotName === 'body_ele' || slotName === 'element') {
        if (/^part_(corrosive|cryo|fire|radiation|shock)$/.test(n)) {
          var em = n.match(/^part_(corrosive|cryo|fire|radiation|shock)$/);
          return { skipOverlap: false, tokens: [normalizeCanonEl(em[1])].filter(Boolean) };
        }
        if (/^part_element_(corrosive|cryo|fire|radiation|shock)$/.test(n)) {
          var em2 = n.match(/^part_element_([^_]+)$/);
          return { skipOverlap: false, tokens: [normalizeCanonEl(em2[1])].filter(Boolean) };
        }
        if (/part_normal/.test(n)) return { skipOverlap: false, tokens: [] };
        return { skipOverlap: false, tokens: [] };
      }

      return { skipOverlap: false, tokens: [] };
    }

    function analyzeElementConflicts(selectedParts) {
      var entries = [];
      Object.keys(selectedParts).forEach(function(slotName) {
        var p = selectedParts[slotName];
        if (!p || !p.name) return;
        var pe = partElementsForSlot(slotName, p.name);
        if (pe.skipOverlap) return;
        if (pe.tokens && pe.tokens.length) entries.push({ slot: slotName, tokens: pe.tokens });
      });
      var msgs = [];
      for (var i = 0; i < entries.length; i++) {
        for (var j = i + 1; j < entries.length; j++) {
          var a = entries[i], b = entries[j];
          var seen = {};
          for (var ai = 0; ai < a.tokens.length; ai++) {
            for (var bi = 0; bi < b.tokens.length; bi++) {
              if (a.tokens[ai] === b.tokens[bi]) seen[a.tokens[ai]] = true;
            }
          }
          var inter = Object.keys(seen);
          if (inter.length) {
            msgs.push('Element overlap (our rule) (' + inter.join(', ') + '): ' + getSlotLabel(a.slot) + ' & ' + getSlotLabel(b.slot));
          }
        }
      }
      return { messages: msgs, hasConflict: msgs.length > 0, entries: entries };
    }

    function ncsElementStructureHint(ncsInfo) {
      if (!ncsInfo || !ncsInfo.ncs_slots) return '';
      var sl = ncsInfo.ncs_slots;
      var hasP = sl.indexOf('primary_ele') >= 0;
      var hasS = sl.indexOf('secondary_ele') >= 0;
      var hasB = sl.indexOf('body_ele') >= 0;
      var bits = [];
      if (hasP && hasS) bits.push('primary + secondary element slots');
      else if (hasB && hasS) bits.push('body element + secondary element pair');
      else if (hasB) bits.push('body element');
      if (sl.indexOf('element') >= 0 && /Gadget|Grenade|Shield|RepairKit/i.test(ncsInfo.ncs_id || '')) bits.push('gadget/shield-style element slot');
      return bits.length ? ('NCS: ' + bits.join('; ') + '.') : '';
    }

    function getItemLevel() {
      var el = itemLevelInput || document.getElementById('item-level');
      if (!el) return 60;
      var n = parseInt(el.value, 10);
      if (!Number.isFinite(n)) return 60;
      if (n < 1) return 1;
      if (n > 60) return 60;
      return n;
    }

    /** Weight rows that use 0–1 style probabilities in weapon_part_weight_table (not HypShield scalars). */
    function isProbabilityWeightRow(rowKey) {
      return /^(Barrel_|Body_|Mag_|Grip_|Underbarrel_)/.test(rowKey || '');
    }

    /**
     * Map a part to a weapon_part_weight_table row for sanity checks.
     */
    function mapPartToWeightRow(slotName, nameLower, slug) {
      if (/part_barrel_licensed_ted_combo/.test(nameLower)) return 'Barrel_Mod_Ted_Combo';
      if (/part_barrel_licensed_ted_mirv/.test(nameLower)) return 'Barrel_Mod_Ted_MIRV';
      if (/part_barrel_licensed_ted_shooting/.test(nameLower)) return 'Barrel_Mod_Ted_Shooting';
      if (/part_barrel_licensed_ted_replicator_multi/.test(nameLower)) return 'Barrel_Mod_Ted_Multi';
      if (/part_barrel_licensed_ted/.test(nameLower)) return 'Barrel_Mod_Ted';
      if (/part_barrel_licensed_jak/.test(nameLower)) return 'Barrel_Mod_Jak';
      if (/part_barrel_licensed_hyp/.test(nameLower)) return 'Barrel_Mod_Hyp';
      if (/grip_05b_ted_homing|grip_05c_ted_homing/.test(nameLower)) return 'Grip_Ted_Homing';
      if (/grip_05a_ted_legs/.test(nameLower)) return 'Grip_Ted_Legs';
      if (/grip_05b_ted_jav|grip_05c_ted_jav/.test(nameLower)) return 'Grip_Ted_Javelin';
      if (/grip_04_hyp/.test(nameLower)) return 'Grip_Hyp';
      if (/part_underbarrel_04_atlas/.test(nameLower)) return 'Underbarrel_Atlas';
      if (slotName === 'underbarrel' || slotName.indexOf('underbarrel') >= 0) {
        if (/daedalus|dad|_dad_/.test(nameLower)) return 'Underbarrel_Dad';
        if (/maliwan|_mal_|part_underbarrel.*mal/.test(nameLower)) return 'Underbarrel_Mal';
        return 'Underbarrel_Default';
      }
      if (/part_mag_torgue|mag_torgue/.test(nameLower)) return 'Mag_Torgue';
      if ((slotName === 'mag' || slotName === 'magazine') && /cov/.test(nameLower)) return 'Mag_COV';
      if ((slotName === 'mag' || slotName === 'magazine') && (/borg|bor_/.test(nameLower))) return 'Mag_Borg';
      return null;
    }

    /**
     * LootSchedule MinGameStage gates + weapon_part_weight_table lookups for the current selection.
     */
    function computeScheduleAnalysis(slug, selectedParts) {
      var gates = [];
      var seen = {};
      function addGate(key, reason) {
        if (!LSCHED || LSCHED[key] == null || LSCHED[key] === undefined) return;
        if (seen[key]) return;
        seen[key] = true;
        gates.push({ key: key, min: LSCHED[key], reason: reason || key });
      }

      var s = slug || '';
      var parts = selectedParts || {};

      if (/heavy_weapon/.test(s)) addGate('Gadget_HeavyWeapon', 'item type (heavy)');
      else if (/grenade_gadget/.test(s)) addGate('Gadget_Grenade', 'item type (grenade)');
      if (/repair_kit/.test(s)) addGate('RepKit', 'item type (repair kit)');
      if (/enhancement/.test(s)) {
        addGate('Enhancement', 'item type (enhancement)');
        var rp = parts.rarity;
        if (rp && /comp_05_legendary|legendary/.test(String(rp.name || '').toLowerCase())) {
          addGate('Enhancement_Tier3', 'legendary enhancement (max tier gate)');
        }
      }
      if (/class_mod|classmod/.test(s)) addGate('ClassMod', 'item type (class mod)');

      if (/shield/.test(s)) {
        if (/ripper|borg/.test(s)) addGate('Shield_Borg', 'shield manufacturer');
        else if (/jakobs/.test(s)) addGate('Shield_Jakobs', 'shield manufacturer');
        else if (/maliwan/.test(s)) addGate('Shield_Maliwan', 'shield manufacturer');
        else if (/order/.test(s)) addGate('Shield_Order', 'shield manufacturer');
        else if (/tediore/.test(s)) addGate('Shield_Tediore', 'shield manufacturer');
        else if (/torgue/.test(s)) addGate('Shield_Torgue', 'shield manufacturer');
        else if (/vladof/.test(s)) addGate('Shield_Vladof', 'shield manufacturer');
      }

      if (/pistol|shotgun|ar|smg|sniper|heavy_weapon/.test(s)) {
        if (/ripper|borg/.test(s)) addGate('Manufacturer_Borg', 'weapon manufacturer');
        if (/maliwan/.test(s)) addGate('Manufacturer_Maliwan', 'weapon manufacturer');
        if (/order/.test(s)) addGate('Manufacturer_Order', 'weapon manufacturer');
        if (/tediore/.test(s)) addGate('Manufacturer_Tediore', 'weapon manufacturer');
        if (/torgue/.test(s)) addGate('Manufacturer_Torgue', 'weapon manufacturer');
        var wtc = getWeaponTypeCode(s);
        if (wtc === 'AR') addGate('WeaponType_AssaultRifle', 'weapon type');
        if (wtc === 'SG') addGate('WeaponType_Shotgun', 'weapon type');
        if (wtc === 'SR') addGate('WeaponType_Sniper', 'weapon type');
      }

      Object.keys(parts).forEach(function(slotName) {
        var p = parts[slotName];
        var name = String(p && p.name ? p.name : '').toLowerCase();
        var isEleSlot = /ele|element|payload|bolt|pearl_elem|body_ele|secondary_ele|primary_ele/.test(slotName);
        if (isEleSlot) {
          if (/cryo|cryogenic/.test(name)) addGate('Element_Cryo', 'element part');
          if (/corrosive|corr|acid/.test(name)) addGate('Element_Corrosive', 'element part');
          if (/fire|incend|burn/.test(name)) addGate('Element_Fire', 'element part');
          if (/shock|electr|lightning/.test(name)) addGate('Element_Shock', 'element part');
          if (/radiation|rad/.test(name)) addGate('Element_Radiation', 'element part');
        }

        if (name.indexOf('part_barrel_licensed_jak') >= 0) addGate('LicensedPart_JakobsRicochet', 'licensed Jakobs barrel');
        if (name.indexOf('part_barrel_licensed_hyp') >= 0) addGate('LicensedPart_HyperionGrip', 'licensed Hyperion barrel');
        if (/part_barrel_licensed_ted/.test(name)) addGate('LicensedPart_TedioreReload_Grip', 'licensed Tediore barrel');
        if (name.indexOf('part_barrel_licensed_conglomerate') >= 0) addGate('LicensedPart_JakobsRicochet', 'licensed barrel');

        if (slotName === 'underbarrel' || slotName.indexOf('underbarrel') >= 0) {
          if (/atlas|part_underbarrel_04_atlas/.test(name)) addGate('LicensedPart_Atlas_UB', 'Atlas underbarrel');
          if (/dad|daedalus/.test(name) || (/_dad_|underbarrel_0[12]_dad/.test(name))) addGate('LicensedPart_Daedalus_UB', 'Daedalus underbarrel');
          if (/mal|maliwan/.test(name)) addGate('LicensedPart_Maliwan_UB', 'Maliwan underbarrel');
          if (/tier_?4|tier4|weaponspecific_ub.*tier.*4/.test(name)) addGate('LicensedPart_WeaponSpecific_UB_Tier4', 'weapon UB tier');
          else if (/tier_?3|tier3/.test(name)) addGate('LicensedPart_WeaponSpecific_UB_Tier3', 'weapon UB tier');
          else if (/tier_?2|tier2/.test(name)) addGate('LicensedPart_WeaponSpecific_UB_Tier2', 'weapon UB tier');
          else if (/tier_?1|tier1|tier_?0|tier0|weaponspecific_ub_tier0|_vla_ub/.test(name)) addGate('LicensedPart_WeaponSpecific_UB_Tier1', 'weapon UB tier');
        }

        if (slotName === 'mag' || slotName === 'magazine') {
          if (/torgue|sticky|part_mag_torgue/.test(name)) addGate('LicensedPart_TorgueMag', 'Torgue magazine');
          if (/borg|borgmag/.test(name) && !/torgue/.test(name)) addGate('LicensedPart_BorgMag', 'Borg-style magazine');
        }

        if (/grip_04_hyp|hyp_finnty/.test(name)) addGate('LicensedPart_HyperionGrip', 'Hyperion grip');
        if (/grip_05|ted_legs|ted_homing|ted_jav/.test(name)) addGate('LicensedPart_TedioreReload_Grip', 'Tediore grip');

        if (slotName === 'firmware' || /^part_firmware/.test(name)) addGate('Firmware', 'firmware');

        if (slotName === 'body_armor' || (slotName === 'body' && /armor|reactive/.test(name))) addGate('ShieldType_Armor', 'armor shield body');
      });

      var maxMin = 0;
      for (var gi = 0; gi < gates.length; gi++) {
        if (gates[gi].min > maxMin) maxMin = gates[gi].min;
      }

      var weightHits = [];
      var zeroProbParts = [];
      Object.keys(parts).forEach(function(slotName) {
        var p = parts[slotName];
        var nameLower = String(p && p.name ? p.name : '').toLowerCase();
        var wrow = mapPartToWeightRow(slotName, nameLower, s);
        if (!wrow || !WPWEIGHTS) return;
        var wv = WPWEIGHTS[wrow];
        if (wv === undefined || wv === null) return;
        weightHits.push({ row: wrow, w: wv, slot: slotName, part: p.name });
        if (wv === 0 && isProbabilityWeightRow(wrow)) zeroProbParts.push({ row: wrow, slot: slotName, part: p.name });
      });

      return { gates: gates, maxMinStage: maxMin, weightHits: weightHits, zeroWeightParts: zeroProbParts };
    }

    function getNcsInfo(slug) {
      if (!NMAP || !NMAP.items) return null;
      return NMAP.items[slug] || null;
    }

    function getManifestNameAllowlistForSlot(item, slotName) {
      if (!item || !item.slots) return null;
      var mk = resolveManifestSlotKey(slotName, item);
      if (!mk || !item.slots[mk] || !Array.isArray(item.slots[mk].options)) return null;
      var set = {};
      item.slots[mk].options.forEach(function (o) {
        var n = String((o && o.name) || '').trim().toLowerCase();
        if (n) set[n] = true;
      });
      return Object.keys(set).length ? set : null;
    }

    function getDropCategoryForSlug(slug) {
      if (!slug) return null;
      if (/pistol|shotgun|ar|smg|sniper|heavy_weapon|turret_weapon/.test(slug)) return 'guns';
      if (/shield/.test(slug)) return 'shields';
      if (/grenade|gadget|turret_gadget|terminal_gadget/.test(slug)) return 'grenadesgadgets';
      if (/repair_kit|repkit/.test(slug)) return 'repkits';
      if (/enhancement/.test(slug)) return 'enhancements';
      if (/classmod|class_mod/.test(slug)) return 'classmods';
      return null;
    }

    function detectCategoryFromPool(poolName) {
      var p = String(poolName || '').toLowerCase();
      if (!p) return null;
      if (p.indexOf('itempool_guns') >= 0 || /(dad|jak|ted|tor|ord|vla|bor|mal|atl|cov|hyp)_(ps|sg|ar|sm|sr|hw)/.test(p)) return 'guns';
      if (p.indexOf('shield') >= 0) return 'shields';
      if (p.indexOf('grenade') >= 0 || p.indexOf('gadget') >= 0) return 'grenadesgadgets';
      if (p.indexOf('repkit') >= 0 || p.indexOf('repair_kit') >= 0) return 'repkits';
      if (p.indexOf('enhancement') >= 0) return 'enhancements';
      if (p.indexOf('class_mod') >= 0 || p.indexOf('classmod') >= 0) return 'classmods';
      return null;
    }

    function classifySourcePathway(rowName) {
      var n = String(rowName || '').toLowerCase();
      if (!n) return 'unknown';
      if (/mission|quest|reward|bounty|challenge|objective|mail/.test(n)) return 'reward';
      if (/vendor|vending|shop|chest|crate|world|event|drop_pod|cache|container/.test(n)) return 'other';
      if (/boss|miniboss|badass|chump|normal|enemy|creature|vault|raid|mob/.test(n)) return 'enemy';
      return 'unknown';
    }

    function getSourceEvidence(item) {
      if (item && item.slug && sourceEvidenceCache[item.slug]) return sourceEvidenceCache[item.slug];
      var result = {
        category: null,
        label: '',
        rowsMapped: 0,
        probSum: 0,
        expectedHowMany: null,
        enemy: { rows: [], probSum: 0 },
        reward: { rows: [], probSum: 0 },
        other: { rows: [], probSum: 0 },
        unknown: { rows: [], probSum: 0 }
      };
      var data = typeof ENEMY_DROPS_DATA !== 'undefined' ? ENEMY_DROPS_DATA : null;
      if (!item || !data || !data.rows || !data.rows.length) return result;

      var cat = getDropCategoryForSlug(item.slug);
      if (!cat) return result;
      result.category = cat;
      var labelMap = { guns:'Guns', shields:'Shields', grenadesgadgets:'Grenades/Gadgets', repkits:'Repair Kits', enhancements:'Enhancements', classmods:'Class Mods' };
      result.label = labelMap[cat] || cat;

      var probKeys = { guns:'guns_probability', shields:'shields_probability', grenadesgadgets:'grenadesgadgets_probability', repkits:'repkits_probability', enhancements:'enhancements_probability', classmods:'classmods_probability' };
      var howKeys = {
        guns: 'guns_howmany_expected',
        shields: 'shields_howmany_expected',
        grenadesgadgets: 'grenadesgadgets_howmany_expected',
        repkits: 'repkits_howmany_expected',
        enhancements: 'enhancements_howmany_expected',
        classmods: 'classmods_howmany_expected'
      };
      var distKeys = {
        guns: 'guns_howmany_dist',
        shields: 'shields_howmany_dist',
        grenadesgadgets: 'grenadesgadgets_howmany_dist',
        repkits: 'repkits_howmany_dist',
        enhancements: 'enhancements_howmany_dist',
        classmods: 'classmods_howmany_dist'
      };
      var itempoolKeyByCat = {
        guns: 'itempool_guns_all',
        shields: 'itempool_shields_all',
        grenadesgadgets: 'itempool_gadgets_all',
        repkits: 'itempool_repkit_all',
        enhancements: 'itempool_enhancements_all',
        classmods: 'itempool_class_mods_all'
      };
      var itempoolKey = itempoolKeyByCat[cat];
      var allowedRowSet = null;
      if (IPDROPROWS && itempoolKey && IPDROPROWS[itempoolKey] && IPDROPROWS[itempoolKey][cat] && IPDROPROWS[itempoolKey][cat].length) {
        allowedRowSet = new Set(IPDROPROWS[itempoolKey][cat]);
      }

      var probKey = probKeys[cat];
      var howKey = howKeys[cat];
      var distKey = distKeys[cat];
      for (var i = 0; i < data.rows.length; i++) {
        var r = data.rows[i];
        if (allowedRowSet && allowedRowSet.size && !allowedRowSet.has(r.name)) continue;
        var p = probKey ? r[probKey] : null;
        if (!(typeof p === 'number' && Number.isFinite(p)) || p <= 0) continue;
        result.rowsMapped++;
        result.probSum += p;
        var how = howKey ? r[howKey] : null;
        var dist = distKey ? r[distKey] : null;
        if (typeof how === 'number' && Number.isFinite(how)) {
          if (result.expectedHowMany == null) result.expectedHowMany = 0;
          result.expectedHowMany += p * how;
        }
        var pathway = classifySourcePathway(r.name);
        if (!result[pathway]) pathway = 'unknown';
        result[pathway].probSum += p;
        result[pathway].rows.push({ name: r.name, prob: p, how: how, dist: dist });
      }

      // Enrich with explicit non-enemy source lineage from extracted NCS references.
      if (SPATHS && SPATHS.by_category && SPATHS.by_category[cat]) {
        var cinfo = SPATHS.by_category[cat];
        var rewardRefs = (cinfo.reward_refs || []).slice(0, 80);
        var rewardIds = (cinfo.reward_ids || []).slice(0, 80);
        var shiftIds = (cinfo.shift_ids || []).slice(0, 40);
        var lootConfigs = (cinfo.loot_configs || []).slice(0, 120);
        var vendingEntries = (cinfo.vending_entries || []).slice(0, 120);
        var vaultCardEntries = (cinfo.vault_card_entries || []).slice(0, 40);

        for (var rr = 0; rr < rewardRefs.length; rr++) {
          result.reward.rows.push({ name: 'Reward row: ' + rewardRefs[rr], prob: null, how: null, dist: null });
        }
        for (var ri = 0; ri < rewardIds.length; ri++) {
          result.reward.rows.push({ name: 'Reward id: ' + rewardIds[ri], prob: null, how: null, dist: null });
        }
        for (var si = 0; si < shiftIds.length; si++) {
          result.reward.rows.push({ name: 'SHiFT: ' + shiftIds[si], prob: null, how: null, dist: null, obtainVia: 'SHiFT' });
        }
        for (var li = 0; li < lootConfigs.length; li++) {
          result.other.rows.push({ name: 'Loot config: ' + lootConfigs[li], prob: null, how: null, dist: null });
        }
        for (var vi = 0; vi < vendingEntries.length; vi++) {
          result.other.rows.push({ name: 'Vendor: ' + vendingEntries[vi], prob: null, how: null, dist: null });
        }
        for (var vci = 0; vci < vaultCardEntries.length; vci++) {
          result.other.rows.push({ name: 'Vault Card: ' + vaultCardEntries[vci], prob: null, how: null, dist: null, obtainVia: 'Vault Card' });
        }
      }
      if (item && item.slug) sourceEvidenceCache[item.slug] = result;
      return result;
    }

    function computeDataFingerprint() {
      var bits = [];
      bits.push('Manifest items: ' + (M && M.items ? Object.keys(M.items).length : 0));
      bits.push('Enemy rows: ' + ((typeof ENEMY_DROPS_DATA !== 'undefined' && ENEMY_DROPS_DATA && ENEMY_DROPS_DATA.rows) ? ENEMY_DROPS_DATA.rows.length : 0));
      bits.push('ItemPoolList maps: ' + (IPDROPROWS ? Object.keys(IPDROPROWS).length : 0));
      bits.push('Source map pools: ' + (SPATHS && SPATHS.by_itempool ? Object.keys(SPATHS.by_itempool).length : 0));
      bits.push('LootSchedule keys: ' + (LSCHED ? Object.keys(LSCHED).length : 0));
      bits.push('Part weight rows: ' + (WPWEIGHTS ? Object.keys(WPWEIGHTS).length : 0));
      if (SPATHS && SPATHS.generated_at) bits.push('Source data generated: ' + SPATHS.generated_at);
      return bits.join(' | ');
    }

    /** Spawn prefixes: MFR_TYP (e.g. DAD_AR, BOR_TB); short codes (TB, TWC, WTC, CM_DS); optional digits. */
    function isValidSpawnPrefixForAudit(slug, pref) {
      var p = String(pref || '').trim().toUpperCase();
      if (!p) return false;
      if (SLUG_TO_PREFIX[slug]) return true;
      /* MFR_TYP: 2–4 char manufacturer + _ + 2 char type (covers DAD_PS, GEN_SH, BOR_TB, DAD_TC) */
      if (/^[A-Z0-9]{2,4}_[A-Z0-9]{2}$/.test(p)) return true;
      /* Standalone short codes used by terminals, turret weapons, class mods, etc. */
      if (/^[A-Z0-9]{2,5}$/.test(p)) return true;
      return false;
    }

    function computePrefixAudit() {
      var issues = [];
      var allItems = getAllItems();
      for (var i = 0; i < allItems.length; i++) {
        var slug = allItems[i].slug;
        var pref = buildSlugPrefix(slug);
        if (!isValidSpawnPrefixForAudit(slug, pref)) issues.push('Invalid prefix format: ' + slug + ' => ' + (pref || '(empty)'));
      }
      if (SPATHS && SPATHS.by_itempool) {
        var pools = Object.keys(SPATHS.by_itempool);
        for (var j = 0; j < pools.length; j++) {
          var p = pools[j];
          var cat = detectCategoryFromPool(p);
          if (!cat) continue;
          var hasAny = allItems.some(function(it) { return getDropCategoryForSlug(it.slug) === cat; });
          if (!hasAny) {
            issues.push('Pool category has no item slug category match: ' + p + ' (' + cat + ')');
          }
        }
      }
      return {
        issueCount: issues.length,
        examples: issues.slice(0, 10)
      };
    }

    function updateDataHealthPanel() {
      if (!dataHealthEl) return;
      var fp = computeDataFingerprint();
      var audit = computePrefixAudit();
      var catRows = [];
      var cats = ['guns', 'shields', 'grenadesgadgets', 'repkits', 'enhancements', 'classmods'];
      for (var i = 0; i < cats.length; i++) {
        var c = cats[i];
        var info = SPATHS && SPATHS.by_category ? (SPATHS.by_category[c] || {}) : {};
        var e = (info.enemy_rows || []).length;
        var r = (info.reward_ids || []).length;
        var s = (info.shift_ids || []).length;
        var v = (info.vault_card_entries || []).length;
        var o = ((info.loot_configs || []).length + (info.vending_entries || []).length);
        catRows.push('<span class="health-chip">' + c + ' E:' + e + ' R:' + r + (s ? ' S:' + s : '') + (v ? ' V:' + v : '') + ' O:' + o + '</span>');
      }
      var html = '';
      html += '<div class="drop-sources-title">Data Health</div>';
      html += '<div class="health-row">' + escapeHtml(fp) + '</div>';
      html += '<div class="health-row">' + catRows.join('') + '</div>';
      html += '<div class="health-row">Prefix audit: <strong style="color:' + (audit.issueCount ? '#ffb347' : '#00ffc8') + ';">' + (audit.issueCount ? (audit.issueCount + ' issue(s)') : 'No obvious issues') + '</strong></div>';
      if (audit.examples.length) {
        html += '<details><summary>Prefix audit examples</summary><div style="margin-top:6px;">' + audit.examples.map(function(x) { return '<div style="padding:2px 0;">' + escapeHtml(x) + '</div>'; }).join('') + '</div></details>';
      }
      dataHealthEl.innerHTML = html;
    }

    function updateDropSources() {
      if (!dropSourcesEl) return;
      if (!selectedItem) {
        dropSourcesEl.innerHTML = '';
        return;
      }
      var ev = getSourceEvidence(selectedItem);
      if (!ev.rowsMapped) {
        dropSourcesEl.innerHTML = '';
        return;
      }
      function escapeAttr(s) { return escapeHtml(String(s)).replace(/"/g, '&quot;'); }
      function renderPathway(pathLabel, rows, obtainVia) {
        if (!rows || !rows.length) return '';
        var chips = [];
        for (var ri = 0; ri < rows.length; ri++) {
          var r = rows[ri];
          var hasProb = (typeof r.prob === 'number' && Number.isFinite(r.prob));
          var pct = hasProb ? Math.round(r.prob * 100) : null;
          if (hasProb && pct <= 0) continue;
          var how = r.how;
          var dist = r.dist;
          var titleParts = [];
          var via = (r && r.obtainVia) || obtainVia;
          if (via) titleParts.push('Obtainable via: ' + via);
          if (how != null && typeof how === 'number' && Number.isFinite(how)) {
            titleParts.push('E[how-many] = ' + how.toFixed(2));
          }
          if (dist && dist.chances && Array.isArray(dist.chances)) {
            var chanceParts = dist.chances
              .filter(function(c) { return typeof c.chance === 'number' && typeof c.value === 'number' && Number.isFinite(c.chance) && Number.isFinite(c.value); })
              .slice(0, 4)
              .map(function(c) { return c.value + ' @ ' + Math.round(c.chance * 100) + '%'; });
            if (chanceParts.length) titleParts.push('dist: ' + chanceParts.join(', '));
            if (dist.defaultValue != null && typeof dist.defaultValue === 'number' && dist.defaultChance != null && typeof dist.defaultChance === 'number') {
              titleParts.push('default: ' + dist.defaultValue + ' @ ' + Math.round(dist.defaultChance * 100) + '%');
            }
          }
          var title = titleParts.length ? titleParts.join(' | ') : '';
          var titleAttr = title ? (' title="' + escapeAttr(title) + '"') : '';
          var chipHow = (how != null && typeof how === 'number' && Number.isFinite(how)) ? (' ~' + how.toFixed(2)) : '';
          var suffix = hasProb ? (' (' + pct + '%)' + chipHow) : '';
          chips.push('<span class="drop-source-chip"' + titleAttr + '>' + escapeHtml(r.name) + suffix + '</span>');
        }
        if (!chips.length) return '';
        return '<div class="drop-sources-title" style="margin-top:6px;">' + pathLabel + '</div>' + chips.join('');
      }

      var html = '<div class="drop-sources-title">Obtainable Sources (' + escapeHtml(ev.label) + ')</div>';
      html += renderPathway('Enemy drops', ev.enemy.rows, 'Enemy drop');
      html += renderPathway('Rewards / mission-like', ev.reward.rows, 'Reward / mission');
      html += renderPathway('Other sources (vendor/chest/world/event)', ev.other.rows, 'Vendor / loot / world');
      html += renderPathway('Unclassified mapped rows', ev.unknown.rows, null);

      var proofBits = [];
      if (ev.probSum > 0) proofBits.push('Prob sum: ' + ev.probSum.toFixed(3));
      if (ev.expectedHowMany != null) proofBits.push('E[how-many]: ' + ev.expectedHowMany.toFixed(2));
      proofBits.push('Mapped rows: ' + ev.rowsMapped);
      proofBits.push('Enemy:' + ev.enemy.rows.length + ' Reward:' + ev.reward.rows.length + ' Other:' + ev.other.rows.length);
      html += '<div style="margin-top:6px;font-size:0.72rem;color:rgba(233,254,255,0.38);line-height:1.4;">' + proofBits.join(' | ') + '</div>';
      dropSourcesEl.innerHTML = html;
    }

    function populateItemTypes() {
      itemSelect.innerHTML = '<option value="">-- Select Item Type --</option>';
      var allItems = getAllItems();
      for (var i = 0; i < allItems.length; i++) {
        var item = allItems[i];
        var opt = document.createElement('option');
        opt.value = item.slug;
        var ncsInfo = getNcsInfo(item.slug);
        var slotHint = ncsInfo ? ' [' + ncsInfo.ncs_slot_count + ' slots]' : ' [' + item.slot_count + ' slots]';
        opt.textContent = item.name + slotHint;
        itemSelect.appendChild(opt);
      }
    }

    var __slotPreviewRefreshTimer = null;
    function scheduleLegitSlotOptionValidityRefresh() {
      if (typeof window.__stxRefreshLegitSlotOptionValidity !== 'function') return;
      if (__slotPreviewRefreshTimer) clearTimeout(__slotPreviewRefreshTimer);
      __slotPreviewRefreshTimer = setTimeout(function() {
        __slotPreviewRefreshTimer = null;
        try { window.__stxRefreshLegitSlotOptionValidity(); } catch (_) {}
      }, 35);
    }

    function categorizePreviewReason(reasonText) {
      var s = String(reasonText || '').toLowerCase();
      if (s.indexOf('allowlist') >= 0) return 'ALLOWLIST';
      if (s.indexOf('exclusion tag') >= 0 || s.indexOf('exclusion') >= 0) return 'EXCLUSION';
      if (s.indexOf('dependency tag') >= 0 || s.indexOf('dependency') >= 0) return 'DEPENDENCY';
      if (s.indexOf('rarity') >= 0 || s.indexOf('pool') >= 0) return 'POOL/RARITY';
      return 'RULE';
    }

    function formatPreviewReasonsForTooltip(reasons) {
      if (!reasons || !reasons.length) return 'RULE: mismatch';
      return reasons.map(function(r) {
        return '[' + categorizePreviewReason(r) + '] ' + String(r);
      }).join('; ');
    }

    /* UI helper: mark dropdown options as ✓/✗ based on inv tag validity
       against a global addtag pool from currently selected parts. */
    window.__stxRefreshLegitSlotOptionValidity = function () {
      try {
        var inv = typeof window !== 'undefined' ? window.INV_COMP_TAG_DATA : null;
        var TC = typeof window !== 'undefined' ? window.TagCompValidation : null;
        if (!inv || !inv.partsByName || !TC) return;
        var partsByName = inv.partsByName;
        var ncsInfo = selectedItem ? getNcsInfo(selectedItem.slug) : null;
        var ncsSlotsP = ncsInfo && ncsInfo.ncs_slots ? ncsInfo.ncs_slots : null;
        var rpSel = selectedParts && selectedParts.rarity;
        var compNameSel = effectiveRarityCompKey(rpSel);
        var compKeyNormSel = compNameSel ? compNameSel.replace(/^base_comp_/i, 'comp_') : null;
        var skipUniqueExclPreview = !!(compKeyNormSel && /^comp_0[1-6]_/i.test(compKeyNormSel));
        var skipRarityPoolMatchPreview = false;
        var compSlotRules = inv.compSlotRules || {};
        var previewCompRules = null;
        if (compNameSel && selectedItem && !slugSkipsInvCompSlotRules(selectedItem.slug, selectedItem)) {
          var previewRulesKey = compNameSel;
          var slugForPreview = String(selectedItem.slug || '');
          var isWeaponSlugForPreview = /_(?:pistol|ar|smg|shotgun|sniper|hw|heavy_weapon)$/i.test(slugForPreview);
          if (compKeyNormSel && isWeaponSlugForPreview) {
            var baseTry = 'base_' + compKeyNormSel;
            if (compSlotRules[baseTry]) previewRulesKey = baseTry;
          }
          previewCompRules = compSlotRules[previewRulesKey] || null;
        }

        var selects = slotsContainer ? slotsContainer.querySelectorAll('select[data-slot]') : [];
        for (var si = 0; si < selects.length; si++) {
          var sel = selects[si];
          var slotNameUi = String((sel && sel.dataset && sel.dataset.slot) || '').toLowerCase();
          var slotBaseUi = slotBaseKey(slotNameUi);
          var manifestSlotUi = String((sel && sel.dataset && sel.dataset.manifestSlot) || '').toLowerCase();
          var pool;
          if (slotBaseUi === 'rarity') {
            pool = new Set();
            try {
              if (compNameSel && inv.compBasetags && inv.compBasetags[compNameSel]) {
                TC.formatTags(inv.compBasetags[compNameSel]).forEach(function (t) { pool.add(t); });
              }
              var cnOrangeP = compKeyNormSel || compNameSel;
              if (cnOrangeP && (/^comp_05_legendary/i.test(cnOrangeP) || /^comp_06_|pearlescent|_pearlescent/i.test(compNameSel) || /^comp_0[1-4]_(?:common|uncommon|rare|epic)_[a-z0-9_]+$/i.test(cnOrangeP))) {
                pool.add('unique');
                if (!pool.has('legendary') && (/legendary|pearlescent|comp_06|_pearlescent/i.test(compNameSel))) pool.add('legendary');
              }
              (function seedRarityFromCompKeyUi(cn, p) {
                if (!cn) return;
                var c = String(cn).trim().toLowerCase();
                var tier = c.match(/^comp_0([1-4])_(common|uncommon|rare|epic)(?:$|_)/i);
                if (tier) p.add(tier[2].toLowerCase());
                else if (/^comp_05_legendary/i.test(c) || /^comp_06_/i.test(c) || /pearlescent/i.test(c)) {
                  p.add('unique'); p.add('legendary');
                } else if (/^comp_0[1-4]_(common|uncommon|rare|epic)_/i.test(c)) {
                  p.add('unique');
                  var nt = c.match(/^comp_0[1-4]_(common|uncommon|rare|epic)_/i);
                  if (nt) p.add(nt[1].toLowerCase());
                }
              })(compKeyNormSel || compNameSel, pool);
              var mLegR = String(compNameSel || '').match(/^(?:base_)?comp_05_legendary_([a-z0-9_]+)$/i);
              if (mLegR && mLegR[1]) addNamedLegendaryFamilyTagsToPool(mLegR[1], pool);
            } catch (_) {}
            Object.keys(selectedParts || {}).forEach(function (sk) {
              var p = selectedParts[sk];
              if (!p || !p.name || slotBaseKey(sk) === 'rarity') return;
              var metaR = resolveInvPartMeta(partsByName, p);
              if (!metaR) return;
              TC.formatTags(metaR.addtags).forEach(function (t) { pool.add(t); });
            });
          } else {
            pool = buildSyntheticTagPoolFromSelection(selectedParts, inv, ncsSlotsP, slotBaseUi);
          }

          var opts = sel && sel.options ? sel.options : [];
          for (var oi = 0; oi < opts.length; oi++) {
            var o = opts[oi];
            if (!o || !o.value) continue; /* skip placeholder */
            if (!o.dataset) continue;
            if (!o.dataset.baseText) o.dataset.baseText = o.textContent || '';
            var nm = String(o.dataset.name || '').trim().toLowerCase();
            var optInvKey = String((o.dataset && o.dataset.invKey) || '').trim().toLowerCase();
            var optIdx = parseInt(String(o.value || ''), 10);
            var cand = { name: nm, invDumpKey: optInvKey || null, index: Number.isFinite(optIdx) ? optIdx : null };
            if ((!cand.invDumpKey || !cand.name) && selectedItem && manifestSlotUi && selectedItem.slots && selectedItem.slots[manifestSlotUi] && selectedItem.slots[manifestSlotUi].options) {
              var srcOpts = selectedItem.slots[manifestSlotUi].options;
              for (var so = 0; so < srcOpts.length; so++) {
                var src = srcOpts[so];
                if (!src) continue;
                if (Number.isFinite(cand.index) && Number(src.index) !== cand.index) continue;
                cand.name = cand.name || String(src.name || '').trim().toLowerCase();
                cand.invDumpKey = cand.invDumpKey || String(src.invDumpKey || src.inv_dump_key || src.inv_key || '').trim().toLowerCase();
                break;
              }
            }
            var metaO = resolveInvPartMeta(partsByName, cand);
            if (!metaO && slotBaseUi === 'rarity' && (cand.invDumpKey || cand.name)) {
              metaO = { addtags: [], dependencytags: [], exclusiontags: [] };
            }
            if (!metaO) {
              o.textContent = o.dataset.baseText;
              o.disabled = false;
              var dbgKeys = buildInvLookupDebugKeys(cand);
              o.title = 'No inv-tag rule for this part row in current bundle.'
                + (dbgKeys.length ? (' Tried keys: ' + dbgKeys.join(', ')) : '');
              continue;
            }
            var skipExTags = [];
            var pnl = String(nm || '').toLowerCase();
            if (pnl.indexOf('secondbarrel') >= 0 || pnl.indexOf('underbarrel_07') >= 0) skipExTags.push('barrel_01');
            if (skipExTags.indexOf('barrel_01') < 0 && metaO.exclusiontags) {
              var exf = TC.formatTags(metaO.exclusiontags);
              if (exf.indexOf('barrel_01') >= 0 && slotBaseUi === 'underbarrel') skipExTags.push('barrel_01');
            }
            var v = TC.partValidForPool(metaO, pool, {
              skipRarityPoolMatch: skipRarityPoolMatchPreview,
              skipUniqueExclusion: skipUniqueExclPreview,
              skipExclusionTags: skipExTags.length ? skipExTags : undefined
            });
            var pearlMismatch = false;
            if (v.ok && (slotBaseUi === 'pearl_elem' || slotBaseUi === 'pearl_stat')) {
              if (!isPearlRarityCompName(compNameSel)) {
                pearlMismatch = true;
                v = { ok: false, reasons: ['pearl-only slot requires pearlescent rarity comp'] };
              }
            }
            /* Keep dropdown ✓/✗ aligned with final validator: comp allowlist mismatches are invalid. */
            if (v.ok && previewCompRules) {
              var compSlotPrev = MANIFEST_SLOT_TO_COMP_SLOT[slotBaseUi] || slotBaseUi;
              var slotRulePrev = previewCompRules[compSlotPrev];
              if (slotRulePrev && slotRulePrev.parts && slotRulePrev.parts.length > 0) {
                var partNormPrev = String(nm).toLowerCase().trim();
                var partBasePrev = partNormPrev.indexOf('.') >= 0 ? partNormPrev.split('.').pop() : partNormPrev;
                var wildcardPrev = slotRulePrev.parts.indexOf(compSlotPrev) >= 0 ||
                  slotRulePrev.parts.some(function (a) { return String(a).toLowerCase().trim() === compSlotPrev; });
                if (!wildcardPrev) {
                  var inListPrev = slotRulePrev.parts.some(function (allow) {
                    var a = String(allow).toLowerCase().trim();
                    if (a === compSlotPrev) return true;
                    return partNormPrev === a ||
                      partBasePrev === a ||
                      partNormPrev.indexOf(a) >= 0 ||
                      (partNormPrev.indexOf('.') >= 0 && partNormPrev.endsWith('.' + a)) ||
                      (partNormPrev.indexOf('.') >= 0 && a.indexOf('.') >= 0 && partNormPrev.endsWith(a));
                  });
                  if (!inListPrev) v = { ok: false, reasons: ['comp allowlist mismatch for ' + compSlotPrev] };
                }
              }
            }
            if (v.ok) {
              o.textContent = '✓ ' + o.dataset.baseText;
              o.disabled = false;
              o.title = 'Pass preview checks for current build state.';
            } else {
              o.textContent = '✗ ' + o.dataset.baseText;
              o.disabled = pearlMismatch ? true : !!strictMode;
              o.title = 'Will fail now: ' + formatPreviewReasonsForTooltip(v.reasons || []);
              if (strictMode && sel.value === String(o.value)) {
                sel.value = '';
                delete selectedParts[slotNameUi];
                updateOutput();
                updateValidation();
                updateItemStats();
                updateStatEffects();
                updateDropSources();
                updateProofEvidence();
              }
            }
          }
        }
      } catch (_e) {}
    };

    function renderSlots(item) {
      slotsContainer.innerHTML = '';
      selectedParts = {};
      var ncsInfo = getNcsInfo(item.slug);
      var ncsSlots = ncsInfo ? ncsInfo.ncs_slots : [];
      var manifestSlots = Object.keys(item.slots);

      var allSlots = [];
      var seen = {};
      var manifestSlotOrder = [
        /* NCS weapon order: body → body accessories/visual → barrel → barrel acc (matches serial / engine). */
        'rarity',
        'body',
        'body_acc','body_ele','body_mag','body_bolt','body_energy','body_armor',
        'barrel','barrel_acc',
        'hyperion_secondary_acc','shield',
        'mag','magazine_acc','magazine_ted_thrown',
        'scope','scope_acc',
        'grip','foregrip',
        'underbarrel','underbarrel_acc',
        'secondary_ammo','secondary_ele',
        'multi',
        'firmware','payload','payload_augment','stat_augment','primary_augment','secondary_augment','active_augment','enemy_augment','core_augment','curative','turret_weapon',
        'endgame','pearl_elem','pearl_stat',
        'unique','secondary','unknown','class_mod','class_mod_body','stat','stat2','stat3','stat_group1','stat_group2','stat_group3'
      ];
      function pushUniqueSlot(arr, slotName, hasManifest) {
        if (!slotName || seen[slotName]) return;
        arr.push({ name: slotName, hasManifest: !!hasManifest });
        seen[slotName] = true;
      }
      if (ncsSlots.length) {
        for (var k = 0; k < ncsSlots.length; k++) {
          var ns = ncsSlots[k];
          var key = resolveManifestSlotKey(ns, item);
          if (key) {
            pushUniqueSlot(allSlots, key, true);
            seen[ns] = true; /* mark alias as represented */
          } else if (item.slots[ns]) {
            pushUniqueSlot(allSlots, ns, true);
          } else {
            /* Keep NCS-only slot placeholders only when part data exists for it. */
            if (NPARTS && Array.isArray(NPARTS[ns]) && NPARTS[ns].length) {
              pushUniqueSlot(allSlots, ns, false);
            }
          }
        }
      }
      for (var i = 0; i < manifestSlotOrder.length; i++) {
        var sn = manifestSlotOrder[i];
        if (item.slots[sn] && !seen[sn]) pushUniqueSlot(allSlots, sn, true);
      }
      for (var j = 0; j < manifestSlots.length; j++) {
        if (!seen[manifestSlots[j]]) pushUniqueSlot(allSlots, manifestSlots[j], true);
      }

      var ncsOnly = [];
      for (var k = 0; k < ncsSlots.length; k++) {
        var ns = ncsSlots[k];
        if (seen[ns]) continue;
        ncsOnly.push({ name: ns, hasManifest: false });
        seen[ns] = true;
      }

      var grouped = {};
      for (var g = 0; g < CAT_ORDER.length; g++) grouped[CAT_ORDER[g]] = [];
      allSlots.forEach(function(s) { var c = getSlotCategory(s.name); if (!grouped[c]) grouped[c] = []; grouped[c].push(s); });
      ncsOnly.forEach(function(s) { var c = getSlotCategory(s.name); if (!grouped[c]) grouped[c] = []; grouped[c].push(s); });

      /* Within each category, keep a stable build order: rarity → body → barrel → … */
      var orderIndex = Object.create(null);
      for (var oi = 0; oi < manifestSlotOrder.length; oi++) orderIndex[manifestSlotOrder[oi]] = oi;
      Object.keys(grouped).forEach(function (cat) {
        grouped[cat].sort(function (a, b) {
          var aa = orderIndex[a.name];
          var bb = orderIndex[b.name];
          if (aa == null) aa = 9999;
          if (bb == null) bb = 9999;
          if (aa !== bb) return aa - bb;
          return String(a.name).localeCompare(String(b.name));
        });
      });

      /* Flat NCS order: matches Nexus / serial (body → body_acc → barrel → barrel_acc → mag → …). Category grouping alone put every "core" slot before all accessories. */
      var orderedNcsFlat = null;
      if (ncsSlots.length) {
        var byName = Object.create(null);
        allSlots.forEach(function(s) { byName[s.name] = s; });
        ncsOnly.forEach(function(s) { if (!byName[s.name]) byName[s.name] = s; });
        orderedNcsFlat = [];
        var pushedOrd = Object.create(null);
        function pushNcsOrd(entry) {
          if (!entry || pushedOrd[entry.name]) return;
          pushedOrd[entry.name] = true;
          orderedNcsFlat.push(entry);
        }
        if (item.slots.rarity) {
          if (byName.rarity) pushNcsOrd(byName.rarity);
          else pushNcsOrd({ name: 'rarity', hasManifest: true });
        }
        for (var ordK = 0; ordK < ncsSlots.length; ordK++) {
          var ncsN = ncsSlots[ordK];
          var manK = resolveManifestSlotKey(ncsN, item);
          if (manK && byName[manK]) pushNcsOrd(byName[manK]);
          else if (byName[ncsN]) pushNcsOrd(byName[ncsN]);
        }
        allSlots.forEach(function(s) { pushNcsOrd(s); });
        ncsOnly.forEach(function(s) { pushNcsOrd(s); });
      }

      var rendered = 0;
      var slotListsToWalk = [];
      if (orderedNcsFlat && orderedNcsFlat.length) {
        for (var wi = 0; wi < orderedNcsFlat.length; wi++) slotListsToWalk.push({ flat: true, slotInfo: orderedNcsFlat[wi] });
      } else {
        for (var ci = 0; ci < CAT_ORDER.length; ci++) {
          var cat = CAT_ORDER[ci];
          var slots = grouped[cat];
          if (!slots || !slots.length) continue;
          slotListsToWalk.push({ flat: false, cat: cat, slots: slots });
        }
      }

      if (orderedNcsFlat && orderedNcsFlat.length) {
        var ncsOrderHint = document.createElement('div');
        ncsOrderHint.className = 'slot-section-label cat-core';
        ncsOrderHint.style.fontSize = '0.72rem';
        ncsOrderHint.style.letterSpacing = '0.04em';
        ncsOrderHint.textContent = 'Slot order: Nexus (NCS) — same sequence as body \u2192 body accessories \u2192 barrel \u2192 barrel accessories \u2192 mag \u2192 scope \u2026';
        slotsContainer.appendChild(ncsOrderHint);
      }

      for (var walkIdx = 0; walkIdx < slotListsToWalk.length; walkIdx++) {
        var witem = slotListsToWalk[walkIdx];
        if (!witem.flat) {
          var sectionLabelGrp = document.createElement('div');
          sectionLabelGrp.className = 'slot-section-label ' + CAT_CSS[witem.cat];
          sectionLabelGrp.textContent = CAT_LABELS[witem.cat] + ' (' + witem.slots.length + ')';
          slotsContainer.appendChild(sectionLabelGrp);
        }

        var innerSlots = witem.flat ? [witem.slotInfo] : witem.slots;
        for (var si = 0; si < innerSlots.length; si++) {
          var slotInfo = innerSlots[si];
          var slotName = slotInfo.name;
          /* body_bolt options are merged into Body Accessory above; do not render a second dropdown. */
          if (slotName === 'body_bolt') continue;
          var hasData = slotInfo.hasManifest;
          var slotId = slotName.replace(/[^a-z0-9]/g, '_');
          var div = document.createElement('div');
          div.className = 'slot-card' + (hasData ? '' : ' ncs-only');

          if (hasData) {
            var manifestKey = resolveManifestSlotKey(slotName, item);
            if (!manifestKey || !item.slots[manifestKey]) { div.className = 'slot-card ncs-only'; hasData = false; }
          }

          if (hasData) {
            var slot = item.slots[manifestKey || slotName];
            var options = slot.options.slice().filter(function (o) { return !isEleControlPlaceholderPartName(o && o.name); });
            var isRarity = (slotName === 'rarity' || manifestKey === 'rarity');
            var slugLc = String((item && item.slug) || '').toLowerCase();
            var isWeaponSlug = /_(?:pistol|ar|smg|shotgun|sniper|hw|heavy_weapon)$/i.test(slugLc);
            /* For non-weapon gear, manifest in_pool flags are often incomplete; keep full options visible. */
            /* For weapons, still keep strict pool filtering except known noisy rows (rarity/barrels). */
            var skipInPoolFilter = !isWeaponSlug || isRarity || slotName === 'barrel' || slotName === 'barrel_acc' || manifestKey === 'barrel' || manifestKey === 'barrel_acc';
            if (!skipInPoolFilter) options = options.filter(function(o) { return o.in_pool === true; });
            /* NCS alignment: exclude accessory parts from main slot dropdowns (body_acc from body, barrel_acc from barrel). */
            if (isWeaponSlug && NPARTS && (slotName === 'body' || manifestKey === 'body')) {
              var bodyAccNames = (NPARTS.body_acc || []).reduce(function(set, p) { set[(p.name || '').toLowerCase()] = true; return set; }, {});
              var bodyBoltNames = (NPARTS.body_bolt || []).reduce(function(set, p) { set[(p.name || '').toLowerCase()] = true; return set; }, {});
              options = options.filter(function(o) {
                var on = String(o.name || '').toLowerCase();
                /* Never hide the canonical body row. */
                if (on === 'part_body' || on === 'body') return true;
                return !bodyAccNames[on] && !bodyBoltNames[on];
              });
            }
            /* Merge manifest body_bolt options into Body Accessory (NCS splits bolt; UI uses one accessory list). */
            if (item && item.slots && (slotName === 'body_acc' || manifestKey === 'body_acc')) {
              var boltMk = resolveManifestSlotKey('body_bolt', item);
              if (boltMk && item.slots[boltMk] && item.slots[boltMk].options && item.slots[boltMk].options.length) {
                var boltOpts = item.slots[boltMk].options.slice();
                var seenMerge = {};
                options.forEach(function(o) { seenMerge[String(o.name || '').toLowerCase()] = true; });
                for (var bi = 0; bi < boltOpts.length; bi++) {
                  var bo = boltOpts[bi];
                  var bn = String(bo.name || '').toLowerCase();
                  if (bn && !seenMerge[bn]) {
                    seenMerge[bn] = true;
                    options.push(bo);
                  }
                }
              }
              // Keep element controls in the dedicated element slot(s), not Body Accessory.
              var hasElementSlot = !!(
                item.slots.body_ele || item.slots.element || item.slots.primary_ele || item.slots.secondary_ele || item.slots.pearl_elem ||
                (ncsInfo && Array.isArray(ncsInfo.ncs_slots) && ncsInfo.ncs_slots.some(function (s) { return /(^|_)(ele|element)$/.test(String(s || '').toLowerCase()) || /^(body_ele|primary_ele|secondary_ele|pearl_elem)$/.test(String(s || '').toLowerCase()); }))
              );
              if (hasElementSlot) {
                options = options.filter(function (o) {
                  return !isElementLikePartName(o && o.name);
                });
              }
            }
            if (isRarity) {
              var extraRarity = getExtraRarityOptions(item, options);
              if (extraRarity.length) options = options.concat(extraRarity);
            }
            if (options.length === 0) continue;
            if (isRarity) options.forEach(function(o) { o.in_pool = true; });
            options.sort(function(a, b) { return (a.index - b.index) || String(a.name).localeCompare(b.name); });
            rendered++;
            var labelText = getSlotDisplayLabel(slotName);
            div.innerHTML = '<label for="slot_' + slotId + '">' + escapeHtml(labelText) + ' <span style="opacity:0.45;font-weight:400;">(' + options.length + ')</span></label>'
              + '<select id="slot_' + slotId + '" data-slot="' + slotName + '" data-manifest-slot="' + (manifestKey || slotName) + '">'
              + '<option value="">\u2014 None \u2014</option>'
              + options.map(function(o) {
                  var poolMark = o.in_pool === true ? 'In pool — ' : 'Off-pool — ';
                  var invDumpKey = String(o.invDumpKey || o.inv_dump_key || o.inv_key || '').trim();
                  return '<option value="' + o.index + '" data-name="' + escapeHtml(o.name) + '" data-inv-key="' + escapeHtml(invDumpKey) + '" data-in-pool="' + (o.in_pool === true) + '">[' + o.index + '] ' + poolMark + formatPartName(o.name) + '</option>';
                }).join('')
              + '</select>';
            div.querySelector('select').addEventListener('change', function(e) {
              var sel = e.target;
              var opt = sel.options[sel.selectedIndex];
              var sn = sel.dataset.slot;
              if (strictMode && opt && opt.value && String(opt.dataset.inPool) === 'false') {
                sel.value = '';
                delete selectedParts[sn];
                updateOutput();
                updateValidation();
                updateItemStats();
                updateStatEffects();
                updateDropSources();
                updateProofEvidence();
                scheduleLegitSlotOptionValidityRefresh();
                return;
              }
              if (strictMode && opt && opt.disabled && opt.value) {
                sel.value = '';
                delete selectedParts[sn];
                updateOutput();
                updateValidation();
                updateItemStats();
                updateStatEffects();
                updateDropSources();
                updateProofEvidence();
                scheduleLegitSlotOptionValidityRefresh();
                return;
              }
              if (opt.value) {
                selectedParts[sn] = {
                  index: parseInt(opt.value, 10),
                  name: opt.dataset.name,
                  invDumpKey: String(opt.dataset.invKey || '').trim() || null,
                  in_pool: opt.dataset.inPool === 'true',
                  slot: sn
                };
              } else {
                delete selectedParts[sn];
              }
              updateOutput();
              updateValidation();
              updateItemStats();
              updateStatEffects();
              updateDropSources();
              updateProofEvidence();
              scheduleLegitSlotOptionValidityRefresh();
            });
          } else {
            var ncsParts = NPARTS ? NPARTS[slotName] : null;
            if (ncsParts && ncsParts.length > 0) {
              rendered++;
              var labelText = getSlotDisplayLabel(slotName);
              var ncsOpts = ncsParts.slice().filter(function (o) { return !isEleControlPlaceholderPartName(o && o.name); });
              if (slotName === 'body_acc') {
                var hasElementSlotNcs = !!(
                  item && item.slots && (item.slots.body_ele || item.slots.element || item.slots.primary_ele || item.slots.secondary_ele || item.slots.pearl_elem) ||
                  (ncsInfo && Array.isArray(ncsInfo.ncs_slots) && ncsInfo.ncs_slots.some(function (s) { return /(^|_)(ele|element)$/.test(String(s || '').toLowerCase()) || /^(body_ele|primary_ele|secondary_ele|pearl_elem)$/.test(String(s || '').toLowerCase()); }))
                );
                if (hasElementSlotNcs) ncsOpts = ncsOpts.filter(function (o) { return !isElementLikePartName(o && o.name); });
              }
              var allowNames = getManifestNameAllowlistForSlot(item, slotName);
              if (allowNames) {
                ncsOpts = ncsOpts.filter(function (o) {
                  var on = String((o && o.name) || '').trim().toLowerCase();
                  return !!allowNames[on];
                });
              }
              ncsOpts.sort(function(a, b) {
                return (a.index - b.index) || String(a.name || '').localeCompare(String(b.name || ''));
              });
              div.innerHTML = '<label for="slot_' + slotId + '">' + escapeHtml(labelText) + ' <span class="ncs-badge">NCS</span> <span style="opacity:0.45;font-weight:400;">(' + ncsOpts.length + ')</span></label>'
                + '<select id="slot_' + slotId + '" data-slot="' + slotName + '" data-manifest-slot="">'
                + '<option value="">\u2014 None \u2014</option>'
                + ncsOpts.map(function(o) {
                    return '<option value="' + o.index + '" data-name="' + escapeHtml(o.name) + '" data-inv-key="" data-in-pool="false">NCS — [' + o.index + '] ' + formatPartName(o.name) + '</option>';
                  }).join('')
                + '</select>';
              div.querySelector('select').addEventListener('change', function(e) {
                var sel = e.target;
                var opt = sel.options[sel.selectedIndex];
                var sn = sel.dataset.slot;
                if (strictMode && opt && opt.disabled && opt.value) {
                  sel.value = '';
                  delete selectedParts[sn];
                  updateOutput();
                  updateValidation();
                  updateItemStats();
                  updateStatEffects();
                  updateDropSources();
                  updateProofEvidence();
                  scheduleLegitSlotOptionValidityRefresh();
                  return;
                }
                if (opt.value) {
                  selectedParts[sn] = { index: parseInt(opt.value, 10), name: opt.dataset.name, invDumpKey: null, in_pool: false, slot: sn, ncs: true };
                } else {
                  delete selectedParts[sn];
                }
                updateOutput();
                updateValidation();
                updateItemStats();
                updateStatEffects();
                updateDropSources();
                updateProofEvidence();
                scheduleLegitSlotOptionValidityRefresh();
              });
            } else {
              rendered++;
              var labelText = getSlotDisplayLabel(slotName);
              div.innerHTML = '<label>' + escapeHtml(labelText) + ' <span class="ncs-badge">NCS</span></label>'
                + '<div style="padding:6px 10px;font-size:0.78rem;color:rgba(179,136,255,0.6);font-style:italic;">No part data available yet</div>';
            }
          }
          slotsContainer.appendChild(div);
        }
      }

      if (!rendered) {
        slotsContainer.innerHTML = '<div class="slot-empty-msg">No configurable slots for this item.</div>';
      }
    }

    function updateOutput() {
      var keys = Object.keys(selectedParts);
      if (!keys.length) {
        outputEl.innerHTML = '<span class="o-empty">No parts selected yet.</span>';
        outputEl.dataset.plain = '';
        updateCodeOutput();
        return;
      }
      var ncsForOrder = selectedItem ? getNcsInfo(selectedItem.slug) : null;
      var ncsSlotsOrder = ncsForOrder && ncsForOrder.ncs_slots ? ncsForOrder.ncs_slots : null;
      var sortedKeys = sortSlotKeysForTagValidation(keys, ncsSlotsOrder);
      var entries = sortedKeys.map(function(k) { return [k, selectedParts[k]]; });
      outputEl.innerHTML = entries.map(function(e) {
        var slot = e[0], p = e[1];
        return '<span class="o-slot">' + slot + '</span>: <span class="o-idx">' + p.index + '</span> <span class="o-name">' + escapeHtml(p.name) + '</span>';
      }).join('\n');
      outputEl.dataset.plain = entries.map(function(e) { return e[0] + ': ' + e[1].index + ' ' + e[1].name; }).join('\n');
      updateCodeOutput();
    }

    function updateCodeOutput() {
      if (!selectedItem || Object.keys(selectedParts).length === 0) {
        codeOutput.textContent = 'No code generated yet.';
        codeOutput.className = 'code-box empty';
        return;
      }
      var familyId = selectedItem.category_id;
      var level = getItemLevel();
      var partTokens = [];
      var ncsOut = getNcsInfo(selectedItem.slug);
      var ncsSlotsOut = ncsOut && ncsOut.ncs_slots ? ncsOut.ncs_slots : null;
      var allSlotKeys = sortSlotKeysForTagValidation(Object.keys(selectedParts), ncsSlotsOut);
      for (var si = 0; si < allSlotKeys.length; si++) {
        var p = selectedParts[allSlotKeys[si]];
        if (!p) continue;
        if (useSpawnMode) {
          var prefix = buildSlugPrefix(selectedItem.slug);
          if (!prefix) {
            partTokens.push('"UNK.' + p.name + '"');
          } else {
            partTokens.push('"' + prefix + '.' + p.name + '"');
          }
        } else {
          partTokens.push('{' + familyId + ':' + p.index + '}');
        }
      }
      var code = familyId + ', 0, 1, ' + level + '||| ' + partTokens.join(' ') + '|';
      codeOutput.textContent = code;
      codeOutput.className = 'code-box';
      try {
        if (typeof window.refreshBuildStatsCore === 'function') {
          setTimeout(function () { window.refreshBuildStatsCore(); }, 40);
        }
      } catch (_) {}
    }

    function updateItemStats() {
      if (!selectedItem) {
        itemStatsEl.innerHTML = '<div class="stats-empty">Select an item type to see info.</div>';
        return;
      }
      var item = selectedItem;
      var ncsInfo = getNcsInfo(item.slug);
      var manifestSlotCount = item.slot_count;
      var ncsSlotCount = ncsInfo ? ncsInfo.ncs_slot_count : manifestSlotCount;
      var totalParts = item.total_parts;
      var filled = Object.keys(selectedParts).length;
      var mfr = ncsInfo ? ncsInfo.manufacturer : getMfrFromSlug(item.slug);
      var typeCode = ncsInfo ? (NMAP.weapon_type_codes[ncsInfo.type] || '') : (getWeaponTypeCode(item.slug) || '');

      var html = '<div class="item-stats">';
      html += '<div class="item-stat-card"><div class="stat-value">' + ncsSlotCount + '</div><div class="stat-label">True Slots (NCS)</div></div>';
      html += '<div class="item-stat-card"><div class="stat-value">' + manifestSlotCount + '</div><div class="stat-label">Mapped Slots</div></div>';

      var filledClass = filled === ncsSlotCount ? 'stat-highlight' : filled > ncsSlotCount ? 'stat-err' : '';
      html += '<div class="item-stat-card ' + filledClass + '"><div class="stat-value">' + filled + ' / ' + ncsSlotCount + '</div><div class="stat-label">Parts Selected</div></div>';

      var manifestPick = Object.values(selectedParts).filter(function(p) { return !p.ncs; });
      var ncsPick = Object.values(selectedParts).filter(function(p) { return p.ncs; }).length;
      var inPool = manifestPick.filter(function(p) { return p.in_pool; }).length;
      var notPool = manifestPick.filter(function(p) { return !p.in_pool; }).length;
      var poolClass = notPool > 0 ? 'stat-warn' : filled > 0 ? 'stat-highlight' : '';
      var poolNote = notPool > 0 ? ' <span style="font-size:0.75em;color:#ffb347">(+' + notPool + ' off-pool)</span>' : '';
      var ncsNote = ncsPick > 0 ? ' <span style="font-size:0.75em;opacity:0.65">(+' + ncsPick + ' NCS)</span>' : '';
      html += '<div class="item-stat-card ' + poolClass + '" title="Manifest-mapped slots: in_pool from our loot-pool export. NCS-only catalog picks are shown separately and are not &ldquo;off-pool&rdquo; drops."><div class="stat-value">' + inPool + poolNote + ncsNote + '</div><div class="stat-label">In drop-pool list</div></div>';
      html += '</div>';

      html += renderPartDiagnosticPanelHtml(getPartSlotDiagnostics(selectedParts, null, ncsInfo && ncsInfo.ncs_slots));

      if (mfr || typeCode) {
        html += '<div style="margin-top:8px;font-size:0.75rem;color:rgba(233,254,255,0.5);">';
        if (mfr) html += '<strong style="color:#00c8ff;">' + mfr + '</strong>';
        if (typeCode) html += ' &middot; Type: <strong>' + typeCode + '</strong>';
        html += ' &middot; Total parts available: <strong>' + totalParts + '</strong>';
        html += '</div>';
      }

      if (ncsInfo) {
        var catCounts = {};
        ncsInfo.ncs_slots.forEach(function(s) {
          var c = getSlotCategory(s);
          catCounts[c] = (catCounts[c] || 0) + 1;
        });
        html += '<div class="slot-cat-summary">';
        CAT_ORDER.forEach(function(cat) {
          if (!catCounts[cat]) return;
          var chipCls = { core:'cc-core', accessory:'cc-acc', ammo:'cc-ammo', visual:'cc-vis', endgame:'cc-end', other:'cc-oth' };
          html += '<span class="cat-chip ' + (chipCls[cat] || 'cc-oth') + '">' + CAT_LABELS[cat] + ': ' + catCounts[cat] + '</span>';
        });
        html += '</div>';
        var elHint = ncsElementStructureHint(ncsInfo);
        if (elHint) {
          html += '<div style="margin-top:6px;font-size:0.72rem;color:rgba(0,200,255,0.9);">'
            + '<strong style="color:#00c8ff;">Element structure:</strong> '
            + escapeHtml(elHint)
            + '</div>';
        }
      }

      html += '<div class="slot-breakdown slot-breakdown-legend" style="margin-top:12px;">';
      html += '<div style="font-size:0.72rem;font-weight:700;color:#00c8ff;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">All slots on this item</div>';
      var ncsSlots = ncsInfo ? ncsInfo.ncs_slots : [];
      var manifestSlots = Object.keys(item.slots);
      var allSlotsForBreakdown = [];
      var seenBD = {};
      ncsSlots.forEach(function(s) { allSlotsForBreakdown.push(s); seenBD[s] = true; });
      manifestSlots.forEach(function(s) { if (!seenBD[s]) { allSlotsForBreakdown.push(s); seenBD[s] = true; } });

      for (var bi = 0; bi < allSlotsForBreakdown.length; bi++) {
        var sn = allSlotsForBreakdown[bi];
        var hasPart = selectedParts[sn];
        var manifestKey = item.slots[sn] ? sn : (sn === 'magazine' && item.slots['mag'] ? 'mag' : null);
        var inManifest = !!manifestKey && !!item.slots[manifestKey];
        var optCount = inManifest ? (item.slots[manifestKey].options || []).length : 0;
        var label = getSlotLabel(sn);
        var cat = getSlotCategory(sn);
        var catColor = { core:'#00f3ff', accessory:'#b388ff', ammo:'#ffb347', visual:'rgba(233,254,255,0.35)', endgame:'#ff6bff', other:'rgba(233,254,255,0.5)' };
        var fillTxt = hasPart ? (hasPart.ncs ? 'Selected (NCS)' : (hasPart.in_pool ? 'Selected · in pool' : 'Selected · off-pool')) : 'Empty';
        html += '<div class="slot-breakdown-row">'
          + '<span class="sbr-name" style="color:' + (catColor[cat] || 'inherit') + '">' + escapeHtml(label) + '</span>'
          + '<span class="sbr-val' + (hasPart ? ' sbr-filled' : '') + '">'
          + (inManifest ? optCount + ' manifest options' : 'NCS list')
          + ' · <span style="opacity:0.9">' + fillTxt + '</span>'
          + '</span></div>';
      }
      html += '</div>';
      itemStatsEl.innerHTML = html;
    }

    var STAT_DISPLAY = {
      damage_scale: { label: 'Damage', suffix: 'x', base: 1 },
      firerate_value: { label: 'Fire Rate', suffix: '', base: 0 },
      spread_value: { label: 'Spread', suffix: '', base: 0, invert: true },
      accuracy_value: { label: 'Accuracy', suffix: '', base: 0 },
      accimpulse_value: { label: 'Acc. Impulse', suffix: '', base: 0 },
      accdelay_value: { label: 'Acc. Delay', suffix: 's', base: 0 },
      accregen_value: { label: 'Acc. Regen', suffix: '', base: 0 },
      recoil_scale: { label: 'Recoil', suffix: 'x', base: 1, invert: true },
      sway_scale: { label: 'Sway', suffix: 'x', base: 1, invert: true },
      impact_force_value: { label: 'Impact Force', suffix: '', base: 0 },
      projectilespershot_value: { label: 'Projectiles/Shot', suffix: '', base: 0 },
      damageradius_value: { label: 'Splash Radius', suffix: '', base: 0 },
      critdamage_add: { label: 'Crit Damage', suffix: '', base: 0 },
      statuschance_scale: { label: 'Status Chance', suffix: 'x', base: 1 },
      statusdamage_scale: { label: 'Status Damage', suffix: 'x', base: 1 },
      part_value: { label: 'Part Value', suffix: '', base: 0 },
      maxloadedammo_value: { label: 'Mag Size', suffix: '', base: 0 },
      reloadtime_value: { label: 'Reload Time', suffix: 's', base: 0, invert: true },
      thrownreloadtime_value: { label: 'Thrown Reload', suffix: 's', base: 0 },
      heatimpulse_value: { label: 'Heat/Shot', suffix: '', base: 0, invert: true },
      firerate_scale: { label: 'Fire Rate', suffix: 'x', base: 1 },
      accuracy_scale: { label: 'Accuracy', suffix: 'x', base: 1 },
      spread_scale: { label: 'Spread', suffix: 'x', base: 1, invert: true },
      equiptime_scale: { label: 'Equip Speed', suffix: 'x', base: 1, invert: true },
      putdowntime_scale: { label: 'Putdown Speed', suffix: 'x', base: 1, invert: true },
      weaponhitforce_scale: { label: 'Hit Force', suffix: 'x', base: 1 },
      elementalchance_scale: { label: 'Elem. Chance', suffix: 'x', base: 1 },
      elementaldamage_scale: { label: 'Elem. Damage', suffix: 'x', base: 1 },
      zoomtime_scale: { label: 'Zoom Speed', suffix: 'x', base: 1, invert: true },
      shield_reactive_armor_damage_capacity: { label: 'Reactive Armor', suffix: '', base: 0 },
      shield_capacity_scale: { label: 'Shield Capacity', suffix: 'x', base: 1 },
      cooldown_scale: { label: 'Cooldown', suffix: 'x', base: 1, invert: true },
    };

    function rawStatsToObject(raw) {
      if (!raw || !Array.isArray(raw) || !raw.length) return null;
      var out = {};
      for (var i = 0; i < raw.length; i++) {
        var s = raw[i];
        if (s && s.stat_field) out[s.stat_field] = s.stat_value;
      }
      return Object.keys(out).length ? out : null;
    }

    function lookupPartsStatsData(prefix, partName) {
      if (!PSTATS || !PSTATS.by_part_code) return null;
      var key = (prefix + '.' + partName).toLowerCase();
      var raw = PSTATS.by_part_code[key];
      var out = rawStatsToObject(raw);
      if (out) return out;
      var keys = Object.keys(PSTATS.by_part_code);
      for (var k = 0; k < keys.length; k++) {
        if (keys[k].toLowerCase().indexOf(partName.toLowerCase()) !== -1) {
          raw = PSTATS.by_part_code[keys[k]];
          out = rawStatsToObject(raw);
          if (out) return out;
        }
      }
      return null;
    }

    function lookupStatsByCodeSuffix(partName) {
      if (!PSTATS || !PSTATS.by_code_suffix) return null;
      var pn = String(partName || '').trim();
      if (!pn) return null;
      var raw = PSTATS.by_code_suffix[pn];
      var out = rawStatsToObject(raw);
      if (out) return out;
      var suffix = pn.indexOf('.') >= 0 ? pn.split('.').pop() : pn;
      if (suffix && suffix !== pn) {
        raw = PSTATS.by_code_suffix[suffix];
        out = rawStatsToObject(raw);
        if (out) return out;
      }
      return null;
    }

    function lookupStatsByIdRaw(familyId, index) {
      if (!PSTATS || !PSTATS.by_id_raw) return null;
      if (familyId == null || index == null) return null;
      var idRaw = String(familyId).trim() + ':' + String(index).trim();
      return rawStatsToObject(PSTATS.by_id_raw[idRaw]);
    }

    function lookupBarrelStats(slug, partName) {
      if (!WSTATS) return null;
      var typeCode = getWeaponTypeCode(slug);
      if (!typeCode) return null;
      var tableKey = 'Weapon_' + typeCode + '_Barrel_Init';
      var table = WSTATS[tableKey];
      if (!table || !table.rows) return null;
      var mfr = getMfrFromSlug(slug);
      var prefix = mfr ? MFR_BARREL_PREFIX[mfr] : '';
      var bestMatch = null;
      var keys = Object.keys(table.rows);
      for (var i = 0; i < keys.length; i++) {
        var rowName = keys[i];
        if (partName && rowName.toLowerCase().indexOf(partName.replace(/^part_/i,'').toLowerCase()) !== -1) { bestMatch = table.rows[rowName]; break; }
        if (prefix && rowName.indexOf(prefix) === 0) {
          var partIdx = partName ? partName.match(/(\d+)/) : null;
          var rowIdx = rowName.match(/(\d+)/);
          if (partIdx && rowIdx && partIdx[1] === rowIdx[1]) { bestMatch = table.rows[rowName]; break; }
        }
      }
      return bestMatch;
    }

    function lookupMagStats(slug, partName) {
      if (!WSTATS) return null;
      var typeCode = getWeaponTypeCode(slug);
      if (!typeCode) return null;
      var table = WSTATS['Weapon_' + typeCode + '_Magazine_Init'];
      if (!table || !table.rows) return null;
      var mfr = getMfrFromSlug(slug);
      var prefix = mfr ? MFR_BARREL_PREFIX[mfr] : '';
      var keys = Object.keys(table.rows);
      for (var i = 0; i < keys.length; i++) {
        var rowName = keys[i];
        if (partName && rowName.toLowerCase().indexOf(partName.replace(/^part_/i,'').toLowerCase()) !== -1) return table.rows[rowName];
        if (prefix && rowName.indexOf(prefix) === 0) {
          var pIdx = partName ? partName.match(/(\d+)/) : null;
          var rIdx = rowName.match(/(\d+)/);
          if (pIdx && rIdx && pIdx[1] === rIdx[1]) return table.rows[rowName];
        }
      }
      return null;
    }

    function lookupMfrStats(slug) {
      if (!WSTATS || !WSTATS['WeaponManufacturer_Init']) return null;
      var mfr = getMfrFromSlug(slug);
      if (!mfr) return null;
      return WSTATS['WeaponManufacturer_Init'].rows[mfr] || null;
    }

    // Resolves stats via by_id_raw, barrel/mag tables, by_part_code, by_code_suffix. Remaining gaps need Nexus/Excel reconciliation.
    function resolvePartsStatsBundle(familyId, index, slug, slotName, partName) {
      var byIdRaw = lookupStatsByIdRaw(familyId, index);
      if (byIdRaw) return { byIdRaw: true, stats: byIdRaw, method: 'idRaw' };
      var stats = null;
      if (slotName === 'barrel' || slotName === 'barrel_acc') stats = lookupBarrelStats(slug, partName);
      else if (slotName === 'mag' || slotName === 'magazine') stats = lookupMagStats(slug, partName);
      if (stats) return { byIdRaw: false, stats: stats, method: 'fallback' };
      var prefix = (SLUG_TO_PREFIX[slug] || buildSlugPrefix(slug) || '').toLowerCase().replace(/\s/g, '_');
      var altPrefixes = prefix ? [prefix] : [];
      if (slug.indexOf('shield') >= 0) altPrefixes.push('armor_shield', 'jak_shield', 'bor_shield', 'ted_shield', 'vla_shield', 'mal_shield', 'ord_shield', 'dad_shield', 'tor_shield');
      else if (slug.indexOf('grenade') >= 0) altPrefixes.push('vla_gr', 'mal_gr', 'jak_gr', 'dad_gr', 'bor_gr', 'ord_gr', 'tor_gr', 'ted_gr');
      else if (slug.indexOf('enhancement') >= 0) altPrefixes.push('atl_en', 'jak_en', 'mal_en', 'vla_en');
      else if (slug.indexOf('repair') >= 0) altPrefixes.push('mal_rk', 'jak_rk', 'tor_rk');
      else if (slug.indexOf('heavy') >= 0) altPrefixes.push('bor_hw', 'mal_hw', 'tor_hw', 'vla_hw');
      for (var ap = 0; ap < altPrefixes.length && !stats; ap++) stats = lookupPartsStatsData(altPrefixes[ap], partName);
      if (!stats) stats = lookupStatsByCodeSuffix(partName);
      return { byIdRaw: false, stats: stats, method: stats ? 'fallback' : 'missing' };
    }

    function resolveStatsForSelectedPart(itemSlug, familyId, slotName, partName, partIndex) {
      return resolvePartsStatsBundle(familyId, partIndex, itemSlug, slotName, partName);
    }

    function renderSourceLineageSection(title, rows, maxRows) {
      if (!rows || !rows.length) return '';
      var lim = Math.max(1, maxRows || 25);
      var shown = rows.slice(0, lim);
      var body = shown.map(function(r) {
        var name = escapeHtml(String(r && r.name != null ? r.name : ''));
        var hasProb = (r && typeof r.prob === 'number' && Number.isFinite(r.prob));
        var meta = hasProb ? (' <span style="opacity:0.65;">(' + Math.round(r.prob * 100) + '%)</span>') : '';
        return '<div style="padding:2px 0;border-bottom:1px solid rgba(0,243,255,0.08);">' + name + meta + '</div>';
      }).join('');
      var more = rows.length > lim ? '<div style="margin-top:4px;opacity:0.65;">+' + (rows.length - lim) + ' more</div>' : '';
      return '<details style="margin-top:6px;border:1px solid rgba(0,243,255,0.2);border-radius:8px;padding:6px 8px;background:rgba(0,243,255,0.04);"><summary style="cursor:pointer;color:#00c8ff;font-size:0.75rem;font-weight:700;">' + escapeHtml(title) + ' (' + rows.length + ')</summary><div style="margin-top:6px;font-size:0.72rem;color:rgba(233,254,255,0.8);line-height:1.35;max-height:160px;overflow:auto;">' + body + more + '</div></details>';
    }

    function renderValidationSourceMini(sourceEvidence) {
      if (!sourceEvidence) return '';
      var enemy = sourceEvidence.enemy && sourceEvidence.enemy.rows ? sourceEvidence.enemy.rows : [];
      var reward = sourceEvidence.reward && sourceEvidence.reward.rows ? sourceEvidence.reward.rows : [];
      var other = sourceEvidence.other && sourceEvidence.other.rows ? sourceEvidence.other.rows : [];
      function oneLine(title, rows) {
        if (!rows.length) return '<div style="opacity:0.65;">' + escapeHtml(title) + ': none</div>';
        var ex = rows.slice(0, 2).map(function(r) { return escapeHtml(String(r.name || '')); }).join(' | ');
        var more = rows.length > 2 ? (' <span style="opacity:0.65;">(+' + (rows.length - 2) + ')</span>') : '';
        return '<div>' + escapeHtml(title) + ': ' + ex + more + '</div>';
      }
      return '<details style="margin-top:8px;"><summary style="cursor:pointer;">Source hints (where this item type appears in bundled data)</summary><div style="margin-top:6px;line-height:1.4;">'
        + oneLine('Enemy', enemy)
        + oneLine('Reward', reward)
        + oneLine('Other', other)
        + '</div></details>';
    }

    function updateProofEvidence() {
      if (!proofEvidenceEl) return;
      if (!selectedItem) {
        proofEvidenceEl.innerHTML = '<div class="stats-empty">Select an item type to view proof details.</div>';
        return;
      }
      var entries = Object.entries(selectedParts);
      if (!entries.length) {
        proofEvidenceEl.innerHTML = '<div class="stats-empty">Select parts to view proof details.</div>';
        return;
      }

      var slug = selectedItem.slug;
      var ncsInfo = getNcsInfo(slug);
      var familyId = selectedItem.category_id;
      var prefix = SLUG_TO_PREFIX[slug] || buildSlugPrefix(slug);
      var requiredForItem = new Set();
      try {
        if (NCS && NCS.preferred_parts && prefix) {
          for (var i = 0; i < NCS.preferred_parts.length; i++) {
            var pref = NCS.preferred_parts[i];
            var req = (pref.required_parts || []).map(function(r) {
              var m = String(r).match(/inv'([^.]+)\.([^']+)'/);
              return m ? { prefix: m[1], part: m[2].toLowerCase() } : null;
            }).filter(Boolean);
            req.forEach(function(r) {
              if (String(r.prefix).toUpperCase() === String(prefix).toUpperCase()) requiredForItem.add(r.part);
            });
          }
        }
      } catch (_) {}

      var selectedNamesLower = new Set(entries.map(function(e) { return String(e[1].name || '').toLowerCase(); }));
      var inPoolCount = 0;
      var byIdRawCount = 0;
      var fallbackCount = 0;
      var missingCount = 0;
      var rows = [];
      for (var ei = 0; ei < entries.length; ei++) {
        var slotName = entries[ei][0];
        var p = entries[ei][1];
        var resolved = resolveStatsForSelectedPart(slug, familyId, slotName, p.name, p.index);
        var inPool = !!p.in_pool;
        if (inPool) inPoolCount++;
        if (resolved.byIdRaw) byIdRawCount++;
        else if (resolved.stats) fallbackCount++;
        else missingCount++;
        var requiredTag = requiredForItem.has(String(p.name || '').toLowerCase()) ? ' | required' : '';
        var inPoolTxt = inPool ? 'in-pool' : 'out-of-pool';
        var statTxt = resolved.byIdRaw ? 'idRaw' : (resolved.stats ? 'fallback' : 'no stats row');
        rows.push('<div class="slot-breakdown-row"><span class="sbr-name">' + escapeHtml(getSlotLabel(slotName)) + ': ' + escapeHtml(formatPartName(p.name)) + '</span><span class="sbr-val">' + inPoolTxt + ' | stats:' + statTxt + requiredTag + '</span></div>');
      }

      var cat = getDropCategoryForSlug(slug) || 'unknown';
      var itempoolKeyByCat = { guns:'itempool_guns_all', shields:'itempool_shields_all', grenadesgadgets:'itempool_gadgets_all', repkits:'itempool_repkit_all', enhancements:'itempool_enhancements_all', classmods:'itempool_class_mods_all' };
      var ipKey = itempoolKeyByCat[cat] || 'n/a';
      var mappedRows = (IPDROPROWS && IPDROPROWS[ipKey] && IPDROPROWS[ipKey][cat]) ? IPDROPROWS[ipKey][cat] : [];
      var sourceEvidence = getSourceEvidence(selectedItem);
      var sourceOk = (sourceEvidence.enemy.probSum > 0) || (sourceEvidence.reward.rows.length > 0) || (sourceEvidence.other.rows.length > 0);

      var poolScore = entries.length ? (inPoolCount / entries.length) : 0;
      var statsScore = entries.length ? (byIdRawCount / entries.length) : 0;
      var mappedScore = (mappedRows && mappedRows.length) ? 1 : 0;
      var sourceScore = sourceOk ? 1 : (sourceEvidence.rowsMapped > 0 ? 0.35 : 0);
      var preferredTotal = requiredForItem.size;
      var preferredSatisfied = preferredTotal === 0 ? true : Array.from(requiredForItem).every(function(n) { return selectedNamesLower.has(n); });
      var preferredScore = preferredSatisfied ? 1 : 0;
      var schedE = computeScheduleAnalysis(slug, selectedParts);
      var ilE = getItemLevel();
      var schedLevelOkE = !LSCHED || schedE.maxMinStage === 0 || ilE >= schedE.maxMinStage;
      var schedScore = schedLevelOkE ? 1 : 0.5;
      var confidence = Math.round((poolScore * 0.35 + mappedScore * 0.12 + statsScore * 0.12 + preferredScore * 0.05 + sourceScore * 0.23 + schedScore * 0.13) * 100);

      var html = '';
      html += '<div style="margin-top:0;font-size:0.72rem;font-weight:700;color:#00c8ff;text-transform:uppercase;letter-spacing:0.06em;">LootSchedule &amp; weights</div>';
      html += '<div style="font-size:0.74rem;color:rgba(233,254,255,0.7);line-height:1.45;margin-bottom:6px;">Item level <strong>' + ilE + '</strong> &middot; Max MinGameStage <strong>' + schedE.maxMinStage + '</strong> ';
      html += schedLevelOkE ? '<span style="color:#00ffc8">(meets gates)</span>' : '<span style="color:#ffb347">(below max gate)</span>';
      html += '</div>';
      if (schedE.gates && schedE.gates.length) {
        html += '<div style="font-size:0.7rem;color:rgba(233,254,255,0.5);line-height:1.35;margin-bottom:6px;">Gates: ' + schedE.gates.map(function(g) {
          return escapeHtml(g.key) + ' \u2265' + g.min;
        }).join(' &middot; ') + '</div>';
      }
      if (schedE.weightHits && schedE.weightHits.length) {
        html += '<details style="margin-bottom:8px;"><summary style="cursor:pointer;font-size:0.72rem;color:#00c8ff;">weapon_part_weight_table (' + schedE.weightHits.length + ')</summary><div style="font-size:0.7rem;color:rgba(233,254,255,0.55);margin-top:4px;">';
        html += schedE.weightHits.map(function(w) {
          return escapeHtml(w.row) + ': ' + w.w + ' \u2014 ' + escapeHtml(w.slot) + ' / ' + escapeHtml(formatPartName(w.part));
        }).join('<br>');
        html += '</div></details>';
      }
      var elemConfProof = analyzeElementConflicts(selectedParts);
      var elHintProof = ncsElementStructureHint(ncsInfo);
      if (elHintProof || elemConfProof.entries.length || elemConfProof.hasConflict) {
        html += '<div style="margin-top:8px;font-size:0.72rem;font-weight:700;color:#00c8ff;text-transform:uppercase;letter-spacing:0.06em;">Elements</div>';
        if (elHintProof) html += '<div style="font-size:0.74rem;color:rgba(233,254,255,0.65);line-height:1.45;margin-bottom:4px;">' + escapeHtml(elHintProof) + '</div>';
        if (elemConfProof.entries.length) {
          html += '<div style="font-size:0.7rem;color:rgba(233,254,255,0.55);line-height:1.4;">' + elemConfProof.entries.map(function(en) {
            return escapeHtml(getSlotLabel(en.slot)) + ': <strong>' + escapeHtml(en.tokens.join(' + ')) + '</strong>';
          }).join('<br>') + '</div>';
        }
        if (elemConfProof.hasConflict) {
          html += '<div style="font-size:0.74rem;color:#ff6b6b;margin-top:4px;">' + elemConfProof.messages.map(function(m) { return escapeHtml(m); }).join('<br>') + '</div>';
        }
      }
      html += '<div style="font-size:0.82rem;color:#00ffc8;line-height:1.4;">Composite score (heuristic): <strong>' + confidence + '/100</strong></div>';
      html += '<div style="margin-top:4px;font-size:0.72rem;color:rgba(233,254,255,0.55);line-height:1.4;">Pool: ' + Math.round(poolScore * 100) + '% &middot; Mapped rows: ' + mappedRows.length + ' &middot; Sources: ' + Math.round(sourceScore * 100) + '% &middot; idRaw stats: ' + Math.round(statsScore * 100) + '% &middot; Schedule: ' + (schedLevelOkE ? 'OK' : 'review') + ' &middot; Preferred parts: ' + (preferredSatisfied ? 'OK' : 'missing') + '</div>';
      html += '<div style="margin-top:8px;font-size:0.78rem;color:rgba(233,254,255,0.7);line-height:1.5;">Item: <strong>' + escapeHtml(selectedItem.name || slug) + '</strong>';
      if (ncsInfo && ncsInfo.ncs_id) html += ' &middot; NCS ID: <strong>' + escapeHtml(ncsInfo.ncs_id) + '</strong>';
      html += ' &middot; FamilyId: <strong>' + escapeHtml(String(familyId)) + '</strong></div>';
      html += '<div style="margin-top:6px;font-size:0.76rem;color:rgba(233,254,255,0.55);line-height:1.5;">Selected: <strong>' + entries.length + '</strong> &middot; In-pool: <strong>' + inPoolCount + '/' + entries.length + '</strong> &middot; Stats idRaw: <strong>' + byIdRawCount + '/' + entries.length + '</strong> &middot; Stats fallback: <strong>' + fallbackCount + '</strong> &middot; Stats missing: <strong>' + missingCount + '</strong></div>';
      html += '<div style="margin-top:6px;font-size:0.76rem;color:rgba(233,254,255,0.55);line-height:1.5;">ItemPoolList linkage: <strong>' + escapeHtml(ipKey) + '</strong> &middot; EnemyDrop rows mapped: <strong>' + (mappedRows ? mappedRows.length : 0) + '</strong></div>';
      html += '<div style="margin-top:6px;font-size:0.76rem;color:rgba(233,254,255,0.55);line-height:1.5;">Obtainable paths: Enemy <strong>' + sourceEvidence.enemy.rows.length + '</strong> &middot; Reward <strong>' + sourceEvidence.reward.rows.length + '</strong> &middot; Other <strong>' + sourceEvidence.other.rows.length + '</strong>' + (sourceEvidence.expectedHowMany != null ? ' &middot; E[how-many] <strong>' + sourceEvidence.expectedHowMany.toFixed(2) + '</strong>' : '') + '</div>';
      html += '<div style="margin-top:4px;font-size:0.74rem;color:' + (sourceOk ? '#00ffc8' : '#ffb347') + ';line-height:1.4;">Sources in our data: <strong>' + (sourceOk ? 'At least one path in enemy/reward/other tables' : 'No matching path in those tables yet') + '</strong></div>';
      if (mappedRows && mappedRows.length) html += '<div style="margin-top:4px;font-size:0.72rem;color:rgba(233,254,255,0.45);line-height:1.4;">Rows: ' + escapeHtml(mappedRows.join(', ')) + '</div>';
      html += '<div style="margin-top:8px;font-size:0.72rem;font-weight:700;color:#00c8ff;text-transform:uppercase;letter-spacing:0.06em;">Source Lineage</div>';
      html += renderSourceLineageSection('Enemy drops', sourceEvidence.enemy.rows, 18);
      html += renderSourceLineageSection('Mission / reward refs', sourceEvidence.reward.rows, 18);
      html += renderSourceLineageSection('Lootables / vendors / world', sourceEvidence.other.rows, 18);
      html += renderSourceLineageSection('Unclassified mapped refs', sourceEvidence.unknown.rows, 12);
      html += '<div class="slot-breakdown" style="margin-top:8px;">' + rows.join('') + '</div>';
      proofEvidenceEl.innerHTML = html;
    }

    function updateStatEffects() {
      if (!selectedItem || Object.keys(selectedParts).length === 0) {
        statEffectsEl.innerHTML = '<div class="stats-empty">Select parts to see their stat effects.</div>';
        return;
      }
      var slug = selectedItem.slug;
      var familyId = selectedItem.category_id;
      var html = '';
      var aggregated = {};

      var mfrStats = lookupMfrStats(slug);
      if (mfrStats) {
        html += '<div style="font-size:0.72rem;font-weight:700;color:#00c8ff;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Manufacturer: ' + (getMfrFromSlug(slug) || '') + '</div>';
        var mfrKeys = Object.keys(mfrStats);
        for (var mi = 0; mi < mfrKeys.length; mi++) {
          var mk = mfrKeys[mi];
          var mv = mfrStats[mk];
          var def = STAT_DISPLAY[mk];
          if (!def) continue;
          var isNeutral = (def.base === 1 && mv === 1) || (def.base === 0 && mv === 0);
          if (isNeutral) continue;
          aggregated[mk] = (aggregated[mk] || (def.base || 0)) + (mv - (def.base || 0));
          html += '<div class="stat-mfr-row"><span>' + def.label + '</span><span class="stat-mfr-val">' + mv.toFixed(2) + def.suffix + '</span></div>';
        }
      }

      Object.keys(selectedParts).forEach(function(slotName) {
        var p = selectedParts[slotName];
        var resolved = resolvePartsStatsBundle(familyId, p.index, slug, slotName, p.name);
        var stats = resolved.stats;
        if (!stats) return;
        html += '<div style="font-size:0.72rem;font-weight:700;color:#00c8ff;text-transform:uppercase;letter-spacing:0.06em;margin:10px 0 4px;">'
          + getSlotLabel(slotName) + ': ' + formatPartName(p.name)
          + ' <span style="opacity:0.65;font-weight:600;">(' + '{' + familyId + ':' + p.index + '}' + ')</span>'
          + '</div>';
        var skeys = Object.keys(stats);
        for (var si = 0; si < skeys.length; si++) {
          var sk = skeys[si];
          var sv = stats[sk];
          var def = STAT_DISPLAY[sk] || { label: sk.replace(/_/g, ' '), suffix: '', base: 0 };
          var isNeutral = (def.base === 1 && sv === 1) || (def.base === 0 && sv === 0);
          if (isNeutral) continue;
          aggregated[sk] = (aggregated[sk] || (def.base || 0)) + (sv - (def.base || 0));
          var cls = 'neutral';
          if (def.invert) { cls = sv > (def.base || 0) ? 'negative' : sv < (def.base || 0) ? 'positive' : 'neutral'; }
          else { cls = sv > (def.base || 0) ? 'positive' : sv < (def.base || 0) ? 'negative' : 'neutral'; }
          html += '<div class="stat-effect-row"><span class="stat-effect-name">' + def.label + '</span><span class="stat-effect-val ' + cls + '">' + (Number(sv) === sv ? sv.toFixed(2) : sv) + (def.suffix || '') + '</span></div>';
        }
      });

      var aggKeys = Object.keys(aggregated);
      if (aggKeys.length) {
        html += '<div style="font-size:0.72rem;font-weight:700;color:#00ffc8;text-transform:uppercase;letter-spacing:0.06em;margin:12px 0 4px;border-top:1px solid rgba(0,255,200,0.15);padding-top:8px;">Combined Effects</div>';
        for (var ai = 0; ai < aggKeys.length; ai++) {
          var ak = aggKeys[ai];
          var av = aggregated[ak];
          var def = STAT_DISPLAY[ak];
          if (!def) continue;
          var cls = 'neutral';
          if (def.invert) { cls = av > (def.base || 0) ? 'negative' : av < (def.base || 0) ? 'positive' : 'neutral'; }
          else { cls = av > (def.base || 0) ? 'positive' : av < (def.base || 0) ? 'negative' : 'neutral'; }
          html += '<div class="stat-effect-row"><span class="stat-effect-name">' + def.label + '</span><span class="stat-effect-val ' + cls + '">' + av.toFixed(2) + def.suffix + '</span></div>';
        }
      }

      if (!html) html = '<div class="stats-empty">No stat data available for selected parts.</div>';
      statEffectsEl.innerHTML = '<div class="stat-effects-panel">' + html + '</div>';
    }

    /**
     * Fallback slot order when NCS list is missing: mirror weapon NCS (body → body_acc / body_* visual → barrel → barrel_acc …).
     * When getNcsInfo(slug).ncs_slots is set, sortSlotKeysForTagValidation uses that instead.
     */
    var TAG_SLOT_ORDER = ['rarity','body','body_acc','body_ele','body_mag','body_bolt','body_energy','body_armor','barrel','barrel_acc','barrel_licensed','mag','magazine','magazine_acc','magazine_ted_thrown','magazine_borg','hyperion_secondary_acc','scope','scope_acc','grip','foregrip','underbarrel','underbarrel_acc','underbarrel_acc_vis','secondary_ammo','secondary_ele','primary_ele','element','shield','multi','unique','secondary','unknown','class_mod','stat','stat2','stat3','stat_group1','stat_group2','stat_group3','firmware','endgame','payload','payload_augment','stat_augment','pearl_elem','pearl_stat','tediore_acc','tediore_secondary_acc','core_augment','primary_augment','secondary_augment','active_augment','enemy_augment','turret_weapon','curative','class_mod_body'];

    function slotBaseKey(s) {
      return String(s || '').replace(/__dup\d+$/i, '');
    }

    /** Strip manufacturer.itemtype prefix (e.g. jak_ps.comp_05_…) for comp key regexes. */
    function normalizeCompKeyForNamedLegFam(cn) {
      if (!cn) return '';
      var s = String(cn).trim().toLowerCase();
      var dot = s.lastIndexOf('.');
      if (dot >= 0) s = s.slice(dot + 1);
      return s;
    }

    /**
     * Rarity dropdown may show STX labels (e.g. "Legendary - Crowdsourced") while inv / comp rules use
     * keys like comp_05_legendary_crowdsourced. Prefer itemTypeString / invDumpKey tail when present.
     */
    function effectiveRarityCompKey(rp) {
      if (!rp) return '';
      var fromInv = normalizeCompKeyForNamedLegFam(rp.invDumpKey || '');
      if (fromInv && /^comp_0[1-6]_/i.test(fromInv)) return fromInv;
      var raw = String(rp.name || '').trim().toLowerCase();
      if (!raw) return '';
      if (/^comp_0[1-6]_/i.test(raw) || /^base_comp_0[1-6]_/i.test(raw)) return raw.replace(/^base_comp_/i, 'comp_');
      return raw;
    }

    /**
     * Named orange comps use comp_05_legendary_<family>; inv rows may depend on uni_/leg_ for the full
     * suffix or a shorter prefix (e.g. phantom_flame barrel → uni_phantom). Seed every underscore prefix.
     */
    function addNamedLegendaryFamilyTagsToPool(famSuffix, pool) {
      if (!famSuffix || !pool) return;
      var parts = String(famSuffix).toLowerCase().split('_').filter(Boolean);
      var pi;
      for (pi = 1; pi <= parts.length; pi++) {
        var segment = parts.slice(0, pi).join('_');
        pool.add('leg_' + segment);
        pool.add('uni_' + segment);
      }
    }

    /** Map manifest slot to NCS slot for order lookup. Manifest may use different names than NCS (weapons, shields, grenades, repkits, enhancements, heavy). */
    function slotToNcsEquiv(s) {
      s = slotBaseKey(s);
      var map = {
        mag: 'magazine', class_mod_body: 'class_mod',
        shield: 'hyperion_secondary_acc', multi: 'tediore_acc'
      };
      return map[s] !== undefined ? map[s] : s;
    }

    function sortSlotKeysForTagValidation(keys, ncsSlotsOpt) {
      if (!ncsSlotsOpt || !ncsSlotsOpt.length) {
        return keys.slice().sort(function(a, b) {
          var ia = TAG_SLOT_ORDER.indexOf(slotBaseKey(a));
          var ib = TAG_SLOT_ORDER.indexOf(slotBaseKey(b));
          if (ia === -1) ia = 1000;
          if (ib === -1) ib = 1000;
          if (ia !== ib) return ia - ib;
          return a.localeCompare(b);
        });
      }
      var order = {};
      for (var i = 0; i < ncsSlotsOpt.length; i++) order[ncsSlotsOpt[i]] = i;
      return keys.slice().sort(function(a, b) {
        var ab = slotBaseKey(a);
        var bb = slotBaseKey(b);
        if (ab === 'rarity' && bb !== 'rarity') return -1;
        if (ab !== 'rarity' && bb === 'rarity') return 1;
        var aNcs = slotToNcsEquiv(a);
        var bNcs = slotToNcsEquiv(b);
        var ia = order[a] !== undefined ? order[a] : (order[aNcs] !== undefined ? order[aNcs] : -1);
        var ib = order[b] !== undefined ? order[b] : (order[bNcs] !== undefined ? order[bNcs] : -1);
        if (ia >= 0 && ib >= 0) return ia - ib;
        if (ia >= 0) return -1;
        if (ib >= 0) return 1;
        var fa = TAG_SLOT_ORDER.indexOf(a);
        var fb = TAG_SLOT_ORDER.indexOf(b);
        if (fa === -1) fa = 1000;
        if (fb === -1) fb = 1000;
        return fa !== fb ? fa - fb : a.localeCompare(b);
      });
    }

    /** Manifest slot → comp slot for parttypeselectionrules (stat/stat2/stat3 → stat_augment). */
    var MANIFEST_SLOT_TO_COMP_SLOT = {
      stat: 'stat_augment', stat2: 'stat_augment', stat3: 'stat_augment',
      stat_group1: 'stat_augment', stat_group2: 'stat_augment', stat_group3: 'stat_augment'
    };

    /** How many manifest slots can satisfy each comp slot for this item (used to drop impossible min/max noise). */
    function getCompSlotCapacityFromItem(selectedItem) {
      var out = Object.create(null);
      if (!selectedItem || !selectedItem.slots) return out;
      var slotKeys = Object.keys(selectedItem.slots);
      for (var i = 0; i < slotKeys.length; i++) {
        var sk = slotBaseKey(slotKeys[i]);
        var compSlot = MANIFEST_SLOT_TO_COMP_SLOT[sk] || sk;
        out[compSlot] = (out[compSlot] || 0) + 1;
      }
      return out;
    }

    /**
     * Inv dump tag rules (addtags / dependencytags / exclusiontags) via TagCompValidation.
     * Also validates compSlotRules (allowlist + min/max per slot) when present.
     * Uses ncs_slots order when provided so tag propagation matches game application order.
     * @param {object} selectedParts
     * @param {object} invData
     * @param {string[]} [ncsSlotsOpt] — NCS slot order for this item (from getNcsInfo)
     */
    /** Skip inv compSlotRules allowlist/minmax only where comp dumps are known mixed (class mods). */
    function slugSkipsInvCompSlotRules(slug, selectedItem) {
      var s = String(slug || '');
      if (/^classmod_/i.test(s)) return true;
      if (selectedItem && selectedItem.slots && selectedItem.slots.class_mod) return true;
      return false;
    }

    /** Plain common→epic comp (incl. named non-orange variants comp_04_epic_foo — still not comp_05). */
    function isPlainTier04RarityComp(compName) {
      var c = String(compName || '').trim().toLowerCase();
      if (/^comp_0[1-4]_(?:common|uncommon|rare|epic)$/i.test(c)) return true;
      if (/^comp_0[1-4]_(?:common|uncommon|rare|epic)_[a-z0-9_]+$/i.test(c)) return true;
      return false;
    }

    /** Any non–class mod item can carry an illegitimate plain-frame + orange-only part mix (shields, gadgets, guns). */
    function slugEligibleForPlainFrameUniLegCheck(slug, selectedItem) {
      if (!slug && !selectedItem) return false;
      var s = String((selectedItem && selectedItem.slug) || slug || '');
      if (/^classmod_/i.test(s)) return false;
      if (selectedItem && selectedItem.slots && selectedItem.slots.class_mod) return false;
      return true;
    }

    function normalizeInvLookupKey(raw) {
      var s = String(raw || '').trim().toLowerCase();
      if (!s) return '';
      s = s.replace(/\s+/g, '_');
      s = s.replace(/^inv'?/i, '');
      s = s.replace(/^base_/, '');
      return s;
    }

    function buildInvAliasIndex(partsByName) {
      var idx = {};
      if (!partsByName) return idx;
      Object.keys(partsByName).forEach(function (k) {
        var meta = partsByName[k];
        var key = normalizeInvLookupKey(k);
        if (key && !idx[key]) idx[key] = meta;
        if (key.indexOf('.') >= 0) {
          var tail = key.split('.').pop();
          if (tail && !idx[tail]) idx[tail] = meta;
        }
        var noPart = key.replace(/^part_/, '');
        if (noPart && !idx[noPart]) idx[noPart] = meta;
      });
      return idx;
    }

    function buildInvLookupDebugKeys(p) {
      var keys = [];
      function push(k) {
        var s = String(k || '').trim();
        if (!s) return;
        if (keys.indexOf(s) >= 0) return;
        keys.push(s);
      }
      var n1 = normalizeInvLookupKey(p && p.name);
      var n2 = normalizeInvLookupKey(p && p.invDumpKey);
      push(n1);
      push(n2);
      if (n1 && n1.indexOf('.') >= 0) push(n1.split('.').pop());
      if (n2 && n2.indexOf('.') >= 0) push(n2.split('.').pop());
      if (n1) push(n1.replace(/^part_/, ''));
      if (n2) push(n2.replace(/^part_/, ''));
      return keys;
    }

    /** Match INV_COMP_TAG_DATA row using manifest option name and/or decode invDumpKey (same keys as Nexus part ids). */
    function resolveInvPartMeta(partsByName, p) {
      if (!partsByName || !p) return null;
      var meta = partsByName[String(p.name || '').toLowerCase()];
      if (meta) return meta;
      if (p.invDumpKey) {
        var idk = String(p.invDumpKey).toLowerCase();
        meta = partsByName[idk];
        if (meta) return meta;
        var idDot = idk.lastIndexOf('.');
        if (idDot >= 0) {
          var idTail = idk.slice(idDot + 1);
          if (idTail) {
            meta = partsByName[idTail];
            if (meta) return meta;
          }
        }
      }
      var aliasIdx = partsByName.__aliasIndex;
      if (!aliasIdx) {
        aliasIdx = buildInvAliasIndex(partsByName);
        try { partsByName.__aliasIndex = aliasIdx; } catch (_e) {}
      }
      var k1 = normalizeInvLookupKey(p.name || '');
      if (k1 && aliasIdx[k1]) return aliasIdx[k1];
      var k2 = normalizeInvLookupKey(p.invDumpKey || '');
      if (k2 && aliasIdx[k2]) return aliasIdx[k2];
      if (p.invDumpKey) {
        var idk3 = String(p.invDumpKey).toLowerCase();
        var idDot3 = idk3.lastIndexOf('.');
        if (idDot3 >= 0) {
          var kt3 = normalizeInvLookupKey(idk3.slice(idDot3 + 1));
          if (kt3 && aliasIdx[kt3]) return aliasIdx[kt3];
        }
      }
      return null;
    }

    /**
     * Comp + prior slots' addtags in NCS order (same as runInvTagProgression). Omits excludeSlotKey so
     * that slot's dropdown can preview alternates against the pool built without that row.
     */
    function buildSyntheticTagPoolFromSelection(selectedParts, invData, ncsSlotsOpt, excludeSlotKey) {
      var tagPool = new Set();
      if (!invData || !invData.partsByName || !window.TagCompValidation || !selectedParts) return tagPool;
      var TC = window.TagCompValidation;
      var partsByName = invData.partsByName;
      var compBasetags = invData.compBasetags || {};
      var sortedKeys = sortSlotKeysForTagValidation(Object.keys(selectedParts), ncsSlotsOpt);
      var rp = selectedParts.rarity;
      var compName = effectiveRarityCompKey(rp) || null;
      var compKeyNorm = compName ? compName.replace(/^base_comp_/i, 'comp_') : null;
      if (rp && (rp.name || rp.invDumpKey) && compName) {
        var baseTags = compBasetags[compName];
        if (!baseTags) {
          var baseMatch = compKeyNorm && compKeyNorm.match(/^(comp_0[1-5]_(?:common|uncommon|rare|epic|legendary))(?:_[a-z0-9_]+)?$/i);
          if (baseMatch) baseTags = compBasetags[baseMatch[1].toLowerCase()];
        }
        if (!baseTags && compKeyNorm && compKeyNorm !== compName) {
          baseTags = compBasetags[compKeyNorm];
        }
        if (baseTags) TC.formatTags(baseTags).forEach(function(t) { tagPool.add(t); });
        var cnOrange = compKeyNorm || compName;
        if (/^comp_05_legendary/i.test(cnOrange) || /^comp_06_|pearlescent|_pearlescent/i.test(compName) || /^comp_0[1-4]_(?:common|uncommon|rare|epic)_[a-z0-9_]+$/i.test(cnOrange)) {
          tagPool.add('unique');
          if (!tagPool.has('legendary') && (/legendary|pearlescent|comp_06|_pearlescent/i.test(compName))) tagPool.add('legendary');
        }
        (function seedRarityFromCompKey(cn, pool) {
          if (!cn) return;
          var c = String(cn).trim().toLowerCase();
          var tier = c.match(/^comp_0([1-4])_(common|uncommon|rare|epic)(?:$|_)/i);
          if (tier) pool.add(tier[2].toLowerCase());
          else if (/^comp_05_legendary/i.test(c) || /^comp_06_/i.test(c) || /pearlescent/i.test(c)) {
            pool.add('unique');
            pool.add('legendary');
          } else if (/^comp_0[1-4]_(common|uncommon|rare|epic)_/i.test(c)) {
            pool.add('unique');
            var nt = c.match(/^comp_0[1-4]_(common|uncommon|rare|epic)_/i);
            if (nt) pool.add(nt[1].toLowerCase());
          }
        })(compKeyNorm || compName, tagPool);
        (function seedNamedLegendaryFamilyTags(cn, pool) {
          if (!cn || !pool) return;
          var c = normalizeCompKeyForNamedLegFam(cn);
          var m = c.match(/^(?:base_)?comp_05_legendary_([a-z0-9_]+)$/i);
          if (!m || !m[1]) return;
          addNamedLegendaryFamilyTagsToPool(m[1], pool);
        })(compName, tagPool);
      }
      for (var ti = 0; ti < sortedKeys.length; ti++) {
        var sk = sortedKeys[ti];
        if (excludeSlotKey && slotBaseKey(sk) === slotBaseKey(excludeSlotKey)) continue;
        var skBase = slotBaseKey(sk);
        var p = selectedParts[sk];
        if (!p || !p.name) continue;
        var meta = resolveInvPartMeta(partsByName, p);
        if (!meta) continue;
        if (skBase === 'barrel' && p && p.name) {
          var bnm = String(p.name).toLowerCase();
          if (/part_barrel_02|barrel_02/i.test(bnm)) tagPool.add('barrel_02');
          if (/part_barrel_01|barrel_01|zipgun/i.test(bnm)) tagPool.add('barrel_01');
        }
        TC.applyPartAddTagsToPool(tagPool, meta);
      }
      return tagPool;
    }

    function invPartIdImpliesUniqueLegendaryRoll(invKeyLower) {
      if (!invKeyLower) return false;
      return /^(?:part_unique_|part_aug_unique_|part_aug_leg_|part_leg_)/.test(invKeyLower);
    }

    /** part_barrel_NN_x where x is not a single-letter variant (a–d) — Nexus uses these for orange barrels; invalid on plain comps. */
    function invKeyLooksNamedLegendaryBarrel(invKeyLower) {
      if (!invKeyLower) return false;
      var m = /^part_barrel_\d{2}_([a-z0-9_]+)$/i.exec(invKeyLower);
      if (!m) return false;
      var tail = m[1];
      if (tail.length < 2) return false;
      if (/^[abcd]$/i.test(tail)) return false;
      if (/^(common|uncommon|rare|epic|legendary)$/i.test(tail)) return false;
      return true;
    }

    function isPearlRarityCompName(compName) {
      var c = String(compName || '').trim().toLowerCase();
      if (!c) return false;
      var n = c.replace(/^base_comp_/i, 'comp_');
      return /^comp_06_/.test(n) || /pearlescent|_pearlescent|pearl/.test(n);
    }

    /**
     * When inv dependency simulation is relaxed, still fail obvious cheats: plain comp_01–04 + parts whose
     * inv dump expects a named orange/unique pool (uni_*, leg_*, or dependency unique/legendary), or whose
     * Nexus part id is clearly a unique/legendary row (part_unique_*, part_aug_unique_*, …).
     */
    function plainFrameUniLegViolations(selectedParts, partsByName, compName, selectedItem) {
      var out = [];
      if (!isPlainTier04RarityComp(compName) || !partsByName || !window.TagCompValidation) return out;
      if (!slugEligibleForPlainFrameUniLegCheck(null, selectedItem)) return out;
      var TC = window.TagCompValidation;
      var keys = Object.keys(selectedParts);
      var ki;
      var sk;
      var p;
      var meta;
      var deps;
      var di;
      var t;
      var invKey;
      for (ki = 0; ki < keys.length; ki++) {
        sk = keys[ki];
        var skBase = slotBaseKey(sk);
        if (skBase === 'rarity') continue;
        p = selectedParts[sk];
        if (!p || !p.name) continue;
        invKey = String((p.invDumpKey || p.name || '')).trim().toLowerCase();
        if (invPartIdImpliesUniqueLegendaryRoll(invKey)) {
          out.push(
            'Frame mismatch: ' +
              getSlotLabel(skBase) +
              ' / ' +
              formatPartName(p.name) +
              ' \u2014 part id is a unique/legendary inv row, but rarity is plain ' +
              String(compName)
          );
          continue;
        }
        if (invKeyLooksNamedLegendaryBarrel(invKey)) {
          out.push(
            'Frame mismatch: ' +
              getSlotLabel(skBase) +
              ' / ' +
              formatPartName(p.name) +
              ' \u2014 named legendary barrel id on plain rarity comp ' +
              String(compName)
          );
          continue;
        }
        meta = resolveInvPartMeta(partsByName, p);
        if (!meta || !meta.dependencytags || !meta.dependencytags.length) continue;
        deps = TC.formatTags(meta.dependencytags);
        for (di = 0; di < deps.length; di++) {
          t = deps[di];
          if (t.indexOf('uni_') === 0 || t.indexOf('leg_') === 0) {
            out.push(
              'Frame mismatch: ' +
                getSlotLabel(skBase) +
                ' / ' +
                formatPartName(p.name) +
                ' \u2014 inv dependencytags expect a named legendary/orange comp, but rarity is plain ' +
                String(compName)
            );
            break;
          }
          if (t === 'legendary' || t === 'unique') {
            out.push(
              'Frame mismatch: ' +
                getSlotLabel(skBase) +
                ' / ' +
                formatPartName(p.name) +
                ' \u2014 inv dependencytags require unique/legendary pool, but rarity is plain ' +
                String(compName)
            );
            break;
          }
        }
      }
      return out;
    }

    function runInvTagProgression(selectedParts, invData, ncsSlotsOpt, progOpts) {
      progOpts = progOpts || {};
      var globalReasons = [];
      var bySlot = {};
      if (!invData || !invData.partsByName || !window.TagCompValidation) {
        return { bySlot: bySlot, globalReasons: globalReasons };
      }
      var partsByName = invData.partsByName;
      var compBasetags = invData.compBasetags || {};
      var compSlotRules = invData.compSlotRules || {};
      var TC = window.TagCompValidation;
      var sortedKeys = sortSlotKeysForTagValidation(Object.keys(selectedParts), ncsSlotsOpt);
      var tagPool = new Set();
      var rp = selectedParts.rarity;
      var compName = effectiveRarityCompKey(rp) || null;
      /* Data + manifests use both comp_* and base_comp_* for the same rarity row — normalize for tier/regex logic. */
      var compKeyNorm = compName ? compName.replace(/^base_comp_/i, 'comp_') : null;
      if (rp && (rp.name || rp.invDumpKey) && compName) {
        var baseTags = compBasetags[compName];
        if (!baseTags) {
          var baseMatch = compKeyNorm && compKeyNorm.match(/^(comp_0[1-5]_(?:common|uncommon|rare|epic|legendary))(?:_[a-z0-9_]+)?$/i);
          if (baseMatch) baseTags = compBasetags[baseMatch[1].toLowerCase()];
        }
        if (!baseTags && compKeyNorm && compKeyNorm !== compName) {
          baseTags = compBasetags[compKeyNorm];
        }
        if (baseTags) TC.formatTags(baseTags).forEach(function(t) { tagPool.add(t); });
        /* Pool "unique" for orange / pearl / named lower tiers so parts that depend on it validate; base barrels exclude unique in dump — skip that exclusion when this applies (see partValidForPool skipUniqueExclusion). */
        var cnOrange = compKeyNorm || compName;
        if (/^comp_05_legendary/i.test(cnOrange) || /^comp_06_|pearlescent|_pearlescent/i.test(compName) || /^comp_0[1-4]_(?:common|uncommon|rare|epic)_[a-z0-9_]+$/i.test(cnOrange)) {
          tagPool.add('unique');
          if (!tagPool.has('legendary') && (/legendary|pearlescent|comp_06|_pearlescent/i.test(compName))) tagPool.add('legendary');
        }
        /* When compBasetags in the bundle is missing or corrupt, still seed tier tags from the comp key (save-editor–style pool). Plain comps must NOT pre-load uni_/leg_ from other parts — that falsely satisfies legendary deps on green frames. */
        (function seedRarityFromCompKey(cn, pool) {
          if (!cn) return;
          var c = String(cn).trim().toLowerCase();
          var tier = c.match(/^comp_0([1-4])_(common|uncommon|rare|epic)(?:$|_)/i);
          if (tier) pool.add(tier[2].toLowerCase());
          else if (/^comp_05_legendary/i.test(c) || /^comp_06_/i.test(c) || /pearlescent/i.test(c)) {
            pool.add('unique');
            pool.add('legendary');
          } else if (/^comp_0[1-4]_(common|uncommon|rare|epic)_/i.test(c)) {
            pool.add('unique');
            var nt = c.match(/^comp_0[1-4]_(common|uncommon|rare|epic)_/i);
            if (nt) pool.add(nt[1].toLowerCase());
          }
        })(compKeyNorm || compName, tagPool);
        /* Named legendary comps carry a family suffix (e.g. comp_05_legendary_quickdraw).
           Some part rows depend on leg_* / uni_* family tags; seed both aliases from comp key. */
        (function seedNamedLegendaryFamilyTags(cn, pool) {
          if (!cn || !pool) return;
          var c = normalizeCompKeyForNamedLegFam(cn);
          var m = c.match(/^(?:base_)?comp_05_legendary_([a-z0-9_]+)$/i);
          if (!m || !m[1]) return;
          addNamedLegendaryFamilyTagsToPool(m[1], pool);
        })(compName, tagPool);
      }
      /* Standard tier comps 01–06 (incl. pearlescent): base barrels exclude "unique" while lower pools never carry it — skip or bulk banks false-fail. */
      var skipUniqueExcl = !!(compKeyNorm && /^comp_0[1-6]_/i.test(compKeyNorm));
      for (var ti = 0; ti < sortedKeys.length; ti++) {
        var sk = sortedKeys[ti];
        var skBase = slotBaseKey(sk);
        var p = selectedParts[sk];
        if (!p || !p.name) {
          bySlot[sk] = { status: 'empty' };
          continue;
        }
        var meta = resolveInvPartMeta(partsByName, p);
        /* Rarity row is a comp_* key; Nexus inv bundle often has basetags only (no partsByName row). */
        if (!meta && skBase === 'rarity' && (p.invDumpKey || p.name)) {
          meta = { addtags: [], dependencytags: [], exclusiontags: [] };
        }
        if (!meta) {
          bySlot[sk] = { status: 'no_rule', partName: p.name };
          continue;
        }
        var pnl = String(p.name || '').toLowerCase();
        var skipExTags = [];
        if (pnl.indexOf('secondbarrel') >= 0 || pnl.indexOf('underbarrel_07') >= 0) skipExTags.push('barrel_01');
        if (skipExTags.indexOf('barrel_01') < 0 && meta.exclusiontags) {
          var exf = TC.formatTags(meta.exclusiontags);
          if (exf.indexOf('barrel_01') >= 0 && skBase === 'underbarrel') skipExTags.push('barrel_01');
        }
        /* Match __stxRefreshLegitSlotOptionValidity / save-editor style: named comps often carry rarity addtags
           that do not intersect the linear pool’s tier set — do not false-fail; real cheats still miss deps or hit exclusions.
           Note: tag-comp-validation.js now handles Legendary->Epic matching strictly; no automatic skip here. */
        var skipRarityPoolMatchActual = false;
        var pvOpts = {
          skipUniqueExclusion: skipUniqueExcl,
          skipExclusionTags: skipExTags.length ? skipExTags : undefined,
          skipRarityPoolMatch: skipRarityPoolMatchActual
        };
        if (progOpts.relaxUniLegDeps) pvOpts.skipAllDependencyChecks = true;
        if (skBase === 'barrel' && p && p.name) {
          var bnm = String(p.name).toLowerCase();
          /* Barrel rows depend on barrel_01 / barrel_02; the engine infers those from the chosen barrel
             id. Linear slot pool used to miss them (body/comp rarely add). Pre-seed from this part’s name
             so legit Vladof HW / Ripper rows pass; cheats using other parts still miss required tags or hit exclusions. */
          if (/part_barrel_02|barrel_02/i.test(bnm)) tagPool.add('barrel_02');
          if (/part_barrel_01|barrel_01|zipgun/i.test(bnm)) tagPool.add('barrel_01');
        }
        var v = TC.partValidForPool(meta, tagPool, pvOpts);
        if (v.ok && (skBase === 'pearl_elem' || skBase === 'pearl_stat')) {
          if (!isPearlRarityCompName(compName)) {
            v = { ok: false, reasons: ['pearl-only slot requires pearlescent rarity comp'] };
          }
        }
        if (!v.ok) {
          globalReasons.push('Inv tags: ' + getSlotLabel(skBase) + ' / ' + formatPartName(p.name) + ' \u2014 ' + v.reasons.join('; '));
          bySlot[sk] = { status: 'fail', reasons: v.reasons.slice(), partName: p.name };
        } else {
          bySlot[sk] = { status: 'ok', partName: p.name };
        }
        TC.applyPartAddTagsToPool(tagPool, meta);
      }

      if (progOpts.saveEditorLegitBulk) {
        /* Bulk parity: order-independent exclusion-only recheck. Prefer every manifest-mapped decode row
           (bulkGlobalExclRows) so duplicate slots (e.g. two barrel_acc) still contribute addtags; collapsing
           to selectedParts alone dropped tags from non-first rows. Fallback: selected slots only. */
        var globalPool = new Set();
        var metas = [];
        var bulkExtra = progOpts.bulkGlobalExclRows;
        if (Array.isArray(bulkExtra) && bulkExtra.length) {
          for (var ge = 0; ge < bulkExtra.length; ge++) {
            var ber = bulkExtra[ge];
            if (!ber || !ber.slotKey || !ber.manifestName) continue;
            var bp = {
              name: ber.manifestName,
              invDumpKey: ber.invDumpKey != null ? ber.invDumpKey : null,
              slot: ber.slotKey
            };
            var bem = resolveInvPartMeta(partsByName, bp);
            if (!bem) continue;
            metas.push({ sk: ber.slotKey, p: bp, meta: bem });
          }
        }
        if (!metas.length) {
          for (var gi = 0; gi < sortedKeys.length; gi++) {
            var gsk = sortedKeys[gi];
            var gp = selectedParts[gsk];
            if (!gp || !gp.name) continue;
            var gmeta = resolveInvPartMeta(partsByName, gp);
            if (!gmeta) continue;
            metas.push({ sk: gsk, p: gp, meta: gmeta });
          }
        }
        for (var gpBuild = 0; gpBuild < metas.length; gpBuild++) {
          var gmb = metas[gpBuild];
          var gadds2 = TC.formatTags(gmb.meta.addtags);
          for (var ga = 0; ga < gadds2.length; ga++) globalPool.add(gadds2[ga]);
          var bnmG = String(gmb.p.name || '').toLowerCase();
          if (/part_barrel_02|barrel_02/i.test(bnmG)) globalPool.add('barrel_02');
          if (/part_barrel_01|barrel_01|zipgun/i.test(bnmG)) globalPool.add('barrel_01');
        }
        for (var gm = 0; gm < metas.length; gm++) {
          var mrow = metas[gm];
          var mskBase = slotBaseKey(mrow.sk);
          var mp = mrow.p;
          var mmeta = mrow.meta;
          var skipExGlobal = [];
          var mpn = String(mp.name || '').toLowerCase();
          if (mpn.indexOf('secondbarrel') >= 0 || mpn.indexOf('underbarrel_07') >= 0) skipExGlobal.push('barrel_01');
          if (skipExGlobal.indexOf('barrel_01') < 0 && mmeta.exclusiontags) {
            var mexf = TC.formatTags(mmeta.exclusiontags);
            if (mexf.indexOf('barrel_01') >= 0 && mskBase === 'underbarrel') skipExGlobal.push('barrel_01');
          }
          var gv = TC.partValidForPool(mmeta, globalPool, {
            skipUniqueExclusion: skipUniqueExcl,
            skipExclusionTags: skipExGlobal.length ? skipExGlobal : undefined,
            skipAllDependencyChecks: true,
            skipRarityPoolMatch: true
          });
          if (!gv.ok) {
            var exclOnly = [];
            for (var gr = 0; gr < gv.reasons.length; gr++) {
              if (/^exclusion tag\s+"/i.test(String(gv.reasons[gr] || ''))) exclOnly.push(gv.reasons[gr]);
            }
            if (exclOnly.length) {
              var gmsg = 'Inv tags(global): ' + getSlotLabel(mskBase) + ' / ' + formatPartName(mp.name) + ' — ' + exclOnly.join('; ');
              globalReasons.push(gmsg);
              var prevG = bySlot[mrow.sk];
              var gReasons = prevG && prevG.reasons ? prevG.reasons.concat(exclOnly) : exclOnly.slice();
              bySlot[mrow.sk] = { status: 'fail', reasons: gReasons, partName: mp.name };
            }
          }
        }
      }
      /* INV bundle keys comp_01…06 to class-mod slot shapes; guns use base_comp_* rows (barrel_acc etc.).
         Manifest rarity often stores comp_02_uncommon without base_ — skip wrongly enforcing class_mod_body on weapons. */
      var compRulesKey = compName;
      var slugForRules = String(progOpts.manifestSlug || '');
      var isWeaponSlugForComp = /_(?:pistol|ar|smg|shotgun|sniper|hw|heavy_weapon)$/i.test(slugForRules);
      if (compName && compKeyNorm && isWeaponSlugForComp) {
        var baseCompRulesTry = 'base_' + compKeyNorm;
        if (compSlotRules[baseCompRulesTry]) compRulesKey = baseCompRulesTry;
      }
      if (compRulesKey && compSlotRules[compRulesKey] && !progOpts.skipCompSlotRules) {
        var rules = compSlotRules[compRulesKey];
        for (var ti = 0; ti < sortedKeys.length; ti++) {
          var sk = sortedKeys[ti];
          var skBase = slotBaseKey(sk);
          var p = selectedParts[sk];
          if (!p || !p.name) continue;
          if (bySlot[sk] && bySlot[sk].status === 'no_rule') continue;
          var compSlot = MANIFEST_SLOT_TO_COMP_SLOT[skBase] || skBase;
          var slotRule = rules[compSlot];
          if (!slotRule) continue;
          var partNorm = String(p.name).toLowerCase().trim();
          if (slotRule.parts && slotRule.parts.length > 0) {
            var partBase = partNorm.indexOf('.') >= 0 ? partNorm.split('.').pop() : partNorm;
            var slotAsWildcard = slotRule.parts.indexOf(compSlot) >= 0 || slotRule.parts.some(function(a) { return String(a).toLowerCase().trim() === compSlot; });
            if (slotAsWildcard) {
              /* Slot name in allowlist = any part in that slot allowed (Nexus wildcard). */
            } else {
              /* Allowlist rows are known to be narrower than actual in-game availability; treat mismatch as FYI. */
              var inList = slotRule.parts.some(function(allow) {
                var a = String(allow).toLowerCase().trim();
                if (a === compSlot) return true;
                return partNorm === a || partBase === a || partNorm.indexOf(a) >= 0 || (partNorm.indexOf('.') >= 0 && partNorm.endsWith('.' + a)) || (partNorm.indexOf('.') >= 0 && a.indexOf('.') >= 0 && partNorm.endsWith(a));
              });
              if (!inList) {
                globalReasons.push('Comp allowlist: ' + getSlotLabel(skBase) + ' / ' + formatPartName(p.name) + ' not in allowed parts for ' + compSlot);
              }
            }
          }
        }
        /* Bulk cheat-audit: full inv_comp min/max caused large false-positive waves. Keep strict behavior for
           normal validation, but in bulk mode re-enable only actionable under-min on barrel_acc using every
           mapped decode row (incl. duplicate-slot rows via bulkGlobalExclRows). */
        if (!progOpts.saveEditorLegitBulk) {
          var countsByCompSlot = {};
          for (var ti = 0; ti < sortedKeys.length; ti++) {
            var sk = sortedKeys[ti];
            var skBase = slotBaseKey(sk);
            var p = selectedParts[sk];
            if (!p || !p.name) continue;
            var compSlot = MANIFEST_SLOT_TO_COMP_SLOT[skBase] || skBase;
            countsByCompSlot[compSlot] = (countsByCompSlot[compSlot] || 0) + 1;
          }
          for (var compSlot in countsByCompSlot) {
            if (!rules[compSlot]) continue;
            var r = rules[compSlot];
            var cnt = countsByCompSlot[compSlot];
            var min = typeof r.min === 'number' ? r.min : (r.parts && r.parts.length ? 1 : 0);
            var max = typeof r.max === 'number' ? r.max : 999;
            /* Match Nexus/save-editor legit-builder: merged rules often imply min 1 when firmware options
               exist, but serials and the online editor treat firmware as optional. */
            if (compSlot === 'firmware' && min > 0) min = 0;
            if (cnt < min || cnt > max) {
              var msg = 'Comp slot ' + compSlot + ': count ' + cnt + ' outside range [' + min + ',' + max + ']';
              globalReasons.push(msg);
              var skKeys = Object.keys(MANIFEST_SLOT_TO_COMP_SLOT).filter(function(s) { return MANIFEST_SLOT_TO_COMP_SLOT[s] === compSlot; });
              if (!skKeys.length) skKeys = [compSlot];
              for (var si = 0; si < skKeys.length; si++) {
                var skk = skKeys[si];
                if (bySlot[skk] && bySlot[skk].status === 'ok') {
                  bySlot[skk] = { status: 'fail', reasons: [msg], partName: selectedParts[skk] && selectedParts[skk].name };
                }
              }
            }
          }
        } else if (Array.isArray(progOpts.bulkGlobalExclRows) && progOpts.bulkGlobalExclRows.length) {
          /* Bulk: for barrel_acc, count only parts that are exclusion-valid in the global pool.
             This matches editor behavior where an excluded barrel_acc doesn't satisfy the slot requirement. */
          var bulkGlobalPool = new Set();
          var bulkResolved = [];
          for (var bx = 0; bx < progOpts.bulkGlobalExclRows.length; bx++) {
            var br = progOpts.bulkGlobalExclRows[bx];
            if (!br || !br.slotKey || !br.manifestName) continue;
            var bp = { name: br.manifestName, invDumpKey: br.invDumpKey != null ? br.invDumpKey : null, slot: br.slotKey };
            var bmeta = resolveInvPartMeta(partsByName, bp);
            if (!bmeta) continue;
            bulkResolved.push({ slotKey: br.slotKey, p: bp, meta: bmeta });
            var badds = TC.formatTags(bmeta.addtags);
            for (var ba = 0; ba < badds.length; ba++) bulkGlobalPool.add(badds[ba]);
            var bnm = String(bp.name || '').toLowerCase();
            if (/part_barrel_02|barrel_02/i.test(bnm)) bulkGlobalPool.add('barrel_02');
            if (/part_barrel_01|barrel_01|zipgun/i.test(bnm)) bulkGlobalPool.add('barrel_01');
          }

          var bulkCountsByCompSlot = {};
          var bulkSeenByCompSlot = {};
          for (var bc = 0; bc < bulkResolved.length; bc++) {
            var br2 = bulkResolved[bc];
            var bslotBase = slotBaseKey(br2.slotKey);
            var bcompSlot = MANIFEST_SLOT_TO_COMP_SLOT[bslotBase] || bslotBase;
            bulkSeenByCompSlot[bcompSlot] = (bulkSeenByCompSlot[bcompSlot] || 0) + 1;
            var okForCount = true;
            if (bcompSlot === 'barrel_acc') {
              var bv = TC.partValidForPool(br2.meta, bulkGlobalPool, {
                skipUniqueExclusion: skipUniqueExcl,
                skipAllDependencyChecks: true,
                skipRarityPoolMatch: true
              });
              if (!bv.ok) {
                /* If this barrel_acc has any exclusion conflict, it does not satisfy the requirement. */
                var hasExcl = bv.reasons.some(function (r) { return String(r).indexOf('exclusion tag "') === 0; });
                if (hasExcl) okForCount = false;
              }
            }
            if (!okForCount) continue;
            bulkCountsByCompSlot[bcompSlot] = (bulkCountsByCompSlot[bcompSlot] || 0) + 1;
          }
          var bulkMinOnlySlots = { barrel_acc: true };
          for (var bcomp in bulkMinOnlySlots) {
            if (!bulkMinOnlySlots[bcomp]) continue;
            var brule = rules[bcomp];
            if (!brule) continue;
            /* Do not invent slot requirements for items that do not map this comp slot at all. */
            if (!(bulkSeenByCompSlot[bcomp] > 0)) continue;
            var bcnt = bulkCountsByCompSlot[bcomp] || 0;
            var bmin = typeof brule.min === 'number' ? brule.min : (brule.parts && brule.parts.length ? 1 : 0);
            if (bcnt < bmin) {
              var bmsg = 'Comp slot ' + bcomp + ': count ' + bcnt + ' outside range [' + bmin + ',999]';
              globalReasons.push(bmsg);
              var bskKeys = Object.keys(MANIFEST_SLOT_TO_COMP_SLOT).filter(function(s) { return MANIFEST_SLOT_TO_COMP_SLOT[s] === bcomp; });
              if (!bskKeys.length) bskKeys = [bcomp];
              for (var bsi = 0; bsi < bskKeys.length; bsi++) {
                var bsk = bskKeys[bsi];
                var bprev = bySlot[bsk];
                var breasons = bprev && bprev.reasons ? bprev.reasons.concat(bmsg) : [bmsg];
                bySlot[bsk] = { status: 'fail', reasons: breasons, partName: selectedParts[bsk] && selectedParts[bsk].name };
              }
            }
          }
        }
      }
      return { bySlot: bySlot, globalReasons: globalReasons };
    }

    function computeTagCompositionIssues(selectedParts, invData) {
      return runInvTagProgression(selectedParts, invData).globalReasons;
    }

    /** One row per selected slot: manifest pool flag + inv tag outcome (for Item Info panel). Pass tagBySlotOverride from computeLegitValidationState to avoid a second tag walk. */
    function getPartSlotDiagnostics(selectedParts, tagBySlotOverride, ncsSlotsOpt) {
      var tagBySlot = tagBySlotOverride;
      if (!tagBySlot) {
        var invData = typeof window !== 'undefined' ? window.INV_COMP_TAG_DATA : null;
        tagBySlot = runInvTagProgression(selectedParts, invData, ncsSlotsOpt).bySlot;
      }
      var rows = [];
      var keys = sortSlotKeysForTagValidation(Object.keys(selectedParts), ncsSlotsOpt);
      for (var i = 0; i < keys.length; i++) {
        var sk = keys[i];
        var skBase = slotBaseKey(sk);
        var p = selectedParts[sk];
        if (!p) continue;
        var poolKind = p.ncs ? 'ncs' : (p.in_pool ? 'in' : 'out');
        var poolText = poolKind === 'ncs'
          ? 'NCS catalog only (not filtered by manifest pool)'
          : poolKind === 'in'
            ? 'In manifest drop-pool list'
            : 'Not on manifest loot-pool export (other sources possible)';
        var tg = tagBySlot[sk];
        var tagLine = '\u2014';
        var tagKind = 'neutral';
        if (!tg) {
          tagLine = '\u2014';
          tagKind = 'neutral';
        } else if (tg.status === 'empty') {
          tagLine = '(empty)';
          tagKind = 'neutral';
        } else if (tg.status === 'no_rule') {
          tagLine = 'No inv tag row in dump for this part';
          tagKind = 'warn';
        } else if (tg.status === 'ok') {
          tagLine = 'Composition tags OK';
          tagKind = 'ok';
        } else if (tg.status === 'fail') {
          tagLine = tg.reasons.join('; ');
          tagKind = 'bad';
        }
        rows.push({
          slotKey: sk,
          slotLabel: getSlotLabel(skBase),
          partName: p.name,
          poolKind: poolKind,
          poolText: poolText,
          tagLine: tagLine,
          tagKind: tagKind
        });
      }
      return rows;
    }

    function renderPartDiagnosticPanelHtml(rows) {
      if (!rows.length) return '';
      var html = '<div class="part-diag-wrap"><div class="part-diag-title">Selected parts (readability)</div>'
        + '<table class="part-diag-table"><thead><tr><th>Slot</th><th>Part</th><th>Drop data</th><th>Inv composition</th></tr></thead><tbody>';
      var i;
      var r;
      for (i = 0; i < rows.length; i++) {
        r = rows[i];
        html += '<tr><td>' + escapeHtml(r.slotLabel) + '</td><td class="pd-name">' + escapeHtml(formatPartName(r.partName)) + '</td>'
          + '<td class="pd-pool pd-pool-' + escapeHtml(r.poolKind) + '">' + escapeHtml(r.poolText) + '</td>'
          + '<td class="pd-tag pd-tag-' + escapeHtml(r.tagKind) + '">' + escapeHtml(r.tagLine) + '</td></tr>';
      }
      html += '</tbody></table>'
        + '<p class="part-diag-foot"><strong>Drop data</strong> uses manifest <code>in_pool</code>: &ldquo;In manifest drop-pool list&rdquo; = flagged in our loot-pool export. Off-export parts are still valid in-game from rewards, vendors, quests, mail, events, etc.; validation does not mark the build uncertain for that alone. <strong>NCS catalog</strong> slots are the raw part list &mdash; no pool filter. <strong>Inv composition</strong> = dependency / exclusion / add tags from the inv extract. Use <strong>Sources</strong> in the validation footer for enemy/reward/other rows when present.</p>'
        + '</div>';
      return html;
    }

    /**
     * Manifest slots with in_pool=false (excludes NCS catalog rows — those are not loot-pool filtered).
     * @returns {{ slot: string, slotLabel: string, partName: string, index: number, display: string }[]}
     */
    function describeOffPoolParts(selectedParts, ncsSlotsOpt) {
      var list = [];
      if (!selectedParts) return list;
      var keys = sortSlotKeysForTagValidation(Object.keys(selectedParts), ncsSlotsOpt);
      var i;
      var sk;
      var p;
      for (i = 0; i < keys.length; i++) {
        sk = keys[i];
        var skBase = slotBaseKey(sk);
        p = selectedParts[sk];
        if (!p || p.ncs) continue;
        if (p.in_pool) continue;
        list.push({
          slot: sk,
          slotLabel: getSlotLabel(skBase),
          partName: p.name,
          index: p.index,
          display: getSlotLabel(skBase) + ': ' + formatPartName(p.name) + ' [idx ' + p.index + ']'
        });
      }
      return list;
    }

    /**
     * Dependency basetags where linear slot→tagPool progression often disagrees with Nexus / save-editor
     * (v23–v25). Barrel_01/02: satisfied via barrel-slot name seed above — do not mark as bulk noise or
     * real cheats that still have other bad deps/exclusions won’t pass.
     */
    function bulkMissingDepTagIsEditorParityNoise(tag) {
      var t = String(tag || '').toLowerCase();
      if (t.indexOf('uni_') === 0) return true;
      if (t.indexOf('leg_') === 0) return true;
      if (t.indexOf('licensed_') === 0) return true;
      if (t === 'elem') return true;
      if (t === 'ted_mirv') return true;
      return false;
    }

    /**
     * Bulk page only: hard-fail lines that match interactive Legit Builder’s inv-tag bar (exclusion clash,
     * comp-slot under-min, comp allowlist mismatch, actionable missing deps). Dependency lines that are
     * editor-parity noise stay FYI via bulkMissingDepTagIsEditorParityNoise.
     */
    function invReasonIsSaveEditorBulkHardFail(line) {
      var s = String(line || '');
      if (/^Comp allowlist:/i.test(s)) return true;
      if (/rarity tags do not match pool/i.test(s)) return true;
      if (/pearl-only slot requires pearlescent/i.test(s)) return true;
      if (/missing dependency tag/i.test(s)) {
        var rxd = /missing dependency tag "([^"]+)"/gi;
        var md;
        var sawQuoted = false;
        var hasActionableMissingDep = false;
        while ((md = rxd.exec(s)) !== null) {
          sawQuoted = true;
          if (!bulkMissingDepTagIsEditorParityNoise(md[1])) hasActionableMissingDep = true;
        }
        if (hasActionableMissingDep) return true;
        if (!sawQuoted) return true;
        /* Else: only uni_/leg_/licensed_ deps missing — FYI, not Fail (data). */
      }
      if (/Exclusion:/i.test(s) && /pool/i.test(s)) return true;
      var m = s.match(/Comp slot[^:]+: count (\d+) outside range \[(\d+),(\d+)\]/);
      if (m) {
        var cnt = parseInt(m[1], 10);
        var mi = parseInt(m[2], 10);
        if (Number.isFinite(cnt) && Number.isFinite(mi) && cnt < mi) return true;
      }
      if (s.indexOf('exclusion tag') >= 0) {
        var tags = [];
        var re = /exclusion tag\s+"([^"]+)"/gi;
        var mm;
        while ((mm = re.exec(s)) !== null) tags.push(String(mm[1]).toLowerCase());
        if (tags.length === 0) return true;
        /* Bulk: many FYI lines are only "unique" (or barrel tag structure) vs pool; real cheats carry other exclusion tags (licensed, …). */
        var bulkNoiseExcl = { unique: true, barrel_01: true, barrel_02: true };
        for (var i = 0; i < tags.length; i++) {
          if (!bulkNoiseExcl[tags[i]]) return true;
        }
        return false;
      }
      return false;
    }

    /** Legit Builder interactive hard-fail set: bulk hard-fails + comp allowlist mismatches. */
    function invReasonIsInteractiveHardFail(line) {
      var s = String(line || '');
      var m = s.match(/Comp slot[^:]+: count (\d+) outside range \[(\d+),(\d+)\]/);
      if (m) {
        var cnt = parseInt(m[1], 10);
        var mi = parseInt(m[2], 10);
        /* Interactive builder: treat under-min as "incomplete build" (not hard fail yet). */
        if (Number.isFinite(cnt) && Number.isFinite(mi) && cnt < mi) return false;
      }
      if (invReasonIsSaveEditorBulkHardFail(s)) return true;
      if (/^Comp allowlist:/i.test(s)) return true;
      return false;
    }

    /**
     * Data-backed checks (same as manual slot selection). Used by updateValidation and decode-from-serial path.
     * @param {{ strictMode?: boolean, itemLevel?: number, partOrderMismatches?: string[]|null, relaxInvUniLegDeps?: boolean, invTagFailuresAsErr?: boolean, detectPlainFrameUniLeg?: boolean, failOffPoolNamedLegendaryBarrels?: boolean, bulkCheatAuditMode?: boolean, bulkGlobalExclRows?: Array<{ slotKey: string, manifestName?: string, invDumpKey?: string|null }> }} opts — bulkCheatAuditMode: bulk serial page — save-editor Legit parity: only Fail (data) from inv chain on exclusion / comp-slot under-min; other inv messages are FYI. bulkGlobalExclRows: all manifest-mapped decode rows (incl. duplicate slots) for order-independent exclusion pool; decode path sets this. When invTagFailuresAsErr is false (interactive Legit Builder UI), inv-tag globalReasons only promote Fail if invReasonIsSaveEditorBulkHardFail — matching slot-dropdown ✓/✗ (skipRarityPoolMatch) and avoiding false “Uncertain (inv tags)”.
     */
    function computeLegitValidationState(selectedItem, selectedParts, opts) {
      opts = opts || {};
      var bulkAudit =
        opts.bulkCheatAuditMode === true ||
        (typeof window !== 'undefined' && window.STX_BULK_CHEAT_AUDIT === true);
      var detectPlainFrameUniLeg = opts.detectPlainFrameUniLeg;
      if (detectPlainFrameUniLeg === undefined) detectPlainFrameUniLeg = true;
      var v = M.validation;
      var partCount = Object.keys(selectedParts).length;
      var partsList = Object.values(selectedParts);
      var selectedPartNames = new Set(partsList.map(function(p) { return (p.name || '').toLowerCase(); }));
      var status = 'idle', statusText = '', details = [];
      var familyId = selectedItem ? selectedItem.category_id : null;
      var sourceEvidence = selectedItem ? getSourceEvidence(selectedItem) : null;
      var sourceOk = !!(sourceEvidence && ((sourceEvidence.enemy.probSum > 0) || (sourceEvidence.reward.rows.length > 0) || (sourceEvidence.other.rows.length > 0)));
      var statsIdRawFound = 0;
      var statsAnyFound = 0;
      var statsMissingExamples = [];
      var useStrict = opts.strictMode !== undefined ? opts.strictMode : strictMode;
      var il = opts.itemLevel != null && Number.isFinite(Number(opts.itemLevel)) ? Number(opts.itemLevel) : getItemLevel();

      if (selectedItem && partCount) {
        var slugForStats = selectedItem.slug;
        var slotNames = Object.keys(selectedParts);
        for (var si = 0; si < slotNames.length; si++) {
          var sn = slotNames[si];
          var p = selectedParts[sn];
          if (!p) continue;
          var resolved = resolvePartsStatsBundle(familyId, p.index, slugForStats, sn, p.name);
          if (resolved.byIdRaw) statsIdRawFound++;
          if (resolved.stats) statsAnyFound++;
          else if (statsMissingExamples.length < 6) statsMissingExamples.push(sn + ': ' + formatPartName(p.name));
        }
      }

      if (partCount === 0) {
        return { status: 'idle', statusText: '', details: [], className: 'v-idle', miniLineageHtml: '', sourceEvidence: null, statsIdRawFound: 0, statsAnyFound: 0, partCount: 0, partSlotDiagnostics: [], offPoolParts: [] };
      }

      var ncsInfo = selectedItem ? getNcsInfo(selectedItem.slug) : null;
      var compSlotCapacity = getCompSlotCapacityFromItem(selectedItem);
      var offPoolParts = describeOffPoolParts(selectedParts, ncsInfo && ncsInfo.ncs_slots);
      function isNonActionableCompUnderMinLine(line) {
        var s = String(line || '');
        var m = s.match(/Comp slot ([^:]+): count (\d+) outside range \[(\d+),(\d+)\]/);
        if (!m) return false;
        var compSlot = String(m[1] || '').trim();
        var min = parseInt(m[3], 10);
        var cap = Number(compSlotCapacity[compSlot] || 0);
        return Number.isFinite(min) && Number.isFinite(cap) && min > cap;
      }

      try {
        if (NCS && NCS.preferred_parts && NCS.preferred_parts.length && selectedItem) {
          var prefix = SLUG_TO_PREFIX[selectedItem.slug] || buildSlugPrefix(selectedItem.slug);
          if (prefix) {
            for (var pi = 0; pi < NCS.preferred_parts.length; pi++) {
              var pref = NCS.preferred_parts[pi];
              var required = (pref.required_parts || []).map(function(r) { var m = String(r).match(/inv'([^.]+)\.([^']+)'/); return m ? { prefix: m[1], part: m[2].toLowerCase() } : null; }).filter(Boolean);
              var forThisItem = required.filter(function(r) { return r.prefix.toUpperCase() === prefix.toUpperCase(); });
              if (forThisItem.length === 0) continue;
              var requiredNames = new Set(forThisItem.map(function(r) { return r.part; }));
              var hasAny = Array.from(requiredNames).some(function(n) { return selectedPartNames.has(n); });
              var hasAll = Array.from(requiredNames).every(function(n) { return selectedPartNames.has(n); });
              if (hasAny && !hasAll) {
                /* NCS extract lists one valid combo; game allows alternates — FYI only (do not mark uncertain). */
                var missing = Array.from(requiredNames).filter(function(n) { return !selectedPartNames.has(n); });
                details.push(
                  'FYI (NCS bundled combo): ' +
                    pref.id.replace(/^PrefParts_|_Unique_OM$/g, '') +
                    ' lists ' +
                    Array.from(requiredNames).join(' + ') +
                    '; other valid mixes exist. Missing vs that bundle: ' +
                    missing.join(', ')
                );
              }
            }
          }
        }
      } catch(_) {}

      if (ncsInfo && ncsInfo.ncs_slots) {
        var badSlots = [];
        Object.keys(selectedParts).forEach(function(sk) {
          var skBase = slotBaseKey(sk);
          if (!slotNameAllowedOnNcs(skBase, ncsInfo.ncs_slots)) badSlots.push(skBase);
        });
        if (badSlots.length) {
          details.push('Slot(s) not in NCS for this item: ' + badSlots.join(', '));
          if (!bulkAudit) {
            status = 'err';
            statusText = 'Fail (data)';
          }
        }
      }
      if (status !== 'err' && opts.partOrderMismatches && opts.partOrderMismatches.length) {
        details.push('Part order mismatch vs NCS: ' + opts.partOrderMismatches.join('; '));
        if (!bulkAudit) {
          status = 'warn';
          statusText = 'Uncertain (slot order)';
        }
      }
      var elemConf = analyzeElementConflicts(selectedParts);
      if (elemConf.hasConflict) {
        for (var eci = 0; eci < elemConf.messages.length; eci++) details.push(elemConf.messages[eci]);
        if (!bulkAudit) {
          status = 'err';
          statusText = 'Fail (data)';
        }
      }

      // Hard legit rule: element-like parts can only be in actual element slot(s) for this item.
      (function enforceElementSlotPlacement() {
        var allowed = getAllowedElementSlotSetForItem(selectedItem, ncsInfo);
        var hasAnyAllowed = Object.keys(allowed).length > 0;
        var bad = [];
        Object.keys(selectedParts || {}).forEach(function (sk) {
          var p = selectedParts[sk];
          if (!p || !isElementLikePartName(p.name)) return;
          var base = String(slotBaseKey(sk) || '').toLowerCase();
          if (!allowed[base]) {
            bad.push(getSlotLabel(base) + ' / ' + formatPartName(p.name));
          }
        });
        if (!hasAnyAllowed && bad.length === 0) return;
        if (bad.length) {
          details.push('Element control in invalid slot for this item: ' + bad.join('; '));
          if (!bulkAudit) {
            status = 'err';
            statusText = 'Fail (data)';
          }
        }
      })();

      // Hard legit rule: pearl-only slots require a pearlescent rarity comp.
      (function enforcePearlSlotsNeedPearlRarity() {
        var hasPearlOnlySlot = false;
        Object.keys(selectedParts || {}).forEach(function (sk) {
          var base = slotBaseKey(sk);
          if (base === 'pearl_elem' || base === 'pearl_stat') hasPearlOnlySlot = true;
        });
        if (!hasPearlOnlySlot) return;
        var rp = selectedParts && selectedParts.rarity ? selectedParts.rarity : null;
        var compEff = effectiveRarityCompKey(rp);
        var compNm = rp && rp.name ? String(rp.name).trim().toLowerCase() : '';
        var compInv = rp && rp.invDumpKey ? String(rp.invDumpKey).trim().toLowerCase() : '';
        if (isPearlRarityCompName(compEff) || isPearlRarityCompName(compNm) || isPearlRarityCompName(compInv)) return;
        details.push('Pearl-only slots selected (pearl element/stat) without pearlescent rarity comp.');
        if (!bulkAudit) {
          status = 'err';
          statusText = 'Fail (data)';
        }
      })();

      var tagProgResult = null;
      var tagBySlotForDiag = null;
      var tagInv = typeof window !== 'undefined' ? window.INV_COMP_TAG_DATA : null;
      if (tagInv && tagInv.partsByName && window.TagCompValidation) {
        var ncsSlotsForTag = (ncsInfo && ncsInfo.ncs_slots) ? ncsInfo.ncs_slots : null;
        tagProgResult = runInvTagProgression(selectedParts, tagInv, ncsSlotsForTag, {
          skipCompSlotRules: !!(selectedItem && slugSkipsInvCompSlotRules(selectedItem.slug, selectedItem)),
          relaxUniLegDeps: opts.relaxInvUniLegDeps === true,
          saveEditorLegitBulk: bulkAudit === true,
          manifestSlug: selectedItem ? selectedItem.slug : '',
          bulkGlobalExclRows: Array.isArray(opts.bulkGlobalExclRows) ? opts.bulkGlobalExclRows : null
        });
        tagBySlotForDiag = tagProgResult.bySlot;
        for (var tri = 0; tri < tagProgResult.globalReasons.length; tri++) {
          var grLine = tagProgResult.globalReasons[tri];
          if (isNonActionableCompUnderMinLine(grLine)) continue;
          details.push(grLine);
        }
      }

      if (detectPlainFrameUniLeg === true && tagInv && tagInv.partsByName) {
        var rpc2 = selectedParts.rarity;
        var compCheck = null;
        if (rpc2) {
          var compEff = effectiveRarityCompKey(rpc2);
          var compNm = String(rpc2.name || '').trim().toLowerCase();
          var compIdk = rpc2.invDumpKey ? String(rpc2.invDumpKey).trim().toLowerCase() : '';
          if (isPlainTier04RarityComp(compEff)) compCheck = compEff;
          else if (isPlainTier04RarityComp(compNm)) compCheck = compNm;
          else if (isPlainTier04RarityComp(compIdk)) compCheck = compIdk;
          else compCheck = compEff || compNm;
        }
        var frameViol = plainFrameUniLegViolations(selectedParts, tagInv.partsByName, compCheck, selectedItem);
        for (var fvx = 0; fvx < frameViol.length; fvx++) details.push(frameViol[fvx]);
        if (frameViol.length && !bulkAudit) {
          status = 'err';
          statusText = 'Fail (data)';
        }
      }

      var sched = selectedItem ? computeScheduleAnalysis(selectedItem.slug, selectedParts) : { gates: [], maxMinStage: 0, weightHits: [], zeroWeightParts: [] };

      if (status !== 'err' && sched.zeroWeightParts && sched.zeroWeightParts.length) {
        details.push('weapon_part_weight_table: 0% roll weight for ' + sched.zeroWeightParts.map(function(z) {
          return z.slot + ':' + formatPartName(z.part) + ' [' + z.row + ']';
        }).join('; '));
        if (!bulkAudit) {
          status = 'err';
          statusText = 'Fail (data)';
        }
      }
      if (status !== 'err' && useStrict && LSCHED && sched.maxMinStage > 0 && il < sched.maxMinStage) {
        details.push('Item level ' + il + ' < LootSchedule MinGameStage ' + sched.maxMinStage);
        if (!bulkAudit) {
          status = 'err';
          statusText = 'Fail (data)';
        }
      }

      var itemSlotMax = ncsInfo ? ncsInfo.ncs_slot_count : (selectedItem ? selectedItem.slot_count : v.part_count.max);
      if (partCount > itemSlotMax) {
        details.push('Part count ' + partCount + ' exceeds this item\'s ' + itemSlotMax + ' slots');
        if (!bulkAudit) {
          status = 'err';
          statusText = 'Fail (data)';
        }
      }

      if (status !== 'err') {
        var finalSourceOk = bulkAudit ? true : useStrict ? sourceOk : sourceEvidence && sourceEvidence.rowsMapped > 0;
        var schedLevelOk = !LSCHED || sched.maxMinStage === 0 || il >= sched.maxMinStage;
        var schedBlockOk = schedLevelOk || bulkAudit;
        if (finalSourceOk) {
          if (!schedLevelOk && LSCHED && sched.maxMinStage > 0) {
            details.push('Item level ' + il + ' is below LootSchedule MinGameStage ' + sched.maxMinStage + ' (strict mode marks Fail (data))');
          }
          if (schedBlockOk) {
            if (tagProgResult && tagProgResult.globalReasons.length) {
              if (opts.invTagFailuresAsErr === true) {
                if (bulkAudit) {
                  var hasBulkHardInv = false;
                  var hbi;
                  for (hbi = 0; hbi < tagProgResult.globalReasons.length; hbi++) {
                    if (invReasonIsSaveEditorBulkHardFail(tagProgResult.globalReasons[hbi])) {
                      hasBulkHardInv = true;
                      break;
                    }
                  }
                  if (hasBulkHardInv) {
                    status = 'err';
                    statusText = 'Fail (data)';
                  } else {
                    status = 'ok';
                    statusText = 'OK (data)';
                    details.push(
                      'Bulk save-editor parity: inv scan reported FYI lines only (no exclusion clash, comp-slot under-min, or comp allowlist mismatch).'
                    );
                  }
                } else {
                  status = 'err';
                  statusText = 'Fail (data)';
                }
              } else {
                /* Interactive Legit Builder (invTagFailuresAsErr off): same hard-fail bar as bulk save-editor parity —
                   dropdown ✓/✗ uses skipRarityPoolMatch; FYI lines (allowlist, soft deps) must not force Uncertain. */
                var legitHardInv = false;
                var underMinSlots = [];
                var lh;
                for (lh = 0; lh < tagProgResult.globalReasons.length; lh++) {
                  var gl = String(tagProgResult.globalReasons[lh] || '');
                  if (isNonActionableCompUnderMinLine(gl)) continue;
                  var um = gl.match(/Comp slot ([^:]+): count (\d+) outside range \[(\d+),(\d+)\]/);
                  if (um) {
                    var umCnt = parseInt(um[2], 10);
                    var umMin = parseInt(um[3], 10);
                    if (Number.isFinite(umCnt) && Number.isFinite(umMin) && umCnt < umMin) underMinSlots.push(String(um[1] || '').trim());
                  }
                  if (invReasonIsInteractiveHardFail(gl)) {
                    legitHardInv = true;
                    break;
                  }
                }
                if (legitHardInv) {
                  status = 'err';
                  statusText = 'Fail (data)';
                } else if (underMinSlots.length && status !== 'err') {
                  var uniqUnderMin = Array.from(new Set(underMinSlots.filter(Boolean)));
                  status = 'warn';
                  statusText = 'Build incomplete';
                  details.push('Build incomplete: add required slot parts for ' + uniqUnderMin.join(', ') + '.');
                } else if (status !== 'warn' && status !== 'err') {
                  status = 'ok';
                  statusText = 'OK (data)';
                  details.push(
                    'Composition: no hard inv-tag fail (exclusion clash / allowlist mismatch / actionable missing dep). Other inv lines above are FYI.'
                  );
                }
              }
            } else {
              status = 'ok';
              statusText = 'OK (data)';
              details.push(
                bulkAudit
                  ? 'Bulk cheat-audit: composition checks passed (inv-tag chain, weights, elements, NCS slots). Spawn-pathway tables not required for OK in this mode.'
                  : 'Rules passed: NCS/slots, inv-tag chain (if bundle loaded), weight table, elements, preferred parts — and bundled source tables show at least one pathway for this item type (not this exact roll).'
              );
            }
          } else {
            /* Interactive builder parity: low level vs schedule is informational unless strict fail path above triggered. */
            if (status !== 'warn' && status !== 'err') {
              status = 'ok';
              statusText = 'OK (data)';
              details.push('FYI: item level is below LootSchedule MinGameStage (strict mode would mark Fail (data)).');
            }
          }
        } else {
          /* Source tables are incomplete by design; do not mark uncertain from missing source rows alone. */
          if (!bulkAudit && status !== 'warn' && status !== 'err') {
            status = 'ok';
            statusText = 'OK (data)';
            details.push('FYI: no enemy/reward/other source row matched in current source bundle.');
          }
          details.push('No enemy/reward/other row in our source tables for this build');
        }
      }

      /* Optional bulk-only audit was too noisy; keep disabled by default. */

      if (offPoolParts.length > 0) {
        details.push(
          'Loot-pool export (FYI): ' + offPoolParts.length + ' part(s) not flagged on manifest loot-pool list — ' +
          offPoolParts.map(function (x) { return x.display; }).join('; ') +
          ' Note: that flag is only “in our pool export,” not whether the part can come from quests, vendors, rewards, or mail — check Sources below when present.'
        );
      }
      details.push('Parts: ' + partCount + ' / ' + itemSlotMax + ' NCS slots');
      if (sourceEvidence) details.push('Sources: Enemy ' + sourceEvidence.enemy.rows.length + ', Reward ' + sourceEvidence.reward.rows.length + ', Other ' + sourceEvidence.other.rows.length);
      details.push('Stats by idRaw: ' + statsIdRawFound + ' / ' + partCount);
      details.push('Stats known: ' + statsAnyFound + ' / ' + partCount);
      if (statsMissingExamples.length) details.push('Missing stat examples: ' + statsMissingExamples.join(', '));
      details.push('Level range: ' + v.level.min + '\u2013' + v.level.max);
      details.push('Item level: ' + il + ' &middot; LootSchedule max MinGameStage: ' + sched.maxMinStage + (LSCHED ? '' : ' (data missing)'));

      if (bulkAudit && partCount > 0 && status === 'idle') {
        status = 'ok';
        statusText = 'OK (data)';
        details.push('Bulk cheat-audit: internal idle verdict coerced to OK (no err; composition gates cleared).');
      }

      if (status === 'ok' || status === 'warn' || status === 'err') {
        details.push(
          'Spawn claim: This toolbox cannot prove a real-world drop of this exact part mix. Enemy % and Source panels show where this item’s pool/category is referenced in Nexus-derived bundles — not a guarantee the engine rolls this serial.'
        );
      }

      var cls = status === 'ok' ? 'v-ok' : status === 'warn' ? 'v-warn' : status === 'err' ? 'v-err' : 'v-idle';
      var miniLineageHtml = renderValidationSourceMini(sourceEvidence);
      return {
        status: status,
        statusText: statusText,
        details: details,
        className: cls,
        miniLineageHtml: miniLineageHtml,
        sourceEvidence: sourceEvidence,
        statsIdRawFound: statsIdRawFound,
        statsAnyFound: statsAnyFound,
        partCount: partCount,
        itemSlotMax: itemSlotMax,
        sched: sched,
        il: il,
        partSlotDiagnostics: getPartSlotDiagnostics(selectedParts, tagBySlotForDiag, ncsInfo && ncsInfo.ncs_slots),
        offPoolParts: offPoolParts
      };
    }


    window.LegitBuilderApi = {
      computeLegitValidationState: computeLegitValidationState,
      describeOffPoolParts: describeOffPoolParts,
      computeTagCompositionIssues: computeTagCompositionIssues,
      getPartSlotDiagnostics: getPartSlotDiagnostics,
      getAllItems: getAllItems,
      getNcsInfo: getNcsInfo,
      formatPartName: formatPartName
    };
